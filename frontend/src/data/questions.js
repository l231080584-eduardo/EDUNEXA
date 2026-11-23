export const questions = [
  {
    id: 'intereses-1',
    category: 'intereses',
    eyebrow: 'Lo que te mueve',
    title: '¿Qué tipo de reto te daría más curiosidad?',
    description: 'Puedes imaginar crear una app, mejorar una máquina, diseñar un espacio, explorar energía, organizar un proyecto o investigar cómo funciona la vida.',
  },
  {
    id: 'materias',
    category: 'materias',
    eyebrow: 'Tu forma de aprender',
    title: '¿Qué tanto disfrutas experimentar, calcular o descubrir por qué funcionan las cosas?',
    description: 'No se trata de sacar dieces: piensa en tu curiosidad y en las ganas de aprender probando.',
  },
  {
    id: 'estilo-vida',
    category: 'estiloVida',
    eyebrow: 'La vida que imaginas',
    title: '¿Qué tanto te emociona crear algo que mejore tu comunidad?',
    description: 'Puede ser una tecnología, un proceso, un espacio, energía limpia, un proyecto o una solución para la salud y la vida.',
  },
  {
    id: 'geolocalizacion',
    category: 'geolocalizacion',
    eyebrow: 'Tu entorno',
    title: '¿Qué tan importante es para ti conocer opciones para estudiar cerca de Iztapalapa?',
    description: 'Esta respuesta prioriza cuánto pesan las instituciones cercanas en tus recomendaciones; no cambia las carreras sugeridas.',
  },
  {
    id: 'intereses-2',
    category: 'intereses',
    eyebrow: 'Una última reflexión',
    title: '¿Qué tanto te gusta aprender cosas nuevas junto a otras personas?',
    description: 'Piensa en colaborar, compartir ideas y combinar habilidades distintas para resolver un reto.',
  },
]

export const scaleLabels = [
  'Nada',
  'Un poco',
  'Más o menos',
  'Bastante',
  'Muchísimo',
]

export function buildMetrics(answers) {
  const values = { intereses: [], materias: [], estiloVida: [], geolocalizacion: [] }

  questions.forEach((question) => {
    const answer = answers[question.id]
    if (answer) values[question.category].push((answer - 1) / 4)
  })

  return Object.fromEntries(
    Object.entries(values).map(([key, scores]) => [
      key,
      scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
    ]),
  )
}

export function createCareerSuggestions(metrics) {
  const careers = [
    { name: 'Ingeniería en Sistemas Computacionales', score: metrics.intereses * 0.55 + metrics.materias * 0.45 },
    { name: 'Inteligencia Artificial', score: metrics.intereses * 0.5 + metrics.materias * 0.5 },
    { name: 'Ingeniería en Gestión Empresarial', score: metrics.estiloVida * 0.55 + metrics.materias * 0.2 + metrics.intereses * 0.25 },
  ]
  return careers.sort((a, b) => b.score - a.score).slice(0, 2).map(({ name }) => name)
}

export function createReport(metrics, careers, bonus) {
  const interests = metrics.intereses >= 0.6
    ? 'Tu curiosidad por la tecnología y la creación de soluciones destaca'
    : 'Explorar distintas áreas puede ayudarte a descubrir qué te entusiasma'
  const learning = metrics.materias >= 0.6
    ? 'y muestras apertura para aprender conceptos técnicos'
    : 'y puedes desarrollar tus habilidades técnicas paso a paso'
  const bonusText = bonus
    ? ' También indicaste tu interés en el TecNM Plantel Iztapalapa 1; considera sus opciones al comparar universidades.'
    : ''
  return `${interests} ${learning}. Tus áreas sugeridas son ${careers.join(' e ')}.${bonusText} Recuerda que este resultado es una guía para explorar, no un límite a tus posibilidades.`
}
