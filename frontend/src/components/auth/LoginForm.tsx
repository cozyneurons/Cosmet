'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const handleCredentialResponse = async (response: any) => {
      setSubmitError('');
      try {
        await loginWithGoogle(response.credential);
        router.push('/analyze');
      } catch (err: any) {
        setSubmitError(err?.message || 'Google authentication failed');
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        const clientID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '406427508234-kh6vs46v49i5f3b7oej4mmatdd3klim8.apps.googleusercontent.com';
        
        window.google.accounts.id.initialize({
          client_id: clientID,
          callback: handleCredentialResponse,
        });

        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          window.google.accounts.id.renderButton(
            buttonElement,
            { 
              theme: 'outline', 
              size: 'large',
              width: '100%',
              text: 'signin_with',
              shape: 'rectangular'
            }
          );
        }
      }
    };

    // Poll for script initialization
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [loginWithGoogle, router]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-zinc-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome to Cosmet</CardTitle>
        <CardDescription className="text-center">
          Sign in with your Google account to access your ingredient safety analyzer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
            {submitError}
          </div>
        )}
        
        <div className="flex justify-center w-full min-h-[44px]">
          <div id="google-signin-button" className="w-full"></div>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-zinc-500 font-medium animate-pulse">
            Signing you in...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
