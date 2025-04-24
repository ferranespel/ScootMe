import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { apiRequest } from "./queryClient";

// Add special logging for the new custom domain
const isCustomDomain = window.location.hostname === "scootme.ferransson.com";
console.log("DOMAIN DETECTION:", {
  hostname: window.location.hostname,
  isCustomDomain,
  fullUrl: window.location.href,
  origin: window.location.origin,
  protocol: window.location.protocol
});

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
  
  // Initialize Firebase with enhanced configuration
  const enhancedConfig = {
    ...firebaseConfig,
    // Extended configuration to help with auth issues
    appVerificationDisabledForTesting: process.env.NODE_ENV !== 'production', // Allow easier testing
  };
  
  app = initializeApp(enhancedConfig);
  
  // Get auth with persistence settings to help with cookie issues
  auth = getAuth(app);
  
  // Configure auth settings to be more permissive
  auth.settings.appVerificationDisabledForTesting = process.env.NODE_ENV !== 'production';
  
  // Create Google provider with enhanced configuration
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
    // Use special encoding for redirect info
    // This helps avoid third-party cookie issues
    redirect_uri: window.location.origin + '/auth',
    // Added parameter to avoid cookie restrictions in some browsers
    cookie_policy: 'none'
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
  try {
    console.log("Checking for Google sign-in redirect result...");
    console.log("Current URL:", window.location.href);
    console.log("Current domain:", window.location.hostname);
    console.log("Current origin:", window.location.origin);
    
    // Determine if we're on a Replit domain
    const isReplitDomain = window.location.hostname.includes('replit') || 
                         window.location.hostname.includes('repl.co') || 
                         window.location.hostname.includes('kirk.replit') ||
                         window.location.hostname.includes('.id.repl');
    
    // Special handling for custom domain
    const isCustomDomain = window.location.hostname === "scootme.ferransson.com";
    
    // Log all query parameters and hash fragments for debugging
    console.log("Attempting to get redirect result...");
    console.log("URL search params:", window.location.search);
    console.log("URL hash:", window.location.hash);
    
    // First, check if we have a direct OAuth response in the URL hash
    const hashString = window.location.hash.substring(1); // Remove the # character
    if (hashString) {
      console.log("Found hash string, checking for direct OAuth response");
      
      // Parse the hash parameters
      const hashParams: Record<string, string> = {};
      const hashFragments = hashString.split('&');
      hashFragments.forEach(fragment => {
        const parts = fragment.split('=');
        if (parts.length === 2) {
          hashParams[parts[0]] = decodeURIComponent(parts[1]);
        }
      });
      
      console.log("Hash parameters:", hashParams);
      
      // Check if this is a direct OAuth response (it will have access_token and token_type)
      if (hashParams.access_token && hashParams.token_type === 'Bearer') {
        console.log("Direct OAuth response detected!");
        
        try {
          // Use the access token to get user information
          const accessToken = hashParams.access_token;
          
          // Call Google's userinfo endpoint to get user details
          const response = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
          );
          
          if (!response.ok) {
            throw new Error(`Google API error: ${response.status}`);
          }
          
          const userData = await response.json();
          console.log("Received user data from Google API:", {
            email: userData.email,
            name: userData.name,
            picture: userData.picture ? 'present' : 'missing',
            sub: userData.sub
          });
          
          if (!userData.email || !userData.sub) {
            throw new Error("Invalid user data from Google API");
          }
          
          // Create a user object similar to what Firebase would provide
          const directUser = {
            uid: userData.sub,
            email: userData.email,
            displayName: userData.name,
            photoURL: userData.picture,
            emailVerified: true // Google OAuth verifies emails
          };
          
          // Clear the hash to avoid reprocessing on page refresh
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // Call our backend to create/login user with directOAuth flag
          return await sendUserDataToBackend(directUser, accessToken, true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error("Direct OAuth processing error:", errorMessage);
          return null;
        }
      }
    }
    
    // If no direct OAuth response, check for Firebase redirect result
    // but only if Firebase authentication is initialized
    if (auth) {
      let result;
      try {
        result = await getRedirectResult(auth);
        console.log("Raw Firebase redirect result:", result ? "Success" : "No result");
        
        // If no result found, return null
        if (!result) {
          console.log("No Firebase redirect result found");
          return null;
        }
        
        console.log("Firebase Google sign-in redirect successful!");
        
        // Extract user data
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        
        if (!user || !user.email) {
          console.error("Invalid user data from Firebase redirect result");
          throw new Error("Unable to get user information from Google");
        }
        
        // Call our backend to create/login user
        return await sendUserDataToBackend(user, token);
      } catch (error) {
        console.error("Firebase redirect result error:", error instanceof Error ? error.message : String(error));
        
        // Don't display alert in production, only log the error
        console.error(`Failed to get Google redirect result. Make sure "${window.location.hostname}" is added to Firebase authorized domains.`);
        return null;
      }
    } else {
      console.log("Firebase authentication not initialized, skipping Firebase redirect check");
    }
    
    // Check for stored user in localStorage (from previous auth)
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        console.log("Found authenticated user data in localStorage");
        
        // Check if the stored data has the expected fields to avoid using corrupted data
        if (userData && userData.id && userData.email) {
          console.log("Restoring user session from localStorage");
          return userData;
        } else {
          console.log("Stored user data is incomplete, not restoring session");
        }
      }
    } catch (e) {
      console.warn("Error restoring user from localStorage:", e);
    }
    
    return null;
  } catch (error) {
    console.error("Redirect result error:", error instanceof Error ? error.message : String(error));
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
    
    // Set this to false if you want to try popup auth on desktop
    // Should always be true for Replit preview domains
    const forceMobileFlow = true; 
    
    // Special handling for custom domain
    const isCustomDomain = window.location.hostname === "scootme.ferransson.com";
    
    // Get the current domain for the auth request
    const currentDomain = window.location.hostname;
    // Check for both replit.dev and repl.co domains
    const isReplitDomain = currentDomain.includes('replit') || 
                          currentDomain.includes('repl.co') || 
                          currentDomain.includes('kirk.replit') ||
                          currentDomain.includes('.id.repl');
    
    // Detect if running on mobile (but we're forcing redirect for all devices right now)
    const isMobile = forceMobileFlow || isCustomDomain || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Print mobile detection details
    console.log("Authentication flow detection:", {
      forceMobileFlow,
      isCustomDomain,
      isReplitDomain,
      userAgent: navigator.userAgent.substring(0, 50) + "...", // Truncate to avoid huge logs
      isMobileDetected: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      finalDecision: isMobile ? "REDIRECT" : "POPUP"
    });
    
    // Enhanced logging for custom domain
    if (isCustomDomain) {
      console.log("⚠️ CUSTOM DOMAIN AUTH - Using redirect flow for scootme.ferransson.com");
      console.log("📍 Current location:", {
        origin: window.location.origin,
        pathname: window.location.pathname,
        hostname: window.location.hostname,
        href: window.location.href
      });
    }
    
    // Fix for Replit domains - always use direct Google auth URL for Replit domains
    // This avoids the "accounts.google.com refused to connect" error
    if (isReplitDomain) {
      console.log("Using direct Google OAuth for Replit domain");
      
      // Use direct Google OAuth URL instead of Firebase
      // This avoids issues with accounts.google.com connections on Replit
      const googleClientId = "403092122141-tg7itgdjjf4fgh95ldh95i3nv9f82mf9.apps.googleusercontent.com"; // Public ID, safe to include
      const redirectUri = encodeURIComponent(`${window.location.origin}/auth`);
      const scope = encodeURIComponent("email profile");
      const responseType = "token";
      const state = encodeURIComponent(`direct-oauth-${window.location.hostname}`);
      
      const directGoogleUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}&state=${state}&prompt=select_account`;
      
      console.log("Redirecting to direct Google OAuth URL:", directGoogleUrl);
      
      // Do the redirect  
      window.location.href = directGoogleUrl;
      return null;
    }
    
    // Mobile or custom domain: always use redirect for better compatibility
    if (isMobile) {
      console.log("Using redirect auth flow");
      try {
        // Store current timestamp before redirect to help debugging
        localStorage.setItem("firebase_auth_attempt", Date.now().toString());
        localStorage.setItem("firebase_auth_origin", window.location.origin);
        localStorage.setItem("firebase_auth_pathname", window.location.pathname);
        
        // Always clear any previous errors
        localStorage.removeItem("firebase_auth_error");
        
        // Set up custom parameters to help with debugging
        const customParameters: any = {
          prompt: 'select_account',
          state: `auth-${window.location.hostname}`, // Pass hostname as state for debugging
        };
        
        // Add redirect_uri parameter for custom domain
        if (isCustomDomain) {
          // For custom domain, explicitly specify redirect URI
          const redirectUri = `${window.location.origin}/auth`;
          console.log("🔀 Setting explicit redirect URI:", redirectUri);
          customParameters.redirect_uri = redirectUri;
        }
        
        // Add login_hint if we have a saved email
        const lastEmail = localStorage.getItem('last_login_email');
        if (lastEmail) {
          customParameters.login_hint = lastEmail;
        }
        
        googleProvider.setCustomParameters(customParameters);
        
        console.log("Starting redirect with provider:", {
          providerId: googleProvider.providerId,
          customParameters
        });
        
        await signInWithRedirect(auth, googleProvider);
        return null; // Page will redirect, this won't execute
      } catch (error: any) {
        console.error("Redirect auth error:", error);
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
 * @param user The user object from Firebase or direct OAuth
 * @param token The access token from Firebase or direct OAuth
 * @param directOAuth Whether this is from direct OAuth flow (true) or Firebase (false)
 */
async function sendUserDataToBackend(user: any, token: string | undefined, directOAuth: boolean = false) {
  const isCustomDomain = window.location.hostname === "scootme.ferransson.com";
  const isReplitDomain = window.location.hostname.includes('replit') || 
                        window.location.hostname.includes('repl.co') || 
                        window.location.hostname.includes('kirk.replit') ||
                        window.location.hostname.includes('.id.repl');
  
  try {
    console.log("Sending user data to backend...", directOAuth ? "(Direct OAuth)" : "(Firebase)");
    
    // Save auth state to local storage before API call for debugging
    localStorage.setItem('firebase_auth_success_time', Date.now().toString());
    
    // Store the email for future login hints
    if (user.email) {
      localStorage.setItem('last_login_email', user.email);
    }
    
    // Extra logging for custom domain
    if (isCustomDomain) {
      console.log("🔐 CUSTOM DOMAIN - Firebase auth successful, sending data to backend");
      console.log("📱 Auth user data:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        hasPhotoURL: !!user.photoURL,
        emailVerified: user.emailVerified,
        providerId: user.providerId,
        metadata: user.metadata ? {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        } : null
      });
    } else {
      // Log all fields except token for debugging
      console.log("User data being sent:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL ? "Yes" : "No",
        domain: window.location.hostname,
        origin: window.location.origin
      });
    }
    
    // Add some retry logic for custom domain
    let attempts = 0;
    const maxAttempts = isCustomDomain ? 3 : 1;
    let lastError: any = null;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        if (isCustomDomain && attempts > 1) {
          console.log(`🔄 CUSTOM DOMAIN - Retry attempt ${attempts}/${maxAttempts}`);
        }
        
        const response = await apiRequest("POST", "/api/auth/firebase/google", {
          token: token,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          domain: window.location.hostname, // Send domain info for logging
          origin: window.location.origin,    // Send origin for better debugging
          timestamp: Date.now(),
          attemptNumber: attempts,
          directOAuth: directOAuth // Include flag for direct OAuth flow
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Backend authentication error (attempt ${attempts}/${maxAttempts}):`, errorText);
          
          if (isCustomDomain) {
            // For custom domain, throw an error with detailed information
            throw new Error(`Server error: ${response.status} ${errorText}`);
          }
          
          // For regular domain, we should retry
          lastError = new Error(`Server error: ${response.status} ${errorText}`);
          
          // Wait before retry
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            throw lastError;
          }
        }
        
        const userData = await response.json();
        
        if (isCustomDomain) {
          console.log("🎉 CUSTOM DOMAIN - Backend authentication successful!", userData);
        } else {
          console.log("Backend authentication successful");
        }
        
        // Store additional data for session recovery in case of page reload
        localStorage.setItem('auth_success_timestamp', Date.now().toString());
        
        // Store authenticated user in localStorage to restore on page changes/reloads
        // This helps with maintaining the user state across redirects
        try {
          localStorage.setItem('auth_user', JSON.stringify(userData));
          console.log("Stored authenticated user data in localStorage");
        } catch (e) {
          console.warn("Failed to store user data in localStorage:", e);
        }
        
        return userData;
      } catch (error) {
        lastError = error;
        if (attempts >= maxAttempts) break;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If we got here, all attempts failed
    throw lastError || new Error("Failed to authenticate with the server after multiple attempts");
  } catch (error) {
    console.error("Error sending user data to backend:", error);
    
    if (isCustomDomain) {
      console.error("🚨 CUSTOM DOMAIN - Authentication failed in backend!", error);
      // Store error for debugging
      localStorage.setItem('auth_backend_error', JSON.stringify({
        message: error.message,
        time: new Date().toISOString(),
        origin: window.location.origin
      }));
    }
    
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