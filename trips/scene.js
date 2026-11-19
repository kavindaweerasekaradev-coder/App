// Driftway hero: a stylised low-poly island scene in Three.js.
// Cabin, trees, mountains, shader water, drifting clouds, birds and pollen.
// Talks to app.js through window events: 'scene:ready' (we emit) and DriftScene.intro() (app calls).
import * as THREE from '../assets/js/vendor/three.module.min.js';

const canvas = document.getElementById('scene');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 760px)').matches;

function ready() { window.dispatchEvent(new Event('scene:ready')); }

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-webgl');
  window.DriftScene = { intro() {} };
  ready();
}

if (renderer) build();

function build() {
  // sRGB hex → vec3 for raw shaders (they skip colour management)
  const hv = (hex) => { const c = new THREE.Color(); c.setHex(parseInt(hex.slice(1), 16), THREE.SRGBColorSpace); return new THREE.Vector3(...c.convertLinearToSRGB().toArray()); };
  const col = (hex) => new THREE.Color(hex);

  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const FOG = '#d4eef0';
  scene.fog = new THREE.Fog(FOG, 45, 170);

  const camera = new THREE.PerspectiveCamera(isMobile ? 50 : 36, 1, 0.1, 900);
  const camBase = new THREE.Vector3(0, 7.5, isMobile ? 46 : 38);
  const camStart = new THREE.Vector3(-14, 26, 90);
  camera.position.copy(reduce ? camBase : camStart);
  const LOOK_Y = isMobile ? 7.5 : 7.1;
  const look = new THREE.Vector3(0, LOOK_Y, 0);

  // ---------- sky dome ----------
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: hv('#7fcfe0') }, uMid: { value: hv('#c9eef0') }, uHorizon: { value: hv('#f4fbf4') }, uSun: { value: new THREE.Vector3(-0.35, 0.28, -1).normalize() } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uTop,uMid,uHorizon,uSun; varying vec3 vDir;
        void main(){ float h = vDir.y;
          vec3 c = mix(uHorizon, uMid, smoothstep(0.0, 0.18, h));
          c = mix(c, uTop, smoothstep(0.18, 0.75, h));
          float s = max(dot(normalize(vDir), uSun), 0.0);
          c += vec3(1.0,0.93,0.78) * (pow(s, 300.0) * 1.2 + pow(s, 12.0) * 0.18);
          gl_FragColor = vec4(c,1.); }`
    })
  );
  scene.add(sky);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(col('#e2f6ff'), col('#3b6b45'), 1.35));
  const sun = new THREE.DirectionalLight(col('#fff0d4'), 2.4);
  sun.position.set(-18, 26, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 70 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const flat = (c, extra = {}) => new THREE.MeshStandardMaterial({ color: col(c), flatShading: true, roughness: 0.9, metalness: 0, ...extra });
  const mats = {
    sand: flat('#f2dca2'), grass: flat('#74c04f'), grass2: flat('#5fae45'), rock: flat('#8fa9ad'),
    pine1: flat('#2f8f4e'), pine2: flat('#3fa35a'), round: flat('#59b84a'), trunk: flat('#6b4527'),
    wall: flat('#f4f6f3'), roof: flat('#2f6fd6'), roofEdge: flat('#2459b4'), deck: flat('#c98f5a'),
    glass: new THREE.MeshStandardMaterial({ color: col('#bfe8ff'), emissive: col('#ffcf8a'), emissiveIntensity: 0, roughness: 0.15, metalness: 0.1 }),
    cloud: new THREE.MeshStandardMaterial({ color: col('#ffffff'), flatShading: true, roughness: 1, emissive: col('#ffffff'), emissiveIntensity: 0.35 }),
  };

  const jitter = (geo, amt, keepBottom = true) => {
    const p = geo.attributes.position;
    const box = new THREE.Box3().setFromBufferAttribute(p);
    const seen = new Map();
    for (let i = 0; i < p.count; i++) {
      const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      if (!seen.has(k)) seen.set(k, [(Math.random() - .5) * amt, (Math.random() - .5) * amt, (Math.random() - .5) * amt]);
      const [dx, dy, dz] = seen.get(k);
      if (keepBottom && p.getY(i) <= box.min.y + 1e-3) continue;
      p.setXYZ(i, p.getX(i) + dx, p.getY(i) + dy, p.getZ(i) + dz);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const mesh = (geo, mat, cast = true, receive = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; };

  // ---------- island ----------
  const world = new THREE.Group();
  scene.add(world);

  const sand = mesh(jitter(new THREE.CylinderGeometry(8.4, 9.4, 1.6, 36, 2), 0.35), mats.sand, false);
  sand.position.y = -0.3;
  world.add(sand);
  const grassGeo = new THREE.CylinderGeometry(7.2, 7.9, 1.2, 36, 3);
  {
    const p = grassGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) > 0.5) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.6 + Math.sin(x * .6) * .25 + Math.cos(z * .5) * .25 + Math.random() * .12); }
    }
  }
  const grass = mesh(jitter(grassGeo, 0.25), mats.grass, false);
  grass.position.y = 0.55;
  world.add(grass);
  [[-4.6, -3.2, 2.2], [4.8, -2.6, 1.8], [-1.5, -5, 1.6]].forEach(([x, z, s]) => {
    const h = mesh(jitter(new THREE.IcosahedronGeometry(s, 1), .3, false), mats.grass2, false);
    h.scale.y = .45; h.position.set(x, 1.0, z); world.add(h);
  });
  // rocks around the shore
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * .4;
    const r = mesh(jitter(new THREE.DodecahedronGeometry(.4 + Math.random() * .5, 0), .2, false), mats.rock);
    r.position.set(Math.cos(a) * (8.6 + Math.random()), 0.05, Math.sin(a) * (8.6 + Math.random()));
    r.rotation.set(Math.random(), Math.random(), Math.random());
    world.add(r);
  }

  // ---------- cabin ----------
  const cabin = new THREE.Group();
  const body = mesh(new THREE.BoxGeometry(3.6, 2, 2.6), mats.wall); body.position.y = 1; cabin.add(body);
  const glass = mesh(new THREE.PlaneGeometry(2.3, 1.55), mats.glass, false, false); glass.position.set(-0.45, 0.95, 1.31); cabin.add(glass);
  [-1.15, -0.45, 0.25].forEach(x => { const f = mesh(new THREE.BoxGeometry(.07, 1.6, .06), mats.wall); f.position.set(x, .95, 1.33); cabin.add(f); });
  const door = mesh(new THREE.BoxGeometry(.6, 1.3, .06), mats.deck); door.position.set(1.25, .65, 1.32); cabin.add(door);
  const roofShape = new THREE.Shape(); roofShape.moveTo(-2.15, 0); roofShape.lineTo(0, 1.55); roofShape.lineTo(2.15, 0); roofShape.lineTo(-2.15, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 3.1, bevelEnabled: false }); roofGeo.translate(0, 0, -1.55);
  const roof = mesh(roofGeo, mats.roof); roof.position.y = 2; cabin.add(roof);
  const chimney = mesh(new THREE.BoxGeometry(.35, .9, .35), mats.roofEdge); chimney.position.set(1, 3.1, -.5); cabin.add(chimney);
  const deckM = mesh(new THREE.BoxGeometry(4.6, .18, 1.3), mats.deck); deckM.position.set(0, .09, 1.85); cabin.add(deckM);
  const warm = new THREE.PointLight(col('#ffbe6b'), 0, 8, 2); warm.position.set(-.4, 1.2, 2.2); cabin.add(warm);
  cabin.position.set(0.6, 1.05, -0.2);
  cabin.rotation.y = -0.32;
  world.add(cabin);

  // jetty + boat
  const jetty = mesh(new THREE.BoxGeometry(1.1, .14, 4.2), mats.deck); jetty.position.set(4.6, .25, 7.6); jetty.rotation.y = .4; world.add(jetty);
  const boat = new THREE.Group();
  const hullShape = new THREE.Shape(); hullShape.moveTo(-1, .3); hullShape.lineTo(1, .3); hullShape.lineTo(.7, -.15); hullShape.lineTo(-.7, -.15);
  const hull = mesh(new THREE.ExtrudeGeometry(hullShape, { depth: .7, bevelEnabled: false }), flat('#f5893b')); hull.position.z = -.35; boat.add(hull);
  boat.position.set(6.6, .05, 9.6); boat.rotation.y = .4; world.add(boat);

  // ---------- trees ----------
  const swayers = [];
  function pineTree(s, m) {
    const g = new THREE.Group();
    const t = mesh(new THREE.CylinderGeometry(.1, .14, .7, 5), mats.trunk); t.position.y = .35; g.add(t);
    [[.95, 1.3, .9], [.75, 1.1, 1.55], [.5, .9, 2.15]].forEach(([r, h, y]) => { const c = mesh(jitter(new THREE.ConeGeometry(r, h, 7), .08), m); c.position.y = y; g.add(c); });
    g.scale.setScalar(s); return g;
  }
  function roundTree(s) {
    const g = new THREE.Group();
    const t = mesh(new THREE.CylinderGeometry(.1, .15, 1, 5), mats.trunk); t.position.y = .5; g.add(t);
    const c = mesh(jitter(new THREE.IcosahedronGeometry(.85, 0), .15, false), mats.round); c.position.y = 1.5; g.add(c);
    const c2 = mesh(jitter(new THREE.IcosahedronGeometry(.55, 0), .1, false), mats.pine2); c2.position.set(.45, 1.15, .2); g.add(c2);
    g.scale.setScalar(s); return g;
  }
  const treeSpots = [
    [-5.2, -1.5, 1.3, 'p'], [-6, .8, 1.0, 'r'], [-4.2, -4.2, 1.5, 'p'], [-2.6, -5.6, 1.15, 'p'], [-1, -5.2, 1, 'r'],
    [3.6, -4.6, 1.4, 'p'], [5.4, -3.2, 1.1, 'p'], [6.1, -.6, 1.2, 'r'], [5.5, 2.4, .9, 'p'], [-5.4, 3, .9, 'p'],
    [-3.4, 4.6, .75, 'r'], [2, -6, 1.2, 'p'], [-6.5, -2.9, .8, 'r'], [4.4, 4.5, .7, 'r'], [-1.8, 5.8, .6, 'p']
  ];
  treeSpots.forEach(([x, z, s, k], i) => {
    const tr = k === 'p' ? pineTree(s, i % 2 ? mats.pine1 : mats.pine2) : roundTree(s);
    tr.position.set(x, 1.05, z); tr.rotation.y = Math.random() * 6;
    tr.userData.phase = Math.random() * 6; world.add(tr); swayers.push(tr);
  });

  // ---------- distant mountains & islets ----------
  const far = new THREE.Group(); scene.add(far);
  const mountainMats = [flat('#4f9fb0'), flat('#5fb2b8'), flat('#7cc2c4'), flat('#9fd2d4')];
  function mountain(r, h, m, x, z) {
    const geo = jitter(new THREE.ConeGeometry(r, h, 7, 3), r * .18);
    const mm = mesh(geo, m, false, false); mm.position.set(x, h / 2 - .4, z); mm.rotation.y = Math.random() * 6; far.add(mm);
  }
  for (let i = 0; i < 16; i++) mountain(10 + Math.random() * 10, 10 + Math.random() * 16, mountainMats[3], -130 + i * 17 + Math.random() * 6, -120 - Math.random() * 20);
  for (let i = 0; i < 12; i++) mountain(8 + Math.random() * 8, 9 + Math.random() * 12, mountainMats[2], -100 + i * 18 + Math.random() * 8, -85 - Math.random() * 12);
  for (let i = 0; i < 8; i++) mountain(6 + Math.random() * 6, 7 + Math.random() * 9, mountainMats[1], -80 + i * 22 + Math.random() * 10, -60 - Math.random() * 10);
  // green side islands (frame the composition like the foliage)
  function islet(x, z, s) {
    const g = new THREE.Group();
    const base = mesh(jitter(new THREE.IcosahedronGeometry(4, 1), .8, false), mats.grass2, false); base.scale.set(1.4, .6, 1); g.add(base);
    for (let i = 0; i < 6; i++) { const t = pineTree(.9 + Math.random() * .6, i % 2 ? mats.pine1 : mats.pine2); t.position.set((Math.random() - .5) * 7, 1.6, (Math.random() - .5) * 4); g.add(t); }
    g.position.set(x, -.6, z); g.scale.setScalar(s); far.add(g);
  }
  islet(-34, -22, 1.4); islet(38, -26, 1.6); islet(-22, -40, 1); islet(26, -48, .9); islet(-52, -8, 1.8); islet(54, -6, 1.7);

  // ---------- water ----------
  const waterGeo = new THREE.PlaneGeometry(600, 600, isMobile ? 120 : 220, isMobile ? 120 : 220); waterGeo.rotateX(-Math.PI / 2);
  const waterU = {
    uTime: { value: 0 }, uDeep: { value: hv('#14697d') }, uMid: { value: hv('#22a3b4') }, uShallow: { value: hv('#5fd3cf') }, uFoam: { value: hv('#ffffff') },
    uFog: { value: hv(FOG) }, uFogNear: { value: 45 }, uFogFar: { value: 170 }, uDusk: { value: 0 }
  };
  const water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
    uniforms: waterU,
    vertexShader: `uniform float uTime; varying vec3 vW; varying float vH;
      void main(){ vec3 p = position;
        float w = sin(p.x*.12+uTime*.7)*.22 + sin(p.z*.18+uTime*.55)*.18 + sin((p.x+p.z)*.45+uTime*1.4)*.05;
        float d = length(p.xz); w *= smoothstep(8.0, 16.0, d) * .9 + .1;
        p.y += w; vH = w; vec4 wp = modelMatrix*vec4(p,1.); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform float uTime,uFogNear,uFogFar,uDusk; uniform vec3 uDeep,uMid,uShallow,uFoam,uFog; varying vec3 vW; varying float vH;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      void main(){
        float d = length(vW.xz);
        vec3 c = mix(uDeep, uMid, smoothstep(60.0, 18.0, d));
        c = mix(c, uShallow, smoothstep(15.0, 9.5, d));
        float ang = atan(vW.z, vW.x);
        float ring = 9.6 + sin(ang*7.0 + uTime*.6)*.25 + sin(uTime*1.2)*.18;
        float foam = smoothstep(.55, .0, abs(d - ring)) * (.6 + .4*noise(vW.xz*2.0 + uTime));
        float ring2 = 11.0 + sin(ang*5.0 - uTime*.5)*.3 + mod(uTime*.6, 2.4);
        foam += smoothstep(.25, .0, abs(d - ring2)) * .35 * (1. - mod(uTime*.6, 2.4)/2.4);
        float n = noise(vW.xz*.35 + vec2(uTime*.15, uTime*.1)) * noise(vW.xz*.9 - uTime*.2);
        float glint = smoothstep(.42, .62, n) * smoothstep(80.0, 20.0, d);
        c += vH * .22;
        c = mix(c, uFoam, clamp(foam, 0., 1.) * .85);
        c += glint * .28;
        c = mix(c, c * vec3(.55,.6,.85), uDusk);
        float f = smoothstep(uFogNear, uFogFar, distance(vW, cameraPosition));
        c = mix(c, uFog, f);
        gl_FragColor = vec4(c, 1.); }`
  }));
  water.receiveShadow = false;
  scene.add(water);

  // ---------- clouds ----------
  const clouds = [];
  for (let i = 0; i < 9; i++) {
    const g = new THREE.Group();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const s = mesh(new THREE.IcosahedronGeometry(1.6 + Math.random() * 1.6, 1), mats.cloud, false, false);
      s.position.set(j * 2 - n, Math.random() * 1.2, Math.random() * 1.5); s.scale.y = .7; g.add(s);
    }
    g.position.set(-110 + Math.random() * 220, 22 + Math.random() * 16, -70 - Math.random() * 60);
    g.userData.speed = .6 + Math.random() * .8;
    g.scale.setScalar(.9 + Math.random() * .9);
    scene.add(g); clouds.push(g);
  }

  // ---------- birds ----------
  const birds = [];
  const birdMat = new THREE.MeshBasicMaterial({ color: col('#24505c'), side: THREE.DoubleSide, fog: true });
  const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, .9, 0, -.25, 0, 0, -.5], 3));
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const l = new THREE.Mesh(wingGeo, birdMat), r = new THREE.Mesh(wingGeo, birdMat); r.scale.x = -1;
    b.add(l, r); b.userData = { l, r, phase: Math.random() * 6, off: new THREE.Vector3(i * 1.6 - 5, Math.sin(i) * .8, (i % 3) * 1.2) };
    b.scale.setScalar(.75); scene.add(b); birds.push(b);
  }

  // ---------- pollen / fireflies ----------
  const N = isMobile ? 120 : 260;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 50; pos[i * 3 + 1] = Math.random() * 14 + .5; pos[i * 3 + 2] = (Math.random() - .5) * 40 + 5; seeds[i] = Math.random() * 10; }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const pollenU = { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uDusk: { value: 0 } };
  const pollen = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: pollenU,
    vertexShader: `uniform float uTime,uPx; attribute float aSeed; varying float vA;
      void main(){ vec3 p = position; p.x += sin(uTime*.3+aSeed)*1.2; p.y += sin(uTime*.5+aSeed*2.)*.6; p.z += cos(uTime*.25+aSeed)*1.0;
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = (6. + 4.*sin(aSeed*3.)) * uPx * (12. / -mv.z); vA = .5 + .5*sin(uTime*1.5+aSeed*4.); }`,
    fragmentShader: `uniform float uDusk; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
      vec3 c = mix(vec3(1.,.98,.9), vec3(1.,.8,.4), uDusk); gl_FragColor = vec4(c, smoothstep(.5,.0,d)*vA*(.35+uDusk*.6)); }`
  }));
  scene.add(pollen);

  // ---------- interaction ----------
  const mouse = new THREE.Vector2(), smooth = new THREE.Vector2();
  addEventListener('pointermove', (e) => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }, { passive: true });

  // click the cabin: lights on/off with a little hop
  const ray = new THREE.Raycaster();
  let lightsOn = false;
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (ray.intersectObject(cabin, true).length && window.gsap) {
      lightsOn = !lightsOn;
      gsap.timeline().to(cabin.position, { y: 1.7, duration: .25, ease: 'power2.out' }).to(cabin.position, { y: 1.05, duration: .6, ease: 'bounce.out' });
      gsap.to(mats.glass, { emissiveIntensity: lightsOn ? 1.1 : state.dusk * 1.2, duration: .6 });
      gsap.to(warm, { intensity: lightsOn ? 6 : state.dusk * 5, duration: .6 });
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    canvas.style.cursor = ray.intersectObject(cabin, true).length ? 'pointer' : '';
  });

  // scroll state, driven by GSAP ScrollTrigger in app.js-land
  const state = { scroll: 0, dusk: 0, intro: reduce ? 1 : 0 };
  if (window.gsap && window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (st) => { state.scroll = st.progress; }
    });
  }

  const skyMat = sky.material;
  const dayTop = hv('#7fcfe0'), duskTop = hv('#2b5f78'), dayMid = hv('#c9eef0'), duskMid = hv('#f2b38a'), dayHor = hv('#f4fbf4'), duskHor = hv('#ffd9a8');
  const fogDay = col(FOG), fogDusk = col('#e9b994'), fogVDay = hv(FOG), fogVDusk = hv('#e9b994');
  const sunDay = col('#fff0d4'), sunDusk = col('#ffb070');
  function applyDusk(t) {
    skyMat.uniforms.uTop.value.lerpVectors(dayTop, duskTop, t);
    skyMat.uniforms.uMid.value.lerpVectors(dayMid, duskMid, t);
    skyMat.uniforms.uHorizon.value.lerpVectors(dayHor, duskHor, t);
    scene.fog.color.copy(fogDay).lerp(fogDusk, t);
    waterU.uFog.value.lerpVectors(fogVDay, fogVDusk, t);
    waterU.uDusk.value = t * .5;
    pollenU.uDusk.value = t;
    sun.intensity = 2.4 - t * 1.1;
    sun.color.copy(sunDay).lerp(sunDusk, t);
    if (!lightsOn) { mats.glass.emissiveIntensity = t * 1.2; warm.intensity = t * 5; }
  }

  // ---------- resize / visibility ----------
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < .8 ? 52 : 36;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3(), flock = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;

    waterU.uTime.value = t;
    pollenU.uTime.value = t;
    smooth.lerp(mouse, 1 - Math.pow(.001, dt));

    // dusk + camera follow the scroll
    const s = state.scroll;
    state.dusk = Math.min(1, s * 1.4);
    applyDusk(state.dusk);

    const i = state.intro;
    tmp.copy(camStart).lerp(camBase, i);
    tmp.x += smooth.x * 2.2 * i;
    tmp.y += smooth.y * 1.0 * i - s * 3.2;
    tmp.z -= s * 12;
    camera.position.copy(tmp);
    look.set(smooth.x * .6, LOOK_Y - s * 4.5, 0);
    camera.lookAt(look);
    world.rotation.y = Math.sin(t * .08) * .06 + s * .5;

    swayers.forEach(tr => { tr.rotation.z = Math.sin(t * 1.1 + tr.userData.phase) * .035; });
    clouds.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > 110) c.position.x = -110; });
    boat.position.y = .05 + Math.sin(t * 1.4) * .08; boat.rotation.z = Math.sin(t * 1.1) * .05;

    flock.set(((t * 4) % 220) - 110, 19 + Math.sin(t * .4) * 1.5, -45);
    birds.forEach(b => {
      const f = Math.sin(t * 9 + b.userData.phase) * .7;
      b.userData.l.rotation.z = f; b.userData.r.rotation.z = -f;
      b.position.copy(flock).add(b.userData.off);
      b.rotation.y = Math.PI / 2;
    });

    renderer.render(scene, camera);
  }

  // first frame, then tell the page we're ready
  renderer.render(scene, camera);
  frame();
  requestAnimationFrame(ready);

  window.DriftScene = {
    intro() {
      if (reduce || !window.gsap) { state.intro = 1; return; }
      gsap.to(state, { intro: 1, duration: 3, ease: 'power3.inOut' });
    }
  };
}
