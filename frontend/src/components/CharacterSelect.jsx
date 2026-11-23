import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, Cpu, Factory, Leaf, Sparkles, Swords, Volume2, VolumeX, Zap } from 'lucide-react'
import { playArcadeCallout, playClick, playHover, playLockIn } from '../lib/audio'
import { getArcadeMuted, playArcadeSfx, startArcadeMusic, stopArcadeMusic, toggleArcadeMuted, subscribeArcadeMute } from '../lib/arcadeAudio'
import { HERO_ARCADE_DETAILS, HERO_SPRITES } from '../data/careers'
import { prepareArcadeSprite } from '../lib/spriteProcessor'
import { speakAsHero } from '../lib/voiceEngine'

export const HERO_CLASSES = [
  { id: 'tech', icon: '⌘', sprite: HERO_SPRITES.tech, name: 'La Guardiana del Código', area: 'Tecnología', weapon: 'Bastón de código obsidiana', tools: 'Sistemas · Mecatrónica · TIC · IA · Datos', color: '#55e8ff', cadence: 'Ráfaga · pulsos de datos', projectile: 'Dardos de luz turquesa', impact: 'Conecta código, máquinas y datos para resolver retos que todavía no tienen respuesta.', line: 'Tu curiosidad puede abrir caminos que aún no existen.', ...HERO_ARCADE_DETAILS.tech },
  { id: 'industry', icon: '⚙', sprite: HERO_SPRITES.industry, name: 'El Forjador de Engranes', area: 'Industria', weapon: 'Martillo modular de cobre', tools: 'Industrial · Química · Mecánica · Automotriz', color: '#ff9f1c', cadence: 'Potente · impacto mecánico', projectile: 'Remaches de energía ámbar', impact: 'Transforma materiales, máquinas y procesos para que las ideas funcionen en el mundo real.', line: 'Cada gran invento empieza con alguien que se atreve a probar.', ...HERO_ARCADE_DETAILS.industry },
  { id: 'construction', icon: '▦', sprite: HERO_SPRITES.construction, name: 'La Arquitecta de Piedra', area: 'Construcción', weapon: 'Escudo topográfico', tools: 'Civil · Arquitectura · Diseño Industrial', color: '#e7bd73', cadence: 'Defensa · estructuras rápidas', projectile: 'Plataformas de piedra luminosa', impact: 'Diseña espacios, objetos e infraestructura donde las personas puedan crecer.', line: 'Lo que imaginas puede convertirse en un lugar para todos.', ...HERO_ARCADE_DETAILS.construction },
  { id: 'energy', icon: 'ϟ', sprite: HERO_SPRITES.energy, name: 'El Portador del Relámpago', area: 'Energía y electrónica', weapon: 'Lanza conductora de jade', tools: 'Electrónica · Eléctrica · Renovables · Ambiental', color: '#ffe16a', cadence: 'Cadena · descargas precisas', projectile: 'Arcos eléctricos dorados', impact: 'Conecta circuitos y energía para impulsar soluciones más limpias y resilientes.', line: 'Una idea brillante también puede iluminar el futuro.', ...HERO_ARCADE_DETAILS.energy },
  { id: 'business', icon: '✦', sprite: HERO_SPRITES.business, name: 'La Estratega del Quetzal', area: 'Negocios', weapon: 'Abanico de señales', tools: 'Gestión · Administración · Logística · Turismo', color: '#6df2a3', cadence: 'Táctica · coordina recursos', projectile: 'Ondas verdes de estrategia', impact: 'Encuentra oportunidades, organiza equipos y convierte ideas en proyectos que sí avanzan.', line: 'Tu forma de conectar ideas puede mover a todo un equipo.', ...HERO_ARCADE_DETAILS.business },
  { id: 'life', icon: '❋', sprite: HERO_SPRITES.life, name: 'El Guardián de la Semilla', area: 'Ciencias de la vida', weapon: 'Báculo de raíces y jade', tools: 'Bioquímica · Biomédica · Biología', color: '#ff708d', cadence: 'Apoyo · raíces protectoras', projectile: 'Semillas de luz y vida', impact: 'Investiga los sistemas vivos y crea nuevas formas de cuidar la salud y nuestro entorno.', line: 'La vida está llena de misterios esperando a alguien como tú.', ...HERO_ARCADE_DETAILS.life },
]

const HeroIcon = ({ id, size = 19 }) => {
  const icons = { tech: Cpu, industry: Factory, construction: Building2, energy: Zap, business: BriefcaseBusiness, life: Leaf }
  const Icon = icons[id] || Sparkles
  return <Icon size={size} />
}

function ArcadeSpriteCanvas({ src, className, label }) {
  const ref = useRef(null)
  useEffect(() => {
    let active = true
    prepareArcadeSprite(src).then((sprite) => {
      const canvas = ref.current
      if (!active || !canvas) return
      canvas.width = sprite.width; canvas.height = sprite.height
      const context = canvas.getContext('2d')
      context.imageSmoothingEnabled = false
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(sprite.canvas, 0, 0)
    }).catch(() => {})
    return () => { active = false }
  }, [src])
  return <canvas ref={ref} className={className} role="img" aria-label={label} />
}

export default function CharacterSelect({ open, onClose, onSelect, suggestedHeroId }) {
  const [stage, setStage] = useState('select')
  const [selected, setSelected] = useState(HERO_CLASSES[0])
  const [muted, setMuted] = useState(getArcadeMuted)
  const activeHero = selected

  useEffect(() => {
    const unsubscribe = subscribeArcadeMute(setMuted)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (open) {
      setStage('select')
      startArcadeMusic('select')
      if (suggestedHeroId) {
        const suggested = HERO_CLASSES.find((h) => h.id === suggestedHeroId)
        setSelected(suggested || HERO_CLASSES[0])
      } else {
        setSelected(HERO_CLASSES[0])
      }
    }
  }, [open, suggestedHeroId])

  useEffect(() => {
    if (stage !== 'transform') return undefined
    const timer = window.setTimeout(() => onSelect(selected), 1500)
    return () => window.clearTimeout(timer)
  }, [stage, selected, onSelect])

  if (!open) return null
  function equip() { playLockIn(); playArcadeSfx('confirm'); speakAsHero(selected.id, selected.line); startArcadeMusic('battle'); setStage('transform') }
  function leaveSelect() { stopArcadeMusic(); onClose?.() }

  return <AnimatePresence><motion.div className="character-modal" role="dialog" aria-modal="true" aria-labelledby="character-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="character-crt" />
    {stage === 'select' && <motion.div className="character-select-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="character-select-heading"><div><p className="eyebrow">BALAM TE HA ENCONTRADO · CLASIFICACIÓN</p><h2 id="character-title">Elige tu <span>héroe</span></h2><p>Seis familias del TecNM. Elige la que te dé más curiosidad; siempre puedes explorar las demás.</p></div><div className="character-heading-actions"><button className="audio-toggle" type="button" aria-label={muted ? 'Activar música' : 'Silenciar música'} onClick={() => setMuted(toggleArcadeMuted())}>{muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}<span>{muted ? 'SONIDO OFF' : 'MÚSICA ON'}</span></button><button className="character-back" type="button" onClick={leaveSelect}><ArrowLeft size={15} /> Inicio</button></div></div>
      <div className="character-select-layout">
        <div className="hero-class-grid">{HERO_CLASSES.map((hero, index) => <motion.button type="button" key={hero.id} className={`hero-class-card ${selected.id === hero.id ? 'is-equipped' : ''}`} style={{ '--hero-color': hero.color }} onMouseEnter={() => playHover()} onFocus={() => {}} onClick={() => { setSelected(hero); playClick(); playArcadeSfx('change'); playArcadeCallout('HÉROE SELECCIONADO') }} initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .055 }} aria-pressed={selected.id === hero.id}>{suggestedHeroId === hero.id && <span className="suggested-badge">Sugerencia de Nino Hernández</span>}<ArcadeSpriteCanvas src={hero.sprite} className="hero-pixel-portrait" label={`Héroe de ${hero.area}`}/><span className="hero-class-area">{hero.area}</span><strong>{hero.name}</strong><span className="hero-class-weapon"><HeroIcon id={hero.id} size={14} /> {hero.weapon}</span><small>{hero.subtitle}</small></motion.button>)}</div>
        <AnimatePresence mode="wait"><motion.aside key={activeHero.id} className="weapon-spec-panel" style={{ '--hero-color': activeHero.color }} initial={{ opacity: 0, x: 16, rotateY: -8 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div className="hero-preview-stage"><i/><i/><ArcadeSpriteCanvas src={activeHero.sprite} className="hero-preview-sprite" label={`Vista previa del héroe de ${activeHero.area}`}/></div><p className="eyebrow">FAMILIA · {activeHero.area}</p><h3>{activeHero.weapon}</h3><p>{activeHero.story}</p>
          <div className="hero-attributes" aria-label="Atributos de combate">{[['Potencia de fuego', activeHero.attributes.power], ['Cadencia', activeHero.attributes.cadence], ['Movilidad', activeHero.attributes.mobility]].map(([label, value]) => <div className="hero-attribute" key={label}><span>{label}</span><div role="progressbar" aria-label={label} aria-valuemin="1" aria-valuemax="5" aria-valuenow={value}>{[1, 2, 3, 4, 5].map((point) => <i className={point <= value ? 'is-filled' : ''} key={point}/>)}</div><b>{value}/5</b></div>)}</div>
          <dl><div><dt>Efecto especial</dt><dd>{activeHero.special}</dd></div><div><dt>Carreras afines TecNM</dt><dd className="hero-career-tags">{activeHero.careers.map((career) => <span key={career}>{career}</span>)}</dd></div></dl><small>Vista previa: {activeHero.name}</small>
        </motion.aside></AnimatePresence>
      </div>
      <div className="equip-footer"><p><Sparkles size={15} /> NONI: “{selected.line}”</p><button type="button" className="equip-hero-button" onClick={equip}><Swords size={16} /> CONVERTIRME EN {selected.name.toLocaleUpperCase('es-MX')} <ArrowRight size={16} /></button></div>
    </motion.div>}
    {stage === 'transform' && <motion.div className="character-transform" role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><span className="transform-rune">✦</span><ArcadeSpriteCanvas src={selected.sprite} className="transform-hero-sprite" label={`${selected.name}, héroe elegido`}/><p className="eyebrow">BALAM · GUARDIÁN DEL PORTAL</p><h2>Tu camino toma forma</h2><p>NONI: «{selected.line}»</p><strong>{selected.name}</strong></motion.div>}
  </motion.div></AnimatePresence>
}
