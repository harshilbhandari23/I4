// Runs in <head> before first paint: show the logo intro on every page load.
// (Kept as an external file because the CSP does not allow inline scripts.)
document.documentElement.classList.add('preload');
