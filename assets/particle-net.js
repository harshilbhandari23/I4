(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function init(host) {
    var canvas = document.createElement('canvas');
    canvas.className = 'particle-net';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);
    var ctx = canvas.getContext('2d');

    function readColor(attr, fallback) {
      var v = host.getAttribute(attr) || '';
      return /^\d{1,3},\d{1,3},\d{1,3}$/.test(v) ? v : fallback;
    }
    var rgb = readColor('data-particle-color', '255,255,255');
    var lineRgb = readColor('data-particle-line-color', rgb);

    var w = 0, h = 0, linkDist = 200, grabDist = 170;
    var particles = [];
    var mouse = null;
    var running = false, raf = 0, last = 0;

    function spawn() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.random() - 0.5,
        vy: Math.random() - 0.5,
        r: 0.8 + Math.random() * 3.6,
        o: 0.1 + Math.random() * 0.4,
        vo: (Math.random() < 0.5 ? -1 : 1) * 0.001 * (0.2 + Math.random())
      };
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var target = Math.max(18, Math.min(120, Math.round(w * h / 7000)));
      while (particles.length < target) particles.push(spawn());
      particles.length = target;
      linkDist = Math.max(110, Math.min(220, Math.min(w, h) * 0.4));

      if (!running) draw();
    }

    function step(dt) {
      var k = dt / 16.67;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx * k;
        p.y += p.vy * k;
        if (p.x < -p.r) p.x = w + p.r; else if (p.x > w + p.r) p.x = -p.r;
        if (p.y < -p.r) p.y = h + p.r; else if (p.y > h + p.r) p.y = -p.r;
        p.o += p.vo * k;
        if (p.o >= 0.5) { p.o = 0.5; p.vo = -Math.abs(p.vo); }
        else if (p.o <= 0.1) { p.o = 0.1; p.vo = Math.abs(p.vo); }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var n = particles.length, ld2 = linkDist * linkDist, i, j, p, q, dx, dy, d2, a;

      ctx.lineWidth = 1;
      for (i = 0; i < n; i++) {
        p = particles[i];
        for (j = i + 1; j < n; j++) {
          q = particles[j];
          dx = p.x - q.x;
          dy = p.y - q.y;
          d2 = dx * dx + dy * dy;
          if (d2 < ld2) {
            a = 0.3 * (1 - Math.sqrt(d2) / linkDist);
            ctx.strokeStyle = 'rgba(' + lineRgb + ',' + a.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      if (mouse) {
        for (i = 0; i < n; i++) {
          p = particles[i];
          dx = p.x - mouse.x;
          dy = p.y - mouse.y;
          d2 = Math.sqrt(dx * dx + dy * dy);
          if (d2 < grabDist) {
            a = 0.6 * (1 - d2 / grabDist);
            ctx.strokeStyle = 'rgba(' + lineRgb + ',' + a.toFixed(3) + ')';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      for (i = 0; i < n; i++) {
        p = particles[i];
        ctx.fillStyle = 'rgba(' + rgb + ',' + p.o.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fill();
      }
    }

    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min(t - last, 50) : 16.67;
      last = t;
      step(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (finePointer && !reduceMotion) {
      host.addEventListener('pointermove', function (e) {
        var rect = host.getBoundingClientRect();
        mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      });
      host.addEventListener('pointerleave', function () { mouse = null; });
    }

    new ResizeObserver(resize).observe(host);
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) start(); else stop();
    }).observe(host);

    resize();
  }

  document.querySelectorAll('[data-particle-net]').forEach(init);
})();
