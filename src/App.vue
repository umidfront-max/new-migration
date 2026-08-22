<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuth, hasStoredToken } from '@/stores/auth'
import { loadAll, refreshAll, status } from '@/stores/db'
import { API_URL } from '@/services/api'
import '@/stores/theme'

const route = useRoute()
const router = useRouter()
const { isAuthed, restore } = useAuth()

const booted = ref(false)

/** Ma'lumot yuklanmaguncha qobiq ko'rsatilmaydi */
const needsData = computed(() => !route.meta.blank && isAuthed.value)
const showSplash = computed(() => !booted.value || (needsData.value && !status.ready && !status.error))
const showError = computed(() => needsData.value && !!status.error)

/** Sessiyani tiklab, ma'lumotni yuklaydi */
const boot = async () => {
  if (hasStoredToken()) {
    const restored = await restore()
    if (!restored) await router.replace('/login')
  }
  if (isAuthed.value) {
    await loadAll().catch(() => { /* xato `status.error` da ko'rsatiladi */ })
  }
  booted.value = true
}

onMounted(boot)

/* Kirgandan keyin ma'lumot yuklanadi */
watch(isAuthed, async (value) => {
  if (value && !status.ready) {
    await loadAll().catch(() => {})
  }
})

const retry = () => refreshAll().catch(() => {})
</script>

<template>
  <!-- Yuklanish ekrani -->
  <Transition name="boot">
    <div v-if="showSplash" class="boot">
      <svg viewBox="0 0 60 60" width="52" height="52">
        <circle cx="30" cy="30" r="8" fill="var(--turk)" />
        <circle cx="30" cy="30" r="18" fill="none" stroke="var(--turk)" stroke-width="1"
                stroke-dasharray="60 200" class="o1" />
        <circle cx="30" cy="30" r="26" fill="none" stroke="var(--saffron)" stroke-width="1"
                stroke-dasharray="30 200" class="o2" />
      </svg>
      <p class="eyebrow">Ma’lumotlar serverdan yuklanmoqda</p>
    </div>
  </Transition>

  <!-- Serverga ulanib bo'lmadi -->
  <div v-if="showError" class="fail">
    <span class="fIcon"><AppIcon name="plug" :size="26" /></span>
    <h1>Serverga ulanib bo‘lmadi</h1>
    <p class="fMsg">{{ status.error }}</p>
    <p class="fHint">
      Backend ishga tushirilganini tekshiring:<br />
      <code class="num">{{ API_URL }}</code>
    </p>
    <button class="fBtn" :disabled="status.loading" @click="retry">
      <AppIcon name="refresh" :size="15" />
      {{ status.loading ? 'Urinilmoqda…' : 'Qayta urinish' }}
    </button>
  </div>

  <template v-else>
    <!-- Login kabi sahifalar qobiqsiz ochiladi -->
    <RouterView v-if="route.meta.blank" v-slot="{ Component }">
      <Transition name="view" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>

    <AppShell v-else-if="status.ready">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="view" mode="out-in">
          <component :is="Component" :key="r.path" />
        </Transition>
      </RouterView>
    </AppShell>
  </template>
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

/* xato ekrani */
.fail {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  padding: 32px;
  text-align: center;
  background: var(--ink-900);
}
.fIcon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin-bottom: 6px;
  border-radius: 18px;
  border: 1px solid var(--coral);
  background: var(--coral-dim);
  color: var(--coral);
}
.fail h1 { font-size: 22px; }
.fMsg { margin: 0; font-size: 13.5px; color: var(--coral); }
.fHint { margin: 6px 0 10px; font-size: 12.5px; line-height: 1.8; color: var(--mist-dim); }
.fHint code {
  padding: 3px 9px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--mist);
}
.fBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 20px;
  border-radius: 11px;
  border: 1px solid var(--turk);
  background: var(--turk-dim);
  font-size: 13px;
  color: var(--turk);
  transition: all 0.3s var(--ease-out);
}
.fBtn:hover:not(:disabled) { background: rgba(var(--turk-rgb), 0.24); }
.fBtn:disabled { opacity: 0.6; cursor: default; }
</style>
