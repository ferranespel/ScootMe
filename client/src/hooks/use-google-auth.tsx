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
      // Get auth URL from backend
      const response = await apiRequest("GET", "/api/auth/google/url");
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get Google auth URL: ${errorText}`);
      }
      
      const { url } = await response.json();
      
      if (!url) {
        throw new Error("No authentication URL returned from server");
      }
      
      // Store current time in localStorage to detect when we return
      localStorage.setItem("google_auth_started", Date.now().toString());
      
      // Redirect to Google OAuth
      window.location.href = url;
      
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
  
  // Check if we just returned from Google auth
  const checkAuthReturn = () => {
    // Check for error parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    
    if (error) {
      setStatus("error");
      setMessage(error);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // Check if we just returned from Google auth (based on localStorage timestamp)
    const authStartedStr = localStorage.getItem("google_auth_started");
    if (authStartedStr) {
      const authStarted = parseInt(authStartedStr);
      const timeSinceAuth = Date.now() - authStarted;
      
      // If less than 5 minutes passed, we probably just returned
      if (timeSinceAuth < 300000) {
        // Check if we're logged in now
        apiRequest("GET", "/api/user")
          .then(async (res) => {
            if (res.ok) {
              const user = await res.json();
              queryClient.setQueryData(["/api/user"], user);
              setStatus("success");
              setMessage("Successfully logged in with Google");
            } else {
              setStatus("error");
              setMessage("Login was not successful");
            }
          })
          .catch(() => {
            setStatus("error");
            setMessage("Failed to verify login status");
          });
      }
      
      // Clear the flag
      localStorage.removeItem("google_auth_started");
    }
  };
  
  return {
    status,
    message,
    checkAuthReturn,
  };
}