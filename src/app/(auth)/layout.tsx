
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
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This effect handles the result from a Google Sign-In redirect.
    // It runs only once on mount.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          // If we get a result, it means the user just came back from Google.
          // The `onAuthStateChanged` in AuthContext will handle setting the user state.
          // We just need to create the user doc in Firestore if it's their first time.
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
          // We don't navigate here. The redirect logic below will handle it once user state is confirmed.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      })
      .finally(() => {
        // Whether successful or not, we are done processing the potential redirect.
        setIsProcessingRedirect(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // This effect handles redirecting logged-in users away from auth pages.
    
    // Wait until both the main auth check AND the Google redirect check are complete.
    if (loading || isProcessingRedirect) {
      return;
    }

    // If both checks are done and we have a user (who is not a guest), redirect to dashboard.
    if (user && !user.isAnonymous) {
      router.replace('/');
    }
  }, [user, loading, isProcessingRedirect, router]);

  // Show a loader while checks are running.
  if (loading || isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading...</p>
      </div>
    );
  }
  
  // If checks are done and the user is NOT logged in (or is a guest), show the auth page.
  // The useEffect above handles the redirect for logged-in users.
  if (!user || user.isAnonymous) {
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

  // If checks are done and a user IS logged in, the redirect is in flight. Show a loader.
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Redirecting to dashboard...</p>
    </div>
  );
}
