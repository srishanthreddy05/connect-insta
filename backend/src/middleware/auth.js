// src/middleware/auth.js
"use strict";

const { getFirebaseAdmin } = require("../config/firebase-admin");

/**
 * Firebase Auth middleware.
 *
 * Expects:  Authorization: Bearer <Firebase ID Token>
 *
 * On success: sets req.userId (Firebase uid) and req.userEmail, then calls next().
 * On failure: 401 Unauthorized.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      error: "unauthorized",
      message: "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
  }

  const idToken = authHeader.slice(7); // strip "Bearer "

  try {
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.userId = decoded.uid;
    req.userEmail = decoded.email || null;
    next();
  } catch (err) {
    console.error("[auth] Token verification failed:", err.code || err.message);
    return res.status(401).json({
      ok: false,
      error: "unauthorized",
      message: "Invalid or expired Firebase token.",
    });
  }
}

module.exports = { requireAuth };
