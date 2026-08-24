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

/**
 * Tizim bo'limini (admin paneli, foydalanuvchilar, audit, hisobotlar)
 * ochish huquqi shu roldagilarda. Backend `is_superuser` ni qaytarmaydi,
 * shuning uchun rol nomi bo'yicha aniqlanadi.
 */
export const SUPER_ADMIN_ROLE = 'Super administrator'

/* Login sahifasidagi maslahat — demo hisoblar.
   Super administrator bu ro'yxatda yo'q: uning huquqi kengroq va
   paroli ham boshqacha, shuning uchun ochiq ko'rsatilmaydi. */
export const demoAccounts = [
  { login: 'admin.root', role: 'Respublika administratori' },
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
    /** Yon paneldagi "Tizim" bo'limi shunga qarab ko'rsatiladi */
    isSuper: computed(() => state.user?.role === SUPER_ADMIN_ROLE),

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

    /** Saqlangan token bo'yicha sessiyani tiklaydi */
    restore: restoreSession,
  }
}

/* Bir vaqtda bir nechta chaqiruv bo'lsa — bitta so'rov ketadi.
   App.vue ham, router guard ham shu funksiyani chaqiradi. */
let restoring = null

/**
 * Saqlangan token bo'yicha sessiyani tiklaydi.
 * @returns {Promise<boolean>} sessiya tiklandimi
 */
export function restoreSession() {
  if (!getToken()) return Promise.resolve(false)
  if (restoring) return restoring

  state.checking = true
  restoring = api
    .get('/auth/me/')
    .then((user) => {
      state.user = user
      syncActor()
      return true
    })
    .catch(() => {
      setToken(null)
      state.user = null
      syncActor()
      return false
    })
    .finally(() => {
      state.checking = false
      restoring = null
    })

  return restoring
}

/** Router guard uchun — reaktivlikdan tashqarida o'qish */
export const isAuthenticated = () => !!state.user || hasStoredToken()

/** Sessiya haqiqatan yuklanganmi (token bor-yo'qligi emas) */
export const isSessionLoaded = () => !!state.user

/** Tizim bo'limiga huquqi bormi */
export const isSuperAdmin = () => state.user?.role === SUPER_ADMIN_ROLE
