/*
 * ZELO GAME JS
 * Complete Replacement
 * Version: 202607121611
 *
 * Rules:
 * - ONLY top-to-top collision reduces HP
 * - Wall rebound does NOT reduce HP
 * - HP bar represents HP only
 * - When HP reaches 0, that top stops spinning and loses
 *
 * Fixes:
 * - Top no longer escapes arena
 * - Share button now uses native share / clipboard fallback
 * - Result screen now shows battle coupon reward
 * - Coupon reward can be downloaded as PNG
 * - Coupon code can be copied
 * - Coupon card no longer shows score text
 * - Result pill forced to REWARD
 *
 * Coupon odds:
 * - 500: 2%
 * - 250: 28%
 * - 100: 50%
 * - none: 30%
 */

(() => {
  'use strict';

  const VERSION = '202607121611';

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

    initialSpeed: 8.6,
    maxSpeed: 16.8,

    friction: 0.992,
    spinDecay: 0.996,

    wallRestitution: 1.05,
    hitRestitution: 1.12,

    hitDamageBase: 4.95,

    seekForceMax: 0.054,
    tangentForce: 0.039,

    battleLimit: 8000,
    minMotion: 0.76,

    spinLossOnHit: 0.033,
    railSpinLoss: 0.034
  };

  const FINISH = {
    spin: { label: 'Spin Finish', points: 1 },
    over: { label: 'Over Finish', points: 2 },
    burst: { label: 'Burst Finish', points: 2 },
    xtreme: { label: 'Xtreme Finish', points: 3 }
  };

  const COUPON_REWARDS = [
    {
      id: 'coupon500',
      label: '500 元折扣券',
      amount: 500,
      codePrefix: 'ZELO500',
      rate: 0.02
    },
    {
      id: 'coupon250',
      label: '250 元折扣券',
      amount: 250,
      codePrefix: 'ZELO250',
      rate: 0.28
    },
    {
      id: 'coupon100',
      label: '100 元折扣券',
      amount: 100,
      codePrefix: 'ZELO100',
      rate: 0.50
    },
    {
      id: 'none',
      label: '再接再厲',
      amount: 0,
      codePrefix: '',
      rate: 0.30
    }
  ];

  function makeCouponCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tail = '';

    for (let i = 0; i < 6; i++) {
      tail += chars[Math.floor(Math.random() * chars.length)];
    }

    return `${prefix}-${tail}`;
  }

  function drawCouponReward() {
    const r = Math.random();
    let acc = 0;

    for (const item of COUPON_REWARDS) {
      acc += item.rate;

      if (r <= acc) {
        return {
          ...item,
          code: item.amount > 0 ? makeCouponCode(item.codePrefix) : ''
        };
      }
    }

    return {
      ...COUPON_REWARDS[COUPON_REWARDS.length - 1],
      code: ''
    };
  }

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
      launchKick: 1.24,
      sparkMul: 1.75,
      hitSharpness: 1.42,
      stability: 0.78,
      friction: 1.08,
      humBase: 155,
      humGain: 1.38
    },
    defense: {
      label: '防禦型',
      launchKick: 0.9,
      sparkMul: 0.9,
      hitSharpness: 0.76,
      stability: 1.48,
      friction: 0.84,
      humBase: 92,
      humGain: 0.88
    },
    stamina: {
      label: '耐久型',
      launchKick: 0.94,
      sparkMul: 0.8,
      hitSharpness: 0.92,
      stability: 1.24,
      friction: 0.68,
      humBase: 118,
      humGain: 0.74
    },
    balance: {
      label: '平衡型',
      launchKick: 1.04,
      sparkMul: 1.05,
      hitSharpness: 1.05,
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
    killcamPlayed: false,

    finishing: false,
    finishStartedAt: 0,
    pendingResult: null,

    centerDuelStarted: false,
    centerDuelStartedAt: 0,
    centerDuelResolved: false,

    charging: false,
    launchPower: 0,
    chargeDir: 1,
    chargeRaf: null,

    lastCouponReward: null
  };

  /*
   * =========================================================
   * Performance control
   * =========================================================
   */

  const PERF = {
    lowFx: false,
    lastFxAt: 0,
    lastScratchAt: 0,
    lastAfterimageAt: 0,
    lastShockwaveAt: 0,
    activeFx: 0,
    maxFx: 46,
    maxSparksPerHit: 12,
    minFxGap: 34,
    minScratchGap: 90,
    minAfterimageGap: 120,
    minShockwaveGap: 180,
    frameSlowCount: 0
  };

  function canFx(gap = PERF.minFxGap) {
    const t = now();

    if (PERF.lowFx && PERF.activeFx > 30) return false;
    if (PERF.activeFx > PERF.maxFx) return false;
    if (t - PERF.lastFxAt < gap) return false;

    PERF.lastFxAt = t;
    return true;
  }

  function fxAdd() {
    PERF.activeFx++;
  }

  function fxRemove() {
    PERF.activeFx = Math.max(0, PERF.activeFx - 1);
  }

  function updatePerf(dtRaw) {
    if (dtRaw > 1.45) PERF.frameSlowCount++;
    else PERF.frameSlowCount = Math.max(0, PERF.frameSlowCount - 1);

    PERF.lowFx = PERF.frameSlowCount > 12;
  }

  function fxCount(base, intensity = 1) {
    const mul = PERF.lowFx ? 0.42 : 1;
    return Math.max(2, Math.round(base * intensity * mul));
  }

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

    function chargeTick(power = 0.5) {
      resume();

      const p = clamp(power, 0, 1);

      if (Math.random() < 0.18) {
        tone(110 + p * 220, 0.035, 0.035 + p * 0.035, 'triangle', 80 + p * 180);
      }
    }

    function chargePerfect() {
      resume();
      tone(880, 0.08, 0.13, 'triangle', 1320);
      tone(1760, 0.06, 0.08, 'sine', 880);
    }

    function metal(power = 1, sharpness = 1) {
      resume();
      const p = clamp(power, 0.25, 2.0);
      tone(820 * sharpness, 0.06, 0.14 * p, 'square', 260 * sharpness);
      tone(2400 * sharpness, 0.035, 0.055 * p, 'sawtooth', 900);
      noise(0.055, 0.18 * p, 3400 * sharpness);
    }

    function rail(power = 1) {
      resume();
      const p = clamp(power, 0.25, 1.8);
      tone(420, 0.1, 0.13 * p, 'triangle', 180);
      noise(0.06, 0.16 * p, 2100);
    }

    function grind(power = 1) {
      resume();
      noise(0.12, 0.1 * power, 1200);
      tone(110, 0.12, 0.06 * power, 'sawtooth', 80);
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
      h.gain.gain.setTargetAtTime((0.01 + r * 0.035) * gainMul, t, 0.08);
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
      chargeTick,
      chargePerfect,
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
   * DOM setup
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
          <div class="zg-pill">REWARD</div>
        </div>
        <main class="zg-main">
          <div class="zg-rank" id="zg-result-rank">W</div>
          <h2 class="zg-result-title" id="zg-result-title">勝利！</h2>
          <p class="zg-desc" id="zg-result-subtitle">你的陀螺撐到了最後。</p>

          <div class="zg-coupon" id="zg-result-coupon">
            <div class="zg-coupon-label" id="zg-coupon-label">戰鬥獎勵</div>
            <div class="zg-coupon-code" id="zg-result-score">準備抽獎</div>
            <div class="zg-coupon-note" id="zg-coupon-note">完成戰鬥即可獲得獎勵抽選</div>
            <button class="zg-coupon-download" id="zg-download-coupon" data-zg-action="download-coupon" type="button">
              下載折扣券
            </button>
          </div>

          <div class="zg-rankbox">
            <div class="zg-rankbox-title">好友排行榜</div>
            <div id="zg-friend-rank-list"></div>
          </div>
        </main>
        <div class="zg-bottom">
          <button class="zg-btn zg-btn-red" data-zg-action="retry" type="button">再戰一次</button>
          <button class="zg-btn zg-btn-gold" id="zg-copy-coupon" data-zg-action="copy-coupon" type="button">拷貝折扣券序號</button>
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

    if (!$('.zg-xtreme-zone', box)) {
      const xz = document.createElement('div');
      xz.className = 'zg-xtreme-zone';
      box.appendChild(xz);
    }

    if (!$('.zg-pocket-zone', box)) {
      ['p1', 'p2', 'p3', 'p4'].forEach(cls => {
        const p = document.createElement('div');
        p.className = `zg-pocket-zone ${cls}`;
        box.appendChild(p);
      });
    }

    ensureChargeDom();
  }
  /*
   * =========================================================
   * Charge launch
   * =========================================================
   */

  function ensureChargeDom() {
    const battle = screenBattle();
    if (!battle) return null;

    let layer = $('.zg-charge-layer', battle);

    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'zg-charge-layer';
      layer.hidden = true;
      layer.innerHTML = `
        <div class="zg-charge-card">
          <div class="zg-charge-top-preview">
            <span>🌀</span>
          </div>

          <div class="zg-charge-rope"></div>

          <div class="zg-charge-title">拉繩蓄力</div>
          <div class="zg-charge-subtitle">按住蓄力，放開發射！</div>

          <div class="zg-charge-meter">
            <div class="zg-charge-zone weak"></div>
            <div class="zg-charge-zone good"></div>
            <div class="zg-charge-zone perfect"></div>
            <div class="zg-charge-fill"></div>
            <div class="zg-charge-marker"></div>
          </div>

          <button class="zg-charge-btn" type="button">
            按住蓄力
          </button>

          <div class="zg-charge-tip">
            越接近黃金區，初速與轉速越高。
          </div>
        </div>
      `;

      battle.appendChild(layer);
    }

    return layer;
  }

  function showChargeLayer(show) {
    const layer = ensureChargeDom();
    if (!layer) return;

    const top = state.selectedTop || loadSelectedTop();
    const preview = $('.zg-charge-top-preview', layer);
    const icon = $('.zg-charge-top-preview span', layer);

    if (preview && top) {
      preview.style.setProperty('--c1', top.colorA);
      preview.style.setProperty('--c2', top.colorB);
    }

    if (icon && top) {
      icon.textContent = top.emoji || '🌀';
    }

    layer.classList.toggle('active', !!show);
    layer.hidden = !show;
  }

  function setChargePower(value) {
    state.launchPower = clamp(value, 0, 1);

    const layer = $('.zg-charge-layer');
    if (!layer) return;

    const fill = $('.zg-charge-fill', layer);
    const marker = $('.zg-charge-marker', layer);
    const btn = $('.zg-charge-btn', layer);

    if (fill) fill.style.width = `${state.launchPower * 100}%`;
    if (marker) marker.style.left = `${state.launchPower * 100}%`;

    const perfect = state.launchPower >= 0.78 && state.launchPower <= 0.92;
    const good = state.launchPower >= 0.6 && state.launchPower < 0.78;

    layer.classList.toggle('perfect', perfect);
    layer.classList.toggle('good', good);

    if (btn) {
      if (perfect) btn.textContent = 'PERFECT！放開發射！';
      else if (good) btn.textContent = '很好！放開發射！';
      else btn.textContent = state.charging ? '蓄力中…放開發射' : '按住蓄力';
    }
  }

  function cancelChargeLoop() {
    state.charging = false;

    if (state.chargeRaf) {
      cancelAnimationFrame(state.chargeRaf);
      state.chargeRaf = null;
    }
  }

  function resetBattleFlowState() {
    state.lastFrame = 0;
    state.firstCollision = false;
    state.killcamPlayed = false;
    state.finishing = false;
    state.finishStartedAt = 0;
    state.pendingResult = null;
    state.centerDuelStarted = false;
    state.centerDuelStartedAt = 0;
    state.centerDuelResolved = false;

    PERF.lowFx = false;
    PERF.lastFxAt = 0;
    PERF.lastScratchAt = 0;
    PERF.lastAfterimageAt = 0;
    PERF.lastShockwaveAt = 0;
    PERF.activeFx = 0;
    PERF.frameSlowCount = 0;
  }

  function beginChargeBattle() {
    Sound.resume();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    cancelChargeLoop();

    ensureBasicDom();
    injectVisualEnhancements();
    ensureChargeDom();

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = pickEnemyTop();

    state.battle = null;
    state.running = false;
    state.paused = false;
    resetBattleFlowState();

    state.launchPower = 0;
    state.chargeDir = 1;

    showScreen('battle');
    clearBattleObjects();
    updateHpBars();
    setCommentary('準備拉繩，按住按鈕蓄力！');

    showChargeLayer(true);
    setChargePower(0);
  }

  function startCharging() {
    if (state.charging) return;

    Sound.resume();

    state.charging = true;
    state.chargeDir = 1;

    const loop = () => {
      if (!state.charging) return;

      const speed = 0.018;
      let next = state.launchPower + speed * state.chargeDir;

      if (next >= 1) {
        next = 1;
        state.chargeDir = -1;
      }

      if (next <= 0) {
        next = 0;
        state.chargeDir = 1;
      }

      const wasPerfect = state.launchPower >= 0.78 && state.launchPower <= 0.92;
      const isPerfect = next >= 0.78 && next <= 0.92;

      setChargePower(next);
      Sound.chargeTick(next);

      if (!wasPerfect && isPerfect) {
        Sound.chargePerfect();
      }

      state.chargeRaf = requestAnimationFrame(loop);
    };

    state.chargeRaf = requestAnimationFrame(loop);
  }

  function releaseCharging() {
    if (!state.charging) return;

    const p = state.launchPower;

    cancelChargeLoop();
    showChargeLayer(false);

    startBattleWithPower(p);
  }

  /*
   * =========================================================
   * Visual injection
   * =========================================================
   */

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
            ${top.type === 'balance' ? '<i class="zg-balance-ring"></i><i class="zg-balance-star"></i><i class="zg-balance-star"></i>' : ''}
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
      card.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function pickEnemyTop() {
    const pool = TOPS.filter(t => t.id !== state.selectedTop?.id);
    return pool[Math.floor(Math.random() * pool.length)] || TOPS[1] || TOPS[0];
  }

  /*
   * =========================================================
   * Battle visual effects - optimized
   * =========================================================
   */

  function flash() {
    const f = $('.zg-flash-overlay', battleBox());
    if (!f) return;
    restartClass(f, 'hit', PERF.lowFx ? 140 : 200);
  }

  function spark(x, y) {
    if (!canFx(45)) return;

    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-spark active';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 300 : 420);
  }

  function impactRing(x, y) {
    if (!canFx(PERF.lowFx ? 120 : 60)) return;

    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-impact-ring active';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 320 : 460);
  }

  function metalSparks(x, y, count = 14, intensity = 1) {
    if (!canFx(28)) return;

    const box = battleBox();
    const safeIntensity = clamp(intensity, 0.45, PERF.lowFx ? 1.25 : 2.1);
    const cappedBase = Math.min(count, PERF.lowFx ? 8 : PERF.maxSparksPerHit);
    const n = fxCount(cappedBase, safeIntensity);

    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');

      s.className = `zg-metal-spark ${safeIntensity > 1.2 ? 'intense' : ''}`;
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty('--r', `${Math.random() * 360}deg`);
      s.style.setProperty('--d', `${28 + Math.random() * 58 * safeIntensity}px`);

      fxAdd();
      box.appendChild(s);

      setTimeout(() => {
        s.remove();
        fxRemove();
      }, PERF.lowFx ? 360 : 480);
    }
  }

  function scratch(x, y, vx, vy, wobble = false) {
    const t = now();

    if (t - PERF.lastScratchAt < PERF.minScratchGap) return;
    if (PERF.lowFx && Math.random() < 0.65) return;

    PERF.lastScratchAt = t;

    const box = battleBox();
    const s = document.createElement('i');

    s.className = `zg-scratch ${wobble ? 'wobble' : ''}`;
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;

    if (!wobble) {
      const a = Math.atan2(vy, vx) * 180 / Math.PI;
      s.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;
    }

    fxAdd();
    box.appendChild(s);

    setTimeout(() => {
      s.remove();
      fxRemove();
    }, wobble ? 760 : 620);
  }

  function shockwave(x, y) {
    const t = now();

    if (t - PERF.lastShockwaveAt < PERF.minShockwaveGap) return;

    PERF.lastShockwaveAt = t;

    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-launch-shockwave';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 520 : 760);
  }

  function afterimage(x, y, size = 88) {
    const t = now();

    if (t - PERF.lastAfterimageAt < PERF.minAfterimageGap) return;
    if (PERF.lowFx && Math.random() < 0.55) return;

    PERF.lastAfterimageAt = t;

    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-spin-afterimage';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 420 : 680);
  }

  function impactStreak(body) {
    if (PERF.lowFx && Math.random() < 0.5) return;

    const speed = Math.hypot(body.vx, body.vy);

    if (speed < 4.2) return;
    if (!canFx(50)) return;

    const box = battleBox();
    const el = document.createElement('div');
    const angle = Math.atan2(body.vy, body.vx) * 180 / Math.PI;

    el.className = `zg-impact-streak ${body.side === 'player' ? 'zg-impact-blue' : 'zg-impact-red'}`;
    el.style.left = `${body.x}px`;
    el.style.top = `${body.y}px`;
    el.style.width = `${clamp(speed * 10, 38, 96)}px`;
    el.style.transform = `rotate(${angle + 180}deg)`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 300 : 460);
  }

  function burstPieces(x, y, count = 12) {
    if (PERF.lowFx) count = Math.min(count, 8);

    const box = battleBox();

    for (let i = 0; i < count; i++) {
      if (PERF.activeFx > PERF.maxFx) break;

      const p = document.createElement('i');

      p.className = 'zg-burst-piece';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 100;

      p.style.setProperty('--bx', `${Math.cos(a) * d}px`);
      p.style.setProperty('--by', `${Math.sin(a) * d}px`);
      p.style.setProperty('--br', `${Math.round(rand(180, 720))}deg`);

      fxAdd();
      box.appendChild(p);

      setTimeout(() => {
        p.remove();
        fxRemove();
      }, 680);
    }
  }

  function wallFlash(x, y, nx, ny, power = 1) {
    if (!canFx(80)) return;

    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-wall-flash';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const angle = Math.atan2(ny, nx) * 180 / Math.PI;

    el.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${clamp(power, 0.8, 1.6)})`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 300 : 420);
  }

  /*
   * =========================================================
   * Battle body
   * =========================================================
   */

  function getArenaInfo() {
    const box = battleBox();
    const rect = box.getBoundingClientRect();

    const w = Math.max(rect.width || 360, 320);
    const h = Math.max(rect.height || 420, 420);

    // 邊界要用陀螺半徑 + 安全距離，避免陀螺跑出競技場
    const safePad = PHY.radius + 8;
    const padX = Math.max(safePad, PHY.radius * 1.15);
    const padY = Math.max(safePad, PHY.radius * 1.15);

    return {
      w,
      h,
      cx: w / 2,
      cy: h / 2,

      left: padX,
      right: w - padX,
      top: padY,
      bottom: h - padY,

      xtremeX: w / 2,
      xtremeY: h / 2,
      xtremeR: Math.min(w, h) * 0.14
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

    const startX = side === 'player' ? arena.w * 0.25 : arena.w * 0.75;
    const startY = side === 'player' ? arena.h * 0.62 : arena.h * 0.38;

    const launchAngle = side === 'player'
      ? rand(-0.72, 0.12)
      : Math.PI + rand(-0.12, 0.72);

    const baseSpeed = PHY.initialSpeed * f.launchKick * (0.9 + top.speed / 220);
    const maxHp = 78 + top.defense * 0.19 + top.stamina * 0.19;

    return {
      top,
      side,
      el: null,
      x: clamp(startX, arena.left, arena.right),
      y: clamp(startY, arena.top, arena.bottom),
      vx: Math.cos(launchAngle) * baseSpeed,
      vy: Math.sin(launchAngle) * baseSpeed,
      radius: PHY.radius,
      mass: f.stability,
      hp: maxHp,
      maxHp,
      spin: 1,
      spinRatio: 1,
      angle: 0,
      angularSpeed: 32 + top.speed * 0.18,
      damageMul: top.type === 'attack' ? 1.22 : 1,
      damageTakenMul: top.type === 'defense' ? 0.76 : 1,
      spinDecayMul: top.type === 'stamina' ? 0.76 : 1,
      frictionMul: f.friction,
      restitutionMul: top.type === 'defense' ? 0.84 : top.type === 'attack' ? 1.16 : 1,
      lastRail: 0,
      comebackUsed: false,
      dead: false,
      burstGauge: 0,
      lastHitPower: 0,
      lastHitAt: 0,
      lastHitBy: null,
      finishType: ''
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
    body.el.classList.toggle('zg-top-wobble', body.spinRatio < 0.22 || body.hp <= 0);
  }

  function updateHpBars() {
    const b = state.battle;

    if (!b) {
      const pFill = $('#zg-player-hp') || $('.zg-player-hp .zg-hp-fill') || $('.zg-player-hp-fill');
      const eFill = $('#zg-enemy-hp') || $('.zg-enemy-hp .zg-hp-fill') || $('.zg-enemy-hp-fill');
      const pt = $('#zg-player-hp-text');
      const et = $('#zg-enemy-hp-text');

      if (pFill) pFill.style.width = '100%';
      if (eFill) eFill.style.width = '100%';
      if (pt) pt.textContent = '100%';
      if (et) et.textContent = '100%';

      return;
    }

    const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    const pFill = $('#zg-player-hp') || $('.zg-player-hp .zg-hp-fill') || $('.zg-player-hp-fill');
    const eFill = $('#zg-enemy-hp') || $('.zg-enemy-hp .zg-hp-fill') || $('.zg-enemy-hp-fill');

    if (pFill) {
      pFill.style.width = `${pr * 100}%`;
      pFill.classList.toggle('zg-low-spin-warning', pr < 0.26);
    }

    if (eFill) {
      eFill.style.width = `${er * 100}%`;
      eFill.classList.toggle('zg-low-spin-warning', er < 0.26);
    }

    const pt = $('#zg-player-hp-text');
    const et = $('#zg-enemy-hp-text');

    if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
    if (et) et.textContent = `${Math.ceil(er * 100)}%`;
  }

  /*
   * =========================================================
   * Battle launch / feel
   * =========================================================
   */

  function playLaunchSequence(power = 0.72) {
    const b = state.battle;
    if (!b) return;

    const perfect = power >= 0.78 && power <= 0.92;
    const good = power >= 0.6 && power < 0.78;
    const weak = power < 0.35;

    Sound.resume();
    Sound.launch();

    restartClass(battleBox(), perfect ? 'zg-killcam' : 'zg-launch-impact', perfect ? 850 : 700);

    shockwave(b.player.x, b.player.y);
    setTimeout(() => shockwave(b.enemy.x, b.enemy.y), 90);

    afterimage(b.player.x, b.player.y, perfect ? 120 : 92);
    afterimage(b.enemy.x, b.enemy.y, 92);

    if (perfect) {
      metalSparks(b.player.x, b.player.y, 14, 1.25);
      flash();
      setCommentary('完美發射！你的陀螺帶著爆發轉速衝入競技場！');
    } else if (good) {
      metalSparks(b.player.x, b.player.y, 10, 1.0);
      setCommentary('漂亮發射！初速與轉速都很穩定！');
    } else if (weak) {
      setCommentary('發射偏弱！但還有機會靠碰撞逆轉！');
    } else {
      setCommentary('發射！兩顆陀螺高速進場！');
    }

    Sound.startHum(0, getFeel(b.player.top).humBase);
    Sound.startHum(1, getFeel(b.enemy.top).humBase);
  }

  function updateBattleFeel() {
    const b = state.battle;
    if (!b) return;

    const p = b.player;
    const e = b.enemy;

    Sound.updateHum(0, p.spinRatio, getFeel(p.top).humBase, getFeel(p.top).humGain);
    Sound.updateHum(1, e.spinRatio, getFeel(e.top).humBase, getFeel(e.top).humGain);

    const danger = ensureDangerVignette();

    danger.classList.toggle(
      'active',
      p.hp / p.maxHp < 0.22 ||
      e.hp / e.maxHp < 0.22 ||
      p.spinRatio < 0.18 ||
      e.spinRatio < 0.18
    );

    if (!state.finishing && !state.centerDuelStarted && Math.random() < (PERF.lowFx ? 0.045 : 0.11)) {
      const ps = Math.hypot(p.vx, p.vy);
      const es = Math.hypot(e.vx, e.vy);

      if (ps > 1.6) scratch(p.x, p.y, p.vx, p.vy, p.spinRatio < 0.22);
      if (es > 1.6) scratch(e.x, e.y, e.vx, e.vy, e.spinRatio < 0.22);
    }

    if (!state.finishing && !state.centerDuelStarted) {
      tryComeback(p);
      tryComeback(e);
    }
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

    const elapsed = state.battle ? now() - state.battle.startedAt : 0;

    const tune = body => {
      if (body.top.type === 'attack') return 1.38;
      if (body.top.type === 'defense') return 0.82;
      if (body.top.type === 'stamina') return 0.9;
      return 1.08;
    };

    const lateMul = elapsed > PHY.battleLimit * 0.55 ? 1.28 : 1;
    const dangerMul = a.spinRatio < 0.35 || b.spinRatio < 0.35 ? 1.18 : 1;
    const distanceMul = d > 210 ? 1.68 : d > 130 ? 1.28 : d > 82 ? 0.92 : 0.38;

    const fa = PHY.seekForceMax * 1.32 * tune(a) * distanceMul * lateMul * dangerMul * (0.5 + a.spinRatio * 1.05);
    const fb = PHY.seekForceMax * 1.32 * tune(b) * distanceMul * lateMul * dangerMul * (0.5 + b.spinRatio * 1.05);

    const orbit = Math.sin(now() * 0.0028) > 0 ? 1 : -1;
    const ta = PHY.tangentForce * 1.05 * (0.45 + a.spinRatio * 0.75);
    const tb = PHY.tangentForce * 1.05 * (0.45 + b.spinRatio * 0.75);
    const closeMul = d < a.radius + b.radius + 30 ? 0.24 : 1;

    a.vx += (nx * fa * closeMul + -ny * ta * orbit) * dt;
    a.vy += (ny * fa * closeMul + nx * ta * orbit) * dt;

    b.vx += (-nx * fb * closeMul + ny * tb * orbit) * dt;
    b.vy += (-ny * fb * closeMul + -nx * tb * orbit) * dt;

    const speedA = Math.hypot(a.vx, a.vy);
    const speedB = Math.hypot(b.vx, b.vy);

    if (speedA < 3.0 && a.spinRatio > 0.25) {
      a.vx += nx * 0.1 * dt;
      a.vy += ny * 0.1 * dt;
    }

    if (speedB < 3.0 && b.spinRatio > 0.25) {
      b.vx -= nx * 0.1 * dt;
      b.vy -= ny * 0.1 * dt;
    }
  }

  function applyFriction(body, dt) {
    if (body.hp <= 0) {
      body.hp = 0;
      body.spin *= Math.pow(0.86, dt);
      body.spinRatio = clamp(body.spinRatio * Math.pow(0.82, dt), 0, 1);
      body.vx *= Math.pow(0.92, dt);
      body.vy *= Math.pow(0.92, dt);

      if (body.spinRatio < 0.04) {
        body.spinRatio = 0;
        body.spin = 0;
        body.vx = 0;
        body.vy = 0;
        body.dead = true;
      }

      return;
    }

    const speed = Math.hypot(body.vx, body.vy);

    const lowSpinDrag = body.spinRatio < 0.38
      ? 1 + (0.38 - body.spinRatio) * 2.05
      : 1;

    const f = Math.pow(PHY.friction, dt * body.frictionMul * lowSpinDrag);

    body.vx *= f;
    body.vy *= f;

    const decay = Math.pow(PHY.spinDecay, dt * body.spinDecayMul);
    body.spin *= decay;

    if (speed > 5.2) {
      body.spin *= 1 - clamp((speed - 5.2) * 0.0034 * dt, 0, 0.02);
    }

    const hpRatio = clamp(body.hp / body.maxHp, 0, 1);
    body.spinRatio = clamp(body.spin * 0.78 + hpRatio * 0.22, 0, 1);

    if (body.spinRatio < 0.28) {
      const wob = (0.28 - body.spinRatio) * 0.26;
      body.vx += rand(-wob, wob) * dt;
      body.vy += rand(-wob, wob) * dt;
    }

    const v = Math.hypot(body.vx, body.vy);

    if (v < PHY.minMotion && body.spinRatio > 0.08) {
      const a = Math.random() * Math.PI * 2;
      body.vx += Math.cos(a) * 0.12;
      body.vy += Math.sin(a) * 0.12;
    }

    const maxV = PHY.maxSpeed * (0.88 + body.top.speed / 255);
    const finalV = Math.hypot(body.vx, body.vy);

    if (finalV > maxV) {
      body.vx = body.vx / finalV * maxV;
      body.vy = body.vy / finalV * maxV;
    }
  }

  function move(body, dt) {
    body.x += body.vx * dt;
    body.y += body.vy * dt;
  }

  function boundary(body, arena) {
    let hit = false;
    let nx = 0;
    let ny = 0;

    if (body.x < arena.left) {
      body.x = arena.left;
      nx = 1;
      ny = 0;
      hit = true;
    } else if (body.x > arena.right) {
      body.x = arena.right;
      nx = -1;
      ny = 0;
      hit = true;
    }

    if (body.y < arena.top) {
      body.y = arena.top;
      nx = 0;
      ny = 1;
      hit = true;
    } else if (body.y > arena.bottom) {
      body.y = arena.bottom;
      nx = 0;
      ny = -1;
      hit = true;
    }

    if (!hit) return;

    const speedBefore = Math.hypot(body.vx, body.vy);
    const vn = body.vx * nx + body.vy * ny;
    const tangentV = body.vx * -ny + body.vy * nx;

    if (vn < 0) return;

    body.vx -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * nx;
    body.vy -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * ny;

    const power = clamp(Math.abs(vn) / 5.2, 0.35, 2.4);
    const reboundBoost = clamp(0.52 + power * 0.66, 0.52, 1.95);

    body.vx += nx * reboundBoost;
    body.vy += ny * reboundBoost;

    const sideKick = clamp(Math.abs(tangentV) * 0.065, 0.12, 0.72);
    const dir = Math.random() > 0.5 ? 1 : -1;

    body.vx += -ny * sideKick * dir;
    body.vy += nx * sideKick * dir;

    // 撞牆後推回場內，避免卡邊或視覺跑出框
    body.x += nx * 10;
    body.y += ny * 10;
    body.x = clamp(body.x, arena.left, arena.right);
    body.y = clamp(body.y, arena.top, arena.bottom);

    const maxReboundV = PHY.maxSpeed * (0.98 + body.top.speed / 240);
    const afterV = Math.hypot(body.vx, body.vy);

    if (afterV > maxReboundV) {
      body.vx = body.vx / afterV * maxReboundV;
      body.vy = body.vy / afterV * maxReboundV;
    }

    // 撞牆不扣血，只少量消耗轉速
    body.spin *= 1 - PHY.railSpinLoss * power * 0.42;

    const speedAfter = Math.hypot(body.vx, body.vy);
    const boosted = speedAfter > speedBefore * 1.08 || power > 1.12;
    const t = now();

    if (t - body.lastRail > 90) {
      body.lastRail = t;

      Sound.rail(power);
      restartClass(battleBox(), power > 1.08 ? 'big-shake' : 'shake', power > 1.08 ? 260 : 180);

      metalSparks(body.x, body.y, 8 + Math.round(power * 4), power * 0.85);
      scratch(body.x, body.y, body.vx, body.vy, power > 0.9);

      if (boosted) {
        afterimage(body.x, body.y, 92);
        impactRing(body.x, body.y);
        flash();
        restartClass(body.el, 'zg-wall-rebound-top', 220);
        restartClass(battleBox(), 'zg-wall-rebound-box', 260);
        wallFlash(body.x, body.y, nx, ny, power);
      }

      setCommentary(power > 1.25
        ? '壁面強力回彈！不扣血，但轉速被削弱！'
        : '撞牆回彈！不扣血，繼續追擊！'
      );
    }
  }
    function collide(a, b) {
    if (a.hp <= 0 || b.hp <= 0) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(0.001, Math.hypot(dx, dy));
    const minD = a.radius + b.radius;

    if (d >= minD) return;

    const nx = dx / d;
    const ny = dy / d;
    const overlap = minD - d;
    const totalMass = a.mass + b.mass;

    const separateBoost = 1.18;

    a.x -= nx * overlap * (b.mass / totalMass) * separateBoost;
    a.y -= ny * overlap * (b.mass / totalMass) * separateBoost;
    b.x += nx * overlap * (a.mass / totalMass) * separateBoost;
    b.y += ny * overlap * (a.mass / totalMass) * separateBoost;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const normalVel = rvx * nx + rvy * ny;
    const tangentVel = rvx * -ny + rvy * nx;

    if (normalVel > 0) {
      const push = 0.14 + overlap * 0.01;

      a.vx -= nx * push;
      a.vy -= ny * push;
      b.vx += nx * push;
      b.vy += ny * push;

      return;
    }

    const rel = Math.hypot(rvx, rvy);
    const frontalRatio = Math.abs(normalVel) / Math.max(0.001, rel);
    const sideRatio = Math.abs(tangentVel) / Math.max(0.001, rel);
    const power = clamp(rel / 5.3, 0.35, 2.85);

    const restitution =
      PHY.hitRestitution *
      (0.84 + frontalRatio * 0.45) *
      ((a.restitutionMul + b.restitutionMul) / 2);

    const impulse = -(1 + restitution) * normalVel / (1 / a.mass + 1 / b.mass);
    const ix = impulse * nx;
    const iy = impulse * ny;

    a.vx -= ix / a.mass;
    a.vy -= iy / a.mass;
    b.vx += ix / b.mass;
    b.vy += iy / b.mass;

    const sideFriction = clamp(sideRatio * 0.075, 0.01, 0.09);
    const tx = -ny;
    const ty = nx;

    a.vx += tx * tangentVel * sideFriction / a.mass;
    a.vy += ty * tangentVel * sideFriction / a.mass;
    b.vx -= tx * tangentVel * sideFriction / b.mass;
    b.vy -= ty * tangentVel * sideFriction / b.mass;

    const frontalDamageMul = 0.88 + frontalRatio * 1.08;
    const sideSpinMul = 0.72 + sideRatio * 0.88;

    const damageA =
      PHY.hitDamageBase *
      power *
      frontalDamageMul *
      b.damageMul *
      a.damageTakenMul *
      (0.7 + b.top.power / 145);

    const damageB =
      PHY.hitDamageBase *
      power *
      frontalDamageMul *
      a.damageMul *
      b.damageTakenMul *
      (0.7 + a.top.power / 145);

    const oldHpA = a.hp;
    const oldHpB = b.hp;

    // 只有陀螺對撞才扣 HP
    a.hp = Math.max(0, a.hp - damageA);
    b.hp = Math.max(0, b.hp - damageB);

    if (oldHpA > 0 && a.hp <= 0) {
      a.dead = true;
      a.finishType = 'spin';
      a.spin *= 0.35;
      a.spinRatio *= 0.35;
      a.lastHitBy = b;
      a.lastHitAt = now();
    }

    if (oldHpB > 0 && b.hp <= 0) {
      b.dead = true;
      b.finishType = 'spin';
      b.spin *= 0.35;
      b.spinRatio *= 0.35;
      b.lastHitBy = a;
      b.lastHitAt = now();
    }

    const spinLossA = PHY.spinLossOnHit * power * sideSpinMul * (1.08 / a.mass);
    const spinLossB = PHY.spinLossOnHit * power * sideSpinMul * (1.08 / b.mass);

    a.spin *= 1 - clamp(spinLossA, 0.012, 0.12);
    b.spin *= 1 - clamp(spinLossB, 0.012, 0.12);

    const burstGainA =
      power *
      frontalRatio *
      (b.top.type === 'attack' ? 1.38 : 1) *
      (a.top.type === 'defense' ? 0.72 : 1);

    const burstGainB =
      power *
      frontalRatio *
      (a.top.type === 'attack' ? 1.38 : 1) *
      (b.top.type === 'defense' ? 0.72 : 1);

    a.burstGauge += burstGainA;
    b.burstGauge += burstGainB;

    a.lastHitPower = power;
    b.lastHitPower = power;
    a.lastHitAt = now();
    b.lastHitAt = now();
    a.lastHitBy = b;
    b.lastHitBy = a;

    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;

    const burstKick = clamp(power * (0.76 + frontalRatio * 1.22), 0.28, 2.7);
    const sideKick = clamp(sideRatio * power * 0.58, 0, 1.18);

    a.vx -= nx * burstKick / a.mass;
    a.vy -= ny * burstKick / a.mass;
    b.vx += nx * burstKick / b.mass;
    b.vy += ny * burstKick / b.mass;

    a.vx += -ny * sideKick;
    a.vy += nx * sideKick;
    b.vx -= -ny * sideKick;
    b.vy -= nx * sideKick;

    if (power > 1.05) {
      const reboundEnergy = clamp(power * 0.28, 0.16, 0.62);

      a.vx -= nx * reboundEnergy / a.mass;
      a.vy -= ny * reboundEnergy / a.mass;
      b.vx += nx * reboundEnergy / b.mass;
      b.vy += ny * reboundEnergy / b.mass;

      a.spin *= 1 - clamp(power * 0.01, 0.01, 0.034);
      b.spin *= 1 - clamp(power * 0.01, 0.01, 0.034);

      afterimage(a.x, a.y, power > 1.45 ? 100 : 86);
      afterimage(b.x, b.y, power > 1.45 ? 100 : 86);
    }

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
    const frontal = approach > tangent * 0.86;

    const sharp = (fa.hitSharpness + fb.hitSharpness) / 2;
    const sparkMul = Math.max(fa.sparkMul, fb.sparkMul) * power;

    Sound.metal(power * 0.95, sharp);

    spark(x, y);
    impactRing(x, y);

    metalSparks(
      x,
      y,
      frontal ? 18 + Math.round(power * 5) : 12 + Math.round(power * 4),
      sparkMul * 0.85
    );

    flash();

    restartClass(a.el, 'impact-squash', 220);
    restartClass(b.el, 'impact-squash', 220);

    impactStreak(a);
    impactStreak(b);

    restartClass(battleBox(), 'zg-collision-zoom', power > 1.35 ? 320 : 240);
    restartClass(battleBox(), 'punch', 200);

    if (power > 0.92) restartClass(battleBox(), 'shake', 210);

    if (power > 1.25) {
      restartClass(battleBox(), 'big-shake', 300);
      afterimage(a.x, a.y, 92);
      afterimage(b.x, b.y, 92);
    }

    if (power > 1.65 && !PERF.lowFx) {
      restartClass(battleBox(), 'zg-killcam', 460);
      flash();
      shockwave(x, y);
      afterimage(a.x, a.y, 106);
      afterimage(b.x, b.y, 106);
      metalSparks(x, y, 22, 1.35);
    }

    if (frontal) {
      setCommentary(
        power > 1.55
          ? '爆裂級正面對撞！血條大幅削減！'
          : power > 1.18
            ? '高速正面衝擊！只有碰撞才會扣血！'
            : '正面碰撞！血條被削掉！'
      );

      if (!state.firstCollision) {
        state.firstCollision = true;
        restartClass(battleBox(), 'zg-killcam', PERF.lowFx ? 420 : 640);
      }
    } else {
      const sideForce = 0.36 * power;

      a.vx += -ny * sideForce;
      a.vy += nx * sideForce;
      b.vx -= -ny * sideForce;
      b.vy -= nx * sideForce;

      scratch(x, y, rvx, rvy, power > 1.0);

      setCommentary(
        power > 1.2
          ? '高速側切！擦撞削血，下一波衝撞馬上來了！'
          : '側面擦撞！改變軌道繼續追擊！'
      );
    }

    if (Math.abs(a.spinRatio - b.spinRatio) > 0.2 && relSpeed > 3.4) {
      const loser = a.spinRatio > b.spinRatio ? b : a;

      if (loser?.el) {
        loser.el.classList.add('zg-ground-grind');
        setTimeout(() => loser.el.classList.remove('zg-ground-grind'), 260);
      }

      Sound.grind(power);
      metalSparks(loser.x, loser.y, 8, 0.75);
      setCommentary('轉速壓制！弱勢陀螺被壓到擦地噴火！');
    }
  }

  function tryComeback(body) {
    if (!body || body.comebackUsed || body.dead || body.hp <= 0) return false;

    const hpRatio = body.hp / body.maxHp;
    const spinRatio = body.spinRatio;

    if (spinRatio > 0.2 || hpRatio > 0.32) return false;

    let chance = 0.035;

    if (body.top.type === 'stamina') chance = 0.09;
    if (body.top.type === 'balance') chance = 0.065;
    if (body.top.type === 'attack') chance = 0.055;
    if (body.top.type === 'defense') chance = 0.035;

    if (Math.random() > chance) return false;

    body.comebackUsed = true;

    const f = getFeel(body.top);
    const angle = Math.random() * Math.PI * 2;
    const burst = 4.4 * f.launchKick;

    body.vx += Math.cos(angle) * burst;
    body.vy += Math.sin(angle) * burst;
    body.spinRatio = Math.min(0.42, body.spinRatio + 0.16);
    body.spin = Math.min(0.6, body.spin + 0.16);
    body.hp = Math.min(body.maxHp * 0.34, body.hp + body.maxHp * 0.06);

    Sound.launch();
    shockwave(body.x, body.y);
    afterimage(body.x, body.y, 96);
    metalSparks(body.x, body.y, 10, 0.95);
    restartClass(battleBox(), 'zg-launch-impact', 420);
    setCommentary(`${body.side === 'player' ? '你的' : '對手的'}陀螺觸發殘餘轉速，突然二次加速！`);

    return true;
  }

  /*
   * =========================================================
   * Center Duel / Finish
   * =========================================================
   */

  function scoreBody(body) {
    const hpRatio = clamp(body.hp / body.maxHp, 0, 1);
    const spinRatio = clamp(body.spinRatio, 0, 1);

    return hpRatio * 0.78 + spinRatio * 0.22;
  }

  function checkHpKnockout() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return false;

    const p = b.player;
    const e = b.enemy;

    const pDead = p.hp <= 0;
    const eDead = e.hp <= 0;

    if (!pDead && !eDead) return false;

    let winner = null;
    let loser = null;
    let reason = '';
    let finish = 'spin';
    let points = 1;

    if (pDead && eDead) {
      if (p.spinRatio >= e.spinRatio) {
        winner = p;
        loser = e;
        reason = 'Spin Finish！雙方血條歸零，但你的陀螺保有最後轉速。';
      } else {
        winner = e;
        loser = p;
        reason = 'Spin Finish！雙方血條歸零，但對手保有最後轉速。';
      }
    } else if (pDead) {
      winner = e;
      loser = p;
      reason = 'Spin Finish！你的血條歸零，陀螺停止轉動。';
    } else {
      winner = p;
      loser = e;
      reason = 'Spin Finish！對手血條歸零，陀螺停止轉動。';
    }

    loser.hp = 0;
    loser.dead = true;
    loser.spin *= 0.25;
    loser.spinRatio *= 0.25;
    loser.vx *= 0.45;
    loser.vy *= 0.45;

    if (loser.lastHitPower > 1.55 || loser.burstGauge > 4.2) {
      finish = 'burst';
      points = 2;
      reason = winner.side === 'player'
        ? 'Burst Finish！你的最後撞擊讓對手血條歸零並爆裂。'
        : 'Burst Finish！對手最後一擊讓你的血條歸零並爆裂。';
    }

    return startFinishSequence(winner, loser, reason, finish, points);
  }

  function shouldStartCenterDuel() {
    const b = state.battle;
    if (!b || b.ended || state.finishing || state.centerDuelStarted) return false;

    const elapsed = now() - b.startedAt;
    const p = b.player;
    const e = b.enemy;

    if (p.hp <= 0 || e.hp <= 0) return false;

    const pScore = scoreBody(p);
    const eScore = scoreBody(e);

    return (
      elapsed > PHY.battleLimit * 0.68 ||
      pScore < 0.22 ||
      eScore < 0.22 ||
      p.spinRatio < 0.18 ||
      e.spinRatio < 0.18
    );
  }

  function startCenterDuel() {
    const b = state.battle;
    if (!b || state.centerDuelStarted) return;

    state.centerDuelStarted = true;
    state.centerDuelStartedAt = now();
    state.centerDuelResolved = false;

    const p = b.player;
    const e = b.enemy;

    p.vx *= 0.72;
    p.vy *= 0.72;
    e.vx *= 0.72;
    e.vy *= 0.72;

    p.spin *= 0.96;
    e.spin *= 0.96;

    restartClass(battleBox(), 'zg-killcam', PERF.lowFx ? 520 : 760);
    restartClass(battleBox(), 'zg-collision-zoom', 420);
    restartClass(battleBox(), 'zg-center-duel', 900);

    shockwave(b.arena.cx, b.arena.cy);
    impactRing(b.arena.cx, b.arena.cy);
    flash();

    setCommentary('最後決勝！兩顆陀螺被拉回中央，準備正面分出勝負！');
  }

  function startFinishSequence(winner, loser, reason, finish = 'spin', points = 1) {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return true;

    b.ended = true;
    state.finishing = true;
    state.finishStartedAt = now();

    loser.dead = false;
    loser.finishType = finish;
    winner.finishType = finish;

    b.finish = finish;
    b.points = points;

    state.pendingResult = {
      playerWon: winner.side === 'player',
      reason,
      finish,
      points
    };

    const dx = loser.x - winner.x;
    const dy = loser.y - winner.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / d;
    const ny = dy / d;

    const finishPower = finish === 'xtreme'
      ? 2.8
      : finish === 'burst'
        ? 2.45
        : finish === 'over'
          ? 2.35
          : 1.75;

    winner.vx -= nx * finishPower * 0.28;
    winner.vy -= ny * finishPower * 0.28;

    loser.vx += nx * finishPower * 1.05;
    loser.vy += ny * finishPower * 1.05;

    loser.hp = Math.max(0, loser.hp);
    loser.spin *= finish === 'spin' ? 0.62 : 0.48;
    loser.spinRatio *= finish === 'spin' ? 0.58 : 0.42;
    winner.spin *= 0.94;

    const cx = (winner.x + loser.x) / 2;
    const cy = (winner.y + loser.y) / 2;

    Sound.metal(finish === 'spin' ? 1.25 : 1.8, finish === 'burst' ? 1.35 : 1.15);
    flash();
    impactRing(cx, cy);
    shockwave(cx, cy);
    metalSparks(cx, cy, finish === 'spin' ? 12 : 18, finish === 'spin' ? 1.0 : 1.35);
    afterimage(loser.x, loser.y, finish === 'spin' ? 96 : 120);

    restartClass(battleBox(), 'zg-killcam', finish === 'xtreme' ? 820 : 680);
    restartClass(
      battleBox(),
      finish === 'xtreme'
        ? 'zg-xtreme-finish'
        : finish === 'over'
          ? 'zg-over-finish'
          : 'zg-launch-impact',
      620
    );

    if (finish === 'burst') burstPieces(loser.x, loser.y, PERF.lowFx ? 8 : 14);

    if (winner?.el) winner.el.classList.add('win-pulse');

    if (loser?.el) {
      loser.el.classList.add('zg-top-wobble');
      loser.el.classList.add('zg-ground-grind');
    }

    const label = FINISH[finish]?.label || 'Finish';

    setCommentary(`${label}！敗方血條歸零，陀螺正在停止轉動！`);

    setTimeout(() => Sound.death(), 620);

    return true;
  }

  function updateCenterDuel(dt) {
    const b = state.battle;
    if (!b || !state.centerDuelStarted || state.centerDuelResolved) return false;

    const p = b.player;
    const e = b.enemy;
    const elapsed = now() - state.centerDuelStartedAt;

    const cx = b.arena.cx;
    const cy = b.arena.cy;

    const pTargetX = cx - 58;
    const pTargetY = cy + 8;
    const eTargetX = cx + 58;
    const eTargetY = cy - 8;

    const pullTo = (body, tx, ty, strength) => {
      const dx = tx - body.x;
      const dy = ty - body.y;
      const d = Math.max(1, Math.hypot(dx, dy));

      body.vx += (dx / d) * strength * dt;
      body.vy += (dy / d) * strength * dt;
    };

    if (elapsed < 680) {
      pullTo(p, pTargetX, pTargetY, 0.38);
      pullTo(e, eTargetX, eTargetY, 0.38);

      p.vx *= Math.pow(0.986, dt);
      p.vy *= Math.pow(0.986, dt);
      e.vx *= Math.pow(0.986, dt);
      e.vy *= Math.pow(0.986, dt);

      if (Math.random() < (PERF.lowFx ? 0.04 : 0.1)) {
        scratch(p.x, p.y, p.vx, p.vy, true);
        scratch(e.x, e.y, e.vx, e.vy, true);
      }

      setCommentary('最後決勝準備中！雙方軌跡被拉回中央！');
    } else {
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / d;
      const ny = dy / d;
      const charge = 0.58 + Math.min(0.45, (elapsed - 680) / 900);

      p.vx += nx * charge * dt;
      p.vy += ny * charge * dt;
      e.vx -= nx * charge * dt;
      e.vy -= ny * charge * dt;

      if (Math.random() < (PERF.lowFx ? 0.08 : 0.16)) {
        afterimage(p.x, p.y, 86);
        afterimage(e.x, e.y, 86);
      }

      setCommentary('最後正面衝刺！下一次碰撞將削掉關鍵血量！');
    }

    applyFriction(p, dt);
    applyFriction(e, dt);

    move(p, dt);
    move(e, dt);

    boundary(p, b.arena);
    boundary(e, b.arena);

    const beforeHitP = p.lastHitAt;
    const beforeHitE = e.lastHitAt;

    collide(p, e);

    syncBody(p);
    syncBody(e);

    updateHpBars();

    if (checkHpKnockout()) return true;

    Sound.updateHum(0, p.spinRatio, getFeel(p.top).humBase, getFeel(p.top).humGain);
    Sound.updateHum(1, e.spinRatio, getFeel(e.top).humBase, getFeel(e.top).humGain);

    const hitOccurred = p.lastHitAt !== beforeHitP || e.lastHitAt !== beforeHitE;

    if (hitOccurred && elapsed > 680) {
      state.centerDuelResolved = true;

      const pScore = scoreBody(p);
      const eScore = scoreBody(e);

      const winner = pScore >= eScore ? p : e;
      const loser = winner === p ? e : p;

      let finish = 'spin';
      let points = 1;
      let reason = winner === p
        ? 'Spin Finish！中央最後對撞後，你的血量與轉速更高。'
        : 'Spin Finish！中央最後對撞後，對手血量與轉速更高。';

      if (loser.lastHitPower > 1.55 || loser.burstGauge > 4.2) {
        finish = 'burst';
        points = 2;
        reason = winner === p
          ? 'Burst Finish！中央決勝一擊，你將對手打到爆裂。'
          : 'Burst Finish！中央決勝一擊，你的陀螺被對手擊破。';
      }

      restartClass(battleBox(), 'zg-killcam', PERF.lowFx ? 560 : 820);
      restartClass(battleBox(), 'zg-launch-impact', 620);
      flash();
      shockwave((p.x + e.x) / 2, (p.y + e.y) / 2);
      metalSparks((p.x + e.x) / 2, (p.y + e.y) / 2, 18, 1.35);

      return startFinishSequence(winner, loser, reason, finish, points);
    }

    if (elapsed > 2100) {
      state.centerDuelResolved = true;

      const pScore = scoreBody(p);
      const eScore = scoreBody(e);
      const winner = pScore >= eScore ? p : e;
      const loser = winner === p ? e : p;

      return startFinishSequence(
        winner,
        loser,
        winner === p
          ? 'Spin Finish！中央決勝後，你的剩餘血量與轉速更高。'
          : 'Spin Finish！中央決勝後，對手的剩餘血量與轉速更高。',
        'spin',
        1
      );
    }

    return true;
  }

  function updateFinishSequence(dt) {
    const b = state.battle;
    if (!b || !state.finishing || !state.pendingResult) return false;

    const elapsed = now() - state.finishStartedAt;
    const p = b.player;
    const e = b.enemy;

    const winner = state.pendingResult.playerWon ? p : e;
    const loser = state.pendingResult.playerWon ? e : p;
    const finish = state.pendingResult.finish || 'spin';

    [p, e].forEach(body => {
      const isLoser = body === loser;

      const drag = isLoser ? 0.94 : 0.972;
      const spinDrag = isLoser ? 0.84 : 0.965;

      body.vx *= Math.pow(drag, dt);
      body.vy *= Math.pow(drag, dt);
      body.spin *= Math.pow(spinDrag, dt);

      if (isLoser) {
        body.hp = 0;
        body.spinRatio = clamp(body.spinRatio * Math.pow(0.82, dt), 0, 1);

        const wob = clamp((1 - body.spinRatio) * 0.32, 0.06, 0.38);

        body.vx += rand(-wob, wob) * dt;
        body.vy += rand(-wob, wob) * dt;
      } else {
        body.spinRatio = clamp(body.spinRatio * Math.pow(0.982, dt), 0, 1);
      }

      move(body, dt);
      boundary(body, b.arena);
      syncBody(body);
    });

    Sound.updateHum(0, p.spinRatio, getFeel(p.top).humBase, getFeel(p.top).humGain);
    Sound.updateHum(1, e.spinRatio, getFeel(e.top).humBase, getFeel(e.top).humGain);

    const danger = ensureDangerVignette();
    danger.classList.toggle('active', loser.spinRatio < 0.28);

    updateHpBars();

    if (elapsed > 520 && loser.el) {
      loser.hp = 0;
      loser.spin *= 0.72;
      loser.spinRatio *= 0.72;
      loser.dead = true;
      loser.el.style.opacity = '0.35';
    }

    if (elapsed > 900 && loser.el) {
      loser.spin = 0;
      loser.spinRatio = 0;
      loser.vx = 0;
      loser.vy = 0;
      loser.dead = true;
      loser.el.style.opacity = '0.25';
    }

    if (elapsed > 550 && elapsed < 940 && Math.random() < (PERF.lowFx ? 0.08 : 0.16)) {
      metalSparks(loser.x, loser.y, 4, 0.55);
      scratch(loser.x, loser.y, loser.vx, loser.vy, true);
    }

    if (elapsed > 820 && winner?.el) {
      winner.el.classList.add('win-pulse');
    }

    const finishDelay = finish === 'spin'
      ? 1380
      : finish === 'burst'
        ? 1550
        : finish === 'xtreme'
          ? 1720
          : 1480;

    if (elapsed >= finishDelay) {
      const result = state.pendingResult;

      state.finishing = false;
      state.pendingResult = null;

      endBattle(result.playerWon, result.reason, result.finish, result.points);

      return true;
    }

    return true;
  }

  function battleLoop(t) {
    if (!state.running || state.paused || !state.battle) return;

    const dtRaw = state.lastFrame ? (t - state.lastFrame) / 16.666 : 1;

    updatePerf(dtRaw);

    const dt = clamp(dtRaw, 0.35, 1.65);

    state.lastFrame = t;

    const b = state.battle;
    const p = b.player;
    const e = b.enemy;

    if (!b.lastArenaRefreshAt || t - b.lastArenaRefreshAt > 700) {
      b.lastArenaRefreshAt = t;
      b.arena = getArenaInfo();
    }

    if (state.finishing) {
      updateFinishSequence(dt);

      if (state.finishing && state.running && state.battle) {
        state.raf = requestAnimationFrame(battleLoop);
      }

      return;
    }

    if (state.centerDuelStarted) {
      updateCenterDuel(dt);

      if ((state.centerDuelStarted || state.finishing) && state.running && state.battle) {
        state.raf = requestAnimationFrame(battleLoop);
      }

      return;
    }

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

    if (checkHpKnockout()) {
      state.raf = requestAnimationFrame(battleLoop);
      return;
    }

    if (shouldStartCenterDuel()) {
      startCenterDuel();
      state.raf = requestAnimationFrame(battleLoop);
      return;
    }

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
    $$('.zg-burst-piece', box).forEach(el => el.remove());
    $$('.zg-wall-flash', box).forEach(el => el.remove());

    PERF.activeFx = 0;

    const danger = $('.zg-danger-vignette', box);
    if (danger) danger.classList.remove('active');

    box.classList.remove(
      'shake',
      'big-shake',
      'punch',
      'wall-hit',
      'zg-collision-zoom',
      'zg-launch-impact',
      'zg-killcam',
      'zg-over-finish',
      'zg-xtreme-finish',
      'zg-wall-rebound-box',
      'zg-center-duel'
    );
  }

  function startBattle() {
    beginChargeBattle();
  }

  function startBattleWithPower(power = 0.72) {
    Sound.resume();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    cancelChargeLoop();

    ensureBasicDom();
    injectVisualEnhancements();

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = state.enemyTop || pickEnemyTop();

    state.running = true;
    state.paused = false;

    resetBattleFlowState();

    showScreen('battle');
    showChargeLayer(false);
    clearBattleObjects();

    const arena = getArenaInfo();

    const launchPower = clamp(power, 0.15, 1);
    const perfectBonus = launchPower >= 0.78 && launchPower <= 0.92 ? 1.16 : 1;
    const playerBoost = 0.78 + launchPower * 0.68 * perfectBonus;

    const player = createBody(state.selectedTop, 'player', arena);
    const enemy = createBody(state.enemyTop, 'enemy', arena);

    player.vx *= playerBoost;
    player.vy *= playerBoost;
    player.spin = clamp(0.74 + launchPower * 0.46 * perfectBonus, 0.55, 1.22);
    player.spinRatio = clamp(player.spin, 0, 1.22);

    const enemyBoost = rand(0.86, 1.1);

    enemy.vx *= enemyBoost;
    enemy.vy *= enemyBoost;
    enemy.spin = rand(0.84, 1.05);
    enemy.spinRatio = enemy.spin;

    const centerPull = 1.48;
    const pToCenter = Math.atan2(arena.cy - player.y, arena.cx - player.x);
    const eToCenter = Math.atan2(arena.cy - enemy.y, arena.cx - enemy.x);

    player.vx += Math.cos(pToCenter) * centerPull;
    player.vy += Math.sin(pToCenter) * centerPull;
    enemy.vx += Math.cos(eToCenter) * centerPull;
    enemy.vy += Math.sin(eToCenter) * centerPull;

    player.el = createTopElement(player.top, 'player');
    enemy.el = createTopElement(enemy.top, 'enemy');

    state.battle = {
      arena,
      player,
      enemy,
      startedAt: now(),
      ended: false,
      launchPower,
      finish: '',
      points: 0,
      lastArenaRefreshAt: 0
    };

    syncBody(player);
    syncBody(enemy);
    updateHpBars();

    playLaunchSequence(launchPower);

    setTimeout(() => {
      state.lastFrame = 0;
      state.raf = requestAnimationFrame(battleLoop);
    }, 420);
  }

  function stopBattle() {
    state.running = false;
    state.paused = false;

    resetBattleFlowState();

    cancelChargeLoop();
    showChargeLayer(false);

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();
    clearBattleObjects();
  }

  function endBattle(playerWon, reason, finish = 'spin', points = 1) {
    state.running = false;
    state.paused = false;

    resetBattleFlowState();
    cancelChargeLoop();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const finishInfo = FINISH[finish] || FINISH.spin;
    const finishBonus = Number(points || finishInfo.points || 1);
    const oldScore = getMyScore();
    const reward = drawCouponReward();

    const delta = playerWon
      ? 18 + finishBonus * 18 + Math.round(Math.random() * 8)
      : -(8 + Math.round(Math.random() * 8));

    const newScore = Math.max(0, oldScore + delta);

    setMyScore(newScore);
    updateFriendAfterBattle(playerWon, newScore);

    showScreen('result');

    const resultPill = $('#screen-result .zg-pill');
    if (resultPill) resultPill.textContent = 'REWARD';

    const rank = $('#zg-result-rank') || $('.zg-rank');
    const title = $('#zg-result-title') || $('.zg-result-title');
    const subtitle = $('#zg-result-subtitle');
    const score = $('#zg-result-score');

    if (rank) rank.textContent = playerWon ? 'W' : 'L';

    if (title) {
      title.textContent = playerWon
        ? `勝利！${finishInfo.label}`
        : `敗北…${finishInfo.label}`;
    }

    if (subtitle) subtitle.textContent = reason || '';

    const couponBox = $('#zg-result-coupon');
    const couponLabel = $('#zg-coupon-label');
    const couponNote = $('#zg-coupon-note');
    const downloadBtn = $('#zg-download-coupon');
    const copyBtn = $('#zg-copy-coupon');
    /**
 * 清除舊版結果頁文案，避免畫面殘留「目前積分」
 */
const legacyCouponLabels = $$('.zg-coupon-label, .zg-score-label, .zg-current-score-label, [data-zg-coupon-label]');
legacyCouponLabels.forEach(el => {
  el.textContent = reward.amount > 0
    ? `恭喜你贏得 ${reward.amount} 元折扣碼`
    : '這次沒有抽中折扣券';
});

    if (couponBox) {
      couponBox.classList.toggle('no-reward', reward.amount <= 0);
      couponBox.classList.toggle('has-reward', reward.amount > 0);
      couponBox.setAttribute('data-coupon-amount', String(reward.amount || 0));
    }

   if (couponLabel) {
  couponLabel.textContent = reward.amount > 0
    ? `恭喜你贏得 ${reward.amount} 元折扣碼`
    : '這次沒有抽中折扣券';
}

    if (score) {
      score.textContent = reward.amount > 0
        ? `${reward.amount} 元折扣券`
        : '再接再厲';
    }

    if (couponNote) {
  couponNote.innerHTML = reward.amount > 0
    ? `折扣碼：<strong>${reward.code}</strong>`
    : `別灰心，繼續挑戰就有機會獲得 ZELO 折扣券！`;
}

    if (downloadBtn) {
  downloadBtn.hidden = false;
  downloadBtn.textContent = reward.amount > 0 ? '複製折扣碼' : '保存戰鬥結果';
  downloadBtn.disabled = false;

  if (reward.amount > 0) {
    downloadBtn.setAttribute('data-zg-action', 'copy-coupon');
  } else {
    downloadBtn.setAttribute('data-zg-action', 'download-coupon');
  }
}
/**
 * 底部複製折扣碼按鈕已停用。
 * 複製功能改由中間黃色按鈕 #zg-download-coupon 執行。
 */
if (copyBtn) {
  copyBtn.remove();
}


/**
 * 複製折扣碼按鈕已停用。
 * 目前不在結果頁顯示 #zg-copy-coupon。
 */
if (copyBtn) {
  copyBtn.hidden = true;
  copyBtn.disabled = true;
  copyBtn.classList.add('is-disabled');
}

  /*
   * =========================================================
   * Friend rank
   * =========================================================
   */

  function loadFriends() {
  const saved = safeParse(localStorage.getItem(STORAGE.friends), null);
  const myScore = getMyScore();

  /**
   * 只顯示：
   * 1. 自己
   * 2. 真的已經被寫入 localStorage 的邀請成功好友
   *
   * 不再產生 Kai / Mina / Leo / Rin 虛擬人物。
   */
  let list = Array.isArray(saved) ? saved : [];

  const meIndex = list.findIndex(x => x.id === 'me');

  if (meIndex >= 0) {
    list[meIndex] = {
      ...list[meIndex],
      name: '你',
      score: myScore
    };
  } else {
    list.unshift({
      id: 'me',
      name: '你',
      score: myScore,
      wins: 0,
      losses: 0,
      todayDelta: 0,
      invited: true
    });
  }

  /**
   * 過濾掉舊版假資料
   */
  const fakeIds = ['kai', 'mina', 'leo', 'rin'];

  list = list.filter(item => {
    if (!item || !item.id) return false;
    if (fakeIds.includes(String(item.id).toLowerCase())) return false;
    if (item.id === 'me') return true;

    /**
     * 只有標記為 invited / accepted / source=invite 的好友才顯示
     */
    return item.invited === true || item.accepted === true || item.source === 'invite';
  });

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
    const invitedCount = rows.filter(row => row.id !== 'me').length;

if (invitedCount <= 0) {
  box.innerHTML = rows.map(row => {
    const isMe = row.id === 'me';
    const delta = Number(row.todayDelta || 0);

    return `
      <div class="zg-rank-item ${isMe ? 'me' : ''}">
        <div class="zg-rank-no">${row.rank}</div>
        <div class="zg-rank-name">
          ${row.name}${isMe ? '（你）' : ''}
          <div class="zg-rank-count">目前尚未有邀請成功的好友</div>
        </div>
        <div class="zg-rank-count">
          ${row.score || 0}
          <br>
          <span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span>
        </div>
      </div>
      <div class="zg-rank-empty">邀請好友完成遊戲後，才會出現在排行榜。</div>
    `;
  }).join('');

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
   * Share / Coupon Download / Coupon Copy
   * =========================================================
   */

  async function shareGame() {
    const score = getMyScore();
    const url = location.href.split('#')[0];

    const text = `我剛剛在 ZELO 陀螺競技場完成對戰，目前積分 ${score}！快來挑戰我！`;
    const title = 'ZELO 陀螺競技場';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast(`折扣碼已複製：${reward.code}`);
        return;
      }

      prompt('複製分享連結：', `${text}\n${url}`);
    } catch (e) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          toast('分享連結已複製，可以貼給好友！');
          return;
        }
      } catch (err) {}

      toast('分享取消或目前瀏覽器不支援分享');
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function downloadCouponImage() {
    const reward = state.lastCouponReward;

    if (!reward) {
      toast('目前沒有可下載的戰鬥獎勵');
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = 1080;
    canvas.height = 640;

    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 1080, 640);

    gradient.addColorStop(0, '#1b1028');
    gradient.addColorStop(0.45, '#2b0f16');
    gradient.addColorStop(1, '#111827');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 背景光暈
    ctx.fillStyle = 'rgba(255, 214, 80, 0.18)';
    ctx.beginPath();
    ctx.arc(850, 100, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(87, 242, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(150, 540, 260, 0, Math.PI * 2);
    ctx.fill();

    // 外框
    ctx.strokeStyle = 'rgba(255, 214, 80, 0.88)';
    ctx.lineWidth = 8;
    roundRect(ctx, 50, 50, 980, 540, 36);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 70, 70, 940, 500, 28);
    ctx.fill();

    // 全部置中
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    // 標題
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('ZELO 戰鬥獎勵', 540, 150);

    // 折扣券金額 / 再接再厲
    ctx.fillStyle = '#ffd650';
    ctx.font = 'bold 88px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText(`${reward.amount} 元折扣券`, 540, 285);
    } else {
      ctx.fillText('再接再厲', 540, 285);
    }

    // 折扣碼或鼓勵文案
    ctx.fillStyle = '#ffffff';
    ctx.font = '42px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText(`折扣碼：${reward.code}`, 540, 382);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '28px sans-serif';
      ctx.fillText('請於 ZELO 官方商店結帳時輸入此代碼享優惠', 540, 435);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '32px sans-serif';
      ctx.fillText('這次沒有抽中折扣券，繼續挑戰還有機會！', 540, 382);
    }

    // 戰鬥結果
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '26px sans-serif';
    ctx.fillText(`戰鬥結果：${reward.playerWon ? '勝利' : '敗北'} · ${reward.finish}`, 540, 500);

    // 原本「目前積分」改成祝賀 / 鼓勵文案
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '26px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText('恭喜你獲得 ZELO 戰鬥獎勵！', 540, 540);
    } else {
      ctx.fillText('繼續挑戰，下次就有機會獲得折扣券！', 540, 540);
    }

    // 備註
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '22px sans-serif';
    ctx.fillText('※ 折扣券使用規則依商店公告為準', 540, 585);

    const link = document.createElement('a');

    const fileName = reward.amount > 0
      ? `ZELO-${reward.amount}-coupon-${reward.code}.png`
      : `ZELO-battle-result.png`;

    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast(reward.amount > 0 ? '折扣券已下載' : '戰鬥結果已保存');
  }

  async function copyCouponCode() {
    const reward = state.lastCouponReward;

    if (!reward || !reward.amount || !reward.code) {
      toast('目前沒有可拷貝的折扣券序號');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reward.code);
        toast(`已拷貝折扣券序號：${reward.code}`);
        return;
      }

      prompt('請手動複製折扣券序號：', reward.code);
    } catch (e) {
      prompt('請手動複製折扣券序號：', reward.code);
    }
  }

  /*
   * =========================================================
   * Actions
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

    if (key.includes('start') || text.includes('開始遊戲') || text === '開始') return 'start';

    if (
      key.includes('battle') ||
      key.includes('launch') ||
      text.includes('開始對戰') ||
      text.includes('發射') ||
      text.includes('對戰')
    ) return 'battle';

    if (
      key.includes('retry') ||
      key.includes('again') ||
      text.includes('再戰') ||
      text.includes('重玩') ||
      text.includes('再來')
    ) return 'retry';

    if (
      key.includes('select') ||
      key.includes('change') ||
      text.includes('更換') ||
      text.includes('選擇')
    ) return 'select';

    if (
      key.includes('home') ||
      key.includes('back') ||
      text.includes('首頁') ||
      text.includes('返回')
    ) return 'home';

    if (
      key.includes('copy-coupon') ||
      text.includes('拷貝折扣券') ||
      text.includes('複製折扣券') ||
      text.includes('拷貝序號') ||
      text.includes('複製序號')
    ) return 'copy-coupon';

    if (
      key.includes('download-coupon') ||
      text.includes('下載折扣券') ||
      text.includes('保存戰鬥結果')
    ) return 'download-coupon';

    if (key.includes('share') || text.includes('邀請') || text.includes('分享')) return 'share';

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

    if (action === 'copy-coupon') {
      copyCouponCode();
      return;
    }

    if (action === 'download-coupon') {
      downloadCouponImage();
      return;
    }

    if (action === 'share') {
      shareGame();
      return;
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

      if (clickable.classList.contains('zg-charge-btn')) {
        e.preventDefault();
        return;
      }

      const action = resolveAction(clickable);

      if (!action) return;

      e.preventDefault();
      runAction(action);
    });

    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.zg-charge-btn');

      if (!btn) return;

      e.preventDefault();
      startCharging();
    });

    document.addEventListener('pointerup', e => {
      if (!state.charging) return;

      e.preventDefault();
      releaseCharging();
    });

    document.addEventListener('pointercancel', e => {
      if (!state.charging) return;

      e.preventDefault();
      releaseCharging();
    });

    document.addEventListener('pointerleave', e => {
      if (!state.charging) return;

      const isChargeBtn = e.target?.closest?.('.zg-charge-btn');

      if (!isChargeBtn) return;

      e.preventDefault();
      releaseCharging();
    });

    window.addEventListener('resize', () => {
      if (state.battle) {
        state.battle.arena = getArenaInfo();
        state.battle.lastArenaRefreshAt = now();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        cancelChargeLoop();
        Sound.stopHum();
      } else if (state.screen === 'battle' && state.battle) {
        state.paused = false;

        if (!state.finishing) {
          Sound.startHum(0, getFeel(state.battle.player.top).humBase);
          Sound.startHum(1, getFeel(state.battle.enemy.top).humBase);
        }

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

    window.ZeloGame = {
      version: VERSION,
      state,
      startBattle,
      startBattleWithPower,
      stopBattle,
      showScreen,
      selectTop,
      renderTopSelection,
      renderFriendRank,
      downloadCouponImage,
      copyCouponCode,
      sound: Sound
    };

    window.ZGGame = window.ZeloGame;

    showScreen('start');

    console.info(`[ZeloGame] Loaded game.js v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
