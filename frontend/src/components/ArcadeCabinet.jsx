import { useCallback, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'
import { playClick } from '../lib/audio'

const DIRECTIONS = [
  { action: 'up', Icon: ArrowUp, label: 'Arriba' },
  { action: 'left', Icon: ArrowLeft, label: 'Izquierda' },
  { action: 'right', Icon: ArrowRight, label: 'Derecha' },
  { action: 'down', Icon: ArrowDown, label: 'Abajo' },
]

/** Synthwave cabinet shell; the game keeps ownership of its WebGL canvas. */
export default function ArcadeCabinet({ children, hero }) {
  const [activeControl, setActiveControl] = useState('')

  const dispatchControl = useCallback((action) => {
    setActiveControl(action)
    window.dispatchEvent(new CustomEvent('edunexa:arcade-control', { detail: action }))
    playClick()
    window.setTimeout(() => setActiveControl((current) => current === action ? '' : current), 120)
  }, [])

  return <div className="arcade-cabinet" style={{ '--cabinet-accent': hero?.color || '#67f3d6' }}>
    <div className="arcade-cabinet-backdrop" aria-hidden="true"><span className="arcade-retro-sun" /></div>
    <div className="arcade-cabinet-body">
      <header className="arcade-marquee">
        <div className="arcade-marquee-title"><span className="arcade-marquee-star">✦</span><div><small>EDUNEXA PRESENTA</small><strong>EDUNEXA <i>ARCADE</i></strong></div><span className="arcade-marquee-star">✦</span></div>
        <div className="arcade-coin-slot"><span>INSERT COIN</span><b /><span>CREDIT <strong>01</strong></span></div>
      </header>

      <div className="arcade-screen-frame">
        <div className="arcade-screen-glass">{children}</div>
      </div>

      <footer className="arcade-control-panel" aria-label="Controles táctiles del arcade">
        <div className="arcade-joystick-area"><span className="arcade-control-caption">DIRECCIÓN</span><div className="arcade-joystick">
          {DIRECTIONS.map(({ action, Icon, label }) => <button key={action} type="button" className={`joystick-direction joystick-${action} ${activeControl === action ? 'is-active' : ''}`} onPointerDown={() => setActiveControl(action)} onClick={() => dispatchControl(action)} aria-label={label}><Icon size={13} /></button>)}
          <span className="joystick-ball" aria-hidden="true" />
        </div></div>
        <div className="arcade-panel-instructions"><span>MOVE</span><i /> <span>AIM</span><i /> <span>FIRE</span></div>
        <div className="arcade-buttons-area"><span className="arcade-control-caption">ACCIÓN</span><div className="arcade-action-buttons">
          {[{ label: 'A', action: 'fire' }, { label: 'B', action: 'reload' }, { label: 'C', action: 'left' }, { label: 'D', action: 'right' }].map(({ label, action }) => <button key={label} type="button" className={`arcade-action-button arcade-button-${label.toLowerCase()} ${activeControl === label ? 'is-active' : ''}`} onPointerDown={() => setActiveControl(label)} onClick={() => dispatchControl(action)} onPointerLeave={() => setActiveControl('')} aria-label={label === 'A' ? 'Disparar' : label === 'B' ? 'Recargar' : `Mover ${label === 'C' ? 'a la izquierda' : 'a la derecha'}`}><span>{label}</span></button>)}
        </div></div>
      </footer>
    </div>
  </div>
}
