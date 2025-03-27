import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertScooterSchema, insertRideSchema, updateRideSchema, insertPaymentSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Helper to check if user is authenticated
function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Scooter routes
  app.get("/api/scooters", async (req, res) => {
    try {
      const scooters = await storage.getScooters();
      res.json(scooters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scooters" });
    }
  });

  app.get("/api/scooters/:id", async (req, res) => {
    try {
      const scooter = await storage.getScooter(Number(req.params.id));
      if (!scooter) {
        return res.status(404).json({ message: "Scooter not found" });
      }
      res.json(scooter);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scooter" });
    }
  });

  app.post("/api/scooters", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertScooterSchema.parse(req.body);
      const scooter = await storage.createScooter(validatedData);
      res.status(201).json(scooter);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create scooter" });
    }
  });

  // Ride routes
  app.get("/api/rides", isAuthenticated, async (req, res) => {
    try {
      const rides = await storage.getRidesForUser(req.user.id);
      res.json(rides);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rides" });
    }
  });

  app.get("/api/rides/active", isAuthenticated, async (req, res) => {
    try {
      const ride = await storage.getActiveRideForUser(req.user.id);
      if (!ride) {
        return res.status(404).json({ message: "No active ride found" });
      }
      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active ride" });
    }
  });

  app.post("/api/rides/start", isAuthenticated, async (req, res) => {
    try {
      // Check if user already has an active ride
      const activeRide = await storage.getActiveRideForUser(req.user.id);
      if (activeRide) {
        return res.status(400).json({ message: "You already have an active ride" });
      }

      // Validate the request body
      const rideData = insertRideSchema.parse({
        ...req.body,
        userId: req.user.id,
        startTime: new Date(),
        status: "active"
      });

      // Get the scooter
      const scooter = await storage.getScooter(rideData.scooterId);
      if (!scooter) {
        return res.status(404).json({ message: "Scooter not found" });
      }

      if (!scooter.isAvailable) {
        return res.status(400).json({ message: "Scooter is not available" });
      }

      // Update scooter availability
      await storage.updateScooter(scooter.id, { isAvailable: false });

      // Create the ride
      const ride = await storage.createRide(rideData);
      
      res.status(201).json(ride);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to start ride" });
    }
  });

  app.post("/api/rides/:id/end", isAuthenticated, async (req, res) => {
    try {
      const rideId = Number(req.params.id);
      const ride = await storage.getRide(rideId);
      
      if (!ride) {
        return res.status(404).json({ message: "Ride not found" });
      }
      
      if (ride.userId !== req.user.id) {
        return res.status(403).json({ message: "Not your ride" });
      }
      
      if (ride.status !== "active") {
        return res.status(400).json({ message: "Ride is not active" });
      }

      // Calculate ride details
      const endTime = new Date();
      const durationMs = endTime.getTime() - new Date(ride.startTime).getTime();
      const durationMinutes = durationMs / (1000 * 60);
      
      // Calculate mock distance based on duration (in km)
      const distance = durationMinutes * 0.1;
      
      // Calculate cost: $1 base + $0.15 per minute
      const baseFee = 1.0;
      const minuteFee = 0.15;
      const cost = baseFee + (durationMinutes * minuteFee);
      
      // Update ride with end details
      const updateData = updateRideSchema.parse({
        endTime,
        endLatitude: req.body.endLatitude,
        endLongitude: req.body.endLongitude,
        distance,
        cost,
        status: "completed"
      });
      
      const updatedRide = await storage.updateRide(rideId, updateData);
      
      // Make the scooter available again
      await storage.updateScooter(ride.scooterId, { isAvailable: true });
      
      // Create payment record
      const payment = await storage.createPayment({
        userId: req.user.id,
        rideId: ride.id,
        amount: cost,
        timestamp: new Date(),
        status: "success"
      });
      
      // Deduct balance from user account
      await storage.updateUserBalance(req.user.id, -cost);
      
      res.json({ ride: updatedRide, payment });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to end ride" });
    }
  });

  // Payment routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPaymentsForUser(req.user.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get payments" });
    }
  });

  app.post("/api/payments/add-balance", isAuthenticated, async (req, res) => {
    try {
      // In a real app, this would connect to a payment processor
      const amount = Number(req.body.amount);
      
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      const updatedUser = await storage.updateUserBalance(req.user.id, amount);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to add balance" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
