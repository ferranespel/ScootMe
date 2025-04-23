import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { apiRequest } from "./queryClient";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: any;
let auth: any;
let googleProvider: any;

try {
  // Log the exact values and domain to debug
  console.log("Firebase config:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  
  // Log the current domain for Firebase authorization
  console.log("Current domain:", window.location.hostname);
  console.log("Full URL:", window.location.href);
  console.log("Origin:", window.location.origin);
  
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    throw new Error("Firebase API key is missing");
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  // Add scopes to request more permissions if needed
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
  googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
  
  // Prompt selection to ensure user gets to choose the account every time
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Auto-check for redirect result on page load
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
    
    // Check if we have a redirect result
    const result = await getRedirectResult(auth).catch(error => {
      console.error("Error getting redirect result:", error);
      return null;
    });
    
    // If no result found, log it and return null
    if (!result) {
      console.log("No redirect result found");
      return null;
    }

    console.log("Google sign-in redirect successful, got result:", result);
    
    // Get the Google user's token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const user = result.user;
    
    console.log("User authenticated with Firebase:", {
      uid: user.uid,
      email: user.email ? "Provided" : "Missing",
      displayName: user.displayName ? "Provided" : "Missing",
      photoURL: user.photoURL ? "Provided" : "Missing",
    });
    
    // If successful, send user info to our backend to create/login user
    console.log("Sending user data to backend for authentication...");
    const response = await apiRequest("POST", "/api/auth/firebase/google", {
      token: token,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend authentication failed:", errorText);
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }
    
    const userData = await response.json();
    console.log("Backend authentication successful", userData);
    return userData;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    const errorCode = error.code;
    const errorMessage = error.message;
    
    console.error("Firebase Google Sign-in redirect error:", {
      code: errorCode,
      message: errorMessage,
      details: error
    });
    
    // Create a user-friendly error message based on the error code
    let userMessage = "Google sign-in failed. Please try again.";
    
    if (errorCode === 'auth/unauthorized-domain') {
      userMessage = "This domain is not authorized for authentication. Please visit Firebase console and add this domain to authorized domains list.";
      console.error("Domain authorization error. Make sure to add these domains to Firebase console:", {
        currentHost: window.location.host,
        currentOrigin: window.location.origin,
        currentHostname: window.location.hostname
      });
    } else if (errorCode === 'auth/configuration-not-found') {
      userMessage = "Authentication configuration not found. Please ensure Google sign-in is enabled in your Firebase project.";
    } else if (errorCode === 'auth/operation-not-allowed') {
      userMessage = "Google sign-in is not enabled for this Firebase project. Please enable it in the Firebase console.";
    }
    
    throw new Error(userMessage);
  }
}

// Google Sign-in function - Dual approach (popup for desktop, redirect for mobile)
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    console.error("Firebase authentication not initialized");
    throw new Error("Authentication service is not available. Please try again later.");
  }

  try {
    // Log more domain information for debugging
    console.log("Starting Google sign-in with Firebase...");
    console.log("Auth domain:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
    console.log("Current origin:", window.location.origin);
    console.log("Current hostname:", window.location.hostname);
    console.log("Auth provider ready:", !!googleProvider);
    console.log("Auth instance ready:", !!auth);
    
    // Print all authorized domains from Firebase config if available
    if (auth) {
      console.log("Firebase auth config:", auth.config);
      console.log("Firebase app:", app?.options);
      console.log("Firebase auth:", auth);
    }
    
    // Add dynamic origin to allowed domains
    googleProvider.setCustomParameters({
      prompt: 'select_account',
      // Add the current origin as a valid redirect URI
      login_hint: window.location.hostname
    });

    // Detect if running on mobile (simpler approach)
    const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // On mobile, always use redirect to avoid popup issues
    if (isMobile) {
      console.log("Mobile detected, using redirect auth method");
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect to Google at this point, so no additional code will execute
      return null;
    }
    
    // For desktop, use popup first
    try {
      console.log("Desktop detected, using popup auth method");
      const result = await signInWithPopup(auth, googleProvider);
      
      // Get the user's data
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      const user = result.user;
      
      if (user) {
        console.log("User authenticated with Firebase via popup:", {
          uid: user.uid,
          email: user.email ? "Provided" : "Missing",
          displayName: user.displayName ? "Provided" : "Missing",
        });
        
        // If successful, send user info to our backend to create/login user
        console.log("Sending user data to backend for authentication...");
        const response = await apiRequest("POST", "/api/auth/firebase/google", {
          token: token,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        });
        
        const userData = await response.json();
        console.log("Backend authentication successful");
        return userData;
      }
      
      return null;
    } catch (popupError: any) {
      console.error("Popup auth failed, falling back to redirect:", popupError);
      
      // Use redirect as fallback for all errors on desktop too
      console.log("Using redirect auth as fallback");
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect to Google at this point, so no additional code will execute
      return null;
    }
  } catch (error: any) {
    // Handle specific Firebase auth errors
    const errorCode = error.code;
    const errorMessage = error.message;
    
    console.error("Firebase Google Sign-in error:", {
      code: errorCode,
      message: errorMessage,
      details: error
    });
    
    // Create a user-friendly error message based on the error code
    let userMessage = "Google sign-in failed. Please try again.";
    
    if (errorCode === 'auth/unauthorized-domain') {
      userMessage = "This domain is not authorized for authentication. Please add this domain to Firebase authorized domains list.";
      console.error("Domain authorization issue. Current domain:", window.location.hostname);
    } else if (errorCode === 'auth/configuration-not-found') {
      userMessage = "Authentication configuration not found. Please ensure Google sign-in is enabled in your Firebase project.";
    } else if (errorCode === 'auth/network-request-failed') {
      userMessage = "Network connection error. Please check your internet connection and try again.";
    } else if (errorCode === 'auth/popup-blocked') {
      // Instead of throwing an error, we'll just try redirect silently
      console.log("Popup blocked, trying redirect silently...");
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else if (errorCode === 'auth/cancelled-popup-request' || errorCode === 'auth/popup-closed-by-user') {
      userMessage = "Sign-in cancelled. Please try again.";
    }
    
    throw new Error(userMessage);
  }
}