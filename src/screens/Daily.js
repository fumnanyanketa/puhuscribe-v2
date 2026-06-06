import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { OrbCluster, Label } from '../components/primitives';
import { RegisterCard } from '../components/RegisterCard';
import { Btn, Bar, Steps } from '../components/ui';
import { I } from '../components/icons';
import { ScreenScroll } from '../components/Shell';
const PHRASES = [
    { gloss: 'I am at home',
        kirja: [{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }],
        puhe: [{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }] },
    { gloss: 'Do you want to come along?',
        kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
        puhe: [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }] },
    { gloss: 'He / she goes to the shop',
        kirja: [{ t: 'Hän', hot: true }, { t: 'menee' }, { t: 'kauppaan' }],
        puhe: [{ t: 'Se', hot: true }, { t: 'menee' }, { t: 'kauppaan' }] },
    { gloss: 'Are you hungry?',
        kirja: [{ t: 'Onko', hot: true }, { t: 'sinulla', hot: true }, { t: 'nälkä?' }],
        puhe: [{ t: 'Onks', hot: true }, { t: 'sulla', hot: true }, { t: 'nälkä?' }] },
];
export function Daily({ go }) {
    const [i, setI] = useState(0);
    const [playing, setPlaying] = useState(null);
    const [mastered, setMastered] = useState(843);
    const [done, setDone] = useState(false);
    const p = PHRASES[i];
    const play = (reg) => { setPlaying(reg); setTimeout(() => setPlaying(null), 1100); };
    const advance = (got) => {
        if (got)
            setMastered((m) => m + 1);
        if (i < PHRASES.length - 1)
            setI(i + 1);
        else
            setDone(true);
    };
    if (done)
        return (_jsx(ScreenScroll, { bottom: 110, children: _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
                    alignItems: 'center', textAlign: 'center', gap: 24 }, children: [_jsx(OrbCluster, { size: 190 }), _jsxs("div", { children: [_jsx(Label, { color: "var(--written)", style: { display: 'block', marginBottom: 10 }, children: "Sessio valmis" }), _jsx("h2", { className: "ps-title-1", children: "Hyv\u00E4\u00E4 ty\u00F6t\u00E4." }), _jsxs("p", { className: "ps-body", style: { color: 'var(--ink-2)', marginTop: 10 }, children: [PHRASES.length, " phrases reviewed \u00B7 ", mastered - 843, " newly mastered"] })] }), _jsxs("div", { className: "ps-glass", style: { padding: '18px 24px', display: 'flex', gap: 28 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }, children: mastered }), _jsx("div", { className: "ps-caption", style: { marginTop: 4 }, children: "mastered" })] }), _jsx("div", { style: { width: 1, background: 'var(--glass-edge)' } }), _jsxs("div", { children: [_jsx("div", { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, lineHeight: 1, color: 'var(--spoken)', letterSpacing: '-0.03em' }, children: "12" }), _jsx("div", { className: "ps-caption", style: { marginTop: 4 }, children: "day streak" })] })] }), _jsxs("div", { style: { display: 'flex', gap: 10 }, children: [_jsx(Btn, { variant: "light", onClick: () => go('island'), children: "Kielisaari" }), _jsx(Btn, { variant: "primary", icon: "chart", onClick: () => go('progress'), children: "Edistyminen" })] })] }) }));
    return (_jsxs(ScreenScroll, { bottom: 110, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx(Label, { color: "var(--written)", children: "Huomenta \u00B7 Tiistai" }), _jsx("h1", { className: "ps-title-1", style: { marginTop: 8 }, children: "P\u00E4iv\u00E4n sessio" })] }), _jsxs("div", { className: "ps-glass", style: { padding: '10px 15px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 999 }, children: [_jsx("span", { style: { color: 'var(--spoken)' }, children: _jsx(I, { name: "flame", size: 18 }) }), _jsx("span", { className: "ps-num", style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }, children: "12" })] })] }), _jsxs("div", { className: "ps-glass", style: { padding: 16, marginTop: 16 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 }, children: [_jsx("span", { className: "ps-caption", children: "Phrases mastered" }), _jsx("span", { className: "ps-num", style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }, children: mastered })] }), _jsx(Bar, { value: (mastered / 1200) * 100, color: "var(--written)" })] }), _jsxs("div", { style: { marginTop: 20, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx(Steps, { total: PHRASES.length, current: i }), _jsxs("span", { className: "ps-label", style: { color: 'var(--ink-2)', flexShrink: 0 }, children: [i + 1, "/", PHRASES.length] })] }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsx(RegisterCard, { glass: true, onPlay: play, playing: playing, gloss: p.gloss, kirja: p.kirja, puhe: p.puhe, badge: "Arki \u00B7 daily" }, i), _jsxs("div", { className: "ps-caption", style: { textAlign: 'center', marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }, children: [_jsx(I, { name: "speaker", size: 15 }), " Tap a register to hear it"] }), _jsx("div", { style: { flex: 1, minHeight: 16 } }), _jsxs("div", { style: { display: 'flex', gap: 10 }, children: [_jsx(Btn, { variant: "light", style: { flex: 1 }, onClick: () => advance(false), children: "Viel\u00E4 harjoittelen" }), _jsx(Btn, { variant: "primary", icon: "check", style: { flex: 1.2 }, onClick: () => advance(true), children: "Osaan" })] })] })] }));
}
