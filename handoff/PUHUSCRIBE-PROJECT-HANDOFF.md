# PuhuScribe v2 — Full Project Handoff

> **Purpose of this document.** A complete, self-contained summary of everything built
> so far on PuhuScribe v2 — the product, the pedagogy, the architecture, every feature,
> the data model, the content pipeline, deployment, and the open roadmap. It is written
> so a *fresh* Claude instance (or any collaborator) with **no access to this repository**
> can pick up developmental planning and propose next steps without missing context.
>
> Companion document: **`LESSONS-AND-CONTENT.md`** — the actual teaching content (grammar
> lessons, starter sentences, vocabulary, mnemonics, island question bank) in full.
>
> Prepared 2026-07-02 for Fumnanya (owner). App name is **PuhuScribe** ("puhua" = to
> speak, in Finnish). Repository: `fumnanyanketa/puhuscribe-v2`.

---

## 0. TL;DR — what PuhuScribe is, in six lines

1. A **Finnish language-learning app for adult immigrants in Finland**, targeting **YKI
   exam readiness at B1–B2**. Freemium. Built solo with Claude Code.
2. Its **competitive wedge**: teaches **dual-register** Finnish — *kirjakieli* (written)
   and *puhekieli* (spoken) — together from day one. No mainstream app does this.
3. It runs on a **custom FSRS-5 spaced-repetition engine** (no external SRS library),
   **frequency-ordered vocabulary**, **mnemonics**, and an **AI layer** that explains
   grammar honestly instead of hiding it.
4. It is grounded in an explicit, cited **learning framework** (`FRAMEWORK.md`) built on
   Krashen's Monitor Theory + skill-acquisition theory + Swain's output hypothesis.
5. It is **live** on Vercel (`puhuscribe-v2.vercel.app`), with a Supabase backend, a
   Cloudflare Worker AI proxy, and Azure TTS. It has been through a **first-tester
   workshop** and a **native-speaker content review**.
6. It is **feature-broad but Stage-1 deep**: Foundation (words + your own sentences) is
   fully built; Grammar (Stage 2) is started (7 lessons); B1/B2 stages are the visible,
   locked road ahead.

---

## 1. The person we are building for

Every design and content decision is tested against **one specific person**:

> An adult immigrant who arrived in Finland **0–18 months ago**. Working in English.
> Under pressure — residency, employer, or personal urgency — to learn Finnish. Has tried
> Duolingo, hit its ceiling, stopped. **Needs Finnish to stay.**

Their named weaknesses (which the product is engineered around): **forming spontaneous
sentences — "mind goes blank"**, and **speaking confidence**. In the framework's terms this
is not a vocabulary gap — it is *Monitor overuse driven by a high affective filter* (see §3).

---

## 2. Product brief & positioning

- **Product:** PuhuScribe — Finnish for adult immigrants, YKI B1→B2. Freemium.
- **Wedge:** dual-register content (kirjakieli + puhekieli taught together), custom FSRS-5
  spaced repetition, a mnemonic for every word, and an AI layer that explains Finnish
  grammar honestly rather than hiding it.
- **The "day one" promise:** the learner feels the method work immediately through the
  **Day One Sprint** (150 words, wave-paced, mnemonic-paired) plus survival phrases they
  can *say* before any rule.
- **YKI readiness is the direction, not a day-one feature.** Honest calibration: B1 ≈
  1.5–2 years, B2 ≈ 3–4 years at ~10 min/day — never "fluent in weeks."
- **Landing page** live at `/landing` ("Understand the books. Speak the street.", single
  CTA "Become a tester", no email collection). Violet light · aurora design direction.
- **Positioning brief** lives at `research/positioning-brief.md` (read before any
  marketing/copy work).

---

## 3. The learning framework (the intellectual spine)

The canonical statement is **`FRAMEWORK.md`** ("The PuhuScribe Framework", by Fumnanya).
It is *research-grounded and honestly caveated*. Summary:

### 3.1 The science it stands on (Krashen, 1981 + later corrections)
- **Acquisition vs. Learning** — two separate systems. Acquisition is subconscious (from
  meaningful input); learning is conscious "knowing about" rules.
- **The non-interface claim** — memorising rules does *not*, by itself, become the ability
  to speak. (PuhuScribe takes the softer **hybrid** position — see below.)
- **The Monitor** — conscious rules act only as an *editor* of output, and only when three
  conditions hold at once: time, focus on form, and knowing the rule. In real speech they
  rarely do, so grammar can't be the engine of fluency.
- **The founding cautionary tale — "S, the Finnish speaker."** Krashen's textbook example
  of the *overuser*: a native Finnish speaker learning English who knew the grammar cold
  but could barely speak, because she tried to apply rules before every utterance. **The
  rules became a cage.** PuhuScribe's whole reason for being is to keep its learners from
  becoming S — the mirror image (English→Finnish) of the same failure mode named in our
  learner profile.
- **Natural Order** — structures are acquired in a fixed order that resists being taught.
- **Input Hypothesis (i+1)** — we acquire by understanding messages a little beyond our
  current level (comprehensible input).
- **Affective Filter** — anxiety/low confidence blocks input even when it's comprehensible.
- **Routines & Patterns** — memorised chunks ("How are you?") are usable *before* any
  grammar; the scientific licence for teaching survival phrases on day one.

### 3.2 The framework itself: a staircase on two rails

```
   THE STAIRCASE (what the learner consciously does)
   WORDS → RULES → REPS → FLOW
   ─────────────────────────────────────────────
   RAIL 1 — COMPREHENSIBLE INPUT (i+1)   ← the fuel
   RAIL 2 — LOW AFFECTIVE FILTER         ← the valve
   LEARNING ───────────────────────────► ACQUISITION
```

- **WORDS** — raw material: individual words *and* whole-sentence survival chunks. (Krashen's
  Routines & Patterns — communicate before you know grammar; filter down.)
- **RULES** — grammar via the signature method **Origin → Logic → Rule → Exceptions →
  Examples**. Never a rule without its *why*. **RULES is NOT a gate to speaking** — treating
  it as a gate is exactly what created "S."
- **REPS** — controlled practice + error tracking. A little *pushed output* (Swain). A
  bridge, not the destination.
- **FLOW** — spontaneous real use (live conversation grounded in the learner's actual life).
  This is *acquisition itself* — the only stage that builds spontaneous speech.

The **rails are always on under every stage** — WORDS/RULES/REPS/FLOW must each be delivered
on comprehensible input inside a low-anxiety space, or they don't produce acquisition.

### 3.3 Our stated position on the Krashen debate (so it can't be ambushed)
- We **reject strict non-interface**. We side with **skill-acquisition theory** (DeKeyser,
  2007): deliberate practice can *proceduralise* conscious knowledge. So rules and drills
  are **scaffolding and an accelerator we deliberately fade**, not the engine.
- We add a **measured role for output** (Swain, 1985) — producing language forces deeper
  processing than pure listening. That is why REPS and speaking stages exist.
- **One-line summary:** *Input + low filter is the engine; explicit rules + drills are
  scaffolding. The goal is not a learner who knows the grammar — it's a learner who forgets
  they ever needed it.*

### 3.4 Honest self-critique on record (`docs/pedagogy-pressure-test.md`)
A deliberate objective check (2026-06-09). Verdict: **the bones are science-aligned — better
grounded than most commercial apps — but the build over-indexes on the receptive vocabulary
slice.** The YKI exam grades **four skills separately (speak, listen, read, write)**; the app
was strong on vocab, thin on the rest. This document **drove the four-skills work** (see §5).
Its prioritised fixes were: (1) tag every activity with a YKI skill and show coverage; (2)
pull **writing** forward; (3) add real **listening**; (4) add a **produce→feedback** loop;
(5) reading slightly later; (6) keep the SRS spine and dual-register wedge exactly as-is.

---

## 4. Tech stack & architecture

### 4.1 Frontend
- **React 19 + Vite 6 + TypeScript 5.7** (strict). PWA-installable.
- **Custom CSS design system** — all brand tokens are CSS custom properties in
  `src/styles/tokens.css`. Tailwind utilities are allowed **only for layout** (flex, grid,
  padding, margin), **never** for brand colours/typography. Brand tokens include `--lake
  (#1B4965)`, `--forest (#2D4A2B)`, `--sauna (#B5784A)`, `--terracotta (#C25B3F)`, plus the
  register colours `--written` (purple, kirjakieli) and `--spoken` (teal, puhekieli).
- **Design system name:** "Snow" theme, later a full **Claude Design** redesign ("Sprout"
  brand mark, 5-tab nav). Component kit in `src/components/` (`kit.tsx`, `primitives.tsx`,
  `ui.tsx`, `RegisterCard.tsx`, `Shell.tsx`, `Journey.tsx`, `Milestones.tsx`,
  `Celebration.tsx`, `RecallRunner.tsx`, etc.).
- **Bilingual UI** — `src/lib/lang/useLang.tsx` exposes `bilingual` state + a `bi(fi,en)`
  helper (Finnish dominant, English in faded italic below; collapses to Finnish-only when
  toggled). `biText(fi,en)` is the plain-string variant for placeholders/labels.

### 4.2 Backend — Supabase (PostgreSQL + Auth), EU region (eu-central-1, GDPR)
Tables: `users`, `words`, `sentences`, `cards`, `review_logs`, `audio`, `mnemonics`,
`topics`, plus the personal-content tables `user_islands`, `user_island_sentences`, and
`feedback`. **Row-level security on every table** (content tables anon-readable; per-user
tables owner-locked). Auth supports **email/password + anonymous guest sign-in** ("Start
learning" with no account; convertible in place without losing progress).

### 4.3 AI layer — Cloudflare Worker proxy (`workers/tts/src/worker.js`)
API key lives **only in Worker secrets** — never in the browser, never in git. The Worker
exposes these routes (all using Claude models via the Anthropic API):
- `/converse` — level-matched Finnish conversation (Claude Haiku), both rails in the prompt.
- `/reading` — a level-matched Finnish passage + a comprehension question *in Finnish*.
- `/correct` — writing feedback / gentle correction (Claude Haiku `claude-haiku-4-5`).
- `/island/translate` — EN→FI translation of the learner's own answers into simple, complete
  A1 sentences (beginner-first; gets the question for context).
- `/island/questions` — 2–3 tailored follow-up questions per topic (Claude Haiku).
- `/feedback` — emails each beta feedback note via Resend (optional; no-op if unconfigured).

> The **original architecture brief** also names an **MCP server with six tools**
> (`grammar_explain`, `conjugate`, `vocabulary_context`, `puhekieli_transform`,
> `culture_note`, `error_correct`). The *shipped* AI surface converged on the Worker routes
> above; the six-tool MCP design is the documented intent in `ARCHITECTURE.md` and a natural
> place to expand the AI layer.

### 4.4 Audio — Azure Cognitive Services Finnish TTS
`fi-FI-NooraNeural` (female) / `fi-FI-HarriNeural` (male). **Kirjakieli sentences only**
(puhekieli is shown as text — never standalone TTS). Proxied through the Worker; audio wired
through `src/lib/tts.ts`. Real IPA is sourced from kaikki.org/Wiktionary (never invented).

### 4.5 FSRS-5 engine — `src/lib/fsrs/`
A **custom implementation of FSRS-5** (the 19-parameter modern scheduler; **no ts-fsrs, no
external library** — this is a hard rule). 16 passing unit tests. Target retention **90%**;
learning steps 1 and 10 min; max interval effectively uncapped. See `docs/spaced-repetition.md`
for a full plain-English explainer (lift-into-a-pitch quality). Grading is automatic
(`src/lib/grade.ts`): typed answer → exact = Good, one-typo/missing-ä (≈12% edit distance) =
Hard, wrong/blank/"I don't know" = Again. **The learner never rates themselves.**

### 4.6 Deployment
- **Vercel** — frontend (auto-deploys `main`). `vercel.json` + `DEPLOY.md`.
- **Cloudflare Workers** — AI + TTS proxy, deployed via **GitHub Actions** ("Deploy TTS
  Worker" workflow; no local Wrangler needed). Secrets: `ANTHROPIC_API_KEY`, Azure key,
  optional `RESEND_API_KEY`/`FEEDBACK_EMAIL_TO`, optional Voikko service vars.
- **Supabase** — data (migrations in `supabase/migrations/`, seeds in `supabase/seeds/`).

---

## 5. Feature inventory (what's actually in the app today)

The app is a **5-tab PWA**. Hub screens render the bottom nav; drills open modally.

### Navigation (5 tabs)
1. **Home (`Home.tsx`)** — dashboard: greeting + adaptive "what's next" (first-sprint hero
   for new users → daily plan once started), `ProgressDash` (% valmis ring + the two banks
   you grow: Vocabulary→2,000, Sentences→1,000), current **rank** + "X to next", and a
   **Daily Review** entry as soon as the sprint is *started* (not gated on completion).
2. **Learn / "Sanapankki" (`Learn.tsx`)** — the **Vocabulary Bank** growing toward 2,000:
   "New words today" (10/15/30 next unmet frequency words), a first-sprint card for new
   users, a link to graded practice, and the **Grammar Stage 2** entry.
3. **Daily Review / "Päivän kertaus" (`Daily.tsx`)** — split into **two tracks**, each a
   bank with a progress bar: **Vocabulary** (word recall) and **Your sentences** (island
   recall). Typed active recall via `RecallRunner` — the system grades and schedules; no
   self-rating.
4. **My Sentence Bank / "Oma lausepankki" (`Islands.tsx`)** — the **Language Islands**
   method (see §6). Create your own sentences, practise them, Starter Pack, edit/delete.
5. **Progress (`Progress.tsx`)** — level ring + **journey stage map** + **milestones
   ladder** + real stats (mastered/streak/this-week/weekly chart/recently-reviewed) +
   settings (bilingual toggle, sign-out, reset progress) + **Owner Insights** (owner only).

### Learning activities
- **Day One Sprint (`DayOne.tsx`)** — the 150-word Foundation sprint. Auto-resume, break/
  encouragement screens every 25 words, word auto-plays on open, card→quiz flow, each met
  word seeds an FSRS card (misses due immediately).
- **Speaking practice (`Speak.tsx`)** — "Listen & repeat" shadowing: native audio
  auto-plays, record your own voice (MediaRecorder), play yourself back (boosted volume via
  Web Audio gain). No scoring yet. Per-set resume synced server-side.
- **Graded Listening (`Listen.tsx`)** — audio-first (text hidden) → pick the meaning →
  reveal text. Alternates dictation + choose. Level-matched.
- **Micro-writing (`Write.tsx`)** — translate an English prompt → **Claude Haiku correction**
  (`/correct`) with hint-word chips; free self-check fallback if the Worker isn't configured.
- **Reading (`Read.tsx`)** — a level-matched Finnish passage ("Short story") with the
  comprehension question in Finnish, English demoted to a reveal-on-demand hint (`/reading`).
- **Conversation (`Converse.tsx`)** — a real level-matched Finnish chat (`/converse`,
  Claude Haiku): tap-to-hear, reveal-English, suggested replies. Text-first (voice deferred).
- **Grammar Stage 2 (`Grammar.tsx`)** — 7 sequential lessons (see §6 + `LESSONS-AND-CONTENT.md`),
  **gated** until the sprint is completed; lessons unlock one at a time.
- **Practice hub (`Practice.tsx`)** — the four YKI skills (Speak / Listen / Read / Write),
  each activity tagged with its skill (`src/lib/yki.ts`).

### Motivation & retention system
- **Journey (`src/lib/journey.ts` + `Journey.tsx`)** — 4 stages: **1 Perusta/Foundation**
  (2,000 words + 1,000 sentences, A1–A2) · **2 Kielioppi/Grammar** (A2–B1) · **3 Arjen
  sujuvuus/Everyday fluency** (YKI B1) · **4 Työelämän suomi/Professional Finnish** (YKI B2,
  the **North Star**). Current stage carries an inline "do this next" action; later stages
  shown-but-locked with "unlocks at N words."
- **Milestones & ranks (`src/lib/milestones.ts`)** — word-count milestones with Finnish rank
  titles: 50 *Ensiaskeleet* → 100 *Aloittelija* → 250 *Pärjääjä* → 500 *Selviytyjä* → 1000
  *Puhuja* → 2000 *Perusta valmis*. Crossing one fires a **Celebration** (confetti + rank-up).
- **10-minute study streak (`src/lib/studyTime.ts`)** — a day counts only after **10 min of
  genuine on-screen study** (per-tick capped so a backgrounded tab can't cheat). Positioned
  as "10 minutes a day." Currently per-device (localStorage).
- **Feedback button (`FeedbackButton.tsx`)** — floating on every hub → mood + note → `feedback`
  table + optional email via Resend + local backup.
- **Owner Insights (`Insights.tsx` + `owner_insights()` RPC)** — owner-only aggregate
  dashboard (testers, active 1d/7d, reviews, per-tester progress, latest feedback, first-
  language breakdown). Server-side SECURITY DEFINER function gated on owner email.

### Onboarding
4 teach-the-method slides — Welcome ("Speak the Finnish Finland actually speaks") → Why two
registers (with a RegisterCard) → How it works (Meet → Review → Speak) → Your path (the
Journey) → a final **"What is your first language?"** question (optional; feeds Insights).

---

## 6. The lessons & content — how they were built

> Full content is in the companion **`LESSONS-AND-CONTENT.md`**. This section explains the
> *system* that produces it.

### 6.1 The four content layers
1. **Vocabulary** — ~551 frequency-ordered words (`supabase/seeds/01_vocabulary.sql`), each
   with English gloss, frequency rank, CEFR level, part of speech, topic, and real IPA
   (sourced from kaikki.org/Wiktionary — never invented; `20260607000003_word_ipa_from_kaikki.sql`).
2. **Sentences** — 500 seed pairs (`02_sentences.sql`) + 359 Voikko-validated generated
   sentences (`04_generated_sentences.sql`), across 25 YKI topics, A1/A2, dual-register.
3. **Mnemonics** — 153 phonetic "sound-bridge" mnemonics (`03_sprint_mnemonics.sql`), e.g.
   *talo → "imagine a TALL building — that's your Finnish house."*
4. **Grammar** — 7 progressive Stage-2 lessons in code (`src/lib/grammar.ts`), A1.1→A2.1.
5. **Personal content** — the learner's own sentences (Language Islands), scheduled by the
   same FSRS engine (`island_recall` cards).
6. **Starter Pack** — 104 curated everyday "arki" sentences (`05_island_sentences.sql`),
   kirjakieli + puhekieli + English, that seed a beginner's first island.

### 6.2 The Voikko-grounded generation pipeline (the anti-invention guarantee)
The single most important content decision: **stop inventing Finnish.** The pipeline
(`scripts/`) works as follows:
- **`build_frequency_list.py`** — 734,205 wordfreq Finnish forms → Voikko-lemmatised +
  validated → top **10,000 real lemmas** (`data/finnish_frequency_lemmas.json`); proper
  nouns/foreign/garbage dropped.
- **`scripts/generate/`** — grounds generation in that allowed 10k list (low effort, dual-
  register), then a **hard Voikko gate validates every generated kirjakieli form** and
  rejects/regenerates anything that isn't real Finnish, logging the invention rate. Offline
  demo proves invented forms (`blarghti`, `kissoittelen`) are caught and never ship.
- **`run_batch.py` + `to_seed_sql.py`** — generate across all 25 topics × levels →
  `out/generated_sentences.sql` (idempotent; **only Voikko-validated kirjakieli ships**;
  puhekieli = NULL, written to a human-review TSV).
- **Puhekieli is NOT Voikko-gated** (spoken forms aren't standard Finnish) — it stays on the
  **human-verified path**. A rule-based transform proposes it; a Finnish speaker confirms it.
- Run it: `bash scripts/generate/run.sh` (needs `ANTHROPIC_API_KEY`).
- There is also a **reproducible CC ingestion pipeline** (`scripts/ingest/`) for regenerating
  seeds from Leipzig (frequency) + kaikki (glosses/IPA) + Tatoeba (sentences) — deferred; run
  only if explicitly asked.

### 6.3 Content honesty rules (learned the hard way)
- **Provenance is kept honest** (`docs/content-attribution.md`): the current seeds were
  **LLM-generated**, not CC-sourced, and are labelled as such (an earlier version falsely
  claimed CC attribution — that was the root cause of content-quality problems, now fixed).
- **Never invent IPA / translations.** Words kaikki can't gloss are skipped, not guessed.
- **The Kotus frequency lexicon (CC BY-ND-NC) is excluded** — NonCommercial/NoDerivatives
  terms are incompatible with a commercial app. Leipzig (CC BY 4.0) only.
- **Native-speaker review is DONE** (2026-06-15) — a Finnish native reviewed the 104
  starter-pack sentences / puhekieli. Treat reviewed content as verified. *Open item:* if
  the reviewer marked corrections, they still need to be applied to the seeds.

---

## 7. Data model & key files map

| Area | Key files |
|---|---|
| App shell / routing | `src/App.tsx`, `src/main.tsx`, `src/components/Shell.tsx` |
| Screens | `src/screens/*.tsx` (Home, Learn, Daily, Islands, Progress, DayOne, Speak, Listen, Write, Read, Converse, Grammar, Practice, Onboarding, Auth, Insights) |
| FSRS engine | `src/lib/fsrs/` (algorithm.ts, scheduler.ts, types.ts, + tests) |
| Card persistence / recall | `src/lib/data/cards.ts`, `src/lib/grade.ts`, `src/components/RecallRunner.tsx` |
| Content data layer | `src/lib/data/content.ts`, `review.ts`, `islands.ts`, `home.ts`, `stats.ts`, `insights.ts`, `progress.tsx`, `streak.ts`, `feedback.ts` |
| Learning models | `src/lib/journey.ts`, `milestones.ts`, `grammar.ts`, `islandTopics.ts`, `yki.ts`, `studyTime.ts`, `practiceStats.ts` |
| Auth / lang | `src/lib/auth/useAuth.tsx`, `src/lib/lang/useLang.tsx` |
| AI/TTS client | `src/lib/tts.ts` → Cloudflare Worker `workers/tts/src/worker.js` |
| Supabase | `src/lib/supabase/client.ts`, `database.types.ts`; `supabase/migrations/*`, `supabase/seeds/*` |
| Content pipeline | `scripts/build_frequency_list.py`, `scripts/generate/*`, `scripts/ingest/*` |
| Framework & docs | `FRAMEWORK.md`, `docs/*` (see §10) |
| Landing page | `public/landing/*` (static, deploys with the app at `/landing`) |
| Screenshot harness | `shots/*` (offline; do NOT auto-run — owner-request only) |

**Content counts (as seeded):** 25 topics · 551 words · 500 + 359 sentences · 153 mnemonics ·
104 starter-pack sentences · 7 grammar lessons · 8 island topics (with ~5–6 questions each).

**Tests:** 16 FSRS unit tests + JS tests (grade, milestones, streak, etc.) — ~44 JS tests
total; 13 Python tests for the generation pipeline. Guardrail: `npm run build` **and**
`npm run test` must pass before any push.

---

## 8. Deployment, commands & guardrails

- `npm run dev` — Vite dev server.
- `npm run test` — Vitest.
- `npm run build` — production build.
- `bash scripts/generate/run.sh` — Voikko-grounded content generation (needs `ANTHROPIC_API_KEY`).
- **Ship-as-you-go loop (owner's standing rule):** for every meaningful change → build +
  test → **only if both clean** → commit → push `main` (Vercel auto-deploys). *Never push a
  broken deploy.* (Note: this handoff task was scoped to a feature branch, but the app's
  normal workflow is direct-to-`main`.)
- **Hard rules:** never commit secrets/keys/.env; never refactor auth/RLS/billing without
  explicit confirmation; never use ts-fsrs; Kotus lexicon is not licensed for commercial use.

---

## 9. Status — done, pending, and the roadmap

### Done by the owner (no longer outstanding)
- All Supabase migrations run (schema, IPA, grants, user_progress, card delete, island
  tables, owner insights, language tally). Starter-pack seed (104) loaded.
- `ANTHROPIC_API_KEY` set → live Claude Haiku writing feedback + conversation + reading.
- Azure Speech key rotated; TTS works (`VITE_TTS_WORKER_URL` set in Vercel).
- **Anonymous sign-ins enabled** — guest "Start learning" works.
- **Native-speaker content review done** (2026-06-15).
- Owner Insights dashboard live; first-language breakdown renders.

### Still pending (owner)
- **Email feedback (Resend)** — wanted, not yet set up: create Resend account, verify a
  sender, add `RESEND_API_KEY` + `FEEDBACK_EMAIL_TO` repo secrets, re-run "Deploy TTS Worker."
  Until then feedback still lands in Supabase + Owner Insights.
- **Apply any native-reviewer corrections** to the puhekieli seeds / grammar examples / rank
  titles (if the reviewer marked fixes).

### Deliberately dropped
- The `services/voikko/` **runtime** microservice (owner-hosted infra the sandbox can't
  provide; Sonnet translations are trusted for personal content — island sentences no longer
  carry a "draft" label). The seed-content Voikko guarantee is unaffected.

### The big open theme (owner-raised, agreed, partly built)
**Progressive motivation / cohesion** — Duolingo's real strength is *return motivation*. The
ranks + milestones + celebrations + journey-spine system (§5) is the first answer. Deeper
polish still available: a streak week-strip / "X min to keep your streak" on Home, a unified
next-step helper driving Home's hero.

### Candidate next steps (for the developmental planning this handoff feeds)
1. **Make Grammar lessons active** — the 7 lessons are currently *read + one MCQ check*
   (too passive). Upgrade to typed/MCQ drills and **fold grammar into FSRS Daily review**;
   then author more lessons (consonant gradation kpt, possession "minulla on", two-stem/nen-
   words, puhekieli patterns — all in `docs/skk1-notes.md`).
2. **Build out Stages 2–4** — Grammar has 7 lessons but the Journey still keeps everyone in
   Stage 1; B1/B2 are locked placeholders. Real content + unlock logic needed.
3. **Deepen the four productive skills** — native listening clips (beyond TTS), richer
   reading, a real produce→feedback loop, voice input into conversation.
4. **Mnemonics at scale** — currently 153; the design supports one per word.
5. **Retention/analytics** — cross-device streak; tie graded drills into the progression as
   checkpoints; tune Journey thresholds and Home plan numbers.
6. **Content correctness pass** — apply native-reviewer fixes; consider the CC reingest so
   provenance becomes genuinely CC-sourced.
7. **Monetisation / app-store path** — freemium model articulation; Capacitor packaging
   (`docs/mobile-app-stores.md`) once Apple/Google accounts + billing decision exist.

---

## 10. Where to read more (repository docs)

If the fresh instance *does* get repo access later, these are the authoritative sources:

| Doc | What's in it |
|---|---|
| `FRAMEWORK.md` | The canonical learning framework (Krashen + hybrid), with citations |
| `CLAUDE.md` | Project instructions, conventions, hard rules, commands |
| `BRIEF.md` / `ARCHITECTURE.md` | Product brief + full architecture decisions |
| `PROGRESS.md` | Session-by-session log of everything shipped (the running history) |
| `docs/pedagogy-pressure-test.md` | Honest science critique that drove the four-skills work |
| `docs/spaced-repetition.md` | Full plain-English FSRS explainer (pitch-ready) |
| `docs/skk1-notes.md` | The SKK1 Finnish class notes (43 sessions) grammar is built from |
| `docs/native-speaker-review.md` | The 104 starter sentences sent for native review |
| `docs/island-sentences.md` | The island/arki sentence set, puhekieli flagged |
| `docs/content-attribution.md` | Honest content provenance + licensing |
| `docs/mobile-app-stores.md` | Capacitor → App Store / Play path + prerequisites |
| `docs/workshop-deck-prompt.md` | Paste-ready Claude Design workshop deck prompt |
| `research/positioning-brief.md` | Positioning (read before marketing/copy) |
| `research/*` | Competitor reviews, reddit voice, pricing matrix, app landscapes |
| `scripts/generate/README.md`, `scripts/ingest/README.md` | Content pipeline runbooks |

---

*Prepared as a standalone handoff for developmental planning in a fresh Claude instance.
Everything above reflects the repository state at 2026-07-02. The companion file
`LESSONS-AND-CONTENT.md` contains the full teaching content.*
