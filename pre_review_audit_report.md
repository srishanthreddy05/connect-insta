# Pre-Review Audit Report: InstaConnect

This report presents a complete pre-review audit of **InstaConnect** before its submission for Meta App Review.

---

## Executive Summary

InstaConnect is a multi-tenant SaaS application built to automate Instagram comment replies and direct messages. The architecture is clean, using a modern tech stack (Next.js, Express, Prisma, PostgreSQL) and has been successfully migrated to a pure **Instagram Login for Business** architecture. However, several critical blockers and risks have been identified that will cause rejection during Meta App Review if not addressed immediately.

| Metric | Score / Percentage | Status |
| :--- | :---: | :--- |
| **Overall Completion** | **85%** | Minor frontend additions needed |
| **Meta Review Readiness** | **60%** | **CRITICAL BLOCKERS FOUND** |
| **Production Readiness** | **85%** | Requires minor rate-limiting & logging polish |
| **Security Score** | **90%** | Webhook verification & token encryption active |
| **UI/UX Score** | **80%** | Premium aesthetics; lacks interactive toasts |
| **Architecture Score** | **95%** | Highly structured, clean repositories/services |
| **Code Quality Score** | **90%** | Strict types, modular logic |

**Final Verdict:** 🟠 **NEEDS SIGNIFICANT WORK (BEFORE SUBMISSION)**

---

## SECTION 1: PROJECT OVERVIEW

* **Project Name:** InstaConnect (also referred to as `ig-automation-v2` in configuration)
* **Purpose:** A multi-tenant SaaS platform that automates lead engagement on Instagram by turning public comments and incoming DMs into automated interactive message flows.
* **Target Users:** Content creators, social media managers, digital agencies, and e-commerce business accounts looking to automate client outreach and funnel comments into direct messages.
* **Business Flow:**
  1. User authenticates with the platform via Google Auth.
  2. User connects their Instagram Professional (Business/Creator) account through the official Instagram Login for Business OAuth dialog.
  3. The system exchanges the authorization code for a long-lived Instagram User Access Token and stores it encrypted at rest.
  4. The system automatically registers the app to receive comment and message webhooks for the user's account.
  5. The user builds comment-to-DM rules or sequential DM automations in the dashboard.
  6. When an Instagram comment or DM is received, Meta webhooks hit the platform, the matching engine processes keywords, and replies/DMs are sent via the Graph API.
* **Architecture Summary:**
  * **Frontend:** Next.js 16 (App Router) using TailwindCSS v4, TypeScript, Lucide React, and Radix/Shadcn-based design elements.
  * **Backend:** Node.js Express server using Prisma ORM.
  * **Database:** PostgreSQL.
  * **Authentication:** Firebase Authentication (Google OAuth) on the client, validated via Firebase Admin ID Token verification in the backend middleware.
  * **Hosting / Storage:** Configured for Render Web Services & Render Managed PostgreSQL. Storing media reference URLs from Meta (no raw image storage needed).
  * **Instagram APIs Used:**
    * OAuth Exchange: `api.instagram.com/oauth/access_token` and `graph.instagram.com/access_token`
    * Profiles: `/me`
    * Subscriptions: `/me/subscribed_apps`
    * Messaging: `/me/messages`
    * Comments: `/{comment-id}/replies`
    * Media: `/me/media` (used for post-specific scoping)
  * **Meta Webhooks:** Subscribes to `comments` and `messages` fields.
  * **Background Jobs:** Webhook controller uses `setImmediate()` to return HTTP 200 immediately to Meta (< 5 seconds) and processes the matching pipeline asynchronously.

---

## SECTION 2: FEATURE INVENTORY

| Feature Area | Specific Feature | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Authentication** | Google Sign-in | ✅ Complete | Firebase client-side popup. |
| | Token Verification | ✅ Complete | Backend guard verifies ID Token on every API request. |
| | Session Expiry | ✅ Complete | Handled by Firebase Client SDK. |
| | Protected Routes | ✅ Complete | Guarded routes redirect unauthenticated users to `/login`. |
| **Instagram Connection** | Connect Account OAuth | ✅ Complete | Redirects to `instagram.com/oauth/authorize`. |
| | Automatic Webhook Registration | ✅ Complete | Subscribes to fields on successful OAuth callback. |
| | Disconnect / Deactivate | 🟡 Partial | Repository logic exists, but no UI button to disconnect accounts. |
| | Resubscribe / Renew | ✅ Complete | Action button triggers re-subscription. |
| | Subscription Diagnostics | ✅ Complete | UI displays subscription verification status from Meta. |
| **Automation Engine** | Comment Triggers | ✅ Complete | Normalizes text, supports exact/contains/starts-with. |
| | Comment Replies | ✅ Complete | Sends a comment reply alongside a direct message. |
| | Post-Specific Scoping | ✅ Complete | Selects specific posts/reels to apply automations to. |
| | DM Triggers | ✅ Complete | Triggers sequential messages when keyword matches in DMs. |
| | Sequential DM Queue | 🟡 Partial | Sends sorted messages, but lacks intervals/delays between sends. |
| | Loop Prevention | ✅ Complete | Uses database `sent_dms` composite unique index to prevent loops. |
| **Analytics** | Dashboard Stats | 🟡 Partial | Shows total metrics; lacks historical charts or date filters. |
| | Automation-level Metrics | ✅ Complete | Displays triggers, comment replies, and DMs sent per rule. |
| **Developer Tools** | Webhook Simulator | ✅ Complete | UI injects fake payloads to test the comment trigger pipeline. |
| | Direct DM Tester | ✅ Complete | Send a test DM to an arbitrary Instagram Scoped User ID. |
| **Website & Info** | Privacy Policy | ✅ Complete | Programmatic HTML endpoint at `/privacy` satisfies Meta requirements. |
| | Terms of Service | ❌ Missing | No terms page exists. |
| | Landing Page | ❌ Missing | `/login` acts as the landing page; is extremely basic. |

---

## SECTION 3: META PERMISSION AUDIT

| Permission Name | Where Requested | Where Used | Implementation Status | Review Blocker? | Action Required |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `instagram_business_basic` | `auth.controller.js` (line 26) | Fetch profile (`/me`) | Correct | No | Keep. Required for basic metadata. |
| `instagram_business_manage_messages` | `auth.controller.js` (line 26) | Send DMs, DM webhooks | Correct | No | Keep. Essential for DM responses. |
| `instagram_business_manage_comments` | `auth.controller.js` (line 26) | Reply to comments, webhooks | Correct | No | Keep. Essential for comment replies. |
| `instagram_business_content_publish` | `auth.controller.js` (line 26) | Nowhere | **Unused** | **YES** | **Remove from OAuth scopes**. Unused scopes cause app rejection. |
| `instagram_business_manage_insights` | `auth.controller.js` (line 26) | Nowhere | **Unused** | **YES** | **Remove from OAuth scopes**. Unused scopes cause app rejection. |

---

## SECTION 4: AUTHENTICATION AUDIT

### Findings
1. **Protected Routes & Guarding:** Implemented correctly. Both Next.js routes and Express routes block requests lacking valid credentials.
2. **Reviewer Access Blocker:** 
   > [!WARNING]
   > The landing/login page strictly enforces Google Sign-In via Firebase. Meta app reviewers will **not** have access to a pre-approved Google Account inside our Firebase project, and standard Google sign-in prompts may trigger security checks (2FA) that reviewers cannot complete.
   > **Impact:** This is a 100% blocker. Reviewers must be given a custom credentials bypass or a demo login bypass (e.g., standard email/password mock login) to test the app.
3. **No Rate Limiting:** There is no rate limiting on the REST API endpoint authentications.

---

## SECTION 5: INSTAGRAM CONNECTION AUDIT

### Findings
1. **Programmatic Subscriptions:** Subscription to `comments` and `messages` webhooks is triggered automatically during OAuth callback via `metaService.subscribeAppToIG()`.
2. **Token Security:** Long-lived page/user tokens are encrypted at rest using AES-256-GCM (`utils/encryption.js`) before DB insertion and decrypted only in memory during API requests.
3. **Missing UI Deactivation:** The `AccountsPage` does not expose a "Disconnect" button to users. Users can only verify subscription status or trigger a resubscription.
   > [!IMPORTANT]
   > Meta reviewers look for direct data-deletion controls. A "Disconnect Account" or "Delete Data" button in the UI is highly recommended.

---

## SECTION 6: AUTOMATION ENGINE & FLOW BUILDER AUDIT

### Findings
1. **Keyword Matching Normalization:** Clean and case-insensitive. Triggers are forced to lowercase and trimmed before DB storage and evaluation.
2. **Post Scoping:** Excellent implementation. The `InstagramMedia` sync fetches Reels and Images, saves them, and validates ownership before letting users scope a rule to them.
3. **Loop & Duplicate Protection:** 
   * Webhook deduplication is durable: `webhook_events` uses a `UNIQUE(eventId)` database constraint. Duplicates are immediately discarded at the database level.
   * DM loop prevention: `sent_dms` implements `UNIQUE(instagramId, recipientId, automationId)` preventing duplicate messages for the same trigger.
4. **Missing DM Delay / Spacing:**
   > [!WARNING]
   > In `sequentialDm.service.js` (lines 63-88), sequential messages are dispatched inside a standard `for` loop using `await metaService.sendDM()`. If an automation has 3 sequential DMs, they are sent back-to-back within milliseconds.
   > **Impact:** This behavior looks highly unnatural, triggers Meta's internal spam/anti-bot systems, and may lead to account suspensions. The system must implement a delay or interval between sequential messages.

---

## SECTION 7: USER EXPERIENCE (UX) AUDIT

1. **Aesthetics:** Highly premium dark mode look with glassmorphic cards, custom animations, custom gradient text/borders, and skeleton loaders.
2. **Toasts / User Feedback:** 
   * Form submissions, keyword additions, and resubscriptions update the DOM state but lack immediate pop-up notification messages (e.g., Shadcn Toast/Sonner).
3. **Empty States:** Well-designed. Dashboard, Events log, and Automations list show empty illustration boxes when no data is loaded.

---

## SECTION 8: SECURITY & ERROR HANDLING AUDIT

1. **Webhook Signature Validation:** Complete. `webhook.controller.js` (lines 51-69) checks `x-hub-signature-256` using the application's secret.
2. **Meta API Error Handling:** Excellent. `errorHandler.js` intercepts Meta Graph API codes:
   * Code `190` -> returns a clean `token_expired` status.
   * Codes `10` or `200` -> returns `missing_permissions`.
   * Codes `4`, `32`, or `613` -> returns `rate_limited`.
3. **Internal Error Safety:** Production mode does not leak stack traces or database errors (handled via generic `internal_error` catch-all in `errorHandler.js`).

---

## SECTION 9: META APP REVIEW REQUIREMENTS & BLOCKERS

This is the most critical checklist for review approval:

- [x] **Public URL & HTTPS:** Yes, configured to run on Render with secure HTTPS connections.
- [x] **Privacy Policy URL:** Yes, a standard privacy page is generated at `GET /privacy`.
- [x] **Meta Webhook Verification:** Yes, verify token validation is active.
- [x] **Meta Signature Verification:** Yes, webhook header signatures are validated.
- [ ] **Unused Permissions Requested:** **BLOCKER.** Scopes `instagram_business_content_publish` and `instagram_business_manage_insights` are requested but never used. Meta will reject the submission if the reviewer notices these scopes are never called.
- [ ] **Reviewer Access (Google Sign-In):** **BLOCKER.** Meta reviewers cannot sign in using a Google OAuth login. An email/password login route or bypass token must be provided.
- [ ] **Missing Terms of Service Page:** **BLOCKER.** Meta requires a terms page link in the developer console.
- [ ] **Disconnect Account UI Control:** **HIGH RISK.** Reviewers expect a visible way to disconnect their account and delete tokens. Currently, this can only be done directly in Meta settings or via DB manipulation.

---

## SECTION 10: SCREEN RECORDING READINESS

To pass Meta App Review, you must submit a screen recording demonstrating each requested permission. Here is the verification plan:

### 1. Permission: `instagram_business_manage_comments`
* **Objective:** Prove the app reads comments and replies to them.
* **Recording Steps:**
  1. Open the InstaConnect dashboard and navigate to "Automations".
  2. Create a "Comment" automation triggering on the keyword `price`, with a comment reply ("Check your DMs!") and a DM response.
  3. Toggle the automation to "Active".
  4. Switch to a test Instagram user account (non-business profile).
  5. Go to the business account's post and comment: *"What is the price?"*.
  6. Record the dashboard's "Events" log showing the incoming webhook comment event.
  7. Show the business account automatically replying to the comment in the Instagram app.
* **Required Screen elements:** `AutomationForm` showing Comment options, `EventsPage` row log, Instagram app UI showing the reply.

### 2. Permission: `instagram_business_manage_messages`
* **Objective:** Prove the app receives and sends direct messages.
* **Recording Steps:**
  1. Navigate to "Automations" and create a "DM" trigger automation matching the keyword `info` with a sequential DM message queue (Opening message + Follow-up 1).
  2. Toggle the automation to "Active".
  3. Switch to a test Instagram user account.
  4. Send a DM to the business page: *"Can I get some info?"*.
  5. Show the business account automatically sending the welcome message and follow-up messages in sequence.
  6. Return to the dashboard and show the trigger statistics incrementing (DMs sent count).
* **Required Screen elements:** `AutomationForm` showing DM message fields, Instagram thread showing the sequence.

---

## SECTION 11: PRODUCTION READINESS

* **Deployment:** Pre-configured for Render. Express script runs migrations (`prisma migrate deploy`) and client builds Next.js assets.
* **Environment Variables Checklist:**
  * `IG_APP_ID`: Required (Meta Developer Console)
  * `IG_APP_SECRET`: Required (Meta Developer Console)
  * `IG_REDIRECT_URI`: Required (callback URL)
  * `WEBHOOK_VERIFY_TOKEN`: Required (verify token)
  * `ADMIN_API_KEY`: Required (guarding internal admin queries)
  * `ENCRYPTION_KEY`: Required (64-character hex key for AES)
  * `DATABASE_URL`: Required (PostgreSQL)
  * `FIREBASE_PROJECT_ID`: Required (Firebase project credentials)
  * `FIREBASE_CLIENT_EMAIL`: Required
  * `FIREBASE_PRIVATE_KEY`: Required
* **Logging:** Structured logging uses request IDs attached to request context for clean debugging.
* **Missing Items:**
  * Rate-limiting on public API endpoints (express-rate-limit).
  * Error tracking/monitoring (e.g., Sentry integration).

---

## SECTION 12: PLACEMENT & RESUME VALUE

* **Architecture Quality:** **9.5/10**. Strict repository pattern, decoupled controller/service layout, and clean token encryption.
* **Code Quality:** **9.0/10**. Correct TypeScript usage, reusable components, and complete input validation.
* **Feature Complexity:** **8.5/10**. Real-time webhook deduplication, token encryption at rest, and sequential message queues are excellent SaaS indicators.
* **Overall Score:** **9.0/10** (A highly complex, production-grade SaaS codebase suitable for portfolio representation).

---

## SECTION 13: ACTION PLAN

### Priority P0 (Critical Meta Review Blockers)
* [ ] **Google Sign-in Bypass:** Implement a local email/password login fallback specifically for Meta App Reviewers, or configure Firebase Auth to support a test account that does not trigger Google verification checks.
* [ ] **Clean OAuth Scopes:** In `auth.controller.js` (line 26), remove `instagram_business_content_publish` and `instagram_business_manage_insights` from the requested scopes.
* [ ] **Terms of Service Page:** Create a static Terms of Service route (e.g., `/terms`) similar to `/privacy`.

### Priority P1 (Important UX/SaaS Features)
* [ ] **Sequential DM Delay:** Introduce an asynchronous delay (e.g., using `setTimeout` or an asynchronous sleep helper) between sequential DM dispatches in `sequentialDm.service.js` to mimic natural human typing speed and avoid Meta anti-spam flags.
* [ ] **Account Disconnect UI:** Add a "Disconnect" button in the `AccountsPage` card UI that deletes the connected account row and its encrypted tokens from the database.
* [ ] **Action Toasts:** Integrate a simple toast notification system (like Shadcn Toast or Sonner) to alert the user when an automation is saved, toggled, deleted, or when an account check completes.

### Priority P2 (Recommended Improvements)
* [ ] **Rate Limiting:** Add `express-rate-limit` middleware on backend routes (especially the webhook controller and authentication gateway).
* [ ] **Enhanced Analytics:** Add basic visual analytics charts (e.g., using recharts) on the main dashboard to represent message flows over time.

### Priority P3 (Future Enhancements)
* [ ] **Visual Flow Builder:** Migrate from a forms-based sequential list editor to a visual flow builder interface (using React Flow) for more complex, branching logic.
