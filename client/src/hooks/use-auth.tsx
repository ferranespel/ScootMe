import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  registerSchema, 
  loginSchema, 
  phoneLoginSchema, 
  phoneVerificationCodeSchema,
  User as SelectUser 
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  phoneLoginMutation: UseMutationResult<void, Error, PhoneLoginData>;
  phoneVerifyMutation: UseMutationResult<SelectUser, Error, PhoneVerifyData>;
  googleLoginMutation: UseMutationResult<SelectUser | null, Error, void>;
};

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type PhoneLoginData = z.infer<typeof phoneLoginSchema>;
type PhoneVerifyData = z.infer<typeof phoneVerificationCodeSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Check for authentication status when component mounts 
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // First check if we have a current user - if so, no need to restore from localStorage
        if (user) {
          console.log("User already authenticated via session");
          return;
        }

        // Dynamically import to avoid loading auth module on every page
        const { checkAuthenticationStatus } = await import("@/lib/direct-auth");
        const userData = await checkAuthenticationStatus();
        
        if (userData) {
          // If we got user data, update the auth state
          console.log("Found authenticated user, updating auth state");
          queryClient.setQueryData(["/api/user"], userData);
          
          // Only show toast if we've just completed authentication
          // (within the last 3 seconds)
          const recentAuthTimestamp = Number(localStorage.getItem('auth_success_timestamp') || '0');
          const isRecentAuth = Date.now() - recentAuthTimestamp < 3000;
          
          if (isRecentAuth) {
            toast({
              title: "Login successful",
              description: `Welcome to ScootMe, ${userData.fullName}!`,
            });
          }
          return;
        }
      } catch (error: any) {
        console.error("Error handling authentication state:", error);
        
        // Show an error message if we failed to process authentication
        toast({
          title: "Authentication error",
          description: error.message || "Failed to complete authentication",
          variant: "destructive",
        });
      }
    };
    
    checkAuthState();
  }, [toast, user, refetch]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Store user in localStorage for persistence across page reloads
      try {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_success_timestamp', Date.now().toString());
      } catch (e) {
        console.warn("Error storing auth data in localStorage:", e);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Store user in localStorage for persistence across page reloads
      try {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_success_timestamp', Date.now().toString());
      } catch (e) {
        console.warn("Error storing auth data in localStorage:", e);
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome to ScootMe, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Update the query cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all authentication data from localStorage
      try {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('firebase_auth_success_time');
        localStorage.removeItem('auth_success_timestamp');
        console.log("Cleared authentication data from localStorage");
      } catch (e) {
        console.warn("Error clearing auth data from localStorage:", e);
      }
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const phoneLoginMutation = useMutation({
    mutationFn: async (data: PhoneLoginData) => {
      const res = await apiRequest("POST", "/api/auth/phone/login", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification code sent",
        description: "Please check your phone for a verification code",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Phone login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const phoneVerifyMutation = useMutation({
    mutationFn: async (data: PhoneVerifyData) => {
      const res = await apiRequest("POST", "/api/auth/phone/verify", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update query cache
      queryClient.setQueryData(["/api/user"], user);
      
      // Store user in localStorage for persistence across page reloads
      try {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_success_timestamp', Date.now().toString());
      } catch (e) {
        console.warn("Error storing auth data in localStorage:", e);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome to ScootMe, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const googleLoginMutation = useMutation<SelectUser | null, Error, void>({
    mutationFn: async () => {
      // Import direct auth functions dynamically to avoid loading them on every page
      const { signInWithGoogle } = await import("@/lib/direct-auth");
      try {
        // This will redirect to Google authentication
        // We'll return to the app after successful auth
        signInWithGoogle();
        
        // We won't get here because of the redirect
        // The authentication status will be checked when we return to the app
        // in the useEffect hook above using checkAuthenticationStatus
        return null;
      } catch (error) {
        console.error("Google sign-in error:", error);
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    // Note: This onSuccess handler won't be called on direct OAuth flow
    // because we redirect away from the page. The user data will be
    // handled by the useEffect hook when we return to the app.
    onSuccess: (user: SelectUser | null) => {
      // Only proceed if we have user data (should be null in redirect flow)
      if (user) {
        // Update query cache
        queryClient.setQueryData(["/api/user"], user);
        
        // Store user in localStorage for persistence across page reloads
        try {
          localStorage.setItem('auth_user', JSON.stringify(user));
          localStorage.setItem('auth_success_timestamp', Date.now().toString());
        } catch (e) {
          console.warn("Error storing auth data in localStorage:", e);
        }
        
        toast({
          title: "Login successful",
          description: `Welcome to ScootMe, ${user.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        phoneLoginMutation,
        phoneVerifyMutation,
        googleLoginMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
