import { useCallback, useEffect, useRef, useState } from 'react'
import { pickNoniLine, rememberNoniContext } from '../lib/noni'
import { playCoin, playExplosion, playNavigate, playReload, playShot, startMusic, stopMusic, waitForSpanishVoice } from '../lib/audio'
import { random, randomChoice } from '../lib/random'
import { GEM_CATEGORIES } from '../data/careers'

const WIDTH = 960
const HEIGHT = 540
const FLOOR = 470
const HERO_WIDTH = 48
const HERO_HEIGHT = 64
const CATEGORIES = ['law', 'tech', 'design', 'business', 'engineering', 'social', 'humanities']
const CATEGORY_SHORT = { law: 'DERECHO', tech: 'TECNOLOGÍA', design: 'DISEÑO', business: 'NEGOCIOS', engineering: 'INGENIERÍA', social: 'SALUD', humanities: 'HUMANIDADES' }
const PASSIONS = {
  law: ['Justicia digital', 'Políticas públicas', 'Derechos humanos'], tech: ['Ciberseguridad', 'Inteligencia artificial', 'Software'],
  design: ['Diseño UX', 'Arte digital', 'Videojuegos'], business: ['Finanzas y datos', 'Emprendimiento', 'Estrategia'],
  engineering: ['Robótica', 'Mecatrónica', 'Automatización'], social: ['Biotecnología', 'Medicina', 'Salud comunitaria'],
  humanities: ['Psicología', 'Educación', 'Cultura'],
}
const HERO = { id: 'tech', name: 'El Hacker Maestro', area: 'Tecnología e Ingenierías', color: '#68f5a5', icon: '🥷' }

function canvasOf(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  draw(context, width, height)
  return canvas
}

function makeArt() {
  const background = canvasOf(WIDTH, HEIGHT, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR)
    sky.addColorStop(0, '#65c8ff'); sky.addColorStop(.64, '#b9edff'); sky.addColorStop(1, '#f8d994')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, FLOOR)
    ctx.fillStyle = '#fff1a6'; ctx.beginPath(); ctx.arc(760, 105, 43, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.72)'
    for (const [x, y, s] of [[130, 92, 1], [390, 135, .7], [820, 220, .6]]) {
      ctx.beginPath(); ctx.ellipse(x, y, 44 * s, 13 * s, 0, 0, Math.PI * 2); ctx.ellipse(x + 28 * s, y - 8 * s, 28 * s, 18 * s, 0, 0, Math.PI * 2); ctx.ellipse(x - 25 * s, y - 6 * s, 24 * s, 16 * s, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#72a6b4'
    for (const [x, w, h] of [[0, 95, 165], [112, 68, 116], [218, 112, 198], [365, 75, 137], [468, 100, 178], [602, 83, 126], [718, 104, 190], [854, 106, 148]]) {
      ctx.fillRect(x, FLOOR - h, w, h); ctx.fillStyle = '#577f91'; ctx.fillRect(x, FLOOR - h, w, 8); ctx.fillStyle = '#d9f4ed'
      for (let wy = FLOOR - h + 24; wy < FLOOR - 15; wy += 28) for (let wx = x + 13; wx < x + w - 8; wx += 25) ctx.fillRect(wx, wy, 10, 13)
      ctx.fillStyle = '#72a6b4'
    }
    ctx.fillStyle = '#56975e'; ctx.fillRect(0, FLOOR - 9, WIDTH, 10)
    ctx.fillStyle = '#797b78'; ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR)
    ctx.fillStyle = '#b6b3a5'; ctx.fillRect(0, FLOOR, WIDTH, 7)
    ctx.fillStyle = '#d0c3a0'; for (let x = 20; x < WIDTH; x += 120) ctx.fillRect(x, FLOOR + 42, 57, 5)
  })

  const heroFrames = [0, 1].map((step) => canvasOf(HERO_WIDTH * 2, HERO_HEIGHT * 2, (ctx) => {
    ctx.scale(2, 2)
    const legShift = step ? 4 : 0
    ctx.fillStyle = '#153c47'; ctx.fillRect(12, 43, 9, 17 - legShift); ctx.fillRect(27, 43 + legShift, 9, 17)
    ctx.fillStyle = '#182734'; ctx.fillRect(9, 56 - legShift, 15, 6); ctx.fillRect(25, 56 + legShift, 15, 6)
    ctx.fillStyle = '#49d68e'; ctx.fillRect(10, 25, 30, 22); ctx.fillStyle = '#1d5960'; ctx.fillRect(8, 30, 9, 15)
    ctx.fillStyle = '#e6b88f'; ctx.fillRect(17, 11, 20, 18); ctx.fillStyle = '#e9f25f'; ctx.fillRect(29, 17, 12, 5)
    ctx.fillStyle = '#123b4c'; ctx.fillRect(13, 7, 28, 9); ctx.fillRect(9, 13, 12, 4)
    ctx.fillStyle = '#f4f3d0'; ctx.fillRect(23, 17, 3, 3)
    ctx.fillStyle = '#273949'; ctx.fillRect(35, 31, 13, 5); ctx.fillRect(44, 29, 4, 3)
    ctx.fillStyle = '#71ffc0'; ctx.fillRect(40, 32, 6, 2)
  }))

  const zombies = [0, 1].map((step) => canvasOf(136, 92, (ctx) => {
    ctx.fillStyle = '#56636a'; ctx.fillRect(17, 31, 37, 48); ctx.fillStyle = '#818c8e'; ctx.fillRect(20, 9 + step, 31, 26)
    ctx.fillStyle = '#d7dbd1'; ctx.fillRect(19, 8 + step, 33, 8); ctx.fillRect(22, 35, 25, 5)
    ctx.fillStyle = '#202d34'; ctx.fillRect(27, 20 + step, 4, 4); ctx.fillRect(42, 20 + step, 4, 4)
    ctx.fillStyle = '#d54155'; ctx.beginPath(); ctx.moveTo(34, 36); ctx.lineTo(40, 36); ctx.lineTo(38, 63); ctx.lineTo(35, 53); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#56636a'; ctx.fillRect(5, 38, 18, 8); ctx.fillRect(48, 42, 19, 7); ctx.fillRect(21, 76, 12, 13); ctx.fillRect(39, 76, 12, 13)
    ctx.fillStyle = '#fff0f4'; ctx.fillRect(0, 0, 136, 12); ctx.fillStyle = '#d6336c'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RUTINA ZOMBIE', 68, 9)
  }))

  const orbs = Object.fromEntries(CATEGORIES.map((category) => [category, canvasOf(120, 60, (ctx) => {
    const color = GEM_CATEGORIES[category].color
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(27, 27, 20, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.arc(20, 19, 6, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(26,42,56,.45)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = '#172331'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(CATEGORY_SHORT[category], 53, 30, 64)
  })]))

  return { background, heroFrames, zombies, orbs }
}

function initialGame() {
  return {
    started: false, done: false, startTime: 0, lastTime: 0, score: 0, xp: 0, freedom: 0, lives: 3,
    shots: 0, hits: 0, ammo: 12, x: 220, y: FLOOR - HERO_HEIGHT, vy: 0, onGround: true,
    invulnerableUntil: 0, flashUntil: 0, nextShotAt: 0, nextId: 1, spawnTimer: 0,
    targets: new Map(), liveIds: new Set(), bullets: [], particles: [], gemCounts: Object.fromEntries(CATEGORIES.map((key) => [key, 0])),
    passionHits: 0, zombieHits: 0, streak: 0, lowLivesNotified: false, lastReloadLine: -Infinity, input: { left: false, right: false, fire: false },
    noniLine: 'NONI: Lista para acompañarte. Presiona JUGAR cuando quieras iniciar.',
  }
}

function randomPassion(hero) {
  const alternatives = CATEGORIES.filter((category) => category !== hero)
  return random() < .56 ? hero : randomChoice(alternatives)
}

export default function Arcade2DGame({ hero = HERO, profile = null, onGameComplete = null, onNoniUpdate = null }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(initialGame())
  const callbackRef = useRef({ onGameComplete, onNoniUpdate })
  const artRef = useRef(null)
  const speechSequenceRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [hud, setHud] = useState({ time: 45, score: 0, xp: 0, freedom: 0, lives: 3, ammo: 12, noniLine: gameRef.current.noniLine, done: false })
  callbackRef.current = { onGameComplete, onNoniUpdate }

  const say = useCallback((event, fixedLine = null) => {
    const game = gameRef.current
    const line = fixedLine || pickNoniLine(event, { nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    game.noniLine = `NONI: ${line}`
    callbackRef.current.onNoniUpdate?.({ text: line, id: performance.now() })
    const synthesis = window.speechSynthesis
    if (!synthesis || typeof SpeechSynthesisUtterance === 'undefined') return
    if (event !== 'gameComplete') synthesis.cancel()
    const speechSequence = ++speechSequenceRef.current
    const speak = async () => {
      const voice = await waitForSpanishVoice(synthesis, 900)
      if (gameRef.current !== game || speechSequence !== speechSequenceRef.current) return
      try {
        const utterance = new SpeechSynthesisUtterance(line)
        if (voice) utterance.voice = voice
        utterance.lang = voice?.lang || 'es-MX'
        utterance.rate = .95
        utterance.pitch = 1.05
        utterance.volume = 1
        synthesis.speak(utterance)
      } catch { /* Captions remain available when speech synthesis is unsupported. */ }
    }
    speak()
  }, [hero, profile])

  const finishGame = useCallback(() => {
    const game = gameRef.current
    if (game.done) return
    game.done = true
    game.input.left = false; game.input.right = false; game.input.fire = false
    if (game.lives === 0) say('gameComplete', '¡Último impacto! Terminó la partida, pero tu mapa vocacional ya está listo.')
    else say('gameComplete')
    stopMusic()
    const categoryHits = Object.fromEntries(CATEGORIES.map((category) => [category, Math.max(0, Number(game.gemCounts[category]) || 0)]))
    callbackRef.current.onGameComplete?.({ gemCounts: categoryHits, totalXp: Math.max(0, game.xp), score: Math.max(0, game.score), freedom: Math.max(0, game.freedom), livesRemaining: Math.max(0, game.lives), categoryHits, hero: hero?.id || 'tech', accuracy: game.shots > 0 ? Math.max(0, Math.min(1, game.hits / game.shots)) : 0 })
  }, [hero, say])

  const startGame = useCallback(() => {
    const game = gameRef.current
    if (game.started || game.done) return
    // Keep both calls synchronous inside the user gesture for iOS audio unlock.
    playCoin()
    startMusic()
    game.started = true
    game.startTime = performance.now()
    game.lastTime = game.startTime
    setStarted(true)
    rememberNoniContext({ nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    say('start')
  }, [hero, profile, say])

  useEffect(() => {
    if (!started) return undefined
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined
    const game = gameRef.current
    let stopped = false
    let raf = 0
    let hudTimer = 0
    let spawnInterval = 0
    let frame = 0
    artRef.current ||= makeArt()
    const art = artRef.current

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.round(WIDTH * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const spawn = () => {
      if (stopped || game.done || game.liveIds.size >= 5) return
      const id = game.nextId++
      const isZombie = random() < .32
      const target = isZombie
        ? { id, type: 'zombie', x: 970, y: FLOOR - 91, w: 68, h: 90, speed: 46 + random() * 22, frame: 0 }
        : (() => {
            const category = randomPassion(hero?.id || 'tech')
            const heights = [430, 330, 380]
            return { id, type: 'passion', category, label: randomChoice(PASSIONS[category]), x: 970, y: heights[Math.floor(random() * heights.length)], baseY: heights[Math.floor(random() * heights.length)], phase: random() * Math.PI * 2, w: 120, h: 60, speed: 22 }
          })()
      // Select the same three-level offset for both initial and base Y.
      if (target.type === 'passion') target.baseY = target.y
      game.targets.set(id, target)
      game.liveIds.add(id)
    }

    const removeTarget = (target) => {
      game.targets.delete(target.id)
      game.liveIds.delete(target.id)
    }

    const reload = (now) => {
      if (game.ammo === 12) return
      game.ammo = 12
      game.nextShotAt = Math.max(game.nextShotAt, now + 220)
      playReload()
      if (now - game.lastReloadLine >= 8000) { game.lastReloadLine = now; say('reload') }
    }

    const hitTarget = (target, now) => {
      game.hits += 1
      if (target.type === 'passion') {
        game.gemCounts[target.category] += 1
        game.passionHits += 1
        game.score += 500
        game.xp += 500
        game.streak += 1
        if (game.passionHits % 2 === 0) say('passionHit')
        if (game.streak === 3) say('streak')
      } else {
        game.zombieHits += 1
        game.score += 100
        game.freedom += 100
        game.streak = 0
        if (game.zombieHits % 2 === 0) say('zombieHit')
      }
      playExplosion()
      removeTarget(target)
      game.particles.push({ x: target.x + target.w / 2, y: target.y + target.h / 2, end: now + 320, color: target.type === 'zombie' ? '#ff456e' : GEM_CATEGORIES[target.category].color })
    }

    const takeDamage = (target, now) => {
      if (now < game.invulnerableUntil) return
      game.lives = Math.max(0, game.lives - 1)
      game.invulnerableUntil = now + 1000
      game.flashUntil = now + 260
      game.x = Math.max(40, game.x - 24)
      game.streak = 0
      target.x = game.x + 18
      target.speed = 0
      playExplosion()
      if (game.lives > 1) say('damage')
      if (game.lives === 1 && !game.lowLivesNotified) { game.lowLivesNotified = true; say('lowLives') }
      if (game.lives === 0) finishGame()
    }

    const keyDown = (event) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'r'].includes(key)) event.preventDefault()
      if (key === 'arrowleft' || key === 'a') game.input.left = true
      if (key === 'arrowright' || key === 'd') game.input.right = true
      if (key === ' ' ) game.input.fire = true
      if ((key === 'arrowup' || key === 'w') && game.onGround && !game.done) { game.vy = -640; game.onGround = false }
      if (key === 'r') reload(performance.now())
    }
    const keyUp = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') game.input.left = false
      if (key === 'arrowright' || key === 'd') game.input.right = false
      if (key === ' ') game.input.fire = false
    }
    const control = (event) => {
      const action = event.detail
      if (action === 'left') game.input.left = true
      if (action === 'right') game.input.right = true
      if (action === 'fire') game.input.fire = true
      if (action === 'reload') reload(performance.now())
      if (action === 'up' && game.onGround) { game.vy = -640; game.onGround = false }
      window.setTimeout(() => { if (action === 'left') game.input.left = false; if (action === 'right') game.input.right = false; if (action === 'fire') game.input.fire = false }, 180)
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('edunexa:arcade-control', control)
    spawnInterval = window.setInterval(spawn, 880)
    const stopHandle = () => stopMusic()
    window.addEventListener('pagehide', stopHandle)

    const draw = (now) => {
      if (stopped) return
      const dt = Math.min(.04, Math.max(0, (now - game.lastTime) / 1000))
      game.lastTime = now
      if (!game.done) {
        const elapsed = (now - game.startTime) / 1000
        if (elapsed >= 45) finishGame()
        if (!game.done) {
          if (game.input.left) game.x -= 230 * dt
          if (game.input.right) game.x += 230 * dt
          game.x = Math.max(40, Math.min(920 - HERO_WIDTH, game.x))
          if (!game.onGround) {
            game.vy += 1800 * dt
            game.y += game.vy * dt
            if (game.y >= FLOOR - HERO_HEIGHT) { game.y = FLOOR - HERO_HEIGHT; game.vy = 0; game.onGround = true }
          }
          if (game.input.fire && now >= game.nextShotAt) {
            if (game.ammo === 0) reload(now)
            else {
              game.ammo -= 1
              game.shots += 1
              game.nextShotAt = now + 220
              game.bullets.push({ x: game.x + 45, y: game.y + 32, vx: 700 })
              playShot()
            }
          }
          for (const bullet of game.bullets) bullet.x += bullet.vx * dt
          game.bullets = game.bullets.filter((bullet) => bullet.x < WIDTH)
          for (const target of game.targets.values()) {
            target.x -= target.speed * dt
            if (target.type === 'passion') target.y = target.baseY + Math.sin(now / 360 + target.phase) * 8
            if (target.type === 'zombie') target.frame = Math.floor(now / 180) % 2
            const heroBox = { left: game.x + 7, right: game.x + 42, top: game.y + 8, bottom: game.y + HERO_HEIGHT - 2 }
            const targetBox = target.type === 'zombie'
              ? { left: target.x + 18, right: target.x + 54, top: target.y + 8, bottom: target.y + target.h }
              : { left: target.x + 1, right: target.x + 53, top: target.y + 2, bottom: target.y + 54 }
            const overlap = heroBox.left < targetBox.right && heroBox.right > targetBox.left && heroBox.top < targetBox.bottom && heroBox.bottom > targetBox.top
            if (overlap && target.type === 'zombie' && (game.onGround || game.vy > 0)) takeDamage(target, now)
            for (let index = game.bullets.length - 1; index >= 0; index -= 1) {
              const bullet = game.bullets[index]
              if (bullet.x >= targetBox.left - 26 && bullet.x <= targetBox.right + 26 && bullet.y >= targetBox.top - 26 && bullet.y <= targetBox.bottom + 26) {
                game.bullets.splice(index, 1)
                hitTarget(target, now)
                break
              }
            }
            if (target.x < -target.w) removeTarget(target)
          }
          game.particles = game.particles.filter((particle) => particle.end > now)
        }
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.drawImage(art.background, 0, 0)
      for (const target of game.targets.values()) {
        if (target.type === 'zombie') ctx.drawImage(art.zombies[target.frame], target.x, target.y)
        else ctx.drawImage(art.orbs[target.category], target.x, target.y + Math.sin(now / 360 + target.phase) * 8)
      }
      for (const bullet of game.bullets) {
        ctx.fillStyle = '#fff486'; ctx.fillRect(bullet.x, bullet.y, 17, 4)
        ctx.fillStyle = '#ffb63f'; ctx.fillRect(bullet.x + 4, bullet.y + 1, 13, 2)
      }
      for (const particle of game.particles) {
        ctx.globalAlpha = Math.max(0, (particle.end - now) / 320)
        ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(particle.x, particle.y, 17, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
      const blinking = now < game.invulnerableUntil && Math.floor(now / 90) % 2 === 0
      if (!blinking) ctx.drawImage(art.heroFrames[Math.floor(now / 110) % 2], game.x, game.y)
      if (now < game.flashUntil) { ctx.fillStyle = 'rgba(255,39,70,.22)'; ctx.fillRect(0, 0, WIDTH, HEIGHT) }
      if (game.done) {
        ctx.fillStyle = 'rgba(12,23,34,.78)'; ctx.fillRect(0, 0, WIDTH, HEIGHT)
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 38px system-ui'; ctx.fillText(game.lives === 0 ? 'MISIÓN TERMINADA' : '¡MISIÓN COMPLETA!', WIDTH / 2, 245)
        ctx.fillStyle = '#ffe16a'; ctx.font = '700 18px system-ui'; ctx.fillText(`${game.score.toString().padStart(6, '0')} PUNTOS`, WIDTH / 2, 282)
      }
      if ((frame++ % 30) === 0) {
        const remaining = Math.max(0, 45 - (now - game.startTime) / 1000)
        setHud({ time: Math.ceil(remaining), score: game.score, xp: game.xp, freedom: game.freedom, lives: game.lives, ammo: game.ammo, noniLine: game.noniLine, done: game.done })
      }
      if (!game.done) raf = window.requestAnimationFrame(draw)
    }
    raf = window.requestAnimationFrame(draw)
    hudTimer = window.setInterval(() => {
      const elapsed = (performance.now() - game.startTime) / 1000
      setHud({ time: Math.max(0, Math.ceil(45 - elapsed)), score: game.score, xp: game.xp, freedom: game.freedom, lives: game.lives, ammo: game.ammo, noniLine: game.noniLine, done: game.done })
    }, 250)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
      window.clearInterval(spawnInterval)
      window.clearInterval(hudTimer)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('edunexa:arcade-control', control)
      window.removeEventListener('pagehide', stopHandle)
      stopMusic()
    }
  }, [started, hero, finishGame, say])

  useEffect(() => () => { stopMusic() }, [])

  const gems = Object.entries(hud && gameRef.current.gemCounts).filter(([, count]) => count > 0)
  return <section className="arcade2d-game" aria-label="Juego arcade 2D">
    <header className="arcade2d-heading"><div><p className="eyebrow">EDUNEXA ARCADE · IZTAPALAPA 2026</p><h2>CIUDAD <span>FUTURO</span></h2></div><span className="arcade2d-hero-chip">{hero?.icon || HERO.icon} {hero?.name || HERO.name}</span></header>
    <div className="arcade2d-hud" aria-live="polite">
      <div className="arcade2d-hud-item"><small>TIEMPO</small><strong>00:{String(hud.time).padStart(2, '0')}</strong></div>
      <div className="arcade2d-hud-item"><small>PTS</small><strong>{String(hud.score).padStart(6, '0')}</strong></div>
      <div className="arcade2d-hud-item"><small>XP</small><strong>{hud.xp}</strong></div>
      <div className="arcade2d-hud-item"><small>VIDAS</small><strong>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</strong></div>
      <div className="arcade2d-hud-item"><small>AMMO</small><strong>{String(hud.ammo).padStart(2, '0')} / 12</strong></div>
    </div>
    <div className="arcade2d-canvas-frame"><canvas ref={canvasRef} className="arcade2d-canvas" width={WIDTH} height={HEIGHT} aria-label="Ciudad Futuro, campo de juego" /></div>
    <div className="arcade2d-status"><p aria-live="polite">{hud.noniLine}</p><div><span>LIBERTAD <b>{hud.freedom}</b></span><span>RACHA <b>{gameRef.current.streak}</b></span>{gems.map(([category, count]) => <span key={category} style={{ color: GEM_CATEGORIES[category].color }}>{CATEGORY_SHORT[category]} <b>{count}</b></span>)}</div></div>
    {!started && <div className="arcade2d-start-overlay"><p className="eyebrow">MISIÓN DE ENTRENAMIENTO</p><h3>La ciudad te necesita.</h3><p>Corre, salta y dispara para encontrar tus pasiones. Evita a los zombies de oficina.</p><button type="button" onClick={startGame}>▶ JUGAR</button></div>}
    {hud.done && <div className="arcade2d-end-card"><strong>Tu puntuación: {hud.score}</strong><span>{hud.noniLine}</span><button type="button" onClick={() => window.location.reload()}>JUGAR DE NUEVO</button></div>}
    <p className="arcade2d-controls">← → / A D mover · ↑ / W saltar · ESPACIO disparar · R recargar</p>
  </section>
}
