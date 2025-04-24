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
    // Get parameters from request body
    const { 
      token, 
      uid, 
      email, 
      displayName, 
      photoURL, 
      emailVerified,
      domain, 
      origin,
      timestamp,
      attemptNumber
    } = req.body;
    
    // Log detailed info for debugging
    console.log(`Processing Firebase Google auth request from ${domain || 'unknown domain'} (attempt: ${attemptNumber || 1})`);
    console.log(`Auth data: uid=${uid}, email=${email}, name=${displayName}, emailVerified=${emailVerified}`);
    
    // Extra logging for custom domain
    const isCustomDomain = domain === "scootme.ferransson.com";
    if (isCustomDomain) {
      console.log(`⚠️ CUSTOM DOMAIN AUTH REQUEST - ${origin}`);
      console.log(`📱 REQUEST DETAILS:`, {
        hasToken: !!token,
        uid,
        email,
        displayName,
        hasPhoto: !!photoURL,
        emailVerified,
        timestamp: timestamp ? new Date(timestamp).toISOString() : 'not provided'
      });
    }
    
    // Validate required fields
    if (!token || !uid || !email) {
      console.error("Missing required fields:", { token: !!token, uid: !!uid, email: !!email });
      return res.status(400).json({ 
        error: "Missing required fields", 
        detail: `Required: token, uid, email. Provided: ${!!token ? 'token' : ''} ${!!uid ? 'uid' : ''} ${!!email ? 'email' : ''}`
      });
    }
    
    // Verify the token with Google
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.VITE_FIREBASE_API_KEY
      });
      
      payload = ticket.getPayload();
      
      if (isCustomDomain) {
        console.log(`✅ CUSTOM DOMAIN - Token verified successfully, payload:`, {
          sub: payload?.sub,
          email: payload?.email,
          name: payload?.name,
          picture: payload?.picture ? 'present' : 'missing'
        });
      }
      
      if (!payload || !payload.email) {
        console.error("Invalid token payload:", payload);
        return res.status(401).json({ 
          error: "Invalid token", 
          detail: "Token payload missing required fields"
        });
      }
      
      // Verify that token matches the claimed user
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
    
    // Check if user exists by email
    let user = await storage.getUserByEmail(email);
    
    if (!user) {
      // Create new user with a unique username (avoid collisions)
      const usernameBase = email.split('@')[0];
      const uniqueSuffix = Math.floor(Math.random() * 1000);
      const username = `${usernameBase}_${uniqueSuffix}`;
      
      try {
        user = await storage.createUser({
          username: username,
          email: email,
          password: null, // No password for social login
          fullName: displayName || 'Google User',
          isEmailVerified: true, // Email is verified by Google
          isPhoneVerified: false,
          providerId: 'google',
          providerAccountId: uid, // Firebase UID
          balance: 0 // Start with zero balance
        });
        
        if (isCustomDomain) {
          console.log(`✨ CUSTOM DOMAIN - Created new user from Firebase auth:`, {
            id: user.id,
            email: email,
            username: username
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
      // Update existing user
      try {
        await storage.updateUser(user.id, {
          providerId: 'google',
          providerAccountId: uid,
          isEmailVerified: true,
          fullName: displayName || user.fullName
        });
        
        if (isCustomDomain) {
          console.log(`🔄 CUSTOM DOMAIN - Updated existing user:`, {
            id: user.id,
            email: email
          });
        } else {
          console.log(`Logged in existing user via Firebase: ${email}`);
        }
      } catch (updateError) {
        console.error("Failed to update user:", updateError);
        // Continue anyway - this is a non-critical error
      }
    }
    
    // Set authenticated session
    req.login(user, (err) => {
      if (err) {
        console.error("Session login error:", err);
        return res.status(500).json({ 
          error: "Failed to create session", 
          detail: err.message
        });
      }
      
      if (isCustomDomain) {
        console.log(`🎉 CUSTOM DOMAIN - Authentication successful for: ${email}`);
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