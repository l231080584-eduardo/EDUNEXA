import PixiCinematicStage from './PixiCinematicStage'

export default function MorosShowcaseCanvas({ onStart }) {
  return <div className="moros-poster moros-stage moros-canvas-stage" aria-label="Vitrina 2.5D interactiva de MOROS">
    <PixiCinematicStage mode="landing" />
    <div className="moros-stage-tags"><span>AMENAZA: MOROS</span><span>DOMINIO ACTIVO</span></div>
    <div className="moros-stage-level">NIVEL JEFE</div>
    <button type="button" className="moros-stage-cta" onClick={onStart}>ENFRENTAR A MOROS <span aria-hidden="true">→</span></button>
  </div>
}
