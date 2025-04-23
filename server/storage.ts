import { users, scooters, rides, payments } from "@shared/schema";
import { User, InsertUser, Scooter, InsertScooter, Ride, InsertRide, UpdateRide, Payment, InsertPayment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  getUserByProviderId(providerId: string, providerAccountId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  
  // Verification methods
  verifyUserEmail(userId: number, code: string): Promise<boolean>;
  verifyUserPhone(userId: number, code: string): Promise<boolean>;
  
  // Scooter methods
  getScooters(): Promise<Scooter[]>;
  getScooter(id: number): Promise<Scooter | undefined>;
  getScooterByScooterId(scooterId: string): Promise<Scooter | undefined>;
  createScooter(scooter: InsertScooter): Promise<Scooter>;
  updateScooter(id: number, updates: Partial<Scooter>): Promise<Scooter | undefined>;
  
  // Ride methods
  getRides(): Promise<Ride[]>;
  getRidesForUser(userId: number): Promise<Ride[]>;
  getActiveRideForUser(userId: number): Promise<Ride | undefined>;
  getRide(id: number): Promise<Ride | undefined>;
  createRide(ride: InsertRide): Promise<Ride>;
  updateRide(id: number, updates: UpdateRide): Promise<Ride | undefined>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getPaymentsForUser(userId: number): Promise<Payment[]>;
  getPaymentsForRide(rideId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Session store
  sessionStore: any; // Using any type to avoid TypeScript error with express-session
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private scooters: Map<number, Scooter>;
  private rides: Map<number, Ride>;
  private payments: Map<number, Payment>;
  private userIdCounter: number;
  private scooterIdCounter: number;
  private rideIdCounter: number;
  private paymentIdCounter: number;
  sessionStore: any; // Using any type to avoid TypeScript error

  constructor() {
    this.users = new Map();
    this.scooters = new Map();
    this.rides = new Map();
    this.payments = new Map();
    this.userIdCounter = 1;
    this.scooterIdCounter = 1;
    this.rideIdCounter = 1;
    this.paymentIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with some mock scooters
    this.initializeScooters();
  }

  private initializeScooters(): void {
    // Define Reykjavik center coordinates
    const reykjavikCenter = {
      latitude: 64.1466,
      longitude: -21.9426
    };

    // Define land-only areas (streets) with careful coordinates to avoid ocean
    const streets = [
      // Central Reykjavik (land-only)
      { name: "Downtown", street_points: [
        { latitude: 64.1466, longitude: -21.9426 },  // City center
        { latitude: 64.1475, longitude: -21.9410 },  // Austurstræti
        { latitude: 64.1480, longitude: -21.9390 },  // Lækjargata
        { latitude: 64.1472, longitude: -21.9370 },  // Bankastræti
      ]},
      { name: "Hallgrímskirkja", street_points: [
        { latitude: 64.1418, longitude: -21.9267 },  // Skólavörðustígur
        { latitude: 64.1426, longitude: -21.9272 },  // Frakkastígur
        { latitude: 64.1432, longitude: -21.9262 },  // Bergstaðastræti
      ]},
      { name: "Laugavegur", street_points: [
        { latitude: 64.1429, longitude: -21.9268 },  // Main street
        { latitude: 64.1425, longitude: -21.9240 },  // East end
        { latitude: 64.1435, longitude: -21.9200 },  // Hlemmur area
      ]},
      
      // Kópavogur (land-only coordinates)
      { name: "Kópavogur", street_points: [
        { latitude: 64.1031, longitude: -21.9026 },  // Main road
        { latitude: 64.1045, longitude: -21.9038 },  // Residential area
        { latitude: 64.1025, longitude: -21.9050 },  // Shopping district
      ]},
      { name: "Kópavogur Mall", street_points: [
        { latitude: 64.1012, longitude: -21.8897 },
        { latitude: 64.1018, longitude: -21.8905 },
        { latitude: 64.1008, longitude: -21.8890 },
      ]},
      
      // Kársnes (carefully chosen land-only coordinates)
      { name: "Kársnes", street_points: [
        { latitude: 64.1128, longitude: -21.9361 },  // Kársnesbraut
        { latitude: 64.1123, longitude: -21.9355 },  // Northern residential area
        { latitude: 64.1116, longitude: -21.9340 },  // Central street
        { latitude: 64.1109, longitude: -21.9322 },  // School area
        { latitude: 64.1105, longitude: -21.9280 },  // Eastern part
      ]},
      
      // Árbær (land-only)
      { name: "Árbær", street_points: [
        { latitude: 64.1156, longitude: -21.8003 },
        { latitude: 64.1164, longitude: -21.8012 },
        { latitude: 64.1150, longitude: -21.7995 },
      ]},
      
      // Grafarvogur (land-only)
      { name: "Grafarvogur", street_points: [
        { latitude: 64.1361, longitude: -21.7785 },
        { latitude: 64.1370, longitude: -21.7795 },
        { latitude: 64.1355, longitude: -21.7775 },
      ]},
      
      // Laugadalur (land-only)
      { name: "Laugadalur", street_points: [
        { latitude: 64.1399, longitude: -21.8733 },
        { latitude: 64.1405, longitude: -21.8740 },
        { latitude: 64.1392, longitude: -21.8720 },
      ]},
      
      // Laugardalur Park (land-only)
      { name: "Laugardalur Park", street_points: [
        { latitude: 64.1384, longitude: -21.8857 },
        { latitude: 64.1390, longitude: -21.8865 },
        { latitude: 64.1378, longitude: -21.8850 },
      ]},
      
      // Breiðholt (land-only)
      { name: "Breiðholt", street_points: [
        { latitude: 64.1038, longitude: -21.8330 },
        { latitude: 64.1045, longitude: -21.8340 },
        { latitude: 64.1030, longitude: -21.8320 },
      ]},
      
      // Add more carefully placed street points to cover the Greater Reykjavik area
      { name: "Kringlan Mall", street_points: [
        { latitude: 64.1295, longitude: -21.8877 },
        { latitude: 64.1300, longitude: -21.8885 },
        { latitude: 64.1290, longitude: -21.8870 },
      ]}
    ];
    
    // Generate 250 scooters
    const scooters: InsertScooter[] = [];
    
    for (let i = 1; i <= 250; i++) {
      // Choose a random street area
      const area = streets[Math.floor(Math.random() * streets.length)];
      
      // Choose a random street point from this area
      const streetPoint = area.street_points[Math.floor(Math.random() * area.street_points.length)];
      
      // Add a very small random offset to avoid all scooters being exactly on the street points
      // Small enough to keep them on streets, but with some variation
      const latOffset = (Math.random() - 0.5) * 0.0008;  // ~50 meters max
      const lngOffset = (Math.random() - 0.5) * 0.0008;  // ~50 meters max
      
      const latitude = streetPoint.latitude + latOffset;
      const longitude = streetPoint.longitude + lngOffset;
      
      // Generate a random battery level (20-100%)
      const batteryLevel = Math.floor(Math.random() * 81) + 20;
      
      // Generate scooter ID (letter + 3 digits)
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
      const number = String(Math.floor(Math.random() * 1000)).padStart(3, '0'); // 000-999
      const scooterId = `${letter}${number}`;
      
      // Create scooter
      scooters.push({
        scooterId,
        batteryLevel,
        isAvailable: true,
        latitude,
        longitude
      });
    }
    
    // Add all scooters to the storage
    for (const scooter of scooters) {
      this.createScooter(scooter);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }
  
  async getUserByProviderId(providerId: string, providerAccountId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.providerId === providerId && user.providerAccountId === providerAccountId,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id,
      password: user.password || null,
      phoneNumber: user.phoneNumber || null,
      profilePicture: user.profilePicture || null,
      balance: user.balance || 0, // Ensure balance is never undefined
      createdAt: new Date(), // Add the createdAt timestamp
      
      // Add verification fields
      isEmailVerified: user.providerId === 'google' || user.providerId === 'apple' || false,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
      isPhoneVerified: user.providerId === 'phone' || false,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null,
      
      // OAuth related fields
      providerId: user.providerId || null,
      providerAccountId: user.providerAccountId || null
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    // Don't allow updating certain fields like id and password through this method
    const { id, password, balance, ...allowedUpdates } = updates as any;
    
    const updatedUser = { 
      ...user, 
      ...allowedUpdates 
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      balance: user.balance + amount 
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      password: newPassword
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Verification methods
  async verifyUserEmail(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Check if code matches and is not expired
    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      return false;
    }
    
    if (user.emailVerificationCode === code && 
        new Date() < new Date(user.emailVerificationExpiry)) {
      // Mark email as verified
      await this.updateUser(userId, {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null
      });
      return true;
    }
    
    return false;
  }
  
  async verifyUserPhone(userId: number, code: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Check if code matches and is not expired
    if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
      return false;
    }
    
    if (user.phoneVerificationCode === code && 
        new Date() < new Date(user.phoneVerificationExpiry)) {
      // Mark phone as verified
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
  async getScooters(): Promise<Scooter[]> {
    return Array.from(this.scooters.values());
  }

  async getScooter(id: number): Promise<Scooter | undefined> {
    return this.scooters.get(id);
  }

  async getScooterByScooterId(scooterId: string): Promise<Scooter | undefined> {
    return Array.from(this.scooters.values()).find(
      (scooter) => scooter.scooterId === scooterId,
    );
  }

  async createScooter(scooter: InsertScooter): Promise<Scooter> {
    const id = this.scooterIdCounter++;
    const newScooter: Scooter = { 
      ...scooter, 
      id,
      isAvailable: scooter.isAvailable !== undefined ? scooter.isAvailable : true // Ensure isAvailable is never undefined
    };
    this.scooters.set(id, newScooter);
    return newScooter;
  }

  async updateScooter(id: number, updates: Partial<Scooter>): Promise<Scooter | undefined> {
    const scooter = await this.getScooter(id);
    if (!scooter) return undefined;

    const updatedScooter = { ...scooter, ...updates };
    this.scooters.set(id, updatedScooter);
    return updatedScooter;
  }

  // Ride methods
  async getRides(): Promise<Ride[]> {
    return Array.from(this.rides.values());
  }

  async getRidesForUser(userId: number): Promise<Ride[]> {
    return Array.from(this.rides.values()).filter(
      (ride) => ride.userId === userId,
    );
  }

  async getActiveRideForUser(userId: number): Promise<Ride | undefined> {
    return Array.from(this.rides.values()).find(
      (ride) => ride.userId === userId && ride.status === 'active',
    );
  }

  async getRide(id: number): Promise<Ride | undefined> {
    return this.rides.get(id);
  }

  async createRide(ride: InsertRide): Promise<Ride> {
    const id = this.rideIdCounter++;
    const newRide: Ride = { ...ride, id, endTime: null, endLatitude: null, endLongitude: null, distance: null, cost: null };
    this.rides.set(id, newRide);
    return newRide;
  }

  async updateRide(id: number, updates: UpdateRide): Promise<Ride | undefined> {
    const ride = await this.getRide(id);
    if (!ride) return undefined;

    const updatedRide = { ...ride, ...updates };
    this.rides.set(id, updatedRide);
    return updatedRide;
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPaymentsForUser(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.userId === userId,
    );
  }

  async getPaymentsForRide(rideId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.rideId === rideId,
    );
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const newPayment: Payment = { ...payment, id };
    this.payments.set(id, newPayment);
    return newPayment;
  }
}

export const storage = new MemStorage();
