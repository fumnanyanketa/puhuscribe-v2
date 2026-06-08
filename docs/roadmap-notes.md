# Product roadmap notes (owner-aligned)

Durable record of progression decisions so they aren't lost between sessions.
Updated 2026-06-08.

## 1. Vocabulary bank — daily intake (the bank keeps growing)
The Day One Sprint (50/100/150) is the **initial load**, not the ceiling.

- After activation, introduce **~10–15 new Finnish words per day** (schema already has
  `users.daily_new_cards`, default **12**), drawn **frequency-ordered** and **excluding
  words the learner has already met**, continuing from where the sprint left off (word
  151, 152…).
- Each new word is encoded (word + meaning + real IPA + audio), then **enters FSRS**.
- Anything the learner **struggles with flows into spaced repetition** — already wired:
  a sprint miss seeds FSRS "Again" (`recordWordEncounter`), a hit seeds "Good".
- **Sequencing decision:** sequential, not parallel. Finish/choose the sprint set first
  (the one-time load), *then* the daily ~12-word intake continues on top. Avoids two
  competing new-word streams.

**Implementation approach (when we build it):** unify the sprint runner as the
"vocabulary intake" mode. Day One = a big run; daily = a small run of the next N unmet
frequency words. Needs a fetch like `fetchNextWords(userId, n)` =
words ordered by `frequency_rank`, excluding word_ids the user already has a card for,
limit n. Status: NOT built yet (current intake is only the Day One Sprint).

## 2. Language Islands — first content (REMINDER for when we build Mode 3)
When we build Language Islands (the "speak with confidence" spine), the first set is
**~50 of the most *useful real-life* sentences for someone who just arrived in Finland** —
things a newcomer would actually need or want to say (KELA / pankki / vuokra / lääkäri /
introducing yourself / asking directions), **not random sentences**. Dual-register
(kirjakieli + puhekieli) as always. This is the bridge from words to confident speaking,
ahead of any grammar focus.

## 3. Pending from owner
- Owner has "something else about language learning" to add — placeholder; fold in when
  provided.
