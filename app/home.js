/* Tiny Planet website: one taste of the app at the top, then the details.
   The planet is laid out in the app's own 360 × 760 points (PlanetLayout, PlanetWorld, PlanetPip, SkyOrbit)
   and scaled to fit, so it matches the app. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- from the app ---------- */
  var ORDER = ['happy', 'excited', 'okay', 'sleepy', 'meh', 'sad', 'worried', 'cross'];
  var F = {
    happy:   { label: 'Happy',   name: 'Bunbun', w: 'sunny',         patch: 70,  card: '#FFF3D6', sky: ['#E08A12', '#F5AE2B', '#FFD36B'], stars: .15, fx: 'sparkle',  say: ['Happy looks good', 'on you!'] },
    excited: { key: 'exciting bit', label: 'Excited', name: 'Zoom',   w: 'bouncy',        patch: 106, card: '#FFEADB', sky: ['#D9541E', '#FF7F3A', '#FFB27A'], stars: .15, fx: 'confetti', say: ['Zoom zoom!', 'Tell me the exciting bit!'] },
    okay:    { label: 'Okay',    name: 'Puff',   w: 'partly cloudy', patch: 142, card: '#E2F6EC', sky: ['#2E6E9E', '#5C9CC4', '#9CCFD8'], stars: .45, fx: 'leaves',   say: ['Okay days are', 'cosy days. Me too!'] },
    sleepy:  { label: 'Sleepy',  name: 'Nap',    w: 'sleepy',        patch: 178, card: '#E6EEFA', sky: ['#252A70', '#5C5CB0', '#B8A8F0'], stars: .45, fx: 'zzz',      say: ['Cosy blanket', 'mode: on.'] },
    meh:     { label: 'Meh',     name: 'Mist',   w: 'foggy',         patch: 214, card: '#ECEEF3', sky: ['#4A5470', '#7A8499', '#B4BAC8'], stars: .45, fx: 'fog',      say: ['Meh is allowed.', 'Some days are just foggy.'] },
    sad:     { label: 'Sad',     name: 'Brolly', w: 'rainy',         patch: 250, card: '#E3ECFF', sky: ['#2B3A7E', '#5567B8', '#8C9CE0'], stars: .45, fx: 'rain',     say: ["I'll sit with you", 'for a bit. No rush.'] },
    worried: { key: 'smaller', label: 'Worried', name: 'Wiggle', w: 'tangly',        patch: 286, card: '#EFE8FF', sky: ['#33217A', '#6A4BC8', '#A88CFF'], stars: .45, fx: 'swirl',    say: ['Worries feel smaller', 'when we share them.'] },
    cross:   { label: 'Cross',   name: 'Spike',  w: 'stormy',        patch: 322, card: '#FFE1E2', sky: ['#7A1F3A', '#C8414F', '#FF8A6B'], stars: .45, fx: 'embers',   say: ['Grrr is allowed.', "Let's stomp it out together."] }
  };
  var R = 128, TUFTS = [-160, -120, -88, -52, -6, 58, 92, 126, 160, 200];

  function partOfDay() {
    var h = new Date().getHours();
    if (h >= 5 && h < 10) return { id: 'morning', sky: ['#5AAEF0', '#9FCBF2', '#EFA184'], stars: 0, buddy: 'ch_sol', word: 'Morning' };
    if (h >= 10 && h < 16) return { id: 'day', sky: ['#2F86E0', '#5FA9F0', '#7FB8EC'], stars: 0, buddy: 'ch_sol_cool', word: 'Afternoon' };
    if (h >= 16 && h < 19) return { id: 'sunset', sky: ['#3A2F7A', '#C0588F', '#FFA36B'], stars: .3, buddy: 'ch_sol_sleepy', word: 'Sunset' };
    return { id: 'eve', sky: ['#0B1440', '#2A2478', '#5B3FA8'], stars: 1, buddy: 'ch_luna_happy', word: (h >= 1 && h < 5) ? 'Before dawn' : 'Evening' };
  }
  var tod = partOfDay();

  var hero = $('.hero'), scene = $('#scene'), world = $('#world'), spinner = $('#spinner'), moons = $('#moons'), bubble = $('#bubble'), hook = $('#hook'), hint = $('#hint');
  var starTarget = tod.stars, starAlpha = tod.stars;

  function setSky(c) {
    hero.style.background = 'linear-gradient(180deg,' + c[0] + ',' + c[1] + ' 55%,' + c[2] + ')';
  }
  hero.style.transition = 'background 2.2s ease';
  setSky(tod.sky);
  $('#orbiter').src = 'app/p/' + tod.buddy + '.png';
  $('#kick').textContent = tod.word;

  /* ---------- layout: fit the app's points into the scene ---------- */
  var u = 1, ox = 0, oy = 0;
  function fit() {
    var w = scene.clientWidth, h = scene.clientHeight;
    u = Math.min(w / 360, h / 470, 2.1);
    ox = (w - 360 * u) / 2;
    oy = h * 0.6 - 384 * u;            // planet centre sits at 60% of the scene
    world.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + u + ')';
  }
  fit(); addEventListener('resize', function () { fit(); size(); });

  /* ---------- the planet: tufts, the tree and house, friends who visited ---------- */
  function planted(id, angle, asset, scale, sway) {
    var wv = 120 * scale, hv = 104 * scale, d = document.createElement('div');
    d.className = 'planted'; d.dataset.id = id;
    d.style.width = wv + 'px'; d.style.height = hv + 'px'; d.style.margin = (-hv / 2) + 'px 0 0 ' + (-wv / 2) + 'px';
    d.style.transform = 'rotate(' + angle + 'deg) translateY(' + (-(R - 3) - hv / 2 + 4 * scale) + 'px)';
    var im = document.createElement('img'); im.src = 'app/p/' + asset + '.png'; im.alt = '';
    d.appendChild(im); d._sway = sway; d._ph = Math.random() * 6;
    return d;
  }
  var globe = $('.globe', spinner);
  TUFTS.forEach(function (a) {
    var t = document.createElement('img'); t.className = 'tuft'; t.src = 'app/p/prop_tuft.png'; t.alt = '';
    t.style.transform = 'rotate(' + a + 'deg) translateY(-133px)';
    spinner.insertBefore(t, globe);
  });
  spinner.insertBefore(planted('tree', -36, 'prop_tree', 0.7, true), globe);
  spinner.insertBefore(planted('house', 40, 'prop_house', 0.8, false), globe);
  var visited = {};
  function plant(f, fresh) {
    var old = $('.planted[data-id="f-' + f + '"]', spinner);
    var stage = visited[f] ? 2 : 1; visited[f] = true;
    var el = planted('f-' + f, F[f].patch, 'crs_' + f + '_' + stage, 0.92, false);
    if (fresh) el.classList.add('fresh');
    if (old) old.replaceWith(el); else spinner.insertBefore(el, globe);
    return el;
  }

  (function () { var a0 = 0.56 * 2 * Math.PI, a1 = 0.70 * 2 * Math.PI, r = 105, cx = 180, cy = 384;
    $('#shine').setAttribute('d', 'M' + (cx + r * Math.cos(a0)).toFixed(2) + ' ' + (cy + r * Math.sin(a0)).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * Math.cos(a1)).toFixed(2) + ' ' + (cy + r * Math.sin(a1)).toFixed(2)); })();

  /* ---------- the feeling moons, on the arc above Pip ---------- */
  ORDER.forEach(function (id, i) {
    var a = (196 + i * 148 / 7) * Math.PI / 180, x = 180 + 150 * Math.cos(a), y = 312 + 182 * Math.sin(a) + 8;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'moon';
    b.style.left = x + 'px'; b.style.top = (y - 31) + 'px'; b.style.transitionDelay = (i * 0.11) + 's';
    b.setAttribute('aria-label', F[id].label);
    b.innerHTML = '<span class="disc" style="background:' + F[id].card + '"><img src="app/p/sky_' + id + '.png" alt=""></span><span>' + F[id].label + '</span>';
    b.addEventListener('click', function () { choose(id); });
    moons.appendChild(b);
  });
  setTimeout(function () { moons.classList.add('on'); }, reduce ? 0 : 500);

  function say(lines, small, key) {
    bubble.innerHTML = ''; var n = 0;
    lines.forEach(function (line) {
      var ln = document.createElement('span'); ln.className = 'ln';
      line.split(' ').forEach(function (word, i) {
        var w = document.createElement('span'); w.className = 'w'; w.textContent = word;
        if (key && key.split(' ').some(function (k) { return word.toLowerCase().indexOf(k.toLowerCase()) === 0; }) && line.toLowerCase().indexOf(key.split(' ')[0].toLowerCase()) >= 0) w.classList.add('key');
        ln.appendChild(w); if (i < line.split(' ').length - 1) ln.appendChild(document.createTextNode(' '));
        (function (el, d) { setTimeout(function () { el.classList.add('in'); }, reduce ? 0 : 150 + d * 90); })(w, n++);
      });
      bubble.appendChild(ln);
    });
    if (small) { var s = document.createElement('small'); s.textContent = small; bubble.appendChild(s); }
    bubble.classList.add('on');
  }

  /* ---------- the planet turns, like PlanetSpin ---------- */
  var angle = 0, target = null;
  function bring(world, screen) { var t = screen - world; while (t - angle > 180) t -= 360; while (t - angle < -180) t += 360; target = t; }

  /* ---------- choosing a feeling ---------- */
  var current = null, fxKind = null, hopT = -1;
  function choose(id) {
    if (current) return;
    var f = F[id]; current = id;
    moons.classList.remove('on');
    $$('.moon').forEach(function (m) { m.style.transitionDelay = '0s'; m.tabIndex = -1; });
    setSky(f.sky); starTarget = f.stars;
    $('#kick').textContent = 'Today felt'; $('#big').textContent = f.label;
    bring(f.patch, 38);
    var wasHere = !!visited[id];
    setTimeout(function () { var el = plant(id, true); hopT = performance.now(); fxKind = f.fx; parts = []; emit = 99; say(f.say, 'What made it ' + f.w + '?', f.key); }, reduce ? 0 : 700);
    hint.classList.add('off');
    $('#hookImg').src = 'app/f/' + id + '.png';
    $('#hookTitle').textContent = wasHere ? f.name + ' came back, and brought a friend' : f.name + ' moved onto your planet';
    $('#hookText').textContent = 'In the app, your child spins the wheel to tell Pip what made it ' + f.w + ', then slides the planet to sleep.';
    setTimeout(function () { hook.classList.add('on'); }, reduce ? 0 : 1700);
  }
  $('#again').addEventListener('click', function () {
    hook.classList.remove('on'); current = null; fxKind = null; bubble.classList.remove('on');
    setSky(tod.sky); starTarget = tod.stars; $('#kick').textContent = tod.word; $('#big').textContent = 'Pick a feeling';
    $$('.moon').forEach(function (m, i) { m.style.transitionDelay = (i * 0.11) + 's'; m.tabIndex = 0; });
    moons.classList.add('on'); hint.classList.remove('off');
  });

  /* ---------- the sky: stars, a shooting star, the feeling's weather ---------- */
  var canvas = $('#sky'), ctx = canvas.getContext('2d'), W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [], parts = [], shooting = null, emit = 0;
  function size() {
    var r = hero.getBoundingClientRect(); W = r.width; H = r.height;
    canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = []; var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.85, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.3, s: 0.25 + Math.random() * 0.7 });
  }
  size();
  function box() { var hr = hero.getBoundingClientRect(), sr = scene.getBoundingClientRect(); return { x: sr.left - hr.left + ox + 180 * u, y: sr.top - hr.top + oy + 384 * u, r: R * u, w: 256 * u }; }
  function spawn(kind, n) {
    var b = box();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, p = { k: kind, life: 0, max: 2.6 + Math.random() * 1.6 };
      if (kind === 'rain') { p.x = Math.random() * W; p.y = -20 - Math.random() * 80; p.vx = -0.6; p.vy = 7 + Math.random() * 3; p.max = H / 420 + 0.4; }
      else if (kind === 'fog') { p.x = -100 + Math.random() * W * 0.7; p.y = b.y - b.r * 1.3 + Math.random() * b.r * 2.6; p.vx = 0.3 + Math.random() * 0.4; p.rad = 50 + Math.random() * 80; p.max = 6; }
      else if (kind === 'zzz') { p.x = b.x + b.r * 0.2 + Math.random() * 20; p.y = b.y - b.r * 1.5; p.vx = 0.4 + Math.random() * 0.3; p.vy = -0.7 - Math.random() * 0.4; p.size = 14 + Math.random() * 14; p.max = 3.4; }
      else if (kind === 'confetti') { p.x = b.x; p.y = b.y - b.r * 1.2; var sp = 4 + Math.random() * 6; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 3; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 0.3; p.col = ['#ffc23d', '#ff8a5b', '#7fd3b4', '#8a6cff', '#fff6d8'][i % 5]; p.max = 3; }
      else if (kind === 'swirl') { p.ang = a; p.rad0 = b.r * (1.2 + Math.random() * 0.35); p.cx = b.x; p.cy = b.y; p.spd = 0.8 + Math.random() * 0.7; p.max = 3.4; }
      else { p.x = b.x + Math.cos(a) * b.r * (1.05 + Math.random() * 0.3); p.y = b.y + Math.sin(a) * b.r * (1.05 + Math.random() * 0.3); p.vx = (Math.random() - 0.5) * 0.6; p.vy = -0.5 - Math.random() * 1.1; p.size = 2 + Math.random() * 3.5; }
      parts.push(p);
    }
  }
  function draw(p, dt) {
    dt *= 0.65; p.life += dt; var k = p.life / p.max, fade = k < 0.12 ? k / 0.12 : (k > 0.7 ? (1 - k) / 0.3 : 1);
    if (fade <= 0) return false;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade);
    switch (p.k) {
      case 'rain': p.x += p.vx * 0.65; p.y += p.vy * 0.65; ctx.strokeStyle = 'rgba(205,220,255,0.75)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.4, p.y + 12); ctx.stroke(); break;
      case 'fog': p.x += p.vx * 0.6; var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad); g.addColorStop(0, 'rgba(225,230,245,0.18)'); g.addColorStop(1, 'rgba(225,230,245,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 6.3); ctx.fill(); break;
      case 'zzz': p.x += (p.vx + Math.sin(p.life * 2) * 0.3) * 0.6; p.y += p.vy * 0.6; ctx.fillStyle = '#e4e9ff'; ctx.font = '900 ' + p.size + 'px Nunito, ui-rounded, sans-serif'; ctx.fillText('z', p.x, p.y); break;
      case 'confetti': p.vy += 0.07; p.vx *= 0.985; p.x += p.vx * 0.6; p.y += p.vy * 0.6; p.rot += p.vr; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-4, -2, 8, 4); break;
      case 'swirl': p.ang += 0.012 * p.spd; var rr = p.rad0 + Math.sin(p.life * 3) * 8; ctx.strokeStyle = 'rgba(220,210,255,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(p.cx + Math.cos(p.ang) * rr, p.cy + Math.sin(p.ang) * rr * 0.55, 6, p.life * 4, p.life * 4 + 4.4); ctx.stroke(); break;
      case 'leaves': p.x += (p.vx + Math.sin(p.life * 2.4) * 0.5) * 0.6; p.y += p.vy * 0.6; ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life * 2) * 0.8); ctx.fillStyle = '#c9f5df'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, 6.3); ctx.fill(); break;
      case 'embers': p.x += p.vx * 0.6; p.y += p.vy * 0.7; ctx.fillStyle = 'rgba(255,200,170,0.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, 6.3); ctx.fill(); break;
      default: p.x += p.vx * 0.6; p.y += p.vy * 0.6; var s4 = p.size * (1 + Math.sin(p.life * 8) * 0.3); ctx.fillStyle = '#fff3c2'; ctx.translate(p.x, p.y); ctx.beginPath(); ctx.moveTo(0, -s4 * 2); ctx.quadraticCurveTo(0, 0, s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, s4 * 2); ctx.quadraticCurveTo(0, 0, -s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -s4 * 2); ctx.fill();
    }
    ctx.restore(); return p.life < p.max;
  }

  /* ---------- Pip: breathes, blinks, looks at you, scarf tail flutters, hops ---------- */
  var pupL = $('#pupilL'), pupR = $('#pupilR'), tail = $('#tail'), pipInner = $('#pipInner'), eyesOpen = $('#eyesOpen'), eyesShut = $('#eyesShut');
  var look = { x: 0, y: 0 }, lookT = { x: 0, y: 0.2 };
  addEventListener('pointermove', function (e) {
    var r = $('#pip').getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.41;
    var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
    lookT.x = dx / d; lookT.y = dy / d;
  }, { passive: true });

  var last = performance.now(), t0 = last, nextShoot = last + 2000, blinkAt = last + 2600, raf = null;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    starAlpha += (starTarget - starAlpha) * 0.04;
    if (starAlpha > 0.02) {
      for (var i = 0; i < stars.length; i++) { var s = stars[i]; ctx.globalAlpha = starAlpha * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.s + s.p))); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); }
      ctx.globalAlpha = 1;
      if (!shooting && now > nextShoot && starAlpha > 0.5) shooting = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.25, l: 0 };
    }
    if (shooting) {
      shooting.l += dt; var k = shooting.l / 1.6, x2 = shooting.x + k * 300, y2 = shooting.y + k * 120;
      var gg = ctx.createLinearGradient(x2 - 100, y2 - 40, x2, y2); gg.addColorStop(0, 'rgba(255,246,216,0)'); gg.addColorStop(1, 'rgba(255,246,216,' + (1 - k) + ')');
      ctx.strokeStyle = gg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x2 - 100, y2 - 40); ctx.lineTo(x2, y2); ctx.stroke();
      if (k >= 1) { shooting = null; nextShoot = now + 9000 + Math.random() * 9000; }
    }
    if (fxKind) { emit += dt; var rate = { rain: 0.035, fog: 0.5, zzz: 1.1, confetti: 2.8, swirl: 0.4, leaves: 0.32, embers: 0.22, sparkle: 0.2 }[fxKind] || 0.3; if (emit > rate) { emit = 0; spawn(fxKind, fxKind === 'confetti' ? 20 : fxKind === 'rain' ? 4 : 1); } }
    parts = parts.filter(function (p) { return draw(p, dt); });

    // planet: idle drift of 2° a second, or ease to a target (PlanetSpin)
    if (target !== null) { var dA = target - angle; angle += dA * Math.min(1, dt * 1.6); if (Math.abs(dA) < 0.2) { angle = target; target = null; } }
    else angle += 2 * dt;
    spinner.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    $$('.planted', spinner).forEach(function (el) { if (el._sway) el.firstChild.style.transform = 'rotate(' + (Math.sin(t * 1.75 + el._ph) * 4).toFixed(2) + 'deg)'; });

    // the sun or moon friend swings round the planet (SkyOrbit)
    var a = (t / 30 % 1) * 2 * Math.PI, sw = 0.5 - 0.5 * Math.cos(t / 23 * 2 * Math.PI), rr = 150 + 125 * sw;
    var orb = $('#orbiter'); orb.style.transform = 'translate(' + (180 + rr * Math.cos(a) - 24).toFixed(1) + 'px,' + (384 + rr * Math.sin(a) - 24).toFixed(1) + 'px)' + (tod.id === 'day' ? ' rotate(' + (Math.sin(t * 2) * 8).toFixed(1) + 'deg)' : '');

    // Pip
    look.x += (lookT.x - look.x) * 0.12; look.y += (lookT.y - look.y) * 0.12;
    var off = 7.98 * 0.3;
    pupL.setAttribute('cx', (27.55 + look.x * off).toFixed(2)); pupL.setAttribute('cy', (29.64 + look.y * off).toFixed(2));
    pupR.setAttribute('cx', (48.45 + look.x * off).toFixed(2)); pupR.setAttribute('cy', (29.64 + look.y * off).toFixed(2));
    var br = Math.sin(t / 1.6 * Math.PI), sx = 1.005 + br * 0.025, sy = 0.995 - br * 0.025, lift = 0, sq = 1;
    if (hopT > 0) {
      var h = (now - hopT) / 1000;
      if (h < 0.12) sq = 1 - 0.14 * (h / 0.12);
      else if (h < 0.36) { var q = (h - 0.12) / 0.24; lift = -34 * Math.sin(q * Math.PI / 2); sq = 0.86 + 0.2 * q; }
      else if (h < 0.56) { var q2 = (h - 0.36) / 0.2; lift = -34 * (1 - q2 * q2); sq = 1.06; }
      else if (h < 0.9) { sq = 1 + 0.06 * Math.cos((h - 0.56) / 0.34 * Math.PI * 2) * (1 - (h - 0.56) / 0.34); }
      else hopT = -1;
    }
    pipInner.setAttribute('transform', 'translate(0 ' + lift.toFixed(2) + ') translate(38 72.2) scale(' + (sx * (2 - sq)).toFixed(3) + ' ' + (sy * sq).toFixed(3) + ') translate(-38 -72.2)');
    tail.setAttribute('d', 'M60.8 53.6 Q79.8 57.4 89.3 ' + (42 + Math.sin(t / 0.9 * Math.PI) * 4).toFixed(2));
    if (now > blinkAt) { eyesOpen.setAttribute('opacity', 0); eyesShut.setAttribute('opacity', 1); setTimeout(function () { eyesOpen.setAttribute('opacity', 1); eyesShut.setAttribute('opacity', 0); }, 130); blinkAt = now + 2600 + Math.random() * 2600; }
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
    var o = $('#orbiter'); o.style.transform = 'translate(296px,120px)';
  }

  /* ---------- below the planet ---------- */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { var v = e.target; if (e.isIntersecting) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); });
    }, { threshold: 0.3 });
    $$('main video').forEach(function (v) { vio.observe(v); });
    var rio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { threshold: 0.15 });
    $$('.rise').forEach(function (el) { rio.observe(el); });
    var dock = $('#dock');
    var heroSeen = true, footSeen = false, foot = $('.groundbar');
    function dockUpdate() { dock.classList.toggle('on', !heroSeen && !footSeen); }
    new IntersectionObserver(function (e) { heroSeen = e[0].isIntersecting; dockUpdate(); }, { threshold: 0.05 }).observe(hero);
    if (foot) new IntersectionObserver(function (e) { footSeen = e[0].isIntersecting; dockUpdate(); }, { threshold: 0.05 }).observe(foot);
  } else { $$('.rise').forEach(function (el) { el.classList.add('in'); }); }
})();
