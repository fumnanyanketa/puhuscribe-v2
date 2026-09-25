# PuhuScribe

**A Finnish language learning app for adults living in Finland — built on real Finnish, not AI-invented Finnish.**

**Live app:** https://puhuscribe-v2.vercel.app
**Designed and built by:** Fumnanya Nketa, using AI-assisted development

---

## The problem

Most language apps teach the Finnish found in textbooks, *kirjakieli*. But the Finnish people actually speak around you, *puhekieli*, is noticeably different, and many learners find they can read a sign but can't follow a conversation at the bus stop.

There is a second, less visible problem for any app that uses AI to produce learning material: language models confidently invent words and inflected forms that do not exist. In most apps that is an embarrassment. In a language app, it means learners memorise fake Finnish.

## What PuhuScribe does

- Teaches **both registers together from day one** — each sentence in written Finnish alongside its spoken equivalent
- Schedules review with a **spaced-repetition engine** (FSRS-5), so words come back just before you would forget them
- A **Day One** flow that gets a new learner saying real Finnish phrases before any grammar
- **Conversation, reading and writing practice** matched to the learner's level, with plain-English explanations of grammar
- Native-sounding **Finnish audio** for every written sentence
- Structured around the path towards the YKI B1–B2 language certificate

The learning approach is grounded in second-language acquisition research. See [FRAMEWORK.md](FRAMEWORK.md).

## Architecture

```
React + Vite frontend (Vercel)
│
├──► Supabase (PostgreSQL, EU region)
│      users, words, sentences, cards, review logs, topics …
│      Row-level security on every table
│
└──► Cloudflare Worker (API proxy — holds all secret keys)
       ├── Claude API    → conversation, reading passages, writing correction
       ├── Azure TTS     → Finnish audio
       └── Voikko service (Python, Docker) → is this real Finnish?

Offline, reproducible data pipelines (scripts/)
├── ingest/    Leipzig + Wiktionary + Tatoeba corpora → seed SQL
└── generate/  frequency-grounded AI generation → Voikko gate → seed SQL
```

## Key design decisions

**Content comes from real corpora, not from a model.**
Early versions generated vocabulary and sentences with an LLM. That content turned out to be the root cause of quality problems. It was replaced with a reproducible ingestion pipeline that builds the database from Creative Commons sources: word frequency from the Leipzig Corpora Collection, pronunciation and glosses from Wiktionary, and sentence pairs from Tatoeba. See [scripts/ingest/README.md](scripts/ingest/README.md).

**Where AI does generate Finnish, every word is checked.**
Generation is restricted to a vocabulary of real, common words taken from the frequency list. Every generated word is then run through Voikko, a Finnish morphological analyser. Anything Voikko can't recognise as valid Finnish is rejected and regenerated or dropped, and the rejection rate is logged. This guarantee holds regardless of which model is used. See [scripts/generate/README.md](scripts/generate/README.md).

**Secret keys never reach the browser.**
The frontend only holds Supabase's publishable key, with row-level security protecting the data. Every call to Claude, Azure or the Voikko service goes through a Cloudflare Worker, and the keys live only in the Worker's secrets.

**Learner data stays in the EU.**
The Supabase project is hosted in the EU region for GDPR compliance.

**The spaced-repetition engine is written from scratch.**
FSRS-5 is implemented directly in `src/lib/fsrs/` and covered by unit tests, rather than pulled in from a library.

## Tech stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | React 19, Vite 6, TypeScript | Vercel |
| Database + auth | Supabase (PostgreSQL), SQL migrations | Supabase, EU |
| API proxy | Cloudflare Worker (JavaScript) | Cloudflare |
| AI | Anthropic Claude API | via Worker |
| Speech | Azure Cognitive Services, Finnish neural voices | via Worker |
| Finnish validation | Voikko, Python service in Docker | Fly.io |
| Data pipelines | Node.js (ingestion), Python (generation) | run offline |
| CI/CD | GitHub Actions deploys the Worker; Vercel deploys `main` | — |

## Tests

```bash
npm run test          # Vitest: FSRS engine, grading, streaks, milestones, ingestion parsers
```

The Python generation gate has its own tests in `scripts/generate/` (`test_voikko_gate.py`, `test_seed_sql.py`).

## Running locally

```bash
npm install
cp .env.example .env   # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

The database schema lives in `supabase/migrations/`. Deployment steps are in [DEPLOY.md](DEPLOY.md).

## Content attribution

Vocabulary, pronunciation and sentence data come from Creative Commons sources. Full attribution: [docs/content-attribution.md](docs/content-attribution.md).# puhuscribe-v2
