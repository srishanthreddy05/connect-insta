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
    where: { instagramId, isActive: true },
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

async function create({ userId, instagramId, name, keywords, matchType, responseMessage }) {
  const db = getDb();
  return db.automation.create({
    data: {
      userId,
      instagramId,
      name,
      keywords: keywords.map((k) => k.toLowerCase().trim()),
      matchType,
      responseMessage,
      isActive: true,
    },
  });
}

async function update(id, { name, keywords, matchType, responseMessage, isActive }) {
  const db = getDb();
  const data = {};
  if (name !== undefined) data.name = name;
  if (keywords !== undefined) data.keywords = keywords.map((k) => k.toLowerCase().trim());
  if (matchType !== undefined) data.matchType = matchType;
  if (responseMessage !== undefined) data.responseMessage = responseMessage;
  if (isActive !== undefined) data.isActive = isActive;

  return db.automation.update({ where: { id }, data });
}

async function remove(id) {
  const db = getDb();
  return db.automation.delete({ where: { id } });
}

module.exports = { findActiveByInstagramId, findAllByUserId, findById, create, update, remove };
