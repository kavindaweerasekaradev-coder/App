import { useId } from 'react'
import { VEHICLE_COLORS } from '@/data/vehicles'
import type { VehicleColor } from '@/data/types'
import { cx } from '@/lib/format'

/** Side-profile illustration of a generic electric saloon. Not modelled on any real vehicle. */
export function CarIllustration({ color = 'graphite', charging = false, className }: { color?: VehicleColor; charging?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, '')
  const paint = VEHICLE_COLORS.find((c) => c.id === color) ?? VEHICLE_COLORS[0]

  return (
    <svg viewBox="0 0 360 132" className={cx('w-full', className)} role="img" aria-label={`${paint.label} vehicle illustration${charging ? ', charging' : ''}`}>
      <defs>
        <linearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={paint.body} />
          <stop offset="0.55" stopColor={paint.body} />
          <stop offset="1" stopColor={paint.shade} />
        </linearGradient>
        <linearGradient id={`glass-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2B3633" />
          <stop offset="0.6" stopColor="#151B19" />
          <stop offset="1" stopColor="#0E1211" />
        </linearGradient>
        <radialGradient id={`rim-${uid}`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#C9CECB" />
          <stop offset="1" stopColor="#7D8481" />
        </radialGradient>
        <filter id={`shadow-${uid}`} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx="182" cy="120" rx="158" ry="6" fill="#000" opacity="0.22" filter={`url(#shadow-${uid})`} />

      {/* body */}
      <path
        d="M22 92 C16 80 18 70 30 64 L70 52 C95 40 120 30 150 27 L200 26 C222 27 240 38 262 52 L318 62 C332 65 340 72 341 84 L341 92 L306 92 A34 34 0 0 0 238 92 L114 92 A34 34 0 0 0 46 92 Z"
        fill={`url(#body-${uid})`}
      />
      {/* lower sill shade */}
      <path d="M114 92 L238 92 L236 86 L116 86 Z" fill={paint.shade} opacity="0.55" />
      {/* shoulder highlight */}
      <path d="M36 66 C120 60 240 60 326 68" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" />

      {/* glass */}
      <path d="M96 54 C116 42 134 34 156 32 L197 31 C214 32 230 41 248 53 Z" fill={`url(#glass-${uid})`} />
      <path d="M150 34 L176 34 L160 52 L134 52 Z" fill="#fff" opacity="0.07" />
      <rect x="168" y="31" width="5" height="24" fill={paint.body} />

      {/* panel lines & handles */}
      <path d="M171 57 L169 88 M244 57 L240 84" stroke={paint.shade} strokeOpacity="0.7" strokeWidth="1" fill="none" />
      <rect x="140" y="62" width="16" height="3" rx="1.5" fill={paint.shade} opacity="0.8" />
      <rect x="210" y="62" width="16" height="3" rx="1.5" fill={paint.shade} opacity="0.8" />

      {/* lights */}
      <path d="M318 64.5 L337 70" stroke="#F4F7EE" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 70 L36 65" stroke="#D9473B" strokeWidth="3" strokeLinecap="round" />

      {/* charge port */}
      {charging && (
        <g>
          <circle cx="58" cy="64" r="6" fill="#C8F24A" opacity="0.35" className="origin-[58px_64px] animate-pulse-ring" />
          <circle cx="58" cy="64" r="3.5" fill="#C8F24A" />
        </g>
      )}

      {/* wheels */}
      {[80, 272].map((x) => (
        <g key={x}>
          <circle cx={x} cy="92" r="27" fill="#141716" />
          <circle cx={x} cy="92" r="18" fill={`url(#rim-${uid})`} />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1={x}
              y1={92}
              x2={x + Math.cos((a * Math.PI) / 180) * 16}
              y2={92 + Math.sin((a * Math.PI) / 180) * 16}
              stroke="#3C4240"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}
          <circle cx={x} cy="92" r="5" fill="#2A2F2D" />
        </g>
      ))}
    </svg>
  )
}
