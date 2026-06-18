"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeywordInput } from "@/components/keyword-input";
import { RefreshCw, Image } from "lucide-react";
import { getInstagramMedia } from "@/lib/api";
import type {
  Automation,
  ConnectedAccount,
  CreateAutomationPayload,
  MatchType,
  TriggerType,
  InstagramMedia,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface AutomationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ConnectedAccount[];
  automation?: Automation | null;
  onSubmit: (payload: CreateAutomationPayload) => Promise<void>;
}

const matchTypes: { value: MatchType; label: string; description: string }[] = [
  { value: "CONTAINS", label: "Contains", description: "Message contains keyword anywhere" },
  { value: "EXACT", label: "Exact", description: "Message exactly matches keyword" },
  { value: "STARTS_WITH", label: "Starts with", description: "Message starts with keyword" },
];

const triggerTypes: { value: TriggerType; label: string; icon: string }[] = [
  { value: "COMMENT", label: "Comment", icon: "💬" },
  { value: "DM", label: "Direct Message", icon: "✉️" },
];

export function AutomationForm({
  open,
  onOpenChange,
  accounts,
  automation,
  onSubmit,
}: AutomationFormProps) {
  const [name, setName] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [pendingKeyword, setPendingKeyword] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("CONTAINS");
  const [triggerType, setTriggerType] = useState<TriggerType>("COMMENT");
  const [responseMessage, setResponseMessage] = useState("");
  const [greeting, setGreeting] = useState("");
  const [choice1, setChoice1] = useState("");
  const [choice2, setChoice2] = useState("");
  const [fallback, setFallback] = useState("Please reply with 1 or 2");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [applyToAllPosts, setApplyToAllPosts] = useState(true);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [mediaList, setMediaList] = useState<InstagramMedia[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const fetchMedia = async (igId: string, force = false) => {
    if (!igId) {
      setMediaList([]);
      return;
    }
    setLoadingMedia(true);
    setMediaError(null);
    try {
      const media = await getInstagramMedia(igId, force);
      setMediaList(media);
    } catch (err: any) {
      setMediaError(err.message || "Failed to load Instagram media.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const isEditing = Boolean(automation);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setInstagramId(automation.instagramId);
      setKeywords(automation.keywords);
      setMatchType(automation.matchType);
      setTriggerType(automation.triggerType);
      setResponseMessage(automation.responseMessage || "");
      setApplyToAllPosts(automation.applyToAllPosts);
      setSelectedMediaIds(automation.selectedMedia?.map((m) => m.mediaId) || []);

      if (automation.triggerType === "DM" && automation.flowSteps) {
        const flow = automation.flowSteps as any;
        setGreeting(flow.greeting || "");
        setChoice1(flow.choices?.["1"] || "");
        setChoice2(flow.choices?.["2"] || "");
        setFallback(flow.fallback || "Please reply with 1 or 2");
      } else {
        setGreeting("");
        setChoice1("");
        setChoice2("");
        setFallback("Please reply with 1 or 2");
      }

      fetchMedia(automation.instagramId, false);
    } else {
      setName("");
      const initialIgId = accounts[0]?.instagramId || "";
      setInstagramId(initialIgId);
      setKeywords([]);
      setMatchType("CONTAINS");
      setTriggerType("COMMENT");
      setResponseMessage("");
      setApplyToAllPosts(true);
      setSelectedMediaIds([]);
      setGreeting("");
      setChoice1("");
      setChoice2("");
      setFallback("Please reply with 1 or 2");

      fetchMedia(initialIgId, false);
    }
  }, [automation, accounts, open]);

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setInstagramId(selectedId);
    setSelectedMediaIds([]);
    fetchMedia(selectedId, false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Auto-commit any text the user typed but didn't press Enter for
    const flushedKeywords = [...keywords];
    const trimmed = pendingKeyword.trim().toLowerCase();
    if (trimmed && !flushedKeywords.includes(trimmed)) {
      flushedKeywords.push(trimmed);
      setKeywords(flushedKeywords);
    }

    if (flushedKeywords.length === 0) {
      setSubmitError("Add at least one trigger keyword.");
      return;
    }

    if (triggerType === "COMMENT" && !responseMessage) {
      setSubmitError("Response message is required for comment triggers.");
      return;
    }

    if (triggerType === "DM" && (!greeting || !choice1 || !choice2)) {
      setSubmitError("Greeting, Option 1 Reply, and Option 2 Reply are all required for DM triggers.");
      return;
    }

    const payload: CreateAutomationPayload = {
      instagramId,
      name,
      keywords: flushedKeywords,
      matchType: triggerType === "DM" ? "CONTAINS" : matchType,
      responseMessage: triggerType === "COMMENT" ? responseMessage : "",
      triggerType,
      applyToAllPosts,
      selectedMediaIds: applyToAllPosts ? [] : selectedMediaIds,
    };

    if (triggerType === "DM") {
      payload.flowSteps = {
        triggers: flushedKeywords,
        greeting,
        choices: {
          "1": choice1,
          "2": choice2,
        },
        fallback: fallback || "Please reply with 1 or 2",
      };
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save automation.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Price Enquiry Response"
              required
              className="bg-input/50"
            />
          </div>

          {/* Account selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Instagram Account
            </label>
            <select
              value={instagramId}
              onChange={handleAccountChange}
              required
              className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 transition-all"
            >
              <option value="">Select an account…</option>
              {accounts.map((a) => (
                <option key={a.instagramId} value={a.instagramId}>
                  @{a.instagramUsername || a.instagramId}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Trigger Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {triggerTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTriggerType(t.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                    triggerType === t.value
                      ? "border-primary bg-primary/10 text-primary glow-sm"
                      : "border-input bg-input/30 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Keywords
            </label>
            <KeywordInput
              value={keywords}
              onChange={setKeywords}
              onInputChange={setPendingKeyword}
            />
            <p className="text-xs text-muted-foreground/70">
              Press Enter or comma to add — or just click Create, it&apos;ll add it automatically.
            </p>
          </div>

          {/* COMMENT fields */}
          {triggerType === "COMMENT" && (
            <>
              {/* Match type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Match Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {matchTypes.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMatchType(m.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                        matchType === m.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-input bg-input/30 text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trigger Scope */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Trigger Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyToAllPosts(true)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all",
                      applyToAllPosts
                        ? "border-primary bg-primary/10 text-primary glow-sm"
                        : "border-input bg-input/30 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    All Posts
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyToAllPosts(false)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all",
                      !applyToAllPosts
                        ? "border-primary bg-primary/10 text-primary glow-sm"
                        : "border-input bg-input/30 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    Selected Posts
                  </button>
                </div>
              </div>

              {/* Instagram Media list */}
              {!applyToAllPosts && (
                <div className="space-y-2 border-t border-border/40 pt-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Select Instagram Posts/Reels ({selectedMediaIds.length} selected)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchMedia(instagramId, true)}
                      disabled={loadingMedia}
                      className="h-8 px-2 text-xs rounded-lg text-primary hover:bg-primary/10"
                    >
                      <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", loadingMedia && "animate-spin")} />
                      Sync Feed
                    </Button>
                  </div>

                  {loadingMedia && mediaList.length === 0 ? (
                    <div className="grid grid-cols-3 gap-2 py-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  ) : mediaError ? (
                    <p className="text-xs text-destructive py-2">{mediaError}</p>
                  ) : mediaList.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-xl bg-input/20">
                      <p className="text-xs text-muted-foreground">No supported media (Reels, Images, Videos) found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 py-1">
                      {mediaList.map((media) => {
                        const isSelected = selectedMediaIds.includes(media.mediaId);
                        return (
                          <div
                            key={media.mediaId}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMediaIds(selectedMediaIds.filter((id) => id !== media.mediaId));
                              } else {
                                setSelectedMediaIds([...selectedMediaIds, media.mediaId]);
                              }
                            }}
                            className={cn(
                              "relative group aspect-square rounded-xl overflow-hidden border cursor-pointer select-none transition-all duration-200",
                              isSelected 
                                ? "border-primary ring-2 ring-primary/40 scale-[0.98]" 
                                : "border-border/60 hover:border-primary/40 bg-muted/40"
                            )}
                          >
                            {/* Thumbnail */}
                            {media.mediaUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={media.mediaUrl}
                                alt={media.caption || "Instagram Media"}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Image className="h-6 w-6 text-muted-foreground/40" />
                              </div>
                            )}

                            {/* Overlay info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 opacity-90 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                                {media.caption || "No caption"}
                              </span>
                            </div>

                            {/* Badge */}
                            <div className="absolute top-1.5 left-1.5">
                              <span className={cn(
                                "text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white shadow-sm",
                                media.mediaType === "REELS" ? "bg-pink-500" :
                                media.mediaType === "VIDEO" ? "bg-blue-500" : "bg-emerald-500"
                              )}>
                                {media.mediaType === "REELS" ? "Reel" : 
                                 media.mediaType === "VIDEO" ? "Video" : "Image"}
                              </span>
                            </div>

                            {/* Checkbox overlay */}
                            <div className={cn(
                              "absolute top-1.5 right-1.5 w-4 h-4 rounded border flex items-center justify-center transition-all",
                              isSelected
                                ? "bg-primary border-primary text-white scale-110"
                                : "bg-black/40 border-white/60 text-transparent"
                            )}>
                              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Response message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Response Message
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="The DM message to send when triggered…"
                  rows={3}
                  required
                  className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>
            </>
          )}

          {/* DM fields */}
          {triggerType === "DM" && (
            <>
              {/* Greeting message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Greeting Message
                </label>
                <textarea
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hey! 👋 How can I help you?&#10;1. Pricing&#10;2. Details"
                  rows={3}
                  required
                  className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>

              {/* Option 1 reply */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Option 1 Reply
                </label>
                <textarea
                  value={choice1}
                  onChange={(e) => setChoice1(e.target.value)}
                  placeholder="Our pricing: Basic $99/mo..."
                  rows={2}
                  required
                  className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>

              {/* Option 2 reply */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Option 2 Reply
                </label>
                <textarea
                  value={choice2}
                  onChange={(e) => setChoice2(e.target.value)}
                  placeholder="Details: We help automate..."
                  rows={2}
                  required
                  className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all"
                />
              </div>

              {/* Fallback message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Fallback Message (invalid input)
                </label>
                <Input
                  value={fallback}
                  onChange={(e) => setFallback(e.target.value)}
                  placeholder="Please reply with 1 or 2"
                  className="bg-input/50"
                />
              </div>
            </>
          )}

          {/* Error */}
          {submitError && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive animate-fade-in">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !name || !instagramId}
              className="rounded-xl ig-gradient-bg text-white border-0 hover:opacity-90 transition-opacity"
            >
              {saving
                ? "Saving…"
                : isEditing
                  ? "Update Automation"
                  : "Create Automation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
