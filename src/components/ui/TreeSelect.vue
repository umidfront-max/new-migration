<script setup>
/* Ikki darajali tanlov: viloyat bosilsa — tumanlari shu ro'yxatning o'zida ochiladi.
   Tuman tanlansa ikkalasi birga qaytadi; tumani yo'q viloyat o'zi tanlanadi. */
import { ref, computed, nextTick } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  /** [{ value, label, children: [{ value, label }] }] */
  tree: { type: Array, required: true },
  parent: { type: String, default: '' },
  child: { type: String, default: '' },
  placeholder: { type: String, default: '— tanlang —' },
  invalid: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

const open = ref(false)
const expanded = ref(null)
const q = ref('')
const searchEl = ref(null)
const listEl = ref(null)

/** Ochilgan viloyatni ro'yxat tepasiga chiqaradi — tumanlari ko'rinib tursin */
const revealParent = (value) =>
  nextTick(() => {
    const btn = listEl.value?.querySelector(`[data-parent="${CSS.escape(value)}"]`)
    if (btn) listEl.value.scrollTop = btn.offsetTop - 5
  })

const label = computed(() => {
  if (!props.parent) return ''
  return props.child ? `${props.parent} · ${props.child}` : props.parent
})

/** Qidiruvda: nomi mos viloyat butunlay, aks holda faqat mos tumanlari bilan */
const shown = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return props.tree
  return props.tree
    .map((p) => {
      if (p.label.toLowerCase().includes(s)) return p
      const children = p.children.filter((c) => c.label.toLowerCase().includes(s))
      return children.length ? { ...p, children } : null
    })
    .filter(Boolean)
})

const isOpen = (p) => !!q.value.trim() || expanded.value === p.value

const toggle = () => {
  open.value = !open.value
  if (!open.value) return
  q.value = ''
  expanded.value = props.parent || null
  nextTick(() => searchEl.value?.focus())
  if (props.parent) revealParent(props.parent)
}

const pickParent = (p) => {
  if (!p.children.length) return choose(p.value, '')
  expanded.value = expanded.value === p.value ? null : p.value
  if (expanded.value) revealParent(p.value)
}

const choose = (parentValue, childValue) => {
  emit('select', parentValue, childValue)
  open.value = false
}

/* Esc ro'yxatni yopadi, modal oynani emas */
const onKey = (e) => {
  if (e.key === 'Escape' && open.value) {
    e.preventDefault()
    e.stopPropagation()
    open.value = false
  }
}
</script>

<template>
  <div class="tree" :class="{ open, bad: invalid }" @keydown="onKey">
    <button type="button" class="trigger" :aria-expanded="open" @click="toggle">
      <span :class="{ ph: !label }">{{ label || placeholder }}</span>
      <AppIcon name="chevron" :size="14" class="caret" />
    </button>

    <div v-if="open" class="panel">
      <div class="find">
        <AppIcon name="search" :size="14" />
        <input ref="searchEl" v-model="q" type="text" placeholder="Viloyat yoki tuman nomi" />
      </div>

      <ul ref="listEl" class="list">
        <li v-for="p in shown" :key="p.value">
          <button type="button" class="opt par" :class="{ on: parent === p.value && !child }"
                  :data-parent="p.value" @click="pickParent(p)">
            <AppIcon v-if="p.children.length" name="chevron" :size="13"
                     class="arrow" :class="{ down: isOpen(p) }" />
            <span class="nm">{{ p.label }}</span>
            <span v-if="p.children.length" class="cnt">{{ p.children.length }}</span>
          </button>

          <ul v-if="isOpen(p) && p.children.length" class="kids">
            <li v-for="c in p.children" :key="c.value">
              <button type="button" class="opt kid"
                      :class="{ on: parent === p.value && child === c.value }"
                      @click="choose(p.value, c.value)">
                {{ c.label }}
                <AppIcon v-if="parent === p.value && child === c.value" name="check" :size="12" />
              </button>
            </li>
          </ul>
        </li>
        <li v-if="!shown.length" class="none">Hech narsa topilmadi</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tree { display: grid; gap: 6px; }

.trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 9px 11px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.7);
  font-size: 13px;
  color: var(--snow);
  text-align: left;
  transition: border-color 0.3s ease;
}
.trigger:hover, .open .trigger { border-color: var(--turk); }
.bad .trigger { border-color: var(--coral); }
.ph { color: var(--mist-dim); }
.caret { color: var(--mist); transform: rotate(90deg); transition: transform 0.25s var(--ease-out); }
.open .caret { transform: rotate(-90deg); }

.panel {
  border-radius: 11px;
  border: 1px solid var(--line-strong);
  background: rgba(var(--deep-rgb), 0.92);
  overflow: hidden;
}

.find {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border-bottom: 1px solid var(--line);
  color: var(--mist-dim);
}
.find input {
  flex: 1;
  padding: 9px 0 !important;
  border: 0 !important;
  background: transparent !important;
  font-size: 12.5px;
  color: var(--snow);
  outline: none;
}

.list { position: relative; list-style: none; margin: 0; padding: 5px; max-height: 300px; overflow-y: auto; }
.kids { list-style: none; margin: 2px 0 4px 14px; padding: 0 0 0 8px; border-left: 1px solid var(--line); }

.opt {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  padding: 7px 9px;
  border-radius: 7px;
  font-size: 12.5px;
  color: var(--mist);
  text-align: left;
  transition: background 0.2s ease, color 0.2s ease;
}
.opt:hover { background: var(--turk-dim); color: var(--snow); }
.opt.on { color: var(--turk); background: var(--turk-dim); }
.par { color: var(--snow); font-weight: 500; }
.kid { justify-content: space-between; }
.nm { flex: 1; }
.cnt {
  font-family: var(--font-data);
  font-size: 10.5px;
  color: var(--mist-dim);
}
.arrow { color: var(--mist-dim); transition: transform 0.2s var(--ease-out); }
.arrow.down { transform: rotate(90deg); color: var(--turk); }
.none { padding: 10px; font-size: 12px; color: var(--mist-dim); }
</style>
