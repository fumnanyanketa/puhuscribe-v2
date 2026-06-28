---
name: lesson-extractor
description: Turn instructional content (lectures, talks, tutorials, courses, how-to or explainer videos) into a comprehensive, well-organized learning reference rendered as an HTML dashboard. Use whenever the user shares a transcript or video of something they want to LEARN FROM or RETAIN and asks to "extract the lessons", "turn this into notes or a study reference", "summarize this so I can study it", or "what is actually taught here". Trigger even without the word "extract" (pasting a lecture or tutorial transcript and asking what to make of it counts). This skill is for LEARNING. It captures every lesson, defines unfamiliar terms, and optionally translates technical material to the learner's own tools or platform. It is NOT for judging a creator, fact-checking suspicious claims, or separating hype from substance; for sales pitches, hype-heavy videos, "is this legit", or "pressure-test this", use the video-deconstructor skill instead.
---

# Lesson Extractor

Turn instructional content into a comprehensive, well-organized learning reference rendered as an HTML dashboard. The mindset is the whole point: act as a careful student capturing what is taught, not a critic judging the teacher. Get the substance out completely and make it easy to absorb and revisit.

## When to use this (and when not to)

Use this for content whose purpose is to teach: lectures, talks, tutorials, courses, conference sessions, how-to and explainer videos, documentation walkthroughs. Signals include "extract the lessons", "turn this into notes", "what is taught here", "summarize this so I can study it", or simply a pasted lecture or tutorial transcript.

Do NOT use this to judge a creator, verify suspicious claims, or separate marketing from substance. If the source is a sales pitch, a hype-heavy influencer video, or the user asks "is this legit" or "pressure-test this", stop and use the video-deconstructor skill instead.

The clean rule: if the speaker is trying to convince or sell, deconstruct it; if the speaker is trying to teach something the user wants to retain, extract it.

## Workflow

### 1. Confirm it is an extraction job
If the content is persuasive or promotional rather than instructional, say so plainly and point to video-deconstructor. Otherwise continue.

### 2. Read the whole source and inventory it
Read the entire transcript or source before writing a single section. Build a complete inventory:
- the core purpose (what the session is for, in one or two sentences)
- the structure or flow (how it progresses from start to finish)
- EVERY lesson, technique, command, concept, and rule of thumb taught. Completeness matters more than selectivity. "Extract the lessons" means all of them, not a curated few.
- terms a newcomer would not already know
- a handful of memorable or load-bearing lines worth keeping

### 3. Decide which sections apply
- **Field primer**: almost always include a short, plain-English primer on what the subject area actually is, placed right after the format note and warning flag and before the glossary. Write it for someone who knows nothing about the field: what it is, what problem it addresses, what people do with it, and where this particular video sits within it. Keep it to a short paragraph or two, high level, with no unexplained jargon. It is orientation, not a lesson, so do not duplicate the glossary (which defines individual terms) or the big-picture takeaways (which compress the video's argument). Skip it only when the subject genuinely needs no introduction for a general audience.
- **Prerequisites**: when the subject builds on skills or background a learner should already have, include a short "before you dive in" section right after the field primer (and before the glossary). List what someone needs in place to follow the material effectively, and be honest by separating the genuinely essential from the merely helpful, and by noting prerequisites that are only needed for a deeper layer than this particular video covers. Keep it calibrated, not gatekeeping: the point is to tell a newcomer where to start, not to scare them off. Skip it for general-audience topics that assume no background.
- **Glossary**: include a plain-English glossary (right after the field primer) whenever the material introduces vocabulary a newcomer would not already know. For someone meeting a subject for the first time this is one of the most useful sections, because the rest of the document assumes words it never defined. Division of labour: the primer says what the field is, the glossary defines the specific terms inside it.
- **Environment translation**: see the dedicated section below.

### 4. Accuracy pass (scale it to the content)
- For reliable, well-established, or technical material (a standard tutorial, a fundamentals lecture), keep this light: a short "Context and corrections" note that mostly confirms the material is standard and flags any genuine nuance. Do not manufacture doubt.
- For ARGUMENTATIVE or claim-heavy material (a lecture that advances a thesis, makes bold empirical or political claims, or states contested research as settled fact), ESCALATE. Web-search and verify the load-bearing, checkable, or surprising claims, and give the corrections section real weight. Mark contested claims, factual errors, and opinions-stated-as-fact honestly and evenhandedly, and never pass a contested claim along in your own voice. This is the case where the corrections section earns its place.

### 5. Render the dashboard
Build the output by copying `assets/dashboard_template.html` and filling it in. The structure and typography are fixed; this is the default look. Save it to the outputs directory.

### 6. Deliver and offer follow-ups
Present the file. Lead with a tight summary of the major lesson buckets so the user gets value without opening anything. Then offer natural next steps: a markdown version for a notes library, a one-page cheat-sheet, or hands-on exercises that mirror the material.

## Output structure

ALWAYS base the dashboard on `assets/dashboard_template.html`. Sections, in order, omitting the ones marked optional when they do not apply:

1. **Hero**: a solid accent header with a kicker, the title, and a one-line thesis or summary. A photo background is optional (see the template note); the default is the solid accent colour.
2. **Jump nav**: small buttons linking to the sections you actually include.
3. **Format note** and an optional **warning flag** (include the flag only when the content is opinion-heavy or contestable).
4. **Field primer**: a short, plain-English orientation to the subject area for someone new to it (what the field is, what it is for, why it matters, where the video sits within it). Comes right after the format note and warning flag and before the glossary. Usually included; skip only when the topic needs no introduction.
5. **Prerequisites** (optional): what a learner should already have in place to follow the material, separated honestly into essential versus helpful (and flagging anything only needed for a deeper layer than the video covers). Comes right after the field primer and before the glossary. Include when the subject builds on prior skills; skip for general-audience topics.
6. **Glossary** (optional): term and plain-English meaning.
7. **Big-picture takeaways**: the handful of conceptual takeaways, as cards.
8. **The lessons** (the core, exhaustive): use Pattern A (numbered argument blocks) for ideas and arguments, Pattern B (grouped reference tables) for procedural or technical material, or both.
9. **Structure / flow** (optional): a row of stage pills.
10. **Environment translation** (optional): see below.
11. **Context and corrections**: verdict-tagged claims (see below).
12. **Lines worth keeping**: a few short, memorable quotes.
13. **Footer**: ALWAYS end with a single "Watch the original" play button linking to the source video, and put nothing else under it (no credit line, no extraction note, no descriptive text). Match the label to the source ("lecture", "video", "talk", "tutorial"). If the user gave the URL, use it. If not, do NOT stop to ask before building. Build the entire dashboard with a clearly-marked placeholder href, present it as normal, and THEN end the response with a single, explicit, standalone request for the source link (a dedicated closing line the user cannot skim past, not a remark buried inside the delivery prose). The user has most likely just forgotten to include it, so the build should never wait on it; once the dashboard is shown, the link insertion is the only step left. When the user replies with the link, strip any tracking tail (for example `?si=...`), insert it with one targeted edit, and re-present, nothing else. You may also try searching for the source video, but only use a found link if you can confidently identify the exact one and confirm it with the user, since the correct video often cannot be identified by search alone. Never link a video you are not confident is the correct source, and never replace the button with text.

## Choosing the accent colour

The structure never changes, but the accent colour should fit the subject. The template ships with four presets, each suited to a kind of subject:

- **Blue**: general, foundational, or academic subjects (most lectures and overviews, including technical CS topics taught academically).
- **Green**: growth, business, data, or money subjects.
- **Teal**: science, health, nature, or medical subjects.
- **Red**: argument-driven, opinion-heavy, or high-stakes topics.

Pick the closest fit. If a subject spans two, either is fine. Vary the colour across topics so the library does not drift toward one. Set the three `--accent` values at the top of the template's `:root`; the light tints and rules follow automatically. (Red is also the Inaccurate verdict colour, but the two are different shades and coexist; on a heavily corrected piece, just sanity-check that red still reads as the right fit.)

One rule: the four **corrections verdict colours** (Supported, Contested, Inaccurate, Opinion) stay fixed and are never tied to the accent, so a verdict never blends into the theme.

## Context and corrections

Render this as verdict-tagged claim cards. Use these four tags:
- **Supported**: the claim holds up (optionally "Supported, overstated" when the direction is right but the wording overreaches).
- **Contested**: a real debate exists; give both sides.
- **Inaccurate**: factually wrong; state what is actually true.
- **Opinion**: the speaker's view delivered as if it were fact, especially political or personal claims.

Keep this section short and mostly green for reliable material. Make it substantial for argumentative material, grounded in web search.

## The environment-translation feature

When the material is technical and assumes a platform, tool, or language the learner does not use, add a parallel column or section mapping the taught approach to the learner's environment (for example, a shell course taught in bash, used by someone on Windows/PowerShell). Use Pattern B tables plus the good/warn banners.

Rules:
- Show the original (what is taught) and the learner's equivalent side by side.
- Be honest where there is no clean equivalent. Flag genuine divergence with a clear note rather than inventing a fake one-to-one mapping. A learner is better served by "this does not exist on your platform, here is the nearest real thing" than by a misleading equivalence.
- If the learner's environment is unspecified but a translation is clearly useful, infer it or ask. Absent other information, a common default is Windows / PowerShell, but confirm when the mapping carries real consequences.

## Writing conventions

- Be exhaustive on lessons and concise on prose. The value is in capturing everything taught, not in commentary around it.
- Write definitions and explanations in plain language a first-timer can follow.
- The field primer is written for a true beginner: assume zero background, lead with what the field is and what it is for, and keep it to a few sentences. It situates the reader so the glossary and lessons land; it should not itself turn into a lesson.
- The prerequisites section is calibrated, not gatekeeping: separate essential background from helpful-but-optional, and say plainly when something is only needed for a deeper layer than the video itself covers.
- Do NOT use em dashes anywhere in the output. Use commas, colons, parentheses, or short hyphenated phrases instead.
- Report the source's claims as the source's ("the lecturer argues", "she claims") rather than asserting contested points in your own voice.
- Stay honest about gaps and divergence. Never paper over something the source skipped, or something that does not translate to the learner's tools.
- Verify load-bearing or checkable claims with web search. Do not pad the corrections with manufactured doubt.
- Wrap every table in a `<div class="table-wrap">` so wide tables scroll instead of overflowing on small screens.
- Keep the visual style and structure consistent with the template so repeated extractions form a coherent set the learner can build a library from.
