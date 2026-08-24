/* ==========================================================================
   Backend bilan aloqa.

   Manzil: VITE_API_URL (.env) yoki standart http://127.0.0.1:8000/api
   Autentifikatsiya: token sarlavhada — `Authorization: Token <...>`
   ========================================================================== */

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

const TOKEN_KEY = 'migrant-token'

let token = null
try {
  token = localStorage.getItem(TOKEN_KEY)
} catch { /* xotira yopiq */ }

export const getToken = () => token

export function setToken(value) {
  token = value || null
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* xotira yopiq */ }
}

/** Server qaytargan xato — maydon xatolari bilan birga */
export class ApiError extends Error {
  constructor(message, { status = 0, fields = null, payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
    this.payload = payload
  }

  /** Kirish talab qilinadimi */
  get isUnauthorized() {
    return this.status === 401
  }

  /** Juda ko'p so'rov yuborildimi */
  get isThrottled() {
    return this.status === 429
  }
}

/** Serverdagi xato javobini o'qiladigan matnga aylantiradi */
function describe(payload, status) {
  if (!payload) return `Server javob bermadi (${status})`
  if (typeof payload === 'string') return payload
  if (payload.detail) return payload.detail
  if (payload.error) return payload.error

  const first = Object.entries(payload)[0]
  if (!first) return `Kutilmagan xato (${status})`
  const [field, value] = first
  const text = Array.isArray(value) ? value[0] : value
  return field === 'non_field_errors' ? String(text) : `${field}: ${text}`
}

/** Maydon xatolarini `{ maydon: 'matn' }` ko'rinishiga keltiradi */
function fieldErrors(payload) {
  if (!payload || typeof payload !== 'object' || payload.detail || payload.error) return null
  const result = {}
  for (const [key, value] of Object.entries(payload)) {
    result[key] = Array.isArray(value) ? value[0] : String(value)
  }
  return Object.keys(result).length ? result : null
}

/** Chaqiruvlar bekor qilinganda ishlatiladigan xato */
const isAbort = (error) => error?.name === 'AbortError'

/**
 * `Content-Disposition` dan fayl nomini oladi.
 * RFC 5987 dagi `filename*=UTF-8''…` afzal ko'riladi — unda to'liq nom bo'ladi.
 */
function filenameFrom(headers) {
  const disposition = headers.get('Content-Disposition') || ''

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim())
    } catch { /* buzuq kodlash — oddiy nomga o'tamiz */ }
  }

  const plain = disposition.match(/filename="([^"]+)"/i) || disposition.match(/filename=([^;]+)/i)
  const name = plain?.[1]?.trim()
  return name && name.toLowerCase().endsWith('.csv') ? name : 'export.csv'
}

/**
 * Asosiy so'rov funksiyasi.
 * @param {string} path — `/migrants/` ko'rinishida
 */
export async function request(path, { method = 'GET', body, params, signal, raw = false } = {}) {
  /* API_URL nisbiy bo'lishi mumkin (`/api`) — prodda frontend va backend
     bir domenda turadi, shunda build manzilga bog'lanib qolmaydi.
     Mutlaq manzil berilsa ikkinchi argument e'tiborga olinmaydi. */
  const origin = typeof window === 'undefined' ? undefined : window.location.origin
  const url = new URL(API_URL + path, origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    }
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Token ${token}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (isAbort(error)) throw error
    throw new ApiError('Serverga ulanib bo‘lmadi — backend ishlayaptimi?', { status: 0 })
  }

  if (response.status === 204) return null
  if (raw) {
    if (!response.ok) throw new ApiError(`Xato (${response.status})`, { status: response.status })
    return response
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new ApiError(describe(payload, response.status), {
      status: response.status,
      fields: fieldErrors(payload),
      payload,
    })
  }
  return payload
}

export const api = {
  get: (path, params, signal) => request(path, { params, signal }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),

  /**
   * Sahifalangan ro'yxatni to'liq yig'ib beradi.
   * Panellar uchun barcha yozuv kerak, shuning uchun sahifalar aylanib chiqiladi.
   */
  async list(path, params = {}, signal) {
    const rows = []
    let page = 1
    for (;;) {
      const data = await request(path, {
        params: { ...params, page, page_size: params.page_size ?? 500 },
        signal,
      })
      if (Array.isArray(data)) return data
      rows.push(...(data?.results ?? []))
      if (!data?.next) return rows
      page += 1
    }
  },

  /**
   * Bitta sahifani oladi — jadval navigatsiyasi uchun.
   * `list` dan farqi: qolgan sahifalar aylanib chiqilmaydi.
   */
  async page(path, params = {}, signal) {
    const data = await request(path, { params, signal })
    if (Array.isArray(data)) return { rows: data, count: data.length }
    return { rows: data?.results ?? [], count: data?.count ?? 0 }
  },

  /** Fayl yuklab olish — CSV eksport uchun */
  async download(path, params) {
    const response = await request(path, { params, raw: true })
    const blob = await response.blob()
    return { blob, filename: filenameFrom(response.headers) }
  },
}
