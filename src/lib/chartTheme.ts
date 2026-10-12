import { useApp } from '@/state/AppState'

/** Recharts needs concrete colours; these mirror the CSS tokens in index.css. */
const LIGHT = {
  primary: '#1E4D3B',
  primarySoft: '#9DBFAE',
  accent: '#C8F24A',
  grid: '#E5E1D8',
  axis: '#6C736E',
  ink: '#161A17',
  surface: '#FFFFFF',
  warning: '#9C5A08',
  danger: '#B93228',
}

const DARK = {
  primary: '#96D6B4',
  primarySoft: '#3C6B57',
  accent: '#C8F24A',
  grid: '#303532',
  axis: '#8A918C',
  ink: '#EDEEEA',
  surface: '#1B1E1C',
  warning: '#F0B860',
  danger: '#FA8C80',
}

export function useChartTheme() {
  const { resolvedTheme } = useApp()
  return resolvedTheme === 'dark' ? DARK : LIGHT
}
