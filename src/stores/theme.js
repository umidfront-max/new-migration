import { ref, watch } from 'vue'

/* ==========================================================================
   Mavzu (yorug' / qorong'i).
   Tanlov localStorage'da saqlanadi; tanlanmagan bo'lsa tizim sozlamasi olinadi.
   ========================================================================== */

const KEY = 'migrant-theme'

const systemDark = () => {
  try {
    return !window.matchMedia('(prefers-color-scheme: light)').matches
  } catch {
    return true
  }
}

const initial = () => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* xotira yopiq */ }
  return systemDark() ? 'dark' : 'light'
}

const theme = ref(initial())

/** <html data-theme="..."> — barcha tokenlar shu atributga bog'langan */
const apply = (t) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = t
}

apply(theme.value)

watch(theme, (t) => {
  apply(t)
  try {
    localStorage.setItem(KEY, t)
  } catch { /* xotira yopiq */ }
})

export function useTheme() {
  return {
    theme,
    isDark: () => theme.value === 'dark',
    setTheme: (t) => (theme.value = t === 'light' ? 'light' : 'dark'),
    toggleTheme: () => (theme.value = theme.value === 'dark' ? 'light' : 'dark'),
  }
}
