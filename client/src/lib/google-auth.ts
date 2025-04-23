import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { apiRequest } from "./queryClient";

// Simple Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app, auth, provider;

try {
  console.log("Initializing Firebase with:", {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  });
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  
  // Configure provider
  provider.addScope('email');
  provider.addScope('profile');
  
  console.log("Firebase initialized");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

/**
 * Sign in with Google
 * Uses redirect for better mobile compatibility
 */
export async function signInWithGoogle() {
  if (!auth || !provider) {
    throw new Error("Firebase auth not initialized");
  }

  try {
    // Always use redirect for better cross-platform compatibility
    await signInWithRedirect(auth, provider);
    return null; // This won't execute as the page will redirect
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * Handle redirect result
 * Call this when the app loads to check if we're returning from a redirect
 */
export async function handleRedirectResult() {
  if (!auth) {
    throw new Error("Firebase auth not initialized");
  }

  try {
    console.log("Checking for redirect result...");
    const result = await getRedirectResult(auth);
    
    if (!result) {
      console.log("No redirect result found");
      return null;
    }
    
    console.log("Got redirect result:", result.user.email);
    
    // Get authentication data
    const user = result.user;
    const token = await user.getIdToken();
    
    // Call backend to create or log in the user
    const response = await apiRequest("POST", "/api/auth/google", {
      token,
      email: user.email,
      name: user.displayName,
      photoUrl: user.photoURL
    });
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error handling redirect:", error);
    throw error;
  }
}