import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Orb } from './primitives';
import { I } from './icons';
/* ---------- Wordmark ---------- */
export function PuhuMark({ size = 20, light = false }) {
    return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 9 }, children: [_jsx(Orb, { size: size * 1.15, from: "var(--orb-magenta)", to: "var(--orb-violet)", dots: true }), _jsxs("span", { style: {
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size,
                    letterSpacing: '-0.03em', color: light ? 'var(--on-dark)' : 'var(--ink)',
                }, children: ["Puhu", _jsx("span", { style: { opacity: 0.55 }, children: "Scribe" })] })] }));
}
/* ---------- Scrollable screen body ---------- */
export function ScreenScroll({ children, pad = 22, bottom = 22, bg = 'var(--bg-grad)', style }) {
    return (_jsx("div", { className: "ps-noscroll", style: {
            position: 'absolute', inset: 0, overflowY: 'auto', background: bg,
            paddingTop: 56, paddingLeft: pad, paddingRight: pad, paddingBottom: bottom,
            display: 'flex', flexDirection: 'column', ...style,
        }, children: children }));
}
/* ---------- Floating frosted pill nav ---------- */
const NAV = [
    { id: 'daily', icon: 'cards' },
    { id: 'island', icon: 'island' },
    { id: 'progress', icon: 'chart' },
];
export function BottomNav({ active, onNav }) {
    return (_jsx("div", { style: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
            paddingBottom: 26, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }, children: _jsx("div", { className: "ps-glass", style: { display: 'flex', gap: 8, padding: 8, borderRadius: 999,
                background: 'var(--glass-2)', boxShadow: 'var(--sh-2)', pointerEvents: 'auto' }, children: NAV.map((t) => {
                const on = active === t.id;
                return (_jsx("button", { onClick: () => onNav(t.id), "aria-label": t.id, className: "ps-press", style: {
                        width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: on ? 'var(--ink)' : 'transparent',
                        color: on ? 'var(--on-dark)' : 'var(--ink-2)',
                        transition: 'background .15s, color .15s',
                    }, children: _jsx(I, { name: t.icon, size: 24, sw: on ? 2 : 1.8 }) }, t.id));
            }) }) }));
}
