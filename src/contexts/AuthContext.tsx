
"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOutUser: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const handleUserCreationInFirestore = useCallback(async (user: User) => {
    if (!user || user.isAnonymous) return;
    
    const userRef = doc(db, 'users', user.uid);
    try {
        const docSnap = await getDoc(userRef);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
        };

        if (!docSnap.exists()) {
            // New user: set data including createdAt
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
            });
            console.log("Firestore user document created for:", user.uid);
        } else {
            // Existing user: merge new info to update photoURL, displayName, etc.
            await setDoc(userRef, userData, { merge: true });
            console.log("Firestore user document updated for:", user.uid);
        }
    } catch (error: any) {
        console.error("Firestore user creation/update error:", error);
        toast({
            title: "Profile Error",
            description: "Could not save your profile data. You may have restrictive security rules in Firestore.",
            variant: "destructive",
        });
    }
  }, [toast]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Always handle Firestore update on auth state change to catch profile updates.
        await handleUserCreationInFirestore(currentUser);
        // The user object from onAuthStateChanged is the source of truth.
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [handleUserCreationInFirestore]);
  

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // The onAuthStateChanged listener will handle setting user to null and loading to false.
      // The main app layout will handle the redirect when `user` becomes null.
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Error", description: error.message, variant: "destructive" });
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      router.push('/dashboard');
      toast({ title: "Welcome, Guest!", description: "You can now explore all features." });
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({ title: "Guest Sign-in Error", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      const displayName = userDoc.exists() ? userDoc.data().displayName : userCredential.user.email?.split('@')[0] || 'User';
      
      toast({ title: `Hi, ${displayName}!`, description: "You are now signed in." });
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please try again."
      } else {
        description = error.message;
      }
      toast({ title: "Sign-in Failed", description, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };
  
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the rest, including Firestore updates.
      toast({ title: "Welcome!", description: "You are now signed in with Google." });
    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with the same email address but different sign-in credentials.";
      } else {
        description = error.message;
      }
      toast({ title: "Google Sign-in Failed", description: description, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;

      if (currentUser && currentUser.isAnonymous) {
        const credential = EmailAuthProvider.credential(email, password);
        const linkResult = await linkWithCredential(currentUser, credential);
        const linkedUser = linkResult.user;
        
        await updateProfile(linkedUser, { displayName });
        // The onAuthStateChanged listener will handle the Firestore update.
        
        toast({ title: `Welcome, ${displayName}!`, description: "Your account has been upgraded and saved." });

      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
          // The onAuthStateChanged listener will handle the Firestore update.
          toast({ title: `Hi, ${displayName}!`, description: "Your account has been created successfully." });
        }
      }
    } catch (error: any)
       {
      let description = "An unknown error occurred.";
       if (error.code === 'auth/email-already-in-use') {
        description = "This email is already associated with an account."
      } else if (error.code === 'auth/credential-already-in-use') {
        description = "This email is already linked to another account. Please use a different email.";
      } else {
        description = error.message;
      }
      toast({ title: "Sign-up Failed", description, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const value = { user, loading, signOutUser, signInWithEmail, signUpWithEmail, signInAnonymously, signInWithGoogle };

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
