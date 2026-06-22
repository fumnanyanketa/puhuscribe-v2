# STATUS.md — PuhuScribe v2 deep-dive

_Audit date: 2026-06-22 · against `main` @ `6b8a730` ("Rename the conversation tutor to Otso") · author: automated repo deep-dive._

This is a blunt, evidence-based snapshot of the whole repository: every branch, what is genuinely built vs. placeholder, what is left, the biggest blocker, quick wins, and a keep/finish/discard/cut call. It is meant to be read top-to-bottom once and then used as a worklist.

---

## 1. What the project is

PuhuScribe v2 is a **Finnish-language-learning web app for adult immigrants in Finland**, aiming at YKI exam readiness (B1–B2). Its competitive wedge is **dual-register teaching** — kirjakieli (written) paired with puhekieli (spoken) from day one — plus a **custom FSRS-5 spaced-repetition engine**, mnemonics, and an honest AI grammar layer. Built solo with Claude Code. Stack: **React 19 + Vite 6 + TypeScript 5.7**, **Supabase** (Postgres + Auth + RLS, EU region), a **Cloudflare Worker** proxy in front of the **Anthropic API** and **Azure TTS** (fi-FI-NooraNeural), deployed on **Vercel** (frontend) + **Cloudflare Workers** (AI/TTS). It is **live** (puhuscribe-v2.vercel.app) and has had real beta testers (a workshop cohort of ~9).

Scale on `main`: **64 TS/TSX files, ~10,100 LOC**, 16 screens, 15 Supabase migrations, 5 content seeds (~550 words, ~900 sentences). Build is clean; **44/44 tests pass**.

---

## 2. Branch-by-branch (every local + remote branch)

> **Critical topology finding:** `main` is a **re-rooted, 50-commit history** (root `2269d3c`). **Eight** of the nine `claude/*` session branches share **no common ancestor with `main` at all** (`git merge-base` returns empty — different root commit). At some point `main`'s history was squashed/re-initialised, orphaning every earlier session branch onto a parallel, disconnected timeline. Their work was carried forward into the new `main` by hand (the live app is clearly the continuation), but **git-wise they are detached duplicates, not normal "feature branches."** Net tip-to-tip diffs confirm it: each branch is missing 17k–105k lines that `main` has, and contributes only small amounts of *superseded older* file versions. I opened the actual files/diffs (not just commit messages) to confirm — none holds unique, current code worth merging.

| Branch | Last commit | Relation to `main` | What's actually inside / verdict |
|---|---|---|---|
| **main** | 2026-06-21 | — (canonical, live) | The real product. 50 commits, fresh root. Everything below is measured against it. |
| **claude/puhuscribe-framework-audit-p34xyf** | 2026-06-17 | **Ancestor of main** (main = this + 4 commits); 0 unmerged | The ONLY branch on `main`'s real history. Fully merged — `main` is 4 commits ahead. **Stale, safe to delete.** |
| **claude/elegant-curie-k21wrw** | 2026-06-13 | Unrelated history; 125 commits, 118 unmerged by patch-id; net: −11,818 vs main | The most "complete" legacy snapshot (full Claude Design redesign, Converse, Grammar, Insights). All superseded on `main`. **One genuinely unique artifact: `marketing/GROWTH-ENGINE.md`** (a real growth/SEO/content-engine strategy doc not present on `main`). **Salvage that file, then delete branch.** |
| **claude/bold-heisenberg-qaiqsm** | 2026-06-09 | Unrelated; 89 commits, 82 unmerged; net −17,288 | Four-skills + islands + insights snapshot (= awesome-feynman + a docs-cleanup commit). Superseded. Unique leftovers: obsolete `docs/CONTENT-CORRECTIONS-HANDOFF.md`, `docs/roadmap-notes.md`. **Delete.** |
| **claude/awesome-feynman-TsmmR** | 2026-06-09 | Unrelated; 88 commits, 81 unmerged; net −17,293 | Same lineage as bold-heisenberg, minus the cleanup commit. Adds stale `docs/HANDOFF.md`. Superseded. **Delete.** |
| **claude/peaceful-carson-mEZVc** | 2026-06-08 | Unrelated; 63 commits, 56 unmerged; net −20,283 | Bilingual toggle + landing + sprint-resume era. Carries the old `src/screens/Island.tsx` (renamed to `Islands.tsx`/`Speak.tsx` on main). Superseded. **Delete.** |
| **claude/peaceful-bohr-e7ke3** | 2026-06-08 | Unrelated; 67 commits, 60 unmerged; net −18,738 | Landing-page/hero-scaling snapshot. Superseded. **Delete.** |
| **claude/eager-bell-Lq5lz** | 2026-06-06 | Unrelated; 33 commits, 31 unmerged; net −104,860 | Phase-03 UI + first content-wiring snapshot (the huge net delta is the 100k-line IPA migration `main` carries). Superseded. **Delete.** |
| **claude/gallant-lovelace-yw1EP** | 2026-06-06 | Unrelated; 31 commits, 29 unmerged; net −104,821 | Earliest content snapshot (Phase 01.5 seeds + content wiring). Superseded. **Delete.** |
| **claude/zealous-pascal-fd7oy4** | 2026-06-10 | Unrelated; 1 unique commit, **0 unmerged by patch-id** (already on main); net −11,642 | "Always show the 150-word sprint" — that change is already on `main`. Effectively merged. **Delete.** |

**Stale/stranded/unmerged summary:** No genuinely valuable *code* is stranded — `main` is far ahead of all nine branches. The only non-`main` content worth rescuing is **`marketing/GROWTH-ENGINE.md`** (on elegant-curie). Everything else (old `HANDOFF.md`, `CONTENT-CORRECTIONS-HANDOFF.md`, `roadmap-notes.md`, `Island.tsx`) is obsolete. **Recommendation: salvage the one doc, then delete all nine `claude/*` branches** to stop them masquerading as live work.

---

## 3. What's truly built vs. placeholder

### Built and real (verified by reading the code / running build+tests)
- **FSRS-5 engine** (`src/lib/fsrs/`) — custom, no external lib, **16 unit tests pass**. Real scheduler wired into review.
- **Auth** — Supabase email + **anonymous "guest" sign-in**, in-place guest→account upgrade (`useAuth.tsx`, `SaveProgress.tsx`).
- **Backend** — 15 migrations, 10 tables with RLS (`users, topics, words, sentences, mnemonics, cards, review_logs, audio, user_islands, user_island_sentences`, + `feedback`), owner-only `owner_insights()` SECURITY DEFINER aggregate.
- **Content** — ~550 Voikko-validated words, ~900 sentences, **real IPA sourced from kaikki/Wiktionary** (not invented), 104-sentence "arki" starter pack. A genuinely reproducible **Voikko-gated generation pipeline** (`scripts/generate/`, 9 py tests) + **CC ingestion pipeline** (`scripts/ingest/`, 12 tests).
- **AI layer (Cloudflare Worker, real Anthropic calls)** — `/correct` (writing feedback, Haiku), `/island/translate` + `/island/questions` (Sonnet/Haiku), `/converse` (Otso chat tutor, Haiku), `/reading` (graded passages), `/feedback` (Resend email). Model IDs are current (`claude-haiku-4-5`, `claude-sonnet-4-6`).
- **TTS** — real Azure Cognitive Services SSML route (`fi-FI-NooraNeural`), edge-cached.
- **Learning loop & screens** — Onboarding, Day-One 150-word sprint (auto-TTS, milestones), Daily Review (typed active recall, auto-graded → FSRS), vocab bank (Learn), Sentence Bank ("islands" — author your own sentences, AI translate/verify), 7-lesson Grammar curriculum, Practice hub (Speak/Listen/Read/Write), Converse, Progress, **owner Insights** dashboard, Milestones/ranks/celebrations, bilingual toggle, feedback button, PWA install.

### Placeholder / aspirational / not built
- **"MCP server with 6 tools"** (`grammar_explain, conjugate, vocabulary_context, puhekieli_transform, culture_note, error_correct`) promised in `ARCHITECTURE.md`/`BRIEF.md` is **NOT built**. There is no MCP server — just the ad-hoc REST routes above. (Functionally fine, but the docs oversell it. `grammar.ts` is static lessons, not those tools.)
- **Monetization / "Freemium"** — **nothing.** No Stripe, no paywall, no plans, no entitlement checks anywhere in the codebase, despite "Freemium" being core to the brief.
- **Mnemonics** — seeded but flagged (earlier audits) for systematic pronunciation errors; not surfaced reliably; "bigger mnemonics" repeatedly deferred.
- **Puhekieli verification** — machine-validatable only for kirjakieli; puhekieli ships unvalidated. A native-speaker review was done (2026-06-15) but **corrections may not yet be applied to seeds/grammar examples/rank titles**.
- **Native listening clips** — not done (uses TTS as a stand-in).
- **`services/voikko/` runtime microservice** — written but **deliberately dormant** (not deployed; drafts label removed).
- **Email feedback (Resend)** — built but **not configured** (owner hasn't added the secret).
- **Mobile app-store build** — docs only (`docs/mobile-app-stores.md`); PWA is the only install path.
- **Reading "stories"** — AI-generated on the fly, not saved/verified as seed content.

### Rough completeness
- **Core learner loop (acquire → schedule → review → speak/listen/read/write):** ~**85%** — works end-to-end, live.
- **Content depth & verification:** ~**60%** — real and validated for kirjakieli; puhekieli/mnemonics/grammar examples need a human sign-off pass actually *applied*.
- **Product/business (monetization, retention spine, app-store):** ~**15%**.
- **Ops robustness (manual migrations + external secrets, no CI for frontend/tests):** ~**40%**.
- **Overall as a shippable product: ~65% complete; as a working beta: effectively done.**

---

## 4. The biggest blocker

**There are two, and they're different in kind:**

1. **Product/strategic (the real one): no monetization and a thin retention spine.** The brief is "Freemium," but there is zero billing surface and no enforced free/paid boundary. For "serious adult learners" you can charge — but nothing in the code lets you. Until that exists, this is an impressive free tool, not a business.
2. **Operational/trust: content verification isn't *closed*, and the whole system depends on the owner hand-running SQL migrations + setting external secrets.** Recurring across the entire PROGRESS log is the same unresolved theme — puhekieli/mnemonic/grammar correctness needs a native pass that's actually applied, and every backend change needs a manual Supabase step. This is fragile and doesn't scale.

If forced to name one: **monetization** — everything else is iteration on a working app; this is a missing pillar.

---

## 5. Quick wins (low effort, real value)

1. **Delete the 8 orphaned `claude/*` branches** (after salvaging `GROWTH-ENGINE.md`) — removes a huge false-signal of "unmerged work." ~10 min.
2. **Salvage `marketing/GROWTH-ENGINE.md`** from elegant-curie onto `main` — a genuinely useful, already-written growth plan. ~5 min.
3. **Fix the architecture docs** to describe the actual REST worker instead of the never-built "MCP server with 6 tools" — stops future sessions chasing a phantom. ~15 min.
4. **Code-split the 633 KB JS bundle** (dynamic import per screen) — Vite already warns; trivial win for mobile load. ~30 min.
5. **Add a minimal CI** (`npm run build && npm test` on push) — the frontend currently has *no* CI; only the worker deploys via Actions. Cheap insurance. ~20 min.
6. **Apply the native-speaker corrections** to the puhekieli seeds / grammar examples if the owner has the marked-up list — closes the longest-standing open item.

---

## 6. Blunt call: KEEP / FINISH

**KEEP and FINISH — do not discard.** This is well past prototype: a clean-building, test-backed, *live* app with a real FSRS engine, real AI integration, real validated content, and a coherent pedagogical wedge. Discarding would throw away substantial, working engineering.

**CUT (stop investing in / delete):**
- The 9 stale `claude/*` branches (after the one-file salvage).
- The aspirational **MCP server** — the REST worker already does the job; don't build MCP, just fix the docs.
- The dormant **`services/voikko/`** runtime service (already deliberately dropped — remove or clearly archive it).
- The permanent **screenshot harness** as a repo fixture (keep the script, but it's not product).

**FINISH (the path to a real product), in order:** close content trust → add a thin monetization boundary → harden ops (migrations/CI) → then polish (mnemonics, native audio, app-store). The learning loop itself doesn't need more features; it needs a business model and verified content.

---

## 7. Prioritized checklist (max 7)

1. **Salvage `marketing/GROWTH-ENGINE.md` onto `main`, then delete all 9 `claude/*` branches** (8 orphaned + 1 merged stale).
2. **Apply the native-speaker corrections** to puhekieli seeds, grammar examples, and rank titles — actually close the longest-running open item; mark puhekieli "verified."
3. **Add a free/paid boundary** — define what's free vs paid, add a minimal paywall + Stripe (or RevenueCat for the eventual app build). This is the missing pillar.
4. **Replace manual Supabase migration ops with a repeatable apply step** (`supabase/apply-all.sql` exists — wire a documented one-command/scripted path) and **add frontend CI** (`build` + `test` on push).
5. **Correct `ARCHITECTURE.md`/`BRIEF.md`** to match reality (REST worker routes, not "MCP server with 6 tools"); note no monetization yet.
6. **Code-split the 633 KB bundle** and turn on the email-feedback secret (Resend) so beta signal actually reaches the owner.
7. **Then** invest in retention/quality polish: fix mnemonic pronunciation data, add native listening clips, and (once accounts/billing exist) the Capacitor app-store build.
