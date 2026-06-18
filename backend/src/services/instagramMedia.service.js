// src/services/instagramMedia.service.js
"use strict";

const metaService = require("./meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { getDb } = require("../config/db");
const { logger } = require("../utils/logger");

/**
 * Syncs media for an Instagram account from the Graph API to the database.
 * If mediaLastSyncedAt is not stale (last 10 minutes) and force is false, it skips the sync.
 *
 * @param {string} instagramId
 * @param {boolean} force
 * @param {string} reqId
 */
async function syncMediaForAccount(instagramId, force = false, reqId = "sys") {
  const db = getDb();

  // 1. Fetch connected account
  const account = await connectedAccountRepo.findByInstagramId(instagramId);

  if (!account) {
    throw new Error(`Connected account not found for Instagram ID: ${instagramId}`);
  }

  // 2. Check if stale (stale threshold: 10 minutes)
  const STALE_THRESHOLD_MS = 10 * 60 * 1000;
  const isStale =
    !account.mediaLastSyncedAt ||
    Date.now() - new Date(account.mediaLastSyncedAt).getTime() > STALE_THRESHOLD_MS;

  if (!isStale && !force) {
    logger.info(reqId, `⏭️ Instagram media sync skipped (not stale) for ${instagramId}`);
    return;
  }

  logger.info(reqId, `📸 Syncing Instagram media for account ${instagramId}`);

  // 3. Fetch from Graph API
  let mediaItems = [];
  try {
    mediaItems = await metaService.fetchRecentMedia(instagramId, account.accessToken, 50, reqId);
  } catch (error) {
    // Check if OAuth exception / invalid token
    const errorData = error.response?.data?.error;
    if (errorData?.code === 190 || errorData?.type === "OAuthException") {
      logger.warn(reqId, `⚠️ Invalid access token for ${instagramId}. Deactivating account.`, {
        code: errorData.code,
        message: errorData.message,
      });
      await db.connectedAccount.update({
        where: { instagramId },
        data: { isActive: false },
      }).catch((e) => {
        logger.error(reqId, `❌ Failed to deactivate connected account: ${e.message}`);
      });
    }
    throw error;
  }

  // 4. Filter for supported types
  const validMedia = [];
  for (const item of mediaItems) {
    let type = item.media_type;
    if (item.media_product_type === "REELS") {
      type = "REELS";
    }

    if (["IMAGE", "VIDEO", "REELS"].includes(type)) {
      validMedia.push({
        mediaId: item.id,
        instagramId,
        caption: item.caption || null,
        mediaType: type,
        mediaUrl: item.thumbnail_url || item.media_url || null,
        timestamp: new Date(item.timestamp),
      });
    }
  }

  // 5. Upsert to DB in a transaction
  if (validMedia.length > 0) {
    await db.$transaction(
      validMedia.map((m) =>
        db.instagramMedia.upsert({
          where: { mediaId: m.mediaId },
          update: {
            caption: m.caption,
            mediaType: m.mediaType,
            mediaUrl: m.mediaUrl,
            timestamp: m.timestamp,
          },
          create: m,
        })
      )
    );
  }

  // 6. Update mediaLastSyncedAt
  await db.connectedAccount.update({
    where: { instagramId },
    data: { mediaLastSyncedAt: new Date() },
  });

  logger.info(reqId, `✅ Successfully synced ${validMedia.length} media items for ${instagramId}`);
}

module.exports = {
  syncMediaForAccount,
};
