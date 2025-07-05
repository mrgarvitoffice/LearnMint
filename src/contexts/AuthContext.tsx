
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
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
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
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

    return () => unsubscribe();
  }, [handleUserCreationInFirestore]);

  const signOutUser = async () => {
    await signOut(auth);
    // Let the layout handle the redirect
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const displayName = result.user.displayName || 'user';
      toast({ title: `Hi, ${displayName}!`, description: `Welcome back.` });
    } catch (error: any) {
        console.error("Auth Popup Error:", error);
        let description = "There was an issue with the sign-in popup.";
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com';
        const authDomain = auth.config.authDomain;

        if (error.code === 'auth/popup-closed-by-user') {
            description = "The sign-in popup was closed. Please try again.";
        } else if (error.code === 'auth/unauthorized-domain') {
            description = "This domain is not authorized for sign-in. Please add it to your Firebase project's authorized domains list.";
            console.error("--- DOMAIN AUTHORIZATION ERROR ---");
            console.error(`You MUST add the following domains to the Firebase Auth 'Authorized domains' list:`);
            console.error(`1. Your app's hostname: %c${hostname}`, "color: yellow;");
            console.error(`2. Your project's authDomain: %c${authDomain}`, "color: yellow;");
            console.error("3. If developing locally, also add: %clocalhost", "color: yellow;");
            console.error("--- END ---");
        } else if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with this email. Please sign in with the original method."
        }
        toast({ title: "Sign-in Error", description, variant: "destructive" });
    } finally {
      // onAuthStateChanged will set loading to false
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({ title: "Guest Sign-in Error", description: error.message, variant: "destructive" });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const displayName = userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User';
      toast({ title: `Hi, ${displayName}!`, description: "You are now signed in." });
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

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        await handleUserCreationInFirestore(userCredential.user);
        setUser({ ...userCredential.user, displayName });
        toast({ title: `Hi, ${displayName}!`, description: "Your account has been created successfully." });
      }
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
