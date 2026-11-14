# Google Play release checklist — Monevo

Target: first production release of `com.monevo.app` (Android, Expo SDK 57)
Last reviewed: 2026-11-08

Verified against Google Play requirements in effect on this date:
target API level 36, account-deletion policy, Data safety, app-access review,
and the closed-testing requirement for personal developer accounts.

## 1. Hard blockers (ops, outside the repo)

- [x] **API reachable over HTTPS.** `GET https://api.monevoapp.me/health`
      returns `{"status":"ok"}` with a Let's Encrypt certificate that Caddy
      renews automatically. `monevoapp.me` was registered through the GitHub
      Student Pack (free until 2026-11-14, then renew at Namecheap).
- [ ] **Clerk production instance.** `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` must be
      `pk_live_...` (currently `pk_test_...`).
- [ ] **EAS environment variables for `production`**: `EXPO_PUBLIC_API_URL`,
      `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`, `EXPO_PUBLIC_POSTHOG_API_KEY`,
      `EXPO_PUBLIC_POSTHOG_HOST`, Google client IDs.
      `app.config.js` prints a warning at build time if the API URL is not HTTPS
      or the Clerk key is a test key.
- [ ] **Package name free.** `com.monevo.app` must not already exist on Play.
- [ ] **Name/trademark.** "Monevo" is used by an existing finance brand; confirm
      naming before submitting to avoid an IP complaint.

## 2. Build

```bash
cd frontend
npx expo-doctor
npx tsc --noEmit && npx jest && npx eslint src
eas build --profile production --platform android   # AAB, Play App Signing
```

`app.config.js` disables Android cleartext traffic automatically when
`EAS_BUILD_PROFILE=production`, so the Data safety answer
"data is encrypted in transit" stays true. Dev-client/preview builds keep
cleartext for Metro.

## 3. Play Console → App content

| Section                    | Answer                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy             | `https://vileyy.github.io/monevo/legal/privacy`                                                                                             |
| Ads                        | **No** (no ad SDK, `AD_ID` permission blocked)                                                                                              |
| App access                 | Provide a demo email/password account (no OTP). Create it before review, confirm it still signs in, and list extra steps (e.g. onboarding). |
| Target audience            | **13+**, not child-directed (Terms require 13+)                                                                                             |
| Content rating             | Complete questionnaire (no violence, no UGC, finance tracking)                                                                              |
| Financial features         | No financial products/services offered — tracking only                                                                                      |
| Data deletion              | `https://vileyy.github.io/monevo/legal/account-deletion` + in-app Profile → Delete Account                                                  |
| Advertising ID             | **No**                                                                                                                                      |
| News / Government / Health | No                                                                                                                                          |

## 4. Data safety (must match the SDKs in `frontend/package.json`)

Collected:

- Personal info: **Email, Name, User IDs** (account; required)
- Financial info: **Other financial info** (wallets, transactions, budgets)
- Location: **Approximate location** (PostHog derives region from IP)
- App activity: **Other actions** (product analytics events)
- Device or other IDs: **Device or other IDs** (PostHog distinct ID)
- App info and performance: **Diagnostics** (crash/error diagnostics)

Not collected: precise location, contacts, photos, microphone, health,
advertising ID.

Shared with third parties for advertising: **No**. Processing: account
management, analytics, app functionality. Encrypted in transit: **Yes**
(HTTPS-only release build). Users can request deletion: **Yes** (URL above).

App-side opt-out: Profile → Privacy & Legal → **Share Usage Analytics**.
The setting is persisted and applied to PostHog at startup.

## 5. Store listing assets

- [ ] App icon 512×512 PNG (source `assets/images/icon.png`, 1024×1024)
- [ ] Feature graphic 1024×500 PNG
- [ ] At least 2 phone screenshots (no device frames required)
- [ ] Short description ≤ 80 chars, full description ≤ 4000 chars
- [ ] Contact email + privacy URL
- [ ] Category: Finance; tags as appropriate

## 6. Reviewer smoke test (run on a real release build)

1. Fresh install → onboarding → create account with email/password.
2. Add a wallet and a transaction; open Insights/Budgets.
3. Enable bill reminders; confirm the notification permission rationale text.
4. Sign out → sign in again.
5. Profile → Privacy & Legal → open Privacy Policy, Terms, Delete Account.
6. Toggle Share Usage Analytics off/on, kill and reopen the app.
7. Delete the account → confirm sign-out and that login with old credentials
   fails.

## 7. Account gates (personal developer accounts created after 2023-11-13)

- [ ] Device verification through the Play Console mobile app (Android 10+).
- [ ] Closed test with **12+ testers opted in continuously for 14 days**.
- [ ] Apply for production access and answer the review questions.
- [ ] Only then promote the AAB to Production.

## 8. Post-launch

- [ ] Pre-launch report: no crashes/ANRs, 16 KB page-size warning absent.
- [ ] Verify Play App Signing backup of the upload key.
- [ ] Keep `docs/legal/*` in sync with the backend `legal.content.ts`.
