// src/controllers/automation.controller.js
"use strict";

const automationService = require("../services/automation.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
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
    const { instagramId, name, keywords, matchType, responseMessage } = req.body;

    if (!instagramId) return res.status(400).json({ ok: false, error: "instagramId is required" });
    if (!name) return res.status(400).json({ ok: false, error: "name is required" });
    if (!keywords?.length) return res.status(400).json({ ok: false, error: "keywords array is required" });
    if (!responseMessage) return res.status(400).json({ ok: false, error: "responseMessage is required" });

    const validMatchTypes = ["CONTAINS", "EXACT", "STARTS_WITH"];
    const resolvedMatchType = matchType || "CONTAINS";
    if (!validMatchTypes.includes(resolvedMatchType)) {
      return res.status(400).json({ ok: false, error: `matchType must be one of: ${validMatchTypes.join(", ")}` });
    }

    // Verify the IG account belongs to this user
    const account = await connectedAccountRepo.findByInstagramId(instagramId);
    if (!account || account.userId !== req.userId) {
      return res.status(403).json({ ok: false, error: "Instagram account not found or not authorized" });
    }

    const automation = await automationService.createAutomation({
      userId: req.userId,
      instagramId,
      name,
      keywords,
      matchType: resolvedMatchType,
      responseMessage,
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

    const { name, keywords, matchType, responseMessage, isActive } = req.body;
    const updated = await automationService.updateAutomation(id, {
      name,
      keywords,
      matchType,
      responseMessage,
      isActive,
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

module.exports = { list, create, update, remove };
