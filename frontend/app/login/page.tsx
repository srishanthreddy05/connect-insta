"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Zap, Shield, Check, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

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
  const [signingEmail, setSigningEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      if (!msg.includes("popup-closed")) {
        setError(msg);
      }
    } finally {
      setSigning(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigningEmail(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      setError(msg);
    } finally {
      setSigningEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-white px-4 sm:px-6">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-slate-100 to-transparent opacity-60 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-slate-100 to-transparent opacity-60 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.jpeg"
            alt="Connect Logo"
            width={72}
            height={72}
            className="mx-auto rounded-2xl shadow-lg"
            priority
          />
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Automate Instagram conversations.
        </h1>
        <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-500 sm:text-lg">
          Turn comments into DMs, capture leads, and grow your business—all from one dashboard.
        </p>

        {/* CTA Button */}
        <div className="mt-10 w-full max-w-xs">
          <Button
            onClick={handleGoogleSignIn}
            disabled={signing || signingEmail}
            className="h-12 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 font-medium text-sm flex items-center justify-center gap-3"
          >
            {signing ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <GoogleIcon />
            )}
            {signing ? "Signing in…" : "Continue with Google"}
          </Button>
        </div>

        {/* Reviewer Login Section */}
        <div className="my-6 flex w-full max-w-xs items-center justify-between gap-2 text-[10px] font-semibold tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200"></span>
          <span>REVIEWER LOGIN</span>
          <span className="h-px flex-1 bg-slate-200"></span>
        </div>

        <form onSubmit={handleEmailSignIn} className="w-full max-w-xs space-y-3.5 text-left bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-600">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              placeholder="reviewer@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-600">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={signing || signingEmail}
            className="h-10 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all duration-200 shadow-md"
          >
            {signingEmail ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              "Sign In with Email"
            )}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <p className="mt-4 w-full max-w-xs rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 animate-fade-in text-center">
            {error}
          </p>
        )}

        {/* Trust badges */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
            <span>Official Meta API</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
            <span>Secure Authentication</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Check className="h-4 w-4 text-green-500" strokeWidth={3} />
            <span>No Credit Card Required</span>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-10 flex items-center gap-4 text-xs text-slate-400">
          <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}