<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PanelCard from '@/components/ui/PanelCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RiskBadge from '@/components/ui/RiskBadge.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, exportCollection } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { usePagedList } from '@/composables/usePagedList'
import { useApp } from '@/stores/app'
import { fmt } from '@/composables/useCountUp'

/* Jadval serverda sahifalanadi — `db.migrants` da faqat joriy sahifa turadi */
const paged = db.migrants
const countries = db.countries

const router = useRouter()
const { selectCountry } = useApp()

const q = ref('')
const fCountry = ref('all')
const fGender = ref('all')
const fRisk = ref('all')
const selected = ref(null)

/** Serverga yuboriladigan filtrlar — o'zgarsa ro'yxat qayta so'raladi */
const filters = computed(() => ({
  search: q.value.trim() || undefined,
  country: fCountry.value === 'all' ? undefined : fCountry.value,
  gender: fGender.value === 'all' ? undefined : fGender.value,
  risky: fRisk.value === 'all' ? undefined : String(fRisk.value === 'risky'),
}))

const { page, pages, count, loading, error, next, prev, go, reload } =
  usePagedList('migrants', filters, { size: 10 })

const reset = () => {
  q.value = ''
  fCountry.value = 'all'
  fGender.value = 'all'
  fRisk.value = 'all'
}

/* -------------------------------------------------- qo'shish / tahrirlash */
const { modal, editing, flash, openAdd, openEdit, close, onSaved, onRemoved, run } =
  useRecordModal({
    added: 'Yangi migrant reyestrga qo‘shildi',
    updated: 'Ma’lumot yangilandi',
    removed: 'Yozuv reyestrdan o‘chirildi',
  })

/** Joriy filtrlar bo'yicha CSV eksport */
const exportList = () =>
  run(
    () => exportCollection('migrants', filters.value),
    'Reyestr CSV ko‘rinishida yuklab olindi',
  )

/* Yozuv qo'shilsa boshiga qaytamiz, tahrirlansa — shu sahifa qayta o'qiladi */
const saved = (e) => {
  onSaved(e)
  if (e.mode === 'add' && page.value !== 1) go(1)
  else reload()
}
const removed = (e) => {
  selected.value = null
  onRemoved(e)
  reload()
}

/** Xaritada ko'rsatish — davlatni tanlab GIS sahifasiga o'tadi */
const showOnMap = (migrant) => {
  selectCountry(migrant.countryCode)
  router.push('/countries')
}
</script>

<template>
  <div class="page">
    <PanelCard eyebrow="Yagona reyestr" title="Migrantlar bazasi"
               :hint="`${fmt(count)} ta yozuv topildi`" class="enter">
      <template #actions>
        <button class="btn" @click="exportList">
          <AppIcon name="export" :size="14" /> Eksport
        </button>
        <button class="btn primary" @click="openAdd">
          <AppIcon name="plus" :size="14" /> Migrant qo‘shish
        </button>
      </template>

      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>

      <div class="filters">
        <label class="search">
          <AppIcon name="search" :size="16" />
          <input v-model="q" placeholder="F.I.Sh yoki PINFL bo‘yicha qidirish" />
          <button v-if="q" class="clr" @click="q = ''" aria-label="Tozalash">
            <AppIcon name="close" :size="14" />
          </button>
        </label>

        <select v-model="fCountry">
          <option value="all">Barcha davlatlar</option>
          <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
        </select>

        <select v-model="fGender">
          <option value="all">Jinsi: barchasi</option>
          <option value="Erkak">Erkaklar</option>
          <option value="Ayol">Ayollar</option>
          <option value="Voyaga yetmagan">Voyaga yetmaganlar</option>
        </select>

        <select v-model="fRisk">
          <option value="all">Xavf: barchasi</option>
          <option value="risky">Faqat xavfli</option>
          <option value="safe">Xavf yo‘q</option>
        </select>

        <button class="btn ghost" @click="reset">Tozalash</button>
      </div>

      <div class="tableWrap" :class="{ busy: loading }">
        <table>
          <thead>
            <tr>
              <th>F.I.Sh</th>
              <th>PINFL</th>
              <th>Jinsi</th>
              <th>Mutaxassislik</th>
              <th>Davlat</th>
              <th>Maqsad</th>
              <th>Jo‘natma</th>
              <th>Xavf</th>
              <th></th>
            </tr>
          </thead>
          <TransitionGroup tag="tbody" name="list">
            <tr v-for="(m, i) in paged" :key="m._id" :style="{ '--i': i }"
                class="tr" :class="{ on: selected?._id === m._id }" @click="selected = m">
              <td class="strong">{{ m.name }}</td>
              <td class="num dim">{{ m.pinfl }}</td>
              <td>{{ m.gender }}</td>
              <td class="dim">{{ m.speciality }}</td>
              <td>{{ m.flag }} {{ m.country }}</td>
              <td class="dim">{{ m.purpose }}</td>
              <td class="num dim">{{ m.remit }}</td>
              <td><RiskBadge :score="m.score" /></td>
              <td class="v-ta">
                <button class="v-mini" aria-label="Tahrirlash" @click.stop="openEdit(m)">
                  <AppIcon name="edit" :size="14" />
                </button>
              </td>
            </tr>
          </TransitionGroup>
        </table>

        <p v-if="error" class="empty bad">{{ error }}</p>
        <p v-else-if="loading && !paged.length" class="empty">Serverdan olinmoqda…</p>
        <p v-else-if="!paged.length" class="empty">
          Bu filtrlar bo‘yicha yozuv yo‘q. Qidiruvni kengaytiring yoki filtrlarni tozalang.
        </p>
      </div>

      <div class="pager">
        <button :disabled="page === 1 || loading" @click="prev">
          <AppIcon name="chevron" :size="14" class="flip" />
        </button>
        <span class="num">{{ page }} / {{ pages }}</span>
        <button :disabled="page === pages || loading" @click="next">
          <AppIcon name="chevron" :size="14" />
        </button>
      </div>
    </PanelCard>

    <!-- Detal paneli -->
    <Transition name="drawer">
      <aside v-if="selected" class="drawer">
        <button class="x" @click="selected = null" aria-label="Yopish">
          <AppIcon name="close" :size="18" />
        </button>

        <p class="eyebrow">Shaxsiy varaqa</p>
        <h2>{{ selected.name }}</h2>
        <div class="badges">
          <RiskBadge :score="selected.score" :label="selected.risk" />
          <span class="tag">{{ selected.flag }} {{ selected.country }}</span>
        </div>

        <dl>
          <div><dt>PINFL</dt><dd class="num">{{ selected.pinfl }}</dd></div>
          <div><dt>Millati</dt><dd>{{ selected.nationality }}</dd></div>
          <div><dt>Jinsi</dt><dd>{{ selected.gender }}</dd></div>
          <div><dt>Mutaxassisligi</dt><dd>{{ selected.speciality }}</dd></div>
          <div><dt>Oilaviy ahvoli</dt><dd>{{ selected.marital }}</dd></div>
          <div><dt>Sog‘lig‘i</dt><dd>{{ selected.health }}</dd></div>
          <div><dt>Sudlanganligi</dt><dd>{{ selected.convicted ? 'Bor' : 'Yo‘q' }}</dd></div>
          <div><dt>Chiqqan hududi</dt><dd>{{ selected.region }}</dd></div>
          <div><dt>Chiqish sanasi</dt><dd class="num">{{ selected.exitDate }}</dd></div>
          <div><dt>Chiqish maqsadi</dt><dd>{{ selected.purpose }}</dd></div>
          <div><dt>Ish joyi</dt><dd>{{ selected.employer }}</dd></div>
          <div><dt>Xorijdagi manzil</dt><dd>{{ selected.address }}</dd></div>
          <div><dt>Telefon</dt><dd class="num">{{ selected.phone }}</dd></div>
          <div><dt>Pul jo‘natmalari</dt><dd class="num">{{ selected.remit }}</dd></div>
        </dl>

        <div class="riskBox">
          <p class="eyebrow">AI Risk Score</p>
          <div class="rbBar"><i :style="{ width: selected.score + '%' }" /></div>
          <p class="rbTxt">
            Model {{ selected.score }} ball berdi. Asosiy omillar: bandlik turi,
            yo‘nalish xavfi va jo‘natma dinamikasi.
          </p>
        </div>

        <div class="acts">
          <button class="btn primary" @click="openEdit(selected)">
            <AppIcon name="edit" :size="14" /> Tahrirlash
          </button>
          <a v-if="selected.phone" class="btn" :href="`tel:${selected.phone.replace(/[^+\d]/g, '')}`">
            <AppIcon name="phone" :size="14" /> Bog‘lanish
          </a>
          <button class="btn" @click="showOnMap(selected)">
            <AppIcon name="pin" :size="14" /> Xaritada
          </button>
        </div>
      </aside>
    </Transition>

    <div v-if="selected" class="scrim" @click="selected = null" />

    <RecordModal
      collection="migrants" :open="modal" :record="editing"
      @close="close" @saved="saved" @removed="removed"
    />
  </div>
</template>

<style scoped>
.page { position: relative; }

/* filtrlar */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}

.search {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.6);
  color: var(--mist-dim);
  transition: border-color 0.3s ease;
}
.search:focus-within { border-color: var(--turk); color: var(--turk); }
.search input {
  flex: 1;
  padding: 10px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 13px;
  color: var(--snow);
}
.search input::placeholder { color: var(--mist-dim); }
.clr { color: var(--mist-dim); display: grid; place-items: center; }

select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.6);
  font-size: 12.5px;
  color: var(--mist);
  cursor: pointer;
  transition: border-color 0.3s ease;
}
select:hover { border-color: var(--line-strong); }
select option { background: var(--ink-800); }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 9px;
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.btn:hover { color: var(--turk); border-color: var(--turk); }
.btn.ghost { color: var(--mist-dim); }
.btn.primary { background: var(--turk-dim); color: var(--turk); border-color: var(--turk); }

/* jadval */
.tableWrap { overflow-x: auto; margin: 0 -4px; transition: opacity 0.2s ease; }
/* Yangi sahifa kelguncha eskisi biroz so'niydi */
.tableWrap.busy { opacity: 0.45; pointer-events: none; }
table { width: 100%; border-collapse: collapse; min-width: 880px; }

th {
  text-align: left;
  padding: 9px 12px;
  font-family: var(--font-data);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--mist-dim);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.tr {
  cursor: pointer;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 30ms);
  transition: background 0.25s ease;
}
.tr:hover { background: rgba(var(--mist-rgb), 0.05); }
.tr.on { background: rgba(var(--turk-rgb), 0.07); }

td {
  padding: 11px 12px;
  font-size: 12.5px;
  border-bottom: 1px solid rgba(var(--mist-rgb), 0.07);
  white-space: nowrap;
}
.strong { font-weight: 500; }
.dim { color: var(--mist); }

.empty {
  padding: 40px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--mist-dim);
}
.empty.bad { color: var(--coral); }

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 16px;
  font-size: 12px;
  color: var(--mist);
}
.pager button {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.pager button:hover:not(:disabled) { color: var(--turk); border-color: var(--turk); }
.pager button:disabled { opacity: 0.3; cursor: default; }
.flip { transform: rotate(180deg); }

/* drawer */
.drawer {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 40;
  width: min(430px, 94vw);
  height: 100vh;
  overflow-y: auto;
  padding: 26px 26px 40px;
  border-left: 1px solid var(--line-strong);
  background: rgba(var(--deep-rgb), 0.97);
  backdrop-filter: blur(22px);
  box-shadow: var(--shadow-lift);
}
.drawer h2 { font-size: 22px; margin: 5px 0 12px; }

.x {
  position: absolute;
  right: 20px;
  top: 20px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--line);
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.x:hover { color: var(--coral); border-color: var(--coral); transform: rotate(90deg); }

.badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
.tag {
  padding: 3px 10px;
  border-radius: 99px;
  border: 1px solid var(--line);
  font-size: 11.5px;
  color: var(--mist);
}

dl { display: grid; gap: 0; margin: 0; }
dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid rgba(var(--mist-rgb), 0.07);
  animation: rise 0.5s var(--ease-out) backwards;
}
dl > div:nth-child(n) { animation-delay: 60ms; }
dt { font-size: 12px; color: var(--mist-dim); }
dd { margin: 0; font-size: 12.5px; text-align: right; }

.riskBox {
  margin-top: 22px;
  padding: 16px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: rgba(var(--saffron-rgb), 0.05);
}
.rbBar {
  height: 6px;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.14);
  margin: 10px 0;
  overflow: hidden;
}
.rbBar i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--turk), var(--saffron), var(--coral));
  animation: growX 1s var(--ease-out);
  transform-origin: left;
}
@keyframes growX { from { transform: scaleX(0); } }
.rbTxt { margin: 0; font-size: 12px; line-height: 1.6; color: var(--mist); }

.acts { display: flex; gap: 10px; margin-top: 20px; }
.acts .btn { flex: 1; justify-content: center; text-decoration: none; }

.drawer-enter-active { transition: transform 0.45s var(--ease-out), opacity 0.45s ease; }
.drawer-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(40px); opacity: 0; }

.scrim {
  position: fixed;
  inset: 0;
  z-index: 39;
  background: rgba(var(--scrim-rgb), 0.6);
  animation: fade 0.3s ease;
}
</style>
