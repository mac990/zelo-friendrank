/*!
 * =========================================================
 * ZELO LIFF BEYBLADE GAME
 * game.js
 * Version: 202607130535
 *
 * Fixes:
 * - Restore battle hit effects
 * - Fix mobile arena boundary
 * - Fix duplicated result buttons
 * - Add dashboard tracking events
 * - Keep LIFF / Google Apps Script compatibility
 * =========================================================
 */

(function () {
  "use strict";

  /*
   * =========================================================
   * 01. CONFIG
   * =========================================================
   */

  var VERSION = "202607130535";

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

  var TOPS = {
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
      speed: 92,
      hp: 100,
      beats: "stamina"
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
      hp: 115,
      beats: "attack"
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
      hp: 108,
      beats: "defense"
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
      balance: 88,
      speed: 76,
      hp: 106,
      beats: ""
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
      speed: 84,
      hp: 104,
      beats: "stamina"
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
      hp: 110,
      beats: "attack"
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
      hp: 108,
      beats: "defense"
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
        label: "再接再厲獎勵",
        code: "TRY100",
        title: "100 元折扣券",
        note: "下次再挑戰，也可以使用本折扣碼。"
      },
      {
        label: "挑戰者獎勵",
        code: "RETRY50",
        title: "50 元折扣券",
        note: "結帳時輸入折扣碼即可使用。"
      }
    ]
  };

  /*
   * =========================================================
   * 02. STATE
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

    power: 0,
    chargeDirection: 1,
    chargeTimer: null,
    charging: false,
    launchGrade: "Normal Launch",
    launchBonus: 0,

    battleRunning: false,
    battleTimer: null,
    battleFrame: null,
    battleStartAt: 0,
    battleDone: false,
    resultLogged: false,

    playerHp: 100,
    enemyHp: 100,
    playerMaxHp: 100,
    enemyMaxHp: 100,

    playerPos: { x: 42, y: 58 },
    enemyPos: { x: 58, y: 42 },
    playerVel: { x: 0, y: 0 },
    enemyVel: { x: 0, y: 0 },

    score: 0,
    rank: "B",
    coupon: "ZELOPLAY",
    lastCouponReward: null,
    lastResult: null,

    typeStatus: "neutral",
    typeText: "屬性均勢",

    isBlocked: false,
    blockedCoupon: "",
    blockReason: "",

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    toastTimer: null,
    lastHitEffectAt: 0
  };

  /*
   * =========================================================
   * 03. DOM HELPERS
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

  function addClass(el, cls) {
    if (el && cls) {
      el.classList.add(cls);
    }
  }

  function removeClass(el, cls) {
    if (el && cls) {
      el.classList.remove(cls);
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

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return fallback;
    }
  }

  function setH() {
    var h =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      screen.height ||
      720;

    document.documentElement.style.setProperty("--zg-app-height", h + "px");
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
      setTimeout(fixBattleBoundary, 80);
      setTimeout(fixBattleBoundary, 240);
    }

    if (screenId === SCREENS.result) {
      setTimeout(fixResultButtons, 80);
      setTimeout(fixResultButtons, 300);
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

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /*
   * =========================================================
   * 04. GOOGLE / TRACKING
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
   * 05. DAILY LIMIT
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
   * 06. RENDER ROOT
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
              '<div class="zg-subtitle">選擇你的陀螺，挑戰好友排行榜。</div>' +
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
              '<div class="zg-arena-ring"></div>' +
              '<div class="zg-arena-logo">zelo</div>' +
              '<div class="zg-top zg-player-top" id="zg-player-top"></div>' +
              '<div class="zg-top zg-enemy-top" id="zg-enemy-top"></div>' +
              '<div class="zg-hit-layer" id="zg-hit-layer"></div>' +
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
   * 07. SELECT SCREEN
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
   * 08. BATTLE SETUP
   * =========================================================
   */

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

    if (isDailyBlocked()) {
      blockByDailyLimit();
      return;
    }

    state.battleDone = false;
    state.resultLogged = false;
    state.battleRunning = true;
    state.battleStartAt = Date.now();

    pickEnemy();
    calculateTypeStatus();

    state.playerMaxHp = Number(state.selectedTop.hp || 100);
    state.enemyMaxHp = Number(state.enemy.hp || 105);

    state.playerHp = state.playerMaxHp;
    state.enemyHp = state.enemyMaxHp;

    state.playerPos = { x: 42, y: 58 };
    state.enemyPos = { x: 58, y: 42 };

    state.playerVel = {
      x: rand(-0.28, 0.28),
      y: rand(-0.28, 0.28)
    };

    state.enemyVel = {
      x: rand(-0.25, 0.25),
      y: rand(-0.25, 0.25)
    };

    state.power = 100;
    state.launchBonus = 1;
    state.launchGrade = "Good Launch";

    go(SCREENS.battle);

    renderBattleInitial();
    updateHpUi();
    updateTopPositions();
    updateBattleMessage("Battle Start！陀螺高速旋轉中！");

    clearInterval(state.battleTimer);
    cancelAnimationFrame(state.battleFrame);

    state.battleTimer = setInterval(battleTick, 420);
    state.battleFrame = requestAnimationFrame(battleFrameLoop);
  }

  function renderBattleInitial() {
    var playerTop = qs("zg-player-top");
    var enemyTop = qs("zg-enemy-top");

    if (playerTop) {
      playerTop.className = "zg-top zg-player-top " + state.selectedTop.className;
      playerTop.innerHTML =
        '<div class="zg-top-core">' + escapeHtml(state.selectedTop.icon) + '</div>';
    }

    if (enemyTop) {
      enemyTop.className = "zg-top zg-enemy-top enemy";
      enemyTop.innerHTML =
        '<div class="zg-top-core">' + escapeHtml(state.enemy.icon) + '</div>';
    }
  }

  function updateBattleMessage(text) {
    safeText("zg-battle-message", text);
  }

  function battleFrameLoop() {
    if (!state.battleRunning) return;

    moveTopPhysics();
    updateTopPositions();

    state.battleFrame = requestAnimationFrame(battleFrameLoop);
  }

  function moveTopPhysics() {
    var p = state.playerPos;
    var e = state.enemyPos;
    var pv = state.playerVel;
    var ev = state.enemyVel;

    p.x += pv.x;
    p.y += pv.y;
    e.x += ev.x;
    e.y += ev.y;

    var bounds = getArenaPercentBounds();

    if (p.x < bounds.minX || p.x > bounds.maxX) pv.x *= -1;
    if (p.y < bounds.minY || p.y > bounds.maxY) pv.y *= -1;

    if (e.x < bounds.minX || e.x > bounds.maxX) ev.x *= -1;
    if (e.y < bounds.minY || e.y > bounds.maxY) ev.y *= -1;

    p.x = clamp(p.x, bounds.minX, bounds.maxX);
    p.y = clamp(p.y, bounds.minY, bounds.maxY);
    e.x = clamp(e.x, bounds.minX, bounds.maxX);
    e.y = clamp(e.y, bounds.minY, bounds.maxY);

    var dx = p.x - e.x;
    var dy = p.y - e.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 13) {
      pv.x *= -1;
      pv.y *= -1;
      ev.x *= -1;
      ev.y *= -1;

      p.x += dx > 0 ? 1.5 : -1.5;
      p.y += dy > 0 ? 1.5 : -1.5;
      e.x -= dx > 0 ? 1.5 : -1.5;
      e.y -= dy > 0 ? 1.5 : -1.5;

      playHitEffect();
    }
  }

  function getArenaPercentBounds() {
    return {
      minX: 14,
      maxX: 86,
      minY: 14,
      maxY: 86
    };
  }

  function updateTopPositions() {
    var playerTop = qs("zg-player-top");
    var enemyTop = qs("zg-enemy-top");

    if (playerTop) {
      playerTop.style.left = state.playerPos.x + "%";
      playerTop.style.top = state.playerPos.y + "%";
    }

    if (enemyTop) {
      enemyTop.style.left = state.enemyPos.x + "%";
      enemyTop.style.top = state.enemyPos.y + "%";
    }
  }

  function battleTick() {
    if (!state.battleRunning || state.battleDone) return;

    var player = state.selectedTop;
    var enemy = state.enemy;

    var playerPower =
      player.attack * 0.42 +
      player.speed * 0.25 +
      player.stamina * 0.12 +
      rand(0, 18);

    var enemyPower =
      enemy.attack * 0.42 +
      enemy.speed * 0.25 +
      enemy.stamina * 0.12 +
      rand(0, 18);

    if (state.typeStatus === "advantage") {
      playerPower *= 1.16;
      enemyPower *= 0.93;
    }

    if (state.typeStatus === "disadvantage") {
      playerPower *= 0.93;
      enemyPower *= 1.14;
    }

    playerPower *= 1 + state.launchBonus * 0.08;

    var playerDamage = Math.max(4, Math.round(playerPower / 13));
    var enemyDamage = Math.max(4, Math.round(enemyPower / 13));

    var playerDefenseFactor = Math.max(0.62, 1 - player.defense / 300);
    var enemyDefenseFactor = Math.max(0.62, 1 - enemy.defense / 300);

    var damageToEnemy = Math.round(playerDamage * enemyDefenseFactor);
    var damageToPlayer = Math.round(enemyDamage * playerDefenseFactor);

    if (Math.random() < 0.12) {
      damageToEnemy += 7;
      updateBattleMessage("Critical Hit！你造成強力撞擊！");
    } else if (Math.random() < 0.12) {
      damageToPlayer += 7;
      updateBattleMessage("敵方反擊！你的陀螺受到衝擊！");
    } else {
      updateBattleMessage(getBattleMessage());
    }

    state.enemyHp = Math.max(0, state.enemyHp - damageToEnemy);
    state.playerHp = Math.max(0, state.playerHp - damageToPlayer);

    updateHpUi();
    playHitEffect();

    if (state.enemyHp <= 0 || state.playerHp <= 0) {
      finishBattle();
    }
  }

  function getBattleMessage() {
    var list = [
      "撞擊！雙方高速碰撞！",
      "火花四散！陀螺正在搶位！",
      "連續攻擊！場地能量升高！",
      "Burst Rush！攻防正在拉鋸！",
      "Spin Clash！旋轉力量互相壓制！"
    ];

    if (state.typeStatus === "advantage") {
      list.push("屬性優勢！你的陀螺壓制對手！");
    }

    if (state.typeStatus === "disadvantage") {
      list.push("屬性劣勢！對手正在反壓！");
    }

    return pick(list);
  }

  function updateHpUi() {
    var playerPercent = Math.round((state.playerHp / state.playerMaxHp) * 100);
    var enemyPercent = Math.round((state.enemyHp / state.enemyMaxHp) * 100);

    playerPercent = clamp(playerPercent, 0, 100);
    enemyPercent = clamp(enemyPercent, 0, 100);

    var playerFill = qs("zg-player-hp");
    var enemyFill = qs("zg-enemy-hp");

    if (playerFill) playerFill.style.width = playerPercent + "%";
    if (enemyFill) enemyFill.style.width = enemyPercent + "%";

    safeText("zg-player-hp-text", playerPercent + "%");
    safeText("zg-enemy-hp-text", enemyPercent + "%");
  }

  function finishBattle() {
    if (state.battleDone) return;

    state.battleDone = true;
    state.battleRunning = false;

    clearInterval(state.battleTimer);
    cancelAnimationFrame(state.battleFrame);

    var isWin = state.enemyHp <= 0 && state.playerHp > 0;

    if (state.enemyHp <= 0 && state.playerHp <= 0) {
      isWin = state.playerHp >= state.enemyHp;
    }

    var duration = Math.max(1, Math.round((Date.now() - state.battleStartAt) / 1000));

    var hpBonus = Math.max(0, Math.round((state.playerHp / state.playerMaxHp) * 1000));
    var winBonus = isWin ? 1500 : 300;
    var typeBonus = state.typeStatus === "advantage" ? 350 : 0;
    var timeBonus = Math.max(0, 600 - duration * 20);

    state.score = Math.max(
      50,
      Math.round(winBonus + hpBonus + typeBonus + timeBonus + rand(0, 400))
    );

    state.rank = calculateRank(state.score);
    state.lastCouponReward = chooseCoupon(isWin);
    state.coupon = state.lastCouponReward.code;

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
      launchGrade: state.launchGrade,
      duration: duration,
      playerHp: state.playerHp,
      enemyHp: state.enemyHp,
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

    if (score >= 2600) return "S";
    if (score >= 1900) return "A";
    if (score >= 1100) return "B";
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
      launchGrade: r.launchGrade,
      duration: r.duration,
      playerHp: r.playerHp,
      enemyHp: r.enemyHp,

      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });
  }

  /*
   * =========================================================
   * 09. HIT EFFECTS
   * =========================================================
   */

  function playHitEffect() {
    var now = Date.now();

    if (now - state.lastHitEffectAt < 90) return;
    state.lastHitEffectAt = now;

    var arena = qs("zg-arena");
    var layer = qs("zg-hit-layer");

    if (!arena) return;

    var rect = arena.getBoundingClientRect();

    var x =
      rect.left +
      ((state.playerPos.x + state.enemyPos.x) / 2 / 100) * rect.width;

    var y =
      rect.top +
      ((state.playerPos.y + state.enemyPos.y) / 2 / 100) * rect.height;

    createHitElement("zg-hit-spark", x, y);
    createHitElement("zg-hit-ring", x, y);
    createHitElement("zg-hit-slash", x, y);

    arena.classList.remove("zg-arena-shake");
    void arena.offsetWidth;
    arena.classList.add("zg-arena-shake");

    var playerTop = qs("zg-player-top");
    var enemyTop = qs("zg-enemy-top");

    if (playerTop) {
      playerTop.classList.add("zg-top-hit");
      setTimeout(function () {
        playerTop.classList.remove("zg-top-hit");
      }, 180);
    }

    if (enemyTop) {
      enemyTop.classList.add("zg-top-hit");
      setTimeout(function () {
        enemyTop.classList.remove("zg-top-hit");
      }, 180);
    }
  }

  function createHitElement(cls, x, y) {
    var el = document.createElement("div");
    el.className = cls;
    el.style.left = x + "px";
    el.style.top = y + "px";

    if (cls === "zg-hit-slash") {
      el.style.transform =
        "translate(-50%, -50%) rotate(" +
        Math.round(rand(-45, 45)) +
        "deg) scaleX(0.4)";
    }

    document.body.appendChild(el);

    setTimeout(function () {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 620);
  }

  window.playZeloHitEffect = playHitEffect;

  /*
   * =========================================================
   * 10. BOUNDARY FIX
   * =========================================================
   */

  function fixBattleBoundary() {
    var arena = qs("zg-arena");
    if (!arena) return;

    state.playerPos.x = clamp(state.playerPos.x, 14, 86);
    state.playerPos.y = clamp(state.playerPos.y, 14, 86);
    state.enemyPos.x = clamp(state.enemyPos.x, 14, 86);
    state.enemyPos.y = clamp(state.enemyPos.y, 14, 86);

    updateTopPositions();
  }

  function startBoundaryGuard() {
    setInterval(function () {
      if (state.currentScreen === SCREENS.battle) {
        fixBattleBoundary();
      }
    }, 160);

    window.addEventListener("resize", function () {
      setH();
      setTimeout(fixBattleBoundary, 80);
      setTimeout(fixBattleBoundary, 260);
    });

    window.addEventListener("orientationchange", function () {
      setH();
      setTimeout(fixBattleBoundary, 150);
      setTimeout(fixBattleBoundary, 500);
    });
  }

  /*
   * =========================================================
   * 11. RESULT
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
   * 12. ACTIONS
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

    clearInterval(state.battleTimer);
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
   * 13. EVENT BINDING
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
      fixBattleBoundary();
      fixResultButtons();
    });
  }

  /*
   * =========================================================
   * 14. LIFF / PROFILE
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
   * 15. CSS SAFETY INJECTION
   * =========================================================
   */

  function injectSafetyCss() {
    if (document.getElementById("zg-game-js-safety-css")) return;

    var style = document.createElement("style");
    style.id = "zg-game-js-safety-css";
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
      }

      .zg-top {
        position: absolute !important;
        width: clamp(54px, 15vw, 78px) !important;
        height: clamp(54px, 15vw, 78px) !important;
        margin-left: calc(clamp(54px, 15vw, 78px) / -2) !important;
        margin-top: calc(clamp(54px, 15vw, 78px) / -2) !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        will-change: left, top, transform !important;
        transform-origin: center center !important;
        pointer-events: none !important;
        animation: zgTopSpin 0.55s linear infinite;
      }

      .zg-top-core {
        width: 100% !important;
        height: 100% !important;
        border-radius: 999px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 28px !important;
        background:
          radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.15) 22%, transparent 38%),
          conic-gradient(from 0deg, #ff0033, #ffcc00, #00a6ff, #9b5cff, #ff0033);
        box-shadow:
          0 0 18px rgba(255,255,255,0.28),
          inset 0 0 18px rgba(0,0,0,0.35);
      }

      .zg-enemy-top .zg-top-core {
        background:
          radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.12) 22%, transparent 38%),
          conic-gradient(from 0deg, #00a6ff, #001eff, #ff0033, #ffcc00, #00a6ff);
      }

      @keyframes zgTopSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .zg-hit-spark {
        position: fixed;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: radial-gradient(circle, #ffffff 0%, #ffe66d 25%, #ff9f00 55%, rgba(255,64,0,0) 74%);
        pointer-events: none;
        z-index: 99999;
        transform: translate(-50%, -50%) scale(0.35);
        animation: zgHitSpark 420ms ease-out forwards;
        mix-blend-mode: screen;
      }

      .zg-hit-ring {
        position: fixed;
        width: 50px;
        height: 50px;
        border: 3px solid rgba(255, 214, 64, 0.95);
        border-radius: 999px;
        pointer-events: none;
        z-index: 99998;
        transform: translate(-50%, -50%) scale(0.28);
        animation: zgHitRing 460ms ease-out forwards;
        box-shadow: 0 0 18px rgba(255, 214, 64, 0.9);
        mix-blend-mode: screen;
      }

      .zg-hit-slash {
        position: fixed;
        width: 78px;
        height: 8px;
        border-radius: 999px;
        pointer-events: none;
        z-index: 99997;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.98), rgba(255,0,22,0));
        animation: zgHitSlash 360ms ease-out forwards;
        mix-blend-mode: screen;
      }

      .zg-arena-shake {
        animation: zgArenaShake 220ms ease-in-out;
      }

      .zg-top-hit {
        filter: brightness(1.35) saturate(1.35) drop-shadow(0 0 12px rgba(255,230,109,0.95)) !important;
      }

      @keyframes zgHitSpark {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(0.25);
        }
        45% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1.9);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(2.9);
        }
      }

      @keyframes zgHitRing {
        0% {
          opacity: 1;
          transform: translate(-50%, -50%) scale(0.3);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.9);
        }
      }

      @keyframes zgHitSlash {
        0% {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(-25deg) scaleX(0.2);
        }
        30% {
          opacity: 1;
          transform: translate(-50%, -50%) rotate(-25deg) scaleX(1);
        }
        100% {
          opacity: 0;
          transform: translate(-50%, -50%) rotate(-25deg) scaleX(1.28);
        }
      }

      @keyframes zgArenaShake {
        0% { transform: translate3d(0, 0, 0); }
        20% { transform: translate3d(-5px, 2px, 0); }
        40% { transform: translate3d(5px, -2px, 0); }
        60% { transform: translate3d(-3px, 1px, 0); }
        80% { transform: translate3d(3px, -1px, 0); }
        100% { transform: translate3d(0, 0, 0); }
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
   * 16. COMPATIBILITY WITH EXISTING HTML / OLD BUTTONS
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
  }

  /*
   * =========================================================
   * 17. INIT
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
    startBoundaryGuard();

    window.ZELO_GAME_VERSION = VERSION;

    try {
      console.log("[ZELO] game.js loaded", VERSION);
    } catch (err) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
