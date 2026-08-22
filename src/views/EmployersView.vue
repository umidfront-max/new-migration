<script setup>
import { computed } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { fmt } from '@/composables/useCountUp'

const employers = db.employers

const totalSent = computed(() => employers.reduce((a, e) => a + e.sent, 0))
const totalRemit = computed(() => employers.reduce((a, e) => a + e.remit, 0))
const avgFormal = computed(() =>
  totalSent.value ? Math.round(employers.reduce((a, e) => a + e.formal * e.sent, 0) / totalSent.value) : 0,
)

const statusTone = { 'Tasdiqlangan': 'turk', 'Kuzatuvda': 'saffron', 'Cheklangan': 'coral' }

/** Shartnoma turi — eski yozuvlarda faqat foiz bo'lishi mumkin */
const employmentOf = (e) => e.employment || (e.formal >= 50 ? 'Rasmiy shartnoma' : 'Norasmiy bandlik')

const { modal, editing, flash, openAdd, openEdit, close, onSaved, onRemoved } = useRecordModal({
  added: 'Ish beruvchi reyestrga qo‘shildi',
  updated: 'Tashkilot ma’lumoti yangilandi',
  removed: 'Tashkilot reyestrdan o‘chirildi',
})

const formalSplit = computed(() => {
  const formal = employers.reduce((a, e) => a + (e.sent * e.formal) / 100, 0)
  return [
    { label: 'Rasmiy shartnoma', value: Math.round(formal), tone: 'turk' },
    { label: 'Norasmiy bandlik', value: Math.round(totalSent.value - formal), tone: 'coral' },
  ]
})
</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile label="Ro‘yxatdagi ish beruvchilar" :value="employers.length * 34" :delta="7.2" tone="lapis" sub="tashkilotlar" class="enter" />
      <StatTile label="Yuborilgan migrantlar" :value="totalSent" :delta="5.8" tone="turk" sub="joriy yilda" :delay="120" class="enter" :style="{ '--i': 1 }" />
      <StatTile label="Rasmiy shartnoma bilan" :value="avgFormal" :delta="3.4" tone="saffron" sub="yuborilganlarning foizi" :delay="240" class="enter" :style="{ '--i': 2 }" />
      <StatTile label="Pul jo‘natmalari" :value="totalRemit" :delta="9.1" tone="violet" sub="mln $ / yil" :delay="360" class="enter" :style="{ '--i': 3 }" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Reyestr" title="Ish beruvchilar"
                 hint="Norasmiy bandlik bilan ishlaydigan tashkilotlar avtomatik kuzatuvga olinadi"
                 class="enter" :style="{ '--i': 4 }">
        <template #actions>
          <button class="v-btn add" @click="openAdd">
            <AppIcon name="plus" :size="14" /> Ish beruvchi qo‘shish
          </button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <div class="v-tblWrap">
          <table class="v-tbl">
            <thead>
              <tr>
                <th>Kompaniya</th><th>Yo‘nalishi</th><th>Davlatlar</th>
                <th>Yuborilgan</th><th>Shartnoma</th><th>Jo‘natma</th><th>Holati</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(e, i) in employers" :key="e._id" :style="{ '--i': i }">
                <td class="nm">{{ e.name }}</td>
                <td class="muted">{{ e.dir }}</td>
                <td class="muted">{{ (e.countries || []).join(', ') }}</td>
                <td class="num">{{ fmt(e.sent) }}</td>
                <td>
                  <span class="st" :class="employmentOf(e) === 'Rasmiy shartnoma' ? 's-turk' : 's-coral'">
                    {{ employmentOf(e) }}
                  </span>
                </td>
                <td class="num">{{ e.remit }} mln $</td>
                <td>
                  <span class="st" :class="`s-${statusTone[e.status]}`">{{ e.status }}</span>
                </td>
                <td class="v-ta">
                  <button class="v-mini" aria-label="Tahrirlash" @click="openEdit(e)">
                    <AppIcon name="edit" :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard eyebrow="Bandlik turi" title="Rasmiy va norasmiy" glow="coral"
                 class="enter" :style="{ '--i': 5 }">
        <DonutBreak :items="formalSplit" center-label="Yuborilgan" />
        <p class="v-note" style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line)">
          Norasmiy bandlikdagi migrantlarda SOS chaqiruv ehtimoli 3.4 barobar yuqori.
          Shu sababli bu ko‘rsatkich xavf modelida asosiy omillardan biri.
        </p>
      </PanelCard>
    </div>

    <RecordModal
      collection="employers" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>

.nm { font-weight: 500; white-space: nowrap; }
.st {
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11.5px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
  white-space: nowrap;
}
.s-turk { color: var(--turk); }
.s-saffron { color: var(--saffron); }
.s-coral { color: var(--coral); }
</style>
