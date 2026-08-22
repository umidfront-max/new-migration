<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuth, demoUsers } from '@/stores/auth'
import { useTheme } from '@/stores/theme'

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
const demoOpen = ref(false)

const features = [
  { icon: 'users', title: 'Yagona reyestr', text: 'Migrant, ish beruvchi va hudud ma’lumotlari bitta bazada' },
  { icon: 'siren', title: 'Real vaqt signali', text: 'SOS murojaatlar va chegara oqimi bir zumda ko‘rinadi' },
  { icon: 'brain', title: 'AI xavf baholash', text: 'Model har bir yozuv uchun xavf ballini hisoblaydi' },
]

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
  demoOpen.value = false
}
</script>

<template>
  <div class="auth">
    <div class="atmo" aria-hidden="true">
      <span class="blob b1" /><span class="blob b2" /><span class="blob b3" />
      <span class="mesh" />
      <svg class="orbit" viewBox="0 0 600 600" fill="none">
        <circle cx="300" cy="300" r="150" stroke="currentColor" stroke-width="1" stroke-dasharray="3 9" />
        <circle cx="300" cy="300" r="225" stroke="currentColor" stroke-width="1" stroke-dasharray="3 14" />
        <circle cx="300" cy="300" r="290" stroke="currentColor" stroke-width="1" stroke-dasharray="2 18" />
      </svg>
    </div>

    <button class="themeBtn" :aria-label="theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'"
            @click="toggleTheme">
      <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="17" />
    </button>

    <!-- ======================================================== chap panel -->
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
        <span class="tagline"><i />Davlat axborot tizimi</span>
        <h1>Mehnat migratsiyasi<br /><em>yagona raqamli nazorat</em> ostida</h1>
        <p class="lead">
          Reyestr, chegara oqimi, konsullik yordami va SOS murojaatlari —
          barchasi bitta boshqaruv panelida, real vaqtda.
        </p>

        <ul class="feats">
          <li v-for="(f, i) in features" :key="f.title" :style="{ '--i': i }">
            <span class="fi"><AppIcon :name="f.icon" :size="16" /></span>
            <span class="ft">
              <b>{{ f.title }}</b>
              <span>{{ f.text }}</span>
            </span>
          </li>
        </ul>
      </div>

      <p class="legal">
        © 2026 Migratsiya agentligi · Ma’lumotlar “Shaxsga doir ma’lumotlar
        to‘g‘risida”gi qonun talablariga muvofiq qayta ishlanadi.
      </p>
    </section>

    <!-- ========================================================= o'ng panel -->
    <section class="pane">
      <form class="card" @submit.prevent="submit">
        <span class="cardTop" aria-hidden="true" />

        <span class="lock"><AppIcon name="shield" :size="19" /></span>
        <h2>Tizimga kirish</h2>
        <p class="sub">Vakolatingizga mos bo‘lim va ma’lumotlar ko‘rsatiladi.</p>

        <label class="fld">
          <span class="lb">Login</span>
          <span class="wrap">
            <AppIcon name="user" :size="16" />
            <input v-model="login" autocomplete="username" placeholder="admin.root" />
          </span>
        </label>

        <label class="fld">
          <span class="lb">Parol</span>
          <span class="wrap">
            <AppIcon name="shield" :size="16" />
            <input v-model="password" :type="show ? 'text' : 'password'"
                   autocomplete="current-password" placeholder="••••••••" />
            <button type="button" class="eye" :aria-label="show ? 'Yashirish' : 'Ko‘rsatish'"
                    @click="show = !show">
              <AppIcon :name="show ? 'eyeOff' : 'eye'" :size="16" />
            </button>
          </span>
        </label>

        <div class="row">
          <label class="chk">
            <input v-model="remember" type="checkbox" />
            <span class="box"><AppIcon name="check" :size="11" /></span>
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

        <button type="button" class="alt">
          <AppIcon name="stamp" :size="16" /> E-IMZO kaliti bilan kirish
        </button>

        <!-- Demo hisoblar — yig'iladigan blok -->
        <div class="demo" :class="{ on: demoOpen }">
          <button type="button" class="dt" :aria-expanded="demoOpen" @click="demoOpen = !demoOpen">
            <AppIcon name="spark" :size="14" />
            Demo hisob bilan sinab ko‘rish
            <AppIcon name="chevron" :size="13" class="dc" />
          </button>
          <Transition name="fold">
            <div v-if="demoOpen" class="dl">
              <button v-for="u in demoUsers" :key="u.login" type="button" class="du"
                      @click="useDemo(u)">
                <b class="num">{{ u.login }}</b>
                <span>{{ u.role }}</span>
              </button>
              <p class="dp">Barcha demo hisoblarda parol — <b class="num">demo</b></p>
            </div>
          </Transition>
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
.blob { position: absolute; border-radius: 50%; filter: blur(130px); opacity: calc(var(--glow-op) * 0.6); }
.b1 { width: 42vw; height: 42vw; top: -14vw; left: -8vw; background: var(--turk); animation: drift 28s var(--ease-in-out) infinite; }
.b2 { width: 34vw; height: 34vw; bottom: -16vw; left: 18vw; background: var(--lapis); animation: drift 34s var(--ease-in-out) infinite reverse; }
.b3 { width: 30vw; height: 30vw; top: 26vh; right: -10vw; background: var(--violet); animation: drift 40s var(--ease-in-out) infinite; }
.mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(var(--mist-rgb), 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--mist-rgb), 0.05) 1px, transparent 1px);
  background-size: 58px 58px;
  mask-image: radial-gradient(ellipse 70% 70% at 18% 24%, #000 15%, transparent 72%);
}
.orbit {
  position: absolute;
  left: -8vw;
  top: 50%;
  width: 64vw;
  height: 64vw;
  color: rgba(var(--mist-rgb), 0.22);
  transform: translateY(-50%);
  animation: spin 120s linear infinite;
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

/* --------------------------------------------------------- chap panel */
.side {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 44px 56px;
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

.pitch { margin: auto 0; }
.tagline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 5px 13px 5px 9px;
  border-radius: 99px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-family: var(--font-data);
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--mist);
  animation: rise 0.7s var(--ease-out) backwards;
}
.tagline i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--turk);
  box-shadow: 0 0 0 3px rgba(var(--turk-rgb), 0.18);
}

.pitch h1 {
  font-size: clamp(30px, 3.7vw, 48px);
  line-height: 1.08;
  letter-spacing: -0.035em;
  animation: rise 0.8s var(--ease-out) 0.05s backwards;
}
.pitch h1 em {
  font-style: normal;
  background: linear-gradient(100deg, var(--turk), var(--lapis) 70%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.lead {
  max-width: 44ch;
  margin: 18px 0 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--mist);
  animation: rise 0.8s var(--ease-out) 0.12s backwards;
}

.feats {
  list-style: none;
  display: grid;
  gap: 4px;
  margin: 32px 0 0;
  padding: 0;
  max-width: 44ch;
}
.feats li {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 12px 12px 12px 10px;
  border-radius: 13px;
  border: 1px solid transparent;
  transition: border-color 0.35s var(--ease-out), background 0.35s var(--ease-out);
  animation: rise 0.7s var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 100ms + 220ms);
}
.feats li:hover { border-color: var(--line); background: var(--surface); }
.fi {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgba(var(--turk-rgb), 0.08);
  color: var(--turk);
}
.ft { display: grid; gap: 3px; min-width: 0; }
.ft b { font-size: 13px; font-weight: 500; }
.ft span { font-size: 12px; line-height: 1.55; color: var(--mist-dim); }

.legal { margin: 0; font-size: 11px; line-height: 1.65; color: var(--mist-dim); max-width: 54ch; }

/* --------------------------------------------------------- o'ng panel */
.pane {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 44px 32px;
}

.card {
  position: relative;
  width: min(410px, 100%);
  padding: 34px 32px 28px;
  border-radius: var(--r-xl);
  border: 1px solid var(--line-strong);
  background: var(--panel-grad);
  backdrop-filter: blur(20px);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
  animation: rise 0.75s var(--ease-out) 0.1s backwards;
}
.cardTop {
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--turk), var(--lapis), transparent);
  opacity: 0.85;
}

.lock {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 16px;
  border-radius: 13px;
  border: 1px solid var(--line-strong);
  background: rgba(var(--turk-rgb), 0.09);
  color: var(--turk);
}
.card h2 { font-size: 26px; letter-spacing: -0.025em; }
.sub { margin: 8px 0 26px; font-size: 12.5px; line-height: 1.6; color: var(--mist); }

.fld { display: block; margin-bottom: 14px; }
.lb { display: block; margin-bottom: 6px; font-size: 11.5px; color: var(--mist-dim); }
.wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border-radius: 12px;
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

.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 6px 0 20px; }
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
html[data-theme='light'] .chk input:checked + .box { color: #fff; }
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
.go:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px -14px rgba(var(--turk-rgb), 0.75); }
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

.alt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  font-size: 13px;
  color: var(--mist);
  transition: all 0.3s var(--ease-out);
}
.alt:hover { color: var(--lapis); border-color: var(--lapis); background: var(--lapis-dim); }

/* demo hisoblar */
.demo { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--line); }
.dt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  color: var(--mist-dim);
  transition: color 0.3s ease;
}
.dt:hover { color: var(--turk); }
.dc { margin-left: auto; transform: rotate(90deg); transition: transform 0.35s var(--ease-out); }
.demo.on .dc { transform: rotate(-90deg); }

.dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; padding-top: 12px; }
.du {
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  text-align: left;
  transition: all 0.3s var(--ease-out);
}
.du b { font-size: 11px; color: var(--mist); }
.du span { font-size: 10px; color: var(--mist-dim); }
.du:hover { border-color: var(--turk); background: var(--turk-dim); }
.du:hover b { color: var(--turk); }
.dp { grid-column: 1 / -1; margin: 4px 0 0; font-size: 11px; color: var(--mist-dim); }

.fold-enter-active, .fold-leave-active { transition: all 0.35s var(--ease-out); overflow: hidden; }
.fold-enter-from, .fold-leave-to { opacity: 0; transform: translateY(-6px); max-height: 0; padding-top: 0; }
.fold-enter-to, .fold-leave-from { max-height: 220px; }

/* --------------------------------------------------------------- mobil */
@media (max-width: 980px) {
  .auth { grid-template-columns: 1fr; }
  .side { display: none; }
  .pane { padding: 28px 18px; }
  .card { padding: 28px 22px 24px; }
}
</style>
