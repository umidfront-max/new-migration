<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import BarRank from '@/components/charts/BarRank.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'

const countries = db.countries
const consulate = db.consulate
const services = db.consulateServices
const cases = db.consulateCases

/** Kanban ustunlari — bosqichlar bazadagi yozuvlardan yig'iladi */
const STAGES = [
  { key: 'new', label: 'Yangi murojaatlar' },
  { key: 'review', label: 'Ko‘rib chiqilmoqda' },
  { key: 'waiting', label: 'Hujjat kutilmoqda' },
  { key: 'closed', label: 'Yopilgan' },
]

const board = computed(() =>
  STAGES.map((stage) => {
    const rows = cases.filter((row) => row.stage === stage.key)
    return { ...stage, count: rows.length, rows: rows.slice(0, 3) }
  }),
)
/* Qo'shish / tahrirlash */
const target = ref('consulate')
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


/* Murojaat va yordam sonlari bazadagi maydonlardan olinadi */
const byMission = computed(() =>
  [...countries]
    .sort((a, b) => (b.consulateRequests || 0) - (a.consulateRequests || 0))
    .slice(0, 7)
    .map((c) => ({
      name: `${c.flag} ${c.name}`,
      value: c.consulateRequests || 0,
      value2: c.consulateHelped || 0,
      risk: c.risk,
    })),
)

</script>

<template>
  <div class="v-page">
    <div class="cHead">
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>
      <button class="v-btn add" @click="add('consulate')">
        <AppIcon name="plus" :size="14" /> Ko‘rsatkich qo‘shish
      </button>
    </div>

    <div class="v-kpis">
      <StatTile v-for="(c, i) in consulate" :key="c._id" v-bind="c"
                :delay="i * 120" class="enter" :style="{ '--i': i }"
                editable @edit="edit('consulate', c)" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Vakolatxonalar" title="Murojaat va yordam kesimi"
                 hint="Yuqori chiziq — murojaatlar, ostidagi — yordam ko‘rsatilganlar"
                 class="enter" :style="{ '--i': 4 }">
        <BarRank :items="byMission" label-a="Murojaat" label-b="Yordam ko‘rsatilgan" />
      </PanelCard>

      <PanelCard eyebrow="Xizmat turlari" title="Nima bo‘yicha murojaat qilishmoqda"
                 glow="lapis" class="enter" :style="{ '--i': 5 }">
        <template #actions>
          <button class="v-btn add" @click="add('consulateServices')">
            <AppIcon name="plus" :size="14" /> Xizmat
          </button>
        </template>
        <DonutBreak :items="services" center-label="Xizmat"
                    editable @pick="edit('consulateServices', $event)" />
      </PanelCard>
    </div>

    <PanelCard eyebrow="Kabinet" title="Konsullik xodimi uchun ish oynasi"
               :hint="`${cases.length} ta ish yuritilmoqda · yozuvni bosib tahrirlash mumkin`"
               class="enter" :style="{ '--i': 6 }">
      <template #actions>
        <button class="v-btn add" @click="add('consulateCases')">
          <AppIcon name="plus" :size="14" /> Ish qo‘shish
        </button>
      </template>
      <div class="q">
        <div v-for="(column, i) in board" :key="column.key" class="col" :style="{ '--i': i }">
          <p class="ct">{{ column.label }}<span class="num cnt">{{ column.count }}</span></p>
          <div class="cards">
            <button v-for="(row, k) in column.rows" :key="row._id" class="mini"
                    :style="{ '--k': k + 1 }" @click="edit('consulateCases', row)">
              <span class="mid num">{{ row.code }}</span>
              <span class="mtx">{{ row.subject }}</span>
              <span class="mfl">{{ row.flag }} {{ row.name || '—' }}</span>
            </button>
            <p v-if="!column.rows.length" class="mEmpty">Yozuv yo‘q</p>
          </div>
        </div>
      </div>
    </PanelCard>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.cHead { display: flex; align-items: center; justify-content: flex-end; gap: 12px; flex-wrap: wrap; }
.cHead .v-flash { margin: 0; margin-right: auto; }

.q { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.col {
  padding: 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.42);
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 80ms + 150ms);
}
.ct {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--mist);
}
.cnt {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.1);
  color: var(--mist-dim);
}
.cards { display: grid; gap: 8px; }
.mini {
  padding: 10px 11px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.6);
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 80ms + var(--k) * 50ms + 250ms);
  transition: transform 0.3s var(--ease-out), border-color 0.3s ease;
  cursor: grab;
}
.mini:hover { transform: translateY(-2px); border-color: var(--turk); }
.mid { display: block; font-size: 10px; color: var(--mist-dim); }
.mtx { display: block; font-size: 12px; margin-top: 3px; }

@media (max-width: 900px) { .q { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .q { grid-template-columns: 1fr; } }
</style>
