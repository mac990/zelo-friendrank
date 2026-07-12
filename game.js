/*!
 * =========================================================
 * ZELO LIFF BEYBLADE GAME
 * game.js
 * Version: 202607130322
 *
 * Important:
 * - Friend rank shows REAL FRIENDS ONLY.
 * - No fake / seeded friends.
 * - Result page layout is preserved.
 * - Supports copy coupon only.
 * =========================================================
 */

(function () {
  'use strict';

  /*
   * =========================================================
   * 01. CONFIG
   * =========================================================
   */

  const VERSION = '202607130322';

  const ROOT_ID = 'zelo-liff-game';

  const STORAGE = {
    selectedTop: 'zg_selected_top',
    lastScore: 'zg_last_score',
    bestScore: 'zg_best_score',
    lastResult: 'zg_last_result',
    lastCoupon: 'zg_last_coupon',
    friends: 'zg_friends',
    profile: 'zg_profile',
    realFriendRanks: 'zg_real_friend_ranks'
  };

  const ACTIONS = {
    start: 'start',
    home: 'home',
    select: 'select',
    battle: 'battle',
    retry: 'retry',
    share: 'share',
    copyCoupon: 'copy-coupon',
    downloadCoupon: 'download-coupon'
  };

  const SCREENS = {
    start: 'screen-start',
    select: 'screen-select',
    battle: 'screen-battle',
    result: 'screen-result'
  };

  const TOPS = [
    {
      id: 'attack',
      icon: '🔥',
      name: '烈焰突擊',
      type: 'ATTACK',
      desc: '高爆發、高速度，適合主動進攻。',
      attack: 92,
      defense: 48,
      stamina: 58,
      speed: 94,
      hp: 100,
      color: '#ff4b65'
    },
    {
      id: 'defense',
      icon: '🛡️',
      name: '鋼盾守護',
      type: 'DEFENSE',
      desc: '穩定抗撞，擅長承受衝擊。',
      attack: 58,
      defense: 94,
      stamina: 72,
      speed: 52,
      hp: 116,
      color: '#36c7ff'
    },
    {
      id: 'stamina',
      icon: '⚡',
      name: '雷霆持久',
      type: 'STAMINA',
      desc: '旋轉時間長，越後期越有優勢。',
      attack: 64,
      defense: 66,
      stamina: 96,
      speed: 70,
      hp: 108,
      color: '#ffd650'
    },
    {
      id: 'balance',
      icon: '🌀',
      name: '星環平衡',
      type: 'BALANCE',
      desc: '能力平均，攻守轉換最靈活。',
      attack: 76,
      defense: 76,
      stamina: 76,
      speed: 76,
      hp: 106,
      color: '#b97cff'
    }
  ];

  const ENEMIES = [
    {
      id: 'enemy-fire',
      icon: '🔥',
      name: '赤焰對手',
      attack: 82,
      defense: 62,
      stamina: 70,
      speed: 82,
      hp: 104
    },
    {
      id: 'enemy-blue',
      icon: '💠',
      name: '蒼藍對手',
      attack: 68,
      defense: 82,
      stamina: 78,
      speed: 64,
      hp: 108
    },
    {
      id: 'enemy-dark',
      icon: '🌪️',
      name: '暗影對手',
      attack: 76,
      defense: 72,
      stamina: 82,
      speed: 78,
      hp: 110
    }
  ];

  const COUPONS = {
    win: [
      {
        label: '恭喜你贏得折扣碼',
        code: 'ZELO500',
        title: '500 元折扣券',
        note: '結帳時輸入折扣碼即可使用。'
      },
      {
        label: '恭喜你贏得折扣碼',
        code: 'BATTLE300',
        title: '300 元折扣券',
        note: '結帳時輸入折扣碼即可使用。'
      },
      {
        label: '恭喜你贏得折扣碼',
        code: 'SPIN10',
        title: '9 折優惠券',
        note: '結帳時輸入折扣碼即可使用。'
      }
    ],
    lose: [
      {
        label: '再接再厲獎勵',
        code: 'TRY100',
        title: '100 元折扣券',
        note: '下次再挑戰，也可以使用本折扣碼。'
      },
      {
        label: '挑戰者獎勵',
        code: 'RETRY50',
        title: '50 元折扣券',
        note: '結帳時輸入折扣碼即可使用。'
      }
    ]
  };


  /*
   * =========================================================
   * 02. STATE
   * =========================================================
   */

  const state = {
    root: null,
    currentScreen: 'start',
    selectedTopId: 'balance',
    selectedTop: null,
    enemy: null,

    battleRunning: false,
    battleTimer: null,
    battleStartAt: 0,
    battleDuration: 0,

    playerHp: 100,
    enemyHp: 100,
    playerMaxHp: 100,
    enemyMaxHp: 100,

    playerPos: { x: 42, y: 58 },
    enemyPos: { x: 58, y: 42 },
    playerVel: { x: 0, y: 0 },
    enemyVel: { x: 0, y: 0 },

    chargeValue: 0,
    chargeTimer: null,
    charging: false,
    chargeDirection: 1,
    launchPower: 0,

    lastScore: 0,
    lastResult: null,
    lastCoupon: null,
    lastCouponReward: null,

    toastTimer: null
  };


  /*
   * =========================================================
   * 03. DOM HELPERS
   * =========================================================
   */

  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function root() {
    if (!state.root) {
      state.root = byId(ROOT_ID);
    }

    return state.root;
  }

  function createEl(tag, className, html) {
    const el = document.createElement(tag);

    if (className) {
      el.className = className;
    }

    if (typeof html === 'string') {
      el.innerHTML = html;
    }

    return el;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function now() {
    return Date.now();
  }

  function safeParse(raw, fallback) {
    try {
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // ignore
    }
  }

  function loadJson(key, fallback) {
    try {
      return safeParse(localStorage.getItem(key), fallback);
    } catch (err) {
      return fallback;
    }
  }

  function saveText(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (err) {
      // ignore
    }
  }

  function loadText(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  /*
   * =========================================================
   * 04. DOM SAFETY
   * =========================================================
   */

  function ensureRoot() {
    let app = root();

    if (!app) {
      app = createEl('div', 'zg-app');
      app.id = ROOT_ID;
      document.body.appendChild(app);
      state.root = app;
    }

    app.classList.add('zg-app');

    return app;
  }

  function removeOldBrandDom() {
    const app = root();
    if (!app) return;

    $all('.zg-brand, .zg-pill, .zg-logo, .zg-menu, .zg-menu-pill, .zg-header-logo, .zg-old-logo', app)
      .forEach(el => {
        el.remove();
      });
  }

  function ensureEnergyGrid() {
    const app = root();
    if (!app) return;

    if (!$('.zg-energy-grid', app)) {
      app.insertBefore(createEl('div', 'zg-energy-grid'), app.firstChild);
    }
  }

  function ensureToast() {
    const app = root();
    if (!app) return;

    if (!byId('zg-toast')) {
      const toast = createEl('div', 'zg-toast');
      toast.id = 'zg-toast';
      app.appendChild(toast);
    }
  }

  function ensureScreen(id) {
    const app = root();
    if (!app) return null;

    let screen = byId(id);

    if (!screen) {
      screen = createEl('section', 'zg-screen');
      screen.id = id;
      screen.hidden = true;
      screen.setAttribute('aria-hidden', 'true');
      app.appendChild(screen);
    }

    return screen;
  }

  function ensureBasicDom() {
    ensureRoot();
    ensureEnergyGrid();
    ensureScreen(SCREENS.start);
    ensureScreen(SCREENS.select);
    ensureScreen(SCREENS.battle);
    ensureScreen(SCREENS.result);
    ensureToast();
    removeOldBrandDom();
  }

  function ensureSelectDom() {
    const screen = byId(SCREENS.select);
    if (!screen) return;

    let list = byId('zg-top-list');

    if (!list) {
      const main = $('.zg-main', screen) || screen;
      list = createEl('div', 'zg-top-list');
      list.id = 'zg-top-list';
      main.appendChild(list);
    }
  }

  function ensureBattleDom() {
    const screen = byId(SCREENS.battle);
    if (!screen) return;

    let main = $('.zg-main', screen);

    if (!main) {
      main = createEl('main', 'zg-main');
      screen.appendChild(main);
    }

    let box = $('.zg-battle-box', screen);

    if (!box) {
      box = createEl('div', 'zg-battle-box');
      main.insertBefore(box, main.firstChild);
    }

    if (!$('.zg-arena-ring', box)) {
      box.appendChild(createEl('div', 'zg-arena-ring'));
    }

    if (!$('.zg-xtreme-zone', box)) {
      box.appendChild(createEl('div', 'zg-xtreme-zone'));
    }

    ['p1', 'p2', 'p3', 'p4'].forEach(cls => {
      if (!$('.zg-pocket-zone.' + cls, box)) {
        box.appendChild(createEl('div', 'zg-pocket-zone ' + cls));
      }
    });

    if (!$('.zg-danger-vignette', box)) {
      box.appendChild(createEl('div', 'zg-danger-vignette'));
    }

    if (!$('.zg-flash-overlay', box)) {
      box.appendChild(createEl('div', 'zg-flash-overlay'));
    }

    let player = byId('zg-player-top');

    if (!player) {
      player = createEl('div', 'zg-battle-top zg-player-top', '<span>🌀</span>');
      player.id = 'zg-player-top';
      box.appendChild(player);
    }

    let enemy = byId('zg-enemy-top');

    if (!enemy) {
      enemy = createEl('div', 'zg-battle-top zg-enemy-top', '<span>🔥</span>');
      enemy.id = 'zg-enemy-top';
      box.appendChild(enemy);
    }

    if (!$('.zg-charge-layer', box)) {
      const layer = createEl('div', 'zg-charge-layer');
      layer.hidden = true;
      layer.innerHTML = [
        '<div class="zg-charge-card">',
        '  <div class="zg-charge-top-preview">🌀</div>',
        '  <div class="zg-charge-rope" aria-hidden="true"></div>',
        '  <div class="zg-charge-title">拉繩發射！</div>',
        '  <div class="zg-charge-subtitle">按住集氣，在黃金區放開！</div>',
        '  <div class="zg-charge-meter">',
        '    <div class="zg-charge-zone weak"></div>',
        '    <div class="zg-charge-zone good"></div>',
        '    <div class="zg-charge-zone perfect"></div>',
        '    <div class="zg-charge-fill"></div>',
        '    <div class="zg-charge-marker"></div>',
        '  </div>',
        '  <button class="zg-charge-btn" type="button">按住蓄力，放開發射</button>',
        '  <div class="zg-charge-tip">手機長按按鈕，電腦可按空白鍵</div>',
        '</div>'
      ].join('');
      box.appendChild(layer);
    }

    ensureBattlePanel(main);
  }

  function ensureBattlePanel(main) {
    let panel = $('.zg-panel', main);

    if (!panel) {
      panel = createEl('div', 'zg-panel');
      panel.innerHTML = [
        '<div class="zg-hp-row">',
        '  <span>你</span>',
        '  <div class="zg-hp-bar"><div id="zg-player-hp" class="zg-hp-fill"></div></div>',
        '  <b id="zg-player-hp-text">100</b>',
        '</div>',
        '<div class="zg-hp-row">',
        '  <span>敵</span>',
        '  <div class="zg-hp-bar"><div id="zg-enemy-hp" class="zg-hp-fill"></div></div>',
        '  <b id="zg-enemy-hp-text">100</b>',
        '</div>',
        '<div class="zg-commentary">準備發射！</div>'
      ].join('');
      main.appendChild(panel);
    }
  }

  function ensureResultDom() {
    const screen = byId(SCREENS.result);
    if (!screen) return;

    let main = $('.zg-main', screen);

    if (!main) {
      main = createEl('main', 'zg-main');
      screen.appendChild(main);
    }

    if (!byId('zg-result-rank')) {
      const rank = createEl('div', 'zg-rank', 'W');
      rank.id = 'zg-result-rank';
      main.insertBefore(rank, main.firstChild);
    }

    if (!byId('zg-result-title')) {
      const title = createEl('h2', 'zg-result-title', '勝利！');
      title.id = 'zg-result-title';
      main.appendChild(title);
    }

    if (!byId('zg-result-desc')) {
      const oldSubtitle = byId('zg-result-subtitle');

      if (oldSubtitle) {
        oldSubtitle.id = 'zg-result-desc';
      } else {
        const desc = createEl('p', 'zg-desc', '你的陀螺撐到了最後。');
        desc.id = 'zg-result-desc';
        main.appendChild(desc);
      }
    }

    let coupon = byId('zg-coupon') || byId('zg-result-coupon');

    if (!coupon) {
      coupon = createEl('div', 'zg-coupon');
      coupon.id = 'zg-coupon';
      main.appendChild(coupon);
    } else {
      coupon.id = 'zg-coupon';
    }

    if (!byId('zg-coupon-label')) {
      const label = $('[data-zg-coupon-label]', coupon) || $('.zg-coupon-label', coupon);

      if (label) {
        label.id = 'zg-coupon-label';
      } else {
        const labelEl = createEl('div', 'zg-coupon-label', '恭喜你贏得折扣碼');
        labelEl.id = 'zg-coupon-label';
        coupon.appendChild(labelEl);
      }
    }

    if (!byId('zg-coupon-code')) {
      const oldScore = byId('zg-result-score');
      const code = oldScore || $('.zg-coupon-code', coupon);

      if (code) {
        code.id = 'zg-coupon-code';
      } else {
        const codeEl = createEl('div', 'zg-coupon-code', '-');
        codeEl.id = 'zg-coupon-code';
        coupon.appendChild(codeEl);
      }
    }

    if (!byId('zg-coupon-note')) {
      const note = $('.zg-coupon-note', coupon);

      if (note) {
        note.id = 'zg-coupon-note';
      } else {
        const noteEl = createEl('div', 'zg-coupon-note', '完成戰鬥後將顯示你的折扣碼');
        noteEl.id = 'zg-coupon-note';
        coupon.appendChild(noteEl);
      }
    }

    if (!byId('zg-download-coupon')) {
      const btn = createEl('button', 'zg-coupon-download', '複製折扣碼');
      btn.id = 'zg-download-coupon';
      btn.type = 'button';
      btn.hidden = true;
      btn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
      coupon.appendChild(btn);
    } else {
      const btn = byId('zg-download-coupon');
      btn.textContent = '複製折扣碼';
      btn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
    }

    const oldImageBtn = byId('zg-save-coupon-image');
    if (oldImageBtn) oldImageBtn.remove();

    $all('[data-zg-action="' + ACTIONS.downloadCoupon + '"]').forEach(btn => {
      btn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
      btn.textContent = '複製折扣碼';
    });

    if (!byId('zg-friend-rank-list')) {
      let rankbox = $('.zg-rankbox', screen);

      if (!rankbox) {
        rankbox = createEl('div', 'zg-rankbox');
        rankbox.innerHTML = '<div class="zg-rankbox-title">好友排行榜</div>';
        main.appendChild(rankbox);
      }

      const list = createEl('div');
      list.id = 'zg-friend-rank-list';
      rankbox.appendChild(list);
    }
  }


  /*
   * =========================================================
   * 05. SCREEN CONTROL
   * =========================================================
   */

  function showScreen(name) {
    const targetId = SCREENS[name] || name;

    Object.keys(SCREENS).forEach(key => {
      const id = SCREENS[key];
      const screen = byId(id);

      if (!screen) return;

      const active = id === targetId;

      screen.classList.toggle('active', active);
      screen.hidden = !active;
      screen.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    state.currentScreen = Object.keys(SCREENS).find(key => SCREENS[key] === targetId) || name;

    if (state.currentScreen !== 'battle') {
      stopBattle(false);
    }
  }

  function goHome() {
    stopBattle(false);
    showScreen('start');
  }

  function goSelect() {
    stopBattle(false);
    renderTopList();
    showScreen('select');
  }

  function goBattle() {
    startBattle();
  }

  function goResult() {
    showScreen('result');
  }


  /*
   * =========================================================
   * 06. TOAST
   * =========================================================
   */

  function toast(message, duration) {
    const el = byId('zg-toast');
    if (!el) return;

    el.textContent = String(message || '');

    clearTimeout(state.toastTimer);

    el.classList.add('is-show', 'show', 'active');

    state.toastTimer = setTimeout(() => {
      el.classList.remove('is-show', 'show', 'active');
    }, duration || 1800);
  }

  /*
   * =========================================================
   * 07. START / SELECT
   * =========================================================
   */

  function ensureStartDom() {
    const screen = byId(SCREENS.start);
    if (!screen) return;

    if (!$('.zg-stardust', screen)) {
      const stars = createEl('div', 'zg-stardust');
      stars.innerHTML = Array.from({ length: 12 })
        .map(() => '<span class="zg-star"></span>')
        .join('');
      screen.appendChild(stars);
    }

    let main = $('.zg-main', screen);

    if (!main) {
      main = createEl('main', 'zg-main');
      screen.appendChild(main);
    }

    if (!$('.zg-hero', main)) {
      main.appendChild(createEl('div', 'zg-hero', '🌀'));
    }

    if (!$('.zg-title', main)) {
      main.appendChild(createEl('h1', 'zg-title', 'ZELO<br><span class="zg-highlight">BATTLE</span>'));
    }

    if (!$('.zg-subtitle', main)) {
      main.appendChild(createEl('p', 'zg-subtitle', '選擇你的戰鬥陀螺，挑戰好友排行！'));
    }

    if (!$('.zg-desc', main)) {
      main.appendChild(createEl('p', 'zg-desc', '拉繩發射、碰撞對戰、取得折扣碼，看看你能不能登上好友排行榜。'));
    }

    let bottom = $('.zg-bottom', screen);

    if (!bottom) {
      bottom = createEl('div', 'zg-bottom');
      screen.appendChild(bottom);
    }

    if (!$('[data-zg-action="start"]', bottom)) {
      const btn = createEl('button', 'zg-btn zg-btn-red', '<span>開始遊戲</span>');
      btn.type = 'button';
      btn.setAttribute('data-zg-action', ACTIONS.start);
      bottom.appendChild(btn);
    }
  }

  function ensureSelectScreenDom() {
    const screen = byId(SCREENS.select);
    if (!screen) return;

    if (!$('.zg-topbar', screen)) {
      const topbar = createEl('div', 'zg-topbar zg-topbar-no-logo');
      topbar.innerHTML = '<button class="zg-small-btn" type="button" data-zg-action="home">返回首頁</button>';
      screen.insertBefore(topbar, screen.firstChild);
    }

    let main = $('.zg-main', screen);

    if (!main) {
      main = createEl('main', 'zg-main');
      screen.appendChild(main);
    }

    if (!$('.zg-step-title', main)) {
      main.appendChild(createEl('h2', 'zg-step-title', '選擇你的陀螺'));
    }

    if (!byId('zg-top-list')) {
      const list = createEl('div', 'zg-top-list');
      list.id = 'zg-top-list';
      main.appendChild(list);
    }

    let bottom = $('.zg-bottom', screen);

    if (!bottom) {
      bottom = createEl('div', 'zg-bottom');
      screen.appendChild(bottom);
    }

    if (!$('[data-zg-action="battle"]', bottom)) {
      const btn = createEl('button', 'zg-btn zg-btn-blue', '<span>確認出戰</span>');
      btn.type = 'button';
      btn.setAttribute('data-zg-action', ACTIONS.battle);
      bottom.appendChild(btn);
    }
  }

  function renderTopList() {
    ensureSelectDom();

    const list = byId('zg-top-list');
    if (!list) return;

    const selected = state.selectedTopId || loadText(STORAGE.selectedTop, 'balance');

    list.innerHTML = TOPS.map(top => {
      const active = top.id === selected;

      return [
        '<button type="button" class="zg-top-card' + (active ? ' is-selected' : '') + '" data-top-id="' + escapeHtml(top.id) + '">',
        '  <div class="zg-top-icon">' + escapeHtml(top.icon) + '</div>',
        '  <div class="zg-top-info">',
        '    <div class="zg-top-name">' + escapeHtml(top.name) + '</div>',
        '    <div class="zg-top-type">' + escapeHtml(top.type) + '</div>',
        '    <div class="zg-top-desc">' + escapeHtml(top.desc) + '</div>',
        '  </div>',
        '  <div class="zg-top-stats">',
        renderStat('攻擊', top.attack),
        renderStat('防禦', top.defense),
        renderStat('持久', top.stamina),
        renderStat('速度', top.speed),
        '  </div>',
        '</button>'
      ].join('');
    }).join('');
  }

  function renderStat(label, value) {
    return [
      '<div class="zg-stat">',
      '  <span class="zg-stat-label">' + escapeHtml(label) + '</span>',
      '  <span class="zg-stat-bar"><span class="zg-stat-fill" style="width:' + clamp(value, 0, 100) + '%"></span></span>',
      '</div>'
    ].join('');
  }

  function selectTop(id) {
    const top = TOPS.find(item => item.id === id) || TOPS[3];

    state.selectedTopId = top.id;
    state.selectedTop = top;

    saveText(STORAGE.selectedTop, top.id);

    $all('.zg-top-card').forEach(card => {
      const active = card.getAttribute('data-top-id') === top.id;
      card.classList.toggle('is-selected', active);
      card.classList.toggle('selected', active);
      card.setAttribute('data-selected', active ? 'true' : 'false');
    });

    toast('已選擇：' + top.name, 1000);
  }


  /*
   * =========================================================
   * 08. BATTLE INIT
   * =========================================================
   */

  function startBattle() {
    ensureBattleDom();

    const top = TOPS.find(item => item.id === state.selectedTopId) ||
      TOPS.find(item => item.id === loadText(STORAGE.selectedTop, 'balance')) ||
      TOPS[3];

    const enemy = pick(ENEMIES);

    state.selectedTop = top;
    state.enemy = enemy;

    state.playerMaxHp = top.hp;
    state.enemyMaxHp = enemy.hp;
    state.playerHp = top.hp;
    state.enemyHp = enemy.hp;

    state.playerPos = { x: 34, y: 62 };
    state.enemyPos = { x: 66, y: 38 };
    state.playerVel = { x: 0, y: 0 };
    state.enemyVel = { x: 0, y: 0 };

    state.launchPower = 0;
    state.battleRunning = false;

    updateBattleVisuals();
    updateHpBars();
    updateCommentary('按住蓄力，放開後發射！');

    setupChargeLayer(top);
    showScreen('battle');
    openChargeLayer();

    saveText(STORAGE.selectedTop, top.id);
  }

  function setupChargeLayer(top) {
    const layer = $('.zg-charge-layer');
    if (!layer) return;

    const preview = $('.zg-charge-top-preview', layer);
    if (preview) preview.textContent = top.icon || '🌀';

    const button = $('.zg-charge-btn', layer);

    if (button && !button.__zgBound) {
      button.__zgBound = true;

      button.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        beginCharge();
      });

      button.addEventListener('pointerup', function (event) {
        event.preventDefault();
        releaseCharge();
      });

      button.addEventListener('pointercancel', function () {
        releaseCharge();
      });

      button.addEventListener('pointerleave', function () {
        if (state.charging) releaseCharge();
      });
    }
  }

  function openChargeLayer() {
    const layer = $('.zg-charge-layer');
    if (!layer) return;

    layer.hidden = false;
    layer.classList.remove('zg-hidden');
    state.chargeValue = 0;
    state.chargeDirection = 1;

    updateChargeMeter();

    setTimeout(() => {
      beginCharge();
    }, 120);
  }

  function closeChargeLayer() {
    const layer = $('.zg-charge-layer');
    if (!layer) return;

    layer.hidden = true;
    layer.classList.add('zg-hidden');
    layer.classList.remove('is-charging');
  }

  function beginCharge() {
    if (state.battleRunning) return;

    const layer = $('.zg-charge-layer');
    const button = $('.zg-charge-btn');

    state.charging = true;

    if (layer) {
      layer.classList.add('is-charging');
    }

    if (button) {
      button.classList.add('is-pressed');
    }

    clearInterval(state.chargeTimer);

    state.chargeTimer = setInterval(() => {
      const delta = 3.2 * state.chargeDirection;

      state.chargeValue += delta;

      if (state.chargeValue >= 100) {
        state.chargeValue = 100;
        state.chargeDirection = -1;
      }

      if (state.chargeValue <= 0) {
        state.chargeValue = 0;
        state.chargeDirection = 1;
      }

      updateChargeMeter();
    }, 16);
  }

  function releaseCharge() {
    if (!state.charging || state.battleRunning) return;

    state.charging = false;

    clearInterval(state.chargeTimer);

    const layer = $('.zg-charge-layer');
    const button = $('.zg-charge-btn');

    if (layer) {
      layer.classList.remove('is-charging');
    }

    if (button) {
      button.classList.remove('is-pressed');
    }

    const power = calculateLaunchPower(state.chargeValue);
    state.launchPower = power;

    closeChargeLayer();
    launchBattle(power);
  }

  function updateChargeMeter() {
    const layer = $('.zg-charge-layer');
    if (!layer) return;

    const fill = $('.zg-charge-fill', layer);
    const marker = $('.zg-charge-marker', layer);

    if (fill) {
      fill.style.width = state.chargeValue + '%';
    }

    if (marker) {
      marker.style.left = state.chargeValue + '%';
    }
  }

  function calculateLaunchPower(value) {
    const v = clamp(value, 0, 100);

    if (v >= 76) {
      toast('完美發射！', 1000);
      return 1.24;
    }

    if (v >= 48) {
      toast('漂亮發射！', 1000);
      return 1.08;
    }

    toast('普通發射！', 1000);
    return 0.9;
  }

  function launchBattle(power) {
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    state.battleRunning = true;
    state.battleStartAt = now();
    state.battleDuration = randInt(9000, 14000);

    const playerSpeed = (top.speed / 100) * 1.6 * power;
    const enemySpeed = (enemy.speed / 100) * rand(1.1, 1.55);

    state.playerVel = {
      x: rand(0.55, 1.25) * playerSpeed,
      y: -rand(0.45, 1.12) * playerSpeed
    };

    state.enemyVel = {
      x: -rand(0.55, 1.15) * enemySpeed,
      y: rand(0.45, 1.08) * enemySpeed
    };

    updateCommentary('戰鬥開始！兩顆陀螺高速接近！');

    clearInterval(state.battleTimer);

    state.battleTimer = setInterval(tickBattle, 33);
  }

  /*
   * =========================================================
   * 09. BATTLE LOOP
   * =========================================================
   */

  function tickBattle() {
    if (!state.battleRunning) return;

    moveTop('player');
    moveTop('enemy');

    updateBattleVisuals();

    const dist = distance(state.playerPos, state.enemyPos);

    if (dist < 12) {
      handleCollision();
    }

    const elapsed = now() - state.battleStartAt;

    if (state.playerHp <= 0 || state.enemyHp <= 0 || elapsed >= state.battleDuration) {
      finishBattle();
    }
  }

  function moveTop(who) {
    const pos = who === 'player' ? state.playerPos : state.enemyPos;
    const vel = who === 'player' ? state.playerVel : state.enemyVel;

    pos.x += vel.x;
    pos.y += vel.y;

    if (pos.x <= 12 || pos.x >= 88) {
      vel.x *= -1;
      pos.x = clamp(pos.x, 12, 88);
    }

    if (pos.y <= 12 || pos.y >= 88) {
      vel.y *= -1;
      pos.y = clamp(pos.y, 12, 88);
    }

    const slow = who === 'player' ? 0.992 : 0.993;

    vel.x *= slow;
    vel.y *= slow;

    if (Math.abs(vel.x) < 0.18) {
      vel.x += rand(-0.18, 0.18);
    }

    if (Math.abs(vel.y) < 0.18) {
      vel.y += rand(-0.18, 0.18);
    }
  }

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  function handleCollision() {
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    const playerAttack = top.attack * rand(0.085, 0.155) * state.launchPower;
    const enemyAttack = enemy.attack * rand(0.078, 0.145);

    const playerDamage = Math.max(1.4, enemyAttack - top.defense * rand(0.022, 0.046));
    const enemyDamage = Math.max(1.4, playerAttack - enemy.defense * rand(0.022, 0.046));

    damage('player', playerDamage);
    damage('enemy', enemyDamage);

    const px = (state.playerPos.x + state.enemyPos.x) / 2;
    const py = (state.playerPos.y + state.enemyPos.y) / 2;

    spawnHitFx(px, py);
    spawnHitFx(px + rand(-2.4, 2.4), py + rand(-2.4, 2.4));
    spawnImpactBurst(px, py);
    spawnImpactSlash(px, py);
    flashBattle();
    shakeArena();

    bounceAfterCollision();

    const playerEl = byId('zg-player-top');
    const enemyEl = byId('zg-enemy-top');

    if (playerEl) {
      playerEl.classList.remove('is-hit');
      void playerEl.offsetWidth;
      playerEl.classList.add('is-hit');
      setTimeout(() => playerEl.classList.remove('is-hit'), 160);
    }

    if (enemyEl) {
      enemyEl.classList.remove('is-hit');
      void enemyEl.offsetWidth;
      enemyEl.classList.add('is-hit');
      setTimeout(() => enemyEl.classList.remove('is-hit'), 160);
    }

    if (enemyDamage > playerDamage) {
      updateCommentary('重擊命中！你打出了強烈撞擊！');
    } else if (playerDamage > enemyDamage) {
      updateCommentary('對手猛烈反擊，你的陀螺被震開！');
    } else {
      updateCommentary('雙方爆裂碰撞，火花四射！');
    }
  }

  function damage(who, amount) {
    if (who === 'player') {
      state.playerHp = clamp(state.playerHp - amount, 0, state.playerMaxHp);
    } else {
      state.enemyHp = clamp(state.enemyHp - amount, 0, state.enemyMaxHp);
    }

    updateHpBars();
  }

  function bounceAfterCollision() {
    const dx = state.playerPos.x - state.enemyPos.x;
    const dy = state.playerPos.y - state.enemyPos.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const nx = dx / len;
    const ny = dy / len;

    const push = 1.65;

    state.playerVel.x = nx * rand(0.85, 1.35) * push;
    state.playerVel.y = ny * rand(0.85, 1.35) * push;

    state.enemyVel.x = -nx * rand(0.85, 1.35) * push;
    state.enemyVel.y = -ny * rand(0.85, 1.35) * push;

    state.playerPos.x = clamp(state.playerPos.x + nx * 2.8, 12, 88);
    state.playerPos.y = clamp(state.playerPos.y + ny * 2.8, 12, 88);

    state.enemyPos.x = clamp(state.enemyPos.x - nx * 2.8, 12, 88);
    state.enemyPos.y = clamp(state.enemyPos.y - ny * 2.8, 12, 88);
  }

  function finishBattle() {
    if (!state.battleRunning) return;

    state.battleRunning = false;
    clearInterval(state.battleTimer);

    let win = false;

    if (state.enemyHp <= 0 && state.playerHp > 0) {
      win = true;
    } else if (state.playerHp <= 0 && state.enemyHp > 0) {
      win = false;
    } else {
      win = state.playerHp >= state.enemyHp;
    }

    buildResult(win);
    goResult();
  }

  function stopBattle(reset) {
    clearInterval(state.battleTimer);
    clearInterval(state.chargeTimer);

    state.battleRunning = false;
    state.charging = false;

    if (reset) {
      state.playerHp = state.playerMaxHp;
      state.enemyHp = state.enemyMaxHp;
      updateHpBars();
    }
  }


  /*
   * =========================================================
   * 10. BATTLE VISUALS
   * =========================================================
   */

  function updateBattleVisuals() {
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    const player = byId('zg-player-top');
    const enemyEl = byId('zg-enemy-top');

    if (player) {
      player.style.left = state.playerPos.x + '%';
      player.style.top = state.playerPos.y + '%';
      player.innerHTML = '<span>' + escapeHtml(top.icon || '🌀') + '</span>';
      player.setAttribute('data-top-type', top.id || 'balance');
    }

    if (enemyEl) {
      enemyEl.style.left = state.enemyPos.x + '%';
      enemyEl.style.top = state.enemyPos.y + '%';
      enemyEl.innerHTML = '<span>' + escapeHtml(enemy.icon || '🔥') + '</span>';
      enemyEl.setAttribute('data-top-type', enemy.id || 'enemy');
    }
  }

  function updateHpBars() {
    const p = byId('zg-player-hp');
    const e = byId('zg-enemy-hp');
    const pt = byId('zg-player-hp-text');
    const et = byId('zg-enemy-hp-text');

    const pp = state.playerMaxHp ? clamp((state.playerHp / state.playerMaxHp) * 100, 0, 100) : 0;
    const ep = state.enemyMaxHp ? clamp((state.enemyHp / state.enemyMaxHp) * 100, 0, 100) : 0;

    if (p) p.style.width = pp + '%';
    if (e) e.style.width = ep + '%';

    if (pt) pt.textContent = String(Math.ceil(state.playerHp));
    if (et) et.textContent = String(Math.ceil(state.enemyHp));
  }

  function updateCommentary(text) {
    const el = $('.zg-commentary');

    if (el) {
      el.textContent = text;
    }
  }

  function spawnHitFx(x, y) {
    const box = $('.zg-battle-box');
    if (!box) return;

    const fx = createEl('div', 'zg-hit-fx');
    fx.style.left = x + '%';
    fx.style.top = y + '%';
    box.appendChild(fx);

    setTimeout(() => {
      fx.remove();
    }, 460);
  }

  function spawnImpactBurst(x, y) {
    const box = $('.zg-battle-box');
    if (!box) return;

    const burst = createEl('div', 'zg-impact-burst');
    burst.style.left = x + '%';
    burst.style.top = y + '%';
    box.appendChild(burst);

    for (let i = 0; i < 12; i += 1) {
      const chip = createEl('div', 'zg-impact-chip');

      const angle = (Math.PI * 2 * i) / 12;
      const power = rand(18, 38);

      chip.style.left = x + '%';
      chip.style.top = y + '%';
      chip.style.setProperty('--zg-chip-x', Math.cos(angle) * power + 'px');
      chip.style.setProperty('--zg-chip-y', Math.sin(angle) * power + 'px');
      chip.style.transform = 'translate(-50%, -50%) rotate(' + randInt(0, 360) + 'deg)';

      box.appendChild(chip);

      setTimeout(() => {
        chip.remove();
      }, 420);
    }

    setTimeout(() => {
      burst.remove();
    }, 520);
  }

  function spawnImpactSlash(x, y) {
    const box = $('.zg-battle-box');
    if (!box) return;

    for (let i = 0; i < 3; i += 1) {
      const slash = createEl('div', 'zg-impact-slash');

      slash.style.left = x + '%';
      slash.style.top = y + '%';
      slash.style.transform =
        'translate(-50%, -50%) rotate(' + randInt(-55, 55) + 'deg)';

      box.appendChild(slash);

      setTimeout(() => {
        slash.remove();
      }, 360);
    }
  }

  function flashBattle() {
    const flash = $('.zg-flash-overlay');
    if (!flash) return;

    flash.classList.remove('is-show');
    void flash.offsetWidth;
    flash.classList.add('is-show');

    setTimeout(() => {
      flash.classList.remove('is-show');
    }, 180);
  }

  function shakeArena() {
    const box = $('.zg-battle-box');
    if (!box) return;

    box.classList.remove('is-impact-shake');
    void box.offsetWidth;
    box.classList.add('is-impact-shake');

    setTimeout(() => {
      box.classList.remove('is-impact-shake');
    }, 180);
  }

  /*
   * =========================================================
   * 11. RESULT
   * =========================================================
   */

  function calculateScore(win) {
    const base = win ? 780 : 420;
    const hpBonus = Math.max(0, Math.round(state.playerHp * 4));
    const enemyBonus = Math.max(0, Math.round((state.enemyMaxHp - state.enemyHp) * 2.4));
    const launchBonus = Math.round((state.launchPower || 1) * 120);
    const timeBonus = Math.max(0, Math.round((state.battleDuration - (now() - state.battleStartAt)) / 45));

    return Math.max(100, base + hpBonus + enemyBonus + launchBonus + timeBonus);
  }

  function chooseCoupon(win) {
    return pick(win ? COUPONS.win : COUPONS.lose);
  }

  function buildResult(win) {
    ensureResultDom();

    const score = calculateScore(win);
    const coupon = chooseCoupon(win);
    const profile = getMyProfile();
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    state.lastScore = score;
    state.lastResult = win ? 'win' : 'lose';
    state.lastCoupon = coupon.code;
    state.lastCouponReward = coupon;

    saveText(STORAGE.lastScore, score);
    saveText(STORAGE.lastResult, state.lastResult);
    saveJson(STORAGE.lastCoupon, coupon);

    saveMyRankScore(score);

    syncScoreToGoogle({
      userId: profile.id,
      displayName: profile.name,
      pictureUrl: profile.pictureUrl || '',
      score: score,
      result: state.lastResult,
      win: win ? 1 : 0,
      couponCode: coupon.code,
      couponTitle: coupon.title || '',
      selectedTopId: top.id || '',
      selectedTopName: top.name || '',
      enemyId: enemy.id || '',
      enemyName: enemy.name || '',
      launchPower: state.launchPower || 0,
      playerHp: Math.round(state.playerHp || 0),
      enemyHp: Math.round(state.enemyHp || 0),
      playedAt: new Date().toISOString(),
      version: VERSION
    });

    updateResultContent(win, score, coupon);
    renderFriendRanks();
  }

  function syncScoreToGoogle(payload) {
    if (
      window.ZELO_SYNC_SCORE_TO_GOOGLE &&
      typeof window.ZELO_SYNC_SCORE_TO_GOOGLE === 'function'
    ) {
      try {
        window.ZELO_SYNC_SCORE_TO_GOOGLE(payload);
      } catch (err) {
        // ignore
      }
    }
  }

  function updateResultContent(win, score, coupon) {
    const rank = byId('zg-result-rank');
    const title = byId('zg-result-title');
    const desc = byId('zg-result-desc');
    const label = byId('zg-coupon-label');
    const code = byId('zg-coupon-code');
    const note = byId('zg-coupon-note');

    if (rank) {
      rank.textContent = win ? 'W' : 'L';
      rank.classList.toggle('is-win', !!win);
      rank.classList.toggle('is-lose', !win);
    }

    if (title) {
      title.textContent = win ? '勝利！' : '惜敗！';
    }

    if (desc) {
      desc.textContent = win
        ? '你的陀螺撐到了最後，成功擊敗對手！本次分數：' + score
        : '這次差一點！調整陀螺後再挑戰一次。本次分數：' + score;
    }

    if (label) {
      label.textContent = coupon.label || '你的折扣碼';
    }

    if (code) {
      code.textContent = coupon.code || '-';
    }

    if (note) {
      note.textContent = coupon.note || '結帳時輸入折扣碼即可使用。';
    }

    setupResultButtons(coupon);
  }

  function setupResultButtons(coupon) {
    /*
     * 結果頁按鈕由 Liquid 保留。
     * 這裡不新增 .zg-result-actions。
     * 這裡不新增下載折扣券圖片。
     * 只處理複製折扣碼按鈕。
     */

    const copyBtn = byId('zg-download-coupon');

    if (copyBtn) {
      copyBtn.hidden = false;
      copyBtn.textContent = '複製折扣碼';
      copyBtn.className = 'zg-coupon-download';
      copyBtn.type = 'button';
      copyBtn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
    }

    const imageBtn = byId('zg-save-coupon-image');

    if (imageBtn) {
      imageBtn.remove();
    }

    $all('[data-zg-action="' + ACTIONS.downloadCoupon + '"]').forEach(btn => {
      btn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
      btn.textContent = '複製折扣碼';
    });
  }

  function copyCoupon() {
    const coupon = state.lastCouponReward || loadJson(STORAGE.lastCoupon, null);
    const code = coupon && coupon.code ? coupon.code : state.lastCoupon;

    if (!code) {
      toast('目前沒有可複製的折扣碼');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        toast('已複製折扣碼：' + code);
      }).catch(() => {
        fallbackCopy(code);
      });
    } else {
      fallbackCopy(code);
    }
  }

  function fallbackCopy(text) {
    const input = document.createElement('textarea');

    input.value = text;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';

    document.body.appendChild(input);
    input.select();

    try {
      document.execCommand('copy');
      toast('已複製折扣碼：' + text);
    } catch (err) {
      toast('請手動複製折扣碼：' + text, 2600);
    }

    input.remove();
  }

  function downloadCouponImage() {
    /*
     * 舊版相容函式。
     * 不再下載圖片，統一改為複製折扣碼。
     */
    copyCoupon();
  }


  /*
   * =========================================================
   * 12. PROFILE / FRIEND RANK
   * =========================================================
   */

  function getMyProfile() {
    const saved = loadJson(STORAGE.profile, null);

    if (saved && saved.id) {
      return normalizeProfile(saved);
    }

    if (window.ZELO_PROFILE && window.ZELO_PROFILE.id) {
      const profile = normalizeProfile(window.ZELO_PROFILE);
      saveJson(STORAGE.profile, profile);
      return profile;
    }

    if (window.liff && window.liff.getProfile) {
      try {
        const maybe = window.liff.getProfile();

        if (maybe && typeof maybe.then === 'function') {
          maybe.then(profile => {
            if (profile) {
              saveJson(STORAGE.profile, normalizeProfile(profile));
            }
          }).catch(() => {});
        }
      } catch (err) {
        // ignore
      }
    }

    return {
      id: 'guest-' + getGuestId(),
      name: '玩家',
      pictureUrl: ''
    };
  }

  function normalizeProfile(profile) {
    return {
      id: profile.userId || profile.id || profile.sub || 'guest-' + getGuestId(),
      name: profile.displayName || profile.name || profile.nickname || '玩家',
      pictureUrl: profile.pictureUrl || profile.picture || profile.avatar || ''
    };
  }

  function getGuestId() {
    let id = loadText('zg_guest_id', '');

    if (!id) {
      id = String(Date.now()) + '-' + Math.floor(Math.random() * 100000);
      saveText('zg_guest_id', id);
    }

    return id;
  }

  function saveMyRankScore(score) {
    const profile = getMyProfile();
    const ranks = loadJson(STORAGE.realFriendRanks, []);

    const clean = Array.isArray(ranks) ? ranks.filter(item => {
      return item && item.userId !== profile.id;
    }) : [];

    clean.push({
      userId: profile.id,
      name: profile.name || '玩家',
      pictureUrl: profile.pictureUrl || '',
      score: Number(score) || 0,
      result: state.lastResult || '',
      coupon: state.lastCoupon || '',
      updatedAt: new Date().toISOString()
    });

    clean.sort((a, b) => {
      return Number(b.score || 0) - Number(a.score || 0);
    });

    saveJson(STORAGE.realFriendRanks, clean.slice(0, 50));
  }

  function renderFriendRanks() {
    const list = byId('zg-friend-rank-list');
    if (!list) return;

    const ranks = loadJson(STORAGE.realFriendRanks, []);
    const clean = Array.isArray(ranks) ? ranks.slice(0, 10) : [];

    if (!clean.length) {
      list.innerHTML = '<div class="zg-rank-empty">完成挑戰後，好友排行會顯示在這裡。</div>';
      return;
    }

    list.innerHTML = clean.map((item, index) => {
      const name = escapeHtml(item.name || '玩家');
      const score = escapeHtml(item.score || 0);
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : String(index + 1);

      return [
        '<div class="zg-rank-row">',
        '  <div class="zg-rank-no">' + medal + '</div>',
        '  <div class="zg-rank-user">',
        item.pictureUrl ? '    <img class="zg-rank-avatar" src="' + escapeHtml(item.pictureUrl) + '" alt="">' : '    <div class="zg-rank-avatar zg-rank-avatar-empty">🌀</div>',
        '    <span>' + name + '</span>',
        '  </div>',
        '  <div class="zg-rank-score">' + score + '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  /*
   * =========================================================
   * 13. SHARE
   * =========================================================
   */

  function shareGame() {
    const text = '我剛剛在 ZELO BATTLE 拿到 ' + (state.lastScore || loadText(STORAGE.lastScore, 0)) + ' 分！你也來挑戰看看！';
    const url = location.href.split('#')[0];

    if (window.liff && window.liff.shareTargetPicker) {
      try {
        window.liff.shareTargetPicker([
          {
            type: 'text',
            text: text + '\n' + url
          }
        ]).then(() => {
          toast('已開啟分享');
        }).catch(() => {
          fallbackShare(text, url);
        });
        return;
      } catch (err) {
        fallbackShare(text, url);
        return;
      }
    }

    fallbackShare(text, url);
  }

  function fallbackShare(text, url) {
    const message = text + '\n' + url;

    if (navigator.share) {
      navigator.share({
        title: 'ZELO BATTLE',
        text: text,
        url: url
      }).catch(() => {
        copyShareText(message);
      });
    } else {
      copyShareText(message);
    }
  }

  function copyShareText(message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        toast('已複製邀請文字');
      }).catch(() => {
        fallbackCopy(message);
      });
    } else {
      fallbackCopy(message);
    }
  }


  /*
   * =========================================================
   * 14. ACTION ROUTER
   * =========================================================
   */

  function handleAction(action) {
    switch (action) {
      case ACTIONS.start:
        goSelect();
        break;

      case ACTIONS.home:
        goHome();
        break;

      case ACTIONS.select:
        goSelect();
        break;

      case ACTIONS.battle:
        goBattle();
        break;

      case ACTIONS.retry:
        goBattle();
        break;

      case ACTIONS.share:
        shareGame();
        break;

      case ACTIONS.copyCoupon:
        copyCoupon();
        break;

      case ACTIONS.downloadCoupon:
        copyCoupon();
        break;

      default:
        break;
    }
  }


  /*
   * =========================================================
   * 15. EVENTS
   * =========================================================
   */

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const actionEl = event.target.closest('[data-zg-action]');

      if (actionEl) {
        event.preventDefault();
        handleAction(actionEl.getAttribute('data-zg-action'));
        return;
      }

      const topCard = event.target.closest('[data-top-id]');

      if (topCard) {
        event.preventDefault();
        selectTop(topCard.getAttribute('data-top-id'));
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.code === 'Space' && state.currentScreen === 'battle') {
        event.preventDefault();

        if (!state.battleRunning && !state.charging) {
          beginCharge();
        } else if (state.charging) {
          releaseCharge();
        }
      }
    });

    window.addEventListener('resize', function () {
      document.documentElement.style.setProperty('--zg-vh', window.innerHeight + 'px');
    });
  }


  /*
   * =========================================================
   * 16. BOOT
   * =========================================================
   */

  function boot() {
    ensureBasicDom();
    ensureStartDom();
    ensureSelectScreenDom();
    ensureBattleDom();
    ensureResultDom();

    const savedTop = loadText(STORAGE.selectedTop, 'balance');
    state.selectedTopId = savedTop;
    state.selectedTop = TOPS.find(item => item.id === savedTop) || TOPS[3];

    const savedCoupon = loadJson(STORAGE.lastCoupon, null);

    if (savedCoupon) {
      state.lastCouponReward = savedCoupon;
      state.lastCoupon = savedCoupon.code || '';
    }

    renderTopList();
    renderFriendRanks();
    bindEvents();

    showScreen('start');

    document.documentElement.style.setProperty('--zg-vh', window.innerHeight + 'px');

    window.ZELO_GAME = {
      version: VERSION,
      state: state,
      startBattle: startBattle,
      goHome: goHome,
      goSelect: goSelect,
      goBattle: goBattle,
      goResult: goResult,
      copyCoupon: copyCoupon,
      syncScoreToGoogle: syncScoreToGoogle
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
