<script setup>
import { ref, computed } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'

const auditLog = db.auditLog
const auditStats = db.auditStats

const only = ref('all')

/* Qo'shish / tahrirlash */
const target = ref('auditLog')
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
const rows = computed(() =>
  auditLog.filter((r) => (only.value === 'all' ? true : only.value === 'fail' ? !r.ok : r.ok)),
)
</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile v-for="(s, i) in auditStats" :key="s._id" v-bind="s"
                :delay="i * 120" class="enter" :style="{ '--i': i }"
                editable @edit="edit('auditStats', s)" />
    </div>

    <PanelCard eyebrow="Jurnal" title="Audit yozuvlari"
               hint="Har bir yozuv o‘zgartirilmaydigan jurnalga yoziladi va 7 yil saqlanadi"
               class="enter" :style="{ '--i': 4 }">
      <template #actions>
        <button class="v-btn" :class="{ on: only === 'all' }" @click="only = 'all'">Barchasi</button>
        <button class="v-btn" :class="{ on: only === 'ok' }" @click="only = 'ok'">Muvaffaqiyatli</button>
        <button class="v-btn" :class="{ on: only === 'fail' }" @click="only = 'fail'">Rad etilgan</button>
        <button class="v-btn add" @click="add('auditLog')">
          <AppIcon name="plus" :size="14" /> Yozuv qo‘shish
        </button>
      </template>
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>


      <div class="v-tblWrap">
        <table class="v-tbl">
          <thead>
            <tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Roli</th><th>Amal</th><th>IP</th><th>Natija</th></tr>
          </thead>
          <TransitionGroup tag="tbody" name="list">
            <tr v-for="(r, i) in rows" :key="r._id" :style="{ '--i': i }"
                class="rw" @click="edit('auditLog', r)">
              <td class="num muted">{{ r.at }}</td>
              <td class="num u">{{ r.user }}</td>
              <td class="muted">{{ r.role }}</td>
              <td>{{ r.action }}</td>
              <td class="num muted">{{ r.ip }}</td>
              <td>
                <span class="res" :class="{ bad: !r.ok }">
                  <AppIcon :name="r.ok ? 'shield' : 'close'" :size="12" />
                  {{ r.ok ? 'Bajarildi' : 'Rad etildi' }}
                </span>
              </td>
            </tr>
          </TransitionGroup>
        </table>
      </div>
    </PanelCard>

    <RecordModal
      :collection="target" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.rw { cursor: pointer; }

.u { color: var(--turk); }
.res {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 99px;
  font-size: 11.5px;
  color: var(--turk);
  background: var(--turk-dim);
  white-space: nowrap;
}
.res.bad { color: var(--coral); background: var(--coral-dim); }
</style>
