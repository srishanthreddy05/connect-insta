const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function clean() {
    await db.sentDm.deleteMany();
    await db.webhookEvent.deleteMany();
    console.log('SentDms and WebhookEvents cleared!');
    process.exit(0);
}

clean();