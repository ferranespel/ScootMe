import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Check, AlertTriangle } from "lucide-react";

// Test modes
type TestMode = "firebase" | "direct" | "both";

export default function AuthTestPage() {
  const { user, googleLoginMutation } = useAuth();
  const [testMode, setTestMode] = useState<TestMode>("direct");
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [directStatus, setDirectStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [firebaseStatus, setFirebaseStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Use localStorage to track which auth method was used
  useEffect(() => {
    const storedMethod = localStorage.getItem('auth_method_used');
    if (storedMethod) {
      setTestStatus(`Authentication completed with ${storedMethod}`);
    }
  }, []);

  // Start Google login with Firebase (old method)
  const startFirebaseLogin = async () => {
    setFirebaseStatus("loading");
    try {
      // Store authentication method
      localStorage.setItem('auth_method_used', 'Firebase');
      
      // Import firebase auth functions dynamically
      const { signInWithGoogle } = await import("@/lib/firebase");
      
      // Start Google sign-in process
      await signInWithGoogle();
      
      // If we got here (no redirect happened), consider it a success
      // Most likely we'll redirect and not reach this point
      setFirebaseStatus("success");
    } catch (error) {
      console.error("Firebase auth error:", error);
      setFirebaseStatus("error");
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

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
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_success_timestamp');
    localStorage.removeItem('firebase_auth_success_time');
    localStorage.removeItem('auth_method_used');
    
    // Reload the page to clear any in-memory state
    window.location.reload();
  };

  // Start appropriate test based on mode
  const startTest = () => {
    setTestStatus(null);
    setErrorMessage(null);
    
    if (testMode === "firebase") {
      startFirebaseLogin();
    } else if (testMode === "direct") {
      startDirectLogin();
    } else {
      // "both" mode - test both methods
      setDirectStatus("loading");
      setFirebaseStatus("loading");
      
      // Start with direct, then try Firebase if it fails
      startDirectLogin().catch(() => {
        startFirebaseLogin();
      });
    }
  };

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
          <Tabs defaultValue="direct" onValueChange={(value) => setTestMode(value as TestMode)}>
            <TabsList className="mb-4">
              <TabsTrigger value="direct">Direct OAuth</TabsTrigger>
              <TabsTrigger value="firebase">Firebase</TabsTrigger>
              <TabsTrigger value="both">Both (Fallback)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct">
              <div className="space-y-4">
                <p>
                  Test direct Google OAuth authentication without Firebase as a middleman.
                  This will redirect to Google's OAuth page and then back to the app.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={startTest} disabled={directStatus === "loading"}>
                    {directStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Direct Authentication
                  </Button>
                  {directStatus === "success" && <Check className="text-green-600" />}
                  {directStatus === "error" && <AlertTriangle className="text-red-600" />}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="firebase">
              <div className="space-y-4">
                <p>
                  Test Firebase Google authentication. This will redirect to Firebase's
                  authentication page and then back to the app.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={startTest} disabled={firebaseStatus === "loading"}>
                    {firebaseStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test Firebase Authentication
                  </Button>
                  {firebaseStatus === "success" && <Check className="text-green-600" />}
                  {firebaseStatus === "error" && <AlertTriangle className="text-red-600" />}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="both">
              <div className="space-y-4">
                <p>
                  Test authentication with fallback. This will try direct OAuth first,
                  and if that fails, it will try Firebase as a fallback.
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={startTest} disabled={directStatus === "loading" || firebaseStatus === "loading"}>
                    {(directStatus === "loading" || firebaseStatus === "loading") && 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Test With Fallback
                  </Button>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1">
                    <span>Direct:</span>
                    {directStatus === "idle" && <span>Idle</span>}
                    {directStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    {directStatus === "success" && <Check className="text-green-600" />}
                    {directStatus === "error" && <AlertTriangle className="text-red-600" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Firebase:</span>
                    {firebaseStatus === "idle" && <span>Idle</span>}
                    {firebaseStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    {firebaseStatus === "success" && <Check className="text-green-600" />}
                    {firebaseStatus === "error" && <AlertTriangle className="text-red-600" />}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
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