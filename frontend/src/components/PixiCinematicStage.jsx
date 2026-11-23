import { useEffect, useRef } from 'react'
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js'
import { GlowFilter, ShockwaveFilter } from 'pixi-filters'
import { HERO_SPRITES } from '../data/careers'
import { prepareArcadeSprite } from '../lib/spriteProcessor'

const HEROES = [
  { id: 'tech', src: '/assets/heroe-tecnologia.jpg', color: 0x50e9ff },
  { id: 'industry', src: '/assets/heroe-industria.jpg', color: 0xffad50 },
  { id: 'construction', src: '/assets/heroe-construccion.jpg', color: 0xe6c27d },
  { id: 'energy', src: '/assets/heroe-energia.jpg', color: 0xffe15d },
  { id: 'business', src: '/assets/heroe-negocios.jpg', color: 0x61edaa },
  { id: 'life', src: '/assets/heroe-vida.jpg', color: 0xff7898 },
]
const ENEMIES = [
  { src: '/assets/enemigo-coloso.jpg', color: 0xff344f },
  { src: '/assets/moros-boss.jpg', color: 0xff173f },
  { src: '/assets/enemigo-soldado.jpg', color: 0xff344f },
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

function setSprite(sprite, texture, glow, scale, x, y) {
  sprite.texture = texture
  sprite.texture.source.scaleMode = 'nearest'
  sprite.anchor.set(.5, 1)
  const ratio = Math.min(scale / sprite.texture.height, scale * .66 / sprite.texture.width)
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
      const panorama = new Sprite(); panorama.zIndex = 0; panorama.visible = false; panorama.anchor.set(.5); backgroundLayer.addChild(panorama)
      const background = makeGraphics(); background.zIndex = 1
      const floor = makeGraphics()
      const visor = makeGraphics(); visor.zIndex = 12; characterLayer.addChild(visor)
      backgroundLayer.addChild(background); floorLayer.addChild(floor)
      let panoramaReady = false
      let previousPanoramaReady = false
      const panoramaSrc = mode === 'landing' ? '/assets/edunexa-campus-panorama.png' : '/assets/edunexa-campus-moros-panorama.png'
      const panoramaImage = new Image()
      panoramaImage.decoding = 'async'
      panoramaImage.onload = () => {
        if (disposed) return
        panorama.texture = Texture.from(panoramaImage)
        panorama.texture.source.scaleMode = 'linear'
        panorama.visible = true
        panoramaReady = true
      }
      panoramaImage.onerror = () => { /* Mantén el fondo generado si la panorámica no está disponible. */ }
      panoramaImage.src = panoramaSrc
      const ambient = createParticles(particleLayer, mode === 'landing' ? 42 : 54, mode === 'landing' ? 4 : 9)
      const sources = mode === 'landing'
        ? [{ id: 'moros', src: HERO_SPRITES.morosBoss, color: 0xff304d }]
        : [{ id: 'noni', src: '/assets/nino-hernandez.webp', color: 0x48eaff }, ...HEROES, ...ENEMIES]
      const sprites = new Map()
      await Promise.all(sources.map(async (item) => {
        try {
          const processed = await prepareArcadeSprite(item.src)
          if (disposed) return
          const texture = Texture.from(processed.canvas)
          texture.source.scaleMode = 'nearest'
          const sprite = new Sprite(texture)
          const glow = new GlowFilter({ distance: 18, outerStrength: 2.2, color: rgb(item.color), quality: .16 })
          sprite.filters = [glow]
          sprite.visible = false
          characterLayer.addChild(sprite)
          sprites.set(item.id ?? item.src, { sprite, texture, color: item.color, source: item.src, glow })
        } catch { /* Omit an unavailable asset without interrupting the cinematic. */ }
      }))
      if (disposed) return

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
          else drawBackdrop(background, w, h, seconds, pointer, mode === 'landing')
        }
        if (panoramaReady) {
          const coverScale = Math.max(w / panorama.texture.width, h / panorama.texture.height) * 1.08
          panorama.scale.set(coverScale)
          panorama.position.set(w * (.5 - pointer.x * .022), h * (.5 - pointer.y * .022))
        }
        drawFloor(floor, w, h, seconds, w * (.5 + pointer.x * .02), h * .91)
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
        sprites.forEach(({ sprite }) => { sprite.visible = false })
        const put = (id, x, base, maxHeight, aura, z = 1) => {
          const entry = sprites.get(id)
          if (!entry) return
          const float = Math.sin(time * 2.1 + z) * 3
          const breathing = 1 + Math.sin(time * 2.4 + z) * .012
          const targetHeight = maxHeight * breathing
          setSprite(entry.sprite, entry.texture, entry.glow, targetHeight, x, base - float)
          if (aura) entry.glow.color = aura
          entry.glow.outerStrength = 1.65 + (Math.sin(time * 3.1 + z) + 1) * .46
          entry.sprite.zIndex = z
        }
        const scale = Math.min(w / 1440, h / 800, 1.35)
        if (mode === 'landing') {
          put('moros', w * (.55 + pointer.x * .016), h * .95 + pointer.y * 3, Math.min(h * .86, w * .61), 0xff2547, 1)
        } else if (act === 0) {
          put('noni', w * .37, h * .76, Math.min(h * .47, w * .28), 0x45ecff, 1)
          if (time > 3.8) { shock.center = { x: .67, y: .42 }; shock.time = (time - 3.8) * 1.2 }
        } else if (act === 1) {
          put(ENEMIES[0].src, w * .3, h * .9, Math.min(h * .56, w * .31), 0xff304d, 1)
          put(ENEMIES[1].src, w * (.55 + pointer.x * .008), h * .92, Math.min(h * .73, w * .42), 0xff173f, 3)
          put(ENEMIES[2].src, w * .78, h * .9, Math.min(h * .48, w * .27), 0xff304d, 2)
        } else if (act === 2) {
          HEROES.forEach((hero, index) => {
            const x = w * (.13 + index * .148)
            const heightFactor = index === 2 || index === 3 ? .43 : index === 1 || index === 4 ? .36 : .3
            put(hero.id, x, h * .88, Math.min(h * heightFactor, 310 * scale), hero.color, index)
          })
        } else {
          HEROES.forEach((hero, index) => put(hero.id, w * (.04 + index * .087), h * .84, Math.min(h * .3, 225 * scale), hero.color, index))
          put(ENEMIES[2].src, w * .62, h * .84, Math.min(h * .3, 220 * scale), 0xff304d, 7)
          put(ENEMIES[0].src, w * .73, h * .84, Math.min(h * .38, 280 * scale), 0xff304d, 8)
          put(ENEMIES[1].src, w * .88, h * .84, Math.min(h * .46, 335 * scale), 0xff173f, 9)
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
