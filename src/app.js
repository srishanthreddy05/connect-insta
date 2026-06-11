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
  console.log(`   Redirect : ${config.meta.redirectUri}`);
  console.log("═".repeat(55));
  console.log("🛠  Config check:");
  console.log(`   APP_ID               ${config.meta.appId ? "✅" : "❌ MISSING"}`);
  console.log(`   APP_SECRET           ${config.meta.appSecret ? "✅" : "❌ MISSING"}`);
  console.log(`   WEBHOOK_VERIFY_TOKEN ${config.meta.webhookVerifyToken ? "✅" : "❌ MISSING"}`);
  console.log(`   DATABASE_URL         ${process.env.DATABASE_URL ? "✅" : "❌ MISSING"}`);
  console.log(`   ENCRYPTION_KEY       ${process.env.ENCRYPTION_KEY ? "✅" : "❌ MISSING"}`);
  console.log("═".repeat(55));
  console.log("📋 Setup checklist:");
  console.log("   1. GET /auth/login?userId=<id>  — connect an IG account");
  console.log("   2. GET /automations              — view automations");
  console.log("   3. POST /automations             — create keyword triggers");
  console.log("   4. POST /admin/test-webhook      — simulate a comment");
  console.log("═".repeat(55) + "\n");
});

module.exports = app;