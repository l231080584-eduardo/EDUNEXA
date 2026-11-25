const SOURCES = {
  shot: '/assets/audio/disparo-cc0.wav',
  explosion: '/assets/audio/explosion-cc0.wav',
  car: '/assets/audio/auto-pasando.mp3',
  music: '/assets/audio/musica-batalla.ogg',
}

const cache = new Map()
const missing = new Set()
let activeVoice
let context
let musicNodes
let musicTimer
let musicStep = 0
let mix
let muted = false
let currentMusicIntensity = 0

function getContext() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  try {
    context ||= new AudioContext()
    if (!mix) {
      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -18
      compressor.knee.value = 12
      compressor.ratio.value = 3.5
      compressor.attack.value = .008
      compressor.release.value = .18
      mix = context.createGain()
      mix.gain.value = .82
      mix.connect(compressor)
      compressor.connect(context.destination)
    }
    if (context.state === 'suspended') context.resume().catch(() => {})
    return context
  } catch {
    return null
  }
}

function audioFor(key) {
  if (typeof Audio === 'undefined') return null
  if (!cache.has(key)) {
    const audio = new Audio(SOURCES[key])
    audio.preload = 'auto'
    audio.addEventListener('error', () => {
      if (missing.has(key)) return
      missing.add(key)
      console.warn(`[EDUNEXA audio] No se encontró ${SOURCES[key]}; usaré el respaldo Web Audio.`)
    }, { once: true })
    cache.set(key, audio)
  }
  return cache.get(key)
}

function playTone({ frequencies, duration = .18, type = 'square', volume = .18, sweep = 0, noise = false }) {
  if (muted) return
  const ctx = getContext()
  if (!ctx) return
  const start = ctx.currentTime
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), start + .012)
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
  gain.connect(mix || ctx.destination)
  if (noise) {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let i = 0; i < channel.length; i += 1) channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 1200
    filter.frequency.setValueAtTime(1500, start)
    filter.frequency.exponentialRampToValueAtTime(260, start + duration)
    source.connect(filter); filter.connect(gain); source.start(start); source.stop(start + duration)
    return
  }
  frequencies.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    if (sweep) oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, frequency * sweep), start + duration)
    oscillator.connect(gain)
    oscillator.start(start + index * .012)
    oscillator.stop(start + duration + .02)
  })
}

function play(key, fallback) {
  if (muted) return
  const audio = audioFor(key)
  if (audio) {
    audio.currentTime = 0
    audio.volume = key === 'music' ? .3 : .56
    audio.play().catch(() => fallback?.())
  } else fallback?.()
}

export function playShot() {
  play('shot', () => {
    playTone({ frequencies: [1700], duration: .045, type: 'triangle', sweep: .55, volume: .038 })
    playTone({ frequencies: [260, 115], duration: .105, type: 'sine', sweep: .58, volume: .055 })
    playTone({ frequencies: [], duration: .07, volume: .022, noise: true })
  })
}

export function playExplosion() {
  play('explosion', () => {
    playTone({ frequencies: [], duration: .38, volume: .07, noise: true })
    playTone({ frequencies: [118, 54], duration: .48, type: 'sine', sweep: .42, volume: .09 })
    playTone({ frequencies: [430, 170], duration: .2, type: 'triangle', sweep: .38, volume: .026 })
  })
}

export function playCarPassing() {
  play('car', () => {
    playTone({ frequencies: [86, 68], duration: .92, type: 'triangle', sweep: 2.4, volume: .035 })
    playTone({ frequencies: [], duration: .78, volume: .018, noise: true })
  })
}

export function startIntroMusic() {
  if (muted) return
  const audio = audioFor('music')
  if (audio) {
    audio.loop = true
    audio.volume = [.38, .48, .58, .68][currentMusicIntensity]
    audio.play().catch((error) => {
      if (error?.name === 'NotAllowedError') {
        // Browsers may reject music started by a route effect; the first real
        // pointer/key gesture retries it while user activation is available.
        const resume = () => { if (!muted && audio.paused) audio.play().catch(() => startSynthMusic()) }
        window.addEventListener('pointerdown', resume, { once: true })
        window.addEventListener('keydown', resume, { once: true })
        return
      }
      startSynthMusic()
    })
    return
  }
  startSynthMusic()
}

function startSynthMusic() {
  if (musicNodes || muted) return
  const ctx = getContext()
  if (!ctx) return
  const master = ctx.createGain(); master.gain.value = .0001; master.connect(mix || ctx.destination)
  const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 1250; lowpass.connect(master)
  musicNodes = { master, lowpass }
  musicStep = 0
  setMusicIntensity(0)
  const melody = [220, 261.63, 311.13, 349.23, 311.13, 261.63, 196, 233.08]
  const schedule = () => {
    if (!musicNodes || muted) return
    const now = ctx.currentTime
    const noteIndex = musicStep % melody.length
    const note = melody[noteIndex]
    const lead = ctx.createOscillator(); const envelope = ctx.createGain()
    lead.type = 'triangle'; lead.frequency.setValueAtTime(note, now)
    lead.frequency.exponentialRampToValueAtTime(note * .985, now + .12)
    envelope.gain.setValueAtTime(.0001, now); envelope.gain.linearRampToValueAtTime(.12, now + .012)
    envelope.gain.exponentialRampToValueAtTime(.0001, now + .145)
    lead.connect(envelope); envelope.connect(lowpass); lead.start(now); lead.stop(now + .16)
    if (musicStep % 2 === 0) {
      const bass = ctx.createOscillator(); const bassGain = ctx.createGain()
      bass.type = 'sine'; bass.frequency.setValueAtTime([55, 49, 65, 73][currentMusicIntensity], now)
      bass.frequency.exponentialRampToValueAtTime(42, now + .16)
      bassGain.gain.setValueAtTime(.0001, now); bassGain.gain.linearRampToValueAtTime(.14, now + .008); bassGain.gain.exponentialRampToValueAtTime(.0001, now + .19)
      bass.connect(bassGain); bassGain.connect(master); bass.start(now); bass.stop(now + .2)
    }
    if (musicStep % 4 === 0 || musicStep % 4 === 2) {
      playTone({ frequencies: musicStep % 4 === 0 ? [92, 48] : [], duration: musicStep % 4 === 0 ? .12 : .08, type: 'sine', volume: .018, sweep: .55, noise: musicStep % 4 === 2 })
    }
    musicStep += 1
  }
  schedule()
  musicTimer = window.setInterval(schedule, 180)
}

export function setMusicIntensity(act = 0) {
  currentMusicIntensity = Math.max(0, Math.min(3, act))
  if (typeof Audio !== 'undefined') {
    const audio = cache.get('music')
    if (audio && !audio.paused) audio.volume = muted ? 0 : [.38, .48, .58, .68][currentMusicIntensity]
  }
  if (!musicNodes) return
  const ctx = getContext()
  const level = [.19, .24, .28, .32][currentMusicIntensity]
  musicNodes.master.gain.setTargetAtTime(muted ? .0001 : level, ctx.currentTime, .5)
  musicNodes.lowpass.frequency.setTargetAtTime([760, 980, 1250, 1550][currentMusicIntensity], ctx.currentTime, .4)
}

export function setIntroMuted(value) {
  muted = Boolean(value)
  const ctx = getContext()
  if (musicNodes && ctx) musicNodes.master.gain.setTargetAtTime(muted ? .0001 : [.19, .24, .28, .32][currentMusicIntensity], ctx.currentTime, .08)
  for (const audio of cache.values()) audio.muted = muted
  if (!muted && musicNodes) setMusicIntensity(currentMusicIntensity)
  else if (!muted && cache.get('music')?.paused) startIntroMusic()
}

export function stopIntroAudio() {
  for (const [key, audio] of cache) {
    audio.pause()
    audio.currentTime = 0
    if (key === 'music') audio.loop = false
  }
  if (musicTimer) window.clearInterval(musicTimer)
  musicTimer = null
  if (musicNodes) {
    const nodes = musicNodes
    musicNodes = null
    try { nodes.master.disconnect(); nodes.lowpass.disconnect() } catch { /* ya detenido */ }
  }
}

export function playIntroVoice(src) {
  stopIntroVoice()
  if (typeof Audio === 'undefined') return
  const audio = new Audio(src)
  audio.preload = 'auto'
  audio.volume = .92
  activeVoice = audio
  const reportMissing = () => {
    if (missing.has(src)) return
    missing.add(src)
    console.warn(`[EDUNEXA voz] No se encontró ${src}; la intro continuará sin voz.`)
  }
  audio.addEventListener('error', reportMissing, { once: true })
  audio.play().catch((error) => { if (error?.name !== 'NotAllowedError') reportMissing() })
}

export function stopIntroVoice() {
  if (!activeVoice) return
  activeVoice.pause()
  activeVoice.currentTime = 0
  activeVoice = undefined
}

export const INTRO_AUDIO_FILES = SOURCES
