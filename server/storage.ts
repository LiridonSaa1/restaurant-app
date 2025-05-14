import { 
  users, 
  User, 
  InsertUser, 
  tables,
  Table,
  InsertTable,
  menuItems,
  MenuItem,
  InsertMenuItem,
  reservations,
  Reservation,
  InsertReservation
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { isSameDay, parseISO, differenceInMinutes } from "date-fns";

const scryptAsync = promisify(scrypt);
const MemoryStore = createMemoryStore(session);

// Restaurant opening hours (24h format)
const OPENING_HOUR = 17; // 5 PM
const CLOSING_HOUR = 22; // 10 PM
const TIME_SLOT_MINUTES = 30; // 30 minute intervals

// Generate time slots based on restaurant hours
function generateTimeSlots() {
  const slots = [];
  for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

// Default time slots
const DEFAULT_TIME_SLOTS = generateTimeSlots();

// Helper function to hash passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Table methods
  getAllTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: InsertTable): Promise<Table | undefined>;
  deleteTable(id: number): Promise<void>;
  
  // Menu item methods
  getAllMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: InsertMenuItem): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<void>;
  
  // Reservation methods
  getAllReservations(): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  getReservationsByUserId(userId: number): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation & { userId: number | null }): Promise<Reservation>;
  updateReservation(id: number, reservation: InsertReservation): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<void>;
  checkReservationAvailability(date: string, time: string, guests: number, excludeReservationId?: number): Promise<boolean>;
  getAvailableTimes(date: string, partySize: number): Promise<string[]>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tables: Map<number, Table>;
  private menuItems: Map<number, MenuItem>;
  private reservations: Map<number, Reservation>;
  currentUserId: number;
  currentTableId: number;
  currentMenuItemId: number;
  currentReservationId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tables = new Map();
    this.menuItems = new Map();
    this.reservations = new Map();
    this.currentUserId = 1;
    this.currentTableId = 1;
    this.currentMenuItemId = 1;
    this.currentReservationId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const hashedPassword = await hashPassword(insertUser.password);
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword,
      role: insertUser.role || "customer" 
    };
    this.users.set(id, user);
    
    // Create a sanitized user object without the password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  // Table methods
  async getAllTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async createTable(table: InsertTable): Promise<Table> {
    const id = this.currentTableId++;
    const newTable: Table = { ...table, id };
    this.tables.set(id, newTable);
    return newTable;
  }

  async updateTable(id: number, table: InsertTable): Promise<Table | undefined> {
    const existingTable = this.tables.get(id);
    if (!existingTable) {
      return undefined;
    }
    
    const updatedTable: Table = { ...table, id };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: number): Promise<void> {
    this.tables.delete(id);
  }

  // Menu item methods
  async getAllMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentMenuItemId++;
    const newMenuItem: MenuItem = { 
      ...menuItem, 
      id,
      isAvailable: menuItem.isAvailable ?? true
    };
    this.menuItems.set(id, newMenuItem);
    return newMenuItem;
  }

  async updateMenuItem(id: number, menuItem: InsertMenuItem): Promise<MenuItem | undefined> {
    const existingMenuItem = this.menuItems.get(id);
    if (!existingMenuItem) {
      return undefined;
    }
    
    const updatedMenuItem: MenuItem = { ...menuItem, id };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<void> {
    this.menuItems.delete(id);
  }

  // Reservation methods
  async getAllReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values());
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async getReservationsByUserId(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (reservation) => reservation.userId === userId
    );
  }

  async createReservation(reservation: InsertReservation & { userId: number | null }): Promise<Reservation> {
    const id = this.currentReservationId++;
    const newReservation: Reservation = { ...reservation, id };
    this.reservations.set(id, newReservation);
    return newReservation;
  }

  async updateReservation(id: number, reservation: InsertReservation): Promise<Reservation | undefined> {
    const existingReservation = this.reservations.get(id);
    if (!existingReservation) {
      return undefined;
    }
    
    const updatedReservation: Reservation = { 
      ...reservation, 
      id,
      userId: existingReservation.userId // Preserve the original userId
    };
    this.reservations.set(id, updatedReservation);
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<void> {
    this.reservations.delete(id);
  }

  async checkReservationAvailability(
    date: string, 
    time: string, 
    guests: number,
    excludeReservationId?: number
  ): Promise<boolean> {
    // Get all tables that can accommodate the party size
    const availableTables = Array.from(this.tables.values()).filter(
      table => table.isActive && table.capacity >= guests
    );
    
    if (availableTables.length === 0) {
      return false; // No tables can accommodate this party size
    }
    
    // Get all reservations for this date and around this time (within 1.5 hours)
    const reservationsOnDate = Array.from(this.reservations.values()).filter(res => {
      if (res.id === excludeReservationId) return false;
      
      if (res.date !== date) return false;
      
      // Check if the reservation time is within 1.5 hours
      const requestedTime = new Date(`2000-01-01T${time}:00`);
      const reservationTime = new Date(`2000-01-01T${res.time}:00`);
      const timeDiffMinutes = Math.abs(differenceInMinutes(requestedTime, reservationTime));
      
      return timeDiffMinutes < 90; // Consider reservations within 1.5 hours
    });
    
    // Count how many tables are occupied at the requested time
    let occupiedTableCount = 0;
    for (const res of reservationsOnDate) {
      // Find smallest table that can fit this reservation
      const tablesForThisRes = availableTables.filter(table => table.capacity >= res.guests);
      if (tablesForThisRes.length > 0) {
        occupiedTableCount++;
      }
    }
    
    // If there are more available tables than occupied tables, the time is available
    return availableTables.length > occupiedTableCount;
  }

  async getAvailableTimes(date: string, partySize: number): Promise<string[]> {
    const availableTimes: string[] = [];
    
    // Check each time slot for availability
    for (const timeSlot of DEFAULT_TIME_SLOTS) {
      const isAvailable = await this.checkReservationAvailability(date, timeSlot, partySize);
      if (isAvailable) {
        availableTimes.push(timeSlot);
      }
    }
    
    return availableTimes;
  }

  // Initialize with sample data
  private async initSampleData() {
    // Sample tables
    const sampleTables: InsertTable[] = [
      { name: "Table 1", capacity: 2, location: "Main", isActive: true },
      { name: "Table 2", capacity: 2, location: "Main", isActive: true },
      { name: "Table 3", capacity: 4, location: "Main", isActive: true },
      { name: "Table 4", capacity: 4, location: "Main", isActive: true },
      { name: "Table 5", capacity: 6, location: "Main", isActive: true },
      { name: "Table 6", capacity: 8, location: "Main", isActive: true },
      { name: "Patio 1", capacity: 2, location: "Outdoor", isActive: true },
      { name: "Patio 2", capacity: 4, location: "Outdoor", isActive: true },
      { name: "Private Room", capacity: 12, location: "Private", isActive: true },
    ];
    
    for (const table of sampleTables) {
      await this.createTable(table);
    }
    
    // Sample menu items
    const sampleMenuItems: InsertMenuItem[] = [
      {
        name: "Truffle Arancini",
        description: "Wild mushroom risotto balls with black truffle and parmesan",
        price: 16,
        category: "starters",
        image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Seared Scallops",
        description: "Hand-dived scallops with pea purée and crispy pancetta",
        price: 19,
        category: "starters",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Heirloom Tomato Salad",
        description: "Local tomatoes with buffalo mozzarella, basil oil and aged balsamic",
        price: 14,
        category: "starters",
        image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian", "gluten-free"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Beef Tartare",
        description: "Hand-cut prime beef with capers, shallots, egg yolk and toasted sourdough",
        price: 18,
        category: "starters",
        image: "https://images.unsplash.com/photo-1626082929543-5bfd2d1df0c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Filet Mignon",
        description: "8oz grass-fed beef with truffle mashed potatoes and red wine jus",
        price: 42,
        category: "mains",
        image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["gluten-free"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Pan-Seared Salmon",
        description: "Wild-caught salmon with asparagus, lemon beurre blanc and herb oil",
        price: 38,
        category: "mains",
        image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["gluten-free"],
        isAvailable: true
      },
      {
        name: "Truffle Risotto",
        description: "Carnaroli rice with porcini mushrooms, black truffle and aged parmesan",
        price: 32,
        category: "mains",
        image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Duck Breast",
        description: "Maple-glazed duck with celeriac purée, roasted figs and port reduction",
        price: 36,
        category: "mains",
        image: "https://images.unsplash.com/photo-1580554530778-2486b36a3efd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Chocolate Fondant",
        description: "Warm dark chocolate cake with vanilla ice cream and salted caramel",
        price: 14,
        category: "desserts",
        image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Crème Brûlée",
        description: "Classic vanilla bean custard with caramelized sugar crust",
        price: 12,
        category: "desserts",
        image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian", "gluten-free"],
        isAvailable: true
      },
      {
        name: "Berry Tart",
        description: "Seasonal berries, pastry cream and shortbread crust with mint",
        price: 13,
        category: "desserts",
        image: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Tiramisu",
        description: "Espresso-soaked ladyfingers with mascarpone cream and cocoa",
        price: 11,
        category: "desserts",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Signature Negroni",
        description: "House-infused gin with Campari, sweet vermouth and orange peel",
        price: 16,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Premium Wine Selection",
        description: "Curated wines by the glass from our extensive cellar collection",
        price: 14,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Handcrafted Mocktails",
        description: "Seasonal non-alcoholic beverages with fresh fruits and herbs",
        price: 12,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian", "vegan", "gluten-free"],
        isAvailable: true
      },
      {
        name: "Artisanal Coffee",
        description: "Locally roasted specialty beans with your choice of preparation",
        price: 6,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      }
    ];
    
    for (const menuItem of sampleMenuItems) {
      await this.createMenuItem(menuItem);
    }
  }
}

export const storage = new MemStorage();
