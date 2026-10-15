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
let revealStarted = false;
function initReveal() {
  if (revealStarted) return;
  revealStarted = true;
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
  const img = preloader.querySelector('img');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANIMATION_MS = 4500; // the logo animation runs ~4.3s
  const imageReady = new Promise(res => {
    if (img.complete) res();
    else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); }
  });
  const pageReady = new Promise(res => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  });
  const animationDone = imageReady.then(() => new Promise(res => setTimeout(res, reduceMotion ? 600 : ANIMATION_MS)));
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
