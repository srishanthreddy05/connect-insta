// src/services/webhook.service.js
"use strict";

const webhookEventRepo = require("../repositories/webhookEvent.repository");
const sentDmRepo = require("../repositories/sentDm.repository");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const automationService = require("./automation.service");
const metaService = require("./meta.service");
const { logger } = require("../utils/logger");

function parseWebhookBody(body) {
  const events = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];

  for (const entry of entries) {
    const igAccountId = entry.id;

    // ── EXISTING: Comment events via entry.changes ──
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value || {};
      const field = change?.field || "unknown";

      const eventId =
        value.id || value.comment_id || value.message_id ||
        `${igAccountId}:${field}:${value.created_time || Date.now()}`;

      const isComment = field === "comments" || value.item === "comment" ||
        Boolean(value.comment_id) || (typeof value.text === "string" && field !== "messages");
      const isMention = field === "mentions";

      let eventType = "unknown";
      if (isComment) eventType = "comment";
      else if (isMention) eventType = "mention";

      const commentText = String(value.text || value.message || value.comment_text || "").trim();
      const commenterId = value.from?.id || value.commenter_id || value.user_id || null;
      const mediaId = value.media?.id || value.media_id || value.post_id || entry.id || null;

      events.push({
        instagramId: igAccountId, eventId, eventType,
        commentText, commenterId, mediaId, rawValue: value,
      });
    }

    // ── NEW: DM events via entry.messaging ──
    const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];
    for (const message of messaging) {
      const senderId = message.sender?.id;

      // Loop prevention - skip bot's own outgoing messages
      if (senderId === igAccountId) continue;

      if (!message.message) continue;          // ← ADD THIS: skip read receipts
      if (!message.message.text) continue;     // ← ADD THIS: skip messages with no text

      events.push({
        instagramId: igAccountId,
        eventId: message.message?.mid || `dm:${igAccountId}:${Date.now()}`,
        eventType: "message",
        commentText: message.message?.text || "",
        commenterId: senderId,
        mediaId: null,
        rawValue: message,
      });
    }
  }

  return events;
}

async function processWebhook(body, reqId) {
  const events = parseWebhookBody(body);

  if (events.length === 0) {
    logger.info(reqId, `ℹ️ Webhook body contained no parseable events`);
    return;
  }

  for (const event of events) {
    const { instagramId, eventId, eventType, commentText, commenterId, mediaId } = event;

    // ── Step 1: Deduplication ──────────────────────────────────────────────
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
      // ── Step 2: Only process comment events ───────────────────────────
      if (eventType === "message") {
        const { handleDM } = require("./messageHandler");
        await handleDM({ instagramId, eventId, senderId: commenterId, text: commentText, dbEventId: dbEvent.id }, reqId);
        continue;
      }

      if (eventType !== "comment") {
        logger.info(reqId, `ℹ️ Non-comment event — skipping`, { eventType, eventId });
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

      // ── Step 3: Look up connected account ─────────────────────────────
      // ── Step 3: Look up connected account ─────────────────────────────
      let connectedAccount = await connectedAccountRepo.findByInstagramId(instagramId);

      // Fallback: try webhookInstagramId column


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

      // ── Step 4: Find matching automation ──────────────────────────────
      const automation = await automationService.findMatchingAutomation(instagramId, commentText, mediaId, reqId);
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

      // Increment Trigger Count
      logger.info(reqId, `📈 Automation Trigger Count Started`, { automationId: automation.id });
      await automationService.incrementTriggerCount(automation.id).catch((err) => {
        logger.error(reqId, `⚠️ Failed to increment trigger count`, { error: err.message });
      });

      // ── Step 5: Comment Reply ──────────────────────────────────────────
      if (automation.enableCommentReply) {
        logger.info(reqId, `💬 Comment Reply Started`, {
          automationId: automation.id,
          commentId: eventId,
        });

        try {
          if (!automation.commentReplyMessage) {
            throw new Error("Comment reply enabled but message is empty");
          }

          await metaService.replyToComment({
            commentId: eventId,
            messageText: automation.commentReplyMessage,
            accessToken: connectedAccount.accessToken,
            reqId,
          });

          logger.info(reqId, `✅ Comment Reply Success`, {
            automationId: automation.id,
            commentId: eventId,
          });

          await automationService.incrementCommentsRepliedCount(automation.id).catch((err) => {
            logger.error(reqId, `⚠️ Failed to increment comments replied count`, { error: err.message });
          });
        } catch (replyError) {
          const apiError = replyError.response?.data?.error || {};
          logger.error(reqId, `❌ Comment Reply Failed`, {
            automationId: automation.id,
            commentId: eventId,
            error: replyError.message,
            apiCode: apiError.code,
            apiSubcode: apiError.error_subcode,
            apiMessage: apiError.message,
          });
          // Continue attempting DM regardless of comment reply failure
        }
      }

      // ── Step 6: Send DM ───────────────────────────────────────────────
      logger.info(reqId, `📨 DM Started`, {
        automationId: automation.id,
        recipientId: commenterId,
      });

      let dmResult;
      try {
        dmResult = await metaService.sendDM({
          instagramId,
          accessToken: connectedAccount.accessToken,
          recipientIgUserId: commenterId,
          messageText: automation.responseMessage,
          reqId,
        });

        logger.info(reqId, `✅ DM Success`, {
          automationId: automation.id,
          messageId: dmResult?.message_id,
        });

        await automationService.incrementDmsSentCount(automation.id).catch((err) => {
          logger.error(reqId, `⚠️ Failed to increment DMs sent count`, { error: err.message });
        });
      } catch (dmError) {
        const subcode = dmError?.response?.data?.error?.error_subcode;
        const code = dmError?.response?.data?.error?.code;

        if (subcode === 2534022) {
          // 24hr window closed — don't record as sent, allow retry later
          logger.warn(reqId, `⚠️ DM outside 24hr window — skipping without recording`, {
            commenterId,
            eventId,
          });
          await webhookEventRepo.markProcessed(dbEvent.id, "24hr window closed").catch(() => { });
          continue;
        }

        // Any other DM error — log and move on
        logger.error(reqId, `❌ DM send failed`, {
          eventId,
          instagramId,
          error: dmError?.response?.data || dmError.message,
        });
        await webhookEventRepo.markProcessed(dbEvent.id, dmError.message).catch(() => { });
        continue;
      }

      // ── Step 7: Record DM only after successful send ──────────────────
      await sentDmRepo.recordIfNew({
        instagramId,
        recipientId: commenterId,
        automationId: automation.id,
        messageText: automation.responseMessage,
        metaMessageId: dmResult?.message_id,
      });

      // ── Step 8: Mark event done ───────────────────────────────────────
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
      await webhookEventRepo.markProcessed(dbEvent.id, err.message).catch(() => { });
    }
  }
}

module.exports = { processWebhook, parseWebhookBody };