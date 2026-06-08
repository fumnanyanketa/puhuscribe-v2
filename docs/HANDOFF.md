# PuhuScribe v2 — Project Handoff

**Written:** 2026-06-08, at the end of a long build session, because the chat
context is nearly full. This is the single source of truth for picking the
project up in a **fresh session** — and the raw material for the owner's slide
deck (Wednesday workshop) and Substack write-up.

> **New session: start here.** The repo's default branch is now **`main`**, and
> it has all the work. Read this file + `PROGRESS.md` + `CLAUDE.md` / `BRIEF.md`
> / `ARCHITECTURE.md`, then continue. Do **not** wander onto old `claude/*`
> branches — everything is on `main`.

---

## 1. What PuhuScribe is

A Finnish language-learning app for **adult immigrants in Finland** working in
English, under pressure to learn Finnish (residency/work/life), who tried
Duolingo and hit its ceiling. Freemium; targets YKI exam readiness (B1–B2).

**The wedge:** teach **kirjakieli (written) and puhekieli (spoken) together from
day one** — books teach one Finnish, the street speaks another. Plus a custom
FSRS-5 spaced-repetition engine, real IPA pronunciation, and (planned) an AI
layer that explains Finnish grammar honestly.

---

## 2. Current state — what is LIVE and working (the MVP)

Live at **https://puhuscribe-v2.vercel.app** (auto-deploys from `main`). Behind a
login wall.

- **Auth** — email/password sign-up + login (Supabase Auth). Password show/hide
  eye. Session persists across reloads.
- **Day One Sprint** — highest-frequency words shown with **real IPA**
  (`hyvä → /ˈhyʋæ/`), recognise-the-meaning quiz. No wrong "sounds-like"
  mnemonics anymore.
- **Daily review** — real per-user **FSRS spaced repetition**: due reviews + new
  cards, Again/Hard/Good/Easy buttons with next-interval previews, persisted to
  Supabase. **Audio plays** (tap the speaker → Finnish voice).
- **Kielisaari (Island)** — shadowing: hear the sentence, record yourself
  (recording is a stub; pronunciation scoring is future).
- **Progress** — real stats (mastered/streak/last-7-days chart/recently
  reviewed), sign-out.
- **Bilingual UI** — every control is Finnish · English so a zero-Finnish
  beginner can navigate.
- **Audio** — Cloudflare Worker (`puhuscribe-tts.fumnanya.workers.dev`) →
  Azure `fi-FI-NooraNeural`. Kirjakieli only. Edge-cached.
- **Installable as a PWA** (Add to Home Screen) — no app store needed.

**Content in the DB:** real Voikko-validated words with **real kaikki/Wiktionary
IPA (514 words)**; **359 Voikko-validated generated sentences** (puhekieli held
NULL pending human verification) **plus the original ~500 older sentences** (mixed
quality — to be retired); 25 YKI topics.

---

## 3. The build journey (the story — for the Substack)

1. **The content-quality crisis.** Early content was **AI-generated Finnish with
   CC attribution slapped on top** — invented words and wrong pronunciations
   (`hyvä` shown as "HEE-vah"). The owner caught it. Root cause: the docs
   *claimed* Leipzig/Tatoeba/Wiktionary sources but the data was LLM-generated.
2. **The fix = replace the source, not patch the text.** Two pipelines built:
   - **`scripts/build_frequency_list.py`** — `wordfreq` (734k Finnish forms) →
     **Voikko** lemmatise + validate → top **10,000 real lemmas**
     (`data/finnish_frequency_lemmas.json`).
   - **`scripts/generate/`** — grounded generate-then-**Voikko-gate** loop: the
     model may only use allowed lemmas, and **every generated word is validated
     as real Finnish by Voikko**; invented forms are rejected. Produced **400
     validated sentences** (cleaned to 359). The guarantee: *no invented word
     reaches a learner.*
   - **`scripts/ingest/`** — real CC ingestion (Leipzig/kaikki/Tatoeba). Used
     kaikki.org's 3.9 GB Wiktionary dump to source **real IPA** for the
     vocabulary — `migration 20260607000003`.
3. **App came alive.** Wired Supabase auth + the custom **FSRS-5** engine into a
   real review queue; real Progress stats; PWA install; **bilingual UI**.
4. **Audio.** Cloudflare Worker proxy to Azure TTS (key stays server-side),
   deployed via GitHub Actions, play buttons wired.
5. **The deploy saga (a recurring lesson).** The live site kept showing old code
   because **Vercel and GitHub were pointed at an old branch.** Fixed by making
   **`main` the default branch** and consolidating all work onto it. This also
   unblocked GitHub Actions (which only sees default-branch workflows).

**Honest limitations to be transparent about:**
- The Voikko gate guarantees real **words**, not perfect **syntax/naturalness** —
  a handful of generated sentences are word-valid but slightly awkward. A
  **Finnish-speaker polish pass** is the finisher.
- **Puhekieli (spoken forms) is not verified** and has no automatic validator, so
  it's shown as text, not spoken, until a human checks it.

---

## 4. Architecture & stack

| Layer | Tech | Where |
|---|---|---|
| Frontend | React 19 + Vite 6 + TypeScript, custom "Snow" CSS design system | `src/`, deployed on **Vercel** (production branch = `main`) |
| Backend | **Supabase** (EU region) — Auth + Postgres + RLS | tables: users, words, sentences, cards, review_logs, mnemonics, topics, audio, language_islands… |
| Spaced repetition | **custom FSRS-5 engine** (never ts-fsrs) | `src/lib/fsrs/` (16 unit tests) |
| Content pipelines | Python (Voikko + wordfreq + anthropic) & Node (CC ingest) | `scripts/` |
| Audio | **Cloudflare Worker** → Azure Speech `fi-FI-NooraNeural` | `workers/tts/`, deployed via GitHub Actions |
| Data layer | `src/lib/data/` (content, cards, stats), `src/lib/auth/` | reads Supabase with the anon key |

Tests: `npm run test` → **31 JS** (16 FSRS + 12 ingest + 3 streak) + **22 Python**
(`scripts/generate/`, `.venv`). `npm run build` must stay clean.

---

## 5. Credentials & infra status (what's set, where)

- **Supabase** — project live + seeded. Migrations RUN: grants (content + user
  tables), content_fixes, add_word_ipa, word_ipa_from_kaikki, plus the cleaned
  `04_generated_sentences.sql` seed. Email auth enabled. Emails live in
  Supabase → **Authentication → Users** (EU region).
- **Anthropic API key** — set as an **environment variable in the Claude Code web
  environment** (for running generation). Model default = `claude-sonnet-4-6`
  (cheaper, owner's choice).
- **Azure Speech** (`northeurope`) + **Cloudflare** (API token + account id) —
  stored as **GitHub repo secrets** (`AZURE_SPEECH_KEY`, `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`). Worker is **deployed**.
- **Vercel** — production branch `main`; env vars `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`, `VITE_TTS_WORKER_URL` (= the worker URL).
- **GitHub** — default branch **`main`**; Actions **enabled**; workflow
  `.github/workflows/deploy-tts-worker.yml` deploys the worker on push to main.
- **Network allowlist** (Claude Code env): added `wortschatz.uni-leipzig.de`,
  `kaikki.org`, `downloads.tatoeba.org`, plus apt/PyPI/api.anthropic.com.
- ⚠️ **Rotate the Azure key** before any public launch (it was shared in plaintext
  in an early chat).

---

## 6. What's LEFT (roadmap, roughly prioritized)

1. **Bilingual toggle** (next, agreed) — a settings switch "Bilingual / Finnish
   only", default bilingual, persisted; later a gentle "switch to Finnish only?"
   nudge after enough exposure. Needs a small `bi(fi,en)` label helper.
2. **Puhekieli human-verification pass** — verify `docs/generated_puhekieli_REVIEW.tsv`
   (and the older sentences) with a Finnish speaker → then enable puhekieli audio.
3. **Retire old wrong content** — a cleanup migration to remove the original
   ~500 sentences + the wrong mnemonics, once the validated content fully covers it.
4. **Vocabulary cleanup** — drop inflected-form vocab entries (`koiran`, `isompi`…).
5. **Sentence naturalness pass** — Finnish-speaker edit of the generated 359.
6. **AI grammar tutor** — build it **pre-generated + cached** (one-time cost,
   ~free at runtime) + Voikko for conjugation, to avoid ongoing Anthropic bills.
7. **App stores** — Capacitor wrap (docs/mobile-app-stores.md). Needs: Apple
   Developer ($99/yr) + Google Play ($25) accounts, a bundle id (e.g.
   `fi.puhuscribe.app`), and the Apple-IAP-vs-web billing decision.
8. **Privacy policy** — required because emails are collected (GDPR + app stores).
9. **Day One word audio**, **service worker / offline**, **pronunciation scoring**
   (Island) — later polish.

---

## 7. How to run / deploy things

- `npm run dev` / `npm run build` / `npm run test`.
- **Content generation** (validated Finnish sentences): `bash scripts/generate/run.sh`
  (needs `ANTHROPIC_API_KEY`; installs Voikko + deps; emits
  `scripts/generate/out/generated_sentences.sql`). See `scripts/generate/README.md`.
- **Real IPA / CC ingest:** `scripts/ingest/` (README inside). Kaikki dump is huge
  (~3.9 GB) — stream it; the network allowlist already permits kaikki.org.
- **Deploy:** push to `main` → Vercel rebuilds the frontend automatically; the
  GitHub Action redeploys the worker when `workers/tts/**` changes.
- **DB changes** ship as SQL the owner runs in the Supabase SQL editor (the
  container can't reach Supabase).

---

## 8. Gotchas / lessons (read before continuing)

- **Branches:** all work is on `main` (now default). Earlier sessions got lost on
  old branches and the live site published a stale one — don't repeat that.
- **The container can't reach Supabase or Cloudflare** (allowlist) — so live DB
  + worker verification happens **in the browser**, not in-session.
- **Voikko validates morphology, not syntax** — real words ≠ natural sentences.
- **Puhekieli has no validator** — keep it human-verified before shipping/speaking.
- **Vite `VITE_` env vars are build-time** — changing them needs a redeploy.

---

## 9. The two deliverables the owner needs next

### 9a. Slide deck — Wednesday workshop (introduce the app, recruit testers)
Goal: get people in the room to install and try it. Suggested arc:
1. **The problem** — adult immigrants need Finnish fast; textbooks teach a Finnish
   nobody speaks; Duolingo plateaus.
2. **The wedge** — learn written + spoken Finnish *together*, day one (show a
   kirjakieli/puhekieli pair).
3. **How it works** — Day One Sprint → daily spaced-repetition with real audio +
   real IPA → shadowing. (Live demo on a phone.)
4. **Why the content is trustworthy** — every word machine-verified real Finnish
   (the Voikko story), real pronunciation from Wiktionary.
5. **Try it now** — open `puhuscribe-v2.vercel.app` → Add to Home Screen → sign up.
   (No app store needed.)
6. **Ask** — be a tester; feedback.
Build in **Claude Design** (a continuation of the prototype the owner already
built there) — **3–5 slides for a 5-minute talk**, demo-led, NOT Canva. Flow:
the owner has a **landing page** that links to the Vercel app; people **sign in
normally** (there is no guest mode — sign-in is unchanged). Day One Sprint now
**resumes** where a learner left off (saved per user in the browser), so demos
don't restart from word 1.

### 9b. Substack post — the build journey
Use Section 3 as the spine. Strong beats: the "invented Finnish" crisis and
catching it; the decision to *replace the source, not patch the text*; building a
Voikko gate so no fake word can ship; sourcing real IPA from a 3.9 GB Wiktionary
dump; wiring spaced repetition; the deploy/branch saga; shipping an installable
MVP with real audio — solo, with Claude Code. Honest about limits (naturalness +
puhekieli still need a human pass).

---

## 10. Suggested first message for the new session

> "Read docs/HANDOFF.md, PROGRESS.md, and CLAUDE.md. We're continuing PuhuScribe
> v2 on `main`. Next I want to [build the bilingual toggle / make the workshop
> slide deck / draft the Substack post]. Don't touch old branches; deploy by
> pushing to main."
