import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, Html } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Scanline, Vignette } from '@react-three/postprocessing'
import { AdditiveBlending, BufferGeometry, BufferAttribute, CanvasTexture, Color, Line, LineBasicMaterial, MathUtils, Plane, PointsMaterial, Quaternion, SRGBColorSpace, Sprite, SpriteMaterial, Vector2, Vector3 } from 'three'
import { Trophy } from 'lucide-react'
import { HERO_CLASSES } from './CharacterSelect'
import { playCoin, playExplosion, playNavigate, playReload, playShot, playSuccess, startMusic, stopMusic } from '../lib/audio'

const CATEGORIES = ['law', 'social', 'tech', 'engineering', 'design', 'business', 'humanities']
const CATEGORY_LABELS = { law: 'Derecho', social: 'Salud', tech: 'Tecnología', engineering: 'Ingenierías', design: 'Artes', business: 'Negocios', humanities: 'Humanidades' }
const PASSIONS = {
  law: ['Litigio y derechos', 'Justicia digital', 'Políticas públicas'], social: ['Medicina y salud', 'Biotecnología', 'Impacto social'],
  tech: ['Inteligencia artificial', 'Ciberseguridad', 'Software'], engineering: ['Mecatrónica', 'Robótica', 'Automatización'],
  design: ['Videojuegos', 'Arte digital 3D', 'Diseño UX'], business: ['Finanzas y datos', 'Emprendimiento', 'Estrategia'], humanities: ['Psicología', 'Educación', 'Cultura y comunidad'],
}
const AVERSIONS_BY_HERO = {
  tech: ['Burocracia Manual', 'Papeleo Infinito', 'Lectura Extensiva de Manuales', 'Servidor Caído Sin Documentar'],
  humanities: ['Cálculos Integrales Complex', 'Ecuaciones Diferenciales', 'Estadística Rigurosa', 'Cálculo Financiero'],
  social: ['Filas Eternas de Espera', 'Falta de Insumos', 'Negligencia Médica', 'Papeleo Administrativo'],
  law: ['Trámites Archivados', 'Injusticia Sistémica', 'Soborno Burocrático', 'Expedientes Perdidos'],
  design: ['Plantillas Copiadas', 'Diseños Genéricos', 'Monotonía Visual', 'Rechazo de Arte'],
  business: ['Hojas de Cálculo Estancadas', 'Deuda Acumulada', 'Quiebra Financiera', 'Procesos Lentos'],
}
const BOSS_BY_HERO = {
  tech: 'El Titán del Monolito Legacy', humanities: 'El Leviatán del Algoritmo Ciego',
  social: 'El Enjambre del Colapso Hospitalario', law: 'El Demonio del Litigio Eterno',
  design: 'El Espectro de la Copia Automatizada', business: 'El Monstruo de la Inflación',
}
const CAMERA_Z = 10
const TARGET_LIMIT_Z = 7.2
const TUNNEL_SPEED = 9.5
const RAIL_LENGTH = 48
const RAIL_FOV = Math.tan(60 * Math.PI / 360)

function SceneLabel({ position, children, color = '#f2fff9', size = 10 }) {
  return <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}><span className="webgl-3d-label" style={{ color, fontSize: `${size}px` }}>{children}</span></Html>
}

function makeGame(hero) {
  return { score: 0, xp: 0, freedom: 0, lives: 3, shots: 0, hits: 0, zombieHits: 0, passionHits: 0, wave: 0, counts: Object.fromEntries(CATEGORIES.map((category) => [category, 0])), hero, done: false }
}

function GlowLine({ points, color = '#45f4d2', opacity = .45 }) {
  const geometry = useMemo(() => new BufferGeometry().setFromPoints(points.map(([x, y, z]) => new Vector3(x, y, z))), [points])
  return <primitive object={new Line(geometry, new LineBasicMaterial({ color, transparent: true, opacity }))} dispose={null} />
}

function WarpTunnel() {
  const rings = useRef([])
  const stars = useRef([])
  const grid = useRef(null)
  const ringPositions = useMemo(() => Array.from({ length: 22 }, (_, index) => -39 + index * 2.2), [])
  const starPositions = useMemo(() => Array.from({ length: 64 }, () => ({ x: (Math.random() - .5) * 26, y: (Math.random() - .5) * 18, z: -38 + Math.random() * 46, size: .012 + Math.random() * .025 })), [])
  useFrame((_, delta) => {
    rings.current.forEach((ring) => {
      if (!ring) return
      ring.position.z += delta * TUNNEL_SPEED
      if (ring.position.z > 9) ring.position.z -= RAIL_LENGTH
      ring.rotation.z += delta * .035
    })
    stars.current.forEach((star) => {
      if (!star) return
      star.position.z += delta * TUNNEL_SPEED * (1.15 + star.userData.speed)
      if (star.position.z > 9) {
        star.position.z = -39
        star.position.x = (Math.random() - .5) * 26
        star.position.y = (Math.random() - .5) * 18
      }
    })
    if (grid.current) {
      grid.current.position.z += delta * TUNNEL_SPEED
      if (grid.current.position.z > -3) grid.current.position.z -= 3
    }
  })
  return <group>
    {ringPositions.map((z, index) => <mesh key={index} ref={(node) => { rings.current[index] = node }} position={[0, 0, z]}>
      <torusGeometry args={[5.6, .018, 6, 72]} /><meshBasicMaterial color={index % 3 === 0 ? '#ff48c7' : '#32f4d0'} toneMapped={false} transparent opacity={.58} />
    </mesh>)}
    {[-1, 1].flatMap((side) => [-1, 1].map((vertical) => <GlowLine key={`${side}-${vertical}`} points={[[0, 0, -39], [side * 6.3, vertical * 4.2, 8]]} color={side === vertical ? '#39f6d0' : '#ed45cf'} opacity={.28} />))}
    <mesh position={[0, -3.25, -6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[130, 130]} /><meshBasicMaterial color="#031410" />
    </mesh>
    <Grid ref={grid} position={[0, -3.23, -6]} args={[130, 130]} cellSize={.8} cellThickness={.45} sectionSize={4} sectionThickness={.9} cellColor="#14554e" sectionColor="#39f0b2" fadeDistance={44} fadeStrength={1.3} infiniteGrid />
    {starPositions.map((star, index) => <mesh key={index} ref={(node) => {
      stars.current[index] = node
      if (node) node.userData.speed = star.size * 12
    }} position={[star.x, star.y, star.z]}>
      <sphereGeometry args={[star.size, 5, 5]} /><meshBasicMaterial color={index % 5 === 0 ? '#ff70d0' : '#a3fff0'} toneMapped={false} />
    </mesh>)}
  </group>
}

function GameWorld({ targets, targetMeshes, aimRef, onTargetHit, onMiss, onFire, pendingShotRef }) {
  const { camera, raycaster, size } = useThree()
  const aim = useRef(null)
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), -8.55), [])
  const tempPoint = useMemo(() => new Vector3(), [])

  useFrame(() => {
    raycaster.setFromCamera(aimRef.current, camera)
    if (aim.current && raycaster.ray.intersectPlane(plane, tempPoint)) aim.current.position.copy(tempPoint)
    if (!pendingShotRef.current) return
    pendingShotRef.current = false
    const objects = [...targetMeshes.current.values()].filter(Boolean)
    raycaster.setFromCamera(aimRef.current, camera)
    const hit = raycaster.intersectObjects(objects, true)[0]
    const endpoint = hit?.point || raycaster.ray.at(42, new Vector3())
    let node = hit?.object
    while (node && !node.userData.targetId) node = node.parent
    const targetId = node?.userData.targetId
    const shot = { id: `${Date.now()}-${Math.random()}`, from: [.76, -.48, 7.42], to: endpoint.toArray() }
    queueMicrotask(() => {
      onFire(shot)
      if (targetId) onTargetHit(targetId)
      else onMiss()
    })
  })

  return <>
    {targets.map((target) => <Target key={target.id} target={target} targetMeshes={targetMeshes} aspect={size.width / Math.max(size.height, 1)} />)}
    <mesh position={[0, 0, 8.5]} onPointerMove={(event) => aimRef.current.copy(event.pointer)} onPointerDown={(event) => { event.stopPropagation(); pendingShotRef.current = true }}>
      <planeGeometry args={[100, 100]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh ref={aim}>
      <torusGeometry args={[.065, .009, 6, 28]} /><meshBasicMaterial color="#ff4ccb" toneMapped={false} />
      <mesh position={[0, 0, .004]}><sphereGeometry args={[.012, 8, 8]} /><meshBasicMaterial color="#fff" toneMapped={false} /></mesh>
    </mesh>
  </>
}

function createEnemyTexture(target, boss) {
  const canvas = document.createElement('canvas')
  canvas.width = 384; canvas.height = 384
  const context = canvas.getContext('2d')
  const accent = target.color || '#ff4d85'
  const glow = context.createRadialGradient(192, 155, 18, 192, 175, 180)
  glow.addColorStop(0, boss ? 'rgba(255,75,140,.34)' : 'rgba(255,92,141,.24)')
  glow.addColorStop(1, 'rgba(9,10,28,0)')
  context.fillStyle = glow; context.fillRect(0, 0, 384, 384)
  context.save(); context.shadowColor = accent; context.shadowBlur = 25; context.strokeStyle = accent; context.lineWidth = 5
  context.beginPath(); context.roundRect(30, 28, 324, 325, 33); context.stroke(); context.restore()
  context.fillStyle = 'rgba(7,12,28,.84)'; context.beginPath(); context.roundRect(34, 31, 316, 318, 30); context.fill()
  if (boss) {
    context.save(); context.shadowColor = '#ff3c91'; context.shadowBlur = 28
    context.fillStyle = '#721d4a'; context.strokeStyle = '#ffc0ed'; context.lineWidth = 7
    context.beginPath(); context.moveTo(192, 58); context.lineTo(264, 91); context.lineTo(292, 167); context.lineTo(259, 243); context.lineTo(192, 278); context.lineTo(125, 243); context.lineTo(92, 167); context.lineTo(120, 91); context.closePath(); context.fill(); context.stroke()
    context.fillStyle = '#ffcc7e'
    for (let index = 0; index < 7; index += 1) { const x = 107 + index * 28; context.beginPath(); context.moveTo(x, 92); context.lineTo(x + 13, 48 - (index % 2) * 18); context.lineTo(x + 25, 100); context.fill() }
    context.fillStyle = '#ff438a'; context.beginPath(); context.moveTo(126, 150); context.lineTo(173, 164); context.lineTo(151, 180); context.closePath(); context.fill(); context.beginPath(); context.moveTo(258, 150); context.lineTo(211, 164); context.lineTo(233, 180); context.closePath(); context.fill()
    context.strokeStyle = '#fff0f9'; context.lineWidth = 6; context.beginPath(); context.moveTo(138, 216); context.lineTo(246, 216); context.stroke()
    context.restore()
  } else {
    // Corporate zombie sprite: glowing head, suit silhouette, tie, and orbiting paperwork.
    context.save(); context.shadowColor = '#ff668f'; context.shadowBlur = 24
    context.fillStyle = '#314056'; context.strokeStyle = '#ff789c'; context.lineWidth = 5
    context.beginPath(); context.moveTo(107, 318); context.lineTo(116, 230); context.lineTo(149, 207); context.lineTo(235, 207); context.lineTo(268, 230); context.lineTo(277, 318); context.closePath(); context.fill(); context.stroke()
    context.fillStyle = '#a7ffcf'; context.beginPath(); context.ellipse(192, 150, 72, 73, 0, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#ff4b7c'; context.beginPath(); context.ellipse(162, 149, 11, 18, 0, 0, Math.PI * 2); context.ellipse(222, 149, 11, 18, 0, 0, Math.PI * 2); context.fill()
    context.fillStyle = '#edfaff'; context.beginPath(); context.moveTo(176, 212); context.lineTo(208, 212); context.lineTo(199, 286); context.lineTo(185, 286); context.closePath(); context.fill()
    context.fillStyle = '#ff4d87'; context.beginPath(); context.moveTo(192, 226); context.lineTo(204, 244); context.lineTo(192, 279); context.lineTo(180, 244); context.closePath(); context.fill()
    context.restore()
    context.save(); context.translate(76, 219); context.rotate(-.17); context.fillStyle = '#fff2a6'; context.strokeStyle = '#ffbc57'; context.lineWidth = 3; context.fillRect(-22, -27, 45, 56); context.strokeRect(-22, -27, 45, 56); context.restore()
    context.save(); context.translate(307, 208); context.rotate(.18); context.fillStyle = '#c3a4ff'; context.strokeStyle = '#f67fff'; context.lineWidth = 3; context.fillRect(-20, -28, 41, 55); context.strokeRect(-20, -28, 41, 55); context.restore()
  }
  context.fillStyle = '#f4f7ff'; context.font = '800 16px ui-monospace, monospace'; context.textAlign = 'center'; context.shadowColor = accent; context.shadowBlur = 10
  const caption = boss ? 'JEFE FINAL' : target.category === 'tech' ? 'LEGACY.exe' : target.category === 'social' ? 'GUARDIA DE TURNO' : target.category === 'law' ? 'EXPEDIENTE 404' : target.category === 'design' ? 'COPIA / PEGA' : target.category === 'business' ? 'DEUDA.exe' : 'SISTEMA HEREDADO'
  context.fillText(caption, 192, 326)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function Target({ target, targetMeshes, aspect }) {
  const group = useRef(null)
  const core = useRef(null)
  const expired = useRef(false)
  const boss = target.kind === 'boss'
  const zombies = target.kind === 'zombie'
  const enemyTexture = useMemo(() => boss || zombies ? createEnemyTexture(target, boss) : null, [boss, zombies, target.category, target.color, target.label])
  const enemySprite = useMemo(() => {
    if (!enemyTexture) return null
    const sprite = new Sprite(new SpriteMaterial({ map: enemyTexture, transparent: true, depthWrite: false, toneMapped: false }))
    sprite.scale.set(boss ? 2.15 : 1.2, boss ? 2.15 : 1.32, 1)
    sprite.position.z = .13
    return sprite
  }, [boss, enemyTexture])
  useEffect(() => {
    if (group.current) { group.current.userData.targetId = target.id; targetMeshes.current.set(target.id, group.current) }
    return () => targetMeshes.current.delete(target.id)
  }, [target.id, targetMeshes])
  useEffect(() => () => { enemyTexture?.dispose(); enemySprite?.material?.dispose() }, [enemyTexture, enemySprite])
  useFrame((_, delta) => {
    if (!group.current) return
    target.z += delta * target.speed
    const depth = Math.max(.5, CAMERA_Z - target.z)
    const bob = Math.sin(performance.now() / 430 + target.seed) * .025 * depth
    group.current.position.set(target.x * depth * RAIL_FOV * aspect, target.y * depth * RAIL_FOV + bob, target.z)
    target.worldPosition = { x: group.current.position.x, y: group.current.position.y, z: group.current.position.z }
    group.current.rotation.y += delta * (boss ? .24 : zombies ? .5 : .85)
    group.current.rotation.z = Math.sin(performance.now() / 360 + target.seed) * .09
    if (core.current) core.current.rotation.x += delta * .55
    if (target.z > TARGET_LIMIT_Z && !expired.current) {
      expired.current = true
      queueMicrotask(() => target.onExpire?.(target.id))
    }
  })
  const color = target.color || '#ff719e'
  return <group ref={group}>
    {boss ? <>
      <mesh ref={core} castShadow><dodecahedronGeometry args={[.68, 1]} /><meshStandardMaterial color="#52162e" emissive={color} emissiveIntensity={2.3} metalness={.42} roughness={.2} transparent opacity={0} /></mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}><torusGeometry args={[.88, .035, 8, 48]} /><meshBasicMaterial color="#ffcb72" toneMapped={false} /></mesh>
      <mesh rotation={[Math.PI / 2, .25, 0]}><torusGeometry args={[.78, .026, 8, 48]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      {enemySprite && <primitive object={enemySprite} />}
    </> : zombies ? <>
      <mesh ref={core}><sphereGeometry args={[.48, 12, 10]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      {enemySprite && <primitive object={enemySprite} />}
    </> : <>
      <mesh ref={core} castShadow>
        {target.category === 'design' || target.category === 'business' ? <torusKnotGeometry args={[.22, .08, 70, 10]} /> : <icosahedronGeometry args={[.31, 1]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} metalness={.3} roughness={.2} />
      </mesh>
      <mesh><torusGeometry args={[.4, .018, 8, 32]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    </>}
    <SceneLabel position={[0, boss ? -1.05 : -.4, .05]} size={boss ? 10 : 9}>{boss ? `JEFE FINAL · ${target.label} · ${target.hp}/${target.maxHp} HP` : zombies ? `AVERSIÓN · ${target.label}` : target.label}</SceneLabel>
  </group>
}

function Burst({ burst }) {
  const points = useRef(null)
  const effect = useMemo(() => {
    const count = 48
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const velocities = Array.from({ length: count }, (_, index) => {
      const position = new Vector3((Math.random() - .5) * .16, (Math.random() - .5) * .16, (Math.random() - .5) * .16)
      position.toArray(positions, index * 3)
      const tint = new Color(index % 2 ? '#ff55d8' : '#54fff1')
      tint.toArray(colors, index * 3)
      return { position, velocity: new Vector3((Math.random() - .5) * 10, (Math.random() - .5) * 10, (Math.random() - .5) * 10), seed: index * .32 }
    })
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))
    return { geometry, velocities }
  }, [])
  useEffect(() => () => effect.geometry.dispose(), [effect])
  useFrame((_, delta) => {
    if (!points.current) return
    const positions = effect.geometry.attributes.position
    effect.velocities.forEach((particle, index) => {
      particle.position.addScaledVector(particle.velocity, delta)
      particle.velocity.addScaledVector(particle.velocity.clone().normalize(), delta * 1.65)
      particle.position.toArray(positions.array, index * 3)
    })
    positions.needsUpdate = true
    const progress = Math.min(1, (Date.now() - burst.createdAt) / 760)
    points.current.material.opacity = 1 - progress
    points.current.material.size = .16 * (1 - progress * .42)
  })
  return <points ref={points} geometry={effect.geometry} position={[burst.x, burst.y, burst.z]}><pointsMaterial size={.16} vertexColors transparent opacity={1} blending={AdditiveBlending} depthWrite={false} sizeAttenuation toneMapped={false} /></points>
}

function LaserBeam({ shot }) {
  const beam = useRef(null)
  const line = useMemo(() => {
    const from = new Vector3(...shot.from)
    const to = new Vector3(...shot.to)
    const delta = to.clone().sub(from)
    const length = delta.length()
    const direction = delta.normalize()
    const orientation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction)
    return { midpoint: from.add(to).multiplyScalar(.5), length, orientation }
  }, [shot.id])
  useFrame(() => {
    if (!beam.current) return
    const elapsed = (performance.now() - shot.firedAt) / 165
    beam.current.material.opacity = Math.max(0, 1 - elapsed)
    beam.current.visible = elapsed < 1
  })
  return <mesh ref={beam} position={line.midpoint} quaternion={line.orientation}>
    <cylinderGeometry args={[.018, .038, line.length, 7]} /><meshBasicMaterial color="#76fff0" transparent opacity={1} toneMapped={false} />
  </mesh>
}

function WeaponRig({ hero, shot }) {
  const weapon = useRef(null)
  const muzzle = useRef(null)
  const profile = hero.id
  useFrame(() => {
    if (!weapon.current) return
    const elapsed = shot ? (performance.now() - shot.firedAt) / 1000 : 1
    const recoil = shot ? Math.max(0, 1 - elapsed / .16) : 0
    weapon.current.position.z = 8.2 + recoil * .2
    weapon.current.rotation.x = -.05 + recoil * .1
    if (muzzle.current) {
      muzzle.current.position.z = 7.42 + recoil * .2
      muzzle.current.visible = Boolean(shot && elapsed < .075)
      const flare = 1 + Math.random() * .8
      muzzle.current.scale.setScalar(muzzle.current.visible ? flare : 0)
    }
  })
  return <>
    <group ref={weapon} position={[.76, -.5, 8.2]} rotation={[-.05, -.08, -.12]}>
      <mesh castShadow><boxGeometry args={[.43, .22, .62]} /><meshStandardMaterial color="#111927" metalness={.72} roughness={.24} emissive={hero.color} emissiveIntensity={.24} /></mesh>
      <mesh position={[0, .025, -.43]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[.085, .13, .62, 10]} /><meshStandardMaterial color="#26394b" metalness={.76} roughness={.2} emissive={hero.color} emissiveIntensity={.8} />
      </mesh>
      <mesh position={[0, .028, -.77]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.12, .025, 6, 16]} /><meshBasicMaterial color={hero.color} toneMapped={false} /></mesh>
      {profile === 'social' ? <mesh position={[0, .19, -.12]}><sphereGeometry args={[.14, 12, 10]} /><meshStandardMaterial color="#dffcff" emissive={hero.color} emissiveIntensity={1.3} /></mesh>
        : profile === 'design' ? <mesh position={[0, .19, -.12]}><torusKnotGeometry args={[.12, .035, 32, 6]} /><meshBasicMaterial color={hero.color} toneMapped={false} /></mesh>
          : profile === 'law' ? <mesh position={[0, .19, -.12]}><octahedronGeometry args={[.14, 0]} /><meshStandardMaterial color="#ffd66a" emissive="#ffb431" emissiveIntensity={1.2} /></mesh>
            : profile === 'business' ? <mesh position={[0, .19, -.12]}><cylinderGeometry args={[.11, .16, .22, 6]} /><meshStandardMaterial color={hero.color} emissive={hero.color} emissiveIntensity={1} /></mesh>
              : <mesh position={[0, .19, -.12]}><boxGeometry args={[.18, .18, .18]} /><meshStandardMaterial color={hero.color} emissive={hero.color} emissiveIntensity={1.1} /></mesh>}
      <mesh position={[0, -.14, .08]} rotation={[.18, 0, 0]}><boxGeometry args={[.25, .28, .2]} /><meshStandardMaterial color="#101623" metalness={.4} roughness={.4} /></mesh>
      <SceneLabel position={[0, .4, -.12]} color={hero.color} size={9}>{hero.weapon}</SceneLabel>
    </group>
    <mesh ref={muzzle} position={[.76, -.48, 7.42]} scale={0}>
      <sphereGeometry args={[.22, 10, 10]} /><meshBasicMaterial color="#f4ffff" toneMapped={false} />
    </mesh>
    {shot && <LaserBeam key={shot.id} shot={shot} />}
  </>
}

function ArcadeScene({ hero, targets, targetMeshes, aimRef, onTargetHit, onMiss, onFire, pendingShotRef, bursts, shot, shakeUntilRef }) {
  const { camera, size } = useThree()
  const baseCamera = useMemo(() => new Vector3(0, 0, CAMERA_Z), [])
  useEffect(() => {
    const aspect = size.width / Math.max(size.height, 1)
    camera.aspect = aspect
    camera.position.copy(baseCamera)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [baseCamera, camera, size.width, size.height])
  useFrame(() => {
    const remaining = shakeUntilRef.current - performance.now()
    const intensity = remaining > 0 ? Math.min(.095, remaining / 190 * .095) : 0
    camera.position.set(baseCamera.x + (Math.random() - .5) * intensity, baseCamera.y + (Math.random() - .5) * intensity, baseCamera.z)
  })
  const chromaticOffset = useMemo(() => new Vector2(.0011, .0011), [])
  return <>
    <color attach="background" args={['#070914']} />
    <ambientLight intensity={.48} color="#9da6ce" />
    <pointLight position={[-4, 2, 5]} color="#40ffcc" intensity={38} distance={16} />
    <pointLight position={[4, 1, 3]} color="#ff45bb" intensity={28} distance={14} />
    <pointLight position={[0, -2, 1]} color="#e8b55c" intensity={18} distance={12} />
    <WarpTunnel />
    <GameWorld targets={targets} targetMeshes={targetMeshes} aimRef={aimRef} onTargetHit={onTargetHit} onMiss={onMiss} onFire={onFire} pendingShotRef={pendingShotRef} />
    {bursts.map((burst) => <Burst key={burst.id} burst={burst} />)}
    <WeaponRig hero={hero} shot={shot} />
    <EffectComposer multisampling={0}>
      <Bloom intensity={.72} luminanceThreshold={.2} luminanceSmoothing={.22} mipmapBlur />
      <ChromaticAberration offset={chromaticOffset} radialModulation modulationOffset={.15} />
      <Scanline density={1.4} />
      <Noise opacity={.105} />
      <Vignette eskil offset={.23} darkness={.68} />
    </EffectComposer>
    <fog attach="fog" args={['#070914', 26, 58]} />
    <ambientLight color={hero.color} intensity={.08} />
  </>
}

export default function Arcade3DGame({ hero: selectedHero, profile, onGameComplete, onNoniUpdate }) {
  const hero = selectedHero || HERO_CLASSES[2]
  const gameRef = useRef(null)
  const callbackRef = useRef({ onGameComplete, onNoniUpdate })
  const aimRef = useRef(new Vector2(0, 0))
  const pendingShotRef = useRef(false)
  const ammoRef = useRef(12)
  const targetMeshes = useRef(new Map())
  const finishRef = useRef(null)
  const shakeUntilRef = useRef(0)
  const shotTimerRef = useRef(null)
  const [targets, setTargets] = useState([])
  const [bursts, setBursts] = useState([])
  const [shot, setShot] = useState(null)
  const [wave, setWave] = useState(1)
  const [seconds, setSeconds] = useState(45)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [freedom, setFreedom] = useState(0)
  const [ammo, setAmmo] = useState(12)
  const [health, setHealth] = useState(3)
  const [damageFlash, setDamageFlash] = useState(false)
  const [subtitle, setSubtitle] = useState('Elige tus blancos: cada pasión descubierta suma a tu perfil.')
  callbackRef.current = { onGameComplete, onNoniUpdate }

  const fireShot = useCallback((shotData) => {
    const nextShot = { ...shotData, firedAt: performance.now() }
    setShot(nextShot)
    window.clearTimeout(shotTimerRef.current)
    shotTimerRef.current = window.setTimeout(() => setShot((current) => current?.id === nextShot.id ? null : current), 190)
  }, [])

  useEffect(() => () => window.clearTimeout(shotTimerRef.current), [])

  const finishGame = useCallback(() => {
    const game = gameRef.current
    if (!game || game.done) return
    game.done = true
    finishRef.current?.()
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    stopMusic(); playSuccess()
    callbackRef.current.onNoniUpdate?.({ text: '¡Misión completa! Despejaste el camino y encontraste nuevas posibilidades. Aquí está tu mapa vocacional.', id: Date.now() })
    const gemCounts = Object.fromEntries(CATEGORIES.map((category) => [category, Math.max(0, Number(game.counts?.[category]) || 0)]))
    const totalXp = Math.max(0, Number(game.xp) || 0)
    const stats = {
      gemCounts,
      totalXp,
      score: Math.max(0, Number(game.score) || 0),
      freedom: Math.max(0, Number(game.freedom) || 0),
      livesRemaining: Math.max(0, Number(game.lives) || 0),
      categoryHits: gemCounts,
      hero: game.hero?.id || hero?.id || 'tech',
      accuracy: game.shots > 0 ? Math.max(0, Math.min(1, Number(game.hits) / Number(game.shots))) : 0,
    }
    callbackRef.current.onGameComplete?.(stats)
  }, [])

  const removeTarget = useCallback((id) => setTargets((current) => current.filter((target) => target.id !== id)), [])
  const consumeAmmo = useCallback(() => {
    if (ammoRef.current <= 0) { ammoRef.current = 12; setAmmo(12); playReload(); setSubtitle('Cargador listo, piloto. ¡Seguimos!'); return false }
    ammoRef.current -= 1; setAmmo(ammoRef.current); return true
  }, [])
  const missShot = useCallback(() => { const game = gameRef.current; if (!game || game.done || !consumeAmmo()) return; game.shots += 1; playShot() }, [consumeAmmo])

  const hitTarget = useCallback((id) => {
    const game = gameRef.current
    if (!game || game.done) return
    const target = targets.find((entry) => entry.id === id)
    if (!target || !consumeAmmo()) return
    if (target.kind === 'boss' && target.hp > 1) {
      target.hp -= 1
      game.shots += 1; game.hits += 1; game.score += 250
      window.setTimeout(() => { setScore(gameRef.current?.score || 0) }, 125)
      setTargets((current) => current.map((entry) => entry.id === id ? { ...entry } : entry))
      const position = target.worldPosition || { x: 0, y: 0, z: target.z }
      const burstId = `${id}-${target.hp}`
      setBursts((current) => [...current, { id: burstId, x: position.x, y: position.y, z: position.z, color: target.color, createdAt: Date.now() }])
      window.setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== burstId)), 800)
      shakeUntilRef.current = performance.now() + 55
      playShot(); playExplosion()
      setSubtitle(`IMPACTO CONFIRMADO · JEFE ${target.hp}/${target.maxHp} HP`)
      callbackRef.current.onNoniUpdate?.({ text: `¡Buen impacto! El jefe está perdiendo fuerza. Mantén la mira, ${profile?.nickname || 'piloto'}.`, id: Date.now() })
      return
    }
    game.targetsCount = Math.max(0, (game.targetsCount || 1) - 1)
    game.shots += 1; game.hits += 1
    shakeUntilRef.current = performance.now() + (target.kind === 'boss' ? 220 : 55)
    const position = target.worldPosition || { x: 0, y: 0, z: target.z }
    setBursts((current) => [...current, { id, x: position.x, y: position.y, z: position.z, color: target.color, createdAt: Date.now() }])
    window.setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== id)), 800)
    removeTarget(id); playShot(); playExplosion()
    if (target.kind === 'zombie') {
      game.zombieHits += 1; game.freedom += 100; game.score += 100
      window.setTimeout(() => { const updated = gameRef.current; if (updated) { setFreedom(updated.freedom); setScore(updated.score) } }, 125)
      setSubtitle(`+100 LIBERTAD · ${target.label} despejado`)
      if (game.zombieHits % 2 === 0) callbackRef.current.onNoniUpdate?.({ text: '¡Reflejos de primera! Esa rutina ya no decide tu futuro. Sigamos buscando lo que te prende.', id: Date.now() })
    } else {
      game.passionHits += 1; game.counts[target.category] += 1; game.xp += 500; game.score += 500
      window.setTimeout(() => { const updated = gameRef.current; if (updated) { setXp(updated.xp); setScore(updated.score) } }, 125)
      setSubtitle(`+500 XP · ${CATEGORY_LABELS[target.category]} · ${target.label}`)
      if (game.passionHits % 2 === 0) callbackRef.current.onNoniUpdate?.({ text: `¡Combo de pasiones! ${target.label} se suma a tu mapa. Vas formando una misión muy tuya.`, id: Date.now() })
    }
    if (target.kind === 'boss') {
      callbackRef.current.onNoniUpdate?.({ text: `¡Jefe final superado! ${target.label} ya no bloquea tu camino.`, id: Date.now() })
      window.setTimeout(finishGame, 360)
    }
  }, [consumeAmmo, finishGame, profile?.nickname, removeTarget, targets])

  useEffect(() => {
    const game = makeGame(hero)
    gameRef.current = game
    let elapsed = 0
    let waveAnnounced = 1
    let spawnTimer = 0
    let countdown = 0
    let stopped = false
    let bossSpawned = false
    playCoin(); startMusic()
    callbackRef.current.onNoniUpdate?.({ text: `¡Todo listo, ${profile?.nickname || 'piloto'}! Apunta a las señales de neón y descubre qué te mueve.`, id: Date.now() })
    const expireTarget = (current, zombie, id, label) => {
      current.targetsCount = Math.max(0, (current.targetsCount || 1) - 1)
      removeTarget(id)
      if (!zombie) return
      current.lives = Math.max(0, Number(current.lives || 0) - 1)
      setHealth(current.lives)
      shakeUntilRef.current = performance.now() + 210
      setDamageFlash(true); window.setTimeout(() => setDamageFlash(false), 260)
      playExplosion()
      setSubtitle(`IMPACTO · ${label} te alcanzó · ENERGÍA ${current.lives}/3`)
      callbackRef.current.onNoniUpdate?.({ text: current.lives ? `¡Ojo, piloto! ${label} alcanzó tu nave. Toma aire y sigue con cuidado.` : '¡Último impacto! Terminó la partida, pero tu mapa vocacional ya está listo.', id: Date.now() })
      if (current.lives === 0) finishGame()
    }
    const spawn = () => {
      const current = gameRef.current
      if (!current || current.done || current.targetsCount >= 5) return
      const waveIndex = Math.min(2, Math.floor(elapsed / 15))
      if (waveIndex === 2) {
        if (bossSpawned) return
        bossSpawned = true
        const target = {
          id: `boss-${Date.now()}`, kind: 'boss', category: hero.id, label: BOSS_BY_HERO[hero.id] || 'El Guardián del Futuro',
          x: 0, y: .12, z: -36, speed: 3.2, seed: Math.random() * 10, color: '#ff4d85', hp: 4, maxHp: 4,
        }
        target.onExpire = (id) => expireTarget(current, true, id, target.label)
        current.targetsCount = (current.targetsCount || 0) + 1
        setTargets((existing) => [...existing, target])
        setSubtitle(`JEFE FINAL · ${target.label} · 4 IMPACTOS`)
        callbackRef.current.onNoniUpdate?.({ text: `¡Alerta, piloto! Se acerca ${target.label}. Tu aventura culmina con este reto.`, id: Date.now() })
        return
      }
      const zombie = Math.random() < [.32, .27, .24][waveIndex]
      const category = Math.random() < .56 ? hero.id : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      const color = zombie ? '#ff608a' : HERO_CLASSES.find((entry) => entry.id === category)?.color || '#78f9d3'
      const options = PASSIONS[category]
      const target = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, kind: zombie ? 'zombie' : 'passion', category,
        label: zombie ? (AVERSIONS_BY_HERO[hero.id] || AVERSIONS_BY_HERO.tech)[Math.floor(Math.random() * (AVERSIONS_BY_HERO[hero.id] || AVERSIONS_BY_HERO.tech).length)] : options[Math.floor(Math.random() * options.length)],
        x: (Math.random() * 2 - 1) * .72, y: (Math.random() * 2 - 1) * .56, z: -36,
        speed: [3.05, 3.65, 4.35][waveIndex] * (Math.random() * .22 + .9), seed: Math.random() * 10, color,
      }
      target.onExpire = (id) => expireTarget(current, zombie, id, target.label)
      current.targetsCount = (current.targetsCount || 0) + 1
      setTargets((existing) => [...existing, target])
    }
    const tick = () => {
      if (stopped || game.done) return
      elapsed += 1; setSeconds(Math.max(0, 45 - elapsed))
      const nextWave = Math.min(3, Math.floor(elapsed / 15) + 1)
      if (nextWave !== waveAnnounced) {
        waveAnnounced = nextWave; game.wave = nextWave - 1; setWave(nextWave); playNavigate()
        callbackRef.current.onNoniUpdate?.({ text: nextWave === 2 ? '¡Buen ritmo! El mundo cambia de color: explora nuevos talentos y mantén la puntería.' : '¡Última vuelta! Sigue tu curiosidad: cada acierto ayuda a dibujar tu mapa vocacional.', id: Date.now() })
      }
      if (elapsed >= 45) finishGame()
    }
    const keyHandler = (event) => {
      const directions = { ArrowLeft: [-.09, 0], ArrowRight: [.09, 0], ArrowUp: [0, .09], ArrowDown: [0, -.09], a: [-.09, 0], d: [.09, 0], w: [0, .09], s: [0, -.09] }
      const delta = directions[event.key]
      if (delta) { event.preventDefault(); aimRef.current.x = MathUtils.clamp(aimRef.current.x + delta[0], -.95, .95); aimRef.current.y = MathUtils.clamp(aimRef.current.y + delta[1], -.8, .8); playNavigate() }
      if (event.code === 'KeyR') { event.preventDefault(); ammoRef.current = 12; setAmmo(12); playReload(); setSubtitle('Recarga rápida lista. ¡A encontrar nuevas pasiones!') }
      if (event.code === 'Space') { event.preventDefault(); pendingShotRef.current = true }
    }
    const cabinetHandler = (event) => {
      const action = event.detail
      if (action === 'left' || action === 'right' || action === 'up' || action === 'down') {
        const delta = { left: [-.09, 0], right: [.09, 0], up: [0, .09], down: [0, -.09] }[action]
        aimRef.current.x = MathUtils.clamp(aimRef.current.x + delta[0], -.95, .95)
        aimRef.current.y = MathUtils.clamp(aimRef.current.y + delta[1], -.8, .8)
        playNavigate()
      } else if (action === 'fire') pendingShotRef.current = true
      else if (action === 'reload') { ammoRef.current = 12; setAmmo(12); playReload(); setSubtitle('Recarga rápida lista. ¡A encontrar nuevas pasiones!') }
    }
    window.addEventListener('keydown', keyHandler)
    window.addEventListener('edunexa:arcade-control', cabinetHandler)
    const spawnWave = () => spawn()
    spawnTimer = window.setInterval(spawnWave, 880)
    countdown = window.setInterval(tick, 1000)
    finishRef.current = () => {
      if (stopped) return
      stopped = true; window.clearInterval(spawnTimer); window.clearInterval(countdown); window.removeEventListener('keydown', keyHandler); window.removeEventListener('edunexa:arcade-control', cabinetHandler)
    }
    return () => {
      if (!stopped) { stopped = true; window.clearInterval(spawnTimer); window.clearInterval(countdown); window.removeEventListener('keydown', keyHandler); window.removeEventListener('edunexa:arcade-control', cabinetHandler) }
      stopMusic()
    }
  }, [finishGame, hero, profile?.nickname, removeTarget])

  return <section className="arcade-game shooter-game" id="evaluacion" aria-label="EDUNEXA Vocational Quest en 3D">
    <div className="arcade-game-heading"><div><p className="eyebrow"><span className="pulse-dot" /> MISIÓN ACTIVA · OLA {wave} / 3</p><h2>VOCATIONAL QUEST <span>3D</span></h2></div><div className="shooter-class-chip" style={{ '--hero-color': hero.color }}><span>{hero.icon}</span><div><strong>{hero.name}</strong><small>{hero.weapon}</small></div></div></div>
    <div className="arcade-stage shooter-stage webgl-stage">
      <Canvas className="arcade-canvas shooter-canvas" dpr={[1, 1.5]} camera={{ position: [0, 0, CAMERA_Z], near: .1, far: 70, fov: 60 }} gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }} onPointerMissed={missShot}>
        <ArcadeScene hero={hero} targets={targets} targetMeshes={targetMeshes} aimRef={aimRef} onTargetHit={hitTarget} onMiss={missShot} onFire={fireShot} pendingShotRef={pendingShotRef} bursts={bursts} shot={shot} shakeUntilRef={shakeUntilRef} />
      </Canvas>
      <div className="webgl-crt-glass" aria-hidden="true" />
      <div className="webgl-hud"><span>OLA {wave} / 3</span><span>{String(score).padStart(6, '0')} PTS</span><span>XP {xp}</span><span>ENERGÍA {'♥'.repeat(health)}{'♡'.repeat(3 - health)}</span><span>AMMO {ammo}</span><span>100 KM/H</span><span>{seconds}s</span></div>
      <div className="webgl-subtitles"><b>NONI · RADIO</b><span>{subtitle}</span></div>
      <div className={`webgl-damage-flash ${damageFlash ? 'is-active' : ''}`} aria-hidden="true" />
      <div className="webgl-film-grain" aria-hidden="true" />
    </div>
    <div className="arcade-control-hint">Mueve la mira con el cursor <span>·</span> clic/tap para disparar <span>·</span> flechas / WASD mueven la mira <span>·</span> <kbd>ESPACIO</kbd> dispara <span>·</span> <kbd>R</kbd> recarga</div>
    <div className="shooter-legend"><span><i className="legend-zombie" /> Zombies de rutina <small>+100 libertad</small></span><span><i className="legend-passion" /> Pasiones <small>+500 XP</small></span><span className="shooter-badge"><Trophy size={13} /> {hero.area}</span><span className="shooter-badge">{freedom} LIBERTAD</span></div>
  </section>
}
