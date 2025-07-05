
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
    if (user.isAnonymous) return;
    
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
    // onAuthStateChanged is the single source of truth for the user's state.
    // It handles both initial load and subsequent login/logout events.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in.
        await handleUserCreationInFirestore(firebaseUser);
        setUser(firebaseUser);
      } else {
        // User is signed out.
        setUser(null);
      }
      // CRITICAL: Only set loading to false AFTER we have a definitive answer.
      // This prevents race conditions on page load.
      setLoading(false);
    });

    // Separately, process the redirect result to catch specific errors from Google.
    // This doesn't set the user; onAuthStateChanged does. This completes the flow.
    getRedirectResult(auth)
      .catch((error) => {
        console.error("Error from getRedirectResult:", error);
        if (error.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
             toast({ title: "Sign-in Error: Unauthorized Domain", description: `Please add '${window.location.hostname}' to the authorized domains in your Firebase console.`, variant: "destructive", duration: 10000 });
        } else if (error.code !== 'auth/no-redirect-result') { // Ignore benign "no result" error
            toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
        }
      });
      
    return () => unsubscribe();
  }, [handleUserCreationInFirestore, toast]);

  const signInAsGuest = async () => {
    setLoading(true);
    await signInAnonymously(auth);
    // State update and setLoading(false) is handled by onAuthStateChanged
  };
  
  const signOutUser = async () => {
    await signOut(auth);
    router.push('/sign-in');
    // State update is handled by onAuthStateChanged
  };

  const signInWithGoogleRedirect = async () => {
    setLoading(true); // Show loader immediately before redirecting away
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
        console.error("Error initiating Google sign-in redirect:", error);
        toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
        setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    // State update and setLoading(false) is handled by onAuthStateChanged
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await createUserWithEmailAndPassword(auth, email, password);
    // State update and setLoading(false) is handled by onAuthStateChanged
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
