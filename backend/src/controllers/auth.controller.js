// src/controllers/auth.controller.js
"use strict";
const axios = require("axios");

const config = require("../config");
const metaService = require("../services/meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { logger, maskToken } = require("../utils/logger");


async function listConnectedAccounts(req, res, next) {
  try {
    const accounts = await connectedAccountRepo.findAllByUserId(req.userId);
    res.json({ ok: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

function igTokenLogin(req, res) {
  const reqId = req.reqId;
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ ok: false, error: "Missing userId" });
  const url = `https://www.instagram.com/oauth/authorize?force_reauth=true&platform_app_id=${config.meta.igAppId}&redirect_uri=${encodeURIComponent(config.meta.igRedirectUri)}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights&state=${userId}&enable_fb_login=1`;
  logger.info(reqId, `🔐 Redirecting to Instagram Business OAuth`, { userId });
  res.redirect(url);
}
async function igTokenCallback(req, res, next) {
  const reqId = req.reqId;
  const { code, state: userId } = req.query;

  if (!code) return res.status(400).json({ ok: false, error: "Missing code" });
  if (!userId) return res.status(400).json({ ok: false, error: "Missing userId in state" });

  try {
    // Step 1: Short-lived token
    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: config.meta.igAppId,
        client_secret: config.meta.igAppSecret,
        grant_type: "authorization_code",
        redirect_uri: config.meta.igRedirectUri,
        code,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const shortToken = tokenRes.data.access_token;

    // Step 2: Long-lived token (60 days)
    const longRes = await axios.get("https://graph.instagram.com/access_token", {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: config.meta.igAppSecret,
        access_token: shortToken,
      },
    });

    const longToken = longRes.data.access_token;
    const tokenExpiresAt = longRes.data.expires_in
      ? new Date(Date.now() + longRes.data.expires_in * 1000)
      : null;

    // Step 3: Fetch IG username
    // Step 3: Fetch IG username + webhook-compatible ID
    // Step 3: Fetch IG username + webhook-compatible ID
    const igProfile = await axios.get(`https://graph.instagram.com/v25.0/me`, {
      params: { fields: "id,username", access_token: longToken },
    });

    const igUsername = igProfile.data.username;

    const igProfessionalId = igProfile.data.id;

    const account = await connectedAccountRepo.upsertFromIg({
      userId,
      instagramId: igProfessionalId,
      instagramUsername: igUsername,
      accessToken: longToken,
      tokenExpiresAt,
    });

    logger.info(reqId, `✅ IG OAuth complete`, { igProfessionalId, igUsername });

    const frontendUrl = config.meta.frontendUrl;
    try {
      await metaService.subscribeAppToIG(igProfessionalId, longToken, reqId);
      logger.info(reqId, `📡 Webhook subscription active`, { igProfessionalId });
    } catch (e) {

      logger.warn(reqId, `⚠️ Webhook subscription failed (non-fatal)`, { error: e.message });
    }
    res.redirect(`${frontendUrl}?connected=true`);

  } catch (err) {
    logger.error(reqId, `❌ IG token callback failed`, { error: err?.response?.data || err.message });
    next(err);
  }
} module.exports = { listConnectedAccounts, igTokenLogin, igTokenCallback };