// src/services/meta.service.js
"use strict";

const axios = require("axios");
const config = require("../config");
const { logger } = require("../utils/logger");

const BASE = config.meta.graphBase;

async function fetchIgAccount(instagramId, pageAccessToken) {
  const res = await axios.get(`${BASE}/${instagramId}`, {
    params: {
      access_token: pageAccessToken,
      fields: "id,username,followers_count,media_count,profile_picture_url",
    },
  });
  return res.data;
}

async function subscribeAppToIG(pageId, instagramId, pageAccessToken, reqId = "sys") {
  if (!pageAccessToken) {
    throw new Error(`Page Access Token required to subscribe IG account ${instagramId}`);
  }
  if (!pageId) {
    throw new Error(`Page ID required to subscribe IG account ${instagramId}`);
  }

  logger.info(reqId, "📡 Subscribing app to IG account", { pageId, instagramId });

  try {
    const res = await axios.post(
      `${BASE}/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: "comments,messages,mentions",
        },
      }
    );

    logger.info(reqId, "✅ Subscription successful", {
      pageId,
      instagramId,
      response: res.data,
    });

    return res.data;
  } catch (error) {
    console.error("META SUBSCRIBE ERROR:", JSON.stringify(error.response?.data, null, 2));
    logger.error(reqId, "❌ Subscription failed", {
      pageId,
      instagramId,
      status: error.response?.status,
      error: error.response?.data || error.message,
    });
    throw error;
  }
}

async function checkSubscription(pageId, pageAccessToken) {
  const res = await axios.get(`${BASE}/${pageId}/subscribed_apps`, {
    params: { access_token: pageAccessToken },
  });
  return res.data;
}

async function sendDM({ instagramId, pageAccessToken, recipientIgUserId, messageText, reqId = "sys" }) {
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

async function debugToken(inputToken) {
  const appToken = `${config.meta.appId}|${config.meta.appSecret}`;
  const res = await axios.get(`${BASE}/debug_token`, {
    params: { input_token: inputToken, access_token: appToken },
  });
  return res.data?.data || {};
}

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

function parseGraphError(error) {
  return {
    status: error.response?.status || 500,
    details: error.response?.data || { message: error.message || "Unknown error" },
  };
}

async function fetchUserPages(userAccessToken) {
  const res = await axios.get(`${BASE}/me/accounts`, {
    params: {
      access_token: userAccessToken,
      fields: "id,name,access_token,instagram_business_account",
    },
  });

  let pages = res.data?.data || [];

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