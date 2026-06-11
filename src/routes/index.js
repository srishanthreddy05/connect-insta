// src/routes/index.js
"use strict";

const express = require("express");
const router = express.Router();

const webhookCtrl = require("../controllers/webhook.controller");
const authCtrl = require("../controllers/auth.controller");
const automationCtrl = require("../controllers/automation.controller");
const adminCtrl = require("../controllers/admin.controller");
const { requireAuth } = require("../middleware/auth");

// ── Webhook ────────────────────────────────────────────────────────────────
// Public — Meta must reach these without auth
router.get("/webhook", webhookCtrl.verify);
router.post("/webhook", webhookCtrl.receive);

// ── OAuth ──────────────────────────────────────────────────────────────────
// /auth/login?userId=abc123 — redirects to Meta, passes userId as state
router.get("/auth/login", authCtrl.login);
// Meta redirects back here with code + state=userId
router.get("/auth/callback", authCtrl.callback);

// ── Connected Accounts ─────────────────────────────────────────────────────
router.get("/connected-accounts", requireAuth, authCtrl.listConnectedAccounts);

// ── Automations (Dashboard CRUD) ───────────────────────────────────────────
router.get("/automations", requireAuth, automationCtrl.list);
router.post("/automations", requireAuth, automationCtrl.create);
router.put("/automations/:id", requireAuth, automationCtrl.update);
router.delete("/automations/:id", requireAuth, automationCtrl.remove);

// ── Admin / Diagnostics ────────────────────────────────────────────────────
router.get("/admin/webhook-events", requireAuth, adminCtrl.listWebhookEvents);
router.post("/admin/test-dm", requireAuth, adminCtrl.testDm);
router.post("/admin/test-webhook", requireAuth, adminCtrl.testWebhook);
router.get("/admin/subscribe/:instagramId", requireAuth, adminCtrl.resubscribe);
router.get("/admin/check-subscription/:instagramId", requireAuth, adminCtrl.checkSubscription);

// ── Health check ───────────────────────────────────────────────────────────
router.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── Root ───────────────────────────────────────────────────────────────────
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "Instagram Automation Backend",
    version: "2.0.0",
    architecture: "multi-tenant SaaS",
    routes: {
      oauth: ["GET /auth/login?userId=:id", "GET /auth/callback"],
      accounts: ["GET /connected-accounts"],
      automations: [
        "GET /automations",
        "POST /automations",
        "PUT /automations/:id",
        "DELETE /automations/:id",
      ],
      webhook: ["GET /webhook (verification)", "POST /webhook (events)"],
      admin: [
        "GET /admin/webhook-events",
        "POST /admin/test-dm",
        "POST /admin/test-webhook",
        "GET /admin/subscribe/:instagramId",
        "GET /admin/check-subscription/:instagramId",
      ],
      health: ["GET /health"],
    },
  });
});

module.exports = router;
