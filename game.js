(function () {
  "use strict";

  /* ===================== 基本設定 ===================== */

  var LIFF_ID = "2007022255-ph9gRwPs";
  var RANK_LIFF_ID = "2007022255-lfPkJn2u";
  var GAS_URL = "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";
  var DAILY_LIMIT = 3;
  var DEFAULT_COUPON = "ZELO100";
  var SHARE_BASE_URL = "https://liff.line.me/2007022255-ph9gRwPs";

  /* ===================== 遊戲資料 ===================== */

  var tops = {
    attack: {
      id: "attack",
      name: "烈焰攻擊陀螺",
      typeName: "攻擊型",
      icon: "🔥",
      className: "attack",
      attack: 82,
      defense: 45,
      stamina: 50,
      balance: 59,
      beats: "defense"
    },
    defense: {
      id: "defense",
      name: "冰霜防禦陀螺",
      typeName: "防禦型",
      icon: "🛡️",
      className: "defense",
      attack: 48,
      defense: 85,
      stamina: 55,
      balance: 63,
      beats: "stamina"
    },
    stamina: {
      id: "stamina",
      name: "疾風耐久陀螺",
      typeName: "耐久型",
      icon: "🌪️",
      className: "stamina",
      attack: 50,
      defense: 52,
      stamina: 88,
      balance: 63,
      beats: "attack"
    }
  };

  var enemies = [
    {
      id: "attack",
      typeName: "攻擊型",
      icon: "🔥",
      attack: 76,
      beats: "defense"
    },
    {
      id: "defense",
      typeName: "防禦型",
      icon: "🛡️",
      attack: 70,
      beats: "stamina"
    },
    {
      id: "stamina",
      typeName: "耐久型",
      icon: "🌪️",
      attack: 72,
      beats: "attack"
    }
  ];

  /* ===================== 全域狀態 ===================== */

  var state = {
    profile: null,
    inviterId: null,
    inviterName: null,

    isBlocked: false,
    blockReason: "",
    blockedCoupon: "",
    blockedRecorded: false,

    couponDuplicate: false,
    existingCoupon: "",

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    selectedTop: null,
    enemy: null,

    power: 0,
    charging: false,
    chargeDirection: 1,
    chargeTimer: null,

    launchGrade: "",
    launchBonus: 0,

    typeStatus: "neutral",
    typeText: "",

    playerHp: 100,
    enemyHp: 100,
    battleDone: false,

    score: 0,
    rank: "B",

    debugMode: false
  };

  /* ===================== DOM 輔助函式 ===================== */

  function qs(id) {
    return document.getElementById(id);
  }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  var toastTimer = null;

  function toast(msg) {
    var el = qs("zg-toast") || document.querySelector(".zg-toast");

    if (!el) {
      console.log("[toast]", msg);
      return;
    }

    el.textContent = msg;
    el.style.display = "block";

    if (toastTimer) clearTimeout(toastTimer);

    toastTimer = setTimeout(function () {
      el.style.display = "none";
    }, 2200);
  }

  function go(screenId) {
    document.querySelectorAll(".zg-screen").forEach(function (s) {
      s.classList.remove("active");
      s.style.display = "none";
      s.style.pointerEvents = "none";
      s.style.zIndex = "0";
    });

    var target = qs(screenId);

    if (target) {
      target.classList.add("active");
      target.style.display = "";
      target.style.pointerEvents = "auto";
      target.style.position = target.style.position || "relative";
      target.style.zIndex = "10";
    }

    if (screenId !== "screen-battle") {
      disableBattlePointerLayers();
    } else {
      var battleBox = document.querySelector(".zg-battle-box");
      if (battleBox) battleBox.style.pointerEvents = "auto";
    }
  }

  function disableBattlePointerLayers() {
    [
      "zg-spark",
      "zg-flash-overlay",
      "zg-player-battle-top",
      "zg-enemy-battle-top"
    ].forEach(function (id) {
      var el = qs(id);
      if (el) el.style.pointerEvents = "none";
    });

    document.querySelectorAll(".zg-trail, .zg-spark, .zg-flash-overlay, .zg-battle-top").forEach(function (el) {
      el.style.pointerEvents = "none";
    });

    var battleBox = document.querySelector(".zg-battle-box");
    if (battleBox) battleBox.style.pointerEvents = "none";
  }

  function getUrlParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function setAppHeight() {
    var h = window.innerHeight;
    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }

  window.addEventListener("resize", setAppHeight);
  setAppHeight();

  state.debugMode = getUrlParam("debug") === "1";

  /* ===================== GAS API ===================== */

  function gasGet(action, params, callback) {
    if (!GAS_URL || GAS_URL.indexOf("REPLACE_WITH") !== -1) {
      console.warn("[GAS GET] URL 尚未設定，略過請求：", action);
      callback && callback(null);
      return;
    }

    var qsStr = "?action=" + encodeURIComponent(action);

    params = params || {};

    for (var key in params) {
      if (
        Object.prototype.hasOwnProperty.call(params, key) &&
        params[key] !== undefined &&
        params[key] !== null
      ) {
        qsStr += "&" + key + "=" + encodeURIComponent(params[key]);
      }
    }

    fetch(GAS_URL + qsStr)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        callback && callback(data);
      })
      .catch(function (err) {
        console.error("[GAS GET] 請求失敗：", action, err);
        callback && callback(null);
      });
  }

  function gasPost(payload, callback) {
    if (!GAS_URL || GAS_URL.indexOf("REPLACE_WITH") !== -1) {
      console.warn("[GAS POST] URL 尚未設定，略過請求");
      callback && callback(null);
      return;
    }

    fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json();
    }).then(function (data) {
      callback && callback(data);
    }).catch(function (err) {
      console.error("[GAS POST] 請求失敗：", err);
      callback && callback(null);
    });
  }

  function checkDailyLimit(userId, callback) {
    gasGet("checkDailyLimit", {
      userId: userId
    }, callback);
  }

  function checkCouponStatus(userId, callback) {
    gasGet("checkCoupon", {
      userId: userId
    }, callback);
  }

  function getBasePayload() {
    return {
      playerName: state.profile ? state.profile.displayName : "",
      userId: state.profile ? state.profile.userId : "",
      inviterId: state.inviterId || "",
      inviterName: state.inviterName || "",
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };
  }

  function recordEvent(eventType, extra, callback) {
    var payload = getBasePayload();

    payload.eventType = eventType;

    extra = extra || {};

    for (var key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        payload[key] = extra[key];
      }
    }

    gasPost(payload, callback);
  }

  function recordBlockedOnce() {
    if (state.blockedRecorded) return;

    state.blockedRecorded = true;

    recordEvent("blocked", {
      blockReason: state.blockReason || "",
      coupon: state.blockedCoupon || state.existingCoupon || ""
    });
  }

  function recordPlay(userId, score, rank, couponCode) {
    gasPost({
      eventType: "result",
      playerName: state.profile ? state.profile.displayName : "",
      userId: userId,

      inviterId: state.inviterId || "",
      inviterName: state.inviterName || "",

      topName: state.selectedTop ? state.selectedTop.name : "",
      topType: state.selectedTop ? state.selectedTop.id : "",

      enemyName: state.enemy ? (state.enemy.typeName || "") : "",
      enemyType: state.enemy ? state.enemy.id : "",

      typeStatus: state.typeStatus || "",
      typeText: state.typeText || "",
      enemyPerfect: "",

      power: state.power,
      launchGrade: state.launchGrade || "",

      score: score,
      rank: rank,
      coupon: couponCode,

      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  function recordInviteRelation() {
    if (!state.inviterId || !state.profile) return;
    if (state.inviterId === state.profile.userId) return;

    gasPost({
      eventType: "invite_bind",
      inviterId: state.inviterId,
      inviterName: state.inviterName || "",
      userId: state.profile.userId,
      playerName: state.profile.displayName || "",
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  function renderRankList(listEl, data) {
    if (!listEl) return;

    if (!data) {
      listEl.innerHTML = '<div class="zg-rank-empty">排行榜暫時無法載入</div>';
      return;
    }

    if (!data.top || data.top.length === 0) {
      listEl.innerHTML = '<div class="zg-rank-empty">目前尚無邀請紀錄，快邀請好友衝上第一名！</div>';
      return;
    }

    var html = "";

    data.top.forEach(function (item, idx) {
      html += '<div class="zg-rank-item">' +
        '<span class="zg-rank-no">' + (idx + 1) + '</span>' +
        '<span class="zg-rank-name">' + (item.name || "玩家") + '</span>' +
        '<span class="zg-rank-count">邀請 ' + item.count + ' 人</span>' +
        '</div>';
    });

    if (data.myRank && data.myRank > 3) {
      html += '<div class="zg-rank-item me">' +
        '<span class="zg-rank-no">' + data.myRank + '</span>' +
        '<span class="zg-rank-name">我</span>' +
        '<span class="zg-rank-count">邀請 ' + data.myCount + ' 人</span>' +
        '</div>';
    }

    listEl.innerHTML = html;
  }

  function refreshRankPreviews() {
    var listEls = [
      qs("zg-rank-list"),
      qs("zg-result-rank-list"),
      qs("zg-blocked-rank-list")
    ].filter(Boolean);

    if (listEls.length === 0) return;

    var userId = state.profile ? state.profile.userId : "";

    gasGet("getFriendRankPreview", {
      userId: userId
    }, function (data) {
      listEls.forEach(function (el) {
        renderRankList(el, data);
      });
    });
  }

  function applyBlockedScreenText() {
    if (state.blockReason === "limit") {
      safeText("zg-blocked-title", "今日挑戰次數已用完");
      safeText("zg-blocked-desc", "明天再來挑戰吧！或邀請好友一起玩。");
    } else if (state.blockReason === "coupon") {
      safeText("zg-blocked-title", "您已領取過優惠碼");
      safeText("zg-blocked-desc", "每人限領一次，請直接使用優惠碼：");
    }
  }

  function updateRemainingUI() {
    safeText("zg-remaining-plays", state.remainingPlays);
    safeText("zg-remaining-note", "今日剩餘挑戰次數：" + state.remainingPlays + " / " + DAILY_LIMIT);
    safeText("zg-remaining-after-note", "今日剩餘挑戰次數：" + state.remainingPlays + " / " + DAILY_LIMIT);
  }

  /* ===================== LIFF 初始化 ===================== */

  function initLiff() {
    state.inviterId = getUrlParam("inviter");
    state.inviterName = getUrlParam("inviterName");

    var isShopifyEditor =
      window.location.href.indexOf("admin.shopify.com") !== -1 ||
      window.location.href.indexOf("preview_theme_id") !== -1 ||
      window.location.href.indexOf("_ab=") !== -1 ||
      window.top !== window.self;

    if (isShopifyEditor) {
      console.warn("[LIFF] Shopify editor/iframe detected, skip liff.login()");
      refreshRankPreviews();
      setStartButtonReady();
      return;
    }

    if (typeof liff === "undefined") {
      refreshRankPreviews();
      setStartButtonReady();
      return;
    }

    setStartButtonChecking();

    liff.init({
      liffId: LIFF_ID
    }).then(function () {
      if (!liff.isLoggedIn()) {
        liff.login();
        return null;
      }

      return liff.getProfile();
    }).then(function (profile) {
      if (!profile) {
        refreshRankPreviews();
        setStartButtonReady();
        return;
      }

      state.profile = profile;

      if (state.inviterId && state.inviterId === profile.userId) {
        state.inviterId = "";
        state.inviterName = "";
      }

      safeText("zg-player-name", "哈囉，" + (profile.displayName || "玩家") + "！準備好發射了嗎？");

      recordInviteRelation();

      var pending = 2;
      var couponDuplicate = false;
      var couponCode = DEFAULT_COUPON;

      function finalizeBlockCheck() {
        pending -= 1;
        if (pending > 0) return;

        state.couponDuplicate = couponDuplicate;
        state.existingCoupon = couponCode || DEFAULT_COUPON;

        if (state.remainingPlays <= 0) {
          state.isBlocked = true;
          state.blockReason = "limit";
        } else {
          state.isBlocked = false;
          state.blockReason = "";
        }

        if (state.isBlocked) {
          applyBlockedScreenText();
          recordBlockedOnce();
        }

        setStartButtonReady();
      }

      checkCouponStatus(profile.userId, function (result) {
        if (result && result.duplicate) {
          couponDuplicate = true;
          couponCode = result.coupon || DEFAULT_COUPON;
          safeText("zg-blocked-coupon-code", couponCode);
        }

        finalizeBlockCheck();
      });

      checkDailyLimit(profile.userId, function (result) {
        var used = 0;

        if (result && typeof result.playsUsed !== "undefined") {
          used = Number(result.playsUsed) || 0;
        } else if (result && typeof result.playedToday !== "undefined") {
          used = Number(result.playedToday) || 0;
        }

        state.playsUsed = used;
        state.remainingPlays = Math.max(0, DAILY_LIMIT - used);

        updateRemainingUI();
        finalizeBlockCheck();
      });

      refreshRankPreviews();
    }).catch(function (err) {
      console.error("LIFF init failed:", err);
      refreshRankPreviews();
      setStartButtonReady();
    });
  }

  function setStartButtonChecking() {
    var btn = qs("btn-start");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "檢查中...";
    }
  }

  function setStartButtonReady() {
    var btn = qs("btn-start");

    if (btn) {
      btn.disabled = false;
      btn.textContent = "開始挑戰";
    }
  }

  /* ===================== 發射流程 ===================== */

  function getLaunchGrade(power) {
    if (power >= 78 && power <= 82) {
      return {
        label: "Perfect Launch",
        bonus: 34
      };
    }

    if ((power >= 66 && power < 78) || (power > 82 && power <= 88)) {
      return {
        label: "Good Launch",
        bonus: 12
      };
    }

    if (power > 88) {
      return {
        label: "Over Launch",
        bonus: -18
      };
    }

    if (power >= 42) {
      return {
        label: "Normal Launch",
        bonus: 3
      };
    }

    return {
      label: "Weak Launch",
      bonus: -8
    };
  }

  function updatePower(value) {
    state.power = Math.max(0, Math.min(100, value));

    var fill = qs("zg-meter-fill");
    if (fill) fill.style.width = state.power + "%";

    var pointer = qs("zg-meter-pointer");
    if (pointer) pointer.style.left = state.power + "%";

    safeText("zg-power-text", Math.round(state.power) + "%");

    var gradeEl = qs("zg-launch-grade");
    if (gradeEl) gradeEl.textContent = getLaunchGrade(state.power).label;
  }

  function selectTop(id) {
    var top = tops[id];
    if (!top) return;

    state.selectedTop = top;

    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.classList.toggle("selected", card.getAttribute("data-id") === id);
    });

    var nextBtn = qs("btn-select-next");
    if (nextBtn) nextBtn.disabled = false;

    safeText("zg-selected-note", "已選擇：" + top.name + "｜" + top.typeName);
  }

  function prepareLaunchScreen() {
    if (!state.selectedTop) return;

    var launchTop = qs("zg-launch-top");

    if (launchTop) {
      launchTop.textContent = state.selectedTop.icon;
      launchTop.className = "zg-launch-top " + state.selectedTop.className;
    }

    updatePower(0);
    safeText("zg-launch-grade", "等待發射");
  }

  function startCharge() {
    if (!state.selectedTop) {
      toast("請先選擇陀螺");
      return;
    }

    if (state.charging) return;
    if (state.chargeTimer) clearInterval(state.chargeTimer);

    state.charging = true;
    state.power = 0;
    state.chargeDirection = 1;

    updatePower(0);

    state.chargeTimer = setInterval(function () {
      var speed = 2.6;

      if (state.power >= 45) speed = 3.2;
      if (state.power >= 65) speed = 3.8;
      if (state.power >= 75) speed = 4.4;
      if (state.power >= 86) speed = 5.0;

      state.power += speed * state.chargeDirection;

      if (state.power >= 100) {
        state.power = 100;
        state.chargeDirection = -1;
      }

      if (state.power <= 0) {
        state.power = 0;
        state.chargeDirection = 1;
      }

      updatePower(state.power);
    }, 28);
  }

  function releaseLaunch() {
    if (!state.charging) return;

    state.charging = false;

    if (state.chargeTimer) {
      clearInterval(state.chargeTimer);
      state.chargeTimer = null;
    }

    var grade = getLaunchGrade(state.power);

    state.launchGrade = grade.label;
    state.launchBonus = grade.bonus;

    chooseEnemy();
    go("screen-battle");

    requestAnimationFrame(function () {
      prepareBattle();
      setTimeout(runBattle, 400);
    });
  }

  function chooseEnemy() {
    var list = enemies.filter(function (enemy) {
      return enemy.id !== state.selectedTop.id;
    });

    state.enemy = list[Math.floor(Math.random() * list.length)] || enemies[0];
  }

  function getTypeText() {
    if (!state.selectedTop || !state.enemy) {
      state.typeStatus = "neutral";
      state.typeText = "屬性均勢";
      return state.typeText;
    }

    if (state.selectedTop.beats === state.enemy.id) {
      state.typeStatus = "good";
      state.typeText = "屬性優勢！你的 " + state.selectedTop.typeName + " 剋制對手 " + state.enemy.typeName;
    } else if (state.enemy.beats === state.selectedTop.id) {
      state.typeStatus = "bad";
      state.typeText = "屬性劣勢！對手 " + state.enemy.typeName + " 剋制你的 " + state.selectedTop.typeName;
    } else {
      state.typeStatus = "neutral";
      state.typeText = "屬性均勢，勢均力敵";
    }

    return state.typeText;
  }

  /* ===================== 物理戰鬥引擎 ===================== */

  var PHY = {
    arena: {
      w: 300,
      h: 240,
      cx: 150,
      cy: 120
    },
    radius: 32,
    centerPull: 0.22,
    seekForceBase: 0.55,
    seekForceMax: 1.55,
    curveForce: 70,
    wallRestitution: 0.86,
    hitRestitution: 1.02,
    collisionCooldownMs: 140,
    maxBattleMs: 9000,
    subSteps: 4,
    maxSpeed: 480,
    tensionRampMs: 6000
  };

  var player = null;
  var enemy = null;
  var battleRAF = null;
  var lastFrameTs = 0;
  var battleStartTs = 0;
  var collisionLockUntil = 0;
  var commentaryTimer = null;
  var playerBasePower = 0;
  var enemyBasePower = 0;
  var sparkEl = null;
  var playerSpinAngle = 0;
  var enemySpinAngle = 0;
  var collisionCountTotal = 0;

  function ensureSparkEl(box) {
    sparkEl = qs("zg-spark");

    if (!sparkEl) {
      sparkEl = document.createElement("div");
      sparkEl.id = "zg-spark";
      sparkEl.className = "zg-spark";
      sparkEl.style.pointerEvents = "none";
      box.appendChild(sparkEl);
    } else {
      sparkEl.style.pointerEvents = "none";
    }

    return sparkEl;
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function makeBody(startX, startY, angleDeg, curveSign) {
    var speed = randRange(150, 210);
    var rad = angleDeg * Math.PI / 180;

    return {
      x: startX,
      y: startY,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      curveSign: curveSign
    };
  }

  function initPhysicsBodies() {
    var box = document.querySelector(".zg-battle-box");
    if (!box) return;

    box.style.position = "relative";
    box.style.overflow = "hidden";

    var w = box.clientWidth || 300;
    var h = box.clientHeight || 240;

    PHY.arena.w = w;
    PHY.arena.h = h;
    PHY.arena.cx = w / 2;
    PHY.arena.cy = h / 2;

    var playerEl = qs("zg-player-battle-top");
    var enemyEl = qs("zg-enemy-battle-top");

    var sizeRef = 0;

    if (playerEl) sizeRef = Math.max(sizeRef, playerEl.offsetWidth || 0);
    if (enemyEl) sizeRef = Math.max(sizeRef, enemyEl.offsetWidth || 0);

    PHY.radius = sizeRef > 0 ? sizeRef / 2 : 32;

    [playerEl, enemyEl].forEach(function (el) {
      if (!el) return;

      el.style.position = "absolute";
      el.style.left = "0";
      el.style.top = "0";
      el.style.transformOrigin = "center center";
      el.style.opacity = "1";
      el.style.transition = "";
      el.style.pointerEvents = "none";
      el.classList.remove("ko-fly", "win-pulse");
    });

    ensureSparkEl(box);
    initTrailPool(box);

    var enterAngle = randRange(-30, 30);

    player = makeBody(
      w * 0.25,
      h * 0.5 + randRange(-25, 25),
      enterAngle,
      Math.random() < 0.5 ? 1 : -1
    );

    enemy = makeBody(
      w * 0.75,
      h * 0.5 + randRange(-25, 25),
      180 + enterAngle,
      Math.random() < 0.5 ? 1 : -1
    );

    collisionCountTotal = 0;
  }

  function triggerSpark(px, py) {
    if (!sparkEl) return;

    var xPct = (px / PHY.arena.w) * 100;
    var yPct = (py / PHY.arena.h) * 100;

    sparkEl.style.left = xPct + "%";
    sparkEl.style.top = yPct + "%";
    sparkEl.style.pointerEvents = "none";
    sparkEl.classList.remove("active");

    void sparkEl.offsetWidth;

    sparkEl.classList.add("active");
  }

  function shakeBox() {
    var box = document.querySelector(".zg-battle-box");
    if (!box) return;

    box.classList.remove("shake");

    void box.offsetWidth;

    box.classList.add("shake");
  }

  function hpRatioOf(who) {
    if (who === "player") return Math.max(0, state.playerHp) / 100;
    return Math.max(0, state.enemyHp) / 100;
  }

  function getTensionFactor(now) {
    var elapsed = now - battleStartTs;
    return Math.min(1, elapsed / PHY.tensionRampMs);
  }

  function clampSpeed(body) {
    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);

    if (speed > PHY.maxSpeed) {
      var scale = PHY.maxSpeed / speed;
      body.vx *= scale;
      body.vy *= scale;
    }
  }

  function applyForces(body, opponent, who, dt, now) {
    var tension = getTensionFactor(now);

    var dxc = PHY.arena.cx - body.x;
    var dyc = PHY.arena.cy - body.y;
    var centerPull = PHY.centerPull * (1 + tension * 0.6);

    body.vx += dxc * centerPull * dt;
    body.vy += dyc * centerPull * dt;

    var dxo = opponent.x - body.x;
    var dyo = opponent.y - body.y;
    var distO = Math.sqrt(dxo * dxo + dyo * dyo) || 1;
    var seekForce = PHY.seekForceBase + (PHY.seekForceMax - PHY.seekForceBase) * tension;

    body.vx += (dxo / distO) * seekForce * 100 * dt;
    body.vy += (dyo / distO) * seekForce * 100 * dt;

    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);

    if (speed > 4) {
      var px = -body.vy / speed;
      var py = body.vx / speed;

      body.vx += px * body.curveSign * PHY.curveForce * dt;
      body.vy += py * body.curveSign * PHY.curveForce * dt;
    }

    var hpRatio = hpRatioOf(who);
    var damping = 0.996 - (1 - hpRatio) * 0.018;

    body.vx *= damping;
    body.vy *= damping;

    clampSpeed(body);
  }

  function resolveWallCollision(body) {
    var r = PHY.radius;
    var bounced = false;

    if (body.x - r < 0) {
      body.x = r;
      body.vx = -body.vx * PHY.wallRestitution;
      bounced = true;
    } else if (body.x + r > PHY.arena.w) {
      body.x = PHY.arena.w - r;
      body.vx = -body.vx * PHY.wallRestitution;
      bounced = true;
    }

    if (body.y - r < 0) {
      body.y = r;
      body.vy = -body.vy * PHY.wallRestitution;
      bounced = true;
    } else if (body.y + r > PHY.arena.h) {
      body.y = PHY.arena.h - r;
      body.vy = -body.vy * PHY.wallRestitution;
      bounced = true;
    }

    if (bounced) {
      body.vx += randRange(-30, 30);
      body.vy += randRange(-30, 30);
      shakeBox();
      triggerSpark(body.x, body.y);
      fireCommentary("WALL_BOUNCE");
    }

    return bounced;
  }

  function resolveTopCollision(now) {
    var dx = enemy.x - player.x;
    var dy = enemy.y - player.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var minDist = PHY.radius * 2 * 0.9;

    if (dist >= minDist) return false;
    if (now < collisionLockUntil) return false;

    var nx = dist > 0.001 ? dx / dist : 1;
    var ny = dist > 0.001 ? dy / dist : 0;

    var overlap = minDist - dist;

    player.x -= nx * overlap * 0.5;
    player.y -= ny * overlap * 0.5;
    enemy.x += nx * overlap * 0.5;
    enemy.y += ny * overlap * 0.5;

    var relVx = enemy.vx - player.vx;
    var relVy = enemy.vy - player.vy;
    var relSpeed = relVx * nx + relVy * ny;

    if (relSpeed > 0) return false;

    var tangentJitter = randRange(-0.4, 0.4);
    var tx = -ny;
    var ty = nx;

    var impulse = -(1 + PHY.hitRestitution) * relSpeed / 2;

    player.vx -= impulse * nx;
    player.vy -= impulse * ny;
    enemy.vx += impulse * nx;
    enemy.vy += impulse * ny;

    player.vx += tx * tangentJitter * Math.abs(impulse);
    player.vy += ty * tangentJitter * Math.abs(impulse);
    enemy.vx -= tx * tangentJitter * Math.abs(impulse);
    enemy.vy -= ty * tangentJitter * Math.abs(impulse);

    clampSpeed(player);
    clampSpeed(enemy);

    collisionLockUntil = now + PHY.collisionCooldownMs;
    collisionCountTotal += 1;

    var midX = (player.x + enemy.x) / 2;
    var midY = (player.y + enemy.y) / 2;
    var impactForce = Math.abs(impulse);

    triggerSpark(midX, midY);
    shakeBox();

    var isHeavyHit = impactForce > 150;
    var hitstopMs = isHeavyHit ? 100 : 50;

    triggerHitstop(hitstopMs);
    triggerCameraPunch();
    triggerFlash();

    applySquashStretch(qs("zg-player-battle-top"), -nx, -ny, isHeavyHit ? 0.34 : 0.17);
    applySquashStretch(qs("zg-enemy-battle-top"), nx, ny, isHeavyHit ? 0.34 : 0.17);

    var playerPowerFactor = (playerBasePower + impactForce) / 10;
    var enemyPowerFactor = (enemyBasePower + impactForce) / 10;

    var playerHit = Math.max(2.5, enemyPowerFactor * 0.55 + Math.random() * 3);
    var enemyHit = Math.max(2.5, playerPowerFactor * 0.55 + Math.random() * 3);

    state.enemyHp -= enemyHit;
    state.playerHp -= playerHit;

    updateHpUI();
    registerCollisionEvent(isHeavyHit, now);

    return true;
  }

  function renderBody(el, body, angleAccum) {
    if (!el) return;

    var half = PHY.radius;

    el.style.transform =
      "translate(" + (body.x - half) + "px," + (body.y - half) + "px) rotate(" + angleAccum + "deg)";
  }
  /* ===================== 打擊感系統 ===================== */

  var FEEL = {
    hitstopUntil: 0,
    trailPool: [],
    trailMax: 8,
    burstCooldownPlayer: 0,
    burstCooldownEnemy: 0
  };

  function initTrailPool(box) {
    FEEL.trailPool.forEach(function (t) {
      if (t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el);
    });

    FEEL.trailPool = [];

    for (var i = 0; i < FEEL.trailMax * 2; i++) {
      var t = document.createElement("div");

      t.className = "zg-trail";
      t.style.position = "absolute";
      t.style.left = "0";
      t.style.top = "0";
      t.style.opacity = "0";
      t.style.pointerEvents = "none";

      box.appendChild(t);
      FEEL.trailPool.push({
        el: t,
        age: 999
      });
    }

    var oldFlash = qs("zg-flash-overlay");

    if (oldFlash && oldFlash.parentNode) oldFlash.parentNode.removeChild(oldFlash);

    var flash = document.createElement("div");

    flash.className = "zg-flash-overlay";
    flash.id = "zg-flash-overlay";
    flash.style.pointerEvents = "none";

    box.appendChild(flash);
  }

  function pushTrail(groupIndex, body, colorHex, size) {
    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);

    if (speed < 70) return;

    var groupStart = groupIndex === 0 ? 0 : FEEL.trailMax;
    var idx = groupStart + (Math.floor(performance.now() / 14) % FEEL.trailMax);
    var trail = FEEL.trailPool[idx];

    if (!trail) return;

    trail.el.style.width = size + "px";
    trail.el.style.height = size + "px";
    trail.el.style.borderRadius = "50%";
    trail.el.style.background = colorHex;
    trail.el.style.zIndex = "3";
    trail.el.style.pointerEvents = "none";
    trail.el.style.transform = "translate(" + (body.x - size / 2) + "px," + (body.y - size / 2) + "px)";
    trail.el.style.opacity = Math.min(0.6, speed / 320).toFixed(2);
    trail.age = 0;
  }

  function fadeTrails(dt) {
    FEEL.trailPool.forEach(function (t) {
      t.age += dt;

      var cur = parseFloat(t.el.style.opacity || "0");

      if (cur > 0) {
        t.el.style.opacity = Math.max(0, cur - dt * 2.1).toFixed(2);
      }
    });
  }

  function triggerHitstop(durationMs) {
    FEEL.hitstopUntil = performance.now() + durationMs;
  }

  function triggerCameraPunch() {
    var box = document.querySelector(".zg-battle-box");
    if (!box) return;

    box.classList.remove("punch");

    void box.offsetWidth;

    box.classList.add("punch");
  }

  function triggerFlash() {
    var flash = qs("zg-flash-overlay");
    if (!flash) return;

    flash.classList.remove("hit");

    void flash.offsetWidth;

    flash.classList.add("hit");
  }

  function applySquashStretch(el, nx, ny, strength) {
    if (!el) return;

    var squash = " scale(" + (1 + strength) + "," + (1 - strength * 0.7) + ")";
    var baseTransform = el.style.transform.replace(/\s*scale\([^)]*\)\s*/g, "");

    el.style.transition = "transform 0.08s ease-out";
    el.style.transform = baseTransform + squash;

    setTimeout(function () {
      el.style.transition = "transform 0.16s cubic-bezier(.34,1.56,.64,1)";
    }, 80);
  }

  function maybeApplySpeedBurst(body, who, now) {
    var cooldownKey = who === "player" ? "burstCooldownPlayer" : "burstCooldownEnemy";

    if (now < FEEL[cooldownKey]) return;

    if (Math.random() < 0.026) {
      var boost = 1.5 + Math.random() * 0.8;

      body.vx *= boost;
      body.vy *= boost;

      clampSpeed(body);

      FEEL[cooldownKey] = now + randRange(500, 1100);

      triggerSpark(body.x, body.y);
    }
  }

  /* ===================== 戰況描述 ===================== */

  var commentaryLines = {
    WALL_BOUNCE: [
      "碰！撞上場邊反彈回來了！",
      "邊界一擊，角度整個變了！",
      "貼著牆邊打轉，危險邊緣！",
      "反彈瞬間找到新路線！"
    ],
    COLLISION_LIGHT: [
      "輕輕擦過，雙方互探底線！",
      "小碰撞，還在試探階段！",
      "兩顆陀螺擦身而過！",
      "小幅接觸，戰況持續拉鋸！"
    ],
    COLLISION_HEAVY: [
      "強烈對撞！火花四射！！",
      "正面硬碰硬，這下傷害不小！",
      "重擊！陀螺被撞得直線偏移！",
      "轟！這一下打得漂亮！"
    ],
    COMBO: [
      "連續碰撞！戰況白熱化！",
      "一波接一波，完全停不下來！",
      "連環攻勢，這局面太刺激了！",
      "來回互撞，勝負瞬間就要分曉！",
      "根本停不下來的近身戰！",
      "瘋狂互撞，全場都沸騰了！"
    ],
    HP_CRITICAL_PLAYER: [
      "你的陀螺血條見底，要撐住！",
      "危險！你已經快要撐不住了！",
      "血量告急，最後關頭拚了！"
    ],
    HP_CRITICAL_ENEMY: [
      "對手血條快沒了，機會來了！",
      "對方搖搖欲墜，再一下就結束！",
      "壓制對手到懸崖邊緣！"
    ],
    TYPE_GOOD: [
      "屬性優勢啟動，這局有利！",
      "剋制屬性生效，攻勢更犀利！"
    ],
    TYPE_BAD: [
      "屬性劣勢，得更謹慎應戰！",
      "對手屬性剋我，硬撐才是關鍵！"
    ],
    STALEMATE: [
      "雙方僵持，互相繞著找機會！",
      "場面陷入拉鋸，誰先出手？",
      "彼此試探，緊張感持續累積！"
    ],
    NEAR_KO: [
      "千鈞一髮！這一擊將決定勝負！",
      "最後倒數，任何一擊都是關鍵！",
      "命懸一線，全場緊盯這一刻！"
    ]
  };

  var commentaryState = {
    lastEventTs: 0,
    lastLine: "",
    lastCollisionTs: 0,
    comboCount: 0,
    criticalPlayerShown: false,
    criticalEnemyShown: false,
    nearKoShown: false
  };

  function pickLine(pool) {
    var lines = commentaryLines[pool];

    if (!lines || lines.length === 0) return "";

    var idx = Math.floor(Math.random() * lines.length);

    if (lines[idx] === commentaryState.lastLine && lines.length > 1) {
      idx = (idx + 1) % lines.length;
    }

    commentaryState.lastLine = lines[idx];

    return lines[idx];
  }

  function fireCommentary(pool, minGapMs) {
    var now = performance.now();

    if (now - commentaryState.lastEventTs < (minGapMs || 260)) return;

    commentaryState.lastEventTs = now;

    var line = pickLine(pool);
    if (!line) return;

    var el = qs("zg-commentary");
    if (!el) return;

    el.textContent = line;
  }

  function registerCollisionEvent(isHeavy, now) {
    if (now - commentaryState.lastCollisionTs < 900) {
      commentaryState.comboCount += 1;
    } else {
      commentaryState.comboCount = 0;
    }

    commentaryState.lastCollisionTs = now;

    if (commentaryState.comboCount >= 1) {
      fireCommentary("COMBO", 220);
    } else {
      fireCommentary(isHeavy ? "COLLISION_HEAVY" : "COLLISION_LIGHT", 220);
    }

    checkHpMilestones();
  }

  function checkHpMilestones() {
    if (!commentaryState.criticalPlayerShown && state.playerHp > 0 && state.playerHp < 25) {
      commentaryState.criticalPlayerShown = true;
      fireCommentary("HP_CRITICAL_PLAYER", 0);
    }

    if (!commentaryState.criticalEnemyShown && state.enemyHp > 0 && state.enemyHp < 25) {
      commentaryState.criticalEnemyShown = true;
      fireCommentary("HP_CRITICAL_ENEMY", 0);
    }

    if (
      !commentaryState.nearKoShown &&
      (state.playerHp < 10 || state.enemyHp < 10) &&
      state.playerHp > 0 &&
      state.enemyHp > 0
    ) {
      commentaryState.nearKoShown = true;
      fireCommentary("NEAR_KO", 0);
    }
  }

  function startCommentaryLoop() {
    commentaryState.lastEventTs = 0;
    commentaryState.lastLine = "";
    commentaryState.lastCollisionTs = 0;
    commentaryState.comboCount = 0;
    commentaryState.criticalPlayerShown = false;
    commentaryState.criticalEnemyShown = false;
    commentaryState.nearKoShown = false;

    if (state.typeStatus === "good") {
      fireCommentary("TYPE_GOOD", 0);
    } else if (state.typeStatus === "bad") {
      fireCommentary("TYPE_BAD", 0);
    } else {
      safeText("zg-commentary", state.typeText);
    }

    if (commentaryTimer) clearInterval(commentaryTimer);

    commentaryTimer = setInterval(function () {
      var now = performance.now();

      if (now - commentaryState.lastEventTs > 1600) {
        fireCommentary("STALEMATE", 0);
      }
    }, 800);
  }

  /* ===================== 戰鬥主流程 ===================== */

  function prepareBattle() {
    state.playerHp = 100;
    state.enemyHp = 100;
    state.battleDone = false;

    getTypeText();

    var playerTop = qs("zg-player-battle-top");

    if (playerTop) {
      playerTop.textContent = state.selectedTop.icon;
      playerTop.className = "zg-battle-top zg-player-top " + state.selectedTop.className;
      playerTop.style.pointerEvents = "none";
    }

    var enemyTop = qs("zg-enemy-battle-top");

    if (enemyTop) {
      enemyTop.textContent = state.enemy.icon;
      enemyTop.className = "zg-battle-top zg-enemy-top " + state.enemy.id;
      enemyTop.style.pointerEvents = "none";
    }

    updateHpUI();

    safeText("zg-commentary", state.typeText);
    safeText("zg-battle-phase", "對戰中");

    initPhysicsBodies();
  }

  function updateHpUI() {
    var playerFill = qs("zg-player-hp");
    if (playerFill) playerFill.style.width = Math.max(0, state.playerHp) + "%";

    safeText("zg-player-hp-text", Math.max(0, Math.round(state.playerHp)));

    var enemyFill = qs("zg-enemy-hp");
    if (enemyFill) enemyFill.style.width = Math.max(0, state.enemyHp) + "%";

    safeText("zg-enemy-hp-text", Math.max(0, Math.round(state.enemyHp)));
  }

  function physicsStep(now) {
    if (!lastFrameTs) lastFrameTs = now;

    var dt = Math.min(0.032, (now - lastFrameTs) / 1000);

    lastFrameTs = now;

    if (!state.battleDone) {
      var inHitstop = now < FEEL.hitstopUntil;

      if (!inHitstop) {
        var steps = PHY.subSteps;
        var subDt = dt / steps;

        for (var s = 0; s < steps; s++) {
          applyForces(player, enemy, "player", subDt, now);
          applyForces(enemy, player, "enemy", subDt, now);

          maybeApplySpeedBurst(player, "player", now);
          maybeApplySpeedBurst(enemy, "enemy", now);

          player.x += player.vx * subDt;
          player.y += player.vy * subDt;
          enemy.x += enemy.vx * subDt;
          enemy.y += enemy.vy * subDt;

          resolveWallCollision(player);
          resolveWallCollision(enemy);
          resolveTopCollision(now);
        }
      }

      var playerSpeedNow = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      var enemySpeedNow = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);

      playerSpinAngle += (8 + playerSpeedNow * 0.4) * player.curveSign;
      enemySpinAngle += (8 + enemySpeedNow * 0.4) * enemy.curveSign;

      if (!inHitstop) {
        pushTrail(0, player, "rgba(63,169,255,0.65)", PHY.radius * 0.9);
        pushTrail(1, enemy, "rgba(255,92,53,0.65)", PHY.radius * 0.9);
      }

      fadeTrails(dt);

      renderBody(qs("zg-player-battle-top"), player, playerSpinAngle);
      renderBody(qs("zg-enemy-battle-top"), enemy, enemySpinAngle);

      if (
        state.enemyHp <= 0 ||
        state.playerHp <= 0 ||
        (now - battleStartTs) > PHY.maxBattleMs
      ) {
        state.battleDone = true;
        stopBattleLoop();
        playKoAnimation();
        return;
      }
    }

    battleRAF = requestAnimationFrame(physicsStep);
  }

  function stopBattleLoop() {
    if (battleRAF) {
      cancelAnimationFrame(battleRAF);
      battleRAF = null;
    }

    if (commentaryTimer) {
      clearInterval(commentaryTimer);
      commentaryTimer = null;
    }
  }

  function playKoAnimation() {
    var playerWins = state.enemyHp <= state.playerHp;
    var loserId = playerWins ? "zg-enemy-battle-top" : "zg-player-battle-top";
    var winnerId = playerWins ? "zg-player-battle-top" : "zg-enemy-battle-top";

    var loserEl = qs(loserId);
    var winnerEl = qs(winnerId);
    var loserBody = playerWins ? enemy : player;

    if (loserEl) {
      loserEl.classList.add("ko-fly");

      var flyX = loserBody.vx > 0 ? 240 : -240;
      var flyY = loserBody.vy > 0 ? 160 : -160;

      loserEl.style.transform =
        "translate(" + (loserBody.x + flyX) + "px," + (loserBody.y + flyY) + "px) rotate(900deg)";
      loserEl.style.opacity = "0";
      loserEl.style.pointerEvents = "none";
    }

    if (winnerEl) {
      winnerEl.classList.add("win-pulse");
      winnerEl.style.pointerEvents = "none";
    }

    safeText("zg-battle-phase", "結算中");

    setTimeout(finishBattle, 700);
  }

  function runBattle() {
    playerBasePower =
      state.selectedTop.attack +
      state.launchBonus +
      (state.typeStatus === "good" ? 20 : state.typeStatus === "bad" ? -20 : 0);

    enemyBasePower = state.enemy.attack + (Math.random() * 16 - 8);

    playerSpinAngle = 0;
    enemySpinAngle = 0;
    lastFrameTs = 0;
    battleStartTs = performance.now();
    collisionLockUntil = 0;

    FEEL.hitstopUntil = 0;
    FEEL.burstCooldownPlayer = 0;
    FEEL.burstCooldownEnemy = 0;

    startCommentaryLoop();

    battleRAF = requestAnimationFrame(physicsStep);
  }

  function finishBattle() {
    var win = state.enemyHp <= state.playerHp;

    var baseScore = 50;

    baseScore += Math.round(state.selectedTop.balance / 2);
    baseScore += state.launchBonus;
    baseScore += state.typeStatus === "good" ? 15 : state.typeStatus === "bad" ? -10 : 0;
    baseScore += win ? 20 : -5;
    baseScore = Math.max(10, Math.min(100, baseScore));

    state.score = baseScore;

    if (baseScore >= 85) {
      state.rank = "S";
    } else if (baseScore >= 65) {
      state.rank = "A";
    } else {
      state.rank = "B";
    }

    setTimeout(function () {
      showResult(win);
    }, 500);
  }

  /* ===================== 結算頁 ===================== */

  function getCurrentCouponCode() {
    var couponCode = "ZELO" + state.score;

    if (state.score >= 95) {
      couponCode = DEFAULT_COUPON;
    }

    if (state.couponDuplicate) {
      couponCode = state.existingCoupon || DEFAULT_COUPON;
    }

    return couponCode;
  }

  function showResult(win) {
    go("screen-result");

    safeText("zg-result-title", win ? "勝利！戰鬥完美收官" : "惜敗，再接再厲！");
    safeText("zg-result-desc", win ? "你的陀螺表現非常出色！" : "再調整發射時機，下次一定更強！");
    safeText("zg-rank", state.rank);
    safeText("zg-result-score-pill", "SCORE " + state.score);
    safeText("zg-result-type-note", "本場屬性判定：" + (state.typeText || "等待結果。"));

    var couponCode = getCurrentCouponCode();

    safeText("zg-coupon-code", couponCode);

    if (state.couponDuplicate) {
      safeText("zg-coupon-label", "你已領取過優惠碼，本次不重複發放");
    } else {
      safeText("zg-coupon-label", "你的專屬優惠碼");
    }

    if (state.profile && state.profile.userId) {
      recordPlay(state.profile.userId, state.score, state.rank, couponCode);
    }

    if (state.remainingPlays > 0) {
      state.remainingPlays -= 1;
      state.playsUsed += 1;
      updateRemainingUI();
    }

    refreshRankPreviews();
  }

  function buildShareUrl() {
    var uid = state.profile && state.profile.userId ? state.profile.userId : "";
    var uname = state.profile && state.profile.displayName ? state.profile.displayName : "";

    return SHARE_BASE_URL +
      "?inviter=" + encodeURIComponent(uid) +
      "&inviterName=" + encodeURIComponent(uname);
  }

  function shareResult() {
    var shareUrl = buildShareUrl();

    recordEvent("share", {
      score: state.score || "",
      rank: state.rank || ""
    });

    if (
      typeof liff !== "undefined" &&
      liff.isLoggedIn &&
      liff.isLoggedIn() &&
      liff.isApiAvailable &&
      liff.isApiAvailable("shareTargetPicker")
    ) {
      liff.shareTargetPicker([
        {
          type: "text",
          text: "我在戰鬥陀螺遊戲拿到 " + state.rank + " 評價（" + state.score + " 分）！快來挑戰我： " + shareUrl
        }
      ]).then(function () {
        toast("分享視窗已開啟！");
      }).catch(function (err) {
        console.error("share failed:", err);
        copyToClipboard(shareUrl);
        toast("分享失敗，已改為複製連結！");
      });

      return;
    }

    if (navigator.share) {
      navigator.share({
        title: "戰鬥陀螺遊戲",
        text: "我在戰鬥陀螺遊戲拿到 " + state.rank + " 評價！快來挑戰我！",
        url: shareUrl
      }).catch(function () {
        copyToClipboard(shareUrl);
        toast("分享取消或失敗，已複製連結！");
      });

      return;
    }

    copyToClipboard(shareUrl);
    toast("分享連結已複製！");
  }

  function shareInvite() {
    shareResult();
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var ta = document.createElement("textarea");

      ta.value = text;
      document.body.appendChild(ta);
      ta.select();

      try {
        document.execCommand("copy");
      } catch (e) {}

      document.body.removeChild(ta);
    }
  }

  function copyCoupon() {
    var code = qs("zg-coupon-code") || qs("zg-blocked-coupon-code");
    if (!code) return;

    var couponText = code.textContent || "";

    copyToClipboard(couponText);

    recordEvent("coupon_copy", {
      coupon: couponText,
      score: state.score || "",
      rank: state.rank || ""
    });

    toast("優惠碼已複製！");
  }

  function openOfficialSite() {
    var officialUrl = "https://zelosportivo.com/";

    recordEvent("official_click", {
      score: state.score || "",
      rank: state.rank || ""
    });

    try {
      if (typeof liff !== "undefined" && liff.openWindow) {
        liff.openWindow({
          url: officialUrl,
          external: true
        });
      } else {
        window.open(officialUrl, "_blank");
      }
    } catch (err) {
      console.error("[official-site] open failed:", err);
      window.location.href = officialUrl;
    }
  }

  function openRankPage() {
    var rankUrl = "https://liff.line.me/" + RANK_LIFF_ID;

    try {
      if (typeof liff !== "undefined" && liff.openWindow) {
        liff.openWindow({
          url: rankUrl,
          external: false
        });
      } else {
        window.open(rankUrl, "_blank");
      }
    } catch (err) {
      console.error("[rank] open failed:", err);
      window.location.href = rankUrl;
    }
  }

  function resetForReplay() {
    recordEvent("play_again", {
      score: state.score || "",
      rank: state.rank || ""
    });

    stopBattleLoop();
    disableBattlePointerLayers();

    if (state.remainingPlays <= 0) {
      state.isBlocked = true;
      state.blockReason = "limit";
      applyBlockedScreenText();
      recordBlockedOnce();
      go("screen-blocked");
      return;
    }

    state.battleDone = false;
    state.playerHp = 100;
    state.enemyHp = 100;
    state.power = 0;
    state.launchGrade = "";
    state.launchBonus = 0;
    state.typeStatus = "neutral";
    state.typeText = "";
    state.enemy = null;
    state.charging = false;

    if (state.chargeTimer) {
      clearInterval(state.chargeTimer);
      state.chargeTimer = null;
    }

    updatePower(0);

    safeText("zg-commentary", "");
    safeText("zg-battle-phase", "");
    safeText("zg-launch-grade", "等待發射");

    var playerTop = qs("zg-player-battle-top");
    var enemyTop = qs("zg-enemy-battle-top");

    if (playerTop) {
      playerTop.classList.remove("ko-fly", "win-pulse");
      playerTop.style.opacity = "1";
      playerTop.style.transition = "";
      playerTop.style.pointerEvents = "none";
    }

    if (enemyTop) {
      enemyTop.classList.remove("ko-fly", "win-pulse");
      enemyTop.style.opacity = "1";
      enemyTop.style.transition = "";
      enemyTop.style.pointerEvents = "none";
    }

    go("screen-select");
  }

  /* ===================== 事件綁定 ===================== */

  function bindLaunchEvents() {
    var launchTrigger = qs("zg-launch-trigger") || qs("btn-launch");

    if (!launchTrigger) return;

    launchTrigger.addEventListener("pointerdown", function (e) {
      e.preventDefault();

      if (launchTrigger.setPointerCapture && e.pointerId !== undefined) {
        try {
          launchTrigger.setPointerCapture(e.pointerId);
        } catch (err) {}
      }

      startCharge();
    });

    launchTrigger.addEventListener("pointerup", function (e) {
      e.preventDefault();

      if (launchTrigger.releasePointerCapture && e.pointerId !== undefined) {
        try {
          launchTrigger.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }

      releaseLaunch();
    });

    launchTrigger.addEventListener("pointercancel", function (e) {
      e.preventDefault();
      releaseLaunch();
    });

    launchTrigger.addEventListener("pointerleave", function () {
      if (state.charging) releaseLaunch();
    });
  }

  function bindEvents() {
    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.addEventListener("click", function () {
        selectTop(card.getAttribute("data-id"));
      });
    });

    bindLaunchEvents();

    document.addEventListener("click", function (e) {
      var target = e.target;
      if (!target) return;

      var btn = target.closest("button, a, [role='button'], .zg-btn, .zg-small-btn");
      if (!btn) return;

      var id = btn.id || "";
      var text = (btn.innerText || btn.textContent || "").trim();

      if (btn.dataset && btn.dataset.go) {
        e.preventDefault();
        e.stopPropagation();
        go(btn.dataset.go);
        return;
      }

      if (id === "btn-start") {
        e.preventDefault();
        e.stopPropagation();

        if (state.isBlocked) {
          recordBlockedOnce();
          go("screen-blocked");
          return;
        }

        go("screen-select");
        return;
      }

      if (id === "btn-select-next") {
        e.preventDefault();
        e.stopPropagation();

        if (!state.selectedTop) {
          toast("請先選擇陀螺");
          return;
        }

        prepareLaunchScreen();
        go("screen-launch");
        return;
      }

      if (id === "btn-skip-battle") {
        e.preventDefault();
        e.stopPropagation();

        stopBattleLoop();

        if (!state.battleDone) {
          state.battleDone = true;
          state.playerHp = Math.max(state.playerHp, 1);
          state.enemyHp = Math.max(state.enemyHp, 0);
          finishBattle();
        }

        return;
      }

      if (
        id === "btn-share" ||
        id === "btn-share-result" ||
        text.indexOf("分享") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        shareResult();
        return;
      }

      if (
        id === "btn-copy-coupon" ||
        id === "btn-copy" ||
        id === "btn-blocked-copy" ||
        text.indexOf("複製") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        copyCoupon();
        return;
      }

      if (
        id === "btn-retry" ||
        id === "btn-replay" ||
        text.indexOf("再玩一次") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        resetForReplay();
        return;
      }

      if (
        id === "btn-invite-friend" ||
        id === "btn-invite-friends" ||
        id === "btn-blocked-invite" ||
        text.indexOf("邀請") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        shareInvite();
        return;
      }

      if (
        id === "btn-shop" ||
        id === "btn-blocked-shop" ||
        id === "btn-official-site" ||
        text.indexOf("官網") !== -1 ||
        text.indexOf("選購") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        openOfficialSite();
        return;
      }

      if (
        id === "btn-view-rank" ||
        id === "btn-rank" ||
        text.indexOf("排行榜") !== -1
      ) {
        e.preventDefault();
        e.stopPropagation();
        openRankPage();
        return;
      }

      if (id === "btn-back-home") {
        e.preventDefault();
        e.stopPropagation();

        stopBattleLoop();
        disableBattlePointerLayers();
        go("screen-start");
      }
    }, true);
  }

  /* ===================== 啟動 ===================== */

  document.addEventListener("DOMContentLoaded", function () {
    bindEvents();
    go("screen-start");
    initLiff();
  });
})();
