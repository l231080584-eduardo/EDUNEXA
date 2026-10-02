import { useEffect, useState } from 'react'
import { ArrowUpRight, GraduationCap, MapPin, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import { getApiError, getCompatibleUniversities } from '../lib/api'

function getWebsiteUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export default function ResultsDashboard({ result, report, careers, bonus, onRestart }) {
  const [universities, setUniversities] = useState([])
  const [loading, setLoading] = useState(true)
  const [universityError, setUniversityError] = useState('')

  useEffect(() => {
    let active = true
    getCompatibleUniversities()
      .then((data) => { if (active) setUniversities(Array.isArray(data) ? data : []) })
      .catch((error) => { if (active) setUniversityError(getApiError(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function readReport() {
    if (!('speechSynthesis' in window)) {
      setUniversityError('La lectura por voz no está disponible en este navegador.')
      return
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(report))
  }

  const score = Number(result?.matchScore || 0)
  const percent = Math.round(score * 100)

  return (
    <section className="results-section" aria-labelledby="results-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tu brújula profesional</p>
          <h2 id="results-heading">Un camino empieza aquí.</h2>
          <p className="section-subtitle">Una guía para explorar lo que te interesa. Tu futuro tiene muchas posibilidades.</p>
        </div>
        <button className="quiet-button" type="button" onClick={onRestart}>
          <RotateCcw size={16} aria-hidden="true" /> Repetir test
        </button>
      </div>

      <div className="results-grid">
        <article className="panel score-card">
          <div className="score-ring" style={{ '--score': `${percent}%` }} role="img" aria-label={`Puntaje de coincidencia: ${percent} por ciento`}>
            <div><strong>{percent}<span>%</span></strong><small>coincidencia</small></div>
          </div>
          <div className="score-copy">
            <span className="pill"><Sparkles size={14} aria-hidden="true" /> Tu resultado</span>
            <h3>Un perfil con potencial</h3>
            <p>Tu puntaje combina intereses, materias, estilo de vida y ubicación.</p>
            {bonus && <span className="bonus-badge"><GraduationCap size={15} aria-hidden="true" /> Bono TecNM Iztapalapa 1 aplicado</span>}
          </div>
        </article>

        <article className="panel report-card">
          <div className="report-top">
            <span className="panel-icon"><Sparkles size={18} aria-hidden="true" /></span>
            <div><p className="eyebrow">Una mirada personalizada</p><h3>Tu orientación</h3></div>
            <button className="round-control" type="button" onClick={readReport} aria-label="Escuchar reporte de orientación">
              <Volume2 size={17} aria-hidden="true" />
            </button>
          </div>
          <p className="report-text">{report}</p>
          <div className="career-chips" aria-label="Carreras sugeridas">
            {careers.map((career) => <span key={career}>{career}</span>)}
          </div>
        </article>
      </div>

      <div className="universities-heading">
        <div><p className="eyebrow">Siguientes pasos</p><h3>Universidades para explorar</h3></div>
        <span className="api-label"><span className="status-dot" /> Datos de la API</span>
      </div>
      {loading && <p className="state-message" role="status">Buscando opciones educativas…</p>}
      {universityError && <p className="inline-alert" role="alert">{universityError}</p>}
      {!loading && !universityError && universities.length === 0 && (
        <p className="state-message">Aún no hay universidades disponibles en la API.</p>
      )}
      <div className="universities-grid">
        {universities.slice(0, 6).map((university, index) => {
          const website = getWebsiteUrl(university.sitioWeb)
          const isTecnm = Boolean(university.esTecnmIztapalapa1)
          return (
            <article className="panel university-card" key={university.id ?? `${university.nombre}-${index}`}>
              <div className="university-icon"><GraduationCap size={20} aria-hidden="true" /></div>
              <div className="university-title"><h4>{university.nombre || 'Institución educativa'}</h4><p>{university.tipo || 'Universidad'}</p></div>
              {isTecnm && <span className="mini-bonus">TecNM +10%</span>}
              <div className="university-meta">
                {university.latitud != null && university.longitud != null && (
                  <span><MapPin size={14} aria-hidden="true" /> {Number(university.latitud).toFixed(4)}, {Number(university.longitud).toFixed(4)}</span>
                )}
                {university.matchScorePercentage > 0 && <span className="university-match">{university.matchScorePercentage}% de afinidad</span>}
              </div>
              {website
                ? <a className="university-link" href={website} target="_blank" rel="noreferrer" aria-label={`Visitar sitio web de ${university.nombre || 'la universidad'}`}>
                    Explorar institución <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                : <span className="university-link disabled-link">Sitio web no disponible</span>}
            </article>
          )
        })}
      </div>
      {result?.resultadoId && <p className="result-reference">Evaluación guardada · folio {result.resultadoId}</p>}
    </section>
  )
}
