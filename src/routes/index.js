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

router.get("/privacy", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Privacy Policy</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 60px auto; padding: 0 20px; color: #333; line-height: 1.7; }
    h1 { font-size: 2rem; } h2 { margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: June 2026</p>

  <h2>1. What We Collect</h2>
  <p>We collect your Instagram Business account information (username, account ID) and Facebook Page details when you connect your account via OAuth.</p>

  <h2>2. How We Use It</h2>
  <p>We use your account data solely to operate automations you configure — such as sending automated DMs in response to comments on your posts.</p>

  <h2>3. Data Storage</h2>
  <p>Access tokens are encrypted at rest. We do not sell or share your data with third parties.</p>

  <h2>4. Meta Platform Data</h2>
  <p>We access Instagram and Facebook data through the official Meta Graph API. We comply with <a href="https://developers.facebook.com/policy/">Meta's Platform Policy</a>.</p>

  <h2>5. Data Deletion</h2>
  <p>You can disconnect your Instagram account at any time, which deletes all associated tokens and data from our system.</p>

  <h2>6. Contact</h2>
  <p>For any privacy questions, email us at: <strong>srishanthreddyy05@gmail.com</strong></p>
</body>
</html>`);
});

module.exports = router;
