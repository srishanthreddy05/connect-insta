// src/repositories/connectedAccount.repository.js
"use strict";

const { getDb } = require("../config/db");
const { encrypt, decrypt } = require("../utils/encryption");

/**
 * Finds the connected account record by Instagram account ID.
 * Returns null if not found.
 * Decrypts the page access token before returning.
 */
async function findByInstagramId(instagramId) {
  const db = getDb();
  const account = await db.connectedAccount.findUnique({
    where: { instagramId },
  });
  if (!account) return null;
  return {
    ...account,
    pageAccessToken: decrypt(account.pageAccessToken),
  };
}

/**
 * Finds connected account by Facebook Page ID.
 */
async function findByPageId(pageId) {
  const db = getDb();
  const account = await db.connectedAccount.findUnique({
    where: { pageId },
  });
  if (!account) return null;
  return {
    ...account,
    pageAccessToken: decrypt(account.pageAccessToken),
  };
}

/**
 * Returns all connected accounts for a given user.
 * Page access tokens are NOT decrypted in list views (no need to expose them).
 */
async function findAllByUserId(userId) {
  const db = getDb();
  const accounts = await db.connectedAccount.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      userId: true,
      pageId: true,
      pageName: true,
      instagramId: true,
      instagramUsername: true,
      connectedAt: true,
      isActive: true,
    },
    orderBy: { connectedAt: "desc" },
  });
  return accounts;
}

/**
 * Upserts (creates or updates) a connected account.
 * Encrypts the page access token before storage.
 */
async function upsert({ userId, pageId, pageName, instagramId, instagramUsername, pageAccessToken }) {
  const db = getDb();
  const encryptedToken = encrypt(pageAccessToken);

  return db.connectedAccount.upsert({
    where: { instagramId },
    create: {
      userId,
      pageId,
      pageName,
      instagramId,
      instagramUsername,
      pageAccessToken: encryptedToken,
    },
    update: {
      pageId,
      pageName,
      instagramUsername,
      pageAccessToken: encryptedToken,
      isActive: true,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      userId: true,
      pageId: true,
      pageName: true,
      instagramId: true,
      instagramUsername: true,
      connectedAt: true,
    },
  });
}

/**
 * Soft-deletes a connected account.
 */
async function deactivate(instagramId) {
  const db = getDb();
  return db.connectedAccount.update({
    where: { instagramId },
    data: { isActive: false },
  });
}

module.exports = { findByInstagramId, findByPageId, findAllByUserId, upsert, deactivate };
