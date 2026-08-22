<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { db } from '@/stores/db'
import AppIcon from '@/components/ui/AppIcon.vue'

const sosEvents = db.sosEvents

const props = defineProps({
  limit: { type: Number, default: 6 },
  live: { type: Boolean, default: true },
  /** true bo'lsa — har bir murojaatda tahrirlash tugmasi chiqadi */
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'resolve'])

const items = ref(sosEvents.slice(0, props.limit).map((e) => ({ ...e })))
let timer = null
let cursor = props.limit

const sevTone = { critical: 'violet', high: 'coral', mid: 'saffron', low: 'turk' }
const sevName = { critical: 'Kritik', high: 'Shoshilinch', mid: 'O‘rta', low: 'Past' }

const push = () => {
  if (!sosEvents.length) return
  const next = sosEvents[cursor % sosEvents.length]
  cursor++
  items.value = [{ ...next, id: `${next.id}-${cursor}`, minutesAgo: 0 }, ...items.value].slice(0, props.limit)
}

/* Bazaga qo'lda qo'shilgan murojaat darhol oqim boshiga chiqadi */
watch(
  () => sosEvents.length,
  (n, o) => {
    if (n > o) items.value = [{ ...sosEvents[0], minutesAgo: 0 }, ...items.value].slice(0, props.limit)
    else items.value = sosEvents.slice(0, props.limit).map((e) => ({ ...e }))
  },
)

onMounted(() => {
  if (!props.live) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(push, 7000)
})
onUnmounted(() => clearInterval(timer))

const ago = (m) => (m === 0 ? 'hozir' : m < 60 ? `${m} daq oldin` : `${Math.floor(m / 60)} soat oldin`)
const openCount = computed(() => items.value.filter((i) => i.severity !== 'low').length)
</script>

<template>
  <div class="feed">
    <div class="stat">
      <span class="live"><i />JONLI</span>
      <span class="muted">Ochiq murojaatlar: <b class="num">{{ openCount }}</b></span>
    </div>

    <TransitionGroup name="list" tag="ul" class="list">
      <li v-for="e in items" :key="e.id" :class="`s-${sevTone[e.severity]}`">
        <span class="ring"><i /></span>
        <div class="mid">
          <p class="ttl">{{ e.type }}</p>
          <p class="meta">
            {{ e.flag }} {{ e.city }}, {{ e.country }}
            <span class="dotsep">·</span>
            <span class="num">{{ e.phone }}</span>
          </p>
        </div>
        <div class="right">
          <span class="sev">{{ sevName[e.severity] }}</span>
          <span class="time num">{{ ago(e.minutesAgo) }}</span>
        </div>
        <span v-if="editable" class="acts">
          <button v-if="!e.resolved" class="edit" title="Murojaatni yopish"
                  @click="emit('resolve', e)">
            <AppIcon name="check" :size="13" />
          </button>
          <button class="edit" aria-label="Tahrirlash" @click="emit('edit', e)">
            <AppIcon name="edit" :size="13" />
          </button>
        </span>
      </li>
    </TransitionGroup>

    <button class="all">
      Barcha murojaatlar
      <AppIcon name="chevron" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.feed { position: relative; }

.stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px 12px;
  font-size: 12px;
}

.live {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--coral);
}
.live i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--coral);
  box-shadow: 0 0 0 0 rgba(var(--coral-rgb), 0.6);
  animation: blip 2s var(--ease-out) infinite;
}
@keyframes blip {
  0% { box-shadow: 0 0 0 0 rgba(var(--coral-rgb), 0.55); }
  70% { box-shadow: 0 0 0 9px rgba(var(--coral-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--coral-rgb), 0); }
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
}

.acts { display: inline-flex; gap: 2px; flex-shrink: 0; }
.edit {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid transparent;
  color: var(--mist-dim);
  opacity: 0;
  transition: all 0.3s var(--ease-out);
}
.list li:hover .edit { opacity: 1; }
.edit:hover { color: var(--turk); border-color: var(--turk); }

.list li {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 11px 10px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  transition: background 0.3s ease, border-color 0.3s ease, transform 0.3s var(--ease-out);
}
.list li:hover {
  background: rgba(var(--mist-rgb), 0.05);
  border-color: var(--line);
  transform: translateX(3px);
}

.ring {
  position: relative;
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}
.ring i {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: currentColor;
}
.ring::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid currentColor;
  animation: pulse-ring 2.6s var(--ease-out) infinite;
}

.s-violet { color: var(--violet); }
.s-coral { color: var(--coral); }
.s-saffron { color: var(--saffron); }
.s-turk { color: var(--turk); }

.mid { flex: 1; min-width: 0; }
.ttl {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--snow);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--mist-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dotsep { margin: 0 5px; }

.right { text-align: right; flex-shrink: 0; max-width: 92px; }
.sev {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: currentColor;
}
.time { display: block; font-size: 10.5px; color: var(--mist-dim); margin-top: 2px; }

.all {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  color: var(--mist);
  font-size: 12.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s var(--ease-out);
}
.all:hover {
  border-color: var(--turk);
  color: var(--turk);
  gap: 10px;
}
</style>
