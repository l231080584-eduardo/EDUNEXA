import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { playClick, playRadioBeep, waitForSpanishVoice } from '../lib/audio'

export default function NoniWidget({ message, subtitles = true }) {
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [caption, setCaption] = useState('Soy NONI, tu copiloto. Vamos a explorar lo que te inspira.')
  const latestRef = useRef('')
  const speakTimerRef = useRef(null)

  useEffect(() => {
    const text = typeof message === 'string' ? message : message?.text
    if (!text || text === latestRef.current) return undefined
    latestRef.current = text
    setCaption(text)
    if (!voiceEnabled || !('speechSynthesis' in window)) return undefined
    window.speechSynthesis.cancel()
    playRadioBeep()
    let active = true
    speakTimerRef.current = window.setTimeout(() => {
      if (!active) return
      waitForSpanishVoice(window.speechSynthesis).then((voice) => {
        if (!active) return
        const utterance = new SpeechSynthesisUtterance(text)
        if (voice) utterance.voice = voice
        utterance.lang = voice?.lang || 'es-MX'
        utterance.pitch = 1.0
        utterance.rate = 0.93
        utterance.volume = 1.0
        utterance.onstart = () => { if (active) setSpeaking(true) }
        utterance.onboundary = (event) => {
          if (active && typeof event.charIndex === 'number') setCaption(text.slice(0, event.charIndex + (event.charLength || 1)))
        }
        utterance.onend = () => { if (active) { setSpeaking(false); setCaption(text) } }
        utterance.onerror = () => { if (active) setSpeaking(false) }
        window.speechSynthesis.speak(utterance)
      }).catch(() => {
        if (active) setSpeaking(false)
      })
    }, 115)
    return () => {
      active = false
      window.clearTimeout(speakTimerRef.current)
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [message, voiceEnabled])

  function toggleVoice() {
    playClick()
    setVoiceEnabled((enabled) => {
      if (enabled && 'speechSynthesis' in window) { window.clearTimeout(speakTimerRef.current); window.speechSynthesis.cancel(); setSpeaking(false) }
      return !enabled
    })
  }

  return <aside className="noni-hologram" aria-label="Copiloto NONI">
    {subtitles && <motion.div className="noni-holo-caption" key={caption} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} aria-live="polite"><strong>NONI</strong><span>{caption}</span></motion.div>}
    <div className={`noni-holo-presence ${speaking ? 'is-speaking' : ''}`}>
      <motion.div className="noni-holo-orb" animate={{ scale: speaking ? [1, 1.08, 1] : [1, 1.025, 1] }} transition={{ repeat: Infinity, duration: speaking ? .75 : 2.7, ease: 'easeInOut' }}><span className="noni-holo-face">N</span><i /><i /><i /></motion.div>
      <div className={`noni-frequency ${speaking ? 'is-active' : ''}`} aria-hidden="true">{Array.from({ length: 13 }, (_, index) => <span key={index} style={{ '--bar-index': index }} />)}</div>
      <div className="noni-holo-label"><strong>NONI IA</strong><small>{speaking ? 'TE ACOMPAÑO' : 'COPILOTO VOCACIONAL'}</small></div>
      <button type="button" className="noni-holo-voice" onClick={toggleVoice} aria-label={voiceEnabled ? 'Desactivar voz de NONI' : 'Activar voz de NONI'} aria-pressed={voiceEnabled}>{voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}</button>
    </div>
  </aside>
}
