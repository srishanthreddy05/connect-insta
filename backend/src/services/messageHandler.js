"use strict";

const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const automationRepo = require("../repositories/automation.repository");
const webhookEventRepo = require("../repositories/webhookEvent.repository");
const sequentialDmService = require("./sequentialDm.service");
const { logger } = require("../utils/logger");

async function handleDM({ instagramId, eventId, senderId, text, dbEventId }, reqId) {
    const input = text?.trim().toLowerCase();

    try {
        // ── Get connected account ──────────────────────────────
        const account = await connectedAccountRepo.findByInstagramId(instagramId);
        if (!account || !account.isActive) {
            logger.warn(reqId, `⚠️ No active account for DM`, { instagramId });
            await webhookEventRepo.markProcessed(dbEventId, "No active account");
            return;
        }

        // ── Load active DM automation ──────────────────────────
        const automation = await automationRepo.findActiveDMAutomation(instagramId);
        if (!automation) {
            logger.info(reqId, `ℹ️ No DM automation configured`, { instagramId });
            await webhookEventRepo.markProcessed(dbEventId);
            return;
        }

        // ── Trigger check (standard keywords array or fallback triggers list) ──
        const triggers = automation.keywords?.length ? automation.keywords : (automation.flowSteps?.triggers || []);
        const isTrigger = triggers.some(t => input?.includes(t.toLowerCase().trim()));

        if (!isTrigger) {
            logger.info(reqId, `ℹ️ DM did not match any trigger`, { input, triggers });
            await webhookEventRepo.markProcessed(dbEventId);
            return;
        }

        // ── Dispatch sequential messages ──
        await sequentialDmService.sendSequentialMessages({
            automation,
            recipientIgUserId: senderId,
            connectedAccount: account,
            reqId,
        });

        await webhookEventRepo.markProcessed(dbEventId);
        logger.info(reqId, `✅ DM flow handled`, { instagramId, senderId });

    } catch (err) {
        logger.error(reqId, `❌ DM handler error`, { error: err.message, instagramId, senderId });
        await webhookEventRepo.markProcessed(dbEventId, err.message).catch(() => { });
    }
}

module.exports = { handleDM };