
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  type User,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleUserCreationInFirestore = useCallback(async (user: User) => {
    if (user.isAnonymous) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
            });
        }
    } catch (error: any) {
        console.error("Firestore user creation error:", error);
        toast({
            title: "Profile Error",
            description: "Could not save your profile data due to a database issue. You can still use the app.",
            variant: "destructive",
        });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.isAnonymous) {
          await handleUserCreationInFirestore(firebaseUser);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleUserCreationInFirestore]);

  const signOutUser = async () => {
    setLoading(true);
    await signOut(auth);
    router.push('/sign-in');
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let description = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        description = "The sign-in popup was closed before completion.";
      } else if (error.code === 'auth/unauthorized-domain') {
        description = `This app's domain is not authorized for Google Sign-In. Please add '${window.location.hostname}' to the authorized domains in your Firebase console.`;
      } else if (error.code === 'auth/popup-blocked') {
        description = "Popup blocked by browser. Please allow popups for this site and try again.";
      }
      toast({ title: "Google Sign-in Failed", description, variant: "destructive" });
      setLoading(false); // Reset loading state on error
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      // onAuthStateChanged will handle navigation
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({ title: "Guest Sign-in Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle navigation
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await createUserWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle navigation
  };

  const value = { user, loading, signOutUser, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAnonymously };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
