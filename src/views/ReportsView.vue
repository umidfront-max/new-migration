<script setup>
import { ref } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, generateReport } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'

const templates = db.reportTemplates
const recent = db.reportArchive

const building = ref(null)
/* Qo'shish / tahrirlash */
const target = ref('reportTemplates')
const { modal, editing, flash, openEdit, close, onSaved, onRemoved, run } = useRecordModal()
const add = (c) => {
  target.value = c
  editing.value = null
  modal.value = true
}
const edit = (c, row) => {
  target.value = c
  openEdit(row)
}


/** Shablon bo'yicha hisobot shakllantiradi — arxivga yozuv qo'shiladi */
const build = async (template) => {
  building.value = template._id
  await run(() => generateReport(template), `${template.name} — arxivga qo‘shildi`)
  building.value = null
}

</script>

<template>
  <div class="v-page">
    <PanelCard eyebrow="Shablonlar" title="Hisobot yaratish"
               hint="Hisobot tanlangan davr va hudud filtrlari bo‘yicha shakllantiriladi"
               class="enter">
      <template #actions>
        <button class="v-btn add" @click="add('reportTemplates')">
          <AppIcon name="plus" :size="14" /> Shablon qo‘shish
        </button>
      </template>
      <Transition name="flash">
        <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
      </Transition>
      <div class="tpl">
        <article v-for="(t, i) in templates" :key="t._id" class="tp" :class="`t-${t.tone}`" :style="{ '--i': i }">
          <span class="ic"><AppIcon name="scroll" :size="17" /></span>
          <button class="pen" aria-label="Tahrirlash" @click="edit('reportTemplates', t)">
            <AppIcon name="edit" :size="13" />
          </button>
          <h3>{{ t.name }}</h3>
          <p class="ds">{{ t.desc }}</p>
          <div class="mt">
            <span class="pr">{{ t.period }}</span>
            <span v-for="f in String(t.fmt || '').split(',').filter(Boolean)" :key="f" class="fm num">{{ f.trim() }}</span>
          </div>
          <button class="mk" :disabled="building === t._id" @click="build(t)">
            <template v-if="building !== t._id">
              <AppIcon name="export" :size="14" /> Shakllantirish
            </template>
            <template v-else>
              <span class="ld" /> Tayyorlanmoqda…
            </template>
          </button>
        </article>
      </div>
    </PanelCard>

    <PanelCard eyebrow="Arxiv" title="So‘nggi hisobotlar" class="enter" :style="{ '--i': 1 }">
      <template #actions>
        <button class="v-btn add" @click="add('reportArchive')">
          <AppIcon name="plus" :size="14" /> Arxivga qo‘shish
        </button>
      </template>
      <div class="v-tblWrap">
        <table class="v-tbl">
          <thead><tr><th>Nomi</th><th>Hajmi</th><th>Sana</th><th>Kim</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(r, i) in recent" :key="r._id" :style="{ '--i': i }">
              <td class="nm">{{ r.name }}</td>
              <td class="num muted">{{ r.size }}</td>
              <td class="num muted">{{ r.at }}</td>
              <td class="num tk">{{ r.by }}</td>
              <td class="ta">
                <button class="dl" aria-label="Tahrirlash" @click="edit('reportArchive', r)">
                  <AppIcon name="edit" :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
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
.tp .pen {
  position: absolute;
  right: 12px;
  top: 12px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--mist-dim);
  opacity: 0;
  transition: all 0.3s var(--ease-out);
}
.tp:hover .pen { opacity: 1; }
.tp .pen:hover { color: var(--turk); border-color: var(--turk); }

.tpl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 14px;
}
.tp {
  position: relative;
  padding: 18px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: rgba(var(--panel-rgb), 0.5);
  animation: rise 0.55s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 65ms + 150ms);
  transition: transform 0.35s var(--ease-out), border-color 0.3s ease;
}
.tp:hover { transform: translateY(-4px); border-color: currentColor; }
.t-lapis { color: var(--lapis); }
.t-coral { color: var(--coral); }
.t-saffron { color: var(--saffron); }
.t-turk { color: var(--turk); }
.t-violet { color: var(--violet); }

.ic {
  display: grid;
  place-items: center;
  width: 34px; height: 34px;
  border-radius: 10px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 10%, transparent);
  margin-bottom: 12px;
}
.tp h3 { font-size: 14.5px; color: var(--snow); }
.ds { margin: 6px 0 12px; font-size: 12px; color: var(--mist); line-height: 1.55; }

.mt { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.pr, .fm {
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 10.5px;
  border: 1px solid var(--line);
  color: var(--mist-dim);
}
.fm { font-size: 10px; }

.mk {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px;
  border-radius: 9px;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 12.5px;
  transition: all 0.3s var(--ease-out);
}
.mk:hover:not(:disabled) { background: currentColor; color: var(--ink-900); }
.mk:disabled { opacity: 0.8; cursor: default; }

.ld {
  width: 13px; height: 13px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

.nm { font-weight: 500; }
.tk { color: var(--turk); }
.ta { text-align: right; }
.dl {
  display: inline-grid;
  place-items: center;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--mist-dim);
  transition: all 0.3s var(--ease-out);
}
.dl:hover { color: var(--turk); border-color: var(--turk); }
</style>
