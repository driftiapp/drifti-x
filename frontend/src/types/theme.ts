export type ThemeMode = 'clean' | 'luxe' | 'dark' | 'light';

export const THEME_STYLES = {
  clean: {
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    markerGlow: 'rgba(255, 255, 255, 0.2)',
    accentColor: 'bg-blue-500'
  },
  luxe: {
    mapStyle: 'mapbox://styles/mapbox/streets-v12',
    markerGlow: 'rgba(147, 51, 234, 0.3)',
    accentColor: 'bg-purple-600'
  },
  dark: {
    mapStyle: 'mapbox://styles/mapbox/dark-v11',
    markerGlow: 'rgba(0, 0, 0, 0.3)',
    accentColor: 'bg-gray-800'
  },
  light: {
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    markerGlow: 'rgba(255, 255, 255, 0.2)',
    accentColor: 'bg-white'
  }
} as const; 