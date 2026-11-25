// Six short, choice-based situations. Each area appears exactly three times so
// the result is not skewed by one career family being offered more often.
export const VOCATIONAL_SCENARIOS = [
  {
    id: 'expo-proyecto',
    title: 'Tu equipo prepara un proyecto para la Expo Ingenierías. ¿Qué parte elegirías?',
    context: 'Piensa en la actividad que te daría más curiosidad probar.',
    options: [
      { category: 'tech', text: 'Programar una app o un sensor para que el proyecto responda al público.' },
      { category: 'industry', text: 'Ajustar el prototipo y encontrar cómo producirlo de forma más eficiente.' },
      { category: 'construction', text: 'Diseñar el módulo, su estructura y el recorrido de las personas.' },
    ],
  },
  {
    id: 'campus-falla',
    title: 'Una falla deja sin servicio un edificio del campus. ¿Por dónde empezarías?',
    context: 'No hay una respuesta correcta: elige la tarea que te gustaría asumir.',
    options: [
      { category: 'energy', text: 'Revisar el consumo y proponer una solución eléctrica segura y eficiente.' },
      { category: 'business', text: 'Organizar al equipo, priorizar necesidades y coordinar los recursos.' },
      { category: 'life', text: 'Investigar si el problema afecta la salud, el agua o el entorno de la comunidad.' },
    ],
  },
  {
    id: 'barrio-servicio',
    title: 'Tu colonia quiere mejorar un servicio que no está funcionando bien. ¿Qué te gustaría aportar?',
    context: 'Imagina que tienes tiempo y un equipo para investigar el problema.',
    options: [
      { category: 'tech', text: 'Crear una herramienta digital para reportar fallas y dar seguimiento.' },
      { category: 'industry', text: 'Analizar el proceso actual y reducir errores, desperdicio y tiempos.' },
      { category: 'life', text: 'Estudiar cómo afecta a las personas y plantear una mejora para su bienestar.' },
    ],
  },
  {
    id: 'espacio-escolar',
    title: 'Hay un espacio escolar que casi nadie puede aprovechar. ¿Qué reto tomarías?',
    context: 'El objetivo es que el lugar sea útil, cómodo y accesible.',
    options: [
      { category: 'construction', text: 'Rediseñar el espacio y construir una ruta accesible y segura.' },
      { category: 'energy', text: 'Planear iluminación y energía de bajo consumo para el lugar.' },
      { category: 'business', text: 'Armar el plan, presupuesto y calendario para que el cambio se concrete.' },
    ],
  },
  {
    id: 'prototipo-mejora',
    title: 'Un prototipo funciona, pero todavía puede mejorar. ¿Qué investigarías?',
    context: 'Escoge el tipo de problema que más te gustaría resolver.',
    options: [
      { category: 'tech', text: 'Depurar el código y hacer que los sensores se comuniquen mejor.' },
      { category: 'construction', text: 'Mejorar la forma, los materiales y la facilidad de uso.' },
      { category: 'energy', text: 'Reducir el consumo y probar una fuente de energía más limpia.' },
    ],
  },
  {
    id: 'feria-comunidad',
    title: 'El Tec organiza una feria para la comunidad. ¿Qué actividad elegirías?',
    context: 'Elige la contribución que más disfrutarías hacer.',
    options: [
      { category: 'business', text: 'Coordinar equipos, tiempos y alianzas para que todo salga bien.' },
      { category: 'life', text: 'Preparar una actividad sobre salud, ciencia o cuidado del ambiente.' },
      { category: 'industry', text: 'Diseñar el montaje para que los módulos sean seguros y funcionen sin contratiempos.' },
    ],
  },
]

