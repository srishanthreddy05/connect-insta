// src/config/firebase-admin.js
"use strict";

const admin = require("firebase-admin");

let initialized = false;

/**
 * Returns the firebase-admin instance, initializing it on first call.
 * Reads credentials from environment variables so the service account
 * JSON never needs to be committed to the repo.
 */
function getFirebaseAdmin() {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Render/Vercel store the key as a single-line string with literal \n
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    initialized = true;
  }
  return admin;
}

module.exports = { getFirebaseAdmin };
