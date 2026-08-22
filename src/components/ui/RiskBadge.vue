<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: Number,
  label: String,
  dot: { type: Boolean, default: true },
})

const tone = computed(() => {
  const s = props.score ?? 0
  if (s >= 86) return 'violet'
  if (s >= 61) return 'coral'
  if (s >= 31) return 'saffron'
  return 'turk'
})

const text = computed(() => {
  if (props.label) return props.label
  const s = props.score ?? 0
  if (s >= 86) return 'Kritik'
  if (s >= 61) return 'Yuqori'
  if (s >= 31) return 'O‘rta'
  return 'Past'
})
</script>

<template>
  <span class="badge" :class="`b-${tone}`">
    <span v-if="dot" class="dot" />
    {{ text }}
    <span v-if="score !== undefined" class="num sc">{{ score }}</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: 11.5px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 22%, transparent);
}

.sc {
  opacity: 0.7;
  font-size: 10.5px;
}

.b-turk { color: var(--turk); }
.b-saffron { color: var(--saffron); }
.b-coral { color: var(--coral); }
.b-violet { color: var(--violet); }
</style>
