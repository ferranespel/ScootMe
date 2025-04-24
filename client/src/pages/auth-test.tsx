import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, AlertTriangle } from "lucide-react";

// Auth test page for Passport.js OAuth

export default function AuthTestPage() {
  const { user, googleLoginMutation } = useAuth();
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [directStatus, setDirectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use localStorage to track which auth method was used
  useEffect(() => {
    const storedMethod = localStorage.getItem('auth_method_used');
    if (storedMethod) {
      setTestStatus(`Authentication completed with ${storedMethod}`);
    }
  }, []);

  // Firebase method has been removed entirely
  // Now using only direct Passport.js OAuth

  // Start Google login with Direct OAuth
  const startDirectLogin = async () => {
    setDirectStatus("loading");
    try {
      // Store authentication method
      localStorage.setItem('auth_method_used', 'Direct OAuth');
      
      // Import direct auth function
      const { signInWithGoogle } = await import("@/lib/direct-auth");
      
      // Start Google sign-in process
      await signInWithGoogle();
      
      // If we got here (no redirect happened), consider it a success
      // Most likely we'll redirect and not reach this point
      setDirectStatus("success");
    } catch (error) {
      console.error("Direct auth error:", error);
      setDirectStatus("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  // Clear authentication data
  const clearAuthData = () => {
    // Remove all auth-related data from localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_success_timestamp');
    localStorage.removeItem('auth_redirect_from');
    localStorage.removeItem('auth_origin');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth_method_used');
    
    // Reload the page to clear any in-memory state
    window.location.reload();
  };

  // Test direct authentication
  const startTest = startDirectLogin;

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>Current user authentication status</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-600">
                <Check size={20} /> 
                <span className="font-medium">Authenticated</span>
              </div>
              <div>
                <p><strong>Name:</strong> {user.fullName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Provider:</strong> {user.providerId || 'Direct'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle size={20} /> 
              <span>Not authenticated</span>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {user ? (
            <Button variant="outline" onClick={clearAuthData}>
              Clear Authentication Data
            </Button>
          ) : (
            <Button asChild>
              <Link href="/auth">Go to Login Page</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication Method Test</CardTitle>
          <CardDescription>Test different authentication methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Test Google OAuth authentication using Passport.js on the backend.
              This will redirect to Google's OAuth page and then back to the app.
            </p>
            <div className="flex items-center gap-2">
              <Button onClick={startDirectLogin} disabled={directStatus === "loading"}>
                {directStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test Authentication
              </Button>
              {directStatus === "success" && <Check className="text-green-600" />}
              {directStatus === "error" && <AlertTriangle className="text-red-600" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: Firebase authentication has been fully replaced with Passport.js.
            </p>
          </div>
          
          {testStatus && (
            <Alert className="mt-4">
              <AlertTitle>Authentication Test Result</AlertTitle>
              <AlertDescription>{testStatus}</AlertDescription>
            </Alert>
          )}
          
          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}