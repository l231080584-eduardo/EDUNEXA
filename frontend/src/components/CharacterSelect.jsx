import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BrainCircuit, BriefcaseBusiness, Gavel, HeartPulse, Palette, ShieldCheck, Sparkles, Swords } from 'lucide-react'
import { playArcadeCallout, playClick, playCoin, playHover, playLockIn, playRadioBeep, selectSpanishVoice, startMusic } from '../lib/audio'

export const HERO_CLASSES = [
  { id: 'law', icon: '⚖️', name: 'El Defensor Táctico', area: 'Derecho & Ciencias Sociales', weapon: 'Gavel Justice Cannon', tools: 'Leyes · Códigos · Constitución', color: '#ffd66e', cadence: 'Táctica · 2 impactos/s', projectile: 'Sentencia dorada de precisión', impact: 'Argumenta, protege derechos y diseña acuerdos que sí mueven el mundo.', line: 'Tu estrategia también puede abrir caminos más justos.' },
  { id: 'social', icon: '🥼', name: 'El Bio-Doctor', area: 'Medicina & Salud', weapon: 'Bio-Inject Syringe Launcher', tools: 'CRISPR · Diagnóstico · Nanotecnología', color: '#59edff', cadence: 'Precisa · 3 impulsos/s', projectile: 'Plasma biológico cyan', impact: 'Usa ciencia y empatía para cuidar personas y mejorar su calidad de vida.', line: 'Curiosidad científica y cuidado: una mezcla con poder para cambiar vidas.' },
  { id: 'tech', icon: '🥷', name: 'El Hacker Maestro', area: 'Tecnología e Ingenierías', weapon: 'Terminal Code Blaster', tools: 'Python · Linux · Ciberseguridad', color: '#68f5a5', cadence: 'Ráfaga · 5 pulsos/s', projectile: 'Código verde de alto impacto', impact: 'Convierte lógica y código en herramientas para resolver retos reales.', line: 'Tu lógica puede convertirse en tecnología que sí cambia las cosas.' },
  { id: 'design', icon: '🎨', name: 'El Creador Neón', area: 'Artes, Diseño & Arquitectura', weapon: 'Stylus Vector Railgun', tools: 'Blender · Motores 3D · CAD', color: '#f476e9', cadence: 'Creativa · 3 trazos/s', projectile: 'Haces magenta vectoriales', impact: 'Imagina experiencias que todavía no existen y dales forma con intención.', line: 'Imagina experiencias que todavía no existen y dales forma.' },
  { id: 'business', icon: '🚀', name: 'El Estratega de Imperios', area: 'Negocios & Finanzas', weapon: 'Quantum Analytics Launcher', tools: 'Big Data · Finanzas · Estrategia', color: '#94a5ff', cadence: 'Estratégica · 2 pulsos/s', projectile: 'Ondas azules de métricas', impact: 'Encuentra patrones, conecta equipos y convierte ideas en proyectos viables.', line: 'Encuentra patrones, conecta equipos y convierte ideas en proyectos.' },
  { id: 'humanities', icon: '🔬', name: 'El Humanista y Educador', area: 'Psicología & Humanidades', weapon: 'Neural Mind Prism', tools: 'Empatía · Lógica · Análisis social', color: '#aa85ff', cadence: 'Resonancia · 4 ondas/s', projectile: 'Prisma neuronal violeta', impact: 'Comprende historias, acompaña personas e impulsa nuevas formas de aprender.', line: 'Comprende historias, acompaña personas e impulsa nuevas formas de aprender.' },
]

const HeroIcon = ({ id, size = 19 }) => {
  const icons = { law: Gavel, social: HeartPulse, tech: BrainCircuit, design: Palette, business: BriefcaseBusiness, humanities: ShieldCheck }
  const Icon = icons[id] || Sparkles
  return <Icon size={size} />
}

export default function CharacterSelect({ open, onClose, onSelect }) {
  const [stage, setStage] = useState('insert')
  const [selected, setSelected] = useState(HERO_CLASSES[2])
  const [hoveredId, setHoveredId] = useState(null)
  const activeHero = HERO_CLASSES.find((hero) => hero.id === hoveredId) || selected

  useEffect(() => {
    if (open) { setStage('insert'); setSelected(HERO_CLASSES[2]) }
  }, [open])

  useEffect(() => {
    if (stage !== 'intro') return undefined
    const line = 'Año 2026. Las rutinas monótonas y los trabajos zombie amenazan tu futuro. Noni está contigo. ¡Elige tu clase y lock and load!'
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(line)
      const voice = selectSpanishVoice(window.speechSynthesis)
      if (voice) utterance.voice = voice
      utterance.lang = voice?.lang || 'es-MX'; utterance.pitch = 1.02; utterance.rate = 0.95; utterance.volume = 1
      playRadioBeep()
      utterance.onend = () => setStage('select')
      window.speechSynthesis.speak(utterance)
    }
    const timer = window.setTimeout(() => setStage('select'), 9000)
    return () => { window.clearTimeout(timer); window.speechSynthesis?.cancel() }
  }, [stage])

  if (!open) return null
  function begin() { playCoin(); startMusic(); setStage('intro') }
  function equip() { playLockIn(); startMusic(); onSelect(selected) }

  return <AnimatePresence><motion.div className="character-modal" role="dialog" aria-modal="true" aria-labelledby="character-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="character-crt" />
    {stage === 'insert' && <motion.div className="character-insert" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}><p className="eyebrow">EDUNEXA ARCADE · 2026</p><div className="character-insert-logo">INSERT <span>COIN</span></div><p>¿Lista tu próxima misión?</p><button type="button" className="insert-coin-button" onClick={begin}>🕹️ INSERT COIN <ArrowRight size={17} /></button><button type="button" className="character-back" onClick={onClose}><ArrowLeft size={14} /> Volver al inicio</button></motion.div>}
    {stage === 'intro' && <motion.div className="character-cinematic" initial={{ opacity: 0, scale: 1.07 }} animate={{ opacity: 1, scale: 1 }}><div className="cinematic-sun" /><p className="eyebrow">TRANSMISIÓN ENTRANTE · NONI IA</p><h2>AÑO <span>2026</span></h2><p>Las rutinas monótonas y los trabajos zombie amenazan tu futuro.</p><strong>LOCK AND LOAD<span className="blink-cursor">_</span></strong><div className="cinematic-captions" aria-live="polite">NONI: Tus talentos son tu mejor equipamiento. Vamos a elegirlo.</div></motion.div>}
    {stage === 'select' && <motion.div className="character-select-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="character-select-heading"><div><p className="eyebrow">MISIÓN 01 · CLASIFICACIÓN</p><h2 id="character-title">Choose your <span>fighter</span></h2><p>Elige tu equipo: cada clase abre una forma distinta de resolver la misión.</p></div><button className="character-back" type="button" onClick={onClose}><ArrowLeft size={15} /> Inicio</button></div>
      <div className="character-select-layout">
        <div className="hero-class-grid">{HERO_CLASSES.map((hero, index) => <motion.button type="button" key={hero.id} className={`hero-class-card ${selected.id === hero.id ? 'is-equipped' : ''}`} style={{ '--hero-color': hero.color }} onMouseEnter={() => { if (hoveredId !== hero.id) playHover(); setHoveredId(hero.id) }} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(hero.id)} onBlur={() => setHoveredId(null)} onClick={() => { setSelected(hero); setHoveredId(hero.id); playClick(); playArcadeCallout('SOLDIER SELECT!') }} initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .055 }} aria-pressed={selected.id === hero.id}><span className="hero-class-icon">{hero.icon}</span><span className="hero-class-area">{hero.area}</span><strong>{hero.name}</strong><span className="hero-class-weapon"><HeroIcon id={hero.id} size={14} /> {hero.weapon}</span><small>{hero.tools}</small></motion.button>)}</div>
        <AnimatePresence mode="wait"><motion.aside key={activeHero.id} className="weapon-spec-panel" style={{ '--hero-color': activeHero.color }} initial={{ opacity: 0, x: 16, rotateY: -8 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div className="weapon-hologram"><span>{activeHero.icon}</span><i /><i /><i /></div><p className="eyebrow">EQUIPO DE CLASE</p><h3>{activeHero.weapon}</h3><p>{activeHero.impact}</p>
          <dl><div><dt>Cadencia</dt><dd>{activeHero.cadence}</dd></div><div><dt>Proyectil</dt><dd>{activeHero.projectile}</dd></div><div><dt>Herramientas</dt><dd>{activeHero.tools}</dd></div></dl><small>Vista previa: {activeHero.name}</small>
        </motion.aside></AnimatePresence>
      </div>
      <div className="equip-footer"><p><Sparkles size={15} /> NONI: “{selected.line}”</p><button type="button" className="equip-hero-button" onClick={equip}><Swords size={16} /> BLOQUEAR PERSONAJE <ArrowRight size={16} /></button></div>
    </motion.div>}
  </motion.div></AnimatePresence>
}
