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
    accessToken: decrypt(account.accessToken),
  };
}





async function findAllByUserId(userId) {
  const db = getDb();
  return db.connectedAccount.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      userId: true,
      instagramId: true,
      instagramUsername: true,
      connectedAt: true,
      isActive: true,
    },
    orderBy: { connectedAt: "desc" },
  });
}



async function deactivate(instagramId) {
  const db = getDb();
  return db.connectedAccount.update({
    where: { instagramId },
    data: { isActive: false },
  });
}


async function upsertFromIg({ userId, instagramId, instagramUsername, accessToken, tokenExpiresAt }) {
  const db = getDb();
  return db.connectedAccount.upsert({
    where: { instagramId },
  create: {
  userId,
  instagramId,
  instagramUsername,
  accessToken: encrypt(accessToken),
  tokenExpiresAt: tokenExpiresAt || null,
},
update: {
  userId,
  instagramUsername,
  accessToken: encrypt(accessToken),
  tokenExpiresAt: tokenExpiresAt || null,
  isActive: true,
  updatedAt: new Date(),
},
    select: {
      id: true,
      userId: true,
      instagramId: true,
      instagramUsername: true,
      connectedAt: true,
    },
  });
}

module.exports = { findByInstagramId, findAllByUserId, deactivate, upsertFromIg };