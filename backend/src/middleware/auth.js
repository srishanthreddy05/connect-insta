// src/middleware/auth.js
"use strict";

/**
 * Simple API key auth middleware for admin/dashboard routes.
 *
 * In a full SaaS build, replace this with JWT verification
 * (e.g. Firebase Auth, Auth0, or a custom JWT strategy).
 *
 * Usage:
 *   router.get("/automations", requireAuth, controller.list)
 *
 * For the initial build, the userId is read from the X-User-Id header.
 * Replace with decoded JWT sub claim in production.
 */
const config = require("../config");

function requireAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const userId = req.headers["x-user-id"];

  // In production: verify JWT, extract userId from token claims
  // For now: require both headers
  if (!apiKey || apiKey !== config.meta.adminApiKey) {
    return res.status(401).json({ ok: false, error: "unauthorized", message: "Invalid or missing API key." });
  }

  if (!userId) {
    return res.status(400).json({ ok: false, error: "missing_user_id", message: "X-User-Id header is required." });
  }

  req.userId = userId;
  next();
}

module.exports = { requireAuth };
