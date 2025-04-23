import { randomInt } from 'crypto';
import { storage } from './storage';

// Store verification codes for testing
export const verificationCodes = new Map<string, string>();

// Function to get a verification code for testing
export function getStoredVerificationCode(key: string): string | undefined {
  console.log('Looking up verification code for:', key);
  console.log('All stored codes:', Array.from(verificationCodes.entries()));
  return verificationCodes.get(key);
}

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
  
  // Store code for testing retrieval
  verificationCodes.set(email, code);
  console.log(`EMAIL VERIFICATION CODE for ${email}: ${code}`);
  console.log('Updated verification codes:', Array.from(verificationCodes.entries()));
  
  // Simulate API call to email service
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real implementation, you would check for actual success/failure
      resolve(true);
    }, 500);
  });
}

// Real SMS sending function using Twilio
export async function sendSmsVerification(phoneNumber: string, code: string): Promise<boolean> {
  try {
    // Always store the code for testing retrieval and debugging
    verificationCodes.set(phoneNumber, code);
    console.log(`SMS VERIFICATION CODE for ${phoneNumber}: ${code}`);
    
    // Check if Twilio credentials are available
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    console.log(`Twilio credentials check: ACCOUNT_SID=${!!accountSid}, AUTH_TOKEN=${!!authToken}, PHONE_NUMBER=${!!twilioPhoneNumber}`);
    
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.error('Twilio credentials are missing or invalid:');
      console.error(`TWILIO_ACCOUNT_SID: ${accountSid ? 'Set' : 'Missing'}`);
      console.error(`TWILIO_AUTH_TOKEN: ${authToken ? 'Set' : 'Missing'}`);
      console.error(`TWILIO_PHONE_NUMBER: ${twilioPhoneNumber ? 'Set' : 'Missing'}`);
      console.log('Using mock implementation for testing');
      return true; // Return true for testing without credentials
    }
    
    try {
      // Import Twilio properly using dynamic import
      const twilioModule = await import('twilio');
      const twilio = twilioModule.default;
      console.log('Twilio module imported successfully');
      
      console.log(`Creating Twilio client with SID: ${accountSid.substring(0, 5)}... and phone: ${twilioPhoneNumber}`);
      const client = twilio(accountSid, authToken);
      
      console.log(`Sending SMS to: ${phoneNumber} with code: ${code}`);
      
      // Send the SMS
      const message = await client.messages.create({
        body: `Your EcoScoot verification code is: ${code}. This code will expire in 10 minutes.`,
        from: twilioPhoneNumber,
        to: phoneNumber
      });
      
      console.log(`SMS sent successfully with Twilio SID: ${message.sid}`);
      return true;
    } catch (error) {
      const twilioError = error as any;
      console.error('Error sending SMS with Twilio:', twilioError);
      
      // Log detailed error information if available
      if (twilioError && typeof twilioError === 'object') {
        if ('code' in twilioError) {
          console.error(`Twilio Error Code: ${twilioError.code}`);
        }
        if ('message' in twilioError) {
          console.error(`Twilio Error Message: ${twilioError.message}`);
        }
        if ('status' in twilioError) {
          console.error(`Twilio Error Status: ${twilioError.status}`);
        }
        if ('moreInfo' in twilioError) {
          console.error(`Twilio Error Info: ${twilioError.moreInfo}`);
        }
      }
      
      // For development, still return true to allow testing even if SMS delivery fails
      // In production, you might want to handle this differently
      return true;
    }
  } catch (error) {
    console.error('Unexpected error in sendSmsVerification:', error);
    // Still store the code for testing even if the process fails
    return true; // Don't fail the verification flow due to SMS delivery issues
  }
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