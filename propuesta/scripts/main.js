/* ==========================================================================
   MALDITA SMASH — Propuesta digital · main.js
   Navegación (teclado, botones, scroll), progreso, capítulos, revelado,
   contadores, parallax sutil, tooltip del gráfico y exportación a PDF.
   Sin dependencias.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const isStatic = params.has('static');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flowMQ = matchMedia('screen and (max-width: 900px), screen and (max-width: 1180px) and (orientation: portrait)');

  root.classList.add('js');
  if (isStatic) root.classList.add('static');

  const deck = document.getElementById('deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = new Intl.NumberFormat('es-AR');

  const curEl = document.getElementById('pg-cur');
  const totalEl = document.getElementById('pg-total');
  const barEl = document.getElementById('progress-bar');
  const prevBtn = document.querySelector('[data-prev]');
  const nextBtn = document.querySelector('[data-next]');
  const chapterLinks = Array.from(document.querySelectorAll('.chapters a'));
  const menuToggle = document.querySelector('.menu-toggle');

  totalEl.textContent = pad(total);

  let index = -1;
  let target = -1;
  let targetTimer = 0;

  /* ---------- estado de la página actual ---------- */
  function setIndex(i) {
    if (i === index) return;
    index = i;
    const slide = slides[i];
    curEl.textContent = pad(i + 1);
    barEl.style.width = (total > 1 ? (i / (total - 1)) * 100 : 100) + '%';
    document.body.dataset.ui = slide.dataset.bar || slide.dataset.ui || 'dark';
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
    const ch = slide.dataset.chapter;
    chapterLinks.forEach((a) => {
      if (a.dataset.chapter === ch) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (history.replaceState) history.replaceState(null, '', '#' + slide.id);
  }

  function computeIndex() {
    const probe = deck.scrollTop + deck.clientHeight * 0.4;
    let i = 0;
    for (let k = 0; k < total; k++) if (slides[k].offsetTop <= probe) i = k;
    return i;
  }

  function goTo(i, instant) {
    i = Math.max(0, Math.min(total - 1, i));
    target = i;
    clearTimeout(targetTimer);
    targetTimer = setTimeout(() => { target = -1; }, 900);
    deck.scrollTo({ top: slides[i].offsetTop, behavior: instant || reduced ? 'auto' : 'smooth' });
    setIndex(i);
  }
  const base = () => (target >= 0 ? target : index);

  let ticking = false;
  deck.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (target < 0) setIndex(computeIndex());
    });
  }, { passive: true });

  // Rueda / trackpad en modo presentación: un gesto = una página.
  // (El scroll-snap nativo devuelve los giros cortos de rueda a la página actual.)
  let wheelAcc = 0, wheelLock = 0, wheelIdle = 0;
  deck.addEventListener('wheel', (e) => {
    if (flowMQ.matches || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelAcc = 0; wheelLock = 0; }, 220);
    if (wheelLock && performance.now() - wheelLock < 1100) return;
    wheelAcc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    if (Math.abs(wheelAcc) >= 40) {
      goTo(base() + (wheelAcc > 0 ? 1 : -1));
      wheelAcc = 0;
      wheelLock = performance.now();
    }
  }, { passive: false });

  prevBtn.addEventListener('click', () => goTo(base() - 1));
  nextBtn.addEventListener('click', () => goTo(base() + 1));

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const flow = flowMQ.matches;
    const onControl = t.closest && t.closest('button, a');
    let next = null;
    switch (e.key) {
      case 'ArrowRight': next = base() + 1; break;
      case 'ArrowLeft': next = base() - 1; break;
      case 'ArrowDown': case 'PageDown': if (!flow) next = base() + 1; break;
      case 'ArrowUp': case 'PageUp': if (!flow) next = base() - 1; break;
      case ' ': if (!flow && !onControl) next = base() + (e.shiftKey ? -1 : 1); break;
      case 'Home': next = 0; break;
      case 'End': next = total - 1; break;
      case 'Escape': closeMenu(); return;
      default: return;
    }
    if (next === null) return;
    e.preventDefault();
    goTo(next);
  });

  /* ---------- capítulos + menú compacto ---------- */
  function closeMenu() {
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  menuToggle.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('a[href^="#s"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const i = slides.findIndex((s) => '#' + s.id === a.getAttribute('href'));
      if (i < 0) return;
      e.preventDefault();
      closeMenu();
      goTo(i);
      slides[i].setAttribute('tabindex', '-1');
      slides[i].focus({ preventScroll: true });
    });
  });

  /* ---------- revelado al entrar en pantalla ---------- */
  function enter(slide) {
    if (slide.classList.contains('is-in')) return;
    slide.classList.add('is-in');
    runCounters(slide);
  }
  if (isStatic || !('IntersectionObserver' in window)) {
    slides.forEach((s) => s.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) enter(en.target); });
    }, { root: deck, threshold: 0.12 });
    slides.forEach((s) => io.observe(s));
  }

  /* ---------- contadores ---------- */
  const counterRAF = new Map();
  function runCounters(slide) {
    if (reduced || isStatic) return;
    slide.querySelectorAll('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      const start = performance.now();
      const dur = 1500;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(end * eased));
        if (p < 1) counterRAF.set(el, requestAnimationFrame(step));
        else counterRAF.delete(el);
      };
      counterRAF.set(el, requestAnimationFrame(step));
    });
  }
  function finishCounters() {
    counterRAF.forEach((id) => cancelAnimationFrame(id));
    counterRAF.clear();
    document.querySelectorAll('[data-count]').forEach((el) => {
      el.textContent = fmt.format(Number(el.dataset.count));
    });
  }

  /* ---------- parallax sutil (sólo puntero fino) ---------- */
  if (!reduced && !isStatic && matchMedia('(pointer: fine)').matches) {
    let px = 0, py = 0, raf = 0;
    window.addEventListener('pointermove', (e) => {
      px = e.clientX / innerWidth - 0.5;
      py = e.clientY / innerHeight - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const slide = slides[index];
        if (!slide || !slide.classList.contains('is-in')) return;
        slide.querySelectorAll('[data-parallax]').forEach((el) => {
          const s = Number(el.dataset.parallax) || 10;
          el.style.translate = (px * -s).toFixed(1) + 'px ' + (py * -s).toFixed(1) + 'px';
        });
      });
    }, { passive: true });
  }

  /* ---------- tooltip del gráfico de línea (datos ilustrativos) ---------- */
  const wrap = document.querySelector('.line-wrap');
  if (wrap) {
    const d = wrap.querySelector('.line').getAttribute('d');
    const pts = d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
    const xs = [], ys = [];
    for (let k = 0; k < pts.length; k += 2) { xs.push(pts[k]); ys.push(pts[k + 1]); }
    const raw = ys.map((y) => 200 - y);
    const sum = raw.reduce((a, b) => a + b, 0);
    const vals = raw.map((v) => Math.round((v / sum) * 2840000 / 100) * 100);
    const line = wrap.querySelector('.lh-line');
    const tip = wrap.querySelector('.lh-tip');
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      const k = Math.round(f * (xs.length - 1));
      const left = (xs[k] / 600) * 100;
      line.style.left = left + '%';
      tip.style.left = left + '%';
      tip.style.top = (ys[k] / 200) * 100 + '%';
      tip.textContent = 'Día ' + (k + 1) + ' · $ ' + fmt.format(vals[k]);
    });
  }

  /* ---------- exportar a PDF ---------- */
  function eagerImages() {
    const imgs = Array.from(document.images);
    imgs.forEach((img) => { if (img.loading === 'lazy') img.loading = 'eager'; });
    return Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
    }))));
  }
  function preparePrint() {
    finishCounters();
    slides.forEach((s) => s.classList.add('is-in'));
  }
  document.querySelectorAll('[data-print]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      btn.setAttribute('aria-busy', 'true');
      await eagerImages();
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      preparePrint();
      btn.removeAttribute('aria-busy');
      window.print();
    });
  });
  window.addEventListener('beforeprint', () => { eagerImages(); preparePrint(); });

  // Precarga diferida del resto de imágenes (para que el PDF salga completo
  // aunque se imprima con Ctrl/Cmd + P sin haber recorrido la presentación).
  window.addEventListener('load', () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => eagerImages());
  });

  /* ---------- posición inicial ---------- */
  const startId = location.hash.slice(1);
  const start = Math.max(0, slides.findIndex((s) => s.id === startId));
  if (start > 0) {
    deck.scrollTop = slides[start].offsetTop;
    enter(slides[start]);
  }
  setIndex(start);
  if (start === 0) enter(slides[0]);
})();
