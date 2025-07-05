"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Chrome, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/icons/Logo';
import { useAuth } from '@/contexts/AuthContext';

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignInFormData = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const { toast } = useToast();
  const { signInAsGuest } = useAuth();
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true); // Start true to handle initial check

  const isAnyLoading = isLoadingEmail || isLoadingGoogle || isLoadingGuest || isProcessingRedirect;

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  // Handle the result of a Google Sign-In redirect
  useEffect(() => {
    const processRedirectResult = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result?.user) {
                toast({ title: "Signed in with Google!", description: "Finalizing your setup..." });
                const userRef = doc(db, 'users', result.user.uid);
                const docSnap = await getDoc(userRef);
                if (!docSnap.exists()) {
                    await setDoc(userRef, {
                        uid: result.user.uid,
                        email: result.user.email,
                        displayName: result.user.displayName,
                        photoURL: result.user.photoURL,
                        createdAt: serverTimestamp(),
                    });
                }
                // The (auth) layout will handle the redirect once onAuthStateChanged fires.
            }
        } catch (error: any) {
            console.error("Google Redirect Error:", error);
            // Don't show toast on initial load if there's no redirect result error
            if (error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/web-storage-unsupported') {
               toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in.", variant: "destructive" });
            }
        } finally {
            setIsProcessingRedirect(false); // Finished checking for redirect result
        }
    };
    processRedirectResult();
  }, [toast]);

  const onEmailSubmit = async (data: SignInFormData) => {
    setIsLoadingEmail(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Sign-in successful!", description: "Redirecting..." });
      // The (auth) layout will handle the redirect once onAuthStateChanged fires.
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.code === 'auth/invalid-credential' 
          ? "Invalid email or password. Please try again."
          : "An unexpected error occurred during sign-in.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider).catch((error) => {
        console.error("Google Sign In Redirect Error:", error);
        toast({ title: "Could not start Google Sign-In", description: "Please try again.", variant: "destructive" });
        setIsLoadingGoogle(false);
    });
  };
  
  const handleGuestSignIn = async () => {
    setIsLoadingGuest(true);
    try {
      await signInAsGuest();
      toast({ title: "Signed in as guest", description: "Redirecting..." });
      // The (auth) layout will handle the redirect once onAuthStateChanged fires for the guest user.
    } catch (error: any) {
       console.error("Guest Sign In Error:", error);
       toast({ title: "Could not sign in as guest", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoadingGuest(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-border/50 bg-card/80 backdrop-blur-lg">
      <CardHeader className="text-center">
        <Logo size={48} className="mx-auto mb-2" />
        <CardTitle className="text-2xl mt-2">Welcome to LearnMint</CardTitle>
        <CardDescription>Sign in to access your dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="space-y-2">
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isAnyLoading}>
              {isLoadingGoogle || isProcessingRedirect ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
              Sign In with Google
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleGuestSignIn} disabled={isAnyLoading}>
              {isLoadingGuest ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
              Continue as Guest
            </Button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or with Email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isAnyLoading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} disabled={isAnyLoading} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isAnyLoading}>
            {isLoadingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <p>
          Don't have an account?{' '}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
