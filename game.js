/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607210148-result-intro-integrated
 *
 * Structure:
 * 01. CORE / 共用設定與資料
 * 02. HELPERS / 共用工具、Profile、API、Referral
 * 03. AUDIO / 音效模組、首頁音樂
 * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
 * 05. HOME PAGE / 首頁
 * 06. TOP SELECT PAGE / 選擇陀螺頁面
 * 07. LAUNCH / CHARGE PAGE / 準備發射與蓄力
 * 08. BATTLE PAGE / 陀螺戰鬥頁面
 * 09. RESULT PAGE / 結果頁、同步、排行榜、結果動畫
 * 10. DAILY / LIFF / TRACKING / EVENTS / BOOT / EXPOSE API
 *
 * Rules:
 * - 保留目前美術 class
 * - 保留蓄力發射
 * - 保留戰鬥物理
 * - 保留碰撞扣血 / 扣 energy 規則
 * - 牆壁反彈不扣 HP / energy
 * - 只有陀螺碰撞扣 energy
 * - energy 歸零即停止並判定敗北
 * - 不因轉速歸零、時間到、中央決勝提前結束
 * - 補上 dashboard 事件追蹤
 * - 修正重複蓄力 UI：只保留 battle panel launch row
 * - CSS 已抽離至 game.css
 * - JS 不再注入大段 CSS，只輸出 CSS 變數與必要 inline 保險
 * - 戰鬥能量條會跟 HP / 轉速 / 速度聯動
 * - 碰撞震動、火花、衝擊環加強
 * - 戰鬥陀螺尺寸放大
 * - 戰鬥音樂支援播放、淡出停止、Debug API
 * - 戰鬥結束支援 MP4 結果動畫，動畫後進入結果頁
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const VERSION = "202607210327-js-css-aligned";

  console.log("[ZELO GAME] version:", VERSION);

  /*
   * 防止 Shopify / theme / section 重複載入同一版 game.js。
   * 注意：這段在 IIFE 內，所以用 return 可以直接停止本次載入。
   */
  if (
    window.__ZELO_GAME_ACTIVE_VERSION === VERSION &&
    window.ZELO_GAME &&
    typeof window.ZELO_GAME.getState === "function"
  ) {
    console.warn("[ZELO GAME] duplicate script ignored:", VERSION);
    return;
  }

  window.__ZELO_GAME_ACTIVE_VERSION = VERSION;
  window.__ZELO_GAME_LOAD_COUNT = Number(window.__ZELO_GAME_LOAD_COUNT || 0) + 1;

  console.log("[ZELO GAME] load count:", window.__ZELO_GAME_LOAD_COUNT);

  /*
   * ---------------------------------------------------------
   * 01-1. Feature Flags / 功能開關
   * ---------------------------------------------------------
   */

  const ENABLE_RESULT_INTRO_VIDEO = true;

  const RESULT_INTRO_VIDEO_URL =
    "https://cdn.shopify.com/videos/c/o/v/2b910a2cab014a1f96b4fbcb76383294.mp4";

  /*
   * ---------------------------------------------------------
   * 01-2. Assets / 素材 URL
   * ---------------------------------------------------------
   */

  const DEFAULT_TOP_IMAGE =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=202607170240";

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const EXTERNAL_TOP_PHOTO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";

  const HOME_VIDEO_URL =
    "https://cdn.shopify.com/videos/c/o/v/189e5c4617d143c793cd0844a727366f.mp4";

  const HOME_POSTER_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg-line.jpg?v=1784121251";

  const HOME_MUSIC_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Lyria_3_Clip.mp3?v=1784133785";

  const BATTLE_MUSIC_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Lyria_3_Clip.mp3?v=1784133785";

  /*
   * ---------------------------------------------------------
   * 01-3. Charge / 蓄力設定
   * ---------------------------------------------------------
   */

  const CHARGE = {
    weakMax: 0.45,
    normalMin: 0.45,
    goodMin: 0.72,

    /*
     * 完美區：
     * 對應 CSS 的螢光綠色小區域。
     * 87.5% ~ 90.5% 才是 Perfect。
     * 超過 90.5% 就是 Over。
     */
    perfectMin: 0.875,
    perfectMax: 0.905,
    overMin: 0.905,

    speed: 0.012
  };

  /*
   * ---------------------------------------------------------
   * 01-4. Daily Limit / 每日限制
   * ---------------------------------------------------------
   */

  const DAILY_LIMIT = 9999;

  /*
   * ---------------------------------------------------------
   * 01-5. Storage Keys / 儲存 Key
   * ---------------------------------------------------------
   */

  const STORAGE = {
    selectedType: "zelo_selected_top_type",
    myScore: "zelo_my_score",
    friends: "zelo_friend_rank",
    profile: "zg_profile",
    lastResult: "zg_last_result",
    lastCoupon: "zg_last_coupon",
    dailyPrefix: "zg_daily_play_"
  };

  const LINE_INVITE_FRIEND_COUNT_KEY = "zg_line_invite_friend_count";

  const REFERRAL = {
    codeKey: "zg_referral_code",
    inviterCodeKey: "zg_inviter_referral_code",
    registeredKeyPrefix: "zg_ref_registered_",
    countFallbackKey: "zg_referral_success_count"
  };

  /*
   * ---------------------------------------------------------
   * 01-6. Physics / 戰鬥物理設定
   * ---------------------------------------------------------
   */

  const PHY = {
    radius: 42,
    ringPadding: 42,

    initialSpeed: 9.6,
    launchSpeed: 9.6,
    maxSpeed: 18.5,

    friction: 0.9986,
    spinDecay: 0.9972,
    spinDrain: 0.32,

    wallRestitution: 0.96,
    wallBounce: 0.96,

    hitRestitution: 0.88,
    restitution: 0.88,

    energyDamageScale: 1.9,
    damageScale: 0.42,

    spinDamageScale: 0.055,
    collisionSpinLoss: 2.1,

    minCollisionEnergy: 0.22,
    maxCollisionDamage: 42,

    collisionCooldown: 46,
    separationBias: 3.2,
    tangentTransfer: 0.085,

    seekForceMax: 0.045,
    centerPull: 0.045,
    engagePull: 0.06,
    orbitForce: 0.062,
    tangentForce: 0.062,

    hpOnlyFinish: true,

    battleLimit: 9000,
    maxBattleMs: 999999999,
    minMotion: 0.7,
    stopSpinThreshold: 0.055,
    stopSpeedThreshold: 0.45,
    stopGraceMs: 1300,

    spinLossOnEnergy: 0.014,
    railSpinLoss: 0.012,

    /*
     * 自然能量損耗。
     * 由旋轉、速度、晃動造成。
     * 注意：數值建議小一點，避免未碰撞就過快結束。
     */
    naturalEnergyDrain: 0.018,
    spinEnergyDrain: 0.026,
    speedEnergyDrain: 0.012,
    wobbleEnergyDrain: 0.018,

    /*
     * 發射後多少毫秒內，不讓自然損耗致死。
     */
    naturalKillGraceMs: 1800,

    /*
     * false：自然損耗最多扣到 1，最後一擊要靠碰撞。
     * true：自然損耗可以直接扣到 0 並判敗。
     */
    naturalEnergyCanKill: false
  };

  /*
   * ---------------------------------------------------------
   * 01-7. Finish Rules / 戰鬥終結規則
   * ---------------------------------------------------------
   *
   * 注意：
   * 目前遊戲主分數仍使用 battle score / totalScore。
   * FINISH points 是戰鬥陀螺規則分，保留給後續擴充。
   */

  const FINISH = {
    spin: {
      key: "spin_finish",
      label: "Spin Finish",
      zh: "迴轉終結",
      points: 1
    },
    over: {
      key: "over_finish",
      label: "Over Finish",
      zh: "擊飛戰鬥",
      points: 1
    },
    burst: {
      key: "burst_finish",
      label: "Burst Finish",
      zh: "爆裂終結",
      points: 2
    },
    xtreme: {
      key: "xtreme_finish",
      label: "Xtreme Finish",
      zh: "極限戰鬥",
      points: 3
    },
    draw: {
      key: "draw",
      label: "Draw",
      zh: "平手",
      points: 0
    }
  };

  const BATTLE_FINISH_RULES = {
    spin_finish: {
      key: "spin_finish",
      points: 1,
      winTitle: "迴轉終結！",
      loseTitle: "迴轉敗北",
      label: "迴轉終結"
    },
    over_finish: {
      key: "over_finish",
      points: 1,
      winTitle: "擊飛戰鬥！",
      loseTitle: "擊飛敗北",
      label: "擊飛戰鬥"
    },
    burst_finish: {
      key: "burst_finish",
      points: 2,
      winTitle: "爆裂終結！",
      loseTitle: "爆裂敗北",
      label: "爆裂終結"
    },
    xtreme_finish: {
      key: "xtreme_finish",
      points: 3,
      winTitle: "極限戰鬥！",
      loseTitle: "極限敗北",
      label: "極限戰鬥"
    },
    draw: {
      key: "draw",
      points: 0,
      winTitle: "平手！",
      loseTitle: "平手！",
      label: "平手"
    }
  };

  /*
   * ---------------------------------------------------------
   * 01-8. Coupon Rewards / 優惠券設定
   * ---------------------------------------------------------
   */

  const COUPON_REWARDS = [
    {
      id: "coupon500",
      label: "500 元折扣券",
      amount: 500,
      codePrefix: "ZELO500",
      fixedCode: "ZELO500",
      rate: 0.01
    },
    {
      id: "coupon250",
      label: "250 元折扣券",
      amount: 250,
      codePrefix: "ZELO250",
      fixedCode: "ZELO250",
      rate: 0.29
    },
    {
      id: "coupon100",
      label: "100 元折扣券",
      amount: 100,
      codePrefix: "ZELO100",
      fixedCode: "ZELO100",
      rate: 0.7
    }
  ];

  /*
   * ---------------------------------------------------------
   * 01-9. Tops / 陀螺資料
   * ---------------------------------------------------------
   */

  const TOPS = [
    {
      id: "attack",
      name: "烈焰攻擊型",
      type: "attack",
      typeName: "攻擊型",
      emoji: "🔥",

      /*
       * 選擇頁 / 產品展示圖
       */
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_b1c5de32-8300-416d-b7c1-5083fea27f6d.png?v=1784147189",

      /*
       * 戰鬥中使用的陀螺圖
       */
      battleImage:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/d2.png?v=1784212179",

      power: 96,
      defense: 58,
      stamina: 62,
      speed: 96,
      colorA: "#e60012",
      colorB: "#ffd45a"
    },
    {
      id: "defense",
      name: "鋼鐵防禦型",
      type: "defense",
      typeName: "防禦型",
      emoji: "🛡️",

      /*
       * 選擇頁 / 產品展示圖
       */
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=1784129801",

      /*
       * 戰鬥中使用的陀螺圖
       */
      battleImage:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/d1.png?v=1784212179",

      power: 64,
      defense: 98,
      stamina: 78,
      speed: 52,
      colorA: "#3fa9ff",
      colorB: "#d8f1ff"
    },
    {
      id: "stamina",
      name: "永恆耐久型",
      type: "stamina",
      typeName: "耐久型",
      emoji: "🌿",

      /*
       * 選擇頁 / 產品展示圖
       */
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_8f8d7d00-b8ff-4c2d-b193-e2f32f164723.png?v=1784147188",

      /*
       * 戰鬥中使用的陀螺圖
       */
      battleImage:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/d3.png?v=1784212179",

      power: 62,
      defense: 72,
      stamina: 98,
      speed: 58,
      colorA: "#06c755",
      colorB: "#c7ffd9"
    },
    {
      id: "balance",
      name: "星環平衡型",
      type: "balance",
      typeName: "平衡型",
      emoji: "✨",

      /*
       * 選擇頁 / 產品展示圖
       */
      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_34b25e4e-b5f7-4b0e-8cd4-4fb160caff33.png?v=1784147180",

      /*
       * 戰鬥中使用的陀螺圖
       */
      battleImage:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/d4.png?v=1784212179",

      power: 78,
      defense: 76,
      stamina: 76,
      speed: 76,
      colorA: "#9b5cff",
      colorB: "#57f2ff"
    }
  ];

  /*
   * ---------------------------------------------------------
   * 01-10. Feel / 類型手感參數
   * ---------------------------------------------------------
   */

  const FEEL = {
    attack: {
      label: "攻擊型",
      launchKick: 1.24,
      sparkMul: 1.75,
      hitSharpness: 1.42,
      stability: 0.78,
      friction: 1.08,
      humBase: 155,
      humGain: 1.38,

      attack: 1.35,
      defense: 0.82,
      stamina: 0.86,
      mobility: 1.28
    },
    defense: {
      label: "防禦型",
      launchKick: 0.9,
      sparkMul: 0.9,
      hitSharpness: 0.76,
      stability: 1.48,
      friction: 0.84,
      humBase: 92,
      humGain: 0.88,

      attack: 0.86,
      defense: 1.42,
      stamina: 1.08,
      mobility: 0.82
    },
    stamina: {
      label: "耐久型",
      launchKick: 0.94,
      sparkMul: 0.8,
      hitSharpness: 0.92,
      stability: 1.24,
      friction: 0.68,
      humBase: 118,
      humGain: 0.74,

      attack: 0.9,
      defense: 1.05,
      stamina: 1.45,
      mobility: 0.9
    },
    balance: {
      label: "平衡型",
      launchKick: 1.04,
      sparkMul: 1.05,
      hitSharpness: 1.05,
      stability: 1,
      friction: 1,
      humBase: 122,
      humGain: 1,

      attack: 1,
      defense: 1,
      stamina: 1,
      mobility: 1
    }
  };

  /*
   * ---------------------------------------------------------
   * 01-11. Performance / FX 效能控制
   * ---------------------------------------------------------
   */

  const PERF = {
    lowFx: false,

    lastFxAt: 0,
    lastScratchAt: 0,
    lastAfterimageAt: 0,
    lastMotionTrailAt: 0,
    lastShockwaveAt: 0,
    lastCollisionTrackAt: 0,
    lastHpUiAt: 0,
    lastHpPulseAt: 0,
    lastEnergyUiAt: 0,

    activeFx: 0,

    maxFx: 18,
    maxSparksPerHit: 0,

    minFxGap: 120,
    minScratchGap: 320,
    minAfterimageGap: 320,
    minShockwaveGap: 520,
    minCollisionTrackGap: 900,

    frameSlowCount: 0
  };

  /*
   * ---------------------------------------------------------
   * 01-12. Runtime State / 遊戲狀態
   * ---------------------------------------------------------
   */

  const state = {
    screen: "start",

    profile: null,
    inviterId: "",
    inviterName: "",

    selectedTop: null,
    enemyTop: null,

    battle: null,
    raf: null,
    running: false,
    paused: false,
    lastFrame: 0,

    firstCollision: false,
    killcamPlayed: false,

    lastEffectiveHitAt: 0,
    stuckBoostAt: 0,
    damagePressure: 1,

    finishing: false,
    finishStartedAt: 0,
    pendingResult: null,

    centerDuelStarted: false,
    centerDuelStartedAt: 0,
    centerDuelResolved: false,

    charging: false,
    launchReady: false,
    launchCountdownToken: 0,
    launchPower: 0,
    chargeDir: 1,
    chargeRaf: null,
    chargeUiEls: null,
    chargeStartedAt: 0,
    chargeLastFrameAt: 0,
    lastPerfectSoundAt: 0,

    lastCouponReward: null,
    lastBattleResult: null,

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    lineInviteFriendCount: 0,

    resultLogged: false,

    eventsBound: false,
    booted: false,
    booting: false,
    globalBound: false,

    lastActionAt: 0,
    lastActionKey: ""
  };
  /*
   * =========================================================
   * 02. HELPERS / 共用工具、Profile、API、Referral
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 02-1. DOM / Basic Helpers
   * ---------------------------------------------------------
   */

  const $ = (selector, root = document) => root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  const rand = (min, max) =>
    min + Math.random() * (max - min);

  const now = () => performance.now();

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function safeString(value) {
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function escapeHtml(value) {
    return safeString(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function restartClass(el, cls, duration = 300) {
    if (!el) return;

    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);

    setTimeout(() => {
      el.classList.remove(cls);
    }, duration);
  }

  function shouldIgnoreRepeatedAction(key, gap = 420) {
    const t = now();

    if (state.lastActionKey === key && t - state.lastActionAt < gap) {
      return true;
    }

    state.lastActionKey = key;
    state.lastActionAt = t;

    return false;
  }

  /*
   * ---------------------------------------------------------
   * 02-2. URL Helpers
   * ---------------------------------------------------------
   */

  function getUrlParam(name) {
    try {
      const params = new URLSearchParams(location.search);
      return params.get(name) || "";
    } catch (error) {
      return "";
    }
  }

  function getZeloUrlParam(name) {
    try {
      const targetName = String(name || "");

      if (!targetName) return "";

      const decodeSafe = (value) => {
        let output = String(value || "");

        for (let i = 0; i < 5; i += 1) {
          try {
            const decoded = decodeURIComponent(output);

            if (decoded === output) break;

            output = decoded;
          } catch (error) {
            break;
          }
        }

        return output;
      };

      const readFromQueryText = (queryText) => {
        if (!queryText) return "";

        const text = String(queryText || "");

        const cleanQuery = text.includes("?")
          ? text.slice(text.indexOf("?") + 1)
          : text.replace(/^\?/, "");

        const params = new URLSearchParams(cleanQuery);

        return params.get(targetName) || "";
      };

      const url = new URL(window.location.href);

      /*
       * 1. 先讀最外層 query。
       * 支援：
       * ?ref=ZG_xxx
       */
      const direct = url.searchParams.get(targetName) || "";

      if (direct) {
        return direct;
      }

      /*
       * 2. 遞迴解析 liff.state。
       * 支援：
       * ?liff.state=/?ref=ZG_xxx
       * ?liff.state=?liff.state=/?ref=ZG_xxx
       * ?liff.state=%3Fliff.state%3D%252F%253Fref%253DZG_xxx
       */
      let stateValue =
        url.searchParams.get("liff.state") ||
        url.searchParams.get("state") ||
        "";

      for (let depth = 0; depth < 5; depth += 1) {
        if (!stateValue) break;

        const decodedState = decodeSafe(stateValue);

        const found = readFromQueryText(decodedState);

        if (found) {
          return found;
        }

        const nestedQuery = decodedState.includes("?")
          ? decodedState.slice(decodedState.indexOf("?") + 1)
          : decodedState.replace(/^\?/, "");

        const nestedParams = new URLSearchParams(nestedQuery);

        const nextState =
          nestedParams.get("liff.state") ||
          nestedParams.get("state") ||
          "";

        if (!nextState || nextState === stateValue) {
          break;
        }

        stateValue = nextState;
      }

      return "";
    } catch (error) {
      return "";
    }
  }

  function buildQuery(params = {}) {
    return Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&");
  }

  /*
   * ---------------------------------------------------------
   * 02-3. Daily Helpers
   * ---------------------------------------------------------
   */

  function getTodayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }

  function getDailyKey() {
    return `${STORAGE.dailyPrefix}${getTodayKey()}`;
  }

  function loadDailyLimit() {
    let used = 0;

    try {
      used = Number(localStorage.getItem(getDailyKey()) || 0);
    } catch (error) {
      used = 0;
    }

    state.playsUsed = used;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - used);

    return {
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    };
  }

  function increaseDailyPlay() {
    loadDailyLimit();

    state.playsUsed += 1;
    state.remainingPlays = Math.max(0, DAILY_LIMIT - state.playsUsed);

    try {
      localStorage.setItem(getDailyKey(), String(state.playsUsed));
    } catch (error) {}

    return {
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    };
  }

  function isDailyBlocked() {
    loadDailyLimit();
    return state.remainingPlays <= 0;
  }

  /*
   * ---------------------------------------------------------
   * 02-4. Top / Launch Helpers
   * ---------------------------------------------------------
   */

  function getTopBattleImage(top) {
    return top?.battleImage || top?.image || DEFAULT_TOP_IMAGE;
  }

  function getFeel(top) {
    return FEEL[top?.type] || FEEL.balance;
  }

  function getLaunchGrade(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    /*
     * 注意順序：
     * 先判斷 over。
     * 只要超過 perfectMax，就絕對不是 perfect。
     */
    if (p > CHARGE.perfectMax) {
      return "over";
    }

    /*
     * 只有白色小區塊內才是 perfect。
     */
    if (p >= CHARGE.perfectMin && p <= CHARGE.perfectMax) {
      return "perfect";
    }

    if (p >= CHARGE.goodMin) {
      return "good";
    }

    if (p < CHARGE.weakMax) {
      return "weak";
    }

    return "normal";
  }

  function getLaunchEffectivePower(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    /*
     * 只有白色完美區才是 100% 完美發射。
     */
    if (p >= CHARGE.perfectMin && p <= CHARGE.perfectMax) {
      return 1;
    }

    /*
     * 完美區之前：
     * 由 0 線性爬到接近 99%。
     */
    if (p < CHARGE.perfectMin) {
      return clamp(p / CHARGE.perfectMin, 0, 0.99);
    }

    /*
     * 超過完美區就是 Over。
     * 越往右越過充，有效發射力下降。
     */
    const overRatio = clamp(
      (p - CHARGE.perfectMax) / (1 - CHARGE.perfectMax),
      0,
      1
    );

    return clamp(0.98 - overRatio * 0.28, 0.7, 0.98);
  }

  function getLaunchDisplayPercent(power) {
    return Math.round(getLaunchEffectivePower(power) * 100);
  }

  /*
   * ---------------------------------------------------------
   * 02-5. Score / Selected Top
   * ---------------------------------------------------------
   */

  function getMyScore() {
    try {
      return Number(localStorage.getItem(STORAGE.myScore) || 1200);
    } catch (error) {
      return 1200;
    }
  }

  function setMyScore(score) {
    try {
      localStorage.setItem(
        STORAGE.myScore,
        String(Math.max(0, Math.round(score)))
      );
    } catch (error) {}
  }

  function saveSelectedTop(top) {
    if (!top) return;

    try {
      localStorage.setItem(STORAGE.selectedType, top.id);
    } catch (error) {}
  }

  function loadSelectedTop() {
    let id = "attack";

    try {
      id = localStorage.getItem(STORAGE.selectedType) || "attack";
    } catch (error) {}

    return TOPS.find((top) => top.id === id) || TOPS[0];
  }

  /*
   * ---------------------------------------------------------
   * 02-6. FX Performance Helpers
   * ---------------------------------------------------------
   */

  function canFx(gap = PERF.minFxGap) {
    const t = now();

    if (PERF.lowFx && PERF.activeFx > 6) return false;
    if (PERF.activeFx >= PERF.maxFx) return false;
    if (t - PERF.lastFxAt < gap) return false;

    PERF.lastFxAt = t;
    return true;
  }

  function fxAdd() {
    PERF.activeFx += 1;
  }

  function fxRemove() {
    PERF.activeFx = Math.max(0, PERF.activeFx - 1);
  }

  function updatePerf(dtRaw) {
    if (dtRaw > 1.25) {
      PERF.frameSlowCount += 1;
    } else {
      PERF.frameSlowCount = Math.max(0, PERF.frameSlowCount - 2);
    }

    PERF.lowFx = PERF.frameSlowCount > 6;
  }

  function fxCount(base, intensity = 1) {
    const mul = PERF.lowFx ? 0.18 : 0.45;
    return Math.max(1, Math.round(base * intensity * mul));
  }

  /*
   * ---------------------------------------------------------
   * 02-7. API Helpers / JSONP + GET
   * ---------------------------------------------------------
   */

  function jsonpApi(action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName =
        "zelo_game_jsonp_" +
        Date.now() +
        "_" +
        Math.floor(Math.random() * 100000);

      const script = document.createElement("script");

      const payload = {
        ...params,
        action,
        callback: callbackName
      };

      let timeout = null;

      window[callbackName] = function(data) {
        window.clearTimeout(timeout);

        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = null;
        }

        try {
          script.remove();
        } catch (error) {}

        resolve(data || {});
      };

      script.onerror = function() {
        window.clearTimeout(timeout);

        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = null;
        }

        try {
          script.remove();
        } catch (error) {}

        reject(new Error(`JSONP failed: ${action}`));
      };

      timeout = window.setTimeout(() => {
        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = null;
        }

        try {
          script.remove();
        } catch (error) {}

        reject(new Error(`JSONP timeout: ${action}`));
      }, 15000);

      script.src = `${GOOGLE_SCRIPT_URL}?${buildQuery(payload)}`;

      document.body.appendChild(script);
    });
  }

  async function getApiJson(action, params = {}) {
    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("GOOGLE_SCRIPT_URL missing");
    }

    const query = buildQuery({
      ...params,
      action,
      _t: Date.now()
    });

    const url = `${GOOGLE_SCRIPT_URL}?${query}`;

    /*
     * 優先使用 fetch GET。
     * fetch 可跟隨 Apps Script 的 redirect，比 JSONP script 更穩。
     */
    try {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        cache: "no-store",
        redirect: "follow"
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new Error(`API returned non-JSON: ${text.slice(0, 180)}`);
      }

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.message ||
          data?.error ||
          `API failed: ${action}, HTTP ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.warn("[ZELO GAME] getApiJson fetch failed, fallback JSONP:", {
        action,
        message: String(error && error.message ? error.message : error)
      });

      /*
       * fallback JSONP。
       */
      return jsonpApi(action, params);
    }
  }

  /*
   * ---------------------------------------------------------
   * 02-8. Profile Helpers
   * ---------------------------------------------------------
   */

  function getProfile() {
    /*
     * LINE profile 來源優先順序：
     * 1. liff-boot 寫入的 window.ZELO_PROFILE
     * 2. state.profile
     * 3. localStorage zg_profile
     * 4. localStorage ZELO_PROFILE
     */
    try {
      if (window.ZELO_PROFILE) {
        return window.ZELO_PROFILE;
      }
    } catch (error) {}

    if (state && state.profile) {
      return state.profile;
    }

    try {
      const saved = localStorage.getItem(STORAGE.profile);

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {}

    try {
      const savedLine = localStorage.getItem("ZELO_PROFILE");

      if (savedLine) {
        return JSON.parse(savedLine);
      }
    } catch (error) {}

    return null;
  }

  function normalizeLineProfile(profile = {}) {
    const userId =
      profile.userId ||
      profile.id ||
      profile.uid ||
      profile.lineUserId ||
      profile.sub ||
      "";

    const displayName =
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      profile.lineDisplayName ||
      "你";

    const pictureUrl =
      profile.pictureUrl ||
      profile.avatar ||
      profile.avatarUrl ||
      profile.image ||
      profile.photoURL ||
      "";

    return {
      id: userId || "me-local",
      userId: userId || "me-local",
      lineUserId: userId || "",
      uid: userId || "",

      displayName,
      name: displayName,
      playerName: displayName,

      pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      statusMessage: profile.statusMessage || "",

      isLineUser: !!userId && userId !== "me-local"
    };
  }

  function getCurrentLinePlayer() {
    const profile = getProfile() || {};
    const normalized = normalizeLineProfile(profile);

    return {
      ...normalized,

      referralCode:
        typeof getMyReferralCode === "function"
          ? getMyReferralCode()
          : "",

      inviterReferralCode:
        typeof getSavedInviterReferralCode === "function"
          ? getSavedInviterReferralCode()
          : "",

      lineInviteFriendCount:
        typeof getLineInviteFriendCount === "function"
          ? getLineInviteFriendCount()
          : 0
    };
  }

  function getUserId() {
    const player = getCurrentLinePlayer();
    return player.userId && player.userId !== "me-local" ? player.userId : "";
  }

  function getPlayerName() {
    const player = getCurrentLinePlayer();
    return player.displayName || player.name || player.playerName || "你";
  }

  function getCurrentZeloProfileForReferral() {
    const profile =
      window.ZELO_PROFILE ||
      window.ZELO_LIFF_PROFILE ||
      (typeof getProfile === "function" ? getProfile() : {}) ||
      {};

    return {
      userId:
        profile.userId ||
        profile.id ||
        profile.lineUserId ||
        "",

      displayName:
        profile.displayName ||
        profile.name ||
        profile.playerName ||
        "LINE 玩家",

      pictureUrl:
        profile.pictureUrl ||
        profile.avatar ||
        profile.avatarUrl ||
        ""
    };
  }

  /*
   * ---------------------------------------------------------
   * 02-9. LINE Invite Count
   * ---------------------------------------------------------
   */

  function getLineInviteFriendCount() {
    const value = Number(localStorage.getItem(LINE_INVITE_FRIEND_COUNT_KEY) || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function setLineInviteFriendCount(count) {
    const safeCount = Math.max(0, Number(count) || 0);
    localStorage.setItem(LINE_INVITE_FRIEND_COUNT_KEY, String(safeCount));

    if (state) {
      state.lineInviteFriendCount = safeCount;
    }

    return safeCount;
  }

  function addLineInviteFriendCount(amount = 1) {
    const current = getLineInviteFriendCount();
    return setLineInviteFriendCount(current + amount);
  }

  /*
   * ---------------------------------------------------------
   * 02-10. Referral Helpers
   * ---------------------------------------------------------
   */

  function makeReferralSeed() {
    const profile = getProfile() || {};
    const raw =
      profile.userId ||
      profile.id ||
      profile.uid ||
      localStorage.getItem(REFERRAL.codeKey) ||
      "";

    if (raw) return String(raw);

    const randomSeed =
      "guest_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10);

    return randomSeed;
  }

  function simpleHash(input) {
    const text = String(input || "");
    let hash = 2166136261;

    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return Math.abs(hash >>> 0).toString(36).toUpperCase();
  }

  function getMyReferralCode() {
    let code = "";

    try {
      code = localStorage.getItem(REFERRAL.codeKey) || "";
    } catch (error) {
      code = "";
    }

    if (code) return code;

    const seed = makeReferralSeed();
    code = `ZG_${simpleHash(seed).slice(0, 8)}`;

    try {
      localStorage.setItem(REFERRAL.codeKey, code);
    } catch (error) {}

    return code;
  }

  function getReferralCodeFromUrl() {
    return (
      getZeloUrlParam("ref") ||
      getZeloUrlParam("referralCode") ||
      getZeloUrlParam("invite") ||
      getZeloUrlParam("inviterReferralCode") ||
      getZeloUrlParam("ownerReferralCode") ||
      ""
    ).trim();
  }

  function getIncomingReferralPayload() {
    const ref =
      getZeloUrlParam("ref") ||
      getZeloUrlParam("invite") ||
      getZeloUrlParam("referralCode") ||
      "";

    const inviterId =
      getZeloUrlParam("inviterId") ||
      getZeloUrlParam("inviter") ||
      getZeloUrlParam("fromUserId") ||
      getZeloUrlParam("referrerId") ||
      "";

    const inviterName =
      getZeloUrlParam("inviterName") ||
      getZeloUrlParam("refName") ||
      getZeloUrlParam("referrerName") ||
      "";

    const inviterPictureUrl =
      getZeloUrlParam("inviterPictureUrl") ||
      getZeloUrlParam("refPictureUrl") ||
      getZeloUrlParam("referrerPictureUrl") ||
      "";

    return {
      ref,
      inviterReferralCode: ref,
      inviterId,
      inviterName,
      inviterPictureUrl
    };
  }

  function saveInviterReferralCode(code) {
    const safeCode = String(code || "").trim();

    if (!safeCode) return "";

    const myCode = getMyReferralCode();

    /*
     * 自己點自己的邀請連結，不紀錄。
     */
    if (safeCode === myCode) {
      return "";
    }

    try {
      localStorage.setItem(REFERRAL.inviterCodeKey, safeCode);
    } catch (error) {}

    state.inviterId = safeCode;

    return safeCode;
  }

  function getSavedInviterReferralCode() {
    try {
      return localStorage.getItem(REFERRAL.inviterCodeKey) || "";
    } catch (error) {
      return "";
    }
  }

  function getReferralRegisteredKey(inviterCode) {
    return `${REFERRAL.registeredKeyPrefix}${String(inviterCode || "")}`;
  }

  function hasRegisteredReferral(inviterCode) {
    if (!inviterCode) return true;

    try {
      return localStorage.getItem(getReferralRegisteredKey(inviterCode)) === "1";
    } catch (error) {
      return false;
    }
  }

  function markReferralRegistered(inviterCode) {
    if (!inviterCode) return;

    try {
      localStorage.setItem(getReferralRegisteredKey(inviterCode), "1");
    } catch (error) {}
  }

  function getFallbackReferralSuccessCount() {
    try {
      const value = Number(localStorage.getItem(REFERRAL.countFallbackKey) || 0);
      return Number.isFinite(value) ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  function setFallbackReferralSuccessCount(count) {
    const safeCount = Math.max(0, Number(count) || 0);

    try {
      localStorage.setItem(REFERRAL.countFallbackKey, String(safeCount));
    } catch (error) {}

    return safeCount;
  }

  function buildReferralUrl() {
    const myCode = getMyReferralCode();

    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    const userId =
      player.userId && player.userId !== "me-local"
        ? player.userId
        : "";

    const displayName =
      player.displayName ||
      player.name ||
      player.playerName ||
      getPlayerName() ||
      "你";

    const pictureUrl =
      player.pictureUrl ||
      player.avatar ||
      "";

    const liffId =
      window.ZELO_LIFF_ID ||
      window.liffId ||
      "2007022255-ph9gRwPs";

    const params = {
      ref: myCode,
      invite: myCode,
      referralCode: myCode,

      inviter: userId,
      inviterId: userId,
      fromUserId: userId,
      referrerId: userId,

      inviterName: displayName,
      refName: displayName,
      referrerName: displayName,

      inviterPictureUrl: pictureUrl,
      refPictureUrl: pictureUrl,
      referrerPictureUrl: pictureUrl,

      source: "line_liff_result_share"
    };

    /*
     * LIFF 最穩作法：
     * 把原始 query 放進 liff.state。
     * LINE LIFF 會在開啟後保留這段 state。
     */
    const statePath = "/?" + buildQuery(params);

    return `https://liff.line.me/${encodeURIComponent(liffId)}?liff.state=${encodeURIComponent(statePath)}`;
  }

  async function postReferralApi(payload = {}) {
    const body = {
      game: "zelo",
      version: VERSION,
      ts: Date.now(),
      userId: getUserId(),
      playerName: getPlayerName(),
      referralCode: getMyReferralCode(),
      ...payload
    };

    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("GOOGLE_SCRIPT_URL missing");
    }

    /*
     * 優先嘗試 POST。
     * 如果 GAS / Shopify / LIFF WebView 發生 CORS 問題，
     * 會 fallback 到 JSONP GET。
     */
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(body)
      });

      const text = await response.text();

      let data = null;

      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {
          ok: response.ok,
          raw: text
        };
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Referral API failed");
      }

      return data;
    } catch (error) {
      console.warn("[ZELO GAME] postReferralApi POST failed, fallback JSONP:", error);

      /*
       * JSONP fallback：
       * GAS doGet 已支援 register_liff_referral 時，這裡可以避開 CORS。
       */
      const data = await jsonpApi("register_liff_referral", {
        ...body,

        action: "register_liff_referral",
        eventType: body.eventType || "referral_accept",

        source:
          body.source ||
          "post_referral_jsonp_fallback",

        pageUrl: location.href,
        userAgent: navigator.userAgent || ""
      });

      return data || {};
    }
  }

  async function registerReferralIfNeeded(source = "boot") {
    const incoming =
      typeof getIncomingReferralPayload === "function"
        ? getIncomingReferralPayload()
        : {
            ref: getReferralCodeFromUrl(),
            inviterReferralCode: getReferralCodeFromUrl(),
            inviterId: "",
            inviterName: "",
            inviterPictureUrl: ""
          };

    const urlReferralCode =
      incoming.ref ||
      incoming.inviterReferralCode ||
      getReferralCodeFromUrl();

    if (urlReferralCode) {
      saveInviterReferralCode(urlReferralCode);
    }

    const inviterCode =
      urlReferralCode ||
      getSavedInviterReferralCode() ||
      "";

    const inviterLineUserId =
      incoming.inviterId ||
      getZeloUrlParam("inviterId") ||
      getZeloUrlParam("inviter") ||
      getZeloUrlParam("fromUserId") ||
      getZeloUrlParam("referrerId") ||
      "";

    if (!inviterCode && !inviterLineUserId) {
      return {
        ok: false,
        reason: "no_inviter"
      };
    }

    const myCode = getMyReferralCode();

    if (inviterCode && inviterCode === myCode) {
      return {
        ok: false,
        reason: "self_referral_code"
      };
    }

    const profile = getProfile() || {};

    const referredUserId =
      profile.userId ||
      profile.id ||
      profile.uid ||
      getUserId();

    if (!referredUserId) {
      track("liff_referral_missing_user_id", {
        source,
        inviterReferralCode: inviterCode,
        inviterId: inviterLineUserId,
        referredReferralCode: myCode
      });

      return {
        ok: false,
        reason: "missing_line_user_id"
      };
    }

    if (inviterLineUserId && inviterLineUserId === referredUserId) {
      return {
        ok: false,
        reason: "self_referral_line_user_id"
      };
    }

    const referredPlayerName =
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      getPlayerName() ||
      "LINE 玩家";

    const referredPictureUrl =
      profile.pictureUrl ||
      profile.avatar ||
      profile.avatarUrl ||
      "";

    const inviterName =
      incoming.inviterName ||
      getZeloUrlParam("inviterName") ||
      getZeloUrlParam("refName") ||
      getZeloUrlParam("referrerName") ||
      "";

    const inviterPictureUrl =
      incoming.inviterPictureUrl ||
      getZeloUrlParam("inviterPictureUrl") ||
      getZeloUrlParam("refPictureUrl") ||
      getZeloUrlParam("referrerPictureUrl") ||
      "";

    /*
     * 註冊 key 要包含 inviter + invitee。
     * 避免同一台手機不同帳號或不同邀請人被錯誤擋掉。
     */
    const registeredKey = [
      REFERRAL.registeredKeyPrefix,
      inviterCode || inviterLineUserId,
      referredUserId
    ].join(":");

    try {
      if (localStorage.getItem(registeredKey) === "1") {
        return {
          ok: false,
          reason: "already_registered"
        };
      }
    } catch (error) {}

    try {
      const data = await postReferralApi({
        /*
         * 兩種 action/event 都送，讓 GAS 比較好兼容。
         */
        action: "register_liff_referral",
        eventType: "referral_accept",
        source,

        campaignType: "line_liff_invite",

        /*
         * 邀請人：ZG 邀請碼
         */
        inviterReferralCode: inviterCode,
        referralCode: inviterCode,
        ref: inviterCode,
        invite: inviterCode,

        /*
         * 邀請人：LINE userId
         */
        inviterId: inviterLineUserId,
        inviterUserId: inviterLineUserId,
        referrerId: inviterLineUserId,
        fromUserId: inviterLineUserId,

        inviterName,
        inviterPictureUrl,

        /*
         * 被邀請者
         */
        referredReferralCode: myCode,
        inviteeReferralCode: myCode,

        referredUserId,
        inviteeId: referredUserId,
        inviteeUserId: referredUserId,

        userId: referredUserId,
        lineUserId: referredUserId,

        referredPlayerName,
        inviteeName: referredPlayerName,
        lineDisplayName: referredPlayerName,
        displayName: referredPlayerName,
        playerName: referredPlayerName,

        pictureUrl: referredPictureUrl,
        inviteePictureUrl: referredPictureUrl,
        avatar: referredPictureUrl,
        avatarUrl: referredPictureUrl,

        statusMessage: profile.statusMessage || "",

        liffId: window.ZELO_LIFF_ID || window.liffId || "",
        isInClient:
          !!(
            window.liff &&
            typeof window.liff.isInClient === "function" &&
            window.liff.isInClient()
          ),

        pageUrl: location.href,
        userAgent: navigator.userAgent || "",
        timestamp: new Date().toISOString()
      });

      const counted =
        data?.counted === true ||
        data?.registered === true ||
        data?.ok === true;

      if (counted) {
        try {
          localStorage.setItem(registeredKey, "1");
        } catch (error) {}

        /*
         * 也保留舊 mark，避免舊邏輯重送。
         */
        markReferralRegistered(inviterCode || inviterLineUserId);

        track("liff_referral_registered", {
          source,
          inviterReferralCode: inviterCode,
          inviterId: inviterLineUserId,
          referredReferralCode: myCode,
          referredUserId,
          counted: true,
          apiOk: !!data?.ok
        });

        return {
          ok: true,
          counted: true,
          data
        };
      }

      track("liff_referral_not_counted", {
        source,
        inviterReferralCode: inviterCode,
        inviterId: inviterLineUserId,
        referredReferralCode: myCode,
        referredUserId,
        counted: false,
        reason: data?.reason || ""
      });

      return {
        ok: false,
        reason: data?.reason || "not_counted",
        data
      };
    } catch (error) {
      track("liff_referral_register_failed", {
        source,
        inviterReferralCode: inviterCode,
        inviterId: inviterLineUserId,
        referredReferralCode: myCode,
        referredUserId,
        message: String(error && error.message ? error.message : error)
      });

      return {
        ok: false,
        reason: "api_failed",
        error
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * 02-11. Friend Rank Cache Helpers
   * ---------------------------------------------------------
   */

  function getFriendRankCacheKey() {
    const profilePayload =
      typeof getProfilePayload === "function"
        ? getProfilePayload()
        : {};

    const lineUserId =
      profilePayload.lineUserId ||
      profilePayload.userId ||
      getUserId() ||
      "";

    const referralCode =
      typeof getMyReferralCode === "function"
        ? getMyReferralCode()
        : "";

    const userKey =
      lineUserId ||
      referralCode ||
      "me-local";

    return `${STORAGE.friends}:${userKey}`;
  }

  function loadFriendRankCache() {
    try {
      const keys = [
        getFriendRankCacheKey(),
        STORAGE.friends
      ].filter(Boolean);

      for (const key of keys) {
        const saved = localStorage.getItem(key);

        if (!saved) continue;

        const rows = JSON.parse(saved);

        if (Array.isArray(rows) && rows.length > 0) {
          return rows.filter(Boolean);
        }
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  function saveFriendRankCache(rows = []) {
    try {
      if (!Array.isArray(rows)) return [];

      const cleanRows = rows
        .filter(Boolean)
        .filter((item) => !item.isPlaceholder)
        .map((item, index) => {
          const userId =
            item.userId ||
            item.lineUserId ||
            item.id ||
            item.uid ||
            "";

          const name =
            item.name ||
            item.playerName ||
            item.displayName ||
            item.userName ||
            item.nickname ||
            item.lineDisplayName ||
            "";

          const score =
            Number(
              item.totalScore ??
              item.bestScore ??
              item.score ??
              item.points ??
              0
            ) || 0;

          return {
            rank: Number(item.rank || item.position || index + 1),
            position: Number(item.position || item.rank || index + 1),

            userId,
            lineUserId: item.lineUserId || userId,

            name,
            playerName: item.playerName || name,
            displayName: item.displayName || name,

            pictureUrl:
              item.pictureUrl ||
              item.avatar ||
              item.avatarUrl ||
              "",

            score,
            totalScore: score,
            bestScore: Math.max(
              score,
              Number(item.bestScore || 0)
            ),

            referralCode:
              item.referralCode ||
              item.myReferralCode ||
              item.ownerReferralCode ||
              "",

            bestRank:
              item.bestRank ||
              item.rankTag ||
              item.tier ||
              "",

            isMe: item.isMe === true || item.me === true,

            cachedAt: Date.now()
          };
        });

      const key = getFriendRankCacheKey();

      localStorage.setItem(key, JSON.stringify(cleanRows));

      /*
       * 也寫一份舊 key，方便舊版或 debug 使用。
       */
      localStorage.setItem(STORAGE.friends, JSON.stringify(cleanRows));

      return cleanRows;
    } catch (error) {
      return [];
    }
  }

  function mergeFriendRankRows(serverRows = [], cacheRows = [], selfRows = []) {
    const map = new Map();

    const put = (item, source = "unknown") => {
      if (!item || item.isPlaceholder) return;

      const userId =
        item.userId ||
        item.lineUserId ||
        item.id ||
        item.uid ||
        "";

      const referralCode =
        item.referralCode ||
        item.myReferralCode ||
        item.ownerReferralCode ||
        "";

      const name =
        item.name ||
        item.playerName ||
        item.displayName ||
        item.userName ||
        item.nickname ||
        item.lineDisplayName ||
        "";

      /*
       * 沒有 userId 時，用 referralCode / name 當備援 key。
       */
      const key =
        userId
          ? `uid:${userId}`
          : referralCode
            ? `ref:${referralCode}`
            : name
              ? `name:${name}`
              : "";

      if (!key) return;

      const score =
        Number(
          item.totalScore ??
          item.bestScore ??
          item.score ??
          item.points ??
          0
        ) || 0;

      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          rank: Number(item.rank || item.position || 999),
          position: Number(item.position || item.rank || 999),

          userId,
          lineUserId: item.lineUserId || userId,

          name,
          playerName: item.playerName || name,
          displayName: item.displayName || name,

          pictureUrl:
            item.pictureUrl ||
            item.avatar ||
            item.avatarUrl ||
            "",

          score,
          totalScore: score,
          bestScore: Math.max(score, Number(item.bestScore || 0)),

          bestRank:
            item.bestRank ||
            item.rankTag ||
            item.tier ||
            "",

          referralCode,

          isMe: item.isMe === true || item.me === true,

          source,
          cachedAt: item.cachedAt || Date.now()
        });

        return;
      }

      /*
       * 合併策略：
       * - 分數取較高
       * - 名稱 / 頭像用較新的 server 優先
       * - isMe 保留 true
       */
      const nextScore = Math.max(
        Number(existing.score || 0),
        score
      );

      map.set(key, {
        ...existing,
        ...item,

        userId: userId || existing.userId || "",
        lineUserId: item.lineUserId || userId || existing.lineUserId || "",

        name:
          name ||
          existing.name ||
          existing.playerName ||
          existing.displayName ||
          "LINE 玩家",

        playerName:
          item.playerName ||
          name ||
          existing.playerName ||
          existing.name ||
          "LINE 玩家",

        displayName:
          item.displayName ||
          name ||
          existing.displayName ||
          existing.name ||
          "LINE 玩家",

        pictureUrl:
          item.pictureUrl ||
          item.avatar ||
          item.avatarUrl ||
          existing.pictureUrl ||
          "",

        score: nextScore,
        totalScore: nextScore,
        bestScore: Math.max(
          nextScore,
          Number(existing.bestScore || 0),
          Number(item.bestScore || 0)
        ),

        isMe:
          existing.isMe === true ||
          item.isMe === true ||
          item.me === true,

        source:
          source === "server"
            ? "server"
            : existing.source || source,

        cachedAt: Date.now()
      });
    };

    /*
     * 順序：
     * 先 cache，再 server，最後 self。
     * server 會補最新資料，但不會清掉 cache 裡的好友。
     */
    cacheRows.forEach((item) => put(item, "cache"));
    serverRows.forEach((item) => put(item, "server"));
    selfRows.forEach((item) => put(item, "self"));

    return Array.from(map.values())
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        position: index + 1
      }));
  }
  /*
   * =========================================================
   * 03. AUDIO / 音效模組、戰鬥音樂、首頁音樂
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 03-1. BATTLE MUSIC / 戰鬥音樂
   * ---------------------------------------------------------
   */

  const BattleMusic = {
    audio: null,
    enabled: true,
    volume: 0.42,
    fadeTimer: null,

    init() {
      if (this.audio) return this.audio;

      try {
        const audio = new Audio(BATTLE_MUSIC_URL);

        audio.loop = true;
        audio.preload = "auto";
        audio.volume = this.volume;

        this.audio = audio;

        return audio;
      } catch (error) {
        console.warn("[ZELO] BattleMusic init failed:", error);
        return null;
      }
    },

    async play() {
      if (!this.enabled) {
        console.warn("[ZELO] BattleMusic disabled");

        return {
          ok: false,
          reason: "disabled"
        };
      }

      const audio = this.init();

      if (!audio) {
        console.warn("[ZELO] BattleMusic audio missing");

        return {
          ok: false,
          reason: "audio_missing"
        };
      }

      try {
        if (this.fadeTimer) {
          cancelAnimationFrame(this.fadeTimer);
          this.fadeTimer = null;
        }

        audio.volume = this.volume;

        console.log("[ZELO] BattleMusic play attempt:", {
          paused: audio.paused,
          src: audio.src,
          volume: audio.volume
        });

        if (audio.paused) {
          await audio.play();
        }

        console.log("[ZELO] BattleMusic playing:", {
          paused: audio.paused,
          currentTime: audio.currentTime
        });

        return {
          ok: true,
          paused: audio.paused,
          currentTime: audio.currentTime,
          volume: audio.volume,
          src: audio.src
        };
      } catch (error) {
        console.warn("[ZELO] BattleMusic play blocked:", error);

        return {
          ok: false,
          reason: "play_blocked",
          message: String(error && error.message ? error.message : error)
        };
      }
    },

    pause() {
      if (!this.audio) {
        return {
          ok: true,
          paused: true,
          currentTime: 0
        };
      }

      try {
        this.audio.pause();

        return {
          ok: true,
          paused: this.audio.paused,
          currentTime: this.audio.currentTime,
          volume: this.audio.volume
        };
      } catch (error) {
        console.warn("[ZELO] BattleMusic pause failed:", error);

        return {
          ok: false,
          message: String(error && error.message ? error.message : error)
        };
      }
    },

    stop() {
      if (!this.audio) {
        return {
          ok: true,
          paused: true,
          currentTime: 0
        };
      }

      try {
        if (this.fadeTimer) {
          cancelAnimationFrame(this.fadeTimer);
          this.fadeTimer = null;
        }

        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.volume = this.volume;

        return {
          ok: true,
          paused: this.audio.paused,
          currentTime: this.audio.currentTime,
          volume: this.audio.volume
        };
      } catch (error) {
        console.warn("[ZELO] BattleMusic stop failed:", error);

        return {
          ok: false,
          message: String(error && error.message ? error.message : error)
        };
      }
    },

    fadeOutAndStop(duration = 800) {
      if (!this.audio) {
        return {
          ok: true,
          skipped: true,
          reason: "audio_missing",
          duration
        };
      }

      try {
        const audio = this.audio;
        const safeDuration = Math.max(0, Number(duration) || 0);

        if (this.fadeTimer) {
          cancelAnimationFrame(this.fadeTimer);
          this.fadeTimer = null;
        }

        if (safeDuration <= 0 || audio.paused) {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = this.volume;

          return {
            ok: true,
            duration: safeDuration,
            immediate: true
          };
        }

        const startVolume = audio.volume;
        const startTime = performance.now();

        const tick = (nowTime) => {
          const progress = Math.min(1, (nowTime - startTime) / safeDuration);

          audio.volume = startVolume * (1 - progress);

          if (progress < 1) {
            this.fadeTimer = requestAnimationFrame(tick);
          } else {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = this.volume;
            this.fadeTimer = null;
          }
        };

        this.fadeTimer = requestAnimationFrame(tick);

        return {
          ok: true,
          duration: safeDuration
        };
      } catch (error) {
        console.warn("[ZELO] BattleMusic fadeOutAndStop failed:", error);

        this.stop();

        return {
          ok: false,
          message: String(error && error.message ? error.message : error)
        };
      }
    },

    setVolume(value) {
      const next = Math.max(0, Math.min(1, Number(value) || 0));

      this.volume = next;

      if (this.audio) {
        this.audio.volume = next;
      }

      return {
        ok: true,
        volume: this.volume,
        audioVolume: this.audio ? this.audio.volume : this.volume
      };
    },

    mute() {
      this.enabled = false;
      this.pause();

      return {
        ok: true,
        enabled: this.enabled
      };
    },

    unmute() {
      this.enabled = true;

      return {
        ok: true,
        enabled: this.enabled
      };
    },

    debug() {
      const audio = this.audio;

      return {
        version: VERSION,
        enabled: this.enabled,
        volume: this.volume,
        hasAudio: !!audio,
        src: audio ? audio.src : "",
        paused: audio ? audio.paused : true,
        currentTime: audio ? audio.currentTime : 0,
        duration: audio ? audio.duration : 0,
        readyState: audio ? audio.readyState : 0,
        networkState: audio ? audio.networkState : 0,
        loop: audio ? audio.loop : false,
        fadeTimerActive: !!this.fadeTimer
      };
    }
  };

  /*
   * ---------------------------------------------------------
   * 03-2. WEB AUDIO SFX / 戰鬥音效
   * ---------------------------------------------------------
   */

  const Sound = (() => {
    let ctx = null;
    let master = null;
    let humA = null;
    let humB = null;

    function ensure() {
      if (ctx) return ctx;

      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;

      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);

      return ctx;
    }

    function resume() {
      const c = ensure();

      if (c && c.state === "suspended") {
        try {
          c.resume();
        } catch (error) {}
      }
    }

    function tone(freq, duration, gain, type = "sine", endFreq = null) {
      const c = ensure();
      if (!c || !master) return;

      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, freq), t);

      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, endFreq),
          t + duration
        );
      }

      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(g);
      g.connect(master);

      osc.start(t);
      osc.stop(t + duration + 0.03);
    }

    function noise(duration = 0.08, gain = 0.2, filterFreq = 2600) {
      const c = ensure();
      if (!c || !master) return;

      const len = Math.max(1, Math.floor(c.sampleRate * duration));
      const buffer = c.createBuffer(1, len, c.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < len; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      }

      const src = c.createBufferSource();
      const filter = c.createBiquadFilter();
      const g = c.createGain();

      src.buffer = buffer;

      filter.type = "bandpass";
      filter.frequency.value = filterFreq;
      filter.Q.value = 8;

      g.gain.setValueAtTime(gain, c.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        c.currentTime + duration
      );

      src.connect(filter);
      filter.connect(g);
      g.connect(master);

      src.start();
    }

    function launch() {
      resume();

      tone(82, 0.28, 0.48, "sine", 42);
      tone(190, 0.12, 0.22, "triangle", 110);
      noise(0.11, 0.18, 1600);
    }

    function chargeTick(power = 0.5) {
      resume();

      const p = clamp(power, 0, 1);

      if (Math.random() < 0.18) {
        tone(
          110 + p * 220,
          0.035,
          0.035 + p * 0.035,
          "triangle",
          80 + p * 180
        );
      }
    }

    function chargePerfect() {
      resume();

      tone(880, 0.08, 0.13, "triangle", 1320);
      tone(1760, 0.06, 0.08, "sine", 880);
    }

    function metal(power = 1, sharpness = 1) {
      resume();

      const p = clamp(power, 0.25, 2);

      tone(820 * sharpness, 0.06, 0.14 * p, "square", 260 * sharpness);
      tone(2400 * sharpness, 0.035, 0.055 * p, "sawtooth", 900);
      noise(0.055, 0.18 * p, 3400 * sharpness);
    }

    function rail(power = 1) {
      resume();

      const p = clamp(power, 0.25, 1.8);

      tone(420, 0.1, 0.13 * p, "triangle", 180);
      noise(0.06, 0.16 * p, 2100);
    }

    function grind(power = 1) {
      resume();

      noise(0.12, 0.1 * power, 1200);
      tone(110, 0.12, 0.06 * power, "sawtooth", 80);
    }

    function death() {
      resume();

      tone(180, 0.75, 0.24, "sawtooth", 38);
      noise(0.42, 0.12, 700);
    }

    function createHum(base) {
      const c = ensure();
      if (!c || !master) return null;

      const osc = c.createOscillator();
      const filter = c.createBiquadFilter();
      const g = c.createGain();

      osc.type = "sawtooth";
      osc.frequency.value = base;

      filter.type = "lowpass";
      filter.frequency.value = 520;

      g.gain.value = 0.001;

      osc.connect(filter);
      filter.connect(g);
      g.connect(master);

      osc.start();

      return {
        osc,
        filter,
        gain: g
      };
    }

    function startHum(index, base) {
      resume();

      if (index === 0 && humA) {
        try {
          humA.osc.stop();
        } catch (error) {}

        humA = null;
      }

      if (index === 1 && humB) {
        try {
          humB.osc.stop();
        } catch (error) {}

        humB = null;
      }

      const h = createHum(base);

      if (index === 0) {
        humA = h;
      } else {
        humB = h;
      }
    }

    function updateHum(index, spinRatio, base, gainMul) {
      const c = ensure();
      if (!c) return;

      const h = index === 0 ? humA : humB;
      if (!h) return;

      const t = c.currentTime;
      const r = clamp(spinRatio, 0, 1);

      h.osc.frequency.setTargetAtTime(base + r * 180, t, 0.05);
      h.filter.frequency.setTargetAtTime(360 + r * 900, t, 0.06);
      h.gain.gain.setTargetAtTime((0.01 + r * 0.035) * gainMul, t, 0.08);
    }

    function stopHum() {
      const c = ensure();
      if (!c) return;

      [humA, humB].forEach((h) => {
        if (!h) return;

        h.gain.gain.setTargetAtTime(0.001, c.currentTime, 0.1);

        setTimeout(() => {
          try {
            h.osc.stop();
          } catch (error) {}
        }, 350);
      });

      humA = null;
      humB = null;
    }

    return {
      resume,
      launch,
      chargeTick,
      chargePerfect,
      metal,
      rail,
      grind,
      death,
      startHum,
      updateHum,
      stopHum
    };
  })();

  /*
   * ---------------------------------------------------------
   * 03-3. HOME MUSIC / 首頁音樂
   * ---------------------------------------------------------
   */

  let homeMusicAudio = null;
  let homeMusicUnlocked = false;

  /*
   * HOME VIDEO 狀態鎖：
   * 避免短時間內連續 video.play() 造成 AbortError。
   */
  let homeVideoPlayPromise = null;
  let homeVideoUnlockBound = false;

  function ensureHomeMusic() {
    if (homeMusicAudio) return homeMusicAudio;

    homeMusicAudio = new Audio(HOME_MUSIC_URL);
    homeMusicAudio.loop = true;
    homeMusicAudio.preload = "auto";
    homeMusicAudio.volume = 0.58;

    return homeMusicAudio;
  }

  function playHomeMusic() {
    /*
     * 防止首頁音樂與戰鬥音樂同時播放。
     */
    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic) {
        BattleMusic.fadeOutAndStop(300);
      }
    } catch (error) {}

    const audio = ensureHomeMusic();

    if (!audio) return;

    audio.volume = 0.58;

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        /*
         * 瀏覽器阻擋自動播放時會進這裡。
         * 等使用者點擊後再播放。
         */
      });
    }
  }

  function pauseHomeMusic() {
    if (!homeMusicAudio) return;

    try {
      homeMusicAudio.pause();
    } catch (error) {}
  }

  function stopHomeMusic() {
    if (!homeMusicAudio) return;

    try {
      homeMusicAudio.pause();
      homeMusicAudio.currentTime = 0;
    } catch (error) {}
  }

  function unlockHomeMusic() {
    if (homeMusicUnlocked) return;

    homeMusicUnlocked = true;
    playHomeMusic();
  }

  /*
   * ---------------------------------------------------------
   * 03-4. HOME VIDEO CONTROL / 首頁影片控制
   * ---------------------------------------------------------
   *
   * 注意：
   * DOM 會在第 5 頁 ensureHomeDom() 建立。
   * playHomeVideo / stopHomeVideo 放這裡是為了音訊與影片控制集中。
   */

  function playHomeVideo() {
    const startScreen =
      typeof screenStart === "function"
        ? screenStart()
        : document.querySelector("#screen-start") ||
          document.querySelector("#screen-home");

    const video =
      (startScreen &&
        startScreen.querySelector &&
        startScreen.querySelector(".zg-home-video")) ||
      document.querySelector(".zg-home-video");

    if (!video) return;

    /*
     * 只有首頁顯示時才播放。
     * 避免切到 select / battle / result 後還一直 play。
     */
    const currentScreen =
      document.body.getAttribute("data-zg-screen") ||
      (typeof state !== "undefined" && state ? state.screen : "");

    if (
      currentScreen &&
      currentScreen !== "start" &&
      currentScreen !== "home"
    ) {
      return;
    }

    try {
      /*
       * iOS / LINE WebView / Chrome 自動播放必要條件：
       * - muted
       * - playsinline
       * - autoplay
       */
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.loop = true;

      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("loop", "");
      video.setAttribute("preload", "auto");

      /*
       * 關鍵：
       * 不要主動 video.load()
       * load() 會中斷正在進行中的 play() request。
       */

      /*
       * 如果已經在播放，就不用再 play。
       */
      if (!video.paused && !video.ended && video.currentTime > 0) {
        return;
      }

      /*
       * 如果上一個 play() Promise 還沒結束，不要重複送 play。
       */
      if (homeVideoPlayPromise) {
        return;
      }

      homeVideoPlayPromise = video.play();

      if (
        homeVideoPlayPromise &&
        typeof homeVideoPlayPromise.then === "function"
      ) {
        homeVideoPlayPromise
          .then(() => {
            homeVideoPlayPromise = null;

            console.log("[ZELO GAME] home video autoplay playing:", {
              currentTime: video.currentTime,
              muted: video.muted,
              paused: video.paused,
              readyState: video.readyState
            });
          })
          .catch((error) => {
            homeVideoPlayPromise = null;

            /*
             * AbortError 通常是重複 play / layout / src 載入中的暫時中斷。
             * 不當成嚴重錯誤。
             */
            if (error && error.name === "AbortError") {
              console.log("[ZELO GAME] home video autoplay retry after ready:", {
                name: error.name,
                message: error.message,
                readyState: video.readyState
              });
            } else {
              console.warn("[ZELO GAME] home video autoplay failed:", error);
            }

            /*
             * 影片 ready 後補播一次。
             */
            const retryOnReady = () => {
              try {
                homeVideoPlayPromise = null;

                video.muted = true;
                video.defaultMuted = true;
                video.playsInline = true;
                video.autoplay = true;
                video.loop = true;

                video.setAttribute("muted", "");
                video.setAttribute("playsinline", "");
                video.setAttribute("webkit-playsinline", "");
                video.setAttribute("autoplay", "");
                video.setAttribute("loop", "");

                if (!video.paused && !video.ended) return;

                const retryPromise = video.play();

                if (retryPromise && typeof retryPromise.catch === "function") {
                  retryPromise.catch(() => {});
                }
              } catch (error) {}

              video.removeEventListener("canplay", retryOnReady);
              video.removeEventListener("loadeddata", retryOnReady);
            };

            video.addEventListener("canplay", retryOnReady, { once: true });
            video.addEventListener("loadeddata", retryOnReady, { once: true });

            /*
             * 如果瀏覽器真的擋自動播放，使用者第一次觸控後補播。
             * 只綁一次，避免事件越綁越多。
             */
            if (!homeVideoUnlockBound) {
              homeVideoUnlockBound = true;

              const unlock = () => {
                try {
                  homeVideoPlayPromise = null;

                  video.muted = true;
                  video.defaultMuted = true;
                  video.playsInline = true;
                  video.autoplay = true;
                  video.loop = true;

                  video.setAttribute("muted", "");
                  video.setAttribute("playsinline", "");
                  video.setAttribute("webkit-playsinline", "");
                  video.setAttribute("autoplay", "");
                  video.setAttribute("loop", "");

                  const unlockPromise = video.play();

                  if (
                    unlockPromise &&
                    typeof unlockPromise.catch === "function"
                  ) {
                    unlockPromise.catch(() => {});
                  }
                } catch (error) {}

                document.removeEventListener("pointerdown", unlock, true);
                document.removeEventListener("touchstart", unlock, true);
                document.removeEventListener("click", unlock, true);

                homeVideoUnlockBound = false;
              };

              document.addEventListener("pointerdown", unlock, true);
              document.addEventListener("touchstart", unlock, true);
              document.addEventListener("click", unlock, true);
            }
          });
      } else {
        homeVideoPlayPromise = null;
      }
    } catch (error) {
      homeVideoPlayPromise = null;
      console.warn("[ZELO GAME] playHomeVideo failed:", error);
    }
  }

  function stopHomeVideo() {
    const video = document.querySelector(".zg-home-video");

    if (!video) return;

    try {
      homeVideoPlayPromise = null;

      /*
       * 離開首頁時暫停即可。
       * 不重設 currentTime，回首頁可以比較快恢復播放。
       */
      video.pause();
    } catch (error) {}
  }
  /*
   * =========================================================
   * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
   * =========================================================
   */

  function appRoot() {
    let root = $("#zelo-liff-game");

    if (!root) {
      root = document.createElement("div");
      root.id = "zelo-liff-game";
      document.body.appendChild(root);
    }

    return root;
  }

  function screenStart() {
    return $("#screen-start") || $("#screen-home");
  }

  function screenSelect() {
    return $("#screen-select");
  }

  function screenBattle() {
    return $("#screen-battle");
  }

  function screenResult() {
    return $("#screen-result");
  }

  function battleBox() {
    return $(".zg-battle-box", screenBattle() || document) || $("#zg-battle-box");
  }

  /*
   * ---------------------------------------------------------
   * 04-1. Cleanup / 重複 DOM 清理
   * ---------------------------------------------------------
   */

  function removeDuplicateScreenDom() {
    const ids = [
      "screen-start",
      "screen-home",
      "screen-select",
      "screen-battle",
      "screen-result"
    ];

    ids.forEach((id) => {
      const nodes = Array.from(document.querySelectorAll(`[id="${id}"]`));

      if (nodes.length <= 1) return;

      nodes.slice(1).forEach((node) => {
        try {
          node.remove();
        } catch (error) {}
      });
    });
  }

  function removeDuplicateChargeDom() {
    const battle = screenBattle();
    if (!battle) return;

    /*
     * 只允許 .zg-charge-layer 出現在 .zg-launch-row 裡。
     * 其他位置的舊版蓄力 UI 全部移除。
     */
    $$(".zg-charge-layer", battle).forEach((layer) => {
      if (!layer.closest(".zg-launch-row")) {
        try {
          layer.remove();
        } catch (error) {}
      }
    });

    /*
     * 如果 .zg-launch-row 裡有多個 .zg-charge-layer，只保留第一個。
     */
    const launchRow = $(".zg-launch-row", battle);

    if (launchRow) {
      const layers = $$(".zg-charge-layer", launchRow);

      if (layers.length > 1) {
        layers.slice(1).forEach((layer) => {
          try {
            layer.remove();
          } catch (error) {}
        });
      }
    }

    /*
     * 只允許 .zg-charge-card 出現在 .zg-charge-layer 裡。
     */
    $$(".zg-charge-card", battle).forEach((card) => {
      if (!card.closest(".zg-charge-layer")) {
        try {
          card.remove();
        } catch (error) {}
      }
    });
  }

  function hardResetGamePage() {
    /*
     * 清掉舊版遊戲產生的畫面與殘留 DOM。
     * 重要修正：
     * - 不再全 document 刪 .zg-btn / .zg-main / .zg-bottom 等泛用 class。
     * - 只清理 #zelo-liff-game 內部。
     * - root 外只清明確 screen id，避免破壞 Shopify / theme 版型。
     */

    try {
      if (window.ZGMenuObserver) {
        window.ZGMenuObserver.disconnect();
        window.ZGMenuObserver = null;
      }
    } catch (error) {}

    try {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = null;
      }

      if (state.chargeRaf) {
        cancelAnimationFrame(state.chargeRaf);
        state.chargeRaf = null;
      }
    } catch (error) {}

    const root = appRoot();

    const removeSelectors = [
      /*
       * Screens
       */
      "#screen-start",
      "#screen-home",
      "#screen-select",
      "#screen-battle",
      "#screen-result",
      ".zg-screen",

      /*
       * Result page old / enhanced structures
       */
      ".zg-result-main",
      ".zg-result-card",
      ".zg-result-kicker",
      ".zg-result-title",
      ".zg-result-subtitle",
      ".zg-score-box",
      ".zg-result-grid",
      ".zg-result-coupon",
      ".zg-coupon-card",
      ".zg-coupon-box",
      ".zg-coupon-code",
      ".zg-coupon-title",
      ".zg-coupon-text",
      ".zg-rank-card",
      ".zg-friend-rank",
      ".zg-leaderboard",
      ".zg-rank-list",
      ".zg-rank-row",
      ".zg-result-top",
      ".zg-result-top-image",
      ".zg-result-hero",
      ".zg-result-actions",
      ".zg-invite-card",
      ".zg-share-card",

      /*
       * Charge UI
       */
      ".zg-launch-countdown-overlay",
      ".zg-launch-countdown-text",
      ".zg-charge-layer",
      ".zg-charge-card",
      ".zg-charge-meter",
      ".zg-energy-shell",
      ".zg-energy-track",
      ".zg-energy-fill",
      ".zg-energy-glow",
      ".zg-energy-perfect-zone",
      ".zg-energy-over-zone",
      ".zg-energy-cap",
      ".zg-charge-percent-badge",
      ".zg-charge-btn",

      /*
       * Battle visual DOM
       */
      ".zg-energy-grid",
      ".zg-stardust",
      ".zg-star",
      ".zg-hero",
      ".zg-bg-logo",
      ".zg-fixed-logo",
      ".zg-danger-vignette",
      ".zg-flash-overlay",
      ".zg-xtreme-zone",
      ".zg-pocket-zone",
      ".zg-battle-top",
      ".zg-player-top",
      ".zg-enemy-top",
      ".zg-spark",
      ".zg-impact-ring",
      ".zg-metal-spark",
      ".zg-scratch",
      ".zg-launch-shockwave",
      ".zg-spin-afterimage",
      ".zg-impact-streak",
      ".zg-burst-piece",
      ".zg-wall-flash",

      /*
       * Battle layout DOM
       */
      ".zg-battle-main",
      ".zg-reference-layout",
      ".zg-hp-stage",
      ".zg-hp-row",
      ".zg-hp-avatar",
      ".zg-hp-bar",
      ".zg-hp-fill",
      ".zg-hp-text",
      ".zg-arena-wrap",
      ".zg-battle-box",
      ".zg-arena-logo-img",
      ".zg-arena-ring",
      ".zg-battle-panel",
      ".zg-commentary",
      ".zg-launch-row",
      ".zg-external-top-photo",

      /*
       * Select page DOM
       */
      ".zg-select-bg",
      ".zg-select-orb",
      ".zg-select-grid",
      ".zg-select-stars",
      ".zg-main",
      ".zg-step-title",
      ".zg-desc",
      ".zg-top-list",
      ".zg-top-card",
      ".zg-top-icon",
      ".zg-top-photo",
      ".zg-top-content",
      ".zg-top-name",
      ".zg-top-type",
      ".zg-stats",
      ".zg-stat",

      /*
       * Home DOM
       */
      ".zg-home-video-screen",
      ".zg-home-video",
      ".zg-home-video-overlay",
      ".zg-home-video-bottom",
      ".zg-home-video-start-btn",
      ".zg-home-music-hint",

      /*
       * Common buttons / layout fragments
       */
      ".zg-bottom",
      ".result-bottom",
      ".zg-btn",
      ".zg-small-btn",
      ".zg-brand",
      ".zg-pill",
      ".zg-topbar"
    ];

    /*
     * 只清遊戲 root 內部。
     */
    removeSelectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });
    });

    /*
     * root 外只清明確 screen id。
     * 不清泛用 class，避免破壞 Shopify/theme。
     */
    [
      "#screen-start",
      "#screen-home",
      "#screen-select",
      "#screen-battle",
      "#screen-result"
    ].forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.closest("#zelo-liff-game")) return;

        try {
          el.remove();
        } catch (error) {}
      });
    });

    /*
     * 清除舊版 JS 注入的 style。
     * 新版 CSS 已抽離至 game.css，不再由 JS 注入。
     */
    const removeStyleIds = [
      "zg-bg-style",
      "zg-main-button-fix-style",
      "zg-battle-emergency-fix-style",
      "zg-result-fix-style",
      "zg-energy-charge-style",
      "zg-clean-style",
      "zg-clean-battle-style",
      "zg-battle-layout-override",
      "zg-battle-fluid-width-override",
      "zg-fullscreen-app-override",
      "zg-result-coupon-style",
      "zg-rank-style",
      "zg-leaderboard-style",
      "zg-result-enhanced-style",
      "zg-result-page-style"
    ];

    removeStyleIds.forEach((id) => {
      const style = document.getElementById(id);

      if (style) {
        try {
          style.remove();
        } catch (error) {}
      }
    });

    /*
     * 清掉 body 狀態。
     */
    document.body.removeAttribute("data-zg-screen");
    document.body.classList.remove(
      "zg-screen-start",
      "zg-screen-home",
      "zg-screen-select",
      "zg-screen-battle",
      "zg-screen-result",
      "zg-battle-running",
      "zg-result-active"
    );

    /*
     * 重設 app root。
     */
    root.innerHTML = "";
    root.className = "zg-clean-root";

    /*
     * root inline style 保留。
     * 這是避免 Shopify theme 容器限制遊戲尺寸。
     */
    root.style.setProperty("position", "fixed", "important");
    root.style.setProperty("inset", "0 auto auto 0", "important");
    root.style.setProperty("left", "0", "important");
    root.style.setProperty("top", "0", "important");
    root.style.setProperty("right", "auto", "important");
    root.style.setProperty("bottom", "auto", "important");

    root.style.setProperty("width", "var(--zg-app-width, 100vw)", "important");
    root.style.setProperty("min-width", "var(--zg-app-width, 100vw)", "important");
    root.style.setProperty("max-width", "var(--zg-app-width, 100vw)", "important");

    root.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
    root.style.setProperty("min-height", "var(--zg-app-height, 100vh)", "important");
    root.style.setProperty("max-height", "var(--zg-app-height, 100vh)", "important");

    root.style.setProperty("margin", "0", "important");
    root.style.setProperty("padding", "0", "important");
    root.style.setProperty("background", "#090612", "important");
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("z-index", "999999", "important");
    root.style.setProperty("box-sizing", "border-box", "important");

    /*
     * 重置流程狀態。
     */
    state.screen = "start";
    state.battle = null;
    state.raf = null;
    state.running = false;
    state.paused = false;

    state.firstCollision = false;
    state.killcamPlayed = false;

    state.lastEffectiveHitAt = 0;
    state.stuckBoostAt = 0;
    state.damagePressure = 1;

    state.finishing = false;
    state.finishStartedAt = 0;
    state.pendingResult = null;

    state.centerDuelStarted = false;
    state.centerDuelStartedAt = 0;
    state.centerDuelResolved = false;

    state.charging = false;
    state.launchReady = false;
    state.launchCountdownToken = 0;
    state.launchPower = 0;
    state.chargeDir = 1;
    state.chargeRaf = null;
    state.chargeUiEls = null;
    state.lastPerfectSoundAt = 0;
    state.chargeStartedAt = 0;
    state.chargeLastFrameAt = 0;

    state.resultLogged = false;

    /*
     * 不清：
     * - selectedTop
     * - enemyTop
     * - profile
     * - playsUsed / remainingPlays
     * - lastBattleResult
     */

    /*
     * 清 FX 狀態。
     */
    if (typeof PERF !== "undefined") {
      PERF.lowFx = false;
      PERF.lastFxAt = 0;
      PERF.lastScratchAt = 0;
      PERF.lastAfterimageAt = 0;
      PERF.lastMotionTrailAt = 0;
      PERF.lastShockwaveAt = 0;
      PERF.lastCollisionTrackAt = 0;
      PERF.lastHpUiAt = 0;
      PERF.lastHpPulseAt = 0;
      PERF.lastEnergyUiAt = 0;
      PERF.activeFx = 0;
      PERF.frameSlowCount = 0;
    }
  }

  /*
   * ---------------------------------------------------------
   * 04-2. Viewport / CSS Variables
   * ---------------------------------------------------------
   */

  function ensureAppHeight() {
    const set = () => {
      const vv = window.visualViewport;

      const h = vv && vv.height
        ? Math.floor(vv.height)
        : window.innerHeight;

      const w = vv && vv.width
        ? Math.floor(vv.width)
        : window.innerWidth;

      document.documentElement.style.setProperty(
        "--zg-app-height",
        `${h}px`
      );

      document.documentElement.style.setProperty(
        "--zg-app-width",
        `${w}px`
      );

      document.documentElement.style.setProperty(
        "--zg-safe-width",
        `${Math.max(320, w)}px`
      );
    };

    set();

    window.addEventListener("resize", set, {
      passive: true
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(set, 80);
      setTimeout(set, 250);
      setTimeout(set, 600);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", set, {
        passive: true
      });

      window.visualViewport.addEventListener("scroll", set, {
        passive: true
      });
    }
  }

  function applyCssVariables() {
    const root = document.documentElement;

    root.style.setProperty("--zg-home-bg-image", `url("${BG_IMAGE_URL}")`);
    root.style.setProperty("--zg-arena-bg-image", `url("${ARENA_LOGO_URL}")`);
  }

  /*
   * ---------------------------------------------------------
   * 04-3. Shopify / Theme Menu Cleanup
   * ---------------------------------------------------------
   */

  function removeMenuDom() {
    const selectors = [
      "header",
      "nav",
      ".site-header",
      ".header",
      ".navbar",
      ".navigation",
      ".menu",
      ".drawer",
      ".drawer-menu",
      ".mobile-menu",
      "#menu",
      "#shopify-section-header",
      ".shopify-section-header",
      ".announcement-bar",
      "#shopify-section-announcement-bar",
      ".header-wrapper",
      ".shopify-section-group-header-group"
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.closest("#zelo-liff-game") || el.closest("#zg-app")) return;

        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("height", "0", "important");
        el.style.setProperty("min-height", "0", "important");
        el.style.setProperty("max-height", "0", "important");
        el.style.setProperty("overflow", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
      });
    });
  }

  function removeLogoDom() {
    const root = appRoot();

    $$(".zg-brand", root).forEach((el) => el.remove());
    $$(".zg-pill", root).forEach((el) => el.remove());
    $$(".zg-bg-logo", root).forEach((el) => el.remove());
    $$(".zg-fixed-logo", root).forEach((el) => el.remove());

    $$(".zg-topbar", root).forEach((bar) => {
      const hasUsefulButton = $(".zg-small-btn", bar);

      if (hasUsefulButton) {
        bar.classList.add("zg-topbar-no-logo");
        return;
      }

      bar.remove();
    });
  }

  function watchMenuDom() {
    removeMenuDom();
    removeLogoDom();

    if (window.ZGMenuObserver) {
      try {
        window.ZGMenuObserver.disconnect();
      } catch (error) {}
    }

    const observer = new MutationObserver(() => {
      removeMenuDom();
      removeLogoDom();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.ZGMenuObserver = observer;
  }

  /*
   * ---------------------------------------------------------
   * 04-4. Basic DOM / Screen Switch
   * ---------------------------------------------------------
   */

  function ensureBasicDom() {
    const root = appRoot();

    removeDuplicateScreenDom();

    ensureHomeDom(root);
    ensureSelectDom(root);

    /*
     * 結果頁由 onResultShown() 每次重建。
     */
    // ensureResultDom(root);

    removeDuplicateScreenDom();
    removeLogoDom();
  }

  function showScreen(name) {
    const normalizedName = name === "home" ? "start" : name;

    const screens = {
      start: screenStart(),
      select: screenSelect(),
      battle: screenBattle(),
      result: screenResult()
    };

    Object.entries(screens).forEach(([key, screen]) => {
      if (!screen) return;

      const active = key === normalizedName;

      screen.classList.toggle("active", active);
      screen.classList.toggle("is-active", active);

      if (active) {
        screen.hidden = false;
        screen.removeAttribute("hidden");
        screen.setAttribute("aria-hidden", "false");

        screen.style.setProperty("display", "flex", "important");
        screen.style.setProperty("visibility", "visible", "important");
        screen.style.setProperty("opacity", "1", "important");
        screen.style.setProperty("pointer-events", "auto", "important");
        screen.style.setProperty("flex-direction", "column", "important");

        $$(
          "[data-zg-action], .zg-btn, .zg-small-btn, .zg-top-card, .zg-charge-btn",
          screen
        ).forEach((el) => {
          /*
           * 關鍵：
           * 如果是蓄力按鈕且 disabled，就不能被 showScreen() 強行打開 pointer-events。
           * 否則倒數前可能短暫可點。
           */
          if (el.classList.contains("zg-charge-btn") && el.disabled) {
            el.style.setProperty("pointer-events", "none", "important");
          } else {
            el.style.setProperty("pointer-events", "auto", "important");
          }

          el.style.setProperty("position", "relative", "important");
          el.style.setProperty("z-index", "20", "important");
        });
      } else {
        if (screen.contains(document.activeElement)) {
          try {
            document.activeElement.blur();
          } catch (error) {}
        }

        screen.classList.remove("active", "is-active");
        screen.setAttribute("aria-hidden", "true");
        screen.hidden = true;

        screen.style.setProperty("display", "none", "important");
        screen.style.setProperty("visibility", "hidden", "important");
        screen.style.setProperty("opacity", "0", "important");
        screen.style.setProperty("pointer-events", "none", "important");
      }
    });

    state.screen = normalizedName;
    document.body.setAttribute("data-zg-screen", normalizedName);

    removeMenuDom();
    removeLogoDom();

    if (normalizedName === "start") onHomeShown();
    if (normalizedName === "select") onSelectShown();
    if (normalizedName === "battle") onBattleShown();

    if (normalizedName === "result" && typeof onResultShown === "function") {
      onResultShown();
    }

    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }

    if (normalizedName === "select") {
      setTimeout(installSelectScrollClamp, 80);
      setTimeout(installSelectScrollClamp, 300);
    }
  }

  /*
   * ---------------------------------------------------------
   * 04-5. Page Lifecycle Hooks
   * ---------------------------------------------------------
   */

  function onHomeShown() {
    stopBattle();
    cancelChargeLoop();

    /*
     * 回到首頁時，確保戰鬥音樂停止。
     */
    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic) {
        BattleMusic.fadeOutAndStop(500);
      }
    } catch (error) {}

    removeMenuDom();
    removeLogoDom();

    /*
     * 首頁真正顯示後再播放影片。
     * 不要密集呼叫，避免 AbortError。
     */
    requestAnimationFrame(() => {
      playHomeVideo();
    });

    setTimeout(playHomeVideo, 180);
    setTimeout(playHomeVideo, 600);
  }

  function onSelectShown() {
    stopBattle();
    cancelChargeLoop();

    /*
     * 進入選擇頁時保險停止戰鬥音樂。
     * 不會影響玩家按「發射！開始對戰」後的 pointerdown 播放，
     * 因為這裡是在顯示選擇頁時執行。
     */
    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic) {
        BattleMusic.fadeOutAndStop(500);
      }
    } catch (error) {}

    renderTopSelection();

    forceSelectScrollable();

    const selectScreen = screenSelect();

    if (selectScreen) {
      try {
        selectScreen.scrollTop = 0;
      } catch (error) {}
    }

    setTimeout(forceSelectScrollable, 50);
    setTimeout(forceSelectScrollable, 160);
    setTimeout(forceSelectScrollable, 420);
    setTimeout(forceSelectScrollable, 800);

    const battleBtn = $('[data-zg-action="battle"]', screenSelect() || document);

    if (battleBtn && battleBtn.dataset.battleMusicBound !== "1") {
      battleBtn.dataset.battleMusicBound = "1";

      battleBtn.addEventListener(
        "pointerdown",
        () => {
          try {
            Sound.resume();
          } catch (error) {}

          try {
            stopHomeMusic();
          } catch (error) {}

          try {
            if (typeof BattleMusic !== "undefined" && BattleMusic) {
              BattleMusic.play();
            }
          } catch (error) {}
        },
        {
          capture: true,
          passive: true
        }
      );
    }

    removeMenuDom();
    removeLogoDom();
  }

  /*
   * 合併後只保留一個 onBattleShown。
   * 原本第一段重複宣告的版本已整合到這裡。
   */
  function onBattleShown() {
    /*
     * 進入戰鬥頁時，校正畫面高度。
     */
    try {
      ensureAppHeight();
    } catch (error) {}

    /*
     * 清掉首頁/選擇頁殘留 UI。
     */
    try {
      removeMenuDom();
    } catch (error) {}

    try {
      removeLogoDom();
    } catch (error) {}

    /*
     * 進入戰鬥頁時停止首頁影片/首頁音樂。
     */
    try {
      if (typeof stopHomeVideo === "function") {
        stopHomeVideo();
      }
    } catch (error) {}

    try {
      if (typeof stopHomeMusic === "function") {
        stopHomeMusic();
      }
    } catch (error) {}

    /*
     * 恢復 WebAudio，避免 iOS / LIFF WebView 靜音。
     */
    try {
      if (typeof Sound !== "undefined" && Sound && typeof Sound.resume === "function") {
        Sound.resume();
      }
    } catch (error) {}

    /*
     * 戰鬥音樂保險播放。
     */
    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic && typeof BattleMusic.play === "function") {
        BattleMusic.play();
      }
    } catch (error) {}

    const battleScreen =
      typeof screenBattle === "function"
        ? screenBattle()
        : document.querySelector("#screen-battle");

    if (battleScreen) {
      battleScreen.hidden = false;
      battleScreen.removeAttribute("hidden");
      battleScreen.classList.add("active", "is-active");
      battleScreen.setAttribute("aria-hidden", "false");

      battleScreen.style.setProperty("display", "flex", "important");
      battleScreen.style.setProperty("visibility", "visible", "important");
      battleScreen.style.setProperty("opacity", "1", "important");
      battleScreen.style.setProperty("pointer-events", "auto", "important");
    }

    /*
     * 確保蓄力按鈕可以互動。
     * 但如果倒數尚未完成，renderLaunchPrep / setLaunchButtonReady(false)
     * 仍會重新 disabled，避免提前蓄力。
     */
    const chargeBtn =
      document.querySelector('[data-zg-action="charge"]') ||
      document.querySelector(".zg-charge-btn") ||
      document.querySelector("#zg-charge-btn");

    if (chargeBtn && state.launchReady) {
      chargeBtn.disabled = false;
      chargeBtn.removeAttribute("disabled");
      chargeBtn.style.setProperty("pointer-events", "auto", "important");
      chargeBtn.style.setProperty("touch-action", "none", "important");
      chargeBtn.style.setProperty("user-select", "none", "important");
      chargeBtn.style.setProperty("-webkit-user-select", "none", "important");
    }

    /*
     * 重新綁定蓄力按鈕。
     */
    try {
      if (typeof bindBattleChargeButton === "function") {
        bindBattleChargeButton();
      }
    } catch (error) {
      console.warn("[ZELO] bindBattleChargeButton failed:", error);
    }

    /*
     * LIFF / iOS viewport 可能延遲更新，所以補幾次高度校正。
     */
    try {
      requestAnimationFrame(() => {
        ensureAppHeight();
      });

      setTimeout(ensureAppHeight, 80);
      setTimeout(ensureAppHeight, 240);
      setTimeout(ensureAppHeight, 520);
    } catch (error) {}
  }

  function onResultShown() {
    Sound.stopHum();
    cancelChargeLoop();

    /*
     * 戰鬥結束進結果頁時，淡出並停止戰鬥音樂。
     */
    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic) {
        BattleMusic.fadeOutAndStop(900);
      }
    } catch (error) {}

    /*
     * 注意：
     * 這裡不能再呼叫 showScreen("result")。
     * 因為 showScreen("result") 會再觸發 onResultShown()，
     * 造成無限遞迴並出現 Maximum call stack size exceeded。
     */

    ensureAppHeight();

    const root = appRoot();

    const oldResult = screenResult();

    if (oldResult) {
      try {
        oldResult.remove();
      } catch (error) {}
    }

    ensureResultDom(root);

    const resultScreen = screenResult();

    /*
     * 隱藏其他頁面。
     */
    ["#screen-start", "#screen-home", "#screen-select", "#screen-battle"].forEach(
      (selector) => {
        document.querySelectorAll(selector).forEach((screen) => {
          screen.classList.remove("active", "is-active");
          screen.setAttribute("aria-hidden", "true");
          screen.hidden = true;

          screen.style.setProperty("display", "none", "important");
          screen.style.setProperty("visibility", "hidden", "important");
          screen.style.setProperty("opacity", "0", "important");
          screen.style.setProperty("pointer-events", "none", "important");
        });
      }
    );

    /*
     * 顯示結果頁：全部使用 --zg-app-width / --zg-app-height。
     */
    if (resultScreen) {
      resultScreen.hidden = false;
      resultScreen.removeAttribute("hidden");
      resultScreen.classList.add("active", "is-active");
      resultScreen.setAttribute("aria-hidden", "false");

      resultScreen.style.setProperty("position", "fixed", "important");
      resultScreen.style.setProperty("inset", "0 auto auto 0", "important");
      resultScreen.style.setProperty("left", "0", "important");
      resultScreen.style.setProperty("top", "0", "important");
      resultScreen.style.setProperty("right", "auto", "important");
      resultScreen.style.setProperty("bottom", "auto", "important");

      resultScreen.style.setProperty(
        "width",
        "var(--zg-app-width, 100vw)",
        "important"
      );
      resultScreen.style.setProperty(
        "min-width",
        "var(--zg-app-width, 100vw)",
        "important"
      );
      resultScreen.style.setProperty(
        "max-width",
        "var(--zg-app-width, 100vw)",
        "important"
      );

      resultScreen.style.setProperty(
        "height",
        "var(--zg-app-height, 100vh)",
        "important"
      );
      resultScreen.style.setProperty(
        "min-height",
        "var(--zg-app-height, 100vh)",
        "important"
      );
      resultScreen.style.setProperty(
        "max-height",
        "var(--zg-app-height, 100vh)",
        "important"
      );

      resultScreen.style.setProperty("display", "flex", "important");
      resultScreen.style.setProperty("visibility", "visible", "important");
      resultScreen.style.setProperty("opacity", "1", "important");
      resultScreen.style.setProperty("pointer-events", "auto", "important");
      resultScreen.style.setProperty("flex-direction", "column", "important");
      resultScreen.style.setProperty("overflow", "hidden", "important");
      resultScreen.style.setProperty("box-sizing", "border-box", "important");
      resultScreen.style.setProperty("transform", "none", "important");

      $$(
        "[data-zg-action], .zg-btn, .zg-small-btn, .zg-coupon-copy",
        resultScreen
      ).forEach((el) => {
        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("position", "relative", "important");
        el.style.setProperty("z-index", "20", "important");
      });
    }

    const result =
      state.lastBattleResult ||
      safeParse(localStorage.getItem(STORAGE.lastResult), null);

    /*
     * 這裡只負責渲染結果頁。
     * 不要在這裡呼叫 showResultIntroThenRender()，
     * 否則會進入動畫 / 結果頁無限循環。
     */
    if (result) {
      renderResult(result);
    } else {
      console.warn("[ZELO] onResultShown: no battle result found");
    }

    forceResultVisible();

    /*
     * 防止圖片載入、LIFF viewport 延後更新後跑版。
     */
    setTimeout(forceResultVisible, 50);
    setTimeout(forceResultVisible, 120);
    setTimeout(forceResultVisible, 260);
    setTimeout(forceResultVisible, 600);
    setTimeout(forceResultVisible, 1000);

    removeMenuDom();
    removeLogoDom();
  }
  /*
   * =========================================================
   * 05. HOME PAGE / SELECT PAGE
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 05-1. HOME DOM
   * ---------------------------------------------------------
   */

  function ensureHomeDom(root = appRoot()) {
    let start = screenStart();

    if (!start) {
      start = document.createElement("section");
      start.id = "screen-start";
      start.className = "zg-screen active is-active";
      root.appendChild(start);
    }

    /*
     * 每次重建首頁內容，避免舊版殘留。
     */
    start.innerHTML = `
      <div class="zg-home-video-screen">
        <video
          class="zg-home-video"
          src="${escapeAttr(HOME_VIDEO_URL)}"
          poster="${escapeAttr(HOME_POSTER_URL)}"
          autoplay
          muted
          playsinline
          webkit-playsinline
          loop
          preload="auto"
        ></video>

        <div class="zg-home-video-overlay" aria-hidden="true"></div>

        <div class="zg-home-video-bottom">
          <button
            type="button"
            class="zg-home-video-start-btn"
            data-zg-action="start"
          >
            START
          </button>

          <div class="zg-home-music-hint">
            點擊 START 後開啟聲音體驗
          </div>
        </div>
      </div>
    `;

    start.hidden = false;
    start.removeAttribute("hidden");
    start.setAttribute("aria-hidden", "false");

    return start;
  }

  /*
   * ---------------------------------------------------------
   * 05-2. SELECT DOM
   * ---------------------------------------------------------
   */

  function ensureSelectDom(root = appRoot()) {
  let select = screenSelect();

  if (!select) {
    select = document.createElement("section");
    select.id = "screen-select";
    select.className = "zg-screen zg-select-screen";
    root.appendChild(select);
  }

  select.innerHTML = `
    <div class="zg-select-bg" aria-hidden="true">
      <div class="zg-select-orb zg-select-orb-red"></div>
      <div class="zg-select-orb zg-select-orb-blue"></div>
      <div class="zg-select-orb zg-select-orb-gold"></div>

      <div class="zg-select-grid"></div>

      <div class="zg-select-stars">
        <i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i>
      </div>

      <div class="zg-select-energy-rings">
        <i></i><i></i><i></i>
      </div>

      <div class="zg-select-comets">
        <i></i><i></i><i></i><i></i>
      </div>
    </div>

    <div class="zg-main zg-select-main">
      <div class="zg-step-title">選擇你的戰鬥陀螺</div>

      <div class="zg-desc">
        不同類型擁有不同攻擊、防禦、耐久與速度特性。
      </div>

      <div class="zg-top-list" id="zg-top-list"></div>
    </div>

    <div class="zg-bottom zg-select-fixed-bottom">
      <button
        type="button"
        class="zg-btn zg-btn-red zg-select-battle-btn"
        data-zg-action="battle"
      >
        發射！開始對戰
      </button>

      <button
        type="button"
        class="zg-small-btn"
        data-zg-action="back-home"
      >
        返回首頁
      </button>
    </div>
  `;

  select.hidden = true;
  select.setAttribute("aria-hidden", "true");

  return select;
}

  /*
   * ---------------------------------------------------------
   * 05-3. Secret Top Image / 修正 nested span
   * ---------------------------------------------------------
   */

 function renderSecretTopImageHtml(kind = "shadow") {
  const isLight = kind === "light";

  const imageUrl = isLight
    ? "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_34b25e4e-b5f7-4b0e-8cd4-4fb160caff33.png?v=1784147180"
    : "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_b1c5de32-8300-416d-b7c1-5083fea27f6d.png?v=1784147189";

  const cls = isLight
    ? "zg-secret-row-question zg-secret-row-question-light"
    : "zg-secret-row-question zg-secret-row-question-shadow";

  return `
    <span class="${cls}" aria-hidden="true">
      <img
        class="zg-secret-row-img"
        src="${escapeAttr(imageUrl)}"
        alt=""
        loading="lazy"
      />
    </span>
  `;
}


  /*
   * ---------------------------------------------------------
   * 05-4. Select Page Render
   * ---------------------------------------------------------
   */

  function statBar(label, value) {
  const safeValue = clamp(Number(value) || 0, 0, 100);

  return `
    <div class="zg-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(safeValue)}</strong>
    </div>
  `;
}


function renderSecretRowCardHtml(config = {}) {
  const theme = config.theme || "shadow";

  const themeClass =
    theme === "light"
      ? "zg-secret-row-light"
      : theme === "fire"
        ? "zg-secret-row-fire"
        : theme === "ice"
          ? "zg-secret-row-ice"
          : theme === "thunder"
            ? "zg-secret-row-thunder"
            : "zg-secret-row-shadow";

  return `
    <div class="zg-secret-row-card ${themeClass}">
      <div class="zg-secret-row-media">
        <div class="zg-secret-row-orb">
          ${renderSecretTopImageHtml(theme)}
        </div>

        <div class="zg-secret-row-lock">
          LOCKED
        </div>
      </div>

      <div class="zg-secret-row-info">
        <div class="zg-secret-row-name">
          ${escapeHtml(config.name || "隱藏陀螺")}
        </div>

        <div class="zg-secret-row-type">
          ${escapeHtml(config.typeName || "特殊型")}
        </div>

        <div class="zg-secret-row-stats">
          <div class="zg-secret-row-stat">
            <span>攻擊</span>
            <strong>${escapeHtml(config.power ?? "-")}</strong>
          </div>

          <div class="zg-secret-row-stat">
            <span>防禦</span>
            <strong>${escapeHtml(config.defense ?? "-")}</strong>
          </div>

          <div class="zg-secret-row-stat">
            <span>耐久</span>
            <strong>${escapeHtml(config.stamina ?? "-")}</strong>
          </div>

          <div class="zg-secret-row-stat">
            <span>速度</span>
            <strong>${escapeHtml(config.speed ?? "-")}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

  
  function renderTopSelection() {
  const list = $("#zg-top-list", screenSelect() || document);
  if (!list) return;

  const selected = state.selectedTop || loadSelectedTop();
  state.selectedTop = selected;

  list.innerHTML = TOPS.map((top) => {
    const active = selected && selected.id === top.id;

    return `
      <button
        type="button"
        class="zg-top-card ${escapeAttr(top.type || "")} ${active ? "selected active is-selected" : ""}"
        data-top-id="${escapeAttr(top.id)}"
      >
        <div class="zg-top-icon" aria-hidden="true">
          <img
            class="zg-top-photo"
            src="${escapeAttr(top.image || DEFAULT_TOP_IMAGE)}"
            alt="${escapeAttr(top.name)}"
            loading="lazy"
          />
        </div>

        <div class="zg-top-content">
          <div class="zg-top-name">
            <span>${escapeHtml(top.emoji || "")}</span>
            ${escapeHtml(top.name)}
          </div>

          <div class="zg-top-type">
            ${escapeHtml(top.typeName || top.type || "")}
          </div>

          <div class="zg-stats">
            ${statBar("攻擊", top.power)}
            ${statBar("防禦", top.defense)}
            ${statBar("耐久", top.stamina)}
            ${statBar("速度", top.speed)}
          </div>
        </div>
      </button>
    `;
  }).join("");

  const secretPreview = document.createElement("div");
  secretPreview.className = "zg-secret-tops-preview";

  secretPreview.innerHTML = `
    <div class="zg-secret-head">
      <div>
        <div class="zg-secret-kicker">SECRET TOPS</div>
        <div class="zg-secret-title">隱藏陀螺</div>
      </div>

      <div class="zg-secret-note">
        完成挑戰後解鎖特殊型態
      </div>
    </div>

    <div class="zg-secret-row-list">
      ${renderSecretRowCardHtml({
        theme: "shadow",
        name: "闇影突擊型",
        typeName: "隱藏攻擊型",
        power: 98,
        defense: 70,
        stamina: 72,
        speed: 92
      })}

      ${renderSecretRowCardHtml({
        theme: "light",
        name: "光耀平衡型",
        typeName: "傳說平衡型",
        power: 88,
        defense: 88,
        stamina: 88,
        speed: 88
      })}
    </div>
  `;

  list.appendChild(secretPreview);
}

  /*
   * ---------------------------------------------------------
   * 05-5. Select Scroll Fix
   * ---------------------------------------------------------
   */

  function forceSelectScrollable() {
  const select = screenSelect();

  if (!select) return;

  select.style.setProperty("position", "fixed", "important");
  select.style.setProperty("left", "0", "important");
  select.style.setProperty("top", "0", "important");
  select.style.setProperty("width", "var(--zg-app-width, 100vw)", "important");
  select.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
  select.style.setProperty("max-height", "var(--zg-app-height, 100vh)", "important");
  select.style.setProperty("overflow-y", "auto", "important");
  select.style.setProperty("overflow-x", "hidden", "important");
  select.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
  select.style.setProperty("overscroll-behavior-y", "contain", "important");
  select.style.setProperty("touch-action", "pan-y", "important");
  select.style.setProperty("padding-bottom", "0", "important");

  const main =
    $(".zg-main", select) ||
    $(".zg-select-main", select);

  if (main) {
    main.style.setProperty("overflow", "visible", "important");
    main.style.setProperty("overflow-y", "visible", "important");
    main.style.setProperty("overflow-x", "visible", "important");
    main.style.setProperty("min-height", "0", "important");
    main.style.setProperty("height", "auto", "important");
    main.style.setProperty("max-height", "none", "important");
    main.style.setProperty("padding-bottom", "0", "important");
  }

  const list = $(".zg-top-list", select);

  if (list) {
    list.style.setProperty("overflow", "visible", "important");
    list.style.setProperty("padding-bottom", "0", "important");
  }

  const secretPreview = $(".zg-secret-tops-preview", select);

  if (secretPreview) {
    secretPreview.style.setProperty("padding-bottom", "14px", "important");
    secretPreview.style.setProperty("margin-bottom", "72px", "important");
  }
}


  function installSelectScrollClamp() {
  const select = screenSelect();

  if (!select) return;

  forceSelectScrollable();

  if (select.dataset.scrollClampBound === "1") return;

  select.dataset.scrollClampBound = "1";

  let startY = 0;

  select.addEventListener(
    "touchstart",
    (event) => {
      if (!event.touches || !event.touches.length) return;

      startY = event.touches[0].clientY;
    },
    {
      passive: true
    }
  );

  select.addEventListener(
    "touchmove",
    (event) => {
      if (!event.touches || !event.touches.length) return;

      const currentY = event.touches[0].clientY;
      const diff = currentY - startY;

      const atTop = select.scrollTop <= 0;

      const atBottom =
        Math.ceil(select.scrollTop + select.clientHeight) >=
        select.scrollHeight;

      /*
       * 避免整個 LIFF WebView 被拖出橡皮筋。
       * 只在真的抵達上下邊界時 preventDefault。
       */
      if ((atTop && diff > 0) || (atBottom && diff < 0)) {
        event.preventDefault();
      }
    },
    {
      passive: false
    }
  );
}

  /*
   * =========================================================
   * 06. LAUNCH / CHARGE PAGE
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 06-1. BATTLE DOM
   * ---------------------------------------------------------
   */

  function ensureBattleDom(root = appRoot()) {
  let battle = screenBattle();

  if (!battle) {
    battle = document.createElement("section");
    battle.id = "screen-battle";
    battle.className = "zg-screen zg-battle-screen";
    root.appendChild(battle);
  }

  battle.innerHTML = `
    <div class="zg-battle-bg" aria-hidden="true">
      <div class="zg-battle-bg-orb zg-battle-bg-orb-red"></div>
      <div class="zg-battle-bg-orb zg-battle-bg-orb-blue"></div>
      <div class="zg-battle-bg-grid"></div>
      <div class="zg-battle-bg-vignette"></div>
    </div>

    <div class="zg-battle-main">
      <div class="zg-reference-layout">
        <div class="zg-hp-stage">
          <div class="zg-commentary" id="zg-commentary">
            準備發射！
          </div>

          <div class="zg-hp-group">
            <div class="zg-hp-row zg-hp-row-player">
              <div class="zg-hp-name">YOU</div>

              <div class="zg-hp-avatar zg-hp-avatar-player">
                <img
                  class="zg-hp-avatar-img zg-player-avatar-img"
                  src="${escapeAttr(DEFAULT_TOP_IMAGE)}"
                  alt="Player"
                />
              </div>

              <div class="zg-hp-bar">
                <div
                  id="zg-player-hp"
                  class="zg-hp-fill zg-player-hp zg-player-hp-fill"
                ></div>

                <div class="zg-hp-text zg-player-hp-text">
                  HP 100
                </div>
              </div>
            </div>

            <div class="zg-hp-row zg-hp-row-enemy">
              <div class="zg-hp-name">CPU</div>

              <div class="zg-hp-bar">
                <div
                  id="zg-enemy-hp"
                  class="zg-hp-fill zg-enemy-hp zg-enemy-hp-fill"
                ></div>

                <div class="zg-hp-text zg-enemy-hp-text">
                  HP 100
                </div>
              </div>

              <div class="zg-hp-avatar zg-hp-avatar-enemy">
                <img
                  class="zg-hp-avatar-img zg-enemy-avatar-img"
                  src="${escapeAttr(DEFAULT_TOP_IMAGE)}"
                  alt="Enemy"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="zg-arena-wrap">
          <div class="zg-battle-box" id="zg-battle-box">
            <img
              class="zg-arena-logo-img"
              src="${escapeAttr(ARENA_LOGO_URL)}"
              alt=""
              aria-hidden="true"
            />

            <div class="zg-arena-ring"></div>
            <div class="zg-danger-vignette"></div>
            <div class="zg-flash-overlay"></div>
            <div class="zg-xtreme-zone"></div>

            <div class="zg-pocket-zone p1"></div>
            <div class="zg-pocket-zone p2"></div>
            <div class="zg-pocket-zone p3"></div>
            <div class="zg-pocket-zone p4"></div>
          </div>
        </div>

        <div class="zg-battle-panel">
          <div class="zg-launch-row">
            ${renderChargeLayerHtml()}
          </div>

          <button
            type="button"
            class="zg-small-btn zg-exit-btn"
            data-zg-action="battle-back-select"
          >
            重新選擇
          </button>
        </div>
      </div>
    </div>
  `;

  battle.hidden = true;
  battle.setAttribute("aria-hidden", "true");

  removeDuplicateChargeDom();

  return battle;
}


  /*
   * ---------------------------------------------------------
   * 06-2. CHARGE UI HTML
   * ---------------------------------------------------------
   */

  function renderChargeLayerHtml() {
  return `
    <div class="zg-charge-layer" data-charge-grade="weak">
      <div class="zg-charge-card">
        <div class="zg-charge-head">
          <div class="zg-charge-title">
            長按蓄力
          </div>

          <div class="zg-charge-subtitle">
            放開發射
          </div>
        </div>

        <div class="zg-charge-meter">
          <div
            class="zg-energy-shell"
            style="--zg-charge-pct:0%;"
          >
            <div class="zg-energy-track"></div>

            <div
              class="zg-energy-fill"
              style="width:0%;"
            ></div>

            <div class="zg-energy-glow"></div>
            <div class="zg-energy-perfect-zone"></div>
            <div class="zg-energy-over-zone"></div>
            <div class="zg-energy-cap"></div>
          </div>

          <div class="zg-charge-percent-badge">
            0%
          </div>
        </div>

        <button
          type="button"
          class="zg-charge-btn"
          data-zg-action="charge"
          data-launch-ready="false"
          disabled
        >
          READY
        </button>

        <div class="zg-charge-hint">
          倒數結束後，按住按鈕蓄力，放開立即發射。
        </div>
      </div>
    </div>
  `;
}


  function getChargeUiEls() {
  const battle = screenBattle() || document;

  const els = {
    layer: $(".zg-charge-layer", battle),
    card: $(".zg-charge-card", battle),
    meter: $(".zg-charge-meter", battle),
    shell: $(".zg-energy-shell", battle),
    track: $(".zg-energy-track", battle),
    fill: $(".zg-energy-fill", battle),
    glow: $(".zg-energy-glow", battle),
    cap: $(".zg-energy-cap", battle),
    badge: $(".zg-charge-percent-badge", battle),
    button:
      $('[data-zg-action="charge"]', battle) ||
      $(".zg-charge-btn", battle),
    commentary: $("#zg-commentary", battle)
  };

  state.chargeUiEls = els;

  return els;
}


  function updateChargeUi(power) {
  const els = state.chargeUiEls || getChargeUiEls();

  const p = clamp(Number(power) || 0, 0, 1);
  const percent = Math.round(p * 100);
  const displayPercent = getLaunchDisplayPercent(p);
  const grade = getLaunchGrade(p);

  if (els.layer) {
    els.layer.dataset.chargeGrade = grade;
  }

  if (els.card) {
    els.card.dataset.grade = grade;
  }

  if (els.shell) {
    els.shell.style.setProperty("--zg-charge-pct", `${percent}%`);
    els.shell.dataset.grade = grade;
  }

  if (els.fill) {
    els.fill.style.width = `${percent}%`;
    els.fill.dataset.grade = grade;
  }

  if (els.cap) {
    els.cap.style.left = `${percent}%`;
    els.cap.dataset.grade = grade;
  }

  if (els.glow) {
    els.glow.style.left = `${percent}%`;
    els.glow.dataset.grade = grade;
  }

  if (els.badge) {
    els.badge.textContent = `${displayPercent}%`;
    els.badge.dataset.grade = grade;
  }

  if (els.button) {
    els.button.dataset.chargeGrade = grade;

    if (state.launchReady) {
      els.button.textContent =
        grade === "perfect"
          ? "PERFECT!"
          : grade === "over"
            ? "OVER!"
            : "RELEASE";
    } else {
      els.button.textContent = "READY";
    }
  }

  if (grade === "perfect") {
    const t = now();

    if (t - state.lastPerfectSoundAt > 320) {
      state.lastPerfectSoundAt = t;

      try {
        Sound.chargePerfect();
      } catch (error) {}
    }
  }
}


  function setLaunchButtonReady(ready) {
  const els = state.chargeUiEls || getChargeUiEls();

  state.launchReady = !!ready;

  if (!els.button) return;

  if (ready) {
    els.button.disabled = false;
    els.button.removeAttribute("disabled");
    els.button.dataset.launchReady = "true";
    els.button.classList.add("is-ready");
    els.button.classList.remove("is-disabled");
    els.button.textContent = "HOLD";
    els.button.style.setProperty("pointer-events", "auto", "important");
  } else {
    els.button.disabled = true;
    els.button.setAttribute("disabled", "disabled");
    els.button.dataset.launchReady = "false";
    els.button.classList.remove("is-ready");
    els.button.classList.add("is-disabled");
    els.button.textContent = "READY";
    els.button.style.setProperty("pointer-events", "none", "important");
  }
}

  /*
   * ---------------------------------------------------------
   * 06-3. CHARGE LOOP
   * ---------------------------------------------------------
   */

  function cancelChargeLoop() {
    state.charging = false;

    if (state.chargeRaf) {
      try {
        cancelAnimationFrame(state.chargeRaf);
      } catch (error) {}

      state.chargeRaf = null;
    }
  }

  function startChargeLoop() {
    if (!state.launchReady || state.running || state.finishing) return;
    if (state.charging) return;

    try {
      Sound.resume();
    } catch (error) {}

    state.charging = true;
    state.launchPower = 0;
    state.chargeDir = 1;
    state.chargeStartedAt = now();
    state.chargeLastFrameAt = now();

    updateChargeUi(0);
    setCommentary("蓄力中...瞄準白色 PERFECT 區！");

    const tick = () => {
      if (!state.charging) return;

      const t = now();
      const dt = clamp((t - state.chargeLastFrameAt) / 16.67, 0.25, 2.2);

      state.chargeLastFrameAt = t;

      let next = state.launchPower + CHARGE.speed * state.chargeDir * dt;

      if (next >= 1) {
        next = 1;
        state.chargeDir = -1;
      } else if (next <= 0) {
        next = 0;
        state.chargeDir = 1;
      }

      state.launchPower = next;

      try {
        Sound.chargeTick(next);
      } catch (error) {}

      updateChargeUi(next);

      state.chargeRaf = requestAnimationFrame(tick);
    };

    state.chargeRaf = requestAnimationFrame(tick);
  }

  function releaseChargeAndLaunch() {
    if (!state.launchReady || state.running || state.finishing) return;

    const power = clamp(Number(state.launchPower) || 0, 0, 1);

    cancelChargeLoop();

    state.launchReady = false;
    setLaunchButtonReady(false);

    updateChargeUi(power);

    const grade = getLaunchGrade(power);
    const effectivePower = getLaunchEffectivePower(power);

    const label =
      grade === "perfect"
        ? "PERFECT LAUNCH!"
        : grade === "over"
          ? "OVER LAUNCH!"
          : grade === "good"
            ? "GOOD LAUNCH!"
            : grade === "weak"
              ? "WEAK LAUNCH!"
              : "NORMAL LAUNCH!";

    setCommentary(label);

    try {
      Sound.launch();
    } catch (error) {}

    try {
      if (typeof BattleMusic !== "undefined" && BattleMusic) {
        BattleMusic.play();
      }
    } catch (error) {}

    startBattleWithPower(effectivePower, {
      rawPower: power,
      grade
    });
  }

  /*
   * ---------------------------------------------------------
   * 06-4. CHARGE BUTTON BINDING
   * ---------------------------------------------------------
   */

  function bindBattleChargeButton() {
    const els = getChargeUiEls();

    if (!els.button) return;

    if (els.button.dataset.chargeBound === "1") return;

    els.button.dataset.chargeBound = "1";

    const start = (event) => {
      if (event) {
        try {
          event.preventDefault();
        } catch (error) {}
      }

      if (!state.launchReady || els.button.disabled) return;

      startChargeLoop();
    };

    const end = (event) => {
      if (event) {
        try {
          event.preventDefault();
        } catch (error) {}
      }

      if (!state.charging) return;

      releaseChargeAndLaunch();
    };

    els.button.addEventListener("pointerdown", start, {
      passive: false
    });

    window.addEventListener("pointerup", end, {
      passive: false
    });

    window.addEventListener("pointercancel", end, {
      passive: false
    });

    els.button.addEventListener("touchstart", start, {
      passive: false
    });

    window.addEventListener("touchend", end, {
      passive: false
    });

    window.addEventListener("touchcancel", end, {
      passive: false
    });

    els.button.addEventListener("mousedown", start, {
      passive: false
    });

    window.addEventListener("mouseup", end, {
      passive: false
    });
  }

  /*
   * ---------------------------------------------------------
   * 06-5. LAUNCH PREP / COUNTDOWN
   * ---------------------------------------------------------
   */

  function renderLaunchPrep() {
    ensureBattleDom(appRoot());
    removeDuplicateChargeDom();

    const selected = state.selectedTop || loadSelectedTop();
    const enemy = pick(TOPS.filter((top) => top.id !== selected.id)) || TOPS[1];

    state.selectedTop = selected;
    state.enemyTop = enemy;

    const playerAvatar = $(".zg-player-avatar-img", screenBattle() || document);
    const enemyAvatar = $(".zg-enemy-avatar-img", screenBattle() || document);

    if (playerAvatar) {
      playerAvatar.src = getTopBattleImage(selected);
      playerAvatar.alt = selected.name || "Player";
    }

    if (enemyAvatar) {
      enemyAvatar.src = getTopBattleImage(enemy);
      enemyAvatar.alt = enemy.name || "Enemy";
    }

    getChargeUiEls();
    updateChargeUi(0);
    setLaunchButtonReady(false);
    bindBattleChargeButton();

    setCommentary("3");

    state.launchCountdownToken += 1;

    const token = state.launchCountdownToken;

    const showCountdown = (text, delay) => {
      setTimeout(() => {
        if (token !== state.launchCountdownToken) return;
        if (state.screen !== "battle") return;

        setCommentary(text);

        const commentary = $("#zg-commentary", screenBattle() || document);
        if (commentary) restartClass(commentary, "is-pop", 260);

        try {
          if (text === "GO!") {
            Sound.chargePerfect();
          } else {
            Sound.chargeTick(0.5);
          }
        } catch (error) {}
      }, delay);
    };

    showCountdown("3", 0);
    showCountdown("2", 700);
    showCountdown("1", 1400);
    showCountdown("GO!", 2100);

    setTimeout(() => {
      if (token !== state.launchCountdownToken) return;
      if (state.screen !== "battle") return;

      setLaunchButtonReady(true);
      setCommentary("按住蓄力，放開發射！");
      updateChargeUi(0);
    }, 2400);
  }

  function enterBattlePrep() {
    if (isDailyBlocked()) {
      alert("今日遊玩次數已用完，明天再來挑戰！");
      return;
    }

    ensureBattleDom(appRoot());

    try {
      stopHomeVideo();
      stopHomeMusic();
      Sound.resume();
      BattleMusic.play();
    } catch (error) {}

    showScreen("battle");
    renderLaunchPrep();

    track("battle_prepare", {
      selectedTop: state.selectedTop ? state.selectedTop.id : "",
      remainingPlays: state.remainingPlays
    });
  }
  /*
   * =========================================================
   * 07. BATTLE PAGE / PHYSICS / FINISH
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 07-1. Battle State Build
   * ---------------------------------------------------------
   */

  function makeBattleTop(top, side, launchPower = 1) {
    const box = battleBox();
    const rect = box
      ? box.getBoundingClientRect()
      : {
          width: window.innerWidth,
          height: window.innerHeight
        };

    const feel = getFeel(top);
    const isPlayer = side === "player";

    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const angle = isPlayer
      ? rand(-0.28, 0.28)
      : Math.PI + rand(-0.28, 0.28);

    const startRadius = Math.min(rect.width, rect.height) * 0.28;

    const x = cx + Math.cos(angle) * startRadius;
    const y = cy + Math.sin(angle) * startRadius;

    const baseSpeed =
      PHY.launchSpeed *
      launchPower *
      feel.launchKick *
      (0.86 + Number(top.speed || 75) / 170);

    const vx =
      Math.cos(angle + Math.PI + rand(-0.22, 0.22)) *
      baseSpeed;

    const vy =
      Math.sin(angle + Math.PI + rand(-0.22, 0.22)) *
      baseSpeed;

    const maxHp =
      100 +
      Math.round((Number(top.defense || 75) - 70) * 0.28);

    const maxEnergy =
      100 +
      Math.round((Number(top.stamina || 75) - 70) * 0.32);

    const spin =
      100 +
      Math.round((Number(top.stamina || 75) - 70) * 0.22) +
      Math.round((Number(top.speed || 75) - 70) * 0.12);

    return {
      side,
      top,
      feel,

      x,
      y,
      vx,
      vy,

      radius: PHY.radius,

      angle: rand(0, Math.PI * 2),
      spin,
      maxSpin: Math.max(80, spin),

      hp: maxHp,
      maxHp,

      energy: maxEnergy,
      maxEnergy,

      power: Number(top.power || 75),
      defense: Number(top.defense || 75),
      stamina: Number(top.stamina || 75),
      speed: Number(top.speed || 75),

      alive: true,
      eliminated: false,
      burst: false,
      over: false,
      xtreme: false,

      lastHitAt: 0,
      lastWallAt: 0,
      lastDamageAt: 0,

      wobble: 0,
      combo: 0,

      dom: null,
      img: null
    };
  }

  function createBattleState(launchPower = 1, launchMeta = {}) {
    const selected = state.selectedTop || loadSelectedTop();
    const enemy =
      state.enemyTop ||
      pick(TOPS.filter((top) => top.id !== selected.id)) ||
      TOPS[1];

    state.selectedTop = selected;
    state.enemyTop = enemy;

    const player = makeBattleTop(selected, "player", launchPower);

    /*
     * 敵方也有隨機發射品質，但略低於玩家 Perfect 上限。
     */
    const enemyLaunchPower = clamp(rand(0.78, 0.94), 0.65, 0.98);
    const enemyTop = makeBattleTop(enemy, "enemy", enemyLaunchPower);

    const box = battleBox();
    const rect = box
      ? box.getBoundingClientRect()
      : {
          width: window.innerWidth,
          height: window.innerHeight
        };

    return {
      startedAt: now(),
      lastCollisionAt: 0,
      lastWallAt: 0,

      width: rect.width,
      height: rect.height,
      cx: rect.width / 2,
      cy: rect.height / 2,
      arenaRadius:
        Math.min(rect.width, rect.height) / 2 -
        PHY.ringPadding -
        PHY.radius,

      player,
      enemy: enemyTop,

      launchPower,
      launchMeta,

      score: 0,
      hits: 0,
      maxCombo: 0,
      totalDamage: 0,
      playerDamageTaken: 0,
      enemyDamageTaken: 0,

      finishType: "",
      winner: "",
      ended: false
    };
  }

  /*
   * ---------------------------------------------------------
   * 07-2. Battle DOM / Visuals
   * ---------------------------------------------------------
   */

  function clearBattleVisualDom() {
    const box = battleBox();

    if (!box) return;

    [
      ".zg-battle-top",
      ".zg-spark",
      ".zg-impact-ring",
      ".zg-metal-spark",
      ".zg-scratch",
      ".zg-launch-shockwave",
      ".zg-spin-afterimage",
      ".zg-impact-streak",
      ".zg-burst-piece",
      ".zg-wall-flash"
    ].forEach((selector) => {
      $$(selector, box).forEach((el) => {
        try {
          el.remove();
        } catch (error) {}
      });
    });

    if (typeof PERF !== "undefined") {
      PERF.activeFx = 0;
    }
  }

  function createBattleTopDom(item) {
  const box = battleBox();

  if (!box || !item) return null;

  const typeClass = item.top?.type || "";

  const el = document.createElement("div");

  el.className =
    item.side === "player"
      ? `zg-battle-top zg-player-top ${typeClass}`
      : `zg-battle-top zg-enemy-top ${typeClass}`;

  el.dataset.side = item.side;
  el.dataset.topId = item.top?.id || "";
  el.dataset.topType = item.top?.type || "";

  el.innerHTML = `
    <img
      class="zg-battle-top-img zg-battle-top-photo zg-battle-top-photo-no-base"
      src="${escapeAttr(getTopBattleImage(item.top))}"
      alt="${escapeAttr(item.top?.name || item.side)}"
      draggable="false"
    />
    <span class="zg-battle-top-glow"></span>
    <span class="zg-battle-top-shadow"></span>
  `;

  box.appendChild(el);

  item.dom = el;
  item.img =
    $(".zg-battle-top-img", el) ||
    $(".zg-battle-top-photo", el);

  return el;
}


  function renderBattleTops() {
    const battle = state.battle;

    if (!battle) return;

    [battle.player, battle.enemy].forEach((item) => {
      if (!item || !item.dom) return;

      item.angle += item.spin * 0.003;

      const scale =
        1 +
        clamp(item.wobble, 0, 12) * 0.006;

      item.dom.style.transform = `
        translate3d(${item.x - item.radius}px, ${item.y - item.radius}px, 0)
        rotate(${item.angle}rad)
        scale(${scale})
      `;

      item.dom.style.opacity = item.alive ? "1" : "0.35";

      const spinRatio = clamp(item.spin / item.maxSpin, 0, 1);

      item.dom.style.setProperty("--zg-spin-ratio", String(spinRatio));
      item.dom.style.setProperty("--zg-energy-ratio", String(item.energy / item.maxEnergy));
      item.dom.style.setProperty("--zg-hp-ratio", String(item.hp / item.maxHp));
    });
  }

  function updateBattleHpUi(force = false) {
    const battle = state.battle;

    if (!battle) return;

    const t = now();

    if (!force && t - PERF.lastHpUiAt < 80) return;

    PERF.lastHpUiAt = t;

    const updateOne = (item, fillSelector, textSelector, avatarSelector) => {
      const fill = $(fillSelector, screenBattle() || document);
      const text = $(textSelector, screenBattle() || document);
      const avatar = $(avatarSelector, screenBattle() || document);

      const hpRatio = clamp(item.hp / item.maxHp, 0, 1);
      const energyRatio = clamp(item.energy / item.maxEnergy, 0, 1);
      const spinRatio = clamp(item.spin / item.maxSpin, 0, 1);

      /*
       * 能量條與 HP / 轉速 / energy 聯動：
       * 視覺上使用三者加權，不改遊戲判定。
       */
      const visualRatio = clamp(
        hpRatio * 0.58 + energyRatio * 0.28 + spinRatio * 0.14,
        0,
        1
      );

      if (fill) {
        fill.style.width = `${Math.round(visualRatio * 100)}%`;
        fill.dataset.danger = visualRatio < 0.32 ? "1" : "0";
      }

      if (text) {
        text.textContent = `HP ${Math.max(0, Math.ceil(item.hp))}`;
      }

      if (avatar) {
        avatar.src = getTopBattleImage(item.top);
      }
    };

    updateOne(
      battle.player,
      ".zg-player-hp-fill",
      ".zg-player-hp-text",
      ".zg-player-avatar-img"
    );

    updateOne(
      battle.enemy,
      ".zg-enemy-hp-fill",
      ".zg-enemy-hp-text",
      ".zg-enemy-avatar-img"
    );
  }

  /*
   * ---------------------------------------------------------
   * 07-3. Battle FX
   * ---------------------------------------------------------
   */

  function spawnImpactRing(x, y, power = 1) {
    if (!canFx(PERF.minShockwaveGap)) return;

    const box = battleBox();

    if (!box) return;

    const el = document.createElement("div");
    el.className = "zg-impact-ring";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("--zg-impact-scale", String(clamp(power, 0.6, 2.4)));

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      try {
        el.remove();
      } catch (error) {}

      fxRemove();
    }, 520);
  }

  function spawnSpark(x, y, power = 1) {
    if (!canFx(70)) return;

    const box = battleBox();

    if (!box) return;

    const count = fxCount(10, power);

    for (let i = 0; i < count; i += 1) {
      const el = document.createElement("span");
      el.className = "zg-metal-spark";

      const angle = rand(0, Math.PI * 2);
      const dist = rand(20, 76) * clamp(power, 0.6, 1.8);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.setProperty("--zg-spark-x", `${Math.cos(angle) * dist}px`);
      el.style.setProperty("--zg-spark-y", `${Math.sin(angle) * dist}px`);
      el.style.setProperty("--zg-spark-rot", `${rand(-220, 220)}deg`);

      fxAdd();
      box.appendChild(el);

      setTimeout(() => {
        try {
          el.remove();
        } catch (error) {}

        fxRemove();
      }, 480);
    }
  }

  function spawnWallFlash(x, y) {
    const t = now();

    if (t - PERF.lastScratchAt < PERF.minScratchGap) return;

    PERF.lastScratchAt = t;

    const box = battleBox();

    if (!box) return;

    const el = document.createElement("div");
    el.className = "zg-wall-flash";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    fxAdd();
    box.appendChild(el);

    setTimeout(() => {
      try {
        el.remove();
      } catch (error) {}

      fxRemove();
    }, 420);
  }

  function shakeBattleBox(power = 1) {
    const box = battleBox();

    if (!box) return;

    box.style.setProperty("--zg-shake-power", String(clamp(power, 0.4, 2.4)));
    restartClass(box, "is-hit", 260);
  }

  function pulseHpUi(item) {
    const t = now();

    if (t - PERF.lastHpPulseAt < 120) return;

    PERF.lastHpPulseAt = t;

    const rowSelector =
      item.side === "player"
        ? ".zg-hp-row-player"
        : ".zg-hp-row-enemy";

    const row = $(rowSelector, screenBattle() || document);

    if (row) {
      restartClass(row, "is-damaged", 360);
    }
  }

  /*
   * ---------------------------------------------------------
   * 07-4. Physics Helpers
   * ---------------------------------------------------------
   */

  function speedOf(item) {
    return Math.sqrt(item.vx * item.vx + item.vy * item.vy);
  }

  function normalizeVelocity(item, maxSpeed = PHY.maxSpeed) {
    const sp = speedOf(item);

    if (sp <= maxSpeed || sp <= 0.0001) return;

    const s = maxSpeed / sp;

    item.vx *= s;
    item.vy *= s;
  }

  function applyArenaForces(item, dt) {
    const battle = state.battle;

    if (!battle || !item.alive) return;

    const dx = battle.cx - item.x;
    const dy = battle.cy - item.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    /*
     * 往中心些微拉回，避免雙方一直在牆邊滑。
     */
    const centerForce =
      PHY.centerPull *
      (1 + (1 - clamp(item.energy / item.maxEnergy, 0, 1)) * 0.55);

    item.vx += (dx / dist) * centerForce * dt;
    item.vy += (dy / dist) * centerForce * dt;

    /*
     * 旋轉軌道力，讓移動比較像陀螺戰鬥。
     */
    const tangentX = -dy / dist;
    const tangentY = dx / dist;

    const orbitSign = item.side === "player" ? 1 : -1;

    item.vx += tangentX * PHY.orbitForce * orbitSign * item.feel.mobility * dt;
    item.vy += tangentY * PHY.orbitForce * orbitSign * item.feel.mobility * dt;

    /*
     * 互相靠近。
     */
    const other =
      item.side === "player"
        ? battle.enemy
        : battle.player;

    if (other && other.alive) {
      const odx = other.x - item.x;
      const ody = other.y - item.y;
      const od = Math.sqrt(odx * odx + ody * ody) || 1;

      item.vx += (odx / od) * PHY.engagePull * item.feel.mobility * dt;
      item.vy += (ody / od) * PHY.engagePull * item.feel.mobility * dt;
    }
  }

  function applyNaturalDrain(item, dt) {
    const battle = state.battle;

    if (!battle || !item.alive) return;

    const elapsed = now() - battle.startedAt;

    const spinRatio = clamp(item.spin / item.maxSpin, 0, 1);
    const speedRatio = clamp(speedOf(item) / PHY.maxSpeed, 0, 1);

    const drain =
      PHY.naturalEnergyDrain +
      PHY.spinEnergyDrain * spinRatio +
      PHY.speedEnergyDrain * speedRatio +
      PHY.wobbleEnergyDrain * clamp(item.wobble / 16, 0, 1);

    const nextEnergy = item.energy - drain * dt;

    if (
      !PHY.naturalEnergyCanKill &&
      elapsed < PHY.naturalKillGraceMs
    ) {
      item.energy = Math.max(1, nextEnergy);
    } else if (!PHY.naturalEnergyCanKill) {
      item.energy = Math.max(1, nextEnergy);
    } else {
      item.energy = Math.max(0, nextEnergy);
    }

    item.spin = Math.max(0, item.spin - PHY.spinDrain * dt * item.feel.friction);
    item.wobble = Math.max(0, item.wobble - 0.26 * dt);
  }

  function integrateTop(item, dt) {
    if (!item.alive) return;

    applyArenaForces(item, dt);

    const friction =
      Math.pow(PHY.friction, dt) *
      Math.pow(item.feel.friction, 0.012 * dt);

    item.vx *= friction;
    item.vy *= friction;

    item.spin *= Math.pow(PHY.spinDecay, dt / item.feel.stability);

    item.x += item.vx * dt;
    item.y += item.vy * dt;

    normalizeVelocity(item, PHY.maxSpeed);

    applyWallCollision(item);
    applyNaturalDrain(item, dt);
  }

  function applyWallCollision(item) {
    const battle = state.battle;

    if (!battle || !item.alive) return;

    const dx = item.x - battle.cx;
    const dy = item.y - battle.cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    const limit = battle.arenaRadius;

    if (dist <= limit) return;

    const nx = dx / dist;
    const ny = dy / dist;

    item.x = battle.cx + nx * limit;
    item.y = battle.cy + ny * limit;

    const dot = item.vx * nx + item.vy * ny;

    /*
     * 牆壁反彈：
     * 只反彈、不扣 HP / energy。
     */
    if (dot > 0) {
      item.vx -= (1 + PHY.wallRestitution) * dot * nx;
      item.vy -= (1 + PHY.wallRestitution) * dot * ny;
    }

    item.vx *= PHY.wallBounce;
    item.vy *= PHY.wallBounce;

    item.spin = Math.max(0, item.spin - PHY.railSpinLoss);
    item.wobble += 1.8;

    const t = now();

    if (t - item.lastWallAt > 180) {
      item.lastWallAt = t;

      spawnWallFlash(item.x, item.y);

      try {
        Sound.rail(clamp(speedOf(item) / 8, 0.3, 1.7));
      } catch (error) {}
    }
  }

  /*
   * ---------------------------------------------------------
   * 07-5. Collision / Damage
   * ---------------------------------------------------------
   */

  function resolveCollision() {
    const battle = state.battle;

    if (!battle || battle.ended) return;

    const a = battle.player;
    const b = battle.enemy;

    if (!a.alive || !b.alive) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const minDist = a.radius + b.radius;

    if (dist >= minDist) return;

    const t = now();

    if (t - battle.lastCollisionAt < PHY.collisionCooldown) {
      /*
       * 即使冷卻中，也要做分離，避免重疊卡住。
       */
      separateTops(a, b, dx, dy, dist, minDist);
      return;
    }

    battle.lastCollisionAt = t;

    separateTops(a, b, dx, dy, dist, minDist);

    const nx = dx / dist;
    const ny = dy / dist;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;

    const velAlongNormal = rvx * nx + rvy * ny;

    if (velAlongNormal > 0) return;

    const impulse =
      (-(1 + PHY.hitRestitution) * velAlongNormal) / 2;

    const ix = impulse * nx;
    const iy = impulse * ny;

    a.vx -= ix;
    a.vy -= iy;
    b.vx += ix;
    b.vy += iy;

    /*
     * 切線動量交換，增加旋轉撞擊感。
     */
    const tx = -ny;
    const ty = nx;

    const tangentImpulse =
      ((a.spin - b.spin) * PHY.tangentTransfer) / 100;

    a.vx += tx * tangentImpulse;
    a.vy += ty * tangentImpulse;
    b.vx -= tx * tangentImpulse;
    b.vy -= ty * tangentImpulse;

    normalizeVelocity(a);
    normalizeVelocity(b);

    const impact =
      Math.abs(velAlongNormal) +
      Math.abs(a.spin - b.spin) * 0.018 +
      speedOf(a) * 0.12 +
      speedOf(b) * 0.12;

    const impactPower = clamp(impact / 8, 0.25, 2.4);

    if (impactPower < PHY.minCollisionEnergy) return;

    const hitX = (a.x + b.x) / 2;
    const hitY = (a.y + b.y) / 2;

    battle.hits += 1;
    battle.player.combo += 1;
    battle.enemy.combo += 1;
    battle.maxCombo = Math.max(
      battle.maxCombo,
      battle.player.combo,
      battle.enemy.combo
    );

    state.firstCollision = true;
    state.lastEffectiveHitAt = t;

    /*
     * 傷害計算：
     * 攻擊方 power / sharpness 影響傷害。
     * 防禦方 defense / stability 降低傷害。
     */
    const damageToEnemy = computeCollisionDamage(a, b, impactPower);
    const damageToPlayer = computeCollisionDamage(b, a, impactPower);

    applyCollisionDamage(b, damageToEnemy, a);
    applyCollisionDamage(a, damageToPlayer, b);

    const energyDamage =
      impactPower *
      PHY.energyDamageScale *
      (0.8 + Math.random() * 0.4);

    a.energy = Math.max(0, a.energy - energyDamage * (1 / a.feel.stability));
    b.energy = Math.max(0, b.energy - energyDamage * (1 / b.feel.stability));

    a.spin = Math.max(
      0,
      a.spin - PHY.collisionSpinLoss * impactPower * (1 / a.feel.stability)
    );

    b.spin = Math.max(
      0,
      b.spin - PHY.collisionSpinLoss * impactPower * (1 / b.feel.stability)
    );

    a.wobble += impactPower * 2.2;
    b.wobble += impactPower * 2.2;

    battle.totalDamage += damageToEnemy + damageToPlayer;
    battle.enemyDamageTaken += damageToEnemy;
    battle.playerDamageTaken += damageToPlayer;

    if (damageToEnemy >= damageToPlayer) {
      battle.score += Math.round(impactPower * 18 + damageToEnemy * 2);
    } else {
      battle.score += Math.round(impactPower * 8);
    }

    spawnImpactRing(hitX, hitY, impactPower);
    spawnSpark(hitX, hitY, impactPower);

    shakeBattleBox(impactPower);

    pulseHpUi(a);
    pulseHpUi(b);

    try {
      Sound.metal(impactPower, (a.feel.hitSharpness + b.feel.hitSharpness) / 2);
    } catch (error) {}

    updateBattleHpUi(true);
  }

  function separateTops(a, b, dx, dy, dist, minDist) {
    const overlap = minDist - dist;

    if (overlap <= 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const push = overlap / 2 + PHY.separationBias;

    a.x -= nx * push;
    a.y -= ny * push;
    b.x += nx * push;
    b.y += ny * push;
  }

  function computeCollisionDamage(attacker, defender, impactPower) {
    const attackValue =
      attacker.power *
      attacker.feel.attack *
      attacker.feel.hitSharpness;

    const defenseValue =
      defender.defense *
      defender.feel.defense *
      defender.feel.stability;

    const raw =
      impactPower *
      PHY.damageScale *
      (attackValue / Math.max(40, defenseValue)) *
      28;

    const spinBonus =
      Math.max(0, attacker.spin - defender.spin) *
      PHY.spinDamageScale *
      attacker.feel.attack;

    const damage = raw + spinBonus;

    return clamp(
      damage,
      1,
      PHY.maxCollisionDamage
    );
  }

  function applyCollisionDamage(target, damage, attacker) {
    if (!target || !target.alive) return;

    const safeDamage = Math.max(0, Number(damage) || 0);

    target.hp = Math.max(0, target.hp - safeDamage);
    target.lastDamageAt = now();

    /*
     * HP 越低越不穩。
     */
    const hpRatio = clamp(target.hp / target.maxHp, 0, 1);
    target.wobble += (1 - hpRatio) * 2.6;

    /*
     * 攻擊者獲得些微追擊速度。
     */
    if (attacker && attacker.alive) {
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      attacker.vx += (dx / dist) * 0.16 * attacker.feel.mobility;
      attacker.vy += (dy / dist) * 0.16 * attacker.feel.mobility;
    }
  }

  /*
   * ---------------------------------------------------------
   * 07-6. Battle Finish Check
   * ---------------------------------------------------------
   */

  function checkFinish() {
    const battle = state.battle;

    if (!battle || battle.ended || state.finishing) return;

    const player = battle.player;
    const enemy = battle.enemy;

    const playerDead =
      player.hp <= 0 ||
      player.energy <= 0;

    const enemyDead =
      enemy.hp <= 0 ||
      enemy.energy <= 0;

    if (playerDead && enemyDead) {
      finishBattleWithRule("draw", "draw");
      return;
    }

    if (enemyDead) {
      const rule = chooseFinishRule(player, enemy);
      finishBattleWithRule("player", rule);
      return;
    }

    if (playerDead) {
      const rule = chooseFinishRule(enemy, player);
      finishBattleWithRule("enemy", rule);
      return;
    }

    /*
     * 不因時間到、轉速歸零、中央決勝而提前結束。
     * 這裡只保留防呆：超長時間仍判斷較高 HP 勝。
     */
    const elapsed = now() - battle.startedAt;

    if (elapsed > PHY.maxBattleMs) {
      if (player.hp === enemy.hp) {
        finishBattleWithRule("draw", "draw");
      } else {
        finishBattleWithRule(
          player.hp > enemy.hp ? "player" : "enemy",
          "spin_finish"
        );
      }
    }
  }

  function chooseFinishRule(winner, loser) {
    if (!winner || !loser) return "spin_finish";

    const hpLossRatio = 1 - clamp(loser.hp / loser.maxHp, 0, 1);
    const energyRatio = clamp(loser.energy / loser.maxEnergy, 0, 1);
    const impactGap = Math.max(0, winner.power - loser.defense);

    /*
     * 爆裂：
     * HP 被打空，且攻擊差距或撞擊壓力較高。
     */
    if (
      loser.hp <= 0 &&
      (
        hpLossRatio > 0.92 ||
        impactGap > 20 ||
        state.damagePressure > 1.25
      )
    ) {
      loser.burst = true;
      return "burst_finish";
    }

    /*
     * 擊飛：
     * energy 很低，或離中心太遠。
     */
    const battle = state.battle;

    if (battle) {
      const dx = loser.x - battle.cx;
      const dy = loser.y - battle.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (
        energyRatio <= 0.08 ||
        dist > battle.arenaRadius * 0.94
      ) {
        loser.over = true;
        return "over_finish";
      }
    }

    /*
     * Xtreme：
     * 保留特殊判定，通常出現在超高衝擊差。
     */
    if (
      winner.power > 90 &&
      winner.speed > 88 &&
      loser.hp <= 0 &&
      Math.random() < 0.18
    ) {
      loser.xtreme = true;
      return "xtreme_finish";
    }

    return "spin_finish";
  }

  function finishBattleWithRule(winner, finishType) {
    const battle = state.battle;

    if (!battle || battle.ended || state.finishing) return;

    battle.ended = true;
    battle.winner = winner;
    battle.finishType = finishType;

    finishBattle(buildBattleResultPayload(battle));
  }

  /*
   * ---------------------------------------------------------
   * 07-7. Battle Loop
   * ---------------------------------------------------------
   */

  function battleLoop(timestamp) {
    if (!state.running || !state.battle || state.paused) return;

    const battle = state.battle;

    if (!state.lastFrame) {
      state.lastFrame = timestamp;
    }

    const rawDt = timestamp - state.lastFrame;
    state.lastFrame = timestamp;

    const dt = clamp(rawDt / 16.67, 0.25, 2.4);

    updatePerf(dt);

    integrateTop(battle.player, dt);
    integrateTop(battle.enemy, dt);

    resolveCollision();

    renderBattleTops();
    updateBattleHpUi(false);
    updateBattleHum();

    checkFinish();

    if (state.running && !battle.ended && !state.finishing) {
      state.raf = requestAnimationFrame(battleLoop);
    }
  }

  function updateBattleHum() {
    const battle = state.battle;

    if (!battle) return;

    const playerRatio = clamp(battle.player.spin / battle.player.maxSpin, 0, 1);
    const enemyRatio = clamp(battle.enemy.spin / battle.enemy.maxSpin, 0, 1);

    try {
      Sound.updateHum(
        0,
        playerRatio,
        battle.player.feel.humBase,
        battle.player.feel.humGain
      );

      Sound.updateHum(
        1,
        enemyRatio,
        battle.enemy.feel.humBase,
        battle.enemy.feel.humGain
      );
    } catch (error) {}
  }

  function stopBattle() {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      try {
        cancelAnimationFrame(state.raf);
      } catch (error) {}

      state.raf = null;
    }

    try {
      Sound.stopHum();
    } catch (error) {}

    /*
     * stopBattle 不主動清 battle 結果，
     * 以免 finishBattle 後 onResultShown 找不到 state.lastBattleResult。
     */
  }

  /*
   * ---------------------------------------------------------
   * 07-8. Start Battle
   * ---------------------------------------------------------
   */

  function startBattleWithPower(launchPower = 1, launchMeta = {}) {
    if (state.running || state.finishing) return;

    const box = battleBox();

    if (!box) {
      console.warn("[ZELO] battle box missing");
      return;
    }

    clearBattleVisualDom();

    const battle = createBattleState(launchPower, launchMeta);

    state.battle = battle;
    state.running = true;
    state.paused = false;
    state.lastFrame = 0;
    state.finishing = false;
    state.finishStartedAt = 0;
    state.pendingResult = null;
    state.firstCollision = false;
    state.killcamPlayed = false;
    state.lastEffectiveHitAt = 0;
    state.damagePressure = 1;

    createBattleTopDom(battle.player);
    createBattleTopDom(battle.enemy);

    renderBattleTops();
    updateBattleHpUi(true);

    setCommentary("戰鬥開始！");

    try {
      Sound.resume();
      Sound.startHum(0, battle.player.feel.humBase);
      Sound.startHum(1, battle.enemy.feel.humBase);
    } catch (error) {}

    try {
      BattleMusic.play();
    } catch (error) {}

    try {
      const boxRect = box.getBoundingClientRect();
      spawnImpactRing(boxRect.width / 2, boxRect.height / 2, 1.2);
    } catch (error) {}

    increaseDailyPlay();

    track("battle_start", {
      selectedTop: battle.player.top?.id || "",
      enemyTop: battle.enemy.top?.id || "",
      launchPower,
      rawPower: launchMeta.rawPower || "",
      grade: launchMeta.grade || "",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays
    });

    state.raf = requestAnimationFrame(battleLoop);
  }

  /*
   * ---------------------------------------------------------
   * 07-9. Result Payload
   * ---------------------------------------------------------
   */

  function getFinishInfo(finishType) {
    return (
      BATTLE_FINISH_RULES[finishType] ||
      BATTLE_FINISH_RULES.spin_finish
    );
  }

  function getBattleRank(score) {
    const s = Number(score) || 0;

    if (s >= 5200) return "S+";
    if (s >= 4300) return "S";
    if (s >= 3400) return "A";
    if (s >= 2500) return "B";
    if (s >= 1600) return "C";

    return "D";
  }

  function buildBattleResultPayload(battle) {
    const winner = battle.winner || "draw";
    const isWin = winner === "player";
    const isLose = winner === "enemy";
    const isDraw = winner === "draw";

    const finishInfo = getFinishInfo(battle.finishType || "spin_finish");

    const baseScore =
      battle.score +
      battle.hits * 35 +
      battle.maxCombo * 80 +
      Math.round(battle.enemyDamageTaken * 18);

    const winBonus = isWin ? 1200 : isDraw ? 450 : 120;
    const finishBonus = finishInfo.points * 680;

    const hpBonus = isWin
      ? Math.round(clamp(battle.player.hp / battle.player.maxHp, 0, 1) * 600)
      : 0;

    const launchBonus =
      battle.launchMeta?.grade === "perfect"
        ? 900
        : battle.launchMeta?.grade === "good"
          ? 420
          : battle.launchMeta?.grade === "over"
            ? 120
            : 0;

    const totalScore = Math.max(
      0,
      Math.round(baseScore + winBonus + finishBonus + hpBonus + launchBonus)
    );

    const oldScore = getMyScore();
    const nextScore = Math.max(oldScore, totalScore);

    const rank = getBattleRank(totalScore);

    const title = isDraw
      ? "平手！"
      : isWin
        ? finishInfo.winTitle
        : finishInfo.loseTitle;

    const subtitle = isWin
      ? "漂亮的戰鬥！你的陀螺拿下勝利。"
      : isDraw
        ? "雙方勢均力敵，這場戰鬥沒有輸家。"
        : "再調整發射時機，下次一定可以反擊。";

    const coupon = drawCouponReward();

    return {
      version: VERSION,
      id:
        "battle_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 8),

      createdAt: new Date().toISOString(),
      ts: Date.now(),

      title,
      subtitle,

      isWin,
      isLose,
      isDraw,
      winner,

      finishType: battle.finishType || "spin_finish",
      finishLabel: finishInfo.label,
      finishPoints: finishInfo.points,

      selectedTop: battle.player.top,
      enemyTop: battle.enemy.top,

      selectedTopId: battle.player.top?.id || "",
      enemyTopId: battle.enemy.top?.id || "",

      launchPower: battle.launchPower,
      launchRawPower: battle.launchMeta?.rawPower || battle.launchPower,
      launchGrade: battle.launchMeta?.grade || "",

      score: totalScore,
      totalScore,
      oldBestScore: oldScore,
      bestScore: Math.max(nextScore, oldScore),
      rank,

      battleScore: battle.score,
      hits: battle.hits,
      maxCombo: battle.maxCombo,
      totalDamage: Math.round(battle.totalDamage),
      enemyDamageTaken: Math.round(battle.enemyDamageTaken),
      playerDamageTaken: Math.round(battle.playerDamageTaken),

      playerHp: Math.max(0, Math.round(battle.player.hp)),
      enemyHp: Math.max(0, Math.round(battle.enemy.hp)),
      playerEnergy: Math.max(0, Math.round(battle.player.energy)),
      enemyEnergy: Math.max(0, Math.round(battle.enemy.energy)),

      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,

      coupon,

      profile:
        typeof getCurrentLinePlayer === "function"
          ? getCurrentLinePlayer()
          : null,

      referralCode:
        typeof getMyReferralCode === "function"
          ? getMyReferralCode()
          : "",

      inviterReferralCode:
        typeof getSavedInviterReferralCode === "function"
          ? getSavedInviterReferralCode()
          : "",

      debug: {
        battleStartedAt: battle.startedAt,
        battleDurationMs: Math.round(now() - battle.startedAt),
        launchMeta: battle.launchMeta,
        phy: {
          naturalEnergyCanKill: PHY.naturalEnergyCanKill,
          hpOnlyFinish: PHY.hpOnlyFinish
        }
      }
    };
  }

  function drawCouponReward() {
    const r = Math.random();
    let acc = 0;

    for (const reward of COUPON_REWARDS) {
      acc += reward.rate;

      if (r <= acc) {
        const code =
          reward.fixedCode ||
          `${reward.codePrefix}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`;

        const coupon = {
          ...reward,
          code,
          wonAt: new Date().toISOString()
        };

        state.lastCouponReward = coupon;

        try {
          localStorage.setItem(STORAGE.lastCoupon, JSON.stringify(coupon));
        } catch (error) {}

        return coupon;
      }
    }

    return null;
  }

  /*
   * ---------------------------------------------------------
   * 07-10. Finish Battle
   * ---------------------------------------------------------
   */

  function finishBattle(resultPayload) {
    if (state.finishing) return;

    state.finishing = true;
    state.finishStartedAt = now();
    state.pendingResult = resultPayload;

    stopBattle();

    try {
      Sound.death();
    } catch (error) {}

    try {
      Sound.stopHum();
    } catch (error) {}

    try {
      BattleMusic.fadeOutAndStop(900);
    } catch (error) {}

    const result = {
      ...resultPayload,
      finishedAt: new Date().toISOString()
    };

    state.lastBattleResult = result;

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
    } catch (error) {}

    /*
     * 更新本機最高分。
     */
    try {
      const oldScore = getMyScore();
      const nextScore = Math.max(oldScore, Number(result.totalScore || result.score || 0));
      setMyScore(nextScore);
      result.bestScore = nextScore;
    } catch (error) {}

    /*
     * 追蹤戰鬥結果。
     */
    track("battle_finish", {
      resultId: result.id || "",
      isWin: !!result.isWin,
      winner: result.winner || "",
      finishType: result.finishType || "",
      score: result.score || result.totalScore || 0,
      rank: result.rank || "",
      selectedTopId: result.selectedTopId || "",
      enemyTopId: result.enemyTopId || "",
      launchGrade: result.launchGrade || "",
      hits: result.hits || 0,
      maxCombo: result.maxCombo || 0
    });

    /*
     * 關鍵修正：
     * 不再直接 showScreen("result")。
     * 先播放 MP4 結果動畫，動畫結束後由 showResultIntroThenRender()
     * 呼叫 goToResultPage(result)，再進結果頁。
     *
     * 如果關閉動畫或 function 不存在，才 fallback goToResultPage / showScreen。
     */
    setTimeout(() => {
      if (
        ENABLE_RESULT_INTRO_VIDEO &&
        typeof showResultIntroThenRender === "function"
      ) {
        showResultIntroThenRender(result);
        return;
      }

      if (typeof goToResultPage === "function") {
        goToResultPage(result);
        return;
      }

      showScreen("result");
    }, 520);
  }
  /*
   * =========================================================
   * 08. RESULT PAGE / SYNC / RANK / INTRO VIDEO
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 08-1. RESULT DOM
   * ---------------------------------------------------------
   */

  function ensureResultDom(root = appRoot()) {
    let result = screenResult();

    if (!result) {
      result = document.createElement("section");
      result.id = "screen-result";
      result.className = "zg-screen zg-result-screen";
      root.appendChild(result);
    }

    result.innerHTML = `
      <div class="zg-result-main">
        <div class="zg-result-card">
          <div class="zg-result-kicker">BATTLE RESULT</div>

          <h1 class="zg-result-title" id="zg-result-title">
            戰鬥結果
          </h1>

          <div class="zg-result-subtitle" id="zg-result-subtitle">
            正在讀取結果...
          </div>

          <div class="zg-result-hero">
            <div class="zg-result-top zg-result-top-player">
              <img
                class="zg-result-top-image zg-result-player-image"
                src="${escapeAttr(DEFAULT_TOP_IMAGE)}"
                alt="你的陀螺"
              />
              <div class="zg-result-top-label">YOU</div>
            </div>

            <div class="zg-result-vs">VS</div>

            <div class="zg-result-top zg-result-top-enemy">
              <img
                class="zg-result-top-image zg-result-enemy-image"
                src="${escapeAttr(DEFAULT_TOP_IMAGE)}"
                alt="對手陀螺"
              />
              <div class="zg-result-top-label">RIVAL</div>
            </div>
          </div>

          <div class="zg-score-box">
            <div class="zg-score-label">本次分數</div>
            <div class="zg-score-value" id="zg-result-score">0</div>
            <div class="zg-score-rank" id="zg-result-rank">RANK -</div>
          </div>

          <div class="zg-result-grid">
            <div class="zg-result-stat">
              <span>終結方式</span>
              <strong id="zg-result-finish">-</strong>
            </div>

            <div class="zg-result-stat">
              <span>連擊</span>
              <strong id="zg-result-combo">0</strong>
            </div>

            <div class="zg-result-stat">
              <span>命中</span>
              <strong id="zg-result-hits">0</strong>
            </div>

            <div class="zg-result-stat">
              <span>發射</span>
              <strong id="zg-result-launch">-</strong>
            </div>
          </div>

          <div class="zg-result-coupon" id="zg-result-coupon"></div>

          <div class="zg-rank-card">
            <div class="zg-rank-card-title">好友排行榜</div>
            <div class="zg-friend-rank" id="zg-friend-rank">
              <div class="zg-rank-loading">排行榜載入中...</div>
            </div>
          </div>

          <div class="zg-invite-card">
            <div class="zg-invite-title">邀請好友一起挑戰</div>
            <div class="zg-invite-text">
              分享你的 LINE 邀請連結，和好友一起累積排行榜分數。
            </div>

            <button
              type="button"
              class="zg-btn zg-btn-primary"
              data-zg-action="share-line"
            >
              LINE 分享邀請
            </button>
          </div>

          <div class="zg-result-actions">
            <button
              type="button"
              class="zg-btn zg-btn-primary"
              data-zg-action="play-again"
            >
              再戰一場
            </button>

            <button
              type="button"
              class="zg-small-btn"
              data-zg-action="result-select"
            >
              重新選擇陀螺
            </button>

            <button
              type="button"
              class="zg-small-btn"
              data-zg-action="go-shop"
            >
              前往 ZELO SPORTIVO
            </button>
          </div>
        </div>
      </div>
    `;

    result.hidden = true;
    result.setAttribute("aria-hidden", "true");

    return result;
  }

  /*
   * ---------------------------------------------------------
   * 08-2. RESULT VISIBLE FIX
   * ---------------------------------------------------------
   */

  function forceResultVisible() {
    const result = screenResult();

    if (!result) return;

    result.hidden = false;
    result.removeAttribute("hidden");
    result.classList.add("active", "is-active");
    result.setAttribute("aria-hidden", "false");

    result.style.setProperty("display", "flex", "important");
    result.style.setProperty("visibility", "visible", "important");
    result.style.setProperty("opacity", "1", "important");
    result.style.setProperty("pointer-events", "auto", "important");
    result.style.setProperty("position", "fixed", "important");
    result.style.setProperty("left", "0", "important");
    result.style.setProperty("top", "0", "important");
    result.style.setProperty("width", "var(--zg-app-width, 100vw)", "important");
    result.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
    result.style.setProperty("overflow", "hidden", "important");

    const main = $(".zg-result-main", result);

    if (main) {
      main.style.setProperty("width", "100%", "important");
      main.style.setProperty("height", "100%", "important");
      main.style.setProperty("overflow-y", "auto", "important");
      main.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
      main.style.setProperty("touch-action", "pan-y", "important");
    }

    $$("[data-zg-action], .zg-btn, .zg-small-btn, .zg-coupon-copy", result)
      .forEach((el) => {
        el.style.setProperty("pointer-events", "auto", "important");
        el.style.setProperty("position", "relative", "important");
        el.style.setProperty("z-index", "20", "important");
      });
  }

  /*
   * ---------------------------------------------------------
   * 08-3. RESULT RENDER HELPERS
   * ---------------------------------------------------------
   */

  function formatScore(value) {
    const n = Math.max(0, Math.round(Number(value) || 0));

    try {
      return n.toLocaleString("zh-TW");
    } catch (error) {
      return String(n);
    }
  }

  function renderCouponHtml(coupon) {
    if (!coupon || !coupon.code) {
      return `
        <div class="zg-coupon-card zg-coupon-card-empty">
          <div class="zg-coupon-title">這次沒有抽到優惠券</div>
          <div class="zg-coupon-text">
            再挑戰一次，下一場可能就會抽中！
          </div>
        </div>
      `;
    }

    return `
      <div class="zg-coupon-card">
        <div class="zg-coupon-title">
          恭喜獲得 ${escapeHtml(coupon.label || "優惠券")}
        </div>

        <div class="zg-coupon-text">
          前往 ZELO SPORTIVO 購物時可使用。
        </div>

        <div class="zg-coupon-box">
          <code class="zg-coupon-code">${escapeHtml(coupon.code)}</code>

          <button
            type="button"
            class="zg-small-btn zg-coupon-copy"
            data-zg-action="copy-coupon"
            data-code="${escapeAttr(coupon.code)}"
          >
            複製
          </button>
        </div>
      </div>
    `;
  }

  function normalizeRankRow(item = {}, index = 0) {
    const score =
      Number(
        item.totalScore ??
        item.bestScore ??
        item.score ??
        item.points ??
        0
      ) || 0;

    const name =
      item.name ||
      item.playerName ||
      item.displayName ||
      item.userName ||
      item.nickname ||
      item.lineDisplayName ||
      "LINE 玩家";

    const pictureUrl =
      item.pictureUrl ||
      item.avatar ||
      item.avatarUrl ||
      "";

    return {
      rank: Number(item.rank || item.position || index + 1),
      name,
      score,
      pictureUrl,
      isMe: item.isMe === true || item.me === true
    };
  }

  function renderFriendRank(rows = []) {
    const box = $("#zg-friend-rank", screenResult() || document);

    if (!box) return;

    const normalized = rows
      .filter(Boolean)
      .map(normalizeRankRow)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item, index) => ({
        ...item,
        rank: index + 1
      }));

    if (!normalized.length) {
      box.innerHTML = `
        <div class="zg-rank-empty">
          目前還沒有好友分數，分享邀請連結開始排行榜吧！
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="zg-rank-list">
        ${normalized.map((item) => `
          <div class="zg-rank-row ${item.isMe ? "is-me" : ""}">
            <div class="zg-rank-no">#${item.rank}</div>

            <div class="zg-rank-avatar">
              ${
                item.pictureUrl
                  ? `<img src="${escapeAttr(item.pictureUrl)}" alt="">`
                  : `<span>${escapeHtml(item.name.slice(0, 1))}</span>`
              }
            </div>

            <div class="zg-rank-name">${escapeHtml(item.name)}</div>

            <div class="zg-rank-score">${formatScore(item.score)}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function getSelfRankRow(result = {}) {
    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    const score =
      Number(result.totalScore || result.score || getMyScore() || 0) || 0;

    return {
      rank: 1,
      position: 1,

      userId:
        player.userId && player.userId !== "me-local"
          ? player.userId
          : "",

      lineUserId:
        player.lineUserId ||
        player.userId ||
        "",

      name:
        player.displayName ||
        player.name ||
        player.playerName ||
        "你",

      playerName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "你",

      displayName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "你",

      pictureUrl:
        player.pictureUrl ||
        player.avatar ||
        "",

      score,
      totalScore: score,
      bestScore: Math.max(score, getMyScore()),

      referralCode:
        typeof getMyReferralCode === "function"
          ? getMyReferralCode()
          : "",

      isMe: true
    };
  }

  /*
   * ---------------------------------------------------------
   * 08-4. RESULT RENDER
   * ---------------------------------------------------------
   */

  function renderResult(result = {}) {
    const resultScreen = screenResult();

    if (!resultScreen) return;

    state.lastBattleResult = result;

    const title = $("#zg-result-title", resultScreen);
    const subtitle = $("#zg-result-subtitle", resultScreen);
    const score = $("#zg-result-score", resultScreen);
    const rank = $("#zg-result-rank", resultScreen);
    const finish = $("#zg-result-finish", resultScreen);
    const combo = $("#zg-result-combo", resultScreen);
    const hits = $("#zg-result-hits", resultScreen);
    const launch = $("#zg-result-launch", resultScreen);
    const couponBox = $("#zg-result-coupon", resultScreen);

    const playerImage = $(".zg-result-player-image", resultScreen);
    const enemyImage = $(".zg-result-enemy-image", resultScreen);

    const totalScore =
      Number(result.totalScore || result.score || 0) || 0;

    if (title) {
      title.textContent = result.title || "戰鬥結果";
      title.dataset.win = result.isWin ? "1" : "0";
    }

    if (subtitle) {
      subtitle.textContent =
        result.subtitle ||
        (result.isWin ? "漂亮獲勝！" : "再接再厲！");
    }

    if (score) {
      score.textContent = formatScore(totalScore);
    }

    if (rank) {
      rank.textContent = `RANK ${result.rank || getBattleRank(totalScore)}`;
    }

    if (finish) {
      finish.textContent =
        result.finishLabel ||
        getFinishInfo(result.finishType || "spin_finish").label;
    }

    if (combo) {
      combo.textContent = String(result.maxCombo || 0);
    }

    if (hits) {
      hits.textContent = String(result.hits || 0);
    }

    if (launch) {
      launch.textContent =
        String(result.launchGrade || "-").toUpperCase();
    }

    if (playerImage && result.selectedTop) {
      playerImage.src = getTopBattleImage(result.selectedTop);
      playerImage.alt = result.selectedTop.name || "你的陀螺";
    }

    if (enemyImage && result.enemyTop) {
      enemyImage.src = getTopBattleImage(result.enemyTop);
      enemyImage.alt = result.enemyTop.name || "對手陀螺";
    }

    if (couponBox) {
      couponBox.innerHTML = renderCouponHtml(result.coupon);
    }

    /*
     * 先用 cache + self 即時顯示，再背景同步。
     */
    const cacheRows = loadFriendRankCache();
    const selfRow = getSelfRankRow(result);
    const mergedRows = mergeFriendRankRows([], cacheRows, [selfRow]);

    renderFriendRank(mergedRows);
    saveFriendRankCache(mergedRows);

    /*
     * 背景同步與刷新排行榜。
     */
    syncResultWithLineOnce(result)
      .then((data) => {
        const serverRows =
          Array.isArray(data?.rankRows)
            ? data.rankRows
            : Array.isArray(data?.rows)
              ? data.rows
              : Array.isArray(data?.leaderboard)
                ? data.leaderboard
                : [];

        const latestCache = loadFriendRankCache();

        const merged = mergeFriendRankRows(
          serverRows,
          latestCache,
          [selfRow]
        );

        renderFriendRank(merged);
        saveFriendRankCache(merged);
      })
      .catch((error) => {
        console.warn("[ZELO] syncResultWithLineOnce failed:", error);
      });

    forceResultVisible();

    track("result_render", {
      resultId: result.id || "",
      score: totalScore,
      rank: result.rank || "",
      isWin: !!result.isWin,
      finishType: result.finishType || ""
    });
  }

  /*
   * ---------------------------------------------------------
   * 08-5. LINE / GAS RESULT SYNC
   * ---------------------------------------------------------
   */

  function getProfilePayload() {
    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    return {
      userId:
        player.userId && player.userId !== "me-local"
          ? player.userId
          : "",

      lineUserId:
        player.lineUserId ||
        player.userId ||
        "",

      displayName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "LINE 玩家",

      playerName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "LINE 玩家",

      pictureUrl:
        player.pictureUrl ||
        player.avatar ||
        "",

      referralCode:
        typeof getMyReferralCode === "function"
          ? getMyReferralCode()
          : "",

      inviterReferralCode:
        typeof getSavedInviterReferralCode === "function"
          ? getSavedInviterReferralCode()
          : "",

      lineInviteFriendCount:
        typeof getLineInviteFriendCount === "function"
          ? getLineInviteFriendCount()
          : 0
    };
  }

  function buildLineResultPayload(result = {}) {
    const profilePayload = getProfilePayload();

    const score =
      Number(result.totalScore || result.score || 0) || 0;

    return {
      action: "submit_result",
      eventType: "battle_result",

      game: "zelo",
      version: VERSION,

      resultId: result.id || "",
      createdAt: result.createdAt || result.finishedAt || new Date().toISOString(),
      timestamp: new Date().toISOString(),
      ts: Date.now(),

      pageUrl: location.href,
      userAgent: navigator.userAgent || "",

      /*
       * LINE 玩家資料
       */
      ...profilePayload,

      /*
       * 分數與戰鬥資料
       */
      score,
      totalScore: score,
      bestScore: Math.max(score, getMyScore()),

      rank: result.rank || getBattleRank(score),

      isWin: !!result.isWin,
      isLose: !!result.isLose,
      isDraw: !!result.isDraw,
      winner: result.winner || "",

      finishType: result.finishType || "",
      finishLabel: result.finishLabel || "",
      finishPoints: Number(result.finishPoints || 0),

      selectedTopId: result.selectedTopId || result.selectedTop?.id || "",
      selectedTopName: result.selectedTop?.name || "",
      enemyTopId: result.enemyTopId || result.enemyTop?.id || "",
      enemyTopName: result.enemyTop?.name || "",

      launchPower: Number(result.launchPower || 0),
      launchRawPower: Number(result.launchRawPower || 0),
      launchGrade: result.launchGrade || "",

      hits: Number(result.hits || 0),
      maxCombo: Number(result.maxCombo || 0),
      totalDamage: Number(result.totalDamage || 0),
      enemyDamageTaken: Number(result.enemyDamageTaken || 0),
      playerDamageTaken: Number(result.playerDamageTaken || 0),

      playerHp: Number(result.playerHp || 0),
      enemyHp: Number(result.enemyHp || 0),
      playerEnergy: Number(result.playerEnergy || 0),
      enemyEnergy: Number(result.enemyEnergy || 0),

      playsUsed: Number(result.playsUsed || state.playsUsed || 0),
      remainingPlays: Number(result.remainingPlays || state.remainingPlays || 0),

      couponCode: result.coupon?.code || "",
      couponLabel: result.coupon?.label || "",
      couponAmount: result.coupon?.amount || "",

      debugJson: JSON.stringify({
        resultId: result.id || "",
        debug: result.debug || {},
        selectedTop: result.selectedTop || null,
        enemyTop: result.enemyTop || null
      })
    };
  }

  function getLineResultSyncKey(result = {}) {
    const resultId =
      result.id ||
      result.resultId ||
      [
        result.createdAt || result.finishedAt || "",
        result.totalScore || result.score || 0,
        result.finishType || "",
        result.selectedTopId || ""
      ].join("_");

    return `zg_line_result_synced_${String(resultId)}`;
  }

  async function syncResultWithLineOnce(result = {}) {
    if (!result) {
      return {
        ok: false,
        reason: "missing_result"
      };
    }

    const syncKey = getLineResultSyncKey(result);

    try {
      if (localStorage.getItem(syncKey) === "1") {
        return {
          ok: true,
          skipped: true,
          reason: "already_synced"
        };
      }
    } catch (error) {}

    const payload = buildLineResultPayload(result);

    let data = null;

    /*
     * 優先 POST。
     */
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();

      try {
        data = JSON.parse(text);
      } catch (error) {
        data = {
          ok: response.ok,
          raw: text
        };
      }

      if (!response.ok || data?.ok === false) {
        throw new Error(
          data?.message ||
          data?.error ||
          `submit_result failed: HTTP ${response.status}`
        );
      }
    } catch (error) {
      console.warn("[ZELO] submit_result POST failed, fallback JSONP:", error);

      data = await jsonpApi("submit_result", payload);
    }

    const ok =
      data?.ok !== false;

    if (ok) {
      try {
        localStorage.setItem(syncKey, "1");
      } catch (error) {}

      track("line_result_synced", {
        resultId: result.id || "",
        score: payload.score,
        rank: payload.rank,
        userId: payload.userId || payload.lineUserId || ""
      });
    }

    return data || {
      ok
    };
  }

  async function fetchFriendRankFromApi() {
    const profilePayload = getProfilePayload();

    const data = await getApiJson("get_friend_rank", {
      game: "zelo",
      version: VERSION,
      userId: profilePayload.userId || profilePayload.lineUserId || "",
      lineUserId: profilePayload.lineUserId || profilePayload.userId || "",
      referralCode: profilePayload.referralCode || "",
      inviterReferralCode: profilePayload.inviterReferralCode || "",
      _t: Date.now()
    });

    const rows =
      Array.isArray(data?.rankRows)
        ? data.rankRows
        : Array.isArray(data?.rows)
          ? data.rows
          : Array.isArray(data?.leaderboard)
            ? data.leaderboard
            : [];

    const merged = mergeFriendRankRows(
      rows,
      loadFriendRankCache(),
      [getSelfRankRow(state.lastBattleResult || {})]
    );

    saveFriendRankCache(merged);
    renderFriendRank(merged);

    return merged;
  }

  /*
   * ---------------------------------------------------------
   * 08-6. RESULT PAGE NAVIGATION
   * ---------------------------------------------------------
   */

  function goToResultPage(result = {}) {
    if (result) {
      state.lastBattleResult = result;

      try {
        localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
      } catch (error) {}
    }

    showScreen("result");
  }

  /*
   * ---------------------------------------------------------
   * 08-7. RESULT INTRO VIDEO
   * ---------------------------------------------------------
   *
   * 只保留這一份 showResultIntroThenRender。
   * 注意：
   * - 它只在戰鬥結束後被 finishBattle() 呼叫。
   * - 播完後呼叫 goToResultPage(result)。
   * - 結果頁 onResultShown() 只 renderResult，不會再呼叫動畫。
   */

  function showResultIntroThenRender(result = {}) {
  if (!result || result.__introPlayed) {
    goToResultPage(result);
    return;
  }

  result.__introPlayed = true;

  /*
   * 動畫播放同時先做結果同步。
   * 但不讓 API 卡住畫面，結束時最多等 600ms。
   */
  const preSyncPromise =
    typeof syncResultWithLineOnce === "function"
      ? syncResultWithLineOnce(result).catch(() => null)
      : Promise.resolve(null);

  const videoUrl = RESULT_INTRO_VIDEO_URL;

  const safeVideoUrl =
    typeof escapeAttr === "function"
      ? escapeAttr(videoUrl)
      : String(videoUrl || "")
          .replace(/&/g, "&amp;")
          .replace(/"/g, "&quot;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

  const oldOverlay = document.getElementById("zg-result-intro-overlay");

  if (oldOverlay) {
    try {
      oldOverlay.remove();
    } catch (error) {}
  }

  const overlay = document.createElement("div");
  overlay.id = "zg-result-intro-overlay";
  overlay.className = "zg-result-intro-overlay";

  overlay.innerHTML = `
    <div class="zg-result-intro-inner">
      <video
        class="zg-result-intro-video"
        src="${safeVideoUrl}"
        autoplay
        muted
        playsinline
        webkit-playsinline
        preload="auto"
      ></video>

      <button
        type="button"
        class="zg-result-intro-skip"
        aria-label="略過動畫"
      >
        SKIP
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  const video = $(".zg-result-intro-video", overlay);
  const skip = $(".zg-result-intro-skip", overlay);

  let done = false;
  let fallbackTimer = null;

  const cleanupAndRender = () => {
    if (done) return;

    done = true;

    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    overlay.classList.add("is-leaving");

    const renderNext = () => {
      Promise.race([
        preSyncPromise,
        new Promise((resolve) => setTimeout(resolve, 600))
      ])
        .catch(() => null)
        .then(() => {
          try {
            overlay.remove();
          } catch (error) {}

          goToResultPage(result);
        });
    };

    setTimeout(renderNext, 180);
  };

  if (skip) {
    skip.addEventListener("click", cleanupAndRender);
  }

  if (video) {
    video.addEventListener("ended", cleanupAndRender);
    video.addEventListener("error", cleanupAndRender);

    try {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");

      const playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          console.warn("[ZELO] result intro video autoplay failed:", error);
          cleanupAndRender();
        });
      }
    } catch (error) {
      cleanupAndRender();
    }
  } else {
    cleanupAndRender();
    return;
  }

  /*
   * 最長保險時間。
   * 避免影片載入卡住時使用者無法進結果頁。
   */
  fallbackTimer = setTimeout(cleanupAndRender, 9000);
}

  /*
   * =========================================================
   * 09. DAILY / LIFF / TRACKING / EVENTS / BOOT / EXPOSE API
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 09-1. Tracking
   * ---------------------------------------------------------
   */

  function track(eventName, payload = {}) {
    const body = {
      action: "track_event",
      eventType: eventName,
      game: "zelo",
      version: VERSION,
      ts: Date.now(),
      timestamp: new Date().toISOString(),
      pageUrl: location.href,
      userAgent: navigator.userAgent || "",
      userId: getUserId(),
      playerName: getPlayerName(),
      referralCode:
        typeof getMyReferralCode === "function"
          ? getMyReferralCode()
          : "",
      inviterReferralCode:
        typeof getSavedInviterReferralCode === "function"
          ? getSavedInviterReferralCode()
          : "",
      ...payload
    };

    console.log("[ZELO TRACK]", eventName, body);

    /*
     * 追蹤不應阻塞遊戲流程。
     */
    try {
      if (navigator.sendBeacon && GOOGLE_SCRIPT_URL) {
        const blob = new Blob([JSON.stringify(body)], {
          type: "text/plain;charset=utf-8"
        });

        navigator.sendBeacon(GOOGLE_SCRIPT_URL, blob);
        return;
      }
    } catch (error) {}

    try {
      if (GOOGLE_SCRIPT_URL) {
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(body),
          keepalive: true
        }).catch(() => {});
      }
    } catch (error) {}
  }

  /*
   * ---------------------------------------------------------
   * 09-2. LIFF / Profile Init
   * ---------------------------------------------------------
   */

  function loadProfileFromStorageOrWindow() {
    let profile = null;

    try {
      if (window.ZELO_PROFILE) {
        profile = window.ZELO_PROFILE;
      }
    } catch (error) {}

    if (!profile) {
      try {
        const saved = localStorage.getItem(STORAGE.profile);

        if (saved) {
          profile = JSON.parse(saved);
        }
      } catch (error) {}
    }

    if (!profile) {
      try {
        const savedLine = localStorage.getItem("ZELO_PROFILE");

        if (savedLine) {
          profile = JSON.parse(savedLine);
        }
      } catch (error) {}
    }

    if (profile) {
      state.profile = normalizeLineProfile(profile);

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
      } catch (error) {}
    } else {
      state.profile = normalizeLineProfile({});
    }

    return state.profile;
  }

  async function initLiffProfileIfAvailable() {
    /*
     * 如果外部 liff-boot 已經放 profile，直接使用。
     */
    loadProfileFromStorageOrWindow();

    /*
     * 嘗試從 LIFF SDK 讀 profile。
     * 這裡不主動 liff.init，避免與 theme / liff-boot 重複初始化。
     */
    try {
      if (
        window.liff &&
        typeof window.liff.isLoggedIn === "function" &&
        window.liff.isLoggedIn() &&
        typeof window.liff.getProfile === "function"
      ) {
        const profile = await window.liff.getProfile();

        state.profile = normalizeLineProfile(profile);

        window.ZELO_PROFILE = state.profile;

        try {
          localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
          localStorage.setItem("ZELO_PROFILE", JSON.stringify(state.profile));
        } catch (error) {}

        return state.profile;
      }
    } catch (error) {
      console.warn("[ZELO] initLiffProfileIfAvailable failed:", error);
    }

    return state.profile;
  }

  /*
   * ---------------------------------------------------------
   * 09-3. Share / Clipboard
   * ---------------------------------------------------------
   */

  async function copyText(text) {
    const value = String(text || "");

    if (!value) return false;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (error) {}

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const ok = document.execCommand("copy");

      textarea.remove();

      return ok;
    } catch (error) {
      return false;
    }
  }

  async function shareLineInvite() {
    const url = buildReferralUrl();

    const playerName = getPlayerName();

    const text =
      `${playerName} 邀請你加入 ZELO 陀螺挑戰！\n` +
      `點擊連結一起戰鬥、累積好友排行榜分數：\n${url}`;

    /*
     * LIFF shareTargetPicker
     */
    try {
      if (
        window.liff &&
        typeof window.liff.isApiAvailable === "function" &&
        window.liff.isApiAvailable("shareTargetPicker") &&
        typeof window.liff.shareTargetPicker === "function"
      ) {
        await window.liff.shareTargetPicker([
          {
            type: "text",
            text
          }
        ]);

        addLineInviteFriendCount(1);

        track("share_line_invite", {
          method: "liff_shareTargetPicker",
          url
        });

        return true;
      }
    } catch (error) {
      console.warn("[ZELO] shareTargetPicker failed:", error);
    }

    /*
     * Web Share API
     */
    try {
      if (navigator.share) {
        await navigator.share({
          title: "ZELO 陀螺挑戰",
          text,
          url
        });

        addLineInviteFriendCount(1);

        track("share_line_invite", {
          method: "web_share",
          url
        });

        return true;
      }
    } catch (error) {}

    /*
     * fallback：複製連結
     */
    const copied = await copyText(url);

    if (copied) {
      alert("邀請連結已複製，貼給好友一起挑戰吧！");
    } else {
      prompt("複製邀請連結", url);
    }

    addLineInviteFriendCount(1);

    track("share_line_invite", {
      method: "copy_link",
      url
    });

    return true;
  }

  /*
   * ---------------------------------------------------------
   * 09-4. Global Events
   * ---------------------------------------------------------
   */

  function bindGlobalAudioUnlock() {
    if (window.__ZELO_AUDIO_UNLOCK_BOUND === "1") return;

    window.__ZELO_AUDIO_UNLOCK_BOUND = "1";

    const unlock = () => {
      try {
        Sound.resume();
      } catch (error) {}

      try {
        unlockHomeMusic();
      } catch (error) {}

      /*
       * 如果正在戰鬥頁，使用者互動時補播戰鬥音樂。
       */
      try {
        const current = document.body.getAttribute("data-zg-screen");

        if (current === "battle" && typeof BattleMusic !== "undefined") {
          BattleMusic.play();
        }
      } catch (error) {}
    };

    document.addEventListener("pointerdown", unlock, {
      passive: true
    });

    document.addEventListener("touchstart", unlock, {
      passive: true
    });

    document.addEventListener("click", unlock, {
      passive: true
    });
  }

  function bindEvents() {
    if (state.eventsBound) return;

    state.eventsBound = true;

    document.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-zg-action]");

      if (!target) return;

      const action = target.dataset.zgAction;

      if (!action) return;

      switch (action) {
        case "start": {
          if (shouldIgnoreRepeatedAction("start")) return;

          try {
            Sound.resume();
          } catch (error) {}

          try {
            unlockHomeMusic();
          } catch (error) {}

          showScreen("select");

          track("home_start_click", {
            source: "start_button"
          });

          break;
        }

        case "back-home": {
          if (shouldIgnoreRepeatedAction("back-home")) return;

          showScreen("start");

          track("back_home", {
            source: "select"
          });

          break;
        }

        case "battle": {
          if (shouldIgnoreRepeatedAction("battle", 800)) return;

          enterBattlePrep();

          break;
        }

        case "battle-back-select": {
          if (shouldIgnoreRepeatedAction("battle-back-select")) return;

          stopBattle();
          cancelChargeLoop();

          try {
            BattleMusic.fadeOutAndStop(500);
          } catch (error) {}

          showScreen("select");

          track("battle_back_select");

          break;
        }

        case "play-again": {
          if (shouldIgnoreRepeatedAction("play-again", 800)) return;

          enterBattlePrep();

          track("result_play_again");

          break;
        }

        case "result-select": {
          if (shouldIgnoreRepeatedAction("result-select")) return;

          showScreen("select");

          track("result_select_top");

          break;
        }

        case "go-shop": {
          if (shouldIgnoreRepeatedAction("go-shop")) return;

          track("go_shop", {
            url: SHOP_URL
          });

          location.href = SHOP_URL;

          break;
        }

        case "copy-coupon": {
          const code =
            target.dataset.code ||
            $(".zg-coupon-code", screenResult() || document)?.textContent ||
            "";

          const ok = await copyText(code);

          if (ok) {
            target.textContent = "已複製";
            setTimeout(() => {
              target.textContent = "複製";
            }, 1200);
          } else {
            prompt("複製優惠碼", code);
          }

          track("copy_coupon", {
            code
          });

          break;
        }

        case "share-line": {
          if (shouldIgnoreRepeatedAction("share-line", 1200)) return;

          await shareLineInvite();

          break;
        }

        default:
          break;
      }
    });

    document.addEventListener("click", (event) => {
      const card = event.target.closest(".zg-top-card[data-top-id]");

      if (!card) return;

      const id = card.dataset.topId;
      const top = TOPS.find((item) => item.id === id);

      if (!top) return;

      state.selectedTop = top;
      saveSelectedTop(top);
      renderTopSelection();

      try {
        Sound.chargePerfect();
      } catch (error) {}

      track("select_top", {
        topId: top.id,
        topName: top.name,
        topType: top.type
      });
    });
  }

  /*
   * ---------------------------------------------------------
   * 09-5. Boot
   * ---------------------------------------------------------
   */

  async function boot() {
    if (state.booted || state.booting) return;

    state.booting = true;

    try {
      ensureAppHeight();
      applyCssVariables();

      hardResetGamePage();
      ensureBasicDom();

      state.selectedTop = loadSelectedTop();

      loadDailyLimit();
      loadProfileFromStorageOrWindow();

      bindGlobalAudioUnlock();
      bindEvents();

      watchMenuDom();

      /*
       * profile / referral 允許背景初始化。
       */
      initLiffProfileIfAvailable()
        .then(() => {
          registerReferralIfNeeded("boot").catch(() => {});
        })
        .catch(() => {});

      /*
       * URL 上有 referral 時，先存入本機。
       */
      try {
        const incoming = getReferralCodeFromUrl();

        if (incoming) {
          saveInviterReferralCode(incoming);
        }
      } catch (error) {}

      showScreen("start");

      track("game_boot", {
        version: VERSION,
        loadCount: window.__ZELO_GAME_LOAD_COUNT || 1,
        selectedTop: state.selectedTop ? state.selectedTop.id : ""
      });

      state.booted = true;
    } catch (error) {
      console.error("[ZELO GAME] boot failed:", error);

      try {
        const root = appRoot();

        root.innerHTML = `
          <div style="
            color:#fff;
            background:#090612;
            min-height:100vh;
            padding:24px;
            font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
          ">
            <h2>ZELO GAME 載入失敗</h2>
            <p>請重新整理頁面後再試一次。</p>
            <pre style="
              white-space:pre-wrap;
              color:#ffb4b4;
              background:rgba(255,255,255,0.08);
              padding:12px;
              border-radius:12px;
            ">${escapeHtml(String(error && error.stack ? error.stack : error))}</pre>
          </div>
        `;
      } catch (innerError) {}
    } finally {
      state.booting = false;
    }
  }

  /*
   * ---------------------------------------------------------
   * 09-6. Expose API
   * ---------------------------------------------------------
   */

  function exposeApi() {
    window.ZELO_GAME = {
      version: VERSION,

      getState() {
        return state;
      },

      getConfig() {
        return {
          VERSION,
          ENABLE_RESULT_INTRO_VIDEO,
          RESULT_INTRO_VIDEO_URL,
          GOOGLE_SCRIPT_URL,
          SHOP_URL,
          DAILY_LIMIT,
          TOPS,
          PHY,
          CHARGE,
          FINISH,
          BATTLE_FINISH_RULES
        };
      },

      boot,
      showScreen,

      /*
       * DOM / Screen
       */
      appRoot,
      ensureBasicDom,
      ensureHomeDom,
      ensureSelectDom,
      ensureBattleDom,
      ensureResultDom,
      hardResetGamePage,
      forceResultVisible,

      /*
       * Battle
       */
      enterBattlePrep,
      renderLaunchPrep,
      startBattleWithPower,
      stopBattle,
      cancelChargeLoop,

      /*
       * Result
       */
      goToResultPage,
      showResultIntroThenRender,
      renderResult,
      syncResultWithLineOnce,
      fetchFriendRankFromApi,

      /*
       * Profile / Referral
       */
      getProfile,
      getCurrentLinePlayer,
      getMyReferralCode,
      getSavedInviterReferralCode,
      registerReferralIfNeeded,
      buildReferralUrl,
      shareLineInvite,

      /*
       * Audio
       */
      Sound,
      BattleMusic,

      /*
       * Debug helpers
       */
      debugBattleMusic() {
        return BattleMusic.debug();
      },

      playBattleMusic() {
        return BattleMusic.play();
      },

      stopBattleMusic() {
        return BattleMusic.stop();
      },

      testResultIntro() {
        const result =
          state.lastBattleResult ||
          safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
          {
            id: "test_result_" + Date.now(),
            createdAt: new Date().toISOString(),
            title: "測試結果動畫",
            subtitle: "這是測試用結果。",
            isWin: true,
            winner: "player",
            finishType: "spin_finish",
            finishLabel: "迴轉終結",
            score: 3600,
            totalScore: 3600,
            rank: "A",
            maxCombo: 3,
            hits: 8,
            launchGrade: "perfect",
            selectedTop: TOPS[0],
            enemyTop: TOPS[1],
            coupon: COUPON_REWARDS[2]
              ? {
                  ...COUPON_REWARDS[2],
                  code: COUPON_REWARDS[2].fixedCode || "ZELO100"
                }
              : null
          };

        /*
         * 複製一份，避免已經 __introPlayed 的物件直接跳過。
         */
        const playableResult = {
          ...result,
          __introPlayed: false
        };

        return showResultIntroThenRender(playableResult);
      },

      testResultPage() {
        const result =
          state.lastBattleResult ||
          safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
          {
            id: "test_result_page_" + Date.now(),
            createdAt: new Date().toISOString(),
            title: "測試結果頁",
            subtitle: "這是測試用結果頁。",
            isWin: true,
            winner: "player",
            finishType: "burst_finish",
            finishLabel: "爆裂終結",
            score: 5200,
            totalScore: 5200,
            rank: "S+",
            maxCombo: 5,
            hits: 12,
            launchGrade: "perfect",
            selectedTop: TOPS[0],
            enemyTop: TOPS[1],
            coupon: COUPON_REWARDS[1]
              ? {
                  ...COUPON_REWARDS[1],
                  code: COUPON_REWARDS[1].fixedCode || "ZELO250"
                }
              : null
          };

        return goToResultPage(result);
      },

      resetDaily() {
        try {
          localStorage.removeItem(getDailyKey());
        } catch (error) {}

        loadDailyLimit();

        return {
          playsUsed: state.playsUsed,
          remainingPlays: state.remainingPlays
        };
      },

      clearLocal() {
        Object.values(STORAGE).forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (error) {}
        });

        try {
          localStorage.removeItem(LINE_INVITE_FRIEND_COUNT_KEY);
        } catch (error) {}

        try {
          localStorage.removeItem(REFERRAL.codeKey);
          localStorage.removeItem(REFERRAL.inviterCodeKey);
          localStorage.removeItem(REFERRAL.countFallbackKey);
        } catch (error) {}

        return true;
      }
    };

    return window.ZELO_GAME;
  }

  /*
   * ---------------------------------------------------------
   * 09-7. Start
   * ---------------------------------------------------------
   */

  exposeApi();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {
      once: true
    });
  } else {
    boot();
  }
})();
