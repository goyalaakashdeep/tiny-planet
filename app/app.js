/* Tiny Planet, the website version of the app. Plain JS, no libraries. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body, world = $('#world');

  /* ---------------- data, taken from the app ---------------- */
  var FEEL = [
    { id: 'happy',   label: 'Happy',   name: 'Bunbun', c: '#ffc23d', w: 'sunny',         fx: 'sparkle', face: 'happy',
      say: ['Happy looks good on you!', 'Sunny days are my favourite!', 'Your smile made the grass grow a little taller.'] },
    { id: 'excited', label: 'Excited', name: 'Zoom',   c: '#ff8a3d', w: 'bouncy',        fx: 'confetti', face: 'excited',
      say: ['Zoom zoom! Tell me the exciting bit!', "Boing boing! I can't stop bouncing either!", 'Big energy today! Save some for tomorrow.'] },
    { id: 'okay',    label: 'Okay',    name: 'Puff',   c: '#7fd3b4', w: 'partly cloudy', fx: 'leaves', face: 'happy',
      say: ['Okay days are cosy days. Me too!', 'Not up, not down. Just a nice regular day.', 'I like okay days.'] },
    { id: 'sleepy',  label: 'Sleepy',  name: 'Nap',    c: '#b8c9ec', w: 'sleepy',        fx: 'zzz', face: 'sleepy',
      say: ['Cosy blanket mode: on. Sweet dreams soon.', 'Yaaawn… me too. Early night for us both?', "Sleepy is my superpower. Let's rest soon."] },
    { id: 'meh',     label: 'Meh',     name: 'Mist',   c: '#a9b1c6', w: 'foggy',         fx: 'fog', face: 'sleepy',
      say: ['Meh is allowed. Some days are just foggy.', "Foggy day? Let's find one fun thing.", 'Wanna just sit here for a bit?'] },
    { id: 'sad',     label: 'Sad',     name: 'Brolly', c: '#9db4e8', w: 'rainy',         fx: 'rain', face: 'sad',
      say: ["I'll sit with you for a bit. No rush.", "Rainy days help flowers grow. I'm right here.", "Want a cuddle? I'm very good at cuddles."] },
    { id: 'worried', label: 'Worried', name: 'Wiggle', c: '#8a6cff', w: 'tangly',        fx: 'swirl', face: 'worried',
      say: ['Worries feel smaller when we share them.', "Tangly thoughts? Let's untangle them together.", 'You were brave to tell me. That helps.'] },
    { id: 'cross',   label: 'Cross',   name: 'Spike',  c: '#e8565c', w: 'stormy',        fx: 'embers', face: 'cross',
      say: ["Grrr is allowed. Let's stomp it out together.", 'Stormy is okay. Big breaths with me in Calm?', "Even storms pass. I'm staying close."] }
  ];
  var REASONS = [
    { id: 'school', label: 'School' }, { id: 'friends', label: 'Friends' }, { id: 'family', label: 'Family' },
    { id: 'playing', label: 'Playing' }, { id: 'food', label: 'Food' }, { id: 'screens', label: 'Screens' },
    { id: 'pets', label: 'Pets' }, { id: 'outdoors', label: 'Outside' }
  ];
  var ASKS = { school: 'Was it school?', friends: 'Was it friends?', family: 'Was it family?', playing: 'Was it playing?', food: 'Was it food?', screens: 'Was it screens?', pets: 'Was it pets?', outdoors: 'Was it outside?' };

  var state = { scene: 'cover', feeling: null, reason: 0, visited: [], kissed: false };
  try { var saved = JSON.parse(localStorage.getItem('tp-visited') || '[]'); if (Array.isArray(saved)) state.visited = saved.filter(function (v) { return FEEL.some(function (f) { return f.id === v; }); }); } catch (e) {}

  /* ---------------- helpers ---------------- */
  var bubble = $('#bubble'), title = $('#title'), kicker = $('#kicker'), main = $('#main'), ask = $('#ask'), toastEl = $('#toast');
  function setScene(s) { state.scene = s; body.setAttribute('data-scene', s); }
  function say(line, small) {
    bubble.textContent = line;
    if (small) { var sm = document.createElement('small'); sm.textContent = small; bubble.appendChild(sm); }
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
  }
  function sky(top, bottom, glow) {
    world.style.setProperty('--top', top); world.style.setProperty('--bottom', bottom);
    world.style.setProperty('--glow', glow || 'transparent');
  }
  function hop() { if (reduce) return; var p = $('.planet-wrap'); p.classList.remove('hop'); void p.offsetWidth; p.classList.add('hop'); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var toastTimer;
  function toast(img, line, small) {
    toastEl.innerHTML = '';
    var i = document.createElement('img'); i.src = img; i.alt = ''; toastEl.appendChild(i);
    var d = document.createElement('div'); d.textContent = line;
    var s = document.createElement('small'); s.textContent = small; d.appendChild(s); toastEl.appendChild(d);
    toastEl.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }
  function timeWord() {
    var d = new Date(), h = d.getHours(), day = d.toLocaleDateString('en', { weekday: 'long' });
    var part = h < 5 ? 'before dawn' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
    return day + ' ' + part;
  }
  function pill(img, b, small, onClick) {
    main.innerHTML = '';
    var btn = document.createElement('button'); btn.className = 'pill';
    var face = document.createElement('span'); face.className = 'face';
    if (img) { var i = document.createElement('img'); i.src = img; i.alt = ''; face.appendChild(i); }
    var txt = document.createElement('span'); var bb = document.createElement('b'); bb.textContent = b; txt.appendChild(bb);
    if (small) { var sm = document.createElement('small'); sm.textContent = small; txt.appendChild(sm); }
    btn.appendChild(face); btn.appendChild(txt); btn.addEventListener('click', onClick);
    main.appendChild(btn); return btn;
  }

  /* a slide-to-do-it control, like the app's */
  function makeSlider(el, onDone) {
    var knob = el.querySelector('.knob'), fill = el.querySelector('.fill'), x = 0, max = 0, dragging = false, start = 0, done = false;
    function set(v) { x = Math.max(0, Math.min(max, v)); knob.style.transform = 'translateX(' + x + 'px)'; fill.style.width = (x + 60) + 'px'; el.setAttribute('aria-valuenow', Math.round(x / (max || 1) * 100)); }
    function finish() { if (done) return; done = true; set(max); setTimeout(onDone, 180); }
    function measure() { max = el.clientWidth - 60; }
    el.addEventListener('pointerdown', function (e) { measure(); dragging = true; start = e.clientX - x; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function (e) { if (dragging) set(e.clientX - start); });
    el.addEventListener('pointerup', function () { dragging = false; if (x > max * 0.8) finish(); else { knob.style.transition = 'transform .3s'; set(0); setTimeout(function () { knob.style.transition = ''; }, 300); } });
    el.addEventListener('keydown', function (e) { measure(); if (e.key === 'ArrowRight') { set(x + max / 5); if (x >= max) finish(); e.preventDefault(); } if (e.key === 'Enter' || e.key === ' ') { finish(); e.preventDefault(); } });
    return { reset: function () { done = false; measure(); set(0); } };
  }

  /* ---------------- the sky: stars, shooting stars, weather ---------------- */
  var canvas = $('#sky'), ctx = canvas.getContext('2d'), W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [], parts = [], shooting = null, fx = null, starAlpha = 1;
  function size() {
    W = innerWidth; H = innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = []; var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.8, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.3, s: 0.6 + Math.random() * 1.8 });
  }
  size(); addEventListener('resize', size);
  function planetBox() { var r = $('#planetWrap').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.577, r: r.width * 0.365, w: r.width }; }
  function spawn(kind, n) {
    var b = planetBox();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, p = { k: kind, life: 0, max: 2.6 + Math.random() * 1.6 };
      if (kind === 'rain') { p.x = Math.random() * W; p.y = -20 - Math.random() * 80; p.vx = -0.6; p.vy = 7 + Math.random() * 3; p.max = H / 400 + 0.5; }
      else if (kind === 'fog') { p.x = -100 + Math.random() * W * 0.7; p.y = b.y - b.r * 1.3 + Math.random() * b.r * 2.6; p.vx = 0.3 + Math.random() * 0.4; p.vy = 0; p.rad = 50 + Math.random() * 80; p.max = 6; }
      else if (kind === 'zzz') { p.x = b.x + b.w * 0.08 + Math.random() * 20; p.y = b.y - b.r * 1.55; p.vx = 0.4 + Math.random() * 0.3; p.vy = -0.7 - Math.random() * 0.4; p.size = 14 + Math.random() * 14; p.max = 3.4; }
      else if (kind === 'confetti') { p.x = b.x; p.y = b.y - b.r * 1.2; var sp = 4 + Math.random() * 6; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - 3; p.rot = Math.random() * 6; p.vr = (Math.random() - 0.5) * 0.3; p.col = ['#ffc23d', '#ff8a5b', '#7fd3b4', '#8a6cff', '#fff6d8'][i % 5]; p.max = 3; }
      else if (kind === 'swirl') { p.ang = a; p.rad0 = b.r * (1.1 + Math.random() * 0.35); p.cx = b.x; p.cy = b.y; p.spd = 0.8 + Math.random() * 0.7; p.max = 3.4; }
      else if (kind === 'heart') { p.x = b.x + (Math.random() - 0.5) * b.r; p.y = b.y; p.vx = (Math.random() - 0.5) * 0.8; p.vy = -1.4 - Math.random(); p.size = 6 + Math.random() * 6; p.max = 2.4; }
      else { p.x = b.x + Math.cos(a) * b.r * (0.95 + Math.random() * 0.3); p.y = b.y + Math.sin(a) * b.r * (0.95 + Math.random() * 0.3); p.vx = (Math.random() - 0.5) * 0.6; p.vy = -0.5 - Math.random() * 1.1; p.size = 2 + Math.random() * 3.5; }
      parts.push(p);
    }
  }
  function heartPath(s) { ctx.beginPath(); ctx.moveTo(0, s * 0.3); ctx.bezierCurveTo(-s, -s * 0.5, -s * 0.4, -s * 1.2, 0, -s * 0.5); ctx.bezierCurveTo(s * 0.4, -s * 1.2, s, -s * 0.5, 0, s * 0.3); ctx.fill(); }
  function draw(p, dt) {
    p.life += dt; var k = p.life / p.max, fade = k < 0.12 ? k / 0.12 : (k > 0.7 ? (1 - k) / 0.3 : 1);
    if (fade <= 0) return false;
    ctx.save(); ctx.globalAlpha = Math.max(0, fade);
    switch (p.k) {
      case 'rain': p.x += p.vx; p.y += p.vy; ctx.strokeStyle = 'rgba(205,220,255,0.75)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1.4, p.y + 12); ctx.stroke(); break;
      case 'fog': p.x += p.vx; var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.rad); g.addColorStop(0, 'rgba(225,230,245,0.16)'); g.addColorStop(1, 'rgba(225,230,245,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.rad, 0, 6.3); ctx.fill(); break;
      case 'zzz': p.x += p.vx + Math.sin(p.life * 2) * 0.3; p.y += p.vy; ctx.fillStyle = '#e4e9ff'; ctx.font = '900 ' + p.size + 'px Nunito, ui-rounded, sans-serif'; ctx.fillText('z', p.x, p.y); break;
      case 'confetti': p.vy += 0.14; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-4, -2, 8, 4); break;
      case 'swirl': p.ang += 0.02 * p.spd; var rr = p.rad0 + Math.sin(p.life * 3) * 8, sx = p.cx + Math.cos(p.ang) * rr, sy = p.cy + Math.sin(p.ang) * rr * 0.55; ctx.strokeStyle = 'rgba(190,175,255,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(sx, sy, 6, p.life * 4, p.life * 4 + 4.4); ctx.stroke(); break;
      case 'leaves': p.x += p.vx + Math.sin(p.life * 2.4) * 0.5; p.y += p.vy; ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.life * 2) * 0.8); ctx.fillStyle = '#9be8c6'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, 6.3); ctx.fill(); break;
      case 'embers': p.x += p.vx; p.y += p.vy * 1.2; ctx.fillStyle = 'rgba(255,150,120,0.95)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.8, 0, 6.3); ctx.fill(); break;
      case 'heart': p.x += p.vx; p.y += p.vy; ctx.translate(p.x, p.y); ctx.fillStyle = '#ff6f91'; heartPath(p.size); break;
      default: p.x += p.vx; p.y += p.vy; var s4 = p.size * (1 + Math.sin(p.life * 8) * 0.3); ctx.fillStyle = '#ffe08a'; ctx.translate(p.x, p.y); ctx.beginPath(); ctx.moveTo(0, -s4 * 2); ctx.quadraticCurveTo(0, 0, s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, s4 * 2); ctx.quadraticCurveTo(0, 0, -s4 * 2, 0); ctx.quadraticCurveTo(0, 0, 0, -s4 * 2); ctx.fill();
    }
    ctx.restore(); return p.life < p.max;
  }

  /* ---------------- Pip: eyes follow you, scarf flutters, planet turns ---------------- */
  var pl = $('#pupilL'), pr = $('#pupilR'), scarf = $('#scarf'), spots = $('#spots'), svg = $('.planet-wrap svg');
  var look = { x: 0, y: 0 }, lookT = { x: 0, y: 0 };
  addEventListener('pointermove', function (e) {
    var r = svg.getBoundingClientRect(), s = r.width / 520, ex = r.left + 262 * s, ey = r.top + 28 * s;
    var dx = e.clientX - ex, dy = e.clientY - ey, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 260);
    lookT.x = dx / d * 5 * m; lookT.y = dy / d * 5 * m;
  }, { passive: true });

  var last = performance.now(), t0 = last, spin = 0, nextShoot = last + 2000, emit = 0, blinkAt = last + 3000;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) { var s = stars[i]; ctx.globalAlpha = starAlpha * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.s + s.p))); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (starAlpha > 0.3 && !shooting && now > nextShoot) shooting = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.25, l: 0 };
    if (shooting) {
      shooting.l += dt; var k = shooting.l / 0.9, x2 = shooting.x + k * 300, y2 = shooting.y + k * 120;
      var gg = ctx.createLinearGradient(x2 - 100, y2 - 40, x2, y2); gg.addColorStop(0, 'rgba(255,246,216,0)'); gg.addColorStop(1, 'rgba(255,246,216,' + (1 - k) + ')');
      ctx.strokeStyle = gg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x2 - 100, y2 - 40); ctx.lineTo(x2, y2); ctx.stroke();
      if (k >= 1) { shooting = null; nextShoot = now + 4500 + Math.random() * 6000; }
    }
    if (fx) {
      emit += dt; var rate = { rain: 0.02, fog: 0.3, zzz: 0.6, confetti: 1.6, swirl: 0.22, leaves: 0.16, embers: 0.1, sparkle: 0.1 }[fx] || 0.2;
      if (emit > rate) { emit = 0; spawn(fx, fx === 'confetti' ? 20 : fx === 'rain' ? 4 : 1); }
    }
    parts = parts.filter(function (p) { return draw(p, dt); });
    spin = (spin + dt * 16) % 380; spots.setAttribute('transform', 'translate(' + (-spin) + ' 0)');
    look.x += (lookT.x - look.x) * 0.12; look.y += (lookT.y - look.y) * 0.12;
    pl.setAttribute('cx', (244 + look.x).toFixed(2)); pl.setAttribute('cy', (30 + look.y).toFixed(2));
    pr.setAttribute('cx', (284 + look.x).toFixed(2)); pr.setAttribute('cy', (30 + look.y).toFixed(2));
    if (now > blinkAt) { $('#pipEyes').style.transform = 'scaleY(0.1)'; $('#pipEyes').style.transformOrigin = '262px 28px'; setTimeout(function () { $('#pipEyes').style.transform = ''; }, 130); blinkAt = now + 2500 + Math.random() * 4000; }
    var f1 = Math.sin(t * 3.2) * 7, f2 = Math.sin(t * 3.2 + 1.2) * 10;
    scarf.setAttribute('d', 'M190 80 q70 26 140 -2 q' + (20 + f1 * 0.4).toFixed(1) + ' ' + (-8 + f1).toFixed(1) + ' ' + (30 + f2 * 0.3).toFixed(1) + ' ' + (-26 + f2).toFixed(1));
    $$('.pick img, .visitor img').forEach(function (im, j) { im.style.transform = 'translateY(' + (Math.sin(t * 1.4 + j) * 5).toFixed(1) + 'px) rotate(' + (Math.sin(t + j) * 4).toFixed(1) + 'deg)'; });
    requestAnimationFrame(frame);
  }
  if (!reduce) requestAnimationFrame(frame);
  else { for (var q = 0; q < stars.length; q++) { ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(stars[q].x, stars[q].y, stars[q].r, 0, 6.3); ctx.fill(); } }

  /* ---------------- friends who have visited live on the planet ---------------- */
  var SPOTS = [[-62, 18], [58, 20], [-80, 44], [80, 46], [-40, 6], [42, 8], [-70, 70], [70, 72]];
  function renderVisitors() {
    var box = $('#visitors'); box.innerHTML = '';
    state.visited.forEach(function (id, i) {
      var a = SPOTS[i % SPOTS.length], ang = a[0], rad = (ang) * Math.PI / 180;
      var cx = 50 + Math.sin(rad) * 36.5, cy = 57.7 - Math.cos(rad) * 36.5;
      var d = document.createElement('div'); d.className = 'visitor';
      d.style.left = cx + '%'; d.style.top = cy + '%'; d.style.setProperty('--r', ang + 'deg');
      var im = document.createElement('img'); im.src = 'app/f/' + id + '.png'; im.alt = '';
      d.appendChild(im); box.appendChild(d);
    });
  }

  /* ---------------- scenes ---------------- */
  function home() {
    setScene('home'); fx = null; body.classList.remove('night', 'kissed');
    sky('#2b2668', '#5b4fd0'); starAlpha = 1;
    kicker.textContent = timeWord(); title.textContent = 'Your planet';
    say(state.visited.length ? 'Welcome back!' : "Hi! I'm Pip.", 'Will you tell me about today?');
    pill('app/f/obj_happy.png', 'Tell Pip about today', 'Who visited you?', feeling);
  }

  var picker = $('#picker');
  FEEL.forEach(function (f, i) {
    var ang = -150 + i * (300 / 7), rad = ang * Math.PI / 180;
    var b = document.createElement('button'); b.className = 'pick'; b.type = 'button';
    b.style.left = (50 + Math.sin(rad) * 49) + '%'; b.style.top = (55 - Math.cos(rad) * 46) + '%';
    b.style.transitionDelay = (i * 0.04) + 's';
    b.setAttribute('aria-label', f.label);
    var im = document.createElement('img'); im.src = 'app/f/obj_' + f.id + '.png'; im.alt = '';
    var sp = document.createElement('span'); sp.textContent = f.label;
    b.appendChild(im); b.appendChild(sp); b.addEventListener('click', function () { chooseFeeling(f, b); });
    picker.appendChild(b);
  });
  function feeling() {
    setScene('feeling'); picker.classList.remove('done'); $$('.pick').forEach(function (b) { b.classList.remove('chosen'); });
    kicker.textContent = 'How was today?'; title.textContent = 'Pick a feeling';
    say('How did today feel?', 'Tap one of my friends.');
    main.innerHTML = '';
    setTimeout(function () { var first = $('.pick'); if (first) first.focus({ preventScroll: true }); }, 400);
  }
  function chooseFeeling(f, b) {
    if (state.scene !== 'feeling') return;
    state.feeling = f; b.classList.add('chosen'); picker.classList.add('done');
    fx = f.fx; parts = []; emit = 99; hop();
    sky('#3a76b8', '#86c3dc', hexA(f.c, 0.45));
    kicker.textContent = 'Today felt'; title.textContent = f.label;
    say(pick(f.say));
    setTimeout(reason, reduce ? 300 : 1500);
  }
  function hexA(h, a) { var n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

  /* the wheel */
  var items = $('#items'), centre = 0;
  REASONS.forEach(function (r, i) {
    var b = document.createElement('button'); b.className = 'reason'; b.type = 'button'; b.setAttribute('role', 'option');
    var im = document.createElement('img'); im.alt = ''; b.appendChild(im);
    var sp = document.createElement('span'); sp.textContent = r.label; b.appendChild(sp);
    b.addEventListener('click', function () { if (i === centre) chooseReason(); else { centre = i; layoutWheel(); } });
    items.appendChild(b);
  });
  function layoutWheel() {
    var n = REASONS.length, step = Math.min(118, innerWidth / 4.3);
    $$('.reason', items).forEach(function (b, i) {
      var d = ((i - centre) % n + n + n / 2) % n - n / 2; // shortest way round
      var x = d * step, y = Math.abs(d) * Math.abs(d) * 9, sc = d === 0 ? 1.28 : Math.max(0.6, 1 - Math.abs(d) * 0.13);
      b.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')';
      b.style.opacity = Math.abs(d) > 2.6 ? 0 : 1; b.style.zIndex = 10 - Math.abs(Math.round(d));
      b.classList.toggle('center', d === 0); b.classList.toggle('far', Math.abs(d) > 1); b.setAttribute('aria-selected', d === 0 ? 'true' : 'false');
      b.tabIndex = d === 0 ? 0 : -1;
    });
    var r = REASONS[centre]; say(ASKS[r.id] || 'Was it this?', state.feeling ? 'What made it ' + state.feeling.w + '?' : '');
  }
  function spinBy(n) { centre = (centre + n + REASONS.length) % REASONS.length; layoutWheel(); }
  $('#prev').addEventListener('click', function () { spinBy(-1); });
  $('#next').addEventListener('click', function () { spinBy(1); });
  var dragX = null, moved = 0;
  items.addEventListener('pointerdown', function (e) { dragX = e.clientX; moved = 0; });
  addEventListener('pointerup', function () { dragX = null; });
  items.addEventListener('pointermove', function (e) { if (dragX === null) return; var dx = e.clientX - dragX; if (Math.abs(dx) > 50) { spinBy(dx < 0 ? 1 : -1); dragX = e.clientX; moved++; } });
  items.addEventListener('wheel', function (e) { if (state.scene !== 'reason') return; e.preventDefault(); if (Math.abs(e.deltaX) + Math.abs(e.deltaY) > 12) spinBy((e.deltaX || e.deltaY) > 0 ? 1 : -1); }, { passive: false });
  addEventListener('keydown', function (e) {
    if (state.scene !== 'reason' || $('.sheet.open')) return;
    if (e.key === 'ArrowRight') { spinBy(1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { spinBy(-1); e.preventDefault(); }
  });
  function reason() {
    setScene('reason'); var f = state.feeling;
    $$('.reason img', items).forEach(function (im, i) { im.src = 'app/rsn/' + REASONS[i].id + '_' + f.face + '.png'; });
    ask.textContent = 'What made it ' + f.w + '?';
    centre = 0; layoutWheel();
    main.innerHTML = '';
    setTimeout(function () { var c = $('.reason.center'); if (c) c.focus({ preventScroll: true }); }, 500);
  }
  function chooseReason() {
    if (state.scene !== 'reason') return;
    state.reason = centre; hop();
    say('Ooh, ' + REASONS[centre].label.toLowerCase() + '!', 'Want to tell me more?');
    setTimeout(star, reduce ? 200 : 700);
  }

  /* hold the star */
  var starBtn = $('#starBtn'), ring = $('#ringFill'), holdT = null, held = 0, holdStart = 0;
  function star() { setScene('star'); main.innerHTML = ''; ring.style.strokeDashoffset = 327; setTimeout(function () { starBtn.focus({ preventScroll: true }); }, 400); }
  function holdTick() {
    held = Math.min(1, (performance.now() - holdStart) / 1800);
    ring.style.strokeDashoffset = 327 * (1 - held);
    if (held >= 1) { stopHold(); say('I heard every word.', 'Thank you for telling me.'); setTimeout(reaction, 900); return; }
    holdT = requestAnimationFrame(holdTick);
  }
  function startHold(e) { if (state.scene !== 'star') return; if (e) e.preventDefault(); starBtn.classList.add('holding'); holdStart = performance.now() - held * 1800; say('Pip is listening…'); holdT = requestAnimationFrame(holdTick); }
  function stopHold() { starBtn.classList.remove('holding'); if (holdT) cancelAnimationFrame(holdT); holdT = null; }
  starBtn.addEventListener('pointerdown', startHold);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { starBtn.addEventListener(ev, function () { if (held < 1) { stopHold(); } }); });
  starBtn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !holdT) startHold(e); });
  starBtn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { if (held < 1) stopHold(); } });
  starBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  $('#skipStar').addEventListener('click', function () { if (state.scene === 'star') reaction(); });

  /* Pip reacts, a friend moves in, then bedtime */
  var sleepSlider;
  function reaction() {
    held = 0; setScene('reaction'); var f = state.feeling;
    hop(); say(pick(f.say));
    var isNew = state.visited.indexOf(f.id) < 0;
    if (isNew) { state.visited.push(f.id); try { localStorage.setItem('tp-visited', JSON.stringify(state.visited)); } catch (e) {} }
    renderVisitors(); renderStickers();
    toast('app/f/' + f.id + '.png', isNew ? f.name + ' moved onto your planet' : f.name + ' came back to visit', isNew ? 'New sticker in your sticker book' : 'Friends who visit often grow a story');
    main.innerHTML = '<div class="slider" id="sleepSlider" role="slider" aria-label="Slide to sleep" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><div class="fill"></div><div class="label">Slide to sleep</div><span class="knob" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M15 4a8 8 0 1 0 5 13 7 7 0 0 1-5-13z" fill="currentColor"/></svg></span></div>';
    sleepSlider = makeSlider($('#sleepSlider'), goodnight);
    kicker.textContent = 'Today felt'; title.textContent = f.label;
  }
  function goodnight() {
    setScene('night'); fx = null; parts = [];
    body.classList.add('night'); sky('#0f0c2e', '#2b2668'); starAlpha = 1;
    kicker.textContent = 'Sweet dreams'; title.textContent = 'Goodnight';
    say('Zzz…', 'Night night. Blow me a kiss?');
    if (!reduce) setTimeout(function () { fx = 'zzz'; }, 600);
    pill('app/rare_heart.png', 'Blow Pip a kiss', 'Then sweet dreams', kiss);
  }
  function kiss() {
    if (state.kissed && body.classList.contains('kissed')) { finale(); return; }
    state.kissed = true; body.classList.add('kissed');
    if (!reduce) spawn('heart', 14);
    say('Pip got your kiss!', 'Sleep tight.');
    pill('app/rare_moon.png', "That's a day on Tiny Planet", 'Grown-ups, see what you would see', finale);
  }
  function finale() { openSheet('cornerSheet'); }

  /* ---------------- sheets ---------------- */
  var lastFocus = null;
  function openSheet(id) {
    lastFocus = document.activeElement;
    var s = document.getElementById(id); s.classList.add('open');
    setTimeout(function () { var c = s.querySelector('.close'); if (c) c.focus({ preventScroll: true }); }, 50);
    if (id === 'cornerSheet') renderWeek();
  }
  function closeSheets() { $$('.sheet.open').forEach(function (s) { s.classList.remove('open'); }); stopBreath(); if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $$('[data-close]').forEach(function (el) { el.addEventListener('click', closeSheets); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); });
  $('#stickersBtn').addEventListener('click', function () { openSheet('stickersSheet'); });
  $('#calmBtn').addEventListener('click', function () { openSheet('calmSheet'); });
  $('#cornerBtn').addEventListener('click', function () { openSheet('cornerSheet'); });
  $('#soonLink').addEventListener('click', function (e) { e.preventDefault(); openSheet('cornerSheet'); unlock(); showPane('press'); });

  function renderStickers() {
    var g = $('#stickers'); g.innerHTML = '';
    FEEL.forEach(function (f) {
      var got = state.visited.indexOf(f.id) >= 0, d = document.createElement('div'); d.className = 'stk' + (got ? '' : ' locked');
      var im = document.createElement('img'); im.src = 'app/f/' + f.id + '.png'; im.alt = got ? f.name : 'Not met yet';
      var b = document.createElement('b'); b.textContent = got ? f.name : '?';
      var s = document.createElement('small'); s.textContent = f.label;
      d.appendChild(im); d.appendChild(b); d.appendChild(s); g.appendChild(d);
    });
  }
  renderStickers(); renderVisitors();

  /* calm: breathe in 4, out 4 */
  var breathTimer = null, orb = $('#orb'), bSay = $('#breathSay'), bBtn = $('#breathBtn');
  function stopBreath() { clearTimeout(breathTimer); breathTimer = null; orb.style.setProperty('--b', 0.6); bSay.textContent = 'Ready?'; bBtn.textContent = 'Breathe with Puff'; }
  function breathe(n) {
    if (n >= 6) { bSay.textContent = 'Lovely. You did it.'; bBtn.textContent = 'Again'; breathTimer = null; orb.style.setProperty('--b', 0.6); return; }
    var inn = n % 2 === 0; bSay.textContent = inn ? 'Breathe in…' : 'And out…'; orb.style.setProperty('--b', inn ? 1 : 0.55);
    breathTimer = setTimeout(function () { breathe(n + 1); }, 4000);
  }
  bBtn.addEventListener('click', function () { if (breathTimer) { stopBreath(); return; } bBtn.textContent = 'Stop'; breathe(0); });

  /* the grown-up corner */
  var keys = $('#keys'), entered = 0;
  [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = k;
    if (k === '') { b.style.visibility = 'hidden'; b.tabIndex = -1; }
    b.setAttribute('aria-label', k === '⌫' ? 'Delete' : String(k));
    b.addEventListener('click', function () {
      if (k === '⌫') entered = Math.max(0, entered - 1); else entered++;
      $$('#dots i').forEach(function (d, i) { d.classList.toggle('on', i < entered); });
      if (entered >= 4) setTimeout(unlock, 220);
    });
    keys.appendChild(b);
  });
  function unlock() { $('#pin').hidden = true; $('#corner').hidden = false; entered = 0; $$('#dots i').forEach(function (d) { d.classList.remove('on'); }); }
  $('#pinSkip').addEventListener('click', unlock);
  function showPane(name) {
    $$('.tabs button').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.pane === name ? 'true' : 'false'); });
    $$('.pane').forEach(function (p) { p.classList.toggle('on', p.id === 'pane-' + name); });
  }
  $$('.tabs button').forEach(function (t) { t.addEventListener('click', function () { showPane(t.dataset.pane); }); });
  function renderWeek() {
    var w = $('#week'); w.innerHTML = ''; var today = (new Date().getDay() + 6) % 7, names = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    names.forEach(function (n, i) {
      var d = document.createElement('div'); if (i === today) d.className = 'today';
      var c = document.createElement('i');
      if (i === today && state.feeling) { var im = document.createElement('img'); im.src = 'app/f/obj_' + state.feeling.id + '.png'; im.alt = state.feeling.label; c.appendChild(im); }
      d.appendChild(c); var s = document.createElement('span'); s.textContent = n; d.appendChild(s); w.appendChild(d);
    });
    $('#weekTitle').textContent = state.feeling ? 'Today felt ' + state.feeling.w : 'This week';
  }

  /* ---------------- start ---------------- */
  makeSlider($('#beginSlider'), function () { home(); });
  $('#skipToCorner').addEventListener('click', function () { home(); openSheet('cornerSheet'); unlock(); showPane('about'); });
  if (location.hash === '#press') { home(); openSheet('cornerSheet'); unlock(); showPane('press'); }
  else if (location.hash === '#help') { home(); openSheet('cornerSheet'); unlock(); showPane('help'); }
  sky('#2b2668', '#5b4fd0');
})();
