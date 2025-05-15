import { 
  User, 
  InsertUser, 
  Table,
  InsertTable,
  MenuItem,
  InsertMenuItem,
  Reservation,
  InsertReservation
} from "@shared/schema";
import session from "express-session";

// Restaurant opening hours (24h format)
const OPENING_HOUR = 17; // 5 PM
const CLOSING_HOUR = 22; // 10 PM
const TIME_SLOT_MINUTES = 30; // 30 minute intervals

// Define the IStorage interface
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
  sessionStore: session.Store;
}

// Import the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";

// Export a singleton instance of the storage
export const storage = new DatabaseStorage();