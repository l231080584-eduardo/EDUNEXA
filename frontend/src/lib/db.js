const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

async function request(path, { method = 'GET', body, token, prefer } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase no está configurado.')
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.msg || payload.message || payload.error_description || payload.error || `Supabase respondió ${response.status}.`)
  return payload
}

export function registerPlayer(email, password, profile) {
  return request('/auth/v1/signup', { method: 'POST', body: { email, password, data: { nombre: profile.nombre, nickname: profile.nickname, telefono: profile.telefono, escuela: profile.escuela, interesTecnm: profile.interesTecnm, folio: profile.folio } } })
}

export function loginPlayer(email, password) {
  return request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } })
}

export function refreshPlayerSession(refreshToken) {
  return request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: refreshToken } })
}

/** Saves only with a valid user session; guests are persisted by the local record store. */
export async function saveRemoteGameRecord(record, session) {
  if (!isSupabaseConfigured || !session?.access_token || !record?.playerId) return false
  const safeRecord = { ...record }
  delete safeRecord.studentLocation
  const row = {
    user_id: record.playerId,
    hero_class: record.heroClass || 'tech',
    final_score: Math.max(0, Number(record.finalScore) || 0),
    recommended_universities: Array.isArray(record.recommendedUniversities) ? record.recommendedUniversities.slice(0, 3) : [],
    record_json: safeRecord,
    updated_at: new Date().toISOString(),
  }
  await request('/rest/v1/game_records?on_conflict=user_id', { method: 'POST', token: session.access_token, body: row, prefer: 'resolution=merge-duplicates,return=minimal' })
  return true
}

export async function loadRemoteGameRecord(session) {
  if (!isSupabaseConfigured || !session?.access_token) return null
  const rows = await request(`/rest/v1/game_records?select=record_json,updated_at&user_id=eq.${encodeURIComponent(session.user?.id || '')}&limit=1`, { token: session.access_token })
  return Array.isArray(rows) ? rows[0]?.record_json || null : null
}
