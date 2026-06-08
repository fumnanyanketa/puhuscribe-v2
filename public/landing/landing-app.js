/* PuhuScribe — promotional landing page.
   Color scheme is set per-file via window.PS_VARIANT ('violet' | 'teal' | 'azure').
   Loads after React, Babel, tweaks-panel.jsx, ps-components.jsx, phone.jsx. */
const { useTweaks, TweaksPanel, TweakSection, TweakSelect, TweakRadio } = window;
const { I, Orb, OrbCluster, RegisterCard, Bar } = window.PS;
const { Phone, SCREENS, ListenPanel, MonthPanel } = window.PSLanding;
const e = React.createElement;

const ACCENTS = {
  violet: { c: '#6B46C1', d: '#5a36ab', wash: 'rgba(107,70,193,0.12)', glow: 'rgba(107,70,193,0.34)', soft: '#EFE9FA' },
  teal:   { c: '#1F7C8E', d: '#186170', wash: 'rgba(31,124,142,0.12)', glow: 'rgba(31,124,142,0.32)', soft: '#E4F0F2' },
  azure:  { c: '#2F5AD6', d: '#2748b0', wash: 'rgba(47,90,214,0.12)', glow: 'rgba(47,90,214,0.32)', soft: '#E7ECFB' },
};
// each variant is a distinct *direction*: hue + ground + light/dark hero
const VARIANTS = {
  violet: { accent: 'violet', ground: 'aurora', dark: false },
  teal:   { accent: 'teal',   ground: 'dark',   dark: true  },
  azure:  { accent: 'azure',  ground: 'lake',   dark: false },
};
const DARK_HERO = {
  violet: 'radial-gradient(120% 92% at 50% -12%, #4a2a8f 0%, #2e1758 46%, #1c0f3a 100%)',
  teal:   'radial-gradient(120% 92% at 50% -12%, #1c6c79 0%, #114551 46%, #0a2a31 100%)',
  azure:  'radial-gradient(120% 92% at 50% -12%, #2f49b8 0%, #1f2f7a 46%, #121d4a 100%)',
};
const BAND = {
  violet: 'linear-gradient(150deg,#3a2170,#241248 72%)',
  teal:   'linear-gradient(150deg,#155561,#0e323b 72%)',
  azure:  'linear-gradient(150deg,#26397f,#141f52 72%)',
};
const LAKE = {
  violet: 'linear-gradient(180deg,#f2eefb 0%,#f6f0fb 50%,#fff 100%)',
  teal:   'linear-gradient(180deg,#e9f3f4 0%,#f1f7f8 50%,#fff 100%)',
  azure:  'linear-gradient(180deg,#eaf0fc 0%,#f1f4fb 50%,#fff 100%)',
};

const FONTS = {
  Poppins: "'Poppins', system-ui, sans-serif",
  Sora: "'Sora', system-ui, sans-serif",
  'Space Grotesk': "'Space Grotesk', system-ui, sans-serif",
};
const HEADLINES = {
  "Speak Finnish the way Finland actually speaks.": ['Speak Finnish the way Finland ', 'actually', ' speaks.'],
  "Understand the books. Speak the street.": ['Understand the books. Speak the ', 'street', '.'],
  "One language, two Finnishes. Learn both.": ['One language, two Finnishes. Learn ', 'both', '.'],
};

const VARIANT = (window.PS_VARIANT && VARIANTS[window.PS_VARIANT]) ? window.PS_VARIANT : 'violet';
const V = VARIANTS[VARIANT];
const acc = ACCENTS[V.accent];

// The live web-app link (Vercel). Swap this for the real URL.
const APP_URL = 'https://puhuscribe-v2.vercel.app/';

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headline": "Understand the books. Speak the street.",
  "fontPair": "Poppins",
  "phoneScreen": "progress"
}/*EDITMODE-END*/;

/* ---------- bell icon (not in PS set) ---------- */
const Bell = ({ size = 20, color = 'currentColor' }) =>
  e('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' },
    e('path', { d: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9' }),
    e('path', { d: 'M13.7 21a2 2 0 0 1-3.4 0' }));

/* ---------- small building blocks ---------- */
function Pill({ children, dark }) {
  return e('div', { style: {
    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 8px 7px 16px',
    borderRadius: 999, background: dark ? 'rgba(255,255,255,0.10)' : '#fff',
    border: dark ? '1px solid rgba(255,255,255,0.18)' : '1px solid var(--glass-line)',
    backdropFilter: dark ? 'blur(8px)' : 'none',
    boxShadow: dark ? 'none' : 'var(--sh-1)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
    color: dark ? 'var(--on-dark)' : 'var(--ink)' } }, children);
}

function Wordmark({ dark }) {
  return e('a', { href: '#top', style: { display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' } },
    e(Orb, { size: 34, dots: true, from: 'var(--accent)', to: 'var(--orb-deep)' }),
    e('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em',
      color: dark ? 'var(--on-dark)' : 'var(--ink)' } },
      'Puhu', e('span', { style: { color: 'var(--accent)' } }, 'Scribe')));
}

function CTA({ variant, children, large }) {
  const base = { fontFamily: 'var(--font-display)', fontWeight: 600, borderRadius: 999, cursor: 'pointer',
    border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
    padding: large ? '17px 26px' : '13px 22px', fontSize: large ? 16.5 : 15, letterSpacing: '-0.01em',
    transition: 'transform .12s ease, box-shadow .15s, background .15s' };
  const styles = {
    accent: { ...base, background: 'var(--accent)', color: '#fff', boxShadow: '0 12px 26px -8px var(--accent-glow)' },
    ink:    { ...base, background: 'var(--ink)', color: 'var(--on-dark)', boxShadow: '0 12px 26px -10px rgba(27,26,32,.5)' },
    light:  { ...base, background: '#fff', color: 'var(--ink)', border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-1)' },
    glass:  { ...base, background: 'rgba(255,255,255,0.12)', color: 'var(--on-dark)', border: '1px solid rgba(255,255,255,0.25)' },
  };
  return e('button', { className: 'cta', style: styles[variant] }, children);
}

/* ---------- NAV ---------- */
function Nav({ dark }) {
  const links = ['How it works', 'Two Finnishes', 'Research', 'Features'];
  return e('nav', { style: {
    position: 'sticky', top: 0, zIndex: 40, padding: '18px clamp(20px,5vw,64px)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    background: dark ? 'rgba(20,12,42,0.45)' : 'rgba(255,255,255,0.62)',
    borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'var(--glass-line)'}` } },
    e(Wordmark, { dark }),
    e('div', { className: 'nav-links', style: { display: 'flex', alignItems: 'center', gap: 'clamp(18px,3vw,40px)' } },
      links.map((l) => e('a', { key: l, href: '#' + l.toLowerCase().replace(/\s/g, '-'), style: {
        fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, textDecoration: 'none',
        color: dark ? 'rgba(246,244,251,0.82)' : 'var(--ink-2)' } }, l))),
    e('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
      e('a', { href: APP_URL, target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } }, e(CTA, { variant: 'accent' }, 'Become a tester'))));
}

/* ---------- HERO ---------- */
function Hero({ t, dark }) {
  const parts = HEADLINES[t.headline] || [t.headline, '', ''];
  const Screen = SCREENS[t.phoneScreen] || SCREENS.daily;

  return e('header', { id: 'top', className: 'hero', style: {
    position: 'relative', overflow: 'hidden', padding: '60px clamp(20px,5vw,64px) 0',
    textAlign: 'center', color: dark ? 'var(--on-dark)' : 'var(--ink)' } },
    e('a', { href: '#join', style: { textDecoration: 'none' } },
      e(Pill, { dark },
        e('span', { style: { display: 'inline-flex', width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' } }),
        'No app store needed, add it to your home screen',
        e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999,
          background: 'var(--accent)', color: '#fff', fontWeight: 600, fontSize: 12.5 } },
          'Now in beta', I('arrow', { size: 14, sw: 2.2 })))),
    e('h1', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-0.035em',
      lineHeight: 1.02, fontSize: 'clamp(40px,7vw,82px)', margin: '26px auto 0', maxWidth: '14ch', textWrap: 'balance' } },
      parts[0], e('span', { style: { color: 'var(--accent)' } }, parts[1]), parts[2]),
    e('p', { style: { fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 'clamp(16px,1.7vw,19px)',
      lineHeight: 1.55, margin: '24px auto 0', maxWidth: 600, color: dark ? 'rgba(246,244,251,0.82)' : 'var(--ink-2)' } },
      'Every phrase comes taught twice, in the textbook ',
      e('span', { style: { color: dark ? '#cdb6f3' : 'var(--written)', fontWeight: 600 } }, 'kirjakieli'),
      ' and the spoken ',
      e('span', { style: { color: dark ? '#86c8d6' : 'var(--spoken)', fontWeight: 600 } }, 'puhekieli'),
      '. So you are never lost between what you studied and what you actually hear.'),
    e('div', { style: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 } },
      e('a', { href: APP_URL, target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } }, e(CTA, { variant: 'accent', large: true }, 'Become a tester', I('arrow', { size: 19, sw: 2.1 }))),
      e('a', { href: '#two-finnishes', style: { textDecoration: 'none' } }, e(CTA, { variant: dark ? 'glass' : 'light', large: true }, 'See how it works'))),
    // ---- phone + two overlapping app-screen panels ----
    e('div', { style: { position: 'relative', height: 600, margin: '44px auto 0', maxWidth: 1000 } },
      e('div', { className: 'side-panel', style: { position: 'absolute', top: 92, left: 'calc(50% - 352px)', zIndex: 2, transform: 'rotate(-7deg)' } }, e(ListenPanel)),
      e('div', { className: 'side-panel', style: { position: 'absolute', top: 130, right: 'calc(50% - 352px)', zIndex: 2, transform: 'rotate(7deg)' } }, e(MonthPanel)),
      e('div', { style: { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 3 } }, e(Phone, { w: 300 }, e(Screen)))),
  );
}

/* ---------- TWO FINNISHES explainer ---------- */
function TwoFinnishes() {
  return e('section', { id: 'two-finnishes', style: { padding: '96px clamp(20px,5vw,64px)', background: '#fff' } },
    e('div', { style: { maxWidth: 1080, margin: '0 auto', display: 'grid', gap: 'clamp(36px,5vw,72px)',
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', alignItems: 'center' } },
      e('div', null,
        e('span', { className: 'ps-label', style: { color: 'var(--accent)' } }, 'The core idea'),
        e('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(30px,4vw,46px)',
          letterSpacing: '-0.03em', lineHeight: 1.05, margin: '16px 0 0', textWrap: 'balance' } },
          'Books teach one Finnish. The street speaks another.'),
        e('p', { className: 'ps-body-l', style: { color: 'var(--ink-2)', marginTop: 20, maxWidth: 460 } },
          'Textbooks drill ', e('b', { style: { color: 'var(--written)' } }, 'kirjakieli'),
          '. Real life runs on ', e('b', { style: { color: 'var(--spoken)' } }, 'puhekieli'),
          '. PuhuScribe shows you both at once and flags the exact words that morph between them, in ',
          e('span', { className: 'ps-hot' }, 'azure'), ', so the leap from classroom to conversation stops being a guess.'),
        e('div', { style: { display: 'flex', gap: 22, marginTop: 28, flexWrap: 'wrap' } },
          [['written', 'Kirjakieli', 'written / book Finnish'], ['spoken', 'Puhekieli', 'spoken / street Finnish']].map(([k, a, b]) =>
            e('div', { key: k, style: { display: 'flex', alignItems: 'center', gap: 10 } },
              e('span', { style: { width: 12, height: 12, borderRadius: 999, background: `var(--${k})` } }),
              e('div', null,
                e('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: `var(--${k})` } }, a),
                e('div', { className: 'ps-caption', style: { fontSize: 12 } }, b))))) ),
      e('div', { style: { display: 'grid', gap: 16 } },
        e(RegisterCard, { gloss: 'Do you want to come along?', badge: 'Arki · daily',
          kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
          puhe: [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
          onPlay: () => {}, playing: null }),
        e(RegisterCard, { gloss: 'He / she goes to the shop', badge: 'Arki · daily',
          kirja: [{ t: 'Hän', hot: true }, { t: 'menee' }, { t: 'kauppaan' }],
          puhe: [{ t: 'Se', hot: true }, { t: 'menee' }, { t: 'kauppaan' }],
          onPlay: () => {}, playing: null }))));
}

/* ---------- RESEARCH (why the method works) ---------- */
function Research() {
  const principles = [
    { ic: 'sparkle', t: 'Recognition before production',
      d: 'Decades of vocabulary research show learners understand far more words than they can yet produce. The Day One Sprint builds that receptive base first, so speaking has something to stand on.' },
    { ic: 'cards', t: 'Spaced repetition',
      d: 'The spacing effect, one of the most replicated findings in memory science, shows we retain more when review is spread over time. Daily Sessions resurface each phrase right before you would forget it.' },
    { ic: 'island', t: 'Input and shadowing',
      d: 'Comprehensible input and shadowing native audio are long-studied paths to fluent speech. Language Island has you listen and repeat aloud, closing the gap between reading and speaking.' },
  ];
  return e('section', { id: 'research', style: { padding: '96px clamp(20px,5vw,64px)', background: 'var(--accent-soft)' } },
    e('div', { style: { maxWidth: 1080, margin: '0 auto' } },
      e('div', { style: { textAlign: 'center', maxWidth: 660, margin: '0 auto 14px' } },
        e('span', { className: 'ps-label', style: { color: 'var(--accent)' } }, 'Why it works'),
        e('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,3.6vw,42px)',
          letterSpacing: '-0.03em', lineHeight: 1.06, margin: '14px 0 0', textWrap: 'balance' } },
          'Built on how people actually learn a language.'),
        e('p', { className: 'ps-body-l', style: { color: 'var(--ink-2)', margin: '18px auto 0', maxWidth: 560 } },
          'Every part of PuhuScribe is grounded in established second-language acquisition and memory research, not guesswork about what feels productive.')),
      e('div', { style: { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', marginTop: 44 } },
        principles.map((p) => e('div', { key: p.t, style: {
          padding: 28, borderRadius: 'var(--r-xl)', background: '#fff', border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-1)' } },
          e('span', { style: { width: 48, height: 48, borderRadius: 14, background: 'var(--accent-wash)',
            color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, I(p.ic, { size: 24 })),
          e('h3', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, margin: '20px 0 0',
            letterSpacing: '-0.01em', lineHeight: 1.15 } }, p.t),
          e('p', { className: 'ps-body', style: { color: 'var(--ink-2)', marginTop: 10 } }, p.d))))));
}

/* ---------- HOW IT WORKS (3 steps) ---------- */
function HowItWorks() {
  const steps = [
    { ic: 'sparkle', k: '01', t: 'Day One Sprint', d: 'Recognise 150 core words in one sitting. No typing, just see, hear, and tap.' },
    { ic: 'cards', k: '02', t: 'Daily Sessions', d: 'Short review loops turn recognised words into phrases you actually keep.' },
    { ic: 'island', k: '03', t: 'Language Island', d: 'Shadow native audio out loud and close the gap between reading and speaking.' },
  ];
  return e('section', { id: 'how-it-works', style: { padding: '40px clamp(20px,5vw,64px) 96px', background: '#fff' } },
    e('div', { style: { maxWidth: 1080, margin: '0 auto' } },
      e('div', { style: { textAlign: 'center', maxWidth: 620, margin: '0 auto 48px' } },
        e('span', { className: 'ps-label', style: { color: 'var(--accent)' } }, 'How it works'),
        e('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,3.6vw,42px)',
          letterSpacing: '-0.03em', margin: '14px 0 0' } }, 'From first word to first conversation.')),
      e('div', { style: { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' } },
        steps.map((s) => e('div', { key: s.k, className: 'lift', style: {
          padding: 26, borderRadius: 'var(--r-xl)', background: '#fff', border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-1)' } },
          e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
            e('span', { style: { width: 48, height: 48, borderRadius: 14, background: 'var(--accent-wash)',
              color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, I(s.ic, { size: 24 })),
            e('span', { className: 'ps-num', style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink-3)' } }, s.k)),
          e('h3', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 21, margin: '20px 0 0', letterSpacing: '-0.01em' } }, s.t),
          e('p', { className: 'ps-body', style: { color: 'var(--ink-2)', marginTop: 9 } }, s.d))))));
}

/* ---------- FEATURES (ref-2: phone-in-hand left, progress + cards right) ---------- */
function Features() {
  const cards = [
    { ic: 'sparkle', bg: 'var(--lav)', ink: 'var(--lav-ink)', t: 'Expand your phrasebook', d: 'Learn words you will actually use' },
    { ic: 'cards', bg: 'var(--blush)', ink: 'var(--blush-ink)', t: 'Build solid grammar sense', d: 'Clear patterns, shown in context' },
    { ic: 'island', bg: 'var(--mint)', ink: 'var(--mint-ink)', t: 'Master everyday talk', d: 'Practice real spoken Finnish' },
    { ic: 'chart', bg: 'var(--lav)', ink: 'var(--lav-ink)', t: 'Grow your word bank', d: 'Watch both registers rise' },
  ];
  return e('section', { id: 'features', style: { padding: '0 clamp(20px,5vw,64px) 100px', background: '#fff' } },
    e('div', { style: { maxWidth: 1140, margin: '0 auto' } },
      e('div', { style: { textAlign: 'center', maxWidth: 620, margin: '0 auto 44px' } },
        e('span', { className: 'ps-label', style: { color: 'var(--accent)' } }, 'In the app'),
        e('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(28px,3.6vw,42px)',
          letterSpacing: '-0.03em', margin: '14px 0 0' } }, 'See your progress, lesson by lesson.')),
      e('div', { className: 'features-grid', style: { display: 'grid', gap: 'clamp(24px,3vw,44px)',
        gridTemplateColumns: 'minmax(280px,0.85fr) minmax(320px,1.15fr)', alignItems: 'center' } },
        // LEFT — phone in app, on a soft pastel stage
        e('div', { style: { position: 'relative', borderRadius: 'var(--r-2xl)', padding: '40px 0',
          background: 'linear-gradient(160deg, var(--accent-soft), #fff)', display: 'flex', justifyContent: 'center', overflow: 'hidden' } },
          e('div', { style: { position: 'absolute', width: 280, height: 280, borderRadius: '50%', background: 'var(--accent-wash)', filter: 'blur(8px)', top: 40 } }),
          e('div', { style: { position: 'relative', transform: 'rotate(-3deg)' } }, e(Phone, { w: 282 }, e(SCREENS.chart)))),
        // RIGHT — progress stat card + 2x2 cards
        e('div', { style: { display: 'grid', gap: 18 } },
          // Student-progress card
          e('div', { style: { padding: 26, borderRadius: 'var(--r-2xl)', background: 'linear-gradient(170deg,#fff,var(--accent-soft))',
            border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-2)' } },
            e('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 } },
              e('div', null,
                e('h3', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' } }, 'Your progress'),
                e('p', { className: 'ps-caption', style: { marginTop: 4, fontSize: 13 } }, 'Weekly learning activity')),
              e('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 999,
                background: '#fff', border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-1)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5 } }, 'Last month', I('chevD', { size: 16 }))),
            e('div', { style: { marginTop: 22, display: 'grid', gap: 18 } },
              [['Kirjakieli understood', '78 / 100', 78, 'linear-gradient(90deg,#8b6fd4,#6B46C1)'],
               ['Puhekieli spoken', '52 / 100', 52, 'linear-gradient(90deg,#54b3c4,#1F7C8E)']].map(([a, b, v, g]) =>
                e('div', { key: a },
                  e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 } },
                    e('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15.5 } }, a),
                    e('span', { className: 'ps-num', style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--ink-2)' } }, b)),
                  e('div', { style: { height: 24, borderRadius: 999, background: 'var(--glass-deep)', overflow: 'hidden' } },
                    e('div', { style: { width: v + '%', height: '100%', borderRadius: 999, background: g } })))) )),
          // 2x2 cards
          e('div', { className: 'mini-grid', style: { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2,1fr)' } },
            cards.map((c) => e('div', { key: c.t, className: 'lift', style: {
              padding: 22, borderRadius: 'var(--r-xl)', background: c.bg, border: '1px solid rgba(255,255,255,0.55)',
              display: 'flex', flexDirection: 'column', minHeight: 150 } },
              e('span', { style: { width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.7)',
                color: c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, I(c.ic, { size: 22 })),
              e('h4', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, letterSpacing: '-0.01em',
                margin: '18px 0 0', color: '#241c33', lineHeight: 1.12 } }, c.t),
              e('p', { style: { fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: c.ink, marginTop: 6 } }, c.d)))))) ));
}

/* ---------- BECOME A TESTER + FOOTER ---------- */
function Waitlist() {
  return e('section', { id: 'join', style: { padding: '0 clamp(20px,5vw,64px) 80px', background: '#fff' } },
    e('div', { style: { maxWidth: 1080, margin: '0 auto', position: 'relative', overflow: 'hidden',
      borderRadius: 'var(--r-2xl)', padding: 'clamp(40px,6vw,72px)', textAlign: 'center', color: 'var(--on-dark)',
      background: 'var(--band-bg)' } },
      e(OrbCluster, { size: 220, style: { position: 'absolute', right: -50, top: -40, opacity: .5 } }),
      e(OrbCluster, { size: 150, style: { position: 'absolute', left: -50, bottom: -50, opacity: .3 } }),
      e('div', { style: { position: 'relative' } },
        e('span', { className: 'ps-label', style: { color: 'rgba(255,255,255,0.7)' } }, 'For new arrivals in Finland'),
        e('h2', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(30px,4.5vw,52px)',
          letterSpacing: '-0.03em', lineHeight: 1.04, margin: '16px auto 0', maxWidth: '16ch', textWrap: 'balance' } },
          'Help shape how Finnish gets learned.'),
        e('p', { style: { fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 17, lineHeight: 1.5,
          margin: '18px auto 0', maxWidth: 520, color: 'rgba(246,244,251,0.84)' } },
          'PuhuScribe is live in beta as a web app. There is nothing to download from an app store. Open the link in your browser, add it to your home screen, and it opens like any other app.'),
        e('div', { style: { display: 'flex', justifyContent: 'center', margin: '32px auto 0' } },
          e('a', { href: APP_URL, target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } },
            e('span', { className: 'cta', style: { display: 'inline-flex', alignItems: 'center', gap: 9, padding: '17px 30px',
              borderRadius: 999, background: '#fff', color: 'var(--ink)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16.5, cursor: 'pointer' } }, 'Become a tester', I('arrow', { size: 18, sw: 2.1 })))),
        e('div', { style: { display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap',
          fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5, color: 'rgba(246,244,251,0.7)' } },
          ['Free during beta', 'Add to home screen', 'No download needed'].map((x) =>
            e('span', { key: x, style: { display: 'inline-flex', alignItems: 'center', gap: 7 } }, I('check', { size: 16 }), x))))));
}

function Footer() {
  return e('footer', { style: { padding: '36px clamp(20px,5vw,64px) 48px', background: '#fff', borderTop: '1px solid var(--glass-line)' } },
    e('div', { style: { maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 } },
      e(Wordmark, {}),
      e('span', { className: 'ps-caption', style: { fontSize: 13 } }, 'Puhu niin kuin täällä puhutaan. · © 2026 PuhuScribe')));
}

/* ---------- APP ---------- */
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dark = V.dark;

  const heroBg = dark ? DARK_HERO[V.accent] : (V.ground === 'lake' ? LAKE[V.accent]
    : `radial-gradient(82% 62% at 50% 0%, ${acc.soft} 0%, #fff 62%)`);
  const showGrid = !dark;

  const rootStyle = {
    '--accent': acc.c, '--accent-strong': acc.d, '--accent-wash': acc.wash,
    '--accent-glow': acc.glow, '--accent-soft': acc.soft, '--band-bg': BAND[V.accent],
    '--font-display': FONTS[t.fontPair] || FONTS.Poppins,
    background: '#fff', minHeight: '100vh',
  };

  return e('div', { className: 'ps-root ps-theme-snow', style: rootStyle },
    e('div', { style: { position: 'relative', background: heroBg } },
      showGrid && e('div', { 'aria-hidden': true, style: { position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--grid-c) 1px,transparent 1px),linear-gradient(90deg,var(--grid-c) 1px,transparent 1px)',
        backgroundSize: '56px 56px', maskImage: 'radial-gradient(72% 62% at 50% 18%, #000 0%, transparent 82%)',
        WebkitMaskImage: 'radial-gradient(72% 62% at 50% 18%, #000 0%, transparent 82%)',
        '--grid-c': 'rgba(80,60,140,0.07)' } }),
      e('div', { style: { position: 'relative', zIndex: 1 } },
        e(Nav, { dark }),
        e(Hero, { t, dark }))),
    e(TwoFinnishes),
    e(Research),
    e(HowItWorks),
    e(Features),
    e(Waitlist),
    e(Footer),
    e(TweaksPanel, null,
      e(TweakSection, { label: 'Content' }),
      e(TweakSelect, { label: 'Headline', value: t.headline, options: Object.keys(HEADLINES),
        onChange: (v) => setTweak('headline', v) }),
      e(TweakSelect, { label: 'Phone screen', value: t.phoneScreen, options: ['daily', 'progress', 'register', 'chart'],
        onChange: (v) => setTweak('phoneScreen', v) }),
      e(TweakSection, { label: 'Type' }),
      e(TweakRadio, { label: 'Display font', value: t.fontPair, options: ['Poppins', 'Sora', 'Space Grotesk'],
        onChange: (v) => setTweak('fontPair', v) }),
      e(TweakSection, { label: 'Colour scheme' }),
      e('div', { style: { padding: '4px 2px 2px', fontFamily: 'system-ui', fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' } },
        'This page is the ', e('b', { style: { color: '#fff', textTransform: 'capitalize' } }, VARIANT),
        ' direction. Open the Teal and Azure files to compare the other schemes.')));
}

ReactDOM.createRoot(document.getElementById('root')).render(e(App));
