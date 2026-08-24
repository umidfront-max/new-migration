<script setup>
import { ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, patchRecord, refreshLoaded, status } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { fmt } from '@/composables/useCountUp'

const roles = db.roles
const integrations = db.integrations
const toggles = db.settings

/* Qo'shish / tahrirlash — to'plam tanlanadi */
const target = ref('roles')
const { modal, editing, flash, openEdit, close, onSaved, onRemoved, say, run } = useRecordModal()
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

/* Serverdan qayta yuklash — keshda turgan to'plamlar qayta o'qiladi */
const doRefresh = async () => {
  await refreshLoaded().catch(() => {})
  say(status.error ? `Yangilab bo‘lmadi: ${status.error}` : 'Ma’lumot serverdan yangilandi')
}

/** Sozlama kalitchasi — o'zgarish serverga yoziladi */
const toggleSetting = (item) =>
  run(
    () => patchRecord('settings', item, { on: !item.on }),
    `${item.label} — ${item.on ? 'o‘chirildi' : 'yoqildi'}`,
  )

</script>

<template>
  <div class="v-page">
    <div class="v-2-1">
      <PanelCard eyebrow="Kirish huquqlari" title="Rollar va foydalanuvchilar"
                 hint="Har bir rol faqat o‘z ko‘lamidagi ma’lumotni ko‘radi"
                 class="enter">
        <template #actions>
          <RouterLink to="/users" class="v-btn">
            <AppIcon name="user" :size="14" /> Foydalanuvchilar
          </RouterLink>
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
            <button v-else class="sw" :class="{ on: t.on }" @click="toggleSetting(t)"
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

    <PanelCard eyebrow="Ma’lumotlar bazasi" title="Serverdan yangilash"
               hint="Barcha yozuvlar backend bazasida saqlanadi — brauzerda hech narsa turmaydi"
               class="enter" :style="{ '--i': 3 }">
      <div class="rst">
        <p class="v-note">
          Boshqa foydalanuvchi kiritgan o‘zgarishlarni ko‘rish uchun barcha
          to‘plamlarni serverdan qayta o‘qish mumkin.
          <span v-if="status.loadedAt" class="stamp num">
            Oxirgi yangilanish: {{ new Date(status.loadedAt).toLocaleTimeString('ru-RU') }}
          </span>
        </p>
        <button class="v-btn" :disabled="status.loading" @click="doRefresh">
          <AppIcon name="refresh" :size="14" />
          {{ status.loading ? 'Yuklanmoqda…' : 'Yangilash' }}
        </button>
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
.stamp { display: block; margin-top: 6px; font-size: 11px; color: var(--mist-dim); }

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
