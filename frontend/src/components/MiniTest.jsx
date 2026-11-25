import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react'
import { questions, scaleLabels } from '../data/questions'
import { VOCATIONAL_SCENARIOS } from '../data/vocationalScenarios'
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
  const [scenarioAnswers, setScenarioAnswers] = useState({})
  const [selectedAreas, setSelectedAreas] = useState([])
  const [results, setResults] = useState(null)

  if (!open) return null

  const isScenario = current >= questions.length
  const scenarioIndex = current - questions.length
  const scenario = isScenario ? VOCATIONAL_SCENARIOS[scenarioIndex] : null
  const question = isScenario ? null : questions[current]
  const total = questions.length + VOCATIONAL_SCENARIOS.length

  function handleSelect(value) {
    playClick()
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  function handleScenarioSelect(category) {
    playClick()
    setScenarioAnswers((prev) => ({ ...prev, [scenario.id]: category }))
  }

  function toggleArea(category) {
    playClick()
    setSelectedAreas((previous) => {
      if (previous.includes(category)) return previous.filter((area) => area !== category)
      return previous.length < 2 ? [...previous, category] : previous
    })
  }

  function handleNext() {
    if (current < total - 1) {
      playCoin()
      setCurrent((prev) => prev + 1)
    } else {
      const completedAnswers = { ...answers }
      if (question) completedAnswers[question.id] = answers[question.id] || 3
      const surveyScores = calculateScores(completedAnswers)
      const scenarioCounts = Object.fromEntries(CATEGORIES.map((category) => [category, 0]))
      Object.values(scenarioAnswers).forEach((category) => { if (scenarioCounts[category] !== undefined) scenarioCounts[category] += 1 })
      const scenarioScores = Object.fromEntries(CATEGORIES.map((category) => [category, Math.min(1, scenarioCounts[category] / 3)]))
      // The reflective questions and concrete choices both contribute. The
      // confirmation step below lets the student correct the resulting summary.
      const scores = Object.fromEntries(CATEGORIES.map((category) => [category, surveyScores[category] * .6 + scenarioScores[category] * .4]))
      const suggestedHero = getSuggestedHero(scores)
      const topTwo = getTopTwo(scores)
      setSelectedAreas(topTwo)
      setResults({ scores, surveyScores, scenarioScores, scenarioAnswers, suggestedHero, topTwo, answers: completedAnswers })
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
    if (selectedAreas.length !== 2) return
    playCoin()
    const confirmedScores = Object.fromEntries(CATEGORIES.map((category) => [
      category,
      results.scores[category] * .75 + (selectedAreas.includes(category) ? .25 : 0),
    ]))
    const suggestedHero = selectedAreas[0] || results.suggestedHero
    onComplete({ ...results, scores: confirmedScores, suggestedHero, topTwo: selectedAreas, confirmedTopTwo: selectedAreas }, heroId)
  }

  if (results) {
    return <AnimatePresence><motion.div className="minitest-results" role="dialog" aria-modal="true" aria-labelledby="minitest-result-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="minitest-crt" />
      <div className="minitest-card minitest-result-card">
        <div className="minitest-header">
          <Sparkles size={20} />
          <h2 id="minitest-result-title">Revisa tu brújula vocacional</h2>
          <p>Combinamos tus respuestas con seis decisiones sobre actividades reales. ¿Las áreas que salieron sí te representan?</p>
        </div>

        <section className="minitest-area-confirm" aria-labelledby="minitest-area-confirm-title">
          <div className="minitest-confirm-heading"><h3 id="minitest-area-confirm-title">Confirma tus dos áreas principales</h3><span>{selectedAreas.length} de 2 elegidas</span></div>
          <p>Deja las sugeridas o cámbialas. Esto cuenta más que cualquier objetivo que hayas disparado en el juego.</p>
          <div className="minitest-area-options">
            {CATEGORIES.map((category) => {
              const selected = selectedAreas.includes(category)
              const disabled = !selected && selectedAreas.length >= 2
              return <button key={category} type="button" className={`minitest-area-option ${selected ? 'is-selected' : ''}`} style={{ '--area-color': GEM_CATEGORIES[category].color }} aria-pressed={selected} disabled={disabled} onClick={() => toggleArea(category)}>
                <span className="minitest-area-check">{selected ? <Check size={13} /> : <span />}</span>
                <strong>{GEM_CATEGORIES[category].label}</strong>
                <small>{GEM_CATEGORIES[category].field}</small>
              </button>
            })}
          </div>
        </section>

        <div className="minitest-top-categories">
          <h3>Señales de tus respuestas y situaciones</h3>
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
          <p className="eyebrow">SUGERENCIA DE NINO HERNÁNDEZ</p>
          <h3>¿Listo para elegir tu camino?</h3>
          <p>Por las áreas que confirmaste, podrías explorar <strong>{GEM_CATEGORIES[selectedAreas[0]]?.label || GEM_CATEGORIES[results.suggestedHero]?.label}</strong>. Después puedes elegir libremente cualquier héroe.</p>
        </div>

        <div className="minitest-actions">
          <button type="button" className="minitest-play-button" disabled={selectedAreas.length !== 2} onClick={() => handleStartGame(selectedAreas[0] || results.suggestedHero)}>
            <Check size={18} /> {selectedAreas.length === 2 ? 'Continuar y elegir héroe' : 'Selecciona dos áreas'} <ArrowRight size={16} />
          </button>
          <p className="minitest-change-button">En la siguiente pantalla puedes elegir cualquiera de los seis héroes; no estás obligado a seguir la sugerencia.</p>
        </div>

        <p className="minitest-note">
          <Sparkles size={14} /> NONI: «Estas son solo sugerencias. Tu aventura depende de ti, ¡y no hay camino equivocado!»
        </p>
      </div>
    </motion.div></AnimatePresence>
  }

  const selectedValue = isScenario ? scenarioAnswers[scenario.id] : answers[question.id]
  const canNext = selectedValue !== undefined
  const stepLabel = isScenario ? `Situación ${scenarioIndex + 1} de ${VOCATIONAL_SCENARIOS.length}` : `Pregunta ${current + 1} de ${questions.length}`

  return <AnimatePresence><motion.div className={`minitest-overlay ${isScenario ? 'is-scenario' : ''}`} role="dialog" aria-modal="true" aria-labelledby="minitest-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="minitest-crt" />
    <div className={`minitest-card ${isScenario ? 'is-scenario' : ''}`}>
      <div className="minitest-progress">
        <span className="eyebrow">{stepLabel}</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="minitest-question">
        <span className="eyebrow">{isScenario ? 'Decisión vocacional' : question.eyebrow}</span>
        <h2 id="minitest-title">{isScenario ? scenario.title : question.title}</h2>
        <p>{isScenario ? scenario.context : question.description}</p>
      </div>

      {isScenario ? <div className="minitest-scenario-options" role="radiogroup" aria-label={scenario.title}>
        {scenario.options.map((option, index) => {
          const selected = selectedValue === option.category
          return <motion.button key={option.category} type="button" role="radio" aria-checked={selected} className={`minitest-scenario-option ${selected ? 'is-selected' : ''}`} style={{ '--area-color': GEM_CATEGORIES[option.category].color }} onMouseEnter={() => playHover()} onClick={() => handleScenarioSelect(option.category)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}>
            <span className="scenario-area-label">{GEM_CATEGORIES[option.category].label}</span><span>{option.text}</span>
          </motion.button>
        })}
      </div> : <div className="minitest-scale" role="radiogroup" aria-label={question.title}>
        {scaleLabels.map((label, index) => {
          const value = index + 1
          const isSelected = selectedValue === value
          return <motion.button key={value} type="button" role="radio" aria-checked={isSelected} className={`scale-option ${isSelected ? 'is-selected' : ''}`} style={{ animationDelay: `${index * 0.06}s` }} onMouseEnter={() => playHover()} onClick={() => handleSelect(value)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <span className="scale-value">{value}</span>
            <span className="scale-label">{label}</span>
          </motion.button>
        })}
      </div>}

      <div className="minitest-non-message">
        <Sparkles size={14} />
        <span>{isScenario ? 'No elijas lo que suena mejor: marca la tarea que de verdad te gustaría probar.' : NONI_MESSAGES[current] || '¡Sigue así!'}</span>
      </div>

      <div className="minitest-nav">
        <button type="button" className="nav-back" onClick={handleBack} disabled={current === 0}>
          <ArrowLeft size={15} /> Atrás
        </button>
        <button type="button" className="nav-next" onClick={handleNext} disabled={!canNext}>
          {current < total - 1 ? 'Siguiente' : 'Revisar mi perfil'} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  </motion.div></AnimatePresence>
}
