/**
 * Backend bilan integratsiya sinovi.
 *
 * Ishga tushirish (backend 8000-portda ishlab turishi kerak):
 *   npm run test:api
 *
 * Brauzerdagi oqimni takrorlaydi: kirish, ma'lumot yuklash, CRUD, qo'shimcha
 * amallar, chiqish. Vue komponentlari emas — do'kon (store) qatlami sinaladi.
 */
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto) globalThis.crypto = webcrypto

/* Brauzer API'lari — do'kon qatlami ular bilan ishlaydi */
const memory = new Map()
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
}
globalThis.document = {
  hidden: false,
  documentElement: { dataset: {} },
  createElement: () => ({ click() {}, remove() {} }),
  body: { appendChild() {} },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.URL.createObjectURL = () => 'blob:test'
globalThis.URL.revokeObjectURL = () => {}

import { useAuth } from '@/stores/auth'
import * as store from '@/stores/db'

const {
  db, loadAll, summary, status, COLLECTIONS,
  addRecord, updateRecord, removeRecord, patchRecord,
  resolveSosEvent, reopenSosEvent, generateReport, downloadReport,
  exportCollection, setting, serie,
} = store

let failures = 0
const check = (label, condition, extra = '') => {
  if (!condition) failures += 1
  console.log(`  ${condition ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`)
}
const section = (title) => console.log(`\n${title}`)

const auth = useAuth()

async function main() {

/* ---------------------------------------------------------------- kirish */
section('1. KIRISH')
check('noma’lum hisob rad etildi', !(await auth.signIn('yo-q', 'demo')).ok)
check('bloklangan hisob rad etildi', !(await auth.signIn('operator.andijon', 'demo')).ok)
check('noto‘g‘ri parol rad etildi', !(await auth.signIn('admin.root', 'xato')).ok)

const signedIn = await auth.signIn('ADMIN.ROOT', 'demo')
check('to‘g‘ri hisob kirdi', signedIn.ok, auth.user.value?.name)
check('token saqlandi', !!memory.get('migrant-token'))

/* --------------------------------------------------------------- yuklash */
section('2. MA’LUMOT YUKLASH')
await loadAll()
check('yuklash tugadi', status.ready)
check(`${COLLECTIONS.length} ta to‘plam`, COLLECTIONS.every((name) => Array.isArray(db[name])))
check('migrantlar keldi', db.migrants.length > 0, `${db.migrants.length} ta`)
check('har bir yozuvda _id bor', db.migrants.every((row) => row._id))
check('davlat _ref = ISO kod', db.countries[0]?._ref === db.countries[0]?.code)
check('guruhli KPI ajratildi', db.kpis.length > 0 && db.sosStats.length > 0)
check('setting() ishlaydi', typeof setting('overallRisk')?.value === 'number')
check('serie() 12 oy', serie('out')?.values?.length === 12)
check('konsullik ishlari', db.consulateCases.length > 0, `${db.consulateCases.length} ta`)

/* ------------------------------------------------- yig'ma ko'rsatkichlar */
section('3. YIG‘MA KO‘RSATKICHLAR')
check('reyestr soni serverdan', summary.registry.count === db.migrants.length,
  `${summary.registry.count}`)
check('rasmiy ulush', typeof summary.employers.formalShare === 'number',
  `${summary.employers.formalShare}%`)
check('qonunbuzilish jami', summary.violations.total > 0, String(summary.violations.total))

/* -------------------------------- ilgari o'ylab topilgan raqamlar API'dan */
section('4. KO‘RSATKICHLAR API MAYDONLARIDAN')
const russia = db.countries.find((row) => row.code === 'RU')
check('konsullikka murojaatlar', russia?.consulateRequests > 0, String(russia?.consulateRequests))
check('qonunbuzilish holatlari', russia?.violationCount > 0, String(russia?.violationCount))
check('hududda bandlik', db.regions.some((row) => row.employed > 0))

/* ------------------------------------------------------------------ CRUD */
section('5. MIGRANT — RISK BALL SERVERDA')
const migrant = await addRecord('migrants', {
  pinfl: '45000000000099', name: 'Sinov Migrant', countryCode: 'RU',
  region: db.regions[0].name, purpose: 'Ishlash (norasmiy)', gender: 'Erkak',
  employer: 'Ro‘yxatdan o‘tmagan', score: null,
})
check('yaratildi', !!migrant._id)
check('ball server hisobladi', migrant.score > 0, String(migrant.score))
check('davlat nomi to‘ldi', migrant.country === 'Rossiya')

const renamed = await updateRecord('migrants', migrant._id, { name: 'Yangilangan' })
check('tahrirlandi', renamed.name === 'Yangilangan')

section('6. VALIDATSIYA SERVERDAN')
try {
  await addRecord('migrants', {
    pinfl: '123', name: 'X', countryCode: 'RU', region: db.regions[0].name,
  })
  check('noto‘g‘ri PINFL rad etilishi kerak edi', false)
} catch (error) {
  check('PINFL xatosi maydonga bog‘landi', !!error.fields?.pinfl, error.fields?.pinfl)
}
try {
  await addRecord('employers', { name: 'Bo‘sh', dir: 'IT', countries: [] })
  check('davlatsiz ish beruvchi rad etilishi kerak edi', false)
} catch (error) {
  check('davlatlar xatosi qaytdi', !!error.fields?.countries)
}

section('7. TEZKOR O‘ZGARTIRISH (PATCH)')
const account = db.users.find((row) => row.login !== auth.user.value.login)
const blocked = await patchRecord('users', account, { status: 'Bloklangan' })
check('foydalanuvchi bloklandi', blocked.status === 'Bloklangan')
await patchRecord('users', blocked, { status: 'Faol' })
check('blokdan chiqarildi', db.users.find((r) => r._id === account._id).status === 'Faol')

section('8. QO‘SHIMCHA AMALLAR')
const openEvent = db.sosEvents.find((row) => !row.resolved)
check('SOS yopildi', (await resolveSosEvent(openEvent)).resolved === true)
check('SOS qayta ochildi', (await reopenSosEvent(openEvent)).resolved === false)

const archiveBefore = db.reportArchive.length
const report = await generateReport(db.reportTemplates[0])
check('hisobot shakllantirildi', db.reportArchive.length === archiveBefore + 1,
  report.detail)
check('hisobot fayli yuklab olindi',
  (await downloadReport(report.archive)).endsWith('.csv'))
check('CSV eksport ishladi',
  (await exportCollection('migrants', { risky: 'true' })).endsWith('.csv'))

section('9. FAQAT O‘QISH')
check('audit jurnali keldi', db.auditLog.length > 0, `${db.auditLog.length} yozuv`)
try {
  await addRecord('auditLog', { action: 'Qo‘lda' })
  check('jurnalga yozib bo‘lmasligi kerak', false)
} catch (error) {
  check('jurnal himoyalangan', error.status === 405)
}

section('10. TOZALASH VA CHIQISH')
check('migrant o‘chirildi', await removeRecord('migrants', migrant._id))
await auth.signOut()
check('sessiya yopildi', !auth.isAuthed.value)
check('token o‘chirildi', !memory.get('migrant-token'))
check('ma’lumot tozalandi', db.migrants.length === 0 && !status.ready)

console.log(`\n${failures ? `✗ ${failures} ta muammo` : '✓ Barcha tekshiruv o‘tdi'}`)
process.exit(failures ? 1 : 0)
}

main()
