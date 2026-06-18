require('dotenv').config({ path: 'c:/Users/srish/Downloads/ig-automation-v2/backend/.env' });

const mockReplies = [];
const mockDms = [];

function registerInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    console.log("🚀 [INTERCEPTOR RUNNING] Request to:", config.url);
    if (config.url && config.url.includes('/replies')) {
      console.log("🚀 [MOCK] Intercepted Reply to Comment:", config.url, config.data);
      mockReplies.push(config);
      return Promise.reject({
        isMock: true,
        response: { data: { id: `MOCK_REPLY_ID_${Date.now()}` } }
      });
    }
    if (config.url && config.url.includes('/messages')) {
      console.log("🚀 [MOCK] Intercepted Send DM:", config.url, config.data);
      mockDms.push(config);
      return Promise.reject({
        isMock: true,
        response: { data: { message_id: `MOCK_DM_ID_${Date.now()}` } }
      });
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error && error.isMock) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}

// First load webhookService to populate the module cache
const webhookService = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/services/webhook.service');

// Inject interceptors into all cached axios instances (resolving drive letter casing issue)
const axiosKeys = Object.keys(require.cache).filter(k => k.toLowerCase().includes('node_modules\\axios\\'));
console.log("Injecting mock interceptors into cached axios modules:", axiosKeys);
for (const key of axiosKeys) {
  const cachedAxios = require.cache[key].exports;
  if (cachedAxios) {
    if (cachedAxios.interceptors) {
      registerInterceptors(cachedAxios);
    }
    if (cachedAxios.default && cachedAxios.default.interceptors) {
      registerInterceptors(cachedAxios.default);
    }
  }
}

const { getDb } = require('c:/Users/srish/Downloads/ig-automation-v2/backend/src/config/db');

async function runTest() {
  const db = getDb();
  
  // Find a connected account to use
  const account = await db.connectedAccount.findFirst();
  if (!account) {
    console.error("Please connect at least one account in Prisma Studio or app first.");
    return;
  }
  console.log(`Using connected account: ${account.instagramUsername} (${account.instagramId})`);

  // Create temporary automation
  const testAutomation = await db.automation.create({
    data: {
      userId: account.userId,
      instagramId: account.instagramId,
      name: "Test Comment Reply " + Date.now(),
      keywords: ["replytest"],
      matchType: "CONTAINS",
      responseMessage: "This is a test DM response",
      triggerType: "COMMENT",
      applyToAllPosts: true,
      enableCommentReply: true,
      commentReplyMessage: "Check your DM 👇",
      isActive: true,
    }
  });
  console.log(`Created temporary test automation: ${testAutomation.id}`);

  // Construct mock webhook comment payload
  const commentId = `TEST_COMMENT_ID_${Date.now()}`;
  const fakePayload = {
    object: "instagram",
    entry: [
      {
        id: account.instagramId,
        time: Math.floor(Date.now() / 1000),
        changes: [
          {
            field: "comments",
            value: {
              from: { id: "COMMENTER_123", username: "commenter" },
              media: { id: "MEDIA_123", media_product_type: "POST" },
              id: commentId,
              text: "Hello! This is a replytest message",
            },
          },
        ],
      },
    ],
  };

  console.log("Processing mock webhook...");
  await webhookService.processWebhook(fakePayload, "test-req");

  // Wait a bit to ensure database updates are fully committed
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Query automation state again
  const updatedAuto = await db.automation.findUnique({
    where: { id: testAutomation.id }
  });

  console.log("Updated Automation stats:", {
    triggerCount: updatedAuto.triggerCount,
    commentsRepliedCount: updatedAuto.commentsRepliedCount,
    dmsSentCount: updatedAuto.dmsSentCount,
  });

  // Verify
  let success = true;
  if (updatedAuto.triggerCount !== 1) {
    console.error("❌ Failed: triggerCount is not 1");
    success = false;
  }
  if (updatedAuto.commentsRepliedCount !== 1) {
    console.error("❌ Failed: commentsRepliedCount is not 1");
    success = false;
  }
  if (updatedAuto.dmsSentCount !== 1) {
    console.error("❌ Failed: dmsSentCount is not 1");
    success = false;
  }
  if (mockReplies.length !== 1) {
    console.error("❌ Failed: Comment reply API was not called");
    success = false;
  }
  if (mockDms.length !== 1) {
    console.error("❌ Failed: DM API was not called");
    success = false;
  }

  // Cleanup
  await db.sentDm.deleteMany({
    where: { automationId: testAutomation.id }
  });
  await db.webhookEvent.deleteMany({
    where: { eventId: commentId }
  });
  await db.automation.delete({
    where: { id: testAutomation.id }
  });
  console.log("Cleaned up database.");

  if (success) {
    console.log("🎉 SUCCESS: Comment reply webhook orchestration and stats verification passed!");
  } else {
    console.log("❌ FAILURE: Webhook verification failed.");
  }
}

runTest()
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });
