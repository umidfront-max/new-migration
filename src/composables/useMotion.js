import { ref, onMounted, onUnmounted } from 'vue'

/** Foydalanuvchi animatsiyani kamaytirishni so'raganmi? */
export function useMotionOk() {
  const ok = ref(true)
  let mq
  const sync = () => (ok.value = !mq.matches)
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    sync()
    mq.addEventListener('change', sync)
  })
  onUnmounted(() => mq && mq.removeEventListener('change', sync))
  return ok
}

/**
 * Element ekranga kirganda `shown` true bo'ladi — grafiklarni
 * ko'ringan paytda ishga tushirish uchun.
 */
export function useReveal(options = {}) {
  const el = ref(null)
  const shown = ref(false)
  let io

  onMounted(() => {
    if (!('IntersectionObserver' in window)) {
      shown.value = true
      return
    }
    io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shown.value = true
          io.disconnect()
        }
      },
      { threshold: 0.15, ...options },
    )
    if (el.value) io.observe(el.value)
  })

  onUnmounted(() => io && io.disconnect())
  return { el, shown }
}
