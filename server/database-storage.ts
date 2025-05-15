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
    
    const insertData = {
      username: user.username,
      password: hashedPassword,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || "customer"
    };
    
    const [newUser] = await db
      .insert(users)
      .values(insertData)
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