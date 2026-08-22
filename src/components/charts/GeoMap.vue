<script setup>
/**
 * Haqiqiy GIS xarita (Leaflet).
 * Uch qatlam: migratsiya oqimlari, SOS lokatsiyalari, ichki hududlar.
 * Yoylar Toshkentdan yo'nalish shahriga kvadratik egri sifatida chiziladi,
 * ular bo'ylab zarrachalar harakatlanadi.
 */
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fmt, short } from '@/composables/useCountUp'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useTheme } from '@/stores/theme'

const { theme } = useTheme()

const props = defineProps({
  countries: { type: Array, required: true },
  regions: { type: Array, default: () => [] },
  sos: { type: Array, default: () => [] },
  origin: { type: Object, required: true },
  selected: { type: String, default: null },
  height: { type: String, default: '560px' },
})
const emit = defineEmits(['select'])

/* Plitka manbai — o'z serveringizga ko'chirish uchun shu ikki qatorni almashtiring.
   Mavzuga qarab qorong'i yoki yorug' asos tanlanadi. */
const tileUrl = (t) =>
  `https://{s}.basemaps.cartocdn.com/${t === 'light' ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png`
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const host = ref(null)
const map = shallowRef(null)
const layers = shallowRef({})
const arcRefs = shallowRef([])
const dotRefs = shallowRef([])
let raf = null

const show = ref({ flows: true, sos: true, regions: false })
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const toneOf = (risk) =>
  risk >= 60 ? '#ff5c72' : risk >= 40 ? '#f5a524' : '#35e0c8'

/* --- Toshkentdan yo'nalishgacha egri yoy nuqtalari ---
   Boshqaruv nuqtasi har doim shimolga suriladi, shunda yoylar
   haqiqiy aviamarshrutlar kabi yuqoriga egiladi. */
function arcPoints(a, b, bend = 0.2, n = 64) {
  const mx = (a.lng + b.lng) / 2
  const my = (a.lat + b.lat) / 2
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  // Perpendikulyar; shimolga qaratamiz
  let px = -dy
  let py = dx
  if (py < 0) {
    px = -px
    py = -py
  }
  const cx = mx + px * bend
  const cy = my + py * bend
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([
      u * u * a.lat + 2 * u * t * cy + t * t * b.lat,
      u * u * a.lng + 2 * u * t * cx + t * t * b.lng,
    ])
  }
  return pts
}

function buildFlows() {
  const g = L.layerGroup()
  const maxTotal = Math.max(...props.countries.map((c) => c.total))
  const arcs = []
  const dots = []

  props.countries.forEach((c) => {
    const pts = arcPoints(props.origin, c)
    const tone = toneOf(c.risk)
    const weight = 1.2 + (c.total / maxTotal) * 7

    const arc = L.polyline(pts, {
      color: tone,
      weight,
      opacity: 0.55,
      className: 'gm-arc',
      interactive: false,
    }).addTo(g)

    const radius = 5 + Math.sqrt(c.total / maxTotal) * 17
    const node = L.circleMarker([c.lat, c.lng], {
      radius,
      color: tone,
      weight: 1.6,
      fillColor: tone,
      fillOpacity: 0.28,
      className: 'gm-node',
    })
      .addTo(g)
      .bindTooltip(
        `<b>${c.flag} ${c.name}</b><span class="gm-hub">${c.hub}</span>
         <i>Jami</i><b>${fmt(c.total)}</b>
         <i>Chiqqan</i><b>${fmt(c.out)}</b>
         <i>Qaytgan</i><b>${fmt(c.back)}</b>
         <i>Qidiruvda</i><b>${fmt(c.wanted)}</b>
         <i>Jo‘natma</i><b>${fmt(c.remit)} mln $</b>
         <i>Xavf</i><b style="color:${tone}">${c.risk}</b>`,
        { className: 'gm-tip', direction: 'auto', offset: [radius + 8, 0], sticky: false },
      )
      .on('click', () => emit('select', c.code))

    const label = L.marker([c.lat, c.lng], {
      icon: L.divIcon({
        className: 'gm-label-wrap',
        html: `<span class="gm-label">${c.name}<b>${short(c.total)}</b></span>`,
        iconSize: [0, 0],
        iconAnchor: [-radius - 6, 8],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(g)

    if (!reduced()) {
      const dot = L.circleMarker(pts[0], {
        radius: Math.max(2.4, weight * 0.45),
        color: tone,
        fillColor: tone,
        fillOpacity: 1,
        weight: 0,
        interactive: false,
        className: 'gm-dot',
      }).addTo(g)
      dots.push({ dot, pts, speed: 0.0022 + 0.0015 * (1 - c.dist / 11000), t: Math.random() })
    }

    arcs.push({ code: c.code, arc, node, label, tone, weight, radius, total: c.total, ll: L.latLng(c.lat, c.lng), name: c.name })
  })

  // Muhimlik tartibida — yiriklari birinchi bo'lib joy oladi
  arcs.sort((a, b) => b.total - a.total)
  arcRefs.value = arcs
  dotRefs.value = dots
  return g
}

/**
 * Yorliqlarni ekran koordinatalarida tekshirib, ustma-ust tushadiganlarini
 * yashiradi. Yiriklari ustunlikka ega; zoom oshganda barchasi ochiladi.
 */
function declutter() {
  const m = map.value
  if (!m) return
  const taken = []
  const hit = (r) =>
    taken.some((t) => r.x2 > t.x1 && r.x1 < t.x2 && r.y2 > t.y1 && r.y1 < t.y2)

  arcRefs.value.forEach((a) => {
    const el = a.label.getElement()
    if (!el) return
    if (props.selected && a.code !== props.selected) {
      el.style.opacity = '0'
      return
    }
    const p = m.latLngToContainerPoint(a.ll)
    const w = a.name.length * 6.2 + 14
    const box = {
      x1: p.x + a.radius + 4,
      x2: p.x + a.radius + 4 + w,
      y1: p.y - 6,
      y2: p.y + 22,
    }
    if (hit(box)) {
      el.style.opacity = '0'
    } else {
      el.style.opacity = '1'
      taken.push(box)
    }
  })
}

function buildSos() {
  const g = L.layerGroup()
  const sev = { critical: '#a97bf5', high: '#ff5c72', mid: '#f5a524', low: '#35e0c8' }
  props.sos.forEach((e) => {
    L.marker([e.lat, e.lng], {
      icon: L.divIcon({
        className: 'gm-sos-wrap',
        html: `<span class="gm-sos" style="--c:${sev[e.severity]}"><i></i></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      }),
    })
      .addTo(g)
      .bindTooltip(
        `<b>${e.type}</b><span class="gm-hub">${e.flag} ${e.city}, ${e.country}</span>
         <i>Murojaat</i><b>${e.id}</b>
         <i>Telefon</i><b>${e.phone}</b>`,
        { className: 'gm-tip', direction: 'auto', offset: [10, 0] },
      )
  })
  return g
}

function buildRegions() {
  const g = L.layerGroup()
  const maxOut = Math.max(...props.regions.map((r) => r.out))
  props.regions.forEach((r) => {
    const tone = toneOf(r.risk)
    const radius = 4 + Math.sqrt(r.out / maxOut) * 12
    L.circleMarker([r.lat, r.lng], {
      radius,
      color: tone,
      weight: 1.4,
      fillColor: tone,
      fillOpacity: 0.22,
      className: 'gm-node',
    })
      .addTo(g)
      .bindTooltip(
        `<b>${r.name}</b>
         <i>Chiqqan</i><b>${fmt(r.out)}</b>
         <i>Qaytgan</i><b>${fmt(r.back)}</b>
         <i>Xavf</i><b style="color:${tone}">${r.risk}</b>`,
        { className: 'gm-tip', direction: 'auto', offset: [10, 0] },
      )

    L.marker([r.lat, r.lng], {
      icon: L.divIcon({
        className: 'gm-label-wrap',
        html: `<span class="gm-label gm-label-sm">${r.name}<b>${short(r.out)}</b></span>`,
        iconSize: [0, 0],
        iconAnchor: [-radius - 5, 7],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(g)
  })
  return g
}

/* --- Zarrachalarni yoy bo'ylab yurgizish --- */
function tick() {
  dotRefs.value.forEach((d) => {
    d.t += d.speed
    if (d.t > 1) d.t -= 1
    const i = Math.min(d.pts.length - 1, Math.floor(d.t * (d.pts.length - 1)))
    d.dot.setLatLng(d.pts[i])
    // Boshi va oxirida so'nadi
    const fade = Math.min(1, Math.sin(d.t * Math.PI) * 1.8)
    d.dot.setStyle({ fillOpacity: fade })
  })
  raf = requestAnimationFrame(tick)
}

/* --- Tanlangan yo'nalishni ajratib ko'rsatish --- */
watch(
  () => props.selected,
  (code) => {
    arcRefs.value.forEach((a) => {
      const on = !code || a.code === code
      a.arc.setStyle({ opacity: on ? (code ? 1 : 0.55) : 0.1, weight: a.code === code ? a.weight + 2 : a.weight })
      a.node.setStyle({ fillOpacity: on ? 0.28 : 0.06, opacity: on ? 1 : 0.15 })
    })
    declutter()
    if (code && map.value) {
      const c = props.countries.find((x) => x.code === code)
      if (c) map.value.flyToBounds(L.latLngBounds([[props.origin.lat, props.origin.lng], [c.lat, c.lng]]), {
        padding: [80, 80], duration: 1.1, maxZoom: 6,
      })
    }
  },
)

function toggle(key) {
  show.value[key] = !show.value[key]
  const l = layers.value[key]
  if (!l || !map.value) return
  show.value[key] ? l.addTo(map.value) : map.value.removeLayer(l)

  // Ichki hududlar dunyo miqyosida bir nuqtaga tiqiladi — mamlakatga yaqinlashamiz
  if (key === 'regions' && show.value.regions && props.regions.length) {
    map.value.flyToBounds(L.latLngBounds(props.regions.map((r) => [r.lat, r.lng])), {
      padding: [60, 60], duration: 1.2, maxZoom: 7,
    })
  }
}

function resetView() {
  emit('select', null)
  map.value?.flyTo([44, 62], 3, { duration: 1 })
}

onMounted(() => {
  const m = L.map(host.value, {
    center: [44, 62],
    zoom: 3,
    minZoom: 2,
    maxZoom: 12,
    zoomControl: false,
    attributionControl: true,
    worldCopyJump: true,
    scrollWheelZoom: 'center',
  })
  layers.value.tiles = L.tileLayer(tileUrl(theme.value), {
    attribution: TILE_ATTR, subdomains: 'abcd', maxZoom: 20,
  }).addTo(m)
  L.control.zoom({ position: 'bottomright' }).addTo(m)

  // Markaz — Toshkent
  L.circleMarker([props.origin.lat, props.origin.lng], {
    radius: 7,
    color: '#35e0c8',
    weight: 2,
    fillColor: theme.value === 'light' ? '#ffffff' : '#060c18',
    fillOpacity: 1,
    className: 'gm-origin',
  })
    .addTo(m)
    .bindTooltip('<b>Toshkent</b><span class="gm-hub">Barcha oqimlarning boshlanish nuqtasi</span>', {
      className: 'gm-tip', direction: 'auto', offset: [11, 0],
    })

  layers.value = { flows: buildFlows(), sos: buildSos(), regions: buildRegions() }
  layers.value.flows.addTo(m)
  layers.value.sos.addTo(m)

  map.value = m
  m.on('zoomend moveend', declutter)
  requestAnimationFrame(declutter)
  if (!reduced()) raf = requestAnimationFrame(tick)
})

/* Mavzu almashsa — asos qatlami ham almashadi */
watch(theme, (t) => {
  if (layers.value.tiles) layers.value.tiles.setUrl(tileUrl(t))
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  map.value?.remove()
})
</script>

<template>
  <div class="geo" :style="{ '--h': height }">
    <div ref="host" class="canvas" />

    <div class="panel">
      <p class="eyebrow">Qatlamlar</p>
      <button v-for="l in [
        { k: 'flows', t: 'Migratsiya oqimlari', s: 'Oqimlar', c: 'var(--turk)' },
        { k: 'sos', t: 'SOS lokatsiyalari', s: 'SOS', c: 'var(--coral)' },
        { k: 'regions', t: 'Ichki hududlar', s: 'Hududlar', c: 'var(--lapis)' },
      ]" :key="l.k" class="lyr" :class="{ on: show[l.k] }" @click="toggle(l.k)">
        <span class="box" :style="{ '--c': l.c }"><AppIcon v-if="show[l.k]" name="shield" :size="10" /></span>
        <span class="full">{{ l.t }}</span>
        <span class="mini">{{ l.s }}</span>
      </button>

      <button class="reset" @click="resetView" aria-label="Ko‘rinishni tiklash">
        <AppIcon name="globe" :size="13" /> <span class="full">Ko‘rinishni tiklash</span>
      </button>
    </div>

    <div class="legend">
      <span><i style="background: #35e0c8" />Past xavf</span>
      <span><i style="background: #f5a524" />O‘rta</span>
      <span><i style="background: #ff5c72" />Yuqori</span>
      <span class="sep">Aylana o‘lchami — migrantlar soni</span>
    </div>
  </div>
</template>

<style scoped>
.geo {
  position: relative;
  border-radius: var(--r-md);
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--ink-900);
}

.canvas {
  width: 100%;
  height: var(--h);
  background: var(--ink-900);
}

/* Qatlam boshqaruvi */
.panel {
  position: absolute;
  z-index: 500;
  left: 14px;
  top: 14px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line-strong);
  background: rgba(var(--deep-rgb), 0.9);
  backdrop-filter: blur(14px);
  box-shadow: var(--shadow-lift);
  animation: rise 0.6s var(--ease-out) 0.2s backwards;
}
.panel .eyebrow { margin: 0 0 9px; }

.lyr {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 5px 0;
  font-size: 12.5px;
  color: var(--mist-dim);
  transition: color 0.25s ease;
}
.lyr:hover { color: var(--snow); }
.lyr.on { color: var(--snow); }

.box {
  display: grid;
  place-items: center;
  width: 15px;
  height: 15px;
  border-radius: 4px;
  border: 1px solid var(--c);
  color: var(--ink-900);
  transition: background 0.25s var(--ease-out);
}
.lyr.on .box { background: var(--c); }

.reset {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-top: 11px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
  font-size: 12px;
  color: var(--mist-dim);
  transition: color 0.25s ease;
}
.reset:hover { color: var(--turk); }

/* Izoh */
.legend {
  position: absolute;
  z-index: 500;
  left: 14px;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 13px;
  border-radius: 99px;
  border: 1px solid var(--line);
  background: rgba(var(--deep-rgb), 0.9);
  backdrop-filter: blur(14px);
  font-size: 11.5px;
  color: var(--mist);
}
.legend span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.legend i { width: 8px; height: 8px; border-radius: 50%; }
.sep {
  padding-left: 15px;
  border-left: 1px solid var(--line);
  color: var(--mist-dim);
}

.mini { display: none; }

@media (max-width: 720px) {
  .legend { display: none; }
  .canvas { height: 420px; }
  .panel {
    left: 10px;
    right: 10px;
    top: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 11px;
    border-radius: 99px;
  }
  .panel .eyebrow { display: none; }
  .lyr { width: auto; padding: 0; font-size: 11.5px; gap: 6px; }
  .full { display: none; }
  .mini { display: inline; }
  .reset {
    width: auto;
    margin: 0 0 0 auto;
    padding: 0 0 0 11px;
    border-top: none;
    border-left: 1px solid var(--line);
  }
}
</style>

<!-- Leaflet o'zi yaratgan elementlar uchun — scoped emas -->
<style>
.leaflet-container {
  background: var(--ink-900);
  font-family: var(--font-body);
  outline: none;
}

/* Oqim yoylari — chiziqli harakat */
.gm-arc {
  stroke-dasharray: 5 11;
  animation: gm-flow 1.9s linear infinite;
  transition: opacity 0.4s var(--ease-out), stroke-width 0.4s var(--ease-out);
}
@keyframes gm-flow {
  to { stroke-dashoffset: -32; }
}

.gm-node {
  cursor: pointer;
  transition: fill-opacity 0.35s ease, opacity 0.35s ease;
}
.gm-node:hover { fill-opacity: 0.55 !important; }
.gm-node:focus-visible,
.leaflet-container path:focus {
  outline: 2px solid #35e0c8;
  outline-offset: 3px;
  border-radius: 50%;
}
.leaflet-container path:focus:not(:focus-visible) { outline: none; }

.gm-origin {
  animation: gm-pulse 3s var(--ease-in-out) infinite;
  transform-origin: center;
}
@keyframes gm-pulse {
  0%, 100% { stroke-opacity: 1; }
  50% { stroke-opacity: 0.35; }
}

.gm-dot { pointer-events: none; }

/* Davlat yorlig'i */
.gm-label {
  display: inline-flex;
  flex-direction: column;
  white-space: nowrap;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--snow);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.9);
  transition: opacity 0.35s ease;
}
.gm-label-sm { font-size: 10.5px; }
.gm-label-sm b { font-size: 9px; }

.gm-label b {
  font-family: var(--font-data);
  font-size: 10px;
  font-weight: 400;
  color: var(--mist);
}

/* SOS nuqtasi */
.gm-sos {
  position: relative;
  display: block;
  width: 14px;
  height: 14px;
}
.gm-sos i {
  position: absolute;
  left: 4px;
  top: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c);
}
.gm-sos::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--c);
  animation: pulse-ring 2.4s var(--ease-out) infinite;
}

/* Tooltip */
.leaflet-tooltip.gm-tip {
  padding: 11px 13px;
  border-radius: 12px;
  border: 1px solid rgba(var(--mist-rgb), 0.28);
  background: rgba(var(--deep-rgb), 0.96);
  color: var(--snow);
  box-shadow: 0 22px 50px -24px rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(12px);
  display: grid;
  grid-template-columns: auto auto;
  gap: 3px 16px;
  font-size: 12px;
  white-space: nowrap;
}
.gm-tip b:first-child,
.gm-tip > b:first-of-type {
  grid-column: 1 / -1;
  font-family: var(--font-display);
  font-size: 14px;
}
.gm-tip .gm-hub {
  grid-column: 1 / -1;
  margin-bottom: 5px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(var(--mist-rgb), 0.16);
  font-size: 11px;
  color: var(--mist-dim);
}
.gm-tip i {
  font-style: normal;
  font-size: 11px;
  color: var(--mist);
}
.gm-tip b {
  font-family: var(--font-data);
  font-size: 12px;
  font-weight: 500;
  text-align: right;
}
.leaflet-tooltip.gm-tip::before { display: none; }

/* Boshqaruv tugmalari */
.leaflet-control-zoom a {
  width: 30px;
  height: 30px;
  line-height: 29px;
  color: var(--mist);
  background: rgba(var(--deep-rgb), 0.9);
  border: 1px solid rgba(var(--mist-rgb), 0.14);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.25s ease;
}
.leaflet-control-zoom a:hover {
  color: #35e0c8;
  border-color: #35e0c8;
  background: rgba(var(--deep-rgb), 0.95);
}
.leaflet-control-zoom { border: none !important; }
.leaflet-bar a:first-child { margin-bottom: 5px; }

.leaflet-control-attribution {
  background: rgba(var(--deep-rgb), 0.82) !important;
  color: var(--mist-dim) !important;
  font-size: 10px !important;
  padding: 2px 7px;
  border-radius: 7px 0 0 0;
}
.leaflet-control-attribution a { color: var(--mist) !important; }

@media (prefers-reduced-motion: reduce) {
  .gm-arc { animation: none; stroke-dasharray: none; }
  .gm-sos::after { animation: none; }
}
</style>
