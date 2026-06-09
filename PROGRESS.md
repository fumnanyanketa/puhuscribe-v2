# PROGRESS.md

Append a 3-line entry at the end of every session: what shipped, what is blocked, what is next.

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
