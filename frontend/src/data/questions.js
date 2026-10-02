export const questions = [
  {
    id: 'intereses-1',
    category: 'intereses',
    eyebrow: 'Lo que te mueve',
    title: '¿Qué tanto disfrutas resolver problemas usando tecnología?',
    description: 'Piensa en crear una app, explorar cómo funciona algo o encontrar una solución digital.',
  },
  {
    id: 'materias',
    category: 'materias',
    eyebrow: 'Tu forma de aprender',
    title: '¿Qué tan a gusto te sientes con matemáticas y ciencias?',
    description: 'No se trata de sacar dieces: piensa en tu curiosidad y disposición para aprender.',
  },
  {
    id: 'estilo-vida',
    category: 'estiloVida',
    eyebrow: 'La vida que imaginas',
    title: '¿Qué tanto te atrae una carrera con retos y aprendizaje constante?',
    description: 'Considera proyectos nuevos, colaboración y posibilidades de crecimiento profesional.',
  },
  {
    id: 'geolocalizacion',
    category: 'geolocalizacion',
    eyebrow: 'Tu entorno',
    title: '¿Qué tan importante es estudiar cerca de donde vives?',
    description: 'Una valoración alta indica que la cercanía es importante para tu decisión.',
  },
  {
    id: 'intereses-2',
    category: 'intereses',
    eyebrow: 'Una última reflexión',
    title: '¿Qué tanto te gustaría crear soluciones para otras personas?',
    description: 'Desde diseñar una herramienta útil hasta mejorar un proceso en tu comunidad.',
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
