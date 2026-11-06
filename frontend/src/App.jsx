import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { ArrowRight, Gamepad2 } from 'lucide-react'
import CharacterSelect, { HERO_CLASSES } from './components/CharacterSelect'
import MiniTest from './components/MiniTest'
import ArcadeCabinet from './components/ArcadeCabinet'
import IdentityDialog from './components/IdentityDialog'
import LandingSection from './components/LandingSection'
import Navbar from './components/Navbar'
import NoniWidget from './components/NoniWidget'
import ResultsDashboard from './components/ResultsDashboard'
import { buildGameMetrics, CAREER_CATALOG, recommendCareers } from './data/careers'
import { createReport } from './data/questions'
import { evaluateArcadeNoni, evaluateTest, getCareerCatalog } from './lib/api'
import { playArcadeCallout, playClick, startMusic, stopMusic } from './lib/audio'
import { isSupabaseConfigured, loadRemoteGameRecord, loginPlayer, refreshPlayerSession, registerPlayer, saveRemoteGameRecord } from './lib/db'

const STORAGE_KEY = 'edunexa-profile'
const ACCESSIBILITY_KEY = 'edunexa-accessibility'
const RECORD_STORAGE_KEY = 'edunexa-game-record'
const MINITEST_STORAGE_KEY = 'edunexa-mini-test'
const Arcade3DGame = lazy(() => import('./components/Arcade3DGame'))

function loadStoredValue(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? { ...(fallback || {}), ...JSON.parse(value) } : fallback } catch { return fallback }
}

export default function App() {
  const [profile, setProfile] = useState(() => loadStoredValue(STORAGE_KEY, null))
  const [record, setRecord] = useState(() => loadStoredValue(RECORD_STORAGE_KEY, null))
  const [settings, setSettings] = useState(() => loadStoredValue(ACCESSIBILITY_KEY, { fontScale: 0, highContrast: false, subtitles: true }))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [characterSelectOpen, setCharacterSelectOpen] = useState(false)
  const [miniTestOpen, setMiniTestOpen] = useState(false)
  const [hero, setHero] = useState(null)
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
    if (!profile?.session?.access_token) return undefined
    let active = true
    loadRemoteGameRecord(profile.session).then((remoteRecord) => {
      if (!active || !remoteRecord?.result) return
      setRecord(remoteRecord); setResult(remoteRecord.result); setReport(remoteRecord.report || ''); setCareers(remoteRecord.careers || []); setMetrics(remoteRecord.metrics || {})
    }).catch(() => { /* The saved local record stays available when cloud sync is offline. */ })
    return () => { active = false }
  }, [profile?.session?.access_token, profile?.id])
  useEffect(() => {
    const session = profile?.session
    if (!session?.refresh_token || Number(session.expires_at || 0) * 1000 > Date.now() + 60000) return undefined
    let active = true
    refreshPlayerSession(session.refresh_token).then((refreshed) => {
      if (!active || !refreshed?.access_token) return
      setProfile((current) => current?.id === profile.id ? { ...current, session: { access_token: refreshed.access_token, refresh_token: refreshed.refresh_token || session.refresh_token, expires_at: refreshed.expires_at, user: { id: current.id } } } : current)
    }).catch(() => { /* The record remains available from the local memory card. */ })
    return () => { active = false }
  }, [profile?.id, profile?.session?.expires_at, profile?.session?.refresh_token])
  useEffect(() => {
    if (!record || !profile?.session?.access_token || record.playerId !== profile.id) return
    saveRemoteGameRecord(record, profile.session).catch(() => { /* Local persistence is authoritative while the network is unavailable. */ })
  }, [profile, record])
  useEffect(() => {
    if (!result) return
    window.requestAnimationFrame(() => document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [result])
  useEffect(() => {
    getCareerCatalog().then((data) => { if (Array.isArray(data) && data.length) { setCareerCatalog(data); try { localStorage.setItem('edunexa-career-cache', JSON.stringify(data)) } catch { /* Optional catalog cache. */ } } }).catch(() => {
      try { const cached = JSON.parse(localStorage.getItem('edunexa-career-cache') || '[]'); if (Array.isArray(cached) && cached.length) setCareerCatalog(cached) } catch { /* The bundled catalog remains available. */ }
    })
  }, [])

  function handleMiniTestComplete(miniTestResults, heroId) {
    setMiniTest(miniTestResults)
    setMiniTestOpen(false)
    if (heroId) {
      const selectedHero = HERO_CLASSES.find((h) => h.id === heroId)
      if (selectedHero) {
        setHero(selectedHero)
        playArcadeCallout('OK! MISSION 1: START!')
        startMusic()
        window.requestAnimationFrame(() => document.getElementById('evaluacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
        return
      }
    }
    setSuggestedHeroId(heroId || null)
    setCharacterSelectOpen(true)
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
      evaluateTest(payload).catch(() => {})
      // Call evaluateArcadeNoni only if profile.id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(profile.id)) {
        evaluateArcadeNoni(payload, profile?.nickname || 'Aspirante').then((data) => {
          if (data?.narrative) {
            setNoniBackend({ narrative: data.narrative, carrera: data.carrera, universidad: data.universidad, badges: data.badges })
          }
        }).catch(() => { /* Backend NONI is optional; results remain available. */ })
      }
    }
  }

  async function handleProfileSave(savedProfile, auth = {}) {
    let nextProfile = { ...savedProfile }
    if (isSupabaseConfigured) {
      const authResult = auth.mode === 'login'
        ? await loginPlayer(auth.email, auth.password)
        : await registerPlayer(auth.email, auth.password, savedProfile)
      const user = authResult.user || authResult.session?.user
      if (user?.id) {
        const metadata = user.user_metadata || {}
        const details = auth.mode === 'login' ? {} : savedProfile
        nextProfile = {
          ...details,
          id: user.id,
          nombre: metadata.nombre || details.nombre || user.email?.split('@')[0] || 'Jugador EDUNEXA',
          nickname: metadata.nickname || details.nickname || '',
          telefono: metadata.telefono || details.telefono || '',
          escuela: metadata.escuela || details.escuela || '',
          interesTecnm: metadata.interesTecnm ?? details.interesTecnm ?? false,
          folio: metadata.folio || details.folio || `EDU-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)}`,
          email: user.email || auth.email,
          session: authResult.session ? { access_token: authResult.session.access_token, refresh_token: authResult.session.refresh_token, expires_at: authResult.session.expires_at, user: { id: user.id } } : null,
        }
      }
      if (!authResult.session && auth.mode !== 'login') setNoniMessage({ text: 'Tu tarjeta se creó. Revisa tu correo para confirmar la cuenta y activar la sincronización en la nube.', id: Date.now() })
    }
    setProfile(nextProfile)
    if (record) setRecord((current) => current ? { ...current, playerId: nextProfile.id } : current)
    return nextProfile
  }

  const handleRecordUpdate = useCallback((mapData) => {
    setRecord((current) => current ? { ...current, ...mapData } : current)
  }, [])

  function chooseHero(selection) {
    playClick(); playArcadeCallout('OK! MISSION 1: START!'); startMusic(); setHero(selection); setCharacterSelectOpen(false)
    window.requestAnimationFrame(() => document.getElementById('evaluacion')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function restartMission() {
    stopMusic(); setResult(null); setReport(''); setCareers([]); setHero(null); setMetrics({ intereses: 0, materias: 0, estiloVida: 0, geolocalizacion: 0 }); setNoniBackend(null)
    try { localStorage.removeItem(RECORD_STORAGE_KEY) } catch { /* Cleanup is best effort. */ }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  return <div className="app-shell">
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <Navbar profile={profile} onLogin={() => setDialogOpen(true)} settings={settings} onSettingsChange={(change) => setSettings((current) => ({ ...current, ...change }))} hasResults={Boolean(result)} />
    <main id="contenido">
      <LandingSection onStart={() => { playClick(); setMiniTestOpen(true) }} />
      {result ? <section id="resultados" tabIndex="-1"><ResultsDashboard result={result} report={report} careers={careers} bonus={profile?.interesTecnm} profile={profile} metrics={metrics} savedRecord={record} onRecordUpdate={handleRecordUpdate} onRestart={restartMission} onNoniUpdate={setNoniMessage} noniBackend={noniBackend} miniTest={miniTest} /></section> : <>
        <section className="mission-launch-section" id="evaluacion" aria-label="Inicia la misión arcade">{hero ? <ArcadeCabinet hero={hero}><Suspense fallback={<div className="mission-launch-card webgl-loading"><span><Gamepad2 size={22} /></span><p className="eyebrow">CARGANDO ARCADE WEBGL</p><h2>Preparando tu máquina...</h2></div>}><Arcade3DGame key={`quest-${hero.id}`} hero={hero} profile={profile} onGameComplete={handleGameComplete} onNoniUpdate={setNoniMessage} /></Suspense></ArcadeCabinet> : <div className="mission-launch-card"><span><Gamepad2 size={22} /></span><p className="eyebrow">TU MISIÓN TE ESPERA</p><h2>Escoge una clase y toma el control.</h2><p>Seis áreas, una misión y un copiloto a tu lado. Explora sin presión: no hay una respuesta incorrecta.</p><button className="equip-hero-button" type="button" onClick={() => { playClick(); setCharacterSelectOpen(true) }}>ELEGIR MI HÉROE <ArrowRight size={16} /></button></div>}</section>
      </>}
    </main>
    <NoniWidget message={noniMessage} subtitles={settings.subtitles} />
    <MiniTest open={miniTestOpen} onComplete={handleMiniTestComplete} />
    <CharacterSelect open={characterSelectOpen} onClose={() => setCharacterSelectOpen(false)} onSelect={chooseHero} suggestedHeroId={suggestedHeroId} />
    <IdentityDialog open={dialogOpen} profile={profile} onClose={() => setDialogOpen(false)} onSave={handleProfileSave} />
  </div>
}
