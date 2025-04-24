var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storage.ts
import session from "express-session";
import createMemoryStore from "memorystore";
var MemoryStore, MemStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemoryStore = createMemoryStore(session);
    MemStorage = class {
      users;
      scooters;
      rides;
      payments;
      userIdCounter;
      scooterIdCounter;
      rideIdCounter;
      paymentIdCounter;
      sessionStore;
      // Using any type to avoid TypeScript error
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.scooters = /* @__PURE__ */ new Map();
        this.rides = /* @__PURE__ */ new Map();
        this.payments = /* @__PURE__ */ new Map();
        this.userIdCounter = 1;
        this.scooterIdCounter = 1;
        this.rideIdCounter = 1;
        this.paymentIdCounter = 1;
        this.sessionStore = new MemoryStore({
          checkPeriod: 864e5
        });
        this.initializeScooters();
      }
      initializeScooters() {
        const reykjavikCenter = {
          latitude: 64.1466,
          longitude: -21.9426
        };
        const streets = [
          // Central Reykjavik (land-only)
          { name: "Downtown", street_points: [
            { latitude: 64.1466, longitude: -21.9426 },
            // City center
            { latitude: 64.1475, longitude: -21.941 },
            // Austurstræti
            { latitude: 64.148, longitude: -21.939 },
            // Lækjargata
            { latitude: 64.1472, longitude: -21.937 }
            // Bankastræti
          ] },
          { name: "Hallgr\xEDmskirkja", street_points: [
            { latitude: 64.1418, longitude: -21.9267 },
            // Skólavörðustígur
            { latitude: 64.1426, longitude: -21.9272 },
            // Frakkastígur
            { latitude: 64.1432, longitude: -21.9262 }
            // Bergstaðastræti
          ] },
          { name: "Laugavegur", street_points: [
            { latitude: 64.1429, longitude: -21.9268 },
            // Main street
            { latitude: 64.1425, longitude: -21.924 },
            // East end
            { latitude: 64.1435, longitude: -21.92 }
            // Hlemmur area
          ] },
          // Kópavogur (land-only coordinates)
          { name: "K\xF3pavogur", street_points: [
            { latitude: 64.1031, longitude: -21.9026 },
            // Main road
            { latitude: 64.1045, longitude: -21.9038 },
            // Residential area
            { latitude: 64.1025, longitude: -21.905 }
            // Shopping district
          ] },
          { name: "K\xF3pavogur Mall", street_points: [
            { latitude: 64.1012, longitude: -21.8897 },
            { latitude: 64.1018, longitude: -21.8905 },
            { latitude: 64.1008, longitude: -21.889 }
          ] },
          // Kársnes (carefully chosen land-only coordinates)
          { name: "K\xE1rsnes", street_points: [
            { latitude: 64.1128, longitude: -21.9361 },
            // Kársnesbraut
            { latitude: 64.1123, longitude: -21.9355 },
            // Northern residential area
            { latitude: 64.1116, longitude: -21.934 },
            // Central street
            { latitude: 64.1109, longitude: -21.9322 },
            // School area
            { latitude: 64.1105, longitude: -21.928 }
            // Eastern part
          ] },
          // Árbær (land-only)
          { name: "\xC1rb\xE6r", street_points: [
            { latitude: 64.1156, longitude: -21.8003 },
            { latitude: 64.1164, longitude: -21.8012 },
            { latitude: 64.115, longitude: -21.7995 }
          ] },
          // Grafarvogur (land-only)
          { name: "Grafarvogur", street_points: [
            { latitude: 64.1361, longitude: -21.7785 },
            { latitude: 64.137, longitude: -21.7795 },
            { latitude: 64.1355, longitude: -21.7775 }
          ] },
          // Laugadalur (land-only)
          { name: "Laugadalur", street_points: [
            { latitude: 64.1399, longitude: -21.8733 },
            { latitude: 64.1405, longitude: -21.874 },
            { latitude: 64.1392, longitude: -21.872 }
          ] },
          // Laugardalur Park (land-only)
          { name: "Laugardalur Park", street_points: [
            { latitude: 64.1384, longitude: -21.8857 },
            { latitude: 64.139, longitude: -21.8865 },
            { latitude: 64.1378, longitude: -21.885 }
          ] },
          // Breiðholt (land-only)
          { name: "Brei\xF0holt", street_points: [
            { latitude: 64.1038, longitude: -21.833 },
            { latitude: 64.1045, longitude: -21.834 },
            { latitude: 64.103, longitude: -21.832 }
          ] },
          // Add more carefully placed street points to cover the Greater Reykjavik area
          { name: "Kringlan Mall", street_points: [
            { latitude: 64.1295, longitude: -21.8877 },
            { latitude: 64.13, longitude: -21.8885 },
            { latitude: 64.129, longitude: -21.887 }
          ] }
        ];
        const scooters2 = [];
        for (let i = 1; i <= 250; i++) {
          const area = streets[Math.floor(Math.random() * streets.length)];
          const streetPoint = area.street_points[Math.floor(Math.random() * area.street_points.length)];
          const latOffset = (Math.random() - 0.5) * 8e-4;
          const lngOffset = (Math.random() - 0.5) * 8e-4;
          const latitude = streetPoint.latitude + latOffset;
          const longitude = streetPoint.longitude + lngOffset;
          const batteryLevel = Math.floor(Math.random() * 81) + 20;
          const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const number = String(Math.floor(Math.random() * 1e3)).padStart(3, "0");
          const scooterId = `${letter}${number}`;
          scooters2.push({
            scooterId,
            batteryLevel,
            isAvailable: true,
            latitude,
            longitude
          });
        }
        for (const scooter of scooters2) {
          this.createScooter(scooter);
        }
      }
      // User methods
      async getUser(id) {
        return this.users.get(id);
      }
      async getUserByUsername(username) {
        return Array.from(this.users.values()).find(
          (user) => user.username === username
        );
      }
      async getUserByEmail(email) {
        return Array.from(this.users.values()).find(
          (user) => user.email === email
        );
      }
      async getUserByPhone(phoneNumber) {
        return Array.from(this.users.values()).find(
          (user) => user.phoneNumber === phoneNumber
        );
      }
      async getUserByProviderId(providerId, providerAccountId) {
        return Array.from(this.users.values()).find(
          (user) => user.providerId === providerId && user.providerAccountId === providerAccountId
        );
      }
      async createUser(user) {
        const id = this.userIdCounter++;
        const newUser = {
          ...user,
          id,
          password: user.password || null,
          phoneNumber: user.phoneNumber || null,
          profilePicture: user.profilePicture || null,
          balance: user.balance || 0,
          // Ensure balance is never undefined
          createdAt: /* @__PURE__ */ new Date(),
          // Add the createdAt timestamp
          // Add verification fields
          isEmailVerified: user.providerId === "google" || user.providerId === "apple" || false,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
          isPhoneVerified: user.providerId === "phone" || false,
          phoneVerificationCode: null,
          phoneVerificationExpiry: null,
          // OAuth related fields
          providerId: user.providerId || null,
          providerAccountId: user.providerAccountId || null
        };
        this.users.set(id, newUser);
        return newUser;
      }
      async updateUser(userId, updates) {
        const user = await this.getUser(userId);
        if (!user) return void 0;
        const { id, password, balance, ...allowedUpdates } = updates;
        const updatedUser = {
          ...user,
          ...allowedUpdates
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
      }
      async updateUserBalance(userId, amount) {
        const user = await this.getUser(userId);
        if (!user) return void 0;
        const updatedUser = {
          ...user,
          balance: user.balance + amount
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
      }
      async updateUserPassword(userId, newPassword) {
        const user = await this.getUser(userId);
        if (!user) return void 0;
        const updatedUser = {
          ...user,
          password: newPassword
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
      }
      // Verification methods
      async verifyUserEmail(userId, code) {
        const user = await this.getUser(userId);
        if (!user) return false;
        if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
          return false;
        }
        if (user.emailVerificationCode === code && /* @__PURE__ */ new Date() < new Date(user.emailVerificationExpiry)) {
          await this.updateUser(userId, {
            isEmailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpiry: null
          });
          return true;
        }
        return false;
      }
      async verifyUserPhone(userId, code) {
        const user = await this.getUser(userId);
        if (!user) return false;
        if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
          return false;
        }
        if (user.phoneVerificationCode === code && /* @__PURE__ */ new Date() < new Date(user.phoneVerificationExpiry)) {
          await this.updateUser(userId, {
            isPhoneVerified: true,
            phoneVerificationCode: null,
            phoneVerificationExpiry: null
          });
          return true;
        }
        return false;
      }
      // Scooter methods
      async getScooters() {
        return Array.from(this.scooters.values());
      }
      async getScooter(id) {
        return this.scooters.get(id);
      }
      async getScooterByScooterId(scooterId) {
        return Array.from(this.scooters.values()).find(
          (scooter) => scooter.scooterId === scooterId
        );
      }
      async createScooter(scooter) {
        const id = this.scooterIdCounter++;
        const newScooter = {
          ...scooter,
          id,
          isAvailable: scooter.isAvailable !== void 0 ? scooter.isAvailable : true
          // Ensure isAvailable is never undefined
        };
        this.scooters.set(id, newScooter);
        return newScooter;
      }
      async updateScooter(id, updates) {
        const scooter = await this.getScooter(id);
        if (!scooter) return void 0;
        const updatedScooter = { ...scooter, ...updates };
        this.scooters.set(id, updatedScooter);
        return updatedScooter;
      }
      // Ride methods
      async getRides() {
        return Array.from(this.rides.values());
      }
      async getRidesForUser(userId) {
        return Array.from(this.rides.values()).filter(
          (ride) => ride.userId === userId
        );
      }
      async getActiveRideForUser(userId) {
        return Array.from(this.rides.values()).find(
          (ride) => ride.userId === userId && ride.status === "active"
        );
      }
      async getRide(id) {
        return this.rides.get(id);
      }
      async createRide(ride) {
        const id = this.rideIdCounter++;
        const newRide = { ...ride, id, endTime: null, endLatitude: null, endLongitude: null, distance: null, cost: null };
        this.rides.set(id, newRide);
        return newRide;
      }
      async updateRide(id, updates) {
        const ride = await this.getRide(id);
        if (!ride) return void 0;
        const updatedRide = { ...ride, ...updates };
        this.rides.set(id, updatedRide);
        return updatedRide;
      }
      // Payment methods
      async getPayments() {
        return Array.from(this.payments.values());
      }
      async getPaymentsForUser(userId) {
        return Array.from(this.payments.values()).filter(
          (payment) => payment.userId === userId
        );
      }
      async getPaymentsForRide(rideId) {
        return Array.from(this.payments.values()).filter(
          (payment) => payment.rideId === rideId
        );
      }
      async createPayment(payment) {
        const id = this.paymentIdCounter++;
        const newPayment = { ...payment, id };
        this.payments.set(id, newPayment);
        return newPayment;
      }
    };
    storage = new MemStorage();
  }
});

// server/verification.ts
var verification_exports = {};
__export(verification_exports, {
  generateEmailVerification: () => generateEmailVerification,
  generatePhoneVerification: () => generatePhoneVerification,
  generateVerificationCode: () => generateVerificationCode,
  getStoredVerificationCode: () => getStoredVerificationCode,
  getVerificationExpiry: () => getVerificationExpiry,
  isVerificationValid: () => isVerificationValid,
  markEmailAsVerified: () => markEmailAsVerified,
  markPhoneAsVerified: () => markPhoneAsVerified,
  sendEmailVerification: () => sendEmailVerification,
  sendSmsVerification: () => sendSmsVerification,
  verificationCodes: () => verificationCodes
});
import { randomInt } from "crypto";
function getStoredVerificationCode(key) {
  console.log("Looking up verification code for:", key);
  console.log("All stored codes:", Array.from(verificationCodes.entries()));
  return verificationCodes.get(key);
}
function generateVerificationCode() {
  return randomInt(1e5, 1e6).toString();
}
function getVerificationExpiry() {
  const expiry = /* @__PURE__ */ new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}
async function generateEmailVerification(userId) {
  const code = generateVerificationCode();
  const expiry = getVerificationExpiry();
  await storage.updateUser(userId, {
    emailVerificationCode: code,
    emailVerificationExpiry: expiry
  });
  return code;
}
async function generatePhoneVerification(userId) {
  const code = generateVerificationCode();
  const expiry = getVerificationExpiry();
  await storage.updateUser(userId, {
    phoneVerificationCode: code,
    phoneVerificationExpiry: expiry
  });
  return code;
}
function isVerificationValid(code, storedCode, expiry) {
  if (!storedCode || !expiry) {
    return false;
  }
  return code === storedCode && /* @__PURE__ */ new Date() < new Date(expiry);
}
async function sendEmailVerification(email, code) {
  console.log(`[MOCK] Sending verification email to ${email} with code: ${code}`);
  verificationCodes.set(email, code);
  console.log(`EMAIL VERIFICATION CODE for ${email}: ${code}`);
  console.log("Updated verification codes:", Array.from(verificationCodes.entries()));
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}
async function sendSmsVerification(phoneNumber, code) {
  try {
    verificationCodes.set(phoneNumber, code);
    console.log(`SMS VERIFICATION CODE for ${phoneNumber}: ${code}`);
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    console.log(`Twilio credentials check: ACCOUNT_SID=${!!accountSid}, AUTH_TOKEN=${!!authToken}, PHONE_NUMBER=${!!twilioPhoneNumber}`);
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error("Twilio credentials are missing or invalid:");
      console.error(`TWILIO_ACCOUNT_SID: ${accountSid ? "Set" : "Missing"}`);
      console.error(`TWILIO_AUTH_TOKEN: ${authToken ? "Set" : "Missing"}`);
      console.error(`TWILIO_PHONE_NUMBER: ${twilioPhoneNumber ? "Set" : "Missing"}`);
      console.log("Using mock implementation for testing");
      return true;
    }
    try {
      const twilioModule = await import("twilio");
      const twilio = twilioModule.default;
      console.log("Twilio module imported successfully");
      console.log(`Creating Twilio client with SID: ${accountSid.substring(0, 5)}... and phone: ${twilioPhoneNumber}`);
      const client2 = twilio(accountSid, authToken);
      console.log(`Sending SMS to: ${phoneNumber} with code: ${code}`);
      const messageOptions = {
        body: `Your ScootMe verification code is: ${code}. This code will expire in 10 minutes.`,
        to: phoneNumber
      };
      const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      if (messagingServiceSid) {
        messageOptions.messagingServiceSid = messagingServiceSid;
      } else {
        messageOptions.from = twilioPhoneNumber;
      }
      const message = await client2.messages.create(messageOptions);
      console.log(`SMS sent successfully with Twilio SID: ${message.sid}`);
      return true;
    } catch (error) {
      const twilioError = error;
      console.error("Error sending SMS with Twilio:", twilioError);
      if (twilioError && typeof twilioError === "object") {
        if ("code" in twilioError) {
          console.error(`Twilio Error Code: ${twilioError.code}`);
        }
        if ("message" in twilioError) {
          console.error(`Twilio Error Message: ${twilioError.message}`);
        }
        if ("status" in twilioError) {
          console.error(`Twilio Error Status: ${twilioError.status}`);
        }
        if ("moreInfo" in twilioError) {
          console.error(`Twilio Error Info: ${twilioError.moreInfo}`);
        }
      }
      return true;
    }
  } catch (error) {
    console.error("Unexpected error in sendSmsVerification:", error);
    return true;
  }
}
async function markEmailAsVerified(userId) {
  try {
    const updatedUser = await storage.updateUser(userId, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null
    });
    return !!updatedUser;
  } catch (error) {
    console.error("Error marking email as verified:", error);
    return false;
  }
}
async function markPhoneAsVerified(userId) {
  try {
    const updatedUser = await storage.updateUser(userId, {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null
    });
    return !!updatedUser;
  } catch (error) {
    console.error("Error marking phone as verified:", error);
    return false;
  }
}
var verificationCodes;
var init_verification = __esm({
  "server/verification.ts"() {
    "use strict";
    init_storage();
    verificationCodes = /* @__PURE__ */ new Map();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
init_storage();
import { createServer } from "http";

// server/auth.ts
init_storage();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  // Can be null for OAuth users
  email: text("email").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  emailVerificationCode: text("email_verification_code"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number"),
  isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry"),
  profilePicture: text("profile_picture"),
  balance: doublePrecision("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // OAuth related fields
  providerId: text("provider_id"),
  // 'google', 'apple', 'phone'
  providerAccountId: text("provider_account_id")
  // ID from the provider
});
var scooters = pgTable("scooters", {
  id: serial("id").primaryKey(),
  scooterId: text("scooter_id").notNull().unique(),
  batteryLevel: integer("battery_level").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull()
});
var rides = pgTable("rides", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scooterId: integer("scooter_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startLatitude: doublePrecision("start_latitude").notNull(),
  startLongitude: doublePrecision("start_longitude").notNull(),
  endLatitude: doublePrecision("end_latitude"),
  endLongitude: doublePrecision("end_longitude"),
  distance: doublePrecision("distance"),
  cost: doublePrecision("cost"),
  status: text("status").notNull()
  // "active", "completed", "cancelled"
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rideId: integer("ride_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull()
  // "success", "failed", "pending"
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  profilePicture: true,
  balance: true,
  providerId: true,
  providerAccountId: true,
  isEmailVerified: true,
  isPhoneVerified: true
});
var insertScooterSchema = createInsertSchema(scooters).pick({
  scooterId: true,
  batteryLevel: true,
  isAvailable: true,
  latitude: true,
  longitude: true
});
var insertRideSchema = createInsertSchema(rides).pick({
  userId: true,
  scooterId: true,
  startTime: true,
  startLatitude: true,
  startLongitude: true,
  status: true
});
var updateRideSchema = createInsertSchema(rides).pick({
  endTime: true,
  endLatitude: true,
  endLongitude: true,
  distance: true,
  cost: true,
  status: true
});
var insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  rideId: true,
  amount: true,
  timestamp: true,
  status: true
});
var loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var phoneRegex = /^(\+?[\d\s\-().]{7,25})$/;
var registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email address").regex(emailRegex, "Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number").optional().or(z.literal("")),
  // Allow empty string for optional phone
  profilePicture: z.string().optional()
});
var updateUserSchema = z.object({
  email: z.string().email("Please enter a valid email address").regex(emailRegex, "Please enter a valid email address").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number").optional().or(z.literal("")),
  // Allow empty string for optional phone
  profilePicture: z.string().url("Please enter a valid URL").optional().or(z.literal(""))
});
var changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
var verifyEmailSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});
var verifyPhoneSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});
var requestVerificationSchema = z.object({
  method: z.enum(["email", "phone"], {
    errorMap: () => ({ message: "Method must be either email or phone" })
  })
});
var phoneLoginSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number")
});
var phoneVerificationCodeSchema = z.object({
  phoneNumber: z.string().regex(phoneRegex, "Please enter a valid phone number"),
  code: z.string().length(6, "Verification code must be 6 digits")
});

// server/auth.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "scooterapp-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback",
        // Also support absolute URL for callback
        // callbackURL: "https://5cbd68a1-637a-418b-8c2b-83865e90c498-00-3j5vvubqvjvlw.kirk.replit.dev/api/auth/google/callback",
        scope: ["profile", "email"],
        // Add additional parameters to help with the redirect URI issue
        proxy: true
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const providerId = "google";
          const providerAccountId = profile.id;
          let user = await storage.getUserByProviderId(providerId, providerAccountId);
          if (!user) {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (!email) {
              return done(new Error("Email is required from Google"));
            }
            const name = profile.displayName || email.split("@")[0];
            const username = `${name.toLowerCase().replace(/\s+/g, "_")}_${Math.floor(Math.random() * 1e3)}`;
            user = await storage.createUser({
              username,
              email,
              fullName: profile.displayName || username,
              password: null,
              // No password for OAuth users
              profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
              providerId,
              providerAccountId,
              isEmailVerified: true
              // Email is verified through Google
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser({
        ...validatedData,
        password: await hashPassword(validatedData.password)
      });
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid username or password" });
        }
        req.login(user, (err2) => {
          if (err2) return next(err2);
          const { password, ...userWithoutPassword } = user;
          res.status(200).json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.get("/api/auth/google", (req, res, next) => {
    console.log("Google OAuth request received:", {
      hostname: req.hostname,
      protocol: req.protocol,
      originalUrl: req.originalUrl,
      headers: req.headers,
      fullUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`
    });
    passport.authenticate("google", {
      scope: ["profile", "email"],
      // Add additional options to help debug
      prompt: "select_account"
    })(req, res, next);
  });
  app2.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log("Google OAuth callback received:", {
        url: req.url,
        hostname: req.hostname,
        protocol: req.protocol,
        headers: req.headers,
        query: req.query,
        fullUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`
      });
      passport.authenticate("google", {
        failureRedirect: "/auth",
        failWithError: true
      })(req, res, next);
    },
    (req, res) => {
      console.log("Google OAuth authentication successful");
      res.redirect("/");
    },
    (err, req, res, next) => {
      console.error("Google OAuth error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        code: err.code,
        statusCode: err.statusCode
      });
      res.redirect("/auth?error=google-auth-failed");
    }
  );
}

// server/routes.ts
import { ZodError as ZodError2 } from "zod";
import { fromZodError as fromZodError2 } from "zod-validation-error";

// server/google-auth.ts
init_storage();
import { OAuth2Client } from "google-auth-library";
var getRedirectUri = (req) => {
  const host = req?.headers.host || "scoot-me-ferransson.replit.app";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}/api/auth/google/callback`;
};
var initialRedirectUri = getRedirectUri();
console.log("Google OAuth redirect URI (initial):", initialRedirectUri);
console.log("IMPORTANT: Make sure to register ALL potential redirect URIs in the Google Cloud Console:");
console.log("1. The deployment domain: https://scoot-me-ferransson.replit.app/api/auth/google/callback");
console.log("2. The development domain: https://scootme--ferransson.repl.co/api/auth/google/callback");
console.log("3. Any Replit preview domains: " + (process.env.REPL_ID ? `https://${process.env.REPL_ID}.id.repl.co/api/auth/google/callback` : "unknown"));
console.log("4. Any additional domains where you test this application.");
if (process.env.GOOGLE_CLIENT_ID) {
  const clientIdPrefix = process.env.GOOGLE_CLIENT_ID.substring(0, 6);
  const clientIdSuffix = process.env.GOOGLE_CLIENT_ID.substring(process.env.GOOGLE_CLIENT_ID.length - 4);
  console.log(`Using Google Client ID: ${clientIdPrefix}...${clientIdSuffix}`);
} else {
  console.error("GOOGLE_CLIENT_ID is not set");
}
var createOAuthClient = (req) => {
  const redirectUri = getRedirectUri(req);
  console.log("Creating OAuth client with redirect URI:", redirectUri);
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};
function getGoogleAuthUrl(req) {
  const oauth2Client = createOAuthClient(req);
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email"
  ];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
    prompt: "consent",
    // Force consent screen to ensure refresh token
    state: req.headers.host || "default"
    // Store the host in state for verification
  });
  return url;
}
async function handleGoogleCallback(req, res) {
  try {
    console.log("Google OAuth callback received:", {
      url: req.originalUrl,
      query: req.query,
      headers: {
        host: req.headers.host,
        referer: req.headers.referer,
        origin: req.headers.origin
      }
    });
    const oauth2Client = createOAuthClient();
    const { code, error, state } = req.query;
    if (error) {
      console.error("Google OAuth error returned:", error);
      return res.redirect(`/auth?error=${encodeURIComponent(error)}`);
    }
    if (!code || typeof code !== "string") {
      console.error("No code provided in callback");
      return res.redirect("/auth?error=no_code_provided");
    }
    let redirectDomain = req.headers.host || "scoot-me-ferransson.replit.app";
    if (state && typeof state === "string") {
      console.log("State parameter returned:", state);
      if (state.includes(".") && !state.includes("/") && !state.includes("?")) {
        redirectDomain = state;
        console.log("Using state as redirect domain:", redirectDomain);
      }
    }
    console.log("Final redirect domain:", redirectDomain);
    console.log("Getting tokens from code");
    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log("Tokens received successfully");
      oauth2Client.setCredentials(tokens);
    } catch (tokenError) {
      console.error("Failed to get tokens:", tokenError);
      return res.redirect(`https://${redirectDomain}/auth?error=token_exchange_failed`);
    }
    console.log("Getting user info from Google");
    let userInfoResponse;
    try {
      userInfoResponse = await oauth2Client.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo"
      });
    } catch (userInfoError) {
      console.error("Failed to get user info:", userInfoError);
      return res.redirect(`https://${redirectDomain}/auth?error=userinfo_failed`);
    }
    const userInfo = userInfoResponse.data;
    console.log("User info retrieved:", {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name
    });
    if (!userInfo.email) {
      console.error("No email provided by Google");
      return res.redirect(`https://${redirectDomain}/auth?error=no_email_provided`);
    }
    let user = await storage.getUserByProviderId("google", userInfo.sub);
    if (!user) {
      const username = `${(userInfo.name || userInfo.email.split("@")[0]).toLowerCase().replace(/\s+/g, "_")}_${Math.floor(Math.random() * 1e3)}`;
      console.log("Creating new user");
      try {
        user = await storage.createUser({
          username,
          email: userInfo.email,
          fullName: userInfo.name || username,
          password: null,
          // No password for OAuth users
          providerId: "google",
          // String literal, not null
          providerAccountId: userInfo.sub,
          isEmailVerified: true,
          // Email is verified through Google
          isPhoneVerified: false,
          // Phone not verified by default
          balance: 0
          // Start with zero balance
        });
      } catch (createUserError) {
        console.error("Failed to create user:", createUserError);
        return res.redirect(`https://${redirectDomain}/auth?error=user_creation_failed`);
      }
    }
    console.log("Logging in user:", user.id);
    req.login(user, (err) => {
      if (err) {
        console.error("Login error", err);
        return res.redirect(`https://${redirectDomain}/auth?error=login_failed`);
      }
      if (req.headers.host === redirectDomain) {
        return res.redirect("/");
      } else {
        return res.redirect(`https://${redirectDomain}/`);
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    let redirectUrl = "/auth?error=" + encodeURIComponent(errorMessage);
    if (req.query.state && typeof req.query.state === "string" && req.query.state.includes(".") && !req.query.state.includes("/")) {
      redirectUrl = `https://${req.query.state}${redirectUrl}`;
    }
    return res.redirect(redirectUrl);
  }
}

// server/google-auth-handler.ts
init_storage();
import { OAuth2Client as OAuth2Client2 } from "google-auth-library";
var client = new OAuth2Client2();
async function handleGoogleAuth(req, res) {
  try {
    const {
      token,
      uid,
      email,
      displayName,
      photoURL,
      emailVerified,
      domain,
      origin,
      timestamp: timestamp2,
      attemptNumber
    } = req.body;
    console.log(`Processing Firebase Google auth request from ${domain || "unknown domain"} (attempt: ${attemptNumber || 1})`);
    console.log(`Auth data: uid=${uid}, email=${email}, name=${displayName}, emailVerified=${emailVerified}`);
    const isCustomDomain = domain === "scootme.ferransson.com";
    if (isCustomDomain) {
      console.log(`\u26A0\uFE0F CUSTOM DOMAIN AUTH REQUEST - ${origin}`);
      console.log(`\u{1F4F1} REQUEST DETAILS:`, {
        hasToken: !!token,
        uid,
        email,
        displayName,
        hasPhoto: !!photoURL,
        emailVerified,
        timestamp: timestamp2 ? new Date(timestamp2).toISOString() : "not provided"
      });
    }
    if (!token || !uid || !email) {
      console.error("Missing required fields:", { token: !!token, uid: !!uid, email: !!email });
      return res.status(400).json({
        error: "Missing required fields",
        detail: `Required: token, uid, email. Provided: ${!!token ? "token" : ""} ${!!uid ? "uid" : ""} ${!!email ? "email" : ""}`
      });
    }
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_FIREBASE_API_KEY
      });
      payload = ticket.getPayload();
      if (isCustomDomain) {
        console.log(`\u2705 CUSTOM DOMAIN - Token verified successfully, payload:`, {
          sub: payload?.sub,
          email: payload?.email,
          name: payload?.name,
          picture: payload?.picture ? "present" : "missing"
        });
      }
      if (!payload || !payload.email) {
        console.error("Invalid token payload:", payload);
        return res.status(401).json({
          error: "Invalid token",
          detail: "Token payload missing required fields"
        });
      }
      if (payload.email !== email) {
        console.error(`Email mismatch: token=${payload.email}, request=${email}`);
        return res.status(401).json({
          error: "Invalid token",
          detail: "Token email does not match provided email"
        });
      }
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      return res.status(401).json({
        error: "Token verification failed",
        detail: tokenError.message
      });
    }
    let user = await storage.getUserByEmail(email);
    if (!user) {
      const usernameBase = email.split("@")[0];
      const uniqueSuffix = Math.floor(Math.random() * 1e3);
      const username = `${usernameBase}_${uniqueSuffix}`;
      try {
        user = await storage.createUser({
          username,
          email,
          password: null,
          // No password for social login
          fullName: displayName || "Google User",
          isEmailVerified: true,
          // Email is verified by Google
          isPhoneVerified: false,
          providerId: "google",
          providerAccountId: uid,
          // Firebase UID
          balance: 0
          // Start with zero balance
        });
        if (isCustomDomain) {
          console.log(`\u2728 CUSTOM DOMAIN - Created new user from Firebase auth:`, {
            id: user.id,
            email,
            username
          });
        } else {
          console.log(`Created new user from Firebase auth: ${email}`);
        }
      } catch (createError) {
        console.error("Failed to create user:", createError);
        return res.status(500).json({
          error: "Failed to create user account",
          detail: createError.message
        });
      }
    } else {
      try {
        await storage.updateUser(user.id, {
          providerId: "google",
          providerAccountId: uid,
          isEmailVerified: true,
          fullName: displayName || user.fullName
        });
        if (isCustomDomain) {
          console.log(`\u{1F504} CUSTOM DOMAIN - Updated existing user:`, {
            id: user.id,
            email
          });
        } else {
          console.log(`Logged in existing user via Firebase: ${email}`);
        }
      } catch (updateError) {
        console.error("Failed to update user:", updateError);
      }
    }
    req.login(user, (err) => {
      if (err) {
        console.error("Session login error:", err);
        return res.status(500).json({
          error: "Failed to create session",
          detail: err.message
        });
      }
      if (isCustomDomain) {
        console.log(`\u{1F389} CUSTOM DOMAIN - Authentication successful for: ${email}`);
      }
      return res.status(200).json(user);
    });
  } catch (error) {
    console.error("Firebase Google auth error:", error);
    return res.status(401).json({
      error: "Authentication failed",
      detail: error.message || "Unknown error occurred"
    });
  }
}

// server/routes.ts
init_verification();
import { scrypt as scrypt2, timingSafeEqual as timingSafeEqual2, randomBytes as randomBytes2 } from "crypto";
import { promisify as promisify2 } from "util";
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/auth/google/url", (req, res) => {
    try {
      console.log("Generating Google OAuth URL...");
      const url = getGoogleAuthUrl(req);
      console.log("Generated URL:", url.substring(0, 50) + "...(truncated)");
      res.json({ url });
    } catch (error) {
      console.error("Error generating Google auth URL:", error);
      res.status(500).json({ message: "Failed to generate Google authentication URL" });
    }
  });
  app2.get("/api/auth/google/callback", handleGoogleCallback);
  app2.post("/api/auth/google", handleGoogleAuth);
  app2.post("/api/auth/phone/login", async (req, res) => {
    try {
      const validatedData = phoneLoginSchema.parse(req.body);
      let { phoneNumber } = validatedData;
      phoneNumber = phoneNumber.trim();
      phoneNumber = phoneNumber.replace(/[^\d+]/g, "");
      if (!phoneNumber.startsWith("+")) {
        if (phoneNumber.startsWith("00")) {
          phoneNumber = "+" + phoneNumber.substring(2);
        } else if (phoneNumber.startsWith("354")) {
          phoneNumber = "+" + phoneNumber;
        } else {
          phoneNumber = "+354" + phoneNumber;
        }
      }
      console.log(`Formatted phone number for verification: ${phoneNumber}`);
      const code = generateVerificationCode();
      const expiry = getVerificationExpiry();
      verificationCodes.set(phoneNumber, code);
      console.log(`Sending verification code ${code} to ${phoneNumber}`);
      const sent = await sendSmsVerification(phoneNumber, code);
      if (sent) {
        res.status(200).json({ message: "Verification code sent" });
      } else {
        res.status(500).json({ message: "Failed to send verification code" });
      }
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error in phone login:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });
  app2.post("/api/auth/phone/verify", async (req, res) => {
    try {
      const validatedData = phoneVerificationCodeSchema.parse(req.body);
      const { phoneNumber, code } = validatedData;
      const storedCode = verificationCodes.get(phoneNumber);
      if (!storedCode || storedCode !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      let user = await storage.getUserByPhone(phoneNumber);
      if (!user) {
        const cleanPhone = phoneNumber.replace(/\D/g, "");
        const username = `user_${cleanPhone}`;
        const fullName = `User ${cleanPhone.substring(cleanPhone.length - 4)}`;
        user = await storage.createUser({
          username,
          email: `${username}@example.com`,
          // Placeholder email
          phoneNumber,
          fullName,
          password: null,
          // No password for OAuth users
          providerId: "phone",
          providerAccountId: phoneNumber,
          isPhoneVerified: true
        });
      } else {
        user = await storage.updateUser(user.id, {
          isPhoneVerified: true,
          providerId: "phone",
          providerAccountId: phoneNumber
        });
      }
      verificationCodes.delete(phoneNumber);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after verification" });
        }
        res.status(200).json(user);
      });
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Phone verification error:", error);
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });
  app2.get("/api/testing/verification-code", async (req, res) => {
    try {
      const { contact } = req.query;
      console.log("Testing endpoint called with contact:", contact);
      if (!contact) {
        return res.status(400).json({ message: "Contact (email or phone) is required" });
      }
      const { getStoredVerificationCode: getStoredVerificationCode2 } = await Promise.resolve().then(() => (init_verification(), verification_exports));
      const verification = await Promise.resolve().then(() => (init_verification(), verification_exports));
      console.log("Verification module imported");
      const code = getStoredVerificationCode2(contact);
      console.log(`Code for ${contact}:`, code);
      if (!code) {
        return res.status(404).json({
          message: "No verification code found for this contact",
          contact
        });
      }
      res.json({ contact, code });
    } catch (error) {
      console.error("Error in verification code testing endpoint:", error);
      res.status(500).json({ message: "Failed to get verification code" });
    }
  });
  app2.get("/api/scooters", async (req, res) => {
    try {
      const scooters2 = await storage.getScooters();
      res.json(scooters2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scooters" });
    }
  });
  app2.post("/api/karsnes-scooters", async (req, res) => {
    try {
      const karsnesStreets = [
        { latitude: 64.1128, longitude: -21.9361 },
        // Kársnesbraut
        { latitude: 64.1123, longitude: -21.9355 },
        // Northern residential area
        { latitude: 64.1116, longitude: -21.934 },
        // Central street
        { latitude: 64.1109, longitude: -21.9322 },
        // School area
        { latitude: 64.1105, longitude: -21.9298 },
        // Eastern part
        { latitude: 64.11, longitude: -21.9318 },
        // Residential area
        { latitude: 64.1124, longitude: -21.9335 },
        // Main road intersection
        { latitude: 64.1118, longitude: -21.9344 },
        // Bus stop
        { latitude: 64.1115, longitude: -21.9325 },
        // Shopping area
        { latitude: 64.1107, longitude: -21.936 }
        // Western point
      ];
      const numScooters = 25;
      const addedScooters = [];
      for (let i = 0; i < numScooters; i++) {
        const streetLocation = karsnesStreets[Math.floor(Math.random() * karsnesStreets.length)];
        const latOffset = (Math.random() - 0.5) * 4e-4;
        const lngOffset = (Math.random() - 0.5) * 4e-4;
        const latitude = streetLocation.latitude + latOffset;
        const longitude = streetLocation.longitude + lngOffset;
        const batteryLevel = Math.floor(Math.random() * 81) + 20;
        const letter = String.fromCharCode(75);
        const number = String(Math.floor(Math.random() * 1e3)).padStart(3, "0");
        const scooterId = `${letter}${number}`;
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
        message: `Successfully added ${numScooters} scooters to K\xE1rsnes streets`,
        scooters: addedScooters
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add K\xE1rsnes scooters" });
    }
  });
  app2.get("/api/scooters/:id", async (req, res) => {
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
  app2.post("/api/scooters", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertScooterSchema.parse(req.body);
      const scooter = await storage.createScooter(validatedData);
      res.status(201).json(scooter);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create scooter" });
    }
  });
  app2.get("/api/rides", isAuthenticated, async (req, res) => {
    try {
      const rides2 = await storage.getRidesForUser(req.user.id);
      res.json(rides2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rides" });
    }
  });
  app2.get("/api/rides/active", isAuthenticated, async (req, res) => {
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
  app2.post("/api/rides/start", isAuthenticated, async (req, res) => {
    try {
      const activeRide = await storage.getActiveRideForUser(req.user.id);
      if (activeRide) {
        return res.status(400).json({ message: "You already have an active ride" });
      }
      const rideData = insertRideSchema.parse({
        ...req.body,
        userId: req.user.id,
        startTime: /* @__PURE__ */ new Date(),
        status: "active"
      });
      const scooter = await storage.getScooter(rideData.scooterId);
      if (!scooter) {
        return res.status(404).json({ message: "Scooter not found" });
      }
      if (!scooter.isAvailable) {
        return res.status(400).json({ message: "Scooter is not available" });
      }
      await storage.updateScooter(scooter.id, { isAvailable: false });
      const ride = await storage.createRide(rideData);
      res.status(201).json(ride);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to start ride" });
    }
  });
  app2.post("/api/rides/:id/end", isAuthenticated, async (req, res) => {
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
      const endTime = /* @__PURE__ */ new Date();
      const durationMs = endTime.getTime() - new Date(ride.startTime).getTime();
      const durationMinutes = durationMs / (1e3 * 60);
      const distance = durationMinutes * 0.1;
      const baseFee = 1;
      const minuteFee = 0.15;
      const cost = baseFee + durationMinutes * minuteFee;
      const updateData = updateRideSchema.parse({
        endTime,
        endLatitude: req.body.endLatitude,
        endLongitude: req.body.endLongitude,
        distance,
        cost,
        status: "completed"
      });
      const updatedRide = await storage.updateRide(rideId, updateData);
      await storage.updateScooter(ride.scooterId, { isAvailable: true });
      const payment = await storage.createPayment({
        userId: req.user.id,
        rideId: ride.id,
        amount: cost,
        timestamp: /* @__PURE__ */ new Date(),
        status: "success"
      });
      await storage.updateUserBalance(req.user.id, -cost);
      res.json({ ride: updatedRide, payment });
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to end ride" });
    }
  });
  app2.get("/api/profile", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user.id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/profile/picture", isAuthenticated, async (req, res) => {
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
  const scryptAsync2 = promisify2(scrypt2);
  app2.post("/api/profile/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = changePasswordSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const [hashed, salt] = user.password.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = await scryptAsync2(currentPassword, salt, 64);
      const passwordsMatch = timingSafeEqual2(hashedBuf, suppliedBuf);
      if (!passwordsMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      const newSalt = randomBytes2(16).toString("hex");
      const newHashedBuf = await scryptAsync2(newPassword, newSalt, 64);
      const newHashedPassword = `${newHashedBuf.toString("hex")}.${newSalt}`;
      const updatedUser = await storage.updateUserPassword(req.user.id, newHashedPassword);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments2 = await storage.getPaymentsForUser(req.user.id);
      res.json(payments2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get payments" });
    }
  });
  app2.post("/api/payments/add-balance", isAuthenticated, async (req, res) => {
    try {
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
  app2.post("/api/verification/request", isAuthenticated, async (req, res) => {
    try {
      const { method } = requestVerificationSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (method === "email") {
        if (user.isEmailVerified) {
          return res.status(400).json({ message: "Email is already verified" });
        }
        const code = await generateEmailVerification(user.id);
        const emailSent = await sendEmailVerification(user.email, code);
        if (!emailSent) {
          return res.status(500).json({ message: "Failed to send verification email" });
        }
        res.json({ message: "Verification code sent to your email" });
      } else if (method === "phone") {
        if (!user.phoneNumber) {
          return res.status(400).json({ message: "No phone number associated with your account" });
        }
        if (user.isPhoneVerified) {
          return res.status(400).json({ message: "Phone number is already verified" });
        }
        const code = await generatePhoneVerification(user.id);
        const smsSent = await sendSmsVerification(user.phoneNumber, code);
        if (!smsSent) {
          return res.status(500).json({ message: "Failed to send verification SMS" });
        }
        res.json({ message: "Verification code sent to your phone" });
      }
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to request verification code" });
    }
  });
  app2.post("/api/verification/email", isAuthenticated, async (req, res) => {
    try {
      const { code } = verifyEmailSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }
      const isVerified = await storage.verifyUserEmail(user.id, code);
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to verify email" });
    }
  });
  app2.post("/api/verification/phone", isAuthenticated, async (req, res) => {
    try {
      const { code } = verifyPhoneSchema.parse(req.body);
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.phoneNumber) {
        return res.status(400).json({ message: "No phone number associated with your account" });
      }
      if (user.isPhoneVerified) {
        return res.status(400).json({ message: "Phone is already verified" });
      }
      const isVerified = await storage.verifyUserPhone(user.id, code);
      if (!isVerified) {
        return res.status(400).json({ message: "Invalid or expired verification code" });
      }
      res.json({ message: "Phone verified successfully" });
    } catch (error) {
      if (error instanceof ZodError2) {
        const validationError = fromZodError2(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to verify phone" });
    }
  });
  app2.get("/api/verification/status", isAuthenticated, async (req, res) => {
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
  app2.get("/api/verification/test/codes", async (req, res) => {
    try {
      const codes = Array.from(verificationCodes.entries());
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
  app2.post("/api/auth/firebase/google", handleGoogleAuth);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { execSync } from "child_process";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const port = process.env.PORT || 5e3;
  console.log(`Starting server on port ${port}`);
  try {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    server.listen({
      port: Number(port),
      host: "0.0.0.0"
    }, () => {
      log(`Server running on port ${port}`);
    }).on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use, attempting to free it...`);
        try {
          const pid = execSync(`lsof -t -i:${port}`).toString().trim();
          if (pid) {
            console.log(`Killing process ${pid} that's using port ${port}...`);
            execSync(`kill -9 ${pid}`);
            setTimeout(() => {
              server.listen({
                port: Number(port),
                host: "0.0.0.0"
              }, () => {
                log(`Server running on port ${port} after retry`);
              });
            }, 1e3);
          }
        } catch (execError) {
          console.error("Failed to kill process using the port:", execError);
          console.error("Server failed to start:", err);
        }
      } else {
        console.error("Server failed to start:", err);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
