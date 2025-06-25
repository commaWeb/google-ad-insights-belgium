import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, LogIn, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initGoogleAuth, getAuthUrl, isAuthenticated, logout } from '@/services/googleAuthService';

interface GoogleSignInProps {
  onAuthChange: (isAuthenticated: boolean) => void;
}

export const GoogleSignIn = ({ onAuthChange }: GoogleSignInProps) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkAuthStatus = () => {
    const authStatus = isAuthenticated();
    console.log('GoogleSignIn: checking auth status:', authStatus);
    setIsAuth(authStatus);
    onAuthChange(authStatus);
    return authStatus;
  };

  useEffect(() => {
    // Initialize and check authentication status
    initGoogleAuth();
    checkAuthStatus();

    // Check for URL parameters indicating auth status
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    const errorParam = urlParams.get('error');
    
    if (authParam === 'success') {
      setSuccessMessage('Successfully authenticated with Google!');
      // Re-check auth status after successful callback
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      const errorMessages = {
        oauth_error: 'OAuth authentication was denied or failed',
        auth_failed: 'Failed to complete authentication',
        no_code: 'No authorization code received from Google'
      };
      setError(errorMessages[errorParam as keyof typeof errorMessages] || 'Authentication error occurred');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Also listen for storage events in case authentication happens in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'google_access_token') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [onAuthChange]);

  const handleSignIn = () => {
    setError(null);
    setSuccessMessage(null);
    const authUrl = getAuthUrl();
    window.location.href = authUrl;
  };

  const handleSignOut = () => {
    logout();
    setIsAuth(false);
    onAuthChange(false);
    setError(null);
    setSuccessMessage(null);
  };

  if (isAuth) {
    return (
      <div className="max-w-2xl mx-auto mt-4 mb-2">
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded px-3 py-2 text-green-700 text-sm shadow-none">
          <span className="text-green-500 text-base">✔️</span>
          <span>
            Authenticated with Google. <span className="text-green-600 font-medium">Real data</span> will be displayed.
          </span>
          <button
            className="ml-auto px-2 py-1 text-xs rounded border border-green-200 bg-white hover:bg-green-100 transition"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Google Authentication Required
        </CardTitle>
        <CardDescription className="text-blue-700">
          Sign in with Google to access real BigQuery data instead of mock data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={handleSignIn} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <LogIn className="w-4 h-4 mr-2" />
          {isLoading ? 'Authenticating...' : 'Sign in with Google'}
        </Button>
        
        <p className="text-sm text-blue-600">
          This will redirect you to Google to authorize access to BigQuery public datasets.
        </p>
      </CardContent>
    </Card>
  );
};
