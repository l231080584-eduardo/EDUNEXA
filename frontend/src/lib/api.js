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

export function getApiError(error) {
  if (error.response?.status === 404 || error.response?.status === 500) {
    return 'El servidor no pudo procesar la solicitud. Comprueba que la API y su base de datos estén disponibles.'
  }
  if (error.code === 'ECONNABORTED') {
    return 'La conexión tardó demasiado. Inténtalo de nuevo.'
  }
  if (!error.response) {
    return 'No fue posible conectar con EDUNEXA. Verifica que el backend esté activo en localhost:8080.'
  }
  return error.response.data?.error?.message
    || error.response.data?.detail
    || error.response.data?.message
    || 'Ocurrió un error al comunicarse con EDUNEXA.'
}
