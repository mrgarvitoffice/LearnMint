
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
  const [loading, setLoading] = useState(true); // Start as true
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

  // This is the main effect for handling authentication state.
  useEffect(() => {
    // Process the redirect result from Google as soon as the app loads.
    getRedirectResult(auth)
      .then((result) => {
        // If the sign-in was successful, `result.user` will exist.
        // `onAuthStateChanged` will handle the actual state update,
        // but we can show a success toast here.
        if (result?.user) {
          toast({ title: "Sign-in Successful!", description: "Welcome! Redirecting you..." });
        }
      })
      .catch((error) => {
        // Handle specific errors from the redirect flow.
        console.error("Error from getRedirectResult:", error);
        // This error often means the domain isn't authorized in the Firebase console.
        if (error.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
             toast({ title: "Sign-in Error: Unauthorized Domain", description: `Please add '${window.location.hostname}' to the authorized domains in your Firebase console.`, variant: "destructive", duration: 10000 });
        } else if (error.code !== 'auth/no-redirect-result') { // Ignore the benign "no result" error
            toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
        }
      });

    // onAuthStateChanged is the single source of truth for the user's state.
    // It will fire after getRedirectResult completes successfully.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If a user is logged in, create their Firestore doc if it doesn't exist.
        await handleUserCreationInFirestore(firebaseUser);
      }
      // Set the user state (it could be the user object or null).
      setUser(firebaseUser);
      // We are now certain of the user's login status, so we can stop loading.
      setLoading(false);
    });
      
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [handleUserCreationInFirestore, toast]);

  const signInAsGuest = async () => {
    setLoading(true);
    await signInAnonymously(auth);
    // setLoading(false) is handled by onAuthStateChanged
  };
  
  const signOutUser = async () => {
    setLoading(true);
    await signOut(auth);
    router.push('/sign-in');
    // setLoading(false) is handled by onAuthStateChanged
  };

  const signInWithGoogleRedirect = async () => {
    setLoading(true); // Show loader immediately before redirecting away
    await signInWithRedirect(auth, googleProvider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    // setLoading(false) is handled by onAuthStateChanged
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await createUserWithEmailAndPassword(auth, email, password);
    // setLoading(false) is handled by onAuthStateChanged
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
