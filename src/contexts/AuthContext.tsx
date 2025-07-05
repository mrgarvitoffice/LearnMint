"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signOut, 
  signInAnonymously,
  type User,
  signInWithRedirect
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the single source of truth for auth status.
    // It runs on initial load and whenever the user's auth state changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Set loading to false once we have a definitive answer.
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Start the redirect process. The result will be handled on the page the user lands on.
    await signInWithRedirect(auth, provider);
  };

  const signInAsGuest = async () => {
    // The onAuthStateChanged listener will automatically update state.
    await signInAnonymously(auth);
  };

  const signOutUser = async () => {
    await signOut(auth);
    // onAuthStateChanged will set user to null.
  };
  
  const contextValue = {
    user,
    loading,
    signInWithGoogle,
    signInAsGuest,
    signOutUser,
  };

  // The provider makes user and loading state available to the whole app.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
