
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
  const { user, loading } = useAuth(); // from our main context
  const router = useRouter();
  const { toast } = useToast();
  const [isHandlingRedirect, setIsHandlingRedirect] = useState(true);

  useEffect(() => {
    // This effect runs only once on mount to check for a Google redirect result.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // A user has successfully signed in via redirect.
          toast({ title: "Welcome!", description: "Processing your sign-in..." });
          const userRef = doc(db, 'users', result.user.uid);
          const docSnap = await getDoc(userRef);

          if (!docSnap.exists()) {
            // If it's a new user, create their document in Firestore.
            await setDoc(userRef, {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              createdAt: serverTimestamp(),
            });
            toast({ title: "Welcome to LearnMint!", description: "Your account has been created." });
          }
          // The `onAuthStateChanged` listener in AuthContext will now have the user,
          // and the logic in the *next* useEffect will handle the redirect.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      })
      .finally(() => {
        // No matter the outcome, we are done handling the redirect attempt.
        setIsHandlingRedirect(false);
      });
  // The empty dependency array is correct here, we only want this to run once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // This effect reacts to changes in auth state from the main AuthContext.
    // It won't run until both the initial auth check AND the redirect check are complete.
    if (!loading && !isHandlingRedirect && user) {
      // If we have a user (from any method), redirect them away from the auth pages.
      router.replace('/'); // Redirect to dashboard/home
    }
  }, [user, loading, isHandlingRedirect, router]);

  // Show a loading screen while the initial Firebase check OR the redirect check is in progress.
  if (loading || isHandlingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying Authentication...</p>
      </div>
    );
  }

  // If checks are complete and there's no user, render the sign-in/sign-up page.
  if (!user) {
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

  // If checks are complete and there IS a user, the redirect is in-flight.
  // Show a loader to prevent a flash of the auth form.
  return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting to app...</p>
      </div>
  );
}
