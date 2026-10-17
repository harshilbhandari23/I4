// Anti-framing: CSP frame-ancestors can't be set from a <meta> tag on GitHub Pages,
// so hide the page and break out if it is ever embedded in another site.
if (window.top !== window.self) {
  document.documentElement.style.display = 'none';
  try { window.top.location = window.self.location; } catch (e) {}
}

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Scroll-reveal animations. Started after the loading screen has gone so the
// first-view entrance is visible instead of finishing behind the overlay.
// Delay for each icon-grid tile = its diagonal position on screen (row + column), so the
// entrance ripples across the grid in the order people actually see it.
function layoutEcoWave() {
  const items = [...document.querySelectorAll('.eco-grid .eco-item')];
  if (!items.length) return;
  const uniq = arr => [...new Set(arr)].sort((a, b) => a - b);
  const tops = uniq(items.map(el => Math.round(el.offsetTop / 8)));
  const lefts = uniq(items.map(el => Math.round(el.offsetLeft / 8)));
  items.forEach(el => {
    const row = tops.indexOf(Math.round(el.offsetTop / 8));
    const col = lefts.indexOf(Math.round(el.offsetLeft / 8));
    el.style.setProperty('--eco-d', ((row + col) * 85) + 'ms');
  });
}

let revealStarted = false;
function initReveal() {
  if (revealStarted) return;
  revealStarted = true;
  layoutEcoWave();
  let ecoResizeTimer;
  window.addEventListener('resize', () => { clearTimeout(ecoResizeTimer); ecoResizeTimer = setTimeout(layoutEcoWave, 150); });
  const revealEls = document.querySelectorAll('.reveal');
  function markRevealed(el) {
    // switch to the fast transition (.reveal.revealed) once the slow reveal
    // animation has finished, so hover states feel instant afterwards
    let done = false;
    const finish = () => { if (!done) { done = true; el.classList.add('revealed'); } };
    el.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 950);
  }
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          markRevealed(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => { el.classList.add('in-view', 'revealed'); });
  }
}

// Loading screen: play the logo animation on every page load, then fade out.
const preloader = document.getElementById('preloader');
const root = document.documentElement;
if (preloader && root.classList.contains('preload')) {
  const wait = ms => new Promise(res => setTimeout(res, ms));
  // The logo is inline SVG, so its CSS animations belong to this page and restart on
  // every load. Wait for them to actually finish (plus a short hold on the finished logo);
  // fall back to a fixed time if the browser can't report them.
  const running = preloader.getAnimations ? preloader.getAnimations({ subtree: true }) : [];
  const animationDone = running.length
    ? Promise.all(running.map(a => a.finished.catch(() => {}))).then(() => wait(500))
    : wait(4500);
  const pageReady = new Promise(res => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  const safetyCap = new Promise(res => setTimeout(res, 9000));
  Promise.race([Promise.all([pageReady, animationDone]), safetyCap]).then(() => {
    preloader.classList.add('hide');
    root.classList.remove('preload');
    initReveal();
    setTimeout(() => preloader.remove(), 800);
  });
} else {
  if (preloader) preloader.remove();
  initReveal();
}

// Programs carousel: drifts right-to-left on its own, and can be dragged (mouse, touch or
// pen) in either direction. Releasing a drag keeps a little momentum, then the drift resumes.
// The CSS animation is the no-JS fallback; with Reduce Motion the row is a plain scrollable strip.
(function () {
  const car = document.querySelector('.prog-carousel');
  if (!car) return;
  const track = car.querySelector('.prog-track');
  if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const SPEED = 0.032;                 // drift, in px per ms (about 32px/s)
  const MAX_FLICK = 1.8;               // cap on release momentum, px per ms
  let x = new DOMMatrix(getComputedStyle(track).transform).m41;
  track.style.animation = 'none';      // from here on, JS moves the track
  let setW = 0, vx = 0, last = 0, raf = 0, visible = false;
  let dragging = false, hovered = false, startX = 0, startPos = 0, lastX = 0, lastT = 0;

  const measure = () => { setW = track.scrollWidth / 2; };
  const wrap = () => {
    if (!setW) return;
    while (x <= -setW) x += setW;
    while (x > 0) x -= setW;
  };
  const paint = () => { track.style.transform = 'translate3d(' + x + 'px,0,0)'; };

  function frame(t) {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(t - last, 50);
    last = t;
    if (!dragging) {
      if (Math.abs(vx) > 0.02) {                 // momentum after a flick
        x += vx * dt;
        vx *= Math.exp(-dt / 320);
      } else if (!hovered) {
        vx = 0;
        x -= SPEED * dt;                          // idle drift, right to left
      }
    }
    wrap();
    paint();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  car.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragging = true; vx = 0;
    startX = lastX = e.clientX; startPos = x; lastT = e.timeStamp;
    car.setPointerCapture(e.pointerId);
    car.classList.add('dragging');
  });
  car.addEventListener('pointermove', e => {
    if (!dragging) return;
    x = startPos + (e.clientX - startX);
    const dt = e.timeStamp - lastT;
    if (dt > 0) vx = Math.max(-MAX_FLICK, Math.min(MAX_FLICK, 0.8 * vx + 0.2 * ((e.clientX - lastX) / dt)));
    lastX = e.clientX; lastT = e.timeStamp;
    wrap(); paint();
  });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    car.classList.remove('dragging');
    if (e.timeStamp - lastT > 80) vx = 0;        // held still before letting go: no flick
    start();
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => car.addEventListener(n, end));

  car.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovered = true; });
  car.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hovered = false; });

  window.addEventListener('resize', () => { measure(); wrap(); paint(); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { measure(); start(); }
  }).observe(car);
  measure(); paint();
})();
