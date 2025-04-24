/**
 * Direct authentication services without Firebase
 * Uses the app's Passport.js setup for authentication
 */

/**
 * Start Google authentication by redirecting to the OAuth endpoint
 * This will show the actual app domain in the authorization screen
 */
export function signInWithGoogle() {
  // Get the current origin to handle redirects properly
  const origin = window.location.origin;
  const currentPath = window.location.pathname;
  
  // Store the current location for potential return after auth
  try {
    // Store redirect info in localStorage
    localStorage.setItem('auth_redirect_from', currentPath);
    localStorage.setItem('auth_origin', origin);
    localStorage.setItem('auth_timestamp', Date.now().toString());
  } catch (e) {
    console.warn("Failed to store auth redirect info:", e);
  }
  
  // Log the authentication attempt for debugging
  console.log("Starting direct Google OAuth authentication flow");
  console.log("Origin:", origin);
  
  // Redirect to our backend OAuth route
  // This will trigger Passport.js Google strategy
  window.location.href = "/api/auth/google";
  
  // Return null as we're redirecting away
  return null;
}

/**
 * Check for successful authentication after OAuth redirect
 * This should be called when the app initializes to check if we just completed auth
 */
export async function checkAuthenticationStatus() {
  try {
    // First check URL parameters for any oauth related info
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    
    if (authError) {
      console.error("Authentication error from query params:", authError);
      const errorMessage = authError === 'google-auth-failed' 
        ? "Google authentication failed. Please try again."
        : `Authentication error: ${authError}`;
      
      throw new Error(errorMessage);
    }
    
    // If we have a ?success=true param, we just completed authentication
    const authSuccess = urlParams.get('success');
    
    if (authSuccess === 'true') {
      console.log("Authentication success detected in URL parameters");
      
      // Fetch the current user data
      const response = await fetch('/api/user', { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Successfully fetched user data after authentication");
        
        // Store user data in localStorage for persistence
        try {
          localStorage.setItem('auth_user', JSON.stringify(userData));
          localStorage.setItem('auth_success_timestamp', Date.now().toString());
        } catch (e) {
          console.warn("Failed to store auth user in localStorage:", e);
        }
        
        // Clean up URL by removing auth params
        if (window.history && window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
        
        return userData;
      } else {
        console.error("Failed to fetch user data after authentication");
        throw new Error("Authentication succeeded but failed to get user data");
      }
    }
    
    // Also check if we've been redirected from passport auth (no query params)
    // We might have just completed authentication but Passport doesn't add query params
    
    // Check if we've just been authenticated (within last 5 seconds)
    // This helps if the server redirected us here after auth
    const lastRedirectTime = Number(localStorage.getItem('auth_timestamp'));
    const timeSinceRedirect = Date.now() - lastRedirectTime;
    
    // If we were redirected in the last 5 seconds, check our auth status
    if (lastRedirectTime && timeSinceRedirect < 5000) {
      console.log("Recent auth redirect detected, checking authentication status");
      
      // Check if we're authenticated
      const response = await fetch('/api/user', { 
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Successfully fetched user data after redirect");
        
        // Store user data in localStorage for persistence
        try {
          localStorage.setItem('auth_user', JSON.stringify(userData));
          localStorage.setItem('auth_success_timestamp', Date.now().toString());
        } catch (e) {
          console.warn("Failed to store auth user in localStorage:", e);
        }
        
        return userData;
      }
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
          
          // Verify the session by making an API call
          try {
            const response = await fetch('/api/user', { credentials: 'include' });
            if (response.ok) {
              // Session is still valid, return the latest user data
              return await response.json();
            }
          } catch (e) {
            console.warn("Error verifying session:", e);
          }
          
          // Return the stored user data as a fallback
          return userData;
        }
      }
    } catch (e) {
      console.warn("Error reading from localStorage:", e);
    }
    
    return null;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    throw error;
  }
}