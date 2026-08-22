<script setup>
/**
 * Toshkent viloyati — tuman kesimidagi xarita.
 * Chap tomonda haqiqiy ma'muriy chegaralar, o'ngda tumanlar reytingi.
 * Xarita va ro'yxat ikki tomonlama bog'langan: birida kursor — ikkinchisi yonadi.
 */
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { fmt } from '@/composables/useCountUp'
import { db } from '@/stores/db'
import { tashkentBox, tashkentDistricts, uzRegions } from '@/data/uzbekistan'

const emit = defineEmits(['pick'])

const hover = ref(null)
const sortKey = ref('out')

const PAD = 1.6
const view = computed(() => {
  const b = tashkentBox
  return [
    (b.minX - PAD).toFixed(1),
    (b.minY - PAD).toFixed(1),
    (b.maxX - b.minX + PAD * 2).toFixed(1),
    (b.maxY - b.minY + PAD * 2).toFixed(1),
  ].join(' ')
})

const outline = computed(() => uzRegions.find((r) => r.capital)?.d ?? '')
const city = computed(() => uzRegions.find((r) => r.name === 'Toshkent shahri'))

const tone = (risk) => (risk >= 40 ? 'coral' : risk >= 30 ? 'saffron' : 'turk')

/** Chegara chizmasi bazadagi ko'rsatkich bilan birlashtiriladi */
const shapes = computed(() =>
  tashkentDistricts.map((d) => {
    const stat = db.districts.find((x) => x.name === d.name)
    return { ...d, stat, tone: stat ? tone(stat.risk) : 'mist' }
  }),
)

const ranked = computed(() => {
  const max = Math.max(...shapes.value.map((s) => s.stat?.[sortKey.value] ?? 0), 1)
  return [...shapes.value]
    .sort((a, b) => (b.stat?.[sortKey.value] ?? 0) - (a.stat?.[sortKey.value] ?? 0))
    .map((s) => ({ ...s, pct: ((s.stat?.[sortKey.value] ?? 0) / max) * 100 }))
})

const totals = computed(() => ({
  out: db.districts.reduce((a, d) => a + (d.out || 0), 0),
  back: db.districts.reduce((a, d) => a + (d.back || 0), 0),
  count: db.districts.length,
}))

const active = computed(() => shapes.value.find((s) => s.name === hover.value))
</script>

<template>
  <div class="rm">
    <!-- ------------------------------------------------------- xarita -->
    <div class="mapBox">
      <svg :viewBox="view" class="svg" role="img"
           aria-label="Toshkent viloyati tumanlari xaritasi">
        <defs>
          <filter id="rmGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        <!-- yumshoq soya -->
        <path :d="outline" class="shadow" filter="url(#rmGlow)" />

        <!-- tumanlar -->
        <path
          v-for="(d, i) in shapes" :key="d.name" :d="d.d"
          class="dst" :class="[`t-${d.tone}`, { on: hover === d.name, dim: hover && hover !== d.name }]"
          :style="{ '--i': i }"
          @mouseenter="hover = d.name" @mouseleave="hover = null"
          @click="d.stat && emit('pick', d.stat)"
          tabindex="0" role="button"
          @focus="hover = d.name" @blur="hover = null"
          @keydown.enter="d.stat && emit('pick', d.stat)"
        >
          <title>{{ d.name }} tumani</title>
        </path>

        <!-- Toshkent shahri viloyat ichida joylashgan -->
        <path v-if="city" :d="city.d" class="city">
          <title>Toshkent shahri</title>
        </path>
        <text v-if="city?.c" :x="city.c[0]" :y="city.c[1] + 0.5" class="cityTxt">TOSHKENT</text>

        <!-- viloyat konturi -->
        <path :d="outline" class="border" />
      </svg>

      <!-- kursor ostidagi tuman -->
      <Transition name="fade">
        <div v-if="active" class="card">
          <p class="cName">
            {{ active.name }} <span>tumani</span>
          </p>
          <div v-if="active.stat" class="cGrid">
            <div><span class="eyebrow">Chiqqan</span><b class="num">{{ fmt(active.stat.out) }}</b></div>
            <div><span class="eyebrow">Qaytgan</span><b class="num">{{ fmt(active.stat.back) }}</b></div>
            <div>
              <span class="eyebrow">Xavf</span>
              <b class="num" :class="`c-${active.tone}`">{{ active.stat.risk }}</b>
            </div>
          </div>
          <p v-else class="cNo">Bazada ko‘rsatkich yo‘q</p>
        </div>
      </Transition>

      <div class="legend">
        <span class="lg t-turk"><i />Past xavf</span>
        <span class="lg t-saffron"><i />O‘rta</span>
        <span class="lg t-coral"><i />Yuqori</span>
      </div>
    </div>

    <!-- ------------------------------------------------------ reyting -->
    <div class="list">
      <div class="lHead">
        <div class="sum">
          <b class="num">{{ totals.count }}</b> ta tuman ·
          chiqqan <b class="num">{{ fmt(totals.out) }}</b> ·
          qaytgan <b class="num">{{ fmt(totals.back) }}</b>
        </div>
        <div class="seg">
          <button :class="{ on: sortKey === 'out' }" @click="sortKey = 'out'">Chiqqan</button>
          <button :class="{ on: sortKey === 'back' }" @click="sortKey = 'back'">Qaytgan</button>
          <button :class="{ on: sortKey === 'risk' }" @click="sortKey = 'risk'">Xavf</button>
        </div>
      </div>

      <ul class="rows">
        <li
          v-for="(d, i) in ranked" :key="d.name"
          :class="{ on: hover === d.name }" :style="{ '--i': i }"
          @mouseenter="hover = d.name" @mouseleave="hover = null"
          @click="d.stat && emit('pick', d.stat)"
        >
          <span class="rn num">{{ i + 1 }}</span>
          <span class="rNm">{{ d.name }}</span>
          <span class="bar"><i :class="`t-${d.tone}`" :style="{ width: d.pct + '%' }" /></span>
          <b class="num rv">{{ fmt(d.stat?.[sortKey] ?? 0) }}</b>
          <AppIcon name="edit" :size="13" class="rEd" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.rm {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
  padding: 4px 20px 20px;
  align-items: start;
}

/* ------------------------------------------------------------- xarita */
.mapBox { position: relative; }
.svg { display: block; width: 100%; height: auto; max-height: 460px; overflow: visible; }

.shadow { fill: rgba(var(--turk-rgb), 0.28); stroke: none; }

.dst {
  stroke: rgba(var(--deep-rgb), 0.9);
  stroke-width: 0.16;
  stroke-linejoin: round;
  cursor: pointer;
  outline: none;
  opacity: 0;
  animation: fade 0.5s var(--ease-out) forwards;
  animation-delay: calc(var(--i) * 45ms);
  transition: fill 0.3s var(--ease-out), opacity 0.3s ease;
}
.dst.t-turk { fill: rgba(var(--turk-rgb), 0.45); }
.dst.t-saffron { fill: rgba(var(--saffron-rgb), 0.5); }
.dst.t-coral { fill: rgba(var(--coral-rgb), 0.5); }
.dst.t-mist { fill: rgba(var(--mist-rgb), 0.3); }

.dst.dim { opacity: 0.4; }
.dst.on,
.dst:hover { opacity: 1; }
.dst.on.t-turk { fill: var(--turk); }
.dst.on.t-saffron { fill: var(--saffron); }
.dst.on.t-coral { fill: var(--coral); }
.dst:focus-visible { stroke: var(--snow); stroke-width: 0.3; }

.city {
  fill: rgba(var(--mist-rgb), 0.55);
  stroke: rgba(var(--deep-rgb), 0.9);
  stroke-width: 0.2;
  pointer-events: none;
}
.cityTxt {
  fill: var(--snow);
  font-family: var(--font-data);
  font-size: 0.85px;
  letter-spacing: 0.06px;
  text-anchor: middle;
  pointer-events: none;
  paint-order: stroke;
  stroke: rgba(var(--deep-rgb), 0.85);
  stroke-width: 0.5px;
  stroke-linejoin: round;
}

.border {
  fill: none;
  stroke: var(--turk);
  stroke-width: 1.4;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  pointer-events: none;
}

.card {
  position: absolute;
  left: 0;
  top: 0;
  padding: 11px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-lift);
  pointer-events: none;
}
.cName { margin: 0 0 8px; font-size: 13px; font-weight: 500; }
.cName span { color: var(--mist-dim); font-weight: 400; }
.cGrid { display: flex; gap: 16px; }
.cGrid > div { display: grid; gap: 2px; }
.cGrid b { font-size: 13px; }
.cNo { margin: 0; font-size: 11.5px; color: var(--mist-dim); }
.c-turk { color: var(--turk); }
.c-saffron { color: var(--saffron); }
.c-coral { color: var(--coral); }

.legend {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-top: 6px;
}
.lg { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--mist-dim); }
.lg i { width: 9px; height: 9px; border-radius: 3px; }
.lg.t-turk i { background: var(--turk); }
.lg.t-saffron i { background: var(--saffron); }
.lg.t-coral i { background: var(--coral); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ------------------------------------------------------------ reyting */
.list { display: grid; gap: 12px; align-content: start; }

.lHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.sum { font-size: 12px; color: var(--mist-dim); }
.sum b { color: var(--snow); }

.seg {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.seg button {
  padding: 5px 11px;
  border-radius: 7px;
  font-size: 11.5px;
  color: var(--mist-dim);
  transition: all 0.3s var(--ease-out);
}
.seg button:hover { color: var(--snow); }
.seg button.on { background: var(--turk-dim); color: var(--turk); }

.rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
.rows li {
  display: grid;
  grid-template-columns: 20px minmax(88px, 1.1fr) minmax(0, 1.6fr) 58px 16px;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 9px;
  cursor: pointer;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 35ms);
  transition: background 0.25s ease;
}
.rows li:hover, .rows li.on { background: var(--hover); }

.rn { font-size: 10.5px; color: var(--mist-dim); text-align: right; }
.rNm { font-size: 12.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar {
  height: 6px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.12);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  transform-origin: left;
  animation: meterIn 0.9s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 40ms + 150ms);
  transition: width 0.5s var(--ease-out);
}
.bar i.t-turk { background: var(--turk); }
.bar i.t-saffron { background: var(--saffron); }
.bar i.t-coral { background: var(--coral); }
.bar i.t-mist { background: var(--mist); }

.rv { font-size: 12px; text-align: right; }
.rEd { color: var(--mist-dim); opacity: 0; transition: opacity 0.25s ease; }
.rows li:hover .rEd, .rows li.on .rEd { opacity: 1; color: var(--turk); }

@media (max-width: 980px) {
  .rm { grid-template-columns: 1fr; }
}
</style>
