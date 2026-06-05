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
