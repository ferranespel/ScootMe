import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
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
import { Loader2, Phone } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/language-selector";
import { PhoneInput } from "@/components/phone-input";
import { useGoogleAuth, useGoogleAuthCallback } from "@/hooks/use-google-auth";

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

  // State to track Google auth error message
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  
  // Direct Google Auth hooks
  const { 
    startGoogleAuth: startDirectGoogleAuth, 
    isLoading: directGoogleAuthLoading,
    error: directGoogleAuthError 
  } = useGoogleAuth();
  
  const { 
    status: googleAuthCallbackStatus, 
    message: googleAuthCallbackMessage,
    checkAuthReturn 
  } = useGoogleAuthCallback();
  
  // Effect to check for OAuth return and domain validity on initial load
  useEffect(() => {
    const domain = window.location.hostname;
    
    // Check if we've already notified about this domain
    const hasNotifiedAboutDomain = localStorage.getItem('firebase_domain_notification');
    
    if (!hasNotifiedAboutDomain && domain.includes('replit')) {
      // Set a flag to avoid showing this again
      localStorage.setItem('firebase_domain_notification', 'true');
      
      // Show a notification about domain authorization
      const notification = `Important: This application uses Google authentication which requires domain authorization.

Your current domain is: ${domain}

If you experience authentication issues, please add this domain to Firebase authorized domains list in the Firebase console.`;
      
      // Display notification
      setTimeout(() => {
        alert(notification);
      }, 1000);
    }
  }, []);
  
  // Handle Google login
  const handleGoogleLogin = () => {
    setGoogleAuthError(null); // Clear any previous errors
    
    // Check for Firebase API key and Auth Domain
    if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
      console.error("Missing Firebase environment variables");
      setGoogleAuthError("Firebase configuration is missing. Please check environment variables.");
      return;
    }
    
    // Pre-check for domain authorization issues
    const domain = window.location.hostname;
    const knownAuthorizedDomains = [
      "localhost",
      "127.0.0.1",
      "scootme-22a67.firebaseapp.com",
      "replit.app", 
      "replit.dev"
    ];
    
    // Check if current domain is likely authorized
    const isDomainLikelyAuthorized = knownAuthorizedDomains.some(authDomain => 
      domain === authDomain || domain.endsWith('.' + authDomain)
    );
    
    if (!isDomainLikelyAuthorized) {
      console.warn("Domain likely not authorized in Firebase:", domain);
      // We'll still try the authentication, but warn the user first
      const proceedAnyway = window.confirm(
        `Warning: Your current domain (${domain}) might not be authorized in Firebase.\n\n` +
        `This will likely result in an authentication error.\n\n` +
        `Do you want to proceed anyway?\n\n` +
        `(Click "Cancel" to use phone authentication instead)`
      );
      
      if (!proceedAnyway) {
        return;
      }
    }
    
    // Proceed with Google login
    googleLoginMutation.mutate(undefined, {
      onError: (error) => {
        console.error("Google login error:", error);
        if (error.message.includes("unauthorized-domain") || error.message.includes("domain is not authorized")) {
          // Provide specific error message and instructions for domain authorization
          setGoogleAuthError(
            `${t('auth.domainNotAuthorized')} ${domain}\n${t('auth.addDomainInstructions')}`
          );
        } else {
          setGoogleAuthError(error.message);
        }
      }
    });
  };

  // Check for direct Google auth return
  useEffect(() => {
    // Check if we've just returned from Google OAuth
    checkAuthReturn();
    
    // Display success/error messages from direct Google auth
    if (googleAuthCallbackStatus === "success") {
      // Success notification could be displayed here if needed
      console.log("Direct Google auth successful:", googleAuthCallbackMessage);
    } else if (googleAuthCallbackStatus === "error" && googleAuthCallbackMessage) {
      setGoogleAuthError(googleAuthCallbackMessage);
    }
  }, [checkAuthReturn, googleAuthCallbackStatus, googleAuthCallbackMessage]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

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
              {/* Firebase Google Auth (has domain restrictions) */}
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
                <span>{t('auth.continueWithGoogle')} (Firebase)</span>
              </Button>
              
              {/* Direct Google OAuth option (alternative) */}
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12 border-primary/20 hover:bg-primary/5"
                onClick={startDirectGoogleAuth}
                disabled={directGoogleAuthLoading}
              >
                {directGoogleAuthLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FcGoogle className="h-5 w-5" />
                )}
                <span>{t('auth.continueWithGoogle')} (Direct)</span>
              </Button>
              
              {/* Google auth error message */}
              {googleAuthError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mt-2">
                  <h4 className="font-semibold mb-1">Google Authentication Error</h4>
                  <p className="whitespace-pre-line">{googleAuthError}</p>
                  
                  {googleAuthError.includes("domain") || googleAuthError.includes("unauthorized") ? (
                    <div className="mt-3 p-3 bg-background/40 rounded text-xs border border-destructive/20">
                      <strong className="block text-sm mb-2">Firebase Domain Setup Required:</strong>
                      <p className="mb-2">This Replit domain must be added to Firebase authorized domains list:</p>
                      
                      <div className="bg-background p-2 rounded font-mono text-xs mb-3 overflow-x-auto">
                        {window.location.hostname}
                      </div>
                      
                      <ol className="list-decimal ml-4 space-y-1 mb-3">
                        <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Firebase Console</a></li>
                        <li>Select project: <strong>scootme-22a67</strong></li>
                        <li>Go to Authentication → Settings → Authorized domains</li>
                        <li>Add the domain shown above exactly as written</li>
                        <li>Save changes and refresh this page</li>
                      </ol>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-destructive/20">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Try the Direct Google option above or use phone authentication.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 bg-background/40 rounded text-xs">
                      <p>Please try again or use another authentication method.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Direct Google auth error */}
              {directGoogleAuthError && !googleAuthError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mt-2">
                  <h4 className="font-semibold mb-1">Direct Google Authentication Error</h4>
                  <p>{directGoogleAuthError}</p>
                  <div className="mt-2 text-xs">
                    Please try again or use another authentication method.
                  </div>
                </div>
              )}
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
          <CardFooter className="flex flex-col items-center">
            <p className="text-sm text-gray-500 text-center">
              {t('auth.termsText')}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
