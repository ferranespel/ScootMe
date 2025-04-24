import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { storage } from "./storage";

// Create a Google OAuth client
const client = new OAuth2Client();

/**
 * Verify a Google OAuth token and authenticate the user
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
    console.log(`Processing OAuth Google auth request from ${domain || 'unknown domain'} (attempt: ${attemptNumber || 1})`);
    console.log(`Auth data: uid=${uid}, email=${email}, name=${displayName}, emailVerified=${emailVerified}`);
    
    // Extra logging for custom domain
    const isCustomDomain = domain === "scootme.ferransson.com";
    const isReplitDomain = domain?.includes('replit');
    
    if (isCustomDomain || isReplitDomain) {
      console.log(`⚠️ ${isCustomDomain ? 'CUSTOM' : 'REPLIT'} DOMAIN AUTH REQUEST - ${origin}`);
      console.log(`📱 REQUEST DETAILS:`, {
        method: 'OAuth',
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
    if (!email || !token || !uid) {
      console.error("Missing required fields:", { 
        token: !!token, 
        uid: !!uid, 
        email: !!email
      });
      return res.status(400).json({ 
        error: "Missing required fields", 
        detail: `Required: email, uid, and token for OAuth authentication.`
      });
    }
    
    // Verify the OAuth access token
    let verifiedEmail = null;
    
    try {
      // Validate access token by calling Google's userinfo API
      const googleResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`
      );
      
      if (!googleResponse.ok) {
        throw new Error(`Google API request failed with status: ${googleResponse.status}`);
      }
      
      const userInfo = await googleResponse.json() as { email?: string };
      
      if (!userInfo || typeof userInfo.email !== 'string') {
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
      
      console.log(`✅ OAuth token verified successfully for: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OAuth token verification failed:", errorMessage);
      return res.status(401).json({ 
        error: "Token verification failed", 
        detail: errorMessage
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
          providerAccountId: uid, // Google user ID
          balance: 0 // Start with zero balance
        });
        
        if (isCustomDomain) {
          console.log(`✨ CUSTOM DOMAIN - Created new user from Google OAuth:`, {
            id: user.id,
            email: email,
            username: username
          });
        } else {
          console.log(`Created new user from Google OAuth: ${email}`);
        }
      } catch (createError: unknown) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        console.error("Failed to create user:", errorMessage);
        return res.status(500).json({ 
          error: "Failed to create user account", 
          detail: errorMessage
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
          console.log(`Logged in existing user via Google OAuth: ${email}`);
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
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Google OAuth auth error:", error);
    return res.status(401).json({ 
      error: "Authentication failed", 
      detail: errorMessage || "Unknown error occurred"
    });
  }
}