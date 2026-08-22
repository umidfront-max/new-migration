/**
 * Frontenddagi demo ma'lumotni backend uchun JSON ga chiqaradi.
 *
 * Ishga tushirish (loyiha ildizidan):
 *   node backend/scripts/export_seed.mjs
 *
 * Natija: backend/seed/demo_seed.json — uni `manage.py seed_demo` o'qiydi.
 * Shu yo'l bilan backend va frontend demo ma'lumoti bir xil bo'lib qoladi.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import * as mock from '../../src/data/mock.js'

const here = dirname(fileURLToPath(import.meta.url))
const outFile = resolve(here, '..', 'seed', 'demo_seed.json')

/** Tumanlar viloyatga bog'lanadi — hozircha barchasi Toshkent viloyatiniki */
const DISTRICT_REGION = 'Toshkent viloyati'

const payload = {
  generatedFrom: 'src/data/mock.js',
  roles: mock.roles,
  users: mock.users,
  settings: mock.settings,

  countries: mock.countries,
  regions: mock.regions,
  districts: mock.districts.map((d) => ({ ...d, region: DISTRICT_REGION })),
  borderPoints: mock.borderPoints,
  borderSources: mock.borderSources,

  migrants: mock.migrants,
  employers: mock.employers,

  violations: mock.violations,
  sosEvents: mock.sosEvents,
  sosChannels: mock.sosChannels,
  consulateServices: mock.consulateServices,
  returnPrograms: mock.returnPrograms,

  metrics: {
    dashboard: mock.kpis,
    consulate: mock.consulate,
    return: mock.returnStats,
    border: mock.borderStats,
    sos: mock.sosStats,
    audit: mock.auditStats,
  },
  shares: {
    composition: mock.composition,
    purpose: mock.purposes,
    risk: mock.riskDistribution,
  },
  series: mock.series,
  aiInsights: mock.aiInsights,
  aiSuggestions: mock.aiSuggestions,
  integrations: mock.integrations,
  riskWeights: mock.riskWeights,
  reportTemplates: mock.reportTemplates,
  reportArchive: mock.reportArchive,
}

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8')

const counts = Object.entries(payload)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${k}=${v.length}`)

console.log('yozildi:', outFile)
console.log(counts.join(' '))
