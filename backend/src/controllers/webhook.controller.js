// src/controllers/webhook.controller.js
"use strict";
const crypto = require("crypto");
const config = require("../config");
const { processWebhook } = require("../services/webhook.service");
const { logger, normalizeToken, maskToken } = require("../utils/logger");

/**
 * GET /webhook
 * Meta's one-time hub verification challenge.
 */
function verify(req, res) {
  const reqId = req.reqId;
  const mode = req.query["hub.mode"];
  const token = normalizeToken(req.query["hub.verify_token"]);
  const challenge = req.query["hub.challenge"];

  logger.info(reqId, `🔔 Webhook verification request`, { mode, token: maskToken(token) });

  if (mode !== "subscribe" || !challenge) {
    logger.warn(reqId, `❌ Invalid verification request — bad mode or missing challenge`);
    return res.sendStatus(400);
  }

  if (token !== config.meta.webhookVerifyToken) {
    logger.warn(reqId, `❌ Verify token mismatch`, {
      received: maskToken(token),
      expected: maskToken(config.meta.webhookVerifyToken),
    });
    return res.sendStatus(403);
  }

  logger.info(reqId, `✅ WEBHOOK VERIFIED`);
  return res.status(200).send(challenge);
}

/**
 * POST /webhook
 * Receives live Instagram events.
 *
 * Controller responsibilities:
 *   1. Immediately return HTTP 200 (Meta requires < 5s or it retries)
 *   2. Fire async processing via setImmediate
 *
 * All business logic lives in webhook.service.js
 */
function receive(req, res) {
  const reqId = req.reqId;

  // ── Signature verification ─────────────────────────────────────────────
  const signature = req.headers["x-hub-signature-256"];
  if (!signature) {
    logger.warn(reqId, `❌ Missing X-Hub-Signature-256 header`);
    return res.sendStatus(401);
  }
  const rawBody = req.body; // Raw Buffer from express.raw()
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
  logger.warn(reqId, `❌ Missing or invalid webhook body`);
  return res.sendStatus(400);
}
  const expected = "sha256=" + crypto
    .createHmac("sha256", config.meta.igAppSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expected) {
    logger.warn(reqId, `❌ Webhook signature mismatch — possible spoofed request`);
    return res.sendStatus(403);
  }

  const parsedBody = JSON.parse(rawBody);

  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${new Date().toISOString()}][${reqId}] 🔥 INCOMING WEBHOOK`);
  console.log(JSON.stringify(parsedBody, null, 2));
  console.log("─".repeat(60));

  res.status(200).send("EVENT_RECEIVED");

  setImmediate(() => {
    processWebhook(parsedBody, reqId).catch((err) => {
      logger.error(reqId, `❌ Unhandled webhook processing error`, { error: err.message });
    });
  });
}

module.exports = { verify, receive };
