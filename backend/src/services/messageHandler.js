"use strict";

const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const automationRepo = require("../repositories/automation.repository");
const conversationStateRepo = require("../repositories/conversationState.repository");
const webhookEventRepo = require("../repositories/webhookEvent.repository");
const metaService = require("./meta.service");
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
        if (!automation || !automation.flowSteps) {
            logger.info(reqId, `ℹ️ No DM automation configured`, { instagramId });
            await webhookEventRepo.markProcessed(dbEventId);
            return;
        }

        const flow = automation.flowSteps;

        // ── Get current conversation state ─────────────────────
        const stateRow = await conversationStateRepo.get(instagramId, senderId);
        const currentState = stateRow?.state || "START";

        if (currentState === "START") {
            // Check if message matches a trigger word
            const triggers = flow.triggers || [];
            const isTrigger = triggers.some(t => input?.includes(t.toLowerCase()));

            if (!isTrigger) {
                logger.info(reqId, `ℹ️ DM did not match any trigger`, { input });
                await webhookEventRepo.markProcessed(dbEventId);
                return;
            }

            // Send greeting + menu
            await metaService.sendDM({
                instagramId,
                accessToken: account.accessToken,
                recipientIgUserId: senderId,
                messageText: flow.greeting,
                reqId,
            });

            await conversationStateRepo.upsert(instagramId, senderId, "AWAITING_MENU_SELECTION");

        } else if (currentState === "AWAITING_MENU_SELECTION") {
            const choices = flow.choices || {};
            const choice = choices[input];

            if (choice) {
                await metaService.sendDM({
                    instagramId,
                    accessToken: account.accessToken,
                    recipientIgUserId: senderId,
                    messageText: choice,
                    reqId,
                });
                // Reset so user can start again
                await conversationStateRepo.clear(instagramId, senderId);
            } else {
                // Invalid input
                await metaService.sendDM({
                    instagramId,
                    accessToken: account.accessToken,
                    recipientIgUserId: senderId,
                    messageText: flow.fallback || "Please reply with one of the menu options.",
                    reqId,
                });
            }
        }

        await webhookEventRepo.markProcessed(dbEventId);
        logger.info(reqId, `✅ DM handled`, { instagramId, senderId, state: currentState });

    } catch (err) {
        logger.error(reqId, `❌ DM handler error`, { error: err.message, instagramId, senderId });
        await webhookEventRepo.markProcessed(dbEventId, err.message).catch(() => { });
    }
}

module.exports = { handleDM };