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
