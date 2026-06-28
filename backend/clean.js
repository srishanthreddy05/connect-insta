const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function clean() {
    try {
        console.log('Clearing database tables...');
        
        await db.sentDm.deleteMany();
        console.log('- Cleared SentDms');
        
        await db.webhookEvent.deleteMany();
        console.log('- Cleared WebhookEvents');
        
        await db.conversationState.deleteMany();
        console.log('- Cleared ConversationStates');
        
        await db.automationMessage.deleteMany();
        console.log('- Cleared AutomationMessages');
        
        await db.instagramMedia.deleteMany();
        console.log('- Cleared InstagramMedia');
        
        await db.automation.deleteMany();
        console.log('- Cleared Automations');
        
        await db.connectedAccount.deleteMany();
        console.log('- Cleared ConnectedAccounts');
        
        console.log('All database tables cleared successfully!');
    } catch (err) {
        console.error('Error clearing database:', err);
    } finally {
        await db.$disconnect();
        process.exit(0);
    }
}

clean();