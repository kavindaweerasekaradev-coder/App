// Hero landscape (Three.js): a calm low-poly lagoon with an island cabin, swaying trees,
// layered hills fading into the page, a warm sun, drifting pollen and a few birds.
// Loads after the page, pauses off-screen, follows the pointer a little, and renders a
// single still frame when the visitor prefers reduced motion.
import * as THREE from './vendor/three.module.min.js';

const host = document.querySelector('.hero-land');
if (host) init(host);

function init(host) {
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

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xffffff, 16, 46);

  const camera = new THREE.PerspectiveCamera(32, 2, 0.1, 120);
  const camBase = new THREE.Vector3(0, 3.4, 17);
  camera.position.copy(camBase);
  const look = new THREE.Vector3(0, 1.1, 0);

  // Light: soft sky fill plus a warm low sun from the left
  scene.add(new THREE.HemisphereLight(0xf4fbff, 0x2f6b4f, 1.15));
  const sunLight = new THREE.DirectionalLight(0xfff0d6, 1.6);
  sunLight.position.set(-8, 10, 6);
  scene.add(sunLight);

  const flat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.9, metalness: 0 }, extra || {}));

  // Sun disc behind the hills
  const sun = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0xffc58a, fog: false, transparent: true, opacity: 0.9 }));
  sun.position.set(-7.5, 3.6, -26);
  scene.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ color: 0xffe2c2, fog: false, transparent: true, opacity: 0.45 }));
  halo.position.set(-7.5, 3.6, -26.1);
  scene.add(halo);

  // Layered hill ridges: farther ridges are paler so they melt into the white page
  function ridge(z, width, height, seed, color) {
    const seg = small ? 40 : 70;
    const g = new THREE.PlaneGeometry(width, height * 2.4, seg, 6);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const top = (y + height * 1.2) / (height * 2.4); // 0 bottom .. 1 top
      const n = Math.sin(x * 0.23 + seed) * 0.55 + Math.sin(x * 0.61 + seed * 2.1) * 0.25 + Math.sin(x * 1.37 + seed * 0.7) * 0.12;
      const crest = height * (0.62 + n * 0.38);
      p.setY(i, -height * 1.2 + top * (crest + height * 1.2));
      p.setZ(i, (Math.sin(x * 0.9 + y + seed) * 0.15));
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, flat(color));
    m.position.set(0, -0.6, z);
    scene.add(m);
    return m;
  }
  ridge(-24, 90, 4.6, 1.3, 0xb9dccb);
  ridge(-17, 80, 3.6, 4.2, 0x7fbf9c);
  ridge(-11, 70, 2.5, 7.7, 0x3f8f6a);

  // Water with gentle waves
  const wSegX = small ? 50 : 90, wSegY = small ? 24 : 40;
  const waterGeo = new THREE.PlaneGeometry(70, 30, wSegX, wSegY);
  waterGeo.rotateX(-Math.PI / 2);
  const wPos = waterGeo.attributes.position;
  const wBase = new Float32Array(wPos.count * 2);
  for (let i = 0; i < wPos.count; i++) { wBase[i * 2] = wPos.getX(i); wBase[i * 2 + 1] = wPos.getZ(i); }
  const water = new THREE.Mesh(waterGeo, flat(0x74d3d0, { roughness: 0.3, metalness: 0.02 }));
  water.position.set(0, -0.35, -3);
  scene.add(water);

  // Island
  const island = new THREE.Group();
  const groundGeo = new THREE.IcosahedronGeometry(3, 2);
  groundGeo.scale(1.45, 0.32, 1);
  const ground = new THREE.Mesh(groundGeo, flat(0x5fae5a));
  island.add(ground);
  const shoreGeo = new THREE.IcosahedronGeometry(3.25, 2);
  shoreGeo.scale(1.45, 0.18, 1.02);
  const shore = new THREE.Mesh(shoreGeo, flat(0xe9d7a6));
  shore.position.y = -0.18;
  island.add(shore);

  // Cabin: white walls, glass front, lime roof
  const cabin = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 1.1), flat(0xffffff, { emissive: 0x555555, emissiveIntensity: 0.35 }));
  walls.position.y = 0.45;
  cabin.add(walls);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x2f6bff, roughness: 0.2, metalness: 0.3, emissive: 0x0b2a66, emissiveIntensity: 0.4 }));
  glass.position.set(0, 0.45, 0.556);
  cabin.add(glass);
  const roofGeo = new THREE.CylinderGeometry(0.01, 1.05, 0.75, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.scale(1.15, 1, 0.85);
  const roof = new THREE.Mesh(roofGeo, flat(0xd4f55c));
  roof.position.y = 1.27;
  cabin.add(roof);
  cabin.position.set(0.4, 0.55, 0.2);
  cabin.rotation.y = -0.35;
  island.add(cabin);

  // Trees that sway from their base
  const trees = [];
  function tree(x, z, s, color) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5), flat(0x7a5236));
    trunk.position.y = 0.25;
    t.add(trunk);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.55 - k * 0.12, 0.8, 6), flat(color));
      c.position.y = 0.7 + k * 0.38;
      t.add(c);
    }
    t.scale.setScalar(s);
    t.position.set(x, 0.55, z);
    t.userData.phase = Math.random() * Math.PI * 2;
    island.add(t);
    trees.push(t);
  }
  tree(-2.4, -0.3, 1.25, 0x2f7d4f);
  tree(-1.7, 0.6, 0.9, 0x3e9a5c);
  tree(2.3, -0.5, 1.1, 0x2f7d4f);
  tree(3.0, 0.4, 0.75, 0x56b870);
  tree(-3.1, 0.5, 0.7, 0x56b870);
  // Round bushes
  [[1.6, 0.9, 0.32], [-0.9, 1.0, 0.26], [2.6, 1.1, 0.22], [-2.2, 1.3, 0.2]].forEach(([x, z, r]) => {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), flat(0x9bd66b));
    b.position.set(x, 0.62, z);
    island.add(b);
  });
  // Orange flower spikes, a nod to tropical torch lilies
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 5), flat(i % 2 ? 0xff7a45 : 0xffb13d));
    const a = -0.6 + i * 0.22;
    f.position.set(Math.cos(a) * 3.4 - 0.6, 0.62, Math.sin(a) * 0.9 + 0.9);
    f.rotation.z = Math.PI;
    f.rotation.x = Math.PI;
    island.add(f);
  }
  island.position.set(small ? 0.6 : 2.4, 0, 0);
  scene.add(island);

  // Small stones and a tiny boat drifting nearby
  const boat = new THREE.Group();
  const hullGeo = new THREE.CylinderGeometry(0.42, 0.28, 0.2, 6, 1);
  hullGeo.scale(1.8, 1, 0.7);
  boat.add(new THREE.Mesh(hullGeo, flat(0xff7a45)));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), flat(0x7a5236));
  mast.position.y = 0.5;
  boat.add(mast);
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.15, 0, 0, 0.9, 0, 0.55, 0.2, 0], 3));
  sailGeo.computeVertexNormals();
  boat.add(new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true })));
  boat.position.set(small ? -2.4 : -4.2, -0.2, 3.2);
  scene.add(boat);

  // Pollen / fireflies
  const COUNT = small ? 70 : 140;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3), pSeed = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 26;
    pPos[i * 3 + 1] = Math.random() * 6;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 12 + 1;
    pSeed[i] = Math.random() * 100;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  const dctx = dot.getContext('2d');
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,.85)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = grad; dctx.fillRect(0, 0, 64, 64);
  const pollen = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.16, map: new THREE.CanvasTexture(dot), color: 0xd4f55c, transparent: true, depthWrite: false, fog: false }));
  scene.add(pollen);

  // Birds: two-segment wings that flap
  const birds = [];
  const birdMat = new THREE.LineBasicMaterial({ color: 0x24443a, fog: false });
  for (let i = 0; i < 4; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.35, 0, 0, 0, 0, 0, 0, 0, 0, 0.35, 0, 0], 3));
    const b = new THREE.LineSegments(g, birdMat);
    b.position.set(-6 + i * 1.1, 4.6 + (i % 2) * 0.5, -6 - i * 0.6);
    b.userData = { phase: i * 1.7, speed: 0.55 + i * 0.07 };
    scene.add(b);
    birds.push(b);
  }

  // Size to the host
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1.6 ? 44 : 32;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Pointer parallax
  const pointer = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollK = 0;
  window.addEventListener('scroll', () => {
    const r = host.getBoundingClientRect();
    scrollK = Math.max(0, Math.min(1, 1 - (r.bottom / (window.innerHeight + r.height))));
  }, { passive: true });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();

    for (let i = 0; i < wPos.count; i++) {
      const x = wBase[i * 2], z = wBase[i * 2 + 1];
      wPos.setY(i, Math.sin(x * 0.45 + t * 0.9) * 0.08 + Math.cos(z * 0.6 + t * 0.7) * 0.07 + Math.sin((x + z) * 0.9 + t * 1.3) * 0.03);
    }
    wPos.needsUpdate = true;
    waterGeo.computeVertexNormals();

    trees.forEach((tr) => { tr.rotation.z = Math.sin(t * 1.1 + tr.userData.phase) * 0.045; });
    island.position.y = Math.sin(t * 0.6) * 0.04;
    boat.position.x += 0.004; if (boat.position.x > 9) boat.position.x = -9;
    boat.position.y = -0.2 + Math.sin(t * 1.4) * 0.05;
    boat.rotation.z = Math.sin(t * 1.2) * 0.06;

    for (let i = 0; i < COUNT; i++) {
      const s = pSeed[i];
      pPos[i * 3 + 1] += 0.004 + (s % 1) * 0.004;
      pPos[i * 3] += Math.sin(t * 0.5 + s) * 0.003;
      if (pPos[i * 3 + 1] > 6.5) pPos[i * 3 + 1] = 0;
    }
    pGeo.attributes.position.needsUpdate = true;

    birds.forEach((b) => {
      const d = b.userData, flapY = Math.sin(t * 6 + d.phase) * 0.18;
      const a = b.geometry.attributes.position;
      a.setY(0, flapY); a.setY(3, flapY); a.needsUpdate = true;
      b.position.x += 0.01 * d.speed;
      b.position.y += Math.sin(t * 0.8 + d.phase) * 0.002;
      if (b.position.x > 12) b.position.x = -12;
    });

    cam.x += (pointer.x * 0.9 - cam.x) * 0.04;
    cam.y += (pointer.y * 0.35 - cam.y) * 0.04;
    camera.position.set(camBase.x + cam.x, camBase.y - cam.y + scrollK * 1.2, camBase.z - scrollK * 2);
    camera.lookAt(look);
    renderer.render(scene, camera);
  }

  if (reduce) { frame(); return; }

  let running = false, raf = 0;
  function loop() { frame(); raf = requestAnimationFrame(loop); }
  const io = new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !running) { running = true; clock.start(); loop(); }
    if (!vis && running) { running = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '100px' });
  io.observe(host);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) { running = false; cancelAnimationFrame(raf); }
    else if (!document.hidden && !running && host.getBoundingClientRect().top < window.innerHeight) { running = true; loop(); }
  });
  host.classList.add('is-ready');
}
