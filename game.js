/*
 * =========================================================
 * ZELO GAME JS
 * Structured Page Version
 * Version: 202607200132-liff-redirect-rank-fix
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
 * 10. DAILY LIMIT / 每日限制
 * 11. LIFF / Profile Integration
 * 12. TRACKING / Analytics
 * 13. GLOBAL EVENTS / 全域事件
 * 14. APP BOOTSTRAP / 啟動
 *
 * Fixes:
 * - 修正 LINE OAuth Invalid redirect_uri：
 *   所有 liff.login() 不再使用 redirectUri: window.location.href。
 * - 統一 GAS URL 由 window.ZELO_GOOGLE_RECORD_API / window.GOOGLE_SCRIPT_URL 注入。
 * - 結果頁先 syncResult，再 hydrate friendRank，避免排行榜抓到舊分數。
 * - friendRank payload 補 ownerReferralCode / myReferralCode / ownerLineUserId。
 * - renderFriendRank 自己分數以本次結果優先，不被 server 0 分覆蓋。
 * - buildLineResultPayload 不再把 ZG referral code 塞進 inviterId/referrerId/fromUserId。
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

  const VERSION = "202607200132-liff-redirect-rank-fix";

  console.log("[ZELO GAME] version:", VERSION);

  const BG_IMAGE_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const EXTERNAL_TOP_PHOTO_URL =
    "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  /*
   * GAS URL 優先序：
   * 1. Liquid 注入 window.ZELO_GOOGLE_RECORD_API
   * 2. Liquid 注入 window.GOOGLE_SCRIPT_URL
   * 3. fallback 最新 GAS URL
   */
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

      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_b1c5de32-8300-416d-b7c1-5083fea27f6d.png?v=1784147189",

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

      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=1784129801",

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

      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_8f8d7d00-b8ff-4c2d-b193-e2f32f164723.png?v=1784147188",

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

      image:
        "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell_34b25e4e-b5f7-4b0e-8cd4-4fb160caff33.png?v=1784147180",

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
    launchReady: false,
    launchCountdownToken: 0,
    launchPower: 0,
    chargeDir: 1,
    chargeRaf: null,

    lastCouponReward: null,
    lastBattleResult: null,

    playsUsed: 0,
    remainingPlays: DAILY_LIMIT,

    resultLogged: false,

    eventsBound: false,
    booted: false,

    lastActionAt: 0,
    lastActionKey: "",

    lineInviteFriendCount: 0,
    globalBound: false
  };

  const LINE_INVITE_FRIEND_COUNT_KEY = "zg_line_invite_friend_count";

  const REFERRAL = {
    codeKey: "zg_referral_code",
    inviterCodeKey: "zg_inviter_referral_code",
    registeredKeyPrefix: "zg_ref_registered_",
    countFallbackKey: "zg_referral_success_count"
  };

  /*
   * =========================================================
   * 01-1. Referral / Invite Local Helpers
   * =========================================================
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

  /*
   * 本地 referral code。
   * 注意：
   * 後端 GAS 也會產生穩定 referralCode。
   * 目前前端保留本地 code 以相容舊邀請連結。
   */
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

  function getReferralCodeFromUrl() {
    try {
      const readFromParams = (params) => {
        if (!params) return "";

        /*
         * 先讀 ref / referralCode / invite。
         * inviterId 通常是 LINE userId，不能優先當 referral code。
         */
        return (
          params.get("ref") ||
          params.get("referralCode") ||
          params.get("invite") ||
          params.get("inviterReferralCode") ||
          params.get("ownerReferralCode") ||
          params.get("inviterCode") ||
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

  function buildQuery(params = {}) {
    return Object.keys(params)
      .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join("&");
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
     */
    const statePath = "/?" + buildQuery(params);

    return `https://liff.line.me/${encodeURIComponent(liffId)}?liff.state=${encodeURIComponent(statePath)}`;
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
      ownerReferralCode: getMyReferralCode(),
      myReferralCode: getMyReferralCode(),
      ...payload
    };

    if (!GOOGLE_SCRIPT_URL) {
      throw new Error("GOOGLE_SCRIPT_URL missing");
    }

    /*
     * 優先嘗試 POST。
     * 如果 GAS / Shopify / LIFF WebView 發生 CORS 問題，
     * fallback 到 JSONP GET。
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
    const inviterCodeFromUrl = getReferralCodeFromUrl();
    const inviterCode =
      saveInviterReferralCode(inviterCodeFromUrl) ||
      getSavedInviterReferralCode();

    if (!inviterCode) {
      return {
        ok: false,
        skipped: true,
        reason: "missing_inviter_code"
      };
    }

    if (hasRegisteredReferral(inviterCode)) {
      return {
        ok: true,
        skipped: true,
        duplicated: true,
        reason: "already_registered_local",
        inviterReferralCode: inviterCode,
        count: getLineInviteFriendCount()
      };
    }

    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    const referredUserId =
      player.userId && player.userId !== "me-local"
        ? player.userId
        : "";

    const referredReferralCode = getMyReferralCode();

    /*
     * 如果使用者還沒登入 LINE，先不要登記。
     * 等 initLiffProfile 拿到 userId 後會再呼叫一次。
     */
    if (!referredUserId) {
      return {
        ok: false,
        skipped: true,
        reason: "missing_referred_user_id",
        inviterReferralCode: inviterCode
      };
    }

    /*
     * 自己邀請自己不登記。
     */
    if (inviterCode === referredReferralCode) {
      markReferralRegistered(inviterCode);

      return {
        ok: false,
        skipped: true,
        reason: "self_referral_code",
        inviterReferralCode: inviterCode
      };
    }

    const payload = {
      action: "register_liff_referral",
      eventType: "referral_accept",

      inviterReferralCode: inviterCode,
      inviterCode: inviterCode,
      ref: inviterCode,

      /*
       * 目前邀請網址中可能沒有可靠 inviter LINE userId，
       * 所以 inviterUserId 先留空，讓 GAS 以 referralCode 對應。
       */
      inviterUserId: "",
      inviterId: "",
      referrerId: "",
      fromUserId: "",

      referredReferralCode,
      myReferralCode: referredReferralCode,

      referredUserId,
      userId: referredUserId,
      lineUserId: referredUserId,

      referredPlayerName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "LINE 玩家",

      displayName:
        player.displayName ||
        player.name ||
        player.playerName ||
        "LINE 玩家",

      playerName:
        player.playerName ||
        player.displayName ||
        player.name ||
        "LINE 玩家",

      referredPictureUrl:
        player.pictureUrl ||
        player.avatar ||
        "",

      pictureUrl:
        player.pictureUrl ||
        player.avatar ||
        "",

      source,
      pageUrl: location.href,
      userAgent: navigator.userAgent || "",
      version: VERSION
    };

    try {
      const data = await postReferralApi(payload);

      if (data && data.ok !== false) {
        markReferralRegistered(inviterCode);

        const count =
          Number(
            data.lineInviteFriendCount ??
            data.referralCount ??
            data.successCount ??
            data.count ??
            getLineInviteFriendCount()
          ) || 0;

        if (count > 0) {
          setLineInviteFriendCount(count);
          setFallbackReferralSuccessCount(count);
        }

        console.log("[ZELO GAME] referral registered:", data);

        return data;
      }

      return data || {
        ok: false,
        reason: "empty_response"
      };
    } catch (error) {
      console.warn("[ZELO GAME] registerReferralIfNeeded failed:", error);

      return {
        ok: false,
        reason: "register_failed",
        message: String(error && error.message ? error.message : error)
      };
    }
  }

  async function fetchReferralCountFromServer() {
    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    const userId =
      player.userId && player.userId !== "me-local"
        ? player.userId
        : "";

    const myCode = getMyReferralCode();

    if (!userId && !myCode) {
      return {
        ok: false,
        count: getLineInviteFriendCount(),
        reason: "missing_owner"
      };
    }

    try {
      const data = await jsonpApi("get_liff_referral_count", {
        ownerReferralCode: myCode,
        referralCode: myCode,
        myReferralCode: myCode,

        ownerLineUserId: userId,
        lineUserId: userId,
        userId,

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

      setLineInviteFriendCount(count);
      setFallbackReferralSuccessCount(count);

      return {
        ...data,
        count,
        lineInviteFriendCount: count
      };
    } catch (error) {
      console.warn("[ZELO GAME] fetchReferralCountFromServer failed:", error);

      const fallback = Math.max(
        getLineInviteFriendCount(),
        getFallbackReferralSuccessCount()
      );

      return {
        ok: false,
        count: fallback,
        lineInviteFriendCount: fallback,
        reason: "fetch_failed",
        message: String(error && error.message ? error.message : error)
      };
    }
  }

  async function fetchReferralCodeFromServer() {
    const player =
      typeof getCurrentLinePlayer === "function"
        ? getCurrentLinePlayer()
        : normalizeLineProfile(getProfile() || {});

    const userId =
      player.userId && player.userId !== "me-local"
        ? player.userId
        : "";

    if (!userId) {
      return {
        ok: false,
        reason: "missing_user_id"
      };
    }

    try {
      const data = await jsonpApi("get_liff_referral_code", {
        userId,
        lineUserId: userId,
        ownerLineUserId: userId,

        displayName:
          player.displayName ||
          player.name ||
          player.playerName ||
          "",

        playerName:
          player.playerName ||
          player.displayName ||
          player.name ||
          "",

        pictureUrl:
          player.pictureUrl ||
          player.avatar ||
          "",

        version: VERSION
      });

      const serverCode =
        data.referralCode ||
        data.ownerReferralCode ||
        data.myReferralCode ||
        data.code ||
        "";

      if (serverCode) {
        try {
          localStorage.setItem(REFERRAL.codeKey, serverCode);
        } catch (error) {}
      }

      return data || {};
    } catch (error) {
      console.warn("[ZELO GAME] fetchReferralCodeFromServer failed:", error);

      return {
        ok: false,
        reason: "fetch_referral_code_failed",
        message: String(error && error.message ? error.message : error)
      };
    }
  }

  /*
   * =========================================================
   * 02. HELPERS / 共用工具
   * =========================================================
   */

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function htmlEscape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function cssUrl(url) {
    return `url("${String(url || "").replaceAll('"', "%22")}")`;
  }

  function nowDayKey() {
    const date = new Date();

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function dailyKey() {
    const uid = getUserId() || "guest";
    return `${STORAGE.dailyPrefix}${uid}_${nowDayKey()}`;
  }

  function readJson(key, fallback) {
    try {
      const text = localStorage.getItem(key);

      if (!text) return fallback;

      return JSON.parse(text);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function readNumber(key, fallback = 0) {
    try {
      const value = Number(localStorage.getItem(key));

      return Number.isFinite(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeNumber(key, value) {
    try {
      localStorage.setItem(key, String(Number(value) || 0));
    } catch (error) {}
  }

  function setMyScore(score) {
    const safeScore = Math.max(0, Number(score) || 0);
    writeNumber(STORAGE.myScore, safeScore);
    return safeScore;
  }

  function getMyScore() {
    return readNumber(STORAGE.myScore, 0);
  }

  function getSavedFriends() {
    const saved = readJson(STORAGE.friends, null);

    if (Array.isArray(saved)) {
      return saved;
    }

    return [
      {
        id: "friend_1",
        name: "ZELO-MK",
        score: 1260,
        avatar: ""
      },
      {
        id: "friend_2",
        name: "Faye",
        score: 980,
        avatar: ""
      },
      {
        id: "friend_3",
        name: "Kai",
        score: 740,
        avatar: ""
      }
    ];
  }

  function saveFriends(friends) {
    if (!Array.isArray(friends)) return;

    writeJson(STORAGE.friends, friends);
  }

  function getRoot() {
    return document.getElementById("zelo-liff-game");
  }

  function setRootHtml(html) {
    const root = getRoot();

    if (!root) {
      console.error("[ZELO GAME] root #zelo-liff-game not found");
      return;
    }

    root.innerHTML = html;
  }

  function getTypeLabel(type) {
    const found = TOPS.find((top) => top.type === type || top.id === type);
    return found ? found.typeName : "未知型";
  }

  function getTypeAdvantage(attackerType, defenderType) {
    /*
     * 陀螺屬性剋制：
     * 攻擊 > 耐久
     * 耐久 > 防禦
     * 防禦 > 攻擊
     * 平衡無明顯剋制
     */
    if (!attackerType || !defenderType) {
      return {
        status: "neutral",
        text: "屬性持平",
        multiplier: 1
      };
    }

    if (attackerType === defenderType) {
      return {
        status: "same",
        text: "同屬性對決",
        multiplier: 1
      };
    }

    if (attackerType === "balance" || defenderType === "balance") {
      return {
        status: "balance",
        text: "平衡型穩定應戰",
        multiplier: 1.03
      };
    }

    const wins = {
      attack: "stamina",
      stamina: "defense",
      defense: "attack"
    };

    if (wins[attackerType] === defenderType) {
      return {
        status: "advantage",
        text: "屬性優勢",
        multiplier: 1.12
      };
    }

    return {
      status: "disadvantage",
      text: "屬性劣勢",
      multiplier: 0.9
    };
  }

  function getLaunchGrade(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    if (p >= CHARGE.perfectMin && p <= CHARGE.perfectMax) {
      return {
        key: "perfect",
        label: "PERFECT",
        text: "完美發射",
        multiplier: 1.28
      };
    }

    if (p > CHARGE.perfectMax) {
      return {
        key: "over",
        label: "OVER",
        text: "過度蓄力",
        multiplier: 0.78
      };
    }

    if (p >= CHARGE.goodMin) {
      return {
        key: "good",
        label: "GOOD",
        text: "強力發射",
        multiplier: 1.12
      };
    }

    if (p >= CHARGE.normalMin) {
      return {
        key: "normal",
        label: "NORMAL",
        text: "穩定發射",
        multiplier: 1
      };
    }

    return {
      key: "weak",
      label: "WEAK",
      text: "力道不足",
      multiplier: 0.78
    };
  }

  function chooseEnemyTop(playerTop) {
    const candidates = TOPS.filter((top) => top.id !== playerTop?.id);

    if (candidates.length === 0) {
      return TOPS[0];
    }

    return choose(candidates);
  }

  function resolveFinish(resultType, playerHp, enemyHp) {
    if (resultType === "win") {
      if (enemyHp <= -30) return "xtreme";
      if (enemyHp <= 0) return "burst";
      return "spin";
    }

    if (resultType === "lose") {
      if (playerHp <= -30) return "xtreme";
      if (playerHp <= 0) return "burst";
      return "spin";
    }

    return "spin";
  }

  function pickCouponReward() {
    const r = Math.random();
    let acc = 0;

    for (const reward of COUPON_REWARDS) {
      acc += reward.rate;

      if (r <= acc) {
        return reward;
      }
    }

    return COUPON_REWARDS[COUPON_REWARDS.length - 1];
  }

  function getCouponCode(reward) {
    if (!reward) return "ZELO100";

    if (reward.fixedCode) {
      return reward.fixedCode;
    }

    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `${reward.codePrefix}${suffix}`;
  }

  function setStatus(text) {
    if (typeof window.zgStatus === "function") {
      window.zgStatus(text);
    } else {
      console.log("[ZELO STATUS]", text);
    }
  }

  function track(eventName, data = {}) {
    console.log("[ZELO TRACK]", eventName, data);
  }

  function createTopImg(top, className = "") {
    const src = top?.image || DEFAULT_TOP_IMAGE;
    const alt = top?.name || "ZELO Top";

    return `
      <img
        class="${className}"
        src="${htmlEscape(src)}"
        alt="${htmlEscape(alt)}"
        loading="eager"
        decoding="async"
      >
    `;
  }

  function createBattleTopImg(top, className = "") {
    const src = top?.battleImage || top?.image || DEFAULT_TOP_IMAGE;
    const alt = top?.name || "ZELO Top";

    return `
      <img
        class="${className}"
        src="${htmlEscape(src)}"
        alt="${htmlEscape(alt)}"
        loading="eager"
        decoding="async"
      >
    `;
  }

  function getTopById(id) {
    return TOPS.find((top) => top.id === id) || null;
  }

  function persistSelectedTop(top) {
    if (!top) return;

    try {
      localStorage.setItem(STORAGE.selectedType, top.id);
    } catch (error) {}
  }

  function restoreSelectedTop() {
    try {
      const id = localStorage.getItem(STORAGE.selectedType);

      if (id) {
        return getTopById(id);
      }
    } catch (error) {}

    return null;
  }

  /*
   * =========================================================
   * 03. AUDIO / 音效模組
   * =========================================================
   */

  const audio = {
    ctx: null,
    unlocked: false,
    bgm: null,
    bgmStarted: false,

    ensure() {
      if (this.ctx) return this.ctx;

      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return null;

      this.ctx = new AudioContext();
      return this.ctx;
    },

    async unlock() {
      const ctx = this.ensure();

      if (!ctx) return;

      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (error) {}
      }

      this.unlocked = true;
    },

    startBgm() {
      if (this.bgmStarted) return;

      try {
        this.bgm = new Audio(HOME_MUSIC_URL);
        this.bgm.loop = true;
        this.bgm.volume = 0.42;
        this.bgm.playsInline = true;

        const promise = this.bgm.play();

        if (promise && typeof promise.catch === "function") {
          promise.catch(() => {});
        }

        this.bgmStarted = true;
      } catch (error) {}
    },

    stopBgm() {
      if (!this.bgm) return;

      try {
        this.bgm.pause();
        this.bgm.currentTime = 0;
      } catch (error) {}

      this.bgmStarted = false;
    },

    beep(freq = 440, duration = 0.08, type = "sine", gainValue = 0.08) {
      const ctx = this.ensure();

      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(
        Math.max(0.0001, gainValue),
        ctx.currentTime + 0.01
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + duration
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration + 0.02);
    },

    launch() {
      this.beep(160, 0.08, "sawtooth", 0.12);
      setTimeout(() => this.beep(320, 0.12, "square", 0.08), 70);
      setTimeout(() => this.beep(540, 0.16, "triangle", 0.07), 130);
    },

    hit(power = 1) {
      const p = clamp(power, 0.2, 2.2);

      this.beep(110 + 90 * p, 0.05, "square", 0.05 * p);
      setTimeout(() => this.beep(70 + 60 * p, 0.05, "sawtooth", 0.035 * p), 35);
    },

    win() {
      this.beep(392, 0.08, "triangle", 0.08);
      setTimeout(() => this.beep(523, 0.1, "triangle", 0.08), 90);
      setTimeout(() => this.beep(659, 0.14, "triangle", 0.09), 190);
    },

    lose() {
      this.beep(330, 0.09, "sine", 0.07);
      setTimeout(() => this.beep(220, 0.14, "sine", 0.07), 120);
      setTimeout(() => this.beep(146, 0.18, "sine", 0.06), 260);
    }
  };

  function unlockAudioOnce() {
    audio.unlock();
    audio.startBgm();
  }

  /*
   * =========================================================
   * 04. APP BOOTSTRAP / App 初始化與基礎 DOM
   * =========================================================
   */

  function appShell(contentHtml, options = {}) {
    const {
      screenClass = "",
      showLogo = true,
      compact = false
    } = options;

    return `
      <div class="zg-app ${htmlEscape(screenClass)} ${compact ? "is-compact" : ""}">
        <div
          class="zg-bg"
          style="background-image:${cssUrl(BG_IMAGE_URL)};"
        ></div>

        <div class="zg-bg-overlay"></div>

        <main class="zg-main">
          ${
            showLogo
              ? `
                <header class="zg-header">
                  <img
                    class="zg-header-logo"
                    src="${htmlEscape(ARENA_LOGO_URL)}"
                    alt="ZELO"
                  >
                </header>
              `
              : ""
          }

          ${contentHtml}
        </main>
      </div>
    `;
  }

  function bindOnce(selector, eventName, handler, root = document) {
    const el = $(selector, root);

    if (!el) return;

    el.addEventListener(eventName, handler);
  }

  function setScreen(screen) {
    state.screen = screen;

    try {
      document.documentElement.setAttribute("data-zg-screen", screen);
      document.body.setAttribute("data-zg-screen", screen);
    } catch (error) {}
  }

  function goHome() {
    stopBattleLoop();
    stopChargeLoop();

    state.selectedTop = null;
    state.enemyTop = null;
    state.lastBattleResult = null;
    state.resultLogged = false;
    state.pendingResult = null;
    state.finishing = false;

    renderHome();
  }

  function goSelectTop() {
    stopBattleLoop();
    stopChargeLoop();

    state.selectedTop = restoreSelectedTop() || null;
    state.enemyTop = null;
    state.lastBattleResult = null;
    state.resultLogged = false;
    state.pendingResult = null;
    state.finishing = false;

    renderTopSelect();
  }

  function goLaunchPrep() {
    if (!state.selectedTop) {
      state.selectedTop = restoreSelectedTop() || TOPS[0];
    }

    state.enemyTop = chooseEnemyTop(state.selectedTop);

    renderLaunchPrep();
  }

  function goBattle() {
    if (!state.selectedTop) {
      state.selectedTop = TOPS[0];
    }

    if (!state.enemyTop) {
      state.enemyTop = chooseEnemyTop(state.selectedTop);
    }

    renderBattle();
  }

  function goResult(result) {
    state.lastBattleResult = result;
    renderResult(result);
  }

  /*
   * =========================================================
   * 05. HOME PAGE / 首頁
   * =========================================================
   */

  function renderHome() {
    setScreen("home");

    const inviteCount =
      Math.max(
        getLineInviteFriendCount(),
        getFallbackReferralSuccessCount(),
        Number(state.lineInviteFriendCount || 0)
      ) || 0;

    const content = `
      <section class="zg-home">
        <div class="zg-home-video-wrap">
          <video
            class="zg-home-video"
            src="${htmlEscape(HOME_VIDEO_URL)}"
            poster="${htmlEscape(HOME_POSTER_URL)}"
            autoplay
            muted
            loop
            playsinline
            webkit-playsinline
          ></video>

          <div class="zg-home-shine"></div>
        </div>

        <div class="zg-home-panel">
          <div class="zg-home-kicker">LINE FRIEND BATTLE</div>

          <h1 class="zg-home-title">
            ZELO 陀螺對決
          </h1>

          <p class="zg-home-desc">
            選擇你的戰鬥陀螺，抓準完美發射時機，擊敗對手並解鎖專屬優惠。
          </p>

          <div class="zg-home-stats">
            <div class="zg-home-stat">
              <strong>${htmlEscape(String(inviteCount))}</strong>
              <span>成功邀請好友</span>
            </div>

            <div class="zg-home-stat">
              <strong>${htmlEscape(String(getMyScore()))}</strong>
              <span>我的最高分</span>
            </div>
          </div>

          <div class="zg-home-actions">
            <button class="zg-btn zg-btn-primary" id="zg-start-btn" type="button">
              開始遊戲
            </button>

            <button class="zg-btn zg-btn-ghost" id="zg-share-home-btn" type="button">
              邀請 LINE 好友
            </button>
          </div>

          <div class="zg-home-note">
            每次遊玩都有機會獲得 ZELO 折扣碼。
          </div>
        </div>
      </section>
    `;

    setRootHtml(
      appShell(content, {
        screenClass: "zg-home-screen",
        showLogo: false
      })
    );

    bindOnce("#zg-start-btn", "click", async () => {
      unlockAudioOnce();

      await ensureCanPlayBeforeStart();

      goSelectTop();
    });

    bindOnce("#zg-share-home-btn", "click", async () => {
      unlockAudioOnce();
      await handleShare();
    });

    fetchReferralCountFromServer()
      .then((data) => {
        const count =
          Number(
            data.lineInviteFriendCount ??
            data.referralCount ??
            data.successCount ??
            data.count ??
            0
          ) || 0;

        if (count > inviteCount) {
          setLineInviteFriendCount(count);
        }
      })
      .catch(() => {});

    track("home_view", {
      version: VERSION
    });
  }

  /*
   * =========================================================
   * 06. TOP SELECT PAGE / 選擇陀螺頁面
   * =========================================================
   */

  function renderTopSelect() {
    setScreen("select");

    const selectedId = state.selectedTop?.id || "";

    const topCards = TOPS.map((top) => {
      const selected = selectedId === top.id;

      return `
        <button
          class="zg-top-card ${selected ? "is-selected" : ""}"
          type="button"
          data-top-id="${htmlEscape(top.id)}"
          style="
            --top-a:${htmlEscape(top.colorA)};
            --top-b:${htmlEscape(top.colorB)};
          "
        >
          <div class="zg-top-card-glow"></div>

          <div class="zg-top-img-wrap">
            ${createTopImg(top, "zg-top-img")}
          </div>

          <div class="zg-top-info">
            <div class="zg-top-type">
              ${htmlEscape(top.emoji)} ${htmlEscape(top.typeName)}
            </div>

            <h3 class="zg-top-name">
              ${htmlEscape(top.name)}
            </h3>

            <div class="zg-top-bars">
              ${renderStatBar("攻擊", top.power)}
              ${renderStatBar("防禦", top.defense)}
              ${renderStatBar("耐久", top.stamina)}
              ${renderStatBar("速度", top.speed)}
            </div>
          </div>
        </button>
      `;
    }).join("");

    const content = `
      <section class="zg-select">
        <div class="zg-section-head">
          <div class="zg-kicker">SELECT YOUR TOP</div>

          <h1 class="zg-title">
            選擇你的戰鬥陀螺
          </h1>

          <p class="zg-subtitle">
            不同屬性會影響碰撞、耐久與速度表現。
          </p>
        </div>

        <div class="zg-top-grid">
          ${topCards}
        </div>

        <div class="zg-select-footer">
          <button
            class="zg-btn zg-btn-primary"
            id="zg-confirm-top-btn"
            type="button"
            ${state.selectedTop ? "" : "disabled"}
          >
            確認選擇
          </button>

          <button
            class="zg-btn zg-btn-ghost"
            id="zg-back-home-btn"
            type="button"
          >
            返回首頁
          </button>
        </div>
      </section>
    `;

    setRootHtml(
      appShell(content, {
        screenClass: "zg-select-screen",
        compact: true
      })
    );

    $all(".zg-top-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-top-id");
        const top = getTopById(id);

        if (!top) return;

        state.selectedTop = top;
        persistSelectedTop(top);

        audio.beep(320, 0.08, "triangle", 0.06);

        renderTopSelect();
      });
    });

    bindOnce("#zg-confirm-top-btn", "click", () => {
      if (!state.selectedTop) return;

      unlockAudioOnce();
      audio.beep(560, 0.08, "triangle", 0.08);

      goLaunchPrep();
    });

    bindOnce("#zg-back-home-btn", "click", () => {
      goHome();
    });

    track("top_select_view", {
      selectedTopId: state.selectedTop?.id || ""
    });
  }

  function renderStatBar(label, value) {
    const v = clamp(Number(value) || 0, 0, 100);

    return `
      <div class="zg-stat-bar">
        <span class="zg-stat-label">${htmlEscape(label)}</span>

        <div class="zg-stat-track">
          <div
            class="zg-stat-fill"
            style="width:${v}%"
          ></div>
        </div>

        <span class="zg-stat-value">${v}</span>
      </div>
    `;
  }

  /*
   * =========================================================
   * 07. LAUNCH PREP PAGE / 準備發射頁面
   * =========================================================
   */

  function renderLaunchPrep() {
    setScreen("launch");

    state.charging = false;
    state.launchReady = false;
    state.launchPower = 0;
    state.chargeDir = 1;

    const playerTop = state.selectedTop || TOPS[0];
    const enemyTop = state.enemyTop || chooseEnemyTop(playerTop);
    const advantage = getTypeAdvantage(playerTop.type, enemyTop.type);

    const content = `
      <section class="zg-launch">
        <div class="zg-versus">
          <div
            class="zg-fighter zg-fighter-player"
            style="
              --top-a:${htmlEscape(playerTop.colorA)};
              --top-b:${htmlEscape(playerTop.colorB)};
            "
          >
            <div class="zg-fighter-label">YOU</div>
            <div class="zg-fighter-img">
              ${createTopImg(playerTop, "zg-launch-top-img")}
            </div>
            <div class="zg-fighter-name">
              ${htmlEscape(playerTop.name)}
            </div>
            <div class="zg-fighter-type">
              ${htmlEscape(playerTop.emoji)} ${htmlEscape(playerTop.typeName)}
            </div>
          </div>

          <div class="zg-vs-mark">VS</div>

          <div
            class="zg-fighter zg-fighter-enemy"
            style="
              --top-a:${htmlEscape(enemyTop.colorA)};
              --top-b:${htmlEscape(enemyTop.colorB)};
            "
          >
            <div class="zg-fighter-label">RIVAL</div>
            <div class="zg-fighter-img">
              ${createTopImg(enemyTop, "zg-launch-top-img")}
            </div>
            <div class="zg-fighter-name">
              ${htmlEscape(enemyTop.name)}
            </div>
            <div class="zg-fighter-type">
              ${htmlEscape(enemyTop.emoji)} ${htmlEscape(enemyTop.typeName)}
            </div>
          </div>
        </div>

        <div class="zg-advantage-card ${htmlEscape(advantage.status)}">
          <strong>${htmlEscape(advantage.text)}</strong>
          <span>
            ${htmlEscape(playerTop.typeName)}
            對上
            ${htmlEscape(enemyTop.typeName)}
          </span>
        </div>

        <div class="zg-launch-panel">
          <div class="zg-launch-kicker">LAUNCH POWER</div>

          <div class="zg-charge-meter">
            <div class="zg-charge-track">
              <div class="zg-charge-zone zg-charge-zone-weak"></div>
              <div class="zg-charge-zone zg-charge-zone-normal"></div>
              <div class="zg-charge-zone zg-charge-zone-good"></div>
              <div class="zg-charge-zone zg-charge-zone-perfect"></div>
              <div class="zg-charge-zone zg-charge-zone-over"></div>

              <div
                class="zg-charge-fill"
                id="zg-charge-fill"
                style="width:0%"
              ></div>

              <div
                class="zg-charge-pointer"
                id="zg-charge-pointer"
                style="left:0%"
              ></div>
            </div>

            <div class="zg-charge-labels">
              <span>WEAK</span>
              <span>GOOD</span>
              <span>PERFECT</span>
              <span>OVER</span>
            </div>
          </div>

          <div class="zg-launch-grade" id="zg-launch-grade">
            按住蓄力
          </div>

          <button
            class="zg-btn zg-btn-primary zg-launch-btn"
            id="zg-launch-btn"
            type="button"
          >
            按住蓄力，放開發射
          </button>

          <button
            class="zg-btn zg-btn-ghost"
            id="zg-reselect-btn"
            type="button"
          >
            重新選擇
          </button>
        </div>
      </section>
    `;

    setRootHtml(
      appShell(content, {
        screenClass: "zg-launch-screen",
        compact: true
      })
    );

    const launchBtn = $("#zg-launch-btn");

    if (launchBtn) {
      const start = (event) => {
        event.preventDefault();
        unlockAudioOnce();
        startChargeLoop();
      };

      const end = (event) => {
        event.preventDefault();
        releaseLaunch();
      };

      launchBtn.addEventListener("pointerdown", start);
      launchBtn.addEventListener("pointerup", end);
      launchBtn.addEventListener("pointercancel", end);
      launchBtn.addEventListener("pointerleave", () => {
        if (state.charging) {
          releaseLaunch();
        }
      });

      /*
       * 桌機鍵盤備援。
       */
      launchBtn.addEventListener("keydown", (event) => {
        if (event.code === "Space" || event.code === "Enter") {
          event.preventDefault();

          if (!state.charging) {
            startChargeLoop();
          }
        }
      });

      launchBtn.addEventListener("keyup", (event) => {
        if (event.code === "Space" || event.code === "Enter") {
          event.preventDefault();

          if (state.charging) {
            releaseLaunch();
          }
        }
      });
    }

    bindOnce("#zg-reselect-btn", "click", () => {
      goSelectTop();
    });

    track("launch_prep_view", {
      playerTopId: playerTop.id,
      enemyTopId: enemyTop.id,
      advantage: advantage.status
    });
  }

  function startChargeLoop() {
    if (state.charging) return;

    state.charging = true;
    state.launchReady = false;
    state.launchPower = 0;
    state.chargeDir = 1;

    audio.beep(220, 0.08, "sawtooth", 0.05);

    const step = () => {
      if (!state.charging) return;

      state.launchPower += CHARGE.speed * state.chargeDir;

      if (state.launchPower >= 1) {
        state.launchPower = 1;
        state.chargeDir = -1;
      } else if (state.launchPower <= 0) {
        state.launchPower = 0;
        state.chargeDir = 1;
      }

      updateChargeUi();

      state.chargeRaf = requestAnimationFrame(step);
    };

    stopChargeLoop();
    state.chargeRaf = requestAnimationFrame(step);
  }

  function stopChargeLoop() {
    if (state.chargeRaf) {
      cancelAnimationFrame(state.chargeRaf);
      state.chargeRaf = null;
    }

    state.charging = false;
  }

  function updateChargeUi() {
    const fill = $("#zg-charge-fill");
    const pointer = $("#zg-charge-pointer");
    const gradeEl = $("#zg-launch-grade");

    const p = clamp(state.launchPower, 0, 1);
    const percent = p * 100;

    if (fill) {
      fill.style.width = `${percent}%`;
    }

    if (pointer) {
      pointer.style.left = `${percent}%`;
    }

    const grade = getLaunchGrade(p);

    if (gradeEl) {
      gradeEl.textContent = `${grade.label}｜${grade.text}`;
      gradeEl.setAttribute("data-grade", grade.key);
    }
  }

  function releaseLaunch() {
    if (!state.charging) return;

    stopChargeLoop();

    const grade = getLaunchGrade(state.launchPower);

    state.launchReady = true;

    audio.launch();

    track("launch_release", {
      power: state.launchPower,
      grade: grade.key,
      topId: state.selectedTop?.id || ""
    });

    const launchBtn = $("#zg-launch-btn");

    if (launchBtn) {
      launchBtn.disabled = true;
      launchBtn.textContent = "發射！";
    }

    setTimeout(() => {
      goBattle();
    }, 420);
  }

  /*
   * =========================================================
   * 08. BATTLE PAGE / 陀螺戰鬥頁面
   * =========================================================
   */

  function renderBattle() {
    setScreen("battle");

    stopBattleLoop();

    const playerTop = state.selectedTop || TOPS[0];
    const enemyTop = state.enemyTop || chooseEnemyTop(playerTop);
    const launchGrade = getLaunchGrade(state.launchPower || 0.65);
    const advantage = getTypeAdvantage(playerTop.type, enemyTop.type);

    const content = `
      <section class="zg-battle">
        <div class="zg-battle-hud">
          <div class="zg-hud-side zg-hud-player">
            <div class="zg-hud-name">
              ${htmlEscape(playerTop.name)}
            </div>
            <div class="zg-hp-bar">
              <div class="zg-hp-fill" id="zg-player-hp-fill" style="width:100%"></div>
            </div>
            <div class="zg-hp-text" id="zg-player-hp-text">100</div>
          </div>

          <div class="zg-battle-center-hud">
            <div class="zg-finish-score" id="zg-battle-score">0 - 0</div>
            <div class="zg-battle-timer" id="zg-battle-timer">BATTLE</div>
          </div>

          <div class="zg-hud-side zg-hud-enemy">
            <div class="zg-hud-name">
              ${htmlEscape(enemyTop.name)}
            </div>
            <div class="zg-hp-bar">
              <div class="zg-hp-fill" id="zg-enemy-hp-fill" style="width:100%"></div>
            </div>
            <div class="zg-hp-text" id="zg-enemy-hp-text">100</div>
          </div>
        </div>

        <div class="zg-arena-wrap">
          <canvas
            id="zg-arena-canvas"
            class="zg-arena-canvas"
          ></canvas>

          <div class="zg-arena-logo">
            <img src="${htmlEscape(ARENA_LOGO_URL)}" alt="ZELO">
          </div>

          <div class="zg-battle-top zg-battle-player" id="zg-player-top">
            ${createBattleTopImg(playerTop, "zg-battle-top-img")}
          </div>

          <div class="zg-battle-top zg-battle-enemy" id="zg-enemy-top">
            ${createBattleTopImg(enemyTop, "zg-battle-top-img")}
          </div>

          <div class="zg-hit-layer" id="zg-hit-layer"></div>
        </div>

        <div class="zg-battle-info">
          <div>
            發射：
            <strong>${htmlEscape(launchGrade.label)}</strong>
          </div>
          <div>
            屬性：
            <strong>${htmlEscape(advantage.text)}</strong>
          </div>
        </div>
      </section>
    `;

    setRootHtml(
      appShell(content, {
        screenClass: "zg-battle-screen",
        showLogo: false,
        compact: true
      })
    );

    initBattleState(playerTop, enemyTop, launchGrade, advantage);
    resizeBattle();

    window.addEventListener("resize", resizeBattle, {
      passive: true
    });

    startBattleLoop();

    track("battle_start", {
      playerTopId: playerTop.id,
      enemyTopId: enemyTop.id,
      launchPower: state.launchPower,
      launchGrade: launchGrade.key,
      advantage: advantage.status
    });
  }

  function initBattleState(playerTop, enemyTop, launchGrade, advantage) {
    const canvas = $("#zg-arena-canvas");
    const arenaWrap = $(".zg-arena-wrap");

    const rect = arenaWrap
      ? arenaWrap.getBoundingClientRect()
      : {
          width: 360,
          height: 360
        };

    const w = Math.max(280, rect.width || 360);
    const h = Math.max(280, rect.height || 360);

    const cx = w / 2;
    const cy = h / 2;
    const arenaRadius = Math.min(w, h) / 2 - PHY.ringPadding;
    const launchGradeMul = launchGrade.multiplier || 1;
    const advantageMul = advantage.multiplier || 1;

    const playerFeel = FEEL[playerTop.type] || FEEL.balance;
    const enemyFeel = FEEL[enemyTop.type] || FEEL.balance;

    const playerBasePower =
      (playerTop.power * 0.34 +
        playerTop.speed * 0.32 +
        playerTop.stamina * 0.18 +
        playerTop.defense * 0.16) /
      100;

    const enemyBasePower =
      (enemyTop.power * 0.34 +
        enemyTop.speed * 0.32 +
        enemyTop.stamina * 0.18 +
        enemyTop.defense * 0.16) /
      100;

    const playerEnergy =
      100 *
      clamp(
        0.82 +
          playerBasePower * 0.46 +
          (state.launchPower || 0.65) * 0.35,
        0.85,
        1.34
      ) *
      launchGradeMul *
      advantageMul;

    const enemyEnergy =
      100 *
      clamp(
        0.88 + enemyBasePower * 0.45 + rand(-0.05, 0.08),
        0.85,
        1.26
      );

    const playerSpeed =
      PHY.launchSpeed *
      clamp(
        0.7 +
          (state.launchPower || 0.65) * 0.75 +
          playerFeel.mobility * 0.16,
        0.72,
        1.58
      ) *
      launchGradeMul;

    const enemySpeed =
      PHY.launchSpeed *
      clamp(0.82 + enemyFeel.mobility * 0.18 + rand(-0.06, 0.1), 0.72, 1.48);

    const pAngle = -Math.PI * 0.05;
    const eAngle = Math.PI + Math.PI * 0.06;

    state.battle = {
      canvas,
      ctx: canvas ? canvas.getContext("2d") : null,

      width: w,
      height: h,
      cx,
      cy,
      arenaRadius,

      startedAt: performance.now(),
      lastAt: performance.now(),
      elapsed: 0,

      playerScore: 0,
      enemyScore: 0,

      playerTop,
      enemyTop,
      launchGrade,
      advantage,

      player: makeBody({
        top: playerTop,
        side: "player",
        x: cx - arenaRadius * 0.52,
        y: cy + arenaRadius * 0.18,
        vx: Math.cos(pAngle) * playerSpeed,
        vy: Math.sin(pAngle) * playerSpeed,
        hp: playerEnergy,
        maxHp: playerEnergy,
        spin: 100 * launchGradeMul,
        feel: playerFeel
      }),

      enemy: makeBody({
        top: enemyTop,
        side: "enemy",
        x: cx + arenaRadius * 0.52,
        y: cy - arenaRadius * 0.18,
        vx: Math.cos(eAngle) * enemySpeed,
        vy: Math.sin(eAngle) * enemySpeed,
        hp: enemyEnergy,
        maxHp: enemyEnergy,
        spin: 100,
        feel: enemyFeel
      }),

      collisions: 0,
      lastCollisionAt: 0,
      finishQueued: false,
      winner: "",
      finishType: ""
    };

    updateBattleDom(true);
  }

  function makeBody(options) {
    const feel = options.feel || FEEL.balance;
    const top = options.top || TOPS[0];

    return {
      side: options.side,
      top,

      x: options.x,
      y: options.y,
      vx: options.vx,
      vy: options.vy,

      r: PHY.radius,

      hp: options.hp,
      maxHp: options.maxHp,
      spin: options.spin,

      angle: rand(0, Math.PI * 2),
      angleSpeed:
        (top.speed / 100) *
        0.42 *
        feel.humGain *
        (options.side === "player" ? 1 : -1),

      wobble: 0,
      lastHitAt: 0,
      feel,

      attack: (top.power / 100) * feel.attack,
      defense: (top.defense / 100) * feel.defense,
      stamina: (top.stamina / 100) * feel.stamina,
      mobility: (top.speed / 100) * feel.mobility
    };
  }

  function resizeBattle() {
    const battle = state.battle;
    const canvas = $("#zg-arena-canvas");
    const arenaWrap = $(".zg-arena-wrap");

    if (!canvas || !arenaWrap) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = arenaWrap.getBoundingClientRect();

    const width = Math.max(280, rect.width || 360);
    const height = Math.max(280, rect.height || 360);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (battle) {
      const oldCx = battle.cx || width / 2;
      const oldCy = battle.cy || height / 2;

      battle.width = width;
      battle.height = height;
      battle.cx = width / 2;
      battle.cy = height / 2;
      battle.arenaRadius = Math.min(width, height) / 2 - PHY.ringPadding;
      battle.canvas = canvas;
      battle.ctx = ctx;

      const dx = battle.cx - oldCx;
      const dy = battle.cy - oldCy;

      if (battle.player) {
        battle.player.x += dx;
        battle.player.y += dy;
      }

      if (battle.enemy) {
        battle.enemy.x += dx;
        battle.enemy.y += dy;
      }
    }
  }

  function startBattleLoop() {
    if (state.running) return;

    state.running = true;
    state.paused = false;
    state.lastFrame = performance.now();

    const loop = (time) => {
      if (!state.running) return;

      const dt = clamp(time - state.lastFrame, 0, 34);
      state.lastFrame = time;

      updateBattle(dt, time);
      drawBattle();

      state.raf = requestAnimationFrame(loop);
    };

    state.raf = requestAnimationFrame(loop);
  }

  function stopBattleLoop() {
    state.running = false;

    if (state.raf) {
      cancelAnimationFrame(state.raf);
      state.raf = null;
    }

    try {
      window.removeEventListener("resize", resizeBattle);
    } catch (error) {}
  }

  function updateBattle(dt, time) {
    const battle = state.battle;

    if (!battle || battle.finishQueued) return;

    battle.elapsed = time - battle.startedAt;

    updateBody(battle.player, battle, dt, time, battle.enemy);
    updateBody(battle.enemy, battle, dt, time, battle.player);

    handleBodyCollision(battle, time);

    updateBattleDom(false);

    const finish = checkBattleFinish(battle, time);

    if (finish) {
      queueBattleFinish(finish);
    }
  }

  function updateBody(body, battle, dt, time, opponent) {
    if (!body || body.hp <= 0) return;

    const dtScale = dt / 16.67;

    /*
     * 微弱追蹤力，讓戰鬥更容易碰撞。
     */
    const dx = opponent.x - body.x;
    const dy = opponent.y - body.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / dist;
    const ny = dy / dist;

    const seek =
      PHY.seekForceMax *
      body.mobility *
      clamp(body.spin / 100, 0.2, 1.2);

    body.vx += nx * seek * dtScale;
    body.vy += ny * seek * dtScale;

    /*
     * 環繞力。
     */
    const toCenterX = battle.cx - body.x;
    const toCenterY = battle.cy - body.y;
    const centerDist = Math.max(1, Math.hypot(toCenterX, toCenterY));
    const cnx = toCenterX / centerDist;
    const cny = toCenterY / centerDist;

    const tangentX = -cny;
    const tangentY = cnx;

    body.vx += cnx * PHY.centerPull * dtScale;
    body.vy += cny * PHY.centerPull * dtScale;

    body.vx += tangentX * PHY.orbitForce * body.mobility * dtScale;
    body.vy += tangentY * PHY.orbitForce * body.mobility * dtScale;

    /*
     * 移動。
     */
    body.x += body.vx * dtScale;
    body.y += body.vy * dtScale;

    /*
     * 邊界碰撞。
     */
    const rx = body.x - battle.cx;
    const ry = body.y - battle.cy;
    const rDist = Math.max(1, Math.hypot(rx, ry));
    const maxR = battle.arenaRadius - body.r * 0.55;

    if (rDist > maxR) {
      const nx2 = rx / rDist;
      const ny2 = ry / rDist;

      body.x = battle.cx + nx2 * maxR;
      body.y = battle.cy + ny2 * maxR;

      const vDot = body.vx * nx2 + body.vy * ny2;

      if (vDot > 0) {
        body.vx -= (1 + PHY.wallRestitution) * vDot * nx2;
        body.vy -= (1 + PHY.wallRestitution) * vDot * ny2;
      }

      body.vx *= PHY.wallBounce;
      body.vy *= PHY.wallBounce;

      body.spin -= PHY.railSpinLoss * 16 * dtScale;
      body.hp -= 0.08 * dtScale;

      maybeSpark(body.x, body.y, "#ffffff", 0.5);
    }

    /*
     * 摩擦與自然衰退。
     */
    const feelFriction = body.feel?.friction || 1;

    body.vx *= Math.pow(PHY.friction, dtScale * feelFriction);
    body.vy *= Math.pow(PHY.friction, dtScale * feelFriction);
    body.spin *= Math.pow(PHY.spinDecay, dtScale / Math.max(0.55, body.stamina));

    const speed = Math.hypot(body.vx, body.vy);

    const naturalDrain =
      PHY.naturalEnergyDrain +
      speed * PHY.speedEnergyDrain +
      Math.max(0, 1 - body.stamina) * PHY.wobbleEnergyDrain;

    if (
      !PHY.naturalEnergyCanKill &&
      battle.elapsed > PHY.naturalKillGraceMs
    ) {
      body.hp = Math.max(1, body.hp - naturalDrain * dtScale);
    } else {
      body.hp -= naturalDrain * dtScale;
    }

    body.spin = Math.max(0, body.spin);
    body.hp = Math.max(PHY.naturalEnergyCanKill ? -50 : 0, body.hp);

    body.angle += body.angleSpeed * dtScale * clamp(body.spin / 100, 0.16, 1.2);
    body.wobble = Math.sin(time / 80 + body.x * 0.01) * clamp(1 - body.spin / 120, 0, 1) * 5;
  }

  function handleBodyCollision(battle, time) {
    const a = battle.player;
    const b = battle.enemy;

    if (!a || !b) return;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(0.0001, Math.hypot(dx, dy));
    const minDist = a.r + b.r;

    if (dist >= minDist) return;

    if (time - battle.lastCollisionAt < PHY.collisionCooldown) {
      separateBodies(a, b, dx, dy, dist, minDist);
      return;
    }

    battle.lastCollisionAt = time;
    battle.collisions += 1;

    const nx = dx / dist;
    const ny = dy / dist;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const relVel = rvx * nx + rvy * ny;

    separateBodies(a, b, dx, dy, dist, minDist);

    if (relVel > 0) return;

    const aMass = 1 + a.defense * 0.45;
    const bMass = 1 + b.defense * 0.45;

    const impulse =
      (-(1 + PHY.hitRestitution) * relVel) /
      (1 / aMass + 1 / bMass);

    const ix = impulse * nx;
    const iy = impulse * ny;

    a.vx -= ix / aMass;
    a.vy -= iy / aMass;
    b.vx += ix / bMass;
    b.vy += iy / bMass;

    const hitPower = Math.abs(impulse) * 0.15;
    const aAttack = a.attack * (a.feel?.hitSharpness || 1);
    const bAttack = b.attack * (b.feel?.hitSharpness || 1);

    const damageToA =
      clamp(hitPower * bAttack / Math.max(0.55, a.defense), 0, PHY.maxCollisionDamage);

    const damageToB =
      clamp(hitPower * aAttack / Math.max(0.55, b.defense), 0, PHY.maxCollisionDamage);

    a.hp -= damageToA;
    b.hp -= damageToB;

    a.spin -= PHY.collisionSpinLoss * (1 / Math.max(0.55, a.stamina));
    b.spin -= PHY.collisionSpinLoss * (1 / Math.max(0.55, b.stamina));

    a.lastHitAt = time;
    b.lastHitAt = time;

    const hitX = (a.x + b.x) / 2;
    const hitY = (a.y + b.y) / 2;

    maybeSpark(hitX, hitY, "#ffe05f", clamp(hitPower / 6, 0.5, 2));
    maybeShockwave(hitX, hitY, clamp(hitPower / 5, 0.5, 2.2));

    audio.hit(clamp(hitPower / 8, 0.5, 2));

    trackCollision(hitPower, damageToA, damageToB);
  }

  function separateBodies(a, b, dx, dy, dist, minDist) {
    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = Math.max(0, minDist - dist) + PHY.separationBias;

    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
  }

  function trackCollision(hitPower, damageToA, damageToB) {
    const t = performance.now();

    if (t - PERF.lastCollisionTrackAt < PERF.minCollisionTrackGap) return;

    PERF.lastCollisionTrackAt = t;

    track("battle_collision", {
      hitPower,
      damageToPlayer: damageToA,
      damageToEnemy: damageToB
    });
  }

  function maybeSpark(x, y, color = "#ffe05f", scale = 1) {
    const t = performance.now();

    if (PERF.lowFx) return;
    if (t - PERF.lastFxAt < PERF.minFxGap) return;
    if (PERF.activeFx > PERF.maxFx) return;

    PERF.lastFxAt = t;
    PERF.activeFx += 1;

    const layer = $("#zg-hit-layer");

    if (!layer) return;

    const spark = document.createElement("div");

    spark.className = "zg-spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--spark-color", color);
    spark.style.setProperty("--spark-scale", String(scale));

    layer.appendChild(spark);

    setTimeout(() => {
      try {
        spark.remove();
      } catch (error) {}

      PERF.activeFx = Math.max(0, PERF.activeFx - 1);
    }, 520);
  }

  function maybeShockwave(x, y, scale = 1) {
    const t = performance.now();

    if (PERF.lowFx) return;
    if (t - PERF.lastShockwaveAt < PERF.minShockwaveGap) return;

    PERF.lastShockwaveAt = t;

    const layer = $("#zg-hit-layer");

    if (!layer) return;

    const wave = document.createElement("div");

    wave.className = "zg-shockwave";
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.setProperty("--wave-scale", String(scale));

    layer.appendChild(wave);

    setTimeout(() => {
      try {
        wave.remove();
      } catch (error) {}
    }, 680);
  }

  function drawBattle() {
    const battle = state.battle;

    if (!battle || !battle.ctx) return;

    const ctx = battle.ctx;
    const w = battle.width;
    const h = battle.height;

    ctx.clearRect(0, 0, w, h);

    /*
     * Arena ring.
     */
    const gradient = ctx.createRadialGradient(
      battle.cx,
      battle.cy,
      battle.arenaRadius * 0.15,
      battle.cx,
      battle.cy,
      battle.arenaRadius
    );

    gradient.addColorStop(0, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.72, "rgba(87,242,255,0.06)");
    gradient.addColorStop(1, "rgba(255,224,95,0.18)");

    ctx.beginPath();
    ctx.arc(battle.cx, battle.cy, battle.arenaRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(battle.cx, battle.cy, battle.arenaRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,224,95,0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(battle.cx, battle.cy, battle.arenaRadius * 0.55, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    drawBodyShadow(ctx, battle.player);
    drawBodyShadow(ctx, battle.enemy);

    syncBodyDom(battle.player);
    syncBodyDom(battle.enemy);
  }

  function drawBodyShadow(ctx, body) {
    if (!body) return;

    const shadow = ctx.createRadialGradient(
      body.x,
      body.y,
      2,
      body.x,
      body.y,
      body.r * 1.45
    );

    const color =
      body.side === "player"
        ? "rgba(87,242,255,0.25)"
        : "rgba(255,82,122,0.25)";

    shadow.addColorStop(0, color);
    shadow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.arc(body.x, body.y, body.r * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = shadow;
    ctx.fill();
  }

  function syncBodyDom(body) {
    const el =
      body.side === "player"
        ? $("#zg-player-top")
        : $("#zg-enemy-top");

    if (!el) return;

    const size = body.r * 2;

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.transform =
      `translate(${body.x - body.r}px, ${body.y - body.r}px) rotate(${body.angle}rad)`;

    el.style.setProperty("--zg-wobble", `${body.wobble || 0}px`);
  }

  function updateBattleDom(force = false) {
    const battle = state.battle;

    if (!battle) return;

    const now = performance.now();

    if (!force && now - PERF.lastHpUiAt < 80) {
      return;
    }

    PERF.lastHpUiAt = now;

    const pHp = clamp(
      (battle.player.hp / battle.player.maxHp) * 100,
      0,
      100
    );

    const eHp = clamp(
      (battle.enemy.hp / battle.enemy.maxHp) * 100,
      0,
      100
    );

    const pFill = $("#zg-player-hp-fill");
    const eFill = $("#zg-enemy-hp-fill");
    const pText = $("#zg-player-hp-text");
    const eText = $("#zg-enemy-hp-text");
    const score = $("#zg-battle-score");
    const timer = $("#zg-battle-timer");

    if (pFill) pFill.style.width = `${pHp}%`;
    if (eFill) eFill.style.width = `${eHp}%`;

    if (pText) pText.textContent = String(Math.max(0, Math.round(battle.player.hp)));
    if (eText) eText.textContent = String(Math.max(0, Math.round(battle.enemy.hp)));

    if (score) {
      score.textContent = `${battle.playerScore} - ${battle.enemyScore}`;
    }

    if (timer) {
      timer.textContent = `${Math.floor(battle.elapsed / 1000)}s`;
    }
  }

  function checkBattleFinish(battle, time) {
    if (!battle) return null;

    const playerDead = battle.player.hp <= 0;
    const enemyDead = battle.enemy.hp <= 0;

    if (playerDead || enemyDead) {
      if (enemyDead && !playerDead) {
        return {
          winner: "player",
          result: "win",
          finishType: resolveFinish("win", battle.player.hp, battle.enemy.hp)
        };
      }

      if (playerDead && !enemyDead) {
        return {
          winner: "enemy",
          result: "lose",
          finishType: resolveFinish("lose", battle.player.hp, battle.enemy.hp)
        };
      }

      /*
       * 同時歸零，看剩餘值誰高。
       */
      if (battle.player.hp >= battle.enemy.hp) {
        return {
          winner: "player",
          result: "win",
          finishType: "burst"
        };
      }

      return {
        winner: "enemy",
        result: "lose",
        finishType: "burst"
      };
    }

    /*
     * 超時判定。
     */
    if (battle.elapsed >= PHY.battleLimit) {
      if (battle.player.hp >= battle.enemy.hp) {
        return {
          winner: "player",
          result: "win",
          finishType: "spin"
        };
      }

      return {
        winner: "enemy",
        result: "lose",
        finishType: "spin"
      };
    }

    return null;
  }

  function queueBattleFinish(finish) {
    const battle = state.battle;

    if (!battle || battle.finishQueued) return;

    battle.finishQueued = true;
    battle.winner = finish.winner;
    battle.finishType = finish.finishType;

    stopBattleLoop();

    if (finish.result === "win") {
      audio.win();
    } else {
      audio.lose();
    }

    const result = buildBattleResult(finish);

    state.pendingResult = result;

    setTimeout(() => {
      goResult(result);
    }, 900);
  }

  function buildBattleResult(finish) {
    const battle = state.battle || {};
    const playerTop = battle.playerTop || state.selectedTop || TOPS[0];
    const enemyTop = battle.enemyTop || state.enemyTop || TOPS[1] || TOPS[0];

    const launchPower = clamp(state.launchPower || 0, 0, 1);
    const launchGrade = battle.launchGrade || getLaunchGrade(launchPower);
    const advantage = battle.advantage || getTypeAdvantage(playerTop.type, enemyTop.type);

    const finishInfo = FINISH[finish.finishType] || FINISH.spin;

    const resultType = finish.result || "lose";
    const win = resultType === "win";

    const hpBonus =
      Math.max(0, Number(battle.player?.hp || 0)) * 2.2;

    const launchBonus =
      Math.round(launchPower * 420);

    const finishBonus =
      win ? finishInfo.points * 260 : 80;

    const advantageBonus =
      advantage.status === "advantage"
        ? 160
        : advantage.status === "disadvantage"
          ? -40
          : 60;

    const baseScore =
      win ? 520 : 180;

    const rawScore =
      baseScore +
      hpBonus +
      launchBonus +
      finishBonus +
      advantageBonus +
      Math.max(0, (battle.collisions || 0) * 18);

    const score = Math.max(0, Math.round(rawScore));

    const reward = pickCouponReward();
    const couponCode = getCouponCode(reward);

    state.lastCouponReward = {
      ...reward,
      code: couponCode
    };

    const playerProfile = getCurrentLinePlayer();
    const userId =
      playerProfile.userId && playerProfile.userId !== "me-local"
        ? playerProfile.userId
        : "";

    const playerName =
      playerProfile.displayName ||
      playerProfile.name ||
      playerProfile.playerName ||
      "你";

    const pictureUrl =
      playerProfile.pictureUrl ||
      playerProfile.avatar ||
      "";

    const result = {
      game: "zelo",
      version: VERSION,

      result: resultType,
      win,

      finish: finish.finishType,
      finishLabel: finishInfo.label,
      finishPoints: finishInfo.points,

      score,
      points: score,
      bestScore: Math.max(score, getMyScore()),

      couponCode,
      couponTitle: reward.label,
      couponAmount: reward.amount,

      playerName,
      displayName: playerName,
      name: playerName,

      userId,
      lineUserId: userId,
      ownerLineUserId: userId,

      pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      referralCode: getMyReferralCode(),
      ownerReferralCode: getMyReferralCode(),
      myReferralCode: getMyReferralCode(),

      inviterReferralCode: getSavedInviterReferralCode(),
      inviterCode: getSavedInviterReferralCode(),

      lineInviteFriendCount: getLineInviteFriendCount(),

      playerTopId: playerTop.id,
      playerTopName: playerTop.name,
      playerTopType: playerTop.type,
      playerTopImage: playerTop.image,
      playerTopBattleImage: playerTop.battleImage,

      enemyTopId: enemyTop.id,
      enemyTopName: enemyTop.name,
      enemyTopType: enemyTop.type,
      enemyTopImage: enemyTop.image,
      enemyTopBattleImage: enemyTop.battleImage,

      typeStatus: advantage.status,
      typeText: advantage.text,

      launchPower,
      launchGrade: launchGrade.key,

      playerHp: Math.max(0, Math.round(battle.player?.hp || 0)),
      enemyHp: Math.max(0, Math.round(battle.enemy?.hp || 0)),
      playerEnergy: Math.max(0, Math.round(battle.player?.hp || 0)),
      enemyEnergy: Math.max(0, Math.round(battle.enemy?.hp || 0)),

      playerSpin: Math.max(0, Math.round(battle.player?.spin || 0)),
      enemySpin: Math.max(0, Math.round(battle.enemy?.spin || 0)),

      durationMs: Math.round(battle.elapsed || 0),
      collisions: battle.collisions || 0,

      playedAt: new Date().toISOString(),
      ts: Date.now()
    };

    const previousBest = getMyScore();

    if (score > previousBest) {
      setMyScore(score);
    }

    try {
      localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
      localStorage.setItem(STORAGE.lastCoupon, JSON.stringify(state.lastCouponReward));
    } catch (error) {}

    return result;
  }

  /*
   * =========================================================
   * 09. RESULT PAGE / 結果頁面 - 基礎畫面
   * =========================================================
   */

  function renderResult(result = {}) {
    setScreen("result");

    stopBattleLoop();
    stopChargeLoop();

    state.lastBattleResult = result;

    const resultType = result.result || "lose";
    const isWin = resultType === "win";
    const finishType = result.finish || "spin";
    const finishInfo = FINISH[finishType] || FINISH.spin;

    const points =
      Number(
        result.score ??
        result.points ??
        result.totalScore ??
        result.finalScore ??
        0
      ) || 0;

    const couponCode =
      result.couponCode ||
      state.lastCouponReward?.code ||
      state.lastCouponReward?.fixedCode ||
      "ZELO100";

    const couponTitle =
      result.couponTitle ||
      state.lastCouponReward?.label ||
      "ZELO 專屬優惠券";

    const inviteCount =
      Math.max(
        Number(result.lineInviteFriendCount || 0),
        getLineInviteFriendCount(),
        getFallbackReferralSuccessCount()
      ) || 0;

    const content = `
      <section class="zg-result ${isWin ? "is-win" : "is-lose"}">
        <div class="zg-result-hero">
          <div class="zg-result-kicker">
            ${isWin ? "VICTORY" : "TRY AGAIN"}
          </div>

          <h1 class="zg-result-title">
            ${isWin ? "戰鬥勝利！" : "差一點就贏了！"}
          </h1>

          <div class="zg-result-finish">
            ${htmlEscape(finishInfo.label)}
          </div>

          <div class="zg-result-score">
            <span>${htmlEscape(String(points))}</span>
            <small>POINTS</small>
          </div>
        </div>

        <div class="zg-result-grid">
          <div class="zg-result-card">
            <div class="zg-card-title">你的獎勵</div>

            <div class="zg-coupon">
              <div class="zg-coupon-title">
                ${htmlEscape(couponTitle)}
              </div>

              <div class="zg-coupon-code" id="zg-coupon-code">
                ${htmlEscape(couponCode)}
              </div>

              <button
                class="zg-btn zg-btn-secondary"
                id="zg-copy-coupon-btn"
                type="button"
              >
                複製折扣碼
              </button>
            </div>
          </div>

          <div class="zg-result-card">
            <div class="zg-card-title">好友排行榜</div>

            <div class="zg-rank-list" id="zg-rank-list">
              ${renderRankLoading()}
            </div>
          </div>

          <div class="zg-result-card">
            <div class="zg-card-title">邀請進度</div>

            <div class="zg-invite-progress">
              <strong>${htmlEscape(String(inviteCount))}</strong>
              <span>位好友已接受邀請</span>
            </div>

            <button
              class="zg-btn zg-btn-primary"
              id="zg-result-share-btn"
              type="button"
            >
              邀請 LINE 好友
            </button>
          </div>
        </div>

        <div class="zg-result-actions">
          <button
            class="zg-btn zg-btn-primary"
            id="zg-play-again-btn"
            type="button"
          >
            再玩一次
          </button>

          <button
            class="zg-btn zg-btn-ghost"
            id="zg-result-home-btn"
            type="button"
          >
            返回首頁
          </button>

          <a
            class="zg-btn zg-btn-shop"
            href="${htmlEscape(SHOP_URL)}"
            target="_blank"
            rel="noopener"
          >
            前往 ZELO 商店
          </a>
        </div>
      </section>
    `;

    setRootHtml(
      appShell(content, {
        screenClass: "zg-result-screen",
        compact: true
      })
    );

    bindResultEvents(result);

    renderFriendRank(result);

    /*
     * 同步本次結果到 GAS。
     * 重要：
     * 要先送分數，再查排行榜。
     * 否則 friendRank 可能太早查，導致本次分數還沒寫進 Sheet。
     */
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

    /*
     * 再向 GAS 同步好友排行榜。
     */
    if (typeof hydrateResultFriendRank === "function") {
      syncPromise
        .then(() => {
          /*
           * GAS appendRow 後有時會有短暫延遲。
           */
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

          track("result_friend_rank_loaded", {
            result: resultType,
            finish: finishType,
            points,
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
            message: String(error && error.message ? error.message : error)
          });

          forceResultVisible();
        });
    }

    track("result_view", {
      result: resultType,
      finish: finishType,
      points,
      couponCode
    });
  }

  function forceResultVisible() {
    try {
      const root = getRoot();

      if (root) {
        root.style.display = "";
        root.style.visibility = "visible";
        root.style.opacity = "1";
      }

      const result = $(".zg-result");

      if (result) {
        result.style.display = "";
        result.style.visibility = "visible";
        result.style.opacity = "1";
      }
    } catch (error) {}
  }

  function bindResultEvents(result) {
    bindOnce("#zg-copy-coupon-btn", "click", async () => {
      const code =
        result.couponCode ||
        state.lastCouponReward?.code ||
        state.lastCouponReward?.fixedCode ||
        "ZELO100";

      try {
        await navigator.clipboard.writeText(code);
        audio.beep(640, 0.08, "triangle", 0.08);

        const btn = $("#zg-copy-coupon-btn");
        if (btn) {
          btn.textContent = "已複製！";
          setTimeout(() => {
            btn.textContent = "複製折扣碼";
          }, 1400);
        }
      } catch (error) {
        window.prompt("請複製折扣碼", code);
      }
    });

    bindOnce("#zg-result-share-btn", "click", async () => {
      unlockAudioOnce();
      await handleShare();
    });

    bindOnce("#zg-play-again-btn", "click", async () => {
      unlockAudioOnce();

      await ensureCanPlayBeforeStart();

      goSelectTop();
    });

    bindOnce("#zg-result-home-btn", "click", () => {
      goHome();
    });
  }

  function renderRankLoading() {
    return `
      <div class="zg-rank-loading">
        好友排行載入中...
      </div>
    `;
  }

  function renderFriendRank(result = {}) {
    const list = document.querySelector("#zg-rank-list");
    if (!list) return;

    const profilePayload = getProfilePayload();

    const myUserId =
      profilePayload.userId ||
      profilePayload.lineUserId ||
      "";

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
      result.displayName ||
      profilePayload.displayName ||
      getPlayerName() ||
      "你";

    const playerPictureUrl =
      result.pictureUrl ||
      profilePayload.pictureUrl ||
      "";

    const sourceRows = Array.isArray(result.friendRank)
      ? result.friendRank
      : Array.isArray(result.friends)
        ? result.friends
        : Array.isArray(result.rows)
          ? result.rows
          : [];

    let rows = sourceRows
      .filter(Boolean)
      .map((item, index) => {
        const itemUserId =
          item.userId ||
          item.lineUserId ||
          item.id ||
          item.uid ||
          "";

        const itemScore =
          Number(
            item.score ??
            item.points ??
            item.bestScore ??
            item.totalScore ??
            0
          ) || 0;

        const name =
          item.name ||
          item.playerName ||
          item.displayName ||
          item.lineDisplayName ||
          itemUserId ||
          "LINE 玩家";

        const isMeById =
          !!itemUserId &&
          !!myUserId &&
          String(itemUserId) === String(myUserId);

        const isMe =
          item.isMe === true ||
          item.me === true ||
          isMeById;

        /*
         * 重要：
         * 如果這一列是自己，而且本次結果分數比 server 舊資料高，
         * 結果頁先顯示本次分數。
         */
        const finalScore =
          isMe && score > itemScore
            ? score
            : itemScore;

        return {
          rank: Number(item.rank || item.position || index + 1),
          position: Number(item.rank || item.position || index + 1),

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

          score: finalScore,
          bestScore: finalScore,
          bestRank: item.bestRank || item.rankTag || item.tier || "",
          isMe
        };
      });

    const hasMe = rows.some((item) => item.isMe);

    if (!hasMe) {
      const selfDisplayName =
        playerName && playerName !== "你"
          ? `${playerName}（你）`
          : "你";

      rows.push({
        rank: 999,
        position: 999,
        userId: myUserId,
        lineUserId: myUserId,
        name: selfDisplayName,
        playerName: selfDisplayName,
        displayName: selfDisplayName,
        pictureUrl: playerPictureUrl,
        score,
        bestScore: score,
        bestRank: "",
        isMe: true
      });
    } else {
      rows = rows.map((item) => {
        if (!item.isMe) return item;

        const fixedScore = Math.max(
          Number(item.score || 0),
          Number(score || 0)
        );

        return {
          ...item,
          name: item.name?.includes("（你）")
            ? item.name
            : `${item.name || playerName}（你）`,
          playerName: item.playerName?.includes("（你）")
            ? item.playerName
            : `${item.playerName || playerName}（你）`,
          displayName: item.displayName?.includes("（你）")
            ? item.displayName
            : `${item.displayName || playerName}（你）`,
          pictureUrl: item.pictureUrl || playerPictureUrl,
          score: fixedScore,
          bestScore: fixedScore
        };
      });
    }

    rows = rows
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        position: index + 1
      }));

    /*
     * 經典版型只顯示前三名。
     * 如果自己不在前三名，保留前二名 + 自己。
     */
    const meRow = rows.find((item) => item.isMe);
    let displayRows = rows.slice(0, 3);

    if (meRow && !displayRows.some((item) => item.isMe)) {
      displayRows = rows.slice(0, 2).concat(meRow);
    }

    while (displayRows.length < 3) {
      displayRows.push({
        rank: displayRows.length + 1,
        position: displayRows.length + 1,
        userId: "",
        lineUserId: "",
        name: "",
        playerName: "",
        displayName: "",
        pictureUrl: "",
        score: 0,
        bestScore: 0,
        bestRank: "",
        isMe: false,
        isPlaceholder: true
      });
    }

    list.innerHTML = displayRows
      .slice(0, 3)
      .map(renderFriendRankItem)
      .join("");
  }

  function renderFriendRankItem(item) {
    if (item.isPlaceholder) {
      return `
        <div class="zg-rank-item is-placeholder">
          <div class="zg-rank-pos">-</div>
          <div class="zg-rank-avatar"></div>
          <div class="zg-rank-main">
            <div class="zg-rank-name">等待好友加入</div>
            <div class="zg-rank-score">邀請好友一起挑戰</div>
          </div>
        </div>
      `;
    }

    const rank = Number(item.rank || item.position || 0);

    const medal =
      rank === 1
        ? "🥇"
        : rank === 2
          ? "🥈"
          : rank === 3
            ? "🥉"
            : String(rank);

    const name =
      item.name ||
      item.playerName ||
      item.displayName ||
      "LINE 玩家";

    const score =
      Number(item.score || item.bestScore || 0) || 0;

    const pictureUrl =
      item.pictureUrl ||
      item.avatar ||
      item.avatarUrl ||
      "";

    const avatarHtml = pictureUrl
      ? `
        <img
          src="${htmlEscape(pictureUrl)}"
          alt="${htmlEscape(name)}"
          loading="lazy"
        >
      `
      : `
        <span>${htmlEscape(name.slice(0, 1).toUpperCase())}</span>
      `;

    return `
      <div class="zg-rank-item ${item.isMe ? "is-me" : ""}">
        <div class="zg-rank-pos">${htmlEscape(medal)}</div>

        <div class="zg-rank-avatar">
          ${avatarHtml}
        </div>

        <div class="zg-rank-main">
          <div class="zg-rank-name">
            ${htmlEscape(name)}
          </div>

          <div class="zg-rank-score">
            ${htmlEscape(String(score))} pts
            ${item.bestRank ? `<span>${htmlEscape(item.bestRank)}</span>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  /*
   * =========================================================
   * 09-1. RESULT SYNC / GAS 與好友排行榜同步
   * =========================================================
   */

  function getProfilePayload(extra = {}) {
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
      "你";

    const pictureUrl =
      player.pictureUrl ||
      player.avatar ||
      player.avatarUrl ||
      "";

    const myReferralCode =
      typeof getMyReferralCode === "function"
        ? getMyReferralCode()
        : "";

    const inviterCode =
      typeof getSavedInviterReferralCode === "function"
        ? getSavedInviterReferralCode()
        : "";

    return {
      /*
       * LINE identity
       */
      userId,
      lineUserId: player.lineUserId || userId,
      ownerLineUserId: userId,

      displayName,
      playerName: displayName,
      name: displayName,

      pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      statusMessage: player.statusMessage || "",

      /*
       * Referral / invite
       */
      referralCode: myReferralCode,
      ownerReferralCode: myReferralCode,
      myReferralCode: myReferralCode,

      inviterReferralCode: inviterCode,
      inviterCode: inviterCode,

      lineInviteFriendCount:
        typeof getLineInviteFriendCount === "function"
          ? getLineInviteFriendCount()
          : 0,

      /*
       * LIFF context
       */
      liffId: window.ZELO_LIFF_ID || window.liffId || "",

      isLineUser: !!userId,

      isInLineClient:
        !!(
          window.liff &&
          typeof window.liff.isInClient === "function" &&
          window.liff.isInClient()
        ),

      pageUrl: location.href,
      userAgent: navigator.userAgent || "",

      ...extra
    };
  }

  function buildLineResultPayload(result = {}) {
    const profilePayload = getProfilePayload();

    const score =
      Number(
        result.score ??
        result.points ??
        result.totalScore ??
        result.finalScore ??
        0
      ) || 0;

    const couponCode =
      result.couponCode ||
      result.coupon ||
      state.lastCouponReward?.fixedCode ||
      state.lastCouponReward?.code ||
      "ZELO500";

    /*
     * 邀請人代碼：
     * 這裡只當 referral code 使用。
     * 不要塞進 inviterId / referrerId / fromUserId。
     */
    const inviterCode =
      result.inviterReferralCode ||
      result.inviterCode ||
      profilePayload.inviterReferralCode ||
      getSavedInviterReferralCode() ||
      "";

    const myReferralCode =
      result.referralCode ||
      profilePayload.referralCode ||
      getMyReferralCode();

    return {
      game: "zelo",
      version: VERSION,

      action: "save_result",
      eventType: "game_result",

      /*
       * LINE 使用者資料
       */
      userId: profilePayload.userId || "",
      lineUserId: profilePayload.lineUserId || profilePayload.userId || "",
      ownerLineUserId: profilePayload.userId || "",

      displayName: profilePayload.displayName || "你",
      playerName: profilePayload.playerName || profilePayload.displayName || "你",
      name: profilePayload.name || profilePayload.displayName || "你",

      pictureUrl: profilePayload.pictureUrl || "",
      avatar: profilePayload.avatar || profilePayload.pictureUrl || "",
      avatarUrl: profilePayload.avatarUrl || profilePayload.pictureUrl || "",

      statusMessage: profilePayload.statusMessage || "",
      isLineUser: !!profilePayload.userId,

      /*
       * 自己的 referral code
       */
      referralCode: myReferralCode,
      ownerReferralCode: myReferralCode,
      myReferralCode: myReferralCode,

      /*
       * 邀請人 referral code
       */
      inviterReferralCode: inviterCode,
      inviterCode: inviterCode,

      /*
       * 重要：
       * 這些欄位理論上是 LINE userId。
       * 目前沒有可靠 inviter LINE userId 時，留空。
       * 不要把 ZG_xxx 塞進來。
       */
      inviterId: "",
      inviterUserId: "",
      referrerId: "",
      fromUserId: "",

      campaignType: "line_liff_invite",

      lineInviteFriendCount:
        Number(
          result.lineInviteFriendCount ??
          profilePayload.lineInviteFriendCount ??
          getLineInviteFriendCount()
        ) || 0,

      /*
       * 戰鬥結果
       */
      result: result.result || "draw",
      finish: result.finish || "",

      score,
      points: score,
      bestScore: score,

      couponCode,

      /*
       * 陀螺資料
       */
      playerTopId: result.playerTopId || state.selectedTop?.id || "",
      playerTopName: result.playerTopName || state.selectedTop?.name || "",
      playerTopType: result.playerTopType || state.selectedTop?.type || "",
      playerTopImage: result.playerTopImage || state.selectedTop?.image || "",
      playerTopBattleImage:
        result.playerTopBattleImage ||
        state.selectedTop?.battleImage ||
        "",

      enemyTopId: result.enemyTopId || state.enemyTop?.id || "",
      enemyTopName: result.enemyTopName || state.enemyTop?.name || "",
      enemyTopType: result.enemyTopType || state.enemyTop?.type || "",
      enemyTopImage: result.enemyTopImage || state.enemyTop?.image || "",
      enemyTopBattleImage:
        result.enemyTopBattleImage ||
        state.enemyTop?.battleImage ||
        "",

      /*
       * 戰鬥數值
       */
      launchPower:
        typeof result.launchPower === "number"
          ? result.launchPower
          : "",

      launchGrade: result.launchGrade || "",

      playerHp: Number(result.playerHp ?? result.playerEnergy ?? 0) || 0,
      enemyHp: Number(result.enemyHp ?? result.enemyEnergy ?? 0) || 0,

      playerEnergy: Number(result.playerEnergy ?? result.playerHp ?? 0) || 0,
      enemyEnergy: Number(result.enemyEnergy ?? result.enemyHp ?? 0) || 0,

      playerSpin: Number(result.playerSpin ?? 0) || 0,
      enemySpin: Number(result.enemySpin ?? 0) || 0,

      durationMs: Number(result.durationMs ?? 0) || 0,

      /*
       * LIFF / 環境
       */
      liffId: window.ZELO_LIFF_ID || window.liffId || "",
      isInLineClient: profilePayload.isInLineClient,
      pageUrl: location.href,
      userAgent: navigator.userAgent || "",

      playedAt:
        result.playedAt ||
        result.timestamp ||
        new Date().toISOString(),

      ts: result.ts || Date.now()
    };
  }

  function makeResultFingerprint(payload) {
    return [
      payload.userId || "",
      payload.score || 0,
      payload.result || "",
      payload.finish || "",
      payload.playerTopId || "",
      payload.enemyTopId || "",
      Math.floor(Number(payload.ts || Date.now()) / 1000)
    ].join("|");
  }

  async function syncResultWithLineOnce(result = {}) {
    const payload = buildLineResultPayload(result);

    if (!payload.userId) {
      console.warn("[ZELO GAME] skip sync result: missing userId", payload);

      return {
        ok: false,
        skipped: true,
        reason: "missing_user_id",
        payload
      };
    }

    const fingerprint = makeResultFingerprint(payload);

    if (
      state.lastActionKey === fingerprint &&
      Date.now() - state.lastActionAt < 5000
    ) {
      return {
        ok: true,
        skipped: true,
        reason: "duplicate_in_memory",
        payload
      };
    }

    state.lastActionKey = fingerprint;
    state.lastActionAt = Date.now();

    console.log("[ZELO GAME] save_result payload:", payload);

    /*
     * POST 優先，失敗 fallback JSONP。
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
        throw new Error(data?.message || data?.error || "save_result failed");
      }

      console.log("[ZELO GAME] save_result response:", data);

      return data;
    } catch (error) {
      console.warn("[ZELO GAME] save_result POST failed, fallback JSONP:", error);

      const data = await jsonpApi("save_result", {
        ...payload,
        action: "save_result"
      });

      console.log("[ZELO GAME] save_result JSONP response:", data);

      return data;
    }
  }

  async function loadFriendRankFromServer(result = {}) {
    const profilePayload = getProfilePayload({
      source: "result_friend_rank"
    });

    if (!profilePayload.userId && !profilePayload.lineUserId) {
      return {
        ok: false,
        reason: "missing_user_id",
        result
      };
    }

    try {
      const data = await jsonpApi("friendRank", {
        ...profilePayload,

        userId: profilePayload.userId || profilePayload.lineUserId || "",
        lineUserId: profilePayload.lineUserId || profilePayload.userId || "",
        ownerLineUserId: profilePayload.ownerLineUserId || profilePayload.userId || "",

        referralCode: profilePayload.referralCode || "",
        ownerReferralCode: profilePayload.ownerReferralCode || profilePayload.referralCode || "",
        myReferralCode: profilePayload.myReferralCode || profilePayload.referralCode || "",

        inviterReferralCode: profilePayload.inviterReferralCode || "",
        inviterCode: profilePayload.inviterCode || ""
      });

      console.log("[ZELO GAME] friendRank payload:", profilePayload);
      console.log("[ZELO GAME] friendRank response:", data);

      window.ZELO_LAST_FRIEND_RANK_DEBUG = {
        payload: profilePayload,
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

      const myUserId =
        profilePayload.userId ||
        profilePayload.lineUserId ||
        "";

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
            item.bestScore ??
            item.score ??
            item.points ??
            item.totalScore ??
            0
          ) || 0;

        const isMeById =
          !!itemUserId &&
          !!myUserId &&
          String(itemUserId) === String(myUserId);

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

          score: itemScore,
          bestScore: itemScore,

          bestRank:
            item.bestRank ||
            item.rankTag ||
            item.tier ||
            "",

          isMe: item.isMe === true || item.me === true || isMeById
        };
      });

      return {
        ok: true,
        result: {
          ...result,
          friendRank,
          totalFriends: Number(
            data.totalFriends ||
            data.friendCount ||
            friendRank.length ||
            0
          ),
          lineInviteFriendCount:
            Number(
              data.lineInviteFriendCount ??
              data.referralCount ??
              data.count ??
              result.lineInviteFriendCount ??
              getLineInviteFriendCount()
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

  async function hydrateResultFriendRank(result = {}) {
    const loaded = await loadFriendRankFromServer(result);

    if (loaded && loaded.ok && loaded.result) {
      const updatedResult = loaded.result;

      const count =
        Number(
          updatedResult.lineInviteFriendCount ??
          result.lineInviteFriendCount ??
          getLineInviteFriendCount()
        ) || 0;

      setLineInviteFriendCount(count);

      try {
        localStorage.setItem(STORAGE.lastResult, JSON.stringify(updatedResult));
      } catch (error) {}

      return updatedResult;
    }

    return result;
  }

  async function handleShare() {
    const shareUrl = buildReferralUrl();
    const shareText =
      "我正在挑戰 ZELO 陀螺對決！點這裡加入遊戲，和我一起比排行：";

    track("share_click", {
      shareUrl
    });

    try {
      if (!window.liff) {
        await fallbackShare(shareText, shareUrl);
        return;
      }

      if (
        typeof window.liff.isLoggedIn === "function" &&
        !window.liff.isLoggedIn()
      ) {
        /*
         * 重要：
         * 不指定 redirectUri，避免 LINE OAuth 出現 Invalid redirect_uri。
         * redirect 交給 LIFF App Endpoint 處理。
         */
        window.liff.login();
        return;
      }

      if (
        typeof window.liff.isInClient === "function" &&
        window.liff.isInClient() &&
        typeof window.liff.shareTargetPicker === "function"
      ) {
        const result = await window.liff.shareTargetPicker([
          {
            type: "text",
            text: `${shareText}\n${shareUrl}`
          }
        ]);

        if (result) {
          track("share_success", {
            method: "shareTargetPicker"
          });
        } else {
          track("share_cancel", {
            method: "shareTargetPicker"
          });
        }

        return;
      }

      await fallbackShare(shareText, shareUrl);
    } catch (error) {
      console.warn("[ZELO GAME] handleShare failed:", error);

      await fallbackShare(shareText, shareUrl);
    }
  }

  async function fallbackShare(text, url) {
    const shareText = `${text}\n${url}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "ZELO 陀螺對決",
          text,
          url
        });

        track("share_success", {
          method: "navigator.share"
        });

        return;
      } catch (error) {
        /*
         * 使用者取消也走下面 copy。
         */
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);

      alert("邀請連結已複製，請貼到 LINE 分享給好友！");
    } catch (error) {
      window.prompt("請複製邀請連結", shareText);
    }
  }

  /*
   * =========================================================
   * 10. DAILY LIMIT / 每日遊玩次數限制
   * =========================================================
   */

  function todayKey() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  function getDailyState() {
    try {
      const raw = localStorage.getItem(STORAGE.daily);

      if (!raw) {
        return {
          date: todayKey(),
          count: 0
        };
      }

      const data = JSON.parse(raw);

      if (!data || data.date !== todayKey()) {
        return {
          date: todayKey(),
          count: 0
        };
      }

      return {
        date: data.date,
        count: Number(data.count || 0)
      };
    } catch (error) {
      return {
        date: todayKey(),
        count: 0
      };
    }
  }

  function setDailyState(next) {
    try {
      localStorage.setItem(STORAGE.daily, JSON.stringify(next));
    } catch (error) {}
  }

  function getTodayPlayCount() {
    return getDailyState().count;
  }

  function canPlayToday() {
    if (!DAILY_PLAY_LIMIT || DAILY_PLAY_LIMIT <= 0) {
      return true;
    }

    return getTodayPlayCount() < DAILY_PLAY_LIMIT;
  }

  function incrementDailyPlayCount() {
    if (!DAILY_PLAY_LIMIT || DAILY_PLAY_LIMIT <= 0) {
      return;
    }

    const daily = getDailyState();

    setDailyState({
      date: todayKey(),
      count: daily.count + 1
    });
  }

  async function ensureCanPlayBeforeStart() {
    if (canPlayToday()) {
      incrementDailyPlayCount();
      return true;
    }

    alert(`今天的挑戰次數已用完，請明天再來！`);

    return false;
  }

  /*
   * =========================================================
   * 11. LIFF / Profile Integration
   * =========================================================
   */

  function normalizeLineProfile(profile = {}) {
    const userId =
      profile.userId ||
      profile.lineUserId ||
      profile.sub ||
      profile.id ||
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
      profile.picture ||
      "";

    return {
      ...profile,

      userId,
      lineUserId: profile.lineUserId || userId,
      ownerLineUserId: profile.ownerLineUserId || userId,

      displayName,
      name: displayName,
      playerName: displayName,

      pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      isLineUser: !!userId
    };
  }

  function getProfile() {
    if (state.profile) {
      return state.profile;
    }

    try {
      const raw = localStorage.getItem(STORAGE.profile);
      if (raw) {
        return normalizeLineProfile(JSON.parse(raw));
      }
    } catch (error) {}

    return normalizeLineProfile({
      displayName: "你",
      userId: ""
    });
  }

  function setProfile(profile) {
    const normalized = normalizeLineProfile(profile);

    state.profile = normalized;

    try {
      localStorage.setItem(STORAGE.profile, JSON.stringify(normalized));
    } catch (error) {}

    return normalized;
  }

  function getCurrentLinePlayer() {
    return getProfile();
  }

  function getPlayerName() {
    const profile = getProfile();

    return (
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      "你"
    );
  }

  async function initLiffProfile() {
    const liffId =
      window.ZELO_LIFF_ID ||
      window.liffId ||
      "";

    if (!window.liff || !liffId) {
      return getProfile();
    }

    try {
      await window.liff.init({
        liffId
      });

      if (
        typeof window.liff.isLoggedIn === "function" &&
        !window.liff.isLoggedIn()
      ) {
        /*
         * 重要：
         * 不加 redirectUri，避免 Invalid redirect_uri。
         */
        window.liff.login();
        return getProfile();
      }

      if (typeof window.liff.getProfile === "function") {
        const profile = await window.liff.getProfile();

        const normalized = setProfile(profile);

        track("liff_profile_loaded", {
          userId: normalized.userId,
          displayName: normalized.displayName
        });

        return normalized;
      }

      return getProfile();
    } catch (error) {
      console.warn("[ZELO GAME] initLiffProfile failed:", error);

      track("liff_profile_failed", {
        message: String(error && error.message ? error.message : error)
      });

      return getProfile();
    }
  }

  /*
   * =========================================================
   * 12. REFERRAL INIT / 邀請參數初始化
   * =========================================================
   */

  function parseReferralFromUrl() {
    const params = new URLSearchParams(location.search || "");

    const code =
      params.get("ref") ||
      params.get("referralCode") ||
      params.get("inviter") ||
      params.get("inviterReferralCode") ||
      params.get("code") ||
      "";

    return normalizeReferralCode(code);
  }

  function normalizeReferralCode(code) {
    return String(code || "")
      .trim()
      .replace(/[^\w-]/g, "")
      .slice(0, 48);
  }

  function getSavedInviterReferralCode() {
    try {
      return normalizeReferralCode(localStorage.getItem(STORAGE.inviterCode) || "");
    } catch (error) {
      return "";
    }
  }

  function setSavedInviterReferralCode(code) {
    const normalized = normalizeReferralCode(code);

    if (!normalized) return "";

    try {
      localStorage.setItem(STORAGE.inviterCode, normalized);
    } catch (error) {}

    return normalized;
  }

  function ensureMyReferralCode() {
    try {
      let code = localStorage.getItem(STORAGE.myReferralCode);

      if (code) {
        return normalizeReferralCode(code);
      }

      const profile = getProfile();
      const base =
        profile.userId ||
        Math.random().toString(36).slice(2, 10);

      code =
        "ZG_" +
        String(base)
          .replace(/[^\w]/g, "")
          .slice(-10)
          .toUpperCase();

      localStorage.setItem(STORAGE.myReferralCode, code);

      return code;
    } catch (error) {
      return "ZG_" + Math.random().toString(36).slice(2, 10).toUpperCase();
    }
  }

  function getMyReferralCode() {
    return ensureMyReferralCode();
  }

  function buildReferralUrl() {
    const url = new URL(location.href);

    url.searchParams.set("ref", getMyReferralCode());

    /*
     * 不要把 OAuth code/state 繼續分享出去。
     */
    url.searchParams.delete("code");
    url.searchParams.delete("state");
    url.searchParams.delete("liff.state");

    return url.toString();
  }

  function bootInitialReferral() {
    const incoming = parseReferralFromUrl();
    const mine = getMyReferralCode();

    if (incoming && incoming !== mine) {
      setSavedInviterReferralCode(incoming);

      track("referral_received", {
        inviterReferralCode: incoming
      });
    }
  }

  function getLineInviteFriendCount() {
    return Number(state.lineInviteFriendCount || 0) || 0;
  }

  function setLineInviteFriendCount(count) {
    const value = Math.max(0, Number(count || 0));

    state.lineInviteFriendCount = value;

    try {
      localStorage.setItem(STORAGE.lineInviteFriendCount, String(value));
    } catch (error) {}
  }

  function restoreInitialState() {
    try {
      const inviteCount =
        Number(localStorage.getItem(STORAGE.lineInviteFriendCount) || 0) || 0;

      state.lineInviteFriendCount = inviteCount;
    } catch (error) {}

    try {
      const rawResult = localStorage.getItem(STORAGE.lastResult);

      if (rawResult) {
        state.lastBattleResult = JSON.parse(rawResult);
      }
    } catch (error) {}

    try {
      const rawCoupon = localStorage.getItem(STORAGE.lastCoupon);

      if (rawCoupon) {
        state.lastCouponReward = JSON.parse(rawCoupon);
      }
    } catch (error) {}

    state.selectedTop = restoreSelectedTop() || null;
  }

  /*
   * =========================================================
   * 13. API HELPERS / JSONP 與伺服器工具
   * =========================================================
   */

  function apiUrl(action, params = {}) {
    const url = new URL(GOOGLE_SCRIPT_URL);

    url.searchParams.set("action", action);

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (typeof value === "object") {
        url.searchParams.set(key, JSON.stringify(value));
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  function jsonpApi(action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName =
        "__zeloJsonp_" +
        Date.now() +
        "_" +
        Math.random().toString(36).slice(2);

      const script = document.createElement("script");

      const timeout = setTimeout(() => {
        cleanup();

        reject(new Error(`JSONP timeout: ${action}`));
      }, 12000);

      function cleanup() {
        try {
          delete window[callbackName];
        } catch (error) {
          window[callbackName] = undefined;
        }

        try {
          script.remove();
        } catch (error) {}

        clearTimeout(timeout);
      }

      window[callbackName] = (data) => {
        cleanup();

        resolve(data || {});
      };

      script.src = apiUrl(action, {
        ...params,
        callback: callbackName,
        _t: Date.now()
      });

      script.onerror = () => {
        cleanup();

        reject(new Error(`JSONP load failed: ${action}`));
      };

      document.head.appendChild(script);
    });
  }

  async function fetchReferralCountFromServer() {
    const profilePayload = getProfilePayload({
      source: "home_referral_count"
    });

    if (!profilePayload.userId && !profilePayload.referralCode) {
      return {
        ok: false,
        count: getLineInviteFriendCount()
      };
    }

    try {
      const data = await jsonpApi("referralCount", {
        ...profilePayload,
        userId: profilePayload.userId || "",
        lineUserId: profilePayload.lineUserId || profilePayload.userId || "",
        referralCode: profilePayload.referralCode || getMyReferralCode(),
        ownerReferralCode:
          profilePayload.ownerReferralCode ||
          profilePayload.referralCode ||
          getMyReferralCode()
      });

      const count =
        Number(
          data.lineInviteFriendCount ??
          data.referralCount ??
          data.successCount ??
          data.count ??
          0
        ) || 0;

      setLineInviteFriendCount(count);

      return {
        ok: true,
        count,
        lineInviteFriendCount: count,
        raw: data
      };
    } catch (error) {
      console.warn("[ZELO GAME] fetchReferralCountFromServer failed:", error);

      return {
        ok: false,
        count: getLineInviteFriendCount(),
        error
      };
    }
  }

  /*
   * =========================================================
   * 14. STORAGE HELPERS / 本機儲存工具
   * =========================================================
   */

  function persistSelectedTop(top) {
    if (!top) return;

    try {
      localStorage.setItem(STORAGE.selectedTop, top.id);
    } catch (error) {}
  }

  function restoreSelectedTop() {
    try {
      const id = localStorage.getItem(STORAGE.selectedTop);

      return getTopById(id);
    } catch (error) {
      return null;
    }
  }

  function getMyScore() {
    try {
      return Number(localStorage.getItem(STORAGE.myScore) || 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  function setMyScore(score) {
    try {
      localStorage.setItem(STORAGE.myScore, String(Math.max(0, Number(score || 0))));
    } catch (error) {}
  }

  function getFallbackReferralSuccessCount() {
    try {
      return Number(localStorage.getItem(STORAGE.fallbackReferralCount) || 0) || 0;
    } catch (error) {
      return 0;
    }
  }

  /*
   * =========================================================
   * 15. GAME DATA HELPERS / 遊戲資料工具
   * =========================================================
   */

  function getTopById(id) {
    return TOPS.find((top) => top.id === id) || null;
  }

  function chooseEnemyTop(playerTop) {
    const candidates = TOPS.filter((top) => !playerTop || top.id !== playerTop.id);

    return candidates[Math.floor(Math.random() * candidates.length)] || TOPS[0];
  }

  function getTypeAdvantage(playerType, enemyType) {
    /*
     * attack > stamina > defense > attack
     * balance neutral.
     */
    if (playerType === enemyType || playerType === "balance" || enemyType === "balance") {
      return {
        status: "neutral",
        text: "勢均力敵",
        multiplier: 1
      };
    }

    const wins = {
      attack: "stamina",
      stamina: "defense",
      defense: "attack"
    };

    if (wins[playerType] === enemyType) {
      return {
        status: "advantage",
        text: "屬性優勢",
        multiplier: 1.08
      };
    }

    return {
      status: "disadvantage",
      text: "屬性劣勢",
      multiplier: 0.94
    };
  }

  function getLaunchGrade(power) {
    const p = clamp(Number(power) || 0, 0, 1);

    if (p >= CHARGE.perfectMin && p <= CHARGE.perfectMax) {
      return {
        key: "perfect",
        label: "PERFECT",
        text: "完美發射",
        multiplier: 1.18
      };
    }

    if (p >= 0.72 && p < CHARGE.perfectMin) {
      return {
        key: "great",
        label: "GREAT",
        text: "強力發射",
        multiplier: 1.08
      };
    }

    if (p > CHARGE.perfectMax) {
      return {
        key: "over",
        label: "OVER",
        text: "過度蓄力",
        multiplier: 0.96
      };
    }

    if (p >= 0.45) {
      return {
        key: "good",
        label: "GOOD",
        text: "穩定發射",
        multiplier: 1
      };
    }

    return {
      key: "weak",
      label: "WEAK",
      text: "蓄力不足",
      multiplier: 0.86
    };
  }

  function resolveFinish(resultType, playerHp, enemyHp) {
    const diff = Math.abs(Number(playerHp || 0) - Number(enemyHp || 0));

    if (diff > 45) return "burst";
    if (diff > 18) return "ringout";

    return "spin";
  }

  function pickCouponReward() {
    const rewards = COUPON_REWARDS.length
      ? COUPON_REWARDS
      : [
          {
            label: "ZELO 專屬優惠券",
            amount: 100,
            fixedCode: "ZELO100"
          }
        ];

    const total = rewards.reduce((sum, item) => sum + Number(item.weight || 1), 0);
    let r = Math.random() * total;

    for (const item of rewards) {
      r -= Number(item.weight || 1);

      if (r <= 0) {
        return item;
      }
    }

    return rewards[0];
  }

  function getCouponCode(reward) {
    if (reward && reward.fixedCode) {
      return reward.fixedCode;
    }

    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();

    return `ZELO${reward?.amount || 100}-${suffix}`;
  }

  /*
   * =========================================================
   * 16. IMAGE HELPERS / 圖片輸出
   * =========================================================
   */

  function createTopImg(top, className = "") {
    if (!top) return "";

    if (top.image) {
      return `
        <img
          class="${htmlEscape(className)}"
          src="${htmlEscape(top.image)}"
          alt="${htmlEscape(top.name)}"
          loading="lazy"
        >
      `;
    }

    return `
      <div
        class="${htmlEscape(className)} zg-css-top"
        style="
          --top-a:${htmlEscape(top.colorA || "#57f2ff")};
          --top-b:${htmlEscape(top.colorB || "#ffe05f")};
        "
        aria-label="${htmlEscape(top.name)}"
      ></div>
    `;
  }

  function createBattleTopImg(top, className = "") {
    if (!top) return "";

    const src = top.battleImage || top.image;

    if (src) {
      return `
        <img
          class="${htmlEscape(className)}"
          src="${htmlEscape(src)}"
          alt="${htmlEscape(top.name)}"
          loading="eager"
          draggable="false"
        >
      `;
    }

    return createTopImg(top, className);
  }

  /*
   * =========================================================
   * 17. MATH / DOM / SANITIZE HELPERS
   * =========================================================
   */

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function getRoot() {
    return document.querySelector(ROOT_SELECTOR);
  }

  function setRootHtml(html) {
    const root = getRoot();

    if (!root) {
      throw new Error(`Root not found: ${ROOT_SELECTOR}`);
    }

    root.innerHTML = html;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function cssUrl(url) {
    return `url("${String(url || "").replace(/"/g, "%22")}")`;
  }

  function htmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function track(eventName, payload = {}) {
    try {
      console.log("[ZELO GAME]", eventName, payload);
    } catch (error) {}
  }

  /*
   * =========================================================
   * 18. BOOT / 啟動
   * =========================================================
   */

  async function boot() {
    restoreInitialState();

    /*
     * 先建立自己的 referral code。
     */
    ensureMyReferralCode();

    /*
     * 再解析網址邀請碼。
     */
    bootInitialReferral();

    /*
     * 優先渲染首頁，避免 LIFF 等待造成白畫面。
     */
    renderHome();

    /*
     * 背景初始化 LIFF。
     */
    initLiffProfile()
      .then((profile) => {
        /*
         * LIFF profile 載入後，重新確保 referral code。
         */
        ensureMyReferralCode();

        track("boot_profile_ready", {
          userId: profile.userId || "",
          displayName: profile.displayName || ""
        });

        /*
         * 若仍在首頁，更新 invite count / profile 狀態。
         */
        if (state.screen === "home") {
          renderHome();
        }

        return fetchReferralCountFromServer();
      })
      .then(() => {
        if (state.screen === "home") {
          renderHome();
        }
      })
      .catch((error) => {
        console.warn("[ZELO GAME] boot async init failed:", error);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, {
      once: true
    });
  } else {
    boot();
  }

})();
