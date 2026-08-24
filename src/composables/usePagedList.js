import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { loadPageOf } from '@/stores/db'

/**
 * Serverda sahifalanadigan jadval.
 *
 * Ro'yxat to'liq yuklab olinmaydi: har bir sahifa — alohida so'rov,
 * filtrlar ham serverga yuboriladi. "Keyingi" bosilganda backendga
 * `?page=N&page_size=…` so'rovi ketadi.
 *
 * @param name    db to'plami nomi (masalan `migrants`)
 * @param params  filtrlarni qaytaruvchi computed — o'zgarsa 1-sahifadan boshlanadi
 * @param size    bir sahifadagi yozuvlar soni
 * @param wait    filtr o'zgarganda kutish (ms) — har bosilgan harfga so'rov ketmasin
 */
export function usePagedList(name, params, { size = 10, wait = 300 } = {}) {
  const page = ref(1)
  const count = ref(0)
  const loading = ref(false)
  const error = ref('')

  /* Eskirgan javob yangisining ustiga yozilmasligi uchun */
  let seq = 0
  let timer = null

  const pages = computed(() => Math.max(1, Math.ceil(count.value / size)))

  const load = async () => {
    const mine = ++seq
    loading.value = true
    error.value = ''
    try {
      const result = await loadPageOf(name, { page: page.value, size, ...params.value })
      if (mine !== seq) return
      count.value = result.count

      /* Yozuvlar o'chirilib sahifa yo'qolgan bo'lsa — oxirgisiga qaytamiz */
      const last = Math.max(1, Math.ceil(result.count / size))
      if (page.value > last) page.value = last
    } catch (err) {
      if (mine !== seq) return
      /* Server "Invalid page" desa — boshiga qaytamiz */
      if (err?.status === 404 && page.value > 1) {
        page.value = 1
        return
      }
      error.value = err?.message || 'Ma’lumotni olib bo‘lmadi'
      count.value = 0
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  const go = (target) => {
    const next = Math.min(Math.max(1, target), pages.value)
    if (next === page.value) return
    page.value = next
  }

  const next = () => go(page.value + 1)
  const prev = () => go(page.value - 1)

  /* Sahifa o'zgarishi — darhol so'rov */
  watch(page, load)

  /* Filtr o'zgarishi — biroz kutib, 1-sahifadan */
  watch(params, () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (page.value !== 1) page.value = 1
      else load()
    }, wait)
  })

  onMounted(load)
  onUnmounted(() => clearTimeout(timer))

  return { page, pages, count, loading, error, next, prev, go, reload: load }
}
