// src/config/firebase-admin.js
"use strict";

const { initializeApp, cert, getApps, getApp } = require("firebase-admin");

/**
 * Returns the firebase-admin instance, initializing it on first call.
 * Reads credentials from environment variables so the service account
 * JSON never needs to be committed to the repo.
 */
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getApp();
}

module.exports = { getFirebaseAdmin };
