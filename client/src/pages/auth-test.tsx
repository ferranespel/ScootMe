import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const AuthTest = () => {
  const { user, isLoading, googleLoginMutation } = useAuth();
  const { toast } = useToast();
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  
  // Function to refresh localStorage data
  const refreshLocalStorageData = () => {
    const data: Record<string, string> = {};
    
    // Get all auth-related items from localStorage
    const authItems = [
      'auth_user',
      'auth_success_timestamp',
      'firebase_auth_success_time',
      'firebase_auth_attempt',
      'firebase_auth_origin',
      'firebase_auth_pathname',
      'firebase_auth_error',
      'last_login_email'
    ];
    
    authItems.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = key === 'auth_user' ? "(JSON Object - see parsed below)" : value;
        }
      } catch (e) {
        console.warn(`Error reading ${key} from localStorage:`, e);
      }
    });
    
    setLocalStorageData(data);
  };
  
  // Function to clear all auth data from localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_success_timestamp');
      localStorage.removeItem('firebase_auth_success_time');
      localStorage.removeItem('firebase_auth_attempt');
      localStorage.removeItem('firebase_auth_origin');
      localStorage.removeItem('firebase_auth_pathname');
      localStorage.removeItem('firebase_auth_error');
      localStorage.removeItem('last_login_email');
      
      refreshLocalStorageData();
      
      toast({
        title: "localStorage cleared",
        description: "All authentication data has been removed from localStorage",
      });
    } catch (e) {
      console.error("Error clearing localStorage:", e);
      toast({
        title: "Error",
        description: "Failed to clear localStorage: " + String(e),
        variant: "destructive",
      });
    }
  };
  
  // Refresh localStorage data on mount and when user changes
  useEffect(() => {
    refreshLocalStorageData();
  }, [user]);
  
  // Parse auth_user JSON for display
  const authUser = React.useMemo(() => {
    try {
      const authUserJson = localStorage.getItem('auth_user');
      return authUserJson ? JSON.parse(authUserJson) : null;
    } catch (e) {
      return null;
    }
  }, [localStorageData]);
  
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Session Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading authentication state...</p>
            ) : user ? (
              <div>
                <p className="text-green-600 font-semibold mb-2">✅ Authenticated</p>
                <div className="space-y-1">
                  <p><span className="font-semibold">User ID:</span> {user.id}</p>
                  <p><span className="font-semibold">Name:</span> {user.fullName}</p>
                  <p><span className="font-semibold">Email:</span> {user.email}</p>
                  <p><span className="font-semibold">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}</p>
                  {user.providerId && (
                    <p><span className="font-semibold">Auth Provider:</span> {user.providerId}</p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-semibold mb-2">❌ Not Authenticated</p>
                <p>No active session found.</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-stretch space-y-2">
            <Button 
              onClick={() => googleLoginMutation.mutate()} 
              disabled={googleLoginMutation.isPending}
              className="w-full"
            >
              {googleLoginMutation.isPending ? 'Signing in...' : 'Test Google Authentication'}
            </Button>
            <Link href="/auth" className="w-full">
              <Button variant="outline" className="w-full">
                Go to Auth Page
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>localStorage Authentication Data</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(localStorageData).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(localStorageData).map(([key, value]) => (
                  <div key={key} className="border-b pb-2">
                    <p className="font-semibold">{key}:</p>
                    <p className="text-sm overflow-x-auto whitespace-nowrap">{value}</p>
                  </div>
                ))}
                
                {authUser && (
                  <div className="mt-4 border-t pt-2">
                    <p className="font-semibold mb-2">Parsed auth_user data:</p>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-semibold">User ID:</span> {authUser.id}</p>
                      <p><span className="font-semibold">Name:</span> {authUser.fullName}</p>
                      <p><span className="font-semibold">Email:</span> {authUser.email}</p>
                      <p><span className="font-semibold">Provider:</span> {authUser.providerId || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>No authentication data found in localStorage.</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between space-x-2">
            <Button onClick={refreshLocalStorageData} variant="outline" className="flex-1">
              Refresh
            </Button>
            <Button onClick={clearLocalStorage} variant="destructive" className="flex-1">
              Clear localStorage
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Alert className="mb-6">
        <AlertTitle>Testing Instructions</AlertTitle>
        <AlertDescription className="text-sm">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click "Test Google Authentication" to test the login flow</li>
            <li>After login, check that both "Session Authentication Status" and "localStorage" show your user details</li>
            <li>Refresh the page to verify that the authentication persists</li>
            <li>Use "Clear localStorage" to test if the session persists without localStorage backup</li>
          </ol>
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
};

export default AuthTest;