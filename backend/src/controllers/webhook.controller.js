// src/controllers/webhook.controller.js
"use strict";

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

  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${new Date().toISOString()}][${reqId}] 🔥 INCOMING WEBHOOK`);
  console.log(JSON.stringify(req.body, null, 2));
  console.log("─".repeat(60));

  // Respond before doing any work
  res.status(200).send("EVENT_RECEIVED");

  // Process asynchronously — never block the HTTP response
  setImmediate(() => {
    processWebhook(req.body, reqId).catch((err) => {
      logger.error(reqId, `❌ Unhandled webhook processing error`, { error: err.message });
    });
  });
}

module.exports = { verify, receive };
