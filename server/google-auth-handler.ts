import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";

// Create a Google OAuth client
const client = new OAuth2Client();

/**
 * Verify a Google ID token and authenticate the user
 */
export async function handleGoogleAuth(req: Request, res: Response) {
  try {
    const { token, email, name, photoUrl } = req.body;
    
    if (!token || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.VITE_FIREBASE_API_KEY // Use Firebase API key as audience
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email || payload.email !== email) {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    // Check if user exists by email
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create new user
      user = await storage.createUser({
        username: email.split('@')[0], // Use part before @ as username
        email: email,
        password: null, // No password for social login
        fullName: name || 'Google User',
        isEmailVerified: true, // Email is verified by Google
        isPhoneVerified: false,
        providerId: 'google',
        providerAccountId: payload.sub // Google's user ID
      });
      
      console.log(`Created new user from Google auth: ${email}`);
    } else {
      // Update existing user if needed
      await storage.updateUser(user.id, {
        providerId: 'google',
        providerAccountId: payload.sub,
        isEmailVerified: true,
        fullName: name || user.fullName
      });
      
      console.log(`Logged in existing user via Google: ${email}`);
    }
    
    // Set authenticated session
    req.login(user, (err) => {
      if (err) {
        console.error("Session login error:", err);
        return res.status(500).json({ error: "Failed to create session" });
      }
      return res.status(200).json(user);
    });
    
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}