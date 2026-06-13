# PuhuScribe — Growth & Content Engine (working plan)

> The traffic engine for the app. Built to run on **agents**, with the owner as the
> single **human-in-the-loop** step (read → verify → approve → publish).
> Grounded in `research/positioning-brief.md` + `research/reddit-voice.md`.
> Status: **draft v1 — strategy locked, execution not yet started.**

---

## 0. The one strategic truth

Our audience is **small, concentrated, and extremely high-intent** — immigrants in
Finland on a residency / employer / personal clock who need Finnish to stay. That is a
strength, not a limit:

- **We don't chase virality. We own a niche.** Finnish-learning search demand is
  low-volume but low-competition and high-intent. We can realistically rank #1 for nearly
  every "how do I say X / what does this case mean / how do Finns actually say Y" query.
- **The community is in ~8 places, not 800** — so we can genuinely be present in all of them.

The engine is therefore two things, and everything below serves them:
**(1) own search for Finnish-learning intent, and (2) be the most helpful voice in the few
communities where these people already gather.**

---

## 1. The unfair advantage: the product IS the content factory

We already built the expensive part. Most content teams would start from zero; we don't:

- **6 MCP tools** (`conjugate`, `grammar_explain`, `puhekieli_transform`,
  `vocabulary_context`, `culture_note`, `error_correct`) — each output is a publishable page.
- **The Voikko gate** guarantees no invented Finnish ever ships. Competitors publish
  AI-hallucinated Finnish; we publish **machine-verified** Finnish. That is a trust story to
  the exact audience that will notice.
- **Real IPA + Azure TTS audio + kirjakieli↔puhekieli pairs + mnemonics** — unique page data
  competitors' pages don't have.

**Implication:** we can generate a large library of genuinely-better-than-competitors pages
from infrastructure we already own, run by agents, with the owner only doing the final read.
The hard part is done.

**Non-negotiable quality bar:** every Finnish form we *publish* passes the same Voikko gate as
our seed content. Puhekieli has no machine validator → it stays text-only until a Finnish
speaker verifies it (see `docs/island-sentences.md`; this is already our standing pending item
and now matters double).

---

## 2. The content engine (3 layers)

**Layer 1 — Cornerstone posts (20–30 evergreen hubs).** Plain-English, matched to the wedge and
to verbatim learner pain from our research:
- Kirjakieli vs puhekieli: why you understand the textbook but not the shopkeeper
- The Finnish cases, explained honestly (not memorized)
- How to actually pass the YKI B1 speaking test
- Why Duolingo left you mute in Finnish (anti-Duolingo — see positioning H1)
- Learning Finnish for permanent residence: the realistic timeline (residency-clock — H3)

**Layer 2 — The programmatic library (the compounding moat: hundreds→thousands of pages).**
Templated, tool-generated, Voikko-verified, each ending in "practice this in PuhuScribe":
- *How to conjugate [verb] in Finnish* — every common verb, all forms
- *[word]: meaning, pronunciation, real audio, mnemonic* — the whole vocabulary
- *You learned "[kirjakieli]". Finns say "[puhekieli]".* — **the wedge as content nobody else can make**

**Layer 3 — Short-form video (the discovery flywheel).** The puhekieli reveal is built for
TikTok / Reels / Shorts / YouTube ("textbook taught you *minä olen*; Finns say *mä oon*"). We
already have the audio (Azure TTS) and a Waveform component. One blog post → 5–10 clips.

---

## 3. How it runs on agents (the assembly line)

Maps almost 1:1 onto the existing `marketing/` folders (`voice/`, `staged/`, `log/`, `learners/`):

1. **Research agent** → mines queries, scores by intent × competition, maintains a backlog.
2. **Draft agent** → writes each page *using the product's own tools*, so Finnish is
   product-grade and **passes the Voikko gate** (no hallucinated forms, ever).
3. **Voice agent** → rewrites to brand voice (honest, plain-English, anti-firehose), strips em
   dashes, layers ICP empathy. Reads `marketing/voice/`.
4. **Verify agent** → Voikko-checks every Finnish form, flags UNCERTAIN, drops into `marketing/staged/`.
5. **→ OWNER (the only human step)** → review staging for correctness + fit, approve.
6. **Publish + repurpose agent** → ships to blog, fans 1 post into N social clips + captions,
   updates internal links, logs to `marketing/log/`.
7. **Distribution agent** → drafts the Reddit/forum/LinkedIn posts (queued for approval —
   never auto-posted).
8. **Analytics agent** → weekly report from Search Console + analytics, feeds winners back to the backlog.

---

## 4. Distribution channels (ranked for *our* audience)

**Tier 1 — start here:**
- Programmatic SEO library (compounds forever, ~$0 CAC)
- Short-form video (puhekieli reveals — cold discovery)
- Reddit (r/LearnFinnish, r/Suomi, r/Finland) + **Finland Forum** — genuinely helpful, not spam
  (the "I Hate Finnish" thread is in our research)

**Tier 2:**
- Owned email / newsletter (the running blog) — the list we control
- LinkedIn — the residency / professional angle (H3 came from here)
- Facebook / Telegram expat & nationality groups (Helsinki expats; "Nigerians/Indians in
  Finland"; city groups)

**Tier 3 — offline channels nobody else works (durable, high-leverage):**
- Kotoutumiskoulutus (integration courses), TE-services, työväenopisto / kansalaisopisto,
  university international offices, libraries, SPR language cafés. Partnership / flyer / QR
  distribution where the residency-clock cohort is *required to show up*.

**Tier 4 — later, once economics are known:** Finnish-learning YouTuber collabs; small
retargeting paid.

---

## 5. What we need (checklist)

**Tooling / infra**
- [ ] **Blog on our own domain** (Astro/Next on the same Vercel) — programmatic SEO needs our
      own domain; it builds authority that feeds the app. Optional: cross-post to **Substack**
      for its network + free email list. (Don't put the library *on* Substack.)
- [ ] **Google Search Console + Bing Webmaster + Plausible/GA4** — non-negotiable for search.
- [ ] **Email capture on the landing page** — note: landing is *deliberately* no-email for beta;
      the engine wants a newsletter opt-in. Revisit.
- [ ] **Social accounts**: YouTube, TikTok, Instagram, LinkedIn page, a *real* Reddit account.
- [ ] **Backlog/calendar** — Notion DB (Notion is connected) or markdown in `marketing/`.
- [ ] **Brand voice guide** (`marketing/voice/`) — the editorial constitution agents write to.

**Human-in-loop (the owner's only work)**
- [ ] Final correctness + brand review of `marketing/staged/` before publish (batchable).
- [ ] **Native Finnish speaker for puhekieli verification** — wrong puhekieli to a
      native-adjacent audience = instant credibility loss. Already our standing pending item.

---

## 6. Funnel & metrics

`impressions → blog visits → app clicks → beta signups → activated (did a sprint) → retained → paid`

- The **content engine** optimizes the top; the **app** optimizes the bottom.
- **North-star for the engine: weekly *organic* signups.**
- Leading indicators: indexed pages, ranking keywords, Search Console clicks, email list size,
  referral traffic to the app.

---

## 7. Sequencing

- **Phase 0 (now, beta):** instrument everything (Search Console, analytics, email capture),
  stand up the blog skeleton, write the voice guide. **Turn workshop users into
  testimonials/case studies** — first social proof.
- **Phase 1:** ship the 20–30 cornerstone posts.
- **Phase 2:** switch on the programmatic library — the compounding engine.
- **Phase 3:** short-form video at cadence + community presence.
- **Phase 4:** offline partnerships + newsletter rhythm; then paid/creators once conversion
  economics are known.

---

## 8. Honest risks

1. **Programmatic SEO can trip Google "thin content"/helpful-content filters** if pages are
   empty doorways. Defense is built in: real audio, real IPA, verified forms, mnemonics, the
   puhekieli reveal — genuinely useful, unique data. Hold the seed-content quality bar.
2. **One wrong Finnish form published = instant credibility loss.** Voikko gate on *published*
   content + owner review + the Finnish-speaker puhekieli pass are the moat, not optional extras.
3. **Audience-size ceiling.** Don't expect millions; expect to own a niche. Even a meaningful
   share of immigrants doing YKI prep is a real business at the €94/yr anchor.

---

## 9. First two decisions to tee up (when we build this out)

1. **Own-domain blog vs. Substack-first?** (Recommendation: own-domain for the library, Substack
   optional for newsletter/network.)
2. **Build the programmatic-library generator now, or after cornerstone posts prove the funnel?**
