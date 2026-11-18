/* Tiny Planet website: one taste of the app at the top, then the details. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // the eight friends, with lines Pip says in the app
  var FEEL = [
    { id: 'happy',   label: 'Happy',   name: 'Bunbun', c: '#ffc23d', w: 'sunny',         fx: 'sparkle',  say: 'Happy looks good on you!' },
    { id: 'excited', label: 'Excited', name: 'Zoom',   c: '#ff8a3d', w: 'bouncy',        fx: 'confetti', say: 'Zoom zoom! Tell me the exciting bit!' },
    { id: 'okay',    label: 'Okay',    name: 'Puff',   c: '#7fd3b4', w: 'partly cloudy', fx: 'leaves',   say: 'Okay days are cosy days. Me too!' },
    { id: 'sleepy',  label: 'Sleepy',  name: 'Nap',    c: '#b8c9ec', w: 'sleepy',        fx: 'zzz',      say: 'Cosy blanket mode: on.' },
    { id: 'meh',     label: 'Meh',     name: 'Mist',   c: '#a9b1c6', w: 'foggy',         fx: 'fog',      say: 'Meh is allowed. Some days are just foggy.' },
    { id: 'sad',     label: 'Sad',     name: 'Brolly', c: '#9db4e8', w: 'rainy',         fx: 'rain',     say: "I'll sit with you for a bit. No rush." },
    { id: 'worried', label: 'Worried', name: 'Wiggle', c: '#8a6cff', w: 'tangly',        fx: 'swirl',    say: 'Worries feel smaller when we share them.' },
    { id: 'cross',   label: 'Cross',   name: 'Spike',  c: '#e8565c', w: 'stormy',        fx: 'embers',   say: "Grrr is allowed. Let's stomp it out together." }
  ];

  var hero = $('.hero'), bubble = $('#bubble'), friends = $('#friends'), hook = $('#hook'), hint = $('#hint');
  function sky(top, bottom, glow) { hero.style.setProperty('--top', top); hero.style.setProperty('--bottom', bottom); hero.style.setProperty('--glow', glow || 'rgba(0,0,0,0)'); }
  function rgba(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function say(line, small) {
    bubble.textContent = line;
    if (small) { var s = document.createElement('small'); s.textContent = small; bubble.appendChild(s); }
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }

  /* the friends live on the planet, standing on its surface like in the app */
  var RIM = [-42, 42, -78, 78, -114, 114, -150, 150];   // degrees from the top, Pip stands at 0
  FEEL.forEach(function (f, i) {
    var ang = RIM[i], rad = ang * Math.PI / 180;
    var cx = 50 + Math.sin(rad) * 36.2, cy = 57.7 - Math.cos(rad) * 36.2;   // on the rim of the planet
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pick';
    b.style.left = cx + '%'; b.style.top = cy + '%'; b.style.setProperty('--r', ang + 'deg');
    b.setAttribute('aria-label', f.label + ', ' + f.name);
    var im = document.createElement('img'); im.src = 'app/f/' + f.id + '.png'; im.alt = '';
    b.appendChild(im);
    b.addEventListener('click', function () { choose(f, b); });
    friends.appendChild(b);
    var lab = document.createElement('span'); lab.className = 'name'; lab.textContent = f.label; lab.setAttribute('aria-hidden', 'true');
    var lr = 36.2 + 19;
    lab.style.left = (50 + Math.sin(rad) * lr) + '%'; lab.style.top = (57.7 - Math.cos(rad) * lr) + '%';
    friends.appendChild(lab); b._label = lab;
  });

  var fx = null;
  function choose(f, b) {
    if (friends.classList.contains('done')) return;
    friends.classList.add('done'); b.classList.add('chosen'); b._label.classList.add('chosen');
    sky('#3a76b8', '#86c3dc', rgba(f.c, 0.45));
    fx = f.fx; parts = []; emit = 99;
    var p = $('#planetWrap'); if (!reduce) { p.classList.remove('hop'); void p.offsetWidth; p.classList.add('hop'); }
    say(f.say, 'What made it ' + f.w + '?');
    hint.classList.add('off');
    $('#hookImg').src = 'app/f/' + f.id + '.png';
    $('#hookTitle').textContent = f.name + ' wants to move onto your planet';
    $('#hookText').textContent = 'In the app, your child spins the wheel to tell Pip what made it ' + f.w + ', then sends the planet to sleep.';
    setTimeout(function () { hook.classList.add('on'); }, reduce ? 0 : 1100);
  }
  $('#again').addEventListener('click', function () {
    hook.classList.remove('on'); friends.classList.remove('done');
    $$('.pick, .name').forEach(function (b) { b.classList.remove('chosen'); });
    fx = null; sky('#241f5e', '#5b4fd0'); say('Hi again!', 'How did today feel?'); hint.classList.remove('off');
  });

  /* the sky: stars, a shooting star, the chosen feeling's weather */
  var canvas = $('#sky'), ctx = canvas.getContext('2d'), W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [], parts = [], shooting = null, emit = 0;
  function size() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = []; var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.85, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.3, s: 0.6 + Math.random() * 1.8 });
  }
  size(); addEventListener('resize', size);
  function box() { var h = hero.getBoundingClientRect(), r = $('#planetWrap').getBoundingClientRect(); return { x: r.left - h.left + r.width / 2, y: r.top - h.top + r.height * 0.577, r: r.width * 0.365, w: r.width }; }
  function spawn(kind, n) {
    var b = box();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, p = { k: kind, life: 0, max: 2.6 + Math.random() * 1.6 };
      if (kind === 'rain') { p.x = Math.random() * W; p.y = -20 - Math.random() * 80; p.vx = -0.6; p.vy = 7 + Math.random() * 3; p.max = H / 420 + 0.4; }
      else if (kind === 'fog') { p.x = -100 + Math.random() * W * 0.7; p.y = b.y - b.r * 1.3 + Math.random() * b.r * 2.6; p.vx = 0.3 + Math.random() * 0.4; p.rad = 50 + Math.random() * 80; p.max = 6; }
      else if (kind === 'zzz') { p.x = b.x + b.w * 0.08 + Math.random() * 20; p.y = b.y - b.r * 1.55; p.vx = 0.4 + Math.random() * 0.3; p.vy = -0.7 - Math.random() * 0.4; p.size = 14 + Math.random() * 14; p.max = 3.4; }
      else if (kind === 'confetti') { p.x = b.x; p.y = b.y - b.r * 1.2; var sp = 4 + Math.random() * 6; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 3; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 0.3; p.col = ['#ffc23d', '#ff8a5b', '#7fd3b4', '#8a6cff', '#fff6d8'][i % 5]; p.max = 3; }
      else if (kind === 'swirl') { p.ang = a; p.rad0 = b.r * (1.1 + Math.random() * 0.35); p.cx = b.x; p.cy = b.y; p.spd = 0.8 + Math.random() * 0.7; p.max = 3.4; }
      else { p.x = b.x + Math.cos(a) * b.r * (0.95 + Math.random() * 0.3); p.y = b.y + Math.sin(a) * b.r * (0.95 + Math.random() * 0.3); p.vx = (Math.random() - 0.5) * 0.6; p.vy = -0.5 - Math.random() * 1.1; p.size = 2 + Math.random() * 3.5; }
      parts.push(p);
    }
  }
  function draw(p, dt) {
    p.life += dt; var k = p.life / p.max, fade = k < 0.12 ? k / 0.12 : (k > 0.7 ? (1 - k) / 0.3 : 1);
    if (fade <= 0) return false;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade);
    switch (p.k) {
      case 'rain': p.x += p.vx; p.y += p.vy; ctx.strokeStyle = 'rgba(205,220,255,0.75)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.4, p.y + 12); ctx.stroke(); break;
      case 'fog': p.x += p.vx; var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad); g.addColorStop(0, 'rgba(225,230,245,0.16)'); g.addColorStop(1, 'rgba(225,230,245,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 6.3); ctx.fill(); break;
      case 'zzz': p.x += p.vx + Math.sin(p.life * 2) * 0.3; p.y += p.vy; ctx.fillStyle = '#e4e9ff'; ctx.font = '900 ' + p.size + 'px Nunito, ui-rounded, sans-serif'; ctx.fillText('z', p.x, p.y); break;
      case 'confetti': p.vy += 0.14; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-4, -2, 8, 4); break;
      case 'swirl': p.ang += 0.02 * p.spd; var rr = p.rad0 + Math.sin(p.life * 3) * 8; ctx.strokeStyle = 'rgba(190,175,255,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(p.cx + Math.cos(p.ang) * rr, p.cy + Math.sin(p.ang) * rr * 0.55, 6, p.life * 4, p.life * 4 + 4.4); ctx.stroke(); break;
      case 'leaves': p.x += p.vx + Math.sin(p.life * 2.4) * 0.5; p.y += p.vy; ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life * 2) * 0.8); ctx.fillStyle = '#9be8c6'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, 6.3); ctx.fill(); break;
      case 'embers': p.x += p.vx; p.y += p.vy * 1.2; ctx.fillStyle = 'rgba(255,150,120,0.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, 6.3); ctx.fill(); break;
      default: p.x += p.vx; p.y += p.vy; var s4 = p.size * (1 + Math.sin(p.life * 8) * 0.3); ctx.fillStyle = '#ffe08a'; ctx.translate(p.x, p.y); ctx.beginPath(); ctx.moveTo(0, -s4 * 2); ctx.quadraticCurveTo(0, 0, s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, s4 * 2); ctx.quadraticCurveTo(0, 0, -s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -s4 * 2); ctx.fill();
    }
    ctx.restore(); return p.life < p.max;
  }

  /* Pip: eyes follow you, scarf flutters, the planet turns, friends float */
  var pl = $('#pupilL'), pr = $('#pupilR'), scarf = $('#scarf'), spots = $('#spots'), svg = $('.planet-wrap svg'), eyes = $('#pipEyes');
  var look = { x: 0, y: 0 }, lookT = { x: 0, y: 0 };
  addEventListener('pointermove', function (e) {
    var r = svg.getBoundingClientRect(), s = r.width / 520, ex = r.left + 262 * s, ey = r.top + 28 * s;
    var dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 260);
    lookT.x = dx / d * 5 * m; lookT.y = dy / d * 5 * m;
  }, { passive: true });

  var last = performance.now(), t0 = last, spin = 0, nextShoot = last + 2000, blinkAt = last + 2500, raf = null;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) { var s = stars[i]; ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (!shooting && now > nextShoot) shooting = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.25, l: 0 };
    if (shooting) {
      shooting.l += dt; var k = shooting.l / 0.9, x2 = shooting.x + k * 300, y2 = shooting.y + k * 120;
      var gg = ctx.createLinearGradient(x2 - 100, y2 - 40, x2, y2); gg.addColorStop(0, 'rgba(255,246,216,0)'); gg.addColorStop(1, 'rgba(255,246,216,' + (1 - k) + ')');
      ctx.strokeStyle = gg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x2 - 100, y2 - 40); ctx.lineTo(x2, y2); ctx.stroke();
      if (k >= 1) { shooting = null; nextShoot = now + 4500 + Math.random() * 6000; }
    }
    if (fx) { emit += dt; var rate = { rain: 0.02, fog: 0.3, zzz: 0.6, confetti: 1.6, swirl: 0.22, leaves: 0.16, embers: 0.1, sparkle: 0.1 }[fx] || 0.2; if (emit > rate) { emit = 0; spawn(fx, fx === 'confetti' ? 20 : fx === 'rain' ? 4 : 1); } }
    parts = parts.filter(function (p) { return draw(p, dt); });
    spin = (spin + dt * 16) % 380; spots.setAttribute('transform', 'translate(' + (-spin) + ' 0)');
    look.x += (lookT.x - look.x) * 0.12; look.y += (lookT.y - look.y) * 0.12;
    pl.setAttribute('cx', (244 + look.x).toFixed(2)); pl.setAttribute('cy', (30 + look.y).toFixed(2));
    pr.setAttribute('cx', (284 + look.x).toFixed(2)); pr.setAttribute('cy', (30 + look.y).toFixed(2));
    if (now > blinkAt) { eyes.style.transformOrigin = '262px 28px'; eyes.style.transform = 'scaleY(0.1)'; setTimeout(function () { eyes.style.transform = ''; }, 130); blinkAt = now + 2500 + Math.random() * 4000; }
    var f1 = Math.sin(t * 3.2) * 7, f2 = Math.sin(t * 3.2 + 1.2) * 10;
    scarf.setAttribute('d', 'M190 80 q70 26 140 -2 q' + (20 + f1 * 0.4).toFixed(1) + ' ' + (-8 + f1).toFixed(1) + ' ' + (30 + f2 * 0.3).toFixed(1) + ' ' + (-26 + f2).toFixed(1));
    $$('.pick img').forEach(function (im, j) { im.style.transform = 'rotate(' + (Math.sin(t * 1.3 + j * 1.7) * 5).toFixed(1) + 'deg) scaleY(' + (1 + Math.sin(t * 2.2 + j) * 0.025).toFixed(3) + ')'; });
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        if (!e[0].isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
      }).observe(hero);
    } else raf = requestAnimationFrame(frame);
  } else {
    for (var q = 0; q < stars.length; q++) { ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(stars[q].x, stars[q].y, stars[q].r, 0, 6.3); ctx.fill(); }
  }

  /* below the planet: clips play while on screen, sections rise in, the app button follows */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    }, { threshold: 0.3 });
    $$('main video').forEach(function (v) { vio.observe(v); });
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { threshold: 0.15 });
    $$('.rise').forEach(function (el) { rio.observe(el); });
    var dock = $('#dock');
    new IntersectionObserver(function (e) { dock.classList.toggle('on', !e[0].isIntersecting); }, { threshold: 0.05 }).observe(hero);
  } else { $$('.rise').forEach(function (el) { el.classList.add('in'); }); }
})();
