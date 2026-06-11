// src/services/automation.service.js
"use strict";

const automationRepo = require("../repositories/automation.repository");

/**
 * Normalizes a string for comparison:
 *   - lowercase
 *   - trim whitespace
 */
function normalize(str) {
  return String(str || "").toLowerCase().trim();
}

/**
 * Tests whether a comment text matches an automation's keyword rules.
 *
 * Rules:
 *   EXACT      — normalized text must equal at least one keyword exactly
 *   CONTAINS   — normalized text must contain at least one keyword
 *   STARTS_WITH — normalized text must start with at least one keyword
 *
 * Supports multiple keywords per automation (OR logic).
 * Case-insensitive and whitespace-trimmed automatically.
 *
 * @param {string}   commentText
 * @param {string[]} keywords    - array of keywords (already normalized in DB)
 * @param {string}   matchType   - "EXACT" | "CONTAINS" | "STARTS_WITH"
 * @returns {boolean}
 */
function matchesKeyword(commentText, keywords, matchType) {
  const text = normalize(commentText);
  if (!text || !keywords?.length) return false;

  return keywords.some((kw) => {
    const keyword = normalize(kw);
    switch (matchType) {
      case "EXACT":
        return text === keyword;
      case "STARTS_WITH":
        return text.startsWith(keyword);
      case "CONTAINS":
      default:
        return text.includes(keyword);
    }
  });
}

/**
 * Loads all active automations for an Instagram account and returns the first match.
 * Returns null if no automation matches the comment.
 *
 * @param {string} instagramId
 * @param {string} commentText
 * @returns {object|null} matched automation or null
 */
async function findMatchingAutomation(instagramId, commentText) {
  const automations = await automationRepo.findActiveByInstagramId(instagramId);

  for (const automation of automations) {
    if (matchesKeyword(commentText, automation.keywords, automation.matchType)) {
      return automation;
    }
  }

  return null;
}

// ─── CRUD wrappers (thin pass-through to repo, keeping service layer clean) ───

async function listAutomations(userId) {
  return automationRepo.findAllByUserId(userId);
}

async function createAutomation(data) {
  return automationRepo.create(data);
}

async function updateAutomation(id, data) {
  return automationRepo.update(id, data);
}

async function deleteAutomation(id) {
  return automationRepo.remove(id);
}

async function getAutomationById(id) {
  return automationRepo.findById(id);
}

module.exports = {
  matchesKeyword,
  findMatchingAutomation,
  listAutomations,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  getAutomationById,
};
