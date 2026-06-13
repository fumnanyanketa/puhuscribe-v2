import { useState, ReactNode } from 'react'
import { BrandMark } from '../components/primitives'
import { RegisterCard } from '../components/RegisterCard'
import { CTA, OnbBar, Eyebrow, ChoiceCard } from '../components/kit'
import { I } from '../components/icons'
import { Journey } from '../components/Journey'
import { PuhuMark, ScreenScroll, AppScreen } from '../components/Shell'
import { useProgress } from '../lib/data/progress'

/* ---------------------------------------------------------------------------
 * Onboarding — four teach-the-method slides: Welcome, Two Finnishes, Method,
 * Your path. Skipping or starting both mark onboarding seen and lead into
 * the Day One sprint.
 * ------------------------------------------------------------------------- */

const METHOD = [
  { icon: 'sparkle', fi: 'Tapaa sanat', en: 'Meet words', desc: 'Recognise the most useful Finnish words. See it, hear it, tap the meaning.' },
  { icon: 'review',  fi: 'Kertaa',      en: 'Review',     desc: 'Spaced repetition brings each word back right before you would forget it.' },
  { icon: 'sprout',  fi: 'Puhu',        en: 'Speak',      desc: 'Say real sentences out loud, for the situations you will actually face.' },
]

// First-language options (the larger immigrant-language groups in Finland) +
// Other. Stored to gather evidence for which UI languages to build next.
const LANGS = ['English', 'Russian', 'Estonian', 'Arabic', 'Ukrainian', 'Somali', 'Persian', 'Other']

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Back" className="ps-press" style={{
      width: 62, minHeight: 62, borderRadius: 999, border: '1px solid var(--glass-line)', background: '#fff',
      color: 'var(--ink)', boxShadow: 'var(--sh-1)', cursor: 'pointer', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <I name="arrowL" size={24} sw={2} />
    </button>
  )
}

export function Onboarding({ go }: { go: (s: AppScreen) => void }) {
  const { markOnboarded, setFirstLanguage } = useProgress()
  const [i, setI] = useState(0)
  const [lang, setLang] = useState<string | null>(null)

  // Leaving onboarding (Skip or Start) records it as seen; new users go
  // straight into the Day One sprint. The chosen first language (if any) is
  // saved for demand evidence.
  const enterSprint = () => {
    if (lang) setFirstLanguage(lang)
    markOnboarded()
    go('dayone')
  }

  const steps: { key: string; body: ReactNode; cta: ReactNode }[] = [
    {
      key: 'welcome',
      body: (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 2px' }}>
            <BrandMark size={132} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Eyebrow fi="TERVETULOA" en="Welcome" style={{ marginBottom: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25.9, lineHeight: 0.98,
              letterSpacing: '-0.035em', color: 'var(--ink)', margin: 0 }}>
              Speak the Finnish Finland <span style={{ color: 'var(--written)' }}>actually</span> speaks
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 15.8, lineHeight: 1.5,
              color: 'var(--ink-2)', margin: '18px 0 0', textWrap: 'pretty' }}>
              Finnish for your new life here. The textbook language and the spoken street language,
              taught together from day one.
            </p>
          </div>
        </>
      ),
      cta: <CTA fi="Jatka" en="Continue" iconRight="arrow" variant="ink" style={{ marginTop: 16 }} onClick={() => setI(1)} />,
    },
    {
      key: 'register',
      body: (
        <>
          <div style={{ marginTop: 12 }}>
            <Eyebrow fi="MIKSI KAKSI" en="Why two" style={{ marginBottom: 8 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 21.6, lineHeight: 1.0,
              letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>
              Books teach one Finnish. The street speaks another.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.5, lineHeight: 1.4,
              color: 'var(--ink-2)', margin: '8px 0 0', textWrap: 'pretty' }}>
              Each phrase is taught twice. First the written{' '}
              <strong style={{ color: 'var(--written)', fontWeight: 700 }}>kirjakieli</strong>, then the spoken{' '}
              <strong style={{ color: 'var(--spoken)', fontWeight: 700 }}>puhekieli</strong>.
            </p>
          </div>
          <div style={{ marginTop: 12 }}>
            <RegisterCard
              gloss="I am at home"
              kirja={[{ t: 'Minä', hot: true }, { t: 'olen', hot: true }, { t: 'kotona' }]}
              puhe={[{ t: 'Mä', hot: true }, { t: 'oon', hot: true }, { t: 'kotona' }]}
            />
          </div>
          <div style={{ flex: 1, minHeight: 8 }} />
        </>
      ),
      cta: (
        <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'stretch' }}>
          <BackBtn onClick={() => setI(0)} />
          <CTA fi="Jatka" en="Continue" iconRight="arrow" variant="ink" flex="1" onClick={() => setI(2)} />
        </div>
      ),
    },
    {
      key: 'method',
      body: (
        <>
          <div style={{ marginTop: 26 }}>
            <Eyebrow fi="MITEN" en="How it works" style={{ marginBottom: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 25.9, lineHeight: 1.0,
              letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>A method that sticks.</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.9, lineHeight: 1.5,
              color: 'var(--ink-2)', margin: '14px 0 0', textWrap: 'pretty' }}>
              Built on how people actually learn a language, not on what feels busy.
            </p>
          </div>
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {METHOD.map((m) => (
              <ChoiceCard key={m.en} align="top" icon={m.icon}
                iconColor="var(--written)" iconBg="var(--written-bg)"
                title={m.fi} en={m.en} desc={m.desc} />
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 16 }} />
        </>
      ),
      cta: (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <BackBtn onClick={() => setI(1)} />
          <CTA fi="Jatka" en="Continue" iconRight="arrow" variant="ink" flex="1" onClick={() => setI(3)} />
        </div>
      ),
    },
    {
      key: 'journey',
      body: (
        <>
          <div style={{ marginTop: 22 }}>
            <Eyebrow fi="POLKUSI" en="Your path" style={{ marginBottom: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24.5, lineHeight: 1.0,
              letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>From your first words to YKI.</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.9, lineHeight: 1.5,
              color: 'var(--ink-2)', margin: '14px 0 0', textWrap: 'pretty' }}>
              Just 10 minutes a day. B1 for citizenship, B2 for work, over months not weeks.
              You will always see where you are.
            </p>
          </div>
          <div className="ps-card" style={{ marginTop: 20, padding: 18, borderRadius: 'var(--r-xl)' }}>
            <Journey words={0} sentences={0} />
          </div>
        </>
      ),
      cta: (
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <BackBtn onClick={() => setI(2)} />
          <CTA fi="Jatka" en="Continue" iconRight="arrow" variant="ink" flex="1" onClick={() => setI(4)} />
        </div>
      ),
    },
    {
      key: 'language',
      body: (
        <>
          <div style={{ marginTop: 22 }}>
            <Eyebrow fi="KIELESI" en="Your language" style={{ marginBottom: 12 }} />
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24.5, lineHeight: 1.0,
              letterSpacing: '-0.03em', color: 'var(--ink)', margin: 0 }}>What is your first language?</h1>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14.9, lineHeight: 1.5,
              color: 'var(--ink-2)', margin: '14px 0 0', textWrap: 'pretty' }}>
              PuhuScribe teaches in English today. Tell us your language so we know who we are helping
              and what to build next. Optional.
            </p>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {LANGS.map((l) => {
              const on = lang === l
              return (
                <button key={l} onClick={() => setLang(on ? null : l)} className="ps-press" style={{
                  padding: '15px 14px', borderRadius: 'var(--r-lg)', cursor: 'pointer', textAlign: 'left',
                  border: on ? '1.5px solid var(--written)' : '1px solid var(--glass-line)',
                  background: on ? 'var(--written-bg)' : '#fff', boxShadow: on ? 'none' : 'var(--sh-1)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.3,
                  color: on ? 'var(--written)' : 'var(--ink)',
                }}>
                  {l}
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1, minHeight: 16 }} />
        </>
      ),
      cta: (
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <BackBtn onClick={() => setI(3)} />
          <CTA fi="Aloita" en="Start learning" icon="sparkle" variant="ink" flex="1" onClick={enterSprint} />
        </div>
      ),
    },
  ]

  const step = steps[i]

  return (
    <ScreenScroll>
      <OnbBar step={i} total={steps.length} onSkip={enterSprint} mark={<PuhuMark size={20} />} />
      {step.body}
      {step.cta}
    </ScreenScroll>
  )
}
