<script setup>
/* Universal qo'shish/tahrirlash oynasi — sxema asosida forma quradi */
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { schemas, blankModel, toFormModel } from '@/data/schemas'
import { months } from '@/data/labels'
import { ApiError, removeRecord, saveRecord } from '@/stores/db'

/** Parol uchun eng kam uzunlik — serverdagi validator bilan bir xil */
const MIN_PASSWORD = 6

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
const busy = ref(false)
const serverError = ref('')
const formEl = ref(null)
const revealed = ref({})

const optionsOf = (f) => (typeof f.options === 'function' ? f.options() : f.options || [])

/* --------------------------------------------------------------- maskalar
   Sxemadagi `mask` maydoni kiritilayotgan matnni darhol formatlaydi.
   Har bir mask (raw) => tozalangan qiymat qaytaradi. */
const maskFns = {
  /* Faqat raqam, uzunligi `len` bilan cheklangan (PINFL — 14 ta) */
  digits: (raw, f) => raw.replace(/\D/g, '').slice(0, f.len ?? 32),

  /* +998 90 123-45-67 */
  phone: (raw) => {
    let d = raw.replace(/\D/g, '')
    if (d.startsWith('998')) d = d.slice(3)
    d = d.slice(0, 9)
    if (!d) return ''
    let out = '+998 ' + d.slice(0, 2)
    if (d.length > 2) out += ' ' + d.slice(2, 5)
    if (d.length > 5) out += '-' + d.slice(5, 7)
    if (d.length > 7) out += '-' + d.slice(7, 9)
    return out
  },
}

/** Maskali maydonning `maxlength` qiymati */
const maskMax = (f) => (f.mask === 'phone' ? 17 : f.len)

/** Kiritish paytida formatlash — DOM ham majburan tenglashtiriladi,
 *  aks holda qiymat o'zgarmasa Vue inputni qayta chizmaydi. */
const onMasked = (f, ev) => {
  const out = maskFns[f.mask](ev.target.value, f)
  form.value[f.key] = out
  if (ev.target.value !== out) ev.target.value = out
}

/** `multi` maydonda variantni qo'shish yoki olib tashlash */
const toggleMulti = (key, value) => {
  const list = form.value[key] || []
  form.value[key] = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

watch(
  () => [props.open, props.record],
  ([open]) => {
    if (!open) return
    form.value = props.record ? toFormModel(props.collection, props.record) : blankModel(props.collection)
    errors.value = {}
    serverError.value = ''
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
    if (f.type === 'multi') {
      if (f.required && !(v || []).length) e[f.key] = 'Kamida bittasini tanlang'
      return
    }
    const empty = v === '' || v === null || v === undefined

    /* Parol: yaratishda majburiy, tahrirda bo'sh qolsa — eskisi saqlanadi */
    if (f.type === 'password') {
      if (empty) {
        if (!isEdit.value) e[f.key] = 'Parol kiritilishi shart'
      } else if (String(v).length < MIN_PASSWORD) {
        e[f.key] = `Kamida ${MIN_PASSWORD} ta belgi`
      } else if (f.confirm && form.value[f.confirm] !== v) {
        e[f.confirm] = 'Parollar mos kelmadi'
      }
      return
    }

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

const submit = async () => {
  if (busy.value || !validate()) return
  const clean = { ...form.value }
  schema.value.fields.forEach((f) => {
    if (f.type === 'number') {
      const empty = clean[f.key] === '' || clean[f.key] === null || clean[f.key] === undefined
      /* Bo'sh raqam grafiklarni buzmasligi uchun 0 ga tushadi; nullable maydonlar bundan mustasno */
      clean[f.key] = empty ? (f.nullable ? null : 0) : Number(clean[f.key])
    }
    if (f.type === 'series') clean[f.key] = (clean[f.key] || []).map((n) => Number(n) || 0)
    if (f.type === 'multi') clean[f.key] = [...(clean[f.key] || [])]
    if ((f.type === 'text' || f.type === 'textarea') && typeof clean[f.key] === 'string') {
      clean[f.key] = clean[f.key].trim()
    }
  })
  /* Bo'sh parol yuborilmaydi — server eskisini saqlab qoladi */
  schema.value.fields
    .filter((f) => f.type === 'password')
    .forEach((f) => {
      if (!clean[f.key]) delete clean[f.key]
      if (f.confirm) delete clean[f.confirm]
    })

  const data = schema.value.derive ? schema.value.derive(clean) : clean
  const mode = isEdit.value ? 'edit' : 'add'

  busy.value = true
  try {
    const row = await saveRecord(props.collection, props.record?._id, data)
    emit('saved', { row, mode })
    emit('close')
  } catch (error) {
    /* Server maydon xatolarini qaytarsa — ularni formada ko'rsatamiz */
    if (error instanceof ApiError && error.fields) errors.value = error.fields
    else serverError.value = error.message || 'Saqlab bo‘lmadi'
  } finally {
    busy.value = false
  }
}

/* Esc — oynani yopadi */
const onKey = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

const destroy = async () => {
  busy.value = true
  try {
    await removeRecord(props.collection, props.record._id)
    emit('removed', props.record)
    emit('close')
  } catch (error) {
    serverError.value = error.message || 'O‘chirib bo‘lmadi'
    askDelete.value = false
  } finally {
    busy.value = false
  }
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

          <Transition name="flash">
            <p v-if="serverError" class="srvErr">
              <AppIcon name="close" :size="14" /> {{ serverError }}
            </p>
          </Transition>

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

              <span v-else-if="f.type === 'password'" class="pw">
                <input
                  v-model="form[f.key]"
                  :type="revealed[f.key] ? 'text' : 'password'"
                  autocomplete="new-password"
                  :placeholder="isEdit ? 'o‘zgartirmaslik uchun bo‘sh qoldiring' : '••••••••'"
                />
                <button type="button" class="eye"
                        :aria-label="revealed[f.key] ? 'Yashirish' : 'Ko‘rsatish'"
                        @click="revealed[f.key] = !revealed[f.key]">
                  <AppIcon :name="revealed[f.key] ? 'eyeOff' : 'eye'" :size="15" />
                </button>
              </span>

              <span v-else-if="f.type === 'multi'" class="multi">
                <button
                  v-for="o in optionsOf(f)" :key="o.value" type="button"
                  class="chip" :class="{ on: (form[f.key] || []).includes(o.value) }"
                  :aria-pressed="(form[f.key] || []).includes(o.value)"
                  @click="toggleMulti(f.key, o.value)"
                >
                  <AppIcon v-if="(form[f.key] || []).includes(o.value)" name="check" :size="12" />
                  {{ o.label }}
                </button>
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
                v-else-if="f.mask"
                :value="form[f.key]"
                type="text"
                inputmode="numeric"
                :maxlength="maskMax(f)"
                :placeholder="f.placeholder"
                @input="onMasked(f, $event)"
              />

              <input
                v-else
                v-model="form[f.key]"
                :type="f.type === 'number' ? 'number' : 'text'"
                :step="f.step" :min="f.min" :max="f.max" :placeholder="f.placeholder"
              />

              <span v-if="errors[f.key]" class="err">{{ errors[f.key] }}</span>
              <span v-else-if="f.type === 'multi'" class="hint">
                {{ (form[f.key] || []).length }} ta tanlandi{{ f.hint ? ' · ' + f.hint : '' }}
              </span>
              <span v-else-if="f.hint" class="hint">{{ f.hint }}</span>
            </label>
          </form>

          <footer>
            <div class="left">
              <template v-if="isEdit">
                <button v-if="!askDelete" class="btn danger" :disabled="busy" @click="askDelete = true">
                  O‘chirish
                </button>
                <template v-else>
                  <span class="ask">Yozuv o‘chirilsinmi?</span>
                  <button class="btn danger" :disabled="busy" @click="destroy">Ha, o‘chirilsin</button>
                  <button class="btn" @click="askDelete = false">Bekor</button>
                </template>
              </template>
            </div>
            <div class="right">
              <button class="btn" @click="emit('close')">Bekor qilish</button>
              <button class="btn primary" :disabled="busy" @click="submit">
                <AppIcon name="shield" :size="14" />
                {{ busy ? 'Saqlanmoqda…' : isEdit ? 'Saqlash' : 'Qo‘shish' }}
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

.srvErr {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 22px;
  border-bottom: 1px solid var(--coral);
  background: var(--coral-dim);
  font-size: 12.5px;
  color: var(--coral);
}

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

/* parol */
.pw { position: relative; display: flex; align-items: center; }
.pw input { padding-right: 40px !important; }
.pw .eye {
  position: absolute;
  right: 10px;
  display: grid;
  place-items: center;
  color: var(--mist-dim);
}
.pw .eye:hover { color: var(--turk); }

.multi {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 9px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--field);
  max-height: 168px;
  overflow-y: auto;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 99px;
  border: 1px solid var(--line);
  font-size: 12px;
  color: var(--mist);
  transition: all 0.25s var(--ease-out);
}
.chip:hover { border-color: var(--line-strong); color: var(--snow); }
.chip.on {
  border-color: var(--turk);
  background: var(--turk-dim);
  color: var(--turk);
}

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
