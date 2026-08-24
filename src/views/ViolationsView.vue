<script setup>
import { computed, ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import BarRank from '@/components/charts/BarRank.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import AreaTrend from '@/components/charts/AreaTrend.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/labels'
import { fmt } from '@/composables/useCountUp'

const violations = db.violations
const countries = db.countries

const active = ref(violations[0]?.key)
/** Tanlangan tur o'chirilgan bo'lsa — birinchisiga qaytamiz */
const current = computed(() => violations.find((v) => v.key === active.value) || violations[0])
const total = computed(() => violations.reduce((a, v) => a + v.value, 0))

/* Qonunbuzilish holatlari bazadagi maydondan olinadi */
const byCountry = computed(() =>
  [...countries]
    .sort((a, b) => (b.violationCount || 0) - (a.violationCount || 0))
    .slice(0, 8)
    .map((c) => ({ name: c.name, value: c.violationCount || 0, risk: c.risk })),
)

const { modal, editing, flash, openAdd, openEdit, close, onSaved, onRemoved } = useRecordModal({
  added: 'Yangi qonunbuzilish turi qo‘shildi',
  updated: 'Tur ma’lumoti yangilandi',
  removed: 'Tur ro‘yxatdan o‘chirildi',
})

const donut = computed(() =>
  violations.slice(0, 5).map((v) => ({ label: v.label, value: v.value, tone: v.tone })),
)

const series = computed(() => {
  const v = current.value
  if (!v) return []
  const base = v.value / 12
  return [{
    name: v.label,
    color: `var(--${v.tone})`,
    values: months.map((_, i) => Math.round(base * (0.72 + Math.sin(i / 1.9) * 0.28 + i * 0.035))),
  }]
})
</script>

<template>
  <div class="v-page">
    <PanelCard eyebrow="Xavfsizlik" title="Qonunbuzilishlar monitoringi"
               :hint="`Joriy yil boshidan jami ${fmt(total)} holat qayd etilgan`"
               glow="coral" class="enter">
      <template #actions>
        <button class="v-btn add" @click="openAdd">
          <AppIcon name="plus" :size="14" /> Tur qo‘shish
        </button>
      </template>

      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>

      <div class="cards">
        <div v-for="(v, i) in violations" :key="v._id" class="c" :class="[`c-${v.tone}`, { on: active === v.key }]"
             :style="{ '--i': i }" role="button" tabindex="0"
             @click="active = v.key" @keydown.enter="active = v.key">
          <span class="lb">{{ v.label }}</span>
          <b class="num val">{{ fmt(v.value) }}</b>
          <span class="dl" :class="{ bad: v.delta > 0 }">{{ v.delta > 0 ? '↑' : '↓' }} {{ Math.abs(v.delta) }}%</span>
          <button class="ed" aria-label="Tahrirlash" @click.stop="openEdit(v)">
            <AppIcon name="edit" :size="13" />
          </button>
        </div>
      </div>
    </PanelCard>

    <div class="v-2-1">
      <PanelCard eyebrow="Dinamika" :title="current?.label || '—'"
                 hint="Tanlangan tur bo‘yicha 12 oylik o‘zgarish" class="enter" :style="{ '--i': 1 }">
        <AreaTrend :key="active" :series="series" :labels="months" :height="250" />
      </PanelCard>

      <PanelCard eyebrow="Ulush" title="Turlar kesimi" class="enter" :style="{ '--i': 2 }">
        <DonutBreak :items="donut" center-label="Holatlar" />
      </PanelCard>
    </div>

    <PanelCard eyebrow="Geografiya" title="Davlatlar kesimida qonunbuzilishlar"
               hint="Ko‘rsatkich migrantlar soni va yo‘nalish xavfi asosida hisoblangan"
               class="enter" :style="{ '--i': 3 }">
      <BarRank :items="byCountry" :dual="false" />
    </PanelCard>

    <RecordModal
      collection="violations" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.ed {
  position: absolute;
  right: 8px;
  top: 8px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid transparent;
  color: var(--mist-dim);
  opacity: 0;
  transition: all 0.3s var(--ease-out);
}
.c:hover .ed, .c:focus-within .ed { opacity: 1; }
.ed:hover { color: var(--turk); border-color: var(--turk); }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(158px, 1fr));
  gap: 11px;
}
.c {
  position: relative;
  cursor: pointer;
  text-align: left;
  padding: 14px 15px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.5);
  overflow: hidden;
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 55ms + 150ms);
  transition: transform 0.35s var(--ease-out), border-color 0.3s ease, background 0.3s ease;
}
.c::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: currentColor;
  transform: scaleY(0.4);
  transition: transform 0.35s var(--ease-out);
}
.c:hover { transform: translateY(-3px); }
.c.on::before { transform: scaleY(1); }
.c.on {
  border-color: currentColor;
  background: color-mix(in srgb, currentColor 8%, rgba(var(--panel-rgb), 0.5));
}
.c-coral { color: var(--coral); }
.c-saffron { color: var(--saffron); }
.c-violet { color: var(--violet); }
.c-lapis { color: var(--lapis); }
.c-turk { color: var(--turk); }
.c-mist { color: var(--mist); }

.lb { display: block; font-size: 11.5px; color: var(--mist); }
.val { display: block; font-size: 22px; font-weight: 700; margin-top: 5px; color: var(--snow); }
.dl { display: inline-block; margin-top: 5px; font-family: var(--font-data); font-size: 10.5px; color: var(--turk); }
.dl.bad { color: currentColor; }
</style>
