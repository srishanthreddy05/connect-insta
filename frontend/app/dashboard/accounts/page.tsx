"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Camera,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getAccounts,
  getOAuthUrl,
  checkSubscription,
  resubscribe,
} from "@/lib/api";
import type { ConnectedAccount } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<
    Record<string, "checking" | "active" | "inactive" | "error">
  >({});
  const [resubscribing, setResubscribing] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const accts = await getAccounts();
      setAccounts(accts);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleCheckSubscription = async (instagramId: string) => {
    setSubStatus((prev) => ({ ...prev, [instagramId]: "checking" }));
    try {
      const result = await checkSubscription(instagramId);
      const isActive =
        result?.data && Array.isArray(result.data) && result.data.length > 0;
      setSubStatus((prev) => ({
        ...prev,
        [instagramId]: isActive ? "active" : "inactive",
      }));
    } catch {
      setSubStatus((prev) => ({ ...prev, [instagramId]: "error" }));
    }
  };

  const handleResubscribe = async (instagramId: string) => {
    setResubscribing(instagramId);
    try {
      await resubscribe(instagramId);
      setSubStatus((prev) => ({ ...prev, [instagramId]: "active" }));
    } catch {
      setSubStatus((prev) => ({ ...prev, [instagramId]: "error" }));
    } finally {
      setResubscribing(null);
    }
  };

  const handleConnect = () => {
    window.location.href = getOAuthUrl(userId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Connected Accounts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your linked Instagram Business accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchAccounts}
            variant="ghost"
            size="icon"
            className="rounded-xl"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            onClick={handleConnect}
            className="rounded-xl ig-gradient-bg text-white border-0 hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        </div>
      </div>

      {/* Accounts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded-lg bg-muted" />
                  <div className="h-4 w-56 rounded-lg bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in-up">
          <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-medium">No accounts connected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your first Instagram Business account to start automating.
          </p>
          <Button
            onClick={handleConnect}
            className="mt-6 rounded-xl ig-gradient-bg text-white border-0 hover:opacity-90"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Connect via Instagram
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account, index) => {
            const sub = subStatus[account.instagramId];

            return (
              <div
                key={account.id}
                className="glass rounded-2xl p-6 transition-all hover:glow-sm animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Avatar */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ig-gradient-bg text-xl font-bold text-white shadow-lg">
                    {account.instagramUsername?.charAt(0)?.toUpperCase() || "IG"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold">
                        @{account.instagramUsername || "Unknown"}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-lg text-xs",
                          account.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                        )}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                      ID: {account.instagramId}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected{" "}
                      {new Date(account.connectedAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  {/* Subscription status & actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Subscription badge */}
                    {sub === "checking" && (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
                      >
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        Checking…
                      </Badge>
                    )}
                    {sub === "active" && (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      >
                        <Wifi className="mr-1 h-3 w-3" />
                        Subscribed
                      </Badge>
                    )}
                    {sub === "inactive" && (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
                      >
                        <WifiOff className="mr-1 h-3 w-3" />
                        Not subscribed
                      </Badge>
                    )}
                    {sub === "error" && (
                      <Badge
                        variant="outline"
                        className="rounded-lg text-xs bg-red-500/10 text-red-400 border-red-500/30"
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Error
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() =>
                        handleCheckSubscription(account.instagramId)
                      }
                      disabled={sub === "checking"}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Check
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => handleResubscribe(account.instagramId)}
                      disabled={resubscribing === account.instagramId}
                    >
                      <RefreshCw
                        className={cn(
                          "mr-1 h-3.5 w-3.5",
                          resubscribing === account.instagramId &&
                          "animate-spin"
                        )}
                      />
                      Resubscribe
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info card */}
      <div className="glass-subtle rounded-2xl p-5 animate-fade-in-up stagger-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          How it works
        </h3>
        <p className="mt-1 text-xs text-muted-foreground/80 leading-relaxed">
          Clicking &quot;Connect Account&quot; redirects you to Instagram&apos;s OAuth flow.
          After authorization, your account token is encrypted and stored
          securely. The webhook subscription enables real-time comment and
          message monitoring.
        </p>
      </div>
    </div>
  );
}
