const VOICES = {
  moros: { pitch: 0.45, rate: 0.85, preferred: ['pablo', 'jorge', 'raúl', 'raul', 'diego', 'álvaro', 'alvaro', 'male', 'masculino'] },
  noni: { pitch: 1.2, rate: 1.05, preferred: ['paulina', 'sabina', 'helena', 'laura', 'female', 'femenina', 'monica', 'mónica'] },
  heroMale: { pitch: 0.85, rate: 1, preferred: ['pablo', 'jorge', 'raúl', 'raul', 'diego', 'male', 'masculino'] },
  heroFemale: { pitch: 1.18, rate: 1, preferred: ['paulina', 'sabina', 'helena', 'laura', 'female', 'femenina'] },
}

const SPANISH = /^es-(mx|es|us)(-|$)/i
const FEMININE_NAMES = ['sabina', 'paulina', 'helena', 'laura', 'female', 'femenina', 'monica', 'mónica', 'lucia', 'lucía']
let globallyMuted = false
let activeUtterance = null
let requestId = 0
let voicePoll = 0

function synthesis() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null
}

export function cancelSpeech() {
  requestId += 1
  if (voicePoll) window.clearInterval(voicePoll)
  voicePoll = 0
  const synth = synthesis()
  if (synth) synth.cancel()
  activeUtterance = null
}

export function setVoiceMuted(muted) {
  globallyMuted = Boolean(muted)
  if (globallyMuted) cancelSpeech()
  return globallyMuted
}

function chooseVoice(voices, settings) {
  const spanish = voices.filter((voice) => SPANISH.test(voice.lang || ''))
  const preferred = spanish.find((voice) => settings.preferred.some((name) => voice.name.toLocaleLowerCase().includes(name)))
  if (preferred) return preferred
  if (settings === VOICES.moros || settings === VOICES.heroMale) {
    return spanish.find((voice) => !FEMININE_NAMES.some((name) => voice.name.toLocaleLowerCase().includes(name))) || null
  }
  return spanish[0] || voices.find((voice) => /^es-/i.test(voice.lang || '')) || null
}

function speak(text, settings) {
  const synth = synthesis()
  if (globallyMuted || !synth || !text || typeof SpeechSynthesisUtterance === 'undefined') return false
  cancelSpeech()
  const currentRequest = requestId
  const speakWhenReady = () => {
    if (currentRequest !== requestId || globallyMuted) return
    const voices = synth.getVoices()
    if (!voices.length && voicePoll === 0) {
      let attempts = 0
      voicePoll = window.setInterval(() => {
        attempts += 1
        if (synth.getVoices().length || attempts >= 16 || currentRequest !== requestId) {
          window.clearInterval(voicePoll); voicePoll = 0
          if (currentRequest === requestId && !globallyMuted) utter()
        }
      }, 80)
      return
    }
    utter()
  }
  const utter = () => {
    if (currentRequest !== requestId || globallyMuted) return
    try {
      const utterance = new SpeechSynthesisUtterance(String(text))
      const voice = chooseVoice(synth.getVoices(), settings)
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang || 'es-MX'
      utterance.pitch = settings.pitch
      utterance.rate = settings.rate
      activeUtterance = utterance
      utterance.onend = () => { if (activeUtterance === utterance) activeUtterance = null }
      utterance.onerror = () => { if (activeUtterance === utterance) activeUtterance = null }
      synth.speak(utterance)
    } catch { activeUtterance = null }
  }
  speakWhenReady()
  return true
}

export const speakAsMoros = (text) => speak(text, VOICES.moros)
export const speakAsNoni = (text) => speak(text, VOICES.noni)
export function speakAsHero(heroId, text) {
  return speak(text, ['tech', 'construction', 'energy', 'life'].includes(heroId) ? VOICES.heroFemale : VOICES.heroMale)
}
