# PuhuScribe v2 Brief

Product: PuhuScribe is a Finnish language learning app for adult immigrants in Finland targeting YKI B1 to B2. Freemium. Competitive wedge: dual-register content (kirjakieli and puhekieli taught together from day one), custom FSRS-5 spaced repetition, mnemonic encoding for every word, and an AI layer that explains Finnish grammar honestly rather than hiding it. The learner feels the method work on day one through the Day One Sprint (150–200 words, wave-paced, mnemonic-paired). YKI readiness is the direction, not a day-one feature.

Stack: React 19 with Vite 6. Custom CSS design system with Finnish brand tokens. Supabase for auth and PostgreSQL. Cloudflare Worker proxy in front of Anthropic API. One MCP server with six tools (grammar_explain, conjugate, vocabulary_context, puhekieli_transform, culture_note, error_correct). Azure Cognitive Services for Finnish TTS (fi-FI-NooraNeural). Leipzig CC-BY frequency corpus for word ordering. Tatoeba CC-BY sentence pairs as seed content. Deployed on Vercel (frontend) and Cloudflare Workers (AI/MCP).

Positioning brief lives at /research/positioning-brief.md. Read it before any marketing or copy work.

This week: [insert this week's milestone].
