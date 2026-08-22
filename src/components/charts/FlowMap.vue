<script setup>
/**
 * Oqim xaritasi — markazda O'zbekiston, atrofida yo'nalish davlatlari
 * haqiqiy geografik azimut bo'yicha, masofa logarifmik shkalada.
 * Yoy qalinligi = migrantlar soni, rangi = xavf ko'rsatkichi.
 */
import { computed, ref } from 'vue'
import { useMotionOk } from '@/composables/useMotion'
import { fmt, short } from '@/composables/useCountUp'

const props = defineProps({
  countries: { type: Array, required: true },
  selected: { type: String, default: null },
})
const emit = defineEmits(['select'])

const motionOk = useMotionOk()
const hovered = ref(null)

const W = 900
const H = 560
const CX = W / 2
const CY = H / 2 + 6

const nodes = computed(() => {
  const dists = props.countries.map((c) => Math.log(c.dist))
  const dMin = Math.min(...dists)
  const dMax = Math.max(...dists)
  const totals = props.countries.map((c) => c.total)
  const tMax = Math.max(...totals)

  return props.countries.map((c, i) => {
    const t = (Math.log(c.dist) - dMin) / (dMax - dMin || 1)
    const r = 118 + t * 168
    const rad = ((c.angle - 90) * Math.PI) / 180
    const x = CX + Math.cos(rad) * r * 1.42
    const y = CY + Math.sin(rad) * r
    const size = 8 + Math.sqrt(c.total / tMax) * 22
    const width = 1.2 + (c.total / tMax) * 9
    // Yoyni biroz egish uchun boshqaruv nuqtasi
    const mx = (CX + x) / 2
    const my = (CY + y) / 2
    const nx = -(y - CY)
    const ny = x - CX
    const len = Math.hypot(nx, ny) || 1
    const bend = 0.16
    const c1x = mx + (nx / len) * len * bend
    const c1y = my + (ny / len) * len * bend
    const path = `M${CX} ${CY} Q${c1x.toFixed(1)} ${c1y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
    const tone = c.risk >= 60 ? 'var(--coral)' : c.risk >= 40 ? 'var(--saffron)' : 'var(--turk)'
    const flip = x < CX
    return { ...c, x, y, size, width, path, tone, flip, i, len: Math.hypot(x - CX, y - CY) * 1.15 }
  })
})

/* Yorliqlar ustma-ust tushmasligi uchun har bir tomonda vertikal siljitish */
const MIN_GAP = 40

const placed = computed(() => {
  const out = nodes.value.map((n) => ({ ...n, ly: n.y }))
  for (const side of [true, false]) {
    const grp = out.filter((n) => n.flip === side).sort((a, b) => a.ly - b.ly)
    for (let i = 1; i < grp.length; i++) {
      const gap = grp[i].ly - grp[i - 1].ly
      if (gap < MIN_GAP) grp[i].ly = grp[i - 1].ly + MIN_GAP
    }
    // Guruh markazini asl holatiga qaytarish
    if (grp.length) {
      const shift =
        (grp.reduce((a, n) => a + n.y, 0) - grp.reduce((a, n) => a + n.ly, 0)) / grp.length
      grp.forEach((n) => (n.ly += shift))
    }
  }
  return out.map((n) => ({
    ...n,
    lx: n.flip ? n.x - n.size - 13 : n.x + n.size + 13,
    // Aylanadan yorliqqa ingichka ulagich
    tick: Math.abs(n.ly - n.y) > 6,
  }))
})

const active = computed(() => hovered.value || props.selected)
const isDim = (code) => active.value && active.value !== code
</script>

<template>
  <div class="wrap">
    <svg :viewBox="`0 0 ${W} ${H}`" class="map" role="img"
         aria-label="Migratsiya oqimlari yo'nalish davlatlari bo'yicha">
      <defs>
        <radialGradient id="coreGlow">
          <stop offset="0%" stop-color="var(--turk)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="var(--turk)" stop-opacity="0" />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="7" /></filter>
      </defs>

      <!-- Kompas halqalari: masofa shkalasi -->
      <g class="rings">
        <ellipse v-for="(r, k) in [140, 210, 280, 350, 420]" :key="r"
                 :cx="CX" :cy="CY" :rx="r * 1.42" :ry="r" />
      </g>
      <g class="spokes">
        <line v-for="a in [0, 45, 90, 135, 180, 225, 270, 315]" :key="a"
              :x1="CX" :y1="CY"
              :x2="CX + Math.cos(((a - 90) * Math.PI) / 180) * 420 * 1.42"
              :y2="CY + Math.sin(((a - 90) * Math.PI) / 180) * 420" />
      </g>

      <!-- Yoylar -->
      <g>
        <path
          v-for="n in nodes" :key="'arc' + n.code"
          :d="n.path" :stroke="n.tone" :stroke-width="n.width"
          class="arc" :class="{ dim: isDim(n.code), on: active === n.code }"
          :style="{ '--len': n.len * 2, '--i': n.i }"
          fill="none" stroke-linecap="round"
        />
      </g>

      <!-- Harakatlanuvchi zarrachalar = jonli oqim -->
      <g v-if="motionOk">
        <template v-for="n in nodes" :key="'p' + n.code">
          <circle
            v-for="k in (n.total > 60000 ? 3 : 2)" :key="k"
            :r="n.width * 0.45 + 1.2" :fill="n.tone"
            class="dotP" :class="{ dim: isDim(n.code) }"
          >
            <animateMotion
              :path="n.path"
              :dur="`${3.4 + (n.dist / 3400)}s`"
              :begin="`${(k * 1.3 + n.i * 0.37).toFixed(2)}s`"
              repeatCount="indefinite"
              rotate="auto"
            />
            <animate attributeName="opacity" values="0;1;1;0"
                     :dur="`${3.4 + (n.dist / 3400)}s`"
                     :begin="`${(k * 1.3 + n.i * 0.37).toFixed(2)}s`"
                     repeatCount="indefinite" />
          </circle>
        </template>
      </g>

      <!-- Markaz: O'zbekiston -->
      <circle :cx="CX" :cy="CY" r="86" fill="url(#coreGlow)" class="pulseCore" />
      <circle :cx="CX" :cy="CY" r="26" class="core" />
      <circle :cx="CX" :cy="CY" r="26" class="coreRing" />
      <text :x="CX" :y="CY + 4" class="coreTxt">UZ</text>
      <text :x="CX" :y="CY + 48" class="coreLbl">O‘ZBEKISTON</text>

      <!-- Tugunlar -->
      <g
        v-for="n in placed" :key="n.code"
        class="node" :class="{ dim: isDim(n.code), on: active === n.code }"
        :style="{ '--i': n.i }"
        @mouseenter="hovered = n.code" @mouseleave="hovered = null"
        @click="emit('select', n.code)"
        tabindex="0" role="button"
        @keydown.enter="emit('select', n.code)"
      >
        <line
          v-if="n.tick" :x1="n.flip ? n.x - n.size - 3 : n.x + n.size + 3" :y1="n.y"
          :x2="n.lx" :y2="n.ly - 4" class="tick" :stroke="n.tone"
        />
        <circle :cx="n.x" :cy="n.y" :r="n.size + 10" class="halo" :fill="n.tone" />
        <circle :cx="n.x" :cy="n.y" :r="n.size" :fill="n.tone" class="bubble" />
        <circle :cx="n.x" :cy="n.y" :r="n.size" class="bubbleRing" :stroke="n.tone" />
        <text
          :x="n.lx" :y="n.ly - 5"
          :text-anchor="n.flip ? 'end' : 'start'"
          class="nName"
        >{{ n.name }}</text>
        <text
          :x="n.lx" :y="n.ly + 10"
          :text-anchor="n.flip ? 'end' : 'start'"
          class="nVal num"
        >{{ short(n.total) }}</text>
      </g>
    </svg>

    <!-- Tanlangan yo'nalish kartochkasi -->
    <Transition name="tip">
      <div v-if="active" class="tip">
        <template v-for="n in nodes" :key="'t' + n.code">
          <div v-if="n.code === active" class="tipIn">
            <p class="tipTop">{{ n.flag }} {{ n.name }}</p>
            <div class="tipGrid">
              <div><span class="eyebrow">Jami</span><b class="num">{{ fmt(n.total) }}</b></div>
              <div><span class="eyebrow">Chiqqan</span><b class="num">{{ fmt(n.out) }}</b></div>
              <div><span class="eyebrow">Qaytgan</span><b class="num">{{ fmt(n.back) }}</b></div>
              <div><span class="eyebrow">Qidiruvda</span><b class="num">{{ fmt(n.wanted) }}</b></div>
              <div><span class="eyebrow">Yo‘qolgan</span><b class="num">{{ fmt(n.missing) }}</b></div>
              <div><span class="eyebrow">Jo‘natma</span><b class="num">{{ fmt(n.remit) }} mln $</b></div>
            </div>
            <div class="riskRow">
              <span class="eyebrow">Xavf indeksi</span>
              <div class="riskBar"><i :style="{ width: n.risk + '%', background: n.tone }" /></div>
              <b class="num" :style="{ color: n.tone }">{{ n.risk }}</b>
            </div>
          </div>
        </template>
      </div>
    </Transition>

    <p class="legend">
      Halqalar — Toshkentdan masofa · Aylana o‘lchami — migrantlar soni · Rang — xavf indeksi
    </p>
  </div>
</template>

<style scoped>
.wrap {
  position: relative;
}

.map {
  width: 100%;
  height: auto;
  display: block;
  overflow: visible;
}

.rings ellipse {
  fill: none;
  stroke: rgba(var(--mist-rgb), 0.09);
  stroke-dasharray: 2 7;
}

.spokes line {
  stroke: rgba(var(--mist-rgb), 0.06);
}

/* --- yoylar chiziladi --- */
.arc {
  opacity: 0.55;
  stroke-dasharray: var(--len);
  stroke-dashoffset: var(--len);
  animation: dash-in 1.5s var(--ease-out) forwards;
  animation-delay: calc(var(--i) * 90ms + 200ms);
  transition: opacity 0.35s ease, stroke-width 0.35s ease;
}
.arc.dim { opacity: 0.1; }
.arc.on { opacity: 1; }

.dotP {
  transition: opacity 0.3s ease;
}
.dotP.dim { opacity: 0.08 !important; }

/* --- markaz --- */
.pulseCore {
  transform-origin: center;
  animation: corePulse 4.5s var(--ease-in-out) infinite;
}
@keyframes corePulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.14); }
}

.core {
  fill: var(--ink-900);
  stroke: var(--turk);
  stroke-width: 1.5;
}
.coreRing {
  fill: none;
  stroke: var(--turk);
  stroke-width: 1;
  opacity: 0.5;
  transform-origin: center;
  animation: pulse-ring 3.2s var(--ease-out) infinite;
}
.coreTxt {
  fill: var(--turk);
  font-family: var(--font-data);
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
}
.coreLbl {
  fill: var(--mist-dim);
  font-family: var(--font-data);
  font-size: 9.5px;
  letter-spacing: 0.24em;
  text-anchor: middle;
}

/* --- tugunlar --- */
.node {
  cursor: pointer;
  opacity: 0;
  animation: fade 0.6s var(--ease-out) forwards;
  animation-delay: calc(var(--i) * 90ms + 700ms);
  transition: opacity 0.3s ease;
}
.node.dim { opacity: 0.22; }

.halo {
  opacity: 0;
  transition: opacity 0.35s var(--ease-out);
}
.node:hover .halo,
.node.on .halo,
.node:focus-visible .halo {
  opacity: 0.16;
}

.bubble {
  opacity: 0.22;
  transition: opacity 0.35s var(--ease-out);
}
.node:hover .bubble,
.node.on .bubble { opacity: 0.45; }

.bubbleRing {
  fill: none;
  stroke-width: 1.4;
}

.tick {
  stroke-width: 1;
  opacity: 0.35;
  stroke-dasharray: 2 3;
}

.nName {
  fill: var(--snow);
  font-family: var(--font-body);
  font-size: 12.5px;
  font-weight: 500;
}
.nVal {
  fill: var(--mist-dim);
  font-size: 11px;
}

/* --- tooltip kartochka --- */
.tip {
  position: absolute;
  left: 0;
  bottom: 8px;
  width: min(320px, 92%);
  padding: 16px 18px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: rgba(var(--deep-rgb), 0.94);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lift);
}

.tipTop {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

.tipGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 10px;
}
.tipGrid div { display: flex; flex-direction: column; gap: 2px; }
.tipGrid b { font-size: 13px; font-weight: 600; }

.riskRow {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.riskBar {
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.14);
  overflow: hidden;
}
.riskBar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s var(--ease-out);
}

.tip-enter-active { transition: all 0.35s var(--ease-out); }
.tip-leave-active { transition: all 0.2s ease; }
.tip-enter-from, .tip-leave-to { opacity: 0; transform: translateY(10px); }

.legend {
  margin: 6px 0 0;
  text-align: center;
  font-size: 11px;
  color: var(--mist-dim);
}

@media (max-width: 720px) {
  .nName { font-size: 15px; }
  .nVal { font-size: 13px; }
  .tip { position: static; width: auto; margin-top: 12px; }
}
</style>
