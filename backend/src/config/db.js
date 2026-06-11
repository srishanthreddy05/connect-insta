// src/config/db.js
"use strict";

const { PrismaClient } = require("@prisma/client");

let prisma;

function getDb() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
    });
  }
  return prisma;
}

module.exports = { getDb };
