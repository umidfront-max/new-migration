<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import '@/stores/theme'

const route = useRoute()
const booted = ref(false)
onMounted(() => setTimeout(() => (booted.value = true), 900))
</script>

<template>
  <Transition name="boot">
    <div v-if="!booted" class="boot">
      <svg viewBox="0 0 60 60" width="52" height="52">
        <circle cx="30" cy="30" r="8" fill="var(--turk)" />
        <circle cx="30" cy="30" r="18" fill="none" stroke="var(--turk)" stroke-width="1"
                stroke-dasharray="60 200" class="o1" />
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--saffron)" stroke-width="1"
                stroke-dasharray="30 200" class="o2" />
      </svg>
      <p class="eyebrow">Ma’lumotlar yuklanmoqda</p>
    </div>
  </Transition>

  <!-- Login kabi sahifalar qobiqsiz ochiladi -->
  <RouterView v-if="route.meta.blank" v-slot="{ Component }">
    <Transition name="view" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>

  <AppShell v-else>
    <RouterView v-slot="{ Component, route: r }">
      <Transition name="view" mode="out-in">
        <component :is="Component" :key="r.path" />
      </Transition>
    </RouterView>
  </AppShell>
</template>

<style scoped>
.boot {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 18px;
  background: var(--ink-900);
}
.o1 { transform-origin: center; animation: spin 1.4s linear infinite; }
.o2 { transform-origin: center; animation: spin 2.6s linear infinite reverse; }

.boot-leave-active { transition: opacity 0.6s var(--ease-out); }
.boot-leave-to { opacity: 0; }
</style>
