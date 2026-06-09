/**
 * The Language Islands question bank — the heart of the method.
 *
 * The coach only ever ASKS. These curated, real-life questions prompt the learner
 * to write their OWN sentences (in English first), so the Finnish they end up
 * memorising is about their actual life — never generic, never AI-authored.
 * (Mikael's method: "You want to sound like yourself.")
 *
 * Each question carries a full-sentence `eg` example. It models what a good answer
 * looks like (a complete simple sentence, not one word) and doubles as the input
 * placeholder — so the learner is nudged to write real sentences, which become
 * real, learnable Finnish.
 */

export interface IslandQuestion {
  q: string
  eg: string // a model full-sentence answer, in simple English
}

export interface IslandTopic {
  slug: string
  fi: string
  en: string
  icon: string
  blurb: string
  questions: IslandQuestion[]
}

export const ISLAND_TOPICS: IslandTopic[] = [
  {
    slug: 'about-me',
    fi: 'Minä',
    en: 'About me',
    icon: 'sparkle',
    blurb: 'Introduce yourself the way you actually would.',
    questions: [
      { q: 'What is your name and where are you from?', eg: 'My name is Maria and I am from Nigeria.' },
      { q: 'Where do you live now, and who do you live with?', eg: 'I live in Espoo with my family.' },
      { q: 'Why did you come to Finland?', eg: 'I came to Finland for work.' },
      { q: 'What do you do — work or study?', eg: 'I am a nurse.' },
      { q: 'What languages do you speak?', eg: 'I speak English and a little Finnish.' },
      { q: 'What do you hope to do here this year?', eg: 'I want to learn Finnish and find a job.' },
    ],
  },
  {
    slug: 'work',
    fi: 'Työ',
    en: 'My work',
    icon: 'cards',
    blurb: 'Talk about your job and things you say at work.',
    questions: [
      { q: 'What is your job, and where do you work?', eg: 'I am a cook and I work in a restaurant.' },
      { q: 'What do you do on a normal day at work?', eg: 'I make food and I help customers.' },
      { q: 'What do you like most about your work?', eg: 'I like my coworkers.' },
      { q: 'What is difficult about it?', eg: 'The days are long.' },
      { q: 'What do you often say to your colleagues?', eg: 'Good morning, how are you?' },
      { q: 'What work would you like to do in Finland?', eg: 'I want to work in a hospital.' },
    ],
  },
  {
    slug: 'hobbies',
    fi: 'Harrastukset',
    en: 'Hobbies & free time',
    icon: 'flame',
    blurb: 'What you love doing — and why.',
    questions: [
      { q: 'What is your favourite hobby?', eg: 'My favourite hobby is football.' },
      { q: 'Why do you like it so much?', eg: 'I like it because it is fun.' },
      { q: 'How often do you do it?', eg: 'I play every week.' },
      { q: 'Is there a hobby you want to try in Finland?', eg: 'I want to try ice skating.' },
      { q: 'What do you like to do on the weekend?', eg: 'On the weekend I walk in the forest.' },
    ],
  },
  {
    slug: 'family',
    fi: 'Perhe ja ystävät',
    en: 'Family & friends',
    icon: 'home',
    blurb: 'The people in your life — and what you say to them.',
    questions: [
      { q: 'Who is in your family?', eg: 'I have a wife and two children.' },
      { q: 'What do they do?', eg: 'My wife is a teacher.' },
      { q: 'What do you like to do together?', eg: 'We like to cook together.' },
      { q: 'Do you have friends here? How did you meet?', eg: 'I have one friend. We met at work.' },
      { q: 'What do you say to your friends when you meet?', eg: 'Hi! How are you?' },
    ],
  },
  {
    slug: 'daily',
    fi: 'Arki',
    en: 'Daily life & getting around',
    icon: 'island',
    blurb: 'Shops, transport, ordering, asking for help.',
    questions: [
      { q: 'What do you say when you order a coffee or food?', eg: 'I would like one coffee, please.' },
      { q: 'How do you ask for help in a shop?', eg: 'Excuse me, where is the milk?' },
      { q: 'How do you buy a bus or train ticket?', eg: 'One ticket to the centre, please.' },
      { q: 'What do you say at the checkout?', eg: 'Can I pay by card?' },
      { q: 'How do you ask someone to speak more slowly?', eg: 'Sorry, can you speak more slowly?' },
    ],
  },
  {
    slug: 'official',
    fi: 'Virallinen Suomi',
    en: 'Official Finland',
    icon: 'lock',
    blurb: 'KELA, the doctor, the bank, your landlord.',
    questions: [
      { q: 'How do you ask about an appointment?', eg: 'I would like to book an appointment.' },
      { q: 'What would you say to a doctor?', eg: 'I have a headache.' },
      { q: 'What do you need to ask your landlord?', eg: 'When do I pay the rent?' },
      { q: 'What might you say at KELA or the bank?', eg: 'I need help with this form.' },
      { q: 'How do you say you are still learning Finnish?', eg: 'I am still learning Finnish. Please speak slowly.' },
    ],
  },
  {
    slug: 'story',
    fi: 'Tarina',
    en: 'A story from my life',
    icon: 'pencil',
    blurb: 'Something that happened to you, told in order.',
    questions: [
      { q: 'Where and when did it happen?', eg: 'Last summer I was in Helsinki.' },
      { q: 'What happened first?', eg: 'First, I missed the bus.' },
      { q: 'What happened next?', eg: 'Then I walked to work.' },
      { q: 'How did it end?', eg: 'In the end, I was not late.' },
      { q: 'How did you feel about it?', eg: 'I felt happy.' },
    ],
  },
  {
    slug: 'opinions',
    fi: 'Mielipiteet',
    en: 'Opinions & small talk',
    icon: 'speaker',
    blurb: 'Weather, opinions, agreeing and disagreeing.',
    questions: [
      { q: 'What do you think about the weather here?', eg: 'I think the winter is very cold.' },
      { q: 'What do you like about living in Finland?', eg: 'I like that it is quiet and clean.' },
      { q: 'What do you find strange or surprising?', eg: 'It is strange that summer days are so long.' },
      { q: 'How do you say you agree with someone?', eg: 'Yes, I think so too.' },
      { q: 'How do you politely disagree?', eg: 'I am not sure about that.' },
    ],
  },
]

export function topicBySlug(slug: string): IslandTopic | undefined {
  return ISLAND_TOPICS.find((t) => t.slug === slug)
}
