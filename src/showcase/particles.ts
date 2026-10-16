import * as THREE from 'three'

export interface Emit {
  x: number
  y: number
  z: number
  vx?: number
  vy?: number
  vz?: number
  life: number
  size: number
  color: THREE.Color
  alpha?: number
  drag?: number
  gravity?: number
}

const VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uScale;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / -mv.z;
    vAlpha = aAlpha;
    vColor = aColor;
  }
`

// Premultiplied output: reads as a glow on dark surfaces and as a crisp
// coloured sparkle on the light UI (pure additive would vanish on white).
const FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float halo = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.22, 0.0, d);
    float a = (halo * halo * 0.75 + core * 0.6) * vAlpha;
    vec3 col = mix(vColor, vec3(1.0, 1.0, 0.92), core * 0.8);
    gl_FragColor = vec4(col * a, a);
  }
`

/** A fixed-capacity pool of soft glowing points with simple physics. */
export class Particles {
  readonly points: THREE.Points
  private n: number
  private pos: Float32Array
  private vel: Float32Array
  private life: Float32Array
  private maxLife: Float32Array
  private baseSize: Float32Array
  private baseAlpha: Float32Array
  private drag: Float32Array
  private gravity: Float32Array
  private size: Float32Array
  private alpha: Float32Array
  private color: Float32Array
  private cursor = 0
  private material: THREE.ShaderMaterial

  constructor(capacity: number) {
    this.n = capacity
    this.pos = new Float32Array(capacity * 3)
    this.vel = new Float32Array(capacity * 3)
    this.life = new Float32Array(capacity)
    this.maxLife = new Float32Array(capacity).fill(1)
    this.baseSize = new Float32Array(capacity)
    this.baseAlpha = new Float32Array(capacity)
    this.drag = new Float32Array(capacity)
    this.gravity = new Float32Array(capacity)
    this.size = new Float32Array(capacity)
    this.alpha = new Float32Array(capacity)
    this.color = new Float32Array(capacity * 3)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage))
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.color, 3).setUsage(THREE.DynamicDrawUsage))
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: { uScale: { value: 1000 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    })
    this.points = new THREE.Points(geo, this.material)
    this.points.frustumCulled = false
    this.points.renderOrder = 5
  }

  /** Pixel size at z=0 equals `size` when uScale is the camera distance × DPR. */
  setScale(v: number) {
    this.material.uniforms.uScale.value = v
  }

  emit(e: Emit) {
    const i = this.cursor
    this.cursor = (this.cursor + 1) % this.n
    this.pos.set([e.x, e.y, e.z], i * 3)
    this.vel.set([e.vx ?? 0, e.vy ?? 0, e.vz ?? 0], i * 3)
    this.life[i] = e.life
    this.maxLife[i] = e.life
    this.baseSize[i] = e.size
    this.baseAlpha[i] = e.alpha ?? 1
    this.drag[i] = e.drag ?? 1.5
    this.gravity[i] = e.gravity ?? 0
    this.color.set([e.color.r, e.color.g, e.color.b], i * 3)
  }

  update(dt: number) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) {
        this.alpha[i] = 0
        continue
      }
      this.life[i] -= dt
      const k = Math.max(0, this.life[i] / this.maxLife[i])
      const damp = Math.exp(-this.drag[i] * dt)
      const j = i * 3
      this.vel[j] *= damp
      this.vel[j + 1] = this.vel[j + 1] * damp - this.gravity[i] * dt
      this.vel[j + 2] *= damp
      this.pos[j] += this.vel[j] * dt
      this.pos[j + 1] += this.vel[j + 1] * dt
      this.pos[j + 2] += this.vel[j + 2] * dt
      // Fade in fast, fade out slow, shrink as it dies.
      const fadeIn = Math.min(1, (1 - k) * 8)
      this.alpha[i] = this.baseAlpha[i] * fadeIn * Math.pow(k, 0.8)
      this.size[i] = this.baseSize[i] * (0.35 + 0.65 * k)
    }
    const g = this.points.geometry
    g.attributes.position.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
    g.attributes.aAlpha.needsUpdate = true
    g.attributes.aColor.needsUpdate = true
  }

  clear() {
    this.life.fill(0)
    this.alpha.fill(0)
  }
}
