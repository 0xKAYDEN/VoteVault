# VoteVault — Pre-Deployment Analysis
**Date:** May 2026 | **Status:** Final review before production deployment

---

## 1. Critical Blockers

These MUST be fixed before going live.

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | `NODE_ENV=development` in `.env` — must be `production` on server | `.env` | CRITICAL |
| 2 | `DB_PASSWORD=12345678` — weak root password, must be changed | `.env` | CRITICAL |
| 3 | `FRONTEND_URL=http://localhost:8080` — must be real domain | `.env` | CRITICAL |
| 4 | `BEP20_WALLET=0xYourBEP20WalletAddressHere` — placeholder not replaced | `.env` | CRITICAL |
| 5 | `TRONSCAN_API_KEY` not set — auto-verify falls back to manual review silently | `.env` | CRITICAL |
| 6 | reCAPTCHA v2 site key fallback in `Auth.tsx` is the Google test key (accepts everything) | `Auth.tsx:15` | CRITICAL |
| 7 | `RECAPTCHA_V2_SECRET_KEY` in `.env` is the test key — must be production key | `.env` | CRITICAL |
| 8 | `JWT_SECRET` is committed to the repo — rotate before deploy | `.env` | CRITICAL |
| 9 | Contact form does not send emails — just shows a success toast | `Contact.tsx` | CRITICAL |
| 10 | `GOOGLE_CLIENT_ID` not set — Google OAuth will fail silently | `.env` | HIGH |
| 11 | `test_write_permission.txt` committed to repo root — remove it | `/` | MEDIUM |
| 12 | `server/Redis-x64-5.0.14.1/` binary files committed — remove from repo | `/server` | MEDIUM |

---

## 2. Security Issues

| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | Cookie `SameSite: strict` breaks Google OAuth redirects | `authController.js` | Change to `SameSite: lax` |
| 2 | No CSRF protection beyond SameSite cookie | `index.js` | Add double-submit cookie or csurf |
| 3 | `reconnect: true` in DB config is not a valid mysql2 option (silently ignored) | `db.js` | Remove it |
| 4 | Admin routes have no rate limiting | `adminRoutes.js` | Add rate limiter |
| 5 | File upload has no file type whitelist | `uploadRoutes.js` | Add MIME type + extension whitelist |
| 6 | `console.error` still used in several controllers — leaks stack traces in prod | Multiple | Replace with `logger.error` |
| 7 | Morgan `combined` format logs full URLs including query strings | `index.js` | Switch to `short` format |
| 8 | BEP20 payment auto-verify not implemented — always goes to manual review | `paymentController.js` | Implement BSCScan API |
| 9 | `paymentController.js` reads `VITE_USDT_WALLET` (frontend var) on the backend | `paymentController.js:57` | Use `process.env.USDT_WALLET` only |
| 10 | Socket.io cookie parsing uses naive string split — breaks if value contains `=` | `socket.js` | Use proper cookie parser |

---

## 3. Subscription Plans — Enforcement Audit

### 3.1 User Premium Features

| Feature | Advertised | Enforced | Notes |
|---------|-----------|----------|-------|
| Premium badge | YES | YES | PremiumBadge component, UserTags |
| Profile themes (8 themes) | YES | YES | premiumOnly middleware |
| Animated avatar | YES | YES | is_animated_avatar field, premium-gated |
| 1000-char bio | YES | YES | FREE_BIO_LIMIT=200, PREMIUM_BIO_LIMIT=1000 |
| Profile banner | YES | YES | banner_url only set if req.isPremium |
| Unlimited friends | YES | YES | Free limit: 50, premium: unlimited |
| Custom status | YES | YES | Premium-only field |
| Friend groups | YES | YES | premiumOnly middleware on group routes |
| Vote streak bonuses | YES | YES | updateVoteStreak checks isPremium |
| Double XP | YES | YES | awardXP(userId, 10, isPremium) doubles to 20 |
| Exclusive achievements | YES | YES | Achievement IDs 20+ are premium-only |
| Vote history export | YES | YES | premiumOnly on export route |
| Ad-free | YES | NO | No ads exist anywhere — feature is meaningless |
| Priority support | YES | NO | No support ticket system exists |
| Custom emojis | YES | YES | Max 20, premiumOnly middleware |

### 3.2 Server Plans (Starter / Pro / Enterprise)

| Feature | Advertised | Enforced | Notes |
|---------|-----------|----------|-------|
| Server creation limit (2/5/15/unlimited) | YES | YES | SERVER_LIMITS in serverController.js |
| Priority search placement | YES | YES | ORDER BY subscription_plan in getServers |
| Custom banner and logo | YES | NO | All users can set banner/logo — not gated |
| Vote analytics and referrer tracking | YES | YES | Available to all owners, rate-limited by API plan |
| Server verified badge | YES | NO | Admin manually verifies — not auto-granted on Starter |
| API: 5000/50000/Unlimited req/day | YES | YES | PLAN_LIMITS in apiKeyAuth.js |
| Top 10 placement boost (Pro) | YES | PARTIAL | ORDER BY boost exists but not guaranteed top 10 |
| Advanced analytics and geo data | YES | PARTIAL | Geo data exists but no plan gate on analytics endpoints |
| Discord webhooks (Pro) | YES | NO | NOT IMPLEMENTED — no code exists |
| Guaranteed top 3 placement (Enterprise) | YES | NO | Not enforced — only ORDER BY boost |
| Custom branding (Enterprise) | YES | NO | Not implemented |
| Dedicated manager (Enterprise) | YES | NO | Manual process — no system |
| 24/7 support (Enterprise) | YES | NO | No support system |
| Email support (Starter) | YES | NO | No support ticket system |

### 3.3 Summary

- **User Premium**: ~85% enforced. Missing: ad-free (no ads exist), priority support (no system).
- **Server Plans**: ~50% enforced. Critical gaps: Discord webhooks, guaranteed placement, custom branding, banner/logo gating.
- **Action Required**: Either implement missing features before launch OR remove them from the pricing page.

---

## 4. API Rate Limits — Configuration Table

### Current State (Hardcoded in apiKeyAuth.js)

```
free:       { daily: 500,    perMinute: 10   }
starter:    { daily: 5000,   perMinute: 60   }
pro:        { daily: 50000,  perMinute: 300  }
enterprise: { daily: null,   perMinute: 1000 }
```

### Problem
These values are hardcoded. Changing them requires a code deploy.

### Solution: api_plan_config Database Table

```sql
-- Migration: server/db/migrations/026_add_api_plan_config.sql
CREATE TABLE IF NOT EXISTS api_plan_config (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  plan_name     VARCHAR(50)  NOT NULL UNIQUE,
  daily_limit   INT          NULL,
  per_minute    INT          NOT NULL,
  server_limit  INT          NULL,
  price_monthly DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  price_yearly  DECIMAL(8,2) NULL,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO api_plan_config (plan_name, daily_limit, per_minute, server_limit, price_monthly) VALUES
  ('free',       500,   10,   2,    0.00),
  ('starter',    5000,  60,   5,    4.99),
  ('pro',        50000, 300,  15,   14.99),
  ('enterprise', NULL,  1000, NULL, 39.99);
```

### Updated apiKeyAuth.js — Load from DB with Redis cache

```js
async function getPlanLimits() {
  const cached = await cache.get('plan_config');
  if (cached) return cached;
  const [rows] = await pool.query('SELECT * FROM api_plan_config WHERE is_active = 1');
  const config = {};
  rows.forEach(r => { config[r.plan_name] = { daily: r.daily_limit, perMinute: r.per_minute }; });
  await cache.set('plan_config', config, 300); // 5 min TTL
  return config;
}
```

### Admin Panel Integration
Add `/admin/plans` page to edit `daily_limit`, `per_minute`, `server_limit`, and `price_monthly` without redeploying.

---

## 5. Missing / Unimplemented Features

### 5.1 Discord Webhooks (Pro plan — advertised, NOT built)
Pro subscribers are paying for a feature that does not exist.
- Need: DB table `server_webhooks`, backend POST to webhook on vote, frontend config UI
- Estimated effort: 1 day

### 5.2 Contact Form Email Sending
Users who submit the contact form get a success message but nothing is sent.
- Fix: Wire form to `POST /api/contact` -> `sendEmail()` to `votevaultsupport@gmail.com`
- Estimated effort: 2 hours

### 5.3 BEP20 Auto-Verification
BEP20 payments always go to manual review — no auto-activation.
- Fix: Integrate BSCScan API (`https://api.bscscan.com/api?module=transaction&action=gettxreceiptstatus`)
- Estimated effort: 3 hours

### 5.4 Error Reporting (Sentry)
Production errors are invisible unless someone checks server logs.
- Fix: Add `@sentry/node` to server, `@sentry/react` to frontend
- Estimated effort: 2 hours

### 5.5 Server Verified Badge Auto-Grant
Starter plan advertises "Server verified badge" but it is manually granted by admin.
- Fix: Auto-set `is_verified = TRUE` when a Starter+ payment is activated for a server
- Estimated effort: 1 hour

### 5.6 Custom Banner/Logo Gating
Free users can set banners and logos — Starter plan advertises this as a paid feature.
- Fix: Gate `banner_url` and `logo_url` updates to Starter+ in `serverController.updateServer`
- Estimated effort: 30 minutes

### 5.7 Guaranteed Top 3 Placement (Enterprise)
Enterprise plan advertises "Guaranteed top 3" but only gets an ORDER BY boost.
- Fix: Add `featured_rank` column to servers. Enterprise servers with `featured_rank <= 3` always appear first.
- Estimated effort: 2 hours

### 5.8 Support Ticket System
"Email support" (Starter), "Priority support" (Pro/Premium), "Dedicated manager" (Enterprise) are listed but there is no support system.
- Recommendation: Remove from pricing page for launch, add later.

### 5.9 Ad-Free Experience
Listed as a User Premium feature but there are no ads anywhere.
- Fix: Either add ads for free users (Google AdSense) or remove this from the pricing page.

### 5.10 Notification Preferences UI
`user_preferences` table exists but there is no UI to manage email notification settings.
- Estimated effort: 3 hours

---

## 6. Misconfigured / Broken Items

| # | Item | Location | Fix |
|---|------|----------|-----|
| 1 | `GoogleReCaptchaProvider` wraps the entire app but is now unused (NewServer was fixed to use v2 checkbox) | `App.tsx` | Remove the provider wrapper |
| 2 | `basic` plan in PLANS object maps to "Starter" — duplicate alias causes confusion | `Payment.tsx` | Remove `basic` alias |
| 3 | `reconnect: true` in DB pool config is not a valid mysql2 option | `db.js` | Remove it |
| 4 | Morgan `combined` format logs full URLs including query strings in production | `index.js` | Switch to `short` format |
| 5 | `console.error` still used in `googleLogin`, `register`, `updateEmail`, `updatePassword` | `authController.js` | Replace with `logger.error` |
| 6 | `DashboardLayout.tsx` imports `useState` but never uses it | `DashboardLayout.tsx` | Remove unused import |
| 7 | `paymentController.js` reads `VITE_USDT_WALLET` (a frontend-only env var) on the backend | `paymentController.js:57` | Use `process.env.USDT_WALLET` only |
| 8 | Socket.io cookie parsing uses naive string split — breaks if cookie value contains `=` | `socket.js` | Use proper cookie parser |
| 9 | `SameSite: strict` on auth cookie will break Google OAuth callback redirect | `authController.js` | Change to `SameSite: lax` |
| 10 | `server/src/utils/scheduler.js` — `expiry_warned` column check runs on every startup but the column already exists | `scheduler.js` | Remove the self-healing guard now that column exists |

---

## 7. Technical Improvements

### High Priority

**Input validation on all endpoints**
Many controllers do no input validation beyond Zod schemas. Add Zod schemas for `updateProfile`, `updateEmail`, `updatePassword`, and validate URL fields are actual URLs.

**Pagination on all list endpoints**
- `GET /api/admin/users` — no pagination, returns all users
- `GET /api/notifications` — no pagination
Both need `?page=&limit=` support.

**Database connection pool tuning**
Current: `connectionLimit: 10`. For production increase to 20-50 depending on server RAM.

**Redis connection resilience**
If Redis is down, API rate limiting falls back to "allow all". Add a fallback in-memory rate limiter for when Redis is unavailable.

**Log rotation**
Add `winston-daily-rotate-file` to prevent `server/logs/` from filling the disk.

### Medium Priority

**API versioning**
Internal routes are at `/api/*` with no version. Add `/api/v1` prefix for future compatibility.

**Database query optimization**
- `getServers` does a full table scan — add composite index on `(status, vote_count DESC)`
- `getAnalytics` does `SELECT v.*` — select only needed columns

**Improved health check**
Current `/api/health` returns `{ status: 'ok' }`. Add DB ping, Redis ping, and uptime.

**Background job queue**
`setInterval` in scheduler is not reliable (misses runs if server restarts). Use Bull/BullMQ with Redis for scheduled jobs.

### Low Priority

**TypeScript on the backend**
The backend is plain JavaScript. TypeScript would have caught the `updatePassword` syntax error that broke production.

**API response envelope consistency**
Some endpoints return `{ data: [...] }`, others return plain arrays, others return `{ servers: [...], total: N }`. Standardize to `{ data, total?, page?, meta? }`.

---

## 8. UI / UX Improvements

### Critical UX Issues

| Issue | Page | Fix |
|-------|------|-----|
| No loading state on main server list — page shows empty then populates | Index.tsx | Add skeleton cards during initial load |
| Payment page: no way to check if payment was received after submitting | Payment.tsx | Add "Check status" button polling /payments/subscription |
| After email verification, user must manually navigate to sign-in | VerifyEmail.tsx | Auto-redirect to /auth after 3 seconds |
| Thread pagination resets scroll position | Threads.tsx | Scroll to top on page change |
| Server profile tabs do not persist on page refresh | ServerProfile.tsx | Sync active tab with URL hash |

### Missing Pages

| Missing | Impact | Effort |
|---------|--------|--------|
| Terms of Service page | Legal requirement for payments | Low |
| Privacy Policy page | Legal requirement (GDPR if EU users) | Low |
| Server not found page | Shows blank when slug does not exist | Low |
| Dashboard onboarding flow for new users | New users do not know what to do | Medium |

### Mobile Responsiveness

- `AdminUsers.tsx` table overflows on mobile — needs horizontal scroll or card layout
- `VoteAnalytics.tsx` charts are not mobile-friendly
- `ApiDocs.tsx` code blocks overflow on mobile

### Accessibility

- Vote dialog challenge buttons have no `aria-label`
- Star rating buttons in review form have no accessible labels
- Color-only status indicators (online/offline dots) need text alternatives
- Admin tables have no `scope` attributes on `<th>` elements

---

## 9. Feature Suggestions

### Before Launch (High Value, Low Effort)

1. Server search on the main page — currently only category filtering exists
2. Vote reminder notifications — notify users when their 12h cooldown expires
3. Trending servers section — servers with most votes in last 24h
4. "Claim your server" flow — if a server exists but has no owner

### Post-Launch (Medium Effort)

1. Discord bot integration — /vote command linking to the vote page
2. Server uptime monitoring — ping server website/IP and update is_online automatically
3. Review moderation — flag reviews for admin review before they appear
4. API webhooks — notify server owners when a vote is received (the Discord webhook feature)
5. Referral system — users earn XP for referring new servers/players

### Long-Term

1. Mobile app (React Native)
2. Multi-language support — Arabic, Russian, Chinese (large Conquer Online communities)
3. Tournament/event system — servers compete for top spots during events

---

## 10. Environment Variables Checklist

All variables that MUST be set before production deployment:

```env
# REQUIRED
DB_HOST=your-db-host
DB_USER=votevault_user          # NOT root
DB_PASSWORD=strong-random-password
DB_NAME=votevault_production
JWT_SECRET=<64-char random hex — openssl rand -hex 32>
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# reCAPTCHA v2 — PRODUCTION keys from console.google.com/recaptcha
VITE_RECAPTCHA_V2_SITE_KEY=<production-site-key>
RECAPTCHA_V2_SECRET_KEY=<production-secret-key>

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votevaultsupport@gmail.com
SMTP_PASSWORD=<gmail-app-password>

# Payments — TRC20
USDT_WALLET=TN1ZCfcKKmigD8NBCdvdAndw6GKHtKNxDU
VITE_USDT_WALLET=TN1ZCfcKKmigD8NBCdvdAndw6GKHtKNxDU

# Payments — BEP20
BEP20_WALLET=<your-real-bsc-address>
VITE_BEP20_WALLET=<your-real-bsc-address>

# RECOMMENDED
TRONSCAN_API_KEY=<get from tronscan.org/account/api>
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=<from console.cloud.google.com>

# OPTIONAL — DB pool tuning
DB_CONNECTION_LIMIT=20
DB_MAX_IDLE=10
DB_IDLE_TIMEOUT=60000
```

---

## 11. Database — Recommended Changes

### Run Before Deploy

```sql
-- 1. api_plan_config table (see Section 4)
-- File: server/db/migrations/026_add_api_plan_config.sql

-- 2. Discord webhook support
CREATE TABLE IF NOT EXISTS server_webhooks (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  server_id   BIGINT NOT NULL,
  webhook_url TEXT   NOT NULL,
  events      JSON   NOT NULL DEFAULT '["vote"]',
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Guaranteed placement for Enterprise
ALTER TABLE servers ADD COLUMN featured_rank TINYINT UNSIGNED NULL DEFAULT NULL;
CREATE INDEX idx_servers_featured ON servers (featured_rank);

-- 4. Support tickets (basic)
CREATE TABLE IF NOT EXISTS support_tickets (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  status      ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  priority    ENUM('low','normal','high','urgent') DEFAULT 'normal',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Schema Gaps Found

The base `mysql_schema.sql` is out of date. The following columns exist in the live DB (added via migrations) but are missing from the base schema file:

- `users`: `is_banned`
- `servers`: `active_players`, `youtube_url`, `facebook_url`, `twitter_url`, `twitch_url`, `last_active_update`, `status` defaults to `approved` in schema but should be `pending`
- `profiles`: `discriminator`, `social_*`, `banner_url`, `profile_theme`, `is_animated_avatar`, `custom_status`, `api_daily_used`, `api_daily_date`, `api_total_requests`

**Action:** Regenerate `mysql_schema.sql` from the live DB using `mysqldump --no-data` to keep it as the source of truth.

---

## 12. Deployment Checklist

### Pre-Deploy (Must Do)

- [ ] Replace all placeholder values in `.env` (see Section 10)
- [ ] Set `NODE_ENV=production`
- [ ] Rotate `JWT_SECRET` (generate new 64-char hex: `openssl rand -hex 32`)
- [ ] Replace reCAPTCHA keys with production keys
- [ ] Set real BEP20 wallet address
- [ ] Get TronScan API key and set `TRONSCAN_API_KEY`
- [ ] Run all pending migrations (017 through 026)
- [ ] Regenerate `mysql_schema.sql` from live DB
- [ ] Remove `test_write_permission.txt` from repo root
- [ ] Remove `server/Redis-x64-5.0.14.1/` from repo (use system Redis)
- [ ] Add `.env` to `.gitignore` and verify it is not tracked
- [ ] Fix Contact form to actually send emails
- [ ] Change cookie `SameSite: strict` to `SameSite: lax`
- [ ] Remove `VITE_SUPABASE_*` commented-out vars from `.env`

### Backend Setup

- [ ] Set up process manager (PM2 or systemd)
- [ ] Configure Nginx reverse proxy (port 5000 -> 443)
- [ ] Enable HTTPS (Let's Encrypt / Certbot)
- [ ] Set up Redis as a system service
- [ ] Configure log rotation for `server/logs/`
- [ ] Set `DB_USER` to a dedicated MySQL user (not root)
- [ ] Set `DB_CONNECTION_LIMIT=20` for production load
- [ ] Enable MySQL slow query log

### Frontend Build

- [ ] Run `npm run build` and verify no TypeScript errors
- [ ] Set `VITE_API_URL` to production API URL
- [ ] Set `VITE_USDT_WALLET` and `VITE_BEP20_WALLET` to real addresses
- [ ] Set production reCAPTCHA site key
- [ ] Remove `GoogleReCaptchaProvider` wrapper from `App.tsx` (unused)

### Post-Deploy Testing

- [ ] Test registration + email verification flow end-to-end
- [ ] Test password reset flow end-to-end
- [ ] Test payment submission (TRC20 — auto-verify)
- [ ] Test payment submission (BEP20 — manual review)
- [ ] Test admin panel: approve server, activate payment
- [ ] Test API key creation and rate limiting
- [ ] Test vote submission with all 3 challenge types (math, slider, click_sequence)
- [ ] Test Google OAuth login
- [ ] Test 2FA enable/disable
- [ ] Monitor error logs for first 24 hours
- [ ] Set up uptime monitoring (UptimeRobot or similar)

---
