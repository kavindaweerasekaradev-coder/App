export interface Store {
  id: string
  area: string
  city: string
  address: string
  deliveryMins: [number, number]
  pickupMins: [number, number]
  lat: number
  lng: number
}

// Placeholder contact number for the concept; confirm before going live.
export const HOTLINE = '+94 11 777 7888'

export const STORES: Store[] = [
  {
    id: 'col-03',
    area: 'Kollupitiya',
    city: 'Colombo 03',
    address: '312 Galle Road, Colombo 03',
    deliveryMins: [25, 35],
    pickupMins: [15, 20],
    lat: 6.9,
    lng: 79.852,
  },
  {
    id: 'col-05',
    area: 'Havelock Town',
    city: 'Colombo 05',
    address: '74 Havelock Road, Colombo 05',
    deliveryMins: [25, 35],
    pickupMins: [15, 20],
    lat: 6.879,
    lng: 79.865,
  },
  {
    id: 'col-07',
    area: 'Cinnamon Gardens',
    city: 'Colombo 07',
    address: '18 Ward Place, Colombo 07',
    deliveryMins: [30, 40],
    pickupMins: [15, 20],
    lat: 6.912,
    lng: 79.866,
  },
  {
    id: 'dehiwala',
    area: 'Dehiwala',
    city: 'Dehiwala',
    address: '120 Galle Road, Dehiwala',
    deliveryMins: [30, 40],
    pickupMins: [15, 20],
    lat: 6.851,
    lng: 79.865,
  },
  {
    id: 'mt-lavinia',
    area: 'Mount Lavinia',
    city: 'Mount Lavinia',
    address: '45 Hotel Road, Mount Lavinia',
    deliveryMins: [30, 40],
    pickupMins: [15, 20],
    lat: 6.838,
    lng: 79.863,
  },
  {
    id: 'nugegoda',
    area: 'Nugegoda',
    city: 'Nugegoda',
    address: '88 High Level Road, Nugegoda',
    deliveryMins: [30, 40],
    pickupMins: [15, 25],
    lat: 6.872,
    lng: 79.889,
  },
  {
    id: 'rajagiriya',
    area: 'Rajagiriya',
    city: 'Rajagiriya',
    address: '210 Parliament Road, Rajagiriya',
    deliveryMins: [30, 40],
    pickupMins: [15, 20],
    lat: 6.909,
    lng: 79.894,
  },
  {
    id: 'battaramulla',
    area: 'Battaramulla',
    city: 'Battaramulla',
    address: '15 Pannipitiya Road, Battaramulla',
    deliveryMins: [35, 45],
    pickupMins: [15, 20],
    lat: 6.899,
    lng: 79.918,
  },
  {
    id: 'maharagama',
    area: 'Maharagama',
    city: 'Maharagama',
    address: '102 High Level Road, Maharagama',
    deliveryMins: [35, 45],
    pickupMins: [15, 25],
    lat: 6.848,
    lng: 79.926,
  },
  {
    id: 'negombo',
    area: 'Negombo',
    city: 'Negombo',
    address: '56 Lewis Place, Negombo',
    deliveryMins: [30, 40],
    pickupMins: [15, 20],
    lat: 7.209,
    lng: 79.838,
  },
  { id: 'kandy', area: 'Kandy', city: 'Kandy', address: '9 Dalada Veediya, Kandy', deliveryMins: [30, 45], pickupMins: [15, 20], lat: 7.293, lng: 80.635 },
  { id: 'galle', area: 'Galle', city: 'Galle', address: '23 Wakwella Road, Galle', deliveryMins: [30, 45], pickupMins: [15, 20], lat: 6.035, lng: 80.217 },
  {
    id: 'panadura',
    area: 'Panadura',
    city: 'Panadura',
    address: '401 Galle Road, Panadura',
    deliveryMins: [30, 45],
    pickupMins: [15, 20],
    lat: 6.713,
    lng: 79.907,
  },
  {
    id: 'kurunegala',
    area: 'Kurunegala',
    city: 'Kurunegala',
    address: '12 Colombo Road, Kurunegala',
    deliveryMins: [30, 45],
    pickupMins: [15, 20],
    lat: 7.487,
    lng: 80.365,
  },
  {
    id: 'anuradhapura',
    area: 'Anuradhapura',
    city: 'Anuradhapura',
    address: '5 Maithripala Senanayake Mawatha, Anuradhapura',
    deliveryMins: [35, 50],
    pickupMins: [15, 20],
    lat: 8.311,
    lng: 80.403,
  },
]

export const STORE_BY_ID: Record<string, Store> = Object.fromEntries(STORES.map((s) => [s.id, s]))

export function nearestStore(lat: number, lng: number): Store {
  let best = STORES[0]
  let bestD = Infinity
  for (const s of STORES) {
    const d = (s.lat - lat) ** 2 + (s.lng - lng) ** 2
    if (d < bestD) {
      bestD = d
      best = s
    }
  }
  return best
}
