import { useState } from 'react'
import { CheckCircle2, Lock, UserRound, X } from 'lucide-react'
import { playClick } from '../lib/audio'
import { getApiError, loginUser, registerUser } from '../lib/api'

function createFolio() {
  if (globalThis.crypto?.randomUUID) return `EDU-${globalThis.crypto.randomUUID()}`
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    throw new Error('Web Crypto API no está disponible para generar el folio.')
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `EDU-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function AuthPage({ profile, onSave, onClose }) {
  const [mode, setMode] = useState('register')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [password, setPassword] = useState('')
  const [escuela, setEscuela] = useState('')
  const [interesTecnm, setInteresTecnm] = useState(false)
  const [consentimientoContacto, setConsentimientoContacto] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function validate() {
    setError('')
    if (mode === 'register' && nombre.trim().length === 0) {
      return 'El nombre es obligatorio.'
    }
    if (!email.includes('@')) {
      return 'El correo debe contener @.'
    }
    const cleanedPhone = whatsapp.replace(/[\s\-+]/g, '')
    if (mode === 'register' && (cleanedPhone.length < 10 || !/^\d+$/.test(cleanedPhone))) {
      return 'El WhatsApp debe tener al menos 10 dígitos.'
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSaving(true)
    setError('')
    playClick()
    try {
      const cleanedPhone = whatsapp.replace(/[\s\-+]/g, '')
      let response
      if (mode === 'register') {
        response = await registerUser({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          whatsapp: cleanedPhone,
          interesTecnm,
          consentimientoContacto,
        })
      } else {
        response = await loginUser({ email: email.trim(), password })
      }
      const first = (response.nombre || '').trim().split(/\s+/)[0]
      const folio = mode === 'register' ? createFolio() : (profile?.folio || createFolio())
      const usuario = {
        id: response.id,
        nombre: response.nombre,
        nickname: first,
        email: response.email,
        telefono: response.whatsapp || '',
        escuela: escuela.trim() || '',
        interesTecnm: response.interesTecnm || false,
        consentimientoContacto: response.consentimientoContacto || false,
        folio,
      }
      onSave(usuario)
    } catch (err) {
      const message = getApiError(err) || err?.message || 'No se pudo completar la operación.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-page-wrapper">
      <section className="auth-card cyber-dialog" role="main" aria-labelledby="auth-title">
        <div className="dialog-top">
          <span className="dialog-icon"><UserRound aria-hidden="true" /></span>
          {onClose && (
            <button type="button" className="close-button" aria-label="Cerrar" onClick={() => { playClick(); onClose() }}>
              <X aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="eyebrow">ACCESO AL SISTEMA</p>
        <h2 id="auth-title"><Lock size={21} /> {mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
        <p className="muted-copy">
          {mode === 'register'
            ? 'Regístrate para guardar tu progreso y recibir recomendaciones personalizadas.'
            : 'Ingresa con tu cuenta para continuar tu misión.'}
        </p>
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
            onClick={() => { playClick(); setMode('register'); setError('') }}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
            onClick={() => { playClick(); setMode('login'); setError('') }}
          >
            Iniciar sesión
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label htmlFor="auth-name">Nombre completo</label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                maxLength={255}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </>
          )}
          <label htmlFor="auth-email">Correo electrónico</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="auth-password">Contraseña</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
          {mode === 'register' && (
            <>
              <label htmlFor="auth-whatsapp">WhatsApp</label>
              <input
                id="auth-whatsapp"
                type="tel"
                autoComplete="tel"
                maxLength={20}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="10 a 20 dígitos"
                required
              />
              <label htmlFor="auth-school">Escuela de procedencia <span className="optional-label">(opcional)</span></label>
              <input
                id="auth-school"
                type="text"
                autoComplete="organization"
                maxLength={255}
                value={escuela}
                onChange={(e) => setEscuela(e.target.value)}
                placeholder="Bachillerato / Prepa"
              />
              <label className="admission-interest">
                <input
                  type="checkbox"
                  checked={interesTecnm}
                  onChange={(e) => { playClick(); setInteresTecnm(e.target.checked) }}
                />
                Me interesa el TecNM Plantel Iztapalapa 1
              </label>
              <label className="admission-interest">
                <input
                  type="checkbox"
                  checked={consentimientoContacto}
                  onChange={(e) => { playClick(); setConsentimientoContacto(e.target.checked) }}
                />
                Acepto que el TecNM Iztapalapa me contacte con información sobre sus carreras.
              </label>
            </>
          )}
          {error && <p className="memory-card-error" role="alert">{error}</p>}
          <button className="primary-button full-button" type="submit" disabled={saving}>
            {saving ? (
              'Conectando…'
            ) : (
              <>
                <CheckCircle2 size={17} aria-hidden="true" />
                {mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  )
}
