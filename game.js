/*
 * ZELO GAME JS
 * CSS Matched Complete Replacement
 * Version: 202607121145
 *
 * Fully matched with CSS structure:
 * #zelo-liff-game
 * #screen-start
 * #screen-select
 * #screen-battle
 * #screen-result
 * .zg-screen.active
 * .zg-top-card[data-id]
 * .zg-top-icon
 * .zg-battle-box
 * .zg-arena-ring
 * .zg-player-top / .zg-enemy-top
 * .zg-hp-fill
 * .zg-flash-overlay.hit
 */

(() => {
  'use strict';

  const VERSION = '202607121205';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const now = () => performance.now();

  const STORAGE = {
    selectedType: 'zelo_selected_top_type',
    myScore: 'zelo_my_score',
    friends: 'zelo_friend_rank'
  };

  const PHY = {
    radius: 34,
    ringPadding: 42,
    initialSpeed: 7.4,
    maxSpeed: 12.2,
    friction: 0.993,
    spinDecay: 0.99855,
    wallRestitution: 0.84,
    hitRestitution: 0.98,
    hitDamageBase: 2.75,
    seekForceMax: 0.047,
    tangentForce: 0.037,
    battleLimit: 65000
  };

  const TOPS = [
    {
      id: 'attack',
      name: '烈焰攻擊型',
      type: 'attack',
      emoji: '🔥',
      power: 96,
      defense: 58,
      stamina: 62,
      speed: 96,
      colorA: '#e60012',
      colorB: '#ffd45a'
    },
    {
      id: 'defense',
      name: '鋼鐵防禦型',
      type: 'defense',
      emoji: '🛡️',
      power: 64,
      defense: 98,
      stamina: 78,
      speed: 52,
      colorA: '#3fa9ff',
      colorB: '#d8f1ff'
    },
    {
      id: 'stamina',
      name: '永恆耐久型',
      type: 'stamina',
      emoji: '🌿',
      power: 62,
      defense: 72,
      stamina: 98,
      speed: 58,
      colorA: '#06c755',
      colorB: '#c7ffd9'
    },
    {
      id: 'balance',
      name: '星環平衡型',
      type: 'balance',
      emoji: '✨',
      power: 78,
      defense: 76,
      stamina: 76,
      speed: 76,
      colorA: '#9b5cff',
      colorB: '#57f2ff'
    }
  ];

  const FEEL = {
    attack: {
      label: '攻擊型',
      launchKick: 1.2,
      sparkMul: 1.65,
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
    stamina: {
      label: '耐久型',
      launchKick: 0.92,
      sparkMul: 0.75,
      hitSharpness: 0.9,
      stability: 1.22,
      friction: 0.68,
      humBase: 118,
      humGain: 0.72
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
    }
  };

  const state = {
    screen: 'start',
    selectedTop: null,
    enemyTop: null,
    battle: null,
    raf: null,
    running: false,
    paused: false,
    lastFrame: 0,
    firstCollision: false,
    killcamPlayed: false
  };

  function getFeel(top) {
    return FEEL[top?.type] || FEEL.balance;
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function getMyScore() {
    return Number(localStorage.getItem(STORAGE.myScore) || 1200);
  }

  function setMyScore(score) {
    localStorage.setItem(STORAGE.myScore, String(Math.max(0, Math.round(score))));
  }

  function saveSelectedTop(top) {
    if (!top) return;
    localStorage.setItem(STORAGE.selectedType, top.id);
  }

  function loadSelectedTop() {
    const id = localStorage.getItem(STORAGE.selectedType) || 'attack';
    return TOPS.find(t => t.id === id) || TOPS[0];
  }

  /*
   * =========================================================
   * App / Screen helpers
   * =========================================================
   */

  function appRoot() {
    return $('#zelo-liff-game') || $('#zg-app') || $('#app') || document.body;
  }

  function screenStart() {
    return $('#screen-start') || $('#screen-home');
  }

  function screenSelect() {
    return $('#screen-select');
  }

  function screenBattle() {
    return $('#screen-battle');
  }

  function screenResult() {
    return $('#screen-result');
  }

  function allScreens() {
    return [
      screenStart(),
      screenSelect(),
      screenBattle(),
      screenResult()
    ].filter(Boolean);
  }

  function showScreen(name) {
    state.screen = name;

    const map = {
      start: screenStart(),
      home: screenStart(),
      select: screenSelect(),
      battle: screenBattle(),
      result: screenResult()
    };

    const target = map[name] || screenStart();

    allScreens().forEach(screen => {
      const active = screen === target;
      screen.classList.toggle('active', active);
      screen.classList.toggle('is-active', active);
      screen.hidden = !active;
      screen.style.display = active ? 'flex' : 'none';
      screen.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    document.body.setAttribute('data-zg-screen', name);

    if (name === 'select') renderTopSelection();
    if (name === 'result') renderFriendRank();
  }

  function battleBox() {
    return $('.zg-battle-box') || $('#zg-battle-box') || screenBattle() || appRoot();
  }

  function arenaRing() {
    return $('.zg-arena-ring', battleBox()) || $('#zg-arena-ring') || battleBox();
  }

  function restartClass(el, cls, duration = 300) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), duration);
  }

  function setCommentary(text) {
    const el = $('.zg-commentary');
    if (el) el.textContent = text;
  }

  /*
   * =========================================================
   * Audio
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
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return ctx;
    }

    function resume() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    }

    function tone(freq, duration, gain, type = 'sine', endFreq = null) {
      const c = ensure();
      if (!c || !master) return;

      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t);

      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
      }

      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + duration + 0.03);
    }

    function noise(duration = 0.08, gain = 0.2, filterFreq = 2600) {
      const c = ensure();
      if (!c || !master) return;

      const len = Math.max(1, Math.floor(c.sampleRate * duration));
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
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

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

    function metal(power = 1, sharpness = 1) {
      resume();
      const p = clamp(power, 0.25, 2.2);
      tone(820 * sharpness, 0.08, 0.18 * p, 'square', 260 * sharpness);
      tone(2600 * sharpness, 0.045, 0.08 * p, 'sawtooth', 900);
      noise(0.07, 0.28 * p, 3600 * sharpness);
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

    function createHum(base) {
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

      if (index === 0 && humA) {
        try { humA.osc.stop(); } catch (e) {}
        humA = null;
      }

      if (index === 1 && humB) {
        try { humB.osc.stop(); } catch (e) {}
        humB = null;
      }

      const h = createHum(base);
      if (index === 0) humA = h;
      else humB = h;
    }

    function updateHum(index, spinRatio, base, gainMul) {
      const c = ensure();
      if (!c) return;

      const h = index === 0 ? humA : humB;
      if (!h) return;

      const t = c.currentTime;
      const r = clamp(spinRatio, 0, 1);

      h.osc.frequency.setTargetAtTime(base + r * 180, t, 0.05);
      h.filter.frequency.setTargetAtTime(360 + r * 900, t, 0.06);
      h.gain.gain.setTargetAtTime((0.012 + r * 0.043) * gainMul, t, 0.08);
    }

    function stopHum() {
      const c = ensure();
      if (!c) return;

      [humA, humB].forEach(h => {
        if (!h) return;
        h.gain.gain.setTargetAtTime(0.001, c.currentTime, 0.1);
        setTimeout(() => {
          try { h.osc.stop(); } catch (e) {}
        }, 350);
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
   * DOM setup / Visual injection
   * =========================================================
   */

  function ensureAppHeight() {
    const set = () => {
      document.documentElement.style.setProperty('--zg-app-height', `${window.innerHeight}px`);
    };

    set();
    window.addEventListener('resize', set);
    window.addEventListener('orientationchange', () => setTimeout(set, 250));
  }

  function ensureBasicDom() {
    const root = appRoot();

    if (!screenStart()) {
      const s = document.createElement('section');
      s.id = 'screen-start';
      s.className = 'zg-screen active';
      s.innerHTML = `
        <div class="zg-topbar">
          <div class="zg-brand">ZELO</div>
          <div class="zg-pill">BATTLE</div>
        </div>
        <main class="zg-main">
          <div class="zg-hero">🌀</div>
          <h1 class="zg-title">陀螺<br><span class="zg-highlight">競技場</span></h1>
          <p class="zg-subtitle">發射、碰撞、逆轉，成為最後仍在旋轉的玩家。</p>
        </main>
        <div class="zg-bottom">
          <button class="zg-btn zg-btn-red" data-zg-action="start" type="button">開始遊戲</button>
        </div>
      `;
      root.appendChild(s);
    }

    if (!screenSelect()) {
      const s = document.createElement('section');
      s.id = 'screen-select';
      s.className = 'zg-screen';
      s.hidden = true;
      s.innerHTML = `
        <div class="zg-topbar">
          <div class="zg-brand">SELECT</div>
          <button class="zg-small-btn" data-zg-action="home" type="button">返回</button>
        </div>
        <main class="zg-main">
          <h2 class="zg-step-title">選擇陀螺</h2>
          <p class="zg-desc">不同類型擁有不同碰撞手感與戰鬥節奏。</p>
          <div class="zg-top-list"></div>
        </main>
        <div class="zg-bottom">
          <button class="zg-btn zg-btn-red" data-zg-action="battle" type="button">發射！開始對戰</button>
        </div>
      `;
      root.appendChild(s);
    }

    if (!screenBattle()) {
      const s = document.createElement('section');
      s.id = 'screen-battle';
      s.className = 'zg-screen';
      s.hidden = true;
      s.innerHTML = `
        <div class="zg-topbar">
          <div class="zg-brand">BATTLE</div>
          <button class="zg-small-btn" data-zg-action="select" type="button">退出</button>
        </div>
        <main class="zg-main">
          <div class="zg-battle-box">
            <div class="zg-arena-ring"></div>
          </div>
          <div class="zg-panel">
            <div class="zg-hp-row">
              <span>你</span>
              <div class="zg-hp-bar"><div id="zg-player-hp" class="zg-hp-fill"></div></div>
              <b id="zg-player-hp-text">100%</b>
            </div>
            <div class="zg-hp-row">
              <span>敵</span>
              <div class="zg-hp-bar"><div id="zg-enemy-hp" class="zg-hp-fill"></div></div>
              <b id="zg-enemy-hp-text">100%</b>
            </div>
            <div class="zg-commentary">準備發射！</div>
          </div>
        </main>
      `;
      root.appendChild(s);
    }

    if (!screenResult()) {
      const s = document.createElement('section');
      s.id = 'screen-result';
      s.className = 'zg-screen';
      s.hidden = true;
      s.innerHTML = `
        <div class="zg-topbar">
          <div class="zg-brand">RESULT</div>
          <div class="zg-pill">SCORE</div>
        </div>
        <main class="zg-main">
          <div class="zg-rank" id="zg-result-rank">W</div>
          <h2 class="zg-result-title" id="zg-result-title">勝利！</h2>
          <p class="zg-desc" id="zg-result-subtitle">你的陀螺撐到了最後。</p>
          <div class="zg-coupon">
            <div class="zg-coupon-label">目前積分</div>
            <div class="zg-coupon-code" id="zg-result-score">1200</div>
          </div>
          <div class="zg-rankbox">
            <div class="zg-rankbox-title">好友排行榜</div>
            <div id="zg-friend-rank-list"></div>
          </div>
        </main>
        <div class="zg-bottom">
          <button class="zg-btn zg-btn-red" data-zg-action="retry" type="button">再戰一次</button>
          <button class="zg-btn zg-btn-blue" data-zg-action="select" type="button">更換陀螺</button>
          <button class="zg-btn zg-btn-green" data-zg-action="share" type="button">邀請好友</button>
          <button class="zg-btn zg-btn-white" data-zg-action="home" type="button">返回首頁</button>
        </div>
      `;
      root.appendChild(s);
    }

    ensureBattleDom();
  }

  function ensureBattleDom() {
    const battle = screenBattle();
    if (!battle) return;

    let box = $('.zg-battle-box', battle);
    if (!box) {
      box = document.createElement('div');
      box.className = 'zg-battle-box';
      const main = $('.zg-main', battle) || battle;
      main.prepend(box);
    }

    if (!$('.zg-arena-ring', box)) {
      const ring = document.createElement('div');
      ring.className = 'zg-arena-ring';
      box.appendChild(ring);
    }

    if (!$('.zg-flash-overlay', box)) {
      const flash = document.createElement('div');
      flash.className = 'zg-flash-overlay';
      box.appendChild(flash);
    }
  }

  function injectVisualEnhancements() {
    const root = appRoot();

    if (!$('.zg-energy-grid', root)) {
      const grid = document.createElement('div');
      grid.className = 'zg-energy-grid';
      grid.setAttribute('aria-hidden', 'true');
      root.prepend(grid);
    }

    const start = screenStart();
    if (start && !$('.zg-stardust', start)) {
      const layer = document.createElement('div');
      layer.className = 'zg-stardust';
      layer.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < 12; i++) {
        const star = document.createElement('i');
        star.className = 'zg-star';
        layer.appendChild(star);
      }

      start.prepend(layer);
    }

    ensureBattleDom();
    ensureDangerVignette();
    removeDuplicateFlash();
  }

  function removeDuplicateFlash() {
    const box = battleBox();
    const all = $$('.zg-flash-overlay', box);
    if (all.length > 1) all.slice(1).forEach(el => el.remove());
  }

  function ensureDangerVignette() {
    const box = battleBox();
    let v = $('.zg-danger-vignette', box);

    if (!v) {
      v = document.createElement('div');
      v.className = 'zg-danger-vignette';
      box.appendChild(v);
    }

    return v;
  }

  /*
   * =========================================================
   * Selection
   * =========================================================
   */

  function renderTopSelection() {
    const list = $('.zg-top-list', screenSelect()) || $('.zg-top-list');
    if (!list) return;

    list.innerHTML = TOPS.map(top => {
      const f = getFeel(top);

      return `
        <button class="zg-top-card ${top.type}" data-id="${top.id}" data-type="${top.type}" data-top-id="${top.id}" type="button">
          <div class="zg-top-icon ${top.type}" style="--c1:${top.colorA};--c2:${top.colorB};">
            ${top.emoji}
            ${top.type === 'attack' ? '<i class="zg-ember"></i><i class="zg-ember"></i><i class="zg-ember"></i>' : ''}
            ${top.type === 'defense' ? '<i class="zg-shield-ring"></i><i class="zg-shield-ring"></i>' : ''}
            ${top.type === 'stamina' ? '<i class="zg-orbit-dot"></i><i class="zg-orbit-dot"></i>' : ''}
          </div>
          <div>
            <div class="zg-top-name">${top.name}</div>
            <div class="zg-top-type">${f.label}</div>
            <div class="zg-stats">
              <div class="zg-stat"><span>攻擊</span><strong>${top.power}</strong></div>
              <div class="zg-stat"><span>防禦</span><strong>${top.defense}</strong></div>
              <div class="zg-stat"><span>耐久</span><strong>${top.stamina}</strong></div>
              <div class="zg-stat"><span>速度</span><strong>${top.speed}</strong></div>
            </div>
          </div>
        </button>
      `;
    }).join('');

    selectTop((state.selectedTop || loadSelectedTop()).id);
  }

  function selectTop(id) {
    const top = TOPS.find(t => t.id === id) || TOPS[0];

    state.selectedTop = top;
    saveSelectedTop(top);

    $$('.zg-top-card').forEach(card => {
      const active = card.getAttribute('data-id') === top.id || card.getAttribute('data-top-id') === top.id;
      card.classList.toggle('selected', active);
    });
  }

  function pickEnemyTop() {
    const pool = TOPS.filter(t => t.id !== state.selectedTop?.id);
    return pool[Math.floor(Math.random() * pool.length)] || TOPS[1] || TOPS[0];
  }

  /*
   * =========================================================
   * Battle visual effects
   * =========================================================
   */

  function flash() {
    const f = $('.zg-flash-overlay', battleBox());
    if (!f) return;
    restartClass(f, 'hit', 200);
  }

  function spark(x, y) {
    const box = battleBox();
    const el = document.createElement('div');
    el.className = 'zg-spark active';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 420);
  }

  function impactRing(x, y) {
    const box = battleBox();
    const el = document.createElement('div');
    el.className = 'zg-impact-ring active';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 460);
  }

  function metalSparks(x, y, count = 14, intensity = 1) {
    const box = battleBox();
    const n = Math.round(count * clamp(intensity, 0.5, 2.4));

    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = `zg-metal-spark ${intensity > 1.2 ? 'intense' : ''}`;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--r', `${Math.random() * 360}deg`);
      s.style.setProperty('--d', `${34 + Math.random() * 90 * intensity}px`);
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
    }

    box.appendChild(s);
    setTimeout(() => s.remove(), wobble ? 1250 : 950);
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

  function impactStreak(body) {
    const speed = Math.hypot(body.vx, body.vy);
    if (speed < 3) return;

    const box = battleBox();
    const el = document.createElement('div');
    const angle = Math.atan2(body.vy, body.vx) * 180 / Math.PI;

    el.className = `zg-impact-streak ${body.side === 'player' ? 'zg-impact-blue' : 'zg-impact-red'}`;
    el.style.left = `${body.x}px`;
    el.style.top = `${body.y}px`;
    el.style.width = `${clamp(speed * 12, 36, 110)}px`;
    el.style.transform = `rotate(${angle + 180}deg)`;

    box.appendChild(el);
    setTimeout(() => el.remove(), 460);
  }

  /*
   * =========================================================
   * Battle body
   * =========================================================
   */

  function getArenaInfo() {
    const box = battleBox();
    const rect = box.getBoundingClientRect();
    const ring = arenaRing();
    const ringRect = ring.getBoundingClientRect();

    const w = rect.width || 360;
    const h = rect.height || 300;

    let r = Math.min(w, h) * 0.38;

    if (ring && ring !== box && ringRect.width > 40) {
      r = Math.min(ringRect.width, ringRect.height) / 2;
    }

    return {
      w,
      h,
      cx: w / 2,
      cy: h / 2,
      rx: Math.max(90, r - 4),
      ry: Math.max(90, r - 4)
    };
  }

  function createTopElement(top, side) {
    const box = battleBox();
    const el = document.createElement('div');

    el.className = `zg-battle-top ${side === 'player' ? 'zg-player-top' : 'zg-enemy-top'} ${top.type}`;
    el.setAttribute('data-side', side);
    el.setAttribute('data-id', top.id);
    el.style.setProperty('--c1', top.colorA);
    el.style.setProperty('--c2', top.colorB);
    el.innerHTML = `<span>${top.emoji}</span>`;

    box.appendChild(el);
    return el;
  }

  function createBody(top, side, arena) {
    const f = getFeel(top);
    const startX = side === 'player' ? arena.w * 0.28 : arena.w * 0.72;
    const startY = side === 'player' ? arena.h * 0.57 : arena.h * 0.43;
    const launchAngle = side === 'player'
      ? rand(-0.55, 0.4)
      : Math.PI + rand(-0.4, 0.55);

    const baseSpeed = PHY.initialSpeed * f.launchKick * (0.86 + top.speed / 220);
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
      angularSpeed: 28 + top.speed * 0.16,
      damageMul: top.type === 'attack' ? 1.18 : 1,
      damageTakenMul: top.type === 'defense' ? 0.82 : 1,
      spinDecayMul: top.type === 'stamina' ? 0.72 : 1,
      frictionMul: f.friction,
      restitutionMul: top.type === 'defense' ? 0.72 : top.type === 'attack' ? 1.08 : 1,
      lastRail: 0,
      comebackUsed: false,
      dead: false
    };
  }

  function syncBody(body) {
    if (!body || !body.el) return;

    body.angle += body.angularSpeed * body.spinRatio;

    body.el.style.left = `${body.x}px`;
    body.el.style.top = `${body.y}px`;
    body.el.style.transform = `translate(-50%, -50%) rotate(${body.angle}deg)`;
    body.el.style.opacity = body.dead ? '0.35' : '1';

    const speed = Math.hypot(body.vx, body.vy);
    body.el.classList.toggle('fast-move', speed > 7.2);
    body.el.classList.toggle('zg-top-wobble', body.spinRatio < 0.22);
  }

  function updateHpBars() {
    const b = state.battle;
    if (!b) return;

    const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    const pFill = $('#zg-player-hp') || $('.zg-player-hp .zg-hp-fill') || $('.zg-player-hp-fill');
    const eFill = $('#zg-enemy-hp') || $('.zg-enemy-hp .zg-hp-fill') || $('.zg-enemy-hp-fill');

    if (pFill) {
      pFill.style.width = `${pr * 100}%`;
      pFill.classList.toggle('zg-low-spin-warning', pr < 0.22);
    }

    if (eFill) {
      eFill.style.width = `${er * 100}%`;
      eFill.classList.toggle('zg-low-spin-warning', er < 0.22);
    }

    const pt = $('#zg-player-hp-text');
    const et = $('#zg-enemy-hp-text');

    if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
    if (et) et.textContent = `${Math.ceil(er * 100)}%`;
  }

  /*
   * =========================================================
   * Battle physics and feel
   * =========================================================
   */

  function playLaunchSequence() {
    const b = state.battle;
    if (!b) return;

    Sound.resume();
    Sound.launch();

    restartClass(battleBox(), 'zg-launch-impact', 700);

    shockwave(b.player.x, b.player.y);
    shockwave(b.enemy.x, b.enemy.y);

    afterimage(b.player.x, b.player.y, 96);
    afterimage(b.enemy.x, b.enemy.y, 96);

    Sound.startHum(0, getFeel(b.player.top).humBase);
    Sound.startHum(1, getFeel(b.enemy.top).humBase);

    setCommentary('發射！兩顆陀螺高速進場！');
  }

  function updateBattleFeel() {
    const b = state.battle;
    if (!b) return;

    const p = b.player;
    const e = b.enemy;

    const pf = getFeel(p.top);
    const ef = getFeel(e.top);

    Sound.updateHum(0, p.spinRatio, pf.humBase, pf.humGain);
    Sound.updateHum(1, e.spinRatio, ef.humBase, ef.humGain);

    const danger = ensureDangerVignette();
    danger.classList.toggle('active', p.spinRatio < 0.22 || e.spinRatio < 0.22);

    if (Math.random() < 0.18) {
      const ps = Math.hypot(p.vx, p.vy);
      const es = Math.hypot(e.vx, e.vy);

      if (ps > 1.2) scratch(p.x, p.y, p.vx, p.vy, p.spinRatio < 0.22);
      if (es > 1.2) scratch(e.x, e.y, e.vx, e.vy, e.spinRatio < 0.22);
    }

    tryComeback(p);
    tryComeback(e);
  }

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

  function applyFriction(body, dt) {
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

    const angle = Math.atan2(py / arena.ry, px / arena.rx);
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);

    body.x = arena.cx + nx * arena.rx * limit;
    body.y = arena.cy + ny * arena.ry * limit;

    const vn = body.vx * nx + body.vy * ny;

    if (vn > 0) {
      body.vx -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * nx;
      body.vy -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * ny;

      const power = clamp(Math.abs(vn) / 7, 0.3, 2);

      body.hp -= power * 1.15 * body.damageTakenMul;
      body.spin *= 1 - 0.015 * power;

      const t = now();
      if (t - body.lastRail > 150) {
        body.lastRail = t;
        Sound.rail(power);
        restartClass(battleBox(), 'wall-hit', 320);
        restartClass(battleBox(), 'shake', 240);
        metalSparks(body.x, body.y, 8, power * 0.7);
        setCommentary('撞上護欄！金屬邊界把陀螺彈回場內！');
      }
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

    const totalMass = a.mass + b.mass;

    a.x -= nx * overlap * (b.mass / totalMass);
    a.y -= ny * overlap * (b.mass / totalMass);
    b.x += nx * overlap * (a.mass / totalMass);
    b.y += ny * overlap * (a.mass / totalMass);

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
    const power = clamp(rel / 7, 0.25, 2.5);

    const damageA =
      PHY.hitDamageBase *
      power *
      b.damageMul *
      a.damageTakenMul *
      (0.7 + b.top.power / 150);

    const damageB =
      PHY.hitDamageBase *
      power *
      a.damageMul *
      b.damageTakenMul *
      (0.7 + a.top.power / 150);

    a.hp -= damageA;
    b.hp -= damageB;

    a.spin *= 1 - 0.018 * power;
    b.spin *= 1 - 0.018 * power;

    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;

    collisionFeel(a, b, x, y, power, rel);
  }

  function collisionFeel(a, b, x, y, power, relSpeed) {
    const fa = getFeel(a.top);
    const fb = getFeel(b.top);

    const rvx = a.vx - b.vx;
    const rvy = a.vy - b.vy;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const approach = Math.abs(rvx * nx + rvy * ny);
    const tangent = Math.abs(rvx * -ny + rvy * nx);

    const sharp = (fa.hitSharpness + fb.hitSharpness) / 2;
    const sparkMul = Math.max(fa.sparkMul, fb.sparkMul) * power;

    Sound.metal(power, sharp);

    spark(x, y);
    impactRing(x, y);
    metalSparks(x, y, approach > tangent * 1.15 ? 22 : 13, sparkMul);
    flash();

    restartClass(a.el, 'impact-squash', 220);
    restartClass(b.el, 'impact-squash', 220);

    impactStreak(a);
    impactStreak(b);

    if (approach > tangent * 1.15) {
      restartClass(battleBox(), power > 1.25 ? 'big-shake' : 'shake', power > 1.25 ? 360 : 260);
      restartClass(battleBox(), 'zg-collision-zoom', 280);
      setCommentary('正面對撞！火花爆裂，雙方轉速都被削弱！');

      if (!state.firstCollision) {
        state.firstCollision = true;
        restartClass(battleBox(), 'zg-killcam', 900);
      }
    } else {
      restartClass(battleBox(), 'punch', 220);
      setCommentary('側面切入！陀螺被打歪，軌跡開始偏移！');

      const sideForce = 0.7 * power;
      a.vx += -ny * sideForce;
      a.vy += nx * sideForce;
      b.vx -= -ny * sideForce;
      b.vy -= nx * sideForce;
    }

    if (Math.abs(a.spinRatio - b.spinRatio) > 0.24 && relSpeed > 4) {
      const loser = a.spinRatio > b.spinRatio ? b : a;
      loser.el.classList.add('zg-ground-grind');
      Sound.grind(power);
      setTimeout(() => loser.el.classList.remove('zg-ground-grind'), 260);
      setCommentary('上旋壓制！弱勢陀螺擦地噴出火光！');
    }
  }

  function tryComeback(body) {
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

    const f = getFeel(body.top);
    const angle = Math.random() * Math.PI * 2;
    const burst = 4.5 * f.launchKick;

    body.vx += Math.cos(angle) * burst;
    body.vy += Math.sin(angle) * burst;
    body.spinRatio = Math.min(0.42, body.spinRatio + 0.18);
    body.spin = Math.min(0.6, body.spin + 0.18);
    body.hp = Math.min(body.maxHp * 0.38, body.hp + body.maxHp * 0.08);

    Sound.launch();
    shockwave(body.x, body.y);
    afterimage(body.x, body.y, 104);
    metalSparks(body.x, body.y, 18, 1.1);
    restartClass(battleBox(), 'zg-launch-impact', 620);
    setCommentary(`${body.side === 'player' ? '你的' : '對手的'}陀螺觸發殘餘轉速，突然二次加速！`);

    return true;
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
      reason = '你的陀螺力竭倒下。';
    }

    if (e.hp <= 0 || e.spinRatio <= 0.025) {
      winner = p;
      loser = e;
      reason = '對手陀螺力竭倒下。';
    }

    if (!winner && elapsed > PHY.battleLimit) {
      const pScore = p.hp + p.spinRatio * 60;
      const eScore = e.hp + e.spinRatio * 60;

      if (pScore >= eScore) {
        winner = p;
        loser = e;
        reason = '時間終了，你的剩餘轉速較高。';
      } else {
        winner = e;
        loser = p;
        reason = '時間終了，對手剩餘轉速較高。';
      }
    }

    if (!winner) return false;

    b.ended = true;
    loser.dead = true;

    playKillcam(loser, winner);

    setTimeout(() => {
      endBattle(winner.side === 'player', reason);
    }, 1050);

    return true;
  }

  function playKillcam(loser, winner) {
    if (state.killcamPlayed) return;
    state.killcamPlayed = true;

    restartClass(battleBox(), 'zg-killcam', 1150);
    metalSparks(loser.x, loser.y, 28, 1.5);
    afterimage(loser.x, loser.y, 120);
    Sound.metal(1.8, 1.25);

    if (winner?.el) winner.el.classList.add('win-pulse');

    setTimeout(() => Sound.death(), 420);
    setCommentary('決勝一擊！勝負即將揭曉！');
  }

  function battleLoop(t) {
    if (!state.running || state.paused || !state.battle) return;

    const dtRaw = state.lastFrame ? (t - state.lastFrame) / 16.666 : 1;
    const dt = clamp(dtRaw, 0.35, 2.2);
    state.lastFrame = t;

    const b = state.battle;
    const p = b.player;
    const e = b.enemy;

    seek(p, e, dt);

    applyFriction(p, dt);
    applyFriction(e, dt);

    move(p, dt);
    move(e, dt);

    boundary(p, b.arena);
    boundary(e, b.arena);

    collide(p, e);

    syncBody(p);
    syncBody(e);

    updateBattleFeel();
    updateHpBars();

    if (checkEnd()) return;

    state.raf = requestAnimationFrame(battleLoop);
  }

  /*
   * =========================================================
   * Battle start / stop / result
   * =========================================================
   */

  function clearBattleObjects() {
    const box = battleBox();

    $$('.zg-battle-top', box).forEach(el => el.remove());
    $$('.zg-spark', box).forEach(el => el.remove());
    $$('.zg-impact-ring', box).forEach(el => el.remove());
    $$('.zg-metal-spark', box).forEach(el => el.remove());
    $$('.zg-scratch', box).forEach(el => el.remove());
    $$('.zg-launch-shockwave', box).forEach(el => el.remove());
    $$('.zg-spin-afterimage', box).forEach(el => el.remove());
    $$('.zg-impact-streak', box).forEach(el => el.remove());

    const danger = $('.zg-danger-vignette', box);
    if (danger) danger.classList.remove('active');
  }

  function startBattle() {
    Sound.resume();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    ensureBasicDom();
    injectVisualEnhancements();

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = pickEnemyTop();

    state.running = true;
    state.paused = false;
    state.lastFrame = 0;
    state.firstCollision = false;
    state.killcamPlayed = false;

    showScreen('battle');
    clearBattleObjects();

    const arena = getArenaInfo();

    const player = createBody(state.selectedTop, 'player', arena);
    const enemy = createBody(state.enemyTop, 'enemy', arena);

    player.el = createTopElement(player.top, 'player');
    enemy.el = createTopElement(enemy.top, 'enemy');

    state.battle = {
      arena,
      player,
      enemy,
      startedAt: now(),
      ended: false
    };

    syncBody(player);
    syncBody(enemy);
    updateHpBars();
    setCommentary('拉繩準備中……');

    playLaunchSequence();

    setTimeout(() => {
      state.lastFrame = 0;
      state.raf = requestAnimationFrame(battleLoop);
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
    clearBattleObjects();
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

    const rank = $('#zg-result-rank') || $('.zg-rank');
    const title = $('#zg-result-title') || $('.zg-result-title');
    const subtitle = $('#zg-result-subtitle');
    const score = $('#zg-result-score');

    if (rank) rank.textContent = playerWon ? 'W' : 'L';
    if (title) title.textContent = playerWon ? '勝利！陀螺稱霸競技場' : '敗北…轉速耗盡';
    if (subtitle) subtitle.textContent = reason || '';
    if (score) {
      score.innerHTML = `${newScore} <span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span>`;
    }

    renderFriendRank();
  }

  /*
   * =========================================================
   * Friend rank
   * =========================================================
   */

  function loadFriends() {
    const saved = safeParse(localStorage.getItem(STORAGE.friends), null);

    if (Array.isArray(saved) && saved.length) return saved;

    const list = [
      { id: 'me', name: '你', score: getMyScore(), wins: 8, losses: 5, todayDelta: 0 },
      { id: 'kai', name: 'Kai', score: 1820, wins: 36, losses: 12, todayDelta: 45 },
      { id: 'mina', name: 'Mina', score: 1675, wins: 28, losses: 18, todayDelta: -12 },
      { id: 'leo', name: 'Leo', score: 1510, wins: 21, losses: 17, todayDelta: 18 },
      { id: 'rin', name: 'Rin', score: 1385, wins: 19, losses: 21, todayDelta: -4 }
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

  function renderFriendRank() {
    const box =
      $('#zg-friend-rank-list') ||
      $('#friend-leaderboard') ||
      $('#zg-friend-leaderboard') ||
      $('.zg-friend-leaderboard') ||
      $('.friend-leaderboard');

    if (!box) return;

    const myScore = getMyScore();

    const rows = loadFriends()
      .map(item => {
        const total = Number(item.wins || 0) + Number(item.losses || 0);
        const winRate = total ? Math.round(Number(item.wins || 0) / total * 100) : 0;

        return {
          ...item,
          winRate,
          scoreDiff: Number(item.score || 0) - myScore
        };
      })
      .sort((a, b) => {
        if (Number(b.score || 0) !== Number(a.score || 0)) {
          return Number(b.score || 0) - Number(a.score || 0);
        }

        return Number(b.winRate || 0) - Number(a.winRate || 0);
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    if (!rows.length) {
      box.innerHTML = `<div class="zg-rank-empty">目前尚無好友排行資料</div>`;
      return;
    }

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
        <div class="zg-rank-item ${isMe ? 'me' : ''}">
          <div class="zg-rank-no">${row.rank}</div>
          <div class="zg-rank-name">
            ${row.name}${isMe ? '（你）' : ''}
            <div class="zg-rank-count">勝率 ${row.winRate}% · ${row.wins || 0}勝 ${row.losses || 0}敗 · ${diff}</div>
          </div>
          <div class="zg-rank-count">
            ${row.score || 0}
            <br>
            <span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  /*
   * =========================================================
   * Actions / Buttons
   * =========================================================
   */

  function getText(el) {
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
    const text = getText(el);
    const key = `${id} ${cls}`;

    if (
      key.includes('start') ||
      text.includes('開始遊戲') ||
      text === '開始'
    ) {
      return 'start';
    }

    if (
      key.includes('battle') ||
      key.includes('launch') ||
      text.includes('開始對戰') ||
      text.includes('發射') ||
      text.includes('對戰')
    ) {
      return 'battle';
    }

    if (
      key.includes('retry') ||
      key.includes('again') ||
      text.includes('再戰') ||
      text.includes('重玩') ||
      text.includes('再來')
    ) {
      return 'retry';
    }

    if (
      key.includes('select') ||
      key.includes('change') ||
      text.includes('更換') ||
      text.includes('選擇')
    ) {
      return 'select';
    }

    if (
      key.includes('home') ||
      key.includes('back') ||
      text.includes('首頁') ||
      text.includes('返回')
    ) {
      return 'home';
    }

    if (
      key.includes('share') ||
      text.includes('邀請') ||
      text.includes('分享')
    ) {
      return 'share';
    }

    return '';
  }

  function toast(message) {
    let el = $('.zg-toast');

    if (!el) {
      el = document.createElement('div');
      el.className = 'zg-toast';
      appRoot().appendChild(el);
    }

    el.textContent = message;
    el.style.display = 'block';

    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.display = 'none';
    }, 1800);
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

    if (action === 'select') {
      stopBattle();
      showScreen('select');
      return;
    }

    if (action === 'home') {
      stopBattle();
      showScreen('start');
      return;
    }

    if (action === 'share') {
      toast('邀請功能已準備，可接 LINE 分享或 Shopify 優惠碼流程');
    }
  }

  function bindEvents() {
    document.addEventListener('click', e => {
      const card = e.target.closest('.zg-top-card[data-id], .zg-top-card[data-top-id]');
      if (card) {
        e.preventDefault();
        const id = card.getAttribute('data-id') || card.getAttribute('data-top-id');
        selectTop(id);
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
        state.battle.arena = getArenaInfo();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        Sound.stopHum();
      } else if (state.screen === 'battle' && state.battle && !state.battle.ended) {
        state.paused = false;

        Sound.startHum(0, getFeel(state.battle.player.top).humBase);
        Sound.startHum(1, getFeel(state.battle.enemy.top).humBase);

        state.lastFrame = 0;
        state.raf = requestAnimationFrame(battleLoop);
      }
    });
  }

  /*
   * =========================================================
   * Init
   * =========================================================
   */

  function init() {
    ensureAppHeight();
    ensureBasicDom();

    state.selectedTop = loadSelectedTop();

    injectVisualEnhancements();
    renderTopSelection();
    renderFriendRank();
    bindEvents();

    showScreen('start');

    window.ZeloGame = {
      version: VERSION,
      state,
      startBattle,
      stopBattle,
      showScreen,
      selectTop,
      renderTopSelection,
      renderFriendRank,
      sound: Sound
    };

    window.ZGGame = window.ZeloGame;

    console.info(`[ZeloGame] Loaded game.js v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
