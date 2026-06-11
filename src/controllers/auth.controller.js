// src/controllers/auth.controller.js
"use strict";

const config = require("../config");
const metaService = require("../services/meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { logger, maskToken } = require("../utils/logger");

const REQUIRED_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_manage_metadata",
  "pages_messaging",          // ✅ add this
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
        pageAccessToken: page.access_token,
      });

      // ✅ Fix: pass page.id as first argument, not instagramId
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

module.exports = { login, callback, listConnectedAccounts };