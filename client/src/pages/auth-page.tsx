import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { registerSchema, loginSchema } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      phoneNumber: "",
      balance: 25,
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-secondary p-8 text-white flex flex-col justify-center items-center lg:h-screen">
        <div className="max-w-md text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <div className="flex items-center space-x-2">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-8 w-8 text-white"
              >
                <path 
                  d="M3.05493 11H10L12 14H19.9451M6.5 18C6.5 19.1046 5.60457 20 4.5 20C3.39543 20 2.5 19.1046 2.5 18C2.5 16.8954 3.39543 16 4.5 16C5.60457 16 6.5 16.8954 6.5 18ZM20.5 18C20.5 19.1046 19.6046 20 18.5 20C17.3954 20 16.5 19.1046 16.5 18C16.5 16.8954 17.3954 16 18.5 16C19.6046 16 20.5 16.8954 20.5 18ZM14.5 6L16.5 9H21.5L19.5 6H14.5Z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              <h1 className="text-3xl font-bold">ScootMe</h1>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Urban Mobility Simplified</h2>
          <p className="text-lg mb-8">
            Rent electric scooters on-demand at the tap of a button. 
            Quick, sustainable, and affordable rides for your daily commute.
          </p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="text-center bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold text-xl">Easy to Use</h3>
              <p className="mt-2 text-sm">Scan, ride, and park anywhere in the city</p>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-lg">
              <h3 className="font-bold text-xl">Eco-Friendly</h3>
              <p className="mt-2 text-sm">Zero emissions for a greener urban environment</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Forms */}
      <div className="flex-1 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Welcome to ScootMe
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="johndoe"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-red-500 text-sm">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-fullname">Full Name</Label>
                    <Input
                      id="register-fullname"
                      type="text"
                      placeholder="John Doe"
                      {...registerForm.register("fullName")}
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="text-red-500 text-sm">
                        {registerForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="john@example.com"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="johndoe"
                      {...registerForm.register("username")}
                    />
                    {registerForm.formState.errors.username && (
                      <p className="text-red-500 text-sm">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-red-500 text-sm">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone Number (Optional)</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="+354 123 4567"
                      {...registerForm.register("phoneNumber")}
                    />
                    {registerForm.formState.errors.phoneNumber && (
                      <p className="text-red-500 text-sm">
                        {registerForm.formState.errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col items-center">
            <p className="text-sm text-gray-500">
              By signing in or creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
