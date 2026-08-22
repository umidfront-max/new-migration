# Migratsiya monitoringi — boshqaruv paneli

Mehnat migratsiyasi bo‘yicha yagona monitoring platformasining frontend qismi.
Texnik topshiriqdagi 13 ta funksional modul va 8 ta foydalanuvchi roli asosida qurilgan.

## Texnologiyalar

- **Vue 3** — barcha komponentlar Composition API (`<script setup>`)
- **Vite 6** — dev server va build
- **Vue Router 4** — hash rejimida, sahifalar lazy-load qilinadi
- **Leaflet 1.9** — haqiqiy GIS xarita (faqat `/countries` sahifasida lazy-load qilinadi)
- Boshqa UI yoki grafik kutubxonalar yo‘q — diagrammalar qo‘lda yozilgan SVG,
  shu sababli asosiy bundle ~51 KB (gzip), xarita chunk'i alohida ~48 KB

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ papkasiga yig'adi
npm run preview  # yig'ilgan versiyani ko'rish
```

Node.js 18+ talab qilinadi.

## Struktura

```
src/
├── main.js                  # kirish nuqtasi
├── App.vue                  # root + boot ekrani + route o'tish animatsiyasi
├── router/index.js          # 14 ta route, lazy import
├── data/mock.js             # BARCHA demo ma'lumot shu yerda
├── stores/app.js            # global holat (davr, hudud, tanlangan davlat, rol)
├── composables/
│   ├── useCountUp.js        # raqam animatsiyasi + fmt/short formatlash
│   └── useMotion.js         # useReveal (scroll), useMotionOk (a11y)
├── styles/
│   ├── app.css              # dizayn tokenlari, reset, keyframe'lar
│   └── views.css            # sahifalarda takrorlanadigan uslublar
├── components/
│   ├── layout/AppShell.vue  # yon panel + yuqori panel + fon atmosferasi
│   ├── ui/                  # AppIcon, PanelCard, StatTile, RiskBadge
│   ├── charts/              # GeoMap (Leaflet), FlowMap, AreaTrend,
│   │                        # DonutBreak, BarRank, RiskGauge
│   └── panels/SosFeed.vue   # jonli SOS oqimi
└── views/                   # 14 ta sahifa
```

## Modullar

| Route | Modul |
|---|---|
| `/` | Boshqaruv paneli — KPI, oqim xaritasi, dinamika, SOS, xavf indeksi |
| `/registry` | Yagona migrantlar reyestri — qidiruv, filtrlar, shaxsiy varaqa |
| `/border` | Chegara monitoringi — o‘tkazish punktlari yuklamasi |
| `/countries` | Mamlakatlar GIS xaritasi (Leaflet) va davlatlar kesimi |
| `/employers` | Ish beruvchilar reyestri, rasmiy/norasmiy bandlik |
| `/violations` | Qonunbuzilishlar monitoringi (8 tur) |
| `/sos` | SOS xizmati, Telegram Bot murojaatlari |
| `/consulate` | Konsullik kabineti |
| `/return` | Qaytish monitoringi va reintegratsiya |
| `/risk` | AI Risk Score — model omillari vazni sozlanadi |
| `/ai` | AI Tahlil — tabiiy tilda so‘rov, insaytlar |
| `/admin` | Administrator paneli — rollar, sozlamalar, integratsiyalar |
| `/audit` | Audit va jurnallash |
| `/reports` | Hisobotlar va eksport |

## Backend ulash

Hozircha barcha ma'lumot `src/data/mock.js` faylidan keladi. Real API ga
o'tishda faqat shu fayl o'rniga so'rovlar qo'yiladi — komponentlar
o'zgarmaydi, chunki ularning barchasi ma'lumotni `props` orqali oladi.

Taxminiy endpoint'lar:

```
GET /api/kpi?period=12m&region=all
GET /api/migrants?country=RU&gender=&risk=&page=1
GET /api/countries
GET /api/violations
GET /api/sos/stream          (SSE yoki WebSocket)
GET /api/risk/score
```

`SosFeed.vue` hozir har 7 soniyada yangi murojaat qo'shadi (`setInterval`) —
uni WebSocket ulanishiga almashtirish kifoya.

## Dizayn

Palitra Rishton keramikasidan olingan: chuqur siyoh ko'k fon, firuza asosiy
aksent, za'faron va marjon ogohlantirish ranglari. Barcha ranglar
`src/styles/app.css` dagi CSS o'zgaruvchilarida — bitta joydan boshqariladi.

Shriftlar Google Fonts orqali `index.html` da ulanadi:
Bricolage Grotesque (sarlavha), Inter Tight (matn), JetBrains Mono (raqamlar).
Offline muhitda ishlatish uchun ularni lokal `public/fonts/` ga ko'chirish kerak.

**Asosiy element — "Migratsiya oqimi" xaritasi.** Ikki ko'rinishda:

- **Xarita** (`GeoMap.vue`) — Leaflet asosidagi haqiqiy GIS. Toshkentdan har bir
  yo'nalish shahriga kvadratik egri yoy chiziladi, yoy har doim shimolga egiladi
  (haqiqiy aviamarshrutlar kabi). Yoy bo'ylab zarrachalar harakatlanadi, qalinligi
  migrantlar soniga, rangi xavf indeksiga bog'liq.
- **Sxema** (`FlowMap.vue`) — geografik azimut bo'yicha qurilgan abstrakt diagramma.
  Plitka yuklanmaydigan yopiq tarmoqlarda ham ishlaydi.

Ikkalasi ham `state.country` orqali sahifadagi jadval bilan bog'langan.

### GIS xarita imkoniyatlari

- Uch qatlam: migratsiya oqimlari, SOS lokatsiyalari, ichki hududlar
  (hududlar qatlami yoqilganda xarita avtomatik O'zbekistonga yaqinlashadi)
- Yo'nalishni bosganda xarita Toshkent–manzil oqimiga `flyToBounds` bilan yaqinlashadi
- Yorliqlar ekran koordinatalarida to'qnashuvga tekshiriladi: ustma-ust
  tushadiganlari yashiriladi, yirik oqimlar ustunlikka ega, zoom oshganda barchasi ochiladi
- SOS nuqtalari jiddiylik darajasiga qarab ranglanadi va pulslaydi

### Plitkalarni almashtirish

Standart holatda CARTO dark-matter plitkalari ishlatiladi. Davlat tizimi uchun
plitkalarni o'z serveringizga ko'chirish kerak — `GeoMap.vue` boshidagi ikki
o'zgaruvchini almashtiring:

```js
const TILE_URL = 'https://tile.uz-gov.local/dark/{z}/{x}/{y}.png'
const TILE_ATTR = 'Migratsiya agentligi'
```

Butunlay oflayn muhitda "Sxema" rejimi plitkasiz ishlaydi.

## Animatsiyalar

Sahifa yuklanishi (stagger), SVG yo'llarining chizilishi, raqamlarning
count-up'i, scroll bilan ochilish (IntersectionObserver), route o'tishi,
hover mikro-interaksiyalari, jonli SOS oqimi (`TransitionGroup`).

`prefers-reduced-motion: reduce` to'liq hurmat qilinadi — bunday holatda
barcha animatsiyalar o'chadi, zarrachalar render qilinmaydi.

## Til

Interfeys o'zbek tilida (lotin). Ko'p tilli qilish uchun matnlarni
`vue-i18n` lug'atiga ko'chirish kerak — hozir ular komponentlar ichida.
# new-migration


## Backend bilan ishlash

Ilova barcha ma'lumotni Django API'dan oladi — brauzerda hech narsa saqlanmaydi
(faqat kirish tokeni va mavzu tanlovi).

```bash
# 1. Backend (alohida repozitoriya: new-migration-backend)
cd ../migrant-backend
.venv/Scripts/activate
python manage.py runserver 8000

# 2. Frontend
npm install
npm run dev
```

API manzili `.env` orqali beriladi (`.env.example` dan nusxa oling):

```
VITE_API_URL=http://127.0.0.1:8000/api
```

Kirish: `admin.root` / `demo`. Backend ishlamasa ilova "Serverga ulanib
bo'lmadi" ekranini va qayta urinish tugmasini ko'rsatadi.
