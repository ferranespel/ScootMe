import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleAuth, useGoogleAuthCallback } from "@/hooks/use-google-auth";
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

export default function AuthPage() {
  const { t } = useTranslation();
  const { 
    user, 
    isLoading, 
    phoneLoginMutation, 
    phoneVerifyMutation
  } = useAuth();
  const { startGoogleAuth, isLoading: isGoogleLoading } = useGoogleAuth();
  const { checkAuthReturn } = useGoogleAuthCallback();
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

  // Handle Google login using the direct method
  const handleGoogleLogin = () => {
    startGoogleAuth();
  };
  
  // Check if we returned from Google auth
  useEffect(() => {
    checkAuthReturn();
  }, []);

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
              <Button 
                variant="outline" 
                className="flex items-center justify-center gap-2 h-12"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
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