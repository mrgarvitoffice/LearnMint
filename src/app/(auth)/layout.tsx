
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
    // This effect handles both Google redirect results and existing user sessions.
    const processAuth = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User just signed in via Google redirect.
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
            toast({ title: "Welcome to LearnMint!", description: "Your account has been created." });
          }
          // Let the session redirect logic handle navigation.
        }
      } catch (error: any) {
        console.error("Google Redirect Error:", error);
        toast({ title: "Google Sign-in failed", description: "There was an issue completing your sign-in.", variant: "destructive" });
      } finally {
        setIsProcessingRedirect(false);
      }
    };
    
    processAuth();
  }, [toast]);

  useEffect(() => {
    // This effect handles redirecting an already logged-in user.
    if (!authLoading && !isProcessingRedirect && user) {
      router.replace('/');
    }
  }, [user, authLoading, isProcessingRedirect, router]);

  // Show a loader while checking for redirect results or waiting for the initial auth state.
  // Also show a loader if a user is found, as a redirect will be in-flight.
  if (authLoading || isProcessingRedirect || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg">Loading Session...</p>
      </div>
    );
  }
  
  // If all checks are done and there's no user, render the sign-in/sign-up page.
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
