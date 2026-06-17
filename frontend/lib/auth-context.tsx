"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  userId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    // onAuthStateChanged will fire and update user state automatically
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // No auto-redirect — let the user stay on the page or navigate manually
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.uid ?? "",
        isAuthenticated: Boolean(user),
        isLoading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function useRequireAuth() {
  const authCtx = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authCtx.isLoading && !authCtx.isAuthenticated) {
      router.replace("/login");
    }
  }, [authCtx.isLoading, authCtx.isAuthenticated, router]);

  return authCtx;
}
