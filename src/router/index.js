import { createRouter, createWebHashHistory } from 'vue-router'
import { isAuthenticated, isSessionLoaded, isSuperAdmin, restoreSession } from '@/stores/auth'

export const routes = [
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { title: 'Tizimga kirish', blank: true, guest: true } },
  { path: '/', component: () => import('../views/DashboardView.vue'), meta: { title: 'Boshqaruv paneli' } },
  { path: '/registry', component: () => import('../views/RegistryView.vue'), meta: { title: 'Migrantlar reyestri' } },
  { path: '/border', component: () => import('../views/BorderView.vue'), meta: { title: 'Chegara monitoringi' } },
  { path: '/countries', component: () => import('../views/CountriesView.vue'), meta: { title: 'Davlatlar xaritasi' } },
  { path: '/employers', component: () => import('../views/EmployersView.vue'), meta: { title: 'Ish beruvchilar' } },
  { path: '/violations', component: () => import('../views/ViolationsView.vue'), meta: { title: 'Qonunbuzilishlar' } },
  { path: '/sos', component: () => import('../views/SosView.vue'), meta: { title: 'SOS xizmati' } },
  { path: '/consulate', component: () => import('../views/ConsulateView.vue'), meta: { title: 'Konsullik kabineti' } },
  { path: '/return', component: () => import('../views/ReturnView.vue'), meta: { title: 'Qaytish monitoringi' } },
  { path: '/risk', component: () => import('../views/RiskView.vue'), meta: { title: 'AI Risk Score' } },
  { path: '/ai', component: () => import('../views/AiView.vue'), meta: { title: 'AI Tahlil' } },
  { path: '/admin', component: () => import('../views/AdminView.vue'), meta: { title: 'Administrator paneli', admin: true } },
  { path: '/users', component: () => import('../views/UsersView.vue'), meta: { title: 'Foydalanuvchilar', admin: true } },
  { path: '/audit', component: () => import('../views/AuditView.vue'), meta: { title: 'Audit va jurnal', admin: true } },
  { path: '/reports', component: () => import('../views/ReportsView.vue'), meta: { title: 'Hisobot va eksport', admin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/* Kirmagan foydalanuvchi faqat /login sahifasini ko'radi,
   `admin: true` sahifalar esa faqat super administratorga ochiq */
router.beforeEach(async (to) => {
  /* Sahifa yangilanganda foydalanuvchi hali yuklanmagan bo'ladi —
     rolni tekshirishdan oldin sessiyani tiklab olamiz */
  if (!isSessionLoaded() && isAuthenticated()) await restoreSession()

  const authed = isAuthenticated()
  if (!authed && !to.meta.guest) return { path: '/login', query: to.fullPath === '/' ? {} : { next: to.fullPath } }
  if (authed && to.meta.guest) return { path: '/' }
  if (to.meta.admin && !isSuperAdmin()) return { path: '/' }
  return true
})

router.afterEach((to) => {
  const t = to.meta?.title
  if (typeof document !== 'undefined') {
    document.title = t ? `${t} · Migratsiya monitoringi` : 'Migratsiya monitoringi'
  }
})

export default router
