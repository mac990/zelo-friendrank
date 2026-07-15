/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607150819-battle-energy-impact-fixed
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
 * - 修正重複蓄力 UI：只保留 battle panel launch row
 * - CSS 已抽離至 game.css
 * - JS 不再注入大段 CSS，只輸出 CSS 變數
 * - 戰鬥能量條會跟 HP / 轉速 / 速度聯動
 * - 碰撞震動、火花、衝擊環加強
 * - 戰鬥陀螺尺寸放大
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const DEFAULT_TOP_IMAGE =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=1784068538";

  const VERSION = "202607150946-battle-energy-impact-fixed";

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL = BG_IMAGE_URL;

  const EXTERNAL_TOP_PHOTO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

  const CHARGE = {
    weakMax: 0.45,
    normalMin: 0.45,
    goodMin: 0.72,
    perfectMin: 0.88,
    perfectMax: 0.91,
    overMin: 0.91,
    speed: 0.012
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
  radius: 42,
  ringPadding: 42,

  initialSpeed: 9.6,
  launchSpeed: 9.6,
  maxSpeed: 18.5,

  friction: 0.9965,
  spinDecay: 0.9972,
  spinDrain: 1.35,

  wallRestitution: 0.96,
  wallBounce: 0.96,

  hitRestitution: 0.88,
  restitution: 0.88,

  energyDamageScale: 1.9,
  damageScale: 0.42,

  spinDamageScale: 0.055,
  collisionSpinLoss: 8.5,

  minCollisionEnergy: 0.22,
  maxCollisionDamage: 42,

  collisionCooldown: 46,
  separationBias: 3.2,
  tangentTransfer: 0.085,

  seekForceMax: 0.045,
  centerPull: 0.045,
  engagePull: 0.06,
  orbitForce: 0.062,
  tangentForce: 0.062,

  hpOnlyFinish: true,

  battleLimit: 9000,
  maxBattleMs: 999999999,
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
      image: DEFAULT_TOP_IMAGE,
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
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_b1c5de32-8300-416d-b7c1-5083fea27f6d.png?v=1784073447",
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
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_8f8d7d00-b8ff-4c2d-b193-e2f32f164723.png?v=1784073452",
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
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_34b25e4e-b5f7-4b0e-8cd4-4fb160caff33.png?v=1784073455",
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
    humGain: 1.38,

    attack: 1.35,
    defense: 0.82,
    stamina: 0.86,
    mobility: 1.28
  },
  defense: {
    label: "防禦型",
    launchKick: 0.9,
    sparkMul: 0.9,
    hitSharpness: 0.76,
    stability: 1.48,
    friction: 0.84,
    humBase: 92,
    humGain: 0.88,

    attack: 0.86,
    defense: 1.42,
    stamina: 1.08,
    mobility: 0.82
  },
  stamina: {
    label: "耐久型",
    launchKick: 0.94,
    sparkMul: 0.8,
    hitSharpness: 0.92,
    stability: 1.24,
    friction: 0.68,
    humBase: 118,
    humGain: 0.74,

    attack: 0.9,
    defense: 1.05,
    stamina: 1.45,
    mobility: 0.9
  },
  balance: {
    label: "平衡型",
    launchKick: 1.04,
    sparkMul: 1.05,
    hitSharpness: 1.05,
    stability: 1,
    friction: 1,
    humBase: 122,
    humGain: 1,

    attack: 1,
    defense: 1,
    stamina: 1,
    mobility: 1
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
   * 碰撞震動與火花加強版。
   */
  maxFx: 42,
  maxSparksPerHit: 12,

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

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const rand = (min, max) =>
    min + Math.random() * (max - min);

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

  function escapeAttr(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
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
      localStorage.setItem(
        STORAGE.myScore,
        String(Math.max(0, Math.round(score)))
      );
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

  function canFx(gap = PERF.minFxGap) {
    const t = now();

    if (PERF.lowFx && PERF.activeFx > 30) return false;
    if (PERF.activeFx > PERF.maxFx) return false;
    if (t - PERF.lastFxAt < gap) return false;

    PERF.lastFxAt = t;
    return true;
  }

  function fxAdd() {
    PERF.activeFx += 1;
  }

  function fxRemove() {
    PERF.activeFx = Math.max(0, PERF.activeFx - 1);
  }

  function updatePerf(dtRaw) {
    if (dtRaw > 1.45) {
      PERF.frameSlowCount += 1;
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
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, endFreq),
          t + duration
        );
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

      for (let i = 0; i < len; i += 1) {
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
      g.gain.exponentialRampToValueAtTime(
        0.001,
        c.currentTime + duration
      );

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
        tone(
          110 + p * 220,
          0.035,
          0.035 + p * 0.035,
          "triangle",
          80 + p * 180
        );
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
    let root = $("#zelo-liff-game");

    if (!root) {
      root = document.createElement("div");
      root.id = "zelo-liff-game";
      document.body.appendChild(root);
    }

    return root;
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
    return $(".zg-battle-box", screenBattle() || document) || $("#zg-battle-box");
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

  function removeDuplicateChargeDom() {
    const battle = screenBattle();
    if (!battle) return;

    /*
     * 只允許 .zg-charge-layer 出現在 .zg-launch-row 裡。
     * 其他位置的舊版蓄力 UI 全部移除。
     */
    $$(".zg-charge-layer", battle).forEach((layer) => {
      if (!layer.closest(".zg-launch-row")) {
        try {
          layer.remove();
        } catch (error) {}
      }
    });

    /*
     * 如果 .zg-launch-row 裡有多個 .zg-charge-layer，只保留第一個。
     */
    const launchRow = $(".zg-launch-row", battle);

    if (launchRow) {
      const layers = $$(".zg-charge-layer", launchRow);

      if (layers.length > 1) {
        layers.slice(1).forEach((layer) => {
          try {
            layer.remove();
          } catch (error) {}
        });
      }
    }

    /*
     * 只允許 .zg-charge-card 出現在 .zg-charge-layer 裡。
     */
    $$(".zg-charge-card", battle).forEach((card) => {
      if (!card.closest(".zg-charge-layer")) {
        try {
          card.remove();
        } catch (error) {}
      }
    });
  }
  function hardResetGamePage() {
    /*
     * 清掉舊版遊戲產生的畫面與殘留 DOM。
     * 注意：這裡只在 boot 初期使用。
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

      /*
       * Clean old / duplicate charge UI
       */
      ".zg-charge-layer",
      ".zg-charge-card",
      ".zg-charge-meter",
      ".zg-energy-shell",
      ".zg-energy-track",
      ".zg-energy-fill",
      ".zg-energy-glow",
      ".zg-energy-perfect-zone",
      ".zg-energy-over-zone",
      ".zg-energy-cap",
      ".zg-charge-percent-badge",
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

    /*
     * 清除舊版 JS 注入的 style。
     * 新版 CSS 已抽離至 game.css，不再由 JS 注入。
     */
    const removeStyleIds = [
      "zg-bg-style",
      "zg-main-button-fix-style",
      "zg-battle-emergency-fix-style",
      "zg-result-fix-style",
      "zg-energy-charge-style",
      "zg-clean-style",
      "zg-clean-battle-style",
      "zg-battle-layout-override",
      "zg-battle-fluid-width-override",
      "zg-fullscreen-app-override"
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

    const root = appRoot();

    root.innerHTML = "";
    root.className = "zg-clean-root";

    /*
     * 這裡保留 root inline style。
     * 它不是 CSS 注入，而是防止 Shopify theme 容器限制遊戲尺寸。
     */
    root.style.setProperty("position", "fixed", "important");
    root.style.setProperty("inset", "0", "important");
    root.style.setProperty("left", "0", "important");
    root.style.setProperty("top", "0", "important");
    root.style.setProperty("right", "0", "important");
    root.style.setProperty("bottom", "0", "important");

    root.style.setProperty("width", "100vw", "important");
    root.style.setProperty("min-width", "100vw", "important");
    root.style.setProperty("max-width", "100vw", "important");

    root.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
    root.style.setProperty("min-height", "var(--zg-app-height, 100vh)", "important");
    root.style.setProperty("max-height", "var(--zg-app-height, 100vh)", "important");

    root.style.setProperty("margin", "0", "important");
    root.style.setProperty("padding", "0", "important");
    root.style.setProperty("background", "#090612", "important");
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("z-index", "999999", "important");
    root.style.setProperty("box-sizing", "border-box", "important");

    state.screen = "start";
    state.battle = null;
    state.running = false;
    state.paused = false;
    state.finishing = false;
    state.pendingResult = null;
    state.charging = false;
    state.launchPower = 0;
  }

  function ensureAppHeight() {
    const set = () => {
      document.documentElement.style.setProperty(
        "--zg-app-height",
        `${window.innerHeight}px`
      );
    };

    set();

    window.addEventListener("resize", set);

    window.addEventListener("orientationchange", () => {
      setTimeout(set, 250);
    });
  }

  function applyCssVariables() {
    const root = document.documentElement;

    root.style.setProperty("--zg-home-bg-image", `url("${BG_IMAGE_URL}")`);
    root.style.setProperty("--zg-arena-bg-image", `url("${ARENA_LOGO_URL}")`);
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

  /*
   * ---------------------------------------------------------
   * 04-1. Basic DOM / Screen Switch
   * ---------------------------------------------------------
   */

  function ensureBasicDom() {
    const root = appRoot();

    removeDuplicateScreenDom();

    ensureHomeDom(root);
    ensureSelectDom(root);
    ensureBattleDom(root);
    ensureResultDom(root);

    removeDuplicateScreenDom();
    removeDuplicateChargeDom();
    removeLogoDom();
  }

  function showScreen(name) {
    const normalizedName = name === "home" ? "start" : name;

    const screens = {
      start: screenStart(),
      select: screenSelect(),
      battle: screenBattle(),
      result: screenResult()
    };

    Object.entries(screens).forEach(([key, screen]) => {
      if (!screen) return;

      const active = key === normalizedName;

      screen.classList.toggle("active", active);
      screen.classList.toggle("is-active", active);

      if (active) {
        screen.hidden = false;
        screen.removeAttribute("hidden");
        screen.setAttribute("aria-hidden", "false");

        screen.style.setProperty("display", "flex", "important");
        screen.style.setProperty("visibility", "visible", "important");
        screen.style.setProperty("opacity", "1", "important");
        screen.style.setProperty("pointer-events", "auto", "important");
        screen.style.setProperty("flex-direction", "column", "important");

        $$(
          "[data-zg-action], .zg-btn, .zg-small-btn, .zg-top-card, .zg-charge-btn",
          screen
        ).forEach((el) => {
          el.style.setProperty("pointer-events", "auto", "important");
          el.style.setProperty("position", "relative", "important");
          el.style.setProperty("z-index", "20", "important");
        });
      } else {
        if (screen.contains(document.activeElement)) {
          try {
            document.activeElement.blur();
          } catch (error) {}
        }

        screen.classList.remove("active", "is-active");
        screen.setAttribute("aria-hidden", "true");
        screen.hidden = true;

        screen.style.setProperty("display", "none", "important");
        screen.style.setProperty("visibility", "hidden", "important");
        screen.style.setProperty("opacity", "0", "important");
        screen.style.setProperty("pointer-events", "none", "important");
      }
    });

    state.screen = normalizedName;
    document.body.setAttribute("data-zg-screen", normalizedName);

    removeMenuDom();
    removeLogoDom();

    if (normalizedName === "start") onHomeShown();
    if (normalizedName === "select") onSelectShown();
    if (normalizedName === "battle") onBattleShown();
    if (normalizedName === "result") onResultShown();

    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }
  }

  /*
   * ---------------------------------------------------------
   * 04-2. Page Lifecycle Hooks
   * ---------------------------------------------------------
   */

  function onHomeShown() {
    stopBattle();
    cancelChargeLoop();

    removeMenuDom();
    removeLogoDom();
  }

  function onSelectShown() {
    stopBattle();
    cancelChargeLoop();

    renderTopSelection();

    removeMenuDom();
    removeLogoDom();
  }

  function onBattleShown() {
    ensureBattleDom(appRoot());
    normalizeBattleLayoutDom();
    bindBattleChargeButton();

    removeMenuDom();
    removeLogoDom();
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

      <div class="zg-bottom">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="start"
          type="button"
        >
          開始遊戲
        </button>
      </div>
    `;

    root.appendChild(section);
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

    state.selectedTop = state.selectedTop || loadSelectedTop();

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
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="battle"
          type="button"
        >
          發射！開始對戰
        </button>
      </div>
    `;

    root.appendChild(section);
  }
  function renderTopSelection() {
    const list =
      $(".zg-top-list", screenSelect() || document) ||
      $("#zg-top-list");

    if (!list) return;

    list.innerHTML = TOPS.map((top) => {
      const feel = getFeel(top);

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
            <img
              class="zg-top-photo"
              src="${escapeAttr(top.image || DEFAULT_TOP_IMAGE)}"
              alt="${escapeAttr(top.name)}"
              loading="lazy"
              draggable="false"
            >
          </div>

          <div class="zg-top-content">
            <div class="zg-top-name">${escapeHtml(top.name)}</div>
            <div class="zg-top-type">${escapeHtml(feel.label)}</div>

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

    const selected = state.selectedTop || loadSelectedTop();

    selectTop(selected.id, false);

    $$(
      ".zg-btn, .zg-small-btn, .zg-top-card, [data-zg-action]",
      screenSelect() || document
    ).forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("z-index", "20", "important");
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
   */

  function forceRebuildBattleDom(root = appRoot()) {
    /*
     * 強制重建 battle 畫面，避免舊版或錯位的 charge card 殘留。
     */
    const oldBattle = screenBattle();

    if (oldBattle) {
      try {
        oldBattle.remove();
      } catch (error) {}
    }

    const section = document.createElement("section");
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
                onerror="this.style.display='none'"
              >
            </div>

            <div class="zg-charge-layer" data-charge-grade="weak">
              <div class="zg-charge-card">
                <div class="zg-charge-title">拉繩發射！</div>

                <div class="zg-charge-subtitle">
                  按住蓄力，接近完美區放開！
                </div>

                <div class="zg-charge-meter">
                  <div class="zg-charge-percent-badge">0%</div>

                  <div
                    class="zg-energy-shell"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow="0"
                    style="--zg-charge-pct: 0%;"
                  >
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

    bindBattleChargeButton();

    return section;
  }

  function ensureBattleDom(root = appRoot()) {
    let section = screenBattle();

    if (!section) {
      section = forceRebuildBattleDom(root);
    }

    /*
     * 如果 charge layer 不在正確位置，直接重建。
     */
    const chargeLayer = $(".zg-charge-layer", section);
    const launchRow = $(".zg-launch-row", section);

    if (
      !chargeLayer ||
      !launchRow ||
      !chargeLayer.closest(".zg-launch-row") ||
      !launchRow.contains(chargeLayer)
    ) {
      section = forceRebuildBattleDom(root);
    }

    bindBattleChargeButton();

    return section;
  }

  function normalizeBattleLayoutDom() {
    const battle = screenBattle();
    if (!battle) return;

    const panel = $(".zg-battle-panel", battle);
    let launchRow = $(".zg-launch-row", battle);

    if (!panel) {
      forceRebuildBattleDom(appRoot());
      return;
    }

    if (!launchRow) {
      launchRow = document.createElement("div");
      launchRow.className = "zg-launch-row";
      panel.appendChild(launchRow);
    }

    let photo =
      $(".zg-launch-row > .zg-external-top-photo", battle) ||
      $(".zg-external-top-photo", battle);

    let charge =
      $(".zg-launch-row > .zg-charge-layer", battle) ||
      $(".zg-charge-layer", battle);

    if (!photo || !charge) {
      forceRebuildBattleDom(appRoot());
      return;
    }

    /*
     * 移除 launch row 外面的多餘 charge layer。
     */
    $$(".zg-charge-layer", battle).forEach((layer) => {
      if (layer !== charge && !layer.closest(".zg-launch-row")) {
        try {
          layer.remove();
        } catch (error) {}
      }
    });

    /*
     * 移除 launch row 裡面多餘的 charge layer。
     */
    $$(".zg-launch-row > .zg-charge-layer", battle).forEach((layer) => {
      if (layer !== charge) {
        try {
          layer.remove();
        } catch (error) {}
      }
    });

    /*
     * 移除孤立的 charge card。
     */
    $$(".zg-charge-card", battle).forEach((card) => {
      if (!card.closest(".zg-charge-layer")) {
        try {
          card.remove();
        } catch (error) {}
      }
    });

    /*
     * 強制把圖片與 charge layer 搬回 launch row。
     */
    if (!launchRow.contains(photo)) {
      launchRow.appendChild(photo);
    }

    if (!launchRow.contains(charge)) {
      launchRow.appendChild(charge);
    }

    /*
     * launch row 必須在 commentary 後面。
     */
    const commentary = $(".zg-commentary", battle);

    if (commentary && commentary.nextElementSibling !== launchRow) {
      commentary.insertAdjacentElement("afterend", launchRow);
    }
  }

  /*
   * ---------------------------------------------------------
   * 07-1. Phase Render
   * ---------------------------------------------------------
   */

  function renderLaunchPrep() {
    const battle = ensureBattleDom(appRoot());

    normalizeBattleLayoutDom();

    battle.dataset.phase = "launch";

    state.running = false;
    state.battle = null;
    state.finishing = false;
    state.pendingResult = null;
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
      btn.style.setProperty("pointer-events", "auto", "important");
      btn.style.setProperty("opacity", "1", "important");
    }

    setChargePower(0);
  }

  function renderBattleRunning() {
    const battle = ensureBattleDom(appRoot());

    normalizeBattleLayoutDom();

    battle.dataset.phase = "battle";

    const layer = $(".zg-launch-row > .zg-charge-layer", battle);
    const card = $(".zg-launch-row > .zg-charge-layer > .zg-charge-card", battle);
    const title = $(".zg-launch-row .zg-charge-title", battle);
    const subtitle = $(".zg-launch-row .zg-charge-subtitle", battle);
    const tip = $(".zg-launch-row .zg-charge-tip", battle);
    const btn = $(".zg-launch-row .zg-charge-btn", battle);

    if (layer) {
      layer.style.setProperty("display", "block", "important");
      layer.style.setProperty("visibility", "visible", "important");
      layer.style.setProperty("opacity", "1", "important");
      layer.style.setProperty("background", "transparent", "important");
    }

    if (card) {
      card.style.setProperty("display", "flex", "important");
      card.style.setProperty("visibility", "visible", "important");
      card.style.setProperty("opacity", "0.92", "important");
      card.style.setProperty("margin", "0", "important");
      card.style.setProperty("transform", "none", "important");
    }

   if (title) {
  title.textContent = "發射完成";
}

if (subtitle) {
  const launchPct = Math.round(
    clamp(Number(state.battle?.launchPower ?? state.launchPower ?? 0), 0, 1) *
    100
  );

  subtitle.textContent = `本次發射能量 ${launchPct}%`;
}

if (tip) {
  tip.textContent = "對撞能量請看上方你 / 敵能量條。";
}

    if (btn) {
      btn.disabled = true;
      btn.textContent = "戰鬥進行中";
      btn.style.setProperty("pointer-events", "none", "important");
      btn.style.setProperty("opacity", "0.65", "important");
    }
  }
  /*
   * ---------------------------------------------------------
   * 07-2. Charge Button Binding
   * ---------------------------------------------------------
   */

  function bindBattleChargeButton() {
    const battle = screenBattle();
    if (!battle) return;

    const btn = $(".zg-charge-btn", battle);
    if (!btn) return;

    /*
     * 重新綁定，避免舊 DOM / 重建 DOM 後事件狀態混亂。
     */
    if (btn.dataset.zgChargeBound === "1") {
      return;
    }

    btn.dataset.zgChargeBound = "1";

    btn.style.setProperty("touch-action", "none", "important");
    btn.style.setProperty("-webkit-user-select", "none", "important");
    btn.style.setProperty("user-select", "none", "important");
    btn.style.setProperty("-webkit-touch-callout", "none", "important");

    let activePointerId = null;
    let chargeStartedAt = 0;

    const press = (event) => {
      if (btn.disabled) return;
      if (state.running || state.battle || state.finishing) return;
      if (state.charging) return;
      if (state.screen !== "battle") return;

      event.preventDefault();
      event.stopPropagation();

      activePointerId = event.pointerId;
      chargeStartedAt = now();

      Sound.resume();
      startCharging();

      btn.classList.add("zg-charge-pressing");

      try {
        if (event.pointerId !== undefined) {
          btn.setPointerCapture(event.pointerId);
        }
      } catch (error) {}
    };

    const release = (event) => {
      if (!state.charging) return;

      /*
       * 只接受同一個 pointer 的放開事件。
       */
      if (
        activePointerId !== null &&
        event.pointerId !== undefined &&
        event.pointerId !== activePointerId
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const heldMs = now() - chargeStartedAt;

      btn.classList.remove("zg-charge-pressing");

      try {
        if (event.pointerId !== undefined) {
          btn.releasePointerCapture(event.pointerId);
        }
      } catch (error) {}

      activePointerId = null;

      /*
       * 防止點一下就 0% 發射。
       * 如果按太短，取消這次蓄力，回到 0%，不開始戰鬥。
       */
      if (heldMs < 180 && state.launchPower < 0.08) {
        cancelChargeLoop();
        setChargePower(0);

        btn.disabled = false;
        btn.textContent = "按住蓄力";
        btn.style.setProperty("pointer-events", "auto", "important");
        btn.style.setProperty("opacity", "1", "important");

        setCommentary("請長按按鈕蓄力，放開後發射！");
        return;
      }

      releaseCharging();
    };

    const cancel = (event) => {
      if (!state.charging) return;

      event.preventDefault();
      event.stopPropagation();

      btn.classList.remove("zg-charge-pressing");

      activePointerId = null;

      cancelChargeLoop();
      setChargePower(0);

      btn.disabled = false;
      btn.textContent = "按住蓄力";
      btn.style.setProperty("pointer-events", "auto", "important");
      btn.style.setProperty("opacity", "1", "important");

      setCommentary("蓄力取消，請重新長按按鈕！");
    };

    /*
     * 只使用 Pointer Events。
     * 不再同時綁 touchstart / mousedown，避免手機重複觸發。
     */
    btn.addEventListener("pointerdown", press, {
      capture: true,
      passive: false
    });

    btn.addEventListener("pointerup", release, {
      capture: true,
      passive: false
    });

    btn.addEventListener("pointercancel", cancel, {
      capture: true,
      passive: false
    });

    btn.addEventListener("lostpointercapture", () => {
      if (!state.charging) return;
    });

    btn.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );

    btn.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  }

  /*
   * ---------------------------------------------------------
   * 07-3. Charge Logic
   * ---------------------------------------------------------
   */

  function updateBattleEnergyPanel() {
  const battle = screenBattle();

  if (!battle) return;

  /*
   * 這個區塊是「拉霸 / 蓄力能量 UI」。
   * 它只負責發射前的蓄力顯示。
   * 戰鬥開始後，不再用它顯示 HP / 轉速 / 對撞能量。
   *
   * 真正戰鬥中的雙方對撞能量，
   * 請使用上方「你 / 敵」兩條 bar。
   */
  if (battle.dataset.phase === "battle") {
    const layer = $(".zg-charge-layer", battle);
    const shell = $(".zg-energy-shell", battle);
    const badge = $(".zg-charge-percent-badge", battle);
    const title = $(".zg-charge-title", battle);
    const subtitle = $(".zg-charge-subtitle", battle);
    const tip = $(".zg-charge-tip", battle);
    const btn = $(".zg-charge-btn", battle);

    const launchPct = Math.round(
      clamp(Number(state.battle?.launchPower ?? state.launchPower ?? 0), 0, 1) *
      100
    );

    const percent = `${launchPct}%`;
    const grade = getLaunchGrade(launchPct / 100);

    if (layer) {
      layer.dataset.chargeGrade = grade;
      layer.dataset.battleEnergy = "";
    }

    if (shell) {
      shell.style.setProperty("--zg-charge-pct", percent, "important");
      shell.setAttribute("aria-valuenow", String(launchPct));
    }

    if (badge) {
      badge.textContent = `${launchPct}%`;
    }

    if (title) {
      title.textContent = "發射完成";
    }

    if (subtitle) {
      subtitle.textContent = `本次發射能量 ${launchPct}%`;
    }

    if (tip) {
      tip.textContent = "戰鬥中的對撞能量請看上方你 / 敵能量條。";
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "戰鬥進行中";
      btn.style.setProperty("pointer-events", "none", "important");
      btn.style.setProperty("opacity", "0.65", "important");
    }

    return;
  }

  /*
   * 非 battle phase 時不處理。
   * 發射前蓄力顯示由 setChargePower() 負責。
   */
}


  function setChargePower(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    state.launchPower = p;

    const battle = screenBattle();
    if (!battle) return;

    const layer = $(".zg-charge-layer", battle);
    const shell = $(".zg-energy-shell", battle);
    const cap = $(".zg-energy-cap", battle);
    const badge = $(".zg-charge-percent-badge", battle);
    const btn = $(".zg-charge-btn", battle);

    const grade = getLaunchGrade(p);
    const pctNumber = Math.round(p * 100);
    const percent = `${pctNumber}%`;

    if (layer) {
      layer.dataset.chargeGrade = grade;
    }

    /*
     * JS 只輸出資料。
     * 能量條視覺由 game.css 讀取 --zg-charge-pct 渲染。
     */
    if (shell) {
      shell.style.setProperty("--zg-charge-pct", percent, "important");
      shell.setAttribute("aria-valuemin", "0");
      shell.setAttribute("aria-valuemax", "100");
      shell.setAttribute("aria-valuenow", String(pctNumber));
    }

    if (badge) {
      badge.textContent = `${pctNumber}%`;
    }

    if (cap) {
      cap.style.setProperty("left", percent);
      cap.style.setProperty("opacity", p > 0.02 ? "1" : "0.55");
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
    state.launchPower = 0.01;
    state.chargeDir = 1;
    state.lastPerfectSoundAt = 0;

    setChargePower(0.01);

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
   * 07-4. Battle Flow Entry
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

    forceRebuildBattleDom(appRoot());
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
    normalizeBattleLayoutDom();
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
enemy.spinRatio = clamp(
  enemy.spinRatio * (0.9 + enemyPower * 0.14),
  0,
  1
);

/*
 * 初始對撞能量。
 * 玩家依照蓄力結果決定。
 * 敵方依照 AI 發射品質決定。
 */
player.energy = clamp(62 + powerNorm * 42, 35, 100);
player.maxEnergy = 100;
player.energyRatio = player.energy / player.maxEnergy;

enemy.energy = clamp(68 + enemyPower * 28, 45, 100);
enemy.maxEnergy = 100;
enemy.energyRatio = enemy.energy / enemy.maxEnergy;

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
    updateBattleEnergyPanel();
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
   * =========================================================
   * 08. BATTLE PAGE / 陀螺戰鬥頁面
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 08-1. Battle Visual Helpers
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
      "zg-collision-heavy",
      "zg-impact-punch",
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
    const el = $(".zg-commentary", screenBattle() || document);
    if (el) el.textContent = text;
  }

  function updateHpBars() {
  const b = state.battle;

  const pFill = $("#zg-player-hp");
  const eFill = $("#zg-enemy-hp");
  const pText = $("#zg-player-hp-text");
  const eText = $("#zg-enemy-hp-text");

  /*
   * 沒有戰鬥資料時，預設顯示滿能量。
   */
  if (!b || !b.player || !b.enemy) {
    if (pFill) {
      pFill.style.setProperty("width", "100%", "important");
      pFill.style.setProperty("transform", "none", "important");
      pFill.setAttribute("data-energy", "100");
    }

    if (eFill) {
      eFill.style.setProperty("width", "100%", "important");
      eFill.style.setProperty("transform", "none", "important");
      eFill.setAttribute("data-energy", "100");
    }

    if (pText) {
      pText.textContent = "100%";
      pText.setAttribute("data-energy", "100");
    }

    if (eText) {
      eText.textContent = "100%";
      eText.setAttribute("data-energy", "100");
    }

    return;
  }

  /*
   * 你 / 敵能量條只讀 energyRatio。
   * 這兩條就是勝負用能量條。
   */
  const pRatio = clamp(
    Number.isFinite(b.player.energyRatio) ? b.player.energyRatio : 1,
    0,
    1
  );

  const eRatio = clamp(
    Number.isFinite(b.enemy.energyRatio) ? b.enemy.energyRatio : 1,
    0,
    1
  );

  const pPct = Math.round(pRatio * 100);
  const ePct = Math.round(eRatio * 100);

  if (pFill) {
    pFill.style.setProperty("width", `${pPct}%`, "important");
    pFill.style.setProperty("transform", "none", "important");
    pFill.style.setProperty("transform-origin", "left center", "important");
    pFill.setAttribute("data-energy", String(pPct));
    pFill.setAttribute("aria-valuenow", String(pPct));
  }

  if (eFill) {
    eFill.style.setProperty("width", `${ePct}%`, "important");
    eFill.style.setProperty("transform", "none", "important");
    eFill.style.setProperty("transform-origin", "left center", "important");
    eFill.setAttribute("data-energy", String(ePct));
    eFill.setAttribute("aria-valuenow", String(ePct));
  }

  if (pText) {
    pText.textContent = `${pPct}%`;
    pText.setAttribute("data-energy", String(pPct));
  }

  if (eText) {
    eText.textContent = `${ePct}%`;
    eText.setAttribute("data-energy", String(ePct));
  }
}


function consumeBodyEnergy(body, amount) {
  if (!body) return;

  const maxEnergy = body.maxEnergy || 100;

  const currentEnergy = Number.isFinite(body.energy)
    ? body.energy
    : maxEnergy;

  const cost = Math.max(0, Number(amount) || 0);

  body.energy = clamp(currentEnergy - cost, 0, maxEnergy);
  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);

*
   * 新規則：
   * 能量歸零即敗北。
   */
  if (body.energy <= 0 || body.energyRatio <= 0) {
    body.energy = 0;
    body.energyRatio = 0;
    body.dead = true;
  }
}

function resolveCollision(a, b) {
  if (!body || body.dead) return;

  const maxEnergy = body.maxEnergy || 100;
  const gain = Math.max(0, Number(amount) || 0);

  body.energy = clamp(
    (body.energy ?? maxEnergy) + gain,
    0,
    maxEnergy
  );

  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);
}


  function pulseHpBar(side) {
    const fill = side === "player" ? $("#zg-player-hp") : $("#zg-enemy-hp");
    if (!fill) return;

    fill.classList.remove("zg-hp-hit-pulse");
    void fill.offsetWidth;
    fill.classList.add("zg-hp-hit-pulse");
  }

  function pulseBattleEnergyBar() {
    const battle = screenBattle();
    if (!battle) return;

    const shell = $(".zg-energy-shell", battle);
    if (!shell) return;

    shell.classList.remove("zg-energy-hit");
    void shell.offsetWidth;
    shell.classList.add("zg-energy-hit");

    setTimeout(() => {
      shell.classList.remove("zg-energy-hit");
    }, 280);
  }

  function createTopElement(top, side) {
    const box = battleBox();
    if (!box) return null;

    const el = document.createElement("div");

    el.className =
      `zg-battle-top ${side === "player" ? "zg-player-top" : "zg-enemy-top"} ${top.type}`;

    el.setAttribute("data-side", side);
    el.setAttribute("data-id", top.id);
    el.setAttribute("data-type", top.type);

    el.style.setProperty("--c1", top.colorA);
    el.style.setProperty("--c2", top.colorB);

    /*
     * 外層位置與 transform 由 JS 控制，不讓 CSS animation 介入。
     */
    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("width", `${PHY.radius * 2}px`, "important");
    el.style.setProperty("height", `${PHY.radius * 2}px`, "important");
    el.style.setProperty("min-width", `${PHY.radius * 2}px`, "important");
    el.style.setProperty("min-height", `${PHY.radius * 2}px`, "important");

    el.style.setProperty("display", "flex", "important");
    el.style.setProperty("align-items", "center", "important");
    el.style.setProperty("justify-content", "center", "important");

    el.style.setProperty("left", "50%", "important");
    el.style.setProperty("top", "50%", "important");
    el.style.setProperty("z-index", side === "player" ? "47" : "46", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("visibility", "visible", "important");
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("animation", "none", "important");

    el.innerHTML = `
      <img
        class="zg-battle-top-photo"
        src="${escapeAttr(top.image || DEFAULT_TOP_IMAGE)}"
        alt="${escapeAttr(top.name)}"
        draggable="false"
      >
    `;

    box.appendChild(el);

    return el;
  }

  function syncBody(body) {
    if (!body || !body.el) return;

    const visualSpin = body.dead ? 0 : Math.max(body.spinRatio, 0.035);

    body.angle += body.angularSpeed * visualSpin;

    body.el.style.setProperty("left", `${body.x}px`, "important");
    body.el.style.setProperty("top", `${body.y}px`, "important");
    body.el.style.setProperty(
      "transform",
      `translate(-50%, -50%) rotate(${body.angle}deg)`,
      "important"
    );
    body.el.style.setProperty("opacity", body.dead ? "0.35" : "1", "important");
    body.el.style.setProperty("display", "flex", "important");
    body.el.style.setProperty("visibility", "visible", "important");
  }

  function getArenaInfo() {
    const box = battleBox();

    if (!box) {
      return {
        w: 420,
        h: 420,
        cx: 210,
        cy: 210,
        left: PHY.radius + 10,
        right: 420 - PHY.radius - 10,
        top: PHY.radius + 10,
        bottom: 420 - PHY.radius - 10,
        xtremeX: 210,
        xtremeY: 210,
        xtremeR: 58
      };
    }

    const rect = box.getBoundingClientRect();

    /*
     * 關鍵：
     * 不直接信任高度，避免 Shopify / CSS 把場地壓扁後物理也壓扁。
     */
    const rawW = Math.max(rect.width || box.clientWidth || 420, 320);
    const rawH = Math.max(rect.height || box.clientHeight || 420, 320);

    const size = clamp(
      Math.min(rawW, rawH > 0 ? rawH : rawW),
      320,
      620
    );

    const w = size;
    const h = size;

    const safePad = PHY.radius + 12;
    const padX = Math.max(safePad, PHY.radius * 1.2);
    const padY = Math.max(safePad, PHY.radius * 1.2);

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
  
  function createBody(top, side, arena) {
  const isPlayer = side === "player";
  const feel = getFeel(top);

  const launchAngle = isPlayer
    ? rand(-0.35, 0.35)
    : Math.PI + rand(-0.35, 0.35);

  const orbitAngle = isPlayer ? Math.PI * 0.12 : Math.PI * 1.12;

  const speedBase =
    PHY.launchSpeed *
    (0.86 + top.speed / 220) *
    rand(0.92, 1.08);

  const vx = Math.cos(launchAngle) * speedBase;
  const vy = Math.sin(launchAngle) * speedBase;

  const x = arena.cx + Math.cos(orbitAngle) * arena.w * 0.28;
  const y = arena.cy + Math.sin(orbitAngle) * arena.h * 0.22;

  const maxHp =
    88 +
    top.defense * 0.48 +
    top.stamina * 0.38 +
    feel.defense * 6;

  const spin =
    920 +
    top.stamina * 8.2 +
    top.speed * 3.4 +
    rand(-30, 50);

  const body = {
    top,
    side,
    el: null,

    x,
    y,
    vx,
    vy,

    r: PHY.radius,
    mass:
      1 +
      top.defense / 165 +
      feel.defense * 0.08,

    /*
     * 真正勝負用 HP。
     * 只有 hp <= 0 才會判敗。
     */
    hp: maxHp,
    maxHp,

    /*
     * 對撞計算用戰鬥能量。
     * 每顆陀螺獨立消耗、獨立計算。
     * UI 上「你 / 敵」兩條 bar 顯示的是這個 energy。
     */
    energy: 100,
    maxEnergy: 100,
    energyRatio: 1,

    spin,
    maxSpin: spin,
    spinRatio: 1,

    angle: rand(0, 360),
    angularSpeed:
      (side === "player" ? 1 : -1) *
      (18 + top.speed / 7 + rand(-2, 2)),

    attack:
      top.power * 0.82 +
      top.speed * 0.22 +
      feel.attack * 5,

    defense:
      top.defense * 0.78 +
      top.stamina * 0.18 +
      feel.defense * 7,

    stamina:
      top.stamina * 0.82 +
      top.defense * 0.12 +
      feel.stamina * 6,

    mobility:
      top.speed * 0.88 +
      feel.mobility * 8,

    wobble: 0,
    dead: false,
    lastWallHitAt: 0,
    lastHitAt: 0,
    combo: 0,
    trailPhase: rand(0, Math.PI * 2),
    centerPullBoost: 0
  };

  return body;
}


  function getBattleCenterDrive(body, other, arena, dt) {
    if (!body || body.dead) {
      return {
        ax: 0,
        ay: 0
      };
    }

    const dx = arena.cx - body.x;
    const dy = arena.cy - body.y;
    const d = Math.max(1, Math.hypot(dx, dy));

    const otherDx = other ? other.x - body.x : 0;
    const otherDy = other ? other.y - body.y : 0;
    const otherD = Math.max(1, Math.hypot(otherDx, otherDy));

    const spinRatio = clamp(body.spinRatio || 0, 0, 1);
    const mobility = clamp(body.mobility / 120, 0.45, 1.35);

    /*
     * 兩股力量：
     * 1. 中心吸引，避免一直貼牆空轉
     * 2. 對手吸引，讓雙方更容易交鋒
     */
    const centerPull =
      PHY.centerPull *
      (0.55 + spinRatio * 0.8) *
      mobility;

    const engagePull =
      PHY.engagePull *
      (0.42 + spinRatio * 0.85) *
      mobility *
      clamp(otherD / arena.w, 0.18, 0.9);

    const ax =
      (dx / d) * centerPull +
      (otherDx / otherD) * engagePull;

    const ay =
      (dy / d) * centerPull +
      (otherDy / otherD) * engagePull;

    /*
     * 加一點切線力，做出繞圈感。
     */
    const tangentDir = body.side === "player" ? 1 : -1;
    const tangent =
      PHY.orbitForce *
      (0.5 + spinRatio * 0.6) *
      mobility;

    const tx = (-dy / d) * tangent * tangentDir;
    const ty = (dx / d) * tangent * tangentDir;

    return {
      ax: (ax + tx) * dt,
      ay: (ay + ty) * dt
    };
  }

  function resolveWall(body, arena) {
  if (!body || body.dead) return;

  let hit = false;
  let nx = 0;
  let ny = 0;

  if (body.x < arena.left) {
    body.x = arena.left;
    body.vx = Math.abs(body.vx) * PHY.wallBounce;
    hit = true;
    nx = 1;
  } else if (body.x > arena.right) {
    body.x = arena.right;
    body.vx = -Math.abs(body.vx) * PHY.wallBounce;
    hit = true;
    nx = -1;
  }

  if (body.y < arena.top) {
    body.y = arena.top;
    body.vy = Math.abs(body.vy) * PHY.wallBounce;
    hit = true;
    ny = 1;
  } else if (body.y > arena.bottom) {
    body.y = arena.bottom;
    body.vy = -Math.abs(body.vy) * PHY.wallBounce;
    hit = true;
    ny = -1;
  }

  if (!hit) return;

  const t = now();
  const speed = Math.hypot(body.vx, body.vy);

  /*
   * 撞牆不扣 HP，只消耗該陀螺自己的 energy。
   */
  const wallEnergyCost = clamp(speed / 10, 0.18, 1.8) * 0.85;
/*
 * 撞牆只做反彈與特效，不扣勝負能量。
 */
// consumeBodyEnergy(body, wallEnergyCost);
// updateHpBars();

  if (speed > 2.2 && t - body.lastWallHitAt > 260) {
    body.lastWallHitAt = t;

    const impulse = clamp(speed / 10, 0.35, 1.6);

    createWallFlash(
      clamp(body.x, arena.left, arena.right),
      clamp(body.y, arena.top, arena.bottom),
      nx,
      ny,
      impulse
    );

    createSparks(body.x, body.y, impulse, 0.65);
    Sound.rail(impulse);

    if (speed > 5.6) {
      shakeArena("shake");
    }

    setCommentary("撞上場邊！反彈回戰線！");
  }
}


function updateBody(body, other, arena, dt) {
  if (!body || body.dead) return;

  const drive = getBattleCenterDrive(body, other, arena, dt);

  body.vx += drive.ax;
  body.vy += drive.ay;

  const speedBeforeClamp = Math.hypot(body.vx, body.vy);

  if (speedBeforeClamp > PHY.maxSpeed) {
    const ratio = PHY.maxSpeed / speedBeforeClamp;
    body.vx *= ratio;
    body.vy *= ratio;
  }

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  const speed = Math.hypot(body.vx, body.vy);
  const distanceFromCenter = Math.hypot(body.x - arena.cx, body.y - arena.cy);
  const edgeRatio = clamp(distanceFromCenter / (arena.w * 0.48), 0, 1);

  /*
   * 外圈摩擦比較高，中心比較順。
   */
  const localFriction =
    PHY.friction -
    0.002 * (1 - edgeRatio) +
    0.003 * edgeRatio;

  body.vx *= Math.pow(localFriction, dt);
  body.vy *= Math.pow(localFriction, dt);

  const spinDrain =
    PHY.spinDrain *
    dt *
    (0.82 + body.wobble * 0.12 + edgeRatio * 0.18);

  body.spin = Math.max(0, body.spin - spinDrain);
  body.spinRatio = clamp(body.spin / body.maxSpin, 0, 1);

  body.angularSpeed *= Math.pow(0.9992, dt);

  if (body.spinRatio < 0.28) {
    body.wobble += (0.28 - body.spinRatio) * 0.018 * dt;
  } else {
    body.wobble *= Math.pow(0.996, dt);
  }

  /*
   * 自然能量消耗。
   * 注意：
   * energy 歸零不會死亡，只會影響碰撞攻防。
   */
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);
  const lowSpinPressure = body.spinRatio < 0.28 ? 0.018 : 0;

const naturalEnergyCost =
  dt *
  (
    0.004 +
    speedRatio * 0.012 +
    edgeRatio * 0.006 +
    body.wobble * 0.004 +
    lowSpinPressure * 0.35
  );

/*
 * 能量主要由碰撞扣除。
 * 自然移動不扣能量，避免未碰撞就分勝負。
 */
// consumeBodyEnergy(body, naturalEnergyCost);

/*
 * 新規則：
 * 能量歸零即敗北。
 */
if (body.energy <= 0 || body.energyRatio <= 0) {
  body.energy = 0;
  body.energyRatio = 0;
  body.dead = true;
}


  function resolveCollision(a, b) {
  if (!a || !b || a.dead || b.dead) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;

  if (dist <= 0 || dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;

  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const relVel = rvx * nx + rvy * ny;

  if (relVel > 0) return;

  const impactSpeed = Math.abs(relVel);
  const tangentSpeed = Math.abs(rvx * -ny + rvy * nx);
  const spinImpact = Math.abs(a.angularSpeed - b.angularSpeed) * 0.015;

  const impulse =
    (-(1 + PHY.restitution) * relVel) /
    (1 / a.mass + 1 / b.mass);

  const impulseX = impulse * nx;
  const impulseY = impulse * ny;

  a.vx -= impulseX / a.mass;
  a.vy -= impulseY / a.mass;
  b.vx += impulseX / b.mass;
  b.vy += impulseY / b.mass;

  a.angularSpeed += (-ny * impulseX + nx * impulseY) * 0.035;
  b.angularSpeed -= (-ny * impulseX + nx * impulseY) * 0.035;

  const hitPower = clamp(
    impactSpeed * 0.72 +
    tangentSpeed * 0.18 +
    spinImpact,
    0,
    16
  );

  if (hitPower < 0.45) {
    return;
  }

  const t = now();
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  /*
   * 雙方各自目前 energy。
   * energy 越低，攻防越差。
   */
  const aEnergyRatio = clamp(a.energyRatio ?? 1, 0, 1);
  const bEnergyRatio = clamp(b.energyRatio ?? 1, 0, 1);

  const aEnergyAtkMul = 0.72 + aEnergyRatio * 0.38;
  const bEnergyAtkMul = 0.72 + bEnergyRatio * 0.38;

  const aEnergyDefMul = 0.65 + aEnergyRatio * 0.45;
  const bEnergyDefMul = 0.65 + bEnergyRatio * 0.45;

  const aAtk =
    a.attack *
    (0.84 + a.spinRatio * 0.34) *
    aEnergyAtkMul;

  const bAtk =
    b.attack *
    (0.84 + b.spinRatio * 0.34) *
    bEnergyAtkMul;

  const aDef =
    a.defense *
    (0.88 + a.spinRatio * 0.22) *
    aEnergyDefMul;

  const bDef =
    b.defense *
    (0.88 + b.spinRatio * 0.22) *
    bEnergyDefMul;

  /*
   * HP 只在陀螺碰撞時扣除。
   * aDamage：a 對 b 造成的 HP 傷害。
   * bDamage：b 對 a 造成的 HP 傷害。
   */
  const aDamage =
    Math.max(0.4, (aAtk - bDef * 0.58) * 0.035) *
    hitPower *
    PHY.damageScale *
    state.damagePressure;

  const bDamage =
    Math.max(0.4, (bAtk - aDef * 0.58) * 0.035) *
    hitPower *
    PHY.damageScale *
    state.damagePressure;

/*
 * 現在「你 / 敵」能量條就是勝負條。
 * 陀螺碰撞時只扣 energy。
 *
 * aDamage：a 對 b 造成的能量傷害基準。
 * bDamage：b 對 a 造成的能量傷害基準。
 */
const aEnergyDamage =
  clamp(
    aDamage * 0.95 +
    hitPower * 0.45 +
    tangentSpeed * 0.12,
    0.35,
    18
  );

const bEnergyDamage =
  clamp(
    bDamage * 0.95 +
    hitPower * 0.45 +
    tangentSpeed * 0.12,
    0.35,
    18
  );

/*
 * b 承受 a 的攻擊，所以扣 b。
 * a 承受 b 的攻擊，所以扣 a。
 */
consumeBodyEnergy(b, aEnergyDamage);
consumeBodyEnergy(a, bEnergyDamage);

updateHpBars();

/*
 * 碰撞後如果任一方能量歸零，立刻觸發結束檢查。
 */
if (checkFinish()) {
  return;
}


/*
 * 如果你已經不想用 HP 作為勝負，
 * 可以同步讓 hp 反映 energy，方便結果頁沿用 hp 欄位。
 */
a.hp = a.energy;
a.maxHp = a.maxEnergy;

b.hp = b.energy;
b.maxHp = b.maxEnergy;


  const spinCost = hitPower * PHY.collisionSpinLoss;

  a.spin = Math.max(0, a.spin - spinCost * (1.05 - a.defense / 260));
  b.spin = Math.max(0, b.spin - spinCost * (1.05 - b.defense / 260));

  a.spinRatio = clamp(a.spin / a.maxSpin, 0, 1);
  b.spinRatio = clamp(b.spin / b.maxSpin, 0, 1);

  a.wobble += hitPower * 0.012 * (1.2 - a.spinRatio);
  b.wobble += hitPower * 0.012 * (1.2 - b.spinRatio);

  a.lastHitAt = t;
  b.lastHitAt = t;

  if (bDamage > 0.9) {
    pulseHpBar("player");
  }

  if (aDamage > 0.9) {
    pulseHpBar("enemy");
  }

  if (a.side === "player" || b.side === "player") {
    pulseBattleEnergyBar();
  }

  updateHpBars();
  updateBattleEnergyPanel();
  state.lastEffectiveHitAt = t;

  const intensity = clamp(hitPower / 8, 0.25, 2.1);
  const heavy = hitPower > 5.5 || Math.max(aDamage, bDamage) > 4.2;

  const stronger =
    aDamage > bDamage
      ? a.side === "player"
        ? "你"
        : "敵方"
      : b.side === "player"
        ? "你"
        : "敵方";

  if (!state.firstCollision) {
    state.firstCollision = true;
    setCommentary("首次接觸！火花爆開！");
    playFirstCollisionFX(midX, midY, intensity);
    trackCollision("first", hitPower, aDamage, bDamage);
  } else if (heavy) {
    setCommentary(`${stronger}打出重擊！場地震動！`);
    playHeavyCollisionFX(midX, midY, intensity, a, b);
    trackCollision("heavy", hitPower, aDamage, bDamage);
  } else {
    if (Math.random() < 0.35) {
      setCommentary("連續碰撞！金屬聲交錯！");
    }

    playNormalCollisionFX(midX, midY, intensity);
    trackCollision("normal", hitPower, aDamage, bDamage);
  }

  maybeTriggerCenterDuel(a, b, hitPower);
}


  function trackCollision(kind, hitPower, aDamage, bDamage) {
    const t = now();

    if (t - PERF.lastCollisionTrackAt < 520) return;

    PERF.lastCollisionTrackAt = t;

    track("collision", {
      kind,
      hitPower: Number(hitPower.toFixed(2)),
      playerDamage: Number(
        (state.battle?.player?.side === "player" ? bDamage : aDamage).toFixed(2)
      ),
      enemyDamage: Number(
        (state.battle?.enemy?.side === "enemy" ? aDamage : bDamage).toFixed(2)
      )
    });
  }

  function playLaunchSequence(power = 0.75) {
    const box = battleBox();
    if (!box) return;

    const intensity = clamp(power * 1.35, 0.45, 1.65);

    Sound.launch();

    box.classList.add("zg-launch-impact");
    restartClass(box, "punch", 420);

    createLaunchShockwave(intensity);
    createStarDust(fxCount(26, intensity));
    createImpactStreak(box.clientWidth * 0.5, box.clientHeight * 0.5, intensity);

    setTimeout(() => {
      box.classList.remove("zg-launch-impact");
    }, 620);
  }

  function playFirstCollisionFX(x, y, intensity) {
    const box = battleBox();

    Sound.metal(1.18 * intensity, 1.1);
    shakeArena("big-shake");

    if (box) {
      restartClass(box, "zg-collision-zoom", 360);
    }

    createImpactRing(x, y, 1.15 * intensity);
    createSparks(x, y, intensity, 1.1);
    createMetalSparks(x, y, intensity);
    createImpactStreak(x, y, intensity);
  }

  function playNormalCollisionFX(x, y, intensity) {
    Sound.metal(0.72 * intensity, 1);

    if (canFx(34)) {
      createSparks(x, y, intensity, 0.8);
    }

    if (intensity > 0.7 && canFx(60)) {
      createImpactRing(x, y, 0.75 * intensity);
    }
  }

  function playHeavyCollisionFX(x, y, intensity, a, b) {
    const box = battleBox();

    Sound.metal(1.45 * intensity, 1.25);
    shakeArena("big-shake");

    if (box) {
      restartClass(box, "zg-collision-heavy", 460);
      restartClass(box, "zg-impact-punch", 300);
    }

    createImpactRing(x, y, 1.4 * intensity);
    createSparks(x, y, intensity * 1.35, 1.35);
    createMetalSparks(x, y, intensity * 1.1);
    createBurstPieces(x, y, intensity);

    if (a && b) {
      createImpactStreak((a.x + b.x) / 2, (a.y + b.y) / 2, intensity * 1.2);
    }
  }

  function createStarDust(count = 18) {
    const box = battleBox();
    if (!box || !canFx(20)) return;

    const rect = box.getBoundingClientRect();
    const w = rect.width || box.clientWidth || 420;
    const h = rect.height || box.clientHeight || 420;

    const amount = fxCount(count, 1);
    const frag = document.createDocumentFragment();

    fxAdd();

    for (let i = 0; i < amount; i += 1) {
      const s = document.createElement("i");

      s.className = "zg-stardust";
      s.style.left = `${rand(8, w - 8)}px`;
      s.style.top = `${rand(8, h - 8)}px`;
      s.style.animationDelay = `${rand(0, 0.35)}s`;
      s.style.opacity = String(rand(0.4, 0.95));

      frag.appendChild(s);
    }

    box.appendChild(frag);

    setTimeout(() => {
      $$(".zg-stardust", box).slice(0, amount).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });

      fxRemove();
    }, 1200);
  }

  function createSparks(x, y, intensity = 1, spread = 1) {
    const box = battleBox();
    if (!box || !canFx(22)) return;

    const amount = fxCount(12, intensity);
    const frag = document.createDocumentFragment();

    fxAdd();

    for (let i = 0; i < amount; i += 1) {
      const s = document.createElement("i");
      const angle = rand(0, Math.PI * 2);
      const dist = rand(18, 70) * intensity * spread;

      s.className = "zg-spark";
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.setProperty("--rot", `${rand(-180, 180)}deg`);
      s.style.animationDuration = `${rand(0.28, 0.58)}s`;

      frag.appendChild(s);
    }

    box.appendChild(frag);

    setTimeout(() => {
      $$(".zg-spark", box).slice(0, amount).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });

      fxRemove();
    }, 700);
  }

  function createMetalSparks(x, y, intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(45)) return;

    const amount = fxCount(9, intensity);
    const frag = document.createDocumentFragment();

    fxAdd();

    for (let i = 0; i < amount; i += 1) {
      const s = document.createElement("i");
      const angle = rand(0, Math.PI * 2);
      const dist = rand(26, 95) * intensity;

      s.className = "zg-metal-spark";
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      s.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      s.style.animationDuration = `${rand(0.16, 0.34)}s`;

      frag.appendChild(s);
    }

    box.appendChild(frag);

    setTimeout(() => {
      $$(".zg-metal-spark", box).slice(0, amount).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });

      fxRemove();
    }, 520);
  }

  function createImpactRing(x, y, intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(45)) return;

    const ring = document.createElement("i");

    fxAdd();

    ring.className = "zg-impact-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.setProperty("--scale", String(clamp(intensity, 0.5, 2.4)));

    box.appendChild(ring);

    setTimeout(() => {
      try {
        ring.remove();
      } catch (error) {}

      fxRemove();
    }, 700);
  }

  function createLaunchShockwave(intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(120)) return;

    const wave = document.createElement("i");

    fxAdd();

    wave.className = "zg-launch-shockwave";
    wave.style.left = "50%";
    wave.style.top = "50%";
    wave.style.setProperty("--scale", String(clamp(intensity, 0.6, 2.2)));

    box.appendChild(wave);

    setTimeout(() => {
      try {
        wave.remove();
      } catch (error) {}

      fxRemove();
    }, 900);
  }

  function createImpactStreak(x, y, intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(85)) return;

    const line = document.createElement("i");

    fxAdd();

    line.className = "zg-impact-streak";
    line.style.left = `${x}px`;
    line.style.top = `${y}px`;
    line.style.setProperty("--rot", `${rand(-35, 35)}deg`);
    line.style.setProperty("--scale", String(clamp(intensity, 0.5, 2.3)));

    box.appendChild(line);

    setTimeout(() => {
      try {
        line.remove();
      } catch (error) {}

      fxRemove();
    }, 500);
  }

  function createBurstPieces(x, y, intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(120)) return;

    const amount = fxCount(8, intensity);
    const frag = document.createDocumentFragment();

    fxAdd();

    for (let i = 0; i < amount; i += 1) {
      const p = document.createElement("i");
      const angle = rand(0, Math.PI * 2);
      const dist = rand(34, 105) * intensity;

      p.className = "zg-burst-piece";
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      p.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      p.style.setProperty("--rot", `${rand(-300, 300)}deg`);
      p.style.animationDuration = `${rand(0.55, 0.95)}s`;

      frag.appendChild(p);
    }

    box.appendChild(frag);

    setTimeout(() => {
      $$(".zg-burst-piece", box).slice(0, amount).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });

      fxRemove();
    }, 1100);
  }

  function createWallFlash(x, y, nx, ny, intensity = 1) {
    const box = battleBox();
    if (!box || !canFx(75)) return;

    const flash = document.createElement("i");

    fxAdd();

    flash.className = "zg-wall-flash";
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.style.setProperty("--rot", `${Math.atan2(ny, nx)}rad`);
    flash.style.setProperty("--scale", String(clamp(intensity, 0.45, 2.2)));

    box.appendChild(flash);

    setTimeout(() => {
      try {
        flash.remove();
      } catch (error) {}

      fxRemove();
    }, 620);
  }

  function createSpinAfterimage(body) {
    if (!body || !body.el || body.dead) return;

    const box = battleBox();
    if (!box || !canFx(80)) return;

    const img = document.createElement("i");

    fxAdd();

    img.className =
      `zg-spin-afterimage ${body.side === "player" ? "zg-player-after" : "zg-enemy-after"}`;

    img.style.left = `${body.x}px`;
    img.style.top = `${body.y}px`;
    img.style.width = `${body.r * 2}px`;
    img.style.height = `${body.r * 2}px`;
    img.style.setProperty("--c1", body.top.colorA);
    img.style.setProperty("--c2", body.top.colorB);

    box.appendChild(img);

    setTimeout(() => {
      try {
        img.remove();
      } catch (error) {}

      fxRemove();
    }, 520);
  }

  function createScratchTrail(body) {
    if (!body || body.dead) return;

    const box = battleBox();
    if (!box || !canFx(90)) return;

    const scratch = document.createElement("i");

    fxAdd();

    scratch.className = "zg-scratch";
    scratch.style.left = `${body.x}px`;
    scratch.style.top = `${body.y}px`;
    scratch.style.setProperty("--rot", `${Math.atan2(body.vy, body.vx)}rad`);
    scratch.style.opacity = String(0.25 + body.spinRatio * 0.45);

    box.appendChild(scratch);

    setTimeout(() => {
      try {
        scratch.remove();
      } catch (error) {}

      fxRemove();
    }, 700);
  }

  function shakeArena(cls = "shake") {
    const box = battleBox();
    if (!box) return;

    restartClass(box, cls, 500);
  }

  /*
   * ---------------------------------------------------------
   * 08-2. Special Battle Moments
   * ---------------------------------------------------------
   */

  function maybeTriggerCenterDuel(a, b, hitPower) {
    const battle = state.battle;
    if (!battle || state.centerDuelResolved) return;

    const arena = battle.arena;
    const distA = Math.hypot(a.x - arena.cx, a.y - arena.cy);
    const distB = Math.hypot(b.x - arena.cx, b.y - arena.cy);

    const nearCenter =
      distA < arena.xtremeR * 1.25 &&
      distB < arena.xtremeR * 1.25;

    if (!state.centerDuelStarted && nearCenter && hitPower > 4.3) {
      state.centerDuelStarted = true;
      state.centerDuelStartedAt = now();

      const box = battleBox();

      if (box) {
        box.classList.add("zg-center-duel");
      }

      setCommentary("中心決鬥！雙方在核心區硬碰硬！");
      createImpactRing(arena.cx, arena.cy, 1.8);
      createStarDust(36);
      Sound.metal(1.6, 1.35);

      track("center_duel_start", {
        hitPower: Number(hitPower.toFixed(2))
      });
    }

    if (!state.centerDuelStarted) return;

    const elapsed = now() - state.centerDuelStartedAt;

    if (elapsed > 1500 && nearCenter) {
      state.centerDuelResolved = true;

      const playerScore =
        battle.player.attack * battle.player.spinRatio +
        battle.player.defense * 0.34 +
        rand(-12, 12);

      const enemyScore =
        battle.enemy.attack * battle.enemy.spinRatio +
        battle.enemy.defense * 0.34 +
        rand(-12, 12);

      const loser = playerScore >= enemyScore ? battle.enemy : battle.player;
      const winner = loser === battle.player ? battle.enemy : battle.player;

/*
 * 中心決鬥只做演出與擊退，不額外扣 HP。
 * HP 只允許在 resolveCollision() 的陀螺碰撞中扣除。
 */
loser.spin = Math.max(0, loser.spin - rand(90, 160));
loser.spinRatio = clamp(loser.spin / loser.maxSpin, 0, 1);


      const dirX = loser.x - winner.x;
      const dirY = loser.y - winner.y;
      const d = Math.max(1, Math.hypot(dirX, dirY));

      loser.vx += (dirX / d) * rand(5, 8);
      loser.vy += (dirY / d) * rand(5, 8);

      updateHpBars();
      updateBattleEnergyPanel();

      setCommentary(
        `${winner.side === "player" ? "你" : "敵方"}贏下中心決鬥！`
      );

      playHeavyCollisionFX(arena.cx, arena.cy, 1.55, winner, loser);

      track("center_duel_resolve", {
        winner: winner.side,
        loser: loser.side
      });

      const box = battleBox();

      if (box) {
        setTimeout(() => {
          box.classList.remove("zg-center-duel");
        }, 700);
      }
    }
  }

function checkFinish() {
  const b = state.battle;

  if (!b || b.ended || state.finishing) return false;

  /*
   * 新勝負規則：
   * 你 / 敵能量條扣完即分出勝負。
   */
  const playerEnergy = Number.isFinite(b.player.energy)
    ? b.player.energy
    : 100;

  const enemyEnergy = Number.isFinite(b.enemy.energy)
    ? b.enemy.energy
    : 100;

  const playerEnergyRatio = clamp(
    Number.isFinite(b.player.energyRatio)
      ? b.player.energyRatio
      : playerEnergy / (b.player.maxEnergy || 100),
    0,
    1
  );

  const enemyEnergyRatio = clamp(
    Number.isFinite(b.enemy.energyRatio)
      ? b.enemy.energyRatio
      : enemyEnergy / (b.enemy.maxEnergy || 100),
    0,
    1
  );

  const pDead =
    b.player.dead ||
    playerEnergy <= 0 ||
    playerEnergyRatio <= 0;

  const eDead =
    b.enemy.dead ||
    enemyEnergy <= 0 ||
    enemyEnergyRatio <= 0;

  if (!pDead && !eDead) return false;

  let result = null;

  if (pDead && eDead) {
    result = "draw";
    b.finish = "double";
  } else if (eDead) {
    result = "win";
    b.finish = "burst";
  } else {
    result = "lose";
    b.finish = "burst";
  }

  const elapsed = now() - b.startedAt;

  const playerSpinRatio = clamp(b.player.spinRatio || 0, 0, 1);
  const enemySpinRatio = clamp(b.enemy.spinRatio || 0, 0, 1);

  const points =
    result === "win"
      ? 110 +
        Math.round(playerEnergyRatio * 45) +
        Math.round(playerSpinRatio * 35)
      : result === "draw"
        ? 60
        : 35 +
          Math.round(playerEnergyRatio * 20) +
          Math.round(playerSpinRatio * 15);

  b.ended = true;
  b.points = points;

  state.running = false;
  state.finishing = true;
  state.finishStartedAt = now();

  /*
   * 保險：把 dead 狀態補齊。
   */
  if (pDead) {
    b.player.dead = true;
    b.player.energy = 0;
    b.player.energyRatio = 0;
  }

  if (eDead) {
    b.enemy.dead = true;
    b.enemy.energy = 0;
    b.enemy.energyRatio = 0;
  }

  updateHpBars();

  const resultPayload = {
    result,
    finish: b.finish,
    points,

    playerTopId: b.player.top.id,
    playerTopName: b.player.top.name,
    playerTopType: b.player.top.type,

    enemyTopId: b.enemy.top.id,
    enemyTopName: b.enemy.top.name,
    enemyTopType: b.enemy.top.type,

    launchPower: b.launchPower,
    launchGrade: b.launchGrade,

    /*
     * 結果頁目前沿用 playerHp / enemyHp 欄位。
     * 但這裡實際代表剩餘 energy。
     */
    playerHp: Math.round(playerEnergyRatio * 100),
    enemyHp: Math.round(enemyEnergyRatio * 100),

    playerEnergy: Math.round(playerEnergyRatio * 100),
    enemyEnergy: Math.round(enemyEnergyRatio * 100),

    playerSpin: Math.round(playerSpinRatio * 100),
    enemySpin: Math.round(enemySpinRatio * 100),

    durationMs: Math.round(elapsed),
    ts: Date.now()
  };

  state.pendingResult = resultPayload;

  playFinishSequence(resultPayload);

  return true;
}

  
  function playFinishSequence(resultPayload) {
    const box = battleBox();

    Sound.stopHum();

    if (box) {
      box.classList.remove("zg-center-duel");

      if (resultPayload.finish === "burst") {
        box.classList.add("zg-burst-finish");
      } else if (resultPayload.finish === "spin") {
        box.classList.add("zg-spin-finish");
      } else {
        box.classList.add("zg-over-finish");
      }

      restartClass(box, "zg-impact-punch", 650);
      createImpactRing(box.clientWidth * 0.5, box.clientHeight * 0.5, 2.15);
      createStarDust(56);
    }


    if (resultPayload.result === "win") {
  setCommentary("勝利！你的陀螺仍然站在場上！");
  Sound.metal(1.6, 0.8);
} else if (resultPayload.result === "draw") {
  setCommentary("平手！雙方同時耗盡能量！");
  Sound.metal(1.1, 0.75);
} else {
  setCommentary("敗北！對手撐到了最後！");
  Sound.death();
}


    if (!state.resultLogged) {
      state.resultLogged = true;

      track("battle_finish", {
        result: resultPayload.result,
        finish: resultPayload.finish,
        points: resultPayload.points,
        playerTopId: resultPayload.playerTopId,
        enemyTopId: resultPayload.enemyTopId,
        launchPower: Number(resultPayload.launchPower.toFixed(3)),
        launchGrade: resultPayload.launchGrade,
        playerHp: resultPayload.playerHp,
        enemyHp: resultPayload.enemyHp,
        playerSpin: resultPayload.playerSpin,
        enemySpin: resultPayload.enemySpin,
        durationMs: resultPayload.durationMs
      });
    }

    setTimeout(() => {
      finishBattle(resultPayload);
    }, 1450);
  }

  function finishBattle(resultPayload) {
    const result = resultPayload || state.pendingResult;
    if (!result) return;

    state.running = false;
    state.finishing = false;
    state.pendingResult = null;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    state.lastBattleResult = result;

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
    } catch (error) {}

    addDailyPlay();

    const oldScore = getMyScore();

    let delta = 0;

if (result.result === "win") {
  delta = 18 + Math.round(result.points / 15);
} else if (result.result === "lose") {
  delta = -8 + Math.round(result.points / 40);
} else {
  delta = Math.round(result.points / 60);
}


    const newScore = Math.max(0, oldScore + delta);

    setMyScore(newScore);

    try {
      window.dispatchEvent(
        new CustomEvent("zelo:game:finished", {
          detail: {
            ...result,
            oldScore,
            newScore,
            delta
          }
        })
      );
    } catch (error) {}

    showScreen("result");
  }

  function battleLoop(ts) {
    if (!state.running || !state.battle) return;

    const b = state.battle;

    if (!state.lastFrame) {
      state.lastFrame = ts;
    }

    const dtRaw = Math.min(2.2, (ts - state.lastFrame) / 16.6667);
    const dt = clamp(dtRaw, 0.35, 1.85);

    state.lastFrame = ts;

    updatePerf(dtRaw);

    const arena = getArenaInfo();
    b.arena = arena;

    if (!b.player.dead) {
      updateBody(b.player, b.enemy, arena, dt);
      resolveWall(b.player, arena);
    }

    if (!b.enemy.dead) {
      updateBody(b.enemy, b.player, arena, dt);
      resolveWall(b.enemy, arena);
    }

    resolveCollision(b.player, b.enemy);

    const elapsed = now() - b.startedAt;

    /*
     * 長時間沒碰撞時，提高推進力與傷害壓力，避免戰鬥拖太久。
     */
    const idleMs = now() - (state.lastEffectiveHitAt || b.startedAt);

    if (idleMs > 2200) {
      state.damagePressure = clamp(
        state.damagePressure + 0.0018 * dt,
        1,
        1.85
      );

      [b.player, b.enemy].forEach((body) => {
        if (!body || body.dead) return;

        const dx = arena.cx - body.x;
        const dy = arena.cy - body.y;
        const d = Math.max(1, Math.hypot(dx, dy));

        body.vx += (dx / d) * 0.16 * dt;
        body.vy += (dy / d) * 0.16 * dt;
      });

      if (idleMs > 3400 && now() - state.stuckBoostAt > 900) {
        state.stuckBoostAt = now();

        const p = b.player;
        const e = b.enemy;

        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.max(1, Math.hypot(dx, dy));

        p.vx += (dx / d) * 2.2;
        p.vy += (dy / d) * 2.2;
        e.vx -= (dx / d) * 2.2;
        e.vy -= (dy / d) * 2.2;

        setCommentary("雙方重新逼近，準備下一次碰撞！");
      }
    } else {
      state.damagePressure = clamp(
        state.damagePressure - 0.0012 * dt,
        1,
        1.85
      );
    }

    [b.player, b.enemy].forEach((body) => {
      if (!body) return;

      syncBody(body);

      if (!body.dead && body.spinRatio > 0.22) {
        const t = now();

        if (t - PERF.lastAfterimageAt > 180) {
          PERF.lastAfterimageAt = t;
          createSpinAfterimage(body);
        }

        if (body.wobble > 0.35 && t - PERF.lastScratchAt > 230) {
          PERF.lastScratchAt = t;
          createScratchTrail(body);
          Sound.grind(0.55 + body.wobble * 0.25);
        }
      }
    });

   Sound.updateHum(0, b.player.spinRatio, 90, 1);
    Sound.updateHum(1, b.enemy.spinRatio, 76, 0.85);

    /*
     * 戰鬥中只更新你 / 敵能量條。
     * 拉霸能量 UI 不應該每幀更新。
     */
    updateHpBars();

    /*
     * 每幀都檢查能量勝負。
     * 能量扣完立即結束，不等待時間。
     */
    if (checkFinish()) {
      return;
    }

    if (state.running) {
      state.raf = requestAnimationFrame(battleLoop);
    }
  }

  /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁
   * =========================================================
   */
  /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁
   * =========================================================
   */

  function ensureResultDom(root) {
    if (screenResult()) return;

    const section = document.createElement("section");
    section.id = "screen-result";
    section.className = "zg-screen zg-result-screen";
    section.hidden = true;

    section.innerHTML = `
      <main class="zg-result-main">
        <div class="zg-result-card">
          <div class="zg-result-kicker">Battle Result</div>

          <h2 class="zg-result-title" id="zg-result-title">
            結果
          </h2>

          <p class="zg-result-subtitle" id="zg-result-subtitle">
            戰鬥結算中...
          </p>

          <div class="zg-score-box">
            <span>本場分數</span>
            <strong id="zg-result-points">0</strong>
          </div>

          <div class="zg-result-grid">
            <div>
              <span>我方能量</span>
              <strong id="zg-result-player-hp">0%</strong>
            </div>

            <div>
              <span>敵方能量</span>
              <strong id="zg-result-enemy-hp">0%</strong>
            </div>

            <div>
              <span>我方轉速</span>
              <strong id="zg-result-player-spin">0%</strong>
            </div>

            <div>
              <span>敵方轉速</span>
              <strong id="zg-result-enemy-spin">0%</strong>
            </div>
          </div>

          <div class="zg-bottom result-bottom">
            <button
              class="zg-btn zg-btn-red"
              data-zg-action="restart"
              type="button"
            >
              再戰一場
            </button>

            <button
              class="zg-btn zg-btn-dark"
              data-zg-action="select"
              type="button"
            >
              更換陀螺
            </button>

            <button
              class="zg-btn zg-btn-dark"
              data-zg-action="home"
              type="button"
            >
              回首頁
            </button>
          </div>
        </div>
      </main>
    `;

    root.appendChild(section);
  }
  function renderResult(result) {
    const title = $("#zg-result-title");
    const subtitle = $("#zg-result-subtitle");
    const points = $("#zg-result-points");

    const pHp = $("#zg-result-player-hp");
    const eHp = $("#zg-result-enemy-hp");
    const pSpin = $("#zg-result-player-spin");
    const eSpin = $("#zg-result-enemy-spin");

    const scoreBox = $(".zg-score-box");
    const resultCard = $(".zg-result-card");

    if (!result) return;

if (title) {
  if (result.result === "win") {
    title.textContent = "勝利！";
  } else if (result.result === "draw") {
    title.textContent = "平手";
  } else {
    title.textContent = "敗北...";
  }
}

    if (subtitle) {
      let finishText = "持久戰";

      if (result.finish === "burst") {
        finishText = "爆裂終結";
      } else if (result.finish === "spin") {
        finishText = "旋轉停止";
      } else if (result.finish === "double") {
        finishText = "雙方同時停止";
      }

      subtitle.textContent =
        `${finishText}・${result.playerTopName || "我方"} vs ${result.enemyTopName || "敵方"}`;
    }

    if (points) {
      points.textContent = String(result.points || 0);
    }

    if (pHp) pHp.textContent = `${result.playerHp || 0}%`;
    if (eHp) eHp.textContent = `${result.enemyHp || 0}%`;
    if (pSpin) pSpin.textContent = `${result.playerSpin || 0}%`;
    if (eSpin) eSpin.textContent = `${result.enemySpin || 0}%`;

    if (scoreBox) {
      restartClass(scoreBox, "zg-score-pop", 700);
    }

    if (resultCard) {
      resultCard.classList.toggle("zg-result-win", result.result === "win");
resultCard.classList.toggle("zg-result-lose", result.result === "lose");
resultCard.classList.toggle("zg-result-draw", result.result === "draw");
    }

    track("result_view", {
      result: result.result,
      finish: result.finish,
      points: result.points,
      launchPower:
        typeof result.launchPower === "number"
          ? Number(result.launchPower.toFixed(3))
          : null,
      launchGrade: result.launchGrade || ""
    });
  }

  function restartFromResult() {
    if (shouldIgnoreRepeatedAction("restart", 500)) return;

    beginChargeBattle();
  }

  /*
 * =========================================================
 * 10. DAILY LIMIT / 每日次數限制
 * =========================================================
 *
 * 注意：
 * getTodayKey / getDailyKey / loadDailyLimit / isDailyBlocked
 * 已在 HELPERS 區定義。
 * 這裡只保留 addDailyPlay，避免重複宣告覆蓋前面的版本。
 */

function addDailyPlay() {
  const result = increaseDailyPlay();

  track("daily_play_used", {
    playsUsed: result.playsUsed,
    remainingPlays: result.remainingPlays,
    dailyLimit: DAILY_LIMIT,
    dailyKey: getDailyKey()
  });

  return result;
}

  /*
   * =========================================================
   * 11. LIFF / Profile Integration
   * =========================================================
   */

  async function initLiffProfile() {
    const liffId = window.ZELO_LIFF_ID || window.liffId || "";

    if (!liffId || !window.liff) {
      state.profile = getProfile();
      return state.profile;
    }

    try {
      await window.liff.init({
        liffId
      });

      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return null;
      }

      const profile = await window.liff.getProfile();

      state.profile = profile;

      window.ZELO_PROFILE = profile;

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
      } catch (error) {}

      track("liff_profile_loaded", {
        userId: profile.userId || "",
        displayName: profile.displayName || ""
      });

      return profile;
    } catch (error) {
      console.warn("[ZELO GAME] LIFF init failed", error);

      state.profile = getProfile();

      track("liff_profile_error", {
        message: String(error && error.message ? error.message : error)
      });

      return state.profile;
    }
  }

  /*
   * =========================================================
   * 12. TRACKING / Analytics
   * =========================================================
   */

  function track(eventName, payload = {}) {
    const data = {
      event: eventName,
      ts: Date.now(),
      screen: state.screen || "",
      userId: getUserId(),
      playerName: getPlayerName(),
      ...payload
    };

    try {
      window.dispatchEvent(
        new CustomEvent("zelo:game:track", {
          detail: data
        })
      );
    } catch (error) {}

    if (window.ZELO_GAME_DEBUG) {
      console.log("[ZELO GAME TRACK]", data);
    }

    /*
     * 可選整合：
     * window.ZELO_TRACK(eventName, data)
     */
    try {
      if (typeof window.ZELO_TRACK === "function") {
        window.ZELO_TRACK(eventName, data);
      }
    } catch (error) {}
  }

  /*
   * =========================================================
   * 13. GLOBAL EVENTS / 全域事件
   * =========================================================
   */

  function handleAction(action, target) {
    if (!action) return;

    Sound.resume();

    if (action === "start") {
      handleHomeStart();
      return;
    }

    if (action === "home") {
      stopBattle();
      cancelChargeLoop();
      showScreen("start");
      return;
    }

    if (action === "select") {
      stopBattle();
      cancelChargeLoop();
      showScreen("select");
      return;
    }

    if (action === "battle") {
      beginChargeBattle();
      return;
    }

    if (action === "restart") {
      restartFromResult();
      return;
    }

    if (action === "share") {
      handleShare();
      return;
    }

    if (action === "close") {
      handleClose();
    }
  }
  function handleShare() {
    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    const text = result
      ? `我在 ZELO 陀螺競技場${result.result === "win" ? "獲勝" : "完成挑戰"}，拿到 ${result.points || 0} 分！`
      : "來挑戰 ZELO 陀螺競技場，看看誰的陀螺能站到最後！";

    track("share_click", {
      hasResult: !!result,
      result: result?.result || "",
      points: result?.points || 0
    });

    if (navigator.share) {
      navigator.share({
        title: "ZELO 陀螺競技場",
        text,
        url: location.href
      }).catch(() => {});
      return;
    }

    try {
      navigator.clipboard.writeText(`${text}\n${location.href}`);
      alert("分享文字已複製！");
    } catch (error) {
      alert(text);
    }
  }

  function handleClose() {
    track("close_click", {
      source: state.screen || "unknown"
    });

    try {
      if (window.liff && window.liff.isInClient && window.liff.isInClient()) {
        window.liff.closeWindow();
        return;
      }
    } catch (error) {}

    showScreen("start");
  }

  function bindGlobalEvents() {
    if (state.globalBound) return;

    state.globalBound = true;

    document.addEventListener(
      "click",
      (event) => {
        const actionEl = event.target.closest("[data-zg-action]");

        if (!actionEl) return;

        const root = appRoot();

        if (!root.contains(actionEl)) return;

        event.preventDefault();
        event.stopPropagation();

        const action = actionEl.getAttribute("data-zg-action");

        handleAction(action, actionEl);
      },
      true
    );

    document.addEventListener(
      "click",
      (event) => {
        const card = event.target.closest(".zg-top-card");

        if (!card) return;

        const root = appRoot();

        if (!root.contains(card)) return;

        event.preventDefault();
        event.stopPropagation();

        const id =
          card.getAttribute("data-id") ||
          card.getAttribute("data-top-id") ||
          "";

        if (id) {
          selectTop(id, true);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      (event) => {
        const key = event.key;

        if (key === "Escape") {
          if (state.screen === "battle") {
            stopBattle();
            cancelChargeLoop();
            showScreen("select");
            return;
          }

          if (state.screen === "select" || state.screen === "result") {
            showScreen("start");
            return;
          }
        }

        /*
         * 電腦版支援空白鍵蓄力。
         */
        if (key === " " || key === "Spacebar") {
          const battle = screenBattle();
          const btn = battle ? $(".zg-charge-btn", battle) : null;

          if (!btn) return;
          if (btn.disabled) return;
          if (state.screen !== "battle") return;
          if (state.running || state.battle || state.finishing) return;

          event.preventDefault();
          event.stopPropagation();

          if (!state.charging) {
            Sound.resume();
            startCharging();
            btn.classList.add("zg-charge-pressing");
          }
        }
      },
      true
    );

    document.addEventListener(
      "keyup",
      (event) => {
        const key = event.key;

        if (key !== " " && key !== "Spacebar") return;
        if (!state.charging) return;

        event.preventDefault();
        event.stopPropagation();

        const battle = screenBattle();
        const btn = battle ? $(".zg-charge-btn", battle) : null;

        if (btn) {
          btn.classList.remove("zg-charge-pressing");
        }

        releaseCharging();
      },
      true
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          if (state.charging) {
            cancelChargeLoop();
            setChargePower(0);
          }

          if (state.running) {
            state.paused = true;
          }

          Sound.stopHum();
        } else {
          if (state.running && state.battle) {
            state.paused = false;
            state.lastFrame = 0;
            Sound.resume();

            if (!state.raf) {
              state.raf = requestAnimationFrame(battleLoop);
            }
          }
        }
      },
      false
    );


    window.addEventListener("pagehide", () => {
      cancelChargeLoop();
      stopBattle();
      Sound.stopHum();
    });

    window.addEventListener("beforeunload", () => {
      cancelChargeLoop();
      Sound.stopHum();
    });
  }

  /*
   * =========================================================
   * 14. APP BOOTSTRAP / 啟動
   * =========================================================
   */

  async function boot() {
    if (state.booted) return;

    state.booted = true;

    ensureAppHeight();
    applyCssVariables();

    hardResetGamePage();

    removeMenuDom();
    watchMenuDom();

    ensureBasicDom();
    bindGlobalEvents();

    state.selectedTop = loadSelectedTop();

    loadDailyLimit();

    showScreen("start");

    track("boot", {
      dailyLimit: DAILY_LIMIT,
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      selectedTopId: state.selectedTop?.id || "",
      selectedTopName: state.selectedTop?.name || ""
    });

    /*
     * LIFF profile 非阻塞初始化。
     */
    initLiffProfile().then((profile) => {
      if (!profile) return;

      track("profile_ready", {
        userId: profile.userId || profile.id || profile.uid || "",
        displayName:
          profile.displayName ||
          profile.name ||
          profile.playerName ||
          ""
      });
    });
  }

    function exposeApi() {
    window.ZELO_GAME = {
      boot,
      start: handleHomeStart,
      startBattle: beginChargeBattle,
      stopBattle,
      showScreen,
      selectTop,

      getState() {
        return {
          screen: state.screen,
          selectedTop: state.selectedTop,
          enemyTop: state.enemyTop,
          running: state.running,
          charging: state.charging,
          launchPower: state.launchPower,
          playsUsed: state.playsUsed,
          remainingPlays: state.remainingPlays,
          lastBattleResult: state.lastBattleResult,

          battle: state.battle
            ? {
                playerHp: state.battle.player.hp,
                enemyHp: state.battle.enemy.hp,

                playerEnergy: state.battle.player.energy,
                enemyEnergy: state.battle.enemy.energy,
                playerEnergyRatio: state.battle.player.energyRatio,
                enemyEnergyRatio: state.battle.enemy.energyRatio,

                playerSpin: state.battle.player.spinRatio,
                enemySpin: state.battle.enemy.spinRatio
              }
            : null
        };
      },

      resetDailyLimit() {
        try {
          localStorage.removeItem(getDailyKey());
        } catch (error) {}

        loadDailyLimit();

        return {
          playsUsed: state.playsUsed,
          remainingPlays: state.remainingPlays
        };
      },

      resetScore() {
        setMyScore(1200);
        return getMyScore();
      }
    };
  }


  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, {
        once: true
      });
    } else {
      fn();
    }
  }

  exposeApi();

  ready(() => {
    boot();
  });
})();

