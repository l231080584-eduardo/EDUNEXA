import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, Volume2, VolumeX, X } from 'lucide-react'

const welcomeMessage = '¡Hola! Soy JARVIS. Puedo acompañarte mientras exploras tus intereses. No hay respuestas correctas o incorrectas: elige lo que más se parezca a ti.'

export default function JarvisWidget({ answer, subtitles }) {
  const [open, setOpen] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: welcomeMessage }])
  const [draft, setDraft] = useState('')
  const liveMessage = useRef(welcomeMessage)
  const latestAnswer = useRef(null)

  useEffect(() => {
    if (!answer || latestAnswer.current === answer) return
    latestAnswer.current = answer
    const text = answer >= 4
      ? '¡Qué bien! Esa motivación puede ser una gran pista para tu camino.'
      : answer <= 2
        ? 'Gracias por compartirlo. Hay muchas formas de aprender y encontrar lo que te inspira.'
        : '¡Anotado! Tus intereses pueden combinarse de muchas maneras.'
    setMessages((current) => [...current, { role: 'assistant', text }])
  }, [answer])

  useEffect(() => {
    liveMessage.current = messages[messages.length - 1]?.text || ''
    if (speechEnabled && 'speechSynthesis' in window && open) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(liveMessage.current))
    }
  }, [messages, open, speechEnabled])

  useEffect(() => () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [])

  function sendMessage(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    const response = 'Gracias por contarme. Tómate tu tiempo y elige la respuesta que se sienta más auténtica para ti.'
    setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: response }])
    setDraft('')
  }

  function toggleSpeech() {
    if (!('speechSynthesis' in window)) {
      setMessages((current) => [...current, { role: 'assistant', text: 'La lectura por voz no está disponible en este navegador, pero el texto siempre aparece en pantalla.' }])
      return
    }
    setSpeechEnabled((enabled) => !enabled)
  }

  return (
    <aside className="jarvis-anchor" aria-label="Asistente vocacional JARVIS">
      {open && (
        <section className="chat-panel" aria-label="Conversación con JARVIS">
          <div className="chat-header">
            <span className="chat-avatar"><Bot size={19} aria-hidden="true" /></span>
            <div><strong>JARVIS</strong><span className="online-label">Acompañándote</span></div>
            <button type="button" className="chat-action" aria-label={speechEnabled ? 'Desactivar lectura por voz' : 'Activar lectura por voz'} onClick={toggleSpeech}>
              {speechEnabled ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
            </button>
            <button type="button" className="chat-action" aria-label="Cerrar chat" onClick={() => setOpen(false)}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <p className={`chat-bubble ${message.role}`} key={`${index}-${message.text}`}>{message.text}</p>
            ))}
          </div>
          {subtitles && <p className="subtitle-box" aria-live="polite">Subtítulos: {liveMessage.current}</p>}
          <form className="chat-form" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="jarvis-message">Escribe un mensaje para JARVIS</label>
            <input id="jarvis-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe un mensaje…" />
            <button type="submit" aria-label="Enviar mensaje" disabled={!draft.trim()}><Send size={17} aria-hidden="true" /></button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="jarvis-launcher"
        aria-label={open ? 'Cerrar conversación con JARVIS' : 'Abrir conversación con JARVIS'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X aria-hidden="true" /> : <><span className="jarvis-orbit" aria-hidden="true" /><MessageCircle aria-hidden="true" /></>}
      </button>
    </aside>
  )
}
