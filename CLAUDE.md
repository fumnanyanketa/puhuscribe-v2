# CLAUDE.md

## Project
PuhuScribe v2: a Finnish language learning app for adult immigrants in Finland targeting YKI exam readiness at B1 to B2 level. Freemium. Built solo with Claude Code.

## The person we are building for
An adult immigrant who arrived in Finland 0–18 months ago. Working in English. Under pressure — residency, employer, or personal urgency — to learn Finnish. Has tried Duolingo, hit its ceiling, stopped. Needs Finnish to stay. Every design and content decision is tested against this person's reality.

## Files to read at session start
- @BRIEF.md — product brief, competitive wedge
- @ARCHITECTURE.md — tech stack and component decisions
- @PROGRESS.md — what shipped last session, what is next

## Behavioral rules
- Start every session by reading PROGRESS.md (the STANDING INSTRUCTIONS block at the top first).
- **Always work on `main`.** If a fresh session is auto-assigned a different branch, override it and switch to `main` (`git checkout main && git pull origin main`). The owner has given explicit, standing permission to commit and push directly to `main`.
- **Ship-as-you-go:** we correct the live app and the owner reviews each change on their device. For every meaningful correction — make the change, run `npm run build` AND `npm run test`, and ONLY if both are clean, commit and `git push origin main` (Vercel auto-deploys `main`). Push automatically and immediately; do not ask first.
- **Guardrail before every push:** build + tests must pass. If either fails, do not push — fix it or report it. Never push a broken deploy.
- End every session by appending a 3-line entry to PROGRESS.md: what shipped, what is blocked, what is next.
- Commit at the end of every meaningful task with a clear message.
- For research, orchestration, or architecture work, use Plan mode.
- For mechanical changes with clear scope, Code mode is fine.
- When in doubt about scope or approach, ask before acting (except the ship-as-you-go push, which is pre-authorized).

## Commands
- `npm run dev` — start the Vite dev server
- `npm run test` — run Vitest (16 FSRS tests currently passing)
- `npm run build` — production build
- `bash scripts/generate/run.sh` — **"content generation"**: generate validated Finnish content (Voikko-grounded pipeline at scripts/generate/; needs `ANTHROPIC_API_KEY`). Emits scripts/generate/out/generated_sentences.sql to load into Supabase. (Reingesting from CC corpora is a separate, deferred path — do NOT start there unless explicitly asked.)

## Conventions
- All brand values live in CSS custom properties under :root. Never use stock Tailwind utilities for brand colors or typography.
- API keys never appear in the browser. Cloudflare Worker proxy is mandatory.
- Sub-agent prompts must have a written definition of done before launch.
- Puhekieli text is always paired with kirjakieli audio, never standalone TTS.
- Do NOT run the screenshot harness (`shots/`, `node shots/capture.mjs`) automatically. Only generate screenshots when the owner explicitly asks — it wastes compute otherwise. Verify changes with `npm run build` + `npm run test`.

## Hard rules
- NEVER commit secrets, API keys, or .env files.
- NEVER refactor auth, RLS policies, or billing without explicit confirmation.
- NEVER use the deprecated ts-fsrs library. The custom FSRS-5 engine at src/lib/fsrs/ is the only scheduler.
- The Kotus frequency lexicon (CC BY-ND-NC) is NOT licensed for commercial use. Use Leipzig CC-BY corpus only.
