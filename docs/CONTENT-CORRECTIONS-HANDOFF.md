# CONTENT CORRECTIONS — HANDOFF

**Date opened:** 2026-06-06
**Status:** OPEN — content quality pass not yet done
**For:** the next Claude Code session (start fresh, read this first)

---

## Why this file exists

The Day One Sprint vocabulary, the 532-word lexicon, and the 141 mnemonics were
AI-generated in earlier sessions and were **never reviewed by a Finnish speaker.**
The product owner spotted multiple errors live in the app (wrong pronunciation for
`hyvä`/`ole hyvä`, wrong translation for `terve`, em dashes still rendering) and
correctly suspected the problems are **systematic, not isolated.**

This document is a complete catalog of every error found in a full audit of the
three seed files, plus the smaller fixes already applied this session. Work through
it top to bottom. Do **not** fix one word at a time and call it done — the whole
pronunciation layer needs a rebuild.

### The product owner's guiding principle (quote)
> "Before they listen, they need to **see** that it is correct."

Displayed pronunciation guidance must reflect **correct Finnish phonology**, not
anglicized guesses. The mnemonic *story* method stays. The *"sounds-like"* sound
bridges must be rebuilt for any word containing **y, ö, ä/ää, au, or a diphthong**
(that is most of them). Azure TTS audio is a *supplement* to correct text, never a
substitute — and right now it does not play at all (see §6).

---

## Files involved

| File | What it holds |
|---|---|
| `supabase/seeds/01_vocabulary.sql` | 532 words: `base_form`, `translation_en`, freq rank, level, POS, topic |
| `supabase/seeds/02_sentences.sql` | 500 kirjakieli/puhekieli sentence pairs + English gloss (NOT yet audited — see §5) |
| `supabase/seeds/03_sprint_mnemonics.sql` | 153 sound-bridge mnemonics (only 141 attach — see §2) |
| `PUHEKIELI_REVIEW.md` | annotations on the 500 pairs with REGIONAL/UNCERTAIN/CHECK flags |

**Important:** the seed files are the source of truth, but the **live Supabase
database already has the OLD data in it.** Fixing the `.sql` files is not enough —
each correction also needs an `UPDATE`/`INSERT` run against the live DB (the seeds
use `ON CONFLICT DO NOTHING`, so re-running them will NOT overwrite existing rows).
Plan to ship corrections as a new idempotent migration, e.g.
`supabase/migrations/20260607000001_content_fixes.sql`, that the owner runs once in
the Supabase SQL editor. (This container cannot reach Supabase; the owner runs SQL.)

---

## §1 — CRITICAL: base_form spelling errors

These teach the learner the **wrong Finnish spelling** AND break the mnemonic JOIN
(`JOIN words w ON w.base_form = m.base_form`). Fix in `01_vocabulary.sql` AND in the
live DB.

| Line | Wrong | Correct | Note |
|---|---|---|---|
| 01_vocabulary.sql:101 | `hedelma` | `hedelmä` | "fruit" — missing ä |
| 01_vocabulary.sql:503 | `hyva` | `hyvä` | "good" — missing ä. This is why the `hyvä` mnemonic does not attach (§2). |
| 01_vocabulary.sql:645 | `tummansiniinen` | `tummansininen` | "navy/dark blue" — doubled i typo |

Live-DB fix pattern:
```sql
UPDATE words SET base_form = 'hedelmä' WHERE base_form = 'hedelma';
UPDATE words SET base_form = 'hyvä'    WHERE base_form = 'hyva';
UPDATE words SET base_form = 'tummansininen' WHERE base_form = 'tummansiniinen';
```

---

## §2 — CRITICAL: 12 Day One mnemonics silently dropped

`03_sprint_mnemonics.sql` has **153** entries but only **141** insert, because the
JOIN finds no matching word for 12 of them. The owner sees "141" in the Day One
counter instead of the intended ~153. Two causes: (a) the word is misspelled in the
lexicon, (b) the word is missing from the lexicon entirely.

| Mnemonic base_form | Why it fails | Fix |
|---|---|---|
| `hyvä` | lexicon has typo `hyva` | fixed by §1 (`hyva`→`hyvä`) |
| `kyllä` | not in lexicon | add word `('kyllä', 'yes', ...)` |
| `kotona` | not in lexicon | add `('kotona', 'at home', ...)` (or change mnemonic to base form `koti` = "home") |
| `rakastaa` | not in lexicon | add `('rakastaa', 'to love', ...)` |
| `herätä` | lexicon only has noun `herääminen` | add verb `('herätä', 'to wake up', ...)` |
| `tämä` | not in lexicon | add `('tämä', 'this', ...)` |
| `tuo` | not in lexicon | add `('tuo', 'that', ...)` |
| `se` | not in lexicon | add `('se', 'it', ...)` |
| `ehkä` | not in lexicon | add `('ehkä', 'maybe', ...)` |
| `sitten` | not in lexicon | add `('sitten', 'then', ...)` |
| `tässä` | not in lexicon | add `('tässä', 'here', ...)` |
| `siellä` | not in lexicon | add `('siellä', 'there', ...)` |

These are all extremely high-frequency words (pronouns, demonstratives, "yes",
"maybe") that **belong** in the lexicon anyway. Add them, then re-run the mnemonic
INSERT for just these 12 against the live DB.

---

## §3 — Translation errors

| Word | Current translation | Problem | Suggested |
|---|---|---|---|
| `terve` (greetings, 01:12) | `hi / healthy` | Primary everyday meaning is the greeting. "Healthy" is the etymological/secondary sense and already lives as a separate entry at 01:166. | `hello` |
| `minä` (greetings, 01:24) | `I (formal)` | Wrong: `minä` is just "I". There is no formal/informal split on first person. The split is `sinä` (informal you) vs `te` (formal/plural you). | `I / me` |
| `voida` | `to be able to / to feel` (01:168) **and** `to be able to / can` (01:564) | Same word, two different glosses in two topics. Pick one canonical gloss. | `to be able to / can` (the "feel" sense is `voida hyvin/huonosti`) |
| `kokous` | appears twice: `meeting` (01:261 events) and `meeting` (01:290 work_general) | Duplicate. Harmless but redundant; consider one topic. | keep one |
| `koiran` (01:627) | `of the dog (genitive)` | Teaching an inflected case form as a standalone vocab item is confusing at A1/A2. | remove, or move to a grammar lesson |

**Also re-verify** (lower priority, looked plausible but a native speaker should
confirm): `pitää` = "to like / to hold / must" (crowded), `kuusi` = "six" (also
means "spruce"), `käydä` = "to go / to visit".

---

## §4 — SYSTEMATIC: pronunciation-hint errors in the mnemonics

This is the big one. The mnemonics follow the format
`'WORD' , 'SYLLABLES — ANGLICIZED: "story"'`. The ANGLICIZED render and the story
repeatedly teach **wrong Finnish sounds.** The errors cluster by phoneme:

### Finnish phonology the hints get wrong
| Finnish | IPA | Correct English hook | What the hints wrongly used |
|---|---|---|---|
| `y` | /y/ | rounded "ew" (as in *few*) / German ü | "ee", "ih", "ye", "oo", "yo" |
| `ö` | /ø/ | "ur" (as in *fur*, no r) / German ö | "oh" |
| `ä` / `ää` | /æ/ /æː/ | "a" as in *cat* / long *baa* | "ay", "ur", "eh" |
| `au` | /ɑu/ | "ow" as in *cow* | "or", English "auto" |
| `ai` | /ɑi/ | "eye / igh" | "ay" |
| `ei` | /ei/ | "ay" | (mostly OK) |
| `j` | /j/ | English "y" | English "j" (June, jaws, jet) |
| diphthongs `uo ie yö öy äy` | gliding | two vowels glided | flattened to one |
| stress | — | ALWAYS first syllable | (mostly OK) |

### Worst offenders with corrected sound-bridges

These are confirmed wrong. Replace the mnemonic `text` for each. (Stress always on
the first syllable; rolled `r`; double letters held longer.)

| Word | Meaning | WRONG (current) | CORRECTED bridge to use |
|---|---|---|---|
| `hyvä` | good | "HEE-vah" | `HY-vä — say "HEW" (like 'few') with rounded lips, then "va" as in 'cat'. GOOD.` |
| `ole hyvä` | you're welcome | "OH-leh HEE-vah" | `O-le HY-vä — "OH-leh HEW-va", rounded lips on 'hew', not 'hee'. YOU'RE WELCOME.` |
| `työ` | work | "sounds like two" | `TYÖ — round your lips for "ew", glide to "ur": one tight syllable. It means WORK.` |
| `yö` | night | "YO" | `YÖ — "ew" gliding into "ur", lips rounded throughout. NIGHT.` |
| `ystävä` | friend | "EAST-a-va" | `YS-tä-vä — "HEWS-ta-va", rounded 'ew', not 'east'. Your FRIEND.` |
| `tyttö` | girl | "TIT-oh" | `TYT-tö — "TEWT-tur" with rounded lips on both vowels. A GIRL.` |
| `kylmä` | cold | "KILL-ma" | `KYL-mä — "KEWL-ma", rounded 'ew'. COLD.` |
| `lyhyt` | short | "LEW-hit" | `LY-hyt — "LEW-hewt", BOTH vowels rounded 'ew'. SHORT.` |
| `väsynyt` | tired | "VEH-sin-it" | `VÄ-sy-nyt — "VA-sew-newt": 'va' as in cat, then rounded 'ew'. TIRED.` |
| `täytyä` | must | "TAY-tya" | `TÄY-ty-ä — "ta" (cat) gliding to "ew", then "tew-a". MUST / have to.` |
| `kysyä` | to ask | "KEE-sya" | `KY-sy-ä — "KEW-sew-a", rounded 'ew', not 'kee'. TO ASK.` |
| `syödä` | to eat | "SYOH / see-food" | `SYÖ-dä — "sew" gliding to "ur", then "da". TO EAT.` |
| `yksi` | one | "YEK-see" | `YK-si — "EWK-see", rounded 'ew'. ONE.` |
| `yhdeksän` | nine | "YEH-deck-san" | `YH-dek-sän — "EWH-dek-san", rounded 'ew'. NINE.` |
| `kymmenen` | ten | "KIM-me-nen" | `KYM-me-nen — "KEWM-me-nen", rounded 'ew'. TEN.` |
| `kyllä` | yes | "KILL-ah" | `KYL-lä — "KEWL-la", rounded 'ew'. YES.` |
| `nyt` | now | "NOOT" | `NYT — like the amphibian "NEWT", rounded 'ew'. NOW.` |
| `lämpö` | warmth | "LAMP-oh" | `LÄM-pö — "LAM" (cat) + "pur" (as in fur, no r). WARMTH.` |
| `löytää` | to find | "LOY-tah" | `LÖY-tää — "LUR" gliding to "ee", then long "aa" (cat). TO FIND.` |
| `lääkäri` | doctor | "LAY-car-ee" | `LÄÄ-kä-ri — long "AA" as in a sheep's "baa", then "ka-ri". DOCTOR.` |
| `sää` | weather | "SAY" | `SÄÄ — long "AA" like a sheep's "baa". WEATHER.` |
| `tärkeä` | important | "TURKEY-ah" | `TÄR-ke-ä — "TAR" (cat-a) + "keh-a". IMPORTANT.` |
| `auto` | car | "same as English!" | `AU-to — "OW" as in cow + "toh": OW-toh. NOT English "aw-to". A CAR.` |
| `aurinko` | sun | "OR-in-go" | `AU-rin-ko — "OW-rin-koh", 'ow' as in cow. THE SUN.` |
| `aika` | time | "AY-ka" | `AI-ka — "EYE-ka", 'ai' = 'eye'. TIME.` |
| `äiti` | mother | "AY-tee" | `ÄI-ti — "a" (cat) gliding to "ee" ≈ "EYE-tee". MOTHER.` |
| `juna` | train | "JUNE-ah" | `JU-na — "j" is English "y"! "YOO-na". A TRAIN.` |
| `kirjasto` | library | "CURE-jaws-toe" | `KIR-jas-to — "KEER-yas-toh", j = 'y', rolled r. LIBRARY.` |
| `suljettu` | closed | "SOUL-jet-too" | `SUL-jet-tu — "SOOL-yet-too", j = 'y'. CLOSED.` |
| `koulu` | school | "KOH-loo" | `KOU-lu — "KOH" gliding to "oo": KOH-oo-loo. SCHOOL.` |
| `puisto` | park | "BOOST-oh" | `PUIS-to — "POO-ees-toh", p not b. A PARK.` |
| `nuori` | young | "NEWRY" | `NUO-ri — "NOO-oh-ree". YOUNG.` |

**Likely-fine entries** (a, e, i, o, u words with no tricky phoneme): `talo, vesi,
koira, ovi, meri, lumi, sade, tuuli, iso, uusi, olla, ottaa, sanoa, kuulla, minä,
sinä, kiitos, kuka, mikä, missä, miksi, kaksi, kolme, viisi` etc. Still worth a
native speaker's glance, but they were not flagged.

### How to do §4 properly
1. Apply correct Finnish phonology (table above) to **every** mnemonic, not just the
   listed offenders. Any word with y/ö/ä/au/diphthong is suspect.
2. Keep the mnemonic **story** idea (it is good pedagogy) but make the sound hook
   accurate.
3. Cross-check each against a reference: forvo.com pronunciations, Wiktionary IPA, or
   the Azure `fi-FI-NooraNeural` voice once §6 works.
4. Ship as `UPDATE mnemonics SET text = ... WHERE word_id = (SELECT id FROM words
   WHERE base_form = '...')`.

---

## §5 — Sentences not yet audited

`02_sentences.sql` (500 kirjakieli/puhekieli pairs + English glosses) has **not**
been audited for translation accuracy or for correct puhekieli transformations.
`PUHEKIELI_REVIEW.md` already carries REGIONAL / UNCERTAIN / CHECK flags on specific
pairs — start there. A native speaker should verify:
- the English gloss matches the Finnish,
- the puhekieli form is natural and standard (not over-regional), and
- the azure-flag diff (computed at runtime by `toRegisterTokens`) highlights the
  right changed tokens.

---

## §6 — Audio (TTS) does not play

The owner tapped a register to hear it and **nothing played.** Expected — the Azure
TTS pipeline is not built yet:
- No audio files have been generated.
- No Cloudflare Worker exists to call Azure (`fi-FI-NooraNeural`, region
  `northeurope`).
- The `audio` table is empty and `sentences.audio_id` is null.
- The play buttons in `Daily`/`Island`/`RegisterCard` are currently **visual mocks**
  (`setTimeout` animation only — see `Daily.tsx` `play()`).

Build order when tackled: Worker proxy (Azure key in Worker secret, **never** in the
browser or git) → generate kirjakieli audio per sentence → upload to Supabase Storage
→ set `sentences.audio_id` → wire real `<audio>` playback. **Kirjakieli only** —
puhekieli is shown as text, never TTS'd (project rule).

The Azure key was shared in plaintext in chat last session; **rotate it before prod.**

---

## §7 — Em dashes (mostly handled in code; verify + clean data)

- The mnemonic seed contains **153 em dashes** (`—`). They are used both as the
  parse delimiter and inside story text.
- `src/lib/data/content.ts` `stripEmDash()` now replaces all dash-family chars
  (U+2014/2013/2015/2012) with commas and strips wrapping quotes, and
  `parseMnemonic()` splits on the first `—`. Committed this session.
- **If the owner still sees em dashes, it is a stale Vercel/browser cache** — hard
  refresh (mobile: close the tab fully and reopen). Confirm after the latest deploy.
- Belt-and-suspenders: when you rewrite mnemonics in §4, drop the em dashes from the
  data too (the corrected bridges above already avoid mid-text em dashes; the leading
  `WORD —` delimiter can stay since `parseMnemonic` handles it, or switch the
  delimiter to `::` and update the parser).
- After any rewrite, **read the stripped result back** and confirm each sentence
  still reads correctly (the owner explicitly asked for this — a comma where an em
  dash was can occasionally read oddly).

---

## §8 — Display fix already applied this session

`src/screens/DayOne.tsx`: removed the gray pseudo-IPA chip (e.g. "O-LE HY-VÄ") that
sat to the right of the word. It was just the syllabified Finnish word presented as
if it were a pronunciation guide — misleading. The `ipa` field is still parsed in
`content.ts` (harmless) but no longer rendered. If you build a *real* pronunciation
display later (verified IPA or audio), re-introduce it intentionally.

---

## §9 — In-progress auth + FSRS work (WIP — committed, NOT wired)

The owner had given the go-ahead for the auth + FSRS persistence phase. Scaffolding
was written this session and is committed so it is not lost, but it is **not wired
into the app** (App.tsx still renders the no-auth flow, Daily.tsx still samples
sentences instead of pulling a real card queue). The owner paused this to fix content
first. Decide whether to finish or set aside.

| File | State | Notes |
|---|---|---|
| `src/lib/auth/useAuth.tsx` | written | `AuthProvider` + `useAuth`; upserts a `users` row on login (`bootstrapUser`) |
| `src/screens/Auth.tsx` | written | email/password sign-in/up screen, brand-styled |
| `src/lib/data/cards.ts` | written | `fetchDailySession` (due reviews + new), `rateCard` (FSRS schedule → update card + insert review_log), `previewIntervals`, `seedInitialCards`. Uses the custom FSRS engine at `src/lib/fsrs/`. |
| `supabase/migrations/20260606000002_grant_user_tables.sql` | written, NOT run | GRANTs on users/cards/review_logs to `authenticated`; adds `cards (user_id, sentence_id, card_type)` UNIQUE for upsert. Owner must run it in Supabase. |

**Not done:** wrap `<App>` in `<AuthProvider>`; gate the app on `useAuth()` (show
`Auth` when logged out); rewrite `Daily.tsx` to call `fetchDailySession`/`rateCard`
with Again/Hard/Good/Easy buttons using `previewIntervals`; run the migration.

Build is green with this scaffolding present (it is unused/dead-code until wired).

---

## §10 — Recommended order for the next session

1. **§1 spellings** + **§2 missing words** — smallest, highest impact, unblocks the
   full 153-word sprint and fixes broken JOINs. Ship as one migration.
2. **§3 translations** — quick, correctness-critical (`terve`, `minä` especially).
3. **§4 pronunciations** — the big content pass. Do it thoroughly with a phonology
   reference; rewrite all suspect bridges, not just the listed ones.
4. **§7 verify em dashes** gone after deploy; clean data during the §4 rewrite.
5. **§6 TTS** — real audio so learners can hear the corrected words.
6. **§5 sentence audit** — native-speaker review of the 500 pairs.
7. **§9 auth/FSRS** — finish wiring once content is trustworthy.

Always: `npm run build` green + `npm run test` (16 FSRS tests) before committing.
This container cannot reach Supabase — hand the owner the SQL to run; verification of
live content happens in the browser.

---

## Quick reference — Finnish pronunciation cheat-sheet

```
VOWELS                         DIPHTHONGS (glide both)
a  /ɑ/  "ah" (father)          ai = "eye"        au = "ow" (cow)
e  /e/  "eh" (bed)             ei = "ay" (day)   eu = "eh-oo"
i  /i/  "ee" (see)             oi = "oy"         ou = "oh-oo"
o  /o/  "oh" (pure, no glide)  ui = "oo-ee"      yö = "ew-ur"
u  /u/  "oo" (boot)            ie = "ee-eh"      uo = "oo-oh"
y  /y/  "ew" (few) ROUNDED     äi = "a-ee"       öy = "ur-ee"
ä  /æ/  "a" (cat)              äy = "a-ew"
ö  /ø/  "ur" (fur, no r)
å  /o/  rare (Swedish names)

CONSONANTS                     RULES
j = English "y"                Stress: ALWAYS first syllable
r = rolled/trilled             Double letter = held longer (tuli vs tulli)
v = soft v/w                   Every letter pronounced (no silent letters)
h = always pronounced          No vowel reduction — vowels stay pure
```
