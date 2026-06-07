# Shipping PuhuScribe to the App Store & Google Play

**Short answer: yes, very feasible.** PuhuScribe is a React 19 + Vite web app, so
the pragmatic path is **Capacitor** — it wraps the existing web build in native
iOS/Android shells. One codebase; ~90% ships unchanged. This doc is the roadmap
and the list of inputs only the owner can provide.

## Why Capacitor (vs the alternatives)

| Option | Fit | Notes |
|---|---|---|
| **Capacitor** (recommended) | ✅ | Wraps the current `dist/` build in a native WebView; adds native plugins (audio, push, in-app purchase, status bar). Keeps the React/Vite codebase. |
| PWA + Play Store (TWA) | partial | Android accepts a Trusted Web Activity, but iOS does **not** accept pure PWAs to the App Store. Capacitor covers both. |
| React Native rewrite | ❌ | Months of work to re-implement the UI; not warranted for a working web app. |

## What's reusable as-is
- All screens, the Snow design system, Supabase auth + data, the FSRS engine.
- The Cloudflare Worker (AI/MCP) and Azure TTS are remote services the app calls
  over HTTPS — unchanged by the native wrapper.

## High-level steps (engineering — mostly doable in this repo)
1. `npm i @capacitor/core @capacitor/cli` + `npx cap init` (appId = bundle ID, appName).
2. `capacitor.config.ts` → `webDir: 'dist'`.
3. `npm i @capacitor/ios @capacitor/android` → `npx cap add ios android`.
4. `npm run build && npx cap sync`.
5. App icons + splash screens (`@capacitor/assets`), permissions, status-bar theming.
6. Native plugins as needed: audio playback, push notifications (review reminders),
   and **in-app purchase** for the freemium unlock.
7. Build/sign/upload: **Xcode** (iOS) and **Android Studio**/Gradle (Android).

## Inputs required from the owner (the real gating items)
- [ ] **Apple Developer Program** membership ($99/yr) + a **Mac with Xcode** (or a
      cloud-Mac CI like Codemagic/EAS) — iOS cannot be built without macOS tooling.
- [ ] **Google Play Console** account ($25 one-time).
- [ ] **Bundle ID / application ID** (e.g. `fi.puhuscribe.app`) — pick once, hard to change later.
- [ ] **Billing decision (has teeth):** Apple requires digital subscriptions/unlocks
      to use **Apple In-App Purchase** (15–30% fee); you may **not** use a web Stripe
      checkout for in-app digital goods on iOS. Decide: StoreKit/Play Billing via a
      Capacitor IAP plugin (e.g. RevenueCat) vs. keeping premium web-only. This shapes
      the entire freemium implementation, so settle it before building billing.
- [ ] App Store metadata: name, subtitle, screenshots, privacy policy URL, support URL,
      age rating, and a **privacy nutrition label** (we collect email + learning data
      via Supabase — must be declared).

## Known integration caveats to handle during wrapping
- **Supabase email-confirmation deep links:** in a native shell the confirmation link
  must return to the app via a custom URL scheme / Universal Link (configure Supabase
  redirect URLs + Capacitor `appUrlOpen`). Alternatively use OTP / magic-link flows
  tuned for mobile. Plan this when billing/auth are finalized.
- **Audio autoplay:** mobile WebViews block audio without a user gesture — fine here
  since playback is tap-initiated, but worth testing once the TTS pipeline is live.
- **Offline:** consider caching the daily queue so a review session survives a dropped
  connection (Capacitor Preferences / SQLite) — a later enhancement, not a launch blocker.

## What can be done now without owner input
Scaffolding only — add Capacitor + `capacitor.config.ts` + `.gitignore` for the
generated `ios/`/`android/` folders, so the wrapper is ready the moment a bundle ID
and accounts exist. The native builds, signing, store metadata, and IAP wiring all
need the inputs above. Say the word and I'll add the scaffolding.
