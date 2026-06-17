"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  // Redirect if already logged in
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId.trim()) {
      setError("User ID is required");
      return;
    }
    if (!apiKey.trim()) {
      setError("API Key is required");
      return;
    }

    login(userId.trim(), apiKey.trim());
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
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-chart-2/8 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-chart-3/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
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

        {/* Login card */}
        <div className="glass rounded-3xl p-8 glow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="userId"
                className="text-sm font-medium text-muted-foreground"
              >
                User ID
              </label>
              <Input
                id="userId"
                type="text"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="h-12 rounded-xl bg-input/50 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="text-sm font-medium text-muted-foreground"
              >
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-12 rounded-xl bg-input/50 text-base"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl ig-gradient-bg text-white text-base font-semibold border-0 shadow-lg hover:opacity-90 transition-all hover:glow-md group"
            >
              Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured with API key authentication</span>
          </div>
        </div>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Enter the User ID and Admin API Key configured in your backend&apos;s
          environment variables.
        </p>
      </div>
    </div>
  );
}