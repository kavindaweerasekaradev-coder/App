import type { VehicleColor, VehicleModel } from './types'

/** Fictional vehicle catalogue. Specs are illustrative, not from real manufacturers. */
export const VEHICLE_MODELS: VehicleModel[] = [
  {
    id: 'aurora-e5',
    name: 'Aurora E5',
    maker: 'Northline',
    bodyStyle: 'Saloon',
    batteryKwh: 64,
    efficiency: 15.2,
    connectors: ['CCS2', 'Type 2'],
    maxDcKw: 110,
    maxAcKw: 11,
  },
  {
    id: 'kestrel-gt',
    name: 'Kestrel GT',
    maker: 'Halden',
    bodyStyle: 'Grand tourer',
    batteryKwh: 82,
    efficiency: 17.8,
    connectors: ['CCS2', 'Type 2'],
    maxDcKw: 175,
    maxAcKw: 11,
  },
  {
    id: 'mira-compact',
    name: 'Mira Compact',
    maker: 'Sora Motors',
    bodyStyle: 'Hatchback',
    batteryKwh: 40,
    efficiency: 14.0,
    connectors: ['CHAdeMO', 'Type 2'],
    maxDcKw: 50,
    maxAcKw: 6.6,
  },
  {
    id: 'tern-crossover',
    name: 'Tern Crossover',
    maker: 'Northline',
    bodyStyle: 'Crossover',
    batteryKwh: 58,
    efficiency: 16.4,
    connectors: ['CCS2', 'Type 2'],
    maxDcKw: 90,
    maxAcKw: 7.4,
  },
]

export const VEHICLE_COLORS: { id: VehicleColor; label: string; body: string; shade: string }[] = [
  { id: 'graphite', label: 'Graphite', body: '#3A3F3C', shade: '#1F2321' },
  { id: 'pearl', label: 'Pearl', body: '#E9E7E1', shade: '#B9B6AE' },
  { id: 'forest', label: 'Forest', body: '#2A5C47', shade: '#163728' },
  { id: 'sand', label: 'Sand', body: '#CDBE9F', shade: '#9C8C6C' },
]

export function getModel(id: string): VehicleModel {
  return VEHICLE_MODELS.find((m) => m.id === id) ?? VEHICLE_MODELS[0]
}
