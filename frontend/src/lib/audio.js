import { Howl, Howler } from 'howler'

let selectedVoice = null

function chooseNaturalSpanishVoice(voices = []) {
  const spanish = voices.filter((voice) => /^(es-mx|es-us|es-es)(?:$|-)/i.test(voice.lang || ''))
  const natural = /(natural|neural|google|microsoft|sabina|dalia|jorge|paulina)/i
  return spanish.find((voice) => natural.test(voice.name || ''))
    || spanish.find((voice) => /^es-mx/i.test(voice.lang || ''))
    || spanish.find((voice) => /^es-us/i.test(voice.lang || ''))
    || spanish.find((voice) => /^es-es/i.test(voice.lang || ''))
    || voices.find((voice) => /^es(?:-|$)/i.test(voice.lang || ''))
    || null
}

export function loadNaturalVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  selectedVoice = chooseNaturalSpanishVoice(window.speechSynthesis.getVoices())
  return selectedVoice
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadNaturalVoice()
  if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', loadNaturalVoice)
  else window.speechSynthesis.onvoiceschanged = loadNaturalVoice
}

class ArcadeAudioManager {
  constructor() { this.ctx = null; this.enabled = true; this.musicTimer = null; this.musicNodes = new Set(); this.musicStep = 0 }

  init() {
    if (typeof window === 'undefined' || !this.enabled) return null
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      try { if (AudioContext) this.ctx = new AudioContext() } catch { return null }
    }
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {})
    return this.ctx
  }

  tone(frequency, delay, duration, type = 'sine', volume = 0.07) {
    const ctx = this.init()
    if (!ctx) return
    try {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      const start = ctx.currentTime + delay
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.02)
    } catch { /* Audio is an enhancement; unsupported devices stay silent. */ }
  }

  playClick() { this.tone(520, 0, 0.075, 'sine', 0.045); this.tone(780, 0.025, 0.07, 'sine', 0.025) }
  playHover() { this.tone(720, 0, .045, 'triangle', .018) }
  playLockIn() { [392, 523.25, 783.99, 1046.5].forEach((note, index) => this.tone(note, index * .065, .16, 'square', .026)) }
  playRadioBeep() {
    const ctx = this.init()
    if (!ctx) return
    try {
      const start = ctx.currentTime
      ;[0, .055].forEach((delay, index) => {
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()
        const toneStart = start + delay
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(index ? 1120 : 920, toneStart)
        gain.gain.setValueAtTime(.0001, toneStart)
        gain.gain.exponentialRampToValueAtTime(.018, toneStart + .006)
        gain.gain.exponentialRampToValueAtTime(.0001, toneStart + .042)
        oscillator.connect(gain)
        gain.connect(ctx.destination)
        oscillator.start(toneStart)
        oscillator.stop(toneStart + .045)
      })
    } catch { this.tone(1200, 0, .06, 'sine', .025) }
  }
  playCoin() { [987.77, 1318.51, 1975.53].forEach((note, index) => this.tone(note, index * 0.075, .23, 'square', .035)) }
  playShot() { this.tone(180, 0, .09, 'sawtooth', .045); this.tone(680, 0, .055, 'square', .018) }
  playExplosion() { this.tone(115, 0, .2, 'triangle', .055); this.tone(78, .025, .29, 'sawtooth', .035); this.tone(440, .02, .11, 'sine', .035) }
  playReload() { [420, 310, 520].forEach((note, index) => this.tone(note, index * .075, .055, 'square', .024)) }
  playNavigate() { this.tone(440, 0, 0.08, 'triangle', 0.04); this.tone(660, 0.055, 0.1, 'triangle', 0.04) }
  playPortalJump() { [330, 440, 660, 880].forEach((note, index) => this.tone(note, index * 0.045, 0.18 - index * 0.02, 'sawtooth', 0.035)) }
  playBadgeUnlock() { [523, 659, 784, 1047].forEach((note, index) => this.tone(note, index * 0.09, 0.28, 'triangle', 0.055)) }

  startMusic() {
    const ctx = this.init()
    if (!ctx || this.musicTimer) return
    const chords = [[55, 82.41, 110], [49, 73.42, 98], [65.41, 98, 130.81], [43.65, 65.41, 87.31]]
    const scheduleChord = () => {
      const notes = chords[this.musicStep % chords.length]; this.musicStep += 1
      notes.forEach((frequency, index) => {
        try {
          const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); const filter = ctx.createBiquadFilter()
          const now = ctx.currentTime; const duration = index === 2 ? 1.65 : 2.25
          oscillator.type = index === 0 ? 'sawtooth' : 'triangle'; oscillator.frequency.setValueAtTime(frequency, now)
          filter.type = 'lowpass'; filter.frequency.setValueAtTime(index === 0 ? 190 : 340, now)
          gain.gain.setValueAtTime(.0001, now); gain.gain.linearRampToValueAtTime(index === 0 ? .018 : .009, now + .18); gain.gain.setTargetAtTime(.0001, now + duration - .32, .18)
          oscillator.connect(filter); filter.connect(gain); gain.connect(ctx.destination); oscillator.start(now); oscillator.stop(now + duration)
          const node = { oscillator, gain, filter }; this.musicNodes.add(node); oscillator.onended = () => this.musicNodes.delete(node)
        } catch { /* Unsupported audio remains silent. */ }
      })
    }
    scheduleChord(); this.musicTimer = window.setInterval(scheduleChord, 2200)
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer)
    this.musicTimer = null
    this.musicNodes.forEach(({ oscillator, gain }) => { try { gain.gain.setTargetAtTime(.0001, this.ctx.currentTime, .03); oscillator.stop(this.ctx.currentTime + .15) } catch { /* Already stopped. */ } })
    this.musicNodes.clear()
  }
}

function synthWavDataUri({ frequency, duration, wave = 'square', endFrequency = frequency * .65, noise = 0 }) {
  const sampleRate = 22050
  const sampleCount = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + sampleCount * 2)
  const view = new DataView(buffer)
  const writeText = (offset, value) => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)) }
  writeText(0, 'RIFF'); view.setUint32(4, 36 + sampleCount * 2, true); writeText(8, 'WAVE'); writeText(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeText(36, 'data'); view.setUint32(40, sampleCount * 2, true)
  let phase = 0
  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount
    const envelope = Math.min(1, index / (sampleRate * .008)) * Math.pow(1 - progress, 2.2)
    const currentFrequency = frequency + (endFrequency - frequency) * progress
    phase += Math.PI * 2 * currentFrequency / sampleRate
    const oscillator = wave === 'sawtooth' ? 2 * (phase / (Math.PI * 2) - Math.floor(.5 + phase / (Math.PI * 2))) : Math.sin(phase) > 0 ? 1 : -1
    const sample = (oscillator * (1 - noise) + (Math.random() * 2 - 1) * noise) * envelope * .35
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, sample)) * 32767, true)
  }
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index])
  return `data:audio/wav;base64,${btoa(binary)}`
}

let howlerSfx
function getHowlerSfx() {
  if (howlerSfx || typeof window === 'undefined') return howlerSfx
  Howler.autoSuspend = true
  howlerSfx = {
    shot: new Howl({ src: [synthWavDataUri({ frequency: 360, endFrequency: 92, duration: .12, wave: 'sawtooth', noise: .12 })], format: ['wav'], volume: .33, pool: 8, preload: true }),
    explosion: new Howl({ src: [synthWavDataUri({ frequency: 130, endFrequency: 42, duration: .31, wave: 'sawtooth', noise: .58 })], format: ['wav'], volume: .45, pool: 8, preload: true }),
    reload: new Howl({ src: [synthWavDataUri({ frequency: 620, endFrequency: 340, duration: .24, wave: 'square', noise: .08 })], format: ['wav'], volume: .25, pool: 4, preload: true }),
    coin: new Howl({ src: [synthWavDataUri({ frequency: 790, endFrequency: 1580, duration: .22, wave: 'square' })], format: ['wav'], volume: .32, pool: 5, preload: true }),
  }
  return howlerSfx
}

function playHowler(name, fallback) {
  try {
    const sound = getHowlerSfx()?.[name]
    if (sound?.state() === 'loaded') { sound.play(); return }
  } catch { /* Fall back to the local oscillator when Web Audio codecs are unavailable. */ }
  fallback()
}

export const arcadeAudio = new ArcadeAudioManager()
export const playClick = () => arcadeAudio.playClick()
export const playHover = () => arcadeAudio.playHover()
export const playLockIn = () => arcadeAudio.playLockIn()
export const playRadioBeep = () => arcadeAudio.playRadioBeep()
export const playCoin = () => playHowler('coin', () => arcadeAudio.playCoin())
export const playInsertCoin = playCoin
export const playReload = () => playHowler('reload', () => arcadeAudio.playReload())
export const playShot = () => playHowler('shot', () => arcadeAudio.playShot())
export const playExplosion = () => playHowler('explosion', () => arcadeAudio.playExplosion())
export const playNavigate = () => arcadeAudio.playNavigate()
export const playPortalJump = () => arcadeAudio.playPortalJump()
export function playArcadeCallout(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(String(text || ''))
    const voice = selectSpanishVoice(window.speechSynthesis)
    if (voice) utterance.voice = voice
    utterance.lang = voice?.lang || 'es-MX'
    utterance.rate = 1.08
    utterance.pitch = 1.08
    utterance.volume = .9
    window.speechSynthesis.speak(utterance)
  } catch { /* Announcer voice is optional; the arcade SFX still play. */ }
}
export const startMusic = () => arcadeAudio.startMusic()
export const stopMusic = () => arcadeAudio.stopMusic()
export const playSuccess = () => arcadeAudio.playBadgeUnlock()
export const playBadgeUnlock = playSuccess

export function selectSpanishVoice(synthesis) {
  const voices = synthesis?.getVoices?.() || []
  const found = chooseNaturalSpanishVoice(voices)
  if (found && typeof window !== 'undefined' && synthesis === window.speechSynthesis) selectedVoice = found
  return found || selectedVoice
}

export function waitForSpanishVoice(synthesis, timeoutMs = 900) {
  const available = selectSpanishVoice(synthesis)
  if (available || !synthesis?.addEventListener) return Promise.resolve(available)
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      synthesis.removeEventListener?.('voiceschanged', onVoicesChanged)
      window.clearTimeout(timeoutId)
      resolve(selectSpanishVoice(synthesis))
    }
    const onVoicesChanged = () => {
      loadNaturalVoice()
      if (selectSpanishVoice(synthesis)) finish()
    }
    const timeoutId = window.setTimeout(finish, timeoutMs)
    synthesis.addEventListener('voiceschanged', onVoicesChanged)
  })
}
