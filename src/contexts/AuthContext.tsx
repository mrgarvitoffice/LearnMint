"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signOut,
  signInAnonymously,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean; // This is the crucial loading state.
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as true

  useEffect(() => {
    // onAuthStateChanged is the listener for Firebase auth state.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // Set the user (or null)
      setLoading(false);      // Set loading to false once the check is complete.
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const signInAsGuest = async () => {
    await signInAnonymously(auth);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const value = { user, loading, signInAsGuest, signOutUser };

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
