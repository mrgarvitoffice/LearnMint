
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sendSignInLinkToEmail, getRedirectResult, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MailCheck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useGuestUsage } from '@/contexts/GuestUsageContext';

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});
type SignInFormData = z.infer<typeof signInSchema>;
const EMAIL_FOR_SIGN_IN_KEY = 'learnmint-emailForSignIn';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
      <path fill="#4285F4" d="M21.35 11.1h-9.2v2.7h5.3c-.2 1-1.2 3.2-5.3 3.2-3.2 0-5.8-2.6-5.8-5.8s2.6-5.8 5.8-5.8c1.8 0 3 .8 3.7 1.5l2.2-2.2C17.2 3.2 14.8 2 12.15 2c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.8 0-.6-.1-1.1-.3-1.6z"/>
    </svg>
  );
}

export default function SignInPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const { resetUsage } = useGuestUsage();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

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
    resetUsage();
    toast({ title: "Sign-in Successful!", description: "Welcome back to LearnMint!" });
    router.replace('/');
  }, [router, toast, resetUsage]);

  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect result processed. User found:", result.user.uid);
          await handleUserCreation(result.user);
        } else {
          setIsProcessingRedirect(false);
        }
      } catch (error: any) {
        console.error("Error processing redirect result:", error);
        toast({ title: "Sign-in Failed", description: error.message, variant: "destructive" });
        setIsProcessingRedirect(false);
      }
    };
    processRedirectResult();
  }, [handleUserCreation, toast]);

  const onEmailSubmit = async (data: SignInFormData) => {
    // This is for passwordless, keeping it as an option.
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      console.error("Error initiating Google sign-in redirect:", error);
      toast({ title: "Sign-In Error", description: error.message, variant: "destructive" });
    }
  };

  const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAsGuest();
      toast({ title: "Welcome, Guest!", description: "You are signed in as a guest." });
      router.replace('/');
    } catch (error: any) {
      console.error("Error signing in as guest:", error);
      toast({ title: "Guest Sign-In Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background/95">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying sign-in...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Welcome Back!</CardTitle>
        <CardDescription>Sign in to access your LearnMint dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
          <GoogleIcon /> Sign In with Google
        </Button>
        <div className="relative">
          <Separator className="my-1" />
          <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            OR
          </p>
        </div>
        <Button onClick={handleGuestSignIn} variant="secondary" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Continue as Guest
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          No account?{' '}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
