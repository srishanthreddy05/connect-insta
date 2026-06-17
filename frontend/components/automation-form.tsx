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
import type {
  Automation,
  ConnectedAccount,
  CreateAutomationPayload,
  MatchType,
  TriggerType,
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
  const [matchType, setMatchType] = useState<MatchType>("CONTAINS");
  const [triggerType, setTriggerType] = useState<TriggerType>("COMMENT");
  const [responseMessage, setResponseMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(automation);

  useEffect(() => {
    if (automation) {
      setName(automation.name);
      setInstagramId(automation.instagramId);
      setKeywords(automation.keywords);
      setMatchType(automation.matchType);
      setTriggerType(automation.triggerType);
      setResponseMessage(automation.responseMessage);
    } else {
      setName("");
      setInstagramId(accounts[0]?.instagramId || "");
      setKeywords([]);
      setMatchType("CONTAINS");
      setTriggerType("COMMENT");
      setResponseMessage("");
    }
  }, [automation, accounts, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        instagramId,
        name,
        keywords,
        matchType,
        responseMessage,
        triggerType,
      });
      onOpenChange(false);
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
              onChange={(e) => setInstagramId(e.target.value)}
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
            <KeywordInput value={keywords} onChange={setKeywords} />
            <p className="text-xs text-muted-foreground/70">
              Press Enter or comma to add. Multiple keywords use OR logic.
            </p>
          </div>

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
              required={triggerType === "COMMENT"}
              className="w-full rounded-xl border border-input bg-input/50 px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ring/30 transition-all"
            />
          </div>

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
