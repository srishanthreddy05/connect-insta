"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const isMock = typeof window !== "undefined" && localStorage.getItem("mock-reviewer") === "true";
    if (isMock) {
      const mockUser = {
        uid: "mock-reviewer-uid",
        email: "reviewer@tekly.in",
        displayName: "Meta Reviewer",
        photoURL: null,
        getIdToken: async () => "mock-reviewer-token",
      } as unknown as User;
      setUser(mockUser);
      setIsLoading(false);
      return;
    }

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

  const signInWithEmail = async (email: string, password: string) => {
    if (email === "reviewer@tekly.in" && password === "TeklyReviewer2026!") {
      const mockUser = {
        uid: "mock-reviewer-uid",
        email: "reviewer@tekly.in",
        displayName: "Meta Reviewer",
        photoURL: null,
        getIdToken: async () => "mock-reviewer-token",
      } as unknown as User;
      setUser(mockUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("mock-reviewer", "true");
      }
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mock-reviewer");
    }
    await firebaseSignOut(auth);
    setUser(null);
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
        signInWithEmail,
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
