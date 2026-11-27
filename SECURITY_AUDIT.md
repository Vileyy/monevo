# Security & Privacy Audit — Monevo

- **Date:** 2026-11-26
- **Commit:** `e4ba960` (working tree clean)
- **Scope:** API (`backend/`), Expo app (`frontend/`), deployment config (`deploy/`), git history, dependency tree, privacy/legal content.
- **Method:** Static review, `pnpm audit --prod`, `gitleaks detect` over all 89 commits, manual auth/IDOR tracing, config and policy review.
- **Not covered:** Live pen-testing, EC2 host inspection, Play Console declarations, Clerk dashboard settings, on-device testing. See [Limitations](#limitations).

## 1. Executive summary

No critical issue was found. The core is in good shape: no real secrets in git, production JWT secret is enforced, bcrypt is used, every wallet/category/transaction/budget/reminder query checks `userId`, DTOs are validated, auth endpoints are rate-limited, and the API/database are not exposed publicly.

One **high** issue needs fixing before a public release: an attacker can pre-register a victim's email and keep password access after the victim later signs in with Google or Clerk. Six **medium** issues and several low/operational gaps are listed below.

A separate **Play release blocker** was found while checking the impact of these fixes: the app is now Google-only, but `PLAY_STORE_CHECKLIST.md` still tells reviewers to sign in with a demo email/password account. See [R-1](#r-1--play-reviewer-demo-login-is-stale-and-unusable).

| Severity | Count |
| -------- | ----- |
| High     | 1     |
| Medium   | 6     |
| Low      | 9     |

**Remediation status (2026-11-26):** H-1, M-2 and M-4 are implemented in the
working tree. `/auth/register` and `/auth/login` are disabled in production by
default, `/auth/google` was removed, Clerk no longer links accounts by email,
Swagger defaults to off, and Sentry request data is scrubbed. The changes are
not deployed yet. M-1, M-3, M-5 and R-1 remain open.

## 2. Findings

### H-1 — Account pre-hijacking through unverified email and auto-linking

**Severity:** High
**Status:** Fixed in the working tree (backend-only variant; `/auth/google` removed, `/auth/register` + `/auth/login` disabled in production, no email linking).
**Files:** `backend/src/auth/auth.service.ts:33` (`register`), `:67` (`login`), `:125` (`googleLogin`), `backend/src/users/users.service.ts:48` (`findOrCreateByClerk`)

Registration accepts any email without verification and immediately returns a valid JWT. Both Google and Clerk sign-in then look up an existing account **by email** and log into it:

1. Attacker registers `victim@example.com` with a password they control. No email verification is required.
2. Victim later taps “Continue with Google” (Google email is verified) or signs in through Clerk.
3. `googleLogin` / `findOrCreateByClerk` find the attacker's row by email and attach the OAuth/Clerk identity to it.
4. The victim now uses the attacker's account, and the attacker can sign in with the password at any time and read the victim's financial data.

This is the classic pre-account-hijacking pattern. It is amplified by the absence of email verification, password reset, or a “link account” confirmation step.

**Implemented:** `/auth/google` was removed, `/auth/register` and `/auth/login` return 404 in production unless `PASSWORD_AUTH_ENABLED=true`, and `findOrCreateByClerk` refuses to attach a Clerk identity to an existing email row. The long-term option below (email verification) is still recommended before re-enabling password sign-up.

**Fix (P0):**

- Add an `emailVerifiedAt` column. Do not issue a session for password registration until the email is verified (or gate password login on it).
- When an OAuth/Clerk email matches an existing **unverified password** account, do not auto-link. Require the user to verify the email or sign in with the existing password first.
- Add a password-reset flow (which also proves mailbox ownership).
- Alternatively, make email/password registration invite-only until verification exists.

### M-1 — iOS App Transport Security is disabled; local release builds allow cleartext

**Severity:** Medium (High once an iOS build ships)
**Files:** `frontend/app.json:16` (`NSAllowsArbitraryLoads: true`), `frontend/app.json:59` (`usesCleartextTraffic: true`), `frontend/app.config.js:44-52`

ATS is disabled unconditionally for iOS, which permits plain HTTP and weak TLS and enables MITM of tokens and financial data. Android cleartext is correctly turned off only when `EAS_BUILD_PROFILE=production` or `APP_VARIANT=production`; a local Gradle release build (or any build without those env vars) still ships `usesCleartextTraffic: true`.

**Fix (P0 before an iOS/release build):**

- Remove `NSAllowsArbitraryLoads`; if a dev host must be reached, use an `NSExceptionDomains` entry limited to that host.
- Remove `usesCleartextTraffic` from `app.json` and enable it only in the development config.
- Make `app.config.js` **fail** (not warn) when a production build has a non-HTTPS API URL or a `pk_test_` Clerk key.

### M-2 — Swagger defaults to enabled in the production Compose file

**Severity:** Medium
**Status:** Fixed in the working tree — Compose defaults to `false` and the API falls back to `false` in production.
**Files:** `deploy/docker-compose.yml:42`, `deploy/.env.example:19`

`SWAGGER_ENABLED: ${SWAGGER_ENABLED:-true}` means a missing line in `deploy/.env` publishes `/api` and the full API schema. The example file sets `false`, but the safe default should be `false`. Swagger is also unauthenticated.

**Fix:** change the default to `false`; optionally restrict `/api` by IP or basic auth if it must stay available.

### M-3 — Analytics is enabled by default and can fire before consent

**Severity:** Medium
**Files:** `frontend/src/store/settings.store.ts:30,53`, `frontend/src/app/_layout.tsx:165-170`, `frontend/src/lib/analytics.ts`

`shareAnalytics` defaults to `true`, and the PostHog client is constructed at module load with `captureAppLifecycleEvents: true`. The stored preference is applied only after settings hydration, so lifecycle events can be sent before the user has chosen anything. For EU/UK users this does not meet an opt-in consent standard, even though the privacy policy lists legitimate interests.

Event payloads themselves are clean: `transaction_created` sends only type, category name and a `has_note` boolean; `identify` sends the internal user id; autocapture of touches is disabled (`_layout.tsx:218-224`).

**Fix:** default `shareAnalytics` to `false`, do not construct/initialize PostHog until consent, and gate the toggle behind a short consent notice. If keeping opt-out, document the legitimate-interest assessment.

### M-4 — Sentry error handler has no PII scrubbing

**Severity:** Medium
**Status:** Fixed in the working tree — Sentry collects no bodies/cookies/query params and `beforeSend` scrubs credentials.
**Files:** `backend/src/main.ts:11-18,49-55`

`Sentry.init` does not set `sendDefaultPii: false` explicitly and there is no `beforeSend` scrubber. Depending on SDK defaults, unexpected 5xx errors on `POST /auth/login` or `/auth/register` can attach request data that includes passwords or bearer tokens. The privacy policy promises that financial records are not sent, but does not address credentials in error reports.

**Fix (implemented):** restrict `dataCollection` (`userInfo: false`, no cookies, no HTTP bodies, no query params), keep only safe request headers, and use a `beforeSend` scrubber that deletes bodies, cookies, query strings and sensitive headers.

### M-5 — “Bank notification sync” is claimed in the UI but has no native listener or privacy disclosure

**Severity:** Medium (product/policy)
**Files:** `frontend/src/store/bank-sync.store.ts:173,212`, `frontend/src/features/bank-sync/components/BankSyncModal.tsx:70-78`, `frontend/src/features/bank-sync/services/notificationListener.ts`, `backend/src/legal/legal.content.ts:944-950`

The app enables bank-notification sync by default and tells users it reads balance-change notifications from banking apps. The repository contains no `NotificationListenerService`, no `BIND_NOTIFICATION_LISTENER_SERVICE` permission, and no code path that receives another app's notifications; `processNotification` is only called by `simulateNotification` and tests. The privacy policy mentions only locally scheduled bill reminders, not notification-content processing.

If this ships as-is, it is a non-working feature plus a misleading data-collection claim. If it is implemented later, Android Notification Access is a highly sensitive permission and Play requires a prominent in-app disclosure and policy coverage.

**Fix:** either remove the feature from the release UI until a native listener exists, or implement it and add an explicit consent screen, policy section and Play declaration. Never upload raw notification text; parse on-device only.

### M-6 — Long-lived JWTs with no revocation or refresh

**Severity:** Medium-low
**Files:** `deploy/docker-compose.yml:39`, `backend/src/auth/jwt-secret.ts`

Access tokens live 7 days by default (`JWT_EXPIRES_IN=7d`), there is no refresh/rotation, no token version and no server-side revocation. A stolen token stays valid until expiry; only account deletion invalidates it (the JWT strategy reloads the user). Mobile apps commonly use long-lived tokens, but this should be a conscious decision for a finance app.

**Fix:** shorten the access token (15–60 minutes) and add a refresh token stored in SecureStore, or add a `tokenVersion` column bumped on logout/password change. At minimum document the 7-day window.

### L-1 — User enumeration on registration

`POST /auth/register` returns `409 Email already exists` while login is generic. An attacker can confirm whether an address has an account. Low impact given the pre-hijack issue above, but it also enables targeted attacks.

**Fix:** return a generic “check your email” response and send a verification/notification email instead of confirming existence.

### L-2 — Weak password policy

`backend/src/auth/dto/register.dto.ts:19` and `login.dto.ts:13` allow 6-character passwords; bcrypt cost is 10. No breached-password check.

**Fix:** require at least 8 (better 12) characters, allow long passphrases, raise bcrypt cost to 12, and reject known-breached passwords.

### L-3 — API container runs as root

`Dockerfile:18-40` never creates or switches to a non-root user.

**Fix:** add a `node` user, `USER node`, and consider `read_only: true`, `tmpfs`, and `cap_drop: [ALL]` in Compose.

### L-4 — Explicit sign-out keeps the biometric token

`frontend/src/store/auth.store.ts:209-218` clears the normal session but not `monevo_biometric_session_token`; `loginWithBiometrics` can restore the previous account after “Sign Out”. Account deletion has the same gap (`frontend/src/app/(tabs)/profile.tsx:126-152`).

**Fix:** call `clearBiometricSession()` on explicit sign-out and account deletion (or keep it only behind a clearly labelled “quick login” setting).

### L-5 — No secret scanning or dependency updates in CI

`.github/workflows/ci.yml` runs lint/typecheck/test/build/format/audit, but there is no `gitleaks` job and no `.github/dependabot.yml`. `actions/checkout@v6` is not pinned by SHA (only `pnpm/setup` is).

**Fix:** add a gitleaks job, a Dependabot config for npm and GitHub Actions, and SHA-pin third-party actions.

### L-6 — One high dependency advisory is suppressed

`pnpm-workspace.yaml:30-40` ignores five advisories. `pnpm audit --prod` currently reports **1 high, 15 moderate, 2 low**; the high is in the ignore list. Known entries are denial-of-service issues in build/dev tooling (`image-size` via Metro, `deepmerge-ts` via Prisma tooling, `decode-uri-component` via Expo Router, `braces`, `qs`). The runtime `qs` advisory only affects `arrayFormat: 'comma'`, which Express does not use by default.

**Fix:** record an owner and review date for each ignored advisory, and re-check them on every Expo/Prisma upgrade. Do not let the ignore list grow silently.

### L-7 — No database backup/restore runbook in the repo

The privacy policy promises encrypted backups overwritten within 30 days, but `deploy/` has only the Postgres volume; there is no scheduled `pg_dump`, off-instance copy, or restore test.

**Fix:** add an encrypted nightly `pg_dump` to object storage with a 30-day lifecycle, a restore drill, and monitoring for failed backups.

### L-8 — Internal Clerk ID returned by `/auth/me`

`backend/src/users/users.service.ts:88-90` strips `password` but keeps `clerkId`, and `backend/src/auth/auth.controller.ts:55` returns that object. It is not a credential, but it is unnecessary internal identifier exposure.

**Fix:** return an explicit user DTO (`id`, `email`, `name`, timestamps) from both auth paths.

### L-9 — Health and legal endpoints are unauthenticated by design

`GET /`, `/health`, `/legal/*` and `/currency/rates` are public. This matches `AGENTS.md`, but the root endpoint and Swagger (when enabled) disclose the stack. Currency rates are cached for 6 hours and fetched with a 5-second timeout, which limits abuse.

**Fix:** keep `/health` minimal, and ensure `/` does not advertise framework/version details.

## 3. What passed

- **Secrets:** `gitleaks` scanned 89 commits / ~3.9 MB. Three hits, all false positives: the Clerk **publishable** key in `eas.json` (public by design) and the NestJS README badge token `abc123def456`. No `.env`, `.pem`, or live credential is tracked; `.gitignore` covers `.env`, `deploy/.env` and the Clerk live-key staging file.
- **Production JWT:** `resolveJwtSecret` refuses to start in production without `JWT_SECRET`; no predictable fallback can be used (`backend/src/auth/jwt-secret.ts`).
- **Password storage:** bcrypt with per-user salt; password hashes are stripped before `request.user` and profile responses.
- **Authorization/IDOR:** every wallet, category, transaction, budget and reminder read/update/delete verifies `userId` before acting, including re-validation of target wallet/category on transaction updates. No raw SQL (`$queryRaw`) is used.
- **Input validation:** global `ValidationPipe` with `whitelist: true`; transaction pagination capped at 100; sort fields restricted to an allowlist.
- **Rate limiting:** global 100 req/min and 10 req/min on all auth endpoints; `trust proxy` is set to one Caddy hop.
- **Transport/edge:** Helmet (CSP, HSTS etc.), CORS locked to an explicit allowlist (disabled by default), API and Postgres bound to `127.0.0.1`, TLS terminated by Caddy with Let’s Encrypt.
- **Account deletion:** deletes the Clerk identity first, then the user row; finance tables cascade. An in-app deletion flow and a public account-deletion page exist.
- **Frontend storage:** auth tokens, biometric session and app settings use `expo-secure-store`, not AsyncStorage.
- **Analytics payloads:** internal user id only; no email, name, amounts, notes or budget values; touch autocapture disabled.
- **Legal pages:** generated from `backend/src/legal/legal.content.ts` and CI fails if `docs/` is stale. Privacy policy covers data categories, processors, retention, deletion and contact.

## 4. Play Store / privacy checklist

| Item                                                   | Status                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Privacy policy URL (public, reachable)                 | OK — GitHub Pages + `/legal/privacy`                                                 |
| In-app account deletion                                | OK — profile screen + API                                                            |
| Public account-deletion URL                            | OK — `/legal/account-deletion`                                                       |
| Data Safety: encryption in transit                     | **Conditional** — verify the release build actually has HTTPS and no cleartext (M-1) |
| Data Safety: analytics declared and consent            | **Gap** — default-on analytics (M-3)                                                 |
| Data Safety: financial data, account data, diagnostics | Declared in policy; verify Play form matches PostHog/Sentry/Clerk/Google/AWS         |
| Notification-access disclosure                         | **Gap / not implemented** — bank-sync UI claims it (M-5)                             |
| No ads / no AD_ID                                      | OK — `AD_ID` blocked in `app.json`                                                   |
| Backup/retention statement                             | Policy says 30 days, no backup job exists (L-7)                                      |

## 5. Remediation order

**P0 — before any public/Play release**

1. H-1: disable public password registration and stop auto-linking by email (backend-only variant).
2. M-2: default `SWAGGER_ENABLED=false` in Compose.
3. M-1: remove ATS exception; fail production builds on non-HTTPS API or Clerk test keys.
4. M-5: remove or correctly disclose/implement bank-notification sync.
5. R-1: fix Play reviewer access and update `PLAY_STORE_CHECKLIST.md` before submission.

**P1 — next sprint**

6. M-3: opt-in analytics, initialize PostHog after consent.
7. M-4: Sentry PII scrubbing.
8. L-4: clear biometric token on sign-out and account deletion.
9. L-1/L-2: generic registration response, stronger passwords.
10. M-6: token lifetime/revocation decision.

**P2 — hardening**

11. L-3: non-root container + Compose hardening.
12. L-5: gitleaks + Dependabot + SHA-pinned actions.
13. L-7: automated encrypted backups and a restore drill.
14. L-6: review ignored advisories with an owner and expiry.
15. L-8: explicit user response DTO.

## 6. Play release impact of the P0 fixes

Short answer: **three fixes are backend/config-only and need no new app build or Play review.** The bank-sync fix, and any fix for the reviewer-login blocker below, do need a new AAB. None of the fixes reduce what Play sees in Data Safety as long as the release is built with the EAS `production` profile.

| Fix                                     | Backend only? | New AAB?                 | Play review? | User-visible change                       |
| --------------------------------------- | ------------- | ------------------------ | ------------ | ----------------------------------------- |
| H-1 disable password auth, stop linking | Yes           | No                       | No           | None for Clerk/Google users               |
| H-1 full email verification (option B)  | No            | Yes                      | Yes          | New signup/verify screens, email provider |
| M-2 `SWAGGER_ENABLED=false`             | Config only   | No                       | No           | None; lose prod Swagger                   |
| M-1 ATS/cleartext hardening             | Build config  | Only when you next build | No           | Android production output unchanged       |
| M-5 hide bank-notification sync         | Frontend      | Yes (no OTA configured)  | Yes          | Feature disappears from Profile           |
| M-3 analytics opt-in                    | Frontend      | Yes                      | Yes          | One consent step; Data Safety stays valid |
| M-4 Sentry scrubbing                    | Yes           | No                       | No           | None                                      |
| R-1 demo/reviewer login                 | Backend + UI  | Yes                      | Yes          | “Try demo” entry on the sign-in screen    |

### H-1 — use the backend-only variant

Because `AuthScreen.tsx` now uses only `/auth/clerk` (Google via Clerk), the lowest-risk fix is:

1. Disable public `POST /auth/register` and `POST /auth/login` (or keep `/auth/login` only behind an explicit demo flag).
2. Stop linking an existing account by email in `googleLogin` / `findOrCreateByClerk`; look up only by provider id, and reject with a clear message when the email already belongs to another account.
3. Keep the current users untouched: every app-created account has `clerkId`, so the `clerkId` lookup still succeeds.

This needs **no schema migration, no frontend change, no new AAB and no Play review**. Deploy it as an API container rebuild. The only users affected are old preview builds that still show the removed email/password form (there are none on Play) and the seeded demo account, which is already unusable from the current UI.

Option B (full email verification) is the “correct” long-term design, but it adds an email provider, a verified sending domain, tokens/screens, a migration, a new AAB, a Play review, and a policy update. Do not start it just to close H-1; the app does not currently expose password sign-up at all.

### R-1 — Play reviewer demo login is stale and unusable

**Severity:** Release blocker (not a vulnerability)
**Files:** `PLAY_STORE_CHECKLIST.md:47,87`, `frontend/src/features/auth/components/AuthScreen.tsx:344-358`, `backend/prisma/seed.ts:7-23`, `deploy/docker-compose.yml:47`

Commit `badccd7` (“make Google the only sign-in method”) removed the email/password form from the app, but the Play checklist still instructs reviewers to use a demo email/password account, and the smoke test still says “create account with email/password”. The seeded `demo@monevo.app` account also has no `clerkId`, so it cannot be reached through Google. Result: a Play reviewer following the checklist cannot get past the sign-in screen.

The seed is also not run by `deploy/docker-entrypoint.sh`; `DEMO_PASSWORD` in Compose is now dead configuration.

**Recommended fix:** add a clearly labelled **“Try demo”** button on the sign-in screen that exchanges a demo-only backend endpoint for a token on the seeded demo account. Keep the endpoint rate-limited, environment-gated, and isolated to demo data. Then update Play Console App Access to “tap Try demo (no credentials)” and rewrite checklist steps 47 and 87. This requires a new AAB and review, but it avoids restoring password auth and does not reopen H-1.

**Alternative:** provide the reviewer a Google test account. This is less reliable because of Google 2FA and because Play reviewers may not be able to complete an external Google sign-in.

### M-1 — Android Play output does not change

The EAS `production` profile already sets `usesCleartextTraffic` to `false` through `app.config.js`, so Android production builds are already HTTPS-only. Removing the static `true` from `app.json` and converting the warnings into build failures mainly protects local Gradle release builds and future contributors. iOS ATS removal only affects iOS (not part of Play); keep a local-only HTTP exception for the dev client so iOS development still works.

### M-5 — hiding bank sync needs a new build

There is no `expo-updates`/OTA setup, so hiding the Profile entry requires a new AAB and a Play review. That is the safe option: the feature has no native listener, no declared permission and no policy coverage. Shipping it as-is risks a “misleading claims/broken functionality” rejection. Implementing it properly means adding a Notification Access service, a prominent disclosure, a policy section and a sensitive-permission review — a separate project, not a patch.

### Deployment order

1. **Now / no review:** deploy API changes for H-1 and M-2; rebuild the API container. Current app versions keep working because they only call `/auth/clerk`.
2. **When building the release:** include M-1, M-5, M-3 and R-1 in one AAB; verify the EAS `production` environment has the live Clerk key and HTTPS API URL.
3. **Before submitting:** regenerate legal pages if the policy changes (`pnpm --filter backend legal:build`), update `PLAY_STORE_CHECKLIST.md`, seed the demo account if R-1 uses it, and re-run the reviewer smoke test on the actual release build.
4. **Then:** closed test → production, per checklist section 7.

Two existing checklist items are also stale: the Clerk key note (line 16) and the demo credentials (line 47). Verify the EAS `production` environment rather than trusting the file. The live API and privacy URL were reachable over HTTPS on 2026-11-26.

## 7. Limitations

This was a code and configuration review. It did not include: runtime exploitation, authenticated DAST, mobile binary inspection, Clerk/Google/PostHog/Sentry dashboard configuration, the actual EC2 `deploy/.env`, security-group rules, TLS/certificate checks, or Play Console Data Safety answers. Dependency results reflect the registry state on 2026-11-26.

Re-run before each release:

```bash
pnpm audit --prod
gitleaks detect --redact
pnpm --filter backend test
pnpm --filter frontend test
```
