"use strict";
const { getDb } = require("../config/db");

async function get(instagramId, recipientId) {
    const db = getDb();
    return db.conversationState.findUnique({
        where: { instagramId_recipientId: { instagramId, recipientId } }
    });
}

async function upsert(instagramId, recipientId, state, flowData = null) {
    const db = getDb();
    return db.conversationState.upsert({
        where: { instagramId_recipientId: { instagramId, recipientId } },
        update: { state, flowData },
        create: { instagramId, recipientId, state, flowData }
    });
}

async function clear(instagramId, recipientId) {
    const db = getDb();
    return db.conversationState.deleteMany({
        where: { instagramId, recipientId }
    });
}

module.exports = { get, upsert, clear };