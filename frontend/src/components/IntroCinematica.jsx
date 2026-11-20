import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { cancelSpeech, setVoiceMuted, speakAsMoros, speakAsNoni } from '../lib/voiceEngine'
import PixiCinematicStage from './PixiCinematicStage'

const DIALOGUE = [
  { speaker: 'NONI · ALERTA TÁCTICA', line: 'Detecto una anomalía sobre el campus. Aspirante, mantén la calma: voy contigo.', voice: speakAsNoni },
  { speaker: 'MOROS · SEÑOR DEL DOMINIO', line: 'Este campus caerá. Tu futuro ya tiene dueño: yo.', voice: speakAsMoros },
  { speaker: 'NONI · CONTRAATAQUE', line: 'Guardianes, ¡contraataque! Juntos podemos romper su dominio.', voice: speakAsNoni },
]

const ACTS = [
  { start: 0, end: 5.5, title: 'ALERTA EN IZTAPALAPA', kicker: 'SEÑAL ANÓMALA · CAMPUS TECNM' },
  { start: 5.5, end: 11.5, title: 'EL DOMINIO DE MOROS', kicker: 'AMENAZA NIVEL JEFE' },
  { start: 11.5, end: 17.5, title: 'LOS GUARDIANES RESPONDEN', kicker: 'SEIS RUTAS · UN MISMO EQUIPO' },
  { start: 17.5, end: 21.5, title: 'EDUNEXA: DOMINIO MOROS', kicker: 'TU HISTORIA COMIENZA AHORA' },
]

function createIntroAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  try {
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = 0.13
    master.connect(context.destination)
    let muted = false
    let closed = false
    const tone = (frequency, duration, type = 'triangle', delay = 0, volume = 0.35) => {
      if (muted || closed || !Number.isFinite(frequency)) return
      if (context.state === 'suspended') context.resume().catch(() => {})
      const start = context.currentTime + delay
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.linearRampToValueAtTime(volume, start + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(gain); gain.connect(master)
      oscillator.start(start); oscillator.stop(start + duration + 0.02)
    }
    const cue = (scene) => {
      const notes = scene === 1 ? [82, 62, 46] : scene === 2 ? [392, 523, 659] : scene === 3 ? [110, 165, 220, 330] : [262, 392, 523]
      notes.forEach((note, index) => tone(note, scene === 1 ? 0.72 : 0.22, scene === 1 ? 'sawtooth' : 'square', index * 0.09, scene === 1 ? 0.48 : 0.2))
    }
    return {
      cue,
      toggleMute() { muted = !muted; master.gain.setTargetAtTime(muted ? 0 : 0.13, context.currentTime, 0.035); return muted },
      close() { if (closed) return; closed = true; context.close().catch(() => {}) },
    }
  } catch { return null }
}

export default function IntroCinematica({ onComplete }) {
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)
  const completedRef = useRef(false)
  const actIndex = ACTS.findIndex((act) => elapsed >= act.start && elapsed < act.end)
  const scene = actIndex < 0 ? ACTS.length - 1 : actIndex
  const activeDialogue = DIALOGUE[scene] || null

  const finishIntro = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    cancelSpeech()
    audioRef.current?.close()
    audioRef.current = null
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    const audio = createIntroAudio()
    audioRef.current = audio
    const startedAt = performance.now()
    let lastScene = -1
    let lastVisualUpdate = -1
    let frame = 0
    const tick = (now) => {
      const seconds = (now - startedAt) / 1000
      const nextScene = Math.min(ACTS.length - 1, ACTS.findIndex((act) => seconds >= act.start && seconds < act.end) < 0 ? ACTS.length - 1 : ACTS.findIndex((act) => seconds >= act.start && seconds < act.end))
      if (lastVisualUpdate < 0 || seconds - lastVisualUpdate >= 0.1) { lastVisualUpdate = seconds; setElapsed(seconds) }
      if (nextScene !== lastScene) {
        lastScene = nextScene
        cancelSpeech()
        if (nextScene < DIALOGUE.length) DIALOGUE[nextScene].voice(DIALOGUE[nextScene].line)
        audio?.cue(nextScene)
      }
      if (seconds >= ACTS[ACTS.length - 1].end) { finishIntro(); return }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      cancelSpeech()
      audio?.close()
      if (audioRef.current === audio) audioRef.current = null
    }
  }, [finishIntro])

  const toggleMute = () => {
    const next = audioRef.current?.toggleMute() ?? !muted
    setMuted(next)
    setVoiceMuted(next)
  }

  const act = ACTS[scene]
  return (
    <main className={`arcade-intro anime-opening scene-${scene + 1}`} aria-label="Opening cinematográfico de EDUNEXA">
      <PixiCinematicStage scene={scene} elapsed={elapsed} />

      <button className="anime-skip" type="button" onClick={finishIntro}>SALTAR INTRO <span aria-hidden="true">&gt;&gt;</span></button>
      <button className="anime-audio" type="button" onClick={toggleMute} aria-label={muted ? 'Activar audio' : 'Silenciar audio'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}<span>{muted ? 'AUDIO OFF' : 'SONIDO 16-BIT'}</span></button>

      <section key={scene} className={`anime-act anime-act-${scene + 1}`} data-scene={scene + 1} aria-live="polite">
        <header className="anime-act-heading"><span>{act.kicker}</span><h1>{act.title}</h1></header>

        {scene === 0 && <div className="anime-campus-label">TECNOLÓGICO NACIONAL DE MÉXICO <b>·</b> IZTAPALAPA</div>}
        {scene === 1 && <div className="anime-boss-name">MOROS <span>· JEFE FINAL</span></div>}
        {scene === 3 && <div className="anime-title-emblem"><span>EDUNEXA PRESENTA</span><strong>DOMINIO <b>MOROS</b></strong><small>ELIGE TU RUTA · CAMBIA TU FUTURO</small></div>}
      </section>

      {activeDialogue && <aside className={`anime-dialogue ${scene === 1 ? 'is-moros' : ''}`} aria-live="assertive">
        <div><small>{activeDialogue.speaker}</small><p>{activeDialogue.line}</p></div>
      </aside>}

      <div className="anime-timeline" aria-label={`Escena ${scene + 1} de 4`}><span>{String(scene + 1).padStart(2, '0')}</span><div>{ACTS.map((item, index) => <i key={item.start} className={index <= scene ? 'is-active' : ''} />)}</div><span>04</span></div>
    </main>
  )
}
