import { useState, useRef, useEffect } from 'react'
import { OrbCluster, Label, RegDot, Sentence } from '../components/primitives'
import { Btn, SpeakerBtn, IconBtn } from '../components/ui'
import { I } from '../components/icons'
import { ScreenScroll } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useLang } from '../lib/lang/useLang'
import { fetchIslandSentences, RegisterSentence, ShadowLine } from '../lib/data/content'
import { speak } from '../lib/tts'

type RecState = 'idle' | 'recording' | 'review'

const MIME_CANDIDATES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
function pickMime(): string | undefined {
  for (const t of MIME_CANDIDATES) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch { /* ignore */ }
  }
  return undefined
}

function Wave({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40, flex: 1 }}>
      {Array.from({ length: 22 }).map((_, idx) => {
        const base = 6 + Math.abs(Math.sin(idx * 0.9)) * 28
        return (
          <span key={idx} style={{
            width: 3, borderRadius: 2,
            height: active ? base : 6 + (idx % 3) * 4,
            background: color, opacity: active ? 1 : 0.4,
            transition: 'height .25s ease', transitionDelay: (idx * 18) + 'ms',
          }} />
        )
      })}
    </div>
  )
}

export function Speak({ onBack, phrases, title }: { onBack: () => void; phrases?: ShadowLine[]; title?: string }) {
  // When sentences are passed in (a personal island), shadow those; otherwise
  // fall back to fetching the curated "first useful sentences" set.
  if (phrases) {
    if (phrases.length === 0) return <StatePane title="No sentences yet" detail="Add a sentence to this island first." bottom={110} />
    return <SpeakPractice phrases={phrases} onBack={onBack} title={title} />
  }
  return <SpeakFetch onBack={onBack} />
}

function SpeakFetch({ onBack }: { onBack: () => void }) {
  const { bi } = useLang()
  // The curated "first useful sentences" set (falls back to general sentences).
  const { data: phrases, loading, error } = useAsync<RegisterSentence[]>(
    () => fetchIslandSentences(12),
    [],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load speaking practice" detail={error} bottom={110} />
  if (!phrases || phrases.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={110} />

  return <SpeakPractice phrases={phrases} onBack={onBack} />
}

function SpeakPractice({ phrases, onBack, title }: { phrases: ShadowLine[]; onBack: () => void; title?: string }) {
  const { bi } = useLang()
  const [i, setI] = useState(0)
  const [st, setSt] = useState<RecState>('idle')
  const [sec, setSec] = useState(0)
  const [playingNative, setPlayingNative] = useState(false)
  const [playingMine, setPlayingMine] = useState(false)
  const [recUrl, setRecUrl] = useState<string | null>(null)
  const [recErr, setRecErr] = useState('')

  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const myAudioRef = useRef<HTMLAudioElement | null>(null)

  const p = phrases[i]

  const playNative = () => {
    setPlayingNative(true)
    speak(p.kirja.map((t) => t.t).join(' '))
    setTimeout(() => setPlayingNative(false), 1400)
  }

  const startRecording = async () => {
    setRecErr('')
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setRecErr('Recording is not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        if (chunksRef.current.length === 0) {
          setRecErr('That recording was empty. Tap record, say the sentence, then stop.')
          setSt('idle')
          return
        }
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0].type || mime || 'audio/webm' })
        setRecUrl(URL.createObjectURL(blob)) // previous url revoked by the effect below
        setSt('review')
      }
      mrRef.current = mr
      mr.start(250) // timeslice → reliable data delivery across browsers (esp. iOS)
      setSt('recording'); setSec(0)
      timerRef.current = setInterval(() => setSec((s) => +(s + 0.1).toFixed(1)), 100)
    } catch {
      setRecErr('Microphone access is needed to record. Allow it in your browser, then try again.')
      setSt('idle')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    try { mrRef.current?.stop() } catch { /* already stopped */ }
  }

  const toggleRecord = () => {
    if (st === 'recording') stopRecording()
    else void startRecording()
  }

  const playMine = () => {
    const el = myAudioRef.current
    if (!el || !recUrl) return
    setRecErr('')
    try { el.pause(); el.currentTime = 0 } catch { /* not seekable yet */ }
    setPlayingMine(true)
    void el.play().catch(() => { setPlayingMine(false); setRecErr('Could not play the recording on this device.') })
  }

  const reRecord = () => { setRecUrl(null); setSt('idle'); setSec(0); setRecErr(''); setPlayingMine(false) }

  const nextPhrase = () => {
    setRecUrl(null)
    setI((x) => (x + 1) % phrases.length)
    setSt('idle'); setSec(0); setRecErr(''); setPlayingMine(false); setPlayingNative(false)
  }

  // Revoke the previous recording's object URL when it changes / on unmount.
  useEffect(() => {
    if (!recUrl) return
    return () => URL.revokeObjectURL(recUrl)
  }, [recUrl])

  // Stop the mic + timer on unmount.
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  // Auto-play the native (kirjakieli) audio when the phrase changes (and on
  // first mount), so the learner hears the model without tapping the speaker.
  useEffect(() => { playNative() }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-grad)' }}>
      {/* Hero band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 258, overflow: 'hidden',
        background: 'linear-gradient(160deg, #6E4BC0, #4E2A86)' }}>
        <OrbCluster size={230} style={{ position: 'absolute', right: -34, top: -20, opacity: 0.95 }} />
        <div style={{ position: 'absolute', left: -40, bottom: -50, width: 160, height: 160,
          borderRadius: '50%', border: '2px solid rgba(255,255,255,.18)' }} />
      </div>

      <ScreenScroll bg="transparent" bottom={110}>
        {/* Hero content */}
        <div style={{ color: 'var(--on-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconBtn icon="arrowL" tone="solid" size={44} onClick={onBack} />
            <span className="ps-chip" style={{
              background: 'rgba(15,14,32,.36)', color: '#fff',
              border: '1px solid rgba(255,255,255,.28)', backdropFilter: 'blur(6px)',
            }}>
              <I name="island" size={15} /> {bi('Lause', 'Sentence')} {i + 1} / {phrases.length}
            </span>
          </div>
          <div style={{ marginTop: 22 }}>
            <Label color="rgba(255,255,255,.75)">{bi('Puhuharjoitus', 'Speaking practice')}</Label>
            <h1 className="ps-title-1" style={{ color: 'var(--on-dark)', marginTop: 10 }}>{title ? title : bi('Toista ääneen', 'Say it aloud')}</h1>
          </div>
        </div>

        <div style={{ height: 50 }} />

        {/* Practice card */}
        <div className="ps-card" style={{ padding: 20, borderRadius: 'var(--r-2xl)', boxShadow: 'var(--sh-3)' }}>
          <div style={{ paddingBottom: 14, marginBottom: 16, borderBottom: '1px solid var(--glass-edge)' }}>
            <div className="ps-caption" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <I name="speaker" size={14} /> {bi('Kuuntele, sitten sano ääneen', 'Listen, then say it aloud')}
            </div>
            <div style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--ink-2)', fontFamily: 'var(--font-body)', fontSize: 15 }}>“{p.gloss}”</div>
          </div>

          <div>
            <RegDot reg="kirja" />
            <div style={{ marginTop: 9 }}>
              <Sentence tokens={p.kirja} font="var(--font-display)" weight={600} size={26} color="var(--ink)" />
            </div>
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--spoken-bg)',
            border: '1px solid var(--spoken-line)', borderRadius: 'var(--r-md)' }}>
            <RegDot reg="puhe" />
            <div style={{ marginTop: 8 }}>
              <Sentence tokens={p.puhe} font="var(--font-body)" weight={600} size={18} color="var(--ink)" />
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
            <SpeakerBtn reg="kirja" playing={playingNative} onClick={playNative} size={48} />
            <Wave active={playingNative} color="var(--written)" />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 18 }} />

        {/* Record / playback control */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {/* Always-mounted element that plays the learner's own recording back —
              a stable ref means playback keeps working across phrases. */}
          <audio ref={myAudioRef} src={recUrl ?? undefined} onEnded={() => setPlayingMine(false)} />
          {recErr && (
            <div className="ps-body" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'var(--flag-bg)', color: 'var(--flag)' }}>{recErr}</div>
          )}

          {st === 'review' ? (
            <div style={{ width: '100%' }}>
              <div className="ps-glass" style={{ padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{bi('Nauhoitus valmis', 'Recording done')}</div>
                <div className="ps-caption" style={{ marginTop: 2 }}>Play yourself back and compare with the native audio. (Pronunciation scoring comes later.)</div>

                <button onClick={playMine} className="ps-press" style={{
                  marginTop: 14, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
                  background: playingMine ? 'var(--spoken)' : 'var(--spoken-bg)', color: playingMine ? '#fff' : 'var(--spoken)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
                }}>
                  <I name="play" size={20} /> {bi('Kuuntele oma puheesi', 'Play your recording')}
                </button>

                <button onClick={playNative} className="ps-press" style={{
                  marginTop: 10, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  background: '#fff', color: 'var(--ink)', border: '1px solid var(--glass-line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
                }}>
                  <I name="speaker" size={20} /> {bi('Kuuntele malli', 'Hear the native audio')}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <Btn variant="light" icon="mic" style={{ flex: 1 }} onClick={reRecord}>{bi('Uudelleen', 'Again')}</Btn>
                <Btn variant="primary" iconRight="arrow" style={{ flex: 1.2 }} onClick={nextPhrase}>{bi('Seuraava', 'Next')}</Btn>
              </div>
            </div>
          ) : (
            <>
              <button onClick={toggleRecord} className="ps-press" aria-label="Record" style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: st === 'recording' ? 'var(--spoken)' : 'var(--ink)', color: '#fff',
                boxShadow: st === 'recording' ? '0 0 0 8px var(--spoken-bg), var(--sh-2)' : 'var(--sh-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .15s, box-shadow .15s',
              }}>
                {st === 'recording'
                  ? <span style={{ width: 24, height: 24, borderRadius: 7, background: 'currentColor' }} />
                  : <I name="mic" size={32} sw={1.9} />}
              </button>
              <span className="ps-caption ps-num" style={{
                color: st === 'recording' ? 'var(--spoken)' : 'var(--ink-2)', fontWeight: 600,
              }}>
                {st === 'recording'
                  ? <>● {sec.toFixed(1)}s · {bi('lopeta', 'tap to stop')}</>
                  : bi('Nauhoita itsesi', 'Tap to record yourself')}
              </span>
            </>
          )}
        </div>
      </ScreenScroll>
    </div>
  )
}
