import { useCallback, useEffect, useRef, useState } from 'react'
import { pickNoniLine, rememberNoniContext } from '../lib/noni'
import { playArcadeCallout, playCoin, playDamage, playExplosion, playNavigate, playReload, playShot, startMusic, stopMusic } from '../lib/audio'
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
const BOSSES = { tech: 'El Titán del Monolito Legacy', law: 'El Demonio del Litigio Eterno', design: 'El Espectro de la Copia Automatizada', business: 'El Monstruo de la Inflación', engineering: 'El Coloso de la Máquina Obsoleta', social: 'El Enjambre del Colapso Hospitalario', humanities: 'El Leviatán del Algoritmo Ciego' }

function canvasOf(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  draw(context, width, height)
  return canvas
}

function makeArt() {
  const skies = [
    ['#63c7ff', '#b8edff', '#fbe4af', '#fff1a6'],
    ['#fa9b70', '#f8bf8c', '#efc98f', '#ffe3a0'],
    ['#e66a73', '#d99077', '#9e6977', '#ffb55e'],
  ].map(([top, middle, horizon, sun]) => canvasOf(WIDTH, HEIGHT, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR)
    sky.addColorStop(0, top); sky.addColorStop(.64, middle); sky.addColorStop(1, horizon)
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, FLOOR)
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(760, 105, 43, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.56)'
    for (const [x, y, s] of [[130, 92, 1], [390, 135, .7], [820, 220, .6]]) {
      ctx.beginPath(); ctx.ellipse(x, y, 44 * s, 13 * s, 0, 0, Math.PI * 2); ctx.ellipse(x + 28 * s, y - 8 * s, 28 * s, 18 * s, 0, 0, Math.PI * 2); ctx.ellipse(x - 25 * s, y - 6 * s, 24 * s, 16 * s, 0, 0, Math.PI * 2); ctx.fill()
    }
    ctx.fillStyle = '#6a8a88'; ctx.fillRect(0, FLOOR - 8, WIDTH, 10)
    ctx.fillStyle = '#797b78'; ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR)
    ctx.fillStyle = '#b6b3a5'; ctx.fillRect(0, FLOOR, WIDTH, 7)
    ctx.fillStyle = '#d0c3a0'; for (let x = 20; x < WIDTH; x += 120) ctx.fillRect(x, FLOOR + 42, 57, 5)
  }))

  const far = canvasOf(1920, HEIGHT, (ctx) => {
    ctx.fillStyle = '#739d9b'; ctx.beginPath(); ctx.moveTo(0, 370); ctx.lineTo(170, 305); ctx.lineTo(315, 354); ctx.lineTo(460, 277); ctx.lineTo(640, 365); ctx.lineTo(770, 318); ctx.lineTo(980, 372); ctx.lineTo(1145, 300); ctx.lineTo(1300, 365); ctx.lineTo(1455, 288); ctx.lineTo(1620, 359); ctx.lineTo(1780, 320); ctx.lineTo(1920, 368); ctx.lineTo(1920, 470); ctx.lineTo(0, 470); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#456d64'; ctx.beginPath(); ctx.moveTo(160, 350); ctx.lineTo(315, 354); ctx.lineTo(460, 277); ctx.lineTo(640, 365); ctx.lineTo(770, 318); ctx.lineTo(980, 372); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff4d9'; ctx.font = 'bold 12px system-ui'; ctx.fillText('CERRO DE LA ESTRELLA', 367, 337)
    for (const x of [1020, 1590]) {
      ctx.fillStyle = '#d9e9db'; ctx.fillRect(x, 305, 104, 72); ctx.fillStyle = '#236b62'; ctx.fillRect(x + 8, 318, 88, 52); ctx.fillStyle = '#fff5d6'; ctx.font = 'bold 11px system-ui'; ctx.fillText('TecNM', x + 28, 340); ctx.font = 'bold 7px system-ui'; ctx.fillText('IZTAPALAPA', x + 22, 354)
    }
    ctx.fillStyle = '#6d9884'; ctx.fillRect(0, 402, 1920, 68)
  })

  const mid = canvasOf(1920, HEIGHT, (ctx) => {
    for (const [x, w, h, color] of [[35, 104, 128, '#b27664'], [170, 78, 96, '#d29a68'], [296, 125, 164, '#ca7962'], [466, 93, 119, '#e0ad72'], [610, 118, 154, '#b96659'], [780, 84, 111, '#d39a69'], [935, 116, 151, '#bd7869'], [1097, 91, 113, '#d8a273'], [1240, 136, 172, '#c1705e'], [1420, 100, 126, '#dcab73'], [1570, 119, 163, '#b9685b'], [1738, 125, 120, '#d5996d']]) {
      ctx.fillStyle = color; ctx.fillRect(x, FLOOR - h, w, h); ctx.fillStyle = 'rgba(255,232,185,.7)'
      for (let wy = FLOOR - h + 18; wy < FLOOR - 12; wy += 25) for (let wx = x + 13; wx < x + w - 9; wx += 25) ctx.fillRect(wx, wy, 9, 12)
    }
    // Taquería de barrio, painted into the middle parallax layer.
    ctx.fillStyle = '#f5e6bd'; ctx.fillRect(520, 350, 118, 74); ctx.fillStyle = '#cc463d'; ctx.fillRect(512, 336, 134, 23); ctx.fillStyle = '#fff7d9'; ctx.font = 'bold 13px system-ui'; ctx.fillText('TACOS', 553, 353)
    ctx.fillStyle = '#6f3b78'; ctx.fillRect(700, 367, 8, 54); ctx.fillStyle = '#5c8a63'
    for (const [x, y, r] of [[680, 355, 25], [709, 344, 31], [738, 358, 25]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = '#d79bd8'; for (const [x, y] of [[675, 345], [700, 326], [727, 345], [715, 362]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill() }
  })

  const near = canvasOf(1920, HEIGHT, (ctx) => {
    ctx.fillStyle = '#6f984e'
    for (const x of [45, 180, 355, 845, 1010, 1320, 1535, 1790]) { ctx.beginPath(); ctx.ellipse(x, 442, 42, 18, 0, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = '#738078'; ctx.fillRect(0, 451, 1920, 19); ctx.fillStyle = '#d2c6a6'; ctx.fillRect(0, 452, 1920, 4)
    for (const x of [120, 580, 1060, 1600]) { ctx.fillStyle = '#263e48'; ctx.fillRect(x, 417, 84, 28); ctx.fillStyle = '#f5d265'; ctx.font = 'bold 9px system-ui'; ctx.fillText('IZTAPALAPA', x + 5, 434) }
  })

  const platforms = canvasOf(1920, HEIGHT, (ctx) => {
    for (const x of [245, 785, 1285, 1740]) {
      ctx.fillStyle = '#776655'; ctx.fillRect(x, 400, 148, 12); ctx.fillStyle = '#c9a66a'; ctx.fillRect(x, 398, 148, 4)
      ctx.fillStyle = '#9bd5cb'; ctx.fillRect(x + 16, 403, 25, 3); ctx.fillRect(x + 78, 403, 25, 3)
    }
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

  const boss = canvasOf(190, 156, (ctx) => {
    ctx.fillStyle = '#374951'; ctx.fillRect(29, 47, 126, 96); ctx.fillStyle = '#778a88'; ctx.fillRect(39, 19, 108, 46)
    ctx.fillStyle = '#d7ddd2'; ctx.fillRect(36, 16, 114, 15); ctx.fillStyle = '#172934'; ctx.fillRect(50, 36, 15, 10); ctx.fillRect(118, 36, 15, 10)
    ctx.fillStyle = '#ffcc5b'; ctx.fillRect(57, 39, 6, 4); ctx.fillRect(124, 39, 6, 4)
    ctx.fillStyle = '#d54155'; ctx.beginPath(); ctx.moveTo(86, 65); ctx.lineTo(100, 65); ctx.lineTo(96, 121); ctx.lineTo(89, 106); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#26383f'; ctx.fillRect(12, 68, 28, 15); ctx.fillRect(144, 73, 32, 16); ctx.fillRect(46, 136, 35, 14); ctx.fillRect(112, 136, 35, 14)
    ctx.fillStyle = '#251c29'; ctx.fillRect(17, 79, 14, 14); ctx.fillRect(157, 87, 14, 14)
    ctx.fillStyle = '#f5d6a5'; ctx.fillRect(18, 8, 154, 12); ctx.fillStyle = '#9d1d39'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('JEFE: MONOLITO LEGACY', 95, 17)
  })

  const orbs = Object.fromEntries(CATEGORIES.map((category) => [category, canvasOf(120, 60, (ctx) => {
    const color = GEM_CATEGORIES[category].color
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(27, 27, 20, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.arc(20, 19, 6, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(26,42,56,.45)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = '#172331'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(CATEGORY_SHORT[category], 53, 30, 64)
  })]))

  return { skies, far, mid, near, platforms, heroFrames, zombies, boss, orbs }
}

function initialGame() {
  return {
    started: false, done: false, startTime: 0, lastTime: 0, worldDistance: 0, score: 0, xp: 0, freedom: 0, lives: 3,
    shots: 0, hits: 0, ammo: 12, x: 220, y: FLOOR - HERO_HEIGHT, vy: 0, onGround: true,
    invulnerableUntil: 0, flashUntil: 0, nextShotAt: 0, nextId: 1, spawnTimer: 0,
    targets: new Map(), liveIds: new Set(), bullets: [], particles: [], gemCounts: Object.fromEntries(CATEGORIES.map((key) => [key, 0])),
    passionHits: 0, zombieHits: 0, streak: 0, lowLivesNotified: false, lastReloadLine: -Infinity, input: { left: false, right: false, fire: false },
    wave: 1, banner: null, boss: null, bossSpawned: false, bossDefeatPending: false, lastBossLineAt: -Infinity,
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
  const startNoniTimerRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [hud, setHud] = useState({ time: 45, score: 0, xp: 0, freedom: 0, lives: 3, ammo: 12, wave: 1, progress: 0, bossHP: 4, bossName: BOSSES.tech, noniLine: gameRef.current.noniLine, done: false })
  callbackRef.current = { onGameComplete, onNoniUpdate }

  const say = useCallback((event, fixedLine = null) => {
    const game = gameRef.current
    const line = fixedLine || pickNoniLine(event, { nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    game.noniLine = `NONI: ${line}`
    callbackRef.current.onNoniUpdate?.({ text: line, id: performance.now() })
  }, [hero, profile])

  const finishGame = useCallback(() => {
    const game = gameRef.current
    if (game.done) return
    game.done = true
    window.clearTimeout(startNoniTimerRef.current)
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
    game.wave = 1
    game.banner = { title: 'MISSION 1 START', subtitle: 'AÑO 2026 · IZTAPALAPA', color: '#ffdf62', until: game.startTime + 2600 }
    setStarted(true)
    rememberNoniContext({ nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    playArcadeCallout('OK! MISSION 1: START!')
    window.clearTimeout(startNoniTimerRef.current)
    startNoniTimerRef.current = window.setTimeout(() => say('start'), 1450)
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
    let bossFinishTimer = 0
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
      if (stopped || game.done || game.bossDefeatPending) return
      const elapsed = (performance.now() - game.startTime) / 1000
      if (elapsed > 30 && !game.bossSpawned) {
        while (game.liveIds.size >= 4) {
          const oldest = [...game.targets.values()].find((target) => target.type !== 'boss')
          if (!oldest) break
          removeTarget(oldest)
        }
        const bossName = BOSSES[hero?.id] || BOSSES.tech
        game.boss = { id: game.nextId++, type: 'boss', x: 990, y: FLOOR - 156, w: 190, h: 156, speed: 54, hp: 4, name: bossName, retreatUntil: 0 }
        game.targets.set(game.boss.id, game.boss)
        game.liveIds.add(game.boss.id)
        game.bossSpawned = true
        game.lastBossLineAt = performance.now()
        say('bossAppear')
      }
      if (game.liveIds.size >= 5) return
      const id = game.nextId++
      const wave = elapsed < 15 ? 1 : elapsed < 30 ? 2 : 3
      const zombieChance = wave === 1 ? .32 : wave === 2 ? .27 : .24
      const isZombie = random() < zombieChance
      const target = isZombie
        ? { id, type: 'zombie', x: 970, y: FLOOR - 91, w: 68, h: 90, speed: 46 + random() * 22, frame: 0 }
        : (() => {
            const category = randomPassion(hero?.id || 'tech')
            const heights = [430, 330, 380]
            const y = heights[Math.floor(random() * heights.length)]
            return { id, type: 'passion', category, label: randomChoice(PASSIONS[category]), x: 970, y, baseY: y, phase: random() * Math.PI * 2, w: 120, h: 60, speed: 22 }
          })()
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
      if (target.type === 'boss') {
        if (target.hp <= 0 || game.bossDefeatPending) return
        target.hp -= 1
        game.score += 250
        playExplosion()
        game.particles.push({ x: target.x + target.w / 2, y: target.y + 72, end: now + 320, color: '#ff7894' })
        if (target.hp === 0) {
          game.bossDefeatPending = true
          game.input.fire = false
          say('bossDefeated')
          bossFinishTimer = window.setTimeout(() => finishGame(), 360)
        } else if (target.hp > 1 && now - game.lastBossLineAt >= 2000) {
          game.lastBossLineAt = now
          say('bossHit')
        }
        return
      }
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
      if (target.type === 'boss') {
        target.x = WIDTH + 100
        target.speed = 0
        target.retreatUntil = now + 2000
      } else {
        target.x = game.x + 18
        target.speed = 0
      }
      playDamage()
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
        const wave = elapsed < 15 ? 1 : elapsed < 30 ? 2 : 3
        if (wave !== game.wave) {
          game.wave = wave
          if (wave === 2) { game.banner = { title: 'OLA 2', subtitle: 'NUEVOS RETOS · NUEVAS PASIONES', color: '#42e7ff', until: now + 2300 }; playNavigate(); say('wave2') }
          if (wave === 3) { game.banner = { title: 'OLA 3 · JEFE FINAL', subtitle: BOSSES[hero?.id] || BOSSES.tech, color: '#ff668a', until: now + 2600 }; playNavigate(); say('wave3') }
        }
        game.worldDistance += dt * 72
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
            if (target.type === 'boss' && target.hp <= 0) continue
            if (target.type === 'boss' && target.retreatUntil && now < target.retreatUntil) target.x = WIDTH + 100
            else {
              if (target.type === 'boss' && target.retreatUntil) { target.retreatUntil = 0; target.x = WIDTH + 60; target.speed = 54 }
              target.x -= target.speed * dt
            }
            if (target.type === 'passion') target.y = target.baseY + Math.sin(now / 360 + target.phase) * 8
            if (target.type === 'zombie') target.frame = Math.floor(now / 180) % 2
            const heroBox = { left: game.x + 7, right: game.x + 42, top: game.y + 8, bottom: game.y + HERO_HEIGHT - 2 }
            const targetBox = target.type === 'boss'
              ? { left: target.x + 20, right: target.x + 174, top: target.y + 10, bottom: target.y + target.h }
              : target.type === 'zombie'
              ? { left: target.x + 18, right: target.x + 54, top: target.y + 8, bottom: target.y + target.h }
              : { left: target.x + 1, right: target.x + 53, top: target.y + 2, bottom: target.y + 54 }
            const overlap = heroBox.left < targetBox.right && heroBox.right > targetBox.left && heroBox.top < targetBox.bottom && heroBox.bottom > targetBox.top
            if (overlap && (target.type === 'zombie' || target.type === 'boss') && (game.onGround || game.vy > 0)) takeDamage(target, now)
            for (let index = game.bullets.length - 1; index >= 0; index -= 1) {
              const bullet = game.bullets[index]
              if (bullet.x >= targetBox.left - 26 && bullet.x <= targetBox.right + 26 && bullet.y >= targetBox.top - 26 && bullet.y <= targetBox.bottom + 26) {
                game.bullets.splice(index, 1)
                hitTarget(target, now)
                break
              }
            }
            if (target.type !== 'boss' && target.x < -target.w) removeTarget(target)
          }
          game.particles = game.particles.filter((particle) => particle.end > now)
        }
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      const waveIndex = Math.max(0, Math.min(2, game.wave - 1))
      ctx.drawImage(art.skies[waveIndex], 0, 0)
      const drawLayer = (layer, speed) => {
        const offset = (game.worldDistance * speed) % layer.width
        ctx.drawImage(layer, -offset, 0)
        ctx.drawImage(layer, layer.width - offset, 0)
      }
      drawLayer(art.far, .15)
      drawLayer(art.mid, .4)
      drawLayer(art.platforms, .4)
      drawLayer(art.near, .8)
      for (const target of game.targets.values()) {
        if (target.type === 'boss') {
          if (target.hp > 0 && target.x < WIDTH + 140) ctx.drawImage(art.boss, target.x, target.y)
          continue
        }
        if (target.type === 'zombie') ctx.drawImage(art.zombies[target.frame], target.x, target.y)
        else ctx.drawImage(art.orbs[target.category], target.x, target.y)
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
      if (game.banner && now < game.banner.until) {
        ctx.fillStyle = 'rgba(12,25,36,.84)'; ctx.fillRect(265, 68, 430, 82)
        ctx.strokeStyle = game.banner.color; ctx.lineWidth = 2; ctx.strokeRect(265, 68, 430, 82)
        ctx.textAlign = 'center'; ctx.fillStyle = game.banner.color; ctx.font = '900 27px system-ui'; ctx.fillText(game.banner.title, WIDTH / 2, 103)
        ctx.fillStyle = '#f8f6ea'; ctx.font = '700 12px system-ui'; ctx.fillText(game.banner.subtitle, WIDTH / 2, 129)
      }
      if (game.done) {
        ctx.fillStyle = 'rgba(12,23,34,.78)'; ctx.fillRect(0, 0, WIDTH, HEIGHT)
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 38px system-ui'; ctx.fillText(game.lives === 0 ? 'MISIÓN TERMINADA' : '¡MISIÓN COMPLETA!', WIDTH / 2, 245)
        ctx.fillStyle = '#ffe16a'; ctx.font = '700 18px system-ui'; ctx.fillText(`${game.score.toString().padStart(6, '0')} PUNTOS`, WIDTH / 2, 282)
      }
      if (!game.done) raf = window.requestAnimationFrame(draw)
    }
    raf = window.requestAnimationFrame(draw)
    hudTimer = window.setInterval(() => {
      const elapsed = (performance.now() - game.startTime) / 1000
      setHud({ time: Math.max(0, Math.ceil(45 - elapsed)), score: game.score, xp: game.xp, freedom: game.freedom, lives: game.lives, ammo: game.ammo, wave: game.wave, progress: Math.min(1, elapsed / 45), bossHP: game.boss?.hp ?? 4, bossName: game.boss?.name || BOSSES[hero?.id] || BOSSES.tech, noniLine: game.noniLine, done: game.done })
    }, 250)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
      window.clearInterval(spawnInterval)
      window.clearInterval(hudTimer)
      window.clearTimeout(bossFinishTimer)
      window.clearTimeout(startNoniTimerRef.current)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('edunexa:arcade-control', control)
      window.removeEventListener('pagehide', stopHandle)
      stopMusic()
    }
  }, [started, hero, finishGame, say])

  useEffect(() => () => { window.clearTimeout(startNoniTimerRef.current); stopMusic() }, [])

  const gems = Object.entries(hud && gameRef.current.gemCounts).filter(([, count]) => count > 0)
  return <section className="arcade2d-game" aria-label="Juego arcade 2D">
    <header className="arcade2d-heading"><div><p className="eyebrow">EDUNEXA ARCADE · IZTAPALAPA 2026</p><h2>CIUDAD <span>FUTURO</span></h2></div><span className="arcade2d-hero-chip">{hero?.icon || HERO.icon} {hero?.name || HERO.name}</span></header>
    <div className="arcade2d-mission-progress" aria-label={`Progreso de misión: ${Math.round(hud.progress * 100)} por ciento`}>
      <div className="arcade2d-progress-track"><span className="arcade2d-progress-fill" style={{ width: `${hud.progress * 100}%` }} /><i className="arcade2d-boss-marker" aria-label="Jefe final, segundo 30" /><b className="arcade2d-hero-marker" style={{ left: `${hud.progress * 100}%` }}>{hero?.icon || HERO.icon}</b></div>
      <div className="arcade2d-progress-labels"><span>0:00 · MISIÓN 1</span><span>0:15 · OLA 2</span><span>0:30 · JEFE FINAL</span><span>0:45</span></div>
    </div>
    <div className="arcade2d-hud" aria-live="polite">
      <div className="arcade2d-hud-item"><small>OLA</small><strong>{hud.wave} / 3</strong></div>
      <div className="arcade2d-hud-item"><small>PTS</small><strong>{String(hud.score).padStart(6, '0')}</strong></div>
      <div className="arcade2d-hud-item"><small>XP</small><strong>{hud.xp}</strong></div>
      <div className="arcade2d-hud-item"><small>VIDAS</small><strong>{'♥'.repeat(hud.lives)}{'♡'.repeat(3 - hud.lives)}</strong></div>
      <div className="arcade2d-hud-item"><small>AMMO</small><strong>{String(hud.ammo).padStart(2, '0')} / 12</strong></div>
      <div className="arcade2d-hud-item"><small>LIBERTAD</small><strong>{hud.freedom}</strong></div>
      <div className="arcade2d-hud-item"><small>TIEMPO</small><strong>00:{String(hud.time).padStart(2, '0')}</strong></div>
    </div>
    {hud.wave === 3 && <div className="arcade2d-boss-health" aria-label={`${hud.bossName}, ${hud.bossHP} de 4 vidas`}><strong>{hud.bossName}</strong><div>{[0, 1, 2, 3].map((segment) => <i className={segment < hud.bossHP ? 'is-active' : ''} key={segment} />)}</div><small>{hud.bossHP} / 4 HP</small></div>}
    <div className="arcade2d-canvas-frame"><canvas ref={canvasRef} className="arcade2d-canvas" width={WIDTH} height={HEIGHT} aria-label="Ciudad Futuro, campo de juego" /></div>
    <div className="arcade2d-status"><p aria-live="polite">{hud.noniLine}</p><div><span>LIBERTAD <b>{hud.freedom}</b></span><span>RACHA <b>{gameRef.current.streak}</b></span>{gems.map(([category, count]) => <span key={category} style={{ color: GEM_CATEGORIES[category].color }}>{CATEGORY_SHORT[category]} <b>{count}</b></span>)}</div></div>
    {!started && <div className="arcade2d-start-overlay"><p className="eyebrow">MISIÓN DE ENTRENAMIENTO</p><h3>La ciudad te necesita.</h3><p>Corre, salta y dispara para encontrar tus pasiones. Evita a los zombies de oficina.</p><button type="button" onClick={startGame}>▶ JUGAR</button></div>}
    {hud.done && <div className="arcade2d-end-card"><strong>Tu puntuación: {hud.score}</strong><span>{hud.noniLine}</span><button type="button" onClick={() => window.location.reload()}>JUGAR DE NUEVO</button></div>}
    <p className="arcade2d-controls">← → / A D mover · ↑ / W saltar · ESPACIO disparar · R recargar</p>
  </section>
}
