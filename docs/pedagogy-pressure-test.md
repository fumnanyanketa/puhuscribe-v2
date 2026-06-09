# Honest pressure-test: PuhuScribe vs. the science of language learning

Written 2026-06-09 after web research, as an objective check on whether the
product is on the right track. Sources at the bottom.

---

## Part 1 — Puhekieli verification (the 50 island sentences)

**Verdict: the puhekieli follows documented colloquial-Finnish rules. It's
standard Helsinki-register spoken Finnish. Still worth one native skim for
register consistency, but it is trustworthy as a v1.**

Checked against published sources (Wikipedia *Colloquial Finnish*; **uusikielemme.fi**
— the project's own grammar authority; thisisFINLAND; a spoken-Finnish corpus paper):

- Pronouns `minä→mä, sinä→sä, minun→mun, sinun→sun, minua→mua` — documented standard colloquial. ✓
- Demonstrative `tämä→tää` — documented (uusikielemme "Tää Toi Se"). ✓
- "olla": `olen→oon`, `ole→oo` — documented. ✓
- Partitive assimilation: `suomea→suomee`, `englantia→englantii` (-ia→-ii), `asuntoa→asuntoo` — documented. ✓
- Question clitic `-ko/-kö → -ks`: `onks, meneeks, saisinks, voinks, paljonks` — standard colloquial reduction. ✓
- `minulla on→mul on` ✓; `tämän→tän` ✓; shortening of "unshortenable" words (`vielä→viel`, `anteeksi→anteeks`) ✓.

Caveats: these are **southern/Helsinki** forms (the east says mie/sie, the southwest mää);
a few are very casual fast-speech reductions (`mis`, `mist`, `kahelt`). Voikko can't
validate puhekieli, so this is rule-based, not machine-verified — one Finnish speaker
reading the 50 aloud settles it in ~20 minutes.

---

## Part 2 — Is the plan on the right track?

**Short answer: the foundations are excellent and genuinely evidence-backed. But the
instinct that "something is missing" is correct — today the product is a
vocabulary-and-pronunciation trainer, not yet a path to B1/B2. The gaps are writing,
real listening, reading, and a produce-and-get-feedback loop. For a YKI-targeted app
that matters a lot.**

### What's genuinely strong — keep, don't second-guess
Among the most replicated findings in learning science:
- **Spaced repetition (FSRS) + active recall** (English→Finnish production). The
  spacing and testing effects are about as solid as evidence gets.
- **Dual-register kirjakieli/puhekieli** — a real differentiator; no general app does it.
- **Frequency-ordered vocabulary** — always the most useful next word.
- **Honest calibration** (B1/B2 over months, not "fluent in weeks").

### Where the science says PuhuScribe is exposed

**1. The four skills aren't balanced — and YKI tests all four.**
Research is consistent: integrated four-skills instruction beats isolated drilling, and
you should train the *weakest* skill. Critically, the **YKI exam has four separately
graded subtests — speaking, listening, reading, writing** (oph.fi). Today the app trains
vocabulary (strong), a little speaking (shadowing), thin listening (TTS), **no reading,
no writing.** That under-prepares for a four-skill exam.

**2. It currently replicates the documented "vocab-app" failure mode.**
This is the exact research critique of Duolingo: vocab apps are "really good for
receptive skills — listening, reading, vocabulary, grammar recognition," but "people
struggle with production: speaking and writing." The SRS is fixed; the productive side
is still thin.

**3. Writing is missing — and it isn't optional.**
Writing is (a) a YKI subtest, (b) a four-skills pillar, and (c) the clearest engine of
**Swain's output hypothesis**: producing language forces you to *notice* the gaps in
what you can say and pushes deeper processing than recognition. Recognising "kahvi =
coffee" ≠ writing "Haluaisin tilata kahvin." In the strategy doc, writing exists
(Mode 5) but is **back-loaded to Phases 2–3** — the plan defers a pillar.

**4. Real listening + reading (comprehensible input) are missing.**
TTS playing a word is not *listening practice*. Meta-analyses show **extensive reading
and listening** produce broad gains (vocabulary, writing, speaking, motivation), and
quantity of input matters. There's almost no extended input yet.

**5. There's no production-with-feedback loop.**
Shadowing without scoring and recall with a self-rated button are good, but they aren't
*interaction*. The interaction/feedback research and the output hypothesis say learners
improve by producing → getting corrected → retrying. The AI-conversation / writing-
feedback piece (planned Phase 2) is the missing engine that turns "I recognise words"
into "I can say and write my own sentences."

### The honest framing
The **bones are science-aligned — better grounded than most commercial apps.** But the
**build and the phasing over-index on the receptive vocabulary slice** and defer the
productive, input-rich skills. Risk: a beautiful vocabulary trainer testers love for a
week, then the classic plateau — they recognise words but can't *use* the language, and
aren't ready for the YKI writing/reading/listening papers.

### What to change — concrete, prioritised
1. **Map every activity to one of the four YKI skills** and show it on the journey, so
   coverage stays honest.
2. **Pull writing forward** — even tiny: a daily one-sentence "say it in Finnish, type
   it" with light feedback (Voikko checks word validity; an LLM gives gentle
   correction). Highest-leverage missing piece.
3. **Add real listening** — short graded audio (Azure TTS sentences to start, real clips
   later) with a comprehension check.
4. **Add a minimal production→feedback loop** — "write/say a sentence using today's word
   → get one correction." The output+feedback engine.
5. **Reading** can come slightly later (most self-serve), tied to the sentences.
6. **Keep the SRS spine and the dual-register wedge exactly as they are.**

### On the journey map looking "basic"
Agreed. Two upgrades: (a) label each stage with the **YKI skills it builds** + a CEFR
band; (b) make it a visual map (milestones, current node pulsing, locked nodes with
"unlocks at N words").

### My own caveat
This synthesises published research + the strategy doc; it isn't a study. A Finnish SLA
researcher or an experienced YKI-prep teacher would sharpen it — but the direction
(rebalance toward the four skills, especially writing and real input) is about as
well-supported as language-learning advice gets.

---

## Sources
- Colloquial Finnish — Wikipedia: https://en.wikipedia.org/wiki/Colloquial_Finnish
- Typical Features of Spoken Finnish (Puhekieli) — Uusi kielemme: https://uusikielemme.fi/spoken-language/typical-features-of-finnish-spoken-language-puhekieli
- Mä Mää Mie — Pronouns in Spoken Language — Uusi kielemme: https://uusikielemme.fi/spoken-language/spoken-language-grammar/ma-maa-mie-pronouns-in-spoken-language
- Speaking Finnish like the Finns — thisisFINLAND: https://finland.fi/life-society/extending-your-finnish-speech-reach-speaking-finnish-like-the-finns/
- National Certificates of Language Proficiency (YKI) — Finnish National Agency for Education: https://www.oph.fi/en/national-certificates-language-proficiency-yki
- The Role of Four Skills … Integrated Approach to SLA (ResearchGate): https://www.researchgate.net/publication/394166800_The_Role_of_Four_Skills_in_Teaching_and_Learning_An_Integrated_Approach_to_Second_Language_Acquisition
- Swain's Output Hypothesis (overview): https://vietnamteachingjobs.com/blog/what-is-swains-output-hypothesis-and-why-does-it-matter-for-language-learning/
- Comprehensible Input (overview of Krashen): https://www.leonardoenglish.com/blog/comprehensible-input
- Extensive Reading meta-analysis — Educational Psychology Review (Springer): https://link.springer.com/article/10.1007/s10648-025-10068-6
- The Power of Extensive Listening (Springer): https://link.springer.com/chapter/10.1007/978-981-95-2984-1_15
