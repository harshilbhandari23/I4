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
