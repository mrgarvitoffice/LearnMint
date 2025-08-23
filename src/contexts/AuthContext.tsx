
"use client";
/**
 * @fileoverview Provides authentication context and logic for the application.
 * This file manages user state (sign-in, sign-up, sign-out, guest mode) using Firebase Authentication.
 * It also handles the creation and updating of user documents in Firestore upon authentication events.
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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { GoalSelectionDialog } from '@/components/features/auth/GoalSelectionDialog';

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
  const [showGoalSelection, setShowGoalSelection] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();

  const handleUserCreationInFirestore = useCallback(async (user: User, isNewUser = false) => {
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
            await setDoc(userRef, {
                ...userData,
                joinedAt: serverTimestamp(),
            });
            console.log("Firestore user document created for new user:", user.uid);
            setShowGoalSelection(true); // Trigger goal selection for new users
        } else {
            await setDoc(userRef, userData, { merge: true });
            if (isNewUser) {
                // This can happen if a user signs up, closes the app, and re-opens.
                // We check if a goal is set, if not, we show the dialog.
                const goal = localStorage.getItem('nexithra-user-goal');
                if (!goal) {
                    setShowGoalSelection(true);
                }
            }
        }
    } catch (error: any) {
        console.error("Firestore user creation/update error:", error);
        toast({
            title: t('auth.profileErrorTitle'),
            description: t('auth.profileErrorDesc'),
            variant: "destructive",
        });
    }
  }, [toast, t]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  

  const signOutUser = async () => {
    try {
      await signOut(auth);
      toast({ title: t('auth.signOutTitle'), description: t('auth.signOutDesc') });
      router.push('/sign-in'); // Redirect to sign-in page after logout
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: t('auth.signOutErrorTitle'), description: error.message, variant: "destructive" });
    }
  };
  
  const signInAnonymously = async () => {
    setLoading(true);
    try {
      const userCredential = await firebaseSignInAnonymously(auth);
      // Don't show goal selection for guests
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
      await handleUserCreationInFirestore(userCredential.user); // Handle login update
      const displayName = userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User';
      toast({ title: t('auth.signInWelcome', { name: displayName }), description: t('auth.signInWelcomeDesc') });
      router.push('/dashboard');
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
      const userCredential = await signInWithPopup(auth, provider);
      await handleUserCreationInFirestore(userCredential.user);
      router.push('/dashboard');
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
        await handleUserCreationInFirestore(linkedUser, true);
        toast({ title: t('auth.upgradeWelcome', { name: displayName }), description: t('auth.upgradeWelcomeDesc') });

      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
          await handleUserCreationInFirestore(userCredential.user, true);
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

  const handleGoalSelectionComplete = () => {
    setShowGoalSelection(false);
    router.push('/dashboard');
  };

  const value = { user, loading, signOutUser, signInWithEmail, signUpWithEmail, signInAnonymously, signInWithGoogle };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GoalSelectionDialog
        isOpen={showGoalSelection}
        onClose={handleGoalSelectionComplete}
      />
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
