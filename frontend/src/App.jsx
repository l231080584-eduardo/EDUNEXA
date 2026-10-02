import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronRight, Compass, GraduationCap, Heart, LockKeyhole, LogIn, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import AccessibilityMenu from './components/AccessibilityMenu'
import IdentityDialog from './components/IdentityDialog'
import JarvisWidget from './components/JarvisWidget'
import ResultsDashboard from './components/ResultsDashboard'
import { buildMetrics, createCareerSuggestions, createReport, questions, scaleLabels } from './data/questions'
import { evaluateTest, getApiError } from './lib/api'
import { cn } from './lib/utils'

const STORAGE_KEY = 'edunexa-profile'
const ACCESSIBILITY_KEY = 'edunexa-accessibility'

function loadStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? { ...fallback, ...JSON.parse(value) } : fallback
  } catch {
    return fallback
  }
}

function Header({ profile, onLogin, settings, onSettingsChange }) {
  return (
    <header className="site-header">
      <a href="#inicio" className="brand" aria-label="EDUNEXA, ir al inicio">
        <span className="brand-mark"><Compass size={22} aria-hidden="true" /></span>
        <span>EDU<span>NEXA</span><small>ORIENTACIÓN CON FUTURO</small></span>
      </a>
      <nav className="main-nav" aria-label="Navegación principal">
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#evaluacion">Tu evaluación</a>
      </nav>
      <div className="header-actions">
        <AccessibilityMenu settings={settings} onChange={onSettingsChange} />
        <button type="button" className={cn('profile-button', profile && 'is-authenticated')} onClick={onLogin}>
          {profile ? <CheckCircle2 size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}
          <span className="profile-label">{profile ? 'Cuenta vinculada' : 'Vincular cuenta'}</span>
        </button>
      </div>
    </header>
  )
}

function QuestionCard({ question, index, selected, onSelect }) {
  return (
    <motion.article
      key={question.id}
      className="question-card"
      initial={{ opacity: 0, x: 34, rotate: 0.5 }}
      animate={{ opacity: 1, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: -34, rotate: -0.5 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      aria-labelledby={`question-${question.id}`}
    >
      <div className="question-topline"><span>{question.eyebrow}</span><span>{String(index + 1).padStart(2, '0')} <i>/ 05</i></span></div>
      <span className="question-orb" aria-hidden="true"><Sparkles size={18} /></span>
      <h3 id={`question-${question.id}`}>{question.title}</h3>
      <p className="question-description">{question.description}</p>
      <fieldset className="answer-fieldset">
        <legend>Selecciona cuánto se parece a ti</legend>
        <div className="likert-options">
          {scaleLabels.map((label, optionIndex) => {
            const value = optionIndex + 1
            return (
              <button
                key={value}
                type="button"
                className={cn('likert-option', selected === value && 'selected')}
                aria-label={`${value} de 5: ${label}`}
                aria-pressed={selected === value}
                onClick={() => onSelect(value)}
              >
                <span className="option-number">{value}</span>
                <span className="option-label">{label}</span>
                {selected === value && <Check className="option-check" size={15} aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      </fieldset>
      <p className="keyboard-hint"><kbd>1</kbd>–<kbd>5</kbd> para elegir <span>·</span> usa <kbd>←</kbd> <kbd>→</kbd> para moverte</p>
    </motion.article>
  )
}

function App() {
  const [profile, setProfile] = useState(() => loadStoredValue(STORAGE_KEY, null))
  const [settings, setSettings] = useState(() => loadStoredValue(ACCESSIBILITY_KEY, { fontScale: 0, highContrast: false, subtitles: true }))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [bonus, setBonus] = useState(false)
  const [result, setResult] = useState(null)
  const [report, setReport] = useState('')
  const [careers, setCareers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const currentQuestion = questions[step]
  const latestAnswer = answers[currentQuestion.id]
  const completion = Object.keys(answers).length
  const metrics = useMemo(() => buildMetrics(answers), [answers])

  useEffect(() => {
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal'
    document.documentElement.dataset.fontScale = String(settings.fontScale)
    try { localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings)) } catch { /* Storage can be disabled by the browser. */ }
  }, [settings])

  useEffect(() => {
    try {
      if (profile?.id) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      setNotice('No se pudo guardar la cuenta en este navegador. Podrás continuar con ella durante esta sesión.')
    }
  }, [profile])

  useEffect(() => {
    function handleKeys(event) {
      if (dialogOpen || loading || result || event.altKey || event.ctrlKey || event.metaKey) return
      const tagName = document.activeElement?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || document.activeElement?.isContentEditable) return
      if (!document.querySelector('#evaluacion:focus-within') && !document.activeElement?.closest('.question-card')) return
      if (/^[1-5]$/.test(event.key)) {
        event.preventDefault()
        setAnswers((current) => ({ ...current, [currentQuestion.id]: Number(event.key) }))
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (step < questions.length - 1 && latestAnswer) setStep((current) => current + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setStep((current) => Math.max(0, current - 1))
      }
    }
    window.addEventListener('keydown', handleKeys)
    return () => window.removeEventListener('keydown', handleKeys)
  }, [currentQuestion.id, dialogOpen, latestAnswer, loading, result, step])

  function updateSettings(change) {
    setSettings((current) => ({ ...current, ...change }))
  }

  function goToStep(nextStep) {
    if (nextStep >= 0 && nextStep < questions.length && (nextStep <= step || answers[questions[nextStep - 1]?.id])) {
      setStep(nextStep)
      setError('')
    }
  }

  async function handleEvaluate() {
    if (!profile?.id) {
      setNotice('Vincula un UUID existente para guardar y evaluar tus respuestas.')
      setDialogOpen(true)
      return
    }
    if (completion !== questions.length) {
      setError('Completa todas las preguntas para ver tu orientación.')
      return
    }
    const recommendedCareers = createCareerSuggestions(metrics)
    const generatedReport = createReport(metrics, recommendedCareers, bonus)
    const payload = {
      usuarioId: profile.id,
      intereses: metrics.intereses,
      materias: metrics.materias,
      estiloVida: metrics.estiloVida,
      geolocalizacion: metrics.geolocalizacion,
      esTecnmIztapalapa1: bonus,
      vectorRespuestas: JSON.stringify(questions.map((question) => answers[question.id])),
      topCarrerasJson: JSON.stringify(recommendedCareers),
      reporteIa: generatedReport,
    }
    setLoading(true)
    setError('')
    try {
      const response = await evaluateTest(payload)
      setResult(response)
      setReport(generatedReport)
      setCareers(recommendedCareers)
      setNotice('')
      window.setTimeout(() => document.getElementById('resultados')?.focus(), 80)
    } catch (apiError) {
      setError(getApiError(apiError))
    } finally {
      setLoading(false)
    }
  }

  function restartTest() {
    setResult(null)
    setReport('')
    setCareers([])
    setAnswers({})
    setStep(0)
    setError('')
    setBonus(false)
    window.setTimeout(() => document.getElementById('evaluacion')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido principal</a>
      <Header profile={profile} onLogin={() => setDialogOpen(true)} settings={settings} onSettingsChange={updateSettings} />
      <main id="contenido">
        <section className="hero-section" id="inicio" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker"><span className="pulse-dot" /> TU PRÓXIMO CAPÍTULO EMPIEZA AQUÍ</span>
            <h1 id="hero-title">Tu futuro no se adivina.<br /><span>Se descubre.</span></h1>
            <p>Conoce lo que te mueve y encuentra caminos profesionales que conectan contigo. A tu ritmo, sin respuestas equivocadas.</p>
            <a className="primary-button hero-cta" href="#evaluacion">
              Descubre tu perfil <ArrowRight size={17} aria-hidden="true" />
            </a>
            <div className="hero-trust"><ShieldCheck size={16} aria-hidden="true" /> Reflexiona con confianza · Tus respuestas son tuyas</div>
          </div>
          <div className="hero-art" role="img" aria-label="Ilustración abstracta de un portal luminoso que representa nuevos caminos">
            <div className="planet-ring ring-one" /><div className="planet-ring ring-two" />
            <div className="hero-planet"><Compass size={50} strokeWidth={1.15} aria-label="Brújula de orientación" /></div>
            <span className="orbit-star star-one"><Sparkles size={18} aria-label="Destello decorativo" /></span>
            <span className="orbit-star star-two"><Zap size={17} aria-label="Energía y descubrimiento" /></span>
            <span className="art-caption"><span /> MUCHAS POSIBILIDADES. TU CAMINO.</span>
          </div>
          <div className="hero-bottom">
            <div><strong>05</strong><span>preguntas para reflexionar</span></div>
            <div><strong>01</strong><span>paso a la vez</span></div>
            <a href="#como-funciona" aria-label="Conoce cómo funciona EDUNEXA">Desliza para explorar <ChevronRight size={15} aria-hidden="true" /></a>
          </div>
        </section>

        <section className="how-section" id="como-funciona" aria-labelledby="how-title">
          <div className="section-heading">
            <div><p className="eyebrow">Simple, como debe ser</p><h2 id="how-title">Una guía. No una etiqueta.</h2></div>
            <p className="section-subtitle">Conócete mejor, recibe ideas y decide con más claridad. El control siempre es tuyo.</p>
          </div>
          <div className="steps-grid">
            <article className="how-card"><span className="step-index">01</span><span className="how-icon"><Heart size={20} aria-hidden="true" /></span><h3>Cuéntanos de ti</h3><p>Responde a cinco preguntas breves sobre lo que te gusta y valoras.</p></article>
            <article className="how-card"><span className="step-index">02</span><span className="how-icon"><Sparkles size={20} aria-hidden="true" /></span><h3>Explora tu perfil</h3><p>Descubre áreas profesionales que podrían conectar contigo.</p></article>
            <article className="how-card"><span className="step-index">03</span><span className="how-icon"><GraduationCap size={20} aria-hidden="true" /></span><h3>Imagina posibilidades</h3><p>Conoce instituciones educativas y sigue investigando tus opciones.</p></article>
          </div>
        </section>

        <section className="evaluation-section" id="evaluacion" aria-labelledby="evaluation-heading">
          {result ? (
            <div id="resultados" tabIndex="-1">
              <ResultsDashboard result={result} report={report} careers={careers} bonus={bonus} onRestart={restartTest} />
            </div>
          ) : (
            <>
              <div className="evaluation-top">
                <div><p className="eyebrow">Tu momento de explorar</p><h2 id="evaluation-heading">Empieza por ti.</h2></div>
                <span className="time-estimate"><Zap size={14} aria-hidden="true" /> 2 MIN · A TU RITMO</span>
              </div>
              <div className="wizard-layout">
                <div className="wizard-main">
                  <nav className="progress-nav" aria-label="Progreso del test vocacional">
                    <div className="progress-label"><span>Tu recorrido</span><span>{String(completion).padStart(2, '0')}<i> / 05</i></span></div>
                    <div className="progress-track" role="progressbar" aria-label="Preguntas respondidas" aria-valuemin="0" aria-valuemax={questions.length} aria-valuenow={completion}>
                      <div className="progress-fill" style={{ width: `${(completion / questions.length) * 100}%` }} />
                    </div>
                    <div className="step-markers">
                      {questions.map((question, index) => (
                        <button
                          type="button"
                          key={question.id}
                          className={cn('step-marker', index === step && 'current', answers[question.id] && 'completed')}
                          aria-label={`Pregunta ${index + 1}${answers[question.id] ? ', respondida' : ''}${index === step ? ', actual' : ''}`}
                          aria-current={index === step ? 'step' : undefined}
                          disabled={index > step && !answers[questions[index - 1]?.id]}
                          onClick={() => goToStep(index)}
                        >{answers[question.id] ? <Check size={13} aria-hidden="true" /> : index + 1}</button>
                      ))}
                    </div>
                  </nav>
                  <AnimatePresence mode="wait">
                    <QuestionCard
                      key={currentQuestion.id}
                      question={currentQuestion}
                      index={step}
                      selected={latestAnswer}
                      onSelect={(value) => { setAnswers((current) => ({ ...current, [currentQuestion.id]: value })); setError('') }}
                    />
                  </AnimatePresence>
                  <div className="wizard-controls">
                    <button type="button" className="quiet-button" disabled={step === 0 || loading} onClick={() => goToStep(step - 1)}>
                      <ArrowLeft size={16} aria-hidden="true" /> Anterior
                    </button>
                    {step < questions.length - 1 ? (
                      <button type="button" className="primary-button" disabled={!latestAnswer || loading} onClick={() => goToStep(step + 1)}>
                        Siguiente <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" className="primary-button" disabled={!latestAnswer || loading} onClick={handleEvaluate}>
                        {loading ? <><span className="spinner" /> Preparando tu guía…</> : <>Descubrir mi perfil <Sparkles size={16} aria-hidden="true" /></>}
                      </button>
                    )}
                  </div>
                  {error && <p className="inline-alert" role="alert">{error}</p>}
                  {notice && <p className="inline-note" role="status">{notice}</p>}
                </div>
                <aside className="wizard-aside" aria-label="Información de la evaluación">
                  <div className="aside-card">
                    <div className="aside-lock"><LockKeyhole size={17} aria-hidden="true" /></div>
                    <h3>Sin presión, con propósito.</h3>
                    <p>No hay respuestas correctas. Tu evaluación es una herramienta para reflexionar, no una decisión por ti.</p>
                    <span className="aside-divider" />
                    <div className="profile-status">
                      <span className={cn('profile-status-dot', profile && 'connected')} />
                      <div><strong>{profile ? 'Cuenta vinculada' : 'Modo exploración'}</strong><small>{profile ? `${profile.id.slice(0, 8)}…` : 'Vincula un UUID al finalizar'}</small></div>
                    </div>
                    <button type="button" className="aside-link" onClick={() => setDialogOpen(true)}>
                      {profile ? 'Cambiar cuenta' : 'Vincular UUID'} <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="bonus-card">
                    <div className="bonus-heading"><span><GraduationCap size={17} aria-hidden="true" /></span><strong>Un extra para ti</strong></div>
                    <p>¿Perteneces o te interesa el TecNM Plantel Iztapalapa 1?</p>
                    <label className="switch-row">
                      <span>{bonus ? 'Sí, me interesa' : 'Aún no'}</span>
                      <input type="checkbox" checked={bonus} onChange={(event) => setBonus(event.target.checked)} aria-label="Indicar interés o pertenencia al TecNM Plantel Iztapalapa 1" />
                      <span className="switch-track" aria-hidden="true"><span /></span>
                    </label>
                    <small>El backend aplica un bono de 10% al puntaje.</small>
                  </div>
                </aside>
              </div>
            </>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <a href="#inicio" className="brand footer-brand" aria-label="EDUNEXA, volver al inicio">
          <span className="brand-mark"><Compass size={19} aria-hidden="true" /></span>
          <span>EDU<span>NEXA</span><small>ORIENTACIÓN CON FUTURO</small></span>
        </a>
        <p>Tu futuro se construye con cada pregunta que te haces.</p>
        <span>Hecho para descubrir <Heart size={13} aria-label="con cuidado" /></span>
      </footer>
      <JarvisWidget answer={latestAnswer} subtitles={settings.subtitles} />
      <IdentityDialog
        open={dialogOpen}
        profile={profile}
        onClose={() => setDialogOpen(false)}
        onSave={(nextProfile) => {
          setProfile(nextProfile)
          setNotice('UUID vinculado. El servidor verificará que exista al guardar tu evaluación.')
        }}
      />
      <div className="sr-only" aria-live="polite">{notice}</div>
    </div>
  )
}

export default App
