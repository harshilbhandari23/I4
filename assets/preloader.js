// Runs in <head> before first paint: show the logo intro once per browser session.
// (Kept as an external file because the CSP does not allow inline scripts.)
(function () {
  var root = document.documentElement;
  try {
    if (!sessionStorage.getItem('i4-intro')) root.classList.add('preload');
  } catch (e) {
    root.classList.add('preload');
  }
})();
