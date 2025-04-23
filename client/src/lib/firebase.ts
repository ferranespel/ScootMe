import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { apiRequest } from "./queryClient";

// Firebase configuration
// IMPORTANT: We explicitly use the firebase auth domain as authDomain
// instead of the current domain to avoid auth issues
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // Always use the Firebase domain for authDomain to avoid issues with Replit domains
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: any;
let auth: any;
let googleProvider: any;

try {
  // Log the Firebase config and current domain for debugging
  console.log("Firebase config:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  
  console.log("Current domain:", window.location.hostname);
  console.log("Full URL:", window.location.href);
  console.log("Origin:", window.location.origin);
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Add scopes for Google authentication
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  
  // Force account selection each time and add debug parameters
  googleProvider.setCustomParameters({
    prompt: 'select_account',
    // Add login_hint if we have a saved email to speed up the process
    login_hint: localStorage.getItem('last_login_email') || undefined,
    // Store the domain for verification later
    state: window.location.hostname,
    // Ensure proper redirect back to our auth page
    redirect_uri: window.location.origin + '/auth'
  });
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

/**
 * Check for redirect result on page load
 * This should be called when the application initializes
 */
export async function checkRedirectResult() {
  if (!auth) {
    console.error("Firebase authentication not initialized");
    return null;
  }

  try {
    console.log("Checking for Google sign-in redirect result...");
    console.log("Current URL:", window.location.href);
    console.log("Current domain:", window.location.hostname);
    console.log("Current origin:", window.location.origin);
    
    // Get the redirect result safely
    let result;
    try {
      console.log("Attempting to get redirect result...");
      // Add debug info about URL parameters
      console.log("URL search params:", window.location.search);
      console.log("URL hash:", window.location.hash);
      
      result = await getRedirectResult(auth);
      console.log("Raw redirect result:", result ? "Success" : "No result");
      
      // Check for specific error indicators in URL
      if (window.location.search.includes("error=")) {
        console.error("Error parameter detected in URL:", window.location.search);
        // Parse the error message from URL if possible
        const urlParams = new URLSearchParams(window.location.search);
        const errorMsg = urlParams.get("error");
        throw new Error(`Authentication redirect error: ${errorMsg || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error getting redirect result:", error);
      // Display error notification for debugging
      alert(`Failed to get Google redirect result. This usually happens when the domain isn't authorized in Firebase console. Please add "${window.location.hostname}" to Firebase authorized domains.`);
      return null;
    }
    
    // If no result found, return null with more detailed info
    if (!result) {
      console.log("No redirect result found, but no errors detected");
      // Check if we have any Firebase error info in local storage
      const storedError = localStorage.getItem("firebase_auth_error");
      if (storedError) {
        console.error("Found stored Firebase error:", storedError);
        localStorage.removeItem("firebase_auth_error"); // Clear the error
        alert(`Previous authentication attempt failed: ${storedError}`);
      }
      return null;
    }

    console.log("Google sign-in redirect successful!");
    
    // Extract user data
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    if (!user || !user.email) {
      console.error("Invalid user data from redirect result");
      throw new Error("Unable to get user information from Google");
    }
    
    // Call our backend to create/login user
    return await sendUserDataToBackend(user, token);
    
  } catch (error) {
    console.error("Firebase redirect result error:", error);
    handleAuthError(error);
    return null;
  }
}

/**
 * Start Google authentication process
 * Uses different strategies for mobile and desktop
 */
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    console.error("Firebase authentication not initialized");
    throw new Error("Authentication service is not available. Please try again later.");
  }

  try {
    console.log("Starting Google sign-in with Firebase...");
    
    // IMPORTANT: Use redirect method for ALL devices until we resolve the domain authorization issues
    const forceMobileFlow = true; 
    
    // Detect if running on mobile (but we're forcing redirect for all devices right now)
    const isMobile = forceMobileFlow || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Print mobile detection details
    console.log("Mobile detection:", {
      forceMobileFlow,
      userAgent: navigator.userAgent,
      isMobileDetected: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      finalDecision: isMobile
    });
    
    // Mobile: always use redirect for better compatibility
    if (isMobile) {
      console.log("Mobile device detected, using redirect auth");
      try {
        // Store current timestamp before redirect to help debugging
        localStorage.setItem("firebase_auth_attempt", Date.now().toString());
        
        // Set up custom parameters to help with debugging
        googleProvider.setCustomParameters({
          prompt: 'select_account',
          state: window.location.hostname, // Pass hostname as state for debugging
          // Make sure we redirect back to our site's auth page
          redirect_uri: window.location.origin + '/auth'
        });
        
        console.log("Starting redirect with provider:", googleProvider);
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect, this won't execute
      } catch (error: any) {
        console.error("Mobile redirect error:", error);
        // Store error for future debugging
        if (error && error.code) {
          localStorage.setItem("firebase_auth_error", `${error.code}: ${error.message}`);
        }
        handleAuthError(error);
        return null;
      }
    }
    
    // Desktop: try popup first, fallback to redirect
    console.log("Desktop device detected, trying popup auth");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get user data
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      if (!user || !user.email) {
        throw new Error("Unable to get user information from Google");
      }
      
      // Call our backend to create/login user
      return await sendUserDataToBackend(user, token);
      
    } catch (popupError) {
      console.error("Popup auth failed, falling back to redirect:", popupError);
      
      // Special case: if popup was blocked, use redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request') {
        
        console.log("Using redirect auth as fallback");
        
        // Store current timestamp before redirect to help debugging
        localStorage.setItem("firebase_auth_attempt", Date.now().toString());
        localStorage.setItem("firebase_auth_fallback", "true");
        
        // Set up custom parameters to help with debugging
        googleProvider.setCustomParameters({
          prompt: 'select_account',
          state: `fallback-${window.location.hostname}`, // Pass hostname as state for debugging
          // Make sure we redirect back to our site's auth page
          redirect_uri: window.location.origin + '/auth'
        });
        
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect, this won't execute
      }
      
      // For other errors, propagate them
      handleAuthError(popupError);
      return null;
    }
  } catch (error) {
    console.error("Firebase auth error:", error);
    
    // Store error for debugging
    if (error && (error.code || error.message)) {
      localStorage.setItem("firebase_auth_error", `${error.code || 'unknown'}: ${error.message || 'No message'}`);
    }
    
    handleAuthError(error);
    return null;
  }
}

/**
 * Send authenticated user data to our backend
 */
async function sendUserDataToBackend(user, token) {
  try {
    console.log("Sending user data to backend...");
    
    const response = await apiRequest("POST", "/api/auth/firebase/google", {
      token: token,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend authentication error:", errorText);
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }
    
    const userData = await response.json();
    console.log("Backend authentication successful");
    return userData;
  } catch (error) {
    console.error("Error sending user data to backend:", error);
    throw error;
  }
}

/**
 * Handle authentication errors with user-friendly messages
 */
function handleAuthError(error) {
  const errorCode = error.code || '';
  const errorMessage = error.message || 'Unknown error';
  
  console.error("Auth error details:", {
    code: errorCode,
    message: errorMessage,
    details: error
  });
  
  let userMessage = "Google sign-in failed. Please try again.";
  
  if (errorCode === 'auth/unauthorized-domain') {
    userMessage = `This domain (${window.location.hostname}) is not authorized for authentication. Add exactly this domain to Firebase console's authorized domains list.`;
    console.error("Domain authorization issue. Please add the following domain to Firebase authorized domains list:", window.location.hostname);
    // Alert with specific instructions
    alert(`Authentication Error: The domain "${window.location.hostname}" must be added to Firebase authorized domains list under Authentication > Settings in the Firebase console.`);
  } else if (errorCode === 'auth/configuration-not-found') {
    userMessage = "Authentication configuration not found. Please ensure Google sign-in is enabled in your Firebase project.";
  } else if (errorCode === 'auth/network-request-failed') {
    userMessage = "Network connection error. Please check your internet connection and try again.";
  } else if (errorCode === 'auth/popup-blocked') {
    userMessage = "Popup was blocked by your browser. Please allow popups for this site or try the phone authentication method.";
  } else if (errorCode === 'auth/cancelled-popup-request' || errorCode === 'auth/popup-closed-by-user') {
    userMessage = "Sign-in was cancelled. Please try again.";
  }
  
  throw new Error(userMessage);
}