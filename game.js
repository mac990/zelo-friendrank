/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607140930-hp-only-fixed
 *
 * Structure:
 * 01. CORE / 共用設定與資料
 * 02. HELPERS / 共用工具
 * 03. AUDIO / 音效模組
 * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
 * 05. HOME PAGE / 首頁
 * 06. TOP SELECT PAGE / 選擇陀螺頁面
 * 07. LAUNCH PREP PAGE / 準備發射頁面
 * 08. BATTLE PAGE / 陀螺戰鬥頁面
 * 09. RESULT PAGE / 結果頁面
 * 10. TRACKING / 儀表板事件追蹤
 * 11. EVENTS / 全域事件綁定
 * 12. INIT / 啟動
 *
 * Rules:
 * - 保留目前美術 class
 * - 保留蓄力發射
 * - 保留戰鬥物理
 * - 保留碰撞扣血規則
 * - 牆壁反彈不扣 HP
 * - 只有陀螺碰撞扣 HP
 * - HP 歸零即停止並判定敗北
 * - 不因轉速歸零、時間到、中央決勝提前結束
 * - 補上 dashboard 事件追蹤
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const VERSION = "202607142227-boot-start-fixed";

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";
  
  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

  const EXTERNAL_TOP_PHOTO_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

const CHARGE = {
  weakMax: 0.45,
  normalMin: 0.45,
  goodMin: 0.72,
  perfectMin: 0.88,
  perfectMax: 0.91,
  overMin: 0.91,
  speed: 0.023
};


  const DAILY_LIMIT = 3;

  const STORAGE = {
    selectedType: "zelo_selected_top_type",
    myScore: "zelo_my_score",
    friends: "zelo_friend_rank",
    profile: "zg_profile",
    lastResult: "zg_last_result",
    lastCoupon: "zg_last_coupon",
    dailyPrefix: "zg_daily_play_"
  };

  const PHY = {
    radius: 34,
    ringPadding: 42,

    /*
     * Launch / Movement
     */
    initialSpeed: 9.6,
    maxSpeed: 18.5,

    /*
     * Natural Decay
     * 數值越接近 1，陀螺越不容易自然停下。
     */
    friction: 0.9965,
    spinDecay: 0.9972,

    /*
     * Wall
     * 牆壁只反彈與少量消耗轉速，不扣 HP。
     */
    wallRestitution: 0.96,

    /*
     * Top Collision
     * hitRestitution 控制彈開程度。
     * 低於 1 代表碰撞後會消耗動能。
     */
    hitRestitution: 0.88,

    /*
     * Energy Battle Model
     * 以碰撞造成的總能量損失作為扣血核心。
     */
    energyDamageScale: 1.9,
    spinDamageScale: 0.055,
    minCollisionEnergy: 0.22,
    maxCollisionDamage: 42,
    /*
     * Collision Control
     */
    collisionCooldown: 46,
    separationBias: 3.2,
    tangentTransfer: 0.085,

    /*
     * Arena Forces
     */
    seekForceMax: 0.045,
    tangentForce: 0.062,

    /*
     * Battle End Rule
     * true = 只有 HP 歸零才結束。
     * 不因轉速歸零、時間到、中央決勝提前結束。
     */
    hpOnlyFinish: true,

    /*
     * battleLimit 保留給非 HP-only 模式使用。
     * hpOnlyFinish = true 時不會使用時間判定。
     */
    battleLimit: 9000,
    minMotion: 0.7,

    /*
     * Stop Finish
     * 陀螺轉速 / 移動速度過低時，視為即將停止。
     * 持續一段時間後會判定 Spin Finish。
     */
    stopSpinThreshold: 0.055,
    stopSpeedThreshold: 0.45,
    stopGraceMs: 1300,

    /*
     * Spin Loss
     */
    spinLossOnEnergy: 0.014,
    railSpinLoss: 0.012
  };

  const FINISH = {
    spin: {
      label: "Spin Finish",
      points: 1
    },
    over: {
      label: "Over Finish",
      points: 2
    },
    burst: {
      label: "Burst Finish",
      points: 2
    },
    xtreme: {
      label: "Xtreme Finish",
      points: 3
    }
  };

  const COUPON_REWARDS = [
    {
      id: "coupon500",
      label: "500 元折扣券",
      amount: 500,
      codePrefix: "ZELO500",
      fixedCode: "ZELO500",
      rate: 0.01
    },
    {
      id: "coupon250",
      label: "250 元折扣券",
      amount: 250,
      codePrefix: "ZELO250",
      fixedCode: "ZELO250",
      rate: 0.29
    },
    {
      id: "coupon100",
      label: "100 元折扣券",
      amount: 100,
      codePrefix: "ZELO100",
      fixedCode: "ZELO100",
      rate: 0.7
    }
  ];

  const TOPS = [
    {
      id: "attack",
      name: "烈焰攻擊型",
      type: "attack",
      typeName: "攻擊型",
      emoji: "🔥",
      power: 96,
      defense: 58,
      stamina: 62,
      speed: 96,
      colorA: "#e60012",
      colorB: "#ffd45a"
    },
    {
      id: "defense",
      name: "鋼鐵防禦型",
      type: "defense",
      typeName: "防禦型",
      emoji: "🛡️",
      power: 64,
      defense: 98,
      stamina: 78,
      speed: 52,
      colorA: "#3fa9ff",
      colorB: "#d8f1ff"
    },
    {
      id: "stamina",
      name: "永恆耐久型",
      type: "stamina",
      typeName: "耐久型",
      emoji: "🌿",
      power: 62,
      defense: 72,
      stamina: 98,
      speed: 58,
      colorA: "#06c755",
      colorB: "#c7ffd9"
    },
    {
      id: "balance",
      name: "星環平衡型",
      type: "balance",
      typeName: "平衡型",
      emoji: "✨",
      power: 78,
      defense: 76,
      stamina: 76,
      speed: 76,
      colorA: "#9b5cff",
      colorB: "#57f2ff"
    }
  ];

  const FEEL = {
    attack: {
      label: "攻擊型",
      launchKick: 1.24,
      sparkMul: 1.75,
      hitSharpness: 1.42,
      stability: 0.78,
      friction: 1.08,
      humBase: 155,
      humGain: 1.38
    },
    defense: {
      label: "防禦型",
      launchKick: 0.9,
      sparkMul: 0.9,
      hitSharpness: 0.76,
      stability: 1.48,
      friction: 0.84,
      humBase: 92,
      humGain: 0.88
    },
    stamina: {
      label: "耐久型",
      launchKick: 0.94,
      sparkMul: 0.8,
      hitSharpness: 0.92,
      stability: 1.24,
      friction: 0.68,
      humBase: 118,
      humGain: 0.74
    },
    balance: {
      label: "平衡型",
      launchKick: 1.04,
      sparkMul: 1.05,
      hitSharpness: 1.05,
      stability: 1,
      friction: 1,
      humBase: 122,
      humGain: 1
    }
  };

  const PERF = {
    lowFx: false,

    lastFxAt: 0,
    lastScratchAt: 0,
    lastAfterimageAt: 0,
    lastShockwaveAt: 0,
    lastCollisionTrackAt: 0,

    activeFx: 0,

    /*
     * 手機 LIFF 內不要放太多即時 DOM 特效。
     */
    maxFx: 24,
    maxSparksPerHit: 6,

    minFxGap: 70,
    minScratchGap: 180,
    minAfterimageGap: 220,
    minShockwaveGap: 320,
    minCollisionTrackGap: 650,

    frameSlowCount: 0
  };

  const state = {
    screen: "start",

    profile: null,
    inviterId: "",
    inviterName: "",

    selectedTop: null,
    enemyTop: null,

    battle: null,
    raf: null,
    running: false,
    paused: false,
    lastFrame: 0,

    firstCollision: false,
    killcamPlayed: false,

    lastEffectiveHitAt: 0,
    stuckBoostAt: 0,
    damagePressure: 1,
    
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
    lastPerfectSoundAt: 0,

    lastCouponReward: null,
    lastBattleResult: null,

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    resultLogged: false,

    eventsBound: false,
    booted: false
  };

  /*
   * =========================================================
   * 02. HELPERS / 共用工具
   * =========================================================
   */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const now = () => performance.now();

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function safeString(value) {
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function escapeHtml(value) {
    return safeString(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function getUrlParam(name) {
    try {
      const params = new URLSearchParams(location.search);
      return params.get(name) || "";
    } catch (error) {
      return "";
    }
  }

  function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function getDailyKey() {
    return `${STORAGE.dailyPrefix}${getTodayKey()}`;
  }

  function loadDailyLimit() {
    let used = 0;

    try {
      used = Number(localStorage.getItem(getDailyKey()) || 0);
    } catch (error) {
      used = 0;
    }

    state.playsUsed = used;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - used);

    return {
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    };
  }

  function increaseDailyPlay() {
    loadDailyLimit();

    state.playsUsed += 1;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - state.playsUsed);

    try {
      localStorage.setItem(getDailyKey(), String(state.playsUsed));
    } catch (error) {}

    return {
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    };
  }

  function isDailyBlocked() {
    loadDailyLimit();
    return state.remainingPlays <= 0;
  }

  function getFeel(top) {
    return FEEL[top?.type] || FEEL.balance;
  }

  function getMyScore() {
    return Number(localStorage.getItem(STORAGE.myScore) || 1200);
  }

  function setMyScore(score) {
    localStorage.setItem(STORAGE.myScore, String(Math.max(0, Math.round(score))));
  }

  function saveSelectedTop(top) {
    if (!top) return;

    try {
      localStorage.setItem(STORAGE.selectedType, top.id);
    } catch (error) {}
  }

  function loadSelectedTop() {
    let id = "attack";

    try {
      id = localStorage.getItem(STORAGE.selectedType) || "attack";
    } catch (error) {}

    return TOPS.find((top) => top.id === id) || TOPS[0];
  }

  function getProfile() {
    if (window.ZELO_PROFILE) return window.ZELO_PROFILE;

    if (state.profile) return state.profile;

    try {
      const saved = localStorage.getItem(STORAGE.profile);
      if (saved) return JSON.parse(saved);
    } catch (error) {}

    return null;
  }

  function getUserId() {
    const profile = getProfile() || {};
    return profile.userId || profile.id || profile.uid || "";
  }

  function getPlayerName() {
    const profile = getProfile() || {};
    return profile.displayName || profile.name || profile.playerName || "你";
  }

  function restartClass(el, cls, duration = 300) {
    if (!el) return;

    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);

    setTimeout(() => {
      el.classList.remove(cls);
    }, duration);
  }

  function setCommentary(text) {
    const el = $(".zg-commentary");
    if (el) el.textContent = text;
  }

  function setText(selector, text, root = document) {
    const el = $(selector, root);
    if (el) el.textContent = text;
  }

  function setDisplay(selector, display, root = document) {
    const el = $(selector, root);
    if (el) el.style.display = display;
  }

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
    if (dtRaw > 1.45) {
      PERF.frameSlowCount++;
    } else {
      PERF.frameSlowCount = Math.max(0, PERF.frameSlowCount - 1);
    }

    PERF.lowFx = PERF.frameSlowCount > 12;
  }

  function fxCount(base, intensity = 1) {
    const mul = PERF.lowFx ? 0.42 : 1;
    return Math.max(2, Math.round(base * intensity * mul));
  }

  /*
   * =========================================================
   * 03. AUDIO / 音效模組
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

      if (c && c.state === "suspended") {
        try {
          c.resume();
        } catch (error) {}
      }
    }

    function tone(freq, duration, gain, type = "sine", endFreq = null) {
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

      filter.type = "bandpass";
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
      tone(82, 0.28, 0.48, "sine", 42);
      tone(190, 0.12, 0.22, "triangle", 110);
      noise(0.11, 0.18, 1600);
    }

    function chargeTick(power = 0.5) {
      resume();

      const p = clamp(power, 0, 1);

      if (Math.random() < 0.18) {
        tone(110 + p * 220, 0.035, 0.035 + p * 0.035, "triangle", 80 + p * 180);
      }
    }

    function chargePerfect() {
      resume();
      tone(880, 0.08, 0.13, "triangle", 1320);
      tone(1760, 0.06, 0.08, "sine", 880);
    }

    function metal(power = 1, sharpness = 1) {
      resume();

      const p = clamp(power, 0.25, 2);

      tone(820 * sharpness, 0.06, 0.14 * p, "square", 260 * sharpness);
      tone(2400 * sharpness, 0.035, 0.055 * p, "sawtooth", 900);
      noise(0.055, 0.18 * p, 3400 * sharpness);
    }

    function rail(power = 1) {
      resume();

      const p = clamp(power, 0.25, 1.8);

      tone(420, 0.1, 0.13 * p, "triangle", 180);
      noise(0.06, 0.16 * p, 2100);
    }

    function grind(power = 1) {
      resume();
      noise(0.12, 0.1 * power, 1200);
      tone(110, 0.12, 0.06 * power, "sawtooth", 80);
    }

    function death() {
      resume();
      tone(180, 0.75, 0.24, "sawtooth", 38);
      noise(0.42, 0.12, 700);
    }

    function createHum(base) {
      const c = ensure();
      if (!c || !master) return null;

      const osc = c.createOscillator();
      const filter = c.createBiquadFilter();
      const g = c.createGain();

      osc.type = "sawtooth";
      osc.frequency.value = base;

      filter.type = "lowpass";
      filter.frequency.value = 520;

      g.gain.value = 0.001;

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);

      osc.start();

      return {
        osc,
        filter,
        gain: g
      };
    }

    function startHum(index, base) {
      resume();

      if (index === 0 && humA) {
        try {
          humA.osc.stop();
        } catch (error) {}

        humA = null;
      }

      if (index === 1 && humB) {
        try {
          humB.osc.stop();
        } catch (error) {}

        humB = null;
      }

      const h = createHum(base);

      if (index === 0) {
        humA = h;
      } else {
        humB = h;
      }
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

      [humA, humB].forEach((h) => {
        if (!h) return;

        h.gain.gain.setTargetAtTime(0.001, c.currentTime, 0.1);

        setTimeout(() => {
          try {
            h.osc.stop();
          } catch (error) {}
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
   * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
   * =========================================================
   */

  function appRoot() {
    return $("#zelo-liff-game") || $("#zg-app") || $("#app") || document.body;
  }

  function screenStart() {
    return $("#screen-start") || $("#screen-home");
  }

  function screenSelect() {
    return $("#screen-select");
  }

  function screenBattle() {
    return $("#screen-battle");
  }

  function screenResult() {
    return $("#screen-result");
  }

  function removeDuplicateScreenDom() {
    const ids = [
      "screen-start",
      "screen-home",
      "screen-select",
      "screen-battle",
      "screen-result"
    ];

    ids.forEach((id) => {
      const nodes = Array.from(document.querySelectorAll(`[id="${id}"]`));

      if (nodes.length <= 1) return;

      nodes.slice(1).forEach((node) => {
        try {
          node.remove();
        } catch (error) {}
      });
    });
  }

  function ensureAppHeight() {
    const set = () => {
      document.documentElement.style.setProperty("--zg-app-height", `${window.innerHeight}px`);
    };

    set();

    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", () => {
      setTimeout(set, 250);
    });
  }

  function showScreen(name) {
    state.screen = name;

    removeDuplicateScreenDom();

    const map = {
      start: screenStart(),
      home: screenStart(),
      select: screenSelect(),
      battle: screenBattle(),
      result: screenResult()
    };

    const target = map[name] || screenStart();

    $$(".zg-screen").forEach((screen) => {
      screen.classList.remove("active", "is-active");
      screen.hidden = true;
      screen.style.setProperty("display", "none", "important");
      screen.setAttribute("aria-hidden", "true");
    });

    if (target) {
      target.classList.add("active", "is-active");
      target.hidden = false;
      target.style.setProperty("display", "flex", "important");
      target.style.setProperty("flex-direction", "column", "important");
      target.style.setProperty("pointer-events", "auto", "important");
      target.setAttribute("aria-hidden", "false");

      $$(
        "[data-zg-action], .zg-btn, .zg-small-btn, .zg-top-card, .zg-charge-btn",
        target
      ).forEach((el) => {
        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("position", "relative", "important");
        el.style.setProperty("z-index", "10", "important");
      });
    }

    document.body.setAttribute("data-zg-screen", name);

    removeMenuDom();
    removeLogoDom();

    if (name === "start" || name === "home") {
      onHomeShown();
    }

    if (name === "select") {
      onSelectShown();
    }

    if (name === "battle") {
      onBattleShown();
    }

    if (name === "result") {
      onResultShown();
    }
  }

  function battleBox() {
    return $(".zg-battle-box") || $("#zg-battle-box") || screenBattle() || appRoot();
  }

    function ensureBasicDom() {
    const root = appRoot();

    removeDuplicateScreenDom();

    ensureHomeDom(root);
    ensureSelectDom(root);
    ensureResultDom(root);

    removeDuplicateScreenDom();
    removeLogoDom();
  }

  function removeMenuDom() {
    const selectors = [
      "header",
      "nav",
      ".site-header",
      ".header",
      ".navbar",
      ".navigation",
      ".menu",
      ".drawer",
      ".drawer-menu",
      ".mobile-menu",
      "#menu",
      "#shopify-section-header",
      ".shopify-section-header",
      ".announcement-bar",
      "#shopify-section-announcement-bar",
      ".header-wrapper",
      ".shopify-section-group-header-group"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.closest("#zelo-liff-game") || el.closest("#zg-app")) return;

        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("height", "0px", "important");
        el.style.setProperty("min-height", "0px", "important");
        el.style.setProperty("max-height", "0px", "important");
        el.style.setProperty("overflow", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
      });
    });
  }

  function removeLogoDom() {
    const root = appRoot();

    $$(".zg-brand", root).forEach((el) => el.remove());
    $$(".zg-pill", root).forEach((el) => el.remove());
    $$(".zg-bg-logo", root).forEach((el) => el.remove());
    $$(".zg-fixed-logo", root).forEach((el) => el.remove());

    $$(".zg-topbar", root).forEach((bar) => {
      const hasUsefulButton = $(".zg-small-btn", bar);

      if (hasUsefulButton) {
        bar.classList.add("zg-topbar-no-logo");
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
      } catch (error) {}
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
    const old = $("#zg-bg-style");

    if (old) {
      old.remove();
    }

    const style = document.createElement("style");
    style.id = "zg-bg-style";

    style.textContent = `
      :root {
        --zg-home-bg-image: url('${BG_IMAGE_URL}');
        --zg-arena-bg-image: url('${ARENA_LOGO_URL}');
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
        overflow-x: hidden !important;
        box-sizing: border-box !important;
      }

      .zg-screen[hidden],
      .zg-screen:not(.active):not(.is-active) {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      .zg-screen.active,
      .zg-screen.is-active {
        display: flex !important;
        flex-direction: column !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      body[data-zg-screen="start"] #screen-result,
      body[data-zg-screen="home"] #screen-result,
      body[data-zg-screen="select"] #screen-result,
      body[data-zg-screen="battle"] #screen-result {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      body[data-zg-screen="result"] #screen-start,
      body[data-zg-screen="result"] #screen-home,
      body[data-zg-screen="result"] #screen-select,
      body[data-zg-screen="result"] #screen-battle {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }

      /*
       * Battle page 2/3 + 1/3 base layout.
       * JS ensureChargeDom() 會再用 inline style 強化。
       */
      #screen-battle {
        height: var(--zg-app-height, 100vh) !important;
        min-height: var(--zg-app-height, 100vh) !important;
        max-height: var(--zg-app-height, 100vh) !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      #screen-battle .zg-main {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 10px !important;
        width: 100% !important;
        max-width: none !important;
        height: calc(var(--zg-app-height, 100vh) - 76px) !important;
        min-height: 0 !important;
        padding: 0 10px 10px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      #screen-battle .zg-battle-box {
        position: relative !important;
        flex: 0 0 calc(66.666% - 5px) !important;
        width: min(100%, 860px) !important;
        height: calc(66.666% - 5px) !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 auto !important;
        aspect-ratio: auto !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        z-index: 1 !important;
      }

      #screen-battle .zg-panel {
        position: relative !important;
        flex: 0 0 calc(33.333% - 5px) !important;
        width: min(100%, 860px) !important;
        height: calc(33.333% - 5px) !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        z-index: 10 !important;
      }

      /*
       * 關鍵修正：
       * 發射器不可以 absolute / inset:0，
       * 否則一定會蓋住戰鬥盤。
       */
      #screen-battle .zg-charge-layer,
      .zg-charge-layer {
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        right: auto !important;
        top: auto !important;
        bottom: auto !important;
        transform: none !important;
        flex: 0 0 calc(33.333% - 5px) !important;
        width: min(100%, 860px) !important;
        height: calc(33.333% - 5px) !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 auto !important;
        z-index: 20 !important;
        align-items: stretch !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      #screen-battle .zg-charge-card,
      .zg-charge-card {
        position: relative !important;
        inset: auto !important;
        left: auto !important;
        right: auto !important;
        top: auto !important;
        bottom: auto !important;
        transform: none !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 860px !important;
        min-height: 0 !important;
        max-height: none !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        pointer-events: auto !important;
        z-index: 21 !important;
        overflow: hidden !important;
      }

      #screen-battle .zg-charge-btn,
      .zg-charge-btn {
        position: relative !important;
        z-index: 22 !important;
        pointer-events: auto !important;
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
        position: relative !important;
        overflow: hidden !important;
        isolation: isolate !important;
        background-image:
          radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 28%,
            rgba(0, 0, 0, 0.36) 70%,
            rgba(0, 0, 0, 0.68) 100%
          ) !important;
        background-color: #160b18 !important;
      }

      .zg-arena-logo {
        position: absolute !important;
        left: 50% !important;
        top: 50% !important;
        width: 72% !important;
        height: 40% !important;
        transform: translate(-50%, -50%) rotate(-8deg) !important;
        background-image: var(--zg-arena-bg-image) !important;
        background-size: contain !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
        opacity: 0.32 !important;
        mix-blend-mode: screen !important;
        filter: invert(1) brightness(2.2) contrast(1.25) !important;
        pointer-events: none !important;
        z-index: 1 !important;
      }

      .zg-energy-grid,
      .zg-stardust,
      .zg-star,
      .zg-hero,
      .zg-bg-logo,
      .zg-fixed-logo,
      .zg-arena-ring,
      .zg-flash-overlay,
      .zg-xtreme-zone,
      .zg-pocket-zone,
      .zg-danger-vignette {
        pointer-events: none !important;
      }

      .zg-arena-ring {
        position: absolute !important;
        inset: 0 !important;
        z-index: 2 !important;
        pointer-events: none !important;
      }

      .zg-xtreme-zone,
      .zg-pocket-zone,
      .zg-danger-vignette {
        position: absolute !important;
        z-index: 3 !important;
        pointer-events: none !important;
      }

      .zg-flash-overlay {
        position: absolute !important;
        inset: 0 !important;
        z-index: 40 !important;
        pointer-events: none !important;
      }

      .zg-battle-top {
        position: absolute !important;
        z-index: 20 !important;
        pointer-events: none !important;
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
        position: absolute !important;
        z-index: 30 !important;
        pointer-events: none !important;
      }

      [data-zg-action],
      .zg-btn,
      .zg-small-btn,
      .zg-top-card {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10 !important;
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

      .zg-hp-fill.zg-hp-hit-pulse {
        animation: zgHpHitPulse 260ms ease-out;
      }

      @keyframes zgHpHitPulse {
        0% {
          filter: brightness(2.2) saturate(1.8);
          box-shadow:
            0 0 12px rgba(255, 255, 255, 0.95),
            0 0 22px rgba(255, 80, 80, 0.85);
        }

        100% {
          filter: brightness(1) saturate(1);
          box-shadow: none;
        }
      }

      /*
       * Result page mobile adaptive layout
       */
      #screen-result {
        height: var(--zg-app-height, 100vh) !important;
        min-height: var(--zg-app-height, 100vh) !important;
        max-height: var(--zg-app-height, 100vh) !important;
        flex-direction: column !important;
        overflow: hidden !important;
        padding: 0 !important;
        box-sizing: border-box !important;
      }

      #screen-result.active,
      #screen-result.is-active {
        display: flex !important;
      }

      #screen-result[hidden],
      #screen-result:not(.active):not(.is-active) {
        display: none !important;
      }

      #screen-result .zg-result-main {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        width: 100% !important;
        display: flex !important;
        align-items: stretch !important;
        justify-content: center !important;
        padding: 8px 10px 4px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      #screen-result .zg-result-card {
        width: min(100%, 430px) !important;
        height: 100% !important;
        max-height: 100% !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        padding: clamp(10px, 2.4vh, 16px) !important;
        gap: clamp(6px, 1.2vh, 10px) !important;
      }

      #screen-result .zg-result-rank-wrap {
        flex: 0 0 auto !important;
        display: flex !important;
        justify-content: center !important;
        margin: 0 !important;
      }

      #screen-result .zg-rank {
        width: clamp(48px, 8vh, 76px) !important;
        height: clamp(48px, 8vh, 76px) !important;
        min-width: clamp(48px, 8vh, 76px) !important;
        min-height: clamp(48px, 8vh, 76px) !important;
        font-size: clamp(22px, 4.4vh, 36px) !important;
        line-height: 1 !important;
      }

      #screen-result .zg-result-title {
        flex: 0 0 auto !important;
        margin: 0 !important;
        font-size: clamp(20px, 3.2vh, 30px) !important;
        line-height: 1.1 !important;
        text-align: center !important;
      }

      #screen-result .zg-result-desc {
        flex: 0 0 auto !important;
        margin: 0 !important;
        font-size: clamp(12px, 1.7vh, 15px) !important;
        line-height: 1.25 !important;
        text-align: center !important;
      }

      #screen-result .zg-result-stats {
        flex: 0 0 auto !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 6px !important;
        margin: 0 !important;
      }

      #screen-result .zg-result-stat {
        min-width: 0 !important;
        padding: clamp(5px, 1vh, 8px) !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-result-stat span {
        display: block !important;
        font-size: clamp(10px, 1.45vh, 12px) !important;
        line-height: 1.1 !important;
        white-space: nowrap !important;
      }

      #screen-result .zg-result-stat b {
        display: block !important;
        font-size: clamp(12px, 1.8vh, 16px) !important;
        line-height: 1.15 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      #screen-result .zg-coupon {
        flex: 0 0 auto !important;
        margin: 0 !important;
        padding: clamp(7px, 1.3vh, 10px) !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-coupon-label {
        font-size: clamp(11px, 1.55vh, 13px) !important;
        line-height: 1.15 !important;
        margin-bottom: 3px !important;
      }

      #screen-result .zg-coupon-code {
        font-size: clamp(20px, 3vh, 30px) !important;
        line-height: 1.05 !important;
        letter-spacing: 0.04em !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }

      #screen-result .zg-coupon-note {
        font-size: clamp(10px, 1.45vh, 12px) !important;
        line-height: 1.2 !important;
        margin-top: 3px !important;
      }

      #screen-result .zg-coupon-copy,
      #screen-result .zg-coupon-download {
        min-height: 30px !important;
        height: clamp(30px, 4.3vh, 38px) !important;
        padding: 0 10px !important;
        margin-top: 5px !important;
        font-size: clamp(12px, 1.7vh, 14px) !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        letter-spacing: 0 !important;
        text-align: center !important;
        text-align-last: center !important;
      }

      #screen-result .zg-rankbox {
        flex: 1 1 auto !important;
        min-height: 72px !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        margin: 0 !important;
        padding: clamp(7px, 1.2vh, 10px) !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-rankbox-title {
        flex: 0 0 auto !important;
        font-size: clamp(12px, 1.7vh, 14px) !important;
        line-height: 1.15 !important;
        margin-bottom: 5px !important;
      }

      #screen-result #zg-friend-rank-list {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch !important;
        overscroll-behavior: contain !important;
        padding-right: 2px !important;
      }

      #screen-result .zg-rank-row {
        display: grid !important;
        grid-template-columns: 28px minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 6px !important;
        min-height: 28px !important;
        padding: 4px 2px !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-rank-num,
      #screen-result .zg-rank-name,
      #screen-result .zg-rank-score,
      #screen-result .zg-rank-empty,
      #screen-result .zg-rank-invite-tip {
        font-size: clamp(11px, 1.55vh, 13px) !important;
        line-height: 1.2 !important;
      }

      #screen-result .zg-rank-name {
        min-width: 0 !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #screen-result .zg-rank-invite-tip {
        flex: 0 0 auto !important;
        margin-top: 5px !important;
      }

      #screen-result .zg-bottom.zg-result-actions {
        flex: 0 0 auto !important;
        width: min(100%, 430px) !important;
        margin: 0 auto !important;
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 8px !important;
        padding: 6px 10px calc(8px + env(safe-area-inset-bottom)) !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-bottom.zg-result-actions .zg-btn {
        width: 100% !important;
        min-width: 0 !important;
        height: clamp(38px, 5.4vh, 48px) !important;
        min-height: 38px !important;
        max-height: 48px !important;
        padding: 0 8px !important;
        box-sizing: border-box !important;
        font-size: clamp(13px, 1.9vh, 16px) !important;
        line-height: 1 !important;
        white-space: nowrap !important;
        word-break: keep-all !important;
        letter-spacing: 0 !important;
        word-spacing: 0 !important;
        text-align: center !important;
        text-align-last: center !important;
        justify-content: center !important;
      }

      #screen-result .zg-btn,
      #screen-result button {
        letter-spacing: 0 !important;
        word-spacing: 0 !important;
        text-align-last: center !important;
      }

      @media (max-height: 700px) {
        #screen-result .zg-result-main {
          padding-top: 5px !important;
        }

        #screen-result .zg-result-card {
          padding: 8px !important;
          gap: 5px !important;
        }

        #screen-result .zg-coupon-download,
        #screen-result .zg-result-desc {
          display: none !important;
        }

        #screen-result .zg-rankbox {
          min-height: 58px !important;
        }

        #screen-result .zg-bottom.zg-result-actions {
          gap: 6px !important;
          padding-top: 5px !important;
        }
      }

      @media (max-height: 620px) {
        #screen-result .zg-coupon-note {
          display: none !important;
        }

        #screen-result .zg-rank {
          width: 46px !important;
          height: 46px !important;
          min-width: 46px !important;
          min-height: 46px !important;
          font-size: 22px !important;
        }

        #screen-result .zg-coupon-copy {
          height: 30px !important;
          min-height: 30px !important;
        }

        #screen-result .zg-bottom.zg-result-actions .zg-btn {
          height: 36px !important;
          min-height: 36px !important;
          font-size: 13px !important;
        }
      }

      @media (max-width: 360px) {
        #screen-result .zg-result-main {
          padding-left: 7px !important;
          padding-right: 7px !important;
        }

        #screen-result .zg-bottom.zg-result-actions {
          padding-left: 7px !important;
          padding-right: 7px !important;
          gap: 6px !important;
        }

        #screen-result .zg-bottom.zg-result-actions .zg-btn {
          font-size: 12px !important;
          padding-left: 4px !important;
          padding-right: 4px !important;
        }

        #screen-result .zg-coupon-code {
          font-size: 22px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

      function injectBattleEmergencyFixStyles() {
    const old = document.querySelector("#zg-battle-emergency-fix-style");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "zg-battle-emergency-fix-style";

    style.textContent = `
      /*
       * =====================================================
       * 移除戰鬥頁上方灰色遮罩 / header 背景
       * =====================================================
       */

      body[data-zg-screen="battle"] #screen-battle > .zg-topbar,
      body[data-zg-screen="battle"] #screen-battle .zg-topbar {
        position: absolute !important;
        top: 6px !important;
        right: 10px !important;
        left: auto !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        background-image: none !important;
        border: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        pointer-events: none !important;
        overflow: visible !important;
        z-index: 99999 !important;
      }

      body[data-zg-screen="battle"] #screen-battle > .zg-topbar::before,
      body[data-zg-screen="battle"] #screen-battle > .zg-topbar::after,
      body[data-zg-screen="battle"] #screen-battle .zg-topbar::before,
      body[data-zg-screen="battle"] #screen-battle .zg-topbar::after {
        display: none !important;
        content: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-topbar .zg-small-btn {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 100000 !important;
        height: 38px !important;
        min-height: 38px !important;
        width: auto !important;
        padding: 0 18px !important;
        border-radius: 999px !important;
        color: #fff !important;
        font-weight: 900 !important;
        background: rgba(38, 46, 60, 0.92) !important;
        border: 1px solid rgba(255,255,255,0.24) !important;
        box-shadow: 0 6px 18px rgba(0,0,0,0.35) !important;
      }

      /*
       * =====================================================
       * 戰鬥頁版面
       * =====================================================
       */

      body[data-zg-screen="battle"] #screen-battle {
        height: var(--zg-app-height, 100vh) !important;
        min-height: var(--zg-app-height, 100vh) !important;
        max-height: var(--zg-app-height, 100vh) !important;
        overflow: hidden !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-main {
        padding-top: 48px !important;
        height: var(--zg-app-height, 100vh) !important;
        min-height: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      /*
       * =====================================================
       * 強制陀螺維持圓形，避免被舊 CSS 拉成長條
       * =====================================================
       */

      body[data-zg-screen="battle"] #screen-battle .zg-battle-top,
      body[data-zg-screen="battle"] .zg-battle-top,
      body[data-zg-screen="battle"] .zg-player-top,
      body[data-zg-screen="battle"] .zg-enemy-top {
        position: absolute !important;
        width: 68px !important;
        height: 68px !important;
        min-width: 68px !important;
        min-height: 68px !important;
        max-width: 68px !important;
        max-height: 68px !important;
        border-radius: 999px !important;
        aspect-ratio: 1 / 1 !important;
        padding: 0 !important;
        margin: 0 !important;
        inset: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        overflow: hidden !important;
        pointer-events: none !important;
        z-index: 20 !important;
        background:
          radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), transparent 18%),
          conic-gradient(from 0deg, var(--c1, #ff3d3d), var(--c2, #ffd84a), var(--c1, #ff3d3d)) !important;
        box-shadow:
          0 0 18px rgba(255,90,80,0.48),
          inset 0 0 12px rgba(0,0,0,0.25) !important;
        border: 0 !important;
        outline: 0 !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-battle-top::before,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-top::after,
      body[data-zg-screen="battle"] .zg-battle-top::before,
      body[data-zg-screen="battle"] .zg-battle-top::after,
      body[data-zg-screen="battle"] .zg-player-top::before,
      body[data-zg-screen="battle"] .zg-player-top::after,
      body[data-zg-screen="battle"] .zg-enemy-top::before,
      body[data-zg-screen="battle"] .zg-enemy-top::after {
        display: none !important;
        content: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-battle-top span,
      body[data-zg-screen="battle"] .zg-battle-top span {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        height: 100% !important;
        font-size: 30px !important;
        line-height: 1 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        transform: none !important;
      }

      /*
       * =====================================================
       * 蓄力條：強制白條改成能量條
       * v2 / v3 都吃得到
       * =====================================================
       */

      body[data-zg-screen="battle"] #screen-battle .zg-charge-meter,
      body[data-zg-screen="battle"] #screen-battle .zg-charge-meter-v2,
      body[data-zg-screen="battle"] #screen-battle .zg-charge-meter-v3 {
        position: relative !important;
        width: min(94%, 600px) !important;
        height: 58px !important;
        min-height: 58px !important;
        margin: 0 auto !important;
        display: flex !important;
        align-items: center !important;
        overflow: visible !important;
        filter: drop-shadow(0 8px 18px rgba(0,0,0,0.45)) !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-percent-badge {
        position: relative !important;
        z-index: 20 !important;
        width: 62px !important;
        height: 62px !important;
        min-width: 62px !important;
        margin-right: -24px !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: #fff !important;
        font-size: 20px !important;
        font-weight: 1000 !important;
        line-height: 1 !important;
        background: radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%) !important;
        border: 3px solid rgba(255,255,255,0.9) !important;
        box-shadow:
          0 0 0 4px rgba(255,48,112,0.22),
          0 8px 20px rgba(255,40,100,0.5),
          inset 0 2px 0 rgba(255,255,255,0.35) !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.45) !important;
        pointer-events: none !important;
        animation: zgEmergencyBadge 980ms ease-in-out infinite !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-bar-shell,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-shell {
        position: relative !important;
        flex: 1 1 auto !important;
        height: 42px !important;
        min-height: 42px !important;
        border-radius: 999px !important;
        border: 2px solid rgba(255,255,255,0.78) !important;
        background:
          linear-gradient(180deg, rgba(9,12,24,0.98), rgba(18,20,36,0.98)) !important;
        box-shadow:
          0 0 18px rgba(0,220,255,0.22),
          inset 0 0 18px rgba(0,0,0,0.95),
          inset 0 2px 0 rgba(255,255,255,0.13) !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        pointer-events: none !important;
        isolation: isolate !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-bar-shell::before,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-shell::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        z-index: 1 !important;
        background:
          linear-gradient(90deg, rgba(0,255,255,0.1), rgba(255,255,255,0.04), rgba(255,80,180,0.1)),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px) !important;
        opacity: 0.75 !important;
        pointer-events: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-bar-bg {
        display: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-fill,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-fill {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        height: 100% !important;
        width: 0% !important;
        min-width: 0 !important;
        border-radius: 999px !important;
        z-index: 4 !important;
        background:
          linear-gradient(90deg, #00e5ff 0%, #18ff7a 38%, #fff35a 72%, #ff3d7f 100%) !important;
        background-size: 180% 100% !important;
        box-shadow:
          0 0 16px rgba(0,245,255,0.75),
          inset 0 2px 0 rgba(255,255,255,0.3),
          inset 0 -8px 14px rgba(0,0,0,0.22) !important;
        transition: width 28ms linear, filter 120ms ease, background 120ms ease, box-shadow 120ms ease !important;
        pointer-events: none !important;
        overflow: hidden !important;
        will-change: width, filter, background-position !important;
        animation: zgEmergencyEnergyFlow 680ms linear infinite !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-fill::before,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-fill::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        background:
          repeating-linear-gradient(
            135deg,
            rgba(255,255,255,0.34) 0 8px,
            rgba(255,255,255,0.02) 8px 16px
          ) !important;
        mix-blend-mode: screen !important;
        opacity: 0.62 !important;
        animation: zgEmergencyStripes 520ms linear infinite !important;
        pointer-events: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-fill::after,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-fill::after {
        content: "" !important;
        position: absolute !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 90px !important;
        left: -120px !important;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent) !important;
        transform: skewX(-18deg) !important;
        animation: zgEmergencyShine 820ms ease-in-out infinite !important;
        pointer-events: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-perfect-zone,
      body[data-zg-screen="battle"] #screen-battle .zg-energy-perfect-zone {
        position: absolute !important;
        left: ${CHARGE.perfectMin * 100}% !important;
        top: 0 !important;
        width: ${(CHARGE.perfectMax - CHARGE.perfectMin) * 100}% !important;
        height: 100% !important;
        z-index: 8 !important;
        background:
          linear-gradient(
            90deg,
            rgba(255,255,255,0),
            rgba(255,255,255,0.95),
            rgba(255,240,90,0.75),
            rgba(255,255,255,0)
          ) !important;
        box-shadow:
          0 0 18px rgba(255,255,255,0.95),
          0 0 32px rgba(255,220,70,0.8) !important;
        pointer-events: none !important;
        animation: zgEmergencyPerfect 620ms ease-in-out infinite !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-layer[data-charge-grade="perfect"] .zg-charge-bar-shell,
      body[data-zg-screen="battle"] #screen-battle .zg-charge-layer[data-charge-grade="perfect"] .zg-energy-shell {
        box-shadow:
          0 0 18px rgba(255,255,255,0.95),
          0 0 34px rgba(255,220,70,0.9),
          inset 0 0 18px rgba(255,255,255,0.22) !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-charge-layer[data-charge-grade="over"] .zg-charge-bar-shell,
      body[data-zg-screen="battle"] #screen-battle .zg-charge-layer[data-charge-grade="over"] .zg-energy-shell {
        box-shadow:
          0 0 18px rgba(255,70,180,0.9),
          0 0 34px rgba(90,60,255,0.86),
          inset 0 0 18px rgba(255,255,255,0.14) !important;
      }

      @keyframes zgEmergencyEnergyFlow {
        0% {
          background-position: 0% 50%;
        }

        100% {
          background-position: 180% 50%;
        }
      }

      @keyframes zgEmergencyStripes {
        0% {
          transform: translateX(0);
        }

        100% {
          transform: translateX(24px);
        }
      }

      @keyframes zgEmergencyShine {
        0% {
          left: -130px;
          opacity: 0;
        }

        30% {
          opacity: 1;
        }

        100% {
          left: 100%;
          opacity: 0;
        }
      }

      @keyframes zgEmergencyPerfect {
        0%, 100% {
          opacity: 0.36;
          filter: brightness(1);
        }

        50% {
          opacity: 1;
          filter: brightness(1.8);
        }
      }

      @keyframes zgEmergencyBadge {
        0%, 100% {
          transform: scale(1);
        }

        50% {
          transform: scale(1.035);
        }
      }
    `;

    document.head.appendChild(style);
  }



  function injectEnergyChargeStyles() {
    const old = $("#zg-energy-charge-style");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "zg-energy-charge-style";

    style.textContent = `
      #screen-battle > .zg-topbar,
      #screen-battle .zg-topbar {
        position: absolute !important;
        top: 8px !important;
        right: 10px !important;
        left: auto !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        z-index: 9999 !important;
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        pointer-events: none !important;
        overflow: visible !important;
      }

      #screen-battle > .zg-topbar::before,
      #screen-battle > .zg-topbar::after,
      #screen-battle .zg-topbar::before,
      #screen-battle .zg-topbar::after {
        display: none !important;
        content: none !important;
      }

      #screen-battle > .zg-topbar .zg-small-btn,
      #screen-battle .zg-topbar .zg-small-btn {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10000 !important;
        width: auto !important;
        height: 38px !important;
        min-height: 38px !important;
        padding: 0 18px !important;
        border-radius: 999px !important;
        background: rgba(40, 48, 62, 0.92) !important;
        border: 1px solid rgba(255,255,255,0.22) !important;
        box-shadow: 0 6px 18px rgba(0,0,0,0.35) !important;
        color: #ffffff !important;
        font-weight: 900 !important;
      }

      #screen-battle .zg-main {
        padding-top: 48px !important;
      }

      .zg-charge-meter-v3 {
        position: relative !important;
      }

      .zg-energy-shell {
        position: relative !important;
        overflow: hidden !important;
        isolation: isolate !important;
      }

      .zg-energy-fill {
        position: absolute !important;
        overflow: hidden !important;
        will-change: width, filter, background-position !important;
        background-size: 180% 100% !important;
        animation: zgEnergyGradientFlow 680ms linear infinite !important;
      }

      .zg-energy-fill::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          repeating-linear-gradient(
            135deg,
            rgba(255,255,255,0.34) 0 8px,
            rgba(255,255,255,0.02) 8px 16px
          );
        mix-blend-mode: screen;
        opacity: 0.62;
        animation: zgEnergyStripes 520ms linear infinite;
        pointer-events: none;
      }

      .zg-energy-fill::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        width: 90px;
        left: -120px;
        background:
          linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.95),
            transparent
          );
        transform: skewX(-18deg);
        animation: zgEnergyShine 820ms ease-in-out infinite;
        pointer-events: none;
      }

      .zg-energy-scan {
        animation: zgEnergyScanPulse 520ms ease-in-out infinite;
      }

      .zg-energy-perfect-zone {
        animation: zgEnergyPerfectPulse 620ms ease-in-out infinite;
      }

      .zg-energy-cap {
        animation: zgEnergyCapPulse 420ms ease-in-out infinite;
      }

      .zg-charge-layer[data-charge-grade="perfect"] .zg-energy-shell {
        box-shadow:
          0 0 18px rgba(255,255,255,0.95),
          0 0 34px rgba(255,220,70,0.9),
          inset 0 0 18px rgba(255,255,255,0.22) !important;
      }

      .zg-charge-layer[data-charge-grade="over"] .zg-energy-shell {
        box-shadow:
          0 0 18px rgba(255,70,180,0.9),
          0 0 34px rgba(90,60,255,0.86),
          inset 0 0 18px rgba(255,255,255,0.14) !important;
      }

      .zg-charge-layer[data-charge-grade="perfect"] .zg-charge-percent-badge {
        animation: zgBadgePerfect 420ms ease-in-out infinite !important;
      }

      .zg-charge-percent-badge {
        animation: zgBadgeBreath 980ms ease-in-out infinite !important;
      }

      @keyframes zgEnergyGradientFlow {
        0% {
          background-position: 0% 50%;
        }

        100% {
          background-position: 180% 50%;
        }
      }

      @keyframes zgEnergyStripes {
        0% {
          transform: translateX(0);
        }

        100% {
          transform: translateX(24px);
        }
      }

      @keyframes zgEnergyShine {
        0% {
          left: -130px;
          opacity: 0;
        }

        30% {
          opacity: 1;
        }

        100% {
          left: 100%;
          opacity: 0;
        }
      }

      @keyframes zgEnergyScanPulse {
        0%, 100% {
          opacity: 0.28;
          filter: blur(0);
        }

        50% {
          opacity: 0.72;
          filter: blur(1px);
        }
      }

      @keyframes zgEnergyPerfectPulse {
        0%, 100% {
          opacity: 0.36;
          filter: brightness(1);
        }

        50% {
          opacity: 1;
          filter: brightness(1.8);
        }
      }

      @keyframes zgEnergyCapPulse {
        0%, 100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 0.85;
        }

        50% {
          transform: translate(-50%, -50%) scale(1.18);
          opacity: 1;
        }
      }

      @keyframes zgBadgeBreath {
        0%, 100% {
          transform: scale(1);
        }

        50% {
          transform: scale(1.035);
        }
      }

      @keyframes zgBadgePerfect {
        0%, 100% {
          transform: scale(1) rotate(-2deg);
          filter: brightness(1);
        }

        50% {
          transform: scale(1.12) rotate(2deg);
          filter: brightness(1.35);
        }
      }
    `;

    document.head.appendChild(style);
  }

  function injectHomeEmergencyFixStyles() {
  const old = document.querySelector("#zg-home-emergency-fix-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-home-emergency-fix-style";

  style.textContent = `
    body[data-zg-screen="start"] #screen-start .zg-bottom,
    body[data-zg-screen="home"] #screen-start .zg-bottom {
      position: relative !important;
      z-index: 9999 !important;
      pointer-events: auto !important;
      overflow: visible !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    body[data-zg-screen="start"] #screen-start .zg-btn,
    body[data-zg-screen="home"] #screen-start .zg-btn,
    body[data-zg-screen="start"] #screen-start [data-zg-action="start"],
    body[data-zg-screen="home"] #screen-start [data-zg-action="start"] {
      position: relative !important;
      z-index: 10000 !important;
      pointer-events: auto !important;
      overflow: hidden !important;
      isolation: isolate !important;
      background: linear-gradient(90deg, #ff3a3a, #d90018) !important;
      color: #ffffff !important;
      border: 0 !important;
      box-shadow: 0 10px 28px rgba(255,0,35,0.35) !important;
      text-align: center !important;
      text-align-last: center !important;
    }

    body[data-zg-screen="start"] #screen-start .zg-btn::before,
    body[data-zg-screen="start"] #screen-start .zg-btn::after,
    body[data-zg-screen="home"] #screen-start .zg-btn::before,
    body[data-zg-screen="home"] #screen-start .zg-btn::after,
    body[data-zg-screen="start"] #screen-start [data-zg-action="start"]::before,
    body[data-zg-screen="start"] #screen-start [data-zg-action="start"]::after,
    body[data-zg-screen="home"] #screen-start [data-zg-action="start"]::before,
    body[data-zg-screen="home"] #screen-start [data-zg-action="start"]::after {
      display: none !important;
      content: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
      width: 0 !important;
      height: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      border: 0 !important;
    }

    body[data-zg-screen="start"] #screen-start .zg-energy-grid,
    body[data-zg-screen="start"] #screen-start .zg-stardust,
    body[data-zg-screen="start"] #screen-start .zg-star,
    body[data-zg-screen="start"] #screen-start .zg-hero,
    body[data-zg-screen="home"] #screen-start .zg-energy-grid,
    body[data-zg-screen="home"] #screen-start .zg-stardust,
    body[data-zg-screen="home"] #screen-start .zg-star,
    body[data-zg-screen="home"] #screen-start .zg-hero {
      pointer-events: none !important;
    }
  `;

  document.head.appendChild(style);
}

  
function injectVisualEnhancements() {
  injectBackgroundStyles();
  injectEnergyChargeStyles();
  injectHomeEmergencyFixStyles();
  injectBattleEmergencyFixStyles();
  removeMenuDom();
    removeMenuDom();
    removeLogoDom();

    const root = appRoot();

    if (!$(".zg-energy-grid", root)) {
      const grid = document.createElement("div");
      grid.className = "zg-energy-grid";
      grid.setAttribute("aria-hidden", "true");
      grid.style.setProperty("pointer-events", "none", "important");
      grid.style.setProperty("z-index", "0", "important");
      root.prepend(grid);
    }

    ensureHomeVisualFx();
fixHomeButtonVisualNow();

if (screenBattle()) {
  ensureBattleVisualDom();
  fixBattleTopVisualNow();
}

    $$(".zg-energy-grid, .zg-stardust, .zg-star, .zg-hero", root).forEach((el) => {
      el.style.setProperty("pointer-events", "none", "important");
    });

    $$(
      ".zg-btn, .zg-small-btn, .zg-top-card, .zg-charge-btn, [data-zg-action]",
      root
    ).forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("z-index", "999", "important");
    });

    const battleBtn = $('[data-zg-action="battle"]', screenSelect());
    if (battleBtn) {
      battleBtn.disabled = false;
      battleBtn.style.setProperty("pointer-events", "auto", "important");
      battleBtn.style.setProperty("position", "relative", "important");
      battleBtn.style.setProperty("z-index", "1000", "important");
      battleBtn.style.setProperty("cursor", "pointer", "important");
    }

    fixBattleTopVisualNow();

    removeMenuDom();
    removeLogoDom();
  }

    function fixBattleTopVisualNow() {
    const battle = screenBattle();
    if (!battle) return;

    const topbars = $$(".zg-topbar", battle);

    topbars.forEach((bar) => {
      bar.style.setProperty("position", "absolute", "important");
      bar.style.setProperty("top", "6px", "important");
      bar.style.setProperty("right", "10px", "important");
      bar.style.setProperty("left", "auto", "important");
      bar.style.setProperty("width", "auto", "important");
      bar.style.setProperty("height", "auto", "important");
      bar.style.setProperty("min-height", "0", "important");
      bar.style.setProperty("max-height", "none", "important");
      bar.style.setProperty("padding", "0", "important");
      bar.style.setProperty("margin", "0", "important");
      bar.style.setProperty("background", "transparent", "important");
      bar.style.setProperty("background-image", "none", "important");
      bar.style.setProperty("border", "0", "important");
      bar.style.setProperty("box-shadow", "none", "important");
      bar.style.setProperty("outline", "0", "important");
      bar.style.setProperty("backdrop-filter", "none", "important");
      bar.style.setProperty("-webkit-backdrop-filter", "none", "important");
      bar.style.setProperty("z-index", "99999", "important");
      bar.style.setProperty("pointer-events", "none", "important");
      bar.style.setProperty("overflow", "visible", "important");

      const btn = $(".zg-small-btn", bar);
      if (btn) {
        btn.style.setProperty("pointer-events", "auto", "important");
        btn.style.setProperty("position", "relative", "important");
        btn.style.setProperty("z-index", "100000", "important");
        btn.style.setProperty("height", "38px", "important");
        btn.style.setProperty("min-height", "38px", "important");
        btn.style.setProperty("padding", "0 18px", "important");
        btn.style.setProperty("border-radius", "999px", "important");
        btn.style.setProperty("background", "rgba(38, 46, 60, 0.92)", "important");
        btn.style.setProperty("border", "1px solid rgba(255,255,255,0.24)", "important");
        btn.style.setProperty("box-shadow", "0 6px 18px rgba(0,0,0,0.35)", "important");
      }
    });

    $$(".zg-battle-top", battle).forEach((top) => {
      top.style.setProperty("width", "68px", "important");
      top.style.setProperty("height", "68px", "important");
      top.style.setProperty("min-width", "68px", "important");
      top.style.setProperty("min-height", "68px", "important");
      top.style.setProperty("max-width", "68px", "important");
      top.style.setProperty("max-height", "68px", "important");
      top.style.setProperty("border-radius", "999px", "important");
      top.style.setProperty("aspect-ratio", "1 / 1", "important");
      top.style.setProperty("padding", "0", "important");
      top.style.setProperty("margin", "0", "important");
      top.style.setProperty("display", "flex", "important");
      top.style.setProperty("align-items", "center", "important");
      top.style.setProperty("justify-content", "center", "important");
      top.style.setProperty("overflow", "hidden", "important");
      top.style.setProperty("pointer-events", "none", "important");
      top.style.setProperty("z-index", "20", "important");
      top.style.setProperty("border", "0", "important");
      top.style.setProperty("outline", "0", "important");
      top.style.setProperty("backdrop-filter", "none", "important");
      top.style.setProperty("-webkit-backdrop-filter", "none", "important");
    });

    const main = $(".zg-main", battle);
    if (main) {
      main.style.setProperty("padding-top", "48px", "important");
      main.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
      main.style.setProperty("min-height", "0", "important");
      main.style.setProperty("overflow", "hidden", "important");
    }
  }



  /*
   * =========================================================
   * 05. HOME PAGE / 首頁
   * =========================================================
   */

  function ensureHomeDom(root) {
    if (screenStart()) return;

    const section = document.createElement("section");
    section.id = "screen-start";
    section.className = "zg-screen active zg-home-bg-screen";

    section.innerHTML = `
      <main class="zg-main">
        <div class="zg-hero" aria-hidden="true">🌀</div>

        <h1 class="zg-title">
          陀螺<br>
          <span class="zg-highlight">競技場</span>
        </h1>

        <p class="zg-subtitle">
          發射、碰撞、逆轉，成為最後仍在旋轉的玩家。
        </p>
      </main>

      <div class="zg-bottom" style="position:relative;z-index:10;pointer-events:auto;">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="start"
          type="button"
          style="position:relative;z-index:11;pointer-events:auto;"
        >
          開始遊戲
        </button>
      </div>
    `;

    root.appendChild(section);
  }

  function ensureHomeVisualFx() {
    const start = screenStart();

    if (!start) return;

    if (!$(".zg-stardust", start)) {
      const layer = document.createElement("div");
      layer.className = "zg-stardust";
      layer.setAttribute("aria-hidden", "true");
      layer.style.setProperty("pointer-events", "none", "important");

      for (let i = 0; i < 12; i++) {
        const star = document.createElement("i");
        star.className = "zg-star";
        star.style.setProperty("pointer-events", "none", "important");
        layer.appendChild(star);
      }

      start.prepend(layer);
    }
  }

function onHomeShown() {
  stopBattle();
  cancelChargeLoop();
  removeMenuDom();
  removeLogoDom();
  fixHomeButtonVisualNow();
}


  function handleHomeStart() {
    Sound.resume();

    loadDailyLimit();

    if (isDailyBlocked()) {
      track("blocked", {
        reason: "daily_limit",
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays,
        source: "home_start"
      });

      alert("今日挑戰次數已用完，請明天再來挑戰！");
      return;
    }

    ensureBasicDom();
    ensureSelectDom(appRoot());
    renderTopSelection();

    track("start", {
      source: "home"
    });

    showScreen("select");
  }

  /*
   * =========================================================
   * 06. TOP SELECT PAGE / 選擇陀螺頁面
   * =========================================================
   */

  function ensureSelectDom(root) {
    if (screenSelect()) return;

    const section = document.createElement("section");
    section.id = "screen-select";
    section.className = "zg-screen";
    section.hidden = true;

    section.innerHTML = `
      <div class="zg-topbar zg-topbar-no-logo">
        <button class="zg-small-btn" data-zg-action="home" type="button">
          返回
        </button>
      </div>

      <main class="zg-main">
        <h2 class="zg-step-title">選擇陀螺</h2>

        <p class="zg-desc">
          不同類型擁有不同碰撞手感與戰鬥節奏。
        </p>

        <div class="zg-top-list" id="zg-top-list"></div>
      </main>

      <div class="zg-bottom">
        <button class="zg-btn zg-btn-red" data-zg-action="battle" type="button">
          發射！開始對戰
        </button>
      </div>
    `;

    root.appendChild(section);
  }

  function onSelectShown() {
    stopBattle();
    cancelChargeLoop();

    renderTopSelection();
    removeMenuDom();
    removeLogoDom();
  }


  function renderTopSelection() {
    const list =
      $(".zg-top-list", screenSelect()) ||
      $("#zg-top-list") ||
      $(".zg-top-list");

    if (!list) return;

    list.innerHTML = TOPS.map((top) => {
      const f = getFeel(top);

      const typeFx = `
        ${top.type === "attack" ? '<i class="zg-ember"></i><i class="zg-ember"></i><i class="zg-ember"></i>' : ""}
        ${top.type === "defense" ? '<i class="zg-shield-ring"></i><i class="zg-shield-ring"></i>' : ""}
        ${top.type === "stamina" ? '<i class="zg-orbit-dot"></i><i class="zg-orbit-dot"></i>' : ""}
        ${top.type === "balance" ? '<i class="zg-balance-ring"></i><i class="zg-balance-star"></i><i class="zg-balance-star"></i>' : ""}
      `;

      return `
        <button
          class="zg-top-card ${escapeHtml(top.type)}"
          data-id="${escapeHtml(top.id)}"
          data-type="${escapeHtml(top.type)}"
          data-top-id="${escapeHtml(top.id)}"
          type="button"
        >
          <div
            class="zg-top-icon ${escapeHtml(top.type)}"
            style="--c1:${escapeHtml(top.colorA)};--c2:${escapeHtml(top.colorB)};"
          >
            ${escapeHtml(top.emoji)}
            ${typeFx}
          </div>

          <div class="zg-top-content">
            <div class="zg-top-name">${escapeHtml(top.name)}</div>
            <div class="zg-top-type">${escapeHtml(f.label)}</div>

            <div class="zg-stats">
              <div class="zg-stat">
                <span>攻擊</span>
                <strong>${top.power}</strong>
              </div>

              <div class="zg-stat">
                <span>防禦</span>
                <strong>${top.defense}</strong>
              </div>

              <div class="zg-stat">
                <span>耐久</span>
                <strong>${top.stamina}</strong>
              </div>

              <div class="zg-stat">
                <span>速度</span>
                <strong>${top.speed}</strong>
              </div>
            </div>
          </div>
        </button>
      `;
    }).join("");

    selectTop((state.selectedTop || loadSelectedTop()).id, false);

    $$(
      ".zg-btn, .zg-small-btn, .zg-top-card, [data-zg-action]",
      screenSelect()
    ).forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("z-index", "10", "important");
    });
  }

  function fixHomeButtonVisualNow() {
  const start = screenStart();
  if (!start) return;

  const bottom = $(".zg-bottom", start);
  const btn = $('[data-zg-action="start"]', start);

  if (bottom) {
    bottom.style.setProperty("position", "relative", "important");
    bottom.style.setProperty("z-index", "9999", "important");
    bottom.style.setProperty("pointer-events", "auto", "important");
    bottom.style.setProperty("overflow", "visible", "important");
    bottom.style.setProperty("background", "transparent", "important");
    bottom.style.setProperty("box-shadow", "none", "important");
  }

  if (btn) {
    btn.disabled = false;
    btn.style.setProperty("position", "relative", "important");
    btn.style.setProperty("z-index", "10000", "important");
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("overflow", "hidden", "important");
    btn.style.setProperty("isolation", "isolate", "important");
    btn.style.setProperty("background", "linear-gradient(90deg, #ff3a3a, #d90018)", "important");
    btn.style.setProperty("color", "#ffffff", "important");
    btn.style.setProperty("border", "0", "important");
    btn.style.setProperty("box-shadow", "0 10px 28px rgba(255,0,35,0.35)", "important");
    btn.style.setProperty("text-align", "center", "important");
    btn.style.setProperty("text-align-last", "center", "important");
  }

  /*
   * 把首頁中可能蓋到按鈕的小裝飾物全部關閉 pointer。
   */
  $$(".zg-energy-grid, .zg-stardust, .zg-star, .zg-hero, .zg-bg-logo, .zg-fixed-logo", start)
    .forEach((el) => {
      el.style.setProperty("pointer-events", "none", "important");
    });
}

  function selectTop(id, shouldTrack = true) {
    const top = TOPS.find((item) => item.id === id) || TOPS[0];

    state.selectedTop = top;
    saveSelectedTop(top);

    $$(".zg-top-card").forEach((card) => {
      const active =
        card.getAttribute("data-id") === top.id ||
        card.getAttribute("data-top-id") === top.id;

      card.classList.toggle("selected", active);
      card.classList.toggle("active", active);
      card.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (shouldTrack) {
      track("select_top", {
        topId: top.id,
        topName: top.name,
        topType: top.type,
        source: "select_page"
      });
    }
  }

  function pickEnemyTop() {
    const selectedId = state.selectedTop?.id || "";
    const pool = TOPS.filter((top) => top.id !== selectedId);

    return pool[Math.floor(Math.random() * pool.length)] || TOPS[1] || TOPS[0];
  }

  function handleChangeTop() {
    track("change_top", {
      source: state.screen || "unknown"
    });

    showScreen("select");
  }

  /*
   * =========================================================
   * 07. LAUNCH PREP PAGE / 準備發射頁面
   * =========================================================
   *
   * 注意：
   * 目前準備發射頁不是獨立 screen，
   * 而是覆蓋在 battle screen 上的 .zg-charge-layer。
   * 這樣可以保留原本 game.css 的美術與流程。
   * =========================================================
   */

      function bindChargeButtonDirect(btn) {
    if (!btn || btn.dataset.zgChargeBound === "1") return;

    btn.dataset.zgChargeBound = "1";

    const press = (event) => {
      if (btn.disabled) return;
      if (state.running || state.battle || state.finishing) return;
      if (state.charging) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      Sound.resume();
      startCharging();

      try {
        if (event.pointerId !== undefined) {
          btn.setPointerCapture(event.pointerId);
        }
      } catch (error) {}
    };

    const release = (event) => {
      if (!state.charging) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      releaseCharging();

      try {
        if (event.pointerId !== undefined) {
          btn.releasePointerCapture(event.pointerId);
        }
      } catch (error) {}
    };

    btn.addEventListener("pointerdown", press, {
      capture: true,
      passive: false
    });

    btn.addEventListener("pointerup", release, {
      capture: true,
      passive: false
    });

    btn.addEventListener("pointercancel", release, {
      capture: true,
      passive: false
    });

    btn.addEventListener("touchstart", press, {
      capture: true,
      passive: false
    });

    btn.addEventListener("touchend", release, {
      capture: true,
      passive: false
    });

    btn.addEventListener("mousedown", press, true);
    btn.addEventListener("mouseup", release, true);
    btn.addEventListener("mouseleave", release, true);

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }, true);
  }


  function ensureChargeDom() {
    const battle = screenBattle();
    if (!battle) return null;

    const main = $(".zg-main", battle) || battle;
    const box = $(".zg-battle-box", battle);
    let panel = $(".zg-panel", battle);

    if (!panel) {
      panel = document.createElement("div");
      panel.className = "zg-panel";
      main.appendChild(panel);
    }

    Array.from(panel.children).forEach((child) => {
      if (
        child.classList &&
        child.classList.contains("zg-hp-row") &&
        !child.closest(".zg-hp-group")
      ) {
        child.remove();
      }
    });

    let hpGroup = $(".zg-hp-group", panel);
    if (!hpGroup) {
      hpGroup = document.createElement("div");
      hpGroup.className = "zg-hp-group";
      hpGroup.innerHTML = `
        <div class="zg-hp-row zg-player-hp-row">
          <span>你</span>
          <div class="zg-hp-bar">
            <i id="zg-player-hp" class="zg-player-hp zg-hp-fill"></i>
          </div>
          <b id="zg-player-hp-text" class="zg-player-hp-text">100%</b>
        </div>

        <div class="zg-hp-row zg-enemy-hp-row">
          <span>敵</span>
          <div class="zg-hp-bar">
            <i id="zg-enemy-hp" class="zg-enemy-hp zg-hp-fill"></i>
          </div>
          <b id="zg-enemy-hp-text" class="zg-enemy-hp-text">100%</b>
        </div>
      `;
    }

    let commentary = $(".zg-commentary", panel);
    if (!commentary) {
      commentary = document.createElement("div");
      commentary.className = "zg-commentary";
      commentary.textContent = "準備拉繩，按住按鈕蓄力！";
    }

    let bottomRow = $(".zg-bottom-control-row", panel);
    if (!bottomRow) {
      bottomRow = document.createElement("div");
      bottomRow.className = "zg-bottom-control-row";
    }

    let photo = $(".zg-external-top-photo", bottomRow);
    if (!photo) {
      photo = document.createElement("div");
      photo.className = "zg-external-top-photo";
      photo.innerHTML = `
        <img
          class="zg-external-top-img"
          src="${EXTERNAL_TOP_PHOTO_URL}"
          alt="外部陀螺照片"
          draggable="false"
        >
        <div class="zg-photo-glow"></div>
        <div class="zg-photo-badge">外部陀螺</div>
      `;
    }

    let layer = $(".zg-charge-layer", bottomRow);
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "zg-charge-layer";

      layer.innerHTML = `
        <div class="zg-charge-card">
          <div class="zg-charge-head">
            <div class="zg-charge-copy">
              <div class="zg-charge-title">拉繩發射！</div>
              <div class="zg-charge-subtitle">按住蓄力，接近完美區放開！</div>
            </div>
          </div>

          <div class="zg-charge-meter zg-charge-meter-v3" aria-label="蓄力條">
            <div class="zg-charge-percent-badge">0%</div>

            <div class="zg-energy-shell">
              <div class="zg-energy-track"></div>
              <div class="zg-energy-gridline"></div>
              <div class="zg-energy-fill"></div>
              <div class="zg-energy-glow"></div>
              <div class="zg-energy-perfect-zone"></div>
              <div class="zg-energy-scan"></div>
              <div class="zg-energy-cap"></div>
            </div>
          </div>

          <button class="zg-charge-btn" type="button">按住蓄力</button>
          <div class="zg-charge-tip">手機長按按鈕，電腦可按空白鍵</div>
        </div>
      `;
    } else {
      const oldMeter = $(".zg-charge-meter-v2", layer);
      if (oldMeter) {
        oldMeter.outerHTML = `
          <div class="zg-charge-meter zg-charge-meter-v3" aria-label="蓄力條">
            <div class="zg-charge-percent-badge">0%</div>

            <div class="zg-energy-shell">
              <div class="zg-energy-track"></div>
              <div class="zg-energy-gridline"></div>
              <div class="zg-energy-fill"></div>
              <div class="zg-energy-glow"></div>
              <div class="zg-energy-perfect-zone"></div>
              <div class="zg-energy-scan"></div>
              <div class="zg-energy-cap"></div>
            </div>
          </div>
        `;
      }
    }

    bottomRow.appendChild(photo);
    bottomRow.appendChild(layer);

    panel.appendChild(hpGroup);
    panel.appendChild(commentary);
    panel.appendChild(bottomRow);

    battle.style.setProperty("height", "100vh", "important");
    battle.style.setProperty("max-height", "100vh", "important");
    battle.style.setProperty("overflow", "hidden", "important");
    battle.style.setProperty("box-sizing", "border-box", "important");

    main.style.setProperty("height", "100%", "important");
    main.style.setProperty("min-height", "0", "important");
    main.style.setProperty("display", "flex", "important");
    main.style.setProperty("flex-direction", "column", "important");
    main.style.setProperty("align-items", "center", "important");
    main.style.setProperty("justify-content", "flex-start", "important");
    main.style.setProperty("gap", "8px", "important");
    main.style.setProperty("padding", "48px 10px 8px", "important");
    main.style.setProperty("box-sizing", "border-box", "important");
    main.style.setProperty("overflow", "hidden", "important");

    if (box) {
      box.style.setProperty("position", "relative", "important");
      box.style.setProperty("flex", "1 1 auto", "important");
      box.style.setProperty("width", "min(100%, 860px)", "important");
      box.style.setProperty("height", "auto", "important");
      box.style.setProperty("min-height", "0", "important");
      box.style.setProperty("max-height", "56vh", "important");
      box.style.setProperty("margin", "0 auto", "important");
      box.style.setProperty("aspect-ratio", "auto", "important");
      box.style.setProperty("box-sizing", "border-box", "important");
      box.style.setProperty("overflow", "hidden", "important");
      box.style.setProperty("z-index", "1", "important");
      box.style.setProperty("border", "2px solid rgba(255, 70, 80, 0.35)", "important");
      box.style.setProperty("box-shadow", "0 0 26px rgba(255, 30, 70, 0.18), inset 0 0 40px rgba(255,255,255,0.05)", "important");
      box.style.removeProperty("grid-row");
      box.style.removeProperty("grid-column");
    }

    panel.style.setProperty("position", "relative", "important");
    panel.style.setProperty("inset", "auto", "important");
    panel.style.setProperty("transform", "none", "important");
    panel.style.setProperty("flex", "0 0 auto", "important");
    panel.style.setProperty("width", "min(100%, 860px)", "important");
    panel.style.setProperty("height", "38vh", "important");
    panel.style.setProperty("min-height", "280px", "important");
    panel.style.setProperty("max-height", "380px", "important");
    panel.style.setProperty("margin", "0 auto", "important");
    panel.style.setProperty("z-index", "10", "important");
    panel.style.setProperty("display", "flex", "important");
    panel.style.setProperty("flex-direction", "column", "important");
    panel.style.setProperty("gap", "8px", "important");
    panel.style.setProperty("padding", "0 10px 8px", "important");
    panel.style.setProperty("box-sizing", "border-box", "important");
    panel.style.setProperty("overflow", "hidden", "important");
    panel.style.setProperty("pointer-events", "auto", "important");
    panel.style.setProperty("visibility", "visible", "important");
    panel.style.setProperty("opacity", "1", "important");

    hpGroup.style.setProperty("order", "1", "important");
    hpGroup.style.setProperty("display", "flex", "important");
    hpGroup.style.setProperty("flex-direction", "column", "important");
    hpGroup.style.setProperty("gap", "5px", "important");
    hpGroup.style.setProperty("width", "100%", "important");
    hpGroup.style.setProperty("flex", "0 0 48px", "important");
    hpGroup.style.setProperty("box-sizing", "border-box", "important");

    $$(".zg-hp-row", hpGroup).forEach((row) => {
      row.style.setProperty("display", "grid", "important");
      row.style.setProperty("grid-template-columns", "34px minmax(0, 1fr) 48px", "important");
      row.style.setProperty("align-items", "center", "important");
      row.style.setProperty("gap", "8px", "important");
      row.style.setProperty("min-height", "20px", "important");
      row.style.setProperty("margin", "0", "important");
    });

    $$(".zg-hp-bar", hpGroup).forEach((bar) => {
      bar.style.setProperty("height", "16px", "important");
      bar.style.setProperty("min-height", "16px", "important");
      bar.style.setProperty("border-radius", "999px", "important");
      bar.style.setProperty("overflow", "hidden", "important");
      bar.style.setProperty("background", "rgba(20, 18, 34, 0.95)", "important");
      bar.style.setProperty("box-shadow", "inset 0 0 8px rgba(0,0,0,0.8)", "important");
    });

    $$(".zg-hp-bar i", hpGroup).forEach((bar) => {
      bar.style.setProperty("display", "block", "important");
      bar.style.setProperty("height", "100%", "important");
      bar.style.setProperty("width", "100%", "important");
      bar.style.setProperty("border-radius", "999px", "important");
      bar.style.setProperty("transition", "width 260ms ease, filter 180ms ease", "important");
    });

    const playerHp = $(".zg-player-hp", hpGroup);
    if (playerHp) {
      playerHp.style.setProperty("background", "linear-gradient(90deg, #5cf7ff, #00dd68)", "important");
      playerHp.style.setProperty("box-shadow", "0 0 12px rgba(0,255,170,0.45)", "important");
    }

    const enemyHp = $(".zg-enemy-hp", hpGroup);
    if (enemyHp) {
      enemyHp.style.setProperty("background", "linear-gradient(90deg, #ff4048, #ffd84d)", "important");
      enemyHp.style.setProperty("box-shadow", "0 0 12px rgba(255,90,70,0.45)", "important");
    }

    $$(".zg-hp-row span, .zg-hp-row b", hpGroup).forEach((el) => {
      el.style.setProperty("font-size", "13px", "important");
      el.style.setProperty("line-height", "1", "important");
      el.style.setProperty("white-space", "nowrap", "important");
      el.style.setProperty("color", "#fff", "important");
      el.style.setProperty("font-weight", "800", "important");
      el.style.setProperty("text-shadow", "0 1px 4px rgba(0,0,0,0.8)", "important");
    });

    commentary.style.setProperty("order", "2", "important");
    commentary.style.setProperty("flex", "0 0 46px", "important");
    commentary.style.setProperty("min-height", "46px", "important");
    commentary.style.setProperty("max-height", "52px", "important");
    commentary.style.setProperty("padding", "8px 12px", "important");
    commentary.style.setProperty("font-size", "14px", "important");
    commentary.style.setProperty("line-height", "1.2", "important");
    commentary.style.setProperty("font-weight", "900", "important");
    commentary.style.setProperty("color", "#fff", "important");
    commentary.style.setProperty("display", "flex", "important");
    commentary.style.setProperty("align-items", "center", "important");
    commentary.style.setProperty("justify-content", "center", "important");
    commentary.style.setProperty("text-align", "center", "important");
    commentary.style.setProperty("border-radius", "16px", "important");
    commentary.style.setProperty("background", "linear-gradient(180deg, rgba(40,38,58,0.98), rgba(24,22,36,0.98))", "important");
    commentary.style.setProperty("box-shadow", "inset 0 0 12px rgba(255,255,255,0.04), 0 0 18px rgba(70,90,255,0.12)", "important");
    commentary.style.setProperty("box-sizing", "border-box", "important");
    commentary.style.setProperty("overflow", "hidden", "important");

    bottomRow.style.setProperty("order", "3", "important");
    bottomRow.style.setProperty("flex", "1 1 auto", "important");
    bottomRow.style.setProperty("min-height", "0", "important");
    bottomRow.style.setProperty("width", "100%", "important");
    bottomRow.style.setProperty("display", "grid", "important");
    bottomRow.style.setProperty("grid-template-columns", "30% minmax(0, 1fr)", "important");
    bottomRow.style.setProperty("gap", "12px", "important");
    bottomRow.style.setProperty("box-sizing", "border-box", "important");
    bottomRow.style.setProperty("overflow", "hidden", "important");

    photo.style.setProperty("position", "relative", "important");
    photo.style.setProperty("display", "block", "important");
    photo.style.setProperty("width", "100%", "important");
    photo.style.setProperty("height", "100%", "important");
    photo.style.setProperty("min-height", "0", "important");
    photo.style.setProperty("border-radius", "18px", "important");
    photo.style.setProperty("overflow", "hidden", "important");
    photo.style.setProperty("background", "rgba(8,10,18,0.95)", "important");
    photo.style.setProperty("box-shadow", "0 0 22px rgba(0,255,50,0.18), inset 0 0 20px rgba(255,255,255,0.08)", "important");
    photo.style.setProperty("border", "1px solid rgba(120,255,140,0.28)", "important");
    photo.style.setProperty("pointer-events", "none", "important");

    const photoImg = $(".zg-external-top-img", photo);
    if (photoImg) {
      photoImg.style.setProperty("position", "absolute", "important");
      photoImg.style.setProperty("inset", "0", "important");
      photoImg.style.setProperty("width", "100%", "important");
      photoImg.style.setProperty("height", "100%", "important");
      photoImg.style.setProperty("object-fit", "cover", "important");
      photoImg.style.setProperty("object-position", "center", "important");
      photoImg.style.setProperty("display", "block", "important");
      photoImg.style.setProperty("pointer-events", "none", "important");
      photoImg.style.setProperty("user-select", "none", "important");
      photoImg.style.setProperty("filter", "saturate(1.08) contrast(1.05)", "important");
    }

    const photoGlow = $(".zg-photo-glow", photo);
    if (photoGlow) {
      photoGlow.style.setProperty("position", "absolute", "important");
      photoGlow.style.setProperty("inset", "0", "important");
      photoGlow.style.setProperty("z-index", "2", "important");
      photoGlow.style.setProperty("background", "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.34), transparent 42%), linear-gradient(180deg, transparent, rgba(0,0,0,0.28))", "important");
      photoGlow.style.setProperty("opacity", "0.8", "important");
      photoGlow.style.setProperty("pointer-events", "none", "important");
    }

    const photoBadge = $(".zg-photo-badge", photo);
    if (photoBadge) {
      photoBadge.style.setProperty("position", "absolute", "important");
      photoBadge.style.setProperty("left", "8px", "important");
      photoBadge.style.setProperty("top", "8px", "important");
      photoBadge.style.setProperty("z-index", "3", "important");
      photoBadge.style.setProperty("padding", "4px 8px", "important");
      photoBadge.style.setProperty("border-radius", "999px", "important");
      photoBadge.style.setProperty("background", "rgba(0,0,0,0.58)", "important");
      photoBadge.style.setProperty("color", "#ffffff", "important");
      photoBadge.style.setProperty("font-size", "11px", "important");
      photoBadge.style.setProperty("font-weight", "900", "important");
      photoBadge.style.setProperty("line-height", "1", "important");
      photoBadge.style.setProperty("box-shadow", "0 0 10px rgba(0,255,80,0.25)", "important");
      photoBadge.style.setProperty("pointer-events", "none", "important");
    }

    layer.style.setProperty("position", "relative", "important");
    layer.style.setProperty("inset", "auto", "important");
    layer.style.setProperty("transform", "none", "important");
    layer.style.setProperty("width", "100%", "important");
    layer.style.setProperty("height", "100%", "important");
    layer.style.setProperty("min-height", "0", "important");
    layer.style.setProperty("margin", "0", "important");
    layer.style.setProperty("z-index", "20", "important");
    layer.style.setProperty("display", "block", "important");
    layer.style.setProperty("visibility", "visible", "important");
    layer.style.setProperty("opacity", "1", "important");
    layer.style.setProperty("box-sizing", "border-box", "important");
    layer.style.setProperty("overflow", "hidden", "important");

    const card = $(".zg-charge-card", layer);
    if (card) {
      card.style.setProperty("position", "relative", "important");
      card.style.setProperty("width", "100%", "important");
      card.style.setProperty("height", "100%", "important");
      card.style.setProperty("margin", "0", "important");
      card.style.setProperty("padding", "12px 16px", "important");
      card.style.setProperty("border-radius", "18px", "important");
      card.style.setProperty("display", "flex", "important");
      card.style.setProperty("flex-direction", "column", "important");
      card.style.setProperty("align-items", "stretch", "important");
      card.style.setProperty("justify-content", "center", "important");
      card.style.setProperty("gap", "10px", "important");
      card.style.setProperty("pointer-events", "auto", "important");
      card.style.setProperty("overflow", "hidden", "important");
      card.style.setProperty("box-sizing", "border-box", "important");
      card.style.setProperty("background", "linear-gradient(145deg, rgba(38,40,54,0.98), rgba(16,17,28,0.98))", "important");
      card.style.setProperty("border", "1px solid rgba(255,255,255,0.12)", "important");
      card.style.setProperty("box-shadow", "inset 0 0 18px rgba(255,255,255,0.04), 0 0 24px rgba(255,190,50,0.13)", "important");
    }

    const head = $(".zg-charge-head", layer);
    if (head) {
      head.style.setProperty("display", "flex", "important");
      head.style.setProperty("align-items", "center", "important");
      head.style.setProperty("justify-content", "center", "important");
      head.style.setProperty("gap", "8px", "important");
      head.style.setProperty("flex", "0 0 auto", "important");
    }

    const title = $(".zg-charge-title", layer);
    if (title) {
      title.style.setProperty("font-size", "15px", "important");
      title.style.setProperty("line-height", "1.05", "important");
      title.style.setProperty("text-align", "center", "important");
      title.style.setProperty("white-space", "nowrap", "important");
      title.style.setProperty("color", "#fff", "important");
      title.style.setProperty("font-weight", "1000", "important");
    }

    const subtitle = $(".zg-charge-subtitle", layer);
    if (subtitle) {
      subtitle.style.setProperty("font-size", "11px", "important");
      subtitle.style.setProperty("line-height", "1.05", "important");
      subtitle.style.setProperty("text-align", "center", "important");
      subtitle.style.setProperty("white-space", "nowrap", "important");
      subtitle.style.setProperty("color", "rgba(255,255,255,0.78)", "important");
      subtitle.style.setProperty("font-weight", "800", "important");
    }

    const meter = $(".zg-charge-meter-v3", layer);
    if (meter) {
      meter.style.setProperty("position", "relative", "important");
      meter.style.setProperty("width", "min(94%, 600px)", "important");
      meter.style.setProperty("height", "56px", "important");
      meter.style.setProperty("min-height", "56px", "important");
      meter.style.setProperty("margin", "0 auto", "important");
      meter.style.setProperty("display", "flex", "important");
      meter.style.setProperty("align-items", "center", "important");
      meter.style.setProperty("box-sizing", "border-box", "important");
      meter.style.setProperty("overflow", "visible", "important");
      meter.style.setProperty("filter", "drop-shadow(0 8px 18px rgba(0,0,0,0.42))", "important");
    }

    const percentBadge = $(".zg-charge-percent-badge", layer);
    if (percentBadge) {
      percentBadge.style.setProperty("position", "relative", "important");
      percentBadge.style.setProperty("z-index", "12", "important");
      percentBadge.style.setProperty("width", "62px", "important");
      percentBadge.style.setProperty("height", "62px", "important");
      percentBadge.style.setProperty("min-width", "62px", "important");
      percentBadge.style.setProperty("margin-right", "-24px", "important");
      percentBadge.style.setProperty("border-radius", "999px", "important");
      percentBadge.style.setProperty("display", "flex", "important");
      percentBadge.style.setProperty("align-items", "center", "important");
      percentBadge.style.setProperty("justify-content", "center", "important");
      percentBadge.style.setProperty("font-size", "20px", "important");
      percentBadge.style.setProperty("font-weight", "1000", "important");
      percentBadge.style.setProperty("line-height", "1", "important");
      percentBadge.style.setProperty("color", "#ffffff", "important");
      percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%)", "important");
      percentBadge.style.setProperty("border", "3px solid rgba(255,255,255,0.88)", "important");
      percentBadge.style.setProperty("box-shadow", "0 0 0 4px rgba(255,48,112,0.22), 0 8px 20px rgba(255,40,100,0.5), inset 0 2px 0 rgba(255,255,255,0.35)", "important");
      percentBadge.style.setProperty("text-shadow", "0 2px 4px rgba(0,0,0,0.45)", "important");
      percentBadge.style.setProperty("box-sizing", "border-box", "important");
      percentBadge.style.setProperty("pointer-events", "none", "important");
    }

    const shell = $(".zg-energy-shell", layer);
    if (shell) {
      shell.style.setProperty("position", "relative", "important");
      shell.style.setProperty("flex", "1 1 auto", "important");
      shell.style.setProperty("height", "40px", "important");
      shell.style.setProperty("border-radius", "999px", "important");
      shell.style.setProperty("border", "2px solid rgba(255,255,255,0.78)", "important");
      shell.style.setProperty("background", "linear-gradient(180deg, rgba(9,12,24,0.98), rgba(18,20,36,0.98))", "important");
      shell.style.setProperty("box-shadow", "0 0 18px rgba(0,220,255,0.18), inset 0 0 16px rgba(0,0,0,0.95), inset 0 2px 0 rgba(255,255,255,0.12)", "important");
      shell.style.setProperty("overflow", "hidden", "important");
      shell.style.setProperty("box-sizing", "border-box", "important");
      shell.style.setProperty("pointer-events", "none", "important");
      shell.style.setProperty("isolation", "isolate", "important");
    }

    const trackBg = $(".zg-energy-track", layer);
    if (trackBg) {
      trackBg.style.setProperty("position", "absolute", "important");
      trackBg.style.setProperty("inset", "0", "important");
      trackBg.style.setProperty("background", "linear-gradient(90deg, rgba(0,255,255,0.08), rgba(255,255,255,0.04), rgba(255,80,180,0.08))", "important");
      trackBg.style.setProperty("z-index", "1", "important");
      trackBg.style.setProperty("pointer-events", "none", "important");
    }

    const gridline = $(".zg-energy-gridline", layer);
    if (gridline) {
      gridline.style.setProperty("position", "absolute", "important");
      gridline.style.setProperty("inset", "0", "important");
      gridline.style.setProperty("z-index", "2", "important");
      gridline.style.setProperty("background", "repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 32px)", "important");
      gridline.style.setProperty("opacity", "0.38", "important");
      gridline.style.setProperty("pointer-events", "none", "important");
    }

    const fill = $(".zg-energy-fill", layer);
    if (fill) {
      fill.style.setProperty("position", "absolute", "important");
      fill.style.setProperty("left", "0", "important");
      fill.style.setProperty("top", "0", "important");
      fill.style.setProperty("height", "100%", "important");
      fill.style.setProperty("width", "0%", "important");
      fill.style.setProperty("border-radius", "999px", "important");
      fill.style.setProperty("z-index", "4", "important");
      fill.style.setProperty("background", "linear-gradient(90deg, #00e5ff 0%, #18ff7a 38%, #fff35a 72%, #ff3d7f 100%)", "important");
      fill.style.setProperty("box-shadow", "0 0 16px rgba(0,245,255,0.75), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -8px 14px rgba(0,0,0,0.22)", "important");
      fill.style.setProperty("transition", "width 28ms linear, filter 120ms ease, background 120ms ease, box-shadow 120ms ease", "important");
      fill.style.setProperty("pointer-events", "none", "important");
      fill.style.setProperty("overflow", "hidden", "important");
      fill.style.setProperty("will-change", "width, filter", "important");
    }

    const energyGlow = $(".zg-energy-glow", layer);
    if (energyGlow) {
      energyGlow.style.setProperty("position", "absolute", "important");
      energyGlow.style.setProperty("left", "0", "important");
      energyGlow.style.setProperty("top", "0", "important");
      energyGlow.style.setProperty("height", "100%", "important");
      energyGlow.style.setProperty("width", "0%", "important");
      energyGlow.style.setProperty("z-index", "5", "important");
      energyGlow.style.setProperty("background", "linear-gradient(90deg, transparent, rgba(255,255,255,0.86), transparent)", "important");
      energyGlow.style.setProperty("mix-blend-mode", "screen", "important");
      energyGlow.style.setProperty("filter", "blur(3px)", "important");
      energyGlow.style.setProperty("opacity", "0.72", "important");
      energyGlow.style.setProperty("pointer-events", "none", "important");
    }

    const perfectZone = $(".zg-energy-perfect-zone", layer);
    if (perfectZone) {
      perfectZone.style.setProperty("position", "absolute", "important");
      perfectZone.style.setProperty("left", `${CHARGE.perfectMin * 100}%`, "important");
      perfectZone.style.setProperty("top", "0", "important");
      perfectZone.style.setProperty("width", `${(CHARGE.perfectMax - CHARGE.perfectMin) * 100}%`, "important");
      perfectZone.style.setProperty("height", "100%", "important");
      perfectZone.style.setProperty("z-index", "6", "important");
      perfectZone.style.setProperty("background", "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.9), rgba(255,240,90,0.75), rgba(255,255,255,0.0))", "important");
      perfectZone.style.setProperty("box-shadow", "0 0 18px rgba(255,255,255,0.95), 0 0 32px rgba(255,220,70,0.8)", "important");
      perfectZone.style.setProperty("pointer-events", "none", "important");
    }

    const energyScan = $(".zg-energy-scan", layer);
    if (energyScan) {
      energyScan.style.setProperty("position", "absolute", "important");
      energyScan.style.setProperty("left", "0", "important");
      energyScan.style.setProperty("top", "0", "important");
      energyScan.style.setProperty("width", "80px", "important");
      energyScan.style.setProperty("height", "100%", "important");
      energyScan.style.setProperty("z-index", "7", "important");
      energyScan.style.setProperty("background", "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)", "important");
      energyScan.style.setProperty("opacity", "0.38", "important");
      energyScan.style.setProperty("pointer-events", "none", "important");
    }

    const energyCap = $(".zg-energy-cap", layer);
    if (energyCap) {
      energyCap.style.setProperty("position", "absolute", "important");
      energyCap.style.setProperty("left", "0%", "important");
      energyCap.style.setProperty("top", "50%", "important");
      energyCap.style.setProperty("width", "16px", "important");
      energyCap.style.setProperty("height", "54px", "important");
      energyCap.style.setProperty("border-radius", "999px", "important");
      energyCap.style.setProperty("transform", "translate(-50%, -50%)", "important");
      energyCap.style.setProperty("z-index", "8", "important");
      energyCap.style.setProperty("background", "#ffffff", "important");
      energyCap.style.setProperty("box-shadow", "0 0 16px rgba(255,255,255,0.95), 0 0 28px rgba(0,255,255,0.65)", "important");
      energyCap.style.setProperty("pointer-events", "none", "important");
    }

    const btn = $(".zg-charge-btn", layer);
    if (btn) {
      btn.disabled = false;
      btn.textContent = state.charging ? "蓄力中..." : "按住蓄力";
      btn.style.setProperty("width", "min(86%, 520px)", "important");
      btn.style.setProperty("height", "42px", "important");
      btn.style.setProperty("min-height", "42px", "important");
      btn.style.setProperty("margin", "0 auto", "important");
      btn.style.setProperty("border", "0", "important");
      btn.style.setProperty("border-radius", "999px", "important");
      btn.style.setProperty("display", "flex", "important");
      btn.style.setProperty("align-items", "center", "important");
      btn.style.setProperty("justify-content", "center", "important");
      btn.style.setProperty("font-size", "15px", "important");
      btn.style.setProperty("font-weight", "1000", "important");
      btn.style.setProperty("color", "#230b0b", "important");
      btn.style.setProperty("background", "linear-gradient(90deg, #fff06a, #ff3d3d)", "important");
      btn.style.setProperty("box-shadow", "0 0 18px rgba(255,80,60,0.45), inset 0 2px 0 rgba(255,255,255,0.35)", "important");
      btn.style.setProperty("pointer-events", "auto", "important");
      btn.style.setProperty("touch-action", "none", "important");
      btn.style.setProperty("user-select", "none", "important");
      btn.style.setProperty("position", "relative", "important");
      btn.style.setProperty("z-index", "30", "important");

      bindChargeButtonDirect(btn);
    }

    const tip = $(".zg-charge-tip", layer);
    if (tip) {
      tip.style.setProperty("font-size", "11px", "important");
      tip.style.setProperty("line-height", "1.1", "important");
      tip.style.setProperty("text-align", "center", "important");
      tip.style.setProperty("color", "rgba(255,255,255,0.68)", "important");
      tip.style.setProperty("font-weight", "800", "important");
      tip.style.setProperty("white-space", "nowrap", "important");
    }

    removeBattleTopOverlayBlock();

    if (
  typeof setChargePower === "function" &&
  !state.running &&
  !state.battle && 
  !state.finishing
) {
  setChargePower(state.launchPower || 0);
}


    return layer;
  }


    function removeBattleTopOverlayBlock() {
    const battle = screenBattle();
    if (!battle) return;

    const topbars = $$(".zg-topbar", battle);

    topbars.forEach((bar) => {
      bar.style.setProperty("position", "absolute", "important");
      bar.style.setProperty("top", "8px", "important");
      bar.style.setProperty("right", "10px", "important");
      bar.style.setProperty("left", "auto", "important");
      bar.style.setProperty("width", "auto", "important");
      bar.style.setProperty("height", "auto", "important");
      bar.style.setProperty("min-height", "0", "important");
      bar.style.setProperty("max-height", "none", "important");
      bar.style.setProperty("padding", "0", "important");
      bar.style.setProperty("margin", "0", "important");
      bar.style.setProperty("background", "transparent", "important");
      bar.style.setProperty("border", "0", "important");
      bar.style.setProperty("box-shadow", "none", "important");
      bar.style.setProperty("backdrop-filter", "none", "important");
      bar.style.setProperty("-webkit-backdrop-filter", "none", "important");
      bar.style.setProperty("z-index", "9999", "important");
      bar.style.setProperty("pointer-events", "none", "important");
      bar.style.setProperty("overflow", "visible", "important");

      const btn = $(".zg-small-btn", bar);
      if (btn) {
        btn.style.setProperty("pointer-events", "auto", "important");
        btn.style.setProperty("position", "relative", "important");
        btn.style.setProperty("z-index", "10000", "important");
      }
    });
  }

 function showChargeLayer(show = true) {
  const battle = screenBattle();
  if (!battle) return;

  const main = $(".zg-main", battle);
  const box = $(".zg-battle-box", battle);
  const panel = $(".zg-panel", battle);
  const hpGroup = $(".zg-hp-group", battle);
  const commentary = $(".zg-commentary", battle);
  const row = $(".zg-bottom-control-row", battle);
  const layer = $(".zg-charge-layer", battle);
  const photo = $(".zg-external-top-photo", battle);
  const btn = $(".zg-charge-btn", battle);

  removeBattleTopOverlayBlock();

  battle.style.setProperty("height", "100vh", "important");
  battle.style.setProperty("max-height", "100vh", "important");
  battle.style.setProperty("overflow", "hidden", "important");
  battle.style.setProperty("box-sizing", "border-box", "important");

  if (main) {
    main.style.setProperty("height", "100%", "important");
    main.style.setProperty("min-height", "0", "important");
    main.style.setProperty("display", "flex", "important");
    main.style.setProperty("flex-direction", "column", "important");
    main.style.setProperty("align-items", "center", "important");
    main.style.setProperty("justify-content", "flex-start", "important");
    main.style.setProperty("gap", show ? "8px" : "8px", "important");
    main.style.setProperty("padding", "48px 10px 8px", "important");
    main.style.setProperty("box-sizing", "border-box", "important");
    main.style.setProperty("overflow", "hidden", "important");
  }

  if (box) {
    box.style.setProperty("position", "relative", "important");
    box.style.setProperty("width", "min(100%, 860px)", "important");
    box.style.setProperty("min-height", "0", "important");
    box.style.setProperty("margin", "0 auto", "important");
    box.style.setProperty("aspect-ratio", "auto", "important");
    box.style.setProperty("box-sizing", "border-box", "important");
    box.style.setProperty("overflow", "hidden", "important");
    box.style.setProperty("z-index", "1", "important");

    if (show) {
      /*
       * 準備蓄力狀態：
       * 上方戰鬥盤縮小，下方蓄力區完整顯示。
       */
      box.style.setProperty("flex", "1 1 auto", "important");
      box.style.setProperty("height", "auto", "important");
      box.style.setProperty("max-height", "54vh", "important");
    } else {
      /*
       * 戰鬥進行狀態：
       * 蓄力區消失，戰鬥盤吃掉主要空間。
       */
      box.style.setProperty("flex", "1 1 auto", "important");
      box.style.setProperty("height", "auto", "important");
      box.style.setProperty("max-height", "calc(100vh - 170px)", "important");
    }
  }

  if (panel) {
    panel.style.setProperty("position", "relative", "important");
    panel.style.setProperty("inset", "auto", "important");
    panel.style.setProperty("transform", "none", "important");
    panel.style.setProperty("width", "min(100%, 860px)", "important");
    panel.style.setProperty("margin", "0 auto", "important");
    panel.style.setProperty("z-index", "10", "important");
    panel.style.setProperty("display", "flex", "important");
    panel.style.setProperty("flex-direction", "column", "important");
    panel.style.setProperty("gap", "8px", "important");
    panel.style.setProperty("box-sizing", "border-box", "important");
    panel.style.setProperty("overflow", "hidden", "important");
    panel.style.setProperty("visibility", "visible", "important");
    panel.style.setProperty("opacity", "1", "important");

    if (show) {
      /*
       * 準備蓄力：需要完整面板高度。
       */
      panel.style.setProperty("flex", "0 0 38vh", "important");
      panel.style.setProperty("height", "38vh", "important");
      panel.style.setProperty("min-height", "280px", "important");
      panel.style.setProperty("max-height", "380px", "important");
      panel.style.setProperty("padding", "0 10px 8px", "important");
      panel.style.setProperty("pointer-events", "auto", "important");
    } else {
      /*
       * 戰鬥中：只保留 HP 與旁白。
       */
      panel.style.setProperty("flex", "0 0 104px", "important");
      panel.style.setProperty("height", "104px", "important");
      panel.style.setProperty("min-height", "104px", "important");
      panel.style.setProperty("max-height", "124px", "important");
      panel.style.setProperty("padding", "0 10px 6px", "important");
      panel.style.setProperty("pointer-events", "none", "important");
    }
  }

  if (hpGroup) {
    hpGroup.style.setProperty("order", "1", "important");
    hpGroup.style.setProperty("display", "flex", "important");
    hpGroup.style.setProperty("visibility", "visible", "important");
    hpGroup.style.setProperty("opacity", "1", "important");
    hpGroup.style.setProperty("pointer-events", "none", "important");
    hpGroup.style.setProperty("flex", "0 0 48px", "important");
    hpGroup.style.setProperty("width", "100%", "important");
  }

  if (commentary) {
    commentary.style.setProperty("order", "2", "important");
    commentary.style.setProperty("display", "flex", "important");
    commentary.style.setProperty("visibility", "visible", "important");
    commentary.style.setProperty("opacity", "1", "important");
    commentary.style.setProperty("pointer-events", "none", "important");
    commentary.style.setProperty("flex", "0 0 46px", "important");
    commentary.style.setProperty("min-height", "46px", "important");
    commentary.style.setProperty("max-height", "52px", "important");
  }

  if (row) {
    row.style.setProperty("order", "3", "important");

    if (show) {
      row.style.setProperty("display", "grid", "important");
      row.style.setProperty("visibility", "visible", "important");
      row.style.setProperty("opacity", "1", "important");
      row.style.setProperty("pointer-events", "auto", "important");
      row.style.setProperty("flex", "1 1 auto", "important");
      row.style.setProperty("min-height", "0", "important");
      row.style.setProperty("width", "100%", "important");
      row.style.setProperty("grid-template-columns", "30% minmax(0, 1fr)", "important");
      row.style.setProperty("gap", "12px", "important");
      row.style.setProperty("box-sizing", "border-box", "important");
      row.style.setProperty("overflow", "hidden", "important");
    } else {
      row.style.setProperty("display", "none", "important");
      row.style.setProperty("visibility", "hidden", "important");
      row.style.setProperty("opacity", "0", "important");
      row.style.setProperty("pointer-events", "none", "important");
      row.style.setProperty("flex", "0 0 0", "important");
      row.style.setProperty("height", "0", "important");
      row.style.setProperty("min-height", "0", "important");
      row.style.setProperty("max-height", "0", "important");
      row.style.setProperty("overflow", "hidden", "important");
    }
  }

  if (photo) {
    photo.style.setProperty("display", show ? "block" : "none", "important");
    photo.style.setProperty("visibility", show ? "visible" : "hidden", "important");
    photo.style.setProperty("opacity", show ? "1" : "0", "important");
    photo.style.setProperty("pointer-events", "none", "important");
  }

  if (layer) {
    if (show) {
      layer.style.setProperty("display", "block", "important");
      layer.style.setProperty("visibility", "visible", "important");
      layer.style.setProperty("opacity", "1", "important");
      layer.style.setProperty("pointer-events", "auto", "important");
      layer.style.setProperty("height", "100%", "important");
      layer.style.setProperty("min-height", "0", "important");
      layer.style.setProperty("overflow", "hidden", "important");
    } else {
      layer.style.setProperty("display", "none", "important");
      layer.style.setProperty("visibility", "hidden", "important");
      layer.style.setProperty("opacity", "0", "important");
      layer.style.setProperty("pointer-events", "none", "important");
      layer.style.setProperty("height", "0", "important");
      layer.style.setProperty("min-height", "0", "important");
      layer.style.setProperty("max-height", "0", "important");
      layer.style.setProperty("overflow", "hidden", "important");
    }
  }

  if (btn) {
    btn.disabled = !show;
    btn.style.setProperty("pointer-events", show ? "auto" : "none", "important");
    btn.style.setProperty("opacity", show ? "1" : "0.5", "important");

    if (show && !state.charging) {
      btn.textContent = "按住蓄力";
    }

    if (!show) {
      btn.textContent = "戰鬥進行中";
    }
  }
}



      function setChargePower(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    state.launchPower = p;

    const battle = screenBattle();
    if (!battle) return;

    const layer = $(".zg-charge-layer", battle);
    if (!layer) return;

    const fill =
      $(".zg-energy-fill", layer) ||
      $(".zg-charge-fill", layer);

    const meter = $(".zg-charge-meter", layer);
    const card = $(".zg-charge-card", layer);
    const btn = $(".zg-charge-btn", layer);
    const percentBadge = $(".zg-charge-percent-badge", layer);

    const grade = getLaunchGrade(p);
    const percent = `${p * 100}%`;
    const percentText = `${Math.round(p * 100)}%`;

    layer.dataset.chargeGrade = grade;

    if (percentBadge) {
      percentBadge.textContent = percentText;
      percentBadge.style.setProperty("color", "#ffffff", "important");
    }

    if (fill) {
      fill.style.setProperty("width", percent, "important");
      fill.style.setProperty("transform", "translateZ(0)", "important");
      fill.style.setProperty("min-width", "0", "important");
      fill.style.setProperty("height", "100%", "important");
      fill.style.setProperty("border-radius", "999px", "important");
      fill.style.setProperty("z-index", "4", "important");
      fill.style.setProperty("overflow", "hidden", "important");
      fill.style.setProperty("background-size", "180% 100%", "important");
      fill.style.setProperty("animation", "zgEmergencyEnergyFlow 680ms linear infinite", "important");

      if (grade === "weak") {
        fill.style.setProperty(
          "background",
          "linear-gradient(90deg, #00b7ff 0%, #00f0ff 55%, #45ff9a 100%)",
          "important"
        );

        fill.style.setProperty(
          "box-shadow",
          "0 0 16px rgba(0,245,255,0.75), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -8px 14px rgba(0,0,0,0.22)",
          "important"
        );

        if (percentBadge) {
          percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%)", "important");
          percentBadge.style.setProperty("border-color", "rgba(255,255,255,0.88)", "important");
          percentBadge.style.setProperty("color", "#ffffff", "important");
        }
      } else if (grade === "normal") {
        fill.style.setProperty(
          "background",
          "linear-gradient(90deg, #00e5ff 0%, #18ff7a 52%, #7dff5a 100%)",
          "important"
        );

        fill.style.setProperty(
          "box-shadow",
          "0 0 16px rgba(0,245,255,0.75), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -8px 14px rgba(0,0,0,0.22)",
          "important"
        );

        if (percentBadge) {
          percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #7df8ff, #1aa8ff 48%, #0b3c9c 100%)", "important");
          percentBadge.style.setProperty("border-color", "rgba(215,250,255,0.92)", "important");
          percentBadge.style.setProperty("color", "#ffffff", "important");
        }
      } else if (grade === "good") {
        fill.style.setProperty(
          "background",
          "linear-gradient(90deg, #00e5ff 0%, #18ff7a 32%, #fff35a 72%, #ffb22e 100%)",
          "important"
        );

        fill.style.setProperty(
          "box-shadow",
          "0 0 16px rgba(255,210,70,0.75), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -8px 14px rgba(0,0,0,0.22)",
          "important"
        );

        if (percentBadge) {
          percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #fff6a8, #ffbf20 52%, #b46100 100%)", "important");
          percentBadge.style.setProperty("border-color", "rgba(255,245,190,0.95)", "important");
          percentBadge.style.setProperty("color", "#4a2500", "important");
        }
      } else if (grade === "perfect") {
        fill.style.setProperty(
          "background",
          "linear-gradient(90deg, #00e5ff 0%, #18ff7a 25%, #fff35a 55%, #ffffff 76%, #ffd84a 100%)",
          "important"
        );

        fill.style.setProperty(
          "box-shadow",
          "0 0 18px rgba(255,255,255,0.95), 0 0 34px rgba(255,220,70,0.9), inset 0 2px 0 rgba(255,255,255,0.45)",
          "important"
        );

        if (percentBadge) {
          percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #ffffff, #ffe36a 52%, #d58a00 100%)", "important");
          percentBadge.style.setProperty("border-color", "rgba(255,255,255,0.98)", "important");
          percentBadge.style.setProperty("color", "#5a3400", "important");
        }
      } else if (grade === "over") {
        fill.style.setProperty(
          "background",
          "linear-gradient(90deg, #ff3d7f 0%, #b23dff 48%, #4b27ff 100%)",
          "important"
        );

        fill.style.setProperty(
          "box-shadow",
          "0 0 18px rgba(255,70,180,0.9), 0 0 34px rgba(90,60,255,0.86), inset 0 2px 0 rgba(255,255,255,0.32)",
          "important"
        );

        if (percentBadge) {
          percentBadge.style.setProperty("background", "radial-gradient(circle at 32% 28%, #ff98dd, #a53dff 52%, #32108e 100%)", "important");
          percentBadge.style.setProperty("border-color", "rgba(230,210,255,0.95)", "important");
          percentBadge.style.setProperty("color", "#ffffff", "important");
        }
      }
    }

    if (meter) {
      meter.dataset.chargeGrade = grade;

      if (grade === "perfect") {
        meter.style.setProperty("filter", "brightness(1.18) saturate(1.18) drop-shadow(0 0 16px rgba(255,220,70,0.55))", "important");
      } else if (grade === "over") {
        meter.style.setProperty("filter", "brightness(1.05) saturate(1.35) drop-shadow(0 0 16px rgba(180,70,255,0.48))", "important");
      } else {
        meter.style.setProperty("filter", "drop-shadow(0 8px 18px rgba(0,0,0,0.42))", "important");
      }
    }

    if (card) {
      if (grade === "perfect") {
        card.style.setProperty(
          "box-shadow",
          "inset 0 0 24px rgba(255,255,255,0.14), 0 0 38px rgba(255,220,70,0.72)",
          "important"
        );

        const t = now();

        if (
          state.charging &&
          p >= CHARGE.perfectMin &&
          p <= CHARGE.perfectMax &&
          t - (state.lastPerfectSoundAt || 0) > 420
        ) {
          state.lastPerfectSoundAt = t;
          Sound.chargePerfect();
        }
      } else if (grade === "over") {
        card.style.setProperty(
          "box-shadow",
          "inset 0 0 18px rgba(255,255,255,0.08), 0 0 30px rgba(255,70,160,0.54)",
          "important"
        );
      } else {
        card.style.setProperty(
          "box-shadow",
          "inset 0 0 18px rgba(255,255,255,0.04), 0 0 24px rgba(255,190,50,0.13)",
          "important"
        );
      }
    }

    if (btn && state.charging) {
      if (grade === "perfect") {
        btn.textContent = "完美點！放開！";
      } else if (grade === "over") {
        btn.textContent = "過充！小心！";
      } else if (grade === "good") {
        btn.textContent = "強力蓄力中...";
      } else if (grade === "weak") {
        btn.textContent = "蓄力中...";
      } else {
        btn.textContent = "穩定蓄力中...";
      }
    }

    if (state.charging) {
      Sound.chargeTick(p);
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

    state.lastEffectiveHitAt = 0;
    state.stuckBoostAt = 0;
    state.damagePressure = 1;

    state.finishing = false;
    state.finishStartedAt = 0;
    state.pendingResult = null;

    state.centerDuelStarted = false;
    state.centerDuelStartedAt = 0;
    state.centerDuelResolved = false;

    state.resultLogged = false;

    state.charging = false;
    state.launchPower = 0;
    state.chargeDir = 1;
    state.lastPerfectSoundAt = 0;

    PERF.lowFx = false;
    PERF.lastFxAt = 0;
    PERF.lastScratchAt = 0;
    PERF.lastAfterimageAt = 0;
    PERF.lastShockwaveAt = 0;
    PERF.lastCollisionTrackAt = 0;
    PERF.activeFx = 0;
    PERF.frameSlowCount = 0;
  }

function beginChargeBattle() {
  Sound.resume();

  loadDailyLimit();

  if (isDailyBlocked()) {
    track("blocked", {
      reason: "daily_limit",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      source: "begin_charge_battle"
    });

    alert("今日挑戰次數已用完，請明天再來挑戰！");
    return;
  }

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  cancelChargeLoop();
  stopBattle();

  ensureBasicDom();
  ensureBattleDom(appRoot());
  injectVisualEnhancements();
  ensureBattleVisualDom();
  ensureChargeDom();

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = pickEnemyTop();

  state.battle = null;
  state.running = false;
  state.paused = false;
  state.finishing = false;
  state.pendingResult = null;

  resetBattleFlowState();

  state.launchPower = 0;
  state.chargeDir = 1;
  state.charging = false;

  showScreen("battle");

  ensureBattleVisualDom();
  ensureChargeDom();
  removeBattleTopOverlayBlock();
  clearBattleObjects();

  setCommentary("準備拉繩，按住按鈕蓄力！");

  showChargeLayer(true);
  setChargePower(0);

  const btn = $(".zg-charge-btn", screenBattle());
  if (btn) {
    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");
  }

  updateHpBars();

  track("launch_prepare", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    playsUsed: state.playsUsed,
    remainingPlays: state.remainingPlays
  });
}


  function startCharging() {
  if (state.running || state.battle || state.finishing) return;
  if (state.charging) return;

  const battle = screenBattle();
  if (!battle) return;

  const layer = $(".zg-charge-layer", battle);
  const btn = $(".zg-charge-btn", battle);

  if (!layer || !btn) {
    ensureChargeDom();
  }

  if (state.chargeRaf) {
    cancelAnimationFrame(state.chargeRaf);
    state.chargeRaf = null;
  }

  showChargeLayer(true);

  state.charging = true;
  state.launchPower = 0;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  setChargePower(0);

  const nextBtn = $(".zg-charge-btn", screenBattle());
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.textContent = "蓄力中...";
    nextBtn.style.setProperty("opacity", "1", "important");
    nextBtn.style.setProperty("pointer-events", "auto", "important");
  }

  const tick = () => {
    if (!state.charging) {
      state.chargeRaf = null;
      return;
    }

    let next = state.launchPower + state.chargeDir * CHARGE.speed;

    if (next >= 1) {
      next = 1;
      state.chargeDir = -1;
    } else if (next <= 0) {
      next = 0;
      state.chargeDir = 1;
    }

    setChargePower(next);

    state.chargeRaf = requestAnimationFrame(tick);
  };

  state.chargeRaf = requestAnimationFrame(tick);
}


function releaseCharging() {
  if (!state.charging) return;

  const power = clamp(Number(state.launchPower) || 0, 0, 1);
  const grade = getLaunchGrade(power);

  cancelChargeLoop();

  track("launch_release", {
    power: Number(power.toFixed(3)),
    grade,
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || ""
  });

  const battle = screenBattle();
  const commentary = battle ? $(".zg-commentary", battle) : null;

  if (commentary) {
    commentary.style.setProperty(
      "box-shadow",
      "inset 0 0 12px rgba(255,255,255,0.04), 0 0 18px rgba(70,90,255,0.12)",
      "important"
    );

    if (grade === "perfect") {
      commentary.textContent = "完美發射！能量爆發！";
      commentary.style.setProperty(
        "box-shadow",
        "0 0 28px rgba(255,220,70,0.65), inset 0 0 16px rgba(255,255,255,0.12)",
        "important"
      );
    } else if (grade === "good") {
      commentary.textContent = "強力發射！轉速快速提升！";
    } else if (grade === "over") {
      commentary.textContent = "過充發射！力量很高，但穩定度下降！";
    } else if (grade === "weak") {
      commentary.textContent = "蓄力不足！起步速度偏低！";
    } else {
      commentary.textContent = "穩定發射！準備交鋒！";
    }
  }

  const btn = battle ? $(".zg-charge-btn", battle) : null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "戰鬥進行中";
    btn.style.setProperty("opacity", "0.72", "important");
    btn.style.setProperty("pointer-events", "none", "important");
  }

  startBattleWithPower(power);
}


  function playLaunchSequence(power = 0.72) {
    const b = state.battle;
    if (!b) return;

    const grade = getLaunchGrade(power);
    const perfect = grade === "perfect";
    const good = grade === "good";
    const weak = grade === "weak";
    const over = grade === "over";

    Sound.resume();
    Sound.launch();

    restartClass(
      battleBox(),
      perfect ? "zg-killcam" : "zg-launch-impact",
      perfect ? 850 : 700
    );

    shockwave(b.player.x, b.player.y);

    setTimeout(() => {
      if (!state.battle || state.finishing) return;
      shockwave(b.enemy.x, b.enemy.y);
    }, 90);

    afterimage(b.player.x, b.player.y, perfect ? 120 : 92);
    afterimage(b.enemy.x, b.enemy.y, 92);

    if (perfect) {
      metalSparks(b.player.x, b.player.y, 14, 1.25);
      flash();
      setCommentary("完美發射！你的陀螺帶著爆發轉速衝入競技場！");
    } else if (good) {
      metalSparks(b.player.x, b.player.y, 10, 1);
      setCommentary("強力發射！初速與轉速都很穩定！");
    } else if (over) {
      metalSparks(b.player.x, b.player.y, 9, 0.95);
      flash();
      setCommentary("過充發射！力量很高，但穩定性下降！");
    } else if (weak) {
      setCommentary("發射偏弱！但還有機會靠碰撞逆轉！");
    } else {
      setCommentary("穩定發射！兩顆陀螺高速進場！");
    }

    Sound.startHum(0, getFeel(b.player.top).humBase);
    Sound.startHum(1, getFeel(b.enemy.top).humBase);
  }


 function startBattleWithPower(power = 0.72) {
  Sound.resume();

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  cancelChargeLoop();

  ensureBasicDom();
  ensureBattleDom(appRoot());
  injectVisualEnhancements();
  ensureBattleVisualDom();
  ensureChargeDom();

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = state.enemyTop || pickEnemyTop();

  showScreen("battle");

  ensureBattleVisualDom();
  ensureChargeDom();
  removeBattleTopOverlayBlock();
  clearBattleObjects();

  resetBattleFlowState();

  const arena = getArenaInfo();
  const player = createBody(state.selectedTop, "player", arena);
  const enemy = createBody(state.enemyTop, "enemy", arena);

  const powerNorm = clamp(power, 0, 1);
  const launchGrade = getLaunchGrade(powerNorm);

  let speedMul = 1;
  let spinMul = 1;
  let stabilityMul = 1;
  let angularMul = 1;

  if (launchGrade === "weak") {
    speedMul = 0.78;
    spinMul = 0.72;
    stabilityMul = 0.92;
    angularMul = 0.88;
  } else if (launchGrade === "normal") {
    speedMul = 0.95;
    spinMul = 0.92;
    stabilityMul = 1.0;
    angularMul = 1.0;
  } else if (launchGrade === "good") {
    speedMul = 1.10;
    spinMul = 1.08;
    stabilityMul = 1.05;
    angularMul = 1.08;
  } else if (launchGrade === "perfect") {
    speedMul = 1.28;
    spinMul = 1.22;
    stabilityMul = 1.12;
    angularMul = 1.18;
  } else if (launchGrade === "over") {
    speedMul = 1.06;
    spinMul = 0.96;
    stabilityMul = 0.88;
    angularMul = 0.96;
  }

  player.vx *= speedMul;
  player.vy *= speedMul;
  player.spin *= spinMul;
  player.spinRatio = clamp(player.spinRatio * spinMul, 0, 1);
  player.angularSpeed *= angularMul;
  player.mass *= stabilityMul;

  state.launchBonus = {
    grade: launchGrade,
    power: powerNorm,
    speedMul,
    spinMul,
    stabilityMul,
    angularMul
  };

  const enemyPower = rand(0.72, 0.96);

  enemy.vx *= enemyPower;
  enemy.vy *= enemyPower;
  enemy.spin *= 0.9 + enemyPower * 0.14;
  enemy.spinRatio = clamp(enemy.spinRatio * (0.9 + enemyPower * 0.14), 0, 1);

  player.el = createTopElement(player.top, "player");
  enemy.el = createTopElement(enemy.top, "enemy");

  state.battle = {
    arena,
    player,
    enemy,
    startedAt: now(),
    ended: false,
    finish: "",
    points: 0,
    launchPower: powerNorm,
    launchGrade
  };

  state.running = true;
  state.paused = false;
  state.lastFrame = 0;
  state.charging = false;

  /*
   * 戰鬥開始後一定隱藏蓄力區。
   * 只保留 HP 與旁白。
   */
  showChargeLayer(false);

  syncBody(player);
  syncBody(enemy);
  updateHpBars();
  playLaunchSequence(powerNorm);

  track("battle_start", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    topType: state.selectedTop?.type || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    enemyType: state.enemyTop?.type || "",
    launchPower: Number(powerNorm.toFixed(3)),
    launchGrade,
    speedMul,
    spinMul,
    stabilityMul
  });

  state.raf = requestAnimationFrame(battleLoop);
}



  function startBattle() {
    ensureBasicDom();
    ensureBattleDom(appRoot());
    beginChargeBattle();
  }

  
  /*
   * =========================================================
   * 08. BATTLE PAGE / 陀螺戰鬥頁面
   * =========================================================
   */

    function ensureBattleDom(root = appRoot()) {
    if (!screenBattle()) {
      const section = document.createElement("section");
      section.id = "screen-battle";
      section.className = "zg-screen";
      section.hidden = true;

      section.innerHTML = `
        <div class="zg-topbar zg-topbar-no-logo">
          <button class="zg-small-btn" data-zg-action="select" type="button">
            退出
          </button>
        </div>

        <main class="zg-main">
          <div class="zg-battle-box zg-arena-bg-box" id="zg-battle-box">
            <div class="zg-arena-ring"></div>
          </div>

          <div class="zg-panel"></div>
        </main>
      `;

      root.appendChild(section);
    }

    ensureBattleVisualDom();
    ensureChargeDom();
  }

      function ensureBattleVisualDom() {
    const battle = screenBattle();
    if (!battle) return;

    let box = $(".zg-battle-box", battle);

    if (!box) {
      box = document.createElement("div");
      box.className = "zg-battle-box zg-arena-bg-box";
      box.id = "zg-battle-box";

      const main = $(".zg-main", battle) || battle;
      main.prepend(box);
    }

    box.classList.add("zg-arena-bg-box");

    /*
     * Arena Logo
     * 直接用 img 插入，避免 background-image / CSS variable / pseudo element 被吃掉。
     */
    let logo = $(".zg-arena-logo-img", box);

    if (!logo) {
      logo = document.createElement("img");
      logo.className = "zg-arena-logo-img";
      logo.src = ARENA_LOGO_URL;
      logo.alt = "";
      logo.setAttribute("aria-hidden", "true");
      logo.draggable = false;
      box.prepend(logo);
    }

    logo.style.setProperty("position", "absolute", "important");
    logo.style.setProperty("left", "50%", "important");
    logo.style.setProperty("top", "50%", "important");
    logo.style.setProperty("width", "68%", "important");
    logo.style.setProperty("height", "auto", "important");
    logo.style.setProperty("max-width", "none", "important");
    logo.style.setProperty("transform", "translate(-50%, -50%) rotate(-8deg)", "important");
    logo.style.setProperty("opacity", "0.8", "important");
    logo.style.setProperty("filter", "invert(1) brightness(2.1) contrast(1.2)", "important");
    logo.style.setProperty("mix-blend-mode", "screen", "important");
    logo.style.setProperty("pointer-events", "none", "important");
    logo.style.setProperty("user-select", "none", "important");
    logo.style.setProperty("z-index", "1", "important");

    /*
     * Arena Ring
     */
    let ring = $(".zg-arena-ring", box);

    if (!ring) {
      ring = document.createElement("div");
      ring.className = "zg-arena-ring";
      box.appendChild(ring);
    }

    ring.style.setProperty("position", "absolute", "important");
    ring.style.setProperty("inset", "0", "important");
    ring.style.setProperty("z-index", "2", "important");
    ring.style.setProperty("pointer-events", "none", "important");

    /*
     * Flash Overlay
     */
    let flashOverlay = $(".zg-flash-overlay", box);

    if (!flashOverlay) {
      flashOverlay = document.createElement("div");
      flashOverlay.className = "zg-flash-overlay";
      box.appendChild(flashOverlay);
    }

    flashOverlay.style.setProperty("position", "absolute", "important");
    flashOverlay.style.setProperty("inset", "0", "important");
    flashOverlay.style.setProperty("z-index", "40", "important");
    flashOverlay.style.setProperty("pointer-events", "none", "important");

    /*
     * Xtreme Zone
     */
    let zone = $(".zg-xtreme-zone", box);

    if (!zone) {
      zone = document.createElement("div");
      zone.className = "zg-xtreme-zone";
      box.appendChild(zone);
    }

    zone.style.setProperty("position", "absolute", "important");
    zone.style.setProperty("z-index", "3", "important");
    zone.style.setProperty("pointer-events", "none", "important");

    /*
     * Pocket Zones
     */
    ["p1", "p2", "p3", "p4"].forEach((cls) => {
      let pocket = $(`.zg-pocket-zone.${cls}`, box);

      if (!pocket) {
        pocket = document.createElement("div");
        pocket.className = `zg-pocket-zone ${cls}`;
        box.appendChild(pocket);
      }

      pocket.style.setProperty("position", "absolute", "important");
      pocket.style.setProperty("z-index", "3", "important");
      pocket.style.setProperty("pointer-events", "none", "important");
    });

    ensureDangerVignette();
    removeDuplicateFlash();
  }


     function onBattleShown() {
    injectBattleEmergencyFixStyles();
    ensureBattleVisualDom();
    ensureChargeDom();
    fixBattleTopVisualNow();
    removeMenuDom();
    removeLogoDom();
  }



  function removeDuplicateFlash() {
    const box = battleBox();
    const overlays = $$(".zg-flash-overlay", box);

    if (overlays.length > 1) {
      overlays.slice(1).forEach((el) => el.remove());
    }
  }

  function ensureDangerVignette() {
    const box = battleBox();
    let vignette = $(".zg-danger-vignette", box);

    if (!vignette) {
      vignette = document.createElement("div");
      vignette.className = "zg-danger-vignette";
      vignette.style.setProperty("pointer-events", "none", "important");
      box.appendChild(vignette);
    }

    return vignette;
  }

  function clearBattleObjects() {
    const box = battleBox();

    $$(".zg-battle-top", box).forEach((el) => el.remove());

    $$(
      ".zg-spark, .zg-impact-ring, .zg-metal-spark, .zg-scratch, .zg-launch-shockwave, .zg-spin-afterimage, .zg-impact-streak, .zg-burst-piece, .zg-wall-flash",
      box
    ).forEach((el) => el.remove());

    box.classList.remove(
      "shake",
      "big-shake",
      "punch",
      "zg-killcam",
      "zg-launch-impact",
      "zg-collision-zoom",
      "zg-center-duel",
      "zg-over-finish",
      "zg-xtreme-finish",
      "zg-burst-finish",
      "zg-spin-finish",
      "zg-wall-rebound-box"
    );

    PERF.activeFx = 0;
  }


  
  /*
   * =========================================================
   * 08-1. Battle FX / 戰鬥視覺特效
   * =========================================================
   */

  function flash() {
    const overlay = $(".zg-flash-overlay", battleBox());
    if (!overlay) return;

    restartClass(overlay, "hit", PERF.lowFx ? 140 : 200);
  }

  function spark(x, y) {
    if (!canFx(45)) return;

    const box = battleBox();
    const el = document.createElement("div");

    el.className = "zg-spark active";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("pointer-events", "none", "important");

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
    const el = document.createElement("div");

    el.className = "zg-impact-ring active";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("pointer-events", "none", "important");

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
    const cappedBase = Math.min(count, PERF.lowFx ? 3 : PERF.maxSparksPerHit);
    const n = fxCount(cappedBase, safeIntensity);

    for (let i = 0; i < n; i++) {
      const sparkEl = document.createElement("i");

      sparkEl.className = `zg-metal-spark ${safeIntensity > 1.2 ? "intense" : ""}`;
      sparkEl.style.left = `${x}px`;
      sparkEl.style.top = `${y}px`;
      sparkEl.style.setProperty("--r", `${Math.random() * 360}deg`);
      sparkEl.style.setProperty("--d", `${28 + Math.random() * 58 * safeIntensity}px`);
      sparkEl.style.setProperty("pointer-events", "none", "important");

      fxAdd();
      box.appendChild(sparkEl);

      setTimeout(() => {
        sparkEl.remove();
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
    const scratchEl = document.createElement("i");

    scratchEl.className = `zg-scratch ${wobble ? "wobble" : ""}`;
    scratchEl.style.left = `${x}px`;
    scratchEl.style.top = `${y}px`;
    scratchEl.style.setProperty("pointer-events", "none", "important");

    if (!wobble) {
      const angle = Math.atan2(vy, vx) * 180 / Math.PI;
      scratchEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    fxAdd();
    box.appendChild(scratchEl);

    setTimeout(() => {
      scratchEl.remove();
      fxRemove();
    }, wobble ? 760 : 620);
  }

  function shockwave(x, y) {
    const t = now();

    if (t - PERF.lastShockwaveAt < PERF.minShockwaveGap) return;

    PERF.lastShockwaveAt = t;

    const box = battleBox();
    const el = document.createElement("div");

    el.className = "zg-launch-shockwave";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("pointer-events", "none", "important");

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
    const el = document.createElement("div");

    el.className = "zg-spin-afterimage";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.setProperty("pointer-events", "none", "important");

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
    const el = document.createElement("div");
    const angle = Math.atan2(body.vy, body.vx) * 180 / Math.PI;

    el.className = `zg-impact-streak ${body.side === "player" ? "zg-impact-blue" : "zg-impact-red"}`;
    el.style.left = `${body.x}px`;
    el.style.top = `${body.y}px`;
    el.style.width = `${clamp(speed * 10, 38, 96)}px`;
    el.style.transform = `rotate(${angle + 180}deg)`;
    el.style.setProperty("pointer-events", "none", "important");

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 300 : 460);
  }

  function burstPieces(x, y, count = 12) {
    if (PERF.lowFx) {
      count = Math.min(count, 8);
    }

    const box = battleBox();

    for (let i = 0; i < count; i++) {
      if (PERF.activeFx > PERF.maxFx) break;

      const piece = document.createElement("i");

      piece.className = "zg-burst-piece";
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.setProperty("pointer-events", "none", "important");

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 100;

      piece.style.setProperty("--bx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--by", `${Math.sin(angle) * distance}px`);
      piece.style.setProperty("--br", `${Math.round(rand(180, 720))}deg`);

      fxAdd();
      box.appendChild(piece);

      setTimeout(() => {
        piece.remove();
        fxRemove();
      }, 680);
    }
  }

  function wallFlash(x, y, nx, ny, power = 1) {
    if (!canFx(80)) return;

    const box = battleBox();
    const el = document.createElement("div");

    el.className = "zg-wall-flash";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("pointer-events", "none", "important");

    const angle = Math.atan2(ny, nx) * 180 / Math.PI;

    el.style.transform =
      `translate(-50%, -50%) rotate(${angle}deg) scale(${clamp(power, 0.8, 1.6)})`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
      fxRemove();
    }, PERF.lowFx ? 300 : 420);
  }

  /*
   * =========================================================
   * 08-2. Battle Body / 陀螺物件建立
   * =========================================================
   */

  function getArenaInfo() {
    const box = battleBox();
    const rect = box.getBoundingClientRect();

    const w = Math.max(rect.width || 360, 320);
    const h = Math.max(rect.height || 420, 320);

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
    const el = document.createElement("div");

    el.className =
      `zg-battle-top ${side === "player" ? "zg-player-top" : "zg-enemy-top"} ${top.type}`;

    el.setAttribute("data-side", side);
    el.setAttribute("data-id", top.id);
    el.setAttribute("data-type", top.type);

    el.style.setProperty("--c1", top.colorA);
    el.style.setProperty("--c2", top.colorB);
    el.style.setProperty("pointer-events", "none", "important");

    el.innerHTML = `
      <span>${escapeHtml(top.emoji)}</span>
    `;

    box.appendChild(el);

    return el;
  }

  function createBody(top, side, arena) {
    const f = getFeel(top);

    const startX = side === "player" ? arena.w * 0.25 : arena.w * 0.75;
    const startY = side === "player" ? arena.h * 0.62 : arena.h * 0.38;

    const launchAngle =
      side === "player"
        ? rand(-0.72, 0.12)
        : Math.PI + rand(-0.12, 0.72);

    const baseSpeed = PHY.initialSpeed * f.launchKick * (0.9 + top.speed / 220);
    const maxHp = 56 + top.defense * 0.14 + top.stamina * 0.14;

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

      damageMul: top.type === "attack" ? 1.22 : 1,
      damageTakenMul: top.type === "defense" ? 0.76 : 1,
      spinDecayMul: top.type === "stamina" ? 0.76 : 1,
      frictionMul: f.friction,
      restitutionMul: top.type === "defense" ? 0.84 : top.type === "attack" ? 1.16 : 1,

      lastRail: 0,
      comebackUsed: false,
      dead: false,

      burstGauge: 0,
      lastHitPower: 0,
      lastHitAt: 0,
      lastHitBy: null,
      stopStartedAt: 0,
      finishType: ""
    };
  }

  function syncBody(body) {
    if (!body || !body.el) return;

    const visualSpin = body.dead ? 0 : Math.max(body.spinRatio, 0.035);
    body.angle += body.angularSpeed * visualSpin;

    body.el.style.left = `${body.x}px`;
    body.el.style.top = `${body.y}px`;
    body.el.style.transform = `translate(-50%, -50%) rotate(${body.angle}deg)`;
    body.el.style.opacity = body.dead ? "0.35" : "1";

    const speed = Math.hypot(body.vx, body.vy);

    body.el.classList.toggle("fast-move", speed > 7.2);
    body.el.classList.toggle("zg-top-wobble", body.spinRatio < 0.22 || body.hp <= 0);
  }

   function updateHpBars() {
    const b = state.battle;

    const pFill =
      $("#zg-player-hp") ||
      $(".zg-player-hp.zg-hp-fill") ||
      $(".zg-player-hp") ||
      $(".zg-player-hp-fill");

    const eFill =
      $("#zg-enemy-hp") ||
      $(".zg-enemy-hp.zg-hp-fill") ||
      $(".zg-enemy-hp") ||
      $(".zg-enemy-hp-fill");

    const pt =
      $("#zg-player-hp-text") ||
      $(".zg-player-hp-text");

    const et =
      $("#zg-enemy-hp-text") ||
      $(".zg-enemy-hp-text");

    if (!b) {
      if (pFill) pFill.style.width = "100%";
      if (eFill) eFill.style.width = "100%";
      if (pt) pt.textContent = "100%";
      if (et) et.textContent = "100%";
      return;
    }

    const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    if (pFill) {
      pFill.style.width = `${pr * 100}%`;
      pFill.classList.toggle("zg-low-spin-warning", pr < 0.26);
    }

    if (eFill) {
      eFill.style.width = `${er * 100}%`;
      eFill.classList.toggle("zg-low-spin-warning", er < 0.26);
    }

    if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
    if (et) et.textContent = `${Math.ceil(er * 100)}%`;
  }


  function pulseHpBar(side) {
    const fill =
      side === "player"
        ? $("#zg-player-hp")
        : $("#zg-enemy-hp");

    if (!fill) return;

    fill.classList.remove("zg-hp-hit-pulse");
    void fill.offsetWidth;
    fill.classList.add("zg-hp-hit-pulse");
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
      "active",
      p.hp / p.maxHp < 0.22 ||
      e.hp / e.maxHp < 0.22 ||
      p.spinRatio < 0.18 ||
      e.spinRatio < 0.18
    );

    if (
      !state.finishing &&
      !state.centerDuelStarted &&
      Math.random() < (PERF.lowFx ? 0.018 : 0.045)
    ) {
      const ps = Math.hypot(p.vx, p.vy);
      const es = Math.hypot(e.vx, e.vy);

      if (ps > 1.6) {
        scratch(p.x, p.y, p.vx, p.vy, p.spinRatio < 0.22);
      }

      if (es > 1.6) {
        scratch(e.x, e.y, e.vx, e.vy, e.spinRatio < 0.22);
      }
    }

    /*
     * 暫停 comeback，避免低轉速時被重新補轉速，造成停轉判定不穩。
     */
    // if (!state.finishing && !state.centerDuelStarted) {
    //   tryComeback(p);
    //   tryComeback(e);
    // }
  }

  /*
   * =========================================================
   * 08-3. Battle Physics / 戰鬥物理
   * =========================================================
   */

  function typeAdvantage(attackerType, defenderType) {
    const table = {
      attack: {
        stamina: 1.14,
        defense: 0.9
      },
      defense: {
        attack: 1.12,
        stamina: 0.94
      },
      stamina: {
        defense: 1.1,
        attack: 0.94
      },
      balance: {}
    };

    return table[attackerType]?.[defenderType] || 1;
  }

  function applyArenaForces(body, arena, dt) {
    if (!body || body.dead) return;

    const dx = arena.cx - body.x;
    const dy = arena.cy - body.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const rimDist = Math.min(
      body.x - arena.left,
      arena.right - body.x,
      body.y - arena.top,
      arena.bottom - body.y
    );

    const nearWall = rimDist < 56;

    const b = state.battle;
    let centerPull = nearWall ? PHY.seekForceMax * 2.15 : PHY.seekForceMax;

    if (b && b.player && b.enemy) {
      const other = body.side === "player" ? b.enemy : b.player;
      const dToOther = Math.hypot(other.x - body.x, other.y - body.y);

      if (dToOther < body.radius * 2.8) {
        centerPull *= 0.28;
      }
    }
    
    const spinStability = 0.65 + body.spinRatio * 0.8;

    body.vx += nx * centerPull * spinStability * dt;
    body.vy += ny * centerPull * spinStability * dt;

    const tangent = body.side === "player" ? 1 : -1;

    body.vx += -ny * PHY.tangentForce * tangent * body.spinRatio * dt;
    body.vy += nx * PHY.tangentForce * tangent * body.spinRatio * dt;

    const cx = body.x - arena.cx;
    const cy = body.y - arena.cy;
    const maxR = Math.min(arena.w, arena.h) / 2 - body.radius - 12;
    const r = Math.hypot(cx, cy) || 1;
    const rimRatio = clamp(r / maxR, 0, 1);

    if (rimRatio > 0.72) {
      const force = (rimRatio - 0.72) * 0.26;
      body.vx += (-cx / r) * force * dt;
      body.vy += (-cy / r) * force * dt;
    }
  }

  function applyFriction(body, dt) {
    if (!body || body.dead) return;

    const f = Math.pow(PHY.friction, dt * body.frictionMul);

    body.vx *= f;
    body.vy *= f;

    const spinLoss = Math.pow(PHY.spinDecay, dt * body.spinDecayMul);

    body.spin *= spinLoss;
    body.spinRatio = clamp(body.spinRatio * spinLoss, 0, 1);

    if (body.hp < body.maxHp * 0.28) {
      body.spinRatio *= Math.pow(0.996, dt);
    }

    const speed = Math.hypot(body.vx, body.vy);

    if (speed < 0.04) {
      body.vx += rand(-0.018, 0.018);
      body.vy += rand(-0.018, 0.018);
    }
  }

  function moveBody(body, arena, dt) {
    if (!body || body.dead) return;

    body.x += body.vx * dt;
    body.y += body.vy * dt;

    handleWall(body, arena);
  }

  function handleWall(body, arena) {
    if (!body || body.dead) return;

    let hit = false;
    let nx = 0;
    let ny = 0;

    if (body.x < arena.left) {
      body.x = arena.left;
      body.vx = Math.abs(body.vx) * PHY.wallRestitution * body.restitutionMul;
      nx = 1;
      ny = 0;
      hit = true;
    } else if (body.x > arena.right) {
      body.x = arena.right;
      body.vx = -Math.abs(body.vx) * PHY.wallRestitution * body.restitutionMul;
      nx = -1;
      ny = 0;
      hit = true;
    }

    if (body.y < arena.top) {
      body.y = arena.top;
      body.vy = Math.abs(body.vy) * PHY.wallRestitution * body.restitutionMul;
      nx = 0;
      ny = 1;
      hit = true;
    } else if (body.y > arena.bottom) {
      body.y = arena.bottom;
      body.vy = -Math.abs(body.vy) * PHY.wallRestitution * body.restitutionMul;
      nx = 0;
      ny = -1;
      hit = true;
    }

    if (!hit) return;

    /*
     * 牆壁只消耗轉速，不扣 HP。
     */
    body.spin *= 1 - PHY.railSpinLoss * body.frictionMul;
    body.spinRatio = clamp(
      body.spinRatio * (1 - PHY.railSpinLoss * body.frictionMul),
      0,
      1
    );

    const speed = Math.hypot(body.vx, body.vy);
    const power = clamp(speed / 9, 0.65, 1.55);

    wallFlash(body.x, body.y, nx, ny, power);

    if (speed > 6.2) {
      restartClass(battleBox(), "zg-wall-rebound-box", 260);
      Sound.rail(power);

      if (!PERF.lowFx) {
        shockwave(body.x, body.y);
      }
    } else if (speed > 3.2 && Math.random() < 0.35) {
      Sound.grind(0.45);
    }

    const sideName = body.side === "player" ? "你的陀螺" : "對手陀螺";

    if (speed > 4.8 && Math.random() < 0.18) {
      setCommentary(`${sideName}撞上外圈後高速回彈！`);
    }
  }

  function getBodyKineticEnergy(body) {
    if (!body || body.dead) return 0;

    const speedSq = body.vx * body.vx + body.vy * body.vy;
    const linearEnergy = 0.5 * body.mass * speedSq;

    /*
     * 旋轉能量簡化：
     * spinRatio 越高，代表陀螺越穩。
     * angularSpeed 越高，碰撞時可消耗的能量越高。
     */
    const spinEnergy =
      0.5 *
      body.mass *
      Math.pow(body.angularSpeed * body.spinRatio * 0.08, 2);

    return linearEnergy + spinEnergy;
  }

  function energyToDamage(energyLost, relativeSpeed, impulse) {
    const safeEnergy = Math.max(0, Number(energyLost || 0));
    const safeSpeed = Math.max(0, Number(relativeSpeed || 0));
    const safeImpulse = Math.abs(Number(impulse || 0));

    /*
     * Damage Model
     * - energyLost：主要扣血來源
     * - relativeSpeed：高速撞擊加成
     * - impulse：瞬間衝量加成
     * - PHY.energyDamageScale 控制整體扣血幅度
     */
    const energyDamage = safeEnergy * PHY.energyDamageScale;
    const speedDamage = Math.max(0, safeSpeed - 1.8) * 0.72;
    const impulseDamage = Math.max(0, safeImpulse - 1.2) * 0.18;

    let damage = energyDamage + speedDamage + impulseDamage;

    /*
     * 低能量碰撞只造成非常小的磨損，避免擦到就大量扣血。
     */
    if (safeEnergy < PHY.minCollisionEnergy && safeSpeed < 2.2) {
      damage *= 0.18;
    }

    /*
     * 高速碰撞給少量爆發加成。
     */
    if (safeSpeed > 8.5) {
      damage *= 1.12;
    }

    if (safeSpeed > 11.5) {
      damage *= 1.22;
    }

    return clamp(damage, 0, PHY.maxCollisionDamage);
  }

  function resolveCollision(a, b, dt) {
    if (!a || !b || a.dead || b.dead) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const minDist = a.radius + b.radius;

    if (dist >= minDist) return;

    const nx = dx / dist;
    const ny = dy / dist;

    /*
     * 先把重疊的陀螺分開，避免卡住造成連續碰撞 lag。
     */
    const overlap = minDist - dist;
    const totalMass = Math.max(0.001, a.mass + b.mass);

    const pushA = b.mass / totalMass;
    const pushB = a.mass / totalMass;

    const correction = overlap + PHY.separationBias;

    a.x -= nx * correction * pushA;
    a.y -= ny * correction * pushA;
    b.x += nx * correction * pushB;
    b.y += ny * correction * pushB;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;

    const velAlongNormal = rvx * nx + rvy * ny;

    /*
     * 如果正在分離，正常情況不重複施加傷害。
     * 但如果重疊很深，代表已經卡住，仍給一次低速擠壓傷害。
     */
    const deepOverlap = overlap > minDist * 0.18;

    if (velAlongNormal > 0 && !deepOverlap) return;

  
    const tNow = now();

    if (
      tNow - a.lastHitAt < PHY.collisionCooldown ||
      tNow - b.lastHitAt < PHY.collisionCooldown
    ) {
      return;
    }

    const beforeEnergy =
      getBodyKineticEnergy(a) +
      getBodyKineticEnergy(b);

    const invMassA = 1 / Math.max(0.25, a.mass);
    const invMassB = 1 / Math.max(0.25, b.mass);

    /*
     * impulse 物理反彈。
     * restitution < 1，代表碰撞會消耗動能。
     */
    const restitution = PHY.hitRestitution;

        const collisionNormalSpeed = deepOverlap
      ? Math.max(1.6, Math.abs(velAlongNormal))
      : -velAlongNormal;

    const impulse =
      (1 + restitution) * collisionNormalSpeed /
      (invMassA + invMassB);


    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;
    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;

    /*
     * 切線方向轉移，讓撞擊後會偏轉、繞行，而不是只水平彈開。
     */
    const tx = -ny;
    const ty = nx;

    const tangentRelative = rvx * tx + rvy * ty;
    const tangentImpulse = tangentRelative * PHY.tangentTransfer;

    a.vx += tx * tangentImpulse * invMassA;
    a.vy += ty * tangentImpulse * invMassA;
    b.vx -= tx * tangentImpulse * invMassB;
    b.vy -= ty * tangentImpulse * invMassB;

    /*
     * 限制最高速度，避免爆速導致穿模或 lag。
     */
    [a, b].forEach((body) => {
      const speed = Math.hypot(body.vx, body.vy);

      if (speed > PHY.maxSpeed) {
        const scale = PHY.maxSpeed / speed;
        body.vx *= scale;
        body.vy *= scale;
      }
    });

    const afterEnergy =
      getBodyKineticEnergy(a) +
      getBodyKineticEnergy(b);

    const energyLost = Math.max(0, beforeEnergy - afterEnergy);
    const relativeSpeed = Math.hypot(rvx, rvy);

    a.lastHitAt = tNow;
    b.lastHitAt = tNow;

    handleTopHit(a, b, {
      energyLost,
      relativeSpeed,
      impulse,
      nx,
      ny,
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    });
  }

  function handleTopHit(a, b, hit) {
    if (!state.battle || state.finishing) return;
    if (!a || !b || !hit) return;

    const energyLost = Number(hit.energyLost || 0);
    const relativeSpeed = Number(hit.relativeSpeed || 0);
    const impulse = Number(hit.impulse || 0);

    /*
     * 低能量接觸完全忽略，避免黏住時瘋狂扣血。
     */
    if (energyLost < PHY.minCollisionEnergy && relativeSpeed < 1.15) {
      return;
    }

    const cx = hit.x;
    const cy = hit.y;

    const fa = getFeel(a.top);
    const fb = getFeel(b.top);

    const impactLevel = clamp(
      energyLost / 22 + relativeSpeed / 16,
      0.12,
      2
    );

    state.firstCollision = true;
    state.lastEffectiveHitAt = now();

    /*
     * FX 降頻：低能量碰撞只顯示少量效果。
     */
    if (impactLevel > 0.22) {
      spark(cx, cy);
    }

    if (impactLevel > 0.45) {
      impactRing(cx, cy);
    }

    if (impactLevel > 0.7) {
      const sparkCount = impactLevel > 1.2 ? 6 : 4;
      metalSparks(
        cx,
        cy,
        sparkCount,
        impactLevel * (fa.sparkMul + fb.sparkMul) / 2
      );
      flash();
    }

    if (impactLevel > 1.05) {
      restartClass(battleBox(), "shake", 260);
    }

    Sound.metal(
      clamp(impactLevel, 0.3, 1.45),
      (fa.hitSharpness + fb.hitSharpness) / 2
    );

    

    /*
     * 以碰撞能量損失計算雙方傷害。
     * 誰承受較大衝量、誰穩定度較差，誰扣比較多。
     */
    const aStability = Math.max(0.45, a.mass * (0.75 + a.spinRatio * 0.55));
    const bStability = Math.max(0.45, b.mass * (0.75 + b.spinRatio * 0.55));

    const totalStability = aStability + bStability;

    /*
 * Hit Impact Multiplier
 * 讓中重擊的能量條扣除更明顯。
 * 小擦撞維持較低傷害，避免黏住時亂扣。
 */
const hitImpactMul = clamp(
  0.88 + relativeSpeed / 8.5 + energyLost / 38,
  0.9,
  2.35
);

const damagePool =
  energyToDamage(energyLost, relativeSpeed, impulse) *
  hitImpactMul *
  (state.damagePressure || 1);


    /*
     * 穩定度低的一方承受更多能量消耗。
     */
    let damageToA = damagePool * (bStability / totalStability);
    let damageToB = damagePool * (aStability / totalStability);

    /*
     * 類型相剋仍保留，但比重降低，避免蓋過物理。
     */
    damageToB *= typeAdvantage(a.top.type, b.top.type);
    damageToA *= typeAdvantage(b.top.type, a.top.type);

    /*
     * 攻擊型較會把動能轉成傷害。
     * 防禦型較能吸收動能。
     */
    damageToB *= a.damageMul * b.damageTakenMul;
    damageToA *= b.damageMul * a.damageTakenMul;

    /*
     * Low Spin Vulnerability
     * 低轉速不直接死亡，但低轉速代表穩定性下降，
     * 被碰撞時會承受更多能量損耗。
     */
    const aLowSpinVulnerability =
      1 + clamp(0.45 - a.spinRatio, 0, 0.45) * 1.35;

    const bLowSpinVulnerability =
      1 + clamp(0.45 - b.spinRatio, 0, 0.45) * 1.35;

    damageToA *= aLowSpinVulnerability;
    damageToB *= bLowSpinVulnerability;

    /*
     * 只有陀螺碰撞才會進入 applyDamage。
     * 牆壁碰撞不會呼叫 applyDamage。
     */
    applyDamage(b, damageToB, a, hit);
    applyDamage(a, damageToA, b, hit);

    /*
     * 旋轉能量衰減：
     * 能量損失越大，spinRatio 掉越多。
     */
    const spinLossBase = clamp(
      energyLost * PHY.spinLossOnEnergy + relativeSpeed * PHY.spinDamageScale,
      0.006,
      0.16
    );

    a.spinRatio = clamp(
      a.spinRatio - spinLossBase * (1.08 - a.top.stamina / 260),
      0,
      1
    );

    b.spinRatio = clamp(
      b.spinRatio - spinLossBase * (1.08 - b.top.stamina / 260),
      0,
      1
    );

    /*
     * 碰撞後角速度也會被擾動。
     */
    a.angularSpeed *= 1 - clamp(spinLossBase * 0.35, 0.01, 0.08);
    b.angularSpeed *= 1 - clamp(spinLossBase * 0.35, 0.01, 0.08);

    a.angularSpeed += rand(-1.8, 1.8) + impactLevel * 0.7;
    b.angularSpeed += rand(-1.8, 1.8) + impactLevel * 0.7;

    if (impactLevel > 1.15) {
      setCommentary("重擊！雙方動能劇烈消耗，轉速開始下降！");
    } else if (impactLevel > 0.65 && Math.random() < 0.42) {
      setCommentary("碰撞彈開！陀螺沿著新的軌跡再度加速！");
    } else if (Math.random() < 0.22) {
      setCommentary("擦撞造成轉速消耗，勝負正在拉鋸！");
    }

    updateHpBars();

    /*
     * collision tracking 降頻，避免 lag。
     */
    const t = now();

    if (t - PERF.lastCollisionTrackAt > PERF.minCollisionTrackGap) {
      PERF.lastCollisionTrackAt = t;

      track("collision", {
        energyLost: Number(energyLost.toFixed(3)),
        relativeSpeed: Number(relativeSpeed.toFixed(3)),
        impulse: Number(impulse.toFixed(3)),
        playerHp: Math.max(0, Math.round(state.battle.player.hp)),
        enemyHp: Math.max(0, Math.round(state.battle.enemy.hp)),
        playerSpin: Number(state.battle.player.spinRatio.toFixed(3)),
        enemySpin: Number(state.battle.enemy.spinRatio.toFixed(3))
      });
    }

    checkDeadAndFinish();
  }

  function applyDamage(target, damage, attacker, hit) {
    if (!target || !attacker || target.dead) return;

    const safeDamage = clamp(Number(damage || 0), 0, PHY.maxCollisionDamage);

    if (safeDamage <= 0.01) return;

    const hpBefore = target.hp;

    target.hp = Math.max(0, target.hp - safeDamage);

if (typeof pulseHpBar === "function") {
  pulseHpBar(target.side);
}


    const energyLost = Number(hit?.energyLost || 0);
    const relativeSpeed = Number(hit?.relativeSpeed || 0);

    target.lastHitPower = relativeSpeed;
    target.lastHitBy = attacker.side;

    /*
     * burstGauge 代表陀螺結構承受的累積衝擊。
     * 高動能、高相對速度更容易爆裂。
     */
    target.burstGauge +=
      safeDamage *
      (attacker.top.type === "attack" ? 1.18 : 0.88) *
      (1 + clamp(energyLost / 70, 0, 0.6));

    /*
     * HP 越低，旋轉越不穩。
     */
    const hpRatio = target.hp / target.maxHp;

    if (hpRatio < 0.35) {
      target.spinRatio = clamp(
        target.spinRatio - safeDamage * 0.0025,
        0,
        1
      );
    }

    /*
     * HP 歸零才死亡。
     * 不因 spinRatio 歸零死亡。
     */
    if (target.hp <= 0 && hpBefore > 0) {
      target.dead = true;
      target.hp = 0;
      target.spinRatio = 0;
      target.finishType = chooseFinishType(target, attacker, relativeSpeed);
    }
  }

  function chooseFinishType(loser, winner, power) {
    if (power > 13.6 && winner.top.type === "attack") return "burst";

    const arena = state.battle?.arena;

    if (arena) {
      const dx = loser.x - arena.cx;
      const dy = loser.y - arena.cy;
      const r = Math.hypot(dx, dy);
      const maxR = Math.min(arena.w, arena.h) / 2 - loser.radius - 10;

      if (r > maxR * 0.86 && power > 8.4) return "over";
    }

    const dxt = loser.x - (arena?.xtremeX || loser.x);
    const dyt = loser.y - (arena?.xtremeY || loser.y);
    const xtremeDist = Math.hypot(dxt, dyt);

    if (arena && xtremeDist < arena.xtremeR && power > 9.2) return "xtreme";

    if (loser.burstGauge > loser.maxHp * 0.78 && power > 10.8) return "burst";

    return "spin";
  }

  function checkDeadAndFinish() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return;

    /*
     * HP Only Finish Rule
     * - 只有 HP <= 0 才判定死亡
     * - spinRatio 低只代表轉速變弱，不直接判定敗北
     * - 牆壁反彈不扣 HP
     * - 只有陀螺碰撞造成的能量損耗會經由 applyDamage 扣 HP
     */
    const pDead = b.player.hp <= 0 || b.player.dead;
    const eDead = b.enemy.hp <= 0 || b.enemy.dead;

    if (!pDead && !eDead) return;

    b.player.dead = pDead;
    b.enemy.dead = eDead;

    let win = false;
    let loser = null;
    let winner = null;

    if (pDead && eDead) {
      /*
       * 雙方同時歸零時，用剩餘 HP / 轉速做最後判定。
       * 通常這裡兩邊 HP 都是 0，所以用最後轉速當 tie-break。
       */
      win =
        b.player.hp > b.enemy.hp ||
        (
          b.player.hp === b.enemy.hp &&
          b.player.spinRatio >= b.enemy.spinRatio
        );

      winner = win ? b.player : b.enemy;
      loser = win ? b.enemy : b.player;
    } else {
      win = !pDead;
      winner = win ? b.player : b.enemy;
      loser = win ? b.enemy : b.player;
    }

    const finishType =
      loser.finishType ||
      chooseFinishType(loser, winner, loser.lastHitPower || 7);

    beginFinish(win, finishType, winner, loser);
  }

  function tryComeback(body) {
    if (!body || body.dead || body.comebackUsed) return;

    const hpRatio = body.hp / body.maxHp;

    if (hpRatio > 0.18 || body.spinRatio > 0.3) return;
    if (Math.random() > 0.0035) return;

    body.comebackUsed = true;
    body.spinRatio = clamp(body.spinRatio + 0.22, 0, 1);
    body.vx *= 1.28;
    body.vy *= 1.28;
    body.angularSpeed *= 1.18;

    shockwave(body.x, body.y);
    metalSparks(body.x, body.y, 10, 1.1);
    Sound.metal(0.75, 1.15);

    setCommentary(
      body.side === "player"
        ? "你的陀螺爆發最後轉速，嘗試逆轉！"
        : "對手陀螺突然回轉加速！"
    );
  }


  function checkStoppedAndFinish() {
    const b = state.battle;

    if (!b || b.ended || state.finishing) return;

    const t = now();

    [b.player, b.enemy].forEach((body) => {
      if (!body || body.dead) return;

      const speed = Math.hypot(body.vx, body.vy);

      const stopped =
        (
          body.spinRatio <= PHY.stopSpinThreshold &&
          speed <= PHY.stopSpeedThreshold * 2.2
        ) ||
        (
          body.spinRatio <= PHY.stopSpinThreshold * 1.8 &&
          speed <= PHY.stopSpeedThreshold
        );

      if (stopped) {
        if (!body.stopStartedAt) {
          body.stopStartedAt = t;
        }

        if (t - body.stopStartedAt >= PHY.stopGraceMs) {
          body.dead = true;
          body.hp = 0;
          body.spinRatio = 0;
          body.vx = 0;
          body.vy = 0;
          body.finishType = "spin";
        }

        return;
      }

      body.stopStartedAt = 0;
    });
  }




    function overtimePressure(dt) {
    const b = state.battle;

    if (!b || b.ended || state.finishing || !state.running) return;

    const elapsed = now() - b.startedAt;

    /*
     * 前 6 秒保護期：
     * 讓玩家先看到正常碰撞，不一開始就自然扣血。
     */
    if (elapsed < 6000) {
      state.damagePressure = 1;
      return;
    }

    /*
     * 隨時間增加壓力：
     * 6 秒後開始增加碰撞傷害倍率。
     */
    const pressure = clamp((elapsed - 6000) / 16000, 0, 2.2);

    state.damagePressure = 1 + pressure;

    const p = b.player;
    const e = b.enemy;

    /*
     * 時間能量消耗：
     * 這裡會讓 HP 隨時間慢慢下降，避免永遠不結束。
     */
    const passiveDrain = 0.045 * dt * (1 + pressure * 1.65);

    [p, e].forEach((body) => {
      if (!body || body.dead) return;

      /*
       * 轉速緩慢自然下降。
       */
      body.spinRatio = clamp(
        body.spinRatio - 0.00065 * dt * (1 + pressure * 0.7),
        0,
        1
      );

      /*
       * 低轉速時 HP 掉更快，模擬陀螺快停下。
       */
      const lowSpinMul = body.spinRatio < 0.25 ? 2.2 : 1;
      const hpBefore = body.hp;

      body.hp = Math.max(0, body.hp - passiveDrain * lowSpinMul);

      /*
       * 如果時間消耗讓 HP 歸零，就判定停止旋轉。
       */
      if (body.hp <= 0 && hpBefore > 0) {
        body.dead = true;
        body.hp = 0;
        body.spinRatio = 0;

        const other = body.side === "player" ? e : p;
        body.finishType = chooseFinishType(body, other, body.lastHitPower || 6);
      }

      /*
       * 如果速度太低，補一點繞場速度，避免完全靜止。
       */
      const speed = Math.hypot(body.vx, body.vy);

       /*
       * 只在還有足夠轉速時補一點移動。
       * 轉速太低就不要補速度，讓停轉判定可以成立。
       */
      if (speed < 1.6 && body.spinRatio > 0.18) {
        const angle =
          Math.atan2(body.y - b.arena.cy, body.x - b.arena.cx) +
          Math.PI / 2 +
          (body.side === "player" ? 0 : Math.PI);

        body.vx += Math.cos(angle) * 0.045 * dt;
        body.vy += Math.sin(angle) * 0.045 * dt;
      }


      /*
       * 限速。
       */
      const nextSpeed = Math.hypot(body.vx, body.vy);

      if (nextSpeed > PHY.maxSpeed) {
        const scale = PHY.maxSpeed / nextSpeed;
        body.vx *= scale;
        body.vy *= scale;
      }
    });

    updateHpBars();
    checkDeadAndFinish();

    if (elapsed > 12000 && Math.random() < 0.012) {
      setCommentary("時間推進，雙方能量正在持續流失！");
    }
  }

    function antiStuckBoost(dt) {
    const b = state.battle;

    if (!b || b.ended || state.finishing || !state.running) return;

    const t = now();

    if (!state.lastEffectiveHitAt) {
      state.lastEffectiveHitAt = t;
    }

    const p = b.player;
    const e = b.enemy;

    if (!p || !e || p.dead || e.dead) return;

    const dx = e.x - p.x;
    const dy = e.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;

    const rvx = e.vx - p.vx;
    const rvy = e.vy - p.vy;
    const relativeSpeed = Math.hypot(rvx, rvy);

    const pSpeed = Math.hypot(p.vx, p.vy);
    const eSpeed = Math.hypot(e.vx, e.vy);

    const minDist = p.radius + e.radius;

      const touching = dist < minDist + 8;
const deeplyOverlapped = dist < minDist * 0.92;

const stuckTouching =
  touching &&
  relativeSpeed < 2.0 &&
  pSpeed < 3.8 &&
  eSpeed < 3.8;

/*
 * 兩顆距離夠近，才允許用 tooQuiet 觸發防卡。
 * 避免沒碰撞、沒撞牆時突然被系統彈開。
 */
const nearEnough = dist < minDist + 28;
const tooQuiet = t - state.lastEffectiveHitAt > 2200;
const cooldownOk = t - state.stuckBoostAt > 1100;

if (!cooldownOk) return;

if (
  !deeplyOverlapped &&
  !stuckTouching &&
  !(tooQuiet && nearEnough)
) {
  return;
}


    state.stuckBoostAt = t;
    state.lastEffectiveHitAt = t;

    const nx = dx / dist;
    const ny = dy / dist;
    const tx = -ny;
    const ty = nx;

    /*
     * 強制拉開距離。
     */
    const targetDist = minDist + 24;
    const overlap = Math.max(0, targetDist - dist);

    p.x -= nx * overlap * 0.5;
    p.y -= ny * overlap * 0.5;
    e.x += nx * overlap * 0.5;
    e.y += ny * overlap * 0.5;

    /*
     * 一顆往左上切線，一顆往右下切線，避免再次黏回同一點。
     */
    const boost = deeplyOverlapped ? 8.8 : stuckTouching ? 7.4 : 5.2;
    const tangentBoost = deeplyOverlapped ? 4.4 : 3.6;

    p.vx = (-nx * boost + tx * tangentBoost) * (0.85 + p.spinRatio * 0.4);
    p.vy = (-ny * boost + ty * tangentBoost) * (0.85 + p.spinRatio * 0.4);

    e.vx = (nx * boost - tx * tangentBoost) * (0.85 + e.spinRatio * 0.4);
    e.vy = (ny * boost - ty * tangentBoost) * (0.85 + e.spinRatio * 0.4);

    /*
     * 不要補太多轉速，只是防止完全死黏。
     */
    p.spinRatio = clamp(p.spinRatio + 0.012, 0, 1);
    e.spinRatio = clamp(e.spinRatio + 0.012, 0, 1);

    [p, e].forEach((body) => {
      const speed = Math.hypot(body.vx, body.vy);

      if (speed > PHY.maxSpeed) {
        const scale = PHY.maxSpeed / speed;
        body.vx *= scale;
        body.vy *= scale;
      }

      /*
       * 拉回場內，避免強制分離後跑出邊界。
       */
      body.x = clamp(body.x, b.arena.left, b.arena.right);
      body.y = clamp(body.y, b.arena.top, b.arena.bottom);
    });

    setCommentary(
      deeplyOverlapped || stuckTouching
        ? "雙方卡位被打破，重新彈開交鋒！"
        : "戰局僵持，雙方再次加速碰撞！"
    );

    const mx = (p.x + e.x) / 2;
    const my = (p.y + e.y) / 2;

    shockwave(mx, my);

    if (!PERF.lowFx) {
      metalSparks(mx, my, 8, 1);
    }

    Sound.metal(0.7, 1.08);
  }


  
  /*
   * =========================================================
   * 08-4. Center Duel / 中央決勝
   * =========================================================
   *
   * 注意：
   * hpOnlyFinish = true 時，中央決勝完全不啟動。
   * 這段保留是為了舊模式相容，但目前戰鬥結束只看 HP。
   * =========================================================
   */

  function maybeStartCenterDuel(elapsed) {
    const b = state.battle;

    if (!b || b.ended || state.finishing) return;

    /*
     * HP-only 模式下禁用中央決勝。
     */
    if (PHY.hpOnlyFinish) return;

    if (state.centerDuelStarted) return;
    if (elapsed < PHY.battleLimit * 0.72) return;

    state.centerDuelStarted = true;
    state.centerDuelStartedAt = now();

    const box = battleBox();
    box.classList.add("zg-center-duel");

    setCommentary("雙方被吸入中央區域，進入最後決勝！");
    flash();
    shockwave(b.arena.cx, b.arena.cy);

    track("center_duel_start", {
      elapsed: Math.round(elapsed),
      playerHp: Math.max(0, Math.round(b.player.hp)),
      enemyHp: Math.max(0, Math.round(b.enemy.hp)),
      playerSpin: Number(b.player.spinRatio.toFixed(3)),
      enemySpin: Number(b.enemy.spinRatio.toFixed(3))
    });
  }

  function updateCenterDuel(dt) {
    const b = state.battle;

    if (!b || !state.centerDuelStarted || state.centerDuelResolved) return;

    /*
     * HP-only 模式下禁用中央決勝。
     */
    if (PHY.hpOnlyFinish) return;

    const p = b.player;
    const e = b.enemy;
    const arena = b.arena;

    [p, e].forEach((body) => {
      if (!body || body.dead) return;

      const dx = arena.cx - body.x;
      const dy = arena.cy - body.y;
      const dist = Math.hypot(dx, dy) || 1;

      body.vx += (dx / dist) * 0.16 * dt;
      body.vy += (dy / dist) * 0.16 * dt;

      body.vx *= Math.pow(0.985, dt);
      body.vy *= Math.pow(0.985, dt);
    });

    const duelElapsed = now() - state.centerDuelStartedAt;

    if (duelElapsed < 1800) return;

    state.centerDuelResolved = true;

    resolveDecisionFinish();
  }

  function resolveDecisionFinish() {
    const b = state.battle;

    if (!b || b.ended || state.finishing) return;

    /*
     * HP-only 模式下不做時間決勝。
     */
    if (PHY.hpOnlyFinish) return;

    const pScore =
      b.player.hp / b.player.maxHp * 100 +
      b.player.spinRatio * 38 +
      b.player.top.stamina * 0.16;

    const eScore =
      b.enemy.hp / b.enemy.maxHp * 100 +
      b.enemy.spinRatio * 38 +
      b.enemy.top.stamina * 0.16;

    const win = pScore >= eScore;
    const winner = win ? b.player : b.enemy;
    const loser = win ? b.enemy : b.player;

    const finishType = chooseFinishType(loser, winner, loser.lastHitPower || 7);

    beginFinish(win, finishType, winner, loser);
  }

  /*
   * =========================================================
   * 08-5. Finish / 結算流程
   * =========================================================
   */

  function beginFinish(win, finishType, winner, loser) {
    const b = state.battle;

    if (!b || b.ended || state.finishing) return;

    state.finishing = true;
    state.finishStartedAt = now();

    b.ended = true;
    b.finish = finishType;
    b.points = FINISH[finishType]?.points || 1;

    state.running = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();
    Sound.death();

    const box = battleBox();

    box.classList.remove("zg-center-duel");

    const finishClass =
      finishType === "xtreme"
        ? "zg-xtreme-finish"
        : finishType === "over"
          ? "zg-over-finish"
          : finishType === "burst"
            ? "zg-burst-finish"
            : "zg-spin-finish";

    restartClass(box, "big-shake", 720);
    restartClass(box, finishClass, 1100);

    if (loser) {
      loser.dead = true;
      loser.hp = 0;
      loser.spinRatio = 0;

      if (loser.el) {
        loser.el.classList.add("zg-top-defeated");
      }

      burstPieces(loser.x, loser.y, finishType === "burst" ? 16 : 9);
      shockwave(loser.x, loser.y);
      metalSparks(loser.x, loser.y, finishType === "burst" ? 16 : 10, 1.35);
    }

    if (winner && winner.el) {
      winner.el.classList.add("zg-top-winner");
      afterimage(winner.x, winner.y, 120);
    }

    flash();

    const label = FINISH[finishType]?.label || "Spin Finish";

    setCommentary(
      win
        ? `勝利！你以 ${label} 擊敗對手！`
        : `敗北！對手以 ${label} 擊敗了你！`
    );

    state.pendingResult = buildResult(win, finishType, winner, loser);

    track("finish", {
      result: win ? "win" : "lose",
      finishType,
      finishLabel: label,
      points: b.points,
      playerHp: Math.max(0, Math.round(b.player.hp)),
      enemyHp: Math.max(0, Math.round(b.enemy.hp)),
      playerSpin: Number(b.player.spinRatio.toFixed(3)),
      enemySpin: Number(b.enemy.spinRatio.toFixed(3)),
      elapsed: Math.round(now() - b.startedAt),
      launchPower: Number((b.launchPower || 0).toFixed(3)),
      launchGrade: b.launchGrade || ""
    });

    setTimeout(() => {
      if (!state.pendingResult) return;

      state.lastBattleResult = state.pendingResult;

      try {
        localStorage.setItem(STORAGE.lastResult, JSON.stringify(state.lastBattleResult));
      } catch (error) {}

      showResult(state.pendingResult);
    }, 1450);
  }

  function buildResult(win, finishType, winner, loser) {
    const b = state.battle;
    const finishInfo = FINISH[finishType] || FINISH.spin;

    const oldScore = getMyScore();
    const delta =
      win
        ? 35 + finishInfo.points * 15
        : -18;

    const newScore = Math.max(0, oldScore + delta);

    setMyScore(newScore);

    const coupon = drawCouponReward();

    state.lastCouponReward = coupon;

    try {
      localStorage.setItem(STORAGE.lastCoupon, JSON.stringify(coupon));
    } catch (error) {}

    increaseDailyPlay();

    return {
      win,
      result: win ? "win" : "lose",
      finishType,
      finishLabel: finishInfo.label,
      points: finishInfo.points,

      oldScore,
      newScore,
      scoreDelta: delta,

      coupon,

      topId: state.selectedTop?.id || "",
      topName: state.selectedTop?.name || "",
      topType: state.selectedTop?.type || "",

      enemyId: state.enemyTop?.id || "",
      enemyName: state.enemyTop?.name || "",
      enemyType: state.enemyTop?.type || "",

      playerHp: Math.max(0, Math.round(b?.player?.hp || 0)),
      enemyHp: Math.max(0, Math.round(b?.enemy?.hp || 0)),
      playerHpMax: Math.round(b?.player?.maxHp || 0),
      enemyHpMax: Math.round(b?.enemy?.maxHp || 0),

      playerSpin: Number((b?.player?.spinRatio || 0).toFixed(3)),
      enemySpin: Number((b?.enemy?.spinRatio || 0).toFixed(3)),

      elapsed: Math.round(now() - (b?.startedAt || now())),
      launchPower: Number((b?.launchPower || 0).toFixed(3)),
      launchGrade: b?.launchGrade || "",

      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,

      version: VERSION,
      createdAt: new Date().toISOString()
    };
  }

  function drawCouponReward() {
    const r = Math.random();
    let acc = 0;

    for (const reward of COUPON_REWARDS) {
      acc += reward.rate;

      if (r <= acc) {
        return createCoupon(reward);
      }
    }

    return createCoupon(COUPON_REWARDS[COUPON_REWARDS.length - 1]);
  }

  function createCoupon(reward) {
    const profile = getProfile() || {};
    const userId = getUserId() || "guest";
    const suffix = safeString(userId).slice(-4).toUpperCase() || Math.random().toString(36).slice(2, 6).toUpperCase();

    return {
      id: reward.id,
      label: reward.label,
      amount: reward.amount,
      code: reward.fixedCode || `${reward.codePrefix}-${suffix}`,
      createdAt: new Date().toISOString(),
      userId: getUserId(),
      userName: profile.displayName || profile.name || ""
    };
  }

  /*
   * =========================================================
   * 08-6. Battle Loop / 戰鬥主迴圈
   * =========================================================
   */

  function battleLoop(ts) {
    const b = state.battle;

    if (!b || b.ended || state.finishing || !state.running) {
      state.raf = null;
      return;
    }

    if (!state.lastFrame) {
      state.lastFrame = ts;
    }

    const rawDt = clamp((ts - state.lastFrame) / 16.6667, 0.25, 2.4);
    const dt = Math.min(rawDt, 1.8);

    state.lastFrame = ts;

    updatePerf(rawDt);

    const elapsed = ts - b.startedAt;

    /*
     * HP-only 模式：
     * 不因 elapsed > battleLimit 強制決勝。
     * 不因 spinRatio 歸零強制結束。
     * 只在 checkDeadAndFinish() 中以 HP <= 0 判定。
     */
    if (!PHY.hpOnlyFinish) {
      maybeStartCenterDuel(elapsed);
      updateCenterDuel(dt);

      if (elapsed > PHY.battleLimit && !state.finishing) {
        resolveDecisionFinish();
        return;
      }
    }

    applyArenaForces(b.player, b.arena, dt);
    applyArenaForces(b.enemy, b.arena, dt);

    applyFriction(b.player, dt);
    applyFriction(b.enemy, dt);

    moveBody(b.player, b.arena, dt);
    moveBody(b.enemy, b.arena, dt);

    resolveCollision(b.player, b.enemy, dt);

    antiStuckBoost(dt);
    overtimePressure(dt);

    /*
     * 防呆：
     * 每幀補檢查 HP 歸零與停止旋轉。
     */
   // checkStoppedAndFinish();
    checkDeadAndFinish();

    updateBattleFeel();


    syncBody(b.player);
    syncBody(b.enemy);

    updateHpBars();

    impactStreak(b.player);
    impactStreak(b.enemy);

    state.raf = requestAnimationFrame(battleLoop);
  }

  function stopBattle() {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const b = state.battle;

    if (b) {
      b.ended = true;
    }

    state.battle = null;
    state.finishing = false;
    state.pendingResult = null;
  }
  /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁面
   * =========================================================
   */

  function ensureResultDom(root) {
    if (screenResult()) return;

    const section = document.createElement("section");
    section.id = "screen-result";
    section.className = "zg-screen";
    section.hidden = true;

    section.innerHTML = `
      <main class="zg-result-main">
        <div class="zg-result-card">
          <div class="zg-result-rank-wrap">
            <div class="zg-rank" id="zg-result-rank">W</div>
          </div>

          <h2 class="zg-result-title" id="zg-result-title">
            戰鬥結果
          </h2>

          <p class="zg-result-desc" id="zg-result-desc">
            你的戰鬥紀錄已完成。
          </p>

          <div class="zg-result-stats">
            <div class="zg-result-stat">
              <span>Finish</span>
              <b id="zg-result-finish">Spin Finish</b>
            </div>

            <div class="zg-result-stat">
              <span>分數變化</span>
              <b id="zg-result-score">+0</b>
            </div>

            <div class="zg-result-stat">
              <span>目前積分</span>
              <b id="zg-result-total-score">1200</b>
            </div>

            <div class="zg-result-stat">
              <span>今日剩餘</span>
              <b id="zg-result-remaining">0 / 3</b>
            </div>
          </div>

          <div class="zg-coupon" id="zg-coupon-box">
            <div class="zg-coupon-label">
              本次獲得
            </div>

            <div class="zg-coupon-code" id="zg-coupon-code">
              ZELO100
            </div>

            <div class="zg-coupon-note" id="zg-coupon-note">
              請截圖保存，或複製折扣碼至結帳頁使用。
            </div>

            <button class="zg-small-btn zg-coupon-copy" data-zg-action="copy-coupon" type="button">
              複製折扣碼
            </button>

            <button class="zg-small-btn zg-coupon-download" data-zg-action="shop" type="button">
              前往商店使用
            </button>
          </div>

          <div class="zg-rankbox">
            <div class="zg-rankbox-title">
              好友排行榜
            </div>

            <div id="zg-friend-rank-list"></div>

            <div class="zg-rank-invite-tip">
              邀請好友一起挑戰，刷新排行榜！
            </div>
          </div>
        </div>
      </main>

      <div class="zg-bottom zg-result-actions">
        <button class="zg-btn zg-btn-red" data-zg-action="retry" type="button">
          再戰一次
        </button>

        <button class="zg-btn" data-zg-action="share" type="button">
          分享給好友
        </button>
      </div>
    `;

    root.appendChild(section);
  }

  function onResultShown() {
    Sound.stopHum();
    cancelChargeLoop();

    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    if (result) {
      renderResult(result);
    }

    removeMenuDom();
    removeLogoDom();
  }


  function showResult(result) {
    state.lastBattleResult = result;

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
    } catch (error) {}

    showScreen("result");
    renderResult(result);
    logResultOnce(result);
  }

  function renderResult(result) {
    ensureResultDom(appRoot());

    const win = !!result.win;

    const rank = $("#zg-result-rank");
    const title = $("#zg-result-title");
    const desc = $("#zg-result-desc");
    const finish = $("#zg-result-finish");
    const score = $("#zg-result-score");
    const totalScore = $("#zg-result-total-score");
    const remaining = $("#zg-result-remaining");
    const couponCode = $("#zg-coupon-code");
    const couponNote = $("#zg-coupon-note");

    if (rank) {
      rank.textContent = win ? "W" : "L";
      rank.classList.toggle("lose", !win);
      rank.classList.toggle("win", win);
    }

    if (title) {
      title.textContent = win ? "勝利！" : "敗北！";
    }

    if (desc) {
      desc.textContent = win
        ? `你使用 ${result.topName || "陀螺"} 擊敗 ${result.enemyName || "對手"}。`
        : `${result.enemyName || "對手"} 擊敗了你的 ${result.topName || "陀螺"}。`;
    }

    if (finish) {
      finish.textContent = result.finishLabel || "Spin Finish";
    }

    if (score) {
      const delta = Number(result.scoreDelta || 0);
      score.textContent = `${delta >= 0 ? "+" : ""}${delta}`;
      score.classList.toggle("negative", delta < 0);
      score.classList.toggle("positive", delta >= 0);
    }

    if (totalScore) {
      totalScore.textContent = String(result.newScore || getMyScore());
    }

    if (remaining) {
      const used = Number(result.playsUsed || state.playsUsed || 0);
      const left = Number(result.remainingPlays || state.remainingPlays || 0);
      remaining.textContent = `${left} / ${DAILY_LIMIT}`;
      remaining.setAttribute("title", `今日已使用 ${used} 次`);
    }

    const coupon = result.coupon || state.lastCouponReward;

    if (couponCode) {
      couponCode.textContent = coupon?.code || "ZELO100";
    }

    if (couponNote) {
      couponNote.textContent =
        coupon?.label
          ? `${coupon.label}｜請截圖保存，或複製折扣碼至結帳頁使用。`
          : "請截圖保存，或複製折扣碼至結帳頁使用。";
    }

    renderFriendRank(result);

    $$(
      "#screen-result .zg-btn, #screen-result .zg-small-btn, #screen-result [data-zg-action]"
    ).forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("z-index", "999", "important");
    });
  }

  function getFriendRank() {
    let list = [];

    try {
      list = JSON.parse(localStorage.getItem(STORAGE.friends) || "[]");
    } catch (error) {
      list = [];
    }

    if (!Array.isArray(list)) {
      list = [];
    }

    return list;
  }

  function saveFriendRank(list) {
    try {
      localStorage.setItem(STORAGE.friends, JSON.stringify(list || []));
    } catch (error) {}
  }

  function updateLocalRank(result) {
    const profile = getProfile() || {};
    const userId = getUserId() || "me";
    const name =
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      getPlayerName() ||
      "你";

    const score = Number(result?.newScore || getMyScore());
    const list = getFriendRank();

    const existing = list.find((item) => item.userId === userId);

    if (existing) {
      existing.name = name;
      existing.score = Math.max(Number(existing.score || 0), score);
      existing.updatedAt = new Date().toISOString();
    } else {
      list.push({
        userId,
        name,
        score,
        updatedAt: new Date().toISOString()
      });
    }

    list.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

    saveFriendRank(list.slice(0, 20));

    return list.slice(0, 20);
  }

  function renderFriendRank(result) {
    const listEl = $("#zg-friend-rank-list");
    if (!listEl) return;

    const list = updateLocalRank(result);

    if (!list.length) {
      listEl.innerHTML = `
        <div class="zg-rank-empty">
          目前尚無排行榜資料。
        </div>
      `;
      return;
    }

    listEl.innerHTML = list.slice(0, 10).map((item, index) => {
      const isMe =
        (item.userId && item.userId === (getUserId() || "me")) ||
        item.name === getPlayerName();

      return `
        <div class="zg-rank-row ${isMe ? "me" : ""}">
          <div class="zg-rank-num">#${index + 1}</div>
          <div class="zg-rank-name">${escapeHtml(item.name || "玩家")}</div>
          <div class="zg-rank-score">${escapeHtml(item.score || 0)}</div>
        </div>
      `;
    }).join("");
  }

  function getCurrentCouponCode() {
    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    const coupon =
      result?.coupon ||
      state.lastCouponReward ||
      safeParse(localStorage.getItem(STORAGE.lastCoupon), null);

    return coupon?.code || "";
  }

  function copyCoupon() {
    const code = getCurrentCouponCode();

    if (!code) {
      alert("目前沒有可複製的折扣碼。");
      return;
    }

    const afterCopy = () => {
      track("copy_coupon", {
        code
      });

      alert(`已複製折扣碼：${code}`);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(afterCopy)
        .catch(() => {
          fallbackCopyText(code);
          afterCopy();
        });

      return;
    }

    fallbackCopyText(code);
    afterCopy();
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (error) {}

    textarea.remove();
  }

  function openShop() {
    const code = getCurrentCouponCode();

    track("shop_click", {
      code,
      url: SHOP_URL
    });

    try {
      window.open(SHOP_URL, "_blank");
    } catch (error) {
      location.href = SHOP_URL;
    }
  }

  function handleRetry() {
    loadDailyLimit();

    if (isDailyBlocked()) {
      track("blocked", {
        reason: "daily_limit",
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays,
        source: "retry"
      });

      alert("今日挑戰次數已用完，請明天再來挑戰！");
      return;
    }

    track("retry", {
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });

    beginChargeBattle();
  }

  function buildShareText() {
    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    if (!result) {
      return "我正在 ZELO 陀螺競技場挑戰，快來一起對戰！";
    }

    const outcome = result.win ? "獲勝" : "挑戰完成";
    const finish = result.finishLabel || "Spin Finish";
    const score = result.newScore || getMyScore();
    const coupon = result.coupon?.code || "";

    return [
      `我在 ZELO 陀螺競技場${outcome}！`,
      `Finish：${finish}`,
      `目前積分：${score}`,
      coupon ? `折扣碼：${coupon}` : "",
      "快來一起挑戰！"
    ].filter(Boolean).join("\n");
  }

  function shareResult() {
    const text = buildShareText();
    const url = location.href;

    track("share", {
      result: state.lastBattleResult?.result || "",
      score: state.lastBattleResult?.newScore || getMyScore()
    });

    if (navigator.share) {
      navigator.share({
        title: "ZELO 陀螺競技場",
        text,
        url
      }).catch(() => {});
      return;
    }

    fallbackCopyText(`${text}\n${url}`);
    alert("分享內容已複製，貼給好友一起挑戰！");
  }
  /*
   * =========================================================
   * 10. TRACKING / 儀表板事件追蹤
   * =========================================================
   */

  function buildTrackPayload(eventName, extra = {}) {
    const profile = getProfile() || {};
    const result = state.lastBattleResult || null;

    return {
      event: eventName,
      version: VERSION,
      timestamp: new Date().toISOString(),

      userId:
        getUserId() ||
        profile.userId ||
        profile.id ||
        profile.uid ||
        "",

      userName:
        profile.displayName ||
        profile.name ||
        profile.playerName ||
        "",

      inviterId: state.inviterId || "",
      inviterName: state.inviterName || "",

      selectedTopId: state.selectedTop?.id || "",
      selectedTopName: state.selectedTop?.name || "",
      selectedTopType: state.selectedTop?.type || "",

      enemyTopId: state.enemyTop?.id || "",
      enemyTopName: state.enemyTop?.name || "",
      enemyTopType: state.enemyTop?.type || "",

      myScore: getMyScore(),

      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      dailyLimit: DAILY_LIMIT,

      lastResult: result?.result || "",
      lastFinishType: result?.finishType || "",
      lastFinishLabel: result?.finishLabel || "",
      lastScoreDelta: result?.scoreDelta || 0,
      lastScore: result?.newScore || getMyScore(),
      lastCouponCode: result?.coupon?.code || "",

      page: state.screen || "",

      userAgent: navigator.userAgent || "",

      ...extra
    };
  }

  function track(eventName, extra = {}) {
    const payload = buildTrackPayload(eventName, extra);

    /*
     * 本地 debug event。
     */
    try {
      window.dispatchEvent(
        new CustomEvent("zelo:track", {
          detail: payload
        })
      );
    } catch (error) {}

    /*
     * 若頁面已掛 ZELO_DASHBOARD_TRACK，優先交給站內 dashboard。
     */
    try {
      if (typeof window.ZELO_DASHBOARD_TRACK === "function") {
        window.ZELO_DASHBOARD_TRACK(payload);
      }
    } catch (error) {}

    /*
     * Google Apps Script logging。
     * 使用 no-cors，避免 LIFF/WebView 因 CORS 阻擋遊戲流程。
     */
    if (!GOOGLE_SCRIPT_URL) return;

    try {
      fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (error) {}
  }

  function logResultOnce(result) {
    if (!result || state.resultLogged) return;

    state.resultLogged = true;

    track("result", {
      result: result.result,
      win: !!result.win,
      finishType: result.finishType,
      finishLabel: result.finishLabel,
      points: result.points,
      oldScore: result.oldScore,
      newScore: result.newScore,
      scoreDelta: result.scoreDelta,
      couponId: result.coupon?.id || "",
      couponLabel: result.coupon?.label || "",
      couponAmount: result.coupon?.amount || 0,
      couponCode: result.coupon?.code || "",
      topId: result.topId,
      topName: result.topName,
      topType: result.topType,
      enemyId: result.enemyId,
      enemyName: result.enemyName,
      enemyType: result.enemyType,
      playerHp: result.playerHp,
      enemyHp: result.enemyHp,
      playerSpin: result.playerSpin,
      enemySpin: result.enemySpin,
      elapsed: result.elapsed,
      launchPower: result.launchPower,
      launchGrade: result.launchGrade,
      playsUsed: result.playsUsed,
      remainingPlays: result.remainingPlays
    });
  }

  /*
   * =========================================================
   * 10-1. PROFILE / LIFF 與玩家資料
   * =========================================================
   */

  function initProfile() {
    state.inviterId =
      getUrlParam("inviterId") ||
      getUrlParam("ref") ||
      getUrlParam("friend") ||
      "";

    state.inviterName =
      getUrlParam("inviterName") ||
      getUrlParam("refName") ||
      "";

    loadDailyLimit();

    /*
     * 先載入 localStorage profile。
     */
    try {
      const saved = localStorage.getItem(STORAGE.profile);

      if (saved) {
        state.profile = JSON.parse(saved);
      }
    } catch (error) {}

    /*
     * 若外部已注入 ZELO_PROFILE，直接使用。
     */
    if (window.ZELO_PROFILE) {
      state.profile = window.ZELO_PROFILE;

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
      } catch (error) {}

      return;
    }

    /*
     * LIFF 相容。
     * 不在這裡強制 liff.init，避免破壞既有頁面流程。
     * 如果頁面已完成 liff init，這段會補抓 profile。
     */
    try {
      if (window.liff && typeof window.liff.getProfile === "function") {
        Promise.resolve()
          .then(() => {
            if (typeof window.liff.isLoggedIn === "function" && !window.liff.isLoggedIn()) {
              return null;
            }

            return window.liff.getProfile();
          })
          .then((profile) => {
            if (!profile) return;

            state.profile = profile;
            window.ZELO_PROFILE = profile;

            try {
              localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
            } catch (error) {}

            track("profile_loaded", {
              source: "liff",
              userId: profile.userId || "",
              userName: profile.displayName || ""
            });
          })
          .catch(() => {});
      }
    } catch (error) {}
  }

  /*
   * =========================================================
   * 11. EVENTS / 全域事件綁定
   * =========================================================
   */

    function bindEvents() {
    if (state.eventsBound) return;

    state.eventsBound = true;

    function safeClosest(target, selector) {
      if (!target) return null;

      if (target.closest && typeof target.closest === "function") {
        return target.closest(selector);
      }

      if (target.parentElement && target.parentElement.closest) {
        return target.parentElement.closest(selector);
      }

      return null;
    }

    function handleAction(action, actionEl, eventSource = "unknown") {
      if (!action) return false;

      Sound.resume();

      switch (action) {
        case "start":
          handleHomeStart();
          return true;

        case "home":
          track("home_click", {
            source: state.screen,
            eventSource
          });
          showScreen("start");
          return true;

        case "select":
          track("select_click", {
            source: state.screen,
            eventSource
          });
          stopBattle();
          showScreen("select");
          return true;

        case "battle":
          track("battle_button_click", {
            source: state.screen,
            eventSource,
            selectedTopId: state.selectedTop?.id || ""
          });

          startBattle();
          return true;

        case "retry":
          handleRetry();
          return true;

        case "share":
          shareResult();
          return true;

        case "copy-coupon":
          copyCoupon();
          return true;

        case "shop":
          openShop();
          return true;

        case "change-top":
          handleChangeTop();
          return true;

        default:
          return false;
      }
    }

    function handleTopCard(topCard, eventSource = "unknown") {
      if (!topCard) return false;

      const id =
        topCard.getAttribute("data-id") ||
        topCard.getAttribute("data-top-id");

      if (!id) return false;

      Sound.resume();
      selectTop(id, true);

      track("top_card_click", {
        topId: id,
        eventSource
      });

      return true;
    }

    function handlePrimaryPointerEvent(event, eventSource = "pointer") {
      const target = event.target;

      /*
       * 蓄力按鈕交給 bindChargeButtonDirect() 處理。
       * 這裡不要攔截，避免蓄力事件被重複觸發。
       */
      const chargeBtn = safeClosest(target, ".zg-charge-btn");
      if (chargeBtn) return;

      const topCard = safeClosest(target, ".zg-top-card");
      if (topCard) {
        event.preventDefault();
        event.stopPropagation();

        handleTopCard(topCard, eventSource);
        return;
      }

      const actionEl = safeClosest(target, "[data-zg-action]");
      if (!actionEl) return;

      const action = actionEl.getAttribute("data-zg-action");

      event.preventDefault();
      event.stopPropagation();

      handleAction(action, actionEl, eventSource);
    }

    /*
     * Desktop / normal browser click
     */
    document.addEventListener("click", (event) => {
      handlePrimaryPointerEvent(event, "click");
    }, true);

    /*
     * Mobile / WebView fallback
     * 很多手機 WebView click 會被延遲或被主題攔掉，
     * 所以額外用 pointerup 觸發主要按鈕。
     */
    document.addEventListener("pointerup", (event) => {
      handlePrimaryPointerEvent(event, "pointerup");
    }, {
      capture: true,
      passive: false
    });

    /*
     * iOS Safari / LIFF fallback
     */
    document.addEventListener("touchend", (event) => {
      handlePrimaryPointerEvent(event, "touchend");
    }, {
      capture: true,
      passive: false
    });

    /*
     * 空白鍵蓄力開始
     */
    document.addEventListener("keydown", (event) => {
      if (event.code !== "Space") return;
      if (state.charging) return;
      if (state.running || state.battle || state.finishing) return;
      if (state.screen !== "battle") return;

      event.preventDefault();
      event.stopPropagation();

      Sound.resume();
      startCharging();
    }, true);

    /*
     * 空白鍵放開發射
     */
    document.addEventListener("keyup", (event) => {
      if (event.code !== "Space") return;
      if (!state.charging) return;

      event.preventDefault();
      event.stopPropagation();

      releaseCharging();
    }, true);

    /*
     * 頁面切背景時停止音效 / 若正在蓄力則直接放開
     */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        Sound.stopHum();

        if (state.charging) {
          releaseCharging();
        }

        return;
      }

      if (state.running && state.battle && !state.finishing) {
        Sound.startHum(0, getFeel(state.battle.player.top).humBase);
        Sound.startHum(1, getFeel(state.battle.enemy.top).humBase);
      }
    });

    /*
     * 離開頁面記錄放棄
     */
    window.addEventListener("beforeunload", () => {
      Sound.stopHum();

      if (state.battle && state.running && !state.battle.ended) {
        track("abandon", {
          source: "beforeunload",
          playerHp: Math.max(0, Math.round(state.battle.player.hp)),
          enemyHp: Math.max(0, Math.round(state.battle.enemy.hp)),
          elapsed: Math.round(now() - state.battle.startedAt)
        });
      }
    });

    /*
     * Debug API
     * Console 可測：
     * ZELO_GAME.startBattle()
     * ZELO_GAME.beginChargeBattle()
     * ZELO_GAME.showScreen("battle")
     */
    window.ZELO_GAME = {
      version: VERSION,
      state,

      start: handleHomeStart,
      selectTop,
      startBattle,
      beginChargeBattle,
      startCharging,
      releaseCharging,
      setChargePower,

      stopBattle,
      showScreen,

      getProfile,
      track,
      getMyScore,
      setMyScore,
      loadDailyLimit,

      debugBattleButton() {
        const btn = document.querySelector('[data-zg-action="battle"]');
        console.log("[ZELO] battle button =", btn);
        console.log("[ZELO] state =", state);

        if (btn) {
          console.log("[ZELO] button rect =", btn.getBoundingClientRect());
          console.log("[ZELO] button pointerEvents =", getComputedStyle(btn).pointerEvents);
          console.log("[ZELO] button display =", getComputedStyle(btn).display);
          console.log("[ZELO] button visibility =", getComputedStyle(btn).visibility);
        }
      },

      forceBattle() {
        startBattle();
      },

      forceCharge() {
        beginChargeBattle();
      }
    };
  }


  /*
   * =========================================================
   * 12. INIT / 啟動
   * =========================================================
   */

      function boot() {
    if (state.booted) return;

    state.booted = true;

    ensureAppHeight();
    ensureBasicDom();
    injectVisualEnhancements();
    injectHomeEmergencyFixStyles();
    injectBattleEmergencyFixStyles();
    initProfile();
    bindEvents();
    watchMenuDom();

    state.selectedTop = loadSelectedTop();

    loadDailyLimit();

    showScreen("start");

    track("boot", {
      selectedTopId: state.selectedTop?.id || "",
      selectedTopName: state.selectedTop?.name || "",
      selectedTopType: state.selectedTop?.type || "",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });
  }

  if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
  
})();
