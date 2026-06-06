import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { OrbCluster, Label, RegDot, Sentence } from '../components/primitives';
import { Btn, SpeakerBtn, IconBtn } from '../components/ui';
import { I } from '../components/icons';
import { ScreenScroll } from '../components/Shell';
const ISLAND = {
    gloss: 'Do you want to come along?',
    kirja: [{ t: 'Haluatko', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
    puhe: [{ t: 'Haluuks', hot: true }, { t: 'sä', hot: true }, { t: 'tulla' }, { t: 'mukaan?' }],
};
function Wave({ active, color }) {
    return (_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: 3, height: 40, flex: 1 }, children: Array.from({ length: 22 }).map((_, idx) => {
            const base = 6 + Math.abs(Math.sin(idx * 0.9)) * 28;
            return (_jsx("span", { style: {
                    width: 3, borderRadius: 2,
                    height: active ? base : 6 + (idx % 3) * 4,
                    background: color, opacity: active ? 1 : 0.4,
                    transition: 'height .25s ease', transitionDelay: (idx * 18) + 'ms',
                } }, idx));
        }) }));
}
export function Island({ go }) {
    const [st, setSt] = useState('idle');
    const [sec, setSec] = useState(0);
    const timer = useRef(null);
    const playNative = () => {
        setSt('playing');
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => setSt('idle'), 1400);
    };
    const toggleRecord = () => {
        if (st === 'recording') {
            if (timer.current)
                clearInterval(timer.current);
            setSt('review');
            return;
        }
        setSt('recording');
        setSec(0);
        timer.current = setInterval(() => setSec((s) => +(s + 0.1).toFixed(1)), 100);
    };
    useEffect(() => () => {
        if (timer.current) {
            clearTimeout(timer.current);
            clearInterval(timer.current);
        }
    }, []);
    return (_jsxs("div", { style: { position: 'absolute', inset: 0, background: 'var(--bg-grad)' }, children: [_jsxs("div", { style: { position: 'absolute', top: 0, left: 0, right: 0, height: 230, overflow: 'hidden',
                    background: 'linear-gradient(160deg, #6E4BC0, #4E2A86)' }, children: [_jsx(OrbCluster, { size: 230, style: { position: 'absolute', right: -34, top: -20, opacity: 0.95 } }), _jsx("div", { style: { position: 'absolute', left: -40, bottom: -50, width: 160, height: 160,
                            borderRadius: '50%', border: '2px solid rgba(255,255,255,.18)' } })] }), _jsxs(ScreenScroll, { bg: "transparent", bottom: 110, children: [_jsxs("div", { style: { color: 'var(--on-dark)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx(IconBtn, { icon: "arrowL", tone: "solid", size: 44, onClick: () => go('daily') }), _jsxs("span", { className: "ps-chip", style: {
                                            background: 'rgba(15,14,32,.36)', color: '#fff',
                                            border: '1px solid rgba(255,255,255,.28)', backdropFilter: 'blur(6px)',
                                        }, children: [_jsx(I, { name: "island", size: 15 }), " Saari 3 / 8"] })] }), _jsxs("div", { style: { marginTop: 22 }, children: [_jsx(Label, { color: "rgba(255,255,255,.75)", children: "Varjostus \u00B7 Shadowing" }), _jsx("h1", { className: "ps-title-1", style: { color: 'var(--on-dark)', marginTop: 10 }, children: "Toista \u00E4\u00E4neen" })] })] }), _jsx("div", { style: { height: 26 } }), _jsxs("div", { className: "ps-card", style: { padding: 20, borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-3)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid var(--glass-edge)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { className: "ps-caption", children: "You are shadowing" }), _jsx("span", { className: "ps-label", style: { color: 'var(--written)', background: 'var(--written-bg)', padding: '5px 10px', borderRadius: 7 }, children: "Kirjakieli" })] }), _jsx("span", { className: "ps-caption", style: { fontStyle: 'italic' }, children: ISLAND.gloss })] }), _jsxs("div", { children: [_jsx(RegDot, { reg: "kirja" }), _jsx("div", { style: { marginTop: 9 }, children: _jsx(Sentence, { tokens: ISLAND.kirja, font: "var(--font-display)", weight: 600, size: 26, color: "var(--ink)" }) })] }), _jsxs("div", { style: { marginTop: 14, padding: '12px 14px', background: 'var(--spoken-bg)',
                                    border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)', opacity: 0.92 }, children: [_jsx(RegDot, { reg: "puhe" }), _jsx("div", { style: { marginTop: 8 }, children: _jsx(Sentence, { tokens: ISLAND.puhe, font: "var(--font-body)", weight: 600, size: 18, color: "var(--ink-2)" }) })] }), _jsxs("div", { style: { marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx(SpeakerBtn, { reg: "kirja", playing: st === 'playing', onClick: playNative, size: 48 }), _jsx(Wave, { active: st === 'playing', color: "var(--written)" }), _jsx("span", { className: "ps-caption ps-num", style: { marginLeft: 'auto' }, children: "0:03" })] })] }), _jsx("div", { style: { flex: 1, minHeight: 18 } }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }, children: st === 'review' ? (_jsxs("div", { style: { width: '100%' }, children: [_jsxs("div", { className: "ps-glass", style: { padding: 16, display: 'flex', alignItems: 'center', gap: 14,
                                        background: 'var(--written-bg)', border: '1px solid var(--written)' }, children: [_jsx("span", { style: { color: 'var(--written)' }, children: _jsx(I, { name: "check", size: 26 }) }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 15, color: 'var(--written)' }, children: "Hyv\u00E4 \u00E4\u00E4nt\u00E4mys" }), _jsx("div", { className: "ps-caption", style: { marginTop: 2 }, children: "Close match to the native clip" })] }), _jsx(SpeakerBtn, { reg: "puhe", size: 42 })] }), _jsxs("div", { style: { display: 'flex', gap: 10, marginTop: 14 }, children: [_jsx(Btn, { variant: "light", icon: "mic", style: { flex: 1 }, onClick: () => setSt('idle'), children: "Uudelleen" }), _jsx(Btn, { variant: "primary", iconRight: "arrow", style: { flex: 1.2 }, onClick: () => setSt('idle'), children: "Seuraava" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: toggleRecord, className: "ps-press", "aria-label": "Record", style: {
                                        width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                        background: st === 'recording' ? 'var(--spoken)' : 'var(--ink)', color: '#fff',
                                        boxShadow: st === 'recording' ? '0 0 0 8px var(--spoken-bg), var(--sh-2)' : 'var(--sh-2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background .15s, box-shadow .15s',
                                    }, children: st === 'recording'
                                        ? _jsx("span", { style: { width: 24, height: 24, borderRadius: 7, background: 'currentColor' } })
                                        : _jsx(I, { name: "mic", size: 32, sw: 1.9 }) }), _jsx("span", { className: "ps-caption ps-num", style: {
                                        color: st === 'recording' ? 'var(--spoken)' : 'var(--ink-2)', fontWeight: 600,
                                    }, children: st === 'recording' ? `● Nauhoitetaan ${sec.toFixed(1)}s, tap to stop` : 'Tap to repeat the written form' })] })) })] })] }));
}
