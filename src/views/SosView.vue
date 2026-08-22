<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import SosFeed from '@/components/panels/SosFeed.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, exportCollection, resolveSosEvent, serie } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/labels'
import AreaTrend from '@/components/charts/AreaTrend.vue'

const sosEvents = db.sosEvents
const channels = db.sosChannels
const sosStats = db.sosStats

/* Qo'shish / tahrirlash */
const target = ref('sosEvents')
const { modal, editing, flash, openEdit, close, onSaved, onRemoved, run } = useRecordModal()

/** Murojaatni yopish */
const resolve = (event) =>
  run(() => resolveSosEvent(event), `${event.id} — murojaat yopildi`)

/** Jurnalga CSV eksport */
const exportLog = () =>
  run(() => exportCollection('sosEvents'), 'SOS jurnali yuklab olindi')
const add = (c) => {
  target.value = c
  editing.value = null
  modal.value = true
}
const edit = (c, row) => {
  target.value = c
  openEdit(row)
}

const openAdd = () => add('sosEvents')

const bySeverity = computed(() => {
  const map = { critical: 0, high: 0, mid: 0, low: 0 }
  sosEvents.forEach((e) => map[e.severity]++)
  return [
    { label: 'Kritik', value: map.critical * 9, tone: 'violet' },
    { label: 'Shoshilinch', value: map.high * 14, tone: 'coral' },
    { label: 'O‘rta', value: map.mid * 21, tone: 'saffron' },
    { label: 'Past', value: map.low * 26, tone: 'turk' },
  ]
})

const sosTrend = computed(() => [serie('sos')].filter(Boolean))
</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile v-for="(s, i) in sosStats" :key="s._id" v-bind="s"
                :delay="i * 120" class="enter" :style="{ '--i': i }"
                editable @edit="edit('sosStats', s)" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Jonli oqim" title="Kelib tushayotgan murojaatlar"
                 hint="Telefon raqami va lokatsiya migrant tomonidan taqdim etiladi"
                 glow="coral" class="enter" :style="{ '--i': 4 }">
        <template #actions>
          <button class="v-btn" @click="exportLog">
            <AppIcon name="export" :size="14" /> Jurnalga
          </button>
          <button class="v-btn add" @click="openAdd">
            <AppIcon name="plus" :size="14" /> Murojaat qo‘shish
          </button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <SosFeed :limit="10" editable
                 @edit="edit('sosEvents', $event)" @resolve="resolve" />
      </PanelCard>

      <div class="side">
        <PanelCard eyebrow="Jiddiylik" title="Darajalar bo‘yicha" class="enter" :style="{ '--i': 5 }">
          <DonutBreak :items="bySeverity" center-label="Murojaat" />
        </PanelCard>

        <PanelCard eyebrow="Kanallar" title="Qayerdan kelmoqda" class="enter" :style="{ '--i': 6 }">
          <template #actions>
            <button class="v-btn add" @click="add('sosChannels')">
              <AppIcon name="plus" :size="14" /> Kanal
            </button>
          </template>
          <div v-for="(c, i) in channels" :key="c._id" class="ch" :style="{ '--i': i }">
            <span class="ci"><AppIcon :name="c.icon" :size="15" /></span>
            <span class="cn">{{ c.name }}</span>
            <div class="v-meter" :style="{ '--i': i }">
              <i :style="{ width: c.share + '%', background: 'var(--turk)' }" />
            </div>
            <b class="num cs">{{ c.share }}%</b>
            <button class="v-mini" aria-label="Tahrirlash" @click="edit('sosChannels', c)">
              <AppIcon name="edit" :size="13" />
            </button>
          </div>
        </PanelCard>
      </div>
    </div>

    <PanelCard eyebrow="Dinamika" title="12 oylik chaqiruvlar" class="enter" :style="{ '--i': 7 }">
      <template #actions>
        <button v-for="s in sosTrend" :key="s._id" class="v-btn" @click="edit('series', s)">
          <AppIcon name="edit" :size="13" /> Qiymatlar
        </button>
      </template>
      <AreaTrend :series="sosTrend" :labels="months" :height="230" />
    </PanelCard>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.side { display: grid; gap: 18px; align-content: start; }

.ch {
  display: grid;
  grid-template-columns: 30px 1fr 70px 40px;
  align-items: center;
  gap: 11px;
  padding: 9px 4px;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 70ms + 200ms);
}
.ci {
  display: grid;
  place-items: center;
  width: 30px; height: 30px;
  border-radius: 9px;
  border: 1px solid var(--line);
  color: var(--turk);
}
.cn { font-size: 12.5px; color: var(--mist); }
.cs { font-size: 12px; text-align: right; }
</style>
