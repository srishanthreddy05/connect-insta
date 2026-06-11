// src/repositories/webhookEvent.repository.js
"use strict";

const { getDb } = require("../config/db");

/**
 * Tries to create a webhook event record.
 * Returns { created: true, event } if new, { created: false } if duplicate (unique constraint on eventId).
 * This replaces the in-memory Set — deduplication is now durable across restarts.
 */
async function createIfNew({ instagramId, eventType, eventId, payload }) {
  const db = getDb();
  try {
    const event = await db.webhookEvent.create({
      data: { instagramId, eventType, eventId, payload, processed: false },
    });
    return { created: true, event };
  } catch (err) {
    // P2002 = unique constraint violation (duplicate eventId)
    if (err.code === "P2002") {
      return { created: false };
    }
    throw err;
  }
}

async function markProcessed(id, error = null) {
  const db = getDb();
  return db.webhookEvent.update({
    where: { id },
    data: {
      processed: true,
      processedAt: new Date(),
      error: error || null,
    },
  });
}

async function findRecent(instagramId, limit = 50) {
  const db = getDb();
  return db.webhookEvent.findMany({
    where: { instagramId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      eventId: true,
      processed: true,
      error: true,
      createdAt: true,
      processedAt: true,
    },
  });
}

async function findAll(limit = 100) {
  const db = getDb();
  return db.webhookEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      instagramId: true,
      eventType: true,
      eventId: true,
      processed: true,
      error: true,
      createdAt: true,
      processedAt: true,
    },
  });
}

module.exports = { createIfNew, markProcessed, findRecent, findAll };
