/**
 * Direct Google OAuth authentication
 * Using Passport.js on the backend instead of Firebase
 */
import { apiRequest } from "./queryClient";

// Log for debugging
console.log("Using Direct Passport.js OAuth flow for Google authentication");

// Import and export from direct-auth.ts
import { 
  signInWithGoogle as directSignInWithGoogle,
  checkAuthenticationStatus 
} from './direct-auth';

// Export the imported functions
export { checkAuthenticationStatus };

/**
 * Sign in with Google using Passport.js
 * Uses redirect to server OAuth endpoint
 */
export async function signInWithGoogle() {
  console.log("Using google-auth.ts signInWithGoogle() -> redirecting to direct-auth version");
  return directSignInWithGoogle();
}

/**
 * Handle redirect result after Google OAuth
 * Call this when the app loads to check if we're returning from a redirect
 */
export async function handleRedirectResult() {
  console.log("Using google-auth.ts handleRedirectResult() -> redirecting to checkAuthenticationStatus");
  return checkAuthenticationStatus();
}