import { setVoiceMuted } from './voiceEngine'

const AudioContextClass = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null

let context
let master
let muted = false
let musicMode = null
let scheduler = null
let step = 0
let nextBeatAt = 0
let noiseBuffer
const listeners = new Set()

const TRACKS = {
  select: { bpm: 94, notes: [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 440], bass: [130.81, 164.81, 196, 146.83], lead: 'triangle' },
  battle: { bpm: 148, notes: [392, 523.25, 587.33, 783.99, 698.46, 587.33, 523.25, 440], bass: [98, 98, 130.81, 146.83], lead: 'square' },
  boss: { bpm: 176, notes: [196, 233.08, 293.66, 392, 349.23, 293.66, 233.08, 207.65], bass: [49, 49, 58.27, 73.42], lead: 'sawtooth' },
}

function getContext() {
  if (!AudioContextClass) return null
  if (!context) {
    context = new AudioContextClass()
    master = context.createGain()
    master.gain.value = muted ? 0 : .22
    master.connect(context.destination)
  }
  if (context.state === 'suspended') context.resume().catch(() => {})
  return context
}

function tone(frequency, duration = .12, type = 'square', volume = .12, delay = 0) {
  const ctx = getContext()
  if (!ctx || !master) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const start = ctx.currentTime + delay
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(.0001, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), start + .012)
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
  oscillator.connect(gain).connect(master)
  oscillator.start(start)
  oscillator.stop(start + duration + .02)
}

function drum(kind, at) {
  const ctx = getContext()
  if (!ctx || !master) return
  const noise = ctx.createBufferSource()
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }
  noise.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = kind === 'hat' ? 'highpass' : 'lowpass'
  filter.frequency.value = kind === 'hat' ? 6500 : 170
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(.0001, at)
  gain.gain.linearRampToValueAtTime(kind === 'hat' ? .045 : .2, at + .002)
  gain.gain.exponentialRampToValueAtTime(.0001, at + (kind === 'hat' ? .035 : .11))
  noise.connect(filter).connect(gain).connect(master)
  noise.start(at)
  noise.stop(at + .12)
}

function noiseBurst(duration = .09, frequency = 1400, volume = .08, type = 'bandpass') {
  const ctx = getContext()
  if (!ctx || !master) return
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(frequency, ctx.currentTime)
  filter.Q.value = .7
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration)
  source.connect(filter).connect(gain).connect(master)
  source.start()
  source.stop(ctx.currentTime + duration)
}

function sweep(from, to, duration, type = 'sawtooth', volume = .08) {
  const ctx = getContext()
  if (!ctx || !master) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), ctx.currentTime + duration)
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration)
  osc.connect(gain).connect(master)
  osc.start()
  osc.stop(ctx.currentTime + duration + .01)
}

/** Short layered weapon transients, shaped around each hero's weapon identity. */
export function playHeroWeaponSfx(heroId = 'tech') {
  if (muted) return
  if (heroId === 'industry') {
    noiseBurst(.14, 520, .2, 'lowpass'); sweep(150, 42, .17, 'sawtooth', .12); tone(640, .045, 'square', .025)
  } else if (heroId === 'energy') {
    noiseBurst(.055, 4200, .08, 'highpass'); sweep(1120, 240, .12, 'sawtooth', .055); tone(1760, .035, 'square', .025)
  } else if (heroId === 'construction') {
    noiseBurst(.12, 330, .16, 'lowpass'); sweep(190, 55, .15, 'triangle', .12); tone(520, .07, 'triangle', .035, .035)
  } else if (heroId === 'business') {
    noiseBurst(.04, 3200, .045, 'highpass'); sweep(940, 290, .095, 'square', .045); tone(620, .04, 'triangle', .025, .025)
  } else if (heroId === 'life') {
    noiseBurst(.1, 900, .07, 'bandpass'); sweep(620, 180, .14, 'triangle', .055); tone(920, .045, 'sine', .026, .025)
  } else {
    noiseBurst(.065, 2100, .1, 'bandpass'); sweep(540, 180, .105, 'square', .05); tone(880, .025, 'triangle', .02, .02)
  }
}

function scheduleBeat() {
  const ctx = getContext()
  const track = TRACKS[musicMode]
  if (!ctx || !track) return
  const beat = 60 / track.bpm / 2
  while (nextBeatAt < ctx.currentTime + .12) {
    const at = nextBeatAt
    if (step % 2 === 0) {
      const note = track.notes[(step / 2) % track.notes.length]
      const bass = track.bass[(step / 4) % track.bass.length]
      const delay = Math.max(0, at - ctx.currentTime)
      tone(note, beat * .78, track.lead, musicMode === 'boss' ? .062 : .045, delay)
      tone(note * 1.5, beat * .42, 'triangle', musicMode === 'boss' ? .026 : .02, delay + beat * .22)
      if (step % 4 === 0) tone(bass, beat * 1.7, 'triangle', musicMode === 'boss' ? .13 : .085, delay)
      else if (step % 4 === 2) tone(bass * 1.5, beat * .62, 'triangle', musicMode === 'boss' ? .048 : .035, delay)
    }
    if (step % 4 === 0) drum('kick', at)
    if (step % 4 === 2) drum(musicMode === 'select' ? 'hat' : 'snare', at)
    if (step % 2 === 1) drum('hat', at)
    nextBeatAt += beat
    step += 1
  }
}

export function startArcadeMusic(mode = 'select') {
  if (!TRACKS[mode]) return
  getContext()
  musicMode = mode
  step = 0
  nextBeatAt = context?.currentTime || 0
  if (scheduler) window.clearInterval(scheduler)
  if (muted) return
  scheduleBeat()
  scheduler = window.setInterval(scheduleBeat, 55)
}

export function stopArcadeMusic() {
  if (scheduler) window.clearInterval(scheduler)
  scheduler = null
  musicMode = null
}

export function playArcadeSfx(name = 'click') {
  if (muted) return
  const sounds = {
    click: () => { tone(560, .045, 'square', .035); tone(820, .045, 'square', .025, .035) },
    change: () => { tone(330, .07, 'triangle', .07); tone(494, .09, 'triangle', .06, .06) },
    confirm: () => [523.25, 659.25, 783.99].forEach((n, i) => tone(n, .18, 'square', .055, i * .065)),
    shot: () => { tone(190, .085, 'sawtooth', .07); tone(620, .05, 'square', .035) },
    jump: () => { tone(260, .11, 'square', .05); tone(520, .13, 'triangle', .045, .06) },
    countdown: () => { tone(880, .075, 'square', .075); tone(660, .11, 'triangle', .055, .065) },
    bossHit: () => { tone(110, .16, 'sawtooth', .13); tone(740, .09, 'square', .06, .025) },
  }
  ;(sounds[name] || sounds.click)()
}

export function getArcadeMuted() { return muted }
export function toggleArcadeMuted() {
  muted = !muted
  setVoiceMuted(muted)
  const ctx = getContext()
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(muted ? .0001 : .22, ctx.currentTime, .035)
  }
  listeners.forEach((listener) => listener(muted))
  if (!muted && musicMode) startArcadeMusic(musicMode)
  return muted
}
export function subscribeArcadeMute(listener) { listeners.add(listener); return () => listeners.delete(listener) }
