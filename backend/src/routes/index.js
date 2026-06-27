// src/routes/index.js
"use strict";

const express = require("express");
const router = express.Router();
const config = require("../config");

const webhookCtrl = require("../controllers/webhook.controller");
const authCtrl = require("../controllers/auth.controller");
const automationCtrl = require("../controllers/automation.controller");
const adminCtrl = require("../controllers/admin.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/auth/login", authCtrl.igTokenLogin);
router.get("/auth/callback", authCtrl.igTokenCallback);
// ── Webhook ────────────────────────────────────────────────────────────────
// Public — Meta must reach these without auth
router.get("/webhook", webhookCtrl.verify);
router.post("/webhook", webhookCtrl.receive);

// ── OAuth ──────────────────────────────────────────────────────────────────
// /auth/login?userId=abc123 — redirects to Meta, passes userId as state

router.get("/connected-accounts", requireAuth, authCtrl.listConnectedAccounts);
router.delete("/connected-accounts/:id", requireAuth, authCtrl.deleteConnectedAccount);
router.delete("/accounts/:id", requireAuth, authCtrl.deleteConnectedAccount);

// ── Automations (Dashboard CRUD) ───────────────────────────────────────────
router.get("/automations", requireAuth, automationCtrl.list);
router.post("/automations", requireAuth, automationCtrl.create);
router.put("/automations/:id", requireAuth, automationCtrl.update);
router.delete("/automations/:id", requireAuth, automationCtrl.remove);
router.get("/instagram/media", requireAuth, automationCtrl.getMedia);

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
const path = require('path');

router.get('/app', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

router.get("/privacy", (_req, res) => {
  res.redirect(301, `${config.meta.frontendUrl}/privacy`);
});

router.get("/terms", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Terms of Service</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 60px auto; padding: 0 20px; color: #333; line-height: 1.7; }
    h1 { font-size: 2rem; } h2 { margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>Terms of Service</h1>
  <p>Last updated: June 2026</p>

  <h2>1. Acceptance of Terms</h2>
  <p>By connecting your Instagram account to Tekly, you agree to these Terms of Service. If you do not agree, you must disconnect your account and cease using the service.</p>

  <h2>2. Use of Service</h2>
  <p>You agree to use Tekly only for lawful purposes and in compliance with all platform guidelines, including Instagram's developer policies.</p>

  <h2>3. Instagram Account Connection</h2>
  <p>You are solely responsible for maintaining the security of your connected Instagram accounts and associated authorization tokens.</p>

  <h2>4. Prohibited Conduct</h2>
  <p>You may not use Tekly to send spam, bulk unsolicited messages, or any content that violates Meta Platform Guidelines or local regulations.</p>

  <h2>5. Termination</h2>
  <p>We reserve the right to terminate or suspend access to our service immediately, without prior notice, if you breach the Terms.</p>

  <h2>6. Disclaimer of Warranties</h2>
  <p>The service is provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, express or implied.</p>

  <h2>7. Governing Law</h2>
  <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the provider resides, without regard to conflict of law provisions.</p>

  <h2>8. Contact Us</h2>
  <p>For any questions regarding these Terms, contact us at: <strong>srishanthreddyy05@gmail.com</strong></p>
</body>
</html>`);
});

module.exports = router;
