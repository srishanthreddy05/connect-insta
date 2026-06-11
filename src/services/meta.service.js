// src/services/meta.service.js
"use strict";

const axios = require("axios");
const config = require("../config");
const { logger } = require("../utils/logger");

const BASE = config.meta.graphBase;

/**
 * Fetches all Facebook Pages the authenticated user manages.
 * Used during OAuth to discover linked Instagram accounts.
 */
// async function fetchUserPages(userAccessToken) {
//   const res = await axios.get(`${BASE}/me/accounts`, {
//     params: {
//       access_token: userAccessToken,
//       fields: "id,name,access_token,instagram_business_account",
//     },
//   });
//   return res.data?.data || [];
// }

/**
 * Fetches basic Instagram account info.
 */
async function fetchIgAccount(instagramId, pageAccessToken) {
  const res = await axios.get(`${BASE}/${instagramId}`, {
    params: {
      access_token: pageAccessToken,
      fields: "id,username,followers_count,media_count,profile_picture_url",
    },
  });
  return res.data;
}

/**
 * Subscribes the app to webhook events for a specific Instagram account.
 * MUST use Page Access Token — never a User token.
 */
/**
 * Subscribes the app to webhook events for a specific Instagram account.
 * MUST use Page Access Token.
 */
async function subscribeAppToIG(instagramId, pageAccessToken, reqId = "sys") {
  if (!pageAccessToken) {
    throw new Error(
      `Page Access Token required to subscribe IG account ${instagramId}`
    );
  }

  logger.info(reqId, "📡 Subscribing app to IG account", {
    instagramId,
  });

  try {
    const res = await axios.post(
      `${BASE}/${instagramId}/subscribed_apps`,
      null,
      {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: "comments,messages,mentions"
        },
      }
    );

    logger.info(reqId, "✅ Subscription successful", {
      instagramId,
      response: res.data,
    });

    return res.data;
  } catch (error) {
    console.error(
      "META SUBSCRIBE ERROR:",
      JSON.stringify(error.response?.data, null, 2)
    );

    throw error;
  }
}
/**
 * Checks webhook subscription status for an IG account.
 */
async function checkSubscription(instagramId, pageAccessToken) {
  const res = await axios.get(`${BASE}/${instagramId}/subscribed_apps`, {
    params: { access_token: pageAccessToken },
  });
  return res.data;
}

/**
 * Sends a Direct Message from an Instagram Business account to a recipient.
 *
 * Security rules enforced here:
 *   1. ONLY Page Access Tokens are accepted — never user tokens.
 *   2. Token must be explicitly provided — no fallbacks, no globals.
 *   3. Both instagramId and recipientId must be present.
 *
 * @param {string} instagramId        - The IG Business account sending the message
 * @param {string} pageAccessToken    - The Page Access Token for this account (decrypted)
 * @param {string} recipientIgUserId  - The commenter's IG user ID
 * @param {string} messageText        - The DM body
 * @param {string} reqId              - Request ID for logging
 */
async function sendDM({ instagramId, pageAccessToken, recipientIgUserId, messageText, reqId = "sys" }) {
  // Strict token validation — no fallbacks
  if (!pageAccessToken) {
    throw new Error(
      `[sendDM] Page Access Token is required for IG account ${instagramId}. ` +
        `Never fall back to a User Access Token for DM sending.`
    );
  }
  if (!instagramId) throw new Error("[sendDM] instagramId is required");
  if (!recipientIgUserId) throw new Error("[sendDM] recipientIgUserId is required");

  logger.info(reqId, `📨 Sending DM`, {
    fromIgAccount: instagramId,
    to: recipientIgUserId,
  });

  const res = await axios.post(
    `${BASE}/${instagramId}/messages`,
    {
      recipient: { id: recipientIgUserId },
      message: { text: messageText },
    },
    { params: { access_token: pageAccessToken } }
  );

  logger.info(reqId, `✅ DM sent`, { messageId: res.data?.message_id, to: recipientIgUserId });
  return res.data;
}

/**
 * Debugs a token to verify scopes and expiry.
 * Uses App Access Token (appId|appSecret) as the access token.
 */
async function debugToken(inputToken) {
  const appToken = `${config.meta.appId}|${config.meta.appSecret}`;
  const res = await axios.get(`${BASE}/debug_token`, {
    params: { input_token: inputToken, access_token: appToken },
  });
  return res.data?.data || {};
}

/**
 * Exchanges an OAuth code for a User Access Token.
 */
async function exchangeCodeForToken(code) {
  const res = await axios.get(`${BASE}/oauth/access_token`, {
    params: {
      client_id: config.meta.appId,
      client_secret: config.meta.appSecret,
      redirect_uri: config.meta.redirectUri,
      code,
    },
  });
  const token = (res.data?.access_token || "").replace(/\s+/g, "").trim();
  if (!token) throw new Error("Empty access token in exchange response");
  return token;
}

/**
 * Parses a Graph API error into a consistent shape.
 */
function parseGraphError(error) {
  return {
    status: error.response?.status || 500,
    details: error.response?.data || { message: error.message || "Unknown error" },
  };
}
async function fetchUserPages(userAccessToken) {
  // First try standard personal pages
  const res = await axios.get(`${BASE}/me/accounts`, {
    params: {
      access_token: userAccessToken,
      fields: "id,name,access_token,instagram_business_account",
    },
  });
  
  let pages = res.data?.data || [];

  // If no pages found, check business portfolios
  if (pages.length === 0) {
    const bizRes = await axios.get(`${BASE}/me/businesses`, {
      params: { access_token: userAccessToken, fields: "id" },
    });

    const businesses = bizRes.data?.data || [];

    for (const biz of businesses) {
      const ownedRes = await axios.get(`${BASE}/${biz.id}/owned_pages`, {
        params: {
          access_token: userAccessToken,
          fields: "id,name,access_token,instagram_business_account",
        },
      });
      pages = pages.concat(ownedRes.data?.data || []);
    }
  }

  return pages;
}

module.exports = {
  fetchUserPages,
  fetchIgAccount,
  subscribeAppToIG,
  checkSubscription,
  sendDM,
  debugToken,
  exchangeCodeForToken,
  parseGraphError,
};
