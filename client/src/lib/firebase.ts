import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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
  // Log the exact values to debug
  console.log("Firebase config:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  
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

// Google Sign-in function
export async function signInWithGoogle() {
  if (!auth || !googleProvider) {
    console.error("Firebase authentication not initialized");
    throw new Error("Authentication service is not available. Please try again later.");
  }

  try {
    console.log("Starting Google sign-in with Firebase...");
    
    // Sign in with popup
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful");
    
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
    
    console.error("Firebase Google Sign-in error:", {
      code: errorCode,
      message: errorMessage,
      details: error
    });
    
    // Create a user-friendly error message based on the error code
    let userMessage = "Google sign-in failed. Please try again.";
    
    if (errorCode === 'auth/popup-closed-by-user') {
      userMessage = "Sign-in was cancelled. Please try again.";
    } else if (errorCode === 'auth/popup-blocked') {
      userMessage = "Sign-in popup was blocked. Please allow popups for this site and try again.";
    } else if (errorCode === 'auth/unauthorized-domain') {
      userMessage = "This domain is not authorized for authentication. Please contact support.";
    }
    
    throw new Error(userMessage);
  }
}