# Instagram Automation Backend — Production Architecture Guide

## Folder Structure

```
ig-automation/
├── prisma/
│   └── schema.prisma          # All table definitions
├── src/
│   ├── app.js                 # Express setup + server startup
│   ├── config/
│   │   ├── index.js           # All env vars, validated at startup
│   │   └── db.js              # Prisma client singleton
│   ├── controllers/           # HTTP layer only — no business logic
│   │   ├── webhook.controller.js
│   │   ├── auth.controller.js
│   │   ├── automation.controller.js
│   │   └── admin.controller.js
│   ├── services/              # Business logic
│   │   ├── meta.service.js    # All Meta Graph API calls
│   │   ├── automation.service.js  # Keyword matching engine
│   │   └── webhook.service.js # Event processing pipeline
│   ├── repositories/          # Database access layer
│   │   ├── connectedAccount.repository.js
│   │   ├── automation.repository.js
│   │   ├── webhookEvent.repository.js
│   │   └── sentDm.repository.js
│   ├── middleware/
│   │   ├── errorHandler.js    # Centralized error handling + reqId attachment
│   │   └── auth.js            # API key / JWT auth guard
│   ├── routes/
│   │   └── index.js           # All route definitions in one place
│   └── utils/
│       ├── logger.js          # Structured logging helpers
│       └── encryption.js      # AES-256-GCM token encryption/decryption
├── .env.example
├── .gitignore
└── package.json
```

---

## Database Schema Summary

| Table              | Purpose                                              |
|--------------------|------------------------------------------------------|
| `users`            | One row per SaaS customer                            |
| `connected_accounts` | One row per Facebook Page / IG account pair        |
| `automations`      | Keyword → response message rules per IG account      |
| `webhook_events`   | Durable deduplication + audit log of all events      |
| `sent_dms`         | Prevents duplicate DMs per automation+recipient pair |

---

## What Changed From v1 — Migration Checklist

### 1. Remove hardcoded `IG_ACCOUNT_ID`
**Before:** `const IG_ACCOUNT_ID = "17841480751343729"`

**After:** Every webhook event carries `entry[].id` = the IG account ID.
`webhook.service.js` reads this and looks up the matching `ConnectedAccount` row.
Zero hardcoded IDs anywhere.

**Migration step:** Run OAuth for each business account via
`GET /auth/login?userId=<your_user_id>` — the callback auto-saves their
page token and subscribes their IG account.

---

### 2. Replace hardcoded `if (lower.includes("price"))`
**Before:** Single keyword, single response, hardcoded in source.

**After:** `automations` table. Each row has `keywords[]`, `matchType`, and `responseMessage`.
`automation.service.js` loads all active automations for the IG account and
tests each one with `matchesKeyword()`.

**Migration step:** Insert your old keyword rules as automation rows:
```json
POST /automations
{
  "instagramId": "17841480751343729",
  "name": "Price enquiry",
  "keywords": ["price", "pricing", "cost"],
  "matchType": "CONTAINS",
  "responseMessage": "Hey! Here are our pricing details — [link]"
}
```

---

### 3. Fix DM token architecture
**Before:** `const token = pageAccessToken || userAccessToken` — silently falls back.

**After:** `meta.service.sendDM()` requires `pageAccessToken` as an explicit parameter.
If it's missing, it throws `"Page Access Token is required for IG account X"`.
No global variables. No fallbacks.

The `ConnectedAccount` row stores the page token encrypted. The webhook pipeline
decrypts it and passes it explicitly to `sendDM()`.

---

### 4. Token encryption at rest
**New:** `src/utils/encryption.js` — AES-256-GCM.
All page access tokens are encrypted before INSERT and decrypted on SELECT.
Set `ENCRYPTION_KEY` env var (generate: `openssl rand -hex 32`).

---

### 5. Durable deduplication
**Before:** In-memory `Set` with 5-min TTL — loses state on restart, doesn't scale.

**After:** `webhook_events` table with `UNIQUE(eventId)`. Duplicate insert fails
with Prisma P2002, which is caught and treated as "already processed".
Works across multiple instances and survives restarts.

`sent_dms` table with `UNIQUE(instagramId, recipientId, automationId)` prevents
the same person receiving the same DM twice for the same automation.

---

### 6. Async webhook pipeline
**Before:** HTTP handler mixed with business logic.

**After:**
```
POST /webhook (controller)
  → HTTP 200 immediately
  → setImmediate() → webhook.service.processWebhook()
      → webhookEvent.repository.createIfNew()   (dedup)
      → connectedAccount.repository.findByInstagramId()
      → automation.service.findMatchingAutomation()
      → sentDm.repository.recordIfNew()          (dedup)
      → meta.service.sendDM()
      → webhookEvent.repository.markProcessed()
```

---

## Dashboard API Reference

All routes below require headers:
```
X-Api-Key: <ADMIN_API_KEY>
X-User-Id: <userId>
```

### Automations
| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | /automations          | List all automations     |
| POST   | /automations          | Create automation        |
| PUT    | /automations/:id      | Update automation        |
| DELETE | /automations/:id      | Delete automation        |

### Accounts
| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| GET    | /connected-accounts   | List connected IG accounts |
| GET    | /auth/login?userId=   | Start OAuth flow         |

### Admin / Debug
| Method | Path                                    | Description              |
|--------|-----------------------------------------|--------------------------|
| GET    | /admin/webhook-events                   | Recent events log        |
| POST   | /admin/test-webhook                     | Simulate a comment       |
| POST   | /admin/test-dm                          | Send a test DM           |
| GET    | /admin/subscribe/:instagramId           | Re-subscribe webhooks    |
| GET    | /admin/check-subscription/:instagramId  | Check subscription       |

---

## Keyword Matching Examples

| matchType    | keyword   | Comment text          | Matches? |
|--------------|-----------|-----------------------|----------|
| CONTAINS     | price     | "What's the price?"   | ✅       |
| CONTAINS     | price     | "PRICE PLS"           | ✅       |
| CONTAINS     | price     | "  PRICE  "           | ✅       |
| EXACT        | price     | "price"               | ✅       |
| EXACT        | price     | "what is the price"   | ❌       |
| STARTS_WITH  | book      | "book an appointment" | ✅       |
| STARTS_WITH  | book      | "I want to book"      | ❌       |

Multiple keywords are OR'd:
```json
"keywords": ["price", "pricing", "cost", "how much"]
```
Any single match triggers the automation.

---

## Firestore Alternative

If you prefer Firestore over PostgreSQL, replace the repository layer.
Each repository file maps to a Firestore collection:

```
users/              → users collection
connected_accounts/ → connectedAccounts collection
automations/        → automations collection
webhook_events/     → webhookEvents collection
sent_dms/          → sentDms collection
```

For deduplication in Firestore, use a transaction:
```javascript
// webhookEvent.repository.js (Firestore version)
async function createIfNew({ eventId, ...data }) {
  const docRef = db.collection("webhookEvents").doc(eventId);
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists) throw new Error("DUPLICATE");
      tx.set(docRef, { ...data, createdAt: new Date() });
    });
    return { created: true };
  } catch (err) {
    if (err.message === "DUPLICATE") return { created: false };
    throw err;
  }
}
```

---

## Render Deployment

### Services to create
1. **Web Service** — your Node.js app
   - Build command: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start command: `node src/app.js`
   - Health check path: `/health`

2. **PostgreSQL** — Render managed database
   - Copy Internal Connection String → set as `DATABASE_URL` env var

### Environment variables on Render
```
APP_ID                  (from Meta Developer Console)
APP_SECRET              (from Meta Developer Console)
REDIRECT_URI            https://your-service.onrender.com/auth/callback
WEBHOOK_VERIFY_TOKEN    (random string — must match Meta dashboard setting)
DATABASE_URL            (from Render PostgreSQL)
ENCRYPTION_KEY          (openssl rand -hex 32)
ADMIN_API_KEY           (random string for protecting dashboard routes)
NODE_ENV                production
```

### Meta Developer Console settings
- Valid OAuth Redirect URIs: `https://your-service.onrender.com/auth/callback`
- Webhook URL: `https://your-service.onrender.com/webhook`
- Webhook Verify Token: same value as `WEBHOOK_VERIFY_TOKEN` env var
- Subscribe to: `comments`, `messages`, `mentions`

---

## Security Checklist

- [x] No hardcoded tokens, IDs, or keywords anywhere
- [x] Page access tokens encrypted at rest (AES-256-GCM)
- [x] `sendDM()` strictly requires Page Access Token — no fallbacks
- [x] Webhook deduplication is durable (DB-level, not in-memory)
- [x] Duplicate DM protection at DB level
- [x] All routes except `/webhook` and `/auth/*` are auth-gated
- [x] Consistent error responses — no stack traces in production
- [x] reqId on every log line for request tracing
- [ ] TODO: Rotate encryption key annually (re-encrypt tokens on rotation)
- [ ] TODO: Add JWT auth (replace API key header with signed tokens)
- [ ] TODO: Rate limit `/webhook` endpoint (express-rate-limit)
- [ ] TODO: Verify Meta webhook signature (X-Hub-Signature-256 header)

### Add webhook signature verification (recommended)
```javascript
// In webhook.controller.js — add before res.status(200).send()
function verifySignature(req) {
  const sig = req.headers["x-hub-signature-256"];
  if (!sig) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", config.meta.appSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

---

## Production Roadmap

### Phase 1 — Foundation (this refactor) ✅
- Multi-tenant connected accounts
- Database-driven automations
- Durable deduplication
- Proper token architecture
- Dashboard APIs

### Phase 2 — Reliability
- Webhook signature verification
- Retry queue for failed DMs (use BullMQ or Render Cron)
- Token refresh alerts (warn when page token nears expiry)
- Structured logging → Logtail / Papertrail

### Phase 3 — SaaS Features
- JWT authentication (Firebase Auth or Auth0)
- Per-tenant usage limits
- Automation analytics (DMs sent, triggers fired)
- Frontend dashboard (Next.js)

### Phase 4 — Scale
- Redis for hot-path deduplication cache
- Horizontal scaling (stateless — all state in DB)
- Read replicas for analytics queries
