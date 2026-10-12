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
