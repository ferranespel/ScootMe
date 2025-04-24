import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";
import fetch from 'node-fetch';

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
      attemptNumber,
      directOAuth // New parameter for direct OAuth flow
    } = req.body;
    
    // Log detailed info for debugging
    const authType = directOAuth ? 'Direct OAuth' : 'Firebase';
    console.log(`Processing ${authType} Google auth request from ${domain || 'unknown domain'} (attempt: ${attemptNumber || 1})`);
    console.log(`Auth data: uid=${uid}, email=${email}, name=${displayName}, emailVerified=${emailVerified}`);
    
    // Extra logging for custom domain
    const isCustomDomain = domain === "scootme.ferransson.com";
    const isReplitDomain = domain?.includes('replit');
    
    if (isCustomDomain || isReplitDomain) {
      console.log(`⚠️ ${isCustomDomain ? 'CUSTOM' : 'REPLIT'} DOMAIN AUTH REQUEST - ${origin}`);
      console.log(`📱 REQUEST DETAILS:`, {
        method: directOAuth ? 'Direct OAuth' : 'Firebase',
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
    if (!email || (!token && !directOAuth) || !uid) {
      console.error("Missing required fields:", { 
        token: !!token, 
        uid: !!uid, 
        email: !!email,
        directOAuth: !!directOAuth
      });
      return res.status(400).json({ 
        error: "Missing required fields", 
        detail: `Required: email, uid, and token (for Firebase) or directOAuth=true flag.`
      });
    }
    
    // Different verification process based on auth type
    let verifiedEmail = null;
    
    if (directOAuth) {
      // For direct OAuth flow, we need to verify the access token by calling Google's userinfo endpoint
      try {
        // Validate access token by calling Google's userinfo API
        const googleResponse = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
        );
        
        if (!googleResponse.ok) {
          throw new Error(`Google API request failed with status: ${googleResponse.status}`);
        }
        
        const userInfo = await googleResponse.json();
        
        if (!userInfo || !userInfo.email) {
          throw new Error("Invalid response from Google API - missing email");
        }
        
        verifiedEmail = userInfo.email;
        
        // Make sure the emails match
        if (verifiedEmail !== email) {
          console.error(`Email mismatch: token=${verifiedEmail}, request=${email}`);
          return res.status(401).json({ 
            error: "Invalid token", 
            detail: "Token email does not match provided email"
          });
        }
        
        console.log(`✅ Direct OAuth token verified successfully for: ${email}`);
      } catch (error) {
        console.error("Direct OAuth token verification failed:", error.message);
        return res.status(401).json({ 
          error: "Token verification failed", 
          detail: error.message
        });
      }
    } else {
      // Standard Firebase verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.VITE_FIREBASE_API_KEY
        });
        
        const payload = ticket.getPayload();
        
        if (isCustomDomain || isReplitDomain) {
          console.log(`✅ Firebase token verified successfully, payload:`, {
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
        
        verifiedEmail = payload.email;
        
        // Verify that token matches the claimed user
        if (verifiedEmail !== email) {
          console.error(`Email mismatch: token=${verifiedEmail}, request=${email}`);
          return res.status(401).json({ 
            error: "Invalid token", 
            detail: "Token email does not match provided email"
          });
        }
      } catch (tokenError) {
        console.error("Firebase token verification failed:", tokenError);
        return res.status(401).json({ 
          error: "Token verification failed", 
          detail: tokenError.message
        });
      }
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