import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
});

export const scooters = pgTable("scooters", {
  id: serial("id").primaryKey(),
  scooterId: text("scooter_id").notNull().unique(),
  batteryLevel: integer("battery_level").notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
});

export const rides = pgTable("rides", {
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
  status: text("status").notNull(), // "active", "completed", "cancelled"
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rideId: integer("ride_id").notNull(),
  amount: doublePrecision("amount").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull(), // "success", "failed", "pending"
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  phoneNumber: true,
  profilePicture: true,
  balance: true,
});

export const insertScooterSchema = createInsertSchema(scooters).pick({
  scooterId: true,
  batteryLevel: true,
  isAvailable: true,
  latitude: true,
  longitude: true,
});

export const insertRideSchema = createInsertSchema(rides).pick({
  userId: true,
  scooterId: true,
  startTime: true,
  startLatitude: true,
  startLongitude: true,
  status: true,
});

export const updateRideSchema = createInsertSchema(rides).pick({
  endTime: true,
  endLatitude: true,
  endLongitude: true,
  distance: true,
  cost: true,
  status: true,
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  rideId: true,
  amount: true,
  timestamp: true,
  status: true,
});

// TypeScript types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScooter = z.infer<typeof insertScooterSchema>;
export type Scooter = typeof scooters.$inferSelect;

export type InsertRide = z.infer<typeof insertRideSchema>;
export type UpdateRide = z.infer<typeof updateRideSchema>;
export type Ride = typeof rides.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Login validation schema
export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Email validation regex pattern
// This is a more comprehensive email validation than the basic Zod email validator
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number validation regex pattern - supports various international formats
// Valid formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
const phoneRegex = /^(\+?\d{1,3})?[-. (]?\d{3}[-. )]?\d{3}[-. ]?\d{4}$/;

// Registration validation schema with additional validations
export const registerSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .regex(emailRegex, "Please enter a valid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal('')),  // Allow empty string for optional phone
  profilePicture: z.string().optional(),
});

// User profile update schema (doesn't include password)
export const updateUserSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .regex(emailRegex, "Please enter a valid email address")
    .optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  phoneNumber: z.string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal('')),  // Allow empty string for optional phone
  profilePicture: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Email verification schema
export const verifyEmailSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});

// Phone verification schema
export const verifyPhoneSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits")
});

// Request for verification code schema
export const requestVerificationSchema = z.object({
  method: z.enum(["email", "phone"], {
    errorMap: () => ({ message: "Method must be either email or phone" }),
  })
});
