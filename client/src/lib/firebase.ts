/**
 * OAuth authentication compatibility layer
 * This file provides a compatibility layer for code previously using Firebase
 * All authentication now uses direct OAuth with Passport.js
 */

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

  // Auth config logs (compatibility with older code)
  console.log("Auth config:", {
    provider: "Google OAuth",
    method: "Passport.js",
    directAuth: true,
    usingSession: true
  });

  // Additional logging for debugging
  console.log("Current domain:", window.location.hostname);
  console.log("Full URL:", window.location.href);
  console.log("Origin:", window.location.origin);
  console.log("OAuth authentication initialized successfully");
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
  console.log("Using Passport.js OAuth flow for authentication");
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