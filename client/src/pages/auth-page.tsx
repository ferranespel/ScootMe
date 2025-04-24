import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneLoginSchema } from "@shared/schema";
import { Loader2, Phone, AlertCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { detectCurrentDomain } from "@/lib/domain-detector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";
import { PhoneInput } from "@/components/phone-input";
// Using direct auth instead of Firebase
import { checkAuthenticationStatus } from "@/lib/direct-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { t } = useTranslation();
  const { 
    user, 
    isLoading, 
    phoneLoginMutation, 
    phoneVerifyMutation, 
    googleLoginMutation
  } = useAuth();
  const [, navigate] = useLocation();
  const [phoneStep, setPhoneStep] = useState<"phoneEntry" | "codeVerification">("phoneEntry");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Phone Login form
  const phoneForm = useForm<z.infer<typeof phoneLoginSchema>>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  // Phone Verification form
  const verificationForm = useForm({
    defaultValues: {
      code: "",
    },
  });

  const onPhoneLoginSubmit = (values: z.infer<typeof phoneLoginSchema>) => {
    setPhoneNumber(values.phoneNumber);
    phoneLoginMutation.mutate(values, {
      onSuccess: () => {
        setPhoneStep("codeVerification");
      }
    });
  };

  const onVerificationSubmit = (values: { code: string }) => {
    phoneVerifyMutation.mutate({
      phoneNumber,
      code: values.code
    });
  };

  // Handle Google login
  const handleGoogleLogin = () => {
    googleLoginMutation.mutate();
  };

  const { toast } = useToast();

  // Domain detection for Firebase auth debugging
  const [domainInfo, setDomainInfo] = useState<any>(null);
  const [showDomainDebugger, setShowDomainDebugger] = useState(false);
  
  // Check for Firebase redirect result and handle logged in status
  useEffect(() => {
    // If already authenticated, redirect to home page
    if (user) {
      navigate("/");
      return;
    }
    
    // Detect current domain for debugging
    const domainData = detectCurrentDomain();
    setDomainInfo(domainData);
    
    // Auto-show domain debugger in development
    if (process.env.NODE_ENV === 'development') {
      setShowDomainDebugger(true);
    }
    
    // Check if we have a direct OAuth response in the hash fragment
    // This is for the alternative direct Google OAuth flow
    const checkDirectOAuthResponse = async () => {
      if (window.location.hash && window.location.hash.includes('access_token=')) {
        try {
          console.log("Direct Google OAuth response detected in URL hash");
          
          // Parse hash parameters
          const params = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = params.get('access_token');
          
          if (!accessToken) {
            throw new Error("No access token found in OAuth response");
          }
          
          // Get user info from Google using the access token
          const userInfoResponse = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
          );
          
          if (!userInfoResponse.ok) {
            throw new Error("Failed to get user info from Google API");
          }
          
          const userInfo = await userInfoResponse.json();
          
          if (!userInfo.email) {
            throw new Error("No email found in Google user info");
          }
          
          // Call our backend to create/login user
          console.log("Sending direct Google OAuth user data to backend");
          const response = await apiRequest("POST", "/api/auth/firebase/google", {
            token: accessToken,
            uid: userInfo.sub,
            email: userInfo.email,
            displayName: userInfo.name,
            photoURL: userInfo.picture,
            emailVerified: true,
            domain: window.location.hostname,
            origin: window.location.origin,
            timestamp: Date.now(),
            directOAuth: true
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} ${errorText}`);
          }
          
          const userData = await response.json();
          console.log("Direct OAuth login successful");
          
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          
          // Clear the hash to avoid processing the token again on refresh
          window.history.replaceState(
            null, 
            document.title, 
            window.location.pathname + window.location.search
          );
          
          navigate("/");
          return true;
        } catch (error: any) {
          console.error("Direct OAuth error:", error);
          setShowDomainDebugger(true);
          toast({
            title: "Authentication failed",
            description: error.message || "Failed to log in with Google",
            variant: "destructive",
          });
          return false;
        }
      }
      return false;
    };

    // Check for Passport.js redirect result
    const checkAuthRedirect = async () => {
      try {
        // First check if we have a direct OAuth response
        const handled = await checkDirectOAuthResponse();
        if (handled) return;
        
        // This will check if we're being redirected back from Passport.js
        const user = await checkAuthenticationStatus();
        
        if (user) {
          console.log("Successfully authenticated with Passport.js");
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          navigate("/");
        } else {
          // No redirect result, normal page load
          console.log("No authentication redirect result found");
        }
      } catch (error: any) {
        console.error("Authentication redirect error:", error);
        // Show domain debugger on error
        setShowDomainDebugger(true);
        toast({
          title: "Authentication failed",
          description: error.message || "Failed to log in with Google",
          variant: "destructive",
        });
      }
    };

    checkAuthRedirect();
  }, [user, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-secondary/5">
      {/* Language selector in top-left */}
      <div className="absolute top-4 left-4 z-10">
        <LanguageSelector variant="minimal" />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Logo and App Name */}
        <div className="mb-12 flex flex-col items-center">
          <div className="flex items-center justify-center w-24 h-24 bg-primary rounded-full mb-4">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-white"
            >
              <path 
                d="M3.05493 11H10L12 14H19.9451M6.5 18C6.5 19.1046 5.60457 20 4.5 20C3.39543 20 2.5 19.1046 2.5 18C2.5 16.8954 3.39543 16 4.5 16C5.60457 16 6.5 16.8954 6.5 18ZM20.5 18C20.5 19.1046 19.6046 20 18.5 20C17.3954 20 16.5 19.1046 16.5 18C16.5 16.8954 17.3954 16 18.5 16C19.6046 16 20.5 16.8954 20.5 18ZM14.5 6L16.5 9H21.5L19.5 6H14.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ScootMe
          </h1>
          <p className="text-lg text-center mt-2">{t('auth.tagline')}</p>
        </div>
        
        {/* Auth Card */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {t('auth.welcome')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.loginDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="grid gap-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12"
                onClick={handleGoogleLogin}
                disabled={googleLoginMutation.isPending}
              >
                {googleLoginMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FcGoogle className="h-5 w-5" />
                )}
                <span>{t('auth.continueWithGoogle')}</span>
              </Button>
            </div>
            
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative bg-white px-4 text-sm text-gray-500">
                {t('auth.orContinueWith')}
              </div>
            </div>
            
            {/* Phone Authentication */}
            {phoneStep === "phoneEntry" ? (
              <form onSubmit={phoneForm.handleSubmit(onPhoneLoginSubmit)} className="space-y-4">
                <div className="text-center mb-2">
                  <h3 className="text-lg font-medium">{t('auth.phoneLoginTitle')}</h3>
                  <p className="text-sm text-gray-500">{t('auth.phoneLoginDescription')}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Controller
                    name="phoneNumber"
                    control={phoneForm.control}
                    render={({ field, fieldState }) => (
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        error={fieldState.error?.message}
                      />
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 flex items-center gap-2 mt-2" 
                  disabled={phoneLoginMutation.isPending}
                >
                  {phoneLoginMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{t('auth.sendingCode')}</span>
                    </>
                  ) : (
                    <>
                      <Phone className="h-5 w-5" />
                      <span>{t('auth.continueWithPhone')}</span>
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-gray-500">
                  {t('auth.smsRatesApply')}
                </p>
              </form>
            ) : (
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">{t('auth.enterVerificationCode')}</h3>
                  <p className="text-sm text-gray-500">
                    {t('auth.codeSentTo')} <span className="font-medium">{phoneNumber}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="verification-code" className="text-center block">
                      {t('auth.verificationCode')}
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-widest"
                      {...verificationForm.register("code")}
                    />
                    <p className="text-xs text-center text-gray-500">
                      {t('auth.codeExpiry')}
                    </p>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12" 
                  disabled={phoneVerifyMutation.isPending}
                >
                  {phoneVerifyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span>{t('auth.verifying')}</span>
                    </>
                  ) : (
                    t('auth.verify')
                  )}
                </Button>
                
                <div className="flex flex-col gap-2 items-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="w-full" 
                    onClick={() => setPhoneStep("phoneEntry")}
                  >
                    {t('auth.backToPhoneEntry')}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="text-primary"
                    onClick={() => {
                      // Resend code functionality
                      if (phoneNumber) {
                        phoneLoginMutation.mutate({ phoneNumber });
                      }
                    }}
                    disabled={phoneLoginMutation.isPending}
                  >
                    {phoneLoginMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    {t('auth.resendCode')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-500 text-center">
              {t('auth.termsText')}
            </p>
            
            {/* Link to auth test page for debugging */}
            <div className="mt-4 text-center">
              <Link href="/auth-test" className="text-sm text-primary hover:underline">
                Test Authentication Methods
              </Link>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <div className="w-full mt-2">
                <a 
                  href="/auth-test" 
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center"
                >
                  Debug Authentication
                </a>
              </div>
            )}
            
            {/* Domain debugger for Firebase auth */}
            {showDomainDebugger && domainInfo && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Google Authentication Issue</AlertTitle>
                <AlertDescription className="mt-2">
                  <p className="text-sm mb-2">Domain information for Firebase:</p>
                  <code className="block bg-gray-100 p-2 text-xs rounded overflow-auto">
                    {domainInfo.domain}
                  </code>
                  <p className="text-sm mt-2">
                    Please make sure this domain is added to Firebase authorized domains.
                  </p>
                  <Button
                    variant="outline" 
                    size="sm"
                    className="mt-2 bg-white text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      // Try to fix the issue by clearing any cookies
                      localStorage.removeItem('firebase_auth_error');
                      localStorage.removeItem('firebase_auth_attempt');
                      document.cookie.split(";").forEach(function(c) {
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                      });
                      // Force reload without cache
                      window.location.reload();
                    }}
                  >
                    Clear Cookies & Reload
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}