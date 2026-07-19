/*
 * =========================================================
 * ZELO LIFF BOOT - Safe Profile Helper
 * Version: 202607200132-liff-redirect-safe
 *
 * 目的：
 * - 不主動使用 redirectUri: window.location.href
 * - 避免 Invalid redirect_uri
 * - 避免與 game.js 重複 liff.login
 * - 只在已登入時補 ZELO_PROFILE
 * =========================================================
 */

(function () {
  "use strict";

  var VERSION = "202607200132-liff-redirect-safe";

  function log() {
    try {
      console.log.apply(console, ["[ZELO LIFF BOOT]"].concat([].slice.call(arguments)));
    } catch (error) {}
  }

  function warn() {
    try {
      console.warn.apply(console, ["[ZELO LIFF BOOT]"].concat([].slice.call(arguments)));
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

  function getLiffId() {
    try {
      return (
        window.ZELO_LIFF_ID ||
        window.liffId ||
        document.getElementById("zelo-liff-game")?.getAttribute("data-liff-id") ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  function saveProfile(profile) {
    if (!profile) return null;

    window.ZELO_PROFILE = profile;
    window.ZELO_LIFF_PROFILE = profile;

    try {
      localStorage.setItem("zg_profile", JSON.stringify(profile));
    } catch (error) {}

    try {
      localStorage.setItem("ZELO_PROFILE", JSON.stringify(profile));
    } catch (error) {}

    return profile;
  }

  async function boot() {
    setStatus("liff-boot safe start");

    var liffId = getLiffId();

    if (!liffId) {
      setStatus("liff-boot skipped: missing liffId");
      return null;
    }

    if (!window.liff) {
      setStatus("liff-boot skipped: LIFF SDK missing");
      return null;
    }

    try {
      setStatus("liff-boot init LIFF...");

      await window.liff.init({
        liffId: liffId
      });

      setStatus("liff-boot LIFF initialized");

      var isLoggedIn =
        typeof window.liff.isLoggedIn === "function" &&
        window.liff.isLoggedIn();

      /*
       * 重要：
       * 預設不由 liff-boot 主動 login。
       * login 交給 game.js 的 initLiffProfile() 處理。
       */
      if (!isLoggedIn) {
        setStatus("liff-boot not logged in, leave login to game.js");

        if (window.ZELO_DISABLE_LIFF_BOOT_LOGIN !== false) {
          return null;
        }

        /*
         * 只有當你手動把 window.ZELO_DISABLE_LIFF_BOOT_LOGIN 設成 false，
         * 才會讓 liff-boot 主動登入。
         *
         * 而且這裡絕對不指定 redirectUri，
         * 避免 Invalid redirect_uri。
         */
        window.liff.login();
        return null;
      }

      if (typeof window.liff.getProfile !== "function") {
        setStatus("liff-boot getProfile unavailable");
        return null;
      }

      var profile = await window.liff.getProfile();

      saveProfile(profile);

      setStatus("liff-boot profile ready: " + (profile.displayName || profile.userId || ""));

      try {
        window.dispatchEvent(
          new CustomEvent("zelo:liff:profile", {
            detail: profile
          })
        );
      } catch (error) {}

      return profile;
    } catch (error) {
      warn("boot failed", error);

      setStatus(
        "liff-boot failed: " +
          String(error && error.message ? error.message : error)
      );

      return null;
    }
  }

  window.ZELO_LIFF_BOOT = {
    version: VERSION,
    boot: boot,
    saveProfile: saveProfile
  };

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
