<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import RiskGauge from '@/components/charts/RiskGauge.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import RiskBadge from '@/components/ui/RiskBadge.vue'
import BarRank from '@/components/charts/BarRank.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, setting, summary } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { fmt } from '@/composables/useCountUp'

const migrants = db.migrants
const countries = db.countries
const riskDistribution = db.riskDistribution
const weights = db.riskWeights
const overallRisk = computed(() => setting('overallRisk')?.value ?? 38)
/* Qo'shish / tahrirlash */
const target = ref('riskWeights')
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


const topRisk = computed(() =>
  [...migrants].sort((a, b) => b.score - a.score).slice(0, 10),
)

const byCountry = computed(() =>
  [...countries].sort((a, b) => b.risk - a.risk).slice(0, 8).map((c) => ({
    name: `${c.flag} ${c.name}`, value: c.risk, risk: c.risk,
  })),
)
</script>

<template>
  <div class="v-page">
    <div class="v-3">
      <PanelCard eyebrow="Model natijasi" title="Umumiy xavf indeksi" glow="saffron" class="enter">
        <template #actions>
          <button class="v-btn" @click="edit('settings', setting('overallRisk'))">
            <AppIcon name="edit" :size="13" /> Indeks
          </button>
        </template>
        <RiskGauge :score="overallRisk"
                   :caption="`${fmt(summary.registry.count || 0)} ta reyestr yozuvi bo‘yicha`" />
      </PanelCard>

      <PanelCard eyebrow="Taqsimot" title="Xavf darajalari" class="enter" :style="{ '--i': 1 }">
        <template #actions>
          <button class="v-btn add" @click="add('riskDistribution')">
            <AppIcon name="plus" :size="14" /> Daraja
          </button>
        </template>
        <DonutBreak :items="riskDistribution" center-label="Migrant"
                    editable @pick="edit('riskDistribution', $event)" />
      </PanelCard>

      <PanelCard eyebrow="Model" title="Omillar vazni"
                 hint="Vaznlarni o‘zgartirsangiz ball qayta hisoblanadi"
                 class="enter" :style="{ '--i': 2 }">
        <template #actions>
          <button class="v-btn add" @click="add('riskWeights')">
            <AppIcon name="plus" :size="14" /> Omil
          </button>
        </template>
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>
        <div v-for="(f, i) in weights" :key="f._id" class="wf" :style="{ '--i': i }"
             @dblclick="edit('riskWeights', f)">
          <div class="wTop">
            <span class="wL">{{ f.label }}</span>
            <span class="num wV">{{ f.w }}%</span>
          </div>
          <input type="range" min="0" max="40" v-model.number="f.w" />
        </div>
      </PanelCard>
    </div>

    <div class="v-1-2">
      <PanelCard eyebrow="Geografiya" title="Yo‘nalish xavfi" class="enter" :style="{ '--i': 3 }">
        <BarRank :items="byCountry" :dual="false" />
      </PanelCard>

      <PanelCard eyebrow="Ustuvor nazorat" title="Eng yuqori ball olgan migrantlar"
                 hint="Model tomonidan avtomatik shakllantiriladi, har 6 soatda yangilanadi"
                 glow="coral" class="enter" :style="{ '--i': 4 }">
        <div class="v-tblWrap">
          <table class="v-tbl">
            <thead>
              <tr><th>F.I.Sh</th><th>PINFL</th><th>Davlat</th><th>Holati</th><th>Ball</th></tr>
            </thead>
            <tbody>
              <tr v-for="(m, i) in topRisk" :key="m._id" :style="{ '--i': i }">
                <td class="nm">{{ m.name }}</td>
                <td class="num muted">{{ m.pinfl }}</td>
                <td>{{ m.flag }} {{ m.country }}</td>
                <td class="muted">{{ m.risk }}</td>
                <td><RiskBadge :score="m.score" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </PanelCard>
    </div>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.nm { font-weight: 500; white-space: nowrap; }

.wf {
  margin-bottom: 14px;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 60ms + 200ms);
}
.wTop { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.wL { font-size: 12px; color: var(--mist); }
.wV { font-size: 12px; color: var(--saffron); }

input[type='range'] {
  width: 100%;
  height: 4px;
  appearance: none;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--saffron), rgba(var(--mist-rgb), 0.14));
  cursor: pointer;
}
input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--saffron);
  border: 2px solid var(--ink-900);
  box-shadow: 0 0 0 3px rgba(var(--saffron-rgb), 0.2);
  transition: transform 0.25s var(--ease-out);
}
input[type='range']::-webkit-slider-thumb:hover { transform: scale(1.25); }
input[type='range']::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: var(--saffron); border: 2px solid var(--ink-900);
}
</style>
