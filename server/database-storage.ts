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
import connectPg from "connect-pg-simple";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { differenceInMinutes } from "date-fns";
import { db, pool } from "./db";
import { eq, and, ne, gte } from "drizzle-orm";
import { IStorage } from "./storage";

const scryptAsync = promisify(scrypt);

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

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    // Initialize with sample data if tables are empty
    this.initSampleData();
  }
  
  // Initialize sample data
  private async initSampleData() {
    try {
      // Check if tables already exist
      const existingTables = await this.getAllTables();
      if (existingTables.length === 0) {
        console.log("Initializing sample tables...");
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
      }
      
      // Check if menu items already exist
      const existingMenuItems = await this.getAllMenuItems();
      if (existingMenuItems.length === 0) {
        console.log("Initializing sample menu items...");
        await this.initSampleMenuItems();
      }
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }
  
  private async initSampleMenuItems() {
    const sampleMenuItems: InsertMenuItem[] = [
      {
        name: "Truffle Arancini",
        description: "Wild mushroom risotto balls with black truffle and parmesan",
        price: "16",
        category: "starters",
        image: "https://images.unsplash.com/photo-1541014741259-de529411b96a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Seared Scallops",
        description: "Hand-dived scallops with pea purée and crispy pancetta",
        price: "19",
        category: "starters",
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Heirloom Tomato Salad",
        description: "Local tomatoes with buffalo mozzarella, basil oil and aged balsamic",
        price: "14",
        category: "starters",
        image: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian", "gluten-free"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Filet Mignon",
        description: "8oz grass-fed beef with truffle mashed potatoes and red wine jus",
        price: "42",
        category: "mains",
        image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["gluten-free"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Pan-Seared Salmon",
        description: "Wild-caught salmon with asparagus, lemon beurre blanc and herb oil",
        price: "38",
        category: "mains",
        image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["gluten-free"],
        isAvailable: true
      },
      {
        name: "Truffle Risotto",
        description: "Carnaroli rice with porcini mushrooms, black truffle and aged parmesan",
        price: "32",
        category: "mains",
        image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true
      },
      {
        name: "Chocolate Fondant",
        description: "Warm dark chocolate cake with vanilla ice cream and salted caramel",
        price: "14",
        category: "desserts",
        image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian"],
        isAvailable: true,
        featuredItem: true
      },
      {
        name: "Crème Brûlée",
        description: "Classic vanilla bean custard with caramelized sugar crust",
        price: "12",
        category: "desserts",
        image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        dietary: ["vegetarian", "gluten-free"],
        isAvailable: true
      },
      {
        name: "Signature Negroni",
        description: "House-infused gin with Campari, sweet vermouth and orange peel",
        price: "16",
        category: "drinks",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      },
      {
        name: "Premium Wine Selection",
        description: "Curated wines by the glass from our extensive cellar collection",
        price: "14",
        category: "drinks",
        image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        isAvailable: true
      }
    ];
    
    for (const menuItem of sampleMenuItems) {
      await this.createMenuItem(menuItem);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(user.password);
    
    const [newUser] = await db
      .insert(users)
      .values({
        username: user.username,
        password: hashedPassword,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || "customer"
      })
      .returning();
    
    return newUser;
  }

  // Table methods
  async getAllTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db
      .insert(tables)
      .values(table)
      .returning();
    return newTable;
  }

  async updateTable(id: number, table: InsertTable): Promise<Table | undefined> {
    const [updatedTable] = await db
      .update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updatedTable;
  }

  async deleteTable(id: number): Promise<void> {
    await db
      .delete(tables)
      .where(eq(tables.id, id));
  }

  // Menu item methods
  async getAllMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));
    return menuItem;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    const [newMenuItem] = await db
      .insert(menuItems)
      .values({
        ...menuItem,
        isAvailable: menuItem.isAvailable ?? true
      })
      .returning();
    return newMenuItem;
  }

  async updateMenuItem(id: number, menuItem: InsertMenuItem): Promise<MenuItem | undefined> {
    const [updatedMenuItem] = await db
      .update(menuItems)
      .set(menuItem)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db
      .delete(menuItems)
      .where(eq(menuItems.id, id));
  }

  // Reservation methods
  async getAllReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id));
    return reservation;
  }

  async getReservationsByUserId(userId: number): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.userId, userId));
  }

  async createReservation(reservation: InsertReservation & { userId: number | null }): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values(reservation)
      .returning();
    return newReservation;
  }

  async updateReservation(id: number, reservation: InsertReservation): Promise<Reservation | undefined> {
    const existingReservation = await this.getReservation(id);
    if (!existingReservation) {
      return undefined;
    }
    
    const [updatedReservation] = await db
      .update(reservations)
      .set({
        ...reservation,
        userId: existingReservation.userId // Preserve the original userId
      })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<void> {
    await db
      .delete(reservations)
      .where(eq(reservations.id, id));
  }

  async checkReservationAvailability(
    date: string, 
    time: string, 
    guests: number,
    excludeReservationId?: number
  ): Promise<boolean> {
    // Get all tables that can accommodate the party size
    const availableTables = await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.isActive, true),
          gte(tables.capacity, guests)
        )
      );
    
    if (availableTables.length === 0) {
      return false; // No tables can accommodate this party size
    }
    
    // Get all reservations for this date
    const baseQuery = db
      .select()
      .from(reservations)
      .where(eq(reservations.date, date));
    
    // Create separate query based on exclusion condition
    const reservationsOnDate = excludeReservationId
      ? await baseQuery.where(ne(reservations.id, excludeReservationId))
      : await baseQuery;
    
    // Filter reservations that are within 1.5 hours of the requested time
    const filteredReservations = reservationsOnDate.filter(res => {
      const requestedTime = new Date(`2000-01-01T${time}:00`);
      const reservationTime = new Date(`2000-01-01T${res.time}:00`);
      const timeDiffMinutes = Math.abs(differenceInMinutes(requestedTime, reservationTime));
      
      return timeDiffMinutes < 90; // Consider reservations within 1.5 hours
    });
    
    // Count how many tables are occupied at the requested time
    let occupiedTableCount = 0;
    for (const res of filteredReservations) {
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
}