
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

  // This is the core listener. It's the single source of truth for auth state.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // Now we know the user's status for sure.
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // The redirect process result is handled by the (auth) layout
    await signInWithRedirect(auth, provider);
  };

  const signInAsGuest = async () => {
    // onAuthStateChanged will automatically update the user state.
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
