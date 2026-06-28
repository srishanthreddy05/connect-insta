// src/app.js
"use strict";

const express = require("express");
const cors = require("cors");
const config = require("./config");
const routes = require("./routes");
const { errorHandler, attachReqId } = require("./middleware/errorHandler");

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(attachReqId); // Attaches req.reqId for structured logging

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/", routes);

// ── Error handler (must be last) ───────────────────────────────────────────
app.use(errorHandler);

// ── Server startup ─────────────────────────────────────────────────────────
app.listen(config.app.port, () => {
  console.log("\n" + "═".repeat(55));
  console.log(`🚀 Instagram Automation Backend v2.0`);
  console.log(`   Port     : ${config.app.port}`);
  console.log(`   Mode     : ${config.app.nodeEnv}`);
console.log(`   Redirect : ${config.meta.igRedirectUri}`);
console.log("═".repeat(55));
console.log("🛠  Config check:");
console.log(`   IG_APP_ID            ${config.meta.igAppId ? "✅" : "❌ MISSING"}`);
console.log(`   IG_APP_SECRET        ${config.meta.igAppSecret ? "✅" : "❌ MISSING"}`);
console.log(`   WEBHOOK_VERIFY_TOKEN ${config.meta.webhookVerifyToken ? "✅" : "❌ MISSING"}`);
  console.log(`   DATABASE_URL         ${process.env.DATABASE_URL ? "✅" : "❌ MISSING"}`);
  console.log(`   ENCRYPTION_KEY       ${process.env.ENCRYPTION_KEY ? "✅" : "❌ MISSING"}`);
  console.log(`   FIREBASE_PROJECT_ID  ${process.env.FIREBASE_PROJECT_ID ? "✅" : "❌ MISSING"}`);
  console.log(`   FIREBASE_CLIENT_EMAIL ${process.env.FIREBASE_CLIENT_EMAIL ? "✅" : "❌ MISSING"}`);
  console.log(`   FIREBASE_PRIVATE_KEY ${process.env.FIREBASE_PRIVATE_KEY ? "✅" : "❌ MISSING"}`);
  console.log("═".repeat(55));
  console.log("📋 Setup checklist:");
  console.log("   1. GET /auth/login?userId=<id>  — connect an IG account");
  console.log("   2. GET /automations              — view automations");
  console.log("   3. POST /automations             — create keyword triggers");
  console.log("   4. POST /admin/test-webhook      — simulate a comment");
  console.log("═".repeat(55) + "\n");

  // Webhook subscription health check on startup
  const metaService = require("./services/meta.service");
  async function verifyWebhookSubscriptions() {
    try {
      const subscriptions = await metaService.getAppWebhookSubscriptions();
      const requiredFields = ["comments", "messages"];
      console.log("🔍 Checking Meta App Webhook Subscriptions...");
      for (const field of requiredFields) {
        const hasField = subscriptions.some(s => 
          (s.object === "instagram" || s.object === "page") && 
          s.fields?.some(f => (f?.name || f) === field)
        );
        if (!hasField) {
          console.error(`[health] ⚠️ Missing webhook subscription field: ${field}`);
        } else {
          console.log(`[health] ✅ Webhook subscription field verified: ${field}`);
        }
      }
    } catch (err) {
      console.error("[health] ❌ Webhook subscription verification failed:", err.message);
    }
  }
  verifyWebhookSubscriptions();
});

module.exports = app;