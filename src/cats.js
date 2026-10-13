import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/*
 * A crowd of soft, toy-like 3D cats built entirely from primitives.
 * They pop up on load, breathe, blink, twitch their ears, follow the
 * cursor and react with hearts when you click ("pet") them.
 */

const SPHERE = new THREE.SphereGeometry(1, 48, 32);
const HALF_SPHERE = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
const EAR = new THREE.ConeGeometry(1, 1, 40, 1);
const WHISKER = new THREE.CylinderGeometry(0.006, 0.012, 1, 6);
const LIMB = new THREE.CapsuleGeometry(1, 1, 8, 24);

// Caps that sit on the eyeball surface (iris / pupil), facing +Z.
const capGeometry = (radius, angle) =>
  new THREE.SphereGeometry(radius, 40, 16, 0, Math.PI * 2, 0, angle).rotateX(Math.PI / 2);
const EYE_R = 0.3;
const IRIS = capGeometry(EYE_R * 1.004, 0.66);
const PUPIL = capGeometry(EYE_R * 1.008, 0.4);

const materials = new Map();
function furMat(color, opts = {}) {
  const key = `${color}-${JSON.stringify(opts)}`;
  if (!materials.has(key)) {
    materials.set(
      key,
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.62,
        sheen: 0.7,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35),
        ...opts,
      }),
    );
  }
  return materials.get(key);
}

const glossy = (color) => furMat(color, { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0 });
const MAT = {
  eyeWhite: glossy('#ffffff'),
  pupil: glossy('#0d0d14'),
  noseLine: furMat('#3a2326', { sheen: 0 }),
  mouth: furMat('#5c1c26', { sheen: 0, roughness: 0.4 }),
  tongue: furMat('#ff7f93', { sheen: 0, roughness: 0.35 }),
  highlight: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  gold: new THREE.MeshPhysicalMaterial({ color: '#ffc845', metalness: 1, roughness: 0.25 }),
};

function blob(parent, material, pos, scale, geo = SPHERE) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  if (typeof scale === 'number') m.scale.setScalar(scale);
  else m.scale.set(...scale);
  parent.add(m);
  return m;
}

/* -------------------------------------------------------------------------- */
/*                                Cat factory                                 */
/* -------------------------------------------------------------------------- */

// Ellipsoids that form the face surface; used to lay the mouth line on it.
const MUZZLE_L = { c: [-0.15, -0.3, 0.8], s: [0.25, 0.2, 0.2] };
const MUZZLE_R = { c: [0.15, -0.3, 0.8], s: [0.25, 0.2, 0.2] };
const CHIN = { c: [0, -0.46, 0.72], s: [0.2, 0.15, 0.16] };

function surfaceZ(x, y, shapes) {
  let z = 0;
  for (const { c, s } of shapes) {
    const k = 1 - ((x - c[0]) / s[0]) ** 2 - ((y - c[1]) / s[1]) ** 2;
    if (k > 0) z = Math.max(z, c[2] + s[2] * Math.sqrt(k));
  }
  return z + 0.012;
}

function tube(parent, points2d, radius, material, shapes) {
  const pts = points2d.map(([x, y]) => new THREE.Vector3(x, y, surfaceZ(x, y, shapes)));
  const curve = new THREE.CatmullRomCurve3(pts);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 8, false), material);
  parent.add(mesh);
  // Round caps on the line ends.
  for (const p of [pts[0], pts[pts.length - 1]]) blob(parent, material, p.toArray(), radius);
  return mesh;
}

function buildEye(head, side, iris) {
  const eye = new THREE.Group();
  eye.position.set(side * 0.37, 0.07, 0.69);
  eye.rotation.set(-0.06, side * 0.36, 0);
  head.add(eye);

  blob(eye, MAT.eyeWhite, [0, 0, 0], EYE_R);

  // Iris + pupil rotate together to look around.
  const look = new THREE.Group();
  eye.add(look);
  look.add(new THREE.Mesh(IRIS, glossy(iris)));
  look.add(new THREE.Mesh(PUPIL, MAT.pupil));

  // Highlights stay put so they read as reflections of the key light.
  blob(eye, MAT.highlight, [0.09, 0.11, 0.26], 0.06);
  blob(eye, MAT.highlight, [-0.07, -0.08, 0.28], 0.025);
  return { eye, look };
}

function buildEar(head, side, fur, inner) {
  const ear = new THREE.Group();
  ear.position.set(side * 0.58, 0.7, -0.05);
  ear.rotation.set(-0.12, side * -0.15, side * -0.42);
  head.add(ear);

  blob(ear, fur, [0, 0.3, 0], [0.38, 0.7, 0.19], EAR);
  blob(ear, inner, [0, 0.26, 0.09], [0.25, 0.48, 0.1], EAR);
  return ear;
}

function buildPaw(parent, side, fur, pad) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.85, -1.45, 0.25);
  parent.add(arm);

  const reach = new THREE.Group();
  reach.rotation.z = side * -0.35;
  arm.add(reach);
  blob(reach, fur, [0, 0.75, 0], [0.27, 0.6, 0.27], LIMB);
  const paw = blob(reach, fur, [0, 1.55, 0.04], [0.38, 0.36, 0.3]);
  // Toe beans facing the viewer.
  const bean = (x, y, s) => blob(reach, pad, [x, 1.55 + y, 0.32], [s, s * 1.1, s * 0.5]);
  bean(0, -0.06, 0.13);
  bean(-0.2, 0.12, 0.065);
  bean(-0.07, 0.2, 0.065);
  bean(0.07, 0.2, 0.065);
  bean(0.2, 0.12, 0.065);
  return { arm, reach, paw };
}

function buildCat(cfg) {
  const fur = furMat(cfg.fur);
  const cream = furMat(cfg.cream ?? '#fff8ef');
  const dark = furMat(cfg.stripes ?? cfg.fur);
  const pink = furMat(cfg.pink ?? '#ffa9b5', { sheen: 0.3 });

  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  // Body + chest fluff.
  blob(bob, fur, [0, -1.85, -0.2], [1.12, 1.3, 0.95]);
  blob(bob, fur, [0, -3.4, -0.2], [1.12, 1.9, 0.95]); // keeps the body running off-frame
  blob(bob, cream, [0, -1.4, 0.45], [0.5, 0.6, 0.36]);

  const head = new THREE.Group();
  bob.add(head);

  blob(head, fur, [0, 0, 0], [1.12, 0.97, 0.98]);
  // Fluffy cheeks widen the lower face.
  blob(head, fur, [-0.5, -0.32, 0.22], [0.5, 0.4, 0.5]);
  blob(head, fur, [0.5, -0.32, 0.22], [0.5, 0.4, 0.5]);

  const faceShapes = [MUZZLE_L, MUZZLE_R, CHIN];
  const muzzleMat = cfg.mask ? dark : cream;
  if (cfg.mask) blob(head, dark, [0, -0.08, 0.5], [0.74, 0.6, 0.56]);
  if (cfg.blaze) blob(head, cream, [0, 0.12, 0.75], [0.16, 0.5, 0.2]);
  for (const s of faceShapes) blob(head, s === CHIN ? cream : muzzleMat, s.c, s.s);

  // Pattern details.
  if (cfg.pattern === 'tabby') {
    const stripe = (x, y, z, rz, len) => {
      const m = blob(head, dark, [x, y, z], [0.045, len, 0.06]);
      m.rotation.set(-0.6, 0, rz);
    };
    stripe(0, 0.66, 0.72, 0, 0.16);
    stripe(-0.17, 0.62, 0.74, 0.3, 0.13);
    stripe(0.17, 0.62, 0.74, -0.3, 0.13);
    for (const side of [-1, 1]) {
      const c1 = blob(head, dark, [side * 0.98, -0.05, 0.3], [0.05, 0.13, 0.08]);
      c1.rotation.z = side * 1.25;
      const c2 = blob(head, dark, [side * 0.97, -0.22, 0.32], [0.045, 0.11, 0.08]);
      c2.rotation.z = side * 1.35;
    }
  } else if (cfg.pattern === 'calico') {
    blob(head, furMat('#2f2a2b'), [-0.5, 0.52, 0.45], [0.42, 0.34, 0.42]);
    blob(head, furMat('#f39a4a'), [0.55, 0.45, 0.4], [0.44, 0.38, 0.45]);
  }

  // Nose: soft rounded triangle + philtrum line.
  const nose = blob(head, pink, [0, -0.16, 0.98], [0.1, 0.07, 0.07]);
  nose.rotation.x = -0.3;
  tube(
    head,
    [
      [0, -0.22],
      [0, -0.33],
    ],
    0.014,
    MAT.noseLine,
    faceShapes,
  );
  tube(
    head,
    [
      [-0.25, -0.38],
      [-0.12, -0.43],
      [0, -0.33],
      [0.12, -0.43],
      [0.25, -0.38],
    ],
    0.014,
    MAT.noseLine,
    faceShapes,
  );
  if (cfg.mouth === 'open') {
    blob(head, MAT.mouth, [0, -0.5, 0.82], [0.18, 0.13, 0.09]);
    blob(head, MAT.tongue, [0, -0.56, 0.86], [0.12, 0.06, 0.06]);
  }

  // Whiskers.
  const whiskerMat = furMat(cfg.whiskers ?? '#ffffff', { sheen: 0 });
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(WHISKER, whiskerMat);
      w.position.set(side * 0.72, -0.28 + (1 - i) * 0.07, 0.72);
      w.scale.y = 0.85;
      w.rotation.set(0, side * 0.35, side * (Math.PI / 2 + (i - 1) * 0.16));
      head.add(w);
    }
  }

  const eyes = [buildEye(head, -1, cfg.iris), buildEye(head, 1, cfg.iris)];
  const ears = [
    buildEar(head, -1, cfg.mask ? dark : fur, pink),
    buildEar(head, 1, cfg.mask ? dark : fur, pink),
  ];

  // Accessories.
  if (cfg.glasses) {
    const frame = furMat(cfg.glasses, { roughness: 0.3, clearcoat: 1, sheen: 0 });
    // Mounted on the head (not the eye) so the frames don't squash when blinking.
    for (const { eye } of eyes) {
      const mount = new THREE.Group();
      mount.position.copy(eye.position);
      mount.rotation.copy(eye.rotation);
      head.add(mount);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(EYE_R + 0.05, 0.035, 12, 48), frame);
      ring.position.z = EYE_R * 0.8;
      mount.add(ring);
    }
    const bridge = blob(head, frame, [0, 0.12, 1.02], [0.12, 0.03, 0.03]);
    bridge.rotation.z = Math.PI / 2;
    bridge.geometry = LIMB;
    bridge.scale.set(0.03, 0.06, 0.03);
  }

  if (cfg.collar) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.1, 16, 64),
      furMat(cfg.collar, { sheen: 0.2, roughness: 0.45 }),
    );
    collar.position.set(0, -1.02, -0.14);
    collar.rotation.x = Math.PI / 2 - 0.2;
    collar.scale.set(0.76, 0.66, 0.75);
    bob.add(collar);
    blob(bob, MAT.gold, [0, -1.2, 0.56], 0.12);
  }

  if (cfg.bow) {
    const bowMat = furMat(cfg.bow, { sheen: 0.4 });
    const bow = new THREE.Group();
    bow.position.set(0.35, 0.82, 0.38);
    bow.rotation.set(-0.3, 0, -0.45);
    head.add(bow);
    for (const side of [-1, 1]) {
      const wing = blob(bow, bowMat, [side * 0.17, 0, 0], [0.13, 0.18, 0.08], EAR);
      wing.rotation.z = side * (Math.PI / 2);
    }
    blob(bow, bowMat, [0, 0, 0.03], 0.07);
  }

  if (cfg.cap) {
    const capMat = furMat(cfg.cap, { sheen: 0.3 });
    const cap = new THREE.Group();
    cap.position.set(0, 0.55, -0.05);
    cap.rotation.set(-0.25, 0, 0.12);
    head.add(cap);
    blob(cap, capMat, [0, 0, 0], [0.7, 0.55, 0.72], HALF_SPHERE);
    const brim = blob(cap, capMat, [0, 0.03, 0.62], [0.55, 0.05, 0.42]);
    brim.rotation.x = 0.12;
    blob(cap, furMat('#ffffff'), [0, 0.55, 0], 0.08);
  }

  const paw = cfg.paw ? buildPaw(bob, cfg.paw, fur, pink) : null;

  return { root, bob, head, eyes, ears, paw };
}

/* -------------------------------------------------------------------------- */
/*                                  The crowd                                 */
/* -------------------------------------------------------------------------- */

const CROWD = [
  // back row
  { at: [-5.1, 0.55, -2.6], s: 1.0, fur: '#9aa3b5', stripes: '#6b7488', pattern: 'tabby', iris: '#57b36b', cap: '#ffb703', whiskers: '#eef1f6' },
  { at: [-1.5, 1.0, -3.4], s: 0.95, fur: '#f7f1e8', cream: '#ffffff', iris: '#4aa3ff', pattern: 'calico', bow: '#ff6f91' },
  { at: [1.9, 0.9, -3.0], s: 0.98, fur: '#f1e6d4', stripes: '#7a5a46', mask: true, iris: '#3f8cff', whiskers: '#f3ede4' },
  { at: [5.3, 0.45, -2.4], s: 1.02, fur: '#2b2b33', stripes: '#2b2b33', iris: '#f5c518', collar: '#2ec4b6', whiskers: '#f0f0f0' },
  // front row
  { at: [-7.3, -0.9, -0.4], s: 1.25, fur: '#f5a04f', stripes: '#c8692a', pattern: 'tabby', iris: '#7cc35a', paw: -1, collar: '#3a86ff' },
  { at: [-3.6, -1.15, 0.7], s: 1.3, fur: '#c7c9d1', stripes: '#8c8f9c', pattern: 'tabby', iris: '#f2a33a', glasses: '#2d3142', mouth: 'open' },
  { at: [0.1, -1.45, 1.8], s: 1.45, fur: '#f7923a', stripes: '#c9581c', pattern: 'tabby', iris: '#4fae64', glasses: '#ff6fa8', mouth: 'open', collar: '#ffffff' },
  { at: [3.8, -1.1, 0.8], s: 1.3, fur: '#34343d', stripes: '#34343d', iris: '#ffcf3f', mouth: 'open', collar: '#ef476f', whiskers: '#f5f5f5' },
  { at: [7.4, -0.85, -0.3], s: 1.25, fur: '#e9e1d6', cream: '#ffffff', iris: '#8a5cff', pattern: 'calico', paw: 1 },
];

export function mountCatStage(container) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    container.classList.add('no-webgl');
    return;
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  scene.add(new THREE.HemisphereLight('#ffffff', '#ffd9bf', 0.55));
  const key = new THREE.DirectionalLight('#fff3e6', 2.4);
  key.position.set(4, 7, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#d6e6ff', 2.0);
  rim.position.set(-6, 5, -8);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const lookTarget = new THREE.Vector3(0, -0.25, 0);

  const cats = CROWD.map((cfg, i) => {
    const cat = buildCat(cfg);
    cat.root.position.set(...cfg.at);
    cat.root.scale.setScalar(cfg.s);
    cat.home = new THREE.Vector3(...cfg.at);
    cat.index = i;
    cat.phase = Math.random() * Math.PI * 2;
    cat.nextBlink = 1 + Math.random() * 3;
    cat.blink = 0;
    cat.nextTwitch = 2 + Math.random() * 5;
    cat.twitch = 0;
    cat.twitchEar = 0;
    cat.jump = 0;
    cat.hover = 0;
    cat.yaw = 0;
    cat.pitch = 0;
    cat.root.traverse((o) => (o.userData.cat = cat));
    scene.add(cat.root);
    return cat;
  });

  /* ---------------------------- Sizing ---------------------------- */

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the crowd width on wide screens, focus the middle cats on phones.
    const narrow = camera.aspect < 1.1;
    const needWidth = narrow ? 9 : 19;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(narrow ? 12 : 15, needWidth / (2 * Math.tan(halfFov) * camera.aspect));
    // Keep the bottom edge cutting through the front row's chests.
    const halfHeight = dist * Math.tan(halfFov);
    lookTarget.y = narrow ? -1.1 : Math.max(-0.25, halfHeight - 4.4);
    camera.position.set(0, lookTarget.y + 0.65, dist);
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  /* --------------------------- Interaction -------------------------- */

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const gaze = new THREE.Vector3(0, 1, 10);
  let pointerActive = false;
  let hovered = null;

  function updatePointer(e) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerActive = true;
  }

  function pick() {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(scene.children, true)[0];
    return hit ? hit.object.userData.cat : null;
  }

  window.addEventListener('pointermove', (e) => {
    updatePointer(e);
    hovered = pick();
    container.style.cursor = hovered ? 'pointer' : '';
  });
  document.addEventListener('pointerleave', () => {
    pointerActive = false;
    hovered = null;
  });

  container.addEventListener('pointerdown', (e) => {
    updatePointer(e);
    const cat = pick();
    if (!cat) return;
    cat.jump = 1;
    cat.blink = 1;
    const r = container.getBoundingClientRect();
    for (let i = 0; i < 5; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = ['💖', '🧡', '💛', '🐟', '✨'][i];
      heart.style.left = `${e.clientX - r.left}px`;
      heart.style.top = `${e.clientY - r.top}px`;
      heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      heart.style.setProperty('--rot', `${(Math.random() - 0.5) * 60}deg`);
      heart.style.animationDelay = `${i * 60}ms`;
      container.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove());
    }
  });

  /* ---------------------------- Animation --------------------------- */

  const timer = new THREE.Timer();
  const tmp = new THREE.Vector3();
  const easeOutBack = (x) => {
    const c1 = 1.9;
    const c3 = c1 + 1;
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
  };

  function update(t, dt) {
    // Where the cats look: the cursor projected in front of them, or a lazy wander.
    if (pointerActive) {
      gaze.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
      const k = (8 - camera.position.z) / gaze.z;
      gaze.multiplyScalar(k).add(camera.position);
    } else {
      gaze.set(Math.sin(t * 0.4) * 6, 1.5 + Math.sin(t * 0.7) * 1.5, 8);
    }

    for (const cat of cats) {
      const { root, bob, head, eyes, ears, paw } = cat;
      const ph = cat.phase;

      // Pop-up intro, staggered.
      const intro = THREE.MathUtils.clamp((t - 0.15 - cat.index * 0.09) / 1.1, 0, 1);
      const rise = reduceMotion ? 1 : easeOutBack(intro);

      // Petting jump.
      cat.jump = Math.max(0, cat.jump - dt * 1.8);
      const hop = Math.sin((1 - cat.jump) * Math.PI) * (cat.jump > 0 ? 0.55 : 0);

      cat.hover = THREE.MathUtils.lerp(cat.hover, hovered === cat ? 1 : 0, 1 - Math.exp(-dt * 10));

      root.position.y = cat.home.y - 7 * (1 - rise) + hop;
      const squash = 1 + Math.sin(t * 2.2 + ph) * 0.012 + cat.hover * 0.04;
      bob.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      bob.rotation.z = Math.sin(t * 0.9 + ph) * 0.035;
      bob.position.y = Math.sin(t * 1.6 + ph) * 0.03;

      // Head tracks the gaze target.
      head.getWorldPosition(tmp);
      tmp.subVectors(gaze, tmp);
      const yaw = THREE.MathUtils.clamp(Math.atan2(tmp.x, tmp.z), -0.6, 0.6);
      const pitch = THREE.MathUtils.clamp(-Math.atan2(tmp.y, Math.hypot(tmp.x, tmp.z)), -0.45, 0.35);
      const follow = 1 - Math.exp(-dt * (pointerActive ? 4 : 1.5));
      cat.yaw += (yaw - cat.yaw) * follow;
      cat.pitch += (pitch - cat.pitch) * follow;
      head.rotation.set(cat.pitch * 0.7, cat.yaw * 0.7, Math.sin(t * 0.8 + ph) * 0.06 + cat.hover * 0.18);

      // Eyes look a bit further than the head turns.
      cat.blink = Math.max(0, cat.blink - dt * 7);
      cat.nextBlink -= dt;
      if (cat.nextBlink <= 0) {
        cat.blink = 1;
        cat.nextBlink = 2 + Math.random() * 4;
      }
      const lid = cat.blink > 0 ? 1 - Math.sin(cat.blink * Math.PI) * 0.92 : 1;
      for (const { eye, look } of eyes) {
        look.rotation.set(cat.pitch * 0.45, cat.yaw * 0.45, 0);
        eye.scale.y = lid * (1 - cat.hover * 0.12);
      }

      // Ear twitches.
      cat.nextTwitch -= dt;
      if (cat.nextTwitch <= 0) {
        cat.twitch = 1;
        cat.twitchEar = Math.random() < 0.5 ? 0 : 1;
        cat.nextTwitch = 3 + Math.random() * 6;
      }
      cat.twitch = Math.max(0, cat.twitch - dt * 4);
      ears.forEach((ear, i) => {
        const side = i === 0 ? -1 : 1;
        const flick = i === cat.twitchEar ? Math.sin(cat.twitch * Math.PI * 2) * 0.35 : 0;
        ear.rotation.z = side * -0.42 + side * flick - side * cat.hover * 0.12;
      });

      // Raised paws wave every few seconds.
      if (paw) {
        const side = Math.sign(paw.arm.position.x);
        const cycle = (t + ph) % 5;
        const wave = cycle < 1.6 ? Math.sin(cycle * Math.PI * 3.75) * 0.28 * Math.sin((cycle / 1.6) * Math.PI) : 0;
        paw.reach.rotation.z = side * -0.35 + wave;
      }
    }
  }

  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(container);

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 1 / 20);
    const t = timer.getElapsed();
    if (visible) {
      update(t, dt);
      renderer.render(scene, camera);
    }
    if (!reduceMotion || t < 0.5) requestAnimationFrame(frame);
  }

  // Render once before showing the canvas so it fades in fully formed.
  update(0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(() => container.classList.add('is-ready'));
  frame();

  // Expose for debugging / screenshots.
  return { renderer, scene, camera, cats };
}
