const PATHS = {
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z M12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z',
  chevronDown: 'm6 9 6 6 6-6',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z m5-2 4.5 4.5',
  bag: 'M6 8h12l-1 12H7L6 8Z M9 8V6.5a3 3 0 0 1 6 0V8',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4.5 20a7.5 7.5 0 0 1 15 0',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  x: 'M6 6l12 12 M18 6 6 18',
  sparkle: 'M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z',
  leaf: 'M5 19c0-9 5-14 15-14 0 10-5 15-14 15 M5 19c3-4 6-7 10-9',
  flame: 'M12 21a6 6 0 0 0 6-6c0-4-3-6-3-10-2 1-4 3-4 6-1-1-1.5-2-1.5-3C7 10 6 12.5 6 15a6 6 0 0 0 6 6Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  scooter: 'M6 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M18 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M8.5 15.5h7 M15 5h2l2 10 M4 9h6v4',
  store: 'M4 10v10h16V10 M3 6l1.5-3h15L21 6v1.5a2.5 2.5 0 0 1-4.5 1.5 2.5 2.5 0 0 1-4.5 0 2.5 2.5 0 0 1-4.5 0A2.5 2.5 0 0 1 3 7.5V6Z M10 20v-5h4v5',
  tag: 'M3 12V4h8l10 10-8 8L3 12Z M7.5 8.5h.01',
  check: 'm5 12.5 4.5 4.5L19 7',
  trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4Z M13.5 6.5l4 4',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  shield: 'M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z m-3 9 2 2 4-4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01',
  wifiOff:
    'M3 3l18 18 M8.5 16.5a5 5 0 0 1 7 0 M5 12.5a10 10 0 0 1 5.5-2.8 M19 12.5a10 10 0 0 0-2.4-1.7 M2 8.8a15 15 0 0 1 4.5-2.9 M22 8.8A15 15 0 0 0 11 5 M12 20h.01',
  arrowLeft: 'M19 12H5 m6-6-6 6 6 6',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  repeat: 'M17 2l4 4-4 4 M3 11V9a3 3 0 0 1 3-3h15 M7 22l-4-4 4-4 M21 13v2a3 3 0 0 1-3 3H3',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7 M12 17h.01',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 8h6 M9 12h6',
  card: 'M3 6h18v12H3z M3 10h18 M7 15h3',
  pizza: 'M12 3 3.5 19c5.4 2 11.6 2 17 0L12 3Z M5.6 15.2c4.2 1.3 8.6 1.3 12.8 0 M10 10.5h.01 M13.5 13h.01 M10.5 15.5h.01',
  cash: 'M3 7h18v10H3z M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z M6 10v4 M18 10v4',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
