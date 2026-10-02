import { useState } from 'react'
import { Accessibility, Check, ChevronDown, Captions, Contrast, Type } from 'lucide-react'

export default function AccessibilityMenu({ settings, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        className="icon-button"
        aria-label="Abrir opciones de accesibilidad"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <Accessibility aria-hidden="true" />
        <span className="hidden sm:inline">Accesibilidad</span>
        <ChevronDown className="chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="accessibility-menu" role="group" aria-label="Preferencias de accesibilidad">
          <p className="menu-heading">Personaliza tu experiencia</p>
          <div className="font-controls">
            <span><Type size={17} aria-hidden="true" /> Tamaño de texto</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="small-control"
                aria-label="Disminuir tamaño de fuente"
                disabled={settings.fontScale <= 0}
                onClick={() => onChange({ fontScale: Math.max(0, settings.fontScale - 1) })}
              >A−</button>
              <button
                type="button"
                className="small-control"
                aria-label="Aumentar tamaño de fuente"
                disabled={settings.fontScale >= 2}
                onClick={() => onChange({ fontScale: Math.min(2, settings.fontScale + 1) })}
              >A+</button>
            </div>
          </div>
          <button
            type="button"
            className="setting-row"
            aria-pressed={settings.highContrast}
            onClick={() => onChange({ highContrast: !settings.highContrast })}
          >
            <span><Contrast size={17} aria-hidden="true" /> Alto contraste</span>
            {settings.highContrast && <Check size={16} aria-label="Activado" />}
          </button>
          <button
            type="button"
            className="setting-row"
            aria-pressed={settings.subtitles}
            onClick={() => onChange({ subtitles: !settings.subtitles })}
          >
            <span><Captions size={17} aria-hidden="true" /> Subtítulos JARVIS</span>
            {settings.subtitles && <Check size={16} aria-label="Activados" />}
          </button>
          <p className="menu-note">Las respuestas del asistente también se muestran siempre por escrito.</p>
        </div>
      )}
    </div>
  )
}
