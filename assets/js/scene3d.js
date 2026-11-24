// Immersive hero world (Three.js), drawn behind the hero content:
// a soft sky with drifting low-poly clouds and a striped hot-air balloon, layered hills,
// a lagoon that ripples where the pointer moves (and splashes on click), an island cabin
// with swaying trees, a sailboat, lily pads, birds and floating pollen.
// On load the camera descends through the clouds; scrolling glides it toward the island.
// Pauses off-screen; renders a single still frame for reduced motion.
import * as THREE from './vendor/three.module.min.js';

const host = document.querySelector('.hero-scene');
const hero = document.querySelector('.hero');
if (host && hero) init();

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);
  host.appendChild(renderer.domElement);

  const HORIZON = 0xfff3e4;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(HORIZON, 18, 52);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
  const look = new THREE.Vector3(0, 1.0, 0);
  const camBase = new THREE.Vector3(0, 3.2, 17);
  const intro = { k: reduce ? 1 : 0 }; // 0 = up in the clouds, 1 = settled

  scene.add(new THREE.HemisphereLight(0xf4fbff, 0x2f6b4f, 1.15));
  const sunLight = new THREE.DirectionalLight(0xfff0d6, 1.7);
  sunLight.position.set(-8, 10, 6);
  scene.add(sunLight);

  const flat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.9, metalness: 0 }, extra || {}));
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Sun
  const sun = new THREE.Group();
  sun.add(new THREE.Mesh(new THREE.CircleGeometry(4.6, 48), new THREE.MeshBasicMaterial({ color: 0xffe3c4, fog: false, transparent: true, opacity: 0.5 })));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshBasicMaterial({ color: 0xffbf80, fog: false }));
  disc.position.z = 0.05;
  sun.add(disc);
  sun.position.set(-4, 2.6, -32); sun.scale.setScalar(0.8);
  scene.add(sun);

  // Hill ridges, paler with distance
  function ridge(z, width, height, seed, color) {
    const seg = small ? 40 : 70;
    const g = new THREE.PlaneGeometry(width, height * 2.4, seg, 6);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const top = (y + height * 1.2) / (height * 2.4);
      const n = Math.sin(x * 0.23 + seed) * 0.55 + Math.sin(x * 0.61 + seed * 2.1) * 0.25 + Math.sin(x * 1.37 + seed * 0.7) * 0.12;
      p.setY(i, -height * 1.2 + top * (height * (0.62 + n * 0.38) + height * 1.2));
      p.setZ(i, Math.sin(x * 0.9 + y + seed) * 0.15);
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, flat(color));
    m.position.set(0, -0.6, z);
    scene.add(m);
  }
  ridge(-26, 100, 5.2, 1.3, 0xbfe0cf);
  ridge(-19, 90, 3.8, 4.2, 0x84c4a0);
  ridge(-12, 80, 2.6, 7.7, 0x3f8f6a);

  // Clouds: clusters of faceted puffs
  const clouds = [];
  const cloudMat = flat(0xffffff, { emissive: 0xeef6ff, emissiveIntensity: 0.55, transparent: true, opacity: 0.92, fog: false });
  function cloud(x, y, z, s) {
    const c = new THREE.Group();
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.7, 1.2), 1), cloudMat);
      puff.position.set((i - n / 2) * 0.9 + rnd(-0.2, 0.2), rnd(-0.1, 0.5) * (i % 2 ? 1 : 0.4), rnd(-0.3, 0.3));
      puff.scale.y = 0.75;
      c.add(puff);
    }
    c.scale.setScalar(s);
    c.position.set(x, y, z);
    c.userData.speed = rnd(0.004, 0.009);
    scene.add(c);
    clouds.push(c);
  }
  [[-16, 9, -22, 1.1], [-3, 11, -28, 1.4], [12, 8.5, -24, 1.2], [22, 11, -30, 1.5], [-24, 12, -32, 1.6],
   [4, 14, -8, 0.9], [-9, 17, 2, 1.1], [9, 19, 10, 1.0], [-3, 21, 18, 1.2]].forEach((a) => cloud(a[0], a[1], a[2], a[3]));

  // Hot-air balloon with lime / orange / white stripes
  const balloon = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12, a = t * Math.PI;
    prof.push(new THREE.Vector2(Math.sin(a) * (1 - t * 0.35) * 1.1 + (t > 0.85 ? 0 : 0) + 0.05, -Math.cos(a) * 1.3));
  }
  const env = new THREE.LatheGeometry(prof, 12);
  const cols = [], cA = new THREE.Color(0xd4f55c), cB = new THREE.Color(0xff7a45), cC = new THREE.Color(0xffffff);
  const ep = env.attributes.position;
  for (let i = 0; i < ep.count; i++) {
    const ang = Math.atan2(ep.getZ(i), ep.getX(i)), band = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * 12) % 3;
    const c = band === 0 ? cA : band === 1 ? cB : cC;
    cols.push(c.r, c.g, c.b);
  }
  env.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const envMesh = new THREE.Mesh(env.toNonIndexed(), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 }));
  envMesh.rotation.x = Math.PI;
  envMesh.position.y = 1.3;
  balloon.add(envMesh);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.42), flat(0x8a5a3a));
  basket.position.y = -0.55;
  balloon.add(basket);
  const ropeGeo = new THREE.BufferGeometry();
  ropeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.2, -0.4, -0.2, -0.55, 0.25, -0.55, 0.2, -0.4, -0.2, 0.55, 0.25, -0.55,
    -0.2, -0.4, 0.2, -0.55, 0.25, 0.55, 0.2, -0.4, 0.2, 0.55, 0.25, 0.55], 3));
  balloon.add(new THREE.LineSegments(ropeGeo, new THREE.LineBasicMaterial({ color: 0x6b4a32 })));
  balloon.scale.setScalar(small ? 0.8 : 1);
  balloon.position.set(small ? 4.2 : 11.5, small ? 10.5 : 9.2, -6);
  scene.add(balloon);

  // Water with waves + pointer ripples
  const wSegX = small ? 56 : 100, wSegY = small ? 28 : 48;
  const waterGeo = new THREE.PlaneGeometry(110, 60, wSegX, wSegY);
  waterGeo.rotateX(-Math.PI / 2);
  const wPos = waterGeo.attributes.position;
  const wBase = new Float32Array(wPos.count * 2);
  for (let i = 0; i < wPos.count; i++) { wBase[i * 2] = wPos.getX(i); wBase[i * 2 + 1] = wPos.getZ(i); }
  const water = new THREE.Mesh(waterGeo, flat(0x6fd0cd, { roughness: 0.28, metalness: 0.04 }));
  water.position.set(0, -0.35, 6);
  scene.add(water);
  const ripples = [];

  // Lily pads
  for (let i = 0; i < 6; i++) {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.18, 0.3), 9, 0.3, Math.PI * 1.85), flat(0x9bd66b));
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(rnd(-7, -2), -0.28, rnd(3, 6));
    scene.add(pad);
  }

  // Island
  const island = new THREE.Group();
  const groundGeo = new THREE.IcosahedronGeometry(3, 2); groundGeo.scale(1.45, 0.32, 1);
  island.add(new THREE.Mesh(groundGeo, flat(0x5fae5a)));
  const shoreGeo = new THREE.IcosahedronGeometry(3.25, 2); shoreGeo.scale(1.45, 0.18, 1.02);
  const shore = new THREE.Mesh(shoreGeo, flat(0xe9d7a6)); shore.position.y = -0.18;
  island.add(shore);

  const cabin = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.1), flat(0xffffff, { emissive: 0x666666, emissiveIntensity: 0.3 }));
  walls.position.y = 0.45; cabin.add(walls);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x2f6bff, roughness: 0.2, metalness: 0.3, emissive: 0x1d4fd8, emissiveIntensity: 0.35 });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), glassMat);
  glass.position.set(0, 0.45, 0.556); cabin.add(glass);
  const roofGeo = new THREE.CylinderGeometry(0.01, 1.05, 0.75, 4, 1); roofGeo.rotateY(Math.PI / 4); roofGeo.scale(1.15, 1, 0.85);
  const roof = new THREE.Mesh(roofGeo, flat(0xd4f55c)); roof.position.y = 1.27; cabin.add(roof);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 0.16), flat(0x8a5a3a)); chimney.position.set(0.4, 1.45, -0.1); cabin.add(chimney);
  cabin.position.set(0.4, 0.55, 0.2); cabin.rotation.y = -0.35;
  island.add(cabin);

  // Chimney smoke puffs
  const smoke = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), flat(0xffffff, { transparent: true, opacity: 0.8 }));
    s.userData.off = i / 6;
    island.add(s); smoke.push(s);
  }

  const trees = [];
  function tree(x, z, s, color) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5), flat(0x7a5236));
    trunk.position.y = 0.25; t.add(trunk);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.55 - k * 0.12, 0.8, 6), flat(color));
      c.position.y = 0.7 + k * 0.38; t.add(c);
    }
    t.scale.setScalar(s); t.position.set(x, 0.55, z);
    t.userData.phase = Math.random() * Math.PI * 2;
    island.add(t); trees.push(t);
  }
  tree(-2.4, -0.3, 1.25, 0x2f7d4f); tree(-1.7, 0.6, 0.9, 0x3e9a5c); tree(2.3, -0.5, 1.1, 0x2f7d4f);
  tree(3.0, 0.4, 0.75, 0x56b870); tree(-3.1, 0.5, 0.7, 0x56b870);
  [[1.6, 0.9, 0.32], [-0.9, 1.0, 0.26], [2.6, 1.1, 0.22], [-2.2, 1.3, 0.2]].forEach(([x, z, r]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), flat(0x9bd66b)); b.position.set(x, 0.62, z); island.add(b);
  });
  for (let i = 0; i < 9; i++) {
    const a = -0.9 + i * 0.22;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4), flat(0x3a9a5f));
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), flat(i % 2 ? 0xff7a45 : 0xffb13d));
    const x = Math.cos(a) * 3.3 - 0.4, z = Math.sin(a) * 0.9 + 1.0;
    st.position.set(x, 0.75, z); fl.position.set(x, 1.05, z);
    island.add(st); island.add(fl);
  }
  island.position.set(small ? 0.6 : 2.4, 0, 0);
  scene.add(island);

  // Sailboat
  const boat = new THREE.Group();
  const hullGeo = new THREE.CylinderGeometry(0.42, 0.28, 0.2, 6, 1); hullGeo.scale(1.8, 1, 0.7);
  boat.add(new THREE.Mesh(hullGeo, flat(0xff7a45)));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), flat(0x7a5236)); mast.position.y = 0.5; boat.add(mast);
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.15, 0, 0, 0.9, 0, 0.55, 0.2, 0], 3));
  sailGeo.computeVertexNormals();
  boat.add(new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true })));
  boat.position.set(small ? -2.4 : -4.2, -0.2, 3.2);
  scene.add(boat);

  // Pollen
  const COUNT = small ? 80 : 160;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3), pSeed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pPos[i * 3] = rnd(-14, 14); pPos[i * 3 + 1] = rnd(0, 7); pPos[i * 3 + 2] = rnd(-5, 7); pSeed[i] = Math.random() * 100;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  const dctx = dot.getContext('2d'), grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.85)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad; dctx.fillRect(0, 0, 64, 64);
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.18, map: new THREE.CanvasTexture(dot), color: 0xd4f55c, transparent: true, depthWrite: false, fog: false })));

  // Birds
  const birds = [];
  const birdMat = new THREE.LineBasicMaterial({ color: 0x24443a, fog: false });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.35, 0, 0, 0, 0, 0, 0, 0, 0, 0.35, 0, 0], 3));
    const b = new THREE.LineSegments(g, birdMat);
    b.position.set(-8 + i * 1.2, 5 + (i % 2) * 0.6, -7 - i * 0.6);
    b.userData = { phase: i * 1.7, speed: 0.55 + i * 0.07 };
    scene.add(b); birds.push(b);
  }

  // Layout: the canvas covers the whole hero; the horizon sits near the hero-land band
  const band = document.querySelector('.hero-land');
  let W = 1, H = 1;
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    const hr = hero.getBoundingClientRect(), br = band ? band.getBoundingClientRect() : null;
    const f = br ? Math.min(0.8, Math.max(0.45, (br.top - hr.top + br.height * 0.42) / hr.height)) : 0.62;
    // render the top part of a taller virtual frustum so the scene's centre lands at fraction f
    const fullH = H * 2 * f;
    camera.aspect = W / fullH;
    camera.fov = 36;
    camera.setViewOffset(W, fullH, 0, 0, W, H);
    camera.updateProjectionMatrix();
    // keep the world a sensible size: about 30 units across on desktop, 15 on phones
    const across = W < 760 ? 15 : W < 1100 ? 22 : 30;
    const D = (across / camera.aspect) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camBase.set(0, 2.6 + D * 0.1, D);
    scene.fog.near = D + 2; scene.fog.far = D + 42;
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('load', resize);

  // Pointer: parallax, wind, ripples
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, speed: 0, inside: false }, cam = { x: 0, y: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.35), hit = new THREE.Vector3();
  let lastRipple = 0;
  function rippleAt(cx, cy, amp) {
    const r = host.getBoundingClientRect();
    if (cy < r.top || cy > r.bottom) return;
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(waterPlane, hit) && hit.z > -14 && hit.z < 12) {
      ripples.push({ x: hit.x, z: hit.z - water.position.z, t0: clock.getElapsedTime(), amp });
      if (ripples.length > 10) ripples.shift();
    }
  }
  window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1, ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.speed = Math.min(1, pointer.speed + Math.hypot(nx - pointer.x, ny - pointer.y) * 2);
    pointer.x = nx; pointer.y = ny;
    const now = performance.now();
    if (now - lastRipple > 140) { lastRipple = now; rippleAt(e.clientX, e.clientY, 0.12); }
  }, { passive: true });
  hero.addEventListener('pointerdown', (e) => { if (!e.target.closest('a,button')) rippleAt(e.clientX, e.clientY, 0.35); });

  let scrollK = 0;
  function onScroll() {
    const r = hero.getBoundingClientRect();
    scrollK = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    pointer.speed *= 0.94;

    for (let i = 0; i < wPos.count; i++) {
      const x = wBase[i * 2], z = wBase[i * 2 + 1];
      let y = Math.sin(x * 0.45 + t * 0.9) * 0.08 + Math.cos(z * 0.6 + t * 0.7) * 0.07 + Math.sin((x + z) * 0.9 + t * 1.3) * 0.03;
      for (let k = 0; k < ripples.length; k++) {
        const rp = ripples[k], age = t - rp.t0, d = Math.hypot(x - rp.x, z - rp.z);
        if (d < age * 5 + 0.5) y += rp.amp * Math.sin(d * 2.4 - age * 7) * Math.exp(-d * 0.3) * Math.exp(-age * 0.9);
      }
      wPos.setY(i, y);
    }
    while (ripples.length && t - ripples[0].t0 > 4) ripples.shift();
    wPos.needsUpdate = true;
    waterGeo.computeVertexNormals();

    const wind = 0.04 + pointer.speed * 0.12;
    trees.forEach((tr) => { tr.rotation.z = Math.sin(t * 1.1 + tr.userData.phase) * wind; });
    island.position.y = Math.sin(t * 0.6) * 0.04;
    smoke.forEach((s) => {
      const k = (t * 0.25 + s.userData.off) % 1;
      s.position.set(0.55 + k * 0.6 + Math.sin(t + s.userData.off * 9) * 0.05, 2.0 + k * 1.6, 0.1);
      s.scale.setScalar(0.6 + k * 1.6); s.material.opacity = 0.8 * (1 - k);
    });
    boat.position.x += 0.004; if (boat.position.x > 10) boat.position.x = -10;
    boat.position.y = -0.2 + Math.sin(t * 1.4) * 0.05; boat.rotation.z = Math.sin(t * 1.2) * 0.06;
    balloon.position.y = (small ? 10.5 : 9.2) + Math.sin(t * 0.5) * 0.35; balloon.rotation.y = t * 0.15;
    clouds.forEach((c) => { c.position.x += c.userData.speed; if (c.position.x > 26) c.position.x = -26; });

    for (let i = 0; i < COUNT; i++) {
      const s = pSeed[i];
      pPos[i * 3 + 1] += 0.004 + (s % 1) * 0.004;
      pPos[i * 3] += Math.sin(t * 0.5 + s) * 0.003 + pointer.speed * 0.01;
      if (pPos[i * 3 + 1] > 7.5) pPos[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;
    birds.forEach((b) => {
      const d = b.userData, flapY = Math.sin(t * 6 + d.phase) * 0.18, a = b.geometry.attributes.position;
      a.setY(0, flapY); a.setY(3, flapY); a.needsUpdate = true;
      b.position.x += 0.01 * d.speed; b.position.y += Math.sin(t * 0.8 + d.phase) * 0.002;
      if (b.position.x > 14) b.position.x = -14;
    });

    cam.x += (pointer.x * 0.9 - cam.x) * 0.04;
    cam.y += (pointer.y * 0.35 - cam.y) * 0.04;
    // intro descent from the clouds, then scroll glides toward the island
    const k = intro.k, ik = 1 - k;
    camera.position.set(camBase.x + cam.x, camBase.y - cam.y + ik * 13 - scrollK * 1.2, camBase.z + ik * 10 - scrollK * 5);
    look.set(0, 1.0 + ik * 8, 0);
    camera.lookAt(look);
    renderer.render(scene, camera);
  }

  if (reduce) { frame(); host.classList.add('is-ready'); return; }

  let running = false, raf = 0;
  function loop() { frame(); raf = requestAnimationFrame(loop); }
  const io = new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !running) { running = true; loop(); }
    if (!vis && running) { running = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '100px' });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) { running = false; cancelAnimationFrame(raf); }
    else if (!document.hidden && !running && host.getBoundingClientRect().bottom > 0) { running = true; loop(); }
  });

  host.classList.add('is-ready');
  // descend through the clouds
  const start = performance.now(), DUR = 3200;
  (function descend() {
    const p = Math.min(1, (performance.now() - start) / DUR);
    intro.k = 1 - Math.pow(1 - p, 3);
    if (p < 1) requestAnimationFrame(descend);
  })();
  // a welcome splash once the camera arrives
  setTimeout(() => { ripples.push({ x: (small ? -1.5 : -3), z: 3, t0: clock.getElapsedTime(), amp: 0.3 }); }, DUR - 400);
}
