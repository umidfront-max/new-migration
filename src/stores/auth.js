import { reactive, computed } from 'vue'
import { actor } from '@/stores/db'

/* ==========================================================================
   Demo autentifikatsiya.
   Backend ulanganda `signIn` funksiyasi POST /auth/login ga almashtiriladi,
   qolgan kod (guard, AppShell, audit jurnali) o'zgarishsiz qoladi.
   ========================================================================== */

const KEY = 'migrant-session'

/** Demo hisoblar — parol hammasida `demo` */
export const demoUsers = [
  { login: 'admin.root', name: 'A. Karimov', role: 'Super administrator', unit: 'Migratsiya agentligi' },
  { login: 'sh.rasulova', name: 'Sh. Rasulova', role: 'Respublika administratori', unit: 'Markaziy apparat' },
  { login: 'konsul.msk', name: 'B. To‘xtayev', role: 'Konsullik xodimi', unit: 'Moskva konsulligi' },
  { login: 'operator.fargona', name: 'D. Ergasheva', role: 'Viloyat operatori', unit: 'Farg‘ona viloyati' },
]

const PASSWORD = 'demo'

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

    /** @returns {{ok: true} | {ok: false, error: string}} */
    signIn(login, password) {
      const found = demoUsers.find((u) => u.login === String(login).trim().toLowerCase())
      if (!found) return { ok: false, error: 'Bunday foydalanuvchi topilmadi' }
      if (password !== PASSWORD) return { ok: false, error: 'Parol noto‘g‘ri' }
      state.user = { ...found, at: new Date().toISOString() }
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
