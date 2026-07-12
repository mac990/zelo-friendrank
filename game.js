/*
 * ZELO GAME JS
 * Complete Replacement
 * Version: 202607122200
 *
 * Rules:
 * - ONLY top-to-top collision reduces HP
 * - Wall rebound does NOT reduce HP
 * - HP bar represents HP only
 * - When HP reaches 0, that top stops spinning and loses
 *
 * Fixes:
 * - Top no longer escapes arena
 * - Share button now uses native share / clipboard fallback
 * - Result screen now shows battle coupon reward
 * - Coupon reward can be downloaded as PNG
 * - Coupon code can be copied by the main yellow reward button
 * - Bottom copy coupon button removed
 * - Coupon card no longer shows score text
 * - Result pill forced to REWARD
 *
 * Coupon odds:
 * - 500: 2%
 * - 250: 28%
 * - 100: 50%
 * - none: 30%
 */

(() => {
  'use strict';

  const VERSION = '202607122200';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const now = () => performance.now();

  const STORAGE = {
    selectedType: 'zelo_selected_top_type',
    myScore: 'zelo_my_score',
    friends: 'zelo_friend_rank'
  };

  const PHY = {
    radius: 34,
    ringPadding: 42,

    initialSpeed: 8.6,
    maxSpeed: 16.8,

    friction: 0.992,
    spinDecay: 0.996,

    wallRestitution: 1.05,
    hitRestitution: 1.12,

    hitDamageBase: 4.95,

    seekForceMax: 0.054,
    tangentForce: 0.039,

    battleLimit: 8000,
    minMotion: 0.76,

    spinLossOnHit: 0.033,
    railSpinLoss: 0.034
  };

  const FINISH = {
    spin: { label: 'Spin Finish', points: 1 },
    over: { label: 'Over Finish', points: 2 },
    burst: { label: 'Burst Finish', points: 2 },
    xtreme: { label: 'Xtreme Finish', points: 3 }
  };

  const COUPON_REWARDS = [
    {
      id: 'coupon500',
      label: '500 元折扣券',
      amount: 500,
      codePrefix: 'ZELO500',
      rate: 0.02
    },
    {
      id: 'coupon250',
      label: '250 元折扣券',
      amount: 250,
      codePrefix: 'ZELO250',
      rate: 0.28
    },
    {
      id: 'coupon100',
      label: '100 元折扣券',
      amount: 100,
      codePrefix: 'ZELO100',
      rate: 0.50
    },
    {
      id: 'none',
      label: '再接再厲',
      amount: 0,
      codePrefix: '',
      rate: 0.30
    }
  ];

  function makeCouponCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tail = '';

    for (let i = 0; i < 6; i++) {
      tail += chars[Math.floor(Math.random() * chars.length)];
    }

    return `${prefix}-${tail}`;
  }

  function drawCouponReward() {
    const r = Math.random();
    let acc = 0;

    for (const item of COUPON_REWARDS) {
      acc += item.rate;

      if (r <= acc) {
        return {
          ...item,
          code: item.amount > 0 ? makeCouponCode(item.codePrefix) : ''
        };
      }
    }

    return {
      ...COUPON_REWARDS[COUPON_REWARDS.length - 1],
      code: ''
    };
  }

  const TOPS = [
    {
      id: 'attack',
      name: '烈焰攻擊型',
      type: 'attack',
      emoji: '🔥',
      power: 96,
      defense: 58,
      stamina: 62,
      speed: 96,
      colorA: '#e60012',
      colorB: '#ffd45a'
    },
    {
      id: 'defense',
      name: '鋼鐵防禦型',
      type: 'defense',
      emoji: '🛡️',
      power: 64,
      defense: 98,
      stamina: 78,
      speed: 52,
      colorA: '#3fa9ff',
      colorB: '#d8f1ff'
    },
    {
      id: 'stamina',
      name: '永恆耐久型',
      type: 'stamina',
      emoji: '🌿',
      power: 62,
      defense: 72,
      stamina: 98,
      speed: 58,
      colorA: '#06c755',
      colorB: '#c7ffd9'
    },
    {
      id: 'balance',
      name: '星環平衡型',
      type: 'balance',
      emoji: '✨',
      power: 78,
      defense: 76,
      stamina: 76,
      speed: 76,
      colorA: '#9b5cff',
      colorB: '#57f2ff'
    }
  ];

  const FEEL = {
    attack: {
      label: '攻擊型',
      launchKick: 1.24,
      sparkMul: 1.75,
      hitSharpness: 1.42,
      stability: 0.78,
      friction: 1.08,
      humBase: 155,
      humGain: 1.38
    },
    defense: {
      label: '防禦型',
      launchKick: 0.9,
      sparkMul: 0.9,
      hitSharpness: 0.76,
      stability: 1.48,
      friction: 0.84,
      humBase: 92,
      humGain: 0.88
    },
    stamina: {
      label: '耐久型',
      launchKick: 0.94,
      sparkMul: 0.8,
      hitSharpness: 0.92,
      stability: 1.24,
      friction: 0.68,
      humBase: 118,
      humGain: 0.74
    },
    balance: {
      label: '平衡型',
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
    screen: 'start',
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

    lastCouponReward: null
  };

  const PERF = {
    lowFx: false,
    lastFxAt: 0,
    lastScratchAt: 0,
    lastAfterimageAt: 0,
    lastShockwaveAt: 0,
    activeFx: 0,
    maxFx: 46,
    maxSparksPerHit: 12,
    minFxGap: 34,
    minScratchGap: 90,
    minAfterimageGap: 120,
    minShockwaveGap: 180,
    frameSlowCount: 0
  };

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
    if (dtRaw > 1.45) PERF.frameSlowCount++;
    else PERF.frameSlowCount = Math.max(0, PERF.frameSlowCount - 1);

    PERF.lowFx = PERF.frameSlowCount > 12;
  }

  function fxCount(base, intensity = 1) {
    const mul = PERF.lowFx ? 0.42 : 1;
    return Math.max(2, Math.round(base * intensity * mul));
  }

  function getFeel(top) {
    return FEEL[top?.type] || FEEL.balance;
  }

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return fallback;
    }
  }

  function getMyScore() {
    return Number(localStorage.getItem(STORAGE.myScore) || 1200);
  }

  function setMyScore(score) {
    localStorage.setItem(STORAGE.myScore, String(Math.max(0, Math.round(score))));
  }

  function saveSelectedTop(top) {
    if (!top) return;
    localStorage.setItem(STORAGE.selectedType, top.id);
  }

  function loadSelectedTop() {
    const id = localStorage.getItem(STORAGE.selectedType) || 'attack';
    return TOPS.find(t => t.id === id) || TOPS[0];
  }

  function appRoot() {
    return $('#zelo-liff-game') || $('#zg-app') || $('#app') || document.body;
  }

  function screenStart() {
    return $('#screen-start') || $('#screen-home');
  }

  function screenSelect() {
    return $('#screen-select');
  }

  function screenBattle() {
    return $('#screen-battle');
  }

  function screenResult() {
    return $('#screen-result');
  }

  function allScreens() {
    return [
      screenStart(),
      screenSelect(),
      screenBattle(),
      screenResult()
    ].filter(Boolean);
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

    allScreens().forEach(screen => {
      const active = screen === target;
      screen.classList.toggle('active', active);
      screen.classList.toggle('is-active', active);
      screen.hidden = !active;
      screen.style.display = active ? 'flex' : 'none';
      screen.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    document.body.setAttribute('data-zg-screen', name);

    if (name === 'select') renderTopSelection();
    if (name === 'result') renderFriendRank();
  }

  function battleBox() {
    return $('.zg-battle-box') || $('#zg-battle-box') || screenBattle() || appRoot();
  }

  function restartClass(el, cls, duration = 300) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), duration);
  }

  function setCommentary(text) {
    const el = $('.zg-commentary');
    if (el) el.textContent = text;
  }
  /*
   * =========================================================
   * Battle result
   * =========================================================
   */

  function endBattle(playerWon, reason, finish = 'spin', points = 1) {
    state.running = false;
    state.paused = false;

    resetBattleFlowState();
    cancelChargeLoop();

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    const finishInfo = FINISH[finish] || FINISH.spin;
    const finishBonus = Number(points || finishInfo.points || 1);
    const oldScore = getMyScore();
    const reward = drawCouponReward();

    const delta = playerWon
      ? 18 + finishBonus * 18 + Math.round(Math.random() * 8)
      : -(8 + Math.round(Math.random() * 8));

    const newScore = Math.max(0, oldScore + delta);

    setMyScore(newScore);
    updateFriendAfterBattle(playerWon, newScore);

    showScreen('result');

    const resultPill = $('#screen-result .zg-pill');

    if (resultPill) {
      resultPill.textContent = 'REWARD';
    }

    const rank = $('#zg-result-rank') || $('.zg-rank');
    const title = $('#zg-result-title') || $('.zg-result-title');
    const subtitle = $('#zg-result-subtitle');
    const score = $('#zg-result-score');

    if (rank) {
      rank.textContent = playerWon ? 'W' : 'L';
    }

    if (title) {
      title.textContent = playerWon
        ? `勝利！${finishInfo.label}`
        : `敗北…${finishInfo.label}`;
    }

    if (subtitle) {
      subtitle.textContent = reason || '';
    }

    const couponBox = $('#zg-result-coupon');
    const couponLabel = $('#zg-coupon-label');
    const couponNote = $('#zg-coupon-note');
    const downloadBtn = $('#zg-download-coupon');
    const copyBtn = $('#zg-copy-coupon');

    /**
     * 清除舊版結果頁文案，避免畫面殘留「目前積分」。
     */
    const legacyCouponLabels = $$(
      '.zg-coupon-label, .zg-score-label, .zg-current-score-label, [data-zg-coupon-label]'
    );

    legacyCouponLabels.forEach(el => {
      el.textContent = reward.amount > 0
        ? `恭喜你贏得 ${reward.amount} 元折扣碼`
        : '這次沒有抽中折扣券';
    });

    if (couponBox) {
      couponBox.classList.toggle('no-reward', reward.amount <= 0);
      couponBox.classList.toggle('has-reward', reward.amount > 0);
      couponBox.setAttribute('data-coupon-amount', String(reward.amount || 0));
    }

    if (couponLabel) {
      couponLabel.textContent = reward.amount > 0
        ? `恭喜你贏得 ${reward.amount} 元折扣碼`
        : '這次沒有抽中折扣券';
    }

    if (score) {
      score.textContent = reward.amount > 0
        ? `${reward.amount} 元折扣券`
        : '再接再厲';
    }

    if (couponNote) {
      couponNote.innerHTML = reward.amount > 0
        ? `折扣碼：<strong>${reward.code}</strong>`
        : `別灰心，繼續挑戰就有機會獲得 ZELO 折扣券！`;
    }

    /**
     * 中間黃色按鈕：
     * 有折扣碼時：顯示「複製折扣碼」
     * 沒折扣碼時：顯示「保存戰鬥結果」
     */
    if (downloadBtn) {
      downloadBtn.hidden = false;
      downloadBtn.disabled = false;

      if (reward.amount > 0) {
        downloadBtn.textContent = '複製折扣碼';
        downloadBtn.setAttribute('data-zg-action', 'copy-coupon');
      } else {
        downloadBtn.textContent = '保存戰鬥結果';
        downloadBtn.setAttribute('data-zg-action', 'download-coupon');
      }
    }

    /**
     * 底部複製折扣碼按鈕已停用。
     * 如果舊 Liquid 或舊 JS 曾經產生 #zg-copy-coupon，直接移除。
     */
    if (copyBtn) {
      copyBtn.remove();
    }

    /**
     * 記錄本次折扣券資料，供中間黃色按鈕複製 / 下載使用。
     */
    state.lastCouponReward = {
      ...reward,
      playerWon,
      finish: finishInfo.label,
      score: newScore
    };

    renderFriendRank();
  }

  /*
   * =========================================================
   * Friend rank
   * =========================================================
   */

  function loadFriends() {
    const saved = safeParse(localStorage.getItem(STORAGE.friends), null);
    const myScore = getMyScore();

    /**
     * 只顯示：
     * 1. 自己
     * 2. 真的已經被寫入 localStorage 的邀請成功好友
     *
     * 不再產生 Kai / Mina / Leo / Rin 虛擬人物。
     */
    let list = Array.isArray(saved) ? saved : [];

    const meIndex = list.findIndex(x => x.id === 'me');

    if (meIndex >= 0) {
      list[meIndex] = {
        ...list[meIndex],
        name: '你',
        score: myScore
      };
    } else {
      list.unshift({
        id: 'me',
        name: '你',
        score: myScore,
        wins: 0,
        losses: 0,
        todayDelta: 0,
        invited: true
      });
    }

    /**
     * 過濾掉舊版假資料。
     */
    const fakeIds = ['kai', 'mina', 'leo', 'rin'];

    list = list.filter(item => {
      if (!item || !item.id) return false;

      const id = String(item.id).toLowerCase();

      if (fakeIds.includes(id)) return false;
      if (item.id === 'me') return true;

      /**
       * 只有標記為 invited / accepted / source=invite 的好友才顯示。
       */
      return item.invited === true || item.accepted === true || item.source === 'invite';
    });

    localStorage.setItem(STORAGE.friends, JSON.stringify(list));

    return list;
  }

  function saveFriends(list) {
    localStorage.setItem(STORAGE.friends, JSON.stringify(list));
  }

  function updateFriendAfterBattle(playerWon, score) {
    const list = loadFriends();
    const me = list.find(x => x.id === 'me');

    if (me) {
      const old = Number(me.score || 0);

      me.score = score;
      me.todayDelta = score - old;

      if (playerWon) {
        me.wins = Number(me.wins || 0) + 1;
      } else {
        me.losses = Number(me.losses || 0) + 1;
      }
    }

    saveFriends(list);
  }

  function renderFriendRank() {
    const box =
      $('#zg-friend-rank-list') ||
      $('#friend-leaderboard') ||
      $('#zg-friend-leaderboard') ||
      $('.zg-friend-leaderboard') ||
      $('.friend-leaderboard');

    if (!box) return;

    const myScore = getMyScore();

    const rows = loadFriends()
      .map(item => {
        const total = Number(item.wins || 0) + Number(item.losses || 0);
        const winRate = total ? Math.round(Number(item.wins || 0) / total * 100) : 0;

        return {
          ...item,
          winRate,
          scoreDiff: Number(item.score || 0) - myScore
        };
      })
      .sort((a, b) => {
        if (Number(b.score || 0) !== Number(a.score || 0)) {
          return Number(b.score || 0) - Number(a.score || 0);
        }

        return Number(b.winRate || 0) - Number(a.winRate || 0);
      })
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    if (!rows.length) {
      box.innerHTML = `<div class="zg-rank-empty">目前尚無好友排行資料</div>`;
      return;
    }

    const invitedCount = rows.filter(row => row.id !== 'me').length;

    if (invitedCount <= 0) {
      box.innerHTML = rows.map(row => {
        const isMe = row.id === 'me';
        const delta = Number(row.todayDelta || 0);

        return `
          <div class="zg-rank-item ${isMe ? 'me' : ''}">
            <div class="zg-rank-no">${row.rank}</div>

            <div class="zg-rank-name">
              ${row.name}${isMe ? '（你）' : ''}
              <div class="zg-rank-count">目前尚未有邀請成功的好友</div>
            </div>

            <div class="zg-rank-count">
              ${row.score || 0}
              <br>
              <span class="${delta >= 0 ? 'up' : 'down'}">
                ${delta >= 0 ? '+' : ''}${delta}
              </span>
            </div>
          </div>

          <div class="zg-rank-empty">
            邀請好友完成遊戲後，才會出現在排行榜。
          </div>
        `;
      }).join('');

      return;
    }

    box.innerHTML = rows.map(row => {
      const isMe = row.id === 'me';

      const diff =
        row.scoreDiff === 0
          ? '同分'
          : row.scoreDiff > 0
            ? `領先你 ${row.scoreDiff}`
            : `落後你 ${Math.abs(row.scoreDiff)}`;

      const delta = Number(row.todayDelta || 0);

      return `
        <div class="zg-rank-item ${isMe ? 'me' : ''}">
          <div class="zg-rank-no">${row.rank}</div>

          <div class="zg-rank-name">
            ${row.name}${isMe ? '（你）' : ''}
            <div class="zg-rank-count">
              勝率 ${row.winRate}% · ${row.wins || 0}勝 ${row.losses || 0}敗 · ${diff}
            </div>
          </div>

          <div class="zg-rank-count">
            ${row.score || 0}
            <br>
            <span class="${delta >= 0 ? 'up' : 'down'}">
              ${delta >= 0 ? '+' : ''}${delta}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  /*
   * =========================================================
   * Share / Coupon Download / Coupon Copy
   * =========================================================
   */

  async function shareGame() {
    const score = getMyScore();
    const url = location.href.split('#')[0];

    const text = `我剛剛在 ZELO 陀螺競技場完成對戰，目前積分 ${score}！快來挑戰我！`;
    const title = 'ZELO 陀螺競技場';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast('分享連結已複製，可以貼給好友！');
        return;
      }

      prompt('複製分享連結：', `${text}\n${url}`);
    } catch (e) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          toast('分享連結已複製，可以貼給好友！');
          return;
        }
      } catch (err) {}

      toast('分享取消或目前瀏覽器不支援分享');
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function downloadCouponImage() {
    const reward = state.lastCouponReward;

    if (!reward) {
      toast('目前沒有可保存的戰鬥獎勵');
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = 1080;
    canvas.height = 640;

    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 1080, 640);

    gradient.addColorStop(0, '#1b1028');
    gradient.addColorStop(0.45, '#2b0f16');
    gradient.addColorStop(1, '#111827');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 214, 80, 0.18)';
    ctx.beginPath();
    ctx.arc(850, 100, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(87, 242, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(150, 540, 260, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 214, 80, 0.88)';
    ctx.lineWidth = 8;
    roundRect(ctx, 50, 50, 980, 540, 36);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, 70, 70, 940, 500, 28);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('ZELO 戰鬥獎勵', 540, 150);

    ctx.fillStyle = '#ffd650';
    ctx.font = 'bold 88px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText(`${reward.amount} 元折扣券`, 540, 285);
    } else {
      ctx.fillText('再接再厲', 540, 285);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '42px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText(`折扣碼：${reward.code}`, 540, 382);

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '28px sans-serif';
      ctx.fillText('請於 ZELO 官方商店結帳時輸入此代碼享優惠', 540, 435);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.font = '32px sans-serif';
      ctx.fillText('這次沒有抽中折扣券，繼續挑戰還有機會！', 540, 382);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '26px sans-serif';
    ctx.fillText(`戰鬥結果：${reward.playerWon ? '勝利' : '敗北'} · ${reward.finish}`, 540, 500);

    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.font = '26px sans-serif';

    if (reward.amount > 0) {
      ctx.fillText('恭喜你獲得 ZELO 戰鬥獎勵！', 540, 540);
    } else {
      ctx.fillText('繼續挑戰，下次就有機會獲得折扣券！', 540, 540);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    ctx.font = '22px sans-serif';
    ctx.fillText('※ 折扣券使用規則依商店公告為準', 540, 585);

    const link = document.createElement('a');

    const fileName = reward.amount > 0
      ? `ZELO-${reward.amount}-coupon-${reward.code}.png`
      : `ZELO-battle-result.png`;

    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast(reward.amount > 0 ? '折扣券圖片已保存' : '戰鬥結果已保存');
  }

  async function copyCouponCode() {
    const reward = state.lastCouponReward;

    if (!reward || !reward.amount || !reward.code) {
      toast('目前沒有可複製的折扣碼');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reward.code);
        toast(`已複製折扣碼：${reward.code}`);
        return;
      }

      prompt('請手動複製折扣碼：', reward.code);
    } catch (e) {
      prompt('請手動複製折扣碼：', reward.code);
    }
  }
  /*
   * =========================================================
   * Actions
   * =========================================================
   */

  function getText(el) {
    return String(el?.textContent || '').replace(/\s+/g, '').trim();
  }

  function resolveAction(el) {
    if (!el) return '';

    const direct =
      el.getAttribute('data-zg-action') ||
      el.getAttribute('data-action') ||
      el.getAttribute('data-game-action');

    if (direct) return direct;

    const id = String(el.id || '').toLowerCase();
    const cls = String(el.className || '').toLowerCase();
    const text = getText(el);
    const key = `${id} ${cls}`;

    if (
      key.includes('start') ||
      text.includes('開始遊戲') ||
      text === '開始'
    ) {
      return 'start';
    }

    if (
      key.includes('battle') ||
      key.includes('launch') ||
      text.includes('開始對戰') ||
      text.includes('發射') ||
      text.includes('對戰')
    ) {
      return 'battle';
    }

    if (
      key.includes('retry') ||
      key.includes('again') ||
      text.includes('再戰') ||
      text.includes('重玩') ||
      text.includes('再來')
    ) {
      return 'retry';
    }

    if (
      key.includes('select') ||
      key.includes('change') ||
      text.includes('更換') ||
      text.includes('選擇')
    ) {
      return 'select';
    }

    if (
      key.includes('home') ||
      key.includes('back') ||
      text.includes('首頁') ||
      text.includes('返回')
    ) {
      return 'home';
    }

    if (
      key.includes('copy-coupon') ||
      text.includes('複製折扣碼') ||
      text.includes('複製折扣券') ||
      text.includes('複製序號') ||
      text.includes('拷貝折扣碼') ||
      text.includes('拷貝折扣券') ||
      text.includes('拷貝序號')
    ) {
      return 'copy-coupon';
    }

    if (
      key.includes('download-coupon') ||
      text.includes('下載折扣券') ||
      text.includes('保存戰鬥結果')
    ) {
      return 'download-coupon';
    }

    if (
      key.includes('share') ||
      text.includes('邀請') ||
      text.includes('分享')
    ) {
      return 'share';
    }

    return '';
  }

  function toast(message) {
    let el = $('.zg-toast');

    if (!el) {
      el = document.createElement('div');
      el.className = 'zg-toast';
      appRoot().appendChild(el);
    }

    el.textContent = message;
    el.style.display = 'block';

    clearTimeout(el._timer);

    el._timer = setTimeout(() => {
      el.style.display = 'none';
    }, 1800);
  }

  function runAction(action) {
    if (!action) return;

    Sound.resume();

    if (action === 'start') {
      showScreen('select');
      return;
    }

    if (action === 'battle') {
      startBattle();
      return;
    }

    if (action === 'retry') {
      startBattle();
      return;
    }

    if (action === 'select') {
      stopBattle();
      showScreen('select');
      return;
    }

    if (action === 'home') {
      stopBattle();
      showScreen('start');
      return;
    }

    if (action === 'copy-coupon') {
      copyCouponCode();
      return;
    }

    if (action === 'download-coupon') {
      downloadCouponImage();
      return;
    }

    if (action === 'share') {
      shareGame();
      return;
    }
  }

  function bindEvents() {
    document.addEventListener('click', e => {
      const card = e.target.closest('.zg-top-card[data-id], .zg-top-card[data-top-id]');

      if (card) {
        e.preventDefault();

        const id = card.getAttribute('data-id') || card.getAttribute('data-top-id');

        selectTop(id);
        return;
      }

      const clickable = e.target.closest(
        'button, a, [role="button"], [data-zg-action], [data-action], [data-game-action]'
      );

      if (!clickable) return;

      if (clickable.classList.contains('zg-charge-btn')) {
        e.preventDefault();
        return;
      }

      const action = resolveAction(clickable);

      if (!action) return;

      e.preventDefault();
      runAction(action);
    });

    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('.zg-charge-btn');

      if (!btn) return;

      e.preventDefault();
      startCharging();
    });

    document.addEventListener('pointerup', e => {
      if (!state.charging) return;

      e.preventDefault();
      releaseCharging();
    });

    document.addEventListener('pointercancel', e => {
      if (!state.charging) return;

      e.preventDefault();
      releaseCharging();
    });

    document.addEventListener('pointerleave', e => {
      if (!state.charging) return;

      const isChargeBtn = e.target?.closest?.('.zg-charge-btn');

      if (!isChargeBtn) return;

      e.preventDefault();
      releaseCharging();
    });

    window.addEventListener('resize', () => {
      if (state.battle) {
        state.battle.arena = getArenaInfo();
        state.battle.lastArenaRefreshAt = now();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        state.paused = true;
        cancelChargeLoop();
        Sound.stopHum();
        return;
      }

      if (state.screen === 'battle' && state.battle) {
        state.paused = false;

        if (!state.finishing) {
          Sound.startHum(0, getFeel(state.battle.player.top).humBase);
          Sound.startHum(1, getFeel(state.battle.enemy.top).humBase);
        }

        state.lastFrame = 0;
        state.raf = requestAnimationFrame(battleLoop);
      }
    });
  }

  /*
   * =========================================================
   * Init
   * =========================================================
   */

  function init() {
    ensureAppHeight();
    ensureBasicDom();

    state.selectedTop = loadSelectedTop();

    injectVisualEnhancements();
    renderTopSelection();
    renderFriendRank();
    bindEvents();

    /**
     * 保險：
     * 如果 Liquid 或舊 DOM 裡仍存在底部複製按鈕，初始化時先刪除。
     */
    const bottomCopyBtn = $('#zg-copy-coupon');

    if (bottomCopyBtn) {
      bottomCopyBtn.remove();
    }

    /**
     * 對外除錯 API。
     */
    window.ZeloGame = {
      version: VERSION,
      state,
      startBattle,
      startBattleWithPower,
      stopBattle,
      showScreen,
      selectTop,
      renderTopSelection,
      renderFriendRank,
      downloadCouponImage,
      copyCouponCode,
      sound: Sound
    };

    window.ZGGame = window.ZeloGame;

    showScreen('start');

    console.info(`[ZeloGame] Loaded game.js v${VERSION}`);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
