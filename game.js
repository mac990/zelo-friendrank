(function () {
  "use strict";

  var LIFF_ID = "2007022255-ph9gRwPs";
  var GAS_URL = "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";
  var SHOP_URL = "https://zelosportivo.com/zh";
  var DAILY_LIMIT = 3;
  var DEFAULT_COUPON = "ZELOPLAY";

  var battleLines = [
    "陀螺猛烈互撞，火花四射！",
    "雙方僵持不下，戰況激烈！",
    "強力一擊，場邊觀眾都驚呼！",
    "旋轉速度驚人，難以預測走向！",
    "撞擊聲此起彼落，勝負難料！",
    "陀螺互相纏鬥，誰能撐到最後？"
  ];

  var tops = {
    attack: { id: "attack", name: "火焰衝擊", typeName: "攻擊型", icon: "🔥", className: "attack",
      attack: 95, defense: 55, stamina: 50, balance: 60, beats: "stamina" },
    defense: { id: "defense", name: "鋼鐵堡壘", typeName: "防禦型", icon: "🛡️", className: "defense",
      attack: 55, defense: 95, stamina: 65, balance: 80, beats: "attack" },
    stamina: { id: "stamina", name: "風暴長旋", typeName: "持久型", icon: "🌪️", className: "stamina",
      attack: 60, defense: 65, stamina: 95, balance: 85, beats: "defense" }
  };

  var enemies = [
    { id: "attack", name: "赤炎對手", typeName: "攻擊型", icon: "🔥",
      attack: 88, defense: 58, stamina: 56, balance: 64, beats: "stamina" },
    { id: "defense", name: "藍盾對手", typeName: "防禦型", icon: "🛡️",
      attack: 58, defense: 88, stamina: 68, balance: 78, beats: "attack" },
    { id: "stamina", name: "綠旋對手", typeName: "持久型", icon: "🌪️",
      attack: 62, defense: 66, stamina: 88, balance: 84, beats: "defense" }
  ];

  var state = {
    profile: null,
    inviterId: "",
    selectedTop: null,
    enemy: null,
    power: 0,
    charging: false,
    chargeDirection: 1,
    chargeTimer: null,
    launchGrade: "Normal Launch",
    launchBonus: 0,
    playerHp: 100,
    enemyHp: 100,
    battleDone: false,
    score: 0,
    rank: "B",
    coupon: DEFAULT_COUPON,
    typeStatus: "neutral",
    typeText: "屬性均勢",
    isBlocked: false,
    blockReason: "",
    blockedCoupon: DEFAULT_COUPON,
    playsUsed: 0,
    remainingPlays: DAILY_LIMIT
  };

  /* ===================== 物理引擎相關全域變數 ===================== */
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

  function qs(id) { return document.getElementById(id); }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  function safeHtml(id, html) {
    var el = qs(id);
    if (el) el.innerHTML = html;
  }

  function setAppHeight() {
    var h = window.innerHeight || document.documentElement.clientHeight || screen.height;
    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }

  function go(id) {
    document.querySelectorAll(".zg-screen").forEach(function (screen) {
      screen.classList.remove("active");
    });
    var target = qs(id);
    if (target) target.classList.add("active");
    setAppHeight();
  }

  function toast(text) {
    var el = qs("zg-toast");
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
    setTimeout(function () { el.style.display = "none"; }, 1800);
  }

  function getUrlParam(name) {
    try {
      var params = new URLSearchParams(location.search);
      return params.get(name) || "";
    } catch (e) {
      return "";
    }
  }

  function getInviteUrl(userId) {
    return SHOP_URL + "/pages/戰鬥陀螺遊戲?inviter=" + encodeURIComponent(userId || "");
  }

  function jsonp(url, callback) {
    fetch(url).then(function (res) { return res.json(); })
      .then(function (data) { callback(data); })
      .catch(function (err) {
        console.error("GAS request failed:", url, err);
        callback(null);
      });
  }

  function checkDailyLimit(userId, callback) {
    if (!userId) { callback(null); return; }
    jsonp(GAS_URL + "?action=checkDailyLimit&userId=" + encodeURIComponent(userId), callback);
  }

  function checkCouponStatus(userId, callback) {
    if (!userId) { callback(null); return; }
    jsonp(GAS_URL + "?action=checkCoupon&userId=" + encodeURIComponent(userId), callback);
  }

  function loadFriendRankPreview(userId, callback) {
    if (!userId) { callback(null); return; }
    jsonp(GAS_URL + "?action=friendRank&userId=" + encodeURIComponent(userId), function (data) {
      if (!data || !data.friends) { callback(null); return; }
      var top3 = data.friends.slice(0, 3).map(function (f) {
        return { name: f.playerName, count: f.bestScore };
      });
      var mine = data.friends.find(function (f) { return f.isMe; });
      callback({
        top: top3,
        myRank: mine ? mine.position : null,
        myCount: mine ? mine.bestScore : 0
      });
    });
  }

  function recordPlayResult() {
    if (!state.profile || !state.profile.userId) return;
    var payload = {
      action: "recordPlay",
      userId: state.profile.userId,
      playerName: state.profile.displayName || "",
      score: state.score,
      rank: state.rank,
      inviterId: state.inviterId || ""
    };
    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function (err) { console.error("recordPlay failed:", err); });
  }

  function recordInviteRelation() {
    if (!state.inviterId || !state.profile || !state.profile.userId) return;
    if (state.inviterId === state.profile.userId) return;
    var payload = {
      action: "recordInvite",
      inviterId: state.inviterId,
      inviteeId: state.profile.userId,
      inviteeName: state.profile.displayName || ""
    };
    fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(function (err) { console.error("recordInvite failed:", err); });
  }

  function renderRankList(elId, data) {
    var el = qs(elId);
    if (!el) return;
    if (!data || !data.top || data.top.length === 0) {
      el.innerHTML = '<div class="zg-rank-empty">還沒有人邀請好友，快來當第一名！</div>';
      return;
    }
    var html = "";
    var medals = ["🥇", "🥈", "🥉"];
    data.top.slice(0, 3).forEach(function (item, index) {
      html += '<div class="zg-rank-item">' +
        '<span class="zg-rank-no">' + (medals[index] || (index + 1)) + '</span>' +
        '<span class="zg-rank-name">' + (item.name || "神秘玩家") + '</span>' +
        '<span class="zg-rank-count">' + (item.count || 0) + '</span>' +
        '</div>';
    });
    if (data.myRank && data.myRank > 3) {
      html += '<div class="zg-rank-item me">' +
        '<span class="zg-rank-no">' + data.myRank + '</span>' +
        '<span class="zg-rank-name">我</span>' +
        '<span class="zg-rank-count">' + (data.myCount || 0) + '</span>' +
        '</div>';
    }
    el.innerHTML = html;
  }

  function refreshRankPreviews() {
    var userId = state.profile && state.profile.userId ? state.profile.userId : "";
    loadFriendRankPreview(userId, function (data) {
      renderRankList("zg-blocked-rank-list", data);
      renderRankList("zg-result-rank-list", data);
    });
  }

  function updateRemainingUI() {
    var text = "今日剩餘挑戰次數：" + state.remainingPlays + " / " + DAILY_LIMIT;
    safeText("zg-remaining-note", text);
    safeText("zg-remaining-after-note", text);
  }

  function applyBlockedScreenText() {
    if (state.blockReason === "coupon") {
      safeHtml("zg-blocked-title", '你已經<br><span class="zg-highlight">領取過優惠碼</span>');
      safeText("zg-blocked-desc", "每人 24 小時內限領一次，感謝你的參與！");
    } else {
      safeHtml("zg-blocked-title", '今日挑戰<br><span class="zg-highlight">次數已用完</span>');
      safeText("zg-blocked-desc", "明天再來挑戰，或邀請好友一起玩來獲得更多樂趣！");
    }
  }

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
    var list = enemies.filter(function (e) { return e.id !== state.selectedTop.id; });
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

  /* ===================== 物理戰鬥引擎（真實碰撞版） ===================== */

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
      el.classList.remove("ko-fly", "win-pulse");
    });

    ensureSparkEl(box);

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
    triggerSpark(midX, midY);
    shakeBox();

    var impactForce = Math.abs(impulse);
    var playerPowerFactor = (playerBasePower + impactForce) / 10;
    var enemyPowerFactor = (enemyBasePower + impactForce) / 10;

    var playerHit = Math.max(2.5, enemyPowerFactor * 0.6 + Math.random() * 3);
    var enemyHit = Math.max(2.5, playerPowerFactor * 0.6 + Math.random() * 3);

    state.enemyHp -= enemyHit;
    state.playerHp -= playerHit;
    updateHpUI();

    return true;
  }

  function renderBody(el, body, angleAccum) {
    if (!el) return;
    var half = PHY.radius;
    el.style.transform =
      "translate(" + (body.x - half) + "px," + (body.y - half) + "px) rotate(" + angleAccum + "deg)";
  }

  function physicsStep(now) {
    if (!lastFrameTs) lastFrameTs = now;
    var dt = Math.min(0.032, (now - lastFrameTs) / 1000);
    lastFrameTs = now;

    if (!state.battleDone) {
      applyForces(player, "player", dt);
      applyForces(enemy, "enemy", dt);

      player.x += player.vx * dt;
      player.y += player.vy * dt;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;

      resolveWallCollision(player);
      resolveWallCollision(enemy);
      resolveTopCollision(now);

      var playerSpeedNow = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
      var enemySpeedNow = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
      playerSpinAngle += (8 + playerSpeedNow * 0.35) * player.curveSign;
      enemySpinAngle += (8 + enemySpeedNow * 0.35) * enemy.curveSign;

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

    if (loserEl && loserBody) {
      loserEl.classList.add("ko-fly");
      var flyX = loserBody.vx >= 0 ? 240 : -240;
      var flyY = loserBody.vy >= 0 ? 160 : -160;
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

  function startCommentaryLoop() {
    commentaryIndex = 0;
    safeText("zg-commentary", battleLines[0]);
    commentaryTimer = setInterval(function () {
      commentaryIndex = (commentaryIndex + 1) % battleLines.length;
      safeText("zg-commentary", battleLines[commentaryIndex]);
    }, 900);
  }

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

  function runBattle() {
    playerBasePower = state.selectedTop.attack + state.launchBonus +
      (state.typeStatus === "good" ? 20 : state.typeStatus === "bad" ? -20 : 0);
    enemyBasePower = state.enemy.attack + (Math.random() * 16 - 8);

    playerSpinAngle = 0;
    enemySpinAngle = 0;
    lastFrameTs = 0;
    battleStartTs = performance.now();
    collisionLockUntil = 0;

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

    setTimeout(showResult, 500);
  }

  function showResult() {
    var win = state.enemyHp <= state.playerHp;
    safeText("zg-result-score-pill", "SCORE " + state.score);
    safeText("zg-rank", state.rank);

    if (win) {
      safeText("zg-result-title", "挑戰成功！");
      safeText("zg-result-desc", "你的陀螺表現非常出色！");
    } else {
      safeText("zg-result-title", "挑戰結束！");
      safeText("zg-result-desc", "再接再厲，下次一定能贏！");
    }

    state.coupon = "ZELO" + state.score;
    safeText("zg-coupon-code", state.coupon);
    safeText("zg-result-type-note", "本場屬性判定：" + state.typeText);

    state.playsUsed += 1;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - state.playsUsed);
    updateRemainingUI();

    recordPlayResult();
    refreshRankPreviews();

    go("screen-result");

    if (state.remainingPlays <= 0) {
      state.isBlocked = true;
      state.blockReason = "limit";
    }
  }

  function shareInviteLink(userId) {
    var link = getInviteUrl(userId);
    if (typeof liff !== "undefined" && liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
      liff.shareTargetPicker([{
        type: "text",
        text: "🎮 一起來玩親子陀螺小小挑戰賽！用我的連結加入，看看誰的分數更高 👉 " + link
      }]).catch(function (err) { console.error("分享失敗", err); });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(function () {
        toast("✅ 邀請連結已複製！");
      });
    } else {
      toast("請於 LINE App 中開啟以使用分享功能");
    }
  }

  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        toast("已複製：" + text);
      });
    } else {
      toast(text);
    }
  }

  function resetForReplay() {
    state.selectedTop = null;
    state.enemy = null;
    state.power = 0;
    state.launchBonus = 0;
    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.classList.remove("selected");
    });
    var nextBtn = qs("btn-select-next");
    if (nextBtn) nextBtn.disabled = true;
    safeText("zg-selected-note", "請選擇一顆陀螺");
  }

  function bind() {
    var startBtn = qs("btn-start");
    if (startBtn) {
      startBtn.addEventListener("click", function () {
        if (state.isBlocked) {
          if (state.blockReason === "limit") {
            toast("😊 你今天已經挑戰過了，明天再來繼續挑戰吧！");
          } else {
            toast("🎁 你已經領取過優惠碼囉，24 小時後可再次挑戰！");
          }
          setTimeout(function () { go("screen-blocked"); }, 900);
        } else {
          go("screen-select");
        }
      });
    }

    document.querySelectorAll('[data-go]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        go(btn.getAttribute("data-go"));
      });
    });

    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.addEventListener("click", function () {
        selectTop(card.getAttribute("data-id"));
      });
    });

    var selectNextBtn = qs("btn-select-next");
    if (selectNextBtn) {
      selectNextBtn.addEventListener("click", function () {
        prepareLaunchScreen();
        go("screen-launch");
      });
    }

    var launchBtn = qs("btn-launch");
    if (launchBtn) {
      launchBtn.addEventListener("mousedown", startCharge);
      launchBtn.addEventListener("touchstart", function (e) { e.preventDefault(); startCharge(); }, { passive: false });
      launchBtn.addEventListener("mouseup", releaseLaunch);
      launchBtn.addEventListener("mouseleave", releaseLaunch);
      launchBtn.addEventListener("touchend", function (e) { e.preventDefault(); releaseLaunch(); }, { passive: false });
    }

    var skipBattleBtn = qs("btn-skip-battle");
    if (skipBattleBtn) {
      skipBattleBtn.addEventListener("click", function () {
        stopBattleLoop();
        if (!state.battleDone) {
          state.battleDone = true;
          state.playerHp = Math.max(state.playerHp, 1);
          state.enemyHp = Math.max(state.enemyHp, 0);
          finishBattle();
        }
      });
    }

    var inviteFriendBtn = qs("btn-invite-friend");
    if (inviteFriendBtn) {
      inviteFriendBtn.addEventListener("click", function () {
        shareInviteLink(state.profile && state.profile.userId);
      });
    }

    var shareResultBtn = qs("btn-share-result");
    if (shareResultBtn) {
      shareResultBtn.addEventListener("click", function () {
        var link = getInviteUrl(state.profile && state.profile.userId);
        if (typeof liff !== "undefined" && liff.isApiAvailable && liff.isApiAvailable("shareTargetPicker")) {
          liff.shareTargetPicker([{
            type: "text",
            text: "🌀 我在親子陀螺小小挑戰賽拿到 " + state.rank + " 級評價（" + state.score + " 分）！快來挑戰看看 👉 " + link
          }]).catch(function (err) { console.error("分享失敗", err); });
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(link).then(function () { toast("✅ 戰績連結已複製！"); });
        }
      });
    }

    var copyBtn = qs("btn-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () { copyText(state.coupon); });
    }

    var shopBtn = qs("btn-shop");
    if (shopBtn) {
      shopBtn.addEventListener("click", function () { window.location.href = SHOP_URL; });
    }

    var replayBtn = qs("btn-replay");
    if (replayBtn) {
      replayBtn.addEventListener("click", function () {
        resetForReplay();
        if (state.remainingPlays <= 0) {
          go("screen-blocked");
        } else {
          go("screen-select");
        }
      });
    }

    var blockedInviteBtn = qs("btn-blocked-invite");
    if (blockedInviteBtn) {
      blockedInviteBtn.addEventListener("click", function () {
        shareInviteLink(state.profile && state.profile.userId);
      });
    }

    var blockedCopyBtn = qs("btn-blocked-copy");
    if (blockedCopyBtn) {
      blockedCopyBtn.addEventListener("click", function () { copyText(state.blockedCoupon); });
    }

    var blockedShopBtn = qs("btn-blocked-shop");
    if (blockedShopBtn) {
      blockedShopBtn.addEventListener("click", function () { window.location.href = SHOP_URL; });
    }
  }

  window.addEventListener("resize", setAppHeight);
  setAppHeight();
  bind();
  initLiff();

  console.log("ZELO Shopify LIFF Game Ready - v9 Real Physics Collision Engine");
})();
