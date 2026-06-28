"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Zap, BarChart3, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Google G SVG icon
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
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

// Tekly Custom Infinity-Chat SVG Logo
function TeklyLogo({ className = "h-8 w-8 text-white" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 13c1.6-2 2.6-4 5.2-4 2.6 0 4.8 2 4.8 4.5S19.8 18 17.2 18c-2.6 0-3.6-2-5.2-4m0 0C10.4 12 9.4 10 6.8 10 4.2 10 2 12 2 14.5S4.2 17 6.8 17c2.6 0 3.6-2 5.2-4" />
      <path d="M2 14.5l-1.5 2.5 3.5-1" />
    </svg>
  );
}

export default function LoginPage() {
  const { isAuthenticated, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signingEmail, setSigningEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const validateForm = () => {
    if (!email) {
      setError("Email address is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (authMode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return false;
      }
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;

    setSigningEmail(true);
    try {
      if (authMode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: unknown) {
      let msg = "An authentication error occurred.";
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes("auth/email-already-in-use")) {
          msg = "This email is already in use.";
        } else if (msg.includes("auth/invalid-credential")) {
          msg = "Invalid email or password.";
        } else if (msg.includes("auth/weak-password")) {
          msg = "Password should be at least 6 characters.";
        } else if (msg.includes("auth/user-not-found")) {
          msg = "No user found with this email.";
        } else if (msg.includes("auth/wrong-password")) {
          msg = "Incorrect password.";
        } else if (msg.includes("auth/invalid-email")) {
          msg = "Invalid email address format.";
        }
      }
      setError(msg);
    } finally {
      setSigningEmail(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSent(false);

    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSigningEmail(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err: unknown) {
      let msg = "Failed to send reset email.";
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes("auth/user-not-found")) {
          msg = "No user found with this email.";
        } else if (msg.includes("auth/invalid-email")) {
          msg = "Invalid email address format.";
        }
      }
      setError(msg);
    } finally {
      setSigningEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0A0F1E] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F9FAFB] font-sans antialiased selection:bg-[#7C3AED]/20">

      {/* LEFT PANEL — BRAND SIDE */}
      <div className="w-full lg:w-[55%] bg-[#0A0F1E] text-white flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden shrink-0 min-h-[220px] lg:min-h-screen">

        {/* Dot matrix texture overlay (faint radial grid at 4% opacity) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1.5px)] bg-[size:20px_20px]" />

        {/* Soft violet radial gradient ambient glow pulsing behind headline */}
        <div className="pointer-events-none absolute left-1/4 top-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-[#7C3AED] rounded-full filter blur-[80px] animate-ambient mix-blend-screen" />

        {/* Mobile Header tag bar */}
        <div className="flex lg:hidden items-center justify-between z-10 w-full">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.jpeg"
              alt="Tekly Logo"
              width={24}
              height={24}
              className="rounded-lg shadow-sm"
            />
            <span className="font-semibold tracking-wide text-base">Tekly</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B7280] font-semibold">
            Automate comments & DMs
          </span>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-2.5 z-10">
          <Image
            src="/logo.jpeg"
            alt="Tekly Logo"
            width={32}
            height={32}
            className="rounded-xl shadow-md"
          />
          <span className="font-medium tracking-wide text-lg">Tekly</span>
        </div>

        {/* Brand content (desktop centered) */}
        <div className="hidden lg:flex flex-col my-auto space-y-9 z-10 max-w-lg">
          <h2 className="text-[44px] lg:text-[52px] font-bold tracking-tight leading-[1.1] text-white">
            Every comment.<br />
            Every DM.<br />
            Every lead.<br />
            Automated.
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#7C3AED]">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="text-sm font-normal text-slate-200">
                Turn comments into qualified leads
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#7C3AED]">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-sm font-normal text-slate-200">
                Respond instantly, 24/7
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#7C3AED]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-sm font-normal text-slate-200">
                One dashboard for all conversations
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Footer social proof (without fake numbers) */}
        <div className="hidden lg:block z-10 text-xs text-[#6B7280] tracking-[0.08em] uppercase font-semibold">
          Trusted by creators & brands
        </div>

      </div>

      {/* RIGHT PANEL — AUTH SIDE */}
      <div className="w-full lg:w-[45%] flex-1 bg-[#F9FAFB] flex flex-col justify-center items-center py-12 px-6 sm:px-12 relative min-h-[500px]">

        <div className="w-full max-w-[380px] space-y-7 animate-fade-in flex flex-col">

          {/* Centered logo icon */}
          <div className="flex justify-center">
            <Image
              src="/logo.jpeg"
              alt="Tekly Logo"
              width={72}
              height={72}
              className="rounded-2xl shadow-lg border border-slate-100"
            />
          </div>

          {/* Form Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl lg:text-[28px] font-bold tracking-tight text-[#111827] leading-tight">
              {showForgotPassword ? "Reset Password" : authMode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {showForgotPassword ? "Enter your email address to recover your account" : authMode === "signin" ? "Sign in to your workspace" : "Get started with your free account"}
            </p>
          </div>

          {showForgotPassword ? (
            /* Forgot Password Flow */
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="resetEmail" className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em]">
                  Email Address
                </label>
                <input
                  id="resetEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#111827] outline-none placeholder:text-[#6B7280]/40 focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 transition-all duration-150"
                  placeholder="name@example.com"
                />
              </div>

              {resetSent && (
                <p className="text-xs text-emerald-600 font-semibold text-center py-2 bg-emerald-50 rounded-lg animate-fade-in border border-emerald-100">
                  ✓ Reset link has been sent to your email.
                </p>
              )}

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  disabled={signingEmail}
                  className="h-11 w-full rounded-lg bg-[#0A0F1E] text-white hover:bg-[#0A0F1E]/95 active:scale-[0.98] font-medium text-sm flex items-center justify-center gap-2 transition-all border-0 shadow-sm"
                >
                  {signingEmail ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(""); setResetSent(false); }}
                  className="w-full text-center text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors bg-transparent border-0 cursor-pointer pt-1"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* Sign In / Sign Up Flow */
            <div className="space-y-6">

              {/* Primary Google Auth Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={signing || signingEmail}
                className="h-11 w-full rounded-lg bg-white text-[#111827] border border-[#E5E7EB] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 transition-all duration-150 ease-in-out font-medium text-sm flex items-center justify-center gap-3 cursor-pointer shadow-sm"
              >
                {signing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#111827]/40 border-t-[#111827]" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              {/* Styled Divider */}
              <div className="flex items-center gap-3 text-[10px] font-semibold tracking-[0.08em] text-[#6B7280] uppercase">
                <span className="h-px flex-1 bg-[#E5E7EB]"></span>
                <span className="shrink-0">
                  {authMode === "signin" ? "or sign in with email" : "or sign up with email"}
                </span>
                <span className="h-px flex-1 bg-[#E5E7EB]"></span>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em]">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#6B7280]/40 focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 transition-all duration-150"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em]">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(true); setError(""); }}
                        className="text-xs font-semibold text-[#7C3AED] hover:underline bg-transparent border-0 cursor-pointer p-0"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-[#E5E7EB] bg-white pl-3.5 pr-10 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#6B7280]/40 focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 transition-all duration-150"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6B7280] hover:text-[#111827] bg-transparent border-0 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label htmlFor="confirmPassword" className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.08em]">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#6B7280]/40 focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 transition-all duration-150"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={signing || signingEmail}
                  className="h-11 w-full rounded-lg bg-[#0A0F1E] text-white hover:bg-[#0A0F1E]/95 active:scale-[0.98] font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all border-0 shadow-sm"
                >
                  {signingEmail ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : authMode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Bottom toggle link */}
              <div className="text-center pt-1">
                {authMode === "signin" ? (
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signup"); setError(""); }}
                    className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Don&apos;t have an account? <span className="font-semibold text-[#7C3AED] hover:underline">Start free →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAuthMode("signin"); setError(""); }}
                    className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors bg-transparent border-0 cursor-pointer"
                  >
                    Already have an account? <span className="font-semibold text-[#7C3AED] hover:underline">Sign in →</span>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* Form level error indicator */}
          {error && (
            <p className="w-full rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-600 animate-fade-in text-center font-semibold">
              {error}
            </p>
          )}

          {/* Micro Footer links */}
          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[#6B7280]">
            <a href="/privacy" className="hover:text-[#111827] transition-colors font-medium">Privacy Policy</a>
            <span className="text-[#E5E7EB]">•</span>
            <a href="/terms" className="hover:text-[#111827] transition-colors font-medium">Terms of Service</a>
          </div>

        </div>
      </div>
    </div>
  );
}