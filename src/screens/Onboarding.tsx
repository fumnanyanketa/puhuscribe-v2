import { useState, ReactNode } from 'react'
import { OrbCluster, Label } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { Btn, IconBtn, Steps } from '../components/ui'
import { I } from '../components/icons'
import { Journey } from '../components/Journey'
import { PuhuMark, ScreenScroll, AppScreen } from '../components/Shell'
import { useLang, Bi } from '../lib/lang/useLang'
import { useProgress } from '../lib/data/progress'

type Step = { key: string; render: (bi: Bi) => ReactNode }

const METHOD = [
  { icon: 'sparkle', fi: 'Tapaa sanat', en: 'Meet words', desc: 'Recognise the most useful Finnish words. See it, hear it, tap the meaning.' },
  { icon: 'cards',   fi: 'Kertaa',      en: 'Review',     desc: 'Spaced repetition brings each word back right before you would forget it.' },
  { icon: 'island',  fi: 'Puhu',        en: 'Speak',      desc: 'Say real sentences out loud, for the situations you will actually face.' },
]

const steps: Step[] = [
  {
    key: 'welcome',
    render: (bi) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <OrbCluster size={210} />
          </div>
          <div>
            <Label color="var(--written)">{bi('Tervetuloa', 'Welcome')}</Label>
            <h1 className="ps-display" style={{ margin: '14px 0 0', fontSize: 42 }}>
              Speak the Finnish Finland <span style={{ color: 'var(--written)' }}>actually</span> speaks
            </h1>
            <p className="ps-body-l" style={{ color: 'var(--ink-2)', marginTop: 14, maxWidth: 320 }}>
              Finnish for your new life here. The textbook language and the spoken street language, taught together from day one.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'register',
    render: (bi) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 4 }}>
          <Label color="var(--written)">{bi('Miksi kaksi', 'Why two')}</Label>
          <h2 className="ps-title-1" style={{ margin: '12px 0 0' }}>
            Books teach one Finnish. The street speaks another.
          </h2>
        </div>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>
          Every phrase comes taught twice: the written <b style={{ color: 'var(--written)' }}>kirjakieli</b> and the spoken <b style={{ color: 'var(--spoken)' }}>puhekieli</b>. The azure marks what changes.
        </p>
        <div style={{ marginTop: 20 }}>
          <RegisterCard
            glass
            gloss="I am at home"
            kirja={[{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }]}
            puhe={[{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }]}
          />
        </div>
        <div style={{ flex: 1 }} />
      </div>
    ),
  },
  {
    key: 'method',
    render: (bi) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 4 }}>
          <Label color="var(--written)">{bi('Miten', 'How it works')}</Label>
          <h2 className="ps-title-1" style={{ margin: '12px 0 0' }}>A method that sticks.</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
            Built on how people actually learn a language, not on what feels busy.
          </p>
        </div>
        <div style={{ marginTop: 22, display: 'grid', gap: 14 }}>
          {METHOD.map((m) => (
            <div key={m.en} className="ps-glass" style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: 'var(--written-bg)',
                color: 'var(--written)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I name={m.icon} size={22} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{bi(m.fi, m.en)}</div>
                <div className="ps-caption" style={{ marginTop: 4 }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }} />
      </div>
    ),
  },
  {
    key: 'journey',
    render: (bi) => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 4 }}>
          <Label color="var(--written)">{bi('Polkusi', 'Your path')}</Label>
          <h2 className="ps-title-1" style={{ margin: '12px 0 0' }}>From your first words to YKI.</h2>
          <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10 }}>
            About 30 minutes a day. B1 for citizenship, B2 for work, over months not weeks. You will always see where you are.
          </p>
        </div>
        <div className="ps-card" style={{ marginTop: 18, padding: 18 }}>
          <Journey bankSize={0} />
        </div>
        <div style={{ flex: 1 }} />
      </div>
    ),
  },
]

export function Onboarding({ go }: { go: (s: AppScreen) => void }) {
  const { bi } = useLang()
  const { markOnboarded } = useProgress()
  const [i, setI] = useState(0)
  const last = i === steps.length - 1

  // Leaving onboarding (Skip or Start) records it as seen, so returning users
  // are routed straight to the sprint / daily review next time.
  const enterSprint = () => { markOnboarded(); go('dayone') }

  return (
    <ScreenScroll>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <PuhuMark size={19} />
        <button onClick={enterSprint} className="ps-press" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
        }}>
          {bi('Ohita', 'Skip')}
        </button>
      </div>
      <div style={{ marginBottom: 22 }}>
        <Steps total={steps.length} current={i} />
      </div>
      {steps[i].render(bi)}
      <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        {i > 0 && <IconBtn icon="arrowL" tone="glass" size={54} onClick={() => setI(i - 1)} />}
        <Btn
          variant="primary" block
          iconRight={last ? undefined : 'arrow'}
          icon={last ? 'sparkle' : undefined}
          onClick={() => last ? enterSprint() : setI(i + 1)}
        >
          {last ? bi('Aloita', 'Start learning') : bi('Jatka', 'Continue')}
        </Btn>
      </div>
    </ScreenScroll>
  )
}
