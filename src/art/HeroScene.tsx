function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0,0 C2,-30 6,-60 14,-86" stroke="#8C6B4A" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g transform="translate(14 -86)" fill="#6E9A5B">
        <path d="M0,0 C-14,-8 -30,-6 -42,6 C-28,-2 -14,-2 0,0Z" />
        <path d="M0,0 C-8,-16 -22,-24 -36,-22 C-22,-18 -10,-10 0,0Z" />
        <path d="M0,0 C6,-16 20,-24 34,-22 C20,-16 10,-8 0,0Z" />
        <path d="M0,0 C14,-6 30,-2 40,10 C26,2 14,0 0,0Z" />
        <path d="M0,0 C2,-14 0,-26 -6,-34 C2,-24 4,-12 0,0Z" fill="#83AE6E" />
        <circle cx="2" cy="4" r="3" fill="#8C6B4A" />
      </g>
    </g>
  )
}

/** Soft illustrated hillside with a delivery scooter, used behind the hero headline. */
export function HeroScene() {
  return (
    <svg viewBox="0 0 640 360" className="hero-scene" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBF6EC" stopOpacity="0" />
          <stop offset="100%" stopColor="#F3EBDC" />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F7D57E" />
          <stop offset="100%" stopColor="#F2C25B" />
        </radialGradient>
        <filter id="blur2" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="22%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id="fadeMask">
          <rect width="640" height="360" fill="url(#fade)" />
        </mask>
      </defs>
      <g mask="url(#fadeMask)">
        <rect width="640" height="360" fill="url(#sky)" />
        <circle className="hero-scene__sky" cx="430" cy="78" r="30" fill="url(#sun)" opacity=".9" />
        <path
          d="M120,200 C200,130 280,150 340,120 C400,92 470,110 540,80 C590,62 620,70 640,72 L640,360 L120,360Z"
          fill="#DCE3C7"
          opacity=".7"
          filter="url(#blur2)"
        />
        <path d="M60,240 C150,180 240,200 320,170 C410,138 500,170 560,140 C600,122 630,128 640,130 L640,360 L60,360Z" fill="#C3D3A6" />
        {/* tea terraces */}
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M${330 + i * 6},${178 + i * 14} C${420 + i * 4},${150 + i * 14} ${520},${168 + i * 12} ${640},${146 + i * 13}`}
            stroke="#A9C08A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity=".75"
          />
        ))}
        <path d="M0,300 C120,250 230,270 330,240 C440,208 540,236 640,214 L640,360 L0,360Z" fill="#A9C28C" />
        {/* road */}
        <path d="M250,360 C300,320 350,300 420,282 C480,266 540,262 640,250 L640,268 C560,276 500,282 440,296 C380,310 340,330 300,360Z" fill="#EADFC9" />
        <path d="M282,352 C330,318 380,302 430,290 C490,276 560,268 630,260" stroke="#fff" strokeWidth="2" strokeDasharray="10 12" fill="none" opacity=".9" />
        {/* store */}
        <g transform="translate(520 196)">
          <rect x="0" y="10" width="78" height="46" rx="3" fill="#FFF9EE" stroke="#D9CBB2" />
          <path d="M-6,12 L84,12 L76,-6 L2,-6Z" fill="#1F6FA8" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${-6 + i * 15},12 l15,0 l0,7 c0,4 -15,4 -15,0Z`} fill={i % 2 ? '#fff' : '#D63A3F'} />
          ))}
          <rect x="10" y="28" width="22" height="28" rx="2" fill="#E9DCC5" />
          <rect x="42" y="28" width="26" height="16" rx="2" fill="#CFE2EC" />
          <g transform="translate(66 -14)">
            <rect x="-8" y="-8" width="16" height="16" rx="3" fill="#1F6FA8" transform="rotate(20)" />
            <circle cx="-1" cy="-2" r="2" fill="#fff" />
            <circle cx="2.5" cy="2.5" r="2" fill="#fff" />
          </g>
        </g>
        <Palm x={480} y={252} s={1.05} />
        <Palm x={610} y={240} s={0.9} flip />
        <Palm x={420} y={270} s={0.7} flip />
        <Palm x={250} y={262} s={0.75} />
        {/* scooter */}
        <g transform="translate(372 262) rotate(-8)">
          <ellipse cx="22" cy="40" rx="40" ry="5" fill="#6E5A3C" opacity=".18" />
          <circle cx="-4" cy="32" r="10" fill="#2E3440" />
          <circle cx="-4" cy="32" r="4" fill="#C9CED6" />
          <circle cx="48" cy="32" r="10" fill="#2E3440" />
          <circle cx="48" cy="32" r="4" fill="#C9CED6" />
          <path d="M-12,28 C-10,14 4,10 18,12 L34,12 C42,12 50,18 54,28 L40,28 C36,22 30,20 22,22 L4,28Z" fill="#D63A3F" />
          <path d="M40,12 L52,-8" stroke="#2E3440" strokeWidth="4" strokeLinecap="round" />
          <path d="M48,-10 L58,-12" stroke="#2E3440" strokeWidth="4" strokeLinecap="round" />
          <rect x="-16" y="-14" width="30" height="26" rx="4" fill="#1F6FA8" />
          <rect x="-12" y="-6" width="22" height="3" rx="1.5" fill="#fff" opacity=".85" />
          <path d="M18,12 C16,-2 20,-14 30,-16 L36,-4 C30,0 28,6 30,12Z" fill="#1F6FA8" />
          <circle cx="32" cy="-24" r="9" fill="#FBFBFB" stroke="#D9D9D9" />
          <path d="M26,-24 L40,-24" stroke="#2E3440" strokeWidth="3" strokeLinecap="round" />
          <path d="M34,-8 L48,-8" stroke="#E9C29A" strokeWidth="4" strokeLinecap="round" />
        </g>
        {/* steam */}
        <path d="M364,236 c-6,-8 6,-12 0,-20 M376,234 c-6,-8 6,-12 0,-20" stroke="#C9B79B" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".7" />
        {/* birds */}
        <path
          className="hero-scene__sky"
          d="M330,70 q6,-6 12,0 q6,-6 12,0 M372,52 q4,-4 8,0 q4,-4 8,0"
          stroke="#9A8A72"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}
