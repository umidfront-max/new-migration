<script setup>
import { computed } from 'vue'
import { useReveal } from '@/composables/useMotion'
import { fmt } from '@/composables/useCountUp'

const props = defineProps({
  items: { type: Array, required: true }, // [{name, value, value2?, risk?}]
  max: Number,
  labelA: { type: String, default: 'Chiqqan' },
  labelB: { type: String, default: 'Qaytgan' },
  dual: { type: Boolean, default: true },
})

const { el, shown } = useReveal()
const peak = computed(() => props.max || Math.max(...props.items.map((i) => i.value)))
const tone = (r) => (r >= 55 ? 'coral' : r >= 40 ? 'saffron' : 'turk')
</script>

<template>
  <div ref="el" class="rank">
    <div v-for="(it, i) in items" :key="it.name" class="row" :style="{ '--i': i }">
      <span class="rk num">{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="nm">{{ it.name }}</span>
      <div class="track">
        <i class="fill" :class="`f-${tone(it.risk ?? 0)}`"
           :style="{ width: shown ? (it.value / peak) * 100 + '%' : '0%', '--d': i * 60 + 'ms' }" />
        <i v-if="dual && it.value2 !== undefined" class="fill sub"
           :style="{ width: shown ? (it.value2 / peak) * 100 + '%' : '0%', '--d': i * 60 + 90 + 'ms' }" />
      </div>
      <span class="vl num">{{ fmt(it.value) }}</span>
    </div>

    <p v-if="dual" class="lg">
      <span><i class="sw a" />{{ labelA }}</span>
      <span><i class="sw b" />{{ labelB }}</span>
    </p>
  </div>
</template>

<style scoped>
.rank { display: grid; gap: 2px; }

.row {
  display: grid;
  grid-template-columns: 24px minmax(96px, 1.1fr) 3fr 74px;
  align-items: center;
  gap: 12px;
  padding: 7px 6px;
  border-radius: var(--r-sm);
  transition: background 0.25s ease;
}
.row:hover { background: rgba(var(--mist-rgb), 0.05); }

.rk { font-size: 10px; color: var(--mist-dim); }
.nm { font-size: 12.5px; color: var(--mist); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vl { font-size: 12px; text-align: right; }

.track {
  position: relative;
  height: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}

.fill {
  display: block;
  height: 6px;
  border-radius: 99px;
  transition: width 1s var(--ease-out);
  transition-delay: var(--d);
}
.f-turk { background: linear-gradient(90deg, rgba(var(--turk-rgb), 0.35), var(--turk)); }
.f-saffron { background: linear-gradient(90deg, rgba(var(--saffron-rgb), 0.35), var(--saffron)); }
.f-coral { background: linear-gradient(90deg, rgba(var(--coral-rgb), 0.35), var(--coral)); }

.sub {
  height: 3px;
  background: rgba(var(--mist-rgb), 0.42);
}

.lg {
  display: flex;
  gap: 18px;
  justify-content: flex-end;
  margin: 10px 6px 0;
  font-size: 11.5px;
  color: var(--mist-dim);
}
.lg span { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 12px; height: 4px; border-radius: 99px; }
.sw.a { background: var(--turk); }
.sw.b { background: rgba(var(--mist-rgb), 0.42); }

@media (max-width: 620px) {
  .row { grid-template-columns: 20px 1fr 60px; }
  .track { grid-column: 1 / -1; }
}
</style>
