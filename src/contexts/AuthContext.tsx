
"use client";
/**
 * LearnMint: Your AI-Powered Learning Assistant
 * @author MrGarvit
 */

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
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';

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
  const { t } = useTranslation();

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

            // Atomically increment the total learners count for a new user.
            const statsRef = doc(db, 'metadata', 'userStats');
            await runTransaction(db, async (transaction) => {
                const statsDoc = await transaction.get(statsRef);
                if (!statsDoc.exists()) {
                    // If the document doesn't exist, initialize it with the starting count.
                    transaction.set(statsRef, { count: 21 });
                } else {
                    // Otherwise, increment the existing count.
                    const newCount = statsDoc.data().count + 1;
                    transaction.update(statsRef, { count: newCount });
                }
            });
            console.log("Total learners count incremented.");

        } else {
            // Existing user: merge new info to update photoURL, displayName, etc.
            await setDoc(userRef, userData, { merge: true });
            console.log("Firestore user document updated for:", user.uid);
        }
    } catch (error: any) {
        console.error("Firestore user creation/update/counter error:", error);
        toast({
            title: "Profile Error",
            description: "Could not save your profile data or update stats. You may have restrictive security rules in Firestore.",
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
      toast({ title: t('auth.signOutTitle'), description: t('auth.signOutDesc') });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: t('auth.signOutErrorTitle'), description: error.message, variant: "destructive" });
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      await firebaseSignInAnonymously(auth);
      router.push('/dashboard');
      toast({ title: t('auth.guestWelcome'), description: t('auth.guestWelcomeDesc') });
    } catch (error: any) {
      console.error("Error signing in anonymously:", error);
      toast({ title: t('auth.guestErrorTitle'), description: error.message, variant: "destructive" });
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
      // Robust display name handling
      const displayName = (userDoc.exists() && userDoc.data().displayName) || userCredential.user.email?.split('@')[0] || 'User';
      
      toast({ title: t('auth.signInWelcome', { name: displayName }), description: t('auth.signInWelcomeDesc') });
    } catch (error: any) {
      let description = t('auth.unknownError');
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = t('auth.invalidCredentials');
      } else {
        description = error.message;
      }
      toast({ title: t('auth.signInErrorTitle'), description, variant: "destructive" });
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
      toast({ title: t('auth.googleWelcome'), description: t('auth.googleWelcomeDesc') });
    } catch (error: any) {
      let description = t('auth.unknownError');
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = t('auth.accountExistsError');
      } else {
        description = error.message;
      }
      toast({ title: t('auth.googleErrorTitle'), description: description, variant: "destructive" });
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
        
        toast({ title: t('auth.upgradeWelcome', { name: displayName }), description: t('auth.upgradeWelcomeDesc') });

      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
          // The onAuthStateChanged listener will handle the Firestore update.
          toast({ title: t('auth.signUpWelcome', { name: displayName }), description: t('auth.signUpWelcomeDesc') });
        }
      }
    } catch (error: any)
       {
      let description = t('auth.unknownError');
       if (error.code === 'auth/email-already-in-use') {
        description = t('auth.emailInUseError');
      } else if (error.code === 'auth/credential-already-in-use') {
        description = t('auth.credentialInUseError');
      } else {
        description = error.message;
      }
      toast({ title: t('auth.signUpErrorTitle'), description, variant: "destructive" });
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
