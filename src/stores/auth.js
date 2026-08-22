import { reactive, computed } from 'vue'
import { actor, db } from '@/stores/db'
import { verifyPassword, hasPassword, LEGACY_PASSWORD } from '@/composables/usePassword'

/* ==========================================================================
   Demo autentifikatsiya.
   Backend ulanganda `signIn` funksiyasi POST /auth/login ga almashtiriladi,
   qolgan kod (guard, AppShell, audit jurnali) o'zgarishsiz qoladi.
   ========================================================================== */

const KEY = 'migrant-session'

/** Login sahifasidagi tez kirish — faqat standart paroldagi faol hisoblar */
export const demoUsers = computed(() =>
  db.users.filter((u) => u.status === 'Faol' && !hasPassword(u)).slice(0, 4),
)

export { LEGACY_PASSWORD }

const restore = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const state = reactive({ user: restore() })

/** Audit jurnalidagi muallif sessiya bilan bir xil bo'lsin */
const syncActor = () => {
  actor.user = state.user?.login ?? 'mehmon'
  actor.role = state.user?.role ?? '—'
}
syncActor()

const persist = () => {
  try {
    if (state.user) localStorage.setItem(KEY, JSON.stringify(state.user))
    else localStorage.removeItem(KEY)
  } catch { /* xotira yopiq */ }
}

/** Bosh harflar: "A. Karimov" -> "AK" */
export const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .replace(/\./g, '')
    .toUpperCase() || '?'

export function useAuth() {
  return {
    user: computed(() => state.user),
    isAuthed: computed(() => !!state.user),

    /**
     * Parol hisobda o'rnatilgan bo'lsa hash bo'yicha, aks holda
     * standart demo paroli bo'yicha tekshiriladi.
     * @returns {Promise<{ok: true} | {ok: false, error: string}>}
     */
    async signIn(login, password) {
      const key = String(login).trim().toLowerCase()
      const found = db.users.find((u) => u.login === key)
      if (!found) return { ok: false, error: 'Bunday foydalanuvchi topilmadi' }
      if (found.status === 'Bloklangan') {
        return { ok: false, error: 'Hisob bloklangan — administratorga murojaat qiling' }
      }
      if (!(await verifyPassword(found, password))) {
        return { ok: false, error: 'Parol noto‘g‘ri' }
      }
      const { _id, passwordHash, passwordSalt, ...rest } = found
      state.user = { ...rest, at: new Date().toISOString() }
      persist()
      syncActor()
      return { ok: true }
    },

    signOut() {
      state.user = null
      persist()
      syncActor()
    },
  }
}

/** Router guard uchun — reaktivlikdan tashqarida o'qish */
export const isAuthenticated = () => !!state.user
