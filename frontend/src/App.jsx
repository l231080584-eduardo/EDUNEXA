import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import CharacterSelect, { HERO_CLASSES } from './components/CharacterSelect'
import MiniTest from './components/MiniTest'
import ArcadeCabinet from './components/ArcadeCabinet'
import Arcade2DGame from './components/Arcade2DGame'
import AuthPage from './components/AuthPage'
import AdminPage from './components/AdminPage'
import LandingSection from './components/LandingSection'
import Navbar from './components/Navbar'
import NoniWidget from './components/NoniWidget'
import ResultsDashboard from './components/ResultsDashboard'
import { CAREER_CATALOG, GEM_CATEGORIES, recommendCareers } from './data/careers'
import { createReport } from './data/questions'
import { evaluateArcadeNoni, evaluateTest, getCareerCatalog } from './lib/api'
import { playArcadeCallout, playClick, stopMusic } from './lib/audio'
import { stopArcadeMusic } from './lib/arcadeAudio'

const STORAGE_KEY = 'edunexa-profile'
const ACCESSIBILITY_KEY = 'edunexa-accessibility'
const RECORD_STORAGE_KEY = 'edunexa-game-record'
const MINITEST_STORAGE_KEY = 'edunexa-mini-test'
const HERO_STORAGE_KEY = 'edunexa-hero'

function loadStoredValue(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? { ...(fallback || {}), ...JSON.parse(value) } : fallback } catch { return fallback }
}

function ProtectedSession({ children, profile }) {
  const hasProfile = Boolean(profile?.id)
  if (!hasProfile) return <Navigate to="/login" replace />
  return children
}

function ProtectedMiniTest({ children, profile, miniTest }) {
  const hasProfile = Boolean(profile?.id)
  if (!hasProfile) return <Navigate to="/login" replace />
  const hasMiniTest = Boolean(miniTest)
  if (!hasMiniTest) return <Navigate to="/mini-test" replace />
  return children
}

function ProtectedResults({ children, profile, result }) {
  const hasProfile = Boolean(profile?.id)
  if (!hasProfile) return <Navigate to="/login" replace />
  const hasRecord = Boolean(result) || Boolean(loadStoredValue(RECORD_STORAGE_KEY, null)?.result)
  if (!hasRecord) return <Navigate to="/" replace />
  return children
}

function MissionLaunch({ hero, profile, onGameComplete, onExit, onSelectHero, suggestedHeroId }) {
  return <section className="mission-launch-section" id="evaluacion" aria-label="Inicia la misión arcade">
    {hero ? <ArcadeCabinet hero={hero}><Arcade2DGame key={`quest-${hero.id}`} hero={hero} profile={profile} onGameComplete={onGameComplete} onExit={onExit} /></ArcadeCabinet> : <CharacterSelect open={true} onClose={onExit} onSelect={onSelectHero} suggestedHeroId={suggestedHeroId} />}
  </section>
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(() => loadStoredValue(STORAGE_KEY, null))
  const [record, setRecord] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null))
  const [settings, setSettings] = useState(() => loadStoredValue(ACCESSIBILITY_KEY, { fontScale: 0, highContrast: false, subtitles: true }))
  const [hero, setHero] = useState(() => {
    try {
      const storedHeroId = localStorage.getItem(HERO_STORAGE_KEY)
      if (storedHeroId) {
        const found = HERO_CLASSES.find((h) => h.id === storedHeroId)
        return found || null
      }
    } catch { /* Hero persistence is best effort. */ }
    return null
  })
  const [miniTest, setMiniTest] = useState(() => loadStoredValue(MINITEST_STORAGE_KEY, null))
  const [suggestedHeroId, setSuggestedHeroId] = useState(null)
  const [result, setResult] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null)?.result || null)
  const [report, setReport] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null)?.report || '')
  const [careers, setCareers] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null)?.careers || [])
  const [careerCatalog, setCareerCatalog] = useState(CAREER_CATALOG)
  const [metrics, setMetrics] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null)?.metrics || { intereses: 0, materias: 0, estiloVida: 0, geolocalizacion: 0 })
  const [noniMessage, setNoniMessage] = useState(null)
  const [noniBackend, setNoniBackend] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal'; document.documentElement.dataset.fontScale = String(settings.fontScale)
    try { localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings)) } catch { /* Preferences are optional. */ }
  }, [settings])
  useEffect(() => { try { if (profile?.id) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); else localStorage.removeItem(STORAGE_KEY) } catch { /* The mission remains playable without browser storage. */ } }, [profile])
  useEffect(() => { try { if (record) localStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(record)) } catch { /* Local record storage is best effort. */ } }, [record])
  useEffect(() => { try { if (miniTest) localStorage.setItem(MINITEST_STORAGE_KEY, JSON.stringify(miniTest)); else localStorage.removeItem(MINITEST_STORAGE_KEY) } catch { /* Mini-test storage is best effort. */ } }, [miniTest])
  useEffect(() => {
    // In local demos the Spring API may not be running; the bundled catalog is complete.
    if (import.meta.env.DEV) {
      try {
        const cached = JSON.parse(localStorage.getItem('edunexa-career-cache') || '[]')
        if (Array.isArray(cached) && cached.length) setCareerCatalog(cached)
      } catch { /* The bundled catalog remains available. */ }
      return
    }
    getCareerCatalog().then((data) => { if (Array.isArray(data) && data.length) { setCareerCatalog(data); try { localStorage.setItem('edunexa-career-cache', JSON.stringify(data)) } catch { /* Optional catalog cache. */ } } }).catch(() => {
      try { const cached = JSON.parse(localStorage.getItem('edunexa-career-cache') || '[]'); if (Array.isArray(cached) && cached.length) setCareerCatalog(cached) } catch { /* The bundled catalog remains available. */ }
    })
  }, [])

  function handleMiniTestComplete(miniTestResults, heroId) {
    setMiniTest(miniTestResults)
    setHero(null)
    try { localStorage.removeItem(HERO_STORAGE_KEY) } catch { /* Hero persistence is best effort. */ }
    setSuggestedHeroId(heroId || null)
    navigate('/juego', { replace: true })
  }

  function handleGameComplete(gameStats = {}) {
    const categoryCounts = gameStats?.gemCounts && typeof gameStats.gemCounts === 'object' ? gameStats.gemCounts : {}
    const totalXp = Math.max(0, Number(gameStats?.totalXp) || 0)
    const chosenHero = gameStats?.hero || hero?.id || 'tech'
    const gameDecisionTotal = Object.values(categoryCounts).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0)
    const answerValue = (id) => Math.max(0, Math.min(1, ((Number(miniTest?.answers?.[id]) || 3) - 1) / 4))
    const miniScores = miniTest?.scores || {}
    const familyScores = Object.fromEntries(Object.keys(GEM_CATEGORIES).map((family) => {
      const gameShare = gameDecisionTotal ? (Number(categoryCounts[family]) || 0) / gameDecisionTotal : 0
      const miniScore = Math.max(0, Math.min(1, Number(miniScores[family]) || 0))
      const selectedScore = chosenHero === family ? 1 : 0
      return [family, 0.3 * miniScore + 0.2 * selectedScore + 0.5 * gameShare]
    }))
    const finalMetrics = {
      intereses: (familyScores.tech + familyScores.life) / 2,
      materias: (familyScores.industry + familyScores.energy) / 2,
      estiloVida: (familyScores.construction + familyScores.business) / 2,
      geolocalizacion: answerValue('geolocalizacion'),
      familyScores,
      hero: chosenHero,
      weights: { miniTest: 0.3, hero: 0.2, gameplay: 0.5 },
    }

    const interestedTecnm = Boolean(profile?.interesTecnm)
    const recommendedCareers = recommendCareers(categoryCounts, gameStats?.gemEffectiveness, careerCatalog, finalMetrics)
    const careerNames = recommendedCareers.map((career) => career.name)
    const generatedReport = createReport(finalMetrics, careerNames, interestedTecnm)
    const matchScore = Math.max(...Object.values(familyScores))
    const finalResult = { matchScore, familyScores, weights: finalMetrics.weights, resultadoId: `ARCADE-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`, xp: totalXp, score: Math.max(0, Number(gameStats?.score) || 0), gemCounts: categoryCounts, gemEffectiveness: gameStats?.gemEffectiveness || {}, hero: chosenHero, miniTest: miniTest || null }
    const playerId = profile?.id || `guest-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`
    const completedRecord = { playerId, heroClass: finalResult.hero, finalScore: finalResult.score, recommendedUniversities: [], selectedUniversity: null, studentLocation: null, result: finalResult, report: generatedReport, careers: recommendedCareers, metrics: finalMetrics, miniTest: miniTest || null, savedAt: new Date().toISOString() }
    setMetrics(finalMetrics); setReport(generatedReport); setCareers(recommendedCareers); setResult(finalResult); setRecord(completedRecord)
    setNoniBackend(null)
    if (profile?.id) {
      const payload = { usuarioId: profile.id, intereses: finalMetrics.intereses, materias: finalMetrics.materias, estiloVida: finalMetrics.estiloVida, geolocalizacion: finalMetrics.geolocalizacion, esTecnmIztapalapa1: interestedTecnm, vectorRespuestas: JSON.stringify(categoryCounts), topCarrerasJson: JSON.stringify(careerNames), reporteIa: generatedReport }
      // Call evaluateArcadeNoni first, then evaluateTest with the university from NONI
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(profile.id)) {
        evaluateArcadeNoni(payload, profile?.nickname || 'Aspirante').then((data) => {
          if (data?.narrative) {
            setNoniBackend({ narrative: data.narrative, carrera: data.carrera, universidad: data.universidad, badges: data.badges })
          }
          // Call evaluateTest with universidadRecomendada from NONI response
          evaluateTest({ ...payload, universidadRecomendada: data?.universidad?.nombre || null }).catch(() => {})
        }).catch(() => {
          /* Backend NONI is optional; results remain available. */
          // NONI failed, call evaluateTest without university
          evaluateTest(payload).catch(() => {})
        })
      } else {
        evaluateTest(payload).catch(() => {})
      }
    }
    navigate('/resultados', { replace: true })
  }

  function handleProfileSave(usuario) {
    setProfile(usuario)
    if (miniTest) {
      navigate('/juego', { replace: true })
    } else {
      navigate('/mini-test', { replace: true })
    }
    if (record) setRecord((current) => current ? { ...current, playerId: usuario.id } : current)
  }

  function handleLogout() {
    setProfile(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* Cleanup is best effort. */ }
    navigate('/', { replace: true })
  }

  const handleRecordUpdate = useCallback((mapData) => {
    setRecord((current) => current ? { ...current, ...mapData } : current)
  }, [])

  function chooseHero(selection) {
    playClick(); playArcadeCallout('¡HÉROE EQUIPADO!'); setHero(selection)
    try { localStorage.setItem(HERO_STORAGE_KEY, selection.id) } catch { /* Hero persistence is best effort. */ }
  }

  function restartMission() {
    stopMusic(); stopArcadeMusic(); setResult(null); setReport(''); setCareers([]); setHero(null); setMetrics({ intereses: 0, materias: 0, estiloVida: 0, geolocalizacion: 0 }); setNoniBackend(null)
    try { localStorage.removeItem(RECORD_STORAGE_KEY) } catch { /* Cleanup is best effort. */ }
    try { localStorage.removeItem(HERO_STORAGE_KEY) } catch { /* Hero cleanup is best effort. */ }
    navigate('/', { replace: true })
  }

  const beginJourney = useCallback(() => { playClick(); navigate('/mini-test') }, [navigate])

  return <div className={`app-shell ${location.pathname === '/juego' ? 'app-shell-immersive' : ''}`}>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    {location.pathname !== '/juego' && <Navbar profile={profile} onLogin={() => navigate('/login')} onLogout={handleLogout} settings={settings} onSettingsChange={(change) => setSettings((current) => ({ ...current, ...change }))} hasResults={Boolean(result)} />}
    <main id="contenido">
      <Routes>
        <Route path="/" element={<LandingSection onStart={beginJourney} />} />
        <Route path="/login" element={<AuthPage profile={profile} onSave={handleProfileSave} onClose={() => navigate('/')} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/mini-test" element={<MiniTest open={true} onComplete={handleMiniTestComplete} />} />
        <Route path="/juego" element={
          <ProtectedMiniTest profile={profile} miniTest={miniTest}>
            <MissionLaunch hero={hero} profile={profile} onGameComplete={handleGameComplete} onExit={() => navigate('/')} onSelectHero={chooseHero} suggestedHeroId={suggestedHeroId} />
          </ProtectedMiniTest>
        } />
        <Route path="/resultados" element={
          <ProtectedResults profile={profile} result={result}>
            <section id="resultados" tabIndex="-1">
              <ResultsDashboard result={result} report={report} careers={careers} bonus={profile?.interesTecnm} profile={profile} metrics={metrics} savedRecord={record} onRecordUpdate={handleRecordUpdate} onRestart={restartMission} onNoniUpdate={setNoniMessage} noniBackend={noniBackend} miniTest={miniTest} />
            </section>
          </ProtectedResults>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    {location.pathname !== '/juego' && <NoniWidget message={noniMessage} subtitles={settings.subtitles} />}
  </div>
}
