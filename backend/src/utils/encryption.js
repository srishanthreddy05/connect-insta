// src/utils/encryption.js
"use strict";

const crypto = require("crypto");
const config = require("../config");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string (e.g. page access token) for safe DB storage.
 * Returns a base64-encoded string: iv:authTag:ciphertext
 */
function encrypt(plaintext) {
  if (!plaintext) return "";
  const key = Buffer.from(config.encryption.key, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

/**
 * Decrypts a stored token back to plaintext.
 */
function decrypt(stored) {
  if (!stored) return "";
  
  // If not in encrypted format, return as-is (raw token)
  const parts = stored.split(":");
  if (parts.length !== 3) return stored;

  const [ivHex, tagHex, cipherHex] = parts;
  const key = Buffer.from(config.encryption.key, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext, "binary", "utf8") + decipher.final("utf8");
}

module.exports = { encrypt, decrypt };
