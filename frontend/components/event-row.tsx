"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WebhookEvent } from "@/lib/types";

interface EventRowProps {
  event: WebhookEvent;
  index: number;
}

const eventTypeColors: Record<string, string> = {
  comment: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  message: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  mention: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  unknown: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export function EventRow({ event, index }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);

  const colorClass =
    eventTypeColors[event.eventType] || eventTypeColors.unknown;

  const formattedDate = new Date(event.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={cn(
        "glass rounded-xl transition-all duration-200 animate-fade-in-up hover:glow-sm",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        {/* Status icon */}
        <div className="shrink-0">
          {event.processed && !event.error ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : event.error ? (
            <XCircle className="h-5 w-5 text-red-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-400" />
          )}
        </div>

        {/* Event type badge */}
        <Badge
          variant="outline"
          className={cn("shrink-0 rounded-lg text-xs font-medium", colorClass)}
        >
          {event.eventType}
        </Badge>

        {/* Event ID */}
        <span className="flex-1 truncate text-sm font-mono text-muted-foreground">
          {event.eventId.length > 32
            ? event.eventId.slice(0, 32) + "…"
            : event.eventId}
        </span>

        {/* IG Account */}
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
          {event.instagramId}
        </span>

        {/* Timestamp */}
        <span className="shrink-0 text-xs text-muted-foreground">
          {formattedDate}
        </span>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded payload */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 animate-fade-in">
          {event.error && (
            <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <strong>Error:</strong> {event.error}
            </div>
          )}
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Raw Payload
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-background/80 p-4 text-xs font-mono text-muted-foreground">
            {JSON.stringify(event.payload, null, 2)}
          </pre>
          {event.processedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Processed at:{" "}
              {new Date(event.processedAt).toLocaleString("en-US")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
