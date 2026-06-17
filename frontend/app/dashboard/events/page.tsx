"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Activity,
  RefreshCw,
  Send,
  FlaskConical,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventRow } from "@/components/event-row";
import { getWebhookEvents, getAccounts, testWebhook, testDm } from "@/lib/api";
import type { WebhookEvent, ConnectedAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Test forms
  const [testWebhookOpen, setTestWebhookOpen] = useState(false);
  const [testDmOpen, setTestDmOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    instagramId: "",
    commentText: "price",
    commenterId: "TEST_USER_123",
    recipientId: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [evts, accts] = await Promise.all([
        getWebhookEvents().catch(() => []),
        getAccounts().catch(() => []),
      ]);
      setEvents(evts);
      setAccounts(accts);
      if (accts.length > 0 && !testForm.instagramId) {
        setTestForm((prev) => ({
          ...prev,
          instagramId: accts[0].instagramId,
        }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = events.filter((e) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "processed" && e.processed && !e.error) ||
      (filter === "errors" && e.error) ||
      (filter === "pending" && !e.processed);
    const matchesSearch =
      !search ||
      e.eventId.toLowerCase().includes(search.toLowerCase()) ||
      e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      e.instagramId.includes(search);
    return matchesFilter && matchesSearch;
  });

  const handleTestWebhook = async () => {
    setSending(true);
    setTestResult(null);
    try {
      await testWebhook({
        instagramId: testForm.instagramId,
        commentText: testForm.commentText,
        commenterId: testForm.commenterId,
      });
      setTestResult("✅ Test webhook injected! Check server logs.");
      setTimeout(() => fetchData(), 1500);
    } catch (err: unknown) {
      setTestResult(`❌ ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setSending(false);
    }
  };

  const handleTestDm = async () => {
    setSending(true);
    setTestResult(null);
    try {
      await testDm({
        instagramId: testForm.instagramId,
        recipientId: testForm.recipientId,
        message: testForm.message,
      });
      setTestResult("✅ Test DM sent successfully!");
    } catch (err: unknown) {
      setTestResult(`❌ ${err instanceof Error ? err.message : "Failed"}`);
    } finally {
      setSending(false);
    }
  };

  const filters = [
    { value: "all", label: "All" },
    { value: "processed", label: "Processed" },
    { value: "pending", label: "Pending" },
    { value: "errors", label: "Errors" },
  ];

  const processedCount = events.filter((e) => e.processed && !e.error).length;
  const errorCount = events.filter((e) => e.error).length;
  const pendingCount = events.filter((e) => !e.processed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Webhook Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor incoming Instagram webhook events and their processing
            status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            variant="ghost"
            size="icon"
            className="rounded-xl"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setTestResult(null);
              setTestWebhookOpen(true);
            }}
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            Test Webhook
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setTestResult(null);
              setTestDmOpen(true);
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            Test DM
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 animate-fade-in-up stagger-1">
        <Badge variant="outline" className="rounded-lg text-xs bg-muted/50 border-muted">
          {events.length} total
        </Badge>
        <Badge
          variant="outline"
          className="rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        >
          {processedCount} processed
        </Badge>
        <Badge
          variant="outline"
          className="rounded-lg text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
        >
          {pendingCount} pending
        </Badge>
        {errorCount > 0 && (
          <Badge
            variant="outline"
            className="rounded-lg text-xs bg-red-500/10 text-red-400 border-red-500/30"
          >
            {errorCount} errors
          </Badge>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up stagger-2">
        <div className="flex items-center gap-1 rounded-xl bg-input/30 p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                filter === f.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by event ID, type, or account…"
            className="h-9 rounded-xl bg-input/50 pl-10 text-sm"
          />
        </div>
      </div>

      {/* Events list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-xl px-5 py-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-5 w-5 rounded-full bg-muted" />
                <div className="h-4 w-20 rounded-lg bg-muted" />
                <div className="h-4 w-48 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in-up">
          <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-medium">
            {search || filter !== "all"
              ? "No events match your filters"
              : "No webhook events yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || filter !== "all"
              ? "Try adjusting your filters"
              : "Events will appear here when Instagram sends webhook notifications."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event, index) => (
            <EventRow key={event.id} event={event} index={index} />
          ))}
        </div>
      )}

      {/* Test Webhook Dialog */}
      <Dialog open={testWebhookOpen} onOpenChange={setTestWebhookOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simulate Comment Webhook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Instagram Account
              </label>
              <select
                value={testForm.instagramId}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    instagramId: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.instagramId} value={a.instagramId}>
                    @{a.instagramUsername || a.instagramId}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Comment Text
              </label>
              <Input
                value={testForm.commentText}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    commentText: e.target.value,
                  }))
                }
                placeholder="price"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Commenter ID
              </label>
              <Input
                value={testForm.commenterId}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    commenterId: e.target.value,
                  }))
                }
                placeholder="TEST_USER_123"
                className="bg-input/50"
              />
            </div>
            {testResult && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm animate-fade-in">
                {testResult}
              </p>
            )}
            <Button
              onClick={handleTestWebhook}
              disabled={sending || !testForm.instagramId}
              className="w-full rounded-xl ig-gradient-bg text-white border-0"
            >
              {sending ? "Sending…" : "Inject Test Event"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test DM Dialog */}
      <Dialog open={testDmOpen} onOpenChange={setTestDmOpen}>
        <DialogContent className="glass border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Test DM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Instagram Account
              </label>
              <select
                value={testForm.instagramId}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    instagramId: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.instagramId} value={a.instagramId}>
                    @{a.instagramUsername || a.instagramId}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Recipient IG User ID
              </label>
              <Input
                value={testForm.recipientId}
                onChange={(e) =>
                  setTestForm((prev) => ({
                    ...prev,
                    recipientId: e.target.value,
                  }))
                }
                placeholder="Enter recipient's Instagram ID"
                className="bg-input/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Message
              </label>
              <textarea
                value={testForm.message}
                onChange={(e) =>
                  setTestForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Type your test message…"
                rows={3}
                className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none"
              />
            </div>
            {testResult && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm animate-fade-in">
                {testResult}
              </p>
            )}
            <Button
              onClick={handleTestDm}
              disabled={
                sending ||
                !testForm.instagramId ||
                !testForm.recipientId ||
                !testForm.message
              }
              className="w-full rounded-xl ig-gradient-bg text-white border-0"
            >
              {sending ? "Sending…" : "Send Test DM"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
