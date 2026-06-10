import { useState, useRef, useEffect } from 'react'
import { BrandMark } from '../components/primitives'
import { Bar } from '../components/ui'
import { I } from '../components/icons'
import { RegisterCard } from '../components/RegisterCard'
import { CTA, ExBar, CenterLabel, Counter, StackLabel, Waveform } from '../components/kit'
import { ScreenScroll } from '../components/Shell'
import { StatePane } from '../components/StatePane'
import { useAsync } from '../lib/data/useAsync'
import { useLang } from '../lib/lang/useLang'
import { fetchIslandSentences, RegisterSentence, ShadowLine } from '../lib/data/content'
import { bumpPracticeCount } from '../lib/practiceStats'
import { speak } from '../lib/tts'
import { useStudyClock } from '../lib/studyTime'

/* ---------------------------------------------------------------------------
 * Speaking practice — hear the native (kirjakieli) audio, say it aloud,
 * record yourself, compare. Reused by the Sentence Bank sets (phrases prop).
 * ------------------------------------------------------------------------- */

type RecState = 'idle' | 'recording' | 'review'

const MIME_CANDIDATES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
function pickMime(): string | undefined {
  for (const t of MIME_CANDIDATES) {
    try { if (MediaRecorder.isTypeSupported(t)) return t } catch { /* ignore */ }
  }
  return undefined
}

export function Speak({ onBack, phrases, title, resumeKey }: {
  onBack: () => void; phrases?: ShadowLine[]; title?: string; resumeKey?: string
}) {
  // When sentences are passed in (a personal set), practice those; otherwise
  // fall back to fetching the curated "first useful sentences".
  if (phrases) {
    if (phrases.length === 0) return <StatePane title="No sentences yet" detail="Add a sentence to this set first." bottom={110} />
    return <SpeakPractice phrases={phrases} onBack={onBack} title={title} resumeKey={resumeKey} />
  }
  return <SpeakFetch onBack={onBack} />
}

// Per-set shadow position, persisted to localStorage so a set (e.g. the starter
// pack) resumes where the learner left off instead of restarting at sentence 1.
function readShadowPos(key: string, len: number): number {
  try {
    const n = parseInt(localStorage.getItem(key) ?? '', 10)
    return Number.isFinite(n) && n > 0 && n < len ? n : 0
  } catch { return 0 }
}

function SpeakFetch({ onBack }: { onBack: () => void }) {
  const { bi } = useLang()
  const { data: phrases, loading, error } = useAsync<RegisterSentence[]>(
    () => fetchIslandSentences(10),
    [],
  )

  if (loading) return <StatePane title={bi('Ladataan…', 'Loading')} bottom={110} />
  if (error) return <StatePane tone="error" title="Couldn't load speaking practice" detail={error} bottom={110} />
  if (!phrases || phrases.length === 0) return <StatePane title={bi('Ei lauseita vielä', 'No sentences yet')} detail="No sentences available yet." bottom={110} />

  return <SpeakPractice phrases={phrases} onBack={onBack} />
}

function SpeakPractice({ phrases, onBack, title, resumeKey }: {
  phrases: ShadowLine[]; onBack: () => void; title?: string; resumeKey?: string
}) {
  const { bilingual } = useLang()
  useStudyClock()
  const [i, setI] = useState(() => (resumeKey ? readShadowPos(resumeKey, phrases.length) : 0))
  const [st, setSt] = useState<RecState>('idle')
  const [sec, setSec] = useState(0)
  const [playingNative, setPlayingNative] = useState(false)
  const [playingMine, setPlayingMine] = useState(false)
  const [recUrl, setRecUrl] = useState<string | null>(null)
  const [recErr, setRecErr] = useState('')
  const [done, setDone] = useState(false)

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
        setRecUrl(URL.createObjectURL(blob))
        setSt('review')
      }
      mrRef.current = mr
      mr.start(250) // timeslice keeps data delivery reliable across browsers
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
    setRecUrl(null); setSt('idle'); setSec(0); setRecErr(''); setPlayingMine(false); setPlayingNative(false)
    if (i < phrases.length - 1) setI(i + 1)
    else {
      bumpPracticeCount('speak')
      // Finished — clear the saved position so the set starts fresh next time.
      if (resumeKey) { try { localStorage.removeItem(resumeKey) } catch { /* ignore */ } }
      setDone(true)
    }
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

  // Auto-play the native audio on each new phrase (and on first mount).
  useEffect(() => { playNative() }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  // Remember how far the learner got, per set, so exiting midway resumes here.
  useEffect(() => {
    if (!resumeKey) return
    try { localStorage.setItem(resumeKey, String(i)) } catch { /* storage unavailable */ }
  }, [i, resumeKey])

  if (done) {
    return (
      <ScreenScroll bottom={26}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'center', textAlign: 'center', gap: 24 }}>
          <BrandMark size={140} />
          <div>
            <StackLabel fi="PUHUMINEN VALMIS" en="Speaking complete" color="var(--spoken)" style={{ marginBottom: 10 }} />
            <h2 className="ps-title-1">Hyvää työtä!</h2>
            <p className="ps-body" style={{ color: 'var(--ink-2)', marginTop: 10, maxWidth: 300 }}>
              You said {phrases.length} real sentences out loud. Saying it is what makes it yours.
            </p>
          </div>
          <CTA fi="Valmis" en="Done" iconRight="arrow" variant="spoken" style={{ maxWidth: 320 }} onClick={onBack} />
        </div>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll bottom={26}>
      <ExBar nav="close" onNav={onBack}
        center={<CenterLabel fi={title ? title.toUpperCase() : 'PUHUMINEN'} en={title ? undefined : 'Speaking'} color="var(--spoken)" />}
        right={<Counter a={i + 1} b={phrases.length} />}>
        <Bar value={((i + 1) / phrases.length) * 100} color="var(--spoken)" track="var(--glass-deep)" h={7} />
      </ExBar>

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <StackLabel fi="SANO ÄÄNEEN" en="Say it out loud" />
      </div>

      <div style={{ marginTop: 10 }}>
        <RegisterCard gloss={p.gloss} kirja={p.kirja} puhe={p.puhe}
          onPlay={() => playNative()} playing={playingNative ? 'kirja' : null} compact />
      </div>

      <div style={{ flex: 1, minHeight: 8 }} />

      {/* Always-mounted player for the learner's own recording. */}
      <audio ref={myAudioRef} src={recUrl ?? undefined} onEnded={() => setPlayingMine(false)} />
      {recErr && (
        <div className="ps-body" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--r-md)',
          background: 'var(--flag-bg)', color: 'var(--flag)', marginBottom: 12 }}>{recErr}</div>
      )}

      {st === 'review' ? (
        <div style={{ width: '100%' }}>
          <div className="ps-card" style={{ padding: 16, borderRadius: 'var(--r-lg)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>
              Nauhoitus valmis{' '}
              {bilingual && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 500, fontSize: 12, color: 'var(--ink-3)' }}>Recording done</span>}
            </div>
            <div className="ps-caption" style={{ marginTop: 2 }}>Play yourself back and compare with the native audio.</div>

            <button onClick={playMine} className="ps-press" style={{
              marginTop: 14, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)', border: 'none', cursor: 'pointer',
              background: playingMine ? 'var(--spoken)' : 'var(--spoken-bg)', color: playingMine ? '#fff' : 'var(--spoken)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
            }}>
              <I name="play" size={20} /> Kuuntele oma puheesi
            </button>

            <button onClick={playNative} className="ps-press" style={{
              marginTop: 10, width: '100%', padding: '14px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
              background: '#fff', color: 'var(--ink)', border: '1px solid var(--glass-line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
            }}>
              <I name="volume" size={20} /> Kuuntele malli
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <CTA fi="Uudelleen" en="Again" icon="mic" variant="light" flex="1" onClick={reRecord} />
            <CTA fi="Seuraava" en="Next" iconRight="arrow" variant="spoken" flex="1.2" onClick={nextPhrase} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Waveform color="var(--spoken)" n={30} active={st === 'recording' ? 0.9 : playingNative ? 0.55 : 0.3} h={32} />
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13.5,
            color: st === 'recording' ? 'var(--spoken)' : 'var(--ink-3)', margin: 0 }}>
            {st === 'recording'
              ? <span className="ps-num">● {sec.toFixed(1)}s</span>
              : <>Kuuntele, sano perässä, nauhoita{bilingual && <span> · Listen, repeat, record</span>}</>}
          </p>
          <CTA
            fi={st === 'recording' ? 'Lopeta' : 'Nauhoita'}
            en={st === 'recording' ? 'Tap to stop' : 'Tap to record yourself'}
            icon="mic" variant="spoken" onClick={toggleRecord} />
        </div>
      )}
    </ScreenScroll>
  )
}
