/*
 * ZERO GRAVITY BEYBLADE GAME
 * Complete Replacement game.js
 * Version: 202607121134
 */

(() => {
  'use strict';

  const VERSION = '202607121134';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const now = () => performance.now();

  const STORAGE = {
    selectedTop: 'zg_selected_top_v2',
    myScore: 'zg_my_score_v2',
    friends: 'zg_friend_leaderboard_v2'
  };

  const PHY = {
    radius: 34,
    ringPadding: 46,
    initialSpeed: 7.5,
    maxSpeed: 12,
    friction: 0.993,
    spinDecay: 0.9986,
    wallRestitution: 0.84,
    hitRestitution: 0.98,
    hitDamageBase: 2.8,
    seekForceMax: 0.047,
    tangentForce: 0.036,
    battleLimit: 65000
  };

  const TOPS = [
    {
      id: 'phoenix',
      name: '烈焰鳳凰',
      type: 'attack',
      power: 94,
      defense: 58,
      stamina: 62,
      speed: 96,
      colorA: '#ff321f',
      colorB: '#ffd166',
      emoji: '🔥'
    },
    {
      id: 'aegis',
      name: '鋼鐵神盾',
      type: 'defense',
      power: 64,
      defense: 98,
      stamina: 78,
      speed: 52,
      colorA: '#7de3ff',
      colorB: '#2b6cff',
      emoji: '🛡️'
    },
    {
      id: 'orion',
      name: '星環獵戶',
      type: 'balance',
      power: 78,
      defense: 76,
      stamina: 76,
      speed: 76,
      colorA: '#9b5cff',
      colorB: '#57f2ff',
      emoji: '✨'
    },
    {
      id: 'gaia',
      name: '大地永恆',
      type: 'stamina',
      power: 62,
      defense: 72,
      stamina: 98,
      speed: 58,
      colorA: '#69ff8f',
      colorB: '#ffd86b',
      emoji: '🌿'
    }
  ];

  const FEEL = {
    attack: {
      label: '攻擊型',
      launchKick: 1.2,
      sparkMul: 1.6,
      hitSharpness: 1.35,
      stability: 0.78,
      friction: 1.08,
      humBase: 155,
      humGain: 1.35
    },
    defense: {
      label: '防禦型',
      launchKick: 0.88,
      sparkMul: 0.85,
      hitSharpness: 0.72,
      stability: 1.45,
      friction: 0.84,
      humBase: 92,
      humGain: 0.85
    },
    balance: {
      label: '平衡型',
      launchKick: 1,
      sparkMul: 1,
      hitSharpness: 1,
      stability: 1,
      friction: 1,
      humBase: 122,
      humGain: 1
    },
    stamina: {
      label: '耐久型',
      launchKick: 0.92,
      sparkMul: 0.75,
      hitSharpness: 0.9,
      stability: 1.22,
      friction: 0.68,
      humBase: 118,
      humGain: 0.72
    }
  };

  const state = {
    screen: 'home',
    tops: TOPS,
    selectedTop: null,
    enemyTop: null,
    battle: null,
    raf: null,
    running: false,
    paused: false,
    lastTime: 0,
    firstCollision: false,
    killcam: false
  };

  function topFeel(top) {
    return FEEL[top?.type] || FEEL.balance;
  }

  function safeParse(v, f) {
    try {
      return JSON.parse(v);
    } catch (e) {
      return f;
    }
  }

  function getMyScore() {
    return Number(localStorage.getItem(STORAGE.myScore) || 1200);
  }

  function setMyScore(v) {
    localStorage.setItem(STORAGE.myScore, String(Math.max(0, Math.round(v))));
  }

  function saveTop(top) {
    if (!top) return;
    localStorage.setItem(STORAGE.selectedTop, JSON.stringify(top));
  }

  function loadTop() {
    const saved = safeParse(localStorage.getItem(STORAGE.selectedTop), null);
    if (saved && saved.id) return saved;
    return TOPS[0];
  }

  /*
   * =========================================================
   * Sound Engine
   * =========================================================
   */

  const Sound = (() => {
    let ctx = null;
    let master = null;
    let humA = null;
    let humB = null;

    function ensure() {
      if (ctx) return ctx;

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;

      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.36;
      master.connect(ctx.destination);
      return ctx;
    }

    function resume() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    }

    function tone(freq, dur, gain, type = 'sine', endFreq = null) {
      const c = ensure();
      if (!c || !master) return;

      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t);

      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur);
      }

      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }

    function noise(dur = 0.08, gain = 0.2, filterFreq = 2400) {
      const c = ensure();
      if (!c || !master) return;

      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }

      const src = c.createBufferSource();
      const filter = c.createBiquadFilter();
      const g = c.createGain();

      src.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 8;

      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);

      src.connect(filter);
      filter.connect(g);
      g.connect(master);
      src.start();
    }

    function launch() {
      resume();
      tone(82, 0.28, 0.48, 'sine', 42);
      tone(190, 0.12, 0.22, 'triangle', 110);
      noise(0.11, 0.18, 1600);
    }

    function metal(power = 1, sharp = 1) {
      resume();
      const p = clamp(power, 0.25, 2.2);
      tone(820 * sharp, 0.08, 0.18 * p, 'square', 260 * sharp);
      tone(2600 * sharp, 0.045, 0.08 * p, 'sawtooth', 900);
      noise(0.07, 0.28 * p, 3600 * sharp);
    }

    function rail(power = 1) {
      resume();
      const p = clamp(power, 0.25, 2);
      tone(420, 0.12, 0.18 * p, 'triangle', 180);
      noise(0.08, 0.23 * p, 2100);
    }

    function grind(power = 1) {
      resume();
      noise(0.16, 0.14 * power, 1200);
      tone(110, 0.16, 0.08 * power, 'sawtooth', 80);
    }

    function death() {
      resume();
      tone(180, 0.75, 0.24, 'sawtooth', 38);
      noise(0.42, 0.12, 700);
    }

    function makeHum(base) {
      const c = ensure();
      if (!c || !master) return null;

      const osc = c.createOscillator();
      const filter = c.createBiquadFilter();
      const g = c.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = base;

      filter.type = 'lowpass';
      filter.frequency.value = 520;

      g.gain.value = 0.001;

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);
      osc.start();

      return { osc, filter, gain: g };
    }

    function startHum(index, base) {
      resume();
      const h = makeHum(base);
      if (index === 0) humA = h;
      else humB = h;
    }

    function updateHum(index, spin, base, gainMul) {
      const c = ensure();
      if (!c) return;

      const h = index === 0 ? humA : humB;
      if (!h) return;

      const r = clamp(spin, 0, 1);
      const t = c.currentTime;

      h.osc.frequency.setTargetAtTime(base + r * 180, t, 0.05);
      h.filter.frequency.setTargetAtTime(360 + r * 900, t, 0.06);
      h.gain.gain.setTargetAtTime((0.012 + r * 0.043) * gainMul, t, 0.08);
    }

    function stopHum() {
      const c = ensure();
      if (!c) return;

      [humA, humB].forEach(h => {
        if (!h) return;
        h.gain.gain.setTargetAtTime(0.001, c.currentTime, 0.12);
        setTimeout(() => {
          try {
            h.osc.stop();
          } catch (e) {}
        }, 500);
      });

      humA = null;
      humB = null;
    }

    return {
      resume,
      launch,
      metal,
      rail,
      grind,
      death,
      startHum,
      updateHum,
      stopHum
    };
  })();

  /*
   * =========================================================
   * DOM / Screen
   * =========================================================
   */

  function findScreen(name) {
    return (
      $(`#screen-${name}`) ||
      $(`#zg-screen-${name}`) ||
      $(`.screen-${name}`) ||
      $(`.zg-screen-${name}`) ||
      $(`[data-screen="${name}"]`)
    );
  }

  function allScreens() {
    const arr = [
      findScreen('home'),
      findScreen('select'),
      findScreen('battle'),
      findScreen('result'),
      findScreen('leaderboard')
    ].filter(Boolean);

    const extra = $$('[id^="screen-"], [id^="zg-screen-"], .zg-screen, .screen');
    extra.forEach(x => {
      if (!arr.includes(x)) arr.push(x);
    });

    return arr;
  }

  function showScreen(name) {
    state.screen = name;

    const targets = {
      home: findScreen('home'),
      select: findScreen('select'),
      battle: findScreen('battle'),
      result: findScreen('result'),
      leaderboard: findScreen('leaderboard')
    };

    allScreens().forEach(el => {
      const isTarget = el === targets[name];

      el.classList.toggle('active', isTarget);
      el.classList.toggle('is-active', isTarget);
      el.hidden = !isTarget;

      if (isTarget) {
        el.style.display = '';
        el.removeAttribute('aria-hidden');
      } else {
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
      }
    });

    document.body.setAttribute('data-zg-screen', name);

    if (name === 'select') {
      renderTopSelection();
    }

    if (name === 'leaderboard') {
      renderFriendLeaderboard();
    }
  }

  function battleBox() {
    return (
      $('#zg-battle-box') ||
      $('#battle-box') ||
      $('.zg-battle-box') ||
      $('.battle-box') ||
      findScreen('battle') ||
      document.body
    );
  }

  function arenaInfo() {
    const box = battleBox();
    const rect = box.getBoundingClientRect();

    const w = rect.width || 620;
    const h = rect.height || 420;

    return {
      w,
      h,
      cx: w / 2,
      cy: h / 2,
      rx: Math.max(90, w / 2 - PHY.ringPadding),
      ry: Math.max(90, h / 2 - PHY.ringPadding)
    };
  }

  function restartClass(el, cls, dur = 500) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), dur);
  }

  function camera(cls, dur) {
    restartClass(battleBox(), cls, dur);
  }

  /*
   * =========================================================
   * Auto HTML Fallback
   * =========================================================
   */

  function ensureHtml() {
    if (findScreen('home') && findScreen('select') && findScreen('battle') && findScreen('result')) {
      ensureBattleInner();
      return;
    }

    const root = $('#zg-app') || $('#app') || document.body;

    const app = document.createElement('div');
    app.id = 'zg-auto-app';
    app.innerHTML = `
      <section id="screen-home" class="zg-screen active">
        <div class="zg-panel">
          <h1>ZERO GRAVITY 陀螺競技場</h1>
          <p>發射、碰撞、逆轉，成為最後仍在旋轉的陀螺。</p>
          <button type="button" data-zg-action="start">開始遊戲</button>
        </div>
      </section>

      <section id="screen-select" class="zg-screen" hidden>
        <div class="zg-panel">
          <h2>選擇你的陀螺</h2>
          <div id="zg-top-list" class="zg-top-list"></div>
          <div id="zg-selected-top" class="zg-selected-top"></div>
          <button type="button" data-zg-action="battle">發射！開始對戰</button>
          <button type="button" data-zg-action="home">返回首頁</button>
        </div>
      </section>

      <section id="screen-battle" class="zg-screen" hidden>
        <div class="zg-battle-hud">
          <div class="zg-hud-side">
            <strong id="zg-player-name">Player</strong>
            <div class="zg-hp-wrap"><div id="zg-player-hp" class="zg-hp-bar"></div></div>
            <span id="zg-player-hp-text">100%</span>
          </div>
          <div class="zg-hud-side">
            <strong id="zg-enemy-name">Enemy</strong>
            <div class="zg-hp-wrap"><div id="zg-enemy-hp" class="zg-hp-bar"></div></div>
            <span id="zg-enemy-hp-text">100%</span>
          </div>
        </div>
        <div id="zg-battle-box" class="zg-battle-box">
          <div id="zg-arena-ring" class="zg-arena-ring"></div>
        </div>
      </section>

      <section id="screen-result" class="zg-screen" hidden>
        <div class="zg-panel">
          <h2 id="zg-result-title">結果</h2>
          <p id="zg-result-subtitle"></p>
          <div id="zg-result-score" class="zg-result-score"></div>
          <div id="zg-result-actions" class="zg-result-actions">
            <button type="button" data-zg-action="retry">再戰一次</button>
            <button type="button" data-zg-action="select">更換陀螺</button>
            <button type="button" data-zg-action="leaderboard">好友排行榜</button>
          </div>
          <div id="friend-leaderboard" class="zg-friend-leaderboard"></div>
        </div>
      </section>

      <section id="screen-leaderboard" class="zg-screen" hidden>
        <div class="zg-panel">
          <h2>好友排行榜</h2>
          <div id="zg-friend-leaderboard" class="zg-friend-leaderboard"></div>
          <button type="button" data-zg-action="home">返回首頁</button>
        </div>
      </section>
    `;

    root.appendChild(app);
  }

  function ensureBattleInner() {
    const battle = findScreen('battle');
    if (!battle) return;

    let box = battleBox();

    if (!box || box === battle || box === document.body) {
      box = $('#zg-battle-box', battle) || $('#battle-box', battle) || $('.battle-box', battle);

      if (!box) {
        box = document.createElement('div');
        box.id = 'zg-battle-box';
        box.className = 'zg-battle-box';
        battle.appendChild(box);
      }
    }

    if (!$('#zg-arena-ring', box) && !$('.zg-arena-ring', box)) {
      const ring = document.createElement('div');
      ring.id = 'zg-arena-ring';
      ring.className = 'zg-arena-ring';
      box.appendChild(ring);
    }
  }

  /*
   * =========================================================
   * Visual Effects
   * =========================================================
   */

  function injectVisualEnhancements() {
    if (!$('.zg-energy-grid')) {
      const grid = document.createElement('div');
      grid.className = 'zg-energy-grid';
      grid.setAttribute('aria-hidden', 'true');
      document.body.prepend(grid);
    }

    const home = findScreen('home');
    if (home && !$('.zg-stardust-layer', home)) {
      const layer = document.createElement('div');
      layer.className = 'zg-stardust-layer';
      layer.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < 46; i++) {
        const s = document.createElement('i');
        s.style.left = `${Math.random() * 100}%`;
        s.style.top = `${Math.random() * 100}%`;
        s.style.animationDelay = `${Math.random() * 4}s`;
        s.style.animationDuration = `${3 + Math.random() * 4}s`;
        layer.appendChild(s);
      }

      home.prepend(layer);
    }

    ensureDanger();
    ensureFlash();

    $$('.result-actions, .end-actions, #result-actions, #zg-result-actions').forEach(el => {
      el.classList.add('zg-result-actions');
    });

    const flashes = $$('.zg-flash-overlay');
    if (flashes.length > 1) flashes.slice(1).forEach(x => x.remove());
  }

  function ensureDanger() {
    const box = battleBox();
    let v = $('.zg-danger-vignette', box);

    if (!v) {
      v = document.createElement('div');
      v.className = 'zg-danger-vignette';
      box.appendChild(v);
    }

    return v;
  }

  function ensureFlash() {
    const box = battleBox();
    let f = $('.zg-flash-overlay', box);

    if (!f) {
      f = document.createElement('div');
      f.className = 'zg-flash-overlay';
      box.appendChild(f);
    }

    return f;
  }

  function flash(power = 1) {
    const f = ensureFlash();
    f.style.opacity = String(clamp(0.25 * power, 0.15, 0.8));
    restartClass(f, 'active', 180);
    setTimeout(() => {
      f.style.opacity = '';
    }, 200);
  }

  function shockwave(x, y) {
    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-launch-shockwave';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    box.appendChild(el);
    setTimeout(() => el.remove(), 760);
  }

  function afterimage(x, y, size = 88) {
    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-spin-afterimage';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    box.appendChild(el);
    setTimeout(() => el.remove(), 680);
  }

  function sparks(x, y, count = 16, intensity = 1) {
    const box = battleBox();
    const n = Math.round(count * clamp(intensity, 0.3, 2.4));

    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = `zg-metal-spark ${intensity > 1.2 ? 'intense' : ''}`;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--r', `${Math.random() * 360}deg`);
      s.style.setProperty('--d', `${36 + Math.random() * 82 * intensity}px`);
      box.appendChild(s);
      setTimeout(() => s.remove(), 460);
    }
  }

  function scratch(x, y, vx, vy, wobble = false) {
    const box = battleBox();
    const s = document.createElement('i');

    s.className = `zg-scratch ${wobble ? 'wobble' : ''}`;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;

    if (!wobble) {
      const a = Math.atan2(vy, vx) * 180 / Math.PI;
      s.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;
    } else {
      s.style.transform = 'translate(-50%, -50%)';
    }

    box.appendChild(s);
    setTimeout(() => s.remove(), wobble ? 1250 : 950);
  }

  /*
   * =========================================================
   * Selection
   * =========================================================
   */

  function topListBox() {
    return (
      $('#zg-top-list') ||
      $('#top-list') ||
      $('.zg-top-list') ||
      $('.top-list') ||
      $('[data-zg-top-list]')
    );
  }

  function renderTopSelection() {
    const list = topListBox();
    if (!list) return;

    list.innerHTML = state.tops.map(top => {
      const f = topFeel(top);

      return `
        <button type="button" class="zg-top-card top-card" data-top-id="${top.id}">
          <div class="zg-top-visual" style="--c1:${top.colorA};--c2:${top.colorB};">
            <span>${top.emoji}</span>
          </div>
          <div class="zg-top-info">
            <strong>${top.name}</strong>
            <em>${f.label}</em>
            <div class="zg-stat-row"><span>攻擊</span><b>${top.power}</b></div>
            <div class="zg-stat-row"><span>防禦</span><b>${top.defense}</b></div>
            <div class="zg-stat-row"><span>耐久</span><b>${top.stamina}</b></div>
            <div class="zg-stat-row"><span>速度</span><b>${top.speed}</b></div>
          </div>
        </button>
      `;
    }).join('');

    const selected = state.selectedTop || loadTop();
    const card = $(`[data-top-id="${selected.id}"]`, list);

    if (card) {
      selectTop(selected.id);
    } else {
      selectTop(TOPS[0].id);
    }
  }

  function selectTop(id) {
    const top = state.tops.find(t => t.id === id) || state.tops[0];

    state.selectedTop = top;
    saveTop(top);

    $$('[data-top-id]').forEach(c => {
      c.classList.toggle('selected', c.getAttribute('data-top-id') === top.id);
      c.classList.toggle('is-selected', c.getAttribute('data-top-id') === top.id);
    });

    const panel =
      $('#zg-selected-top') ||
      $('#selected-top') ||
      $('.zg-selected-top') ||
      $('.selected-top');

    if (panel) {
      const f = topFeel(top);
      panel.innerHTML = `
        <div class="zg-selected-card">
          <div class="zg-selected-icon" style="--c1:${top.colorA};--c2:${top.colorB};">
            ${top.emoji}
          </div>
          <div>
            <h3>${top.name}</h3>
            <p>${f.label} · 攻擊 ${top.power} · 防禦 ${top.defense} · 耐久 ${top.stamina}</p>
          </div>
        </div>
      `;
    }
  }

  function pickEnemy() {
    const pool = state.tops.filter(t => t.id !== state.selectedTop?.id);
    return pool[Math.floor(Math.random() * pool.length)] || state.tops[1] || state.tops[0];
  }

  /*
   * =========================================================
   * Battle Creation
   * =========================================================
   */

  function clearBattle() {
    const box = battleBox();

    $$('.zg-battle-top', box).forEach(x => x.remove());
    $$('.zg-metal-spark', box).forEach(x => x.remove());
    $$('.zg-scratch', box).forEach(x => x.remove());
    $$('.zg-launch-shockwave', box).forEach(x => x.remove());
    $$('.zg-spin-afterimage', box).forEach(x => x.remove());

    const danger = $('.zg-danger-vignette', box);
    if (danger) danger.classList.remove('active');
  }

  function makeTopEl(top, side) {
    const box = battleBox();

    const el = document.createElement('div');
    el.className = `zg-battle-top zg-top-${side} ${top.type}`;
    el.setAttribute('data-side', side);
    el.setAttribute('data-top-id', top.id);
    el.style.setProperty('--c1', top.colorA);
    el.style.setProperty('--c2', top.colorB);
    el.innerHTML = `
      <div class="zg-battle-top-core">
        <span>${top.emoji}</span>
      </div>
      <i class="zg-top-trail"></i>
    `;

    box.appendChild(el);
    return el;
  }

  function makeBody(top, side, arena) {
    const f = topFeel(top);

    const startX = side === 'player' ? arena.w * 0.27 : arena.w * 0.73;
    const startY = side === 'player' ? arena.h * 0.54 : arena.h * 0.46;
    const launchAngle = side === 'player'
      ? rand(-0.55, 0.45)
      : Math.PI + rand(-0.45, 0.55);

    const baseSpeed = PHY.initialSpeed * f.launchKick * (0.85 + top.speed / 220);
    const maxHp = 100 + top.defense * 0.28 + top.stamina * 0.2;

    return {
      top,
      side,
      el: null,
      x: startX,
      y: startY,
      vx: Math.cos(launchAngle) * baseSpeed,
      vy: Math.sin(launchAngle) * baseSpeed,
      radius: PHY.radius,
      mass: f.stability,
      hp: maxHp,
      maxHp,
      spin: 1,
      spinRatio: 1,
      angle: 0,
      angularSpeed: 26 + top.speed * 0.16,
      damageMul: top.type === 'attack' ? 1.18 : 1,
      damageTakenMul: top.type === 'defense' ? 0.82 : 1,
      spinDecayMul: top.type === 'stamina' ? 0.72 : 1,
      frictionMul: f.friction,
      restitutionMul: top.type === 'defense' ? 0.72 : top.type === 'attack' ? 1.08 : 1,
      comebackUsed: false,
      lastRail: 0,
      dead: false
    };
  }

  function syncEl(body) {
    if (!body || !body.el) return;

    body.angle += body.angularSpeed * body.spinRatio;
    body.el.style.left = `${body.x}px`;
    body.el.style.top = `${body.y}px`;
    body.el.style.transform = `translate(-50%, -50%) rotate(${body.angle}deg)`;
    body.el.style.opacity = body.dead ? '0.35' : '1';
  }

  function updateBattleLabels() {
    const b = state.battle;
    if (!b) return;

    const pn = $('#zg-player-name') || $('#player-name') || $('.zg-player-name') || $('.player-name');
    const en = $('#zg-enemy-name') || $('#enemy-name') || $('.zg-enemy-name') || $('.enemy-name');

    if (pn) pn.textContent = b.player.top.name;
    if (en) en.textContent = b.enemy.top.name;
  }

  function updateHpBars() {
    const b = state.battle;
    if (!b) return;

    const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    const pb =
      $('#zg-player-hp') ||
      $('#player-hp') ||
      $('.zg-player-hp .bar') ||
      $('.player-hp .bar') ||
      $('.player-hp');

    const eb =
      $('#zg-enemy-hp') ||
      $('#enemy-hp') ||
      $('.zg-enemy-hp .bar') ||
      $('.enemy-hp .bar') ||
      $('.enemy-hp');

    if (pb) {
      pb.style.width = `${pr * 100}%`;
      pb.classList.toggle('zg-low-spin-warning', pr < 0.22);
    }

    if (eb) {
      eb.style.width = `${er * 100}%`;
      eb.classList.toggle('zg-low-spin-warning', er < 0.22);
    }

    const pt = $('#zg-player-hp-text') || $('.zg-player-hp-text');
    const et = $('#zg-enemy-hp-text') || $('.zg-enemy-hp-text');

    if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
    if (et) et.textContent = `${Math.ceil(er * 100)}%`;
  }

  /*
   * =========================================================
   * Battle Feel
   * =========================================================
   */

  function launchSequence() {
    const b = state.battle;
    if (!b) return;

    Sound.resume();
    Sound.launch();

    camera('zg-launch-impact', 700);

    shockwave(b.player.x, b.player.y);
    shockwave(b.enemy.x, b.enemy.y);

    afterimage(b.player.x, b.player.y, 96);
    afterimage(b.enemy.x, b.enemy.y, 96);

    Sound.startHum(0, topFeel(b.player.top).humBase);
    Sound.startHum(1, topFeel(b.enemy.top).humBase);
  }

  function updateFeel() {
    const b = state.battle;
    if (!b) return;

    const a = b.player;
    const e = b.enemy;

    const fa = topFeel(a.top);
    const fe = topFeel(e.top);

    Sound.updateHum(0, a.spinRatio, fa.humBase, fa.humGain);
    Sound.updateHum(1, e.spinRatio, fe.humBase, fe.humGain);

    const lowA = a.spinRatio < 0.22;
    const lowE = e.spinRatio < 0.22;

    if (a.el) a.el.classList.toggle('zg-top-wobble', lowA);
    if (e.el) e.el.classList.toggle('zg-top-wobble', lowE);

    const danger = ensureDanger();
    if (danger) danger.classList.toggle('active', lowA || lowE);

    if (Math.random() < 0.2) {
      const sa = Math.hypot(a.vx, a.vy);
      const se = Math.hypot(e.vx, e.vy);

      if (sa > 1.2) scratch(a.x, a.y, a.vx, a.vy, lowA);
      if (se > 1.2) scratch(e.x, e.y, e.vx, e.vy, lowE);
    }

    comeback(a);
    comeback(e);
  }

  function collisionFeel(a, b, x, y) {
    const fa = topFeel(a.top);
    const fb = topFeel(b.top);

    const rvx = a.vx - b.vx;
    const rvy = a.vy - b.vy;
    const rel = Math.hypot(rvx, rvy);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const approach = Math.abs(rvx * nx + rvy * ny);
    const tangent = Math.abs(rvx * -ny + rvy * nx);

    const power = clamp(rel / 8, 0.35, 2.2);
    const sharp = (fa.hitSharpness + fb.hitSharpness) / 2;
    const sparkPower = Math.max(fa.sparkMul, fb.sparkMul) * power;

    if (approach > tangent * 1.15) {
      Sound.metal(power, sharp);
      sparks(x, y, 20, sparkPower);
      camera('zg-collision-zoom', 280);
      flash(power);

      if (!state.firstCollision) {
        state.firstCollision = true;
        camera('zg-killcam', 900);
      }
    } else {
      Sound.metal(power * 0.85, sharp * 1.15);
      sparks(x, y, 12, sparkPower * 0.82);
      camera('punch', 220);

      const sf = 0.7 * power;
      a.vx += -ny * sf;
      a.vy += nx * sf;
      b.vx -= -ny * sf;
      b.vy -= nx * sf;
    }

    if (Math.abs(a.spinRatio - b.spinRatio) > 0.24 && rel > 4) {
      const loser = a.spinRatio > b.spinRatio ? b : a;
      if (loser.el) loser.el.classList.add('zg-ground-grind');
      setTimeout(() => {
        if (loser.el) loser.el.classList.remove('zg-ground-grind');
      }, 260);
      Sound.grind(power);
    }
  }

  function railFeel(body, power = 1) {
    const t = now();
    if (t - body.lastRail < 160) return;

    body.lastRail = t;

    Sound.rail(power);
    camera('punch', 180);
    sparks(body.x, body.y, 8, 0.7 * power);
  }

  function comeback(body) {
    if (!body || body.comebackUsed || body.dead) return false;

    const hpRatio = body.hp / body.maxHp;
    const spinRatio = body.spinRatio;

    if (spinRatio > 0.2 || hpRatio > 0.32) return false;

    let chance = 0.08;
    if (body.top.type === 'stamina') chance = 0.18;
    if (body.top.type === 'balance') chance = 0.12;
    if (body.top.type === 'attack') chance = 0.09;
    if (body.top.type === 'defense') chance = 0.06;

    if (Math.random() > chance) return false;

    body.comebackUsed = true;

    const f = topFeel(body.top);
    const a = Math.random() * Math.PI * 2;
    const burst = 4.5 * f.launchKick;

    body.vx += Math.cos(a) * burst;
    body.vy += Math.sin(a) * burst;
    body.spinRatio = Math.min(0.42, body.spinRatio + 0.18);
    body.hp = Math.min(body.maxHp * 0.38, body.hp + body.maxHp * 0.08);

    Sound.launch();
    camera('zg-launch-impact', 620);
    shockwave(body.x, body.y);
    afterimage(body.x, body.y, 104);
    sparks(body.x, body.y, 18, 1.1);

    return true;
  }

  function killcam(loser) {
    if (state.killcam) return;
    state.killcam = true;

    camera('zg-killcam', 1150);
    sparks(loser.x, loser.y, 28, 1.5);
    afterimage(loser.x, loser.y, 120);
    Sound.metal(1.8, 1.25);

    setTimeout(() => Sound.death(), 420);
  }

  /*
   * =========================================================
   * Physics
   * =========================================================
   */

  function seek(a, b, dt) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const orbit = Math.sin(now() * 0.0015) > 0 ? 1 : -1;

    const fa = PHY.seekForceMax * (0.6 + a.spinRatio * 0.7);
    const fb = PHY.seekForceMax * (0.6 + b.spinRatio * 0.7);

    a.vx += (nx * fa + -ny * PHY.tangentForce * orbit) * dt;
    a.vy += (ny * fa + nx * PHY.tangentForce * orbit) * dt;

    b.vx += (-nx * fb + ny * PHY.tangentForce * orbit) * dt;
    b.vy += (-ny * fb + -nx * PHY.tangentForce * orbit) * dt;
  }

  function friction(body, dt) {
    const f = Math.pow(PHY.friction, dt * body.frictionMul);

    body.vx *= f;
    body.vy *= f;

    const decay = Math.pow(PHY.spinDecay, dt * body.spinDecayMul);
    body.spin *= decay;

    const hpRatio = clamp(body.hp / body.maxHp, 0, 1);
    body.spinRatio = clamp(body.spin * 0.62 + hpRatio * 0.38, 0, 1);

    if (body.spinRatio < 0.24) {
      const wob = (0.24 - body.spinRatio) * 0.15;
      body.vx += rand(-wob, wob);
      body.vy += rand(-wob, wob);
    }

    const maxV = PHY.maxSpeed * (0.8 + body.top.speed / 260);
    const v = Math.hypot(body.vx, body.vy);

    if (v > maxV) {
      body.vx = body.vx / v * maxV;
      body.vy = body.vy / v * maxV;
    }
  }

  function move(body, dt) {
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }

  function boundary(body, arena) {
    const px = body.x - arena.cx;
    const py = body.y - arena.cy;

    const ex = px / arena.rx;
    const ey = py / arena.ry;

    const e = ex * ex + ey * ey;
    const limit = 1 - body.radius / Math.min(arena.rx, arena.ry);

    if (e <= limit * limit) return;

    const ang = Math.atan2(py / arena.ry, px / arena.rx);
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);

    body.x = arena.cx + nx * arena.rx * limit;
    body.y = arena.cy + ny * arena.ry * limit;

    const vn = body.vx * nx + body.vy * ny;

    if (vn > 0) {
      body.vx -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * nx;
      body.vy -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * ny;

      const p = clamp(Math.abs(vn) / 7, 0.3, 2);

      body.hp -= p * 1.2 * body.damageTakenMul;
      body.spin *= 1 - 0.015 * p;

      railFeel(body, p);
    }
  }

  function collide(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const minD = a.radius + b.radius;

    if (d >= minD) return;

    const nx = dx / d;
    const ny = dy / d;
    const overlap = minD - d;

    const total = a.mass + b.mass;

    a.x -= nx * overlap * (b.mass / total);
    a.y -= ny * overlap * (b.mass / total);
    b.x += nx * overlap * (a.mass / total);
    b.y += ny * overlap * (a.mass / total);

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const vel = rvx * nx + rvy * ny;

    if (vel > 0) return;

    const impulse = -(1 + PHY.hitRestitution) * vel / (1 / a.mass + 1 / b.mass);
    const ix = impulse * nx;
    const iy = impulse * ny;

    a.vx -= ix / a.mass;
    a.vy -= iy / a.mass;
    b.vx += ix / b.mass;
    b.vy += iy / b.mass;

    const rel = Math.hypot(rvx, rvy);
    const p = clamp(rel / 7, 0.25, 2.5);

    const dmgA = PHY.hitDamageBase * p * b.damageMul * a.damageTakenMul * (0.7 + b.top.power / 150);
    const dmgB = PHY.hitDamageBase * p * a.damageMul * b.damageTakenMul * (0.7 + a.top.power / 150);

    a.hp -= dmgA;
    b.hp -= dmgB;

    a.spin *= 1 - 0.018 * p;
    b.spin *= 1 - 0.018 * p;

    collisionFeel(a, b, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  function checkEnd() {
    const b = state.battle;
    if (!b || b.ended) return false;

    const p = b.player;
    const e = b.enemy;
    const elapsed = now() - b.startedAt;

    let winner = null;
    let loser = null;
    let reason = '';

    if (p.hp <= 0 || p.spinRatio <= 0.025) {
      winner = e;
      loser = p;
      reason = '你的陀螺力竭倒下';
    }

    if (e.hp <= 0 || e.spinRatio <= 0.025) {
      winner = p;
      loser = e;
      reason = '對手陀螺力竭倒下';
    }

    if (!winner && elapsed > PHY.battleLimit) {
      if (p.hp + p.spinRatio * 60 >= e.hp + e.spinRatio * 60) {
        winner = p;
        loser = e;
        reason = '時間終了，你的剩餘轉速較高';
      } else {
        winner = e;
        loser = p;
        reason = '時間終了，對手剩餘轉速較高';
      }
    }

    if (!winner) return false;

    b.ended = true;
    loser.dead = true;

    killcam(loser);

    setTimeout(() => {
      endBattle(winner.side === 'player', reason);
    }, 1050);

    return true;
  }

  function loop(t) {
    if (!state.running || state.paused || !state.battle) return;

    const dtRaw = state.lastTime ? (t - state.lastTime) / 16.666 : 1;
    const dt = clamp(dtRaw, 0.35, 2.2);
    state.lastTime = t;

    const b = state.battle;
    const a = b.player;
    const e = b.enemy;

    seek(a, e, dt);

    friction(a, dt);
    friction(e, dt);

    move(a, dt);
    move(e, dt);

    boundary(a, b.arena);
    boundary(e, b.arena);

    collide(a, e);

    syncEl(a);
    syncEl(e);

    updateFeel();
    updateHpBars();

    if (checkEnd()) return;

    state.raf = requestAnimationFrame(loop);
  }

  /*
   * =========================================================
   * Start / End
   * =========================================================
   */

  function startBattle() {
    Sound.resume();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    ensureHtml();
    ensureBattleInner();
    injectVisualEnhancements();

    state.selectedTop = state.selectedTop || loadTop();
    state.enemyTop = pickEnemy();

    state.running = true;
    state.paused = false;
    state.lastTime = 0;
    state.firstCollision = false;
    state.killcam = false;

    showScreen('battle');
    clearBattle();

    const arena = arenaInfo();

    const player = makeBody(state.selectedTop, 'player', arena);
    const enemy = makeBody(state.enemyTop, 'enemy', arena);

    player.el = makeTopEl(player.top, 'player');
    enemy.el = makeTopEl(enemy.top, 'enemy');

    state.battle = {
      arena,
      player,
      enemy,
      startedAt: now(),
      ended: false
    };

    updateBattleLabels();
    updateHpBars();

    syncEl(player);
    syncEl(enemy);

    launchSequence();

    setTimeout(() => {
      state.lastTime = 0;
      state.raf = requestAnimationFrame(loop);
    }, 520);
  }

  function stopBattle() {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();
    clearBattle();
  }

  function endBattle(playerWon, reason) {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const oldScore = getMyScore();
    const delta = playerWon
      ? 28 + Math.round(Math.random() * 18)
      : -(12 + Math.round(Math.random() * 12));

    const newScore = Math.max(0, oldScore + delta);
    setMyScore(newScore);
    updateFriendAfterBattle(playerWon, newScore);

    showScreen('result');

    const title =
      $('#zg-result-title') ||
      $('#result-title') ||
      $('.zg-result-title') ||
      $('.result-title');

    const sub =
      $('#zg-result-subtitle') ||
      $('#result-subtitle') ||
      $('.zg-result-subtitle') ||
      $('.result-subtitle');

    const score =
      $('#zg-result-score') ||
      $('#result-score') ||
      $('.zg-result-score') ||
      $('.result-score');

    if (title) title.textContent = playerWon ? '勝利！陀螺稱霸競技場' : '敗北…轉速耗盡';
    if (sub) sub.textContent = reason || '';
    if (score) {
      score.innerHTML = `
        <strong>${newScore}</strong>
        <span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span>
      `;
    }

    renderFriendLeaderboard();
  }

  /*
   * =========================================================
   * Leaderboard
   * =========================================================
   */

  function loadFriends() {
    const saved = safeParse(localStorage.getItem(STORAGE.friends), null);
    if (Array.isArray(saved) && saved.length) return saved;

    const list = [
      {
        id: 'me',
        name: '你',
        score: getMyScore(),
        wins: 8,
        losses: 5,
        todayDelta: 0
      },
      {
        id: 'u001',
        name: 'Kai',
        score: 1820,
        wins: 36,
        losses: 12,
        todayDelta: 45
      },
      {
        id: 'u002',
        name: 'Mina',
        score: 1675,
        wins: 28,
        losses: 18,
        todayDelta: -12
      },
      {
        id: 'u003',
        name: 'Leo',
        score: 1510,
        wins: 21,
        losses: 17,
        todayDelta: 18
      },
      {
        id: 'u004',
        name: 'Rin',
        score: 1385,
        wins: 19,
        losses: 21,
        todayDelta: -4
      }
    ];

    localStorage.setItem(STORAGE.friends, JSON.stringify(list));
    return list;
  }

  function saveFriends(list) {
    localStorage.setItem(STORAGE.friends, JSON.stringify(list));
  }

  function updateFriendAfterBattle(playerWon, score) {
    const list = loadFriends();
    const me = list.find(x => x.id === 'me');

    if (me) {
      const old = Number(me.score || 0);
      me.score = score;
      me.todayDelta = score - old;

      if (playerWon) me.wins = Number(me.wins || 0) + 1;
      else me.losses = Number(me.losses || 0) + 1;
    }

    saveFriends(list);
  }

  function normalizeFriends(list) {
    const myScore = getMyScore();

    return [...list]
      .map(x => {
        const total = Number(x.wins || 0) + Number(x.losses || 0);
        const winRate = total > 0 ? Math.round(Number(x.wins || 0) / total * 100) : 0;

        return {
          ...x,
          winRate,
          scoreDiff: Number(x.score || 0) - myScore
        };
      })
      .sort((a, b) => {
        if (Number(b.score || 0) !== Number(a.score || 0)) {
          return Number(b.score || 0) - Number(a.score || 0);
        }

        return Number(b.winRate || 0) - Number(a.winRate || 0);
      })
      .map((x, i) => ({
        ...x,
        rank: i + 1
      }));
  }

  function renderFriendLeaderboard() {
    const box =
      $('#friend-leaderboard') ||
      $('#zg-friend-leaderboard') ||
      $('.friend-leaderboard') ||
      $('.zg-friend-leaderboard');

    if (!box) return;

    box.classList.add('zg-friend-leaderboard');

    const rows = normalizeFriends(loadFriends());

    box.innerHTML = rows.map(row => {
      const isMe = row.id === 'me';

      const diff =
        row.scoreDiff === 0
          ? '同分'
          : row.scoreDiff > 0
            ? `領先你 ${row.scoreDiff}`
            : `落後你 ${Math.abs(row.scoreDiff)}`;

      const delta = Number(row.todayDelta || 0);

      return `
        <div class="zg-friend-rank-row ${isMe ? 'is-me' : ''}">
          <div class="zg-friend-rank-no">#${row.rank}</div>
          <div class="zg-friend-avatar"><span>${String(row.name || '?').slice(0, 1)}</span></div>
          <div class="zg-friend-main">
            <div class="zg-friend-name">${row.name}${isMe ? '<em>你</em>' : ''}</div>
            <div class="zg-friend-sub">勝率 ${row.winRate}% · ${row.wins || 0}勝 ${row.losses || 0}敗</div>
          </div>
          <div class="zg-friend-score">
            <strong>${row.score || 0}</strong>
            <span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span>
          </div>
          <div class="zg-friend-diff">${diff}</div>
        </div>
      `;
    }).join('');
  }

  /*
   * =========================================================
   * Button Action Resolver
   * =========================================================
   */

  function textOf(el) {
    return String(el?.textContent || '').replace(/\s+/g, '').trim();
  }

  function resolveAction(el) {
    if (!el) return '';

    const direct =
      el.getAttribute('data-zg-action') ||
      el.getAttribute('data-action') ||
      el.getAttribute('data-game-action');

    if (direct) return direct;

    const id = String(el.id || '').toLowerCase();
    const cls = String(el.className || '').toLowerCase();
    const txt = textOf(el);

    const key = `${id} ${cls}`;

    if (
      key.includes('start') ||
      key.includes('begin') ||
      txt.includes('開始遊戲') ||
      txt.includes('開始') ||
      txt.includes('start')
    ) {
      if (state.screen === 'select') return 'battle';
      return 'start';
    }

    if (
      key.includes('battle') ||
      key.includes('fight') ||
      key.includes('launch') ||
      txt.includes('開始對戰') ||
      txt.includes('對戰') ||
      txt.includes('發射')
    ) {
      return 'battle';
    }

    if (
      key.includes('retry') ||
      key.includes('again') ||
      key.includes('replay') ||
      txt.includes('再戰') ||
      txt.includes('再來') ||
      txt.includes('重玩')
    ) {
      return 'retry';
    }

    if (
      key.includes('home') ||
      key.includes('back') ||
      txt.includes('首頁') ||
      txt.includes('返回')
    ) {
      return 'home';
    }

    if (
      key.includes('select') ||
      key.includes('change') ||
      txt.includes('更換') ||
      txt.includes('選擇陀螺')
    ) {
      return 'select';
    }

    if (
      key.includes('leader') ||
      key.includes('rank') ||
      txt.includes('排行') ||
      txt.includes('排行榜')
    ) {
      return 'leaderboard';
    }

    return '';
  }

  function runAction(action) {
    if (!action) return;

    Sound.resume();

    if (action === 'start') {
      showScreen('select');
      return;
    }

    if (action === 'battle') {
      startBattle();
      return;
    }

    if (action === 'retry') {
      startBattle();
      return;
    }

    if (action === 'home') {
      stopBattle();
      showScreen('home');
      return;
    }

    if (action === 'select') {
      stopBattle();
      showScreen('select');
      return;
    }

    if (action === 'leaderboard') {
      renderFriendLeaderboard();
      showScreen('leaderboard');
    }
  }

  function bindEvents() {
    document.addEventListener('click', e => {
      const topCard = e.target.closest('[data-top-id]');
      if (topCard && topCard.classList.contains('zg-top-card')) {
        e.preventDefault();
        selectTop(topCard.getAttribute('data-top-id'));
        return;
      }

      const clickable = e.target.closest('button, a, [role="button"], [data-zg-action], [data-action], [data-game-action]');
      if (!clickable) return;

      const action = resolveAction(clickable);
      if (!action) return;

      e.preventDefault();
      runAction(action);
    });

    window.addEventListener('resize', () => {
      if (state.battle) {
        state.battle.arena = arenaInfo();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        Sound.stopHum();
      } else if (state.screen === 'battle' && state.battle && !state.battle.ended) {
        state.paused = false;

        Sound.startHum(0, topFeel(state.battle.player.top).humBase);
        Sound.startHum(1, topFeel(state.battle.enemy.top).humBase);

        state.lastTime = 0;
        state.raf = requestAnimationFrame(loop);
      }
    });
  }

  /*
   * =========================================================
   * Init
   * =========================================================
   */

  function init() {
    ensureHtml();
    ensureBattleInner();

    state.selectedTop = loadTop();

    injectVisualEnhancements();
    renderTopSelection();
    renderFriendLeaderboard();
    bindEvents();

    if (!state.screen) state.screen = 'home';

    showScreen('home');

    window.ZGGame = {
      version: VERSION,
      state,
      startBattle,
      stopBattle,
      showScreen,
      selectTop,
      renderFriendLeaderboard,
      sound: Sound
    };

    console.info(`[ZGGame] game.js loaded v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
