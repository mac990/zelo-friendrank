/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607150819-battle-energy-impact-fixed
 *
 * Structure:
 * 01. CORE / 共用設定與資料
 * 02. HELPERS / 共用工具
 * 03. AUDIO / 音效模組
 * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
 * 05. HOME PAGE / 首頁
 * 06. TOP SELECT PAGE / 選擇陀螺頁面
 * 07. LAUNCH PREP PAGE / 準備發射頁面
 * 08. BATTLE PAGE / 陀螺戰鬥頁面
 * 09. RESULT PAGE / 結果頁面
 * 10. TRACKING / 儀表板事件追蹤
 * 11. EVENTS / 全域事件綁定
 * 12. INIT / 啟動
 *
 * Rules:
 * - 保留目前美術 class
 * - 保留蓄力發射
 * - 保留戰鬥物理
 * - 保留碰撞扣血規則
 * - 牆壁反彈不扣 HP
 * - 只有陀螺碰撞扣 HP
 * - HP 歸零即停止並判定敗北
 * - 不因轉速歸零、時間到、中央決勝提前結束
 * - 補上 dashboard 事件追蹤
 * - 修正重複蓄力 UI：只保留 battle panel launch row
 * - CSS 已抽離至 game.css
 * - JS 不再注入大段 CSS，只輸出 CSS 變數
 * - 戰鬥能量條會跟 HP / 轉速 / 速度聯動
 * - 碰撞震動、火花、衝擊環加強
 * - 戰鬥陀螺尺寸放大
 * =========================================================
 */

(() => {
  "use strict";

  /*
   * =========================================================
   * 01. CORE / 共用設定與資料
   * =========================================================
   */

  const DEFAULT_TOP_IMAGE =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=202607170240";

const VERSION = "202607170812-result-final-layout-clean";
  
console.log("[ZELO GAME] version:", VERSION);

const BG_IMAGE_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const EXTERNAL_TOP_PHOTO_URL ="https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
    window.ZELO_GOOGLE_RECORD_API ||
    window.GOOGLE_SCRIPT_URL ||
    "https://script.google.com/macros/s/AKfycbxKGD7CicXrV7emSTULrIHFJGIUn68wop8c5g0-f9_F2xdhD08vI2ZtcrUCIkmm4wK61A/exec";

const HOME_VIDEO_URL =
  "https://cdn.shopify.com/videos/c/o/v/189e5c4617d143c793cd0844a727366f.mp4";

const HOME_POSTER_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg-line.jpg?v=1784121251";

const HOME_MUSIC_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Lyria_3_Clip.mp3?v=1784133785";

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

const DAILY_LIMIT = 9999;

  const STORAGE = {
    selectedType: "zelo_selected_top_type",
    myScore: "zelo_my_score",
    friends: "zelo_friend_rank",
    profile: "zg_profile",
    lastResult: "zg_last_result",
    lastCoupon: "zg_last_coupon",
    dailyPrefix: "zg_daily_play_"
  };

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


  const FINISH = {
    spin: {
      label: "Spin Finish",
      points: 1
    },
    over: {
      label: "Over Finish",
      points: 2
    },
    burst: {
      label: "Burst Finish",
      points: 2
    },
    xtreme: {
      label: "Xtreme Finish",
      points: 3
    }
  };

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
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_b1c5de32-8300-416d-b7c1-5083fea27f6d.png?v=1784147189",
      

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
    launchPower: 0,
    chargeDir: 1,
    chargeRaf: null,
    lastPerfectSoundAt: 0,

    lastCouponReward: null,
    lastBattleResult: null,

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    resultLogged: false,

    eventsBound: false,
    booted: false,

    lastActionAt: 0,
    lastActionKey: ""
  };

  const LINE_INVITE_FRIEND_COUNT_KEY = "zg_line_invite_friend_count";

  const REFERRAL = {
  codeKey: "zg_referral_code",
  inviterCodeKey: "zg_inviter_referral_code",
  registeredKeyPrefix: "zg_ref_registered_",
  countFallbackKey: "zg_referral_success_count"
};


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
  try {
    const params = new URLSearchParams(location.search);

    return (
      params.get("ref") ||
      params.get("invite") ||
      params.get("inviter") ||
      ""
    ).trim();
  } catch (error) {
    return "";
  }
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

  try {
    const url = new URL(location.href);

    url.searchParams.set("ref", myCode);

    /*
     * 避免分享網址帶著 debug 或版本參數太亂。
     * 如果你需要保留 v，可以刪掉這兩行。
     */
    url.searchParams.delete("invite");
    url.searchParams.delete("inviter");

    return url.toString();
  } catch (error) {
    const joiner = location.href.includes("?") ? "&" : "?";
    return `${location.href}${joiner}ref=${encodeURIComponent(myCode)}`;
  }
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
}

async function registerReferralIfNeeded(source = "boot") {
  const urlRef = getReferralCodeFromUrl();

  if (urlRef) {
    saveInviterReferralCode(urlRef);
  }

  const inviterCode = getSavedInviterReferralCode();

  if (!inviterCode) {
    return {
      ok: false,
      reason: "no_inviter_code"
    };
  }

  const myCode = getMyReferralCode();

  if (inviterCode === myCode) {
    return {
      ok: false,
      reason: "self_referral"
    };
  }

  if (hasRegisteredReferral(inviterCode)) {
    return {
      ok: false,
      reason: "already_registered"
    };
  }

  const referredUserId =
    getUserId() ||
    `guest_${simpleHash(navigator.userAgent + "_" + location.href).slice(0, 8)}`;

  try {
    const data = await postReferralApi({
      action: "register_referral",
      source,
      inviterReferralCode: inviterCode,
      referredReferralCode: myCode,
      referredUserId,
      referredPlayerName: getPlayerName()
    });

    /*
     * 後端接受後才標記已完成，避免重複加。
     */
    markReferralRegistered(inviterCode);

    track("referral_registered", {
      source,
      inviterReferralCode: inviterCode,
      referredReferralCode: myCode,
      referredUserId,
      apiOk: !!data?.ok
    });

    return {
      ok: true,
      data
    };
  } catch (error) {
    /*
     * API 失敗時不標記完成，之後還可以重試。
     */
    track("referral_register_failed", {
      source,
      inviterReferralCode: inviterCode,
      referredReferralCode: myCode,
      message: String(error && error.message ? error.message : error)
    });

    return {
      ok: false,
      reason: "api_failed",
      error
    };
  }
}

async function syncReferralSuccessCount(source = "result") {
  const myCode = getMyReferralCode();

  try {
    const data = await postReferralApi({
      action: "get_referral_count",
      source,
      ownerReferralCode: myCode
    });

    const count = Number(
      data.count ??
      data.referralCount ??
      data.successCount ??
      data.lineInviteFriendCount ??
      0
    );

    const safeCount = Number.isFinite(count)
      ? Math.max(0, count)
      : getFallbackReferralSuccessCount();

    setLineInviteFriendCount(safeCount);
    setFallbackReferralSuccessCount(safeCount);

    if (state) {
      state.lineInviteFriendCount = safeCount;
    }

    track("referral_count_sync", {
      source,
      referralCode: myCode,
      count: safeCount,
      apiOk: !!data?.ok
    });

    return safeCount;
  } catch (error) {
    const fallbackCount = getFallbackReferralSuccessCount();

    setLineInviteFriendCount(fallbackCount);

    if (state) {
      state.lineInviteFriendCount = fallbackCount;
    }

    track("referral_count_sync_failed", {
      source,
      referralCode: myCode,
      fallbackCount,
      message: String(error && error.message ? error.message : error)
    });

    return fallbackCount;
  }
}


  /*
   * =========================================================
   * 02. HELPERS / 共用工具
   * =========================================================
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

  function getUrlParam(name) {
    try {
      const params = new URLSearchParams(location.search);
      return params.get(name) || "";
    } catch (error) {
      return "";
    }
  }

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

  function getProfile() {
    if (window.ZELO_PROFILE) return window.ZELO_PROFILE;
    if (state.profile) return state.profile;

    try {
      const saved = localStorage.getItem(STORAGE.profile);
      if (saved) return JSON.parse(saved);
    } catch (error) {}

    return null;
  }

  function getUserId() {
    const profile = getProfile() || {};
    return profile.userId || profile.id || profile.uid || "";
  }

  function getPlayerName() {
    const profile = getProfile() || {};
    return profile.displayName || profile.name || profile.playerName || "你";
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
   * =========================================================
   * 03. AUDIO / 音效模組
   * =========================================================
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
 * 03-1. HOME MUSIC / 首頁音樂
 * ---------------------------------------------------------
 */

let homeMusicAudio = null;
let homeMusicUnlocked = false;

function ensureHomeMusic() {
  if (homeMusicAudio) return homeMusicAudio;

  homeMusicAudio = new Audio(HOME_MUSIC_URL);
  homeMusicAudio.loop = true;
  homeMusicAudio.preload = "auto";
  homeMusicAudio.volume = 0.58;

  return homeMusicAudio;
}

function playHomeMusic() {
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
   * 注意：這裡只在 boot 初期使用。
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
     * 清除舊結果頁、折扣碼、排行榜、邀請好友、大陀螺圖等殘留
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

  removeSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      /*
       * 不刪掉 Shopify / theme 本身的元素。
       * 這裡主要刪遊戲自己產生的 DOM。
       */
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
   * 重新設定 app root。
   */
  const root = appRoot();

  root.innerHTML = "";
  root.className = "zg-clean-root";

  /*
   * 這裡保留 root inline style。
   * 它不是 CSS 注入，而是防止 Shopify theme 容器限制遊戲尺寸。
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
   * 重置狀態。
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
  state.launchPower = 0;
  state.chargeDir = 1;
  state.chargeRaf = null;
  state.lastPerfectSoundAt = 0;

  state.resultLogged = false;

  /*
   * 不清掉這些：
   * - selectedTop
   * - enemyTop
   * - profile
   * - playsUsed / remainingPlays
   * - lastBattleResult
   *
   * 因為這些是流程或結果需要沿用的資料。
   */

  /*
   * 清掉戰鬥 FX 計數。
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
   * 04-1. Basic DOM / Screen Switch
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
          el.style.setProperty("pointer-events", "auto", "important");
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
    if (normalizedName === "result") onResultShown();

    try {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      window.scrollTo(0, 0);
    }
  }

  /*
   * ---------------------------------------------------------
   * 04-2. Page Lifecycle Hooks
   * ---------------------------------------------------------
   */

  function onHomeShown() {
    stopBattle();
    cancelChargeLoop();

    removeMenuDom();
    removeLogoDom();
  }

  function onSelectShown() {
    stopBattle();
    cancelChargeLoop();

    renderTopSelection();

    removeMenuDom();
    removeLogoDom();
  }

function onBattleShown() {
  ensureBattleDom(appRoot());
  normalizeBattleLayoutDom();
  removeDuplicateChargeDom();
  bindBattleChargeButton();

  removeMenuDom();
  removeLogoDom();
}

function onResultShown() {
  Sound.stopHum();
  cancelChargeLoop();

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
  ["#screen-start", "#screen-home", "#screen-select", "#screen-battle"].forEach((selector) => {
    document.querySelectorAll(selector).forEach((screen) => {
      screen.classList.remove("active", "is-active");
      screen.setAttribute("aria-hidden", "true");
      screen.hidden = true;

      screen.style.setProperty("display", "none", "important");
      screen.style.setProperty("visibility", "hidden", "important");
      screen.style.setProperty("opacity", "0", "important");
      screen.style.setProperty("pointer-events", "none", "important");
    });
  });

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

    resultScreen.style.setProperty("width", "var(--zg-app-width, 100vw)", "important");
    resultScreen.style.setProperty("min-width", "var(--zg-app-width, 100vw)", "important");
    resultScreen.style.setProperty("max-width", "var(--zg-app-width, 100vw)", "important");

    resultScreen.style.setProperty("height", "var(--zg-app-height, 100vh)", "important");
    resultScreen.style.setProperty("min-height", "var(--zg-app-height, 100vh)", "important");
    resultScreen.style.setProperty("max-height", "var(--zg-app-height, 100vh)", "important");

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

  if (result) {
    renderResult(result);
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
   * 05. HOME PAGE / 首頁
   * =========================================================
   */

function ensureHomeDom(root) {
  if (screenStart()) return;

  const section = document.createElement("section");
  section.id = "screen-start";
  section.className = "zg-screen active zg-home-video-screen";

  section.innerHTML = `
    <video
      class="zg-home-video"
      src="${escapeAttr(HOME_VIDEO_URL)}"
      ${typeof HOME_POSTER_URL !== "undefined" ? `poster="${escapeAttr(HOME_POSTER_URL)}"` : ""}
      autoplay
      muted
      loop
      playsinline
      webkit-playsinline
      preload="auto"
      aria-label="陀螺王決戰：極限衝突首頁動畫"
    ></video>

    <div class="zg-home-video-overlay" aria-hidden="true"></div>

    <button
      class="zg-home-music-hint"
      data-zg-action="unlock-music"
      type="button"
      aria-label="開啟首頁音樂"
    >
      點擊開啟音樂
    </button>

    <div class="zg-home-video-bottom">
      <button
        class="zg-btn zg-btn-red zg-home-video-start-btn"
        data-zg-action="start"
        type="button"
      >
        開始遊戲
      </button>
    </div>
  `;

  root.appendChild(section);

  const video = $(".zg-home-video", section);

  if (video) {
    video.muted = true;
    video.playsInline = true;

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  ensureHomeMusic();

  section.addEventListener(
    "pointerdown",
    () => {
      unlockHomeMusic();

      const hint = $(".zg-home-music-hint", section);
      if (hint) {
        hint.classList.add("is-hidden");
        hint.textContent = "音樂播放中";
      }
    },
    {
      once: true,
      passive: true
    }
  );
}


  function handleHomeStart() {
    if (shouldIgnoreRepeatedAction("start", 500)) return;

    Sound.resume();
    stopHomeMusic();

    loadDailyLimit();

    if (isDailyBlocked()) {
      track("blocked", {
        reason: "daily_limit",
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays,
        source: "home_start"
      });

      alert("今日挑戰次數已用完，請明天再來挑戰！");
      return;
    }

    ensureBasicDom();
    ensureSelectDom(appRoot());

    state.selectedTop = state.selectedTop || loadSelectedTop();

    renderTopSelection();

    track("start", {
      source: "home"
    });

    showScreen("select");
  }

  /*
   * =========================================================
   * 06. TOP SELECT PAGE / 選擇陀螺頁面
   * =========================================================
   */

  function ensureSelectDom(root) {
  if (screenSelect()) return;

  const section = document.createElement("section");
  section.id = "screen-select";
  section.className = "zg-screen zg-select-screen";
  section.hidden = true;

  section.innerHTML = `
    <div class="zg-select-bg" aria-hidden="true">
      <div class="zg-select-orb zg-select-orb-red"></div>
      <div class="zg-select-orb zg-select-orb-blue"></div>
      <div class="zg-select-orb zg-select-orb-gold"></div>
      <div class="zg-select-grid"></div>
      <div class="zg-select-stars">
        <i></i><i></i><i></i><i></i><i></i>
        <i></i><i></i><i></i><i></i><i></i>
      </div>
    </div>

    <main class="zg-main">
      <h2 class="zg-step-title">選擇陀螺</h2>

      <p class="zg-desc">
        不同類型擁有不同碰撞手感與戰鬥節奏。
      </p>

      <div class="zg-top-list" id="zg-top-list"></div>
    </main>

    <div class="zg-bottom">
      <button
        class="zg-btn zg-btn-red"
        data-zg-action="battle"
        type="button"
      >
        發射！開始對戰
      </button>
    </div>
  `;

  root.appendChild(section);
}

  
  function renderTopSelection() {
    const list =
      $(".zg-top-list", screenSelect() || document) ||
      $("#zg-top-list");

    if (!list) return;

    list.innerHTML = TOPS.map((top) => {
      const feel = getFeel(top);

      return `
        <button
          class="zg-top-card ${escapeHtml(top.type)}"
          data-id="${escapeHtml(top.id)}"
          data-type="${escapeHtml(top.type)}"
          data-top-id="${escapeHtml(top.id)}"
          type="button"
        >
          <div
            class="zg-top-icon ${escapeHtml(top.type)}"
            style="--c1:${escapeHtml(top.colorA)};--c2:${escapeHtml(top.colorB)};"
          >
            <img
              class="zg-top-photo"
              src="${escapeAttr(top.image || DEFAULT_TOP_IMAGE)}"
              alt="${escapeAttr(top.name)}"
              loading="lazy"
              draggable="false"
            >
          </div>

          <div class="zg-top-content">
            <div class="zg-top-name">${escapeHtml(top.name)}</div>
            <div class="zg-top-type">${escapeHtml(feel.label)}</div>

            <div class="zg-stats">
              <div class="zg-stat">
                <span>攻擊</span>
                <strong>${top.power}</strong>
              </div>

              <div class="zg-stat">
                <span>防禦</span>
                <strong>${top.defense}</strong>
              </div>

              <div class="zg-stat">
                <span>耐久</span>
                <strong>${top.stamina}</strong>
              </div>

              <div class="zg-stat">
                <span>速度</span>
                <strong>${top.speed}</strong>
              </div>
            </div>
          </div>
        </button>
      `;
    }).join("");

    const selected = state.selectedTop || loadSelectedTop();

    selectTop(selected.id, false);

    $$(
      ".zg-btn, .zg-small-btn, .zg-top-card, [data-zg-action]",
      screenSelect() || document
    ).forEach((el) => {
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("position", "relative", "important");
      el.style.setProperty("z-index", "20", "important");
    });
  }

  function selectTop(id, shouldTrack = true) {
    const top = TOPS.find((item) => item.id === id) || TOPS[0];

    state.selectedTop = top;
    saveSelectedTop(top);

    $$(".zg-top-card").forEach((card) => {
      const active =
        card.getAttribute("data-id") === top.id ||
        card.getAttribute("data-top-id") === top.id;

      card.classList.toggle("selected", active);
      card.classList.toggle("active", active);
      card.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (shouldTrack) {
      track("select_top", {
        topId: top.id,
        topName: top.name,
        topType: top.type,
        source: "select_page"
      });
    }
  }

  function pickEnemyTop() {
    const selectedId = state.selectedTop?.id || "";
    const pool = TOPS.filter((top) => top.id !== selectedId);

    return pool[Math.floor(Math.random() * pool.length)] || TOPS[1] || TOPS[0];
  }

  function handleChangeTop() {
    track("change_top", {
      source: state.screen || "unknown"
    });

    showScreen("select");
  }

  /*
   * =========================================================
   * 07. LAUNCH PREP PAGE / 準備發射頁面
   * =========================================================
   */

  function forceRebuildBattleDom(root = appRoot()) {
  const oldBattle = screenBattle();

  if (oldBattle) {
    try {
      oldBattle.remove();
    } catch (error) {}
  }

  const playerTop = state.selectedTop || loadSelectedTop() || TOPS[0];
  const enemyTop = state.enemyTop || TOPS[1] || TOPS[0];

  const playerImg = getTopBattleImage(playerTop);
const enemyImg = getTopBattleImage(enemyTop);


  const section = document.createElement("section");
  section.id = "screen-battle";
  section.className = "zg-screen zg-battle-screen";
  section.hidden = true;

  section.innerHTML = `
    <main class="zg-battle-main zg-reference-layout">
      <section class="zg-hp-stage" aria-label="雙方能量">
        <div class="zg-hp-row zg-hp-player-row">
          <div class="zg-hp-avatar zg-hp-avatar-player">
            <img
              src="${escapeAttr(playerImg)}"
              alt="${escapeAttr(playerTop.name || "你方陀螺")}"
              draggable="false"
              onerror="this.style.display='none'"
            >
          </div>

          <div
            class="zg-hp-bar"
            role="progressbar"
            aria-label="你方能量"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="100"
          >
            <div class="zg-hp-fill zg-player-hp" id="zg-player-hp"></div>
          </div>

          <span class="zg-hp-name">你</span>
          <span class="zg-hp-text" id="zg-player-hp-text">100%</span>
        </div>

        <div class="zg-hp-row zg-hp-enemy-row">
          <span class="zg-hp-name">敵</span>

          <div
            class="zg-hp-bar"
            role="progressbar"
            aria-label="敵方能量"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="100"
          >
            <div class="zg-hp-fill zg-enemy-hp" id="zg-enemy-hp"></div>
          </div>

          <div class="zg-hp-avatar zg-hp-avatar-enemy">
            <img
              src="${escapeAttr(enemyImg)}"
              alt="${escapeAttr(enemyTop.name || "敵方陀螺")}"
              draggable="false"
              onerror="this.style.display='none'"
            >
          </div>

          <span class="zg-hp-text" id="zg-enemy-hp-text">100%</span>
        </div>
      </section>

      <section class="zg-arena-wrap">
        <div class="zg-battle-box" id="zg-battle-box">
          <img
            class="zg-arena-logo-img"
            src="${ARENA_LOGO_URL}"
            alt=""
            draggable="false"
            aria-hidden="true"
          >
          <div class="zg-arena-ring"></div>
          <div class="zg-flash-overlay"></div>
        </div>
      </section>

      <section class="zg-battle-panel">
        <div class="zg-commentary">
          準備拉繩，按住按鈕蓄力！
        </div>

        <div class="zg-launch-row">
          <div class="zg-external-top-photo">
            <span class="zg-external-photo-label">外部陀螺</span>

            <img
              src="${EXTERNAL_TOP_PHOTO_URL}"
              alt="外部陀螺"
              draggable="false"
              onerror="this.style.display='none'"
            >
          </div>

          <div class="zg-charge-layer" data-charge-grade="weak">
            <div class="zg-charge-card">
              <div class="zg-charge-head">
                <div class="zg-charge-title">拉繩發射！</div>

                <div class="zg-charge-subtitle">
                  接近完美區放開！
                </div>
              </div>

              <div class="zg-charge-meter">
                <div class="zg-charge-percent-badge">0%</div>

                <div
                  class="zg-energy-shell"
                  role="progressbar"
                  aria-label="蓄力能量"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="0"
                  style="--zg-charge-pct: 0%;"
                >
                  <div class="zg-energy-track"></div>
                  <div class="zg-energy-fill"></div>
                  <div class="zg-energy-glow"></div>
                  <div class="zg-energy-perfect-zone"></div>
                  <div class="zg-energy-over-zone"></div>
                  <div class="zg-energy-cap"></div>
                </div>
              </div>

              <button class="zg-charge-btn" type="button">
                按住蓄力
              </button>

              <div class="zg-charge-tip">
                手機長按按鈕，電腦可按空白鍵
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;

  root.appendChild(section);

  bindBattleChargeButton();

  return section;
}


  function ensureBattleDom(root = appRoot()) {
    let section = screenBattle();

    if (!section) {
      section = forceRebuildBattleDom(root);
    }

    /*
     * 如果 charge layer 不在正確位置，直接重建。
     */
    const chargeLayer = $(".zg-charge-layer", section);
    const launchRow = $(".zg-launch-row", section);

    if (
      !chargeLayer ||
      !launchRow ||
      !chargeLayer.closest(".zg-launch-row") ||
      !launchRow.contains(chargeLayer)
    ) {
      section = forceRebuildBattleDom(root);
    }

    bindBattleChargeButton();

    return section;
  }

  function normalizeBattleLayoutDom() {
  const battle = screenBattle();
  if (!battle) return;

  const panel = $(".zg-battle-panel", battle);
  let launchRow = $(".zg-launch-row", battle);

  if (!panel) {
    forceRebuildBattleDom(appRoot());
    return;
  }

  if (!launchRow) {
    launchRow = document.createElement("div");
    launchRow.className = "zg-launch-row";
    panel.appendChild(launchRow);
  }

  let photo =
    $(".zg-launch-row > .zg-external-top-photo", battle) ||
    $(".zg-external-top-photo", battle);

  let charge =
    $(".zg-launch-row > .zg-charge-layer", battle) ||
    $(".zg-charge-layer", battle);

  if (!photo || !charge) {
    forceRebuildBattleDom(appRoot());
    return;
  }

  $$(".zg-charge-layer", battle).forEach((layer) => {
    if (layer !== charge && !layer.closest(".zg-launch-row")) {
      try {
        layer.remove();
      } catch (error) {}
    }
  });

  $$(".zg-launch-row > .zg-charge-layer", battle).forEach((layer) => {
    if (layer !== charge) {
      try {
        layer.remove();
      } catch (error) {}
    }
  });

  $$(".zg-charge-card", battle).forEach((card) => {
    if (!card.closest(".zg-charge-layer")) {
      try {
        card.remove();
      } catch (error) {}
    }
  });

  if (!launchRow.contains(photo)) {
    launchRow.appendChild(photo);
  }

  if (!launchRow.contains(charge)) {
    launchRow.appendChild(charge);
  }

  const commentary = $(".zg-commentary", battle);

  if (commentary && commentary.nextElementSibling !== launchRow) {
    commentary.insertAdjacentElement("afterend", launchRow);
  }

  const card = $(".zg-launch-row > .zg-charge-layer > .zg-charge-card", battle);
  ensureChargeHeadDom(card);
}

  /*
   * ---------------------------------------------------------
   * 07-1. Phase Render
   * ---------------------------------------------------------
   */

  function ensureChargeHeadDom(card) {
  if (!card) return;

  let head = $(".zg-charge-head", card);
  let title = $(".zg-charge-title", card);
  let subtitle = $(".zg-charge-subtitle", card);

  if (!title) {
    title = document.createElement("div");
    title.className = "zg-charge-title";
    title.textContent = "拉繩發射！";
  }

  if (!subtitle) {
    subtitle = document.createElement("div");
    subtitle.className = "zg-charge-subtitle";
    subtitle.textContent = "接近完美區放開！";
  }

  if (!head) {
    head = document.createElement("div");
    head.className = "zg-charge-head";
    card.insertBefore(head, card.firstChild);
  }

  if (title.parentElement !== head) {
    head.appendChild(title);
  }

  if (subtitle.parentElement !== head) {
    head.appendChild(subtitle);
  }
}

  
  function renderLaunchPrep() {
  const battle = ensureBattleDom(appRoot());

  normalizeBattleLayoutDom();

  battle.dataset.phase = "launch";

  state.running = false;
  state.battle = null;
  state.finishing = false;
  state.pendingResult = null;
  state.charging = false;
  state.launchPower = 0;
  state.chargeDir = 1;

  clearBattleObjects();
  updateHpBars();
  setCommentary("準備拉繩，按住按鈕蓄力！");

  const card = $(".zg-launch-row > .zg-charge-layer > .zg-charge-card", battle);
  ensureChargeHeadDom(card);

  const title = $(".zg-launch-row .zg-charge-title", battle);
  const subtitle = $(".zg-launch-row .zg-charge-subtitle", battle);
  const tip = $(".zg-launch-row .zg-charge-tip", battle);
  const btn = $(".zg-charge-btn", battle);

  if (card) {
    card.style.setProperty("display", "grid", "important");
    card.style.setProperty("visibility", "visible", "important");
    card.style.setProperty("opacity", "1", "important");
  }

  if (title) {
    title.textContent = "拉繩發射！";
  }

  if (subtitle) {
    subtitle.textContent = "接近完美區放開！";
  }

  if (tip) {
    tip.textContent = "手機長按按鈕，電腦可按空白鍵";
  }

  if (btn) {
    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.classList.remove("zg-charge-pressing");
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");
  }

  setChargePower(0);
  bindBattleChargeButton();
}



  function renderBattleRunning() {
  const battle = ensureBattleDom(appRoot());

  normalizeBattleLayoutDom();

  battle.dataset.phase = "battle";

  const layer = $(".zg-launch-row > .zg-charge-layer", battle);
  const card = $(".zg-launch-row > .zg-charge-layer > .zg-charge-card", battle);

  ensureChargeHeadDom(card);

  const title = $(".zg-launch-row .zg-charge-title", battle);
  const subtitle = $(".zg-launch-row .zg-charge-subtitle", battle);
  const tip = $(".zg-launch-row .zg-charge-tip", battle);
  const btn = $(".zg-launch-row .zg-charge-btn", battle);

  if (layer) {
    layer.style.setProperty("display", "block", "important");
    layer.style.setProperty("visibility", "visible", "important");
    layer.style.setProperty("opacity", "1", "important");
    layer.style.setProperty("background", "transparent", "important");
  }

  if (card) {
    card.style.setProperty("display", "grid", "important");
    card.style.setProperty("visibility", "visible", "important");
    card.style.setProperty("opacity", "1", "important");
    card.style.setProperty("margin", "0", "important");
    card.style.setProperty("transform", "none", "important");
  }

  if (title) {
    title.textContent = "發射完成";
  }

  if (subtitle) {
    const rawPower = clamp(
      Number(
        state.battle?.launchRawPower ??
        state.launchPower ??
        state.battle?.launchPower ??
        0
      ) || 0,
      0,
      1
    );

    const launchPct =
      Number.isFinite(state.battle?.launchDisplayPercent)
        ? state.battle.launchDisplayPercent
        : getLaunchDisplayPercent(rawPower);

    const grade = getLaunchGrade(rawPower);

    if (grade === "perfect") {
      subtitle.textContent = "本次發射能量 100%・Perfect";
    } else if (grade === "over") {
      subtitle.textContent = `過充！有效發射能量 ${launchPct}%`;
    } else {
      subtitle.textContent = `本次發射能量 ${launchPct}%`;
    }
  }

  if (tip) {
    tip.textContent = "對撞能量請看上方你 / 敵能量條。";
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = "戰鬥進行中";
    btn.style.setProperty("pointer-events", "none", "important");
    btn.style.setProperty("opacity", "0.65", "important");
  }
}


  /*
   * ---------------------------------------------------------
   * 07-2. Charge Button Binding
   * ---------------------------------------------------------
   */

  function bindBattleChargeButton() {
  const battle = screenBattle();
  if (!battle) return;

  const btn = $(".zg-charge-btn", battle);
  if (!btn) return;

  if (btn.dataset.zgChargeBound === "1") {
    return;
  }

  btn.dataset.zgChargeBound = "1";

  btn.style.setProperty("touch-action", "none", "important");
  btn.style.setProperty("-webkit-user-select", "none", "important");
  btn.style.setProperty("user-select", "none", "important");
  btn.style.setProperty("-webkit-touch-callout", "none", "important");
  btn.style.setProperty("pointer-events", "auto", "important");

  let activePointerId = null;
  let chargeStartedAt = 0;
  let mouseDown = false;

  function canStartCharge() {
    if (btn.disabled) return false;
    if (state.screen !== "battle") return false;
    if (state.running) return false;
    if (state.battle) return false;
    if (state.finishing) return false;
    if (state.charging) return false;

    return true;
  }

  function doPress(event) {
    if (!canStartCharge()) return;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    chargeStartedAt = now();

    if (event && event.pointerId !== undefined) {
      activePointerId = event.pointerId;

      try {
        btn.setPointerCapture(event.pointerId);
      } catch (error) {}
    }

    Sound.resume();
    startCharging();

    btn.classList.add("zg-charge-pressing");
  }

  function doRelease(event) {
    if (!state.charging) return;

    if (
      event &&
      activePointerId !== null &&
      event.pointerId !== undefined &&
      event.pointerId !== activePointerId
    ) {
      return;
    }

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const heldMs = now() - chargeStartedAt;

    btn.classList.remove("zg-charge-pressing");

    if (event && event.pointerId !== undefined) {
      try {
        btn.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }

    activePointerId = null;
    mouseDown = false;

    if (heldMs < 120 && state.launchPower < 0.06) {
      cancelChargeLoop();
      setChargePower(0);

      btn.disabled = false;
      btn.textContent = "按住蓄力";
      btn.style.setProperty("pointer-events", "auto", "important");
      btn.style.setProperty("opacity", "1", "important");

      setCommentary("請長按按鈕蓄力，放開後發射！");
      return;
    }

    releaseCharging();
  }

  function doCancel(event) {
    if (!state.charging) return;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    btn.classList.remove("zg-charge-pressing");

    activePointerId = null;
    mouseDown = false;

    cancelChargeLoop();
    setChargePower(0);

    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");

    setCommentary("蓄力取消，請重新長按按鈕！");
  }

  btn.addEventListener(
    "pointerdown",
    (event) => {
      doPress(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "pointerup",
    (event) => {
      doRelease(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "pointercancel",
    (event) => {
      doCancel(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "mousedown",
    (event) => {
      if (window.PointerEvent) return;

      mouseDown = true;
      doPress(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  window.addEventListener(
    "mouseup",
    (event) => {
      if (window.PointerEvent) return;
      if (!mouseDown) return;

      doRelease(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "touchstart",
    (event) => {
      if (window.PointerEvent) return;

      doPress(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "touchend",
    (event) => {
      if (window.PointerEvent) return;

      doRelease(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "touchcancel",
    (event) => {
      if (window.PointerEvent) return;

      doCancel(event);
    },
    {
      capture: true,
      passive: false
    }
  );

  btn.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  btn.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );
}

  /*
   * ---------------------------------------------------------
   * 07-3. Charge Logic
   * ---------------------------------------------------------
   */

  function updateBattleEnergyPanel() {
  const battle = screenBattle();

  if (!battle) return;

  /*
   * 這個區塊是「拉霸 / 蓄力能量 UI」。
   * 發射前由 setChargePower() 控制。
   * 戰鬥開始後，這裡只顯示本次發射結果。
   *
   * 注意：
   * rawPower 是蓄力條實際位置。
   * effective/display percent 是有效發射能量。
   * 只有白色完美區才會顯示 100%。
   */
  if (battle.dataset.phase === "battle") {
    const layer = $(".zg-charge-layer", battle);
    const shell = $(".zg-energy-shell", battle);
    const cap = $(".zg-energy-cap", battle);
    const badge = $(".zg-charge-percent-badge", battle);
    const title = $(".zg-charge-title", battle);
    const subtitle = $(".zg-charge-subtitle", battle);
    const tip = $(".zg-charge-tip", battle);
    const btn = $(".zg-charge-btn", battle);

    const rawPower = clamp(
      Number(
        state.battle?.launchRawPower ??
        state.launchPower ??
        state.battle?.launchPower ??
        0
      ) || 0,
      0,
      1
    );

    /*
     * rawPct：蓄力條實際位置。
     * launchPct：有效發射百分比。
     */
    const rawPct = Math.round(rawPower * 100);

    const launchPct =
      Number.isFinite(state.battle?.launchDisplayPercent)
        ? state.battle.launchDisplayPercent
        : getLaunchDisplayPercent(rawPower);

    const grade = getLaunchGrade(rawPower);
    const percent = `${rawPct}%`;

    if (layer) {
      layer.dataset.chargeGrade = grade;
      layer.dataset.battleEnergy = String(launchPct);
    }

    if (shell) {
      /*
       * 條的位置仍然使用 rawPower。
       * 這樣可以看到玩家實際拉到哪裡。
       */
      shell.style.setProperty("--zg-charge-pct", percent, "important");
      shell.setAttribute("aria-valuemin", "0");
      shell.setAttribute("aria-valuemax", "100");
      shell.setAttribute("aria-valuenow", String(launchPct));
      shell.setAttribute("data-raw-pct", String(rawPct));
      shell.setAttribute("data-effective-pct", String(launchPct));
    }

    if (cap) {
      cap.style.setProperty("left", percent);
      cap.style.setProperty("opacity", "1");
    }

    if (badge) {
      /*
       * 顯示有效發射能量。
       * 只有白色完美區才會是 100%。
       */
      badge.textContent = `${launchPct}%`;
      badge.setAttribute("data-raw-pct", String(rawPct));
      badge.setAttribute("data-effective-pct", String(launchPct));
    }

    if (title) {
      if (grade === "perfect") {
        title.textContent = "完美發射";
      } else if (grade === "over") {
        title.textContent = "過充發射";
      } else if (grade === "good") {
        title.textContent = "強力發射";
      } else if (grade === "weak") {
        title.textContent = "蓄力不足";
      } else {
        title.textContent = "穩定發射";
      }
    }

    if (subtitle) {
      if (grade === "perfect") {
        subtitle.textContent = `本次發射能量 100%・Perfect`;
      } else if (grade === "over") {
        subtitle.textContent = `過充！有效發射能量 ${launchPct}%`;
      } else {
        subtitle.textContent = `本次發射能量 ${launchPct}%`;
      }
    }

    if (tip) {
      tip.textContent = "戰鬥中的對撞能量請看上方你 / 敵能量條。";
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "戰鬥進行中";
      btn.style.setProperty("pointer-events", "none", "important");
      btn.style.setProperty("opacity", "0.65", "important");
    }

    return;
  }

  /*
   * 非 battle phase 時不處理。
   * 發射前蓄力顯示由 setChargePower() 負責。
   */
}



  function setChargePower(power) {
  const p = clamp(Number(power) || 0, 0, 1);

  state.launchPower = p;

  const battle = screenBattle();
  if (!battle) return;

  const layer = $(".zg-charge-layer", battle);
  const shell = $(".zg-energy-shell", battle);
  const cap = $(".zg-energy-cap", battle);
  const badge = $(".zg-charge-percent-badge", battle);
  const btn = $(".zg-charge-btn", battle);
  const subtitle = $(".zg-charge-subtitle", battle);

  const grade = getLaunchGrade(p);

  /*
   * rawPctNumber：蓄力條實際位置。
   * effectivePctNumber：有效發射能量。
   *
   * 重點：
   * 只有白色完美區 CHARGE.perfectMin ~ CHARGE.perfectMax
   * 才會顯示 100%。
   *
   * 超過白色區是 over，不會顯示 100%。
   */
  const rawPctNumber = Math.round(p * 100);
  const effectivePctNumber = getLaunchDisplayPercent(p);

  /*
   * 能量條填滿位置仍然使用 raw percentage。
   * 因為它代表玩家目前拉到哪裡。
   */
  const rawPercent = `${rawPctNumber}%`;

  if (layer) {
    layer.dataset.chargeGrade = grade;
    layer.dataset.rawPct = String(rawPctNumber);
    layer.dataset.effectivePct = String(effectivePctNumber);
  }

  if (shell) {
    shell.style.setProperty("--zg-charge-pct", rawPercent, "important");
    shell.setAttribute("aria-valuemin", "0");
    shell.setAttribute("aria-valuemax", "100");

    /*
     * aria-valuenow 使用有效百分比。
     */
    shell.setAttribute("aria-valuenow", String(effectivePctNumber));

    shell.setAttribute("data-raw-pct", String(rawPctNumber));
    shell.setAttribute("data-effective-pct", String(effectivePctNumber));
  }

  if (badge) {
    /*
     * badge 顯示有效發射能量。
     * 所以只有白色完美區才會出現 100%。
     */
    badge.textContent = `${effectivePctNumber}%`;
    badge.setAttribute("data-raw-pct", String(rawPctNumber));
    badge.setAttribute("data-effective-pct", String(effectivePctNumber));
  }

  if (cap) {
    /*
     * 游標位置使用 raw percentage。
     */
    cap.style.setProperty("left", rawPercent);
    cap.style.setProperty("opacity", p > 0.02 ? "1" : "0.55");
  }

  if (subtitle && state.charging) {
    if (grade === "perfect") {
      subtitle.textContent = "白色完美區！現在放開就是 100%！";
    } else if (grade === "over") {
      subtitle.textContent = "超過完美區，已進入過充！";
    } else if (grade === "good") {
      subtitle.textContent = "接近完美區，繼續抓時機！";
    } else if (grade === "weak") {
      subtitle.textContent = "蓄力不足，繼續按住！";
    } else {
      subtitle.textContent = "穩定蓄力中，注意白色區！";
    }
  }

  if (btn && state.charging) {
    if (grade === "perfect") {
      btn.textContent = "100% 完美！放開！";

      const t = now();

      if (t - (state.lastPerfectSoundAt || 0) > 420) {
        state.lastPerfectSoundAt = t;
        Sound.chargePerfect();
      }
    } else if (grade === "over") {
      btn.textContent = `過充 ${effectivePctNumber}%！`;
    } else if (grade === "good") {
      btn.textContent = `強力蓄力 ${effectivePctNumber}%`;
    } else if (grade === "weak") {
      btn.textContent = `蓄力不足 ${effectivePctNumber}%`;
    } else {
      btn.textContent = `蓄力中 ${effectivePctNumber}%`;
    }

    Sound.chargeTick(p);
  }
}


  function cancelChargeLoop() {
    state.charging = false;

    if (state.chargeRaf) {
      cancelAnimationFrame(state.chargeRaf);
      state.chargeRaf = null;
    }
  }

  function startCharging() {
  if (state.running || state.battle || state.finishing) return;
  if (state.charging) return;
  if (state.screen !== "battle") return;

  const battle = ensureBattleDom(appRoot());

  normalizeBattleLayoutDom();

  battle.dataset.phase = "launch";

  state.charging = true;
  state.launchPower = 0.01;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  setChargePower(0.01);

  const btn = $(".zg-charge-btn", battle);

  if (btn) {
    btn.disabled = false;
    btn.textContent = "蓄力中...";
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");
  }

  setCommentary("蓄力中，抓準時機放開！");

  const tick = () => {
    if (!state.charging) {
      state.chargeRaf = null;
      return;
    }

    let next = state.launchPower + state.chargeDir * CHARGE.speed;

    if (next >= 1) {
      next = 1;
      state.chargeDir = -1;
    } else if (next <= 0) {
      next = 0;
      state.chargeDir = 1;
    }

    setChargePower(next);

    state.chargeRaf = requestAnimationFrame(tick);
  };

  if (state.chargeRaf) {
    cancelAnimationFrame(state.chargeRaf);
    state.chargeRaf = null;
  }

  state.chargeRaf = requestAnimationFrame(tick);
}


  /*
   * ---------------------------------------------------------
   * 07-4. Battle Flow Entry
   * ---------------------------------------------------------
   */

  function releaseCharging() {
 const rawPower = clamp(Number(state.launchPower) || 0, 0, 1);
const power = getLaunchEffectivePower(rawPower);
const grade = getLaunchGrade(rawPower);


  cancelChargeLoop();

track("launch_release", {
  rawPower: Number(rawPower.toFixed(3)),
  power: Number(power.toFixed(3)),
  displayPercent: getLaunchDisplayPercent(rawPower),
  grade,
  topId: state.selectedTop?.id || "",
  topName: state.selectedTop?.name || "",
  enemyId: state.enemyTop?.id || "",
  enemyName: state.enemyTop?.name || ""
});

  if (grade === "perfect") {
    setCommentary("完美發射！能量爆發！");
  } else if (grade === "good") {
    setCommentary("強力發射！轉速快速提升！");
  } else if (grade === "over") {
    setCommentary("過充發射！力量很高，但穩定度下降！");
  } else if (grade === "weak") {
    setCommentary("蓄力不足！起步速度偏低！");
  } else {
    setCommentary("穩定發射！準備交鋒！");
  }

  startBattleWithPower(power, rawPower, grade);
}

  function resetBattleFlowState() {
  state.lastFrame = 0;
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

  state.resultLogged = false;

  state.charging = false;
  state.launchPower = 0;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  PERF.lowFx = false;
  PERF.lastFxAt = 0;
  PERF.lastScratchAt = 0;
  PERF.lastAfterimageAt = 0;
  PERF.lastMotionTrailAt = 0;
  PERF.lastShockwaveAt = 0;
  PERF.lastCollisionTrackAt = 0;
  PERF.activeFx = 0;
  PERF.frameSlowCount = 0;
  PERF.lastHpUiAt = 0;
  PERF.lastHpPulseAt = 0;
  PERF.lastEnergyUiAt = 0;
}


  function beginChargeBattle() {
  if (shouldIgnoreRepeatedAction("battle", 500)) return;

  Sound.resume();
  stopHomeMusic();
  loadDailyLimit();

  if (isDailyBlocked()) {
    track("blocked", {
      reason: "daily_limit",
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      source: "begin_charge_battle"
    });

    alert("今日挑戰次數已用完，請明天再來挑戰！");
    return;
  }

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  cancelChargeLoop();
  stopBattle();

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = pickEnemyTop();

  resetBattleFlowState();

forceRebuildBattleDom(appRoot());
showScreen("battle");
renderLaunchPrep();

  track("launch_prepare", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    playsUsed: state.playsUsed,
    remainingPlays: state.remainingPlays
  });
}


  function startBattle() {
    beginChargeBattle();
  }
 
  function startBattleWithPower(power = 0.72, rawPower = power, forcedGrade = null) {
  Sound.resume();

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  cancelChargeLoop();

 const powerNorm = clamp(Number(power) || 0, 0, 1);
const launchRawPower = clamp(Number(rawPower) || powerNorm, 0, 1);
const launchGrade = forcedGrade || getLaunchGrade(launchRawPower);
    
  const battleScreen = ensureBattleDom(appRoot());

  showScreen("battle");
  normalizeBattleLayoutDom();
  clearBattleObjects();

  state.lastFrame = 0;
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

  state.resultLogged = false;

  state.charging = false;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  PERF.lowFx = false;
  PERF.lastFxAt = 0;
  PERF.lastScratchAt = 0;
  PERF.lastAfterimageAt = 0;
  PERF.lastMotionTrailAt = 0;
  PERF.lastShockwaveAt = 0;
  PERF.lastCollisionTrackAt = 0;
  PERF.activeFx = 0;
  PERF.frameSlowCount = 0;
  PERF.lastHpUiAt = 0;
  PERF.lastHpPulseAt = 0;
  PERF.lastEnergyUiAt = 0;

  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = state.enemyTop || pickEnemyTop();

  const arena = getArenaInfo();
  const player = createBody(state.selectedTop, "player", arena);
  const enemy = createBody(state.enemyTop, "enemy", arena);

  let speedMul = 1;
  let spinMul = 1;
  let stabilityMul = 1;
  let angularMul = 1;

  if (launchGrade === "weak") {
    speedMul = 0.78;
    spinMul = 0.72;
    stabilityMul = 0.92;
    angularMul = 0.88;
  } else if (launchGrade === "normal") {
    speedMul = 0.95;
    spinMul = 0.92;
    stabilityMul = 1;
    angularMul = 1;
  } else if (launchGrade === "good") {
    speedMul = 1.1;
    spinMul = 1.08;
    stabilityMul = 1.05;
    angularMul = 1.08;
  } else if (launchGrade === "perfect") {
    speedMul = 1.28;
    spinMul = 1.22;
    stabilityMul = 1.12;
    angularMul = 1.18;
  } else if (launchGrade === "over") {
    speedMul = 1.06;
    spinMul = 0.96;
    stabilityMul = 0.88;
    angularMul = 0.96;
  }

  player.vx *= speedMul;
  player.vy *= speedMul;
  player.spin *= spinMul;
  player.spinRatio = clamp(player.spinRatio * spinMul, 0, 1);
  player.angularSpeed *= angularMul;
  player.mass *= stabilityMul;

  const enemyPower = rand(0.72, 0.96);

  enemy.vx *= enemyPower;
  enemy.vy *= enemyPower;
  enemy.spin *= 0.9 + enemyPower * 0.14;
  enemy.spinRatio = clamp(
    enemy.spinRatio * (0.9 + enemyPower * 0.14),
    0,
    1
  );

  player.energy = clamp(62 + powerNorm * 42, 35, 100);
  player.maxEnergy = 100;
  player.energyRatio = player.energy / player.maxEnergy;
  player.hp = player.energy;
  player.maxHp = player.maxEnergy;

  enemy.energy = clamp(68 + enemyPower * 28, 45, 100);
  enemy.maxEnergy = 100;
  enemy.energyRatio = enemy.energy / enemy.maxEnergy;
  enemy.hp = enemy.energy;
  enemy.maxHp = enemy.maxEnergy;

  player.el = createTopElement(player.top, "player");
  enemy.el = createTopElement(enemy.top, "enemy");

state.battle = {
  arena,
  player,
  enemy,
  startedAt: now(),
  ended: false,
  finish: "",
  points: 0,

  /*
   * launchPower：實際有效發射能量。
   * launchRawPower：蓄力條原始位置。
   */
  launchPower: powerNorm,
  launchRawPower,
  launchDisplayPercent: getLaunchDisplayPercent(launchRawPower),
  launchGrade
};


  state.running = true;
  state.paused = false;
  state.lastFrame = 0;
  state.launchPower = powerNorm;

  if (battleScreen) {
    battleScreen.dataset.phase = "battle";
  }

  renderBattleRunning();

  syncBody(player);
  syncBody(enemy);
  updateHpBars();
  updateBattleEnergyPanel();
 playLaunchSequence(powerNorm);

   const playerFeel = getFeel(state.selectedTop);
   const enemyFeel = getFeel(state.enemyTop);

   Sound.startHum(0, playerFeel.humBase || 90);
   Sound.startHum(1, enemyFeel.humBase || 76);

  track("battle_start", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    topType: state.selectedTop?.type || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    enemyType: state.enemyTop?.type || "",
    launchPower: Number(powerNorm.toFixed(3)),
    launchGrade,
    speedMul,
    spinMul,
    stabilityMul
  });

  state.raf = requestAnimationFrame(battleLoop);
}
  
  function stopBattle() {
    state.running = false;
    state.paused = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    Sound.stopHum();

    if (state.battle) {
      state.battle.ended = true;
    }

    state.battle = null;
    state.finishing = false;
    state.pendingResult = null;
  }

  /*
   * =========================================================
   * 08. BATTLE PAGE / 陀螺戰鬥頁面
   * =========================================================
   */

  /*
   * ---------------------------------------------------------
   * 08-1. Battle Visual Helpers
   * ---------------------------------------------------------
   */

  function clearBattleObjects() {
    const box = battleBox();
    if (!box) return;

    $$(".zg-battle-top", box).forEach((el) => el.remove());

    $$(
      ".zg-spark, .zg-impact-ring, .zg-metal-spark, .zg-scratch, .zg-launch-shockwave, .zg-spin-afterimage, .zg-impact-streak, .zg-burst-piece, .zg-wall-flash",
      box
    ).forEach((el) => el.remove());

    box.classList.remove(
      "shake",
      "big-shake",
      "punch",
      "zg-killcam",
      "zg-launch-impact",
      "zg-collision-zoom",
      "zg-collision-heavy",
      "zg-impact-punch",
      "zg-center-duel",
      "zg-over-finish",
      "zg-xtreme-finish",
      "zg-burst-finish",
      "zg-spin-finish",
      "zg-wall-rebound-box"
    );

    PERF.activeFx = 0;
  }

  function setCommentary(text) {
    const el = $(".zg-commentary", screenBattle() || document);
    if (el) el.textContent = text;
  }

  function updateHpBars() {
  const t = now();

  if (state.running && t - PERF.lastHpUiAt < 66) {
    return;
  }

  PERF.lastHpUiAt = t;

  const b = state.battle;

  const pFill = $("#zg-player-hp");
  const eFill = $("#zg-enemy-hp");
  const pText = $("#zg-player-hp-text");
  const eText = $("#zg-enemy-hp-text");

  if (!b || !b.player || !b.enemy) {
    if (pFill) {
      pFill.style.setProperty("width", "100%", "important");
      pFill.style.setProperty("transform", "none", "important");
      pFill.setAttribute("data-energy", "100");
    }

    if (eFill) {
      eFill.style.setProperty("width", "100%", "important");
      eFill.style.setProperty("transform", "none", "important");
      eFill.setAttribute("data-energy", "100");
    }

    if (pText) {
      pText.textContent = "100%";
      pText.setAttribute("data-energy", "100");
    }

    if (eText) {
      eText.textContent = "100%";
      eText.setAttribute("data-energy", "100");
    }

    return;
  }

  const pRatio = clamp(
    Number.isFinite(b.player.energyRatio) ? b.player.energyRatio : 1,
    0,
    1
  );

  const eRatio = clamp(
    Number.isFinite(b.enemy.energyRatio) ? b.enemy.energyRatio : 1,
    0,
    1
  );

  const pPct = Math.round(pRatio * 100);
  const ePct = Math.round(eRatio * 100);

  if (pFill) {
    pFill.style.setProperty("width", `${pPct}%`, "important");
    pFill.style.setProperty("transform", "none", "important");
    pFill.setAttribute("data-energy", String(pPct));

    pFill.classList.toggle("is-low", pPct <= 35 && pPct > 18);
    pFill.classList.toggle("is-critical", pPct <= 18);
  }

  if (eFill) {
    eFill.style.setProperty("width", `${ePct}%`, "important");
    eFill.style.setProperty("transform", "none", "important");
    eFill.setAttribute("data-energy", String(ePct));

    eFill.classList.toggle("is-low", ePct <= 35 && ePct > 18);
    eFill.classList.toggle("is-critical", ePct <= 18);
  }

  if (pText) {
    pText.textContent = `${pPct}%`;
    pText.setAttribute("data-energy", String(pPct));
  }

  if (eText) {
    eText.textContent = `${ePct}%`;
    eText.setAttribute("data-energy", String(ePct));
  }
}



function consumeBodyEnergy(body, amount) {
  if (!body) return;

  const maxEnergy = body.maxEnergy || 100;

  const currentEnergy = Number.isFinite(body.energy)
    ? body.energy
    : maxEnergy;

  const cost = Math.max(0, Number(amount) || 0);

  body.energy = clamp(currentEnergy - cost, 0, maxEnergy);
  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);

  /*
   * 新規則：
   * 能量歸零即敗北。
   */
  if (body.energy <= 0 || body.energyRatio <= 0) {
    body.energy = 0;
    body.energyRatio = 0;
    body.dead = true;
  }
}

function restoreBodyEnergy(body, amount) {
  if (!body || body.dead) return;

  const maxEnergy = body.maxEnergy || 100;
  const gain = Math.max(0, Number(amount) || 0);

  body.energy = clamp(
    (body.energy ?? maxEnergy) + gain,
    0,
    maxEnergy
  );

  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);
}

  function drainBodyNaturalEnergy(body, amount) {
  if (!body || body.dead) return;

  const b = state.battle;
  const maxEnergy = body.maxEnergy || 100;

  const currentEnergy = Number.isFinite(body.energy)
    ? body.energy
    : maxEnergy;

  const cost = Math.max(0, Number(amount) || 0);

  if (cost <= 0) return;

  const elapsed = b && b.startedAt
    ? now() - b.startedAt
    : 999999;

  const canNaturalKill =
    PHY.naturalEnergyCanKill === true &&
    elapsed >= (PHY.naturalKillGraceMs || 0);

  /*
   * 預設安全規則：
   * 自然旋轉損耗最多扣到 1。
   * 真正終結仍然交給陀螺碰撞。
   */
  const minEnergy = canNaturalKill ? 0 : 1;

  body.energy = clamp(currentEnergy - cost, minEnergy, maxEnergy);
  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);

  body.hp = body.energy;
  body.maxHp = maxEnergy;

  if (canNaturalKill && body.energy <= 0) {
    body.energy = 0;
    body.energyRatio = 0;
    body.hp = 0;
    body.dead = true;
  }
}



function pulseHpBar(side) {
  const t = now();

  if (t - PERF.lastHpPulseAt < 140) return;

  PERF.lastHpPulseAt = t;

  const fill = side === "player" ? $("#zg-player-hp") : $("#zg-enemy-hp");
  const row = fill ? fill.closest(".zg-hp-row") : null;

  if (!fill) return;

  fill.classList.remove("zg-hp-hit-pulse");
  void fill.offsetWidth;
  fill.classList.add("zg-hp-hit-pulse");

  if (row) {
    row.classList.remove("zg-hp-row-hit");
    void row.offsetWidth;
    row.classList.add("zg-hp-row-hit");

    setTimeout(() => {
      row.classList.remove("zg-hp-row-hit");
    }, 220);
  }
}




function pulseBattleEnergyBar() {
  const t = now();

  if (t - PERF.lastEnergyUiAt < 180) return;

  PERF.lastEnergyUiAt = t;

  const battle = screenBattle();
  if (!battle) return;

  const stage = $(".zg-hp-stage", battle);
  if (!stage) return;

  stage.classList.remove("zg-energy-hit");
  void stage.offsetWidth;
  stage.classList.add("zg-energy-hit");

  setTimeout(() => {
    stage.classList.remove("zg-energy-hit");
  }, 180);
}



  function createTopElement(top, side) {
  const box = battleBox();
  if (!box) return null;

  const el = document.createElement("div");

  el.className =
    `zg-battle-top ${side === "player" ? "zg-player-top" : "zg-enemy-top"} ${top.type}`;

  el.setAttribute("data-side", side);
  el.setAttribute("data-id", top.id);
  el.setAttribute("data-type", top.type);

  /*
   * 戰鬥中不要底圈。
   * 這裡保留 --c1 / --c2 是為了避免 CSS 其他特效需要讀取，
   * 但視覺底圈會透過 class 關掉。
   */
  el.style.setProperty("--c1", top.colorA);
  el.style.setProperty("--c2", top.colorB);

  /*
   * 外層位置與 transform 由 JS 控制，不讓 CSS animation 介入。
   */
  el.style.setProperty("position", "absolute", "important");
  el.style.setProperty("width", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("height", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("min-width", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("min-height", `${PHY.radius * 2}px`, "important");

  el.style.setProperty("display", "flex", "important");
  el.style.setProperty("align-items", "center", "important");
  el.style.setProperty("justify-content", "center", "important");

  el.style.setProperty("left", "50%", "important");
  el.style.setProperty("top", "50%", "important");
  el.style.setProperty("z-index", side === "player" ? "47" : "46", "important");
  el.style.setProperty("pointer-events", "none", "important");
  el.style.setProperty("visibility", "visible", "important");
  el.style.setProperty("opacity", "1", "important");
  el.style.setProperty("animation", "none", "important");

  /*
   * 關掉戰鬥陀螺容器本身可能來自 CSS 的底色 / 圓圈 / 光圈。
   */
    
el.style.setProperty("animation", "none", "important");

el.style.setProperty("background", "transparent", "important");
el.style.setProperty("background-color", "transparent", "important");
el.style.setProperty("background-image", "none", "important");
el.style.setProperty("border", "0", "important");
el.style.setProperty("outline", "0", "important");
el.style.setProperty("box-shadow", "none", "important");
el.style.setProperty("border-radius", "0", "important");
el.style.setProperty("overflow", "visible", "important");


  el.innerHTML = `
    <img
      class="zg-battle-top-photo zg-battle-top-photo-no-base"
      src="${escapeAttr(getTopBattleImage(top))}"
      alt="${escapeAttr(top.name)}"
      draggable="false"
    >
  `;

  box.appendChild(el);

  return el;
}



  function syncBody(body) {
    if (!body || !body.el) return;

    const visualSpin = body.dead ? 0 : Math.max(body.spinRatio, 0.16);

    body.angle += body.angularSpeed * visualSpin;

    body.el.style.setProperty("left", `${body.x}px`, "important");
    body.el.style.setProperty("top", `${body.y}px`, "important");
    body.el.style.setProperty(
      "transform",
      `translate(-50%, -50%) rotate(${body.angle}deg)`,
      "important"
    );
    body.el.style.setProperty("opacity", body.dead ? "0.35" : "1", "important");
    body.el.style.setProperty("display", "flex", "important");
    body.el.style.setProperty("visibility", "visible", "important");
  }

function getArenaInfo() {
  const box = battleBox();

  if (!box) {
    return {
      w: 420,
      h: 420,
      cx: 210,
      cy: 210,
      left: PHY.radius + 12,
      right: 420 - PHY.radius - 12,
      top: PHY.radius + 12,
      bottom: 420 - PHY.radius - 12,
      xtremeX: 210,
      xtremeY: 210,
      xtremeR: 58
    };
  }

  const rect = box.getBoundingClientRect();

  const w = Math.max(260, rect.width || box.clientWidth || 420);
  const h = Math.max(260, rect.height || box.clientHeight || 420);

  const cx = w / 2;
  const cy = h / 2;

  const pad = PHY.ringPadding || PHY.radius + 12;

  return {
    w,
    h,
    cx,
    cy,

    left: PHY.radius + 12,
    right: w - PHY.radius - 12,
    top: PHY.radius + 12,
    bottom: h - PHY.radius - 12,

    xtremeX: cx,
    xtremeY: cy,
    xtremeR: Math.max(44, Math.min(w, h) * 0.14),

    ringRadius: Math.max(80, Math.min(w, h) * 0.5 - pad)
  };
}



  function createBody(top, side, arena) {
  const isPlayer = side === "player";
  const feel = getFeel(top);

  const launchAngle = isPlayer
    ? rand(-0.35, 0.35)
    : Math.PI + rand(-0.35, 0.35);

  const orbitAngle = isPlayer ? Math.PI * 0.12 : Math.PI * 1.12;

  const speedBase =
    PHY.launchSpeed *
    (0.86 + top.speed / 220) *
    rand(0.92, 1.08);

  const vx = Math.cos(launchAngle) * speedBase;
  const vy = Math.sin(launchAngle) * speedBase;

  const x = arena.cx + Math.cos(orbitAngle) * arena.w * 0.28;
  const y = arena.cy + Math.sin(orbitAngle) * arena.h * 0.22;

  const maxHp =
    88 +
    top.defense * 0.48 +
    top.stamina * 0.38 +
    feel.defense * 6;

  const spin =
    920 +
    top.stamina * 8.2 +
    top.speed * 3.4 +
    rand(-30, 50);

  const body = {
    top,
    side,
    el: null,

    x,
    y,
    vx,
    vy,

    r: PHY.radius,
    mass:
      1 +
      top.defense / 165 +
      feel.defense * 0.08,

    /*
     * 真正勝負用 HP。
     * 只有 hp <= 0 才會判敗。
     */
    hp: maxHp,
    maxHp,

    /*
     * 對撞計算用戰鬥能量。
     * 每顆陀螺獨立消耗、獨立計算。
     * UI 上「你 / 敵」兩條 bar 顯示的是這個 energy。
     */
    energy: 100,
    maxEnergy: 100,
    energyRatio: 1,

    spin,
    maxSpin: spin,
    spinRatio: 1,

    angle: rand(0, 360),
    angularSpeed:
      (side === "player" ? 1 : -1) *
      (18 + top.speed / 7 + rand(-2, 2)),

    attack:
      top.power * 0.82 +
      top.speed * 0.22 +
      feel.attack * 5,

    defense:
      top.defense * 0.78 +
      top.stamina * 0.18 +
      feel.defense * 7,

    stamina:
      top.stamina * 0.82 +
      top.defense * 0.12 +
      feel.stamina * 6,

    mobility:
      top.speed * 0.88 +
      feel.mobility * 8,

    wobble: 0,
    dead: false,
    lastWallHitAt: 0,
    lastHitAt: 0,
    combo: 0,
    trailPhase: rand(0, Math.PI * 2),
    centerPullBoost: 0
  };

  return body;
}


  function getBattleCenterDrive(body, other, arena, dt) {
    if (!body || body.dead) {
      return {
        ax: 0,
        ay: 0
      };
    }

    const dx = arena.cx - body.x;
    const dy = arena.cy - body.y;
    const d = Math.max(1, Math.hypot(dx, dy));

    const otherDx = other ? other.x - body.x : 0;
    const otherDy = other ? other.y - body.y : 0;
    const otherD = Math.max(1, Math.hypot(otherDx, otherDy));

    const spinRatio = clamp(body.spinRatio || 0, 0, 1);
    const mobility = clamp(body.mobility / 120, 0.45, 1.35);

    /*
     * 兩股力量：
     * 1. 中心吸引，避免一直貼牆空轉
     * 2. 對手吸引，讓雙方更容易交鋒
     */
    const centerPull =
      PHY.centerPull *
      (0.55 + spinRatio * 0.8) *
      mobility;

    const engagePull =
      PHY.engagePull *
      (0.42 + spinRatio * 0.85) *
      mobility *
      clamp(otherD / arena.w, 0.18, 0.9);

    const ax =
      (dx / d) * centerPull +
      (otherDx / otherD) * engagePull;

    const ay =
      (dy / d) * centerPull +
      (otherDy / otherD) * engagePull;

    /*
     * 加一點切線力，做出繞圈感。
     */
    const tangentDir = body.side === "player" ? 1 : -1;
    const tangent =
      PHY.orbitForce *
      (0.5 + spinRatio * 0.6) *
      mobility;

    const tx = (-dy / d) * tangent * tangentDir;
    const ty = (dx / d) * tangent * tangentDir;

    return {
      ax: (ax + tx) * dt,
      ay: (ay + ty) * dt
    };
  }

  function resolveWall(body, arena) {
  if (!body || body.dead) return;

  let hit = false;
  let nx = 0;
  let ny = 0;

  if (body.x < arena.left) {
    body.x = arena.left;
    body.vx = Math.abs(body.vx) * PHY.wallBounce;
    hit = true;
    nx = 1;
  } else if (body.x > arena.right) {
    body.x = arena.right;
    body.vx = -Math.abs(body.vx) * PHY.wallBounce;
    hit = true;
    nx = -1;
  }

  if (body.y < arena.top) {
    body.y = arena.top;
    body.vy = Math.abs(body.vy) * PHY.wallBounce;
    hit = true;
    ny = 1;
  } else if (body.y > arena.bottom) {
    body.y = arena.bottom;
    body.vy = -Math.abs(body.vy) * PHY.wallBounce;
    hit = true;
    ny = -1;
  }

  if (!hit) return;

  const t = now();
  const speed = Math.hypot(body.vx, body.vy);

  if (speed > 2.2 && t - body.lastWallHitAt > 260) {
    body.lastWallHitAt = t;

    const impulse = clamp(speed / 10, 0.35, 1.6);

    createWallFlash(
      clamp(body.x, arena.left, arena.right),
      clamp(body.y, arena.top, arena.bottom),
      nx,
      ny,
      impulse
    );

    Sound.rail(impulse);

    if (speed > 5.6) {
      shakeArena("shake");
    }

    setCommentary("撞上場邊！反彈回戰線！");
  }
}


function updateBody(body, other, arena, dt) {
  if (!body || body.dead) return;

  const drive = getBattleCenterDrive(body, other, arena, dt);

  body.vx += drive.ax;
  body.vy += drive.ay;

  const speedBeforeClamp = Math.hypot(body.vx, body.vy);

  if (speedBeforeClamp > PHY.maxSpeed) {
    const ratio = PHY.maxSpeed / speedBeforeClamp;
    body.vx *= ratio;
    body.vy *= ratio;
  }

  body.x += body.vx * dt;
  body.y += body.vy * dt;

  const speed = Math.hypot(body.vx, body.vy);
  const distanceFromCenter = Math.hypot(body.x - arena.cx, body.y - arena.cy);
  const edgeRatio = clamp(distanceFromCenter / (arena.w * 0.48), 0, 1);

  /*
   * 外圈摩擦比較高，中心比較順。
   */
  const localFriction =
    PHY.friction -
    0.002 * (1 - edgeRatio) +
    0.003 * edgeRatio;

  body.vx *= Math.pow(localFriction, dt);
  body.vy *= Math.pow(localFriction, dt);

  /*
   * 轉速自然衰減。
   */
  const spinDrain =
    PHY.spinDrain *
    dt *
    (0.82 + body.wobble * 0.12 + edgeRatio * 0.18);

  body.spin = Math.max(0, body.spin - spinDrain);
  body.spinRatio = clamp(body.spin / body.maxSpin, 0, 1);

  body.angularSpeed *= Math.pow(0.9992, dt);

  /*
   * 低轉速時增加晃動。
   */
  if (body.spinRatio < 0.28) {
    body.wobble += (0.28 - body.spinRatio) * 0.018 * dt;
  } else {
    body.wobble *= Math.pow(0.996, dt);
  }

  /*
   * 自然能量損耗：
   * - 旋轉本身會消耗 energy
   * - 高速移動會額外消耗
   * - 外圈摩擦 / 晃動會增加消耗
   *
   * 建議搭配 drainBodyNaturalEnergy()：
   * 預設自然損耗最多扣到 1，
   * 最後終結仍交給碰撞。
   */
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);
  const spinRatio = clamp(body.spinRatio || 0, 0, 1);
  const wobbleRatio = clamp(body.wobble || 0, 0, 2);

  /*
   * spinUse：
   * spinRatio 越高，代表轉得越快，耗能越明顯。
   */
  const spinUse =
    (PHY.spinEnergyDrain ?? 0.026) *
    (0.35 + spinRatio * 0.85);

  const speedUse =
    (PHY.speedEnergyDrain ?? 0.012) *
    speedRatio;

  const edgeUse =
    (PHY.naturalEnergyDrain ?? 0.018) *
    edgeRatio *
    0.45;

  const wobbleUse =
    (PHY.wobbleEnergyDrain ?? 0.018) *
    wobbleRatio *
    0.18;

  /*
   * 低轉速壓力：
   * 讓快沒力時仍會有一點自然流失，
   * 避免卡在極低轉速太久。
   */
  const lowSpinPressure =
    spinRatio < 0.24
      ? (0.24 - spinRatio) * 0.045
      : 0;

  const naturalEnergyCost =
    dt *
    (
      spinUse +
      speedUse +
      edgeUse +
      wobbleUse +
      lowSpinPressure
    );

  drainBodyNaturalEnergy(body, naturalEnergyCost);

  /*
   * energy 歸零即敗北。
   * 如果 PHY.naturalEnergyCanKill=false，
   * drainBodyNaturalEnergy() 會保留最低 1 點，
   * 所以自然損耗不會直接造成死亡。
   */
  if (body.energy <= 0 || body.energyRatio <= 0) {
    body.energy = 0;
    body.energyRatio = 0;
    body.hp = 0;
    body.dead = true;
  } else {
    /*
     * 保持 hp 與 energy 同步，
     * 讓結果頁與 debug state 沿用 hp 欄位時不會殘留。
     */
    body.hp = body.energy;
    body.maxHp = body.maxEnergy || 100;
  }
}



function resolveCollision(a, b) {
  if (!a || !b || a.dead || b.dead) return;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;

  if (dist <= 0 || dist >= minDist) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;

  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const relVel = rvx * nx + rvy * ny;

  if (relVel > 0) return;

  const impactSpeed = Math.abs(relVel);
  const tangentSpeed = Math.abs(rvx * -ny + rvy * nx);
  const spinImpact = Math.abs(a.angularSpeed - b.angularSpeed) * 0.015;

  const impulse =
    (-(1 + PHY.restitution) * relVel) /
    (1 / a.mass + 1 / b.mass);

  const impulseX = impulse * nx;
  const impulseY = impulse * ny;

  a.vx -= impulseX / a.mass;
  a.vy -= impulseY / a.mass;
  b.vx += impulseX / b.mass;
  b.vy += impulseY / b.mass;

  a.angularSpeed += (-ny * impulseX + nx * impulseY) * 0.035;
  b.angularSpeed -= (-ny * impulseX + nx * impulseY) * 0.035;

  const hitPower = clamp(
    impactSpeed * 0.72 +
    tangentSpeed * 0.18 +
    spinImpact,
    0,
    16
  );

  if (hitPower < 0.45) {
    return;
  }

  const t = now();
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

  /*
   * 雙方各自目前 energy。
   * energy 越低，攻防越差。
   */
  const aEnergyRatio = clamp(a.energyRatio ?? 1, 0, 1);
  const bEnergyRatio = clamp(b.energyRatio ?? 1, 0, 1);

  const aEnergyAtkMul = 0.72 + aEnergyRatio * 0.38;
  const bEnergyAtkMul = 0.72 + bEnergyRatio * 0.38;

  const aEnergyDefMul = 0.65 + aEnergyRatio * 0.45;
  const bEnergyDefMul = 0.65 + bEnergyRatio * 0.45;

  const aAtk =
    a.attack *
    (0.84 + a.spinRatio * 0.34) *
    aEnergyAtkMul;

  const bAtk =
    b.attack *
    (0.84 + b.spinRatio * 0.34) *
    bEnergyAtkMul;

  const aDef =
    a.defense *
    (0.88 + a.spinRatio * 0.22) *
    aEnergyDefMul;

  const bDef =
    b.defense *
    (0.88 + b.spinRatio * 0.22) *
    bEnergyDefMul;

  /*
   * HP 只在陀螺碰撞時扣除。
   * aDamage：a 對 b 造成的 HP 傷害。
   * bDamage：b 對 a 造成的 HP 傷害。
   */
  const aDamage =
    Math.max(0.4, (aAtk - bDef * 0.58) * 0.035) *
    hitPower *
    PHY.damageScale *
    state.damagePressure;

  const bDamage =
    Math.max(0.4, (bAtk - aDef * 0.58) * 0.035) *
    hitPower *
    PHY.damageScale *
    state.damagePressure;

/*
 * 現在「你 / 敵」能量條就是勝負條。
 * 陀螺碰撞時只扣 energy。
 *
 * aDamage：a 對 b 造成的能量傷害基準。
 * bDamage：b 對 a 造成的能量傷害基準。
 */
const aEnergyDamage =
  clamp(
    aDamage * 0.95 +
    hitPower * 0.45 +
    tangentSpeed * 0.12,
    0.35,
    18
  );

const bEnergyDamage =
  clamp(
    bDamage * 0.95 +
    hitPower * 0.45 +
    tangentSpeed * 0.12,
    0.35,
    18
  );

/*
 * b 承受 a 的攻擊，所以扣 b。
 * a 承受 b 的攻擊，所以扣 a。
 */
consumeBodyEnergy(b, aEnergyDamage);
consumeBodyEnergy(a, bEnergyDamage);

updateHpBars();

/*
 * 碰撞後如果任一方能量歸零，立刻觸發結束檢查。
 */
if (checkFinish()) {
  return;
}


/*
 * 如果你已經不想用 HP 作為勝負，
 * 可以同步讓 hp 反映 energy，方便結果頁沿用 hp 欄位。
 */
a.hp = a.energy;
a.maxHp = a.maxEnergy;

b.hp = b.energy;
b.maxHp = b.maxEnergy;


  const spinCost = hitPower * PHY.collisionSpinLoss;

  a.spin = Math.max(0, a.spin - spinCost * (1.05 - a.defense / 260));
  b.spin = Math.max(0, b.spin - spinCost * (1.05 - b.defense / 260));

  a.spinRatio = clamp(a.spin / a.maxSpin, 0, 1);
  b.spinRatio = clamp(b.spin / b.maxSpin, 0, 1);

  a.wobble += hitPower * 0.012 * (1.2 - a.spinRatio);
  b.wobble += hitPower * 0.012 * (1.2 - b.spinRatio);

  a.lastHitAt = t;
  b.lastHitAt = t;

if (bDamage > 0.9) {
  pulseHpBar(a.side);
}

if (aDamage > 0.9) {
  pulseHpBar(b.side);
}

  if (a.side === "player" || b.side === "player") {
    pulseBattleEnergyBar();
  }

  updateHpBars();
  updateBattleEnergyPanel();
  state.lastEffectiveHitAt = t;

  const intensity = clamp(hitPower / 8, 0.25, 2.1);
  const heavy =
  hitPower > 4.8 ||
  Math.max(aDamage, bDamage) > 3.6 ||
  Math.max(aEnergyDamage, bEnergyDamage) > 7.5;


  const stronger =
    aDamage > bDamage
      ? a.side === "player"
        ? "你"
        : "敵方"
      : b.side === "player"
        ? "你"
        : "敵方";

  if (!state.firstCollision) {
    state.firstCollision = true;
    setCommentary("首次接觸！衝擊波展開！");
    playFirstCollisionFX(midX, midY, intensity);
    trackCollision("first", hitPower, aDamage, bDamage, a, b);
  } else if (heavy) {
    setCommentary(`${stronger}打出重擊！場地震動！`);
    playHeavyCollisionFX(midX, midY, intensity, a, b);
    trackCollision("heavy", hitPower, aDamage, bDamage, a, b);
  } else {
    if (Math.random() < 0.35) {
      setCommentary("連續碰撞！金屬聲交錯！");
    }

    playNormalCollisionFX(midX, midY, intensity);
    trackCollision("normal", hitPower, aDamage, bDamage);
  }

  maybeTriggerCenterDuel(a, b, hitPower);
}


function trackCollision(kind, hitPower, aDamage, bDamage, a, b) {
  const t = now();

  if (t - PERF.lastCollisionTrackAt < PERF.minCollisionTrackGap) return;

  PERF.lastCollisionTrackAt = t;

  /*
   * aDamage：a 對 b 造成的傷害，所以受傷者是 b。
   * bDamage：b 對 a 造成的傷害，所以受傷者是 a。
   */
  let playerDamage = 0;
  let enemyDamage = 0;

  if (a?.side === "player") {
    playerDamage += bDamage;
  } else if (a?.side === "enemy") {
    enemyDamage += bDamage;
  }

  if (b?.side === "player") {
    playerDamage += aDamage;
  } else if (b?.side === "enemy") {
    enemyDamage += aDamage;
  }

  track("collision", {
    kind,
    hitPower: Number(hitPower.toFixed(2)),
    playerDamage: Number(playerDamage.toFixed(2)),
    enemyDamage: Number(enemyDamage.toFixed(2)),
    playerEnergy: Math.round((state.battle?.player?.energyRatio ?? 1) * 100),
    enemyEnergy: Math.round((state.battle?.enemy?.energyRatio ?? 1) * 100)
  });
}



function playLaunchSequence(power = 0.75) {
  const box = battleBox();
  if (!box) return;

  const intensity = clamp(power * 1.15, 0.4, 1.25);

  Sound.launch();

  box.classList.add("zg-launch-impact");
  restartClass(box, "punch", 260);

  createLaunchShockwave(intensity);
  createImpactStreak(box.clientWidth * 0.5, box.clientHeight * 0.5, intensity);

  setTimeout(() => {
    box.classList.remove("zg-launch-impact");
  }, 380);
}


function playFirstCollisionFX(x, y, intensity) {
  const box = battleBox();

  Sound.metal(0.92 * intensity, 1);
  shakeArena("shake");
  flashArena(0.52 * intensity);

  if (box) {
    restartClass(box, "zg-impact-punch", 180);
  }

  createImpactRing(x, y, 1.05 * intensity);
  createImpactStreak(x, y, 0.95 * intensity);
}




function playNormalCollisionFX(x, y, intensity) {
  Sound.metal(0.48 * intensity, 0.9);

  if (intensity > 0.8) {
    flashArena(0.22 * intensity);
  }

  if (intensity > 0.8 && canFx(180)) {
    createImpactRing(x, y, 0.7 * intensity);
  }
}


function playHeavyCollisionFX(x, y, intensity, a, b) {
  const box = battleBox();

  Sound.metal(0.95 * intensity, 1.08);
  shakeArena("shake");
  flashArena(0.55 * intensity);

  if (box) {
    restartClass(box, "zg-impact-punch", 220);
  }

  createImpactRing(x, y, 1.15 * intensity);

  if (!PERF.lowFx && a && b) {
    createImpactStreak((a.x + b.x) / 2, (a.y + b.y) / 2, intensity);
  }
}


function createStarDust(count = 18) {
  const box = battleBox();
  if (!box || !canFx(180)) return;

  const amount = Math.min(10, fxCount(count, 0.65));
  if (amount <= 0) return;

  const rect = box.getBoundingClientRect();
  const w = rect.width || box.clientWidth || 420;
  const h = rect.height || box.clientHeight || 420;

  const frag = document.createDocumentFragment();

  fxAdd();

  for (let i = 0; i < amount; i += 1) {
    const s = document.createElement("i");

    s.className = "zg-stardust";
    s.style.left = `${rand(8, w - 8)}px`;
    s.style.top = `${rand(8, h - 8)}px`;
    s.style.animationDelay = `${rand(0, 0.18)}s`;
    s.style.opacity = String(rand(0.35, 0.75));

    frag.appendChild(s);
  }

  box.appendChild(frag);

  setTimeout(() => {
    $$(".zg-stardust", box).slice(0, amount).forEach((el) => {
      try {
        el.remove();
      } catch (error) {}
    });

    fxRemove();
  }, 760);
}


function createSparks(x, y, intensity = 1, spread = 1) {
  return;
}

function createMetalSparks(x, y, intensity = 1) {
  return;
}

function createImpactRing(x, y, intensity = 1) {
  const box = battleBox();
  if (!box || !canFx(160)) return;

  const ring = document.createElement("i");

  fxAdd();

  ring.className = "zg-impact-ring";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty("--scale", String(clamp(intensity, 0.45, 1.7)));

  box.appendChild(ring);

  setTimeout(() => {
    try {
      ring.remove();
    } catch (error) {}

    fxRemove();
  }, 460);
}


function createLaunchShockwave(intensity = 1) {
  const box = battleBox();
  if (!box || !canFx(260)) return;

  const wave = document.createElement("i");

  fxAdd();

  wave.className = "zg-launch-shockwave";
  wave.style.left = "50%";
  wave.style.top = "50%";
  wave.style.setProperty("--scale", String(clamp(intensity, 0.55, 1.65)));

  box.appendChild(wave);

  setTimeout(() => {
    try {
      wave.remove();
    } catch (error) {}

    fxRemove();
  }, 520);
}


function createImpactStreak(x, y, intensity = 1) {
  const box = battleBox();
  if (!box || !canFx(180)) return;

  const line = document.createElement("i");

  fxAdd();

  line.className = "zg-impact-streak";
  line.style.left = `${x}px`;
  line.style.top = `${y}px`;
  line.style.setProperty("--rot", `${rand(-28, 28)}deg`);
  line.style.setProperty("--scale", String(clamp(intensity, 0.45, 1.65)));

  box.appendChild(line);

  setTimeout(() => {
    try {
      line.remove();
    } catch (error) {}

    fxRemove();
  }, 340);
}


function createBurstPieces(x, y, intensity = 1) {
  return;
}

function createWallFlash(x, y, nx, ny, intensity = 1) {
  const box = battleBox();
  if (!box || !canFx(180)) return;

  const flash = document.createElement("i");

  fxAdd();

  flash.className = "zg-wall-flash";
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  flash.style.setProperty("--rot", `${Math.atan2(ny, nx)}rad`);
  flash.style.setProperty("--scale", String(clamp(intensity, 0.4, 1.55)));

  box.appendChild(flash);

  setTimeout(() => {
    try {
      flash.remove();
    } catch (error) {}

    fxRemove();
  }, 360);
}


  function createSpinAfterimage(body) {
     return;
  }

  function createMotionTrail(body) {
  if (PERF.lowFx) return;
  if (!body || !body.el || body.dead) return;

  const box = battleBox();
  if (!box || !canFx(160)) return;

  const speed = Math.hypot(body.vx || 0, body.vy || 0);
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);

  if (speedRatio < 0.3) return;

  const trail = document.createElement("i");

  fxAdd();

  trail.className =
    `zg-motion-trail ${body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"}`;

  const angle = Math.atan2(body.vy, body.vx);
  const length = clamp(42 + speedRatio * 70, 42, 105);
  const thickness = clamp(5 + speedRatio * 6, 5, 11);

  const offset = body.r * 0.4 + length * 0.18;
  const x = body.x - Math.cos(angle) * offset;
  const y = body.y - Math.sin(angle) * offset;

  trail.style.left = `${x}px`;
  trail.style.top = `${y}px`;
  trail.style.width = `${length}px`;
  trail.style.height = `${thickness}px`;
  trail.style.setProperty("--rot", `${angle}rad`);
  trail.style.setProperty("--c1", body.top.colorA || "#00eaff");
  trail.style.setProperty("--c2", body.top.colorB || "#fff06a");
  trail.style.opacity = String(clamp(0.14 + speedRatio * 0.22, 0.14, 0.34));

  box.appendChild(trail);

  setTimeout(() => {
    try {
      trail.remove();
    } catch (error) {}

    fxRemove();
  }, 240);
}



  function createScratchTrail(body) {
  if (PERF.lowFx) return;
  if (!body || body.dead) return;

  const box = battleBox();
  if (!box || !canFx(220)) return;

  const scratch = document.createElement("i");

  fxAdd();

  scratch.className = "zg-scratch";
  scratch.style.left = `${body.x}px`;
  scratch.style.top = `${body.y}px`;
  scratch.style.setProperty("--rot", `${Math.atan2(body.vy, body.vx)}rad`);
  scratch.style.opacity = String(0.18 + body.spinRatio * 0.26);

  box.appendChild(scratch);

  setTimeout(() => {
    try {
      scratch.remove();
    } catch (error) {}

    fxRemove();
  }, 360);
}


  function shakeArena(cls = "shake") {
    const box = battleBox();
    if (!box) return;

    restartClass(box, cls, 500);
  }

  function flashArena(power = 1) {
  const box = battleBox();
  if (!box) return;

  const overlay = $(".zg-flash-overlay", box);
  if (!overlay) return;

  const p = clamp(power, 0.25, 1.8);

  overlay.style.setProperty("opacity", String(0.18 + p * 0.26), "important");
  overlay.style.setProperty("transition", "none", "important");

  requestAnimationFrame(() => {
    overlay.style.setProperty("transition", "opacity 260ms ease-out", "important");
    overlay.style.setProperty("opacity", "0", "important");
  });
}


  /*
   * ---------------------------------------------------------
   * 08-2. Special Battle Moments
   * ---------------------------------------------------------
   */

  function maybeTriggerCenterDuel(a, b, hitPower) {
    const battle = state.battle;
    if (!battle || state.centerDuelResolved) return;

    const arena = battle.arena;
    const distA = Math.hypot(a.x - arena.cx, a.y - arena.cy);
    const distB = Math.hypot(b.x - arena.cx, b.y - arena.cy);

    const nearCenter =
      distA < arena.xtremeR * 1.25 &&
      distB < arena.xtremeR * 1.25;

    if (!state.centerDuelStarted && nearCenter && hitPower > 4.3) {
      state.centerDuelStarted = true;
      state.centerDuelStartedAt = now();

      const box = battleBox();

      if (box) {
        box.classList.add("zg-center-duel");
      }

      setCommentary("中心決鬥！雙方在核心區硬碰硬！");
      createImpactRing(arena.cx, arena.cy, 1.8);
      createStarDust(36);
      Sound.metal(1.6, 1.35);

      track("center_duel_start", {
        hitPower: Number(hitPower.toFixed(2))
      });
    }

    if (!state.centerDuelStarted) return;

    const elapsed = now() - state.centerDuelStartedAt;

    if (elapsed > 1500 && nearCenter) {
      state.centerDuelResolved = true;

      const playerScore =
        battle.player.attack * battle.player.spinRatio +
        battle.player.defense * 0.34 +
        rand(-12, 12);

      const enemyScore =
        battle.enemy.attack * battle.enemy.spinRatio +
        battle.enemy.defense * 0.34 +
        rand(-12, 12);

      const loser = playerScore >= enemyScore ? battle.enemy : battle.player;
      const winner = loser === battle.player ? battle.enemy : battle.player;

/*
 * 中心決鬥只做演出與擊退，不額外扣 HP。
 * HP 只允許在 resolveCollision() 的陀螺碰撞中扣除。
 */
loser.spin = Math.max(0, loser.spin - rand(90, 160));
loser.spinRatio = clamp(loser.spin / loser.maxSpin, 0, 1);


      const dirX = loser.x - winner.x;
      const dirY = loser.y - winner.y;
      const d = Math.max(1, Math.hypot(dirX, dirY));

      loser.vx += (dirX / d) * rand(5, 8);
      loser.vy += (dirY / d) * rand(5, 8);

      updateHpBars();
      updateBattleEnergyPanel();

      setCommentary(
        `${winner.side === "player" ? "你" : "敵方"}贏下中心決鬥！`
      );

      playHeavyCollisionFX(arena.cx, arena.cy, 1.55, winner, loser);

      track("center_duel_resolve", {
        winner: winner.side,
        loser: loser.side
      });

      const box = battleBox();

      if (box) {
        setTimeout(() => {
          box.classList.remove("zg-center-duel");
        }, 700);
      }
    }
  }

function battleLoop(ts) {
  const b = state.battle;

  if (!state.running || !b || b.ended) {
    state.raf = null;
    return;
  }

  if (state.paused) {
    state.lastFrame = ts || now();
    state.raf = requestAnimationFrame(battleLoop);
    return;
  }

  const current = ts || now();

  if (!state.lastFrame) {
    state.lastFrame = current;
  }

  const dtRaw = clamp((current - state.lastFrame) / 16.6667, 0.25, 2.2);
  state.lastFrame = current;

  updatePerf(dtRaw);

  const arena = getArenaInfo();

  b.arena = arena;

  updateBody(b.player, b.enemy, arena, dtRaw);
updateBody(b.enemy, b.player, arena, dtRaw);

if (checkFinish()) {
  syncBody(b.player);
  syncBody(b.enemy);
  state.raf = null;
  return;
}

resolveWall(b.player, arena);
resolveWall(b.enemy, arena);
  resolveCollision(b.player, b.enemy);
 
if (!state.running || b.ended || state.finishing) {
  syncBody(b.player);
  syncBody(b.enemy);
  state.raf = null;
  return;
}

syncBody(b.player);
syncBody(b.enemy);

  if (!PERF.lowFx) {
    const t = now();

    if (t - PERF.lastMotionTrailAt > 110) {
      PERF.lastMotionTrailAt = t;
      createMotionTrail(b.player);
      createMotionTrail(b.enemy);
    }

    if (t - PERF.lastScratchAt > 260) {
      PERF.lastScratchAt = t;
      createScratchTrail(b.player);
      createScratchTrail(b.enemy);
    }
  }

  updateHpBars();
  updateBattleEnergyPanel();

  Sound.updateHum(
    0,
    b.player.spinRatio,
    getFeel(b.player.top).humBase || 90,
    getFeel(b.player.top).humGain || 1
  );

  Sound.updateHum(
    1,
    b.enemy.spinRatio,
    getFeel(b.enemy.top).humBase || 76,
    getFeel(b.enemy.top).humGain || 1
  );

  if (checkFinish()) {
    state.raf = null;
    return;
  }

  state.raf = requestAnimationFrame(battleLoop);
}


function checkFinish() {
  const b = state.battle;

  if (!b || b.ended || state.finishing) return false;

  const playerEnergy = Number.isFinite(b.player.energy)
    ? b.player.energy
    : 100;

  const enemyEnergy = Number.isFinite(b.enemy.energy)
    ? b.enemy.energy
    : 100;

  const playerEnergyRatio = clamp(
    Number.isFinite(b.player.energyRatio)
      ? b.player.energyRatio
      : playerEnergy / (b.player.maxEnergy || 100),
    0,
    1
  );

  const enemyEnergyRatio = clamp(
    Number.isFinite(b.enemy.energyRatio)
      ? b.enemy.energyRatio
      : enemyEnergy / (b.enemy.maxEnergy || 100),
    0,
    1
  );

  const pDead =
    b.player.dead ||
    playerEnergy <= 0 ||
    playerEnergyRatio <= 0;

  const eDead =
    b.enemy.dead ||
    enemyEnergy <= 0 ||
    enemyEnergyRatio <= 0;

  if (!pDead && !eDead) return false;

  let result = null;

  if (pDead && eDead) {
    result = "draw";
    b.finish = "double";
  } else if (eDead) {
    result = "win";
    b.finish = "burst";
  } else {
    result = "lose";
    b.finish = "burst";
  }

  const elapsed = now() - b.startedAt;

  const playerSpinRatio = clamp(b.player.spinRatio || 0, 0, 1);
  const enemySpinRatio = clamp(b.enemy.spinRatio || 0, 0, 1);

  const points =
    result === "win"
      ? 110 +
        Math.round(playerEnergyRatio * 45) +
        Math.round(playerSpinRatio * 35)
      : result === "draw"
        ? 60
        : 35 +
          Math.round(playerEnergyRatio * 20) +
          Math.round(playerSpinRatio * 15);

  b.ended = true;
  b.points = points;

  state.running = false;
  state.finishing = true;
  state.finishStartedAt = now();

if (pDead) {
  b.player.dead = true;
  b.player.energy = 0;
  b.player.energyRatio = 0;
  b.player.hp = 0;
  b.player.maxHp = b.player.maxEnergy || 100;
}

if (eDead) {
  b.enemy.dead = true;
  b.enemy.energy = 0;
  b.enemy.energyRatio = 0;
  b.enemy.hp = 0;
  b.enemy.maxHp = b.enemy.maxEnergy || 100;
}

/*
 * 非死者也同步 hp，讓結果頁 / debug state 一致。
 */
if (!pDead) {
  b.player.hp = b.player.energy;
  b.player.maxHp = b.player.maxEnergy || 100;
}

if (!eDead) {
  b.enemy.hp = b.enemy.energy;
  b.enemy.maxHp = b.enemy.maxEnergy || 100;
}


  updateHpBars();

const resultPayload = {
  result,
  finish: b.finish,
  points,

  playerTopId: b.player.top.id,
  playerTopName: b.player.top.name,
  playerTopType: b.player.top.type,
  playerTopImage: b.player.top.image || "",
  playerTopBattleImage: b.player.top.battleImage || "",

  enemyTopId: b.enemy.top.id,
  enemyTopName: b.enemy.top.name,
  enemyTopType: b.enemy.top.type,
  enemyTopImage: b.enemy.top.image || "",
  enemyTopBattleImage: b.enemy.top.battleImage || "",

  launchPower: b.launchPower,
  launchGrade: b.launchGrade,

  playerHp: Math.round(playerEnergyRatio * 100),
  enemyHp: Math.round(enemyEnergyRatio * 100),

  playerEnergy: Math.round(playerEnergyRatio * 100),
  enemyEnergy: Math.round(enemyEnergyRatio * 100),

  playerSpin: Math.round(playerSpinRatio * 100),
  enemySpin: Math.round(enemySpinRatio * 100),

  lineInviteFriendCount: getLineInviteFriendCount(),
  referralCode: getMyReferralCode(),
  inviterReferralCode: getSavedInviterReferralCode(),
  playerName: getPlayerName(),
  score: points,

  durationMs: Math.round(elapsed),
  ts: Date.now()
};


  state.pendingResult = resultPayload;

  playFinishSequence(resultPayload);

  return true;
}


function playFinishSequence(resultPayload) {
  const box = battleBox();

  Sound.stopHum();

  if (box) {
    box.classList.remove("zg-center-duel");

    if (resultPayload.finish === "burst") {
      box.classList.add("zg-burst-finish");
    } else if (resultPayload.finish === "spin") {
      box.classList.add("zg-spin-finish");
    } else {
      box.classList.add("zg-over-finish");
    }

    restartClass(box, "zg-impact-punch", 650);
    createImpactRing(box.clientWidth * 0.5, box.clientHeight * 0.5, 2.15);
    createStarDust(56);
  }

  if (resultPayload.result === "win") {
    setCommentary("勝利！你的陀螺仍然站在場上！");
    Sound.metal(1.6, 0.8);
  } else if (resultPayload.result === "draw") {
    setCommentary("平手！雙方同時耗盡能量！");
    Sound.metal(1.1, 0.75);
  } else {
    setCommentary("敗北！對手撐到了最後！");
    Sound.death();
  }

  if (!state.resultLogged) {
    state.resultLogged = true;

    track("battle_finish", {
      result: resultPayload.result,
      finish: resultPayload.finish,
      points: resultPayload.points,
      playerTopId: resultPayload.playerTopId,
      enemyTopId: resultPayload.enemyTopId,
      launchPower: Number(resultPayload.launchPower.toFixed(3)),
      launchGrade: resultPayload.launchGrade,
      playerHp: resultPayload.playerHp,
      enemyHp: resultPayload.enemyHp,
      playerSpin: resultPayload.playerSpin,
      enemySpin: resultPayload.enemySpin,
      durationMs: resultPayload.durationMs
    });
  }

  setTimeout(() => {
    finishBattle(resultPayload);
  }, 1450);
}


function finishBattle(resultPayload) {
  const result = resultPayload || state.pendingResult;
  if (!result) return;

  state.running = false;
  state.paused = false;
  state.finishing = false;
  state.pendingResult = null;

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  if (state.chargeRaf) {
    cancelAnimationFrame(state.chargeRaf);
    state.chargeRaf = null;
  }

  state.charging = false;

  Sound.stopHum();

  if (state.battle) {
    state.battle.ended = true;
  }

  state.battle = null;
  state.lastBattleResult = result;

  try {
    localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
  } catch (error) {}

  addDailyPlay();

  const oldScore = getMyScore();

  let delta = 0;

  if (result.result === "win") {
    delta = 18 + Math.round((result.points || 0) / 15);
  } else if (result.result === "lose") {
    delta = -8 + Math.round((result.points || 0) / 40);
  } else {
    delta = Math.round((result.points || 0) / 60);
  }

  const newScore = Math.max(0, oldScore + delta);

  setMyScore(newScore);

  try {
    window.dispatchEvent(
      new CustomEvent("zelo:game:finished", {
        detail: {
          ...result,
          oldScore,
          newScore,
          delta
        }
      })
    );
  } catch (error) {}

  showScreen("result");
}


function getResultTopImage(result) {
  if (result?.playerTopBattleImage) {
    return result.playerTopBattleImage;
  }

  if (result?.playerTopImage) {
    return result.playerTopImage;
  }

  const resultTop =
    TOPS.find((top) => top.id === result?.playerTopId) ||
    state.selectedTop ||
    loadSelectedTop() ||
    TOPS[0];

  return resultTop?.battleImage || resultTop?.image || DEFAULT_TOP_IMAGE;
}



  /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁
   * =========================================================
   */

function ensureResultDom(root) {
  if (screenResult()) return;

  const section = document.createElement("section");

  section.id = "screen-result";
  section.className =
    "zg-screen zg-result-screen zg-reward-result-screen zg-result-onepage-screen";
  section.hidden = true;
  section.setAttribute("aria-hidden", "true");

  section.innerHTML = `
    <main class="zg-result-main zg-reward-result-main zg-result-onepage-main">
      <section class="zg-result-battle-summary">
        <div class="zg-result-badge-row">
          <div class="zg-result-badge" id="zg-result-badge">
            勝利
          </div>
        </div>

        <div class="zg-result-top-stage">
          <img
            class="zg-result-top-image"
            id="zg-result-top-image"
            src="${escapeAttr(DEFAULT_TOP_IMAGE)}"
            alt="戰鬥結果陀螺"
            draggable="false"
            onerror="this.onerror=null;this.src='${escapeAttr(DEFAULT_TOP_IMAGE)}';this.style.display='block';this.style.visibility='visible';this.style.opacity='1';"
          >
        </div>

        <div class="zg-result-summary-text">
          <h2 class="zg-result-title" id="zg-result-title">
            你贏得這場對戰！
          </h2>

          <p class="zg-result-message" id="zg-result-message">
            爆裂勝利！你的攻擊完全壓制對手。
          </p>
        </div>

        <div class="zg-result-mini-stats">
          <div class="zg-mini-stat">
            <strong id="zg-result-player-hp">0%</strong>
            <span>我方能量</span>
          </div>

          <div class="zg-mini-stat">
            <strong id="zg-result-enemy-hp">0%</strong>
            <span>敵方能量</span>
          </div>

          <div class="zg-mini-stat">
            <strong id="zg-result-player-spin">0%</strong>
            <span>我方轉速</span>
          </div>

          <div class="zg-mini-stat">
            <strong id="zg-result-enemy-spin">0%</strong>
            <span>敵方轉速</span>
          </div>
        </div>
      </section>

      <section class="zg-coupon-ticket" id="zg-coupon-card">
        <div class="zg-coupon-ticket-left">
          <div class="zg-coupon-label" id="zg-coupon-label">
            恭喜獲得專屬折扣碼
          </div>

          <div class="zg-coupon-code" id="zg-coupon-code">
            ZELO500
          </div>

          <div class="zg-coupon-desc" id="zg-coupon-desc">
            結帳輸入即可折抵
          </div>
        </div>

        <div class="zg-coupon-ticket-cut" aria-hidden="true"></div>

        <button
          class="zg-coupon-copy"
          data-zg-action="copy-coupon"
          type="button"
        >
          複製折扣碼<span id="zg-coupon-copy-code" hidden>ZELO500</span>
        </button>
      </section>

      <section id="zg-friend-rank" class="zg-friend-rank zg-friend-onepage-card">
        <div class="zg-invite-onepage-card">
          <div class="zg-invite-onepage-head">
            <span class="zg-invite-onepage-title">邀請獎勵</span>

            <strong id="zg-invite-status" class="zg-invite-onepage-status">
              尚未解鎖
            </strong>

            <span class="zg-invite-onepage-count">
              朋友圈 <b id="zg-line-friend-count">0</b>人
            </span>

            <span id="zg-my-rank" class="zg-invite-onepage-rank">
              #1
            </span>
          </div>

          <div class="zg-invite-onepage-progress">
            <div class="zg-progress-node" data-target="1">
              <i></i>
              <span>1人</span>
            </div>

            <div class="zg-progress-line"></div>

            <div class="zg-progress-node" data-target="3">
              <i></i>
              <span>3人</span>
            </div>

            <div class="zg-progress-line"></div>

            <div class="zg-progress-node" data-target="5">
              <i></i>
              <span>5人</span>
            </div>
          </div>
        </div>

        <section class="zg-rank-scroll-card">
          <div class="zg-rank-scroll-head">
            <h3 class="zg-rank-title">好友排行榜</h3>
            <span>上下滑動</span>
          </div>

          <div id="zg-rank-list" class="zg-rank-list zg-rank-scroll-list"></div>
        </section>
      </section>

      <div class="zg-result-actions zg-result-actions-twoline">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="restart"
          type="button"
        >
          再戰一次
        </button>

        <button
          class="zg-btn zg-btn-line"
          data-zg-action="share"
          type="button"
        >
          邀請好友
        </button>

        <button
          class="zg-btn zg-btn-blue"
          data-zg-action="select"
          type="button"
        >
          更換陀螺
        </button>

        <button
          class="zg-btn zg-btn-light"
          data-zg-action="home"
          type="button"
        >
          回首頁
        </button>
      </div>
    </main>
  `;

  root.appendChild(section);
}


  function renderFriendRank(result = {}) {
  const root = document.querySelector("#zg-friend-rank");
  if (!root) return;

  const score =
    Number(
      result.score ??
      result.points ??
      result.totalScore ??
      result.finalScore ??
      getMyScore()
    ) || 0;

  const playerName =
    result.playerName ||
    getPlayerName() ||
    "ZELO-MK";

  const lineInviteFriendCount = Number(
    result.lineInviteFriendCount ??
    state?.lineInviteFriendCount ??
    getLineInviteFriendCount()
  ) || 0;

  const friendRank = Array.isArray(result.friendRank)
    ? result.friendRank
    : [];

  let rows = friendRank
    .filter(Boolean)
    .map((item, index) => ({
      rank: Number(item.rank || index + 1),
      name: item.name || item.playerName || "玩家",
      score: Number(item.score || item.points || 0),
      isMe: !!item.isMe
    }));

  const hasMe = rows.some((item) => item.isMe);

  if (!hasMe) {
    rows.unshift({
      rank: 1,
      name: playerName,
      score,
      isMe: true
    });
  }

  rows = rows
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  const meRow = rows.find((item) => item.isMe) || rows[0];
  const myRank = meRow?.rank || 1;

  const inviteStatus =
    lineInviteFriendCount >= 5
      ? "已解鎖"
      : lineInviteFriendCount >= 3
        ? "接近解鎖"
        : lineInviteFriendCount >= 1
          ? "進行中"
          : "尚未解鎖";

  root.innerHTML = `
    <div class="zg-invite-onepage-card">
      <div class="zg-invite-onepage-head">
        <span class="zg-invite-onepage-title">邀請獎勵</span>

        <strong id="zg-invite-status" class="zg-invite-onepage-status">
          ${escapeHtml(inviteStatus)}
        </strong>

        <span class="zg-invite-onepage-count">
          朋友圈 <b id="zg-line-friend-count">${lineInviteFriendCount}</b>人
        </span>

        <span id="zg-my-rank" class="zg-invite-onepage-rank">
          #${myRank}
        </span>
      </div>

      <div class="zg-invite-onepage-progress">
        ${renderInviteProgressNode(1, 3, "bronze", lineInviteFriendCount)}
        <div class="zg-progress-line ${lineInviteFriendCount >= 3 ? "is-active" : ""}"></div>
        ${renderInviteProgressNode(3, 2, "silver", lineInviteFriendCount)}
        <div class="zg-progress-line ${lineInviteFriendCount >= 5 ? "is-active" : ""}"></div>
        ${renderInviteProgressNode(5, 1, "gold", lineInviteFriendCount)}
      </div>
    </div>

<section class="zg-rank-scroll-card">
  <div class="zg-rank-scroll-head">
    <h3 class="zg-rank-title">好友排行榜</h3>
    <span>上下滑動</span>
  </div>

      <div id="zg-rank-list" class="zg-rank-list zg-rank-scroll-list">
        ${rows.map(renderFriendRankItem).join("")}
      </div>
    </section>
  `;
}


function renderInviteProgressNode(target, medalNumber, medalType, count) {
  const active = count >= target ? "is-active" : "";

  return `
    <div
      class="zg-progress-node ${active}"
      data-target="${target}"
      data-medal="${escapeHtml(medalType)}"
    >
      <i>${count >= target ? "✓" : ""}</i>
      <span>${target}人</span>
    </div>
  `;
}


function renderFriendRankItem(item, index) {
  const rank = Number(item.rank || index + 1);
  const name = item.name || "ZELO-MK";
  const score = Number(item.score || 0);
  const isMe = item.isMe ? "is-me" : "";

  let medal = `#${rank}`;

  if (rank === 1) {
    medal = "🥇";
  } else if (rank === 2) {
    medal = "🥈";
  } else if (rank === 3) {
    medal = "🥉";
  }

  return `
    <div class="zg-rank-item ${isMe}">
      <div class="zg-rank-medal">${medal}</div>

      <div class="zg-rank-player">
        <div class="zg-rank-name-row">
          <div class="zg-rank-name">${escapeHtml(name)}</div>
          ${item.isMe ? `<span class="zg-rank-me-badge">我</span>` : ""}
        </div>
      </div>

      <div class="zg-rank-score">${score}</div>
    </div>
  `;
}


function renderResult(result) {
  if (!result) return;

  const lineInviteFriendCount = getLineInviteFriendCount();

  result.lineInviteFriendCount = lineInviteFriendCount;
  result.playerName = result.playerName || getPlayerName();
  result.score = result.score || result.points || getMyScore();

  if (state) {
    state.lastBattleResult = result;
    state.lineInviteFriendCount = lineInviteFriendCount;
  }

  try {
    localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
  } catch (error) {}

  const resultScreen = screenResult();
  const resultMain = $(".zg-result-main", resultScreen || document);

  const topImage = $("#zg-result-top-image");
  const resultBadge = $("#zg-result-badge");
  const resultTitle = $("#zg-result-title");
  const resultMessage = $("#zg-result-message");

  const pHp = $("#zg-result-player-hp");
  const eHp = $("#zg-result-enemy-hp");
  const pSpin = $("#zg-result-player-spin");
  const eSpin = $("#zg-result-enemy-spin");

  const couponCard = $("#zg-coupon-card");
  const couponLabel = $("#zg-coupon-label");
  const couponCode = $("#zg-coupon-code");
  const couponDesc = $("#zg-coupon-desc");
  const couponCopyCode = $("#zg-coupon-copy-code");
  const couponCopyBtn = $(".zg-coupon-copy");

  const playerEnergy = result.playerHp ?? result.playerEnergy ?? 0;
  const enemyEnergy = result.enemyHp ?? result.enemyEnergy ?? 0;
  const playerSpin = result.playerSpin ?? 0;
  const enemySpin = result.enemySpin ?? 0;

  const resultType = result.result || "draw";
  const finishType = result.finish || "";

  const points =
    Number(
      result.points ??
      result.score ??
      result.totalScore ??
      result.finalScore ??
      0
    ) || 0;

  let badgeText = "平手";
  let titleText = "這場對戰勢均力敵！";
  let messageText = "差一點就能突破對手，邀請好友一起挑戰更高分。";

  if (resultType === "win") {
    badgeText = "勝利";
    titleText = "你贏得這場對戰！";
    messageText = "太強了！領取你的專屬折扣碼，並邀請好友挑戰你的分數。";
  } else if (resultType === "lose") {
    badgeText = "失敗";
    titleText = "這次惜敗，再戰一次！";
    messageText = "調整陀螺與發射時機，下次一定能逆轉勝。";
  }

  if (finishType === "burst") {
    messageText =
      resultType === "win"
        ? "爆裂勝利！你的攻擊完全壓制對手。"
        : "被對手爆裂擊破，再戰一次找回節奏。";
  } else if (finishType === "over") {
    messageText =
      resultType === "win"
        ? "成功將對手擊出場外，漂亮的 Over Finish！"
        : "被擊出場外了，下一局注意走位與撞擊角度。";
  } else if (finishType === "spin") {
    messageText =
      resultType === "win"
        ? "你撐到最後一刻，Spin Finish 勝利！"
        : "轉速先耗盡了，試試耐久或平衡型陀螺。";
  } else if (finishType === "xtreme") {
    messageText =
      resultType === "win"
        ? "Xtreme Finish！這場勝利太帥了。"
        : "對手打出 Xtreme Finish，再戰一次逆轉吧。";
  }

  if (resultBadge) {
    resultBadge.textContent = badgeText;
  }

  if (resultTitle) {
    resultTitle.textContent = titleText;
  }

  if (resultMessage) {
    resultMessage.textContent = messageText;
  }

  if (resultScreen) {
    resultScreen.dataset.result = resultType;
    resultScreen.dataset.finish = finishType;
  }

  if (resultMain) {
    resultMain.classList.toggle("zg-result-win", resultType === "win");
    resultMain.classList.toggle("zg-result-lose", resultType === "lose");
    resultMain.classList.toggle("zg-result-draw", resultType === "draw");
  }

  if (topImage) {
    const img = getResultTopImage(result) || DEFAULT_TOP_IMAGE;

    topImage.onerror = () => {
      topImage.onerror = null;
      topImage.src = DEFAULT_TOP_IMAGE;
      topImage.style.setProperty("display", "block", "important");
      topImage.style.setProperty("visibility", "visible", "important");
      topImage.style.setProperty("opacity", "1", "important");
    };

    topImage.src = img;

    topImage.alt =
      result.playerTopName ||
      state.selectedTop?.name ||
      "戰鬥結果陀螺";

    topImage.setAttribute(
      "data-top-id",
      result.playerTopId || state.selectedTop?.id || ""
    );

    topImage.setAttribute(
      "data-top-type",
      result.playerTopType || state.selectedTop?.type || ""
    );

    /*
     * 重要：
     * 不要在 renderResult() 使用 image / compact。
     * 那兩個變數只存在 forceResultVisible() 裡。
     */
    topImage.style.setProperty("display", "block", "important");
    topImage.style.setProperty("visibility", "visible", "important");
    topImage.style.setProperty("opacity", "1", "important");
    topImage.style.setProperty("margin-top", "0", "important");

    topImage.setAttribute("draggable", "false");
    topImage.removeAttribute("title");
    topImage.style.setProperty("user-select", "none", "important");
    topImage.style.setProperty("-webkit-user-drag", "none", "important");
    topImage.style.setProperty("pointer-events", "none", "important");
  }

  if (pHp) pHp.textContent = `${playerEnergy}%`;
  if (eHp) eHp.textContent = `${enemyEnergy}%`;
  if (pSpin) pSpin.textContent = `${playerSpin}%`;
  if (eSpin) eSpin.textContent = `${enemySpin}%`;

  const coupon =
    result.couponCode ||
    result.coupon ||
    state.lastCouponReward?.fixedCode ||
    state.lastCouponReward?.code ||
    "ZELO500";

  if (couponLabel) {
    couponLabel.textContent =
      resultType === "win"
        ? "勝利獎勵・專屬折扣碼"
        : "挑戰完成・專屬折扣碼";
  }

  if (couponCode) {
    couponCode.textContent = coupon;
  }

  if (couponDesc) {
    couponDesc.textContent = "結帳輸入即可折抵";
  }

  if (couponCopyCode) {
    couponCopyCode.textContent = coupon;
  }

  if (couponCopyBtn) {
    const originalHtml =
      `複製折扣碼<span id="zg-coupon-copy-code" hidden>${escapeHtml(coupon)}</span>`;

    couponCopyBtn.setAttribute("data-original-html", originalHtml);
    couponCopyBtn.setAttribute("data-coupon", coupon);
    couponCopyBtn.innerHTML = originalHtml;

    couponCopyBtn.style.setProperty("pointer-events", "auto", "important");
    couponCopyBtn.style.setProperty("display", "flex", "important");
  }

  if (couponCard) {
    couponCard.dataset.coupon = coupon;
    couponCard.classList.add("zg-coupon-ticket");
    restartClass(couponCard, "zg-score-pop", 700);
  }

  /*
   * 先用本機數據渲染一次。
   */
  renderFriendRank(result);

  /*
   * 再向後端同步真正成功邀請人數。
   * 同步成功後重新渲染邀請獎勵與排行榜。
   */
  syncReferralSuccessCount("result_view")
    .then((serverCount) => {
      const updatedResult = {
        ...result,
        lineInviteFriendCount: serverCount,
        playerName: result.playerName || getPlayerName(),
        score: result.score || result.points || getMyScore()
      };

      state.lastBattleResult = updatedResult;
      state.lineInviteFriendCount = serverCount;

      try {
        localStorage.setItem(STORAGE.lastResult, JSON.stringify(updatedResult));
      } catch (error) {}

      renderFriendRank(updatedResult);
      forceResultVisible();
    })
    .catch(() => {});

  forceResultVisible();

  track("result_view", {
    result: resultType,
    finish: finishType,
    points,
    couponCode: coupon,
    lineInviteFriendCount,
    referralCode: getMyReferralCode(),
    playerTopId: result.playerTopId || state.selectedTop?.id || "",
    playerTopName: result.playerTopName || state.selectedTop?.name || "",
    launchPower:
      typeof result.launchPower === "number"
        ? Number(result.launchPower.toFixed(3))
        : null,
    launchGrade: result.launchGrade || "",
    playerHp: playerEnergy,
    enemyHp: enemyEnergy,
    playerSpin,
    enemySpin
  });
}


function forceResultVisible() {
  const root = appRoot();
  const resultScreen = screenResult();

  if (!resultScreen) return;

  const vv = window.visualViewport;

  const appWidth = Math.floor(
    vv && vv.width
      ? vv.width
      : window.innerWidth || document.documentElement.clientWidth || 390
  );

  const appHeight = Math.floor(
    vv && vv.height
      ? vv.height
      : window.innerHeight || document.documentElement.clientHeight || 844
  );

  document.documentElement.style.setProperty("--zg-app-width", `${appWidth}px`);
  document.documentElement.style.setProperty("--zg-app-height", `${appHeight}px`);
  document.documentElement.style.setProperty("--zg-safe-width", `${Math.max(320, appWidth)}px`);

  const compact = appHeight < 720;
  const roomy = appHeight >= 820;

  const battleH = compact ? 216 : roomy ? 268 : 246;
  const couponH = compact ? 100 : roomy ? 118 : 108;
  const inviteH = compact ? 76 : roomy ? 86 : 80;
  const actionH = compact ? 82 : 92;
  const btnH = compact ? 37 : 42;
  const gap = compact ? 7 : 8;
  const rankGap = compact ? 6 : 8;

  /*
   * 重點：
   * bottomPad 不要太大，讓好友排行榜能往下延伸。
   */
  const bottomPad = compact ? 102 : roomy ? 114 : 108;

  const fullWidth = "var(--zg-app-width, 100vw)";
  const fullHeight = "var(--zg-app-height, 100vh)";

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  const setAll = (selector, styles) => {
    $$(selector, resultScreen).forEach((el) => {
      Object.entries(styles).forEach(([prop, value]) => {
        set(el, prop, value);
      });
    });
  };

  /*
   * Root
   */
  if (root) {
    set(root, "position", "fixed");
    set(root, "inset", "0 auto auto 0");
    set(root, "left", "0");
    set(root, "top", "0");
    set(root, "right", "auto");
    set(root, "bottom", "auto");

    set(root, "width", fullWidth);
    set(root, "min-width", fullWidth);
    set(root, "max-width", fullWidth);

    set(root, "height", fullHeight);
    set(root, "min-height", fullHeight);
    set(root, "max-height", fullHeight);

    set(root, "margin", "0");
    set(root, "padding", "0");
    set(root, "overflow", "hidden");
    set(root, "box-sizing", "border-box");
    set(root, "z-index", "999999");
    set(root, "transform", "none");
  }

  /*
   * Result screen
   */
  resultScreen.hidden = false;
  resultScreen.removeAttribute("hidden");
  resultScreen.classList.add("active", "is-active");
  resultScreen.setAttribute("aria-hidden", "false");

  set(resultScreen, "position", "fixed");
  set(resultScreen, "inset", "0 auto auto 0");
  set(resultScreen, "left", "0");
  set(resultScreen, "top", "0");
  set(resultScreen, "right", "auto");
  set(resultScreen, "bottom", "auto");

  set(resultScreen, "width", fullWidth);
  set(resultScreen, "min-width", fullWidth);
  set(resultScreen, "max-width", fullWidth);

  set(resultScreen, "height", fullHeight);
  set(resultScreen, "min-height", fullHeight);
  set(resultScreen, "max-height", fullHeight);

  set(resultScreen, "display", "flex");
  set(resultScreen, "flex-direction", "column");
  set(resultScreen, "align-items", "stretch");
  set(resultScreen, "justify-content", "stretch");

  set(resultScreen, "visibility", "visible");
  set(resultScreen, "opacity", "1");
  set(resultScreen, "pointer-events", "auto");
  set(resultScreen, "overflow", "hidden");
  set(resultScreen, "box-sizing", "border-box");
  set(resultScreen, "transform", "none");

  /*
   * Main grid
   */
  const main = $(".zg-result-main", resultScreen);

  if (main) {
    set(main, "position", "relative");

    set(main, "width", fullWidth);
    set(main, "min-width", fullWidth);
    set(main, "max-width", fullWidth);

    set(main, "height", fullHeight);
    set(main, "min-height", "0");
    set(main, "max-height", fullHeight);

    set(main, "margin", "0");
    set(
      main,
      "padding",
      `${gap}px ${gap}px calc(env(safe-area-inset-bottom, 0px) + ${bottomPad}px)`
    );

    set(main, "box-sizing", "border-box");
    set(main, "display", "grid");
    set(main, "grid-template-columns", "minmax(0, 1fr)");
    set(main, "grid-template-rows", `${battleH}px ${couponH}px minmax(0, 1fr)`);
    set(main, "gap", `${gap}px`);

    set(main, "align-content", "stretch");
    set(main, "align-items", "stretch");
    set(main, "justify-items", "stretch");

    set(main, "overflow", "hidden");
    set(main, "transform", "none");
  }

  /*
   * Common normalization
   */
  setAll(
    [
      ".zg-result-battle-summary",
      ".zg-coupon-ticket",
      ".zg-coupon-row-card",
      ".zg-friend-onepage-card",
      ".zg-invite-onepage-card",
      ".zg-rank-scroll-card",
      ".zg-result-actions"
    ].join(","),
    {
      width: "100%",
      "min-width": "0",
      "max-width": "100%",
      "margin-left": "0",
      "margin-right": "0",
      "justify-self": "stretch",
      "align-self": "stretch",
      "box-sizing": "border-box",
      transform: "none"
    }
  );

  /*
   * Force display
   */
  const displayMap = [
    [".zg-result-battle-summary", "grid"],
    [".zg-result-badge-row", "flex"],
    [".zg-result-badge", "inline-flex"],
    [".zg-result-top-stage", "grid"],
    [".zg-result-top-image", "block"],
    [".zg-result-summary-text", "flex"],
    [".zg-result-title", "block"],
    [".zg-result-message", "block"],
    [".zg-result-mini-stats", "grid"],
    [".zg-mini-stat", "flex"],

    [".zg-coupon-ticket", "grid"],
    [".zg-coupon-ticket-left", "flex"],
    [".zg-coupon-ticket-cut", "block"],
    [".zg-coupon-label", "block"],
    [".zg-coupon-code", "block"],
    [".zg-coupon-desc", "block"],
    [".zg-coupon-copy", "inline-flex"],

    [".zg-friend-onepage-card", "grid"],
    [".zg-invite-onepage-card", "block"],
    [".zg-invite-onepage-head", "grid"],
    [".zg-invite-onepage-progress", "grid"],
    [".zg-progress-node", "flex"],
    [".zg-progress-line", "block"],

    [".zg-rank-scroll-card", "grid"],
    [".zg-rank-scroll-head", "flex"],
    [".zg-rank-title", "block"],
    [".zg-rank-scroll-list", "flex"],
    [".zg-rank-item", "grid"],
    [".zg-rank-medal", "flex"],
    [".zg-rank-player", "block"],
    [".zg-rank-name-row", "flex"],
    [".zg-rank-name", "block"],
    [".zg-rank-me-badge", "inline-flex"],
    [".zg-rank-score", "block"],

    [".zg-result-actions", "grid"],
    [".zg-result-actions .zg-btn", "flex"]
  ];

  displayMap.forEach(([selector, display]) => {
    $$(selector, resultScreen).forEach((el) => {
      set(el, "display", display);
      set(el, "visibility", "visible");
      set(el, "opacity", "1");
    });
  });

  /*
   * Battle card
   */
  const battleCard = $(".zg-result-battle-summary", resultScreen);

  if (battleCard) {
    set(battleCard, "height", `${battleH}px`);
    set(battleCard, "min-height", `${battleH}px`);
    set(battleCard, "max-height", `${battleH}px`);
    set(battleCard, "padding", compact ? "7px 10px" : "8px 12px");
    set(battleCard, "display", "grid");
    set(
      battleCard,
      "grid-template-rows",
      compact
        ? "30px 120px 56px"
        : roomy
          ? "36px 156px 66px"
          : "32px 142px 62px"
    );
    set(battleCard, "gap", "2px");
    set(battleCard, "overflow", "visible");
    set(battleCard, "isolation", "isolate");
  }

  const badgeRow = $(".zg-result-badge-row", resultScreen);

  if (badgeRow) {
    set(badgeRow, "align-items", "center");
    set(badgeRow, "justify-content", "center");
    set(badgeRow, "min-height", "0");
    set(badgeRow, "position", "relative");
    set(badgeRow, "z-index", "40");
    set(badgeRow, "pointer-events", "none");
  }

  const badge = $(".zg-result-badge", resultScreen);

  if (badge) {
    set(badge, "height", compact ? "26px" : "32px");
    set(badge, "min-height", compact ? "26px" : "32px");
    set(badge, "padding", "0 18px");
    set(badge, "margin", "0 auto");
    set(badge, "font-size", compact ? "13px" : "16px");
    set(badge, "font-weight", "900");
    set(badge, "line-height", compact ? "26px" : "32px");
    set(badge, "align-items", "center");
    set(badge, "justify-content", "center");
    set(badge, "position", "relative");
    set(badge, "z-index", "41");
    set(
      badge,
      "box-shadow",
      "0 0 18px rgba(255,255,255,.48), 0 8px 18px rgba(0,0,0,.38)"
    );
  }

  /*
   * Top stage + FX
   */
  const topStage = $(".zg-result-top-stage", resultScreen);

  if (topStage) {
    if (!$(".zg-result-top-fx-ring", topStage)) {
      const fxRing = document.createElement("i");
      fxRing.className = "zg-result-top-fx-ring";
      fxRing.setAttribute("aria-hidden", "true");
      topStage.appendChild(fxRing);
    }

    if (!$(".zg-result-top-fx-core", topStage)) {
      const fxCore = document.createElement("i");
      fxCore.className = "zg-result-top-fx-core";
      fxCore.setAttribute("aria-hidden", "true");
      topStage.appendChild(fxCore);
    }

    if (!$$(".zg-result-top-fx-spark", topStage).length) {
      for (let i = 0; i < 8; i += 1) {
        const spark = document.createElement("i");
        spark.className = "zg-result-top-fx-spark";
        spark.style.setProperty("--i", String(i));
        spark.setAttribute("aria-hidden", "true");
        topStage.appendChild(spark);
      }
    }

    set(topStage, "display", "grid");
    set(
      topStage,
      "grid-template-columns",
      compact
        ? "minmax(82px, 1fr) auto minmax(82px, 1fr)"
        : "minmax(96px, 1fr) auto minmax(96px, 1fr)"
    );
    set(topStage, "grid-template-rows", "1fr");
    set(topStage, "align-items", "center");
    set(topStage, "justify-items", "center");
    set(topStage, "column-gap", compact ? "6px" : "10px");
    set(topStage, "min-height", "0");
    set(topStage, "overflow", "visible");
    set(topStage, "position", "relative");
    set(topStage, "isolation", "isolate");
    set(topStage, "background", "transparent");
    set(topStage, "background-color", "transparent");
    set(topStage, "background-image", "none");
  }

  const image = $("#zg-result-top-image", resultScreen);

  if (image) {
    const imgSize = compact ? 82 : roomy ? 108 : 96;

    set(image, "width", `${imgSize}px`);
    set(image, "height", `${imgSize}px`);
    set(image, "max-width", compact ? "28vw" : "32vw");
    set(image, "max-height", `${imgSize}px`);
    set(image, "object-fit", "contain");
    set(image, "pointer-events", "none");
    set(image, "position", "relative");
    set(image, "z-index", "12");
    set(image, "margin-top", "0");
    set(image, "grid-column", "2");
    set(image, "grid-row", "1");
    set(image, "justify-self", "center");
    set(image, "align-self", "center");
    set(image, "user-select", "none");
    set(image, "-webkit-user-drag", "none");

    image.setAttribute("draggable", "false");
    image.removeAttribute("title");

    set(
      image,
      "filter",
      [
        "drop-shadow(0 0 10px rgba(255,45,150,.95))",
        "drop-shadow(0 0 18px rgba(87,242,255,.88))",
        "drop-shadow(0 0 30px rgba(87,242,255,.50))",
        "drop-shadow(0 14px 22px rgba(0,0,0,.45))"
      ].join(" ")
    );
  }

  $$(".zg-result-top-fx-ring, .zg-result-top-fx-core, .zg-result-top-fx-spark", resultScreen).forEach((fx) => {
    set(fx, "position", "absolute");
    set(fx, "left", "50%");
    set(fx, "top", compact ? "50%" : "calc(50% + 2px)");
    set(fx, "pointer-events", "none");
  });

  const fxRing = $(".zg-result-top-fx-ring", resultScreen);

  if (fxRing) {
    set(fxRing, "width", compact ? "120px" : roomy ? "148px" : "136px");
    set(fxRing, "height", compact ? "120px" : roomy ? "148px" : "136px");
    set(fxRing, "z-index", "8");
    set(fxRing, "border-radius", "999px");
    set(
      fxRing,
      "background",
      "conic-gradient(from 0deg, transparent 0deg, rgba(87,242,255,0) 24deg, rgba(87,242,255,.85) 52deg, rgba(255,45,150,.82) 86deg, transparent 122deg, transparent 180deg, rgba(255,240,106,.7) 222deg, rgba(87,242,255,.82) 268deg, transparent 330deg, transparent 360deg)"
    );
    set(fxRing, "-webkit-mask", "radial-gradient(circle, transparent 0 48%, #000 51% 58%, transparent 61%)");
    set(fxRing, "mask", "radial-gradient(circle, transparent 0 48%, #000 51% 58%, transparent 61%)");
    set(fxRing, "filter", "drop-shadow(0 0 10px rgba(87,242,255,.85)) drop-shadow(0 0 18px rgba(255,45,150,.58))");
    set(fxRing, "opacity", ".92");
    set(fxRing, "transform", "translate(-50%, -50%)");
  }

  const fxCore = $(".zg-result-top-fx-core", resultScreen);

  if (fxCore) {
    set(fxCore, "width", compact ? "142px" : roomy ? "174px" : "160px");
    set(fxCore, "height", compact ? "92px" : roomy ? "116px" : "104px");
    set(fxCore, "z-index", "5");
    set(fxCore, "border-radius", "999px");
    set(
      fxCore,
      "background",
      "radial-gradient(circle, rgba(87,242,255,.40) 0%, rgba(87,242,255,.15) 34%, transparent 72%), radial-gradient(circle, rgba(255,45,150,.24) 0%, transparent 60%), radial-gradient(circle, rgba(255,240,106,.14) 0%, transparent 64%)"
    );
    set(fxCore, "filter", "blur(8px)");
    set(fxCore, "opacity", ".95");
    set(fxCore, "transform", "translate(-50%, -50%)");
  }

  $$(".zg-result-top-fx-spark", resultScreen).forEach((spark) => {
    set(spark, "width", "6px");
    set(spark, "height", "6px");
    set(spark, "z-index", "14");
    set(spark, "border-radius", "999px");
    set(spark, "background", "#8ff7ff");
    set(spark, "box-shadow", "0 0 8px rgba(87,242,255,.95), 0 0 14px rgba(255,45,150,.72)");
    set(spark, "opacity", ".9");
  });

  /*
   * Mini stats move into topStage
   */
  const miniStats = $(".zg-result-mini-stats", resultScreen);

  if (topStage && miniStats && miniStats.parentElement !== topStage) {
    topStage.appendChild(miniStats);
  }

  if (miniStats) {
    set(miniStats, "display", "grid");
    set(miniStats, "grid-template-columns", "minmax(0, 1fr) minmax(0, 1fr)");
    set(miniStats, "grid-template-rows", "repeat(2, minmax(0, 1fr))");
    set(miniStats, "gap", compact ? "5px" : "7px");
    set(miniStats, "width", "100%");
    set(miniStats, "height", "100%");
    set(miniStats, "min-height", "0");
    set(miniStats, "overflow", "visible");
    set(miniStats, "grid-column", "1 / 4");
    set(miniStats, "grid-row", "1");
    set(miniStats, "pointer-events", "none");
    set(miniStats, "z-index", "16");
  }

  $$(".zg-mini-stat", resultScreen).forEach((stat, index) => {
    const statW = compact ? "78px" : roomy ? "92px" : "86px";
    const statH = compact ? "34px" : roomy ? "40px" : "36px";

    set(stat, "position", "relative");
    set(stat, "z-index", "18");
    set(stat, "width", statW);
    set(stat, "min-width", statW);
    set(stat, "max-width", statW);
    set(stat, "height", statH);
    set(stat, "min-height", statH);
    set(stat, "max-height", statH);
    set(stat, "padding", "2px 3px");
    set(stat, "border-radius", "11px");
    set(stat, "align-items", "center");
    set(stat, "justify-content", "center");
    set(stat, "flex-direction", "column");
    set(stat, "overflow", "visible");
    set(stat, "background", "rgba(6, 14, 26, .58)");
    set(stat, "border", "1px solid rgba(255,255,255,.12)");
    set(stat, "backdrop-filter", "blur(8px)");

    if (index === 0) {
      set(stat, "grid-column", "1");
      set(stat, "grid-row", "1");
      set(stat, "justify-self", "start");
      set(stat, "align-self", "end");
    }

    if (index === 1) {
      set(stat, "grid-column", "1");
      set(stat, "grid-row", "2");
      set(stat, "justify-self", "start");
      set(stat, "align-self", "start");
    }

    if (index === 2) {
      set(stat, "grid-column", "2");
      set(stat, "grid-row", "1");
      set(stat, "justify-self", "end");
      set(stat, "align-self", "end");
    }

    if (index === 3) {
      set(stat, "grid-column", "2");
      set(stat, "grid-row", "2");
      set(stat, "justify-self", "end");
      set(stat, "align-self", "start");
    }
  });

  $$(".zg-mini-stat strong", resultScreen).forEach((el) => {
    set(el, "font-size", compact ? "16px" : roomy ? "20px" : "18px");
    set(el, "line-height", "1");
    set(el, "font-weight", "950");
  });

  $$(".zg-mini-stat span", resultScreen).forEach((el) => {
    set(el, "margin-top", "1px");
    set(el, "font-size", compact ? "8px" : "9px");
    set(el, "line-height", compact ? "10px" : "11px");
    set(el, "white-space", "nowrap");
  });

  /*
   * Summary text
   */
  const summaryText = $(".zg-result-summary-text", resultScreen);

  if (summaryText) {
    const summaryH = compact ? "56px" : roomy ? "66px" : "62px";

    set(summaryText, "position", "relative");
    set(summaryText, "width", "100%");
    set(summaryText, "min-width", "0");
    set(summaryText, "height", summaryH);
    set(summaryText, "min-height", summaryH);
    set(summaryText, "max-height", summaryH);
    set(summaryText, "display", "flex");
    set(summaryText, "flex-direction", "column");
    set(summaryText, "align-items", "center");
    set(summaryText, "justify-content", "flex-start");
    set(summaryText, "padding", "0 10px");
    set(summaryText, "padding-top", compact ? "2px" : "3px");
    set(summaryText, "margin", "0");
    set(summaryText, "text-align", "center");
    set(summaryText, "overflow", "visible");
    set(summaryText, "transform", "none");
    set(summaryText, "grid-row", "3");
    set(summaryText, "align-self", "center");
  }

  const title = $(".zg-result-title", resultScreen);

  if (title) {
    const titleH = compact ? "34px" : roomy ? "42px" : "38px";

    set(title, "position", "relative");
    set(title, "display", "block");
    set(title, "width", "100%");
    set(title, "max-width", "100%");
    set(title, "height", titleH);
    set(title, "min-height", titleH);
    set(title, "max-height", titleH);
    set(title, "margin", "0");
    set(title, "padding", "0");
    set(
      title,
      "font-size",
      compact
        ? "clamp(21px, 5.6vw, 27px)"
        : roomy
          ? "clamp(28px, 6.8vw, 42px)"
          : "clamp(25px, 6.2vw, 36px)"
    );
    set(title, "line-height", titleH);
    set(title, "font-weight", "950");
    set(title, "letter-spacing", "-0.04em");
    set(title, "white-space", "nowrap");
    set(title, "overflow", "visible");
    set(title, "text-overflow", "clip");
    set(title, "text-align", "center");
    set(title, "transform", "none");
  }

  const message = $(".zg-result-message", resultScreen);

  if (message) {
    const messageH = compact ? "20px" : roomy ? "24px" : "22px";

    set(message, "position", "relative");
    set(message, "display", "block");
    set(message, "width", "100%");
    set(message, "max-width", "100%");
    set(message, "height", messageH);
    set(message, "min-height", messageH);
    set(message, "max-height", messageH);
    set(message, "margin", "0");
    set(message, "padding", "0");
    set(message, "font-size", compact ? "11px" : roomy ? "14px" : "13px");
    set(message, "line-height", messageH);
    set(message, "opacity", ".82");
    set(message, "white-space", "nowrap");
    set(message, "overflow", "hidden");
    set(message, "text-overflow", "ellipsis");
    set(message, "text-align", "center");
    set(message, "transform", "none");
  }

  /*
   * Coupon
   */
  const couponCard =
    $(".zg-coupon-ticket", resultScreen) ||
    $(".zg-coupon-row-card", resultScreen);

  if (couponCard) {
    couponCard.classList.add("zg-coupon-ticket");

    set(
      couponCard,
      "background",
      "radial-gradient(circle at left center, rgba(9,6,18,1) 0 10px, transparent 11px), radial-gradient(circle at right center, rgba(9,6,18,1) 0 10px, transparent 11px), linear-gradient(100deg, #fff6d2 0%, #ffe27b 34%, #ffb21c 100%)"
    );
    set(couponCard, "border-radius", "18px");
    set(couponCard, "border", "1px solid rgba(255,255,255,.45)");
    set(couponCard, "color", "#231300");
    set(couponCard, "box-shadow", "0 12px 26px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.72)");
    set(couponCard, "height", `${couponH}px`);
    set(couponCard, "min-height", `${couponH}px`);
    set(couponCard, "max-height", `${couponH}px`);
    set(couponCard, "padding", compact ? "8px 10px" : "9px 14px");
    set(couponCard, "display", "grid");
    set(couponCard, "grid-template-columns", "minmax(0, 1fr) 14px auto");
    set(couponCard, "align-items", "center");
    set(couponCard, "align-content", "center");
    set(couponCard, "gap", compact ? "7px" : "9px");
    set(couponCard, "overflow", "hidden");
    set(couponCard, "position", "relative");
  }

  const couponLeft = $(".zg-coupon-ticket-left", resultScreen);

  if (couponLeft) {
    set(couponLeft, "display", "flex");
    set(couponLeft, "flex-direction", "column");
    set(couponLeft, "justify-content", "center");
    set(couponLeft, "min-width", "0");
    set(couponLeft, "height", "100%");
    set(couponLeft, "overflow", "visible");
  }

  const couponCut = $(".zg-coupon-ticket-cut", resultScreen);

  if (couponCut) {
    set(couponCut, "height", "100%");
    set(couponCut, "min-height", "0");
    set(couponCut, "border-left", "2px dashed rgba(42,24,0,.35)");
    set(couponCut, "position", "relative");
  }

  const couponLabel = $(".zg-coupon-label", resultScreen);

  if (couponLabel) {
    set(couponLabel, "margin", "0 0 3px");
    set(couponLabel, "font-size", compact ? "11px" : "12px");
    set(couponLabel, "line-height", "1.15");
    set(couponLabel, "font-weight", "900");
    set(couponLabel, "white-space", "nowrap");
    set(couponLabel, "overflow", "hidden");
    set(couponLabel, "text-overflow", "ellipsis");
  }

  const couponCode = $("#zg-coupon-code", resultScreen);

  if (couponCode) {
    set(couponCode, "margin", "0");
    set(couponCode, "display", "block");
    set(couponCode, "transform", "translateY(0)");
    set(
      couponCode,
      "font-size",
      compact
        ? "clamp(31px, 8vw, 40px)"
        : roomy
          ? "clamp(36px, 8.8vw, 48px)"
          : "clamp(34px, 8.4vw, 44px)"
    );
    set(couponCode, "line-height", "1");
    set(couponCode, "padding", "0");
    set(couponCode, "font-weight", "1000");
    set(couponCode, "letter-spacing", "-0.045em");
    set(couponCode, "white-space", "nowrap");
    set(couponCode, "overflow", "visible");
    set(couponCode, "text-overflow", "clip");
  }

  const couponDesc = $(".zg-coupon-desc", resultScreen);

  if (couponDesc) {
    set(couponDesc, "display", "block");
    set(couponDesc, "visibility", "visible");
    set(couponDesc, "height", "auto");
    set(couponDesc, "margin", "2px 0 0");
    set(couponDesc, "overflow", "visible");
    set(couponDesc, "font-size", compact ? "11px" : "12px");
    set(couponDesc, "line-height", "1.15");
    set(couponDesc, "font-weight", "800");
    set(couponDesc, "white-space", "nowrap");
  }

  const couponCopy = $(".zg-coupon-copy", resultScreen);

  if (couponCopy) {
    set(couponCopy, "height", compact ? "36px" : roomy ? "40px" : "38px");
    set(couponCopy, "min-height", compact ? "36px" : roomy ? "40px" : "38px");
    set(couponCopy, "min-width", compact ? "82px" : roomy ? "96px" : "90px");
    set(couponCopy, "padding", "0 10px");
    set(couponCopy, "border-radius", "999px");
    set(couponCopy, "border", "0");
    set(couponCopy, "background", "#fff");
    set(couponCopy, "color", "#1f1400");
    set(couponCopy, "font-size", compact ? "11px" : "12px");
    set(couponCopy, "font-weight", "900");
    set(couponCopy, "line-height", "1");
    set(couponCopy, "white-space", "nowrap");
    set(couponCopy, "align-items", "center");
    set(couponCopy, "justify-content", "center");
  }

  /*
   * Invite + Rank
   */
  const friendCard = $(".zg-friend-onepage-card", resultScreen);

  if (friendCard) {
    set(friendCard, "height", "100%");
    set(friendCard, "min-height", "0");
    set(friendCard, "max-height", "none");
    set(friendCard, "display", "grid");
    set(friendCard, "grid-template-rows", `${inviteH}px minmax(0, 1fr)`);
    set(friendCard, "gap", `${rankGap}px`);
    set(friendCard, "overflow", "hidden");
    set(friendCard, "align-self", "stretch");
  }

  const inviteCard = $(".zg-invite-onepage-card", resultScreen);

  if (inviteCard) {
    set(inviteCard, "height", `${inviteH}px`);
    set(inviteCard, "min-height", `${inviteH}px`);
    set(inviteCard, "max-height", `${inviteH}px`);
    set(inviteCard, "padding", compact ? "7px 10px" : "8px 12px");
    set(inviteCard, "overflow", "visible");
  }

  const inviteHead = $(".zg-invite-onepage-head", resultScreen);

  if (inviteHead) {
    set(inviteHead, "display", "grid");
    set(inviteHead, "grid-template-columns", "auto auto minmax(0, 1fr) auto");
    set(inviteHead, "align-items", "center");
    set(inviteHead, "gap", "5px");
    set(inviteHead, "margin-bottom", compact ? "7px" : "8px");
    set(inviteHead, "font-size", compact ? "9px" : "10px");
    set(inviteHead, "line-height", "1.1");
    set(inviteHead, "white-space", "nowrap");
  }

  const inviteProgress = $(".zg-invite-onepage-progress", resultScreen);

  if (inviteProgress) {
    set(inviteProgress, "display", "grid");
    set(inviteProgress, "grid-template-columns", "auto minmax(0, 1fr) auto minmax(0, 1fr) auto");
    set(inviteProgress, "align-items", "center");
    set(inviteProgress, "gap", "5px");
    set(inviteProgress, "overflow", "visible");
  }

  setAll(".zg-progress-node, .zg-progress-line", {
    overflow: "visible"
  });

  const rankCard = $(".zg-rank-scroll-card", resultScreen);

  if (rankCard) {
    set(rankCard, "margin-top", "0");
    set(rankCard, "margin-bottom", "0");
    set(rankCard, "align-self", "stretch");
    set(rankCard, "height", "100%");
    set(rankCard, "min-height", "0");
    set(rankCard, "max-height", "none");
    set(rankCard, "padding", compact ? "8px 9px" : "10px 10px");
    set(rankCard, "display", "grid");
    set(rankCard, "grid-template-rows", compact ? "26px minmax(0, 1fr)" : "30px minmax(0, 1fr)");
    set(rankCard, "gap", compact ? "5px" : "7px");
    set(rankCard, "overflow", "hidden");
  }

  const rankHead = $(".zg-rank-scroll-head", resultScreen);

  if (rankHead) {
    set(rankHead, "height", compact ? "26px" : "30px");
    set(rankHead, "min-height", compact ? "26px" : "30px");
    set(rankHead, "align-items", "center");
    set(rankHead, "justify-content", "space-between");
  }

  const rankTitle = $(".zg-rank-title", resultScreen);

  if (rankTitle) {
    set(rankTitle, "margin", "0");
    set(rankTitle, "font-size", compact ? "18px" : "20px");
    set(rankTitle, "line-height", compact ? "26px" : "30px");
    set(rankTitle, "font-weight", "900");
  }

  const rankList = $("#zg-rank-list", resultScreen);

  if (rankList) {
    set(rankList, "display", "flex");
    set(rankList, "flex-direction", "column");
    set(rankList, "gap", "6px");
    set(rankList, "overflow-y", "auto");
    set(rankList, "overflow-x", "hidden");
    set(rankList, "-webkit-overflow-scrolling", "touch");
    set(rankList, "height", "100%");
    set(rankList, "min-height", "0");
    set(rankList, "max-height", "none");
  }

  $$(".zg-rank-item", resultScreen).forEach((item) => {
    set(item, "min-height", compact ? "34px" : "38px");
    set(item, "height", compact ? "34px" : "38px");
    set(item, "padding", compact ? "5px 8px" : "6px 9px");
    set(item, "display", "grid");
    set(item, "grid-template-columns", "38px minmax(0, 1fr) auto");
    set(item, "align-items", "center");
    set(item, "gap", "8px");
  });

  /*
   * Bottom actions
   */
  const actions = $(".zg-result-actions", resultScreen);

  if (actions) {
    actions.classList.remove("zg-result-actions-oneline");
    actions.classList.add("zg-result-actions-twoline");

    set(actions, "position", "fixed");
    set(actions, "left", "8px");
    set(actions, "right", "8px");
    set(actions, "bottom", "calc(env(safe-area-inset-bottom, 0px) + 8px)");
    set(actions, "display", "grid");
    set(actions, "grid-template-columns", "repeat(2, minmax(0, 1fr))");
    set(actions, "grid-template-rows", `repeat(2, ${btnH}px)`);
    set(actions, "gap", "8px");
    set(actions, "width", "auto");
    set(actions, "min-width", "0");
    set(actions, "max-width", "none");
    set(actions, "height", `${actionH}px`);
    set(actions, "z-index", "80");
    set(actions, "box-sizing", "border-box");
    set(actions, "pointer-events", "auto");
  }

  $$(".zg-result-actions .zg-btn", resultScreen).forEach((btn) => {
    set(btn, "width", "100%");
    set(btn, "height", `${btnH}px`);
    set(btn, "min-height", `${btnH}px`);
    set(btn, "padding", "0 8px");
    set(btn, "display", "flex");
    set(btn, "align-items", "center");
    set(btn, "justify-content", "center");
    set(btn, "border-radius", "14px");
    set(btn, "font-size", compact ? "12px" : "13px");
    set(btn, "font-weight", "900");
    set(btn, "line-height", "1");
    set(btn, "white-space", "nowrap");
    set(btn, "box-sizing", "border-box");
    set(btn, "pointer-events", "auto");
    set(btn, "position", "relative");
    set(btn, "z-index", "20");
  });

  $$(".zg-coupon-copy, [data-zg-action]", resultScreen).forEach((el) => {
    if (el.closest(".zg-result-actions")) return;

    set(el, "pointer-events", "auto");
    set(el, "position", "relative");
    set(el, "z-index", "20");
  });

  const actionLabels = [
    ["restart", "再戰一次"],
    ["share", "邀請好友"],
    ["select", "更換陀螺"],
    ["home", "回首頁"]
  ];

  actionLabels.forEach(([action, label]) => {
    const btn = $(`[data-zg-action="${action}"]`, resultScreen);

    if (btn) {
      btn.textContent = label;
    }
  });

  const lineBtn = $(".zg-btn-line", resultScreen);

  if (lineBtn) {
    set(lineBtn, "background", "#06c755");
    set(lineBtn, "color", "#fff");
    set(lineBtn, "border-color", "rgba(255,255,255,.18)");
  }
}



  
  function restartFromResult() {
    if (shouldIgnoreRepeatedAction("restart", 500)) return;

    beginChargeBattle();
  }

  /*
 * =========================================================
 * 10. DAILY LIMIT / 每日次數限制
 * =========================================================
 *
 * 注意：
 * getTodayKey / getDailyKey / loadDailyLimit / isDailyBlocked
 * 已在 HELPERS 區定義。
 * 這裡只保留 addDailyPlay，避免重複宣告覆蓋前面的版本。
 */

function addDailyPlay() {
  const result = increaseDailyPlay();

  track("daily_play_used", {
    playsUsed: result.playsUsed,
    remainingPlays: result.remainingPlays,
    dailyLimit: DAILY_LIMIT,
    dailyKey: getDailyKey()
  });

  return result;
}

  /*
   * =========================================================
   * 11. LIFF / Profile Integration
   * =========================================================
   */

  async function initLiffProfile() {
    const liffId = window.ZELO_LIFF_ID || window.liffId || "";

    if (!liffId || !window.liff) {
      state.profile = getProfile();
      return state.profile;
    }

    try {
      await window.liff.init({
        liffId
      });

      if (!window.liff.isLoggedIn()) {
        window.liff.login();
        return null;
      }

      const profile = await window.liff.getProfile();

      state.profile = profile;

      window.ZELO_PROFILE = profile;

      try {
        localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
      } catch (error) {}

      track("liff_profile_loaded", {
        userId: profile.userId || "",
        displayName: profile.displayName || ""
      });

      return profile;
    } catch (error) {
      console.warn("[ZELO GAME] LIFF init failed", error);

      state.profile = getProfile();

      track("liff_profile_error", {
        message: String(error && error.message ? error.message : error)
      });

      return state.profile;
    }
  }

  /*
   * =========================================================
   * 12. TRACKING / Analytics
   * =========================================================
   */

  function track(eventName, payload = {}) {
    const data = {
      event: eventName,
      ts: Date.now(),
      screen: state.screen || "",
      userId: getUserId(),
      playerName: getPlayerName(),
      ...payload
    };

    try {
      window.dispatchEvent(
        new CustomEvent("zelo:game:track", {
          detail: data
        })
      );
    } catch (error) {}

    if (window.ZELO_GAME_DEBUG) {
      console.log("[ZELO GAME TRACK]", data);
    }

    /*
     * 可選整合：
     * window.ZELO_TRACK(eventName, data)
     */
    try {
      if (typeof window.ZELO_TRACK === "function") {
        window.ZELO_TRACK(eventName, data);
      }
    } catch (error) {}
  }


  function showToast(message, duration = 1800) {
  const text = String(message || "");
  if (!text) return;

  let toast = document.getElementById("zg-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "zg-toast";
    toast.className = "zg-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = text;

  toast.style.setProperty("position", "fixed", "important");
  toast.style.setProperty("left", "50%", "important");
  toast.style.setProperty("bottom", "24px", "important");
  toast.style.setProperty("transform", "translateX(-50%)", "important");
  toast.style.setProperty("z-index", "1000000", "important");
  toast.style.setProperty("max-width", "calc(100vw - 40px)", "important");
  toast.style.setProperty("padding", "10px 14px", "important");
  toast.style.setProperty("border-radius", "999px", "important");
  toast.style.setProperty("background", "rgba(0,0,0,.82)", "important");
  toast.style.setProperty("color", "#fff", "important");
  toast.style.setProperty("font-size", "13px", "important");
  toast.style.setProperty("line-height", "1.4", "important");
  toast.style.setProperty("box-shadow", "0 10px 30px rgba(0,0,0,.28)", "important");
  toast.style.setProperty("opacity", "1", "important");
  toast.style.setProperty("visibility", "visible", "important");
  toast.style.setProperty("pointer-events", "none", "important");
  toast.style.setProperty("transition", "opacity .2s ease, visibility .2s ease", "important");

  window.clearTimeout(toast.__zgTimer);

  toast.__zgTimer = window.setTimeout(() => {
    toast.style.setProperty("opacity", "0", "important");
    toast.style.setProperty("visibility", "hidden", "important");
  }, duration);
}

  
  
  async function handleCopyCoupon(target) {
  const button = target?.closest?.(".zg-coupon-copy") || $(".zg-coupon-copy");

  const coupon =
    button?.getAttribute("data-coupon") ||
    $("#zg-coupon-code")?.textContent?.trim() ||
    "ZELO500";

  if (!coupon) return;

  const originalHtml =
    button?.getAttribute("data-original-html") ||
    `複製折扣碼<span id="zg-coupon-copy-code" hidden>${escapeHtml(coupon)}</span>`;

  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(coupon);
      copied = true;
    }
  } catch (error) {
    copied = false;
  }

  if (!copied) {
    try {
      const textarea = document.createElement("textarea");

      textarea.value = coupon;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      copied = document.execCommand("copy");

      textarea.remove();
    } catch (error) {
      copied = false;
    }
  }

  if (button) {
    button.innerHTML = copied ? "已複製！" : "複製失敗";
    button.classList.add("is-copied");

    window.clearTimeout(button.__zgCopyTimer);

    button.__zgCopyTimer = window.setTimeout(() => {
      button.innerHTML = originalHtml;
      button.classList.remove("is-copied");
    }, 1200);
  }

  showToast(
    copied
      ? `已複製折扣碼：${coupon}`
      : "無法自動複製，請手動複製折扣碼"
  );

  track("coupon_copy", {
    couponCode: coupon,
    success: copied
  });
}


  /*
   * =========================================================
   * 13. GLOBAL EVENTS / 全域事件
   * =========================================================
   */

  function handleClose() {
  stopBattle();
  cancelChargeLoop();
  showScreen("start");
}
  
  function handleAction(action, target) {
    if (!action) return;

    Sound.resume();
    
if (action === "copy-coupon") {
  handleCopyCoupon(target);
  return;
}
    
    if (action === "unlock-music") {
  unlockHomeMusic();

  if (target) {
    target.classList.add("is-hidden");
    target.textContent = "音樂播放中";
  }

  return;
}

if (action === "start") {
  unlockHomeMusic();
  handleHomeStart();
  return;
}


    if (action === "home") {
      stopBattle();
      cancelChargeLoop();
      showScreen("start");
      return;
    }

    if (action === "select") {
      stopBattle();
      cancelChargeLoop();
      showScreen("select");
      return;
    }

    if (action === "battle") {
      beginChargeBattle();
      return;
    }

    if (action === "restart") {
      restartFromResult();
      return;
    }

if (action === "share") {
  handleShare();
  return;
}

    if (action === "close") {
      handleClose();
    }
  }

 function handleShare() {
  const result =
    state.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
    {};

  const referralUrl = buildReferralUrl();
  const myReferralCode = getMyReferralCode();

  const text = result
    ? `我在 ZELO 陀螺競技場${result.result === "win" ? "獲勝" : "完成挑戰"}，拿到 ${result.points || 0} 分！快來挑戰我的分數！`
    : "來挑戰 ZELO 陀螺競技場，看看誰的陀螺能站到最後！";

  track("share_click", {
    hasResult: !!result,
    result: result?.result || "",
    points: result?.points || 0,
    referralCode: myReferralCode,
    referralUrl,
    lineInviteFriendCount: getLineInviteFriendCount()
  });

  /*
   * 優先使用 LIFF 分享。
   * 注意：
   * 分享成功不代表邀請成功。
   * 真正 +1 要等好友用 ref 連結進入遊戲，
   * 並且 register_referral 成功寫入 Apps Script。
   */
  try {
    if (
      window.liff &&
      typeof window.liff.isInClient === "function" &&
      window.liff.isInClient() &&
      typeof window.liff.shareTargetPicker === "function"
    ) {
      window.liff.shareTargetPicker([
        {
          type: "text",
          text: `${text}\n${referralUrl}`
        }
      ])
        .then(() => {
          track("referral_share_sent", {
            source: "line_liff_share_target_picker",
            referralCode: myReferralCode,
            referralUrl
          });

          showToast("邀請連結已送出，好友進入遊戲後才會增加朋友圈人數。");
        })
        .catch((error) => {
          track("referral_share_cancel_or_fail", {
            source: "line_liff_share_target_picker",
            referralCode: myReferralCode,
            message: String(error && error.message ? error.message : error)
          });
        });

      return;
    }
  } catch (error) {
    track("referral_share_liff_error", {
      source: "line_liff_share_target_picker",
      referralCode: myReferralCode,
      message: String(error && error.message ? error.message : error)
    });
  }

  /*
   * 手機原生分享。
   */
  if (navigator.share) {
    navigator.share({
      title: "ZELO 陀螺競技場",
      text,
      url: referralUrl
    })
      .then(() => {
        track("referral_share_sent", {
          source: "native_share",
          referralCode: myReferralCode,
          referralUrl
        });

        showToast("邀請連結已送出，好友進入遊戲後才會增加朋友圈人數。");
      })
      .catch((error) => {
        track("referral_share_cancel_or_fail", {
          source: "native_share",
          referralCode: myReferralCode,
          message: String(error && error.message ? error.message : error)
        });
      });

    return;
  }

  /*
   * fallback：複製邀請連結。
   * 複製不算邀請成功。
   */
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(`${text}\n${referralUrl}`);
      alert("邀請連結已複製，好友用此連結進入遊戲後才會增加朋友圈人數。");
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = `${text}\n${referralUrl}`;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      document.execCommand("copy");
      textarea.remove();

      alert("邀請連結已複製，好友用此連結進入遊戲後才會增加朋友圈人數。");
    }
  } catch (error) {
    alert(`${text}\n${referralUrl}`);
  }

  track("referral_link_copied", {
    source: "clipboard_fallback",
    referralCode: myReferralCode,
    referralUrl
  });
}
 



  function bindGlobalEvents() {
    if (state.globalBound) return;

    state.globalBound = true;

    document.addEventListener(
      "click",
      (event) => {
        const actionEl = event.target.closest("[data-zg-action]");

        if (!actionEl) return;

        const root = appRoot();

        if (!root.contains(actionEl)) return;

        event.preventDefault();
        event.stopPropagation();

        const action = actionEl.getAttribute("data-zg-action");

        handleAction(action, actionEl);
      },
      true
    );

    document.addEventListener(
      "click",
      (event) => {
        const card = event.target.closest(".zg-top-card");

        if (!card) return;

        const root = appRoot();

        if (!root.contains(card)) return;

        event.preventDefault();
        event.stopPropagation();

        const id =
          card.getAttribute("data-id") ||
          card.getAttribute("data-top-id") ||
          "";

        if (id) {
          selectTop(id, true);
        }
      },
      true
    );

    document.addEventListener(
      "keydown",
      (event) => {
        const key = event.key;

        if (key === "Escape") {
          if (state.screen === "battle") {
            stopBattle();
            cancelChargeLoop();
            showScreen("select");
            return;
          }

          if (state.screen === "select" || state.screen === "result") {
            showScreen("start");
            return;
          }
        }

        /*
         * 電腦版支援空白鍵蓄力。
         */
        if (key === " " || key === "Spacebar") {
          const battle = screenBattle();
          const btn = battle ? $(".zg-charge-btn", battle) : null;

          if (!btn) return;
          if (btn.disabled) return;
          if (state.screen !== "battle") return;
          if (state.running || state.battle || state.finishing) return;

          event.preventDefault();
          event.stopPropagation();

          if (!state.charging) {
            Sound.resume();
            startCharging();
            btn.classList.add("zg-charge-pressing");
          }
        }
      },
      true
    );

    document.addEventListener(
      "keyup",
      (event) => {
        const key = event.key;

        if (key !== " " && key !== "Spacebar") return;
        if (!state.charging) return;

        event.preventDefault();
        event.stopPropagation();

        const battle = screenBattle();
        const btn = battle ? $(".zg-charge-btn", battle) : null;

        if (btn) {
          btn.classList.remove("zg-charge-pressing");
        }

        releaseCharging();
      },
      true
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          if (state.charging) {
            cancelChargeLoop();
            setChargePower(0);
          }

          if (state.running) {
            state.paused = true;
          }

          Sound.stopHum();
        } else {
          if (state.running && state.battle) {
            state.paused = false;
            state.lastFrame = 0;
            Sound.resume();

            if (!state.raf) {
              state.raf = requestAnimationFrame(battleLoop);
            }
          }
        }
      },
      false
    );


    window.addEventListener("pagehide", () => {
      cancelChargeLoop();
      stopBattle();
      Sound.stopHum();
    });

    window.addEventListener("beforeunload", () => {
      cancelChargeLoop();
      Sound.stopHum();
    });

    window.addEventListener(
  "resize",
  () => {
    if (state.screen === "result") {
      forceResultVisible();
      setTimeout(forceResultVisible, 120);
    }
  },
  {
    passive: true
  }
);

window.addEventListener(
  "orientationchange",
  () => {
    if (state.screen === "result") {
      setTimeout(forceResultVisible, 80);
      setTimeout(forceResultVisible, 260);
      setTimeout(forceResultVisible, 600);
    }
  },
  {
    passive: true
  }
);

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    () => {
      if (state.screen === "result") {
        forceResultVisible();
      }
    },
    {
      passive: true
    }
  );
}

  }

  /*
   * =========================================================
   * 14. APP BOOTSTRAP / 啟動
   * =========================================================
   */

async function boot() {
  if (state.booted && screenStart()) return;

  state.booted = true;

  try {
    ensureAppHeight();
    applyCssVariables();

    hardResetGamePage();

    removeMenuDom();
    watchMenuDom();

    ensureBasicDom();
    bindGlobalEvents();

    state.selectedTop = loadSelectedTop();

    loadDailyLimit();

    showScreen("start");

    track("boot", {
      version: VERSION,
      dailyLimit: DAILY_LIMIT,
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      selectedTopId: state.selectedTop?.id || "",
      selectedTopName: state.selectedTop?.name || ""
    });

initLiffProfile().then((profile) => {
  if (profile) {
    track("profile_ready", {
      userId: profile.userId || profile.id || profile.uid || "",
      displayName:
        profile.displayName ||
        profile.name ||
        profile.playerName ||
        ""
    });
  }

  /*
   * 進入遊戲後，如果網址有 ?ref=xxx，
   * 就嘗試把「被邀請者」記錄到後端。
   */
  registerReferralIfNeeded("boot_after_profile").then(() => {
    /*
     * 同步目前自己的成功邀請數。
     */
    syncReferralSuccessCount("boot_after_profile").then((count) => {
      state.lineInviteFriendCount = count;
    });
  });
});

    
  } catch (error) {
    console.error("[ZELO GAME] boot failed", error);

    const root = appRoot();

    root.innerHTML = `
      <section
        class="zg-screen active is-active"
        style="
          display:flex;
          min-height:100vh;
          align-items:center;
          justify-content:center;
          padding:24px;
          color:#fff;
          background:#090612;
          text-align:center;
          box-sizing:border-box;
          flex-direction:column;
          gap:12px;
        "
      >
        <h2 style="margin:0;font-size:22px;">遊戲載入失敗</h2>
        <p style="margin:0;opacity:.8;font-size:14px;">
          請重新整理頁面，或截圖 Console 錯誤訊息。
        </p>
        <pre style="
          max-width:100%;
          white-space:pre-wrap;
          word-break:break-word;
          font-size:12px;
          opacity:.75;
          background:rgba(255,255,255,.08);
          padding:12px;
          border-radius:12px;
        ">${escapeHtml(String(error && error.message ? error.message : error))}</pre>
      </section>
    `;
  }
}

function exposeApi() {
  window.ZELO_GAME = {
    boot: boot,
    start: handleHomeStart,
    startBattle: beginChargeBattle,
    stopBattle: stopBattle,
    showScreen: showScreen,
    selectTop: selectTop,

    getReferralCode: getMyReferralCode,
    buildReferralUrl: buildReferralUrl,
    syncReferralSuccessCount: syncReferralSuccessCount,
    registerReferralIfNeeded: registerReferralIfNeeded,

    resetReferralLocal: function() {
      try {
        localStorage.removeItem(REFERRAL.codeKey);
        localStorage.removeItem(REFERRAL.inviterCodeKey);
        localStorage.removeItem(REFERRAL.countFallbackKey);
      } catch (error) {}

      return {
        referralCode: getMyReferralCode(),
        inviterCode: getSavedInviterReferralCode(),
        count: getLineInviteFriendCount()
      };
    },

    getState: function() {
      return {
        screen: state.screen,
        selectedTop: state.selectedTop,
        enemyTop: state.enemyTop,
        running: state.running,
        charging: state.charging,
        launchPower: state.launchPower,
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays,
        lastBattleResult: state.lastBattleResult,
        referralCode: getMyReferralCode(),
        inviterCode: getSavedInviterReferralCode(),
        lineInviteFriendCount: getLineInviteFriendCount(),

        battle: state.battle
          ? {
              playerHp: state.battle.player.hp,
              enemyHp: state.battle.enemy.hp,

              playerEnergy: state.battle.player.energy,
              enemyEnergy: state.battle.enemy.energy,
              playerEnergyRatio: state.battle.player.energyRatio,
              enemyEnergyRatio: state.battle.enemy.energyRatio,

              playerSpin: state.battle.player.spinRatio,
              enemySpin: state.battle.enemy.spinRatio
            }
          : null
      };
    },

    resetDailyLimit: function() {
      try {
        localStorage.removeItem(getDailyKey());
      } catch (error) {}

      loadDailyLimit();

      return {
        playsUsed: state.playsUsed,
        remainingPlays: state.remainingPlays
      };
    },

    resetScore: function() {
      setMyScore(1200);
      return getMyScore();
    }
  };
}



  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, {
        once: true
      });
    } else {
      fn();
    }
  }

  exposeApi();

  ready(() => {
    boot();
  });
})();

