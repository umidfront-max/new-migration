/* ==========================================================================
   Sahifa → kerakli ma'lumot.

   Ilova ishga tushganda barcha endpointga so'rov yuborilmaydi. Faqat
   ochilgan sahifa uchun kerak bo'lgan to'plamlar so'raladi, bir marta
   olingan to'plam esa qayta so'ralmaydi (`db.js` dagi kesh).

   Ro'yxatga sahifaning o'zi ko'rsatadigan to'plamlar ham, "Qo'shish /
   Tahrirlash" oynasidagi select variantlari uchun kerak bo'lganlar ham
   kiradi — masalan migrant formasida davlatlar ro'yxati.

   `SUMMARY` — `/dashboard/summary/` uchun maxsus nom (to'plam emas).
   ========================================================================== */

/** Yig'ma ko'rsatkichlar uchun soxta to'plam nomi */
export const SUMMARY = 'summary'

/**
 * Har bir sahifada kerak bo'ladigan ma'lumot:
 * yon paneldagi hudud filtri (`regions`) va bildirishnomalar (`sosEvents`).
 */
export const CORE = ['regions', 'sosEvents']

/** Yo'l → to'plamlar. Yo'l ro'yxatda bo'lmasa faqat `CORE` yuklanadi. */
export const PAGE_DATA = {
  /* Boshqaruv paneli — KPI, hududlar chizmasi, grafiklar, tarkib */
  '/': ['kpis', 'districts', 'series', 'composition', 'purposes', 'violations', 'settings', SUMMARY],

  /* Migrantlar reyestri — jadval + forma uchun davlatlar */
  '/registry': ['migrants', 'countries'],

  /* Chegara monitoringi */
  '/border': ['borderStats', 'borderPoints', 'borderSources', 'series'],

  /* Davlatlar xaritasi */
  '/countries': ['countries', 'purposes'],

  /* Ish beruvchilar — formada davlat nomlari tanlanadi */
  '/employers': ['employers', 'countries', SUMMARY],

  /* Qonunbuzilishlar */
  '/violations': ['violations', 'countries'],

  /* SOS xizmati — murojaat formasida davlat tanlanadi */
  '/sos': ['sosStats', 'sosChannels', 'series', 'countries'],

  /* Konsullik kabineti */
  '/consulate': ['consulate', 'consulateServices', 'consulateCases', 'countries'],

  /* Qaytish monitoringi */
  '/return': ['returnStats', 'returnPrograms', 'series'],

  /* AI Risk Score */
  '/risk': ['migrants', 'countries', 'riskDistribution', 'riskWeights', 'settings', SUMMARY],

  /* AI tahlil */
  '/ai': ['aiInsights', 'aiSuggestions', 'composition', 'integrations', 'series', SUMMARY],

  /* Administrator paneli */
  '/admin': ['roles', 'settings', 'integrations'],

  /* Foydalanuvchilar — formada rol tanlanadi */
  '/users': ['users', 'roles'],

  /* Audit va jurnal */
  '/audit': ['auditStats', 'auditLog'],

  /* Hisobot va eksport */
  '/reports': ['reportTemplates', 'reportArchive'],
}

/** Yo'l uchun to'liq ro'yxat: umumiy ma'lumot + sahifaning o'zi */
export function dataFor(path) {
  return [...new Set([...CORE, ...(PAGE_DATA[path] || [])])]
}
