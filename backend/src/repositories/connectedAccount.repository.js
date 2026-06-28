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
      missingPermissions: true,
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


async function upsertFromIg({ userId, instagramId, instagramUsername, accessToken, tokenExpiresAt, missingPermissions = [] }) {
  const db = getDb();
  return db.connectedAccount.upsert({
    where: { instagramId },
  create: {
  userId,
  instagramId,
  instagramUsername,
  accessToken: encrypt(accessToken),
  tokenExpiresAt: tokenExpiresAt || null,
  missingPermissions,
},
update: {
  userId,
  instagramUsername,
  accessToken: encrypt(accessToken),
  tokenExpiresAt: tokenExpiresAt || null,
  isActive: true,
  missingPermissions,
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

async function deleteById(id, userId) {
  const db = getDb();
  
  // Find the account first to get its instagramId
  const account = await db.connectedAccount.findFirst({
    where: { id, userId }
  });
  if (!account) {
    throw new Error("Account not found");
  }

  const { instagramId } = account;

  // Run in a transaction
  return db.$transaction(async (tx) => {
    // 1. Delete AutomationMessages for automations belonging to this instagramId
    await tx.automationMessage.deleteMany({
      where: {
        automation: {
          instagramId
        }
      }
    });

    // 2. Delete Automations
    await tx.automation.deleteMany({
      where: { instagramId }
    });

    // 3. Delete InstagramMedia
    await tx.instagramMedia.deleteMany({
      where: { instagramId }
    });

    // 4. Delete ConversationStates
    await tx.conversationState.deleteMany({
      where: { instagramId }
    });

    // 5. Delete SentDms
    await tx.sentDm.deleteMany({
      where: { instagramId }
    });

    // 6. Delete ConnectedAccount
    await tx.connectedAccount.delete({
      where: { id }
    });
  });
}

module.exports = { findByInstagramId, findAllByUserId, deactivate, upsertFromIg, deleteById };