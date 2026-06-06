import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
/* ---------- Label ---------- */
export function Label({ children, color = 'var(--ink-3)', style }) {
    return _jsx("span", { className: "ps-label", style: { color, ...style }, children: children });
}
/* ---------- Glossy speech bubble ---------- */
const BUBBLE = 'M28 10 H72 A20 20 0 0 1 92 30 V50 A20 20 0 0 1 72 70 H44 L24 88 L31 70 H28 A20 20 0 0 1 8 50 V30 A20 20 0 0 1 28 10 Z';
export function Orb({ size = 80, from = 'var(--orb-magenta)', to = 'var(--orb-violet)', dots = false, style }) {
    const uid = useId().replace(/[^a-z0-9]/gi, '');
    const g = 'bg' + uid, h = 'bh' + uid;
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 100 100", "aria-hidden": "true", style: { display: 'block', flexShrink: 0, filter: 'drop-shadow(0 9px 16px rgba(70,40,110,.30))', ...style }, children: [_jsxs("defs", { children: [_jsxs("radialGradient", { id: g, cx: "34%", cy: "26%", r: "88%", children: [_jsx("stop", { offset: "0%", stopColor: to }), _jsx("stop", { offset: "100%", stopColor: from })] }), _jsxs("radialGradient", { id: h, cx: "32%", cy: "22%", r: "42%", children: [_jsx("stop", { offset: "0%", stopColor: "#fff", stopOpacity: 0.72 }), _jsx("stop", { offset: "100%", stopColor: "#fff", stopOpacity: 0 })] })] }), _jsx("path", { d: BUBBLE, fill: `url(#${g})` }), _jsx("path", { d: BUBBLE, fill: `url(#${h})` }), dots && (_jsxs("g", { fill: "#fff", fillOpacity: 0.95, children: [_jsx("circle", { cx: 34, cy: 40, r: 5 }), _jsx("circle", { cx: 50, cy: 40, r: 5 }), _jsx("circle", { cx: 66, cy: 40, r: 5 })] }))] }));
}
/* ---------- Speech-bubble cluster (hero imagery) ---------- */
export function OrbCluster({ size = 180, style }) {
    const s = size;
    return (_jsxs("div", { "aria-hidden": "true", style: { position: 'relative', width: s, height: s, ...style }, children: [_jsx(Orb, { size: s * 0.72, from: "var(--orb-violet)", to: "var(--orb-magenta)", dots: true, style: { position: 'absolute', left: s * 0.02, top: s * 0.20 } }), _jsx(Orb, { size: s * 0.5, from: "var(--orb-magenta)", to: "var(--orb-pink)", style: { position: 'absolute', right: s * 0.0, top: s * 0.0 } }), _jsx(Orb, { size: s * 0.34, from: "var(--orb-deep)", to: "var(--orb-violet)", style: { position: 'absolute', right: s * 0.14, bottom: s * 0.02 } })] }));
}
/* ---------- Register dot + label ---------- */
export function RegDot({ reg }) {
    const isK = reg === 'kirja';
    const color = isK ? 'var(--written)' : 'var(--spoken)';
    return (_jsxs("span", { className: "ps-label", style: { display: 'inline-flex', alignItems: 'center', gap: 7, color }, children: [_jsx("span", { style: { width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 } }), isK ? 'Kirjakieli' : 'Puhekieli'] }));
}
export function Sentence({ tokens, font, weight, size, color, ls = '-0.02em' }) {
    return (_jsx("span", { style: { fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.15, color, letterSpacing: ls }, children: tokens.map((tk, i) => (_jsxs(React.Fragment, { children: [tk.hot ? _jsx("span", { className: "ps-hot", children: tk.t }) : tk.t, i < tokens.length - 1 ? ' ' : ''] }, i))) }));
}
