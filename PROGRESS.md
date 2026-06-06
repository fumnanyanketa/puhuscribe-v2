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

## Session: 2026-06-07 (Content Corrections §1–§4)

Shipped: supabase/migrations/20260607000001_content_fixes.sql — one SQL file the owner runs once in Supabase SQL editor covering: §1 three base_form typos fixed (hedelma→hedelmä, hyva→hyvä, tummansiniinen→tummansininen); §3 three translation errors corrected (terve→"hello", minä→"I / me", voida canonical gloss); §2 eleven missing high-frequency words inserted (kyllä, tämä, tuo, se, ehkä, tässä, siellä, sitten, kotona, herätä, rakastaa) so all 153 sprint mnemonics now have matching words; §4 42 mnemonic sound-bridges rewritten applying correct Finnish phonology (y="ew" rounded, ö="ur", ä="a as in cat", au="ow" cow, ai="eye", j=English "y"). Seeds updated to match for future reingest. scripts/ingest/README.md scaffolds Leipzig/kaikki/Tatoeba ingestion for the full CC source rebuild (§0). 16 FSRS tests pass, build clean.

Blocked: Container cannot reach Supabase — owner must run 20260607000001_content_fixes.sql in Supabase SQL editor to apply fixes to live DB. Network still blocks Leipzig/kaikki/Tatoeba, so §0 full CC reingest requires owner to download raw corpora locally. §5 sentence audit (500 pairs) and §6 TTS pipeline not yet done. §9 auth/FSRS wiring still pending.

Next: Owner runs migration in Supabase SQL editor and verifies all 153 mnemonics appear in Day One screen. Then §6 TTS audio pipeline (Cloudflare Worker → Azure fi-FI-NooraNeural → Supabase Storage — rotate Azure key first). Then §9 auth/FSRS wiring (wrap App in AuthProvider, gate on useAuth, rewrite Daily with FSRS buttons). §5 sentence audit with Finnish speaker is parallel track.
