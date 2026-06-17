"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

// Google G SVG icon
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { isAuthenticated, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleGoogleSignIn = async () => {
    setError("");
    setSigning(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged fires → AuthProvider sets user → useEffect above redirects
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      // Ignore popup-closed-by-user
      if (!msg.includes("popup-closed")) {
        setError(msg);
      }
    } finally {
      setSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 items-center justify-center px-4 overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-chart-2/8 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-chart-3/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-2xl ig-gradient-bg p-4 shadow-2xl glow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="ig-gradient-text">InstaConnect</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Instagram Automation Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 glow-sm">
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Sign in to manage your Instagram automations
          </p>

          <Button
            onClick={handleGoogleSignIn}
            disabled={signing}
            className="w-full h-12 rounded-xl bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 shadow-sm font-medium text-sm flex items-center gap-3 transition-all hover:shadow-md"
          >
            {signing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
            ) : (
              <GoogleIcon />
            )}
            {signing ? "Signing in…" : "Continue with Google"}
          </Button>

          {error && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in text-center">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured with Google OAuth + Firebase Auth</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Your Google account is used only for authentication.
        </p>
      </div>
    </div>
  );
}