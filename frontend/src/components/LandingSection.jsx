import { lazy, Suspense, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Compass, Crosshair, MapPinned, Shield, Sparkles, Swords, Target } from 'lucide-react'
import { playClick } from '../lib/audio'
import MorosShowcaseCanvas from './MorosShowcaseCanvas'

const IntroCinematica = lazy(() => import('./IntroCinematica'))

const STEPS = [
  { icon: Shield, number: '01', title: 'Elige tu héroe', text: 'Explora seis familias de carreras del TecNM y comienza por la que despierte tu curiosidad.', color: '#9d8cff' },
  { icon: Crosshair, number: '02', title: 'Juega la misión', text: 'Corre, salta y toma decisiones en una aventura arcade que descubre lo que te interesa.', color: '#56efff' },
  { icon: MapPinned, number: '03', title: 'Descubre tus rutas', text: 'Conoce carreras afines, opciones educativas cercanas y los siguientes pasos para explorar.', color: '#ff74cf' },
]

export default function LandingSection({ onStart }) {
  const [introOpen, setIntroOpen] = useState(false)
  const startIntro = useCallback(() => { playClick(); setIntroOpen(true) }, [])
  const finishIntro = useCallback(() => { setIntroOpen(false); onStart?.() }, [onStart])

  if (introOpen) return <Suspense fallback={<div className="arcade-intro intro-loading" role="status">Preparando la cinemática…</div>}><IntroCinematica onComplete={finishIntro} /></Suspense>

  return <>
    <section className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-copy">
        <p className="eyebrow"><span className="pulse-dot" /> EDUNEXA PRESENTA · ARCADE DE ORIENTACIÓN</p>
        <h1 id="landing-title">El futuro no se <span>adivina.</span><br />Se juega.</h1>
        <p className="landing-lead">Tu brújula vocacional ahora es una aventura arcade. Elige una clase, encuentra lo que te mueve y explora carreras que podrían conectar contigo.</p>
        <div className="landing-tags"><span><Sparkles size={13} /> Sin respuestas buenas o malas</span><span><Compass size={13} /> Tú eliges la ruta</span></div>
        <button className="insert-coin-button" type="button" onClick={startIntro}><span aria-hidden="true">🕹️</span> COMENZAR MI AVENTURA</button>
        <button type="button" className="landing-scroll" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>Conoce cómo funciona <ArrowDown size={14} /></button>
      </div>
      <motion.div className="landing-moros-wrap" initial={{ opacity: 0, scale: .96, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .8 }}><MorosShowcaseCanvas onStart={startIntro} /></motion.div>
    </section>
    <section className="how-section" id="como-funciona" aria-labelledby="how-title">
      <div className="how-heading"><p className="eyebrow">TU PRÓXIMO NIVEL, PASO A PASO</p><h2 id="how-title">¿Cómo funciona <span>EDUNEXA?</span></h2><p>Una experiencia corta para abrir posibilidades, con información para seguir investigando.</p></div>
      <div className="how-cards">{STEPS.map(({ icon: Icon, number, title, text, color }, index) => <motion.article className="how-card" key={number} style={{ '--step-color': color }} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ delay: index * .09, duration: .45 }}><div className="how-card-top"><span>{number}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></motion.article>)}</div>
      <div className="how-areas"><strong>SEIS FAMILIAS · MUCHAS RUTAS</strong><span>⚙ Industria</span><span>⚡ Energía</span><span>⌘ Tecnología</span><span>▦ Construcción</span><span>✦ Negocios</span><span>❋ Ciencias de la vida</span></div>
      <button className="how-bottom-cta" type="button" onClick={startIntro}><Swords size={17} /> Comenzar mi aventura</button>
    </section>
  </>
}
