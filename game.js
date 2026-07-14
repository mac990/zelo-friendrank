/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607150130-clean-fixed-duplicate-charge
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
 * - 修正重複蓄力 UI：只保留 panel bottom charge layer
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const VERSION = "202607150130-clean-fixed-duplicate-charge";

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

  const EXTERNAL_TOP_PHOTO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

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

    initialSpeed: 9.6,
    maxSpeed: 18.5,

    friction: 0.9965,
    spinDecay: 0.9972,

    wallRestitution: 0.96,

    hitRestitution: 0.88,

    energyDamageScale: 1.9,
    spinDamageScale: 0.055,
    minCollisionEnergy: 0.22,
    maxCollisionDamage: 42,

    collisionCooldown: 46,
    separationBias: 3.2,
    tangentTransfer: 0.085,

    seekForceMax: 0.045,
    tangentForce: 0.062,

    hpOnlyFinish: true,

    battleLimit: 9000,
    minMotion: 0.7,

    stopSpinThreshold: 0.055,
    stopSpeedThreshold: 0.45,
    stopGraceMs: 1300,

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
    booted: false,

    lastActionAt: 0,
    lastActionKey: ""
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

  function getLaunchGrade(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    if (p >= CHARGE.perfectMin && p <= CHARGE.perfectMax) {
      return "perfect";
    }

    if (p > CHARGE.perfectMax) {
      return "over";
    }

    if (p >= CHARGE.goodMin) {
      return "good";
    }

    if (p < CHARGE.weakMax) {
      return "weak";
    }

    return "normal";
  }

  function getMyScore() {
    try {
      return Number(localStorage.getItem(STORAGE.myScore) || 1200);
    } catch (error) {
      return 1200;
    }
  }

  function setMyScore(score) {
    try {
      localStorage.setItem(STORAGE.myScore, String(Math.max(0, Math.round(score))));
    } catch (error) {}
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

  function shouldIgnoreRepeatedAction(key, gap = 420) {
    const t = now();

    if (state.lastActionKey === key && t - state.lastActionAt < gap) {
      return true;
    }

    state.lastActionKey = key;
    state.lastActionAt = t;

    return false;
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
function hardResetGamePage() {
  /*
   * 清掉舊版遊戲產生的所有畫面與殘留 DOM
   * 只保留 Shopify 頁面本身，然後重新建立乾淨 root
   */

  try {
    if (window.ZGMenuObserver) {
      window.ZGMenuObserver.disconnect();
      window.ZGMenuObserver = null;
    }
  } catch (error) {}

  try {
    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    if (state.chargeRaf) {
      cancelAnimationFrame(state.chargeRaf);
      state.chargeRaf = null;
    }
  } catch (error) {}

  const removeSelectors = [
    "#screen-start",
    "#screen-home",
    "#screen-select",
    "#screen-battle",
    "#screen-result",

    ".zg-screen",
    ".zg-main",
    ".zg-bottom",
    ".zg-topbar",
    ".zg-panel",
    ".zg-battle-box",
    ".zg-charge-layer",
    ".zg-charge-card",
    ".zg-charge-meter",
    ".zg-charge-btn",
    ".zg-energy-grid",
    ".zg-stardust",
    ".zg-star",
    ".zg-hero",
    ".zg-bg-logo",
    ".zg-fixed-logo",
    ".zg-danger-vignette",
    ".zg-flash-overlay",
    ".zg-xtreme-zone",
    ".zg-pocket-zone",
    ".zg-battle-top",
    ".zg-player-top",
    ".zg-enemy-top",
    ".zg-spark",
    ".zg-impact-ring",
    ".zg-metal-spark",
    ".zg-scratch",
    ".zg-launch-shockwave",
    ".zg-spin-afterimage",
    ".zg-impact-streak",
    ".zg-burst-piece",
    ".zg-wall-flash"
  ];

  removeSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      try {
        el.remove();
      } catch (error) {}
    });
  });

  const removeStyleIds = [
    "zg-bg-style",
    "zg-main-button-fix-style",
    "zg-battle-emergency-fix-style",
    "zg-result-fix-style",
    "zg-energy-charge-style"
  ];

  removeStyleIds.forEach((id) => {
    const style = document.getElementById(id);
    if (style) {
      try {
        style.remove();
      } catch (error) {}
    }
  });

  document.body.removeAttribute("data-zg-screen");

  let root = document.getElementById("zelo-liff-game");

  if (!root) {
    root = document.createElement("div");
    root.id = "zelo-liff-game";
    document.body.appendChild(root);
  }

  root.innerHTML = "";
  root.className = "zg-clean-root";

  root.style.setProperty("width", "100%", "important");
  root.style.setProperty("min-height", "100vh", "important");
  root.style.setProperty("background", "#090612", "important");
  root.style.setProperty("overflow", "hidden", "important");

  state.screen = "start";
  state.battle = null;
  state.running = false;
  state.paused = false;
  state.finishing = false;
  state.pendingResult = null;
  state.charging = false;
  state.launchPower = 0;
}

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

  function battleBox() {
    return $(".zg-battle-box") || $("#zg-battle-box") || screenBattle() || appRoot();
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
        el.style.setProperty("height", "0", "important");
        el.style.setProperty("min-height", "0", "important");
        el.style.setProperty("max-height", "0", "important");
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

  function ensureBasicDom() {
    const root = appRoot();

    removeDuplicateScreenDom();

    ensureHomeDom(root);
    ensureSelectDom(root);
    ensureResultDom(root);

    removeDuplicateScreenDom();
    removeLogoDom();
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
      screen.style.setProperty("visibility", "hidden", "important");
      screen.style.setProperty("pointer-events", "none", "important");
      screen.setAttribute("aria-hidden", "true");
    });

    if (target) {
      target.classList.add("active", "is-active");
      target.hidden = false;
      target.style.setProperty("display", "flex", "important");
      target.style.setProperty("flex-direction", "column", "important");
      target.style.setProperty("visibility", "visible", "important");
      target.style.setProperty("pointer-events", "auto", "important");
      target.setAttribute("aria-hidden", "false");

      $$(
        "[data-zg-action], .zg-btn, .zg-small-btn, .zg-top-card, .zg-charge-btn",
        target
      ).forEach((el) => {
        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("position", "relative", "important");
        el.style.setProperty("z-index", "20", "important");
      });
    }

    document.body.setAttribute("data-zg-screen", name);

    removeMenuDom();
    removeLogoDom();

    if (name === "start" || name === "home") onHomeShown();
    if (name === "select") onSelectShown();
    if (name === "battle") onBattleShown();
    if (name === "result") onResultShown();
  }

  function injectBackgroundStyles() {
    const old = $("#zg-bg-style");
    if (old) old.remove();

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
        background: #090612 !important;
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

      #screen-start.zg-home-bg-screen,
      #screen-start {
        background-image:
          radial-gradient(circle at 20% 20%, rgba(255,40,80,0.2), transparent 36%),
          radial-gradient(circle at 85% 15%, rgba(0,190,255,0.16), transparent 34%),
          linear-gradient(rgba(10, 8, 18, 0.16), rgba(10, 8, 18, 0.62)),
          var(--zg-home-bg-image) !important;
        background-size: cover, cover, cover, contain !important;
        background-position: center center !important;
        background-repeat: no-repeat !important;
        background-color: #120914 !important;
      }

      #screen-select,
      #screen-battle,
      #screen-result {
        background:
          radial-gradient(circle at 18% 14%, rgba(255,45,85,0.24), transparent 34%),
          radial-gradient(circle at 82% 12%, rgba(0,200,255,0.18), transparent 34%),
          linear-gradient(160deg, #110617 0%, #07101c 55%, #050810 100%) !important;
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

      [data-zg-action],
      .zg-btn,
      .zg-small-btn,
      .zg-top-card {
        pointer-events: auto !important;
        position: relative !important;
        z-index: 20 !important;
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
    `;

    document.head.appendChild(style);
  }

  function injectMainButtonFixStyles() {
    const old = document.querySelector("#zg-main-button-fix-style");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "zg-main-button-fix-style";

    style.textContent = `
      body[data-zg-screen="start"] #screen-start .zg-bottom,
      body[data-zg-screen="home"] #screen-start .zg-bottom,
      body[data-zg-screen="select"] #screen-select .zg-bottom {
        position: relative !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
        overflow: visible !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      body[data-zg-screen="start"] #screen-start [data-zg-action="start"],
      body[data-zg-screen="home"] #screen-start [data-zg-action="start"],
      body[data-zg-screen="select"] #screen-select [data-zg-action="battle"] {
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
        cursor: pointer !important;
      }

      body[data-zg-screen="start"] #screen-start [data-zg-action="start"]::before,
      body[data-zg-screen="start"] #screen-start [data-zg-action="start"]::after,
      body[data-zg-screen="home"] #screen-start [data-zg-action="start"]::before,
      body[data-zg-screen="home"] #screen-start [data-zg-action="start"]::after,
      body[data-zg-screen="select"] #screen-select [data-zg-action="battle"]::before,
      body[data-zg-screen="select"] #screen-select [data-zg-action="battle"]::after {
        display: none !important;
        content: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: 0 !important;
        max-height: 0 !important;
        background: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
        border: 0 !important;
        transform: none !important;
        animation: none !important;
      }

      body[data-zg-screen] .zg-energy-grid,
      body[data-zg-screen] .zg-stardust,
      body[data-zg-screen] .zg-star,
      body[data-zg-screen] .zg-hero {
        pointer-events: none !important;
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
       * Duplicate Charge UI Fix
       * =====================================================
       * 強制禁止戰鬥盤 .zg-battle-box 內出現任何蓄力 UI。
       * 蓄力 UI 只能存在於：
       * .zg-panel .zg-bottom-control-row
       */
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-charge-layer,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-charge-card,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-charge-meter,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-charge-btn,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-charge-fill,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-shell,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-fill,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-track,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-glow,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-perfect-zone,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-over-zone,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-scan,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-energy-cap,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-launch-prep,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-launch-panel,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-launch-card,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-launch-layer,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-prebattle-layer,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-prep-card,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-pull-layer,
      body[data-zg-screen="battle"] #screen-battle .zg-battle-box .zg-pull-card {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      /*
       * 新版蓄力 UI：只允許 panel bottom row 內顯示。
       */
      body[data-zg-screen="battle"] #screen-battle[data-zg-charging="1"] .zg-panel .zg-bottom-control-row {
  display: grid !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  grid-template-columns: 30% minmax(0, 1fr) !important;
  gap: 12px !important;
  width: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

body[data-zg-screen="battle"] #screen-battle:not([data-zg-charging="1"]) .zg-panel .zg-bottom-control-row {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  overflow: hidden !important;
}

      body[data-zg-screen="battle"] #screen-battle .zg-panel .zg-bottom-control-row .zg-external-top-photo {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: none !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-panel .zg-bottom-control-row .zg-charge-layer {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-panel .zg-bottom-control-row .zg-charge-card {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-panel .zg-bottom-control-row .zg-charge-meter {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
      }

      body[data-zg-screen="battle"] #screen-battle .zg-panel .zg-bottom-control-row .zg-charge-btn {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        touch-action: none !important;
      }

      /*
       * =====================================================
       * Battle screen layout
       * =====================================================
       */
      body[data-zg-screen="battle"] #screen-battle {
        height: var(--zg-app-height, 100vh) !important;
        min-height: var(--zg-app-height, 100vh) !important;
        max-height: var(--zg-app-height, 100vh) !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
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
       * Battle topbar / 退出按鈕
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
       * Battle tops visual
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
    `;

    document.head.appendChild(style);
  }

    function injectResultFixStyles() {
    const old = document.querySelector("#zg-result-fix-style");
    if (old) old.remove();

    const style = document.createElement("style");
    style.id = "zg-result-fix-style";

    style.textContent = `
      body[data-zg-screen="result"] #screen-result {
        display: flex !important;
        flex-direction: column !important;
        min-height: var(--zg-app-height, 100vh) !important;
        overflow-y: auto !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-result-main {
        flex: 1 1 auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 24px 16px 150px !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-result-card {
        width: 100% !important;
        max-width: 460px !important;
        background: linear-gradient(160deg, rgba(40,46,68,0.96), rgba(16,18,32,0.97)) !important;
        border: 1px solid rgba(255,255,255,0.16) !important;
        border-radius: 24px !important;
        padding: 28px 22px !important;
        box-shadow: 0 18px 44px rgba(0,0,0,0.5), inset 0 0 24px rgba(255,255,255,0.04) !important;
        color: #fff !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 14px !important;
      }

      #screen-result .zg-result-rank-wrap {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      #screen-result .zg-rank {
        width: 84px !important;
        height: 84px !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 40px !important;
        font-weight: 1000 !important;
        color: #fff !important;
        background: radial-gradient(circle at 32% 28%, #ffd45a, #ff9f1a 55%, #b45a00 100%) !important;
        box-shadow: 0 0 28px rgba(255,170,30,0.6), inset 0 0 14px rgba(255,255,255,0.25) !important;
        border: 4px solid rgba(255,255,255,0.8) !important;
      }

      #screen-result .zg-rank.lose {
        background: radial-gradient(circle at 32% 28%, #9aa4c2, #3d4664 55%, #171b2c 100%) !important;
        box-shadow: 0 0 28px rgba(90,100,150,0.5), inset 0 0 14px rgba(255,255,255,0.16) !important;
      }

      #screen-result .zg-result-title {
        margin: 0 !important;
        font-size: 26px !important;
        font-weight: 1000 !important;
        text-align: center !important;
      }

      #screen-result .zg-result-desc {
        margin: 0 !important;
        font-size: 14px !important;
        text-align: center !important;
        opacity: 0.88 !important;
        line-height: 1.5 !important;
      }

      #screen-result .zg-result-stats {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: 10px !important;
      }

      #screen-result .zg-result-stat {
        background: rgba(255,255,255,0.06) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 14px !important;
        padding: 10px 12px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-result-stat span {
        font-size: 11px !important;
        opacity: 0.7 !important;
      }

      #screen-result .zg-result-stat b {
        font-size: 18px !important;
        font-weight: 1000 !important;
      }

      #screen-result #zg-result-score.positive { color: #6dffb0 !important; }
      #screen-result #zg-result-score.negative { color: #ff7a7a !important; }

      #screen-result .zg-coupon {
        width: 100% !important;
        background: linear-gradient(160deg, rgba(255,190,50,0.14), rgba(255,90,30,0.08)) !important;
        border: 1px dashed rgba(255,200,80,0.55) !important;
        border-radius: 16px !important;
        padding: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 8px !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-coupon-label {
        font-size: 12px !important;
        opacity: 0.8 !important;
      }

      #screen-result .zg-coupon-code {
        font-size: 24px !important;
        font-weight: 1000 !important;
        letter-spacing: 2px !important;
        color: #ffd84a !important;
      }

      #screen-result .zg-coupon-note {
        font-size: 11px !important;
        opacity: 0.75 !important;
        text-align: center !important;
      }

      #screen-result .zg-coupon button.zg-small-btn {
        width: 100% !important;
        max-width: 280px !important;
        height: 40px !important;
        border-radius: 999px !important;
        border: 0 !important;
        font-weight: 900 !important;
        cursor: pointer !important;
        pointer-events: auto !important;
      }

      #screen-result .zg-coupon-copy {
        background: linear-gradient(90deg, #fff29b, #ff9f1a) !important;
        color: #111 !important;
      }

      #screen-result .zg-coupon-download {
        background: rgba(255,255,255,0.1) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,0.24) !important;
      }

      #screen-result .zg-rankbox {
        width: 100% !important;
        background: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 16px !important;
        padding: 14px !important;
        box-sizing: border-box !important;
      }

      #screen-result .zg-rankbox-title {
        font-size: 13px !important;
        font-weight: 900 !important;
        margin-bottom: 8px !important;
        opacity: 0.9 !important;
      }

      #screen-result .zg-rank-row {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 6px 4px !important;
        font-size: 13px !important;
        border-bottom: 1px solid rgba(255,255,255,0.06) !important;
      }

      #screen-result .zg-rank-row.me {
        background: rgba(255,200,80,0.12) !important;
        border-radius: 10px !important;
      }

      #screen-result .zg-rank-num {
        width: 28px !important;
        opacity: 0.7 !important;
        font-weight: 900 !important;
      }

      #screen-result .zg-rank-name {
        flex: 1 1 auto !important;
      }

      #screen-result .zg-rank-score {
        font-weight: 900 !important;
      }

      #screen-result .zg-rank-invite-tip {
        margin-top: 8px !important;
        font-size: 11px !important;
        opacity: 0.7 !important;
        text-align: center !important;
      }

      body[data-zg-screen="result"] .zg-bottom.zg-result-actions {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        display: flex !important;
        gap: 10px !important;
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
        background: linear-gradient(180deg, rgba(9,6,18,0), rgba(9,6,18,0.92) 40%) !important;
        z-index: 9999 !important;
        pointer-events: auto !important;
      }

      body[data-zg-screen="result"] .zg-bottom.zg-result-actions .zg-btn {
        flex: 1 1 auto !important;
        height: 50px !important;
        border-radius: 999px !important;
        font-weight: 1000 !important;
        font-size: 15px !important;
        border: 0 !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        position: relative !important;
        z-index: 10000 !important;
      }

      body[data-zg-screen="result"] .zg-bottom.zg-result-actions .zg-btn-red {
        background: linear-gradient(90deg, #ff3a3a, #d90018) !important;
        color: #fff !important;
        box-shadow: 0 10px 26px rgba(255,0,35,0.4) !important;
      }

      body[data-zg-screen="result"] .zg-bottom.zg-result-actions .zg-btn:not(.zg-btn-red) {
        background: rgba(255,255,255,0.1) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,0.24) !important;
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
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent);
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
        0% { background-position: 0% 50%; }
        100% { background-position: 180% 50%; }
      }

      @keyframes zgEnergyStripes {
        0% { transform: translateX(0); }
        100% { transform: translateX(24px); }
      }

      @keyframes zgEnergyShine {
        0% { left: -130px; opacity: 0; }
        30% { opacity: 1; }
        100% { left: 100%; opacity: 0; }
      }

      @keyframes zgEnergyScanPulse {
        0%, 100% { opacity: 0.28; filter: blur(0); }
        50% { opacity: 0.72; filter: blur(1px); }
      }

      @keyframes zgEnergyPerfectPulse {
        0%, 100% { opacity: 0.36; filter: brightness(1); }
        50% { opacity: 1; filter: brightness(1.8); }
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
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.035); }
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

   function injectVisualEnhancements() {
    injectBackgroundStyles();
    injectMainButtonFixStyles();
    injectEnergyChargeStyles();
    injectBattleEmergencyFixStyles();
    injectResultFixStyles();

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
    fixSelectBattleButtonVisualNow();

    if (screenBattle()) {
      ensureBattleVisualDom();
      cleanupDuplicateChargeDom();
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

        <p class="zg-subtitle" style="font-size:12px;opacity:.88;margin-top:8px;">
          選擇你的陀螺，體驗真實物理碰撞與打擊感對戰。
        </p>
      </main>

      <div class="zg-bottom" style="position:relative;z-index:9999;pointer-events:auto;">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="start"
          type="button"
          style="position:relative;z-index:10000;pointer-events:auto;"
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
      btn.style.setProperty("cursor", "pointer", "important");
    }

    $$(".zg-energy-grid, .zg-stardust, .zg-star, .zg-hero, .zg-bg-logo, .zg-fixed-logo", start)
      .forEach((el) => {
        el.style.setProperty("pointer-events", "none", "important");
      });
  }

  function onHomeShown() {
    stopBattle();
    cancelChargeLoop();
    removeMenuDom();
    removeLogoDom();
    fixHomeButtonVisualNow();
  }

  function handleHomeStart() {
    if (shouldIgnoreRepeatedAction("start", 500)) return;

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

      <div class="zg-bottom" style="position:relative;z-index:9999;pointer-events:auto;">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="battle"
          type="button"
          style="position:relative;z-index:10000;pointer-events:auto;"
        >
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
    fixSelectBattleButtonVisualNow();

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
              <div class="zg-stat"><span>攻擊</span><strong>${top.power}</strong></div>
              <div class="zg-stat"><span>防禦</span><strong>${top.defense}</strong></div>
              <div class="zg-stat"><span>耐久</span><strong>${top.stamina}</strong></div>
              <div class="zg-stat"><span>速度</span><strong>${top.speed}</strong></div>
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
      el.style.setProperty("z-index", "20", "important");
    });

    fixSelectBattleButtonVisualNow();
  }

  function fixSelectBattleButtonVisualNow() {
    const select = screenSelect();
    if (!select) return;

    const bottom = $(".zg-bottom", select);
    const btn = $('[data-zg-action="battle"]', select);

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
      btn.style.setProperty("cursor", "pointer", "important");
    }

    $$(".zg-energy-grid, .zg-stardust, .zg-star, .zg-hero, .zg-bg-logo, .zg-fixed-logo", select)
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
 * 07-09. LAUNCH / BATTLE / RESULT CLEAN FLOW
 * 準備發射 / 對戰頁 / 結果頁 整合重寫版
 * =========================================================
 */

/*
 * ---------------------------------------------------------
 * 07-0. Clean Battle Style
 * ---------------------------------------------------------
 */

function injectCleanBattleStyles() {
  const old = document.getElementById("zg-clean-battle-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-clean-battle-style";

  style.textContent = `
    body[data-zg-screen="battle"],
    body[data-zg-screen="result"] {
      background: #080611 !important;
      overflow: hidden !important;
    }

    #screen-battle,
    #screen-result {
      width: 100% !important;
      min-height: var(--zg-app-height, 100vh) !important;
      height: var(--zg-app-height, 100vh) !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      color: #fff !important;
      background:
        radial-gradient(circle at 18% 12%, rgba(255,45,85,0.22), transparent 34%),
        radial-gradient(circle at 86% 10%, rgba(0,210,255,0.18), transparent 36%),
        linear-gradient(160deg, #120617 0%, #06111e 58%, #050711 100%) !important;
    }

    #screen-battle {
      display: none !important;
      flex-direction: column !important;
    }

    body[data-zg-screen="battle"] #screen-battle.active,
    body[data-zg-screen="battle"] #screen-battle.is-active {
      display: flex !important;
    }

    #screen-battle .zg-battle-header {
      position: absolute !important;
      top: 8px !important;
      right: 12px !important;
      z-index: 50 !important;
      display: flex !important;
      justify-content: flex-end !important;
      pointer-events: none !important;
    }

    #screen-battle .zg-battle-header button {
      pointer-events: auto !important;
      min-height: 36px !important;
      padding: 0 16px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,0.24) !important;
      background: rgba(34,42,58,0.92) !important;
      color: #fff !important;
      font-weight: 900 !important;
      font-size: 13px !important;
      cursor: pointer !important;
    }

    #screen-battle .zg-battle-main {
      width: 100% !important;
      max-width: 860px !important;
      height: 100% !important;
      margin: 0 auto !important;
      padding: 52px 12px 12px !important;
      box-sizing: border-box !important;
      display: grid !important;
      grid-template-rows: minmax(0, 1fr) auto !important;
      gap: 10px !important;
      overflow: hidden !important;
    }

    .zg-arena-wrap {
      position: relative !important;
      width: 100% !important;
      min-height: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
    }

    .zg-battle-box {
      position: relative !important;
      width: min(100%, 760px) !important;
      aspect-ratio: 1 / 1 !important;
      max-height: 100% !important;
      border-radius: 26px !important;
      overflow: hidden !important;
      background:
        radial-gradient(circle at 50% 50%, rgba(72,82,112,0.5), rgba(10,12,22,0.98)) !important;
      border: 1px solid rgba(255,255,255,0.16) !important;
      box-shadow:
        inset 0 0 34px rgba(255,255,255,0.07),
        0 0 0 3px rgba(255,35,55,0.18) !important;
      flex: 0 1 auto !important;
    }

    .zg-arena-logo-img {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      width: 68% !important;
      height: auto !important;
      transform: translate(-50%, -50%) rotate(-8deg) !important;
      opacity: 0.78 !important;
      filter: invert(1) brightness(2.1) contrast(1.2) !important;
      mix-blend-mode: screen !important;
      pointer-events: none !important;
      user-select: none !important;
      z-index: 1 !important;
    }

    .zg-arena-ring,
    .zg-flash-overlay,
    .zg-xtreme-zone,
    .zg-pocket-zone,
    .zg-danger-vignette {
      pointer-events: none !important;
    }

    .zg-battle-panel {
      width: 100% !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .zg-hp-group {
      flex: 0 0 auto !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 5px !important;
    }

    .zg-hp-row {
      display: grid !important;
      grid-template-columns: 28px minmax(0, 1fr) 42px !important;
      gap: 8px !important;
      align-items: center !important;
      color: #fff !important;
      font-size: 12px !important;
      font-weight: 900 !important;
    }

    .zg-hp-bar {
      height: 14px !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,0.12) !important;
      overflow: hidden !important;
      box-shadow: inset 0 0 8px rgba(0,0,0,0.48) !important;
    }

    .zg-hp-fill {
      height: 100% !important;
      width: 100% !important;
      border-radius: 999px !important;
      transition: width 180ms ease-out !important;
    }

    .zg-player-hp {
      background: linear-gradient(90deg, #39f5ff, #00d46a) !important;
    }

    .zg-enemy-hp {
      background: linear-gradient(90deg, #ff3838, #ffd84a) !important;
    }

    .zg-commentary {
      flex: 0 0 44px !important;
      min-height: 44px !important;
      border-radius: 14px !important;
      background: rgba(255,255,255,0.08) !important;
      color: #fff !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      padding: 8px 12px !important;
      box-sizing: border-box !important;
    }

    .zg-launch-row {
      flex: 1 1 auto !important;
      min-height: 168px !important;
      display: grid !important;
      grid-template-columns: 30% minmax(0, 1fr) !important;
      gap: 10px !important;
      overflow: hidden !important;
    }

    #screen-battle[data-phase="battle"] .zg-launch-row {
      display: none !important;
    }

    .zg-external-top-photo {
      border-radius: 14px !important;
      overflow: hidden !important;
      background: rgba(255,255,255,0.08) !important;
      min-height: 0 !important;
      position: relative !important;
    }

    .zg-external-top-photo img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
    }

    .zg-external-photo-label {
      position: absolute !important;
      left: 8px !important;
      top: 8px !important;
      z-index: 2 !important;
      padding: 4px 8px !important;
      border-radius: 999px !important;
      background: rgba(0,0,0,0.5) !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      color: #fff !important;
    }

    .zg-charge-layer {
      min-width: 0 !important;
      min-height: 0 !important;
    }

    .zg-charge-card {
      height: 100% !important;
      border-radius: 18px !important;
      padding: 14px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 8px !important;
      background: linear-gradient(160deg, rgba(40,46,68,0.96), rgba(16,18,32,0.96)) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      box-shadow: inset 0 0 18px rgba(255,255,255,0.04) !important;
      overflow: hidden !important;
    }

    .zg-charge-title {
      font-size: 18px !important;
      font-weight: 1000 !important;
      line-height: 1.1 !important;
    }

    .zg-charge-subtitle,
    .zg-charge-tip {
      font-size: 11px !important;
      opacity: 0.82 !important;
      text-align: center !important;
      line-height: 1.35 !important;
    }

    .zg-charge-meter {
      width: 100% !important;
      height: 48px !important;
      position: relative !important;
      display: flex !important;
      align-items: center !important;
      padding-left: 50px !important;
      box-sizing: border-box !important;
    }

    .zg-charge-percent-badge {
      position: absolute !important;
      left: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 17px !important;
      font-weight: 1000 !important;
      color: #fff !important;
      background: radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%) !important;
      border: 3px solid rgba(255,255,255,0.85) !important;
      z-index: 5 !important;
    }

    .zg-energy-shell {
      position: relative !important;
      width: 100% !important;
      height: 30px !important;
      border-radius: 999px !important;
      overflow: hidden !important;
      background: rgba(20,30,38,0.98) !important;
      border: 2px solid rgba(255,255,255,0.55) !important;
      box-shadow: inset 0 0 14px rgba(0,0,0,0.72) !important;
    }

    .zg-energy-track {
      position: absolute !important;
      inset: 0 !important;
      background: repeating-linear-gradient(
        90deg,
        rgba(255,255,255,0.08) 0 1px,
        transparent 1px 28px
      ) !important;
      z-index: 1 !important;
    }

    .zg-energy-fill,
    .zg-energy-glow {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      bottom: 0 !important;
      width: 0% !important;
      border-radius: 999px !important;
    }

    .zg-energy-fill {
      background: linear-gradient(90deg, #00e5ff, #18ff7a, #fff35a) !important;
      z-index: 2 !important;
    }

    .zg-energy-glow {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.72)) !important;
      filter: blur(7px) !important;
      z-index: 3 !important;
    }

    .zg-energy-perfect-zone {
      position: absolute !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 88% !important;
      width: 3% !important;
      background: rgba(255,240,120,0.85) !important;
      z-index: 4 !important;
      box-shadow: 0 0 14px rgba(255,240,120,0.9) !important;
    }

    .zg-energy-over-zone {
      position: absolute !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 91% !important;
      right: 0 !important;
      background: rgba(150,80,255,0.42) !important;
      z-index: 2 !important;
    }

    .zg-energy-cap {
      position: absolute !important;
      left: 0% !important;
      top: 50% !important;
      width: 10px !important;
      height: 38px !important;
      border-radius: 999px !important;
      background: #fff !important;
      transform: translate(-50%, -50%) !important;
      box-shadow: 0 0 12px rgba(255,255,255,0.8) !important;
      z-index: 6 !important;
    }

    .zg-charge-btn {
      width: 100% !important;
      min-height: 40px !important;
      border-radius: 999px !important;
      border: 0 !important;
      background: linear-gradient(90deg, #fff29b, #ff9f1a) !important;
      color: #111 !important;
      font-weight: 1000 !important;
      font-size: 15px !important;
      touch-action: none !important;
      cursor: pointer !important;
    }

    .zg-battle-top {
      position: absolute !important;
      width: 68px !important;
      height: 68px !important;
      min-width: 68px !important;
      min-height: 68px !important;
      border-radius: 999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      pointer-events: none !important;
      z-index: 20 !important;
      background:
        radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), transparent 18%),
        conic-gradient(from 0deg, var(--c1, #ff3d3d), var(--c2, #ffd84a), var(--c1, #ff3d3d)) !important;
      box-shadow:
        0 0 18px rgba(255,90,80,0.48),
        inset 0 0 12px rgba(0,0,0,0.25) !important;
      overflow: hidden !important;
    }

    .zg-battle-top span {
      font-size: 30px !important;
      line-height: 1 !important;
    }

    /*
     * Result
     */
    #screen-result {
      display: none !important;
      flex-direction: column !important;
      overflow-y: auto !important;
    }

    body[data-zg-screen="result"] #screen-result.active,
    body[data-zg-screen="result"] #screen-result.is-active {
      display: flex !important;
    }

    #screen-result .zg-result-main {
      flex: 1 1 auto !important;
      width: 100% !important;
      max-width: 620px !important;
      margin: 0 auto !important;
      padding: 28px 16px 120px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
    }

    .zg-result-card {
      width: 100% !important;
      border-radius: 24px !important;
      padding: 24px 18px !important;
      background: linear-gradient(160deg, rgba(40,46,68,0.96), rgba(16,18,32,0.97)) !important;
      border: 1px solid rgba(255,255,255,0.16) !important;
      box-shadow: 0 18px 44px rgba(0,0,0,0.5) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 14px !important;
      box-sizing: border-box !important;
    }

    .zg-rank {
      width: 82px !important;
      height: 82px !important;
      border-radius: 999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 40px !important;
      font-weight: 1000 !important;
      background: radial-gradient(circle at 32% 28%, #ffd45a, #ff9f1a 55%, #b45a00 100%) !important;
      border: 4px solid rgba(255,255,255,0.8) !important;
    }

    .zg-rank.lose {
      background: radial-gradient(circle at 32% 28%, #9aa4c2, #3d4664 55%, #171b2c 100%) !important;
    }

    .zg-result-title {
      margin: 0 !important;
      font-size: 26px !important;
      font-weight: 1000 !important;
      text-align: center !important;
    }

    .zg-result-desc {
      margin: 0 !important;
      font-size: 14px !important;
      opacity: 0.86 !important;
      text-align: center !important;
      line-height: 1.5 !important;
    }

    .zg-result-stats {
      width: 100% !important;
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
    }

    .zg-result-stat {
      border-radius: 14px !important;
      padding: 10px 12px !important;
      background: rgba(255,255,255,0.06) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 4px !important;
    }

    .zg-result-stat span {
      font-size: 11px !important;
      opacity: 0.7 !important;
    }

    .zg-result-stat b {
      font-size: 18px !important;
      font-weight: 1000 !important;
    }

    .zg-coupon {
      width: 100% !important;
      border-radius: 16px !important;
      padding: 14px !important;
      background: linear-gradient(160deg, rgba(255,190,50,0.14), rgba(255,90,30,0.08)) !important;
      border: 1px dashed rgba(255,200,80,0.55) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 8px !important;
      box-sizing: border-box !important;
    }

    .zg-coupon-code {
      font-size: 24px !important;
      font-weight: 1000 !important;
      letter-spacing: 2px !important;
      color: #ffd84a !important;
    }

    .zg-result-actions {
      position: fixed !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 100 !important;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      background: linear-gradient(180deg, rgba(9,6,18,0), rgba(9,6,18,0.92) 36%) !important;
      display: flex !important;
      gap: 10px !important;
      box-sizing: border-box !important;
    }

    .zg-result-actions .zg-btn {
      flex: 1 1 0 !important;
      min-height: 50px !important;
      border-radius: 999px !important;
      border: 0 !important;
      font-weight: 1000 !important;
      cursor: pointer !important;
    }

    .zg-result-actions .zg-btn-red {
      background: linear-gradient(90deg, #ff3a3a, #d90018) !important;
      color: #fff !important;
    }

    .zg-result-actions .zg-btn:not(.zg-btn-red) {
      background: rgba(255,255,255,0.1) !important;
      color: #fff !important;
      border: 1px solid rgba(255,255,255,0.24) !important;
    }

    @media (max-width: 520px) {
      #screen-battle .zg-battle-main {
        padding-left: 10px !important;
        padding-right: 10px !important;
        gap: 8px !important;
      }

      .zg-launch-row {
        grid-template-columns: 30% minmax(0, 1fr) !important;
        min-height: 150px !important;
      }

      .zg-charge-card {
        padding: 12px 10px !important;
        gap: 6px !important;
      }

      .zg-charge-title {
        font-size: 17px !important;
      }

      .zg-charge-subtitle,
      .zg-charge-tip {
        font-size: 10px !important;
      }

      .zg-charge-meter {
        height: 44px !important;
        padding-left: 46px !important;
      }

      .zg-charge-percent-badge {
        width: 44px !important;
        height: 44px !important;
        font-size: 16px !important;
      }

      .zg-energy-shell {
        height: 26px !important;
      }

      .zg-charge-btn {
        min-height: 38px !important;
        font-size: 14px !important;
      }
    }
  `;

  document.head.appendChild(style);
}


/*
 * ---------------------------------------------------------
 * 07-1. Battle DOM
 * ---------------------------------------------------------
 */

function ensureBattleDom(root = appRoot()) {
  injectCleanBattleStyles();

  let section = screenBattle();

  if (!section) {
    section = document.createElement("section");
    section.id = "screen-battle";
    section.className = "zg-screen";
    section.hidden = true;

    section.innerHTML = `
      <div class="zg-battle-header">
        <button class="zg-small-btn" data-zg-action="select" type="button">
          退出
        </button>
      </div>

      <main class="zg-battle-main">
        <div class="zg-arena-wrap">
          <div class="zg-battle-box" id="zg-battle-box">
            <img
              class="zg-arena-logo-img"
              src="${ARENA_LOGO_URL}"
              alt=""
              draggable="false"
              aria-hidden="true"
            >
            <div class="zg-arena-ring"></div>
            <div class="zg-flash-overlay"></div>
          </div>
        </div>

        <div class="zg-battle-panel">
          <div class="zg-hp-group">
            <div class="zg-hp-row">
              <span class="zg-hp-name">你</span>
              <div class="zg-hp-bar">
                <div class="zg-hp-fill zg-player-hp" id="zg-player-hp"></div>
              </div>
              <span class="zg-hp-text" id="zg-player-hp-text">100%</span>
            </div>

            <div class="zg-hp-row">
              <span class="zg-hp-name">敵</span>
              <div class="zg-hp-bar">
                <div class="zg-hp-fill zg-enemy-hp" id="zg-enemy-hp"></div>
              </div>
              <span class="zg-hp-text" id="zg-enemy-hp-text">100%</span>
            </div>
          </div>

          <div class="zg-commentary">
            準備拉繩，按住按鈕蓄力！
          </div>

          <div class="zg-launch-row">
            <div class="zg-external-top-photo">
              <span class="zg-external-photo-label">外部陀螺</span>
              <img
                src="${EXTERNAL_TOP_PHOTO_URL}"
                alt="外部陀螺"
                draggable="false"
              >
            </div>

            <div class="zg-charge-layer" data-charge-grade="weak">
              <div class="zg-charge-card">
                <div class="zg-charge-title">拉繩發射！</div>
                <div class="zg-charge-subtitle">按住蓄力，接近完美區放開！</div>

                <div class="zg-charge-meter">
                  <div class="zg-charge-percent-badge">0%</div>

                  <div class="zg-energy-shell">
                    <div class="zg-energy-track"></div>
                    <div class="zg-energy-fill"></div>
                    <div class="zg-energy-glow"></div>
                    <div class="zg-energy-perfect-zone"></div>
                    <div class="zg-energy-over-zone"></div>
                    <div class="zg-energy-cap"></div>
                  </div>
                </div>

                <button class="zg-charge-btn" type="button">
                  按住蓄力
                </button>

                <div class="zg-charge-tip">
                  手機長按按鈕，電腦可按空白鍵
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    root.appendChild(section);
  }

  bindBattleChargeButton();

  return section;
}

function battlePanel() {
  return $(".zg-battle-panel", screenBattle());
}

function battleBox() {
  return $(".zg-battle-box", screenBattle()) || $("#zg-battle-box");
}


/*
 * ---------------------------------------------------------
 * 07-2. Phase Render
 * ---------------------------------------------------------
 */

function renderLaunchPrep() {
  const battle = ensureBattleDom(appRoot());
  battle.dataset.phase = "launch";

  state.running = false;
  state.battle = null;
  state.finishing = false;
  state.charging = false;
  state.launchPower = 0;
  state.chargeDir = 1;

  clearBattleObjects();
  updateHpBars();
  setCommentary("準備拉繩，按住按鈕蓄力！");

  const btn = $(".zg-charge-btn", battle);
  if (btn) {
    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
  }

  setChargePower(0);
}

function renderBattleRunning() {
  const battle = ensureBattleDom(appRoot());
  battle.dataset.phase = "battle";

  const btn = $(".zg-charge-btn", battle);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "戰鬥進行中";
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.65";
  }
}

function renderBattleFinished() {
  const battle = ensureBattleDom(appRoot());
  battle.dataset.phase = "finished";
}


/*
 * ---------------------------------------------------------
 * 07-3. Charge Button
 * ---------------------------------------------------------
 */

function bindBattleChargeButton() {
  const battle = screenBattle();
  if (!battle) return;

  const btn = $(".zg-charge-btn", battle);
  if (!btn || btn.dataset.zgChargeBound === "1") return;

  btn.dataset.zgChargeBound = "1";

  const press = (event) => {
    if (btn.disabled) return;
    if (state.running || state.battle || state.finishing) return;
    if (state.charging) return;
    if (state.screen !== "battle") return;

    event.preventDefault();
    event.stopPropagation();

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
  }, true);
}


/*
 * ---------------------------------------------------------
 * 07-4. Charge Logic
 * ---------------------------------------------------------
 */

function setChargePower(power) {
  const p = clamp(Number(power) || 0, 0, 1);
  state.launchPower = p;

  const battle = screenBattle();
  if (!battle) return;

  const layer = $(".zg-charge-layer", battle);
  const fill = $(".zg-energy-fill", battle);
  const glow = $(".zg-energy-glow", battle);
  const cap = $(".zg-energy-cap", battle);
  const badge = $(".zg-charge-percent-badge", battle);
  const btn = $(".zg-charge-btn", battle);

  const grade = getLaunchGrade(p);
  const percent = `${p * 100}%`;
  const text = `${Math.round(p * 100)}%`;

  if (layer) {
    layer.dataset.chargeGrade = grade;
  }

  if (badge) {
    badge.textContent = text;

    if (grade === "perfect") {
      badge.style.background = "radial-gradient(circle at 32% 28%, #ffffff, #ffe36a 52%, #d58a00 100%)";
      badge.style.color = "#5a3400";
    } else if (grade === "over") {
      badge.style.background = "radial-gradient(circle at 32% 28%, #ff98dd, #a53dff 52%, #32108e 100%)";
      badge.style.color = "#fff";
    } else if (grade === "good") {
      badge.style.background = "radial-gradient(circle at 32% 28%, #fff6a8, #ffbf20 52%, #b46100 100%)";
      badge.style.color = "#4a2500";
    } else {
      badge.style.background = "radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%)";
      badge.style.color = "#fff";
    }
  }

  if (fill) {
    fill.style.width = percent;

    if (grade === "perfect") {
      fill.style.background = "linear-gradient(90deg, #00e5ff, #18ff7a, #fff35a, #ffffff, #ffd84a)";
      fill.style.boxShadow = "0 0 18px rgba(255,255,255,0.95), 0 0 34px rgba(255,220,70,0.9)";
    } else if (grade === "over") {
      fill.style.background = "linear-gradient(90deg, #ff3d7f, #b23dff, #4b27ff)";
      fill.style.boxShadow = "0 0 18px rgba(255,70,180,0.9), 0 0 34px rgba(90,60,255,0.86)";
    } else if (grade === "good") {
      fill.style.background = "linear-gradient(90deg, #00e5ff, #18ff7a, #fff35a, #ffb22e)";
      fill.style.boxShadow = "0 0 16px rgba(255,210,70,0.75)";
    } else {
      fill.style.background = "linear-gradient(90deg, #00e5ff, #18ff7a, #45ff9a)";
      fill.style.boxShadow = "0 0 16px rgba(0,245,255,0.75)";
    }
  }

  if (glow) {
    glow.style.width = percent;
  }

  if (cap) {
    cap.style.left = percent;
  }

  if (btn && state.charging) {
    if (grade === "perfect") {
      btn.textContent = "完美點！放開！";

      const t = now();
      if (t - (state.lastPerfectSoundAt || 0) > 420) {
        state.lastPerfectSoundAt = t;
        Sound.chargePerfect();
      }
    } else if (grade === "over") {
      btn.textContent = "過充！小心！";
    } else if (grade === "good") {
      btn.textContent = "強力蓄力中...";
    } else {
      btn.textContent = "蓄力中...";
    }

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

function startCharging() {
  if (state.running || state.battle || state.finishing) return;
  if (state.charging) return;
  if (state.screen !== "battle") return;

  const battle = ensureBattleDom(appRoot());
  battle.dataset.phase = "launch";

  state.charging = true;
  state.launchPower = 0;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  setChargePower(0);

  const btn = $(".zg-charge-btn", battle);
  if (btn) {
    btn.disabled = false;
    btn.textContent = "蓄力中...";
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

  if (grade === "perfect") {
    setCommentary("完美發射！能量爆發！");
  } else if (grade === "good") {
    setCommentary("強力發射！轉速快速提升！");
  } else if (grade === "over") {
    setCommentary("過充發射！力量很高，但穩定度下降！");
  } else if (grade === "weak") {
    setCommentary("蓄力不足！起步速度偏低！");
  } else {
    setCommentary("穩定發射！準備交鋒！");
  }

  startBattleWithPower(power);
}


/*
 * ---------------------------------------------------------
 * 08-1. Battle Flow
 * ---------------------------------------------------------
 */

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
  if (shouldIgnoreRepeatedAction("battle", 500)) return;

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

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = pickEnemyTop();

  resetBattleFlowState();

  ensureBattleDom(appRoot());
  showScreen("battle");
  renderLaunchPrep();

  track("launch_prepare", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    playsUsed: state.playsUsed,
    remainingPlays: state.remainingPlays
  });
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

  ensureBattleDom(appRoot());
  showScreen("battle");
  renderBattleRunning();

  clearBattleObjects();
  resetBattleFlowState();

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = state.enemyTop || pickEnemyTop();

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
    stabilityMul = 1;
    angularMul = 1;
  } else if (launchGrade === "good") {
    speedMul = 1.1;
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

function stopBattle() {
  state.running = false;
  state.paused = false;

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  Sound.stopHum();

  if (state.battle) {
    state.battle.ended = true;
  }

  state.battle = null;
  state.finishing = false;
  state.pendingResult = null;
}


/*
 * ---------------------------------------------------------
 * 08-2. Battle Visual Helpers
 * ---------------------------------------------------------
 */

function clearBattleObjects() {
  const box = battleBox();
  if (!box) return;

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

function setCommentary(text) {
  const el = $(".zg-commentary", screenBattle());
  if (el) el.textContent = text;
}

function updateHpBars() {
  const b = state.battle;

  const pFill = $("#zg-player-hp");
  const eFill = $("#zg-enemy-hp");
  const pt = $("#zg-player-hp-text");
  const et = $("#zg-enemy-hp-text");

  if (!b) {
    if (pFill) pFill.style.width = "100%";
    if (eFill) eFill.style.width = "100%";
    if (pt) pt.textContent = "100%";
    if (et) et.textContent = "100%";
    return;
  }

  const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
  const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

  if (pFill) pFill.style.width = `${pr * 100}%`;
  if (eFill) eFill.style.width = `${er * 100}%`;

  if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
  if (et) et.textContent = `${Math.ceil(er * 100)}%`;
}

function pulseHpBar(side) {
  const fill = side === "player" ? $("#zg-player-hp") : $("#zg-enemy-hp");
  if (!fill) return;

  fill.classList.remove("zg-hp-hit-pulse");
  void fill.offsetWidth;
  fill.classList.add("zg-hp-hit-pulse");
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

  el.innerHTML = `<span>${escapeHtml(top.emoji)}</span>`;

  box.appendChild(el);

  return el;
}

function syncBody(body) {
  if (!body || !body.el) return;

  const visualSpin = body.dead ? 0 : Math.max(body.spinRatio, 0.035);
  body.angle += body.angularSpeed * visualSpin;

  body.el.style.left = `${body.x}px`;
  body.el.style.top = `${body.y}px`;
  body.el.style.transform = `translate(-50%, -50%) rotate(${body.angle}deg)`;
  body.el.style.opacity = body.dead ? "0.35" : "1";
}

function getArenaInfo() {
  const box = battleBox();
  const rect = box.getBoundingClientRect();

  const w = Math.max(rect.width || 360, 320);
  const h = Math.max(rect.height || 360, 320);

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

/*
 * 重要：
 * 你的原本 08-2 Battle Body、08-3 Physics、08-4 Center Duel、
 * 08-5 Finish、08-6 Battle Loop 的物理函式，
 * 可以繼續放在這裡下面。
 *
 * 需要保留的主要函式：
 * - createBody
 * - playLaunchSequence
 * - battleLoop
 * - applyArenaForces
 * - applyFriction
 * - moveBody
 * - handleWall
 * - resolveCollision
 * - handleTopHit
 * - applyDamage
 * - checkDeadAndFinish
 * - beginFinish
 * - buildResult
 * - drawCouponReward
 * - createCoupon
 */


/*
 * ---------------------------------------------------------
 * 09. Result Page
 * ---------------------------------------------------------
 */

function ensureResultDom(root = appRoot()) {
  injectCleanBattleStyles();

  let section = screenResult();

  if (!section) {
    section = document.createElement("section");
    section.id = "screen-result";
    section.className = "zg-screen";
    section.hidden = true;

    section.innerHTML = `
      <main class="zg-result-main">
        <div class="zg-result-card">
          <div class="zg-rank" id="zg-result-rank">W</div>

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
            <div class="zg-coupon-label">本次獲得</div>
            <div class="zg-coupon-code" id="zg-coupon-code">ZELO100</div>
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
            <div class="zg-rankbox-title">好友排行榜</div>
            <div id="zg-friend-rank-list"></div>
          </div>
        </div>
      </main>

      <div class="zg-result-actions">
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

  return section;
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

  ensureResultDom(appRoot());
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
    score.style.color = delta >= 0 ? "#6dffb0" : "#ff7a7a";
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
}


/*
 * ---------------------------------------------------------
 * 09-1. Result Helpers
 * ---------------------------------------------------------
 */

function getFriendRank() {
  let list = [];

  try {
    list = JSON.parse(localStorage.getItem(STORAGE.friends) || "[]");
  } catch (error) {
    list = [];
  }

  return Array.isArray(list) ? list : [];
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

  const next = list.slice(0, 20);
  saveFriendRank(next);

  return next;
}

function renderFriendRank(result) {
  const listEl = $("#zg-friend-rank-list");
  if (!listEl) return;

  const list = updateLocalRank(result);

  if (!list.length) {
    listEl.innerHTML = `<div class="zg-rank-empty">目前尚無排行榜資料。</div>`;
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
    track("copy_coupon", { code });
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
  if (shouldIgnoreRepeatedAction("retry", 500)) return;

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
  ].filter(Boolean).join("\\n");
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

  fallbackCopyText(`${text}\\n${url}`);
  alert("分享內容已複製，貼給好友一起挑戰！");
}
/*
 * 重要：
 * 你的原本 08-2 Battle Body、08-3 Physics、08-4 Center Duel、
 * 08-5 Finish、08-6 Battle Loop 的物理函式，
 * 可以繼續放在這裡下面。
 *
 * 需要保留的主要函式：
 * - createBody
 * - playLaunchSequence
 * - battleLoop
 * - applyArenaForces
 * - applyFriction
 * - moveBody
 * - handleWall
 * - resolveCollision
 * - handleTopHit
 * - applyDamage
 * - checkDeadAndFinish
 * - beginFinish
 * - buildResult
 * - drawCouponReward
 * - createCoupon
 */


  

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

    try {
      window.dispatchEvent(
        new CustomEvent("zelo:track", {
          detail: payload
        })
      );
    } catch (error) {}

    try {
      if (typeof window.ZELO_DASHBOARD_TRACK === "function") {
        window.ZELO_DASHBOARD_TRACK(payload);
      }
    } catch (error) {}

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

    try {
      const saved = localStorage.getItem(STORAGE.profile);

      if (saved) {
        state.profile = JSON.parse(saved);
      }
    } catch (error) {}

    if (window.ZELO_PROFILE) {
      state.profile = window.ZELO_PROFILE;

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
      } catch (error) {}

      return;
    }

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
          if (shouldIgnoreRepeatedAction("home", 400)) return true;

          track("home_click", {
            source: state.screen,
            eventSource
          });

          showScreen("start");
          return true;

        case "select":
          if (shouldIgnoreRepeatedAction("select", 400)) return true;

          track("select_click", {
            source: state.screen,
            eventSource
          });

          stopBattle();
          showScreen("select");
          return true;

        case "battle":
          if (shouldIgnoreRepeatedAction("battle-button", 500)) return true;

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

    document.addEventListener("click", (event) => {
      handlePrimaryPointerEvent(event, "click");
    }, true);

    document.addEventListener("pointerup", (event) => {
      handlePrimaryPointerEvent(event, "pointerup");
    }, {
      capture: true,
      passive: false
    });

    document.addEventListener("touchend", (event) => {
      handlePrimaryPointerEvent(event, "touchend");
    }, {
      capture: true,
      passive: false
    });

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

    document.addEventListener("keyup", (event) => {
      if (event.code !== "Space") return;
      if (!state.charging) return;

      event.preventDefault();
      event.stopPropagation();

      releaseCharging();
    }, true);

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

      cleanupDuplicateChargeDom,
      forceValidChargeDomVisible,

            debugChargeDom() {
        const battle = screenBattle();
        const validRow = $(".zg-panel .zg-bottom-control-row", battle || document);
        const validLayer = $(".zg-panel .zg-bottom-control-row .zg-charge-layer", battle || document);

        console.log("[ZELO] battle =", battle);
        console.log("[ZELO] valid row =", validRow);
        console.log("[ZELO] valid charge layer =", validLayer);
        console.log("[ZELO] all charge layers =", $$(".zg-charge-layer", battle || document));
        console.log("[ZELO] all charge cards =", $$(".zg-charge-card", battle || document));
        console.log(
          "[ZELO] arena charge elements =",
          $$(
            ".zg-battle-box .zg-charge-layer, " +
            ".zg-battle-box .zg-charge-card, " +
            ".zg-battle-box .zg-charge-meter, " +
            ".zg-battle-box .zg-charge-btn, " +
            ".zg-battle-box .zg-launch-prep, " +
            ".zg-battle-box .zg-launch-panel, " +
            ".zg-battle-box .zg-launch-card, " +
            ".zg-battle-box .zg-prep-card",
            battle || document
          )
        );

       if (validRow) {
  validRow.style.setProperty("display", "grid", "important");
  validRow.style.setProperty("visibility", "visible", "important");
  validRow.style.setProperty("opacity", "1", "important");
  validRow.style.setProperty("pointer-events", "auto", "important");
  validRow.style.setProperty("grid-template-columns", "30%
        }

        if (validLayer) {
          console.log("[ZELO] valid layer display =", getComputedStyle(validLayer).display);
          console.log("[ZELO] valid layer visibility =", getComputedStyle(validLayer).visibility);
          console.log("[ZELO] valid layer opacity =", getComputedStyle(validLayer).opacity);
        }
      },


      debugBattleButton() {
        const btn = document.querySelector('[data-zg-action="battle"]');
        console.log("[ZELO] battle button =", btn);
        console.log("[ZELO] state =", state);

        if (btn) {
          console.log("[ZELO] button rect =", btn.getBoundingClientRect());
          console.log("[ZELO] button pointerEvents =", getComputedStyle(btn).pointerEvents);
          console.log("[ZELO] button display =", getComputedStyle(btn).display);
          console.log("[ZELO] button visibility =", getComputedStyle(btn).visibility);
          console.log("[ZELO] elementFromPoint center =", document.elementFromPoint(
            btn.getBoundingClientRect().left + btn.getBoundingClientRect().width / 2,
            btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2
          ));
        }
      },

      debugScreen() {
        console.log("[ZELO] version =", VERSION);
        console.log("[ZELO] state =", state);
        console.log("[ZELO] body screen =", document.body.getAttribute("data-zg-screen"));
        console.log("[ZELO] start =", screenStart());
        console.log("[ZELO] select =", screenSelect());
        console.log("[ZELO] battle =", screenBattle());
        console.log("[ZELO] result =", screenResult());
      },

      forceBattle() {
        startBattle();
      },

      forceCharge() {
        beginChargeBattle();
      },

      forceStartBattleWithPower(power = 0.82) {
        startBattleWithPower(power);
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
