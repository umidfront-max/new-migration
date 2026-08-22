<script setup>
import { ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, resetCollection } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { fmt } from '@/composables/useCountUp'

const roles = db.roles
const integrations = db.integrations
const toggles = db.settings

/* Qo'shish / tahrirlash — to'plam tanlanadi */
const target = ref('roles')
const { modal, editing, flash, openEdit, close, onSaved, onRemoved, say } = useRecordModal()
const add = (c) => {
  target.value = c
  editing.value = null
  modal.value = true
}
const edit = (c, row) => {
  target.value = c
  openEdit(row)
}
const openAdd = () => add('roles')

/* Demo ma'lumotlarni boshlang'ich holatga qaytarish */
const askReset = ref(false)
const doReset = () => {
  resetCollection()
  askReset.value = false
  say('Barcha to‘plamlar demo holatiga qaytarildi')
}

</script>

<template>
  <div class="v-page">
    <div class="v-2-1">
      <PanelCard eyebrow="Kirish huquqlari" title="Rollar va foydalanuvchilar"
                 hint="Har bir rol faqat o‘z ko‘lamidagi ma’lumotni ko‘radi"
                 class="enter">
        <template #actions>
          <button class="v-btn add" @click="openAdd">
            <AppIcon name="plus" :size="14" /> Yangi rol
          </button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>
        <div class="v-tblWrap">
          <table class="v-tbl">
            <thead><tr><th>Rol</th><th>Ko‘lami</th><th>Foydalanuvchilar</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in roles" :key="r._id" :style="{ '--i': i }">
                <td>
                  <span class="rl" :class="`r-${r.tone}`"><i />{{ r.name }}</span>
                </td>
                <td class="muted">{{ r.scope }}</td>
                <td class="num">{{ fmt(r.count) }}</td>
                <td class="ta">
                  <button class="mini" aria-label="Tahrirlash" @click="edit('roles', r)">
                    <AppIcon name="edit" :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard eyebrow="Sozlamalar" title="Tizim rejimi" class="enter" :style="{ '--i': 1 }">
        <template #actions>
          <button class="v-btn add" @click="add('settings')">
            <AppIcon name="plus" :size="14" /> Sozlama
          </button>
        </template>
        <div v-for="(t, i) in toggles" :key="t._id" class="tg" :style="{ '--i': i }">
          <div class="tgT">
            <p class="tgL">{{ t.label }}</p>
            <p class="tgH">{{ t.hint }}</p>
          </div>
          <span class="tgR">
            <b v-if="t.kind === 'number'" class="num tgV">{{ t.value }}</b>
            <button v-else class="sw" :class="{ on: t.on }" @click="t.on = !t.on"
                    :aria-pressed="t.on" :aria-label="t.label">
              <span />
            </button>
            <button class="v-mini" aria-label="Tahrirlash" @click="edit('settings', t)">
              <AppIcon name="edit" :size="13" />
            </button>
          </span>
        </div>
      </PanelCard>
    </div>

    <PanelCard eyebrow="Kelajakdagi integratsiyalar" title="Tashqi tizimlar"
               hint="Har bir ulanish alohida shartnoma va ma’lumot almashinuv reglamenti asosida yoqiladi"
               glow="lapis" class="enter" :style="{ '--i': 2 }">
      <template #actions>
        <button class="v-btn add" @click="add('integrations')">
          <AppIcon name="plus" :size="14" /> Tizim qo‘shish
        </button>
      </template>
      <div class="v-chips">
        <button v-for="(s, i) in integrations" :key="s._id" class="v-chip" :style="{ '--i': i }"
                :title="s.status" @click="edit('integrations', s)">
          <span class="pd" /> {{ s.name }}
        </button>
      </div>
    </PanelCard>

    <PanelCard eyebrow="Ma’lumotlar bazasi" title="Demo yozuvlarni tiklash"
               hint="Qo‘shilgan va tahrirlangan barcha yozuvlar brauzer xotirasida saqlanadi"
               class="enter" :style="{ '--i': 3 }">
      <div class="rst">
        <p class="v-note">
          Migrantlar, davlatlar, hududlar, ish beruvchilar, punktlar, rollar, qonunbuzilish
          turlari va SOS murojaatlari — hammasi shu yerdan boshlang‘ich demo holatiga qaytariladi.
        </p>
        <template v-if="!askReset">
          <button class="v-btn" @click="askReset = true">
            <AppIcon name="refresh" :size="14" /> Tiklash
          </button>
        </template>
        <template v-else>
          <span class="ask">Barcha o‘zgarishlar yo‘qoladi. Davom etamizmi?</span>
          <button class="v-btn dng" @click="doReset">Ha, tiklansin</button>
          <button class="v-btn" @click="askReset = false">Bekor</button>
        </template>
      </div>
    </PanelCard>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.tgR { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
.tgV { font-size: 15px; color: var(--saffron); }

.rst { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.rst .v-note { flex: 1; min-width: 260px; }
.ask { font-size: 12.5px; color: var(--saffron); }
.v-btn.dng { color: var(--coral); border-color: rgba(var(--coral-rgb), 0.4); }
.v-btn.dng:hover { color: var(--coral); border-color: var(--coral); background: var(--coral-dim); }

.rl { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; white-space: nowrap; }
.rl i { width: 7px; height: 7px; border-radius: 2px; background: currentColor; }
.r-coral { color: var(--coral); }
.r-saffron { color: var(--saffron); }
.r-lapis { color: var(--lapis); }
.r-turk { color: var(--turk); }
.r-violet { color: var(--violet); }
.r-mist { color: var(--mist); }

.ta { text-align: right; }
.mini {
  display: inline-grid;
  place-items: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--mist-dim);
  transition: all 0.3s var(--ease-out);
}
.mini:hover { color: var(--turk); border-color: var(--turk); }

.tg {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(var(--mist-rgb), 0.07);
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 70ms + 200ms);
}
.tg:last-child { border-bottom: none; }
.tgT { flex: 1; }
.tgL { margin: 0; font-size: 12.5px; }
.tgH { margin: 3px 0 0; font-size: 11px; color: var(--mist-dim); }

.sw {
  position: relative;
  width: 40px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 99px;
  background: rgba(var(--mist-rgb), 0.16);
  transition: background 0.35s var(--ease-out);
}
.sw span {
  position: absolute;
  top: 3px; left: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--mist);
  transition: transform 0.35s var(--ease-out), background 0.35s ease;
}
.sw.on { background: var(--turk-dim); }
.sw.on span { transform: translateX(18px); background: var(--turk); }

.pd {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--mist-dim);
  margin-right: 7px;
  vertical-align: middle;
}
.v-chip:hover .pd { background: var(--turk); }
</style>
