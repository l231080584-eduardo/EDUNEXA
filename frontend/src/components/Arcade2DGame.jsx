import { useCallback, useEffect, useRef, useState } from 'react'
import { pickNoniLine, rememberNoniContext } from '../lib/noni'
import { playArcadeCallout, playDamage, playExplosion, playNavigate, playReload } from '../lib/audio'
import { getArcadeMuted, playArcadeSfx, playHeroWeaponSfx, startArcadeMusic, stopArcadeMusic, subscribeArcadeMute, toggleArcadeMuted } from '../lib/arcadeAudio'
import { random, randomChoice } from '../lib/random'
import { GEM_CATEGORIES, HERO_SPRITES } from '../data/careers'
import { prepareArcadeSprite, prepareArcadeSpriteStrip, recolorStudentHoodie } from '../lib/spriteProcessor'
import { speakAsHero, speakAsMoros, speakAsNoni } from '../lib/voiceEngine'
import { CAMPUS_PLATFORMS, createMetalSlugRig, PLAYER_STATE, stepMetalSlugRig } from '../lib/metalSlugRig'

const WIDTH = 960
const HEIGHT = 540
const BACKDROP_WIDTH = WIDTH * 2
const FLOOR = 470
const HERO_WIDTH = 72
const HERO_HEIGHT = 124
const MISSION_SECONDS = 40
const WAVE_TWO_START = 10
const BOSS_START = 20
const COLOSSUS_START = 16
const MAGAZINE_SIZE = 30
const CATEGORIES = ['tech', 'industry', 'construction', 'energy', 'business', 'life']
const CATEGORY_SHORT = { tech: 'TECNOLOGÍA', industry: 'INDUSTRIA', construction: 'OBRA', energy: 'ENERGÍA', business: 'NEGOCIOS', life: 'VIDA' }
const PASSIONS = {
  tech: ['Sistemas', 'Inteligencia artificial', 'Ciencia de Datos'], industry: ['Robótica', 'Mecatrónica', 'Procesos industriales'],
  construction: ['Arquitectura', 'Diseño Industrial', 'Infraestructura'], energy: ['Energías renovables', 'Electrónica', 'Sustentabilidad'],
  business: ['Logística', 'Gestión de proyectos', 'Emprendimiento'], life: ['Bioquímica', 'Biomédica', 'Biología'],
}
const HERO = { id: 'tech', name: 'La Guardiana del Código', area: 'Tecnología', color: '#55e8ff', icon: '⌘', sprite: HERO_SPRITES.tech }
const HERO_RUN_SPRITES = {
  tech: '/assets/heroe-tecnologia-run-strip.png', industry: '/assets/heroe-industria-run-strip.png',
  construction: '/assets/heroe-construccion-run-strip.png', energy: '/assets/heroe-energia-run-strip.png',
  business: '/assets/heroe-negocios-run-strip.png', life: '/assets/heroe-vida-run-strip.png',
}
const BOSSES = Object.fromEntries(CATEGORIES.map((category) => [category, 'MOROS · EL DEVORADOR DE FUTUROS']))
const MOROS_DIALOGUES = {
  appear: ['¡Mira quién llegó! ¿Trajiste un plan o solo mucho entusiasmo?', 'Bienvenido a mi dominio, piloto. La salida está... por allá. Creo.', '¿Tú contra mí? Me gusta tu confianza. Me va a dar mucha risa.'],
  strike: ['¿Ese era tu gran ataque? He sentido brisas con más impacto.', '¡Auch! Bueno... no. Pero casi me convences.', '¿Disparas así en los exámenes también? ¡Apunta mejor!', 'Vas bien, piloto. Para alguien que todavía está descubriendo su camino.'],
  attack: ['¡Quieto ahí! Quiero ver esa cara cuando esquives esto.', '¡Ahí va mi saludo! No hace falta que me lo agradezcas.', '¿Listo para correr? Porque yo ya empecé.'],
  dash: ['¡A que no me alcanzas! Bueno, técnicamente yo te alcanzo a ti.', '¡Voy por ti! Corre, piloto, corre.', '¿Te gusta la velocidad? ¡Esta clase es intensiva!'],
  dodge: ['¡Buen salto! Casi me impresionas. Casi.', 'Uy, eso estuvo cerca. ¿Practicaste o fue suerte?', '¡Te me escapaste! Disfruta ese segundo.'],
  defeated: ['¡¿Qué?! Bueno, ganaste esta ronda. No te emociones... nos vemos en tu próximo desafío.', 'Está bien, piloto. Esta vez te la llevas. Veamos qué camino eliges ahora.', '¡Ja! Me venciste... y de paso descubriste algo sobre ti. Qué fastidio que eso funcione.'],
}

function giveMorosLine(game, event, now = performance.now(), force = false) {
  if (!force && now - game.lastMorosTauntAt < 5200) return false
  game.morosLine = randomChoice(MOROS_DIALOGUES[event])
  game.morosLineUntil = now + 4300
  game.lastMorosTauntAt = now
  speakAsMoros(game.morosLine)
  return true
}

function canvasOf(width, height, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  draw(context, width, height)
  return canvas
}

function makeArt(hero = HERO) {
  const skies = [
    ['#63c7ff', '#b8edff', '#fbe4af', '#fff1a6'],
    ['#fa9b70', '#f8bf8c', '#efc98f', '#ffe3a0'],
    ['#100912', '#37111f', '#21121c', '#b72d3c'],
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
    const domain = top === '#100912'
    ctx.fillStyle = domain ? '#17131b' : '#797b78'; ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR)
    ctx.fillStyle = domain ? '#bc3447' : '#b6b3a5'; ctx.fillRect(0, FLOOR, WIDTH, 7)
    ctx.fillStyle = domain ? '#47202c' : '#d0c3a0'; for (let x = 20; x < WIDTH; x += 120) ctx.fillRect(x, FLOOR + 42, 57, 5)
  }))

  const campusBackground = canvasOf(BACKDROP_WIDTH, HEIGHT, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, '#342a52'); sky.addColorStop(.58, '#e77762'); sky.addColorStop(1, '#34202b')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, BACKDROP_WIDTH, HEIGHT)
  })
  const campusImage = new Image()
  campusImage.decoding = 'async'
  campusImage.onload = () => {
    const context = campusBackground.getContext('2d')
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, BACKDROP_WIDTH, HEIGHT)
    context.drawImage(campusImage, 0, 0, BACKDROP_WIDTH, HEIGHT)
  }
  campusImage.src = '/assets/edunexa-campus-panorama.png'
  const domainBackground = canvasOf(BACKDROP_WIDTH, HEIGHT, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT)
    sky.addColorStop(0, '#100914'); sky.addColorStop(.7, '#30101e'); sky.addColorStop(1, '#1a1018')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, BACKDROP_WIDTH, HEIGHT)
  })
  const domainImage = new Image()
  domainImage.decoding = 'async'
  domainImage.onload = () => {
    const context = domainBackground.getContext('2d')
    context.imageSmoothingEnabled = false
    context.clearRect(0, 0, BACKDROP_WIDTH, HEIGHT)
    context.drawImage(domainImage, 0, 0, BACKDROP_WIDTH, HEIGHT)
  }
  domainImage.src = '/assets/edunexa-campus-moros-panorama.png'

  const far = canvasOf(1920, HEIGHT, (ctx) => {
    ctx.fillStyle = '#739d9b'; ctx.beginPath(); ctx.moveTo(0, 370); ctx.lineTo(170, 305); ctx.lineTo(315, 354); ctx.lineTo(460, 277); ctx.lineTo(640, 365); ctx.lineTo(770, 318); ctx.lineTo(980, 372); ctx.lineTo(1145, 300); ctx.lineTo(1300, 365); ctx.lineTo(1455, 288); ctx.lineTo(1620, 359); ctx.lineTo(1780, 320); ctx.lineTo(1920, 368); ctx.lineTo(1920, 470); ctx.lineTo(0, 470); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#456d64'; ctx.beginPath(); ctx.moveTo(160, 350); ctx.lineTo(315, 354); ctx.lineTo(460, 277); ctx.lineTo(640, 365); ctx.lineTo(770, 318); ctx.lineTo(980, 372); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff4d9'; ctx.font = 'bold 12px system-ui'; ctx.fillText('CERRO DE LA ESTRELLA', 367, 337)
    for (const x of [1020, 1590]) {
      ctx.fillStyle = '#d9e9db'; ctx.fillRect(x, 305, 104, 72); ctx.fillStyle = '#236b62'; ctx.fillRect(x + 8, 318, 88, 52); ctx.fillStyle = '#fff5d6'; ctx.font = 'bold 11px system-ui'; ctx.fillText('TecNM', x + 28, 340); ctx.font = 'bold 7px system-ui'; ctx.fillText('IZTAPALAPA', x + 22, 354)
    }
    ctx.fillStyle = '#6d9884'; ctx.fillRect(0, 402, 1920, 68)
    // Add distant rooftops, antennas and smoke silhouettes to give the parallax a lived-in city skyline.
    ctx.fillStyle = '#426e70'
    for (const [x, y, w, h] of [[80, 365, 96, 38], [260, 348, 78, 54], [710, 356, 130, 46], [880, 341, 88, 61], [1320, 354, 116, 48], [1685, 346, 102, 58]]) {
      ctx.fillRect(x, y, w, h); ctx.fillRect(x + 10, y - 9, w - 20, 10)
      ctx.fillStyle = '#34585e'
      for (let wx = x + 11; wx < x + w - 8; wx += 21) for (let wy = y + 9; wy < y + h - 4; wy += 17) ctx.fillRect(wx, wy, 6, 8)
      ctx.fillStyle = '#426e70'
    }
    ctx.fillStyle = '#314d59'
    for (const [x, y, h] of [[210, 333, 28], [640, 340, 34], [1110, 328, 39], [1500, 336, 30], [1820, 330, 42]]) { ctx.fillRect(x, y - h, 5, h); ctx.fillRect(x - 6, y - h, 17, 4) }
  })

  const mid = canvasOf(1920, HEIGHT, (ctx) => {
    for (const [x, w, h, color] of [[35, 104, 128, '#b27664'], [170, 78, 96, '#d29a68'], [296, 125, 164, '#ca7962'], [466, 93, 119, '#e0ad72'], [610, 118, 154, '#b96659'], [780, 84, 111, '#d39a69'], [935, 116, 151, '#bd7869'], [1097, 91, 113, '#d8a273'], [1240, 136, 172, '#c1705e'], [1420, 100, 126, '#dcab73'], [1570, 119, 163, '#b9685b'], [1738, 125, 120, '#d5996d']]) {
      ctx.fillStyle = color; ctx.fillRect(x, FLOOR - h, w, h); ctx.fillStyle = 'rgba(255,232,185,.7)'
      for (let wy = FLOOR - h + 18; wy < FLOOR - 12; wy += 25) for (let wx = x + 13; wx < x + w - 9; wx += 25) ctx.fillRect(wx, wy, 9, 12)
    }
    // Neon campus relay, integrated into the city rather than a flat storefront.
    ctx.fillStyle = '#172a37'; ctx.fillRect(520, 337, 118, 87); ctx.fillStyle = '#203c49'; ctx.fillRect(527, 345, 104, 73)
    ctx.fillStyle = '#46e9ed'; for (let wy = 355; wy < 405; wy += 18) for (let wx = 537; wx < 623; wx += 22) ctx.fillRect(wx, wy, 9, 8)
    ctx.fillStyle = '#311324'; ctx.fillRect(526, 325, 106, 17); ctx.fillStyle = '#ff5571'; ctx.font = 'bold 11px monospace'; ctx.fillText('NEXO-01', 548, 338)
    ctx.fillStyle = '#6f3b78'; ctx.fillRect(700, 367, 8, 54); ctx.fillStyle = '#5c8a63'
    for (const [x, y, r] of [[680, 355, 25], [709, 344, 31], [738, 358, 25]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = '#d79bd8'; for (const [x, y] of [[675, 345], [700, 326], [727, 345], [715, 362]]) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill() }
    // Layered street-level detail: rooftop tanks, cables, signs, vents and broken masonry.
    ctx.strokeStyle = '#463d3b'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(0, 331); ctx.lineTo(290, 336); ctx.lineTo(520, 327); ctx.lineTo(810, 333); ctx.lineTo(1100, 326); ctx.lineTo(1430, 334); ctx.lineTo(1920, 329); ctx.stroke()
    for (const [x, y] of [[154, 336], [430, 329], [864, 334], [1180, 328], [1640, 333]]) { ctx.fillStyle = '#39353a'; ctx.fillRect(x, y, 4, 98); ctx.fillRect(x - 9, y + 18, 22, 8) }
    for (const [x, y] of [[92, 383], [364, 388], [918, 382], [1154, 385], [1472, 379], [1810, 390]]) {
      ctx.fillStyle = '#252a31'; ctx.fillRect(x, y, 44, 25); ctx.fillStyle = '#826852'; ctx.fillRect(x + 4, y + 4, 36, 4)
      ctx.fillStyle = '#ffb450'; ctx.fillRect(x + 8, y + 12, 5, 8); ctx.fillRect(x + 20, y + 12, 5, 8); ctx.fillRect(x + 32, y + 12, 5, 8)
    }
  })

  const near = canvasOf(1920, HEIGHT, (ctx) => {
    ctx.fillStyle = '#6f984e'
    for (const x of [45, 180, 355, 845, 1010, 1320, 1535, 1790]) { ctx.beginPath(); ctx.ellipse(x, 442, 42, 18, 0, 0, Math.PI * 2); ctx.fill() }
    ctx.fillStyle = '#738078'; ctx.fillRect(0, 451, 1920, 19); ctx.fillStyle = '#d2c6a6'; ctx.fillRect(0, 452, 1920, 4)
    for (const x of [120, 580, 1060, 1600]) { ctx.fillStyle = '#263e48'; ctx.fillRect(x, 417, 84, 28); ctx.fillStyle = '#f5d265'; ctx.font = 'bold 9px system-ui'; ctx.fillText('IZTAPALAPA', x + 5, 434) }
    ctx.fillStyle = '#354144'
    for (const [x, y, w, h] of [[250, 439, 76, 12], [708, 442, 95, 9], [1220, 437, 68, 14], [1705, 441, 108, 10]]) { ctx.fillRect(x, y, w, h); ctx.fillStyle = '#92917f'; ctx.fillRect(x + 5, y + 3, w - 15, 2); ctx.fillStyle = '#354144' }
    ctx.fillStyle = '#b83e35'; for (const [x, y] of [[520, 449], [975, 446], [1385, 450], [1880, 445]]) { ctx.fillRect(x, y, 7, 2); ctx.fillRect(x + 12, y + 5, 4, 2) }
  })

  const domain = canvasOf(WIDTH, HEIGHT, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR); sky.addColorStop(0, '#07050d'); sky.addColorStop(.58, '#210b18'); sky.addColorStop(1, '#57152b')
    ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, FLOOR)
    ctx.fillStyle = 'rgba(213,31,57,.18)'; ctx.beginPath(); ctx.arc(710, 135, 105, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#100b13'; ctx.beginPath(); ctx.moveTo(0, 365); ctx.lineTo(145, 310); ctx.lineTo(195, 350); ctx.lineTo(278, 270); ctx.lineTo(360, 360); ctx.lineTo(510, 293); ctx.lineTo(614, 360); ctx.lineTo(756, 258); ctx.lineTo(865, 350); ctx.lineTo(960, 314); ctx.lineTo(960, 470); ctx.lineTo(0, 470); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#08070d'; ctx.beginPath(); ctx.moveTo(310, 374); ctx.lineTo(382, 278); ctx.lineTo(454, 374); ctx.closePath(); ctx.fill(); ctx.fillRect(336, 374, 92, 35)
    ctx.fillStyle = '#24202a'; ctx.fillRect(0, FLOOR, WIDTH, HEIGHT - FLOOR)
    ctx.fillStyle = '#b42d42'; ctx.fillRect(0, FLOOR, WIDTH, 5)
    ctx.strokeStyle = 'rgba(189,45,64,.55)'; ctx.lineWidth = 2
    for (const x of [80, 228, 412, 585, 744, 908]) { ctx.beginPath(); ctx.moveTo(x, 475); ctx.lineTo(x - 16, 497); ctx.lineTo(x + 9, 514); ctx.lineTo(x - 2, 540); ctx.stroke() }
    ctx.fillStyle = '#45404a'; for (let x = 18; x < WIDTH; x += 74) { ctx.beginPath(); ctx.moveTo(x, 514); ctx.lineTo(x + 15, 508); ctx.lineTo(x + 26, 517); ctx.lineTo(x + 51, 521); ctx.lineTo(x + 56, 540); ctx.lineTo(x - 4, 540); ctx.fill() }
  })

  const platforms = canvasOf(1920, HEIGHT, (ctx) => {
    for (const x of [245, 785, 1285, 1740]) {
      ctx.fillStyle = '#776655'; ctx.fillRect(x, 400, 148, 12); ctx.fillStyle = '#c9a66a'; ctx.fillRect(x, 398, 148, 4)
      ctx.fillStyle = '#9bd5cb'; ctx.fillRect(x + 16, 403, 25, 3); ctx.fillRect(x + 78, 403, 25, 3)
    }
  })

  const makeHeroSheet = (pose) => {
    const frames = Array.from({ length: 6 }, (_, frame) => canvasOf(HERO_WIDTH * 2, HERO_HEIGHT * 2, (ctx) => {
    ctx.scale(2, 2)
    const accent = hero?.color || '#55e8ff'
    const stride = pose === 'run' ? [-2, 0, 3, 5, 2, -1][frame] : 0
    const bob = pose === 'idle' ? [0, -1, -2, -1, 0, 1][frame] : pose === 'jump' ? -8 + frame : 0
    const attack = pose === 'attack'
    const fallen = pose === 'die'
    ctx.globalAlpha = fallen ? Math.max(.35, 1 - frame * .1) : 1
    if (fallen) ctx.translate(frame * 1.5, 12)
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(7, 59, 38, 4)
    ctx.fillStyle = '#263643'
    ctx.fillRect(13, 42 + stride + bob, 9, 16 - Math.max(0, stride))
    ctx.fillRect(27, 42 - stride + bob, 9, 16 + Math.max(0, stride))
    ctx.fillStyle = '#161f2c'; ctx.fillRect(9, 56 + stride + bob, 15, 6); ctx.fillRect(25, 56 - stride + bob, 15, 6)
    ctx.fillStyle = '#8d6b3e'; ctx.fillRect(10, 25 + bob, 30, 22)
    ctx.fillStyle = accent; ctx.fillRect(12, 27 + bob, 26, 18)
    ctx.fillStyle = '#172b38'; ctx.fillRect(8, 30 + bob, 9, 15)
    ctx.fillStyle = '#e6b88f'; ctx.fillRect(17, 11 + bob, 20, 18)
    ctx.fillStyle = '#1b2431'; ctx.fillRect(13, 7 + bob, 28, 9); ctx.fillRect(9, 13 + bob, 12, 4)
    ctx.fillStyle = '#7c292d'; ctx.fillRect(16, 8 + bob, 6, 4); ctx.fillRect(31, 7 + bob, 6, 5)
    ctx.fillStyle = '#fff0c2'; ctx.fillRect(23, 17 + bob, 3, 3)
    ctx.fillStyle = '#361e20'; ctx.fillRect(19, 22 + bob, 7, 2); ctx.fillRect(25, 24 + bob, 5, 2)
    if (hero?.id === 'industry') {
      ctx.fillStyle = '#9c6034'; ctx.fillRect(40, 31 + bob, 4, 16); ctx.fillStyle = '#c3a06a'; ctx.fillRect(34, 27 + bob, 14, 8); ctx.fillStyle = accent; ctx.fillRect(35, 28 + bob, 12, 2)
    } else if (hero?.id === 'construction') {
      ctx.fillStyle = '#8e6537'; ctx.fillRect(41, 32 + bob, 3, 14); ctx.fillStyle = '#d4b677'; ctx.fillRect(35, 29 + bob, 13, 14); ctx.fillStyle = '#4d4237'; ctx.fillRect(38, 32 + bob, 7, 7)
    } else if (hero?.id === 'energy') {
      ctx.fillStyle = '#80552b'; ctx.fillRect(41, 29 + bob, 3, 19); ctx.fillStyle = accent; ctx.fillRect(38, 27 + bob, 8, 4); ctx.fillRect(35, 31 + bob, 5, 4); ctx.fillRect(41, 35 + bob, 5, 4)
    } else if (hero?.id === 'business') {
      ctx.fillStyle = '#2a5546'; ctx.fillRect(41, 29 + bob, 3, 18); ctx.fillStyle = accent; ctx.fillRect(35, 28 + bob, 11, 8); ctx.fillStyle = '#d5e6bd'; ctx.fillRect(37, 30 + bob, 6, 2)
    } else if (hero?.id === 'life') {
      ctx.fillStyle = '#76582d'; ctx.fillRect(41, 27 + bob, 3, 21); ctx.fillStyle = '#76bd69'; ctx.fillRect(35, 27 + bob, 6, 4); ctx.fillRect(44, 30 + bob, 5, 4); ctx.fillRect(36, 36 + bob, 5, 3)
    } else {
      ctx.fillStyle = '#273949'; ctx.fillRect(35, 31 + bob, attack ? 10 : 13, 5); ctx.fillRect(44, (attack ? 27 : 29) + bob, 4, 6)
      ctx.fillStyle = accent; ctx.fillRect(39, 32 + bob, 7, 2)
    }
    if (hero?.id === 'life') { ctx.fillStyle = '#4f8f4f'; ctx.fillRect(12, 20 + bob, 4, 5); ctx.fillRect(37, 19 + bob, 4, 5) }
    if (hero?.id === 'energy') { ctx.fillStyle = '#fff07a'; ctx.fillRect(5, 22 + bob, 3, 6); ctx.fillRect(4, 25 + bob, 6, 3) }
    if (hero?.id === 'construction') { ctx.fillStyle = '#d5b776'; ctx.fillRect(11, 23 + bob, 28, 3) }
    if (hero?.id === 'industry') { ctx.fillStyle = '#6b6261'; ctx.fillRect(9, 36 + bob, 5, 8); ctx.fillRect(37, 36 + bob, 5, 8) }
    if (hero?.id === 'business') { ctx.fillStyle = '#53b883'; ctx.fillRect(16, 21 + bob, 17, 3) }
    }))
    const image = canvasOf(HERO_WIDTH * 2 * frames.length, HERO_HEIGHT * 2, (ctx) => frames.forEach((frame, index) => ctx.drawImage(frame, index * HERO_WIDTH * 2, 0)))
    return { image, frameCount: frames.length, frameWidth: HERO_WIDTH * 2, frameHeight: HERO_HEIGHT * 2 }
  }
  const heroFrames = { idle: makeHeroSheet('idle'), run: makeHeroSheet('run'), jump: makeHeroSheet('jump'), attack: makeHeroSheet('attack'), die: makeHeroSheet('die') }

  const shadowCore = canvasOf(136, 100, (ctx) => {
    const aura = ctx.createRadialGradient(68, 55, 4, 68, 55, 52); aura.addColorStop(0, '#c52a48a8'); aura.addColorStop(1, '#24081700'); ctx.fillStyle = aura; ctx.fillRect(10, 2, 116, 96)
    ctx.fillStyle = '#18121f'; ctx.fillRect(38, 17, 60, 44); ctx.fillRect(30, 28, 12, 29); ctx.fillRect(94, 28, 12, 29)
    ctx.fillStyle = '#392235'; ctx.fillRect(45, 10, 46, 13); ctx.fillRect(50, 5, 10, 9); ctx.fillRect(75, 5, 10, 9)
    ctx.fillStyle = '#ed385a'; ctx.fillRect(49, 34, 14, 5); ctx.fillRect(74, 34, 14, 5); ctx.fillStyle = '#fff1bd'; ctx.fillRect(53, 35, 6, 2); ctx.fillRect(78, 35, 6, 2)
    ctx.fillStyle = '#311a2d'; ctx.fillRect(44, 59, 48, 20); ctx.fillRect(39, 77, 20, 17); ctx.fillRect(77, 77, 20, 17)
    ctx.fillStyle = '#bd334c'; ctx.fillRect(63, 57, 10, 20); ctx.fillRect(33, 39, 9, 4); ctx.fillRect(94, 39, 9, 4)
  })
  const drone = canvasOf(96, 58, (ctx) => {
    ctx.fillStyle = '#751d3b'; ctx.fillRect(7, 25, 20, 7); ctx.fillRect(69, 25, 20, 7); ctx.fillRect(15, 18, 13, 5); ctx.fillRect(68, 18, 13, 5)
    ctx.fillStyle = '#25172b'; ctx.fillRect(28, 13, 40, 31); ctx.fillRect(35, 8, 25, 7); ctx.fillRect(34, 43, 8, 8); ctx.fillRect(54, 43, 8, 8)
    ctx.fillStyle = '#fa3154'; ctx.fillRect(36, 25, 9, 5); ctx.fillRect(52, 25, 9, 5); ctx.fillStyle = '#fff0c2'; ctx.fillRect(39, 26, 4, 2); ctx.fillRect(55, 26, 4, 2)
    ctx.fillStyle = '#4f2944'; ctx.fillRect(43, 34, 12, 4)
  })

  const boss = canvasOf(210, 300, (ctx) => {
    const aura = ctx.createRadialGradient(105, 150, 24, 105, 150, 145); aura.addColorStop(0, 'rgba(130,15,42,.25)'); aura.addColorStop(1, 'rgba(9,2,15,0)')
    ctx.fillStyle = aura; ctx.fillRect(0, 0, 210, 300)
    ctx.fillStyle = '#f52d4e'; ctx.shadowColor = '#ff2446'; ctx.shadowBlur = 20
    ctx.fillRect(69, 107, 25, 6); ctx.fillRect(116, 107, 25, 6)
    ctx.shadowBlur = 0; ctx.fillStyle = '#c11739'; ctx.fillRect(91, 151, 28, 6)
  })
  const bossHitFlash = canvasOf(210, 300, () => {})
  const colossus = canvasOf(190, 220, (ctx) => {
    ctx.fillStyle = '#211a28'; ctx.fillRect(43, 22, 105, 130); ctx.fillRect(25, 48, 24, 92); ctx.fillRect(142, 48, 24, 92)
    ctx.fillStyle = '#714052'; ctx.fillRect(36, 130, 48, 74); ctx.fillRect(108, 130, 48, 74)
    ctx.fillStyle = '#ff405c'; ctx.fillRect(58, 56, 26, 9); ctx.fillRect(108, 56, 26, 9)
    ctx.fillStyle = '#aab1bd'; ctx.fillRect(32, 42, 23, 18); ctx.fillRect(139, 42, 23, 18); ctx.fillRect(64, 15, 65, 19)
  })
  const colossusFlash = canvasOf(190, 220, () => {})

  const orbs = Object.fromEntries(CATEGORIES.map((category) => [category, canvasOf(120, 60, (ctx) => {
    const color = GEM_CATEGORIES[category].color
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(27, 27, 20, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.beginPath(); ctx.arc(20, 19, 6, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = 'rgba(26,42,56,.45)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = '#172331'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(CATEGORY_SHORT[category], 53, 30, 64)
  })]))

  prepareArcadeSprite(HERO_SPRITES.morosBoss).then((sprite) => {
    boss.width = sprite.width; boss.height = sprite.height
    const context = boss.getContext('2d')
    context.shadowColor = '#fb344c'; context.shadowBlur = 18
    context.drawImage(sprite.canvas, 0, 0)
    bossHitFlash.width = sprite.width; bossHitFlash.height = sprite.height
    bossHitFlash.getContext('2d').drawImage(sprite.hitFlashCanvas, 0, 0)
  }).catch(() => {})
  const loadIntoCanvas = async (base, target, flashTarget = null) => {
    let sprite
    for (const extension of ['.png', '.jpg', '.jpeg']) {
      try { sprite = await prepareArcadeSprite(`${base}${extension}`); break } catch { /* intenta la extensión disponible */ }
    }
    if (!sprite) return
    target.width = sprite.width; target.height = sprite.height; target.getContext('2d').imageSmoothingEnabled = false; target.getContext('2d').drawImage(sprite.canvas, 0, 0)
    if (flashTarget) { flashTarget.width = sprite.width; flashTarget.height = sprite.height; flashTarget.getContext('2d').drawImage(sprite.hitFlashCanvas, 0, 0) }
  }
  loadIntoCanvas('/assets/enemigo-soldado', shadowCore)
  loadIntoCanvas('/assets/enemigo-dron', drone)
  loadIntoCanvas('/assets/enemigo-coloso', colossus, colossusFlash)
  const enemyRunStrip = { soldier: null, drone: null, colossus: null, moros: null, evacuee: null, evacueeBlue: null, evacueeGold: null, evacueeCoral: null, evacueeAlt: null }
  prepareArcadeSpriteStrip('/assets/enemigo-soldado-run-strip.png', 8).then((strip) => { enemyRunStrip.soldier = strip }).catch(() => {})
  prepareArcadeSpriteStrip('/assets/enemigo-dron-hover-strip.png', 8).then((strip) => { enemyRunStrip.drone = strip }).catch(() => {})
  prepareArcadeSpriteStrip('/assets/enemigo-coloso-walk-strip.png', 8).then((strip) => { enemyRunStrip.colossus = strip }).catch(() => {})
  prepareArcadeSpriteStrip('/assets/moros-ataque-strip.png', 8).then((strip) => { enemyRunStrip.moros = strip }).catch(() => {})
  prepareArcadeSpriteStrip('/assets/estudiante-evacuacion-run-strip.png', 8).then((strip) => {
    enemyRunStrip.evacuee = strip
    enemyRunStrip.evacueeBlue = recolorStudentHoodie(strip, 214)
    enemyRunStrip.evacueeGold = recolorStudentHoodie(strip, 42)
    enemyRunStrip.evacueeCoral = recolorStudentHoodie(strip, 350)
  }).catch(() => {})
  prepareArcadeSpriteStrip('/assets/estudiante-lab-evacuacion-run-strip.png', 8).then((strip) => { enemyRunStrip.evacueeAlt = strip }).catch(() => {})
  return { skies, campusBackground, domainBackground, far, mid, near, platforms, domain, heroFrames, shadowCore, drone, boss, bossHitFlash, colossus, colossusFlash, orbs, enemyRunStrip }
}

function drawWorldMotion(ctx, now, worldDistance, wave) {
  const hostile = wave === 3
  const mote = hostile ? '#ff7959' : wave === 2 ? '#ff9962' : '#bff8e4'
  for (let index = 0; index < 4; index += 1) {
    const drift = now * (.009 + index * .002) + worldDistance * .08
    const x = ((index * 287 + drift) % (WIDTH + 260)) - 130
    const y = 88 + index * 82 + Math.sin(now * .0007 + index) * 12
    const haze = ctx.createRadialGradient(x, y, 2, x, y, 138)
    haze.addColorStop(0, hostile ? 'rgba(255,64,94,.13)' : 'rgba(195,245,237,.11)')
    haze.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = haze
    ctx.beginPath(); ctx.ellipse(x, y, 138, 35, -.04, 0, Math.PI * 2); ctx.fill()
  }
  for (let index = 0; index < 22; index += 1) {
    const drift = now * (.006 + (index % 5) * .002) + worldDistance * (.14 + (index % 4) * .035)
    const x = ((index * 191 - drift) % WIDTH + WIDTH) % WIDTH
    const y = 44 + ((index * 83 + Math.sin(now * .001 + index) * 13) % 365)
    const twinkle = .25 + (Math.sin(now * .004 + index * 1.7) + 1) * .3
    ctx.globalAlpha = twinkle
    ctx.fillStyle = index % 5 === 0 ? '#fff0a8' : mote
    ctx.fillRect(Math.round(x), Math.round(y), index % 4 === 0 ? 3 : 2, 2)
    if (index % 4 === 0) ctx.fillRect(Math.round(x) - 3, Math.round(y) + 1, 8, 1)
  }
  // Chips and weeds pass faster than the campus to sell forward movement.
  for (let index = 0; index < 18; index += 1) {
    const x = ((index * 73 - worldDistance * .92) % WIDTH + WIDTH) % WIDTH
    const y = FLOOR + 10 + (index % 4) * 13
    ctx.globalAlpha = .32 + (index % 3) * .13
    ctx.fillStyle = index % 3 === 0 ? '#e9c27b' : hostile ? '#c64b54' : '#8cb29a'
    ctx.fillRect(Math.round(x), y, index % 4 + 2, 2)
    if (index % 3 === 1) ctx.fillRect(Math.round(x) + 3, y - 3, 2, 3)
  }
  ctx.globalAlpha = 1
}

function drawCampusPlatforms(ctx, cameraOffset) {
  for (const platform of CAMPUS_PLATFORMS) {
    const x = Math.round(platform.x - cameraOffset)
    const { y, width, height } = platform
    if (x > WIDTH + 10 || x + width < -10) continue
    ctx.save()
    ctx.shadowColor = 'rgba(5,12,22,.7)'; ctx.shadowBlur = 10
    ctx.fillStyle = '#26343a'
    ctx.beginPath(); ctx.moveTo(x + 7, y + 7); ctx.lineTo(x + width - 8, y + 7); ctx.lineTo(x + width, y + height - 3); ctx.lineTo(x + width - 5, y + height); ctx.lineTo(x + 6, y + height); ctx.lineTo(x, y + height - 5); ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = '#786a50'
    for (let stone = 0; stone < 5; stone += 1) {
      const stoneX = x + 6 + stone * (width - 18) / 5
      const stoneY = y + 10 + (stone % 2) * 7
      ctx.beginPath(); ctx.moveTo(stoneX, stoneY); ctx.lineTo(stoneX + 23, stoneY - 1); ctx.lineTo(stoneX + 20, stoneY + 8); ctx.lineTo(stoneX - 2, stoneY + 9); ctx.closePath(); ctx.fill()
      ctx.fillStyle = stone % 2 ? '#a08a62' : '#647260'
      ctx.fillRect(Math.round(stoneX + 4), Math.round(stoneY + 2), 7, 2)
      ctx.fillStyle = '#786a50'
    }
    ctx.fillStyle = '#d5c28f'
    ctx.beginPath(); ctx.moveTo(x - 2, y + 5); ctx.lineTo(x + 7, y); ctx.lineTo(x + width - 7, y); ctx.lineTo(x + width + 2, y + 5); ctx.lineTo(x + width - 4, y + 9); ctx.lineTo(x + 3, y + 9); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#6e9472'; ctx.fillRect(x + 13, y - 2, 13, 2); ctx.fillRect(x + width - 33, y - 2, 18, 2)
    if (platform.style === 'campus') {
      ctx.fillStyle = '#1a252d'; ctx.fillRect(x + 40, y + 13, 48, 9); ctx.fillRect(x + width - 61, y + 13, 29, 9)
      ctx.fillStyle = '#59d6c0'; ctx.fillRect(x + 44, y + 16, 14, 2); ctx.fillRect(x + width - 56, y + 16, 12, 2)
      ctx.fillStyle = '#d4ad67'; ctx.fillRect(x + 5, y + 3, 3, 5); ctx.fillRect(x + width - 8, y + 3, 3, 5)
    } else {
      for (let leaf = 0; leaf < 6; leaf += 1) {
        const leafX = x + 29 + leaf * 20
        ctx.fillStyle = leaf % 2 ? '#598f5d' : '#82a96b'
        ctx.fillRect(leafX, y - 9 - (leaf % 3) * 2, 4, 9 + (leaf % 3) * 2)
        ctx.fillRect(leafX - 3, y - 7 - (leaf % 3) * 2, 4, 3)
      }
    }
    ctx.restore()
  }
}

function drawHeroProjectile(ctx, bullet, now) {
  const x = bullet.x; const y = bullet.y; const pulse = Math.sin(now * .026 + x * .07)
  const color = bullet.color
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const trail = ctx.createLinearGradient(x - 36, y, x + 3, y)
  trail.addColorStop(0, 'rgba(255,255,255,0)'); trail.addColorStop(.52, color); trail.addColorStop(1, '#fff8d8')
  ctx.strokeStyle = trail; ctx.lineWidth = bullet.family === 'industry' ? 5 : 3; ctx.shadowColor = color; ctx.shadowBlur = 12
  ctx.beginPath(); ctx.moveTo(x - 31, y); ctx.lineTo(x + 1, y); ctx.stroke()
  ctx.fillStyle = color; ctx.strokeStyle = '#fff5cf'; ctx.lineWidth = 1.5; ctx.shadowBlur = 16
  if (bullet.family === 'tech') {
    ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x, y - 6); ctx.lineTo(x - 8, y); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(x, y, 13, 8 + pulse, now * .004, 0, Math.PI * 2); ctx.stroke()
  } else if (bullet.family === 'industry') {
    ctx.translate(x, y); ctx.rotate(now * .009)
    ctx.beginPath(); for (let tooth = 0; tooth < 12; tooth += 1) { const a = tooth * Math.PI / 6; const radius = tooth % 2 ? 5 : 9; ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius) }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fillStyle = '#fff4c5'; ctx.fill()
  } else if (bullet.family === 'construction') {
    ctx.beginPath(); ctx.moveTo(x + 9, y); ctx.lineTo(x + 2, y - 8); ctx.lineTo(x - 9, y - 5); ctx.lineTo(x - 5, y + 1); ctx.lineTo(x - 9, y + 6); ctx.lineTo(x + 2, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.arc(x, y, 12, -.7, .7); ctx.stroke()
  } else if (bullet.family === 'energy') {
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 13, y + 3); ctx.lineTo(x - 5, y - 5 + pulse * 2); ctx.lineTo(x, y + 1); ctx.lineTo(x + 5, y - 7); ctx.lineTo(x + 13, y - 2); ctx.stroke()
    ctx.strokeStyle = '#fffce7'; ctx.lineWidth = 1.1; ctx.stroke()
  } else if (bullet.family === 'business') {
    for (let satellite = 0; satellite < 3; satellite += 1) {
      const angle = now * .018 + satellite * Math.PI * 2 / 3
      ctx.beginPath(); ctx.arc(x + Math.cos(angle) * 8, y + Math.sin(angle) * 6, 2.4, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.moveTo(x + 10, y); ctx.lineTo(x + 2, y - 6); ctx.lineTo(x - 5, y); ctx.lineTo(x + 2, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke()
  } else {
    ctx.translate(x, y); ctx.rotate(-.35 + pulse * .08)
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-3, -11, 8, -2); ctx.quadraticCurveTo(5, 7, -10, 0); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = '#eaffd9'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(6, -2); ctx.stroke()
  }
  ctx.restore()
}

function drawEnemyProjectile(ctx, bullet, now) {
  const { x, y, radius, color, ownerType } = bullet
  const pulse = 1 + Math.sin(now * .025 + x) * .14
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = ownerType === 'boss' ? 20 : 13
  ctx.lineWidth = ownerType === 'boss' ? radius * .95 : radius * .65
  ctx.beginPath(); ctx.moveTo(x + radius * .3, y); ctx.lineTo(x + radius * 3.6, y + Math.sin(now * .02 + x) * 2); ctx.stroke()
  if (ownerType === 'boss') {
    ctx.translate(x, y); ctx.rotate(now * .012)
    ctx.strokeStyle = '#ffb0b8'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, 0, radius * pulse, now * .014, now * .014 + Math.PI * 1.55); ctx.stroke()
    ctx.strokeStyle = color; ctx.lineWidth = radius * .45
    ctx.beginPath(); ctx.arc(0, 0, radius * .55, -now * .019, -now * .019 + Math.PI * 1.6); ctx.stroke()
    ctx.fillStyle = '#fff0dc'; ctx.beginPath(); ctx.arc(0, 0, Math.max(2, radius * .2), 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x - radius * .7, y - radius * .7); ctx.lineTo(x - radius * .55, y); ctx.lineTo(x - radius * .7, y + radius * .7); ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function createEvacuees(now, count = 5) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${Math.round(now)}-${index}`,
    x: WIDTH + 25 + index * 210,
    y: FLOOR - 2,
    height: 82 + (index % 3) * 7,
    speed: 165 + (index % 3) * 22,
    phase: index * 1.35,
    variant: index % 2 ? 'evacueeAlt' : ['evacuee', 'evacueeBlue', 'evacueeGold', 'evacueeCoral'][Math.floor(index / 2) % 4],
  }))
}

function initialGame() {
  return {
    started: false, done: false, startTime: 0, missionEndAt: 0, lastCountdownSecond: null, finalCountdownStarted: false, lastTime: 0, worldDistance: 0, evacuees: [], score: 0, xp: 0, freedom: 0, lives: 5,
    rig: createMetalSlugRig(),
    shots: 0, hits: 0, ammo: MAGAZINE_SIZE, x: 220, playerWidth: HERO_WIDTH, playerHeight: HERO_HEIGHT, worldWidth: WIDTH, y: FLOOR - HERO_HEIGHT, vy: 0, onGround: true,
    invulnerableUntil: 0, flashUntil: 0, nextShotAt: 0, muzzleFlashUntil: 0, recoilOffset: 0, nextId: 1, spawnTimer: 0,
    targets: new Map(), liveIds: new Set(), bullets: [], enemyBullets: [], shells: [], dust: [], particles: [], explosions: [], shockwaves: [], lastDustAt: 0, gemCounts: Object.fromEntries(CATEGORIES.map((key) => [key, 0])),
    passionHits: 0, streak: 0, lowLivesNotified: false, lastReloadLine: -Infinity, input: { left: false, right: false, fire: false, jump: false },
    wave: 1, banner: null, boss: null, bossSpawned: false, colossusSpawned: false, bossDefeatPending: false, lastBossLineAt: -Infinity, bossNextAttackAt: 0,
    morosLine: '', morosLineUntil: 0, lastMorosTauntAt: -Infinity, deathAt: 0,
    shakeUntil: 0, shakeDuration: 0, shakeMagnitude: 0,
    noniLine: 'NONI: Lista para acompañarte. Presiona JUGAR cuando quieras iniciar.',
  }
}

function randomPassion(hero) {
  const alternatives = CATEGORIES.filter((category) => category !== hero)
  return random() < .56 ? hero : randomChoice(alternatives)
}

export default function Arcade2DGame({ hero = HERO, profile = null, onGameComplete = null, onExit = null }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(initialGame())
  const callbackRef = useRef({ onGameComplete })
  const artRef = useRef(null)
  const heroSpriteRef = useRef(null)
  const heroRunStripRef = useRef(null)
  const startNoniTimerRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [musicMuted, setMusicMuted] = useState(getArcadeMuted)
  const [showGameOver, setShowGameOver] = useState(false)
  const pendingGameStatsRef = useRef(null)
  const [hud, setHud] = useState({ time: MISSION_SECONDS, score: 0, xp: 0, freedom: 0, lives: 5, ammo: MAGAZINE_SIZE, wave: 1, progress: 0, bossHP: 15, bossMaxHP: 15, bossDefeated: false, bossName: BOSSES.tech, noniLine: gameRef.current.noniLine, done: false })
  callbackRef.current = { onGameComplete }

  useEffect(() => subscribeArcadeMute(setMusicMuted), [])

  useEffect(() => {
    let active = true
    heroSpriteRef.current = null
    heroRunStripRef.current = null
    Promise.all([
      prepareArcadeSprite(hero?.sprite || HERO_SPRITES[hero?.id] || HERO_SPRITES.tech),
      prepareArcadeSpriteStrip(HERO_RUN_SPRITES[hero?.id] || HERO_RUN_SPRITES.tech, 8),
    ]).then(([sprite, runStrip]) => {
        if (!active) return
        heroSpriteRef.current = sprite
        heroRunStripRef.current = runStrip
        const game = gameRef.current
        game.playerWidth = Math.max(54, Math.min(150, Math.round((runStrip.frameWidth / runStrip.frameHeight) * HERO_HEIGHT)))
        game.x = Math.min(game.x, WIDTH - game.playerWidth - 24)
      })
      .catch(() => {})
    return () => { active = false }
  }, [hero?.id, hero?.sprite])

  const say = useCallback((event, fixedLine = null) => {
    const game = gameRef.current
    const line = fixedLine || pickNoniLine(event, { nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    game.noniLine = `NONI: ${line}`
    window.dispatchEvent(new CustomEvent('edunexa:noni', { detail: { text: line, id: performance.now() } }))
  }, [hero, profile])

  const finishGame = useCallback(() => {
    const game = gameRef.current
    if (game.done) return
    game.done = true
    window.clearTimeout(startNoniTimerRef.current)
    game.input.left = false; game.input.right = false; game.input.fire = false
    if (game.lives === 0) { const line = 'Sigue estudiando. La partida termina aquí, pero tu historia y tus resultados siguen contigo.'; say('gameComplete', line); speakAsNoni(line) }
    else { say('gameComplete'); speakAsNoni('¡Lo lograste! Ya puedes revisar todo lo que descubriste de ti.') }
    stopArcadeMusic()
    const categoryHits = Object.fromEntries(CATEGORIES.map((category) => [category, Math.max(0, Number(game.gemCounts[category]) || 0)]))
    const stats = { gemCounts: categoryHits, totalXp: Math.max(0, game.xp), score: Math.max(0, game.score), freedom: Math.max(0, game.freedom), livesRemaining: Math.max(0, game.lives), categoryHits, hero: hero?.id || 'tech', accuracy: game.shots > 0 ? Math.max(0, Math.min(1, game.hits / game.shots)) : 0 }
    if (game.lives === 0) { pendingGameStatsRef.current = stats; setShowGameOver(true) }
    else callbackRef.current.onGameComplete?.(stats)
  }, [hero, say])

  const startGame = useCallback(() => {
    const game = gameRef.current
    if (game.started || game.done) return
    // Keep both calls synchronous inside the user gesture for iOS audio unlock.
    playArcadeSfx('confirm')
    startArcadeMusic('battle')
    speakAsHero(hero?.id, hero?.line || `Soy ${hero?.name || 'tu guardián'}. Vamos a abrirnos paso.`)
    game.started = true
    game.startTime = performance.now()
    game.missionEndAt = game.startTime + MISSION_SECONDS * 1000
    game.evacuees = createEvacuees(game.startTime)
    game.lastTime = game.startTime
    game.wave = 1
    game.banner = { title: 'MISIÓN 1 · ¡EMPEZAMOS!', subtitle: 'AÑO 2026 · IZTAPALAPA', color: '#ffdf62', until: game.startTime + 2600 }
    setStarted(true)
    rememberNoniContext({ nickname: profile?.nickname || profile?.nombre || 'piloto', hero: hero?.id || 'tech' })
    playArcadeCallout('¡MISIÓN INICIADA!')
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
    artRef.current ||= makeArt(hero)
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
      if (elapsed >= BOSS_START && !game.bossSpawned) {
        for (const target of [...game.targets.values()]) if (target.type !== 'boss') removeTarget(target)
        game.enemyBullets.length = 0
        const bossName = BOSSES[hero?.id] || BOSSES.tech
        const bossHeight = 380
        game.boss = { id: game.nextId++, type: 'boss', x: 860, y: FLOOR - bossHeight, baseY: FLOOR - bossHeight, w: 300, h: bossHeight, speed: 76, hp: 15, maxHp: 15, nextHitAt: 0, name: bossName, retreatUntil: 0, nextDashAt: performance.now() + 3000, dashUntil: 0, nextJumpAt: performance.now() + 2600, jumpStartedAt: 0, jumpUntil: 0, nextTeleportAt: performance.now() + 7200, flashUntil: 0, shootUntil: 0, attackStartedAt: 0, volleyFired: true }
        game.targets.set(game.boss.id, game.boss)
        game.liveIds.add(game.boss.id)
        game.bossSpawned = true
        game.lastBossLineAt = performance.now()
        say('bossAppear')
        giveMorosLine(game, 'appear', performance.now(), true)
      }
      if (elapsed >= COLOSSUS_START && elapsed < BOSS_START && !game.colossusSpawned && game.liveIds.size < 4) {
        const colossusHeight = 284
        const colossus = { id: game.nextId++, type: 'colossus', x: 900, y: FLOOR - colossusHeight, h: colossusHeight, w: colossusHeight * art.colossus.width / Math.max(1, art.colossus.height), speed: 26, hp: 12, maxHp: 12, nextHitAt: 0, nextShotAt: performance.now() + 1800, phase: 0 }
        game.targets.set(colossus.id, colossus); game.liveIds.add(colossus.id); game.colossusSpawned = true
      }
      if (game.liveIds.size >= 4) return
      const id = game.nextId++
      if (game.bossSpawned) return
      const wave = elapsed < WAVE_TWO_START ? 1 : elapsed < BOSS_START ? 2 : 3
      const shadowChance = wave === 1 ? .24 : .2
      const isShadow = random() < shadowChance
      const isDrone = !isShadow && random() < .24
      const droneY = FLOOR - 175 - random() * 65
      const target = isShadow
        ? { id, type: 'shadow', x: 970, y: FLOOR - 126, h: 126, w: 126 * art.shadowCore.width / Math.max(1, art.shadowCore.height), speed: 42 + random() * 18, phase: random() * Math.PI * 2, nextShotAt: 0 }
        : isDrone
        ? { id, type: 'drone', x: 970, y: droneY, baseY: droneY, h: 78, w: 78 * art.drone.width / Math.max(1, art.drone.height), speed: 76 + random() * 22, phase: random() * Math.PI * 2 }
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
      game.ammo = MAGAZINE_SIZE
      game.nextShotAt = Math.max(game.nextShotAt, now + 220)
      playReload()
      if (now - game.lastReloadLine >= 8000) { game.lastReloadLine = now; say('reload') }
    }

    const spawnPixelBurst = (x, y, color, now, count = 5) => {
      for (let index = 0; index < count && game.particles.length < 60; index += 1) {
        const angle = (Math.PI * 2 * index) / count + random() * .35
        const speed = 45 + random() * 125
        game.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35, size: 3 + Math.floor(random() * 4), end: now + 260 + random() * 180, color })
      }
    }

    const hitTarget = (target, now) => {
      game.hits += 1
      if (target.type === 'colossus') {
        if (now < target.nextHitAt) return
        target.hp -= 1; target.nextHitAt = now + 160; game.score += 80
        target.x += 4; game.explosions.push({ x: target.x + target.w / 2, y: target.y + 102, start: now, duration: 280, color: '#ff5269' })
        spawnPixelBurst(target.x + target.w / 2, target.y + 100, '#ff5269', now, 6)
        if (target.hp <= 0) { removeTarget(target); game.shockwaves.push({ x: target.x + target.w / 2, y: FLOOR - 13, radius: 18, vx: -250, end: now + 1200, color: '#ff794f' }); playExplosion() }
        else playArcadeSfx('bossHit')
        return
      }
      if (target.type === 'boss') {
        if (target.hp <= 0 || game.bossDefeatPending) return
        if (now < target.nextHitAt) return
        target.hp -= 1
        if (!target.dashUntil) target.x += 7
        target.nextHitAt = now + 580
        target.flashUntil = now + 150
        game.score += 250
        game.shakeUntil = now + 90
        game.shakeDuration = 90
        game.shakeMagnitude = 3
        playArcadeSfx('bossHit')
        spawnPixelBurst(target.x + target.w / 2, target.y + 150, '#ff7894', now, 8)
        game.explosions.push({ x: target.x + target.w / 2, y: target.y + 150, start: now, duration: 400, color: '#ff405c' })
        if (target.hp === 0) {
          game.bossDefeatPending = true
          game.input.fire = false
          game.missionEndAt = Math.max(game.missionEndAt, now + 8000)
          game.banner = { title: '¡MOROS DERROTADO!', subtitle: 'EVACÚA EL CAMPUS · LA BRECHA SE CIERRA', color: '#69f5d8', until: now + 3600 }
          say('bossDefeated')
          giveMorosLine(game, 'defeated', now, true)
        } else if (target.hp > 1 && now - game.lastBossLineAt >= 2000) {
          game.lastBossLineAt = now
          say('bossHit')
          giveMorosLine(game, 'strike', now)
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
      } else if (target.type === 'shadow' || target.type === 'drone') {
        game.score += 100
        game.freedom += 75
        game.streak = 0
        say('shadowHit')
      }
      playExplosion()
      game.explosions.push({ x: target.x + target.w / 2, y: target.y + target.h / 2, start: now, duration: 330, color: target.type === 'passion' ? GEM_CATEGORIES[target.category].color : '#ff456e' })
      removeTarget(target)
      spawnPixelBurst(target.x + target.w / 2, target.y + target.h / 2, target.type === 'passion' ? GEM_CATEGORIES[target.category].color : '#ff456e', now)
    }

    const takeDamage = (target, now) => {
      if (now < game.invulnerableUntil) return
      game.lives = Math.max(0, game.lives - 1)
      game.invulnerableUntil = now + 1450
      game.flashUntil = now + 260
      game.shakeUntil = now + 150
      game.shakeDuration = 150
      game.shakeMagnitude = 5
      game.x = Math.max(40, game.x - 24)
      game.rig.vx = -185
      game.rig.hurtUntil = now + 260
      game.rig.vy = -155
      game.onGround = false
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
      if (game.lives === 0 && !game.deathAt) game.deathAt = now
      if (game.deathAt && now - game.deathAt > 760) finishGame()
    }

    const keyDown = (event) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'r'].includes(key)) event.preventDefault()
      if (key === 'arrowleft' || key === 'a') game.input.left = true
      if (key === 'arrowright' || key === 'd') game.input.right = true
      if (key === ' ' ) game.input.fire = true
      if ((key === 'arrowup' || key === 'w') && !game.done && !game.input.jump) { game.input.jump = true; game.rig.jumpQueued = true; game.rig.jumpQueuedAt = performance.now(); playArcadeSfx('jump') }
      if (key === 'r') reload(performance.now())
    }
    const keyUp = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') game.input.left = false
      if (key === 'arrowright' || key === 'd') game.input.right = false
      if (key === ' ') game.input.fire = false
      if (key === 'arrowup' || key === 'w') game.input.jump = false
    }
    const control = (event) => {
      const { action, phase } = typeof event.detail === 'string' ? { action: event.detail, phase: 'tap' } : event.detail
      if (action === 'reload' && phase !== 'up') { reload(performance.now()); return }
      if (action === 'up') {
        if (phase === 'up') game.input.jump = false
        else if (!game.input.jump && !game.done) { game.input.jump = true; game.rig.jumpQueued = true; game.rig.jumpQueuedAt = performance.now(); playArcadeSfx('jump') }
        if (phase === 'tap') window.setTimeout(() => { game.input.jump = false }, 140)
        return
      }
      const pressed = phase !== 'up'
      if (action === 'left') game.input.left = pressed
      if (action === 'right') game.input.right = pressed
      if (action === 'fire') game.input.fire = pressed
      if (phase === 'tap') window.setTimeout(() => {
        if (action === 'left') game.input.left = false
        if (action === 'right') game.input.right = false
        if (action === 'fire') game.input.fire = false
      }, 180)
    }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('edunexa:arcade-control', control)
    spawnInterval = window.setInterval(spawn, 930)
    const stopHandle = () => stopArcadeMusic()
    window.addEventListener('pagehide', stopHandle)

    const draw = (now) => {
      if (stopped) return
      const dt = Math.min(.04, Math.max(0, (now - game.lastTime) / 1000))
      game.lastTime = now
      ctx.imageSmoothingEnabled = false
      if (!game.done) {
        const elapsed = (now - game.startTime) / 1000
          const wave = elapsed < WAVE_TWO_START ? 1 : elapsed < BOSS_START ? 2 : 3
        if (wave !== game.wave) {
          game.wave = wave
          if (wave === 2) { startArcadeMusic('battle'); game.banner = { title: 'RUPTURA DIMENSIONAL', subtitle: 'EL DOMINIO DE MOROS · RESISTE', color: '#ff405c', until: now + 2500 }; game.flashUntil = now + 180; game.shakeUntil = now + 650; game.shakeDuration = 650; game.shakeMagnitude = 9; playNavigate(); say('wave2') }
          if (wave === 3) { startArcadeMusic('boss'); game.banner = { title: 'OLA 3 · JEFE FINAL', subtitle: BOSSES[hero?.id] || BOSSES.tech, color: '#ff668a', until: now + 2600 }; playNavigate(); say('wave3') }
        }
        if (now >= game.missionEndAt) finishGame()
        if (!game.done) {
          const rigFrame = stepMetalSlugRig(game, dt, now, CAMPUS_PLATFORMS, .18, BACKDROP_WIDTH - WIDTH)
          if (rigFrame.scrollDelta) {
            game.worldDistance = Math.max(0, game.worldDistance + rigFrame.scrollDelta)
            for (const target of game.targets.values()) target.x -= rigFrame.scrollDelta
            for (const list of [game.evacuees, game.bullets, game.enemyBullets, game.shells, game.dust, game.particles, game.explosions, game.shockwaves]) for (const item of list) item.x -= rigFrame.scrollDelta
          }
          const secondsLeft = Math.ceil((game.missionEndAt - now) / 1000)
          if (secondsLeft <= 10 && secondsLeft > 0) {
            if (!game.finalCountdownStarted) {
              game.finalCountdownStarted = true
              game.evacuees.push(...createEvacuees(now, 3))
              game.banner = { title: game.bossDefeatPending ? '¡EXTRACCIÓN INMINENTE!' : '¡COLAPSO INMINENTE!', subtitle: 'ABANDONA EL CAMPUS · 10 SEGUNDOS', color: '#ff5a66', until: now + 2500 }
            }
            if (game.lastCountdownSecond !== secondsLeft) {
              game.lastCountdownSecond = secondsLeft
              playArcadeSfx('countdown')
              if (secondsLeft <= 3) { game.shakeUntil = now + 120; game.shakeDuration = 120; game.shakeMagnitude = 3 }
            }
          }
          for (const civilian of game.evacuees) civilian.x -= civilian.speed * dt
          game.evacuees = game.evacuees.filter((civilian) => civilian.x > -170)
          if (game.input.fire && now >= game.nextShotAt) {
            if (game.ammo === 0) reload(now)
            else {
              game.ammo -= 1
              game.shots += 1
              game.nextShotAt = now + 165
              game.recoilOffset = 6
              game.rig.shotRecoil = 6
              game.muzzleFlashUntil = now + 72
              game.shells.push({ x: game.x + game.playerWidth * .72, y: game.y + HERO_HEIGHT * .5, vx: -75 - random() * 55, vy: -155 - random() * 45, rotation: 0, spin: 8 + random() * 8, bounces: 0 })
              game.bullets.push({ x: game.x + game.playerWidth * .86, y: game.y + HERO_HEIGHT * .5, vx: 850, color: hero?.color || '#55e8ff', family: hero?.id || 'tech' })
              playHeroWeaponSfx(hero?.id || 'tech')
            }
          }
          for (const bullet of game.bullets) bullet.x += bullet.vx * dt
          game.bullets = game.bullets.filter((bullet) => bullet.x < WIDTH)
          if (game.boss && game.boss.hp > 0 && !(game.boss.retreatUntil && now < game.boss.retreatUntil) && now >= game.bossNextAttackAt && game.boss.shootUntil <= now) {
            game.boss.attackStartedAt = now
            game.boss.volleyFired = false
            game.boss.shootUntil = now + 880
            game.bossNextAttackAt = now + (game.boss.hp <= 2 ? 1850 : 2800)
            giveMorosLine(game, 'attack', now)
          }
          if (game.boss && game.boss.hp > 0 && game.boss.shootUntil > now && !game.boss.volleyFired && now - game.boss.attackStartedAt >= 430) {
            game.boss.volleyFired = true
            const spread = [-38, 0, 38]
            spread.forEach((offset, index) => game.enemyBullets.push({ x: game.boss.x + 18, y: game.boss.y + 222 + offset, vx: -245 - index * 12, radius: index === 1 ? 10 : 8, color: index === 1 ? '#fa3154' : '#76152f', ownerType: 'boss' }))
          }
          for (const bullet of game.enemyBullets) { bullet.x += bullet.vx * dt; bullet.y += (bullet.vy || 0) * dt }
          game.enemyBullets = game.enemyBullets.filter((bullet) => bullet.x > -20 && bullet.y < HEIGHT + 60)
          for (const bullet of game.enemyBullets) {
              if (bullet.x < game.x + game.playerWidth - 6 && bullet.x + bullet.radius > game.x + 6 && bullet.y > game.y + 6 && bullet.y < game.y + HERO_HEIGHT - 5) {
              bullet.x = -100
              const source = bullet.ownerType === 'boss' && game.boss ? game.boss : { type: bullet.ownerType || 'shadow', x: game.x, speed: 0 }
              takeDamage(source, now)
            }
          }
          for (const shell of game.shells) {
            shell.x += shell.vx * dt; shell.y += shell.vy * dt; shell.vy += 520 * dt; shell.rotation += shell.spin * dt
            if (shell.y >= FLOOR - 4 && shell.bounces < 1) { shell.y = FLOOR - 4; shell.vy *= -.34; shell.vx *= .55; shell.bounces += 1 }
          }
          game.shells = game.shells.filter((shell) => shell.y < HEIGHT + 20 && Math.abs(shell.vx) > 4)
          game.recoilOffset += (0 - game.recoilOffset) * Math.min(1, dt * 22)
          if ((game.input.left || game.input.right) && game.onGround && now - game.lastDustAt > 85) {
            game.lastDustAt = now
            game.dust.push({ x: game.x + game.playerWidth / 2 + (random() - .5) * 24, y: FLOOR - 3, vx: (random() - .7) * 35, vy: -14 - random() * 28, end: now + 320, size: 2 + Math.floor(random() * 3) })
          }
          for (const particle of game.dust) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 72 * dt }
          game.dust = game.dust.filter((particle) => particle.end > now)
          for (const wave of game.shockwaves) {
            wave.x += wave.vx * dt
            if (game.onGround && wave.x < game.x + game.playerWidth && wave.x + wave.radius > game.x && wave.y > game.y + HERO_HEIGHT - 18) takeDamage(game.boss || { type: 'shadow', x: game.x, speed: 0 }, now)
          }
          game.shockwaves = game.shockwaves.filter((wave) => wave.end > now && wave.x > -40)
          for (const target of game.targets.values()) {
            if ((target.type === 'boss' || target.type === 'colossus') && target.hp <= 0) continue
            if ((target.type === 'shadow' || target.type === 'drone' || target.type === 'colossus') && now >= (target.nextShotAt || 0)) {
              target.nextShotAt = now + (target.type === 'colossus' ? 2600 : target.type === 'drone' ? 3200 : 3800)
              target.shootUntil = now + 145
              if (target.type === 'drone') game.enemyBullets.push({ x: target.x + target.w / 2, y: target.y + target.h, vx: -12, vy: 190, radius: 7, color: '#ff405c', ownerType: 'drone' })
              else if (target.type === 'colossus') game.enemyBullets.push({ x: target.x + 10, y: FLOOR - 15, vx: -205, vy: 0, radius: 10, color: '#ff304f', ownerType: 'colossus' })
              else game.enemyBullets.push({ x: target.x + 10, y: target.y + 62, vx: -170, vy: 0, radius: 6, color: '#f43f5e', ownerType: 'shadow' })
            }
            if (target.type === 'boss' && target.retreatUntil && now < target.retreatUntil) target.x = WIDTH + 100
            else {
              if (target.type === 'boss' && target.retreatUntil) { target.retreatUntil = 0; target.x = WIDTH + 60; target.speed = 54 }
              if (target.type === 'boss' && !target.dashUntil && now >= target.nextDashAt) {
                target.dashUntil = now + 520; target.nextDashAt = now + (target.hp <= 2 ? 1850 : 2450); target.speed = target.hp <= 2 ? 430 : 340
                game.banner = { title: '¡MOROS CARGA!', subtitle: 'SALTA O MUÉVETE PARA ESQUIVAR', color: '#ff435c', until: now + 650 }
                giveMorosLine(game, 'dash', now)
              } else if (target.type === 'boss' && target.dashUntil && now >= target.dashUntil) {
                if (game.y < FLOOR - HERO_HEIGHT - 18 || game.x + game.playerWidth < target.x - 28) giveMorosLine(game, 'dodge', now)
                target.dashUntil = 0; target.speed = -78
              }
              if (target.type === 'boss' && now >= target.nextTeleportAt && !target.dashUntil && !target.jumpUntil) {
                target.x = 540 + random() * 120
                target.nextTeleportAt = now + 5200
                target.flashUntil = now + 240
                game.shakeUntil = now + 120; game.shakeDuration = 120; game.shakeMagnitude = 4
              }
              if (target.type === 'boss' && !target.jumpUntil && now >= target.nextJumpAt) {
                target.jumpStartedAt = now; target.jumpUntil = now + 900; target.nextJumpAt = now + 3300; target._wasJumping = true
              }
              if (target.type === 'boss' && target.jumpUntil) {
                if (now < target.jumpUntil) {
                  const phase = Math.min(1, (now - target.jumpStartedAt) / (target.jumpUntil - target.jumpStartedAt))
                  target.y = target.baseY - Math.sin(phase * Math.PI) * 68
                } else {
                  target.jumpUntil = 0; target.y = target.baseY
                  if (target._wasJumping) {
                    target._wasJumping = false
                    game.shockwaves.push({ x: target.x + target.w / 2, y: FLOOR - 13, radius: 13, vx: -300, end: now + 1800, color: '#ff3e58' })
                    game.shakeUntil = now + 260; game.shakeDuration = 260; game.shakeMagnitude = 8
                    for (let dustIndex = 0; dustIndex < 12; dustIndex += 1) game.particles.push({ x: target.x + target.w / 2 + (random() - .5) * 100, y: FLOOR - 9, end: now + 400, color: '#ff5262' })
                  }
                }
              }
              target.x -= target.speed * dt
            }
            if (target.type === 'passion') target.y = target.baseY + Math.sin(now / 360 + target.phase) * 8
            if (target.type === 'shadow') target.y = FLOOR - target.h + Math.sin(now / 230 + target.phase) * 8
            if (target.type === 'drone') target.y = target.baseY + Math.sin(now / 180 + target.phase) * 22
            const heroBox = { left: game.x + 7, right: game.x + game.playerWidth - 7, top: game.y + 7, bottom: game.y + HERO_HEIGHT - 2 }
            const targetBox = target.type === 'boss' || target.type === 'colossus'
              ? { left: target.x + 20, right: target.x + target.w, top: target.y + 10, bottom: target.y + target.h }
              : target.type === 'shadow'
              ? { left: target.x + target.w * .2, right: target.x + target.w * .82, top: target.y + 8, bottom: target.y + target.h }
              : target.type === 'drone'
              ? { left: target.x + 8, right: target.x + target.w - 8, top: target.y + 5, bottom: target.y + target.h }
              : { left: target.x + 1, right: target.x + 53, top: target.y + 2, bottom: target.y + 54 }
            const overlap = heroBox.left < targetBox.right && heroBox.right > targetBox.left && heroBox.top < targetBox.bottom && heroBox.bottom > targetBox.top
            if (overlap && (target.type === 'shadow' || target.type === 'drone' || target.type === 'boss' || target.type === 'colossus') && (game.onGround || game.vy > 0)) takeDamage(target, now)
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
          for (const particle of game.particles) { particle.x += (particle.vx || 0) * dt; particle.y += (particle.vy || 0) * dt; if (particle.vy != null) particle.vy += 170 * dt }
          game.particles = game.particles.filter((particle) => particle.end > now)
          game.explosions = game.explosions.filter((explosion) => now - explosion.start < explosion.duration)
        }
      }

      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      const shake = now < game.shakeUntil ? game.shakeMagnitude * ((game.shakeUntil - now) / game.shakeDuration) : 0
      const shakeX = shake ? (random() * 2 - 1) * shake : 0
      const shakeY = shake ? (random() * 2 - 1) * shake : 0
      ctx.save()
      ctx.translate(shakeX, shakeY)
      const sceneCameraOffset = Math.min(BACKDROP_WIDTH - WIDTH, game.worldDistance * .18)
      if (game.wave < 3) {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(art.campusBackground, -sceneCameraOffset, 0)
        if (game.wave === 2) { ctx.fillStyle = 'rgba(99,8,27,.28)'; ctx.fillRect(0, 0, WIDTH, HEIGHT); for (let crack = 0; crack < 5; crack++) { ctx.strokeStyle = 'rgba(255,53,83,.35)'; ctx.beginPath(); ctx.moveTo(crack * 221 + 30, 0); ctx.lineTo(crack * 221 + 70, 90); ctx.lineTo(crack * 221 + 26, 170); ctx.stroke() } }
      } else {
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(art.domainBackground, -sceneCameraOffset, 0)
        for (let ember = 0; ember < 38; ember += 1) {
          const x = (ember * 263 + Math.floor(now / 27) * (ember % 3 + 1)) % WIDTH
          const y = (ember * 97 + Math.floor(now / 19) * (ember % 2 + 1)) % FLOOR
          ctx.globalAlpha = .25 + (ember % 5) * .12; ctx.fillStyle = ember % 4 ? '#db3547' : '#ffac55'; ctx.fillRect(x, y, ember % 3 + 1, ember % 3 + 1)
        }
        ctx.globalAlpha = 1
      }
      drawWorldMotion(ctx, now, game.worldDistance, game.wave)
      drawCampusPlatforms(ctx, sceneCameraOffset)
      for (const civilian of game.evacuees) {
        const evacueeStrip = art.enemyRunStrip[civilian.variant] || art.enemyRunStrip.evacuee
        if (!evacueeStrip) continue
        const frame = evacueeStrip.frames[Math.floor((now - game.startTime) / 85 + civilian.phase) % evacueeStrip.frameCount]
        const width = civilian.height * frame.width / Math.max(1, frame.height)
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .95
        if (civilian.hue) ctx.filter = `hue-rotate(${civilian.hue}deg) saturate(.88)`
        ctx.shadowColor = '#7ef7db'; ctx.shadowBlur = 5
        ctx.drawImage(frame, civilian.x, civilian.y - civilian.height, width, civilian.height)
        ctx.restore()
      }
      for (const target of game.targets.values()) {
        if (target.type === 'boss') {
          if (target.hp > 0 && target.x < WIDTH + 360) {
            const strip = now < target.shootUntil ? art.enemyRunStrip.moros : null
            const attackProgress = strip ? Math.max(0, now - target.attackStartedAt) : 0
            const frame = strip ? strip.frames[Math.min(strip.frameCount - 1, Math.floor(attackProgress / 82))] : null
            const bossArt = frame || (now < target.flashUntil ? art.bossHitFlash : art.boss)
            const drawHeight = target.h
            const drawWidth = strip ? drawHeight * (strip.frameWidth / Math.max(1, strip.frameHeight)) : drawHeight * (bossArt.width / Math.max(1, bossArt.height))
            const idlePulse = Math.sin(now * .004 + target.id) * .012
            const idleBob = Math.sin(now * .003 + target.id) * 2.5
            const drawX = target.x + target.w - drawWidth
            ctx.save(); ctx.imageSmoothingEnabled = false
            ctx.shadowColor = '#ff334f'; ctx.shadowBlur = target.dashUntil > now ? 30 : 18
            if (frame) ctx.drawImage(frame, drawX, target.y + idleBob, drawWidth, drawHeight)
            else {
              ctx.translate(drawX + drawWidth / 2, target.y + drawHeight + idleBob)
              ctx.scale(1 + idlePulse, 1 - idlePulse * .65)
              ctx.drawImage(bossArt, -drawWidth / 2, -drawHeight, drawWidth, drawHeight)
            }
            if (strip) {
              const attackGlow = .35 + (Math.sin(attackProgress * .028) + 1) * .17
              ctx.globalAlpha = attackGlow; ctx.strokeStyle = '#ff3655'; ctx.lineWidth = 3; ctx.shadowBlur = 24
              ctx.beginPath(); ctx.ellipse(drawX + drawWidth * .32, target.y + drawHeight * .51, 24 + Math.sin(attackProgress * .035) * 6, 14, 0, 0, Math.PI * 2); ctx.stroke()
            }
            ctx.restore()
          }
          continue
        }
        if (target.type === 'colossus') {
          const colossusArt = now < target.nextHitAt && target.nextHitAt - now > 100 ? art.colossusFlash : art.colossus
          const strip = art.enemyRunStrip.colossus
          const frame = strip?.frames[Math.floor(now / 145 + target.phase) % 8]
          const cw = target.h * (frame ? strip.frameWidth / Math.max(1, strip.frameHeight) : colossusArt.width / Math.max(1, colossusArt.height))
          target.w = cw
          const colossusPose = target.shootUntil > now ? 'shoot' : 'run'
          ctx.save(); ctx.imageSmoothingEnabled = false
          ctx.shadowColor = '#ff405c'; ctx.shadowBlur = colossusPose === 'shoot' ? 20 : 9
          if (frame && !(now < target.nextHitAt && target.nextHitAt - now > 100)) ctx.drawImage(frame, target.x, target.y, cw, target.h)
          else ctx.drawImage(colossusArt, target.x, target.y, cw, target.h)
          ctx.restore()
          ctx.fillStyle = '#170911'; ctx.fillRect(target.x, target.y - 13, target.w, 6); ctx.fillStyle = '#ff405c'; ctx.fillRect(target.x, target.y - 13, target.w * target.hp / target.maxHp, 6)
        }
        else if (target.type === 'shadow') {
          const strip = art.enemyRunStrip.soldier
          const frame = strip?.frames[Math.floor(now / 105 + target.phase) % 8]
          const source = frame || art.shadowCore
          const soldierWidth = target.h * source.width / Math.max(1, source.height)
          target.w = soldierWidth
          ctx.save(); ctx.imageSmoothingEnabled = false; ctx.shadowColor = '#ff405c'; ctx.shadowBlur = 10 + Math.sin(now / 130) * 3
          ctx.drawImage(source, target.x, target.y, soldierWidth, target.h); ctx.restore()
        }
        else if (target.type === 'drone') {
          const strip = art.enemyRunStrip.drone
          const frame = strip?.frames[Math.floor(now / 95 + target.phase) % 8]
          const source = frame || art.drone
          const dw = target.h * source.width / Math.max(1, source.height)
          target.w = dw
          ctx.save(); ctx.imageSmoothingEnabled = false; ctx.shadowColor = '#ff4b52'; ctx.shadowBlur = 11
          ctx.drawImage(source, target.x, target.y - 3 + Math.sin(now / 80 + target.phase) * 3, dw, target.h); ctx.restore()
        }
        else ctx.drawImage(art.orbs[target.category], target.x, target.y)
      }
      for (const bullet of game.bullets) drawHeroProjectile(ctx, bullet, now)
      for (const bullet of game.enemyBullets) drawEnemyProjectile(ctx, bullet, now)
      for (const wave of game.shockwaves) { ctx.strokeStyle = wave.color; ctx.shadowColor = wave.color; ctx.shadowBlur = 12; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(wave.x, wave.y, wave.radius + 8, 5, 0, Math.PI, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0 }
      for (const explosion of game.explosions) {
        const phase = Math.min(1, (now - explosion.start) / explosion.duration)
        ctx.globalAlpha = 1 - phase; ctx.strokeStyle = explosion.color; ctx.lineWidth = 5 - phase * 3; ctx.shadowColor = explosion.color; ctx.shadowBlur = 12
        ctx.beginPath(); ctx.arc(explosion.x, explosion.y, 5 + phase * 26, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = '#fff4d4'; ctx.fillRect(explosion.x - 2 - phase * 5, explosion.y - 2, 4, 4); ctx.shadowBlur = 0
      }
      for (const shell of game.shells) { ctx.save(); ctx.translate(shell.x, shell.y); ctx.rotate(shell.rotation); ctx.fillStyle = '#f3c35f'; ctx.fillRect(-3, -2, 6, 4); ctx.restore() }
      for (const particle of game.dust) { ctx.globalAlpha = Math.max(0, (particle.end - now) / 320) * .6; ctx.fillStyle = '#cab79a'; ctx.fillRect(particle.x, particle.y, particle.size, particle.size) }
      for (const particle of game.particles) {
        ctx.globalAlpha = Math.max(0, (particle.end - now) / 320)
        ctx.fillStyle = particle.color; const size = particle.size || 4; ctx.fillRect(Math.round(particle.x / 2) * 2, Math.round(particle.y / 2) * 2, size, size)
      }
      ctx.globalAlpha = 1
      ctx.imageSmoothingEnabled = false
      const sprite = heroSpriteRef.current
      const rigState = game.rig?.state || PLAYER_STATE.IDLE
      const pose = game.lives <= 0 ? 'die' : rigState === PLAYER_STATE.HURT ? 'hurt' : rigState
      const locomotion = !game.onGround ? (game.vy < 0 ? 'jump' : 'fall') : Math.abs(game.rig?.vx || 0) > 18 ? 'run' : 'idle'
      const hiddenByBlink = now < game.invulnerableUntil && now >= game.flashUntil && Math.floor(now / 90) % 2 === 0
      if (!hiddenByBlink) {
        if (sprite) {
          const spriteHeight = HERO_HEIGHT
          const spriteWidth = spriteHeight * (sprite.width / Math.max(1, sprite.height))
          const centerX = game.x + game.playerWidth / 2 - game.recoilOffset
          const groundY = game.y + HERO_HEIGHT
          const runStrip = heroRunStripRef.current
          const isFlashing = now < game.flashUntil
          ctx.save(); ctx.imageSmoothingEnabled = false
          ctx.shadowColor = isFlashing ? '#fff4cf' : hero?.color || '#55e8ff'; ctx.shadowBlur = isFlashing ? 17 : 7
          if (locomotion === 'run' && runStrip?.frames?.length) {
            const frameIndex = Math.floor(now / 1000 * 12) % runStrip.frameCount
            const frame = runStrip.frames[frameIndex]
            ctx.drawImage(isFlashing ? sprite.hitFlashCanvas : frame, centerX - game.playerWidth / 2, groundY - spriteHeight, game.playerWidth, spriteHeight)
          } else {
            const recoil = pose === 'shoot' || now < game.muzzleFlashUntil ? -game.rig.shotRecoil : 0
            ctx.drawImage(isFlashing ? sprite.hitFlashCanvas : sprite.canvas, centerX - spriteWidth / 2 + recoil, groundY - spriteHeight, spriteWidth, spriteHeight)
          }
          ctx.restore()
          if (now < game.muzzleFlashUntil && game.input.fire) {
            const muzzleX = centerX + spriteWidth * .43; const muzzleY = groundY - spriteHeight * .55
            ctx.save(); ctx.globalAlpha = Math.max(0, (game.muzzleFlashUntil - now) / 72); ctx.fillStyle = '#fff5a4'; ctx.shadowColor = hero?.color || '#55e8ff'; ctx.shadowBlur = 18
            ctx.beginPath(); ctx.moveTo(muzzleX - 2, muzzleY); ctx.lineTo(muzzleX + 15, muzzleY - 7); ctx.lineTo(muzzleX + 11, muzzleY); ctx.lineTo(muzzleX + 16, muzzleY + 7); ctx.closePath(); ctx.fill(); ctx.restore()
          }
        } else {
          const fallbackPose = pose === 'hurt' || pose === 'fall' ? 'die' : pose === 'shoot' ? 'attack' : pose === 'jump' ? 'jump' : pose
          const sheet = art.heroFrames[fallbackPose] || art.heroFrames.idle
          const frame = fallbackPose === 'die' && game.deathAt ? Math.min(sheet.frameCount - 1, Math.floor((now - game.deathAt) / 120)) : Math.floor(now / (fallbackPose === 'run' ? 85 : 135)) % sheet.frameCount
          ctx.drawImage(sheet.image, frame * sheet.frameWidth, 0, sheet.frameWidth, sheet.frameHeight, game.x, game.y, game.playerWidth, HERO_HEIGHT)
        }
      }
      if (now < game.flashUntil) { ctx.fillStyle = 'rgba(255,39,70,.22)'; ctx.fillRect(0, 0, WIDTH, HEIGHT) }
      if (game.banner && now < game.banner.until) {
        ctx.fillStyle = 'rgba(12,25,36,.84)'; ctx.fillRect(265, 68, 430, 82)
        ctx.strokeStyle = game.banner.color; ctx.lineWidth = 2; ctx.strokeRect(265, 68, 430, 82)
        ctx.textAlign = 'center'; ctx.fillStyle = game.banner.color; ctx.font = '900 27px system-ui'; ctx.fillText(game.banner.title, WIDTH / 2, 103)
        ctx.fillStyle = '#f8f6ea'; ctx.font = '700 12px system-ui'; ctx.fillText(game.banner.subtitle, WIDTH / 2, 129)
      }
      ctx.restore()
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
      const now = performance.now()
      const secondsLeft = Math.max(0, Math.ceil((game.missionEndAt - now) / 1000))
      setHud({ time: secondsLeft, score: game.score, xp: game.xp, freedom: game.freedom, lives: game.lives, ammo: game.ammo, wave: game.wave, progress: Math.min(1, (now - game.startTime) / (MISSION_SECONDS * 1000)), bossHP: game.boss?.hp ?? 15, bossMaxHP: game.boss?.maxHp ?? 15, bossDefeated: game.bossDefeatPending, bossName: game.boss?.name || BOSSES[hero?.id] || BOSSES.tech, noniLine: game.noniLine, morosLine: now < game.morosLineUntil ? game.morosLine : '', done: game.done })
    }, 250)

    return () => {
      stopped = true
      window.cancelAnimationFrame(raf)
      window.clearInterval(spawnInterval)
      window.clearInterval(hudTimer)
      window.clearTimeout(startNoniTimerRef.current)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('edunexa:arcade-control', control)
      window.removeEventListener('pagehide', stopHandle)
      stopArcadeMusic()
    }
  }, [started, hero, finishGame, say])

  useEffect(() => () => { window.clearTimeout(startNoniTimerRef.current); stopArcadeMusic() }, [])

  return <section className="arcade2d-game" aria-label="Juego arcade 2D">
    <div className="arcade2d-canvas-frame"><canvas ref={canvasRef} className="arcade2d-canvas" width={WIDTH} height={HEIGHT} aria-label="Ciudad Futuro, campo de juego" /></div>
    <header className="arcade-combat-hud" aria-live="polite">
      <div className="combat-noni"><img src="/assets/noni.jpg" alt="NONI"/><div><small>NONI · APOYO TÁCTICO</small><strong>{hud.noniLine.replace(/^NONI:\s*/,'')}</strong></div></div>
              <div className="combat-stat-badges"><span><small>OLA</small><b>{hud.wave}/3</b></span><span><small>VIDAS</small><b className="combat-lives">{'♥'.repeat(hud.lives)}{'♡'.repeat(Math.max(0, 5 - hud.lives))}</b></span><span><small>MUNICIÓN</small><b>{String(hud.ammo).padStart(2, '0')}</b></span><span><small>PUNTOS</small><b>{hud.score.toLocaleString('es-MX')}</b></span><span><small>TIEMPO</small><b>00:{String(hud.time).padStart(2, '0')}</b></span></div>
      <div className="combat-hud-actions"><button type="button" title={musicMuted ? 'Activar música y sonidos' : 'Silenciar música y sonidos'} aria-label={musicMuted ? 'Activar música y sonidos' : 'Silenciar música y sonidos'} onClick={() => setMusicMuted(toggleArcadeMuted())}>{musicMuted ? '🔇' : '🔊'}</button><button type="button" aria-label="Salir del combate" onClick={onExit}>SALIR</button></div>
    </header>
    {hud.wave === 3 && <div className="arcade2d-boss-health" aria-label={`${hud.bossName}, ${hud.bossHP} de ${hud.bossMaxHP} puntos de vida`}><strong>{hud.bossName}</strong><div>{Array.from({ length: hud.bossMaxHP }, (_, segment) => <i className={segment < hud.bossHP ? 'is-active' : ''} key={segment} />)}</div><small>{hud.bossHP} / {hud.bossMaxHP} HP</small></div>}
    {hud.wave === 3 && hud.time <= 10 && hud.time > 0 && <div key={hud.time} className="arcade-final-countdown" aria-live="assertive"><span>{hud.bossDefeated ? '¡EXTRACCIÓN INMINENTE!' : '¡COLAPSO INMINENTE!'}</span><strong>{String(hud.time).padStart(2, '0')}</strong><small>{hud.bossDefeated ? 'EL CAMPUS SE ESTABILIZA' : 'EVACÚA · ESQUIVA · SOBREVIVE'}</small></div>}
    {hud.morosLine && <div className="moros-taunt" aria-live="assertive"><strong><i aria-hidden="true">◈</i> MOROS TE PROVOCA</strong><span>“{hud.morosLine}”</span></div>}
    {!started && <div className="arcade2d-start-overlay"><p className="eyebrow">MISIÓN DE ENTRENAMIENTO</p><h3>El dominio te espera.</h3><p>Corre, salta y dispara a los núcleos de sombra para revelar tus pasiones.</p><button type="button" onClick={startGame}>▶ JUGAR</button></div>}
    {hud.done && showGameOver && <div className="arcade2d-end-card arcade-game-over"><img src="/assets/noni.jpg" alt="NONI, guardián jaguar"/><p className="eyebrow">NONI · SIGO CONTIGO</p><strong>Sigue estudiando.</strong><span>Una caída no borra lo que descubriste. Puedes volver a intentarlo sin perder tu mini-test.</span><div><button type="button" onClick={() => { window.clearTimeout(startNoniTimerRef.current); const freshGame = initialGame(); if (heroSpriteRef.current) freshGame.playerWidth = Math.max(54, Math.min(150, Math.round((heroSpriteRef.current.width / heroSpriteRef.current.height) * HERO_HEIGHT))); gameRef.current = freshGame; pendingGameStatsRef.current = null; setShowGameOver(false); setHud({ time: MISSION_SECONDS, score: 0, xp: 0, freedom: 0, lives: 5, ammo: MAGAZINE_SIZE, wave: 1, progress: 0, bossHP: 15, bossMaxHP: 15, bossDefeated: false, bossName: BOSSES[hero?.id] || BOSSES.tech, noniLine: 'NONI: Lista para acompañarte.', done: false }); setStarted(false); window.setTimeout(() => startGame(), 40) }}>REINTENTAR</button><button type="button" onClick={() => { const stats = pendingGameStatsRef.current; pendingGameStatsRef.current = null; setShowGameOver(false); if (stats) callbackRef.current.onGameComplete?.(stats) }}>VER MIS RESULTADOS</button></div></div>}
    {hud.done && !showGameOver && <div className="arcade2d-end-card arcade-victory-card"><img src={hero?.sprite || HERO_SPRITES.tech} alt={`${hero?.name || 'Tu héroe'} celebra la misión`}/><strong>Tu puntuación: {hud.score}</strong><span>{hud.noniLine}</span><button type="button" onClick={() => callbackRef.current.onGameComplete?.(pendingGameStatsRef.current)}>VER RESULTADOS</button></div>}
  </section>
}
