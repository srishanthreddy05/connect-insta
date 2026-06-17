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
import { auth } from "./firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://connect-insta.onrender.com"
    : "http://localhost:3000");

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Wait for the auth state to resolve if it's currently null (prevents race conditions)
  let user = auth.currentUser;
  if (!user) {
    user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        unsubscribe();
        resolve(firebaseUser);
      });
    });
  }

  if (user) {
    // getIdToken(true) forces a refresh if the token is close to expiry
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Ensure we don't have double slashes in the URL (except after http:// or https://)
  // Double-slash redirects by the server strip the Authorization header on cross-origin requests
  const rawUrl = `${API_BASE}${path}`;
  const url = rawUrl.replace(/([^:]\/)\/+/g, "$1");
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

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
