import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { I } from './icons';
export function Btn({ variant = 'primary', block = false, sm = false, icon, iconRight, children, style, onClick, disabled }) {
    const cls = `ps-btn ps-btn--${variant}${block ? ' ps-btn--block' : ''}${sm ? ' ps-btn--sm' : ''}`;
    const sz = sm ? 18 : 20;
    return (_jsxs("button", { className: cls, style: style, onClick: onClick, disabled: disabled, children: [icon && _jsx(I, { name: icon, size: sz }), children, iconRight && _jsx(I, { name: iconRight, size: sz })] }));
}
export function IconBtn({ icon, onClick, size = 44, tone = 'glass', style, label }) {
    const tones = {
        glass: { background: 'var(--glass-3)', color: 'var(--ink)', border: '1px solid var(--glass-line)' },
        ink: { background: 'var(--ink)', color: 'var(--on-dark)', border: 'none' },
        solid: { background: '#fff', color: 'var(--ink)', border: 'none' },
    };
    return (_jsx("button", { onClick: onClick, "aria-label": label || icon, className: "ps-press", style: {
            width: size, height: size, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--sh-1)', ...tones[tone], ...style,
        }, children: _jsx(I, { name: icon, size: size * 0.42 }) }));
}
/* ---------- Speaker / audio button ---------- */
export function SpeakerBtn({ reg = 'kirja', playing = false, onClick, size = 42 }) {
    const color = reg === 'kirja' ? 'var(--written)' : 'var(--spoken)';
    return (_jsx("button", { onClick: onClick, className: "ps-press", "aria-label": "Play audio", style: {
            width: size, height: size, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
            background: playing ? color : '#fff', color: playing ? '#fff' : color,
            boxShadow: 'var(--sh-1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .15s, color .15s',
        }, children: _jsx(I, { name: "play", size: size * 0.42 }) }));
}
/* ---------- Progress bar ---------- */
export function Bar({ value, color = 'var(--written)', track = 'var(--glass-deep)', h = 9, style }) {
    return (_jsx("div", { style: { height: h, borderRadius: 999, background: track, overflow: 'hidden', ...style }, children: _jsx("div", { style: {
                width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: 999,
                background: color, transition: 'width .5s cubic-bezier(.2,.7,.3,1)',
            } }) }));
}
/* ---------- Counter ring (SVG circular progress) ---------- */
export function Ring({ value, max, size = 124, stroke = 11, color = 'var(--written)', track = 'rgba(255,255,255,.4)', children }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(1, value / max));
    return (_jsxs("div", { style: { width: size, height: size, position: 'relative', flexShrink: 0 }, children: [_jsxs("svg", { width: size, height: size, style: { transform: 'rotate(-90deg)' }, children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: track, strokeWidth: stroke }), _jsx("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeDasharray: c, strokeDashoffset: c * (1 - pct), style: { transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' } })] }), _jsx("div", { style: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', textAlign: 'center' }, children: children })] }));
}
/* ---------- Step segments ---------- */
export function Steps({ total, current, color = 'var(--ink)' }) {
    return (_jsx("div", { style: { display: 'flex', gap: 6, flex: 1 }, children: Array.from({ length: total }).map((_, i) => (_jsx("span", { style: {
                height: 6, flex: i === current ? 2.4 : 1, borderRadius: 999,
                background: i <= current ? color : 'var(--glass-deep)',
                transition: 'all .3s ease',
            } }, i))) }));
}
