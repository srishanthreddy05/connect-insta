// src/repositories/automation.repository.js
"use strict";

const { getDb } = require("../config/db");

/**
 * Returns all active automations for a given Instagram account.
 * Called by the webhook processor on every comment event.
 */
async function findActiveByInstagramId(instagramId) {
  const db = getDb();
  return db.automation.findMany({
    where: { instagramId, isActive: true, triggerType: "COMMENT" }, // ← ADD triggerType filter
    orderBy: { createdAt: "asc" },
  });
}
/**
 * Returns all automations for a user (for dashboard).
 */
async function findAllByUserId(userId) {
  const db = getDb();
  return db.automation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

async function findById(id) {
  const db = getDb();
  return db.automation.findUnique({ where: { id } });
}


async function create({ userId, instagramId, name, keywords, matchType, responseMessage, triggerType, flowSteps }) {
  const db = getDb();
  return db.automation.create({
    data: {
      userId,
      instagramId,
      name,
      keywords: keywords.map((k) => k.toLowerCase().trim()),
      matchType,
      responseMessage,
      triggerType,
      flowSteps,
      isActive: true,
    },
  });
}

async function update(id, { name, keywords, matchType, responseMessage, isActive, triggerType, flowSteps }) {
  const db = getDb();
  const data = {};
  if (name !== undefined) data.name = name;
  if (keywords !== undefined) data.keywords = keywords.map((k) => k.toLowerCase().trim());
  if (matchType !== undefined) data.matchType = matchType;
  if (responseMessage !== undefined) data.responseMessage = responseMessage;
  if (isActive !== undefined) data.isActive = isActive;
  if (triggerType !== undefined) data.triggerType = triggerType;
  if (flowSteps !== undefined) data.flowSteps = flowSteps;

  return db.automation.update({ where: { id }, data });
}


async function remove(id) {
  const db = getDb();
  return db.automation.delete({ where: { id } });
}

async function findActiveDMAutomation(instagramId) {
  const db = getDb();
  return db.automation.findFirst({
    where: { instagramId, isActive: true, triggerType: "DM" },
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { findActiveByInstagramId, findAllByUserId, findById, create, update, remove, findActiveDMAutomation };
