import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Orb, OrbCluster, Label } from '../components/primitives';
import { Btn, IconBtn } from '../components/ui';
import { I } from '../components/icons';
import { ScreenScroll } from '../components/Shell';
const WORDS = [
    { fi: 'kahvi', en: 'coffee', ipa: 'KAH-vee', bridge: 'A "cuppa" at the café — kah-vee.', orb: ['var(--orb-magenta)', 'var(--orb-pink)'], puhe: null },
    { fi: 'koti', en: 'home', ipa: 'KOH-ti', bridge: 'Cosy "koti" — your home.', orb: ['var(--orb-violet)', 'var(--orb-magenta)'], puhe: null },
    { fi: 'ruoka', en: 'food', ipa: 'RUO-ka', bridge: 'You "roar-ka" when hungry for food.', orb: ['var(--orb-deep)', 'var(--orb-violet)'], puhe: null },
    { fi: 'kauppa', en: 'shop', ipa: 'KOWP-pa', bridge: '"Cow-pa" pops to the shop.', orb: ['var(--orb-pink)', '#7FC6D8'], puhe: null },
    { fi: 'terve', en: 'hi / hello', ipa: 'TER-veh', bridge: 'Wave and say "ter-veh".', orb: ['var(--orb-magenta)', 'var(--orb-violet)'], puhe: null },
];
export function DayOne({ go }) {
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState('card');
    const [picked, setPicked] = useState(null);
    const [mastered, setMastered] = useState(34);
    const w = WORDS[idx % WORDS.length];
    const wave = Math.min(8, Math.floor(mastered / 19) + 1);
    const options = useMemo(() => {
        const others = WORDS.filter((x) => x.fi !== w.fi).slice(0, 3).map((x) => x.en);
        return [w.en, ...others].sort((a, b) => ((a.length + idx) % 3) - ((b.length + idx) % 3));
    }, [idx, w.fi, w.en]);
    const next = () => { setMastered((m) => m + 1); setPicked(null); setPhase('card'); setIdx((x) => x + 1); };
    return (_jsx("div", { style: { position: 'absolute', inset: 0 }, children: _jsxs(ScreenScroll, { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx(IconBtn, { icon: "close", tone: "glass", size: 40, onClick: () => go('daily') }), _jsx(Label, { color: "var(--written)", children: `Day One · Aalto ${wave} / 8` }), _jsxs("span", { className: "ps-label ps-num", style: { color: 'var(--ink)' }, children: [mastered, "/150"] })] }), _jsx("div", { style: { marginTop: 12, height: 7, borderRadius: 999, background: 'var(--glass-deep)', overflow: 'hidden' }, children: _jsx("div", { style: {
                            width: `${(mastered / 150) * 100}%`, height: '100%', borderRadius: 999,
                            background: 'linear-gradient(90deg, var(--written), var(--spoken))',
                            transition: 'width .5s',
                        } }) }), phase === 'card' ? (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', marginTop: 22 }, children: [_jsxs("div", { className: "ps-glass", style: { padding: 0, overflow: 'hidden', flexShrink: 0, borderRadius: 'var(--r-2xl)' }, children: [_jsxs("div", { style: {
                                        height: 188, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'radial-gradient(120% 90% at 70% 20%, rgba(255,255,255,.5), transparent), var(--lav-tint)',
                                    }, children: [_jsx("div", { style: { position: 'absolute', top: 14, left: 16 }, children: _jsx(Label, { color: "var(--written)", children: "Muistikuva \u00B7 mnemonic" }) }), _jsx(OrbCluster, { size: 150 }), _jsx("div", { style: { position: 'absolute', bottom: 12, right: 16 }, className: "ps-caption", children: "[ 3D render ]" })] }), _jsxs("div", { style: { padding: 22 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }, children: [_jsx("div", { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 44, lineHeight: 1, letterSpacing: '-0.04em' }, children: w.fi }), _jsx("span", { className: "ps-label ps-num", style: { color: 'var(--ink-3)' }, children: w.ipa })] }), _jsxs("div", { className: "ps-body-l", style: { marginTop: 8, color: 'var(--ink-2)' }, children: ["\"", w.en, "\""] }), _jsxs("div", { style: {
                                                marginTop: 16, padding: '13px 15px', background: 'var(--flag-bg)', borderRadius: 'var(--r-md)',
                                                display: 'flex', gap: 10, alignItems: 'flex-start',
                                            }, children: [_jsx("span", { style: { color: 'var(--flag)', flexShrink: 0, marginTop: 1 }, children: _jsx(I, { name: "sparkle", size: 18 }) }), _jsx("span", { className: "ps-body", style: { color: 'var(--ink)' }, children: w.bridge })] }), _jsxs("div", { style: {
                                                marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                                                paddingTop: 16, borderTop: '1px solid var(--glass-edge)',
                                            }, children: [_jsx("span", { className: "ps-label", style: { color: 'var(--written)' }, children: "Kirja" }), _jsx("span", { style: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }, children: w.fi }), _jsx("span", { style: { color: 'var(--ink-3)' }, children: _jsx(I, { name: "arrow", size: 15 }) }), _jsx("span", { className: "ps-label", style: { color: 'var(--spoken)' }, children: "Puhe" }), _jsx("span", { style: { fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15 }, children: w.puhe || w.fi }), !w.puhe && _jsx("span", { className: "ps-caption", children: "\u00B7 sama" })] })] })] }), _jsx("div", { style: { flex: 1, minHeight: 14 } }), _jsx(Btn, { variant: "primary", block: true, iconRight: "arrow", onClick: () => setPhase('quiz'), children: "Testaa minua" })] }, 'card' + idx)) : (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', marginTop: 22 }, children: [_jsxs("div", { style: { textAlign: 'center', marginTop: 10 }, children: [_jsx(Label, { color: "var(--ink-3)", children: "Tunnista \u00B7 Recognise" }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', margin: '18px 0 8px' }, children: _jsx(Orb, { size: 76, from: w.orb[0], to: w.orb[1] }) }), _jsx("div", { style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 46, lineHeight: 1.05, letterSpacing: '-0.04em' }, children: w.fi }), _jsx("div", { className: "ps-caption", style: { marginTop: 6 }, children: "Mit\u00E4 t\u00E4m\u00E4 tarkoittaa?" })] }), _jsx("div", { style: { flex: 1 } }), _jsx("div", { style: { display: 'grid', gap: 10 }, children: options.map((opt) => {
                                const correct = opt === w.en, chosen = picked === opt;
                                let bg = 'var(--glass-2)', bd = 'var(--glass-line)', col = 'var(--ink)';
                                if (picked) {
                                    if (correct) {
                                        bg = 'rgba(107,70,193,.12)';
                                        bd = 'var(--written)';
                                        col = 'var(--written)';
                                    }
                                    else if (chosen) {
                                        bg = 'var(--flag-bg)';
                                        bd = 'var(--flag)';
                                        col = 'var(--flag)';
                                    }
                                }
                                return (_jsxs("button", { disabled: !!picked, onClick: () => setPicked(opt), className: "ps-press", style: {
                                        textAlign: 'left', padding: '16px 20px', borderRadius: 'var(--r-md)',
                                        cursor: picked ? 'default' : 'pointer', border: `1.5px solid ${bd}`,
                                        background: bg, color: col, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }, children: [opt, picked && correct && _jsx(I, { name: "check", size: 20 }), picked && chosen && !correct && _jsx(I, { name: "close", size: 20 })] }, opt));
                            }) }), _jsx("div", { style: { marginTop: 14, minHeight: 54 }, children: picked && (_jsx(Btn, { variant: picked === w.en ? 'accent' : 'primary', block: true, iconRight: "arrow", onClick: next, children: picked === w.en ? 'Hienoa — jatka' : 'Jatka' })) })] }, 'quiz' + idx))] }) }));
}
