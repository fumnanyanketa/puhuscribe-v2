import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import './styles/tokens.css';
import { BottomNav } from './components/Shell';
import { Onboarding } from './screens/Onboarding';
import { DayOne } from './screens/DayOne';
import { Daily } from './screens/Daily';
import { Island } from './screens/Island';
import { Progress } from './screens/Progress';
const APP_SCREENS = ['daily', 'island', 'progress'];
export default function App() {
    const [screen, setScreen] = useState('onboarding');
    const go = (s) => setScreen(s);
    const screens = {
        onboarding: _jsx(Onboarding, { go: go }),
        dayone: _jsx(DayOne, { go: go }),
        daily: _jsx(Daily, { go: go }),
        island: _jsx(Island, { go: go }),
        progress: _jsx(Progress, { go: go }),
    };
    const showNav = APP_SCREENS.includes(screen);
    return (_jsxs("div", { className: "ps-app-frame", children: [screens[screen], showNav && _jsx(BottomNav, { active: screen, onNav: go })] }));
}
