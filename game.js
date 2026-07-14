/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607150315-clean-rewrite-070809
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
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const VERSION = "202607150531-clean-rewrite-070809";

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

    /*
     * 注意：
     * battleLimit / stop threshold 僅保留參數，
     * 新版不會因時間到、轉速歸零、中央決勝自動結束。
     */
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

    /*
     * 中央決勝狀態保留，但新版不以它提前結束。
     */
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

    const removeStyleIds = [
      "zg-bg-style",
      "zg-main-button-fix-style",
      "zg-battle-emergency-fix-style",
      "zg-result-fix-style",
      "zg-energy-charge-style",
      "zg-clean-style",
      "zg-clean-battle-style"
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
   * 04-1. Clean Unified Styles
   * ---------------------------------------------------------
   */

function injectStyles() {
  const old = document.getElementById("zg-clean-style");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-clean-style";

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
      background: #090612 !important;
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

#zelo-liff-game {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
}


    .zg-screen {
      display: none !important;
      position: relative !important;
      width: 100% !important;
      min-height: var(--zg-app-height, 100vh) !important;
      box-sizing: border-box !important;
      color: #ffffff !important;
      background:
        radial-gradient(circle at 18% 12%, rgba(255,45,85,0.22), transparent 34%),
        radial-gradient(circle at 86% 10%, rgba(0,210,255,0.18), transparent 36%),
        linear-gradient(160deg, #120617 0%, #06111e 58%, #050711 100%) !important;
      overflow: hidden !important;
    }

    .zg-screen.active,
    .zg-screen.is-active {
      display: flex !important;
      flex-direction: column !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    .zg-screen[hidden],
    .zg-screen:not(.active):not(.is-active) {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    body[data-zg-screen]:not([data-zg-screen="start"]):not([data-zg-screen="home"]) #screen-start,
    body[data-zg-screen]:not([data-zg-screen="select"]) #screen-select,
    body[data-zg-screen]:not([data-zg-screen="battle"]) #screen-battle,
    body[data-zg-screen]:not([data-zg-screen="result"]) #screen-result {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .zg-main {
      flex: 1 1 auto !important;
      width: 100% !important;
      max-width: 860px !important;
      margin: 0 auto !important;
      padding: 28px 16px !important;
      box-sizing: border-box !important;
    }

    .zg-bottom {
      flex: 0 0 auto !important;
      width: 100% !important;
      max-width: 860px !important;
      margin: 0 auto !important;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 20 !important;
      pointer-events: auto !important;
    }

    .zg-btn,
    .zg-small-btn,
    .zg-top-card,
    .zg-charge-btn,
    [data-zg-action] {
      pointer-events: auto !important;
      cursor: pointer !important;
      position: relative !important;
      z-index: 20 !important;
    }

    .zg-btn {
      width: 100% !important;
      min-height: 52px !important;
      border-radius: 999px !important;
      border: 0 !important;
      font-size: 16px !important;
      font-weight: 1000 !important;
    }

    .zg-btn-red {
      background: linear-gradient(90deg, #ff3a3a, #d90018) !important;
      color: #fff !important;
      box-shadow: 0 10px 28px rgba(255,0,35,0.35) !important;
    }

    .zg-small-btn {
      min-height: 36px !important;
      padding: 0 16px !important;
      border-radius: 999px !important;
      border: 1px solid rgba(255,255,255,0.24) !important;
      background: rgba(34,42,58,0.92) !important;
      color: #fff !important;
      font-weight: 900 !important;
      font-size: 13px !important;
    }

    .zg-topbar {
      position: absolute !important;
      top: 10px !important;
      right: 12px !important;
      z-index: 50 !important;
      display: flex !important;
      justify-content: flex-end !important;
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

    /*
     * Home
     */
    #screen-start {
  width: 100% !important;
  min-height: var(--zg-app-height, 100vh) !important;
  height: var(--zg-app-height, 100vh) !important;
  overflow: hidden !important;

  background-image:
    radial-gradient(circle at 20% 20%, rgba(255,40,80,0.2), transparent 36%),
    radial-gradient(circle at 85% 15%, rgba(0,190,255,0.16), transparent 34%),
    linear-gradient(rgba(10, 8, 18, 0.16), rgba(10, 8, 18, 0.62)),
    var(--zg-home-bg-image) !important;

  /*
   * 最後一層主圖也改成 cover，讓背景全屏鋪滿。
   */
  background-size: cover, cover, cover, cover !important;
  background-position: center center, center center, center center, center center !important;
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat !important;
  background-color: #120914 !important;
}


    .zg-title {
      margin: 28vh 0 12px !important;
      font-size: 54px !important;
      line-height: 0.95 !important;
      font-weight: 1000 !important;
      letter-spacing: -2px !important;
    }

    .zg-highlight {
      color: #ff304a !important;
    }

    .zg-subtitle,
    .zg-desc {
      opacity: 0.86 !important;
      line-height: 1.55 !important;
    }

    .zg-hero {
      position: absolute !important;
      right: 24px !important;
      top: 70px !important;
      font-size: 90px !important;
      opacity: 0.24 !important;
      pointer-events: none !important;
    }

    /*
     * Select
     */
    .zg-step-title {
      margin-top: 44px !important;
      font-size: 30px !important;
      font-weight: 1000 !important;
    }

    .zg-top-list {
      display: grid !important;
      gap: 12px !important;
      margin-top: 18px !important;
    }

    .zg-top-card {
      display: flex !important;
      gap: 12px !important;
      align-items: center !important;
      width: 100% !important;
      padding: 14px !important;
      border-radius: 18px !important;
      border: 1px solid rgba(255,255,255,0.14) !important;
      background: rgba(255,255,255,0.07) !important;
      color: #fff !important;
      text-align: left !important;
      box-sizing: border-box !important;
    }

    .zg-top-card.selected,
    .zg-top-card.active {
      outline: 3px solid #ff304a !important;
      background: rgba(255,48,74,0.16) !important;
    }

    .zg-top-icon {
      flex: 0 0 62px !important;
      width: 62px !important;
      height: 62px !important;
      border-radius: 999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 30px !important;
      background:
        radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), transparent 18%),
        conic-gradient(from 0deg, var(--c1, #ff3d3d), var(--c2, #ffd84a), var(--c1, #ff3d3d)) !important;
    }

    .zg-top-content {
      min-width: 0 !important;
      flex: 1 1 auto !important;
    }

    .zg-top-name {
      font-weight: 1000 !important;
      font-size: 16px !important;
    }

    .zg-top-type {
      font-size: 12px !important;
      opacity: 0.78 !important;
      margin-top: 2px !important;
    }

    .zg-stats {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 6px !important;
      margin-top: 8px !important;
    }

    .zg-stat {
      font-size: 11px !important;
      opacity: 0.9 !important;
    }

    .zg-stat span {
      display: block !important;
      opacity: 0.72 !important;
    }

    .zg-stat strong {
      display: block !important;
      color: #ffd84a !important;
      font-size: 13px !important;
    }

    /*
     * Battle base
     */
    #screen-battle,
    #screen-result {
      height: var(--zg-app-height, 100vh) !important;
      overflow: hidden !important;
    }

    .zg-battle-header {
      position: absolute !important;
      top: 8px !important;
      right: 12px !important;
      z-index: 50 !important;
      display: flex !important;
      justify-content: flex-end !important;
      pointer-events: none !important;
    }

    .zg-battle-header button {
      pointer-events: auto !important;
    }

    .zg-battle-main {
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

    .zg-hp-fill.zg-hp-hit-pulse {
      animation: zgHpHitPulse 260ms ease-out !important;
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
      animation: zgEnergyPerfectPulse 620ms ease-in-out infinite !important;
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
      animation: zgEnergyCapPulse 420ms ease-in-out infinite !important;
    }

    .zg-charge-percent-badge {
      animation: zgBadgeBreath 980ms ease-in-out infinite !important;
    }

    .zg-charge-layer[data-charge-grade="perfect"] .zg-charge-percent-badge {
      animation: zgBadgePerfect 420ms ease-in-out infinite !important;
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

    /*
     * Battle top visual
     */
    .zg-battle-top {
      position: absolute !important;
      width: 68px !important;
      height: 68px !important;
      min-width: 68px !important;
      min-height: 68px !important;
      max-width: 68px !important;
      max-height: 68px !important;
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

    .zg-top-defeated {
      opacity: 0.35 !important;
      filter: grayscale(0.8) brightness(0.65) !important;
    }

    .zg-top-winner {
      box-shadow:
        0 0 26px rgba(255,220,80,0.85),
        0 0 48px rgba(255,80,80,0.55),
        inset 0 0 12px rgba(0,0,0,0.25) !important;
    }

    /*
     * FX
     */
    .zg-spark,
    .zg-impact-ring,
    .zg-metal-spark,
    .zg-scratch,
    .zg-launch-shockwave,
    .zg-spin-afterimage,
    .zg-impact-streak,
    .zg-burst-piece,
    .zg-wall-flash,
    .zg-flash-overlay,
    .zg-danger-vignette {
      pointer-events: none !important;
    }

    .zg-flash-overlay {
      position: absolute !important;
      inset: 0 !important;
      z-index: 40 !important;
      background: rgba(255,255,255,0) !important;
      mix-blend-mode: screen !important;
    }

    .zg-flash-overlay.hit {
      animation: zgFlashHit 180ms ease-out !important;
    }

    @keyframes zgFlashHit {
      0% {
        background: rgba(255,255,255,0.65);
      }

      100% {
        background: rgba(255,255,255,0);
      }
    }

    .zg-spark,
    .zg-impact-ring,
    .zg-launch-shockwave,
    .zg-wall-flash {
      position: absolute !important;
      width: 18px !important;
      height: 18px !important;
      border-radius: 999px !important;
      background: #ffffff !important;
      box-shadow: 0 0 18px #ffffff !important;
      transform: translate(-50%, -50%) !important;
      opacity: 0.8 !important;
      z-index: 30 !important;
    }

    .zg-metal-spark {
      position: absolute !important;
      width: 6px !important;
      height: 16px !important;
      border-radius: 999px !important;
      background: linear-gradient(#ffffff, #ffd84a, #ff3a3a) !important;
      box-shadow: 0 0 12px rgba(255,220,80,0.9) !important;
      transform: translate(-50%, -50%) rotate(var(--r, 0deg)) !important;
      z-index: 32 !important;
    }

    .zg-burst-piece {
      position: absolute !important;
      width: 10px !important;
      height: 10px !important;
      border-radius: 3px !important;
      background: #ffd84a !important;
      box-shadow: 0 0 10px rgba(255,220,80,0.9) !important;
      z-index: 35 !important;
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

    .zg-result-main {
      flex: 1 1 auto !important;
      width: 100% !important;
      max-width: 620px !important;
      margin: 0 auto !important;
      padding: 28px 16px 120px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-sizing: border-box !important;
      overflow: auto !important;
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

    .zg-coupon-note {
      font-size: 11px !important;
      opacity: 0.75 !important;
      text-align: center !important;
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

    .zg-rankbox {
      width: 100% !important;
      background: rgba(255,255,255,0.05) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      border-radius: 16px !important;
      padding: 12px !important;
      box-sizing: border-box !important;
    }

    .zg-rankbox-title {
      font-size: 13px !important;
      font-weight: 900 !important;
      margin-bottom: 8px !important;
      opacity: 0.9 !important;
    }

    .zg-rank-row {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 6px 4px !important;
      font-size: 13px !important;
      border-bottom: 1px solid rgba(255,255,255,0.06) !important;
    }

    .zg-rank-row.me {
      background: rgba(255,200,80,0.12) !important;
      border-radius: 10px !important;
    }

    .zg-rank-name {
      flex: 1 1 auto !important;
    }

    /*
     * Animations
     */
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
        transform: translateY(-50%) scale(1);
      }

      50% {
        transform: translateY(-50%) scale(1.035);
      }
    }

    @keyframes zgBadgePerfect {
      0%, 100% {
        transform: translateY(-50%) scale(1) rotate(-2deg);
        filter: brightness(1);
      }

      50% {
        transform: translateY(-50%) scale(1.12) rotate(2deg);
        filter: brightness(1.35);
      }
    }

    /*
     * Mobile base
     */
    @media (max-width: 520px) {
      .zg-title {
        font-size: 48px !important;
      }

      .zg-battle-main {
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

    /*
     * Final battle layout fix
     * Arena on top, HP/commentary/launch row below.
     */
    #screen-battle {
      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
    }

    #screen-battle .zg-battle-main {
      width: 100% !important;
      max-width: 860px !important;
      height: auto !important;
      min-height: var(--zg-app-height, 100vh) !important;
      margin: 0 auto !important;
      padding: 44px 12px 14px !important;
      box-sizing: border-box !important;
      display: grid !important;
      grid-template-rows: auto auto !important;
      gap: 12px !important;
      overflow: visible !important;
    }

    #screen-battle .zg-arena-wrap {
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: visible !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-battle-box {
      width: min(100%, 520px) !important;
      aspect-ratio: 1 / 1 !important;
      height: auto !important;
      max-height: 44vh !important;
      min-height: 240px !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-battle-panel {
      width: 100% !important;
      min-height: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 30 !important;
    }

    #screen-battle .zg-hp-group {
      width: 100% !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-commentary {
      width: 100% !important;
      flex: 0 0 auto !important;
    }

    /*
     * Hide incorrect charge UI outside launch row.
     */
    #screen-battle > .zg-charge-layer,
    #screen-battle > .zg-charge-card,
    #screen-battle .zg-arena-wrap > .zg-charge-layer,
    #screen-battle .zg-arena-wrap > .zg-charge-card,
    #screen-battle .zg-battle-box > .zg-charge-layer,
    #screen-battle .zg-battle-box > .zg-charge-card,
    #screen-battle .zg-battle-main > .zg-charge-layer,
    #screen-battle .zg-battle-main > .zg-charge-card {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
    }

    /*
     * Default: hide charge UI unless it is direct child of launch row.
     */
    #screen-battle .zg-charge-layer {
      display: none !important;
    }

    #screen-battle .zg-charge-card {
      display: none !important;
    }

    /*
     * Correct launch row layout.
     */
    #screen-battle .zg-launch-row {
      width: 100% !important;
      flex: 0 0 auto !important;
      min-height: 132px !important;
      display: grid !important;
      grid-template-columns: 132px minmax(0, 1fr) !important;
      gap: 12px !important;
      align-items: stretch !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 60 !important;
    }

    #screen-battle .zg-launch-row > .zg-external-top-photo {
      width: 132px !important;
      max-width: 132px !important;
      aspect-ratio: 1 / 1 !important;
      height: auto !important;
      min-height: 0 !important;
      align-self: start !important;
      border-radius: 14px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-launch-row > .zg-external-top-photo img {
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: 1 / 1 !important;
      object-fit: cover !important;
      display: block !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer {
      width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
      min-height: 132px !important;
      align-self: stretch !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 61 !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
      width: 100% !important;
      height: 100% !important;
      min-height: 132px !important;
      padding: 12px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 6px !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      position: relative !important;
      z-index: 62 !important;
    }

    #screen-battle .zg-charge-title {
      font-size: 16px !important;
      line-height: 1.15 !important;
      margin: 0 !important;
    }

    #screen-battle .zg-charge-subtitle,
    #screen-battle .zg-charge-tip {
      font-size: 10px !important;
      line-height: 1.25 !important;
      margin: 0 !important;
    }

    #screen-battle .zg-charge-meter {
      width: 100% !important;
      height: 42px !important;
      padding-left: 44px !important;
      box-sizing: border-box !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-charge-percent-badge {
      width: 42px !important;
      height: 42px !important;
      font-size: 15px !important;
    }

    #screen-battle .zg-energy-shell {
      width: 100% !important;
      height: 24px !important;
    }

    #screen-battle .zg-energy-cap {
      height: 32px !important;
    }

    #screen-battle .zg-charge-btn {
      width: 100% !important;
      min-height: 34px !important;
      font-size: 13px !important;
      flex: 0 0 auto !important;
    }

    @media (min-width: 641px) {
      #screen-battle .zg-battle-box {
        width: min(100%, 520px) !important;
        max-height: 44vh !important;
      }

      #screen-battle .zg-launch-row {
        grid-template-columns: 140px minmax(0, 1fr) !important;
        min-height: 140px !important;
      }

      #screen-battle .zg-launch-row > .zg-external-top-photo {
        width: 140px !important;
        max-width: 140px !important;
      }

      #screen-battle .zg-launch-row > .zg-charge-layer,
      #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
        min-height: 140px !important;
      }
    }

    @media (max-width: 420px) {
      #screen-battle .zg-battle-main {
        padding: 42px 10px 12px !important;
        gap: 8px !important;
      }

      #screen-battle .zg-battle-box {
        width: min(100%, 360px) !important;
        max-height: 40vh !important;
        min-height: 220px !important;
      }

      #screen-battle .zg-launch-row {
        grid-template-columns: 112px minmax(0, 1fr) !important;
        min-height: 124px !important;
        gap: 10px !important;
      }

      #screen-battle .zg-launch-row > .zg-external-top-photo {
        width: 112px !important;
        max-width: 112px !important;
      }

      #screen-battle .zg-launch-row > .zg-charge-layer,
      #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
        min-height: 124px !important;
      }

      #screen-battle .zg-charge-title {
        font-size: 14px !important;
      }

      #screen-battle .zg-charge-subtitle,
      #screen-battle .zg-charge-tip {
        font-size: 9px !important;
      }

      #screen-battle .zg-charge-meter {
        height: 38px !important;
        padding-left: 40px !important;
      }

      #screen-battle .zg-charge-percent-badge {
        width: 38px !important;
        height: 38px !important;
        font-size: 13px !important;
      }

      #screen-battle .zg-energy-shell {
        height: 22px !important;
      }

      #screen-battle .zg-charge-btn {
        min-height: 32px !important;
        font-size: 12px !important;
      }
    }
  `;

  document.head.appendChild(style);
}


  /*
   * ---------------------------------------------------------
   * 04-2. Basic DOM / Screen Switch
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


  function injectBattleLayoutOverride() {
  const old = document.getElementById("zg-battle-layout-override");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-battle-layout-override";

  style.textContent = `
    /*
     * =====================================================
     * ZELO Battle Layout Override
     * Unified width + vertical responsive version
     *
     * Goal:
     * - Arena width aligns with HP / commentary / launch row
     * - Responsive by width and height
     * - Mobile LIFF friendly
     * =====================================================
     */

    body[data-zg-screen="battle"] {
      overflow: hidden !important;
      background: #050b14 !important;
    }

    body[data-zg-screen="battle"] #zelo-liff-game {
      width: 100% !important;
      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      overflow: hidden !important;
      background: #050b14 !important;
    }

    #screen-battle {
      width: 100% !important;
      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      max-height: var(--zg-app-height, 100vh) !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      background:
        radial-gradient(circle at 18% 12%, rgba(255,45,85,0.22), transparent 34%),
        radial-gradient(circle at 86% 10%, rgba(0,210,255,0.18), transparent 36%),
        linear-gradient(160deg, #120617 0%, #06111e 58%, #050711 100%) !important;
      box-sizing: border-box !important;
    }

    /*
     * Main responsive variables.
     */
    #screen-battle .zg-battle-main {
      --zg-top-space: clamp(18px, 4.2vh, 48px);
      --zg-main-x: clamp(10px, 3.2vw, 48px);
      --zg-main-bottom: calc(clamp(10px, 2vh, 24px) + env(safe-area-inset-bottom, 0px));

      --zg-content-width: min(920px, calc(100vw - (var(--zg-main-x) * 2)));

      --zg-main-gap: clamp(8px, 1.45vh, 16px);
      --zg-panel-gap: clamp(7px, 1.2vh, 12px);

      /*
       * Arena uses the same width as lower panel.
       * Height is controlled separately by viewport height.
       */
      --zg-arena-width: var(--zg-content-width);
      --zg-arena-height: min(
        var(--zg-content-width),
        clamp(260px, 44vh, 560px)
      );

      --zg-commentary-h: clamp(40px, 5.4vh, 50px);

      --zg-photo-size: clamp(112px, 18vw, 190px);
      --zg-card-height: clamp(126px, 18vw, 190px);

      width: 100% !important;
      max-width: 980px !important;
      height: auto !important;
      min-height: var(--zg-app-height, 100vh) !important;
      margin: 0 auto !important;
      padding:
        var(--zg-top-space)
        var(--zg-main-x)
        var(--zg-main-bottom) !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      gap: var(--zg-main-gap) !important;
      overflow: visible !important;
      background: transparent !important;
      align-items: center !important;
    }

    /*
     * Exit button.
     */
    #screen-battle .zg-battle-header {
      top: max(8px, env(safe-area-inset-top, 0px)) !important;
      right: 10px !important;
      z-index: 100 !important;
    }

    /*
     * Arena wrapper now uses same content width as panel.
     */
    #screen-battle .zg-arena-wrap {
      width: var(--zg-content-width) !important;
      max-width: var(--zg-content-width) !important;
      height: var(--zg-arena-height) !important;
      min-height: var(--zg-arena-height) !important;
      max-height: var(--zg-arena-height) !important;
      margin: 0 auto !important;
      padding: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: visible !important;
      background: transparent !important;
      box-sizing: border-box !important;
      flex: 0 0 auto !important;
    }

    /*
     * Battle box visually equals lower content width.
     * Height can be shorter on mobile/short screens.
     */
    #screen-battle .zg-battle-box {
      width: var(--zg-arena-width) !important;
      height: var(--zg-arena-height) !important;
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: var(--zg-content-width) !important;
      max-height: var(--zg-arena-height) !important;
      aspect-ratio: auto !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      border-radius: clamp(22px, 3vw, 28px) !important;
    }

    /*
     * Because arena is no longer square on small screens,
     * keep logo visually centered and contained.
     */
    #screen-battle .zg-arena-logo-img {
      width: min(70%, 520px) !important;
      max-width: 70% !important;
      height: auto !important;
      object-fit: contain !important;
    }

    /*
     * Panel uses identical content width.
     */
    #screen-battle .zg-battle-panel {
      width: var(--zg-content-width) !important;
      max-width: var(--zg-content-width) !important;
      margin: 0 auto !important;
      padding: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: var(--zg-panel-gap) !important;
      overflow: visible !important;
      background: transparent !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 30 !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-hp-group {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      gap: clamp(4px, 0.7vh, 6px) !important;
    }

    #screen-battle .zg-hp-row {
      width: 100% !important;
      display: grid !important;
      grid-template-columns: 28px minmax(0, 1fr) 50px !important;
      gap: 10px !important;
      align-items: center !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-hp-bar {
      height: clamp(12px, 1.8vh, 15px) !important;
    }

    #screen-battle .zg-hp-name,
    #screen-battle .zg-hp-text {
      font-size: clamp(12px, 1.7vh, 14px) !important;
      line-height: 1 !important;
    }

    #screen-battle .zg-commentary {
      width: 100% !important;
      min-height: var(--zg-commentary-h) !important;
      height: var(--zg-commentary-h) !important;
      margin: 0 !important;
      padding: 6px 10px !important;
      box-sizing: border-box !important;
      background: rgba(255,255,255,0.08) !important;
      font-size: clamp(12px, 1.7vh, 14px) !important;
      line-height: 1.25 !important;
      border-radius: clamp(12px, 2vw, 14px) !important;
    }

    /*
     * Launch row uses identical content width.
     */
    #screen-battle .zg-launch-row,
    #screen-battle .zg-launch-row *,
    #screen-battle .zg-charge-layer {
      box-sizing: border-box !important;
    }

    #screen-battle .zg-launch-row {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      display: grid !important;
      grid-template-columns: var(--zg-photo-size) minmax(0, 1fr) !important;
      gap: clamp(8px, 1.8vw, 16px) !important;
      align-items: start !important;
      min-height: var(--zg-card-height) !important;
      height: var(--zg-card-height) !important;
      overflow: visible !important;
      background: transparent !important;
      border: 0 !important;
      outline: 0 !important;
      position: relative !important;
      z-index: 40 !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-launch-row::before,
    #screen-battle .zg-launch-row::after {
      display: none !important;
      content: none !important;
    }

    #screen-battle .zg-launch-row > .zg-external-top-photo {
      width: var(--zg-photo-size) !important;
      max-width: var(--zg-photo-size) !important;
      height: var(--zg-photo-size) !important;
      min-height: var(--zg-photo-size) !important;
      aspect-ratio: 1 / 1 !important;
      align-self: start !important;
      justify-self: start !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: clamp(12px, 2vw, 14px) !important;
      overflow: hidden !important;
      background: rgba(255,255,255,0.08) !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 42 !important;
    }

    #screen-battle .zg-launch-row > .zg-external-top-photo img {
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: 1 / 1 !important;
      object-fit: cover !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    #screen-battle .zg-external-photo-label {
      left: 6px !important;
      top: 6px !important;
      padding: 3px 6px !important;
      font-size: clamp(9px, 1.5vh, 11px) !important;
    }

    /*
     * Hide wrong charge UI.
     */
    #screen-battle > .zg-charge-layer,
    #screen-battle > .zg-charge-card,
    #screen-battle .zg-battle-main > .zg-charge-layer,
    #screen-battle .zg-battle-main > .zg-charge-card,
    #screen-battle .zg-arena-wrap > .zg-charge-layer,
    #screen-battle .zg-arena-wrap > .zg-charge-card,
    #screen-battle .zg-battle-box > .zg-charge-layer,
    #screen-battle .zg-battle-box > .zg-charge-card {
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

    #screen-battle .zg-charge-layer {
      display: none !important;
      background: transparent !important;
    }

    #screen-battle .zg-charge-card {
      display: none !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      height: var(--zg-card-height) !important;
      min-height: var(--zg-card-height) !important;
      max-height: var(--zg-card-height) !important;
      align-self: start !important;
      justify-self: stretch !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      background: transparent !important;
      border: 0 !important;
      outline: 0 !important;
      position: relative !important;
      z-index: 43 !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      width: 100% !important;
      max-width: none !important;
      height: var(--zg-card-height) !important;
      min-height: var(--zg-card-height) !important;
      max-height: var(--zg-card-height) !important;
      margin: 0 !important;
      padding: clamp(8px, 1.6vh, 16px) clamp(10px, 2vw, 18px) !important;
      border-radius: clamp(14px, 2vw, 18px) !important;
      box-sizing: border-box !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: stretch !important;
      gap: clamp(4px, 0.9vh, 10px) !important;
      overflow: hidden !important;
      background: linear-gradient(160deg, rgba(40,46,68,0.96), rgba(16,18,32,0.96)) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      box-shadow: inset 0 0 18px rgba(255,255,255,0.04) !important;
      position: relative !important;
      z-index: 44 !important;
      transform: none !important;
    }

    #screen-battle .zg-launch-row .zg-charge-title {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: center !important;
      font-size: clamp(13px, 1.9vh, 17px) !important;
      line-height: 1.12 !important;
      font-weight: 1000 !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-launch-row .zg-charge-subtitle,
    #screen-battle .zg-launch-row .zg-charge-tip {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      text-align: center !important;
      font-size: clamp(9px, 1.35vh, 11px) !important;
      line-height: 1.18 !important;
      opacity: 0.82 !important;
      flex: 0 0 auto !important;
    }

    #screen-battle .zg-launch-row .zg-charge-meter {
      --zg-badge-size: clamp(34px, 5.8vh, 48px);
      --zg-shell-height: clamp(20px, 3.4vh, 30px);

      width: 100% !important;
      height: var(--zg-badge-size) !important;
      min-height: var(--zg-badge-size) !important;
      margin: 0 !important;
      padding-left: calc(var(--zg-badge-size) + 4px) !important;
      display: flex !important;
      align-items: center !important;
      box-sizing: border-box !important;
      flex: 0 0 auto !important;
      position: relative !important;
    }

    #screen-battle .zg-launch-row .zg-charge-percent-badge {
      width: var(--zg-badge-size) !important;
      height: var(--zg-badge-size) !important;
      min-width: var(--zg-badge-size) !important;
      min-height: var(--zg-badge-size) !important;
      font-size: clamp(12px, 1.8vh, 16px) !important;
      left: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    #screen-battle .zg-launch-row .zg-energy-shell {
      width: 100% !important;
      height: var(--zg-shell-height) !important;
      min-height: var(--zg-shell-height) !important;
      margin: 0 !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-launch-row .zg-energy-cap {
      height: calc(var(--zg-shell-height) + 8px) !important;
    }

    #screen-battle .zg-launch-row .zg-charge-btn {
      width: 100% !important;
      min-height: clamp(28px, 4.6vh, 42px) !important;
      margin: 0 !important;
      padding: 0 clamp(10px, 2vw, 16px) !important;
      border-radius: 999px !important;
      font-size: clamp(12px, 1.7vh, 15px) !important;
      flex: 0 0 auto !important;
    }

    /*
     * Battle / finished phase compression.
     */
    #screen-battle[data-phase="battle"] .zg-battle-main,
    #screen-battle[data-phase="finished"] .zg-battle-main {
      --zg-card-height: clamp(116px, 16vh, 150px);
      --zg-photo-size: clamp(104px, 16vh, 150px);
    }

    #screen-battle[data-phase="battle"] .zg-launch-row .zg-charge-tip,
    #screen-battle[data-phase="finished"] .zg-launch-row .zg-charge-tip {
      display: none !important;
    }

    #screen-battle[data-phase="battle"] .zg-launch-row .zg-charge-btn,
    #screen-battle[data-phase="finished"] .zg-launch-row .zg-charge-btn {
      min-height: clamp(28px, 4vh, 34px) !important;
    }

    /*
     * Tablet.
     */
    @media (max-width: 820px) {
      #screen-battle .zg-battle-main {
        --zg-arena-height: min(var(--zg-content-width), clamp(260px, 42vh, 500px));
        --zg-photo-size: clamp(120px, 20vw, 170px);
        --zg-card-height: clamp(134px, 20vw, 170px);
      }
    }

    /*
     * Phone.
     */
    @media (max-width: 520px) {
      #screen-battle .zg-battle-main {
        --zg-top-space: 34px;
        --zg-main-x: 36px;
        --zg-main-gap: 10px;
        --zg-panel-gap: 9px;

        --zg-content-width: calc(100vw - 72px);
        --zg-arena-width: var(--zg-content-width);
        --zg-arena-height: min(var(--zg-content-width), 42vh);

        --zg-commentary-h: 56px;
        --zg-photo-size: 152px;
        --zg-card-height: 152px;

        padding:
          var(--zg-top-space)
          var(--zg-main-x)
          calc(16px + env(safe-area-inset-bottom, 0px)) !important;
      }

      #screen-battle .zg-hp-row {
        grid-template-columns: 24px minmax(0, 1fr) 42px !important;
        gap: 7px !important;
      }

      #screen-battle .zg-hp-bar {
        height: 15px !important;
      }

      #screen-battle .zg-commentary {
        font-size: 15px !important;
        font-weight: 1000 !important;
        border-radius: 14px !important;
      }

      #screen-battle .zg-launch-row {
        grid-template-columns: var(--zg-photo-size) minmax(0, 1fr) !important;
        gap: 14px !important;
      }

      #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
        border-radius: 14px !important;
      }

      #screen-battle[data-phase="battle"] .zg-battle-main,
      #screen-battle[data-phase="finished"] .zg-battle-main {
        --zg-photo-size: 152px;
        --zg-card-height: 152px;
      }
    }

    /*
     * Narrow phone.
     */
    @media (max-width: 430px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: 28px;
        --zg-content-width: calc(100vw - 56px);
        --zg-arena-width: var(--zg-content-width);
        --zg-arena-height: min(var(--zg-content-width), 41vh);
        --zg-photo-size: 136px;
        --zg-card-height: 136px;
      }

      #screen-battle[data-phase="battle"] .zg-battle-main,
      #screen-battle[data-phase="finished"] .zg-battle-main {
        --zg-photo-size: 136px;
        --zg-card-height: 136px;
      }
    }

    /*
     * Very narrow phone.
     */
    @media (max-width: 380px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: 18px;
        --zg-content-width: calc(100vw - 36px);
        --zg-arena-width: var(--zg-content-width);
        --zg-arena-height: min(var(--zg-content-width), 40vh);
        --zg-photo-size: 118px;
        --zg-card-height: 132px;
        --zg-main-gap: 8px;
        --zg-panel-gap: 7px;
      }

      #screen-battle[data-phase="battle"] .zg-battle-main,
      #screen-battle[data-phase="finished"] .zg-battle-main {
        --zg-photo-size: 118px;
        --zg-card-height: 132px;
      }

      #screen-battle .zg-commentary {
        --zg-commentary-h: 44px;
        font-size: 12px !important;
      }
    }

    /*
     * Short viewport.
     */
    @media (max-height: 760px) {
      #screen-battle .zg-battle-main {
        --zg-top-space: 26px;
        --zg-main-gap: 8px;
        --zg-panel-gap: 7px;
        --zg-commentary-h: 44px;
        --zg-arena-height: min(var(--zg-content-width), 38vh);
        --zg-photo-size: 124px;
        --zg-card-height: 124px;
      }

      #screen-battle .zg-commentary {
        min-height: var(--zg-commentary-h) !important;
        height: var(--zg-commentary-h) !important;
        font-size: 13px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-title {
        font-size: 13px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-subtitle,
      #screen-battle .zg-launch-row .zg-charge-tip {
        font-size: 9px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-btn {
        min-height: 28px !important;
        font-size: 12px !important;
      }

      #screen-battle[data-phase="battle"] .zg-battle-main,
      #screen-battle[data-phase="finished"] .zg-battle-main {
        --zg-photo-size: 116px;
        --zg-card-height: 116px;
      }
    }

    /*
     * Extra short viewport.
     */
    @media (max-height: 680px) {
      #screen-battle .zg-battle-main {
        --zg-top-space: 20px;
        --zg-main-gap: 6px;
        --zg-panel-gap: 6px;
        --zg-commentary-h: 40px;
        --zg-arena-height: min(var(--zg-content-width), 35vh);
        --zg-photo-size: 108px;
        --zg-card-height: 116px;
      }

      #screen-battle .zg-hp-group {
        gap: 3px !important;
      }

      #screen-battle .zg-hp-bar {
        height: 12px !important;
      }

      #screen-battle .zg-commentary {
        padding: 4px 8px !important;
        font-size: 12px !important;
      }

      #screen-battle .zg-launch-row {
        gap: 8px !important;
      }

      #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
        padding: 7px 9px !important;
        gap: 3px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-meter {
        --zg-badge-size: 32px;
        --zg-shell-height: 20px;
      }

      #screen-battle[data-phase="battle"] .zg-battle-main,
      #screen-battle[data-phase="finished"] .zg-battle-main {
        --zg-photo-size: 100px;
        --zg-card-height: 108px;
      }
    }
  `;

  document.head.appendChild(style);
}

  function injectBattleFluidWidthOverride() {
  const old = document.getElementById("zg-battle-fluid-width-override");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-battle-fluid-width-override";

  style.textContent = `
    /*
     * =====================================================
     * ZELO Battle Final Safe Width Override
     *
     * Purpose:
     * - Fix right clipping
     * - Remove 100vw inner width calculation
     * - Keep arena / HP / commentary / launch row same width
     * - Make launch row fit narrow mobile screens
     * =====================================================
     */

    html,
    body {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
    }

    body[data-zg-screen="battle"] {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      background: #050b14 !important;
    }

    body[data-zg-screen="battle"] #zelo-liff-game,
    #screen-battle {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
    }

    /*
     * Parent controls side spacing.
     * Children use 100% only.
     */
    #screen-battle .zg-battle-main {
      --zg-main-x: clamp(12px, 4vw, 42px);
      --zg-content-width: 100%;
      --zg-arena-width: 100%;
      --zg-arena-height: min(44vh, 560px);

      /*
       * Default launch sizes.
       */
      --zg-photo-size: clamp(112px, 24vw, 150px);
      --zg-card-height: clamp(126px, 22vh, 150px);

      width: 100% !important;
      max-width: none !important;
      min-width: 0 !important;
      margin: 0 auto !important;
      padding-left: var(--zg-main-x) !important;
      padding-right: var(--zg-main-x) !important;
      box-sizing: border-box !important;
      align-items: stretch !important;
      overflow-x: hidden !important;
    }

    #screen-battle .zg-arena-wrap,
    #screen-battle .zg-battle-panel {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      margin-left: auto !important;
      margin-right: auto !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-battle-box {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: var(--zg-arena-height) !important;
      max-height: var(--zg-arena-height) !important;
      aspect-ratio: auto !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    /*
     * HP rows.
     * Fix 100% wrapping.
     */
    #screen-battle .zg-hp-group,
    #screen-battle .zg-commentary,
    #screen-battle .zg-launch-row {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-hp-row {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: 28px minmax(0, 1fr) 58px !important;
      gap: 8px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    #screen-battle .zg-hp-name {
      white-space: nowrap !important;
    }

    #screen-battle .zg-hp-text {
      width: 58px !important;
      min-width: 58px !important;
      max-width: 58px !important;
      text-align: right !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow: visible !important;
      box-sizing: border-box !important;
      font-size: 14px !important;
      line-height: 1 !important;
    }

    #screen-battle .zg-hp-bar {
      min-width: 0 !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    /*
     * Launch row.
     * The important part:
     * - left photo is responsive
     * - right card is minmax(0, 1fr)
     * - no child may exceed parent
     */
    #screen-battle .zg-launch-row {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      display: grid !important;
      grid-template-columns: var(--zg-photo-size) minmax(0, 1fr) !important;
      gap: clamp(8px, 2.4vw, 14px) !important;
      height: var(--zg-card-height) !important;
      min-height: var(--zg-card-height) !important;
      max-height: var(--zg-card-height) !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    #screen-battle .zg-launch-row > .zg-external-top-photo {
      width: var(--zg-photo-size) !important;
      min-width: 0 !important;
      max-width: var(--zg-photo-size) !important;
      height: var(--zg-photo-size) !important;
      min-height: var(--zg-photo-size) !important;
      max-height: var(--zg-photo-size) !important;
      aspect-ratio: 1 / 1 !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: var(--zg-card-height) !important;
      min-height: var(--zg-card-height) !important;
      max-height: var(--zg-card-height) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    #screen-battle .zg-launch-row > .zg-charge-layer > .zg-charge-card {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: var(--zg-card-height) !important;
      min-height: var(--zg-card-height) !important;
      max-height: var(--zg-card-height) !important;
      padding: clamp(7px, 1.4vh, 12px) clamp(8px, 2vw, 12px) !important;
      gap: clamp(3px, 0.8vh, 7px) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    /*
     * Charge text.
     */
    #screen-battle .zg-launch-row .zg-charge-title {
      font-size: clamp(13px, 1.9vh, 16px) !important;
      line-height: 1.1 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    #screen-battle .zg-launch-row .zg-charge-subtitle,
    #screen-battle .zg-launch-row .zg-charge-tip {
      font-size: clamp(9px, 1.35vh, 11px) !important;
      line-height: 1.15 !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /*
     * Energy meter must not push card out.
     */
    #screen-battle .zg-launch-row .zg-charge-meter {
      --zg-badge-size: clamp(36px, 5.4vh, 44px);
      --zg-shell-height: clamp(20px, 3.1vh, 26px);

      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: var(--zg-badge-size) !important;
      min-height: var(--zg-badge-size) !important;
      padding-left: calc(var(--zg-badge-size) + 4px) !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    #screen-battle .zg-launch-row .zg-charge-percent-badge {
      width: var(--zg-badge-size) !important;
      height: var(--zg-badge-size) !important;
      min-width: var(--zg-badge-size) !important;
      min-height: var(--zg-badge-size) !important;
      font-size: clamp(13px, 1.8vh, 15px) !important;
      white-space: nowrap !important;
    }

    #screen-battle .zg-launch-row .zg-energy-shell {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: var(--zg-shell-height) !important;
      min-height: var(--zg-shell-height) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    #screen-battle .zg-launch-row .zg-energy-cap {
      height: calc(var(--zg-shell-height) + 8px) !important;
    }

    #screen-battle .zg-launch-row .zg-charge-btn {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      min-height: clamp(30px, 4.2vh, 38px) !important;
      font-size: clamp(12px, 1.7vh, 14px) !important;
      box-sizing: border-box !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    /*
     * Medium screen.
     */
    @media (max-width: 900px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: clamp(12px, 4vw, 32px);
        --zg-arena-height: min(42vh, 520px);
        --zg-photo-size: clamp(108px, 25vw, 140px);
        --zg-card-height: clamp(122px, 21vh, 140px);
      }
    }

    /*
     * Phone.
     * Reduce side padding and photo size.
     */
    @media (max-width: 520px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: 16px;
        --zg-arena-height: min(40vh, 410px);
        --zg-photo-size: clamp(104px, 30vw, 128px);
        --zg-card-height: 128px;
      }

      #screen-battle .zg-hp-row {
        grid-template-columns: 24px minmax(0, 1fr) 56px !important;
        gap: 7px !important;
      }

      #screen-battle .zg-hp-text {
        width: 56px !important;
        min-width: 56px !important;
        max-width: 56px !important;
        font-size: 14px !important;
      }

      #screen-battle .zg-commentary {
        min-height: 52px !important;
        height: 52px !important;
        font-size: 14px !important;
      }

      #screen-battle .zg-launch-row {
        gap: 10px !important;
      }
    }

    /*
     * Narrow phone.
     */
    @media (max-width: 430px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: 12px;
        --zg-arena-height: min(39vh, 380px);
        --zg-photo-size: clamp(96px, 30vw, 116px);
        --zg-card-height: 124px;
      }

      #screen-battle .zg-launch-row {
        gap: 8px !important;
      }

      #screen-battle .zg-hp-row {
        grid-template-columns: 22px minmax(0, 1fr) 54px !important;
      }

      #screen-battle .zg-hp-text {
        width: 54px !important;
        min-width: 54px !important;
        max-width: 54px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-title {
        font-size: 13px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-subtitle,
      #screen-battle .zg-launch-row .zg-charge-tip {
        font-size: 9px !important;
      }
    }

    /*
     * Very narrow phone.
     */
    @media (max-width: 380px) {
      #screen-battle .zg-battle-main {
        --zg-main-x: 10px;
        --zg-arena-height: min(38vh, 350px);
        --zg-photo-size: 96px;
        --zg-card-height: 118px;
      }

      #screen-battle .zg-hp-row {
        grid-template-columns: 22px minmax(0, 1fr) 50px !important;
        gap: 6px !important;
      }

      #screen-battle .zg-hp-text {
        width: 50px !important;
        min-width: 50px !important;
        max-width: 50px !important;
        font-size: 13px !important;
      }

      #screen-battle .zg-commentary {
        min-height: 44px !important;
        height: 44px !important;
        font-size: 12px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-meter {
        --zg-badge-size: 34px;
        --zg-shell-height: 20px;
      }

      #screen-battle .zg-launch-row .zg-charge-btn {
        min-height: 30px !important;
        font-size: 12px !important;
      }
    }

    /*
     * Short viewport.
     */
    @media (max-height: 760px) {
      #screen-battle .zg-battle-main {
        --zg-arena-height: min(37vh, 360px);
        --zg-card-height: 118px;
      }
    }

    @media (max-height: 680px) {
      #screen-battle .zg-battle-main {
        --zg-arena-height: min(34vh, 330px);
        --zg-photo-size: 96px;
        --zg-card-height: 108px;
      }

      #screen-battle .zg-commentary {
        min-height: 40px !important;
        height: 40px !important;
      }

      #screen-battle .zg-launch-row .zg-charge-tip {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(style);
}


  /*
   * ---------------------------------------------------------
   * 04-3. Page Lifecycle Hooks
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
            ${escapeHtml(top.emoji)}
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
    title.textContent = "戰鬥進行中";
  }

  if (subtitle) {
    subtitle.textContent = "雙方陀螺正在碰撞，HP 歸零後會自動結算。";
  }

  if (tip) {
    tip.textContent = "請等待戰鬥結果";
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "戰鬥進行中";
    btn.style.setProperty("pointer-events", "none", "important");
    btn.style.setProperty("opacity", "0.65", "important");
  }
}

function injectFullScreenAppOverride() {
  const old = document.getElementById("zg-fullscreen-app-override");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "zg-fullscreen-app-override";

  style.textContent = `
    /*
     * =====================================================
     * ZELO Fullscreen App Override
     *
     * Purpose:
     * - Make game fill entire viewport
     * - Avoid Shopify theme container width limitation
     * - Apply to home / select / battle / result
     * =====================================================
     */

    html,
    body {
      width: 100% !important;
      min-width: 100% !important;
      max-width: none !important;
      min-height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      background: #090612 !important;
    }

    body[data-zg-screen] {
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;
      min-height: var(--zg-app-height, 100vh) !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: #090612 !important;
    }

    /*
     * Hide Shopify page layout influence while game is active.
     */
    body[data-zg-screen] main,
    body[data-zg-screen] .page-width,
    body[data-zg-screen] .shopify-section,
    body[data-zg-screen] .content-for-layout,
    body[data-zg-screen] #MainContent,
    body[data-zg-screen] .template-page,
    body[data-zg-screen] .page-container {
      max-width: none !important;
      width: 100% !important;
    }

    /*
     * Critical:
     * Fixed fullscreen root, independent from Shopify container width.
     */
    body[data-zg-screen] #zelo-liff-game {
      position: fixed !important;
      inset: 0 !important;
      left: 0 !important;
      top: 0 !important;
      right: 0 !important;
      bottom: 0 !important;

      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;

      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      max-height: var(--zg-app-height, 100vh) !important;

      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;

      overflow: hidden !important;
      background: #090612 !important;
      z-index: 999999 !important;
    }

    body[data-zg-screen] .zg-clean-root {
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;
      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      max-height: var(--zg-app-height, 100vh) !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    /*
     * Every game screen should be full viewport.
     */
    body[data-zg-screen] .zg-screen {
      width: 100vw !important;
      min-width: 100vw !important;
      max-width: 100vw !important;

      height: var(--zg-app-height, 100vh) !important;
      min-height: var(--zg-app-height, 100vh) !important;
      max-height: var(--zg-app-height, 100vh) !important;

      margin: 0 !important;
      padding-left: 0 !important;
      padding-right: 0 !important;
      box-sizing: border-box !important;

      overflow-x: hidden !important;
      background-size: cover !important;
      background-position: center center !important;
      background-repeat: no-repeat !important;
    }

    /*
     * Home fullscreen background.
     */
    #screen-start {
      background-image:
        radial-gradient(circle at 20% 20%, rgba(255,40,80,0.2), transparent 36%),
        radial-gradient(circle at 85% 15%, rgba(0,190,255,0.16), transparent 34%),
        linear-gradient(rgba(10, 8, 18, 0.16), rgba(10, 8, 18, 0.62)),
        var(--zg-home-bg-image) !important;

      background-size:
        cover,
        cover,
        cover,
        cover !important;

      background-position:
        center center,
        center center,
        center center,
        center center !important;

      background-repeat:
        no-repeat,
        no-repeat,
        no-repeat,
        no-repeat !important;

      background-color: #120914 !important;
    }

    /*
     * Select / battle / result background also fullscreen.
     */
    #screen-select,
    #screen-battle,
    #screen-result {
      background:
        radial-gradient(circle at 18% 12%, rgba(255,45,85,0.22), transparent 34%),
        radial-gradient(circle at 86% 10%, rgba(0,210,255,0.18), transparent 36%),
        linear-gradient(160deg, #120617 0%, #06111e 58%, #050711 100%) !important;

      background-size:
        cover,
        cover,
        cover !important;

      background-position:
        center center,
        center center,
        center center !important;

      background-repeat:
        no-repeat,
        no-repeat,
        no-repeat !important;
    }

    /*
     * Main content remains centered inside fullscreen.
     */
    body[data-zg-screen] .zg-main,
    body[data-zg-screen] .zg-bottom {
      width: 100% !important;
      max-width: 860px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      box-sizing: border-box !important;
    }

    /*
     * Battle main can still use its own responsive width rules.
     */
    body[data-zg-screen="battle"] .zg-battle-main {
      width: 100% !important;
      box-sizing: border-box !important;
    }
  `;

  document.head.appendChild(style);
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

    btn.addEventListener(
      "click",
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
    const percent = `${Math.round(p * 100)}%`;
    const text = `${Math.round(p * 100)}%`;

    if (layer) {
      layer.dataset.chargeGrade = grade;
    }

    if (badge) {
      badge.textContent = text;

      if (grade === "perfect") {
        badge.style.background =
          "radial-gradient(circle at 32% 28%, #ffffff, #ffe36a 52%, #d58a00 100%)";
        badge.style.color = "#5a3400";
      } else if (grade === "over") {
        badge.style.background =
          "radial-gradient(circle at 32% 28%, #ff98dd, #a53dff 52%, #32108e 100%)";
        badge.style.color = "#fff";
      } else if (grade === "good") {
        badge.style.background =
          "radial-gradient(circle at 32% 28%, #fff6a8, #ffbf20 52%, #b46100 100%)";
        badge.style.color = "#4a2500";
      } else {
        badge.style.background =
          "radial-gradient(circle at 32% 28%, #ff9ab7, #ff2d6f 48%, #9c1043 100%)";
        badge.style.color = "#fff";
      }
    }

    if (fill) {
      fill.style.width = percent;

      if (grade === "perfect") {
        fill.style.background =
          "linear-gradient(90deg, #00e5ff, #18ff7a, #fff35a, #ffffff, #ffd84a)";
        fill.style.boxShadow =
          "0 0 18px rgba(255,255,255,0.95), 0 0 34px rgba(255,220,70,0.9)";
      } else if (grade === "over") {
        fill.style.background =
          "linear-gradient(90deg, #ff3d7f, #b23dff, #4b27ff)";
        fill.style.boxShadow =
          "0 0 18px rgba(255,70,180,0.9), 0 0 34px rgba(90,60,255,0.86)";
      } else if (grade === "good") {
        fill.style.background =
          "linear-gradient(90deg, #00e5ff, #18ff7a, #fff35a, #ffb22e)";
        fill.style.boxShadow =
          "0 0 16px rgba(255,210,70,0.75)";
      } else {
        fill.style.background =
          "linear-gradient(90deg, #00e5ff, #18ff7a, #45ff9a)";
        fill.style.boxShadow =
          "0 0 16px rgba(0,245,255,0.75)";
      }
    }

    if (glow) {
      glow.style.width = percent;
    }

    if (cap) {
      cap.style.left = percent;
      cap.style.opacity = p > 0.02 ? "1" : "0.65";
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

    if (!b) {
      if (pFill) pFill.style.width = "100%";
      if (eFill) eFill.style.width = "100%";
      if (pText) pText.textContent = "100%";
      if (eText) eText.textContent = "100%";
      return;
    }

    const pRatio = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const eRatio = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    if (pFill) pFill.style.width = `${pRatio * 100}%`;
    if (eFill) eFill.style.width = `${eRatio * 100}%`;

    if (pText) pText.textContent = `${Math.ceil(pRatio * 100)}%`;
    if (eText) eText.textContent = `${Math.ceil(eRatio * 100)}%`;
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
    if (!box) return null;

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

    if (!box) {
      return {
        w: 360,
        h: 360,
        cx: 180,
        cy: 180,
        left: PHY.radius + 8,
        right: 360 - PHY.radius - 8,
        top: PHY.radius + 8,
        bottom: 360 - PHY.radius - 8,
        xtremeX: 180,
        xtremeY: 180,
        xtremeR: 50
      };
    }

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
   * ---------------------------------------------------------
   * 08-2. Battle Body / 陀螺物件建立
   * ---------------------------------------------------------
   */

  function createBody(top, side, arena) {
    const feel = getFeel(top);

    const startX = side === "player" ? arena.w * 0.25 : arena.w * 0.75;
    const startY = side === "player" ? arena.h * 0.62 : arena.h * 0.38;

    const launchAngle =
      side === "player"
        ? rand(-0.72, 0.12)
        : Math.PI + rand(-0.12, 0.72);

    const baseSpeed =
      PHY.initialSpeed *
      feel.launchKick *
      (0.9 + top.speed / 220);

    const maxHp =
      56 +
      top.defense * 0.14 +
      top.stamina * 0.14;

    return {
      top,
      side,
      el: null,

      x: clamp(startX, arena.left, arena.right),
      y: clamp(startY, arena.top, arena.bottom),

      vx: Math.cos(launchAngle) * baseSpeed,
      vy: Math.sin(launchAngle) * baseSpeed,

      radius: PHY.radius,
      mass: feel.stability,

      hp: maxHp,
      maxHp,

      spin: 1,
      spinRatio: 1,

      angle: 0,
      angularSpeed: 32 + top.speed * 0.18,

      damageMul: top.type === "attack" ? 1.22 : 1,
      damageTakenMul: top.type === "defense" ? 0.76 : 1,
      spinDecayMul: top.type === "stamina" ? 0.76 : 1,
      frictionMul: feel.friction,
      restitutionMul:
        top.type === "defense"
          ? 0.84
          : top.type === "attack"
            ? 1.16
            : 1,

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

  function playLaunchSequence(power = 0.72) {
    const b = state.battle;
    if (!b) return;

    const grade = getLaunchGrade(power);
    const box = battleBox();

    Sound.resume();
    Sound.launch();

    if (box) {
      restartClass(
        box,
        grade === "perfect" ? "zg-killcam" : "zg-launch-impact",
        grade === "perfect" ? 850 : 700
      );
    }

    shockwave(b.player.x, b.player.y);

    setTimeout(() => {
      if (!state.battle || state.finishing) return;
      shockwave(b.enemy.x, b.enemy.y);
    }, 90);

    afterimage(b.player.x, b.player.y, grade === "perfect" ? 120 : 92);
    afterimage(b.enemy.x, b.enemy.y, 92);

    if (grade === "perfect") {
      metalSparks(b.player.x, b.player.y, 14, 1.25);
      flash();
      setCommentary("完美發射！你的陀螺帶著爆發轉速衝入競技場！");
    } else if (grade === "good") {
      metalSparks(b.player.x, b.player.y, 10, 1);
      setCommentary("強力發射！初速與轉速都很穩定！");
    } else if (grade === "over") {
      metalSparks(b.player.x, b.player.y, 9, 0.95);
      flash();
      setCommentary("過充發射！力量很高，但穩定性下降！");
    } else if (grade === "weak") {
      setCommentary("發射偏弱！但還有機會靠碰撞逆轉！");
    } else {
      setCommentary("穩定發射！兩顆陀螺高速進場！");
    }

    Sound.startHum(0, getFeel(b.player.top).humBase);
    Sound.startHum(1, getFeel(b.enemy.top).humBase);
  }


  /*
   * ---------------------------------------------------------
   * 08-3. Battle FX / 戰鬥特效
   * ---------------------------------------------------------
   */

  function flash() {
    const overlay = $(".zg-flash-overlay", battleBox() || document);
    if (!overlay) return;

    restartClass(overlay, "hit", PERF.lowFx ? 140 : 200);
  }

  function makeSimpleFx(className, x, y, duration = 460, size = 18) {
    if (!canFx()) return;

    const box = battleBox();
    if (!box) return;

    const el = document.createElement("i");

    el.className = className;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    fxAdd();
    box.appendChild(el);

    try {
      el.animate(
        [
          {
            opacity: 0.9,
            transform: "translate(-50%, -50%) scale(0.35)"
          },
          {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(3)"
          }
        ],
        {
          duration,
          easing: "ease-out"
        }
      ).onfinish = () => {
        el.remove();
        fxRemove();
      };
    } catch (error) {
      setTimeout(() => {
        el.remove();
        fxRemove();
      }, duration);
    }
  }

  function spark(x, y) {
    makeSimpleFx("zg-spark", x, y, PERF.lowFx ? 300 : 420, 16);
  }

  function impactRing(x, y) {
    makeSimpleFx("zg-impact-ring", x, y, PERF.lowFx ? 320 : 460, 24);
  }

  function metalSparks(x, y, count = 14, intensity = 1) {
    if (!canFx(28)) return;

    const box = battleBox();
    if (!box) return;

    const safeIntensity = clamp(intensity, 0.45, PERF.lowFx ? 1.25 : 2.1);
    const cappedBase = Math.min(count, PERF.lowFx ? 3 : PERF.maxSparksPerHit);
    const n = fxCount(cappedBase, safeIntensity);

    for (let i = 0; i < n; i += 1) {
      const sparkEl = document.createElement("i");

      sparkEl.className = `zg-metal-spark ${safeIntensity > 1.2 ? "intense" : ""}`;
      sparkEl.style.left = `${x + rand(-8, 8)}px`;
      sparkEl.style.top = `${y + rand(-8, 8)}px`;
      sparkEl.style.setProperty("--r", `${Math.random() * 360}deg`);

      fxAdd();
      box.appendChild(sparkEl);

      try {
        sparkEl.animate(
          [
            {
              opacity: 1,
              transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg) scale(1)`
            },
            {
              opacity: 0,
              transform: `translate(${rand(-60, 60)}px, ${rand(-60, 60)}px) rotate(${Math.random() * 720}deg) scale(0.3)`
            }
          ],
          {
            duration: PERF.lowFx ? 360 : 480,
            easing: "ease-out"
          }
        ).onfinish = () => {
          sparkEl.remove();
          fxRemove();
        };
      } catch (error) {
        setTimeout(() => {
          sparkEl.remove();
          fxRemove();
        }, PERF.lowFx ? 360 : 480);
      }
    }
  }

  function scratch(x, y, vx, vy, wobble = false) {
    const t = now();

    if (t - PERF.lastScratchAt < PERF.minScratchGap) return;
    if (PERF.lowFx && Math.random() < 0.65) return;

    PERF.lastScratchAt = t;

    const box = battleBox();
    if (!box) return;

    const scratchEl = document.createElement("i");

    scratchEl.className = `zg-scratch ${wobble ? "wobble" : ""}`;
    scratchEl.style.left = `${x}px`;
    scratchEl.style.top = `${y}px`;

    const angle = Math.atan2(vy, vx) * 180 / Math.PI;

    scratchEl.style.width = "34px";
    scratchEl.style.height = "3px";
    scratchEl.style.background = "rgba(255,255,255,0.45)";
    scratchEl.style.position = "absolute";
    scratchEl.style.borderRadius = "999px";
    scratchEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    scratchEl.style.zIndex = "22";

    fxAdd();
    box.appendChild(scratchEl);

    try {
      scratchEl.animate(
        [
          { opacity: 0.7 },
          { opacity: 0 }
        ],
        {
          duration: wobble ? 760 : 620,
          easing: "ease-out"
        }
      ).onfinish = () => {
        scratchEl.remove();
        fxRemove();
      };
    } catch (error) {
      setTimeout(() => {
        scratchEl.remove();
        fxRemove();
      }, wobble ? 760 : 620);
    }
  }

  function shockwave(x, y) {
    const t = now();

    if (t - PERF.lastShockwaveAt < PERF.minShockwaveGap) return;

    PERF.lastShockwaveAt = t;

    makeSimpleFx("zg-launch-shockwave", x, y, PERF.lowFx ? 520 : 760, 34);
  }

  function afterimage(x, y, size = 88) {
    const t = now();

    if (t - PERF.lastAfterimageAt < PERF.minAfterimageGap) return;
    if (PERF.lowFx && Math.random() < 0.55) return;

    PERF.lastAfterimageAt = t;

    const box = battleBox();
    if (!box) return;

    const el = document.createElement("div");

    el.className = "zg-spin-afterimage";
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "999px";
    el.style.transform = "translate(-50%, -50%)";
    el.style.background =
      "radial-gradient(circle, rgba(255,255,255,0.35), rgba(255,80,80,0.12), transparent 68%)";
    el.style.zIndex = "18";

    fxAdd();
    box.appendChild(el);

    try {
      el.animate(
        [
          { opacity: 0.75, transform: "translate(-50%, -50%) scale(0.7)" },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1.5)" }
        ],
        {
          duration: PERF.lowFx ? 420 : 680,
          easing: "ease-out"
        }
      ).onfinish = () => {
        el.remove();
        fxRemove();
      };
    } catch (error) {
      setTimeout(() => {
        el.remove();
        fxRemove();
      }, PERF.lowFx ? 420 : 680);
    }
  }

  function impactStreak(body) {
    if (!body || body.dead) return;
    if (PERF.lowFx && Math.random() < 0.5) return;

    const speed = Math.hypot(body.vx, body.vy);

    if (speed < 4.2) return;
    if (!canFx(50)) return;

    const box = battleBox();
    if (!box) return;

    const el = document.createElement("div");
    const angle = Math.atan2(body.vy, body.vx) * 180 / Math.PI;

    el.className =
      `zg-impact-streak ${body.side === "player" ? "zg-impact-blue" : "zg-impact-red"}`;

    el.style.position = "absolute";
    el.style.left = `${body.x}px`;
    el.style.top = `${body.y}px`;
    el.style.width = `${clamp(speed * 10, 38, 96)}px`;
    el.style.height = "4px";
    el.style.borderRadius = "999px";
    el.style.background =
      body.side === "player"
        ? "linear-gradient(90deg, rgba(57,245,255,0), rgba(57,245,255,0.75))"
        : "linear-gradient(90deg, rgba(255,56,56,0), rgba(255,56,56,0.75))";
    el.style.transform = `rotate(${angle + 180}deg)`;
    el.style.zIndex = "19";

    fxAdd();
    box.appendChild(el);

    try {
      el.animate(
        [
          { opacity: 0.8 },
          { opacity: 0 }
        ],
        {
          duration: PERF.lowFx ? 300 : 460,
          easing: "ease-out"
        }
      ).onfinish = () => {
        el.remove();
        fxRemove();
      };
    } catch (error) {
      setTimeout(() => {
        el.remove();
        fxRemove();
      }, PERF.lowFx ? 300 : 460);
    }
  }

  function burstPieces(x, y, count = 12) {
    const box = battleBox();
    if (!box) return;

    const n = PERF.lowFx ? Math.min(count, 8) : count;

    for (let i = 0; i < n; i += 1) {
      if (PERF.activeFx > PERF.maxFx) break;

      const piece = document.createElement("i");

      piece.className = "zg-burst-piece";
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 100;

      fxAdd();
      box.appendChild(piece);

      try {
        piece.animate(
          [
            {
              opacity: 1,
              transform: "translate(-50%, -50%) rotate(0deg)"
            },
            {
              opacity: 0,
              transform:
                `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${rand(180, 720)}deg)`
            }
          ],
          {
            duration: 680,
            easing: "ease-out"
          }
        ).onfinish = () => {
          piece.remove();
          fxRemove();
        };
      } catch (error) {
        setTimeout(() => {
          piece.remove();
          fxRemove();
        }, 680);
      }
    }
  }

  function wallFlash(x, y, nx = 0, ny = 0, power = 1) {
    makeSimpleFx("zg-wall-flash", x, y, PERF.lowFx ? 300 : 420, 24 * clamp(power, 0.8, 1.6));
  }


  /*
   * ---------------------------------------------------------
   * 08-4. Physics / 物理運算
   * ---------------------------------------------------------
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

    let centerPull = nearWall ? PHY.seekForceMax * 2.15 : PHY.seekForceMax;

    const b = state.battle;

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

    const friction = Math.pow(PHY.friction, dt * body.frictionMul);

    body.vx *= friction;
    body.vy *= friction;

    const spinLoss = Math.pow(PHY.spinDecay, dt * body.spinDecayMul);

    body.spin *= spinLoss;
    body.spinRatio = clamp(body.spinRatio * spinLoss, 0, 1);

    if (body.hp < body.maxHp * 0.28) {
      body.spinRatio *= Math.pow(0.996, dt);
    }

    const speed = Math.hypot(body.vx, body.vy);

    if (speed < 0.04 && body.spinRatio > 0.02) {
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
      hit = true;
    } else if (body.x > arena.right) {
      body.x = arena.right;
      body.vx = -Math.abs(body.vx) * PHY.wallRestitution * body.restitutionMul;
      nx = -1;
      hit = true;
    }

    if (body.y < arena.top) {
      body.y = arena.top;
      body.vy = Math.abs(body.vy) * PHY.wallRestitution * body.restitutionMul;
      ny = 1;
      hit = true;
    } else if (body.y > arena.bottom) {
      body.y = arena.bottom;
      body.vy = -Math.abs(body.vy) * PHY.wallRestitution * body.restitutionMul;
      ny = -1;
      hit = true;
    }

    if (!hit) return;

    /*
     * 牆壁反彈不扣 HP。
     * 只消耗少量轉速。
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
      const box = battleBox();

      if (box) {
        restartClass(box, "zg-wall-rebound-box", 260);
      }

      Sound.rail(power);

      if (!PERF.lowFx) {
        shockwave(body.x, body.y);
      }
    } else if (speed > 3.2 && Math.random() < 0.35) {
      Sound.grind(0.45);
    }
  }

  function getBodyKineticEnergy(body) {
    if (!body || body.dead) return 0;

    const speedSq = body.vx * body.vx + body.vy * body.vy;
    const linearEnergy = 0.5 * body.mass * speedSq;

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

    const energyDamage = safeEnergy * PHY.energyDamageScale;
    const speedDamage = Math.max(0, safeSpeed - 1.8) * 0.72;
    const impulseDamage = Math.max(0, safeImpulse - 1.2) * 0.18;

    let damage = energyDamage + speedDamage + impulseDamage;

    if (safeEnergy < PHY.minCollisionEnergy && safeSpeed < 2.2) {
      damage *= 0.18;
    }

    if (safeSpeed > 8.5) damage *= 1.12;
    if (safeSpeed > 11.5) damage *= 1.22;

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

    const collisionNormalSpeed = deepOverlap
      ? Math.max(1.6, Math.abs(velAlongNormal))
      : -velAlongNormal;

    const impulse =
      (1 + PHY.hitRestitution) *
      collisionNormalSpeed /
      (invMassA + invMassB);

    const impulseX = impulse * nx;
    const impulseY = impulse * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;
    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;

    const tx = -ny;
    const ty = nx;

    const tangentRelative = rvx * tx + rvy * ty;
    const tangentImpulse = tangentRelative * PHY.tangentTransfer;

    a.vx += tx * tangentImpulse * invMassA;
    a.vy += ty * tangentImpulse * invMassA;
    b.vx -= tx * tangentImpulse * invMassB;
    b.vy -= ty * tangentImpulse * invMassB;

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


  /*
   * ---------------------------------------------------------
   * 08-5. Collision Damage / 碰撞扣血
   * ---------------------------------------------------------
   */

  function handleTopHit(a, b, hit) {
    if (!state.battle || state.finishing) return;
    if (!a || !b || !hit) return;

    const energyLost = Number(hit.energyLost || 0);
    const relativeSpeed = Number(hit.relativeSpeed || 0);
    const impulse = Number(hit.impulse || 0);

    if (energyLost < PHY.minCollisionEnergy && relativeSpeed < 1.15) {
      return;
    }

    const cx = hit.x;
    const cy = hit.y;

    const feelA = getFeel(a.top);
    const feelB = getFeel(b.top);

    const impactLevel = clamp(
      energyLost / 22 + relativeSpeed / 16,
      0.12,
      2
    );

    state.firstCollision = true;
    state.lastEffectiveHitAt = now();

    if (impactLevel > 0.22) spark(cx, cy);
    if (impactLevel > 0.45) impactRing(cx, cy);

    if (impactLevel > 0.7) {
      const sparkCount = impactLevel > 1.2 ? 6 : 4;

      metalSparks(
        cx,
        cy,
        sparkCount,
        impactLevel * (feelA.sparkMul + feelB.sparkMul) / 2
      );

      flash();
    }

    if (impactLevel > 1.05) {
      const box = battleBox();
      if (box) restartClass(box, "shake", 260);
    }

    Sound.metal(
      clamp(impactLevel, 0.3, 1.45),
      (feelA.hitSharpness + feelB.hitSharpness) / 2
    );

    const aStability =
      Math.max(0.45, a.mass * (0.75 + a.spinRatio * 0.55));

    const bStability =
      Math.max(0.45, b.mass * (0.75 + b.spinRatio * 0.55));

    const totalStability = aStability + bStability;

    const hitImpactMul = clamp(
      0.88 + relativeSpeed / 8.5 + energyLost / 38,
      0.9,
      2.35
    );

    const damagePool =
      energyToDamage(energyLost, relativeSpeed, impulse) *
      hitImpactMul *
      (state.damagePressure || 1);

    let damageToA = damagePool * (bStability / totalStability);
    let damageToB = damagePool * (aStability / totalStability);

    damageToB *= typeAdvantage(a.top.type, b.top.type);
    damageToA *= typeAdvantage(b.top.type, a.top.type);

    damageToB *= a.damageMul * b.damageTakenMul;
    damageToA *= b.damageMul * a.damageTakenMul;

    const aLowSpinVulnerability =
      1 + clamp(0.45 - a.spinRatio, 0, 0.45) * 1.35;

    const bLowSpinVulnerability =
      1 + clamp(0.45 - b.spinRatio, 0, 0.45) * 1.35;

    damageToA *= aLowSpinVulnerability;
    damageToB *= bLowSpinVulnerability;

    applyDamage(b, damageToB, a, hit);
    applyDamage(a, damageToA, b, hit);

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

    pulseHpBar(target.side);

    const energyLost = Number(hit?.energyLost || 0);
    const relativeSpeed = Number(hit?.relativeSpeed || 0);

    target.lastHitPower = relativeSpeed;
    target.lastHitBy = attacker.side;

    target.burstGauge +=
      safeDamage *
      (attacker.top.type === "attack" ? 1.18 : 0.88) *
      (1 + clamp(energyLost / 70, 0, 0.6));

    const hpRatio = target.hp / target.maxHp;

    if (hpRatio < 0.35) {
      target.spinRatio = clamp(
        target.spinRatio - safeDamage * 0.0025,
        0,
        1
      );
    }

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

      const dxt = loser.x - arena.xtremeX;
      const dyt = loser.y - arena.xtremeY;
      const xtremeDist = Math.hypot(dxt, dyt);

      if (xtremeDist < arena.xtremeR && power > 9.2) return "xtreme";
    }

    if (loser.burstGauge > loser.maxHp * 0.78 && power > 10.8) {
      return "burst";
    }

    return "spin";
  }

  function checkDeadAndFinish() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return;

    const playerDead = b.player.hp <= 0 || b.player.dead;
    const enemyDead = b.enemy.hp <= 0 || b.enemy.dead;

    if (!playerDead && !enemyDead) return;

    b.player.dead = playerDead;
    b.enemy.dead = enemyDead;

    let win = false;
    let loser = null;
    let winner = null;

    if (playerDead && enemyDead) {
      win =
        b.player.hp > b.enemy.hp ||
        (
          b.player.hp === b.enemy.hp &&
          b.player.spinRatio >= b.enemy.spinRatio
        );

      winner = win ? b.player : b.enemy;
      loser = win ? b.enemy : b.player;
    } else {
      win = !playerDead;
      winner = win ? b.player : b.enemy;
      loser = win ? b.enemy : b.player;
    }

    const finishType =
      loser.finishType ||
      chooseFinishType(loser, winner, loser.lastHitPower || 7);

    beginFinish(win, finishType, winner, loser);
  }


  /*
   * ---------------------------------------------------------
   * 08-6. Anti-Stuck / Pressure
   * ---------------------------------------------------------
   */

  function overtimePressure(dt) {
    /*
     * 規則要求：
     * - 不因時間到直接結束
     * - 但可在長時間僵持後增加碰撞傷害壓力
     * - 不做被動扣 HP
     */
    const b = state.battle;

    if (!b || b.ended || state.finishing || !state.running) return;

    const elapsed = now() - b.startedAt;

    if (elapsed < 6000) {
      state.damagePressure = 1;
      return;
    }

    const pressure = clamp((elapsed - 6000) / 16000, 0, 2.2);

    state.damagePressure = 1 + pressure;

    if (elapsed > 12000 && Math.random() < 0.012) {
      setCommentary("戰局僵持，下一次碰撞可能決定勝負！");
    }
  }

  function antiStuckBoost(dt) {
    const b = state.battle;

    if (!b || b.ended || state.finishing || !state.running) return;

    const t = now();

    if (!state.lastEffectiveHitAt) {
      state.lastEffectiveHitAt = t;
    }

    const player = b.player;
    const enemy = b.enemy;

    if (!player || !enemy || player.dead || enemy.dead) return;

    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;

    const rvx = enemy.vx - player.vx;
    const rvy = enemy.vy - player.vy;
    const relativeSpeed = Math.hypot(rvx, rvy);

    const playerSpeed = Math.hypot(player.vx, player.vy);
    const enemySpeed = Math.hypot(enemy.vx, enemy.vy);

    const minDist = player.radius + enemy.radius;

    const touching = dist < minDist + 8;
    const deeplyOverlapped = dist < minDist * 0.92;

    const stuckTouching =
      touching &&
      relativeSpeed < 2.0 &&
      playerSpeed < 3.8 &&
      enemySpeed < 3.8;

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

    const targetDist = minDist + 24;
    const overlap = Math.max(0, targetDist - dist);

    player.x -= nx * overlap * 0.5;
    player.y -= ny * overlap * 0.5;
    enemy.x += nx * overlap * 0.5;
    enemy.y += ny * overlap * 0.5;

    const boost = deeplyOverlapped ? 8.8 : stuckTouching ? 7.4 : 5.2;
    const tangentBoost = deeplyOverlapped ? 4.4 : 3.6;

    player.vx = (-nx * boost + tx * tangentBoost) * (0.85 + player.spinRatio * 0.4);
    player.vy = (-ny * boost + ty * tangentBoost) * (0.85 + player.spinRatio * 0.4);

    enemy.vx = (nx * boost - tx * tangentBoost) * (0.85 + enemy.spinRatio * 0.4);
    enemy.vy = (ny * boost - ty * tangentBoost) * (0.85 + enemy.spinRatio * 0.4);

    player.spinRatio = clamp(player.spinRatio + 0.012, 0, 1);
    enemy.spinRatio = clamp(enemy.spinRatio + 0.012, 0, 1);

    [player, enemy].forEach((body) => {
      const speed = Math.hypot(body.vx, body.vy);

      if (speed > PHY.maxSpeed) {
        const scale = PHY.maxSpeed / speed;
        body.vx *= scale;
        body.vy *= scale;
      }

      body.x = clamp(body.x, b.arena.left, b.arena.right);
      body.y = clamp(body.y, b.arena.top, b.arena.bottom);
    });

    setCommentary(
      deeplyOverlapped || stuckTouching
        ? "雙方卡位被打破，重新彈開交鋒！"
        : "戰局僵持，雙方再次加速碰撞！"
    );

    const mx = (player.x + enemy.x) / 2;
    const my = (player.y + enemy.y) / 2;

    shockwave(mx, my);

    if (!PERF.lowFx) {
      metalSparks(mx, my, 8, 1);
    }

    Sound.metal(0.7, 1.08);
  }


  /*
   * ---------------------------------------------------------
   * 08-7. Battle Feel / 音效與危險提示
   * ---------------------------------------------------------
   */

  function ensureDangerVignette() {
    const box = battleBox();
    if (!box) return null;

    let vignette = $(".zg-danger-vignette", box);

    if (!vignette) {
      vignette = document.createElement("div");
      vignette.className = "zg-danger-vignette";
      vignette.style.position = "absolute";
      vignette.style.inset = "0";
      vignette.style.zIndex = "45";
      vignette.style.background =
        "radial-gradient(circle, transparent 48%, rgba(255,0,40,0.24) 100%)";
      vignette.style.opacity = "0";
      vignette.style.transition = "opacity 180ms ease-out";
      vignette.style.pointerEvents = "none";
      box.appendChild(vignette);
    }

    return vignette;
  }

  function updateBattleFeel() {
    const b = state.battle;
    if (!b) return;

    const player = b.player;
    const enemy = b.enemy;

    Sound.updateHum(
      0,
      player.spinRatio,
      getFeel(player.top).humBase,
      getFeel(player.top).humGain
    );

    Sound.updateHum(
      1,
      enemy.spinRatio,
      getFeel(enemy.top).humBase,
      getFeel(enemy.top).humGain
    );

    const danger = ensureDangerVignette();

    if (danger) {
      const active =
        player.hp / player.maxHp < 0.22 ||
        enemy.hp / enemy.maxHp < 0.22 ||
        player.spinRatio < 0.18 ||
        enemy.spinRatio < 0.18;

      danger.style.opacity = active ? "1" : "0";
    }

    if (
      !state.finishing &&
      Math.random() < (PERF.lowFx ? 0.018 : 0.045)
    ) {
      const playerSpeed = Math.hypot(player.vx, player.vy);
      const enemySpeed = Math.hypot(enemy.vx, enemy.vy);

      if (playerSpeed > 1.6) {
        scratch(player.x, player.y, player.vx, player.vy, player.spinRatio < 0.22);
      }

      if (enemySpeed > 1.6) {
        scratch(enemy.x, enemy.y, enemy.vx, enemy.vy, enemy.spinRatio < 0.22);
      }
    }
  }


  /*
   * ---------------------------------------------------------
   * 08-8. Finish / 結束與結果建立
   * ---------------------------------------------------------
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

    if (box) {
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
    }

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

    renderBattleFinished();

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
        localStorage.setItem(
          STORAGE.lastResult,
          JSON.stringify(state.lastBattleResult)
        );
      } catch (error) {}

      showResult(state.pendingResult);
    }, 1450);
  }

  function buildResult(win, finishType, winner, loser) {
    const b = state.battle;
    const finishInfo = FINISH[finishType] || FINISH.spin;

    const oldScore = getMyScore();
    const delta = win ? 35 + finishInfo.points * 15 : -18;
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
    const suffix =
      safeString(userId).slice(-4).toUpperCase() ||
      Math.random().toString(36).slice(2, 6).toUpperCase();

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
   * ---------------------------------------------------------
   * 08-9. Battle Loop / 主迴圈
   * ---------------------------------------------------------
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
     * 僅檢查 HP 歸零。
     * 不以時間、轉速、中央決勝提前結束。
     */
    checkDeadAndFinish();

    updateBattleFeel();

    syncBody(b.player);
    syncBody(b.enemy);

    updateHpBars();

    impactStreak(b.player);
    impactStreak(b.enemy);

    state.raf = requestAnimationFrame(battleLoop);
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
        <div class="zg-result-card" id="zg-result-card">
          <div class="zg-rank">勝</div>

          <h2 class="zg-result-title">戰鬥結果</h2>

          <p class="zg-result-desc">
            對戰結束，正在整理成績。
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
              <span>發射</span>
              <b id="zg-result-launch">0%</b>
            </div>

            <div class="zg-result-stat">
              <span>剩餘次數</span>
              <b id="zg-result-plays">0</b>
            </div>
          </div>

          <div class="zg-coupon" id="zg-coupon-box">
            <div>本次獎勵</div>
            <div class="zg-coupon-code" id="zg-coupon-code">ZELO100</div>
            <div class="zg-coupon-note" id="zg-coupon-note">
              優惠碼請於購物結帳時使用。
            </div>
          </div>

          <div class="zg-rankbox">
            <div class="zg-rankbox-title">好友排行榜</div>
            <div id="zg-rank-list"></div>
          </div>
        </div>
      </main>

      <div class="zg-result-actions">
        <button
          class="zg-btn"
          data-zg-action="shop"
          type="button"
        >
          前往商店
        </button>

        <button
          class="zg-btn zg-btn-red"
          data-zg-action="retry"
          type="button"
        >
          再戰一場
        </button>
      </div>
    `;

    root.appendChild(section);
  }

  function showResult(result) {
    state.lastBattleResult = result;

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
    } catch (error) {}

    stopBattle();
    ensureResultDom(appRoot());
    renderResult(result);
    showScreen("result");
  }

  function renderResult(result) {
    if (!result) return;

    const rank = $(".zg-rank", screenResult() || document);
    const title = $(".zg-result-title", screenResult() || document);
    const desc = $(".zg-result-desc", screenResult() || document);
    const finish = $("#zg-result-finish");
    const score = $("#zg-result-score");
    const launch = $("#zg-result-launch");
    const plays = $("#zg-result-plays");
    const couponCode = $("#zg-coupon-code");
    const couponNote = $("#zg-coupon-note");

    const win = !!result.win;

    if (rank) {
      rank.textContent = win ? "勝" : "敗";
      rank.classList.toggle("lose", !win);
    }

    if (title) {
      title.textContent = win ? "勝利！" : "敗北！";
    }

    if (desc) {
      desc.textContent = win
        ? `你以 ${result.finishLabel || "Spin Finish"} 擊敗 ${result.enemyName || "對手"}！`
        : `${result.enemyName || "對手"} 以 ${result.finishLabel || "Spin Finish"} 擊敗了你。`;
    }

    if (finish) {
      finish.textContent = result.finishLabel || "Spin Finish";
    }

    if (score) {
      const delta = Number(result.scoreDelta || 0);
      score.textContent = delta >= 0 ? `+${delta}` : String(delta);
      score.style.color = delta >= 0 ? "#39f5ff" : "#ff5a5a";
    }

    if (launch) {
      launch.textContent = `${Math.round((result.launchPower || 0) * 100)}%`;
    }

    if (plays) {
      const rem =
        result.remainingPlays !== undefined
          ? result.remainingPlays
          : loadDailyLimit().remainingPlays;

      plays.textContent = `${rem}/${DAILY_LIMIT}`;
    }

    if (couponCode) {
      couponCode.textContent =
        result.coupon?.code ||
        state.lastCouponReward?.code ||
        "ZELO100";
    }

    if (couponNote) {
      couponNote.textContent =
        result.coupon?.label
          ? `${result.coupon.label}，請於購物結帳時使用。`
          : "優惠碼請於購物結帳時使用。";
    }

    renderRankList(result);

    trackResultOnce(result);
  }

  function renderRankList(result) {
    const box = $("#zg-rank-list");
    if (!box) return;

    const myName = getPlayerName();
    const myScore = Number(result?.newScore || getMyScore());

    let friends = [];

    try {
      friends = safeParse(localStorage.getItem(STORAGE.friends), []);
    } catch (error) {
      friends = [];
    }

    if (!Array.isArray(friends) || friends.length < 4) {
      friends = [
        {
          name: "阿凱",
          score: 1380
        },
        {
          name: "Mika",
          score: 1320
        },
        {
          name: "小宇",
          score: 1260
        },
        {
          name: "Nina",
          score: 1180
        }
      ];
    }

    const rows = [
      ...friends,
      {
        name: myName,
        score: myScore,
        me: true
      }
    ]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 6);

    box.innerHTML = rows.map((row, index) => `
      <div class="zg-rank-row ${row.me ? "me" : ""}">
        <strong>#${index + 1}</strong>
        <span class="zg-rank-name">${escapeHtml(row.name || "玩家")}</span>
        <b>${Math.round(Number(row.score || 0))}</b>
      </div>
    `).join("");
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
      source: "result",
      remainingPlays: state.remainingPlays
    });

    showScreen("select");
  }

  function handleShop() {
    track("shop_click", {
      source: state.screen || "unknown",
      couponCode:
        state.lastBattleResult?.coupon?.code ||
        state.lastCouponReward?.code ||
        ""
    });

    location.href = SHOP_URL;
  }


  /*
   * =========================================================
   * 10. TRACKING / Dashboard 事件追蹤
   * =========================================================
   */

  function getTrackingBasePayload() {
    const profile = getProfile() || {};
    const userId = getUserId();

    return {
      version: VERSION,
      screen: state.screen || "",
      userId,
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
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      url: location.href,
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString()
    };
  }

  function sendToDashboard(eventName, payload) {
    const body = {
      event: eventName,
      ...payload
    };

    /*
     * 1. Google Apps Script / dashboard endpoint
     */
    if (GOOGLE_SCRIPT_URL) {
      try {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body),
          keepalive: true
        }).catch(() => {});
      } catch (error) {}
    }

    /*
     * 2. 自訂外部追蹤 hook
     */
    try {
      if (typeof window.ZELO_TRACK === "function") {
        window.ZELO_TRACK(eventName, body);
      }
    } catch (error) {}

    /*
     * 3. dataLayer
     */
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: `zelo_${eventName}`,
        ...body
      });
    } catch (error) {}

    /*
     * 4. Debug log
     */
    try {
      if (window.ZELO_DEBUG) {
        console.log("[ZELO_TRACK]", eventName, body);
      }
    } catch (error) {}
  }

  function track(eventName, extra = {}) {
    const payload = {
      ...getTrackingBasePayload(),
      ...extra
    };

    sendToDashboard(eventName, payload);
  }

  function trackResultOnce(result) {
    if (!result || state.resultLogged) return;

    state.resultLogged = true;

    track("result", {
      result: result.result || (result.win ? "win" : "lose"),
      win: !!result.win,
      finishType: result.finishType || "",
      finishLabel: result.finishLabel || "",
      points: result.points || 0,

      scoreOld: result.oldScore || 0,
      scoreNew: result.newScore || 0,
      scoreDelta: result.scoreDelta || 0,

      couponId: result.coupon?.id || "",
      couponLabel: result.coupon?.label || "",
      couponAmount: result.coupon?.amount || 0,
      couponCode: result.coupon?.code || "",

      topId: result.topId || "",
      topName: result.topName || "",
      topType: result.topType || "",

      enemyId: result.enemyId || "",
      enemyName: result.enemyName || "",
      enemyType: result.enemyType || "",

      playerHp: result.playerHp || 0,
      enemyHp: result.enemyHp || 0,
      playerHpMax: result.playerHpMax || 0,
      enemyHpMax: result.enemyHpMax || 0,

      playerSpin: result.playerSpin || 0,
      enemySpin: result.enemySpin || 0,

      elapsed: result.elapsed || 0,
      launchPower: result.launchPower || 0,
      launchGrade: result.launchGrade || "",

      playsUsed: result.playsUsed,
      remainingPlays: result.remainingPlays
    });
  }


  /*
   * =========================================================
   * 11. EVENTS / 全域事件綁定
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
      track("back_home", {
        source: state.screen || "unknown"
      });

      showScreen("start");
      return;
    }

    if (action === "select") {
      handleChangeTop();
      return;
    }

    if (action === "battle") {
      beginChargeBattle();
      return;
    }

    if (action === "retry") {
      handleRetry();
      return;
    }

    if (action === "shop") {
      handleShop();
      return;
    }
  }

  function bindGlobalEvents() {
    if (state.eventsBound) return;

    state.eventsBound = true;

    document.addEventListener(
      "click",
      (event) => {
        const card = event.target.closest(".zg-top-card");

        if (card) {
          event.preventDefault();
          event.stopPropagation();

          const id =
            card.getAttribute("data-id") ||
            card.getAttribute("data-top-id");

          if (id) {
            Sound.resume();
            selectTop(id, true);
          }

          return;
        }

        const actionEl = event.target.closest("[data-zg-action]");

        if (actionEl) {
          event.preventDefault();
          event.stopPropagation();

          handleAction(actionEl.getAttribute("data-zg-action"), actionEl);
        }
      },
      true
    );

    /*
     * 空白鍵：在 battle 發射準備階段可按住蓄力、放開發射。
     */
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.code !== "Space") return;
        if (event.repeat) return;
        if (state.screen !== "battle") return;
        if (state.running || state.battle || state.finishing) return;

        event.preventDefault();
        Sound.resume();
        startCharging();
      },
      true
    );

    document.addEventListener(
      "keyup",
      (event) => {
        if (event.code !== "Space") return;
        if (state.screen !== "battle") return;
        if (!state.charging) return;

        event.preventDefault();
        releaseCharging();
      },
      true
    );

    window.addEventListener("pagehide", () => {
      try {
        track("pagehide", {
          source: state.screen || "unknown"
        });
      } catch (error) {}

      Sound.stopHum();
    });

    window.addEventListener("beforeunload", () => {
      Sound.stopHum();
    });
  }


  /*
   * =========================================================
   * 12. INIT / 啟動
   * =========================================================
   */

function loadInitialContext() {
  state.selectedTop = loadSelectedTop();

  try {
    const savedProfile = localStorage.getItem(STORAGE.profile);

    if (savedProfile) {
      state.profile = JSON.parse(savedProfile);
    }
  } catch (error) {}

  state.inviterId =
    getUrlParam("inviterId") ||
    getUrlParam("ref") ||
    getUrlParam("uid") ||
    "";

  state.inviterName =
    getUrlParam("inviterName") ||
    getUrlParam("refName") ||
    "";

  loadDailyLimit();
}

function boot() {
  if (state.booted) return;

  state.booted = true;

  hardResetGamePage();
  ensureAppHeight();

  injectStyles();
  injectBattleLayoutOverride();
  injectBattleFluidWidthOverride();
  injectFullScreenAppOverride();

  loadInitialContext();
  ensureBasicDom();
  bindGlobalEvents();
  watchMenuDom();

  showScreen("start");

  track("boot", {
    selectedTopId: state.selectedTop?.id || "",
    selectedTopName: state.selectedTop?.name || "",
    selectedTopType: state.selectedTop?.type || "",
    playsUsed: state.playsUsed,
    remainingPlays: state.remainingPlays
  });

  try {
    console.log(`[ZELO_GAME] loaded ${VERSION}`);
  } catch (error) {}
}


  /*
   * ---------------------------------------------------------
   * Debug API
   * ---------------------------------------------------------
   */

    window.ZELO_GAME = {
    version: VERSION,

    state,

    boot,
    showScreen,

    startBattle,
    beginChargeBattle,
    startBattleWithPower,
    stopBattle,

    selectTop,

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

    getDailyLimit() {
      return loadDailyLimit();
    },

    clear() {
      hardResetGamePage();
      state.booted = false;
      boot();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
