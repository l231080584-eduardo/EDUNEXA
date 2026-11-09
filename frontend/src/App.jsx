import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
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
import { buildGameMetrics, CAREER_CATALOG, recommendCareers } from './data/careers'
import { createReport } from './data/questions'
import { evaluateArcadeNoni, evaluateTest, getCareerCatalog } from './lib/api'
import { playArcadeCallout, playClick, startMusic, stopMusic } from './lib/audio'

const STORAGE_KEY = 'edunexa-profile'
const ACCESSIBILITY_KEY = 'edunexa-accessibility'
const RECORD_STORAGE_KEY = 'edunexa-game-record'
const MINITEST_STORAGE_KEY = 'edunexa-mini-test'
const HERO_STORAGE_KEY = 'edunexa-hero'

function loadStoredValue(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? { ...(fallback || {}), ...JSON.parse(value) } : fallback } catch { return fallback }
}

export default function App() {
  const navigate = useNavigate()
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
    getCareerCatalog().then((data) => { if (Array.isArray(data) && data.length) { setCareerCatalog(data); try { localStorage.setItem('edunexa-career-cache', JSON.stringify(data)) } catch { /* Optional catalog cache. */ } } }).catch(() => {
      try { const cached = JSON.parse(localStorage.getItem('edunexa-career-cache') || '[]'); if (Array.isArray(cached) && cached.length) setCareerCatalog(cached) } catch { /* The bundled catalog remains available. */ }
    })
  }, [])

  function handleMiniTestComplete(miniTestResults, heroId) {
    setMiniTest(miniTestResults)
    if (heroId) {
      const selectedHero = HERO_CLASSES.find((h) => h.id === heroId)
      if (selectedHero) {
        setHero(selectedHero)
        try { localStorage.setItem(HERO_STORAGE_KEY, selectedHero.id) } catch { /* Hero persistence is best effort. */ }
        playArcadeCallout('OK! MISSION 1: START!')
        startMusic()
        navigate('/juego', { replace: true })
        return
      }
    }
    setHero(null)
    try { localStorage.removeItem(HERO_STORAGE_KEY) } catch { /* Hero persistence is best effort. */ }
    setSuggestedHeroId(heroId || null)
    navigate('/juego', { replace: true })
  }

  function handleGameComplete(gameStats = {}) {
    const categoryCounts = gameStats?.gemCounts && typeof gameStats.gemCounts === 'object' ? gameStats.gemCounts : {}
    const totalXp = Math.max(0, Number(gameStats?.totalXp) || 0)
    const gameMetrics = buildGameMetrics(categoryCounts, gameStats?.gemEffectiveness)

    let finalMetrics = gameMetrics
    if (miniTest?.answers) {
      const mt = miniTest
      const getAnswer = (id) => (mt.answers[id] || 3) - 1
      const intereses = (getAnswer('intereses-1') + getAnswer('intereses-2')) / 2 / 4
      const materias = getAnswer('materias') / 4
      const estiloVida = getAnswer('estilo-vida') / 4
      const geolocalizacion = getAnswer('geolocalizacion') / 4
      const miniMetrics = { intereses, materias, estiloVida, geolocalizacion }
      finalMetrics = {
        intereses: 0.4 * miniMetrics.intereses + 0.6 * gameMetrics.intereses,
        materias: 0.4 * miniMetrics.materias + 0.6 * gameMetrics.materias,
        estiloVida: 0.4 * miniMetrics.estiloVida + 0.6 * gameMetrics.estiloVida,
        geolocalizacion: 0.4 * miniMetrics.geolocalizacion + 0.6 * gameMetrics.geolocalizacion,
      }
    }

    const interestedTecnm = Boolean(profile?.interesTecnm)
    const recommendedCareers = recommendCareers(categoryCounts, gameStats?.gemEffectiveness, careerCatalog, finalMetrics)
    const careerNames = recommendedCareers.map((career) => career.name)
    const generatedReport = createReport(finalMetrics, careerNames, interestedTecnm)
    const matchScore = Math.min(1, finalMetrics.intereses * .45 + finalMetrics.materias * .25 + finalMetrics.estiloVida * .2 + finalMetrics.geolocalizacion * .1)
    const finalResult = { matchScore, resultadoId: `ARCADE-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`, xp: totalXp, score: Math.max(0, Number(gameStats?.score) || 0), gemCounts: categoryCounts, gemEffectiveness: gameStats?.gemEffectiveness || {}, hero: gameStats?.hero || hero?.id || 'tech', miniTest: miniTest || null }
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
    playClick(); playArcadeCallout('OK! MISSION 1: START!'); startMusic(); setHero(selection)
    try { localStorage.setItem(HERO_STORAGE_KEY, selection.id) } catch { /* Hero persistence is best effort. */ }
  }

  function restartMission() {
    stopMusic(); setResult(null); setReport(''); setCareers([]); setHero(null); setMetrics({ intereses: 0, materias: 0, estiloVida: 0, geolocalizacion: 0 }); setNoniBackend(null)
    try { localStorage.removeItem(RECORD_STORAGE_KEY) } catch { /* Cleanup is best effort. */ }
    try { localStorage.removeItem(HERO_STORAGE_KEY) } catch { /* Hero cleanup is best effort. */ }
    navigate('/', { replace: true })
  }

  function ProtectedSession({ children }) {
    const hasProfile = Boolean(profile?.id)
    if (!hasProfile) return <Navigate to="/login" replace />
    return children
  }

  function ProtectedMiniTest({ children }) {
    const hasProfile = Boolean(profile?.id)
    if (!hasProfile) return <Navigate to="/login" replace />
    const hasMiniTest = Boolean(miniTest)
    if (!hasMiniTest) return <Navigate to="/mini-test" replace />
    return children
  }

  function ProtectedResults({ children }) {
    const hasProfile = Boolean(profile?.id)
    if (!hasProfile) return <Navigate to="/login" replace />
    const hasRecord = Boolean(result) || Boolean(loadStoredValue(RECORD_STORAGE_KEY, null)?.result)
    if (!hasRecord) return <Navigate to="/" replace />
    return children
  }

  return <div className="app-shell">
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <Navbar profile={profile} onLogin={() => navigate('/login')} onLogout={handleLogout} settings={settings} onSettingsChange={(change) => setSettings((current) => ({ ...current, ...change }))} hasResults={Boolean(result)} />
    <main id="contenido">
      <Routes>
        <Route path="/" element={<LandingSection onStart={() => { playClick(); navigate('/mini-test') }} />} />
        <Route path="/login" element={<AuthPage profile={profile} onSave={handleProfileSave} onClose={() => navigate('/')} />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/mini-test" element={<MiniTest open={true} onComplete={handleMiniTestComplete} />} />
        <Route path="/juego" element={
          <ProtectedMiniTest>
            <section className="mission-launch-section" id="evaluacion" aria-label="Inicia la misión arcade">
              {hero ? <ArcadeCabinet hero={hero}><Arcade2DGame key={`quest-${hero.id}`} hero={hero} profile={profile} onGameComplete={handleGameComplete} /></ArcadeCabinet> : <CharacterSelect open={true} onClose={() => navigate('/')} onSelect={chooseHero} suggestedHeroId={suggestedHeroId} />}
            </section>
          </ProtectedMiniTest>
        } />
        <Route path="/resultados" element={
          <ProtectedResults>
            <section id="resultados" tabIndex="-1">
              <ResultsDashboard result={result} report={report} careers={careers} bonus={profile?.interesTecnm} profile={profile} metrics={metrics} savedRecord={record} onRecordUpdate={handleRecordUpdate} onRestart={restartMission} onNoniUpdate={setNoniMessage} noniBackend={noniBackend} miniTest={miniTest} />
            </section>
          </ProtectedResults>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <NoniWidget message={noniMessage} subtitles={settings.subtitles} />
  </div>
}
