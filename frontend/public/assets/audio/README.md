# Audio del arcade de EDUNEXA

## Archivos usados por el juego

- `musica-exploracion.ogg`: selección y exploración, «Icy Adventure (loopable)».
- `musica-batalla.ogg`: intro, combate y jefe, «Retro Boss fight (loopable)».
- `disparo-cc0.wav`: arma láser.
- `explosion-cc0.wav`: impacto explosivo.

Las pistas musicales son de TheFrenchDodo y se publicaron en OpenGameArt bajo CC0: https://opengameart.org/content/retro-tunes
Los efectos son CC0: https://opengameart.org/content/lasershootingsx y https://opengameart.org/content/explosion-0

El código mantiene tonos Web Audio de respaldo si el navegador no puede cargar un recurso. Algunos navegadores bloquean el audio hasta recibir una interacción del usuario; pulsa el botón de audio o inicia la partida para habilitarlo.

## Recursos de voz opcionales de la intro

La cinemática admite estos audios en MP3 cuando se agreguen:

- `nino-alerta.mp3`
- `moros-amenaza.mp3`
- `nino-contraataque.mp3`

Si faltan, la intro continúa sin voz y reporta la ruta en la consola.
