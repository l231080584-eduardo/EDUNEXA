import { useCallback, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUp, Swords } from 'lucide-react'
import { playClick } from '../lib/audio'

/** Gabinete arcade que conserva las proporciones del lienzo 2D del juego. */
export default function ArcadeCabinet({ children, hero }) {
  const [activeControl, setActiveControl] = useState('')

  const dispatchControl = useCallback((action, phase = 'tap') => {
    window.dispatchEvent(new CustomEvent('edunexa:arcade-control', { detail: { action, phase } }))
    if (phase === 'down') { setActiveControl(action); playClick() }
    if (phase === 'up') setActiveControl((current) => current === action ? '' : current)
    if (phase === 'tap') {
      setActiveControl(action)
      playClick()
      window.setTimeout(() => setActiveControl((current) => current === action ? '' : current), 120)
    }
  }, [])

  const pressControl = (event, action) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId); dispatchControl(action, 'down') }
  const releaseControl = (action) => dispatchControl(action, 'up')
  const accessibleTap = (event, action) => { if (event.detail === 0) dispatchControl(action, 'tap') }

  return <div className="arcade-cabinet" style={{ '--cabinet-accent': hero?.color || '#67f3d6' }}>
    <div className="arcade-cabinet-body">
      <div className="arcade-screen-frame">
        <div className="arcade-screen-glass">{children}</div>
      </div>

      <footer className="arcade-control-panel arcade-touch-controls" aria-label="Controles táctiles del arcade">
        {[{ action: 'left', label: 'IZQUIERDA', Icon: ArrowLeft }, { action: 'right', label: 'DERECHA', Icon: ArrowRight }, { action: 'up', label: 'SALTAR', Icon: ArrowUp }, { action: 'fire', label: 'ATACAR', Icon: Swords }].map(({ action, label, Icon }) => <button key={action} type="button" className={`arcade-touch-button ${activeControl === action ? 'is-active' : ''}`} onPointerDown={(event) => pressControl(event, action)} onPointerUp={() => releaseControl(action)} onPointerLeave={() => releaseControl(action)} onPointerCancel={() => releaseControl(action)} onClick={(event) => accessibleTap(event, action)} aria-label={label}><Icon size={20}/><span>{label}</span></button>)}
      </footer>
    </div>
  </div>
}
