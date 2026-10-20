import { useEffect, useMemo, useState } from 'react'
import { Award, CheckCircle, ExternalLink, GraduationCap, MapPin, Navigation, RotateCcw, Sparkles, LocateFixed } from 'lucide-react'
import { getCompatibleUniversities } from '../lib/api'
import { GEM_CATEGORIES } from '../data/careers'
import offlineUniversities from '../data/universitiesFallback.json'
import { playClick } from '../lib/audio'
import { HERO_CLASSES } from './CharacterSelect'

const TECNM_LOCATION = offlineUniversities.find((university) => university.esTecnmIztapalapa1)
const AREA_LABELS = { law: 'Derecho y ciencias sociales', social: 'Salud', tech: 'Tecnología', engineering: 'Ingenierías', design: 'Artes y diseño', business: 'Negocios', humanities: 'Humanidades' }
const NATIONAL_MULTI_AREA = [
  { pattern: /universidad nacional autonoma de mexico|\bunam\b/, categories: ['law', 'social', 'tech', 'engineering', 'design', 'business', 'humanities'] },
  { pattern: /instituto politecnico nacional|\bipn\b/, categories: ['social', 'tech', 'engineering', 'design', 'business', 'humanities'] },
  { pattern: /universidad autonoma metropolitana|\buam\b/, categories: ['law', 'social', 'tech', 'engineering', 'design', 'business', 'humanities'] },
  { pattern: /universidad autonoma del estado de mexico|\buaemex\b|universidad de guadalajara|\bbuap\b|universidad autonoma de nuevo leon/, categories: ['law', 'social', 'tech', 'engineering', 'design', 'business', 'humanities'] },
]
function hasCoordinates(place) {
  return place?.latitud !== null && place?.latitud !== undefined && place?.longitud !== null && place?.longitud !== undefined && Number.isFinite(Number(place.latitud)) && Number.isFinite(Number(place.longitud)) && Math.abs(Number(place.latitud)) <= 90 && Math.abs(Number(place.longitud)) <= 180
}

function distanceKm(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) return Infinity
  const radians = (degrees) => degrees * Math.PI / 180
  const dLat = radians(Number(destination.latitud) - Number(origin.latitud))
  const dLng = radians(Number(destination.longitud) - Number(origin.longitud))
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(Number(origin.latitud))) * Math.cos(radians(Number(destination.latitud))) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX').replace(/[^a-z0-9]+/g, ' ').trim() }

function universityOffersSuggestedCareer(university, careers) {
  if (university.localFallback && careers.length === 0) return true
  const programs = Array.isArray(university.carreras) ? university.carreras : []
  const programMatch = programs.some((program) => careers.some((career) => {
    const normalizedProgram = normalizeText(program); const normalizedCareer = normalizeText(career.name)
    if (normalizedCareer && (normalizedProgram.includes(normalizedCareer) || normalizedCareer.includes(normalizedProgram))) return true
    const tokens = normalizedCareer.split(' ').filter((token) => token.length > 4 && !['ingenieria', 'licenciatura', 'carrera', 'tecnologias'].includes(token))
    return tokens.length > 0 && tokens.filter((token) => normalizedProgram.includes(token)).length >= Math.min(2, tokens.length)
  }))
  if (programMatch) return true
  const identity = normalizeText(`${university.nombre || university.name} ${university.tipo || ''}`)
  const broadCategories = university.categoriasCompatibles || NATIONAL_MULTI_AREA.find((entry) => entry.pattern.test(identity))?.categories || []
  return careers.some((career) => broadCategories.includes(career.category))
}

function matchingPrograms(university, careers) {
  const exactPrograms = (university.carreras || []).filter((program) => universityOffersSuggestedCareer({ carreras: [program] }, careers))
  if (exactPrograms.length) return { labels: exactPrograms.slice(0, 3), broad: false }
  const identity = normalizeText(`${university.nombre || university.name} ${university.tipo || ''}`)
  const categories = university.categoriasCompatibles || NATIONAL_MULTI_AREA.find((entry) => entry.pattern.test(identity))?.categories || []
  const compatible = [...new Set(careers.map((career) => career.category).filter((category) => categories.includes(category)))].map((category) => AREA_LABELS[category])
  return { labels: compatible.slice(0, 3), broad: compatible.length > 0 }
}

function mergeUniversityCatalog(primary, fallback = offlineUniversities) {
  const merged = new Map()
  for (const item of [...(Array.isArray(primary) ? primary : []), ...fallback.map((university) => ({ ...university, localFallback: true }))]) {
    if (!item || typeof item !== 'object') continue
    const name = normalizeText(item.nombre || item.name || item.id)
    if (!name) continue
    const current = merged.get(name)
    if (!current) { merged.set(name, item); continue }
    const combined = hasCoordinates(current) ? { ...item, ...current } : { ...current, ...item }
    combined.categoriasCompatibles = current.categoriasCompatibles || item.categoriasCompatibles
    if (!Array.isArray(current.carreras) || current.carreras.length === 0) combined.carreras = item.carreras || []
    combined.localFallback = !hasCoordinates(current)
    merged.set(name, combined)
  }
  return [...merged.values()]
}

function routeEmbed(place, origin) {
  const originQuery = hasCoordinates(origin) ? `${origin.latitud},${origin.longitud}` : 'My+Location'
  return `https://maps.google.com/maps?saddr=${originQuery}&daddr=${place.latitud},${place.longitud}&z=13&output=embed`
}

function routeEstimate(place, origin) {
  if (!hasCoordinates(origin)) return null
  const km = distanceKm(origin, place) * 1.25
  return { distance: `~${km.toFixed(1)} km`, time: `~${Math.max(1, Math.round(km / 32 * 60))} min` }
}

const OLA_BENCHMARKS = { law: ['$19,494', 'promedio profesional nacional'], tech: ['$21,697', 'área de TIC'], engineering: ['$21,165', 'Ingeniería, manufactura y construcción'], design: ['$26,941', 'carrera de Diseño'], business: ['$19,494', 'promedio profesional nacional'], social: ['$19,494', 'promedio profesional nacional'], humanities: ['$19,494', 'promedio profesional nacional'] }

function salaryReference(career) {
  const normalizedName = normalizeText(career.name)
  if (/finanzas|banca|seguros/.test(normalizedName)) return ['$29,216', 'Finanzas, banca y seguros']
  if (/medicina/.test(normalizedName)) return ['$25,776', 'carrera de Medicina']
  return OLA_BENCHMARKS[career.category] || ['$19,494', 'promedio profesional nacional']
}

function CareerCard({ career, index }) {
  const benchmark = salaryReference(career)
  const skills = Array.isArray(career.skills) ? career.skills : []
  const tools = Array.isArray(career.tools) ? career.tools : []
  const roles = Array.isArray(career.roles) ? career.roles : []
  const sectors = Array.isArray(career.sectors) ? career.sectors : []
  return (
    <article className="career-detail-card">
      <div className="career-detail-heading"><span className="career-rank">0{index + 1}</span><div><p className="eyebrow">{GEM_CATEGORIES[career.category]?.label} · Afinidad {career.matchScore}%</p><h4>{career.name}</h4></div></div>
      <div className="career-detail-grid">
        <section><h5>🎓 Perfil de egreso</h5><p>{career.profile || 'Explorarás herramientas y conocimientos propios del área para resolver retos reales.'}</p><strong>Habilidades y herramientas</strong><ul>{skills.map((skill) => <li key={skill}>{skill}</li>)}{tools.map((tool) => <li key={tool}>{tool}</li>)}</ul></section>
        <section><h5>💼 Campo laboral</h5><strong>Puestos que podrías explorar</strong><ul>{roles.map((role) => <li key={role}>{role}</li>)}</ul><strong>Sectores</strong><p>{sectors.join(' · ') || 'Empresas, organizaciones e instituciones del área'}</p><strong>Referencia de ingreso mensual</strong><p>{formatSalary(career.salaryMonthly) || `${benchmark[0]} · ${benchmark[1]}`}</p><small className="salary-source">Ingreso profesional promedio publicado por OLA/ENOE (T2 2026); referencia por carrera o área, no salario específico de cada puesto ni garantía individual. <a href="https://www.observatoriolaboral.gob.mx/static/estudios-publicaciones/Tendencias_empleo.html" target="_blank" rel="noreferrer">Consultar fuente</a>.</small></section>
      </div>
    </article>
  )
}

function formatSalary(value) {
  const firstAmount = String(value ?? '').match(/\d[\d,.]*/)?.[0]?.replace(/,/g, '')
  const amount = Number(firstAmount)
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toLocaleString('es-MX')} MXN/mes · estimación del catálogo` : ''
}

export default function ResultsDashboard({ result, report, careers, bonus, profile, metrics, savedRecord, onRecordUpdate, onRestart, onNoniUpdate }) {
  const safeCareers = useMemo(() => Array.isArray(careers) ? careers.filter((career) => career && typeof career === 'object') : [], [careers])
  const safeMetrics = metrics && typeof metrics === 'object' ? metrics : {}
  const [universities, setUniversities] = useState(() => mergeUniversityCatalog([]))
  const [selectedPlace, setSelectedPlace] = useState(() => savedRecord?.selectedUniversity || null)
  const [universityQuery, setUniversityQuery] = useState('')
  const [studentLocation, setStudentLocation] = useState(() => savedRecord?.studentLocation || null)
  const [locationMessage, setLocationMessage] = useState('')
  const [locating, setLocating] = useState(false)
  useEffect(() => {
    getCompatibleUniversities().then((data) => {
      if (!Array.isArray(data)) return
      let cached = []
      try { cached = JSON.parse(localStorage.getItem('edunexa-universities-cache') || '[]') } catch { /* Ignore malformed optional cache. */ }
      const catalog = data.length ? data : Array.isArray(cached) ? cached : []
      setUniversities(mergeUniversityCatalog(catalog))
      if (data.length) try { localStorage.setItem('edunexa-universities-cache', JSON.stringify(data)) } catch { /* Offline directory cache is optional. */ }
    }).catch(() => {
      try {
        const cached = JSON.parse(localStorage.getItem('edunexa-universities-cache') || '[]')
        if (Array.isArray(cached)) setUniversities(mergeUniversityCatalog(cached))
      } catch { /* The dashboard remains usable without the directory service. */ }
    })
  }, [])
  useEffect(() => {
    if (!navigator.geolocation) { setLocationMessage('Este navegador no ofrece geolocalización.'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setStudentLocation({ latitud: coords.latitude, longitud: coords.longitude })
      if (!savedRecord?.selectedUniversity) setSelectedPlace(null)
      setLocationMessage('Ubicación lista: sedes ordenadas por cercanía.')
      setLocating(false)
    }, () => {
      setLocationMessage('No pudimos acceder a tu ubicación. Las sedes siguen ordenadas por compatibilidad; puedes activar el GPS cuando quieras.')
      setLocating(false)
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
  }, [])

  const interestedTecnm = Boolean(bonus || profile?.interesTecnm)
  const catalog = useMemo(() => {
    const eligible = universities.filter((university) => universityOffersSuggestedCareer(university, safeCareers))
    const tecCandidate = eligible.find((university) => university.esTecnmIztapalapa1 || normalizeText(university.nombre || university.name).includes('tecnm plantel iztapalapa 1'))
      || (universityOffersSuggestedCareer(TECNM_LOCATION, safeCareers) ? TECNM_LOCATION : null)
    const others = eligible.filter((university) => university !== tecCandidate && !university.esTecnmIztapalapa1 && !normalizeText(university.nombre || university.name).includes('tecnm plantel iztapalapa 1'))
    const closestOtherKm = studentLocation && others.length ? Math.min(...others.map((university) => distanceKm(studentLocation, university))) : Infinity
    if (interestedTecnm && tecCandidate) return [...others, tecCandidate]
    if (studentLocation && tecCandidate && distanceKm(studentLocation, tecCandidate) <= closestOtherKm) return [...others, tecCandidate]
    return others
  }, [universities, safeCareers, interestedTecnm, studentLocation])
  const referenceLocation = studentLocation
  const nearestUniversities = useMemo(() => catalog.map((university) => ({ ...university, distanciaKm: studentLocation ? distanceKm(studentLocation, university) : Infinity }))
    .filter((university) => hasCoordinates(university))
    .sort((a, b) => (studentLocation ? a.distanciaKm - b.distanciaKm : 0) || (b.matchScorePercentage || 0) - (a.matchScorePercentage || 0)), [catalog, studentLocation])
  const query = universityQuery.trim().toLocaleLowerCase('es-MX')
  const filteredUniversities = useMemo(() => nearestUniversities.filter((university) => !query || [university.nombre, university.name, university.tipo, university.direccion, ...(university.carreras || [])].some((field) => normalizeText(field).includes(normalizeText(query)))), [nearestUniversities, query])
  const savedPlaceId = savedRecord?.selectedUniversity?.id || normalizeText(savedRecord?.selectedUniversity?.nombre || savedRecord?.selectedUniversity?.name)
  const savedLatitude = savedRecord?.studentLocation?.latitud
  const savedLongitude = savedRecord?.studentLocation?.longitud
  useEffect(() => {
    if (savedPlaceId && (selectedPlace?.id || normalizeText(selectedPlace?.nombre || selectedPlace?.name)) !== savedPlaceId) setSelectedPlace(savedRecord.selectedUniversity)
    if (Number.isFinite(Number(savedLatitude)) && Number.isFinite(Number(savedLongitude))) setStudentLocation((current) => current || { latitud: Number(savedLatitude), longitud: Number(savedLongitude) })
  }, [savedPlaceId, savedLatitude, savedLongitude])
  useEffect(() => {
    if (!selectedPlace && filteredUniversities.length) setSelectedPlace(filteredUniversities[0])
  }, [selectedPlace, filteredUniversities])

  const recommendedUniversities = useMemo(() => nearestUniversities.slice(0, 3).map((university) => ({
    id: university.id || normalizeText(university.nombre || university.name),
    nombre: university.nombre || university.name,
    tipo: university.tipo || 'Institución educativa',
    direccion: university.direccion || '',
    latitud: Number(university.latitud),
    longitud: Number(university.longitud),
    sitioWeb: university.sitioWeb || '',
    esTecnmIztapalapa1: Boolean(university.esTecnmIztapalapa1),
  })), [nearestUniversities])

  useEffect(() => {
    if (!onRecordUpdate || (!studentLocation && !selectedPlace && !recommendedUniversities.length)) return
    onRecordUpdate({
      recommendedUniversities,
      selectedUniversity: selectedPlace ? { id: selectedPlace.id || normalizeText(selectedPlace.nombre || selectedPlace.name), nombre: selectedPlace.nombre || selectedPlace.name, tipo: selectedPlace.tipo || 'Institución educativa', direccion: selectedPlace.direccion || '', latitud: Number(selectedPlace.latitud), longitud: Number(selectedPlace.longitud), sitioWeb: selectedPlace.sitioWeb || '', esTecnmIztapalapa1: Boolean(selectedPlace.esTecnmIztapalapa1) } : null,
      studentLocation,
    })
  }, [onRecordUpdate, recommendedUniversities, selectedPlace, studentLocation])

  const percent = Math.round((Number(result?.matchScore) || 0) * 100)
  const heroLabel = HERO_CLASSES.find((hero) => hero.id === result?.hero)?.name || result?.hero || 'Piloto EDUNEXA'
  const badges = ['🏅 Pionero Vocacional', ...(Number(safeMetrics.materias) >= 0.3 ? ['⚡ Mente Tecnológica'] : []), ...(bonus || profile?.interesTecnm ? ['🎯 Aspirante Prioritario TecNM'] : [])]
  const navigationOrigin = studentLocation ? `&origin=${studentLocation.latitud},${studentLocation.longitud}` : ''
  const directionsUrl = selectedPlace ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitud},${selectedPlace.longitud}${navigationOrigin}&travelmode=driving` : 'https://www.google.com/maps/search/universidades+cerca+de+mi'
  const route = selectedPlace ? routeEstimate(selectedPlace, referenceLocation) : null
  const nearestKm = nearestUniversities[0]?.distanciaKm
  const proximityMetric = studentLocation && Number.isFinite(nearestKm) ? Math.max(0, 1 - nearestKm / 50) : safeMetrics.geolocalizacion
  const metricRows = [['Intereses', safeMetrics.intereses], ['Materias', safeMetrics.materias], ['Estilo de vida', safeMetrics.estiloVida], ['Cercanía', proximityMetric]]

  function locateStudent() {
    if (!navigator.geolocation) { setLocationMessage('Este navegador no ofrece geolocalización.'); return }
    setLocating(true); setLocationMessage('Obteniendo tu ubicación…')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setStudentLocation({ latitud: coords.latitude, longitud: coords.longitude })
      setSelectedPlace(null)
      setLocationMessage('Ubicación lista: ordenamos las sedes por cercanía.')
      setLocating(false)
    }, () => { setLocationMessage('No pudimos leer tu ubicación. Las sedes se muestran por compatibilidad; puedes activar el GPS cuando quieras.'); setLocating(false) }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 })
  }

  return (
    <section className="results-section" aria-labelledby="results-title">
      <div className="section-heading"><div><p className="eyebrow">¡Evaluación Arcade completada!</p><h2 id="results-title">Tu Brújula Vocacional</h2></div><button type="button" className="quiet-button" onClick={() => { playClick(); onRestart() }}><RotateCcw size={16} /> Repetir</button></div>

      {profile && <article className="applicant-banner"><div className="applicant-banner-heading"><span className="applicant-sparkle"><GraduationCap size={18} /></span><div><p className="eyebrow">Ficha de aspirante</p><h3>{profile.nombre}{profile.nickname ? ` · ${profile.nickname}` : ''}</h3></div></div><dl className="applicant-details"><div><dt>Correo</dt><dd>{profile.email || '—'}</dd></div><div><dt>WhatsApp</dt><dd>{profile.telefono || '—'}</dd></div><div><dt>Escuela de procedencia</dt><dd>{profile.escuela || '—'}</dd></div><div><dt>Folio</dt><dd>{profile.folio || '—'}</dd></div><div><dt>Interés TecNM Iztapalapa 1</dt><dd>{profile.interesTecnm ? 'Sí, me interesa' : studentLocation && selectedPlace?.esTecnmIztapalapa1 ? 'Incluido por cercanía' : 'Aún por explorar'}</dd></div></dl></article>}

      <div className="arcade-badges"><p className="eyebrow">Insignias Arcade desbloqueadas</p><div className="badge-list">{badges.map((badge) => <span className="arcade-badge" key={badge}>{badge}</span>)}</div></div>

      <div className="results-grid"><article className="panel score-card"><div className="score-ring" style={{ '--score': `${percent}%` }}><div><strong>{percent}<span>%</span></strong><small>afinidad</small></div></div><div className="score-copy"><span className="pill"><Award size={13} /> TU PUNTO DE PARTIDA</span><h3>Tu récord de partida</h3><p>Clase: {heroLabel} · <strong>{Number(result?.score || savedRecord?.finalScore || 0).toLocaleString('es-MX')} puntos</strong></p><p>Este indicador combina tu afinidad y tus decisiones en los portales. No define ni limita tu futuro.</p>{bonus && <span className="bonus-badge"><Sparkles size={12} /> Interés TecNM registrado</span>}<p className="latest-answer">{result?.xp || 0} XP · {Object.values(result?.gemCounts || {}).reduce((sum, count) => sum + count, 0)} decisiones vocacionales · Folio {profile?.folio || result?.resultadoId || 'local'}</p></div></article>
        <article className="panel report-card"><div className="report-top"><span className="panel-icon"><Sparkles size={18} /></span><div><p className="eyebrow">Tu copiloto vocacional</p><h3>NONI IA</h3></div></div><p className="report-text">{report || 'Tus decisiones forman un mapa inicial de intereses. Puedes explorarlo y cambiar de rumbo cuando quieras.'}</p><div className="career-chips">{safeCareers.map((career, index) => <span key={career.name || index}>{career.name || 'Carrera por explorar'}</span>)}</div></article></div>

      <article className="panel metrics-panel"><div><p className="eyebrow">Radar de desempeño</p><h3>Tus portales trazan el perfil</h3></div><div className="metrics-list">{metricRows.map(([label, value]) => <div className="metric-item" key={label}><span>{label}</span><div className="metric-track"><span style={{ width: `${Math.round(Math.max(0, Math.min(1, value || 0)) * 100)}%` }} /></div><strong>{Math.round(Math.max(0, Math.min(1, value || 0)) * 100)}%</strong></div>)}</div></article>

      <section className="career-recommendations"><div className="universities-heading"><div><p className="eyebrow">Tu combinación de habilidades</p><h3>Carreras sugeridas según tu partida</h3></div><span className="api-label">{safeCareers.length} opciones de carrera</span></div>{safeCareers.length ? <div className="career-detail-list">{safeCareers.map((career, index) => <CareerCard key={career.name || index} career={career} index={index} />)}</div> : <p className="state-message">No hubo suficientes recolecciones para formar una recomendación. Puedes repetir la misión para descubrir más rutas.</p>}</section>

      <div className="universities-heading"><div><p className="eyebrow">Sedes compatibles más cercanas</p><h3>Instituciones para conocer</h3></div><span className="api-label"><span className="status-dot" /> {filteredUniversities.length ? `${Math.min(5, filteredUniversities.length)} de hasta 5 sedes` : 'Sin coincidencias de programas'}</span></div>
      <div className="university-tools"><label className="university-search"><MapPin size={16} /><span className="sr-only">Buscar institución por nombre, carrera o dirección</span><input type="search" value={universityQuery} onChange={(event) => setUniversityQuery(event.target.value)} placeholder="Buscar por institución, carrera o dirección…" /></label><button type="button" className="locate-button" onClick={locateStudent} disabled={locating}><LocateFixed size={15} />{locating ? 'Localizando…' : studentLocation ? 'Actualizar mi ubicación' : 'Ordenar desde mi GPS'}</button></div>
      {locationMessage && <p className="location-status" aria-live="polite">{locationMessage}</p>}
      <div className="universities-grid">{filteredUniversities.slice(0, 5).map((university) => { const offered = matchingPrograms(university, safeCareers); return <article className="panel university-card" key={university.id || university.nombre}><span className="university-icon"><GraduationCap size={17} /></span>{university.esTecnmIztapalapa1 && <span className="mini-bonus">TecNM</span>}<div className="university-title"><h4>{university.nombre || university.name}</h4><p>{university.tipo || 'Institución educativa'} · {studentLocation ? `~${university.distanciaKm.toFixed(1)} km desde tu GPS` : 'Distancia disponible al activar GPS'}</p></div><p className="university-career-match">{offered.broad ? 'Áreas afines para explorar: ' : 'Carreras relacionadas: '}{offered.labels.join(' · ')}</p>{(offered.broad || university.localFallback) && <small className="catalog-note">{university.localFallback ? 'Sede de referencia offline; confirma campus y oferta vigente.' : 'Confirma la oferta vigente en el campus elegido.'}</small>}<div className="university-actions"><button className="map-select-button" type="button" onClick={() => { playClick(); setSelectedPlace(university); onNoniUpdate?.({ text: `Encontré ${university.nombre || university.name}. En el mapa puedes revisar cómo llegar desde tu ubicación.`, id: Date.now() }) }}><MapPin size={13} /> Ver en mapa</button>{university.sitioWeb && <a className="university-link" href={university.sitioWeb} target="_blank" rel="noreferrer">Conocer institución <ExternalLink size={12} /></a>}</div></article> })}</div>
      {filteredUniversities.length === 0 && <p className="state-message">No hay sedes que coincidan con esta búsqueda. Borra el filtro para volver a ver las instituciones compatibles.</p>}

      <article className="panel location-panel" aria-labelledby="map-heading"><div className="location-heading"><div><p className="eyebrow">Ruta GPS recomendada</p><h3 id="map-heading">{selectedPlace?.nombre || selectedPlace?.name || 'Selecciona una institución compatible'}</h3><p className="location-address">{selectedPlace?.direccion || (studentLocation ? 'Origen: tu ubicación actual' : 'Permite la ubicación para ordenar y calcular desde tu punto de partida.')}</p></div>{selectedPlace && <a className="maps-directions-button" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation size={15} /> Iniciar Navegación GPS / Cómo llegar</a>}</div>
        {selectedPlace && <>{route && <div className="route-estimate"><span><strong>Tiempo estimado</strong>{route.time}</span><span><strong>Distancia aproximada</strong>{route.distance}</span><span><strong>Origen</strong>Tu ubicación GPS</span><small>Estimación geográfica aproximada; Google Maps calcula la ruta vial y el tráfico al iniciar navegación.</small></div>}{!route && <p className="location-status">Activa el GPS para calcular distancia y tiempo desde tu ubicación real. El mapa muestra el destino seleccionado.</p>}<iframe className="location-map" title={`Ruta a ${selectedPlace.nombre || selectedPlace.name}`} src={routeEmbed(selectedPlace, studentLocation)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></>}
        <p className="result-reference"><CheckCircle size={13} /> Folio de evaluación: {result?.resultadoId || 'EDUNEXA'}</p></article>
    </section>
  )
}
