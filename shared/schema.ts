import { pgTable, text, serial, integer, boolean, date, time, decimal, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull(),
  rating: integer("rating").notNull(),
  feedback: text("feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").default("customer").$type<"admin" | "customer">()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
  location: text("location").notNull(),
  isActive: boolean("is_active").default(true)
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true
});

export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tables.$inferSelect;

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().$type<number>(),
  category: text("category").notNull(),
  image: text("image"),
  dietary: text("dietary").array(),
  isAvailable: boolean("is_available").default(true),
  featuredItem: boolean("featured_item").default(false)
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({
  id: true
});

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

// Reservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format (24h)
  guests: integer("guests").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  specialRequests: text("special_requests"),
  userId: integer("user_id").references(() => users.id)
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  userId: true
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Reservation Status (for future use)
export const reservationStatuses = pgTable("reservation_statuses", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull().references(() => reservations.id),
  status: text("status").notNull().$type<"confirmed" | "cancelled" | "completed" | "no-show">(),
  timestamp: text("timestamp").notNull(),
  notes: text("notes")
});

export const insertReservationStatusSchema = createInsertSchema(reservationStatuses).omit({
  id: true
});

export type InsertReservationStatus = z.infer<typeof insertReservationStatusSchema>;
export type ReservationStatus = typeof reservationStatuses.$inferSelect;