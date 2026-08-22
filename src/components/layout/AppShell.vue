<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useApp, periods } from '@/stores/app'
import { useTheme } from '@/stores/theme'
import { useAuth, initialsOf } from '@/stores/auth'
import { db } from '@/stores/db'

const regions = db.regions

const route = useRoute()
const router = useRouter()
const { state, setPeriod, setRegion, toggleRail } = useApp()
const { theme, toggleTheme } = useTheme()
const { user, signOut } = useAuth()

const mobileOpen = ref(false)
const userOpen = ref(false)
const bellOpen = ref(false)
const q = ref('')
const searchEl = ref(null)

const nav = [
  { g: 'Monitoring', items: [
    { to: '/', icon: 'grid', label: 'Boshqaruv paneli' },
    { to: '/registry', icon: 'users', label: 'Migrantlar reyestri' },
    { to: '/border', icon: 'gate', label: 'Chegara monitoringi' },
    { to: '/countries', icon: 'globe', label: 'Davlatlar xaritasi' },
    { to: '/employers', icon: 'building', label: 'Ish beruvchilar' },
  ]},
  { g: 'Xavfsizlik', items: [
    { to: '/violations', icon: 'shield', label: 'Qonunbuzilishlar' },
    { to: '/sos', icon: 'siren', label: 'SOS xizmati', badge: 12 },
    { to: '/consulate', icon: 'stamp', label: 'Konsullik kabineti' },
    { to: '/return', icon: 'back', label: 'Qaytish monitoringi' },
  ]},
  { g: 'Sun’iy intellekt', items: [
    { to: '/risk', icon: 'gauge', label: 'AI Risk Score' },
    { to: '/ai', icon: 'brain', label: 'AI Tahlil' },
  ]},
  { g: 'Tizim', items: [
    { to: '/admin', icon: 'sliders', label: 'Administrator paneli' },
    { to: '/users', icon: 'user', label: 'Foydalanuvchilar' },
    { to: '/audit', icon: 'scroll', label: 'Audit va jurnal' },
    { to: '/reports', icon: 'export', label: 'Hisobot va eksport' },
  ]},
]

const flat = nav.flatMap((g) => g.items)
const current = computed(() => flat.find((i) => i.to === route.path))
const title = computed(() => current.value?.label ?? route.meta.title ?? 'Boshqaruv paneli')
const section = computed(() => nav.find((g) => g.items.some((i) => i.to === route.path))?.g ?? 'Monitoring')

/** Yon paneldagi qidiruv — bo'lim nomi bo'yicha filtrlaydi */
const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return nav
  return nav
    .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(s)) }))
    .filter((g) => g.items.length)
})

/* Oxirgi SOS murojaatlar — bildirishnoma ro'yxati uchun */
const alerts = computed(() => db.sosEvents.slice(0, 5))

const go = (to) => {
  router.push(to)
  closeAll()
}

const closeAll = () => {
  mobileOpen.value = false
  userOpen.value = false
  bellOpen.value = false
}

const doSignOut = () => {
  closeAll()
  signOut()
  router.replace('/login')
}

/* Ctrl/⌘+K — qidiruvga fokus, Esc — ochiq menyularni yopish */
const onKey = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    mobileOpen.value = true
    searchEl.value?.focus()
  }
  if (e.key === 'Escape') closeAll()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="shell" :class="{ narrow: !state.railOpen }">
    <!-- Fon atmosferasi -->
    <div class="atmo" aria-hidden="true">
      <span class="blob b1" /><span class="blob b2" /><span class="blob b3" />
      <span class="grid-bg" />
    </div>

    <!-- ============================================================ RAIL -->
    <aside class="rail" :class="{ open: mobileOpen }">
      <div class="brand">
        <span class="mark">
          <svg viewBox="0 0 32 32" width="26" height="26">
            <circle cx="16" cy="16" r="5" fill="var(--turk)" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="var(--turk)" stroke-width="1" opacity="0.45" />
            <circle cx="16" cy="16" r="15" fill="none" stroke="var(--turk)" stroke-width="1" opacity="0.18" />
            <circle cx="27" cy="16" r="2.4" fill="var(--saffron)" />
            <circle cx="9" cy="6" r="2" fill="var(--coral)" />
          </svg>
        </span>
        <div class="bt">
          <p class="bn">MIGRATSIYA</p>
          <p class="bs">Yagona monitoring platformasi</p>
        </div>
        <button class="railX" aria-label="Menyuni yopish" @click="mobileOpen = false">
          <AppIcon name="close" :size="17" />
        </button>
      </div>

      <label class="find">
        <AppIcon name="search" :size="15" />
        <input ref="searchEl" v-model="q" placeholder="Bo‘limni qidirish" />
        <kbd class="num">⌘K</kbd>
      </label>

      <nav>
        <div v-for="g in filtered" :key="g.g" class="group">
          <p class="gl">{{ g.g }}</p>
          <RouterLink
            v-for="(it, k) in g.items" :key="it.to" :to="it.to"
            class="link" :style="{ '--i': k }" :title="it.label" @click="mobileOpen = false"
          >
            <span class="li"><AppIcon :name="it.icon" :size="17" /></span>
            <span class="lt">{{ it.label }}</span>
            <span v-if="it.badge" class="bdg num">{{ it.badge }}</span>
          </RouterLink>
        </div>
        <p v-if="!filtered.length" class="none">Bo‘lim topilmadi</p>
      </nav>

      <!-- Foydalanuvchi kartasi -->
      <div class="me" :class="{ up: userOpen }">
        <Transition name="pop">
          <div v-if="userOpen" class="menu">
            <p class="mHead">{{ user?.unit }}</p>
            <button @click="go('/admin')"><AppIcon name="sliders" :size="15" /> Administrator paneli</button>
            <button @click="go('/audit')"><AppIcon name="scroll" :size="15" /> Mening amallarim</button>
            <button @click="toggleTheme">
              <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="15" />
              {{ theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim' }}
            </button>
            <span class="mSep" />
            <button class="danger" @click="doSignOut">
              <AppIcon name="logout" :size="15" /> Tizimdan chiqish
            </button>
          </div>
        </Transition>

        <button class="meBtn" :aria-expanded="userOpen" @click="userOpen = !userOpen">
          <span class="av">{{ initialsOf(user?.name) }}</span>
          <span class="mt">
            <span class="mn">{{ user?.name }}</span>
            <span class="mr">{{ user?.role }}</span>
          </span>
          <AppIcon name="chevron" :size="14" class="mc" />
        </button>
      </div>
    </aside>

    <div v-if="mobileOpen" class="scrim" @click="mobileOpen = false" />

    <!-- ============================================================ MAIN -->
    <div class="main">
      <header class="bar">
        <button class="burger" aria-label="Menyuni ochish" @click="mobileOpen = true">
          <AppIcon name="menu" :size="20" />
        </button>
        <button class="collapse" aria-label="Panelni yig‘ish" @click="toggleRail">
          <AppIcon name="chevron" :size="15" />
        </button>

        <div class="tt">
          <p class="crumb">
            <span>{{ section }}</span>
            <AppIcon name="chevron" :size="11" />
            <span class="cNow">{{ title }}</span>
          </p>
          <h1>{{ title }}</h1>
        </div>

        <div class="tools">
          <div class="seg" role="tablist">
            <button
              v-for="p in periods" :key="p.id" role="tab"
              :aria-selected="state.period === p.id"
              :class="{ on: state.period === p.id }"
              @click="setPeriod(p.id)"
            >{{ p.label }}</button>
          </div>

          <div class="selWrap">
            <AppIcon name="pin" :size="14" />
            <select class="sel" :value="state.region" @change="setRegion($event.target.value)">
              <option value="all">Barcha hududlar</option>
              <option v-for="r in regions" :key="r._id" :value="r.name">{{ r.name }}</option>
            </select>
            <AppIcon name="chevron" :size="13" class="selC" />
          </div>

          <span class="div" />

          <button class="ico" :aria-label="theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'"
                  @click="toggleTheme">
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
          </button>

          <div class="bell">
            <button class="ico" aria-label="Bildirishnomalar" :aria-expanded="bellOpen"
                    @click="bellOpen = !bellOpen">
              <AppIcon name="bell" :size="17" />
              <span class="nd" />
            </button>
            <Transition name="pop">
              <div v-if="bellOpen" class="drop">
                <p class="dHead">
                  So‘nggi SOS murojaatlar
                  <button class="all" @click="go('/sos')">Barchasi</button>
                </p>
                <button v-for="a in alerts" :key="a._id" class="alert" @click="go('/sos')">
                  <span class="aDot" :class="`s-${a.severity}`" />
                  <span class="aTx">
                    <b>{{ a.type }}</b>
                    <span>{{ a.flag }} {{ a.city }} · {{ a.name }}</span>
                  </span>
                </button>
                <p v-if="!alerts.length" class="none">Murojaat yo‘q</p>
              </div>
            </Transition>
          </div>

          <button class="avBtn" aria-label="Profil" @click="userOpen = !userOpen; mobileOpen = true">
            {{ initialsOf(user?.name) }}
          </button>
        </div>
      </header>

      <main class="canvas">
        <slot />
      </main>
    </div>

    <div v-if="userOpen || bellOpen" class="capture" @click="closeAll" />
  </div>
</template>

<style scoped>
.shell {
  display: grid;
  grid-template-columns: var(--rail-w) 1fr;
  min-height: 100vh;
  transition: grid-template-columns 0.5s var(--ease-out);
}
.shell.narrow { grid-template-columns: 82px 1fr; }

/* ------------------------------------------------------------ atmosfera */
.atmo { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.blob { position: absolute; border-radius: 50%; filter: blur(110px); opacity: calc(var(--glow-op) * 0.4); }
.b1 { width: 44vw; height: 44vw; top: -14vw; left: 8vw; background: var(--turk); animation: drift 26s var(--ease-in-out) infinite; }
.b2 { width: 38vw; height: 38vw; bottom: -12vw; right: -6vw; background: var(--lapis); animation: drift 32s var(--ease-in-out) infinite reverse; }
.b3 { width: 26vw; height: 26vw; top: 42vh; left: 46vw; background: var(--violet); animation: drift 38s var(--ease-in-out) infinite; }
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--mist-rgb), 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--mist-rgb), 0.045) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%);
}

/* ================================================================= RAIL */
.rail {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 14px 14px;
  border-right: 1px solid var(--line);
  background: var(--rail-bg);
  backdrop-filter: blur(20px);
}

.brand { display: flex; align-items: center; gap: 12px; padding: 2px 6px 2px 4px; }
.mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 13px;
  border: 1px solid var(--line-strong);
  background: rgba(var(--turk-rgb), 0.07);
}
.mark svg { animation: spin 44s linear infinite; }
.bt { min-width: 0; flex: 1; }
.bn { margin: 0; font-family: var(--font-data); font-size: 12px; font-weight: 700; letter-spacing: 0.16em; }
.bs { margin: 1px 0 0; font-size: 10.5px; color: var(--mist-dim); white-space: nowrap; }
.railX { display: none; color: var(--mist-dim); }

/* qidiruv */
.find {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--field);
  color: var(--mist-dim);
  transition: border-color 0.3s ease, color 0.3s ease;
}
.find:focus-within { border-color: var(--turk); color: var(--turk); }
.find input {
  flex: 1;
  min-width: 0;
  padding: 9px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 12.5px;
  color: var(--snow);
}
.find input::placeholder { color: var(--mist-dim); }
.find kbd {
  flex-shrink: 0;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--line);
  font-size: 9.5px;
  color: var(--mist-dim);
}

nav { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -4px; padding: 0 4px; }
.group { margin-bottom: 16px; }
.gl {
  margin: 0 0 6px;
  padding: 0 10px;
  font-family: var(--font-data);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--mist-dim);
  white-space: nowrap;
}

.link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  height: 40px;
  padding: 0 10px;
  border-radius: 11px;
  color: var(--mist);
  font-size: 13px;
  white-space: nowrap;
  transition: color 0.28s ease, background 0.28s ease;
  animation: rise 0.5s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 35ms);
}
.li {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 9px;
  transition: background 0.28s ease, color 0.28s ease;
}
.lt { flex: 1; overflow: hidden; text-overflow: ellipsis; }

.link:hover { color: var(--snow); background: var(--hover); }
.link:hover .li { background: rgba(var(--mist-rgb), 0.1); }

.link.router-link-exact-active {
  color: var(--snow);
  background: linear-gradient(90deg, rgba(var(--turk-rgb), 0.16), rgba(var(--turk-rgb), 0.02));
  box-shadow: inset 2px 0 0 var(--turk);
}
.link.router-link-exact-active .li { background: var(--turk); color: var(--ink-900); }
html[data-theme='light'] .link.router-link-exact-active .li { color: #fff; }

.bdg {
  flex-shrink: 0;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 99px;
  background: var(--coral-dim);
  color: var(--coral);
}
.none { padding: 14px 10px; font-size: 12px; color: var(--mist-dim); }

/* foydalanuvchi kartasi */
.me { position: relative; padding-top: 12px; border-top: 1px solid var(--line); }
.meBtn {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 8px;
  border-radius: 12px;
  text-align: left;
  transition: background 0.3s ease;
}
.meBtn:hover { background: var(--hover); }
.av {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: linear-gradient(140deg, var(--lapis), var(--turk));
  color: var(--ink-900);
  font-family: var(--font-data);
  font-size: 12px;
  font-weight: 700;
}
html[data-theme='light'] .av { color: #fff; }
.mt { min-width: 0; flex: 1; display: grid; }
.mn { font-size: 12.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mr { font-size: 10.5px; color: var(--mist-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc { color: var(--mist-dim); transform: rotate(-90deg); transition: transform 0.3s var(--ease-out); }
.me.up .mc { transform: rotate(90deg); }

.menu {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 30;
  display: grid;
  gap: 2px;
  padding: 8px;
  border-radius: 14px;
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lift);
}
.mHead {
  margin: 0 0 4px;
  padding: 4px 10px;
  font-size: 10.5px;
  color: var(--mist-dim);
}
.menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 9px;
  font-size: 12.5px;
  color: var(--mist);
  text-align: left;
  transition: all 0.25s var(--ease-out);
}
.menu button:hover { background: var(--hover); color: var(--snow); }
.menu button.danger:hover { background: var(--coral-dim); color: var(--coral); }
.mSep { height: 1px; margin: 5px 4px; background: var(--line); }

/* yig'ilgan holat */
.narrow .bt, .narrow .gl, .narrow .lt, .narrow .bdg, .narrow .mt, .narrow .mc,
.narrow .find input, .narrow .find kbd { display: none; }
.narrow .rail { padding-inline: 20px; }
.narrow .brand { justify-content: center; padding-inline: 0; }
.narrow .find { justify-content: center; padding: 9px 0; }
.narrow .link { justify-content: center; padding: 0; gap: 0; }
.narrow .meBtn { justify-content: center; padding-inline: 0; }
.narrow .menu { left: -6px; width: 216px; right: auto; }
.narrow .collapse { transform: none; }

/* ================================================================= MAIN */
.main { position: relative; z-index: 1; min-width: 0; }

.bar {
  position: sticky;
  top: 0;
  z-index: 15;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: var(--head-h);
  padding: 12px 24px;
  border-bottom: 1px solid var(--line);
  background: var(--head-bg);
  backdrop-filter: blur(20px) saturate(140%);
}
.bar::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--turk-rgb), 0.45), transparent);
}

.tt { flex: 1; min-width: 0; }
.crumb {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mist-dim);
}
.crumb svg { opacity: 0.5; }
.cNow { color: var(--turk); }
.tt h1 { font-size: clamp(18px, 2.2vw, 24px); margin-top: 2px; }

.burger { display: none; color: var(--mist); }
.collapse {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--line);
  color: var(--mist);
  transform: rotate(180deg);
  transition: all 0.4s var(--ease-out);
}
.collapse:hover { color: var(--turk); border-color: var(--turk); }

.tools { display: flex; align-items: center; gap: 9px; }
.div { width: 1px; height: 22px; background: var(--line); }

.seg {
  display: flex;
  padding: 3px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.seg button {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--mist-dim);
  white-space: nowrap;
  transition: all 0.3s var(--ease-out);
}
.seg button:hover { color: var(--snow); }
.seg button.on {
  background: var(--turk-dim);
  color: var(--turk);
  box-shadow: inset 0 0 0 1px rgba(var(--turk-rgb), 0.35);
}

.selWrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--mist-dim);
  transition: border-color 0.3s ease;
}
.selWrap:hover { border-color: var(--line-strong); }
.sel {
  appearance: none;
  padding: 8px 18px 8px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 12px;
  color: var(--mist);
  cursor: pointer;
}
.sel option { background: var(--ink-800); color: var(--snow); }
.selC { position: absolute; right: 9px; transform: rotate(90deg); pointer-events: none; }

.ico {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.ico:hover { color: var(--turk); border-color: var(--turk); }
.nd {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--coral);
  box-shadow: 0 0 0 2px var(--head-bg);
  animation: blip2 2.4s infinite;
}
@keyframes blip2 { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.avBtn {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(140deg, var(--lapis), var(--turk));
  color: var(--ink-900);
  font-family: var(--font-data);
  font-size: 11.5px;
  font-weight: 700;
  transition: transform 0.3s var(--ease-out);
}
html[data-theme='light'] .avBtn { color: #fff; }
.avBtn:hover { transform: translateY(-2px); }

/* bildirishnoma paneli */
.bell { position: relative; }
.drop {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 30;
  width: min(330px, 84vw);
  padding: 10px;
  border-radius: 16px;
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lift);
}
.dHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 8px;
  padding: 4px 8px;
  font-size: 11px;
  color: var(--mist-dim);
}
.all { font-size: 11px; color: var(--turk); }
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 8px;
  border-radius: 10px;
  text-align: left;
  transition: background 0.25s ease;
}
.alert:hover { background: var(--hover); }
.aDot { width: 7px; height: 7px; margin-top: 6px; border-radius: 50%; flex-shrink: 0; background: var(--mist); }
.aDot.s-critical { background: var(--violet); }
.aDot.s-high { background: var(--coral); }
.aDot.s-mid { background: var(--saffron); }
.aDot.s-low { background: var(--turk); }
.aTx { display: grid; gap: 2px; min-width: 0; }
.aTx b { font-size: 12.5px; font-weight: 500; }
.aTx span { font-size: 11px; color: var(--mist-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pop-enter-active, .pop-leave-active { transition: all 0.28s var(--ease-out); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(8px) scale(0.98); }

.capture { position: fixed; inset: 0; z-index: 14; }

.canvas {
  position: relative;
  padding: 24px 26px 60px;
  min-height: calc(100vh - var(--head-h));
}

.scrim { display: none; }

/* --------------------------------------------------------------- mobil */
@media (max-width: 1280px) {
  .seg { display: none; }
}
@media (max-width: 1024px) {
  .shell, .shell.narrow { grid-template-columns: 1fr; }
  .rail {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    transform: translateX(-100%);
    transition: transform 0.45s var(--ease-out);
  }
  .rail.open { transform: none; }
  .railX { display: grid; place-items: center; }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 19;
    background: rgba(var(--scrim-rgb), 0.7);
    backdrop-filter: blur(3px);
    animation: fade 0.3s ease;
  }
  .burger { display: grid; place-items: center; }
  .collapse { display: none; }
  .canvas { padding: 18px 16px 48px; }
  .bar { padding: 12px 16px; }
}

@media (max-width: 760px) {
  .selWrap, .div { display: none; }
  .crumb { display: none; }
  .avBtn { display: none; }
}
</style>
