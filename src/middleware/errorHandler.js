// src/middleware/errorHandler.js
"use strict";

const { ts } = require("../utils/logger");

/**
 * Centralized error handler middleware.
 * Catches all errors thrown in route handlers and services.
 * Returns consistent JSON responses.
 */
function errorHandler(err, req, res, _next) {
  const reqId = req.reqId || "unknown";
  const timestamp = ts();

  // ── Graph API / Meta API errors ────────────────────────────────────────────
  if (err.response?.data?.error) {
    const graphErr = err.response.data.error;
    const status = err.response.status || 500;

    console.error(`[${timestamp}][${reqId}][ERROR] Meta Graph API Error`, JSON.stringify(graphErr, null, 2));

    // Token expiry
    if (graphErr.code === 190) {
      return res.status(401).json({
        ok: false,
        error: "token_expired",
        message: "The access token has expired. Re-authenticate via /auth/callback.",
        details: graphErr,
      });
    }

    // Missing permissions
    if (graphErr.code === 10 || graphErr.code === 200) {
      return res.status(403).json({
        ok: false,
        error: "missing_permissions",
        message: "The app lacks required permissions. Check your OAuth scopes.",
        details: graphErr,
      });
    }

    // Rate limit
    if (graphErr.code === 4 || graphErr.code === 32 || graphErr.code === 613) {
      return res.status(429).json({
        ok: false,
        error: "rate_limited",
        message: "Meta API rate limit reached. Retry after a short delay.",
        details: graphErr,
      });
    }

    return res.status(status).json({
      ok: false,
      error: "graph_api_error",
      message: graphErr.message || "A Meta Graph API error occurred.",
      details: graphErr,
    });
  }

  // ── Validation errors ──────────────────────────────────────────────────────
  if (err.name === "ValidationError") {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      message: err.message,
    });
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (err.status === 404) {
    return res.status(404).json({
      ok: false,
      error: "not_found",
      message: err.message || "Resource not found.",
    });
  }

  // ── Token / Auth errors (application-level) ───────────────────────────────
  if (err.message?.includes("Page Access Token")) {
    return res.status(400).json({
      ok: false,
      error: "missing_page_token",
      message: err.message,
    });
  }

  // ── Generic catch-all ─────────────────────────────────────────────────────
  console.error(`[${timestamp}][${reqId}][ERROR] Unhandled error: ${err.message}`, err.stack);

  res.status(500).json({
    ok: false,
    error: "internal_error",
    message: "An unexpected error occurred.",
  });
}

/**
 * Attaches a unique reqId to every request for structured logging.
 */
function attachReqId(req, _res, next) {
  const crypto = require("crypto");
  req.reqId = crypto.randomBytes(5).toString("hex");
  next();
}

module.exports = { errorHandler, attachReqId };
