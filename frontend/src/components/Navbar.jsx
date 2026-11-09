import { CheckCircle2, Compass, LogIn, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AccessibilityMenu from './AccessibilityMenu'
import { playClick } from '../lib/audio'

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: id === 'accesibilidad' ? 'center' : 'start' })
  if (id === 'accesibilidad') window.setTimeout(() => document.querySelector('#accesibilidad button')?.click(), 280)
}

export default function Navbar({ profile, onLogin, onLogout, settings, onSettingsChange, hasResults = false }) {
  const navigate = useNavigate()
  return <header className="site-header" id="inicio">
    <a href="#inicio" className="brand" aria-label="EDUNEXA, ir al inicio" onClick={(event) => { event.preventDefault(); scrollToSection('inicio') }}><span className="brand-mark"><Compass size={22} /></span><span>EDU<span>NEXA</span><small>ORIENTACIÓN CON FUTURO</small></span></a>
    <nav className="main-nav" aria-label="Navegación principal">
      <button type="button" onClick={() => { if (hasResults) navigate('/resultados'); else navigate('/juego') }}>{hasResults ? 'Resultados' : 'Tu misión'}</button>
      <button type="button" onClick={() => { navigate('/'); window.setTimeout(() => scrollToSection('como-funciona'), 100) }}>Cómo funciona</button>
      <button type="button" className="mobile-accessibility" onClick={() => scrollToSection('accesibilidad')}>Accesibilidad</button>
    </nav>
    <div className="header-actions">
      <div id="accesibilidad"><AccessibilityMenu settings={settings} onChange={onSettingsChange} /></div>
      {profile ? (
        <>
          <span className="profile-greeting">Hola, {profile.nombre || profile.nickname || 'Jugador'}</span>
          <button type="button" className="profile-button is-authenticated" onClick={() => { playClick(); onLogout() }}>
            <LogOut size={17} />
            <span className="profile-label">Cerrar sesión</span>
          </button>
        </>
      ) : (
        <button type="button" className="profile-button" onClick={() => { playClick(); navigate('/login') }}>
          <LogIn size={17} />
          <span className="profile-label">Iniciar sesión</span>
        </button>
      )}
    </div>
  </header>
}
