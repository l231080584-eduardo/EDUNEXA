import { motion } from 'framer-motion'
import { ArrowDown, Compass, Crosshair, MapPinned, Shield, Sparkles, Swords, Target } from 'lucide-react'
import { playClick, playCoin } from '../lib/audio'

const STEPS = [
  { icon: Shield, number: '01', title: 'Elige tu clase y equipamiento', text: 'Derecho, Salud, Tech, Artes, Negocios o Humanidades: entra al juego desde tu propia curiosidad.', color: '#9d8cff' },
  { icon: Crosshair, number: '02', title: 'Combate Arcade 3D', text: 'Despeja las rutinas zombie y dispara a las pasiones que quieres explorar. Cada acierto deja una pista.', color: '#56efff' },
  { icon: MapPinned, number: '03', title: 'Ruta GPS y diagnóstico laboral', text: 'Conoce carreras, campo laboral y sedes compatibles del catálogo nacional para planear el siguiente nivel.', color: '#ff74cf' },
]

export default function LandingSection({ onStart }) {
  function insertCoin() { playClick(); playCoin(); onStart() }
  return <>
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-copy"><p className="eyebrow"><span className="pulse-dot" /> EDUNEXA PRESENTA · ARCADE DE ORIENTACIÓN</p><h1 id="landing-title">El futuro no se <span>adivina.</span><br />Se juega.</h1><p className="landing-lead">Tu brújula vocacional ahora es una aventura arcade. Elige una clase, encuentra lo que te mueve y explora carreras que podrían conectar contigo.</p><div className="landing-tags"><span><Sparkles size={13} /> Sin respuestas buenas o malas</span><span><Compass size={13} /> Tú eliges la ruta</span></div><button className="insert-coin-button" type="button" onClick={insertCoin}><span>🕹️</span> INSERT COIN / ELEGIR HÉROE Y EMPEZAR</button><button type="button" className="landing-scroll" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>Conoce cómo funciona <ArrowDown size={14} /></button></div>
      <motion.div className="landing-arcade-visual" initial={{ opacity: 0, scale: .94, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8 }} aria-hidden="true"><div className="landing-sun" /><div className="landing-grid" /><div className="landing-crosshair"><Target size={46} /></div><div className="landing-visual-label"><span>QUEST_2026</span><strong>FUTURE: UNLOCKED</strong></div><div className="landing-pixel landing-pixel-one">XP +500</div><div className="landing-pixel landing-pixel-two">CLASS SELECT</div><div className="landing-scanlines" /></motion.div>
    </section>
    <section className="how-section" id="como-funciona" aria-labelledby="how-title"><div className="how-heading"><p className="eyebrow">TU PRÓXIMO NIVEL, PASO A PASO</p><h2 id="how-title">¿Cómo funciona <span>EDUNEXA?</span></h2><p>Una experiencia corta para abrir posibilidades, con información para seguir investigando.</p></div><div className="how-cards">{STEPS.map(({ icon: Icon, number, title, text, color }, index) => <motion.article className="how-card" key={number} style={{ '--step-color': color }} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ delay: index * .09, duration: .45 }}><div className="how-card-top"><span>{number}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></motion.article>)}</div><div className="how-areas"><strong>SEIS CLASES · MUCHAS RUTAS</strong><span>⚖️ Derecho</span><span>🥼 Salud</span><span>🥷 Tecnología</span><span>🎨 Artes</span><span>🚀 Negocios</span><span>🔬 Humanidades</span></div><button className="how-bottom-cta" type="button" onClick={insertCoin}><Swords size={17} /> Elegir héroe y empezar la misión</button></section>
  </>
}
