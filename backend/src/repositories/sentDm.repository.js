// src/repositories/sentDm.repository.js
"use strict";

const { getDb } = require("../config/db");

/**
 * Checks if a specific response has already been processed/sent.
 */
async function checkProcessed({ instagramId, recipientId, messageType, externalMessageId }) {
  const db = getDb();
  return db.sentDm.findFirst({
    where: {
      instagramId,
      recipientId,
      messageType,
      externalMessageId,
    },
  });
}

/**
 * Records a sent DM. Returns { created: true } if new, { created: false } if duplicate.
 * Unique constraint on (instagramId, recipientId, messageType, externalMessageId) prevents the same automation
 * from DMing the same person twice for the same trigger.
 */
async function recordIfNew({ instagramId, recipientId, automationId, messageText, metaMessageId, messageType = "COMMENT_REPLY", externalMessageId = "" }) {
  const db = getDb();
  try {
    await db.sentDm.create({
      data: { instagramId, recipientId, automationId, messageText, metaMessageId, messageType, externalMessageId },
    });
    return { created: true };
  } catch (err) {
    if (err.code === "P2002") {
      return { created: false };
    }
    throw err;
  }
}

module.exports = { recordIfNew, checkProcessed };
