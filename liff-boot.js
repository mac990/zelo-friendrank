/*
 * =========================================================
 * ZELO LIFF BOOT - Safe Profile Helper
 * Version: 202607210207-liff-redirect-safe-profile
 *
 * 目的：
 * - 不主動使用 redirectUri: window.location.href
 * - 避免 Invalid redirect_uri
 * - 避免與 game.js 重複 liff.login
 * - 預設只在已登入時補 ZELO_PROFILE
 * - 支援防重複 boot / normalize profile / debug status
 * =========================================================
 */

(function () {
  "use strict";

  var VERSION = "202607210207-liff-redirect-safe-profile";

  /*
   * ---------------------------------------------------------
   * Logging
   * ---------------------------------------------------------
   */

  function log() {
    try {
      console.log.apply(
        console,
        ["[ZELO LIFF BOOT]"].concat([].slice.call(arguments))
      );
    } catch (error) {}
  }

  function warn() {
    try {
      console.warn.apply(
        console,
        ["[ZELO LIFF BOOT]"].concat([].slice.call(arguments))
      );
    } catch (error) {}
  }

  function setStatus(text) {
    try {
      window.ZELO_LIFF_BOOT_STATUS = text;

      if (typeof window.zgStatus === "function") {
        window.zgStatus(text);
      }

      log(text);
    } catch (error) {}
  }

  /*
   * ---------------------------------------------------------
   * Helpers
   * ---------------------------------------------------------
   */

  function getLiffId() {
    try {
      return (
        window.ZELO_LIFF_ID ||
        window.liffId ||
        document.getElementById("zelo-liff-game")?.getAttribute("data-liff-id") ||
        document.querySelector('meta[name="zelo-liff-id"]')?.content ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  function normalizeProfile(profile) {
    profile = profile || {};

    var displayName =
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      profile.nickname ||
      "LINE 玩家";

    var userId =
      profile.userId ||
      profile.lineUserId ||
      profile.sub ||
      "";

    var pictureUrl =
      profile.pictureUrl ||
      profile.avatar ||
      profile.avatarUrl ||
      "";

    return {
      userId: userId,
      lineUserId: userId,

      displayName: displayName,
      name: displayName,
      playerName: displayName,
      nickname: displayName,

      pictureUrl: pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      statusMessage: profile.statusMessage || "",

      raw: profile
    };
  }

  function saveProfile(profile) {
    if (!profile) return null;

    var normalized = normalizeProfile(profile);

    window.ZELO_PROFILE = normalized;
    window.ZELO_LIFF_PROFILE = normalized;

    try {
      localStorage.setItem("zg_profile", JSON.stringify(normalized));
    } catch (error) {}

    try {
      localStorage.setItem("ZELO_PROFILE", JSON.stringify(normalized));
    } catch (error) {}

    return normalized;
  }

  function loadSavedProfile() {
    var profile = null;

    try {
      if (window.ZELO_PROFILE) {
        profile = window.ZELO_PROFILE;
      }
    } catch (error) {}

    if (!profile) {
      try {
        var saved = localStorage.getItem("zg_profile");

        if (saved) {
          profile = JSON.parse(saved);
        }
      } catch (error) {}
    }

    if (!profile) {
      try {
        var savedLine = localStorage.getItem("ZELO_PROFILE");

        if (savedLine) {
          profile = JSON.parse(savedLine);
        }
      } catch (error) {}
    }

    if (profile) {
      return saveProfile(profile);
    }

    return null;
  }

  function dispatchProfile(profile) {
    try {
      window.dispatchEvent(
        new CustomEvent("zelo:liff:profile", {
          detail: profile
        })
      );
    } catch (error) {}
  }

  /*
   * ---------------------------------------------------------
   * LIFF Boot
   * ---------------------------------------------------------
   */

  async function boot() {
    if (window.__ZELO_LIFF_BOOT_RUNNING) {
      setStatus("liff-boot skipped: already running");
      return window.ZELO_PROFILE || loadSavedProfile() || null;
    }

    if (window.__ZELO_LIFF_BOOT_DONE) {
      setStatus("liff-boot skipped: already done");
      return window.ZELO_PROFILE || loadSavedProfile() || null;
    }

    window.__ZELO_LIFF_BOOT_RUNNING = true;

    setStatus("liff-boot safe start");

    try {
      /*
       * 先載入本機快取。
       * 即使 LIFF SDK 不存在，game.js 也還是可以讀 ZELO_PROFILE。
       */
      loadSavedProfile();

      var liffId = getLiffId();

      if (!liffId) {
        setStatus("liff-boot skipped: missing liffId");
        return window.ZELO_PROFILE || null;
      }

      if (!window.liff) {
        setStatus("liff-boot skipped: LIFF SDK missing");
        return window.ZELO_PROFILE || null;
      }

      setStatus("liff-boot init LIFF...");

      await window.liff.init({
        liffId: liffId
      });

      window.__ZELO_LIFF_BOOT_DONE = true;

      setStatus("liff-boot LIFF initialized");

      var isLoggedIn =
        typeof window.liff.isLoggedIn === "function" &&
        window.liff.isLoggedIn();

      /*
       * 重要：
       * 預設不由 liff-boot 主動 login。
       * 若使用者已登入，這裡只補 ZELO_PROFILE。
       * game.js 也只讀取既有 profile，不強制登入。
       *
       * 若你真的要讓 liff-boot 主動 login，
       * 請在載入本檔前設定：
       *
       * window.ZELO_ENABLE_LIFF_BOOT_LOGIN = true;
       *
       * 注意：
       * 這裡不指定 redirectUri，避免 Invalid redirect_uri。
       */
      if (!isLoggedIn) {
        setStatus("liff-boot not logged in");

        if (window.ZELO_ENABLE_LIFF_BOOT_LOGIN === true) {
          setStatus("liff-boot login start");

          window.liff.login();
          return null;
        }

        setStatus("liff-boot login skipped");
        return window.ZELO_PROFILE || null;
      }

      if (typeof window.liff.getProfile !== "function") {
        setStatus("liff-boot getProfile unavailable");
        return window.ZELO_PROFILE || null;
      }

      var profile = await window.liff.getProfile();
      var saved = saveProfile(profile);

      setStatus(
        "liff-boot profile ready: " +
          ((saved && (saved.displayName || saved.userId)) || "")
      );

      dispatchProfile(saved);

      /*
       * 若網址帶有 ref / inviterReferralCode，
       * 自動登記邀請關係。
       */
      try {
        await registerReferralFromUrl();
      } catch (referralError) {
        warn("auto register referral failed", referralError);
      }

      return saved;

    } catch (error) {
      warn("boot failed", error);

      setStatus(
        "liff-boot failed: " +
          String(error && error.message ? error.message : error)
      );

      return window.ZELO_PROFILE || loadSavedProfile() || null;
    } finally {
      window.__ZELO_LIFF_BOOT_RUNNING = false;
    }
  }



    /*
   * ---------------------------------------------------------
   * LINE Share / Referral Helpers
   * ---------------------------------------------------------
   */

  function getGasApiUrl() {
    try {
      return (
        window.ZELO_GAS_API_URL ||
        window.ZG_GAS_API_URL ||
        window.GAS_API_URL ||
        document.getElementById("zelo-liff-game")?.getAttribute("data-gas-url") ||
        document.querySelector('meta[name="zelo-gas-api-url"]')?.content ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  function getGameShareBaseUrl() {
    try {
      return (
        window.ZELO_LIFF_SHARE_URL ||
        window.ZELO_GAME_SHARE_URL ||
        document.getElementById("zelo-liff-game")?.getAttribute("data-share-url") ||
        document.querySelector('meta[name="zelo-share-url"]')?.content ||
        window.location.origin + window.location.pathname
      );
    } catch (error) {
      return window.location.href.split("?")[0];
    }
  }

  function buildShareUrl(referralCode) {
    var baseUrl = getGameShareBaseUrl();

    try {
      var url = new URL(baseUrl, window.location.origin);

      if (referralCode) {
        url.searchParams.set("ref", referralCode);
        url.searchParams.set("inviterReferralCode", referralCode);
      }

      url.searchParams.set("source", "line_liff_share");

      return url.toString();
    } catch (error) {
      var joiner = baseUrl.indexOf("?") >= 0 ? "&" : "?";

      return (
        baseUrl +
        joiner +
        "ref=" +
        encodeURIComponent(referralCode || "") +
        "&inviterReferralCode=" +
        encodeURIComponent(referralCode || "") +
        "&source=line_liff_share"
      );
    }
  }

  async function postToGas(payload) {
    var gasUrl = getGasApiUrl();

    if (!gasUrl) {
      throw new Error("Missing ZELO_GAS_API_URL");
    }

    var response = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload || {})
    });

    return response.json();
  }

  async function getOrCreateReferralCode(profile) {
    profile = profile || window.ZELO_PROFILE || loadSavedProfile() || {};

    var userId =
      profile.userId ||
      profile.lineUserId ||
      "";

    if (!userId) {
      throw new Error("Missing LINE userId");
    }

    var result = await postToGas({
      action: "get_liff_referral_code",
      userId: userId,
      lineUserId: userId,
      displayName: profile.displayName || profile.playerName || "LINE 玩家",
      playerName: profile.displayName || profile.playerName || "LINE 玩家",
      pictureUrl: profile.pictureUrl || profile.avatar || ""
    });

    if (!result || !result.ok) {
      throw new Error(
        "Get referral code failed: " +
          String(result && (result.message || result.code) || "")
      );
    }

    return (
      result.referralCode ||
      result.myReferralCode ||
      result.ownerReferralCode ||
      result.code ||
      ""
    );
  }

  async function logShareEvent(profile, referralCode, shareUrl) {
    try {
      profile = profile || window.ZELO_PROFILE || loadSavedProfile() || {};

      var userId =
        profile.userId ||
        profile.lineUserId ||
        "";

      if (!userId) return null;

      return await postToGas({
        action: "referral_share_sent",
        eventType: "share",
        userId: userId,
        lineUserId: userId,
        playerName: profile.displayName || profile.playerName || "LINE 玩家",
        displayName: profile.displayName || profile.playerName || "LINE 玩家",
        referralCode: referralCode || "",
        pageUrl: shareUrl || "",
        source: "line_liff_share",
        version: VERSION
      });
    } catch (error) {
      warn("logShareEvent failed", error);
      return null;
    }
  }

  function getReferralCodeFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);

      return (
        params.get("inviterReferralCode") ||
        params.get("ref") ||
        params.get("invite") ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  async function registerReferralFromUrl() {
    try {
      var inviterReferralCode = getReferralCodeFromUrl();

      if (!inviterReferralCode) {
        setStatus("referral skipped: no ref in url");
        return {
          ok: true,
          skipped: true,
          reason: "NO_REF"
        };
      }

      var profile =
        window.ZELO_PROFILE ||
        window.ZELO_LIFF_PROFILE ||
        loadSavedProfile();

      if (!profile || !profile.userId) {
        if (window.liff && typeof window.liff.isLoggedIn === "function" && window.liff.isLoggedIn()) {
          var rawProfile = await window.liff.getProfile();
          profile = saveProfile(rawProfile);
        }
      }

      if (!profile || !profile.userId) {
        setStatus("referral skipped: missing profile");
        return {
          ok: false,
          skipped: true,
          reason: "MISSING_PROFILE"
        };
      }

      var myReferralCode = "";

      try {
        myReferralCode = await getOrCreateReferralCode(profile);
      } catch (errorCode) {
        warn("get own referral code failed", errorCode);
      }

      /*
       * 防止自己點自己的邀請連結。
       */
      if (
        myReferralCode &&
        String(myReferralCode) === String(inviterReferralCode)
      ) {
        setStatus("referral skipped: self referral");
        return {
          ok: true,
          skipped: true,
          reason: "SELF_REFERRAL",
          inviterReferralCode: inviterReferralCode,
          myReferralCode: myReferralCode
        };
      }

      var result = await postToGas({
        action: "register_liff_referral",

        inviterReferralCode: inviterReferralCode,

        referredReferralCode: myReferralCode,
        referredUserId: profile.userId,
        lineUserId: profile.userId,
        referredPlayerName: profile.displayName || profile.playerName || "LINE 玩家",

        source: "line_liff_share",
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        version: VERSION
      });

      setStatus("referral registered: " + String(result && result.code || result && result.result || ""));

      return result;
    } catch (error) {
      warn("registerReferralFromUrl failed", error);

      setStatus(
        "referral failed: " +
          String(error && error.message ? error.message : error)
      );

      return {
        ok: false,
        code: "REFERRAL_REGISTER_ERROR",
        message: String(error && error.message ? error.message : error)
      };
    }
  }

  async function shareToLine(options) {
    options = options || {};

    try {
      if (!window.liff) {
        alert("LINE LIFF 尚未載入，請稍後再試。");
        return {
          ok: false,
          code: "LIFF_MISSING"
        };
      }

      /*
       * 若尚未 boot，先 boot。
       */
      if (!window.__ZELO_LIFF_BOOT_DONE) {
        await boot();
      }

      if (
        typeof window.liff.isInClient === "function" &&
        !window.liff.isInClient()
      ) {
        alert("請在 LINE App 內開啟遊戲後分享。");
        return {
          ok: false,
          code: "NOT_IN_LINE_CLIENT"
        };
      }

      if (
        typeof window.liff.isLoggedIn === "function" &&
        !window.liff.isLoggedIn()
      ) {
        /*
         * 這裡不指定 redirectUri，避免 Invalid redirect_uri。
         */
        window.liff.login();
        return {
          ok: false,
          code: "LOGIN_REQUIRED"
        };
      }

      var profile =
        window.ZELO_PROFILE ||
        window.ZELO_LIFF_PROFILE ||
        loadSavedProfile();

      if (!profile && typeof window.liff.getProfile === "function") {
        var rawProfile = await window.liff.getProfile();
        profile = saveProfile(rawProfile);
      }

      if (!profile || !profile.userId) {
        alert("無法取得 LINE 使用者資料，請重新開啟遊戲。");
        return {
          ok: false,
          code: "PROFILE_MISSING"
        };
      }

      var referralCode = await getOrCreateReferralCode(profile);

      if (!referralCode) {
        alert("邀請碼產生失敗，請稍後再試。");
        return {
          ok: false,
          code: "REFERRAL_CODE_MISSING"
        };
      }

      var shareUrl = buildShareUrl(referralCode);

      var displayName =
        profile.displayName ||
        profile.playerName ||
        "LINE 玩家";

      var shareText =
        options.text ||
        (
          displayName +
          " 邀請你一起玩 ZELO 陀螺遊戲！\n\n" +
          "挑戰對戰、賺 ZELO Points、抽限定獎勵。\n\n" +
          "點這裡開始：\n" +
          shareUrl
        );

      var messages;

      /*
       * 預設先用純文字，最穩。
       * 之後若要 Flex 卡片，再把 window.ZELO_USE_FLEX_SHARE = true。
       */
      if (window.ZELO_USE_FLEX_SHARE === true) {
        var imageUrl =
          options.imageUrl ||
          window.ZELO_SHARE_IMAGE_URL ||
          "";

        if (imageUrl) {
          messages = [
            {
              type: "flex",
              altText: "我在 ZELO 陀螺遊戲等你挑戰！",
              contents: {
                type: "bubble",
                hero: {
                  type: "image",
                  url: imageUrl,
                  size: "full",
                  aspectRatio: "20:13",
                  aspectMode: "cover"
                },
                body: {
                  type: "box",
                  layout: "vertical",
                  spacing: "md",
                  contents: [
                    {
                      type: "text",
                      text: "ZELO 陀螺遊戲",
                      weight: "bold",
                      size: "xl",
                      color: "#111827"
                    },
                    {
                      type: "text",
                      text: displayName + " 邀請你一起挑戰陀螺對戰，賺 ZELO Points 抽獎！",
                      size: "sm",
                      color: "#4B5563",
                      wrap: true
                    },
                    {
                      type: "text",
                      text: "邀請碼：" + referralCode,
                      weight: "bold",
                      size: "sm",
                      color: "#F59E0B",
                      wrap: true
                    }
                  ]
                },
                footer: {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "button",
                      style: "primary",
                      color: "#111827",
                      action: {
                        type: "uri",
                        label: "開始遊戲",
                        uri: shareUrl
                      }
                    }
                  ]
                }
              }
            }
          ];
        }
      }

      if (!messages) {
        messages = [
          {
            type: "text",
            text: shareText
          }
        ];
      }

      if (typeof window.liff.shareTargetPicker !== "function") {
        alert("目前 LINE 版本不支援分享功能，請更新 LINE App 後再試。");
        return {
          ok: false,
          code: "SHARE_TARGET_PICKER_UNAVAILABLE"
        };
      }

      var shareResult = await window.liff.shareTargetPicker(messages);

      await logShareEvent(profile, referralCode, shareUrl);

      setStatus("line share done");

      return {
        ok: true,
        code: "OK",
        referralCode: referralCode,
        shareUrl: shareUrl,
        result: shareResult || null
      };
    } catch (error) {
      warn("shareToLine failed", error);

      alert("分享失敗，請稍後再試。");

      return {
        ok: false,
        code: "LINE_SHARE_ERROR",
        message: String(error && error.message ? error.message : error)
      };
    }
  }




  
  /*
   * ---------------------------------------------------------
   * Expose API
   * ---------------------------------------------------------
   */

    window.ZELO_LIFF_BOOT = {
    version: VERSION,

    boot: boot,
    saveProfile: saveProfile,
    loadSavedProfile: loadSavedProfile,
    normalizeProfile: normalizeProfile,

    shareToLine: shareToLine,
    registerReferralFromUrl: registerReferralFromUrl,
    getOrCreateReferralCode: getOrCreateReferralCode,
    buildShareUrl: buildShareUrl,
    getReferralCodeFromUrl: getReferralCodeFromUrl,


    getStatus: function () {
      return window.ZELO_LIFF_BOOT_STATUS || "";
    },

    getProfile: function () {
      return window.ZELO_PROFILE || loadSavedProfile() || null;
    },

    clearProfile: function () {
      try {
        localStorage.removeItem("zg_profile");
      } catch (error) {}

      try {
        localStorage.removeItem("ZELO_PROFILE");
      } catch (error) {}

      try {
        delete window.ZELO_PROFILE;
      } catch (error) {
        window.ZELO_PROFILE = null;
      }

      try {
        delete window.ZELO_LIFF_PROFILE;
      } catch (error) {
        window.ZELO_LIFF_PROFILE = null;
      }

      setStatus("liff-boot profile cleared");

      return true;
    },

    resetBootFlags: function () {
      window.__ZELO_LIFF_BOOT_RUNNING = false;
      window.__ZELO_LIFF_BOOT_DONE = false;

      setStatus("liff-boot flags reset");

      return true;
    },

    debug: function () {
      var info = {
        version: VERSION,
        status: window.ZELO_LIFF_BOOT_STATUS || "",
        hasLiffSdk: !!window.liff,
        liffId: getLiffId(),
        bootRunning: !!window.__ZELO_LIFF_BOOT_RUNNING,
        bootDone: !!window.__ZELO_LIFF_BOOT_DONE,
        profile: window.ZELO_PROFILE || loadSavedProfile() || null
      };

      try {
        if (window.liff && typeof window.liff.isLoggedIn === "function") {
          info.isLoggedIn = window.liff.isLoggedIn();
        }
      } catch (error) {
        info.isLoggedInError = String(error && error.message ? error.message : error);
      }

      console.table(info);

      return info;
    }
  };

  /*
   * ---------------------------------------------------------
   * Auto Start
   * ---------------------------------------------------------
   */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        boot();
      },
      {
        once: true
      }
    );
  } else {
    boot();
  }
})();
