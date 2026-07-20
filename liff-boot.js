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
   * Expose API
   * ---------------------------------------------------------
   */

  window.ZELO_LIFF_BOOT = {
    version: VERSION,

    boot: boot,
    saveProfile: saveProfile,
    loadSavedProfile: loadSavedProfile,
    normalizeProfile: normalizeProfile,

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
