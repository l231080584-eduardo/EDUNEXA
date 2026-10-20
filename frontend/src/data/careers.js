export const GEM_CATEGORIES = {
  law: { label: 'Derecho y ciencias sociales', color: '#ffe16a', field: 'Derecho y Ciencias Sociales' },
  tech: { label: 'Tecnología e IA', color: '#55e8ff', field: 'Ingeniería en Sistemas Computacionales' },
  design: { label: 'Diseño y creatividad', color: '#bd83ff', field: 'Diseño Digital' },
  business: { label: 'Gestión e innovación', color: '#6df2a3', field: 'Gestión Empresarial' },
  engineering: { label: 'Ingeniería y robótica', color: '#ffe16a', field: 'Ingenierías' },
  social: { label: 'Salud y ciencias de la vida', color: '#ff708d', field: 'Ciencias de la Salud' },
  humanities: { label: 'Humanidades y educación', color: '#ff8f61', field: 'Humanidades y Educación' },
}

export const CAREER_CATALOG = [
  { name: 'Ciencia de Datos e Inteligencia Artificial', category: 'tech', profile: 'Modela datos, crea sistemas predictivos y aplica aprendizaje automático para resolver problemas reales.', skills: ['Estadística y pensamiento lógico', 'Programación y modelado de datos'], tools: ['Python', 'SQL', 'Jupyter', 'TensorFlow'], roles: ['Analista de datos', 'Científico de datos', 'Ingeniero de machine learning'], sectors: ['Fintech', 'Tecnología', 'Salud digital'] },
  { name: 'Desarrollo de Software', category: 'tech', profile: 'Diseña, programa, prueba y mantiene aplicaciones web, móviles y servicios digitales.', skills: ['Arquitectura de software', 'Trabajo ágil en equipo'], tools: ['JavaScript', 'Java', 'Git', 'Cloud'], roles: ['Desarrollador full stack', 'Backend developer', 'QA automation'], sectors: ['Tecnología', 'Banca', 'Comercio digital'] },
  { name: 'Ciberseguridad', category: 'tech', profile: 'Protege redes, aplicaciones y datos mediante análisis de riesgos, pruebas y respuesta a incidentes.', skills: ['Análisis de vulnerabilidades', 'Redes y respuesta a incidentes'], tools: ['Linux', 'SIEM', 'Wireshark', 'Python'], roles: ['Analista SOC', 'Consultor de seguridad', 'Pentester junior'], sectors: ['Banca', 'Telecomunicaciones', 'Gobierno'] },
  { name: 'Ingeniería en Sistemas Computacionales', category: 'tech', profile: 'Integra software, bases de datos, redes y servicios en la nube para crear soluciones escalables.', skills: ['Diseño de sistemas', 'Resolución de problemas complejos'], tools: ['Java', 'Python', 'SQL', 'AWS/Azure'], roles: ['Ingeniero de software', 'Arquitecto de soluciones', 'Desarrollador cloud'], sectors: ['Tecnología', 'Finanzas', 'Telecomunicaciones'] },
  { name: 'Diseño UX/UI', category: 'design', profile: 'Investiga necesidades, prototipa interfaces y mejora la experiencia de uso de productos digitales.', skills: ['Investigación con usuarios', 'Prototipado y diseño de interacción'], tools: ['Figma', 'FigJam', 'Design systems', 'Prototipos'], roles: ['UX designer', 'UI designer', 'Product designer'], sectors: ['Tecnología', 'Agencias', 'Servicios financieros'] },
  { name: 'Diseño y Comunicación Visual', category: 'design', profile: 'Comunica ideas con sistemas visuales, identidad de marca, ilustración y medios digitales.', skills: ['Dirección de arte', 'Narrativa visual y tipografía'], tools: ['Adobe Creative Cloud', 'Figma', 'Motion graphics'], roles: ['Diseñador visual', 'Director de arte', 'Diseñador de contenido'], sectors: ['Medios', 'Publicidad', 'Comercio digital'] },
  { name: 'Arquitectura', category: 'design', profile: 'Proyecta espacios funcionales y sustentables combinando creatividad, representación y conocimientos técnicos.', skills: ['Diseño espacial', 'Representación y coordinación de proyectos'], tools: ['AutoCAD', 'Revit/BIM', 'SketchUp'], roles: ['Arquitecto proyectista', 'Modelador BIM', 'Coordinador de proyecto'], sectors: ['Construcción', 'Diseño urbano', 'Consultoría'] },
  { name: 'Animación y Arte Digital', category: 'design', profile: 'Crea piezas audiovisuales, personajes, entornos y experiencias interactivas para distintas plataformas.', skills: ['Narrativa audiovisual', 'Modelado y animación'], tools: ['Blender', 'After Effects', 'Unity'], roles: ['Artista 3D', 'Animador', 'Diseñador de motion graphics'], sectors: ['Videojuegos', 'Cine y medios', 'Publicidad'] },
  { name: 'Ingeniería en Gestión Empresarial', category: 'business', profile: 'Mejora procesos, coordina proyectos y desarrolla estrategias para que las organizaciones crezcan.', skills: ['Liderazgo y gestión de proyectos', 'Análisis financiero y de procesos'], tools: ['Excel/Power BI', 'ERP', 'Métodos ágiles'], roles: ['Analista de negocio', 'Gerente de proyectos', 'Consultor de procesos'], sectors: ['Consultoría', 'Manufactura', 'Servicios financieros'] },
  { name: 'Finanzas y Analítica de Negocios', category: 'business', profile: 'Interpreta información financiera y de mercado para apoyar inversiones y decisiones estratégicas.', skills: ['Planeación financiera', 'Análisis cuantitativo y de riesgos'], tools: ['Excel', 'Power BI', 'SQL', 'Python'], roles: ['Analista financiero', 'Analista de riesgos', 'FP&A analyst'], sectors: ['Banca', 'Fintech', 'Consultoría'] },
  { name: 'Mercadotecnia Digital', category: 'business', profile: 'Diseña estrategias de marca y crecimiento a partir del comportamiento de audiencias y métricas digitales.', skills: ['Estrategia de contenido', 'Medición de campañas y conversión'], tools: ['Analytics', 'CRM', 'SEO/SEM'], roles: ['Growth marketer', 'Estratega digital', 'Analista de marketing'], sectors: ['Comercio electrónico', 'Medios', 'Servicios'] },
  { name: 'Comercio y Negocios Internacionales', category: 'business', profile: 'Coordina operaciones globales, logística, negociación y cumplimiento de comercio exterior.', skills: ['Negociación intercultural', 'Logística y análisis de mercados'], tools: ['ERP', 'Excel', 'Sistemas aduanales'], roles: ['Especialista de comercio exterior', 'Comprador estratégico', 'Coordinador logístico'], sectors: ['Manufactura', 'Logística', 'Comercio internacional'] },
  { name: 'Ingeniería Mecatrónica', category: 'engineering', profile: 'Integra mecánica, electrónica y programación para automatizar máquinas, robots y procesos industriales.', skills: ['Control y automatización', 'Diseño y diagnóstico de sistemas electromecánicos'], tools: ['PLC', 'CAD/CAM', 'Arduino', 'MATLAB'], roles: ['Ingeniero de automatización', 'Integrador robótico', 'Ingeniero de control'], sectors: ['Automotriz', 'Manufactura avanzada', 'Aeroespacial'] },
  { name: 'Robótica Industrial', category: 'engineering', profile: 'Programa e integra robots y celdas automatizadas para mejorar seguridad, calidad y productividad.', skills: ['Programación de robots', 'Integración de sensores y control'], tools: ['ROS', 'PLC', 'Robots ABB/FANUC', 'CAD'], roles: ['Programador de robots', 'Integrador de celdas', 'Ingeniero de mantenimiento predictivo'], sectors: ['Automotriz', 'Electrónica', 'Manufactura'] },
  { name: 'Ingeniería Industrial', category: 'engineering', profile: 'Optimiza sistemas de producción, calidad, logística y operaciones con herramientas de ingeniería.', skills: ['Investigación de operaciones', 'Mejora continua y gestión de calidad'], tools: ['Lean Six Sigma', 'SAP', 'Power BI'], roles: ['Director de operaciones', 'Ingeniero de procesos', 'Analista de cadena de suministro'], sectors: ['Manufactura', 'Logística', 'Consultoría'] },
  { name: 'Ingeniería Eléctrica y Electrónica', category: 'engineering', profile: 'Diseña, instala y mantiene sistemas eléctricos, electrónicos, de potencia y control.', skills: ['Circuitos y sistemas de potencia', 'Instrumentación y diagnóstico'], tools: ['MATLAB/Simulink', 'SPICE', 'PLC'], roles: ['Ingeniero de diseño electrónico', 'Ingeniero de potencia', 'Especialista de control'], sectors: ['Energía', 'Telecomunicaciones', 'Automotriz'] },
  { name: 'Ingeniería Civil', category: 'engineering', profile: 'Planea y supervisa infraestructura, estructuras y obras considerando seguridad, costos y sustentabilidad.', skills: ['Análisis estructural', 'Gestión y supervisión de obra'], tools: ['AutoCAD', 'Civil 3D', 'SAP2000'], roles: ['Ingeniero estructural', 'Residente de obra', 'Coordinador BIM'], sectors: ['Construcción', 'Infraestructura pública', 'Consultoría'] },
  { name: 'Biotecnología', category: 'social', profile: 'Aplica biología, química y tecnología para crear soluciones en salud, alimentos, ambiente e industria.', skills: ['Investigación experimental', 'Análisis de procesos biológicos'], tools: ['PCR', 'Cultivo celular', 'Bioinformática'], roles: ['Analista de laboratorio', 'Especialista de bioprocesos', 'Investigador de I+D'], sectors: ['Farmacéutica', 'Alimentos', 'Biotecnología ambiental'] },
  { name: 'Medicina', category: 'social', profile: 'Promueve la salud, previene enfermedades y participa en diagnóstico y atención con responsabilidad ética.', skills: ['Razonamiento clínico', 'Comunicación y atención centrada en personas'], tools: ['Expediente clínico', 'Métodos diagnósticos', 'Investigación clínica'], roles: ['Médico general', 'Investigador clínico', 'Médico de salud pública'], sectors: ['Hospitales', 'Clínicas', 'Salud pública'] },
  { name: 'Enfermería', category: 'social', profile: 'Brinda cuidados integrales, educación para la salud y apoyo clínico a personas y comunidades.', skills: ['Valoración y cuidado clínico', 'Respuesta ante emergencias y trabajo colaborativo'], tools: ['Monitoreo clínico', 'Expediente electrónico', 'Protocolos de atención'], roles: ['Enfermero clínico', 'Enfermero especialista', 'Coordinador de cuidados'], sectors: ['Hospitales', 'Clínicas', 'Atención comunitaria'] },
  { name: 'Psicología', category: 'social', profile: 'Estudia la conducta y los procesos mentales, y diseña estrategias de evaluación, acompañamiento e intervención.', skills: ['Evaluación psicológica', 'Escucha, ética e intervención basada en evidencia'], tools: ['Psicometría', 'Entrevista clínica', 'Análisis de investigación'], roles: ['Psicólogo clínico', 'Especialista en desarrollo organizacional', 'Orientador educativo'], sectors: ['Salud', 'Educación', 'Recursos humanos'] },
  { name: 'Salud Pública', category: 'social', profile: 'Analiza las condiciones que influyen en la salud de las comunidades y diseña acciones de prevención.', skills: ['Epidemiología y análisis poblacional', 'Diseño y evaluación de programas'], tools: ['Estadística', 'Sistemas de información en salud', 'SIG'], roles: ['Epidemiólogo', 'Analista de salud pública', 'Coordinador de programas comunitarios'], sectors: ['Gobierno', 'Organizaciones sociales', 'Investigación'] },
  { name: 'Derecho', category: 'law', profile: 'Interpreta y aplica el marco jurídico para asesorar, representar y proteger los derechos de personas y organizaciones.', skills: ['Argumentación oral y escrita', 'Análisis jurídico, ética y negociación'], tools: ['Constitución y códigos', 'Investigación jurídica', 'Mediación'], roles: ['Abogado corporativo', 'Litigante', 'Asesor jurídico', 'Defensor público'], sectors: ['Despachos', 'Empresas', 'Gobierno y justicia'], salaryMonthly: 19494 },
  { name: 'Criminología y Criminalística', category: 'law', profile: 'Estudia el fenómeno delictivo y apoya la investigación de hechos con métodos científicos y enfoque de derechos humanos.', skills: ['Análisis de evidencia', 'Prevención y evaluación de riesgos'], tools: ['Metodología pericial', 'Cadena de custodia', 'Sistemas de información'], roles: ['Perito criminalista', 'Analista de prevención', 'Investigador forense'], sectors: ['Fiscalías', 'Seguridad pública', 'Consultoría'], salaryMonthly: 19494 },
  { name: 'Ciencias Políticas y Administración Pública', category: 'law', profile: 'Analiza instituciones y políticas públicas para diseñar soluciones a retos sociales y mejorar servicios gubernamentales.', skills: ['Evaluación de políticas', 'Investigación social y comunicación pública'], tools: ['Análisis estadístico', 'Gestión pública', 'Transparencia'], roles: ['Analista de políticas públicas', 'Asesor legislativo', 'Servidor público'], sectors: ['Gobierno', 'Organizaciones civiles', 'Consultoría'], salaryMonthly: 19494 },
  { name: 'Relaciones Internacionales', category: 'law', profile: 'Comprende dinámicas internacionales y participa en cooperación, negociación y análisis de asuntos globales.', skills: ['Negociación intercultural', 'Análisis geopolítico y comunicación'], tools: ['Idiomas', 'Investigación documental', 'Protocolo internacional'], roles: ['Analista internacional', 'Gestor de cooperación', 'Consultor de comercio exterior'], sectors: ['Gobierno', 'Organismos internacionales', 'Empresas globales'], salaryMonthly: 19494 },
  { name: 'Psicología', category: 'humanities', profile: 'Estudia la conducta y los procesos mentales, y diseña estrategias de evaluación, acompañamiento e intervención.', skills: ['Evaluación psicológica', 'Escucha, ética e intervención basada en evidencia'], tools: ['Psicometría', 'Entrevista clínica', 'Análisis de investigación'], roles: ['Psicólogo clínico', 'Desarrollo organizacional', 'Orientador educativo'], sectors: ['Salud', 'Educación', 'Recursos humanos'], salaryMonthly: 16136 },
  { name: 'Pedagogía y Ciencias de la Educación', category: 'humanities', profile: 'Diseña experiencias de aprendizaje y programas educativos para distintos contextos, edades y comunidades.', skills: ['Diseño didáctico', 'Evaluación del aprendizaje y facilitación'], tools: ['LMS', 'Diseño instruccional', 'Investigación educativa'], roles: ['Diseñador instruccional', 'Coordinador académico', 'Consultor educativo'], sectors: ['Escuelas', 'EdTech', 'Capacitación'], salaryMonthly: 15579 },
  { name: 'Historia', category: 'humanities', profile: 'Investiga e interpreta procesos históricos y culturales para preservar memoria y explicar los cambios sociales.', skills: ['Investigación y pensamiento crítico', 'Escritura y comunicación pública'], tools: ['Archivos', 'Crítica de fuentes', 'Sistemas de información geográfica'], roles: ['Investigador', 'Curador de contenidos', 'Gestor de patrimonio cultural'], sectors: ['Museos', 'Archivos', 'Educación y medios'], salaryMonthly: 19494 },
  { name: 'Filosofía y Ética', category: 'humanities', profile: 'Analiza ideas, valores y argumentos para comprender problemas humanos y participar en deliberación crítica.', skills: ['Argumentación lógica', 'Análisis ético y escritura'], tools: ['Lógica', 'Investigación documental', 'Ética aplicada'], roles: ['Investigador', 'Consultor de ética', 'Editor y divulgador'], sectors: ['Educación', 'Cultura', 'Tecnología responsable'], salaryMonthly: 19494 },
  { name: 'Comunicación y Periodismo', category: 'humanities', profile: 'Investiga, verifica y comunica información para audiencias diversas en medios, plataformas y organizaciones.', skills: ['Narrativa y verificación', 'Producción multimedia y pensamiento crítico'], tools: ['Edición audiovisual', 'Analítica de audiencias', 'Gestión de contenidos'], roles: ['Periodista', 'Productor multimedia', 'Comunicador institucional'], sectors: ['Medios', 'Agencias', 'Organizaciones públicas y sociales'], salaryMonthly: 21513 },
]

export function rankGemCategories(gemCounts = {}, gemEffectiveness = {}) {
  const total = Object.values(gemCounts).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0)
  return Object.entries(GEM_CATEGORIES).map(([id]) => {
    const share = total ? (Math.max(0, Number(gemCounts[id]) || 0) / total) : 0
    const successRate = gemEffectiveness[id] === undefined ? (share ? 1 : 0) : Math.max(0, Math.min(1, Number(gemEffectiveness[id]) || 0))
    return { id, share, successRate, score: share * 0.65 + successRate * 0.35, count: Number(gemCounts[id]) || 0 }
  }).sort((a, b) => b.score - a.score || b.count - a.count)
}

function inferGemCategory(career) {
  const normalized = `${career.area || ''} ${career.nombre || career.name || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/derech|juridic|abogad|criminolog|politic|relaciones internacionales/.test(normalized)) return 'law'
  if (/psicolog|pedagog|educacion|humanid|historia|filosof|periodismo|comunicacion/.test(normalized)) return 'humanities'
  if (/salud|medic|enfermer|biotecn|odontolog|biolog/.test(normalized)) return 'social'
  if (GEM_CATEGORIES[career.category]) return career.category
  if (/mecatron|robot|ingenier|automatiz|electron|civil/.test(normalized)) return 'engineering'
  if (/diseno|arquitect|animacion|arte|visual/.test(normalized)) return 'design'
  if (/gestion|negocio|finanz|contadur|administr|mercado|comercio/.test(normalized)) return 'business'
  return 'tech'
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (!value) return []
  return String(value).split(/[\n;,|]+/).map((part) => part.trim()).filter(Boolean)
}

function normalizeCareer(item) {
  const name = item.name || item.nombre
  const labor = item.campoLaboral || []
  const profile = item.perfil || item.perfilEgreso?.resumenCompetencias || item.descripcion || 'Explora conocimientos y experiencias de esta carrera para encontrar tu propio enfoque.'
  const skills = asList(item.skills || item.perfilEgreso?.habilidadesBlandas)
  const tools = asList(item.tools || item.perfilEgreso?.conocimientosTecnicos)
  const roles = asList(item.roles || labor.map((entry) => entry.puestoTrabajo))
  const sectors = asList(item.sectors || labor.map((entry) => entry.sectorEmpresarial))
  const salaryMonthly = item.salaryMonthly || labor.find((entry) => entry.salarioPromedioEstimado || entry.salarioPromedio)?.salarioPromedioEstimado || labor.find((entry) => entry.salarioPromedio)?.salarioPromedio
  return { ...item, name, category: inferGemCategory({ ...item, name }), profile, skills, tools, roles, sectors, salaryMonthly }
}

export function recommendCareers(gemCounts = {}, gemEffectiveness = {}, careerCatalog = CAREER_CATALOG) {
  const ranked = rankGemCategories(gemCounts, gemEffectiveness)
  const strongest = ranked.slice(0, 2)
  const catalogNames = new Set()
  const completeCatalog = [...careerCatalog, ...CAREER_CATALOG].map(normalizeCareer).filter((career) => {
    const key = career.name?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    if (!key || catalogNames.has(key)) return false
    catalogNames.add(key)
    return true
  })
  const categoriesFor = (category) => category.id === 'tech' ? ['tech', 'engineering'] : [category.id]
  const recommended = []
  const selectedNames = new Set()
  const addFromCategory = (category, limit) => {
    let added = 0
    for (const career of completeCatalog.filter((item) => categoriesFor(category).includes(item.category))) {
      const key = career.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      if (selectedNames.has(key)) continue
      selectedNames.add(key)
      recommended.push({ ...career, matchScore: Math.round(category.score * 100), gemCategory: category.id })
      added += 1
      if (added >= limit) break
    }
  }
  strongest.forEach((category, categoryIndex) => addFromCategory(category, categoryIndex === 0 ? 3 : 2))
  if (recommended.length < 3) {
    for (const category of ranked) {
      if (strongest.some((item) => item.id === category.id)) continue
      addFromCategory(category, 3 - recommended.length)
      if (recommended.length >= 3) break
    }
  }
  return recommended.slice(0, 5)
}

export function buildGameMetrics(gemCounts = {}, gemEffectiveness = {}, studentLocation = null) {
  const ranks = rankGemCategories(gemCounts, gemEffectiveness)
  const total = ranks.reduce((sum, item) => sum + item.count, 0)
  const shareFor = (ids) => total ? ranks.filter((item) => ids.includes(item.id)).reduce((sum, item) => sum + item.count, 0) / total : 0
  const variety = total ? ranks.filter((item) => item.count > 0).length / Math.min(6, ranks.length) : 0
  return {
    intereses: ranks.length ? ranks[0].score : 0,
    materias: shareFor(['tech', 'engineering']),
    estiloVida: shareFor(['design', 'business', 'social', 'law', 'humanities']),
    geolocalizacion: studentLocation?.latitud != null && studentLocation?.longitud != null ? 1 : Math.min(1, variety),
  }
}

