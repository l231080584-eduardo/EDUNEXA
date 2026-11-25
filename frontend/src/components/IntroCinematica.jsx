import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { playCarPassing, playExplosion, playIntroVoice, playShot, setIntroMuted, setMusicIntensity, startIntroMusic, stopIntroAudio, stopIntroVoice } from '../lib/introAudio'
import PixiCinematicStage from './PixiCinematicStage'

const DIALOGUE = [
  { speaker: 'NINO HERNÁNDEZ · TU GUÍA', line: '¿No sabes qué estudiar? EDUNEXA te ayuda a explorar tus opciones.', voice: null },
  { speaker: 'MOROS · SEÑOR DEL DOMINIO', line: 'Soy la duda que quiere elegir por ti. No le entregues tu futuro.', voice: null },
  { speaker: 'NINO HERNÁNDEZ · CONTRAATAQUE', line: 'Cada héroe representa una carrera. Elige el camino que te mueva.', voice: null },
  { speaker: 'TU MISIÓN', line: 'Elige tu carrera y descubre tu futuro en EDUNEXA.', voice: null },
]

const ACTS = [
  { start: 0, end: 5.5, title: 'NO SABES QUÉ ESTUDIAR', kicker: 'TU FUTURO EMPIEZA EN EL TECNM IZTAPALAPA' },
  { start: 5.5, end: 11.5, title: 'MOROS ES TU DUDA', kicker: 'QUIERE ELEGIR TU FUTURO POR TI' },
  { start: 11.5, end: 17.5, title: 'CADA HÉROE, UNA CARRERA', kicker: 'SEIS CAMINOS PARA DESCUBRIR LO QUE TE MUEVE' },
  { start: 17.5, end: 21.5, title: 'ELIGE TU CAMINO', kicker: 'PELEA POR TU FUTURO' },
]

export default function IntroCinematica({ onComplete }) {
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const completedRef = useRef(false)
  const actIndex = ACTS.findIndex((act) => elapsed >= act.start && elapsed < act.end)
  const scene = actIndex < 0 ? ACTS.length - 1 : actIndex
  const premiseCardVisible = scene === 0 && elapsed < 2.15
  const activeDialogue = premiseCardVisible ? null : DIALOGUE[scene] || null

  const finishIntro = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    stopIntroVoice()
    stopIntroAudio()
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    startIntroMusic()
    setMusicIntensity(0)
    const startedAt = performance.now()
    let lastScene = -1
    let lastVisualUpdate = -1
    let frame = 0
    let nextSound = 0
    const soundCues = [
      [1.2, playCarPassing], [3.9, playCarPassing], [6.8, playExplosion], [9.4, playExplosion],
      [12.1, playShot], [13, playShot], [14.15, playShot], [15.35, playShot], [16.55, playShot],
      [18.05, playShot], [19.15, playShot], [20.2, playShot],
    ]
    const tick = (now) => {
      const seconds = (now - startedAt) / 1000
      const nextScene = Math.min(ACTS.length - 1, ACTS.findIndex((act) => seconds >= act.start && seconds < act.end) < 0 ? ACTS.length - 1 : ACTS.findIndex((act) => seconds >= act.start && seconds < act.end))
      if (lastVisualUpdate < 0 || seconds - lastVisualUpdate >= 0.1) { lastVisualUpdate = seconds; setElapsed(seconds) }
      if (nextScene !== lastScene) {
        lastScene = nextScene
        stopIntroVoice()
        if (DIALOGUE[nextScene]?.voice) playIntroVoice(DIALOGUE[nextScene].voice)
        setMusicIntensity(nextScene)
      }
      while (nextSound < soundCues.length && seconds >= soundCues[nextSound][0]) {
        soundCues[nextSound][1]()
        nextSound += 1
      }
      if (seconds >= ACTS[ACTS.length - 1].end) { finishIntro(); return }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      stopIntroVoice()
      stopIntroAudio()
    }
  }, [finishIntro])

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    setIntroMuted(next)
  }

  const act = ACTS[scene]
  return (
    <main className={`arcade-intro anime-opening scene-${scene + 1}`} aria-label="Opening cinematográfico de EDUNEXA">
      <PixiCinematicStage scene={scene} elapsed={elapsed} />

      <button className="anime-skip" type="button" onClick={finishIntro}>SALTAR INTRO <span aria-hidden="true">&gt;&gt;</span></button>
      <button className="anime-audio" type="button" onClick={toggleMute} aria-label={muted ? 'Activar audio' : 'Silenciar audio'}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}<span>{muted ? 'AUDIO OFF' : 'SONIDO 16-BIT'}</span></button>

      <section key={scene} className={`anime-act anime-act-${scene + 1}`} data-scene={scene + 1} aria-live="polite">
        {scene !== 3 && !(scene === 0 && premiseCardVisible) && <header className="anime-act-heading"><span>{act.kicker}</span><h1>{act.title}</h1></header>}

        {premiseCardVisible && <div className="anime-story-card" role="status" aria-live="polite">
          <span>ANTES DE ELEGIR</span>
          <strong>No sabes qué estudiar.<br />La duda quiere decidir tu futuro por ti.</strong>
        </div>}

        {scene === 0 && <div className="anime-campus-label">TECNOLÓGICO NACIONAL DE MÉXICO <b>·</b> IZTAPALAPA</div>}
        {scene === 1 && <div className="anime-boss-name">MOROS <span>· JEFE FINAL</span></div>}
        {scene === 3 && <div className="anime-title-emblem"><span>EDUNEXA · TU SIGUIENTE MISIÓN</span><strong>ELIGE TU <b>CAMINO</b></strong><small>PELEA POR TU FUTURO · DESCUBRE TU CARRERA</small></div>}
      </section>

      {activeDialogue && <aside className={`anime-dialogue ${scene === 1 ? 'is-moros' : ''}`} aria-live="assertive">
        <div><small>{activeDialogue.speaker}</small><p>{activeDialogue.line}</p></div>
      </aside>}

      <div className="anime-timeline" aria-label={`Escena ${scene + 1} de 4`}><span>{String(scene + 1).padStart(2, '0')}</span><div>{ACTS.map((item, index) => <i key={item.start} className={index <= scene ? 'is-active' : ''} />)}</div><span>04</span></div>
    </main>
  )
}
