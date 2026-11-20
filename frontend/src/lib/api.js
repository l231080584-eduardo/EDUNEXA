import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

function unwrap(response) {
  return response.data?.ok === true ? response.data.data : response.data
}

export async function evaluateTest(payload) {
  return unwrap(await api.post('/test/evaluate', payload))
}

export async function evaluateArcadeNoni(payload, nickname = 'Aspirante') {
  return unwrap(await api.post(`/test/arcade/evaluate?nickname=${encodeURIComponent(nickname)}`, payload))
}

export async function registerUser(payload) {
  return unwrap(await api.post('/usuarios/registro', payload))
}

export async function loginUser(payload) {
  return unwrap(await api.post('/usuarios/login', payload))
}

export async function getCompatibleUniversities() {
  return unwrap(await api.get('/evaluaciones/compatibilidad'))
}

export async function getCareerCatalog() {
  return unwrap(await api.get('/evaluaciones/carreras'))
}

export async function getAdminEstudiantes(adminPassword) {
  return unwrap(await api.get('/admin/estudiantes', {
    headers: { 'X-Admin-Password': adminPassword },
  }))
}

export function getApiError(error) {
  if (error.code === 'ECONNABORTED') {
    return 'La conexión tardó demasiado. Inténtalo de nuevo.'
  }
  if (!error.response) {
    return 'No fue posible conectar con la API de EDUNEXA. Comprueba que el backend esté activo y que la dirección de la API sea accesible.'
  }

  const responseData = error.response.data || {}
  const apiMessage = responseData.error?.mensaje
    || responseData.error?.message
    || responseData.detail
    || responseData.message
    || responseData.mensaje
  const details = Array.isArray(responseData.error?.detalles) ? responseData.error.detalles.filter(Boolean) : []
  const status = error.response.status

  if ((status === 400 || status === 409) && /ya est[aá] registrado|cuenta ya existe|email ya existe/i.test(apiMessage || '')) {
    return 'Ese correo ya tiene una cuenta. Cambia a “Iniciar sesión” para continuar.'
  }
  if (status === 400 && details.length) return `${apiMessage || 'Revisa estos campos'}: ${details.join(' · ')}`
  if (status === 404 || status >= 500) {
    return apiMessage && apiMessage !== 'Ocurrió un error interno'
      ? `La API no pudo completar la solicitud: ${apiMessage}`
      : 'El servidor no pudo completar la solicitud. Comprueba que la API y la base de datos estén disponibles.'
  }
  return apiMessage || 'Ocurrió un error al comunicarse con EDUNEXA.'
}
