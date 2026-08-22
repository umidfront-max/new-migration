/* ==========================================================================
   Autentifikatsiya — backend orqali.

   Parol serverga yuboriladi va u yerda Django'ning PBKDF2 hashi bilan
   tekshiriladi. Brauzerda faqat token saqlanadi.
   ========================================================================== */
import { computed, reactive } from 'vue'

import { api, ApiError, getToken, setToken } from '@/services/api'
import { actor, clearAll } from '@/stores/db'

const state = reactive({
  user: null,
  checking: false,
})

/** Login sahifasidagi maslahat — demo hisoblar */
export const demoAccounts = [
  { login: 'admin.root', role: 'Super administrator' },
  { login: 'sh.rasulova', role: 'Respublika administratori' },
  { login: 'konsul.msk', role: 'Konsullik xodimi' },
  { login: 'operator.fargona', role: 'Viloyat operatori' },
]

export const DEMO_PASSWORD = 'demo'

/** Audit jurnalidagi muallif sessiya bilan bir xil bo'lsin */
const syncActor = () => {
  actor.user = state.user?.login ?? 'mehmon'
  actor.role = state.user?.role ?? '—'
}

/** Bosh harflar: "A. Karimov" -> "AK" */
export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .replace(/\./g, '')
    .toUpperCase() || '?'

/** Sahifa ochilganda saqlangan token bor-yo'qligi */
export const hasStoredToken = () => !!getToken()

export function useAuth() {
  return {
    user: computed(() => state.user),
    isAuthed: computed(() => !!state.user),
    checking: computed(() => state.checking),

    /**
     * Login va parol bo'yicha token oladi.
     * @returns {Promise<{ok: true} | {ok: false, error: string}>}
     */
    async signIn(login, password) {
      try {
        const data = await api.post('/auth/login/', {
          login: String(login).trim().toLowerCase(),
          password,
        })
        setToken(data.token)
        state.user = data.user
        syncActor()
        return { ok: true }
      } catch (error) {
        if (!(error instanceof ApiError)) return { ok: false, error: 'Kutilmagan xato' }
        return {
          ok: false,
          error: error.isThrottled
            ? 'Juda ko‘p urinish — bir daqiqadan so‘ng qayta urinib ko‘ring'
            : error.message,
        }
      }
    },

    /** Tokenni bekor qiladi va ma'lumotni tozalaydi */
    async signOut() {
      try {
        await api.post('/auth/logout/')
      } catch { /* token allaqachon yaroqsiz bo'lishi mumkin */ }
      setToken(null)
      state.user = null
      syncActor()
      clearAll()
    },

    /**
     * Saqlangan token bo'yicha sessiyani tiklaydi.
     * @returns {Promise<boolean>} sessiya tiklandimi
     */
    async restore() {
      if (!getToken()) return false
      state.checking = true
      try {
        state.user = await api.get('/auth/me/')
        syncActor()
        return true
      } catch {
        setToken(null)
        state.user = null
        syncActor()
        return false
      } finally {
        state.checking = false
      }
    },
  }
}

/** Router guard uchun — reaktivlikdan tashqarida o'qish */
export const isAuthenticated = () => !!state.user || hasStoredToken()
