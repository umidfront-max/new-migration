<script setup>
import { computed, toRef } from 'vue'
import { useCountUp, fmt } from '@/composables/useCountUp'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  label: String,
  value: { type: Number, default: 0 },
  delta: Number,
  sub: String,
  tone: { type: String, default: 'lapis' },
  delay: { type: Number, default: 0 },
  spark: { type: Array, default: () => [] },
  /** true bo'lsa — kartochkada tahrirlash tugmasi chiqadi */
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['edit'])

const shown = useCountUp(toRef(props, 'value'), { delay: props.delay, duration: 1600 })
const display = computed(() => fmt(Math.round(shown.value)))
const up = computed(() => (props.delta ?? 0) >= 0)

const sparkPath = computed(() => {
  const v = props.spark
  if (!v.length) return ''
  const min = Math.min(...v)
  const max = Math.max(...v)
  const span = max - min || 1
  return v
    .map((n, i) => {
      const x = (i / (v.length - 1)) * 100
      const y = 28 - ((n - min) / span) * 24
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})
</script>

<template>
  <article class="tile" :class="`t-${tone}`">
    <span class="bar" />
    <div class="top">
      <p class="eyebrow">{{ label }}</p>
      <span v-if="delta !== undefined" class="delta" :class="{ down: !up }">
        <AppIcon :name="up ? 'arrowUp' : 'arrowDown'" :size="12" />
        {{ Math.abs(delta).toFixed(1) }}%
      </span>
    </div>

    <p class="num value">{{ display }}</p>
    <p v-if="sub" class="sub">{{ sub }}</p>

    <svg v-if="sparkPath" class="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
      <path :d="sparkPath" fill="none" stroke="currentColor" stroke-width="1.6" />
    </svg>

    <button v-if="editable" class="pen" aria-label="Tahrirlash" @click="emit('edit')">
      <AppIcon name="edit" :size="13" />
    </button>

    <span class="sheen" />
  </article>
</template>

<style scoped>
.pen {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--mist-dim);
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.3s var(--ease-out);
}
.tile:hover .pen { opacity: 1; transform: none; }
.pen:hover { color: var(--turk); border-color: var(--turk); }

.tile {
  position: relative;
  padding: 18px 20px 20px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: linear-gradient(165deg, rgba(var(--panel-hi-rgb), 0.65), rgba(var(--panel-rgb), 0.9));
  overflow: hidden;
  transition: transform 0.45s var(--ease-out), border-color 0.45s var(--ease-out);
}

.tile:hover {
  transform: translateY(-4px);
  border-color: var(--line-strong);
}

.tile:hover .sheen {
  animation: sweep 1.1s var(--ease-out);
}

.sheen {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  background: linear-gradient(100deg, transparent, rgba(var(--white-rgb), 0.07), transparent);
  transform: translateX(-120%);
  pointer-events: none;
}

.bar {
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 2px;
  border-radius: 2px;
  background: currentColor;
  opacity: 0.85;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.value {
  font-size: clamp(26px, 3.2vw, 36px);
  font-weight: 700;
  margin: 10px 0 0;
  line-height: 1;
}

.sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--mist-dim);
}

.delta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-data);
  font-size: 11px;
  font-weight: 500;
  padding: 3px 7px;
  border-radius: 99px;
  color: var(--turk);
  background: var(--turk-dim);
}

.delta.down {
  color: var(--coral);
  background: var(--coral-dim);
}

.spark {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 62%;
  height: 46px;
  opacity: 0.35;
}

.t-lapis { color: var(--lapis); }
.t-turk { color: var(--turk); }
.t-saffron { color: var(--saffron); }
.t-coral { color: var(--coral); }
.t-violet { color: var(--violet); }
.t-mist { color: var(--mist); }
</style>
