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
import { RefreshCw, Image, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
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

function PhonePreview({ 
  username, 
  triggerType, 
  commentReplyMessage, 
  responseMessage, 
  openingMessage, 
  messages, 
  keywords 
}: { 
  username: string;
  triggerType: "COMMENT" | "DM";
  commentReplyMessage: string;
  responseMessage: string;
  openingMessage: string;
  messages: string[];
  keywords: string[];
}) {
  const triggerKeyword = keywords[0] || "keyword";

  return (
    <div className="w-full max-w-[300px] bg-zinc-950 border border-zinc-800 rounded-[38px] shadow-2xl p-2.5 aspect-[9/18] flex flex-col relative overflow-hidden select-none animate-fade-in">
      {/* Speaker/Camera notch */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-2xl z-20 flex items-center justify-center">
        <div className="w-10 h-1 bg-zinc-800 rounded-full mr-2" />
        <div className="w-2 h-2 bg-zinc-900 rounded-full border border-zinc-800" />
      </div>

      {/* Screen area */}
      <div className="w-full h-full bg-black rounded-[30px] overflow-hidden border border-zinc-900 flex flex-col pt-5 relative text-white">
        
        {/* Chat / View Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 text-[9px] font-bold text-white uppercase">
              {username.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] font-semibold truncate max-w-[100px] text-zinc-100 leading-tight">
                @{username}
              </p>
              <p className="text-[7px] text-zinc-500">Instagram Automation</p>
            </div>
          </div>
          <span className="text-[8px] font-mono text-zinc-500">LTE</span>
        </div>

        {/* Dynamic preview content */}
        {triggerType === "COMMENT" ? (
          /* Comment reply thread mockup */
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-zinc-950 flex flex-col text-[11px] leading-normal">
            <div className="text-[8px] text-zinc-600 text-center font-medium my-0.5 uppercase tracking-wider">
              Post Comments
            </div>

            {/* Original Post info mockup */}
            <div className="flex gap-2 items-start text-left">
              <div className="h-5 w-5 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center font-bold text-[8px] text-zinc-400">
                F
              </div>
              <div className="flex-1">
                <span className="font-semibold text-zinc-350 block text-[10px]">follower_user</span>
                <span className="text-zinc-300 block mt-0.5">
                  How much is this? Can you send me the details? <span className="text-pink-400 font-semibold">{triggerKeyword}</span>
                </span>
                <span className="text-[8px] text-zinc-500 block mt-0.5">2h</span>
              </div>
            </div>

            {/* Nested Reply */}
            <div className="flex gap-2 items-start pl-6 border-l border-zinc-900 ml-2 text-left">
              <div className="h-4.5 w-4.5 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 shrink-0 flex items-center justify-center font-bold text-[8px] text-white">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-zinc-350 block text-[10px]">@{username}</span>
                <span className="text-zinc-300 block mt-0.5 bg-zinc-900 border border-zinc-800/40 rounded-xl p-2 animate-fade-in font-medium">
                  {commentReplyMessage || "Your reply will appear here..."}
                </span>
                <span className="text-[8px] text-zinc-500 block mt-0.5">1m</span>
              </div>
            </div>
          </div>
        ) : (
          /* DM chat bubble mockup */
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-950 flex flex-col text-left">
            <div className="text-[8px] text-zinc-600 text-center font-medium my-0.5 uppercase tracking-wider">
              Instagram DM Thread
            </div>

            {/* Sender incoming keyword trigger */}
            <div className="flex gap-2 items-end max-w-[85%] self-start animate-fade-in">
              <div className="h-5 w-5 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                F
              </div>
              <div>
                <div className="bg-zinc-900 text-zinc-100 rounded-2xl rounded-bl-none px-3 py-1.5 text-[11px] leading-snug border border-zinc-850">
                  Hey! I want info about the <span className="text-pink-400 font-semibold">{triggerKeyword}</span> please!
                </div>
              </div>
            </div>

            {/* My outgoing opening message */}
            <div className="flex flex-col max-w-[85%] self-end items-end animate-fade-in mt-1">
              <div className="bg-blue-600 text-white rounded-2xl rounded-br-none px-3 py-1.5 text-[11px] leading-snug shadow-md">
                {openingMessage || "Opening message..."}
              </div>
            </div>

            {/* Outgoing sequential message bubbles */}
            {messages.filter(Boolean).map((msg, index) => (
              <div 
                key={index} 
                className="flex flex-col max-w-[85%] self-end items-end animate-fade-in mt-0.5"
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              >
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-none px-3 py-1.5 text-[11px] leading-snug shadow-md">
                  {msg}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Bar mockup */}
        <div className="px-3 py-2 border-t border-zinc-900 bg-zinc-950 shrink-0 flex items-center gap-2">
          <div className="flex-1 h-6.5 rounded-full bg-zinc-900 border border-zinc-850 px-3.5 flex items-center text-[9px] text-zinc-500">
            Message...
          </div>
          <div className="h-5.5 w-5.5 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
            <svg className="w-3 h-3 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}

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
  const [openingMessage, setOpeningMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [enableCommentReply, setEnableCommentReply] = useState(false);
  const [commentReplyMessage, setCommentReplyMessage] = useState("");
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

  const handleAddMessage = () => {
    setMessages([...messages, ""]);
  };

  const handleRemoveMessage = (index: number) => {
    const next = [...messages];
    next.splice(index, 1);
    setMessages(next);
  };

  const handleUpdateMessage = (index: number, text: string) => {
    const next = [...messages];
    next[index] = text;
    setMessages(next);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...messages];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setMessages(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === messages.length - 1) return;
    const next = [...messages];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setMessages(next);
  };

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
      setEnableCommentReply(automation.enableCommentReply || false);
      setCommentReplyMessage(automation.commentReplyMessage || "");

      if (automation.triggerType === "DM") {
        setOpeningMessage(automation.openingMessage || "");
        setMessages(automation.messages?.map((m) => m.message) || [""]);
      } else {
        setOpeningMessage("");
        setMessages([""]);
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
      setEnableCommentReply(false);
      setCommentReplyMessage("");
      setOpeningMessage("");
      setMessages([""]);

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

    if (triggerType === "COMMENT" && enableCommentReply && !commentReplyMessage.trim()) {
      setSubmitError("Comment reply message is required when 'Reply to Comment' is enabled.");
      return;
    }

    if (triggerType === "DM" && !openingMessage.trim()) {
      setSubmitError("Opening message is required for DM triggers.");
      return;
    }

    const validMessages = messages.map(msg => msg.trim()).filter(Boolean);

    const payload: CreateAutomationPayload = {
      instagramId,
      name,
      keywords: flushedKeywords,
      matchType: triggerType === "DM" ? "CONTAINS" : matchType,
      responseMessage: triggerType === "COMMENT" ? responseMessage : "",
      triggerType,
      applyToAllPosts,
      selectedMediaIds: applyToAllPosts ? [] : selectedMediaIds,
      enableCommentReply: triggerType === "COMMENT" ? enableCommentReply : false,
      commentReplyMessage: (triggerType === "COMMENT" && enableCommentReply) ? commentReplyMessage : null,
      openingMessage: triggerType === "DM" ? openingMessage : null,
      messages: triggerType === "DM" ? validMessages : [],
    };

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
      <DialogContent className="glass border-border lg:max-w-5xl md:max-w-3xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? "Edit Automation" : "Create Automation"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Inputs (Left) */}
            <div className="lg:col-span-7 space-y-5">
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
                        "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
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
                          <p className="text-xs text-muted-foreground">No supported media found.</p>
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
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] text-white font-medium line-clamp-2 leading-tight">
                                    {media.caption || "No caption"}
                                  </span>
                                </div>
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
                      className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all text-white"
                    />
                  </div>

                  {/* Reply to comment checkbox */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="enableCommentReply"
                      checked={enableCommentReply}
                      onChange={(e) => setEnableCommentReply(e.target.checked)}
                      className="h-4 w-4 rounded border-input bg-input/50 text-primary focus:ring-ring/30 accent-pink-500"
                    />
                    <label
                      htmlFor="enableCommentReply"
                      className="text-sm font-medium text-muted-foreground cursor-pointer select-none"
                    >
                      Reply to Comment
                    </label>
                  </div>

                  {/* Comment reply message (hidden when disabled) */}
                  {enableCommentReply && (
                    <div className="space-y-2 border-l-2 border-primary/30 pl-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground">
                          Comment Reply Message
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          {commentReplyMessage.length} characters
                        </span>
                      </div>
                      <textarea
                        value={commentReplyMessage}
                        onChange={(e) => setCommentReplyMessage(e.target.value)}
                        placeholder="Thanks! Check your DM 👇"
                        rows={2}
                        required={enableCommentReply}
                        className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all text-white"
                      />
                    </div>
                  )}
                </>
              )}

              {/* DM fields */}
              {triggerType === "DM" && (
                <div className="space-y-5 animate-fade-in">
                  {/* Opening message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Opening Message
                    </label>
                    <textarea
                      value={openingMessage}
                      onChange={(e) => setOpeningMessage(e.target.value)}
                      placeholder="Hey! 👋 Thanks for reaching out. Here is the info..."
                      rows={3}
                      required
                      className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all text-white"
                    />
                    <p className="text-[10px] text-muted-foreground/70">
                      This message is sent immediately when a DM matches your keywords.
                    </p>
                  </div>

                  {/* Sequential follow-up messages */}
                  <div className="space-y-3 pt-2 border-t border-border/40">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">
                        Sequential Messages ({messages.length})
                      </label>
                    </div>

                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className="glass rounded-xl border border-border/50 p-3.5 space-y-2.5 relative transition-all duration-200 hover:border-primary/20 bg-input/10 animate-fade-in"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-muted-foreground/90">
                              Message {index + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Move up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveDown(index)}
                                disabled={index === messages.length - 1}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Move down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMessage(index)}
                                className="p-1 rounded text-destructive hover:bg-destructive/10 transition-all ml-1"
                                title="Delete message"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <textarea
                            value={msg}
                            onChange={(e) => handleUpdateMessage(index, e.target.value)}
                            placeholder={`Message ${index + 1} content...`}
                            rows={2}
                            className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-xs outline-none resize-none focus:ring-2 focus:ring-ring/20 transition-all text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddMessage}
                      variant="outline"
                      className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-dashed border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2.5 text-xs font-semibold transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Follow-Up Message
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview (Right) */}
            <div className="lg:col-span-5 lg:sticky lg:top-0 h-fit flex flex-col items-center select-none pt-4 lg:pt-0">
              <h3 className="text-xs font-semibold text-muted-foreground/80 mb-3.5 self-start">
                Live Response Preview
              </h3>
              <PhonePreview
                username={accounts.find((a) => a.instagramId === instagramId)?.instagramUsername || "your_username"}
                triggerType={triggerType}
                commentReplyMessage={commentReplyMessage}
                responseMessage={responseMessage}
                openingMessage={openingMessage}
                messages={messages}
                keywords={keywords}
              />
            </div>

          </div>

          {/* Error */}
          {submitError && (
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive animate-fade-in">
              {submitError}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
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
