/* ==========================================================================
   Ma'lumotlar qatlami — backend API ustidan.

   Sahifalar uchun interfeys o'zgarmadi: `db.migrants` hamon reaktiv massiv,
   `addRecord` / `updateRecord` / `removeRecord` hamon shu nomlar bilan
   chaqiriladi. Farqi shundaki, ular endi asinxron va serverga so'rov yuboradi.

   Yuklash sahifa bo'yicha: ilova barcha endpointni birdan so'ramaydi,
   faqat ochilgan sahifaga kerak bo'lganini oladi (`@/services/pageData`).
   Bir marta olingan to'plam keshda qoladi va qayta so'ralmaydi.

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
import { CORE, dataFor, SUMMARY } from '@/services/pageData'

export { COLLECTIONS, isReadOnly, ApiError, SUMMARY }

/** Barcha to'plamlar — boshida bo'sh, sahifa ochilganda kerakligi to'ladi */
export const db = reactive(Object.fromEntries(COLLECTIONS.map((name) => [name, []])))

const state = reactive({
  /** hozir serverga so'rov ketmoqda */
  loading: false,
  /** umumiy ma'lumot yuklandi — qobiqni ko'rsatish mumkin */
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

/** Serverdan olingan to'plamlar — ikkinchi marta so'ralmaydi */
const fetched = new Set()
/** Ketayotgan so'rovlar: nom → Promise. Takroriy chaqiruv shu promisega ulanadi */
const pending = new Map()

/** Yig'ma ko'rsatkichlarni serverdan o'qiydi */
export async function loadSummary() {
  Object.assign(summary, await api.get('/dashboard/summary/'))
  fetched.add(SUMMARY)
  return summary
}

/** Bitta to'plamni serverdan qayta o'qiydi (kesh hisobga olinmaydi) */
export async function loadCollection(name, signal) {
  const rows = await api.list(ENDPOINTS[name].path, listParams(name), signal)
  db[name].splice(0, db[name].length, ...rows.map((row) => fromApi(name, row)))
  fetched.add(name)
  return db[name]
}

/** Ma'lumot allaqachon keshdami */
export const isLoaded = (name) => fetched.has(name)

/** Sahifa uchun kerakli barcha ma'lumot keshdami */
export const isPageLoaded = (path) => dataFor(path).every(isLoaded)

const fetchOne = (name) => (name === SUMMARY ? loadSummary() : loadCollection(name))

/**
 * Bitta nomni yuklaydi: keshda bo'lsa — so'rov yubormaydi, ketayotgan
 * so'rov bo'lsa — shunga ulanadi. Shu sababli bir endpointga
 * hech qachon ikkita parallel so'rov ketmaydi.
 */
function ensureOne(name) {
  if (fetched.has(name)) return Promise.resolve()
  if (pending.has(name)) return pending.get(name)

  const job = fetchOne(name).finally(() => pending.delete(name))
  pending.set(name, job)
  return job
}

/**
 * Ro'yxatni cheklangan oqim bilan bajaradi.
 *
 * Brauzer bitta hostga 6 ta ulanish ochadi, dev serveri esa o'nlab
 * bir vaqtdagi so'rovda ulanishni uzib yuboradi — shuning uchun
 * so'rovlar to'da-to'da yuboriladi.
 */
async function runPooled(items, worker, limit = 4) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      await worker(queue.shift())
    }
  })
  await Promise.all(workers)
}

/* Bir vaqtda bir nechta yuklash ketishi mumkin — `loading` shu bo'yicha */
let active = 0

/**
 * Ko'rsatilgan ma'lumotni yuklaydi. Keshda borlari o'tkazib yuboriladi,
 * shuning uchun sahifalar orasida yurganda so'rov takrorlanmaydi.
 */
export async function ensureData(names) {
  const need = [...new Set(names)].filter((name) => !fetched.has(name))
  if (!need.length) {
    /* Hammasi keshda — oldingi xato endi bu sahifaga tegishli emas */
    if (!active) state.error = null
    return db
  }

  active += 1
  state.loading = true
  state.error = null

  try {
    await runPooled(need, ensureOne)
    state.loadedAt = new Date().toISOString()
    return db
  } catch (error) {
    state.error = error instanceof ApiError ? error.message : String(error)
    throw error
  } finally {
    active = Math.max(0, active - 1)
    if (!active) state.loading = false
  }
}

/** Qobiq uchun umumiy ma'lumot — kirgandan keyin bir marta */
export async function loadCore() {
  await ensureData(CORE)
  state.ready = true
  return db
}

/** Ochilgan sahifa uchun ma'lumot */
export function loadPage(path) {
  return ensureData(dataFor(path))
}

/** Sahifani serverdan qayta o'qish — "yangilash" tugmasi uchun */
export function refreshPage(path) {
  dataFor(path).forEach((name) => fetched.delete(name))
  return ensureData(dataFor(path))
}

/** Keshdagi hamma narsani serverdan qayta o'qiydi */
export function refreshLoaded() {
  const names = [...fetched]
  fetched.clear()
  return ensureData(names)
}

/** Kirish/chiqishda ma'lumotni tozalaydi */
export function clearAll() {
  COLLECTIONS.forEach((name) => db[name].splice(0, db[name].length))
  fetched.clear()
  pending.clear()
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

/** Faylni brauzerda yuklab olishni boshlaydi */
function saveBlob(blob, filename) {
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

/** CSV eksport — joriy filtrlar bilan */
export async function exportCollection(name, params = {}) {
  const { blob, filename } = await api.download(`${ENDPOINTS[name].path}export/`, params)
  return saveBlob(blob, filename)
}

/** Arxivdagi hisobot faylini yuklab oladi */
export async function downloadReport(entry) {
  const { blob, filename } = await api.download(`${detailPath('reportArchive', entry)}download/`)
  return saveBlob(blob, filename)
}

/* ----------------------------------------------------- qulay qisqartmalar */

/** Sozlamani kalit bo'yicha o'qish: setting('overallRisk') */
export const setting = (key) => db.settings.find((row) => row.key === key)

/** Grafik qatorini kalit bo'yicha o'qish: serie('out') */
export const serie = (key) => db.series.find((row) => row.key === key)
