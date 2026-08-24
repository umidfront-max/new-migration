/* ==========================================================================
   To'plam nomi ↔ API endpointi.

   Frontend 32 ta to'plam bilan ishlaydi, backendda ular 25 ta endpointga
   joylashgan: o'xshash KPI qatorlari `metrics?group=…`, taqsimotlar esa
   `shares?group=…` orqali olinadi.

   Serverdagi maydon nomlari frontend kutgan shaklda (`out`, `back`,
   `countryCode`), shuning uchun bu yerda faqat kalitlar moslashtiriladi.
   ========================================================================== */

/**
 * `path`   — endpoint manzili
 * `lookup` — detal manzilda ishlatiladigan maydon (bo'lmasa — `id`)
 * `group`  — guruhli endpointlar uchun majburiy filtr
 * `readOnly` — faqat o'qish
 */
export const ENDPOINTS = {
  /* asosiy reyestrlar */
  migrants: { path: '/migrants/' },
  countries: { path: '/countries/', lookup: 'code' },
  regions: { path: '/regions/' },
  districts: { path: '/districts/', defaults: { region: 'Toshkent viloyati' } },
  employers: { path: '/employers/' },
  borderPoints: { path: '/border-points/' },
  borderSources: { path: '/border-sources/' },
  roles: { path: '/roles/' },
  users: { path: '/users/' },

  /* monitoring */
  violations: { path: '/violations/' },
  sosEvents: { path: '/sos-events/' },
  sosChannels: { path: '/sos-channels/' },
  consulateServices: { path: '/consulate-services/' },
  consulateCases: { path: '/consulate-cases/' },
  returnPrograms: { path: '/return-programs/' },

  /* analitika */
  series: { path: '/series/', lookup: 'key' },
  aiInsights: { path: '/ai-insights/' },
  aiSuggestions: { path: '/ai-suggestions/' },
  integrations: { path: '/integrations/' },
  riskWeights: { path: '/risk-weights/' },
  reportTemplates: { path: '/report-templates/' },
  reportArchive: { path: '/report-archive/' },

  /* tizim */
  settings: { path: '/settings/', lookup: 'key' },
  auditLog: { path: '/audit-log/', readOnly: true },

  /* ko'rsatkichlar — bitta jadval, guruh bilan ajratilgan */
  kpis: { path: '/metrics/', group: 'dashboard' },
  consulate: { path: '/metrics/', group: 'consulate' },
  returnStats: { path: '/metrics/', group: 'return' },
  borderStats: { path: '/metrics/', group: 'border' },
  sosStats: { path: '/metrics/', group: 'sos' },
  auditStats: { path: '/metrics/', group: 'audit' },

  /* taqsimotlar */
  composition: { path: '/shares/', group: 'composition' },
  purposes: { path: '/shares/', group: 'purpose' },
  riskDistribution: { path: '/shares/', group: 'risk' },
}

export const COLLECTIONS = Object.keys(ENDPOINTS)

/** Faqat o'qish uchun ochiq to'plamlar */
export const isReadOnly = (name) => !!ENDPOINTS[name]?.readOnly

/* --------------------------------------------------------- moslashtirish */

/** Serverdan kelgan yozuvni frontend ko'rinishiga keltiradi */
export function fromApi(name, row) {
  const config = ENDPOINTS[name]
  const mapped = { ...row }

  /* Barqaror kalit — ro'yxatlar va tahrirlash shu bo'yicha ishlaydi */
  mapped._id = String(row.id)
  /* Detal manzilda ishlatiladigan qiymat */
  mapped._ref = config.lookup ? row[config.lookup] : row.id

  /* SOS murojaatda frontend `id` sifatida murojaat raqamini kutadi */
  if (name === 'sosEvents') mapped.id = row.code

  return mapped
}

/** Frontenddagi yozuvni server kutgan ko'rinishga keltiradi */
export function toApi(name, data) {
  const config = ENDPOINTS[name]
  const payload = { ...data }

  /* Faqat mijozga tegishli maydonlar serverga yuborilmaydi */
  delete payload._id
  delete payload._ref
  delete payload.id

  if (config.group) payload.group = config.group
  if (config.defaults) {
    for (const [key, value] of Object.entries(config.defaults)) {
      if (payload[key] === undefined || payload[key] === '') payload[key] = value
    }
  }

  /* SOS murojaat raqami serverda `code` deb nomlanadi */
  if (name === 'sosEvents' && data.id) payload.code = data.id

  return payload
}

/** Yozuvning detal manzili: `/migrants/12/` */
export function detailPath(name, record) {
  const config = ENDPOINTS[name]
  const reference = record?._ref ?? record?.id
  return `${config.path}${encodeURIComponent(reference)}/`
}

/** Ro'yxat so'rovi uchun filtrlar */
export function listParams(name) {
  const config = ENDPOINTS[name]
  return config.group ? { group: config.group } : {}
}
