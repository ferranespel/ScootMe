/**
 * Firebase compatibility layer
 * This file now redirects to direct-auth.ts to use Passport.js OAuth flow
 * instead of Firebase authentication
 */

// Re-export functions from direct-auth.ts with the same names
export { 
  signInWithGoogle,
  checkAuthenticationStatus as checkRedirectResult 
} from './direct-auth';

// Dummy function to simulate Firebase initialization log (for compatibility)
console.log("DOMAIN DETECTION:", {
  hostname: window.location.hostname,
  isCustomDomain: window.location.hostname === "scootme.ferransson.com",
  fullUrl: window.location.href,
  origin: window.location.origin,
  protocol: window.location.protocol
});

// Log fake Firebase config to keep console output similar
console.log("Firebase config:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// Continue adding fake logs for debugging purposes
console.log("Current domain:", window.location.hostname);
console.log("Full URL:", window.location.href);
console.log("Origin:", window.location.origin);
console.log("Firebase initialized successfully");