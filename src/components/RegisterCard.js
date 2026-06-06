import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RegDot, Sentence } from './primitives';
import { SpeakerBtn } from './ui';
export function RegisterCard({ kirja, puhe, gloss, badge, compact = false, glass = false, onPlay, playing, style }) {
    const pad = compact ? 18 : 22;
    return (_jsxs("div", { className: glass ? 'ps-glass' : 'ps-card', style: { padding: pad, overflow: 'hidden', position: 'relative', borderRadius: 'var(--r-xl)', ...style }, children: [gloss && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }, children: [_jsx("span", { className: "ps-caption", style: { fontStyle: 'italic', color: 'var(--ink-2)' }, children: gloss }), badge && _jsx("span", { className: "ps-chip ps-chip--glass", style: { fontSize: 11, padding: '5px 11px' }, children: badge })] })), _jsxs("div", { style: { display: 'flex', gap: 14 }, children: [_jsxs("div", { style: { width: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5 }, children: [_jsx("span", { style: { width: 11, height: 11, borderRadius: '50%', background: 'var(--written)', flexShrink: 0 } }), _jsx("span", { style: {
                                    flex: 1, width: 2,
                                    background: 'repeating-linear-gradient(var(--glass-edge) 0 4px, transparent 4px 9px)',
                                    margin: '4px 0', minHeight: compact ? 20 : 30,
                                } }), _jsx("span", { style: { width: 11, height: 11, borderRadius: '50%', background: 'var(--spoken)', flexShrink: 0 } })] }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, children: [_jsxs("div", { children: [_jsx(RegDot, { reg: "kirja" }), _jsx("div", { style: { marginTop: 9 }, children: _jsx(Sentence, { tokens: kirja, font: "var(--font-display)", weight: 600, size: compact ? 20 : 23, color: "var(--ink)" }) })] }), onPlay && _jsx(SpeakerBtn, { reg: "kirja", playing: playing === 'kirja', onClick: () => onPlay('kirja') })] }), _jsx("div", { style: { height: compact ? 13 : 16 } }), _jsxs("div", { style: {
                                    background: 'var(--spoken-bg)', border: '1px solid var(--spoken-line)',
                                    borderRadius: 'var(--r-md)', padding: compact ? '12px 13px' : '14px 15px',
                                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                                }, children: [_jsxs("div", { children: [_jsx(RegDot, { reg: "puhe" }), _jsx("div", { style: { marginTop: 9 }, children: _jsx(Sentence, { tokens: puhe, font: "var(--font-body)", weight: 600, size: compact ? 18 : 21, color: "var(--ink)" }) })] }), onPlay && _jsx(SpeakerBtn, { reg: "puhe", playing: playing === 'puhe', onClick: () => onPlay('puhe') })] })] })] })] }));
}
