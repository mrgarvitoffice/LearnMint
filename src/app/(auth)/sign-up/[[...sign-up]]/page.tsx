
"use client";

import Link from 'next/link';
import { signInWithPopup } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase/config';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Logo } from '@/components/icons/Logo';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path fill="#4285F4" d="M21.35 11.1h-9.2v2.7h5.3c-.2 1-1.2 3.2-5.3 3.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.8 0 3 .8 3.7 1.5l2.2-2.2C17.2 3.2 14.8 2 12.15 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.6-.1-1.1-.3-1.6z"/>
    </svg>
  );
}

export default function SignUpPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserCreation = useCallback(async (user: import('firebase/auth').User) => {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      console.log("New user document created in Firestore for:", user.uid);
    }
  }, []);

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast({ title: "Account Created!", description: "Welcome to LearnMint! Redirecting you..." });
      await handleUserCreation(result.user);
      // Navigation is handled by the AuthLayout
    } catch (error: any) {
      console.error("Error during Google sign-up:", error);
      let title = "Sign-up Failed";
      let description = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          title = "Sign-up Cancelled";
          description = "The sign-up window was closed. This can also happen if the domain is not authorized in your Firebase project settings. Please check the console logs and README.";
          break;
        case 'auth/unauthorized-domain':
          title = "Domain Not Authorized";
          description = `The domain '${window.location.hostname}' is not authorized for sign-in. Please add it to the authorized domains list in your Firebase project settings under Authentication > Settings.`;
          break;
        case 'auth/popup-blocked':
          title = "Popup Blocked";
          description = "Your browser blocked the sign-up popup. Please allow popups for this site and try again.";
          break;
        case 'auth/cancelled-popup-request':
          title = "Sign-up Cancelled";
          description = "Multiple sign-up windows were opened. Please try again.";
          break;
        default:
          description = error.message;
      }

      toast({ title, description, variant: "destructive", duration: 10000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Create an Account</CardTitle>
        <CardDescription>Join LearnMint to unlock all features.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGoogleSignUp} variant="outline" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
          Sign Up with Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
