import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";

export function useGoogleAuth() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Starting direct Google authentication");
      
      // Get auth URL from backend
      const response = await apiRequest("GET", "/api/auth/google/url");
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get Google auth URL: ${errorText}`);
      }
      
      const { url } = await response.json();
      console.log("Received Google auth URL:", url.substring(0, 50) + "...");
      
      if (!url) {
        throw new Error("No authentication URL returned from server");
      }
      
      // Store current time and URL in localStorage to detect when we return
      localStorage.setItem("google_auth_started", Date.now().toString());
      localStorage.setItem("google_auth_url", url);
      
      // Log the redirect URI for debugging
      console.log("Current window location:", window.location.toString());
      console.log("Redirecting to Google auth URL...");
      
      // Redirect to Google OAuth - use a slight delay to ensure console logs are visible
      setTimeout(() => {
        window.location.href = url;
      }, 500);
      
    } catch (error) {
      console.error("Google auth error:", error);
      setError(error instanceof Error ? error.message : "Authentication failed");
      setIsLoading(false);
      
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Could not start Google authentication",
        variant: "destructive",
      });
    }
  };

  return {
    startGoogleAuth,
    isLoading,
    error,
  };
}

// Helper hook to detect if we just returned from a Google auth flow
export function useGoogleAuthCallback() {
  const [status, setStatus] = useState<"success" | "error" | "none">("none");
  const [message, setMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Check if we just returned from Google auth
  const checkAuthReturn = () => {
    console.log("Checking if returned from Google auth");
    
    // Check for error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    
    if (error) {
      console.log("Found error in URL params:", error);
      setStatus("error");
      setMessage(error);
      
      toast({
        title: "Google Authentication Failed",
        description: error,
        variant: "destructive",
      });
      
      // Clear the URL parameter to avoid showing the error again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // Check if we just returned from Google auth (based on localStorage timestamp)
    const authStartedStr = localStorage.getItem("google_auth_started");
    const authUrl = localStorage.getItem("google_auth_url");
    
    if (authStartedStr && authUrl) {
      console.log("Google auth session found in localStorage");
      const authStarted = parseInt(authStartedStr);
      const timeSinceAuth = Date.now() - authStarted;
      
      // If less than 5 minutes passed, we probably just returned
      if (timeSinceAuth < 300000) {
        console.log("Recent auth attempt detected, checking login status...");
        
        // Check if we're logged in now
        apiRequest("GET", "/api/user")
          .then(async (res) => {
            if (res.ok) {
              const user = await res.json();
              console.log("User logged in successfully:", user.id);
              
              // Update the user in the query cache
              queryClient.setQueryData(["/api/user"], user);
              setStatus("success");
              setMessage("Successfully logged in with Google");
              
              toast({
                title: "Authentication Successful",
                description: "You have been logged in with Google",
                variant: "default",
              });
            } else {
              console.log("Login status check failed:", res.status);
              setStatus("error");
              setMessage("Login was not successful");
              
              toast({
                title: "Authentication Failed",
                description: "Google login was not successful. Please try again.",
                variant: "destructive",
              });
            }
          })
          .catch((err) => {
            console.error("Error checking login status:", err);
            setStatus("error");
            setMessage("Failed to verify login status");
            
            toast({
              title: "Authentication Error",
              description: "Could not verify login status. Please try again.",
              variant: "destructive",
            });
          });
      } else {
        console.log("Auth timestamp too old:", timeSinceAuth);
      }
      
      // Clear the Google auth data from localStorage
      localStorage.removeItem("google_auth_started");
      localStorage.removeItem("google_auth_url");
    } else {
      console.log("No Google auth session found in localStorage");
    }
  };
  
  return {
    status,
    message,
    checkAuthReturn,
  };
}