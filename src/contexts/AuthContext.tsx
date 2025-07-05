
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
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
      setUser(firebaseUser);
      if (firebaseUser) {
        await handleUserCreationInFirestore(firebaseUser);
      }
      setLoading(false);
    });

    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          toast({ title: "Signed In", description: `Welcome back, ${result.user.displayName || 'user'}.` });
          // The onAuthStateChanged listener will handle setting user and firestore creation.
        }
      })
      .catch((error) => {
        console.error("Auth Redirect Error:", error);
        let description = "There was an issue with the sign-in redirect.";
        if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with this email address. Please sign in with the original method."
        }
        toast({ title: "Sign-in Error", description, variant: "destructive" });
        setLoading(false);
      });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUserCreationInFirestore]);

  const signOutUser = async () => {
    await signOut(auth);
    router.push('/sign-in');
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Use signInWithRedirect which is more robust than popups.
    await signInWithRedirect(auth, provider);
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({ title: "Guest Sign-in Error", description: error.message, variant: "destructive" });
    } finally {
      // setLoading(false) is handled by onAuthStateChanged
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please try again."
      } else {
        description = error.message;
      }
      toast({ title: "Sign-in Failed", description, variant: "destructive" });
       setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let description = "An unknown error occurred.";
       if (error.code === 'auth/email-already-in-use') {
        description = "This email is already associated with an account."
      } else {
        description = error.message;
      }
      toast({ title: "Sign-up Failed", description, variant: "destructive" });
       setLoading(false);
    }
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
