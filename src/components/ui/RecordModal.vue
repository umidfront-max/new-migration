<script setup>
/* Universal qo'shish/tahrirlash oynasi — sxema asosida forma quradi */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { schemas, blankModel, toFormModel } from '@/data/schemas'
import { months } from '@/data/mock'
import { saveRecord, removeRecord } from '@/stores/db'

const props = defineProps({
  /** db to'plami nomi: migrants | countries | employers | ... */
  collection: { type: String, required: true },
  /** tahrirlanayotgan yozuv; null bo'lsa — yangi qo'shish */
  record: { type: Object, default: null },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'saved', 'removed'])

const schema = computed(() => schemas[props.collection])
const isEdit = computed(() => !!props.record?._id)
const form = ref({})
const errors = ref({})
const askDelete = ref(false)
const formEl = ref(null)

const optionsOf = (f) => (typeof f.options === 'function' ? f.options() : f.options || [])

watch(
  () => [props.open, props.record],
  ([open]) => {
    if (!open) return
    form.value = props.record ? toFormModel(props.collection, props.record) : blankModel(props.collection)
    errors.value = {}
    askDelete.value = false
    nextTick(() => formEl.value?.querySelector('input, select')?.focus())
  },
  { immediate: true },
)

const validate = () => {
  const e = {}
  schema.value.fields.forEach((f) => {
    if (f.type === 'series') return
    const v = form.value[f.key]
    const empty = v === '' || v === null || v === undefined
    if (f.required && empty) e[f.key] = 'To‘ldirilishi shart'
    else if (!empty && f.pattern && !new RegExp(f.pattern).test(String(v))) e[f.key] = f.hint || 'Format noto‘g‘ri'
    else if (!empty && f.type === 'number') {
      const n = Number(v)
      if (Number.isNaN(n)) e[f.key] = 'Raqam kiriting'
      else if (f.min !== undefined && n < f.min) e[f.key] = `Eng kami ${f.min}`
      else if (f.max !== undefined && n > f.max) e[f.key] = `Eng ko‘pi ${f.max}`
    }
  })
  errors.value = e
  return !Object.keys(e).length
}

const submit = () => {
  if (!validate()) return
  const clean = { ...form.value }
  schema.value.fields.forEach((f) => {
    if (f.type === 'number') {
      const empty = clean[f.key] === '' || clean[f.key] === null || clean[f.key] === undefined
      /* Bo'sh raqam grafiklarni buzmasligi uchun 0 ga tushadi; nullable maydonlar bundan mustasno */
      clean[f.key] = empty ? (f.nullable ? null : 0) : Number(clean[f.key])
    }
    if (f.type === 'series') clean[f.key] = (clean[f.key] || []).map((n) => Number(n) || 0)
    if ((f.type === 'text' || f.type === 'textarea') && typeof clean[f.key] === 'string') {
      clean[f.key] = clean[f.key].trim()
    }
  })
  const data = schema.value.derive ? schema.value.derive(clean) : clean
  const row = saveRecord(props.collection, props.record?._id, data)
  emit('saved', { row, mode: isEdit.value ? 'edit' : 'add' })
  emit('close')
}

/* Esc — oynani yopadi */
const onKey = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const destroy = () => {
  removeRecord(props.collection, props.record._id)
  emit('removed', props.record)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="wrap">
        <div class="scrim" @click="emit('close')" />

        <div class="dlg" role="dialog" aria-modal="true">
          <header>
            <div>
              <p class="eyebrow">{{ schema.label }}</p>
              <h3>{{ isEdit ? schema.title.edit : schema.title.add }}</h3>
            </div>
            <button class="x" aria-label="Yopish" @click="emit('close')">
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <form ref="formEl" class="grid" @submit.prevent="submit">
            <label
              v-for="(f, i) in schema.fields" :key="f.key"
              class="fld" :class="{ wide: f.span === 2, bad: errors[f.key] }" :style="{ '--i': i }"
            >
              <span class="lb">
                {{ f.label }}<i v-if="f.required" class="req">*</i>
              </span>

              <select v-if="f.type === 'select'" v-model="form[f.key]">
                <option v-for="o in optionsOf(f)" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>

              <span v-else-if="f.type === 'bool'" class="boolRow">
                <button type="button" class="sw" :class="{ on: form[f.key] }"
                        :aria-pressed="!!form[f.key]" @click="form[f.key] = !form[f.key]">
                  <i />
                </button>
                <span class="boolTxt">{{ form[f.key] ? 'Ha' : 'Yo‘q' }}</span>
              </span>

              <textarea v-else-if="f.type === 'textarea'" v-model="form[f.key]" rows="3"
                        :placeholder="f.placeholder" />

              <span v-else-if="f.type === 'series'" class="ser">
                <label v-for="(mn, k) in months" :key="mn" class="serCell">
                  <span class="serM">{{ mn }}</span>
                  <input v-model="form[f.key][k]" type="number" />
                </label>
              </span>

              <input
                v-else
                v-model="form[f.key]"
                :type="f.type === 'number' ? 'number' : 'text'"
                :step="f.step" :min="f.min" :max="f.max" :placeholder="f.placeholder"
              />

              <span v-if="errors[f.key]" class="err">{{ errors[f.key] }}</span>
              <span v-else-if="f.hint" class="hint">{{ f.hint }}</span>
            </label>
          </form>

          <footer>
            <div class="left">
              <template v-if="isEdit">
                <button v-if="!askDelete" class="btn danger" @click="askDelete = true">
                  O‘chirish
                </button>
                <template v-else>
                  <span class="ask">Yozuv o‘chirilsinmi?</span>
                  <button class="btn danger" @click="destroy">Ha, o‘chirilsin</button>
                  <button class="btn" @click="askDelete = false">Bekor</button>
                </template>
              </template>
            </div>
            <div class="right">
              <button class="btn" @click="emit('close')">Bekor qilish</button>
              <button class="btn primary" @click="submit">
                <AppIcon name="shield" :size="14" />
                {{ isEdit ? 'Saqlash' : 'Qo‘shish' }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.wrap { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 24px; }
.scrim { position: absolute; inset: 0; background: rgba(var(--scrim-rgb), 0.72); backdrop-filter: blur(3px); }

.dlg {
  position: relative;
  width: min(720px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border-radius: var(--r-lg);
  border: 1px solid var(--line-strong);
  background: linear-gradient(168deg, rgba(var(--panel-hi-rgb), 0.96), rgba(var(--deep-rgb), 0.98));
  box-shadow: var(--shadow-lift);
  overflow: hidden;
}

header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--line);
}
header h3 { font-size: 17px; margin-top: 4px; }

.x {
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

.grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px 22px 22px;
}

.fld {
  display: grid;
  gap: 6px;
  align-content: start;
  animation: rise 0.45s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 22ms);
}
.fld.wide { grid-column: 1 / -1; }

.lb { font-size: 11.5px; color: var(--mist-dim); }
.req { color: var(--coral); font-style: normal; margin-left: 3px; }

.ser {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 7px;
}
.serCell { display: grid; gap: 3px; }
.serM {
  font-family: var(--font-data);
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mist-dim);
}
.serCell input { padding: 7px 8px !important; font-size: 12px !important; }
@media (max-width: 620px) { .ser { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

.fld textarea {
  width: 100%;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: var(--field);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
  color: var(--snow);
  outline: none;
  resize: vertical;
  transition: border-color 0.3s ease;
}
.fld textarea:focus { border-color: var(--turk); }
.fld textarea::placeholder { color: var(--mist-dim); }

.fld input,
.fld select {
  width: 100%;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.7);
  font-size: 13px;
  color: var(--snow);
  outline: none;
  transition: border-color 0.3s ease;
}
.fld input:focus,
.fld select:focus { border-color: var(--turk); }
.fld input::placeholder { color: var(--mist-dim); }
.fld select option { background: var(--ink-800); }
.fld.bad input,
.fld.bad select { border-color: var(--coral); }

.err { font-size: 11px; color: var(--coral); }
.hint { font-size: 11px; color: var(--mist-dim); }

.boolRow { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
.sw {
  width: 42px;
  height: 24px;
  border-radius: 99px;
  border: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.7);
  padding: 2px;
  display: flex;
  transition: all 0.3s var(--ease-out);
}
.sw i {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--mist-dim);
  transition: all 0.3s var(--ease-out);
}
.sw.on { border-color: var(--turk); background: var(--turk-dim); }
.sw.on i { background: var(--turk); transform: translateX(18px); }
.boolTxt { font-size: 12.5px; color: var(--mist); }

footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 22px;
  border-top: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.5);
}
.left, .right { display: flex; align-items: center; gap: 8px; }
.ask { font-size: 12.5px; color: var(--mist); }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 9px;
  border: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.btn:hover { color: var(--turk); border-color: var(--turk); }
.btn.primary { background: var(--turk-dim); color: var(--turk); border-color: var(--turk); }
.btn.danger { color: var(--coral); border-color: rgba(var(--coral-rgb), 0.4); }
.btn.danger:hover { background: var(--coral-dim); color: var(--coral); border-color: var(--coral); }

@media (max-width: 620px) {
  .grid { grid-template-columns: 1fr; }
  .fld.wide { grid-column: auto; }
}

.modal-enter-active .dlg { transition: transform 0.4s var(--ease-out), opacity 0.4s ease; }
.modal-leave-active .dlg { transition: transform 0.25s ease, opacity 0.25s ease; }
.modal-enter-from .dlg, .modal-leave-to .dlg { transform: translateY(18px) scale(0.98); opacity: 0; }
.modal-enter-active .scrim, .modal-leave-active .scrim { transition: opacity 0.3s ease; }
.modal-enter-from .scrim, .modal-leave-to .scrim { opacity: 0; }
</style>
