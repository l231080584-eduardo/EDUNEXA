import { CheckCircle2, Compass, LogIn } from 'lucide-react'
import AccessibilityMenu from './AccessibilityMenu'
import { playClick } from '../lib/audio'

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: id === 'accesibilidad' ? 'center' : 'start' })
  if (id === 'accesibilidad') window.setTimeout(() => document.querySelector('#accesibilidad button')?.click(), 280)
}

export default function Navbar({ profile, onLogin, settings, onSettingsChange, hasResults = false }) {
  return <header className="site-header" id="inicio">
    <a href="#inicio" className="brand" aria-label="EDUNEXA, ir al inicio" onClick={(event) => { event.preventDefault(); scrollToSection('inicio') }}><span className="brand-mark"><Compass size={22} /></span><span>EDU<span>NEXA</span><small>ORIENTACIÓN CON FUTURO</small></span></a>
    <nav className="main-nav" aria-label="Navegación principal">
      <button type="button" onClick={() => scrollToSection(hasResults ? 'resultados' : 'evaluacion')}>{hasResults ? 'Resultados' : 'Tu misión'}</button>
      <button type="button" onClick={() => scrollToSection('como-funciona')}>Cómo funciona</button>
      <button type="button" className="mobile-accessibility" onClick={() => scrollToSection('accesibilidad')}>Accesibilidad</button>
    </nav>
    <div className="header-actions"><div id="accesibilidad"><AccessibilityMenu settings={settings} onChange={onSettingsChange} /></div><button type="button" className={`profile-button ${profile ? 'is-authenticated' : ''}`} onClick={() => { playClick(); onLogin() }}>{profile ? <CheckCircle2 size={17} /> : <LogIn size={17} />}<span className="profile-label">{profile ? 'Ficha guardada' : 'Guardar ficha'}</span></button></div>
  </header>
}
