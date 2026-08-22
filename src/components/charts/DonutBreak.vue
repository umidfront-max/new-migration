<script setup>
import { computed, ref } from 'vue'
import { useReveal } from '@/composables/useMotion'
import { fmt } from '@/composables/useCountUp'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  items: { type: Array, required: true }, // [{label, value, tone}]
  centerLabel: { type: String, default: 'Jami' },
  /** true bo'lsa — izohda tahrirlash tugmalari chiqadi */
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['pick'])

const { el, shown } = useReveal()
const hover = ref(null)

const R = 66
const SW = 18
const C = 2 * Math.PI * R
const GAP = 3

const total = computed(() => props.items.reduce((a, b) => a + b.value, 0))

const arcs = computed(() => {
  let acc = 0
  return props.items.map((it, i) => {
    const frac = it.value / total.value
    const len = Math.max(C * frac - GAP, 1)
    const off = -acc * C
    acc += frac
    return { ...it, len, off, i, pct: frac * 100 }
  })
})

const shownItem = computed(() =>
  hover.value !== null ? arcs.value[hover.value] : { label: props.centerLabel, value: total.value },
)
</script>

<template>
  <div ref="el" class="donut">
    <svg viewBox="0 0 180 180">
      <circle cx="90" cy="90" :r="R" class="track" :stroke-width="SW" />
      <g transform="rotate(-90 90 90)">
        <circle
          v-for="a in arcs" :key="a.label"
          cx="90" cy="90" :r="R" fill="none"
          :stroke="`var(--${a.tone})`" :stroke-width="hover === a.i ? SW + 5 : SW"
          stroke-linecap="butt"
          :stroke-dasharray="`${shown ? a.len : 0} ${C}`"
          :stroke-dashoffset="a.off"
          class="seg" :class="{ dim: hover !== null && hover !== a.i }"
          :style="{ '--d': a.i * 110 + 'ms' }"
          @mouseenter="hover = a.i" @mouseleave="hover = null"
        />
      </g>
      <text x="90" y="86" class="cVal num">{{ fmt(shownItem.value) }}</text>
      <text x="90" y="104" class="cLbl">{{ shownItem.label }}</text>
    </svg>

    <ul class="keys">
      <li v-for="a in arcs" :key="a.label" :class="{ on: hover === a.i }"
          @mouseenter="hover = a.i" @mouseleave="hover = null">
        <i :style="{ background: `var(--${a.tone})` }" />
        <span class="lb">{{ a.label }}</span>
        <b class="num">{{ a.pct.toFixed(1) }}%</b>
        <button v-if="editable" class="pen" aria-label="Tahrirlash" @click="emit('pick', a)">
          <AppIcon name="edit" :size="12" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pen {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-left: 2px;
  border-radius: 6px;
  border: 1px solid transparent;
  color: var(--mist-dim);
  opacity: 0;
  transition: all 0.3s var(--ease-out);
}
.keys li:hover .pen { opacity: 1; }
.pen:hover { color: var(--turk); border-color: var(--turk); }

.donut {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

svg { width: 180px; height: 180px; flex-shrink: 0; }

.track { fill: none; stroke: rgba(var(--mist-rgb), 0.08); }

.seg {
  transition: stroke-dasharray 1.1s var(--ease-out), opacity 0.3s ease, stroke-width 0.3s var(--ease-out);
  transition-delay: var(--d), 0s, 0s;
  cursor: pointer;
}
.seg.dim { opacity: 0.25; }

.cVal {
  fill: var(--snow);
  font-family: var(--font-data);
  font-size: 20px;
  font-weight: 700;
  text-anchor: middle;
}
.cLbl {
  fill: var(--mist-dim);
  font-family: var(--font-body);
  font-size: 11px;
  text-anchor: middle;
}

.keys {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-width: 190px;
  display: grid;
  gap: 3px;
}
.keys li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--r-sm);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s var(--ease-out);
}
.keys li.on {
  background: rgba(var(--mist-rgb), 0.07);
  transform: translateX(3px);
}
.keys i { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }
.lb { flex: 1; color: var(--mist); }
.keys b { font-size: 12px; }
</style>
