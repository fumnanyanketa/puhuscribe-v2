/* PuhuScribe Landing — device frame + app-screen snapshots + hero side panels.
   Reuses window.PS.* components so the mockups show the real product. */
(function () {
  const e = React.createElement;
  const { I, Label, RegisterCard, Orb, OrbCluster, Ring, Bar, SpeakerBtn, RegDot, Sentence } = window.PS;

  /* ---- iPhone frame (Dynamic Island) ---- */
  function Phone({ children, w = 300, glow = 'var(--accent-glow)' }) {
    const h = Math.round(w * 2.06);
    return e('div', {
      style: {
        position: 'relative', width: w, height: h, flexShrink: 0,
        borderRadius: w * 0.155, padding: w * 0.038,
        background: 'linear-gradient(150deg,#2b2933,#16151b 60%,#2b2933)',
        boxShadow: `0 2px 3px rgba(255,255,255,.25) inset, 0 44px 80px -30px ${glow}, var(--sh-3)`,
      },
    },
      e('div', {
        style: {
          position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
          borderRadius: w * 0.118, background: 'var(--bg-grad)',
        },
      },
        e('div', { style: {
          position: 'absolute', top: 0, left: 0, right: 0, height: 46, zIndex: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--ink)' } },
          e('span', { className: 'ps-num' }, '9:41'),
          e('span', { style: { display: 'flex', gap: 6, alignItems: 'center', opacity: .9 } },
            I('chart', { size: 15, sw: 2.4 }),
            e('span', { style: { width: 22, height: 11, borderRadius: 3, border: '1.5px solid var(--ink)', position: 'relative', opacity: .85 } },
              e('span', { style: { position: 'absolute', inset: 1.5, background: 'var(--ink)', borderRadius: 1 } })))),
        e('div', { style: {
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 6,
          width: 92, height: 28, borderRadius: 16, background: '#0b0a0f' } }),
        e('div', { style: { position: 'absolute', inset: 0, paddingTop: 46, overflow: 'hidden' } }, children),
      ),
    );
  }

  const wrap = (children, pad = 18) => e('div', { className: 'ps-noscroll', style: {
    height: '100%', padding: pad, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }, children);

  /* ===== smooth path helper for charts ===== */
  function smooth(pts) {
    return pts.map((p, i) => {
      if (i === 0) return `M ${p[0]} ${p[1]}`;
      const prev = pts[i - 1], cx = (prev[0] + p[0]) / 2;
      return `C ${cx} ${prev[1]} ${cx} ${p[1]} ${p[0]} ${p[1]}`;
    }).join(' ');
  }

  /* ===== Screen 1 · Daily session ===== */
  function DailyScreen() {
    return wrap([
      e('div', { key: 'h', style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' } },
        e('div', null,
          e(Label, { color: 'var(--written)' }, 'Huomenta · Tiistai'),
          e('h1', { className: 'ps-title-2', style: { marginTop: 7 } }, 'Päivän sessio')),
        e('div', { className: 'ps-glass', style: { padding: '8px 13px', display: 'flex', alignItems: 'center', gap: 7, borderRadius: 999 } },
          e('span', { style: { color: 'var(--spoken)', display: 'flex' } }, I('flame', { size: 16, fill: 'var(--flag-bg)' })),
          e('span', { className: 'ps-num', style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 } }, '12'))),
      e('div', { key: 'm', className: 'ps-glass', style: { padding: 14, marginTop: 14 } },
        e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 } },
          e('span', { className: 'ps-caption', style: { fontSize: 12 } }, 'Phrases mastered'),
          e('span', { className: 'ps-num', style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 } }, '847')),
        e(Bar, { value: 70, color: 'var(--written)' })),
      e('div', { key: 'c', style: { marginTop: 14 } },
        e(RegisterCard, { compact: true, gloss: 'I am at home', badge: 'Arki · daily',
          kirja: [{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }],
          puhe: [{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }],
          onPlay: () => {}, playing: null })),
      e('div', { key: 'cap', className: 'ps-caption', style: { textAlign: 'center', marginTop: 12, fontSize: 12,
        display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' } },
        I('speaker', { size: 14 }), 'Tap a register to hear it'),
      e('div', { key: 'a', style: { display: 'flex', gap: 9, marginTop: 14 } },
        e('button', { className: 'ps-btn ps-btn--light ps-btn--sm', style: { flex: 1 } }, 'Vielä'),
        e('button', { className: 'ps-btn ps-btn--accent ps-btn--sm', style: { flex: 1.2, background: 'var(--accent)' } },
          I('check', { size: 17 }), 'Osaan')),
    ]);
  }

  /* ===== Screen 2 · Progress ===== */
  function ProgressScreen() {
    const days = [['Mon', '11'], ['Tue', '12'], ['Wed', '13'], ['Thu', '14'], ['Fri', '15'], ['Sat', '16'], ['Sun', '17']];
    const sel = 3;
    return wrap([
      e('div', { key: 'h', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        e('div', { style: { display: 'flex', alignItems: 'center', gap: 6 } },
          e('h1', { className: 'ps-title-2' }, 'Kesäkuu 2026'),
          e('span', { style: { color: 'var(--ink-2)', display: 'flex' } }, I('chevD', { size: 18 }))),
        e('span', { className: 'ps-glass', style: { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' } }, I('plus', { size: 18 }))),
      e('div', { key: 'cal', className: 'ps-glass', style: { marginTop: 14, padding: 9, display: 'flex', justifyContent: 'space-between', gap: 3 } },
        days.map(([d, n], i) => {
          const on = i === sel;
          return e('div', { key: i, style: { flex: 1, padding: '8px 0', borderRadius: 13,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--on-dark)' : 'var(--ink-2)' } },
            e('span', { className: 'ps-label', style: { fontSize: 8.5, opacity: on ? .8 : .6 } }, d),
            e('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 } }, n));
        })),
      e('div', { key: 'hero', style: { marginTop: 14, padding: 18, borderRadius: 'var(--r-xl)', background: 'var(--lav)',
        border: '1px solid rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' } },
        e(OrbCluster, { size: 108, style: { position: 'absolute', right: -44, top: -30, opacity: .35 } }),
        e(Ring, { value: 847, max: 1200, size: 82, stroke: 8, color: 'var(--written)', track: 'rgba(255,255,255,.55)' },
          e('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21, lineHeight: 1, letterSpacing: '-0.02em' } }, '847'),
          e('span', { className: 'ps-label', style: { color: 'var(--ink-3)', marginTop: 2, fontSize: 9 } }, 'of 1200')),
        e('div', { style: { position: 'relative', flex: 1, minWidth: 0 } },
          e(Label, { color: 'var(--lav-ink)' }, 'Mastered'),
          e('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, marginTop: 6, lineHeight: 1.2, letterSpacing: '-0.01em', textWrap: 'balance', overflowWrap: 'break-word' } }, 'Conversational foundations'),
          e('div', { className: 'ps-caption', style: { marginTop: 6, fontSize: 12 } }, '+34 this week'))),
      e('div', { key: 'bal', className: 'ps-glass', style: { marginTop: 14, padding: 16 } },
        e(Label, { color: 'var(--ink-3)' }, 'Register balance'),
        e('div', { style: { marginTop: 13, display: 'grid', gap: 13 } },
          [['Kirjakieli · understood', 78, 'var(--written)'], ['Puhekieli · spoken', 52, 'var(--spoken)']].map(([t, v, c]) =>
            e('div', { key: t },
              e('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 7 } },
                e('span', { className: 'ps-label', style: { color: c } }, t),
                e('span', { className: 'ps-num', style: { fontWeight: 700, fontSize: 13 } }, v + '%')),
              e(Bar, { value: v, color: c, h: 9 }))))),
    ]);
  }

  /* ===== Screen 3 · Register cards focus ===== */
  function RegisterScreen() {
    const cards = [
      { gloss: 'Are you hungry?', badge: 'Arki · daily',
        kirja: [{ t: 'Onko', hot: true }, { t: 'sinulla', hot: true }, { t: 'nälkä?' }],
        puhe: [{ t: 'Onks', hot: true }, { t: 'sulla', hot: true }, { t: 'nälkä?' }] },
      { gloss: 'This food is good', badge: 'Ruoka · food',
        kirja: [{ t: 'Tämä', hot: true }, { t: 'ruoka' }, { t: 'on' }, { t: 'hyvää' }],
        puhe: [{ t: 'Tää', hot: true }, { t: 'ruoka' }, { t: 'on' }, { t: 'hyvää' }] },
    ];
    return wrap([
      e('div', { key: 'h', style: { marginBottom: 4 } },
        e(Label, { color: 'var(--written)' }, 'Sanakortit · Phrase cards'),
        e('h1', { className: 'ps-title-2', style: { marginTop: 7 } }, 'Kaksi rekisteriä')),
      e('div', { key: 'g', style: { marginTop: 14, display: 'grid', gap: 14 } },
        cards.map((c, i) => e(RegisterCard, { key: i, compact: true, ...c, onPlay: () => {}, playing: null }))),
    ]);
  }

  /* ===== Screen 4 · Performance chart (for the Features 'in hand' phone) ===== */
  function ChartScreen() {
    const kirja = [[0, 30], [20, 22], [40, 31], [60, 15], [80, 23], [100, 11]];
    const puhe = [[0, 40], [20, 34], [40, 27], [60, 31], [80, 19], [100, 25]];
    const months = ['Tam', 'Hel', 'Maa', 'Huh', 'Tou'];
    const toggles = [['Viikko', false], ['Kuukausi', true], ['Vuosi', false]];
    return wrap([
      // header
      e('div', { key: 'h', style: { display: 'flex', alignItems: 'center', gap: 11 } },
        e('div', { style: { width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(150deg,var(--accent),var(--orb-deep))', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 } }, 'MK'),
        e('div', { style: { flex: 1, minWidth: 0 } },
          e('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, lineHeight: 1.1 } }, 'Mila K.'),
          e('div', { className: 'ps-caption', style: { fontSize: 11.5 } }, 'mila@email.com')),
        e('span', { className: 'ps-glass', style: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' } }, I('search', { size: 16 }))),
      // title
      e('div', { key: 't', style: { marginTop: 18 } },
        e('h1', { className: 'ps-title-2' }, 'Edistyminen'),
        e('p', { className: 'ps-caption', style: { marginTop: 5, fontSize: 12.5 } }, 'Track results and watch your progress rise.')),
      // legend
      e('div', { key: 'l', style: { display: 'flex', gap: 14, marginTop: 12 } },
        [['Kirja', 'var(--written)'], ['Puhe', 'var(--spoken)']].map(([t, c]) =>
          e('span', { key: t, style: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' } },
            e('span', { style: { width: 9, height: 9, borderRadius: 3, background: c } }), t))),
      // chart
      e('div', { key: 'c', style: { position: 'relative', marginTop: 10, flex: 1, minHeight: 0 } },
        e('div', { style: { position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          background: 'var(--accent-wash)', borderRadius: 14, padding: '8px 14px', textAlign: 'center' } },
          e('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--accent)', lineHeight: 1 } }, '+21%'),
          e('div', { className: 'ps-caption', style: { fontSize: 10, marginTop: 2 } }, 'this week · 23 lessons')),
        e('svg', { viewBox: '0 0 100 56', preserveAspectRatio: 'none', style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } },
          e('defs', null,
            e('linearGradient', { id: 'gk', x1: 0, y1: 0, x2: 0, y2: 1 },
              e('stop', { offset: '0%', stopColor: 'var(--written)', stopOpacity: .28 }),
              e('stop', { offset: '100%', stopColor: 'var(--written)', stopOpacity: 0 })),
            e('linearGradient', { id: 'gp', x1: 0, y1: 0, x2: 0, y2: 1 },
              e('stop', { offset: '0%', stopColor: 'var(--spoken)', stopOpacity: .26 }),
              e('stop', { offset: '100%', stopColor: 'var(--spoken)', stopOpacity: 0 }))),
          e('path', { d: smooth(puhe) + ' L 100 56 L 0 56 Z', fill: 'url(#gp)' }),
          e('path', { d: smooth(kirja) + ' L 100 56 L 0 56 Z', fill: 'url(#gk)' }),
          e('path', { d: smooth(puhe), fill: 'none', stroke: 'var(--spoken)', strokeWidth: 1.6, vectorEffect: 'non-scaling-stroke' }),
          e('path', { d: smooth(kirja), fill: 'none', stroke: 'var(--written)', strokeWidth: 1.6, vectorEffect: 'non-scaling-stroke' }))),
      // x labels
      e('div', { key: 'x', style: { display: 'flex', justifyContent: 'space-between', marginTop: 8 } },
        months.map((m) => e('span', { key: m, className: 'ps-label', style: { color: 'var(--ink-3)', fontSize: 10 } }, m))),
      // toggle
      e('div', { key: 'tg', className: 'ps-glass', style: { marginTop: 14, padding: 5, display: 'flex', gap: 4, borderRadius: 999 } },
        toggles.map(([t, on]) => e('span', { key: t, style: { flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999,
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
          background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--on-dark)' : 'var(--ink-2)' } }, t))),
    ]);
  }

  const SCREENS = { daily: DailyScreen, progress: ProgressScreen, register: RegisterScreen, chart: ChartScreen };

  /* =========================================================================
     HERO SIDE PANELS — large app-screen snapshots that flank the phone.
     ========================================================================= */

  /* Left: a listening / shadowing exercise snapshot */
  function ListenPanel() {
    const bars = Array.from({ length: 26 }).map((_, i) => 5 + Math.abs(Math.sin(i * 0.7)) * 26);
    return e('div', { style: { width: 248, padding: 22, borderRadius: 'var(--r-2xl)', background: '#fff',
      border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-3)' } },
      e(Label, { color: 'var(--spoken)' }, 'Kuuntele · Listen'),
      e('h3', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em',
        lineHeight: 1.08, margin: '12px 0 0' } }, 'Tap what you hear, then build the phrase.'),
      e('div', { style: { display: 'flex', alignItems: 'center', gap: 4, height: 56, margin: '22px 0 6px' } },
        e('button', { className: 'ps-press', style: { width: 52, height: 52, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: 'var(--spoken)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px -6px var(--spoken)', marginRight: 8 } }, I('play', { size: 22 })),
        bars.map((hgt, i) => e('span', { key: i, style: { width: 3, borderRadius: 2, height: hgt,
          background: 'var(--spoken)', opacity: i < 13 ? 0.9 : 0.32 } }))),
      e('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 } },
        [['Mä', true], ['oon', true], ['kotona', false], ['nyt', false]].map(([w, on], i) =>
          e('span', { key: i, style: { padding: '9px 14px', borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
            background: on ? 'var(--ink)' : 'var(--glass-deep)', color: on ? 'var(--on-dark)' : 'var(--ink-3)' } }, w))));
  }

  /* Right: a 'this month' growth snapshot */
  function MonthPanel() {
    const week = [38, 60, 30, 74, 48, 88, 66];
    return e('div', { style: { width: 248, padding: 22, borderRadius: 'var(--r-2xl)', background: '#fff',
      border: '1px solid var(--glass-line)', boxShadow: 'var(--sh-3)' } },
      e('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        e(Label, { color: 'var(--ink-3)' }, 'This month'),
        e('span', { style: { color: 'var(--ink-3)', display: 'flex' } }, I('arrow', { size: 18, sw: 2 }))),
      e('div', { style: { display: 'inline-flex', alignItems: 'baseline', gap: 8, marginTop: 16 } },
        e('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 40, letterSpacing: '-0.03em', color: 'var(--accent)' } }, '+21%'),
        e('span', { style: { color: 'var(--spoken)', display: 'flex' } }, I('arrowUR', { size: 20, sw: 2.2 }))),
      e('p', { className: 'ps-caption', style: { marginTop: 4, fontSize: 12.5 } }, 'Total growth on spoken Finnish'),
      e('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, height: 92, marginTop: 20 } },
        week.map((v, i) => e('div', { key: i, style: { flex: 1, height: v + '%', borderRadius: 6,
          background: i === 5 ? 'var(--accent)' : 'var(--accent-wash)' } }))),
      e('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 9 } },
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => e('span', { key: i, className: 'ps-label', style: { color: 'var(--ink-3)', fontSize: 9.5 } }, d))));
  }

  window.PSLanding = Object.assign(window.PSLanding || {}, { Phone, SCREENS, ListenPanel, MonthPanel });
})();
