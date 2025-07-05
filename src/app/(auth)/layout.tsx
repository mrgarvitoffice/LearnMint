
"use client";

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  useEffect(() => {
    // This effect runs only once on mount to handle the redirect result from Google.
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
          // The onAuthStateChanged listener in AuthContext will update the user state.
          // The effect below will handle the redirect once the user state is confirmed.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      })
      .finally(() => {
        setIsProcessingRedirect(false);
      });
  }, [toast]); // Run only once

  useEffect(() => {
    // This effect handles redirecting FULLY LOGGED-IN users away from auth pages.
    // It waits for both the main auth check and the redirect processing to finish.
    if (!authLoading && !isProcessingRedirect && user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  // If initial auth check or redirect processing is happening, show a spinner.
  if (authLoading || isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying session...</p>
      </div>
    );
  }
  
  // If we're not loading and the user is either null or a guest, render the auth pages.
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
