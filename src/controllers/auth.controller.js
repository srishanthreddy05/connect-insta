// src/controllers/auth.controller.js
"use strict";

const config = require("../config");
const metaService = require("../services/meta.service");
const connectedAccountRepo = require("../repositories/connectedAccount.repository");
const { logger, maskToken, normalizeToken } = require("../utils/logger");
const REQUIRED_SCOPES = [
  "public_profile",
  "pages_show_list",
  "pages_manage_metadata",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "business_management", // add this
];
/**
 * GET /auth/login
 * Initiates Meta OAuth. In a multi-tenant setup, pass userId as state param
 * so the callback knows which user is connecting.
 */
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
    state: userId, // Pass userId through OAuth so callback can associate the account
  });

  const url = `https://www.facebook.com/${config.meta.graphVersion}/dialog/oauth?${params}`;
  logger.info(reqId, `🔐 Redirecting to Meta OAuth`, { userId, scopes: REQUIRED_SCOPES });
  res.redirect(url);
}

/**
 * GET /auth/callback
 * Meta redirects here after user grants permissions.
 * Discovers all linked Instagram accounts and stores them in DB.
 */
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
    // Exchange code for User Access Token
    const userAccessToken = await metaService.exchangeCodeForToken(code);
    logger.info(reqId, `✅ User access token acquired`, { userId, token: maskToken(userAccessToken) });

    // Verify scopes
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

    // Discover pages and linked Instagram accounts
    const pages = await metaService.fetchUserPages(userAccessToken);
    logger.info(reqId, `📃 Fetched ${pages.length} Facebook pages`, { userId });

    const connectedAccounts = [];
    for (const page of pages) {
      if (!page.instagram_business_account?.id) continue;

      const instagramId = page.instagram_business_account.id;

      // Fetch Instagram username
      let igUsername = null;
      try {
        const igData = await metaService.fetchIgAccount(instagramId, page.access_token);
        igUsername = igData.username || null;
      } catch (e) {
        logger.warn(reqId, `⚠️ Could not fetch IG username for ${instagramId}`, { error: e.message });
      }

      // Store in DB — upsert so reconnecting refreshes the token
      const saved = await connectedAccountRepo.upsert({
        userId,
        pageId: page.id,
        pageName: page.name,
        instagramId,
        instagramUsername: igUsername,
        pageAccessToken: page.access_token, // encrypted at rest by repo layer
      });

      // Subscribe app to this IG account's webhooks
      try {
        await metaService.subscribeAppToIG(instagramId, page.access_token, reqId);
        logger.info(reqId, `📡 Webhook subscription active`, { instagramId, page: page.name });
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

/**
 * GET /connected-accounts
 * Lists all Instagram accounts connected by the authenticated user.
 */
async function listConnectedAccounts(req, res, next) {
  try {
    const accounts = await connectedAccountRepo.findAllByUserId(req.userId);
    res.json({ ok: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, callback, listConnectedAccounts };
