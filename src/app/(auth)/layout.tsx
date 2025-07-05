
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

  // This hook handles the result from a Google Sign-In redirect.
  // It runs only once on mount.
  useEffect(() => {
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
          // After processing, the main layout will handle the redirect because the user state will be updated.
          // No need to push the router here, as it can cause race conditions.
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // This hook handles redirecting users who are ALREADY logged in.
  useEffect(() => {
    // Wait until the initial auth check is done.
    if (!loading) {
      // If a user exists (and isn't a guest), they shouldn't be on an auth page.
      if (user && !user.isAnonymous) {
        router.replace('/');
      }
    }
  }, [user, loading, router]);


  // Show a loading screen while the initial auth check is running.
  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading Session...</p>
      </div>
    );
  }

  // If not loading and no user (or a guest), render the auth page content.
  // The useEffect above handles redirecting away if a full user exists.
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
