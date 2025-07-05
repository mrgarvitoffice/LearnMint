
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // This effect runs once on mount to handle the result from Google Sign-In.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // User has successfully signed in with Google.
          toast({ title: "Sign-in successful!", description: "Welcome to LearnMint." });
          const userRef = doc(db, 'users', result.user.uid);
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            // Create user document in Firestore if it's a new user.
            await setDoc(userRef, {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              createdAt: serverTimestamp(),
            });
          }
          // The onAuthStateChanged listener will update the global user state.
          // The effect below will handle the final redirect to the main app.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      })
      .finally(() => {
        // We're done processing the potential redirect.
        setIsProcessingRedirect(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount.

  // This effect handles redirecting logged-in users away from auth pages.
  useEffect(() => {
    // Wait for both the initial auth check and redirect processing to complete.
    if (!loading && !isProcessingRedirect && user) {
      // User is logged in, redirect them to the main app.
      router.replace('/');
    }
  }, [user, loading, isProcessingRedirect, router]);

  // Show a spinner while the initial auth state and any redirect results are being processed.
  if (loading || isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading...</p>
      </div>
    );
  }
  
  // If not loading and no user, it's safe to render the sign-in/sign-up page.
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
