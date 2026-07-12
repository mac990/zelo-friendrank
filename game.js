/*
 * ZELO GAME JS
 * Complete Replacement
 * Version: 202607122230
 *
 * Rules:
 * - ONLY top-to-top collision reduces HP
 * - Wall rebound does NOT reduce HP
 * - HP bar represents HP only
 * - When HP reaches 0, that top stops spinning and loses
 *
 * Custom:
 * - Shopify header/menu removed
 * - ZELO logo / brand / pill removed from game UI
 * - Home background image enabled
 * - Battle arena background image enabled
 */

(() => {
  'use strict';

  const VERSION = '202607122230';

  const BG_IMAGE_URL = 'https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764';

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

    removeMenuDom();
    removeLogoDom();

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
      if (c && c.state === 'suspended') {
        try {
          c.resume();
        } catch (e) {}
      }
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
      s.className = 'zg-screen active zg-home-bg-screen';
      s.innerHTML = `
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
        <div class="zg-topbar zg-topbar-no-logo">
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
        <div class="zg-topbar zg-topbar-no-logo">
          <button class="zg-small-btn" data-zg-action="select" type="button">退出</button>
        </div>
        <main class="zg-main">
          <div class="zg-battle-box zg-arena-bg-box">
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
    removeLogoDom();
  }

  function removeMenuDom() {
    const selectors = [
      'header',
      'nav',
      '.site-header',
      '.header',
      '.navbar',
      '.navigation',
      '.menu',
      '.drawer',
      '.drawer-menu',
      '.mobile-menu',
      '#menu',
      '#shopify-section-header',
      '.shopify-section-header',
      '.announcement-bar',
      '#shopify-section-announcement-bar',
      '.header-wrapper',
      '.shopify-section-group-header-group'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (el.closest('#zelo-liff-game') || el.closest('#zg-app')) return;

        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('height', '0px', 'important');
        el.style.setProperty('min-height', '0px', 'important');
        el.style.setProperty('max-height', '0px', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
      });
    });
  }

  function removeLogoDom() {
    const root = appRoot();

    $$('.zg-brand', root).forEach(el => el.remove());
    $$('.zg-pill', root).forEach(el => el.remove());
    $$('.zg-bg-logo', root).forEach(el => el.remove());
    $$('.zg-fixed-logo', root).forEach(el => el.remove());

    $$('.zg-topbar', root).forEach(bar => {
      const hasUsefulButton = $('.zg-small-btn', bar);

      if (hasUsefulButton) {
        bar.classList.add('zg-topbar-no-logo');
        return;
      }

      bar.remove();
    });
  }

  function watchMenuDom() {
    removeMenuDom();
    removeLogoDom();

    if (window.ZGMenuObserver) {
      try {
        window.ZGMenuObserver.disconnect();
      } catch (e) {}
    }

    const observer = new MutationObserver(() => {
      removeMenuDom();
      removeLogoDom();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.ZGMenuObserver = observer;
  }

  function injectBackgroundStyles() {
    if ($('#zg-bg-style')) return;

    const style = document.createElement('style');
    style.id = 'zg-bg-style';

    style.textContent = `
      :root {
        --zg-home-bg-image: url('${BG_IMAGE_URL}');
        --zg-arena-bg-image: url('${BG_IMAGE_URL}');
      }

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
        overflow-x: hidden !important;
      }

      body[data-zg-screen] header,
      body[data-zg-screen] nav,
      body[data-zg-screen] .site-header,
      body[data-zg-screen] .header,
      body[data-zg-screen] .navbar,
      body[data-zg-screen] .navigation,
      body[data-zg-screen] .menu,
      body[data-zg-screen] .drawer,
      body[data-zg-screen] .drawer-menu,
      body[data-zg-screen] .mobile-menu,
      body[data-zg-screen] #menu,
      body[data-zg-screen] #shopify-section-header,
      body[data-zg-screen] .shopify-section-header,
      body[data-zg-screen] .announcement-bar,
      body[data-zg-screen] #shopify-section-announcement-bar,
      body[data-zg-screen] .header-wrapper,
      body[data-zg-screen] .shopify-section-group-header-group {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
      }

      #zelo-liff-game,
      #zg-app,
      #app {
        min-height: var(--zg-app-height, 100vh) !important;
      }

      .zg-screen {
        position: relative !important;
        min-height: var(--zg-app-height, 100vh) !important;
        width: 100% !important;
        overflow: hidden !important;
      }

      #screen-start.zg-home-bg-screen,
      #screen-start {
        background-image:
          linear-gradient(
            rgba(10, 8, 18, 0.16),
            rgba(10, 8, 18, 0.62)
          ),
          var(--zg-home-bg-image) !important;
        background-size: contain !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
        background-color: #120914 !important;
      }

      .zg-battle-box.zg-arena-bg-box,
      .zg-battle-box {
        background-image:
          radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.04),
            rgba(0, 0, 0, 0.42)
          ),
          var(--zg-arena-bg-image) !important;
        background-size: contain !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
        background-color: #160b18 !important;
      }

      .zg-topbar-no-logo {
        justify-content: flex-end !important;
      }

      .zg-brand,
      .zg-pill,
      .zg-bg-logo,
      .zg-fixed-logo {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function ensureBattleDom() {
    const battle = screenBattle();
    if (!battle) return;

    let box = $('.zg-battle-box', battle);

    if (!box) {
      box = document.createElement('div');
      box.className = 'zg-battle-box zg-arena-bg-box';
      const main = $('.zg-main', battle) || battle;
      main.prepend(box);
    }

    box.classList.add('zg-arena-bg-box');

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
    injectBackgroundStyles();
    removeMenuDom();
    removeLogoDom();

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

    removeMenuDom();
    removeLogoDom();
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
    if (!b || !state.centerDuelStarted || state.centerDuelResolved || state.finishing) return;

    const p = b.player;
    const e = b.enemy;

    const elapsed = now() - state.centerDuelStartedAt;
    const arena = b.arena;

    const pull = clamp(elapsed / 1300, 0.2, 1.2);
    const swirl = Math.sin(now() * 0.008) * 0.34;

    [p, e].forEach((body, idx) => {
      const dx = arena.cx - body.x;
      const dy = arena.cy - body.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / d;
      const ny = dy / d;
      const tangent = idx === 0 ? 1 : -1;

      body.vx += (nx * 0.18 * pull + -ny * 0.12 * tangent + swirl * 0.02) * dt;
      body.vy += (ny * 0.18 * pull + nx * 0.12 * tangent - swirl * 0.02) * dt;

      body.spin *= Math.pow(0.994, dt);
      body.angularSpeed *= Math.pow(0.998, dt);
    });

    const d = Math.hypot(p.x - e.x, p.y - e.y);

    if (elapsed > 1450 || d < p.radius + e.radius + 5) {
      state.centerDuelResolved = true;

      const pScore = scoreBody(p) + (p.top.type === 'stamina' ? 0.025 : 0) + (p.top.type === 'defense' ? 0.015 : 0);
      const eScore = scoreBody(e) + (e.top.type === 'stamina' ? 0.025 : 0) + (e.top.type === 'defense' ? 0.015 : 0);

      let winner;
      let loser;

      if (Math.abs(pScore - eScore) < 0.025) {
        winner = p.spinRatio >= e.spinRatio ? p : e;
      } else {
        winner = pScore >= eScore ? p : e;
      }

      loser = winner === p ? e : p;

      let finish = 'spin';
      let points = 1;
      let reason = winner.side === 'player'
        ? '最後中央決勝，你的陀螺保有較多血量與轉速。'
        : '最後中央決勝，對手保有較多血量與轉速。';

      const gap = Math.abs(pScore - eScore);
      const loserNearEdge =
        loser.x < b.arena.left + 22 ||
        loser.x > b.arena.right - 22 ||
        loser.y < b.arena.top + 22 ||
        loser.y > b.arena.bottom - 22;

      if (loser.burstGauge > 4.4 || winner.lastHitPower > 1.55) {
        finish = 'burst';
        points = 2;
        reason = winner.side === 'player'
          ? 'Burst Finish！中央決勝最後一擊讓對手爆裂。'
          : 'Burst Finish！中央決勝最後一擊讓你爆裂。';
      } else if (gap > 0.18 && loserNearEdge) {
        finish = 'over';
        points = 2;
        reason = winner.side === 'player'
          ? 'Over Finish！你的陀螺把對手撞出有效區域。'
          : 'Over Finish！對手把你的陀螺撞出有效區域。';
      } else if (gap > 0.26 && winner.spinRatio > 0.28) {
        finish = 'xtreme';
        points = 3;
        reason = winner.side === 'player'
          ? 'Xtreme Finish！你的陀螺以壓倒性轉速完成終結。'
          : 'Xtreme Finish！對手以壓倒性轉速完成終結。';
      }

      loser.hp = 0;
      loser.dead = true;

      startFinishSequence(winner, loser, reason, finish, points);
    }
  }

  function updateFinishSequence(dt) {
    const b = state.battle;
    if (!b || !state.finishing || !state.pendingResult) return;

    const elapsed = now() - state.finishStartedAt;
    const p = b.player;
    const e = b.enemy;
    const loser = state.pendingResult.playerWon ? e : p;
    const winner = state.pendingResult.playerWon ? p : e;

    loser.vx *= Math.pow(0.975, dt);
    loser.vy *= Math.pow(0.975, dt);
    winner.vx *= Math.pow(0.992, dt);
    winner.vy *= Math.pow(0.992, dt);

    loser.spin *= Math.pow(0.972, dt);
    loser.spinRatio = clamp(loser.spinRatio * Math.pow(0.965, dt), 0, 1);

    winner.spin *= Math.pow(0.995, dt);
    winner.spinRatio = clamp(winner.spinRatio * Math.pow(0.996, dt), 0, 1);

    if (elapsed > 700 && loser?.el) {
      loser.el.classList.add('zg-defeated');
      loser.el.classList.add('zg-top-wobble');
    }

    if (elapsed > 1350) {
      endBattle(
        state.pendingResult.playerWon,
        state.pendingResult.reason,
        state.pendingResult.finish,
        state.pendingResult.points
      );
    }
  }

  function checkBattleTimeout() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return false;

    const elapsed = now() - b.startedAt;
    const p = b.player;
    const e = b.enemy;

    if (elapsed < PHY.battleLimit) return false;

    if (!state.centerDuelStarted) {
      startCenterDuel();
      return true;
    }

    const pScore = scoreBody(p);
    const eScore = scoreBody(e);

    const winner = pScore >= eScore ? p : e;
    const loser = winner === p ? e : p;

    loser.hp = 0;
    loser.dead = true;

    const reason = winner.side === 'player'
      ? '時間終了！你的陀螺保有較高血量與轉速。'
      : '時間終了！對手保有較高血量與轉速。';

    return startFinishSequence(winner, loser, reason, 'spin', 1);
  }

  function battleLoop(t) {
    const b = state.battle;

    if (!b || !state.running || state.paused) return;

    const raw = state.lastFrame ? (t - state.lastFrame) / 16.67 : 1;
    const dt = clamp(raw, 0.45, 1.45);

    state.lastFrame = t;

    updatePerf(raw);

    const p = b.player;
    const e = b.enemy;

    if (!state.finishing) {
      if (checkHpKnockout()) {
        // Finish started
      } else if (shouldStartCenterDuel()) {
        startCenterDuel();
      }

      if (!state.centerDuelStarted) {
        seek(p, e, dt);
      } else {
        updateCenterDuel(dt);
      }

      applyFriction(p, dt);
      applyFriction(e, dt);

      move(p, dt);
      move(e, dt);

      boundary(p, b.arena);
      boundary(e, b.arena);

      if (!state.finishing) {
        collide(p, e);
        checkHpKnockout();
        checkBattleTimeout();
      }
    } else {
      applyFriction(p, dt);
      applyFriction(e, dt);

      move(p, dt);
      move(e, dt);

      boundary(p, b.arena);
      boundary(e, b.arena);

      updateFinishSequence(dt);
    }

    syncBody(p);
    syncBody(e);
    updateHpBars();
    updateBattleFeel();

    state.raf = requestAnimationFrame(battleLoop);
  }

  function clearBattleObjects() {
    const box = battleBox();

    $$('.zg-battle-top', box).forEach(el => el.remove());
    $$('.zg-spark, .zg-impact-ring, .zg-metal-spark, .zg-scratch, .zg-launch-shockwave, .zg-spin-afterimage, .zg-impact-streak, .zg-burst-piece, .zg-wall-flash', box).forEach(el => el.remove());

    box.classList.remove(
      'shake',
      'big-shake',
      'punch',
      'zg-killcam',
      'zg-launch-impact',
      'zg-collision-zoom',
      'zg-center-duel',
      'zg-over-finish',
      'zg-xtreme-finish',
      'zg-wall-rebound-box'
    );

    PERF.activeFx = 0;
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
    showChargeLayer(false);

    ensureBasicDom();
    injectVisualEnhancements();
    ensureBattleDom();

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = state.enemyTop || pickEnemyTop();

    showScreen('battle');
    clearBattleObjects();

    resetBattleFlowState();

    const arena = getArenaInfo();
    const player = createBody(state.selectedTop, 'player', arena);
    const enemy = createBody(state.enemyTop, 'enemy', arena);

    const powerNorm = clamp(power, 0, 1);
    const powerMul =
      powerNorm >= 0.78 && powerNorm <= 0.92
        ? 1.23
        : 0.78 + powerNorm * 0.42;

    const spinMul =
      powerNorm >= 0.78 && powerNorm <= 0.92
        ? 1.18
        : 0.72 + powerNorm * 0.38;

    player.vx *= powerMul;
    player.vy *= powerMul;
    player.spin *= spinMul;
    player.spinRatio = clamp(player.spinRatio * spinMul, 0, 1);
    player.angularSpeed *= 0.88 + powerNorm * 0.34;

    const enemyPower = rand(0.72, 0.96);
    enemy.vx *= enemyPower;
    enemy.vy *= enemyPower;
    enemy.spin *= 0.9 + enemyPower * 0.14;
    enemy.spinRatio = clamp(enemy.spinRatio * (0.9 + enemyPower * 0.14), 0, 1);

    player.el = createTopElement(player.top, 'player');
    enemy.el = createTopElement(enemy.top, 'enemy');

    state.battle = {
      arena,
      player,
      enemy,
      startedAt: now(),
      ended: false,
      finish: '',
      points: 0
    };

    state.running = true;
    state.paused = false;
    state.lastFrame = 0;

    syncBody(player);
    syncBody(enemy);
    updateHpBars();
    playLaunchSequence(powerNorm);

    state.raf = requestAnimationFrame(battleLoop);
  }

  function stopBattle() {
    state.running = false;
    state.paused = false;

    cancelChargeLoop();
    showChargeLayer(false);

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();
  }

  function calculateScore(playerWon, finish = 'spin', points = 1) {
    const base = playerWon ? 120 : 48;
    const finishBonus = (FINISH[finish]?.points || points || 1) * 35;
    const hpBonus = state.battle
      ? Math.round(clamp(state.battle.player.hp / state.battle.player.maxHp, 0, 1) * 80)
      : 0;

    return base + finishBonus + hpBonus;
  }

  function getRank(score) {
    if (score >= 260) return 'S';
    if (score >= 210) return 'A';
    if (score >= 160) return 'B';
    if (score >= 110) return 'C';
    return 'D';
  }

  function updateCouponResult(playerWon) {
    const reward = playerWon
      ? drawCouponReward()
      : {
          id: 'none',
          label: '再接再厲',
          amount: 0,
          codePrefix: '',
          code: ''
        };

    state.lastCouponReward = reward;

    const coupon = $('#zg-result-coupon');
    const label = $('#zg-coupon-label');
    const score = $('#zg-result-score');
    const note = $('#zg-coupon-note');
    const downloadBtn = $('#zg-download-coupon');
    const copyBtn = $('#zg-copy-coupon');

    if (coupon) {
      coupon.classList.toggle('is-win', playerWon && reward.amount > 0);
      coupon.classList.toggle('is-empty', !playerWon || reward.amount <= 0);
    }

    if (!playerWon) {
      if (label) label.textContent = '挑戰失敗';
      if (score) score.textContent = '未獲得折扣券';
      if (note) note.textContent = '再挑戰一次，勝利後可抽選折扣券。';
      if (downloadBtn) downloadBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';
      return;
    }

    if (reward.amount > 0) {
      if (label) label.textContent = reward.label;
      if (score) score.textContent = reward.code;
      if (note) note.textContent = `恭喜獲得 ${reward.amount} 元折扣券，請截圖或下載保存。`;
      if (downloadBtn) downloadBtn.style.display = '';
      if (copyBtn) copyBtn.style.display = '';
    } else {
      if (label) label.textContent = '再接再厲';
      if (score) score.textContent = '本次未中獎';
      if (note) note.textContent = '你已完成戰鬥，可再挑戰一次抽選折扣券。';
      if (downloadBtn) downloadBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';
    }
  }

  function endBattle(playerWon, reason, finish = 'spin', points = 1) {
    const b = state.battle;

    if (b) b.ended = true;

    stopBattle();

    const battleScore = calculateScore(playerWon, finish, points);
    const oldScore = getMyScore();
    const newScore = oldScore + (playerWon ? battleScore : Math.round(battleScore * 0.35));

    setMyScore(newScore);
    seedFriends(newScore);
    updateCouponResult(playerWon);

    showScreen('result');

    const rank = $('#zg-result-rank') || $('.zg-rank');
    const title = $('#zg-result-title') || $('.zg-result-title');
    const subtitle = $('#zg-result-subtitle');

    const finishLabel = FINISH[finish]?.label || 'Finish';

    if (rank) rank.textContent = playerWon ? getRank(battleScore) : 'L';

    if (title) {
      title.textContent = playerWon
        ? `${finishLabel} 勝利！`
        : `${finishLabel} 敗北`;
    }

    if (subtitle) {
      subtitle.textContent = reason || (playerWon ? '你的陀螺撐到了最後。' : '對手的陀螺取得勝利。');
    }

    renderFriendRank();

    removeMenuDom();
    removeLogoDom();
  }
  /*
   * =========================================================
   * Ranking
   * =========================================================
   */

  function seedFriends(myScore = getMyScore()) {
    const existing = safeParse(localStorage.getItem(STORAGE.friends), null);

    if (Array.isArray(existing) && existing.length >= 5) {
      return existing;
    }

    const names = [
      'Kai',
      'Mika',
      'Leo',
      'Yuna',
      'Rex',
      'Nina',
      'Tomo',
      'Aki'
    ];

    const friends = names.map((name, i) => ({
      name,
      score: Math.max(100, Math.round(myScore + rand(-220, 260) + i * rand(-18, 22)))
    }));

    localStorage.setItem(STORAGE.friends, JSON.stringify(friends));
    return friends;
  }

  function getRankRows() {
    const friends = seedFriends(getMyScore());
    const myScore = getMyScore();

    const rows = [
      ...friends,
      {
        name: '你',
        score: myScore,
        me: true
      }
    ];

    rows.sort((a, b) => b.score - a.score);

    return rows.slice(0, 8);
  }

  function renderFriendRank() {
    const list = $('#zg-friend-rank-list');
    if (!list) return;

    const rows = getRankRows();

    list.innerHTML = rows.map((row, i) => `
      <div class="zg-rank-row ${row.me ? 'me' : ''}">
        <span class="zg-rank-num">${i + 1}</span>
        <span class="zg-rank-name">${row.name}</span>
        <strong class="zg-rank-score">${row.score}</strong>
      </div>
    `).join('');
  }

  /*
   * =========================================================
   * Coupon helpers
   * =========================================================
   */

  function downloadCouponImage() {
    const reward = state.lastCouponReward;

    if (!reward || !reward.amount || !reward.code) {
      alert('目前沒有可下載的折扣券。');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 640;

    const ctx = canvas.getContext('2d');

    const grd = ctx.createLinearGradient(0, 0, 1080, 640);
    grd.addColorStop(0, '#16040b');
    grd.addColorStop(0.5, '#37070f');
    grd.addColorStop(1, '#07030a');

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1080, 640);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 26; i++) {
      ctx.beginPath();
      ctx.arc(rand(0, 1080), rand(0, 640), rand(3, 16), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#e60012';
    ctx.lineWidth = 12;
    roundRect(ctx, 50, 50, 980, 540, 42);
    ctx.stroke();

    ctx.strokeStyle = '#ffd45a';
    ctx.lineWidth = 4;
    roundRect(ctx, 78, 78, 924, 484, 34);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    ctx.font = 'bold 56px Arial, sans-serif';
    ctx.fillText('ZELO BATTLE REWARD', 540, 150);

    ctx.fillStyle = '#ffd45a';
    ctx.font = 'bold 104px Arial, sans-serif';
    ctx.fillText(`${reward.amount} 元折扣券`, 540, 285);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Arial, sans-serif';
    ctx.fillText(reward.code, 540, 405);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('請於結帳時輸入折扣碼使用', 540, 492);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${reward.code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  async function copyCouponCode() {
    const reward = state.lastCouponReward;

    if (!reward || !reward.code) {
      alert('目前沒有可複製的折扣碼。');
      return;
    }

    try {
      await navigator.clipboard.writeText(reward.code);
      alert(`已複製折扣碼：${reward.code}`);
    } catch (e) {
      const input = document.createElement('input');
      input.value = reward.code;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand('copy');
        alert(`已複製折扣碼：${reward.code}`);
      } catch (err) {
        alert(`請手動複製折扣碼：${reward.code}`);
      }

      input.remove();
    }
  }

  function shareGame() {
    const text = '我剛剛在 ZELO 陀螺競技場完成對戰！快來挑戰我的分數！';

    if (navigator.share) {
      navigator.share({
        title: 'ZELO 陀螺競技場',
        text,
        url: location.href
      }).catch(() => {});
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${location.href}`).then(() => {
        alert('邀請連結已複製！');
      }).catch(() => {
        alert(text);
      });
      return;
    }

    alert(text);
  }

  /*
   * =========================================================
   * Events
   * =========================================================
   */

  function bindEvents() {
    if (window.ZGEventsBound) return;
    window.ZGEventsBound = true;

    document.addEventListener('click', event => {
      const topCard = event.target.closest('.zg-top-card');

      if (topCard) {
        const id = topCard.getAttribute('data-id') || topCard.getAttribute('data-top-id');

        if (id) selectTop(id);
        return;
      }

      const actionEl = event.target.closest('[data-zg-action]');
      if (!actionEl) return;

      const action = actionEl.getAttribute('data-zg-action');

      if (action === 'start') {
        Sound.resume();
        showScreen('select');
        return;
      }

      if (action === 'home') {
        stopBattle();
        showScreen('start');
        return;
      }

      if (action === 'select') {
        stopBattle();
        showScreen('select');
        return;
      }

      if (action === 'battle') {
        beginChargeBattle();
        return;
      }

      if (action === 'retry') {
        beginChargeBattle();
        return;
      }

      if (action === 'share') {
        shareGame();
        return;
      }

      if (action === 'download-coupon') {
        downloadCouponImage();
        return;
      }

      if (action === 'copy-coupon') {
        copyCouponCode();
      }
    });

    document.addEventListener('pointerdown', event => {
      const btn = event.target.closest('.zg-charge-btn');
      if (!btn) return;

      event.preventDefault();
      startCharging();
    });

    document.addEventListener('pointerup', event => {
      if (!state.charging) return;
      event.preventDefault();
      releaseCharging();
    });

    document.addEventListener('pointercancel', () => {
      if (!state.charging) return;
      releaseCharging();
    });

    document.addEventListener('keydown', event => {
      if (event.code === 'Space' && state.screen === 'battle') {
        const layer = $('.zg-charge-layer');

        if (layer && !layer.hidden) {
          event.preventDefault();
          if (!state.charging) startCharging();
        }
      }
    });

    document.addEventListener('keyup', event => {
      if (event.code === 'Space' && state.charging) {
        event.preventDefault();
        releaseCharging();
      }
    });

    window.addEventListener('blur', () => {
      if (state.charging) {
        releaseCharging();
      }
    });
  }

  /*
   * =========================================================
   * CSS fallback injection
   * =========================================================
   */

  function injectCoreStyles() {
    if ($('#zg-core-style')) return;

    const style = document.createElement('style');
    style.id = 'zg-core-style';

    style.textContent = `
      #zelo-liff-game,
      #zg-app,
      #app {
        position: relative;
        width: 100%;
        min-height: 100vh;
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        color: #fff;
        background: #09030a;
      }

      .zg-screen {
        box-sizing: border-box;
        display: none;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100vh;
        padding: 20px;
        color: #fff;
      }

      .zg-screen.active,
      .zg-screen.is-active {
        display: flex;
      }

      .zg-main {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
      }

      .zg-bottom {
        position: relative;
        z-index: 3;
        display: grid;
        gap: 10px;
        width: 100%;
        max-width: 760px;
        margin: 16px auto 0;
      }

      .zg-title {
        margin: 88px 0 10px;
        font-size: 48px;
        line-height: 1.04;
        font-weight: 900;
        letter-spacing: -0.04em;
        text-shadow: 0 8px 32px rgba(0,0,0,0.55);
      }

      .zg-highlight {
        color: #ffd45a;
      }

      .zg-subtitle,
      .zg-desc {
        color: rgba(255,255,255,0.82);
        font-size: 16px;
        line-height: 1.6;
      }

      .zg-hero {
        margin-top: 80px;
        font-size: 72px;
        filter: drop-shadow(0 0 24px rgba(255,212,90,0.55));
      }

      .zg-step-title,
      .zg-result-title {
        margin: 34px 0 10px;
        font-size: 34px;
        font-weight: 900;
      }

      .zg-btn,
      .zg-small-btn,
      .zg-charge-btn,
      .zg-coupon-download {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 15px 20px;
        font-weight: 900;
        font-size: 16px;
        color: #fff;
        cursor: pointer;
        box-shadow: 0 12px 26px rgba(0,0,0,0.32);
      }

      .zg-btn-red {
        background: linear-gradient(135deg, #e60012, #ff6a00);
      }

      .zg-btn-blue {
        background: linear-gradient(135deg, #0069ff, #00d4ff);
      }

      .zg-btn-green {
        background: linear-gradient(135deg, #00a84f, #00dd86);
      }

      .zg-btn-gold,
      .zg-coupon-download {
        background: linear-gradient(135deg, #b57a00, #ffd45a);
        color: #231200;
      }

      .zg-btn-white {
        background: rgba(255,255,255,0.92);
        color: #16040b;
      }

      .zg-small-btn {
        padding: 10px 14px;
        font-size: 13px;
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.18);
      }

      .zg-topbar {
        position: relative;
        z-index: 4;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        max-width: 760px;
        width: 100%;
        margin: 0 auto;
      }

      .zg-top-list {
        display: grid;
        gap: 12px;
        margin-top: 20px;
      }

      .zg-top-card {
        display: grid;
        grid-template-columns: 86px 1fr;
        gap: 14px;
        align-items: center;
        width: 100%;
        padding: 14px;
        border-radius: 24px;
        border: 2px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.08);
        color: #fff;
        text-align: left;
      }

      .zg-top-card.selected {
        border-color: #ffd45a;
        background: rgba(255,212,90,0.14);
        box-shadow: 0 0 0 3px rgba(255,212,90,0.15);
      }

      .zg-top-icon {
        position: relative;
        display: grid;
        place-items: center;
        width: 74px;
        height: 74px;
        border-radius: 50%;
        font-size: 36px;
        background:
          radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), transparent 22%),
          conic-gradient(from 0deg, var(--c1), var(--c2), var(--c1));
        box-shadow: 0 0 24px color-mix(in srgb, var(--c1), transparent 45%);
      }

      .zg-top-name {
        font-size: 18px;
        font-weight: 900;
      }

      .zg-top-type {
        margin-top: 2px;
        color: #ffd45a;
        font-size: 13px;
        font-weight: 800;
      }

      .zg-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-top: 10px;
      }

      .zg-stat {
        padding: 7px 5px;
        border-radius: 12px;
        background: rgba(0,0,0,0.22);
        text-align: center;
      }

      .zg-stat span {
        display: block;
        color: rgba(255,255,255,0.62);
        font-size: 11px;
      }

      .zg-stat strong {
        display: block;
        margin-top: 2px;
        font-size: 14px;
      }

      .zg-battle-box {
        position: relative;
        width: min(92vw, 560px);
        height: min(92vw, 560px);
        max-height: 62vh;
        min-height: 360px;
        margin: 18px auto 14px;
        border-radius: 50%;
        overflow: hidden;
        border: 8px solid rgba(255,255,255,0.12);
        box-shadow:
          inset 0 0 60px rgba(0,0,0,0.65),
          0 20px 60px rgba(0,0,0,0.55);
      }

      .zg-arena-ring {
        position: absolute;
        inset: 10%;
        border-radius: 50%;
        border: 2px dashed rgba(255,255,255,0.18);
        pointer-events: none;
      }

      .zg-battle-top {
        position: absolute;
        z-index: 8;
        display: grid;
        place-items: center;
        width: 68px;
        height: 68px;
        border-radius: 50%;
        font-size: 30px;
        background:
          radial-gradient(circle at 34% 28%, rgba(255,255,255,0.92), transparent 18%),
          conic-gradient(from 0deg, var(--c1), var(--c2), var(--c1), var(--c2), var(--c1));
        box-shadow:
          0 0 18px var(--c1),
          inset 0 0 18px rgba(0,0,0,0.4);
        will-change: transform, left, top;
      }

      .zg-battle-top span {
        position: relative;
        z-index: 2;
      }

      .zg-player-top {
        outline: 3px solid rgba(87,242,255,0.62);
      }

      .zg-enemy-top {
        outline: 3px solid rgba(255,78,78,0.62);
      }

      .zg-panel {
        max-width: 560px;
        margin: 0 auto;
        padding: 14px;
        border-radius: 22px;
        background: rgba(0,0,0,0.36);
        backdrop-filter: blur(10px);
      }

      .zg-hp-row {
        display: grid;
        grid-template-columns: 34px 1fr 48px;
        gap: 8px;
        align-items: center;
        margin: 8px 0;
        font-size: 13px;
        font-weight: 800;
      }

      .zg-hp-bar {
        height: 12px;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255,255,255,0.14);
      }

      .zg-hp-fill {
        height: 100%;
        width: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #00d4ff, #06c755);
        transition: width 0.18s ease;
      }

      #zg-enemy-hp {
        background: linear-gradient(90deg, #ff4b4b, #ffd45a);
      }

      .zg-commentary {
        margin-top: 12px;
        min-height: 42px;
        color: rgba(255,255,255,0.88);
        font-size: 14px;
        line-height: 1.45;
      }

      .zg-charge-layer {
        position: absolute;
        z-index: 30;
        inset: 0;
        display: none;
        place-items: center;
        padding: 20px;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(8px);
      }

      .zg-charge-layer.active {
        display: grid;
      }

      .zg-charge-card {
        width: min(92vw, 420px);
        padding: 24px;
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(40,5,10,0.96), rgba(8,3,8,0.96));
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 24px 80px rgba(0,0,0,0.65);
        text-align: center;
      }

      .zg-charge-top-preview {
        display: grid;
        place-items: center;
        width: 92px;
        height: 92px;
        margin: 0 auto 12px;
        border-radius: 50%;
        font-size: 42px;
        background:
          radial-gradient(circle at 34% 28%, rgba(255,255,255,0.92), transparent 18%),
          conic-gradient(from 0deg, var(--c1), var(--c2), var(--c1));
        animation: zgSpin 0.8s linear infinite;
      }

      .zg-charge-title {
        font-size: 28px;
        font-weight: 900;
      }

      .zg-charge-subtitle,
      .zg-charge-tip {
        margin-top: 6px;
        color: rgba(255,255,255,0.72);
        font-size: 14px;
      }

      .zg-charge-meter {
        position: relative;
        height: 28px;
        margin: 22px 0;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
      }

      .zg-charge-zone {
        position: absolute;
        top: 0;
        bottom: 0;
      }

      .zg-charge-zone.weak {
        left: 0;
        width: 60%;
        background: rgba(255,255,255,0.08);
      }

      .zg-charge-zone.good {
        left: 60%;
        width: 18%;
        background: rgba(0,212,255,0.22);
      }

      .zg-charge-zone.perfect {
        left: 78%;
        width: 14%;
        background: rgba(255,212,90,0.38);
      }

      .zg-charge-fill {
        position: absolute;
        z-index: 2;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        border-radius: 999px;
        background: linear-gradient(90deg, #e60012, #ffd45a);
      }

      .zg-charge-marker {
        position: absolute;
        z-index: 3;
        top: -5px;
        bottom: -5px;
        width: 4px;
        left: 0%;
        background: #fff;
        box-shadow: 0 0 14px #fff;
      }

      .zg-charge-btn {
        width: 100%;
        background: linear-gradient(135deg, #e60012, #ffd45a);
        color: #180409;
      }

      .zg-charge-layer.perfect .zg-charge-card {
        box-shadow: 0 0 42px rgba(255,212,90,0.55), 0 24px 80px rgba(0,0,0,0.65);
      }

      .zg-rank {
        display: grid;
        place-items: center;
        width: 112px;
        height: 112px;
        margin: 48px auto 16px;
        border-radius: 50%;
        font-size: 62px;
        font-weight: 1000;
        color: #180409;
        background: linear-gradient(135deg, #ffd45a, #fff2a4);
        box-shadow: 0 0 38px rgba(255,212,90,0.5);
      }

      .zg-coupon,
      .zg-rankbox {
        margin-top: 16px;
        padding: 18px;
        border-radius: 24px;
        background: rgba(0,0,0,0.34);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .zg-coupon-label {
        color: #ffd45a;
        font-weight: 900;
      }

      .zg-coupon-code {
        margin-top: 8px;
        font-size: 26px;
        font-weight: 1000;
        letter-spacing: 0.04em;
      }

      .zg-coupon-note {
        margin-top: 6px;
        color: rgba(255,255,255,0.68);
        font-size: 13px;
      }

      .zg-coupon-download {
        margin-top: 12px;
        width: 100%;
      }

      .zg-rankbox-title {
        margin-bottom: 10px;
        font-weight: 900;
      }

      .zg-rank-row {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 8px;
        align-items: center;
        padding: 9px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .zg-rank-row.me {
        color: #ffd45a;
        font-weight: 900;
      }

      .zg-flash-overlay,
      .zg-danger-vignette,
      .zg-xtreme-zone,
      .zg-pocket-zone {
        pointer-events: none;
      }

      .zg-flash-overlay {
        position: absolute;
        z-index: 20;
        inset: 0;
        opacity: 0;
        background: rgba(255,255,255,0.65);
      }

      .zg-flash-overlay.hit {
        animation: zgFlash 0.2s ease-out;
      }

      .zg-danger-vignette {
        position: absolute;
        z-index: 3;
        inset: 0;
        opacity: 0;
        background: radial-gradient(circle, transparent 42%, rgba(230,0,18,0.44));
        transition: opacity 0.2s ease;
      }

      .zg-danger-vignette.active {
        opacity: 1;
      }

      .zg-spark,
      .zg-impact-ring,
      .zg-metal-spark,
      .zg-scratch,
      .zg-launch-shockwave,
      .zg-spin-afterimage,
      .zg-impact-streak,
      .zg-burst-piece,
      .zg-wall-flash {
        position: absolute;
        z-index: 18;
        pointer-events: none;
      }

      .zg-spark {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 18px #ffd45a;
        animation: zgSpark 0.42s ease-out forwards;
      }

      .zg-impact-ring,
      .zg-launch-shockwave {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 3px solid rgba(255,212,90,0.85);
        transform: translate(-50%, -50%);
        animation: zgRing 0.48s ease-out forwards;
      }

      .zg-metal-spark {
        width: 5px;
        height: 24px;
        border-radius: 999px;
        background: linear-gradient(#fff, #ffd45a, #e60012);
        transform: translate(-50%, -50%) rotate(var(--r)) translateY(var(--d));
        animation: zgMetal 0.48s ease-out forwards;
      }

      .zg-scratch {
        width: 52px;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.75);
        box-shadow: 0 0 12px rgba(255,212,90,0.7);
        animation: zgScratch 0.62s ease-out forwards;
      }

      .zg-spin-afterimage {
        border-radius: 50%;
        transform: translate(-50%, -50%);
        border: 2px solid rgba(87,242,255,0.5);
        animation: zgAfter 0.68s ease-out forwards;
      }

      .zg-impact-streak {
        height: 8px;
        border-radius: 999px;
        transform-origin: left center;
        background: linear-gradient(90deg, transparent, #fff);
        animation: zgStreak 0.42s ease-out forwards;
      }

      .zg-burst-piece {
        width: 14px;
        height: 14px;
        border-radius: 4px;
        background: #ffd45a;
        animation: zgBurst 0.68s ease-out forwards;
      }

      .zg-wall-flash {
        width: 68px;
        height: 12px;
        border-radius: 999px;
        background: #fff;
        box-shadow: 0 0 20px #ffd45a;
        animation: zgWall 0.42s ease-out forwards;
      }

      .shake {
        animation: zgShake 0.22s linear;
      }

      .big-shake {
        animation: zgBigShake 0.3s linear;
      }

      .punch,
      .zg-collision-zoom {
        animation: zgPunch 0.24s ease-out;
      }

      .zg-killcam {
        animation: zgKillcam 0.62s ease-out;
      }

      .impact-squash {
        animation: zgSquash 0.22s ease-out;
      }

      .zg-top-wobble {
        animation: zgWobble 0.38s ease-in-out infinite;
      }

      .zg-ground-grind {
        filter: brightness(1.4) saturate(1.25);
      }

      .win-pulse {
        animation: zgWinPulse 0.9s ease-in-out infinite;
      }

      .zg-defeated {
        opacity: 0.28 !important;
        filter: grayscale(1);
      }

      .zg-low-spin-warning {
        animation: zgLowWarn 0.6s ease-in-out infinite alternate;
      }

      @keyframes zgSpin {
        to { transform: rotate(360deg); }
      }

      @keyframes zgFlash {
        0% { opacity: 0; }
        25% { opacity: 1; }
        100% { opacity: 0; }
      }

      @keyframes zgSpark {
        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        to { transform: translate(-50%, -50%) scale(5); opacity: 0; }
      }

      @keyframes zgRing {
        from { width: 18px; height: 18px; opacity: 1; }
        to { width: 190px; height: 190px; opacity: 0; }
      }

      @keyframes zgMetal {
        from { opacity: 1; }
        to { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r)) translateY(calc(var(--d) * 1.5)); }
      }

      @keyframes zgScratch {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes zgAfter {
        from { opacity: 0.75; transform: translate(-50%, -50%) scale(0.5); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(1.6); }
      }

      @keyframes zgStreak {
        from { opacity: 1; }
        to { opacity: 0; transform: scaleX(0.2); }
      }

      @keyframes zgBurst {
        to {
          opacity: 0;
          transform: translate(var(--bx), var(--by)) rotate(var(--br));
        }
      }

      @keyframes zgWall {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes zgShake {
        0%,100% { transform: translate(0,0); }
        25% { transform: translate(3px,-2px); }
        50% { transform: translate(-3px,2px); }
        75% { transform: translate(2px,2px); }
      }

      @keyframes zgBigShake {
        0%,100% { transform: translate(0,0); }
        20% { transform: translate(7px,-5px); }
        40% { transform: translate(-6px,5px); }
        60% { transform: translate(5px,6px); }
        80% { transform: translate(-4px,-5px); }
      }

      @keyframes zgPunch {
        0% { transform: scale(1); }
        35% { transform: scale(1.035); }
        100% { transform: scale(1); }
      }

      @keyframes zgKillcam {
        0% { transform: scale(1); filter: saturate(1); }
        40% { transform: scale(1.06); filter: saturate(1.55) contrast(1.1); }
        100% { transform: scale(1); filter: saturate(1); }
      }

      @keyframes zgSquash {
        0% { transform: translate(-50%, -50%) scale(1.18, 0.82); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }

      @keyframes zgWobble {
        0%,100% { margin-left: 0; margin-top: 0; }
        25% { margin-left: 2px; margin-top: -1px; }
        50% { margin-left: -2px; margin-top: 1px; }
        75% { margin-left: 1px; margin-top: 2px; }
      }

      @keyframes zgWinPulse {
        0%,100% { box-shadow: 0 0 18px var(--c1), inset 0 0 18px rgba(0,0,0,0.4); }
        50% { box-shadow: 0 0 38px #ffd45a, inset 0 0 18px rgba(0,0,0,0.4); }
      }

      @keyframes zgLowWarn {
        from { filter: brightness(1); }
        to { filter: brightness(1.6); }
      }

      @media (max-width: 480px) {
        .zg-screen {
          padding: 16px;
        }

        .zg-title {
          font-size: 42px;
        }

        .zg-battle-box {
          width: 92vw;
          height: 92vw;
          min-height: 330px;
        }

        .zg-top-card {
          grid-template-columns: 76px 1fr;
        }

        .zg-stats {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `;

    document.head.appendChild(style);
  }

  /*
   * =========================================================
   * Init
   * =========================================================
   */

  function init() {
    ensureAppHeight();
    ensureBasicDom();

    injectCoreStyles();
    injectBackgroundStyles();

    watchMenuDom();
    removeMenuDom();
    removeLogoDom();

    state.selectedTop = loadSelectedTop();

    injectVisualEnhancements();

    removeMenuDom();
    removeLogoDom();

    renderTopSelection();
    renderFriendRank();
    bindEvents();

    const bottomCopyBtn = $('#zg-copy-coupon');

    if (bottomCopyBtn) {
      bottomCopyBtn.remove();
    }

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

    removeMenuDom();
    removeLogoDom();

    setTimeout(removeMenuDom, 300);
    setTimeout(removeMenuDom, 1000);
    setTimeout(removeMenuDom, 2000);

    setTimeout(removeLogoDom, 300);
    setTimeout(removeLogoDom, 1000);
    setTimeout(removeLogoDom, 2000);

    console.info(`[ZeloGame] Loaded game.js v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
