import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { GlowFilter, ShockwaveFilter } from 'pixi-filters'
import { HERO_SPRITES } from '../data/careers'
import { prepareArcadeSprite, prepareArcadeSpriteStrip } from '../lib/spriteProcessor'

const HEROES = [
  { id: 'tech', src: '/assets/heroe-tecnologia.jpg', color: 0x50e9ff },
  { id: 'industry', src: '/assets/heroe-industria.jpg', color: 0xffad50 },
  { id: 'construction', src: '/assets/heroe-construccion.jpg', color: 0xe6c27d },
  { id: 'energy', src: '/assets/heroe-energia.jpg', color: 0xffe15d },
  { id: 'business', src: '/assets/heroe-negocios.jpg', color: 0x61edaa },
  { id: 'life', src: '/assets/heroe-vida.jpg', color: 0xff7898 },
]
const ENEMIES = [
  { id: 'colossus', src: '/assets/enemigo-coloso.jpg', color: 0xff344f },
  { id: 'moros', src: '/assets/moros-boss.jpg', color: 0xff173f },
  { id: 'soldier', src: '/assets/enemigo-soldado.jpg', color: 0xff344f },
  { id: 'drone', src: '/assets/enemigo-dron.jpg', color: 0xff344f },
]
const RUN_STRIPS = [
  ...HEROES.map((hero) => ({ id: hero.id, src: `/assets/heroe-${hero.id === 'tech' ? 'tecnologia' : hero.id === 'industry' ? 'industria' : hero.id === 'construction' ? 'construccion' : hero.id === 'energy' ? 'energia' : hero.id === 'business' ? 'negocios' : 'vida'}-run-strip.png` })),
  { id: 'moros', src: '/assets/moros-ataque-strip.png' },
  { id: 'soldier', src: '/assets/enemigo-soldado-run-strip.png' },
  { id: 'drone', src: '/assets/enemigo-dron-hover-strip.png' },
  { id: 'colossus', src: '/assets/enemigo-coloso-walk-strip.png' },
  { id: 'noni', src: '/assets/nino-guia-strip.png' },
  { id: 'npc-boy', src: '/assets/npc-estudiante-hombre-run-strip.png' },
  { id: 'npc-girl', src: '/assets/npc-estudiante-mujer-run-strip.png' },
  { id: 'npc-teacher', src: '/assets/npc-maestro-run-strip.png' },
]
const NPC_SPRITES = [
  { id: 'npc-boy', src: '/assets/npc-estudiante-hombre.webp', isNpc: true, role: 'studentJog', routeRate: .58, start: .27, routeRange: .08, y: .9, stepRate: 13.2 },
  { id: 'npc-girl', src: '/assets/npc-estudiante-mujer.webp', isNpc: true, role: 'studentBrisk', routeRate: .43, start: .53, routeRange: .085, y: .9, stepRate: 9.2 },
  { id: 'npc-teacher', src: '/assets/npc-maestro.webp', isNpc: true, role: 'teacherPatrol', routeRate: .31, start: .79, routeRange: .065, y: .9, stepRate: 5.1 },
]
const rgb = (hex) => hex

function makeGraphics() {
  const graphic = new Graphics()
  return graphic
}

function drawBackdrop(graphics, w, h, time, pointer, landing = false) {
  graphics.clear()
  graphics.rect(0, 0, w, h).fill({ color: 0x100d22 })
  graphics.rect(0, h * .39, w, h * .61).fill({ color: 0x281022, alpha: .48 })
  const eclipseX = w * (.53 + pointer.x * .012), eclipseY = h * .31 + pointer.y * 5
  const radius = Math.min(w, h) * (landing ? .19 : .16)
  graphics.circle(eclipseX, eclipseY, radius * 1.9).fill({ color: 0xe72850, alpha: .075 + Math.sin(time * 1.4) * .018 })
  graphics.circle(eclipseX, eclipseY, radius * 1.45).fill({ color: 0xf22f55, alpha: .12 })
  graphics.circle(eclipseX, eclipseY, radius * 1.06).stroke({ color: 0xff455d, width: 4, alpha: .72 })
  graphics.circle(eclipseX, eclipseY, radius).fill({ color: 0x100711 })
  // Cerro de la Estrella and layered Iztapalapa skyline.
  const ridge = (points, color, stroke, alpha, offset) => {
    graphics.moveTo(-20, h * .76)
    points.forEach(([x, y]) => graphics.lineTo(x * w + offset, y * h))
    graphics.lineTo(w + 20, h * .78).lineTo(w + 20, h).lineTo(-20, h).closePath()
      .fill({ color, alpha }).stroke({ color: stroke, width: 2, alpha: .72 })
  }
  ridge([[0,.59],[.1,.53],[.18,.57],[.27,.46],[.35,.51],[.43,.4],[.5,.48],[.6,.43],[.69,.54],[.77,.46],[.87,.51],[.96,.41],[1,.48]], 0x16182d, 0x8a5068, .92, -time * 1.4 + pointer.x * 5)
  ridge([[0,.66],[.12,.6],[.21,.64],[.31,.55],[.42,.61],[.53,.52],[.65,.64],[.73,.56],[.84,.62],[.94,.52],[1,.6]], 0x121c2c, 0x42b8ca, .94, -time * 2.8 + pointer.x * 11)
  const groundY = h * .78
  for (let i = 0; i < 12; i += 1) {
    const bw = w / 10
    const x = i * bw - 15 + pointer.x * 16
    const bh = h * (.075 + (i * 17 % 6) * .012)
    const top = groundY - bh
    graphics.rect(x, top, bw - 4, bh).fill({ color: i % 2 ? 0x121a2b : 0x21192d, alpha: .95 })
    graphics.rect(x, top, bw - 4, 2).fill({ color: i % 2 ? 0x4edce5 : 0xf45467, alpha: .75 })
    for (let yy = top + 10; yy < groundY - 5; yy += 12) for (let xx = x + 8; xx < x + bw - 10; xx += 14) {
      if (Math.sin(i * 4 + xx + yy) > -.2) graphics.rect(xx, yy, 3, 5).fill({ color: i % 2 ? 0x56d9e4 : 0xffc26e, alpha: .58 })
    }
  }
  graphics.rect(0, 0, w, h).fill({ color: 0x060914, alpha: .18 })
}

function drawDayBackdrop(graphics, w, h, time, pointer) {
  graphics.clear()
  graphics.rect(0, 0, w, h).fill({ color: 0x72b9ed })
  graphics.rect(0, h * .35, w, h * .36).fill({ color: 0xa7d9f4, alpha: .72 })
  graphics.circle(w * (.79 - pointer.x * .01), h * .2, Math.min(w, h) * .055).fill({ color: 0xffefb0, alpha: .95 })
  for (let cloud = 0; cloud < 5; cloud += 1) {
    const x = ((cloud * .24 + time * .003) % 1) * w
    const y = h * (.18 + (cloud % 3) * .075)
    graphics.ellipse(x, y, w * .07, h * .018).fill({ color: 0xf1fbff, alpha: .72 })
    graphics.circle(x - w * .024, y - h * .012, h * .025).fill({ color: 0xf1fbff, alpha: .72 })
    graphics.circle(x + w * .009, y - h * .017, h * .032).fill({ color: 0xf1fbff, alpha: .72 })
  }
  graphics.poly([0, h * .62, w * .17, h * .38, w * .34, h * .62, w * .53, h * .42, w * .73, h * .63, w, h * .4, w, h, 0, h]).fill({ color: 0x527f77 })
  graphics.poly([0, h * .69, w * .22, h * .51, w * .4, h * .69, w * .64, h * .5, w * .82, h * .7, w, h * .55, w, h, 0, h]).fill({ color: 0x346c59 })
  const campusY = h * .66
  for (let building = 0; building < 8; building += 1) {
    const bw = w * (.105 + (building % 3) * .018)
    const bh = h * (.1 + (building % 4) * .025)
    const x = building * w * .13 - pointer.x * 5
    const y = campusY - bh
    graphics.rect(x, y, bw, bh).fill({ color: building % 2 ? 0xd7c9a7 : 0xe5dbbf })
    graphics.rect(x, y, bw, h * .012).fill({ color: 0x34749a })
    for (let row = 0; row < 2; row += 1) for (let col = 0; col < 3; col += 1) {
      graphics.rect(x + bw * (.16 + col * .27), y + bh * (.3 + row * .32), bw * .12, h * .016).fill({ color: 0x397798, alpha: .9 })
    }
  }
  graphics.rect(0, h * .72, w, h * .28).fill({ color: 0x66815b })
  graphics.rect(0, h * .83, w, h * .17).fill({ color: 0x515b61 })
  graphics.rect(0, h * .82, w, h * .015).fill({ color: 0xe8cc76 })
}

function drawFloor(graphics, w, h, time, targetX, targetY) {
  graphics.clear()
  const top = h * .68
  graphics.poly([0, top, w, top, w, h, 0, h]).fill({ color: 0x68142c, alpha: .26 })
  const horizonX = w * .52
  for (let row = 0; row < 11; row += 1) {
    const p = row / 10
    const y = top + p * p * (h - top)
    graphics.moveTo(0, y).lineTo(w, y).stroke({ color: 0xf04b67, width: 1, alpha: .12 + p * .2 })
  }
  for (let col = -7; col <= 7; col += 1) {
    graphics.moveTo(horizonX, top).lineTo(horizonX + col * w * .12, h).stroke({ color: 0x66d7eb, width: 1, alpha: .13 })
  }
  graphics.ellipse(targetX, targetY, w * .19, h * .032).fill({ color: 0xff2147, alpha: .18 + Math.sin(time * 3) * .05 })
  graphics.ellipse(targetX, targetY, w * .09, h * .016).fill({ color: 0x080811, alpha: .8 })
}

function createParticles(container, count, seed = 0) {
  const particles = []
  for (let i = 0; i < count; i += 1) {
    const dot = new Graphics().circle(0, 0, 1.2 + (i % 4) * .45).fill({ color: i % 5 === 0 ? 0x8af6ff : (i % 2 ? 0xff944e : 0xff425a), alpha: .7 })
    dot.zIndex = i % 2 ? 1 : 0
    container.addChild(dot)
    particles.push({ node: dot, x: ((i * 73 + seed * 17) % 100) / 100, y: ((i * 43 + seed * 11) % 100) / 100, speed: .035 + (i % 7) * .012, phase: i * 1.71 })
  }
  return particles
}

function setSprite(sprite, texture, glow, scale, x, y, preserveHeight = false) {
  sprite.texture = texture
  sprite.texture.source.scaleMode = 'nearest'
  sprite.anchor.set(.5, 1)
  const ratio = preserveHeight ? scale / sprite.texture.height : Math.min(scale / sprite.texture.height, scale * .66 / sprite.texture.width)
  sprite.scale.set(ratio)
  sprite.position.set(x, y)
  sprite.visible = true
}

export default function PixiCinematicStage({ mode = 'intro', scene = 0, elapsed = 0, onStart }) {
  const hostRef = useRef(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const liveRef = useRef({ scene, elapsed, onStart })
  liveRef.current = { scene, elapsed, onStart }

  useEffect(() => {
    let disposed = false
    let app
    let initialized = false
    let resizeObserver
    const host = hostRef.current
    if (!host) return undefined
    const pointerMove = (event) => {
      const rect = host.getBoundingClientRect()
      pointerRef.current.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2))
      pointerRef.current.y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2))
    }
    const pointerLeave = () => { pointerRef.current.x = 0; pointerRef.current.y = 0 }
    const setup = async () => {
      app = new Application()
      await app.init({ resizeTo: host, backgroundColor: 0x100d22, antialias: false, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 1.5), preference: 'webgl', powerPreference: 'high-performance' })
      initialized = true
      if (disposed) { app.destroy(true, { children: true }); return }
      host.appendChild(app.canvas)
      app.stage.sortableChildren = true
      const backgroundLayer = new Container(); backgroundLayer.zIndex = 0; app.stage.addChild(backgroundLayer)
      backgroundLayer.sortableChildren = true
      const floorLayer = new Container(); floorLayer.zIndex = 1; app.stage.addChild(floorLayer)
      const characterLayer = new Container(); characterLayer.zIndex = 2; characterLayer.sortableChildren = true; app.stage.addChild(characterLayer)
      const particleLayer = new Container(); particleLayer.zIndex = 3; app.stage.addChild(particleLayer)
      const panoramaDay = new Sprite(); panoramaDay.zIndex = 0; panoramaDay.visible = false; panoramaDay.anchor.set(.5); backgroundLayer.addChild(panoramaDay)
      const panoramaDomain = new Sprite(); panoramaDomain.zIndex = 1; panoramaDomain.visible = false; panoramaDomain.anchor.set(.5); backgroundLayer.addChild(panoramaDomain)
      const background = makeGraphics(); background.zIndex = 2
      const floor = makeGraphics()
      const visor = makeGraphics(); visor.zIndex = 12; characterLayer.addChild(visor)
      const domainTint = makeGraphics(); domainTint.zIndex = 3; backgroundLayer.addChild(domainTint)
      backgroundLayer.addChild(background); floorLayer.addChild(floor)
      let panoramaReady = false
      let panoramaDomainReady = false
      let previousPanoramaReady = false
      const loadPanorama = (sprite, src, onReady) => {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
          if (disposed) return
          sprite.texture = Texture.from(image)
          sprite.texture.source.scaleMode = 'linear'
          sprite.visible = true
          onReady()
        }
        image.onerror = () => { /* Usa el fondo disponible si una panorámica no carga. */ }
        image.src = src
      }
      loadPanorama(panoramaDay, mode === 'intro' ? '/assets/edunexa-campus-diurna-panorama.png' : '/assets/edunexa-campus-panorama.png', () => { panoramaReady = true })
      if (mode === 'intro') loadPanorama(panoramaDomain, '/assets/edunexa-campus-moros-panorama.png', () => { panoramaDomainReady = true })
      const ambient = createParticles(particleLayer, mode === 'landing' ? 42 : 54, mode === 'landing' ? 4 : 9)
      const sources = mode === 'landing'
        ? [{ id: 'moros', src: HERO_SPRITES.morosBoss, color: 0xff304d }]
        : [{ id: 'noni', src: '/assets/nino-hernandez.webp', color: 0x48eaff }, ...HEROES, ...ENEMIES, ...NPC_SPRITES]
      const sprites = new Map()
      // Never hold the first painted frame hostage to every character sheet. The
      // background and fallback skyline can render while sprites are prepared.
      const loadCharacters = (async () => {
        await Promise.all(sources.map(async (item) => {
          try {
            const processed = await prepareArcadeSprite(item.src)
            if (disposed) return
            const texture = Texture.from(processed.canvas)
            texture.source.scaleMode = 'nearest'
            const sprite = new Sprite(texture)
            const shadow = makeGraphics()
            shadow.visible = false
            characterLayer.addChild(shadow)
            const glow = item.isNpc ? null : new GlowFilter({ distance: 18, outerStrength: 2.2, color: rgb(item.color), quality: .16 })
            sprite.filters = glow ? [glow] : []
            sprite.visible = false
            characterLayer.addChild(sprite)
            sprites.set(item.id ?? item.src, { sprite, texture, color: item.color, source: item.src, glow, shadow, isNpc: Boolean(item.isNpc) })
          } catch { /* Omit an unavailable asset without interrupting the cinematic. */ }
        }))
        if (disposed || mode !== 'intro') return
        await Promise.all(RUN_STRIPS.map(async ({ id, src }) => {
          const entry = sprites.get(id)
          if (!entry) return
          try {
            const strip = await prepareArcadeSpriteStrip(src, 8)
            if (disposed) return
            entry.frames = strip.frames.map((frame) => {
              const texture = Texture.from(frame)
              texture.source.scaleMode = 'nearest'
              return texture
            })
          } catch { /* Keep the solid character visible when a run strip is unavailable. */ }
        }))
      })()
      loadCharacters.catch(() => { /* Individual unavailable sprites never block the opening. */ })

      const shock = new ShockwaveFilter({ center: { x: .5, y: .43 }, speed: 480, amplitude: 22, wavelength: 115, brightness: 1.4, radius: -1, time: 0 })
      let previousScene = -1
      let width = 0; let height = 0
      const draw = () => {
        const w = host.clientWidth || 1; const h = host.clientHeight || 1
        const { scene: act, elapsed: seconds } = liveRef.current
        const pointer = pointerRef.current
        if (w !== width || h !== height || act !== previousScene || panoramaReady !== previousPanoramaReady) {
          width = w; height = h; previousScene = act
          previousPanoramaReady = panoramaReady
          if (panoramaReady) background.clear()
          else if (mode === 'intro') drawDayBackdrop(background, w, h, seconds, pointer)
          else drawBackdrop(background, w, h, seconds, pointer, true)
        }
        const domainProgress = mode === 'intro' ? Math.max(0, Math.min(1, (seconds - 5.5) / 1.55)) : 0
        const domainBlend = domainProgress * domainProgress * (3 - 2 * domainProgress)
        if (panoramaReady) {
          const dayScale = Math.max(w / panoramaDay.texture.width, h / panoramaDay.texture.height) * 1.08
          panoramaDay.scale.set(dayScale)
          panoramaDay.position.set(w * (.5 - pointer.x * .022), h * (.5 - pointer.y * .022))
          panoramaDay.tint = 0xffffff
          panoramaDay.alpha = 1
        }
        if (panoramaDomainReady) {
          const domainScale = Math.max(w / panoramaDomain.texture.width, h / panoramaDomain.texture.height) * 1.08
          panoramaDomain.scale.set(domainScale)
          panoramaDomain.position.set(w * (.5 - pointer.x * .022), h * (.5 - pointer.y * .022))
          panoramaDomain.tint = 0xffffff
          panoramaDomain.alpha = domainBlend
        }
        domainTint.clear()
        if (mode === 'intro' && domainBlend > 0) {
          const takeover = Math.max(0, Math.min(1, (seconds - 5.5) / .58))
          const pulse = (.12 + (Math.sin(seconds * 4.1) + 1) * .075) * domainBlend
          domainTint.rect(0, 0, w, h).fill({ color: 0x25040c, alpha: pulse })
          for (let edge = 0; edge < 5; edge += 1) {
            const inset = edge * Math.min(w, h) * .035
            domainTint.rect(inset, inset, w - inset * 2, h - inset * 2).stroke({ color: 0x10030a, width: Math.min(w, h) * .026, alpha: (.08 + edge * .025) * domainBlend })
          }
          const pulseX = w * (.5 + Math.sin(seconds * 1.6) * .18)
          const pulseY = h * (.44 + Math.sin(seconds * 2.3) * .025)
          const pulseRadius = Math.min(w, h) * (.12 + domainProgress * .48)
          // A spreading crimson breach makes the change read as an event, not a red filter.
          domainTint.circle(pulseX, pulseY, pulseRadius).fill({ color: 0xe7193d, alpha: (.1 + pulse * .16) * domainBlend })
          domainTint.circle(pulseX, pulseY, pulseRadius * .72).stroke({ color: 0xff405e, width: Math.max(2, Math.min(w, h) * .009), alpha: (.16 + (1 - takeover) * .38) * domainBlend })
          if (domainProgress < 1) {
            const breachX = w * (.14 + takeover * .72)
            domainTint.moveTo(breachX - w * .16, h * .08).lineTo(breachX + w * .08, h * .42).lineTo(breachX - w * .06, h * .58).lineTo(breachX + w * .18, h * .94)
              .stroke({ color: 0xff5264, width: Math.max(2, w * .0025), alpha: (1 - takeover) * .72 })
            domainTint.moveTo(breachX - w * .12, h * .1).lineTo(breachX + w * .11, h * .43).lineTo(breachX - w * .025, h * .57).lineTo(breachX + w * .21, h * .92)
              .stroke({ color: 0xffd4bb, width: Math.max(1, w * .0008), alpha: (1 - takeover) * .62 })
          }
        }
        if (mode === 'landing') drawFloor(floor, w, h, seconds, w * (.5 + pointer.x * .02), h * .91)
        else floor.clear()
        visor.clear()
        if (mode === 'intro' && act === 0) {
          const left = w * .14; const right = w * .64; const top = h * .25; const bottom = h * .78
          const corner = Math.min(w, h) * .035
          ;[[left,top,1,1],[right,top,-1,1],[left,bottom,1,-1],[right,bottom,-1,-1]].forEach(([x,y,sx,sy]) => {
            visor.moveTo(x + corner * sx, y).lineTo(x, y).lineTo(x, y + corner * sy).stroke({ color: 0x58efff, width: 2, alpha: .74 })
          })
          for (let line = 0; line < 17; line += 1) {
            const y = top + 20 + line * ((bottom - top - 40) / 17)
            visor.moveTo(left + 15, y).lineTo(right - 15, y).stroke({ color: 0x4fd9f2, width: 1, alpha: .055 })
          }
          const scanY = top + ((seconds * 90) % (bottom - top))
          visor.moveTo(left, scanY).lineTo(right, scanY).stroke({ color: 0x88fbff, width: 2, alpha: .42 })
          visor.roundRect(left + 15, top + 18, 138, 24, 4).fill({ color: 0x062431, alpha: .78 }).stroke({ color: 0x4feeff, width: 1, alpha: .56 })
          visor.rect(left + 25, top + 29, 5, 5).fill({ color: 0x65fff3, alpha: .9 })
        }
        if (!panoramaReady) background.position.set(pointer.x * 2, pointer.y * 2)
        const time = seconds
        sprites.forEach(({ sprite, shadow }) => { sprite.visible = false; shadow.visible = false })
        const put = (id, x, base, maxHeight, aura, z = 1, frameIndex = 0, flip = false) => {
          const entry = sprites.get(id)
          if (!entry) return
          const texture = frameIndex >= 0 && entry.frames?.length ? entry.frames[frameIndex % entry.frames.length] : entry.texture
          const float = Math.sin(time * 2.1 + z) * 3
          const breathing = 1 + Math.sin(time * 2.4 + z) * .012
          const targetHeight = maxHeight * breathing
          setSprite(entry.sprite, texture, entry.glow, targetHeight, x, base - float, mode !== 'landing')
          entry.sprite.scale.x *= flip ? -1 : 1
          entry.sprite.alpha = 1
          entry.shadow.clear().ellipse(x, base - 1, targetHeight * .145, Math.max(3, targetHeight * .022)).fill({ color: 0x090b12, alpha: .43 })
          entry.shadow.visible = true
          entry.shadow.zIndex = z
          if (entry.glow) {
            if (aura) entry.glow.color = aura
            entry.glow.outerStrength = 1.65 + (Math.sin(time * 3.1 + z) + 1) * .46
          }
          entry.sprite.zIndex = z + .01
        }
        const scale = Math.min(w / 1440, h / 800, 1.35)
        const actorHeight = Math.min(h * .27, w * .22)
        if (mode === 'landing') {
          put('moros', w * (.55 + pointer.x * .016), h * .95 + pointer.y * 3, Math.min(h * .86, w * .61), 0xff2547, 1)
        } else if (act === 0) {
          // First let the premise land; Nino enters only after its opening card.
          if (time >= 2.15) {
            put('noni', w * .12, h * .9, actorHeight, 0x45ecff, 9, Math.floor(time * 2.4))
            const guideSprite = sprites.get('noni')?.sprite
            if (guideSprite) {
              guideSprite.alpha = Math.min(1, (time - 2.15) / .45)
              guideSprite.rotation = Math.sin(time * 1.7) * .012
            }
          }
          NPC_SPRITES.forEach((npc, index) => {
            const routePhase = time * npc.routeRate + index * 1.7
            const route = npc.start + Math.sin(routePhase) * npc.routeRange
            const x = w * Math.max(.02, Math.min(.98, route))
            const step = time * npc.stepRate + index * 1.7
            const atTurnaround = npc.role !== 'studentJog' && Math.abs(Math.cos(routePhase)) < .22
            const poseStep = atTurnaround ? 0 : step
            const bobScale = npc.role === 'studentJog' ? .011 : npc.role === 'studentBrisk' ? .0065 : .0025
            const bob = Math.abs(Math.sin(poseStep)) * h * bobScale
            const size = actorHeight
            const movingLeft = Math.cos(routePhase) < 0
            put(npc.id, x, h * npc.y + bob, size, null, index, Math.floor(poseStep / (Math.PI * 2) * 8), movingLeft)
            const npcSprite = sprites.get(npc.id)?.sprite
            if (npcSprite) {
              const sway = npc.role === 'studentJog' ? .024 : npc.role === 'studentBrisk' ? .012 : .005
              const nod = npc.role === 'teacherPatrol' ? Math.sin(time * (atTurnaround ? 4 : 1.8)) * (atTurnaround ? .024 : .008) : 0
              const glance = npc.role === 'studentBrisk' && atTurnaround ? Math.sin(time * 5) * .018 : 0
              npcSprite.rotation = Math.sin(poseStep) * sway + nod + glance
            }
          })
          if (time > 3.8) { shock.center = { x: .67, y: .42 }; shock.time = (time - 3.8) * 1.2 }
        } else if (act === 1) {
          const advance = (time - 5.5) * w * .012
          put('soldier', w * .2 + advance, h * .9, actorHeight, 0xff304d, 2, Math.floor(time * 10))
          put('colossus', w * .4 + advance * .48, h * .9, actorHeight, 0xff304d, 3, Math.floor(time * 7))
          put('drone', w * .8 - advance * .4, h * .68 + Math.sin(time * 3) * h * .018, actorHeight, 0xff304d, 4, Math.floor(time * 11), true)
          put('moros', w * (.61 + pointer.x * .008), h * .9, actorHeight, 0xff173f, 6, Math.floor((time - 5.5) * 8))
        } else if (act === 2) {
          // Six staggered arrivals split across the depth of the campus. The actors
          // keep moving and firing so this reads as a rescue, not a roster lineup.
          const actTime = time - 11.5
          const formation = [
            { x: .12, y: .91, fromRight: false }, { x: .29, y: .77, fromRight: true },
            { x: .46, y: .91, fromRight: false }, { x: .63, y: .77, fromRight: true },
            { x: .80, y: .91, fromRight: false }, { x: .92, y: .77, fromRight: true },
          ]
          HEROES.forEach((hero, index) => {
            const pose = formation[index]
            const local = Math.max(0, Math.min(1, (actTime - index * .19) / .8))
            const arrival = 1 - (1 - local) ** 3
            const startX = pose.fromRight ? 1.14 + index * .018 : -.16 - index * .016
            const combatBeat = Math.max(0, actTime - .8 - index * .1)
            const lunge = Math.max(0, Math.sin(combatBeat * 3.1 + index * 1.4)) * w * .012
            const jump = Math.max(0, Math.sin(combatBeat * 2.4 + index * 1.2)) * h * (index % 2 ? .024 : .012)
            const x = w * (startX + (pose.x - startX) * arrival) + (pose.fromRight ? -lunge : lunge)
            const base = h * pose.y - jump
            const frame = Math.floor(time * (local < 1 ? 13 : 9) + index * 2)
            put(hero.id, x, base, actorHeight, hero.color, 2 + index, frame, pose.fromRight && local < .82)

            // Each hero's shot has its own color, cadence and trajectory.
            const firing = Math.sin(combatBeat * (2.5 + index * .08) + index * 1.7) > -.28
            if (!firing || local < .7) return
            const dir = pose.fromRight && local < .82 ? -1 : 1
            const muzzleX = x + dir * actorHeight * .2
            const muzzleY = base - actorHeight * (.54 + Math.sin(time * 9 + index) * .018)
            const travel = (time * (1.15 + (index % 3) * .13) + index * .19) % 1
            const shotX = muzzleX + dir * travel * w * .23
            const shotY = muzzleY + Math.sin(travel * 4 + index) * h * .015
            const tint = [0x53e9ff, 0xffa94c, 0x7cffa0, 0x57c8ff, 0x76ffc4, 0x85f7ff][index]
            visor.moveTo(muzzleX, muzzleY).lineTo(shotX, shotY).stroke({ color: tint, width: index === 1 ? 4 : 2.5, alpha: .22 + .62 * (1 - travel) })
            if (index === 1 || index === 3) {
              visor.moveTo(shotX, shotY - 7).lineTo(shotX + dir * 9, shotY).lineTo(shotX, shotY + 7).stroke({ color: 0xffdc91, width: 2, alpha: .78 })
            } else {
              visor.rect(shotX - 3, shotY - 2, 8, 4).fill({ color: tint, alpha: .8 })
            }
            visor.circle(muzzleX, muzzleY, 2 + (Math.sin(time * 17 + index) + 1) * 2).fill({ color: 0xfff1b1, alpha: .55 })
          })
        } else {
          // Final beat: three heroes form a moving spearhead, while MOROS is
          // forced back into the rift. The guide remains large enough to read.
          const finale = time - 17.5
          const leaders = [
            { id: 'tech', x: .22, y: .9, color: 0x53e9ff },
            { id: 'industry', x: .45, y: .77, color: 0xffa94c },
            { id: 'life', x: .65, y: .91, color: 0x85f7ff },
          ]
          leaders.forEach((actor, index) => {
            const surge = Math.max(0, Math.sin(finale * 3.3 + index * 1.8))
            const x = w * actor.x + surge * w * .022
            const jump = Math.max(0, Math.sin(finale * 3.8 + index * 1.4)) * h * .028
            const base = h * actor.y - jump
            put(actor.id, x, base, actorHeight, actor.color, 3 + index, Math.floor(time * 12 + index * 2))
            const beamEnd = w * (.79 - index * .025)
            const beamY = base - actorHeight * (.54 + index * .035)
            const beamPulse = .45 + (Math.sin(time * 13 + index) + 1) * .25
            visor.moveTo(x + actorHeight * .18, beamY).lineTo(beamEnd, beamY - index * 4).stroke({ color: actor.color, width: 3 + beamPulse * 2, alpha: beamPulse })
            visor.moveTo(beamEnd - 8, beamY - 6).lineTo(beamEnd + 6, beamY).lineTo(beamEnd - 8, beamY + 6).stroke({ color: 0xffedb0, width: 2, alpha: beamPulse })
          })
          const bossRetreat = Math.min(1, Math.max(0, (finale - .2) / 2.7))
          const morosX = w * (.82 + bossRetreat * .3)
          const morosHeight = Math.min(h * .52, w * .34)
          put('moros', morosX, h * .93, morosHeight, 0xff173f, 8, Math.floor(time * 8), true)
          const morosSprite = sprites.get('moros')?.sprite
          if (morosSprite) morosSprite.alpha = 1 - bossRetreat * .72
          put('noni', w * .075, h * .91, actorHeight * .78, 0x45ecff, 10, Math.floor(time * 2.4))
          if (finale < 2.5) {
            const riftX = w * (.84 + bossRetreat * .16)
            const riftY = h * .48
            for (let ring = 0; ring < 4; ring += 1) {
              const radius = Math.min(w, h) * (.065 + ring * .025 + Math.sin(time * 4 + ring) * .004)
              visor.circle(riftX, riftY, radius).stroke({ color: ring % 2 ? 0xff4961 : 0xffb15b, width: 2.5, alpha: (1 - bossRetreat) * (.65 - ring * .08) })
            }
            visor.rect(riftX - 2, h * .38, 4, h * .24).fill({ color: 0xff4d64, alpha: (1 - bossRetreat) * .38 })
          }
          for (let shot = 0; shot < 3; shot += 1) {
            const impact = ((time * 2.8 + shot * .34) % 1)
            const sx = w * (.29 + shot * .14) + impact * w * .45
            const sy = h * (.68 - shot * .07)
            visor.moveTo(sx - 17, sy).lineTo(sx + 18, sy - 4).stroke({ color: shot % 2 ? 0x74ffdf : 0xffd16a, width: 3, alpha: .32 + (1 - impact) * .65 })
          }
          if (time > 17.7) {
            shock.center = { x: .51, y: .42 }
            shock.time = Math.max(0, (time - 17.7) % 3.8)
            characterLayer.filters = [shock]
          } else characterLayer.filters = []
        }
        ambient.forEach(({ node, x, y, speed, phase }, index) => {
          const px = ((x + Math.sin(time * .7 + phase) * .025 + pointer.x * (.012 + index % 3 * .004)) % 1 + 1) % 1
          const py = ((y - time * speed + 1) % 1)
          node.position.set(px * w, py * h)
          node.alpha = .28 + (Math.sin(time * 3 + phase) + 1) * .32
          const depth = .5 + (index % 4) * .2
          node.scale.set(depth)
        })
      }
      draw()
      app.ticker.add(draw)
      resizeObserver = new ResizeObserver(draw); resizeObserver.observe(host)
      host.addEventListener('pointermove', pointerMove)
      host.addEventListener('pointerleave', pointerLeave)
    }
    setup().catch((error) => { if (!disposed) console.error('No se pudo iniciar la escena PixiJS:', error) })
    return () => {
      disposed = true
      resizeObserver?.disconnect()
      host.removeEventListener('pointermove', pointerMove)
      host.removeEventListener('pointerleave', pointerLeave)
      if (app) {
        if (initialized) {
          app.ticker.stop()
          app.destroy(true, { children: true, texture: true, textureSource: true })
        }
      }
    }
  }, [mode])

  return <div ref={hostRef} className={`pixi-scene pixi-scene-${mode}`} aria-hidden="true" />
}
