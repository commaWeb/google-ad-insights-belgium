
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForToken } from '@/services/googleAuthService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/?error=oauth_error');
        return;
      }

      if (code) {
        try {
          const success = await exchangeCodeForToken(code);
          if (success) {
            console.log('Authentication successful, redirecting to dashboard');
            navigate('/?auth=success');
          } else {
            console.error('Failed to exchange code for token');
            navigate('/?error=auth_failed');
          }
        } catch (error) {
          console.error('Error during token exchange:', error);
          navigate('/?error=auth_failed');
        }
      } else {
        console.error('No authorization code received');
        navigate('/?error=no_code');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="text-center">Completing Authentication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-center text-gray-600">
            Processing your Google authentication...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
