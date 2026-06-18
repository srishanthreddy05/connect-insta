// src/controllers/automation.controller.js
"use strict";

const automationService = require("../services/automation.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const instagramMediaService = require("../services/instagramMedia.service");
const { getDb } = require("../config/db");
const { logger } = require("../utils/logger");

/**
 * GET /automations
 * Lists all automations for the authenticated user.
 */
async function list(req, res, next) {
  try {
    const automations = await automationService.listAutomations(req.userId);
    res.json({ ok: true, data: automations });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /automations
 * Creates a new automation.
 *
 * Body:
 * {
 *   instagramId: string,
 *   name: string,
 *   keywords: string[],       // e.g. ["price", "pricing", "cost"]
 *   matchType: "CONTAINS" | "EXACT" | "STARTS_WITH",
 *   responseMessage: string,
 *   isActive?: boolean
 * }
 */
async function create(req, res, next) {
  try {
    const { instagramId, name, keywords, matchType, responseMessage, triggerType, flowSteps, applyToAllPosts, selectedMediaIds, enableCommentReply, commentReplyMessage, openingMessage, messages } = req.body;

    if (!instagramId) return res.status(400).json({ ok: false, error: "instagramId is required" });
    if (!name) return res.status(400).json({ ok: false, error: "name is required" });

    const resolvedTriggerType = triggerType || "COMMENT";
    if (!["COMMENT", "DM"].includes(resolvedTriggerType)) {
      return res.status(400).json({ ok: false, error: "triggerType must be COMMENT or DM" });
    }

    const resolvedEnableCommentReply = enableCommentReply === true || enableCommentReply === "true";

    if (resolvedTriggerType === "COMMENT") {
      if (!keywords?.length) return res.status(400).json({ ok: false, error: "keywords array is required" });
      if (!responseMessage) return res.status(400).json({ ok: false, error: "responseMessage is required" });
      if (resolvedEnableCommentReply) {
        if (!commentReplyMessage || !commentReplyMessage.trim()) {
          return res.status(400).json({ ok: false, error: "commentReplyMessage must not be empty when enableCommentReply is true" });
        }
      }
    } else {
      if (!openingMessage || !openingMessage.trim()) {
        return res.status(400).json({ ok: false, error: "openingMessage is required for DM triggers" });
      }
      // Check each non-empty message in messages array
      const validMessages = (messages || []).filter(msg => typeof msg === "string" ? msg.trim() : msg?.message?.trim());
      for (const msg of validMessages) {
        const text = typeof msg === "string" ? msg : msg?.message;
        if (!text || !text.trim()) {
          return res.status(400).json({ ok: false, error: "Sequential message text must not be empty" });
        }
      }
    }

    const validMatchTypes = ["CONTAINS", "EXACT", "STARTS_WITH"];
    const resolvedMatchType = matchType || "CONTAINS";
    if (!validMatchTypes.includes(resolvedMatchType)) {
      return res.status(400).json({ ok: false, error: `matchType must be one of: ${validMatchTypes.join(", ")}` });
    }

    const account = await connectedAccountRepo.findByInstagramId(instagramId);
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: "Instagram account not found or not authorized" });
    }

    const resolvedApplyToAll = applyToAllPosts !== undefined ? applyToAllPosts : true;
    const resolvedMediaIds = selectedMediaIds || [];

    // Validate ownership of selected media
    if (!resolvedApplyToAll && resolvedMediaIds.length > 0) {
      const db = getDb();
      const mediaCount = await db.instagramMedia.count({
        where: {
          mediaId: { in: resolvedMediaIds },
          instagramId,
        },
      });
      if (mediaCount !== resolvedMediaIds.length) {
        return res.status(400).json({
          ok: false,
          error: "One or more selected media items do not belong to this Instagram account.",
        });
      }
    }

    const automation = await automationService.createAutomation({
      userId: req.userId,
      instagramId,
      name,
      keywords: keywords || [],
      matchType: resolvedMatchType,
      responseMessage: responseMessage || "",
      triggerType: resolvedTriggerType,
      flowSteps: flowSteps || null,
      applyToAllPosts: resolvedApplyToAll,
      selectedMediaIds: resolvedMediaIds,
      enableCommentReply: resolvedEnableCommentReply,
      commentReplyMessage: resolvedEnableCommentReply ? commentReplyMessage : null,
      openingMessage: resolvedTriggerType === "DM" ? openingMessage : null,
      messages: resolvedTriggerType === "DM" ? (messages || []).filter(msg => typeof msg === "string" ? msg.trim() : msg?.message?.trim()) : [],
    });

    logger.info(req.reqId, `✅ Automation created`, { id: automation.id, name });
    res.status(201).json({ ok: true, data: automation });
  } catch (err) {
    next(err);
  }
}
/**
 * PUT /automations/:id
 * Updates an existing automation.
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await automationService.getAutomationById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Automation not found" });
    }
    if (existing.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    const { name, keywords, matchType, responseMessage, isActive, applyToAllPosts, selectedMediaIds, enableCommentReply, commentReplyMessage, openingMessage, messages } = req.body;

    // Validate ownership of selected media if they are being updated
    if (applyToAllPosts === false && selectedMediaIds && selectedMediaIds.length > 0) {
      const db = getDb();
      const mediaCount = await db.instagramMedia.count({
        where: {
          mediaId: { in: selectedMediaIds },
          instagramId: existing.instagramId,
        },
      });
      if (mediaCount !== selectedMediaIds.length) {
        return res.status(400).json({
          ok: false,
          error: "One or more selected media items do not belong to this Instagram account.",
        });
      }
    }

    const resolvedEnableCommentReply = enableCommentReply !== undefined ? (enableCommentReply === true || enableCommentReply === "true") : existing.enableCommentReply;
    const resolvedCommentReplyMessage = commentReplyMessage !== undefined ? commentReplyMessage : existing.commentReplyMessage;

    if (existing.triggerType === "COMMENT" && resolvedEnableCommentReply) {
      if (!resolvedCommentReplyMessage || !resolvedCommentReplyMessage.trim()) {
        return res.status(400).json({ ok: false, error: "commentReplyMessage must not be empty when enableCommentReply is true" });
      }
    }

    const resolvedTriggerType = existing.triggerType;
    const resolvedOpeningMessage = openingMessage !== undefined ? openingMessage : existing.openingMessage;
    if (resolvedTriggerType === "DM") {
      if (!resolvedOpeningMessage || !resolvedOpeningMessage.trim()) {
        return res.status(400).json({ ok: false, error: "openingMessage is required for DM triggers" });
      }
      if (messages !== undefined) {
        const validMessages = messages.filter(msg => typeof msg === "string" ? msg.trim() : msg?.message?.trim());
        for (const msg of validMessages) {
          const text = typeof msg === "string" ? msg : msg?.message;
          if (!text || !text.trim()) {
            return res.status(400).json({ ok: false, error: "Sequential message text must not be empty" });
          }
        }
      }
    }

    const updated = await automationService.updateAutomation(id, {
      name,
      keywords,
      matchType,
      responseMessage,
      isActive,
      applyToAllPosts,
      selectedMediaIds,
      enableCommentReply: resolvedEnableCommentReply,
      commentReplyMessage: resolvedEnableCommentReply ? resolvedCommentReplyMessage : null,
      openingMessage: resolvedTriggerType === "DM" ? resolvedOpeningMessage : null,
      messages: resolvedTriggerType === "DM" && messages !== undefined ? messages.filter(msg => typeof msg === "string" ? msg.trim() : msg?.message?.trim()) : undefined,
    });

    logger.info(req.reqId, `✅ Automation updated`, { id });
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /automations/:id
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await automationService.getAutomationById(id);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Automation not found" });
    }
    if (existing.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: "Not authorized" });
    }

    await automationService.deleteAutomation(id);
    logger.info(req.reqId, `✅ Automation deleted`, { id });
    res.json({ ok: true, message: "Automation deleted" });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /instagram/media
 * Query: ?instagramId=...&force=...
 * Retrieves recent media for an Instagram account, syncing if stale (or forced).
 */
async function getMedia(req, res, next) {
  try {
    const { instagramId, force } = req.query;
    if (!instagramId) {
      return res.status(400).json({ ok: false, error: "instagramId is required" });
    }

    const account = await connectedAccountRepo.findByInstagramId(instagramId);
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: "Instagram account not found or not authorized" });
    }

    const forceSync = force === "true";
    try {
      await instagramMediaService.syncMediaForAccount(instagramId, forceSync, req.reqId);
    } catch (syncErr) {
      logger.error(req.reqId, `⚠️ Stale media sync failed (non-fatal), falling back to DB`, {
        error: syncErr.message,
      });
    }

    const db = getDb();
    const media = await db.instagramMedia.findMany({
      where: { instagramId },
      orderBy: { timestamp: "desc" },
    });

    res.json({ ok: true, data: media });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, getMedia };
