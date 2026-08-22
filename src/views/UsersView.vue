<script setup>
import { ref, computed } from 'vue'
import PanelCard from '@/components/ui/PanelCard.vue'
import StatTile from '@/components/ui/StatTile.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RecordModal from '@/components/ui/RecordModal.vue'
import { db, patchRecord } from '@/stores/db'
import { useRecordModal } from '@/composables/useRecords'
import { useAuth, initialsOf } from '@/stores/auth'

const users = db.users
const roles = db.roles
const { user: me } = useAuth()

const q = ref('')
const fRole = ref('all')
const fStatus = ref('all')

const list = computed(() =>
  users.filter((u) => {
    if (fRole.value !== 'all' && u.role !== fRole.value) return false
    if (fStatus.value !== 'all' && u.status !== fStatus.value) return false
    if (q.value) {
      const s = q.value.toLowerCase()
      return (
        u.name.toLowerCase().includes(s) ||
        u.login.toLowerCase().includes(s) ||
        (u.unit || '').toLowerCase().includes(s)
      )
    }
    return true
  }),
)

const active = computed(() => users.filter((u) => u.status === 'Faol').length)
const blocked = computed(() => users.filter((u) => u.status === 'Bloklangan').length)

/* Rol bo'yicha taqsimot — panel o'ng tomonida */
const byRole = computed(() => {
  const map = new Map()
  users.forEach((u) => map.set(u.role, (map.get(u.role) || 0) + 1))
  const max = Math.max(...map.values(), 1)
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      pct: (count / max) * 100,
      tone: roles.find((r) => r.name === name)?.tone || 'lapis',
    }))
})

const { modal, editing, flash, openAdd, openEdit, close, onSaved, onRemoved, run } =
  useRecordModal({
    added: 'Foydalanuvchi qo‘shildi — kiritilgan parol bilan kira oladi',
    updated: 'Foydalanuvchi ma’lumoti yangilandi',
    removed: 'Foydalanuvchi o‘chirildi',
  })

/** Bloklash / blokdan chiqarish — serverga yuboriladi */
const toggleStatus = (user) => {
  const next = user.status === 'Faol' ? 'Bloklangan' : 'Faol'
  return run(
    () => patchRecord('users', user, { status: next }),
    next === 'Faol' ? `${user.name} blokdan chiqarildi` : `${user.name} bloklandi`,
  )
}

const withPassword = computed(() => users.filter((u) => u.hasPassword).length)

const reset = () => {
  q.value = ''
  fRole.value = 'all'
  fStatus.value = 'all'
}
</script>

<template>
  <div class="v-page">
    <div class="v-kpis">
      <StatTile label="Jami foydalanuvchilar" :value="users.length" tone="lapis"
                sub="tizimga kirish huquqi bor" class="enter" />
      <StatTile label="Faol" :value="active" tone="turk" sub="kira oladi"
                :delay="120" class="enter" :style="{ '--i': 1 }" />
      <StatTile label="Bloklangan" :value="blocked" tone="coral" sub="kirish taqiqlangan"
                :delay="240" class="enter" :style="{ '--i': 2 }" />
      <StatTile label="Paroli o‘rnatilgan" :value="withPassword" tone="saffron"
                sub="qolganlari standart parolda" :delay="360" class="enter"
                :style="{ '--i': 3 }" />
    </div>

    <div class="v-2-1">
      <PanelCard eyebrow="Kirish huquqlari" title="Foydalanuvchilar"
                 :hint="`${list.length} ta yozuv · ${withPassword} tasida parol o‘rnatilgan`"
                 class="enter" :style="{ '--i': 4 }">
        <template #actions>
          <button class="v-btn add" @click="openAdd">
            <AppIcon name="plus" :size="14" /> Foydalanuvchi qo‘shish
          </button>
        </template>

        <Transition name="flash">
          <p v-if="flash" class="v-flash"><AppIcon name="shield" :size="13" /> {{ flash }}</p>
        </Transition>

        <div class="filters">
          <label class="search">
            <AppIcon name="search" :size="16" />
            <input v-model="q" placeholder="F.I.Sh, login yoki bo‘lim bo‘yicha" />
            <button v-if="q" class="clr" aria-label="Tozalash" @click="q = ''">
              <AppIcon name="close" :size="14" />
            </button>
          </label>

          <select v-model="fRole">
            <option value="all">Barcha rollar</option>
            <option v-for="r in roles" :key="r._id" :value="r.name">{{ r.name }}</option>
          </select>

          <select v-model="fStatus">
            <option value="all">Holati: barchasi</option>
            <option value="Faol">Faol</option>
            <option value="Bloklangan">Bloklangan</option>
          </select>

          <button class="v-btn" @click="reset">Tozalash</button>
        </div>

        <div class="v-tblWrap">
          <table class="v-tbl">
            <thead>
              <tr>
                <th>Foydalanuvchi</th><th>Login</th><th>Roli</th>
                <th>Bo‘limi</th><th>Parol</th><th>Holati</th><th></th>
              </tr>
            </thead>
            <TransitionGroup tag="tbody" name="list">
              <tr v-for="(u, i) in list" :key="u._id" :style="{ '--i': i }">
                <td>
                  <span class="who">
                    <span class="av" :class="{ off: u.status !== 'Faol' }">{{ initialsOf(u.name) }}</span>
                    <span class="nm">
                      {{ u.name }}
                      <b v-if="u.login === me?.login" class="meTag">siz</b>
                    </span>
                  </span>
                </td>
                <td class="num lg">{{ u.login }}</td>
                <td class="muted">{{ u.role }}</td>
                <td class="muted">{{ u.unit }}</td>
                <td>
                  <span v-if="u.hasPassword" class="pw set">
                    <AppIcon name="shield" :size="12" /> O‘rnatilgan
                  </span>
                  <span v-else class="pw def" title="Parol hali qo‘yilmagan">
                    <AppIcon name="close" :size="12" /> Yo‘q
                  </span>
                </td>
                <td>
                  <button class="st" :class="{ off: u.status !== 'Faol' }"
                          :title="u.status === 'Faol' ? 'Bloklash' : 'Blokdan chiqarish'"
                          @click="toggleStatus(u)">
                    <i />{{ u.status }}
                  </button>
                </td>
                <td class="v-ta">
                  <button class="v-mini" aria-label="Tahrirlash" @click="openEdit(u)">
                    <AppIcon name="edit" :size="14" />
                  </button>
                </td>
              </tr>
            </TransitionGroup>
          </table>

          <p v-if="!list.length" class="empty">Bu filtrlar bo‘yicha foydalanuvchi yo‘q.</p>
        </div>
      </PanelCard>

      <div class="side">
        <PanelCard eyebrow="Taqsimot" title="Rollar bo‘yicha" class="enter" :style="{ '--i': 5 }">
          <div v-for="(r, i) in byRole" :key="r.name" class="rr" :style="{ '--i': i }">
            <div class="rrTop">
              <span class="rrN">{{ r.name }}</span>
              <b class="num">{{ r.count }}</b>
            </div>
            <div class="v-meter" :style="{ '--i': i }">
              <i :style="{ width: r.pct + '%', background: `var(--${r.tone})` }" />
            </div>
          </div>
          <p v-if="!byRole.length" class="empty">Ma’lumot yo‘q</p>
        </PanelCard>

        <PanelCard eyebrow="Qoida" title="Hisob yaratish tartibi" glow="lapis"
                   class="enter" :style="{ '--i': 6 }">
          <ul class="rules">
            <li><span class="n num">1</span> Login takrorlanmasligi kerak — u kirish identifikatori.</li>
            <li><span class="n num">2</span> Rol foydalanuvchi ko‘radigan ma’lumot ko‘lamini belgilaydi.</li>
            <li><span class="n num">3</span> Parol qo‘shish shaklida kiritiladi — kamida 6 ta belgi.
              Serverda Django’ning PBKDF2 hashi bilan saqlanadi, hech qachon ochiq qaytarilmaydi.</li>
            <li><span class="n num">4</span> Bloklangan hisob tizimga kira olmaydi, lekin
              audit jurnalidagi yozuvlari saqlanadi.</li>
            <li><span class="n num">5</span> Parolni almashtirish uchun foydalanuvchini
              tahrirlang — bo‘sh qoldirilsa eskisi saqlanadi.</li>
          </ul>
        </PanelCard>
      </div>
    </div>

    <RecordModal
      collection="users" :open="modal" :record="editing"
      @close="close" @saved="onSaved" @removed="onRemoved"
    />
  </div>
</template>

<style scoped>
.side { display: grid; gap: 18px; align-content: start; }

/* filtrlar */
.filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.search {
  position: relative;
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--mist-dim);
  transition: border-color 0.3s ease;
}
.search:focus-within { border-color: var(--turk); color: var(--turk); }
.search input {
  flex: 1;
  min-width: 0;
  padding: 9px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 13px;
  color: var(--snow);
}
.search input::placeholder { color: var(--mist-dim); }
.clr { color: var(--mist-dim); display: grid; place-items: center; }

.filters select {
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 12.5px;
  color: var(--mist);
  cursor: pointer;
  transition: border-color 0.3s ease;
}
.filters select:hover { border-color: var(--line-strong); }
.filters select option { background: var(--ink-800); }

/* jadval */
.who { display: inline-flex; align-items: center; gap: 10px; }
.av {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 9px;
  background: linear-gradient(140deg, var(--lapis), var(--turk));
  color: var(--ink-900);
  font-family: var(--font-data);
  font-size: 11px;
  font-weight: 700;
}
html[data-theme='light'] .av { color: #fff; }
.av.off { background: rgba(var(--mist-rgb), 0.25); color: var(--mist-dim); }
.nm { font-weight: 500; white-space: nowrap; }
.meTag {
  margin-left: 7px;
  padding: 1px 7px;
  border-radius: 99px;
  background: var(--turk-dim);
  font-size: 10px;
  font-weight: 500;
  color: var(--turk);
}
.lg { color: var(--turk); }

.st {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 99px;
  border: 1px solid var(--turk);
  background: var(--turk-dim);
  font-size: 11.5px;
  color: var(--turk);
  white-space: nowrap;
  transition: all 0.3s var(--ease-out);
}
.st i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.st.off { border-color: var(--coral); background: var(--coral-dim); color: var(--coral); }
.st:hover { filter: brightness(1.15); }

.pw {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11.5px;
  white-space: nowrap;
}
.pw.set { background: var(--turk-dim); color: var(--turk); }
.pw.def { background: var(--saffron-dim); color: var(--saffron); }
.empty { padding: 30px 16px; text-align: center; font-size: 13px; color: var(--mist-dim); }

/* rollar taqsimoti */
.rr {
  margin-bottom: 13px;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 60ms);
}
.rrTop { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 6px; }
.rrN { font-size: 12.5px; }
.rrTop b { font-size: 13px; }

/* qoidalar */
.rules { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.rules li {
  display: flex;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--mist);
}
.n {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
  border-radius: 6px;
  border: 1px solid var(--line);
  font-size: 10px;
  color: var(--lapis);
}
</style>
