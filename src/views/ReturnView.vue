<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import AreaTrend from '@/components/charts/AreaTrend.vue'
import BarRank from '@/components/charts/BarRank.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, serie } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/labels'

const regions = db.regions
const returnStats = db.returnStats
const programs = db.returnPrograms

const backSeries = computed(() => [serie('back')].filter(Boolean))
/* Qo'shish / tahrirlash */
const target = ref('returnStats')
const { modal, editing, flash, openEdit, close, onSaved, onRemoved } = useRecordModal()
const add = (c) => {
  target.value = c
  editing.value = null
  modal.value = true
}
const edit = (c, row) => {
  target.value = c
  openEdit(row)
}

const byRegion = computed(() =>
  [...regions].sort((a, b) => b.back - a.back).slice(0, 8).map((r) => ({
    name: r.name,
    value: r.back,
    value2: Math.round(r.back * 0.47),
    risk: r.risk,
  })),
)

</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile v-for="(s, i) in returnStats" :key="s._id" v-bind="s"
                :delay="i * 120" class="enter" :style="{ '--i': i }"
                editable @edit="edit('returnStats', s)" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Dinamika" title="Qaytish oqimi"
                 hint="Cho‘qqi odatda sentabr–oktabr oylariga to‘g‘ri keladi"
                 class="enter" :style="{ '--i': 4 }">
        <AreaTrend :series="backSeries" :labels="months" :height="250" />
      </PanelCard>

      <PanelCard eyebrow="Dasturlar" title="Reintegratsiya" glow="turk"
                 class="enter" :style="{ '--i': 5 }">
        <template #actions>
          <button class="v-btn add" @click="add('returnPrograms')">
            <AppIcon name="plus" :size="14" /> Dastur
          </button>
        </template>
        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <div v-for="(p, i) in programs" :key="p._id" class="pr" :style="{ '--i': i }">
          <div class="prTop">
            <span class="prN">{{ p.name }}</span>
            <span class="prR">
              <span class="num prV">{{ Math.round((p.done / (p.target || 1)) * 100) }}%</span>
              <button class="v-mini" aria-label="Tahrirlash" @click="edit('returnPrograms', p)">
                <AppIcon name="edit" :size="13" />
              </button>
            </span>
          </div>
          <div class="v-meter" :style="{ '--i': i }">
            <i :style="{ width: Math.min(100, (p.done / (p.target || 1)) * 100) + '%', background: `var(--${p.tone})` }" />
          </div>
          <p class="prS num">{{ (p.done || 0).toLocaleString('ru-RU') }} / {{ (p.target || 0).toLocaleString('ru-RU') }}</p>
        </div>
      </PanelCard>
    </div>

    <PanelCard eyebrow="Hududlar" title="Qaytganlar va ish bilan ta’minlanganlar"
               class="enter" :style="{ '--i': 6 }">
      <BarRank :items="byRegion" label-a="Qaytgan" label-b="Ish bilan ta’minlangan" />
    </PanelCard>
  </div>
</template>

<style scoped>
.pr {
  margin-bottom: 18px;
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 80ms + 200ms);
}
.pr:last-child { margin-bottom: 0; }
.prTop { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 7px; }
.prN { font-size: 12.5px; color: var(--mist); }
.prV { font-size: 13px; font-weight: 700; }
.prS { margin: 6px 0 0; font-size: 11px; color: var(--mist-dim); }
</style>
