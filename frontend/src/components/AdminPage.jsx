import { useState } from 'react'
import { Lock, Shield, X } from 'lucide-react'
import { playClick } from '../lib/audio'
import { getAdminEstudiantes, getApiError } from '../lib/api'

const ADMIN_KEY = 'edunexa-admin-key'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [estudiantes, setEstudiantes] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function checkStoredPassword() {
    try {
      const stored = sessionStorage.getItem(ADMIN_KEY)
      if (stored) {
        loadEstudiantes(stored)
      }
    } catch { /* Session storage is best effort. */ }
  }

  async function loadEstudiantes(pwd) {
    setLoading(true)
    setError('')
    try {
      const data = await getAdminEstudiantes(pwd)
      setEstudiantes(Array.isArray(data) ? data : [])
      try { sessionStorage.setItem(ADMIN_KEY, pwd) } catch { /* Session storage is best effort. */ }
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) {
        setError('Contraseña incorrecta')
      } else if (status === 503) {
        setError('El panel no está configurado (falta ADMIN_PASSWORD en el servidor)')
      } else {
        setError(getApiError(err) || 'No se pudo cargar el panel.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    try { sessionStorage.removeItem(ADMIN_KEY) } catch { /* Cleanup is best effort. */ }
    setEstudiantes(null)
    setPassword('')
    setError('')
  }

  if (!estudiantes && !loading && !error) {
    return (
      <div className="auth-page-wrapper">
        <section className="auth-card cyber-dialog" role="main" aria-labelledby="admin-title">
          <div className="dialog-top">
            <span className="dialog-icon"><Shield aria-hidden="true" /></span>
          </div>
          <p className="eyebrow">PANEL DEL PERSONAL</p>
          <h2 id="admin-title"><Lock size={21} /> Acceso restringido</h2>
          <p className="muted-copy">Ingresa la contraseña del personal para ver los registros de estudiantes.</p>
          <form onSubmit={(e) => { e.preventDefault(); loadEstudiantes(password) }}>
            <label htmlFor="admin-password">Contraseña del personal</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="memory-card-error" role="alert">{error}</p>}
            <button className="primary-button full-button" type="submit" disabled={loading}>
              {loading ? 'Conectando…' : 'Entrar'}
            </button>
          </form>
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="auth-page-wrapper">
        <section className="auth-card cyber-dialog">
          <p className="eyebrow">CARGANDO</p>
          <h2>Obteniendo registros...</h2>
        </section>
      </div>
    )
  }

  return (
    <div className="admin-page-wrapper">
      <section className="admin-card cyber-dialog" role="main" aria-labelledby="admin-panel-title">
        <div className="dialog-top">
          <span className="dialog-icon"><Shield aria-hidden="true" /></span>
          <button type="button" className="close-button" aria-label="Cerrar sesión" onClick={handleLogout}>
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="eyebrow">PANEL DEL PERSONAL</p>
        <h2 id="admin-panel-title">Registros de estudiantes</h2>
        <p className="muted-copy">{estudiantes.length} estudiante(s) registrado(s)</p>

        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Carrera recomendada</th>
                <th>Universidad</th>
                <th>Fecha</th>
                <th>Consentimiento</th>
                <th>TecNM</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est, index) => (
                <tr key={index}>
                  <td>{est.nombre || '—'}</td>
                  <td>{est.email || '—'}</td>
                  <td>{est.whatsapp || '—'}</td>
                  <td>{est.carreraRecomendada || 'Sin resultados todavía'}</td>
                  <td>{est.universidadRecomendada || 'Sin resultados todavía'}</td>
                  <td>
                    {est.fechaCreacion
                      ? new Date(est.fechaCreacion).toLocaleDateString('es-MX', {
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td>{est.consentimientoContacto ? 'Sí' : 'No'}</td>
                  <td>{est.interesTecnm ? 'Sí' : 'No'}</td>
                </tr>
              ))}
              {estudiantes.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    No hay estudiantes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
