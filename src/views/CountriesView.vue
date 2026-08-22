<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import RiskBadge from '@/components/ui/RiskBadge.vue'
import GeoMap from '@/components/charts/GeoMap.vue'
import FlowMap from '@/components/charts/FlowMap.vue'
import BarRank from '@/components/charts/BarRank.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { origin } from '@/data/mock'
import { fmt } from '@/composables/useCountUp'
import { useApp } from '@/stores/app'

const countries = db.countries
const regions = db.regions
const sosEvents = db.sosEvents
const purposes = db.purposes

const { state, selectCountry, setRegion } = useApp()
const sortKey = ref('total')
const mode = ref('geo') // geo | schema

const sorted = computed(() => [...countries].sort((a, b) => b[sortKey.value] - a[sortKey.value]))
const remitItems = computed(() =>
  sorted.value.slice(0, 8).map((c) => ({ name: c.name, value: c.remit, risk: c.risk })),
)
const totalRemit = computed(() => countries.reduce((a, c) => a + c.remit, 0))

const pick = (code) => selectCountry(code)

/* Tanlangan davlat bo'yicha to'liq kesim */
const picked = computed(() => countries.find((c) => c.code === state.country))

const purposeRows = computed(() => {
  const c = picked.value
  if (!c) return []
  const rows = [
    { label: 'Ishlash', value: c.work || 0, tone: 'turk' },
    { label: 'O‘qish', value: c.study || 0, tone: 'lapis' },
    { label: 'Davolanish', value: c.medical || 0, tone: 'saffron' },
    { label: 'Doimiy yashash', value: c.residence || 0, tone: 'violet' },
    { label: 'Sayohat', value: c.travel || 0, tone: 'mist' },
  ]
  const max = Math.max(...rows.map((r) => r.value), 1)
  const sum = rows.reduce((a, r) => a + r.value, 0) || 1
  return rows.map((r) => ({ ...r, pct: (r.value / max) * 100, share: (r.value / sum) * 100 }))
})

const controlRows = computed(() => {
  const c = picked.value
  if (!c) return []
  return [
    { label: 'Qidiruvda', value: c.wanted || 0, tone: 'saffron', icon: 'search' },
    { label: 'Jazoni o‘tayotgan (JMda)', value: c.jailed || 0, tone: 'coral', icon: 'shield' },
    { label: 'Bedarak yo‘qolgan', value: c.missing || 0, tone: 'violet', icon: 'pin' },
    { label: 'Jo‘natmalar soni', value: c.remitCount || 0, tone: 'turk', icon: 'export', unit: 'ming' },
  ]
})

/* Davlat va hudud yozuvlari — qo'shish va tahrirlash */
const target = ref('countries') // countries | regions
const { modal, editing, flash, openEdit, close, onSaved, onRemoved } = useRecordModal({
  added: 'Yozuv qo‘shildi',
  updated: 'Yozuv yangilandi',
  removed: 'Yozuv o‘chirildi',
})

const add = (collection) => {
  target.value = collection
  editing.value = null
  modal.value = true
}
const edit = (collection, row) => {
  target.value = collection
  openEdit(row)
}
</script>

<template>
  <div class="v-page">
    <PanelCard
      eyebrow="GIS" title="Mamlakatlar xaritasi"
      hint="Yo‘nalishni bosing — xarita shu oqimga yaqinlashadi va quyidagi panellar filtrlanadi"
      glow="lapis" :pad="false" class="enter"
    >
      <template #actions>
        <div class="seg">
          <button :class="{ on: mode === 'geo' }" @click="mode = 'geo'">
            <AppIcon name="globe" :size="13" /> Xarita
          </button>
          <button :class="{ on: mode === 'schema' }" @click="mode = 'schema'">
            <AppIcon name="spark" :size="13" /> Sxema
          </button>
        </div>
      </template>

      <div class="mapBox">
        <Transition name="swap" mode="out-in">
          <GeoMap
            v-if="mode === 'geo'" key="geo"
            :countries="countries" :regions="regions" :sos="sosEvents"
            :origin="origin" :selected="state.country"
            height="600px" @select="pick"
          />
          <FlowMap
            v-else key="schema"
            :countries="countries" :selected="state.country"
            @select="pick" @region="setRegion"
          />
        </Transition>
      </div>
    </PanelCard>

    <!-- Tanlangan davlat bo'yicha to'liq kesim -->
    <Transition name="det">
      <PanelCard
        v-if="picked" :key="picked.code"
        eyebrow="Tanlangan yo‘nalish" :title="`${picked.flag} ${picked.name}`"
        :hint="`${picked.hub} · jami ${fmt(picked.total)} migrant, xavf indeksi ${picked.risk}`"
        glow="turk" class="enter"
      >
        <template #actions>
          <button class="v-btn" @click="edit('countries', picked)">
            <AppIcon name="edit" :size="14" /> Ko‘rsatkichlarni tahrirlash
          </button>
          <button class="v-btn" @click="selectCountry(picked.code)">
            <AppIcon name="close" :size="14" /> Yopish
          </button>
        </template>

        <div class="det">
          <section>
            <p class="dh">Chiqish maqsadi bo‘yicha</p>
            <div v-for="(r, i) in purposeRows" :key="r.label" class="pr" :style="{ '--i': i }">
              <div class="prTop">
                <span class="prL">{{ r.label }}</span>
                <span class="prR">
                  <b class="num">{{ fmt(r.value) }}</b>
                  <span class="num sh">{{ r.share.toFixed(1) }}%</span>
                </span>
              </div>
              <div class="v-meter" :style="{ '--i': i }">
                <i :style="{ width: r.pct + '%', background: `var(--${r.tone})` }" />
              </div>
            </div>
          </section>

          <section>
            <p class="dh">Alohida nazorat va jo‘natmalar</p>
            <div class="cGrid">
              <div v-for="(r, i) in controlRows" :key="r.label" class="cc" :class="`c-${r.tone}`"
                   :style="{ '--i': i }">
                <span class="ci"><AppIcon :name="r.icon" :size="15" /></span>
                <b class="num cv">{{ fmt(r.value) }}<small v-if="r.unit"> {{ r.unit }}</small></b>
                <span class="cl">{{ r.label }}</span>
              </div>
            </div>
            <p class="v-note dNote">
              Pul jo‘natmalari summasi — <b class="num">{{ fmt(picked.remit) }} mln $</b> yiliga.
              Chiqqan <b class="num">{{ fmt(picked.out) }}</b>, qaytgan
              <b class="num">{{ fmt(picked.back) }}</b> nafar.
            </p>
          </section>
        </div>
      </PanelCard>
    </Transition>

    <div class="v-2-1">
      <PanelCard eyebrow="Reyting" title="Davlatlar kesimi" class="enter" :style="{ '--i': 1 }">
        <template #actions>
          <button class="v-btn" :class="{ on: sortKey === 'total' }" @click="sortKey = 'total'">Soni</button>
          <button class="v-btn" :class="{ on: sortKey === 'risk' }" @click="sortKey = 'risk'">Xavf</button>
          <button class="v-btn" :class="{ on: sortKey === 'remit' }" @click="sortKey = 'remit'">Jo‘natma</button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <div class="v-tblWrap">
          <table class="v-tbl">
            <thead>
              <tr>
                <th>Davlat</th><th>Markaz</th><th>Jami</th><th>Chiqqan</th><th>Qaytgan</th>
                <th>Qidiruvda</th><th>Jo‘natma</th><th>Xavf</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in sorted" :key="c._id" :style="{ '--i': i }"
                  class="rw" :class="{ on: state.country === c.code }" @click="pick(c.code)">
                <td class="nm">{{ c.flag }} {{ c.name }}</td>
                <td class="muted">{{ c.hub }}</td>
                <td class="num">{{ fmt(c.total) }}</td>
                <td class="num">{{ fmt(c.out) }}</td>
                <td class="num">{{ fmt(c.back) }}</td>
                <td class="num warn">{{ fmt(c.wanted) }}</td>
                <td class="num">{{ fmt(c.remit) }} mln $</td>
                <td><RiskBadge :score="c.risk" /></td>
                <td class="v-ta">
                  <button class="v-mini" aria-label="Tahrirlash" @click.stop="edit('countries', c)">
                    <AppIcon name="edit" :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PanelCard>

      <div class="side">
        <PanelCard eyebrow="Pul jo‘natmalari" title="Davlatlar bo‘yicha"
                   :hint="`Jami ${fmt(totalRemit)} mln $ / yil`" class="enter" :style="{ '--i': 2 }">
          <BarRank :items="remitItems" :dual="false" />
        </PanelCard>

        <PanelCard eyebrow="Maqsad" title="Chiqish sabablari" class="enter" :style="{ '--i': 3 }">
          <template #actions>
            <button class="v-btn add" @click="add('purposes')">
              <AppIcon name="plus" :size="14" /> Maqsad
            </button>
          </template>
          <DonutBreak :items="purposes" center-label="Chiqqanlar"
                      editable @pick="edit('purposes', $event)" />
        </PanelCard>

        <PanelCard eyebrow="Manba" title="Chiqish hududlari"
                   :hint="`${regions.length} ta hudud xaritada belgilangan`"
                   class="enter" :style="{ '--i': 4 }">
          <template #actions>
            <button class="v-btn add" @click="add('regions')">
              <AppIcon name="plus" :size="14" /> Hudud
            </button>
          </template>
          <ul class="rgs">
            <li v-for="(r, i) in regions" :key="r._id" :style="{ '--i': i }">
              <span class="rgN">{{ r.name }}</span>
              <span class="num rgV">{{ fmt(r.out) }}</span>
              <button class="v-mini" aria-label="Tahrirlash" @click="edit('regions', r)">
                <AppIcon name="edit" :size="13" />
              </button>
            </li>
          </ul>
        </PanelCard>
      </div>
    </div>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.mapBox { padding: 4px 18px 18px; }

/* tanlangan davlat kesimi */
.det { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; }
.dh {
  margin: 0 0 14px;
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--mist-dim);
}
.pr {
  margin-bottom: 13px;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 55ms);
}
.prTop { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 6px; }
.prL { font-size: 12.5px; }
.prR { display: inline-flex; align-items: baseline; gap: 8px; }
.prR b { font-size: 13px; }
.sh { font-size: 11px; color: var(--mist-dim); }

.cGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
.cc {
  display: grid;
  gap: 3px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--surface);
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 55ms);
  transition: border-color 0.3s ease;
}
.cc:hover { border-color: currentColor; }
.ci { color: currentColor; }
.cv { font-size: 19px; font-weight: 700; color: var(--snow); }
.cv small { font-size: 11px; font-weight: 400; color: var(--mist-dim); }
.cl { font-size: 11.5px; color: var(--mist-dim); }
.c-saffron { color: var(--saffron); }
.c-coral { color: var(--coral); }
.c-violet { color: var(--violet); }
.c-turk { color: var(--turk); }
.dNote { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line); }

.det-enter-active { transition: all 0.45s var(--ease-out); }
.det-leave-active { transition: all 0.25s ease; }
.det-enter-from, .det-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 880px) {
  .det { grid-template-columns: 1fr; }
}

.rgs { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; max-height: 320px; overflow-y: auto; }
.rgs li {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(var(--mist-rgb), 0.07);
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 30ms);
}
.rgN { font-size: 12.5px; }
.rgV { font-size: 12.5px; color: var(--mist); }
.side { display: grid; gap: 18px; align-content: start; }
.rw { cursor: pointer; }
.rw.on { background: rgba(var(--turk-rgb), 0.08); }
.nm { font-weight: 500; white-space: nowrap; }
.warn { color: var(--saffron); }

.seg {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.6);
}
.seg button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--mist-dim);
  transition: all 0.3s var(--ease-out);
}
.seg button:hover { color: var(--snow); }
.seg button.on { background: var(--turk-dim); color: var(--turk); }

.swap-enter-active { transition: opacity 0.4s var(--ease-out); }
.swap-leave-active { transition: opacity 0.2s ease; }
.swap-enter-from, .swap-leave-to { opacity: 0; }
</style>
