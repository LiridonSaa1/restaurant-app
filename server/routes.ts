import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema,
  insertMenuItemSchema,
  insertTableSchema,
  insertReservationSchema
} from "@shared/schema";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import * as QRCode from "qrcode";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // User-specific reservations
  app.get("/api/user/reservations", isAuthenticated, async (req, res) => {
    const userId = req.user.id;
    const reservations = await storage.getReservationsByUserId(userId);
    res.json(reservations);
  });

  // Menu Items Routes
  app.get("/api/menu-items", async (_req, res) => {
    const menuItems = await storage.getAllMenuItems();
    res.json(menuItems);
  });

  app.get("/api/menu-items/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const menuItem = await storage.getMenuItem(id);
    
    if (!menuItem) {
      return res.status(404).send("Menu item not found");
    }
    
    res.json(menuItem);
  });

  app.post("/api/menu-items", isAdmin, async (req, res) => {
    try {
      const data = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(data);
      res.status(201).json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.patch("/api/menu-items/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.updateMenuItem(id, data);
      
      if (!menuItem) {
        return res.status(404).send("Menu item not found");
      }
      
      res.json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.delete("/api/menu-items/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMenuItem(id);
    res.status(204).end();
  });

  // Tables Routes
  app.get("/api/tables", async (_req, res) => {
    const tables = await storage.getAllTables();
    res.json(tables);
  });

  app.get("/api/tables/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const table = await storage.getTable(id);
    
    if (!table) {
      return res.status(404).send("Table not found");
    }
    
    res.json(table);
  });

  app.post("/api/tables", isAdmin, async (req, res) => {
    try {
      const data = insertTableSchema.parse(req.body);
      const table = await storage.createTable(data);
      res.status(201).json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.patch("/api/tables/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertTableSchema.parse(req.body);
      const table = await storage.updateTable(id, data);
      
      if (!table) {
        return res.status(404).send("Table not found");
      }
      
      res.json(table);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.delete("/api/tables/:id", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTable(id);
    res.status(204).end();
  });
  
  // QR Code Generation for Tables
  app.get("/api/tables/:id/qrcode", isAdmin, async (req, res) => {
    try {
      const tableId = parseInt(req.params.id);
      const table = await storage.getTable(tableId);
      
      if (!table) {
        return res.status(404).send("Table not found");
      }
      
      // Create reservation URL for this table
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const reservationUrl = `${baseUrl}/reservation?table=${tableId}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(reservationUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 8
      });
      
      res.json({
        table,
        qrCode,
        reservationUrl
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).send('Error generating QR code');
    }
  });
  
  // Generate rating QR code for a table
  app.get("/api/tables/:id/rating-qrcode", isAdmin, async (req, res) => {
    try {
      const tableId = parseInt(req.params.id);
      const table = await storage.getTable(tableId);
      
      if (!table) {
        return res.status(404).send("Table not found");
      }
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const ratingUrl = `${baseUrl}/rating?table=${tableId}`;
      
      const qrCode = await QRCode.toDataURL(ratingUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        scale: 8
      });
      
      res.json({
        table,
        qrCode,
        ratingUrl
      });
    } catch (error) {
      console.error('Error generating rating QR code:', error);
      res.status(500).send('Error generating rating QR code');
    }
  });

  // Generate QR codes for all tables
  app.get("/api/tables/qrcodes/all", isAdmin, async (req, res) => {
    try {
      const tables = await storage.getAllTables();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const tablesWithQRCodes = await Promise.all(tables.map(async (table) => {
        const reservationUrl = `${baseUrl}/reservation?table=${table.id}`;
        const qrCode = await QRCode.toDataURL(reservationUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          scale: 8
        });
        
        return {
          ...table,
          qrCode,
          reservationUrl
        };
      }));
      
      res.json(tablesWithQRCodes);
    } catch (error) {
      console.error('Error generating QR codes:', error);
      res.status(500).send('Error generating QR codes');
    }
  });

  // Reservations Routes
  app.get("/api/reservations", isAdmin, async (_req, res) => {
    const reservations = await storage.getAllReservations();
    res.json(reservations);
  });

  app.get("/api/reservations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const reservation = await storage.getReservation(id);
    
    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }
    
    // Check if the user is admin or the owner of the reservation
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.id !== reservation.userId)) {
      return res.status(403).send("Forbidden: You don't have access to this reservation");
    }
    
    res.json(reservation);
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const data = insertReservationSchema.parse(req.body);
      
      // If user is logged in, associate reservation with user
      let userId = null;
      if (req.isAuthenticated()) {
        userId = req.user.id;
      }
      
      // Check if the requested time slot is available
      const isAvailable = await storage.checkReservationAvailability(
        data.date,
        data.time,
        data.guests
      );
      
      if (!isAvailable) {
        return res.status(400).send("This time slot is not available for the requested party size");
      }
      
      const reservation = await storage.createReservation({
        ...data,
        userId
      });
      
      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.patch("/api/reservations/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the existing reservation
      const existingReservation = await storage.getReservation(id);
      
      if (!existingReservation) {
        return res.status(404).send("Reservation not found");
      }
      
      // Check if the user is admin or the owner of the reservation
      if (req.user.role !== "admin" && req.user.id !== existingReservation.userId) {
        return res.status(403).send("Forbidden: You don't have permission to modify this reservation");
      }
      
      const data = insertReservationSchema.parse(req.body);
      
      // Check if the requested time slot is available (only if date/time/guests changed)
      if (
        data.date !== existingReservation.date ||
        data.time !== existingReservation.time ||
        data.guests !== existingReservation.guests
      ) {
        const isAvailable = await storage.checkReservationAvailability(
          data.date,
          data.time,
          data.guests,
          id // exclude this reservation when checking availability
        );
        
        if (!isAvailable) {
          return res.status(400).send("This time slot is not available for the requested party size");
        }
      }
      
      const reservation = await storage.updateReservation(id, data);
      res.json(reservation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        throw error;
      }
    }
  });

  app.delete("/api/reservations/:id", isAuthenticated, async (req, res) => {
    const id = parseInt(req.params.id);
    
    // Get the existing reservation
    const existingReservation = await storage.getReservation(id);
    
    if (!existingReservation) {
      return res.status(404).send("Reservation not found");
    }
    
    // Check if the user is admin or the owner of the reservation
    if (req.user.role !== "admin" && req.user.id !== existingReservation.userId) {
      return res.status(403).send("Forbidden: You don't have permission to cancel this reservation");
    }
    
    await storage.deleteReservation(id);
    res.status(204).end();
  });

  // Available Times Route
  app.get("/api/available-times", async (req, res) => {
    try {
      const dateStr = req.query.date as string;
      const guests = parseInt(req.query.guests as string || "2");
      
      if (!dateStr) {
        return res.status(400).send("Date is required");
      }
      
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return res.status(400).send("Invalid date format");
      }
      
      // Check if date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isBefore(date, today)) {
        return res.status(400).send("Date must be today or in the future");
      }
      
      // Check if date is within reasonable booking window (e.g., next 60 days)
      const maxBookingDate = addDays(today, 60);
      if (isAfter(date, maxBookingDate)) {
        return res.status(400).send("Reservations can only be made up to 60 days in advance");
      }
      
      const availableTimes = await storage.getAvailableTimes(format(date, "yyyy-MM-dd"), guests);
      res.json(availableTimes);
    } catch (error) {
      res.status(500).send("Error fetching available times");
    }
  });

  // Create initial admin user if it doesn't exist
  try {
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      // Function to hash password is in auth.ts, so we'll create a plain admin user here
      // The password will be hashed by the register endpoint
      await storage.createUser({
        username: "admin",
        password: "admin123", // This will be hashed in the createUser method
        name: "Admin User",
        email: "admin@bistronouveau.com",
        phone: "5551234567",
        role: "admin"
      });
      console.log("Created default admin user: admin/admin123");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
