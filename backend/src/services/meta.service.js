// src/services/meta.service.js
"use strict";

const axios = require("axios");
const config = require("../config");
const { logger } = require("../utils/logger");



async function subscribeAppToIG(instagramId, accessToken, reqId = "sys") {
  if (!accessToken) throw new Error(`Access token required to subscribe IG account ${instagramId}`);

  logger.info(reqId, "📡 Subscribing app to IG account", { instagramId });

  try {
    const res = await axios.post(
      `https://graph.instagram.com/v25.0/me/subscribed_apps`,
      null,
      {
        params: {
          access_token: accessToken,
          subscribed_fields: "comments,messages",
        },
      }
    );
    logger.info(reqId, "✅ Subscription successful", { instagramId, response: res.data });
    return res.data;
  } catch (error) {
    console.error("META SUBSCRIBE ERROR:", JSON.stringify(error.response?.data, null, 2));
    logger.error(reqId, "❌ Subscription failed", {
      instagramId,
      status: error.response?.status,
      error: error.response?.data || error.message,
    });
    throw error;
  }
}

async function checkSubscription(instagramId, accessToken) {
  const res = await axios.get(`https://graph.instagram.com/v25.0/me/subscribed_apps`, {
    params: { access_token: accessToken },
  });
  return res.data;
}

async function sendDM({ instagramId, accessToken, recipientIgUserId, messageText, reqId = "sys" }) {
  if (!accessToken) throw new Error(`[sendDM] Access token required`);
  if (!instagramId) throw new Error("[sendDM] instagramId is required");
  if (!recipientIgUserId) throw new Error("[sendDM] recipientIgUserId is required");

  logger.info(reqId, `📨 Sending DM`, { fromIgAccount: instagramId, to: recipientIgUserId });

  const res = await axios.post(
    `https://graph.instagram.com/v25.0/me/messages`,
    {
      recipient: { id: recipientIgUserId },
      message: { text: messageText },
    },
    { params: { access_token: accessToken } }
  );

  logger.info(reqId, `✅ DM sent`, { messageId: res.data?.message_id, to: recipientIgUserId });
  return res.data;
}




function parseGraphError(error) {
  return {
    status: error.response?.status || 500,
    details: error.response?.data || { message: error.message || "Unknown error" },
  };
}

module.exports = {
  subscribeAppToIG,
  checkSubscription,
  sendDM,
  parseGraphError,
};