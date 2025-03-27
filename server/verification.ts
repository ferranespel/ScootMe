import { randomInt } from 'crypto';
import { storage } from './storage';

// Generate a random 6-digit verification code
export function generateVerificationCode(): string {
  // Generate a random number between 100000 and 999999
  return randomInt(100000, 1000000).toString();
}

// Set expiry time - 10 minutes from now
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);
  return expiry;
}

// Generate and store email verification code
export async function generateEmailVerification(userId: number): Promise<string> {
  const code = generateVerificationCode();
  const expiry = getVerificationExpiry();
  
  await storage.updateUser(userId, {
    emailVerificationCode: code,
    emailVerificationExpiry: expiry,
  });
  
  return code;
}

// Generate and store phone verification code
export async function generatePhoneVerification(userId: number): Promise<string> {
  const code = generateVerificationCode();
  const expiry = getVerificationExpiry();
  
  await storage.updateUser(userId, {
    phoneVerificationCode: code,
    phoneVerificationExpiry: expiry,
  });
  
  return code;
}

// Check if verification code is valid and not expired
export function isVerificationValid(code: string, storedCode: string | null, expiry: Date | null): boolean {
  if (!storedCode || !expiry) {
    return false;
  }
  
  // Check if code matches and is not expired
  return code === storedCode && new Date() < new Date(expiry);
}

// Mock email sending function
// In a real application, you would use a service like SendGrid, Mailgun, etc.
export async function sendEmailVerification(email: string, code: string): Promise<boolean> {
  // This is a mock function - in a real app you would integrate with an email service
  console.log(`[MOCK] Sending verification email to ${email} with code: ${code}`);
  
  // Simulate API call to email service
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real implementation, you would check for actual success/failure
      resolve(true);
    }, 500);
  });
}

// Mock SMS sending function
// In a real application, you would use a service like Twilio, Nexmo, etc.
export async function sendSmsVerification(phoneNumber: string, code: string): Promise<boolean> {
  // This is a mock function - in a real app you would integrate with an SMS service
  console.log(`[MOCK] Sending verification SMS to ${phoneNumber} with code: ${code}`);
  
  // Simulate API call to SMS service
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real implementation, you would check for actual success/failure
      resolve(true);
    }, 500);
  });
}

// Mark email as verified
export async function markEmailAsVerified(userId: number): Promise<boolean> {
  try {
    const updatedUser = await storage.updateUser(userId, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
    });
    
    return !!updatedUser;
  } catch (error) {
    console.error('Error marking email as verified:', error);
    return false;
  }
}

// Mark phone as verified
export async function markPhoneAsVerified(userId: number): Promise<boolean> {
  try {
    const updatedUser = await storage.updateUser(userId, {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpiry: null,
    });
    
    return !!updatedUser;
  } catch (error) {
    console.error('Error marking phone as verified:', error);
    return false;
  }
}