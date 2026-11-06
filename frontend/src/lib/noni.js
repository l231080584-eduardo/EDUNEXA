/** NONI narrative engine: variant lines, memory, and streak tracking. */

import { random } from './random'

const NONI_LINES = {
  start: [
    '¡Hola {nickname}! Soy NONI, tu copiloto. Apunta a las señales de neón y descubre qué te mueve.',
    '¡Listo, {nickname}! Yo soy NONI. Dispara a lo que te encante y evita lo que no.',
    '¡Bienvenido, {nickname}! Soy NONI. Esta misión te va a ayudar a encontrar tu camino.',
  ],
  wave2: [
    '¡Buen ritmo, {nickname}! El mundo cambia de color: explora nuevos talentos y mantén la puntería.',
    '¡Sigue así, {nickname}! Aparecen nuevas pasiones. ¡No dejes que las rutinas te toquen!',
    '¡Fase dos, {nickname}! Más retos, más descubrimientos. ¡Tú puedes!',
  ],
  wave3: [
    '¡Última vuelta, {nickname}! Sigue tu curiosidad: cada acierto ayuda a dibujar tu mapa vocacional.',
    '¡Última ronda, {nickname}! Dalo todo: cada pasión cuenta para tu perfil.',
    '¡Última fase, {nickname}! Concentración máxima: tu mapa vocacional se está armando.',
  ],
  bossAppear: [
    '¡Alerta, {nickname}! Se acerca el jefe final. Tu aventura culmina con este reto.',
    '¡Cuidado, {nickname}! El jefe aparece. ¡Es hora de demostrar lo que vales!',
    '¡Atención, {nickname}! El gran jefe está aquí. ¡Tú puedes derribarlo!',
  ],
  bossHit: [
    '¡Buen impacto! El jefe está perdiendo fuerza. Mantén la mira, {nickname}.',
    '¡Le diste, {nickname}! El jefe tiembla. ¡Sigue disparando!',
    '¡Excelente tiro, {nickname}! El jefe se debilita. ¡Casi lo logras!',
  ],
  bossDefeated: [
    '¡Jefe final superado! Ya no bloquea tu camino, {nickname}. ¡Increíble!',
    '¡Lo lograste, {nickname}! El jefe cayó. ¡Tu futuro está más claro!',
    '¡Victoria, {nickname}! Derribaste al jefe. ¡Nada te detiene ahora!',
  ],
  passionHit: [
    '¡Combo de pasiones! Se suma a tu mapa, {nickname}. Vas formando una misión muy tuya.',
    '¡Genial, {nickname}! Otra pasión descubierta. ¡Tu perfil brilla más!',
    '¡Muy bien, {nickname}! Esa pasión encaja perfecto en tu perfil.',
  ],
  zombieHit: [
    '¡Reflejos de primera! Esa rutina ya no decide tu futuro, {nickname}.',
    '¡Bien hecho, {nickname}! Eliminaste una rutina. ¡Sigue buscando lo que te prende!',
    '¡Zombie despejado, {nickname}! Menos rutina, más libertad para ti.',
  ],
  damage: [
    '¡Ojo, {nickname}! Te alcanzó una rutina. Toma aire y sigue con cuidado.',
    '¡Cuidado, {nickname}! Recibiste un golpe. ¡Recupérate y sigue adelante!',
    '¡Ups, {nickname}! Una rutina te tocó. ¡No te rindas, sigue jugando!',
  ],
  lowLives: [
    '¡Última vida, {nickname}! Concéntrate al máximo. ¡Tú puedes terminar esto!',
    '¡Cuidado, {nickname}! Solo te queda una vida. ¡Dale con todo!',
    '¡Última oportunidad, {nickname}! Mantén la calma y apunta bien.',
  ],
  reload: [
    '¡Cargador listo, {nickname}! Seguimos adelante.',
    '¡Recarga completa, {nickname}! A seguir descubriendo pasiones.',
    '¡Listo para seguir, {nickname}! ¡No pares ahora!',
  ],
  streak: [
    '¡Racha de tres, {nickname}! ¡Estás en fuego, sigue así!',
    '¡Tres pasiones seguidas, {nickname}! ¡Eso es puntería y enfoque!',
    '¡Increíble racha, {nickname}! Tres seguidas sin daño. ¡Eres imparable!',
  ],
  gameComplete: [
    '¡Misión completa, {nickname}! Despejaste el camino y encontraste nuevas posibilidades. Aquí está tu mapa vocacional.',
    '¡Terminaste, {nickname}! Tu mapa vocacional está listo. ¡Explóralo con confianza!',
    '¡Fin de la misión, {nickname}! Descubriste pasiones y superaste retos. ¡Tu futuro te espera!',
  ],
}

function fillTemplate(text, nickname) {
  return text.replace(/\{nickname\}/g, nickname || 'piloto')
}

// Minimal memory: stores last line index per event, nickname, hero, top categories
const memory = {
  lastLine: {}, // event -> last index used
  nickname: '',
  hero: '',
  topCategories: [],
}

export function getNoniMemory() {
  return { ...memory }
}

export function rememberNoniContext(context) {
  if (context?.nickname) memory.nickname = context.nickname
  if (context?.hero) memory.hero = context.hero
  if (context?.topCategories) memory.topCategories = context.topCategories
}

export function pickNoniLine(event, context) {
  const lines = NONI_LINES[event]
  if (!lines || !Array.isArray(lines) || lines.length === 0) {
    return `${event}: mensaje de NONI`
  }

  const nickname = context?.nickname || memory.nickname || 'piloto'
  const lastUsed = memory.lastLine[event]

  if (lines.length === 1) {
    return fillTemplate(lines[0], nickname)
  }

  // Pick a variant different from the last one used
  let index
  do {
    index = Math.floor(random() * lines.length)
  } while (index === lastUsed && lines.length > 1)

  memory.lastLine[event] = index
  return fillTemplate(lines[index], nickname)
}
