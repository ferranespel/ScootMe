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
  
  // Check for Firebase redirect result when component mounts
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        // Dynamically import to avoid loading Firebase on every page
        const { checkRedirectResult } = await import("@/lib/firebase");
        const userData = await checkRedirectResult();
        
        if (userData) {
          // If we got user data from a redirect, update the auth state
          queryClient.setQueryData(["/api/user"], userData);
          toast({
            title: "Login successful",
            description: `Welcome to ScootMe, ${userData.fullName}!`,
          });
        }
      } catch (error: any) {
        console.error("Error handling Firebase redirect:", error);
        toast({
          title: "Google login failed",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    
    checkRedirect();
  }, [toast]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
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
      queryClient.setQueryData(["/api/user"], user);
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
      queryClient.setQueryData(["/api/user"], null);
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
