# PuhuScribe v2 Architecture

## Frontend
React 19 + Vite 6 + TypeScript 5.7. CSS custom properties for all brand tokens. Tailwind utilities allowed only for layout (flex, grid, padding, margin) — never for brand colors or typography. Brand tokens: --lake (#1B4965), --forest (#2D4A2B), --sauna (#B5784A), --terracotta (#C25B3F).

## Backend
Supabase. Tables: users, words, sentences, cards, review_logs, audio, mnemonics, language_islands, island_sentences, topics. Row-level security on every table. Supabase project hosted on EU region (eu-central-1) for GDPR compliance.

## FSRS-5 Engine
Custom implementation at src/lib/fsrs/. Do NOT use ts-fsrs or any external FSRS library. 16 passing unit tests. The engine is complete — integrate it, do not replace it.

## AI Layer
Cloudflare Worker proxy. API key in Worker secrets only — never in browser, never in git. One MCP server with six tools:
- grammar_explain: why does this form exist? plain explanation for adult learners.
- conjugate: return all forms of a Finnish verb/noun in a structured table.
- vocabulary_context: use this word in 3 example sentences at the learner's current CEFR level.
- puhekieli_transform: convert a kirjakieli sentence to its puhekieli equivalent with notes on the transformations.
- culture_note: cultural context for a word or phrase.
- error_correct: the learner produced X — what is wrong and why, in plain English?

## Audio
Azure Cognitive Services Finnish TTS (fi-FI-NooraNeural for female, fi-FI-HarriNeural for male). Kirjakieli sentences only. Puhekieli displayed as text. Audio files stored in Supabase Storage.

## Content
Vocabulary ordered by Leipzig CC-BY Finnish frequency corpus. Seed sentences from Tatoeba CC-BY Finnish-English pairs, augmented with Claude-generated content verified against uusikielemme.fi grammar rules. All attribution in /docs/content-attribution.md.

## Deployment
Vercel (frontend), Cloudflare Workers (AI + MCP), Supabase (data). GitHub Actions for all deploys — no local Wrangler required.
