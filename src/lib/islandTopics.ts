/**
 * The Language Islands question bank — the heart of the method.
 *
 * The coach only ever ASKS. These curated, real-life questions prompt the learner
 * to write their OWN sentences (in English first), so the Finnish they end up
 * memorising is about their actual life — never generic, never AI-authored.
 * (Mikael's method: "You want to sound like yourself.")
 *
 * Each topic is a "language island": a group of sentences for one situation.
 */

export interface IslandTopic {
  slug: string
  fi: string
  en: string
  icon: string
  blurb: string
  questions: string[] // English prompts; the learner answers in their own words
}

export const ISLAND_TOPICS: IslandTopic[] = [
  {
    slug: 'about-me',
    fi: 'Minä',
    en: 'About me',
    icon: 'sparkle',
    blurb: 'Introduce yourself the way you actually would.',
    questions: [
      'What is your name and where are you from?',
      'Where do you live now, and who do you live with?',
      'Why did you come to Finland?',
      'What do you do (work or study)?',
      'What languages do you speak?',
      'What are you hoping to do here in the next year?',
    ],
  },
  {
    slug: 'work',
    fi: 'Työ',
    en: 'My work',
    icon: 'cards',
    blurb: 'Talk about your job and things you say at work.',
    questions: [
      'What is your job, and where do you work?',
      'What do you do on a normal day at work?',
      'What do you like most about your work?',
      'What is difficult or annoying about it?',
      'What do you often say to your colleagues?',
      'What kind of work would you like to do in Finland?',
    ],
  },
  {
    slug: 'hobbies',
    fi: 'Harrastukset',
    en: 'Hobbies & free time',
    icon: 'flame',
    blurb: 'What you love doing — and why.',
    questions: [
      'What is your favourite hobby?',
      'Why do you like it so much?',
      'How often do you do it, and when did you start?',
      'Is there a hobby you want to try in Finland?',
      'What do you like to do on the weekend?',
    ],
  },
  {
    slug: 'family',
    fi: 'Perhe ja ystävät',
    en: 'Family & friends',
    icon: 'home',
    blurb: 'The people in your life — and what you say to them.',
    questions: [
      'Tell me about your family — who is in it?',
      'What do they do?',
      'What do you like to do together?',
      'Do you have friends here yet? How did you meet?',
      'What do you usually say to your friends when you meet?',
    ],
  },
  {
    slug: 'daily',
    fi: 'Arki',
    en: 'Daily life & getting around',
    icon: 'island',
    blurb: 'Shops, transport, ordering, asking for help.',
    questions: [
      'What do you say when you order a coffee or food?',
      'How do you ask for directions or help in a shop?',
      'How do you buy a bus or train ticket / ask which one to take?',
      'What do you say at the checkout?',
      'How do you ask someone to repeat or speak more slowly?',
    ],
  },
  {
    slug: 'official',
    fi: 'Virallinen Suomi',
    en: 'Official Finland',
    icon: 'lock',
    blurb: 'KELA, the doctor, the bank, your landlord.',
    questions: [
      'How do you book or ask about an appointment?',
      'What would you say to a doctor about how you feel?',
      'What do you need to ask your landlord?',
      'What might you say at KELA or the bank?',
      'How do you explain that you are still learning Finnish?',
    ],
  },
  {
    slug: 'story',
    fi: 'Tarina',
    en: 'A story from my life',
    icon: 'pencil',
    blurb: 'Something that happened to you, told in order.',
    questions: [
      'Where and when did it happen?',
      'What happened first?',
      'What happened next?',
      'How did it end?',
      'How did you feel about it?',
    ],
  },
  {
    slug: 'opinions',
    fi: 'Mielipiteet',
    en: 'Opinions & small talk',
    icon: 'speaker',
    blurb: 'Weather, opinions, agreeing and disagreeing.',
    questions: [
      'What do you think about the weather here?',
      'What do you like about living in Finland?',
      'What is something you find strange or surprising?',
      'How do you say you agree with someone?',
      'How do you politely disagree?',
    ],
  },
]

export function topicBySlug(slug: string): IslandTopic | undefined {
  return ISLAND_TOPICS.find((t) => t.slug === slug)
}
