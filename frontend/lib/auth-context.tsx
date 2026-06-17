"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  userId: string;
  apiKey: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, apiKey: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  userId: "",
  apiKey: "",
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("ig_user_id") || "";
    const storedApiKey = localStorage.getItem("ig_api_key") || "";
    setUserId(storedUserId);
    setApiKey(storedApiKey);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (newUserId: string, newApiKey: string) => {
      localStorage.setItem("ig_user_id", newUserId);
      localStorage.setItem("ig_api_key", newApiKey);
      setUserId(newUserId);
      setApiKey(newApiKey);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("ig_user_id");
    localStorage.removeItem("ig_api_key");
    setUserId("");
    setApiKey("");
    router.push("/login");
  }, [router]);

  const isAuthenticated = Boolean(userId && apiKey);

  return (
    <AuthContext.Provider
      value={{ userId, apiKey, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Hook that redirects to /login if user is not authenticated.
 * Use in dashboard pages.
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}
