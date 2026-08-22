/* ==========================================================================
   Parol bilan ishlash.

   Demo bosqichida ma'lumot brauzerda saqlanadi, shuning uchun parol ochiq
   ko'rinishda emas — har bir hisob uchun tasodifiy tuz (salt) va SHA-256
   yig'indisi saqlanadi. Bu to'liq xavfsizlik emas: brauzerda hisoblangan
   hash serverdagi Argon2/bcrypt o'rnini bosmaydi.

   Backend ulanganda: parol serverga ochiq (HTTPS orqali) yuboriladi va
   faqat o'sha yerda hashlanadi; bu fayl olib tashlanadi.
   ========================================================================== */

/** Standart demo paroli — eski, paroli o'rnatilmagan hisoblar uchun */
export const LEGACY_PASSWORD = 'demo'

/** Parol uchun eng kam uzunlik */
export const MIN_PASSWORD = 6

const subtle = () => globalThis.crypto?.subtle ?? null

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** Tasodifiy tuz — har bir hisob uchun alohida */
export function makeSalt() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

/**
 * Parolning SHA-256 yig'indisi.
 * @returns {Promise<string>} hex ko'rinishdagi hash
 */
export async function hashPassword(password, salt) {
  const api = subtle()
  if (!api) throw new Error('Brauzer parolni himoyalay olmadi — sahifani https yoki localhost orqali oching')
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(await api.digest('SHA-256', data))
}

/** Yangi parol uchun saqlanadigan maydonlar */
export async function makeCredentials(password) {
  const salt = makeSalt()
  return { passwordSalt: salt, passwordHash: await hashPassword(password, salt) }
}

/**
 * Kiritilgan parolni yozuvdagi hash bilan solishtiradi.
 * Paroli hali o'rnatilmagan eski hisoblar uchun standart parol ishlaydi.
 */
export async function verifyPassword(record, password) {
  if (!record?.passwordHash || !record?.passwordSalt) return password === LEGACY_PASSWORD
  try {
    return (await hashPassword(password, record.passwordSalt)) === record.passwordHash
  } catch {
    return false
  }
}

/** Hisobda o'z paroli bormi */
export const hasPassword = (record) => !!(record?.passwordHash && record?.passwordSalt)
