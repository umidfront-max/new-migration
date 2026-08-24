import { reactive, computed, readonly } from 'vue'

const state = reactive({
  period: '12m',
  region: 'all',
  country: null, // FlowMap dan tanlangan davlat kodi
  railOpen: true,
  liveSos: true,
})

export const periods = [
  { id: '30d', label: '30 kun' },
  { id: '90d', label: '90 kun' },
  { id: '12m', label: '12 oy' },
  { id: 'all', label: 'Butun davr' },
]

export function useApp() {
  return {
    state: readonly(state),
    period: computed(() => state.period),
    setPeriod: (p) => (state.period = p),
    setRegion: (r) => (state.region = r),
    country: computed(() => state.country),
    selectCountry: (code) => (state.country = state.country === code ? null : code),
    railOpen: computed(() => state.railOpen),
    toggleRail: () => (state.railOpen = !state.railOpen),
    liveSos: computed(() => state.liveSos),
    toggleLive: () => (state.liveSos = !state.liveSos),
  }
}
