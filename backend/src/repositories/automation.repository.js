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
    where: { instagramId, isActive: true, triggerType: "COMMENT" },
    include: {
      selectedMedia: true,
    },
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
    include: {
      selectedMedia: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function findById(id) {
  const db = getDb();
  return db.automation.findUnique({
    where: { id },
    include: {
      selectedMedia: true,
    },
  });
}


async function create({ userId, instagramId, name, keywords, matchType, responseMessage, triggerType, flowSteps, applyToAllPosts, selectedMediaIds, enableCommentReply, commentReplyMessage }) {
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
      applyToAllPosts: applyToAllPosts !== undefined ? applyToAllPosts : true,
      enableCommentReply: enableCommentReply !== undefined ? enableCommentReply : false,
      commentReplyMessage,
      isActive: true,
      selectedMedia: {
        connect: (selectedMediaIds || []).map((mediaId) => ({ mediaId })),
      },
    },
    include: {
      selectedMedia: true,
    },
  });
}

async function update(id, { name, keywords, matchType, responseMessage, isActive, triggerType, flowSteps, applyToAllPosts, selectedMediaIds, enableCommentReply, commentReplyMessage }) {
  const db = getDb();
  const data = {};
  if (name !== undefined) data.name = name;
  if (keywords !== undefined) data.keywords = keywords.map((k) => k.toLowerCase().trim());
  if (matchType !== undefined) data.matchType = matchType;
  if (responseMessage !== undefined) data.responseMessage = responseMessage;
  if (isActive !== undefined) data.isActive = isActive;
  if (triggerType !== undefined) data.triggerType = triggerType;
  if (flowSteps !== undefined) data.flowSteps = flowSteps;
  if (applyToAllPosts !== undefined) data.applyToAllPosts = applyToAllPosts;
  if (enableCommentReply !== undefined) data.enableCommentReply = enableCommentReply;
  if (commentReplyMessage !== undefined) data.commentReplyMessage = commentReplyMessage;
  if (selectedMediaIds !== undefined) {
    data.selectedMedia = {
      set: selectedMediaIds.map((mediaId) => ({ mediaId })),
    };
  }

  return db.automation.update({
    where: { id },
    data,
    include: {
      selectedMedia: true,
    },
  });
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

async function incrementTriggerCount(id) {
  const db = getDb();
  return db.automation.update({
    where: { id },
    data: { triggerCount: { increment: 1 } },
  });
}

async function incrementCommentsRepliedCount(id) {
  const db = getDb();
  return db.automation.update({
    where: { id },
    data: { commentsRepliedCount: { increment: 1 } },
  });
}

async function incrementDmsSentCount(id) {
  const db = getDb();
  return db.automation.update({
    where: { id },
    data: { dmsSentCount: { increment: 1 } },
  });
}

module.exports = {
  findActiveByInstagramId,
  findAllByUserId,
  findById,
  create,
  update,
  remove,
  findActiveDMAutomation,
  incrementTriggerCount,
  incrementCommentsRepliedCount,
  incrementDmsSentCount,
};
