import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { 
  insertScooterSchema, insertRideSchema, updateRideSchema, 
  insertPaymentSchema, updateUserSchema, changePasswordSchema,
  verifyEmailSchema, verifyPhoneSchema, requestVerificationSchema,
  phoneLoginSchema, phoneVerificationCodeSchema, User
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { getGoogleAuthUrl, handleGoogleCallback } from "./google-auth";
import { scrypt, timingSafeEqual, randomBytes } from "crypto";
import { promisify } from "util";
import {
  generateEmailVerification,
  generatePhoneVerification,
  sendEmailVerification,
  sendSmsVerification,
  markEmailAsVerified,
  markPhoneAsVerified,
  verificationCodes,
  generateVerificationCode,
  getVerificationExpiry
} from "./verification";

// Helper to check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user) {
    // User is authenticated and req.user exists
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}

// TypeScript interface augmentation to make req.user accessible with correct typing
declare global {
  namespace Express {
    // This properly types req.user as our User type from the schema
    interface User extends User {}
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Direct Google OAuth routes - now with dynamic redirect URI support
  app.get("/api/auth/google/url", (req, res) => {
    try {
      console.log("Generating Google OAuth URL for host:", req.headers.host);
      // Pass the request object to get the appropriate redirect URI
      const url = getGoogleAuthUrl(req);
      console.log("Generated URL:", url.substring(0, 60) + "..." + "(truncated)");
      res.json({ url });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate Google authentication URL" });
    }
  });
  
  // Google OAuth callback handler
  app.get("/api/auth/google/callback", handleGoogleCallback);
  
  // Phone authentication routes
  app.post("/api/auth/phone/login", async (req, res) => {
    try {
      const validatedData = phoneLoginSchema.parse(req.body);
      let { phoneNumber } = validatedData;
      
      // Format the phone number for Twilio (E.164 format)
      phoneNumber = phoneNumber.trim();
      
      // Convert to E.164 format
      // Remove any non-digits except the + sign
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      // If it doesn't start with +, assume it needs formatting
      if (!phoneNumber.startsWith('+')) {
        // If it starts with 00 (international prefix), replace with +
        if (phoneNumber.startsWith('00')) {
          phoneNumber = '+' + phoneNumber.substring(2);
        } 
        // If it starts with 354 (Iceland country code without +), add +
        else if (phoneNumber.startsWith('354')) {
          phoneNumber = '+' + phoneNumber;
        }
        // Otherwise assume it's an Iceland number missing the country code
        else {
          phoneNumber = '+354' + phoneNumber;
        }
      }
      
      console.log(`Formatted phone number for verification: ${phoneNumber}`);
      
      // Generate a 6-digit verification code
      const code = generateVerificationCode();
      const expiry = getVerificationExpiry();
      
      // Store the code for this phone number
      verificationCodes.set(phoneNumber, code);
      
      // Send SMS with the code using Twilio
      console.log(`Sending verification code ${code} to ${phoneNumber}`);
      const sent = await sendSmsVerification(phoneNumber, code);
      
      if (sent) {
        res.status(200).json({ message: "Verification code sent" });
      } else {
        res.status(500).json({ message: "Failed to send verification code" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error in phone login:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });
  
  app.post("/api/auth/phone/verify", async (req, res) => {
    try {
      const validatedData = phoneVerificationCodeSchema.parse(req.body);
      const { phoneNumber, code } = validatedData;
      
      // Verify the code
      const storedCode = verificationCodes.get(phoneNumber);
      
      if (!storedCode || storedCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Check if user exists with this phone number
      let user = await storage.getUserByPhone(phoneNumber);
      
      // If not, create a new user
      if (!user) {
        // Generate a username based on the phone number (removing special characters)
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const username = `user_${cleanPhone}`;
        
        // Generate a random full name for the new user (this would be collected in production)
        const fullName = `User ${cleanPhone.substring(cleanPhone.length - 4)}`;
        
        user = await storage.createUser({
          username,
          email: `${username}@example.com`, // Placeholder email
          phoneNumber,
          fullName,
          password: null, // No password for OAuth users
          providerId: 'phone',
          providerAccountId: phoneNumber,
          isPhoneVerified: true
        });
      } else {
        // Update existing user as verified
        user = await storage.updateUser(user.id, { 
          isPhoneVerified: true,
          providerId: 'phone',
          providerAccountId: phoneNumber
        });
      }
      
      // Remove the verification code
      verificationCodes.delete(phoneNumber);
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after verification" });
        }
        res.status(200).json(user);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Phone verification error:", error);
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });
  
  // TESTING ONLY: Endpoint to get verification code for a specific email or phone
  // WARNING: This should ONLY be used for testing and removed in production
  // This endpoint is always available since we're in development
  app.get("/api/testing/verification-code", async (req, res) => {
    try {
      const { contact } = req.query;
      console.log('Testing endpoint called with contact:', contact);
      
      if (!contact) {
        return res.status(400).json({ message: "Contact (email or phone) is required" });
      }
      
      // Import the verification module directly
      const { getStoredVerificationCode } = await import('./verification');
      
      // Log verification codes for debugging
      const verification = await import('./verification');
      console.log('Verification module imported');
      
      // Get the code for this contact
      const code = getStoredVerificationCode(contact as string);
      console.log(`Code for ${contact}:`, code);
      
      if (!code) {
        return res.status(404).json({ 
          message: "No verification code found for this contact", 
          contact 
        });
      }
      
      res.json({ contact, code });
    } catch (error) {
      console.error('Error in verification code testing endpoint:', error);
      res.status(500).json({ message: "Failed to get verification code" });
    }
  });

  // Scooter routes
  app.get("/api/scooters", async (req, res) => {
    try {
      const scooters = await storage.getScooters();
      res.json(scooters);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scooters" });
    }
  });
  
  // Special route to add scooters to Kársnes (temporary for distribution)
  app.post("/api/karsnes-scooters", async (req, res) => {
    try {
      // Kársnes land-only locations (carefully selected street coordinates)
      const karsnesStreets = [
        { latitude: 64.1128, longitude: -21.9361 },  // Kársnesbraut
        { latitude: 64.1123, longitude: -21.9355 },  // Northern residential area
        { latitude: 64.1116, longitude: -21.9340 },  // Central street
        { latitude: 64.1109, longitude: -21.9322 },  // School area
        { latitude: 64.1105, longitude: -21.9298 },  // Eastern part
        { latitude: 64.1100, longitude: -21.9318 },  // Residential area
        { latitude: 64.1124, longitude: -21.9335 },  // Main road intersection
        { latitude: 64.1118, longitude: -21.9344 },  // Bus stop
        { latitude: 64.1115, longitude: -21.9325 },  // Shopping area
        { latitude: 64.1107, longitude: -21.9360 }   // Western point
      ];
      
      const numScooters = 25; // Add 25 scooters to Kársnes
      const addedScooters = [];
      
      for (let i = 0; i < numScooters; i++) {
        // Choose a random street location from the Kársnes streets array
        const streetLocation = karsnesStreets[Math.floor(Math.random() * karsnesStreets.length)];
        
        // Add a small offset to avoid all scooters being exactly at the same spot
        // Keeping the offset small (~25 meters max) to ensure they stay on streets
        const latOffset = (Math.random() - 0.5) * 0.0004;
        const lngOffset = (Math.random() - 0.5) * 0.0004;
        
        const latitude = streetLocation.latitude + latOffset;
        const longitude = streetLocation.longitude + lngOffset;
        
        // Generate a random battery level (20-100%)
        const batteryLevel = Math.floor(Math.random() * 81) + 20;
        
        // Generate scooter ID (letter + 3 digits)
        const letter = String.fromCharCode(75); // Letter 'K' for Kársnes
        const number = String(Math.floor(Math.random() * 1000)).padStart(3, '0'); // 000-999
        const scooterId = `${letter}${number}`;
        
        // Create scooter
        const scooter = await storage.createScooter({
          scooterId,
          batteryLevel,
          isAvailable: true,
          latitude,
          longitude
        });
        
        addedScooters.push(scooter);
      }
      
      res.status(201).json({ 
        message: `Successfully added ${numScooters} scooters to Kársnes streets`,
        scooters: addedScooters
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add Kársnes scooters" });
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

  // User profile routes
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });
  
  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Profile image can be uploaded separately (would use multipart/form-data in a real app)
  app.post("/api/profile/picture", isAuthenticated, async (req, res) => {
    try {
      const { profilePictureUrl } = req.body;
      
      if (!profilePictureUrl) {
        return res.status(400).json({ message: "Profile picture URL is required" });
      }
      
      const updatedUser = await storage.updateUser(req.user.id, { 
        profilePicture: profilePictureUrl 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });
  
  // Change password
  const scryptAsync = promisify(scrypt);
  
  app.post("/api/profile/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = 
        changePasswordSchema.parse(req.body);
      
      // Get user with current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password (similar to auth.ts implementation)
      const [hashed, salt] = user.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
      const passwordsMatch = timingSafeEqual(hashedBuf, suppliedBuf);
      
      if (!passwordsMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const newSalt = randomBytes(16).toString("hex");
      const newHashedBuf = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      const newHashedPassword = `${newHashedBuf.toString("hex")}.${newSalt}`;
      
      // Update the password
      const updatedUser = await storage.updateUserPassword(req.user.id, newHashedPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to change password" });
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

  // Verification routes
  // Request verification code
  app.post("/api/verification/request", isAuthenticated, async (req, res) => {
    try {
      const { method } = requestVerificationSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (method === "email") {
        // Check if email already verified
        if (user.isEmailVerified) {
          return res.status(400).json({ message: "Email is already verified" });
        }
        
        // Generate and store verification code
        const code = await generateEmailVerification(user.id);
        
        // Send email with verification code
        const emailSent = await sendEmailVerification(user.email, code);
        
        if (!emailSent) {
          return res.status(500).json({ message: "Failed to send verification email" });
        }
        
        res.json({ message: "Verification code sent to your email" });
      } else if (method === "phone") {
        // Check if phone number exists
        if (!user.phoneNumber) {
          return res.status(400).json({ message: "No phone number associated with your account" });
        }
        
        // Check if phone already verified
        if (user.isPhoneVerified) {
          return res.status(400).json({ message: "Phone number is already verified" });
        }
        
        // Generate and store verification code
        const code = await generatePhoneVerification(user.id);
        
        // Send SMS with verification code
        const smsSent = await sendSmsVerification(user.phoneNumber, code);
        
        if (!smsSent) {
          return res.status(500).json({ message: "Failed to send verification SMS" });
        }
        
        res.json({ message: "Verification code sent to your phone" });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to request verification code" });
    }
  });
  
  // Verify email
  app.post("/api/verification/email", isAuthenticated, async (req, res) => {
    try {
      const { code } = verifyEmailSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already verified
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      
      // Verify code
      const isVerified = await storage.verifyUserEmail(user.id, code);
      
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  
  // Verify phone
  app.post("/api/verification/phone", isAuthenticated, async (req, res) => {
    try {
      const { code } = verifyPhoneSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if phone exists
      if (!user.phoneNumber) {
        return res.status(400).json({ message: "No phone number associated with your account" });
      }
      
      // Check if already verified
      if (user.isPhoneVerified) {
        return res.status(400).json({ message: "Phone is already verified" });
      }
      
      // Verify code
      const isVerified = await storage.verifyUserPhone(user.id, code);
      
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      
      res.json({ message: "Phone verified successfully" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });
  
  // Get verification status
  app.get("/api/verification/status", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        email: {
          address: user.email,
          verified: user.isEmailVerified
        },
        phone: {
          number: user.phoneNumber,
          verified: user.phoneNumber ? user.isPhoneVerified : null
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get verification status" });
    }
  });
  
  // DEVELOPMENT ONLY: Get verification codes for testing
  app.get("/api/verification/test/codes", async (req, res) => {
    // This endpoint is for development purposes only
    // In production, this would be disabled or protected
    try {
      // Type assertion to ensure TypeScript knows the structure
      const codes = Array.from(verificationCodes.entries()) as [string, string][];
      res.json({
        message: "DEVELOPMENT ONLY: Active verification codes",
        codes: codes.map(([contact, code]) => ({
          contact,
          code
        }))
      });
    } catch (error) {
      console.error("Error in verification test codes endpoint:", error);
      res.status(500).json({ message: "Failed to get verification codes" });
    }
  });

  // Create HTTP server
  // Add Firebase authentication route
  app.post("/api/auth/firebase/google", async (req, res) => {
    try {
      console.log("Firebase Google auth endpoint called with body:", {
        ...req.body,
        token: req.body.token ? "PRESENT" : "MISSING" // Don't log the token
      });
      
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!email) {
        console.error("Firebase auth failed: Email is required but was missing");
        return res.status(400).json({ message: "Email is required" });
      }
      
      console.log(`Looking up user with Firebase ID: ${uid}`);
      // Check if user already exists with this Google ID
      let user = await storage.getUserByProviderId("firebase", uid);
      
      if (!user) {
        // Create new user
        const username = `${(displayName || email.split('@')[0]).toLowerCase().replace(/\s+/g, '_')}_${Math.floor(Math.random() * 1000)}`;
        
        user = await storage.createUser({
          username,
          email,
          fullName: displayName || username,
          password: null, // No password for OAuth users
          profilePicture: photoURL || null,
          providerId: "firebase",
          providerAccountId: uid,
          isEmailVerified: true // Email is verified through Google
        });
      }
      
      // Log the user in
      console.log("Attempting to login user:", { 
        userId: user.id, 
        username: user.username, 
        email: user.email 
      });
      
      req.login(user, (err) => {
        if (err) {
          console.error("Login failed in req.login:", err);
          return res.status(500).json({ message: "Login failed", error: err.message });
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        console.log("Firebase authentication successful, returning user data");
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: "Authentication failed", error: error.message });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
