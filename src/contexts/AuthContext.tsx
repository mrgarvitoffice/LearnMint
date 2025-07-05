
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User
} from 'firebase/auth';
import { auth, db, googleProvider } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleUserCreationInFirestore = useCallback(async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
        });
        console.log("New user document created in Firestore for:", user.uid);
      } catch (error) {
        console.error("Error creating user document in Firestore:", error);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // This handles the result of a sign-in redirect.
    // It runs when the app loads after being redirected back from Google.
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          toast({ title: "Sign-in Successful!", description: "Welcome! Redirecting you to the dashboard..." });
          await handleUserCreationInFirestore(result.user);
          router.replace('/');
        }
      })
      .catch((error) => {
        // Only show error toast if there's a significant error, not just no-redirect.
        if (error.code !== 'auth/no-redirect-result') {
          console.error("Error handling redirect result:", error);
          toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
        }
      })
      .finally(() => {
        // This ensures the initial loading state is eventually turned off even if there's no redirect.
        setLoading(false);
      });
      
    return () => unsubscribe();
  }, [handleUserCreationInFirestore, toast, router]);

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };
  
  const signOutUser = async () => {
    await signOut(auth);
    router.push('/sign-in');
  };

  const signInWithGoogleRedirect = async () => {
    setLoading(true);
    await signInWithRedirect(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await handleUserCreationInFirestore(userCredential.user);
  };

  const value = { user, loading, signInAsGuest, signOutUser, signInWithGoogleRedirect, signInWithEmail, signUpWithEmail };

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
