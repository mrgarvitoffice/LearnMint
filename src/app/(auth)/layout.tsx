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

  // This hook handles the result from a Google Sign-In redirect.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // If we get a result, it means the user just came back from Google.
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
            toast({ title: "Welcome to LearnMint!", description: "Your account has been created." });
          } else {
            toast({ title: "Welcome back!", description: "You have successfully signed in." });
          }
          // After processing, navigate to the dashboard.
          // This ensures that after the Google redirect is handled, the user is moved.
          router.replace('/');
        } else {
            // No redirect result, we can stop the processing loader.
            setIsProcessingRedirect(false);
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
        setIsProcessingRedirect(false);
      });
  // The empty dependency array is correct here, we only want this to run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This hook handles redirecting users who are ALREADY logged in and not coming from a Google redirect.
  useEffect(() => {
    // Wait until the initial auth check AND the redirect check are done.
    if (!loading && !isProcessingRedirect) {
      // If a user exists (and isn't a guest), they shouldn't be on an auth page.
      if (user && !user.isAnonymous) {
        router.replace('/');
      }
    }
  }, [user, loading, router, isProcessingRedirect]);


  // Show a loading screen while the initial auth check or the redirect processing is running.
  if (loading || isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Verifying Authentication...</p>
      </div>
    );
  }

  // If not loading and no user (or a guest), render the auth page content.
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
