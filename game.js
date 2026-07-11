(function () {
  "use strict";

  /* ===================== 基本設定 ===================== */

  var LIFF_ID = "REPLACE_WITH_YOUR_LIFF_ID";
  var RANK_LIFF_ID = "REPLACE_WITH_YOUR_RANK_LIFF_ID";
  var GAS_URL = "https://script.google.com/macros/s/REPLACE_WITH_YOUR_GAS_DEPLOY_ID/exec";
  var DAILY_LIMIT = 3;
  var DEFAULT_COUPON = "ZELO100";
  var SHARE_BASE_URL = "https://liff.line.me/REPLACE_WITH_YOUR_LIFF_ID";

  /* ===================== 遊戲資料 ===================== */

  var tops = {
    attack: {
      id: "attack", name: "烈焰攻擊陀螺", typeName: "攻擊型", icon: "🔥",
      className: "attack", attack: 82, defense: 45, stamina: 50, balance: 59,
      beats: "defense"
    },
    defense: {
      id: "defense", name: "冰霜防禦陀螺", typeName: "防禦型", icon: "🛡️",
      className: "defense", attack: 48, defense: 85, stamina: 55, balance: 63,
      beats: "stamina"
    },
    stamina: {
      id: "stamina", name: "疾風耐久陀螺", typeName: "耐久型", icon: "🌪️",
      className: "stamina", attack: 50, defense: 52, stamina: 88, balance: 63,
      beats: "attack"
    }
  };

  var enemies = [
    { id: "attack", typeName: "攻擊型", icon: "🔥", attack: 76, beats: "defense" },
    { id: "defense", typeName: "防禦型", icon: "🛡️", attack: 70, beats: "stamina" },
    { id: "stamina", typeName: "耐久型", icon: "🌪️", attack: 72, beats: "attack" }
  ];

  /* ===================== 全域狀態 ===================== */

  var state = {
    profile: null,
    inviterId: null,
    isBlocked: false,
    blockReason: "",
    blockedCoupon: "",
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

  function qs(id) { return document.getElementById(id); }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  var toastTimer = null;
  function toast(msg) {
    var el = qs("zg-toast") || document.querySelector(".zg-toast");
    if (!el) { console.log("[toast]", msg); return; }
    el.textContent = msg;
    el.style.display = "block";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.display = "none"; }, 2200);
  }

  function go(screenId) {
    document.querySelectorAll(".zg-screen").forEach(function (s) {
      s.classList.remove("active");
    });
    var target = qs(screenId);
    if (target) target.classList.add("active");
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

  /* ===================== GAS API 串接 ===================== */

  function gasRequest(action, payload, callback) {
    if (!GAS_URL || GAS_URL.indexOf("REPLACE_WITH") !== -1) {
      console.warn("[GAS] URL 尚未設定，略過請求：", action);
      callback && callback(null);
      return;
    }
    var body = Object.assign({ action: action }, payload || {});
    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json(); })
      .then(function (data) { callback && callback(data); })
      .catch(function (err) {
        console.error("[GAS] 請求失敗：", action, err);
        callback && callback(null);
      });
  }

  function checkDailyLimit(userId, callback) {
    gasRequest("checkDailyLimit", { userId: userId }, callback);
  }

  function checkCouponStatus(userId, callback) {
    gasRequest("checkCoupon", { userId: userId }, callback);
  }

  function recordPlay(userId, score, rank, couponCode) {
    gasRequest("recordPlay", {
      userId: userId, score: score, rank: rank, coupon: couponCode,
      displayName: state.profile ? state.profile.displayName : ""
    });
  }

  function recordInviteRelation() {
    if (!state.inviterId || !state.profile) return;
    gasRequest("recordInvite", {
      inviterId: state.inviterId,
      inviteeId: state.profile.userId,
      inviteeName: state.profile.displayName || ""
    });
  }

  function refreshRankPreviews() {
    gasRequest("getRankList", {}, function (data) {
      var listEl = qs("zg-rank-list");
      if (!listEl) return;
      if (!data || !data.list || data.list.length === 0) {
        listEl.innerHTML = '<div class="zg-rank-empty">目前尚無排行資料</div>';
        return;
      }
      var html = "";
      data.list.slice(0, 5).forEach(function (item, idx) {
        var isMe = state.profile && item.userId === state.profile.userId;
        html += '<div class="zg-rank-item' + (isMe ? " me" : "") + '">' +
          '<span class="zg-rank-no">' + (idx + 1) + '</span>' +
          '<span class="zg-rank-name">' + (item.displayName || "玩家") + '</span>' +
          '<span class="zg-rank-count">' + (item.bestScore || 0) + ' 分</span>' +
          '</div>';
      });
      listEl.innerHTML = html;
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


  /* ===================== 物理戰鬥引擎（v11 高速追擊版）===================== */

  var PHY = {
    arena: { w: 300, h: 240, cx: 150, cy: 120 },
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
  var commentaryIndex = 0;
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
      box.appendChild(sparkEl);
    }
    return sparkEl;
  }

  function randRange(min, max) { return min + Math.random() * (max - min); }

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
      el.classList.remove("ko-fly", "win-pulse");
    });

    ensureSparkEl(box);
    initTrailPool(box);

    var enterAngle = randRange(-30, 30);
    player = makeBody(w * 0.25, h * 0.5 + randRange(-25, 25), enterAngle, Math.random() < 0.5 ? 1 : -1);
    enemy = makeBody(w * 0.75, h * 0.5 + randRange(-25, 25), 180 + enterAngle, Math.random() < 0.5 ? 1 : -1);
    collisionCountTotal = 0;
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

  function getTensionFactor(now) {
    var elapsed = now - battleStartTs;
    var t = Math.min(1, elapsed / PHY.tensionRampMs);
    return t; // 0 -> 1 隨時間推進
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

    // ★ 中心吸力：讓陀螺不會飄太遠，隨時間微增
    var dxc = PHY.arena.cx - body.x;
    var dyc = PHY.arena.cy - body.y;
    var centerPull = PHY.centerPull * (1 + tension * 0.6);
    body.vx += dxc * centerPull * dt;
    body.vy += dyc * centerPull * dt;

    // ★ 主動追擊力：陀螺會主動朝對手靠近，這是提升碰撞頻率的核心
    var dxo = opponent.x - body.x;
    var dyo = opponent.y - body.y;
    var distO = Math.sqrt(dxo * dxo + dyo * dyo) || 1;
    var seekForce = PHY.seekForceBase + (PHY.seekForceMax - PHY.seekForceBase) * tension;
    body.vx += (dxo / distO) * seekForce * 100 * dt;
    body.vy += (dyo / distO) * seekForce * 100 * dt;

    // ★ 馬格努斯曲線力：讓路徑保持不規則、有弧線變化
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
    triggerFlash(isHeavyHit ? 1 : 0.5);

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

  /* ===================== 打擊感系統（Hitstop / Trail / Punch / Burst）===================== */

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
    var angle = Math.atan2(ny, nx) * 180 / Math.PI;
    el.style.transition = "transform 0.08s ease-out";
    var squash = " scale(" + (1 + strength) + "," + (1 - strength * 0.7) + ")";
    var baseTransform = el.style.transform.replace(/\s*scale\([^)]*\)\s*/g, "");
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
        // ★ Sub-stepping：拆成多個小步驟計算，避免高速穿透，也讓碰撞判定更精準即時
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
