(function () {
  "use strict";

  var LIFF_SDK_URL = "https://static.line-scdn.net/liff/edge/2/sdk.js";

  function log() {
    try {
      console.log.apply(console, arguments);
    } catch (err) {}
  }

  function warn() {
    try {
      console.warn.apply(console, arguments);
    } catch (err) {}
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(text) {
    window.ZELO_LIFF_BOOT_STATUS = text || "";

    var el = byId("zg-liff-status");

    if (el) {
      el.textContent = text || "";
    }

    log("[ZELO LIFF BOOT]", text);
  }

  function isShopifyEditor() {
    var href = String(window.location.href || "");
    var search = String(window.location.search || "");

    if (window.Shopify && window.Shopify.designMode) return true;
    if (href.indexOf("/admin/") !== -1) return true;
    if (href.indexOf("myshopify.com/admin") !== -1) return true;
    if (search.indexOf("preview_theme_id=") !== -1) return true;
    if (search.indexOf("_ab=") !== -1) return true;
    if (search.indexOf("_fd=") !== -1) return true;
    if (search.indexOf("pb=") !== -1) return true;

    try {
      if (window.self !== window.top) return true;
    } catch (err) {
      return true;
    }

    return false;
  }

  function getRoot() {
    return byId("zelo-liff-game");
  }

  function getLiffId() {
    var root = getRoot();

    if (root) {
      var fromDom = root.getAttribute("data-liff-id");

      if (fromDom) {
        return fromDom;
      }
    }

    if (window.ZELO_LIFF_ID) {
      return window.ZELO_LIFF_ID;
    }

    if (window.liffId) {
      return window.liffId;
    }

    return "2007022255-ph9gRwPs";
  }

  function getGoogleApi() {
    var root = getRoot();

    if (root) {
      var fromDom = root.getAttribute("data-google-record-api");

      if (fromDom) {
        return fromDom;
      }
    }

    if (window.ZELO_GOOGLE_RECORD_API) {
      return window.ZELO_GOOGLE_RECORD_API;
    }

    if (window.GOOGLE_SCRIPT_URL) {
      return window.GOOGLE_SCRIPT_URL;
    }

    return "";
  }

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (err) {
      return fallback;
    }
  }

  function getCurrentProfile() {
    if (window.ZELO_PROFILE) {
      return window.ZELO_PROFILE;
    }

    if (window.ZELO_LIFF_PROFILE) {
      return window.ZELO_LIFF_PROFILE;
    }

    try {
      var saved = localStorage.getItem("zg_profile");

      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {}

    try {
      var savedLine = localStorage.getItem("ZELO_PROFILE");

      if (savedLine) {
        return JSON.parse(savedLine);
      }
    } catch (err) {}

    return null;
  }

  function getDecodedLiffStateParams() {
    try {
      var url = new URL(window.location.href);
      var liffState = url.searchParams.get("liff.state") || "";

      if (!liffState) {
        return new URLSearchParams("");
      }

      var decoded = decodeURIComponent(liffState);
      var query = "";

      if (decoded.indexOf("?") !== -1) {
        query = decoded.slice(decoded.indexOf("?") + 1);
      } else {
        query = decoded.replace(/^\?/, "");
      }

      return new URLSearchParams(query);
    } catch (err) {
      return new URLSearchParams("");
    }
  }

  function getUrlParam(name) {
    try {
      var url = new URL(window.location.href);

      /*
       * 一般網址：
       * ?ref=ZG_xxxxx
       */
      var direct = url.searchParams.get(name) || "";

      if (direct) {
        return direct;
      }

      /*
       * LINE LIFF 常見：
       * ?liff.state=%3Fref%3DZG_xxxxx
       */
      var stateParams = getDecodedLiffStateParams();

      return stateParams.get(name) || "";
    } catch (err) {
      return "";
    }
  }

  function getInviteParams() {
    return {
      inviterId:
        getUrlParam("inviterId") ||
        getUrlParam("inviter") ||
        getUrlParam("ref") ||
        getUrlParam("referrerId") ||
        getUrlParam("fromUserId") ||
        getUrlParam("referralCode") ||
        getUrlParam("invite") ||
        "",

      referralCode:
        getUrlParam("referralCode") ||
        getUrlParam("ref") ||
        getUrlParam("invite") ||
        "",

      inviterName:
        getUrlParam("inviterName") ||
        getUrlParam("refName") ||
        getUrlParam("referrerName") ||
        "",

      inviterPictureUrl:
        getUrlParam("inviterPictureUrl") ||
        getUrlParam("refPictureUrl") ||
        getUrlParam("referrerPictureUrl") ||
        ""
    };
  }

  function buildRedirectUriPreserveParams() {
    try {
      var url = new URL(window.location.href);

      [
        "access_token",
        "id_token",
        "client_id",
        "scope",
        "state",
        "code",
        "friendship_status_changed",
        "error",
        "error_description"
      ].forEach(function (key) {
        url.searchParams.delete(key);
      });

      /*
       * 注意：
       * 不刪 liff.state，避免登入後邀請參數消失。
       */

      return url.toString();
    } catch (err) {
      return window.location.href;
    }
  }

  function normalizeEventType(eventType) {
    var t = String(eventType || "").toLowerCase().trim();

    if (!t) return "";

    if (t === "copy-coupon") return "coupon_copy";
    if (t === "copycoupon") return "coupon_copy";
    if (t === "couponcopy") return "coupon_copy";
    if (t === "copy_coupon") return "coupon_copy";
    if (t === "download-coupon") return "coupon_copy";

    if (t === "officialsite") return "official_click";
    if (t === "gowebsite") return "official_click";
    if (t === "website") return "official_click";
    if (t === "shop_click") return "official_click";

    if (t === "share_click") return "share";
    if (t === "share") return "share";

    if (t === "playagain") return "play_again";
    if (t === "replay_click") return "play_again";

    if (t === "couponused") return "coupon_redeem";
    if (t === "redeem") return "coupon_redeem";

    return t;
  }

  function normalizeProfile(profile) {
    profile = profile || {};

    var userId =
      profile.userId ||
      profile.id ||
      profile.uid ||
      profile.lineUserId ||
      profile.sub ||
      "";

    var displayName =
      profile.displayName ||
      profile.name ||
      profile.playerName ||
      profile.lineDisplayName ||
      "LINE 玩家";

    var pictureUrl =
      profile.pictureUrl ||
      profile.avatar ||
      profile.avatarUrl ||
      profile.image ||
      profile.photoURL ||
      "";

    return {
      userId: userId,
      id: userId,
      uid: userId,
      lineUserId: userId,

      displayName: displayName,
      name: displayName,
      playerName: displayName,

      pictureUrl: pictureUrl,
      avatar: pictureUrl,
      avatarUrl: pictureUrl,

      statusMessage: profile.statusMessage || "",

      raw: profile
    };
  }

  function saveProfile(profile) {
    var normalized = normalizeProfile(profile);

    window.ZELO_PROFILE = normalized;
    window.ZELO_LIFF_PROFILE = normalized;

    try {
      localStorage.setItem("zg_profile", JSON.stringify(normalized));
    } catch (err) {}

    try {
      localStorage.setItem("ZELO_PROFILE", JSON.stringify(normalized));
    } catch (err) {}

    try {
      window.dispatchEvent(
        new CustomEvent("zelo:liff:profile-ready", {
          detail: normalized
        })
      );
    } catch (err) {}

    return normalized;
  }

  function enrichPayload(payload) {
    payload = payload || {};

    var profile = getCurrentProfile() || {};
    var inviteParams = getInviteParams();

    var merged = {};

    Object.keys(payload).forEach(function (key) {
      merged[key] = payload[key];
    });

    if (merged.eventType) {
      merged.eventType = normalizeEventType(merged.eventType);
    }

    if (!merged.action && merged.eventType) {
      merged.action = merged.eventType;
    }

    if (!merged.userId && profile.userId) merged.userId = profile.userId;
    if (!merged.userId && profile.id) merged.userId = profile.id;

    if (!merged.lineUserId && profile.lineUserId) merged.lineUserId = profile.lineUserId;
    if (!merged.lineUserId && profile.userId) merged.lineUserId = profile.userId;

    if (!merged.displayName && profile.displayName) merged.displayName = profile.displayName;
    if (!merged.displayName && profile.name) merged.displayName = profile.name;

    if (!merged.playerName && profile.playerName) merged.playerName = profile.playerName;
    if (!merged.playerName && profile.displayName) merged.playerName = profile.displayName;
    if (!merged.playerName && profile.name) merged.playerName = profile.name;

    if (!merged.name && profile.displayName) merged.name = profile.displayName;

    if (!merged.pictureUrl && profile.pictureUrl) merged.pictureUrl = profile.pictureUrl;
    if (!merged.avatar && profile.pictureUrl) merged.avatar = profile.pictureUrl;
    if (!merged.avatarUrl && profile.pictureUrl) merged.avatarUrl = profile.pictureUrl;

    if (!merged.inviterId && inviteParams.inviterId) merged.inviterId = inviteParams.inviterId;
    if (!merged.inviterReferralCode && inviteParams.referralCode) {
      merged.inviterReferralCode = inviteParams.referralCode;
    }

    if (!merged.referrerId && inviteParams.inviterId) merged.referrerId = inviteParams.inviterId;
    if (!merged.fromUserId && inviteParams.inviterId) merged.fromUserId = inviteParams.inviterId;

    if (!merged.inviterName && inviteParams.inviterName) merged.inviterName = inviteParams.inviterName;
    if (!merged.inviterPictureUrl && inviteParams.inviterPictureUrl) {
      merged.inviterPictureUrl = inviteParams.inviterPictureUrl;
    }

    if (!merged.liffId) merged.liffId = getLiffId();
    if (!merged.pageUrl) merged.pageUrl = window.location.href;
    if (!merged.userAgent) merged.userAgent = navigator.userAgent || "";

    if (
      !merged.isInLineClient &&
      window.liff &&
      typeof window.liff.isInClient === "function"
    ) {
      merged.isInLineClient = window.liff.isInClient();
    }

    if (!merged.timestamp && !merged.playedAt) {
      merged.timestamp = new Date().toISOString();
    }

    return merged;
  }

  function setupGoogleSync() {
    var api = getGoogleApi();

    window.ZELO_GOOGLE_RECORD_API = api || "";
    window.GOOGLE_SCRIPT_URL = api || window.GOOGLE_SCRIPT_URL || "";

    window.ZELO_SYNC_SCORE_TO_GOOGLE = async function (payload) {
      var enriched = enrichPayload(payload || {});

      if (!window.ZELO_GOOGLE_RECORD_API) {
        return {
          ok: false,
          skipped: true,
          reason: "missing_google_api",
          payload: enriched
        };
      }

      try {
        var response = await fetch(window.ZELO_GOOGLE_RECORD_API, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(enriched)
        });

        var text = await response.text();
        var data = safeJsonParse(text, {
          ok: response.ok,
          raw: text
        });

        if (!response.ok) {
          return {
            ok: false,
            status: response.status,
            data: data,
            payload: enriched
          };
        }

        return {
          ok: true,
          data: data,
          payload: enriched
        };
      } catch (err) {
        /*
         * CORS 失敗時，備援 no-cors。
         * no-cors 無法讀 response，但至少可送到 GAS。
         */
        try {
          await fetch(window.ZELO_GOOGLE_RECORD_API, {
            method: "POST",
            mode: "no-cors",
            headers: {
              "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(enriched)
          });

          return {
            ok: true,
            fallback: "no-cors",
            payload: enriched
          };
        } catch (err2) {
          return {
            ok: false,
            error: String(err2 && err2.message ? err2.message : err2),
            payload: enriched
          };
        }
      }
    };
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');

      if (existing) {
        resolve();
        return;
      }

      var script = document.createElement("script");

      script.src = src;
      script.async = true;

      script.onload = function () {
        resolve();
      };

      script.onerror = function () {
        reject(new Error("Failed to load script: " + src));
      };

      document.head.appendChild(script);
    });
  }

  async function ensureLiffSdk() {
    if (window.liff) {
      return window.liff;
    }

    setStatus("loading-liff-sdk");

    await loadScript(LIFF_SDK_URL);

    if (!window.liff) {
      throw new Error("LIFF SDK loaded but window.liff missing");
    }

    return window.liff;
  }

  function exposeDebugApi() {
    window.ZELO_LIFF_DEBUG = function () {
      var profile = getCurrentProfile();
      var inviteParams = getInviteParams();

      var data = {
        href: window.location.href,
        liffId: getLiffId(),
        hasLiff: !!window.liff,
        bootStatus: window.ZELO_LIFF_BOOT_STATUS,
        isLoggedIn:
          !!(
            window.liff &&
            typeof window.liff.isLoggedIn === "function" &&
            window.liff.isLoggedIn()
          ),
        isInClient:
          !!(
            window.liff &&
            typeof window.liff.isInClient === "function" &&
            window.liff.isInClient()
          ),
        shareTargetPickerAvailable:
          !!(
            window.liff &&
            typeof window.liff.shareTargetPicker === "function" &&
            (
              typeof window.liff.isApiAvailable !== "function" ||
              window.liff.isApiAvailable("shareTargetPicker")
            )
          ),
        profile: profile,
        inviteParams: inviteParams,
        googleApi: getGoogleApi()
      };

      console.log("[ZELO LIFF DEBUG]", data);

      return data;
    };
  }

  async function bootLiff() {
    setupGoogleSync();
    exposeDebugApi();

    if (isShopifyEditor()) {
      setStatus("shopify-editor-skip");

      /*
       * Shopify 編輯器中不要跳 LINE login。
       */
      return {
        ok: false,
        skipped: true,
        reason: "shopify_editor"
      };
    }

    var liffId = getLiffId();

    if (!liffId) {
      setStatus("missing-liff-id");

      warn("[ZELO LIFF BOOT] missing LIFF ID");

      return {
        ok: false,
        reason: "missing_liff_id"
      };
    }

    try {
      setStatus("starting");

      await ensureLiffSdk();

      setStatus("initializing");

      await window.liff.init({
        liffId: liffId
      });

      setStatus("initialized");

      var isLoggedIn =
        typeof window.liff.isLoggedIn === "function"
          ? window.liff.isLoggedIn()
          : true;

      if (!isLoggedIn) {
        setStatus("login-required");

        window.liff.login({
          redirectUri: buildRedirectUriPreserveParams()
        });

        return {
          ok: false,
          login: true,
          reason: "login_required"
        };
      }

      var profile = null;

      try {
        profile = await window.liff.getProfile();
      } catch (profileError) {
        warn("[ZELO LIFF BOOT] getProfile failed", profileError);
      }

      if (profile) {
        var normalized = saveProfile(profile);

        setStatus("profile-ready");

        log("[ZELO LIFF BOOT] profile ready:", normalized);

        return {
          ok: true,
          profile: normalized
        };
      }

      setStatus("profile-empty");

      return {
        ok: false,
        reason: "profile_empty"
      };
    } catch (err) {
      setStatus("error");

      warn("[ZELO LIFF BOOT] failed:", err);

      try {
        window.dispatchEvent(
          new CustomEvent("zelo:liff:error", {
            detail: {
              message: String(err && err.message ? err.message : err)
            }
          })
        );
      } catch (eventError) {}

      return {
        ok: false,
        reason: "error",
        error: err
      };
    }
  }

  window.ZELO_LIFF_BOOT = bootLiff;
  window.ZELO_GET_LIFF_INVITE_PARAMS = getInviteParams;
  window.ZELO_GET_LIFF_PROFILE = getCurrentProfile;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        bootLiff();
      },
      {
        once: true
      }
    );
  } else {
    bootLiff();
  }
})();

