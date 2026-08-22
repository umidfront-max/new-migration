/* ==========================================================================
   Tahrirlanadigan ma'lumotlar qatlami.
   Demo bosqichda manba — src/data/mock.js, o'zgarishlar localStorage'da saqlanadi.
   Backend ulanganda faqat shu fayldagi restore/persist va CRUD funksiyalari
   API chaqiruvlariga almashtiriladi — sahifalarga tegilmaydi.
   ========================================================================== */
import { reactive, watch } from 'vue'
import * as seed from '@/data/mock'

const KEY = 'migrant-db-v2'

/** Foydalanuvchi qo'sha va tahrirlay oladigan barcha to'plamlar */
export const COLLECTIONS = [
  /* asosiy reyestrlar */
  'migrants', 'countries', 'regions', 'employers',
  'borderPoints', 'roles', 'violations', 'sosEvents',
  /* ko'rsatkichlar va grafiklar */
  'kpis', 'composition', 'purposes', 'series',
  'consulate', 'returnStats', 'riskDistribution',
  'borderStats', 'sosStats', 'auditStats',
  /* panellar va ro'yxatlar */
  'aiInsights', 'aiSuggestions', 'integrations', 'borderSources',
  'reportTemplates', 'reportArchive', 'consulateServices',
  'returnPrograms', 'sosChannels', 'riskWeights',
  /* jurnal va sozlamalar */
  'auditLog', 'settings',
]

const clone = (v) => JSON.parse(JSON.stringify(v))

let _seq = Date.now()
export const uid = () => `r${(_seq++).toString(36)}`

/** Har bir yozuvga barqaror _id beriladi — tahrir va o'chirish shu bo'yicha ishlaydi */
const stamp = (rows) => rows.map((r) => (r._id ? r : { ...r, _id: uid() }))

const restore = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saved = restore()

export const db = reactive(
  Object.fromEntries(
    COLLECTIONS.map((n) => [n, stamp(Array.isArray(saved[n]) ? saved[n] : clone(seed[n]))]),
  ),
)

/* Har qanday o'zgarish avtomatik saqlanadi (debounce) */
let timer = null
watch(
  db,
  () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(db))
      } catch { /* kvota to'lgan — jimgina o'tkazamiz */ }
    }, 300)
  },
  { deep: true },
)

/* ------------------------------------------------------------ audit jurnali */

/** Jurnalda ko'rinadigan joriy foydalanuvchi */
export const actor = reactive({ user: 'admin.root', role: 'Super administrator' })

const LABELS = {
  migrants: 'Reyestr yozuvi', countries: 'Davlat', regions: 'Hudud',
  employers: 'Ish beruvchi', borderPoints: 'O‘tkazish punkti', roles: 'Rol',
  violations: 'Qonunbuzilish turi', sosEvents: 'SOS murojaat',
  kpis: 'KPI', composition: 'Tarkib ko‘rsatkichi', purposes: 'Chiqish maqsadi',
  series: 'Grafik qatori', consulate: 'Konsullik KPI', returnStats: 'Qaytish KPI',
  riskDistribution: 'Xavf taqsimoti', aiInsights: 'AI insayt', aiSuggestions: 'AI savol',
  borderStats: 'Chegara KPI', sosStats: 'SOS KPI', auditStats: 'Audit KPI',
  integrations: 'Integratsiya', borderSources: 'Ma’lumot manbai',
  reportTemplates: 'Hisobot shabloni', reportArchive: 'Arxiv yozuvi',
  consulateServices: 'Konsullik xizmati', returnPrograms: 'Reintegratsiya dasturi',
  sosChannels: 'SOS kanali', riskWeights: 'Model omili', settings: 'Sozlama',
}

const VERBS = { add: 'qo‘shildi', edit: 'o‘zgartirildi', remove: 'o‘chirildi' }

/** CRUD amallarini audit jurnaliga yozadi (jurnalning o'zi yozilmaydi) */
function trace(collection, verb) {
  if (collection === 'auditLog') return
  const d = new Date()
  db.auditLog.unshift({
    _id: uid(),
    id: (db.auditLog[0]?.id ?? 4820) + 1,
    user: actor.user,
    role: actor.role,
    action: `${LABELS[collection] || collection} ${VERBS[verb]}`,
    ip: '92.63.14.7',
    at: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
    ok: true,
  })
  if (db.auditLog.length > 200) db.auditLog.length = 200
}

/* ---------------------------------------------------------------- CRUD */

/** Yangi yozuv qo'shadi va uni qaytaradi */
export function addRecord(name, data) {
  const rec = { ...data, _id: uid() }
  db[name].unshift(rec)
  trace(name, 'add')
  return rec
}

/** Mavjud yozuvni yangilaydi (_id bo'yicha topib) */
export function updateRecord(name, id, data) {
  const row = db[name].find((r) => r._id === id)
  if (!row) return null
  Object.assign(row, data)
  trace(name, 'edit')
  return row
}

/** _id bo'yicha o'chiradi */
export function removeRecord(name, id) {
  const i = db[name].findIndex((r) => r._id === id)
  if (i === -1) return false
  db[name].splice(i, 1)
  trace(name, 'remove')
  return true
}

/** Qo'shish yoki yangilash — modal formaning yagona kirish nuqtasi */
export function saveRecord(name, id, data) {
  return id ? updateRecord(name, id, data) : addRecord(name, data)
}

/** To'plamni (yoki hammasini) demo holatiga qaytaradi */
export function resetCollection(name) {
  const list = name ? [name] : COLLECTIONS
  list.forEach((n) => db[n].splice(0, db[n].length, ...stamp(clone(seed[n]))))
}

/* ----------------------------------------------------- qulay qisqartmalar */

/** Sozlamani kalit bo'yicha o'qish: setting('overallRisk') */
export const setting = (key) => db.settings.find((s) => s.key === key)

/** Grafik qatorini kalit bo'yicha o'qish: serie('out') */
export const serie = (key) => db.series.find((s) => s.key === key)

export const migrants = db.migrants
export const countries = db.countries
export const regions = db.regions
export const employers = db.employers
export const borderPoints = db.borderPoints
export const roles = db.roles
export const violations = db.violations
export const sosEvents = db.sosEvents
