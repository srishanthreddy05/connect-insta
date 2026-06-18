// backend/scratch/test-sequential-dm.js
require('dotenv').config({ path: 'c:/Users/srish/Downloads/ig-automation-v2/backend/.env' });
const { getDb } = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/config/db');
const connectedAccountRepo = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/repositories/connectedAccount.repository');
const automationRepo = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/repositories/automation.repository');
const webhookEventRepo = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/repositories/webhookEvent.repository');
const sentDmRepo = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/repositories/sentDm.repository');
const { processWebhook } = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/services/webhook.service');
const metaService = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/services/meta.service');

const sentMessages = [];

// 1. Stub the Meta Send DM service
metaService.sendDM = async function({ instagramId, accessToken, recipientIgUserId, messageText, reqId }) {
  if (messageText.includes("FAIL_NOW")) {
    console.log(`[MOCK sendDM] Intentionally failing delivery for: "${messageText}"`);
    throw new Error("Mocked graph API delivery error");
  }
  console.log(`[MOCK sendDM] Successfully sent DM to ${recipientIgUserId}: "${messageText}"`);
  sentMessages.push({ recipientIgUserId, messageText });
  return { message_id: `mock_mid_${Date.now()}_${Math.floor(Math.random() * 1000)}` };
};

async function runTest() {
  const db = getDb();
  console.log("🚀 Starting Sequential DM Integration Test...");

  const testIgId = "test-ig-id-123";
  const recipientIgId = "recipient-user-999";

  // Cleanup any left-overs
  await db.webhookEvent.deleteMany({ where: { instagramId: testIgId } }).catch(() => {});
  await db.sentDm.deleteMany({ where: { instagramId: testIgId } }).catch(() => {});
  await db.automationMessage.deleteMany({ where: { automation: { instagramId: testIgId } } }).catch(() => {});
  await db.automation.deleteMany({ where: { instagramId: testIgId } }).catch(() => {});
  await db.connectedAccount.deleteMany({ where: { instagramId: testIgId } }).catch(() => {});

  // 2. Setup mock connected account
  console.log("🔌 Creating mock connected account...");
  const account = await connectedAccountRepo.upsertFromIg({
    userId: "test-user-id",
    instagramId: testIgId,
    instagramUsername: "test_bot_user",
    accessToken: "mock-access-token-12345",
  });

  // 3. Create a test DM Automation with sequential messages
  console.log("📝 Creating sequential DM automation...");
  const automation = await automationRepo.create({
    userId: "test-user-id",
    instagramId: testIgId,
    name: "Sequential Test Automation",
    keywords: ["promo", "discount"],
    matchType: "CONTAINS",
    responseMessage: "", // not used for DM triggers
    triggerType: "DM",
    openingMessage: "Hello! Here is your requested promo details 🎁",
    messages: [
      "Step 1: Check your account dashboard.",
      "Step 2: Enter code 'FAIL_NOW_BUT_CONTINUE' to test error handling.",
      "Step 3: Enjoy your 20% discount!"
    ]
  });
  console.log("Created Automation ID:", automation.id);
  console.log("Sequential Messages in DB:", automation.messages);

  // 4. Verify DB storage and relations are correct
  const fetched = await automationRepo.findById(automation.id);
  if (!fetched || fetched.openingMessage !== "Hello! Here is your requested promo details 🎁" || fetched.messages.length !== 3) {
    throw new Error("❌ DB verification failed: properties or message relation list count is wrong!");
  }
  console.log("✅ Database storage and structure verified successfully!");

  // 5. Construct a mock webhook body containing a matching keyword message
  const webhookBody = {
    object: "instagram",
    entry: [
      {
        id: testIgId,
        messaging: [
          {
            sender: { id: recipientIgId },
            recipient: { id: testIgId },
            timestamp: Date.now(),
            message: {
              mid: "mid.test_message_1001",
              text: "Hey, can I get the promo code?"
            }
          }
        ]
      }
    ]
  };

  // 6. Process the webhook
  console.log("📥 Simulating incoming matching DM webhook...");
  await processWebhook(webhookBody, "test-req-123");

  // 7. Assertions on messages sent
  console.log("📊 Sent messages captured:", sentMessages);
  
  if (sentMessages.length !== 3) {
    throw new Error(`❌ Test failed: expected 3 messages to be successfully sent, but got ${sentMessages.length}`);
  }

  if (sentMessages[0].messageText !== "Hello! Here is your requested promo details 🎁") {
    throw new Error("❌ Test failed: message 1 is not the opening message");
  }

  if (sentMessages[1].messageText !== "Step 1: Check your account dashboard.") {
    throw new Error("❌ Test failed: message 2 is out of order");
  }

  if (sentMessages[2].messageText !== "Step 3: Enjoy your 20% discount!") {
    throw new Error("❌ Test failed: message 4 was not sent or is out of order (message 3 failed delivery but flow should continue)");
  }

  console.log("✅ Integration execution flow, message sequence order, and error recovery all verified successfully!");

  // 8. Try processing the webhook event again to verify loop prevention/deduplication
  sentMessages.length = 0; // Clear the array
  console.log("📥 Simulating same webhook duplicate processing...");
  await processWebhook(webhookBody, "test-req-123-dup");
  if (sentMessages.length > 0) {
    throw new Error("❌ Test failed: duplicate webhook processing sent messages again!");
  }
  console.log("✅ Loop prevention and event deduplication verified successfully!");

  // 9. Clean up DB records
  console.log("🧹 Cleaning up database records...");
  await db.webhookEvent.deleteMany({ where: { instagramId: testIgId } });
  await db.sentDm.deleteMany({ where: { instagramId: testIgId } });
  await db.automationMessage.deleteMany({
    where: {
      automation: {
        instagramId: testIgId
      }
    }
  });
  await db.automation.deleteMany({ where: { instagramId: testIgId } });
  await db.connectedAccount.deleteMany({ where: { instagramId: testIgId } });
  console.log("🎉 All integration checks passed!");
}

runTest()
  .catch((err) => {
    console.error("❌ Test script failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
