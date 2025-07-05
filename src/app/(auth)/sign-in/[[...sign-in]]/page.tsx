
"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider, getRedirectResult, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Chrome, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(true); // Page-level loading state
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submissions

  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  useEffect(() => {
    let isMounted = true;

    // This function checks for a redirect result from Google and handles user creation
    const handleGoogleRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result && result.user && isMounted) {
                toast({ title: "Signed in with Google!", description: "Welcome back! Setting up your session..." });

                // Ensure user document exists in Firestore
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
                // The onAuthStateChanged listener below will handle the redirect
            }
        } catch (error: any) {
            console.error("Google Redirect Error:", error);
            toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in.", variant: "destructive" });
        }
    };
    
    // Attempt to handle the redirect first.
    handleGoogleRedirect().finally(() => {
        // Then, set up the primary auth state listener.
        // This will run AFTER getRedirectResult has been attempted.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!isMounted) return;

            if (user && !user.isAnonymous) {
                // If a user is found (either from the redirect or an existing session), navigate to dashboard
                router.replace('/'); 
            } else {
                // If no user, or user is a guest, stop the loading state and show the sign-in form
                setIsPageLoading(false);
            }
        });
        
        return () => {
            isMounted = false;
            unsubscribe();
        };
    });

  }, [router, toast]);

  const onEmailSubmit = async (data: SignInFormData) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Sign-in successful!", description: "Redirecting..." });
      // The useEffect hook with onAuthStateChanged will handle the redirect
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description: error.code === 'auth/invalid-credential'
          ? "Invalid email or password. Please try again."
          : "An unexpected error occurred during sign-in.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The redirect will happen, and the result will be handled by the useEffect on page load.
    } catch (error) {
      console.error("Google Sign In Redirect Error:", error);
      toast({ title: "Could not start Google Sign-In", description: "Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAsGuest();
      toast({ title: "Signed in as guest", description: "Redirecting..." });
      router.replace('/');
    } catch (error: any) {
       console.error("Guest Sign In Error:", error);
       toast({ title: "Could not sign in as guest", description: "Please try again.", variant: "destructive" });
       setIsSubmitting(false);
    }
  }

  if (isPageLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-transparent">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Checking authentication status...</p>
      </div>
    );
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
           <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4" />}
              Sign In with Google
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleGuestSignIn} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
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
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isSubmitting} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} disabled={isSubmitting} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
