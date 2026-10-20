import { useId, type ReactElement, type ReactNode } from 'react'
import type { Art, Topping } from '../data/menu'

/** Small deterministic PRNG so each pizza always looks the same. */
function rng(seedText: string) {
  let h = 2166136261
  for (let i = 0; i < seedText.length; i++) h = Math.imul(h ^ seedText.charCodeAt(i), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function wobblyCircle(cx: number, cy: number, r: number, amp: number, rand: () => number, points = 28) {
  const pts: [number, number][] = []
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2
    const rr = r + (rand() - 0.5) * amp
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  // Smooth closed curve through the points (Catmull-Rom → Bézier).
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const p3 = pts[(i + 2) % pts.length]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

function scatter(rand: () => number, count: number, maxR: number, taken: [number, number][], minGap: number) {
  const out: [number, number][] = []
  let tries = 0
  while (out.length < count && tries < count * 40) {
    tries++
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * maxR
    const p: [number, number] = [100 + Math.cos(a) * r, 100 + Math.sin(a) * r]
    if ([...taken, ...out].every((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 > minGap ** 2)) out.push(p)
  }
  taken.push(...out)
  return out
}

function ToppingShape({ kind, x, y, rot, rand }: { kind: Topping; x: number; y: number; rot: number; rand: () => number }) {
  const t = `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})`
  switch (kind) {
    case 'pepperoni':
      return (
        <g transform={t}>
          <circle r="10" fill="#A92E26" />
          <circle r="8.2" fill="#C2402F" />
          <circle cx="-3" cy="-2" r="1.3" fill="#8E241D" />
          <circle cx="3" cy="2.5" r="1.1" fill="#8E241D" />
          <circle cx="2" cy="-4" r="0.9" fill="#E7836B" opacity=".7" />
        </g>
      )
    case 'chicken':
      return (
        <g transform={t}>
          <path d="M-7,-3 C-6,-7 2,-7 6,-5 C9,-2 8,4 4,5 C-1,7 -8,4 -7,-3Z" fill="#E4B57A" stroke="#B9824A" strokeWidth="1" />
          <path d="M-4,-2 C-1,-3 2,-3 4,-1" stroke="#C99158" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      )
    case 'sausage':
      return (
        <g transform={t}>
          <circle r="6.5" fill="#9C5434" />
          <circle r="5" fill="#B4673F" />
          <circle cx="-1.8" cy="-1.8" r="1.4" fill="#D18A62" />
        </g>
      )
    case 'olive':
      return <circle transform={t} r="4.2" fill="none" stroke="#2E2B2B" strokeWidth="2.8" />
    case 'capsicum':
      return <path transform={t} d="M-7,2 A8,8 0 0 1 6,-4" stroke="#3E8A3A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    case 'onion':
      return <path transform={t} d="M-8,3 A9,9 0 0 1 7,-5" stroke="#9A4D8A" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".9" />
    case 'mushroom':
      return (
        <g transform={t}>
          <path d="M-7,1 C-7,-7 7,-7 7,1Z" fill="#EADCC3" stroke="#AD936E" strokeWidth="1" />
          <rect x="-2.2" y="0.5" width="4.4" height="5.5" rx="1.6" fill="#F3E8D3" stroke="#AD936E" strokeWidth="1" />
        </g>
      )
    case 'jalapeno':
      return (
        <g transform={t}>
          <circle r="5" fill="#86B95A" stroke="#3F7D2E" strokeWidth="2" />
          <circle cx="-1.2" cy="0.5" r="0.9" fill="#F0F0C8" />
          <circle cx="1.4" cy="-0.6" r="0.9" fill="#F0F0C8" />
        </g>
      )
    case 'tomato':
      return (
        <g transform={t}>
          <circle r="8.5" fill="#D4433A" />
          <circle r="6.3" fill="#E8634E" />
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={Math.cos((i * Math.PI) / 2) * 3.4} cy={Math.sin((i * Math.PI) / 2) * 3.4} rx="1.4" ry="1" fill="#F6B39A" />
          ))}
        </g>
      )
    case 'paneer':
      return (
        <g transform={t}>
          <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#FFF7E6" stroke="#E0BE87" strokeWidth="1" />
          <path d="M-3,-1 L1,-3 M-1,3 L3,1" stroke="#C8863E" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'prawn':
      return (
        <g transform={t}>
          <path d="M-6,-2 A6.5,6.5 0 1 0 5,-4" stroke="#EE8A57" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M-3,3 L-1,6 M1,4 L3,6.5" stroke="#F7B48A" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'basil':
      return (
        <g transform={t}>
          <path d="M-9,0 C-4,-6 4,-6 9,0 C4,6 -4,6 -9,0Z" fill="#4C8A37" />
          <path d="M-8,0 L8,0" stroke="#78B05B" strokeWidth="0.9" />
        </g>
      )
    case 'corn':
      return <rect transform={t} x="-2" y="-2.4" width="4" height="4.8" rx="1.6" fill="#F4C443" stroke="#D9A21E" strokeWidth=".6" />
    case 'chilli':
      return <circle transform={t} r={0.9 + rand() * 0.8} fill="#B3261E" />
  }
}

const SIZE_OF: Record<Topping, [count: number, gap: number]> = {
  pepperoni: [9, 19],
  chicken: [8, 16],
  sausage: [7, 14],
  olive: [8, 10],
  capsicum: [7, 12],
  onion: [6, 12],
  mushroom: [6, 14],
  jalapeno: [6, 11],
  tomato: [5, 17],
  paneer: [7, 13],
  prawn: [6, 15],
  basil: [5, 15],
  corn: [14, 6],
  chilli: [24, 3],
}

function Pizza({ toppings, sauce = 'tomato', seed }: { toppings: Topping[]; sauce?: 'tomato' | 'bbq' | 'white'; seed: string }) {
  const id = useId().replace(/:/g, '')
  const rand = rng(seed)
  const cheese = wobblyCircle(100, 100, 72, 7, rand)
  const taken: [number, number][] = []
  const shapes: ReactElement[] = []
  // Big toppings first so small ones fill the gaps.
  const order = [...toppings].sort((a, b) => SIZE_OF[b][1] - SIZE_OF[a][1])
  for (const kind of order) {
    const [count, gap] = SIZE_OF[kind]
    const pts = scatter(rand, count, kind === 'chilli' || kind === 'corn' ? 64 : 58, taken, gap)
    pts.forEach(([x, y], i) => shapes.push(<ToppingShape key={`${kind}${i}`} kind={kind} x={x} y={y} rot={rand() * 360} rand={rand} />))
  }
  const sauceColor = sauce === 'bbq' ? '#7B3A1F' : sauce === 'white' ? '#F2E7CE' : '#C3422C'
  const browned = Array.from({ length: 14 }, () => {
    const a = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * 64
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r, 2 + rand() * 4] as const
  })
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
      <defs>
        <radialGradient id={`crust${id}`} cx="50%" cy="45%" r="55%">
          <stop offset="78%" stopColor="#F1C27D" />
          <stop offset="92%" stopColor="#D8913F" />
          <stop offset="100%" stopColor="#B87230" />
        </radialGradient>
        <radialGradient id={`cheese${id}`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FCE7A6" />
          <stop offset="100%" stopColor="#F2C45E" />
        </radialGradient>
        <radialGradient id={`gloss${id}`} cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".35" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse cx="102" cy="110" rx="88" ry="84" fill="#6B4320" opacity=".18" filter={`url(#soft${id})`} />
      <circle cx="100" cy="100" r="89" fill={`url(#crust${id})`} />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#F7D9A5" strokeWidth="2" opacity=".6" />
      <circle cx="100" cy="100" r="77" fill={sauceColor} />
      <path d={cheese} fill={`url(#cheese${id})`} />
      {browned.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#E2A24A" opacity=".45" />
      ))}
      {shapes}
      {[0, 45, 90, 135].map((a) => (
        <line key={a} x1="100" y1="12" x2="100" y2="188" transform={`rotate(${a} 100 100)`} stroke="#8A4E1C" strokeOpacity=".16" strokeWidth="1.2" />
      ))}
      <circle cx="100" cy="100" r="89" fill={`url(#gloss${id})`} />
    </svg>
  )
}

function Plate({ id, children, rx = 86, ry = 70 }: { id: string; children: ReactNode; rx?: number; ry?: number }) {
  return (
    <>
      <defs>
        <radialGradient id={`plate${id}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EDE5D6" />
        </radialGradient>
        <filter id={`ps${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <ellipse cx="102" cy="122" rx={rx} ry={ry} fill="#5B4024" opacity=".14" filter={`url(#ps${id})`} />
      <ellipse cx="100" cy="114" rx={rx} ry={ry} fill={`url(#plate${id})`} stroke="#E2D7C3" strokeWidth="1.5" />
      <ellipse cx="100" cy="114" rx={rx - 16} ry={ry - 13} fill="none" stroke="#E7DECD" strokeWidth="1.5" />
      {children}
    </>
  )
}

function Side({ kind }: { kind: Exclude<Art['kind'], 'pizza'> }) {
  const id = useId().replace(/:/g, '')
  switch (kind) {
    case 'garlic-bread':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <linearGradient id={`gb${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F2C27A" />
              <stop offset="100%" stopColor="#CF8838" />
            </linearGradient>
          </defs>
          <Plate id={id}>
            {[-30, -10, 10, 30].map((dx, i) => (
              <g key={i} transform={`translate(${100 + dx} 112) rotate(${-14 + i * 3})`}>
                <rect x="-9" y="-46" width="18" height="92" rx="9" fill={`url(#gb${id})`} stroke="#B9732D" strokeWidth="1" />
                <path
                  d="M-5,-36 L5,-36 M-5,-18 L5,-18 M-5,0 L5,0 M-5,18 L5,18 M-5,34 L5,34"
                  stroke="#F7DCA8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity=".7"
                />
                {[-30, -12, 8, 26].map((y) => (
                  <circle key={y} cx={(i % 2 ? 3 : -3) + 0} cy={y} r="1.6" fill="#4C8A37" />
                ))}
              </g>
            ))}
          </Plate>
        </svg>
      )
    case 'wings':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <radialGradient id={`w${id}`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#E0773B" />
              <stop offset="100%" stopColor="#9C3416" />
            </radialGradient>
          </defs>
          <Plate id={id}>
            {[
              [70, 96, -30],
              [112, 88, 20],
              [140, 116, 70],
              [92, 128, 10],
              [60, 132, -60],
              [124, 142, -20],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                <path d="M-20,-9 C-8,-16 12,-14 20,-6 C24,0 20,9 12,10 C0,13 -14,11 -20,6 C-24,2 -24,-5 -20,-9Z" fill={`url(#w${id})`} />
                <path d="M-12,-8 C-4,-11 6,-10 12,-6" stroke="#F4A46A" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6" />
                <circle cx="-4" cy="2" r="1" fill="#FFF6E2" />
                <circle cx="6" cy="-1" r="1" fill="#FFF6E2" />
              </g>
            ))}
            <path d="M84,74 l6,-6 M150,98 l7,-3 M54,116 l-6,-3" stroke="#5C9A3E" strokeWidth="3" strokeLinecap="round" />
          </Plate>
        </svg>
      )
    case 'wedges':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <Plate id={id}>
            {[
              [72, 104, -20],
              [96, 92, 15],
              [118, 104, 50],
              [82, 128, 60],
              [106, 130, -40],
              [64, 118, 100],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                <path d="M-22,4 C-10,-10 12,-10 22,4Z" fill="#F0C064" stroke="#B9782C" strokeWidth="1.2" />
                <path d="M-22,4 C-8,8 8,8 22,4" stroke="#9E5F22" strokeWidth="2.6" fill="none" />
                <circle cx="-6" cy="-1" r=".9" fill="#B34A21" />
                <circle cx="5" cy="-3" r=".9" fill="#B34A21" />
              </g>
            ))}
            <g>
              <ellipse cx="146" cy="128" rx="20" ry="13" fill="#F6F0E3" stroke="#D9CDB6" strokeWidth="1.5" />
              <ellipse cx="146" cy="126" rx="15" ry="9" fill="#FBF3D6" />
              <path d="M138,124 c4,-3 10,-3 14,1" stroke="#EAD9A2" strokeWidth="2" fill="none" strokeLinecap="round" />
            </g>
          </Plate>
        </svg>
      )
    case 'pasta':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <radialGradient id={`pc${id}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FBF0D7" />
              <stop offset="100%" stopColor="#EED9A8" />
            </radialGradient>
            <filter id={`bs${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="102" cy="132" rx="80" ry="52" fill="#5B4024" opacity=".16" filter={`url(#bs${id})`} />
          <path d="M22,100 C24,150 60,170 100,170 C140,170 176,150 178,100Z" fill="#F7F2E8" stroke="#DCD1BE" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="78" ry="36" fill="#FFFDF8" stroke="#DCD1BE" strokeWidth="1.5" />
          <ellipse cx="100" cy="100" rx="66" ry="28" fill={`url(#pc${id})`} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + i
            const r = 12 + (i % 4) * 11
            return (
              <rect
                key={i}
                x={100 + Math.cos(a) * r * 1.1 - 8}
                y={100 + Math.sin(a) * r * 0.42 - 3.5}
                width="16"
                height="7"
                rx="3"
                fill="#F1C66E"
                stroke="#CC9440"
                strokeWidth=".8"
                transform={`rotate(${((i * 37) % 180) - 90} ${100 + Math.cos(a) * r * 1.1} ${100 + Math.sin(a) * r * 0.42})`}
              />
            )
          })}
          {[
            [78, 92],
            [122, 104],
            [104, 88],
          ].map(([x, y], i) => (
            <path key={i} d={`M${x - 5},${y} C${x - 5},${y - 6} ${x + 5},${y - 6} ${x + 5},${y}Z`} fill="#E5D4B4" stroke="#A88B62" strokeWidth=".8" />
          ))}
          {[
            [70, 104],
            [92, 112],
            [116, 92],
            [134, 100],
            [86, 94],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" fill="#4C8A37" />
          ))}
        </svg>
      )
    case 'lava':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <linearGradient id={`lc${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B1F14" />
              <stop offset="45%" stopColor="#5A3020" />
              <stop offset="100%" stopColor="#2E170F" />
            </linearGradient>
          </defs>
          <Plate id={id} rx={84} ry={50}>
            <path d="M60,120 C70,138 130,138 140,120 C150,128 162,132 150,140 C120,152 80,152 50,140 C38,132 50,128 60,120Z" fill="#4A2416" />
            <path d="M62,70 L62,118 C62,130 138,130 138,118 L138,70Z" fill={`url(#lc${id})`} />
            <ellipse cx="100" cy="70" rx="38" ry="14" fill="#6A3A27" />
            <path d="M84,70 C86,86 90,96 92,112 C93,120 99,120 99,112 L100,84 C102,96 106,104 108,98 L110,70Z" fill="#3A1A0F" />
            {[
              [86, 66],
              [104, 64],
              [116, 70],
              [94, 74],
              [78, 72],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2" fill="#FFFFFF" opacity=".85" />
            ))}
            <path d="M130,64 c4,-8 12,-8 14,-2 c-4,0 -8,2 -10,6Z" fill="#5C9A3E" />
            <circle cx="138" cy="70" r="5" fill="#C42F3A" />
          </Plate>
        </svg>
      )
    case 'cola':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <linearGradient id={`cb${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2B140C" />
              <stop offset="40%" stopColor="#5A2A16" />
              <stop offset="100%" stopColor="#22100A" />
            </linearGradient>
            <filter id={`cs${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="102" cy="180" rx="40" ry="8" fill="#5B4024" opacity=".22" filter={`url(#cs${id})`} />
          <path d="M90,20 h20 v12 c0,8 18,22 18,46 v92 c0,6 -4,10 -10,10 h-36 c-6,0 -10,-4 -10,-10 v-92 c0,-24 18,-38 18,-46Z" fill={`url(#cb${id})`} />
          <rect x="88" y="12" width="24" height="10" rx="2" fill="#C42F3A" />
          <rect x="72" y="92" width="56" height="34" fill="#C42F3A" />
          <path d="M76,112 C90,100 110,122 124,106" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="79" y="44" width="5" height="120" rx="2.5" fill="#fff" opacity=".18" />
          {[
            [112, 150],
            [104, 160],
            [116, 138],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" fill="#fff" opacity=".25" />
          ))}
        </svg>
      )
    case 'tea':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <linearGradient id={`t${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E9A23B" />
              <stop offset="100%" stopColor="#B4621B" />
            </linearGradient>
            <filter id={`ts${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="102" cy="180" rx="44" ry="8" fill="#5B4024" opacity=".2" filter={`url(#ts${id})`} />
          <path d="M120,10 L108,70" stroke="#3E8A3A" strokeWidth="6" strokeLinecap="round" />
          <path
            d="M60,46 L140,46 L130,172 C129,178 124,182 118,182 L82,182 C76,182 71,178 70,172Z"
            fill="#FFFFFF"
            opacity=".55"
            stroke="#D9CFC0"
            strokeWidth="1.5"
          />
          <path d="M64,70 L136,70 L130,172 C129,178 124,182 118,182 L82,182 C76,182 71,178 70,172Z" fill={`url(#t${id})`} opacity=".92" />
          <rect x="78" y="80" width="20" height="18" rx="4" fill="#fff" opacity=".45" transform="rotate(-10 88 89)" />
          <rect x="102" y="96" width="18" height="16" rx="4" fill="#fff" opacity=".4" transform="rotate(12 111 104)" />
          <circle cx="132" cy="54" r="20" fill="#F6E27A" stroke="#E2C53B" strokeWidth="3" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line
              key={a}
              x1="132"
              y1="54"
              x2={132 + Math.cos((a * Math.PI) / 180) * 15}
              y2={54 + Math.sin((a * Math.PI) / 180) * 15}
              stroke="#FBF2BE"
              strokeWidth="2"
            />
          ))}
        </svg>
      )
    case 'water':
      return (
        <svg viewBox="0 0 200 200" aria-hidden="true" className="food-svg">
          <defs>
            <linearGradient id={`wb${id}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#CFE6F2" />
              <stop offset="50%" stopColor="#EEF7FB" />
              <stop offset="100%" stopColor="#BBDCEC" />
            </linearGradient>
            <filter id={`ws${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
          <ellipse cx="102" cy="180" rx="36" ry="7" fill="#5B4024" opacity=".18" filter={`url(#ws${id})`} />
          <rect x="90" y="14" width="20" height="12" rx="2" fill="#2F7FB0" />
          <path
            d="M90,26 h20 c0,10 16,18 16,36 v108 c0,6 -4,10 -10,10 h-32 c-6,0 -10,-4 -10,-10 v-108 c0,-18 16,-26 16,-36Z"
            fill={`url(#wb${id})`}
            stroke="#A9CFE2"
            strokeWidth="1.5"
          />
          <rect x="74" y="96" width="52" height="30" fill="#2F7FB0" opacity=".85" />
          <path d="M84,112 c6,-8 12,-8 16,0 c4,8 10,8 16,0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="80" y="60" width="4" height="100" rx="2" fill="#fff" opacity=".7" />
        </svg>
      )
  }
}

export function FoodArt({ art, seed }: { art: Art; seed: string }) {
  if (art.kind === 'pizza') return <Pizza toppings={art.toppings} sauce={art.sauce} seed={seed} />
  return <Side kind={art.kind} />
}
