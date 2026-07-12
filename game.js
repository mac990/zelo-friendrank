/*!
 * =========================================================
 * ZELO LIFF BEYBLADE GAME
 * game.js
 * Version: 202607130218
 *
 * Important:
 * - Friend rank shows REAL FRIENDS ONLY.
 * - No fake / seeded friends.
 * - Result page layout is preserved.
 * - Supports copy coupon and download coupon.
 * =========================================================
 */

(function () {
  'use strict';

  /*
   * =========================================================
   * 01. CONFIG
   * =========================================================
   */

  const VERSION = '202607130218';

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
      const btn = createEl('button', 'zg-btn zg-btn-gold', '複製折扣碼');
      btn.id = 'zg-download-coupon';
      btn.type = 'button';
      btn.hidden = true;
      btn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
      main.appendChild(btn);
    }

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
    }, 280);
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

    const distance = getDistance(state.playerPos, state.enemyPos);

    if (distance < 13) {
      handleCollision();
    }

    applyStaminaDrain();

    updateBattleVisuals();
    updateHpBars();

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

    const center = { x: 50, y: 50 };
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 43;

    if (dist > radius) {
      const nx = dx / dist;
      const ny = dy / dist;

      pos.x = center.x + nx * radius;
      pos.y = center.y + ny * radius;

      const dot = vel.x * nx + vel.y * ny;

      vel.x = (vel.x - 2 * dot * nx) * 0.92;
      vel.y = (vel.y - 2 * dot * ny) * 0.92;

      if (Math.random() < 0.28) {
        damage(who, rand(1.2, 3.8));
        updateCommentary(who === 'player' ? '你的陀螺撞到外圈，穩住！' : '對手撞上外圈，露出破綻！');
      }
    }

    vel.x *= 0.996;
    vel.y *= 0.996;

    const minSpeed = 0.22;

    if (Math.abs(vel.x) < minSpeed) {
      vel.x += rand(-0.12, 0.12);
    }

    if (Math.abs(vel.y) < minSpeed) {
      vel.y += rand(-0.12, 0.12);
    }
  }

  function handleCollision() {
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    const playerAttack = top.attack * rand(0.07, 0.13) * state.launchPower;
    const enemyAttack = enemy.attack * rand(0.065, 0.12);

    const playerDamage = Math.max(1, enemyAttack - top.defense * rand(0.025, 0.05));
    const enemyDamage = Math.max(1, playerAttack - enemy.defense * rand(0.025, 0.05));

    damage('player', playerDamage);
    damage('enemy', enemyDamage);

    const px = (state.playerPos.x + state.enemyPos.x) / 2;
    const py = (state.playerPos.y + state.enemyPos.y) / 2;

    spawnHitFx(px, py);
    flashBattle();

    bounceAfterCollision();

    const playerEl = byId('zg-player-top');
    const enemyEl = byId('zg-enemy-top');

    if (playerEl) {
      playerEl.classList.add('is-hit');
      setTimeout(() => playerEl.classList.remove('is-hit'), 220);
    }

    if (enemyEl) {
      enemyEl.classList.add('is-hit');
      setTimeout(() => enemyEl.classList.remove('is-hit'), 220);
    }

    if (enemyDamage > playerDamage) {
      updateCommentary('漂亮撞擊！你造成了更大的傷害！');
    } else if (playerDamage > enemyDamage) {
      updateCommentary('對手反擊成功，你的陀螺受到衝擊！');
    } else {
      updateCommentary('雙方正面碰撞，火花四射！');
    }
  }

  function bounceAfterCollision() {
    const dx = state.playerPos.x - state.enemyPos.x;
    const dy = state.playerPos.y - state.enemyPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const nx = dx / dist;
    const ny = dy / dist;

    state.playerVel.x = nx * rand(0.8, 1.45);
    state.playerVel.y = ny * rand(0.8, 1.45);

    state.enemyVel.x = -nx * rand(0.8, 1.45);
    state.enemyVel.y = -ny * rand(0.8, 1.45);

    state.playerPos.x += nx * 2.2;
    state.playerPos.y += ny * 2.2;

    state.enemyPos.x -= nx * 2.2;
    state.enemyPos.y -= ny * 2.2;
  }

  function applyStaminaDrain() {
    const top = state.selectedTop || TOPS[3];
    const enemy = state.enemy || ENEMIES[0];

    const playerDrain = 0.045 * (110 - top.stamina) / 40;
    const enemyDrain = 0.045 * (110 - enemy.stamina) / 40;

    state.playerHp = Math.max(0, state.playerHp - playerDrain);
    state.enemyHp = Math.max(0, state.enemyHp - enemyDrain);
  }

  function damage(who, amount) {
    const value = Math.max(0, amount);

    if (who === 'player') {
      state.playerHp = Math.max(0, state.playerHp - value);
      spawnDamageText(state.playerPos.x, state.playerPos.y, '-' + Math.round(value));
    } else {
      state.enemyHp = Math.max(0, state.enemyHp - value);
      spawnDamageText(state.enemyPos.x, state.enemyPos.y, '-' + Math.round(value));
    }
  }

  function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /*
   * =========================================================
   * 10. BATTLE VISUALS
   * =========================================================
   */

  function updateBattleVisuals() {
    const player = byId('zg-player-top');
    const enemy = byId('zg-enemy-top');

    const top = state.selectedTop || TOPS[3];
    const enemyData = state.enemy || ENEMIES[0];

    if (player) {
      player.style.left = state.playerPos.x + '%';
      player.style.top = state.playerPos.y + '%';

      const span = $('span', player);
      if (span) span.textContent = top.icon || '🌀';
    }

    if (enemy) {
      enemy.style.left = state.enemyPos.x + '%';
      enemy.style.top = state.enemyPos.y + '%';

      const span = $('span', enemy);
      if (span) span.textContent = enemyData.icon || '🔥';
    }
  }

  function updateHpBars() {
    const playerFill = byId('zg-player-hp');
    const enemyFill = byId('zg-enemy-hp');
    const playerText = byId('zg-player-hp-text');
    const enemyText = byId('zg-enemy-hp-text');

    const playerPct = clamp((state.playerHp / state.playerMaxHp) * 100, 0, 100);
    const enemyPct = clamp((state.enemyHp / state.enemyMaxHp) * 100, 0, 100);

    if (playerFill) {
      playerFill.style.width = playerPct + '%';
      playerFill.classList.toggle('is-low', playerPct <= 24);
    }

    if (enemyFill) {
      enemyFill.style.width = enemyPct + '%';
      enemyFill.classList.toggle('is-low', enemyPct <= 24);
    }

    if (playerText) {
      playerText.textContent = Math.ceil(Math.max(0, state.playerHp));
    }

    if (enemyText) {
      enemyText.textContent = Math.ceil(Math.max(0, state.enemyHp));
    }
  }

  function updateCommentary(text) {
    const el = $('.zg-commentary');
    if (!el) return;

    el.textContent = text;

    el.classList.add('is-hit');

    setTimeout(() => {
      el.classList.remove('is-hit');
    }, 240);
  }

  function flashBattle() {
    const el = $('.zg-flash-overlay');
    if (!el) return;

    el.classList.remove('is-flashing');
    void el.offsetWidth;
    el.classList.add('is-flashing');
  }

  function spawnHitFx(x, y) {
    const box = $('.zg-battle-box');
    if (!box) return;

    const spark = createEl('div', 'zg-hit-spark');
    spark.style.left = x + '%';
    spark.style.top = y + '%';
    box.appendChild(spark);

    const wave = createEl('div', 'zg-shockwave');
    wave.style.left = x + '%';
    wave.style.top = y + '%';
    box.appendChild(wave);

    setTimeout(() => {
      spark.remove();
      wave.remove();
    }, 760);
  }

  function spawnDamageText(x, y, text) {
    const box = $('.zg-battle-box');
    if (!box) return;

    const el = createEl('div', 'zg-damage-text', escapeHtml(text));
    el.style.left = x + '%';
    el.style.top = y + '%';
    box.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 820);
  }

  function stopBattle(silent) {
    clearInterval(state.battleTimer);
    clearInterval(state.chargeTimer);

    state.battleTimer = null;
    state.chargeTimer = null;
    state.battleRunning = false;
    state.charging = false;

    if (!silent) {
      const layer = $('.zg-charge-layer');
      if (layer) {
        layer.hidden = true;
        layer.classList.remove('is-charging');
      }
    }
  }

  function finishBattle() {
    if (!state.battleRunning) return;

    stopBattle(true);

    const player = byId('zg-player-top');
    const enemy = byId('zg-enemy-top');

    const win =
      state.enemyHp <= 0 ||
      (state.playerHp > state.enemyHp && state.playerHp > 0);

    if (win) {
      if (enemy) enemy.classList.add('is-burst');
      updateCommentary('勝利！你的陀螺撐到了最後！');
    } else {
      if (player) player.classList.add('is-burst');
      updateCommentary('惜敗！差一點就能反擊成功！');
    }

    setTimeout(() => {
      if (player) player.classList.remove('is-burst');
      if (enemy) enemy.classList.remove('is-burst');

      buildResult(win);
      goResult();
    }, 720);
  }


  /*
   * =========================================================
   * 11. RESULT
   * =========================================================
   */

  function buildResult(win) {
    ensureResultDom();

    const score = calculateScore(win);
    const coupon = chooseCoupon(win);

    state.lastScore = score;
    state.lastResult = win ? 'win' : 'lose';
    state.lastCoupon = coupon.code;
    state.lastCouponReward = coupon;

    saveText(STORAGE.lastScore, score);
    saveText(STORAGE.lastResult, state.lastResult);
    saveJson(STORAGE.lastCoupon, coupon);

    saveMyRankScore(score);

    updateResultContent(win, score, coupon);
    renderFriendRanks();
  }

  function calculateScore(win) {
    const top = state.selectedTop || TOPS[3];

    const hpBonus = Math.round(clamp(state.playerHp, 0, state.playerMaxHp) * 8);
    const enemyLost = Math.round((state.enemyMaxHp - clamp(state.enemyHp, 0, state.enemyMaxHp)) * 7);
    const powerBonus = Math.round(state.launchPower * 220);
    const typeBonus = Math.round((top.attack + top.defense + top.stamina + top.speed) * 0.9);
    const winBonus = win ? 1200 : 360;

    return Math.max(100, winBonus + hpBonus + enemyLost + powerBonus + typeBonus + randInt(20, 120));
  }

  function chooseCoupon(win) {
    const list = win ? COUPONS.win : COUPONS.lose;
    return pick(list);
  }

  function updateResultContent(win, score, coupon) {
    const rank = byId('zg-result-rank');
    const title = byId('zg-result-title');
    const desc = byId('zg-result-desc') || byId('zg-result-subtitle');

    const label = byId('zg-coupon-label');
    const code = byId('zg-coupon-code') || byId('zg-result-score');
    const note = byId('zg-coupon-note');

    if (rank) {
      rank.textContent = win ? 'W' : 'L';
      rank.classList.toggle('is-lose', !win);
    }

    if (title) {
      title.textContent = win ? '勝利！取得專屬獎勵' : '惜敗！仍獲得挑戰獎勵';
    }

    if (desc) {
      desc.textContent = '本次分數：' + score + ' 分';
    }

    if (label) {
      label.textContent = coupon.label;
    }

    if (code) {
      code.textContent = coupon.code;
    }

    if (note) {
      note.textContent = coupon.note || '結帳時輸入折扣碼即可使用。';
    }

    setupResultButtons(coupon);
  }

  function setupResultButtons(coupon) {
    /*
     * 重要：
     * 這裡不重建整個結果頁 DOM。
     * 只補必要按鈕，不刪除原本按鈕。
     */

    const screen = byId(SCREENS.result);
    if (!screen) return;

    let bottom = $('.zg-bottom', screen);

    if (!bottom) {
      bottom = createEl('div', 'zg-bottom');
      screen.appendChild(bottom);
    }

    let actions = $('.zg-result-actions', bottom);

    if (!actions) {
      actions = createEl('div', 'zg-result-actions');
      bottom.appendChild(actions);
    }

    ensureActionButton(actions, '再玩一次', 'zg-btn zg-btn-red zg-action-retry', ACTIONS.retry);
    ensureActionButton(actions, '重新選擇', 'zg-btn zg-btn-blue zg-action-select', ACTIONS.select);
    ensureActionButton(actions, '分享好友', 'zg-btn zg-btn-green zg-action-share', ACTIONS.share);
    ensureActionButton(actions, '回首頁', 'zg-btn zg-btn-white zg-action-home', ACTIONS.home);

    let copyBtn = byId('zg-download-coupon');

    if (copyBtn) {
      copyBtn.hidden = false;
      copyBtn.textContent = '複製折扣碼：' + coupon.code;
      copyBtn.setAttribute('data-zg-action', ACTIONS.copyCoupon);
    }

    let imgBtn = byId('zg-save-coupon-image');

    if (!imgBtn) {
      imgBtn = createEl('button', 'zg-coupon-download');
      imgBtn.id = 'zg-save-coupon-image';
      imgBtn.type = 'button';
      imgBtn.textContent = '下載折扣券圖片';
      imgBtn.setAttribute('data-zg-action', ACTIONS.downloadCoupon);

      const couponBox = byId('zg-coupon');
      if (couponBox && couponBox.parentNode) {
        couponBox.parentNode.insertBefore(imgBtn, couponBox.nextSibling);
      } else {
        actions.parentNode.insertBefore(imgBtn, actions);
      }
    }
  }

  function ensureActionButton(parent, text, className, action) {
    let btn = $('[data-zg-action="' + action + '"]', parent);

    if (!btn) {
      btn = createEl('button', className, '<span>' + escapeHtml(text) + '</span>');
      btn.type = 'button';
      btn.setAttribute('data-zg-action', action);
      parent.appendChild(btn);
    } else {
      btn.className = className;
      btn.innerHTML = '<span>' + escapeHtml(text) + '</span>';
      btn.type = 'button';
    }

    return btn;
  }


  /*
   * =========================================================
   * 12. FRIEND RANKS - REAL FRIENDS ONLY
   * =========================================================
   */

  function saveMyRankScore(score) {
    const profile = getMyProfile();

    const me = {
      id: profile.id,
      name: profile.name,
      pictureUrl: profile.pictureUrl || '',
      score: Number(score) || 0,
      updatedAt: new Date().toISOString(),
      isMe: true
    };

    saveJson(STORAGE.profile, profile);

    const ranks = loadRealFriendRanks();

    const withoutMe = ranks.filter(item => item.id !== me.id);

    withoutMe.push(me);

    const sorted = sortRanks(withoutMe).slice(0, 50);

    saveJson(STORAGE.realFriendRanks, sorted);
  }

  function getMyProfile() {
    /*
     * 優先使用外部已注入的真實 LIFF profile。
     * 例如你可以在 Liquid / theme 內塞：
     * window.ZELO_LIFF_PROFILE = { userId, displayName, pictureUrl }
     */

    const external =
      window.ZELO_LIFF_PROFILE ||
      window.zeloLiffProfile ||
      window.zgProfile ||
      null;

    if (external) {
      return normalizeProfile(external, true);
    }

    const saved = loadJson(STORAGE.profile, null);

    if (saved && saved.id) {
      return normalizeProfile(saved, true);
    }

    /*
     * 這不是假好友，只是玩家自己的本機暱稱。
     * 如果沒有 LIFF profile，就顯示「你」。
     */

    return {
      id: 'me-local',
      name: '你',
      pictureUrl: '',
      isMe: true
    };
  }

  function normalizeProfile(raw, isMe) {
    const id =
      raw.userId ||
      raw.id ||
      raw.lineUserId ||
      raw.sub ||
      (isMe ? 'me-local' : '');

    const name =
      raw.displayName ||
      raw.name ||
      raw.nickname ||
      raw.userName ||
      (isMe ? '你' : '好友');

    const pictureUrl =
      raw.pictureUrl ||
      raw.avatar ||
      raw.avatarUrl ||
      raw.image ||
      '';

    return {
      id: String(id || (isMe ? 'me-local' : '')),
      name: String(name || (isMe ? '你' : '好友')),
      pictureUrl: String(pictureUrl || ''),
      isMe: !!isMe
    };
  }

  function loadRealFriendRanks() {
    /*
     * 真實好友來源，照順序讀取：
     *
     * 1. window.ZELO_REAL_FRIEND_RANKS
     * 2. window.zeloRealFriendRanks
     * 3. window.zgRealFriendRanks
     * 4. localStorage zg_real_friend_ranks
     *
     * 注意：
     * 這裡不會產生任何假朋友。
     */

    const external =
      window.ZELO_REAL_FRIEND_RANKS ||
      window.zeloRealFriendRanks ||
      window.zgRealFriendRanks ||
      null;

    if (Array.isArray(external)) {
      const normalized = external
        .map(item => normalizeRankItem(item))
        .filter(item => item && item.id && item.name && Number.isFinite(item.score));

      const me = getMyProfile();
      const saved = loadJson(STORAGE.realFriendRanks, []);

      const savedMe = Array.isArray(saved)
        ? saved.find(item => item && item.id === me.id)
        : null;

      if (savedMe && !normalized.some(item => item.id === me.id)) {
        normalized.push(normalizeRankItem(savedMe));
      }

      return sortRanks(normalized);
    }

    const savedRanks = loadJson(STORAGE.realFriendRanks, []);

    if (!Array.isArray(savedRanks)) {
      return [];
    }

    return sortRanks(
      savedRanks
        .map(item => normalizeRankItem(item))
        .filter(item => item && item.id && item.name && Number.isFinite(item.score))
    );
  }

  function normalizeRankItem(raw) {
    if (!raw) return null;

    const profile = normalizeProfile(raw, !!raw.isMe);

    const score = Number(
      raw.score != null
        ? raw.score
        : raw.bestScore != null
          ? raw.bestScore
          : raw.points
    );

    if (!profile.id || !Number.isFinite(score)) {
      return null;
    }

    return {
      id: profile.id,
      name: profile.name,
      pictureUrl: profile.pictureUrl,
      score: Math.max(0, Math.round(score)),
      updatedAt: raw.updatedAt || raw.time || '',
      isMe: !!raw.isMe
    };
  }

  function sortRanks(list) {
    return list
      .slice()
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.name).localeCompare(String(b.name), 'zh-Hant');
      });
  }

  function renderFriendRanks() {
    const listEl = byId('zg-friend-rank-list');
    if (!listEl) return;

    const ranks = loadRealFriendRanks();
    const me = getMyProfile();

    const friendRanksOnly = ranks.filter(item => {
      /*
       * 規則：
       * - 不顯示任何假朋友
       * - 只顯示真實來源的外部好友 + 自己
       * - 如果只有自己，就只顯示自己或空狀態
       */
      return item && item.id && item.name && Number.isFinite(item.score);
    });

    if (!friendRanksOnly.length) {
      listEl.innerHTML = [
        '<div class="zg-rank-empty">',
        '目前尚無好友排行資料。<br>',
        '邀請好友完成挑戰後，這裡才會出現真實好友分數。',
        '</div>'
      ].join('');
      return;
    }

    const sorted = sortRanks(friendRanksOnly).slice(0, 10);

    listEl.innerHTML = sorted.map((item, index) => {
      const isMe = item.id === me.id || item.isMe;
      const safeName = escapeHtml(isMe ? item.name + '（你）' : item.name);

      return [
        '<div class="zg-rank-row' + (isMe ? ' is-me' : '') + '">',
        '  <div class="zg-rank-num">' + (index + 1) + '</div>',
        '  <div class="zg-rank-name">' + safeName + '</div>',
        '  <div class="zg-rank-score">' + Math.round(item.score) + '</div>',
        '</div>'
      ].join('');
    }).join('');
  }


  /*
   * =========================================================
   * 13. COUPON ACTIONS
   * =========================================================
   */

  function copyCoupon() {
    const coupon =
      state.lastCoupon ||
      (state.lastCouponReward && state.lastCouponReward.code) ||
      (loadJson(STORAGE.lastCoupon, {}) || {}).code ||
      '';

    if (!coupon) {
      toast('目前沒有可複製的折扣碼');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(coupon)
        .then(() => {
          toast('已複製折扣碼：' + coupon);
        })
        .catch(() => {
          fallbackCopy(coupon);
        });
    } else {
      fallbackCopy(coupon);
    }
  }

  function fallbackCopy(text) {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '0';

    document.body.appendChild(input);
    input.select();

    try {
      document.execCommand('copy');
      toast('已複製折扣碼：' + text);
    } catch (err) {
      toast('複製失敗，請手動複製：' + text);
    }

    input.remove();
  }

  function downloadCouponImage() {
    const coupon =
      state.lastCouponReward ||
      loadJson(STORAGE.lastCoupon, null);

    if (!coupon || !coupon.code) {
      toast('目前沒有可下載的折扣券');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1350;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#fff5b8');
      gradient.addColorStop(0.45, '#ffd650');
      gradient.addColorStop(1, '#ff9f1c');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      drawCouponBg(ctx, width, height);
      drawCenteredText(ctx, 'ZELO BATTLE', width / 2, 168, 76, '#2a1600', '900');
      drawCenteredText(ctx, coupon.title || '專屬折扣券', width / 2, 292, 62, '#2a1600', '900');

      drawRoundedRect(ctx, 130, 420, width - 260, 300, 44, 'rgba(255,255,255,0.48)');
      drawCenteredText(ctx, coupon.label || '你的折扣碼', width / 2, 515, 38, 'rgba(42,22,0,0.72)', '800');
      drawCenteredText(ctx, coupon.code, width / 2, 625, 92, '#2a1600', '1000');

      drawCenteredText(ctx, coupon.note || '結帳時輸入折扣碼即可使用', width / 2, 820, 36, 'rgba(42,22,0,0.74)', '700');
      drawCenteredText(ctx, '截圖或下載保存，購物時使用。', width / 2, 890, 30, 'rgba(42,22,0,0.62)', '700');

      drawRoundedRect(ctx, 160, 1010, width - 320, 132, 66, '#2a1600');
      drawCenteredText(ctx, '立即使用折扣碼', width / 2, 1092, 44, '#ffd650', '900');

      drawCenteredText(ctx, 'Generated by ZELO LIFF Game', width / 2, 1245, 26, 'rgba(42,22,0,0.48)', '700');

      const link = document.createElement('a');
      link.download = 'zelo-coupon-' + coupon.code + '.png';
      link.href = canvas.toDataURL('image/png');

      document.body.appendChild(link);
      link.click();
      link.remove();

      toast('折扣券圖片已下載');
    } catch (err) {
      toast('下載失敗，請改用截圖保存');
    }
  }

  function drawCouponBg(ctx, width, height) {
    ctx.save();

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < 22; i += 1) {
      const x = rand(0, width);
      const y = rand(0, height);
      const r = rand(8, 38);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#2a1600';
    ctx.lineWidth = 4;

    for (let j = 0; j < 9; j += 1) {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 150 + j * 58, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawCenteredText(ctx, text, x, y, size, color, weight) {
    ctx.save();

    ctx.fillStyle = color;
    ctx.font = String(weight || '800') + ' ' + size + 'px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(String(text || ''), x, y);

    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, w, h, r, fillStyle) {
    const radius = Math.min(r, w / 2, h / 2);

    ctx.save();
    ctx.fillStyle = fillStyle;

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }


  /*
   * =========================================================
   * 14. SHARE
   * =========================================================
   */

  function shareResult() {
    const score = state.lastScore || Number(loadText(STORAGE.lastScore, 0)) || 0;
    const coupon =
      state.lastCoupon ||
      (loadJson(STORAGE.lastCoupon, {}) || {}).code ||
      '';

    const text = [
      '我剛剛在 ZELO BATTLE 拿到 ' + score + ' 分！',
      coupon ? '折扣碼：' + coupon : '',
      '快來挑戰看看你的分數！'
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      navigator.share({
        title: 'ZELO BATTLE',
        text: text,
        url: location.href
      }).catch(() => {
        copyShareText(text);
      });
    } else {
      copyShareText(text);
    }
  }

  function copyShareText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast('分享文字已複製');
        })
        .catch(() => {
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  }


  /*
   * =========================================================
   * 15. EVENTS
   * =========================================================
   */

  function bindEvents() {
    const app = root();
    if (!app || app.__zgBound) return;

    app.__zgBound = true;

    app.addEventListener('click', function (event) {
      const topCard = event.target.closest('.zg-top-card');

      if (topCard && app.contains(topCard)) {
        const topId = topCard.getAttribute('data-top-id');
        if (topId) selectTop(topId);
        return;
      }

      const actionEl = event.target.closest('[data-zg-action]');

      if (!actionEl || !app.contains(actionEl)) return;

      const action = actionEl.getAttribute('data-zg-action');

      handleAction(action, actionEl, event);
    });

    document.addEventListener('keydown', function (event) {
      if (state.currentScreen !== 'battle') return;

      if (event.code === 'Space') {
        event.preventDefault();

        if (!state.battleRunning && !state.charging && !$('.zg-charge-layer')?.hidden) {
          beginCharge();
        }
      }
    });

    document.addEventListener('keyup', function (event) {
      if (state.currentScreen !== 'battle') return;

      if (event.code === 'Space') {
        event.preventDefault();

        if (state.charging) {
          releaseCharge();
        }
      }
    });

    window.addEventListener('pagehide', function () {
      stopBattle(false);
    });
  }

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
      case ACTIONS.retry:
        goBattle();
        break;

      case ACTIONS.share:
        shareResult();
        break;

      case ACTIONS.copyCoupon:
        copyCoupon();
        break;

      case ACTIONS.downloadCoupon:
        downloadCouponImage();
        break;

      default:
        break;
    }
  }


  /*
   * =========================================================
   * 16. INIT
   * =========================================================
   */

  function init() {
    ensureBasicDom();
    ensureStartDom();
    ensureSelectScreenDom();
    ensureSelectDom();
    ensureBattleDom();
    ensureResultDom();

    state.selectedTopId = loadText(STORAGE.selectedTop, 'balance');
    state.selectedTop = TOPS.find(item => item.id === state.selectedTopId) || TOPS[3];

    renderTopList();
    renderFriendRanks();
    bindEvents();

    const initial =
      byId(SCREENS.start)?.classList.contains('active') ? 'start' :
      byId(SCREENS.select)?.classList.contains('active') ? 'select' :
      byId(SCREENS.battle)?.classList.contains('active') ? 'battle' :
      byId(SCREENS.result)?.classList.contains('active') ? 'result' :
      'start';

    showScreen(initial);

    window.ZELO_GAME = {
      version: VERSION,
      state: state,
      start: goSelect,
      battle: goBattle,
      home: goHome,
      renderFriendRanks: renderFriendRanks,
      setFriendRanks: function (list) {
        if (Array.isArray(list)) {
          window.ZELO_REAL_FRIEND_RANKS = list;
          saveJson(STORAGE.realFriendRanks, list);
          renderFriendRanks();
        }
      },
      setProfile: function (profile) {
        if (profile) {
          window.ZELO_LIFF_PROFILE = profile;
          saveJson(STORAGE.profile, normalizeProfile(profile, true));
          renderFriendRanks();
        }
      },
      copyCoupon: copyCoupon,
      downloadCouponImage: downloadCouponImage
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
