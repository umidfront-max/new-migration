<script setup>
import { computed, toRef } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

const props = defineProps({
  score: { type: Number, default: 0 },
  caption: { type: String, default: 'Umumiy xavf indeksi' },
})

const v = useCountUp(toRef(props, 'score'), { duration: 1800, delay: 300 })

const R = 78
const CIRC = Math.PI * R // yarim doira

const dash = computed(() => (v.value / 100) * CIRC)
const tone = computed(() => {
  const s = props.score
  if (s >= 86) return 'var(--violet)'
  if (s >= 61) return 'var(--coral)'
  if (s >= 31) return 'var(--saffron)'
  return 'var(--turk)'
})
const verdict = computed(() => {
  const s = props.score
  if (s >= 86) return 'Kritik'
  if (s >= 61) return 'Yuqori'
  if (s >= 31) return 'Nazoratda'
  return 'Barqaror'
})
const angle = computed(() => -90 + (v.value / 100) * 180)
</script>

<template>
  <div class="gauge">
    <svg viewBox="0 0 200 122">
      <defs>
        <linearGradient id="gz" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--turk)" />
          <stop offset="42%" stop-color="var(--saffron)" />
          <stop offset="78%" stop-color="var(--coral)" />
          <stop offset="100%" stop-color="var(--violet)" />
        </linearGradient>
      </defs>

      <path :d="`M22 100 A ${R} ${R} 0 0 1 178 100`" class="track" />
      <path
        :d="`M22 100 A ${R} ${R} 0 0 1 178 100`"
        class="prog"
        :stroke-dasharray="`${dash} ${CIRC}`"
      />

      <!-- shkala belgilari -->
      <g class="ticks">
        <line v-for="k in 11" :key="k"
              :x1="100 + Math.cos(((k - 1) * 18 - 180) * Math.PI / 180) * (R - 14)"
              :y1="100 + Math.sin(((k - 1) * 18 - 180) * Math.PI / 180) * (R - 14)"
              :x2="100 + Math.cos(((k - 1) * 18 - 180) * Math.PI / 180) * (R - 20)"
              :y2="100 + Math.sin(((k - 1) * 18 - 180) * Math.PI / 180) * (R - 20)" />
      </g>

      <!-- strelka -->
      <g :transform="`rotate(${angle} 100 100)`" class="needle">
        <line x1="100" y1="100" x2="100" y2="34" :stroke="tone" stroke-width="2.4" stroke-linecap="round" />
        <circle cx="100" cy="100" r="6" :fill="tone" />
        <circle cx="100" cy="100" r="11" :stroke="tone" fill="none" opacity="0.35" />
      </g>

      <text x="100" y="88" class="val num" :fill="tone">{{ Math.round(v) }}</text>
    </svg>

    <p class="verdict" :style="{ color: tone }">{{ verdict }}</p>
    <p class="cap">{{ caption }}</p>

    <div class="scale">
      <span>0</span><span>Past</span><span>O‘rta</span><span>Yuqori</span><span>100</span>
    </div>
  </div>
</template>

<style scoped>
.gauge { text-align: center; }
svg { width: 100%; max-width: 260px; height: auto; }

.track {
  fill: none;
  stroke: rgba(var(--mist-rgb), 0.1);
  stroke-width: 12;
  stroke-linecap: round;
}
.prog {
  fill: none;
  stroke: url(#gz);
  stroke-width: 12;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(var(--turk-rgb), 0.25));
}
.ticks line { stroke: rgba(var(--mist-rgb), 0.22); stroke-width: 1.2; }

.needle { transition: none; }

.val {
  font-family: var(--font-data);
  font-size: 30px;
  font-weight: 700;
  text-anchor: middle;
  opacity: 0;
  animation: fade 0.8s ease 0.5s forwards;
}

.verdict {
  margin: 6px 0 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
}
.cap { margin: 2px 0 0; font-size: 12px; color: var(--mist-dim); }

.scale {
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  font-family: var(--font-data);
  font-size: 9.5px;
  letter-spacing: 0.1em;
  color: var(--mist-dim);
  text-transform: uppercase;
}
</style>
