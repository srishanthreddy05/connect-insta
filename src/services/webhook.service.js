// src/services/webhook.service.js
"use strict";

const webhookEventRepo = require("../repositories/webhookEvent.repository");
const sentDmRepo = require("../repositories/sentDm.repository");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { findMatchingAutomation } = require("./automation.service");
const metaService = require("./meta.service");
const { logger } = require("../utils/logger");

/**
 * Parses the raw Meta webhook body into a normalized list of comment events.
 * Handles both real payloads and test injection payloads.
 *
 * Returns an array of:
 * {
 *   instagramId: string,  // which IG account this event is for
 *   eventId:     string,  // stable ID for deduplication
 *   eventType:   string,  // "comment" | "message" | "mention" | "unknown"
 *   commentText: string,
 *   commenterId: string|null,
 *   mediaId:     string|null,
 *   rawValue:    object,
 * }
 */
function parseWebhookBody(body) {
  const events = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  for (const entry of entries) {
    const igAccountId = entry.id; // This is the IG Business Account ID
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value || {};
      const field = change?.field || "unknown";

      const eventId =
        value.id ||
        value.comment_id ||
        value.message_id ||
        `${igAccountId}:${field}:${value.created_time || Date.now()}`;

      // Classify event type
      const isComment =
        field === "comments" ||
        value.item === "comment" ||
        Boolean(value.comment_id) ||
        (typeof value.text === "string" && field !== "messages");

      const isMessage = field === "messages" || Boolean(value.message_id);
      const isMention = field === "mentions";

      let eventType = "unknown";
      if (isComment) eventType = "comment";
      else if (isMessage) eventType = "message";
      else if (isMention) eventType = "mention";

      const commentText = String(value.text || value.message || value.comment_text || "").trim();
      const commenterId = value.from?.id || value.commenter_id || value.user_id || null;
      const mediaId = value.media?.id || value.media_id || value.post_id || entry.id || null;

      events.push({
        instagramId: igAccountId,
        eventId,
        eventType,
        commentText,
        commenterId,
        mediaId,
        rawValue: value,
      });
    }
  }

  return events;
}

/**
 * Main webhook processor.
 *
 * Pipeline:
 *   1. Parse raw body into normalized events
 *   2. For each event:
 *      a. Deduplicate via DB (durable, survives restarts)
 *      b. Look up the ConnectedAccount for this IG account ID
 *      c. Find a matching automation
 *      d. Guard against duplicate DMs
 *      e. Send DM using ONLY the Page Access Token for this account
 *      f. Mark event as processed
 *
 * This function is called asynchronously — the HTTP 200 has already been sent.
 *
 * @param {object} body   - Raw webhook request body
 * @param {string} reqId  - Request ID for tracing
 */
async function processWebhook(body, reqId) {
  const events = parseWebhookBody(body);

  if (events.length === 0) {
    logger.info(reqId, `ℹ️ Webhook body contained no parseable events`);
    return;
  }

  for (const event of events) {
    const { instagramId, eventId, eventType, commentText, commenterId } = event;

    // ── Step 1: Deduplication (DB-level, durable) ──────────────────────────
    const { created, event: dbEvent } = await webhookEventRepo.createIfNew({
      instagramId,
      eventType,
      eventId,
      payload: event.rawValue,
    });

    if (!created) {
      logger.info(reqId, `⏭️ Duplicate event skipped`, { eventId, instagramId });
      continue;
    }

    logger.info(reqId, `📥 Processing event`, { eventId, eventType, instagramId, commentText });

    try {
      // ── Step 2: Only process comment events ────────────────────────────
      if (eventType !== "comment") {
        logger.info(reqId, `ℹ️ Non-comment event — skipping automation`, { eventType, eventId });
        await webhookEventRepo.markProcessed(dbEvent.id);
        continue;
      }

      if (!commentText) {
        logger.info(reqId, `ℹ️ Empty comment text — skipping`, { eventId });
        await webhookEventRepo.markProcessed(dbEvent.id);
        continue;
      }

      if (!commenterId) {
        logger.warn(reqId, `⚠️ Missing commenterId — cannot send DM`, { eventId });
        await webhookEventRepo.markProcessed(dbEvent.id, "Missing commenterId");
        continue;
      }

      // ── Step 3: Look up connected account (no hardcoded IDs) ───────────
      const connectedAccount = await connectedAccountRepo.findByInstagramId(instagramId);
      if (!connectedAccount) {
        logger.warn(reqId, `⚠️ No connected account found for IG ID ${instagramId}`, { eventId });
        await webhookEventRepo.markProcessed(dbEvent.id, `No connected account for ${instagramId}`);
        continue;
      }

      if (!connectedAccount.isActive) {
        logger.info(reqId, `ℹ️ Connected account is inactive — skipping`, { instagramId });
        await webhookEventRepo.markProcessed(dbEvent.id, "Account inactive");
        continue;
      }

      // ── Step 4: Find matching automation ───────────────────────────────
      const automation = await findMatchingAutomation(instagramId, commentText);
      if (!automation) {
        logger.info(reqId, `ℹ️ No matching automation for comment`, {
          instagramId,
          commentText: commentText.slice(0, 60),
        });
        await webhookEventRepo.markProcessed(dbEvent.id);
        continue;
      }

      logger.info(reqId, `🎯 Automation matched`, {
        automationId: automation.id,
        name: automation.name,
        keywords: automation.keywords,
      });

      // ── Step 5: Duplicate DM guard ─────────────────────────────────────
      const { created: dmIsNew } = await sentDmRepo.recordIfNew({
        instagramId,
        recipientId: commenterId,
        automationId: automation.id,
        messageText: automation.responseMessage,
        metaMessageId: null, // will be updated after send
      });

      if (!dmIsNew) {
        logger.info(reqId, `⏭️ DM already sent for this automation+recipient — skipping`, {
          automationId: automation.id,
          commenterId,
        });
        await webhookEventRepo.markProcessed(dbEvent.id);
        continue;
      }

      // ── Step 6: Send DM using ONLY Page Access Token ───────────────────
      const dmResult = await metaService.sendDM({
        instagramId,
        pageAccessToken: connectedAccount.pageAccessToken, // strictly Page token, decrypted
        recipientIgUserId: commenterId,
        messageText: automation.responseMessage,
        reqId,
      });

      // ── Step 7: Mark event done ────────────────────────────────────────
      await webhookEventRepo.markProcessed(dbEvent.id);

      logger.info(reqId, `✅ Event fully processed`, {
        eventId,
        automationId: automation.id,
        dmMessageId: dmResult?.message_id,
      });
    } catch (err) {
      logger.error(reqId, `❌ Error processing event`, {
        eventId,
        instagramId,
        error: err?.response?.data || err.message,
      });
      // Mark as processed-with-error so it doesn't re-process but we have a record
      await webhookEventRepo.markProcessed(dbEvent.id, err.message).catch(() => {});
    }
  }
}

module.exports = { processWebhook, parseWebhookBody };
