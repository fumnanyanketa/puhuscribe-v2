import { useEffect, useRef, useState } from 'react'
import { I } from '../components/icons'
import { BrandMark } from '../components/primitives'
import { SpeakerBtn } from '../components/ui'
import { ExBar, CenterLabel, FieldInput, StackLabel } from '../components/kit'
import { AppScreen } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAuth } from '../lib/auth/useAuth'
import { useLang } from '../lib/lang/useLang'
import { fetchProgressStats } from '../lib/data/stats'
import { levelForBank } from '../lib/data/content'
import { converse, speak, ChatTurn } from '../lib/tts'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Converse — the FLOW stage (Stage 4 of the framework). A short, real
 * conversation IN Finnish with a warm AI tutor. Both rails are live here:
 *  - Rail 1 (comprehensible input): the tutor replies in Finnish, pitched to the
 *    learner's level; tap any reply to hear it or reveal the English.
 *  - Rail 2 (low affective filter): mistakes are welcomed, suggested replies
 *    scaffold the stuck beginner, and nothing blocks the conversation.
 * Conversation is kept in memory only (no DB) — reachable EARLY, after the
 * learner has met even a handful of words.
 * ------------------------------------------------------------------------- */

interface Bubble {
  role: 'user' | 'assistant'
  fi: string
  en?: string // assistant only: English translation, revealed on demand
}

export function Converse({ go, onBack }: { go?: (s: AppScreen) => void; onBack?: () => void }) {
  const { user } = useAuth()
  const { bi, bilingual } = useLang()
  useStudyClock()

  const [level, setLevel] = useState('A1')
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [opening, setOpening] = useState(true)
  const [reveal, setReveal] = useState<Record<number, boolean>>({})
  const [notReady, setNotReady] = useState(false)
  const [err, setErr] = useState('')

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const back = () => (onBack ? onBack() : go?.('home'))

  // Build the message history we send to the worker from the bubbles so far.
  const history = (bs: Bubble[]): ChatTurn[] => bs.map((b) => ({ role: b.role, content: b.fi }))

  // Open the conversation: fetch the learner's level, then ask the tutor to greet.
  useEffect(() => {
    let active = true
    void (async () => {
      let lv = 'A1'
      try {
        if (user) lv = levelForBank((await fetchProgressStats(user.id)).totalCards)
      } catch { /* default A1 */ }
      if (!active) return
      setLevel(lv)
      const r = await converse([], { level: lv })
      if (!active) return
      setOpening(false)
      if (!r.ok) { setNotReady(true); return }
      setBubbles([{ role: 'assistant', fi: r.reply, en: r.en }])
      setSuggestions(r.suggestions)
    })()
    return () => { active = false }
  }, [user])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [bubbles, busy, suggestions])

  const send = async (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setErr('')
    const next: Bubble[] = [...bubbles, { role: 'user', fi: t }]
    setBubbles(next)
    setInput('')
    setSuggestions([])
    setBusy(true)
    const r = await converse(history(next), { level })
    setBusy(false)
    if (!r.ok) {
      setErr(bilingual ? 'Yhteys katkesi. Yritä uudelleen. (Connection hiccup — try again.)' : 'Yhteys katkesi. Yritä uudelleen.')
      return
    }
    setBubbles([...next, { role: 'assistant', fi: r.reply, en: r.en }])
    setSuggestions(r.suggestions)
  }

  if (notReady) {
    return (
      <StatePane tone="error" title={bi('Keskustelu ei ole vielä käytössä', 'Conversation is not switched on yet')}
        detail="The conversation tutor needs the AI worker configured. Please try again shortly."
        bottom={26} />
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-grad)', display: 'flex', flexDirection: 'column',
      paddingTop: 56, paddingLeft: 22, paddingRight: 22 }}>
      <ExBar nav="close" onNav={back} center={<CenterLabel fi="KESKUSTELU" en="Conversation" color="var(--spoken)" />} />

      {/* Gentle, filter-lowering note */}
      <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--spoken-bg)',
        border: '1px solid var(--spoken-line)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--spoken)', flexShrink: 0 }}><I name="chat" size={17} sw={1.9} /></span>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12.8, color: 'var(--ink-2)', lineHeight: 1.35 }}>
          {bi('Puhu suomea niin paljon kuin osaat. Virheet ovat ok.', 'Use as much Finnish as you can — mistakes are completely fine.')}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="ps-noscroll" style={{ flex: 1, overflowY: 'auto', margin: '14px -4px 0', padding: '0 4px' }}>
        {opening && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 16, textAlign: 'center' }}>
            <BrandMark size={96} />
            <p className="ps-body" style={{ color: 'var(--ink-2)' }}>{bi('Puhu aloittaa…', 'Puhu is starting the chat…')}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 6 }}>
          {bubbles.map((b, i) => (
            b.role === 'assistant'
              ? <TutorBubble key={i} fi={b.fi} en={b.en} revealed={!!reveal[i]}
                  onReveal={() => setReveal((r) => ({ ...r, [i]: !r[i] }))} />
              : <UserBubble key={i} fi={b.fi} />
          ))}
          {busy && <TypingBubble />}
        </div>
      </div>

      {err && (
        <div className="ps-body" style={{ margin: '10px 0 0', padding: '10px 14px', borderRadius: 'var(--r-md)',
          background: 'var(--flag-bg)', color: 'var(--flag)', fontSize: 13 }}>{err}</div>
      )}

      {/* Suggested replies — scaffolding for a stuck beginner (Rail 2) */}
      {suggestions.length > 0 && !busy && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0 0' }}>
          {suggestions.map((s, k) => (
            <button key={s + k} onClick={() => void send(s)} className="ps-press" style={{
              padding: '9px 14px', borderRadius: 999, background: '#fff', boxShadow: 'var(--sh-1)',
              border: '1px solid var(--spoken-line)', cursor: 'pointer',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13.5, color: 'var(--spoken)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 0 18px' }}>
        <div style={{ flex: 1 }}>
          <FieldInput value={input} onChange={setInput} disabled={busy || opening}
            placeholder={bilingual ? 'Vastaa suomeksi… (Reply in Finnish)' : 'Vastaa suomeksi…'}
            onEnter={() => void send(input)} style={{ fontSize: 16 }} />
        </div>
        <button onClick={() => void send(input)} aria-label="Send" disabled={busy || opening || !input.trim()}
          className="ps-press" style={{ width: 56, height: 56, flexShrink: 0, borderRadius: '50%', border: 'none',
            cursor: busy || !input.trim() ? 'default' : 'pointer', opacity: busy || !input.trim() ? 0.5 : 1,
            background: 'var(--spoken)', color: '#fff', boxShadow: '0 10px 24px -8px rgba(31,124,142,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I name="arrowUR" size={22} sw={2.2} />
        </button>
      </div>
    </div>
  )
}

function TutorBubble({ fi, en, revealed, onReveal }: {
  fi: string; en?: string; revealed: boolean; onReveal: () => void
}) {
  const { bi } = useLang()
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
      <div className="ps-card" style={{ padding: '13px 15px', borderRadius: '4px 18px 18px 18px',
        background: '#fff', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1.3, color: 'var(--ink)' }}>{fi}</div>
          {revealed && en && (
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 13.5,
              color: 'var(--ink-3)', marginTop: 6 }}>{en}</div>
          )}
        </div>
        <SpeakerBtn reg="kirja" size={38} onClick={() => speak(fi)} />
      </div>
      {en && (
        <button onClick={onReveal} className="ps-press" style={{ marginTop: 5, marginLeft: 6, background: 'none',
          border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
          fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: 'var(--ink-3)' }}>
          <I name="eye" size={14} sw={1.9} />
          {revealed ? bi('Piilota englanti', 'Hide English') : bi('En ymmärrä', "I don't understand")}
        </button>
      )}
    </div>
  )
}

function UserBubble({ fi }: { fi: string }) {
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
      <div style={{ padding: '12px 15px', borderRadius: '18px 4px 18px 18px', background: 'var(--ink)',
        color: 'var(--on-dark)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, lineHeight: 1.3 }}>
        {fi}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ alignSelf: 'flex-start' }}>
      <div className="ps-card" style={{ padding: '14px 16px', borderRadius: '4px 18px 18px 18px', background: '#fff' }}>
        <StackLabel fi="PUHU KIRJOITTAA…" en="Puhu is typing…" color="var(--spoken)" />
      </div>
    </div>
  )
}
