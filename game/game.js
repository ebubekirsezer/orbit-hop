/* Orbit Hop: a one-tap YouTube Playable.
 * Hop from planet to planet before the one you stand on crumbles.
 * No dependencies, no network calls, no external assets. */
(() => {
  'use strict';

  // ---------------------------------------------------------------- platform
  const yt = window.ytgame;
  const IN_ENV = !!(yt && yt.IN_PLAYABLES_ENV);
  const DEV_KEY = 'orbit-hop-dev-save'; // only used outside YouTube (local testing)

  const Platform = {
    firstFrameReady() { try { if (IN_ENV) yt.game.firstFrameReady(); } catch (e) { /* ignore */ } },
    gameReady() { try { if (IN_ENV) yt.game.gameReady(); } catch (e) { /* ignore */ } },
    async load() {
      if (IN_ENV) return await yt.game.loadData();
      try { return window.localStorage.getItem(DEV_KEY) || ''; } catch (e) { return ''; }
    },
    async save(str) {
      if (IN_ENV) return await yt.game.saveData(str);
      try { window.localStorage.setItem(DEV_KEY, str); } catch (e) { /* ignore */ }
    },
    async lang() {
      if (IN_ENV) { try { return await yt.system.getLanguage(); } catch (e) { return 'en'; } }
      const m = /[?&]lang=([a-zA-Z-]+)/.exec(window.location.search); // local testing only
      return m ? m[1] : 'en';
    },
    audioEnabled() { try { return IN_ENV ? yt.system.isAudioEnabled() : true; } catch (e) { return true; } },
    onAudioChange(cb) { try { if (IN_ENV) yt.system.onAudioEnabledChange(cb); } catch (e) { /* ignore */ } },
    onPause(cb) { try { if (IN_ENV) yt.system.onPause(cb); } catch (e) { /* ignore */ } },
    onResume(cb) { try { if (IN_ENV) yt.system.onResume(cb); } catch (e) { /* ignore */ } },
    sendScore(v) { try { if (IN_ENV) yt.engagement.sendScore({ value: v }).catch(() => {}); } catch (e) { /* ignore */ } },
    logError() { try { if (IN_ENV) yt.health.logError(); } catch (e) { /* ignore */ } },
  };
  window.addEventListener('error', () => Platform.logError());
  window.addEventListener('unhandledrejection', () => Platform.logError());

  // ---------------------------------------------------------------- strings
  const STR = {
    en: { play: 'PLAY', best: 'Best', tap: 'Tap to jump to the next planet', hint: 'Hop before your planet crumbles!', over: 'Lost in space!', crumble: 'Your planet crumbled!', newBest: 'NEW BEST!', retry: 'Tap to try again', menu: 'Menu', unlock: 'Unlock', need: 'Need', perfect: 'Perfect!', loading: 'Loading…', paused: 'Paused' },
    tr: { play: 'OYNA', best: 'En iyi', tap: 'Sonraki gezegene zıplamak için dokun', hint: 'Gezegenin ufalanmadan zıpla!', over: 'Uzayda kayboldun!', crumble: 'Gezegenin ufalandı!', newBest: 'YENİ REKOR!', retry: 'Tekrar denemek için dokun', menu: 'Menü', unlock: 'Aç', need: 'Gerekli', perfect: 'Mükemmel!', loading: 'Yükleniyor…', paused: 'Duraklatıldı' },
    es: { play: 'JUGAR', best: 'Récord', tap: 'Toca para saltar al siguiente planeta', hint: '¡Salta antes de que tu planeta se desmorone!', over: '¡Perdido en el espacio!', crumble: '¡Tu planeta se desmoronó!', newBest: '¡NUEVO RÉCORD!', retry: 'Toca para reintentar', menu: 'Menú', unlock: 'Desbloquear', need: 'Necesitas', perfect: '¡Perfecto!', loading: 'Cargando…', paused: 'En pausa' },
    pt: { play: 'JOGAR', best: 'Recorde', tap: 'Toque para pular para o próximo planeta', hint: 'Pule antes que seu planeta desmorone!', over: 'Perdido no espaço!', crumble: 'Seu planeta desmoronou!', newBest: 'NOVO RECORDE!', retry: 'Toque para tentar de novo', menu: 'Menu', unlock: 'Desbloquear', need: 'Precisa', perfect: 'Perfeito!', loading: 'Carregando…', paused: 'Pausado' },
    de: { play: 'SPIELEN', best: 'Rekord', tap: 'Tippe, um zum nächsten Planeten zu springen', hint: 'Spring, bevor dein Planet zerbröselt!', over: 'Im All verloren!', crumble: 'Dein Planet ist zerbröselt!', newBest: 'NEUER REKORD!', retry: 'Tippe für einen neuen Versuch', menu: 'Menü', unlock: 'Freischalten', need: 'Benötigt', perfect: 'Perfekt!', loading: 'Lädt…', paused: 'Pausiert' },
    fr: { play: 'JOUER', best: 'Record', tap: 'Touche pour sauter vers la planète suivante', hint: 'Saute avant que ta planète ne s’effrite !', over: 'Perdu dans l’espace !', crumble: 'Ta planète s’est effritée !', newBest: 'NOUVEAU RECORD !', retry: 'Touche pour réessayer', menu: 'Menu', unlock: 'Débloquer', need: 'Il faut', perfect: 'Parfait !', loading: 'Chargement…', paused: 'En pause' },
  };
  let T = STR.en;
  function setLang(code) {
    const k = String(code || 'en').toLowerCase().split(/[-_]/)[0];
    T = STR[k] || STR.en;
  }

  // ---------------------------------------------------------------- save data
  const SKINS = [
    { id: 'blip', name: 'Blip', body: '#ff8a65', belly: '#ffd2c2', cost: 0 },
    { id: 'mint', name: 'Mint', body: '#3fcfa8', belly: '#c8f5ea', cost: 20 },
    { id: 'berry', name: 'Berry', body: '#e05a9c', belly: '#f8c6de', cost: 50 },
    { id: 'sky', name: 'Sky', body: '#5c9cff', belly: '#d3e3ff', cost: 100 },
    { id: 'sunny', name: 'Sunny', body: '#ffc83d', belly: '#fff1c4', cost: 180 },
    { id: 'ghost', name: 'Ghost', body: '#e6e9ff', belly: '#ffffff', cost: 300 },
    { id: 'shadow', name: 'Shadow', body: '#463e66', belly: '#8d84bd', cost: 500 },
  ];
  const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

  function defaultSave() { return { v: 1, best: 0, stars: 0, owned: ['blip'], skin: 'blip', plays: 0 }; }
  function parseSave(raw) {
    const s = defaultSave();
    if (!raw) return s;
    try {
      const d = JSON.parse(raw);
      if (d && typeof d === 'object') {
        if (Number.isFinite(d.best) && d.best >= 0) s.best = Math.floor(d.best);
        if (Number.isFinite(d.stars) && d.stars >= 0) s.stars = Math.floor(d.stars);
        if (Number.isFinite(d.plays) && d.plays >= 0) s.plays = Math.floor(d.plays);
        if (Array.isArray(d.owned)) s.owned = ['blip', ...d.owned.filter((id) => typeof id === 'string' && SKINS.some((k) => k.id === id) && id !== 'blip')];
        if (typeof d.skin === 'string' && s.owned.includes(d.skin)) s.skin = d.skin;
      }
    } catch (e) { /* corrupt or foreign data: start fresh but keep going */ }
    return s;
  }
  let save = defaultSave();
  let saveLoaded = false; // saveData MUST NOT be called before loadData resolved
  function persist() {
    if (!saveLoaded) return Promise.resolve();
    return Platform.save(JSON.stringify(save)).catch(() => {});
  }

  // ---------------------------------------------------------------- audio
  const Sound = {
    ctx: null, master: null, enabled: true,
    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      }
      this.apply();
    },
    apply() {
      if (!this.ctx) return;
      this.master.gain.value = this.enabled ? 0.45 : 0;
      if (!this.enabled || paused) { this.ctx.suspend().catch(() => {}); } else { this.ctx.resume().catch(() => {}); }
    },
    tone(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || !this.enabled || paused || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.03);
    },
    jump() { this.tone(380, 0.14, 'square', 0.07, 420); },
    land() { this.tone(200, 0.1, 'sine', 0.3, -70); },
    perfect(n) { const b = 660 * Math.pow(1.06, Math.min(n, 10)); [1, 1.25, 1.5].forEach((m, i) => this.tone(b * m, 0.16, 'triangle', 0.14, 0, i * 0.06)); },
    star() { this.tone(1180, 0.09, 'triangle', 0.12, 500); },
    tick() { this.tone(900, 0.04, 'sine', 0.05); },
    die() { this.tone(320, 0.55, 'sawtooth', 0.09, -260); this.tone(160, 0.6, 'sine', 0.2, -100, 0.05); },
    click() { this.tone(520, 0.05, 'sine', 0.1); },
    buy() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.13, 0, i * 0.07)); },
  };

  // ---------------------------------------------------------------- canvas / layout
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let dpr = 1, cw = 0, ch = 0, scale = 1, vw = 0, vh = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    cw = Math.max(1, window.innerWidth); ch = Math.max(1, window.innerHeight);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    scale = Math.min(cw / 420, ch / 640); // logical play column: 420 x 640, fills the rest
    vw = cw / scale; vh = ch / scale;
    if (!paused && S.mode !== 'loading') render(); // keep the frame correct; state is untouched
  }

  // ---------------------------------------------------------------- helpers
  const rand = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const TAU = Math.PI * 2;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  const PR = 11;        // player radius
  const SPEED = 640;    // flight speed (units/s)
  const HUES = [[255, 138, 101], [110, 196, 250], [160, 210, 110], [196, 140, 230], [255, 205, 80], [100, 210, 190], [240, 105, 150]];
  const diff = (n) => clamp(n / 45, 0, 1);

  // ---------------------------------------------------------------- state
  const S = {
    mode: 'loading', t: 0, score: 0, streak: 0, runStars: 0, reached: 0, nextId: 0,
    planets: [], stars: [], particles: [], popups: [], trail: [], hits: [],
    camY: 0, shake: 0, overT: 0, newBest: false, reason: 'over', view: 0, menuT: 0, tut: true,
    player: null,
  };
  const BG_STARS = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), l: Math.floor(Math.random() * 3), s: rand(0.6, 1.8), tw: rand(0, TAU) }));

  function makePlanet(prev) {
    const id = S.nextId++;
    const d = diff(id);
    const r = clamp(lerp(46, 29, d) + rand(-6, 6), 24, 54);
    const moving = id > 7 && Math.random() < 0.15 + 0.35 * d;
    const amp = moving ? rand(35, 80) : 0;
    const lim = 150 - r - amp;
    const baseX = prev ? rand(-lim, lim) : 0;
    const gap = prev ? 165 + 75 * d + rand(-15, 25) : 0;
    const craters = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => ({ a: rand(0, TAU), d: rand(0.2, 0.7), s: rand(0.12, 0.24) }));
    return {
      id, r, baseX, x: baseX, y: prev ? prev.y - gap : 0, moving, amp, freq: rand(0.6, 1.0) + 0.6 * d, phase: rand(0, TAU),
      spin: (rand(1.3, 1.8) + 1.5 * d) * (Math.random() < 0.5 ? -1 : 1), rot: rand(0, TAU),
      hue: HUES[id % HUES.length], ring: Math.random() < 0.25, craters,
      hold: id === 0 ? 6 : lerp(4.2, 2.3, d), gone: false,
    };
  }

  function spawnAhead() {
    let last = S.planets[S.planets.length - 1];
    while (last.y > S.camY - vh * 0.6) {
      const p = makePlanet(last);
      S.planets.push(p);
      if (Math.random() < 0.75) {
        const t = rand(0.35, 0.65);
        S.stars.push({ x: lerp(last.baseX, p.baseX, t) + rand(-30, 30), y: lerp(last.y, p.y, t), got: false, ph: rand(0, TAU) });
      }
      last = p;
    }
    const cut = S.camY + vh + 260;
    const cur = S.player && S.player.planet;
    S.planets = S.planets.filter((p) => p.y < cut || p === cur);
    S.stars = S.stars.filter((s) => s.y < cut && !s.got);
  }

  function place(pl) {
    const p = pl.planet;
    pl.x = p.x + Math.cos(pl.ang) * (p.r + PR - 2);
    pl.y = p.y + Math.sin(pl.ang) * (p.r + PR - 2);
  }

  function camTarget() { return S.player.planet.y - vh * 0.76; }

  function newRun() {
    S.score = 0; S.streak = 0; S.runStars = 0; S.reached = 0; S.nextId = 0;
    S.planets = []; S.stars = []; S.particles = []; S.popups = []; S.trail = [];
    S.newBest = false; S.shake = 0; S.overT = 0;
    const p0 = makePlanet(null);
    p0.r = 46; p0.spin = 1.35;
    S.planets.push(p0);
    S.player = { state: 'sit', planet: p0, from: null, ang: -Math.PI / 2, x: 0, y: 0, vx: 0, vy: 0, squash: 0, flyT: 0, hold: 0, lastTick: 0, blink: 2 };
    place(S.player);
    S.camY = camTarget();
    spawnAhead();
    S.tut = save.plays < 3;
    S.mode = 'play';
  }

  // ---------------------------------------------------------------- effects
  function burst(x, y, color, n, spd, life) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), v = rand(spd * 0.3, spd);
      S.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(life * 0.5, life), max: life, color, size: rand(1.5, 3.5) });
    }
  }
  function popup(text, x, y, color, size) { S.popups.push({ text, x, y, color: color || '#fff', size: size || 20, life: 1 }); }

  // ---------------------------------------------------------------- game actions
  function jump() {
    const pl = S.player;
    if (S.mode !== 'play' || pl.state !== 'sit') return;
    pl.state = 'fly';
    pl.from = pl.planet;
    pl.vx = Math.cos(pl.ang) * SPEED; pl.vy = Math.sin(pl.ang) * SPEED;
    pl.flyT = 0; pl.squash = -0.6;
    S.trail = [];
    burst(pl.x, pl.y, 'rgba(255,255,255,0.8)', 6, 90, 0.35);
    Sound.jump();
  }

  function land(p, ang) {
    const pl = S.player;
    const nx = Math.cos(ang), ny = Math.sin(ang);
    const dot = -(pl.vx * nx + pl.vy * ny) / SPEED;
    const perfect = dot > 0.965;
    pl.state = 'sit'; pl.planet = p; pl.ang = ang; pl.hold = 0; pl.lastTick = 0; pl.squash = 1;
    place(pl);
    if (p.id > S.reached) {
      S.reached = p.id;
      let pts = 1;
      if (perfect) {
        S.streak++; pts += 1;
        popup(T.perfect + (S.streak > 1 ? ' x' + S.streak : ''), p.x, p.y - p.r - 34, '#ffe27a', 22);
        burst(pl.x, pl.y, '#ffe27a', 16, 160, 0.6);
        Sound.perfect(S.streak);
      } else {
        S.streak = 0;
        Sound.land();
      }
      S.score += pts;
      popup('+' + pts, pl.x + 18, pl.y - 10, '#ffffff', 18);
      if (S.score >= 3) S.tut = false;
    } else {
      Sound.land();
    }
    burst(pl.x, pl.y, `rgb(${p.hue.join(',')})`, 8, 80, 0.4);
  }

  function die(reason) {
    const pl = S.player;
    if (S.mode !== 'play') return;
    S.mode = 'over'; S.overT = 0; S.reason = reason; S.shake = 1;
    pl.state = 'dead';
    burst(pl.x, pl.y, skinById(save.skin).body, 26, 220, 0.9);
    Sound.die();
    save.plays += 1;
    save.stars += S.runStars;
    S.newBest = S.score > save.best;
    if (S.newBest) save.best = S.score;
    const best = save.best, newBest = S.newBest;
    persist().then(() => { if (newBest) Platform.sendScore(best); });
  }

  function crumble(p) {
    p.gone = true;
    burst(p.x, p.y, `rgb(${p.hue.join(',')})`, 40, 200, 1.0);
  }

  // ---------------------------------------------------------------- update
  function update(dt) {
    S.t += dt;
    S.menuT += dt;
    S.shake = Math.max(0, S.shake - dt * 2.5);

    for (const p of S.planets) {
      p.rot += p.spin * dt;
      if (p.moving) p.x = p.baseX + Math.sin(S.t * p.freq + p.phase) * p.amp;
    }

    const pl = S.player;
    if (pl) {
      pl.squash *= Math.exp(-dt * 9);
      pl.blink -= dt; if (pl.blink < -0.12) pl.blink = rand(1.5, 4);
    }

    if (S.mode === 'play') {
      if (pl.state === 'sit') {
        const p = pl.planet;
        pl.ang += p.spin * dt;
        pl.hold += dt;
        place(pl);
        const left = p.hold - pl.hold;
        if (left < 1.2 && Math.floor(left * 4) !== pl.lastTick) { pl.lastTick = Math.floor(left * 4); Sound.tick(); }
        if (left <= 0) { crumble(p); die('crumble'); }
      } else if (pl.state === 'fly') {
        pl.flyT += dt;
        const steps = 4;
        outer: for (let k = 0; k < steps; k++) {
          pl.x += (pl.vx * dt) / steps; pl.y += (pl.vy * dt) / steps;
          for (const p of S.planets) {
            if (p === pl.from || p.gone) continue;
            const dx = pl.x - p.x, dy = pl.y - p.y;
            if (dx * dx + dy * dy < (p.r + PR - 2) * (p.r + PR - 2)) { land(p, Math.atan2(dy, dx)); break outer; }
          }
        }
        if (pl.state === 'fly') {
          S.trail.push({ x: pl.x, y: pl.y });
          if (S.trail.length > 14) S.trail.shift();
          const out = pl.x < -vw / 2 - 40 || pl.x > vw / 2 + 40 || pl.y > S.camY + vh + 40 || pl.y < S.camY - 90 || pl.flyT > 2.4;
          if (out) die('over');
        }
      }
      if (pl.state !== 'dead') {
        for (const s of S.stars) {
          if (s.got) continue;
          const dx = pl.x - s.x, dy = pl.y - s.y;
          if (dx * dx + dy * dy < 24 * 24) {
            s.got = true; S.runStars++;
            burst(s.x, s.y, '#ffe27a', 10, 120, 0.45);
            popup('★', s.x, s.y - 14, '#ffe27a', 18);
            Sound.star();
          }
        }
      }
      S.camY = lerp(S.camY, camTarget(), 1 - Math.exp(-dt * 4));
      spawnAhead();
    } else if (S.mode === 'over') {
      S.overT += dt;
    } else if (S.mode === 'menu') {
      S.camY -= dt * 12; // gentle drift for the star field
    }

    for (const q of S.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.97; q.vy *= 0.97; q.life -= dt; }
    S.particles = S.particles.filter((q) => q.life > 0);
    for (const q of S.popups) { q.y -= 40 * dt; q.life -= dt * 0.9; }
    S.popups = S.popups.filter((q) => q.life > 0);
  }

  // ---------------------------------------------------------------- drawing
  function font(size, weight) { return `${weight || 700} ${size}px ${FONT}`; }
  function fitText(str, maxW, size, weight) {
    let s = size;
    ctx.font = font(s, weight);
    while (s > 9 && ctx.measureText(str).width > maxW) { s -= 1; ctx.font = font(s, weight); }
    return s;
  }
  function text(str, x, y, size, color, weight, maxW, align) {
    ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    if (maxW) fitText(str, maxW, size, weight); else ctx.font = font(size, weight);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function button(x, y, w, h, label, onTap, opts) {
    const o = opts || {};
    const enabled = o.enabled !== false;
    ctx.save();
    roundRect(x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = enabled ? (o.color || '#ffcf4a') : 'rgba(255,255,255,0.12)';
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.restore();
    text(label, x, y + 1, o.size || 22, enabled ? (o.textColor || '#2a1d4a') : 'rgba(255,255,255,0.55)', 800, w - 24);
    if (enabled) S.hits.push({ x: x - w / 2, y: y - h / 2, w, h, fn: onTap });
  }

  function shade([r, g, b], k) {
    if (k >= 0) return `rgb(${Math.round(r + (255 - r) * k)},${Math.round(g + (255 - g) * k)},${Math.round(b + (255 - b) * k)})`;
    return `rgb(${Math.round(r * (1 + k))},${Math.round(g * (1 + k))},${Math.round(b * (1 + k))})`;
  }

  function drawPlanet(p, x, y) {
    const r = p.r;
    if (p.ring) {
      ctx.save(); ctx.strokeStyle = shade(p.hue, 0.45); ctx.globalAlpha = 0.55; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.65, r * 0.42, -0.35, Math.PI, TAU); ctx.stroke(); ctx.restore();
    }
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, shade(p.hue, 0.4)); g.addColorStop(0.55, shade(p.hue, 0)); g.addColorStop(1, shade(p.hue, -0.45));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (const c of p.craters) {
      const a = c.a + p.rot;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * c.d * r, y + Math.sin(a) * c.d * r, c.s * r, 0, TAU); ctx.fill();
    }
    ctx.restore();
    if (p.ring) {
      ctx.save(); ctx.strokeStyle = shade(p.hue, 0.45); ctx.globalAlpha = 0.8; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(x, y, r * 1.65, r * 0.42, -0.35, 0, Math.PI); ctx.stroke(); ctx.restore();
    }
  }

  function drawCreature(x, y, ang, skin, squash, blink, dead) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + Math.PI / 2); // local "up" (-y) points along ang
    const sx = 1 + 0.25 * squash, sy = 1 - 0.25 * squash;
    ctx.scale(sx, sy);
    // antenna
    ctx.strokeStyle = skin.body; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -PR + 1); ctx.quadraticCurveTo(3, -PR - 4, 1, -PR - 7); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(1, -PR - 7.5, 2.4, 0, TAU); ctx.fill();
    // body + belly
    ctx.fillStyle = skin.body; ctx.beginPath(); ctx.arc(0, 0, PR, 0, TAU); ctx.fill();
    ctx.fillStyle = skin.belly; ctx.beginPath(); ctx.ellipse(0, PR * 0.35, PR * 0.62, PR * 0.48, 0, 0, TAU); ctx.fill();
    // eyes
    if (dead) {
      ctx.strokeStyle = '#2a1d4a'; ctx.lineWidth = 1.6;
      for (const ex of [-4, 4]) { ctx.beginPath(); ctx.moveTo(ex - 2, -5); ctx.lineTo(ex + 2, -1); ctx.moveTo(ex + 2, -5); ctx.lineTo(ex - 2, -1); ctx.stroke(); }
    } else if (blink < 0) {
      ctx.strokeStyle = '#2a1d4a'; ctx.lineWidth = 1.6;
      for (const ex of [-4, 4]) { ctx.beginPath(); ctx.moveTo(ex - 2.5, -3); ctx.lineTo(ex + 2.5, -3); ctx.stroke(); }
    } else {
      for (const ex of [-4, 4]) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, -3, 3.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2a1d4a'; ctx.beginPath(); ctx.arc(ex, -4, 1.7, 0, TAU); ctx.fill();
      }
    }
    // cheeks
    ctx.fillStyle = 'rgba(255,120,140,0.45)';
    ctx.beginPath(); ctx.arc(-7, 1, 1.8, 0, TAU); ctx.arc(7, 1, 1.8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawStarShape(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawBackground() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#0a0f2c'); g.addColorStop(1, '#22164a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    // nebulae
    const ny = ((-S.camY * 0.03) % (vh * 2) + vh * 2) % (vh * 2) - vh * 0.5;
    for (const [nx, nyo, col] of [[0.2, 0, 'rgba(120,80,220,0.16)'], [0.85, vh * 0.7, 'rgba(60,140,230,0.12)']]) {
      const yy = ((ny + nyo) % (vh * 2)) - vh * 0.3;
      const rg = ctx.createRadialGradient(vw * nx, yy, 0, vw * nx, yy, 260);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(vw * nx - 260, yy - 260, 520, 520);
    }
    const f = [0.04, 0.1, 0.22];
    for (const st of BG_STARS) {
      const y = (((st.y * vh - S.camY * f[st.l]) % vh) + vh) % vh;
      const a = 0.35 + 0.35 * Math.sin(S.t * 2 + st.tw) + st.l * 0.12;
      ctx.fillStyle = `rgba(255,255,255,${clamp(a, 0.1, 1)})`;
      ctx.fillRect(st.x * vw, y, st.s * (1 + st.l * 0.3), st.s * (1 + st.l * 0.3));
    }
  }

  function drawWorld() {
    const sh = S.shake * S.shake * 8;
    const ox = sh ? rand(-sh, sh) : 0, oy = sh ? rand(-sh, sh) : 0;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (cw / 2 + ox * scale), dpr * scale * (-S.camY + oy));
    const pl = S.player;

    // collectible stars
    for (const s of S.stars) {
      if (s.got) continue;
      const bob = Math.sin(S.t * 3 + s.ph) * 3;
      ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffe27a';
      drawStarShape(s.x, s.y + bob, 9, S.t * 0.8 + s.ph); ctx.fill(); ctx.restore();
    }

    // tutorial aim line
    if (S.mode === 'play' && S.tut && pl.state === 'sit') {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([6, 8]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pl.x, pl.y); ctx.lineTo(pl.x + Math.cos(pl.ang) * 240, pl.y + Math.sin(pl.ang) * 240); ctx.stroke(); ctx.restore();
    }

    for (const p of S.planets) {
      if (p.gone) continue;
      let x = p.x, y = p.y;
      const onIt = pl && pl.state === 'sit' && pl.planet === p && S.mode === 'play';
      if (onIt) {
        const frac = clamp(1 - pl.hold / p.hold, 0, 1);
        if (frac < 0.3) { x += rand(-1.6, 1.6); y += rand(-1.6, 1.6); }
        ctx.save();
        ctx.strokeStyle = frac > 0.35 ? 'rgba(255,255,255,0.5)' : '#ff5d6c';
        ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8, -Math.PI / 2, -Math.PI / 2 + frac * TAU); ctx.stroke();
        ctx.restore();
      }
      drawPlanet(p, x, y);
    }

    // trail
    for (let i = 0; i < S.trail.length; i++) {
      const q = S.trail[i];
      ctx.fillStyle = `rgba(255,255,255,${(i / S.trail.length) * 0.35})`;
      ctx.beginPath(); ctx.arc(q.x, q.y, PR * (0.3 + 0.6 * (i / S.trail.length)), 0, TAU); ctx.fill();
    }

    if (pl && pl.state !== 'dead') {
      const ang = pl.state === 'fly' ? Math.atan2(pl.vy, pl.vx) : pl.ang;
      drawCreature(pl.x, pl.y, ang, skinById(save.skin), pl.squash, pl.blink, false);
    }

    for (const q of S.particles) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.color; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size);
    }
    ctx.globalAlpha = 1;
    for (const q of S.popups) {
      ctx.globalAlpha = clamp(q.life, 0, 1);
      text(q.text, q.x, q.y, q.size, q.color, 800);
    }
    ctx.globalAlpha = 1;
  }

  function uiTransform() { ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0); }

  function drawHUD() {
    uiTransform();
    const cx = vw > 700 ? vw / 2 - 260 : vw / 2; // wide screens: score sits beside the play column
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8;
    text(String(S.score), cx, 64, 52, '#ffffff', 900);
    ctx.restore();
    ctx.fillStyle = '#ffe27a'; drawStarShape(cx - 16, 104, 8, 0); ctx.fill();
    text(String(S.runStars), cx - 4, 105, 18, '#ffe27a', 800, 0, 'left');
    if (S.tut && S.mode === 'play') {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(S.t * 4);
      text(T.tap, vw / 2, vh - 70, 18, '#ffffff', 700, Math.min(vw - 40, 400));
      ctx.globalAlpha = 0.75;
      text(T.hint, vw / 2, vh - 44, 15, '#cdd3ff', 600, Math.min(vw - 40, 400));
      ctx.globalAlpha = 1;
    }
  }

  function cycleSkin(dir) {
    S.view = (S.view + dir + SKINS.length) % SKINS.length;
    const sk = SKINS[S.view];
    if (save.owned.includes(sk.id) && save.skin !== sk.id) { save.skin = sk.id; persist(); }
    Sound.click();
  }
  function unlockViewed() {
    const sk = SKINS[S.view];
    if (save.owned.includes(sk.id) || save.stars < sk.cost) return;
    save.stars -= sk.cost; save.owned.push(sk.id); save.skin = sk.id;
    persist();
    Sound.buy();
    popupMenu = 1;
  }
  let popupMenu = 0;

  function drawMenu(dt) {
    uiTransform();
    const cx = vw / 2;
    // title
    ctx.save(); ctx.shadowColor = 'rgba(140,110,255,0.9)'; ctx.shadowBlur = 24;
    text('ORBIT HOP', cx, vh * 0.17, 56, '#ffffff', 900, vw - 40);
    ctx.restore();
    text(`${T.best} ${save.best}`, cx - 8, vh * 0.17 + 48, 18, '#cdd3ff', 700, 0, 'right');
    ctx.fillStyle = '#ffe27a'; drawStarShape(cx + 12, vh * 0.17 + 47, 8, 0); ctx.fill();
    text(String(save.stars), cx + 24, vh * 0.17 + 48, 18, '#ffe27a', 800, 0, 'left');

    // preview
    const py = vh * 0.47, sk = SKINS[S.view], owned = save.owned.includes(sk.id);
    const demo = { r: 54, hue: HUES[S.view % HUES.length], rot: S.menuT * 0.6, ring: S.view % 2 === 1, craters: MENU_CRATERS };
    drawPlanet(demo, cx, py + 30);
    const bob = Math.abs(Math.sin(S.menuT * 3)) * 10;
    ctx.globalAlpha = owned ? 1 : 0.55;
    drawCreature(cx, py + 30 - demo.r - PR + 2 - bob, -Math.PI / 2, sk, bob < 1 ? 0.6 : -0.15, Math.sin(S.menuT * 1.3) > 0.97 ? -1 : 1, false);
    ctx.globalAlpha = 1;
    if (popupMenu > 0) {
      popupMenu -= dt;
      ctx.globalAlpha = clamp(popupMenu, 0, 1);
      text('✓', cx, py - 70 - (1 - popupMenu) * 20, 30, '#7dffb0', 900);
      ctx.globalAlpha = 1;
    }
    button(cx - 130, py + 30, 50, 50, '‹', () => cycleSkin(-1), { color: 'rgba(255,255,255,0.18)', textColor: '#fff', size: 34 });
    button(cx + 130, py + 30, 50, 50, '›', () => cycleSkin(1), { color: 'rgba(255,255,255,0.18)', textColor: '#fff', size: 34 });
    text(sk.name + (owned && save.skin === sk.id ? '  ✓' : ''), cx, py + 112, 20, '#ffffff', 800);

    if (!owned) {
      const can = save.stars >= sk.cost;
      button(cx, py + 152, 200, 44, `${can ? T.unlock : T.need} ★ ${sk.cost}`, unlockViewed, { enabled: can, color: '#7dd3ff', size: 18 });
    }

    const pulse = 1 + Math.sin(S.menuT * 4) * 0.03;
    button(cx, vh * 0.82, 210 * pulse, 66 * pulse, T.play, startGame, { size: 28 });
  }
  const MENU_CRATERS = [{ a: 0.4, d: 0.5, s: 0.2 }, { a: 2.2, d: 0.35, s: 0.15 }, { a: 4.1, d: 0.6, s: 0.18 }, { a: 5.3, d: 0.2, s: 0.12 }];

  function drawOver() {
    uiTransform();
    const cx = vw / 2;
    const a = clamp(S.overT * 3, 0, 1);
    ctx.fillStyle = `rgba(8,6,24,${0.72 * a})`; ctx.fillRect(0, 0, vw, vh);
    ctx.globalAlpha = a;
    text(S.reason === 'crumble' ? T.crumble : T.over, cx, vh * 0.25, 28, '#ffffff', 800, vw - 40);
    ctx.save(); ctx.shadowColor = 'rgba(140,110,255,0.9)'; ctx.shadowBlur = 20;
    text(String(S.score), cx, vh * 0.38, 92, '#ffffff', 900);
    ctx.restore();
    if (S.newBest) {
      const s = 1 + Math.sin(S.overT * 6) * 0.06;
      ctx.save(); ctx.translate(cx, vh * 0.48); ctx.scale(s, s);
      text(T.newBest, 0, 0, 24, '#ffe27a', 900, vw - 40); ctx.restore();
    } else {
      text(`${T.best} ${save.best}`, cx, vh * 0.48, 20, '#cdd3ff', 700);
    }
    ctx.fillStyle = '#ffe27a'; drawStarShape(cx - 22, vh * 0.555, 10, 0); ctx.fill();
    text(`+${S.runStars}`, cx - 6, vh * 0.557, 22, '#ffe27a', 800, 0, 'left');
    if (S.overT > 0.6) {
      ctx.globalAlpha = a * (0.65 + 0.35 * Math.sin(S.overT * 4));
      text(T.retry, cx, vh * 0.67, 20, '#ffffff', 700, vw - 40);
      ctx.globalAlpha = a;
      button(cx, vh * 0.8, 160, 50, T.menu, toMenu, { color: 'rgba(255,255,255,0.18)', textColor: '#fff', size: 20 });
    }
    ctx.globalAlpha = 1;
  }

  function drawLoading() {
    drawBackground();
    uiTransform();
    const cx = vw / 2;
    drawPlanet({ r: 40, hue: HUES[0], rot: 0, ring: true, craters: MENU_CRATERS }, cx, vh * 0.45);
    text('ORBIT HOP', cx, vh * 0.25, 44, '#ffffff', 900, vw - 40);
    text(T.loading, cx, vh * 0.62, 18, '#cdd3ff', 600);
  }

  let lastDt = 0;
  function render() {
    S.hits = [];
    if (S.mode === 'loading') { drawLoading(); return; }
    drawBackground();
    if (S.mode === 'play' || S.mode === 'over') { drawWorld(); drawHUD(); }
    if (S.mode === 'over') drawOver();
    if (S.mode === 'menu') drawMenu(lastDt);
  }

  // ---------------------------------------------------------------- flow
  function startGame() { Sound.click(); newRun(); }
  function toMenu() { Sound.click(); S.mode = 'menu'; S.player = null; S.view = SKINS.findIndex((s) => s.id === save.skin); }
  function primaryAction() {
    if (S.mode === 'play') jump();
    else if (S.mode === 'over' && S.overT > 0.6) newRun();
    else if (S.mode === 'menu') startGame();
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (paused || S.mode === 'loading') return;
    Sound.unlock();
    const x = e.clientX / scale, y = e.clientY / scale;
    for (let i = S.hits.length - 1; i >= 0; i--) {
      const h = S.hits[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) { h.fn(); return; }
    }
    if (S.mode === 'play' || S.mode === 'over') primaryAction();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    if (paused || S.mode === 'loading' || e.key === 'Escape') return; // never preventDefault on Esc
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault(); Sound.unlock();
      if (!e.repeat) primaryAction();
    } else if (S.mode === 'menu' && (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A')) { Sound.unlock(); cycleSkin(-1); }
    else if (S.mode === 'menu' && (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')) { Sound.unlock(); cycleSkin(1); }
    else if (S.mode === 'menu' && e.key === 'u') { unlockViewed(); }
  });
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- loop + pause
  let paused = false, rafId = 0, last = 0;
  function loop(now) {
    if (paused) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now; lastDt = dt;
    update(dt);
    render();
    rafId = window.requestAnimationFrame(loop);
  }
  function pause() {
    if (paused) return;
    paused = true;
    window.cancelAnimationFrame(rafId);
    Sound.apply();
    persist(); // best effort save on pause
  }
  function resume() {
    if (!paused) return;
    paused = false;
    Sound.apply();
    if (S.mode !== 'loading') { last = performance.now(); rafId = window.requestAnimationFrame(loop); }
  }

  async function boot() {
    resize();
    render(); // loading screen
    Platform.firstFrameReady();
    Platform.onPause(pause);
    Platform.onResume(resume);
    Sound.enabled = Platform.audioEnabled();
    Platform.onAudioChange((on) => { Sound.enabled = !!on; Sound.apply(); });

    const [loadRes, lang] = await Promise.all([
      Platform.load().then((r) => ({ ok: true, r }), () => ({ ok: false })),
      Platform.lang(),
    ]);
    if (loadRes.ok) { save = parseSave(loadRes.r); saveLoaded = true; } else { Platform.logError(); }
    setLang(lang);

    S.view = Math.max(0, SKINS.findIndex((s) => s.id === save.skin));
    S.mode = 'menu';
    render();
    Platform.gameReady();
    if (!paused) { last = performance.now(); rafId = window.requestAnimationFrame(loop); }
  }

  if (!IN_ENV) { // local testing hooks; never active inside YouTube
    window.__orbit = { pause, resume, setAudio: (on) => { Sound.enabled = on; Sound.apply(); }, state: S, get save() { return save; } };
  }
  boot();
})();
