import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, LogIn, UserPlus, UserRound, X } from 'lucide-react'
import { getApiError, loginUser, registerUser } from '../lib/api'

export default function IdentityDialog({ open, profile, onClose, onSave }) {
  const [mode, setMode] = useState('register')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dialogRef = useRef(null)
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMode(profile ? 'login' : 'register')
      setNombre('')
      setEmail(profile?.email || '')
      setPassword('')
      setError('')
      requestAnimationFrame(() => firstInputRef.current?.focus())
    }
  }, [open, profile?.email])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onClose()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const controls = dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, loading, onClose])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = mode === 'register'
        ? await registerUser({ nombre: nombre.trim(), email: email.trim(), password })
        : await loginUser({ email: email.trim(), password })
      onSave(user)
      onClose()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
    setPassword('')
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section
        ref={dialogRef}
        className="identity-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="identity-title"
        aria-describedby="identity-description"
      >
        <div className="dialog-top">
          <span className="dialog-icon"><UserRound aria-hidden="true" /></span>
          <button type="button" className="close-button" aria-label="Cerrar diálogo" onClick={onClose} disabled={loading}>
            <X aria-hidden="true" />
          </button>
        </div>
        <p className="eyebrow">Tu espacio EDUNEXA</p>
        <h2 id="identity-title">{mode === 'register' ? 'Crea tu cuenta.' : 'Qué gusto verte.'}</h2>
        <p id="identity-description" className="muted-copy">
          {mode === 'register'
            ? 'Regístrate para guardar tu evaluación y explorar tu orientación vocacional.'
            : 'Inicia sesión para continuar con tu orientación vocacional.'}
        </p>
        <div className="backend-notice" role="note">
          <AlertCircle size={18} aria-label="Información" />
          <p>Tu contraseña se envía al backend para validación y nunca se guarda en este navegador.</p>
        </div>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label htmlFor="user-name">Nombre</label>
              <input
                ref={firstInputRef}
                id="user-name"
                type="text"
                autoComplete="name"
                maxLength={255}
                required
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </>
          )}
          <label htmlFor="user-email">Correo electrónico</label>
          <input
            ref={mode === 'login' ? firstInputRef : undefined}
            id="user-email"
            type="email"
            autoComplete="email"
            maxLength={255}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
          />
          <label htmlFor="user-password">Contraseña</label>
          <input
            id="user-password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={mode === 'register' ? 8 : undefined}
            maxLength={72}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'identity-error' : mode === 'register' ? 'password-help' : undefined}
          />
          {mode === 'register' && <p className="field-hint" id="password-help">Usa al menos 8 caracteres.</p>}
          {error && <p className="field-error" id="identity-error" role="alert">{error}</p>}
          <button className="primary-button full-button" type="submit" disabled={loading}>
            {loading
              ? <><span className="spinner" /> {mode === 'register' ? 'Creando cuenta…' : 'Iniciando sesión…'}</>
              : mode === 'register'
                ? <><UserPlus size={17} aria-hidden="true" /> Crear cuenta</>
                : <><CheckCircle2 size={17} aria-hidden="true" /> Iniciar sesión</>}
          </button>
          <button className="text-button" type="button" disabled={loading} onClick={() => changeMode(mode === 'register' ? 'login' : 'register')}>
            {mode === 'register' ? <><LogIn size={15} aria-hidden="true" /> Ya tengo una cuenta</> : <><UserPlus size={15} aria-hidden="true" /> Crear una cuenta nueva</>}
          </button>
        </form>
      </section>
    </div>
  )
}
