<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import AreaTrend from '@/components/charts/AreaTrend.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/labels'
import { fmt } from '@/composables/useCountUp'

const borderPoints = db.borderPoints
const borderSources = db.borderSources
const borderStats = db.borderStats

const flowSeries = computed(() => db.series.filter((s) => s.key === 'out' || s.key === 'back'))

const totalOut = computed(() => borderPoints.reduce((a, b) => a + b.out, 0))
const totalIn = computed(() => borderPoints.reduce((a, b) => a + b.in, 0))

const tone = (l) => (l >= 85 ? 'coral' : l >= 60 ? 'saffron' : 'turk')

const target = ref('borderPoints')
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
const openAdd = () => add('borderPoints')
</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile label="Bugun chiqqanlar" :value="totalOut" :delta="4.6" tone="turk" sub="barcha o‘tkazish punktlari" class="enter" />
      <StatTile label="Bugun kirganlar" :value="totalIn" :delta="2.1" tone="lapis" sub="barcha o‘tkazish punktlari" :delay="120" class="enter" :style="{ '--i': 1 }" />
      <StatTile v-for="(b, i) in borderStats" :key="b._id" v-bind="b"
                :delay="240 + i * 120" class="enter" :style="{ '--i': 2 + i }"
                editable @edit="edit('borderStats', b)" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="O‘tkazish punktlari" title="Yuklama holati"
                 hint="Yuklama 85% dan oshganda navbat rejimi avtomatik yoqiladi"
                 class="enter" :style="{ '--i': 4 }">
        <template #actions>
          <button class="v-btn add" @click="openAdd">
            <AppIcon name="plus" :size="14" /> Punkt qo‘shish
          </button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <div class="pts">
          <div v-for="(p, i) in borderPoints" :key="p._id" class="pt" :style="{ '--i': i }">
            <div class="ptTop">
              <span class="ptNm">
                {{ p.name }}
                <span v-if="p.region" class="ptRg">{{ p.region }}</span>
              </span>
              <span class="ptRight">
                <span class="num ptLd" :class="`c-${tone(p.load)}`">{{ p.load }}%</span>
                <button class="v-mini" aria-label="Tahrirlash" @click="edit('borderPoints', p)">
                  <AppIcon name="edit" :size="13" />
                </button>
              </span>
            </div>
            <div class="v-meter" :style="{ '--i': i }">
              <i :class="`c-${tone(p.load)}`" :style="{ width: p.load + '%', background: 'currentColor' }" />
            </div>
            <div class="ptBot">
              <span>Chiqish <b class="num">{{ fmt(p.out) }}</b></span>
              <span>Kirish <b class="num">{{ fmt(p.in) }}</b></span>
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard eyebrow="Integratsiya" title="Ma’lumot manbalari" class="enter" :style="{ '--i': 5 }">
        <template #actions>
          <button class="v-btn add" @click="add('borderSources')">
            <AppIcon name="plus" :size="14" /> Manba
          </button>
        </template>
        <ul class="src">
          <li v-for="(s, i) in borderSources" :key="s._id" :style="{ '--i': i }">
            <span class="dot" /> {{ s.name }}
            <span class="ok">{{ s.status }}</span>
            <button class="v-mini" aria-label="Tahrirlash" @click="edit('borderSources', s)">
              <AppIcon name="edit" :size="13" />
            </button>
          </li>
        </ul>
        <p class="v-note" style="margin-top: 14px">
          Har bir o‘tish hodisasi reyestrdagi PINFL bilan solishtiriladi. Mos kelmagan
          yozuvlar tekshiruv navbatiga tushadi.
        </p>
      </PanelCard>
    </div>

    <PanelCard eyebrow="Dinamika" title="Chegaradan o‘tish oqimi" class="enter" :style="{ '--i': 6 }">
      <AreaTrend :series="flowSeries" :labels="months" :height="240" />
    </PanelCard>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.pts { display: grid; gap: 16px; }
.pt {
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 70ms + 150ms);
}
.ptTop { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 7px; }
.ptRight { display: inline-flex; align-items: center; gap: 10px; }
.ptNm { font-size: 13px; display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.ptRg {
  padding: 2px 9px;
  border-radius: 99px;
  border: 1px solid var(--line);
  font-size: 10.5px;
  color: var(--mist-dim);
}
.ptLd { font-size: 13px; font-weight: 700; }
.ptBot {
  display: flex;
  gap: 18px;
  margin-top: 7px;
  font-size: 11.5px;
  color: var(--mist-dim);
}
.ptBot b { color: var(--mist); margin-left: 4px; }

.c-turk { color: var(--turk); }
.c-saffron { color: var(--saffron); }
.c-coral { color: var(--coral); }

.src { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.src li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: var(--r-sm);
  font-size: 12.5px;
  color: var(--mist);
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 60ms + 200ms);
}
.src li:hover { background: rgba(var(--mist-rgb), 0.05); }
.dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--turk);
  box-shadow: 0 0 0 3px rgba(var(--turk-rgb), 0.14);
}
.ok {
  margin-left: auto;
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--turk);
  text-transform: uppercase;
}
</style>
