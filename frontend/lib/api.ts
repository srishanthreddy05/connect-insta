// lib/api.ts — Centralized API client for backend communication

import type {
  ApiResponse,
  Automation,
  ConnectedAccount,
  CreateAutomationPayload,
  UpdateAutomationPayload,
  WebhookEvent,
  TestWebhookPayload,
  TestDmPayload,
  SubscriptionStatus,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const apiKey = localStorage.getItem("ig_api_key") || "";
  const userId = localStorage.getItem("ig_user_id") || "";
  return {
    "Content-Type": "application/json",
    "X-Api-Key": apiKey,
    "X-User-Id": userId,
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string> || {}) };

  const res = await fetch(url, { ...options, headers });
  const json = await res.json();

  if (!res.ok || !json.ok) {
    throw new Error(json.error || json.message || `Request failed: ${res.status}`);
  }

  return json;
}

// ── Connected Accounts ────────────────────────────────────────────────────────

export async function getAccounts(): Promise<ConnectedAccount[]> {
  const res = await request<ConnectedAccount[]>("/connected-accounts");
  return res.data || [];
}

export function getOAuthUrl(userId: string): string {
  return `${API_BASE}/auth/login?userId=${encodeURIComponent(userId)}`;
}

// ── Automations ───────────────────────────────────────────────────────────────

export async function getAutomations(): Promise<Automation[]> {
  const res = await request<Automation[]>("/automations");
  return res.data || [];
}

export async function createAutomation(
  payload: CreateAutomationPayload
): Promise<Automation> {
  const res = await request<Automation>("/automations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function updateAutomation(
  id: string,
  payload: UpdateAutomationPayload
): Promise<Automation> {
  const res = await request<Automation>(`/automations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data!;
}

export async function deleteAutomation(id: string): Promise<void> {
  await request(`/automations/${id}`, { method: "DELETE" });
}

// ── Admin / Diagnostics ───────────────────────────────────────────────────────

export async function getWebhookEvents(): Promise<WebhookEvent[]> {
  const res = await request<WebhookEvent[]>("/admin/webhook-events");
  return res.data || [];
}

export async function testWebhook(
  payload: TestWebhookPayload
): Promise<ApiResponse<unknown>> {
  return request("/admin/test-webhook", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function testDm(
  payload: TestDmPayload
): Promise<ApiResponse<unknown>> {
  return request("/admin/test-dm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resubscribe(
  instagramId: string
): Promise<ApiResponse<unknown>> {
  return request(`/admin/subscribe/${instagramId}`);
}

export async function checkSubscription(
  instagramId: string
): Promise<SubscriptionStatus> {
  const res = await request<SubscriptionStatus>(
    `/admin/check-subscription/${instagramId}`
  );
  return res.data!;
}

// ── Health ─────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<{ ok: boolean; ts: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}
