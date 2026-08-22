/* ==========================================================================
   Forma sxemalari — RecordModal shu ta'rif asosida forma quradi.
   Har bir maydon: { key, label, type, options, required, span, hint }
   type: text | number | select | bool
   ========================================================================== */
import { db } from '@/stores/db'

/* -------------------------------------------------------- lug'atlar */
const nationalities = ['O‘zbek', 'Qoraqalpoq', 'Tojik', 'Qozoq', 'Rus', 'Tatar', 'Boshqa']
const specialities = ['Quruvchi', 'Payvandchi', 'Haydovchi', 'Oshpaz', 'Tikuvchi', 'Elektrik', 'Hamshira', 'Sotuvchi', 'Dasturchi', 'Boshqa']
const purposeList = ['Ishlash (rasmiy)', 'Ishlash (norasmiy)', 'O‘qish', 'Davolanish', 'Sayohat', 'Doimiy yashash']
const riskLevels = ['Xavf yo‘q', 'Qidiruvda', 'Jazoni o‘tamoqda', 'Bedarak yo‘qolgan']
const remitBands = ['100 $ gacha', '100–300 $', '300+ $']
const tones = ['turk', 'lapis', 'saffron', 'coral', 'violet', 'mist']

const opt = (arr) => arr.map((v) => ({ value: v, label: v }))
const countryOpts = () => db.countries.map((c) => ({ value: c.code, label: `${c.flag} ${c.name}` }))
const regionOpts = () => db.regions.map((r) => ({ value: r.name, label: r.name }))

/** Davlat kodidan nom va bayroqni to'ldiradi */
const withCountry = (v) => {
  const c = db.countries.find((x) => x.code === v.countryCode)
  return c ? { ...v, country: c.name, flag: c.flag } : v
}

/* ------------------------------------------------------------ sxemalar */
export const schemas = {
  migrants: {
    label: 'Migrant',
    title: { add: 'Yangi migrant qo‘shish', edit: 'Migrant ma’lumotini tahrirlash' },
    derive: withCountry,
    defaults: () => ({
      gender: 'Erkak',
      nationality: 'O‘zbek',
      purpose: 'Ishlash (rasmiy)',
      remit: '100–300 $',
      risk: 'Xavf yo‘q',
      score: 12,
      convicted: false,
      countryCode: db.countries[0]?.code,
    }),
    fields: [
      { key: 'name', label: 'F.I.Sh', type: 'text', required: true, span: 2, placeholder: 'Karimov Jasur' },
      { key: 'pinfl', label: 'PINFL', type: 'text', required: true, pattern: '^\\d{14}$', hint: '14 ta raqam' },
      { key: 'phone', label: 'Telefon', type: 'text', placeholder: '+998 90 123-45-67' },
      { key: 'nationality', label: 'Millati', type: 'select', options: opt(nationalities) },
      { key: 'gender', label: 'Jinsi', type: 'select', options: opt(['Erkak', 'Ayol', 'Voyaga yetmagan']) },
      { key: 'speciality', label: 'Mutaxassisligi', type: 'select', options: opt(specialities) },
      { key: 'marital', label: 'Oilaviy ahvoli', type: 'select', options: opt(['Uylangan', 'Turmush qurmagan', 'Ajrashgan']) },
      { key: 'health', label: 'Sog‘lig‘i', type: 'select', options: opt(['Sog‘lom', 'Surunkali kasallik', 'Nogironlik']) },
      { key: 'convicted', label: 'Sudlangan', type: 'bool' },
      { key: 'countryCode', label: 'Qabul qiluvchi davlat', type: 'select', options: countryOpts, required: true },
      { key: 'region', label: 'Chiqqan hududi', type: 'select', options: regionOpts, required: true },
      { key: 'purpose', label: 'Chiqish maqsadi', type: 'select', options: opt(purposeList) },
      { key: 'exitDate', label: 'Chiqish sanasi', type: 'text', placeholder: '12.03.2026' },
      { key: 'employer', label: 'Ish beruvchi', type: 'text', span: 2 },
      { key: 'address', label: 'Xorijdagi manzil', type: 'text', span: 2 },
      { key: 'remit', label: 'Pul jo‘natmalari', type: 'select', options: opt(remitBands) },
      { key: 'risk', label: 'Holati', type: 'select', options: opt(riskLevels) },
      { key: 'score', label: 'Risk Score', type: 'number', min: 0, max: 100, hint: '0–100' },
    ],
  },

  countries: {
    label: 'Davlat',
    title: { add: 'Yangi davlat qo‘shish', edit: 'Davlat ma’lumotini tahrirlash' },
    defaults: () => ({ flag: '🏳️', angle: 0, dist: 1000, risk: 30, total: 0, out: 0, back: 0, remit: 0, wanted: 0, missing: 0 }),
    fields: [
      { key: 'code', label: 'Kod', type: 'text', required: true, hint: 'ISO-2, masalan RU' },
      { key: 'name', label: 'Nomi', type: 'text', required: true },
      { key: 'flag', label: 'Bayroq', type: 'text', hint: 'emoji' },
      { key: 'hub', label: 'Asosiy shahar', type: 'text', required: true },
      { key: 'lat', label: 'Kenglik (lat)', type: 'number', step: 0.01, required: true },
      { key: 'lng', label: 'Uzunlik (lng)', type: 'number', step: 0.01, required: true },
      { key: 'angle', label: 'Yo‘nalish burchagi', type: 'number', hint: 'sxema uchun, 0–360' },
      { key: 'dist', label: 'Masofa (km)', type: 'number' },
      { key: 'total', label: 'Jami migrantlar', type: 'number' },
      { key: 'out', label: 'Chiqqanlar', type: 'number' },
      { key: 'back', label: 'Qaytganlar', type: 'number' },
      { key: 'remit', label: 'Jo‘natma (mln $)', type: 'number' },
      { key: 'risk', label: 'Xavf darajasi', type: 'number', min: 0, max: 100 },
      { key: 'wanted', label: 'Qidiruvdagilar', type: 'number' },
      { key: 'missing', label: 'Bedarak yo‘qolganlar', type: 'number' },
    ],
  },

  regions: {
    label: 'Hudud',
    title: { add: 'Yangi hudud qo‘shish', edit: 'Hudud ma’lumotini tahrirlash' },
    defaults: () => ({ out: 0, back: 0, risk: 30 }),
    fields: [
      { key: 'name', label: 'Hudud nomi', type: 'text', required: true, span: 2 },
      { key: 'lat', label: 'Kenglik (lat)', type: 'number', step: 0.01, required: true },
      { key: 'lng', label: 'Uzunlik (lng)', type: 'number', step: 0.01, required: true },
      { key: 'out', label: 'Chiqqanlar', type: 'number' },
      { key: 'back', label: 'Qaytganlar', type: 'number' },
      { key: 'risk', label: 'Xavf darajasi', type: 'number', min: 0, max: 100 },
    ],
  },

  districts: {
    label: 'Tuman',
    title: { add: 'Yangi tuman qo‘shish', edit: 'Tuman ko‘rsatkichlarini tahrirlash' },
    defaults: () => ({ out: 0, back: 0, risk: 30 }),
    fields: [
      {
        key: 'name', label: 'Tuman nomi', type: 'text', required: true, span: 2,
        hint: 'chegara chizmasidagi nom bilan bir xil bo‘lishi kerak',
      },
      { key: 'out', label: 'Chiqqanlar', type: 'number' },
      { key: 'back', label: 'Qaytganlar', type: 'number' },
      { key: 'risk', label: 'Xavf darajasi', type: 'number', min: 0, max: 100, span: 2 },
    ],
  },

  employers: {
    label: 'Ish beruvchi',
    title: { add: 'Yangi ish beruvchi qo‘shish', edit: 'Ish beruvchini tahrirlash' },
    derive: (v) => ({
      ...v,
      countries: String(v.countries || '').split(',').map((s) => s.trim()).filter(Boolean),
    }),
    toForm: (r) => ({ ...r, countries: Array.isArray(r.countries) ? r.countries.join(', ') : r.countries }),
    defaults: () => ({ status: 'Kuzatuvda', sent: 0, formal: 60, remit: 0 }),
    fields: [
      { key: 'name', label: 'Kompaniya nomi', type: 'text', required: true, span: 2 },
      { key: 'dir', label: 'Yo‘nalishi', type: 'select', required: true, options: opt(['Qurilish', 'Logistika', 'Servis', 'Yengil sanoat', 'Qishloq xo‘jaligi', 'IT', 'Tibbiyot', 'Boshqa']) },
      { key: 'status', label: 'Holati', type: 'select', options: opt(['Tasdiqlangan', 'Kuzatuvda', 'Cheklangan']) },
      { key: 'countries', label: 'Davlatlar', type: 'text', span: 2, hint: 'vergul bilan ajrating', placeholder: 'Rossiya, Qozog‘iston' },
      { key: 'sent', label: 'Yuborilgan migrantlar', type: 'number' },
      { key: 'formal', label: 'Rasmiy shartnoma (%)', type: 'number', min: 0, max: 100 },
      { key: 'remit', label: 'Jo‘natma (mln $)', type: 'number' },
    ],
  },

  borderPoints: {
    label: 'O‘tkazish punkti',
    title: { add: 'Yangi o‘tkazish punkti', edit: 'Punktni tahrirlash' },
    defaults: () => ({ out: 0, in: 0, load: 40 }),
    fields: [
      { key: 'name', label: 'Punkt nomi', type: 'text', required: true, span: 2 },
      { key: 'out', label: 'Chiqish (bugun)', type: 'number' },
      { key: 'in', label: 'Kirish (bugun)', type: 'number' },
      { key: 'load', label: 'Yuklama (%)', type: 'number', min: 0, max: 100, span: 2 },
    ],
  },

  roles: {
    label: 'Rol',
    title: { add: 'Yangi rol yaratish', edit: 'Rolni tahrirlash' },
    defaults: () => ({ count: 0, tone: 'lapis' }),
    fields: [
      { key: 'name', label: 'Rol nomi', type: 'text', required: true, span: 2 },
      { key: 'scope', label: 'Ko‘lami', type: 'text', required: true, span: 2, placeholder: 'O‘z viloyati' },
      { key: 'count', label: 'Foydalanuvchilar', type: 'number' },
      { key: 'tone', label: 'Rangi', type: 'select', options: opt(tones) },
    ],
  },

  violations: {
    label: 'Qonunbuzilish turi',
    title: { add: 'Yangi qonunbuzilish turi', edit: 'Turni tahrirlash' },
    derive: (v) => ({
      ...v,
      key: v.key || String(v.label || '').toLowerCase().replace(/\s+/g, '').slice(0, 10),
    }),
    defaults: () => ({ value: 0, delta: 0, tone: 'coral' }),
    fields: [
      { key: 'label', label: 'Turi', type: 'text', required: true, span: 2 },
      { key: 'value', label: 'Holatlar soni', type: 'number' },
      { key: 'delta', label: 'O‘zgarish (%)', type: 'number', step: 0.1, hint: 'manfiy — pasayish' },
      { key: 'tone', label: 'Rangi', type: 'select', options: opt(tones), span: 2 },
    ],
  },

  sosEvents: {
    label: 'SOS murojaat',
    title: { add: 'Qo‘lda SOS murojaat qo‘shish', edit: 'Murojaatni tahrirlash' },
    derive: (v) => {
      const c = db.countries.find((x) => x.code === v.countryCode)
      return {
        ...v,
        country: c?.name ?? v.country,
        flag: c?.flag ?? v.flag,
        lat: v.lat ?? c?.lat,
        lng: v.lng ?? c?.lng,
        id: v.id || `SOS-${1000 + db.sosEvents.length}`,
      }
    },
    defaults: () => ({ severity: 'high', minutesAgo: 0, countryCode: db.countries[0]?.code }),
    fields: [
      { key: 'name', label: 'Murojaatchi F.I.Sh', type: 'text', required: true, span: 2 },
      {
        key: 'type', label: 'Murojaat turi', type: 'select', required: true, span: 2,
        options: opt([
          'Hujjat musodara qilingan', 'Ish haqi to‘lanmagan', 'Tibbiy yordam kerak',
          'Majburiy mehnat belgilari', 'Bog‘lanish uzilgan', 'Qamoqqa olingan',
          'Uy-joydan chiqarilgan', 'Yo‘lkira uchun mablag‘ yo‘q',
        ]),
      },
      {
        key: 'severity', label: 'Jiddiyligi', type: 'select',
        options: [
          { value: 'critical', label: 'Kritik' }, { value: 'high', label: 'Shoshilinch' },
          { value: 'mid', label: 'O‘rta' }, { value: 'low', label: 'Past' },
        ],
      },
      { key: 'countryCode', label: 'Davlat', type: 'select', options: countryOpts, required: true },
      { key: 'city', label: 'Shahar', type: 'text', required: true },
      { key: 'phone', label: 'Telefon', type: 'text', placeholder: '+998 90 *** ** 12' },
      { key: 'lat', label: 'Kenglik (lat)', type: 'number', step: 0.01, nullable: true, hint: 'bo‘sh qolsa — davlat markazi' },
      { key: 'lng', label: 'Uzunlik (lng)', type: 'number', step: 0.01, nullable: true },
    ],
  },
}

/* ================================================== ko'rsatkich to'plamlari */

const toneField = { key: 'tone', label: 'Rangi', type: 'select', options: opt(tones) }

const kpiFields = [
  { key: 'label', label: 'Ko‘rsatkich nomi', type: 'text', required: true, span: 2 },
  { key: 'value', label: 'Qiymati', type: 'number' },
  { key: 'delta', label: 'O‘zgarish (%)', type: 'number', step: 0.1, hint: 'manfiy — pasayish' },
  { key: 'sub', label: 'Izoh', type: 'text', span: 2, placeholder: 'joriy yil boshidan' },
  { ...toneField, span: 2 },
]

schemas.kpis = {
  label: 'Asosiy ko‘rsatkich',
  title: { add: 'Yangi KPI qo‘shish', edit: 'KPI ni tahrirlash' },
  derive: (v) => ({ ...v, key: v.key || String(v.label || '').toLowerCase().replace(/\s+/g, '').slice(0, 10) }),
  defaults: () => ({ value: 0, delta: 0, tone: 'lapis', sub: '' }),
  fields: kpiFields,
}

for (const name of ['borderStats', 'sosStats', 'auditStats']) {
  schemas[name] = {
    label: 'Ko‘rsatkich',
    title: { add: 'Yangi ko‘rsatkich qo‘shish', edit: 'Ko‘rsatkichni tahrirlash' },
    defaults: () => ({ value: 0, delta: 0, tone: 'lapis', sub: '' }),
    fields: kpiFields,
  }
}

schemas.consulate = {
  label: 'Konsullik ko‘rsatkichi',
  title: { add: 'Yangi ko‘rsatkich', edit: 'Ko‘rsatkichni tahrirlash' },
  defaults: () => ({ value: 0, delta: 0, tone: 'lapis' }),
  fields: kpiFields.filter((f) => f.key !== 'sub'),
}

schemas.returnStats = {
  label: 'Qaytish ko‘rsatkichi',
  title: { add: 'Yangi ko‘rsatkich', edit: 'Ko‘rsatkichni tahrirlash' },
  defaults: () => ({ value: 0, delta: 0, tone: 'turk' }),
  fields: kpiFields.filter((f) => f.key !== 'sub'),
}

const shareFields = [
  { key: 'label', label: 'Nomi', type: 'text', required: true, span: 2 },
  { key: 'value', label: 'Qiymati', type: 'number' },
  toneField,
]

schemas.composition = {
  label: 'Tarkib ko‘rsatkichi',
  title: { add: 'Yangi tarkib bo‘limi', edit: 'Bo‘limni tahrirlash' },
  derive: (v) => ({ ...v, key: v.key || String(v.label || '').toLowerCase().replace(/\s+/g, '').slice(0, 10) }),
  defaults: () => ({ value: 0, tone: 'lapis' }),
  fields: shareFields,
}

schemas.purposes = {
  label: 'Chiqish maqsadi',
  title: { add: 'Yangi maqsad qo‘shish', edit: 'Maqsadni tahrirlash' },
  defaults: () => ({ value: 0, tone: 'lapis' }),
  fields: shareFields,
}

schemas.riskDistribution = {
  label: 'Xavf darajasi',
  title: { add: 'Yangi daraja qo‘shish', edit: 'Darajani tahrirlash' },
  defaults: () => ({ value: 0, tone: 'saffron' }),
  fields: shareFields,
}

schemas.consulateServices = {
  label: 'Konsullik xizmati',
  title: { add: 'Yangi xizmat turi', edit: 'Xizmat turini tahrirlash' },
  defaults: () => ({ value: 0, tone: 'lapis' }),
  fields: shareFields,
}

/* ------------------------------------------------------- 12 oylik qatorlar */
schemas.series = {
  label: 'Grafik qatori',
  title: { add: 'Yangi qator qo‘shish', edit: 'Qator qiymatlarini tahrirlash' },
  derive: (v) => ({ ...v, key: v.key || String(v.name || '').toLowerCase().replace(/\s+/g, '').slice(0, 10) }),
  defaults: () => ({ color: 'var(--turk)', values: Array(12).fill(0) }),
  fields: [
    { key: 'name', label: 'Qator nomi', type: 'text', required: true, span: 2 },
    {
      key: 'color', label: 'Rangi', type: 'select', span: 2,
      options: tones.map((t) => ({ value: `var(--${t})`, label: t })),
    },
    { key: 'values', label: 'Oylik qiymatlar', type: 'series', span: 2 },
  ],
}

/* ------------------------------------------------------------ AI panellari */
schemas.aiInsights = {
  label: 'AI insayt',
  title: { add: 'Yangi insayt qo‘shish', edit: 'Insaytni tahrirlash' },
  defaults: () => ({ tag: 'PROGNOZ', tone: 'lapis', confidence: 80 }),
  fields: [
    { key: 'title', label: 'Sarlavha', type: 'text', required: true, span: 2 },
    { key: 'body', label: 'Tavsif', type: 'textarea', required: true, span: 2 },
    { key: 'action', label: 'Tavsiya etilgan chora', type: 'text', span: 2 },
    { key: 'tag', label: 'Belgi', type: 'select', options: opt(['O‘SISH', 'ANOMALIYA', 'PROGNOZ', 'IJOBIY', 'OGOHLANTIRISH']) },
    toneField,
    { key: 'confidence', label: 'Ishonch (%)', type: 'number', min: 0, max: 100, span: 2 },
  ],
}

schemas.aiSuggestions = {
  label: 'Tayyor savol',
  title: { add: 'Yangi savol qo‘shish', edit: 'Savolni tahrirlash' },
  defaults: () => ({ text: '' }),
  fields: [{ key: 'text', label: 'Savol matni', type: 'textarea', required: true, span: 2 }],
}

/* --------------------------------------------------- ro'yxatlar va manbalar */
schemas.integrations = {
  label: 'Integratsiya',
  title: { add: 'Yangi tashqi tizim', edit: 'Tizimni tahrirlash' },
  defaults: () => ({ status: 'Rejada' }),
  fields: [
    { key: 'name', label: 'Tizim nomi', type: 'text', required: true, span: 2 },
    { key: 'status', label: 'Holati', type: 'select', span: 2, options: opt(['Ulangan', 'Sinovda', 'Rejada']) },
  ],
}

schemas.borderSources = {
  label: 'Ma’lumot manbai',
  title: { add: 'Yangi manba qo‘shish', edit: 'Manbani tahrirlash' },
  defaults: () => ({ status: 'ulangan' }),
  fields: [
    { key: 'name', label: 'Manba nomi', type: 'text', required: true, span: 2 },
    { key: 'status', label: 'Holati', type: 'select', span: 2, options: opt(['ulangan', 'sinovda', 'rejada']) },
  ],
}

schemas.sosChannels = {
  label: 'SOS kanali',
  title: { add: 'Yangi kanal qo‘shish', edit: 'Kanalni tahrirlash' },
  defaults: () => ({ share: 0, icon: 'phone' }),
  fields: [
    { key: 'name', label: 'Kanal nomi', type: 'text', required: true, span: 2 },
    { key: 'share', label: 'Ulushi (%)', type: 'number', min: 0, max: 100 },
    { key: 'icon', label: 'Belgisi', type: 'select', options: opt(['spark', 'phone', 'stamp', 'globe', 'bell', 'plug', 'siren']) },
  ],
}

schemas.returnPrograms = {
  label: 'Reintegratsiya dasturi',
  title: { add: 'Yangi dastur qo‘shish', edit: 'Dasturni tahrirlash' },
  defaults: () => ({ done: 0, target: 1000, tone: 'lapis' }),
  fields: [
    { key: 'name', label: 'Dastur nomi', type: 'text', required: true, span: 2 },
    { key: 'done', label: 'Bajarildi', type: 'number' },
    { key: 'target', label: 'Maqsad', type: 'number', min: 1 },
    { ...toneField, span: 2 },
  ],
}

schemas.riskWeights = {
  label: 'Model omili',
  title: { add: 'Yangi omil qo‘shish', edit: 'Omilni tahrirlash' },
  derive: (v) => ({ ...v, key: v.key || String(v.label || '').toLowerCase().replace(/\s+/g, '').slice(0, 10) }),
  defaults: () => ({ w: 10 }),
  fields: [
    { key: 'label', label: 'Omil nomi', type: 'text', required: true, span: 2 },
    { key: 'w', label: 'Vazni (%)', type: 'number', min: 0, max: 100, span: 2 },
  ],
}

/* ----------------------------------------------------------- hisobotlar */
schemas.reportTemplates = {
  label: 'Hisobot shabloni',
  title: { add: 'Yangi shablon qo‘shish', edit: 'Shablonni tahrirlash' },
  defaults: () => ({ period: 'Oylik', fmt: 'XLSX, PDF', tone: 'lapis' }),
  fields: [
    { key: 'name', label: 'Shablon nomi', type: 'text', required: true, span: 2 },
    { key: 'desc', label: 'Tavsifi', type: 'textarea', span: 2 },
    { key: 'period', label: 'Davriyligi', type: 'select', options: opt(['Kunlik', 'Haftalik', 'Oylik', 'Choraklik', 'Yillik']) },
    toneField,
    { key: 'fmt', label: 'Formatlar', type: 'text', span: 2, hint: 'vergul bilan ajrating', placeholder: 'XLSX, PDF' },
  ],
}

schemas.reportArchive = {
  label: 'Arxiv yozuvi',
  title: { add: 'Arxivga qo‘shish', edit: 'Arxiv yozuvini tahrirlash' },
  defaults: () => ({ size: '1.0 MB', by: 'admin.root' }),
  fields: [
    { key: 'name', label: 'Hisobot nomi', type: 'text', required: true, span: 2 },
    { key: 'size', label: 'Hajmi', type: 'text' },
    { key: 'at', label: 'Sanasi', type: 'text', placeholder: '02.08.2026' },
    { key: 'by', label: 'Kim shakllantirgan', type: 'text', span: 2 },
  ],
}

/* --------------------------------------------------------- audit jurnali */
schemas.auditLog = {
  label: 'Audit yozuvi',
  title: { add: 'Jurnalga yozuv qo‘shish', edit: 'Jurnal yozuvini tahrirlash' },
  defaults: () => ({ ok: true, ip: '92.63.14.7' }),
  fields: [
    { key: 'action', label: 'Amal', type: 'text', required: true, span: 2 },
    { key: 'user', label: 'Foydalanuvchi', type: 'text', required: true },
    { key: 'role', label: 'Roli', type: 'text' },
    { key: 'at', label: 'Vaqti', type: 'text', placeholder: '14:20' },
    { key: 'ip', label: 'IP manzil', type: 'text' },
    { key: 'ok', label: 'Muvaffaqiyatli', type: 'bool', span: 2 },
  ],
}

/* ------------------------------------------------------ tizim sozlamalari */
schemas.settings = {
  label: 'Sozlama',
  title: { add: 'Yangi sozlama', edit: 'Sozlamani tahrirlash' },
  defaults: () => ({ kind: 'switch', on: false }),
  fields: [
    { key: 'label', label: 'Sozlama nomi', type: 'text', required: true, span: 2 },
    { key: 'hint', label: 'Izoh', type: 'text', span: 2 },
    { key: 'kind', label: 'Turi', type: 'select', options: [{ value: 'switch', label: 'Yoqish/o‘chirish' }, { value: 'number', label: 'Raqamli qiymat' }] },
    { key: 'value', label: 'Qiymati', type: 'number', nullable: true, hint: 'faqat raqamli sozlama uchun' },
    { key: 'on', label: 'Yoqilgan', type: 'bool', span: 2 },
  ],
}

/** Sxema bo'yicha bo'sh forma modeli */
export function blankModel(name) {
  const s = schemas[name]
  const empty = (f) => {
    if (f.type === 'bool') return false
    if (f.type === 'number') return null
    if (f.type === 'series') return Array(12).fill(0)
    return ''
  }
  const base = Object.fromEntries(s.fields.map((f) => [f.key, empty(f)]))
  return { ...base, ...(s.defaults?.() ?? {}) }
}

/** Mavjud yozuvni forma modeliga aylantiradi */
export function toFormModel(name, row) {
  const s = schemas[name]
  const src = s.toForm ? s.toForm(row) : row
  const pick = (f) => (f.type === 'series' ? [...(src[f.key] || [])] : src[f.key])
  return { ...blankModel(name), ...Object.fromEntries(s.fields.map((f) => [f.key, pick(f)])) }
}
