/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607131014-structured-pages
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
 * - 改過的內容以完整段落輸出
 * - JS 依頁面流程分段整理
 * - 保留目前美術 class
 * - 保留蓄力發射
 * - 保留戰鬥物理
 * - 保留碰撞扣血規則
 * - 牆壁反彈不扣 HP
 * - 只有陀螺碰撞扣 HP
 * - HP 歸零即停止並判定敗北
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

  const VERSION = "202607131014-structured-pages";

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

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
    initialSpeed: 8.2,
    maxSpeed: 15.2,

    /*
     * Natural Decay
     * 數值越接近 1，陀螺越不容易自然停下。
     */
    friction: 0.9935,
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
     * 以動能消耗作為扣血核心。
     */
    energyDamageScale: 0.34,
    spinDamageScale: 0.018,
    minCollisionEnergy: 1.15,
    maxCollisionDamage: 18,

    /*
     * Collision Control
     */
    collisionCooldown: 96,
    separationBias: 0.8,
    tangentTransfer: 0.035,

    /*
     * Arena Forces
     */
    seekForceMax: 0.046,
    tangentForce: 0.033,

    battleLimit: 9000,
    minMotion: 0.7,

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

    lastCouponReward: null,
    lastBattleResult: null,

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    resultLogged: false,

    eventsBound: false,
    booted: false
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

  function allScreens() {
    return [screenStart(), screenSelect(), screenBattle(), screenResult()].filter(Boolean);
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

    const map = {
      start: screenStart(),
      home: screenStart(),
      select: screenSelect(),
      battle: screenBattle(),
      result: screenResult()
    };

    const target = map[name] || screenStart();

    allScreens().forEach((screen) => {
      const active = screen === target;

      screen.classList.toggle("active", active);
      screen.classList.toggle("is-active", active);

      screen.hidden = !active;
      screen.style.display = active ? "flex" : "none";
      screen.setAttribute("aria-hidden", active ? "false" : "true");
    });

    document.body.setAttribute("data-zg-screen", name);

    removeMenuDom();
    removeLogoDom();

    if (name === "start") {
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

    ensureHomeDom(root);
    ensureSelectDom(root);
    ensureBattleDom(root);
    ensureResultDom(root);

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
    if ($("#zg-bg-style")) return;

    const style = document.createElement("style");
    style.id = "zg-bg-style";

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
        overflow-x: hidden !important;
      }

      #screen-result {
  overflow-y: auto !important;
  overflow-x: hidden !important;
  -webkit-overflow-scrolling: touch !important;
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

  function injectVisualEnhancements() {
    injectBackgroundStyles();
    removeMenuDom();
    removeLogoDom();

    const root = appRoot();

    if (!$(".zg-energy-grid", root)) {
      const grid = document.createElement("div");
      grid.className = "zg-energy-grid";
      grid.setAttribute("aria-hidden", "true");
      root.prepend(grid);
    }

    ensureHomeVisualFx();
    ensureBattleVisualDom();

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
      </main>

      <div class="zg-bottom">
        <button class="zg-btn zg-btn-red" data-zg-action="start" type="button">
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

      for (let i = 0; i < 12; i++) {
        const star = document.createElement("i");
        star.className = "zg-star";
        layer.appendChild(star);
      }

      start.prepend(layer);
    }
  }

  function onHomeShown() {
    stopBattle();
    cancelChargeLoop();
    showChargeLayer(false);
    removeMenuDom();
    removeLogoDom();
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
    showChargeLayer(false);

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

  function ensureChargeDom() {
    const battle = screenBattle();
    if (!battle) return null;

    let layer = $(".zg-charge-layer", battle);

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "zg-charge-layer";
      layer.hidden = true;

      layer.innerHTML = `
        <div class="zg-charge-card">
          <div class="zg-charge-top-preview">
            <span>🌀</span>
          </div>

          <div class="zg-charge-rope"></div>

          <div class="zg-charge-title">
            拉繩蓄力
          </div>

          <div class="zg-charge-subtitle">
            按住蓄力，放開發射！
          </div>

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
    const preview = $(".zg-charge-top-preview", layer);
    const icon = $(".zg-charge-top-preview span", layer);

    if (preview && top) {
      preview.style.setProperty("--c1", top.colorA);
      preview.style.setProperty("--c2", top.colorB);
    }

    if (icon && top) {
      icon.textContent = top.emoji || "🌀";
    }

    layer.classList.toggle("active", !!show);
    layer.hidden = !show;
  }

  function setChargePower(value) {
    state.launchPower = clamp(value, 0, 1);

    const layer = $(".zg-charge-layer");
    if (!layer) return;

    const fill = $(".zg-charge-fill", layer);
    const marker = $(".zg-charge-marker", layer);
    const btn = $(".zg-charge-btn", layer);

    if (fill) {
      fill.style.width = `${state.launchPower * 100}%`;
    }

    if (marker) {
      marker.style.left = `${state.launchPower * 100}%`;
    }

    const perfect = state.launchPower >= 0.78 && state.launchPower <= 0.92;
    const good = state.launchPower >= 0.6 && state.launchPower < 0.78;

    layer.classList.toggle("perfect", perfect);
    layer.classList.toggle("good", good);

    if (btn) {
      if (perfect) {
        btn.textContent = "PERFECT！放開發射！";
      } else if (good) {
        btn.textContent = "很好！放開發射！";
      } else {
        btn.textContent = state.charging ? "蓄力中…放開發射" : "按住蓄力";
      }
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

    state.resultLogged = false;

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

    showScreen("battle");
    clearBattleObjects();
    updateHpBars();

    setCommentary("準備拉繩，按住按鈕蓄力！");

    showChargeLayer(true);
    setChargePower(0);

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

    const power = state.launchPower;

    cancelChargeLoop();
    showChargeLayer(false);

    const grade = getLaunchGrade(power);

    track("launch_release", {
      power: Number(power.toFixed(3)),
      grade,
      topId: state.selectedTop?.id || "",
      topName: state.selectedTop?.name || "",
      enemyId: state.enemyTop?.id || "",
      enemyName: state.enemyTop?.name || ""
    });

    startBattleWithPower(power);
  }

  function getLaunchGrade(power) {
    if (power >= 0.78 && power <= 0.92) return "perfect";
    if (power >= 0.6) return "good";
    if (power < 0.35) return "weak";
    return "normal";
  }

  function playLaunchSequence(power = 0.72) {
    const b = state.battle;
    if (!b) return;

    const perfect = power >= 0.78 && power <= 0.92;
    const good = power >= 0.6 && power < 0.78;
    const weak = power < 0.35;

    Sound.resume();
    Sound.launch();

    restartClass(
      battleBox(),
      perfect ? "zg-killcam" : "zg-launch-impact",
      perfect ? 850 : 700
    );

    shockwave(b.player.x, b.player.y);

    setTimeout(() => {
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
      setCommentary("漂亮發射！初速與轉速都很穩定！");
    } else if (weak) {
      setCommentary("發射偏弱！但還有機會靠碰撞逆轉！");
    } else {
      setCommentary("發射！兩顆陀螺高速進場！");
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
    showChargeLayer(false);

    ensureBasicDom();
    injectVisualEnhancements();
    ensureBattleDom();

    state.selectedTop = state.selectedTop || loadSelectedTop();
    state.enemyTop = state.enemyTop || pickEnemyTop();

    showScreen("battle");
    clearBattleObjects();

    resetBattleFlowState();

    const arena = getArenaInfo();
    const player = createBody(state.selectedTop, "player", arena);
    const enemy = createBody(state.enemyTop, "enemy", arena);

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
      launchGrade: getLaunchGrade(powerNorm)
    };

    state.running = true;
    state.paused = false;
    state.lastFrame = 0;

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
      launchGrade: getLaunchGrade(powerNorm)
    });

    state.raf = requestAnimationFrame(battleLoop);
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

          <div class="zg-panel">
            <div class="zg-hp-row">
              <span>你</span>
              <div class="zg-hp-bar">
                <div id="zg-player-hp" class="zg-hp-fill"></div>
              </div>
              <b id="zg-player-hp-text">100%</b>
            </div>

            <div class="zg-hp-row">
              <span>敵</span>
              <div class="zg-hp-bar">
                <div id="zg-enemy-hp" class="zg-hp-fill"></div>
              </div>
              <b id="zg-enemy-hp-text">100%</b>
            </div>

            <div class="zg-commentary">
              準備發射！
            </div>
          </div>
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

    if (!$(".zg-arena-ring", box)) {
      const ring = document.createElement("div");
      ring.className = "zg-arena-ring";
      box.appendChild(ring);
    }

    if (!$(".zg-flash-overlay", box)) {
      const flash = document.createElement("div");
      flash.className = "zg-flash-overlay";
      box.appendChild(flash);
    }

    if (!$(".zg-xtreme-zone", box)) {
      const zone = document.createElement("div");
      zone.className = "zg-xtreme-zone";
      box.appendChild(zone);
    }

    if (!$(".zg-pocket-zone", box)) {
      ["p1", "p2", "p3", "p4"].forEach((cls) => {
        const pocket = document.createElement("div");
        pocket.className = `zg-pocket-zone ${cls}`;
        box.appendChild(pocket);
      });
    }

    ensureDangerVignette();
    removeDuplicateFlash();
  }

  function onBattleShown() {
    ensureBattleVisualDom();
    ensureChargeDom();
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

    el.className = `zg-battle-top ${side === "player" ? "zg-player-top" : "zg-enemy-top"} ${top.type}`;
    el.setAttribute("data-side", side);
    el.setAttribute("data-id", top.id);
    el.setAttribute("data-type", top.type);

    el.style.setProperty("--c1", top.colorA);
    el.style.setProperty("--c2", top.colorB);

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
      finishType: ""
    };
  }

  function syncBody(body) {
    if (!body || !body.el) return;

    body.angle += body.angularSpeed * body.spinRatio;

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

    if (!b) {
      const pFill =
        $("#zg-player-hp") ||
        $(".zg-player-hp .zg-hp-fill") ||
        $(".zg-player-hp-fill");

      const eFill =
        $("#zg-enemy-hp") ||
        $(".zg-enemy-hp .zg-hp-fill") ||
        $(".zg-enemy-hp-fill");

      const pt = $("#zg-player-hp-text");
      const et = $("#zg-enemy-hp-text");

      if (pFill) pFill.style.width = "100%";
      if (eFill) eFill.style.width = "100%";
      if (pt) pt.textContent = "100%";
      if (et) et.textContent = "100%";

      return;
    }

    const pr = clamp(b.player.hp / b.player.maxHp, 0, 1);
    const er = clamp(b.enemy.hp / b.enemy.maxHp, 0, 1);

    const pFill =
      $("#zg-player-hp") ||
      $(".zg-player-hp .zg-hp-fill") ||
      $(".zg-player-hp-fill");

    const eFill =
      $("#zg-enemy-hp") ||
      $(".zg-enemy-hp .zg-hp-fill") ||
      $(".zg-enemy-hp-fill");

    if (pFill) {
      pFill.style.width = `${pr * 100}%`;
      pFill.classList.toggle("zg-low-spin-warning", pr < 0.26);
    }

    if (eFill) {
      eFill.style.width = `${er * 100}%`;
      eFill.classList.toggle("zg-low-spin-warning", er < 0.26);
    }

    const pt = $("#zg-player-hp-text");
    const et = $("#zg-enemy-hp-text");

    if (pt) pt.textContent = `${Math.ceil(pr * 100)}%`;
    if (et) et.textContent = `${Math.ceil(er * 100)}%`;
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

     if (!state.finishing && !state.centerDuelStarted && Math.random() < (PERF.lowFx ? 0.018 : 0.045)) {
      const ps = Math.hypot(p.vx, p.vy);
      const es = Math.hypot(e.vx, e.vy);

      if (ps > 1.6) {
        scratch(p.x, p.y, p.vx, p.vy, p.spinRatio < 0.22);
      }

      if (es > 1.6) {
        scratch(e.x, e.y, e.vx, e.vy, e.spinRatio < 0.22);
      }
    }

    if (!state.finishing && !state.centerDuelStarted) {
      tryComeback(p);
      tryComeback(e);
    }
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
    const centerPull = nearWall ? PHY.seekForceMax * 2.15 : PHY.seekForceMax;
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

    body.spin *= 1 - PHY.railSpinLoss * body.frictionMul;
    body.spinRatio = clamp(body.spinRatio * (1 - PHY.railSpinLoss * body.frictionMul), 0, 1);

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
     * 如果正在分離，就不要重複施加傷害，只做位置修正。
     */
    if (velAlongNormal > 0) return;

    const tNow = now();

    if (tNow - a.lastHitAt < PHY.collisionCooldown || tNow - b.lastHitAt < PHY.collisionCooldown) {
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
    const impulse =
      -(1 + restitution) * velAlongNormal /
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

    if (energyLost < PHY.minCollisionEnergy && relativeSpeed < 2.2) {
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
      metalSparks(cx, cy, sparkCount, impactLevel * (fa.sparkMul + fb.sparkMul) / 2);
      flash();
    }

    if (impactLevel > 1.05) {
      restartClass(battleBox(), "shake", 260);
    }

    Sound.metal(clamp(impactLevel, 0.3, 1.45), (fa.hitSharpness + fb.hitSharpness) / 2);

    /*
     * 以碰撞能量損失計算雙方傷害。
     * 誰承受較大衝量、誰穩定度較差，誰扣比較多。
     */
    const aStability = Math.max(0.45, a.mass * (0.75 + a.spinRatio * 0.55));
    const bStability = Math.max(0.45, b.mass * (0.75 + b.spinRatio * 0.55));

    const totalStability = aStability + bStability;

    const damagePool = energyToDamage(energyLost, relativeSpeed, impulse);

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
     * 耐久型旋轉衰減較少。
     */
    damageToB *= a.damageMul * b.damageTakenMul;
    damageToA *= b.damageMul * a.damageTakenMul;

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

    const dxt =
      loser.x - (arena?.xtremeX || loser.x);

    const dyt =
      loser.y - (arena?.xtremeY || loser.y);

    const xtremeDist = Math.hypot(dxt, dyt);

    if (arena && xtremeDist < arena.xtremeR && power > 9.2) return "xtreme";

    if (loser.burstGauge > loser.maxHp * 0.78 && power > 10.8) return "burst";

    return "spin";
  }

  function checkDeadAndFinish() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return;

    const pDead = b.player.hp <= 0 || b.player.dead || b.player.spinRatio <= 0.035;
    const eDead = b.enemy.hp <= 0 || b.enemy.dead || b.enemy.spinRatio <= 0.035;

    if (pDead || eDead) {
      b.player.dead = pDead;
      b.enemy.dead = eDead;

      let win = false;
      let loser = null;
      let winner = null;

      if (pDead && eDead) {
        win = b.player.hp >= b.enemy.hp;
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

  /*
   * =========================================================
   * 08-4. Center Duel / 中央決勝
   * =========================================================
   */

  function maybeStartCenterDuel() {
    const b = state.battle;
    if (!b || b.ended || state.finishing || state.centerDuelStarted) return;

    const elapsed = now() - b.startedAt;

    if (elapsed < 5200) return;

    const pAlive = b.player.hp > 0 && b.player.spinRatio > 0.05;
    const eAlive = b.enemy.hp > 0 && b.enemy.spinRatio > 0.05;

    if (!pAlive || !eAlive) return;

    const pWeak = b.player.hp / b.player.maxHp < 0.34 || b.player.spinRatio < 0.32;
    const eWeak = b.enemy.hp / b.enemy.maxHp < 0.34 || b.enemy.spinRatio < 0.32;

    if (!pWeak && !eWeak && elapsed < PHY.battleLimit) return;

    state.centerDuelStarted = true;
    state.centerDuelStartedAt = now();

    battleBox().classList.add("zg-center-duel");
    setCommentary("雙方被場地吸向中央，進入最後決勝！");
    Sound.grind(1.1);

    track("center_duel", {
      elapsed: Math.round(elapsed),
      playerHp: Math.round(b.player.hp),
      enemyHp: Math.round(b.enemy.hp),
      playerSpin: Number(b.player.spinRatio.toFixed(3)),
      enemySpin: Number(b.enemy.spinRatio.toFixed(3))
    });
  }

  function updateCenterDuel(dt) {
    const b = state.battle;

    if (!b || !state.centerDuelStarted || state.centerDuelResolved) return;

    const elapsed = now() - state.centerDuelStartedAt;

    [b.player, b.enemy].forEach((body) => {
      if (body.dead) return;

      const dx = b.arena.cx - body.x;
      const dy = b.arena.cy - body.y;
      const d = Math.hypot(dx, dy) || 1;

      body.vx += (dx / d) * 0.16 * dt;
      body.vy += (dy / d) * 0.16 * dt;
      body.vx *= 0.992;
      body.vy *= 0.992;
      body.spinRatio *= Math.pow(0.996, dt);
    });

    if (elapsed > 1250) {
      state.centerDuelResolved = true;
      resolveDecisionFinish();
    }
  }

  function resolveDecisionFinish() {
    const b = state.battle;
    if (!b || b.ended || state.finishing) return;

    const pScore =
      b.player.hp / b.player.maxHp * 58 +
      b.player.spinRatio * 42 +
      b.player.top.stamina * 0.08;

    const eScore =
      b.enemy.hp / b.enemy.maxHp * 58 +
      b.enemy.spinRatio * 42 +
      b.enemy.top.stamina * 0.08;

    const win = pScore >= eScore;
    const winner = win ? b.player : b.enemy;
    const loser = win ? b.enemy : b.player;

    loser.dead = true;
    loser.hp = Math.max(0, loser.hp - 10);
    loser.spinRatio = 0;

    beginFinish(win, "spin", winner, loser);
  }

  /*
   * =========================================================
   * 08-5. Finish / 終結
   * =========================================================
   */

  function beginFinish(win, finishType, winner, loser) {
    const b = state.battle;

    if (!b || b.ended || state.finishing) return;

    state.finishing = true;
    state.finishStartedAt = now();

    b.finish = finishType || "spin";
    b.points = FINISH[b.finish]?.points || 1;
    b.ended = true;

    Sound.stopHum();

    const box = battleBox();

    box.classList.remove("zg-center-duel");

    const label = FINISH[b.finish]?.label || "Spin Finish";

    if (b.finish === "burst") {
      burstPieces(loser.x, loser.y, 16);
      restartClass(box, "zg-killcam", 850);
      Sound.death();
      setCommentary(`${label}！${win ? "你" : "對手"}打出爆裂終結！`);
    } else if (b.finish === "over") {
      restartClass(box, "zg-over-finish", 760);
      shockwave(loser.x, loser.y);
      Sound.rail(1.55);
      setCommentary(`${label}！${win ? "你" : "對手"}將對方撞出戰鬥區！`);
    } else if (b.finish === "xtreme") {
      restartClass(box, "zg-xtreme-finish", 820);
      shockwave(loser.x, loser.y);
      Sound.metal(1.45, 1.38);
      setCommentary(`${label}！${win ? "你" : "對手"}完成極限終結！`);
    } else {
      Sound.death();
      scratch(loser.x, loser.y, loser.vx, loser.vy, true);
      setCommentary(`${label}！${win ? "你" : "對手"}撐到最後！`);
    }

    if (loser.el) {
      loser.el.classList.add("zg-top-wobble");
      loser.el.style.opacity = "0.24";
    }

    if (winner.el) {
      winner.el.classList.add("winner");
      afterimage(winner.x, winner.y, 126);
      shockwave(winner.x, winner.y);
    }

    state.pendingResult = {
      win,
      finishType: b.finish,
      points: b.points,
      playerHp: Math.max(0, Math.round(b.player.hp)),
      enemyHp: Math.max(0, Math.round(b.enemy.hp)),
      playerSpin: Number(b.player.spinRatio.toFixed(3)),
      enemySpin: Number(b.enemy.spinRatio.toFixed(3))
    };

    track("finish", {
      win,
      finishType: b.finish,
      finishLabel: label,
      points: b.points,
      playerHp: state.pendingResult.playerHp,
      enemyHp: state.pendingResult.enemyHp,
      playerSpin: state.pendingResult.playerSpin,
      enemySpin: state.pendingResult.enemySpin
    });

    setTimeout(() => {
      finishBattle(win, b.finish, b.points);
    }, 1050);
  }

  function finishBattle(win, finishType = "spin", points = 1) {
    const b = state.battle;

    if (!b) return;

    state.running = false;
    state.paused = false;
    b.ended = true;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const oldScore = getMyScore();
    const deltaBase = win ? 68 : -42;
    const finishBonus = (FINISH[finishType]?.points || points || 1) * 13;
    const launchBonus =
      b.launchGrade === "perfect"
        ? 18
        : b.launchGrade === "good"
          ? 8
          : b.launchGrade === "weak"
            ? -8
            : 0;

    const hpBonus = Math.round((b.player.hp / b.player.maxHp) * 18);
    const newScore = Math.max(0, oldScore + deltaBase + (win ? finishBonus : -6) + launchBonus + hpBonus);

    setMyScore(newScore);
    increaseDailyPlay();

    const coupon = drawCoupon(win, finishType);

    state.lastCouponReward = coupon;

    const result = {
      win,
      finishType,
      finishLabel: FINISH[finishType]?.label || "Spin Finish",
      points,
      oldScore,
      newScore,
      delta: newScore - oldScore,
      coupon,
      playerTop: state.selectedTop,
      enemyTop: state.enemyTop,
      playerHp: Math.max(0, Math.round(b.player.hp)),
      enemyHp: Math.max(0, Math.round(b.enemy.hp)),
      playerSpin: Number(b.player.spinRatio.toFixed(3)),
      enemySpin: Number(b.enemy.spinRatio.toFixed(3)),
      launchPower: Number((b.launchPower || 0).toFixed(3)),
      launchGrade: b.launchGrade || "normal",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      timestamp: new Date().toISOString()
    };

    state.lastBattleResult = result;

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
      localStorage.setItem(STORAGE.lastCoupon, JSON.stringify(coupon));
    } catch (error) {}

    renderResult(result);
    showScreen("result");

    logResultOnce(result);
  }

  function stopBattle() {
    state.running = false;
    state.paused = true;
    state.finishing = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    cancelChargeLoop();

    Sound.stopHum();
  }

  function battleLoop(ts) {
    const b = state.battle;

    if (!b || !state.running || b.ended) return;

    if (!state.lastFrame) {
      state.lastFrame = ts;
    }

    const raw = clamp((ts - state.lastFrame) / 16.67, 0.45, 2.2);
    const dt = Math.min(raw, 1.8);

    state.lastFrame = ts;

    updatePerf(raw);

    applyArenaForces(b.player, b.arena, dt);
    applyArenaForces(b.enemy, b.arena, dt);

    applyFriction(b.player, dt);
    applyFriction(b.enemy, dt);

    moveBody(b.player, b.arena, dt);
    moveBody(b.enemy, b.arena, dt);

    resolveCollision(b.player, b.enemy, dt);

    maybeStartCenterDuel();
    updateCenterDuel(dt);

    syncBody(b.player);
    syncBody(b.enemy);

    updateHpBars();
    updateBattleFeel();

    checkDeadAndFinish();

    const elapsed = now() - b.startedAt;

    if (!state.finishing && elapsed > PHY.battleLimit) {
      maybeStartCenterDuel();

      if (!state.centerDuelStarted) {
        resolveDecisionFinish();
      }
    }

    state.raf = requestAnimationFrame(battleLoop);
  }

  function startBattle() {
    beginChargeBattle();
  }
    /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁面
   * Version: 202607131144-result-rebuild-safe
   *
   * Fix:
   * - 如果頁面已有舊版 #screen-result，會強制重建新版結果頁 DOM
   * - 金色 S / SS 圓章 DOM 保證存在
   * - 金色折扣券 DOM 保證存在
   * - 折扣券固定折扣碼
   * - 折扣券機率：500元 1%、250元 29%、100元 70%
   * - 折扣券加入「複製折扣碼」按鈕
   * - 排行榜移除虛擬人物
   * - 只顯示真實 LINE / 後台好友資料 + 玩家本人
   * - 沒有好友排行時提醒邀請好友
   * - 結果頁允許捲動
   * =========================================================
   */

  function getResultHtml() {
    return `
      <main class="zg-main zg-result-main">
        <div class="zg-result-card">
          <div class="zg-result-rank-wrap">
            <div id="zg-result-rank" class="zg-rank" data-rank="S">S</div>
          </div>

          <h2 id="zg-result-title" class="zg-result-title">
            對戰結果
          </h2>

          <p id="zg-result-desc" class="zg-result-desc">
            結算中...
          </p>

          <div class="zg-result-stats">
            <div class="zg-result-stat">
              <span>Finish</span>
              <b id="zg-result-finish">Spin Finish</b>
            </div>

            <div class="zg-result-stat">
              <span>戰力分數</span>
              <b id="zg-result-score-delta">+0</b>
            </div>

            <div class="zg-result-stat">
              <span>目前分數</span>
              <b id="zg-result-total-score">1200</b>
            </div>

            <div class="zg-result-stat">
              <span>今日剩餘</span>
              <b id="zg-result-remaining">0 / ${DAILY_LIMIT}</b>
            </div>
          </div>

          <div id="zg-result-coupon" class="zg-coupon has-coupon">
            <div id="zg-coupon-label" class="zg-coupon-label">
              獲得折扣券
            </div>

            <div id="zg-result-score" class="zg-coupon-code">
              ZELO100
            </div>

            <div id="zg-coupon-note" class="zg-coupon-note">
              請複製折扣碼，結帳時輸入即可使用。
            </div>

            <button
              id="zg-copy-coupon-btn"
              class="zg-coupon-copy"
              data-zg-action="copy-coupon"
              type="button"
            >
              複製折扣碼
            </button>

            <button
              id="zg-download-coupon"
              class="zg-coupon-download"
              data-zg-action="download-coupon"
              type="button"
            >
              下載折扣券
            </button>
          </div>

          <div class="zg-rankbox">
            <div class="zg-rankbox-title">
              LINE 好友排行榜
            </div>

            <div id="zg-friend-rank-list">
              <div class="zg-rank-empty">
                目前還沒有 LINE 好友排行。
              </div>
            </div>

            <div id="zg-rank-invite-tip" class="zg-rank-invite-tip">
              邀請 LINE 好友一起挑戰，好友完成遊戲後就會出現在排行榜。
            </div>
          </div>
        </div>
      </main>

            <div class="zg-bottom zg-result-actions">
        <button class="zg-btn zg-btn-red" data-zg-action="play-again" type="button">
          再玩一次
        </button>

        <button class="zg-btn zg-btn-white" data-zg-action="change-top" type="button">
          更換陀螺
        </button>

        <button class="zg-btn zg-btn-green" data-zg-action="official" type="button">
          前往官網
        </button>

        <button class="zg-btn zg-btn-blue" data-zg-action="share" type="button">
          分享戰績
        </button>
      </div>
    `;
  }

  function isStructuredResultDomReady(result = screenResult()) {
    if (!result) return false;

    return !!(
      $(".zg-result-card", result) &&
      $(".zg-result-rank-wrap", result) &&
      $("#zg-result-rank", result) &&
      $("#zg-result-coupon", result) &&
      $("#zg-copy-coupon-btn", result) &&
      $(".zg-rankbox", result) &&
      $("#zg-friend-rank-list", result) &&
      $("#zg-rank-invite-tip", result)
    );
  }

  function rebuildResultDom(result) {
    if (!result) return;

    result.id = "screen-result";
    result.classList.add("zg-screen");
    result.innerHTML = getResultHtml();
    result.style.overflowY = "auto";
    result.style.overflowX = "hidden";
    result.style.webkitOverflowScrolling = "touch";
  }

  function ensureResultDom(root) {
    let result = screenResult();

    if (!result) {
      result = document.createElement("section");
      result.id = "screen-result";
      result.className = "zg-screen";
      result.hidden = true;
      root.appendChild(result);
    }

    if (!isStructuredResultDomReady(result)) {
      rebuildResultDom(result);
    }

    patchResultDom();
  }

  function patchResultDom() {
    const result = screenResult();
    if (!result) return;

    if (!isStructuredResultDomReady(result)) {
      rebuildResultDom(result);
    }

    result.style.overflowY = "auto";
    result.style.overflowX = "hidden";
    result.style.webkitOverflowScrolling = "touch";

    const rank = $("#zg-result-rank", result);

    if (rank && !rank.getAttribute("data-rank")) {
      rank.setAttribute("data-rank", rank.textContent.trim() || "S");
    }

    const coupon = $("#zg-result-coupon", result);

    if (coupon && !$("#zg-copy-coupon-btn", coupon)) {
      const btn = document.createElement("button");
      btn.id = "zg-copy-coupon-btn";
      btn.className = "zg-coupon-copy";
      btn.setAttribute("data-zg-action", "copy-coupon");
      btn.type = "button";
      btn.textContent = "複製折扣碼";

      const download = $("#zg-download-coupon", coupon);

      if (download) {
        coupon.insertBefore(btn, download);
      } else {
        coupon.appendChild(btn);
      }
    }

    const rankbox = $(".zg-rankbox", result);

    if (rankbox && !$("#zg-rank-invite-tip", rankbox)) {
      const tip = document.createElement("div");
      tip.id = "zg-rank-invite-tip";
      tip.className = "zg-rank-invite-tip";
      tip.textContent = "邀請 LINE 好友一起挑戰，好友完成遊戲後就會出現在排行榜。";
      rankbox.appendChild(tip);
    }
  }

  function onResultShown() {
    patchResultDom();
    removeMenuDom();
    removeLogoDom();
    hideDuplicateResultButtons();
    watchResultDuplicates();
  }

  function drawCoupon(win, finishType) {
    const roll = Math.random();

    let acc = 0;
    let selected = COUPON_REWARDS[COUPON_REWARDS.length - 1];

    for (const reward of COUPON_REWARDS) {
      acc += reward.rate;

      if (roll <= acc) {
        selected = reward;
        break;
      }
    }

    return {
      id: selected.id,
      label: selected.label,
      amount: selected.amount,
      code: selected.fixedCode || selected.codePrefix,
      isEmpty: false,
      rate: selected.rate,
      win: !!win,
      finishType: finishType || "spin"
    };
  }

  function getResultRank(result) {
    if (!result) return "C";

    if (result.win && result.finishType === "xtreme") return "SS";
    if (result.win && result.finishType === "burst") return "S";
    if (result.win && result.delta >= 90) return "S";
    if (result.win && result.launchGrade === "perfect") return "A";
    if (result.win) return "A";
    if (result.delta >= -10) return "B";

    return "C";
  }

  function renderResult(result) {
    if (!result) return;

    ensureResultDom(appRoot());
    patchResultDom();

    const rank = getResultRank(result);
    const title = result.win ? "勝利！" : "惜敗！";
    const desc = result.win
      ? "你成功擊敗對手，陀螺仍然持續旋轉！"
      : "這次被對手壓制了，邀請好友一起挑戰再突破紀錄！";

    const rankEl = $("#zg-result-rank");

    if (rankEl) {
      rankEl.textContent = rank;
      rankEl.setAttribute("data-rank", rank);
    }

    setText("#zg-result-title", title);
    setText("#zg-result-desc", desc);
    setText("#zg-result-finish", result.finishLabel || "Spin Finish");
    setText(
      "#zg-result-score-delta",
      `${result.delta >= 0 ? "+" : ""}${result.delta}`
    );
    setText("#zg-result-total-score", result.newScore);
    setText("#zg-result-remaining", `${result.remainingPlays} / ${DAILY_LIMIT}`);

    renderCoupon(result.coupon);
    renderFriendRank(result);
    hideDuplicateResultButtons();
  }

  function renderCoupon(coupon) {
    const box = $("#zg-result-coupon");
    const label = $("#zg-coupon-label");
    const code = $("#zg-result-score");
    const note = $("#zg-coupon-note");
    const copy = $("#zg-copy-coupon-btn");
    const download = $("#zg-download-coupon");

    if (!box || !coupon) return;

    box.classList.remove("is-empty");
    box.classList.add("has-coupon");

    if (label) {
      label.textContent = `獲得 ${coupon.label}`;
    }

    if (code) {
      code.textContent = coupon.code;
    }

    if (note) {
      note.textContent = `折扣碼：${coupon.code}。結帳時輸入即可折抵 ${coupon.amount} 元。`;
    }

    if (copy) {
      copy.style.display = "";
      copy.textContent = "複製折扣碼";
    }

    if (download) {
      download.style.display = "";
      download.textContent = "下載折扣券";
    }
  }

  function getRealFriendRankData(result) {
    const currentUserId = getUserId();
    const currentName = getPlayerName();
    const currentScore = result?.newScore || getMyScore();

    let backendFriends = [];
    let localFriends = [];

    if (Array.isArray(window.ZELO_FRIEND_RANK)) {
      backendFriends = window.ZELO_FRIEND_RANK;
    }

    if (Array.isArray(window.ZELO_LINE_FRIEND_RANK)) {
      backendFriends = backendFriends.concat(window.ZELO_LINE_FRIEND_RANK);
    }

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE.friends) || "[]");

      if (Array.isArray(saved)) {
        localFriends = saved;
      }
    } catch (error) {
      localFriends = [];
    }

    const merged = [
      ...backendFriends,
      ...localFriends,
      {
        userId: currentUserId || "me",
        name: currentName,
        displayName: currentName,
        score: currentScore,
        me: true
      }
    ];

    const seen = new Set();

    return merged
      .filter((item) => {
        if (!item) return false;

        const id = item.userId || item.id || item.uid || item.name || item.displayName;
        const score = Number(item.score || item.newScore || 0);

        if (!id || score <= 0) return false;

        if (seen.has(id)) return false;
        seen.add(id);

        return true;
      })
      .map((item) => ({
        userId: item.userId || item.id || item.uid || "",
        name: item.displayName || item.name || "LINE 好友",
        score: Number(item.score || item.newScore || 0),
        me: !!item.me || (currentUserId && item.userId === currentUserId)
      }))
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 20);
  }

  function renderFriendRank(result) {
    const list = $("#zg-friend-rank-list");
    const tip = $("#zg-rank-invite-tip");

    if (!list || !result) return;

    const ranks = getRealFriendRankData(result);

    if (!ranks.length) {
      list.innerHTML = `
        <div class="zg-rank-empty">
          目前還沒有 LINE 好友排行。
        </div>
      `;

      if (tip) {
        tip.style.display = "";
        tip.textContent = "邀請 LINE 好友一起對戰，好友完成遊戲後就會出現在排行榜。";
      }

      return;
    }

    list.innerHTML = ranks.map((item, index) => {
      return `
        <div class="zg-rank-row ${item.me ? "me" : ""}">
          <span class="zg-rank-num">${index + 1}</span>
          <span class="zg-rank-name">${escapeHtml(item.name)}</span>
          <span class="zg-rank-score">${escapeHtml(item.score)}</span>
        </div>
      `;
    }).join("");

    const hasFriend = ranks.some((item) => !item.me);

    if (tip) {
      tip.style.display = "";
      tip.textContent = hasFriend
        ? "邀請更多 LINE 好友一起挑戰，刷新排行榜！"
        : "目前只有你的紀錄。分享給 LINE 好友，邀請他們一起對戰！";
    }

    try {
      const onlyRealRanks = ranks
        .filter((item) => item && item.userId && !item.me)
        .map((item) => ({
          userId: item.userId,
          name: item.name,
          score: item.score
        }));

      localStorage.setItem(STORAGE.friends, JSON.stringify(onlyRealRanks));
    } catch (error) {}
  }

    function hideDuplicateResultButtons() {
    const result = screenResult();
    if (!result) return;

    const seen = new Set();

    $$("button, a", result).forEach((el) => {
      const text = (el.textContent || "").trim();
      const action = el.getAttribute("data-zg-action") || "";
      const key = action || text;

      if (!key) return;

      if (seen.has(key)) {
        el.setAttribute("data-zelo-duplicate-hidden", "true");
        el.style.display = "none";
      } else {
        seen.add(key);
        el.removeAttribute("data-zelo-duplicate-hidden");
        el.style.display = "";
      }
    });
  }


  function copyCouponCode() {
    const coupon =
      state.lastCouponReward ||
      safeParse(localStorage.getItem(STORAGE.lastCoupon), null);

    const code = coupon?.code || $("#zg-result-score")?.textContent?.trim() || "";

    if (!code || code === "再接再厲") {
      alert("目前沒有可複製的折扣碼。");
      return;
    }

    const done = () => {
      const btn = $("#zg-copy-coupon-btn");

      if (btn) {
        const oldText = btn.textContent;
        btn.textContent = "已複製！";

        setTimeout(() => {
          btn.textContent = oldText || "複製折扣碼";
        }, 1200);
      }

      track("coupon_copy", {
        couponCode: code,
        couponId: coupon?.id || "",
        couponAmount: coupon?.amount || 0
      });
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(done)
        .catch(() => {
          fallbackCopyText(code);
          done();
        });

      return;
    }

    fallbackCopyText(code);
    done();
  }

  function fallbackCopyText(text) {
    const input = document.createElement("textarea");

    input.value = text;
    input.setAttribute("readonly", "readonly");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";

    document.body.appendChild(input);
    input.select();

    try {
      document.execCommand("copy");
    } catch (error) {}

    input.remove();
  }

  function createCouponCanvas(coupon, result) {
    const canvas = document.createElement("canvas");

    canvas.width = 1080;
    canvas.height = 1440;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1440);
    gradient.addColorStop(0, "#fff7bb");
    gradient.addColorStop(0.36, "#ffe66d");
    gradient.addColorStop(0.72, "#ffc400");
    gradient.addColorStop(1, "#ff8a00");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(210, 210, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(900, 1180, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(90,48,0,0.35)";
    ctx.lineWidth = 8;
    ctx.setLineDash([28, 22]);
    roundRect(ctx, 70, 70, 940, 1300, 48);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#261700";
    ctx.textAlign = "center";

    ctx.font = "900 58px sans-serif";
    ctx.fillText("ZELO SPORTIVO", 540, 190);

    ctx.font = "900 72px sans-serif";
    ctx.fillText(coupon.label || "折扣券", 540, 350);

    ctx.font = "1000 96px sans-serif";
    ctx.fillText(coupon.code || "NO CODE", 540, 530);

    ctx.font = "800 42px sans-serif";
    ctx.fillText(`可折抵 ${coupon.amount || 0} 元`, 540, 640);

    ctx.font = "800 42px sans-serif";
    ctx.fillText(`對戰結果：${result?.win ? "勝利" : "完成挑戰"}`, 540, 760);

    ctx.font = "800 38px sans-serif";
    ctx.fillText(`Finish：${result?.finishLabel || "Spin Finish"}`, 540, 830);

    ctx.font = "800 34px sans-serif";
    ctx.fillText("結帳時輸入折扣碼即可使用", 540, 1010);

    ctx.font = "700 30px sans-serif";
    ctx.fillText("請妥善保存此圖片", 540, 1080);

    ctx.font = "700 28px sans-serif";
    ctx.fillText(new Date().toLocaleDateString("zh-TW"), 540, 1240);

    return canvas;
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function downloadCoupon() {
    const coupon =
      state.lastCouponReward ||
      safeParse(localStorage.getItem(STORAGE.lastCoupon), null);

    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    if (!coupon || coupon.isEmpty || !coupon.code) {
      alert("目前沒有可下載的折扣券。");
      return;
    }

    const canvas = createCouponCanvas(coupon, result);

    const link = document.createElement("a");
    link.download = `${coupon.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    track("coupon_download", {
      couponId: coupon.id,
      couponCode: coupon.code,
      amount: coupon.amount || 0
    });
  }

  function shareResult() {
    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    if (!result) {
      alert("目前沒有可分享的戰績。");
      return;
    }

    const text = `我在 ZELO 陀螺競技場${result.win ? "獲勝" : "完成挑戰"}！${result.finishLabel}，目前分數 ${result.newScore}。快來跟我一起對戰！`;

    track("share", {
      win: result.win,
      finishType: result.finishType,
      score: result.newScore
    });

    if (navigator.share) {
      navigator.share({
        title: "ZELO 陀螺競技場",
        text,
        url: location.href
      }).catch(() => {});
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${text} ${location.href}`).then(() => {
        alert("分享文字已複製，快傳給 LINE 好友！");
      }).catch(() => {
        alert(text);
      });
      return;
    }

    alert(text);
  }

  function handleOfficialClick() {
    track("official_click", {
      source: state.screen || "unknown",
      url: SHOP_URL
    });

    location.href = SHOP_URL;
  }

  function handlePlayAgain() {
    track("play_again", {
      source: "result"
    });

    beginChargeBattle();
  }



  /*
   * =========================================================
   * 10. TRACKING / 儀表板事件追蹤
   * =========================================================
   */

  function buildTrackingPayload(eventName, data = {}) {
    const profile = getProfile() || {};
    const result = state.lastBattleResult || {};

    return {
      event: eventName,
      version: VERSION,

      timestamp: new Date().toISOString(),
      pageUrl: location.href,
      referrer: document.referrer || "",

      userId: getUserId(),
      displayName: getPlayerName(),

      inviterId: state.inviterId || getUrlParam("ref") || getUrlParam("inviter") || "",
      inviterName: state.inviterName || getUrlParam("refName") || "",

      selectedTopId: state.selectedTop?.id || result.playerTop?.id || "",
      selectedTopName: state.selectedTop?.name || result.playerTop?.name || "",
      selectedTopType: state.selectedTop?.type || result.playerTop?.type || "",

      enemyTopId: state.enemyTop?.id || result.enemyTop?.id || "",
      enemyTopName: state.enemyTop?.name || result.enemyTop?.name || "",
      enemyTopType: state.enemyTop?.type || result.enemyTop?.type || "",

      score: getMyScore(),
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,

      liffProfile: profile,

      data
    };
  }

  function track(eventName, data = {}) {
    const payload = buildTrackingPayload(eventName, data);

    try {
      window.dispatchEvent(
        new CustomEvent("zelo-game-track", {
          detail: payload
        })
      );
    } catch (error) {}

    if (window.ZELO_TRACKER && typeof window.ZELO_TRACKER.track === "function") {
      try {
        window.ZELO_TRACKER.track(eventName, payload);
      } catch (error) {}
    }

    sendTracking(payload);

    return payload;
  }

  function sendTracking(payload) {
    if (!GOOGLE_SCRIPT_URL) return;

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([body], {
          type: "text/plain;charset=utf-8"
        });

        const ok = navigator.sendBeacon(GOOGLE_SCRIPT_URL, blob);
        if (ok) return;
      } catch (error) {}
    }

    try {
      fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body
      }).catch(() => {});
    } catch (error) {}
  }

  function logResultOnce(result) {
    if (!result || state.resultLogged) return;

    state.resultLogged = true;

    track("result", {
      win: result.win,
      finishType: result.finishType,
      finishLabel: result.finishLabel,
      points: result.points,

      oldScore: result.oldScore,
      newScore: result.newScore,
      delta: result.delta,

      couponId: result.coupon?.id || "",
      couponLabel: result.coupon?.label || "",
      couponCode: result.coupon?.code || "",
      couponAmount: result.coupon?.amount || 0,

      playerHp: result.playerHp,
      enemyHp: result.enemyHp,
      playerSpin: result.playerSpin,
      enemySpin: result.enemySpin,

      launchPower: result.launchPower,
      launchGrade: result.launchGrade,

      playsUsed: result.playsUsed,
      remainingPlays: result.remainingPlays
    });
  }

    /*
   * =========================================================
   * 11. EVENTS / 全域事件綁定
   * Version: 202607131821-events-safe
   *
   * Fix:
   * - 防止事件重複綁定
   * - 防止 event.target.closest 例外
   * - 支援 play-again / play_again
   * - 支援 change-top / change_top
   * - 支援 copy-coupon / copy_coupon
   * - 支援 download-coupon / download_coupon
   * =========================================================
   */

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;

    console.log("[ZG] bindEvents ready");

     window.addEventListener("blur", () => {
      if (state.charging) {
        releaseCharging();
      }

      if (state.screen === "battle") {
        Sound.stopHum();
      }
    });

    document.addEventListener("click", (event) => {
      if (!event.target || !event.target.closest) return;

      const actionEl = event.target.closest("[data-zg-action]");
      if (!actionEl) return;

      const action = actionEl.getAttribute("data-zg-action");
      if (!action) return;

      console.log("[ZG] action clicked:", action);

      if (action === "start") {
        event.preventDefault();
        handleHomeStart();
        return;
      }

      if (action === "home") {
        event.preventDefault();

        track("home_click", {
          source: state.screen || "unknown"
        });

        showScreen("start");
        return;
      }

      if (action === "select") {
        event.preventDefault();

        track("select_click", {
          source: state.screen || "unknown"
        });

        showScreen("select");
        return;
      }

      if (action === "battle") {
        event.preventDefault();
        beginChargeBattle();
        return;
      }

      if (action === "play-again" || action === "play_again") {
        event.preventDefault();
        handlePlayAgain();
        return;
      }

      if (action === "share") {
        event.preventDefault();
        shareResult();
        return;
      }

      if (action === "copy-coupon" || action === "copy_coupon") {
        event.preventDefault();
        copyCouponCode();
        return;
      }

      if (action === "download-coupon" || action === "download_coupon") {
        event.preventDefault();
        downloadCoupon();
        return;
      }

      if (action === "change-top" || action === "change_top") {
        event.preventDefault();
        handleChangeTop();
        return;
      }

      if (action === "official") {
        event.preventDefault();
        handleOfficialClick();
        return;
      }

      console.warn("[ZG] unknown action:", action);
    });

    document.addEventListener("click", (event) => {
      if (!event.target || !event.target.closest) return;

      const card = event.target.closest(".zg-top-card");
      if (!card) return;

      const id =
        card.getAttribute("data-id") ||
        card.getAttribute("data-top-id") ||
        "";

      if (!id) return;

      Sound.resume();
      selectTop(id);
    });

    document.addEventListener("pointerdown", (event) => {
      if (!event.target || !event.target.closest) return;

      const btn = event.target.closest(".zg-charge-btn");
      if (!btn) return;

      event.preventDefault();
      startCharging();
    });

    document.addEventListener("pointerup", () => {
      if (!state.charging) return;
      releaseCharging();
    });

    document.addEventListener("pointercancel", () => {
      if (state.charging) {
        releaseCharging();
      }
    });

    document.addEventListener("pointerleave", (event) => {
      if (!state.charging) return;

      const layer = $(".zg-charge-layer.active");
      if (!layer) return;

      if (!event.target || !layer.contains(event.target)) return;

      releaseCharging();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (state.screen === "battle" && state.running) {
          state.paused = true;
        }

        Sound.stopHum();
        return;
      }

      if (
        state.screen === "battle" &&
        state.battle &&
        state.running &&
        !state.battle.ended
      ) {
        Sound.startHum(0, getFeel(state.battle.player.top).humBase);
        Sound.startHum(1, getFeel(state.battle.enemy.top).humBase);
      }
    });

    window.addEventListener("resize", () => {
      if (!state.battle || state.screen !== "battle") return;

      const arena = getArenaInfo();
      state.battle.arena = arena;

      state.battle.player.x = clamp(state.battle.player.x, arena.left, arena.right);
      state.battle.player.y = clamp(state.battle.player.y, arena.top, arena.bottom);

      state.battle.enemy.x = clamp(state.battle.enemy.x, arena.left, arena.right);
      state.battle.enemy.y = clamp(state.battle.enemy.y, arena.top, arena.bottom);

      syncBody(state.battle.player);
      syncBody(state.battle.enemy);
    });
  }

  function watchResultDuplicates() {
    const result = screenResult();
    if (!result) return;

    if (window.ZGResultObserver) {
      try {
        window.ZGResultObserver.disconnect();
      } catch (error) {}
    }

    const observer = new MutationObserver(() => {
      hideDuplicateResultButtons();
    });

    observer.observe(result, {
      childList: true,
      subtree: true
    });

    window.ZGResultObserver = observer;
  }



    /*
   * =========================================================
   * 12. INIT / 啟動
   * Version: 202607131821-init-safe
   *
   * Fix:
   * - 補上 boot 執行
   * - 補上 IIFE 結尾
   * - 防止 boot 重複執行
   * - exposeDebugApi 補存 localStorage
   * =========================================================
   */

  function initProfile() {
    const ref = getUrlParam("ref") || getUrlParam("inviter") || "";
    const refName = getUrlParam("refName") || "";

    state.inviterId = ref;
    state.inviterName = refName;

    if (window.ZELO_PROFILE) {
      state.profile = window.ZELO_PROFILE;

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(window.ZELO_PROFILE));
      } catch (error) {}

      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE.profile);
      if (saved) {
        state.profile = JSON.parse(saved);
      }
    } catch (error) {}
  }

  function initLiffProfileIfAvailable() {
    const liff = window.liff;

    if (!liff || typeof liff.getProfile !== "function") return;

    try {
      if (typeof liff.isLoggedIn === "function" && !liff.isLoggedIn()) return;

      liff.getProfile()
        .then((profile) => {
          state.profile = profile;
          window.ZELO_PROFILE = profile;

          try {
            localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
          } catch (error) {}

          track("profile_loaded", {
            userId: profile.userId || "",
            displayName: profile.displayName || ""
          });
        })
        .catch(() => {});
    } catch (error) {}
  }

  function exposeDebugApi() {
    window.ZELO_GAME = {
      version: VERSION,

      state,
      TOPS,
      PHY,
      PERF,

      showScreen,
      startBattle,
      beginChargeBattle,
      startBattleWithPower,
      stopBattle,

      renderResult,
      track,

      getMyScore,
      setMyScore,

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

      forceResult(win = true) {
        state.selectedTop = state.selectedTop || loadSelectedTop();
        state.enemyTop = state.enemyTop || pickEnemyTop();

        const oldScore = getMyScore();
        const newScore = oldScore + (win ? 80 : -35);

        setMyScore(newScore);
        loadDailyLimit();

        const coupon = drawCoupon(win, win ? "burst" : "spin");

        const result = {
          win,
          finishType: win ? "burst" : "spin",
          finishLabel: win ? "Burst Finish" : "Spin Finish",
          points: win ? 2 : 1,
          oldScore,
          newScore,
          delta: newScore - oldScore,
          coupon,
          playerTop: state.selectedTop,
          enemyTop: state.enemyTop,
          playerHp: win ? 42 : 0,
          enemyHp: win ? 0 : 36,
          playerSpin: win ? 0.22 : 0,
          enemySpin: win ? 0 : 0.19,
          launchPower: 0.82,
          launchGrade: "perfect",
          playsUsed: state.playsUsed,
          remainingPlays: state.remainingPlays,
          timestamp: new Date().toISOString()
        };

        state.lastCouponReward = coupon;
        state.lastBattleResult = result;

        try {
          localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
          localStorage.setItem(STORAGE.lastCoupon, JSON.stringify(coupon));
        } catch (error) {}

        renderResult(result);
        showScreen("result");
        logResultOnce(result);

        return result;
      }
    };
  }

  function boot() {
    if (state.booted) return;
    state.booted = true;

    console.log("[ZG] boot start:", VERSION);

    ensureAppHeight();
    initProfile();

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      PERF.maxFx = 18;
      PERF.maxSparksPerHit = 4;
      PERF.minFxGap = 90;
      PERF.minScratchGap = 240;
      PERF.minAfterimageGap = 280;
      PERF.minShockwaveGap = 420;
    }

    loadDailyLimit();

    ensureBasicDom();
    injectVisualEnhancements();

    state.selectedTop = loadSelectedTop();

    bindEvents();
    watchMenuDom();
    watchResultDuplicates();
    exposeDebugApi();

    initLiffProfileIfAvailable();

    showScreen("start");

    track("page_view", {
      source: "boot",
      remainingPlays: state.remainingPlays,
      playsUsed: state.playsUsed
    });

    console.log("[ZG] boot complete:", VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
