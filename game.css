(function () {
  "use strict";

  /* =========================================================
     ZELO LIFF BEYBLADE GAME
     game.js
     Version: 202607130611-preserve-art-physics

     IMPORTANT:
     - 不重建 HTML
     - 不覆蓋原本美術 / 排版
     - 只控制既有 DOM
     - 保留 game.css 設計
     ========================================================= */

  var VERSION = "202607130611-preserve-art-physics";

  var LIFF_ID = window.ZELO_LIFF_ID || "2007022255-ph9gRwPs";
  var SHOP_URL = window.ZELO_SHOP_URL || "https://zelosportivo.com/zh";
  var GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

  var DAILY_LIMIT = 3;

  var tops = {
    attack: {
      id: "attack",
      name: "火焰衝擊",
      typeName: "攻擊型",
      icon: "🔥",
      className: "attack",
      attack: 95,
      defense: 55,
      stamina: 50,
      balance: 60,
      speed: 95,
      mass: 0.92,
      radius: 31,
      hp: 100,
      beats: "stamina",
      color: "#ff1744",
      trailColor: "255,23,68"
    },
    defense: {
      id: "defense",
      name: "鋼鐵堡壘",
      typeName: "防禦型",
      icon: "🛡️",
      className: "defense",
      attack: 55,
      defense: 95,
      stamina: 65,
      balance: 80,
      speed: 58,
      mass: 1.22,
      radius: 33,
      hp: 118,
      beats: "attack",
      color: "#2196f3",
      trailColor: "33,150,243"
    },
    stamina: {
      id: "stamina",
      name: "風暴長旋",
      typeName: "持久型",
      icon: "🌪️",
      className: "stamina",
      attack: 60,
      defense: 65,
      stamina: 95,
      balance: 85,
      speed: 70,
      mass: 1.02,
      radius: 30,
      hp: 108,
      beats: "defense",
      color: "#00e676",
      trailColor: "0,230,118"
    }
  };

  var enemies = [
    {
      id: "attack",
      name: "赤焰對手",
      typeName: "攻擊型",
      icon: "🔥",
      attack: 88,
      defense: 58,
      stamina: 56,
      balance: 64,
      speed: 86,
      mass: 0.94,
      radius: 31,
      hp: 104,
      beats: "stamina",
      color: "#ff1744",
      trailColor: "255,23,68"
    },
    {
      id: "defense",
      name: "藍盾對手",
      typeName: "防禦型",
      icon: "🛡️",
      attack: 58,
      defense: 88,
      stamina: 68,
      balance: 78,
      speed: 58,
      mass: 1.18,
      radius: 33,
      hp: 112,
      beats: "attack",
      color: "#2196f3",
      trailColor: "33,150,243"
    },
    {
      id: "stamina",
      name: "綠旋對手",
      typeName: "持久型",
      icon: "🌪️",
      attack: 62,
      defense: 66,
      stamina: 88,
      balance: 84,
      speed: 68,
      mass: 1.02,
      radius: 30,
      hp: 108,
      beats: "defense",
      color: "#00e676",
      trailColor: "0,230,118"
    }
  ];

  var coupons = {
    win: [
      { label: "恭喜你贏得折扣碼", code: "ZELO500", note: "結帳時輸入折扣碼即可使用。" },
      { label: "恭喜你贏得折扣碼", code: "BATTLE300", note: "結帳時輸入折扣碼即可使用。" },
      { label: "恭喜你贏得折扣碼", code: "SPIN10", note: "結帳時輸入折扣碼即可使用。" }
    ],
    lose: [
      { label: "挑戰者獎勵", code: "TRY100", note: "下次再挑戰，也可以使用本折扣碼。" },
      { label: "再接再厲獎勵", code: "RETRY50", note: "結帳時輸入折扣碼即可使用。" }
    ]
  };

  var state = {
    profile: null,
    selectedTop: null,
    enemy: null,

    playerHp: 100,
    enemyHp: 100,
    playerMaxHp: 100,
    enemyMaxHp: 100,

    score: 0,
    rank: "B",
    coupon: "ZELOPLAY",
    couponReward: null,

    battleDone: false,
    resultLogged: false,

    typeStatus: "neutral",
    typeText: "屬性均勢",

    inviterId: "",
    inviterName: "",

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    isBlocked: false,
    blockReason: "",

    battleStartAt: 0
  };

  var physics = {
    running: false,
    frame: null,
    lastTime: 0,

    arenaEl: null,
    canvas: null,
    ctx: null,
    dpr: 1,

    playerEl: null,
    enemyEl: null,

    player: null,
    enemy: null,

    particles: [],
    shockwaves: [],
    slashes: [],

    lastHitAt: 0,
    lastImpactPower: 0,

    arena: {
      width: 360,
      height: 360,
      cx: 180,
      cy: 180,
      radius: 160
    }
  };

  /* =========================================================
     Helpers
     ========================================================= */

  function qs(id) {
    return document.getElementById(id);
  }

  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  function safeHtml(id, html) {
    var el = qs(id);
    if (el) el.innerHTML = html;
  }

  function clamp(value, min, max) {
    value = Number(value || 0);
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function setH() {
    var h = window.innerHeight || document.documentElement.clientHeight || screen.height || 720;
    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }

  function go(id) {
    all(".zg-screen").forEach(function (screen) {
      screen.classList.remove("active");
    });

    var target = qs(id);
    if (target) target.classList.add("active");

    setH();

    if (id === "screen-battle") {
      setTimeout(startBattlePhysics, 80);
      setTimeout(startBattlePhysics, 300);
    }

    if (id === "screen-result") {
      setTimeout(fixResultButtons, 80);
      setTimeout(fixResultButtons, 300);
    }
  }

  function toast(text) {
    var el = qs("zg-toast");
    if (!el) return;

    el.textContent = text;
    el.style.display = "block";

    setTimeout(function () {
      el.style.display = "none";
    }, 1600);
  }

  function getUrlParam(name) {
    try {
      var params = new URLSearchParams(location.search);
      return params.get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getTodayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function isVisible(el) {
    if (!el) return false;
    var style = window.getComputedStyle(el);
    var rect = el.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /* =========================================================
     JSONP / Tracking
     ========================================================= */

  function jsonpCall(params, onResult, timeoutMs) {
    var callbackName = "zeloCb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    var timeoutId = null;
    var script = document.createElement("script");

    window[callbackName] = function (data) {
      if (timeoutId) clearTimeout(timeoutId);

      try {
        if (onResult) onResult(data);
      } catch (e) {}

      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    var query = [];

    Object.keys(params || {}).forEach(function (key) {
      query.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
    });

    query.push("callback=" + encodeURIComponent(callbackName));
    query.push("_t=" + Date.now());

    script.src = GOOGLE_SCRIPT_URL + "?" + query.join("&");

    script.onerror = function () {
      if (timeoutId) clearTimeout(timeoutId);

      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      if (onResult) onResult(null);
    };

    document.body.appendChild(script);

    timeoutId = setTimeout(function () {
      try {
        delete window[callbackName];
      } catch (err) {
        window[callbackName] = undefined;
      }

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      if (onResult) onResult(null);
    }, timeoutMs || 6000);
  }

  function normalizeEventType(eventType) {
    var t = String(eventType || "").toLowerCase().trim();

    if (t === "copy-coupon") return "coupon_copy";
    if (t === "copycoupon") return "coupon_copy";
    if (t === "couponcopy") return "coupon_copy";
    if (t === "copy_coupon") return "coupon_copy";
    if (t === "download-coupon") return "coupon_download";
    if (t === "downloadcoupon") return "coupon_download";
    if (t === "officialsite") return "official_click";
    if (t === "gowebsite") return "official_click";
    if (t === "website") return "official_click";
    if (t === "shop_click") return "official_click";
    if (t === "share_click") return "share";
    if (t === "playagain") return "play_again";
    if (t === "replay_click") return "play_again";

    return t;
  }

  function getProfile() {
    if (window.ZELO_PROFILE) return window.ZELO_PROFILE;

    try {
      var saved = localStorage.getItem("zg_profile");
      if (saved) return JSON.parse(saved);
    } catch (err) {}

    return state.profile || null;
  }

  function getUserId() {
    var profile = getProfile() || {};
    return profile.userId || profile.id || profile.uid || "";
  }

  function getPlayerName() {
    var profile = getProfile() || {};
    return profile.displayName || profile.name || profile.playerName || "你";
  }

  function enrichPayload(payload) {
    payload = payload || {};

    var profile = getProfile() || {};

    var merged = {};
    Object.keys(payload).forEach(function (key) {
      merged[key] = payload[key];
    });

    merged.eventType = normalizeEventType(merged.eventType || "");

    if (!merged.userId) merged.userId = profile.userId || profile.id || profile.uid || "";
    if (!merged.displayName) merged.displayName = profile.displayName || profile.name || "";
    if (!merged.playerName) merged.playerName = profile.displayName || profile.name || "你";
    if (!merged.pictureUrl) merged.pictureUrl = profile.pictureUrl || "";

    if (!merged.inviterId) merged.inviterId = state.inviterId || getUrlParam("inviterId") || getUrlParam("ref") || "";
    if (!merged.inviterName) merged.inviterName = state.inviterName || getUrlParam("inviterName") || getUrlParam("refName") || "";

    if (!merged.pageUrl) merged.pageUrl = location.href;
    if (!merged.userAgent) merged.userAgent = navigator.userAgent || "";
    if (!merged.timestamp) merged.timestamp = nowIso();

    merged.version = VERSION;

    return merged;
  }

  function track(eventType, payload) {
    payload = payload || {};
    payload.eventType = eventType;

    var enriched = enrichPayload(payload);

    try {
      if (typeof window.trackGameEvent === "function") {
        window.trackGameEvent(enriched.eventType, enriched);
        return;
      }
    } catch (err) {}

    jsonpCall(enriched, function () {}, 6000);
  }

  window.sendGameEvent = track;

  /* =========================================================
     Daily Limit
     ========================================================= */

  function getDailyKey() {
    return "zg_daily_play_" + getTodayKey();
  }

  function loadDailyLimit() {
    var key = getDailyKey();
    var used = 0;

    try {
      used = Number(localStorage.getItem(key) || 0);
    } catch (err) {
      used = 0;
    }

    state.playsUsed = used;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - used);

    safeText("zg-daily-left", String(state.remainingPlays));
    safeText("zg-daily-used", String(state.playsUsed));
  }

  function increaseDailyPlay() {
    state.playsUsed += 1;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - state.playsUsed);

    try {
      localStorage.setItem(getDailyKey(), String(state.playsUsed));
    } catch (err) {}

    safeText("zg-daily-left", String(state.remainingPlays));
    safeText("zg-daily-used", String(state.playsUsed));
  }

  function isDailyBlocked() {
    loadDailyLimit();
    return state.remainingPlays <= 0;
  }

  /* =========================================================
     Existing DOM Finders
     ========================================================= */

  function findArena() {
    return (
      qs("zg-arena") ||
      one(".zg-arena") ||
      qs("battleArena") ||
      one(".battle-arena") ||
      qs("arena") ||
      one(".arena") ||
      one(".battle-stage") ||
      one(".game-arena") ||
      one(".stadium") ||
      one(".battle-field")
    );
  }

  function findPlayerTop() {
    return (
      qs("zg-player-top") ||
      one(".zg-player-top") ||
      qs("playerTop") ||
      qs("myTop") ||
      one(".player-top") ||
      one(".my-top") ||
      one(".user-top") ||
      one(".top-player")
    );
  }

  function findEnemyTop() {
    return (
      qs("zg-enemy-top") ||
      one(".zg-enemy-top") ||
      qs("enemyTop") ||
      qs("opponentTop") ||
      one(".enemy-top") ||
      one(".opponent-top") ||
      one(".rival-top") ||
      one(".top-enemy")
    );
  }

  function findBattleMessage() {
    return (
      qs("zg-battle-message") ||
      one(".zg-battle-message") ||
      one(".battle-message") ||
      one("[data-role='battle-message']")
    );
  }

  function findResultActions() {
    return qs("zg-result-actions") || one(".zg-result-actions") || one(".result-actions");
  }

  /* =========================================================
     Select / UI Rendering Without Rebuilding Layout
     ========================================================= */

  function renderTopList() {
    var list = qs("zg-top-list") || one(".zg-top-list") || one(".zg-select-grid");
    if (!list) return;

    var html = Object.keys(tops).map(function (key) {
      var top = tops[key];
      var active = state.selectedTop && state.selectedTop.id === top.id;

      return (
        '<button class="zg-top-card ' + (active ? "active" : "") + '" data-top-id="' + escapeHtml(top.id) + '">' +
          '<div class="zg-top-icon">' + escapeHtml(top.icon) + '</div>' +
          '<div class="zg-top-info">' +
            '<div class="zg-top-name">' + escapeHtml(top.name) + '</div>' +
            '<div class="zg-top-type">' + escapeHtml(top.typeName) + '</div>' +
            '<div class="zg-top-stats">' +
              '<span>攻 ' + top.attack + '</span>' +
              '<span>防 ' + top.defense + '</span>' +
              '<span>持 ' + top.stamina + '</span>' +
            '</div>' +
          '</div>' +
        '</button>'
      );
    }).join("");

    list.innerHTML = html;
  }

  function selectTop(id) {
    state.selectedTop = tops[id] || tops.attack;

    try {
      localStorage.setItem("zg_selected_top", state.selectedTop.id);
    } catch (err) {}

    renderTopList();
  }

  function loadSelectedTop() {
    var id = "attack";

    try {
      id = localStorage.getItem("zg_selected_top") || "attack";
    } catch (err) {}

    if (!tops[id]) id = "attack";

    selectTop(id);
  }

  /* =========================================================
     Battle Setup
     ========================================================= */

  function startBattle() {
    if (isDailyBlocked()) {
      state.isBlocked = true;
      state.blockReason = "daily_limit";

      track("blocked", {
        reason: "daily_limit",
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays
      });

      toast("今日挑戰次數已用完");
      return;
    }

    if (!state.selectedTop) loadSelectedTop();

    state.enemy = pick(enemies);
    state.battleDone = false;
    state.resultLogged = false;
    state.battleStartAt = Date.now();

    calculateTypeStatus();

    state.playerMaxHp = Number(state.selectedTop.hp || 100);
    state.enemyMaxHp = Number(state.enemy.hp || 108);
    state.playerHp = state.playerMaxHp;
    state.enemyHp = state.enemyMaxHp;

    renderBattleDom();
    go("screen-battle");

    setTimeout(startBattlePhysics, 120);
  }

  function calculateTypeStatus() {
    var player = state.selectedTop;
    var enemy = state.enemy;

    state.typeStatus = "neutral";
    state.typeText = "屬性均勢";

    if (player && enemy && player.beats === enemy.id) {
      state.typeStatus = "advantage";
      state.typeText = "屬性優勢";
    } else if (player && enemy && enemy.beats === player.id) {
      state.typeStatus = "disadvantage";
      state.typeText = "屬性劣勢";
    }
  }

  function renderBattleDom() {
    var p = findPlayerTop();
    var e = findEnemyTop();

    if (p && state.selectedTop) {
      p.classList.add("zg-player-top");
      p.classList.add(state.selectedTop.className || state.selectedTop.id);
      if (!p.innerHTML.trim()) {
        p.innerHTML = '<div class="zg-top-core">' + escapeHtml(state.selectedTop.icon) + '</div>';
      }
    }

    if (e && state.enemy) {
      e.classList.add("zg-enemy-top");
      e.classList.add(state.enemy.id);
      if (!e.innerHTML.trim()) {
        e.innerHTML = '<div class="zg-top-core">' + escapeHtml(state.enemy.icon) + '</div>';
      }
    }

    updateHpUi();

    var msg = findBattleMessage();
    if (msg) msg.textContent = "Battle Start！陀螺高速啟動！";
  }

  /* =========================================================
     Physics
     ========================================================= */

  function injectPhysicsCss() {
    if (qs("zelo-physics-css")) return;

    var style = document.createElement("style");
    style.id = "zelo-physics-css";
    style.textContent = `
      html, body {
        overflow-x: hidden !important;
      }

      .zg-arena,
      .battle-arena,
      .arena,
      .battle-stage,
      .game-arena,
      .stadium,
      .battle-field {
        position: relative !important;
        overflow: hidden !important;
        contain: layout paint !important;
      }

      .zelo-physics-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 3 !important;
        pointer-events: none !important;
        mix-blend-mode: screen;
      }

      .zelo-physics-top {
        position: absolute !important;
        z-index: 7 !important;
        transform-origin: center center !important;
        will-change: left, top, transform, filter !important;
        pointer-events: none !important;
        border-radius: 999px !important;
      }

      .zelo-physics-top::before {
        content: "";
        position: absolute;
        inset: -10%;
        border-radius: 999px;
        pointer-events: none;
        opacity: var(--zelo-spin-blur-opacity, 0.45);
        background: conic-gradient(
          from 0deg,
          rgba(255,255,255,0.7),
          transparent,
          rgba(255,255,255,0.45),
          transparent,
          rgba(255,255,255,0.7)
        );
        filter: blur(5px);
        animation: zeloPhysicsSpin 0.32s linear infinite;
        mix-blend-mode: screen;
      }

      @keyframes zeloPhysicsSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      .zelo-physics-hit {
        filter: brightness(1.55) saturate(1.45) drop-shadow(0 0 14px rgba(255,230,109,0.95)) !important;
      }

      .zelo-arena-shake {
        animation: zeloArenaShake 220ms ease-in-out;
      }

      @keyframes zeloArenaShake {
        0% { transform: translate3d(0,0,0); }
        20% { transform: translate3d(-5px,2px,0); }
        40% { transform: translate3d(5px,-2px,0); }
        60% { transform: translate3d(-3px,1px,0); }
        80% { transform: translate3d(3px,-1px,0); }
        100% { transform: translate3d(0,0,0); }
      }

      @media (max-width: 680px) {
        #zelo-liff-game {
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function setupCanvas() {
    var arena = findArena();
    if (!arena) return false;

    physics.arenaEl = arena;

    var canvas = arena.querySelector("#zelo-physics-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "zelo-physics-canvas";
      canvas.className = "zelo-physics-canvas";
      arena.insertBefore(canvas, arena.firstChild);
    }

    physics.canvas = canvas;
    physics.ctx = canvas.getContext("2d");

    resizePhysics();

    return true;
  }

  function resizePhysics() {
    if (!physics.arenaEl || !physics.canvas) return;

    var rect = physics.arenaEl.getBoundingClientRect();
    var width = Math.max(260, rect.width || 360);
    var height = Math.max(260, rect.height || 360);

    physics.dpr = Math.min(2, window.devicePixelRatio || 1);

    physics.canvas.width = Math.round(width * physics.dpr);
    physics.canvas.height = Math.round(height * physics.dpr);
    physics.canvas.style.width = width + "px";
    physics.canvas.style.height = height + "px";

    physics.arena.width = width;
    physics.arena.height = height;
    physics.arena.cx = width / 2;
    physics.arena.cy = height / 2;
    physics.arena.radius = Math.min(width, height) * 0.455;

    if (physics.ctx) {
      physics.ctx.setTransform(physics.dpr, 0, 0, physics.dpr, 0, 0);
    }

    clampTopHard(physics.player);
    clampTopHard(physics.enemy);
  }

  function createPhysicsTop(kind, el, config, x, y) {
    var launchAngle =
      kind === "player"
        ? rand(-Math.PI * 0.82, -Math.PI * 0.24)
        : rand(Math.PI * 0.18, Math.PI * 0.82);

    var launchSpeed = 2.2 + Number(config.speed || 70) / 38 + rand(-0.25, 0.35);

    return {
      kind: kind,
      el: el,
      config: config,

      x: x,
      y: y,
      vx: Math.cos(launchAngle) * launchSpeed,
      vy: Math.sin(launchAngle) * launchSpeed,

      angle: rand(0, Math.PI * 2),
      spin: 0.62 + Number(config.speed || 70) / 210 + rand(-0.025, 0.035),
      spinEnergy: 100,

      radius: Number(config.radius || 31),
      mass: Number(config.mass || 1),

      hp: Number(config.hp || 100),
      maxHp: Number(config.hp || 100),

      attackPower: Number(config.attack || 70),
      defensePower: Number(config.defense || 70),
      staminaPower: Number(config.stamina || 70),
      balancePower: Number(config.balance || 70),
      speedPower: Number(config.speed || 70),

      friction: 0.991 + Number(config.stamina || 70) / 40000,
      spinDecay: 0.9962 + Number(config.stamina || 70) / 85000,
      wallFriction: 0.875 + Number(config.balance || 70) / 1000,
      restitution: 0.76 + Number(config.balance || 70) / 650,

      wobble: 0,
      hitCooldown: 0,
      trail: [],

      color: config.color || "#ffffff",
      trailColor: config.trailColor || "255,255,255",

      typeAdvantage: false,
      alive: true
    };
  }

  function startBattlePhysics() {
    if (physics.running) return;

    if (!setupCanvas()) return;

    physics.playerEl = findPlayerTop();
    physics.enemyEl = findEnemyTop();

    if (!physics.playerEl || !physics.enemyEl) return;

    var a = physics.arena;

    var pConfig = state.selectedTop || tops.attack;
    var eConfig = state.enemy || enemies[0];

    physics.player = createPhysicsTop("player", physics.playerEl, pConfig, a.cx - a.radius * 0.32, a.cy + a.radius * 0.26);
    physics.enemy = createPhysicsTop("enemy", physics.enemyEl, eConfig, a.cx + a.radius * 0.32, a.cy - a.radius * 0.26);

    if (state.typeStatus === "advantage") physics.player.typeAdvantage = true;
    if (state.typeStatus === "disadvantage") physics.enemy.typeAdvantage = true;

    prepareTopEl(physics.player);
    prepareTopEl(physics.enemy);

    physics.particles = [];
    physics.shockwaves = [];
    physics.slashes = [];
    physics.lastHitAt = 0;
    physics.lastImpactPower = 0;

    physics.running = true;
    physics.lastTime = performance.now();

    cancelAnimationFrame(physics.frame);
    physics.frame = requestAnimationFrame(physicsLoop);
  }

  function stopBattlePhysics() {
    physics.running = false;
    cancelAnimationFrame(physics.frame);
  }

  function prepareTopEl(top) {
    if (!top || !top.el) return;

    top.el.classList.add("zelo-physics-top");
    top.el.style.position = "absolute";
    top.el.style.left = top.x + "px";
    top.el.style.top = top.y + "px";

    var rect = top.el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) {
      top.el.style.width = top.radius * 2 + "px";
      top.el.style.height = top.radius * 2 + "px";
    }
  }

  function physicsLoop(timestamp) {
    if (!physics.running) return;

    var dt = Math.min(32, timestamp - physics.lastTime) / 16.6667;
    physics.lastTime = timestamp;

    stepPhysics(dt);
    renderPhysics();

    if (state.battleDone) {
      stopBattlePhysics();
      return;
    }

    if (
      physics.player &&
      physics.enemy &&
      (!physics.player.alive || !physics.enemy.alive)
    ) {
      finishBattle();
      return;
    }

    if (Date.now() - state.battleStartAt > 32000) {
      finishBattle();
      return;
    }

    physics.frame = requestAnimationFrame(physicsLoop);
  }

  function stepPhysics(dt) {
    var p = physics.player;
    var e = physics.enemy;
    if (!p || !e) return;

    applyBowlForce(p, dt);
    applyBowlForce(e, dt);

    integrateTop(p, dt);
    integrateTop(e, dt);

    resolveArenaWall(p);
    resolveArenaWall(e);

    resolveTopCollision(p, e);

    applyEnergyLoss(p, dt);
    applyEnergyLoss(e, dt);

    updateTrail(p);
    updateTrail(e);

    p.hitCooldown = Math.max(0, p.hitCooldown - dt);
    e.hitCooldown = Math.max(0, e.hitCooldown - dt);

    state.playerHp = p.hp;
    state.enemyHp = e.hp;

    updateHpUi();
  }

  function applyBowlForce(top, dt) {
    var a = physics.arena;
    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var normalized = dist / a.radius;

    if (normalized <= 0.035) return;

    var slopeForce =
      normalized *
      normalized *
      0.072 *
      (1.15 - top.balancePower / 500);

    top.vx -= (dx / dist) * slopeForce * dt;
    top.vy -= (dy / dist) * slopeForce * dt;

    if (normalized > 0.72) {
      top.vx *= 0.965;
      top.vy *= 0.965;
      top.spinEnergy -= normalized * 0.018 * dt;
      top.wobble += normalized * 0.006 * dt;
    }
  }

  function integrateTop(top, dt) {
    top.x += top.vx * dt;
    top.y += top.vy * dt;

    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);
    var driftNoise = (1 - top.balancePower / 130) * 0.012;

    if (top.spinEnergy < 35) driftNoise += 0.012;

    top.vx += rand(-driftNoise, driftNoise) * dt;
    top.vy += rand(-driftNoise, driftNoise) * dt;

    top.angle += top.spin * (0.62 + top.spinEnergy / 80) * dt;

    if (speed < 0.08 && top.spinEnergy > 12) {
      top.vx += rand(-0.035, 0.035) * dt;
      top.vy += rand(-0.035, 0.035) * dt;
    }
  }

  function resolveArenaWall(top) {
    var a = physics.arena;
    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var maxDist = a.radius - top.radius - 4;

    if (dist <= maxDist) return;

    var nx = dx / dist;
    var ny = dy / dist;

    top.x = a.cx + nx * maxDist;
    top.y = a.cy + ny * maxDist;

    var velocityAlongNormal = top.vx * nx + top.vy * ny;

    if (velocityAlongNormal > 0) {
      top.vx -= (1 + top.restitution) * velocityAlongNormal * nx;
      top.vy -= (1 + top.restitution) * velocityAlongNormal * ny;

      top.vx *= top.wallFriction;
      top.vy *= top.wallFriction;

      var wallImpact = Math.abs(velocityAlongNormal);
      top.spinEnergy -= wallImpact * 0.34;
      top.wobble += wallImpact * 0.022;

      createWallSpark(top.x, top.y, top.color, wallImpact);
    }
  }

  function clampTopHard(top) {
    if (!top) return;

    var a = physics.arena;
    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var maxDist = a.radius - top.radius - 4;

    if (dist > maxDist) {
      top.x = a.cx + (dx / dist) * maxDist;
      top.y = a.cy + (dy / dist) * maxDist;
    }
  }

  function resolveTopCollision(a, b) {
    if (!a || !b || !a.alive || !b.alive) return false;

    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var minDist = a.radius + b.radius - 3;

    if (dist >= minDist) return false;

    var nx = dx / dist;
    var ny = dy / dist;

    var overlap = minDist - dist;

    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;

    var rvx = b.vx - a.vx;
    var rvy = b.vy - a.vy;
    var velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal > 0) return false;

    var restitution = Math.min(a.restitution, b.restitution);
    var invMassA = 1 / a.mass;
    var invMassB = 1 / b.mass;

    var impulse = -(1 + restitution) * velAlongNormal / (invMassA + invMassB);

    var impulseX = impulse * nx;
    var impulseY = impulse * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;
    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;

    var spinDiff = Math.abs(a.spin * a.spinEnergy - b.spin * b.spinEnergy);
    var impactPower = Math.abs(impulse) * 1.25 + spinDiff * 0.035;

    if (Date.now() - physics.lastHitAt > 90) {
      var damageToB = calculateDamage(a, b, impactPower);
      var damageToA = calculateDamage(b, a, impactPower * 0.84);

      b.hp = Math.max(0, b.hp - damageToB);
      a.hp = Math.max(0, a.hp - damageToA);

      a.spinEnergy -= impactPower * 0.16;
      b.spinEnergy -= impactPower * 0.16;

      a.wobble += impactPower / Math.max(90, a.balancePower * 2.15);
      b.wobble += impactPower / Math.max(90, b.balancePower * 2.15);

      a.hitCooldown = 8;
      b.hitCooldown = 8;

      physics.lastHitAt = Date.now();
      physics.lastImpactPower = impactPower;

      createImpactEffect(
        a.x + nx * a.radius,
        a.y + ny * a.radius,
        impactPower,
        a.color,
        b.color
      );

      updateBattleMessage(impactPower, damageToB, damageToA);
    }

    return true;
  }

  function calculateDamage(attacker, defender, impactPower) {
    var attackFactor = attacker.attackPower / 76;
    var defenseFactor = defender.defensePower / 92;
    var spinFactor = clamp(attacker.spinEnergy / 100, 0.18, 1.12);
    var massFactor = clamp(attacker.mass / defender.mass, 0.72, 1.34);

    var raw = impactPower * 0.24 * attackFactor * spinFactor * massFactor;
    var reduced = raw / Math.max(0.72, defenseFactor);

    if (attacker.typeAdvantage) reduced *= 1.14;
    if (defender.typeAdvantage) reduced *= 0.9;
    if (attacker.spinEnergy < 25) reduced *= 0.68;

    return Math.max(1, Math.round(reduced));
  }

  function applyEnergyLoss(top, dt) {
    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);

    top.vx *= Math.pow(top.friction, dt);
    top.vy *= Math.pow(top.friction, dt);

    var staminaFactor = 0.988 + top.staminaPower / 17000;
    top.spin *= Math.pow(top.spinDecay * staminaFactor, dt);

    var energyLoss =
      0.026 * dt +
      speed * 0.013 * dt +
      top.wobble * 0.019 * dt;

    if (top.hitCooldown > 0) energyLoss += 0.018 * dt;

    top.spinEnergy -= energyLoss;
    top.wobble *= Math.pow(0.991, dt);

    if (top.spinEnergy < 42) top.wobble += 0.006 * dt;
    if (top.spinEnergy < 20) top.wobble += 0.016 * dt;
    if (top.spinEnergy < 10) {
      top.wobble += 0.026 * dt;
      top.vx *= 0.996;
      top.vy *= 0.996;
    }

    top.spinEnergy = clamp(top.spinEnergy, 0, 100);

    if (top.spinEnergy <= 1.2 || top.hp <= 0) {
      top.alive = false;
    }
  }

  function updateTrail(top) {
    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);

    top.trail.push({
      x: top.x,
      y: top.y,
      energy: top.spinEnergy,
      speed: speed,
      alpha: clamp(top.spinEnergy / 100, 0.12, 0.82)
    });

    var maxTrail = Math.round(10 + top.spinEnergy / 3.1 + speed * 2.2);

    while (top.trail.length > maxTrail) {
      top.trail.shift();
    }
  }

  function renderPhysics() {
    drawCanvas();
    renderTop(physics.player);
    renderTop(physics.enemy);
  }

  function renderTop(top) {
    if (!top || !top.el) return;

    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);
    var wobblePower = clamp(top.wobble, 0, 2.8);
    var wobbleScale = 1 + Math.sin(performance.now() / 42) * wobblePower * 0.026;

    var blur = clamp(speed * 0.12 + top.spinEnergy / 240, 0, 1.5);
    var brightness = 0.76 + top.spinEnergy / 150;
    var saturate = 1.05 + top.spinEnergy / 260;

    var lowEnergyTilt = 0;
    if (top.spinEnergy < 28) {
      lowEnergyTilt = Math.sin(performance.now() / 70) * (28 - top.spinEnergy) * 0.013;
    }

    top.el.style.left = top.x + "px";
    top.el.style.top = top.y + "px";
    top.el.style.transform =
      "translate(-50%, -50%) rotate(" +
      top.angle +
      "rad) scale(" +
      wobbleScale +
      ") skew(" +
      lowEnergyTilt +
      "rad, " +
      -lowEnergyTilt * 0.62 +
      "rad)";

    top.el.style.filter =
      "blur(" +
      blur.toFixed(2) +
      "px) brightness(" +
      brightness.toFixed(2) +
      ") saturate(" +
      saturate.toFixed(2) +
      ")";

    top.el.style.setProperty("--zelo-spin-blur-opacity", String(clamp(speed / 8 + top.spinEnergy / 180, 0.1, 0.88)));
  }

  function drawCanvas() {
    var ctx = physics.ctx;
    if (!ctx) return;

    var w = physics.arena.width;
    var h = physics.arena.height;

    ctx.clearRect(0, 0, w, h);

    drawArenaEnergy(ctx);
    drawTrail(ctx, physics.player);
    drawTrail(ctx, physics.enemy);
    drawParticles(ctx);
    drawShockwaves(ctx);
    drawSlashes(ctx);
  }

  function drawArenaEnergy(ctx) {
    var a = physics.arena;

    ctx.save();

    var gradient = ctx.createRadialGradient(a.cx, a.cy, a.radius * 0.18, a.cx, a.cy, a.radius);
    gradient.addColorStop(0, "rgba(255,255,255,0.018)");
    gradient.addColorStop(0.62, "rgba(0,178,255,0.026)");
    gradient.addColorStop(1, "rgba(255,47,82,0.04)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(a.cx, a.cy, a.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 9]);
    ctx.beginPath();
    ctx.arc(a.cx, a.cy, a.radius * 0.73, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  function drawTrail(ctx, top) {
    if (!top || !top.trail || top.trail.length < 2) return;

    for (var i = 1; i < top.trail.length; i++) {
      var prev = top.trail[i - 1];
      var curr = top.trail[i];

      var life = i / top.trail.length;
      var alpha = curr.alpha * life * 0.56;
      var width = 2 + curr.speed * 0.75 + curr.energy / 42;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(" + top.trailColor + "," + alpha + ")";
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function createImpactEffect(x, y, power, colorA, colorB) {
    power = clamp(power || 8, 4, 48);

    var count = Math.round(10 + power * 0.62);

    for (var i = 0; i < count; i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(1.1, 3.1 + power * 0.075);

      physics.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(18, 32),
        maxLife: 32,
        size: rand(1.5, 4.0),
        color: Math.random() > 0.5 ? colorA : colorB,
        alpha: 1
      });
    }

    physics.shockwaves.push({
      x: x,
      y: y,
      r: 8,
      life: 24,
      maxLife: 24,
      color: colorA || "#ffffff",
      power: power
    });

    physics.slashes.push({
      x: x,
      y: y,
      angle: rand(-Math.PI, Math.PI),
      life: 15,
      maxLife: 15,
      length: 52 + power * 1.6
    });

    shakeArena();
    flashTop(physics.playerEl);
    flashTop(physics.enemyEl);
  }

  function createWallSpark(x, y, color, power) {
    power = clamp(power || 2, 1, 12);

    for (var i = 0; i < Math.round(3 + power * 1.0); i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(0.7, 1.7 + power * 0.1);

      physics.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(10, 20),
        maxLife: 20,
        size: rand(1.1, 3.0),
        color: color || "#ffffff",
        alpha: 0.72
      });
    }
  }

  function drawParticles(ctx) {
    for (var i = physics.particles.length - 1; i >= 0; i--) {
      var p = physics.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.972;
      p.vy *= 0.972;
      p.life -= 1;

      var alpha = Math.max(0, p.life / p.maxLife) * p.alpha;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.life <= 0) physics.particles.splice(i, 1);
    }
  }

  function drawShockwaves(ctx) {
    for (var i = physics.shockwaves.length - 1; i >= 0; i--) {
      var s = physics.shockwaves[i];

      s.r += 2.4 + s.power * 0.03;
      s.life -= 1;

      var alpha = Math.max(0, s.life / s.maxLife);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.68;
      ctx.lineWidth = 2.1 + s.power * 0.03;
      ctx.shadowBlur = 18;
      ctx.shadowColor = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (s.life <= 0) physics.shockwaves.splice(i, 1);
    }
  }

  function drawSlashes(ctx) {
    for (var i = physics.slashes.length - 1; i >= 0; i--) {
      var s = physics.slashes[i];

      s.life -= 1;

      var alpha = Math.max(0, s.life / s.maxLife);
      var half = s.length / 2;

      var x1 = s.x + Math.cos(s.angle) * -half;
      var y1 = s.y + Math.sin(s.angle) * -half;
      var x2 = s.x + Math.cos(s.angle) * half;
      var y2 = s.y + Math.sin(s.angle) * half;

      var grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, "rgba(255,255,255," + alpha + ")");
      grad.addColorStop(1, "rgba(255,0,64,0)");

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = grad;
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      if (s.life <= 0) physics.slashes.splice(i, 1);
    }
  }

  function shakeArena() {
    if (!physics.arenaEl) return;

    physics.arenaEl.classList.remove("zelo-arena-shake");
    void physics.arenaEl.offsetWidth;
    physics.arenaEl.classList.add("zelo-arena-shake");
  }

  function flashTop(el) {
    if (!el) return;

    el.classList.add("zelo-physics-hit");

    setTimeout(function () {
      el.classList.remove("zelo-physics-hit");
    }, 160);
  }

  function updateBattleMessage(power, damageToEnemy, damageToPlayer) {
    var el = findBattleMessage();
    if (!el) return;

    if (power > 34) {
      el.textContent = "Burst Impact！強烈撞擊造成大量能量損耗！";
    } else if (damageToEnemy > damageToPlayer + 3) {
      el.textContent = "漂亮打擊！你的陀螺取得碰撞優勢！";
    } else if (damageToPlayer > damageToEnemy + 3) {
      el.textContent = "敵方反擊！你的陀螺開始失衡！";
    } else {
      el.textContent = "Spin Clash！雙方高速互撞，火花四散！";
    }
  }

  function updateHpUi() {
    var playerPercent = clamp(Math.round((state.playerHp / state.playerMaxHp) * 100), 0, 100);
    var enemyPercent = clamp(Math.round((state.enemyHp / state.enemyMaxHp) * 100), 0, 100);

    var playerFill = qs("zg-player-hp") || one(".zg-player-hp") || one(".player-hp");
    var enemyFill = qs("zg-enemy-hp") || one(".zg-enemy-hp") || one(".enemy-hp");

    if (playerFill) playerFill.style.width = playerPercent + "%";
    if (enemyFill) enemyFill.style.width = enemyPercent + "%";

    safeText("zg-player-hp-text", playerPercent + "%");
    safeText("zg-enemy-hp-text", enemyPercent + "%");

    var hpTexts = all(".zg-hp-percent, .hp-percent");
    if (hpTexts[0]) hpTexts[0].textContent = playerPercent + "%";
    if (hpTexts[1]) hpTexts[1].textContent = enemyPercent + "%";
  }

  /* =========================================================
     Finish / Result
     ========================================================= */

  function finishBattle() {
    if (state.battleDone) return;

    state.battleDone = true;
    stopBattlePhysics();

    var p = physics.player;
    var e = physics.enemy;

    if (p) {
      state.playerHp = p.hp;
    }

    if (e) {
      state.enemyHp = e.hp;
    }

    var elapsed = Math.max(1, Math.round((Date.now() - state.battleStartAt) / 1000));

    var playerValue =
      ((p && p.hp ? p.hp : state.playerHp) / state.playerMaxHp) * 0.45 +
      ((p && p.spinEnergy ? p.spinEnergy : 0) / 100) * 0.35 +
      0.2;

    var enemyValue =
      ((e && e.hp ? e.hp : state.enemyHp) / state.enemyMaxHp) * 0.45 +
      ((e && e.spinEnergy ? e.spinEnergy : 0) / 100) * 0.35 +
      0.2;

    var isWin = playerValue >= enemyValue;

    if (state.enemyHp <= 0 || (e && e.spinEnergy <= 1.2)) isWin = true;
    if (state.playerHp <= 0 || (p && p.spinEnergy <= 1.2)) isWin = false;

    var hpBonus = Math.max(0, Math.round((state.playerHp / state.playerMaxHp) * 900));
    var spinBonus = Math.max(0, Math.round((p ? p.spinEnergy : 0) * 8));
    var winBonus = isWin ? 1500 : 320;
    var typeBonus = state.typeStatus === "advantage" ? 280 : 0;
    var timeBonus = Math.max(0, 560 - elapsed * 14);
    var impactBonus = Math.min(420, Math.round((physics.lastImpactPower || 0) * 9));

    state.score = Math.max(50, Math.round(winBonus + hpBonus + spinBonus + typeBonus + timeBonus + impactBonus + rand(0, 260)));
    state.rank = calculateRank(state.score);
    state.couponReward = pick(isWin ? coupons.win : coupons.lose);
    state.coupon = state.couponReward.code;

    increaseDailyPlay();

    renderResult(isWin, elapsed);
    logResult(isWin, elapsed);

    go("screen-result");
  }

  function calculateRank(score) {
    if (score >= 3100) return "S";
    if (score >= 2300) return "A";
    if (score >= 1300) return "B";
    return "C";
  }

  function renderResult(isWin, elapsed) {
    safeText("zg-result-medal", isWin ? "W" : "L");
    safeText("zg-result-title", isWin ? "勝利！取得專屬獎勵" : "挑戰完成！取得獎勵");
    safeText("zg-result-score", "本次分數：" + state.score + " 分");

    safeText("zg-coupon-label", state.couponReward.label);
    safeText("zg-coupon-code", state.couponReward.code);
    safeText("zg-coupon-note", state.couponReward.note);
    safeText("zg-copy-coupon-btn", "複製折扣碼：" + state.couponReward.code);

    renderFriendRank();
    fixResultButtons();

    try {
      localStorage.setItem("zg_last_result", JSON.stringify({
        result: isWin ? "win" : "lose",
        score: state.score,
        rank: state.rank,
        coupon: state.coupon,
        duration: elapsed,
        timestamp: nowIso()
      }));
      localStorage.setItem("zg_last_score", String(state.score));
      localStorage.setItem("zg_last_coupon", state.coupon);
    } catch (err) {}
  }

  function logResult(isWin, elapsed) {
    if (state.resultLogged) return;
    state.resultLogged = true;

    track("result", {
      result: isWin ? "win" : "lose",
      score: state.score,
      rank: state.rank,
      coupon: state.coupon,
      couponCode: state.coupon,
      topId: state.selectedTop && state.selectedTop.id,
      topName: state.selectedTop && state.selectedTop.name,
      topType: state.selectedTop && state.selectedTop.typeName,
      enemyId: state.enemy && state.enemy.id,
      enemyName: state.enemy && state.enemy.name,
      enemyType: state.enemy && state.enemy.typeName,
      typeStatus: state.typeStatus,
      typeText: state.typeText,
      duration: elapsed,
      playerHp: Math.round(state.playerHp),
      enemyHp: Math.round(state.enemyHp),
      playerSpinEnergy: physics.player ? Math.round(physics.player.spinEnergy) : 0,
      enemySpinEnergy: physics.enemy ? Math.round(physics.enemy.spinEnergy) : 0,
      lastImpactPower: Math.round(physics.lastImpactPower || 0),
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });
  }

  function renderFriendRank() {
    var el = qs("zg-friend-rank") || one(".zg-friend-rank") || one(".friend-rank");
    if (!el) return;

    var list = [];

    try {
      var saved = localStorage.getItem("zg_real_friend_ranks") || localStorage.getItem("zg_friends") || "[]";
      list = JSON.parse(saved);
      if (!Array.isArray(list)) list = [];
    } catch (err) {
      list = [];
    }

    var current = {
      userId: getUserId(),
      playerName: getPlayerName(),
      score: state.score,
      rank: state.rank,
      isMe: true
    };

    list = list.filter(function (item) {
      return item && item.userId !== current.userId;
    });

    list.push(current);

    list.sort(function (a, b) {
      return Number(b.score || 0) - Number(a.score || 0);
    });

    list = list.slice(0, 10);

    el.innerHTML = list.map(function (item, index) {
      return (
        '<div class="zg-rank-row ' + (item.isMe ? "me" : "") + '">' +
          '<div class="zg-rank-no">' + (index + 1) + '</div>' +
          '<div class="zg-rank-name">' + escapeHtml(item.playerName || item.displayName || "好友") + (item.isMe ? "（你）" : "") + '</div>' +
          '<div class="zg-rank-score">' + Number(item.score || 0) + '</div>' +
        '</div>'
      );
    }).join("");

    try {
      localStorage.setItem("zg_real_friend_ranks", JSON.stringify(list));
    } catch (err) {}
  }

  /* =========================================================
     Result Buttons
     ========================================================= */

  function detectButtonType(text) {
    text = String(text || "").replace(/\s+/g, "");

    if (text.indexOf("再戰一次") !== -1 || text.indexOf("再玩一次") !== -1) {
      return { type: "retry", label: "再戰一次" };
    }

    if (text.indexOf("更換陀螺") !== -1 || text.indexOf("重新選擇") !== -1 || text.indexOf("選擇陀螺") !== -1) {
      return { type: "change-top", label: "更換陀螺" };
    }

    if (text.indexOf("邀請好友") !== -1 || text.indexOf("分享好友") !== -1 || text.indexOf("分享給好友") !== -1) {
      return { type: "share", label: "邀請好友" };
    }

    if (text.indexOf("返回首頁") !== -1 || text.indexOf("回首頁") !== -1 || text === "首頁") {
      return { type: "home", label: "返回首頁" };
    }

    return null;
  }

  function fixResultButtons() {
    var buttons = all("button, a, [role='button']").filter(function (el) {
      return !!detectButtonType(el.textContent || "");
    });

    var kept = {};

    buttons.forEach(function (btn) {
      var cfg = detectButtonType(btn.textContent || "");
      if (!cfg) return;

      if (!kept[cfg.type]) {
        kept[cfg.type] = btn;
        btn.textContent = cfg.label;
        btn.setAttribute("data-action", cfg.type);
        btn.style.display = "";
      } else {
        btn.style.display = "none";
        btn.setAttribute("data-zelo-duplicate-hidden", "true");
      }
    });
  }

  /* =========================================================
     Actions
     ========================================================= */

  function copyCoupon() {
    var code = state.coupon || "ZELOPLAY";

    function done() {
      toast("折扣碼已複製：" + code);
      track("coupon_copy", {
        coupon: code,
        couponCode: code,
        score: state.score,
        rank: state.rank,
        source: "result_page"
      });
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(function () {
        fallbackCopy(code);
        done();
      });
    } else {
      fallbackCopy(code);
      done();
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand("copy");
    } catch (err) {}

    document.body.removeChild(textarea);
  }

  function downloadCouponImage() {
    var code = state.coupon || "ZELOPLAY";

    track("coupon_download", {
      coupon: code,
      couponCode: code,
      score: state.score,
      rank: state.rank,
      source: "result_page"
    });

    try {
      var canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;

      var ctx = canvas.getContext("2d");

      var gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
      gradient.addColorStop(0, "#fff2a8");
      gradient.addColorStop(0.48, "#ffcc00");
      gradient.addColorStop(1, "#ff8a00");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1080);

      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";

      ctx.font = "bold 86px Arial";
      ctx.fillText("ZELO SPORT", 540, 210);

      ctx.font = "bold 68px Arial";
      ctx.fillText("專屬折扣碼", 540, 370);

      ctx.font = "bold 118px Arial";
      ctx.fillText(code, 540, 540);

      ctx.font = "bold 42px Arial";
      ctx.fillText("結帳時輸入折扣碼即可使用", 540, 680);

      ctx.font = "bold 38px Arial";
      ctx.fillText("戰鬥陀螺挑戰獎勵", 540, 820);

      var link = document.createElement("a");
      link.download = "zelo-coupon-" + code + ".png";
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast("折扣券圖片已下載");
    } catch (err) {
      toast("下載失敗，請截圖保存折扣碼");
    }
  }

  function shareGame() {
    var code = state.coupon || "ZELOPLAY";
    var url = new URL(location.href);
    var userId = getUserId();
    var playerName = getPlayerName();

    if (userId) url.searchParams.set("inviterId", userId);
    if (playerName) url.searchParams.set("inviterName", playerName);

    var text =
      "我在 ZELO 戰鬥陀螺挑戰拿到 " +
      state.score +
      " 分！一起來挑戰，還有機會拿折扣碼 " +
      code +
      "。";

    track("share", {
      score: state.score,
      rank: state.rank,
      coupon: code,
      couponCode: code,
      shareUrl: url.toString(),
      source: "result_page"
    });

    if (
      window.liff &&
      typeof window.liff.isApiAvailable === "function" &&
      window.liff.isApiAvailable("shareTargetPicker")
    ) {
      window.liff.shareTargetPicker([
        {
          type: "text",
          text: text + "\n" + url.toString()
        }
      ]).then(function () {
        toast("已開啟分享");
      }).catch(function () {
        fallbackShare(text, url.toString());
      });

      return;
    }

    fallbackShare(text, url.toString());
  }

  function fallbackShare(text, url) {
    if (navigator.share) {
      navigator.share({
        title: "ZELO 戰鬥陀螺挑戰",
        text: text,
        url: url
      }).catch(function () {});
      return;
    }

    fallbackCopy(text + "\n" + url);
    toast("分享連結已複製");
  }

  function goHome() {
    track("official_click", {
      source: "result_page",
      targetUrl: SHOP_URL
    });

    location.href = SHOP_URL;
  }

  function handleAction(action) {
    switch (action) {
      case "start":
        loadDailyLimit();
        if (isDailyBlocked()) {
          track("blocked", {
            reason: "daily_limit",
            playsUsed: state.playsUsed,
            remainingPlays: state.remainingPlays
          });
          toast("今日挑戰次數已用完");
          return;
        }
        go("screen-select");
        break;

      case "back-start":
        go("screen-start");
        break;

      case "launch":
      case "start-battle":
        startBattle();
        break;

      case "retry":
        track("play_again", {
          score: state.score,
          rank: state.rank,
          coupon: state.coupon,
          source: "result_page"
        });
        startBattle();
        break;

      case "change-top":
        track("change_top", {
          source: "result_page"
        });
        go("screen-select");
        break;

      case "share":
        shareGame();
        break;

      case "copy-coupon":
        copyCoupon();
        break;

      case "download-coupon":
        downloadCouponImage();
        break;

      case "home":
        goHome();
        break;

      case "exit-battle":
        stopBattlePhysics();
        go("screen-select");
        break;

      default:
        break;
    }
  }

  /* =========================================================
     Event Binding
     ========================================================= */

  function bindEvents() {
    document.addEventListener("click", function (event) {
      var topCard = event.target.closest("[data-top-id]");
      if (topCard) {
        selectTop(topCard.getAttribute("data-top-id"));
        return;
      }

      var actionEl = event.target.closest("[data-action]");
      if (actionEl) {
        var action = actionEl.getAttribute("data-action");
        handleAction(action);
        return;
      }

      var btn = event.target.closest("button, a, [role='button']");
      if (!btn) return;

      var cfg = detectButtonType(btn.textContent || "");
      if (cfg) {
        handleAction(cfg.type);
      }
    }, true);

    window.addEventListener("resize", function () {
      setH();
      setTimeout(resizePhysics, 80);
      setTimeout(resizePhysics, 260);
    });

    window.addEventListener("orientationchange", function () {
      setH();
      setTimeout(resizePhysics, 160);
      setTimeout(resizePhysics, 520);
    });

    var observer = new MutationObserver(function () {
      setTimeout(fixResultButtons, 120);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    setInterval(fixResultButtons, 1200);
  }

  /* =========================================================
     LIFF / Profile
     ========================================================= */

  function initProfile() {
    state.profile = getProfile();

    state.inviterId = getUrlParam("inviterId") || getUrlParam("ref") || getUrlParam("referrerId") || "";
    state.inviterName = getUrlParam("inviterName") || getUrlParam("refName") || getUrlParam("referrerName") || "";

    try {
      if (
        window.liff &&
        typeof window.liff.getProfile === "function" &&
        (!window.liff.isLoggedIn || window.liff.isLoggedIn())
      ) {
        window.liff.getProfile().then(function (profile) {
          if (!profile) return;

          state.profile = profile;
          window.ZELO_PROFILE = profile;

          try {
            localStorage.setItem("zg_profile", JSON.stringify(profile));
          } catch (err) {}
        }).catch(function () {});
      }
    } catch (err) {}
  }

  /* =========================================================
     Legacy API
     ========================================================= */

  window.zeloStartGame = function () {
    handleAction("start");
  };

  window.zeloRetry = function () {
    handleAction("retry");
  };

  window.zeloShare = function () {
    handleAction("share");
  };

  window.zeloCopyCoupon = function () {
    handleAction("copy-coupon");
  };

  window.zeloDownloadCoupon = function () {
    handleAction("download-coupon");
  };

  window.zeloGoHome = function () {
    handleAction("home");
  };

  window.zeloChangeTop = function () {
    handleAction("change-top");
  };

  window.zeloSelectTop = function (id) {
    selectTop(id);
  };

  window.zeloStartBattle = function () {
    startBattle();
  };

  window.startBattle = startBattle;
  window.finishBattle = finishBattle;
  window.playZeloHitEffect = function () {
    if (physics.player && physics.enemy) {
      createImpactEffect(
        (physics.player.x + physics.enemy.x) / 2,
        (physics.player.y + physics.enemy.y) / 2,
        18,
        physics.player.color,
        physics.enemy.color
      );
    }
  };

  window.ZELO_GAME_VERSION = VERSION;
  window.ZELO_GAME_STATE = state;
  window.ZELO_GAME_PHYSICS = physics;

  /* =========================================================
     Init
     ========================================================= */

  function init() {
    setH();
    injectPhysicsCss();
    initProfile();
    loadSelectedTop();
    loadDailyLimit();
    renderTopList();
    bindEvents();
    fixResultButtons();

    console.log("[ZELO] game.js loaded:", VERSION);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
