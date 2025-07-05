
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
    // This effect runs once on mount to handle the result from a Google Sign-In redirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          toast({ title: "Google Sign-in successful!", description: "Welcome to LearnMint." });
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
          // After processing, redirect to dashboard.
          router.replace('/');
        } else {
          // No redirect result, so we're done processing.
          setIsProcessingRedirect(false);
        }
      })
      .catch((error) => {
        console.error("Google Redirect Result Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in. Please try again.", variant: "destructive" });
        setIsProcessingRedirect(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show a loader while we are waiting for the redirect result to be processed.
  if (isProcessingRedirect) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Processing Sign-In...</p>
      </div>
    );
  }
  
  // Also, if another user is already logged in (not a guest), redirect them away.
  // This is a secondary check that runs after the redirect processing.
  if (!loading && user && !user.isAnonymous) {
      router.replace('/');
      return (
         <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-3 text-lg">Redirecting...</p>
        </div>
      );
  }

  // If not processing a redirect and not logged in, show the sign-in/up page.
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
