<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RegionMap from '@/components/charts/RegionMap.vue'
import AreaTrend from '@/components/charts/AreaTrend.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import BarRank from '@/components/charts/BarRank.vue'
import RiskGauge from '@/components/charts/RiskGauge.vue'
import SosFeed from '@/components/panels/SosFeed.vue'
import { useApp } from '@/stores/app'
import { fmt } from '@/composables/useCountUp'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, serie, setting, summary } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/labels'

const regions = db.regions
const violations = db.violations
const kpis = db.kpis
const composition = db.composition
const purposes = db.purposes

const flowSeries = computed(() => db.series.filter((s) => s.key === 'out' || s.key === 'back'))
const sparks = computed(() => [serie('out'), serie('out'), serie('back'), serie('remit')])
const overallRisk = computed(() => setting('overallRisk')?.value ?? 38)

/* Qo'shish / tahrirlash — to'plam tanlanadi */
const target = ref('kpis')
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

const router = useRouter()
const { state } = useApp()

const topRegions = computed(() =>
  regions.slice(0, 8).map((r) => ({ name: r.name, value: r.out, value2: r.back, risk: r.risk })),
)

const violationTotal = computed(() => summary.violations.total ?? 0)

/** Ayollar ulushi — tarkib ko'rsatkichlaridan hisoblanadi */
const womenShare = computed(() => {
  const total = composition.reduce((sum, item) => sum + (item.value || 0), 0)
  const women = composition.find((item) => item.label === 'Ayollar')?.value || 0
  return total ? ((women / total) * 100).toFixed(1) : '0.0'
})
</script>

<template>
  <div class="page">
    <!-- KPI qatori -->
    <div class="kpiHead">
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>
      <button class="btn add" @click="add('kpis')">
        <AppIcon name="plus" :size="14" /> KPI qo‘shish
      </button>
    </div>

    <div class="kpis">
      <StatTile
        v-for="(k, i) in kpis" :key="k._id"
        v-bind="k" :delay="i * 120"
        :spark="sparks[i]?.values"
        class="enter" :style="{ '--i': i }"
        editable @edit="edit('kpis', k)"
      />
    </div>

    <!-- Signature: Toshkent viloyati tuman kesimida -->
    <PanelCard
      eyebrow="Hudud kesimi" title="Toshkent viloyati"
      hint="Tumanni bosing — ko‘rsatkichlarini shu yerda tahrirlash mumkin"
      glow="turk" class="enter" :style="{ '--i': 4 }" :pad="false"
    >
      <template #actions>
        <button class="btn add" @click="add('districts')">
          <AppIcon name="plus" :size="14" /> Tuman qo‘shish
        </button>
        <button class="btn" @click="router.push('/countries')">
          Davlatlar xaritasi <AppIcon name="chevron" :size="14" />
        </button>
      </template>
      <RegionMap @pick="edit('districts', $event)" />
    </PanelCard>

    <!-- Dinamika + tarkib -->
    <div class="row r-2-1">
      <PanelCard eyebrow="12 oylik dinamika" title="Chiqish va qaytish"
                 class="enter" :style="{ '--i': 5 }">
        <template #actions>
          <span class="pill">{{ state.period === '12m' ? '12 oy' : 'Tanlangan davr' }}</span>
          <button v-for="s in flowSeries" :key="s._id" class="btn"
                  @click="edit('series', s)">
            <AppIcon name="edit" :size="13" /> {{ s.name }}
          </button>
        </template>
        <AreaTrend :series="flowSeries" :labels="months" :height="270" />
      </PanelCard>

      <PanelCard eyebrow="Tarkib" title="Migrantlar kesimi" class="enter" :style="{ '--i': 6 }">
        <template #actions>
          <button class="btn add" @click="add('composition')">
            <AppIcon name="plus" :size="14" /> Bo‘lim
          </button>
        </template>
        <div class="comp">
          <div v-for="(c, i) in composition" :key="c._id" class="cRow" :style="{ '--i': i }">
            <span class="cDot" :style="{ background: `var(--${c.tone})` }" />
            <span class="cLb">{{ c.label }}</span>
            <b class="num">{{ fmt(c.value) }}</b>
            <button class="v-mini" aria-label="Tahrirlash" @click="edit('composition', c)">
              <AppIcon name="edit" :size="13" />
            </button>
          </div>
        </div>
        <div class="split">
          <div v-for="c in composition.slice(0, 3)" :key="'s' + c._id"
               class="sBar" :style="{ flex: c.value, background: `var(--${c.tone})` }"
               :title="c.label" />
        </div>
        <p class="note">
          Ayollar ulushi <b class="num">{{ womenShare }}%</b> — tarkib ko‘rsatkichlari
          bo‘yicha hisoblangan. Voyaga yetmaganlar alohida nazoratda.
        </p>
      </PanelCard>
    </div>

    <!-- Hududlar + maqsad + SOS -->
    <div class="row r-3">
      <PanelCard eyebrow="Hududlar kesimi" title="Eng faol 8 hudud"
                 class="enter" :style="{ '--i': 7 }">
        <BarRank :items="topRegions" />
      </PanelCard>

      <PanelCard eyebrow="Chiqish maqsadi" title="Nima uchun chiqishmoqda"
                 class="enter" :style="{ '--i': 8 }">
        <template #actions>
          <button class="btn add" @click="add('purposes')">
            <AppIcon name="plus" :size="14" /> Maqsad
          </button>
        </template>
        <DonutBreak :items="purposes" center-label="Chiqqanlar" editable @pick="edit('purposes', $event)" />
      </PanelCard>

      <PanelCard eyebrow="SOS xizmati" title="Jonli murojaatlar" glow="coral"
                 class="enter" :style="{ '--i': 9 }">
        <template #actions>
          <button class="btn" @click="router.push('/sos')">
            Modul <AppIcon name="chevron" :size="14" />
          </button>
        </template>
        <SosFeed :limit="6" />
      </PanelCard>
    </div>

    <!-- Xavf + qonunbuzilish -->
    <div class="row r-1-2">
      <PanelCard eyebrow="AI Risk Score" title="Umumiy xavf holati" glow="saffron"
                 class="enter" :style="{ '--i': 10 }">
        <RiskGauge :score="overallRisk" />
      </PanelCard>

      <PanelCard eyebrow="Qonunbuzilishlar" title="Turlar bo‘yicha"
                 :hint="`Jami ${fmt(violationTotal)} holat, joriy yil boshidan`"
                 class="enter" :style="{ '--i': 11 }">
        <div class="vGrid">
          <button v-for="(v, i) in violations" :key="v._id" class="vCell"
                  :class="`vc-${v.tone}`" :style="{ '--i': i }"
                  @click="router.push('/violations')">
            <span class="vLb">{{ v.label }}</span>
            <b class="num vVal">{{ fmt(v.value) }}</b>
            <span class="vDelta" :class="{ up: v.delta > 0 }">
              {{ v.delta > 0 ? '+' : '' }}{{ v.delta }}%
            </span>
          </button>
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
.page { display: grid; gap: 18px; }

.kpiHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: -4px;
}
.kpiHead .v-flash { margin: 0; }
.kpiHead .btn.add { margin-left: auto; }

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(228px, 1fr));
  gap: 16px;
}

.row { display: grid; gap: 18px; }
.r-2-1 { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
.r-1-2 { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); }
.r-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }


.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.btn:hover { color: var(--turk); border-color: var(--turk); gap: 9px; }

.pill {
  padding: 4px 10px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.08);
  font-size: 11px;
  color: var(--mist-dim);
}

/* tarkib */
.comp { display: grid; gap: 2px; }
.cRow {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 8px;
  border-radius: var(--r-sm);
  font-size: 13px;
  animation: rise 0.6s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 80ms + 300ms);
  transition: background 0.25s ease;
}
.cRow:hover { background: rgba(var(--mist-rgb), 0.05); }
.cDot { width: 9px; height: 9px; border-radius: 3px; }
.cLb { flex: 1; color: var(--mist); }

.split { display: flex; gap: 3px; height: 7px; margin: 14px 0 12px; }
.sBar {
  border-radius: 99px;
  opacity: 0.85;
  transform-origin: left;
  animation: growX 1.1s var(--ease-out) 0.4s backwards;
}
@keyframes growX { from { transform: scaleX(0); } }

.note {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--mist-dim);
  padding-top: 12px;
  border-top: 1px solid var(--line);
}
.note b { color: var(--turk); }

/* qonunbuzilishlar */
.vGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.vCell {
  position: relative;
  text-align: left;
  padding: 13px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.5);
  overflow: hidden;
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 55ms + 200ms);
  transition: transform 0.35s var(--ease-out), border-color 0.35s ease;
}
.vCell:hover { transform: translateY(-3px); border-color: currentColor; }
.vCell::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: currentColor;
}
.vc-coral { color: var(--coral); }
.vc-saffron { color: var(--saffron); }
.vc-violet { color: var(--violet); }

.vLb { display: block; font-size: 11.5px; color: var(--mist); }
.vVal { display: block; font-size: 21px; font-weight: 700; margin-top: 5px; color: var(--snow); }
.vDelta {
  display: inline-block;
  margin-top: 5px;
  font-family: var(--font-data);
  font-size: 10.5px;
  color: var(--turk);
}
.vDelta.up { color: currentColor; }

@media (max-width: 1180px) {
  .r-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .r-3 > :last-child { grid-column: 1 / -1; }
}
@media (max-width: 900px) {
  .r-2-1, .r-1-2, .r-3 { grid-template-columns: 1fr; }
  .r-3 > :last-child { grid-column: auto; }
}
</style>
