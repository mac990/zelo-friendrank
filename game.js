/*
 * ZELO GAME JS
 * CSS Matched Complete Replacement
 * Version: 202607121438
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
 *
 * Patch:
 * - Battle duration capped within 8 seconds
 * - Whole battle box is now the arena
 * - Expanded battle boundary area
 * - Added wall rebound acceleration feel
 * - Added wall flash effect
 * - Added finish rules:
 *   Spin Finish = 1 point
 *   Over Finish = 2 points
 *   Burst Finish = 2 points
 *   Xtreme Finish = 3 points
 * - Added outer pocket zones and center xtreme zone
 * - Stronger bounce / collision / rebound behavior
 * - Added charge launch system with top preview and ripcord visual:
 *   選陀螺 → 進戰鬥蓄力畫面 → 按住蓄力 → 放開發射
 */

(() => {
  'use strict';

  const VERSION = '202607121438';

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

    // 高速短局：8 秒內分勝負
    initialSpeed: 8.2,
    maxSpeed: 15.8,

    // 8 秒制：保留戰鬥張力，但不拖太久
    friction: 0.9914,
    spinDecay: 0.9962,

    // 牆壁回彈加強
    wallRestitution: 1.02,
    hitRestitution: 1.08,

    // 傷害提高，短時間內可出結果
    hitDamageBase: 4.9,

    // 尋敵較強，增加碰撞頻率
    seekForceMax: 0.051,
    tangentForce: 0.036,

    // 最長 8 秒
    battleLimit: 8000,

    // 避免低速完全停住
    minMotion: 0.72,

    // 碰撞轉速損耗
    spinLossOnHit: 0.032,

    // 撞牆轉速損耗
    railSpinLoss: 0.034
  };

  const FINISH = {
    spin: {
      label: 'Spin Finish',
      points: 1
    },
    over: {
      label: 'Over Finish',
      points: 2
    },
    burst: {
      label: 'Burst Finish',
      points: 2
    },
    xtreme: {
      label: 'Xtreme Finish',
      points: 3
    }
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
    killcamPlayed: false,

    // 蓄力發射狀態
    charging: false,
    launchPower: 0,
    chargeDir: 1,
    chargeRaf: null
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

    // 保留 DOM，但 CSS 會隱藏它，避免舊 CSS / 舊 JS 找不到節點
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
   * Charge launch DOM / logic
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
    state.lastFrame = 0;
    state.firstCollision = false;
    state.killcamPlayed = false;
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

  function burstPieces(x, y, count = 12) {
    const box = battleBox();

    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'zg-burst-piece';
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 120;

      p.style.setProperty('--bx', `${Math.cos(a) * d}px`);
      p.style.setProperty('--by', `${Math.sin(a) * d}px`);
      p.style.setProperty('--br', `${Math.round(rand(180, 720))}deg`);

      box.appendChild(p);
      setTimeout(() => p.remove(), 680);
    }
  }

  function wallFlash(x, y, nx, ny, power = 1) {
    const box = battleBox();
    const el = document.createElement('div');

    el.className = 'zg-wall-flash';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    const angle = Math.atan2(ny, nx) * 180 / Math.PI;
    el.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scale(${clamp(power, 0.8, 1.8)})`;

    box.appendChild(el);
    setTimeout(() => el.remove(), 420);
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

    const padX = Math.max(12, PHY.radius * 0.42);
    const padY = Math.max(12, PHY.radius * 0.42);

    return {
      w,
      h,
      cx: w / 2,
      cy: h / 2,

      // 擴大可活動區：只保留少量 padding
      left: padX,
      right: w - padX,
      top: padY,
      bottom: h - padY,

      // 中央極限區
      xtremeX: w / 2,
      xtremeY: h / 2,
      xtremeR: Math.min(w, h) * 0.14,

      // 四個擊飛口袋區更靠外
      pockets: [
        { x: 4, y: h * 0.5, r: 68 },
        { x: w - 4, y: h * 0.5, r: 68 },
        { x: w * 0.5, y: 4, r: 68 },
        { x: w * 0.5, y: h - 4, r: 68 }
      ]
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

    const startX = side === 'player' ? arena.w * 0.21 : arena.w * 0.79;
    const startY = side === 'player' ? arena.h * 0.64 : arena.h * 0.36;

    const launchAngle = side === 'player'
      ? rand(-0.72, 0.12)
      : Math.PI + rand(-0.12, 0.72);

    const baseSpeed = PHY.initialSpeed * f.launchKick * (0.9 + top.speed / 220);

    // 8 秒短局 HP
    const maxHp = 78 + top.defense * 0.19 + top.stamina * 0.19;

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
      angularSpeed: 32 + top.speed * 0.18,
      damageMul: top.type === 'attack' ? 1.2 : 1,
      damageTakenMul: top.type === 'defense' ? 0.78 : 1,
      spinDecayMul: top.type === 'stamina' ? 0.78 : 1,
      frictionMul: f.friction,
      restitutionMul: top.type === 'defense' ? 0.82 : top.type === 'attack' ? 1.14 : 1,
      lastRail: 0,
      comebackUsed: false,
      dead: false,

      // Finish rule data
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
    body.el.classList.toggle('zg-top-wobble', body.spinRatio < 0.22);
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

    const calcPowerRatio = body => {
      const hpRatio = clamp(body.hp / body.maxHp, 0, 1);
      const spinRatio = clamp(body.spinRatio, 0, 1);

      // 8 秒局：轉速比重提高
      return clamp(hpRatio * 0.48 + spinRatio * 0.52, 0, 1);
    };

    const pr = calcPowerRatio(b.player);
    const er = calcPowerRatio(b.enemy);

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
   * Battle physics and feel
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
    shockwave(b.enemy.x, b.enemy.y);

    afterimage(b.player.x, b.player.y, perfect ? 128 : 96);
    afterimage(b.enemy.x, b.enemy.y, 96);

    if (perfect) {
      metalSparks(b.player.x, b.player.y, 28, 1.45);
      flash();
      setCommentary('完美發射！你的陀螺帶著爆發轉速衝入競技場！');
    } else if (good) {
      metalSparks(b.player.x, b.player.y, 18, 1.05);
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

    const pf = getFeel(p.top);
    const ef = getFeel(e.top);

    Sound.updateHum(0, p.spinRatio, pf.humBase, pf.humGain);
    Sound.updateHum(1, e.spinRatio, ef.humBase, ef.humGain);

    const danger = ensureDangerVignette();
    danger.classList.toggle('active', p.spinRatio < 0.22 || e.spinRatio < 0.22);

    if (Math.random() < 0.2) {
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

    const tune = body => {
      if (body.top.type === 'attack') return 1.24;
      if (body.top.type === 'defense') return 0.74;
      if (body.top.type === 'stamina') return 0.84;
      return 1;
    };

    const distanceMul = d > 170 ? 1.28 : d > 95 ? 1 : 0.56;

    const fa = PHY.seekForceMax * tune(a) * distanceMul * (0.55 + a.spinRatio * 0.95);
    const fb = PHY.seekForceMax * tune(b) * distanceMul * (0.55 + b.spinRatio * 0.95);

    const orbit = Math.sin(now() * 0.0022) > 0 ? 1 : -1;
    const ta = PHY.tangentForce * (0.45 + a.spinRatio * 0.55);
    const tb = PHY.tangentForce * (0.45 + b.spinRatio * 0.55);

    const closeMul = d < a.radius + b.radius + 32 ? 0.28 : 1;

    a.vx += (nx * fa * closeMul + -ny * ta * orbit) * dt;
    a.vy += (ny * fa * closeMul + nx * ta * orbit) * dt;

    b.vx += (-nx * fb * closeMul + ny * tb * orbit) * dt;
    b.vy += (-ny * fb * closeMul + -nx * tb * orbit) * dt;
  }

  function applyFriction(body, dt) {
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
      body.spin *= 1 - clamp((speed - 5.2) * 0.0038 * dt, 0, 0.024);
    }

    const hpRatio = clamp(body.hp / body.maxHp, 0, 1);

    body.spinRatio = clamp(body.spin * 0.78 + hpRatio * 0.22, 0, 1);

    if (body.spinRatio < 0.28) {
      const wob = (0.28 - body.spinRatio) * 0.3;
      body.vx += rand(-wob, wob) * dt;
      body.vy += rand(-wob, wob) * dt;
    }

    const v = Math.hypot(body.vx, body.vy);

    if (v < PHY.minMotion && body.spinRatio > 0.08) {
      const a = Math.random() * Math.PI * 2;
      body.vx += Math.cos(a) * 0.14;
      body.vy += Math.sin(a) * 0.14;
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

    // 基礎反射
    body.vx -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * nx;
    body.vy -= (1 + PHY.wallRestitution * body.restitutionMul) * vn * ny;

    // 牆壁回彈加速：撞得越正、速度越快，彈回越明顯
    const power = clamp(Math.abs(vn) / 5.2, 0.35, 2.7);
    const reboundBoost = clamp(0.55 + power * 0.72, 0.55, 2.25);

    body.vx += nx * reboundBoost;
    body.vy += ny * reboundBoost;

    // 切線甩尾，讓撞牆後像被壁面導回場內
    const sideKick = clamp(Math.abs(tangentV) * 0.07, 0.12, 0.82);
    const dir = Math.random() > 0.5 ? 1 : -1;

    body.vx += -ny * sideKick * dir;
    body.vy += nx * sideKick * dir;

    // 往場內推一點，避免卡牆
    body.x += nx * 5;
    body.y += ny * 5;

    // 允許撞牆後短暫變快，但限制極端速度
    const maxReboundV = PHY.maxSpeed * (0.98 + body.top.speed / 240);
    const afterV = Math.hypot(body.vx, body.vy);

    if (afterV > maxReboundV) {
      body.vx = body.vx / afterV * maxReboundV;
      body.vy = body.vy / afterV * maxReboundV;
    }

    body.hp -= power * 0.96 * body.damageTakenMul;
    body.spin *= 1 - PHY.railSpinLoss * power * 0.82;

    const speedAfter = Math.hypot(body.vx, body.vy);
    const boosted = speedAfter > speedBefore * 1.08 || power > 1.15;

    const t = now();

    if (t - body.lastRail > 70) {
      body.lastRail = t;

      Sound.rail(power);
      restartClass(battleBox(), 'wall-hit', 260);
      restartClass(battleBox(), power > 1.08 ? 'big-shake' : 'shake', power > 1.08 ? 360 : 230);

      metalSparks(body.x, body.y, 12 + Math.round(power * 7), power * 1.15);
      scratch(body.x, body.y, body.vx, body.vy, power > 0.95);

      if (boosted) {
        afterimage(body.x, body.y, 106);
        impactRing(body.x, body.y);
        flash();
        restartClass(body.el, 'zg-wall-rebound-top', 260);
        restartClass(battleBox(), 'zg-wall-rebound-box', 360);
        wallFlash(body.x, body.y, nx, ny, power);
      }

      setCommentary(power > 1.25
        ? '壁面強力回彈！陀螺像彈簧一樣加速衝回場內！'
        : '撞上壁面後彈回！速度重新拉起來了！'
      );
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

    const power = clamp(rel / 5.4, 0.35, 3.05);

    const restitution =
      PHY.hitRestitution *
      (0.84 + frontalRatio * 0.42) *
      ((a.restitutionMul + b.restitutionMul) / 2);

    const impulse = -(1 + restitution) * normalVel / (1 / a.mass + 1 / b.mass);
    const ix = impulse * nx;
    const iy = impulse * ny;

    a.vx -= ix / a.mass;
    a.vy -= iy / a.mass;
    b.vx += ix / b.mass;
    b.vy += iy / b.mass;

    // 側切削弱，但主要讓陀螺彈開，不要黏住摩擦
    const sideFriction = clamp(sideRatio * 0.08, 0.01, 0.1);
    const tx = -ny;
    const ty = nx;

    a.vx += tx * tangentVel * sideFriction / a.mass;
    a.vy += ty * tangentVel * sideFriction / a.mass;
    b.vx -= tx * tangentVel * sideFriction / b.mass;
    b.vy -= ty * tangentVel * sideFriction / b.mass;

    const frontalDamageMul = 0.88 + frontalRatio * 1.05;
    const sideSpinMul = 0.72 + sideRatio * 0.86;

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

    a.hp -= damageA;
    b.hp -= damageB;

    const spinLossA = PHY.spinLossOnHit * power * sideSpinMul * (1.08 / a.mass);
    const spinLossB = PHY.spinLossOnHit * power * sideSpinMul * (1.08 / b.mass);

    a.spin *= 1 - clamp(spinLossA, 0.012, 0.125);
    b.spin *= 1 - clamp(spinLossB, 0.012, 0.125);

    if (a.top.type === 'attack' && frontalRatio > 0.65) {
      a.spin *= 0.986;
    }

    if (b.top.type === 'attack' && frontalRatio > 0.65) {
      b.spin *= 0.986;
    }

    // 爆裂值：高衝擊、正面撞擊、攻擊型更容易累積
    const burstGainA =
      power *
      frontalRatio *
      (b.top.type === 'attack' ? 1.35 : 1) *
      (a.top.type === 'defense' ? 0.72 : 1);

    const burstGainB =
      power *
      frontalRatio *
      (a.top.type === 'attack' ? 1.35 : 1) *
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

    // 撞擊彈飛：讓對撞後明顯分開，增加下一次碰撞距離
    const burstKick = clamp(power * (0.78 + frontalRatio * 1.35), 0.28, 3.15);
    const sideKick = clamp(sideRatio * power * 0.62, 0, 1.45);

    a.vx -= nx * burstKick / a.mass;
    a.vy -= ny * burstKick / a.mass;
    b.vx += nx * burstKick / b.mass;
    b.vy += ny * burstKick / b.mass;

    a.vx += -ny * sideKick;
    a.vy += nx * sideKick;
    b.vx -= -ny * sideKick;
    b.vy -= nx * sideKick;

    if (power > 1.15) {
      a.spin *= 0.982;
      b.spin *= 0.982;
      afterimage(a.x, a.y, 92);
      afterimage(b.x, b.y, 92);
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

    const frontal = approach > tangent * 0.92;
    const sharp = (fa.hitSharpness + fb.hitSharpness) / 2;
    const sparkMul = Math.max(fa.sparkMul, fb.sparkMul) * power;

    Sound.metal(power, sharp);

    spark(x, y);
    impactRing(x, y);

    metalSparks(
      x,
      y,
      frontal ? 28 + Math.round(power * 9) : 16 + Math.round(power * 6),
      sparkMul
    );

    flash();

    restartClass(a.el, 'impact-squash', 230);
    restartClass(b.el, 'impact-squash', 230);

    impactStreak(a);
    impactStreak(b);

    if (frontal) {
      restartClass(battleBox(), power > 1.2 ? 'big-shake' : 'shake', power > 1.2 ? 420 : 280);
      restartClass(battleBox(), 'zg-collision-zoom', 320);

      if (power > 1.35) {
        restartClass(battleBox(), 'zg-launch-impact', 540);
        afterimage(a.x, a.y, 104);
        afterimage(b.x, b.y, 104);
      }

      setCommentary(
        power > 1.35
          ? '超重擊正面對撞！雙方被炸開後再度衝向對手！'
          : '正面碰撞！金屬衝擊讓陀螺瞬間彈開！'
      );

      if (!state.firstCollision) {
        state.firstCollision = true;
        restartClass(battleBox(), 'zg-killcam', 760);
      }
    } else {
      restartClass(battleBox(), 'punch', 240);

      const sideForce = 0.38 * power;

      a.vx += -ny * sideForce;
      a.vy += nx * sideForce;
      b.vx -= -ny * sideForce;
      b.vy -= nx * sideForce;

      scratch(x, y, rvx, rvy, power > 1.1);

      setCommentary(
        power > 1.15
          ? '高速側切！陀螺被削歪後彈向壁面！'
          : '側面擦撞！軌跡被改變，準備下一次對撞！'
      );
    }

    if (Math.abs(a.spinRatio - b.spinRatio) > 0.22 && relSpeed > 3.6) {
      const loser = a.spinRatio > b.spinRatio ? b : a;

      if (loser?.el) {
        loser.el.classList.add('zg-ground-grind');
        setTimeout(() => loser.el.classList.remove('zg-ground-grind'), 280);
      }

      Sound.grind(power);
      metalSparks(loser.x, loser.y, 10, 0.8);
      setCommentary('轉速壓制！弱勢陀螺被壓到擦地噴火！');
    }
  }

  function tryComeback(body) {
    if (!body || body.comebackUsed || body.dead) return false;

    const hpRatio = body.hp / body.maxHp;
    const spinRatio = body.spinRatio;

    if (spinRatio > 0.2 || hpRatio > 0.32) return false;

    let chance = 0.05;
    if (body.top.type === 'stamina') chance = 0.12;
    if (body.top.type === 'balance') chance = 0.08;
    if (body.top.type === 'attack') chance = 0.07;
    if (body.top.type === 'defense') chance = 0.04;

    if (Math.random() > chance) return false;

    body.comebackUsed = true;

    const f = getFeel(body.top);
    const angle = Math.random() * Math.PI * 2;
    const burst = 4.8 * f.launchKick;

    body.vx += Math.cos(angle) * burst;
    body.vy += Math.sin(angle) * burst;
    body.spinRatio = Math.min(0.42, body.spinRatio + 0.16);
    body.spin = Math.min(0.6, body.spin + 0.16);
    body.hp = Math.min(body.maxHp * 0.34, body.hp + body.maxHp * 0.06);

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

    const powerScore = body => {
      const hpRatio = clamp(body.hp / body.maxHp, 0, 1);
      const spinRatio = clamp(body.spinRatio, 0, 1);
      return hpRatio * 0.46 + spinRatio * 0.54;
    };

    const pPower = powerScore(p);
    const ePower = powerScore(e);

    let winner = null;
    let loser = null;
    let reason = '';
    let finish = 'spin';
    let points = 1;

    const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
    const recentHit = body => now() - Number(body.lastHitAt || 0) < 1500;

    // 1. Xtreme Finish：被撞入中央極限區，3 分
    const pInXtreme =
      dist(p.x, p.y, b.arena.xtremeX, b.arena.xtremeY) < b.arena.xtremeR &&
      p.lastHitPower > 0.95 &&
      recentHit(p);

    const eInXtreme =
      dist(e.x, e.y, b.arena.xtremeX, b.arena.xtremeY) < b.arena.xtremeR &&
      e.lastHitPower > 0.95 &&
      recentHit(e);

    if (pInXtreme && p.lastHitBy === e) {
      winner = e;
      loser = p;
      finish = 'xtreme';
      points = 3;
      reason = 'Xtreme Finish！你的陀螺被打入中央極限區。';
    }

    if (eInXtreme && e.lastHitBy === p) {
      winner = p;
      loser = e;
      finish = 'xtreme';
      points = 3;
      reason = 'Xtreme Finish！你將對手打入中央極限區。';
    }

    // 2. Over Finish：進入外圍擊飛口袋區，2 分
    if (!winner) {
      const inPocket = body => b.arena.pockets.some(pk => dist(body.x, body.y, pk.x, pk.y) < pk.r);

      if (inPocket(p) && p.lastHitBy === e && recentHit(p)) {
        winner = e;
        loser = p;
        finish = 'over';
        points = 2;
        reason = 'Over Finish！你的陀螺被擊飛到外圍口袋區。';
      }

      if (inPocket(e) && e.lastHitBy === p && recentHit(e)) {
        winner = p;
        loser = e;
        finish = 'over';
        points = 2;
        reason = 'Over Finish！你將對手擊飛到外圍口袋區。';
      }
    }

    // 3. Burst Finish：爆裂，2 分
    if (!winner) {
      const burstLimit = 4.45;

      if (p.burstGauge >= burstLimit && p.lastHitBy === e) {
        winner = e;
        loser = p;
        finish = 'burst';
        points = 2;
        reason = 'Burst Finish！你的陀螺卡榫鬆脫爆裂。';
      }

      if (e.burstGauge >= burstLimit && e.lastHitBy === p) {
        winner = p;
        loser = e;
        finish = 'burst';
        points = 2;
        reason = 'Burst Finish！對手陀螺被你的撞擊打到爆裂。';
      }
    }

    // 4. Spin Finish：停止旋轉，1 分
    if (!winner) {
      if (pPower <= 0.12 || p.spinRatio <= 0.08 || p.hp <= -4) {
        winner = e;
        loser = p;
        finish = 'spin';
        points = 1;
        reason = 'Spin Finish！你的陀螺比對手更早停止旋轉。';
      }

      if (ePower <= 0.12 || e.spinRatio <= 0.08 || e.hp <= -4) {
        winner = p;
        loser = e;
        finish = 'spin';
        points = 1;
        reason = 'Spin Finish！對手陀螺先停止旋轉。';
      }
    }

    // 5. 最長 8 秒強制判定
    if (!winner && elapsed >= PHY.battleLimit) {
      if (pPower >= ePower) {
        winner = p;
        loser = e;
        reason = 'Spin Finish！時間終了，你的剩餘轉速更高。';
      } else {
        winner = e;
        loser = p;
        reason = 'Spin Finish！時間終了，對手剩餘轉速更高。';
      }

      finish = 'spin';
      points = 1;
    }

    if (!winner) return false;

    b.ended = true;
    loser.dead = true;
    loser.finishType = finish;
    winner.finishType = finish;
    b.finish = finish;
    b.points = points;

    if (finish === 'burst') {
      burstPieces(loser.x, loser.y, 18);
      restartClass(battleBox(), 'zg-launch-impact', 760);
      Sound.metal(2.2, 1.45);
      flash();
    }

    if (finish === 'over') {
      restartClass(battleBox(), 'zg-over-finish', 760);
      metalSparks(loser.x, loser.y, 32, 1.55);
      afterimage(loser.x, loser.y, 132);
      Sound.metal(1.9, 1.25);
    }

    if (finish === 'xtreme') {
      restartClass(battleBox(), 'zg-xtreme-finish', 920);
      metalSparks(loser.x, loser.y, 44, 1.85);
      afterimage(loser.x, loser.y, 150);
      flash();
      Sound.metal(2.3, 1.55);
    }

    playKillcam(loser, winner, finish);

    setTimeout(() => {
      endBattle(winner.side === 'player', reason, finish, points);
    }, 950);

    return true;
  }

  function playKillcam(loser, winner, finish = 'spin') {
    if (state.killcamPlayed) return;
    state.killcamPlayed = true;

    const box = battleBox();

    restartClass(box, finish === 'xtreme' ? 'zg-xtreme-finish' : 'zg-killcam', 1050);
    metalSparks(loser.x, loser.y, finish === 'spin' ? 22 : 34, finish === 'spin' ? 1.25 : 1.75);
    afterimage(loser.x, loser.y, finish === 'spin' ? 110 : 140);
    Sound.metal(finish === 'spin' ? 1.45 : 2.05, finish === 'burst' ? 1.45 : 1.25);

    if (finish === 'burst') {
      burstPieces(loser.x, loser.y, 14);
    }

    if (winner?.el) winner.el.classList.add('win-pulse');

    setTimeout(() => Sound.death(), 380);

    const label = FINISH[finish]?.label || 'Finish';
    setCommentary(`${label}！勝負即將揭曉！`);
  }

  function battleLoop(t) {
    if (!state.running || state.paused || !state.battle) return;

    const dtRaw = state.lastFrame ? (t - state.lastFrame) / 16.666 : 1;
    const dt = clamp(dtRaw, 0.35, 2.1);
    state.lastFrame = t;

    const b = state.battle;
    const p = b.player;
    const e = b.enemy;

    if (Math.random() < 0.025) {
      b.arena = getArenaInfo();
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
    $$('.zg-burst-piece', box).forEach(el => el.remove());
    $$('.zg-wall-flash', box).forEach(el => el.remove());

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
      'zg-wall-rebound-box'
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
    state.lastFrame = 0;
    state.firstCollision = false;
    state.killcamPlayed = false;

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

    // 開局朝中央推進，提高第一秒碰撞率
    const centerPull = 1.4;
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
      points: 0
    };

    syncBody(player);
    syncBody(enemy);
    updateHpBars();

    playLaunchSequence(launchPower);

    setTimeout(() => {
      state.lastFrame = 0;
      state.raf = requestAnimationFrame(battleLoop);
    }, 460);
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
    clearBattleObjects();
  }

  function endBattle(playerWon, reason, finish = 'spin', points = 1) {
    state.running = false;
    state.paused = false;

    cancelChargeLoop();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const finishInfo = FINISH[finish] || FINISH.spin;
    const finishBonus = Number(points || finishInfo.points || 1);

    const oldScore = getMyScore();

    const delta = playerWon
      ? 18 + finishBonus * 18 + Math.round(Math.random() * 8)
      : -(8 + Math.round(Math.random() * 8));

    const newScore = Math.max(0, oldScore + delta);

    setMyScore(newScore);
    updateFriendAfterBattle(playerWon, newScore);

    showScreen('result');

    const rank = $('#zg-result-rank') || $('.zg-rank');
    const title = $('#zg-result-title') || $('.zg-result-title');
    const subtitle = $('#zg-result-subtitle');
    const score = $('#zg-result-score');

    if (rank) rank.textContent = playerWon ? 'W' : 'L';

    if (title) {
      title.textContent = playerWon
        ? `勝利！${finishInfo.label} +${finishBonus}分`
        : `敗北…${finishInfo.label}`;
    }

    if (subtitle) {
      subtitle.textContent = reason || '';
    }

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
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        cancelChargeLoop();
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
