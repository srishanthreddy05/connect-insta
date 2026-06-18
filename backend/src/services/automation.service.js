// src/services/automation.service.js
"use strict";

const automationRepo = require("../repositories/automation.repository");
const { logger } = require("../utils/logger");

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

function getMatchedKeyword(commentText, keywords, matchType) {
  const text = normalize(commentText);
  if (!text || !keywords?.length) return null;

  for (const kw of keywords) {
    const keyword = normalize(kw);
    let matched = false;
    switch (matchType) {
      case "EXACT":
        matched = text === keyword;
        break;
      case "STARTS_WITH":
        matched = text.startsWith(keyword);
        break;
      case "CONTAINS":
      default:
        matched = text.includes(keyword);
        break;
    }
    if (matched) return kw;
  }
  return null;
}

/**
 * Loads all active automations for an Instagram account and returns the first match that satisfies keyword and scope.
 * Returns null if no automation matches the comment and scope.
 */
async function findMatchingAutomation(instagramId, commentText, mediaId = null, reqId = "sys") {
  const automations = await automationRepo.findActiveByInstagramId(instagramId);

  for (const automation of automations) {
    const matchedKeyword = getMatchedKeyword(commentText, automation.keywords, automation.matchType);
    
    if (matchedKeyword) {
      const applyToAll = automation.applyToAllPosts;
      const selectedMediaList = automation.selectedMedia || [];
      const hasMediaMatch = selectedMediaList.some((m) => m.mediaId === mediaId);

      // Decision logic
      let decision = "IGNORE";
      if (applyToAll || hasMediaMatch) {
        decision = "TRIGGER";
      }

      // Logging
      logger.info(reqId, `⚙️ Automation Trigger Evaluation`, {
        automationId: automation.id,
        automationName: automation.name,
        matchedKeyword,
        incomingMediaId: mediaId,
        matchedMedia: hasMediaMatch,
        applyToAll,
        decision,
      });

      if (decision === "TRIGGER") {
        return automation;
      }
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
