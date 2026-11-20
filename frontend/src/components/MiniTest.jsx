import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { questions, scaleLabels } from '../data/questions'
import { GEM_CATEGORIES } from '../data/careers'
import { HERO_CLASSES } from './CharacterSelect'
import { playClick, playCoin, playHover } from '../lib/audio'

const CATEGORIES = ['tech', 'industry', 'construction', 'energy', 'business', 'life']

const NONI_MESSAGES = [
  '¡Vamos a conocernos un poco! Responde con confianza, no hay respuestas malas.',
  'Interesante... Noni está tomando nota de lo que te apasiona.',
  'Cada respuesta ayuda a Noni a entender mejor tu perfil.',
  '¡Casi listo! Un par de preguntas más y armaremos tu perfil.',
  '¡Última pregunta! Noni ya tiene casi todo para sugerirte tu héroe ideal.',
]

function calculateScores(answers) {
  const get = (id) => (answers[id] || 3) - 1
  const intereses = (get('intereses-1') + get('intereses-2')) / 2 / 4
  const materias = get('materias') / 4
  const estiloVida = get('estilo-vida') / 4

  return {
    tech: intereses * 0.55 + materias * 0.45,
    industry: materias * 0.5 + intereses * 0.3 + estiloVida * 0.2,
    construction: estiloVida * 0.45 + materias * 0.35 + intereses * 0.2,
    energy: materias * 0.5 + intereses * 0.35 + estiloVida * 0.15,
    business: estiloVida * 0.45 + intereses * 0.3 + materias * 0.25,
    life: intereses * 0.45 + materias * 0.3 + estiloVida * 0.25,
  }
}

function getTopTwo(scores) {
  return CATEGORIES.slice()
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 2)
}

function getSuggestedHero(scores) {
  const topTwo = getTopTwo(scores)
  const top = topTwo[0]
  return top || 'tech'
}

export default function MiniTest({ open, onComplete }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)

  if (!open) return null

  const question = questions[current]
  const total = questions.length

  function handleSelect(value) {
    playClick()
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  function handleNext() {
    if (current < total - 1) {
      playCoin()
      setCurrent((prev) => prev + 1)
    } else {
      const completedAnswers = { ...answers, [question.id]: answers[question.id] || 3 }
      const scores = calculateScores(completedAnswers)
      const suggestedHero = getSuggestedHero(scores)
      const topTwo = getTopTwo(scores)
      setResults({ scores, suggestedHero, topTwo, answers: completedAnswers })
      playCoin()
    }
  }

  function handleBack() {
    if (current > 0) {
      playClick()
      setCurrent((prev) => prev - 1)
    }
  }

  function handleStartGame(heroId) {
    playCoin()
    onComplete(results, heroId)
  }

  if (results) {
    return <AnimatePresence><motion.div className="minitest-results" role="dialog" aria-modal="true" aria-labelledby="minitest-result-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="minitest-crt" />
      <div className="minitest-card">
        <div className="minitest-header">
          <Sparkles size={20} />
          <h2 id="minitest-result-title">¡Tu perfil está listo, piloto!</h2>
          <p>Noni analizó tus respuestas y tiene una sugerencia especial para ti.</p>
        </div>

        <div className="minitest-top-categories">
          <h3>Tus áreas destacadas</h3>
          {results.topTwo.map((cat, index) => (
            <div key={cat} className="category-bar">
              <span className="category-label">{index + 1}. {GEM_CATEGORIES[cat]?.label || cat}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round(results.scores[cat] * 100)}%`, backgroundColor: index === 0 ? '#68f5a5' : '#ffd66e' }} />
              </div>
              <span className="category-score">{Math.round(results.scores[cat] * 100)}%</span>
            </div>
          ))}
        </div>

        <div className="minitest-hero-suggestion">
          <p className="eyebrow">SUGERENCIA DE NONI</p>
          <h3>¿Listo para elegir tu camino?</h3>
          <p>NONI cree que podrías disfrutar <strong>{GEM_CATEGORIES[results.suggestedHero]?.label}</strong>. Elige el héroe que más te represente: tu elección también cuenta para el resultado.</p>
        </div>

        <div className="minitest-actions">
          <button type="button" className="minitest-play-button" onClick={() => handleStartGame(results.suggestedHero)}>
            <Check size={18} /> Ver sugerencia y elegir <ArrowRight size={16} />
          </button>
          <button type="button" className="minitest-change-button" onClick={() => handleStartGame(null)}>
            Explorar los seis héroes
          </button>
        </div>

        <p className="minitest-note">
          <Sparkles size={14} /> NONI: «Estas son solo sugerencias. Tu aventura depende de ti, ¡y no hay camino equivocado!»
        </p>
      </div>
    </motion.div></AnimatePresence>
  }

  const selectedValue = answers[question.id]
  const canNext = selectedValue !== undefined

  return <AnimatePresence><motion.div className="minitest-overlay" role="dialog" aria-modal="true" aria-labelledby="minitest-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="minitest-crt" />
    <div className="minitest-card">
      <div className="minitest-progress">
        <span className="eyebrow">Pregunta {current + 1} de {total}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="minitest-question">
        <span className="eyebrow">{question.eyebrow}</span>
        <h2 id="minitest-title">{question.title}</h2>
        <p>{question.description}</p>
      </div>

      <div className="minitest-scale" role="radiogroup" aria-label={question.title}>
        {scaleLabels.map((label, index) => {
          const value = index + 1
          const isSelected = selectedValue === value
          return <motion.button key={value} type="button" role="radio" aria-checked={isSelected} className={`scale-option ${isSelected ? 'is-selected' : ''}`} style={{ animationDelay: `${index * 0.06}s` }} onMouseEnter={() => playHover()} onClick={() => handleSelect(value)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <span className="scale-value">{value}</span>
            <span className="scale-label">{label}</span>
          </motion.button>
        })}
      </div>

      <div className="minitest-non-message">
        <Sparkles size={14} />
        <span>{NONI_MESSAGES[current] || '¡Sigue así!'}</span>
      </div>

      <div className="minitest-nav">
        <button type="button" className="nav-back" onClick={handleBack} disabled={current === 0}>
          <ArrowLeft size={15} /> Atrás
        </button>
        <button type="button" className="nav-next" onClick={handleNext} disabled={!canNext}>
          {current < total - 1 ? 'Siguiente' : 'Ver resultados'} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  </motion.div></AnimatePresence>
}
