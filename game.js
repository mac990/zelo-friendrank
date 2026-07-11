(function () {
  var LIFF_ID = "2007022255-ph9gRwPs";
  var SHOP_URL = "https://zelosportivo.com/zh";
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";
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
      beats: "defense"
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
      beats: "defense"
    }
  ];

  var state = {
    profile: null,
    selectedTop: null,
    enemy: null,
    enemyPerfect: false,
    power: 0,
    chargeDirection: 1,
    launchGrade: "Normal Launch",
    launchBonus: 0,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    rank: "B",
    coupon: "ZELOPLAY",
    charging: false,
    chargeTimer: null,
    battleTimer: null,
    battleDone: false,
    resultLogged: false,
    typeStatus: "neutral",
    typeText: "屬性均勢",
    isBlocked: false,
    blockedCoupon: "",
    blockReason: "",
    inviterId: "",
    playsUsed: 0,
    remainingPlays: DAILY_LIMIT
  };

  function qs(id) {
    return document.getElementById(id);
  }

  function safeText(id, text) {
    var el = qs(id);
    if (el) el.textContent = text;
  }

  function safeHtml(id, html) {
    var el = qs(id);
    if (el) el.innerHTML = html;
  }

  function setH() {
    var h = window.innerHeight || document.documentElement.clientHeight || screen.height;
    document.documentElement.style.setProperty("--zg-app-height", h + "px");
  }

  function go(id) {
    document.querySelectorAll(".zg-screen").forEach(function (screen) {
      screen.classList.remove("active");
    });

    var target = qs(id);
    if (target) target.classList.add("active");

    setH();
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

  function jsonpCall(params, onResult, timeoutMs) {
    var callbackName = "zeloCb_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    var timeoutId = null;
    var script = document.createElement("script");

    window[callbackName] = function (data) {
      if (timeoutId) clearTimeout(timeoutId);

      try {
        onResult(data);
      } catch (e) {}

      delete window[callbackName];

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    var query = [];

    for (var key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        query.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
      }
    }

    query.push("callback=" + callbackName);

    script.src = GOOGLE_SCRIPT_URL + "?" + query.join("&");

    script.onerror = function () {
      if (timeoutId) clearTimeout(timeoutId);

      delete window[callbackName];

      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }

      onResult(null);
    };

    document.body.appendChild(script);

    timeoutId = setTimeout(function () {
      if (window[callbackName]) {
        delete window[callbackName];

        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }

        onResult(null);
      }
    }, timeoutMs || 4000);
  }

  function checkCouponStatus(userId, onResult) {
    if (!userId) {
      onResult({ duplicate: false });
      return;
    }

    jsonpCall({
      action: "checkCoupon",
      userId: userId
    }, function (data) {
      onResult(data || { duplicate: false });
    });
  }

  function checkDailyLimit(userId, onResult) {
    if (!userId) {
      onResult({ playsUsed: 0 });
      return;
    }

    jsonpCall({
      action: "checkDailyLimit",
      userId: userId
    }, function (data) {
      onResult(data || { playsUsed: 0 });
    });
  }

  function loadFriendRankPreview(userId, onResult) {
    jsonpCall({
      action: "getFriendRankPreview",
      userId: userId || ""
    }, function (data) {
      onResult(data || { top: [] });
    }, 5000);
  }

  function renderRankList(containerId, data) {
    var el = qs(containerId);
    if (!el) return;

    var top = data && data.top ? data.top : [];

    if (top.length === 0) {
      el.innerHTML = '<div class="zg-rank-empty">還沒有人邀請好友，快來當第一名！</div>';
      return;
    }

    var html = "";
    var medals = ["🥇", "🥈", "🥉"];

    top.slice(0, 3).forEach(function (item, index) {
      html += '<div class="zg-rank-item">' +
        '<span class="zg-rank-no">' + (medals[index] || (index + 1)) + '</span>' +
        '<span class="zg-rank-name">' + (item.name || "神秘玩家") + '</span>' +
        '<span class="zg-rank-count">' + (item.count || 0) + ' 人</span>' +
        '</div>';
    });

    if (data && data.myRank && data.myRank > 3) {
      html += '<div class="zg-rank-item me">' +
        '<span class="zg-rank-no">' + data.myRank + '</span>' +
        '<span class="zg-rank-name">我</span>' +
        '<span class="zg-rank-count">' + (data.myCount || 0) + ' 人</span>' +
        '</div>';
    }

    el.innerHTML = html;
  }

  function refreshRankPreviews() {
    var userId = state.profile && state.profile.userId ? state.profile.userId : "";

    loadFriendRankPreview(userId, function (data) {
      renderRankList("zg-result-rank-list", data);
      renderRankList("zg-blocked-rank-list", data);
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

      if (qs("btn-start")) {
        qs("btn-start").disabled = false;
        qs("btn-start").textContent = "開始挑戰";
      }

      return;
    }

    if (qs("btn-start")) {
      qs("btn-start").disabled = true;
      qs("btn-start").textContent = "檢查中...";
    }

    var pendingChecks = 2;

    function checkDone() {
      pendingChecks -= 1;

      if (pendingChecks <= 0 && qs("btn-start")) {
        qs("btn-start").disabled = false;
        qs("btn-start").textContent = "開始挑戰";
      }
    }

    liff.init({ liffId: LIFF_ID }).then(function () {
      if (!liff.isLoggedIn()) {
        return null;
      }

      return liff.getProfile();
    }).then(function (profile) {
      if (!profile) {
        refreshRankPreviews();

        if (qs("btn-start")) {
          qs("btn-start").disabled = false;
          qs("btn-start").textContent = "開始挑戰";
        }

        return;
      }

      state.profile = profile;

      safeText("zg-player-name", "哈囉，" + (profile.displayName || "玩家") + "！準備好發射了嗎？");

      checkCouponStatus(profile.userId, function (result) {
        if (result && result.duplicate) {
          state.isBlocked = true;
          state.blockReason = "coupon";
          state.blockedCoupon = result.coupon || "ZELOPLAY";

          safeText("zg-blocked-coupon-code", state.blockedCoupon);
          applyBlockedScreenText();
        }

        checkDone();
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

        if (state.remainingPlays <= 0 && state.blockReason !== "coupon") {
          state.isBlocked = true;
          state.blockReason = "limit";
          applyBlockedScreenText();
        }

        checkDone();
      });

      refreshRankPreviews();
    }).catch(function () {
      refreshRankPreviews();

      if (qs("btn-start")) {
        qs("btn-start").disabled = false;
        qs("btn-start").textContent = "開始挑戰";
      }
    });
  }

  function getLaunchGrade(power) {
    if (power >= 78 && power <= 82) {
      return { label: "Perfect Launch", bonus: 34 };
    }

    if ((power >= 66 && power < 78) || (power > 82 && power <= 88)) {
      return { label: "Good Launch", bonus: 12 };
    }

    if (power > 88) {
      return { label: "Over Launch", bonus: -18 };
    }

    if (power >= 42) {
      return { label: "Normal Launch", bonus: 3 };
    }

    return { label: "Weak Launch", bonus: -8 };
  }

  function updatePower(value) {
    state.power = Math.max(0, Math.min(100, value));

    if (qs("zg-meter-fill")) {
      qs("zg-meter-fill").style.width = state.power + "%";
    }

    if (qs("zg-meter-pointer")) {
      qs("zg-meter-pointer").style.left = state.power + "%";
    }

    safeText("zg-power-text", Math.round(state.power) + "%");

    if (qs("zg-launch-grade")) {
      qs("zg-launch-grade").textContent = getLaunchGrade(state.power).label;
    }
  }

  function selectTop(id) {
    var top = tops[id];

    if (!top) return;

    state.selectedTop = top;

    document.querySelectorAll(".zg-top-card").forEach(function (card) {
      card.classList.toggle("selected", card.getAttribute("data-id") === id);
    });

    if (qs("btn-select-next")) {
      qs("btn-select-next").disabled = false;
    }

    safeText("zg-selected-note", "已選擇：" + top.name + "｜" + top.typeName);

    if (qs("zg-launch-top")) {
      qs("zg-launch-top").textContent = top.icon;
      qs("zg-launch-top").className = "zg-launch-top " + top.className;
    }

    if (qs("zg-player-battle-top")) {
      qs("zg-player-battle-top").textContent = top.icon;
      qs("zg-player-battle-top").className = "zg-battle-top zg-player-top " + top.className;
    }
  }

    function startCharge() {
    if (!state.selectedTop) {
      toast("請先選擇陀螺");
      return;
    }

    if (state.charging) return;

    if (state.chargeTimer) {
      clearInterval(state.chargeTimer);
    }

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
    prepareBattle();
    go("screen-battle");

    setTimeout(runBattle, 450);
  }

  function chooseEnemy() {
    var list = enemies.filter(function (enemy) {
      return enemy.id !== state.selectedTop.id;
    });

    state.enemy = list[Math.floor(Math.random() * list.length)] || enemies[0];
    state.enemyPerfect = Math.random() < 0.18;

    if (qs("zg-enemy-battle-top")) {
      qs("zg-enemy-battle-top").textContent = state.enemy.icon;
      qs("zg-enemy-battle-top").className = "zg-battle-top zg-enemy-top " + state.enemy.id;
    }
  }

  function getTypeText() {
    if (!state.selectedTop || !state.enemy) {
      return "屬性判定：等待結果。";
    }

    if (state.selectedTop.beats === state.enemy.id) {
      state.typeStatus = "good";
      state.typeText = "屬性優勢";
      return "屬性優勢！你的 " + state.selectedTop.typeName + " 剋制對手 " + state.enemy.typeName + "。";
    }

    if (state.enemy.beats === state.selectedTop.id) {
      state.typeStatus = "bad";
      state.typeText = "屬性劣勢";
      return "屬性劣勢！對手 " + state.enemy.typeName + " 剋制你的 " + state.selectedTop.typeName + "。";
    }

    state.typeStatus = "neutral";
    state.typeText = "屬性均勢";
    return "屬性均勢，勝負取決於發射品質。";
  }

  function updateHp(player, enemy) {
    state.playerHp = Math.max(0, Math.min(100, player));
    state.enemyHp = Math.max(0, Math.min(100, enemy));

    if (qs("zg-player-hp")) {
      qs("zg-player-hp").style.width = state.playerHp + "%";
    }

    if (qs("zg-enemy-hp")) {
      qs("zg-enemy-hp").style.width = state.enemyHp + "%";
    }

    safeText("zg-player-hp-text", Math.round(state.playerHp));
    safeText("zg-enemy-hp-text", Math.round(state.enemyHp));
  }

  function prepareBattle() {
    state.playerHp = 100;
    state.enemyHp = 100;
    state.battleDone = false;
    state.resultLogged = false;

    updateHp(100, 100);
    setBattlePhase("");

    var text = "你的「" + state.selectedTop.name + "」對上「" + state.enemy.name + "」！" + getTypeText();

    if (state.enemyPerfect) {
      text += " 對手氣勢很強，可能打出完美一擊！";
    }

    safeText("zg-commentary", text);
    safeText("zg-battle-phase", "準備中");
  }

  function setBattlePhase(phase) {
    var box = qs("zg-battle-box");

    if (!box) return;

    box.classList.remove("phase-impact", "phase-clash", "phase-stamina");

    if (phase) {
      box.classList.add("phase-" + phase);
    }
  }

  function advantageScore() {
    var score = 0;

    if (state.selectedTop.beats === state.enemy.id) {
      score += 28;
    }

    if (state.enemy.beats === state.selectedTop.id) {
      score -= 24;
    }

    if (state.enemyPerfect) {
      score -= 16;
    }

    return score;
  }

  function runBattle() {
    var phases = [
      { id: "impact", label: "撞擊期", text: "第一波強力撞擊！兩顆陀螺正面碰撞！" },
      { id: "clash", label: "纏鬥期", text: "雙方進入中心纏鬥，互相推擠！" },
      { id: "stamina", label: "持久期", text: "轉速逐漸下降，最後考驗持久力與平衡感！" }
    ];

    var index = 0;

    function next() {
      if (index >= phases.length || state.battleDone) {
        setBattlePhase("");
        finishBattle();
        return;
      }

      var phase = phases[index];

      setBattlePhase(phase.id);
      safeText("zg-battle-phase", phase.label);

      var extra = "";

      if (state.selectedTop && state.enemy) {
        if (state.selectedTop.beats === state.enemy.id) {
          extra += " 屬性優勢正在發揮，對手被壓制！";
        } else if (state.enemy.beats === state.selectedTop.id) {
          extra += " 屬性劣勢，你的陀螺承受更大壓力！";
        }
      }

      if (state.enemyPerfect) {
        extra += " 對手氣勢很強，戰局出現變數！";
      }

      safeText("zg-commentary", phase.text + extra);

      var playerPower =
        state.selectedTop.attack * 0.35 +
        state.selectedTop.defense * 0.25 +
        state.selectedTop.stamina * 0.25 +
        state.selectedTop.balance * 0.15 +
        state.launchBonus +
        advantageScore() +
        Math.floor(Math.random() * 16);

      var enemyPower =
        state.enemy.attack * 0.35 +
        state.enemy.defense * 0.25 +
        state.enemy.stamina * 0.25 +
        state.enemy.balance * 0.15 +
        (state.enemyPerfect ? 24 : 0) +
        Math.floor(Math.random() * 16);

      var playerDamage = Math.max(8, Math.round((enemyPower - playerPower + 36) / 3.2));
      var enemyDamage = Math.max(8, Math.round((playerPower - enemyPower + 36) / 3.2));

      state.battleTimer = setTimeout(function () {
        updateHp(state.playerHp - playerDamage, state.enemyHp - enemyDamage);

        if (enemyDamage > playerDamage + 6) {
          safeText("zg-commentary", "漂亮！你的陀螺取得優勢，對手轉速下降！");
        } else if (playerDamage > enemyDamage + 6) {
          safeText("zg-commentary", "對手反擊成功，你的陀螺開始晃動！");
        } else {
          safeText("zg-commentary", "雙方勢均力敵，戰況膠著！");
        }

        index += 1;

        state.battleTimer = setTimeout(function () {
          if (state.playerHp <= 0 || state.enemyHp <= 0) {
            setBattlePhase("");
            finishBattle();
          } else {
            next();
          }
        }, 900);
      }, 1
