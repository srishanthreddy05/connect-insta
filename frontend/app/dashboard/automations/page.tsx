"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Zap,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AutomationForm } from "@/components/automation-form";
import { toast } from "sonner";
import {
  getAutomations,
  getAccounts,
  createAutomation,
  updateAutomation,
  deleteAutomation,
} from "@/lib/api";
import type {
  Automation,
  ConnectedAccount,
  CreateAutomationPayload,
} from "@/lib/types";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth-context";

export default function AutomationsPage() {
  const { user } = useAuth();
  const userId = user?.uid;
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [autos, accts] = await Promise.all([
        getAutomations().catch(() => []),
        getAccounts().catch(() => []),
      ]);
      setAutomations(autos);
      setAccounts(accts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId]);

  const handleCreate = async (payload: CreateAutomationPayload) => {
    try {
      await createAutomation(payload);
      toast.success("Automation created successfully");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create automation");
    }
  };

  const handleUpdate = async (payload: CreateAutomationPayload) => {
    if (!editing) return;
    try {
      await updateAutomation(editing.id, payload);
      toast.success("Automation updated successfully");
      setEditing(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update automation");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAutomation(id);
      toast.success("Automation deleted successfully");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete automation");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (automation: Automation) => {
    const nextState = !automation.isActive;
    try {
      await updateAutomation(automation.id, { isActive: nextState });
      toast.success(`Automation ${nextState ? "activated" : "deactivated"} successfully`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle automation");
    }
  };

  const filtered = automations.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.keywords.some((k) => k.includes(search.toLowerCase())) ||
      a.responseMessage.toLowerCase().includes(search.toLowerCase())
  );

  const getAccountUsername = (instagramId: string) => {
    const account = accounts.find((a) => a.instagramId === instagramId);
    return account?.instagramUsername
      ? `@${account.instagramUsername}`
      : instagramId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Automations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage keyword triggers and auto-responses for your Instagram accounts.
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
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="rounded-xl ig-gradient-bg text-white border-0 hover:opacity-90 transition-opacity"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up stagger-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search automations by name, keyword, or message…"
          className="h-11 rounded-xl bg-input/50 pl-10"
        />
      </div>

      {/* Automations list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 animate-pulse"
            >
              <div className="h-5 w-48 rounded-lg bg-muted" />
              <div className="mt-3 h-4 w-72 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center animate-fade-in-up">
          <Zap className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-medium">
            {search ? "No automations match your search" : "No automations yet"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? "Try a different search term"
              : "Create your first automation to start auto-responding to comments and DMs."}
          </p>
          {!search && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="mt-6 rounded-xl ig-gradient-bg text-white border-0 hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((automation, index) => (
            <div
              key={automation.id}
              className={cn(
                "glass rounded-2xl p-5 transition-all duration-200 hover:glow-sm animate-fade-in-up",
                !automation.isActive && "opacity-60"
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(automation)}
                  className="mt-0.5 shrink-0 transition-colors"
                  title={automation.isActive ? "Deactivate" : "Activate"}
                >
                  {automation.isActive ? (
                    <ToggleRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold">{automation.name}</h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-lg text-xs",
                        automation.triggerType === "COMMENT"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      )}
                    >
                      {automation.triggerType === "COMMENT" ? "💬 Comment" : "✉️ DM"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="rounded-lg text-xs bg-muted/50 text-muted-foreground border-muted"
                    >
                      {automation.matchType}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {getAccountUsername(automation.instagramId)}
                  </p>

                  {/* Keywords */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {automation.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Replies badges */}
                  {automation.triggerType === "COMMENT" ? (
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground animate-fade-in">
                      <span className="font-semibold text-xs text-muted-foreground/80">Replies:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 bg-background text-foreground/85 border-border">
                        {automation.enableCommentReply ? "✅" : "❌"} Comment
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 bg-background text-foreground/85 border-border">
                        ✅ DM
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground animate-fade-in">
                      <span className="font-semibold text-xs text-muted-foreground/80">Sequence:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 bg-background text-foreground/85 border-border">
                        📩 Opening + {automation.messages?.length || 0} message(s)
                      </span>
                    </div>
                  )}

                  {/* Automation Details */}
                  <div className="mt-4 pt-3.5 border-t border-border/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs animate-fade-in">
                    {automation.triggerType === "COMMENT" ? (
                      <>
                        <div>
                          <span className="block font-medium text-muted-foreground">Trigger</span>
                          <span className="mt-1 block font-semibold text-foreground/90">
                            Comment ({automation.matchType})
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Reply to Comment</span>
                          <span className="mt-1 block font-semibold text-foreground/90 truncate max-w-[120px]" title={automation.commentReplyMessage || ""}>
                            {automation.enableCommentReply ? (automation.commentReplyMessage || "Enabled") : "Disabled"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">DM Message</span>
                          <span className="mt-1 block font-semibold text-foreground/90 truncate max-w-[120px]" title={automation.responseMessage || ""}>
                            {automation.responseMessage || "(No DM message)"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Posts</span>
                          <span className="mt-1 block font-semibold text-foreground/90">
                            {automation.applyToAllPosts ? "All Posts" : `${automation.selectedMedia?.length || 0} selected`}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="block font-medium text-muted-foreground">Trigger</span>
                          <span className="mt-1 block font-semibold text-foreground/90">
                            Direct Message
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Opening Message</span>
                          <span className="mt-1 block font-semibold text-foreground/90 truncate max-w-[120px]" title={automation.openingMessage || ""}>
                            {automation.openingMessage || "(No opening message)"}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Sequential Queue</span>
                          <span className="mt-1 block font-semibold text-foreground/90">
                            {automation.messages?.length || 0} message(s)
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-muted-foreground">Scope</span>
                          <span className="mt-1 block font-semibold text-foreground/90">
                            All DMs
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Error Card */}
                  {automation.lastError && (
                    <div className="mt-3.5 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5 animate-fade-in text-xs text-left">
                      <div className="text-destructive shrink-0 mt-0.5">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-destructive-foreground">
                          Automation paused: {automation.lastError}
                        </p>
                        <button
                          onClick={() => handleToggle(automation)}
                          className="mt-1 block font-semibold text-primary hover:underline bg-transparent border-0 cursor-pointer p-0 text-[10px]"
                        >
                          Retry / Reactivate now
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Analytics & Metrics */}
                  <div className="mt-3.5 pt-3 border-t border-border/20 flex flex-wrap gap-4 text-[10px] text-muted-foreground animate-fade-in">
                    <div className="flex items-center gap-1">
                      <span>Total Triggers:</span>
                      <span className="font-bold text-foreground">{automation.triggerCount || 0}</span>
                    </div>
                    {automation.enableCommentReply && (
                      <div className="flex items-center gap-1">
                        <span>Comments Replied:</span>
                        <span className="font-bold text-foreground">{automation.commentsRepliedCount || 0}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <span>DMs Sent:</span>
                      <span className="font-bold text-foreground">{automation.dmsSentCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => {
                      setEditing(automation);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/15"
                    onClick={() => handleDelete(automation.id)}
                    disabled={deleting === automation.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <AutomationForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        accounts={accounts}
        automation={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}
