// src/config/index.js
"use strict";

require("dotenv").config();

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val.trim();
}

function optional(name, fallback = "") {
  return (process.env[name] || fallback).trim();
}

const config = {
  app: {
    port: Number(optional("PORT", "3000")),
    nodeEnv: optional("NODE_ENV", "production"),
    isDev: optional("NODE_ENV", "production") === "development",
  },
  meta: {
    igAppId: required("IG_APP_ID"),
    igAppSecret: required("IG_APP_SECRET"),
    igRedirectUri: required("IG_REDIRECT_URI"),
    webhookVerifyToken: required("WEBHOOK_VERIFY_TOKEN"),
    adminApiKey: required("ADMIN_API_KEY"),   // ADD
    frontendUrl: required("FRONTEND_URL"),
    graphVersion: "v25.0",
    graphBase: `https://graph.instagram.com/v25.0`,
  },
  db: {
    url: required("DATABASE_URL"),
  },
  encryption: {
    // AES-256 key for encrypting stored tokens. Generate with: openssl rand -hex 32
    key: required("ENCRYPTION_KEY"),
  },
};

// ADD after the config object, before module.exports:
const encKey = process.env.ENCRYPTION_KEY || "";
if (encKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(encKey)) {
  throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with: openssl rand -hex 32");
}

module.exports = config;
