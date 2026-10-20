import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, CreditCard, UserRound, X } from 'lucide-react'
import { playClick } from '../lib/audio'
import { isSupabaseConfigured } from '../lib/db'

function createFolio() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  const bytes = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else bytes.forEach((_value, index) => { bytes[index] = Math.floor(Math.random() * 256) })
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function IdentityDialog({ open, profile, onClose, onSave }) {
  const [nombre, setNombre] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [escuela, setEscuela] = useState('')
  const [interesTecnm, setInteresTecnm] = useState(false)
  const [folio, setFolio] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('register')
  const [authError, setAuthError] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef(null)
  const firstInputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setNombre(profile?.nombre || '')
    setNickname(profile?.nickname || '')
    setEmail(profile?.email || '')
    setTelefono(profile?.telefono || '')
    setEscuela(profile?.escuela || '')
    setInteresTecnm(Boolean(profile?.interesTecnm))
    setFolio(profile?.folio || createFolio())
    setPassword(''); setAuthError(''); setAuthMode('register')
    requestAnimationFrame(() => firstInputRef.current?.focus())
  }, [open, profile])

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialogRef.current) return
      const controls = dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setAuthError(''); setSaving(true)
    const savedProfile = {
      id: profile?.id || globalThis.crypto?.randomUUID?.() || folio,
      nombre: nombre.trim(), nickname: nickname.trim() || nombre.trim().split(/\s+/)[0],
      email: email.trim(), telefono: telefono.trim(), escuela: escuela.trim(), interesTecnm,
      folio: profile?.folio || folio,
    }
    playClick()
    try {
      await onSave(savedProfile, { mode: authMode, password, email: email.trim() })
      onClose()
    } catch (error) {
      setAuthError(error?.message || 'No pudimos guardar tu tarjeta. Revisa tus datos e inténtalo otra vez.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="identity-dialog cyber-dialog" role="dialog" aria-modal="true" aria-labelledby="identity-title" aria-describedby="identity-description">
        <div className="dialog-top">
          <span className="dialog-icon"><UserRound aria-hidden="true" /></span>
          <button type="button" className="close-button" aria-label="Cerrar diálogo" onClick={() => { playClick(); onClose() }}><X aria-hidden="true" /></button>
        </div>
        <p className="eyebrow">PLAYER REGISTRATION · MEMORY CARD</p>
        <h2 id="identity-title"><CreditCard size={21} /> {authMode === 'login' ? 'INSERT ID CARD' : 'Tu tarjeta de jugador'}</h2>
        <p id="identity-description" className="muted-copy">{isSupabaseConfigured ? 'Crea tu cuenta o entra para sincronizar tu récord y tus rutas.' : 'Tu ficha y tu récord se guardan en este dispositivo. Configura Supabase para sincronizar entre dispositivos.'}</p>
        {isSupabaseConfigured && <div className="memory-card-mode"><span>{authMode === 'login' ? 'PLAYER LOGIN' : 'NEW PLAYER'}</span><button type="button" onClick={() => { playClick(); setAuthMode((mode) => mode === 'register' ? 'login' : 'register'); setAuthError('') }}>{authMode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}</button></div>}
        <form onSubmit={handleSubmit}>
          <label htmlFor="user-email">Correo electrónico</label>
          <input ref={authMode === 'login' ? firstInputRef : undefined} id="user-email" type="email" autoComplete="email" maxLength={255} required value={email} onChange={(e) => setEmail(e.target.value)} />
          {isSupabaseConfigured && <><label htmlFor="user-password">Contraseña</label><input ref={authMode === 'register' ? firstInputRef : undefined} id="user-password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></>}
          {authMode === 'register' && <>
            <label htmlFor="user-name">Nombre completo</label>
            <input ref={isSupabaseConfigured ? undefined : firstInputRef} id="user-name" type="text" autoComplete="name" maxLength={255} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <label htmlFor="user-nickname">Nickname <span className="optional-label">(opcional)</span></label>
            <input id="user-nickname" type="text" maxLength={40} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="¿Cómo te llamamos?" />
            <label htmlFor="user-phone">Teléfono / WhatsApp</label>
            <input id="user-phone" type="tel" autoComplete="tel" maxLength={30} required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            <label htmlFor="user-school">Escuela de procedencia (Bachillerato / Prepa)</label>
            <input id="user-school" type="text" autoComplete="organization" maxLength={255} required value={escuela} onChange={(e) => setEscuela(e.target.value)} />
            <label className="admission-interest"><input type="checkbox" checked={interesTecnm} onChange={(e) => { playClick(); setInteresTecnm(e.target.checked) }} /> Me interesa el TecNM Plantel Iztapalapa 1</label>
            <label htmlFor="admission-folio">Folio único</label><input id="admission-folio" className="folio-input" type="text" value={folio} readOnly />
          </>}
          {authError && <p className="memory-card-error" role="alert">{authError}</p>}
          <button className="primary-button full-button" type="submit" disabled={saving}>{saving ? 'Conectando…' : <><CheckCircle2 size={17} aria-hidden="true" /> {authMode === 'login' && isSupabaseConfigured ? 'Continuar partida' : 'Guardar tarjeta de jugador'}</>}</button>
        </form>
      </section>
    </div>
  )
}
