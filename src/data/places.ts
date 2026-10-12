import type { Place } from './types'

/** Real town names with approximate coordinates, used only to lay out the simulated map. */
export const PLACES: Place[] = [
  { id: 'colombo-03', name: 'Colombo 03', subtitle: 'Kollupitiya, Colombo', lat: 6.9055, lng: 79.853 },
  { id: 'colombo-fort', name: 'Colombo Fort', subtitle: 'Colombo', lat: 6.9344, lng: 79.8428, major: true },
  { id: 'rajagiriya', name: 'Rajagiriya', subtitle: 'Colombo District', lat: 6.909, lng: 79.896 },
  { id: 'nugegoda', name: 'Nugegoda', subtitle: 'Colombo District', lat: 6.872, lng: 79.889 },
  { id: 'dehiwala', name: 'Dehiwala', subtitle: 'Colombo District', lat: 6.851, lng: 79.865 },
  { id: 'battaramulla', name: 'Battaramulla', subtitle: 'Colombo District', lat: 6.9, lng: 79.918 },
  { id: 'negombo', name: 'Negombo', subtitle: 'Western Province', lat: 7.2083, lng: 79.8358, major: true },
  { id: 'katunayake', name: 'Katunayake Airport', subtitle: 'Western Province', lat: 7.17, lng: 79.884 },
  { id: 'kandy', name: 'Kandy', subtitle: 'Central Province', lat: 7.2906, lng: 80.6337, major: true },
  { id: 'nuwara-eliya', name: 'Nuwara Eliya', subtitle: 'Central Province', lat: 6.9497, lng: 80.7891, major: true },
  { id: 'ella', name: 'Ella', subtitle: 'Uva Province', lat: 6.8667, lng: 81.0466 },
  { id: 'galle', name: 'Galle', subtitle: 'Southern Province', lat: 6.0329, lng: 80.2168, major: true },
  { id: 'bentota', name: 'Bentota', subtitle: 'Southern Province', lat: 6.421, lng: 79.998 },
  { id: 'mirissa', name: 'Mirissa', subtitle: 'Southern Province', lat: 5.9483, lng: 80.4716 },
  { id: 'matara', name: 'Matara', subtitle: 'Southern Province', lat: 5.9485, lng: 80.5353, major: true },
  { id: 'hambantota', name: 'Hambantota', subtitle: 'Southern Province', lat: 6.1241, lng: 81.1185, major: true },
  { id: 'ratnapura', name: 'Ratnapura', subtitle: 'Sabaragamuwa Province', lat: 6.6828, lng: 80.3992 },
  { id: 'kurunegala', name: 'Kurunegala', subtitle: 'North Western Province', lat: 7.4863, lng: 80.3623, major: true },
  { id: 'dambulla', name: 'Dambulla', subtitle: 'Central Province', lat: 7.86, lng: 80.6517 },
  { id: 'sigiriya', name: 'Sigiriya', subtitle: 'Central Province', lat: 7.957, lng: 80.7603 },
  { id: 'anuradhapura', name: 'Anuradhapura', subtitle: 'North Central Province', lat: 8.3114, lng: 80.4037, major: true },
  { id: 'trincomalee', name: 'Trincomalee', subtitle: 'Eastern Province', lat: 8.5874, lng: 81.2152, major: true },
  { id: 'batticaloa', name: 'Batticaloa', subtitle: 'Eastern Province', lat: 7.731, lng: 81.6747, major: true },
  { id: 'jaffna', name: 'Jaffna', subtitle: 'Northern Province', lat: 9.6615, lng: 80.0255, major: true },
]

export const DEFAULT_LOCATION_ID = 'colombo-03'

export function getPlace(id: string | null | undefined): Place | undefined {
  return PLACES.find((p) => p.id === id)
}
