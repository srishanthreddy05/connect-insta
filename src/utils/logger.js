// src/utils/logger.js
"use strict";

const crypto = require("crypto");

function ts() {
  return new Date().toISOString();
}

function makeRequestId() {
  return crypto.randomBytes(5).toString("hex");
}

function maskToken(token) {
  if (!token) return "<empty>";
  if (token.length <= 12) return `${token.slice(0, 2)}***${token.slice(-2)}`;
  return `${token.slice(0, 6)}...${token.slice(-6)}`;
}

function normalizeToken(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").trim();
}

const logger = {
  info(reqId, msg, meta) {
    const prefix = `[${ts()}][${reqId}][INFO]`;
    meta
      ? console.log(`${prefix} ${msg}`, JSON.stringify(meta, null, 2))
      : console.log(`${prefix} ${msg}`);
  },
  warn(reqId, msg, meta) {
    const prefix = `[${ts()}][${reqId}][WARN]`;
    meta
      ? console.warn(`${prefix} ${msg}`, JSON.stringify(meta, null, 2))
      : console.warn(`${prefix} ${msg}`);
  },
  error(reqId, msg, meta) {
    const prefix = `[${ts()}][${reqId}][ERROR]`;
    meta
      ? console.error(`${prefix} ${msg}`, JSON.stringify(meta, null, 2))
      : console.error(`${prefix} ${msg}`);
  },
};

module.exports = { logger, makeRequestId, maskToken, normalizeToken, ts };
