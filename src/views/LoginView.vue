<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuth, demoUsers } from '@/stores/auth'
import { useTheme } from '@/stores/theme'
import { db } from '@/stores/db'
import { fmt } from '@/composables/useCountUp'

const router = useRouter()
const route = useRoute()
const { signIn } = useAuth()
const { theme, toggleTheme } = useTheme()

const login = ref('admin.root')
const password = ref('')
const remember = ref(true)
const show = ref(false)
const busy = ref(false)
const error = ref('')

/* Chap paneldagi jonli raqamlar — haqiqiy bazadan olinadi */
const facts = computed(() => [
  { label: 'Reyestrdagi yozuvlar', value: fmt(db.migrants.length) },
  { label: 'Kuzatuvdagi davlatlar', value: fmt(db.countries.length) },
  { label: 'Ochiq SOS murojaatlar', value: fmt(db.sosEvents.length) },
  { label: 'Ulangan tashqi tizimlar', value: fmt(db.integrations.length) },
])

const submit = () => {
  error.value = ''
  if (!login.value.trim()) return (error.value = 'Login kiritilmadi')
  if (!password.value) return (error.value = 'Parol kiritilmadi')

  busy.value = true
  /* Demo: tarmoq kechikishini taqlid qiladi */
  setTimeout(() => {
    const res = signIn(login.value, password.value)
    busy.value = false
    if (!res.ok) {
      error.value = res.error
      return
    }
    router.replace(typeof route.query.next === 'string' ? route.query.next : '/')
  }, 550)
}

const useDemo = (u) => {
  login.value = u.login
  password.value = 'demo'
  error.value = ''
}
</script>

<template>
  <div class="auth">
    <div class="atmo" aria-hidden="true">
      <span class="blob b1" /><span class="blob b2" /><span class="blob b3" />
      <span class="mesh" />
    </div>

    <button class="themeBtn" :aria-label="theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'"
            @click="toggleTheme">
      <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
    </button>

    <!-- Chap: brend paneli -->
    <section class="side">
      <div class="brand">
        <span class="mark">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <circle cx="16" cy="16" r="5" fill="var(--turk)" />
            <circle cx="16" cy="16" r="11" fill="none" stroke="var(--turk)" stroke-width="1" opacity="0.45" />
            <circle cx="16" cy="16" r="15" fill="none" stroke="var(--turk)" stroke-width="1" opacity="0.18" />
            <circle cx="27" cy="16" r="2.4" fill="var(--saffron)" />
            <circle cx="9" cy="6" r="2" fill="var(--coral)" />
          </svg>
        </span>
        <div>
          <p class="bn">MIGRATSIYA</p>
          <p class="bs">Yagona monitoring platformasi</p>
        </div>
      </div>

      <div class="pitch">
        <h1>Mehnat migratsiyasi<br /><em>yagona raqamli nazorat</em> ostida</h1>
        <p class="lead">
          Reyestr, chegara oqimi, konsullik yordami, SOS murojaatlari va AI xavf
          baholash — barchasi bitta boshqaruv panelida.
        </p>
      </div>

      <dl class="facts">
        <div v-for="(f, i) in facts" :key="f.label" :style="{ '--i': i }">
          <dt class="num">{{ f.value }}</dt>
          <dd>{{ f.label }}</dd>
        </div>
      </dl>

      <p class="legal">
        © 2026 Migratsiya agentligi · Ma’lumotlar “Shaxsga doir ma’lumotlar
        to‘g‘risida”gi qonun talablariga muvofiq qayta ishlanadi.
      </p>
    </section>

    <!-- O'ng: forma -->
    <section class="pane">
      <form class="card" @submit.prevent="submit">
        <p class="eyebrow">Xavfsiz kirish</p>
        <h2>Tizimga kirish</h2>
        <p class="sub">Vakolatingizga mos bo‘lim va ma’lumotlar ko‘rsatiladi.</p>

        <label class="fld">
          <span class="lb">Login</span>
          <span class="wrap">
            <AppIcon name="users" :size="16" />
            <input v-model="login" autocomplete="username" placeholder="admin.root" />
          </span>
        </label>

        <label class="fld">
          <span class="lb">Parol</span>
          <span class="wrap">
            <AppIcon name="shield" :size="16" />
            <input v-model="password" :type="show ? 'text' : 'password'"
                   autocomplete="current-password" placeholder="••••••" />
            <button type="button" class="eye" :aria-label="show ? 'Yashirish' : 'Ko‘rsatish'"
                    @click="show = !show">
              <AppIcon :name="show ? 'eyeOff' : 'eye'" :size="16" />
            </button>
          </span>
        </label>

        <div class="row">
          <label class="chk">
            <input v-model="remember" type="checkbox" />
            <span class="box"><AppIcon name="check" :size="12" /></span>
            Meni eslab qol
          </label>
          <button type="button" class="link">Parolni unutdingizmi?</button>
        </div>

        <Transition name="err">
          <p v-if="error" class="error">
            <AppIcon name="close" :size="14" /> {{ error }}
          </p>
        </Transition>

        <button class="go" type="submit" :disabled="busy">
          <span v-if="!busy">Kirish</span>
          <span v-else class="dots"><i /><i /><i /></span>
          <AppIcon v-if="!busy" name="chevron" :size="16" />
        </button>

        <div class="or"><span>yoki</span></div>

        <button type="button" class="alt">
          <AppIcon name="stamp" :size="16" /> E-IMZO kaliti bilan kirish
        </button>

        <div class="demo">
          <p class="dh">Demo hisoblar — parol <b class="num">demo</b></p>
          <div class="dl">
            <button v-for="u in demoUsers" :key="u.login" type="button" class="du"
                    @click="useDemo(u)">
              <b class="num">{{ u.login }}</b>
              <span>{{ u.role }}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.auth {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  min-height: 100vh;
  background: var(--ink-900);
  overflow: hidden;
}

/* ---------------------------------------------------------- atmosfera */
.atmo { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.blob { position: absolute; border-radius: 50%; filter: blur(120px); opacity: calc(var(--glow-op) * 0.55); }
.b1 { width: 42vw; height: 42vw; top: -12vw; left: -6vw; background: var(--turk); animation: drift 28s var(--ease-in-out) infinite; }
.b2 { width: 34vw; height: 34vw; bottom: -14vw; left: 22vw; background: var(--lapis); animation: drift 34s var(--ease-in-out) infinite reverse; }
.b3 { width: 28vw; height: 28vw; top: 30vh; right: -8vw; background: var(--violet); animation: drift 40s var(--ease-in-out) infinite; }
.mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--mist-rgb), 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--mist-rgb), 0.05) 1px, transparent 1px);
  background-size: 58px 58px;
  mask-image: radial-gradient(ellipse 70% 70% at 20% 20%, #000 20%, transparent 75%);
}

.themeBtn {
  position: absolute;
  right: 24px;
  top: 24px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface-2);
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.themeBtn:hover { color: var(--turk); border-color: var(--turk); transform: rotate(18deg); }

/* -------------------------------------------------------- chap panel */
.side {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 34px;
  padding: 46px 52px;
  border-right: 1px solid var(--line);
}

.brand { display: flex; align-items: center; gap: 13px; }
.mark {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  border: 1px solid var(--line-strong);
  background: rgba(var(--turk-rgb), 0.07);
}
.mark svg { animation: spin 44s linear infinite; }
.bn { margin: 0; font-family: var(--font-data); font-size: 13px; font-weight: 700; letter-spacing: 0.17em; }
.bs { margin: 2px 0 0; font-size: 11px; color: var(--mist-dim); }

.pitch { margin-top: auto; }
.pitch h1 {
  font-size: clamp(28px, 3.6vw, 46px);
  line-height: 1.1;
  letter-spacing: -0.03em;
  animation: rise 0.8s var(--ease-out) backwards;
}
.pitch h1 em {
  font-style: normal;
  background: linear-gradient(100deg, var(--turk), var(--lapis));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.lead {
  max-width: 46ch;
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--mist);
  animation: rise 0.8s var(--ease-out) 0.1s backwards;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 14px;
  margin: 0;
  padding-top: 26px;
  border-top: 1px solid var(--line);
}
.facts > div { animation: rise 0.7s var(--ease-out) backwards; animation-delay: calc(var(--i) * 90ms + 200ms); }
.facts dt { font-size: 22px; font-weight: 700; color: var(--snow); }
.facts dd { margin: 3px 0 0; font-size: 11.5px; color: var(--mist-dim); }

.legal { margin: 0; font-size: 11px; line-height: 1.6; color: var(--mist-dim); max-width: 52ch; }

/* ---------------------------------------------------------- o'ng panel */
.pane {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 46px 32px;
}

.card {
  width: min(420px, 100%);
  padding: 32px;
  border-radius: var(--r-xl);
  border: 1px solid var(--line-strong);
  background: var(--panel-grad);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-lift);
  animation: rise 0.7s var(--ease-out) 0.12s backwards;
}
.card h2 { font-size: 25px; margin-top: 5px; }
.sub { margin: 7px 0 26px; font-size: 12.5px; color: var(--mist); }

.fld { display: block; margin-bottom: 15px; }
.lb { display: block; margin-bottom: 6px; font-size: 11.5px; color: var(--mist-dim); }
.wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border-radius: 11px;
  border: 1px solid var(--line);
  background: var(--field);
  color: var(--mist-dim);
  transition: border-color 0.3s ease, box-shadow 0.35s ease, color 0.3s ease;
}
.wrap:focus-within {
  border-color: var(--turk);
  color: var(--turk);
  box-shadow: 0 0 0 4px rgba(var(--turk-rgb), 0.1);
}
.wrap input {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
  border: none;
  outline: none;
  background: none;
  font-size: 13.5px;
  color: var(--snow);
}
.wrap input::placeholder { color: var(--mist-dim); }
.eye { display: grid; place-items: center; color: var(--mist-dim); }
.eye:hover { color: var(--turk); }

.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 4px 0 20px; }
.chk { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--mist); cursor: pointer; }
.chk input { position: absolute; opacity: 0; width: 0; height: 0; }
.box {
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1px solid var(--line-strong);
  color: transparent;
  transition: all 0.25s var(--ease-out);
}
.chk input:checked + .box { background: var(--turk); border-color: var(--turk); color: var(--ink-900); }
.chk input:focus-visible + .box { outline: 2px solid var(--turk); outline-offset: 2px; }
.link { font-size: 12.5px; color: var(--mist-dim); }
.link:hover { color: var(--turk); }

.error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding: 9px 13px;
  border-radius: 10px;
  border: 1px solid var(--coral);
  background: var(--coral-dim);
  font-size: 12.5px;
  color: var(--coral);
}
.err-enter-active, .err-leave-active { transition: all 0.3s var(--ease-out); }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-5px); }

.go {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  background: linear-gradient(100deg, var(--turk), var(--lapis));
  color: var(--ink-900);
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.3s var(--ease-out), box-shadow 0.35s ease, opacity 0.3s ease;
}
html[data-theme='light'] .go { color: #fff; }
.go:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px -14px rgba(var(--turk-rgb), 0.8); }
.go:disabled { opacity: 0.7; cursor: default; }
.dots { display: inline-flex; gap: 4px; }
.dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  animation: bob 1s var(--ease-in-out) infinite;
}
.dots i:nth-child(2) { animation-delay: 0.14s; }
.dots i:nth-child(3) { animation-delay: 0.28s; }
@keyframes bob { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-4px); opacity: 1; } }

.or {
  position: relative;
  margin: 20px 0;
  text-align: center;
}
.or::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--line);
}
.or span {
  position: relative;
  padding: 0 12px;
  font-size: 11px;
  color: var(--mist-dim);
  background: var(--ink-800);
}

.alt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  font-size: 13px;
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.alt:hover { color: var(--lapis); border-color: var(--lapis); background: var(--lapis-dim); }

.demo { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); }
.dh { margin: 0 0 10px; font-size: 11.5px; color: var(--mist-dim); }
.dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.du {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 9px;
  border: 1px solid var(--line);
  text-align: left;
  transition: all 0.3s var(--ease-out);
}
.du b { font-size: 11px; color: var(--mist); }
.du span { font-size: 10px; color: var(--mist-dim); }
.du:hover { border-color: var(--turk); background: var(--turk-dim); }
.du:hover b { color: var(--turk); }

/* ------------------------------------------------------------- mobil */
@media (max-width: 980px) {
  .auth { grid-template-columns: 1fr; }
  .side { display: none; }
  .pane { padding: 28px 18px; }
  .card { padding: 26px 22px; }
}
</style>
