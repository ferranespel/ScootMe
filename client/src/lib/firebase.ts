/**
 * PASSPORT.JS AUTHENTICATION LAYER (NOT FIREBASE)
 * ===============================================
 * This file replaces the Firebase authentication with Passport.js OAuth
 * 
 * VERSION: 20240424-2
 * IMPORTANT: This file COMPLETELY OVERRIDES any Firebase functionality
 * DO NOT ATTEMPT TO USE FIREBASE FOR AUTHENTICATION
 */

// This script runs BEFORE any imports to ensure it captures everything
// Create a script element and execute it immediately to catch Firebase imports
const disableFirebaseScript = document.createElement('script');
disableFirebaseScript.textContent = `
  // Completely disable Firebase imports by overriding the import system
  const originalImport = window.importScripts;
  window.__FIREBASE_DISABLED__ = true;
  
  // Mock all Firebase modules to prevent any initialization
  window.firebase = {
    __DISABLED__: true,
    initializeApp: function() { 
      console.error("🛑 BLOCKED: Firebase initialization attempted but prevented by Passport.js layer");
      return {
        auth: () => mockAuth,
        firestore: () => ({ collection: () => ({}) }),
        __DISABLED__: true
      };
    },
    auth: function() {
      console.error("🛑 BLOCKED: Firebase auth access attempted but prevented by Passport.js layer");
      return mockAuth;
    },
    app: function() {
      console.error("🛑 BLOCKED: Firebase app access attempted but prevented by Passport.js layer");
      return { __DISABLED__: true };
    }
  };
  
  // Mock auth object used to replace Firebase auth
  const mockAuth = {
    __DISABLED__: true,
    onAuthStateChanged: function(callback) { 
      console.error("🛑 BLOCKED: Firebase onAuthStateChanged attempted but prevented");
      return () => {}; 
    },
    signInWithRedirect: function() { 
      console.error("🛑 BLOCKED: Firebase signInWithRedirect attempted but prevented");
      window.location.href = "/api/auth/google";
      return Promise.resolve(null); 
    },
    signInWithPopup: function() { 
      console.error("🛑 BLOCKED: Firebase signInWithPopup attempted but prevented");
      window.location.href = "/api/auth/google";
      return Promise.resolve(null); 
    },
    getRedirectResult: function() { 
      console.error("🛑 BLOCKED: Firebase getRedirectResult attempted but prevented");
      return Promise.resolve(null); 
    }
  };
  
  // Block any dynamic imports of Firebase
  const originalDynamicImport = window.eval;
  window.eval = function(code) {
    if (code.includes('firebase') || code.includes('Firebase')) {
      console.error("🛑 BLOCKED: Attempted dynamic import of Firebase via eval");
      return null;
    }
    return originalDynamicImport.apply(this, arguments);
  };
  
  // Override any ES module loaders that might import Firebase
  if (window.System && window.System.import) {
    const originalSystemImport = window.System.import;
    window.System.import = function(moduleName) {
      if (moduleName.includes('firebase')) {
        console.error("🛑 BLOCKED: Attempted System.import of Firebase module:", moduleName);
        return Promise.resolve({
          initializeApp: () => ({ __DISABLED__: true }),
          auth: () => mockAuth
        });
      }
      return originalSystemImport.apply(this, arguments);
    };
  }
  
  // Show message in console that Firebase is disabled
  console.warn("%c🔒 SECURITY: Firebase has been completely disabled and replaced with Passport.js OAuth", 
    "background: #721c24; color: white; padding: 8px; font-size: 14px; font-weight: bold; border-radius: 3px;");
`;

// Append and execute the script immediately
document.head.appendChild(disableFirebaseScript);

// Import the actual Passport.js-based authentication
import { signInWithGoogle as directSignInWithGoogle, checkAuthenticationStatus } from './direct-auth';

/**
 * Log authentication info
 */
function logInfo() {
  // LOUDLY announce that we are NOT using Firebase
  console.log("%c🔐 AUTHENTICATION: Using Passport.js OAuth (NOT Firebase)", 
    "background: #28a745; color: white; padding: 6px; font-size: 14px; font-weight: bold; border-radius: 3px;");
  
  // Domain detection logs (for troubleshooting)
  console.log("ℹ️ DOMAIN INFO:", {
    hostname: window.location.hostname,
    isCustomDomain: window.location.hostname === "scootme.ferransson.com",
    fullUrl: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol
  });

  // Authentication configuration
  console.log("📋 AUTH CONFIG:", {
    provider: "Google OAuth",
    method: "Passport.js",
    directAuth: true,
    usingSession: true,
    usingFirebase: false,
    version: "20240424-2"
  });
}

// Execute logs when this module is imported
logInfo();

// Check for redirect result on page load
console.log("Checking for Google sign-in redirect result...");
console.log("Current URL:", window.location.href);
console.log("Current origin:", window.location.origin);
console.log("Attempting to get redirect result...");
console.log("URL search params:", window.location.search);
console.log("URL hash:", window.location.hash);

/**
 * Compatability function for previous authentication implementations
 * Redirects to the direct-auth version that uses Passport.js
 */
export function signInWithGoogle() {
  console.log("=== AUTHENTICATION FLOW START ===");
  console.log("Using Passport.js OAuth flow for authentication (NOT Firebase)");
  console.log("Redirecting to server-side OAuth endpoint: /api/auth/google");
  console.log("=== AUTHENTICATION FLOW END ===");
  return directSignInWithGoogle();
}

/**
 * Compatibility function for checking authentication status after redirect
 * Uses the Passport.js session-based authentication
 */
export async function checkRedirectResult() {
  console.log("Current URL:", window.location.pathname + window.location.search);
  try {
    // Call the direct auth version that works with Passport.js
    const result = await checkAuthenticationStatus();
    
    // If we have a result, return it in a compatibility format
    if (result) {
      console.log("Found authenticated user after redirect:", result.email);
      return {
        user: {
          uid: result.id.toString(),
          email: result.email,
          displayName: result.fullName,
          emailVerified: result.isEmailVerified
        }
      };
    }
    
    console.log("Redirect check result:", "No authentication data found");
    console.log("No authentication session data found, but no errors detected");
    return null;
  } catch (error) {
    console.error("Error checking redirect result:", error);
    throw error;
  }
}

// Export the checkAuthenticationStatus function for direct access
export { checkAuthenticationStatus };