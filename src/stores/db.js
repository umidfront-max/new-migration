/* ==========================================================================
   Ma'lumotlar qatlami — backend API ustidan.

   Sahifalar uchun interfeys o'zgarmadi: `db.migrants` hamon reaktiv massiv,
   `addRecord` / `updateRecord` / `removeRecord` hamon shu nomlar bilan
   chaqiriladi. Farqi shundaki, ular endi asinxron va serverga so'rov yuboradi.

   Ma'lumot brauzerda saqlanmaydi — har bir yozuv serverdan keladi.
   ========================================================================== */
import { reactive, readonly } from 'vue'

import { api, ApiError } from '@/services/api'
import {
  COLLECTIONS,
  detailPath,
  ENDPOINTS,
  fromApi,
  isReadOnly,
  listParams,
  toApi,
} from '@/services/collections'

export { COLLECTIONS, isReadOnly, ApiError }

/** Barcha to'plamlar — boshida bo'sh, `loadAll()` dan keyin to'ladi */
export const db = reactive(Object.fromEntries(COLLECTIONS.map((name) => [name, []])))

const state = reactive({
  loading: false,
  ready: false,
  error: null,
  loadedAt: null,
})

/**
 * Serverda hisoblangan yig'ma ko'rsatkichlar (`/dashboard/summary/`).
 * Sarlavha va izohlardagi raqamlar shu yerdan olinadi — frontend
 * hech narsani o'zi taxmin qilmaydi.
 */
export const summary = reactive({
  countries: {}, regions: {}, border: {}, registry: {},
  employers: {}, sos: {}, violations: {},
})

/** Yuklanish holati — sahifalar shu bo'yicha ekran ko'rsatadi */
export const status = readonly(state)

/** Jurnalda ko'rinadigan joriy foydalanuvchi (auth store to'ldiradi) */
export const actor = reactive({ user: 'mehmon', role: '—' })

/* ------------------------------------------------------------- yuklash */

let inflight = null

/** Yig'ma ko'rsatkichlarni serverdan o'qiydi */
export async function loadSummary() {
  Object.assign(summary, await api.get('/dashboard/summary/'))
  return summary
}

/** Bitta to'plamni serverdan qayta o'qiydi */
export async function loadCollection(name, signal) {
  const rows = await api.list(ENDPOINTS[name].path, listParams(name), signal)
  db[name].splice(0, db[name].length, ...rows.map((row) => fromApi(name, row)))
  return db[name]
}

/**
 * Ro'yxatni cheklangan oqim bilan bajaradi.
 *
 * Brauzer bitta hostga 6 ta ulanish ochadi, dev serveri esa o'nlab
 * bir vaqtdagi so'rovda ulanishni uzib yuboradi — shuning uchun
 * to'plamlar to'da-to'da yuklanadi.
 */
async function runPooled(items, worker, limit = 6) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      await worker(queue.shift())
    }
  })
  await Promise.all(workers)
}

/**
 * Barcha to'plamlarni yuklaydi.
 * Bir vaqtda bir nechta chaqiruv bo'lsa — bittasi bajariladi.
 */
export function loadAll({ force = false } = {}) {
  if (inflight && !force) return inflight
  if (state.ready && !force) return Promise.resolve(db)

  state.loading = true
  state.error = null

  inflight = runPooled(COLLECTIONS, (name) => loadCollection(name))
    .then(() => loadSummary())
    .then(() => {
      state.ready = true
      state.loadedAt = new Date().toISOString()
      return db
    })
    .catch((error) => {
      state.error = error instanceof ApiError ? error.message : String(error)
      throw error
    })
    .finally(() => {
      state.loading = false
      inflight = null
    })

  return inflight
}

/** Kirish/chiqishda ma'lumotni tozalaydi */
export function clearAll() {
  COLLECTIONS.forEach((name) => db[name].splice(0, db[name].length))
  state.ready = false
  state.error = null
  state.loadedAt = null
}

/* ---------------------------------------------------------------- CRUD */

const ensureWritable = (name) => {
  if (isReadOnly(name)) {
    throw new ApiError(`"${name}" faqat o‘qish uchun — yozuv qo‘shib bo‘lmaydi`, { status: 405 })
  }
}

/** Yangi yozuv qo'shadi */
export async function addRecord(name, data) {
  ensureWritable(name)
  const created = fromApi(name, await api.post(ENDPOINTS[name].path, toApi(name, data)))
  db[name].unshift(created)
  return created
}

/** Mavjud yozuvni yangilaydi */
export async function updateRecord(name, id, data) {
  ensureWritable(name)
  const index = db[name].findIndex((row) => row._id === String(id))
  if (index === -1) return null

  const path = detailPath(name, db[name][index])
  const updated = fromApi(name, await api.patch(path, toApi(name, data)))
  db[name].splice(index, 1, updated)
  return updated
}

/** Yozuvni o'chiradi */
export async function removeRecord(name, id) {
  ensureWritable(name)
  const index = db[name].findIndex((row) => row._id === String(id))
  if (index === -1) return false

  await api.delete(detailPath(name, db[name][index]))
  db[name].splice(index, 1)
  return true
}

/** Qo'shish yoki yangilash — modal formaning yagona kirish nuqtasi */
export function saveRecord(name, id, data) {
  return id ? updateRecord(name, id, data) : addRecord(name, data)
}

/**
 * Bitta maydonni tezkor o'zgartirish — jadvaldagi tugmalar uchun.
 * Butun formani ochmasdan serverga PATCH yuboradi.
 */
export function patchRecord(name, record, changes) {
  return updateRecord(name, record._id, changes)
}

/** Serverdan qayta o'qish — "yangilash" tugmasi uchun */
export function refreshAll() {
  return loadAll({ force: true })
}

/* --------------------------------------- resurslardagi qo'shimcha amallar */

const replaceRow = (name, updated) => {
  const index = db[name].findIndex((row) => row._id === updated._id)
  if (index > -1) db[name].splice(index, 1, updated)
  return updated
}

/** SOS murojaatni yopadi */
export async function resolveSosEvent(record) {
  const path = `${detailPath('sosEvents', record)}resolve/`
  return replaceRow('sosEvents', fromApi('sosEvents', await api.post(path)))
}

/** Yopilgan SOS murojaatni qayta ochadi */
export async function reopenSosEvent(record) {
  const path = `${detailPath('sosEvents', record)}reopen/`
  return replaceRow('sosEvents', fromApi('sosEvents', await api.post(path)))
}

/** Hisobot shablonidan arxivga yozuv shakllantiradi */
export async function generateReport(template) {
  const result = await api.post(`${detailPath('reportTemplates', template)}generate/`)
  await loadCollection('reportArchive')
  return result
}

/** CSV eksport — brauzerda yuklab olishni boshlaydi */
export async function exportCollection(name, params = {}) {
  const { blob, filename } = await api.download(`${ENDPOINTS[name].path}export/`, params)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  return filename
}

/* ----------------------------------------------------- qulay qisqartmalar */

/** Sozlamani kalit bo'yicha o'qish: setting('overallRisk') */
export const setting = (key) => db.settings.find((row) => row.key === key)

/** Grafik qatorini kalit bo'yicha o'qish: serie('out') */
export const serie = (key) => db.series.find((row) => row.key === key)
