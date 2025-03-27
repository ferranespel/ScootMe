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
  sessionStore: session.SessionStore;
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
  sessionStore: session.SessionStore;

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
    const mockScooters: InsertScooter[] = [
      { scooterId: 'A245', batteryLevel: 85, isAvailable: true, latitude: 37.7749, longitude: -122.4194 },
      { scooterId: 'B182', batteryLevel: 54, isAvailable: true, latitude: 37.7759, longitude: -122.4154 },
      { scooterId: 'C923', batteryLevel: 92, isAvailable: true, latitude: 37.7739, longitude: -122.4244 },
      { scooterId: 'D567', batteryLevel: 78, isAvailable: true, latitude: 37.7719, longitude: -122.4124 },
      { scooterId: 'E891', batteryLevel: 65, isAvailable: true, latitude: 37.7789, longitude: -122.4174 },
    ];

    for (const scooter of mockScooters) {
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
    const newUser: User = { ...user, id };
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
    const newScooter: Scooter = { ...scooter, id };
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
