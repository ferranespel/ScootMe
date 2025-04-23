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
    // Check if we have a redirect result
    const result = await getRedirectResult(auth);
    if (!result) {
      return null;
    }

    console.log("Google sign-in redirect successful");
    
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
    
    const userData = await response.json();
    console.log("Backend authentication successful");
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
      userMessage = "This domain is not authorized for authentication. Please add this domain to Firebase authorized domains list.";
    } else if (errorCode === 'auth/configuration-not-found') {
      userMessage = "Authentication configuration not found. Please ensure Google sign-in is enabled in your Firebase project.";
    }
    
    throw new Error(userMessage);
  }
}

// Google Sign-in function - Initiates the redirect flow
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    console.error("Firebase authentication not initialized");
    throw new Error("Authentication service is not available. Please try again later.");
  }

  try {
    console.log("Starting Google sign-in with Firebase (redirect)...");
    
    // For mobile, always use redirect method which works better than popup
    await signInWithRedirect(auth, googleProvider);
    
    // The page will redirect to Google at this point, so no additional code will execute
    // After redirect back, the checkRedirectResult function will handle the result
    return null;
  } catch (error: any) {
    // Handle specific Firebase auth errors
    const errorCode = error.code;
    const errorMessage = error.message;
    
    console.error("Firebase Google Sign-in redirect initiation error:", {
      code: errorCode,
      message: errorMessage,
      details: error
    });
    
    // Create a user-friendly error message based on the error code
    let userMessage = "Google sign-in failed. Please try again.";
    
    if (errorCode === 'auth/unauthorized-domain') {
      userMessage = "This domain is not authorized for authentication. Please add this domain to Firebase authorized domains list.";
    } else if (errorCode === 'auth/configuration-not-found') {
      userMessage = "Authentication configuration not found. Please ensure Google sign-in is enabled in your Firebase project.";
    }
    
    throw new Error(userMessage);
  }
}