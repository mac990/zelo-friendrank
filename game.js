/* =========================================================
   戰鬥陀螺遊戲 - game.js
   v10 Physics + Game Feel Engine
   (Hitstop / Motion Trail / Camera Punch / Squash&Stretch / Speed Burst)
   ========================================================= */

(function () {
  "use strict";

  console.log("戰鬥陀螺遊戲 v10 Physics + Game Feel Engine 已載入");

  /* ===================== 基本設定 ===================== */

  var LIFF_ID = "2007022255-ph9gRwPs";
  var RANK_LIFF_ID = "2007022255-lfPkJn2u";
  var GAS_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_GAS_DEPLOY_ID/exec";
  var DAILY_LIMIT = 3;
  var DEFAULT_COUPON = "ZELOPLAY";
  var SHARE_BASE_URL = "https://zelosportivo.com/zh/pages/戰鬥陀螺遊戲";

  /* ===================== 遊戲資料 ===================== */

  var tops = {
    attack: {
      id: "attack",
      name: "烈焰爆擊",
      icon: "🔥",
      className: "attack",
      typeName: "攻擊型",
      attack: 88,
      defense: 42,
      stamina: 55,
      balance: 62,
      beats: "defense"
    },
    defense: {
      id: "defense",
      name: "冰封壁壘",
      icon: "🛡️",
      className: "defense",
      typeName: "防禦型",
      attack: 48,
      defense: 90,
      stamina: 58,
      balance: 65,
      beats: "stamina"
    },
    stamina: {
      id: "stamina",
      name: "永劫旋風",
      icon: "🌪️",
      className: "stamina",
      typeName: "耐久型",
      attack: 55,
      defense: 52,
      stamina: 92,
      balance: 66,
      beats: "attack"
    }
  };

  var enemies = [
    {
      id: "attack",
      name: "赤炎戰狼",
      icon: "🔥",
      className: "attack",
      typeName: "攻擊型",
      attack: 82,
      defense: 45,
      stamina: 50,
      beats: "defense"
    },
    {
      id: "defense",
      name: "鋼鐵守衛",
      icon: "🛡️",
      className: "defense",
      typeName: "防禦型",
      attack: 46,
      defense: 85,
      stamina: 54,
      beats: "stamina"
    },
    {
      id: "stamina",
      name: "疾風幻影",
      icon: "🌪️",
      className: "stamina",
      typeName: "耐久型",
      attack: 50,
      defense: 48,
      stamina: 88,
      beats: "attack"
    }
  ];

  var battleLines = [
    "戰鬥開始！雙方陀螺全力旋轉！",
    "場面持續拉鋸，勝負未定！",
    "誰能撐到最後一刻？",
    "緊張刺激的對決仍在持續！"
  ];

  /* ===================== 全域狀態 ===================== */

  var state = {
    profile: null,
    inviterId: null,
    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,
    isBlocked: false,
    blockReason: "",
    blockedCoupon: "",
    selectedTop: null,
    enemy: null,
    power: 0,
    charging: false,
    chargeTimer: null,
    chargeDirection: 1,
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

  function qs(id) { return document.getElementById(id); }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  function toast(msg, duration) {
    var el = qs("zg-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "zg-toast";
      el.className = "zg-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(function () {
      el.style.display = "none";
    }, duration || 2200);
  }

  function go(screenId) {
    document.querySelectorAll(".zg-screen").forEach(function (s) {
      s.classList.remove("active");
    });
    var target = qs(screenId);
    if (target) target.classList.add("active");
  }

  function getUrlParam(name) {
    try {
      var params = new URLSearchParams(window.location.search);
      return params.get(name);
    } catch (e) {
      return null;
    }
  }

  function setAppHeight() {
    var h = window.innerHeight;
    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }
  window.addEventListener("resize", setAppHeight);
  setAppHeight();

  state.debugMode = getUrlParam("debug") === "1";


  /* ===================== GAS API 串接 ===================== */

  function callGas(action, payload, callback) {
    if (state.debugMode) {
      setTimeout(function () { callback({ ok: true, debug: true }); }, 120);
      return;
    }
    var url = GAS_URL + "?action=" + encodeURIComponent(action);
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload || {})
    }).then(function (res) { return res.json(); })
      .then(function (data) { callback(data); })
      .catch(function (err) {
        console.error("GAS call failed:", action, err);
        callback({ ok: false, error: String(err) });
      });
  }

  function checkDailyLimit(userId, callback) {
    if (state.debugMode) { callback({ playsUsed: 0 }); return; }
    callGas("checkDailyLimit", { userId: userId }, function (res) {
      callback(res || { playsUsed: 0 });
    });
  }

  function checkCoupon(userId, callback) {
    if (state.debugMode) { callback({ duplicate: false }); return; }
    callGas("checkCoupon", { userId: userId }, function (res) {
      callback(res || { duplicate: false });
    });
  }
  var checkCouponStatus = checkCoupon;

  function recordPlay(userId, score, rank, coupon) {
    if (state.debugMode) return;
    callGas("recordPlay", { userId: userId, score: score, rank: rank, coupon: coupon }, function () {});
  }

  function recordInvite(userId, inviterId) {
    if (state.debugMode) return;
    if (!inviterId || inviterId === userId) return;
    callGas("recordInvite", { userId: userId, inviterId: inviterId }, function () {});
  }
  function recordInviteRelation() {
    if (state.profile && state.inviterId) {
      recordInvite(state.profile.userId, state.inviterId);
    }
  }

  function fetchRankList(callback) {
    if (state.debugMode) {
      callback({ ok: true, list: [] });
      return;
    }
    callGas("getRankList", {}, function (res) {
      callback(res || { ok: false, list: [] });
    });
  }

  function refreshRankPreviews() {
    fetchRankList(function (res) {
      var box = qs("zg-rank-preview-list");
      if (!box) return;
      if (!res || !res.list || res.list.length === 0) {
        box.innerHTML = '<div class="zg-rank-empty">目前還沒有排行榜資料，快來搶頭香！</div>';
        return;
      }
      var html = "";
      res.list.slice(0, 5).forEach(function (item, idx) {
        html += '<div class="zg-rank-item">' +
          '<div class="zg-rank-no">' + (idx + 1) + '</div>' +
          '<div class="zg-rank-name">' + (item.name || "玩家") + '</div>' +
          '<div class="zg-rank-count">' + (item.score || 0) + '分</div>' +
          '</div>';
      });
      box.innerHTML = html;
    });
  }

  function applyBlockedScreenText() {
    if (state.blockReason === "limit") {
      safeText("zg-blocked-title", "今日挑戰次數已用完");
      safeText("zg-blocked-desc", "明天再來挑戰吧！每天都有 " + DAILY_LIMIT + " 次機會。");
    } else if (state.blockReason === "coupon") {
      safeText("zg-blocked-title", "您已領取過優惠碼");
      safeText("zg-blocked-desc", "每個帳號僅可領取一次優惠碼。");
    }
  }

  function updateRemainingUI() {
    safeText("zg-remaining-plays", state.remainingPlays);
  }


  /* ===================== LIFF 初始化與流程控制 ===================== */

  function initLiff() {
    state.inviterId = getUrlParam("inviter");

    if (typeof liff === "undefined") {
      refreshRankPreviews();
      setStartButtonReady();
      return;
    }

    setStartButtonChecking();

    liff.init({ liffId: LIFF_ID }).then(function () {
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
      safeText("zg-player-name", "哈囉，" + (profile.displayName || "玩家") + "！準備好發射了嗎？");

      recordInviteRelation();

      var pending = 2;
      var couponDuplicate = false;
      var couponCode = DEFAULT_COUPON;

      function finalizeBlockCheck() {
        pending -= 1;
        if (pending > 0) return;

        if (state.remainingPlays <= 0) {
          state.isBlocked = true;
          state.blockReason = "limit";
        } else if (couponDuplicate) {
          state.isBlocked = true;
          state.blockReason = "coupon";
          state.blockedCoupon = couponCode;
          safeText("zg-blocked-coupon-code", state.blockedCoupon);
        }

        if (state.isBlocked) {
          applyBlockedScreenText();
        }
        setStartButtonReady();
      }

      checkCouponStatus(profile.userId, function (result) {
        if (result && result.duplicate) {
          couponDuplicate = true;
          couponCode = result.coupon || DEFAULT_COUPON;
        }
        finalizeBlockCheck();
      });

      checkDailyLimit(profile.userId, function (result) {
        var used = 0;
        if (result && typeof result.playsUsed !== "undefined") {
          used = Number(result.playsUsed) || 0;
        } else if (result && typeof result.count !== "undefined") {
          used = Number(result.count) || 0;
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
    if (btn) { btn.disabled = true; btn.textContent = "檢查中..."; }
  }

  function setStartButtonReady() {
    var btn = qs("btn-start");
    if (btn) { btn.disabled = false; btn.textContent = "開始挑戰"; }
  }

  function getLaunchGrade(power) {
    if (power >= 78 && power <= 82) return { label: "Perfect Launch", bonus: 34 };
    if ((power >= 66 && power < 78) || (power > 82 && power <= 88)) return { label: "Good Launch", bonus: 12 };
    if (power > 88) return { label: "Over Launch", bonus: -18 };
    if (power >= 42) return { label: "Normal Launch", bonus: 3 };
    return { label: "Weak Launch", bonus: -8 };
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
    if (!state.selectedTop) { toast("請先選擇陀螺"); return; }
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
      if (state.power >= 100) { state.power = 100; state.chargeDirection = -1; }
      if (state.power <= 0) { state.power = 0; state.chargeDirection = 1; }
      updatePower(state.power);
    }, 28);
  }

  function releaseLaunch() {
    if (!state.charging) return;
    state.charging = false;
    if (state.chargeTimer) { clearInterval(state.chargeTimer); state.chargeTimer = null; }

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
    var list = enemies.filter(function (enemy) { return enemy.id !== state.selectedTop.id; });
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


  /* ===================== 物理戰鬥引擎（真實碰撞版 v9）===================== */

  var PHY = {
    arena: { w: 300, h: 240, cx: 150, cy: 120 },
    radius: 32,
    centerPull: 0.45,
    curveForce: 60,
    wallRestitution: 0.78,
    hitRestitution: 0.9,
    collisionCooldownMs: 260,
    maxBattleMs: 9000
  };

  var player = null;
  var enemy = null;
  var battleRAF = null;
  var lastFrameTs = 0;
  var battleStartTs = 0;
  var collisionLockUntil = 0;
  var commentaryTimer = null;
  var commentaryIndex = 0;
  var playerBasePower = 0;
  var enemyBasePower = 0;
  var sparkEl = null;
  var playerSpinAngle = 0;
  var enemySpinAngle = 0;

  function ensureSparkEl(box) {
    sparkEl = qs("zg-spark");
    if (!sparkEl) {
      sparkEl = document.createElement("div");
      sparkEl.id = "zg-spark";
      sparkEl.className = "zg-spark";
      box.appendChild(sparkEl);
    }
    return sparkEl;
  }

  function randRange(min, max) { return min + Math.random() * (max - min); }

  function makeBody(startX, startY, angleDeg, curveSign) {
    var speed = randRange(75, 125);
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
      el.classList.remove("ko-fly", "win-pulse");
    });

    ensureSparkEl(box);
    initTrailPool(box);

    var enterAngle = randRange(-30, 30);
    player = makeBody(w * 0.25, h * 0.5 + randRange(-25, 25), enterAngle, Math.random() < 0.5 ? 1 : -1);
    enemy = makeBody(w * 0.75, h * 0.5 + randRange(-25, 25), 180 + enterAngle, Math.random() < 0.5 ? 1 : -1);
  }

  function triggerSpark(px, py) {
    if (!sparkEl) return;
    var xPct = (px / PHY.arena.w) * 100;
    var yPct = (py / PHY.arena.h) * 100;
    sparkEl.style.left = xPct + "%";
    sparkEl.style.top = yPct + "%";
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

  function applyForces(body, who, dt) {
    var dx = PHY.arena.cx - body.x;
    var dy = PHY.arena.cy - body.y;
    body.vx += dx * PHY.centerPull * dt;
    body.vy += dy * PHY.centerPull * dt;

    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    if (speed > 4) {
      var px = -body.vy / speed;
      var py = body.vx / speed;
      body.vx += px * body.curveSign * PHY.curveForce * dt;
      body.vy += py * body.curveSign * PHY.curveForce * dt;
    }

    var hpRatio = hpRatioOf(who);
    var damping = 0.992 - (1 - hpRatio) * 0.02;
    body.vx *= damping;
    body.vy *= damping;
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
      body.vx += randRange(-25, 25);
      body.vy += randRange(-25, 25);
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
    var minDist = PHY.radius * 2 * 0.85;

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

    var tangentJitter = randRange(-0.35, 0.35);
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

    collisionLockUntil = now + PHY.collisionCooldownMs;

    var midX = (player.x + enemy.x) / 2;
    var midY = (player.y + enemy.y) / 2;
    var impactForce = Math.abs(impulse);

    triggerSpark(midX, midY);
    shakeBox();

    var isHeavyHit = impactForce > 130;
    var hitstopMs = isHeavyHit ? 100 : 55;
    triggerHitstop(hitstopMs);
    triggerCameraPunch();
    triggerFlash(isHeavyHit ? 1 : 0.5);

    applySquashStretch(qs("zg-player-battle-top"), -nx, -ny, isHeavyHit ? 0.32 : 0.16);
    applySquashStretch(qs("zg-enemy-battle-top"), nx, ny, isHeavyHit ? 0.32 : 0.16);

    var playerPowerFactor = (playerBasePower + impactForce) / 10;
    var enemyPowerFactor = (enemyBasePower + impactForce) / 10;

    var playerHit = Math.max(2.5, enemyPowerFactor * 0.6 + Math.random() * 3);
    var enemyHit = Math.max(2.5, playerPowerFactor * 0.6 + Math.random() * 3);

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

  /* ===================== 打擊感升級（Hitstop / Trail / Punch / Burst）v10 ===================== */

  var FEEL = {
    hitstopUntil: 0,
    trailPool: [],
    trailMax: 6,
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
      box.appendChild(t);
      FEEL.trailPool.push({ el: t, age: 999 });
    }
    var oldFlash = qs("zg-flash-overlay");
    if (oldFlash && oldFlash.parentNode) oldFlash.parentNode.removeChild(oldFlash);
    var flash = document.createElement("div");
    flash.className = "zg-flash-overlay";
    flash.id = "zg-flash-overlay";
    box.appendChild(flash);
  }

  function pushTrail(groupIndex, body, colorHex, size) {
    var speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
    if (speed < 60) return;

    var groupStart = groupIndex === 0 ? 0 : FEEL.trailMax;
    var idx = groupStart + (Math.floor(performance.now() / 16) % FEEL.trailMax);
    var trail = FEEL.trailPool[idx];
    if (!trail) return;

    trail.el.style.width = size + "px";
    trail.el.style.height = size + "px";
    trail.el.style.borderRadius = "50%";
    trail.el.style.background = colorHex;
    trail.el.style.zIndex = "3";
    trail.el.style.pointerEvents = "none";
    trail.el.style.transform = "translate(" + (body.x - size / 2) + "px," + (body.y - size / 2) + "px)";
    trail.el.style.opacity = Math.min(0.55, speed / 260).toFixed(2);
    trail.age = 0;
  }

  function fadeTrails(dt) {
    FEEL.trailPool.forEach(function (t) {
      t.age += dt;
      var cur = parseFloat(t.el.style.opacity || "0");
      if (cur > 0) {
        t.el.style.opacity = Math.max(0, cur - dt * 1.8).toFixed(2);
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
    var angle = Math.atan2(ny, nx) * 180 / Math.PI;
    el.style.transition = "transform 0.09s ease-out";
    var squash = " scale(" + (1 + strength) + "," + (1 - strength * 0.7) + ")";
    var baseTransform = el.style.transform.replace(/\s*scale\([^)]*\)\s*/g, "");
    el.style.transform = baseTransform + squash;
    setTimeout(function () {
      el.style.transition = "transform 0.18s cubic-bezier(.34,1.56,.64,1)";
    }, 90);
  }

  function maybeApplySpeedBurst(body, who, now) {
    var cooldownKey = who === "player" ? "burstCooldownPlayer" : "burstCooldownEnemy";
    if (now < FEEL[cooldownKey]) return;

    if (Math.random() < 0.018) {
      var boost = 1.6 + Math.random() * 0.9;
      body.vx *= boost;
      body.vy *= boost;
      FEEL[cooldownKey] = now + randRange(700, 1400);
      triggerSpark(body.x, body.y);
    }
  }

  /* ===================== AI 動態戰況描述（事件驅動）===================== */

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
      "來回互撞，勝負瞬間就要分曉！"
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
    if (now - commentaryState.lastEventTs < (minGapMs || 380)) return;
    commentaryState.lastEventTs = now;

    var line = pickLine(pool);
    if (!line) return;

    var el = qs("zg-commentary");
    if (!el) return;
    el.textContent = line;
  }

  function registerCollisionEvent(isHeavy, now) {
    if (now - commentaryState.lastCollisionTs < 1200) {
      commentaryState.comboCount += 1;
    } else {
      commentaryState.comboCount = 0;
    }
    commentaryState.lastCollisionTs = now;

    if (commentaryState.comboCount >= 1) {
      fireCommentary("COMBO", 300);
    } else {
      fireCommentary(isHeavy ? "COLLISION_HEAVY" : "COLLISION_LIGHT", 300);
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
    if (!commentaryState.nearKoShown && (state.playerHp < 10 || state.enemyHp < 10) &&
        state.playerHp > 0 && state.enemyHp > 0) {
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
      if (now - commentaryState.lastEventTs > 2200) {
        fireCommentary("STALEMATE", 0);
      }
    }, 1000);
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
    }
    var enemyTop = qs("zg-enemy-battle-top");
    if (enemyTop) {
      enemyTop.textContent = state.enemy.icon;
      enemyTop.className = "zg-battle-top zg-enemy-top " + state.enemy.id;
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
        applyForces(player, "player", dt);
        applyForces(enemy, "enemy", dt);

        maybeApplySpeedBurst(player, "player", now);
        maybeApplySpeedBurst(enemy, "enemy", now);

        player.x += player.vx * dt;
        player.y += player.vy * dt;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;

        resolveWallCollision(player);
        resolveWallCollision(enemy);
        resolveTopCollision(now);
      }

      var playerSpeedNow = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      var enemySpeedNow = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
      playerSpinAngle += (8 + playerSpeedNow * 0.35) * player.curveSign;
      enemySpinAngle += (8 + enemySpeedNow * 0.35) * enemy.curveSign;

      if (!inHitstop) {
        pushTrail(0, player, "rgba(63,169,255,0.6)", PHY.radius * 0.9);
        pushTrail(1, enemy, "rgba(255,92,53,0.6)", PHY.radius * 0.9);
      }
      fadeTrails(dt);

      renderBody(qs("zg-player-battle-top"), player, playerSpinAngle);
      renderBody(qs("zg-enemy-battle-top"), enemy, enemySpinAngle);

      if (state.enemyHp <= 0 || state.playerHp <= 0 || (now - battleStartTs) > PHY.maxBattleMs) {
        state.battleDone = true;
        stopBattleLoop();
        playKoAnimation();
        return;
      }
    }

    battleRAF = requestAnimationFrame(physicsStep);
  }

  function stopBattleLoop() {
    if (battleRAF) { cancelAnimationFrame(battleRAF); battleRAF = null; }
    if (commentaryTimer) { clearInterval(commentaryTimer); commentaryTimer = null; }
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
    }
    if (winnerEl) {
      winnerEl.classList.add("win-pulse");
    }

    safeText("zg-battle-phase", "結算中");
    setTimeout(finishBattle, 700);
  }

  function runBattle() {
    playerBasePower = state.selectedTop.attack + state.launchBonus +
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

    if (baseScore >= 85) { state.rank = "S"; }
    else if (baseScore >= 65) { state.rank = "A"; }
    else { state.rank = "B"; }

    setTimeout(function () { showResult(win); }, 500);
  }

  /* ===================== 結算頁 ===================== */

  function showResult(win) {
    go("screen-result");

    safeText("zg-result-title", win ? "勝利！戰鬥完美收官" : "惜敗，再接再厲！");
    safeText("zg-result-rank", state.rank);
    safeText("zg-result-score", state.score + " 分");
    safeText("zg-result-grade", state.launchGrade);
    safeText("zg-result-type", state.typeText);

    var couponCode = "ZELO" + state.score;
    safeText("zg-coupon-code", couponCode);

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
    return SHARE_BASE_URL + "?inviter=" + encodeURIComponent(uid);
  }

  function shareResult() {
    var shareUrl = buildShareUrl();
    if (typeof liff !== "undefined" && liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
      liff.shareTargetPicker([
        {
          type: "text",
          text: "我在戰鬥陀螺遊戲拿到 " + state.rank + " 評價（" + state.score + " 分）！快來挑戰我： " + shareUrl
        }
      ]).catch(function (err) { console.error("share failed:", err); });
    } else if (navigator.share) {
      navigator.share({
        title: "戰鬥陀螺遊戲",
        text: "我在戰鬥陀螺遊戲拿到 " + state.rank + " 評價！快來挑戰我！",
        url: shareUrl
      }).catch(function () {});
    } else {
      copyToClipboard(shareUrl);
      toast("分享連結已複製！");
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function copyCoupon() {
    var code = qs("zg-coupon-code");
    if (!code) return;
    copyToClipboard(code.textContent);
    toast("優惠碼已複製！");
  }

  /* ===================== 事件綁定 ===================== */

  function bindEvents() {
    var btnStart = qs("btn-start");
    if (btnStart) btnStart.addEventListener("click", function () {
      if (state.isBlocked) { go("screen-blocked"); return; }
      go("screen-select");
    });

    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.addEventListener("click", function () {
        selectTop(card.getAttribute("data-id"));
      });
    });

    var btnSelectNext = qs("btn-select-next");
    if (btnSelectNext) btnSelectNext.addEventListener("click", function () {
      if (!state.selectedTop) { toast("請先選擇陀螺"); return; }
      prepareLaunchScreen();
      go("screen-launch");
    });

    var launchTrigger = qs("zg-launch-trigger") || qs("btn-launch");
    if (launchTrigger) {
      launchTrigger.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        startCharge();
      });
      launchTrigger.addEventListener("pointerup", function (e) {
        e.preventDefault();
        releaseLaunch();
      });
      launchTrigger.addEventListener("pointerleave", function () {
        if (state.charging) releaseLaunch();
      });
    }

    var btnSkipBattle = qs("btn-skip-battle");
    if (btnSkipBattle) {
      btnSkipBattle.addEventListener("click", function () {
        stopBattleLoop();
        if (!state.battleDone) {
          state.battleDone = true;
          state.playerHp = Math.max(state.playerHp, 1);
          state.enemyHp = Math.max(state.enemyHp, 0);
          finishBattle();
        }
      });
    }

    var btnShare = qs("btn-share");
    if (btnShare) btnShare.addEventListener("click", shareResult);

    var btnCopyCoupon = qs("btn-copy-coupon");
    if (btnCopyCoupon) btnCopyCoupon.addEventListener("click", copyCoupon);

    var btnRetry = qs("btn-retry");
    if (btnRetry) btnRetry.addEventListener("click", function () {
      if (state.remainingPlays <= 0) {
        state.isBlocked = true;
        state.blockReason = "limit";
        applyBlockedScreenText();
        go("screen-blocked");
        return;
      }
      go("screen-select");
    });

    var btnViewRank = qs("btn-view-rank");
    if (btnViewRank) btnViewRank.addEventListener("click", function () {
      if (typeof liff !== "undefined" && liff.openWindow) {
        liff.openWindow({
          url: "https://liff.line.me/" + RANK_LIFF_ID,
          external: false
        });
      } else {
        window.open("https://liff.line.me/" + RANK_LIFF_ID, "_blank");
      }
    });

    var btnBackHome = qs("btn-back-home");
    if (btnBackHome) btnBackHome.addEventListener("click", function () {
      go("screen-start");
    });
  }

  /* ===================== 啟動 ===================== */

  document.addEventListener("DOMContentLoaded", function () {
    bindEvents();
    initLiff();
  });

})();
