"use strict";

const { getDb } = require("../config/db");
const { encrypt, decrypt } = require("../utils/encryption");

async function findByInstagramId(instagramId) {
  const db = getDb();
  const account = await db.connectedAccount.findUnique({
    where: { instagramId },
  });
  if (!account) return null;
  return {
    ...account,
    pageAccessToken: decrypt(account.pageAccessToken),
    userAccessToken: account.userAccessToken ? decrypt(account.userAccessToken) : null,
  };
}
async function upsertIgToken({ instagramId, userAccessToken }) {
  const db = getDb();
  return db.connectedAccount.update({
    where: { instagramId },
    data: {
      userAccessToken: encrypt(userAccessToken),
      updatedAt: new Date(),
    },
  });
}


async function findByPageId(pageId) {
  const db = getDb();
  const account = await db.connectedAccount.findUnique({
    where: { pageId },
  });
  if (!account) return null;
  return {
    ...account,
    pageAccessToken: decrypt(account.pageAccessToken),
    userAccessToken: account.userAccessToken ? decrypt(account.userAccessToken) : null,
  };
}

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

async function upsert({ userId, pageId, pageName, instagramId, instagramUsername, pageAccessToken, userAccessToken }) {
  const db = getDb();
  const encryptedPageToken = encrypt(pageAccessToken);
  const encryptedUserToken = userAccessToken ? encrypt(userAccessToken) : null;

  return db.connectedAccount.upsert({
    where: { instagramId },
    create: {
      userId,
      pageId,
      pageName,
      instagramId,
      instagramUsername,
      pageAccessToken: encryptedPageToken,
      userAccessToken: encryptedUserToken,
    },
    update: {
      pageId,
      pageName,
      instagramUsername,
      pageAccessToken: encryptedPageToken,
      userAccessToken: encryptedUserToken,
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

async function deactivate(instagramId) {
  const db = getDb();
  return db.connectedAccount.update({
    where: { instagramId },
    data: { isActive: false },
  });
}

module.exports = { findByInstagramId, findByPageId, findAllByUserId, upsert, deactivate, upsertIgToken };