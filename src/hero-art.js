/*
 * Brings the rendered cat crowd to life: a soft 3D tilt toward the cursor,
 * gentle parallax, and a burst of hearts when you click ("pet") the cats.
 */

const HEARTS = ['💖', '🧡', '💛', '🐟', '✨'];

export function mountHeroArt(stage) {
  const art = stage.querySelector('.hero__art');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tilt: ease the art toward the pointer every frame.
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;

  function tick() {
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    art.style.setProperty('--tilt-x', current.x.toFixed(4));
    art.style.setProperty('--tilt-y', current.y.toFixed(4));
    const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;
    frame = settled ? 0 : requestAnimationFrame(tick);
  }

  function aim(x, y) {
    target.x = x;
    target.y = y;
    if (!frame) frame = requestAnimationFrame(tick);
  }

  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      aim((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    });
    document.addEventListener('pointerleave', () => aim(0, 0));
  }

  // Petting: squish the crowd and float up hearts from the click point.
  stage.addEventListener('pointerdown', (e) => {
    const r = stage.getBoundingClientRect();
    art.classList.remove('is-petted');
    void art.offsetWidth; // restart the squish animation
    art.classList.add('is-petted');

    HEARTS.forEach((emoji, i) => {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = emoji;
      heart.style.left = `${e.clientX - r.left}px`;
      heart.style.top = `${e.clientY - r.top}px`;
      heart.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      heart.style.setProperty('--rot', `${(Math.random() - 0.5) * 60}deg`);
      heart.style.animationDelay = `${i * 60}ms`;
      stage.appendChild(heart);
      heart.addEventListener('animationend', () => heart.remove());
    });
  });

  const img = art.querySelector('img');
  const ready = () => stage.classList.add('is-ready');
  if (img.complete) ready();
  else img.addEventListener('load', ready, { once: true });
}
