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
  googleLoginMutation: UseMutationResult<SelectUser, Error, void>;
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
  
  // Check for Firebase redirect result and localStorage when component mounts
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // First check if we have a current user - if so, no need to restore from localStorage
        if (user) {
          console.log("User already authenticated via session");
          return;
        }

        // Dynamically import to avoid loading Firebase on every page
        const { checkRedirectResult } = await import("@/lib/firebase");
        const userData = await checkRedirectResult();
        
        if (userData) {
          // If we got user data from a redirect, update the auth state
          console.log("Found user from redirect, updating auth state");
          queryClient.setQueryData(["/api/user"], userData);
          toast({
            title: "Login successful",
            description: `Welcome to ScootMe, ${userData.fullName}!`,
          });
          return;
        }
        
        // If no redirect result, check localStorage as a fallback
        try {
          const storedUserJson = localStorage.getItem('auth_user');
          if (storedUserJson) {
            const storedUser = JSON.parse(storedUserJson);
            
            if (storedUser && storedUser.id && storedUser.email) {
              console.log("Restoring user from localStorage");
              
              // Verify the user's session is still valid by making an API call
              try {
                const res = await fetch('/api/user', { credentials: 'include' });
                if (res.ok) {
                  // Session is still valid, use the latest user data
                  const latestUserData = await res.json();
                  queryClient.setQueryData(["/api/user"], latestUserData);
                  console.log("User session verified and restored");
                } else {
                  // Session expired, but we can try to use the stored user to re-authenticate
                  console.log("Session expired, trying to reuse stored auth credentials");
                  queryClient.setQueryData(["/api/user"], storedUser);
                  
                  // Silently trigger a refetch to confirm this user is still valid
                  refetch();
                }
              } catch (apiError) {
                console.error("Error verifying user session:", apiError);
                // Still use stored user data but mark for refetch
                queryClient.setQueryData(["/api/user"], storedUser);
              }
            }
          }
        } catch (storageError) {
          console.error("Error reading from localStorage:", storageError);
        }
      } catch (error: any) {
        console.error("Error handling authentication state:", error);
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
      queryClient.setQueryData(["/api/user"], user);
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

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      // Import firebase auth functions dynamically to avoid loading them on every page
      const { signInWithGoogle } = await import("@/lib/firebase");
      try {
        const userData = await signInWithGoogle();
        return userData;
      } catch (error) {
        console.error("Firebase Google sign-in error:", error);
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome to ScootMe, ${user.fullName}!`,
      });
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
