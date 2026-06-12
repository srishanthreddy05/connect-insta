// src/controllers/admin.controller.js
"use strict";

const metaService = require("../services/meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const webhookEventRepo = require("../repositories/webhookEvent.repository");
const { processWebhook } = require("../services/webhook.service");
const { logger } = require("../utils/logger");

/**
 * GET /admin/webhook-events
 * Lists recent webhook events for debugging.
 */
async function listWebhookEvents(req, res, next) {
  try {
    const events = await webhookEventRepo.findAll(100);
    res.json({ ok: true, data: events });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/test-dm
 * Manually sends a DM for testing (uses the connected account's page token).
 *
 * Body: { instagramId, recipientId, message }
 */
async function testDm(req, res, next) {
  const reqId = req.reqId;
  try {
    const { instagramId, recipientId, message } = req.body;
    if (!instagramId || !recipientId || !message) {
      return res.status(400).json({ ok: false, error: "instagramId, recipientId, and message are required" });
    }

    const account = await connectedAccountRepo.findByInstagramId(instagramId);
    if (!account) {
      return res.status(404).json({ ok: false, error: "No connected account found for this Instagram ID" });
    }

    const result = await metaService.sendDM({
      instagramId,
      accessToken: account.accessToken,
      recipientIgUserId: recipientId,
      messageText: message,
      reqId,
    });

    logger.info(reqId, `✅ Test DM sent`, { to: recipientId, instagramId });
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/test-webhook
 * Simulates a comment webhook event for testing.
 *
 * Body: { instagramId, commentText, commenterId }
 */
async function testWebhook(req, res, next) {
  const reqId = req.reqId;
  try {
    const {
      instagramId,
      commentText = "price",
      commenterId = "TEST_USER_123",
    } = req.body;

    if (!instagramId) {
      return res.status(400).json({ ok: false, error: "instagramId is required" });
    }

    const fakePayload = {
      object: "instagram",
      entry: [
        {
          id: instagramId,
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              field: "comments",
              value: {
                from: { id: commenterId, username: "test_user" },
                media: { id: "MEDIA_TEST_123", media_product_type: "POST" },
                id: `TEST_COMMENT_${Date.now()}`,
                text: commentText,
              },
            },
          ],
        },
      ],
    };

    logger.info(reqId, `🧪 Injecting test webhook payload`, { instagramId, commentText });

    res.json({ ok: true, message: "Test payload injected — check server logs", payload: fakePayload });

    setImmediate(() => {
      processWebhook(fakePayload, reqId).catch((err) => {
        logger.error(reqId, `❌ Test webhook processing error`, { error: err.message });
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/subscribe/:instagramId
 * Re-subscribes a specific IG account to webhook events.
 */
async function resubscribe(req, res, next) {
  const reqId = req.reqId;
  try {
    const { instagramId } = req.params;
    const account = await connectedAccountRepo.findByInstagramId(instagramId);

    if (!account) {
      return res.status(404).json({ ok: false, error: "Connected account not found" });
    }

    // TO:
    const result = await metaService.subscribeAppToIG(instagramId, account.accessToken, reqId);

    res.json({ ok: true, message: "Webhook subscription renewed", data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/check-subscription/:instagramId
 * Checks webhook subscription status for a specific IG account.
 */
async function checkSubscription(req, res, next) {
  try {
    const { instagramId } = req.params;
    const account = await connectedAccountRepo.findByInstagramId(instagramId);

    if (!account) {
      return res.status(404).json({ ok: false, error: "Connected account not found" });
    }

    const data = await metaService.checkSubscription(instagramId, account.accessToken);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { listWebhookEvents, testDm, testWebhook, resubscribe, checkSubscription };
