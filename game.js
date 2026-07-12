/*
 * Zero Gravity Beyblade Battle Game
 * game.js Complete Replacement
 * Version: 202607121127
 *
 * Features:
 * - Visual enhancement injection
 * - Physical battle engine
 * - Launch impact
 * - Metal collision feedback
 * - Web Audio sound layer
 * - Spin hum
 * - Sparks / shield / orbital lights / scratches
 * - Wobble / danger vignette / comeback burst / killcam
 * - Result action layout helper
 * - Friend leaderboard with score comparison
 */

(() => {
  'use strict';

  const VERSION = '202607121127';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const now = () => performance.now();

  const STORAGE_KEYS = {
    selectedTop: 'zg_selected_top',
    myScore: 'zg_my_score',
    friendLeaderboard: 'zg_friend_leaderboard'
  };

  const DEFAULT_TOPS = [
    {
      id: 'phoenix',
      name: '烈焰鳳凰',
      type: 'attack',
      power: 92,
      defense: 58,
      stamina: 64,
      speed: 94,
      colorA: '#ff3b1f',
      colorB: '#ffd166',
      emoji: '🔥'
    },
    {
      id: 'aegis',
      name: '鋼鐵神盾',
      type: 'defense',
      power: 66,
      defense: 96,
      stamina: 78,
      speed: 52,
      colorA: '#79d7ff',
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

  const ZG_TOP_FEEL = {
    attack: {
      label: '攻擊型',
      launchKick: 1.18,
      sparkMul: 1.55,
      hitSharpness: 1.35,
      stability: 0.78,
      friction: 1.08,
      wobbleLate: 0.18,
      humBase: 155,
      humGain: 1.35
    },
    defense: {
      label: '防禦型',
      launchKick: 0.88,
      sparkMul: 0.82,
      hitSharpness: 0.72,
      stability: 1.42,
      friction: 0.84,
      wobbleLate: 0.08,
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
      wobbleLate: 0.14,
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
      wobbleLate: 0.26,
      humBase: 118,
      humGain: 0.72
    }
  };

  const PHY = {
    radius: 34,
    ringPadding: 42,
    initialSpeed: 7.2,
    maxSpeed: 11.5,
    minSpeed: 0.03,
    friction: 0.993,
    spinDecay: 0.9988,
    wallRestitution: 0.82,
    hitRestitution: 0.98,
    hitDamageBase: 2.6,
    seekForceMax: 0.045,
    tangentForce: 0.036,
    arenaW: 620,
    arenaH: 420,
    battleDurationLimit: 65000
  };

  const state = {
    screen: 'home',
    tops: DEFAULT_TOPS,
    selectedTop: null,
    enemyTop: null,
    battle: null,
    raf: null,
    lastTime: 0,
    running: false,
    paused: false,
    killcamPlayed: false,
    firstCollisionPlayed: false
  };

  function getTopFeel(top) {
    const type = top?.type || top?.category || top?.class || 'balance';
    return ZG_TOP_FEEL[type] || ZG_TOP_FEEL.balance;
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function saveSelectedTop(top) {
    if (!top) return;
    localStorage.setItem(STORAGE_KEYS.selectedTop, JSON.stringify(top));
  }

  function loadSelectedTop() {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.selectedTop), null);
    if (saved && saved.id) return saved;
    return DEFAULT_TOPS[0];
  }

  function getMyScore() {
    return Number(localStorage.getItem(STORAGE_KEYS.myScore) || 1200);
  }

  function setMyScore(score) {
    localStorage.setItem(STORAGE_KEYS.myScore, String(Math.max(0, Math.round(score))));
  }

  /*
   * -------------------------------------------------------
   * Web Audio Battle Sound Engine
   * -------------------------------------------------------
   */

  const ZGSound = (() => {
    let ctx = null;
    let master = null;
    let humA = null;
    let humB = null;

    function ensure() {
      if (ctx) return ctx;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;

      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.36;
      master.connect(ctx.destination);
      return ctx;
    }

    function resume() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    }

    function noiseBurst(duration = 0.08, gain = 0.25, filterFreq = 2800) {
      const c = ensure();
      if (!c || !master) return;

      const length = Math.max(1, Math.floor(c.sampleRate * duration));
      const buffer = c.createBuffer(1, length, c.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
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

    function launch() {
      resume();
      tone(82, 0.28, 0.48, 'sine', 42);
      tone(190, 0.12, 0.22, 'triangle', 110);
      noiseBurst(0.11, 0.18, 1600);
    }

    function metalHit(power = 1, sharpness = 1) {
      resume();
      const p = clamp(power, 0.25, 2.2);
      tone(820 * sharpness, 0.08, 0.18 * p, 'square', 260 * sharpness);
      tone(2600 * sharpness, 0.045, 0.08 * p, 'sawtooth', 900);
      noiseBurst(0.07, 0.28 * p, 3600 * sharpness);
    }

    function heavyHit(power = 1) {
      resume();
      const p = clamp(power, 0.25, 2.2);
      tone(140, 0.18, 0.3 * p, 'triangle', 70);
      noiseBurst(0.09, 0.2 * p, 900);
    }

    function railHit(power = 1) {
      resume();
      const p = clamp(power, 0.25, 2);
      tone(420, 0.12, 0.18 * p, 'triangle', 180);
      noiseBurst(0.08, 0.23 * p, 2100);
    }

    function grind(power = 1) {
      resume();
      noiseBurst(0.16, 0.14 * power, 1200);
      tone(110, 0.16, 0.08 * power, 'sawtooth', 80);
    }

    function deathWhine() {
      resume();
      tone(180, 0.75, 0.24, 'sawtooth', 38);
      noiseBurst(0.42, 0.12, 700);
    }

    function createHum(base = 120) {
      const c = ensure();
      if (!c || !master) return null;

      const osc = c.createOscillator();
      const g = c.createGain();
      const filter = c.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = base;
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      g.gain.value = 0.001;

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);
      osc.start();

      return { osc, gain: g, filter };
    }

    function startHum(index, base) {
      resume();
      const hum = createHum(base);
      if (index === 0) humA = hum;
      else humB = hum;
    }

    function updateHum(index, spinRatio, base = 120, gainMul = 1) {
      const c = ensure();
      if (!c) return;

      const hum = index === 0 ? humA : humB;
      if (!hum) return;

      const t = c.currentTime;
      const ratio = clamp(spinRatio, 0, 1);

      hum.osc.frequency.setTargetAtTime(base + ratio * 180, t, 0.05);
      hum.filter.frequency.setTargetAtTime(360 + ratio * 900, t, 0.06);
      hum.gain.gain.setTargetAtTime((0.012 + ratio * 0.043) * gainMul, t, 0.08);
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
      metalHit,
      heavyHit,
      railHit,
      grind,
      deathWhine,
      startHum,
      updateHum,
      stopHum
    };
  })();

  /*
   * -------------------------------------------------------
   * DOM Screen Helpers
   * -------------------------------------------------------
   */

  function showScreen(name) {
    state.screen = name;

    const candidates = [
      '#screen-home',
      '#screen-select',
      '#screen-battle',
      '#screen-result',
      '#screen-leaderboard'
    ];

    candidates.forEach(sel => {
      const el = $(sel);
      if (!el) return;

      const key = sel.replace('#screen-', '');
      const active = key === name;

      el.classList.toggle('active', active);
      el.hidden = !active;
      el.style.display = active ? '' : 'none';
    });

    document.body.setAttribute('data-zg-screen', name);
  }

  function getBattleBox() {
    return $('#zg-battle-box') || $('#screen-battle') || document.body;
  }

  function getArenaRing() {
    return $('#zg-arena-ring') || $('.zg-arena-ring') || getBattleBox();
  }

  function restartClass(el, cls, duration = 500) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), duration);
  }

  function battleCamera(cls, duration) {
    restartClass(getBattleBox(), cls, duration);
  }

  /*
   * -------------------------------------------------------
   * Visual Enhancement Injection
   * -------------------------------------------------------
   */

  function injectVisualEnhancements() {
    injectEnergyGrid();
    injectHomeStardust();
    injectTopCardEffects();
    ensureDangerVignette();
    ensureResultActionClass();
    removeDuplicateFlashOverlay();
  }

  function injectEnergyGrid() {
    if ($('.zg-energy-grid')) return;

    const grid = document.createElement('div');
    grid.className = 'zg-energy-grid';
    grid.setAttribute('aria-hidden', 'true');
    document.body.prepend(grid);
  }

  function injectHomeStardust() {
    const home = $('#screen-home') || $('.screen-home') || document.body;
    if ($('.zg-stardust-layer', home)) return;

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

  function injectTopCardEffects() {
    const cards = $$('.zg-top-card, .top-card, [data-top-id]');
    cards.forEach(card => {
      if ($('.zg-card-orbit', card)) return;

      const orbit = document.createElement('div');
      orbit.className = 'zg-card-orbit';
      orbit.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < 3; i++) {
        const dot = document.createElement('i');
        dot.style.animationDelay = `${i * -0.7}s`;
        orbit.appendChild(dot);
      }

      const shield = document.createElement('div');
      shield.className = 'zg-card-shield';
      shield.setAttribute('aria-hidden', 'true');

      card.appendChild(orbit);
      card.appendChild(shield);
    });
  }

  function removeDuplicateFlashOverlay() {
    const overlays = $$('.zg-flash-overlay');
    if (overlays.length <= 1) return;
    overlays.slice(1).forEach(el => el.remove());
  }

  function ensureResultActionClass() {
    const possible = [
      $('#result-actions'),
      $('.result-actions'),
      $('.end-actions'),
      $('.zg-result-actions')
    ].filter(Boolean);

    possible.forEach(el => el.classList.add('zg-result-actions'));
  }

  /*
   * -------------------------------------------------------
   * Battle Visual Effects
   * -------------------------------------------------------
   */

  function ensureDangerVignette() {
    const box = getBattleBox();
    if (!box) return null;

    let v = $('.zg-danger-vignette', box);
    if (!v) {
      v = document.createElement('div');
      v.className = 'zg-danger-vignette';
      box.appendChild(v);
    }
    return v;
  }

  function ensureFlashOverlay() {
    const box = getBattleBox();
    let flash = $('.zg-flash-overlay', box);

    if (!flash) {
      flash = document.createElement('div');
      flash.className = 'zg-flash-overlay';
      box.appendChild(flash);
    }

    return flash;
  }

  function flash(power = 1) {
    const f = ensureFlashOverlay();
    f.style.opacity = String(clamp(0.25 * power, 0.15, 0.8));
    restartClass(f, 'active', 180);
    setTimeout(() => {
      f.style.opacity = '';
    }, 200);
  }

  function spawnLaunchShockwave(x, y) {
    const box = getBattleBox();
    if (!box) return;

    const wave = document.createElement('div');
    wave.className = 'zg-launch-shockwave';
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    box.appendChild(wave);

    setTimeout(() => wave.remove(), 760);
  }

  function spawnAfterimage(x, y, size = 88) {
    const box = getBattleBox();
    if (!box) return;

    const img = document.createElement('div');
    img.className = 'zg-spin-afterimage';
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    box.appendChild(img);

    setTimeout(() => img.remove(), 680);
  }

  function spawnMetalSparks(x, y, count = 16, intensity = 1) {
    const box = getBattleBox();
    if (!box) return;

    const realCount = Math.round(count * clamp(intensity, 0.3, 2.4));

    for (let i = 0; i < realCount; i++) {
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

  function spawnScratch(x, y, vx, vy, wobble = false) {
    const box = getBattleBox();
    if (!box) return;

    const scratch = document.createElement('i');
    scratch.className = `zg-scratch ${wobble ? 'wobble' : ''}`;
    scratch.style.left = `${x}px`;
    scratch.style.top = `${y}px`;

    if (!wobble) {
      const angle = Math.atan2(vy, vx) * 180 / Math.PI;
      scratch.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    } else {
      scratch.style.transform = 'translate(-50%, -50%)';
    }

    box.appendChild(scratch);
    setTimeout(() => scratch.remove(), wobble ? 1250 : 950);
  }

  function setTopWobble(el, active) {
    if (!el) return;
    el.classList.toggle('zg-top-wobble', !!active);
  }

  function groundGrind(el, active) {
    if (!el) return;
    el.classList.toggle('zg-ground-grind', !!active);
  }

  /*
   * -------------------------------------------------------
   * Top Selection
   * -------------------------------------------------------
   */

  function renderTopSelection() {
    const list =
      $('#zg-top-list') ||
      $('#top-list') ||
      $('.zg-top-list') ||
      $('.top-list');

    if (!list) return;

    list.innerHTML = state.tops.map(top => {
      const feel = getTopFeel(top);

      return `
        <button class="zg-top-card top-card" data-top-id="${top.id}" type="button">
          <div class="zg-top-visual" style="--c1:${top.colorA};--c2:${top.colorB};">
            <span>${top.emoji || '🌀'}</span>
          </div>
          <div class="zg-top-info">
            <strong>${top.name}</strong>
            <em>${feel.label}</em>
            <div class="zg-stat-row"><span>攻擊</span><b>${top.power}</b></div>
            <div class="zg-stat-row"><span>防禦</span><b>${top.defense}</b></div>
            <div class="zg-stat-row"><span>耐久</span><b>${top.stamina}</b></div>
            <div class="zg-stat-row"><span>速度</span><b>${top.speed}</b></div>
          </div>
        </button>
      `;
    }).join('');

    injectTopCardEffects();

    $$('.zg-top-card, .top-card', list).forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-top-id');
        const top = state.tops.find(t => t.id === id) || state.tops[0];

        state.selectedTop = top;
        saveSelectedTop(top);

        $$('.zg-top-card, .top-card', list).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        updateSelectedTopPanel(top);
      });
    });

    const selected = state.selectedTop || loadSelectedTop();
    const selectedCard = $(`[data-top-id="${selected.id}"]`, list);
    if (selectedCard) selectedCard.click();
  }

  function updateSelectedTopPanel(top) {
    const box = $('#zg-selected-top') || $('#selected-top') || $('.zg-selected-top');
    if (!box || !top) return;

    const feel = getTopFeel(top);

    box.innerHTML = `
      <div class="zg-selected-card">
        <div class="zg-selected-icon" style="--c1:${top.colorA};--c2:${top.colorB};">
          ${top.emoji || '🌀'}
        </div>
        <div>
          <h3>${top.name}</h3>
          <p>${feel.label} · 攻擊 ${top.power} · 防禦 ${top.defense} · 耐久 ${top.stamina}</p>
        </div>
      </div>
    `;
  }

  function pickEnemyTop() {
    const pool = state.tops.filter(t => t.id !== state.selectedTop?.id);
    return pool[Math.floor(Math.random() * pool.length)] || state.tops[1] || state.tops[0];
  }

  /*
   * -------------------------------------------------------
   * Battle Body Creation
   * -------------------------------------------------------
   */

  function createTopElement(top, side) {
    const box = getBattleBox();

    const el = document.createElement('div');
    el.className = `zg-battle-top zg-top-${side} ${top.type || 'balance'}`;
    el.setAttribute('data-side', side);
    el.setAttribute('data-top-id', top.id);
    el.style.setProperty('--c1', top.colorA || '#7df9ff');
    el.style.setProperty('--c2', top.colorB || '#9b5cff');
    el.innerHTML = `
      <div class="zg-battle-top-core">
        <span>${top.emoji || '🌀'}</span>
      </div>
      <i class="zg-top-trail"></i>
    `;

    box.appendChild(el);
    return el;
  }

  function createBody(top, side, arena) {
    const feel = getTopFeel(top);
    const w = arena.w;
    const h = arena.h;

    const startX = side === 'player' ? w * 0.27 : w * 0.73;
    const startY = side === 'player' ? h * 0.54 : h * 0.46;

    const launchAngle = side === 'player' ? rand(-0.55, 0.45) : Math.PI + rand(-0.45, 0.55);
    const baseSpeed = PHY.initialSpeed * feel.launchKick * (0.85 + (top.speed || 70) / 220);

    const maxHp = 100 + (top.defense || 70) * 0.28 + (top.stamina || 70) * 0.2;

    const body = {
      top,
      side,
      el: null,
      x: startX,
      y: startY,
      vx: Math.cos(launchAngle) * baseSpeed,
      vy: Math.sin(launchAngle) * baseSpeed,
      radius: PHY.radius,
      mass: feel.stability,
      hp: maxHp,
      maxHp,
      spin: 1,
      spinRatio: 1,
      angle: 0,
      angularSpeed: 26 + (top.speed || 70) * 0.16,
      damageMul: top.type === 'attack' ? 1.18 : 1,
      damageTakenMul: top.type === 'defense' ? 0.82 : 1,
      spinDecayMul: top.type === 'stamina' ? 0.72 : 1,
      frictionMul: feel.friction,
      restitutionMul: top.type === 'defense' ? 0.72 : top.type === 'attack' ? 1.08 : 1,
      _lastRailHit: 0,
      _comebackUsed: false,
      _dead: false
    };

    return body;
  }

  function getArenaRectInfo() {
    const box = getBattleBox();
    const rect = box.getBoundingClientRect();

    const w = rect.width || PHY.arenaW;
    const h = rect.height || PHY.arenaH;

    return {
      w,
      h,
      cx: w / 2,
      cy: h / 2,
      rx: Math.max(80, w / 2 - PHY.ringPadding),
      ry: Math.max(80, h / 2 - PHY.ringPadding)
    };
  }

  /*
   * -------------------------------------------------------
   * Battle UI
   * -------------------------------------------------------
   */

  function updateBattleLabels() {
    const p = state.battle?.player;
    const e = state.battle?.enemy;

    const playerName = $('#zg-player-name') || $('#player-name') || $('.zg-player-name');
    const enemyName = $('#zg-enemy-name') || $('#enemy-name') || $('.zg-enemy-name');

    if (playerName && p) playerName.textContent = p.top.name;
    if (enemyName && e) enemyName.textContent = e.top.name;
  }

  function updateHpBars() {
    const battle = state.battle;
    if (!battle) return;

    const pRatio = clamp(battle.player.hp / battle.player.maxHp, 0, 1);
    const eRatio = clamp(battle.enemy.hp / battle.enemy.maxHp, 0, 1);

    const playerBar =
      $('#zg-player-hp') ||
      $('#player-hp') ||
      $('.zg-player-hp .bar') ||
      $('.player-hp .bar');

    const enemyBar =
      $('#zg-enemy-hp') ||
      $('#enemy-hp') ||
      $('.zg-enemy-hp .bar') ||
      $('.enemy-hp .bar');

    if (playerBar) {
      playerBar.style.width = `${pRatio * 100}%`;
      playerBar.classList.toggle('zg-low-spin-warning', pRatio < 0.22);
    }

    if (enemyBar) {
      enemyBar.style.width = `${eRatio * 100}%`;
      enemyBar.classList.toggle('zg-low-spin-warning', eRatio < 0.22);
    }

    const playerText = $('#zg-player-hp-text') || $('.zg-player-hp-text');
    const enemyText = $('#zg-enemy-hp-text') || $('.zg-enemy-hp-text');

    if (playerText) playerText.textContent = `${Math.ceil(pRatio * 100)}%`;
    if (enemyText) enemyText.textContent = `${Math.ceil(eRatio * 100)}%`;
  }

  function syncBodyElement(body) {
    if (!body || !body.el) return;

    body.angle += body.angularSpeed * body.spinRatio;
    body.el.style.left = `${body.x}px`;
    body.el.style.top = `${body.y}px`;
    body.el.style.transform = `translate(-50%, -50%) rotate(${body.angle}deg)`;

    const scale = 0.92 + body.spinRatio * 0.12;
    body.el.style.setProperty('--spin-scale', scale);
    body.el.style.opacity = body._dead ? '0.35' : '1';
  }

  /*
   * -------------------------------------------------------
   * Battle Feel Events
   * -------------------------------------------------------
   */

  function playLaunchSequence() {
    const battle = state.battle;
    if (!battle) return;

    ZGSound.resume();
    ZGSound.launch();

    battleCamera('zg-launch-impact', 700);

    spawnLaunchShockwave(battle.player.x, battle.player.y);
    spawnAfterimage(battle.player.x, battle.player.y, 96);

    spawnLaunchShockwave(battle.enemy.x, battle.enemy.y);
    spawnAfterimage(battle.enemy.x, battle.enemy.y, 96);

    const feelA = getTopFeel(battle.player.top);
    const feelB = getTopFeel(battle.enemy.top);

    ZGSound.startHum(0, feelA.humBase);
    ZGSound.startHum(1, feelB.humBase);
  }

  function updateBattleFeel() {
    const battle = state.battle;
    if (!battle) return;

    const a = battle.player;
    const b = battle.enemy;

    const feelA = getTopFeel(a.top);
    const feelB = getTopFeel(b.top);

    ZGSound.updateHum(0, a.spinRatio, feelA.humBase, feelA.humGain);
    ZGSound.updateHum(1, b.spinRatio, feelB.humBase, feelB.humGain);

    const lowA = a.spinRatio < 0.22;
    const lowB = b.spinRatio < 0.22;

    setTopWobble(a.el, lowA);
    setTopWobble(b.el, lowB);

    const danger = ensureDangerVignette();
    if (danger) danger.classList.toggle('active', lowA || lowB);

    if (Math.random() < 0.2) {
      const speedA = Math.hypot(a.vx, a.vy);
      const speedB = Math.hypot(b.vx, b.vy);

      if (speedA > 1.2) spawnScratch(a.x, a.y, a.vx, a.vy, lowA);
      if (speedB > 1.2) spawnScratch(b.x, b.y, b.vx, b.vy, lowB);
    }

    tryComebackBurst(a);
    tryComebackBurst(b);
  }

  function onTopCollision(a, b, hitX, hitY) {
    const feelA = getTopFeel(a.top);
    const feelB = getTopFeel(b.top);

    const rvx = a.vx - b.vx;
    const rvy = a.vy - b.vy;
    const relSpeed = Math.hypot(rvx, rvy);

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const approach = Math.abs(rvx * nx + rvy * ny);
    const tangent = Math.abs(rvx * -ny + rvy * nx);

    const power = clamp(relSpeed / 8, 0.35, 2.2);
    const avgSharp = (feelA.hitSharpness + feelB.hitSharpness) / 2;
    const sparkIntensity = Math.max(feelA.sparkMul, feelB.sparkMul) * power;

    if (approach > tangent * 1.15) {
      ZGSound.metalHit(power, avgSharp);
      spawnMetalSparks(hitX, hitY, 20, sparkIntensity);
      battleCamera('zg-collision-zoom', 280);
      flash(power);

      if (!state.firstCollisionPlayed) {
        state.firstCollisionPlayed = true;
        battleCamera('zg-killcam', 900);
      }
    } else {
      ZGSound.metalHit(power * 0.85, avgSharp * 1.15);
      spawnMetalSparks(hitX, hitY, 12, sparkIntensity * 0.82);
      battleCamera('punch', 220);

      const sideForce = 0.7 * power;
      a.vx += -ny * sideForce;
      a.vy += nx * sideForce;
      b.vx -= -ny * sideForce;
      b.vy -= nx * sideForce;
    }

    if (Math.abs(a.spinRatio - b.spinRatio) > 0.24 && relSpeed > 4) {
      const grinder = a.spinRatio > b.spinRatio ? b : a;
      groundGrind(grinder.el, true);
      setTimeout(() => groundGrind(grinder.el, false), 260);
      ZGSound.grind(power);
    }
  }

  function onRailCollision(body, power = 1) {
    const t = now();
    if (t - body._lastRailHit < 160) return;
    body._lastRailHit = t;

    ZGSound.railHit(power);
    battleCamera('punch', 180);
    spawnMetalSparks(body.x, body.y, 8, 0.7 * power);
  }

  function tryComebackBurst(body) {
    if (!body || body._comebackUsed || body._dead) return false;

    const hpRatio = body.hp / body.maxHp;
    const spinRatio = body.spinRatio;

    if (spinRatio > 0.2 || hpRatio > 0.32) return false;

    let chance = 0.08;
    if (body.top.type === 'stamina') chance = 0.18;
    if (body.top.type === 'balance') chance = 0.12;
    if (body.top.type === 'attack') chance = 0.09;
    if (body.top.type === 'defense') chance = 0.06;

    if (Math.random() > chance) return false;

    body._comebackUsed = true;

    const feel = getTopFeel(body.top);
    const angle = Math.random() * Math.PI * 2;
    const burst = 4.5 * feel.launchKick;

    body.vx += Math.cos(angle) * burst;
    body.vy += Math.sin(angle) * burst;
    body.spinRatio = Math.min(0.42, body.spinRatio + 0.18);
    body.hp = Math.min(body.maxHp * 0.38, body.hp + body.maxHp * 0.08);

    ZGSound.launch();
    battleCamera('zg-launch-impact', 620);
    spawnLaunchShockwave(body.x, body.y);
    spawnAfterimage(body.x, body.y, 104);
    spawnMetalSparks(body.x, body.y, 18, 1.1);

    if (body.el) body.el.classList.remove('zg-top-wobble');

    return true;
  }

  function playKillcam(loser, winner) {
    if (state.killcamPlayed) return;
    state.killcamPlayed = true;

    battleCamera('zg-killcam', 1150);

    const hitX = loser?.x || 0;
    const hitY = loser?.y || 0;

    spawnMetalSparks(hitX, hitY, 28, 1.5);
    spawnAfterimage(hitX, hitY, 120);
    ZGSound.metalHit(1.8, 1.25);

    setTimeout(() => ZGSound.deathWhine(), 420);
  }

  /*
   * -------------------------------------------------------
   * Battle Physics
   * -------------------------------------------------------
   */

  function applySeekForces(a, b, dt) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const orbit = Math.sin(now() * 0.0015) > 0 ? 1 : -1;

    const forceA = PHY.seekForceMax * (0.6 + a.spinRatio * 0.7);
    const forceB = PHY.seekForceMax * (0.6 + b.spinRatio * 0.7);

    a.vx += (nx * forceA + -ny * PHY.tangentForce * orbit) * dt;
    a.vy += (ny * forceA + nx * PHY.tangentForce * orbit) * dt;

    b.vx += (-nx * forceB + ny * PHY.tangentForce * orbit) * dt;
    b.vy += (-ny * forceB + -nx * PHY.tangentForce * orbit) * dt;
  }

  function applyFrictionAndSpin(body, dt) {
    const f = Math.pow(PHY.friction, dt * body.frictionMul);
    body.vx *= f;
    body.vy *= f;

    const decay = Math.pow(PHY.spinDecay, dt * body.spinDecayMul);
    body.spin *= decay;

    const speed = Math.hypot(body.vx, body.vy);
    const hpRatio = clamp(body.hp / body.maxHp, 0, 1);

    body.spinRatio = clamp((body.spin * 0.62 + hpRatio * 0.38), 0, 1);

    if (speed < PHY.minSpeed) {
      body.vx += rand(-0.018, 0.018);
      body.vy += rand(-0.018, 0.018);
    }

    if (body.spinRatio < 0.24) {
      const wobble = (0.24 - body.spinRatio) * 0.15;
      body.vx += rand(-wobble, wobble);
      body.vy += rand(-wobble, wobble);
    }

    const maxSpeed = PHY.maxSpeed * (0.8 + (body.top.speed || 70) / 260);
    const v = Math.hypot(body.vx, body.vy);

    if (v > maxSpeed) {
      body.vx = body.vx / v * maxSpeed;
      body.vy = body.vy / v * maxSpeed;
    }
  }

  function applyMovement(body, dt) {
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }

  function resolveArenaBoundary(body, arena) {
    const px = body.x - arena.cx;
    const py = body.y - arena.cy;

    const nxRaw = px / arena.rx;
    const nyRaw = py / arena.ry;

    const e = nxRaw * nxRaw + nyRaw * nyRaw;
    const limit = 1 - body.radius / Math.min(arena.rx, arena.ry);

    if (e <= limit * limit) return;

    const angle = Math.atan2(py / arena.ry, px / arena.rx);
    const bx = arena.cx + Math.cos(angle) * arena.rx * limit;
    const by = arena.cy + Math.sin(angle) * arena.ry * limit;

    const nx = Math.cos(angle);
    const ny = Math.sin(angle);

    body.x = bx;
    body.y = by;

    const vn = body.vx * nx + body.vy * ny;

    if (vn > 0) {
      body.vx -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * nx;
      body.vy -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * ny;

      const power = clamp(Math.abs(vn) / 7, 0.3, 2);
      body.hp -= power * 1.2 * body.damageTakenMul;
      body.spin *= 1 - 0.015 * power;

      onRailCollision(body, power);
    }
  }

  function resolveTopCollision(a, b) {
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
    const velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal > 0) return;

    const restitution = PHY.hitRestitution;
    const impulseMag = -(1 + restitution) * velAlongNormal / (1 / a.mass + 1 / b.mass);

    const ix = impulseMag * nx;
    const iy = impulseMag * ny;

    a.vx -= ix / a.mass;
    a.vy -= iy / a.mass;
    b.vx += ix / b.mass;
    b.vy += iy / b.mass;

    const relSpeed = Math.hypot(rvx, rvy);
    const hitPower = clamp(relSpeed / 7, 0.25, 2.5);

    const damageToA =
      PHY.hitDamageBase *
      hitPower *
      b.damageMul *
      a.damageTakenMul *
      (0.7 + (b.top.power || 70) / 150);

    const damageToB =
      PHY.hitDamageBase *
      hitPower *
      a.damageMul *
      b.damageTakenMul *
      (0.7 + (a.top.power || 70) / 150);

    a.hp -= damageToA;
    b.hp -= damageToB;

    a.spin *= 1 - 0.018 * hitPower;
    b.spin *= 1 - 0.018 * hitPower;

    const hitX = (a.x + b.x) / 2;
    const hitY = (a.y + b.y) / 2;

    onTopCollision(a, b, hitX, hitY);
  }

  function checkBattleEnd() {
    const battle = state.battle;
    if (!battle || battle.ended) return false;

    const p = battle.player;
    const e = battle.enemy;

    const elapsed = now() - battle.startedAt;

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

    if (!winner && elapsed > PHY.battleDurationLimit) {
      if (p.hp + p.spinRatio * 60 >= e.hp + e.spinRatio * 60) {
        winner = p;
        loser = e;
        reason = '時間終了，剩餘轉速較高';
      } else {
        winner = e;
        loser = p;
        reason = '時間終了，對手剩餘轉速較高';
      }
    }

    if (!winner) return false;

    battle.ended = true;
    loser._dead = true;

    playKillcam(loser, winner);

    setTimeout(() => {
      endBattle(winner.side === 'player', reason, winner, loser);
    }, 1050);

    return true;
  }

  function battleLoop(t) {
    if (!state.running || state.paused || !state.battle) return;

    const battle = state.battle;
    const dtRaw = state.lastTime ? (t - state.lastTime) / 16.666 : 1;
    const dt = clamp(dtRaw, 0.35, 2.2);
    state.lastTime = t;

    const a = battle.player;
    const b = battle.enemy;
    const arena = battle.arena;

    applySeekForces(a, b, dt);
    applyFrictionAndSpin(a, dt);
    applyFrictionAndSpin(b, dt);

    applyMovement(a, dt);
    applyMovement(b, dt);

    resolveArenaBoundary(a, arena);
    resolveArenaBoundary(b, arena);

    resolveTopCollision(a, b);

    syncBodyElement(a);
    syncBodyElement(b);

    updateBattleFeel();
    updateHpBars();

    if (checkBattleEnd()) return;

    state.raf = requestAnimationFrame(battleLoop);
  }

  /*
   * -------------------------------------------------------
   * Battle Start / End
   * -------------------------------------------------------
   */

  function clearBattleDom() {
    const box = getBattleBox();

    $$('.zg-battle-top', box).forEach(el => el.remove());
    $$('.zg-metal-spark', box).forEach(el => el.remove());
    $$('.zg-scratch', box).forEach(el => el.remove());
    $$('.zg-launch-shockwave', box).forEach(el => el.remove());
    $$('.zg-spin-afterimage', box).forEach(el => el.remove());

    const danger = $('.zg-danger-vignette', box);
    if (danger) danger.classList.remove('active');
  }

  function startBattle() {
    ZGSound.resume();

    if (state.raf) cancelAnimationFrame(state.raf);

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = pickEnemyTop();
    state.killcamPlayed = false;
    state.firstCollisionPlayed = false;
    state.running = true;
    state.paused = false;
    state.lastTime = 0;

    showScreen('battle');
    clearBattleDom();
    injectVisualEnhancements();

    const arena = getArenaRectInfo();

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

    updateBattleLabels();
    updateHpBars();

    syncBodyElement(player);
    syncBodyElement(enemy);

    playLaunchSequence();

    setTimeout(() => {
      state.lastTime = 0;
      state.raf = requestAnimationFrame(battleLoop);
    }, 520);
  }

  function endBattle(playerWon, reason, winner, loser) {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    ZGSound.stopHum();

    const oldScore = getMyScore();
    const scoreDelta = playerWon ? 28 + Math.round(Math.random() * 18) : -(12 + Math.round(Math.random() * 12));
    const newScore = Math.max(0, oldScore + scoreDelta);
    setMyScore(newScore);

    showScreen('result');
    ensureResultActionClass();

    const title = $('#zg-result-title') || $('#result-title') || $('.zg-result-title');
    const sub = $('#zg-result-subtitle') || $('#result-subtitle') || $('.zg-result-subtitle');
    const score = $('#zg-result-score') || $('#result-score') || $('.zg-result-score');

    if (title) title.textContent = playerWon ? '勝利！陀螺稱霸競技場' : '敗北…轉速耗盡';
    if (sub) sub.textContent = reason || (playerWon ? '你的陀螺撐到了最後。' : '對手取得了最後優勢。');
    if (score) {
      score.innerHTML = `
        <strong>${newScore}</strong>
        <span class="${scoreDelta >= 0 ? 'up' : 'down'}">${scoreDelta >= 0 ? '+' : ''}${scoreDelta}</span>
      `;
    }

    updateFriendLeaderboardAfterBattle(playerWon, newScore);
    renderFriendLeaderboard(loadFriendLeaderboard(), 'me', newScore);
  }

  /*
   * -------------------------------------------------------
   * Friend Leaderboard
   * -------------------------------------------------------
   */

  function loadFriendLeaderboard() {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.friendLeaderboard), null);

    if (Array.isArray(saved) && saved.length) return saved;

    const defaults = [
      {
        id: 'me',
        name: '你',
        avatar: '',
        score: getMyScore(),
        wins: 8,
        losses: 5,
        todayDelta: 0
      },
      {
        id: 'u001',
        name: 'Kai',
        avatar: '',
        score: 1820,
        wins: 36,
        losses: 12,
        todayDelta: 45
      },
      {
        id: 'u002',
        name: 'Mina',
        avatar: '',
        score: 1675,
        wins: 28,
        losses: 18,
        todayDelta: -12
      },
      {
        id: 'u003',
        name: 'Leo',
        avatar: '',
        score: 1510,
        wins: 21,
        losses: 17,
        todayDelta: 18
      },
      {
        id: 'u004',
        name: 'Rin',
        avatar: '',
        score: 1385,
        wins: 19,
        losses: 21,
        todayDelta: -4
      }
    ];

    localStorage.setItem(STORAGE_KEYS.friendLeaderboard, JSON.stringify(defaults));
    return defaults;
  }

  function saveFriendLeaderboard(list) {
    localStorage.setItem(STORAGE_KEYS.friendLeaderboard, JSON.stringify(list));
  }

  function updateFriendLeaderboardAfterBattle(playerWon, myScore) {
    const list = loadFriendLeaderboard();
    const me = list.find(x => x.id === 'me');

    if (me) {
      const old = Number(me.score || 0);
      me.score = myScore;
      me.todayDelta = myScore - old;
      if (playerWon) me.wins = Number(me.wins || 0) + 1;
      else me.losses = Number(me.losses || 0) + 1;
    }

    saveFriendLeaderboard(list);
  }

  function normalizeFriendLeaderboard(list, myScore) {
    return [...list]
      .map(item => {
        const total = Number(item.wins || 0) + Number(item.losses || 0);
        const winRate = total > 0 ? Math.round(Number(item.wins || 0) / total * 100) : 0;

        return {
          ...item,
          winRate,
          scoreDiff: Number(item.score || 0) - Number(myScore || 0)
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
  }

  function renderFriendLeaderboard(list = loadFriendLeaderboard(), myUserId = 'me', myScore = getMyScore()) {
    const box =
      $('#friend-leaderboard') ||
      $('.friend-leaderboard') ||
      $('#zg-friend-leaderboard') ||
      $('.zg-friend-leaderboard');

    if (!box) return;

    box.classList.add('zg-friend-leaderboard');

    const rows = normalizeFriendLeaderboard(list, myScore);

    box.innerHTML = rows.map(row => {
      const isMe = row.id === myUserId;
      const diffText =
        row.scoreDiff === 0
          ? '同分'
          : row.scoreDiff > 0
            ? `領先你 ${row.scoreDiff}`
            : `落後你 ${Math.abs(row.scoreDiff)}`;

      const delta = Number(row.todayDelta || 0);
      const deltaText = delta > 0 ? `+${delta}` : `${delta}`;

      return `
        <div class="zg-friend-rank-row ${isMe ? 'is-me' : ''}">
          <div class="zg-friend-rank-no">#${row.rank}</div>

          <div class="zg-friend-avatar">
            ${row.avatar ? `<img src="${row.avatar}" alt="">` : `<span>${String(row.name || '?').slice(0, 1)}</span>`}
          </div>

          <div class="zg-friend-main">
            <div class="zg-friend-name">${row.name || '未知玩家'} ${isMe ? '<em>你</em>' : ''}</div>
            <div class="zg-friend-sub">
              勝率 ${row.winRate}% · ${row.wins || 0}勝 ${row.losses || 0}敗
            </div>
          </div>

          <div class="zg-friend-score">
            <strong>${row.score || 0}</strong>
            <span class="${delta >= 0 ? 'up' : 'down'}">${deltaText}</span>
          </div>

          <div class="zg-friend-diff">${diffText}</div>
        </div>
      `;
    }).join('');
  }

  /*
   * -------------------------------------------------------
   * Buttons / Events
   * -------------------------------------------------------
   */

  function bindButtons() {
    const bindings = [
      ['#btn-start', () => { ZGSound.resume(); showScreen('select'); }],
      ['#zg-btn-start', () => { ZGSound.resume(); showScreen('select'); }],
      ['#btn-select-start', () => startBattle()],
      ['#zg-btn-select-start', () => startBattle()],
      ['#btn-battle-start', () => startBattle()],
      ['#zg-btn-battle-start', () => startBattle()],
      ['#btn-retry', () => startBattle()],
      ['#zg-btn-retry', () => startBattle()],
      ['#btn-home', () => { stopBattleSilently(); showScreen('home'); }],
      ['#zg-btn-home', () => { stopBattleSilently(); showScreen('home'); }],
      ['#btn-select', () => { stopBattleSilently(); showScreen('select'); }],
      ['#zg-btn-select', () => { stopBattleSilently(); showScreen('select'); }],
      ['#btn-leaderboard', () => { renderFriendLeaderboard(); showScreen('leaderboard'); }],
      ['#zg-btn-leaderboard', () => { renderFriendLeaderboard(); showScreen('leaderboard'); }]
    ];

    bindings.forEach(([sel, fn]) => {
      const el = $(sel);
      if (el && !el.__zgBound) {
        el.__zgBound = true;
        el.addEventListener('click', fn);
      }
    });

    $$('[data-zg-action]').forEach(btn => {
      if (btn.__zgBound) return;
      btn.__zgBound = true;

      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-zg-action');

        ZGSound.resume();

        if (action === 'start') showScreen('select');
        if (action === 'battle') startBattle();
        if (action === 'retry') startBattle();
        if (action === 'home') {
          stopBattleSilently();
          showScreen('home');
        }
        if (action === 'select') {
          stopBattleSilently();
          showScreen('select');
        }
        if (action === 'leaderboard') {
          renderFriendLeaderboard();
          showScreen('leaderboard');
        }
      });
    });
  }

  function stopBattleSilently() {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    ZGSound.stopHum();
    clearBattleDom();
  }

  /*
   * -------------------------------------------------------
   * Auto HTML Fallback
   * -------------------------------------------------------
   * If the current page has no required containers,
   * this creates a minimal playable structure.
   */

  function ensureFallbackHtml() {
    if ($('#screen-home') && $('#screen-select') && $('#screen-battle') && $('#screen-result')) {
      return;
    }

    const app = $('#zg-app') || $('#app') || document.body;

    if ($('#screen-home')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'zg-auto-app';
    wrapper.innerHTML = `
      <section id="screen-home" class="zg-screen active">
        <div class="zg-panel">
          <h1>ZERO GRAVITY 陀螺競技場</h1>
          <p>發射、碰撞、逆轉，成為最後仍在旋轉的陀螺。</p>
          <button id="zg-btn-start" type="button">開始遊戲</button>
        </div>
      </section>

      <section id="screen-select" class="zg-screen" hidden>
        <div class="zg-panel">
          <h2>選擇你的陀螺</h2>
          <div id="zg-top-list" class="zg-top-list"></div>
          <div id="zg-selected-top"></div>
          <button id="zg-btn-select-start" type="button">發射！開始對戰</button>
          <button id="zg-btn-home" type="button">返回首頁</button>
        </div>
      </section>

      <section id="screen-battle" class="zg-screen" hidden>
        <div class="zg-battle-hud">
          <div>
            <strong id="zg-player-name">Player</strong>
            <div class="zg-hp-wrap"><div id="zg-player-hp" class="zg-hp-bar"></div></div>
            <span id="zg-player-hp-text">100%</span>
          </div>
          <div>
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
          <div id="result-actions" class="zg-result-actions">
            <button id="zg-btn-retry" type="button">再戰一次</button>
            <button id="zg-btn-select" type="button">更換陀螺</button>
            <button id="zg-btn-leaderboard" type="button">好友排行榜</button>
          </div>
          <div id="friend-leaderboard" class="zg-friend-leaderboard"></div>
        </div>
      </section>

      <section id="screen-leaderboard" class="zg-screen" hidden>
        <div class="zg-panel">
          <h2>好友排行榜</h2>
          <div id="zg-friend-leaderboard" class="zg-friend-leaderboard"></div>
          <button data-zg-action="home" type="button">返回首頁</button>
        </div>
      </section>
    `;

    app.appendChild(wrapper);
  }

  /*
   * -------------------------------------------------------
   * Public Debug API
   * -------------------------------------------------------
   */

  window.ZGGame = {
    version: VERSION,
    startBattle,
    stopBattle: stopBattleSilently,
    showScreen,
    renderFriendLeaderboard,
    getState: () => state,
    sound: ZGSound
  };

  /*
   * -------------------------------------------------------
   * Init
   * -------------------------------------------------------
   */

  function init() {
    ensureFallbackHtml();

    state.selectedTop = loadSelectedTop();

    injectVisualEnhancements();
    renderTopSelection();
    bindButtons();
    renderFriendLeaderboard();

    showScreen('home');

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        ZGSound.stopHum();
      } else if (state.screen === 'battle' && state.battle && !state.battle.ended) {
        state.paused = false;

        const feelA = getTopFeel(state.battle.player.top);
        const feelB = getTopFeel(state.battle.enemy.top);

        ZGSound.startHum(0, feelA.humBase);
        ZGSound.startHum(1, feelB.humBase);

        state.lastTime = 0;
        state.raf = requestAnimationFrame(battleLoop);
      }
    });

    window.addEventListener('resize', () => {
      if (!state.battle) return;
      state.battle.arena = getArenaRectInfo();
    });

    console.info(`[ZGGame] Loaded game.js v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
