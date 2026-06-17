"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, Zap, Activity, Plus, ArrowRight, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAccounts, getAutomations, getWebhookEvents } from "@/lib/api";
import type { ConnectedAccount, Automation, WebhookEvent } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { userId } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accts, autos, evts] = await Promise.all([
        getAccounts().catch(() => []),
        getAutomations().catch(() => []),
        getWebhookEvents().catch(() => []),
      ]);
      setAccounts(accts);
      setAutomations(autos);
      setEvents(evts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeAutomations = automations.filter((a) => a.isActive);
  const recentEvents = events.slice(0, 5);

  const eventTypeColors: Record<string, string> = {
    comment: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    message: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    mention: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Here&apos;s an overview of your automations.
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="ghost"
          size="icon"
          className="rounded-xl"
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Camera}
          label="Connected Accounts"
          value={accounts.length}
          subtitle={`${accounts.filter((a) => a.isActive).length} active`}
          delay={0}
        />
        <StatCard
          icon={Zap}
          label="Active Automations"
          value={activeAutomations.length}
          subtitle={`${automations.length} total`}
          delay={1}
        />
        <StatCard
          icon={Activity}
          label="Webhook Events"
          value={events.length}
          subtitle={`${events.filter((e) => e.processed).length} processed`}
          delay={2}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up stagger-3">
        <Link
          href="/dashboard/accounts"
          className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:glow-sm hover:scale-[1.01]"
        >
          <div className="rounded-xl ig-gradient-bg p-3 shadow-lg">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Connect Instagram Account</p>
            <p className="text-sm text-muted-foreground">
              Link a new business account via OAuth
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/dashboard/automations"
          className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:glow-sm hover:scale-[1.01]"
        >
          <div className="rounded-xl bg-chart-2/15 p-3">
            <Zap className="h-5 w-5 text-chart-2" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Create Automation</p>
            <p className="text-sm text-muted-foreground">
              Set up keyword triggers and auto-responses
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Recent Events */}
      <div className="animate-fade-in-up stagger-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <Link
            href="/dashboard/events"
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No webhook events yet. Connect an account and set up an automation
              to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event, i) => (
              <div
                key={event.id}
                className="glass flex items-center gap-4 rounded-xl px-4 py-3 animate-fade-in-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-lg text-xs",
                    eventTypeColors[event.eventType] ||
                      "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
                  )}
                >
                  {event.eventType}
                </Badge>
                <span className="flex-1 truncate text-sm text-muted-foreground font-mono">
                  {event.eventId.length > 30
                    ? event.eventId.slice(0, 30) + "…"
                    : event.eventId}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(event.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {event.processed ? (
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
