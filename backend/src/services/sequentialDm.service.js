// src/services/sequentialDm.service.js
"use strict";

const metaService = require("./meta.service");
const sentDmRepo = require("../repositories/sentDm.repository");
const automationService = require("./automation.service");
const { logger } = require("../utils/logger");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendSequentialMessages({ automation, recipientIgUserId, connectedAccount, reqId = "sys" }) {
  const instagramId = connectedAccount.instagramId;
  const accessToken = connectedAccount.accessToken;

  logger.info(reqId, `🎯 Automation Matched`, {
    automationId: automation.id,
    name: automation.name,
    recipientIgUserId,
  });

  // 1. Record trigger to prevent duplicate webhook processing/loops
  const { created } = await sentDmRepo.recordIfNew({
    instagramId,
    recipientId: recipientIgUserId,
    automationId: automation.id,
    messageText: automation.openingMessage || "",
    metaMessageId: `seq:${automation.id}:${Date.now()}`,
  });

  if (!created) {
    logger.warn(reqId, `⏭️ Sequential DM already sent to user — skipping to prevent loops`, {
      recipientIgUserId,
      automationId: automation.id,
    });
    return;
  }

  // 2. Send Opening Message
  try {
    const openingText = automation.openingMessage || "Hi 👋";
    const result = await metaService.sendDM({
      instagramId,
      accessToken,
      recipientIgUserId,
      messageText: openingText,
      reqId,
    });
    logger.info(reqId, `✅ Opening Message Sent`, {
      automationId: automation.id,
      recipientIgUserId,
      messageId: result?.message_id,
    });
    await automationService.incrementDmsSentCount(automation.id).catch(() => {});
  } catch (error) {
    logger.error(reqId, `❌ Opening Message Failed`, {
      automationId: automation.id,
      error: error.message,
    });
  }

  // 3. Loop through messages ordered by "order" and send each
  const messages = automation.messages || [];
  const sortedMessages = [...messages].sort((a, b) => a.order - b.order);

  for (let i = 0; i < sortedMessages.length; i++) {
    const msgCard = sortedMessages[i];
    const cardIndex = i + 1;
    try {
      const result = await metaService.sendDM({
        instagramId,
        accessToken,
        recipientIgUserId,
        messageText: msgCard.message,
        reqId,
      });
      await sleep(1500 + Math.random() * 1500);
      logger.info(reqId, `✅ Message ${cardIndex} Sent`, {
        automationId: automation.id,
        msgId: msgCard.id,
        recipientIgUserId,
        messageId: result?.message_id,
      });
      await automationService.incrementDmsSentCount(automation.id).catch(() => {});
    } catch (error) {
      logger.error(reqId, `❌ Message ${cardIndex} Failed`, {
        automationId: automation.id,
        msgId: msgCard.id,
        error: error.message,
      });
    }
  }

  logger.info(reqId, `✅ Automation Completed`, {
    automationId: automation.id,
    recipientIgUserId,
  });
}

module.exports = { sendSequentialMessages };
