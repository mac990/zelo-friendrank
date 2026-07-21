/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
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

 * const VERSION = "202607210730-remove-stray-post-return";
  
console.log("[ZELO GAME] version:", VERSION);

const BG_IMAGE_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const EXTERNAL_TOP_PHOTO_URL ="https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  const GOOGLE_SCRIPT_URL =
  window.ZELO_GOOGLE_RECORD_API ||
  window.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";


const HOME_VIDEO_URL =
  "https://cdn.shopify.com/videos/c/o/v/189e5c4617d143c793cd0844a727366f.mp4";

  const RESULT_VIDEO_URL =
  "https://cdn.shopify.com/videos/c/o/v/2b910a2cab014a1f96b4fbcb76383294.mp4";

/*
 * 結果影片設定：
 * 之後你可以把 win1 ~ win4 換成不同勝利影片。
 * lose 換成戰敗影片。
 */
const RESULT_VIDEOS = {
  win1: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4",
  win2: "https://cdn.shopify.com/videos/c/o/v/1c51161eb5d9487f8169b43ba84d43dd.mp4",
  win3: "https://cdn.shopify.com/videos/c/o/v/a500db81d1f04a3b8764e8fa42a393bb.mp4",
  win4: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4",
  
  lose: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4",
  draw: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4",
};

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


const SECRET_TOPS = [
  {
    id: "secret-shadow",
    name: "闇影突擊型",
    type: "attack",
    typeName: "隱藏攻擊型",
    emoji: "🌑",
    colorA: "#1a1028",
    colorB: "#ff2b7a",
    unlockText: "解鎖任務：累積完成 3 場對戰後開放。"
  },
  {
    id: "secret-light",
    name: "光耀平衡型",
    type: "balance",
    typeName: "傳說平衡型",
    emoji: "✨",
    colorA: "#f7f0ff",
    colorB: "#7df6ff",
    unlockText: "解鎖任務：取得一次勝利後開放。"
  },
  {
    id: "secret-fire",
    name: "緋紅爆裂型",
    type: "attack",
    typeName: "隱藏爆裂型",
    emoji: "🔥",
    colorA: "#ff1744",
    colorB: "#ffb300",
    unlockText: "解鎖任務：使用攻擊型陀螺完成指定挑戰。"
  },
  {
    id: "secret-ice",
    name: "冰霜守衛型",
    type: "defense",
    typeName: "隱藏防禦型",
    emoji: "❄️",
    colorA: "#2fc7ff",
    colorB: "#e8fbff",
    unlockText: "解鎖任務：防守成功並累積指定能量。"
  },
  {
    id: "secret-thunder",
    name: "雷鳴疾速型",
    type: "stamina",
    typeName: "隱藏速度型",
    emoji: "⚡",
    colorA: "#fff36a",
    colorB: "#28d8ff",
    unlockText: "解鎖任務：達成高速發射評價後開放。"
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
  /*
   * Current screen:
   * start / select / battle / result
   */
  screen: "start",

  /*
   * LINE / referral profile state
   */
  profile: null,
  inviterId: "",
  inviterName: "",

  /*
   * Top selection
   */
  selectedTop: null,
  enemyTop: null,

  /*
   * Battle runtime
   */
  battle: null,
  raf: null,
  running: false,
  paused: false,
  lastFrame: 0,

  /*
   * Battle flags
   */
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

  /*
   * Launch / charge state
   */
  charging: false,
  launchReady: false,
  launchCountdownToken: 0,
  launchPower: 0,
  chargeDir: 1,
  chargeRaf: null,
  lastPerfectSoundAt: 0,

  /*
   * Result / reward state
   */
  lastCouponReward: null,
  lastBattleResult: null,

  /*
   * Daily limit
   */
  playsUsed: 0,
  remainingPlays: DAILY_LIMIT,

  /*
   * LINE invite / referral count
   */
  lineInviteFriendCount: 0,

  /*
   * Result sync / tracking flags
   */
  resultLogged: false,

  /*
   * Boot / event binding flags
   *
   * eventsBound:
   *   保留舊命名相容。
   *
   * globalBound:
   *   bindGlobalEvents() 目前實際使用這個欄位。
   */
  eventsBound: false,
  globalBound: false,
  booted: false,
  booting: false,

  /*
   * Action debounce
   */
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
    const readFromParams = (params) => {
      if (!params) return "";

      /*
       * 重要：
       * 先讀 ref / referralCode / invite。
       * 因為這些才是 ZG_xxxxx 邀請碼。
       * inviterId 通常是 LINE userId，不能優先當 referral code。
       */
      return (
        params.get("ref") ||
        params.get("referralCode") ||
        params.get("invite") ||
        params.get("inviterReferralCode") ||
        params.get("ownerReferralCode") ||
        params.get("inviterId") ||
        params.get("inviter") ||
        params.get("referrerId") ||
        params.get("fromUserId") ||
        ""
      ).trim();
    };

    const params = new URLSearchParams(location.search);

    const directCode = readFromParams(params);

    if (directCode) {
      return directCode;
    }

    const liffState = params.get("liff.state") || "";

    if (liffState) {
      const decodedState = decodeURIComponent(liffState);

      const stateQuery = decodedState.includes("?")
        ? decodedState.slice(decodedState.indexOf("?") + 1)
        : decodedState.replace(/^\?/, "");

      const stateParams = new URLSearchParams(stateQuery);
      const stateCode = readFromParams(stateParams);

      if (stateCode) {
        return stateCode;
      }
    }

    return "";
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
  const fromUrl =
    getReferralCodeFromUrl() ||
    getQueryParam("ref") ||
    getQueryParam("invite") ||
    getQueryParam("referralCode") ||
    getQueryParam("inviterReferralCode") ||
    getQueryParam("inviterCode") ||
    getQueryParam("ownerReferralCode") ||
    "";

  if (fromUrl) {
    const saved = saveInviterReferralCode(fromUrl);

    if (saved) {
      return saved;
    }
  }

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

function buildQuery(params = {}) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

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

    let completed = false;
    let timeout = null;

    const cleanupScript = () => {
      try {
        script.remove();
      } catch (error) {}
    };

    const setCallbackNoop = () => {
      /*
       * 關鍵：
       * timeout 後不要 delete callback。
       * GAS 晚回來才不會出現 ReferenceError。
       */
      try {
        window[callbackName] = function(lateData) {
          console.warn("[ZELO GAME] late JSONP response ignored:", {
            action,
            callbackName,
            lateData
          });
        };
      } catch (error) {}
    };

    window[callbackName] = function(data) {
      if (completed) return;

      completed = true;

      window.clearTimeout(timeout);

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = null;
      }

      cleanupScript();

      resolve(data || {});
    };

    script.onerror = function(event) {
      if (completed) return;

      completed = true;

      window.clearTimeout(timeout);
      setCallbackNoop();
      cleanupScript();

      const error = new Error(`JSONP failed: ${action}`);

      window.ZELO_LAST_JSONP_ERROR = {
        action,
        callbackName,
        message: error.message,
        event,
        url: script.src,
        ts: Date.now()
      };

      reject(error);
    };

    timeout = window.setTimeout(() => {
      if (completed) return;

      completed = true;

      setCallbackNoop();
      cleanupScript();

      const error = new Error(`JSONP timeout: ${action}`);

      window.ZELO_LAST_JSONP_ERROR = {
        action,
        callbackName,
        message: error.message,
        url: script.src,
        ts: Date.now()
      };

      reject(error);
    }, 35000);

    const query = buildQuery(payload);
    const url = `${GOOGLE_SCRIPT_URL}?${query}`;

    window.ZELO_LAST_JSONP_URL = url;
    window.ZELO_LAST_JSONP_PAYLOAD = payload;

    if (url.length > 1800) {
      console.warn("[ZELO GAME] JSONP URL maybe too long:", {
        action,
        length: url.length,
        url
      });
    }

    script.src = url;
    script.async = true;

    document.body.appendChild(script);
  });
}


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

  function getQueryParam(name) {
  try {
    const url = new URL(window.location.href);

    const direct = url.searchParams.get(name) || "";
    if (direct) return direct;

    const liffState = url.searchParams.get("liff.state") || "";
    if (!liffState) return "";

    const decodedState = decodeURIComponent(liffState);

    const stateQuery = decodedState.includes("?")
      ? decodedState.slice(decodedState.indexOf("?") + 1)
      : decodedState.replace(/^\?/, "");

    const stateParams = new URLSearchParams(stateQuery);

    return stateParams.get(name) || "";
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

  function screenResultVideo() {
  return $("#screen-result-video");
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
  "screen-result-video",
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

const ZG_BATTLE_MUSIC_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/d70ffc8439eb5da45ee99a6849943830.mp3?v=1784579954";

function getBattleMusicAudio() {
  if (!window.zgBattleBgmAudio) {
    window.zgBattleBgmAudio = new Audio(ZG_BATTLE_MUSIC_URL);
    window.zgBattleBgmAudio.loop = true;
    window.zgBattleBgmAudio.preload = "auto";
    window.zgBattleBgmAudio.volume = 0.58;
  }

  return window.zgBattleBgmAudio;
}

function startBattleMusic() {
  try {
    const audio = getBattleMusicAudio();

    audio.loop = true;
    audio.volume = 0.58;

    if (audio.paused) {
      try {
        audio.currentTime = 0;
      } catch (error) {}
    }

    const playPromise = audio.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        bindBattleMusicUnlockOnce();
      });
    }
  } catch (error) {
    bindBattleMusicUnlockOnce();
  }
}

function bindBattleMusicUnlockOnce() {
  if (window.__zgBattleMusicUnlockBound) return;

  window.__zgBattleMusicUnlockBound = true;

  const unlock = () => {
    try {
      const audio = getBattleMusicAudio();

      audio.loop = true;
      audio.volume = 0.58;

      const playPromise = audio.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (error) {}

    document.removeEventListener("touchstart", unlock, true);
    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("click", unlock, true);

    window.__zgBattleMusicUnlockBound = false;
  };

  document.addEventListener("touchstart", unlock, true);
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("click", unlock, true);
}

function pauseBattleMusic() {
  try {
    if (!window.zgBattleBgmAudio) return;

    window.zgBattleBgmAudio.pause();
  } catch (error) {}
}

function stopBattleMusic() {
  try {
    if (!window.zgBattleBgmAudio) return;

    window.zgBattleBgmAudio.pause();
    window.zgBattleBgmAudio.currentTime = 0;
  } catch (error) {}
}

function forceBattleMusicAndChargeButton() {
  const battleScreen =
    document.querySelector("#screen-battle") ||
    document.querySelector(".zg-screen-battle") ||
    document.querySelector('[data-zg-screen="battle"]');

  if (!battleScreen) return;

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  const chargeButtons = [
    ...battleScreen.querySelectorAll(".zg-charge-btn"),
    ...battleScreen.querySelectorAll(".zg-launch-charge-btn"),
    ...battleScreen.querySelectorAll(".zg-hold-btn"),
    ...battleScreen.querySelectorAll(".zg-power-btn"),
    ...battleScreen.querySelectorAll(".zg-charge-hold-btn"),
    ...battleScreen.querySelectorAll(".zg-launch-power-btn"),
    ...battleScreen.querySelectorAll('[data-zg-action="charge"]'),
    ...battleScreen.querySelectorAll('[data-zg-action="power"]'),
    ...battleScreen.querySelectorAll('[data-zg-action="hold-charge"]'),
    ...battleScreen.querySelectorAll('[data-zg-action="launch-charge"]')
  ];

  battleScreen.querySelectorAll("button").forEach((btn) => {
    const text = (btn.textContent || "").replace(/\s+/g, "");

    if (
      text.includes("按住蓄力") ||
      text.includes("蓄力") ||
      text.includes("按住")
    ) {
      chargeButtons.push(btn);
    }
  });

  const uniqueChargeButtons = [...new Set(chargeButtons)];

  uniqueChargeButtons.forEach((btn) => {
    set(btn, "height", "72px");
    set(btn, "min-height", "72px");
    set(btn, "max-height", "72px");

    set(btn, "padding", "0 26px");
    set(btn, "display", "flex");
    set(btn, "align-items", "center");
    set(btn, "justify-content", "center");

    set(btn, "border-radius", "26px");
    set(btn, "box-sizing", "border-box");

    set(btn, "font-size", "20px");
    set(btn, "font-weight", "950");
    set(btn, "line-height", "1");
    set(btn, "white-space", "nowrap");

    set(btn, "position", "relative");
    set(btn, "z-index", "30");
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
"#screen-result-video",
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

    ".zg-result-video-screen",
".zg-result-video",
".zg-result-video-overlay",
".zg-result-video-skip",
".zg-result-video-label",


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
state.launchReady = false;
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
  resultVideo: screenResultVideo(),
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
  stopBattleMusic();

  removeMenuDom();
  removeLogoDom();
}


function forceSelectScrollable() {
  const root = appRoot();
  const selectScreen = screenSelect();

  if (!selectScreen) return;

  const main = $(".zg-main", selectScreen);
  const bottom = $(".zg-bottom", selectScreen);
  const battleBtn = $('[data-zg-action="battle"]', selectScreen);

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
  document.documentElement.style.setProperty(
    "--zg-safe-width",
    `${Math.max(320, appWidth)}px`
  );

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  /*
   * Root 固定滿版。
   * 注意：不要 touch-action:none。
   */
  if (root) {
    set(root, "position", "fixed");
    set(root, "inset", "0 auto auto 0");
    set(root, "left", "0");
    set(root, "top", "0");
    set(root, "right", "auto");
    set(root, "bottom", "auto");

    set(root, "width", "var(--zg-app-width, 100vw)");
    set(root, "min-width", "var(--zg-app-width, 100vw)");
    set(root, "max-width", "var(--zg-app-width, 100vw)");

    set(root, "height", "var(--zg-app-height, 100vh)");
    set(root, "min-height", "var(--zg-app-height, 100vh)");
    set(root, "max-height", "var(--zg-app-height, 100vh)");

    set(root, "margin", "0");
    set(root, "padding", "0");
    set(root, "overflow", "hidden");
    set(root, "box-sizing", "border-box");
    set(root, "touch-action", "pan-y");
    set(root, "z-index", "999999");
  }

  /*
   * Select screen 自己負責滑動。
   */
  selectScreen.hidden = false;
  selectScreen.removeAttribute("hidden");
  selectScreen.classList.add("active", "is-active");
  selectScreen.setAttribute("aria-hidden", "false");

  set(selectScreen, "position", "fixed");
  set(selectScreen, "inset", "0 auto auto 0");
  set(selectScreen, "left", "0");
  set(selectScreen, "top", "0");
  set(selectScreen, "right", "auto");
  set(selectScreen, "bottom", "auto");

  set(selectScreen, "width", "var(--zg-app-width, 100vw)");
  set(selectScreen, "min-width", "var(--zg-app-width, 100vw)");
  set(selectScreen, "max-width", "var(--zg-app-width, 100vw)");

  set(selectScreen, "height", "var(--zg-app-height, 100vh)");
  set(selectScreen, "min-height", "var(--zg-app-height, 100vh)");
  set(selectScreen, "max-height", "var(--zg-app-height, 100vh)");

  set(selectScreen, "display", "block");
  set(selectScreen, "flex-direction", "initial");
  set(selectScreen, "align-items", "initial");
  set(selectScreen, "justify-content", "initial");

  set(selectScreen, "overflow-y", "scroll");
  set(selectScreen, "overflow-x", "hidden");
  set(selectScreen, "-webkit-overflow-scrolling", "touch");
  set(selectScreen, "overscroll-behavior-y", "contain");
  set(selectScreen, "overscroll-behavior-x", "none");
  set(selectScreen, "touch-action", "pan-y");

  /*
   * 底部空間：
   * 只預留固定紅色按鈕高度，不要 190px。
   */
  set(
    selectScreen,
    "padding-bottom",
    "calc(env(safe-area-inset-bottom, 0px) + 88px)"
  );

  set(selectScreen, "box-sizing", "border-box");
  set(selectScreen, "pointer-events", "auto");
  set(selectScreen, "visibility", "visible");
  set(selectScreen, "opacity", "1");

  /*
   * .zg-main 只當內容容器，不自己 scroll。
   */
  if (main) {
    set(main, "position", "relative");

    set(main, "display", "flex");
    set(main, "flex-direction", "column");
    set(main, "align-items", "center");
    set(main, "justify-content", "flex-start");

    set(main, "width", "100%");
    set(main, "min-width", "0");
    set(main, "max-width", "100%");

    set(main, "height", "auto");
    set(main, "min-height", "auto");
    set(main, "max-height", "none");

    set(main, "flex", "none");

    set(main, "overflow", "visible");
    set(main, "overflow-y", "visible");
    set(main, "overflow-x", "visible");
    set(main, "-webkit-overflow-scrolling", "auto");
    set(main, "overscroll-behavior", "auto");
    set(main, "touch-action", "pan-y");

    /*
     * main 不要再補底部大空白。
     */
    set(main, "padding-bottom", "0");

    set(main, "box-sizing", "border-box");
    set(main, "pointer-events", "auto");
    set(main, "z-index", "5");
  }

  /*
   * 保證隱藏陀螺區存在於 main 裡。
   * 同時避免重複插入。
   */
  if (main) {
    const secretBlocks = $$(".zg-secret-tops-preview", main);

    secretBlocks.forEach((el, index) => {
      if (index > 0) {
        try {
          el.remove();
        } catch (error) {}
      }
    });

    if (!$(".zg-secret-tops-preview", main)) {
      main.insertAdjacentHTML("beforeend", renderSecretTopPreviewHtml());
    }
  }

  /*
   * SECRET TOPS 本身只保留固定按鈕避讓距離。
   */
  const secret = $(".zg-secret-tops-preview", selectScreen);

  if (secret) {
    set(secret, "display", "block");
    set(secret, "width", "calc(100% - 24px)");
    set(secret, "max-width", "520px");
    set(secret, "margin", "28px auto 0");
    set(
      secret,
      "padding-bottom",
      "calc(env(safe-area-inset-bottom, 0px) + 72px)"
    );
    set(secret, "box-sizing", "border-box");
    set(secret, "position", "relative");
    set(secret, "z-index", "8");
  }

  /*
   * 隱藏清單不要再多留空白。
   */
  const secretList = $(".zg-secret-top-list", selectScreen);

  if (secretList) {
    set(secretList, "margin-bottom", "0");
    set(secretList, "padding-bottom", "0");
  }

  const lastSecretCard = $(
    ".zg-secret-top-list .zg-secret-top-card:last-child",
    selectScreen
  );

  if (lastSecretCard) {
    set(lastSecretCard, "margin-bottom", "0");
  }

  /*
   * 背景層不要吃觸控。
   */
  $$(
    ".zg-select-bg, .zg-select-orb, .zg-select-grid, .zg-select-stars",
    selectScreen
  ).forEach((el) => {
    set(el, "pointer-events", "none");
  });

  /*
   * 底部按鈕固定，不跟著內容滑動。
   */
  if (bottom) {
    bottom.classList.add("zg-select-fixed-bottom");

    set(bottom, "position", "fixed");
    set(bottom, "left", "12px");
    set(bottom, "right", "12px");
    set(bottom, "bottom", "calc(env(safe-area-inset-bottom, 0px) + 12px)");

    set(bottom, "width", "auto");
    set(bottom, "min-width", "0");
    set(bottom, "max-width", "none");

    set(bottom, "height", "auto");
    set(bottom, "min-height", "0");
    set(bottom, "max-height", "none");

    set(bottom, "display", "block");
    set(bottom, "grid-template-columns", "1fr");
    set(bottom, "grid-template-rows", "auto");
    set(bottom, "gap", "0");

    set(bottom, "padding", "0");
    set(bottom, "margin", "0");

    set(bottom, "background", "transparent");
    set(bottom, "border", "0");
    set(bottom, "box-shadow", "none");

    set(bottom, "z-index", "90");
    set(bottom, "box-sizing", "border-box");
    set(bottom, "pointer-events", "auto");
    set(bottom, "touch-action", "manipulation");
  }

  /*
   * 發射按鈕：單顆滿版。
   */
  if (battleBtn) {
    battleBtn.classList.add("zg-select-battle-btn", "zg-btn", "zg-btn-red");

    set(battleBtn, "width", "100%");
    set(battleBtn, "min-width", "0");
    set(battleBtn, "max-width", "100%");

    set(battleBtn, "height", "54px");
    set(battleBtn, "min-height", "54px");
    set(battleBtn, "max-height", "54px");

    set(battleBtn, "display", "flex");
    set(battleBtn, "align-items", "center");
    set(battleBtn, "justify-content", "center");

    set(battleBtn, "margin", "0");
    set(battleBtn, "padding", "0 18px");

    set(battleBtn, "border-radius", "18px");
    set(battleBtn, "box-sizing", "border-box");

    set(battleBtn, "font-size", "17px");
    set(battleBtn, "font-weight", "950");
    set(battleBtn, "line-height", "1");
    set(battleBtn, "white-space", "nowrap");

    set(battleBtn, "pointer-events", "auto");
    set(battleBtn, "position", "relative");
    set(battleBtn, "z-index", "91");
    set(battleBtn, "touch-action", "manipulation");
  }

  /*
   * 確保互動元素可點擊。
   * 但 hidden secret card 不要恢復成可點。
   */
  $$(
    ".zg-btn, .zg-small-btn, .zg-top-card, [data-zg-action]",
    selectScreen
  ).forEach((el) => {
    if (el.classList && el.classList.contains("zg-secret-top-card")) {
      set(el, "pointer-events", "none");
      set(el, "position", "relative");
      set(el, "z-index", "20");
      return;
    }

    set(el, "pointer-events", "auto");
    set(el, "position", "relative");
    set(el, "z-index", el.closest(".zg-bottom") ? "91" : "20");
  });
}

function onSelectShown() {
  stopBattle();
  cancelChargeLoop();
  stopBattleMusic();

  renderTopSelection();

  forceSelectScrollable();

  const selectScreen = screenSelect();

  /*
   * 現在真正滑動的是 #screen-select，不是 .zg-main。
   */
  if (selectScreen) {
    try {
      selectScreen.scrollTop = 0;
    } catch (error) {}
  }

  /*
   * 等 LIFF / visualViewport 更新後再補套，
   * 避免手機第一次高度算錯。
   */
  setTimeout(forceSelectScrollable, 50);
  setTimeout(forceSelectScrollable, 160);
  setTimeout(forceSelectScrollable, 420);
  setTimeout(forceSelectScrollable, 800);

  removeMenuDom();
  removeLogoDom();
}



function onBattleShown() {
  ensureBattleDom(appRoot());
  normalizeBattleLayoutDom();
  removeDuplicateChargeDom();
  bindBattleChargeButton();

  /*
   * 進入對戰畫面立即啟動對戰音樂。
   * 注意：
   * iOS / LINE WebView 可能會擋第一次自動播放，
   * startBattleMusic() 內部已經有互動解鎖補救。
   */
  stopHomeMusic();
  startBattleMusic();

  /*
   * 延遲補播，避免畫面剛切換時 WebView 還沒允許 audio。
   */
  setTimeout(startBattleMusic, 80);
  setTimeout(startBattleMusic, 250);
  setTimeout(startBattleMusic, 600);

  /*
   * 順便加高蓄力按鈕。
   */
  forceBattleMusicAndChargeButton();

  setTimeout(forceBattleMusicAndChargeButton, 80);
  setTimeout(forceBattleMusicAndChargeButton, 250);

  removeMenuDom();
  removeLogoDom();
}


function onResultShown() {
  stopBattleMusic();

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

      ${renderSecretTopPreviewHtml()}
    </main>

    <div class="zg-bottom zg-select-fixed-bottom">
      <button
        class="zg-btn zg-btn-red zg-select-battle-btn"
        data-zg-action="battle"
        type="button"
      >
        發射！開始對戰
      </button>
    </div>
  `;

  root.appendChild(section);
}


  function renderSecretTopImageHtml(top = {}) {
  const theme = top.theme || "shadow";

  const themeClass =
    theme === "light"
      ? "zg-secret-row-question-light"
      : theme === "fire"
        ? "zg-secret-row-question-fire"
        : theme === "ice"
          ? "zg-secret-row-question-ice"
          : theme === "thunder"
            ? "zg-secret-row-question-thunder"
            : "zg-secret-row-question-shadow";

  const imageUrl =
    top.image ||
    DEFAULT_TOP_IMAGE;

  return `
    <span
      class="zg-secret-row-question ${themeClass}"
      aria-hidden="true"
    >
      <img
        class="zg-secret-row-img"
        src="${escapeAttr(imageUrl)}"
        alt=""
        loading="lazy"
        draggable="false"
      >
    </span>
  `;
}


  function renderSecretRowHtml(top = {}) {
  const theme = top.theme || "shadow";

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
    <article
      class="zg-secret-row ${themeClass}"
      data-secret-id="${escapeAttr(top.id || "")}"
      data-secret-theme="${escapeAttr(theme)}"
    >
      ${renderSecretTopImageHtml(top)}

      <div class="zg-secret-row-content">
        <div class="zg-secret-row-title">
          ${escapeHtml(top.name || "隱藏陀螺")}
        </div>

        <div class="zg-secret-row-desc">
          ${escapeHtml(top.desc || top.typeName || "完成指定條件後解鎖。")}
        </div>
      </div>

      <div class="zg-secret-row-lock">
        ${escapeHtml(top.status || "LOCKED")}
      </div>
    </article>
  `;
}

  
function renderSecretTopPreviewHtml() {
  const cards = SECRET_TOPS
    .map((top) => renderSecretTopCardHtml(top))
    .join("");

  return `
    <section class="zg-secret-tops-preview" aria-label="隱藏陀螺區">
      <div class="zg-secret-tops-head">
        <div>
          <span class="zg-secret-tops-kicker">SECRET TOPS</span>
          <strong>隱藏陀螺區</strong>
        </div>

        <p>完成解鎖任務後開放特殊戰鬥型態</p>
      </div>

      <div class="zg-secret-top-list">
        ${cards}
      </div>
    </section>
  `;
}



function renderSecretTopCardHtml(top = {}) {
  return `
    <button
      class="zg-top-card zg-secret-top-card is-locked ${escapeHtml(top.type || "")}"
      data-secret-id="${escapeAttr(top.id || "")}"
      data-type="${escapeAttr(top.type || "")}"
      type="button"
      disabled
      aria-disabled="true"
    >
      <div
        class="zg-top-icon zg-secret-top-icon ${escapeHtml(top.type || "")}"
        style="--c1:${escapeAttr(top.colorA || "#ff2b7a")};--c2:${escapeAttr(top.colorB || "#57f2ff")};"
        aria-hidden="true"
      >
        <div class="zg-secret-shadow-disc">
          <span>?</span>
        </div>
      </div>

      <div class="zg-top-content">
        <div class="zg-top-name">
          ${escapeHtml(top.emoji || "")}
          ${escapeHtml(top.name || "隱藏陀螺")}
        </div>

        <div class="zg-top-type">
          ${escapeHtml(top.typeName || "隱藏型")}
        </div>

        <div class="zg-stats">
          <div class="zg-stat">
            <span>攻擊</span>
            <strong>?</strong>
          </div>

          <div class="zg-stat">
            <span>防禦</span>
            <strong>?</strong>
          </div>

          <div class="zg-stat">
            <span>耐久</span>
            <strong>?</strong>
          </div>

          <div class="zg-stat">
            <span>速度</span>
            <strong>?</strong>
          </div>
        </div>

        <div class="zg-secret-unlock-task">
          ${escapeHtml(top.unlockText || "解鎖任務：完成指定條件後開放。")}
        </div>
      </div>
    </button>
  `;
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

  /*
   * 保險：
   * 如果選擇頁曾被舊版 DOM 或其他流程重建，
   * 但沒有隱藏陀螺區，這裡自動補回。
   */
const main = $(".zg-main", screenSelect() || document);

if (main) {
  const secretBlocks = $$(".zg-secret-tops-preview", main);

  secretBlocks.forEach((el, index) => {
    if (index > 0) {
      try {
        el.remove();
      } catch (error) {}
    }
  });

  if (!$(".zg-secret-tops-preview", main)) {
    main.insertAdjacentHTML("beforeend", renderSecretTopPreviewHtml());
  }
}

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

  /*
   * 防殘留：
   * 每次進入 launch prep 都先移除舊倒數 DOM。
   */
  removeLaunchCountdownDom();

  normalizeBattleLayoutDom();

  battle.dataset.phase = "launch";
  battle.dataset.launchReady = "0";
  battle.dataset.countdownRunning = "0";

  state.running = false;
  state.battle = null;
  state.finishing = false;
  state.pendingResult = null;

  /*
   * 進入戰鬥頁後，預設不可蓄力。
   * 必須等 3 2 1 GO 倒數完成後，才由 setLaunchButtonReady(true) 開放。
   */
  state.charging = false;
  state.launchReady = false;
  state.launchPower = 0;
  state.chargeDir = 1;

  clearBattleObjects();
  updateHpBars();

  setCommentary("倒數準備中...");

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
    subtitle.textContent = "等待倒數結束後再蓄力！";
  }

  if (tip) {
    tip.textContent = "倒數 3、2、1、GO 結束後才能蓄力。";
  }

  /*
   * 關鍵：
   * 這裡一定要先 disabled。
   * 否則切到戰鬥頁的一瞬間可能被玩家提前按到。
   */
  if (btn) {
    btn.disabled = true;
    btn.textContent = "倒數準備中";
    btn.classList.remove("zg-charge-pressing", "is-ready");
    btn.classList.add("is-disabled");
    btn.setAttribute("data-launch-ready", "false");
    btn.style.setProperty("pointer-events", "none", "important");
    btn.style.setProperty("opacity", "0.55", "important");
  }

  setChargePower(0);
  bindBattleChargeButton();
}



function ensureLaunchCountdownDom() {
  const battle = screenBattle();

  if (!battle) return null;

  let overlay = $(".zg-launch-countdown-overlay", battle);

  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.className = "zg-launch-countdown-overlay";
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <div class="zg-launch-countdown-text">3</div>
  `;

  battle.appendChild(overlay);

  return overlay;
}

function removeLaunchCountdownDom() {
  const battle = screenBattle();

  if (!battle) return;

  $$(".zg-launch-countdown-overlay", battle).forEach((el) => {
    try {
      el.remove();
    } catch (error) {}
  });
}

function setLaunchButtonReady(ready) {
  const battle = screenBattle();
  const btn = battle ? $(".zg-charge-btn", battle) : null;
  const tip = battle ? $(".zg-charge-tip", battle) : null;

  state.launchReady = !!ready;

  if (battle) {
    battle.dataset.launchReady = ready ? "1" : "0";
  }

  if (!btn) return;

  btn.setAttribute("data-launch-ready", ready ? "true" : "false");
  btn.classList.toggle("is-ready", !!ready);
  btn.classList.toggle("is-disabled", !ready);

  if (ready) {
    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");

    if (tip) {
      tip.textContent = "現在可以長按按鈕蓄力！";
    }

    setCommentary("GO！長按按鈕開始蓄力！");
  } else {
    btn.disabled = true;
    btn.textContent = "倒數準備中";
    btn.classList.remove("zg-charge-pressing");
    btn.style.setProperty("pointer-events", "none", "important");
    btn.style.setProperty("opacity", "0.55", "important");

    if (tip) {
      tip.textContent = "倒數結束後才能蓄力。";
    }
  }
}


function playLaunchCountdown() {
  const battle = screenBattle();

  if (!battle) return;

  /*
   * 防止同一個 battle DOM 重複倒數。
   */
  if (battle.dataset.countdownRunning === "1") {
    return;
  }

  const token = Date.now() + Math.random();

  state.launchCountdownToken = token;
  battle.dataset.countdownRunning = "1";

  setLaunchButtonReady(false);
  removeLaunchCountdownDom();

  const overlay = ensureLaunchCountdownDom();
  const text = overlay ? $(".zg-launch-countdown-text", overlay) : null;

  const steps = ["3", "2", "1", "GO!"];

  let index = 0;

  const isValidCountdown = () => {
    return (
      state.launchCountdownToken === token &&
      state.screen === "battle" &&
      screenBattle() === battle &&
      battle.isConnected &&
      battle.dataset.countdownRunning === "1"
    );
  };

  const finishCountdown = () => {
    if (!isValidCountdown()) return;

    setLaunchButtonReady(true);

    if (overlay) {
      overlay.classList.add("is-done");
    }

    setTimeout(() => {
      if (!isValidCountdown()) return;

      removeLaunchCountdownDom();
      battle.dataset.countdownRunning = "0";
    }, 280);
  };

  const showStep = () => {
    if (!isValidCountdown()) return;

    if (!overlay || !text) {
      finishCountdown();
      return;
    }

    const value = steps[index];

    text.textContent = value;

    overlay.classList.remove("is-go", "is-pop");
    void overlay.offsetWidth;
    overlay.classList.add("is-pop");

    if (value === "GO!") {
      overlay.classList.add("is-go");
      setCommentary("GO！準備拉繩！");
    } else {
      setCommentary(`倒數 ${value}...`);
    }

    index += 1;

    if (index < steps.length) {
      setTimeout(showStep, 760);
      return;
    }

    setTimeout(finishCountdown, 720);
  };

  showStep();
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

  let activePointerId = null;
  let chargeStartedAt = 0;
  let mouseDown = false;

  function canStartCharge() {
    if (btn.disabled) return false;

    /*
     * 關鍵：
     * 倒數未完成前，不允許開始蓄力。
     */
    if (!state.launchReady) return false;

    if (state.screen !== "battle") return false;
    if (state.running) return false;
    if (state.battle) return false;
    if (state.finishing) return false;
    if (state.charging) return false;

    return true;
  }

  function restoreReadyButton() {
    if (!state.launchReady) {
      btn.disabled = true;
      btn.textContent = "倒數準備中";
      btn.style.setProperty("pointer-events", "none", "important");
      btn.style.setProperty("opacity", "0.55", "important");
      return;
    }

    btn.disabled = false;
    btn.textContent = "按住蓄力";
    btn.style.setProperty("pointer-events", "auto", "important");
    btn.style.setProperty("opacity", "1", "important");
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

      restoreReadyButton();

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

  restoreReadyButton();

  setCommentary(
    state.launchReady
      ? "蓄力取消，請重新長按按鈕！"
      : "倒數尚未完成，請等待 GO！"
  );
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
  /*
   * 關鍵：
   * 防止其他流程直接呼叫 startCharging() 繞過倒數。
   */
  if (!state.launchReady) return;

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
  state.launchReady = false;
  state.launchCountdownToken = 0;
  state.launchPower = 0;
  state.chargeDir = 1;
  state.lastPerfectSoundAt = 0;

  if (state.chargeRaf) {
    try {
      cancelAnimationFrame(state.chargeRaf);
    } catch (error) {}

    state.chargeRaf = null;
  }

  removeLaunchCountdownDom();

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

  /*
   * 重新建立戰鬥頁。
   */
  forceRebuildBattleDom(appRoot());

    /*
   * 切到戰鬥頁。
   */
  showScreen("battle");

  /*
   * 進入對戰畫面立刻啟動對戰音樂。
   */
  stopHomeMusic();
  startBattleMusic();

  setTimeout(startBattleMusic, 80);
  setTimeout(startBattleMusic, 250);
  setTimeout(startBattleMusic, 600);

  /*
   * 加高蓄力按鈕。
   */
  forceBattleMusicAndChargeButton();

  setTimeout(forceBattleMusicAndChargeButton, 80);
  setTimeout(forceBattleMusicAndChargeButton, 250);

  /*
   * 準備發射 UI。
   * 這裡會先鎖住按鈕，避免玩家倒數前提前蓄力。
   */
  renderLaunchPrep();


  /*
   * 選擇頁按下「發射！開始對戰」後，
   * 下一頁自動開始 3 2 1 GO 倒數。
   *
   * 用雙 requestAnimationFrame 確保：
   * 1. battle screen 已經 active
   * 2. battle DOM layout 已經完成
   * 3. LINE WebView / Shopify 容器已經更新畫面
   */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      /*
       * 再次確認仍在 battle，避免使用者快速跳頁。
       */
      if (state.screen !== "battle") return;
      playLaunchCountdown();
    });
  });

  track("launch_prepare", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    playsUsed: state.playsUsed,
    remainingPlays: state.remainingPlays
  });
}

 
function startBattleWithPower(power = 0.72, rawPower = power, forcedGrade = null) {
  Sound.resume();

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  cancelChargeLoop();
  removeLaunchCountdownDom();

  const powerNorm = clamp(Number(power) || 0, 0, 1);
  const launchRawPower = clamp(Number(rawPower) || powerNorm, 0, 1);
  const launchGrade = forcedGrade || getLaunchGrade(launchRawPower);

  const battleScreen = ensureBattleDom(appRoot());

  /*
   * 關鍵：
   * 不要無條件 showScreen("battle")。
   * 因為發射時原本就已經在 battle screen。
   * 無條件呼叫會重新觸發 onBattleShown()，增加 WebView 時序風險。
   */
  if (state.screen !== "battle") {
    showScreen("battle");
  }

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
  state.launchReady = false;
  state.launchCountdownToken = 0;
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
    battleScreen.dataset.launchReady = "0";
    battleScreen.dataset.countdownRunning = "0";
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

  state.charging = false;
  state.launchReady = false;
  state.launchCountdownToken = 0;
  state.launchPower = 0;
  state.chargeDir = 1;

  if (state.raf) {
    cancelAnimationFrame(state.raf);
    state.raf = null;
  }

  if (state.chargeRaf) {
    cancelAnimationFrame(state.chargeRaf);
    state.chargeRaf = null;
  }

  removeLaunchCountdownDom();

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

  function getZeloUrlParam(name) {
  try {
    const url = new URL(window.location.href);

    const direct = url.searchParams.get(name) || "";

    if (direct) {
      return direct;
    }

    const liffState = url.searchParams.get("liff.state") || "";

    if (!liffState) {
      return "";
    }

    const decodedState = decodeURIComponent(liffState);

    const stateQuery = decodedState.includes("?")
      ? decodedState.slice(decodedState.indexOf("?") + 1)
      : decodedState.replace(/^\?/, "");

    const stateParams = new URLSearchParams(stateQuery);

    return stateParams.get(name) || "";
  } catch (error) {
    return "";
  }
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
  battleId: [
    "zg",
    getUserId() || "guest",
    Date.now(),
    Math.round(elapsed),
    result
  ].join("_"),

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

function pickResultVideoKey(resultPayload = {}) {
  const result = resultPayload.result || "draw";

  if (result === "lose") {
    return "lose";
  }

  if (result === "draw") {
    return "draw";
  }

  /*
   * 勝利影片預留 4 種。
   * 目前都使用同一支影片。
   *
   * 之後若你想依分數 / finish 類型挑影片，
   * 可以在這裡改邏輯。
   */
  const points = Number(resultPayload.points || 0) || 0;

  if (points >= 150) return "win4";
  if (points >= 120) return "win3";
  if (points >= 90) return "win2";

  return "win1";
}

function getResultVideoUrl(resultPayload = {}) {
  const key = pickResultVideoKey(resultPayload);

  return (
    RESULT_VIDEOS[key] ||
    RESULT_VIDEOS.win1 ||
    RESULT_VIDEO_URL
  );
}

  function playResultVideoThenFinish(resultPayload = {}) {
  const root = appRoot();

  ensureResultVideoDom(root);

  const videoScreen = screenResultVideo();
  const video = $("#zg-result-video", videoScreen || document);
  const label = $("#zg-result-video-label", videoScreen || document);
  const skipBtn = $("#zg-result-video-skip", videoScreen || document);

  if (!videoScreen || !video) {
    finishBattle(resultPayload);
    return;
  }

  const result = resultPayload.result || "draw";
  const videoUrl = getResultVideoUrl(resultPayload);

  let finished = false;
  let fallbackTimer = null;

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  const cleanup = () => {
    window.clearTimeout(fallbackTimer);

    try {
      video.pause();
    } catch (error) {}

    video.onended = null;
    video.onerror = null;
    video.oncanplay = null;

    if (skipBtn) {
      skipBtn.onclick = null;
    }
  };

  const goResult = (reason = "ended") => {
    if (finished) return;

    finished = true;

    cleanup();

    window.ZELO_LAST_RESULT_VIDEO = {
      result,
      reason,
      videoUrl,
      payload: resultPayload,
      ts: Date.now()
    };

    finishBattle(resultPayload);
  };

  /*
   * 隱藏其他頁面。
   */
  ["#screen-start", "#screen-home", "#screen-select", "#screen-battle", "#screen-result"].forEach((selector) => {
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
   * 顯示結果影片頁。
   */
  videoScreen.hidden = false;
  videoScreen.removeAttribute("hidden");
  videoScreen.classList.add("active", "is-active");
  videoScreen.setAttribute("aria-hidden", "false");

  set(videoScreen, "position", "fixed");
  set(videoScreen, "inset", "0");
  set(videoScreen, "width", "var(--zg-app-width, 100vw)");
  set(videoScreen, "height", "var(--zg-app-height, 100vh)");
  set(videoScreen, "display", "flex");
  set(videoScreen, "align-items", "center");
  set(videoScreen, "justify-content", "center");
  set(videoScreen, "background", "#000");
  set(videoScreen, "overflow", "hidden");
  set(videoScreen, "z-index", "999999");
  set(videoScreen, "visibility", "visible");
  set(videoScreen, "opacity", "1");
  set(videoScreen, "pointer-events", "auto");
  set(videoScreen, "box-sizing", "border-box");

  set(video, "position", "absolute");
  set(video, "inset", "0");
  set(video, "width", "100%");
  set(video, "height", "100%");
  set(video, "object-fit", "cover");
  set(video, "background", "#000");
  set(video, "z-index", "1");

  const overlay = $(".zg-result-video-overlay", videoScreen);

  if (overlay) {
    set(overlay, "position", "absolute");
    set(overlay, "inset", "0");
    set(
      overlay,
      "background",
      "linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.28))"
    );
    set(overlay, "z-index", "2");
    set(overlay, "pointer-events", "none");
  }

  if (label) {
    label.textContent =
      result === "win"
        ? "勝利！"
        : result === "lose"
          ? "敗北..."
          : "平手！";

    set(label, "position", "absolute");
    set(label, "left", "50%");
    set(label, "bottom", "calc(env(safe-area-inset-bottom, 0px) + 78px)");
    set(label, "transform", "translateX(-50%)");
    set(label, "z-index", "3");
    set(label, "padding", "10px 18px");
    set(label, "border-radius", "999px");
    set(label, "background", "rgba(0,0,0,.42)");
    set(label, "backdrop-filter", "blur(10px)");
    set(label, "-webkit-backdrop-filter", "blur(10px)");
    set(label, "color", "#fff");
    set(label, "font-size", "22px");
    set(label, "font-weight", "950");
    set(label, "letter-spacing", ".04em");
    set(label, "text-shadow", "0 2px 10px rgba(0,0,0,.55)");
    set(label, "white-space", "nowrap");
    set(label, "pointer-events", "none");
  }

  if (skipBtn) {
    set(skipBtn, "position", "absolute");
    set(skipBtn, "right", "14px");
    set(skipBtn, "top", "calc(env(safe-area-inset-top, 0px) + 14px)");
    set(skipBtn, "z-index", "4");
    set(skipBtn, "height", "36px");
    set(skipBtn, "padding", "0 14px");
    set(skipBtn, "border", "0");
    set(skipBtn, "border-radius", "999px");
    set(skipBtn, "background", "rgba(0,0,0,.48)");
    set(skipBtn, "color", "#fff");
    set(skipBtn, "font-size", "13px");
    set(skipBtn, "font-weight", "900");
    set(skipBtn, "pointer-events", "auto");

    skipBtn.onclick = () => {
      goResult("skip");
    };
  }

  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  video.src = videoUrl;

  try {
    video.currentTime = 0;
  } catch (error) {}

  video.onended = () => {
    goResult("ended");
  };

  video.onerror = () => {
    console.warn("[ZELO GAME] result video error:", videoUrl);
    goResult("video_error");
  };

  video.oncanplay = () => {
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn("[ZELO GAME] result video autoplay failed:", error);

        /*
         * 影片若因 WebView 自動播放限制失敗，
         * 因為 muted 理論上通常可播。
         * 但如果仍失敗，就直接跳結果頁，避免卡住。
         */
        goResult("autoplay_failed");
      });
    }
  };

  /*
   * 安全保底：
   * 避免影片卡住不跳結果頁。
   */
  fallbackTimer = window.setTimeout(() => {
    goResult("timeout");
  }, 12000);

  try {
    video.load();
  } catch (error) {
    goResult("load_failed");
  }

  track("result_video_start", {
    result,
    finish: resultPayload.finish || "",
    points: Number(resultPayload.points || 0),
    videoKey: pickResultVideoKey(resultPayload),
    videoUrl
  });
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
    playResultVideoThenFinish(resultPayload);
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
  state.launchReady = false;
  state.launchCountdownToken = 0;
  state.launchPower = 0;
  state.chargeDir = 1;

  removeLaunchCountdownDom();

  Sound.stopHum();

  if (state.battle) {
    state.battle.ended = true;
  }

  state.battle = null;

  addDailyPlay();

  const oldScore = getMyScore();

  let delta = 0;

if (result.result === "win") {
  delta = 18 + Math.round((result.points || 0) / 15);
} else if (result.result === "lose") {
  /*
   * 敗北固定扣分：
   * 基礎 -12，表現分最多抵銷 6 分。
   * 所以輸了最多扣 12，最少仍扣 6。
   */
  const performanceOffset = Math.min(
    6,
    Math.round((result.points || 0) / 60)
  );

  delta = -12 + performanceOffset;
} else {
  /*
   * 平手給少量積分。
   */
  delta = Math.round((result.points || 0) / 80);
}


  const newScore = Math.max(0, oldScore + delta);

  setMyScore(newScore);

  result.battleId =
    result.battleId ||
    [
      "zg",
      getUserId() || "guest",
      result.ts || Date.now(),
      result.durationMs || 0,
      result.result || "draw"
    ].join("_");

  result.battlePoints = Number(result.points || 0);
  result.points = Number(result.points || result.battlePoints || 0);

  result.score = newScore;
  result.bestScore = newScore;
  result.totalScore = newScore;

  result.oldScore = oldScore;
  result.delta = delta;

  result.userId = result.userId || getUserId() || "";
  result.lineUserId = result.lineUserId || result.userId || "";

  result.referralCode = result.referralCode || getMyReferralCode();
  result.myReferralCode = result.myReferralCode || result.referralCode;
  result.ownerReferralCode = result.ownerReferralCode || result.referralCode;

  result.inviterReferralCode =
    result.inviterReferralCode ||
    getSavedInviterReferralCode() ||
    "";

  result.playerName = result.playerName || getPlayerName() || "你";
  result.displayName = result.displayName || result.playerName;

  state.lastBattleResult = result;

  try {
    localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
  } catch (error) {}

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

  function ensureResultVideoDom(root) {
  let old = screenResultVideo();

  if (old) {
    try {
      old.remove();
    } catch (error) {}
  }

  const section = document.createElement("section");

  section.id = "screen-result-video";
  section.className = "zg-screen zg-result-video-screen";
  section.hidden = true;
  section.setAttribute("aria-hidden", "true");

  section.innerHTML = `
    <video
      class="zg-result-video"
      id="zg-result-video"
      src=""
      preload="auto"
      playsinline
      webkit-playsinline
      muted
    ></video>

    <div class="zg-result-video-overlay" aria-hidden="true"></div>

    <div class="zg-result-video-label" id="zg-result-video-label">
      戰鬥結果
    </div>

    <button
      class="zg-result-video-skip"
      id="zg-result-video-skip"
      type="button"
      aria-label="略過結果影片"
    >
      略過
    </button>
  `;

  root.appendChild(section);

  return section;
}


function ensureResultDom(root) {
  const old = screenResult();

  if (old) {
    try {
      old.remove();
    } catch (error) {}
  }

  const section = document.createElement("section");

  section.id = "screen-result";
  section.className = "zg-screen zg-result-screen zg-result-classic-screen";
  section.hidden = true;
  section.setAttribute("aria-hidden", "true");

  section.innerHTML = `
    <main class="zg-result-main zg-result-classic-main">
      <section class="zg-result-hero-card">
        <div class="zg-result-top-wrap">
          <div class="zg-result-side-stats zg-result-side-stats-left">
            <div class="zg-result-stat-card">
              <span>我方能量</span>
              <strong id="zg-result-player-hp">0%</strong>
            </div>

            <div class="zg-result-stat-card">
              <span>我方轉速</span>
              <strong id="zg-result-player-spin">0%</strong>
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

          <div class="zg-result-side-stats zg-result-side-stats-right">
            <div class="zg-result-stat-card">
              <span>敵方能量</span>
              <strong id="zg-result-enemy-hp">0%</strong>
            </div>

            <div class="zg-result-stat-card">
              <span>敵方轉速</span>
              <strong id="zg-result-enemy-spin">0%</strong>
            </div>
          </div>
        </div>

        <div class="zg-result-title-block">
          <div class="zg-result-badge" id="zg-result-badge" hidden>
            勝利
          </div>

          <h2 class="zg-result-title" id="zg-result-title">
            勝利！取得專屬獎勵
          </h2>

          <p class="zg-result-message" id="zg-result-message">
            本次分數：0 分
          </p>
        </div>
      </section>

      <section class="zg-coupon-ticket zg-coupon-classic-card" id="zg-coupon-card">
        <div class="zg-coupon-label" id="zg-coupon-label">
          恭喜你贏得折扣碼
        </div>

        <div class="zg-coupon-code" id="zg-coupon-code">
          ZELO500
        </div>

        <div class="zg-coupon-desc" id="zg-coupon-desc">
          結帳時輸入折扣碼即可使用。
        </div>

        <button
          class="zg-coupon-copy zg-coupon-classic-copy"
          data-zg-action="copy-coupon"
          type="button"
        >
          複製折扣碼：<span id="zg-coupon-copy-code">ZELO500</span>
        </button>
      </section>

      <section id="zg-friend-rank" class="zg-friend-rank zg-rank-classic-card">
        <div class="zg-rank-classic-head">
          <h3 class="zg-rank-title">好友排行榜</h3>
        </div>

        <div id="zg-rank-list" class="zg-rank-list zg-rank-classic-list"></div>
      </section>

      <div class="zg-result-actions zg-result-actions-classic">
        <button
          class="zg-btn zg-btn-red"
          data-zg-action="restart"
          type="button"
        >
          再戰一次
        </button>

        <button
          class="zg-btn zg-btn-blue"
          data-zg-action="select"
          type="button"
        >
          更換陀螺
        </button>

        <button
          class="zg-btn zg-btn-line"
          data-zg-action="share"
          type="button"
        >
          邀請好友
        </button>

        <button
          class="zg-btn zg-btn-light"
          data-zg-action="home"
          type="button"
        >
          返回首頁
        </button>
      </div>
    </main>
  `;

  root.appendChild(section);
}

  function getProfilePayload(extra = {}) {
  const rawProfile =
    window.ZELO_PROFILE ||
    window.ZELO_LINE_PROFILE ||
    window.zeloLineProfile ||
    state.profile ||
    getProfile() ||
    {};

  const normalizedProfile = normalizeLineProfile(rawProfile);

  const userId =
    extra.userId ||
    extra.lineUserId ||
    normalizedProfile.userId ||
    normalizedProfile.lineUserId ||
    getUserId() ||
    "";

  const displayName =
    extra.displayName ||
    extra.playerName ||
    normalizedProfile.displayName ||
    normalizedProfile.name ||
    normalizedProfile.playerName ||
    getPlayerName() ||
    "你";

  const pictureUrl =
    extra.pictureUrl ||
    normalizedProfile.pictureUrl ||
    normalizedProfile.avatar ||
    normalizedProfile.avatarUrl ||
    "";

  const statusMessage =
    extra.statusMessage ||
    normalizedProfile.statusMessage ||
    rawProfile.statusMessage ||
    "";

  const myReferralCode =
    extra.referralCode ||
    extra.myReferralCode ||
    extra.ownerReferralCode ||
    getMyReferralCode();

  const inviterReferralCode =
    extra.inviterReferralCode ||
    extra.inviterCode ||
    getSavedInviterReferralCode() ||
    "";

  const lineInviteFriendCount =
    Number(
      extra.lineInviteFriendCount ??
      state.lineInviteFriendCount ??
      getLineInviteFriendCount() ??
      0
    ) || 0;

  const isInLineClient =
    !!(
      window.liff &&
      typeof window.liff.isInClient === "function" &&
      window.liff.isInClient()
    );

  return {
    ...extra,

    userId,
    lineUserId: userId,
    ownerLineUserId: userId,

    displayName,
    playerName: displayName,
    name: displayName,

    pictureUrl,
    avatar: pictureUrl,
    avatarUrl: pictureUrl,

    statusMessage,
    isLineUser: !!userId,

    referralCode: myReferralCode,
    myReferralCode: myReferralCode,
    ownerReferralCode: myReferralCode,
    ownerCode: myReferralCode,

    inviterReferralCode,
    inviterCode: inviterReferralCode,
    ref: inviterReferralCode,

    lineInviteFriendCount,

    isInLineClient
  };
}



function buildLineResultPayload(result = {}) {
  const profilePayload = getProfilePayload();

  const userId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    getUserId() ||
    "";

  const referralCode =
    result.referralCode ||
    result.myReferralCode ||
    result.ownerReferralCode ||
    profilePayload.referralCode ||
    getMyReferralCode();

  const score =
    Number(
      result.score ??
      result.bestScore ??
      result.totalScore ??
      getMyScore()
    ) || 0;

  const battlePoints =
    Number(
      result.points ??
      result.battlePoints ??
      result.delta ??
      0
    ) || 0;

  const battleId =
    result.battleId ||
    [
      "zg",
      userId || "guest",
      result.ts || Date.now(),
      result.durationMs || 0,
      result.result || "draw"
    ].join("_");

  const playerEnergy =
    Number(result.playerEnergy ?? result.playerHp ?? 0) || 0;

  const enemyEnergy =
    Number(result.enemyEnergy ?? result.enemyHp ?? 0) || 0;

  const playerSpin =
    Number(result.playerSpin ?? 0) || 0;

  const enemySpin =
    Number(result.enemySpin ?? 0) || 0;

  const displayName =
    profilePayload.displayName ||
    result.displayName ||
    result.playerName ||
    getPlayerName() ||
    "你";

  const pictureUrl =
    profilePayload.pictureUrl ||
    result.pictureUrl ||
    "";

  const inviterCode =
    result.inviterReferralCode ||
    result.inviterCode ||
    profilePayload.inviterReferralCode ||
    getSavedInviterReferralCode() ||
    "";

  /*
   * 注意：
   * JSONP 是 GET，payload 不要太肥。
   * 這裡只送 GAS 計分 / Players / 排行榜必要欄位。
   */
  return {
    game: "zelo",
    version: VERSION,

    action: "recordBattleResult",
    eventType: "battle_result",

    battleId,

    userId,
    lineUserId: userId,
    ownerLineUserId: userId,

    displayName,
    playerName: displayName,
    name: displayName,

    pictureUrl,

    referralCode,
    myReferralCode: referralCode,
    ownerReferralCode: referralCode,

    inviterReferralCode: inviterCode,
    inviterCode,

    result: result.result || "draw",
    finish: result.finish || "",

    score,
    bestScore: score,
    totalScore: score,

    points: battlePoints,
    battlePoints,

    playerHp: playerEnergy,
    enemyHp: enemyEnergy,

    playerEnergy,
    enemyEnergy,

    playerSpin,
    enemySpin,

    myEnergy: playerEnergy,
    mySpeed: playerSpin,
    enemySpeed: enemySpin,

    launchPower:
      typeof result.launchPower === "number"
        ? Number(result.launchPower.toFixed(3))
        : "",

    launchGrade: result.launchGrade || "",

    durationMs: Number(result.durationMs ?? 0) || 0,

    oldScore: Number(result.oldScore ?? 0) || 0,
    delta: Number(result.delta ?? 0) || 0,

    lineInviteFriendCount:
      Number(
        result.lineInviteFriendCount ??
        profilePayload.lineInviteFriendCount ??
        getLineInviteFriendCount()
      ) || 0,

    liffId: window.ZELO_LIFF_ID || window.liffId || "",
    pageUrl: location.origin + location.pathname,

    playedAt:
      result.playedAt ||
      result.timestamp ||
      new Date().toISOString(),

    ts: result.ts || Date.now()
  };
}


 function getLineResultSyncKey(result = {}) {
  const profilePayload = getProfilePayload();

  const userKey =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    getUserId() ||
    "me-local";

  const battleId =
    result.battleId ||
    [
      result.ts || Date.now(),
      result.durationMs || 0,
      result.result || "draw"
    ].join("_");

  return [
    "zg_result_line_synced",
    userKey,
    battleId
  ].join(":");
}


function syncResultWithLineOnce(result) {
  const payload = buildLineResultPayload(result);

  window.ZELO_LAST_RECORD_BATTLE_RESULT = {
    status: "pending",
    payload: payload,
    response: null,
    data: null,
    error: null,
    source: "jsonp_recordBattleResult",
    ts: Date.now()
  };

  /*
   * 沒有有效 LINE userId，不進正式積分。
   */
  if (
    !payload.userId ||
    payload.userId === "me-local" ||
    payload.userId === "guest" ||
    payload.userId === "anonymous"
  ) {
    const skipped = {
      ok: false,
      skipped: true,
      reason: "missing_valid_line_user_id",
      payload: payload
    };

    window.ZELO_LAST_RECORD_BATTLE_RESULT = {
      status: "skipped",
      payload: payload,
      response: skipped,
      data: skipped,
      error: null,
      source: "local_validation",
      ts: Date.now()
    };

    track("result_line_sync_skipped", {
      reason: "missing_valid_line_user_id",
      userId: payload.userId || "",
      referralCode: payload.referralCode || "",
      score: payload.score || 0,
      points: payload.points || 0
    });

    return Promise.resolve(skipped);
  }

  /*
   * 確保 battleId 存在。
   */
  if (!payload.battleId) {
    payload.battleId =
      "zg_" +
      String(payload.userId || "user").replace(/[^\w-]/g, "").slice(0, 32) +
      "_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 8);
  }

  const syncKey = getLineResultSyncKey(payload);

  /*
   * 防止同頁同一場重複送出。
   */
  try {
    if (sessionStorage.getItem(syncKey) === "1") {
      const skipped = {
        ok: true,
        skipped: true,
        reason: "already_synced",
        payload: payload
      };

      window.ZELO_LAST_RECORD_BATTLE_RESULT = {
        status: "skipped",
        payload: payload,
        response: skipped,
        data: skipped,
        error: null,
        source: "session_dedupe",
        ts: Date.now()
      };

      track("result_line_sync_skipped", {
        reason: "already_synced",
        userId: payload.userId || "",
        battleId: payload.battleId || ""
      });

      return Promise.resolve(skipped);
    }

    sessionStorage.setItem(syncKey, "1");
  } catch (error) {}

  track("result_line_sync_start", {
    userId: payload.userId || "",
    battleId: payload.battleId || "",
    result: payload.result || "",
    score: payload.score || 0,
    totalScore: payload.totalScore || 0,
    points: payload.points || 0,
    delta: payload.delta || 0,
    referralCode: payload.referralCode || "",
    source: "jsonp_recordBattleResult"
  });

  /*
   * 直接使用 JSONP。
   * 不使用 fetch，避免 GAS / Shopify / LIFF CORS 卡 pending。
   */
  return jsonpApi("recordBattleResult", payload)
    .then(function(jsonpResponse) {
      const gasData =
        jsonpResponse && jsonpResponse.data
          ? jsonpResponse.data
          : jsonpResponse;

      const ok = !!(gasData && gasData.ok);

      const finalResponse = {
        ok: ok,
        source: "jsonp_recordBattleResult",
        payload: payload,
        data: gasData || null,
        raw: jsonpResponse || null
      };

      window.ZELO_LAST_RECORD_BATTLE_RESULT = {
        status: ok ? "success" : "rejected",
        payload: payload,
        response: finalResponse,
        data: gasData || null,
        error: null,
        source: "jsonp_recordBattleResult",
        ts: Date.now()
      };

      console.log(
        "[ZELO GAME] recordBattleResult final:",
        window.ZELO_LAST_RECORD_BATTLE_RESULT
      );

      track("result_line_sync_sent", {
        userId: payload.userId || "",
        battleId: payload.battleId || "",
        ok: ok,
        code: gasData && gasData.code ? gasData.code : "",
        result: gasData && gasData.result ? gasData.result : "",
        reason: gasData && gasData.reason ? gasData.reason : "",
        score:
          gasData && gasData.score !== undefined
            ? gasData.score
            : payload.score || 0,
        totalScore:
          gasData && gasData.totalScore !== undefined
            ? gasData.totalScore
            : payload.totalScore || 0,
        delta:
          gasData && gasData.delta !== undefined
            ? gasData.delta
            : payload.delta || 0,
        source: "jsonp_recordBattleResult"
      });

      /*
       * GAS 回傳排行榜時，立即更新結果頁排行榜。
       */
      try {
        if (gasData && (gasData.friendRank || gasData.rows || gasData.rank)) {
          hydrateResultFriendRank(gasData);
        }
      } catch (hydrateError) {
        console.warn("[ZELO GAME] hydrateResultFriendRank failed:", hydrateError);
      }

      return finalResponse;
    })
    .catch(function(error) {
      const message = String(
        error && error.message
          ? error.message
          : error || "recordBattleResult JSONP failed"
      );

      window.ZELO_LAST_RECORD_BATTLE_RESULT = {
        status: "failed",
        payload: payload,
        response: null,
        data: null,
        error: message,
        source: "jsonp_recordBattleResult",
        ts: Date.now()
      };

      console.warn(
        "[ZELO GAME] recordBattleResult failed:",
        window.ZELO_LAST_RECORD_BATTLE_RESULT
      );

      track("result_line_sync_failed", {
        userId: payload.userId || "",
        battleId: payload.battleId || "",
        error: message,
        source: "jsonp_recordBattleResult"
      });

      throw error;
    });
}


async function loadFriendRankFromServer(result = {}) {
  const profilePayload = getProfilePayload({
    source: "result_friend_rank"
  });

  const userId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    "";

  const referralCode =
    result.referralCode ||
    result.myReferralCode ||
    result.ownerReferralCode ||
    profilePayload.referralCode ||
    getMyReferralCode();

  if (!userId && !referralCode) {
    return {
      ok: false,
      reason: "missing_user_id_and_referral_code",
      result
    };
  }

  try {
    const data = await jsonpApi("friendRank", {
      action: "friendRank",

      userId,
      lineUserId: userId,
      ownerLineUserId: userId,

      referralCode,
      myReferralCode: referralCode,
      ownerReferralCode: referralCode,

      displayName:
        result.displayName ||
        result.playerName ||
        profilePayload.displayName ||
        getPlayerName() ||
        "你",

      playerName:
        result.playerName ||
        result.displayName ||
        profilePayload.playerName ||
        getPlayerName() ||
        "你",

      name:
        result.name ||
        result.playerName ||
        result.displayName ||
        profilePayload.displayName ||
        getPlayerName() ||
        "你",

      pictureUrl:
        result.pictureUrl ||
        profilePayload.pictureUrl ||
        "",

      avatar:
        result.avatar ||
        result.pictureUrl ||
        profilePayload.pictureUrl ||
        "",

      avatarUrl:
        result.avatarUrl ||
        result.pictureUrl ||
        profilePayload.pictureUrl ||
        "",

      totalScore:
        Number(
          result.totalScore ??
          result.score ??
          result.bestScore ??
          getMyScore()
        ) || 0,

      score:
        Number(
          result.score ??
          result.totalScore ??
          result.bestScore ??
          getMyScore()
        ) || 0,

      bestScore:
        Number(
          result.bestScore ??
          result.score ??
          result.totalScore ??
          getMyScore()
        ) || 0,

      inviterReferralCode:
        result.inviterReferralCode ||
        profilePayload.inviterReferralCode ||
        getSavedInviterReferralCode() ||
        "",

      inviterCode:
        result.inviterCode ||
        profilePayload.inviterCode ||
        getSavedInviterReferralCode() ||
        "",

      version: VERSION,
      pageUrl: location.href,
      userAgent: navigator.userAgent || ""
    });

    console.log("[ZELO GAME] friendRank request:", {
      userId,
      referralCode
    });

    console.log("[ZELO GAME] friendRank response:", data);

    window.ZELO_LAST_FRIEND_RANK_DEBUG = {
      request: {
        userId,
        lineUserId: userId,
        referralCode,
        myReferralCode: referralCode,
        ownerReferralCode: referralCode
      },
      response: data
    };

    const friends = Array.isArray(data.friends)
      ? data.friends
      : Array.isArray(data.rank)
        ? data.rank
        : Array.isArray(data.rows)
          ? data.rows
          : Array.isArray(data.friendRank)
            ? data.friendRank
            : [];

    const friendRank = friends.map((item, index) => {
      const itemUserId =
        item.userId ||
        item.lineUserId ||
        item.id ||
        item.uid ||
        "";

      const name =
        item.playerName ||
        item.displayName ||
        item.name ||
        item.lineDisplayName ||
        itemUserId ||
        "LINE 玩家";

      const itemScore =
        Number(
          item.score ??
          item.bestScore ??
          item.totalScore ??
          item.finalScore ??
          0
        ) || 0;

      const isMeById =
        !!itemUserId &&
        !!userId &&
        String(itemUserId) === String(userId);

      return {
        rank: Number(item.position || item.rank || index + 1),
        position: Number(item.position || item.rank || index + 1),

        userId: itemUserId,
        lineUserId: item.lineUserId || itemUserId,

        name,
        playerName: name,
        displayName: item.displayName || name,

        pictureUrl:
          item.pictureUrl ||
          item.avatar ||
          item.avatarUrl ||
          "",

        avatar:
          item.avatar ||
          item.pictureUrl ||
          item.avatarUrl ||
          "",

        avatarUrl:
          item.avatarUrl ||
          item.pictureUrl ||
          item.avatar ||
          "",

        score: itemScore,
        bestScore: itemScore,
        totalScore: itemScore,

        bestRank:
          item.bestRank ||
          item.rankTag ||
          item.tier ||
          "",

        isMe: item.isMe === true || item.me === true || isMeById,
        me: item.isMe === true || item.me === true || isMeById
      };
    });

    return {
      ok: true,
      result: {
        ...result,

        userId,
        lineUserId: userId,

        referralCode,
        myReferralCode: referralCode,
        ownerReferralCode: referralCode,

        friendRank,

        friends: friendRank,
        rows: friendRank,
        rank: friendRank,

        totalFriends: Number(
          data.totalFriends ||
          data.friendCount ||
          Math.max(0, friendRank.length - 1) ||
          0
        ),

        lineInviteFriendCount:
          Number(
            data.lineInviteFriendCount ??
            data.referralCount ??
            data.successCount ??
            data.count ??
            result.lineInviteFriendCount ??
            0
          ) || 0,

        referralCount:
          Number(
            data.referralCount ??
            data.lineInviteFriendCount ??
            data.successCount ??
            data.count ??
            0
          ) || 0,

        successCount:
          Number(
            data.successCount ??
            data.lineInviteFriendCount ??
            data.referralCount ??
            data.count ??
            0
          ) || 0,

        count:
          Number(
            data.count ??
            data.lineInviteFriendCount ??
            data.referralCount ??
            data.successCount ??
            0
          ) || 0,

        serverFriendRankRaw: data
      }
    };
  } catch (error) {
    console.warn("[ZELO GAME] loadFriendRankFromServer failed:", error);

    return {
      ok: false,
      reason: "friend_rank_failed",
      error,
      result
    };
  }
}



  async function syncReferralSuccessCount(source = "unknown") {
  const profilePayload =
    typeof getProfilePayload === "function"
      ? getProfilePayload({
          source
        })
      : {};

  const ownerReferralCode =
    typeof getMyReferralCode === "function"
      ? getMyReferralCode()
      : "";

  const ownerUserId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    getUserId() ||
    "";

  /*
   * 沒有任何身份時，不打 API，直接回本機備援值。
   */
  if (!ownerReferralCode && !ownerUserId) {
    const fallback =
      typeof getFallbackReferralSuccessCount === "function"
        ? getFallbackReferralSuccessCount()
        : getLineInviteFriendCount();

    setLineInviteFriendCount(fallback);

    return fallback;
  }

  try {
    const data = await jsonpApi("get_liff_referral_count", {
      ownerReferralCode,
      referralCode: ownerReferralCode,
      inviterReferralCode: ownerReferralCode,
      ref: ownerReferralCode,

      ownerLineUserId: ownerUserId,
      lineUserId: ownerUserId,
      userId: ownerUserId,

      source,
      pageUrl: location.href,
      userAgent: navigator.userAgent || ""
    });

    const count = Number(
      data.count ??
      data.referralCount ??
      data.successCount ??
      data.lineInviteFriendCount ??
      data.invitedCount ??
      0
    );

    const safeCount = Number.isFinite(count)
      ? Math.max(0, count)
      : 0;

    setLineInviteFriendCount(safeCount);
    setFallbackReferralSuccessCount(safeCount);

    if (state) {
      state.lineInviteFriendCount = safeCount;
    }

    track("referral_success_count_synced", {
      source,
      ownerReferralCode,
      ownerUserId,
      count: safeCount,
      ok: !!data.ok
    });

    return safeCount;
  } catch (error) {
    const fallback =
      typeof getFallbackReferralSuccessCount === "function"
        ? getFallbackReferralSuccessCount()
        : getLineInviteFriendCount();

    setLineInviteFriendCount(fallback);

    if (state) {
      state.lineInviteFriendCount = fallback;
    }

    track("referral_success_count_sync_failed", {
      source,
      ownerReferralCode,
      ownerUserId,
      fallback,
      message: String(error && error.message ? error.message : error)
    });

    return fallback;
  }
}

  async function registerReferralFromUrl() {
  const inviterReferralCode = getSavedInviterReferralCode();

  if (!inviterReferralCode) {
    return {
      ok: false,
      reason: "missing_inviter_code"
    };
  }

  const profilePayload = getProfilePayload();

  const userId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    "";

  const myReferralCode =
    profilePayload.referralCode ||
    profilePayload.myReferralCode ||
    getMyReferralCode();

  if (!userId && !myReferralCode) {
    return {
      ok: false,
      reason: "missing_referred_identity"
    };
  }

  if (myReferralCode && inviterReferralCode === myReferralCode) {
    return {
      ok: false,
      reason: "self_referral"
    };
  }

  const registerKey = [
    "zelo_ref_registered",
    inviterReferralCode,
    userId || myReferralCode
  ].join("_");

  try {
    if (localStorage.getItem(registerKey) === "1") {
      return {
        ok: true,
        duplicated: true,
        reason: "already_registered_local"
      };
    }
  } catch (error) {}

  try {
    const data = await jsonpApi("register_liff_referral", {
      action: "register_liff_referral",

      inviterReferralCode,
      inviterCode: inviterReferralCode,
      ownerReferralCode: inviterReferralCode,

      referredReferralCode: myReferralCode,
      myReferralCode: myReferralCode,
      referralCode: myReferralCode,

      referredUserId: userId,
      userId,
      lineUserId: userId,

      referredPlayerName:
        profilePayload.displayName ||
        profilePayload.playerName ||
        getPlayerName() ||
        "LINE 玩家",

      playerName:
        profilePayload.displayName ||
        profilePayload.playerName ||
        getPlayerName() ||
        "LINE 玩家",

      displayName:
        profilePayload.displayName ||
        profilePayload.playerName ||
        getPlayerName() ||
        "LINE 玩家",

      source: "game_js_register_referral",
      pageUrl: location.href,
      userAgent: navigator.userAgent || "",
      version: VERSION
    });

    const count =
      Number(
        data.lineInviteFriendCount ??
        data.referralCount ??
        data.successCount ??
        data.count ??
        0
      ) || 0;

    if (count > 0) {
      setLineInviteFriendCount(count);
    }

    try {
      if (data && data.ok) {
        localStorage.setItem(registerKey, "1");
      }
    } catch (error) {}

    console.log("[ZELO GAME] registerReferralFromUrl:", data);

    return data;
  } catch (error) {
    console.warn("[ZELO GAME] registerReferralFromUrl failed:", error);

    return {
      ok: false,
      reason: "register_referral_failed",
      error
    };
  }
}


async function loadInviteStatusFromServer(result = {}) {
  const profilePayload = getProfilePayload();

  const userId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    "";

  const referralCode =
    result.referralCode ||
    result.myReferralCode ||
    result.ownerReferralCode ||
    profilePayload.referralCode ||
    getMyReferralCode();

  if (!userId && !referralCode) {
    return {
      ok: false,
      reason: "missing_user_id_and_referral_code",
      result
    };
  }

  try {
    const data = await jsonpApi("inviteStatus", {
      action: "inviteStatus",

      userId,
      lineUserId: userId,
      ownerLineUserId: userId,

      referralCode,
      myReferralCode: referralCode,
      ownerReferralCode: referralCode,

      version: VERSION,
      pageUrl: location.href,
      userAgent: navigator.userAgent || ""
    });

    const count =
      Number(
        data.lineInviteFriendCount ??
        data.referralCount ??
        data.successCount ??
        data.count ??
        data.invitedCount ??
        0
      ) || 0;

    setLineInviteFriendCount(count);

    return {
      ok: true,
      result: {
        ...result,

        userId,
        lineUserId: userId,

        referralCode,
        myReferralCode: referralCode,
        ownerReferralCode: referralCode,

        lineInviteFriendCount: count,
        referralCount: count,
        successCount: count,
        count,

        inviteStatusRaw: data
      }
    };
  } catch (error) {
    console.warn("[ZELO GAME] loadInviteStatusFromServer failed:", error);

    return {
      ok: false,
      reason: "invite_status_failed",
      error,
      result
    };
  }
}


async function hydrateResultFriendRank(result = {}) {
  const profilePayload = getProfilePayload();

  const userId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    "";

  const referralCode =
    result.referralCode ||
    result.myReferralCode ||
    result.ownerReferralCode ||
    profilePayload.referralCode ||
    getMyReferralCode();

  let mergedResult = {
    ...result,

    userId,
    lineUserId: userId,
    ownerLineUserId: userId,

    referralCode,
    myReferralCode: referralCode,
    ownerReferralCode: referralCode,

    displayName:
      result.displayName ||
      profilePayload.displayName ||
      getPlayerName() ||
      "你",

    playerName:
      result.playerName ||
      result.displayName ||
      profilePayload.playerName ||
      profilePayload.displayName ||
      getPlayerName() ||
      "你",

    name:
      result.name ||
      result.playerName ||
      result.displayName ||
      profilePayload.displayName ||
      getPlayerName() ||
      "你",

    pictureUrl:
      result.pictureUrl ||
      profilePayload.pictureUrl ||
      "",

    avatar:
      result.avatar ||
      result.pictureUrl ||
      profilePayload.pictureUrl ||
      "",

    avatarUrl:
      result.avatarUrl ||
      result.pictureUrl ||
      profilePayload.pictureUrl ||
      "",

    points:
      Number(
        result.points ??
        result.battlePoints ??
        0
      ) || 0,

    battlePoints:
      Number(
        result.battlePoints ??
        result.points ??
        0
      ) || 0,

    score:
      Number(
        result.score ??
        result.bestScore ??
        result.totalScore ??
        getMyScore()
      ) || 0,

    bestScore:
      Number(
        result.bestScore ??
        result.score ??
        result.totalScore ??
        getMyScore()
      ) || 0,

    totalScore:
      Number(
        result.totalScore ??
        result.score ??
        result.bestScore ??
        getMyScore()
      ) || 0,

    lineInviteFriendCount:
      Number(
        result.lineInviteFriendCount ??
        profilePayload.lineInviteFriendCount ??
        getLineInviteFriendCount() ??
        0
      ) || 0
  };

  const inviteStatus = await loadInviteStatusFromServer(mergedResult);
  mergedResult = inviteStatus.result || mergedResult;

  const friendRank = await loadFriendRankFromServer(mergedResult);
  mergedResult = friendRank.result || mergedResult;

  try {
    localStorage.setItem(STORAGE.lastResult, JSON.stringify(mergedResult));
  } catch (error) {}

  if (state) {
    state.lastBattleResult = mergedResult;
    state.lineInviteFriendCount = Number(
      mergedResult.lineInviteFriendCount ??
      getLineInviteFriendCount() ??
      0
    );
  }

  track("result_friend_rank_hydrated", {
    userId: mergedResult.userId || "",
    lineUserId: mergedResult.lineUserId || "",
    referralCode: mergedResult.referralCode || "",
    playerName: mergedResult.playerName || "",
    score: Number(mergedResult.score || 0),
    points: Number(mergedResult.points || 0),
    lineInviteFriendCount: state.lineInviteFriendCount,
    friendRankCount: Array.isArray(mergedResult.friendRank)
      ? mergedResult.friendRank.length
      : 0,
    totalFriends: Number(mergedResult.totalFriends || 0)
  });

  return mergedResult;
}

  function renderFriendRankLoading(result = {}) {
  const list = document.querySelector("#zg-rank-list");
  if (!list) return;

  const profilePayload = getProfilePayload();

  const myUserId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    profilePayload.lineUserId ||
    "";

  const myScore =
    Number(
      result.totalScore ??
      result.score ??
      result.bestScore ??
      getMyScore()
    ) || 0;

  const myName =
    result.playerName ||
    result.displayName ||
    profilePayload.displayName ||
    getPlayerName() ||
    "你";

  const myPictureUrl =
    result.pictureUrl ||
    profilePayload.pictureUrl ||
    "";

  const cleanName =
    String(myName || "你")
      .replace("（你）", "")
      .replace("(你)", "")
      .trim() || "你";

  const rows = [
    {
      rank: 1,
      position: 1,

      userId: myUserId,
      lineUserId: myUserId,

      name: `${cleanName}（你）`,
      playerName: `${cleanName}（你）`,
      displayName: `${cleanName}（你）`,

      pictureUrl: myPictureUrl,

      score: myScore,
      bestScore: myScore,
      totalScore: myScore,

      bestRank: "",
      isMe: true,
      me: true
    },
    {
      rank: 2,
      position: 2,

      userId: "",
      lineUserId: "",

      name: "好友排行載入中...",
      playerName: "好友排行載入中...",
      displayName: "好友排行載入中...",

      pictureUrl: "",

      score: "",
      bestScore: "",
      totalScore: "",

      bestRank: "",
      isMe: false,
      me: false,
      isLoadingPlaceholder: true
    },
    {
      rank: 3,
      position: 3,

      userId: "",
      lineUserId: "",

      name: "請稍候",
      playerName: "請稍候",
      displayName: "請稍候",

      pictureUrl: "",

      score: "",
      bestScore: "",
      totalScore: "",

      bestRank: "",
      isMe: false,
      me: false,
      isLoadingPlaceholder: true
    }
  ];

  window.ZELO_LAST_RENDERED_FRIEND_RANK_LOADING = {
    rows,
    myUserId,
    myScore,
    ts: Date.now()
  };

  list.innerHTML = rows
    .map(renderFriendRankItem)
    .join("");

  forceRankListScrollable();
  setTimeout(forceRankListScrollable, 80);
}


function renderFriendRank(result = {}) {
  const list = document.querySelector("#zg-rank-list");
  if (!list) return;

  const profilePayload = getProfilePayload();

  const myUserId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    result.userId ||
    result.lineUserId ||
    "";

  const myScore =
    Number(
      result.totalScore ??
      result.score ??
      result.bestScore ??
      getMyScore()
    ) || 0;

  const myName =
    result.playerName ||
    result.displayName ||
    profilePayload.displayName ||
    getPlayerName() ||
    "你";

  const myPictureUrl =
    result.pictureUrl ||
    result.avatar ||
    result.avatarUrl ||
    profilePayload.pictureUrl ||
    "";

  const sourceRows = Array.isArray(result.friendRank)
    ? result.friendRank
    : Array.isArray(result.rows)
      ? result.rows
      : Array.isArray(result.friends)
        ? result.friends
        : Array.isArray(result.rank)
          ? result.rank
          : [];

  let rows = sourceRows
    .filter(Boolean)
    .map((item, index) => {
      const userId =
        item.userId ||
        item.lineUserId ||
        item.id ||
        item.uid ||
        "";

      const rawName =
        item.playerName ||
        item.displayName ||
        item.name ||
        item.lineDisplayName ||
        "";

      const score =
        Number(
          item.totalScore ??
          item.score ??
          item.bestScore ??
          item.finalScore ??
          0
        ) || 0;

      const isOldBlank =
        item.isPlaceholder === true ||
        item.placeholder === true ||
        (!userId && !rawName && score <= 0);

      const isMe =
        item.isMe === true ||
        item.me === true ||
        (
          !!userId &&
          !!myUserId &&
          String(userId) === String(myUserId)
        );

      return {
        rank: Number(item.rank || item.position || index + 1),
        position: Number(item.position || item.rank || index + 1),

        userId,
        lineUserId: item.lineUserId || userId,

        name: rawName || userId || "",
        playerName: rawName || userId || "",
        displayName: item.displayName || rawName || userId || "",

        pictureUrl:
          item.pictureUrl ||
          item.avatar ||
          item.avatarUrl ||
          "",

        score: isMe ? Math.max(score, myScore) : score,
        bestScore: isMe ? Math.max(score, myScore) : score,
        totalScore: isMe ? Math.max(score, myScore) : score,

        bestRank:
          item.bestRank ||
          item.rankTag ||
          item.tier ||
          "",

        isMe,
        me: isMe,
        isOldBlank
      };
    })
    .filter((item) => {
      if (item.isOldBlank) return false;
      if (item.isMe) return true;
      if (item.userId) return true;
      if (String(item.name || "").trim()) return true;
      if (Number(item.score || 0) > 0) return true;
      return false;
    });

  /*
   * 去重：同 userId 只留最高分。
   */
  const map = {};

  rows.forEach((item) => {
    const key = item.userId
      ? `uid:${item.userId}`
      : item.name
        ? `name:${item.name}`
        : `row:${item.rank}`;

    const old = map[key];

    if (!old || Number(item.score || 0) > Number(old.score || 0)) {
      map[key] = item;
    }

    if (item.isMe && old) {
      map[key] = {
        ...old,
        ...item,
        score: Math.max(Number(old.score || 0), Number(item.score || 0)),
        bestScore: Math.max(Number(old.bestScore || 0), Number(item.bestScore || 0)),
        totalScore: Math.max(Number(old.totalScore || 0), Number(item.totalScore || 0)),
        isMe: true,
        me: true
      };
    }
  });

  rows = Object.keys(map).map((key) => map[key]);

  /*
   * GAS 沒回自己時，前端補自己。
   */
  const hasMe = rows.some((item) => item.isMe);

  if (!hasMe && myUserId) {
    const cleanName =
      String(myName || "你")
        .replace("（你）", "")
        .replace("(你)", "")
        .trim() || "你";

    rows.push({
      rank: 999999,
      position: 999999,

      userId: myUserId,
      lineUserId: myUserId,

      name: `${cleanName}（你）`,
      playerName: `${cleanName}（你）`,
      displayName: `${cleanName}（你）`,

      pictureUrl: myPictureUrl,

      score: myScore,
      bestScore: myScore,
      totalScore: myScore,

      bestRank: "",
      isMe: true,
      me: true
    });
  }

  rows = rows
    .map((item) => {
      if (!item.isMe) return item;

      const cleanName =
        String(item.name || myName || "你")
          .replace("（你）", "")
          .replace("(你)", "")
          .trim() || "你";

      const fixedScore = Math.max(
        Number(item.score || 0),
        Number(myScore || 0)
      );

      return {
        ...item,
        name: `${cleanName}（你）`,
        playerName: `${cleanName}（你）`,
        displayName: `${cleanName}（你）`,
        pictureUrl: item.pictureUrl || myPictureUrl,
        score: fixedScore,
        bestScore: fixedScore,
        totalScore: fixedScore,
        isMe: true,
        me: true
      };
    })
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      if (a.isMe && !b.isMe) return -1;
      if (!a.isMe && b.isMe) return 1;

      return Number(a.position || a.rank || 999999) -
        Number(b.position || b.rank || 999999);
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      position: index + 1
    }));

  /*
   * 固定至少 3 列：
   * 沒朋友就顯示「立即邀請朋友」。
   * 超過 3 筆不截斷，讓排行榜可以下滑。
   */
  const displayRows = rows.slice();

  while (displayRows.length < 3) {
    const nextRank = displayRows.length + 1;

displayRows.push({
  rank: nextRank,
  position: nextRank,

  userId: "",
  lineUserId: "",

  name: "立即邀請朋友",
  playerName: "立即邀請朋友",
  displayName: "立即邀請朋友",

  pictureUrl: "",

  score: "",
  bestScore: "",
  totalScore: "",

  bestRank: "",
  isMe: false,
  me: false,
  isInvitePlaceholder: true
});

  }

  window.ZELO_LAST_RENDERED_FRIEND_RANK = {
    input: result,
    sourceRows,
    rows,
    displayRows,
    count: rows.length,
    displayCount: displayRows.length,
    myUserId,
    myScore,
    ts: Date.now()
  };

  list.innerHTML = displayRows
    .map(renderFriendRankItem)
    .join("");

  if (typeof forceRankListScrollable === "function") {
    forceRankListScrollable();
    setTimeout(forceRankListScrollable, 80);
    setTimeout(forceRankListScrollable, 260);
  }
}


 function forceRankListScrollable() {
  const resultScreen = screenResult();
  const rankCard = document.querySelector("#zg-friend-rank");
  const rankList = document.querySelector("#zg-rank-list");

  if (!rankCard || !rankList) return;

  const vv = window.visualViewport;

  const appHeight = Math.floor(
    vv && vv.height
      ? vv.height
      : window.innerHeight || document.documentElement.clientHeight || 844
  );

  const appWidth = Math.floor(
    vv && vv.width
      ? vv.width
      : window.innerWidth || document.documentElement.clientWidth || 390
  );

  const compact = appHeight < 860 || appWidth <= 430;
  const veryCompact = appHeight < 740 || appWidth <= 375;

  const rowCount = rankList.querySelectorAll(".zg-rank-item").length;

  const maxRankHeight =
    rowCount <= 3
      ? "none"
      : veryCompact
        ? "210px"
        : compact
          ? "260px"
          : "340px";

  const rankRowH = veryCompact ? 54 : compact ? 60 : 66;
  const rankMedalSize = veryCompact ? 30 : compact ? 34 : 36;
  const rankAvatarSize = veryCompact ? 26 : compact ? 28 : 30;

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  const main = resultScreen
    ? resultScreen.querySelector(".zg-result-main")
    : null;

  if (main) {
    set(main, "overflow-y", "auto");
    set(main, "overflow-x", "hidden");
    set(main, "-webkit-overflow-scrolling", "touch");
    set(main, "touch-action", "pan-y");
  }

  set(rankCard, "display", "flex");
  set(rankCard, "flex-direction", "column");
  set(rankCard, "min-height", "0");
  set(rankCard, "height", "auto");
  set(rankCard, "max-height", "none");
  set(rankCard, "overflow", "hidden");

  set(rankList, "display", "flex");
  set(rankList, "flex-direction", "column");
  set(rankList, "gap", "8px");

  set(rankList, "width", "100%");
  set(rankList, "height", "auto");
  set(rankList, "min-height", "0");
  set(rankList, "max-height", maxRankHeight);

  if (rowCount <= 3) {
    set(rankList, "overflow-y", "visible");
  } else {
    set(rankList, "overflow-y", "auto");
  }

  set(rankList, "overflow-x", "hidden");
  set(rankList, "-webkit-overflow-scrolling", "touch");
  set(rankList, "overscroll-behavior-y", "contain");
  set(rankList, "overscroll-behavior-x", "none");
  set(rankList, "touch-action", "pan-y");

  set(rankList, "padding-right", "2px");
  set(rankList, "box-sizing", "border-box");
  set(rankList, "border-radius", "14px");

  /*
   * 關鍵：
   * 所有排行列，包括邀請 placeholder，
   * 都強制變成同一個 4 欄 grid。
   */
  rankList.querySelectorAll(".zg-rank-item").forEach((item) => {
    set(item, "display", "grid");
    set(item, "grid-template-columns", "42px 32px minmax(0, 1fr) auto");
    set(item, "align-items", "center");
    set(item, "gap", veryCompact ? "7px" : "9px");

    set(item, "height", `${rankRowH}px`);
    set(item, "min-height", `${rankRowH}px`);
    set(item, "max-height", `${rankRowH}px`);

    set(item, "padding", veryCompact ? "4px 12px" : "5px 14px");
    set(item, "border-radius", "12px");
    set(item, "box-sizing", "border-box");
    set(item, "overflow", "hidden");
    set(item, "flex", "0 0 auto");

    set(
      item,
      "background",
      "linear-gradient(180deg, rgba(72,82,105,.78), rgba(47,56,76,.78))"
    );

    set(
      item,
      "box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.08), 0 4px 10px rgba(0,0,0,.12)"
    );
  });

  rankList.querySelectorAll(".zg-rank-medal").forEach((medal) => {
    set(medal, "display", "flex");
    set(medal, "align-items", "center");
    set(medal, "justify-content", "center");
    set(medal, "width", `${rankMedalSize}px`);
    set(medal, "min-width", `${rankMedalSize}px`);
    set(medal, "height", `${rankMedalSize}px`);
    set(medal, "min-height", `${rankMedalSize}px`);
    set(medal, "border-radius", "999px");
    set(medal, "background", "linear-gradient(180deg, #fff27a, #ffd74b)");
    set(medal, "color", "#26200a");
    set(medal, "font-size", veryCompact ? "16px" : "18px");
    set(medal, "font-weight", "950");
    set(medal, "line-height", "1");
  });

  rankList.querySelectorAll(".zg-rank-avatar").forEach((avatar) => {
    set(avatar, "display", "flex");
    set(avatar, "align-items", "center");
    set(avatar, "justify-content", "center");

    set(avatar, "width", `${rankAvatarSize}px`);
    set(avatar, "min-width", `${rankAvatarSize}px`);
    set(avatar, "max-width", `${rankAvatarSize}px`);

    set(avatar, "height", `${rankAvatarSize}px`);
    set(avatar, "min-height", `${rankAvatarSize}px`);
    set(avatar, "max-height", `${rankAvatarSize}px`);

    set(avatar, "border-radius", "999px");
    set(avatar, "object-fit", "cover");
    set(avatar, "background", "rgba(255,255,255,.14)");
    set(avatar, "border", "1px solid rgba(255,255,255,.18)");
    set(avatar, "color", "#fff");
    set(avatar, "font-size", veryCompact ? "10px" : "11px");
    set(avatar, "font-weight", "900");
    set(avatar, "overflow", "hidden");
    set(avatar, "box-sizing", "border-box");
    set(avatar, "line-height", "1");
  });

  rankList.querySelectorAll(".zg-rank-avatar-invite").forEach((avatar) => {
    set(avatar, "background", "linear-gradient(180deg, #35e879, #08bd55)");
    set(avatar, "border", "1px solid rgba(255,255,255,.25)");
    set(avatar, "color", "#fff");
    set(avatar, "font-size", "18px");
    set(avatar, "font-weight", "950");
  });

  rankList.querySelectorAll(".zg-rank-player").forEach((player) => {
    set(player, "min-width", "0");
    set(player, "overflow", "hidden");
  });

  rankList.querySelectorAll(".zg-rank-name-row").forEach((row) => {
    set(row, "display", "flex");
    set(row, "align-items", "center");
    set(row, "gap", veryCompact ? "4px" : "5px");
    set(row, "min-width", "0");
    set(row, "max-width", "100%");
    set(row, "overflow", "hidden");
  });

  rankList.querySelectorAll(".zg-rank-name").forEach((name) => {
    set(name, "min-width", "0");
    set(name, "max-width", "100%");
    set(name, "font-size", veryCompact ? "14px" : "16px");
    set(name, "font-weight", "900");
    set(name, "color", "#fff");
    set(name, "white-space", "nowrap");
    set(name, "overflow", "hidden");
    set(name, "text-overflow", "ellipsis");
    set(name, "line-height", "1.1");
  });

  rankList.querySelectorAll(".zg-rank-score").forEach((score) => {
    set(score, "display", "flex");
    set(score, "align-items", "center");
    set(score, "justify-content", "flex-end");
    set(score, "font-size", veryCompact ? "15px" : "18px");
    set(score, "font-weight", "950");
    set(score, "color", "#ffe05f");
    set(score, "white-space", "nowrap");
    set(score, "text-align", "right");
    set(score, "line-height", "1");
  });

  rankList.querySelectorAll(".zg-rank-item.is-invite-placeholder").forEach((item) => {
    set(item, "cursor", "default");
    set(item, "opacity", "0.94");
  });

  rankList.querySelectorAll(".zg-rank-invite-btn").forEach((btn) => {
    set(btn, "display", "inline-flex");
    set(btn, "align-items", "center");
    set(btn, "justify-content", "center");
    set(btn, "height", "30px");
    set(btn, "min-width", "58px");
    set(btn, "padding", "0 12px");
    set(btn, "border-radius", "999px");
    set(btn, "border", "0");
    set(btn, "background", "linear-gradient(180deg, #58ec86, #04c855)");
    set(btn, "color", "#fff");
    set(btn, "font-size", "13px");
    set(btn, "font-weight", "950");
    set(btn, "line-height", "1");
    set(btn, "white-space", "nowrap");
    set(btn, "pointer-events", "auto");
  });

   rankList.querySelectorAll(".zg-rank-avatar-loading").forEach((avatar) => {
  set(avatar, "background", "rgba(255,255,255,.12)");
  set(avatar, "border", "1px solid rgba(255,255,255,.18)");
  set(avatar, "color", "rgba(255,255,255,.72)");
  set(avatar, "font-size", "10px");
  set(avatar, "font-weight", "950");
});

rankList.querySelectorAll(".zg-rank-loading-dot").forEach((el) => {
  set(el, "display", "inline-flex");
  set(el, "align-items", "center");
  set(el, "justify-content", "center");
  set(el, "height", "28px");
  set(el, "min-width", "52px");
  set(el, "padding", "0 10px");
  set(el, "border-radius", "999px");
  set(el, "background", "rgba(255,255,255,.12)");
  set(el, "color", "rgba(255,255,255,.78)");
  set(el, "font-size", "12px");
  set(el, "font-weight", "900");
});
   rankList.querySelectorAll(".zg-rank-not-played").forEach((el) => {
  set(el, "display", "inline-flex");
  set(el, "align-items", "center");
  set(el, "justify-content", "center");
  set(el, "height", "28px");
  set(el, "min-width", "58px");
  set(el, "padding", "0 10px");
  set(el, "border-radius", "999px");
  set(el, "background", "rgba(255,255,255,.12)");
  set(el, "color", "rgba(255,255,255,.72)");
  set(el, "font-size", "12px");
  set(el, "font-weight", "900");
});

}


function renderFriendRankItem(item, index) {
  const rank = Number(item.rank || item.position || index + 1);

  const isInvitePlaceholder = item.isInvitePlaceholder === true;
  const isLoadingPlaceholder = item.isLoadingPlaceholder === true;
  const isMe = item.isMe === true || item.me === true;

  const rawName =
    item.name ||
    item.playerName ||
    item.displayName ||
    "";

  const name = String(rawName || "").trim();

  const pictureUrl = item.pictureUrl || "";

  const scoreValue =
    item.totalScore ??
    item.score ??
    item.bestScore ??
    "";

  const scoreText =
    isInvitePlaceholder || isLoadingPlaceholder
      ? ""
      : String(Number(scoreValue || 0));

  const cleanAvatarName = name
    ? name
        .replace("（你）", "")
        .replace("(你)", "")
        .trim()
    : "";

  const avatarLetter = isInvitePlaceholder
    ? "+"
    : isLoadingPlaceholder
      ? "..."
      : isMe
        ? "我"
        : cleanAvatarName
          ? cleanAvatarName.slice(0, 1)
          : "";

  const avatarHtml =
    pictureUrl && !isInvitePlaceholder && !isLoadingPlaceholder
      ? `
        <img
          class="zg-rank-avatar zg-rank-classic-avatar"
          src="${escapeAttr(pictureUrl)}"
          alt=""
          draggable="false"
          onerror="this.style.display='none'"
        >
      `
      : `
        <div class="zg-rank-avatar zg-rank-classic-avatar zg-rank-avatar-empty ${
          isInvitePlaceholder
            ? "zg-rank-avatar-invite"
            : isLoadingPlaceholder
              ? "zg-rank-avatar-loading"
              : ""
        }">
          ${avatarLetter ? escapeHtml(avatarLetter) : ""}
        </div>
      `;

  const meBadgeHtml = isMe
    ? `<span class="zg-rank-me-badge">我</span>`
    : "";

  const bestRankHtml =
    item.bestRank && !isInvitePlaceholder && !isLoadingPlaceholder
      ? `<span class="zg-rank-best-tag">${escapeHtml(item.bestRank)}</span>`
      : "";

  const scoreHtml = isInvitePlaceholder
    ? `
      <button
        class="zg-rank-invite-btn"
        data-zg-action="share"
        type="button"
      >
        邀請
      </button>
    `
    : isLoadingPlaceholder
      ? `<span class="zg-rank-loading-dot">載入</span>`
     : Number(scoreValue || 0) <= 0 && !isMe
  ? `<span class="zg-rank-not-played">未挑戰</span>`
  : escapeHtml(scoreText);


  return `
    <div
      class="zg-rank-item zg-rank-classic-item ${isMe ? "is-me" : ""} ${isInvitePlaceholder ? "is-invite-placeholder" : ""} ${isLoadingPlaceholder ? "is-loading-placeholder" : ""}"
    >
      <div class="zg-rank-medal zg-rank-classic-medal">
        ${rank}
      </div>

      ${avatarHtml}

      <div class="zg-rank-player zg-rank-classic-player">
        <div class="zg-rank-name-row">
          <div class="zg-rank-name zg-rank-classic-name">
            ${escapeHtml(name || "LINE 玩家")}
          </div>

          ${meBadgeHtml}
          ${bestRankHtml}
        </div>
      </div>

      <div class="zg-rank-score zg-rank-classic-score">
        ${scoreHtml}
      </div>
    </div>
  `;
}


function renderResult(result) {
  if (!result) return;

  const profilePayload = getProfilePayload();
  const lineInviteFriendCount = getLineInviteFriendCount();

  result.userId =
    result.userId ||
    result.lineUserId ||
    profilePayload.userId ||
    "";

  result.lineUserId =
    result.lineUserId ||
    profilePayload.lineUserId ||
    profilePayload.userId ||
    "";

  result.displayName =
    result.displayName ||
    profilePayload.displayName ||
    getPlayerName() ||
    "你";

  result.playerName =
    result.playerName ||
    result.displayName ||
    profilePayload.playerName ||
    getPlayerName() ||
    "你";

  result.pictureUrl =
    result.pictureUrl ||
    profilePayload.pictureUrl ||
    "";

  result.lineInviteFriendCount = Number(
    result.lineInviteFriendCount ??
    lineInviteFriendCount ??
    0
  );

  result.points =
    Number(
      result.points ??
      result.battlePoints ??
      0
    ) || 0;

  result.battlePoints =
    Number(
      result.battlePoints ??
      result.points ??
      0
    ) || 0;

  result.score =
    Number(
      result.score ??
      result.bestScore ??
      result.totalScore ??
      getMyScore()
    ) || 0;

  result.bestScore =
    Number(
      result.bestScore ??
      result.score ??
      result.totalScore ??
      getMyScore()
    ) || 0;

  result.totalScore =
    Number(
      result.totalScore ??
      result.score ??
      result.bestScore ??
      getMyScore()
    ) || 0;

  if (state) {
    state.lastBattleResult = result;
    state.lineInviteFriendCount = result.lineInviteFriendCount;
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
      result.battlePoints ??
      0
    ) || 0;

  let badgeText = "平手";
  let titleText = "平手！再挑戰一次";
  let messageText = `本次分數：${points} 分`;

  if (resultType === "win") {
    badgeText = "勝利";
    titleText = "勝利！取得專屬獎勵";
    messageText = `本次分數：${points} 分`;
  } else if (resultType === "lose") {
    badgeText = "失敗";
    titleText = "失敗！再戰一次";
    messageText = `本次分數：${points} 分`;
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

    topImage.setAttribute("draggable", "false");
    topImage.removeAttribute("title");
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
        ? "恭喜你贏得折扣碼"
        : "挑戰完成，獲得折扣碼";
  }

  if (couponCode) {
    couponCode.textContent = coupon;
  }

  if (couponDesc) {
    couponDesc.textContent = "結帳時輸入折扣碼即可使用。";
  }

  if (couponCopyCode) {
    couponCopyCode.textContent = coupon;
  }

  if (couponCopyBtn) {
    const originalHtml = `複製折扣碼：<span id="zg-coupon-copy-code">${escapeHtml(coupon)}</span>`;

    couponCopyBtn.setAttribute("data-original-html", originalHtml);
    couponCopyBtn.setAttribute("data-coupon", coupon);
    couponCopyBtn.innerHTML = originalHtml;
  }

  if (couponCard) {
    couponCard.dataset.coupon = coupon;
    restartClass(couponCard, "zg-score-pop", 700);
  }

 renderFriendRankLoading(result);
forceResultVisible();
forceRankListScrollable();

  const syncPromise =
    typeof syncResultWithLineOnce === "function"
      ? syncResultWithLineOnce(result).catch((error) => {
          console.warn("[ZELO GAME] syncResultWithLineOnce failed:", error);

          track("result_line_sync_error", {
            message: String(error && error.message ? error.message : error)
          });

          return null;
        })
      : Promise.resolve(null);

  if (typeof hydrateResultFriendRank === "function") {
    syncPromise
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(resolve, 700);
        });
      })
      .then(() => hydrateResultFriendRank(result))
      .then((updatedResult) => {
        if (!updatedResult) return;

        state.lastBattleResult = updatedResult;

        state.lineInviteFriendCount = Number(
          updatedResult.lineInviteFriendCount ??
          getLineInviteFriendCount() ??
          0
        );

        try {
          localStorage.setItem(STORAGE.lastResult, JSON.stringify(updatedResult));
        } catch (error) {}

        renderFriendRank(updatedResult);
forceResultVisible();
forceRankListScrollable();


        track("result_friend_rank_loaded", {
          result: resultType,
          finish: finishType,
          points,
          score: Number(updatedResult.score || 0),
          lineInviteFriendCount: state.lineInviteFriendCount,
          friendRankCount: Array.isArray(updatedResult.friendRank)
            ? updatedResult.friendRank.length
            : 0
        });
      })
      .catch((error) => {
        console.warn("[ZELO GAME] hydrateResultFriendRank failed:", error);

        track("result_friend_rank_load_failed", {
          result: resultType,
          finish: finishType,
          points,
          score: Number(result.score || 0),
          message: String(error && error.message ? error.message : error)
        });

        forceResultVisible();
      });
  }

  track("result_view", {
    result: resultType,
    finish: finishType,
    points,
    score: Number(result.score || 0),
    couponCode: coupon,
    lineInviteFriendCount: result.lineInviteFriendCount,
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
  document.documentElement.style.setProperty(
    "--zg-safe-width",
    `${Math.max(320, appWidth)}px`
  );

  const narrow = appWidth <= 430;
  const compact = appHeight < 860 || narrow;
  const veryCompact = appHeight < 740 || appWidth <= 375;

  /*
   * 這版重點：
   * 1. 上方陀螺稍微保留視覺
   * 2. 標題變小且可換行
   * 3. 排行榜列放鬆
   */
  const topWrapH = veryCompact ? 156 : compact ? 174 : 196;
  const topSize = veryCompact ? 138 : compact ? 158 : 184;

  const statW = veryCompact ? 96 : compact ? 116 : 140;
  const statH = veryCompact ? 38 : compact ? 42 : 46;

  const titleSize = veryCompact ? 23 : compact ? 26 : 31;
  const messageSize = veryCompact ? 13 : compact ? 15 : 17;

  const couponMinH = veryCompact ? 126 : compact ? 140 : 156;
  const couponPad = veryCompact
    ? "13px 18px"
    : compact
      ? "15px 20px"
      : "18px 22px";

  const couponCodeSize = veryCompact ? 28 : compact ? 32 : 38;
  const couponCopyH = veryCompact ? 42 : compact ? 48 : 54;
  const couponCopySize = veryCompact ? 14 : compact ? 16 : 18;

  /*
   * 排行榜放鬆一點：
   * 不要像截圖那樣所有東西擠在一起。
   */
 const rankPad = veryCompact
  ? "12px 14px 14px"
  : compact
    ? "14px 16px 16px"
    : "16px 16px 18px";

const rankTitleSize = veryCompact ? 18 : compact ? 20 : 22;

/*
 * 排行榜每列稍微加高，讓上下不要太擠。
 */
const rankRowH = veryCompact ? 54 : compact ? 60 : 66;

const rankMedalSize = veryCompact ? 30 : compact ? 34 : 36;
const rankAvatarSize = veryCompact ? 26 : compact ? 28 : 30;

/*
 * 列與列之間的縫隙。
 */
const rankRowGap = veryCompact ? 6 : compact ? 7 : 8;


  const btnH = veryCompact ? 48 : compact ? 52 : 56;
  const btnSize = veryCompact ? 15 : compact ? 17 : 19;

  const mainGap = veryCompact ? 7 : compact ? 8 : 10;

  const mainPad = veryCompact
    ? "8px 12px calc(env(safe-area-inset-bottom, 0px) + 14px)"
    : compact
      ? "10px 12px calc(env(safe-area-inset-bottom, 0px) + 16px)"
      : "12px 18px calc(env(safe-area-inset-bottom, 0px) + 18px)";

  const set = (el, prop, value) => {
    if (!el) return;
    el.style.setProperty(prop, value, "important");
  };

  const clear = (el, props) => {
    if (!el) return;

    props.forEach((prop) => {
      try {
        el.style.removeProperty(prop);
      } catch (error) {}
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

    set(root, "width", "var(--zg-app-width, 100vw)");
    set(root, "min-width", "var(--zg-app-width, 100vw)");
    set(root, "max-width", "var(--zg-app-width, 100vw)");

    set(root, "height", "var(--zg-app-height, 100vh)");
    set(root, "min-height", "var(--zg-app-height, 100vh)");
    set(root, "max-height", "var(--zg-app-height, 100vh)");

    set(root, "margin", "0");
    set(root, "padding", "0");
    set(root, "overflow", "hidden");
    set(root, "box-sizing", "border-box");
    set(root, "z-index", "999999");
    set(root, "background", "#101426");
    set(root, "transform", "none");
  }

  /*
   * Result screen
   */
  resultScreen.hidden = false;
  resultScreen.removeAttribute("hidden");
  resultScreen.classList.add("active", "is-active", "zg-result-classic-screen");
  resultScreen.classList.remove("zg-result-onepage-screen");
  resultScreen.setAttribute("aria-hidden", "false");

  set(resultScreen, "position", "fixed");
  set(resultScreen, "inset", "0 auto auto 0");
  set(resultScreen, "left", "0");
  set(resultScreen, "top", "0");
  set(resultScreen, "right", "auto");
  set(resultScreen, "bottom", "auto");

  set(resultScreen, "width", "var(--zg-app-width, 100vw)");
  set(resultScreen, "min-width", "var(--zg-app-width, 100vw)");
  set(resultScreen, "max-width", "var(--zg-app-width, 100vw)");

  set(resultScreen, "height", "var(--zg-app-height, 100vh)");
  set(resultScreen, "min-height", "var(--zg-app-height, 100vh)");
  set(resultScreen, "max-height", "var(--zg-app-height, 100vh)");

  set(resultScreen, "display", "flex");
  set(resultScreen, "visibility", "visible");
  set(resultScreen, "opacity", "1");
  set(resultScreen, "pointer-events", "auto");
  set(resultScreen, "overflow", "hidden");
  set(resultScreen, "box-sizing", "border-box");
  set(resultScreen, "transform", "none");

  /*
   * Main
   */
  const main = $(".zg-result-main", resultScreen);

  if (main) {
    main.classList.add("zg-result-classic-main");
    main.classList.remove("zg-result-onepage-main");

    set(main, "position", "relative");
    set(main, "width", "100%");
    set(main, "min-width", "0");
    set(main, "max-width", "100%");

    set(main, "height", "100%");
    set(main, "min-height", "0");
    set(main, "max-height", "100%");

    set(main, "display", "flex");
    set(main, "flex-direction", "column");
    set(main, "align-items", "stretch");
    set(main, "justify-content", "flex-start");
    set(main, "gap", `${mainGap}px`);
    set(main, "padding", mainPad);

    set(main, "overflow-y", "auto");
    set(main, "overflow-x", "hidden");
    set(main, "-webkit-overflow-scrolling", "touch");
    set(main, "overscroll-behavior", "contain");
    set(main, "box-sizing", "border-box");
    set(main, "transform", "none");

    set(
      main,
      "background",
      "radial-gradient(circle at 50% 18%, rgba(108,121,170,.42), transparent 34%), linear-gradient(180deg, #17182a 0%, #111527 48%, #081321 100%)"
    );

    clear(main, [
      "grid-template-columns",
      "grid-template-rows",
      "align-content",
      "justify-items"
    ]);
  }

  /*
   * 清除 onepage 殘留
   */
  const friendRank = $("#zg-friend-rank", resultScreen);

  if (friendRank) {
    friendRank.classList.remove("zg-friend-onepage-card");
    friendRank.classList.add("zg-rank-classic-card");
  }

  const oldInvite = $(".zg-invite-onepage-card", resultScreen);

  if (oldInvite) {
    set(oldInvite, "display", "none");
  }

  const oldRankScroll = $(".zg-rank-scroll-card", resultScreen);

  if (oldRankScroll) {
    oldRankScroll.classList.add("zg-rank-classic-card");
  }

  /*
   * Hero
   */
  const hero =
    $(".zg-result-hero-card", resultScreen) ||
    $(".zg-result-battle-summary", resultScreen);

  if (hero) {
    hero.classList.add("zg-result-hero-card");
    hero.classList.remove("zg-result-battle-summary");

    set(hero, "display", "flex");
    set(hero, "flex-direction", "column");
    set(hero, "align-items", "center");
    set(hero, "justify-content", "flex-start");

    set(hero, "width", "100%");
    set(hero, "min-width", "0");
    set(hero, "max-width", "100%");

    set(hero, "height", "auto");
    set(hero, "min-height", "0");
    set(hero, "max-height", "none");

    set(hero, "padding", "0");
    set(hero, "margin", "0");
    set(hero, "overflow", "visible");
    set(hero, "box-sizing", "border-box");

    clear(hero, [
      "grid-template-columns",
      "grid-template-rows",
      "align-content",
      "justify-items"
    ]);
  }

  /*
   * Top wrap
   */
  const topWrap = $(".zg-result-top-wrap", resultScreen);

  if (topWrap) {
    set(topWrap, "position", "relative");
    set(topWrap, "display", "grid");
    set(
      topWrap,
      "grid-template-columns",
      "minmax(0, 1fr) auto minmax(0, 1fr)"
    );
    set(topWrap, "align-items", "center");
    set(topWrap, "justify-items", "center");

    set(topWrap, "width", "100%");
    set(topWrap, "height", `${topWrapH}px`);
    set(topWrap, "min-height", `${topWrapH}px`);
    set(topWrap, "max-height", `${topWrapH}px`);

    set(topWrap, "overflow", "visible");
    set(topWrap, "box-sizing", "border-box");
  }

  const topStage = $(".zg-result-top-stage", resultScreen);

  if (topStage) {
    set(topStage, "grid-column", topWrap ? "2" : "auto");
    set(topStage, "display", "flex");
    set(topStage, "align-items", "center");
    set(topStage, "justify-content", "center");
    set(topStage, "position", "relative");

    set(topStage, "width", `${topSize}px`);
    set(topStage, "height", `${topSize}px`);
    set(topStage, "min-width", `${topSize}px`);
    set(topStage, "min-height", `${topSize}px`);

    set(topStage, "overflow", "visible");
    set(topStage, "box-sizing", "border-box");

    clear(topStage, [
      "grid-template-columns",
      "grid-template-rows"
    ]);
  }

const image = $("#zg-result-top-image", resultScreen);

if (image) {
  set(image, "display", "block");
  set(image, "visibility", "visible");
  set(image, "opacity", "1");

  set(image, "width", `${topSize}px`);
  set(image, "height", `${topSize}px`);
  set(image, "max-width", `${topSize}px`);
  set(image, "max-height", `${topSize}px`);

  set(image, "object-fit", "contain");
  set(image, "margin", "0");
  set(image, "position", "relative");
  set(image, "z-index", "2");
  set(image, "pointer-events", "none");
  set(image, "user-select", "none");
  set(image, "-webkit-user-drag", "none");

  /*
   * 不在 JS 寫死 filter / animation。
   * 交給 CSS 的 RESULT TOP ENERGY VISUAL PATCH 控制：
   * - 慢速旋轉
   * - 能量光暈
   * - 金綠色發光
   */

  image.setAttribute("draggable", "false");

  clear(image, [
    "grid-column",
    "grid-row",
    "filter",
    "animation",
    "transform"
  ]);
}

  /*
   * Side stats
   */
  $$(".zg-result-side-stats", resultScreen).forEach((box) => {
    set(box, "display", "flex");
    set(box, "flex-direction", "column");
    set(box, "gap", veryCompact ? "8px" : "10px");

    set(box, "width", `${statW}px`);
    set(box, "min-width", `${statW}px`);
    set(box, "max-width", `${statW}px`);

    set(box, "z-index", "3");
    set(box, "box-sizing", "border-box");
  });

  const leftStats = $(".zg-result-side-stats-left", resultScreen);
  const rightStats = $(".zg-result-side-stats-right", resultScreen);

  if (leftStats) {
    set(leftStats, "grid-column", "1");
    set(leftStats, "justify-self", "start");
  }

  if (rightStats) {
    set(rightStats, "grid-column", "3");
    set(rightStats, "justify-self", "end");
  }

$$(".zg-result-stat-card", resultScreen).forEach((card) => {
  set(card, "display", "flex");
  set(card, "flex-direction", "column");
  set(card, "align-items", "center");
  set(card, "justify-content", "center");

  set(card, "height", `${statH}px`);
  set(card, "min-height", `${statH}px`);
  set(card, "max-height", `${statH}px`);

  set(card, "padding", "5px 8px");
  set(card, "border-radius", "12px");

  /*
   * 不在 JS 寫死 background / border / box-shadow。
   * 交給 CSS 的 RESULT TOP ENERGY VISUAL PATCH 控制科技 HUD。
   */

  clear(card, [
    "background",
    "border",
    "box-shadow",
    "backdrop-filter",
    "-webkit-backdrop-filter"
  ]);

  set(card, "box-sizing", "border-box");
  set(card, "overflow", "hidden");
});


  $$(".zg-result-stat-card span", resultScreen).forEach((el) => {
    set(el, "display", "block");
    set(el, "font-size", veryCompact ? "8px" : "9px");
    set(el, "line-height", "1.1");
    set(el, "font-weight", "800");
    set(el, "color", "rgba(255,255,255,.72)");
    set(el, "white-space", "nowrap");
  });

  $$(".zg-result-stat-card strong", resultScreen).forEach((el) => {
    set(el, "display", "block");
    set(el, "margin-top", "3px");
    set(el, "font-size", veryCompact ? "14px" : "16px");
    set(el, "line-height", "1");
    set(el, "font-weight", "950");
    set(el, "color", "#fff");
    set(el, "white-space", "nowrap");
  });

  /*
   * Title block
   */
  const titleBlock = $(".zg-result-title-block", resultScreen);
  const title = $("#zg-result-title", resultScreen);
  const message = $("#zg-result-message", resultScreen);
  const badge = $("#zg-result-badge", resultScreen);

  if (badge) {
    set(badge, "display", "none");
  }

  if (titleBlock) {
    set(titleBlock, "display", "flex");
    set(titleBlock, "flex-direction", "column");
    set(titleBlock, "align-items", "center");
    set(titleBlock, "justify-content", "center");

    set(titleBlock, "width", "100%");
    set(titleBlock, "margin", veryCompact ? "0" : "2px 0 0");
    set(titleBlock, "text-align", "center");
    set(titleBlock, "box-sizing", "border-box");
    set(titleBlock, "overflow", "visible");
  }

  /*
   * 重點修正：
   * 勝利標題不可 nowrap，讓它可以正常換行，不再壓字。
   */
  if (title) {
    set(title, "display", "block");
    set(title, "width", "100%");
    set(title, "max-width", "100%");
    set(title, "margin", "0");
    set(title, "padding", "0 4px");

    set(title, "font-size", `${titleSize}px`);
    set(title, "line-height", "1.12");
    set(title, "font-weight", "950");
    set(title, "letter-spacing", "-0.045em");
    set(title, "color", "#fff");
    set(title, "text-align", "center");
    set(title, "text-shadow", "0 2px 12px rgba(0,0,0,.42)");

    set(title, "white-space", "normal");
    set(title, "overflow", "visible");
    set(title, "text-overflow", "clip");
    set(title, "word-break", "keep-all");
    set(title, "overflow-wrap", "normal");
    set(title, "box-sizing", "border-box");
  }

  if (message) {
    set(message, "display", "block");
    set(message, "width", "100%");
    set(message, "margin", veryCompact ? "4px 0 0" : "5px 0 0");
    set(message, "padding", "0");

    set(message, "font-size", `${messageSize}px`);
    set(message, "line-height", "1.18");
    set(message, "font-weight", "850");
    set(message, "color", "rgba(255,255,255,.78)");
    set(message, "text-align", "center");
    set(message, "white-space", "nowrap");
  }

  /*
   * Coupon
   */
  const coupon = $("#zg-coupon-card", resultScreen);

  if (coupon) {
    coupon.classList.add("zg-coupon-classic-card");

    set(coupon, "display", "flex");
    set(coupon, "flex-direction", "column");
    set(coupon, "align-items", "center");
    set(coupon, "justify-content", "center");

    set(coupon, "width", "100%");
    set(coupon, "min-width", "0");
    set(coupon, "max-width", "100%");

    set(coupon, "min-height", `${couponMinH}px`);
    set(coupon, "height", "auto");
    set(coupon, "max-height", "none");

    set(coupon, "padding", couponPad);
    set(coupon, "border-radius", "18px");

    set(
      coupon,
      "background",
      "linear-gradient(120deg, #fff8c7 0%, #ffe26b 38%, #ffae18 100%)"
    );

    set(
      coupon,
      "box-shadow",
      "0 16px 32px rgba(0,0,0,.32), inset 0 2px 0 rgba(255,255,255,.65)"
    );

    set(coupon, "border", "1px solid rgba(255,255,255,.55)");
    set(coupon, "color", "#1d1605");
    set(coupon, "box-sizing", "border-box");
    set(coupon, "overflow", "hidden");

    clear(coupon, [
      "grid-template-columns",
      "grid-template-rows"
    ]);
  }

  const couponLabel = $("#zg-coupon-label", resultScreen);
  const couponCode = $("#zg-coupon-code", resultScreen);
  const couponDesc = $("#zg-coupon-desc", resultScreen);
  const couponCopy = $(".zg-coupon-copy", resultScreen);

  if (couponLabel) {
    set(couponLabel, "display", "block");
    set(couponLabel, "font-size", veryCompact ? "13px" : compact ? "14px" : "15px");
    set(couponLabel, "line-height", "1.15");
    set(couponLabel, "font-weight", "900");
    set(couponLabel, "text-align", "center");
    set(couponLabel, "white-space", "nowrap");
    set(couponLabel, "max-width", "100%");
    set(couponLabel, "overflow", "hidden");
    set(couponLabel, "text-overflow", "ellipsis");
  }

  if (couponCode) {
    set(couponCode, "display", "block");
    set(couponCode, "margin", veryCompact ? "4px 0 3px" : "5px 0 4px");
    set(couponCode, "font-size", `${couponCodeSize}px`);
    set(couponCode, "line-height", ".95");
    set(couponCode, "font-weight", "1000");
    set(couponCode, "letter-spacing", "-0.045em");
    set(couponCode, "text-align", "center");
    set(couponCode, "white-space", "nowrap");
    set(couponCode, "max-width", "100%");
    set(couponCode, "overflow", "hidden");
    set(couponCode, "text-overflow", "ellipsis");
  }

  if (couponDesc) {
    set(couponDesc, "display", "block");
    set(couponDesc, "font-size", veryCompact ? "11px" : compact ? "12px" : "13px");
    set(couponDesc, "line-height", "1.15");
    set(couponDesc, "font-weight", "800");
    set(couponDesc, "text-align", "center");
    set(couponDesc, "white-space", "nowrap");
    set(couponDesc, "max-width", "100%");
    set(couponDesc, "overflow", "hidden");
    set(couponDesc, "text-overflow", "ellipsis");
  }

  if (couponCopy) {
    couponCopy.classList.add("zg-coupon-classic-copy");

    set(couponCopy, "display", "flex");
    set(couponCopy, "align-items", "center");
    set(couponCopy, "justify-content", "center");

    set(couponCopy, "width", "100%");
    set(couponCopy, "height", `${couponCopyH}px`);
    set(couponCopy, "min-height", `${couponCopyH}px`);
    set(couponCopy, "max-height", `${couponCopyH}px`);

    set(
      couponCopy,
      "margin",
      veryCompact ? "9px 0 0" : compact ? "11px 0 0" : "13px 0 0"
    );

    set(couponCopy, "border-radius", "15px");
    set(couponCopy, "border", "0");
    set(couponCopy, "background", "linear-gradient(180deg, #fffef4, #fff0a5)");

    set(
      couponCopy,
      "box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.75), 0 8px 18px rgba(0,0,0,.12)"
    );

    set(couponCopy, "color", "#1d1605");
    set(couponCopy, "font-size", `${couponCopySize}px`);
    set(couponCopy, "font-weight", "950");
    set(couponCopy, "white-space", "nowrap");
    set(couponCopy, "pointer-events", "auto");
    set(couponCopy, "box-sizing", "border-box");
    set(couponCopy, "overflow", "hidden");
    set(couponCopy, "text-overflow", "ellipsis");
  }

  /*
   * Rank card
   */
  const rankCard =
    $("#zg-friend-rank", resultScreen) ||
    $(".zg-rank-classic-card", resultScreen) ||
    $(".zg-rank-scroll-card", resultScreen);

  if (rankCard) {
    rankCard.classList.add("zg-rank-classic-card");
    rankCard.classList.remove("zg-friend-onepage-card");

    set(rankCard, "width", "100%");
    set(rankCard, "min-width", "0");
    set(rankCard, "max-width", "100%");

    set(rankCard, "display", "flex");
    set(rankCard, "flex-direction", "column");

    set(rankCard, "height", "auto");
    set(rankCard, "min-height", "0");
    set(rankCard, "max-height", "none");

    set(rankCard, "padding", rankPad);
    set(rankCard, "border-radius", "18px");

    set(
      rankCard,
      "background",
      "linear-gradient(180deg, rgba(63,70,89,.8), rgba(34,42,60,.72))"
    );

    set(rankCard, "border", "1px solid rgba(255,255,255,.14)");

    set(
      rankCard,
      "box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.1), 0 14px 26px rgba(0,0,0,.28)"
    );

    set(rankCard, "box-sizing", "border-box");
    set(rankCard, "overflow", "hidden");

    clear(rankCard, [
      "grid-template-columns",
      "grid-template-rows"
    ]);
  }

  const rankHead =
    $(".zg-rank-classic-head", resultScreen) ||
    $(".zg-rank-scroll-head", resultScreen);

  if (rankHead) {
    set(rankHead, "display", "flex");
    set(rankHead, "align-items", "center");
    set(rankHead, "justify-content", "center");

    set(rankHead, "width", "100%");
    set(rankHead, "height", "auto");
    set(rankHead, "min-height", "0");
  }

  const rankTitle = $(".zg-rank-title", resultScreen);

  if (rankTitle) {
  set(rankTitle, "display", "block");
  set(rankTitle, "margin", veryCompact ? "0 0 12px" : "0 0 14px");
  set(rankTitle, "font-size", `${rankTitleSize}px`);
  set(rankTitle, "line-height", "1");
  set(rankTitle, "font-weight", "950");
  set(rankTitle, "color", "#fff");
  set(rankTitle, "text-align", "center");
}


const rankList = $("#zg-rank-list", resultScreen);

if (rankList) {
  rankList.classList.add("zg-rank-classic-list");

  set(rankList, "display", "flex");
  set(rankList, "flex-direction", "column");
  set(rankList, "gap", `${rankRowGap}px`);

  set(rankList, "width", "100%");
  set(rankList, "height", "auto");
  set(rankList, "min-height", "0");

  const rowCount = rankList.querySelectorAll(".zg-rank-item").length;

  const maxRankHeight =
    rowCount <= 3
      ? "none"
      : veryCompact
        ? "210px"
        : compact
          ? "260px"
          : "340px";

  set(rankList, "max-height", maxRankHeight);

  if (rowCount <= 3) {
    set(rankList, "overflow-y", "visible");
  } else {
    set(rankList, "overflow-y", "auto");
  }

  set(rankList, "overflow-x", "hidden");
  set(rankList, "-webkit-overflow-scrolling", "touch");
  set(rankList, "overscroll-behavior-y", "contain");
  set(rankList, "overscroll-behavior-x", "none");
  set(rankList, "touch-action", "pan-y");

  set(rankList, "border-radius", "14px");
  set(rankList, "padding-right", "2px");
  set(rankList, "box-sizing", "border-box");
}


  /*
   * Rank rows：四欄
   * 排名 / 頭像 / 名稱與標籤 / 分數
   */
  $$(".zg-rank-classic-item, .zg-rank-item", resultScreen).forEach((item) => {
  item.classList.add("zg-rank-classic-item");

  set(item, "display", "grid");
  set(item, "grid-template-columns", "42px 32px minmax(0, 1fr) auto");
  set(item, "align-items", "center");
  set(item, "gap", veryCompact ? "7px" : "9px");

  /*
   * 每列加高，解決上下太擠。
   */
  set(item, "height", `${rankRowH}px`);
  set(item, "min-height", `${rankRowH}px`);
  set(item, "max-height", `${rankRowH}px`);

  /*
   * 上下 padding 雖然 grid row 有高度，
   * 但加一點 padding 視覺會比較不擠。
   */
  set(item, "padding", veryCompact ? "4px 12px" : "5px 14px");

  set(
    item,
    "background",
    "linear-gradient(180deg, rgba(72,82,105,.78), rgba(47,56,76,.78))"
  );

  /*
   * 有 gap 之後不需要 border-bottom，
   * 改成獨立卡片感。
   */
  set(item, "border-bottom", "0");
  set(item, "border-radius", "12px");
  set(item, "box-sizing", "border-box");
  set(item, "overflow", "hidden");

  set(
    item,
    "box-shadow",
    "inset 0 1px 0 rgba(255,255,255,.08), 0 4px 10px rgba(0,0,0,.12)"
  );
});

  /*
   * Rank medal
   */
  $$(".zg-rank-classic-medal, .zg-rank-medal", resultScreen).forEach((medal) => {
    medal.classList.add("zg-rank-classic-medal");

    set(medal, "display", "flex");
    set(medal, "align-items", "center");
    set(medal, "justify-content", "center");

    set(medal, "width", `${rankMedalSize}px`);
    set(medal, "min-width", `${rankMedalSize}px`);
    set(medal, "height", `${rankMedalSize}px`);
    set(medal, "min-height", `${rankMedalSize}px`);

    set(medal, "border-radius", "999px");
    set(medal, "background", "linear-gradient(180deg, #fff27a, #ffd74b)");
    set(medal, "color", "#26200a");
    set(medal, "font-size", veryCompact ? "16px" : "18px");
    set(medal, "font-weight", "950");
    set(medal, "line-height", "1");
    set(medal, "white-space", "nowrap");
  });

  /*
   * Rank avatar
   */
  $$(".zg-rank-classic-avatar, .zg-rank-avatar", resultScreen).forEach((avatar) => {
    avatar.classList.add("zg-rank-classic-avatar");

    set(avatar, "display", "flex");
    set(avatar, "align-items", "center");
    set(avatar, "justify-content", "center");

    set(avatar, "width", `${rankAvatarSize}px`);
    set(avatar, "min-width", `${rankAvatarSize}px`);
    set(avatar, "max-width", `${rankAvatarSize}px`);

    set(avatar, "height", `${rankAvatarSize}px`);
    set(avatar, "min-height", `${rankAvatarSize}px`);
    set(avatar, "max-height", `${rankAvatarSize}px`);

    set(avatar, "border-radius", "999px");
    set(avatar, "object-fit", "cover");
    set(avatar, "background", "rgba(255,255,255,.14)");
    set(avatar, "border", "1px solid rgba(255,255,255,.18)");
    set(avatar, "color", "#fff");
    set(avatar, "font-size", veryCompact ? "10px" : "11px");
    set(avatar, "font-weight", "900");
    set(avatar, "overflow", "hidden");
    set(avatar, "box-sizing", "border-box");
    set(avatar, "line-height", "1");
  });

  /*
   * Placeholder 頭像稍微淡一點
   */
  $$(".zg-rank-item.is-placeholder .zg-rank-avatar", resultScreen).forEach((avatar) => {
    set(avatar, "opacity", ".55");
  });

  /*
   * Rank player
   */
  $$(".zg-rank-classic-player, .zg-rank-player", resultScreen).forEach((player) => {
    player.classList.add("zg-rank-classic-player");

    set(player, "min-width", "0");
    set(player, "overflow", "hidden");
  });

  /*
   * Rank name row
   */
  $$(".zg-rank-name-row", resultScreen).forEach((row) => {
    set(row, "display", "flex");
    set(row, "align-items", "center");
    set(row, "gap", veryCompact ? "4px" : "5px");
    set(row, "min-width", "0");
    set(row, "max-width", "100%");
    set(row, "overflow", "hidden");
  });

  /*
   * Rank name
   */
  $$(".zg-rank-classic-name, .zg-rank-name", resultScreen).forEach((name) => {
    name.classList.add("zg-rank-classic-name");

    set(name, "min-width", "0");
    set(name, "max-width", "100%");
    set(name, "font-size", veryCompact ? "14px" : "16px");
    set(name, "font-weight", "900");
    set(name, "color", "#fff");
    set(name, "white-space", "nowrap");
    set(name, "overflow", "hidden");
    set(name, "text-overflow", "ellipsis");
    set(name, "line-height", "1.1");
  });

  $$(".zg-rank-name-empty", resultScreen).forEach((name) => {
    set(name, "display", "block");
    set(name, "width", "1px");
    set(name, "min-width", "1px");
    set(name, "max-width", "1px");
  });

  /*
   * Me badge
   */
  $$(".zg-rank-me-badge", resultScreen).forEach((badge) => {
    set(badge, "display", "inline-flex");
    set(badge, "align-items", "center");
    set(badge, "justify-content", "center");

    set(badge, "height", "16px");
    set(badge, "min-height", "16px");
    set(badge, "padding", "0 5px");
    set(badge, "border-radius", "999px");

    set(badge, "background", "#ffe05f");
    set(badge, "color", "#10172f");

    set(badge, "font-size", "9px");
    set(badge, "font-weight", "900");
    set(badge, "line-height", "16px");
    set(badge, "white-space", "nowrap");
    set(badge, "flex-shrink", "0");
  });

  /*
   * Best rank tag
   */
  $$(".zg-rank-best-tag", resultScreen).forEach((tag) => {
    set(tag, "display", "inline-flex");
    set(tag, "align-items", "center");
    set(tag, "justify-content", "center");

    set(tag, "height", "16px");
    set(tag, "min-height", "16px");
    set(tag, "padding", "0 5px");
    set(tag, "border-radius", "999px");

    set(tag, "background", "rgba(255,224,95,.18)");
    set(tag, "color", "#ffe05f");

    set(tag, "font-size", "9px");
    set(tag, "font-weight", "900");
    set(tag, "line-height", "16px");
    set(tag, "white-space", "nowrap");
    set(tag, "flex-shrink", "0");
  });

  /*
   * Rank score
   */
  $$(".zg-rank-classic-score, .zg-rank-score", resultScreen).forEach((score) => {
    score.classList.add("zg-rank-classic-score");

    set(score, "font-size", veryCompact ? "15px" : "18px");
    set(score, "font-weight", "950");
    set(score, "color", "#ffe05f");
    set(score, "white-space", "nowrap");
    set(score, "text-align", "right");
    set(score, "line-height", "1");
  });

  /*
   * Actions
   */
  const actions = $(".zg-result-actions", resultScreen);

  if (actions) {
    actions.classList.add("zg-result-actions-classic");
    actions.classList.remove("zg-result-actions-twoline", "zg-result-actions-oneline");

    set(actions, "display", "grid");
    set(actions, "grid-template-columns", "repeat(2, minmax(0, 1fr))");
    set(actions, "grid-template-rows", "auto auto");
    set(actions, "gap", veryCompact ? "9px" : "10px");

    set(actions, "width", "100%");
    set(actions, "min-width", "0");
    set(actions, "max-width", "100%");

    set(actions, "height", "auto");
    set(actions, "min-height", "0");
    set(actions, "max-height", "none");

    set(actions, "margin", veryCompact ? "4px 0 0" : "6px 0 0");
    set(actions, "padding", "0");

    set(actions, "position", "relative");
    set(actions, "left", "auto");
    set(actions, "right", "auto");
    set(actions, "bottom", "auto");

    set(actions, "z-index", "20");
    set(actions, "pointer-events", "auto");
    set(actions, "box-sizing", "border-box");
  }

  $$(".zg-result-actions .zg-btn", resultScreen).forEach((btn) => {
    set(btn, "display", "flex");
    set(btn, "align-items", "center");
    set(btn, "justify-content", "center");

    set(btn, "width", "100%");
    set(btn, "height", `${btnH}px`);
    set(btn, "min-height", `${btnH}px`);
    set(btn, "max-height", `${btnH}px`);

    set(btn, "padding", "0 10px");
    set(btn, "border-radius", "16px");

    set(btn, "font-size", `${btnSize}px`);
    set(btn, "font-weight", "950");
    set(btn, "line-height", "1");
    set(btn, "white-space", "nowrap");

    set(btn, "box-sizing", "border-box");
    set(btn, "pointer-events", "auto");
  });

  const labels = [
    ["restart", "再戰一次"],
    ["select", "更換陀螺"],
    ["share", "邀請好友"],
    ["home", "返回首頁"]
  ];

  labels.forEach(([action, label]) => {
    const btn = $(`[data-zg-action="${action}"]`, resultScreen);

    if (btn) {
      btn.textContent = label;
    }
  });

  const redBtn = $(".zg-btn-red", resultScreen);
  const blueBtn = $(".zg-btn-blue", resultScreen);
  const lineBtn = $(".zg-btn-line", resultScreen);
  const lightBtn = $(".zg-btn-light", resultScreen);

  if (redBtn) {
    set(redBtn, "background", "linear-gradient(180deg, #ff6384, #f00635)");
    set(redBtn, "color", "#fff");
    set(redBtn, "border", "0");
    set(redBtn, "box-shadow", "0 10px 20px rgba(240,6,53,.28)");
  }

  if (blueBtn) {
    set(blueBtn, "background", "linear-gradient(180deg, #58c7ff, #0578ff)");
    set(blueBtn, "color", "#fff");
    set(blueBtn, "border", "0");
    set(blueBtn, "box-shadow", "0 10px 20px rgba(5,120,255,.26)");
  }

  if (lineBtn) {
    set(lineBtn, "background", "linear-gradient(180deg, #58ec86, #04c855)");
    set(lineBtn, "color", "#fff");
    set(lineBtn, "border", "0");
    set(lineBtn, "box-shadow", "0 10px 20px rgba(4,200,85,.25)");
  }

  if (lightBtn) {
    set(lightBtn, "background", "linear-gradient(180deg, #ffffff, #dfe6f5)");
    set(lightBtn, "color", "#20283a");
    set(lightBtn, "border", "0");
    set(lightBtn, "box-shadow", "0 10px 20px rgba(0,0,0,.18)");
  }

  /*
   * 互動元素保險
   */
  $$(".zg-coupon-copy, [data-zg-action]", resultScreen).forEach((el) => {
    set(el, "pointer-events", "auto");
    set(el, "position", "relative");
    set(el, "z-index", "30");
  });
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

    setTimeout(() => {
      try {
        registerReferralIfNeeded("boot_no_liff");
      } catch (error) {}
    }, 300);

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
    window.ZELO_LINE_PROFILE = profile;

    try {
      localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
    } catch (error) {}

    track("liff_profile_loaded", {
      userId: profile.userId || "",
      displayName: profile.displayName || ""
    });

    try {
      await registerReferralIfNeeded("liff_profile_loaded");
    } catch (error) {
      console.warn("[ZELO GAME] registerReferralIfNeeded after profile failed:", error);
    }

    try {
      await registerReferralFromUrl();
    } catch (error) {}

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


  function restartFromResult() {
  if (shouldIgnoreRepeatedAction("restart", 500)) return;

  track("restart_from_result", {
    source: "result_page",
    lastResult: state.lastBattleResult?.result || "",
    lastScore:
      Number(
        state.lastBattleResult?.score ??
        state.lastBattleResult?.points ??
        0
      ) || 0
  });

  stopBattle();
  cancelChargeLoop();

  state.pendingResult = null;
  state.finishing = false;
  state.resultLogged = false;

  beginChargeBattle();
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

async function handleShare() {
  const result =
    state.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
    {};

  const profilePayload = getProfilePayload();
  const referralUrl = buildReferralUrl();
  const myReferralCode = getMyReferralCode();

  const points = Number(result.points || result.score || 0) || 0;

  const playerName =
    profilePayload.displayName ||
    result.playerName ||
    getPlayerName() ||
    "好友";

  const shareText =
    `${playerName} 邀請你來挑戰 ZELO GAME！\n\n` +
    `我剛剛拿到 ${points} 分，你也來挑戰看看！\n\n` +
    `點擊進入 LINE LIFF 遊戲：\n${referralUrl}`;

  track("liff_share_click", {
    source: "result_share_button",
    referralCode: myReferralCode,
    referralUrl,
    userId: profilePayload.userId,
    lineUserId: profilePayload.lineUserId,
    playerName,
    points,
    hasLiff: !!window.liff,
    isInClient:
      !!(
        window.liff &&
        typeof window.liff.isInClient === "function" &&
        window.liff.isInClient()
      )
  });

  /*
   * 如果 LIFF SDK 不存在：
   * - 不直接報錯
   * - 讓使用者知道要在 LINE App / LIFF 環境開啟
   */
  if (!window.liff) {
    alert("請在 LINE App 內開啟遊戲，才能邀請 LINE 好友。");

    track("liff_share_blocked", {
      reason: "liff_sdk_missing",
      referralCode: myReferralCode,
      referralUrl
    });

    return;
  }

  /*
   * 若尚未登入 LIFF：
   * 不指定 redirectUri，避免 LINE OAuth Invalid redirect_uri。
   * redirect 交給 LIFF App Endpoint 處理。
   */
  if (
    typeof window.liff.isLoggedIn === "function" &&
    !window.liff.isLoggedIn()
  ) {
    try {
      window.liff.login();
    } catch (error) {
      console.warn("[ZELO GAME] liff.login failed:", error);

      track("liff_login_failed_before_share", {
        referralCode: myReferralCode,
        referralUrl,
        message: String(error && error.message ? error.message : error)
      });

      alert("LINE 登入失敗，請重新開啟遊戲後再試。");
    }

    return;
  }

  /*
   * 需要在 LINE App 內才能使用好友選擇分享。
   */
  if (
    typeof window.liff.isInClient === "function" &&
    !window.liff.isInClient()
  ) {
    alert("請在 LINE App 內開啟遊戲，才能邀請 LINE 好友。");

    track("liff_share_blocked", {
      reason: "not_in_line_client",
      referralCode: myReferralCode,
      referralUrl
    });

    return;
  }

  const canUseShareTargetPicker =
    typeof window.liff.shareTargetPicker === "function" &&
    (
      typeof window.liff.isApiAvailable !== "function" ||
      window.liff.isApiAvailable("shareTargetPicker")
    );

  if (!canUseShareTargetPicker) {
    alert("目前 LINE 版本不支援好友選擇分享，請更新 LINE App 後再試。");

    track("liff_share_blocked", {
      reason: "share_target_picker_unavailable",
      referralCode: myReferralCode,
      referralUrl
    });

    return;
  }

  try {
    const shareResult = await window.liff.shareTargetPicker([
      {
        type: "text",
        text: shareText
      }
    ]);

    console.log("[ZELO GAME] shareTargetPicker result:", shareResult);

    if (shareResult) {
      track("liff_share_sent", {
        source: "line_liff_share_target_picker",
        referralCode: myReferralCode,
        referralUrl,
        userId: profilePayload.userId,
        lineUserId: profilePayload.lineUserId,
        playerName,
        shareResult: JSON.stringify(shareResult)
      });

      showToast("LINE 邀請已送出。好友點開 LIFF 後才會增加成功邀請人數。");
    } else {
      track("liff_share_cancelled", {
        source: "line_liff_share_target_picker",
        referralCode: myReferralCode,
        referralUrl
      });

      showToast("尚未送出邀請。");
    }
  } catch (error) {
    console.warn("[ZELO GAME] shareTargetPicker failed:", error);

    track("liff_share_failed", {
      source: "line_liff_share_target_picker",
      referralCode: myReferralCode,
      referralUrl,
      message: String(error && error.message ? error.message : error)
    });

    alert("LINE 好友邀請失敗，請再試一次。");
  }
}


function bindGlobalEvents() {
  if (state.globalBound) return;

  state.globalBound = true;

  /*
   * 全域 data-zg-action 點擊事件
   */
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

  /*
   * 陀螺卡片選擇
   */
  document.addEventListener(
    "click",
    (event) => {
      const card = event.target.closest(".zg-top-card");

      if (!card) return;

      if (card.classList.contains("zg-secret-top-card")) return;
      if (card.disabled) return;
      if (card.getAttribute("aria-disabled") === "true") return;

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

  /*
   * 鍵盤事件：ESC / Space 蓄力
   */
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
       * 電腦版支援空白鍵蓄力
       */
      if (key === " " || key === "Spacebar") {
        const battle = screenBattle();
        const btn = battle ? $(".zg-charge-btn", battle) : null;

        if (!btn) return;
        if (btn.disabled) return;
        if (!state.launchReady) return;
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

  /*
   * 頁面切到背景時暫停
   */
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
        return;
      }

      if (state.running && state.battle) {
        state.paused = false;
        state.lastFrame = 0;
        Sound.resume();

        if (!state.raf) {
          state.raf = requestAnimationFrame(battleLoop);
        }
      }
    },
    false
  );

  /*
   * 離開頁面清理
   */
  window.addEventListener("pagehide", () => {
    cancelChargeLoop();
    stopBattle();
    Sound.stopHum();
  });

  window.addEventListener("beforeunload", () => {
    cancelChargeLoop();
    Sound.stopHum();
  });

  /*
   * 視窗尺寸變更
   */
  window.addEventListener(
    "resize",
    () => {
      if (state.screen === "result") {
        forceResultVisible();
        forceRankListScrollable();

        setTimeout(forceResultVisible, 120);
        setTimeout(forceRankListScrollable, 160);
      }

      if (state.screen === "select") {
        forceSelectScrollable();
        setTimeout(forceSelectScrollable, 120);
      }
    },
    {
      passive: true
    }
  );

  /*
   * 轉向
   */
  window.addEventListener(
    "orientationchange",
    () => {
      if (state.screen === "result") {
        setTimeout(forceResultVisible, 80);
        setTimeout(forceRankListScrollable, 120);

        setTimeout(forceResultVisible, 260);
        setTimeout(forceRankListScrollable, 300);

        setTimeout(forceResultVisible, 600);
        setTimeout(forceRankListScrollable, 660);
      }

      if (state.screen === "select") {
        setTimeout(forceSelectScrollable, 80);
        setTimeout(forceSelectScrollable, 260);
        setTimeout(forceSelectScrollable, 600);
      }
    },
    {
      passive: true
    }
  );

  /*
   * visualViewport：手機 / LINE WebView 高度修正
   */
  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      () => {
        if (state.screen === "result") {
          forceResultVisible();
          forceRankListScrollable();
        }

        if (state.screen === "select") {
          forceSelectScrollable();
        }
      },
      {
        passive: true
      }
    );

    window.visualViewport.addEventListener(
      "scroll",
      () => {
        if (state.screen === "result") {
          forceResultVisible();
          forceRankListScrollable();
        }

        if (state.screen === "select") {
          forceSelectScrollable();
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

initLiffProfile()
  .then((profile) => {
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

    return registerReferralIfNeeded("boot_after_profile");
  })
  .then(() => {
    return syncReferralSuccessCount("boot_after_profile");
  })
  .then((count) => {
    state.lineInviteFriendCount = count;
  })
  .catch((error) => {
    console.warn("[ZELO GAME] referral boot flow failed:", error);

    track("referral_boot_flow_failed", {
      message: String(error && error.message ? error.message : error)
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

    getProfile: getProfile,
    getProfilePayload: getProfilePayload,
    getCurrentLinePlayer: getCurrentLinePlayer,
    syncResultWithLineOnce: syncResultWithLineOnce,
    buildLineResultPayload: buildLineResultPayload,

    getReferralCode: getMyReferralCode,
    buildReferralUrl: buildReferralUrl,
    syncReferralSuccessCount: syncReferralSuccessCount,
    registerReferralIfNeeded: registerReferralIfNeeded,
    registerReferralFromUrl: registerReferralFromUrl,
loadFriendRankFromServer: loadFriendRankFromServer,
hydrateResultFriendRank: hydrateResultFriendRank,


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
    launchReady: state.launchReady,
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

