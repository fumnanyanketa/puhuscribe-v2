import { useState } from 'react'
import { OrbCluster } from '../components/primitives'
import { Label } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { Btn, IconBtn, Steps } from '../components/ui'
import { PuhuMark, ScreenScroll, AppScreen } from '../components/Shell'

const steps = [
  {
    key: 'welcome',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <OrbCluster size={220} />
          </div>
          <div>
            <Label color="var(--written)">Tervetuloa · Welcome</Label>
            <h1 className="ps-display" style={{ margin: '14px 0 0', fontSize: 42 }}>
              Puhu niin kuin <span style={{ color: 'var(--written)' }}>täällä</span> puhutaan
            </h1>
            <p className="ps-body-l" style={{ color: 'var(--ink-2)', marginTop: 14, maxWidth: 300 }}>
              Finnish as it is really spoken, for your new life in Finland. Two registers, one habit a day.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    key: 'register',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginTop: 4 }}>
          <Label color="var(--written)">Miksi kaksi · Why two</Label>
          <h2 className="ps-title-1" style={{ margin: '12px 0 0' }}>
            Books teach one Finnish. The street speaks another.
          </h2>
        </div>
        <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12 }}>
          Every card pairs the written form (kirjakieli) with how people actually say it (puhekieli). The azure marks what changes.
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
    key: 'dayone',
    render: () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 30 }}>
            <OrbCluster size={200} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Label color="var(--written)" style={{ display: 'block' }}>Day One Sprint</Label>
            <h2 className="ps-title-1" style={{ margin: '12px 0 0' }}>150 words. One sitting.</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 12, maxWidth: 290, marginInline: 'auto' }}>
              A fast first wave of recognition: mnemonic, then a quick check. No typing. You only do this once.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 26, flexWrap: 'wrap' }}>
            {['Recognise', 'No typing', 'One sitting'].map((t) => (
              <span key={t} className="ps-chip ps-chip--glass">{t}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
]

export function Onboarding({ go }: { go: (s: AppScreen) => void }) {
  const [i, setI] = useState(0)
  const last = i === steps.length - 1

  return (
    <ScreenScroll>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <PuhuMark size={19} />
        <button onClick={() => go('dayone')} className="ps-press" style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-2)',
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13.5,
        }}>
          Ohita
        </button>
      </div>
      <div style={{ marginBottom: 22 }}>
        <Steps total={steps.length} current={i} />
      </div>
      {steps[i].render()}
      <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        {i > 0 && <IconBtn icon="arrowL" tone="glass" size={54} onClick={() => setI(i - 1)} />}
        <Btn
          variant="primary" block
          iconRight={last ? undefined : 'arrow'}
          icon={last ? 'sparkle' : undefined}
          onClick={() => last ? go('dayone') : setI(i + 1)}
        >
          {last ? 'Aloita Day One' : 'Jatka'}
        </Btn>
      </div>
    </ScreenScroll>
  )
}
