// src/controllers/auth.controller.js
"use strict";
const axios = require("axios");

const config = require("../config");
const metaService = require("../services/meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { logger, maskToken } = require("../utils/logger");

const REQUIRED_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_manage_metadata",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "business_management",
];

function login(req, res) {
  const reqId = req.reqId;
  const userId = req.query.userId || req.userId;

  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: "Missing userId. Include ?userId= or authenticate first.",
    });
  }

  const params = new URLSearchParams({
    client_id: config.meta.appId,
    redirect_uri: config.meta.redirectUri,
    scope: REQUIRED_SCOPES.join(","),
    response_type: "code",
    state: userId,
  });

  const url = `https://www.facebook.com/${config.meta.graphVersion}/dialog/oauth?${params}`;
  logger.info(reqId, `🔐 Redirecting to Meta OAuth`, { userId, scopes: REQUIRED_SCOPES });
  res.redirect(url);
}

async function callback(req, res, next) {
  const reqId = req.reqId;
  const { code, error: oauthError, error_description, state: userId } = req.query;

  if (oauthError) {
    logger.warn(reqId, `❌ OAuth error: ${oauthError}`, { error_description });
    return res.status(400).json({ ok: false, error: oauthError, description: error_description });
  }

  if (!code) return res.status(400).json({ ok: false, error: "Missing authorization code" });
  if (!userId) return res.status(400).json({ ok: false, error: "Missing userId in state param" });

  try {
    const userAccessToken = await metaService.exchangeCodeForToken(code);
    logger.info(reqId, `✅ User access token acquired`, { userId, token: maskToken(userAccessToken) });

    let debugData = {};
    try {
      debugData = await metaService.debugToken(userAccessToken);
    } catch (e) {
      logger.warn(reqId, `⚠️ Token debug failed (non-fatal)`, { error: e.message });
    }

    const grantedScopes = debugData.scopes || [];
    const missingScopes = REQUIRED_SCOPES.filter((s) => !grantedScopes.includes(s));

    if (missingScopes.length > 0) {
      logger.warn(reqId, `⚠️ Missing OAuth scopes`, { missingScopes });
    }

    const pages = await metaService.fetchUserPages(userAccessToken);
    logger.info(reqId, `📃 Fetched ${pages.length} Facebook pages`, { userId });

    const connectedAccounts = [];

    for (const page of pages) {
      if (!page.instagram_business_account?.id) continue;

      const instagramId = page.instagram_business_account.id;

      let igUsername = null;
      try {
        const igData = await metaService.fetchIgAccount(instagramId, page.access_token);
        igUsername = igData.username || null;
      } catch (e) {
        logger.warn(reqId, `⚠️ Could not fetch IG username for ${instagramId}`, { error: e.message });
      }

      const saved = await connectedAccountRepo.upsert({
        userId,
        pageId: page.id,
        pageName: page.name,
        instagramId,
        instagramUsername: igUsername,
        userAccessToken: userAccessToken,
        pageAccessToken: page.access_token,
      });

      try {
        await metaService.subscribeAppToIG(page.id, instagramId, page.access_token, reqId);
        logger.info(reqId, `📡 Webhook subscription active`, { pageId: page.id, instagramId, page: page.name });
      } catch (e) {
        logger.warn(reqId, `⚠️ Webhook subscription failed for ${instagramId}`, { error: e.message });
      }

      connectedAccounts.push(saved);
    }

    logger.info(reqId, `✅ OAuth complete`, {
      userId,
      accountsConnected: connectedAccounts.length,
    });

    res.json({
      ok: true,
      message: "OAuth complete",
      userId,
      grantedScopes,
      missingScopes,
      connectedAccounts,
    });
  } catch (err) {
    next(err);
  }
}

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

  const params = new URLSearchParams({
    client_id: config.meta.igAppId,
    redirect_uri: config.meta.igRedirectUri,
    scope: [
      "instagram_business_basic",
      "instagram_business_manage_messages",
      "instagram_business_manage_comments",
      "instagram_business_content_publish",
    ].join(","),
    response_type: "code",
    state: userId,
  });

  const url = `https://www.instagram.com/oauth/authorize?${params}`;
  logger.info(reqId, `🔐 Redirecting to Instagram Business OAuth`, { userId });
  res.redirect(url);
}

async function igTokenCallback(req, res, next) {
  const reqId = req.reqId;
  const { code, state: userId } = req.query;

  if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

  try {
    // Step 1: Exchange code for short-lived token
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
    const igUserId = tokenRes.data.user_id;

    logger.info(reqId, `✅ Short-lived IG token acquired`, { igUserId });

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await axios.get("https://graph.instagram.com/access_token", {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: config.meta.igAppSecret,
        access_token: shortToken,
      },
    });

    const longToken = longRes.data.access_token;
    const expiresIn = longRes.data.expires_in;

    logger.info(reqId, `✅ Long-lived IG token acquired`, { igUserId, expiresIn });

    // Step 3: Save to DB as userAccessToken
    await connectedAccountRepo.upsertIgToken({
  userId,
  userAccessToken: longToken,
});

    logger.info(reqId, `✅ IG token saved to DB`, { igUserId });

    res.json({
      ok: true,
      message: "Instagram token saved successfully",
      igUserId,
      expiresIn,
    });

  } catch (err) {
    logger.error(reqId, `❌ IG token callback failed`, { error: err?.response?.data || err.message });
    next(err);
  }
}

module.exports = { login, callback, listConnectedAccounts, igTokenLogin, igTokenCallback };