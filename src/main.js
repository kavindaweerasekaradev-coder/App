import './style.css';
import { mountHeroArt } from './hero-art.js';

const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  menu.classList.toggle('is-open', !open);
});

mountHeroArt(document.getElementById('cat-stage'));
