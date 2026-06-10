# Workshop demo deck — paste-ready Claude Design prompt

Paste everything in the block below into Claude Design. It produces a short,
on-brand 5-slide demo deck that matches the PuhuScribe app exactly (Sprout logo,
violet/teal register colors, snow-white, Poppins/Switzer, the bilingual pattern).

After it generates:
- Drop **marketing/workshop/install-qr.png** onto slide 5 (the white QR area).
- Optional: drop real app screenshots from `puhuscribe-screens.zip` on slides 3–4
  (best picks: `03-onboarding-two-registers`, `09-sprint-word-card`,
  `14-review-recall-graded`, `07-home-hub`, `15-sentencebank-list`).

---

Design a **5-slide demo presentation** (16:9, for projecting at a live workshop)
for **PuhuScribe**, a Finnish-learning app for adult immigrants in Finland. The
goal is to demo what the app does and recruit the room as our first beta testers.
Keep it short, confident, premium, and warm, with lots of whitespace.

## Brand system (match the app exactly)

- **Name / wordmark:** "PuhuScribe" in Poppins 700, letter-spacing -0.03em. Render
  it as `Puhu` in near-black + `Scribe` at 55% opacity.
- **Logo — "Sprout":** a rounded-square tile with a white seedling. Use this exact SVG:
  ```html
  <svg viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="g" x1="12%" y1="4%" x2="82%" y2="96%">
        <stop offset="0%" stop-color="#6B4FC6"/><stop offset="100%" stop-color="#383583"/>
      </linearGradient>
      <radialGradient id="gl" cx="34%" cy="26%" r="58%">
        <stop offset="0%" stop-color="rgba(255,255,255,.6)"/><stop offset="62%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <rect x="8" y="8" width="84" height="84" rx="26" fill="url(#g)"/>
    <path d="M50 78 L50 50" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M50 62 C 50 45 37 39 23 41 C 25 58 40 65 50 62 Z" fill="rgba(255,255,255,.96)"/>
    <path d="M50 55 C 50 41 63 36 77 38 C 75 53 60 59 50 55 Z" fill="rgba(255,255,255,.80)"/>
    <rect x="14" y="14" width="46" height="30" rx="16" fill="url(#gl)"/>
  </svg>
  ```
- **Colors:** background snow white with a faint vertical gradient (#FFFFFF to #F1F0F6).
  Ink #1B1A20, secondary ink #56525E, muted ink #8B8798. Accents: **violet #6B46C1**
  (the written language, "kirjakieli"), **teal #1F7C8E** (the spoken language,
  "puhekieli"), and a **blue highlight #2F5AD6** used only to mark the words that change
  between the two (do not call this color out by name in any visible text). Soft pastel
  cards allowed: lavender #D6D0E8, mint #CCDFD3, steel-blue #C4D2E6.
- **Type:** Poppins for display/headings (700/600, tight letter-spacing, big and
  geometric); Switzer (or Inter) for body at weight 500.
- **Bilingual pattern (signature):** when you pair Finnish with English, the Finnish is
  primary and the English sits quietly beneath in muted gray italic, never in brackets.
- **Feel:** rounded corners (16 to 32px), soft shadows, generous spacing, calm and
  modern. Cards are solid white with hairline borders, not glassy.

## Slides

**1 — Title / brand.** Centered Sprout logo + the PuhuScribe wordmark. Headline:
"Speak the Finnish Finland **actually** speaks" (put "actually" in violet). Subline:
"Understand the books. Speak the street." Small tag: "For adults building a life in
Finland, toward the YKI B1 to B2 exam."

**2 — The problem nobody fixes.** Headline: "Textbooks teach one Finnish. The street
speaks another." Three short points: (a) Adults need Finnish fast, for residency, work,
daily life. (b) Schools teach formal *kirjakieli*, but real people speak *puhekieli*, so
learners freeze. (c) Apps like Duolingo hit a ceiling and never get you to real
conversations or the YKI exam.

**3 — The wedge: two Finnishes, taught together.** Headline: "Both Finnishes, from day
one." Centerpiece is a **register card**: a white rounded card with a vertical dashed
connector down the left. Top: a small violet dot + label "KIRJAKIELI" and the sentence
**"Minun nimeni on Maria."** with the words "Minun nimeni" in the blue highlight. Bottom,
in a teal-tinted band: a teal dot + label "PUHEKIELI" and **"Mun nimi on Maria."** with
"Mun nimi" in the blue highlight. Caption: "Same meaning, taught twice. The highlight marks
what changes." Side note: "Real IPA pronunciation + honest grammar help."

**4 — How it works.** Headline: "About 30 minutes a day." Four compact cards, each an
icon tile + a Finnish title with a muted English line beneath: (1) **Sanastosprintti /
Day One Sprint** — the 150 most common words in your first session (show a pronounced
word, e.g. **hyvä** with IPA **/ˈhyʋæ/** meaning "good"). (2) **Päivän kertaus / Daily
review** — type each word from memory, brought back right before you would forget. (3)
**Oma lausepankki / Your sentence bank** — build sentences from your real life (the
doctor, Kela, work, the café). (4) **Neljä taitoa / All four YKI skills** — speaking,
listening, reading, writing.

**5 — Call to action.** Big headline: "Tule testaajaksi" with "Become a tester" beneath
in muted gray. A prominent white rounded square placeholder (about 280x280) centered or
to the right, labeled "Scan to open" — this is where the QR code goes. Three
reassurances as a row of pills: "Free during beta", "No app store", "Add to home
screen". Small footer: "puhuscribe-v2.vercel.app · Your feedback shapes what we build
next."

Make slide 5 feel like an invitation, not a hard sell.
