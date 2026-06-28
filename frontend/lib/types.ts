// lib/types.ts — TypeScript interfaces matching backend models

export interface ConnectedAccount {
  id: string;
  userId: string;
  instagramId: string;
  instagramUsername: string | null;
  connectedAt: string;
  isActive: boolean;
  missingPermissions?: string[];
}

export type MatchType = "CONTAINS" | "EXACT" | "STARTS_WITH";
export type TriggerType = "COMMENT" | "DM";

export interface InstagramMedia {
  id: string;
  mediaId: string;
  instagramId: string;
  caption: string | null;
  mediaType: "REELS" | "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  timestamp: string;
}

export interface AutomationMessage {
  id: string;
  automationId: string;
  message: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Automation {
  id: string;
  userId: string;
  instagramId: string;
  name: string;
  keywords: string[];
  matchType: MatchType;
  responseMessage: string;
  triggerType: TriggerType;
  flowSteps: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  applyToAllPosts: boolean;
  selectedMedia?: InstagramMedia[];
  enableCommentReply: boolean;
  commentReplyMessage: string | null;
  triggerCount: number;
  commentsRepliedCount: number;
  dmsSentCount: number;
  openingMessage: string | null;
  messages: AutomationMessage[];
  lastError?: string | null;
}

export interface CreateAutomationPayload {
  instagramId: string;
  name: string;
  keywords: string[];
  matchType: MatchType;
  responseMessage: string;
  triggerType?: TriggerType;
  flowSteps?: Record<string, unknown> | null;
  applyToAllPosts?: boolean;
  selectedMediaIds?: string[];
  enableCommentReply?: boolean;
  commentReplyMessage?: string | null;
  openingMessage?: string | null;
  messages?: (string | { message: string; order?: number })[];
}

export interface UpdateAutomationPayload {
  name?: string;
  keywords?: string[];
  matchType?: MatchType;
  responseMessage?: string;
  isActive?: boolean;
  triggerType?: TriggerType;
  flowSteps?: Record<string, unknown> | null;
  applyToAllPosts?: boolean;
  selectedMediaIds?: string[];
  enableCommentReply?: boolean;
  commentReplyMessage?: string | null;
  openingMessage?: string | null;
  messages?: (string | { message: string; order?: number })[];
}

export interface WebhookEvent {
  id: string;
  instagramId: string;
  eventType: string;
  eventId: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TestWebhookPayload {
  instagramId: string;
  commentText?: string;
  commenterId?: string;
}

export interface TestDmPayload {
  instagramId: string;
  recipientId: string;
  message: string;
}

export interface SubscriptionStatus {
  data: Array<{
    subscribed_fields: string[];
  }>;
}
