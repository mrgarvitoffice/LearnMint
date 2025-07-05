"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs on mount to handle the redirect result from Google.
    // It is safe to run here as this layout only wraps auth pages.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          // User has successfully signed in with Google and is redirected back.
          toast({ title: "Sign-in successful!", description: "Welcome to LearnMint." });
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
          // The onAuthStateChanged listener in AuthContext will now have the user,
          // and the effect below will handle the redirect.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      });
  }, [toast]);

  useEffect(() => {
    // This effect handles redirecting FULLY LOGGED-IN users away from auth pages.
    // It will NOT redirect guest users.
    if (!loading && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // If initial auth check is happening, show a spinner.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying session...</p>
      </div>
    );
  }

  // If a full user is logged in, they will be redirected. Show a spinner during the brief redirect period.
  if (user && !user.isAnonymous) {
      return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-lg">Redirecting to dashboard...</p>
        </div>
      );
  }
  
  // If we're not loading and the user is either null or a guest, render the auth pages (sign-in/sign-up).
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background/95 p-4"
         style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, hsla(180, 100%, 50%, 0.15) 0px, transparent 50%),
              radial-gradient(at 98% 98%, hsla(170, 100%, 50%, 0.1) 0px, transparent 50%),
              linear-gradient(160deg, #00030a, #071a2d)
            `,
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
         }}
    >
      {children}
    </div>
  );
}
