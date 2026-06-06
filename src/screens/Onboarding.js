import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { OrbCluster } from '../components/primitives';
import { Label } from '../components/primitives';
import { RegisterCard } from '../components/RegisterCard';
import { Btn, IconBtn, Steps } from '../components/ui';
import { PuhuMark, ScreenScroll } from '../components/Shell';
const steps = [
    {
        key: 'welcome',
        render: () => (_jsx("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center' }, children: _jsx(OrbCluster, { size: 220 }) }), _jsxs("div", { children: [_jsx(Label, { color: "var(--written)", children: "Tervetuloa \u00B7 Welcome" }), _jsxs("h1", { className: "ps-display", style: { margin: '14px 0 0', fontSize: 42 }, children: ["Puhu niin kuin ", _jsx("span", { style: { color: 'var(--written)' }, children: "t\u00E4\u00E4ll\u00E4" }), " puhutaan"] }), _jsx("p", { className: "ps-body-l", style: { color: 'var(--ink-2)', marginTop: 14, maxWidth: 300 }, children: "Finnish as it is really spoken \u2014 for your new life in Finland. Two registers, one habit a day." })] })] }) })),
    },
    {
        key: 'register',
        render: () => (_jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { marginTop: 4 }, children: [_jsx(Label, { color: "var(--written)", children: "Miksi kaksi \u00B7 Why two" }), _jsx("h2", { className: "ps-title-1", style: { margin: '12px 0 0' }, children: "Books teach one Finnish. The street speaks another." })] }), _jsx("p", { className: "ps-body", style: { color: 'var(--ink-2)', marginTop: 12 }, children: "Every card pairs the written form (kirjakieli) with how people actually say it (puhekieli). The azure marks what changes." }), _jsx("div", { style: { marginTop: 20 }, children: _jsx(RegisterCard, { glass: true, gloss: "I am at home", kirja: [{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }], puhe: [{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }] }) }), _jsx("div", { style: { flex: 1 } })] })),
    },
    {
        key: 'dayone',
        render: () => (_jsx("div", { style: { flex: 1, display: 'flex', flexDirection: 'column' }, children: _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: 30 }, children: _jsx(OrbCluster, { size: 200 }) }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx(Label, { color: "var(--written)", style: { display: 'block' }, children: "Day One Sprint" }), _jsx("h2", { className: "ps-title-1", style: { margin: '12px 0 0' }, children: "150 words. One sitting." }), _jsx("p", { className: "ps-body", style: { color: 'var(--ink-2)', marginTop: 12, maxWidth: 290, marginInline: 'auto' }, children: "A fast first wave of recognition \u2014 mnemonic, then a quick check. No typing. You only do this once." })] }), _jsx("div", { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }, children: ['Recognise', 'No typing', 'One sitting'].map((t) => (_jsx("span", { className: "ps-chip ps-chip--glass", children: t }, t))) })] }) })),
    },
];
export function Onboarding({ go }) {
    const [i, setI] = useState(0);
    const last = i === steps.length - 1;
    return (_jsxs(ScreenScroll, { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, children: [_jsx(PuhuMark, { size: 19 }), _jsx("button", { onClick: () => go('dayone'), className: "ps-press", style: {
                            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)',
                            fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
                        }, children: "Ohita" })] }), _jsx("div", { style: { marginBottom: 22 }, children: _jsx(Steps, { total: steps.length, current: i }) }), steps[i].render(), _jsxs("div", { style: { marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }, children: [i > 0 && _jsx(IconBtn, { icon: "arrowL", tone: "glass", size: 54, onClick: () => setI(i - 1) }), _jsx(Btn, { variant: "primary", block: true, iconRight: last ? undefined : 'arrow', icon: last ? 'sparkle' : undefined, onClick: () => last ? go('dayone') : setI(i + 1), children: last ? 'Aloita Day One' : 'Jatka' })] })] }));
}
