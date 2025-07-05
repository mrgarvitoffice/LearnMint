
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
    
    try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            console.log(`[AuthContext] No Firestore document for new user ${user.uid}. Creating one...`);
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email?.split('@')[0],
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
            });
            console.log(`[AuthContext] Successfully created Firestore document for: ${user.uid}`);
        }
    } catch (error) {
        console.error("****************************************************************");
        console.error("[AuthContext] CRITICAL ERROR during Firestore user creation:", error);
        console.error("This is often caused by incorrect Firestore Security Rules.");
        console.error("Please ensure your 'firestore.rules' allow authenticated users to write to their own document (`/users/{userId}`).");
        console.error("Example rule: `allow write: if request.auth.uid == userId;`");
        console.error("****************************************************************");
        // We will NOT throw an error here, to allow the auth flow to complete.
        // The user is authenticated, even if their Firestore doc creation failed.
        // We can show a toast to inform the user of a partial profile setup failure.
        toast({
            title: "Sign-In Successful, Profile Issue",
            description: "We couldn't save your profile data. You can still use the app, but some features might be limited. Please contact support.",
            variant: "destructive",
            duration: 10000,
        });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await handleUserCreationInFirestore(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    getRedirectResult(auth)
      .catch((error) => {
        console.error("Error from getRedirectResult:", error);
        if (error.code === 'auth/unauthorized-domain' && typeof window !== 'undefined') {
             toast({ title: "Sign-in Error: Unauthorized Domain", description: `Please add '${window.location.hostname}' to the authorized domains in your Firebase console.`, variant: "destructive", duration: 10000 });
        } else if (error.code !== 'auth/no-redirect-result') {
            toast({ title: "Sign-in Error", description: error.message, variant: "destructive" });
        }
      });
      
    return () => unsubscribe();
  }, [handleUserCreationInFirestore, toast]);

  const signInAsGuest = async () => {
    setLoading(true);
    await signInAnonymously(auth);
  };
  
  const signOutUser = async () => {
    await signOut(auth);
    router.push('/sign-in');
  };

  const signInWithGoogleRedirect = async () => {
    setLoading(true);
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
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await createUserWithEmailAndPassword(auth, email, password);
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
