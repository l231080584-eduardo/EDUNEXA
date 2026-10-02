import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
})

export async function evaluateTest(payload) {
  const { data } = await api.post('/test/evaluate', payload)
  return data
}

export async function registerUser(payload) {
  const { data } = await api.post('/usuarios/registro', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/usuarios/login', payload)
  return data
}

export async function getCompatibleUniversities() {
  const { data } = await api.get('/evaluaciones/compatibilidad')
  return data
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
  return error.response.data?.detail || error.response.data?.message || 'Ocurrió un error al comunicarse con EDUNEXA.'
}
