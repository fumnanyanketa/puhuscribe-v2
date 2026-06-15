# How PuhuScribe's spaced repetition works

A plain-English explainer of one of the app's core features — written so it can
be lifted straight into a talk or pitch. It describes the *actual* implementation
(`src/lib/fsrs/`, `src/lib/data/cards.ts`, `src/lib/grade.ts`), not generic theory.

---

## In one paragraph

Every word a learner meets enters a scheduler. Instead of re-reading it, the
learner is later asked to **produce it from memory** (type the Finnish for an
English prompt). The system grades the attempt and schedules the next review for
the moment the learner is calculated to be **~90% likely to still remember it** —
the edge of forgetting. Get it right and the gap to the next review grows (days →
weeks → months); forget it and the gap snaps short until it re-sticks. The result:
durable memory with the **fewest possible reviews**, and nothing ever has to be
re-reviewed by hand.

---

## Why it exists (the wedge)

Cramming fades; spacing sticks. Decades of memory research (the "spacing effect"
and "testing effect") show that *retrieving* something just as you're about to
forget it is the single most efficient way to move it into long-term memory.
PuhuScribe is built around this instead of around streaks-for-streaks' sake:

- **Active recall, not recognition.** You *type* the word, you don't pick from a
  list or re-read it. Producing from memory is what builds durable recall.
- **Honest effort.** A streak in PuhuScribe means real study time, not a one-tap
  login. Spaced repetition is the engine that makes those minutes pay off.

---

## The loop

1. **Meet** — in the Day One sprint (and the daily 15-word intake), the learner
   sees a word, hears it, and confirms the meaning. The moment they do, that word
   becomes a *card* in the scheduler.
2. **Recall** — in **Daily Review**, the card resurfaces as active recall: the
   English meaning is shown, the learner types the Finnish from memory.
3. **Grade + reschedule** — the system judges the typed answer, assigns a rating,
   updates the card's memory model, and sets the next due date. Repeat.

The same engine also schedules the learner's **own sentences** (the Sentence Bank
/ Language Islands use `island_recall` cards), so personal content gets spaced
repetition for free.

---

## The engine: custom FSRS-5

PuhuScribe uses a **custom implementation of FSRS-5** (Free Spaced Repetition
Scheduler, the 19-parameter variant) — no external library. FSRS is the modern,
open algorithm that has largely superseded the old SM-2 (Anki's classic) approach
because it models memory more accurately and asks for fewer reviews at the same
retention.

Key settings (from `src/lib/fsrs/scheduler.ts`):

- **Target retention: 90%.** The app schedules each review for when your
  probability of recall is predicted to drop to ~0.9. Higher would mean more
  reviews; lower would mean more forgetting. 90% is the efficient sweet spot.
- **Learning steps: 1 and 10 minutes.** Brand-new or just-missed cards get a
  couple of quick same-session looks before they start spacing out in days.
- **Maximum interval: 36,500 days (100 years)** — effectively uncapped; a
  thoroughly-known word can be parked for a very long time.

Each card carries two numbers the algorithm updates every review:

- **Stability (S)** — how many days the memory lasts before recall drops to 90%.
  This is, in effect, the next interval. It *grows* with each success.
- **Difficulty (D)** — how hard this particular item is for this learner; it
  nudges how fast stability grows.

The forgetting curve `R(t) = (1 + FACTOR·t/S)^-0.5` predicts recall probability
`t` days after a review; the next interval is the `t` where `R` hits the 0.9
target (at 90%, the interval ≈ the stability in days).

---

## How a typed answer becomes a rating

The learner never rates themselves. `src/lib/grade.ts` turns what they typed into
one of the FSRS ratings:

| What they typed | Tier | FSRS rating | Effect |
| --- | --- | --- | --- |
| Exactly right | correct | **Good** | normal growth — gap widens |
| One typo / a missing ä-ö (within ~12% edit distance) | close | **Hard** | small growth — comes back sooner |
| Wrong, or left blank / "I don't know" | wrong | **Again** | lapse — resets to minutes, then short gaps |

(The engine also supports an **Easy** rating for big jumps; the typed-recall
grader is deliberately conservative and tops out at "Good".)

---

## The card's life: states and intervals

A card moves through four states:

- **New** → never reviewed.
- **Learning** → first same-session steps (minutes) before it graduates.
- **Review** → spaced out in days/weeks/months.
- **Relearning** → a Review card you forgot; brief minutes-steps to rebuild it.

Initial stabilities by first rating (days): Again ≈ 0.4, Hard ≈ 1.2,
**Good ≈ 3.1**, Easy ≈ 15.5. From the sprint:

- **Got it right** → seeded as Good → a short Learning step, then its first real
  recall, then it graduates to a ~3-day gap and grows from there.
- **Missed it** → queued as New, **due now** → it appears in the very next Daily
  Review for another attempt.

### Example timeline (a word you keep getting right)

These are approximate — FSRS computes a custom number per word, per learner — but
the *shape* is real:

```
Meet in sprint (day 0)
   → first recall, same day / next session
   → ~3 days
   → ~1 week
   → ~2–3 weeks
   → ~1–2 months
   → ~3–4 months
   → … toward a year and beyond
```

Each correct recall lengthens the next gap. **Get one wrong at any point** and it
lapses: back to minutes, then it rebuilds from short gaps until it re-sticks.

---

## "For how long does it keep coming back?"

**Indefinitely — but less and less often.** There is no fixed "review it N times
then it's done." A solidly-known word might resurface only once every several
months; a shaky one stays frequent until it firms up. Nothing is ever dropped,
and nothing is reviewed more than it needs to be. That self-balancing is the whole
point: minimum effort for lasting memory.

---

## Where it lives in the app

- **Day One sprint + daily intake** (`src/screens/DayOne.tsx`, `Learn.tsx`) —
  *seed* cards as words are met (`recordWordEncounter`).
- **Daily Review** (`src/screens/Daily.tsx` + `RecallRunner`) — the recall step;
  `fetchVocabSession` serves due cards first, then not-yet-reviewed met words.
- **Sentence Bank** — personal sentences are scheduled by the same engine.
- **Engine** — `src/lib/fsrs/` (algorithm + scheduler), with 16 unit tests.
- Scheduling state persists per user in the `cards` table; every review is logged
  to `review_logs` (an append-only history that also powers the streak and the
  owner insights dashboard).

Note: a card's schedule is **server-side** (it follows the learner across
devices). The daily study-time *streak* is currently per-device.

---

## Talking points (for a presentation)

- "We don't make you re-read flashcards. We make you *produce* the word from
  memory, then bring it back exactly when you're about to forget it."
- "It's built on FSRS-5 — the same modern algorithm the spaced-repetition
  community moved to from the old Anki one — tuned to 90% retention."
- "A word you know well might only show once every few months. A word you keep
  missing comes back in minutes. You never manage any of it — the app does."
- "This is the anti-cramming, anti-vanity-streak core: the fewest reviews for the
  most lasting Finnish."
