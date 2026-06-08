/* PuhuScribe v2 — shared primitives ("Lake Glass"). Exposes window.PS.* */
(function () {
  const e = React.createElement;

  /* ---------- thin line icons ---------- */
  const Icon = ({ d, size = 22, stroke = 'currentColor', sw = 1.8, fill = 'none', style }) =>
    e('svg', { width: size, height: size, viewBox: '0 0 24 24', fill, stroke, strokeWidth: sw,
      strokeLinecap: 'round', strokeLinejoin: 'round', style }, d.map((p, i) => e('path', { key: i, d: p })));

  const icons = {
    speaker: ['M11 5 6 9H3v6h3l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 6a9 9 0 0 1 0 12'],
    play:    ['M8 5v14l11-7z'],
    mic:     ['M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z', 'M5 11a7 7 0 0 0 14 0', 'M12 18v3'],
    check:   ['M4 12.5 9.5 18 20 6.5'],
    arrow:   ['M5 12h14', 'M13 6l6 6-6 6'],
    arrowUR: ['M7 17 17 7', 'M8 7h9v9'],
    arrowL:  ['M19 12H5', 'M11 6l-6 6 6 6'],
    flame:   ['M12 3c.6 3-1.8 4.2-2.6 6.1C8.3 11.6 9.7 14 12 14s3.7-2.4 2.6-4.9c-.4-1-.9-1.6-.6-3 1.8 1 4 3.4 4 6.4a6 6 0 1 1-12 0c0-2.3 1.2-4 2.6-5.4C11.6 5.6 12 4.4 12 3z'],
    home:    ['M4 11 12 4l8 7', 'M6 9.5V19h12V9.5'],
    book:    ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5z', 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20'],
    island:  ['M3 19h18', 'M12 19v-7', 'M12 12c2.5-2 5-1 6 0-2.5 0-3.5 1.5-6 1.5S8.5 12 6 12c1-1 3.5-2 6 0z'],
    chart:   ['M5 19V5', 'M5 19h14', 'M9 16v-4', 'M13 16V8', 'M17 16v-7'],
    grid:    ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
    cards:   ['M4 6h16v12H4z', 'M4 10h16'],
    close:   ['M6 6l12 12', 'M18 6 6 18'],
    star:    ['M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z'],
    lock:    ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
    sparkle: ['M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z'],
    search:  ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-3.5-3.5'],
    more:    ['M5 12h.01', 'M12 12h.01', 'M19 12h.01'],
    share:   ['M6 12a3 3 0 1 0 0-.01z', 'M18 6a3 3 0 1 0 0-.01z', 'M18 18a3 3 0 1 0 0-.01z', 'M8.6 10.6l6.8-3.6', 'M8.6 13.4l6.8 3.6'],
    plus:    ['M12 5v14', 'M5 12h14'],
    clock:   ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7.5V12l3 2'],
    chevD:   ['M6 9l6 6 6-6'],
  };
  const I = (name, props) => Icon({ d: icons[name], ...props });

  /* ---------- Label ---------- */
  const Label = ({ children, color = 'var(--ink-3)', style }) =>
    e('span', { className: 'ps-label', style: { color, ...style } }, children);

  /* ---------- Glossy 3D speech bubble (language motif, replaces the orb) ---------- */
  const BUBBLE = 'M28 10 H72 A20 20 0 0 1 92 30 V50 A20 20 0 0 1 72 70 H44 L24 88 L31 70 H28 A20 20 0 0 1 8 50 V30 A20 20 0 0 1 28 10 Z';
  const Orb = ({ size = 80, from = 'var(--orb-magenta)', to = 'var(--orb-violet)', dots, style }) => {
    const uid = React.useId().replace(/[:]/g, '');
    const g = 'bg' + uid, h = 'bh' + uid;
    return e('svg', { width: size, height: size, viewBox: '0 0 100 100', 'aria-hidden': true,
      style: { display: 'block', flexShrink: 0, filter: 'drop-shadow(0 9px 16px rgba(70,40,110,.30))', ...style } },
      e('defs', null,
        e('radialGradient', { id: g, cx: '34%', cy: '26%', r: '88%' },
          e('stop', { offset: '0%', stopColor: to }),
          e('stop', { offset: '100%', stopColor: from })),
        e('radialGradient', { id: h, cx: '32%', cy: '22%', r: '42%' },
          e('stop', { offset: '0%', stopColor: '#fff', stopOpacity: 0.72 }),
          e('stop', { offset: '100%', stopColor: '#fff', stopOpacity: 0 }))),
      e('path', { d: BUBBLE, fill: `url(#${g})` }),
      e('path', { d: BUBBLE, fill: `url(#${h})` }),
      dots && e('g', { fill: '#fff', fillOpacity: 0.95 },
        e('circle', { cx: 34, cy: 40, r: 5 }),
        e('circle', { cx: 50, cy: 40, r: 5 }),
        e('circle', { cx: 66, cy: 40, r: 5 })));
  };

  /* ---------- Speech-bubble cluster (hero imagery — the two registers, talking) ---------- */
  const OrbCluster = ({ size = 180, style }) => {
    const s = size;
    return e('div', { 'aria-hidden': true, style: { position: 'relative', width: s, height: s, ...style } },
      e(Orb, { size: s * 0.72, from: 'var(--orb-violet)', to: 'var(--orb-magenta)', dots: true, style: { position: 'absolute', left: s * 0.02, top: s * 0.20 } }),
      e(Orb, { size: s * 0.5, from: 'var(--orb-magenta)', to: 'var(--orb-pink)', style: { position: 'absolute', right: s * 0.0, top: s * 0.0 } }),
      e(Orb, { size: s * 0.34, from: 'var(--orb-deep)', to: 'var(--orb-violet)', style: { position: 'absolute', right: s * 0.14, bottom: s * 0.02 } }));
  };

  /* ---------- Circular icon button ---------- */
  const IconBtn = ({ icon, onClick, size = 44, tone = 'glass', style, label }) => {
    const tones = {
      glass: { background: 'var(--glass-3)', color: 'var(--ink)', border: '1px solid var(--glass-line)' },
      ink:   { background: 'var(--ink)', color: 'var(--on-dark)', border: 'none' },
      solid: { background: '#fff', color: 'var(--ink)', border: 'none' },
    };
    return e('button', { onClick, 'aria-label': label || icon, className: 'ps-press', style: {
      width: size, height: size, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'var(--sh-1)', ...tones[tone], ...style } },
      I(icon, { size: size * 0.42 }));
  };

  /* ---------- Pill tab group ---------- */
  const Tabs = ({ items, value, onChange, style }) =>
    e('div', { className: 'ps-glass', style: { display: 'flex', gap: 4, padding: 5, borderRadius: 999,
      background: 'var(--glass-2)', boxShadow: 'var(--sh-1)', ...style } },
      items.map((it) => {
        const on = it === value;
        return e('button', { key: it, onClick: () => onChange && onChange(it), className: 'ps-press', style: {
          flex: 1, padding: '11px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14,
          background: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--on-dark)' : 'var(--ink-2)',
          transition: 'background .15s, color .15s' } }, it);
      }));

  /* ---------- Button ---------- */
  const Btn = ({ variant = 'primary', block, sm, icon, iconRight, children, style, ...rest }) =>
    e('button', { className:
      `ps-btn ps-btn--${variant}${block ? ' ps-btn--block' : ''}${sm ? ' ps-btn--sm' : ''}`,
      style, ...rest },
      icon && I(icon, { size: sm ? 18 : 20 }), children,
      iconRight && I(iconRight, { size: sm ? 18 : 20 }));

  /* ---------- Speaker / audio button ---------- */
  const SpeakerBtn = ({ reg = 'kirja', playing, onClick, size = 42 }) => {
    const isK = reg === 'kirja';
    const col = isK ? 'var(--written)' : 'var(--spoken)';
    return e('button', { onClick, className: 'ps-press', 'aria-label': 'Play audio', style: {
      width: size, height: size, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
      background: playing ? col : '#fff', color: playing ? '#fff' : col,
      boxShadow: 'var(--sh-1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background .15s, color .15s' } }, I('play', { size: size * 0.42 }));
  };

  /* ---------- Sentence (flags register-difference tokens) ---------- */
  const Sentence = ({ tokens, font, weight, size, color, ls = '-0.02em' }) =>
    e('span', { style: { fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15,
      color, letterSpacing: ls } },
      tokens.map((tk, i) => e(React.Fragment, { key: i },
        tk.hot ? e('span', { className: 'ps-hot' }, tk.t) : tk.t,
        i < tokens.length - 1 ? ' ' : '')));

  /* ---------- RegDot — register signpost ---------- */
  const RegDot = ({ reg }) => {
    const isK = reg === 'kirja';
    return e('span', { className: 'ps-label', style: { display: 'inline-flex', alignItems: 'center', gap: 7,
      color: isK ? 'var(--written)' : 'var(--spoken)' } },
      e('span', { style: { width: 7, height: 7, borderRadius: '50%',
        background: isK ? 'var(--written)' : 'var(--spoken)' } }),
      isK ? 'Kirjakieli' : 'Puhekieli');
  };

  /* =========================================================================
     RegisterCard — THE core pattern, glass re-skin.
     Written (violet) on a frosted card; spoken (rose) on a blush inset band;
     joined by a connector; changed tokens flagged magenta on both lines.
     ========================================================================= */
  const RegisterCard = ({ kirja, puhe, gloss, onPlay, playing, compact, badge, glass, style }) => {
    const pad = compact ? 18 : 22;
    return e('div', { className: glass ? 'ps-glass' : 'ps-card', style: {
      padding: pad, overflow: 'hidden', position: 'relative', borderRadius: 'var(--r-xl)', ...style } },
      gloss && e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 } },
        e('span', { className: 'ps-caption', style: { fontStyle: 'italic', color: 'var(--ink-2)' } }, gloss),
        badge && e('span', { className: 'ps-chip ps-chip--glass', style: { fontSize: 11, padding: '5px 11px' } }, badge)),

      e('div', { style: { display: 'flex', gap: 14 } },
        // connector rail
        e('div', { style: { width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5 } },
          e('span', { style: { width: 11, height: 11, borderRadius: '50%', background: 'var(--written)' } }),
          e('span', { style: { flex: 1, width: 2, background: 'repeating-linear-gradient(var(--glass-edge) 0 4px, transparent 4px 9px)',
            margin: '4px 0', minHeight: compact ? 20 : 30 } }),
          e('span', { style: { width: 11, height: 11, borderRadius: '50%', background: 'var(--spoken)' } })),

        e('div', { style: { flex: 1, minWidth: 0 } },
          // kirjakieli
          e('div', { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 } },
            e('div', null, e(RegDot, { reg: 'kirja' }),
              e('div', { style: { marginTop: 9 } },
                e(Sentence, { tokens: kirja, font: 'var(--font-display)', weight: 600, size: compact ? 20 : 23, color: 'var(--ink)' }))),
            onPlay && e(SpeakerBtn, { reg: 'kirja', playing: playing === 'kirja', onClick: () => onPlay('kirja') })),
          e('div', { style: { height: compact ? 13 : 16 } }),
          // puhekieli — blush band
          e('div', { style: { background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)',
            borderRadius: 'var(--r-md)', padding: compact ? '12px 13px' : '14px 15px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 } },
            e('div', null, e(RegDot, { reg: 'puhe' }),
              e('div', { style: { marginTop: 9 } },
                e(Sentence, { tokens: puhe, font: 'var(--font-body)', weight: 600, size: compact ? 18 : 21, color: 'var(--ink)' }))),
            onPlay && e(SpeakerBtn, { reg: 'puhe', playing: playing === 'puhe', onClick: () => onPlay('puhe') })))));
  };

  /* ---------- Progress bar ---------- */
  const Bar = ({ value, color = 'var(--written)', track = 'var(--glass-deep)', h = 9, style }) =>
    e('div', { style: { height: h, borderRadius: 999, background: track, overflow: 'hidden', ...style } },
      e('div', { style: { width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: 999,
        background: color, transition: 'width .5s cubic-bezier(.2,.7,.3,1)' } }));

  /* ---------- Counter ring ---------- */
  const Ring = ({ value, max, size = 124, stroke = 11, color = 'var(--written)', track = 'rgba(255,255,255,.4)', children }) => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, value / max));
    return e('div', { style: { width: size, height: size, position: 'relative', flexShrink: 0 } },
      e('svg', { width: size, height: size, style: { transform: 'rotate(-90deg)' } },
        e('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', stroke: track, strokeWidth: stroke }),
        e('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', stroke: color, strokeWidth: stroke,
          strokeLinecap: 'round', strokeDasharray: c, strokeDashoffset: c * (1 - pct),
          style: { transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' } })),
      e('div', { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center' } }, children));
  };

  /* ---------- Step segments ---------- */
  const Steps = ({ total, current, color = 'var(--ink)' }) =>
    e('div', { style: { display: 'flex', gap: 6 } },
      Array.from({ length: total }).map((_, i) =>
        e('span', { key: i, style: { height: 6, flex: i === current ? 2.4 : 1, borderRadius: 999,
          background: i <= current ? color : 'var(--glass-deep)', transition: 'all .3s ease' } })));

  window.PS = Object.assign(window.PS || {}, {
    e, I, icons, Label, Orb, OrbCluster, IconBtn, Tabs, Btn, SpeakerBtn,
    Sentence, RegDot, RegisterCard, Bar, Ring, Steps,
  });
})();
