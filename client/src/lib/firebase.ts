/**
 * OAuth authentication compatibility layer
 * This file provides a compatibility layer for code previously using Firebase
 * All authentication now uses direct OAuth with Passport.js
 * 
 * IMPORTANT: This is now the primary authentication module that should be
 * imported by other modules. It will load the direct-auth module and intercept
 * all the authentication calls to ensure they go through Passport.js.
 * 
 * Version: 20240424-1
 */

// Block any attempt to load the real Firebase
// This overrides the global Firebase namespace to prevent the actual Firebase SDK from initializing
// @ts-ignore
window.firebaseIsDisabled = true;
// @ts-ignore
window.firebaseBlocker = function() {
  console.warn("🚫 Firebase initialization attempted but blocked by compatibility layer");
  return {
    auth: () => ({
      onAuthStateChanged: () => {},
      signInWithRedirect: () => Promise.resolve(null),
      getRedirectResult: () => Promise.resolve(null)
    }),
    // Mock other Firebase services as needed
    app: () => ({}),
    firestore: () => ({})
  };
};

// If Firebase was already loaded somehow, replace it
if (typeof window !== 'undefined' && window.hasOwnProperty('firebase')) {
  console.warn("🚫 Replacing existing Firebase instance with Passport compatibility layer");
  // @ts-ignore
  window.firebase = window.firebaseBlocker();
}

import { signInWithGoogle as directSignInWithGoogle, checkAuthenticationStatus } from './direct-auth';

/**
 * Log for debugging purposes
 * This maintains log compatibility with previous implementations
 */
function logInfo() {
  // Domain detection logs (for debugging)
  console.log("DOMAIN DETECTION:", {
    hostname: window.location.hostname,
    isCustomDomain: window.location.hostname === "scootme.ferransson.com",
    fullUrl: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol
  });

  // Explicitly override Firebase config to prevent it from loading
  // This should appear in console logs to verify we're NOT using Firebase
  console.log("Auth config:", {
    provider: "Google OAuth",
    method: "Passport.js",
    directAuth: true,
    usingSession: true,
    usingFirebase: false
  });

  // Make it very clear in the logs that we're not using Firebase
  console.log("IMPORTANT: Firebase is DISABLED. Using Passport.js OAuth instead.");
  console.log("Current domain:", window.location.hostname);
  console.log("Full URL:", window.location.href);
  console.log("Origin:", window.location.origin);
  console.log("Passport.js OAuth authentication initialized successfully");
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