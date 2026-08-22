import { ref, watch, onUnmounted } from 'vue'

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Raqamni 0 dan target ga silliq oshiradi.
 * @param {import('vue').Ref<number>|number} target
 * @param {{duration?: number, delay?: number}} opts
 */
export function useCountUp(target, opts = {}) {
  const { duration = 1400, delay = 0 } = opts
  const value = ref(0)
  let raf = null
  let timer = null

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

  const run = (to) => {
    cancelAnimationFrame(raf)
    clearTimeout(timer)
    if (reduced()) {
      value.value = to
      return
    }
    const from = value.value
    timer = setTimeout(() => {
      const t0 = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration)
        value.value = from + (to - from) * easeOutExpo(p)
        if (p < 1) raf = requestAnimationFrame(step)
        else value.value = to
      }
      raf = requestAnimationFrame(step)
    }, delay)
  }

  watch(
    () => (typeof target === 'object' ? target.value : target),
    (v) => run(v ?? 0),
    { immediate: true },
  )

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    clearTimeout(timer)
  })

  return value
}

/** 1 248 630 ko'rinishida formatlash */
export const fmt = (n, digits = 0) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(n) ? n : 0)

/** Qisqartirilgan: 2.1 mln, 486 ming */
export const short = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + ' mln'
  if (n >= 1_000) return Math.round(n / 1_000) + ' ming'
  return String(n)
}
