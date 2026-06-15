/* ---------------------------------------------------------------------------
 * Grammar (Stage 2) — a step-by-step Finnish grammar curriculum for adult
 * beginners. It UNLOCKS only after the Foundation sprint, so learners meet it
 * once words feel familiar. It starts at the very beginning and explains the
 * "why" before the "how", getting harder one lesson at a time (A1.1 -> up) —
 * never dropping hard Finnish early.
 *
 * Source: enriched from the owner's SKK1 class notes (docs/skk1-notes.md) with
 * standard, textbook Finnish grammar (the language is public; there is one
 * Finnish grammar). Every Finnish example is standard A1/A2 Finnish — to be
 * confirmed in the native-speaker review pass like the rest of the content.
 * Lessons unlock sequentially: finish one to open the next.
 * ------------------------------------------------------------------------- */

export interface GrammarExample {
  fi: string
  en: string
  note?: string
}

export interface GrammarBlock {
  heading?: string
  body: string
  examples?: GrammarExample[]
}

export interface GrammarCheck {
  q: string
  options: string[]
  answer: string      // must equal one of options
  explain?: string
}

export interface GrammarLesson {
  id: string
  level: string       // CEFR sub-band, e.g. 'A1.1'
  titleFi: string
  titleEn: string
  why: string         // one plain-English line: why this matters
  blocks: GrammarBlock[]
  check?: GrammarCheck
}

export const GRAMMAR: GrammarLesson[] = [
  {
    id: 'no-articles-gender-future',
    level: 'A1.1',
    titleFi: 'Kolme hyvää uutista',
    titleEn: 'Three things Finnish does NOT have',
    why: 'Before the hard parts, the good news: Finnish drops three things English makes you carry.',
    blocks: [
      {
        heading: 'No "a" or "the"',
        body: 'Finnish has no articles. One word covers both. Context tells you which one is meant.',
        examples: [
          { fi: 'talo', en: 'a house / the house' },
          { fi: 'kissa', en: 'a cat / the cat' },
        ],
      },
      {
        heading: 'No he/she gender',
        body: 'There is one word for a person: hän. It means both "he" and "she". You never have to guess a gender.',
        examples: [
          { fi: 'Hän on opettaja.', en: 'He is a teacher. / She is a teacher.' },
        ],
      },
      {
        heading: 'No separate future tense',
        body: 'There is no "will". The present tense also talks about the future; a time word makes it clear.',
        examples: [
          { fi: 'Minä syön.', en: 'I eat. / I am eating.' },
          { fi: 'Huomenna menen kauppaan.', en: 'Tomorrow I (will) go to the shop.', note: 'huomenna = tomorrow' },
        ],
      },
    ],
    check: {
      q: 'Which Finnish word means both "he" and "she"?',
      options: ['hän', 'se', 'minä', 'on'],
      answer: 'hän',
      explain: 'Finnish has no gender — hän is "he" and "she".',
    },
  },
  {
    id: 'vowel-harmony',
    level: 'A1.1',
    titleFi: 'Vokaalisointu',
    titleEn: 'Vowel harmony',
    why: 'It explains why endings come in two flavours (-ssa vs -ssä) — get this and endings stop looking random.',
    blocks: [
      {
        heading: 'Two families of vowels',
        body: 'Back vowels: a, o, u. Front vowels: ä, ö, y. The vowels e and i are neutral and feel at home with either.',
      },
      {
        heading: 'The ending matches the word',
        body: 'If a word has back vowels, its endings use a/o/u. If it has front vowels, the same endings switch to ä/ö/y. Same ending, two shapes.',
        examples: [
          { fi: 'talo → talossa', en: 'in the house', note: 'back vowels a, o → -ssa' },
          { fi: 'kylä → kylässä', en: 'in the village', note: 'front vowel ä → -ssä' },
        ],
      },
      {
        heading: 'Only e and i? Use the front ending',
        body: 'A word with only neutral vowels takes the front (ä/ö/y) endings.',
        examples: [
          { fi: 'meri → meressä', en: 'in the sea' },
          { fi: 'järvi → järvessä', en: 'in the lake' },
        ],
      },
    ],
    check: {
      q: '"talo" takes -ssa, but "kylä" takes -ssä. Why?',
      options: ['Vowel harmony: back vs front vowels', 'kylä is plural', 'It is random', 'kylä is a verb'],
      answer: 'Vowel harmony: back vs front vowels',
      explain: 'talo has back vowels (a, o) → -ssa; kylä has a front vowel (ä) → -ssä.',
    },
  },
  {
    id: 'olla-pronouns',
    level: 'A1.1',
    titleFi: 'Olla — minä olen',
    titleEn: 'To be, and the pronouns',
    why: 'The verb "to be" and the six pronouns are in almost every sentence — your first building blocks.',
    blocks: [
      {
        heading: 'The pronouns',
        body: 'minä = I, sinä = you, hän = he/she, me = we, te = you (plural/polite), he = they.',
      },
      {
        heading: 'Olla (to be) in the present',
        body: 'Each pronoun has its own form of the verb. The verb already shows who, so the pronoun is often dropped in speech.',
        examples: [
          { fi: 'minä olen', en: 'I am' },
          { fi: 'sinä olet', en: 'you are' },
          { fi: 'hän on', en: 'he/she is' },
          { fi: 'me olemme', en: 'we are' },
          { fi: 'te olette', en: 'you (pl) are' },
          { fi: 'he ovat', en: 'they are' },
        ],
      },
      {
        heading: 'In real speech (puhekieli)',
        body: 'Spoken Finnish shortens these a lot. You will hear:',
        examples: [
          { fi: 'mä oon', en: 'I am', note: 'minä olen' },
          { fi: 'sä oot', en: 'you are', note: 'sinä olet' },
          { fi: 'se on', en: 'he/she/it is', note: 'hän on' },
          { fi: 'me ollaan', en: 'we are', note: 'me olemme' },
        ],
      },
    ],
    check: {
      q: 'Complete: "Hän ___ kotona." (He/she is home.)',
      options: ['on', 'olen', 'ovat', 'olet'],
      answer: 'on',
      explain: 'hän → on. (minä olen, sinä olet, hän on…)',
    },
  },
  {
    id: 'present-type1',
    level: 'A1.2',
    titleFi: 'Verbi preesensissä',
    titleEn: 'Present tense (the most common verbs)',
    why: 'Once you can conjugate a verb, you can build your own sentences instead of memorising phrases.',
    blocks: [
      {
        heading: 'The personal endings',
        body: 'Take a verb like puhua (to speak), drop the final -a/-ä to get the stem (puhu-), then add the ending for the person: -n, -t, (–), -mme, -tte, -vat/-vät.',
        examples: [
          { fi: 'minä puhun', en: 'I speak' },
          { fi: 'sinä puhut', en: 'you speak' },
          { fi: 'hän puhuu', en: 'he/she speaks', note: 'the last vowel doubles' },
          { fi: 'me puhumme', en: 'we speak' },
          { fi: 'te puhutte', en: 'you (pl) speak' },
          { fi: 'he puhuvat', en: 'they speak' },
        ],
      },
      {
        heading: 'It works the same for many verbs',
        body: 'asua (to live), lukea (to read), the pattern repeats.',
        examples: [
          { fi: 'Minä puhun englantia.', en: 'I speak English.' },
          { fi: 'Hän asuu Helsingissä.', en: 'He/she lives in Helsinki.', note: 'asua → asuu' },
        ],
      },
    ],
    check: {
      q: 'asua (to live) → "minä ___"',
      options: ['asun', 'asuu', 'asut', 'asua'],
      answer: 'asun',
      explain: 'Drop -a (asu-), add -n for minä → asun.',
    },
  },
  {
    id: 'questions',
    level: 'A1.2',
    titleFi: 'Kysymykset',
    titleEn: 'Asking questions',
    why: 'You need questions from day one — to ask for help, prices, directions.',
    blocks: [
      {
        heading: 'Yes / no questions: add -ko / -kö',
        body: 'Take the verb, add -ko (or -kö, by vowel harmony), and put it first. Answer with Kyllä/Joo (yes) or Ei (no).',
        examples: [
          { fi: 'Puhutko suomea?', en: 'Do you speak Finnish?', note: 'puhut + -ko' },
          { fi: 'Onko hän kotona?', en: 'Is he/she home?', note: 'on + -ko' },
        ],
      },
      {
        heading: 'Question words',
        body: 'mikä = what, kuka = who, missä = where, milloin = when, miksi = why, miten = how, paljonko = how much.',
        examples: [
          { fi: 'Mikä tämä on?', en: 'What is this?' },
          { fi: 'Missä sinä asut?', en: 'Where do you live?' },
          { fi: 'Paljonko tämä maksaa?', en: 'How much does this cost?' },
        ],
      },
    ],
    check: {
      q: 'Make "Sinä puhut suomea" into a yes/no question.',
      options: ['Puhutko suomea?', 'Sinä puhutko?', 'Mikä puhut suomea?', 'Suomea puhut?'],
      answer: 'Puhutko suomea?',
      explain: 'Add -ko to the verb and put it first: Puhutko suomea?',
    },
  },
  {
    id: 'partitive-1',
    level: 'A1.2',
    titleFi: 'Partitiivi — osa jostakin',
    titleEn: 'The partitive — "some / part of"',
    why: 'The partitive is everywhere in Finnish. Start with one clear use: things you eat and drink.',
    blocks: [
      {
        heading: 'What it does',
        body: 'The partitive marks something partial or uncounted — "some water", not "the whole sea". When you eat or drink something, the thing usually takes the partitive.',
        examples: [
          { fi: 'Juon vettä.', en: 'I drink water.', note: 'vesi → vettä' },
          { fi: 'Syön leipää.', en: 'I eat bread.', note: 'leipä → leipää' },
          { fi: 'Juon kahvia.', en: 'I drink coffee.', note: 'kahvi → kahvia' },
        ],
      },
      {
        heading: 'The basic endings',
        body: 'Often -a / -ä (with vowel harmony). Some words add -ta / -tä. You will meet the full rules step by step — for now, recognise the -a/-ä on food and drink.',
        examples: [
          { fi: 'Haluan teetä.', en: 'I want tea.', note: 'tee → teetä' },
          { fi: 'Syön omenaa.', en: 'I eat (an) apple.', note: 'omena → omenaa' },
        ],
      },
    ],
    check: {
      q: 'Complete: "Juon ___." (I drink coffee — kahvi)',
      options: ['kahvia', 'kahvi', 'kahvissa', 'kahvit'],
      answer: 'kahvia',
      explain: 'The drink you consume takes the partitive: kahvi → kahvia.',
    },
  },
  {
    id: 'place-cases',
    level: 'A2.1',
    titleFi: 'Missä? Mistä? Mihin?',
    titleEn: 'Place: in, from, into',
    why: 'Three small endings let you say where you are, where you came from, and where you are going.',
    blocks: [
      {
        heading: 'Three questions, three endings',
        body: 'Missä? (where / in) → -ssa/-ssä. Mistä? (from where) → -sta/-stä. Mihin? (to where / into) → double the final vowel + n.',
        examples: [
          { fi: 'talossa', en: 'in the house', note: 'Missä?' },
          { fi: 'talosta', en: 'from the house', note: 'Mistä?' },
          { fi: 'taloon', en: 'into the house', note: 'Mihin?' },
        ],
      },
      {
        heading: 'With real place names',
        body: 'The same three endings work on cities (from the SKK1 notes):',
        examples: [
          { fi: 'Helsingissä', en: 'in Helsinki' },
          { fi: 'Helsingistä', en: 'from Helsinki' },
          { fi: 'Helsinkiin', en: 'to Helsinki' },
        ],
      },
    ],
    check: {
      q: '"into the house" (talo) = ?',
      options: ['taloon', 'talossa', 'talosta', 'talo'],
      answer: 'taloon',
      explain: 'Mihin? → double the vowel + n: talo → taloon.',
    },
  },
]
