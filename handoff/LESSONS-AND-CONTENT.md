# PuhuScribe v2 — Lessons & Content Compendium

> **Purpose.** The complete teaching content built for PuhuScribe, in one place: the
> grammar lessons, the survival-sentence Starter Pack, the vocabulary, the mnemonics, the
> generated sentence bank, the Language Islands question bank, and the progression content
> (milestones/ranks/journey). It is a companion to **`PUHUSCRIBE-PROJECT-HANDOFF.md`** (which
> covers the product, framework, architecture, and roadmap).
>
> This is a **content handoff** — enough to review, extend, or re-author the curriculum in a
> fresh instance. Where the full data lives in SQL seeds, this file gives the format, a
> representative sample, and the exact file path + counts so nothing is lost.
>
> Prepared 2026-07-02. All Finnish here has been either Voikko-validated (kirjakieli) or sent
> through a native-speaker review (the 104 Starter Pack sentences). Puhekieli is rule-based +
> native-reviewed.

---

## Contents
1. [How content is organised](#1-how-content-is-organised)
2. [Grammar Stage 2 — the 7 lessons in full](#2-grammar-stage-2--the-7-lessons-in-full)
3. [The Starter Pack — 104 survival sentences (dual-register)](#3-the-starter-pack--104-survival-sentences-dual-register)
4. [Language Islands — the question bank (8 topics)](#4-language-islands--the-question-bank-8-topics)
5. [Vocabulary — 551 frequency-ordered words](#5-vocabulary--551-frequency-ordered-words)
6. [Mnemonics — 153 sound-bridges](#6-mnemonics--153-sound-bridges)
7. [Sentence bank — 500 seed + 359 generated](#7-sentence-bank--500-seed--359-generated)
8. [The 25 YKI topics](#8-the-25-yki-topics)
9. [Progression content — milestones, ranks, journey stages](#9-progression-content--milestones-ranks-journey-stages)
10. [How the content is generated & validated](#10-how-the-content-is-generated--validated)

---

## 1. How content is organised

PuhuScribe teaches on the framework's **staircase — WORDS · RULES · REPS · FLOW** (see the
handoff, §3). The content maps to it like this:

| Layer | What it is | Where it lives | Count |
|---|---|---|---|
| **WORDS (vocab)** | Frequency-ordered Finnish words + gloss + IPA + mnemonic | `supabase/seeds/01_vocabulary.sql`, `03_sprint_mnemonics.sql` | 551 words / 153 mnemonics |
| **WORDS (chunks)** | Survival sentences to *say* on day one | `supabase/seeds/05_island_sentences.sql` (Starter Pack) | 104 |
| **RULES (grammar)** | Progressive grammar lessons, A1.1→A2.1 | `src/lib/grammar.ts` | 7 lessons |
| **REPS** | Typed active recall (FSRS) over words + your sentences | engine: `src/lib/fsrs/`, `grade.ts` | — |
| **REPS (sentences)** | Dual-register example sentences across 25 topics | `02_sentences.sql`, `04_generated_sentences.sql` | 500 + 359 |
| **FLOW (personal)** | The learner's OWN sentences via the question bank | `src/lib/islandTopics.ts` + AI translate | 8 topics |
| **Progression** | Milestones/ranks + journey stages | `src/lib/milestones.ts`, `journey.ts` | 6 ranks / 4 stages |

**Every word is dual-register-aware, and every kirjakieli sentence is paired with puhekieli.**
That pairing IS the product's wedge.

---

## 2. Grammar Stage 2 — the 7 lessons in full

**Source:** `src/lib/grammar.ts`. Built from the owner's SKK1 class notes (`docs/skk1-notes.md`,
43 sessions) enriched with standard textbook Finnish. **Gated:** unlocks only after the
Foundation sprint is complete; lessons then unlock **sequentially** (finish one to open the
next). Each lesson has a plain-English "why", teaching blocks with examples, and one check
question. Teaching method: *why before how; the good news before the hard parts; never drop
hard Finnish early*.

> **Known limitation (roadmap item #1):** these lessons are currently *read + one MCQ check*.
> The agreed upgrade is active graded drills folded into FSRS Daily Review.

### Lesson 1 — `no-articles-gender-future` · A1.1
**"Kolme hyvää uutista" / Three things Finnish does NOT have.**
*Why: before the hard parts, the good news — Finnish drops three things English makes you carry.*
- **No "a"/"the"** — no articles. `talo` = a house / the house. `kissa` = a cat / the cat.
- **No he/she gender** — one word, `hän`, for both. *Hän on opettaja.* = He/She is a teacher.
- **No separate future** — present tense covers it; a time word makes it clear. *Minä syön.* =
  I eat / I am eating. *Huomenna menen kauppaan.* = Tomorrow I (will) go to the shop.
- **Check:** Which word means both "he" and "she"? → **hän**.

### Lesson 2 — `vowel-harmony` · A1.1
**"Vokaalisointu" / Vowel harmony.**
*Why: it explains why endings come in two flavours (-ssa vs -ssä) — then endings stop looking random.*
- **Two families:** back vowels a/o/u; front vowels ä/ö/y; e and i are neutral.
- **Ending matches the word:** back-vowel word → a/o/u endings; front-vowel word → ä/ö/y.
  *talo → talossa* (in the house); *kylä → kylässä* (in the village).
- **Only e/i? Use the front ending:** *meri → meressä* (in the sea); *järvi → järvessä* (in the lake).
- **Check:** Why does "talo" take -ssa but "kylä" take -ssä? → **Vowel harmony: back vs front vowels**.

### Lesson 3 — `olla-pronouns` · A1.1
**"Olla — minä olen" / To be, and the pronouns.**
*Why: "to be" + the six pronouns are in almost every sentence — your first building blocks.*
- **Pronouns:** minä=I, sinä=you, hän=he/she, me=we, te=you(pl/polite), he=they.
- **Olla (present):** minä olen · sinä olet · hän on · me olemme · te olette · he ovat.
- **In real speech (puhekieli):** mä oon · sä oot · se on · me ollaan.
- **Check:** "Hän ___ kotona." → **on**.

### Lesson 4 — `present-type1` · A1.2
**"Verbi preesensissä" / Present tense (the most common verbs).**
*Why: once you can conjugate, you build your own sentences instead of memorising phrases.*
- **Endings:** take `puhua` → drop -a/-ä → stem `puhu-` → add -n, -t, (–), -mme, -tte, -vat/-vät.
  minä puhun · sinä puhut · hän puhuu (last vowel doubles) · me puhumme · te puhutte · he puhuvat.
- **Same for many verbs:** *Hän asuu Helsingissä.* (asua → asuu).
- **Check:** asua → "minä ___" → **asun**.

### Lesson 5 — `questions` · A1.2
**"Kysymykset" / Asking questions.**
*Why: you need questions from day one — help, prices, directions.*
- **Yes/no: add -ko/-kö** and put the verb first. *Puhutko suomea?* *Onko hän kotona?* Answer
  Kyllä/Joo or Ei.
- **Question words:** mikä=what, kuka=who, missä=where, milloin=when, miksi=why, miten=how,
  paljonko=how much. *Paljonko tämä maksaa?*
- **Check:** Make "Sinä puhut suomea" a yes/no question → **Puhutko suomea?**

### Lesson 6 — `partitive-1` · A1.2
**"Partitiivi — osa jostakin" / The partitive — "some / part of".**
*Why: the partitive is everywhere; start with one clear use — things you eat and drink.*
- **What it does:** marks something partial/uncounted. *Juon vettä.* (vesi→vettä), *Syön leipää.*,
  *Juon kahvia.*
- **Basic endings:** often -a/-ä (vowel harmony); some add -ta/-tä. *Haluan teetä.* *Syön omenaa.*
- **Check:** "Juon ___." (coffee — kahvi) → **kahvia**.

### Lesson 7 — `place-cases` · A2.1
**"Missä? Mistä? Mihin?" / Place: in, from, into.**
*Why: three small endings say where you are, where you came from, where you're going.*
- **Three questions, three endings:** Missä? → -ssa/-ssä; Mistä? → -sta/-stä; Mihin? → double
  the final vowel + n. *talossa · talosta · taloon*.
- **With place names:** *Helsingissä · Helsingistä · Helsinkiin*.
- **Check:** "into the house" (talo) → **taloon**.

### Grammar backlog (authored notes exist, lessons not yet built)
From `docs/skk1-notes.md`: consonant gradation (kpt), possession "minulla on", two-stem &
`-nen` words, object rules, more partitive, puhekieli patterns. These are the natural Stage-2
continuation.

---

## 3. The Starter Pack — 104 survival sentences (dual-register)

**Source:** `supabase/seeds/05_island_sentences.sql` (topic slug `arki`). Also in
`docs/native-speaker-review.md`. These are the everyday sentences every beginner drills first —
44 survival phrases + 60 "talk about your own life" lines from a Finnish teacher's SKK1 notes.
**Kirjakieli is Voikko-validated; the full set has been through native-speaker review; puhekieli
is the Helsinki spoken register.** Format: `English | Kirjakieli (written) | Puhekieli (spoken)`.

| # | English | Kirjakieli | Puhekieli |
|---|---|---|---|
| 1 | Good morning. | Hyvää huomenta. | Huomenta. |
| 2 | Thank you very much. | Kiitos paljon. | Kiitos paljon. |
| 3 | You're welcome. | Ole hyvä. | Ole hyvä. |
| 4 | Have a nice day! | Mukavaa päivänjatkoa! | Mukavaa päivänjatkoa! |
| 5 | My name is Maria. | Minun nimeni on Maria. | Mun nimi on Maria. |
| 6 | Nice to meet you. | Hauska tutustua. | Hauska tutustua. |
| 7 | I am from Nigeria. | Olen kotoisin Nigeriasta. | Oon kotoisin Nigeriasta. |
| 8 | I don't speak Finnish well yet. | En puhu vielä hyvin suomea. | En puhu viel hyvin suomee. |
| 9 | I am learning Finnish. | Opiskelen suomea. | Mä opiskelen suomee. |
| 10 | Can you speak more slowly? | Voitko puhua hitaammin? | Voitsä puhua hitaammin? |
| 11 | Can you repeat that? | Voitko toistaa? | Voitsä toistaa? |
| 12 | I don't understand. | En ymmärrä. | En ymmärrä. |
| 13 | Do you speak English? | Puhutko englantia? | Puhutsä englantii? |
| 14 | What does this mean? | Mitä tämä tarkoittaa? | Mitä tää tarkoittaa? |
| 15 | How much does this cost? | Paljonko tämä maksaa? | Paljonks tää maksaa? |
| 16 | Could I have a coffee? | Saisinko kahvin? | Saisinks mä kahvin? |
| 17 | Can I pay by card? | Voinko maksaa kortilla? | Voinks mä maksaa kortilla? |
| 18 | Where is the toilet? | Missä on vessa? | Mis on vessa? |
| 19 | I'm just looking, thanks. | Katselen vain, kiitos. | Mä vaan katselen, kiitos. |
| 20 | Could I have a bag? | Saisinko pussin? | Saisinks mä pussin? |
| 21 | Is this on offer? | Onko tämä tarjouksessa? | Onks tää tarjouksessa? |
| 22 | Excuse me, where is the bus stop? | Anteeksi, missä on bussipysäkki? | Anteeks, mis on bussipysäkki? |
| 23 | How do I get to the centre? | Miten pääsen keskustaan? | Miten mä pääsen keskustaan? |
| 24 | Does this bus go to the station? | Meneekö tämä bussi asemalle? | Meneeks tää bussi asemalle? |
| 25 | Where can I buy a ticket? | Mistä voin ostaa lipun? | Mist mä voin ostaa lipun? |
| 26 | Is it far from here? | Onko se kaukana täältä? | Onks se kaukana täältä? |
| 27 | I need a doctor. | Tarvitsen lääkäriä. | Mä tarvin lääkäriä. |
| 28 | I am sick. | Olen sairas. | Mä oon kipeä. |
| 29 | I have a headache. | Minulla on päänsärky. | Mul on päänsärky. |
| 30 | Where is the nearest pharmacy? | Missä on lähin apteekki? | Mis on lähin apteekki? |
| 31 | I have an appointment at two. | Minulla on aika kello kaksi. | Mul on aika kahdelta. |
| 32 | It hurts here. | Tähän sattuu. | Tähän sattuu. |
| 33 | I have an appointment at Kela. | Minulla on aika Kelassa. | Mul on aika Kelassa. |
| 34 | I need help with this form. | Tarvitsen apua tämän lomakkeen kanssa. | Mä tarvin apua tän lomakkeen kanssa. |
| 35 | Where do I get a personal identity code? | Mistä saan henkilötunnuksen? | Mist mä saan henkilötunnuksen? |
| 36 | I would like to book an appointment. | Haluaisin varata ajan. | Mä haluaisin varata ajan. |
| 37 | Could you help me? | Voisitko auttaa minua? | Voisitsä auttaa mua? |
| 38 | I am looking for an apartment. | Etsin asuntoa. | Mä etsin asuntoo. |
| 39 | How much is the rent? | Paljonko vuokra on? | Paljonks vuokra on? |
| 40 | I am looking for a job. | Etsin töitä. | Mä etsin töitä. |
| 41 | Here is my phone number. | Tässä on puhelinnumeroni. | Tässä on mun numero. |
| 42 | What time is it? | Paljonko kello on? | Paljonks kello on? |
| 43 | Can you help me, I am lost. | Voitko auttaa, olen eksyksissä. | Voitsä auttaa, mä oon eksyksissä. |
| 44 | One moment, please. | Hetki, kiitos. | Hetki, kiitos. |
| 45 | I live in Helsinki. | Asun Helsingissä. | Mä asun Helsingissä. |
| 46 | I am at work. | Olen töissä. | Mä oon töissä. |
| 47 | I go to work by bus. | Menen töihin bussilla. | Mä meen töihin bussilla. |
| 48 | I have two children. | Minulla on kaksi lasta. | Mul on kaks lasta. |
| 49 | I speak two languages. | Puhun kahta kieltä. | Mä puhun kahta kieltä. |
| 50 | I have studied Finnish for a year. | Olen opiskellut suomea vuoden. | Mä oon opiskellu suomea vuoden. |
| 51 | I study Finnish every day. | Opiskelen suomea joka päivä. | Mä opiskelen suomee joka päivä. |
| 52 | I study Finnish by watching videos. | Opiskelen suomea katsomalla videoita. | Mä opiskelen suomee kattomalla videoita. |
| 53 | I wake up at seven. | Herään seitsemältä. | Mä herään seitsemältä. |
| 54 | I go to bed at ten. | Menen nukkumaan kymmeneltä. | Mä meen nukkumaan kymmeneltä. |
| 55 | I leave work at five. | Lähden töistä kello viisi. | Mä lähden töistä kello viis. |
| 56 | I am in a hurry. | Minulla on kiire. | Mul on kiire. |
| 57 | I have to go now. | Minun täytyy mennä nyt. | Mun täytyy mennä nyt. |
| 58 | I am late. | Olen myöhässä. | Mä oon myöhässä. |
| 59 | Do you have time? | Onko sinulla aikaa? | Onks sul aikaa? |
| 60 | I am hungry. | Minulla on nälkä. | Mul on nälkä. |
| 61 | I am thirsty. | Minulla on jano. | Mul on jano. |
| 62 | I am tired. | Olen väsynyt. | Mä oon väsyny. |
| 63 | I am having fun. | Minulla on hauskaa. | Mul on hauskaa. |
| 64 | I feel at home in Finland. | Viihdyn Suomessa. | Mä viihdyn Suomessa. |
| 65 | I like Finnish food. | Pidän suomalaisesta ruoasta. | Mä tykkään suomalaisesta ruoasta. |
| 66 | I like swimming. | Pidän uimisesta. | Mä tykkään uimisesta. |
| 67 | I like coffee. | Tykkään kahvista. | Mä tykkään kahvista. |
| 68 | I don't like the dark. | En pidä pimeydestä. | Mä en tykkää pimeydestä. |
| 69 | I think Finland is a beautiful country. | Minusta Suomi on kaunis maa. | Musta Suomi on kaunis maa. |
| 70 | Finland has beautiful nature. | Suomessa on kaunis luonto. | Suomessa on kaunis luonto. |
| 71 | What do you like? | Mistä sinä pidät? | Mistä sä tykkäät? |
| 72 | Baking is my hobby. | Harrastan leipomista. | Mä harrastan leipomista. |
| 73 | I like to bake. | Tykkään leipoa. | Mä tykkään leipoo. |
| 74 | I go to the gym twice a week. | Käyn salilla kaksi kertaa viikossa. | Mä käyn salilla kaks kertaa viikossa. |
| 75 | I relax by going to the sauna. | Rentoudun saunomalla. | Mä rentoudun saunomalla. |
| 76 | What do you do in your free time? | Mitä teet vapaa-ajalla? | Mitä sä teet vapaa-ajalla? |
| 77 | It is cold today. | Tänään on kylmä. | Tänään on kylmä. |
| 78 | It is warm today. | Tänään on lämmin. | Tänään on lämmin. |
| 79 | It is sunny. | On aurinkoista. | On aurinkosta. |
| 80 | It is snowing. | Sataa lunta. | Sataa lunta. |
| 81 | It is raining. | Sataa vettä. | Sataa vettä. |
| 82 | What is the weather like today? | Millainen sää tänään on? | Millainen sää tänään on? |
| 83 | Let's go for coffee! | Mennään kahville! | Mennään kahville! |
| 84 | Let's go to the shop together! | Mennään kauppaan yhdessä! | Mennään kauppaan yhdessä! |
| 85 | Let's have lunch together! | Syödään lounasta yhdessä! | Syödään lounasta yhdessä! |
| 86 | Let's watch a movie! | Katsotaan elokuva! | Katotaan elokuva! |
| 87 | Let's go outside! | Mennään ulos! | Mennään ulos! |
| 88 | Let's take a break! | Pidetään tauko! | Pidetään tauko! |
| 89 | Let's speak only Finnish! | Puhutaan vain suomea! | Puhutaan vaan suomee! |
| 90 | If I don't understand, I ask the teacher. | Jos en ymmärrä, kysyn opettajalta. | Jos mä en ymmärrä, mä kysyn opettajalta. |
| 91 | This is easy. | Tämä on helppoa. | Tää on helppoo. |
| 92 | This is difficult. | Tämä on vaikeaa. | Tää on vaikeeta. |
| 93 | Do you understand? | Ymmärrätkö sinä? | Ymmärrätsä? |
| 94 | How are you? | Mitä sinulle kuuluu? | Mitä sulle kuuluu? |
| 95 | How old are you? | Kuinka vanha sinä olet? | Kuinka vanha sä oot? |
| 96 | Where do you live? | Missä sinä asut? | Missä sä asut? |
| 97 | What do you do for work? | Mitä sinä teet työksesi? | Mitä sä teet työksesi? |
| 98 | Have you been to Finland before? | Oletko käynyt Suomessa ennen? | Ootsä käyny Suomessa ennen? |
| 99 | I drink my coffee black. | Juon kahvini mustana. | Mä juon kahvin mustana. |
| 100 | I don't take sugar. | En ota sokeria. | Mä en ota sokeria. |
| 101 | I am going on a trip next week. | Lähden matkalle ensi viikolla. | Mä lähden matkalle ensi viikolla. |
| 102 | I rarely eat at a restaurant. | Syön ravintolassa harvoin. | Mä syön ravintolassa harvoin. |
| 103 | I use the city bikes. | Käytän kaupungin pyöriä. | Mä käytän kaupungin pyöriä. |
| 104 | I need more time. | Tarvitsen lisää aikaa. | Mä tarvin lisää aikaa. |

---

## 4. Language Islands — the question bank (8 topics)

**Source:** `src/lib/islandTopics.ts`. **This is the heart of the FLOW method** (based on
Mikael's "language islands"): the coach only ever **ASKS**. The learner answers in English,
the AI translates it into a **complete, simple A1 Finnish sentence**, and the learner memorises
Finnish *about their own life* — never generic, never AI-authored content. Each question carries
a model full-sentence `eg` (also used as the input placeholder, nudging real sentences).

### Topic 1 — "Minä" / About me (`about-me`, icon: sparkle)
*Introduce yourself the way you actually would.*
- What is your name and where are you from? · *eg:* My name is Maria and I am from Nigeria.
- Where do you live now, and who do you live with? · *eg:* I live in Espoo with my family.
- Why did you come to Finland? · *eg:* I came to Finland for work.
- What do you do, work or study? · *eg:* I am a nurse.
- What languages do you speak? · *eg:* I speak English and a little Finnish.
- What do you hope to do here this year? · *eg:* I want to learn Finnish and find a job.

### Topic 2 — "Työ" / My work (`work`, icon: cards)
*Talk about your job and things you say at work.*
- What is your job, and where do you work? · *eg:* I am a cook and I work in a restaurant.
- What do you do on a normal day at work? · *eg:* I make food and I help customers.
- What do you like most about your work? · *eg:* I like my coworkers.
- What is difficult about it? · *eg:* The days are long.
- What do you often say to your colleagues? · *eg:* Good morning, how are you?
- What work would you like to do in Finland? · *eg:* I want to work in a hospital.

### Topic 3 — "Harrastukset" / Hobbies & free time (`hobbies`, icon: flame)
*What you love doing, and why.*
- What is your favourite hobby? · *eg:* My favourite hobby is football.
- Why do you like it so much? · *eg:* I like it because it is fun.
- How often do you do it? · *eg:* I play every week.
- Is there a hobby you want to try in Finland? · *eg:* I want to try ice skating.
- What do you like to do on the weekend? · *eg:* On the weekend I walk in the forest.

### Topic 4 — "Perhe ja ystävät" / Family & friends (`family`, icon: home)
*The people in your life and what you say to them.*
- Who is in your family? · *eg:* I have a wife and two children.
- What do they do? · *eg:* My wife is a teacher.
- What do you like to do together? · *eg:* We like to cook together.
- Do you have friends here? How did you meet? · *eg:* I have one friend. We met at work.
- What do you say to your friends when you meet? · *eg:* Hi! How are you?

### Topic 5 — "Arki" / Daily life & getting around (`daily`, icon: island)
*Shops, transport, ordering, asking for help.*
- What do you say when you order a coffee or food? · *eg:* I would like one coffee, please.
- How do you ask for help in a shop? · *eg:* Excuse me, where is the milk?
- How do you buy a bus or train ticket? · *eg:* One ticket to the centre, please.
- What do you say at the checkout? · *eg:* Can I pay by card?
- How do you ask someone to speak more slowly? · *eg:* Sorry, can you speak more slowly?

### Topic 6 — "Virallinen Suomi" / Official Finland (`official`, icon: lock)
*KELA, the doctor, the bank, your landlord.*
- How do you ask about an appointment? · *eg:* I would like to book an appointment.
- What would you say to a doctor? · *eg:* I have a headache.
- What do you need to ask your landlord? · *eg:* When do I pay the rent?
- What might you say at KELA or the bank? · *eg:* I need help with this form.
- How do you say you are still learning Finnish? · *eg:* I am still learning Finnish. Please speak slowly.

### Topic 7 — "Tarina" / A story from my life (`story`, icon: pencil)
*Something that happened to you, told in order.*
- Where and when did it happen? · *eg:* Last summer I was in Helsinki.
- What happened first? · *eg:* First, I missed the bus.
- What happened next? · *eg:* Then I walked to work.
- How did it end? · *eg:* In the end, I was not late.
- How did you feel about it? · *eg:* I felt happy.

### Topic 8 — "Mielipiteet" / Opinions & small talk (`opinions`, icon: speaker)
*Weather, opinions, agreeing and disagreeing.*
- What do you think about the weather here? · *eg:* I think the winter is very cold.
- What do you like about living in Finland? · *eg:* I like that it is quiet and clean.
- What do you find strange or surprising? · *eg:* It is strange that summer days are so long.
- How do you say you agree with someone? · *eg:* Yes, I think so too.
- How do you politely disagree? · *eg:* I am not sure about that.

---

## 5. Vocabulary — 551 frequency-ordered words

**Source:** `supabase/seeds/01_vocabulary.sql`. Each row: `base_form | English gloss | frequency
rank | CEFR level | part of speech | topic`. Real IPA is attached separately from
kaikki.org/Wiktionary (`20260607000003_word_ipa_from_kaikki.sql` — 514/541 got genuine IPA;
none invented). Ordered by usefulness (most frequent first). First 60 as a representative sample
(the full 551 are in the SQL seed):

| base_form | gloss | | base_form | gloss |
|---|---|---|---|---|
| hei | hi / hello | | talo | house / building |
| moi | hi (informal) | | asunto | apartment / flat |
| terve | hello | | huone | room |
| hyvää | good (partitive) | | keittiö | kitchen |
| huomenta | good morning (partitive) | | makuuhuone | bedroom |
| päivää | good day (partitive) | | olohuone | living room |
| iltaa | good evening (partitive) | | kylpyhuone | bathroom |
| yötä | good night (partitive) | | ovi | door |
| näkemiin | goodbye | | ikkuna | window |
| moikka | bye (informal) | | lattia | floor |
| kiitos | thank you | | katto | ceiling / roof |
| ole hyvä | you're welcome | | seinä | wall |
| anteeksi | excuse me / sorry | | pöytä | table |
| nimi | name | | tuoli | chair |
| minä | I / me | | sohva | sofa / couch |
| sinä | you (singular) | | vuode | bed |
| hän | he / she | | kaappi | cupboard / wardrobe |
| me | we | | hissi | lift / elevator |
| te | you (plural / formal) | | portaat | stairs |
| he | they | | kerros | floor / storey |
| perhe | family | | äiti | mother |
| isä | father | | lapsi | child |
| poika | boy / son | | tyttö | girl / daughter |
| veli | brother | | sisar | sister |
| ystävä | friend | | naapuri | neighbour |
| nainen | woman | | mies | man |
| ihminen | person / human | | puoliso | spouse / partner |

*(…and ~490 more across the 25 topics, extending through home, food, shopping, health,
transport, work, etc. See the seed for the complete list with ranks, levels and POS.)*

---

## 6. Mnemonics — 153 sound-bridges

**Source:** `supabase/seeds/03_sprint_mnemonics.sql`. Phonetic "sound-bridge" format: a
capitalised approximate pronunciation + a vivid image that hooks the meaning. Joined to
vocabulary on `words.base_form`. Sample:

- **talo** — "TAL-oh — imagine a TALL building. That is your Finnish house."
- **auto** — "AUTO — Finnish kept the international word. Same as English!"
- **ihminen** — "IH-mi-nen — sounds like 'I'm in' — I'm in the human race. A person."
- **ruoka** — "ROO-ka — ROO sounds like 'roo' in kangaroo eating FOOD from a pouch."
- **vesi** — "VEH-si — VEH sounds like 'wet' — wet things need WATER."

> **Note:** mnemonics are original generated content (no CC source), flagged for native review;
> the design supports one mnemonic per word (roadmap: scale beyond 153).

---

## 7. Sentence bank — 500 seed + 359 generated

Two sources, all dual-register, spread across the 25 YKI topics, A1/A2:

- **`supabase/seeds/02_sentences.sql`** — 500 original seed pairs (with puhekieli
  transformations applied consistently; annotated in `supabase/seeds/PUHEKIELI_REVIEW.md`).
- **`supabase/seeds/04_generated_sentences.sql`** — 359 **Voikko-validated** generated
  sentences (deduped; ungrammatical rows dropped). Only validated kirjakieli ships; puhekieli =
  NULL pending human verification (`docs/generated_puhekieli_REVIEW.tsv`).

Sample (kirjakieli | English):
- Minä olen Mia. Mikä sinun nimesi on? | I am Mia. What is your name?
- Hyvää päivää! Miten sinä voit? | Good day! How are you?
- Minä olen uusi täällä. | I am new here.
- Hän on suomalainen mies. | He is a Finnish man.
- Tämä asunto on iso ja vanha. | This apartment is big and old.
- Vuokra on tosi kova tässä alueella. | The rent is very high in this area.
- Lapset tarvitsevat oman huoneen. | Children need their own room.
- Minä etsin hyvää paikkaa asua. | I am looking for a good place to live.
- Voimmeko saada lisää vettä? | Could we get more water?
- Hän tekee ruokaa joka päivä. | He/She makes food every day.

---

## 8. The 25 YKI topics

**Source:** `supabase/migrations/20260603000002_yki_topics_seed.sql`. Every word and sentence is
tagged to one of these. They span the YKI B1/B2 real-life domains:

| slug | Finnish name |
|---|---|
| greetings | Tervehtiminen ja esittäytyminen |
| family | Perhe ja ihmissuhteet |
| home | Koti ja asuminen |
| food_drink | Ruoka ja juoma |
| shopping | Ostokset ja kauppa |
| daily_routines | Arkirutiinit ja vapaa-aika |
| health | Terveys ja sairaanhoito |
| transport | Liikenne ja matkustaminen |
| weather | Sää ja vuodenajat |
| hobbies | Harrastukset ja urheilu |
| events | Tapahtumat ja juhlat |
| work_general | Työ ja ammatti |
| workplace | Työpaikka ja työkaverit |
| job_search | Työnhaku ja CV |
| education | Opiskelu ja koulutus |
| technology | Teknologia ja digitaalinen arki |
| banking | Pankki ja raha-asiat |
| post_office | Posti ja paketit |
| housing_services | Asumispalvelut ja viranomaiset |
| emergency | Hätätilanteet ja turvallisuus |
| city_life | Kaupunki ja ympäristö |
| media_news | Media ja uutiset |
| integration | Kotoutuminen ja kulttuuri |
| rights_duties | Oikeudet ja velvollisuudet |
| yki_exam_prep | YKI-kokeeseen valmistautuminen |

---

## 9. Progression content — milestones, ranks, journey stages

### Word milestones & rank titles (`src/lib/milestones.ts`)
Crossing one fires a confetti celebration + rank-up. (Rank titles are common Finnish words,
flagged for native review.)

| Words | Finnish rank | English | Emoji |
|---|---|---|---|
| 50 | Ensiaskeleet | First steps | 🌱 |
| 100 | Aloittelija | Beginner | 🌿 |
| 250 | Pärjääjä | Getting by | 🙂 |
| 500 | Selviytyjä | Survivor | 💪 |
| 1000 | Puhuja | Speaker | 🗣️ |
| 2000 | Perusta valmis | Foundation complete | ⭐ |

### Journey stages (`src/lib/journey.ts`)
The Launchpad → North Star path. Only Stage 1 has live content; 2–4 are the visible, locked road
ahead.

| # | Finnish | English | CEFR | Requirement |
|---|---|---|---|---|
| 1 | Perusta | Foundation | A1–A2 | 2,000 words + 1,000 sentences |
| 2 | Kielioppi | Grammar | A2–B1 | (Grammar Stage 2 — 7 lessons built) |
| 3 | Arjen sujuvuus | Everyday fluency | YKI B1 | Four-skill conversation |
| 4 | Työelämän suomi | Professional Finnish | YKI B2 | **North Star** |

### The four YKI skills (`src/lib/yki.ts`)
Every activity is tagged with one, so four-skill coverage is visible: **Puhuminen/Speaking ·
Kuuntelu/Listening · Lukeminen/Reading · Kirjoitus/Writing.**

---

## 10. How the content is generated & validated

The pipeline that produces all Finnish content — designed around one rule: **never invent
Finnish.**

1. **Frequency list** — `scripts/build_frequency_list.py`: 734,205 wordfreq Finnish forms →
   Voikko-lemmatised + validated → top **10,000 real lemmas** (`data/finnish_frequency_lemmas.json`).
2. **Grounded generation** — `scripts/generate/`: Claude generates dual-register examples
   restricted to the allowed 10k list; a **hard Voikko gate validates every kirjakieli form**
   and regenerates anything that isn't real Finnish (invention rate logged). Proven offline to
   catch fabricated words (`blarghti`, `kissoittelen`).
3. **Batch + SQL** — `run_batch.py` + `to_seed_sql.py`: across all 25 topics × levels →
   `out/generated_sentences.sql` (idempotent; only validated kirjakieli ships; puhekieli → review TSV).
4. **Puhekieli** — NOT machine-validatable (spoken forms aren't standard Finnish); produced by a
   documented rule-based transform (Helsinki register) and **confirmed by a native speaker**.
5. **IPA** — sourced from kaikki.org/Wiktionary (CC BY-SA); never guessed; uncovered forms left blank.
6. **CC reingest path** — `scripts/ingest/` can regenerate seeds from Leipzig (frequency) +
   kaikki (glosses/IPA) + Tatoeba (sentences); deferred until explicitly chosen.

Run generation: `bash scripts/generate/run.sh` (needs `ANTHROPIC_API_KEY`).

---

*Content compendium prepared 2026-07-02. Pairs with `PUHUSCRIBE-PROJECT-HANDOFF.md`. Full
data (all 551 words, 500+359 sentences, 153 mnemonics) lives in `supabase/seeds/`; this file
captures the format, the complete lesson/sentence sets that are small enough to inline, and
exact paths for the rest.*
