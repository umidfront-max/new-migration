/* ==========================================================================
   Demo ma'lumotlar — ILOVADA ISHLATILMAYDI.

   Ilova barcha ma'lumotni backend API'dan oladi (src/stores/db.js).
   Bu fayl faqat backend uchun boshlang'ich ma'lumot manbai bo'lib qoldi:
   `node scripts/export_seed.mjs` uni o'qib `seed/demo_seed.json` yasaydi.
   ========================================================================== */

/* Deterministik psevdo-tasodif — har safar bir xil natija */
let _s = 20260822
const rnd = () => ((_s = (_s * 1664525 + 1013904223) % 4294967296) / 4294967296)
const pick = (a) => a[Math.floor(rnd() * a.length)]
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1))

/* ------------------------------------------------------------ KPI */
export const kpis = [
  { key: 'total', label: 'Jami migrantlar', value: 2148630, delta: 3.4, tone: 'lapis', sub: 'reyestrda ro‘yxatda' },
  { key: 'out', label: 'Chiqqanlar', value: 486210, delta: 6.1, tone: 'turk', sub: 'joriy yil boshidan' },
  { key: 'back', label: 'Qaytganlar', value: 312884, delta: -1.8, tone: 'saffron', sub: 'joriy yil boshidan' },
  { key: 'sos', label: 'SOS chaqiruvlar', value: 1247, delta: 12.5, tone: 'coral', sub: 'oxirgi 30 kun' },
]

export const composition = [
  { key: 'men', label: 'Erkaklar', value: 1712904, tone: 'lapis' },
  { key: 'women', label: 'Ayollar', value: 401318, tone: 'violet' },
  { key: 'minor', label: 'Voyaga yetmaganlar', value: 34408, tone: 'saffron' },
  { key: 'jobless', label: 'Ishsiz migrantlar', value: 187420, tone: 'coral' },
]

/* ------------------------------------------------- 12 oylik dinamika */
export const months = ['Sen', 'Okt', 'Noy', 'Dek', 'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg']

/* Barcha 12 oylik qatorlar bitta tahrirlanadigan to‘plamda */
export const series = [
  {
    key: 'out',
    name: 'Chiqqanlar',
    color: 'var(--turk)',
    values: [34120, 31880, 28940, 26110, 29760, 33450, 41230, 47890, 52410, 49870, 44320, 40180],
  },
  {
    key: 'back',
    name: 'Qaytganlar',
    color: 'var(--saffron)',
    values: [21440, 23980, 27310, 31220, 28640, 25110, 22870, 21340, 23990, 27460, 30120, 32980],
  },
  {
    key: 'remit',
    name: 'Pul jo‘natmalari (mln $)',
    color: 'var(--lapis)',
    values: [742, 698, 651, 610, 588, 634, 781, 902, 1014, 986, 918, 864],
  },
  {
    key: 'sos',
    name: 'SOS chaqiruvlar',
    color: 'var(--coral)',
    values: [78, 84, 91, 76, 68, 72, 88, 102, 128, 141, 119, 104],
  },
]

/* ------------------------------------------------------- Davlatlar */
/* angle — Toshkentdan yo‘nalish (gradus, 0 = shimol), dist — taxminiy km,
   lat/lng — asosiy qabul qiluvchi shahar koordinatasi (GIS xarita uchun) */
export const countries = [
  { code: 'RU', name: 'Rossiya', flag: '🇷🇺', angle: 330, dist: 2900, lat: 55.75, lng: 37.62, hub: 'Moskva', total: 1184300, out: 268400, back: 171200, risk: 62, remit: 4820, wanted: 1420, missing: 312, work: 214800, study: 8400, medical: 5100, residence: 21600, travel: 18500, jailed: 2840, remitCount: 1180 },
  { code: 'KZ', name: 'Qozog‘iston', flag: '🇰🇿', angle: 6, dist: 1180, lat: 43.24, lng: 76.89, hub: 'Almati', total: 214600, out: 61200, back: 48900, risk: 38, remit: 610, wanted: 210, missing: 44, work: 44100, study: 4900, medical: 2600, residence: 5200, travel: 4400, jailed: 310, remitCount: 248 },
  { code: 'TR', name: 'Turkiya', flag: '🇹🇷', angle: 262, dist: 3180, lat: 41.01, lng: 28.98, hub: 'Istanbul', total: 186400, out: 42800, back: 29400, risk: 54, remit: 720, wanted: 388, missing: 96, work: 28600, study: 6900, medical: 1900, residence: 2900, travel: 2500, jailed: 520, remitCount: 196 },
  { code: 'KR', name: 'Janubiy Koreya', flag: '🇰🇷', angle: 78, dist: 5100, lat: 37.57, lng: 126.98, hub: 'Seul', total: 92300, out: 24100, back: 15600, risk: 24, remit: 980, wanted: 62, missing: 11, work: 19400, study: 2200, medical: 480, residence: 1100, travel: 920, jailed: 74, remitCount: 164 },
  { code: 'AE', name: 'BAA', flag: '🇦🇪', angle: 218, dist: 2380, lat: 25.20, lng: 55.27, hub: 'Dubay', total: 74800, out: 21400, back: 14200, risk: 31, remit: 540, wanted: 88, missing: 19, work: 17200, study: 980, medical: 760, residence: 1400, travel: 1060, jailed: 118, remitCount: 132 },
  { code: 'KG', name: 'Qirg‘iziston', flag: '🇰🇬', angle: 100, dist: 480, lat: 42.87, lng: 74.59, hub: 'Bishkek', total: 51200, out: 18600, back: 17100, risk: 27, remit: 130, wanted: 41, missing: 7, work: 13800, study: 1900, medical: 640, residence: 1300, travel: 960, jailed: 58, remitCount: 61 },
  { code: 'DE', name: 'Germaniya', flag: '🇩🇪', angle: 288, dist: 4700, lat: 52.52, lng: 13.40, hub: 'Berlin', total: 38400, out: 9800, back: 4100, risk: 21, remit: 410, wanted: 34, missing: 6, work: 5600, study: 2400, medical: 380, residence: 980, travel: 440, jailed: 41, remitCount: 74 },
  { code: 'PL', name: 'Polsha', flag: '🇵🇱', angle: 302, dist: 4120, lat: 52.23, lng: 21.01, hub: 'Varshava', total: 34900, out: 11200, back: 6800, risk: 29, remit: 280, wanted: 47, missing: 9, work: 8400, study: 1200, medical: 290, residence: 880, travel: 430, jailed: 63, remitCount: 58 },
  { code: 'SA', name: 'Saudiya Arabistoni', flag: '🇸🇦', angle: 238, dist: 3300, lat: 24.71, lng: 46.68, hub: 'Ar-Riyod', total: 28600, out: 8400, back: 5900, risk: 44, remit: 240, wanted: 71, missing: 22, work: 6200, study: 640, medical: 310, residence: 740, travel: 510, jailed: 96, remitCount: 44 },
  { code: 'JP', name: 'Yaponiya', flag: '🇯🇵', angle: 62, dist: 6120, lat: 35.68, lng: 139.69, hub: 'Tokio', total: 19700, out: 6100, back: 3200, risk: 18, remit: 310, wanted: 12, missing: 3, work: 4300, study: 1100, medical: 180, residence: 340, travel: 180, jailed: 14, remitCount: 38 },
  { code: 'US', name: 'AQSH', flag: '🇺🇸', angle: 344, dist: 10400, lat: 40.71, lng: -74.01, hub: 'Nyu-York', total: 16200, out: 4200, back: 1400, risk: 22, remit: 390, wanted: 18, missing: 4, work: 2600, study: 760, medical: 140, residence: 560, travel: 140, jailed: 21, remitCount: 31 },
  { code: 'GB', name: 'Buyuk Britaniya', flag: '🇬🇧', angle: 314, dist: 5300, lat: 51.51, lng: -0.13, hub: 'London', total: 11900, out: 3100, back: 1200, risk: 25, remit: 190, wanted: 15, missing: 2, work: 1900, study: 680, medical: 110, residence: 310, travel: 100, jailed: 18, remitCount: 24 },
]

/** Toshkent — barcha oqimlarning boshlanish nuqtasi */
export const origin = { name: 'Toshkent', lat: 41.31, lng: 69.24 }

/* --------------------------------------------------------- Hududlar */
export const regions = [
  { name: 'Samarqand', lat: 39.65, lng: 66.96, out: 68400, back: 41200, risk: 47 },
  { name: 'Farg‘ona', lat: 40.39, lng: 71.78, out: 64100, back: 39800, risk: 52 },
  { name: 'Andijon', lat: 40.78, lng: 72.34, out: 58900, back: 36400, risk: 55 },
  { name: 'Namangan', lat: 40.99, lng: 71.67, out: 54200, back: 33100, risk: 58 },
  { name: 'Qashqadaryo', lat: 38.86, lng: 65.79, out: 47600, back: 28900, risk: 41 },
  { name: 'Surxondaryo', lat: 37.22, lng: 67.28, out: 41300, back: 25700, risk: 49 },
  { name: 'Buxoro', lat: 39.77, lng: 64.42, out: 32800, back: 21400, risk: 34 },
  { name: 'Toshkent viloyati', lat: 40.90, lng: 69.90, out: 31200, back: 22800, risk: 30 },
  { name: 'Jizzax', lat: 40.12, lng: 67.84, out: 24600, back: 15900, risk: 38 },
  { name: 'Xorazm', lat: 41.55, lng: 60.63, out: 23100, back: 14700, risk: 36 },
  { name: 'Navoiy', lat: 40.10, lng: 65.37, out: 18400, back: 12100, risk: 26 },
  { name: 'Sirdaryo', lat: 40.49, lng: 68.78, out: 14900, back: 9800, risk: 29 },
  { name: 'Qoraqalpog‘iston', lat: 42.46, lng: 59.61, out: 13800, back: 8400, risk: 44 },
  { name: 'Toshkent shahri', lat: 41.31, lng: 69.24, out: 12900, back: 10600, risk: 22 },
]

/* --------------------------------------------------- Chiqish maqsadi */
export const purposes = [
  { label: 'Ishlash (rasmiy)', value: 214800, tone: 'turk' },
  { label: 'Ishlash (norasmiy)', value: 168400, tone: 'coral' },
  { label: 'O‘qish', value: 42100, tone: 'lapis' },
  { label: 'Sayohat', value: 31600, tone: 'violet' },
  { label: 'Davolanish', value: 18200, tone: 'saffron' },
  { label: 'Doimiy yashash', value: 11100, tone: 'mist' },
]

/* ---------------------------------------------------- Qonunbuzilishlar */
export const violations = [
  { key: 'deport', label: 'Deportatsiya', value: 8412, delta: 4.2, tone: 'coral' },
  { key: 'illegal', label: 'Noqonuniy migratsiya', value: 3186, delta: -2.1, tone: 'saffron' },
  { key: 'border', label: 'Chegara buzilishi', value: 1974, delta: 8.7, tone: 'saffron' },
  { key: 'forgery', label: 'Qalbaki hujjat', value: 1142, delta: 1.4, tone: 'violet' },
  { key: 'traffic', label: 'Odam savdosi', value: 486, delta: -6.3, tone: 'coral' },
  { key: 'recruit', label: 'Yollanish', value: 312, delta: 11.2, tone: 'coral' },
  { key: 'extremism', label: 'Ekstremizm', value: 208, delta: -4.8, tone: 'coral' },
  { key: 'terror', label: 'Terrorizm', value: 47, delta: -12.4, tone: 'coral' },
]

/* ----------------------------------------------------------- SOS oqim */
const sosTypes = [
  { t: 'Hujjat musodara qilingan', sev: 'high' },
  { t: 'Ish haqi to‘lanmagan', sev: 'mid' },
  { t: 'Tibbiy yordam kerak', sev: 'high' },
  { t: 'Majburiy mehnat belgilari', sev: 'critical' },
  { t: 'Bog‘lanish uzilgan', sev: 'mid' },
  { t: 'Qamoqqa olingan', sev: 'critical' },
  { t: 'Uy-joydan chiqarilgan', sev: 'mid' },
  { t: 'Yo‘lkira uchun mablag‘ yo‘q', sev: 'low' },
]
const maleNames = ['Jasur', 'Sardor', 'Bekzod', 'Otabek', 'Rustam', 'Shoxrux', 'Aziz', 'Ulug‘bek', 'Doniyor', 'Anvar']
const femaleNames = ['Dilnoza', 'Nilufar', 'Malika', 'Zulfiya', 'Kamola', 'Gulnora', 'Sevara', 'Munisa', 'Feruza', 'Shahnoza']
/* [erkak, ayol] shakllari */
const surnames = [
  ['Karimov', 'Karimova'], ['Yusupov', 'Yusupova'], ['Rahmonov', 'Rahmonova'],
  ['Ergashev', 'Ergasheva'], ['To‘xtayev', 'To‘xtayeva'], ['Salimov', 'Salimova'],
  ['Nazarov', 'Nazarova'], ['Qodirov', 'Qodirova'], ['Ismoilov', 'Ismoilova'],
  ['Abdullayev', 'Abdullayeva'],
]

/** Familiya va ism jinsga mos shakllantiriladi */
const nameOf = (female = rnd() > 0.72) => {
  const s = pick(surnames)
  return `${female ? s[1] : s[0]} ${pick(female ? femaleNames : maleNames)}`
}

/* Har bir davlatning shaharlari va koordinatalari — SOS lokatsiyasi uchun */
const cityByCountry = {
  RU: [['Moskva', 55.75, 37.62], ['Sankt-Peterburg', 59.93, 30.34], ['Kazan', 55.79, 49.11], ['Yekaterinburg', 56.84, 60.61], ['Novosibirsk', 55.03, 82.92]],
  KZ: [['Almati', 43.24, 76.89], ['Ostona', 51.16, 71.45], ['Shimkent', 42.32, 69.59]],
  TR: [['Istanbul', 41.01, 28.98], ['Anqara', 39.93, 32.86], ['Izmir', 38.42, 27.14]],
  KR: [['Seul', 37.57, 126.98], ['Ansan', 37.32, 126.83], ['Busan', 35.18, 129.08]],
  AE: [['Dubay', 25.20, 55.27], ['Abu-Dabi', 24.45, 54.38], ['Sharja', 25.35, 55.39]],
  KG: [['Bishkek', 42.87, 74.59], ['O‘sh', 40.53, 72.80]],
  DE: [['Berlin', 52.52, 13.40], ['Myunxen', 48.14, 11.58], ['Gamburg', 53.55, 9.99]],
  PL: [['Varshava', 52.23, 21.01], ['Krakov', 50.06, 19.94], ['Vrotslav', 51.11, 17.04]],
  SA: [['Ar-Riyod', 24.71, 46.68], ['Jidda', 21.49, 39.19], ['Damman', 26.43, 50.10]],
  JP: [['Tokio', 35.68, 139.69], ['Osaka', 34.69, 135.50], ['Nagoya', 35.18, 136.91]],
  US: [['Nyu-York', 40.71, -74.01], ['Chikago', 41.88, -87.63], ['Los-Anjeles', 34.05, -118.24]],
  GB: [['London', 51.51, -0.13], ['Manchester', 53.48, -2.24], ['Birmingem', 52.49, -1.89]],
}

export const sosEvents = Array.from({ length: 14 }, (_, i) => {
  const c = pick(countries)
  const s = pick(sosTypes)
  const [city, lat, lng] = pick(cityByCountry[c.code])
  return {
    id: `SOS-${9420 - i}`,
    name: nameOf(),
    country: c.name,
    countryCode: c.code,
    flag: c.flag,
    city,
    lat: lat + (rnd() - 0.5) * 0.16,
    lng: lng + (rnd() - 0.5) * 0.16,
    type: s.t,
    severity: s.sev,
    minutesAgo: i * int(4, 26) + int(1, 9),
    phone: `+998 ${int(90, 99)} *** ** ${int(10, 99)}`,
  }
})

/* -------------------------------------------------------- Reyestr */
const nationalities = ['O‘zbek', 'Qoraqalpoq', 'Tojik', 'Qozoq', 'Rus', 'Tatar']
const specialities = ['Quruvchi', 'Payvandchi', 'Haydovchi', 'Oshpaz', 'Tikuvchi', 'Elektrik', 'Hamshira', 'Sotuvchi', 'Dasturchi']
const purposeShort = ['Ishlash (rasmiy)', 'Ishlash (norasmiy)', 'O‘qish', 'Davolanish', 'Sayohat', 'Doimiy yashash']
const riskLevels = ['Xavf yo‘q', 'Qidiruvda', 'Jazoni o‘tamoqda', 'Bedarak yo‘qolgan']

export const migrants = Array.from({ length: 96 }, (_, i) => {
  const c = pick(countries)
  const female = rnd() > 0.78
  const minor = rnd() > 0.96
  const risk = rnd() > 0.86 ? pick(riskLevels.slice(1)) : 'Xavf yo‘q'
  const score = risk === 'Xavf yo‘q' ? int(4, 38) : int(52, 96)
  return {
    id: i + 1,
    pinfl: `${int(30000000000000, 62999999999999)}`,
    name: nameOf(female),
    nationality: pick(nationalities),
    gender: minor ? 'Voyaga yetmagan' : female ? 'Ayol' : 'Erkak',
    speciality: pick(specialities),
    country: c.name,
    flag: c.flag,
    countryCode: c.code,
    region: pick(regions).name,
    purpose: pick(purposeShort),
    remit: pick(['100–300 $', '300+ $', '100 $ gacha']),
    convicted: rnd() > 0.93,
    marital: pick(['Uylangan', 'Turmush qurmagan', 'Ajrashgan']),
    health: pick(['Sog‘lom', 'Surunkali kasallik', 'Nogironlik']),
    employer: pick(['SMU-7 LLC', 'Stroy Grand', 'Hanwha Corp.', 'Emaar Group', 'Ozon Logistics', 'Ro‘yxatdan o‘tmagan']),
    address: `${pick(cityByCountry[c.code])[0]}, ${pick(['markaz', 'sanoat zonasi', 'yotoqxona', 'shahar chekkasi'])}`,
    phone: `+998 ${int(90, 99)} ${int(100, 999)}-${int(10, 99)}-${int(10, 99)}`,
    risk,
    score,
    exitDate: `${int(1, 28)}.${String(int(1, 8)).padStart(2, '0')}.2026`,
  }
})

/* ------------------------------------------------------ Ish beruvchilar */
export const employers = [
  { name: 'Hanwha Construction', dir: 'Qurilish', countries: ['Janubiy Koreya'], sent: 4120, employment: 'Rasmiy shartnoma', formal: 100, remit: 186, status: 'Tasdiqlangan' },
  { name: 'Ozon Logistics', dir: 'Logistika', countries: ['Rossiya'], sent: 12840, employment: 'Rasmiy shartnoma', formal: 100, remit: 412, status: 'Tasdiqlangan' },
  { name: 'Emaar Facilities', dir: 'Servis', countries: ['BAA'], sent: 3610, employment: 'Rasmiy shartnoma', formal: 100, remit: 148, status: 'Tasdiqlangan' },
  { name: 'Stroy Grand LLC', dir: 'Qurilish', countries: ['Rossiya', 'Qozog‘iston'], sent: 8940, employment: 'Norasmiy bandlik', formal: 0, remit: 214, status: 'Kuzatuvda' },
  { name: 'Anadolu Tekstil', dir: 'Yengil sanoat', countries: ['Turkiya'], sent: 5270, employment: 'Norasmiy bandlik', formal: 0, remit: 132, status: 'Kuzatuvda' },
  { name: 'MegaAgro Group', dir: 'Qishloq xo‘jaligi', countries: ['Polsha'], sent: 2180, employment: 'Norasmiy bandlik', formal: 0, remit: 61, status: 'Cheklangan' },
]

/* ------------------------------------------------------- Konsullik */
export const consulate = [
  { label: 'Murojaat qilganlar', value: 18420, delta: 5.2, tone: 'lapis' },
  { label: 'Yordam ko‘rsatilgan', value: 15980, delta: 7.8, tone: 'turk' },
  { label: 'Sertifikat berilgan', value: 9240, delta: 3.1, tone: 'saffron' },
  { label: 'Vatanga qaytarilgan', value: 1860, delta: 14.6, tone: 'coral' },
]

/* --------------------------------------------------------- Qaytish */
export const returnStats = [
  { label: 'Qaytgan migrantlar', value: 312884, delta: -1.8, tone: 'saffron' },
  { label: 'Ish bilan ta’minlangan', value: 148620, delta: 9.4, tone: 'turk' },
  { label: 'Qayta o‘qitilgan', value: 61240, delta: 12.2, tone: 'lapis' },
  { label: 'Tadbirkorlik boshlagan', value: 18740, delta: 6.7, tone: 'violet' },
]

/* ------------------------------------------------------- AI tahlil */
export const aiInsights = [
  {
    tag: 'O‘SISH',
    tone: 'coral',
    title: 'Namangan → Rossiya yo‘nalishida norasmiy bandlik 18% oshdi',
    body: 'Oxirgi 60 kunda shu yo‘nalishda mehnat shartnomasiz chiqqanlar ulushi 31% dan 49% ga ko‘tarildi. Pul jo‘natmalari esa 6% ga kamaydi — bu ish haqi to‘lanmasligi belgisi bo‘lishi mumkin.',
    confidence: 87,
    action: 'Namangan tuman operatorlariga profilaktika ro‘yxati yuborilsin',
  },
  {
    tag: 'ANOMALIYA',
    tone: 'saffron',
    title: 'Turkiya bo‘yicha qalbaki hujjat holatlari klasterlandi',
    body: '3 ta vositachi kompaniya orqali chiqqan 214 nafar migrantda bir xil shablon bo‘yicha rasmiylashtirilgan hujjatlar aniqlandi. Klaster markazi — Farg‘ona vodiysi.',
    confidence: 74,
    action: 'Ish beruvchilar reyestrida 3 ta tashkilot cheklovga olinsin',
  },
  {
    tag: 'PROGNOZ',
    tone: 'lapis',
    title: 'Sentabr–oktabrda qaytish oqimi 22% ga oshishi kutilmoqda',
    body: 'Mavsumiy model va oxirgi 5 yillik dinamika asosida qaytish cho‘qqisi 12-oktabr atrofida. Ish bilan ta’minlash markazlarida yuklama oshadi.',
    confidence: 91,
    action: 'Hududlarda bo‘sh ish o‘rinlari bazasi oldindan yangilansin',
  },
  {
    tag: 'IJOBIY',
    tone: 'turk',
    title: 'Janubiy Koreya yo‘nalishida xavf ko‘rsatkichi pasaydi',
    body: 'Rasmiy tashkiliy yollash ulushi 100% ga yetdi, SOS chaqiruvlar yil boshiga nisbatan 41% kamaydi. Model bu yo‘nalishni etalon sifatida belgiladi.',
    confidence: 95,
    action: 'Ushbu model boshqa yo‘nalishlarga tarqatilsin',
  },
]

export const riskDistribution = [
  { label: 'Past (0–30)', value: 1684200, tone: 'turk' },
  { label: 'O‘rta (31–60)', value: 372400, tone: 'saffron' },
  { label: 'Yuqori (61–85)', value: 78200, tone: 'coral' },
  { label: 'Kritik (86+)', value: 13830, tone: 'violet' },
]

export const overallRisk = 38

/* ------------------------------------------------------- Tizim sozlamalari */
export const settings = [
  { key: 'overallRisk', label: 'Umumiy xavf indeksi', kind: 'number', value: 38, hint: 'RiskGauge ko‘rsatkichi, 0–100' },
  { key: 'sos', label: 'SOS bildirishnomalari', kind: 'switch', on: true, hint: 'Kritik murojaatlar darhol yuboriladi' },
  { key: 'ai', label: 'AI xavf modelini avtomatik qayta hisoblash', kind: 'switch', on: true, hint: 'Har 6 soatda' },
  { key: 'twofa', label: 'Ikki bosqichli autentifikatsiya (E-IMZO)', kind: 'switch', on: true, hint: 'Barcha administratorlar uchun majburiy' },
  { key: 'export', label: 'Eksportni cheklash', kind: 'switch', on: false, hint: '5 000 dan ortiq yozuvni yuklashda tasdiq talab qilinadi' },
]

/* ------------------------------------------------- Chegara mониторing */
export const borderPoints = [
  { name: '"Gisht ko‘prik" (Termiz)', region: 'Surxondaryo', out: 1240, in: 980, load: 72 },
  { name: '"Yallama" (Toshkent vil.)', region: 'Toshkent viloyati', out: 2180, in: 1840, load: 88 },
  { name: '"Dovutobod" (Farg‘ona)', region: 'Farg‘ona', out: 1620, in: 1410, load: 64 },
  { name: 'Toshkent xalqaro aeroporti', region: 'Toshkent shahri', out: 4820, in: 4210, load: 91 },
  { name: 'Samarqand aeroporti', region: 'Samarqand', out: 1180, in: 1040, load: 47 },
  { name: '"Qoraqalpog‘iston" temir yo‘l', region: 'Qoraqalpog‘iston', out: 640, in: 520, load: 33 },
]

/* -------------------------------------------------------- Audit jurnali */
export const auditLog = Array.from({ length: 12 }, (_, i) => ({
  id: 4820 - i,
  user: pick(['a.karimov', 'sh.rasulova', 'admin.root', 'konsul.msk', 'operator.fargona']),
  role: pick(['Super administrator', 'Viloyat operatori', 'Konsullik xodimi', 'Chegara xizmati']),
  action: pick(['Reyestrdan yozuv ko‘rildi', 'Hisobot eksport qilindi', 'SOS murojaat yopildi', 'Foydalanuvchi yaratildi', 'Xavf darajasi o‘zgartirildi']),
  ip: `92.${int(1, 250)}.${int(1, 250)}.${int(1, 250)}`,
  at: `${String(int(0, 23)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`,
  ok: rnd() > 0.12,
}))

export const roles = [
  { name: 'Super administrator', count: 3, scope: 'Butun tizim', tone: 'coral' },
  { name: 'Respublika administratori', count: 12, scope: 'Barcha hududlar', tone: 'saffron' },
  { name: 'Viloyat operatori', count: 84, scope: 'O‘z viloyati', tone: 'lapis' },
  { name: 'Tuman operatori', count: 412, scope: 'O‘z tumani', tone: 'turk' },
  { name: 'Konsullik xodimi', count: 96, scope: 'Konsullik bo‘limi', tone: 'violet' },
  { name: 'Migratsiya agentligi xodimi', count: 148, scope: 'Reyestr + hisobot', tone: 'lapis' },
  { name: 'Chegara xizmati xodimi', count: 220, scope: 'Chegara moduli', tone: 'saffron' },
  { name: 'Fuqaro (mobil ilova)', count: 486320, scope: 'Faqat SOS', tone: 'mist' },
]

export const integrations = [
  'Chegara xizmati', 'Ichki ishlar vazirligi', 'Tashqi ishlar vazirligi', 'Migratsiya agentligi',
  'Davlat xizmatlari markazlari', 'MyID', 'E-IMZO', 'Soliq qo‘mitasi', 'Markaziy bank',
  'HUMO', 'UZCARD', 'Click', 'Payme', 'Aviakompaniyalar', 'Temir yo‘l', 'Interpol', 'IOM',
].map((name) => ({ name, status: 'Rejada' }))

/* ---------------------------------------------------- Foydalanuvchilar
   Kirish shu ro'yxat bo'yicha tekshiriladi (demo parol — `demo`).
   Bloklangan foydalanuvchi tizimga kira olmaydi. */
export const users = [
  { login: 'admin.root', name: 'A. Karimov', role: 'Super administrator', unit: 'Migratsiya agentligi', phone: '+998 71 200-10-01', status: 'Faol' },
  { login: 'sh.rasulova', name: 'Sh. Rasulova', role: 'Respublika administratori', unit: 'Markaziy apparat', phone: '+998 71 200-10-14', status: 'Faol' },
  { login: 'konsul.msk', name: 'B. To‘xtayev', role: 'Konsullik xodimi', unit: 'Moskva konsulligi', phone: '+7 495 200-40-12', status: 'Faol' },
  { login: 'operator.fargona', name: 'D. Ergasheva', role: 'Viloyat operatori', unit: 'Farg‘ona viloyati', phone: '+998 73 244-18-06', status: 'Faol' },
  { login: 'chegara.termiz', name: 'S. Nazarov', role: 'Chegara xizmati xodimi', unit: '“Gisht ko‘prik” punkti', phone: '+998 76 221-33-40', status: 'Faol' },
  { login: 'operator.andijon', name: 'M. Yusupova', role: 'Tuman operatori', unit: 'Andijon, Asaka tumani', phone: '+998 74 233-51-27', status: 'Bloklangan' },
]

/* ------------------------------------------- Toshkent viloyati tumanlari
   Nomlar src/data/uzbekistan.js dagi chegara nomlari bilan bir xil bo'lishi
   shart — xarita shu nom orqali ko'rsatkichni topadi.
   Yig'indi: chiqqan 31 200, qaytgan 22 800 — `regions` dagi viloyat qatori. */
export const districts = [
  { name: 'Zangiota', out: 3800, back: 2780, risk: 34 },
  { name: 'Yangiyo‘l', out: 3200, back: 2340, risk: 31 },
  { name: 'Qibray', out: 2900, back: 2120, risk: 26 },
  { name: 'O‘rta Chirchiq', out: 2400, back: 1750, risk: 33 },
  { name: 'Bekobod', out: 2300, back: 1680, risk: 41 },
  { name: 'Ohangaron', out: 2200, back: 1610, risk: 38 },
  { name: 'Chinoz', out: 2000, back: 1460, risk: 29 },
  { name: 'Yuqori Chirchiq', out: 1900, back: 1390, risk: 30 },
  { name: 'Quyi Chirchiq', out: 1800, back: 1310, risk: 32 },
  { name: 'Toshkent tumani', out: 1750, back: 1280, risk: 24 },
  { name: 'Parkent', out: 1700, back: 1240, risk: 27 },
  { name: 'Bo‘ka', out: 1600, back: 1170, risk: 36 },
  { name: 'Piskent', out: 1450, back: 1060, risk: 28 },
  { name: 'Oqqo‘rg‘on', out: 1300, back: 950, risk: 35 },
  { name: 'Bo‘stonliq', out: 900, back: 660, risk: 19 },
]

/* ------------------------------------------ Qo'shimcha KPI qatorlari */
export const borderStats = [
  { label: 'Rad etilgan o‘tishlar', value: 184, delta: -8.4, tone: 'saffron', sub: 'hujjat nomuvofiqligi' },
  { label: 'Chegara buzilishi', value: 27, delta: 12.9, tone: 'coral', sub: 'oxirgi 7 kun' },
]

export const sosStats = [
  { label: 'Jami chaqiruvlar', value: 1247, delta: 12.5, tone: 'coral', sub: 'oxirgi 30 kun' },
  { label: 'Hal etilgan', value: 1084, delta: 9.8, tone: 'turk', sub: '87% javob darajasi' },
  { label: 'Ochiq murojaatlar', value: 163, delta: 4.2, tone: 'saffron', sub: 'jarayonda' },
  { label: 'O‘rtacha javob vaqti', value: 18, delta: -22.4, tone: 'lapis', sub: 'daqiqa' },
]

export const auditStats = [
  { label: 'Bugungi amallar', value: 4820, delta: 6.4, tone: 'lapis', sub: 'barcha foydalanuvchilar' },
  { label: 'Rad etilgan urinishlar', value: 38, delta: -14.2, tone: 'coral', sub: 'huquq yetarli emas' },
  { label: 'Eksport qilingan hisobotlar', value: 164, delta: 8.1, tone: 'saffron', sub: 'oxirgi 24 soat' },
  { label: 'Faol sessiyalar', value: 312, delta: 2.7, tone: 'turk', sub: 'hozirgi paytda' },
]

/* ------------------------------------------------- Hisobot shablonlari */
export const reportTemplates = [
  { name: 'Umumiy migratsiya holati', desc: 'Barcha KPI, davlatlar va hududlar kesimi', period: 'Oylik', fmt: 'XLSX, PDF', tone: 'lapis' },
  { name: 'Qonunbuzilishlar hisoboti', desc: 'Turlar va davlatlar bo‘yicha, IIV formatida', period: 'Choraklik', fmt: 'XLSX, DOCX', tone: 'coral' },
  { name: 'Konsullik faoliyati', desc: 'Murojaatlar, yordam va sertifikatlar', period: 'Oylik', fmt: 'PDF', tone: 'saffron' },
  { name: 'Pul jo‘natmalari tahlili', desc: 'Markaziy bank ma’lumotlari bilan solishtirma', period: 'Oylik', fmt: 'XLSX, CSV', tone: 'turk' },
  { name: 'Qaytish va reintegratsiya', desc: 'Bandlik va o‘qitish ko‘rsatkichlari', period: 'Choraklik', fmt: 'XLSX, PDF', tone: 'violet' },
  { name: 'AI xavf tahlili', desc: 'Model natijalari va ustuvor nazorat ro‘yxati', period: 'Haftalik', fmt: 'PDF', tone: 'saffron' },
]

export const reportArchive = [
  { name: 'Umumiy migratsiya holati — 2026-iyul', size: '4.2 MB', at: '02.08.2026', by: 'a.karimov' },
  { name: 'Qonunbuzilishlar — II chorak', size: '1.8 MB', at: '14.07.2026', by: 'sh.rasulova' },
  { name: 'Pul jo‘natmalari — 2026-iyun', size: '860 KB', at: '03.07.2026', by: 'admin.root' },
]

/* ---------------------------------------------------- Konsullik xizmatlari */
export const consulateServices = [
  { label: 'Hujjat tiklash', value: 6420, tone: 'lapis' },
  { label: 'Yuridik maslahat', value: 4180, tone: 'turk' },
  { label: 'Vatanga qaytarish', value: 1860, tone: 'coral' },
  { label: 'Tibbiy yordam', value: 2140, tone: 'saffron' },
  { label: 'Tarjima va notarial', value: 1380, tone: 'violet' },
]

/* -------------------------------------------------- Reintegratsiya dasturlari */
export const returnPrograms = [
  { name: 'Qayta kasb tayyorlash', done: 61240, target: 80000, tone: 'lapis' },
  { name: 'Tadbirkorlikka subsidiya', done: 18740, target: 25000, tone: 'turk' },
  { name: 'Ish bilan ta’minlash', done: 148620, target: 190000, tone: 'saffron' },
  { name: 'Ipoteka va uy-joy', done: 9120, target: 20000, tone: 'violet' },
]

/* ----------------------------------------------------------- SOS kanallari */
export const sosChannels = [
  { name: 'Telegram Bot', share: 62, icon: 'spark' },
  { name: 'Mobil ilova', share: 24, icon: 'phone' },
  { name: 'Konsullik qo‘ng‘irog‘i', share: 11, icon: 'stamp' },
  { name: 'Boshqa', share: 3, icon: 'globe' },
]

/* ------------------------------------------- Chegara ma’lumot manbalari */
export const borderSources = [
  { name: 'Chegara xizmati AIS', status: 'ulangan' },
  { name: 'Aviakompaniyalar PNR', status: 'ulangan' },
  { name: 'Temir yo‘l bileti tizimi', status: 'ulangan' },
  { name: 'MyID identifikatsiya', status: 'ulangan' },
  { name: 'Interpol I-24/7', status: 'ulangan' },
]

/* -------------------------------------------------------- Model omillari */
export const riskWeights = [
  { key: 'employment', label: 'Bandlik turi (rasmiy / norasmiy)', w: 26 },
  { key: 'route', label: 'Yo‘nalish davlati xavfi', w: 22 },
  { key: 'remit', label: 'Pul jo‘natmalari dinamikasi', w: 18 },
  { key: 'docs', label: 'Hujjatlar holati', w: 14 },
  { key: 'history', label: 'Sudlanganlik va qidiruv', w: 12 },
  { key: 'contact', label: 'Aloqa uzilishi', w: 8 },
]

/* ------------------------------------------------------- AI tayyor savollar */
export const aiSuggestions = [
  { text: 'Qaysi hududda norasmiy bandlik eng tez o‘smoqda?' },
  { text: 'Pul jo‘natmalari pasayishi qaysi yo‘nalishlarda xavf signali?' },
  { text: 'Kelgusi chorakda qaytish oqimi prognozi qanday?' },
]
