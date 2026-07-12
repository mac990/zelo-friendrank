/*!
 * =========================================================
 * ZELO LIFF BEYBLADE GAME
 * game.js
 * Version: 202607130545-physics
 *
 * Major Update:
 * - Realistic beyblade physics engine
 * - Bowl arena force
 * - Kinetic / spin energy decay
 * - Collision impulse
 * - Trail canvas
 * - Hit particles
 * - Mobile boundary fix
 * - Result button dedupe
 * - Dashboard event tracking
 * =========================================================
 */

(function () {
  "use strict";

  /*
   * =========================================================
   * 01. CONFIG
   * =========================================================
   */

  var VERSION = "202607130545-physics";

  var LIFF_ID = window.ZELO_LIFF_ID || "2007022255-ph9gRwPs";

  var SHOP_URL =
    window.ZELO_SHOP_URL ||
    "https://zelosportivo.com/zh";

  var GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

  var DAILY_LIMIT = 3;
  var ROOT_ID = "zelo-liff-game";

  var STORAGE = {
    profile: "zg_profile",
    selectedTop: "zg_selected_top",
    lastResult: "zg_last_result",
    lastScore: "zg_last_score",
    bestScore: "zg_best_score",
    lastCoupon: "zg_last_coupon",
    friends: "zg_friends",
    realFriendRanks: "zg_real_friend_ranks",
    dailyPlay: "zg_daily_play_"
  };

  var SCREENS = {
    start: "screen-start",
    select: "screen-select",
    battle: "screen-battle",
    result: "screen-result"
  };

  var EVENT_TYPES = {
    result: "result",
    share: "share",
    officialClick: "official_click",
    couponCopy: "coupon_copy",
    couponDownload: "coupon_download",
    couponRedeem: "coupon_redeem",
    playAgain: "play_again",
    changeTop: "change_top",
    blocked: "blocked"
  };

  /*
   * =========================================================
   * 02. GAME DATA
   * =========================================================
   */

  var TOPS = {
    attack: {
      id: "attack",
      name: "火焰衝擊",
      typeName: "攻擊型",
      icon: "🔥",
      className: "attack",
      attack: 96,
      defense: 54,
      stamina: 48,
      balance: 58,
      speed: 96,
      mass: 0.92,
      radius: 31,
      hp: 100,
      beats: "stamina",
      color: "#ff1744",
      trailColor: "255, 23, 68"
    },
    defense: {
      id: "defense",
      name: "鋼鐵堡壘",
      typeName: "防禦型",
      icon: "🛡️",
      className: "defense",
      attack: 56,
      defense: 98,
      stamina: 66,
      balance: 78,
      speed: 58,
      mass: 1.22,
      radius: 33,
      hp: 118,
      beats: "attack",
      color: "#2196f3",
      trailColor: "33, 150, 243"
    },
    stamina: {
      id: "stamina",
      name: "風暴長旋",
      typeName: "持久型",
      icon: "🌪️",
      className: "stamina",
      attack: 62,
      defense: 64,
      stamina: 98,
      balance: 86,
      speed: 70,
      mass: 1.02,
      radius: 30,
      hp: 108,
      beats: "defense",
      color: "#00e676",
      trailColor: "0, 230, 118"
    },
    balance: {
      id: "balance",
      name: "星環平衡",
      typeName: "平衡型",
      icon: "🌀",
      className: "balance",
      attack: 76,
      defense: 76,
      stamina: 76,
      balance: 90,
      speed: 76,
      mass: 1.04,
      radius: 31,
      hp: 110,
      beats: "",
      color: "#ffd54f",
      trailColor: "255, 213, 79"
    }
  };

  var ENEMIES = [
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
      trailColor: "255, 23, 68"
    },
    {
      id: "defense",
      name: "藍盾對手",
      typeName: "防禦型",
      icon: "🛡️",
      attack: 58,
      defense: 90,
      stamina: 68,
      balance: 78,
      speed: 58,
      mass: 1.18,
      radius: 33,
      hp: 112,
      beats: "attack",
      color: "#2196f3",
      trailColor: "33, 150, 243"
    },
    {
      id: "stamina",
      name: "綠旋對手",
      typeName: "持久型",
      icon: "🌪️",
      attack: 62,
      defense: 66,
      stamina: 90,
      balance: 84,
      speed: 68,
      mass: 1.02,
      radius: 30,
      hp: 108,
      beats: "defense",
      color: "#00e676",
      trailColor: "0, 230, 118"
    }
  ];

  var COUPONS = {
    win: [
      {
        label: "恭喜你贏得折扣碼",
        code: "ZELO500",
        title: "500 元折扣券",
        note: "結帳時輸入折扣碼即可使用。"
      },
      {
        label: "恭喜你贏得折扣碼",
        code: "BATTLE300",
        title: "300 元折扣券",
        note: "結帳時輸入折扣碼即可使用。"
      },
      {
        label: "恭喜你贏得折扣碼",
        code: "SPIN10",
        title: "9 折優惠券",
        note: "結帳時輸入折扣碼即可使用。"
      }
    ],
    lose: [
      {
        label: "挑戰者獎勵",
        code: "TRY100",
        title: "100 元折扣券",
        note: "下次再挑戰，也可以使用本折扣碼。"
      },
      {
        label: "再接再厲獎勵",
        code: "RETRY50",
        title: "50 元折扣券",
        note: "結帳時輸入折扣碼即可使用。"
      }
    ]
  };

  /*
   * =========================================================
   * 03. STATE
   * =========================================================
   */

  var state = {
    root: null,
    currentScreen: "start",

    profile: null,
    selectedTop: null,
    enemy: null,

    inviterId: "",
    inviterName: "",

    isBlocked: false,
    blockedCoupon: "",
    blockReason: "",
    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    battleRunning: false,
    battleDone: false,
    resultLogged: false,
    battleFrame: null,
    battleStartAt: 0,
    lastFrameAt: 0,

    arena: {
      width: 360,
      height: 360,
      radius: 160,
      cx: 180,
      cy: 180,
      bowlStrength: 0.072,
      edgeDrag: 0.965
    },

    physicsPlayer: null,
    physicsEnemy: null,

    particles: [],
    shockwaves: [],
    slashEffects: [],

    canvas: null,
    ctx: null,
    dpr: 1,

    playerHp: 100,
    enemyHp: 100,
    playerMaxHp: 100,
    enemyMaxHp: 100,

    score: 0,
    rank: "B",
    coupon: "ZELOPLAY",
    lastCouponReward: null,
    lastResult: null,

    typeStatus: "neutral",
    typeText: "屬性均勢",

    toastTimer: null,
    lastHitAt: 0,
    lastImpactPower: 0,
    battleMessageTimer: 0
  };

  /*
   * =========================================================
   * 04. DOM / UTIL HELPERS
   * =========================================================
   */

  function qs(idOrSelector, scope) {
    scope = scope || document;

    if (!idOrSelector) return null;

    if (
      idOrSelector.charAt(0) === "#" ||
      idOrSelector.charAt(0) === "." ||
      idOrSelector.indexOf("[") === 0
    ) {
      return scope.querySelector(idOrSelector);
    }

    return document.getElementById(idOrSelector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function safeText(id, text) {
    var el = qs(id);
    if (el) {
      el.textContent = text;
    }
  }

  function safeHtml(id, html) {
    var el = qs(id);
    if (el) {
      el.innerHTML = html;
    }
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

  function getTodayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function setH() {
    var h =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      screen.height ||
      720;

    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return fallback;
    }
  }

  function getUrlParam(name) {
    try {
      var params = new URLSearchParams(window.location.search || "");
      return params.get(name) || "";
    } catch (err) {
      return "";
    }
  }

  function getInviteParams() {
    return {
      inviterId:
        getUrlParam("inviterId") ||
        getUrlParam("ref") ||
        getUrlParam("referrerId") ||
        getUrlParam("fromUserId") ||
        "",
      inviterName:
        getUrlParam("inviterName") ||
        getUrlParam("refName") ||
        getUrlParam("referrerName") ||
        ""
    };
  }

  function getProfile() {
    if (window.ZELO_PROFILE) {
      return window.ZELO_PROFILE;
    }

    try {
      var saved = localStorage.getItem(STORAGE.profile);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {}

    return null;
  }

  function getPlayerName() {
    var profile = state.profile || getProfile() || {};

    return (
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      "你"
    );
  }

  function getUserId() {
    var profile = state.profile || getProfile() || {};

    return (
      profile.userId ||
      profile.id ||
      profile.uid ||
      ""
    );
  }

  function go(screenId) {
    qsa(".zg-screen").forEach(function (screen) {
      screen.classList.remove("active");
    });

    var target = qs(screenId);
    if (target) {
      target.classList.add("active");
    }

    state.currentScreen = screenId;
    setH();

    if (screenId === SCREENS.battle) {
      setTimeout(resizeBattleCanvas, 60);
      setTimeout(resizeBattleCanvas, 240);
    }

    if (screenId === SCREENS.result) {
      setTimeout(fixResultButtons, 80);
      setTimeout(fixResultButtons, 280);
    }
  }

  function toast(text) {
    var el = qs("zg-toast");

    if (!el) {
      try {
        console.log("[ZELO toast]", text);
      } catch (err) {}
      return;
    }

    clearTimeout(state.toastTimer);

    el.textContent = text;
    el.style.display = "block";

    state.toastTimer = setTimeout(function () {
      el.style.display = "none";
    }, 1700);
  }

  /*
   * =========================================================
   * 05. TRACKING / GOOGLE SCRIPT
   * =========================================================
   */

  function normalizeEventType(eventType) {
    var t = String(eventType || "").toLowerCase().trim();

    if (!t) return "";

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

    if (t === "couponused") return "coupon_redeem";
    if (t === "redeem") return "coupon_redeem";

    return t;
  }

  function enrichPayload(payload) {
    payload = payload || {};

    var profile = state.profile || getProfile() || {};
    var invite = getInviteParams();
    var merged = {};

    Object.keys(payload).forEach(function (key) {
      merged[key] = payload[key];
    });

    merged.eventType = normalizeEventType(merged.eventType || "");

    if (!merged.userId && profile.userId) merged.userId = profile.userId;
    if (!merged.userId && profile.id) merged.userId = profile.id;
    if (!merged.userId && profile.uid) merged.userId = profile.uid;

    if (!merged.displayName && profile.displayName) merged.displayName = profile.displayName;
    if (!merged.displayName && profile.name) merged.displayName = profile.name;

    if (!merged.playerName && profile.displayName) merged.playerName = profile.displayName;
    if (!merged.playerName && profile.name) merged.playerName = profile.name;
    if (!merged.playerName) merged.playerName = "你";

    if (!merged.pictureUrl && profile.pictureUrl) merged.pictureUrl = profile.pictureUrl;

    if (!merged.inviterId && state.inviterId) merged.inviterId = state.inviterId;
    if (!merged.inviterId && invite.inviterId) merged.inviterId = invite.inviterId;

    if (!merged.inviterName && state.inviterName) merged.inviterName = state.inviterName;
    if (!merged.inviterName && invite.inviterName) merged.inviterName = invite.inviterName;

    if (!merged.pageUrl) merged.pageUrl = window.location.href;
    if (!merged.userAgent) merged.userAgent = navigator.userAgent || "";
    if (!merged.timestamp && !merged.playedAt) merged.timestamp = nowIso();

    merged.version = VERSION;

    return merged;
  }

  function jsonpCall(params, onResult, timeoutMs) {
    timeoutMs = timeoutMs || 8000;

    if (!GOOGLE_SCRIPT_URL) {
      if (onResult) onResult(null);
      return;
    }

    var callbackName =
      "zeloCb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    var timeoutId = null;
    var script = document.createElement("script");

    window[callbackName] = function (data) {
      if (timeoutId) clearTimeout(timeoutId);

      try {
        if (onResult) onResult(data);
      } catch (err) {}

      try {
        delete window[callbackName];
      } catch (err2) {
        window[callbackName] = undefined;
      }

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    var query = [];

    Object.keys(params || {}).forEach(function (key) {
      query.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
      );
    });

    query.push("callback=" + encodeURIComponent(callbackName));
    query.push("_t=" + Date.now());

    script.src =
      GOOGLE_SCRIPT_URL +
      (GOOGLE_SCRIPT_URL.indexOf("?") === -1 ? "?" : "&") +
      query.join("&");

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
    }, timeoutMs);
  }

  function sendEvent(eventType, extra) {
    extra = extra || {};

    var payload = enrichPayload(
      Object.assign({}, extra, {
        eventType: eventType
      })
    );

    try {
      if (
        typeof window.trackGameEvent === "function" &&
        window.trackGameEvent !== sendEvent
      ) {
        window.trackGameEvent(payload.eventType, payload);
        return;
      }
    } catch (err) {
      console.warn("[ZELO] window.trackGameEvent failed", err);
    }

    try {
      if (
        typeof window.ZELO_TRACK_EVENT === "function" &&
        window.ZELO_TRACK_EVENT !== sendEvent
      ) {
        window.ZELO_TRACK_EVENT(payload);
        return;
      }
    } catch (err2) {
      console.warn("[ZELO] window.ZELO_TRACK_EVENT failed", err2);
    }

    jsonpCall(payload, function () {}, 7000);
  }

  window.sendGameEvent = sendEvent;
  window.trackGameEventFallback = sendEvent;
  /*
   * =========================================================
   * 06. DAILY LIMIT
   * =========================================================
   */

  function getDailyKey() {
    return STORAGE.dailyPlay + getTodayKey();
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

    updateDailyLimitText();
  }

  function increaseDailyPlay() {
    var key = getDailyKey();

    state.playsUsed += 1;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - state.playsUsed);

    try {
      localStorage.setItem(key, String(state.playsUsed));
    } catch (err) {}

    updateDailyLimitText();
  }

  function updateDailyLimitText() {
    safeText("zg-daily-left", String(state.remainingPlays));
    safeText("zg-daily-used", String(state.playsUsed));
  }

  function isDailyBlocked() {
    return state.remainingPlays <= 0;
  }

  function blockByDailyLimit() {
    state.isBlocked = true;
    state.blockReason = "daily_limit";
    state.blockedCoupon = "";

    sendEvent(EVENT_TYPES.blocked, {
      reason: "daily_limit",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });

    toast("今日挑戰次數已用完");
  }

  /*
   * =========================================================
   * 07. RENDER APP
   * =========================================================
   */

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);

    if (!root) {
      root = document.createElement("div");
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }

    state.root = root;
    return root;
  }

  function renderApp() {
    var root = ensureRoot();

    root.innerHTML =
      '<div class="zg-app">' +
        '<div class="zg-energy-grid"></div>' +

        '<section class="zg-screen active" id="screen-start">' +
          '<main class="zg-main">' +
            '<div class="zg-hero">' +
              '<div class="zg-logo">zelo</div>' +
              '<div class="zg-title">戰鬥陀螺挑戰</div>' +
              '<div class="zg-subtitle">選擇你的陀螺，在真實物理場地中挑戰好友排行榜。</div>' +
            '</div>' +

            '<div class="zg-card">' +
              '<div class="zg-card-title">今日挑戰</div>' +
              '<div class="zg-card-text">每日可挑戰 ' + DAILY_LIMIT + ' 次，目前剩餘 <b id="zg-daily-left">-</b> 次。</div>' +
              '<button class="zg-btn zg-btn-primary" data-action="start">開始挑戰</button>' +
              '<button class="zg-btn zg-btn-light" data-action="home">返回首頁</button>' +
            '</div>' +
          '</main>' +
        '</section>' +

        '<section class="zg-screen" id="screen-select">' +
          '<main class="zg-main">' +
            '<div class="zg-topbar">' +
              '<button class="zg-icon-btn" data-action="back-start">‹</button>' +
              '<div class="zg-topbar-title">選擇你的陀螺</div>' +
              '<button class="zg-icon-btn" data-action="home">×</button>' +
            '</div>' +

            '<div class="zg-select-grid" id="zg-top-list"></div>' +

            '<button class="zg-btn zg-btn-primary" data-action="launch">確認出戰</button>' +
          '</main>' +
        '</section>' +

        '<section class="zg-screen" id="screen-battle">' +
          '<main class="zg-main zg-battle-main">' +
            '<button class="zg-exit-btn" data-action="exit-battle">退出</button>' +

            '<div class="zg-arena" id="zg-arena">' +
              '<canvas class="zg-battle-canvas" id="zg-battle-canvas"></canvas>' +
              '<div class="zg-arena-ring"></div>' +
              '<div class="zg-arena-logo">zelo</div>' +

              '<div class="zg-top zg-player-top" id="zg-player-top">' +
                '<div class="zg-top-shell"><div class="zg-top-core"></div></div>' +
              '</div>' +

              '<div class="zg-top zg-enemy-top" id="zg-enemy-top">' +
                '<div class="zg-top-shell"><div class="zg-top-core"></div></div>' +
              '</div>' +
            '</div>' +

            '<div class="zg-battle-panel">' +
              '<div class="zg-hp-row">' +
                '<div class="zg-hp-label">你</div>' +
                '<div class="zg-hp-track"><div class="zg-hp-fill zg-player-hp" id="zg-player-hp"></div></div>' +
                '<div class="zg-hp-percent" id="zg-player-hp-text">100%</div>' +
              '</div>' +

              '<div class="zg-hp-row">' +
                '<div class="zg-hp-label">敵</div>' +
                '<div class="zg-hp-track"><div class="zg-hp-fill zg-enemy-hp" id="zg-enemy-hp"></div></div>' +
                '<div class="zg-hp-percent" id="zg-enemy-hp-text">100%</div>' +
              '</div>' +

              '<div class="zg-energy-row">' +
                '<div class="zg-energy-label">旋轉能量</div>' +
                '<div class="zg-energy-value" id="zg-spin-energy-text">100 / 100</div>' +
              '</div>' +

              '<div class="zg-battle-message" id="zg-battle-message">準備發射！</div>' +
            '</div>' +
          '</main>' +
        '</section>' +

        '<section class="zg-screen" id="screen-result">' +
          '<main class="zg-main zg-result-main">' +
            '<div class="zg-result-medal" id="zg-result-medal">W</div>' +
            '<h1 class="zg-result-title" id="zg-result-title">勝利！取得專屬獎勵</h1>' +
            '<div class="zg-result-score" id="zg-result-score">本次分數：0 分</div>' +

            '<div class="zg-coupon-card" id="zg-coupon-card">' +
              '<div class="zg-coupon-label" id="zg-coupon-label">恭喜你贏得折扣碼</div>' +
              '<div class="zg-coupon-code" id="zg-coupon-code">ZELO500</div>' +
              '<div class="zg-coupon-note" id="zg-coupon-note">結帳時輸入折扣碼即可使用。</div>' +
              '<button class="zg-coupon-copy" data-action="copy-coupon" id="zg-copy-coupon-btn">複製折扣碼：ZELO500</button>' +
            '</div>' +

            '<button class="zg-btn zg-btn-coupon" data-action="download-coupon">下載折扣券圖片</button>' +

            '<div class="zg-rank-card">' +
              '<div class="zg-rank-title">好友排行榜</div>' +
              '<div class="zg-rank-list" id="zg-friend-rank"></div>' +
            '</div>' +

            '<div class="zg-result-actions" id="zg-result-actions">' +
              '<button class="zg-btn zg-btn-primary" data-action="retry">再戰一次</button>' +
              '<button class="zg-btn zg-btn-blue" data-action="change-top">更換陀螺</button>' +
              '<button class="zg-btn zg-btn-green" data-action="share">邀請好友</button>' +
              '<button class="zg-btn zg-btn-light" data-action="home">返回首頁</button>' +
            '</div>' +
          '</main>' +
        '</section>' +

        '<div class="zg-toast" id="zg-toast" style="display:none;"></div>' +
      '</div>';
  }

  /*
   * =========================================================
   * 08. SELECT SCREEN
   * =========================================================
   */

  function renderTopList() {
    var list = qs("zg-top-list");
    if (!list) return;

    var html = Object.keys(TOPS).map(function (key) {
      var top = TOPS[key];
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
              '<span>平 ' + top.balance + '</span>' +
            '</div>' +
          '</div>' +
        '</button>'
      );
    }).join("");

    list.innerHTML = html;
  }

  function selectTop(id) {
    var top = TOPS[id] || TOPS.balance || TOPS.attack;

    state.selectedTop = top;

    try {
      localStorage.setItem(STORAGE.selectedTop, top.id);
    } catch (err) {}

    renderTopList();
  }

  function loadSelectedTop() {
    var id = "";

    try {
      id = localStorage.getItem(STORAGE.selectedTop) || "";
    } catch (err) {}

    if (!TOPS[id]) {
      id = "balance";
    }

    selectTop(id);
  }

  /*
   * =========================================================
   * 09. PHYSICS ENGINE
   * =========================================================
   */

  function createPhysicsTop(kind, config, x, y) {
    var launchAngle =
      kind === "player"
        ? rand(-Math.PI * 0.82, -Math.PI * 0.24)
        : rand(Math.PI * 0.18, Math.PI * 0.82);

    var launchSpeed =
      2.2 +
      Number(config.speed || 70) / 38 +
      rand(-0.25, 0.35);

    var mass = Number(config.mass || 1);
    var stamina = Number(config.stamina || 70);
    var balance = Number(config.balance || 70);
    var speed = Number(config.speed || 70);

    return {
      kind: kind,
      id: config.id,
      name: config.name,
      typeName: config.typeName,
      icon: config.icon,
      className: config.className || config.id || kind,

      x: x,
      y: y,
      vx: Math.cos(launchAngle) * launchSpeed,
      vy: Math.sin(launchAngle) * launchSpeed,

      angle: rand(0, Math.PI * 2),
      spin: 0.62 + speed / 210 + rand(-0.025, 0.035),
      spinEnergy: 100,

      radius: Number(config.radius || 31),
      mass: mass,

      hp: Number(config.hp || 100),
      maxHp: Number(config.hp || 100),

      attackPower: Number(config.attack || 70),
      defensePower: Number(config.defense || 70),
      staminaPower: stamina,
      balancePower: balance,
      speedPower: speed,

      friction: 0.991 + stamina / 40000,
      spinDecay: 0.9962 + stamina / 85000,
      wallFriction: 0.875 + balance / 1000,
      restitution: 0.76 + balance / 650,

      wobble: 0,
      hitCooldown: 0,

      trail: [],
      color: config.color || "#ffffff",
      trailColor: config.trailColor || "255,255,255",

      typeAdvantage: false,
      alive: true
    };
  }

  function pickEnemy() {
    state.enemy = pick(ENEMIES);
    return state.enemy;
  }

  function calculateTypeStatus() {
    var player = state.selectedTop;
    var enemy = state.enemy;

    state.typeStatus = "neutral";
    state.typeText = "屬性均勢";

    if (!player || !enemy) return;

    if (player.beats && player.beats === enemy.id) {
      state.typeStatus = "advantage";
      state.typeText = "屬性優勢";
      return;
    }

    if (enemy.beats && enemy.beats === player.id) {
      state.typeStatus = "disadvantage";
      state.typeText = "屬性劣勢";
      return;
    }
  }

  function startBattle() {
    if (!state.selectedTop) {
      loadSelectedTop();
    }

    loadDailyLimit();

    if (isDailyBlocked()) {
      blockByDailyLimit();
      return;
    }

    state.battleRunning = true;
    state.battleDone = false;
    state.resultLogged = false;
    state.battleStartAt = Date.now();
    state.lastFrameAt = performance.now();

    state.particles = [];
    state.shockwaves = [];
    state.slashEffects = [];
    state.lastHitAt = 0;
    state.lastImpactPower = 0;

    pickEnemy();
    calculateTypeStatus();

    go(SCREENS.battle);
    resizeBattleCanvas();

    var a = state.arena;

    state.physicsPlayer = createPhysicsTop(
      "player",
      state.selectedTop,
      a.cx - a.radius * 0.32,
      a.cy + a.radius * 0.26
    );

    state.physicsEnemy = createPhysicsTop(
      "enemy",
      state.enemy,
      a.cx + a.radius * 0.32,
      a.cy - a.radius * 0.26
    );

    if (state.typeStatus === "advantage") {
      state.physicsPlayer.typeAdvantage = true;
    }

    if (state.typeStatus === "disadvantage") {
      state.physicsEnemy.typeAdvantage = true;
    }

    state.playerMaxHp = state.physicsPlayer.maxHp;
    state.enemyMaxHp = state.physicsEnemy.maxHp;
    state.playerHp = state.physicsPlayer.hp;
    state.enemyHp = state.physicsEnemy.hp;

    renderBattleInitial();
    updateHpUi();
    updateSpinEnergyUi();
    updateBattleMessage("Battle Start！碗型場地高速啟動！");

    cancelAnimationFrame(state.battleFrame);
    state.battleFrame = requestAnimationFrame(battleLoop);
  }

  function renderBattleInitial() {
    var playerEl = qs("zg-player-top");
    var enemyEl = qs("zg-enemy-top");

    if (playerEl) {
      playerEl.className =
        "zg-top zg-player-top " +
        escapeHtml(state.selectedTop.className || state.selectedTop.id);

      playerEl.innerHTML =
        '<div class="zg-top-shell">' +
          '<div class="zg-top-blur"></div>' +
          '<div class="zg-top-core">' + escapeHtml(state.selectedTop.icon) + '</div>' +
          '<div class="zg-top-line"></div>' +
        '</div>';
    }

    if (enemyEl) {
      enemyEl.className =
        "zg-top zg-enemy-top enemy " +
        escapeHtml(state.enemy.id);

      enemyEl.innerHTML =
        '<div class="zg-top-shell">' +
          '<div class="zg-top-blur"></div>' +
          '<div class="zg-top-core">' + escapeHtml(state.enemy.icon) + '</div>' +
          '<div class="zg-top-line"></div>' +
        '</div>';
    }

    renderPhysicsTop(state.physicsPlayer, playerEl);
    renderPhysicsTop(state.physicsEnemy, enemyEl);
  }

  function battleLoop(timestamp) {
    if (!state.battleRunning || state.battleDone) return;

    var dt = Math.min(32, timestamp - state.lastFrameAt) / 16.6667;
    state.lastFrameAt = timestamp;

    stepPhysics(dt);
    renderBattleFrame();
    checkBattleFinish();

    state.battleFrame = requestAnimationFrame(battleLoop);
  }

  function stepPhysics(dt) {
    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

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

    updateCooldowns(p, dt);
    updateCooldowns(e, dt);

    state.playerHp = p.hp;
    state.enemyHp = e.hp;

    updateBattleMessageByPhysics();
  }

  function applyBowlForce(top, dt) {
    var a = state.arena;

    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    var normalized = dist / a.radius;

    if (normalized <= 0.035) return;

    var slopeForce =
      normalized *
      normalized *
      a.bowlStrength *
      (1.15 - top.balancePower / 500);

    top.vx -= (dx / dist) * slopeForce * dt;
    top.vy -= (dy / dist) * slopeForce * dt;

    if (normalized > 0.72) {
      top.vx *= a.edgeDrag;
      top.vy *= a.edgeDrag;
      top.spinEnergy -= normalized * 0.018 * dt;
      top.wobble += normalized * 0.006 * dt;
    }
  }

  function integrateTop(top, dt) {
    top.x += top.vx * dt;
    top.y += top.vy * dt;

    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);

    var driftNoise = (1 - top.balancePower / 130) * 0.012;

    if (top.spinEnergy < 35) {
      driftNoise += 0.012;
    }

    top.vx += rand(-driftNoise, driftNoise) * dt;
    top.vy += rand(-driftNoise, driftNoise) * dt;

    top.angle += top.spin * (0.62 + top.spinEnergy / 80) * dt;

    if (speed < 0.08 && top.spinEnergy > 12) {
      top.vx += rand(-0.035, 0.035) * dt;
      top.vy += rand(-0.035, 0.035) * dt;
    }
  }

  function resolveArenaWall(top) {
    var a = state.arena;

    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;

    var maxDist = a.radius - top.radius - 3;

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

    if (velAlongNormal > 0) {
      return false;
    }

    var restitution = Math.min(a.restitution, b.restitution);
    var invMassA = 1 / a.mass;
    var invMassB = 1 / b.mass;

    var impulse =
      -(1 + restitution) *
      velAlongNormal /
      (invMassA + invMassB);

    var impulseX = impulse * nx;
    var impulseY = impulse * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;
    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;

    var spinDiff = Math.abs(a.spin * a.spinEnergy - b.spin * b.spinEnergy);
    var impactPower = Math.abs(impulse) * 1.25 + spinDiff * 0.035;

    if (Date.now() - state.lastHitAt > 95) {
      var damageToB = calculateCollisionDamage(a, b, impactPower);
      var damageToA = calculateCollisionDamage(b, a, impactPower * 0.84);

      b.hp = Math.max(0, b.hp - damageToB);
      a.hp = Math.max(0, a.hp - damageToA);

      a.spinEnergy -= impactPower * 0.16;
      b.spinEnergy -= impactPower * 0.16;

      a.wobble += impactPower / Math.max(90, a.balancePower * 2.15);
      b.wobble += impactPower / Math.max(90, b.balancePower * 2.15);

      a.hitCooldown = 8;
      b.hitCooldown = 8;

      state.lastHitAt = Date.now();
      state.lastImpactPower = impactPower;

      createImpactEffect(
        a.x + nx * a.radius,
        a.y + ny * a.radius,
        impactPower,
        a.color,
        b.color
      );

      updateBattleMessage(getImpactMessage(impactPower, damageToB, damageToA));
    }

    return true;
  }

  function calculateCollisionDamage(attacker, defender, impactPower) {
    var attackFactor = attacker.attackPower / 76;
    var defenseFactor = defender.defensePower / 92;
    var spinFactor = clamp(attacker.spinEnergy / 100, 0.18, 1.12);
    var massFactor = clamp(attacker.mass / defender.mass, 0.72, 1.34);

    var raw =
      impactPower *
      0.24 *
      attackFactor *
      spinFactor *
      massFactor;

    var reduced = raw / Math.max(0.72, defenseFactor);

    if (attacker.typeAdvantage) {
      reduced *= 1.14;
    }

    if (defender.typeAdvantage) {
      reduced *= 0.9;
    }

    if (attacker.spinEnergy < 25) {
      reduced *= 0.68;
    }

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

    if (top.hitCooldown > 0) {
      energyLoss += 0.018 * dt;
    }

    top.spinEnergy -= energyLoss;

    top.wobble *= Math.pow(0.991, dt);

    if (top.spinEnergy < 42) {
      top.wobble += 0.006 * dt;
    }

    if (top.spinEnergy < 20) {
      top.wobble += 0.016 * dt;
    }

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

  function updateCooldowns(top, dt) {
    top.hitCooldown = Math.max(0, top.hitCooldown - dt);
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
  /*
   * =========================================================
   * 10. BATTLE RENDERER / CANVAS EFFECTS
   * =========================================================
   */

  function resizeBattleCanvas() {
    var arenaEl = qs("zg-arena");
    var canvas = qs("zg-battle-canvas");

    if (!arenaEl || !canvas) return;

    var rect = arenaEl.getBoundingClientRect();
    var size = Math.max(260, Math.min(rect.width || 360, rect.height || 360));

    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");

    canvas.width = Math.round(size * state.dpr);
    canvas.height = Math.round(size * state.dpr);
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    state.arena.width = size;
    state.arena.height = size;
    state.arena.cx = size / 2;
    state.arena.cy = size / 2;
    state.arena.radius = size * 0.455;

    if (state.ctx) {
      state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    }

    clampPhysicsToArena();
  }

  function clampPhysicsToArena() {
    if (state.physicsPlayer) resolveArenaWallHard(state.physicsPlayer);
    if (state.physicsEnemy) resolveArenaWallHard(state.physicsEnemy);
  }

  function resolveArenaWallHard(top) {
    var a = state.arena;
    var dx = top.x - a.cx;
    var dy = top.y - a.cy;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var maxDist = a.radius - top.radius - 4;

    if (dist > maxDist) {
      top.x = a.cx + (dx / dist) * maxDist;
      top.y = a.cy + (dy / dist) * maxDist;
    }
  }

  function renderBattleFrame() {
    drawCanvasEffects();

    renderPhysicsTop(state.physicsPlayer, qs("zg-player-top"));
    renderPhysicsTop(state.physicsEnemy, qs("zg-enemy-top"));

    updateHpUi();
    updateSpinEnergyUi();
  }

  function renderPhysicsTop(top, el) {
    if (!top || !el) return;

    var speed = Math.sqrt(top.vx * top.vx + top.vy * top.vy);
    var wobblePower = clamp(top.wobble, 0, 2.8);
    var wobbleScale = 1 + Math.sin(performance.now() / 42) * wobblePower * 0.026;

    var blur = clamp(speed * 0.12 + top.spinEnergy / 240, 0, 1.7);
    var brightness = 0.76 + top.spinEnergy / 150;
    var saturate = 1.05 + top.spinEnergy / 260;

    var lowEnergyTilt = 0;

    if (top.spinEnergy < 28) {
      lowEnergyTilt =
        Math.sin(performance.now() / 70) *
        (28 - top.spinEnergy) *
        0.013;
    }

    el.style.left = top.x + "px";
    el.style.top = top.y + "px";

    el.style.width = top.radius * 2 + "px";
    el.style.height = top.radius * 2 + "px";

    el.style.transform =
      "translate(-50%, -50%) rotate(" +
      top.angle +
      "rad) scale(" +
      wobbleScale +
      ") skew(" +
      lowEnergyTilt +
      "rad, " +
      -lowEnergyTilt * 0.62 +
      "rad)";

    el.style.filter =
      "blur(" +
      blur.toFixed(2) +
      "px) brightness(" +
      brightness.toFixed(2) +
      ") saturate(" +
      saturate.toFixed(2) +
      ")";

    var shell = el.querySelector(".zg-top-shell");
    if (shell) {
      shell.style.boxShadow =
        "0 0 " +
        Math.round(10 + top.spinEnergy / 3) +
        "px " +
        top.color +
        ", inset 0 0 18px rgba(0,0,0,0.35)";
    }

    var blurEl = el.querySelector(".zg-top-blur");
    if (blurEl) {
      blurEl.style.opacity = clamp(speed / 8 + top.spinEnergy / 180, 0.1, 0.95);
    }
  }

  function drawCanvasEffects() {
    var ctx = state.ctx;
    var canvas = state.canvas;

    if (!ctx || !canvas) return;

    var w = state.arena.width;
    var h = state.arena.height;

    ctx.clearRect(0, 0, w, h);

    drawArenaEnergy(ctx);
    drawTrail(ctx, state.physicsPlayer);
    drawTrail(ctx, state.physicsEnemy);
    drawParticles(ctx);
    drawShockwaves(ctx);
    drawSlashEffects(ctx);
  }

  function drawArenaEnergy(ctx) {
    var a = state.arena;

    ctx.save();

    var gradient = ctx.createRadialGradient(
      a.cx,
      a.cy,
      a.radius * 0.18,
      a.cx,
      a.cy,
      a.radius
    );

    gradient.addColorStop(0, "rgba(255,255,255,0.025)");
    gradient.addColorStop(0.62, "rgba(0,178,255,0.035)");
    gradient.addColorStop(1, "rgba(255,47,82,0.045)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(a.cx, a.cy, a.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
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
      var alpha = curr.alpha * life * 0.62;
      var width = 2 + curr.speed * 0.75 + curr.energy / 38;

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

    var last = top.trail[top.trail.length - 1];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(" + top.trailColor + ",0.24)";
    ctx.beginPath();
    ctx.arc(last.x, last.y, top.radius * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function createImpactEffect(x, y, power, colorA, colorB) {
    power = clamp(power || 8, 4, 48);

    var count = Math.round(12 + power * 0.8);

    for (var i = 0; i < count; i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(1.1, 3.2 + power * 0.08);

      state.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(18, 34),
        maxLife: 34,
        size: rand(1.6, 4.2),
        color: Math.random() > 0.5 ? colorA : colorB,
        alpha: 1
      });
    }

    state.shockwaves.push({
      x: x,
      y: y,
      r: 8,
      life: 26,
      maxLife: 26,
      color: colorA || "#ffffff",
      power: power
    });

    state.slashEffects.push({
      x: x,
      y: y,
      angle: rand(-Math.PI, Math.PI),
      life: 16,
      maxLife: 16,
      length: 54 + power * 1.8,
      color: "#ffffff"
    });

    var arenaEl = qs("zg-arena");
    if (arenaEl) {
      arenaEl.classList.remove("zg-arena-shake");
      void arenaEl.offsetWidth;
      arenaEl.classList.add("zg-arena-shake");
    }

    var playerEl = qs("zg-player-top");
    var enemyEl = qs("zg-enemy-top");

    if (playerEl) {
      playerEl.classList.add("zg-top-hit");
      setTimeout(function () {
        playerEl.classList.remove("zg-top-hit");
      }, 160);
    }

    if (enemyEl) {
      enemyEl.classList.add("zg-top-hit");
      setTimeout(function () {
        enemyEl.classList.remove("zg-top-hit");
      }, 160);
    }
  }

  function createWallSpark(x, y, color, power) {
    power = clamp(power || 2, 1, 12);

    for (var i = 0; i < Math.round(4 + power * 1.2); i++) {
      var angle = rand(0, Math.PI * 2);
      var speed = rand(0.8, 1.8 + power * 0.12);

      state.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(10, 22),
        maxLife: 22,
        size: rand(1.2, 3.2),
        color: color || "#ffffff",
        alpha: 0.75
      });
    }
  }

  function drawParticles(ctx) {
    if (!state.particles.length) return;

    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];

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

      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  function drawShockwaves(ctx) {
    if (!state.shockwaves.length) return;

    for (var i = state.shockwaves.length - 1; i >= 0; i--) {
      var s = state.shockwaves[i];

      s.r += 2.6 + s.power * 0.03;
      s.life -= 1;

      var alpha = Math.max(0, s.life / s.maxLife);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = alpha * 0.72;
      ctx.lineWidth = 2.2 + s.power * 0.035;
      ctx.shadowBlur = 18;
      ctx.shadowColor = s.color;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();

      if (s.life <= 0) {
        state.shockwaves.splice(i, 1);
      }
    }
  }

  function drawSlashEffects(ctx) {
    if (!state.slashEffects.length) return;

    for (var i = state.slashEffects.length - 1; i >= 0; i--) {
      var s = state.slashEffects[i];

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

      if (s.life <= 0) {
        state.slashEffects.splice(i, 1);
      }
    }
  }

  function updateHpUi() {
    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

    var playerPercent = p
      ? Math.round((p.hp / p.maxHp) * 100)
      : Math.round((state.playerHp / state.playerMaxHp) * 100);

    var enemyPercent = e
      ? Math.round((e.hp / e.maxHp) * 100)
      : Math.round((state.enemyHp / state.enemyMaxHp) * 100);

    playerPercent = clamp(playerPercent, 0, 100);
    enemyPercent = clamp(enemyPercent, 0, 100);

    var playerFill = qs("zg-player-hp");
    var enemyFill = qs("zg-enemy-hp");

    if (playerFill) playerFill.style.width = playerPercent + "%";
    if (enemyFill) enemyFill.style.width = enemyPercent + "%";

    safeText("zg-player-hp-text", playerPercent + "%");
    safeText("zg-enemy-hp-text", enemyPercent + "%");
  }

  function updateSpinEnergyUi() {
    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

    if (!p || !e) {
      safeText("zg-spin-energy-text", "100 / 100");
      return;
    }

    safeText(
      "zg-spin-energy-text",
      Math.round(p.spinEnergy) + " / " + Math.round(e.spinEnergy)
    );
  }

  function updateBattleMessage(text) {
    safeText("zg-battle-message", text);
  }

  function getImpactMessage(power, damageToEnemy, damageToPlayer) {
    if (power > 34) {
      return "Burst Impact！強烈撞擊造成大量能量損耗！";
    }

    if (damageToEnemy > damageToPlayer + 3) {
      return "漂亮打擊！你的陀螺取得碰撞優勢！";
    }

    if (damageToPlayer > damageToEnemy + 3) {
      return "敵方反擊！你的陀螺開始失衡！";
    }

    return "Spin Clash！雙方高速互撞，火花四散！";
  }

  function updateBattleMessageByPhysics() {
    var now = Date.now();

    if (now - state.battleMessageTimer < 1200) return;
    state.battleMessageTimer = now;

    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

    if (!p || !e) return;

    var pSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var eSpeed = Math.sqrt(e.vx * e.vx + e.vy * e.vy);

    if (p.spinEnergy < 20) {
      updateBattleMessage("你的旋轉能量下降，陀螺開始晃動！");
      return;
    }

    if (e.spinEnergy < 20) {
      updateBattleMessage("敵方旋轉能量不足，出現明顯失衡！");
      return;
    }

    if (pSpeed > eSpeed + 1.2) {
      updateBattleMessage("你正在高速切入，準備撞擊！");
      return;
    }

    if (eSpeed > pSpeed + 1.2) {
      updateBattleMessage("敵方加速壓迫，小心反擊！");
      return;
    }

    if (state.typeStatus === "advantage") {
      updateBattleMessage("屬性優勢！你的陀螺能量轉換更有效率！");
      return;
    }

    if (state.typeStatus === "disadvantage") {
      updateBattleMessage("屬性劣勢！需要靠碰撞角度逆轉！");
      return;
    }

    updateBattleMessage("雙方繞行場地，尋找最佳撞擊角度！");
  }

  /*
   * =========================================================
   * 11. BATTLE FINISH
   * =========================================================
   */

  function checkBattleFinish() {
    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

    if (!p || !e || state.battleDone) return;

    var elapsed = (Date.now() - state.battleStartAt) / 1000;

    var playerStopped = !p.alive || p.spinEnergy <= 1.2 || p.hp <= 0;
    var enemyStopped = !e.alive || e.spinEnergy <= 1.2 || e.hp <= 0;

    if (playerStopped || enemyStopped || elapsed >= 32) {
      finishBattle();
    }
  }

  function finishBattle() {
    if (state.battleDone) return;

    state.battleDone = true;
    state.battleRunning = false;

    cancelAnimationFrame(state.battleFrame);

    var p = state.physicsPlayer;
    var e = state.physicsEnemy;

    var elapsed = Math.max(1, Math.round((Date.now() - state.battleStartAt) / 1000));

    var playerScoreValue =
      (p.hp / p.maxHp) * 0.45 +
      (p.spinEnergy / 100) * 0.35 +
      (p.attackPower + p.defensePower + p.staminaPower + p.balancePower) / 400 * 0.2;

    var enemyScoreValue =
      (e.hp / e.maxHp) * 0.45 +
      (e.spinEnergy / 100) * 0.35 +
      (e.attackPower + e.defensePower + e.staminaPower + e.balancePower) / 400 * 0.2;

    var isWin = playerScoreValue >= enemyScoreValue;

    if (e.hp <= 0 || e.spinEnergy <= 1.2) {
      isWin = true;
    }

    if (p.hp <= 0 || p.spinEnergy <= 1.2) {
      isWin = false;
    }

    if ((p.hp <= 0 || p.spinEnergy <= 1.2) && (e.hp <= 0 || e.spinEnergy <= 1.2)) {
      isWin = playerScoreValue >= enemyScoreValue;
    }

    var hpBonus = Math.max(0, Math.round((p.hp / p.maxHp) * 900));
    var spinBonus = Math.max(0, Math.round(p.spinEnergy * 8));
    var winBonus = isWin ? 1500 : 320;
    var typeBonus = state.typeStatus === "advantage" ? 280 : 0;
    var timeBonus = Math.max(0, 560 - elapsed * 14);
    var impactBonus = Math.min(420, Math.round(state.lastImpactPower * 9));

    state.score = Math.max(
      50,
      Math.round(winBonus + hpBonus + spinBonus + typeBonus + timeBonus + impactBonus + rand(0, 260))
    );

    state.rank = calculateRank(state.score);
    state.lastCouponReward = chooseCoupon(isWin);
    state.coupon = state.lastCouponReward.code;

    state.playerHp = p.hp;
    state.enemyHp = e.hp;

    state.lastResult = {
      result: isWin ? "win" : "lose",
      score: state.score,
      rank: state.rank,
      coupon: state.coupon,
      couponTitle: state.lastCouponReward.title,

      topId: state.selectedTop.id,
      topName: state.selectedTop.name,
      topType: state.selectedTop.typeName,

      enemyId: state.enemy.id,
      enemyName: state.enemy.name,
      enemyType: state.enemy.typeName,

      typeStatus: state.typeStatus,
      typeText: state.typeText,

      duration: elapsed,
      playerHp: Math.round(p.hp),
      enemyHp: Math.round(e.hp),
      playerSpinEnergy: Math.round(p.spinEnergy),
      enemySpinEnergy: Math.round(e.spinEnergy),
      lastImpactPower: Math.round(state.lastImpactPower),

      physicsVersion: VERSION,
      timestamp: nowIso()
    };

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(state.lastResult));
      localStorage.setItem(STORAGE.lastScore, String(state.score));
      localStorage.setItem(STORAGE.lastCoupon, state.coupon);

      var best = Number(localStorage.getItem(STORAGE.bestScore) || 0);
      if (state.score > best) {
        localStorage.setItem(STORAGE.bestScore, String(state.score));
      }
    } catch (err) {}

    increaseDailyPlay();
    logResultEvent();
    renderResult();
    go(SCREENS.result);
  }

  function calculateRank(score) {
    score = Number(score || 0);

    if (score >= 3100) return "S";
    if (score >= 2300) return "A";
    if (score >= 1300) return "B";
    return "C";
  }

  function chooseCoupon(isWin) {
    return pick(isWin ? COUPONS.win : COUPONS.lose);
  }

  function logResultEvent() {
    if (state.resultLogged) return;
    state.resultLogged = true;

    var r = state.lastResult || {};

    sendEvent(EVENT_TYPES.result, {
      result: r.result,
      score: r.score,
      rank: r.rank,
      coupon: r.coupon,
      couponCode: r.coupon,
      couponTitle: r.couponTitle,

      topId: r.topId,
      topName: r.topName,
      topType: r.topType,

      enemyId: r.enemyId,
      enemyName: r.enemyName,
      enemyType: r.enemyType,

      typeStatus: r.typeStatus,
      typeText: r.typeText,

      duration: r.duration,
      playerHp: r.playerHp,
      enemyHp: r.enemyHp,
      playerSpinEnergy: r.playerSpinEnergy,
      enemySpinEnergy: r.enemySpinEnergy,
      lastImpactPower: r.lastImpactPower,

      physicsVersion: VERSION,

      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });
  }
  /*
   * =========================================================
   * 12. RESULT PAGE
   * =========================================================
   */

  function renderResult() {
    var r = state.lastResult || {};
    var isWin = r.result === "win";
    var reward = state.lastCouponReward || COUPONS.win[0];

    safeText("zg-result-medal", isWin ? "W" : "L");
    safeText(
      "zg-result-title",
      isWin ? "勝利！取得專屬獎勵" : "挑戰完成！取得獎勵"
    );

    safeText("zg-result-score", "本次分數：" + Number(r.score || 0) + " 分");

    safeText("zg-coupon-label", reward.label || "專屬獎勵");
    safeText("zg-coupon-code", reward.code || "ZELOPLAY");
    safeText("zg-coupon-note", reward.note || "結帳時輸入折扣碼即可使用。");

    safeText(
      "zg-copy-coupon-btn",
      "複製折扣碼：" + (reward.code || "ZELOPLAY")
    );

    renderFriendRank();
    fixResultButtons();
  }

  function renderFriendRank() {
    var list = loadFriendRanks();

    var current = {
      playerName: getPlayerName(),
      userId: getUserId(),
      score: state.score || 0,
      rank: state.rank || "B",
      isMe: true
    };

    list = list.filter(function (item) {
      return item && item.userId && item.userId !== current.userId;
    });

    list.push(current);

    list.sort(function (a, b) {
      return Number(b.score || 0) - Number(a.score || 0);
    });

    list = list.slice(0, 10);

    var el = qs("zg-friend-rank");
    if (!el) return;

    el.innerHTML = list.map(function (item, index) {
      return (
        '<div class="zg-rank-row ' + (item.isMe ? "me" : "") + '">' +
          '<div class="zg-rank-no">' + (index + 1) + '</div>' +
          '<div class="zg-rank-name">' +
            escapeHtml(item.playerName || item.displayName || "好友") +
            (item.isMe ? "（你）" : "") +
          '</div>' +
          '<div class="zg-rank-score">' + Number(item.score || 0) + '</div>' +
        '</div>'
      );
    }).join("");

    saveOwnRank(current);
  }

  function loadFriendRanks() {
    try {
      var saved =
        localStorage.getItem(STORAGE.realFriendRanks) ||
        localStorage.getItem(STORAGE.friends) ||
        "[]";

      var list = JSON.parse(saved);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function saveOwnRank(current) {
    try {
      var list = loadFriendRanks();

      list = list.filter(function (item) {
        return item && item.userId !== current.userId;
      });

      list.push(current);

      localStorage.setItem(STORAGE.realFriendRanks, JSON.stringify(list));
    } catch (err) {}
  }

  function fixResultButtons() {
    var actions = qs("zg-result-actions");
    if (!actions) return;

    actions.classList.add("zg-result-actions-fixed");

    var map = {
      retry: {
        label: "再戰一次",
        keep: false
      },
      "change-top": {
        label: "更換陀螺",
        keep: false
      },
      share: {
        label: "邀請好友",
        keep: false
      },
      home: {
        label: "返回首頁",
        keep: false
      }
    };

    qsa("button, a, [role='button']", actions).forEach(function (btn) {
      var action = btn.getAttribute("data-action");
      var text = String(btn.textContent || "").trim();

      if (!action) {
        if (text.indexOf("再玩") !== -1) action = "retry";
        if (text.indexOf("再戰") !== -1) action = "retry";
        if (text.indexOf("重新選擇") !== -1) action = "change-top";
        if (text.indexOf("更換") !== -1) action = "change-top";
        if (text.indexOf("分享") !== -1) action = "share";
        if (text.indexOf("邀請") !== -1) action = "share";
        if (text.indexOf("回首頁") !== -1) action = "home";
        if (text.indexOf("返回首頁") !== -1) action = "home";
      }

      if (!action || !map[action]) return;

      if (map[action].keep) {
        btn.style.display = "none";
        btn.setAttribute("data-zg-duplicate-hidden", "true");
        return;
      }

      map[action].keep = true;
      btn.textContent = map[action].label;
      btn.setAttribute("data-action", action);
      btn.style.display = "";
    });
  }

  /*
   * =========================================================
   * 13. ACTIONS
   * =========================================================
   */

  function handleAction(action, target, event) {
    switch (action) {
      case "start":
        loadDailyLimit();
        if (isDailyBlocked()) {
          blockByDailyLimit();
          return;
        }
        go(SCREENS.select);
        break;

      case "back-start":
        go(SCREENS.start);
        break;

      case "launch":
        startBattle();
        break;

      case "exit-battle":
        stopBattleAndGoSelect();
        break;

      case "retry":
        sendEvent(EVENT_TYPES.playAgain, {
          source: "result_page",
          score: state.score,
          rank: state.rank,
          coupon: state.coupon
        });
        startBattle();
        break;

      case "change-top":
        sendEvent(EVENT_TYPES.changeTop, {
          source: "result_page"
        });
        go(SCREENS.select);
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

      default:
        break;
    }
  }

  function stopBattleAndGoSelect() {
    state.battleRunning = false;
    state.battleDone = true;

    cancelAnimationFrame(state.battleFrame);

    go(SCREENS.select);
  }

  function copyCoupon() {
    var code =
      (state.lastCouponReward && state.lastCouponReward.code) ||
      state.coupon ||
      "ZELOPLAY";

    function done() {
      toast("折扣碼已複製：" + code);

      sendEvent(EVENT_TYPES.couponCopy, {
        coupon: code,
        couponCode: code,
        source: "result_page",
        score: state.score,
        rank: state.rank
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
    var code =
      (state.lastCouponReward && state.lastCouponReward.code) ||
      state.coupon ||
      "ZELOPLAY";

    sendEvent(EVENT_TYPES.couponDownload, {
      coupon: code,
      couponCode: code,
      source: "result_page",
      score: state.score,
      rank: state.rank
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
    var code =
      (state.lastCouponReward && state.lastCouponReward.code) ||
      state.coupon ||
      "ZELOPLAY";

    var userId = getUserId();
    var playerName = getPlayerName();

    var url = new URL(window.location.href);
    if (userId) url.searchParams.set("inviterId", userId);
    if (playerName) url.searchParams.set("inviterName", playerName);

    var shareText =
      "我在 ZELO 戰鬥陀螺挑戰拿到 " +
      state.score +
      " 分！一起來挑戰，還有機會拿折扣碼 " +
      code +
      "。";

    sendEvent(EVENT_TYPES.share, {
      source: "result_page",
      score: state.score,
      rank: state.rank,
      coupon: code,
      couponCode: code,
      shareUrl: url.toString()
    });

    if (
      window.liff &&
      typeof window.liff.isApiAvailable === "function" &&
      window.liff.isApiAvailable("shareTargetPicker")
    ) {
      window.liff.shareTargetPicker([
        {
          type: "text",
          text: shareText + "\n" + url.toString()
        }
      ]).then(function () {
        toast("已開啟分享");
      }).catch(function () {
        fallbackShare(shareText, url.toString());
      });

      return;
    }

    fallbackShare(shareText, url.toString());
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
    sendEvent(EVENT_TYPES.officialClick, {
      source: "result_page",
      targetUrl: SHOP_URL
    });

    window.location.href = SHOP_URL;
  }

  /*
   * =========================================================
   * 14. EVENT BINDING
   * =========================================================
   */

  function bindEvents() {
    document.addEventListener("click", function (event) {
      var topCard = event.target.closest("[data-top-id]");
      if (topCard) {
        selectTop(topCard.getAttribute("data-top-id"));
        return;
      }

      var actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;

      var action = actionEl.getAttribute("data-action");
      handleAction(action, actionEl, event);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && state.battleRunning) {
        updateBattleMessage("對戰暫停中，返回頁面後繼續。");
      }
    });

    window.addEventListener("pageshow", function () {
      setH();
      loadDailyLimit();
      resizeBattleCanvas();
      fixResultButtons();
    });

    window.addEventListener("resize", function () {
      setH();
      setTimeout(resizeBattleCanvas, 80);
      setTimeout(resizeBattleCanvas, 260);
    });

    window.addEventListener("orientationchange", function () {
      setH();
      setTimeout(resizeBattleCanvas, 160);
      setTimeout(resizeBattleCanvas, 520);
    });
  }

  /*
   * =========================================================
   * 15. LIFF / PROFILE
   * =========================================================
   */

  function initProfile() {
    state.profile = getProfile();

    var invite = getInviteParams();
    state.inviterId = invite.inviterId || "";
    state.inviterName = invite.inviterName || "";

    if (window.liff && LIFF_ID) {
      tryLoadLiffProfile();
    }
  }

  function tryLoadLiffProfile() {
    try {
      if (!window.liff || typeof window.liff.getProfile !== "function") return;

      if (typeof window.liff.isLoggedIn === "function" && !window.liff.isLoggedIn()) {
        return;
      }

      window.liff.getProfile().then(function (profile) {
        if (!profile) return;

        state.profile = profile;
        window.ZELO_PROFILE = profile;

        try {
          localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
        } catch (err) {}
      }).catch(function () {});
    } catch (err) {}
  }

  /*
   * =========================================================
   * 16. CSS SAFETY
   * =========================================================
   */

  function injectSafetyCss() {
    if (document.getElementById("zg-game-physics-css")) return;

    var style = document.createElement("style");
    style.id = "zg-game-physics-css";

    style.textContent = `
      html,
      body {
        overflow-x: hidden !important;
      }

      #zelo-liff-game {
        width: 100% !important;
        max-width: 100vw !important;
        overflow-x: hidden !important;
      }

      .zg-arena {
        position: relative !important;
        width: min(92vw, 440px) !important;
        height: min(92vw, 440px) !important;
        max-width: 440px !important;
        max-height: 440px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        overflow: hidden !important;
        border-radius: 999px !important;
        contain: layout paint !important;
        background:
          radial-gradient(circle at 50% 47%, rgba(255,255,255,0.08), transparent 28%),
          radial-gradient(circle at 50% 50%, rgba(80,0,80,0.35), rgba(5,7,22,0.92) 58%, rgba(0,0,0,0.98) 100%) !important;
      }

      .zg-battle-canvas {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 2 !important;
        pointer-events: none !important;
      }

      .zg-arena-ring,
      .zg-arena-logo {
        position: absolute !important;
        z-index: 1 !important;
        pointer-events: none !important;
      }

      .zg-top {
        position: absolute !important;
        z-index: 5 !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        will-change: left, top, transform, filter !important;
        transform-origin: center center !important;
        pointer-events: none !important;
      }

      .zg-top-shell {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 999px !important;
        overflow: hidden !important;
        background:
          radial-gradient(circle at 36% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.14) 22%, transparent 38%),
          conic-gradient(from 0deg, #ff0033, #ffcc00, #00a6ff, #9b5cff, #ff0033) !important;
        box-shadow:
          0 0 24px rgba(255,255,255,0.28),
          inset 0 0 18px rgba(0,0,0,0.42) !important;
      }

      .zg-enemy-top .zg-top-shell {
        background:
          radial-gradient(circle at 36% 28%, rgba(255,255,255,0.95), rgba(255,255,255,0.12) 22%, transparent 38%),
          conic-gradient(from 0deg, #00a6ff, #001eff, #ff0033, #ffcc00, #00a6ff) !important;
      }

      .zg-top-core {
        position: absolute !important;
        inset: 18% !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 24px !important;
        background:
          radial-gradient(circle, rgba(255,255,255,0.92), rgba(255,255,255,0.22) 34%, rgba(0,0,0,0.22) 72%) !important;
        box-shadow: inset 0 0 10px rgba(0,0,0,0.34) !important;
      }

      .zg-top-blur {
        position: absolute !important;
        inset: -8% !important;
        border-radius: 999px !important;
        background:
          conic-gradient(from 0deg, rgba(255,255,255,0.75), transparent, rgba(255,255,255,0.55), transparent, rgba(255,255,255,0.75)) !important;
        filter: blur(5px) !important;
        opacity: 0.5;
        animation: zgTopBlurSpin 0.32s linear infinite;
      }

      .zg-top-line {
        position: absolute !important;
        left: 50% !important;
        top: 4% !important;
        width: 3px !important;
        height: 46% !important;
        transform: translateX(-50%) !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,0.82) !important;
        box-shadow: 0 0 10px rgba(255,255,255,0.86) !important;
      }

      @keyframes zgTopBlurSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .zg-arena-shake {
        animation: zgArenaShake 220ms ease-in-out;
      }

      .zg-top-hit {
        filter: brightness(1.55) saturate(1.45) drop-shadow(0 0 14px rgba(255,230,109,0.95)) !important;
      }

      @keyframes zgArenaShake {
        0% { transform: translate3d(0, 0, 0); }
        20% { transform: translate3d(-5px, 2px, 0); }
        40% { transform: translate3d(5px, -2px, 0); }
        60% { transform: translate3d(-3px, 1px, 0); }
        80% { transform: translate3d(3px, -1px, 0); }
        100% { transform: translate3d(0, 0, 0); }
      }

      .zg-energy-row {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 12px !important;
        font-weight: 800 !important;
        font-size: 13px !important;
        color: rgba(255,255,255,0.88) !important;
        margin-top: 8px !important;
      }

      .zg-result-actions,
      .zg-result-actions-fixed {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
        width: 100% !important;
        margin-top: 18px !important;
      }

      .zg-result-actions .zg-btn,
      .zg-result-actions-fixed .zg-btn {
        width: 100% !important;
        min-height: 50px !important;
        border-radius: 16px !important;
        font-weight: 900 !important;
        white-space: nowrap !important;
      }

      @media (max-width: 420px) {
        .zg-arena {
          width: min(94vw, 410px) !important;
          height: min(94vw, 410px) !important;
        }

        .zg-top-core {
          font-size: 21px !important;
        }

        .zg-result-actions,
        .zg-result-actions-fixed {
          gap: 9px !important;
        }

        .zg-result-actions .zg-btn,
        .zg-result-actions-fixed .zg-btn {
          min-height: 48px !important;
          font-size: 14px !important;
          padding-left: 8px !important;
          padding-right: 8px !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /*
   * =========================================================
   * 17. LEGACY COMPATIBILITY
   * =========================================================
   */

  function bindLegacyButtons() {
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

    window.playZeloHitEffect = function () {
      if (state.physicsPlayer && state.physicsEnemy) {
        createImpactEffect(
          (state.physicsPlayer.x + state.physicsEnemy.x) / 2,
          (state.physicsPlayer.y + state.physicsEnemy.y) / 2,
          18,
          state.physicsPlayer.color,
          state.physicsEnemy.color
        );
      }
    };
  }

  /*
   * =========================================================
   * 18. INIT
   * =========================================================
   */

  function init() {
    setH();
    injectSafetyCss();
    renderApp();
    initProfile();
    loadSelectedTop();
    loadDailyLimit();
    renderTopList();
    bindEvents();
    bindLegacyButtons();

    window.ZELO_GAME_VERSION = VERSION;

    setTimeout(resizeBattleCanvas, 120);

    try {
      console.log("[ZELO] physics game.js loaded", VERSION);
    } catch (err) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
