// src/repositories/sentDm.repository.js
"use strict";

const { getDb } = require("../config/db");

/**
 * Records a sent DM. Returns { created: true } if new, { created: false } if duplicate.
 * Unique constraint on (instagramId, recipientId, automationId) prevents the same automation
 * from DMing the same person twice for the same trigger.
 */
async function recordIfNew({ instagramId, recipientId, automationId, messageText, metaMessageId }) {
  const db = getDb();
  try {
    await db.sentDm.create({
      data: { instagramId, recipientId, automationId, messageText, metaMessageId },
    });
    return { created: true };
  } catch (err) {
    if (err.code === "P2002") {
      return { created: false };
    }
    throw err;
  }
}

module.exports = { recordIfNew };
