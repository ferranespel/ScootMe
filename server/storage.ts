import { users, scooters, rides, payments } from "@shared/schema";
import { User, InsertUser, Scooter, InsertScooter, Ride, InsertRide, UpdateRide, Payment, InsertPayment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User | undefined>;
  
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
    
    // Define areas across Greater Reykjavik for more realistic distribution
    const areas = [
      // Central Reykjavik
      { name: "Downtown", center: { latitude: 64.1466, longitude: -21.9426 }, radius: 0.005 },
      { name: "Hallgrímskirkja", center: { latitude: 64.1482, longitude: -21.9376 }, radius: 0.004 },
      { name: "Laugavegur", center: { latitude: 64.1429, longitude: -21.9268 }, radius: 0.006 },
      { name: "Harpa", center: { latitude: 64.1499, longitude: -21.9507 }, radius: 0.003 },
      { name: "University", center: { latitude: 64.1407, longitude: -21.9443 }, radius: 0.004 },
      { name: "National Museum", center: { latitude: 64.1384, longitude: -21.9532 }, radius: 0.003 },
      { name: "Tjörnin", center: { latitude: 64.1390, longitude: -21.9246 }, radius: 0.004 },
      { name: "City Hall", center: { latitude: 64.1435, longitude: -21.9310 }, radius: 0.003 },
      { name: "Austurvöllur", center: { latitude: 64.1451, longitude: -21.9355 }, radius: 0.002 },
      { name: "Vesturbær", center: { latitude: 64.1383, longitude: -21.9607 }, radius: 0.007 },
      { name: "BSÍ", center: { latitude: 64.1399, longitude: -21.9326 }, radius: 0.003 },
      { name: "Hlemmur", center: { latitude: 64.1431, longitude: -21.9151 }, radius: 0.005 },
      
      // Expanded areas
      { name: "Kópavogur", center: { latitude: 64.1031, longitude: -21.9026 }, radius: 0.015 },
      { name: "Kópavogur Mall", center: { latitude: 64.1012, longitude: -21.8897 }, radius: 0.008 },
      { name: "Smáralind", center: { latitude: 64.1006, longitude: -21.8886 }, radius: 0.005 },
      
      { name: "Árbær", center: { latitude: 64.1156, longitude: -21.8003 }, radius: 0.012 },
      { name: "Árbæjarsafn", center: { latitude: 64.1172, longitude: -21.7825 }, radius: 0.005 },
      
      { name: "Grafarvogur", center: { latitude: 64.1361, longitude: -21.7785 }, radius: 0.015 },
      { name: "Grafarholt", center: { latitude: 64.1242, longitude: -21.7554 }, radius: 0.012 },
      { name: "Spöngin", center: { latitude: 64.1406, longitude: -21.7935 }, radius: 0.006 },
      
      { name: "Laugadalur", center: { latitude: 64.1399, longitude: -21.8733 }, radius: 0.012 },
      { name: "Laugardalur Park", center: { latitude: 64.1384, longitude: -21.8857 }, radius: 0.008 },
      
      { name: "Seltjarnarnes", center: { latitude: 64.1557, longitude: -22.0016 }, radius: 0.010 },
      { name: "Garðabær", center: { latitude: 64.0891, longitude: -21.9235 }, radius: 0.012 },
      { name: "Hafnarfjörður", center: { latitude: 64.0671, longitude: -21.9573 }, radius: 0.015 },
      
      { name: "Mosfellsbær", center: { latitude: 64.1670, longitude: -21.7020 }, radius: 0.012 },
      { name: "Breiðholt", center: { latitude: 64.1038, longitude: -21.8330 }, radius: 0.014 },
      { name: "Kringlan Mall", center: { latitude: 64.1295, longitude: -21.8877 }, radius: 0.005 }
    ];
    
    // Generate 250 scooters
    const scooters: InsertScooter[] = [];
    
    for (let i = 1; i <= 250; i++) {
      // Choose a random area
      const area = areas[Math.floor(Math.random() * areas.length)];
      
      // Generate a random position within the area radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * area.radius;
      const latitude = area.center.latitude + (distance * Math.cos(angle));
      const longitude = area.center.longitude + (distance * Math.sin(angle));
      
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

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id,
      balance: user.balance || 0 // Ensure balance is never undefined
    };
    this.users.set(id, newUser);
    return newUser;
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
