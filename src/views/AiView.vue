<script setup>
import { ref, computed } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AreaTrend from '@/components/charts/AreaTrend.vue'
import DonutBreak from '@/components/charts/DonutBreak.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, serie } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { months } from '@/data/mock'

const aiInsights = db.aiInsights
const composition = db.composition
const suggestions = db.aiSuggestions

const thinking = ref(false)
const question = ref('')

const forecast = computed(() => [serie('out'), serie('remit')].filter(Boolean))
/* Qo'shish / tahrirlash */
const target = ref('aiInsights')
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


const ask = () => {
  if (!question.value.trim()) return
  thinking.value = true
  setTimeout(() => (thinking.value = false), 2200)
}

</script>

<template>
  <div class="v-page">
    <!-- So'rov paneli -->
    <PanelCard eyebrow="Tabiiy tilda so‘rov" title="Ma’lumotlardan so‘rang"
               hint="Model reyestr, chegara, jo‘natma va SOS ma’lumotlarini birga tahlil qiladi"
               glow="lapis" class="enter">
      <div class="ask">
        <AppIcon name="spark" :size="18" class="sp" />
        <input v-model="question" placeholder="Masalan: Farg‘ona vodiysida xavf indeksi nega oshdi?"
               @keydown.enter="ask" />
        <button class="go" :disabled="thinking" @click="ask">
          <span v-if="!thinking">So‘rash</span>
          <span v-else class="dots"><i /><i /><i /></span>
        </button>
      </div>

      <div class="v-chips" style="margin-top: 12px">
        <button v-for="(s, i) in suggestions" :key="s._id" class="v-chip" :style="{ '--i': i }"
                @click="question = s.text; ask()">{{ s.text }}</button>
        <button class="v-chip addChip" @click="add('aiSuggestions')">
          <AppIcon name="plus" :size="13" /> Savol qo‘shish
        </button>
      </div>

      <Transition name="fadein">
        <div v-if="thinking" class="thinking">
          <span class="bar" />
          <p class="v-note">Model 2.1 mln yozuv, 12 oylik dinamika va 17 ta tashqi manbani solishtirmoqda…</p>
        </div>
      </Transition>
    </PanelCard>

    <!-- Insaytlar -->
    <div class="insHead">
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>
      <button class="v-btn add" @click="add('aiInsights')">
        <AppIcon name="plus" :size="14" /> Insayt qo‘shish
      </button>
    </div>

    <div class="ins">
      <article v-for="(a, i) in aiInsights" :key="a._id" class="card" :class="`k-${a.tone}`"
               :style="{ '--i': i }">
        <div class="cTop">
          <span class="tg">{{ a.tag }}</span>
          <span class="cRight">
            <span class="cf num">{{ a.confidence }}% ishonch</span>
            <button class="v-mini" aria-label="Tahrirlash" @click="edit('aiInsights', a)">
              <AppIcon name="edit" :size="13" />
            </button>
          </span>
        </div>
        <h3>{{ a.title }}</h3>
        <p class="bd">{{ a.body }}</p>
        <div class="cfBar"><i :style="{ width: a.confidence + '%' }" /></div>
        <p class="act"><AppIcon name="chevron" :size="13" /> {{ a.action }}</p>
      </article>
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Korrelyatsiya" title="Chiqish oqimi va pul jo‘natmalari"
                 hint="Model bu ikki qatorning bog‘liqligini 0.83 koeffitsient bilan baholadi"
                 class="enter" :style="{ '--i': 6 }">
        <AreaTrend :series="forecast" :labels="months" :height="270" />
      </PanelCard>

      <PanelCard eyebrow="Segmentatsiya" title="Tarkib tahlili" class="enter" :style="{ '--i': 7 }">
        <DonutBreak :items="composition" center-label="Migrant"
                    editable @pick="edit('composition', $event)" />
      </PanelCard>
    </div>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.insHead {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.insHead .v-flash { margin: 0; margin-right: auto; }
.cRight { display: inline-flex; align-items: center; gap: 8px; }
.addChip { color: var(--turk); border-color: var(--turk); display: inline-flex; align-items: center; gap: 6px; }

/* so'rov */
.ask {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 6px 4px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.65);
  transition: border-color 0.3s ease, box-shadow 0.4s ease;
}
.ask:focus-within {
  border-color: var(--lapis);
  box-shadow: 0 0 0 4px rgba(var(--lapis-rgb), 0.1);
}
.sp { color: var(--lapis); flex-shrink: 0; animation: twinkle 3s var(--ease-in-out) infinite; }
@keyframes twinkle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}
.ask input {
  flex: 1;
  padding: 12px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 13.5px;
  color: var(--snow);
  min-width: 0;
}
.ask input::placeholder { color: var(--mist-dim); }

.go {
  padding: 9px 18px;
  border-radius: 9px;
  background: var(--lapis-dim);
  color: var(--lapis);
  border: 1px solid var(--lapis);
  font-size: 12.5px;
  transition: all 0.3s var(--ease-out);
  min-width: 86px;
}
.go:hover:not(:disabled) { background: var(--lapis); color: var(--ink-900); }
.go:disabled { opacity: 0.7; cursor: default; }

.dots { display: inline-flex; gap: 4px; }
.dots i {
  width: 5px; height: 5px; border-radius: 50%; background: currentColor;
  animation: bounce 1s var(--ease-in-out) infinite;
}
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes bounce { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; transform: translateY(-3px); } }

.thinking { margin-top: 16px; }
.bar {
  display: block;
  height: 2px;
  border-radius: 99px;
  background: linear-gradient(90deg, transparent, var(--lapis), transparent);
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: slide 1.3s var(--ease-in-out) infinite;
}
@keyframes slide {
  0% { background-position: -40% 0; }
  100% { background-position: 140% 0; }
}
.thinking .v-note { margin-top: 10px; }

.fadein-enter-active, .fadein-leave-active { transition: opacity 0.35s ease; }
.fadein-enter-from, .fadein-leave-to { opacity: 0; }

/* insaytlar */
.ins {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 16px;
}
.card {
  position: relative;
  padding: 20px 22px;
  border-radius: var(--r-lg);
  border: 1px solid var(--line);
  background: linear-gradient(168deg, rgba(var(--panel-hi-rgb), 0.6), rgba(var(--panel-rgb), 0.88));
  overflow: hidden;
  animation: rise 0.6s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 90ms + 200ms);
  transition: transform 0.4s var(--ease-out), border-color 0.4s ease;
}
.card:hover { transform: translateY(-4px); border-color: currentColor; }
.card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: currentColor;
}
.k-coral { color: var(--coral); }
.k-saffron { color: var(--saffron); }
.k-lapis { color: var(--lapis); }
.k-turk { color: var(--turk); }

.cTop { display: flex; justify-content: space-between; align-items: center; margin-bottom: 11px; }
.tg {
  font-family: var(--font-data);
  font-size: 9.5px;
  letter-spacing: 0.2em;
  padding: 3px 9px;
  border-radius: 99px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
}
.cf { font-size: 10.5px; color: var(--mist-dim); }

.card h3 { font-size: 15.5px; color: var(--snow); line-height: 1.35; }
.bd { margin: 9px 0 14px; font-size: 12.5px; line-height: 1.65; color: var(--mist); }

.cfBar {
  height: 3px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.12);
  overflow: hidden;
}
.cfBar i {
  display: block;
  height: 100%;
  background: currentColor;
  border-radius: 99px;
  transform-origin: left;
  animation: growX 1.1s var(--ease-out) 0.6s backwards;
}
@keyframes growX { from { transform: scaleX(0); } }

.act {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 13px 0 0;
  font-size: 12px;
  color: currentColor;
}
</style>
