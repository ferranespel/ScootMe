/**
 * Direct Google OAuth authentication
 * Using Passport.js on the backend instead of Firebase
 */
import { apiRequest } from "./queryClient";

// Log for debugging
console.log("Using Direct Passport.js OAuth flow for Google authentication");

/**
 * Sign in with Google using Passport.js
 * Uses redirect to server OAuth endpoint
 */
export async function signInWithGoogle() {
  try {
    // Store current path for potential return after auth
    const currentPath = window.location.pathname;
    localStorage.setItem('auth_redirect_from', currentPath);
    localStorage.setItem('auth_timestamp', Date.now().toString());
    
    console.log("Starting direct Google OAuth flow with Passport.js");
    
    // Redirect to our backend OAuth endpoint
    window.location.href = "/api/auth/google";
    
    return null; // This won't execute as the page will redirect
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * Handle redirect result after Google OAuth
 * Call this when the app loads to check if we're returning from a redirect
 */
export async function handleRedirectResult() {
  try {
    console.log("Checking for Passport.js OAuth redirect result...");
    
    // Check for success or error query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('success');
    const authError = urlParams.get('error');
    
    // Handle error case
    if (authError) {
      console.error("OAuth error from query params:", authError);
      throw new Error(`Authentication error: ${authError}`);
    }
    
    // Handle success case
    if (authSuccess === 'true') {
      console.log("OAuth success detected in URL parameters");
      
      // Fetch the current user from the server
      const response = await fetch('/api/user', { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get user data: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log("Got authenticated user data:", userData.email);
      
      // Clean up URL by removing auth params
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      
      return userData;
    }
    
    // Also check if we've been redirected recently (within last 5 seconds)
    const lastAuthTime = Number(localStorage.getItem('auth_timestamp') || '0');
    const timeSinceAuth = Date.now() - lastAuthTime;
    
    if (lastAuthTime && timeSinceAuth < 5000) {
      console.log("Recent OAuth redirect detected, checking authentication status");
      
      // Check if we're authenticated by fetching user data
      const response = await fetch('/api/user', { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Successfully fetched user data after redirect");
        return userData;
      }
    }
    
    console.log("No OAuth redirect result found");
    return null;
  } catch (error) {
    console.error("Error handling OAuth redirect:", error);
    throw error;
  }
}