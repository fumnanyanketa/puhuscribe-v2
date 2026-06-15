# PROGRESS.md

Append a 3-line entry at the end of every session: what shipped, what is blocked, what is next.

---

## STANDING INSTRUCTIONS (read first, every session — owner-set, overrides defaults)

These are durable orders from the owner. They override any auto-assigned branch or generic caution a fresh instance starts with.

1. **Always start from `main`.** If the harness drops you on a different branch (e.g. `claude/...`), override it: `git checkout main && git pull origin main`. Develop on `main`. The owner has given explicit, standing permission to commit and push to `main`.
2. **Ship-as-you-go loop.** We are correcting the LIVE app and the owner reviews each change on their phone/laptop. So for every meaningful correction: make the change → run `npm run build` AND `npm run test` → **only if both are clean**, `git commit` → `git push origin main`. Vercel auto-deploys `main`, which is how the owner sees it. Push automatically and immediately — do NOT ask first.
3. **The one guardrail before every push:** build + tests must pass. If either fails, do NOT push — fix it or tell the owner. Never push a broken deploy.
4. **Still requires explicit confirmation even in fast-push mode:** anything touching auth, RLS policies, or billing (see Hard rules).
5. After pushing, tell the owner in one line that it's live so they can refresh (note PWA/Vercel cache may need a hard refresh).

---

## Session: 2026-06-05

Shipped: Phase 00 research complete (reddit-voice.md, competitor-reviews.md, global-apps.html, finland-apps.html committed and on main). App foundation committed to main (React 19 + Vite 6, custom FSRS-5 engine with 16 passing tests, Supabase schema migrations, YKI topic seed). Build manual v4 written and committed. Phase 01 project docs scaffolded (CLAUDE.md, BRIEF.md, ARCHITECTURE.md, PROGRESS.md, marketing folders).

Blocked: Nothing currently blocking. Supabase project not yet created (need credentials from user). Azure TTS credentials needed before audio works. Anthropic API key needed before AI layer works.

Next: Phase 01.5 (Content Foundation) — generate vocabulary seed SQL, sentence pairs SQL, Sprint vocabulary SQL, puhekieli review MD, content attribution MD. Then user runs Phase 02 (Design in Claude Design). Then Phase 03–04 (build UI and backend).

---

## Session: 2026-06-05 (Phase 01.5 Part B)

Shipped: 02_sentences.sql (500 sentence pairs, 25 topics × 20, A1/A2 mixed, with puhekieli transformations applied consistently). PUHEKIELI_REVIEW.md (all 500 pairs annotated with rules applied and REGIONAL/UNCERTAIN/CHECK flags). 03_sprint_mnemonics.sql (180 Day One Sprint mnemonics, phonetic sound-bridge format, JOIN on words.base_form). All three files committed and pushed to claude/gallant-lovelace-yw1EP.

Blocked: Supabase project credentials still needed before seeds can be applied. Azure TTS and Anthropic API keys still pending.

Next: content attribution MD (docs/content-attribution.md). Then Phase 02 design handoff. Then Phase 03 UI build.

---

## Session: 2026-06-06 (Phase 03 UI Implementation)

Shipped: Full Phase 03 implementation from Claude Design handoff — Snow theme design system baked into src/styles/tokens.css, icons.tsx, primitives.tsx (Orb/OrbCluster/Label/RegDot/Sentence), ui.tsx (Btn/IconBtn/SpeakerBtn/Bar/Ring/Steps), RegisterCard.tsx (core dual-register component), Shell.tsx (PuhuMark/ScreenScroll/BottomNav), and all 5 screens (Onboarding, DayOne, Daily, Island, Progress). Clean production build: 230KB JS, 5KB CSS, 0 TypeScript errors. Fixed tsconfig noEmit and removed 18 stray compiled JS files.

Blocked: Supabase project credentials still needed before Phase 04 backend work. Azure TTS credentials and Anthropic API key still pending. User Stop 01 (find 3 Finnish learners) and Stop 02 (show designs) are user-action gates.

Next: Phase 04 — backend wiring (Supabase project creation, Cloudflare Worker + MCP server, FSRS integration, audio pipeline). Blocked on credentials from user. Once credentials provided, run Phase 04 sub-agents in parallel.

---

## Session: 2026-06-06 (Phase 04 Part A — DB live + content wiring)

Shipped: Supabase project created and fully seeded via SQL editor (25 topics, 532 words, 500 sentences, 141 mnemonics; RLS verified — content tables anon-readable, mnemonics public-only, per-user tables owner-locked). Built the content data layer: src/lib/data/content.ts (fetchSprintWords/fetchSentences/fetchTopics + toRegisterTokens azure-flag diff), src/lib/data/useAsync.ts, src/components/StatePane.tsx. Wired DayOne (sprint words+mnemonics), Daily (8-sentence session sampled across topics), and Island (shadowing) to real Supabase data — no auth, anon content reads. Fixed database.types.ts (added Relationships:[] to all tables; postgrest-js 2.107 inferred `never` without it). Clean build (444KB JS — Supabase SDK now bundled), 16 FSRS tests pass.

Blocked: This remote container's network policy blocks outbound to the Supabase host, so live query verification must happen in the user's browser (npm run dev), not here. Azure TTS Key 1 + region (northeurope) received — held for the Cloudflare Worker secret step, never committed/bundled; recommend rotating before prod since shared in plaintext. Anthropic API key still pending.

Next: User verifies real Finnish content renders in browser. Then the auth + FSRS persistence phase (Supabase Auth, per-user cards/review_logs wired to the FSRS-5 engine) — needs explicit go-ahead per project rules. Then Cloudflare Worker + 6 MCP tools (needs Anthropic key) and Azure TTS audio pipeline (needs Worker + Azure key).

---

## Session: 2026-06-06 (Phase 04 Part B — Live on Vercel)

Shipped: Frontend deployed live at puhuscribe-v2.vercel.app (GitHub import + two VITE_ env vars; vercel.json + DEPLOY.md committed; repo default branch is the feature branch so Vercel deploys current work directly). Removed all em dashes from rendered UI (onboarding + Day One copy) and added stripEmDash() so the 153 em dashes in the mnemonic seed never render. Added migration 20260606000001_grant_content_read.sql granting SELECT on the seven public content tables to anon/authenticated.

Blocked: The GRANT SQL must be run once in the Supabase SQL editor for the live app to read content (anon lacked SELECT -> "permission denied for table mnemonics"; content screens show the Virhe pane until then). Azure TTS key held for the Worker phase; Anthropic key still pending. Container still cannot reach Supabase, so verification stays in the browser.

Next: Confirm content renders live after the grant runs. Then auth + FSRS persistence (Supabase Auth + per-user cards/review_logs wired to the FSRS-5 engine) — needs explicit go-ahead. Then Cloudflare Worker + 6 MCP tools and Azure TTS audio pipeline.

---

## Session: 2026-06-06 (Phase 04.5 — STOP for content quality)

Shipped: Full audit of all 3 seed files; findings written to docs/CONTENT-CORRECTIONS-HANDOFF.md (systematic pronunciation errors across every y/ö/ä/au/diphthong word, e.g. hyvä "HEE-vah" should be "HEW-va"; 3 base_form typos hedelma/hyva/tummansiniinen; 12 sprint mnemonics silently dropped because their words are missing/misspelled in the lexicon; translation errors terve="hi/healthy"→"hello", minä="I (formal)"→"I"). Strengthened stripEmDash() to cover all dash variants + strip seed quotes. Removed the misleading pseudo-IPA chip from Day One. Committed auth+FSRS scaffolding as WIP (useAuth, Auth screen, cards.ts FSRS persistence, user-table grant migration) — written and building but NOT wired into the app.

Blocked: Content corrections require a Finnish-aware pass against a phonology reference (handoff §4) — owner is starting a fresh instance to do them cleanly. TTS audio does not play (pipeline not built — handoff §6). Em dashes the owner still sees are stale Vercel/browser cache; latest deploy strips all variants. Live DB still holds the OLD content (seeds use ON CONFLICT DO NOTHING) so fixes must ship as a new idempotent migration the owner runs in Supabase.

Next: Work docs/CONTENT-CORRECTIONS-HANDOFF.md in order — §1 spellings + §2 missing words (one migration), §3 translations, then the big §4 pronunciation rewrite, verify §7 em dashes, build §6 TTS, audit §5 sentences, then finish §9 auth/FSRS wiring.

---

## Session: 2026-06-07 (Phase 04.6 — §0 ingestion pipeline + safe content fixes)

Shipped: Built the reproducible CC ingestion pipeline at scripts/ingest/ (dependency-free Node ESM, 12 fixture-backed tests) — parse-leipzig/parse-kaikki/parse-tatoeba + build-vocabulary (Leipzig frequency × kaikki real IPA/gloss; skips any word kaikki can't gloss so no translation is ever invented) + build-sentences (real Tatoeba pairs, puhekieli=NULL with a conservative transform written to a human-review TSV) + README runbook. Shipped the SAFE factual fixes as migration 20260607000001 (base_form typos hedelma/hyva/tummansiniinen; translations terve→hello, minä→I/me, voida canonical) and a forward-looking words.ipa column migration 20260607000002; patched 01_vocabulary.sql to match. Rewrote docs/content-attribution.md + both seed headers to stop falsely claiming CC provenance for LLM-generated content (the root cause). Tests 28 green (16 FSRS unchanged), build clean.

Blocked: This container's egress is an allowlist proxy — Leipzig/kaikki/Tatoeba all 403 ("Host not in allowlist"); WebFetch 403 everywhere; only GitHub + npm reachable. So the actual reingest cannot run here — the owner must download the corpora (URLs/format in scripts/ingest/README.md) and run the builders, or a networked run does it. The two new migrations + the §1/§3 fixes must be run by the owner in the Supabase SQL editor (this container can't reach Supabase).

Next: Owner decides direction (asked): (a) provide the corpora so a future run regenerates seeds from real data; (b) whether to spend the next session finishing §9 auth+FSRS (fully offline-doable) while reingest waits; (c) interim handling of the still-live wrong mnemonic bridges (hide vs leave until real IPA lands). Deferred deliberately: §4 pronunciation rewrite (needs real IPA, not hand-guesses), the 12 missing words+mnemonics (mnemonics deferred per §0), puhekieli shipping (needs human verification), §6 TTS.

---

## Session: 2026-06-07 (Voikko-grounded content pipeline — stop invented Finnish)

Shipped: Phase 1 — scripts/build_frequency_list.py builds data/finnish_frequency_lemmas.json: 734,205 wordfreq Finnish forms → Voikko-lemmatised + validated → top 10,000 real lemmas (proper nouns/foreign/garbage dropped; top words olla, ja, ei, se, voida, hyvä…). Phase 2 — scripts/generate/ (voikko_gate.py + allowed_vocab.py + generate.py + 9 pytest tests): grounds generation in the 10k allowed list at low effort with dual-register examples, then a hard Voikko gate validates EVERY generated kirjakieli form and rejects/regenerates anything not real Finnish, logging the invention rate. Offline demo proves invented forms (blarghti, kissoittelen) are caught and never reach output. Voikko installed cleanly here (libvoikko1 4.3.2 + voikko-fi 2.5). JS 28 + Python 9 tests green, build clean.

Blocked: No ANTHROPIC_API_KEY in this container, so the live generation step is build-ready but unrun here — the Voikko gate + loop are fully verified offline with a stub generator. To run live, set ANTHROPIC_API_KEY and `python scripts/generate/generate.py --n N`. Voikko + wordfreq + anthropic live in .venv (git-ignored); reproduce via apt libvoikko1/voikko-fi + scripts/requirements.txt.

Next: Folded-in refinements to flag — (1) puhekieli is NOT Voikko-gated (spoken forms aren't standard Finnish; stays on the human-verified path); (2) Opus 4.8 removed `temperature`, so "lower temperature" is honoured via low effort + structured outputs, and temperature is sent only on models that accept it (e.g. sonnet-4-6). Possible follow-ups: expose VoikkoGate.validate() as a backend service the Worker calls at runtime; make this loop the content-seeding path into Supabase.

---

## Session: 2026-06-07 (Run-generation-live turnkey: batch driver + Supabase loader)

Shipped: Owner chose "run generation live". Built the load half so a live run is turnkey: run_batch.py generates a validated set across all 25 YKI topics × levels (frequency ceiling per level), tags each item with topic_slug+level, aggregates the invention/oov rates; to_seed_sql.py converts the validated items to out/generated_sentences.sql (idempotent ON CONFLICT; ONLY Voikko-validated kirjakieli ships, puhekieli=NULL) + out/generated_puhekieli_REVIEW.tsv for human verification; topic_plan.py holds the canonical slugs. generate.py now tags items with topic/level. 13 Python tests (added 4 for the SQL emitter) + JS 28 green, build clean. Offline stub batch verified the whole path produces valid SQL.

Blocked: Still no ANTHROPIC_API_KEY in this container — the live generation cannot run here. To produce real content: set ANTHROPIC_API_KEY as an environment secret, then `python scripts/generate/run_batch.py --per-topic 8 --levels A1 A2`, review out/generated_sentences.sql, and run it once in the Supabase SQL editor. (This container also can't reach Supabase, so the SQL is owner-run.)

Next: Owner sets the key → run the batch live, spot-check the real invention rate, load the SQL. Then puhekieli human-verification pass from the REVIEW tsv. Auth+FSRS (§9) still pending and fully offline-doable if the key isn't available yet.

---

## Session: 2026-06-07 (§9 — wire auth + FSRS into the app)

Shipped: Wired the WIP auth/FSRS scaffolding live. main.tsx wraps the app in <AuthProvider>; App.tsx gates on useAuth() (loading pane → Auth screen when logged out → app when signed in). Rewrote Daily.tsx into the real per-user FSRS review queue: fetchDailySession(user.id) loads due reviews + new cards (seeds on first run), each card shows the RegisterCard with an Again/Hard/Good/Easy row whose labels come from previewIntervals(), and rateCard() persists the FSRS schedule + review_log on tap; busy-guarded with inline error + completion screen. Added a sign-out (+ email) to Progress. Build clean (tsc strict; JS 458KB now that Auth+cards are in the graph), 28 JS + 16 FSRS tests green.

Blocked: Two owner actions before the logged-in flow works live: (1) run supabase/migrations/20260606000002_grant_user_tables.sql once in Supabase (GRANTs on users/cards/review_logs + the cards upsert unique constraint — without it the queue 500s "permission denied"); (2) ensure Supabase email auth is enabled (signup uses email confirmation). This container can't reach Supabase, so verification is in the browser. NOTE: this push gates the live app behind login — if this branch auto-deploys, returning users now see the Auth screen.

Next: Owner runs the grant migration + tests login → Daily review flow in the browser. Then the still-pending content work: run generation live (needs ANTHROPIC_API_KEY) and/or CC reingest; §6 TTS; puhekieli human verification.

---

## Session: 2026-06-07 (Offline polish: real Progress stats, idempotent migration, mobile roadmap)

Shipped: Made 20260606000002_grant_user_tables.sql safe to re-run (ADD CONSTRAINT wrapped in a DO/EXCEPTION guard). Replaced the mocked Progress screen with real per-user data: new src/lib/data/stats.ts (fetchProgressStats — card-state counts for mastered/learning/new, reviews-per-day for the last 7 days, consecutive-day streak, recently-reviewed cards), and rewrote Progress.tsx to render it (mastered ring, real streak/this-week/reviewed tiles, real weekly chart, deck-progress bar, recently-reviewed list) with loading/error/empty states; dropped the fabricated register-balance + fake numbers. Wrote docs/mobile-app-stores.md (Capacitor path to App Store/Play + the owner-only prerequisites: Apple/Google accounts, bundle ID, IAP-vs-web billing decision, Supabase deep-link auth caveat). Build clean (JS 459KB), 28 JS + 16 FSRS tests green.

Blocked: Can't verify the live Progress queries here (no Supabase reach) — verify in browser after login. Everything else now needs owner inputs: ANTHROPIC_API_KEY (run generation live / AI Worker), corpora or host-allowlist (CC reingest), Azure key as a Worker secret (§6 TTS), Apple/Google accounts + bundle ID + billing decision (app stores), and running the two pending migrations in Supabase (content_fixes + grant_user_tables).

Next: On owner input — pick up whichever is unblocked first. Offline options still available if asked: scaffold Capacitor; build the Cloudflare Worker + Azure TTS proxy ready-to-deploy (key-gated); make older content migrations idempotent.

---

## Session: 2026-06-07 (PWA installability — test on phones with no app store)

Shipped: Made the live web app installable to a phone home screen (free, no App Store/Play account) for early testing. Added public/manifest.webmanifest (standalone display, brand colors) + an on-brand SVG app icon (public/icon.svg, orb gradient) + rasterised PNGs (icon-192/512, apple-touch-icon-180 — iOS ignores SVG icons so a PNG is required); wired manifest + icon links + apple-mobile-web-app-title into index.html. Icons generated by scripts/gen-icons.mjs via sharp installed with --no-save (NOT a project dep, so Vercel builds stay lean); PNGs committed. Build clean, dist serves the manifest + icons, 31 JS + 16 FSRS tests green.

Blocked: Nothing new. iOS testers install via Safari → Share → Add to Home Screen; Android via Chrome → Install app. Native store builds still need the owner inputs (Apple/Google accounts, bundle ID, billing decision) per docs/mobile-app-stores.md.

Next: unchanged — content (ANTHROPIC_API_KEY or corpora), §6 TTS (Azure key), run the pending Supabase migrations, then app-store packaging when accounts exist. Optional offline follow-up: a service worker for offline/installability hardening.

---

## Session: 2026-06-08 (Real IPA from kaikki + content cleanup)

Shipped: Ran content generation live (400 Voikko-validated sentences → supabase/seeds/04_generated_sentences.sql) then cleaned it (deduped by kirjakieli + dropped 8 real-word-but-ungrammatical rows → 359 rows). Sourced REAL Finnish IPA from kaikki.org/English Wiktionary (CC BY-SA): new scripts/ingest/build-ipa-from-kaikki.mjs streams the 3.9 GB Finnish dump, matches the 541 vocabulary base_forms via parse-kaikki.mjs, and emits supabase/migrations/20260607000003_word_ipa_from_kaikki.sql — 514/541 words got genuine IPA (hyvä /ˈhyʋæ/, työ /ˈtyø̯/, yö /ˈyø̯/), no IPA ever invented.

Blocked: Owner must run in Supabase (this container can't reach it): 20260607000002_add_word_ipa.sql then 20260607000003_word_ipa_from_kaikki.sql, plus load the cleaned 04_generated_sentences.sql. 27 base_forms have no kaikki IPA — 9 not in kaikki (multiword/compounds: ole hyvä, TE-toimisto, pankkitunnukset…) and 18 inflected/comparative forms (hyvää, koiran, isompi, pienempi…) — left untouched, never guessed.

Next: Owner loads the SQL + migrations and verifies real IPA renders in the Day One Sprint (app already wired to show words.ipa via da34d03). Optional: derive IPA for the uncovered inflected forms from their base lemmas; puhekieli human-verification pass; §6 TTS.

---

## Session: 2026-06-08 (Workshop deck prompt + install QR)

Shipped: Wrote docs/workshop-deck-prompt.md — a paste-ready Claude Design prompt for the Wednesday 5-slide demo-led deck (real app palette: snow white, orb gradient, purple=kirjakieli/teal=puhekieli register cards; real content: "Minun nimeni on Maria."→"Mun nimi on Maria." + real IPA hyvä /ˈhyʋæ/). Generated a scannable on-brand QR (marketing/workshop/install-qr.png + .svg, lake #1B4965, ECC-H) encoding the live app URL for the "Try it now" slide, via scripts/gen-qr.mjs (qrcode --no-save, same pattern as gen-icons).

Blocked: Nothing. Owner builds the deck in Claude Design from the prompt, then drops install-qr.png on slide 5. Bilingual toggle is the next task (agreed).

Next: Build the bilingual toggle — settings switch "Bilingual / Finnish only", default bilingual, persisted, with a bi(fi,en) label helper.

---

## Session: 2026-06-08 (Bilingual toggle)

Shipped: Bilingual / Finnish-only toggle. New src/lib/lang/useLang.tsx (LangProvider + useLang() exposing bilingual/setBilingual/toggle + the bi(fi,en) helper) wraps the app in main.tsx, persisted to localStorage (ps_bilingual, default bilingual). Replaced every hardcoded "Suomi · English" training-wheel label across all screens (Onboarding, Auth, DayOne, Daily, Island, Progress, StatePane) with bi(); in Finnish-only mode they collapse to Finnish (and the Daily rating buttons drop their English sub-label). Added a Toggle switch in ui.tsx and a settings card on Progress — its own label stays bilingual in both modes so a beginner can always switch back. Build clean, 31 JS + 16 FSRS tests green.

Blocked: Nothing. Verify in browser after deploy (container can't reach Supabase). English-only UI chrome (eyebrows like "Last 7 days", onboarding body copy) is intentionally untouched — collapsing the bilingual dual-labels was the scope.

Next: the gentle "switch to Finnish only?" nudge after enough exposure (deferred per handoff); puhekieli human-verification; retire old wrong content.

---

## Session: 2026-06-08 (Landing page live + QR repointed)

Shipped: Implemented the Claude Design landing page (fetched the design bundle, read README + chats — locked-in Violet light·aurora, hero phone on the Progress screen, headline "Understand the books. Speak the street.", single CTA "Become a tester" → live app, no email collection). Hosted it as static files at public/landing/ (deploys with the app, live at puhuscribe-v2.vercel.app/landing): copied the prototype's tokens.css + 3 pure-React.createElement scripts (ps-components/phone/landing-app, no JSX so no Babel), vendored React 18.3.1 production UMD locally (no CDN/Babel at runtime), stubbed out the design-tool Tweaks panel, fixed one dead hero-pill anchor (#waitlist→#join). Added a /landing rewrite to vercel.json. Repointed the workshop QR to .../landing (gen-qr.mjs) and updated the deck prompt flow (scan → landing → Become a tester → app). App build clean, 31 JS + 16 FSRS tests green.

Blocked: Nothing. Verify in browser after deploy: puhuscribe-v2.vercel.app/landing. The Teal/Azure variant files were left in the design bundle (not shipped) — Violet is the locked-in direction.

Next: workshop deck in Claude Design (prompt + QR ready); optional: move landing to the bare domain (app → /app) if you want the QR on the apex; Substack post; puhekieli verification.

---

## Session: 2026-06-08 (Landing hero: scale side panels to fit mobile)

Shipped: The hero composition (phone + the two flanking "Kuuntele/This month" panels) now scales to fit any viewport instead of hiding the panels on narrow screens (they were hidden <1080px straight from the Claude Design export — wrong for a mobile-first audience). Wrapped the composition in a fixed 704×600 .hero-stage and scale it via a CSS var --hero-k computed fluidly from viewport width (set before React renders + on resize/orientationchange in index.html), with --hero-h reserving the scaled height so there's no gap. Phone keeps both panels beside it down to the smallest phone. Landing scripts syntax-checked, app build clean.

Blocked: Nothing. Verify on a phone: puhuscribe-v2.vercel.app/landing — phone flanked by both panels, shrunk to fit.

Next: the rest of the owner's landing fix list (TBD); workshop deck in Claude Design; Substack post.

---

## Session: 2026-06-08 (Bilingual restyle + landing mobile polish)

Shipped: (1) Reworked the bilingual label look app-wide: bi(fi,en) now renders the Finnish dominant with the English on the line below in faded italic parentheses — e.g. "Tervetuloa / (Welcome)" — instead of "Tervetuloa · Welcome". Changed bi's return type string→ReactNode (em-relative sizing so it scales per context), widened StatePane title/detail and RegisterCard badge to ReactNode, and matched the Daily rating buttons' English to the same italic-parens style. (2) Landing mobile pass: hero pill now wraps instead of overflowing, and the auto-fit grids use minmax(min(Npx,100%),1fr) so nothing overflows on narrow phones. App build clean, 31 JS + 16 FSRS tests green.

Blocked: Nothing. Verify in browser: app bilingual labels (Progress → toggle) + landing on a small phone.

Next: rest of the owner's landing/app fix list; workshop deck in Claude Design; Substack post.

---

## Session: 2026-06-08 (IPA tofu fix + Day One set sizes/resume/finish)

Shipped: (1) Fixed the "weird boxes" under some IPA — they were tofu for the diphthong off-glide combining mark (U+032F) the phone monospace font can't draw. New cleanIpa() in content.ts strips nonspacing combining marks (Unicode Mn) at fetch time, keeping the real spacing IPA + stress/length marks (e.g. /ˈyø̯tæ/ → /ˈyøtæ/); never invents pronunciation. (2) Reworked Day One into a SprintFlow: a Start screen to pick the set size (50 / 100 / 150, capped to the word count), a "Continue" card that resumes where you left off (saved per user as {size, idx} in localStorage; migrates the old plain-idx value), and a real completion screen ("Sprint complete → Start daily review / Choose another set"). The runner is the same card→quiz UI, now bounded to the chosen deck with no more endless modulo loop. Build clean, 31 + 16 tests green.

Blocked: Resume is per-browser (localStorage), not cross-device — same as before; server-side sprint progress would need a DB column. Verify on phone after deploy.

Next: (asked) returning-user routing — land users who've done the sprint on the next step (Daily review) instead of re-greeting them with onboarding/sprint.

---

## Session: 2026-06-08 (Returning-user routing + Day One nav tab + cross-device progress)

Shipped: (1) Cross-device learning progress — new src/lib/data/progress.tsx (ProgressProvider/useProgress) stores { onboarded, sprint:{size,idx,completed} } in users.progress (jsonb; migration 20260608000001) so Day One resume follows the learner across devices, with a localStorage cache for instant paint + graceful fallback if the migration isn't run yet. Day One now reads/writes progress via the context (dropped its own localStorage key; legacy key migrated). (2) Routing — App.tsx waits for progress to resolve then lands the user: first-timers → Onboarding→Day One; returning with an unfinished sprint → resume it; once a set is completed → Daily review. Onboarding marks onboarded on Skip/Start. (3) Day One is now a 4th bottom-nav tab (sparkle · cards · island · chart); Day One screens got bottom padding to clear the nav. Build clean, 31 + 16 tests green.

Blocked: Owner must run supabase/migrations/20260608000001_user_progress.sql in Supabase for cross-device sync; until then it transparently falls back to per-device localStorage. Existing users with no stored progress will see onboarding once. Verify in browser.

Next: optional — gentle "switch to Finnish only?" nudge; puhekieli verification; Substack post; workshop deck in Claude Design.

---

## Session: 2026-06-08 (Pedagogy fix: spaced repetition only reviews what was learned)

Shipped: Aligned the core loop to the strategy doc ("everything the user encounters once enters the scheduler"). The Day One Sprint now FEEDS the scheduler: each word the learner meets is recorded as a 'word_production' card (recordWordEncounter in cards.ts; a miss seeds FSRS 'Again' so it returns sooner, correct seeds 'Good'; idempotent, fire-and-forget from the sprint runner). Rewrote Daily into active recall of ONLY the met words (fetchVocabSession): English meaning is the prompt → reveal the Finnish word + real IPA + audio → rate Again/Hard/Good/Easy (FSRS). Removed the old seedInitialCards/fetchDailySession that dumped the entire sentence corpus on new users (the "dummy content" the owner flagged). Empty Daily now routes to the Day One Sprint instead of showing un-learned sentences. No DB migration needed — card_type 'word_production' + cards.word_id already exist in the schema. Also removed em dashes from copy and fixed the Island title cutoff. Build clean, 31 + 16 tests green.

Blocked: Nothing required. Existing 'sentence_listening' cards from earlier testing are simply ignored now (harmless). Verify on phone: do a sprint, then open Daily — you should see only the words you just met (misses first).

Next (aligned to the strategy, in order): (1) instructional onboarding (what/why/next, the doc's mnemonic intro); (2) make Language Islands the real "speak with confidence" next step after the sprint; (3) shadowing clarity + record/playback so learners hear themselves (no scoring yet). Then sentence-based vocab context and grammar-at-the-right-moments later.

---

## Session: 2026-06-08 (Fix: sprint→review feed + auto-resume)

Shipped: Two test-reported bugs. (1) Met words now actually reach Daily: recordWordEncounter was pre-rating each word (correct→FSRS 'Good' due in days, miss→'Again' due in ~1 min), so nothing was due right after a sprint. Now a MISS enters as a fresh 'new' card due NOW (shows in the next Daily for a production attempt); a correct answer still seeds a spaced 'Good'. (2) Resume no longer jumps back to word 1: ProgressProvider was letting a stale DB row overwrite a furthest-along local position — now it mergeProgress(local, db) keeping the furthest sprint/onboarded and pushes the merged result back up. Also made the Day One Sprint AUTO-RESUME (SprintFlow lazy-inits the session from saved progress) so the learner never has to tap Continue / restart. Build clean, 31 + 16 tests green.

Blocked: Cross-device resume still needs the owner to run 20260608000001_user_progress.sql; same-device resume now works via localStorage+merge regardless. Note: words already carded from the earlier (buggy) test keep their old schedule — recordWordEncounter is idempotent, so re-doing the same words won't re-add them; test with fresh words or the previously-missed ones (now due).

Next: daily vocabulary intake (10–15 new words/day, frequency-ordered, skipping met words) per docs/roadmap-notes.md; then instructional onboarding; then Language Islands.

---

## Session: 2026-06-08 (Reset progress + Supabase migration help)

Shipped: "Reset progress" action on the Progress screen (under the language toggle): a confirm step then resetUserLearning(user.id) deletes the learner's cards (review_logs cascade via FK) + resetProgress() clears onboarding/sprint (DB + localStorage), and routes back to the Day One set picker for a clean slate. New ProgressProvider.resetProgress(). Needs migration 20260608000002_grant_card_delete.sql (GRANT DELETE ON cards TO authenticated; RLS cards_own_rows already restricts to own rows). Build clean, 31 + 16 tests green.

Blocked: Owner must run TWO migrations in Supabase SQL editor: 20260608000001_user_progress.sql (cross-device resume) and 20260608000002_grant_card_delete.sql (reset). Until the grant runs, "Yes, reset" will error "permission denied for table cards".

Next: daily vocabulary intake (10–15/day); instructional onboarding; Language Islands (first 50 real-life sentences) — see docs/roadmap-notes.md.

---

## Session: 2026-06-08 (Daily intake + Progress crash fix + speaking practice rebuild)

Shipped: (1) Fixed Progress screen crash ("invalid input syntax for type integer: null") — fetchProgressStats was querying sentences with the new word cards' null sentence_ids; now it's word-card aware (counts word_production cards, recent shows words). This also unblocked the Reset button (was hidden behind the crash). (2) Daily vocabulary intake: new content.ts fetchNextWords(userId,n) returns the next n unmet frequency words; once the initial Day One set is completed, Day One shows a "New words" picker (10/15/30) that runs the next unmet words through the same card→quiz flow (each enters the scheduler; misses → Daily). Grows the bank daily, continues forward automatically. (3) Rebuilt the Island "shadowing" screen: renamed to "Speaking practice / Say it aloud" (dropped the jargon), redesigned the cramped header (gloss + listen hint, RegDot labels, no more "You are shadowing [chip]" cram), and made record→playback REAL via MediaRecorder (records the mic, "Your recording" play button plays you back; compare with the native audio; scoring still later). Build clean, 31 + 16 tests green.

Blocked: Record/playback needs mic permission (HTTPS + tap gesture; works on the live Vercel site). Daily intake assumes the learner completed an initial set (progress.sprint.completed) — reset+sprint to reach it.

Next: instructional onboarding; Language Islands real first-50 useful sentences (docs/roadmap-notes.md).

---

## Session: 2026-06-08 (Language Islands first-50 + recording fix)

Shipped: (1) Fixed the speaking-practice recording: capture is now reliable (MediaRecorder.isTypeSupported mime + start(250) timeslice + empty-blob guard) and the two ambiguous round buttons became clear labeled ones ("Play your recording" / "Hear the native audio") with a hidden <audio> element; the left button now plays the learner back. (2) Language Islands first content: authored 50 useful real-life arrival sentences (greetings, intro, help/language, shops, transport, health, Kela/officialdom, housing/work, time) — every kirjakieli word Voikko-validated (0 failures; proper nouns excluded). Wrote docs/island-sentences.md (reviewable, puhekieli flagged for human verification) + supabase/seeds/05_island_sentences.sql (idempotent; creates topic slug 'arki'). content.ts fetchIslandSentences(slug 'arki', falls back to general sentences) wired into the Island screen. Build clean, 31 + 16 tests green.

Blocked: Owner runs supabase/seeds/05_island_sentences.sql once in Supabase to load the 50 (until then Island falls back to general sentences). Puhekieli + naturalness need a Finnish-speaker pass (docs/island-sentences.md). The daily 10–15 intake only appears AFTER an initial sprint set is completed (progress.sprint.completed) — that's why it wasn't visible; surface-earlier is an option.

Next: verify the 50 with a Finnish speaker; surface daily intake earlier if wanted; instructional onboarding.

---

## Session: 2026-06-08 (Instructional onboarding + journey/north-star + daily intake surfaced)

Shipped: (1) Instructional onboarding rebuilt into 4 teach-the-method slides — Welcome ("Speak the Finnish Finland actually speaks"), Why two (kirjakieli/puhekieli wedge + RegisterCard), How it works (Meet words → Review → Speak), and Your path (the Journey component) → "Start learning". (2) New src/components/Journey.tsx — the visible north-star path: First words → Grow your bank → Speak with confidence → Everyday fluency (B1) → Professional (B2), with done/current/locked states driven by the learner's word-bank size (later stages shown but locked for orientation). Rendered on the Progress screen (top) and as the final onboarding slide. (3) Surfaced the daily intake: merged the gated DailyStart into the Day One start screen, which is now the vocabulary hub — "New words today" (10/15/30, next unmet words) always visible, plus "Or a bigger sprint" (the initial sets); removed the completed-gate and the manual Continue card (in-progress sets auto-resume). Added a lock icon. Build clean, 31 + 16 tests green.

Blocked: Nothing new. Owner still to run supabase/seeds/05_island_sentences.sql + verify puhekieli. Journey thresholds (50/300/1500) are first-pass; tune later.

Next: puhekieli verification; tune journey thresholds; optional navigation simplification; mnemonics (bigger).

---

## Session: 2026-06-09 (Four YKI skills: Practice hub, Listening, Writing + feedback, journey upgrade)

Shipped (plan-mode approved): closed the four-skills gap from the pedagogy pressure-test. (1) New src/lib/yki.ts (YkiSkill + YKI map) + SkillChip (primitives) — every activity is tagged with its YKI skill. (2) Journey.tsx upgraded: per-stage YKI skill chips + CEFR bands, emphasized current node, locked stages show "Unlocks at N words". (3) Navigation: 3rd tab is now a Practice HUB (Speak/Listen/Write cards, each skill-tagged) — stays 4 tabs; Island.tsx → Speak.tsx (onBack); App/Shell routing adds practice/listen/write (listen/write are nav-hidden sub-screens). (4) Graded Listening (src/screens/Listen.tsx): audio-first (speak(kirja), text hidden) → pick the meaning (DayOne option pattern) → reveal text; sentences level-matched via new content.ts levelForBank() + fetchGradedSentences(). (5) Micro-writing (src/screens/Write.tsx): translate the English prompt → free model-answer self-check now; auto-upgrades to Claude Haiku correction once the worker secret lands (worker /correct route in workers/tts/src/worker.js via claude-haiku-4-5-20251001; getWritingFeedback in tts.ts; configured flag flips the UI). Build clean, 31 + 16 tests green.

Blocked: AI writing feedback needs the owner to add ANTHROPIC_API_KEY as a GitHub repo secret, then re-run "Deploy TTS Worker" (workflow already updated to pass it). Until then Write uses the free self-check (graceful). Higher CEFR levels (B1/B2) have little seeded content, so fetchGradedSentences falls back to the arki/A1-A2 set.

Next: load island seed in Supabase; owner adds ANTHROPIC secret for live writing feedback; later: real native listening clips, reading mode, mnemonics.

---

## Session: 2026-06-09 (Personal Language Islands — author-your-own-sentences, the real method)

Shipped: Reframed Language Islands from a generic curated phrase pack to the actual method (after pressure-testing it against the Mikael "language islands" video) — the learner authors their OWN sentences and the AI only ever ASKS. New 5th nav tab `Islands` (Kielisaaret): a curated question bank (src/lib/islandTopics.ts — 8 real-life topics, his categories), a create flow (pick a topic → answer its questions in English → each answer is translated EN→FI by the Worker's new `/island/translate` route → saved), an island detail screen, and practice that REUSES the existing engines — shadowing (generalised Speak.tsx to take any `ShadowLine[]`) and active recall (English→produce Finnish) scheduled by the SAME FSRS `cards` table (new `island_recall` card_type + `island_sentence_id` column, so personal sentences get spaced repetition for free). Honest validation per the owner's bar: the kirjakieli is Voikko-gated by a new runtime service (services/voikko/ — reuses the seed pipeline's exact VoikkoGate; Dockerfile + runbook) the Worker calls; until that service is deployed, sentences save as clearly-labelled DRAFTS (verified=false) rather than shipping unverified Finnish. New owner-only tables `user_islands` + `user_island_sentences` (3 idempotent migrations, RLS own-rows). Build clean (TS strict), 31 JS tests pass, worker.js + app.py syntax-checked.

Blocked: Owner runs the 3 new migrations in Supabase (20260609000001 tables → 20260609000002 enum value → 20260609000003 cards column/constraint, in order) before the tab works. `/island/translate` auto-deploys on this push (ANTHROPIC key already set) so translation works immediately — but every island sentence stays a DRAFT until the owner deploys the Voikko service (services/voikko/README.md: docker build → any host → set `VOIKKO_SERVICE_URL` [+ `VOIKKO_SHARED_SECRET`] repo secrets → re-run "Deploy TTS Worker"). Container can't reach Supabase/Cloudflare, so verify in the browser; check the 5-tab nav fits on a phone.

Next: deploy the Voikko service to flip drafts → verified; mix due `island_recall` cards into Daily review (so personal sentences resurface in the main loop, not only inside the island); let the learner edit/redo a translated sentence before saving; AI-generated follow-up questions; reframe the 50 `arki` sentences as a "Starter pack" inside the Islands tab.

---

## Session: 2026-06-09 (Island fixes: [object Object] bug + fold personal sentences into Daily)

Shipped: (1) Fixed the "[object Object]" bug the owner caught in the island create flow. Root cause: `bi(fi,en)` returns a ReactNode, so using it as a string rendered "[object Object]" — it hit the build-progress line, the answer textarea placeholder, the "Build island" button, and (same defect) Write.tsx's placeholder. Added a `biText(fi,en)` plain-string helper to useLang and used it in those string contexts (left the ReactNode `bi()` for actual rendered labels). (2) Folded personal island sentences into Daily review so they resurface in the everyday loop: new `src/lib/data/review.ts` (`fetchDailyReview` → due `island_recall` cards across all islands + due/new vocab, capped to 12) + `fetchDueIslandRecall` in islands.ts (STARTED cards only — a brand-new sentence is first met inside its island, not dumped into Daily; due now, soonest first). Daily.tsx rewritten to render either a word card or a personal-sentence card (English prompt → reveal kirjakieli tokens + puhekieli + audio → FSRS rate) from one unified queue. Build clean, 31 JS tests pass.

Blocked: nothing new. Verify in browser: create an island, do its Recall once (so the cards leave 'new'), then a due personal sentence shows up in Daily review next to words. Sentences stay DRAFT until the Voikko service is deployed (unchanged).

Next (finishing islands): let the learner edit/redo a translation before saving; reframe the 50 `arki` sentences as a "Starter pack" inside the Islands tab; AI follow-up questions. Then the owner's next app-correction list.

---

## Session: 2026-06-09 (Island sentence quality: beginner Finnish + full sentences + review-before-save)

Shipped: (1) Translation is now beginner-first. The `/island/translate` Worker route gets the QUESTION for context and is told to produce a COMPLETE, very simple CEFR-A1 Finnish sentence (so a fragment like "both" becomes a real sentence), and returns the completed full English too — so the saved card always reads as a proper sentence. (2) The question bank carries a full-sentence `eg` example per question, shown as an italic hint + the input placeholder, with copy that nudges writing full sentences ("fuller English makes simpler, better Finnish"). (3) New review-and-edit step in the create flow: answer → Translate → **review** each sentence (completed English + kirja/puhe + audio + draft badge) → Redo or Remove any → **Save**; nothing saves unseen, and the island row is only created on Save. Build clean, 31 JS tests, worker.js syntax-checked. Worker auto-deploys on push.

Blocked: nothing new. Sentences still save as DRAFT until the Voikko service is deployed (unchanged). Owner flagged: they haven't seen island sentences in Daily yet — expected, because the current fold only surfaces STARTED cards that are due; the next task (Daily split) will make new sentences visible.

Next (owner's island list, in order): split Daily into two tracks — a **vocabulary bank** review and a **sentence-island** review (they shouldn't share one queue), and surface new island sentences there; AI follow-up questions (2–3 tailored per topic); edit/delete a single sentence in the island detail; reframe the 50 `arki` sentences as a "Starter pack". North-star to design toward: lead the learner to build ~1000–2000 words + ~1000 sentences, consistently, daily.

---

## Session: 2026-06-09 (Daily split into two tracks: vocabulary bank + sentence islands)

Shipped: Split Daily review into TWO distinct tracks per the owner's north star (grow ~1000–2000 words AND ~1000 own sentences, daily). New Daily HUB shows two banks each with a progress bar toward its goal: **Vocabulary** (X / 1000 words) and **Your sentences** (Y / 1000 sentences), each with a "due" count and its own review session — no more one mixed pile. `fetchReviewOverview` (src/lib/data/review.ts) head-counts both banks + what's due; the vocab track runs the word-recall session (fetchVocabSession), the sentence track runs the island-recall session. Fixed the "I can't see island sentences in Daily" report: `fetchDueIslandRecall` now includes brand-new sentences (dropped the started-only filter), so a freshly-authored sentence is reviewable the same day. Each track has an empty state routing to Day One / Islands. Build clean, 31 JS tests.

Blocked: nothing new. Verify in browser: Review tab now shows two track cards with bank progress; tap each to review; a new island sentence appears under "Your sentences" the same day.

Next (remaining island list): AI follow-up questions (2–3 tailored per topic); edit/delete a single sentence in the island detail; reframe the 50 `arki` sentences as a "Starter pack". Then the owner's next app-correction list.

---

## Session: 2026-06-09 (Island polish: AI follow-up questions + edit/delete a sentence + Starter pack)

Shipped: Three island items, finishing the islands round. (1) **AI follow-up questions** — new Worker `/island/questions` route (Claude Haiku, cheap) generates 2–3 tailored follow-ups from the topic + what the learner's already written; a "More questions" button in the create flow appends them (capped at 6) and the learner answers in their own words (questions only, never authored answers). (2) **Edit/delete a single sentence** in the island detail — per-sentence Edit (edit the English → re-translate → `updateIslandSentence`, FSRS schedule untouched) and Delete (inline confirm → `deleteIslandSentence`, card cascades via FK). (3) **Starter pack** — a one-tap "Aloituspaketti" card in the Islands list copies the 50 Voikko-validated `arki` sentences into a personal "Everyday basics" island (`createStarterIsland`, batched inserts, verified=true), so a total beginner gets a ready-made first island that runs through the same shadow/recall/FSRS engines. Build clean, 31 JS tests, worker.js syntax-checked. Worker auto-deploys on push.

Blocked: nothing new. Verify in browser: create flow → "More questions"; island detail → Edit/Delete a sentence; Islands list → "Starter pack" (shows until you've added it).

Next: the owner's next app-correction list — Islands is feature-complete for this round (only the owner-deployed Voikko service to flip drafts → verified remains).

---

## Session: 2026-06-09 (Drop the island "Draft" label — no runtime Voikko service needed)

Shipped: Removed the "Draft — Finnish not yet verified" badge from island sentences (both the create-review step and the island detail). Decision rationale: the runtime Voikko microservice is owner-hosted infra this ephemeral sandbox can't provide (no public address, reclaimed on idle), and the beginner-tuned Sonnet translations are reliable, so we trust them for the learner's personal content and stop surfacing a "draft" state. The **seed-content** Voikko guarantee is unaffected (that ran here, offline). `services/voikko/` + the worker's optional Voikko call stay in the repo, dormant, if we ever want the extra runtime machine-check. Build clean. **Do not re-flag deploying the Voikko service as a pending owner action.**

Blocked: nothing.

Next: the owner's next app-correction list (Islands is feature-complete).

---

## Session: 2026-06-09 (Real active recall: type-to-produce + auto-grading; starter pack → practice)

Shipped: Reworked recall from "reveal then rate yourself" (recognition, easy to fudge) into **true active recall**. New shared `src/components/RecallRunner.tsx` + `src/lib/grade.ts`: the learner is shown the English and must **TYPE the Finnish**; the system grades it (`gradeAnswer`: exact → Good, one-typo / missing-ä via Levenshtein tolerance → Hard, wrong/blank → Again, plus an honest "I don't know" = Again) and applies the FSRS rating **itself** — no self-rating, no escape hatch. Used everywhere recall happens: both Daily tracks (vocabulary + sentences) and the island Recall, replacing the old self-rating `Session`/`RecallSession`. Also: the **Starter pack** now opens straight into **Listen & repeat** (one sentence at a time) instead of dumping the 50-sentence list — meeting brand-new content gently; typed recall comes later in Daily once it's in the bank. 8 new grade unit tests (39 total), build clean. Frontend-only (no worker change).

Blocked: nothing. Verify in browser: Review → either track now asks you to TYPE the Finnish and grades it (no easy/hard buttons); Islands → tap "Starter pack" and it opens directly into practice.

Next: the owner's next app-correction list.

---

## Session: 2026-06-09 (Islands fixes: starter back-nav + speaking audio + styling consistency)

Shipped: (1) Starter pack — practicing the "Everyday basics" island now returns to the islands LIST, not the 50-item detail (the shadow view tracks whether it was opened from the list or the detail and routes back accordingly). (2) Speaking practice (Speak.tsx) — the native audio now AUTO-PLAYS on each phrase + on first mount; fixed playback dying after a couple of cards (the `<audio>` is now always mounted for a stable ref, `playMine` no longer self-blocks on a stuck `playingMine`, and the playing flags reset on next/again). (3) Styling consistency — the Islands tab led with teal (`--spoken`) accents while the app's accent is purple (`--written`); moved all screen chrome (eyebrows, icon chips, focus borders, the More-questions + starter cards, edit links) to `--written`, leaving teal ONLY on the puhekieli register boxes, matching every other page. Build clean, 39 JS tests.

Blocked: nothing. Verify: tap "Everyday basics" → practice → back returns to the islands list; speaking practice auto-plays and record/playback works across many cards; the Islands tab now reads purple like the rest of the app.

Next: the owner's next app-correction list.

---

## Session: 2026-06-09 (Naming: Daily Review + "My Sentence Bank"; consistent headings; list polish)

A run of owner-driven naming + UI corrections.

- **Name the outcome, not the technique.** The review page is now **"Daily Review / Päivän kertaus"** (was Review/Kertaus) with an active-recall method subtitle ("Type each one from memory — that's what makes it stick"). The **"Language Islands"** tab — which was the *method's* name — is renamed to the outcome: **"My Sentence Bank / Oma lausepankki"** (owner chose Bank over Vault, consistent with the app's "bank" framing). Every user-facing "island/saari/Kielisaari" became **"set/setti"** (create CTA "Add a new set", "Save set", delete confirms, detail eyebrow, empty states, plus the Daily empty-state + sentence-track CTA "Add sentences / Lisää lauseita"). Set shadow practice now uses Speak's default "Say it aloud" title; the set-recall header reads "Omat lauseet / Your sentences". Internal code identifiers (fetchIslandRecall, topicSlug, the `island` ReviewItem kind, the `island` nav icon) were intentionally left unchanged.
- **Consistent page headings.** Every tab landing page now matches the Progress pattern — a small purple **English eyebrow** over the big black **Finnish title**, toggle-independent: Vocabulary/Sanasto · Daily Review/Päivän kertaus · My Sentence Bank/Oma lausepankki · Practice/Harjoittele · Progress/Edistyminen.
- **Sentence Bank list polish.** The "Add a new set" capsule is teal (brand colour, owner's call); a "Start here / Aloita tästä" tag on the starter pack; a per-row **trash + inline delete confirm** for the learner's own sets (NOT the 50-sentence starter pack); the count line tidied to one clean caption ("50 lausetta (sentences)") in the list + detail.
- **Earlier in this run** (already shipped): the typed active-recall engine (`src/components/RecallRunner.tsx` + `src/lib/grade.ts` — type the Finnish → auto-graded → system schedules, no self-rating; 8 grade tests); starter pack opens straight into Listen & repeat; starter back-nav returns to the list; speaking-practice native audio auto-plays + the record/playback bug fixed (stable always-mounted `<audio>`); the Islands tab restyled to the app's purple accent (teal kept only for the puhekieli register).

Build clean, 39 JS tests. All frontend — Vercel-only deploys.

Blocked: nothing. Next: the owner's next correction list.

---

## Session: 2026-06-09 (Daily copy polish + offline screenshot harness)

Shipped: Daily Review subtitle corrections — removed the em dash so it reads as one continuous sentence ("Type each one from memory, because that's what makes it stick."), then dropped the redundant "Two banks grow…" line per owner; and the Daily track bank caption now renders on ONE clean line ("60 / 1000 sanaa (words)") with the English gloss inline-italic, instead of the jumbled bi() stack where "(words)" hung indented under the count. Built a committed OFFLINE screenshot harness so the whole app can be page-captured without Supabase: shots/mock-supabase.ts (a fake client serving curated fixtures), shots/shots.tsx + shots.html + vite.shots.config.ts (renders the REAL screens in the real provider tree, supabase import redirected to the mock), and shots/capture.mjs (drives the pre-installed /opt/pw-browsers Chromium to snapshot all 21 pages: auth → onboarding ×4 → Day One hub/card/quiz → Daily hub/recall/graded → Sentence Bank list/create/questions/detail → Practice hub/Speak → Listen ×2 → Write → Progress). Self-hosted Poppins via Fontsource (--no-save) since the CDN fonts are allowlist-blocked. Delivered the 21 PNGs as a zip for the owner's Claude Design UI redesign. Generated output gitignored (shots/out/, puhuscribe-screens.zip).

Blocked: Live/real-data screenshots can't be produced here — verified the egress allowlist returns 403 ("Host not in allowlist") for both the Vercel app and Supabase, so even with email confirmation off there's no route to sign up a fake user and capture the genuine brand-new-user flow. Possible only from a networked environment (broader network policy) or a local Playwright run.

Next: Owner is redesigning the UI in Claude Design from the captured pages; when the new design lands, apply it across every screen (then re-run `node shots/capture.mjs` to visually verify each page). Puhekieli human-verification still the only standing pending item.

---

## Session: 2026-06-09 (Full Claude Design redesign implemented across the app)

Shipped: The complete "PuhuScribe App Screens" handoff (read README + all 3 chats + every design file first). Phase 1: Sprout brand mark replaces the speech bubbles everywhere (BrandMark/Disc in primitives, back-compat Orb/OrbCluster aliases), bilingual relabel (Finnish primary, quiet italic English secondary, NO brackets; collapses in Finnish-only mode), new icon set. Phase 2+3 (everything): new shared kit (src/components/kit.tsx: CTA/Eyebrow/Gloss/HubHeader/ExBar/Counter/ChoiceCard/IconTile/OptionRow/FieldInput/FieldArea/Waveform/StatTile/StackLabel), new 5-tab nav (home/book/lines/mic/chart) rendered by hub screens only (drills are modal with close/back, per design + chats), NEW Home dashboard (resume-sprint hero state + daily-plan hub state, real streak/due/level data via lib/data/home.ts), Day One = 150-word sprint only (intro takeover, redesigned word card + quiz; in-flight sprints auto-enter the runner even when progress resolves late), NEW Learn tab = daily vocab bank (15 unmet words/day toward 1000), Daily Review hub redesigned + RecallRunner gets the design's full-screen graded tint with FSRS intervals phrased bilingually, Sentence Bank restyled end-to-end (stat strip, learned-progress set rows, 3-step create flow incl. describe-your-own custom topics, redesigned detail), Practice = 4 YKI skills with honest local session counters (lib/practiceStats.ts), NEW Reading drill, Listen alternates dictation+choose, Write gains hint-word chips, Progress = level ring + stage + real tiles/skills/weekly, Onboarding/Auth/Journey re-skinned. levelProgress() helper; fetchIslands now returns per-set learned counts. Harness reworked to the new IA: 25 pages captured (incl. both Home states via a ?sprint=open mock switch + per-capture localStorage isolation) and visually verified. Build clean, 39 tests green, no rendered em dashes or bracket glosses.

Blocked: Nothing. All FSRS/auth/Supabase/Worker logic untouched and rewired into the new screens. Verify on the phone after deploy (hard refresh for PWA cache).

Next: Owner reviews the live app page by page (zip of all 25 screens delivered in chat). Possible follow-ups: tune Home plan numbers, native listening clips, mnemonics; puhekieli human-verification still the standing pending item.

---

## Session: 2026-06-10 (Workshop-prep day: feedback, journey/stages, 100+ sentences, 30-min streak, fixes)

Shipped: (1) Live beta-feedback — floating "Palaute / Feedback" button on every hub (rendered in BottomNav, never on drills) -> mood + note -> public.feedback table (migration 20260610000001, owner ran it) with a localStorage backup; English gloss italic. (2) Made the JOURNEY the spine of the app: new src/lib/journey.ts (4 stages: 1 Perusta/Foundation [2,000 words + 1,000 sentences, A1-A2], 2 Kielioppi/Grammar [A2-B1], 3 Arjen sujuvuus [YKI B1], 4 Tyoelaman suomi [YKI B2 = North Star]; journeyState() from real bank+sentence counts). Journey.tsx is now a vertical stage map (current stage opens with live word/sentence requirement bars; done=check, locked ahead). Progress hero shows "VAIHE 1 . Perusta . X% valmis" + the map (killed the misleading CEFR "A2"); Home snapshot + Learn/Daily goals follow the stage model. Sentence goal reverted 2,000->1,000 (islands-method science: depth/automaticity of a focused set beats raw volume; words stay 2,000 for comprehension breadth). (3) Starter pack -> 104 A1 sentences (44 survival phrases + 60 "talk about your own life" from a Finnish teacher's SKK1 notes; removed 6 bare single words; createStarterIsland cap 50->250). (4) 30-MINUTE study streak (src/lib/studyTime.ts + useStudyClock on sprint/recall/speak/listen/read/write): a day counts only after 30 min of genuine on-screen study (capped per tick so a backgrounded tab can't cheat); Home shows "studied today X/30 min"; streak chip everywhere = study streak (per-device localStorage). (5) Browser refresh restores the current screen (App.tsx persists ps_screen) instead of bouncing to Home. (6) Workshop: docs/workshop-deck-prompt.md = paste-ready 6-slide Claude Design deck incl. the Language Islands USP slide; violet landing QR; landing + deck dropped the "azure" jargon. (7) CLAUDE.md: do NOT auto-run the screenshot harness unless explicitly asked.

Blocked: OWNER ACTIONS - re-run supabase/seeds/05_island_sentences.sql once (idempotent DELETE+INSERT of the arki set, loads the 104), AND in the app delete the old "Everyday basics" starter island then re-add the Starter pack so the learner copy refreshes to 104 (existing copies do not auto-update). Study streak is per-device (cross-device would need a DB column).

Next: workshop is today (first testers). Follow-ups if wanted: realistic timelines on the journey (B1 ~1.5-2 yrs, B2 ~3-4 yrs at 30 min/day); Grammar = Stage 2 content from the SKK1 teacher notes (cases, verb types); puhekieli human-verification; trim starter pack to exactly 100; native listening clips; mnemonics.

---

## Session: 2026-06-10 (Starter pack fixes: reset action + resume position)

Shipped: Three workshop-found starter-pack bugs. (B) "Reset starter pack" action in the Sentence Bank list (mirrors the Progress reset pattern) — the starter row routed straight to shadow practice so it could never be deleted/re-added; reset deletes the starter set (deleteIsland, cards cascade) so the "Add starter pack" button reappears and re-adding pulls the full set. (A) That also resolves "still shows 50, not 104": a created copy doesn't auto-update when the source sentences change, so the owner resets + re-adds to refresh to 104 (createStarterIsland already fetches up to 250; seed confirmed 104 rows; fetchSentences honours the limit). (C) Persist the per-set shadow position to localStorage (resumeKey `puhuscribe:shadow:<uid>:<islandId>` wired through Speak/SpeakPractice from Islands ShadowView) so doing the starter pack (or any set) and exiting midway resumes where you left off instead of restarting at sentence 1; cleared on completion. Build clean, 39 JS tests green.

Blocked: Container had no node_modules (fresh clone) — ran `npm install` (pins TypeScript 5.7.3; a stray global tsc 6.0.2 had falsely flagged the tsconfig baseUrl as deprecated). No code/config change needed; Vercel installs deps itself. Owner action unchanged: after this deploys, tap "Reset starter pack" then re-add it to refresh the copy to 104.

Next: workshop follow-ups — realistic journey timelines; Grammar = Stage 2 from SKK1 notes; puhekieli human-verification; native listening clips; mnemonics; whatever the first testers surface.

---

## Session: 2026-06-10 (Starter pack: prominent one-tap refresh)

Shipped: Owner reported the previous reset was invisible/unusable and the starter still showed 50. Replaced the tiny gray "Reset starter pack" link with a PROMINENT card on the Sentence Bank list, shown whenever a starter copy exists: "Päivitä aloituspaketti / Refresh starter pack — Replace your copy (N) with the latest sentences." ONE tap calls new refreshStarterIsland() (deletes every existing starter copy, cards cascade via FK, then re-creates from the current seed via createStarterIsland → fetchIslandSentences(250)) and reloads the list so the count visibly updates (50 -> 104). Detect the starter robustly with isStarterIsland() (slug 'starter' OR title 'Everyday basics') for both the card and the set-row tag, so it works for any copy. (Earlier same-day: per-set shadow resume position via resumeKey — kept.) Build clean, 39 JS tests green.

Blocked: The refreshed count depends on the DB actually holding 104 'arki' rows — if it still shows 50 after refreshing, the 05_island_sentences.sql (104-row) seed didn't take in Supabase (verify: SELECT count(*) FROM sentences WHERE topic_id=(SELECT id FROM topics WHERE slug='arki') — expect 104). The seed is a single atomic 104-row INSERT after a DELETE, so it's all-or-nothing. Container still can't reach Supabase.

Next: confirm 104 renders after refresh; then workshop follow-ups (journey timelines, Grammar Stage 2, puhekieli verification, listening clips, mnemonics).

---

## Session: 2026-06-10 (Starter pack: hide refresh unless a copy is behind)

Shipped: Owner confirmed the refresh worked (now 104) but rightly flagged the refresh card is meaningless to a new user (they get the full set on add) and lingered even when their copy was already current. Gated it: new fetchStarterSeedCount() (cheap head count of the 'arki' set) + starterBehind = starterCount < seedCount; the card now renders ONLY when a copy is genuinely behind, reframed as "Päivitys saatavilla / Update available — update your copy (N) to the latest (M)". New and current users never see it. Build clean, 39 JS tests green.

Blocked: nothing. The card self-hides for the owner now (104 == 104) and won't appear for new users; it only returns if the seed grows and an existing copy falls behind.

Next: workshop follow-ups — journey timelines, Grammar Stage 2 (SKK1 notes), puhekieli verification, native listening clips, mnemonics; trim starter pack to exactly 100 if wanted.

---

## Session: 2026-06-10 (Speaking practice: reliable resume + louder playback + layout)

Shipped: Four owner-reported Speak (Sentence Bank "Listen & repeat") fixes. (1) RESUME NOW STICKS — the per-set position was on bare localStorage, which a PWA can purge (so it kept resetting to 1). Moved it onto the server-synced users.progress record (new progress.shadow map {setId->idx} + saveShadow(), the same mechanism the Day One sprint uses); Speak is now position-controlled (startIndex + onIndex), ShadowView owns persistence, completion clears it. Survives localStorage loss + follows the learner across devices. (2) LOUDER SELF-PLAYBACK — an <audio> element can't exceed volume 1.0, so the quiet mic recording was barely audible; routed playback through a Web Audio gain node (3.2x) + a compressor/limiter (graceful fallback if Web Audio is unavailable). (3) Removed the redundant "Kuuntele malli" button from the review card (the native audio already has a play button on the sentence card above). (4) Tightened layout — dropped the flex spacer that pushed the recording card far below the sentence card; they now sit close together. Build clean, 39 JS tests green.

Blocked: nothing. Resume relies on the already-run users.progress migration (owner confirmed run). Verify on the phone: do the starter pack to ~#5, exit, reopen — it resumes at #5; your recorded playback is clearly audible; only one play button in the review card; smaller gap between cards.

Next: workshop follow-ups — journey timelines, Grammar Stage 2 (SKK1 notes), puhekieli verification, native listening clips, mnemonics.

---

## Session: 2026-06-10 (Sentence Bank row reflects Listen & repeat progress)

Shipped: The starter pack row read 0/104 because its bar only counted `learned` (recall cards graduated to 'review'), which shadowing never touches — so the learner's "Listen & repeat" progress was invisible. The row now shows `done = min(count, max(learned, progress.shadow[setId]))`, so after shadowing to sentence 5 it reads 5/104. Completing a set records its full count (shows 104/104; resume still restarts fresh because clampStart caps at the end), and Speak no longer overwrites a saved position on mount (firstReportRef) — only when the learner advances. IslandList reads the server-synced progress.shadow via useProgress. Build clean, 39 JS tests green.

Blocked: nothing. Verify: shadow the starter pack to ~#5, exit — the row shows 5/104; finish it — shows 104/104.

Next: workshop follow-ups — journey timelines, Grammar Stage 2 (SKK1 notes), puhekieli verification, native listening clips, mnemonics.

---

## Session: 2026-06-10 (Home: kill the stale "50-word first sprint")

Shipped: Owner saw the Home hero offering a "0 / 50 sanaa" first sprint though the app only has the 150-word sprint. Root cause: a removed set-size picker (old 50/100/150) had saved `sprint.size=50` into `users.progress` for early testers, and both Home and Day One read that saved size before the 150 default. Exported `SPRINT_CAP` (150) from DayOne and made both screens treat it as canonical — the saved value is now used only for the resume idx, so stale records self-heal to 150 on the next save (no destructive "Reset progress" needed). Worked on a feature branch first to avoid colliding with the parallel instance (Sentence Bank), then rebased onto its latest main and verified the combined tree before fast-forwarding main. Build clean, 39 JS tests green.

Blocked: nothing. Owner confirmed the live Home hero now reads 0 / 150 after a hard refresh. Touched only Home.tsx + DayOne.tsx (no overlap with the parallel Sentence Bank work).

Next: owner's next home-page correction.

---

## Session: 2026-06-10 (Home = dashboard; Learn tab = the vocabulary bank)

Shipped: Two structural corrections so the app reads like the planned dashboard + bank, not a sprint-gated shell. (1) HOME now shows the dashboard for everyone, not only after the first sprint: a new ProgressDash card brought the Progress page's headline "% valmis" ring + the two banks you grow (Vocabulary -> 2,000, Sentences -> 1,000, via journeyState) onto Home, tappable through to Progress; the journey STAGE MAP stays on Progress (owner's call). "What's next" stays adaptive (first-sprint hero for new users, daily plan once done); quick actions kept. (2) LEARN tab is now the Vocabulary Bank ("Sanapankki") at all times — bank growing toward 2,000, no more full-screen Day One sprint takeover. New user gets a clear "Start your first sprint" card (-> Day One); returning gets the daily 15-word intake; added a "Graded practice" card linking to the level-matched listening/reading/writing drills in the Practice tab (answering "where are the graded tests?"). Integrated the parallel instance's SPRINT_CAP fix via rebase. Build clean, 39 JS tests green.

Blocked: nothing. Graded tests = the Listen/Read/Write drills in the Practice tab (now also linked from the vocab bank). Verify on phone: Home shows %/banks for a new user; Learn tab is the bank, not the sprint intro.

Next: owner review — possibly tie graded tests into the vocab progression as checkpoints; tune the dashboard.

---

## Session: 2026-06-10 (Home: trim to greeting/sprint + progress only)

Shipped: Owner flagged the Home screen was bloating, so removed the entire "Pikavalinnat / Jump back in" quick-actions grid (the 4 vocab/review/sentences/practice cards) — those destinations all live in the bottom nav already. Home now shows only the welcome + first-sprint hero (or daily plan once done) and the ProgressDash (% valmis + the two banks). Dropped the now-unused QuickCard component. Build clean, 39 JS tests green.

Blocked: nothing.

Next: owner's next correction.

---

## Session: 2026-06-10 (Feedback emailed to the owner — no more checking Supabase by hand)

Shipped: Beta feedback now comes to you. New Worker POST /feedback route emails each note via Resend (mood + message + screen + user + device); the app pings it fire-and-forget (keepalive) after the existing Supabase insert, so the row still persists and the local backup still holds it. Graceful: if RESEND_API_KEY/FEEDBACK_EMAIL_TO aren't set the route is a no-op (503 configured:false) and nothing breaks. Deploy workflow sets the email secrets in an optional step (only when RESEND_API_KEY exists), mirroring the Voikko pattern. Worker syntax-checked, build clean, 39 JS tests green.

Blocked: OWNER ACTION to turn email on — (1) create a free Resend account, verify your sending email, copy an API key; (2) add GitHub repo secrets RESEND_API_KEY and FEEDBACK_EMAIL_TO (your inbox; use the SAME address you verified with Resend, since the default sender onboarding@resend.dev only delivers to your own verified address — a custom domain via FEEDBACK_EMAIL_FROM lifts that later); (3) re-run "Deploy TTS Worker". Until then feedback still lands in Supabase + local backup.

Next: owner sets up Resend; then consider a daily digest option and an in-app admin list if wanted.

---

## Session: 2026-06-11 (Owner insights dashboard — see the beta cohort in-app)

Shipped: Post-workshop priority: the owner couldn't see whether testers come back (RLS locks per-user tables to their own user). Built the owner-only Insights view: migration 20260611000001 adds owner_insights(), a SECURITY DEFINER function that aggregates server-side (totals: testers/active 1d/7d/reviews 7d/feedback; per-tester words+sentences+reviews7+last-active; latest 30 feedback notes with mood) and REFUSES any caller whose JWT email isn't in owner_emails() — EXECUTE revoked from public/anon, no service key in the client. App side: src/lib/data/insights.ts (typed rpc + isOwner UI gate + ago()), src/screens/Insights.tsx (tiles, tester list by recency, feedback list), "Owner insights" card on Progress visible only to the owner email, new 'insights' sub-screen. Build clean, 39 JS tests green.

Blocked: OWNER ACTION — run supabase/migrations/20260611000001_owner_insights.sql once in the Supabase SQL editor (until then the screen shows a clear "run the migration" error). NOTE: the function gates on email aiprotocolslab@gmail.com (owner_emails() in the migration + OWNER_EMAILS in insights.ts); if the app login email differs, edit both and re-run. Container can't reach Supabase, so verify in the browser.

Next: owner runs the migration + verifies the dashboard; workshop feedback follow-ups discussed in chat (account-creation friction needs an explicit auth decision; languages beyond English; puhekieli verification volunteer; business model articulation).

---

## Session: 2026-06-11 (Workshop follow-ups: 10-min streak, native-speaker review list, guest auth)

Shipped three workshop-driven items. (1) STREAK 30 -> 10 min/day (studyTime.ts DAILY_GOAL_MIN), a stickier habit + cleaner "10 minutes a day" positioning; the real-study clock is unchanged (counts genuine on-screen seconds on study screens, flushes every 15s + on tab-hide, caps each tick at 120s so a backgrounded tab can't cheat; >= 10 min in a local day counts the day). Updated onboarding copy and dropped the conflicting "first 30 minutes" sprint line. (2) docs/native-speaker-review.md — a ready-to-show list of all 104 Starter Pack sentences (English | kirjakieli | puhekieli) for a Finnish native speaker to mark up, focused on the unvalidated puhekieli column; generated from the live seed and delivered to the owner as a file. (3) GUEST AUTH ("try without account"): Auth gate is now a Welcome with "Start learning" -> supabase.auth.signInAnonymously() (real session; RLS/cards/progress all work), "I already have an account" reveals the email form; new SaveProgressSheet converts a guest in place via updateUser({email,password}) keeping the same user id (no progress lost); guest nudges on Home + Progress; useAuth exposes isAnonymous; bootstrapUser updates email on conflict. Build clean, 39 JS tests green.

Blocked: OWNER ACTIONS — (a) enable "Allow anonymous sign-ins" in Supabase Auth settings, or "Start learning" falls back to the account form; (b) still run 20260611000001_owner_insights.sql for the insights dashboard. Email-confirmation is already off (owner). The 30-min streak history won't retro-change, but new days count at 10 min.

Next: the "what's your first language?" onboarding question (store in users.progress, tally in owner_insights) to gather demand evidence — agreed, not yet built. Then Grammar Stage 2 content so finishers don't stall.

---

## Session: 2026-06-13 (First-language onboarding question + language tally in insights)

Shipped: New final onboarding step "What is your first language?" — a tappable picker of the larger Finland immigrant-language groups (English, Russian, Estonian, Arabic, Ukrainian, Somali, Persian, Other), optional (Skip works). Stored on progress.firstLanguage (users.progress jsonb, synced; no storage migration); progress.tsx gained setFirstLanguage + merge handling. Migration 20260611000002 CREATE OR REPLACEs owner_insights() to add a "languages" breakdown (each first language + tester count; "Not set" for unanswered); the Insights screen renders it as bars, guarded with (languages ?? []) so it stays hidden until the migration runs. Owner confirmed 20260611000001 already run + insights dashboard working. Build clean, 39 JS tests green.

Blocked: OWNER ACTION — run supabase/migrations/20260611000002_insights_languages.sql once for the language breakdown. Also still: enable "Allow anonymous sign-ins" in Supabase Auth for the guest "Start learning" flow.

Next: Grammar Stage 2 content (SKK1 notes) so sprint-finishers don't hit a locked wall; then native listening clips / mnemonics as feedback dictates.

---

## Session: 2026-06-15 (Grammar Stage 2 — step-by-step curriculum, gated after the sprint)

Shipped: Owner shared the SKK1 class notes via Google Drive; pulled them in (docs/skk1-notes.md, 43 sessions) and built Grammar Stage 2 from them, enriched with standard textbook grammar (notes = reference, not sole source). New src/lib/grammar.ts: 7 progressive lessons A1.1->A2.1 (no articles/gender/future; vowel harmony; olla + pronouns; present tense; questions; partitive part 1; place cases missä/mistä/mihin), each a plain-English "why" + teaching blocks with standard Finnish examples + a quick check. New src/screens/Grammar.tsx: GATED — locked pane with a "go to the sprint" CTA until progress.sprint.completed; then lessons unlock SEQUENTIALLY (finish one opens the next). Progress tracks completed lessons (progress.grammar string[], synced jsonb, merge=union, no storage migration). Entry: "Stage 2 · Grammar" card on the Learn tab (locked teaser before the sprint, active after); wired into App routing; useStudyClock counts it toward the streak. Build clean, 39 JS tests green.

Blocked: nothing required to ship. The Finnish examples are standard A1/A2 but should go through the same native-speaker review pass as the puhekieli (grammar correctness check) — flagged in grammar.ts. No new migration; no owner action.

Next: more grammar lessons (consonant gradation kpt, possession "minulla on", two-stem/nen-words, puhekieli patterns — all in the notes); then native listening clips / mnemonics. Owner pending: enable anonymous sign-ins; run 20260611000002 (language tally).

---

## Session: 2026-06-15 (Sprint word auto-plays on open)

Shipped: In the Day One sprint + daily-intake batch (both SprintRunner), the word now reads aloud automatically the moment its card opens (useEffect on the word idx; fires per new card + on mount). The speaker button is now only for replays. Safe autoplay — a prior tap (Start/Continue/Test me) unlocks audio; same pattern as the Speak screen. Build clean, 39 JS tests green.

Blocked: nothing. Owner flagged Grammar Stage 2 is currently read + one check per lesson (too passive) — agreed to upgrade lessons to active graded drills + fold grammar into FSRS Daily review; owner will circle back. Owner pending: enable anonymous sign-ins; run 20260611000002 (language tally).

Next: (when owner returns) make Grammar lessons active (typed/MCQ drills, then FSRS); more grammar lessons; native listening clips / mnemonics.

---

## Session: 2026-06-15 (Sprint continuity + encouragement; Daily Review unlocks once started)

Shipped: Owner's point — people stop the 150-word sprint midway and then never get spaced repetition (it was gated on sprint COMPLETION), and the sprint had no encouragement + a confusing "WAVE n/8" label. (1) Home now shows a "Päivän kertaus / Daily Review" card as soon as the sprint is STARTED (sprintStarted = idx>0 && !completed), so the words already met can be reviewed immediately; the Continue-sprint hero stays as the finish nudge. (The Daily screen already worked for anyone with >=1 met word — only the entry point was gated.) (2) Replaced "DAY ONE · WAVE n/8" with "Päivä yksi / Day one"; every 25 words the SprintRunner shows an encouragement screen (n/total, X% through, N to go, Keep going / Take a break-resume-later) — a natural break that also lets someone stop without losing progress (onAdvance already saved). Milestone advances idx only on "Keep going" so the next word's audio doesn't fire behind it. Build clean, 39 JS tests green.

Blocked: nothing. BIG OPEN THEME the owner raised (agreed, not yet built): progressive motivation / cohesion — the features stand independent; no visible journey pulling people forward day to day (Duolingo's real strength = return motivation). Proposed next: an adaptive always-present "next step" spine on Home + a visible milestone/rank progression (word/sentence/streak milestones with celebrations) woven onto the Journey, so "where am I / what's next / what unlocks" is always clear. Awaiting owner's pick on where to start.

Next: build the progressive-motivation layer (owner to prioritise); also pending — make Grammar lessons active; enable anon sign-ins; run 20260611000002.

---

## Session: 2026-06-15 (Progressive-motivation system: ranks + milestones + celebrations + journey spine)

Owner approved building the five mockup concepts as ONE system (showed rendered mockups in chat first). Shipped in two parts.

Part 1 — the engine + placement: src/lib/milestones.ts (word-count milestones with rank titles: 50 Ensiaskeleet … 2000 Perusta valmis; rankState/ladder/newlyReached; 5 unit tests, 44 total). Celebration.tsx (the pop when a word milestone is crossed — rank-up + confetti, over Home). Milestones.tsx (MilestoneLadder done/current/locked with a live bar to the next rung; RankSummary compact line). Home: the dashboard card now shows current rank + "X to next"; crossing a new milestone fires the Celebration once (progress.celebrated tracks the highest celebrated, synced jsonb, merge keeps max; markCelebrated). Progress: a "Merkkipaalut / Milestones" ladder beneath the journey stage map.

Part 2 — cohesion: the Journey's current stage now carries an inline "do this next" button (Journey takes optional `action`; Progress computes Start/Continue sprint -> Day One, or Daily review when done). The map is now the spine, not a static chart.

Blocked: nothing. Rank titles are common Finnish words — add to the native-speaker review list. Celebrations fire on the next Home load after crossing a milestone (Home remounts per nav, so it's reliable on returning from a session).

Next (motivation polish, if wanted): the 10-min streak week-strip / "X min to keep your streak" on Home (M3 deeper); a unified next-step helper to also drive Home's hero. Still pending: make Grammar lessons active (drills + FSRS); enable anon sign-ins; run 20260611000002 (language tally).

---

## Session: 2026-06-15 (Fix sentence progress = practiced, not just-added; feedback button overlap)

Shipped two owner-flagged fixes on the Home dashboard. (1) Sentence progress no longer inflates from the starter pack: adding it copies 104 sentences into the bank, which was being counted as 104/1000 before any practice. New ReviewOverview.sentDone = island_recall cards with reps>0 (recalled at least once); the journey % (journeyState), the Home dashboard "Lauseet" bar, the Progress journey + sentences stat tile, and the Daily sentence track now use sentDone. Raw bank size stays only as inventory (Sentence Bank tab). Words were already correct (seeded per word actually met in the sprint). (2) The floating Palaute/Feedback button was covering the last dashboard card — bumped Home bottom clearance 96 -> 150 so the Vocabulary/Sentences rows clear it. Build clean, 44 JS tests.

Blocked: nothing. Definition note: "sentence done" = practiced via recall (reps>0); shadow-only (Listen & repeat) progress is tracked per-set separately and is not yet folded into this figure — flag if the owner wants shadow to count too.

Next: motivation polish (M3 streak week-strip), make Grammar lessons active; owner pending — enable anon sign-ins, run 20260611000002.

---

## Session: 2026-06-15 (Sentence progress counts shadow; Home dashboard neatened)

Shipped: (1) Sentence progress now POPULATES from real work of any kind. Recall already counted (rateCard bumps reps), but "Listen & repeat" (shadow) didn't — so a learner doing the starter pack by shadowing stayed at 0. sentProgress = min(sentBank, max(recall sentDone, sum of progress.shadow positions)) — computed the same on Home, Progress, Daily. Adding the starter pack alone is still 0 (no inflation); doing it (shadow OR recall) moves the number. (2) Neatened the cramped ProgressDash: dropped the redundant "0% valmis" text (the ring shows %), and moved the rank line out of the narrow middle column (it wrapped to 3 lines) to a tidy full-width footer under a divider; RankSummary rewritten as a single line with "N →" pushed right. Build clean, 44 JS tests.

Blocked: nothing. Shadow total sums progress.shadow values (per-set furthest index, completion = set size); capped at sentBank to absorb stale entries. Verify: shadow the starter pack a few sentences → Home "Lauseet" + % move; the dashboard card reads cleaner.

Next: M3 streak week-strip; make Grammar lessons active; owner pending — enable anon sign-ins, run 20260611000002.

---

## Owner actions — status (updated 2026-06-09)
DONE by the owner (no longer outstanding):
- Personal Language Islands migrations (`20260609000001/2/3`) run in Supabase — the tab is live and working.
- Supabase SQL run: `users.progress` jsonb column (cross-device resume), `GRANT DELETE ON cards` (reset), and the `supabase/seeds/05_island_sentences.sql` seed (the 50 real "arki" sentences → Listen/Write/Speak are live, not the fallback). Earlier migrations (content_fixes, IPA, grants, user_progress, grant_card_delete) also run.
- AI writing feedback: `ANTHROPIC_API_KEY` added as a GitHub repo secret + the "Deploy TTS Worker" Action re-run, so Write now uses live Claude Haiku `/correct` (no longer the self-check fallback).
- Azure Speech key rotated.

STILL PENDING:
- Finnish-speaker verification pass on the puhekieli column (`docs/island-sentences.md` + `docs/generated_puhekieli_REVIEW.tsv`). Kirjakieli is Voikko-validated; puhekieli has no machine validator, so it stays text-only until a Finnish speaker eyeballs it. Then puhekieli audio can be enabled.

NOT needed (deliberately dropped): deploying the `services/voikko/` runtime service. Island sentences no longer carry a "draft" label — we trust the beginner-tuned Sonnet translation for personal content. The service code stays dormant in the repo only as a future option.

Notes: VITE_TTS_WORKER_URL set in Vercel (TTS works). Read docs/pedagogy-pressure-test.md for the four-skills rationale + what's still missing (real native listening clips, reading mode, mnemonics).
