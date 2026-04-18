import { driveUrl, resolvePhoto, renderTitle } from './utils.mjs';

// ── State ──────────────────────────────────────────────────────────────────
const cache = {};
let petList = [];
let activePet = null;
let lbPhotos = [];
let lbIndex = 0;
let lbTouchX = null;
let ssPhotos  = [];
let ssIndex   = 0;
let ssSlot    = 'a';   // which img slot is currently visible
let ssTimer   = null;
let ssPlaying = false;
let ssLastKb  = '';
let ssTouchX  = null;
const SS_DURATION = 5000;
const SS_KB_NAMES = ['kb1', 'kb2', 'kb3', 'kb4'];

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color || '#c9a96e');
}

// ── Data loading ───────────────────────────────────────────────────────────

async function loadJSON(url) {
  if (cache[url]) return cache[url];
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`);
  const data = await r.json();
  cache[url] = data;
  return data;
}

// ── Render helpers ─────────────────────────────────────────────────────────

function showLoading(on) {
  document.getElementById('loading').style.display = on ? 'flex' : 'none';
}

function showError(on) {
  document.getElementById('error-msg').style.display = on ? 'block' : 'none';
}

function buildTabs() {
  const tabsEl = document.getElementById('tabs');
  tabsEl.innerHTML = '';
  petList.forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.textContent = name;
    btn.addEventListener('click', () => switchPet(name));
    tabsEl.appendChild(btn);
  });
}

function updateTabs(activeName) {
  document.querySelectorAll('.tab').forEach((btn) => {
    const isActive = btn.textContent === activeName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
}

function renderProfile(cfg, petName) {
  const avatarWrap = document.getElementById('avatar-wrap');
  const tributeEl  = document.getElementById('tribute');

  // Avatar
  avatarWrap.innerHTML = '';
  if (cfg.avatar) {
    const img = document.createElement('img');
    img.src = resolvePhoto(cfg.avatar, petName);
    img.alt = cfg.nombre;
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { avatarWrap.innerHTML = cfg.emoji || '🐾'; };
    avatarWrap.appendChild(img);
  } else {
    avatarWrap.textContent = cfg.emoji || '🐾';
  }

  document.getElementById('pet-name').textContent  = cfg.nombre || petName;
  document.getElementById('pet-years').textContent = cfg.años   || '';

  const badgeEl = document.getElementById('pet-badge');
  badgeEl.textContent    = cfg.badge || '';
  badgeEl.style.display  = cfg.badge ? 'inline-block' : 'none';

  tributeEl.textContent  = cfg.tributo || '';
  tributeEl.style.display = cfg.tributo ? 'block' : 'none';

  document.getElementById('profile').style.display = 'flex';
  setAccent(cfg.color_acento);
}

function renderCollage(fotos, petName) {
  const collage = document.getElementById('collage');
  const empty   = document.getElementById('collage-empty');
  collage.innerHTML = '';

  lbPhotos = fotos.map((src) => resolvePhoto(src, petName));
  ssPhotos  = lbPhotos;

  const btnWrap = document.getElementById('slideshow-btn-wrap');
  btnWrap.style.display = fotos.length ? 'flex' : 'none';

  if (!fotos.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  fotos.forEach((src, i) => {
    const cell = document.createElement('div');
    cell.className = 'foto-celda';
    cell.setAttribute('role', 'listitem');
    cell.tabIndex = 0;

    const img = document.createElement('img');
    img.src            = lbPhotos[i];
    img.alt            = `Foto ${i + 1}`;
    img.loading        = 'lazy';
    img.decoding       = 'async';
    img.referrerPolicy = 'no-referrer';
    img.onerror        = () => {
      cell.classList.add('foto-error');
      cell.removeEventListener('click', openHandler);
      img.remove();
    };

    cell.appendChild(img);
    const openHandler = () => openLightbox(i);
    cell.addEventListener('click', openHandler);
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHandler(); }
    });
    collage.appendChild(cell);
  });
}

// ── Pet switching ──────────────────────────────────────────────────────────

async function switchPet(name) {
  if (activePet === name) return;
  activePet = name;
  closeSlideshow();
  updateTabs(name);
  showLoading(true);
  showError(false);
  document.getElementById('profile').style.display  = 'none';
  document.getElementById('tribute').style.display  = 'none';
  document.getElementById('collage').innerHTML       = '';
  document.getElementById('collage-empty').style.display = 'none';

  try {
    const [cfg, imgs] = await Promise.all([
      loadJSON(`mascotas/${name}/config.json`),
      loadJSON(`mascotas/${name}/imagenes.json`),
    ]);
    renderProfile(cfg, name);
    renderCollage(imgs.fotos || [], name);
  } catch (err) {
    console.error(err);
    showError(true);
  } finally {
    showLoading(false);
  }
}

// ── Lightbox ───────────────────────────────────────────────────────────────

function openLightbox(index) {
  lbIndex = index;
  updateLightboxImg();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function updateLightboxImg() {
  document.getElementById('lb-img').src = lbPhotos[lbIndex];
  document.getElementById('lb-counter').textContent =
    lbPhotos.length > 1 ? `${lbIndex + 1} / ${lbPhotos.length}` : '';
}

function lbGo(delta) {
  lbIndex = (lbIndex + delta + lbPhotos.length) % lbPhotos.length;
  updateLightboxImg();
}

document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', () => lbGo(-1));
document.getElementById('lb-next').addEventListener('click', () => lbGo(1));

document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeLightbox();
});

document.getElementById('lightbox').addEventListener('touchstart', (e) => {
  lbTouchX = e.touches[0].clientX;
}, { passive: true });

document.getElementById('lightbox').addEventListener('touchend', (e) => {
  if (lbTouchX === null) return;
  const dx = e.changedTouches[0].clientX - lbTouchX;
  lbTouchX = null;
  if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  lbGo(1);
  if (e.key === 'ArrowLeft')   lbGo(-1);
});

// ── Slideshow ──────────────────────────────────────────────────────────────

function ssImgEl(slot) {
  return document.getElementById(`ss-img-${slot}`);
}

function ssOtherSlot(slot) {
  return slot === 'a' ? 'b' : 'a';
}

function ssPickKb() {
  const options = SS_KB_NAMES.filter(k => k !== ssLastKb);
  const kb = options[Math.floor(Math.random() * options.length)];
  ssLastKb = kb;
  return kb;
}

function ssShowSlot(index, slot) {
  const img = ssImgEl(slot);
  const kb  = ssPickKb();

  img.className  = 'ss-img';
  img.src        = ssPhotos[index];
  img.alt        = `Foto ${index + 1}`;
  img.onerror    = () => ssAdvance(1); // saltar si no carga

  void img.offsetWidth;

  img.classList.add('visible', kb);

  document.getElementById('ss-counter').textContent =
    ssPhotos.length > 1 ? `${index + 1} / ${ssPhotos.length}` : '';
}

function ssAdvance(delta) {
  const nextIndex = (ssIndex + delta + ssPhotos.length) % ssPhotos.length;
  const nextSlot  = ssOtherSlot(ssSlot);
  const curImg    = ssImgEl(ssSlot);

  ssShowSlot(nextIndex, nextSlot);
  curImg.classList.remove('visible');
  setTimeout(() => { curImg.className = 'ss-img'; }, 1300);

  ssIndex = nextIndex;
  ssSlot  = nextSlot;
}

function ssStartTimer() {
  clearInterval(ssTimer);
  ssTimer = setInterval(() => ssAdvance(1), SS_DURATION);
}

function ssPlay() {
  ssPlaying = true;
  document.getElementById('ss-play').innerHTML = '&#9646;&#9646;';
  document.getElementById('ss-play').setAttribute('aria-label', 'Pausar');
  ssStartTimer();
}

function ssPause() {
  ssPlaying = false;
  clearInterval(ssTimer);
  ssTimer = null;
  document.getElementById('ss-play').innerHTML = '&#9654;';
  document.getElementById('ss-play').setAttribute('aria-label', 'Reproducir');
}

function ssTogglePlay() {
  if (ssPlaying) ssPause(); else ssPlay();
}

function openSlideshow() {
  if (!ssPhotos.length) return;
  ssIndex  = 0;
  ssSlot   = 'a';

  // Reset both slots
  ssImgEl('a').className = 'ss-img';
  ssImgEl('b').className = 'ss-img';

  document.getElementById('slideshow').classList.add('open');
  document.body.style.overflow = 'hidden';

  ssShowSlot(0, 'a');
  ssPlay();
}

function closeSlideshow() {
  ssPause();
  document.getElementById('slideshow').classList.remove('open');
  document.body.style.overflow = '';
  ssImgEl('a').className = 'ss-img';
  ssImgEl('b').className = 'ss-img';
}

// Controls
document.getElementById('ss-close').addEventListener('click', closeSlideshow);
document.getElementById('ss-play').addEventListener('click', ssTogglePlay);

document.getElementById('slideshow-btn').addEventListener('click', openSlideshow);

// Keyboard
document.addEventListener('keydown', (e) => {
  if (!document.getElementById('slideshow').classList.contains('open')) return;
  if (e.key === 'Escape')                     { closeSlideshow(); return; }
  if (e.key === ' ') { e.preventDefault(); ssTogglePlay(); }
  if (e.key === 'p' || e.key === 'P') { ssTogglePlay(); }
});

// Touch swipe
document.getElementById('slideshow').addEventListener('touchstart', (e) => {
  ssTouchX = e.touches[0].clientX;
}, { passive: true });

document.getElementById('slideshow').addEventListener('touchend', (e) => {
  ssTouchX = null;
}, { passive: true });

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  showLoading(true);
  try {
    const data  = await loadJSON('mascotas.json');
    const sitio = data.sitio || {};
    petList     = data.mascotas || [];

    document.title = sitio.titulo
      ? sitio.titulo.replace(/\*/g, '')
      : 'Mascotas Memorias';
    document.getElementById('site-title').innerHTML    = renderTitle(sitio.titulo || 'Mascotas Memorias');
    document.getElementById('site-subtitle').textContent = sitio.subtitulo    || '';
    document.getElementById('site-footer').textContent   = sitio.pie_de_pagina || '';

    buildTabs();

    if (petList.length) {
      showLoading(false);
      await switchPet(petList[0]);
    } else {
      showLoading(false);
      showError(true);
    }
  } catch (err) {
    console.error(err);
    showLoading(false);
    showError(true);
  }
}

// ── Service Worker ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

init();
