<script setup>
import { computed, ref } from 'vue'
import { useReveal } from '@/composables/useMotion'
import { fmt } from '@/composables/useCountUp'

const props = defineProps({
  series: { type: Array, required: true }, // [{name, color, values[]}]
  labels: { type: Array, required: true },
  height: { type: Number, default: 260 },
  suffix: { type: String, default: '' },
})

const { el, shown } = useReveal()
const hover = ref(null)

const W = 760
const H = computed(() => props.height)
const P = { t: 18, r: 14, b: 28, l: 46 }

const maxV = computed(() => {
  const all = props.series.flatMap((s) => s.values)
  return Math.max(...all) * 1.12
})

const xAt = (i) => P.l + (i / (props.labels.length - 1)) * (W - P.l - P.r)
const yAt = (v) => P.t + (1 - v / maxV.value) * (H.value - P.t - P.b)

const paths = computed(() =>
  props.series.map((s, si) => {
    const pts = s.values.map((v, i) => [xAt(i), yAt(v)])
    // Catmull-Rom → cubic bezier (silliq egri)
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2] || p2
      const c1x = p1[0] + (p2[0] - p0[0]) / 6
      const c1y = p1[1] + (p2[1] - p0[1]) / 6
      const c2x = p2[0] - (p3[0] - p1[0]) / 6
      const c2y = p2[1] - (p3[1] - p1[1]) / 6
      d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    }
    const area = `${d} L${xAt(props.labels.length - 1).toFixed(1)} ${(H.value - P.b).toFixed(1)} L${P.l} ${(H.value - P.b).toFixed(1)} Z`
    return { ...s, d, area, si, pts }
  }),
)

const ticks = computed(() => {
  const n = 4
  return Array.from({ length: n + 1 }, (_, i) => {
    const v = (maxV.value / n) * i
    return { v, y: yAt(v) }
  })
})

const onMove = (e) => {
  const r = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * W
  const idx = Math.round(((x - P.l) / (W - P.l - P.r)) * (props.labels.length - 1))
  hover.value = Math.max(0, Math.min(props.labels.length - 1, idx))
}
</script>

<template>
  <div ref="el" class="chart">
    <svg :viewBox="`0 0 ${W} ${H}`" @mousemove="onMove" @mouseleave="hover = null">
      <defs>
        <linearGradient v-for="s in paths" :key="'g' + s.si" :id="`ag${s.si}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="s.color" stop-opacity="0.32" />
          <stop offset="100%" :stop-color="s.color" stop-opacity="0" />
        </linearGradient>
      </defs>

      <!-- setka -->
      <g class="grid">
        <line v-for="t in ticks" :key="t.v" :x1="P.l" :x2="W - P.r" :y1="t.y" :y2="t.y" />
        <text v-for="t in ticks" :key="'l' + t.v" :x="P.l - 10" :y="t.y + 4" class="ax num">
          {{ t.v >= 1000 ? Math.round(t.v / 1000) + 'k' : Math.round(t.v) }}
        </text>
      </g>

      <!-- maydon + chiziq -->
      <g v-for="s in paths" :key="s.si">
        <path :d="s.area" :fill="`url(#ag${s.si})`" class="area" :class="{ go: shown }"
              :style="{ '--d': s.si * 180 + 'ms' }" />
        <path :d="s.d" :stroke="s.color" class="line" :class="{ go: shown }"
              :style="{ '--d': s.si * 180 + 'ms' }" fill="none" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round" />
      </g>

      <!-- kursor -->
      <g v-if="hover !== null" class="cursor">
        <line :x1="xAt(hover)" :x2="xAt(hover)" :y1="P.t" :y2="H - P.b" />
        <circle v-for="s in paths" :key="'c' + s.si" :cx="xAt(hover)" :cy="yAt(s.values[hover])"
                r="4.5" :fill="s.color" stroke="var(--ink-900)" stroke-width="2" />
      </g>

      <!-- x o'qi -->
      <text v-for="(l, i) in labels" :key="l + i" :x="xAt(i)" :y="H - 8"
            class="ax mid" :class="{ hot: hover === i }">{{ l }}</text>
    </svg>

    <Transition name="tip">
      <div v-if="hover !== null" class="tip" :style="{ left: `${(xAt(hover) / W) * 100}%` }">
        <p class="tipL eyebrow">{{ labels[hover] }}</p>
        <div v-for="s in paths" :key="'t' + s.si" class="tipR">
          <span class="sw" :style="{ background: s.color }" />
          <span class="nm">{{ s.name }}</span>
          <b class="num">{{ fmt(s.values[hover]) }}{{ suffix }}</b>
        </div>
      </div>
    </Transition>

    <div class="legend">
      <span v-for="s in paths" :key="'lg' + s.si">
        <i :style="{ background: s.color }" />{{ s.name }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.chart { position: relative; }
svg { width: 100%; height: auto; display: block; overflow: visible; }

.grid line { stroke: rgba(var(--mist-rgb), 0.09); }
.ax { fill: var(--mist-dim); font-family: var(--font-data); font-size: 10px; text-anchor: end; }
.mid { text-anchor: middle; transition: fill 0.2s ease; }
.mid.hot { fill: var(--snow); }

.line {
  stroke-dasharray: 2600;
  stroke-dashoffset: 2600;
  filter: drop-shadow(0 4px 14px color-mix(in srgb, currentColor 30%, transparent));
}
.line.go { animation: dash-in 1.6s var(--ease-out) forwards; animation-delay: var(--d); }

.area { opacity: 0; }
.area.go { animation: fade 1.2s ease forwards; animation-delay: calc(var(--d) + 500ms); }

.cursor line { stroke: rgba(var(--mist-rgb), 0.4); stroke-dasharray: 3 4; }

.tip {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  min-width: 168px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line-strong);
  background: rgba(var(--deep-rgb), 0.95);
  pointer-events: none;
  box-shadow: var(--shadow-lift);
}
.tipL { margin: 0 0 6px; }
.tipR { display: flex; align-items: center; gap: 7px; font-size: 12px; margin-top: 3px; }
.tipR .nm { flex: 1; color: var(--mist); }
.sw { width: 8px; height: 8px; border-radius: 2px; }

.tip-enter-active, .tip-leave-active { transition: opacity 0.2s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; }

.legend {
  display: flex;
  gap: 18px;
  justify-content: center;
  margin-top: 6px;
  font-size: 12px;
  color: var(--mist);
}
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend i { width: 14px; height: 3px; border-radius: 99px; }
</style>
