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

/*
 * =========================================================
 * ZELO Weekly Lottery Campaign
 * 每週抽獎活動設定
 * =========================================================
 */
window.LOTTERY_CAMPAIGN = window.LOTTERY_CAMPAIGN || {
  enabled: true,
  startDate: "2026-08-10",
  totalWeeks: 4,
  announceDay: 1,
  announceText: "每週公布中獎名單"
};

var LOTTERY_CAMPAIGN = window.LOTTERY_CAMPAIGN;

/*
 * =========================================================
 * ZELO Share Mission Helpers
 * 分享任務狀態 helper
 * =========================================================
 */
window.getShareCompleted = window.getShareCompleted || function getShareCompleted() {
  try {
    return localStorage.getItem("zg_share_completed") === "1";
  } catch (error) {
    return false;
  }
};

window.markShareCompleted = window.markShareCompleted || function markShareCompleted() {
  try {
    localStorage.setItem("zg_share_completed", "1");
    return true;
  } catch (error) {
    return false;
  }
};

var getShareCompleted = window.getShareCompleted;
var markShareCompleted = window.markShareCompleted;



  const DEFAULT_TOP_IMAGE =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/whell.png?v=202607170240";
  const VERSION = "202608162345-liff-url-v23";
  console.log("[ZELO GAME] version:", VERSION);

  const HOME_MUSIC_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Lyria_3_Clip.mp3?v=1784133785";
/*
 * 內建碰撞音效模式：
 * 不再使用外部 mp3，全部由 Web Audio 即時合成。
 * 好處：
 * - 減少 loading
 * - 避免 iOS / LINE WebView 外部音檔播放限制
 * - 碰撞可以依強度即時變化
 */
  const USE_BUILT_IN_COLLISION_SFX = true;

  const BG_IMAGE_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/logo_34222be0-3841-4f77-b316-61efd088c633.png?v=1783871764";

  const ARENA_LOGO_URL = "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/S.png?v=1785289063";

  const EXTERNAL_TOP_PHOTO_URL ="https://cdn.shopify.com/s/files/1/0798/9844/4087/files/1_0083279e-34eb-444e-a8ae-2080a6f169ca.png?v=1784036904";

  const SHOP_URL = "https://zelosportivo.com/zh";

  /*
 * 隱藏陀螺兌換設定：
 * 消費滿 REDEEM_THRESHOLD 元，透過 LINE 官方帳號兌換解鎖。
 * 請把 LINE_OA_URL 換成你們官方 LINE 帳號的加好友連結。
 */
const REDEEM_THRESHOLD = 2000;

const LINE_OA_URL =
  window.ZELO_LINE_OA_URL ||
  "https://line.me/R/ti/p/@your-line-id"; // TODO: 換成實際 LINE 官方帳號連結


  const GOOGLE_SCRIPT_URL =
  window.ZELO_GOOGLE_RECORD_API ||
  window.GOOGLE_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";

  const HOME_VIDEO_URL =
  "https://cdn.shopify.com/videos/c/o/v/79a35d5a5cc044a89b296de310f10b5b.mp4";

  const RESULT_VIDEO_URL =
  "https://cdn.shopify.com/videos/c/o/v/79a35d5a5cc044a89b296de310f10b5b.mp4";

/*
 * 結果影片設定：
 * 之後你可以把 win1 ~ win4 換成不同勝利影片。
 * lose 換成戰敗影片。
 */
  const RESULT_VIDEOS = {
  win1: "https://cdn.shopify.com/videos/c/o/v/ddd02db18e924690adb71f47dba771d5.mp4",
  win2: "https://cdn.shopify.com/videos/c/o/v/1c51161eb5d9487f8169b43ba84d43dd.mp4",
  win3: "https://cdn.shopify.com/videos/c/o/v/a500db81d1f04a3b8764e8fa42a393bb.mp4",
  win4: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4",
  
  lose: "https://cdn.shopify.com/videos/c/o/v/47d66958d65b4254a0919738894fbefd.mp4",
  draw: "https://cdn.shopify.com/videos/c/o/v/45202163c83e4db29b7fa73293469c81.mp4"
};

const HOME_POSTER_URL =
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg-line.jpg?v=1784121251";

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

  speed: 0.02
};

const DAILY_LIMIT = 9999;

const STORAGE = {
  selectedType: "zelo_selected_top_type",
  myScore: "zelo_my_score",
  rewardPoints: "zg_reward_points",
  friends: "zelo_friend_rank",
  profile: "zg_profile",
  lastResult: "zg_last_result",
  lastCoupon: "zg_last_coupon",
  dailyPrefix: "zg_daily_play_",
  dailyRewardPrefix: "zg_daily_reward_"
};



  const PHY = {
  radius: 42,
  ringPadding: 42,

  /*
   * =========================================================
   * Battle Pace / 戰鬥節奏
   * =========================================================
   *
   * 此版為「中等加速版」：
   * - 比前一版扣能量更明顯。
   * - 不回到秒殺。
   * - 普通戰鬥目標約 8~18 秒。
   * - 持久戰約 20~28 秒。
   */

  /*
   * 初始速度 / 發射速度。
   * 稍微提高速度，讓交鋒更積極。
   */
  initialSpeed: 8.6,
  launchSpeed: 8.6,

  /*
   * 最大速度。
   * 稍微提高，但仍低於舊版高暴力速度。
   */
  maxSpeed: 16.2,

  /*
   * 摩擦力。
   * 保持偏滑，讓陀螺有移動感。
   */
  friction: 0.9987,

  /*
   * 轉速衰減。
   */
  spinDecay: 0.9978,

  /*
   * 每幀轉速自然流失。
   * 比前版 0.22 略高。
   */
  spinDrain: 0.28,

  /*
   * 撞牆反彈。
   * 不要太彈，避免牆邊連續觸發出場。
   */
  wallRestitution: 0.84,
  wallBounce: 0.84,

  /*
   * 陀螺碰撞彈性。
   * 稍微提高碰撞感。
   */
  hitRestitution: 0.8,
  restitution: 0.8,

  /*
   * =========================================================
   * Damage / 傷害
   * =========================================================
   *
   * 核心調整：
   * - damageScale 從 0.22 提升到 0.31。
   * - battlePaceMul 從 0.72 提升到 0.9。
   * - 自然耗能也提高。
   */

  /*
   * 能量傷害總倍率。
   */
  energyDamageScale: 1.15,

  /*
   * 碰撞傷害倍率。
   * 0.31 = 中等偏快，不會太秒。
   */
  damageScale: 0.38,

  /*
   * 轉速傷害倍率。
   */
  spinDamageScale: 0.042,

  /*
   * 碰撞造成的轉速流失。
   * 從 0.82 提升到 1.05。
   */
  collisionSpinLoss: 1.18,

  /*
   * 單次碰撞最小 / 最大傷害。
   */
  minCollisionEnergy: 0.12,
  maxCollisionDamage: 12.5,

  /*
   * 碰撞冷卻。
   * 保持 86，避免貼住時每幀連扣。
   */
  collisionCooldown: 86,

  separationBias: 3.0,
  tangentTransfer: 0.075,

  /*
   * =========================================================
   * Movement AI / 移動與交鋒
   * =========================================================
   *
   * 稍微提高交戰積極度。
   */

  seekForceMax: 0.04,
  centerPull: 0.04,
  engagePull: 0.052,
  orbitForce: 0.052,
  tangentForce: 0.052,

  /*
   * HP / Energy finish mode.
   */
  hpOnlyFinish: true,

  /*
   * 建議戰鬥基準長度。
   */
  battleLimit: 15000,
  maxBattleMs: 999999999,

  /*
   * 停止判定。
   */
  minMotion: 0.55,
  stopSpinThreshold: 0.035,
  stopSpeedThreshold: 0.34,
  stopGraceMs: 2000,

  /*
   * 低能量對轉速的影響。
   */
  spinLossOnEnergy: 0.01,
  railSpinLoss: 0.008,

  /*
   * =========================================================
   * Natural Energy Drain / 自然能量損耗
   * =========================================================
   *
   * 比前版明顯提高。
   * 但仍保留 naturalEnergyCanKill: false，
   * 避免陀螺無碰撞自然暴斃。
   */

  naturalEnergyDrain: 0.012,
  spinEnergyDrain: 0.016,
  speedEnergyDrain: 0.007,
  wobbleEnergyDrain: 0.01,

  /*
   * 發射後自然損耗保護時間。
   */
  naturalKillGraceMs: 3800,

  /*
   * false = 自然耗能最多扣到 1。
   * 最後由碰撞 / 判定 / 出場 / 爆裂 / Spin Finish 決定。
   */
  naturalEnergyCanKill: false,

  /*
   * =========================================================
   * Finish Tuning / 勝利方式門檻
   * =========================================================
   *
   * 稍微放寬，讓 Over / Xtreme / Burst 比前版容易出現。
   */

  /*
   * 最短出場時間。
   */
  minOutFinishMs: 4600,

  /*
   * 最短爆裂時間。
   */
  minBurstFinishMs: 4200,

  /*
   * 普通能量歸零 / Spin Finish 最短時間。
   */
  minAnyFinishMs: 3400,

  /*
   * Over / Xtreme 需要對方能量低於一定比例。
   */
  overMinEnergyRatio: 0.38,
  xtremeMinEnergyRatio: 0.26,

  /*
   * 出場壓力門檻。
   */
  overPressureThreshold: 12.6,
  xtremePressureThreshold: 15.8,

  /*
   * Xtreme 需要速度。
   */
  xtremeMinSpeed: 7.8,

  /*
   * Burst 門檻。
   */
  burstThreshold: 8.6,

  /*
   * 全域戰鬥節奏倍率。
   * 0.9 = 中等加速。
   */
  battlePaceMul: 1.0
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




const INVITE_REWARD_TIERS = [
  {
    count: 1,
    name: "全品95折",
    fullName: "ZELO產品 95 折券",
    type: "coupon",
    code: "ZELO95"
  },
  {
    count: 3,
    name: "KIDEVO把塞抽獎",
    fullName: "滑步車把塞抽獎券",
    type: "lottery"
  },
  {
    count: 5,
    name: "ZELO襪子抽獎",
    fullName: "兒童襪子抽獎券",
    type: "lottery"
  },
  {
    count: 10,
    name: "KIDEVO握把抽獎",
    fullName: "滑步車握把抽獎券",
    type: "lottery"
  },
  {
    count: 20,
    name: "ZELO外套抽獎",
    fullName: "兒童外套抽獎資格",
    type: "lottery"
  }
];

  const REWARD_TIERS = [
  {
    id: "zelo_100_coupon",
    type: "coupon",
    requirementType: "share",
    name: "ZELO 100 元折扣券",
    points: 0,
    requiredPoints: 0,
    requiredShare: true,
    code: "ZELO100",
    description: "完成分享即可領取 100 元折扣序號。",
    limitText: "不限量",
    imageUrl: "",
    productUrl: ""
  },
  {
    id: "new_95_coupon",
    type: "coupon",
    requirementType: "invite",
    name: "新品 95 折券",
    points: 0,
    requiredPoints: 0,
    requiredInvites: 1,
    code: "ZELO95",
    description: "邀請 1 位好友即可領取新品 95 折券。",
    limitText: "不限量",
    imageUrl: "",
    productUrl: ""
  },
  {
    id: "all_items_60_lottery",
    type: "lottery",
    requirementType: "share",
    name: "全品項 6 折券抽獎",
    points: 0,
    requiredPoints: 0,
    requiredShare: true,
    weeklyLimit: 10,
    description: "完成分享即可取得本週全品項 6 折券抽獎資格。",
    limitText: "每週 10 名",
    imageUrl: "",
    productUrl: ""
  },
  {
    id: "kidevo_bar_end_lottery",
    type: "lottery",
    requirementType: "invite",
    name: "KIDEVO 把塞抽獎",
    points: 0,
    requiredPoints: 0,
    requiredInvites: 3,
    weeklyLimit: 5,
    description: "邀請 3 位好友即可取得本週 KIDEVO 把塞抽獎資格。",
    limitText: "每週 5 組",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Nano_Banana_2_-____________________________________________3.png?v=1785331312",
    productUrl: ""
  },
  {
    id: "zelo_socks_lottery",
    type: "lottery",
    requirementType: "invite",
    name: "ZELO 襪子抽獎",
    points: 0,
    requiredPoints: 0,
    requiredInvites: 5,
    weeklyLimit: 5,
    description: "邀請 5 位好友即可取得本週 ZELO 襪子抽獎資格。",
    limitText: "每週 5 組",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/suck.jpg?v=1785332079",
    productUrl: ""
  },
  {
    id: "kidevo_grip_lottery",
    type: "lottery",
    requirementType: "points",
    name: "KIDEVO 握把抽獎",
    points: 600,
    requiredPoints: 600,
    weeklyLimit: null,
    description: "累積 600 積分即可取得 KIDEVO 握把抽獎資格。",
    limitText: "積分抽獎",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ba57a09bab39dec4be0f562dbb7509d3.jpg?v=1785331200",
    productUrl: ""
  },
  {
    id: "kidevo_seat_lottery",
    type: "lottery",
    requirementType: "points",
    name: "KIDEVO 坐墊抽獎",
    points: 1200,
    requiredPoints: 1200,
    weeklyLimit: null,
    description: "累積 1200 積分即可取得 KIDEVO 坐墊抽獎資格。",
    limitText: "積分抽獎",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/cbc8e5e978652109aaa5729d3717e257.jpg?v=1785331099",
    productUrl: ""
  },
  {
    id: "zelo_kids_windbreaker_lottery",
    type: "lottery",
    requirementType: "points",
    name: "ZELO 兒童風衣外套抽獎",
    points: 1800,
    requiredPoints: 1800,
    weeklyLimit: null,
    description: "累積 1800 積分即可取得 ZELO 兒童風衣外套抽獎資格。",
    limitText: "積分抽獎",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ZELO-_-_-_-_11_-ZELO-5720312.jpg?v=1763387744",
    productUrl: ""
  },
  {
    id: "pro_type_shorts_lottery",
    type: "lottery",
    requirementType: "points",
    name: "PRO-TYPE 車褲抽獎",
    points: 2400,
    requiredPoints: 2400,
    weeklyLimit: null,
    description: "累積 2400 積分即可取得 PRO-TYPE 車褲抽獎資格。",
    limitText: "積分抽獎",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/p1_16ee97d2-e464-49cc-9202-3b347d7a786e.jpg?v=1785332079",
    productUrl: ""
  },
  {
    id: "pro_type_bib_shorts_lottery",
    type: "lottery",
    requirementType: "points",
    name: "PRO-TYPE 吊帶車褲抽獎",
    points: 3200,
    requiredPoints: 3200,
    weeklyLimit: null,
    description: "累積 3200 積分即可取得 PRO-TYPE 吊帶車褲抽獎資格。",
    limitText: "積分抽獎",
    imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg_b896a3b9-78e2-42ab-932d-f8461fc7355d.jpg?v=1785332079",
    productUrl: ""
  }
];


const ZELO_GACHA_POOLS = [
  {
    id: "quick_100",
    machineTheme: "bronze",
    machineImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
    machineDrawImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineDrawVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
    
    machineWinImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineLoseImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineWinVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
machineLoseVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",


    title: "快速抽",
    subtitle: "100 點抽一次",
    cost: 100,
    drawCount: 1,
    rarityTheme: "white",
    ballLabel: "白球",
    badge: "入門獎池",
    description: "小折扣、免運券、點數回饋都有機會獲得，也可能銘謝惠顧。",
    prizesPreview: [
      "95 折券",
      "9 折券",
      "免運券",
      "ZELO Points +20",
      "銘謝惠顧"
    ],
    rewards: [
      {
        id: "coupon_95",
        type: "coupon",
        rarity: "white",
        name: "ZELO 商品 95 折券",
        delivery: "line_message",
        weight: 35
      },
      {
        id: "coupon_90",
        type: "coupon",
        rarity: "white",
        name: "ZELO 商品 9 折券",
        delivery: "line_message",
        weight: 25
      },
      {
        id: "free_shipping",
        type: "coupon",
        rarity: "white",
        name: "免運券",
        delivery: "line_message",
        weight: 20
      },
      {
        id: "bonus_points_20",
        type: "points",
        rarity: "white",
        name: "ZELO Points +20",
        points: 20,
        delivery: "instant",
        weight: 20
      },
      {
        id: "no_prize_quick_100",
        type: "none",
        rarity: "gray",
        name: "銘謝惠顧",
        description: "這次沒有抽中獎品，歡迎再挑戰一次。",
        delivery: "none",
        weight: 40
      }
    ]
  },
  {
    id: "standard_500",
    machineTheme: "silver",
    machineImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
    machineDrawImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineDrawVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",

    machineWinImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineLoseImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineWinVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
machineLoseVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",


    title: "標準抽",
    subtitle: "500 點抽一次",
    cost: 500,
    drawCount: 1,
    rarityTheme: "black",
    ballLabel: "黑球",
    badge: "推薦獎池",
    description: "有機會抽中中階折扣券、商品抽獎資格與點數回饋。",
    prizesPreview: [
      "85 折券",
      "75 折券",
      "商品抽獎資格",
      "ZELO Points +100",
      "銘謝惠顧"
    ],
    rewards: [
      {
        id: "coupon_85",
        type: "coupon",
        rarity: "black",
        name: "ZELO 商品 85 折券",
        delivery: "line_message",
        weight: 35
      },
      {
        id: "coupon_75",
        type: "coupon",
        rarity: "black",
        name: "指定商品 75 折券",
        delivery: "line_message",
        weight: 20
      },
      {
        id: "kidevo_grip_entry",
        type: "lottery_entry",
        rarity: "black",
        name: "KIDEVO 握把抽獎資格",
        delivery: "record",
        weight: 25
      },
      {
        id: "bonus_points_100",
        type: "points",
        rarity: "black",
        name: "ZELO Points +100",
        points: 100,
        delivery: "instant",
        weight: 20
      },
      {
        id: "no_prize_standard_500",
        type: "none",
        rarity: "gray",
        name: "銘謝惠顧",
        description: "這次沒有抽中獎品，歡迎再挑戰一次。",
        delivery: "none",
        weight: 25
      }
    ]
  },
  {
    id: "premium_1000",
    machineTheme: "gold",
    machineImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
    machineDrawImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
    machineDrawVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",

    machineWinImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineLoseImageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/luckkky.png?v=1785414153",
machineWinVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",
machineLoseVideoUrl: "https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4",


    title: "高級抽",
    subtitle: "1000 點抽一次",
    cost: 1000,
    drawCount: 1,
    rarityTheme: "red",
    ballLabel: "紅球",
    badge: "高價獎池",
    description: "高價獎勵池，有機會抽中實體商品資格與高折扣。",
    prizesPreview: [
      "6 折券",
      "90 折扣券抽獎資格",
      "PRO-TYPE 車褲抽獎資格",
      "風衣外套抽獎資格",
      "銘謝惠顧"
    ],
    rewards: [
      {
        id: "coupon_60",
        type: "coupon",
        rarity: "red",
        name: "ZELO 商品 6 折券",
        delivery: "line_message",
        weight: 25
      },
      {
        id: "coupon_90_entry",
        type: "lottery_entry",
        rarity: "red",
        name: "90 折扣券抽獎資格",
        delivery: "record",
        weight: 25
      },
      {
        id: "pro_type_shorts_entry",
        type: "lottery_entry",
        rarity: "red",
        name: "PRO-TYPE 車褲抽獎資格",
        delivery: "record",
        weight: 25
      },
      {
        id: "kids_windbreaker_entry",
        type: "lottery_entry",
        rarity: "red",
        name: "ZELO 兒童風衣外套抽獎資格",
        delivery: "record",
        weight: 25
      },
      {
        id: "no_prize_premium_1000",
        type: "none",
        rarity: "gray",
        name: "銘謝惠顧",
        description: "這次沒有抽中獎品，歡迎再挑戰一次。",
        delivery: "none",
        weight: 15
      }
    ]
  }
];

window.ZELO_GACHA_POOLS = ZELO_GACHA_POOLS;

  
 const TOPS = [
  {
    id: "attack",
    name: "爆炎菲尼克斯",
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
    name: "鋼鎧玄武",
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
    name: "聖環麒麟",
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
    name: "星翼佩加索斯",
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
 * =========================================================
 * ZELO Secret Top Unlock / 隱藏陀螺解鎖系統
 * =========================================================
 */


/*
 * 兌換碼設定：
 * key = 兌換碼；value = 對應解鎖的隱藏陀螺 id
 *
 * TODO：
 * 目前為前端本機驗證，方便先上線測試。
 * 之後建議改成 jsonpApi("redeem_secret_top", { code, topId, userId })
 * 交由 GAS 驗證兌換碼是否存在、是否已被使用過，避免碼外流被重複兌換。
 */
const SECRET_REDEEM_CODES = {
  "ZELO-SHADOW-001": "secret-shadow",
  "ZELO-LIGHT-001": "secret-light",
  "ZELO-FIRE-001": "secret-fire",
  "ZELO-ICE-001": "secret-ice",
  "ZELO-THUNDER-001": "secret-thunder"
};

function validateSecretRedeemCode(code, topId) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return false;

  return SECRET_REDEEM_CODES[normalized] === topId;
}

function getTopById(id) {
  return (
    TOPS.find((top) => top.id === id) ||
    SECRET_TOPS.find((top) => top.id === id) ||
    TOPS[0]
  );
}


  
const SECRET_TOPS = [
  {
    id: "secret-shadow",
    fxId: "secret-shadow",
    name: "黑翼獵鴉",
    type: "attack",
    typeName: "隱藏攻擊型",
    emoji: "🌑",
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/p_1.png?v=1786282246",
    battleImage: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/p_1.png?v=1786282246",

    /*
     * 原本：118 / 62 / 68 / 108 = 356
     * 調整後：108 / 66 / 70 / 100 = 344
     */
    power: 108,
    defense: 66,
    stamina: 70,
    speed: 100,

    colorA: "#1a1028",
    colorB: "#ff2b7a",
    redeemThreshold: REDEEM_THRESHOLD,
    unlockText: `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
  },
  {
    id: "secret-light",
    name: "聖光瓦爾基里",
    fxId: "secret-light",
    type: "balance",
    typeName: "傳說平衡型",
    emoji: "✨",
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/w_1.png?v=1786282028",
    battleImage: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/w_1.png?v=1786282028",

    /*
     * 原本：96 / 96 / 96 / 96 = 384
     * 太平均又太高，會非常穩。
     * 調整後：88 / 88 / 88 / 88 = 352
     */
    power: 88,
    defense: 88,
    stamina: 88,
    speed: 88,

    colorA: "#f7f0ff",
    colorB: "#7df6ff",
    redeemThreshold: REDEEM_THRESHOLD,
    unlockText: `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
  },
  {
    id: "secret-fire",
    name: "紅蓮伊弗利特",
    fxId: "secret-fire",
    type: "attack",
    typeName: "隱藏爆裂型",
    emoji: "🔥",
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/r_3.png?v=1786282008",
    battleImage: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/r_3.png?v=1786282008",

    /*
     * 原本：124 / 58 / 64 / 112 = 358
     * 調整後：112 / 58 / 66 / 104 = 340
     */
    power: 112,
    defense: 58,
    stamina: 66,
    speed: 104,

    colorA: "#ff1744",
    colorB: "#ffb300",
    redeemThreshold: REDEEM_THRESHOLD,
    unlockText: `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
  },
  {
    id: "secret-ice",
    name: "冰牙芬里爾",
    fxId: "secret-ice",
    type: "defense",
    typeName: "隱藏防禦型",
    emoji: "❄️",
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/b_1.png?v=1786308075",
    battleImage: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/b_1.png?v=1786308075",

    /*
     * 原本：70 / 122 / 102 / 60 = 354
     * 調整後：68 / 112 / 92 / 58 = 330
     */
    power: 68,
    defense: 112,
    stamina: 92,
    speed: 58,

    colorA: "#2fc7ff",
    colorB: "#e8fbff",
    redeemThreshold: REDEEM_THRESHOLD,
    unlockText: `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
  },
  {
    id: "secret-thunder",
    name: "雷迅麒麟",
    fxId: "secret-thunder",
    type: "speed",
    typeName: "隱藏速度型",
    emoji: "⚡",
    image: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/g_2.png?v=1786281996",
    battleImage: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/g_2.png?v=1786281996",

    /*
     * 原本：88 / 66 / 70 / 126 = 350
     * 調整後：84 / 66 / 70 / 112 = 332
     */
    power: 84,
    defense: 66,
    stamina: 70,
    speed: 112,

    colorA: "#fff36a",
    colorB: "#28d8ff",
    redeemThreshold: REDEEM_THRESHOLD,
    unlockText: `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
  }
];



  /*
 * =========================================================
 * Secret Tops Battle FX / 隱藏陀螺戰鬥特效系統
 * 對應目前 SECRET_TOPS:
 * secret-shadow  黑翼獵鴉
 * secret-light   聖光瓦爾基里
 * secret-fire    紅蓮伊弗利特
 * secret-ice     冰牙芬里爾
 * secret-thunder 雷迅麒麟
 * =========================================================
 */

const SECRET_TOP_FX = {
  "secret-shadow": {
    id: "secret-shadow",
    name: "黑翼獵鴉",
    theme: "shadow",

    auraColor: "rgba(155, 50, 255, 0.55)",
    coreColor: "rgba(20, 0, 45, 0.86)",
    trailColor: "rgba(120, 35, 255, 0.34)",
    particleColor: "rgba(180, 70, 255, 0.94)",
    ringColor: "rgba(95, 0, 170, 0.72)",
    shockwaveColor: "rgba(200, 80, 255, 0.9)",
    slashColor: "rgba(235, 155, 255, 0.96)",
    hitColor: "rgba(220, 100, 255, 0.98)",

    auraMul: 1.48,
    trailLength: 16,
    particleCount: 28,
    shakeMul: 1.22,
    hitFreeze: 5,
    critRate: 0.18,
    critMul: 1.42,
    specialText: "DARK RAVEN STRIKE"
  },

  "secret-light": {
    id: "secret-light",
    name: "聖光瓦爾基里",
    theme: "holy",

    auraColor: "rgba(160, 245, 255, 0.58)",
    coreColor: "rgba(255, 245, 190, 0.82)",
    trailColor: "rgba(120, 240, 255, 0.36)",
    particleColor: "rgba(255, 255, 215, 0.95)",
    ringColor: "rgba(105, 235, 255, 0.78)",
    shockwaveColor: "rgba(255, 245, 180, 0.94)",
    slashColor: "rgba(255, 255, 255, 0.98)",
    hitColor: "rgba(255, 250, 170, 0.98)",

    auraMul: 1.55,
    trailLength: 13,
    particleCount: 24,
    shakeMul: 0.95,
    hitFreeze: 4,
    critRate: 0.1,
    critMul: 1.22,
    specialText: "HOLY VALKYRIE JUDGEMENT"
  },

  "secret-fire": {
    id: "secret-fire",
    name: "紅蓮伊弗利特",
    theme: "flame",

    auraColor: "rgba(255, 70, 20, 0.66)",
    coreColor: "rgba(120, 0, 0, 0.86)",
    trailColor: "rgba(255, 80, 20, 0.4)",
    particleColor: "rgba(255, 95, 20, 0.98)",
    ringColor: "rgba(255, 45, 0, 0.8)",
    shockwaveColor: "rgba(255, 120, 20, 0.96)",
    slashColor: "rgba(255, 220, 70, 0.98)",
    hitColor: "rgba(255, 170, 40, 1)",

    auraMul: 1.52,
    trailLength: 18,
    particleCount: 38,
    shakeMul: 1.45,
    hitFreeze: 7,
    critRate: 0.23,
    critMul: 1.58,
    specialText: "CRIMSON IFRIT BURST"
  },

  "secret-ice": {
    id: "secret-ice",
    name: "冰牙芬里爾",
    theme: "ice",

    auraColor: "rgba(120, 230, 255, 0.58)",
    coreColor: "rgba(210, 250, 255, 0.76)",
    trailColor: "rgba(110, 220, 255, 0.36)",
    particleColor: "rgba(190, 245, 255, 0.96)",
    ringColor: "rgba(120, 235, 255, 0.78)",
    shockwaveColor: "rgba(170, 245, 255, 0.95)",
    slashColor: "rgba(235, 255, 255, 0.98)",
    hitColor: "rgba(180, 250, 255, 1)",

    auraMul: 1.6,
    trailLength: 12,
    particleCount: 30,
    shakeMul: 1.05,
    hitFreeze: 5,
    critRate: 0.08,
    critMul: 1.25,
    specialText: "FROST FENRIR GUARD"
  },

  "secret-thunder": {
    id: "secret-thunder",
    name: "雷迅麒麟",
    theme: "thunder",

    auraColor: "rgba(110, 210, 255, 0.58)",
    coreColor: "rgba(255, 245, 80, 0.78)",
    trailColor: "rgba(80, 210, 255, 0.38)",
    particleColor: "rgba(150, 235, 255, 0.98)",
    ringColor: "rgba(255, 240, 80, 0.8)",
    shockwaveColor: "rgba(120, 225, 255, 0.96)",
    slashColor: "rgba(245, 255, 180, 0.98)",
    hitColor: "rgba(255, 245, 100, 1)",

    auraMul: 1.46,
    trailLength: 20,
    particleCount: 32,
    shakeMul: 1.3,
    hitFreeze: 5,
    critRate: 0.16,
    critMul: 1.36,
    specialText: "THUNDER KIRIN DRIVE"
  }
};

const BATTLE_FX = {
  impacts: [],
  particles: [],
  slashes: [],
  screenShake: 0,
  hitFreeze: 0,
  flash: 0,
  specialText: null
};

function getTopFx(bey) {
  if (!bey) return null;

  if (bey.fxId && SECRET_TOP_FX[bey.fxId]) {
    return SECRET_TOP_FX[bey.fxId];
  }

  if (bey.id && SECRET_TOP_FX[bey.id]) {
    return SECRET_TOP_FX[bey.id];
  }

  if (bey.topId && SECRET_TOP_FX[bey.topId]) {
    return SECRET_TOP_FX[bey.topId];
  }

  if (bey.baseId && SECRET_TOP_FX[bey.baseId]) {
    return SECRET_TOP_FX[bey.baseId];
  }

  if (bey.name) {
    return Object.values(SECRET_TOP_FX).find(function (fx) {
      return fx.name === bey.name;
    }) || null;
  }

  return null;
}

function updateSecretTopFxForBey(bey) {
  const fx = getTopFx(bey);
  if (!fx) return;

  if (!bey.secretTrail) bey.secretTrail = [];

  const radius = typeof PHY !== "undefined" && PHY.radius ? PHY.radius : 42;

  bey.secretTrail.push({
    x: bey.x,
    y: bey.y,
    life: 1,
    r: radius
  });

  while (bey.secretTrail.length > fx.trailLength) {
    bey.secretTrail.shift();
  }

  for (let i = bey.secretTrail.length - 1; i >= 0; i--) {
    bey.secretTrail[i].life *= 0.86;

    if (bey.secretTrail[i].life < 0.04) {
      bey.secretTrail.splice(i, 1);
    }
  }
}



function drawSecretTrail(ctx, bey) {
  const fx = getTopFx(bey);
  if (!fx || !bey.secretTrail) return;

  const radius = typeof PHY !== "undefined" && PHY.radius ? PHY.radius : 42;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < bey.secretTrail.length; i++) {
    const p = bey.secretTrail[i];
    const t = i / Math.max(1, bey.secretTrail.length);
    const alpha = p.life * t * 0.48;
    const size = radius * (0.62 + t * 0.5);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = fx.trailColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}


function drawShadowAura(ctx, bey, fx, now, radius) {
  ctx.strokeStyle = fx.slashColor;
  ctx.lineWidth = 3;

  for (let i = 0; i < 5; i++) {
    const a = now * 0.002 + i * Math.PI * 0.4;
    const r1 = radius * 0.95;
    const r2 = radius * 1.82;

    ctx.globalAlpha = 0.45 + Math.sin(now * 0.006 + i) * 0.18;
    ctx.beginPath();
    ctx.moveTo(bey.x + Math.cos(a) * r1, bey.y + Math.sin(a) * r1);
    ctx.lineTo(bey.x + Math.cos(a + 0.25) * r2, bey.y + Math.sin(a + 0.25) * r2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawHolyAura(ctx, bey, fx, now, radius) {
  ctx.strokeStyle = fx.slashColor;
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI * 2 / 8 + now * 0.0015;
    const r1 = radius * 1.12;
    const r2 = radius * 1.9;

    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(bey.x + Math.cos(a) * r1, bey.y + Math.sin(a) * r1);
    ctx.lineTo(bey.x + Math.cos(a) * r2, bey.y + Math.sin(a) * r2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawFlameAura(ctx, bey, fx, now, radius) {
  ctx.fillStyle = fx.particleColor;

  for (let i = 0; i < 15; i++) {
    const a = now * 0.003 + i * Math.PI * 2 / 15;
    const wave = Math.sin(now * 0.01 + i) * 9;
    const r = radius * 1.38 + wave;

    ctx.globalAlpha = 0.45 + Math.random() * 0.25;
    ctx.beginPath();
    ctx.arc(
      bey.x + Math.cos(a) * r,
      bey.y + Math.sin(a) * r,
      2.5 + Math.random() * 3.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawIceAura(ctx, bey, fx, now, radius) {
  ctx.strokeStyle = fx.slashColor;
  ctx.lineWidth = 2.5;

  for (let i = 0; i < 7; i++) {
    const a = i * Math.PI * 2 / 7 - now * 0.0012;
    const r1 = radius * 1.15;
    const r2 = radius * 1.78;

    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(bey.x + Math.cos(a) * r1, bey.y + Math.sin(a) * r1);
    ctx.lineTo(bey.x + Math.cos(a + 0.15) * r2, bey.y + Math.sin(a + 0.15) * r2);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = fx.ringColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(bey.x, bey.y, radius * 1.88, now * 0.001, now * 0.001 + Math.PI * 1.55);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawThunderAura(ctx, bey, fx, now, radius) {
  ctx.strokeStyle = fx.slashColor;
  ctx.lineWidth = 3;

  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2;
    const r1 = radius * 0.85;
    const r2 = radius * (1.45 + Math.random() * 0.6);

    ctx.globalAlpha = 0.42 + Math.random() * 0.45;
    ctx.beginPath();
    ctx.moveTo(bey.x + Math.cos(a) * r1, bey.y + Math.sin(a) * r1);
    ctx.lineTo(bey.x + Math.cos(a + 0.18) * r2, bey.y + Math.sin(a + 0.18) * r2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

function drawSecretLowHpRage(ctx, bey, fx, now, radius) {
  const hp = typeof bey.hp === "number" ? bey.hp : null;
  const maxHp = typeof bey.maxHp === "number" ? bey.maxHp : null;

  if (hp === null || maxHp === null || maxHp <= 0) return;

  const ratio = hp / maxHp;
  if (ratio > 0.35) return;

  const pulse = 1 + Math.sin(now * 0.025) * 0.25;

  ctx.globalAlpha = 0.72;
  ctx.strokeStyle = fx.hitColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(bey.x, bey.y, radius * 1.85 * pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function spawnImpactFromBeys(a, b) {
  if (!a || !b) return;

  const rvx = (a.vx || 0) - (b.vx || 0);
  const rvy = (a.vy || 0) - (b.vy || 0);
  const power = Math.sqrt(rvx * rvx + rvy * rvy);

  const x = ((a.x || 0) + (b.x || 0)) / 2;
  const y = ((a.y || 0) + (b.y || 0)) / 2;

  spawnBattleImpact(x, y, power, a, b);
  spawnSecretImpact(x, y, power, a, b);
}



function spawnBattleImpact(x, y, power, a, b) {
  const safePower = Math.max(1, power || 1);

  BATTLE_FX.impacts.push({
    x: x,
    y: y,
    r: 10,
    life: 1,
    power: safePower,
    color: "rgba(255, 245, 190, 0.95)",
    lineWidth: 4
  });

  BATTLE_FX.impacts.push({
    x: x,
    y: y,
    r: 18,
    life: 0.85,
    power: safePower * 0.9,
    color: "rgba(255, 120, 40, 0.86)",
    lineWidth: 3
  });

  const count = Math.floor(18 + Math.min(26, safePower * 2.4));

  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (2.8 + Math.random() * 7.2) * Math.min(2.4, safePower / 6);

    BATTLE_FX.particles.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 1,
      size: 2 + Math.random() * 3.5,
      color:
        Math.random() < 0.65
          ? "rgba(255, 245, 190, 0.96)"
          : "rgba(255, 95, 30, 0.92)"
    });
  }

  const slashCount = safePower > 7 ? 3 : 2;

  for (let i = 0; i < slashCount; i++) {
    const ang = Math.random() * Math.PI * 2;

    BATTLE_FX.slashes.push({
      x: x,
      y: y,
      angle: ang,
      len: 38 + safePower * 5.5 + Math.random() * 18,
      life: 1,
      color: "rgba(255, 255, 255, 0.92)",
      width: 3 + Math.random() * 2
    });
  }

  BATTLE_FX.screenShake = Math.min(
    28,
    BATTLE_FX.screenShake + safePower * 0.9
  );

  if (safePower > 6.5) {
    BATTLE_FX.hitFreeze = Math.max(BATTLE_FX.hitFreeze, 3);
  }

  if (safePower > 7.5) {
    BATTLE_FX.flash = Math.min(1, BATTLE_FX.flash + safePower * 0.045);
  }
}



  

function spawnSecretImpact(x, y, power, a, b) {
  const fxA = getTopFx(a);
  const fxB = getTopFx(b);
  const fx = fxA || fxB;

  if (!fx) return;

  const safePower = Math.max(1, power || 1);
  const isSecretHit = true;


  BATTLE_FX.impacts.push({
    x: x,
    y: y,
    r: 10,
    life: 1,
    power: safePower,
    color: fx ? fx.shockwaveColor : "rgba(255, 220, 90, 0.9)",
    lineWidth: isSecretHit ? 6 : 3
  });

  const count = fx ? fx.particleCount : 14;

  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (2 + Math.random() * 6) * Math.min(2.5, safePower / 7);

    BATTLE_FX.particles.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 1,
      size: 2 + Math.random() * 4,
      color: fx ? fx.particleColor : "rgba(255, 210, 80, 0.9)"
    });
  }

  if (fx) {
    const slashCount = fx.theme === "flame" ? 8 : 5;

    for (let i = 0; i < slashCount; i++) {
      const ang = Math.random() * Math.PI * 2;

      BATTLE_FX.slashes.push({
        x: x,
        y: y,
        angle: ang,
        len: 45 + safePower * 6,
        life: 1,
        color: fx.slashColor,
        width: fx.theme === "holy" ? 3 : 4
      });
    }

    if (safePower > 8) {
      BATTLE_FX.specialText = {
        text: fx.specialText,
        life: 1,
        color: fx.hitColor
      };
    }
  }

  BATTLE_FX.screenShake = Math.min(
    32,
    BATTLE_FX.screenShake + safePower * (fx ? fx.shakeMul * 1.2 : 0.9)
  );

  if (safePower > 6.5) {
    BATTLE_FX.hitFreeze = fx ? fx.hitFreeze : 3;
  }

  BATTLE_FX.flash = Math.min(1, BATTLE_FX.flash + safePower * 0.06);
}


function drawImpactWaves(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = BATTLE_FX.impacts.length - 1; i >= 0; i--) {
    const fx = BATTLE_FX.impacts[i];

    ctx.strokeStyle = fx.color;
    ctx.lineWidth = fx.lineWidth;
    ctx.globalAlpha = fx.life;

    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = fx.life * 0.45;
    ctx.lineWidth = fx.lineWidth * 0.55;
    ctx.beginPath();
    ctx.arc(fx.x, fx.y, fx.r * 0.58, 0, Math.PI * 2);
    ctx.stroke();

    fx.r += 9 + fx.power * 0.55;
    fx.life *= 0.82;

    if (fx.life < 0.04) {
      BATTLE_FX.impacts.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawImpactSlashes(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = BATTLE_FX.slashes.length - 1; i >= 0; i--) {
    const s = BATTLE_FX.slashes[i];

    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width || 4;
    ctx.globalAlpha = s.life;

    const dx = Math.cos(s.angle) * s.len;
    const dy = Math.sin(s.angle) * s.len;

    ctx.beginPath();
    ctx.moveTo(s.x - dx * 0.5, s.y - dy * 0.5);
    ctx.lineTo(s.x + dx * 0.5, s.y + dy * 0.5);
    ctx.stroke();

    s.len *= 1.03;
    s.life *= 0.78;

    if (s.life < 0.04) {
      BATTLE_FX.slashes.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawImpactParticles(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = BATTLE_FX.particles.length - 1; i >= 0; i--) {
    const p = BATTLE_FX.particles[i];

    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.93;
    p.vy *= 0.93;
    p.life *= 0.88;

    if (p.life < 0.04) {
      BATTLE_FX.particles.splice(i, 1);
    }
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBattleFlash(ctx) {
  if (BATTLE_FX.flash <= 0.01) return;

  const w = ctx.canvas ? ctx.canvas.width : canvas.width;
  const h = ctx.canvas ? ctx.canvas.height : canvas.height;

  ctx.save();
  ctx.globalAlpha = BATTLE_FX.flash * 0.55;
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  BATTLE_FX.flash *= 0.72;
}

function drawSpecialText(ctx) {
  const st = BATTLE_FX.specialText;
  if (!st) return;

  const w = ctx.canvas ? ctx.canvas.width : canvas.width;
  const h = ctx.canvas ? ctx.canvas.height : canvas.height;

  ctx.save();
  ctx.globalAlpha = st.life;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const scale = 1 + (1 - st.life) * 0.18;
  ctx.translate(w / 2, h * 0.22);
  ctx.scale(scale, scale);

  ctx.font = "900 30px Arial, sans-serif";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(0,0,0,0.78)";
  ctx.fillStyle = st.color || "rgba(255,255,255,0.96)";

  ctx.strokeText(st.text, 0, 0);
  ctx.fillText(st.text, 0, 0);

  ctx.restore();

  st.life *= 0.92;

  if (st.life < 0.04) {
    BATTLE_FX.specialText = null;
  }
}


function applyHitFreezeFrame() {
  if (BATTLE_FX.hitFreeze > 0) {
    BATTLE_FX.hitFreeze--;
    return true;
  }

  return false;
}

function applySecretDamageStyle(baseDamage, attacker, defender) {
  const fx = getTopFx(attacker);
  if (!fx) return baseDamage;

  let dmg = baseDamage;

  if (Math.random() < fx.critRate) {
    dmg *= fx.critMul;

    BATTLE_FX.flash = Math.max(BATTLE_FX.flash, 0.45);
    BATTLE_FX.screenShake = Math.min(32, BATTLE_FX.screenShake + 8);

    BATTLE_FX.specialText = {
      text: "CRITICAL HIT!",
      life: 1,
      color: fx.hitColor
    };

    if (attacker && defender) {
      spawnSecretImpact(
        ((attacker.x || 0) + (defender.x || 0)) / 2,
        ((attacker.y || 0) + (defender.y || 0)) / 2,
        9,
        attacker,
        defender
      );
    }
  }

  return dmg;
}

function resetBattleFx() {
  BATTLE_FX.impacts.length = 0;
  BATTLE_FX.particles.length = 0;
  BATTLE_FX.slashes.length = 0;
  BATTLE_FX.screenShake = 0;
  BATTLE_FX.hitFreeze = 0;
  BATTLE_FX.flash = 0;
  BATTLE_FX.specialText = null;
}



  
  const FEEL = {
  attack: {
    label: "攻擊型",

    /*
     * 攻擊型：
     * 底部平坦、移動快、銳角多。
     * 優勢是高速撞擊與打亂對手軌跡。
     * 缺點是摩擦較高，長戰會掉速。
     */
    launchKick: 1.16,
    sparkMul: 1.42,
    hitSharpness: 1.22,
    stability: 0.86,
    friction: 1.06,
    humBase: 155,
    humGain: 1.26,

    attack: 1.22,
    defense: 0.88,
    stamina: 0.9,
    mobility: 1.18
  },

  defense: {
    label: "防禦型",

    /*
     * 防禦型：
     * 重量高、外型圓滑，不容易被擊飛。
     * 剋制攻擊型，能吸收猛撞。
     * 缺點是主動進攻較弱，拖長會被持久型消耗。
     */
    launchKick: 0.92,
    sparkMul: 0.88,
    hitSharpness: 0.78,
    stability: 1.34,
    friction: 0.9,
    humBase: 92,
    humGain: 0.86,

    attack: 0.88,
    defense: 1.3,
    stamina: 1.06,
    mobility: 0.84
  },

  stamina: {
    label: "耐久型",

    /*
     * 持久型：
     * 軸心尖銳、摩擦低，能轉最久。
     * 剋制防禦型，靠穩定迴旋拖到最後。
     * 缺點是開場容易被攻擊型高速撞亂。
     */
    launchKick: 0.96,
    sparkMul: 0.82,
    hitSharpness: 0.86,
    stability: 1.22,
    friction: 0.72,
    humBase: 118,
    humGain: 0.76,

    attack: 0.88,
    defense: 1.02,
    stamina: 1.34,
    mobility: 0.88
  },

  balance: {
    label: "平衡型",

    /*
     * 平衡型：
     * 攻擊、防禦、持久、速度平均。
     * 不強烈剋制，也不容易被單一類型完全壓制。
     */
    launchKick: 1.02,
    sparkMul: 1,
    hitSharpness: 1,
    stability: 1,
    friction: 1,
    humBase: 122,
    humGain: 1,

    attack: 1,
    defense: 1,
    stamina: 1,
    mobility: 1
  },

  /*
   * 隱藏速度型：
   * 暫時視為攻擊型分支，但傷害不要比 attack 更爆炸。
   */
  speed: {
    label: "速度型",
    launchKick: 1.18,
    sparkMul: 1.24,
    hitSharpness: 1.08,
    stability: 0.9,
    friction: 1.04,
    humBase: 166,
    humGain: 1.2,

    attack: 1.08,
    defense: 0.9,
    stamina: 0.94,
    mobility: 1.28
  }
};


const PERF = {
  lowFx: false,

  lastFxAt: 0,
  lastScratchAt: 0,
  lastAfterimageAt: 0,
  lastMotionTrailAt: 0,
  lastXtremeDashAt: 0,
  lastXtremeDashShockAt: 0,
  lastShockwaveAt: 0,
  lastCollisionTrackAt: 0,
  lastHpUiAt: 0,
  lastHpPulseAt: 0,
  lastEnergyUiAt: 0,

  activeFx: 0,

  /*
   * 特效上限：
   * 一般手機 22 還算穩。
   * lowFx 會自動降量。
   */
  maxFx: 22,
  maxSparksPerHit: 14,

  minFxGap: 80,
  minScratchGap: 260,
  minAfterimageGap: 180,
  minShockwaveGap: 360,
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
 * Friend rank preload cache
 */
friendRankPreloaded: false,
friendRankPreloading: false,
friendRankPreloadResult: null,
friendRankPreloadAt: 0,


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
  code =
    localStorage.getItem(REFERRAL.codeKey) ||
    localStorage.getItem("ZELO_REFERRAL_CODE") ||
    localStorage.getItem("zg_referral_code") ||
    "";
} catch (error) {
  code = "";
}


  if (code) return code;

  const seed = makeReferralSeed();
  code = `ZG_${simpleHash(seed).slice(0, 8)}`;

 try {
  localStorage.setItem(REFERRAL.codeKey, code);
} catch (error) {}

try {
  localStorage.setItem("ZELO_REFERRAL_CODE", code);
} catch (error) {}

try {
  localStorage.setItem("zg_referral_code", code);
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

  
function buildReferralUrl(code) {
  var url = new URL(
    window.ZELO_SHARE_URL ||
    window.ZELO_GAME_SHARE_URL ||
    "https://liff.line.me/2007022255-ph9gRwPs"
  );

  if (code) {
    url.searchParams.set("ref", code);
  }

  url.searchParams.set("v", "2345");

  return url.toString();
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

  const referralCode =
  profile.referralCode ||
  profile.myReferralCode ||
  profile.ownerReferralCode ||
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
    referralCode,
myReferralCode: referralCode,
ownerReferralCode: referralCode,


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

  async function syncMyReferralCodeFromServer(source = "unknown") {
  const profile = getProfile() || {};
  const normalized = normalizeLineProfile(profile);

  const userId =
    normalized.userId && normalized.userId !== "me-local"
      ? normalized.userId
      : "";

  if (!userId) {
    return {
      ok: false,
      reason: "missing_user_id"
    };
  }

  try {
    const data = await jsonpApi("get_liff_referral_code", {
      action: "get_liff_referral_code",

      userId,
      lineUserId: userId,
      ownerLineUserId: userId,

      displayName:
        normalized.displayName ||
        normalized.name ||
        normalized.playerName ||
        getPlayerName() ||
        "你",

      playerName:
        normalized.playerName ||
        normalized.displayName ||
        getPlayerName() ||
        "你",

      pictureUrl:
        normalized.pictureUrl ||
        normalized.avatar ||
        normalized.avatarUrl ||
        "",

      avatar:
        normalized.avatar ||
        normalized.pictureUrl ||
        "",

      avatarUrl:
        normalized.avatarUrl ||
        normalized.pictureUrl ||
        "",

      source,
      version: VERSION,
      pageUrl: location.href,
      userAgent: navigator.userAgent || ""
    });

    const code =
      data.referralCode ||
      data.myReferralCode ||
      data.ownerReferralCode ||
      data.code ||
      "";

    if (code) {
      try {
        localStorage.setItem(REFERRAL.codeKey, code);
      } catch (error) {}

      try {
        localStorage.setItem("ZELO_REFERRAL_CODE", code);
      } catch (error) {}

      try {
        localStorage.setItem("zg_referral_code", code);
      } catch (error) {}

      if (state.profile) {
        state.profile.referralCode = code;
        state.profile.myReferralCode = code;
        state.profile.ownerReferralCode = code;
      }

      if (window.ZELO_PROFILE) {
        window.ZELO_PROFILE.referralCode = code;
        window.ZELO_PROFILE.myReferralCode = code;
        window.ZELO_PROFILE.ownerReferralCode = code;
      }
    }

    return {
      ok: !!code,
      referralCode: code,
      data
    };
  } catch (error) {
    console.warn("[ZELO GAME] syncMyReferralCodeFromServer failed:", error);

    return {
      ok: false,
      reason: "api_failed",
      error
    };
  }
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


var ZELO_LINE_ADD_FRIEND_URL = "https://lin.ee/t6noQCz";

async function checkLineFriendshipBeforeGame() {
  try {
    if (typeof liff === "undefined") {
      console.warn("[ZELO] LIFF SDK not found, skip friendship check");
      return true;
    }

    if (!liff.isLoggedIn()) {
      liff.login({
        redirectUri: window.location.href
      });
      return false;
    }

    var friendship = await liff.getFriendship();

    if (friendship && friendship.friendFlag === true) {
      console.log("[ZELO] User is LINE OA friend");
      return true;
    }

    console.log("[ZELO] User is not LINE OA friend");
    showAddFriendRequiredScreen();
    return false;

  } catch (err) {
    console.error("[ZELO] checkLineFriendshipBeforeGame error:", err);
    return true;
  }
}

function showAddFriendRequiredScreen() {
  if (document.getElementById("zg-add-friend-required")) return;

  var overlay = document.createElement("div");
  overlay.id = "zg-add-friend-required";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "999999";
  overlay.style.background = "rgba(0,0,0,0.86)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "24px";
  overlay.style.boxSizing = "border-box";

  overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:420px;
      background:#ffffff;
      border-radius:20px;
      padding:28px 22px;
      text-align:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      box-shadow:0 18px 48px rgba(0,0,0,.35);
    ">
      <div style="font-size:24px;font-weight:900;color:#111;margin-bottom:12px;">
        請先加入 ZELO 官方 LINE
      </div>
      <div style="font-size:16px;line-height:1.7;color:#444;margin-bottom:22px;">
        加入官方帳號好友後，才能開始挑戰遊戲、累積分數與參加排行榜活動。
      </div>
      <a href="${ZELO_LINE_ADD_FRIEND_URL}" style="
        display:block;
        width:100%;
        box-sizing:border-box;
        background:#06C755;
        color:#fff;
        text-decoration:none;
        font-size:18px;
        font-weight:800;
        border-radius:999px;
        padding:14px 18px;
        margin-bottom:12px;
      ">
        加入 LINE 好友
      </a>
      <button type="button" onclick="window.location.reload()" style="
        width:100%;
        border:0;
        background:#eeeeee;
        color:#111;
        font-size:15px;
        font-weight:700;
        border-radius:999px;
        padding:12px 18px;
      ">
        我已加入，重新檢查
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
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

  function getRewardPoints() {
  try {
    const value = Number(localStorage.getItem(STORAGE.rewardPoints) || 0);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  } catch (error) {
    return 0;
  }
}

function setRewardPoints(points) {
  const safePoints = Math.max(0, Math.round(Number(points) || 0));

  try {
    localStorage.setItem(STORAGE.rewardPoints, String(safePoints));
  } catch (error) {}

  return safePoints;
}

function addRewardPoints(amount) {
  const gain = Math.max(0, Math.round(Number(amount) || 0));
  const next = getRewardPoints() + gain;

  return setRewardPoints(next);
}

function getDailyRewardKey(type = "play") {
  return `${STORAGE.dailyRewardPrefix}${type}_${getTodayKey()}`;
}

function hasDailyRewardClaimed(type = "play") {
  try {
    return localStorage.getItem(getDailyRewardKey(type)) === "1";
  } catch (error) {
    return false;
  }
}

function markDailyRewardClaimed(type = "play") {
  try {
    localStorage.setItem(getDailyRewardKey(type), "1");
  } catch (error) {}
}


function applyServerZeloPointsToUI(serverData) {
  if (!serverData || typeof serverData !== "object") {
    return;
  }

  var gainEl = document.getElementById("zg-points-gain");
  var totalEl = document.getElementById("zg-points-total");

  var hasServerGain = typeof serverData.zeloPointsGain === "number";
  var hasServerTotal = typeof serverData.zeloPoints === "number";

  if (gainEl && hasServerGain) {
    gainEl.textContent = "+" + serverData.zeloPointsGain;
  }

  if (totalEl && hasServerTotal) {
    totalEl.textContent = serverData.zeloPoints;
  }

  if (hasServerTotal && typeof setRewardPoints === "function") {
    setRewardPoints(serverData.zeloPoints);
  }
}

window.applyServerZeloPointsToUI = applyServerZeloPointsToUI;
  

function calculateRewardPointsGain(result = {}) {
  let gain = 5;

  const resultType = result.result || "draw";

  if (resultType === "win") {
    gain += 15;
  } else if (resultType === "draw") {
    gain += 8;
  } else {
    gain += 3;
  }

  if (result.launchGrade === "perfect") {
    gain += 5;
  }

  const playerEnergy = Number(
    result.playerEnergy ??
    result.playerHp ??
    0
  ) || 0;

  if (playerEnergy >= 50) {
    gain += 5;
  }

  if (!hasDailyRewardClaimed("first_play")) {
    gain += 10;
    markDailyRewardClaimed("first_play");
  }

  return gain;
}


/*
 * 【新增】用後端 recordBattleResult 回傳的權威數字，
 * 強制覆蓋畫面上的 ZELO Points 顯示，
 * 取代原本前端 calculateRewardPointsGain() 算出來的本機數字。
 *
 * serverData 就是您 Console 截圖裡 data: {...} 這個物件，
 * 請確認變數名稱跟您實際程式碼裡接收回應的變數名稱一致。
 */
function applyServerZeloPointsToUI(serverData) {
  if (!serverData || typeof serverData !== "object") {
    return;
  }

  var gainEl = document.getElementById("zg-points-gain");
  var totalEl = document.getElementById("zg-points-total");

  var hasServerGain = typeof serverData.zeloPointsGain === "number";
  var hasServerTotal = typeof serverData.zeloPoints === "number";

  if (gainEl && hasServerGain) {
    gainEl.textContent = "+" + serverData.zeloPointsGain;
  }

  if (totalEl && hasServerTotal) {
    totalEl.textContent = serverData.zeloPoints;
  }

  /*
   * 同步覆蓋本機儲存的 ZELO Points，
   * 確保之後開扭蛋機 / 重新整理頁面時，
   * 讀到的也是後端權威數字，而不是舊的本機計算值。
   */
  if (hasServerTotal && typeof setRewardPoints === "function") {
    setRewardPoints(serverData.zeloPoints);
  }
}

window.applyServerZeloPointsToUI = applyServerZeloPointsToUI;

  
function getNextRewardTier(points = getRewardPoints()) {
  const current = Math.max(0, Number(points) || 0);

  return (
    REWARD_TIERS.find((tier) => {
      return current < Number(tier.points || 0);
    }) ||
    REWARD_TIERS[REWARD_TIERS.length - 1] ||
    null
  );
}

function getRewardProgressInfo(points = getRewardPoints()) {
  const current = Math.max(0, Number(points) || 0);
  const nextTier = getNextRewardTier(current);

  if (!nextTier) {
    return {
      current,
      nextTier: null,
      remaining: 0,
      progressPct: 100,
      message: "已達成目前全部獎勵門檻"
    };
  }

  const target = Number(nextTier.points || 0);
  const previousTier = [...REWARD_TIERS]
    .reverse()
    .find((tier) => Number(tier.points || 0) <= current);

  const previousPoints = previousTier ? Number(previousTier.points || 0) : 0;
  const span = Math.max(1, target - previousPoints);

  const progressPct = Math.max(
    0,
    Math.min(100, Math.round(((current - previousPoints) / span) * 100))
  );

  const remaining = Math.max(0, target - current);

  return {
    current,
    nextTier,
    remaining,
    progressPct,
    message: `再累積 ${remaining} 點，解鎖「${nextTier.name}」`
  };
}


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

  function normalizeLiffStateUrlOnce() {
  try {
    const url = new URL(window.location.href);
    const rawState = url.searchParams.get("liff.state") || "";

    if (!rawState) return;

    const decoded = decodeURIComponent(rawState);

    /*
     * 防止 ?liff.state=?liff.state=/...?ref=... 這種二次包裝。
     */
    if (!decoded.includes("liff.state=")) return;

    const nestedMatch = decoded.match(/liff\.state=([^&]+)/);

    if (!nestedMatch || !nestedMatch[1]) return;

    const fixedState = decodeURIComponent(nestedMatch[1]);

    url.searchParams.set("liff.state", fixedState);

    window.history.replaceState(
      {},
      document.title,
      url.toString()
    );

    console.warn("[ZELO GAME] normalized nested liff.state", {
      from: rawState,
      to: fixedState
    });
  } catch (error) {}
}


  function getZeloUrlParam(name) {
  try {
    if (typeof window.getZeloUrlParam === "function") {
      return window.getZeloUrlParam(name) || "";
    }

    return getQueryParam(name) || getUrlParam(name) || "";
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

/*
 * =========================================================
 * TOP TYPE COUNTER SYSTEM / 陀螺類型相剋系統
 * =========================================================
 *
 * 攻擊型 Attack：
 * - 高機動力與強烈猛撞。
 * - 剋制持久型：趁其站穩前高速撞擊擊飛或打散平衡。
 * - 被防禦型剋制：撞擊力被厚重外殼卸除，自身體力消耗殆盡。
 *
 * 防禦型 Defense：
 * - 重量高，不易被擊飛。
 * - 剋制攻擊型：用重裝甲和離心力吸收並化解猛攻。
 * - 被持久型剋制：缺乏主動進攻能力，在純持久戰中容易輸掉。
 *
 * 持久型 Stamina：
 * - 低摩擦力，轉動時間最長。
 * - 剋制防禦型：靠穩定迴旋撐到最後獲勝。
 * - 被攻擊型剋制：開場容易被猛烈撞擊導致軌跡崩潰。
 *
 * 平衡型 Balance：
 * - 綜合前三者特質。
 * - 沒有明顯剋制，也沒有明顯弱點。
 */

const TOP_TYPE_COUNTER = {
  attack: {
    beats: "stamina",
    losesTo: "defense",
    label: "攻擊型"
  },

  defense: {
    beats: "attack",
    losesTo: "stamina",
    label: "防禦型"
  },

  stamina: {
    beats: "defense",
    losesTo: "attack",
    label: "持久型"
  },

  balance: {
    beats: "",
    losesTo: "",
    label: "平衡型"
  },

  /*
   * 隱藏速度型視為攻擊型分支。
   * 剋持久，但被防禦壓制。
   */
  speed: {
    beats: "stamina",
    losesTo: "defense",
    label: "速度型"
  }
};

function normalizeTopType(type) {
  const value = String(type || "").toLowerCase();

  if (value === "atk") return "attack";
  if (value === "def") return "defense";
  if (value === "sta") return "stamina";
  if (value === "bal") return "balance";
  if (value === "endurance") return "stamina";
  if (value === "durability") return "stamina";

  if (TOP_TYPE_COUNTER[value]) {
    return value;
  }

  return "balance";
}

function getTopTypeLabel(type) {
  const normalized = normalizeTopType(type);
  return TOP_TYPE_COUNTER[normalized]?.label || "平衡型";
}

function getTypeMatchup(attackerType, defenderType) {
  const atk = normalizeTopType(attackerType);
  const def = normalizeTopType(defenderType);

  if (atk === def) {
    return {
      relation: "same",
      attackMul: 1,
      defenseMul: 1,
      energyDamageMul: 1,
      spinDamageMul: 1,
      knockbackMul: 1,
      burstMul: 1,
      naturalDrainMul: 1,
      selfDrainMul: 1,
      commentary: ""
    };
  }

  const atkRule = TOP_TYPE_COUNTER[atk] || TOP_TYPE_COUNTER.balance;

  /*
   * attacker 剋 defender。
   *
   * 注意：
   * 這裡倍率刻意做小。
   * 相剋是戰術方向，不是秒殺倍率。
   */
  if (atkRule.beats === def) {
    return {
      relation: "advantage",

      /*
       * 優勢方攻擊略增。
       */
      attackMul: 1.075,

      /*
       * 對方防禦略降。
       */
      defenseMul: 0.965,

      /*
       * 能量與轉速傷害略增。
       */
      energyDamageMul: 1.065,
      spinDamageMul: 1.065,

      /*
       * 擊飛與爆裂略增，但不暴力。
       */
      knockbackMul: 1.075,
      burstMul: 1.06,

      /*
       * 被剋方自然耗能略高。
       */
      naturalDrainMul: 1.035,

      /*
       * 攻擊方自身耗損。
       */
      selfDrainMul: 1,

      commentary: `${getTopTypeLabel(atk)}剋制${getTopTypeLabel(def)}！`
    };
  }

  /*
   * attacker 被 defender 剋。
   */
  if (atkRule.losesTo === def) {
    return {
      relation: "disadvantage",

      /*
       * 被剋制時攻擊效率下降，但不會完全無效。
       */
      attackMul: 0.94,
      defenseMul: 1.035,
      energyDamageMul: 0.935,
      spinDamageMul: 0.94,
      knockbackMul: 0.92,
      burstMul: 0.92,

      /*
       * 被剋時自己消耗略高。
       */
      naturalDrainMul: 1.025,
      selfDrainMul: 1.04,

      commentary: `${getTopTypeLabel(atk)}被${getTopTypeLabel(def)}壓制！`
    };
  }

  return {
    relation: "neutral",
    attackMul: 1,
    defenseMul: 1,
    energyDamageMul: 1,
    spinDamageMul: 1,
    knockbackMul: 1,
    burstMul: 1,
    naturalDrainMul: 1,
    selfDrainMul: 1,
    commentary: ""
  };
}



  
  function getFeel(top) {
  const type = normalizeTopType(top?.type);

  return FEEL[type] || FEEL.balance;
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

  return getTopById(id);
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
    /*
     * 快取 PERF 參考，減少重複屬性查找。
     * 並把開銷較低的整數比較放在最前面，
     * 只有真的需要判斷時間差時才呼叫 now()（避免不必要的 performance.now() 呼叫）。
     */
    const perf = PERF;

    if (perf.lowFx && perf.activeFx > 6) return false;
    if (perf.activeFx >= perf.maxFx) return false;

    const t = now();

    if (t - perf.lastFxAt < gap) return false;

    perf.lastFxAt = t;
    return true;
  }

  function fxAdd() {
    /*
     * 位元運算取代加法賦值，效果相同但在高頻呼叫下略有優勢。
     */
    PERF.activeFx = (PERF.activeFx + 1) | 0;
  }

  function fxRemove() {
    const next = (PERF.activeFx - 1) | 0;
    PERF.activeFx = next > 0 ? next : 0;
  }

  function updatePerf(dtRaw) {
    const perf = PERF;

    if (dtRaw > 1.25) {
      perf.frameSlowCount = (perf.frameSlowCount + 1) | 0;
    } else {
      const next = (perf.frameSlowCount - 2) | 0;
      perf.frameSlowCount = next > 0 ? next : 0;
    }

    perf.lowFx = perf.frameSlowCount > 6;
  }

  function fxCount(base, intensity = 1) {
    const mul = PERF.lowFx ? 0.18 : 0.45;

    /*
     * 用 | 0 取代 Math.round：
     * +0.5 後取整數位元，行為等同四捨五入，
     * 但避免呼叫 Math.round()，在高頻碰撞特效計算時開銷更低。
     */
    const value = (base * intensity * mul + 0.5) | 0;

    return value > 1 ? value : 1;
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
      master.gain.value = 0.65;
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

  const p = clamp(Number(power) || 1, 0.25, 2.2);
  const s = clamp(Number(sharpness) || 1, 0.65, 1.65);

  /*
   * 通用金屬音：
   * 保留給舊流程 / fallback / finish / center duel 使用。
   * 內建碰撞音效會用 collisionLight / collisionNormal / collisionHeavy，
   * 但其他地方仍然會呼叫 Sound.metal()。
   */
  tone(820 * s, 0.06, 0.12 * p, "square", 260 * s);
  tone(2200 * s, 0.038, 0.055 * p, "sawtooth", 780);
  noise(0.055, 0.15 * p, 3200 * s);
}


    
function collisionLight(power = 1) {
  resume();

  const p = clamp(Number(power) || 1, 0.2, 1.6);

  /*
   * 輕碰：
   * 短促金屬 click + 少量刮擦
   */
  tone(980 + rand(-80, 120), 0.035, 0.055 * p, "square", 420);
  tone(2100 + rand(-160, 220), 0.025, 0.025 * p, "triangle", 1200);
  noise(0.035, 0.055 * p, 2800);
}

function collisionNormal(power = 1) {
  resume();

  const p = clamp(Number(power) || 1, 0.25, 2);

  /*
   * 一般碰撞：
   * 金屬敲擊 + 中頻刮擦 + 小低頻
   */
  tone(720 + rand(-70, 90), 0.055, 0.105 * p, "square", 260);
  tone(1650 + rand(-160, 220), 0.04, 0.052 * p, "sawtooth", 780);
  tone(120 + rand(-12, 18), 0.08, 0.045 * p, "sine", 68);
  noise(0.06, 0.12 * p, 3300);
}

function collisionHeavy(power = 1) {
  resume();

  const p = clamp(Number(power) || 1, 0.45, 2.5);

  /*
   * 重擊：
   * 低頻 punch + 金屬爆音 + 白噪衝擊
   */
  tone(86, 0.16, 0.18 * p, "sine", 38);
  tone(380 + rand(-35, 45), 0.085, 0.16 * p, "square", 120);
  tone(1450 + rand(-180, 260), 0.055, 0.085 * p, "sawtooth", 520);
  tone(2600 + rand(-220, 300), 0.035, 0.045 * p, "triangle", 1200);
  noise(0.09, 0.22 * p, 2600);
}

function collisionFirst(power = 1) {
  resume();

  const p = clamp(Number(power) || 1, 0.5, 2.6);

  /*
   * 首次接觸：
   * 比重擊更戲劇化，帶一個上升金屬音。
   */
  tone(72, 0.2, 0.22 * p, "sine", 36);
  tone(520, 0.09, 0.16 * p, "square", 180);
  tone(1280, 0.075, 0.1 * p, "sawtooth", 480);
  tone(2600, 0.055, 0.06 * p, "triangle", 1600);
  noise(0.11, 0.25 * p, 3200);
}

function collisionByKind(kind = "normal", power = 1) {
  const p = clamp(Number(power) || 1, 0.2, 2.6);

  if (kind === "first") {
    collisionFirst(p);
    return;
  }

  if (kind === "heavy") {
    collisionHeavy(p);
    return;
  }

  if (kind === "light") {
    collisionLight(p);
    return;
  }

  collisionNormal(p);
}

function wallHit(power = 1) {
  resume();

  const p = clamp(Number(power) || 1, 0.25, 1.8);

  /*
   * 牆壁反彈：
   * 不做很厚的打擊，避免誤以為扣血。
   */
  tone(420 + rand(-30, 40), 0.055, 0.08 * p, "triangle", 180);
  tone(960 + rand(-90, 120), 0.03, 0.035 * p, "square", 520);
  noise(0.055, 0.075 * p, 1800);
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

  /*
   * 不使用 shorthand: metal
   * 避免部署 / 壓縮 / 插入位置錯誤時出現 metal is not defined。
   */
  metal: function(power = 1, sharpness = 1) {
    resume();

    const p = clamp(Number(power) || 1, 0.25, 2.2);
    const s = clamp(Number(sharpness) || 1, 0.65, 1.65);

    tone(820 * s, 0.06, 0.12 * p, "square", 260 * s);
    tone(2200 * s, 0.038, 0.055 * p, "sawtooth", 780);
    noise(0.055, 0.15 * p, 3200 * s);
  },

  collisionLight,
  collisionNormal,
  collisionHeavy,
  collisionFirst,
  collisionByKind,
  wallHit,

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
 * 03-0. BUILT-IN COLLISION SFX / 內建碰撞音效
 * ---------------------------------------------------------
 *
 * 不再使用外部 mp3。
 * CollisionSfx 保留同名 API，避免其他地方要大改。
 */
const CollisionSfx = (() => {
  let ctx = null;
  let master = null;
  let lastHitAt = 0;

  const MIN_GAP = 35;

  function getCtx() {
    if (!ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        console.warn("[SFX] Web Audio not supported");
        return null;
      }

      ctx = new AudioContextClass();

      master = ctx.createGain();
      master.gain.value = 0.95;
      master.connect(ctx.destination);

      console.log("[SFX] AudioContext created", ctx.state);
    }

    return ctx;
  }

  async function resume() {
    const audioCtx = getCtx();

    if (!audioCtx) return null;

    if (audioCtx.state === "suspended") {
      try {
        await audioCtx.resume();
        console.log("[SFX] AudioContext resumed", audioCtx.state);
      } catch (error) {
        console.warn("[SFX] resume failed", error);
      }
    }

    return audioCtx;
  }

  function metal(intensity = 1) {
    const audioCtx = getCtx();

    if (!audioCtx || !master) return;

    const t = audioCtx.currentTime;
    const power = Math.max(0.15, Math.min(2.2, Number(intensity) || 1));

    const out = audioCtx.createGain();

    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.5 * power, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    out.connect(master);

    /*
     * 金屬撞擊高頻
     */
    const freqs = [420, 720, 980, 1380, 1920, 2600];

    freqs.forEach((freq, index) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = index % 2 === 0 ? "square" : "triangle";

      osc.frequency.setValueAtTime(
        freq * (0.9 + Math.random() * 0.2),
        t
      );

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(
        (0.16 / (index + 1)) * power,
        t + 0.004
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t + 0.07 + index * 0.022
      );

      osc.connect(gain);
      gain.connect(out);

      osc.start(t);
      osc.stop(t + 0.22);
    });

    /*
     * 低頻撞擊 punch
     */
    const thump = audioCtx.createOscillator();
    const thumpGain = audioCtx.createGain();

    thump.type = "sine";
    thump.frequency.setValueAtTime(95, t);
    thump.frequency.exponentialRampToValueAtTime(42, t + 0.13);

    thumpGain.gain.setValueAtTime(0.0001, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.6 * power, t + 0.006);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

    thump.connect(thumpGain);
    thumpGain.connect(out);

    thump.start(t);
    thump.stop(t + 0.17);

    /*
     * 白噪刮擦感
     */
    const duration = 0.08;
    const len = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
    const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }

    const noise = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const noiseGain = audioCtx.createGain();

    noise.buffer = buffer;

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2600 + Math.random() * 1200, t);
    filter.Q.setValueAtTime(5, t);

    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.22 * power, t + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(out);

    noise.start(t);
    noise.stop(t + duration + 0.02);
  }

  return {
    async preload() {
      const audioCtx = await resume();

      if (!audioCtx || !master) return;

      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

      osc.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + 0.03);

      console.log("[SFX] preload done", audioCtx.state);
    },

    async hit(intensity = 1) {
      const audioCtx = await resume();

      if (!audioCtx) return;

      const t = performance.now();

      if (t - lastHitAt < MIN_GAP) {
        return;
      }

      lastHitAt = t;

      console.log("[SFX] hit", {
        state: audioCtx.state,
        intensity
      });

      metal(intensity);
    },

    async playByImpact(kind = "normal", intensity = 1) {
      const power = Math.max(0.2, Math.min(2.4, Number(intensity) || 1));

      if (kind === "first") {
        await this.hit(power * 1.45);
        return;
      }

      if (kind === "heavy") {
        await this.hit(power * 1.25);
        return;
      }

      if (kind === "light") {
        await this.hit(power * 0.7);
        return;
      }

      await this.hit(power);
    },

    async play(kind = "normal", options = {}) {
      const volume =
        typeof options.volume === "number"
          ? Math.max(0, Math.min(1, options.volume))
          : 0.75;

      const playbackRate =
        typeof options.playbackRate === "number"
          ? Math.max(0.75, Math.min(1.35, options.playbackRate))
          : 1;

      const power = Math.max(
        0.25,
        Math.min(2.4, volume * 1.25 * playbackRate)
      );

      await this.playByImpact(kind, power);
    },

    debug() {
      const audioCtx = getCtx();

      console.log("[SFX] debug", {
        hasCtx: !!audioCtx,
        state: audioCtx ? audioCtx.state : null,
        hasMaster: !!master
      });
    }
  };
})();


  window.testCollisionSfx = function () {
  CollisionSfx.preload();
  setTimeout(() => {
    CollisionSfx.hit(1);
  }, 150);
};

  
/*
 * ---------------------------------------------------------
 * 03-1. HOME MUSIC / 首頁音樂
 * ---------------------------------------------------------
 */
let homeMusicAudio = null;
let homeMusicUnlocked = false;

/*
 * 首頁影片防重播鎖：
 * 用 window 級別，不跟 DOM 一起被 hardResetGamePage 清掉。
 */
window.__ZG_HOME_VIDEO_STARTED__ = window.__ZG_HOME_VIDEO_STARTED__ || false;
window.__ZG_HOME_VIDEO_PLAYING__ = window.__ZG_HOME_VIDEO_PLAYING__ || false;

function safePlayHomeVideo(source = "unknown") {
  const home = screenStart();
  const video = home ? $(".zg-home-video", home) : null;

  if (!video) return;

  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  /*
   * 已經播放過就不要重設 currentTime，也不要重複 play。
   */
  if (window.__ZG_HOME_VIDEO_STARTED__ && !video.paused) {
    return;
  }

  /*
   * 防止短時間重複 play。
   */
  if (window.__ZG_HOME_VIDEO_PLAYING__) {
    return;
  }

  window.__ZG_HOME_VIDEO_PLAYING__ = true;

  const playPromise = video.play();

  if (playPromise && typeof playPromise.then === "function") {
    playPromise
      .then(() => {
        window.__ZG_HOME_VIDEO_STARTED__ = true;
        window.__ZG_HOME_VIDEO_PLAYING__ = false;

        if (window.ZELO_GAME_DEBUG) {
          console.log("[ZELO GAME] home video play ok:", source);
        }
      })
      .catch((error) => {
        window.__ZG_HOME_VIDEO_PLAYING__ = false;

        if (window.ZELO_GAME_DEBUG) {
          console.warn("[ZELO GAME] home video play failed:", source, error);
        }
      });

    return;
  }

  window.__ZG_HOME_VIDEO_STARTED__ = true;
  window.__ZG_HOME_VIDEO_PLAYING__ = false;
}

  
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

  audio.volume = 0.38;

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

  function invalidateResultFlow(reason = "unknown") {
  /*
   * 讓所有結果頁 / 結果影片 / 延遲跳轉流程失效。
   * 用於：
   * - 更換陀螺
   * - 再戰一次
   * - 回首頁
   * - 重新開始戰鬥
   */
  window.__zgScreenToken = (window.__zgScreenToken || 0) + 1;
  window.__zgResultToken = (window.__zgResultToken || 0) + 1;

  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = true;
  window.__ZELO_BATTLE_FINISH_SEQUENCE_STARTED__ = false;


  state.finishing = false;
  state.finishStartedAt = 0;
  state.pendingResult = null;

  if (state.battle) {
    state.battle.ended = true;
  }

  if (window.ZELO_GAME_DEBUG) {
    console.log("[ZELO GAME] invalidateResultFlow:", reason, {
      screenToken: window.__zgScreenToken,
      resultToken: window.__zgResultToken
    });
  }
}


  

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
  "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/Lyria_3_Clip_-_1.mp3?v=1784596390";

function getBattleMusicAudio() {
  if (!window.zgBattleBgmAudio) {
    window.zgBattleBgmAudio = new Audio(ZG_BATTLE_MUSIC_URL);
    window.zgBattleBgmAudio.loop = true;
    window.zgBattleBgmAudio.preload = "auto";
    window.zgBattleBgmAudio.volume = 0.38;
  }

  return window.zgBattleBgmAudio;
}

function startBattleMusic() {
  try {
    const audio = getBattleMusicAudio();

    audio.loop = true;
    audio.volume = 0.38;

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
      audio.volume = 0.38;

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
    ".zg-xtreme-dash-trail",
".zg-xtreme-dash-bolt",
".zg-xtreme-dash-orb",
".zg-xtreme-dash-shock",
".zg-xtreme-dash-flare",
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
  state.screen = "";
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

  /*
   * 避免 ensureAppHeight() 每次呼叫都重複綁事件。
   */
  if (window.__ZG_APP_HEIGHT_BOUND__) {
    return;
  }

  window.__ZG_APP_HEIGHT_BOUND__ = true;

  let raf = null;

  const scheduleSet = () => {
    if (raf) return;

    raf = requestAnimationFrame(() => {
      raf = null;
      set();
    });
  };

  window.addEventListener("resize", scheduleSet, {
    passive: true
  });

  window.addEventListener(
    "orientationchange",
    () => {
      setTimeout(set, 80);
      setTimeout(set, 250);
      setTimeout(set, 600);
    },
    {
      passive: true
    }
  );

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleSet, {
      passive: true
    });

    /*
     * 不監聽 visualViewport scroll。
     * 手機 WebView 捲動時 visualViewport 會頻繁變動，
     * 會導致 --zg-app-height 反覆更新。
     */
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

    window.ZGMenuObserver = null;
  }

  /*
   * 不要監聽 document.documentElement。
   * 遊戲內 DOM / FX / result / resize 都會造成大量 mutation。
   *
   * 改成只監聽 body 的第一層新增節點即可，
   * 用來處理 Shopify header / menu 被 theme 動態插回來的情況。
   */
  const target = document.body;

  if (!target) return;

  let scheduled = false;

  const observer = new MutationObserver(() => {
    if (scheduled) return;

    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      removeMenuDom();
      removeLogoDom();
    });
  });

  observer.observe(target, {
    childList: true,
    subtree: false
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

  /*
   * Boot 階段只建立首頁。
   * 其他 select / battle / result / resultVideo
   * 交給 showScreen 或各流程需要時再建立。
   * 避免 boot 時過早建立 battle/result 造成初始化錯誤。
   */
  if (!screenStart()) {
    ensureHomeDom(root);
  }

  removeDuplicateScreenDom();

  return root;
}


function showScreen(name) {
    /*
   * 每次呼叫 showScreen 都讓畫面世代 +1。
   * 讓 onResultShown() 裡殘留的延遲計時器能偵測到畫面已經切換，
   * 避免舊的 forceResultVisible() 在錯誤的時間點把結果頁疊蓋回來。
   */
  window.__zgScreenToken = (window.__zgScreenToken || 0) + 1;

  if (name !== "result" && name !== "resultVideo") {
  /*
   * 只要離開結果頁或結果影片頁，就讓結果流程失效。
   * 避免舊的 forceResultVisible / playFinishSequence timeout 把畫面拉回去。
   */
  window.__zgResultToken = (window.__zgResultToken || 0) + 1;

  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = true;

  if (state.screen === "result" || state.screen === "resultVideo") {
    state.finishing = false;
    state.finishStartedAt = 0;
    state.pendingResult = null;
  }
}

  
  const normalizedName = name === "home" ? "start" : name;
  const root = appRoot();

  /*
   * 切到哪一頁，才建立哪一頁。
   */
  if (normalizedName === "start" && !screenStart()) {
    ensureHomeDom(root);
  }

  if (normalizedName === "select" && !screenSelect()) {
    ensureSelectDom(root);
  }

  if (normalizedName === "battle" && !screenBattle()) {
    ensureBattleDom(root);
  }

  if (normalizedName === "resultVideo" && !screenResultVideo()) {
    ensureResultVideoDom(root);
  }

  if (normalizedName === "result" && !screenResult()) {
    ensureResultDom(root);
  }

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

  safePlayHomeVideo("onHomeShown");

  removeMenuDom();
  removeLogoDom();

  setTimeout(() => {
    preloadFriendRank("home_shown");
  }, 500);
}

function onSelectShown() {
  /*
   * 進入選擇頁前，確保戰鬥 / 蓄力 / 音樂都已停止，
   * 避免從戰鬥頁快速返回選擇頁時殘留狀態。
   */
  stopBattle();
  cancelChargeLoop();
  stopBattleMusic();

  const root = appRoot();

  if (!screenSelect()) {
    ensureSelectDom(root);
  }

  state.selectedTop = state.selectedTop || loadSelectedTop();

  renderTopSelection();

  /*
   * 排版修正：
   * 比照 onBattleShown / onResultShown 的作法，
   * 立即執行一次，並延遲多次重跑，
   * 確保 LINE WebView / Shopify 容器在畫面切換瞬間
   * 尺寸計算完成後，仍能套用正確的滿版與可捲動樣式。
   */
  forceSelectScrollable();

  setTimeout(forceSelectScrollable, 80);
  setTimeout(forceSelectScrollable, 250);
  setTimeout(forceSelectScrollable, 600);

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

  const compact = appHeight < 860 || appWidth <= 430;
  const veryCompact = appHeight < 740 || appWidth <= 375;

  /*
   * 底部固定戰鬥按鈕區實際佔用高度。
   *
   * battle button: 54px
   * bottom offset: 12px
   * breathing: 18~24px
   *
   * 這個值只用來讓 main 可視高度避開 fixed bottom，
   * 不會改按鈕高度。
   */
  const bottomSpace = veryCompact ? 84 : compact ? 90 : 96;

  if (root) {
    set(root, "position", "fixed");

    /*
     * 改成真正滿版，避免 0 auto auto 0 造成邊界異常。
     */
    set(root, "inset", "0");
    set(root, "left", "0");
    set(root, "top", "0");
    set(root, "right", "0");
    set(root, "bottom", "0");

    set(root, "width", "100vw");
    set(root, "min-width", "100vw");
    set(root, "max-width", "100vw");

    set(root, "height", "100dvh");
    set(root, "min-height", "100dvh");
    set(root, "max-height", "100dvh");

    set(root, "margin", "0");
    set(root, "padding", "0");
    set(root, "overflow", "hidden");
    set(root, "box-sizing", "border-box");
    set(root, "touch-action", "pan-y");
    set(root, "z-index", "999999");
  }

  selectScreen.hidden = false;
  selectScreen.removeAttribute("hidden");
  selectScreen.classList.add("active", "is-active");
  selectScreen.setAttribute("aria-hidden", "false");

  set(selectScreen, "position", "fixed");

  /*
   * 改成真正滿版。
   */
  set(selectScreen, "inset", "0");
  set(selectScreen, "left", "0");
  set(selectScreen, "top", "0");
  set(selectScreen, "right", "0");
  set(selectScreen, "bottom", "0");

  set(selectScreen, "width", "100vw");
  set(selectScreen, "min-width", "100vw");
  set(selectScreen, "max-width", "100vw");

  set(selectScreen, "height", "100dvh");
  set(selectScreen, "min-height", "100dvh");
  set(selectScreen, "max-height", "100dvh");

  /*
   * 關鍵：
   * selectScreen 不再自己捲動。
   * 否則內容會跑到 fixed bottom 後面，產生底部裁邊。
   */
  set(selectScreen, "display", "flex");
  set(selectScreen, "flex-direction", "column");
  set(selectScreen, "align-items", "stretch");
  set(selectScreen, "justify-content", "flex-start");

  set(selectScreen, "overflow", "hidden");
  set(selectScreen, "overflow-y", "hidden");
  set(selectScreen, "overflow-x", "hidden");
  set(selectScreen, "-webkit-overflow-scrolling", "auto");
  set(selectScreen, "overscroll-behavior-y", "contain");
  set(selectScreen, "overscroll-behavior-x", "none");
  set(selectScreen, "touch-action", "pan-y");

  /*
   * 不要在 selectScreen 留 padding-bottom。
   * 底部空間由 main 高度扣掉 fixed bottom 處理。
   */
  set(selectScreen, "padding-bottom", "0");

  set(selectScreen, "box-sizing", "border-box");
  set(selectScreen, "pointer-events", "auto");
  set(selectScreen, "visibility", "visible");
  set(selectScreen, "opacity", "1");

  if (main) {
    set(main, "position", "relative");

    set(main, "display", "flex");
    set(main, "flex-direction", "column");
    set(main, "align-items", "center");
    set(main, "justify-content", "flex-start");

    set(main, "width", "100%");
    set(main, "min-width", "0");
    set(main, "max-width", "100%");

    /*
     * 關鍵：
     * main 是唯一捲動區。
     * 高度直接扣掉 bottom fixed button 區域。
     * 這樣內容不會渲染到按鈕後面，自然不會出現裁邊。
     */
    set(
      main,
      "height",
      `calc(100dvh - env(safe-area-inset-bottom, 0px) - ${bottomSpace}px)`
    );
    set(
      main,
      "min-height",
      `calc(100dvh - env(safe-area-inset-bottom, 0px) - ${bottomSpace}px)`
    );
    set(
      main,
      "max-height",
      `calc(100dvh - env(safe-area-inset-bottom, 0px) - ${bottomSpace}px)`
    );

    set(main, "flex", "0 0 auto");

    set(main, "overflow", "hidden");
    set(main, "overflow-y", "auto");
    set(main, "overflow-x", "hidden");
    set(main, "-webkit-overflow-scrolling", "touch");
    set(main, "overscroll-behavior", "contain");
    set(main, "touch-action", "pan-y");

    /*
     * main 底部只留一點自然呼吸空間。
     * 不要再塞 88px / 72px 類型的大 padding，
     * 不然會讓底部出現空區或卡片裁邊。
     */
    set(main, "padding-bottom", veryCompact ? "10px" : compact ? "12px" : "14px");

    set(main, "box-sizing", "border-box");
    set(main, "pointer-events", "auto");
    set(main, "z-index", "5");

    /*
     * 避免 main 自己產生底部深色塊。
     * 如果你的 select screen 需要背景，應交給 selectScreen 或背景層。
     */
    set(main, "background", "transparent");
    set(main, "background-color", "transparent");
    set(main, "background-image", "none");

    /*
     * 隱藏 scrollbar。
     */
    set(main, "scrollbar-width", "none");
  }

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

  const secret = $(".zg-secret-tops-preview", selectScreen);

  if (secret) {
    set(secret, "display", "block");
    set(secret, "width", "calc(100% - 24px)");
    set(secret, "max-width", "520px");
    set(secret, "margin", "28px auto 0");

    /*
     * 關鍵：
     * 這裡不要再加 env + 72px。
     * 因為 main 高度已經扣掉 fixed bottom。
     */
    set(secret, "padding-bottom", "0");

    set(secret, "box-sizing", "border-box");
    set(secret, "position", "relative");
    set(secret, "z-index", "8");
  }

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

  $$(
    ".zg-select-bg, .zg-select-orb, .zg-select-grid, .zg-select-stars",
    selectScreen
  ).forEach((el) => {
    set(el, "pointer-events", "none");
  });

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

    /*
     * fixed bottom 本體完全透明。
     */
    set(bottom, "background", "transparent");
    set(bottom, "background-color", "transparent");
    set(bottom, "background-image", "none");
    set(bottom, "border", "0");
    set(bottom, "box-shadow", "none");
    set(bottom, "filter", "none");
    set(bottom, "backdrop-filter", "none");
    set(bottom, "-webkit-backdrop-filter", "none");

    set(bottom, "z-index", "90");
    set(bottom, "box-sizing", "border-box");

    /*
     * 容器透明，避免整塊 fixed bottom 攔截滑動。
     * 按鈕本身下面會再打開 pointer-events。
     */
    set(bottom, "pointer-events", "none");
    set(bottom, "touch-action", "manipulation");
    set(bottom, "isolation", "isolate");
  }

  if (battleBtn) {
    battleBtn.classList.add("zg-select-battle-btn", "zg-btn", "zg-btn-red");

    set(battleBtn, "width", "100%");
    set(battleBtn, "min-width", "0");
    set(battleBtn, "max-width", "100%");

    /*
     * 保留原本按鈕高度，不改。
     */
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




function onBattleShown() {
 ensureBattleDom(appRoot());
  normalizeBattleLayoutDom();
  removeDuplicateChargeDom();
  ensureBattleLiveStatsDom();
  updateBattleLiveStats();
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

  if (!screenResult()) {
    ensureResultDom(root);
  }

  const resultScreen = screenResult();

  ["#screen-start", "#screen-home", "#screen-select", "#screen-battle", "#screen-result-video"].forEach((selector) => {
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

  if (resultScreen) {
    const resultBg = [
      "radial-gradient(circle at 50% 0%, rgba(117,132,190,0.52) 0%, rgba(117,132,190,0.22) 26%, transparent 48%)",
      "radial-gradient(circle at 20% 4%, rgba(255,62,110,0.14) 0%, transparent 34%)",
      "radial-gradient(circle at 86% 12%, rgba(87,242,255,0.14) 0%, transparent 36%)",
      "radial-gradient(circle at 50% 100%, rgba(38,72,132,0.36) 0%, transparent 48%)",
      "linear-gradient(180deg, #171a2e 0%, #12182c 36%, #0d172a 64%, #091426 100%)"
    ].join(", ");

    resultScreen.hidden = false;
    resultScreen.removeAttribute("hidden");
    resultScreen.classList.add("active", "is-active", "zg-result-screen");
    resultScreen.setAttribute("aria-hidden", "false");

    resultScreen.style.setProperty("position", "fixed", "important");
    resultScreen.style.setProperty("inset", "0", "important");
    resultScreen.style.setProperty("left", "0", "important");
    resultScreen.style.setProperty("top", "0", "important");
    resultScreen.style.setProperty("right", "0", "important");
    resultScreen.style.setProperty("bottom", "0", "important");

    resultScreen.style.setProperty("width", "100vw", "important");
    resultScreen.style.setProperty("min-width", "100vw", "important");
    resultScreen.style.setProperty("max-width", "100vw", "important");

    resultScreen.style.setProperty("height", "100dvh", "important");
    resultScreen.style.setProperty("min-height", "100dvh", "important");
    resultScreen.style.setProperty("max-height", "100dvh", "important");

    resultScreen.style.setProperty("display", "flex", "important");
    resultScreen.style.setProperty("visibility", "visible", "important");
    resultScreen.style.setProperty("opacity", "1", "important");
    resultScreen.style.setProperty("pointer-events", "auto", "important");
    resultScreen.style.setProperty("flex-direction", "column", "important");
    resultScreen.style.setProperty("touch-action", "pan-y", "important");
    resultScreen.style.setProperty("box-sizing", "border-box", "important");
    resultScreen.style.setProperty("transform", "none", "important");

    resultScreen.style.setProperty("background", resultBg, "important");
    resultScreen.style.setProperty("background-color", "#091426", "important");
    resultScreen.style.setProperty("background-image", resultBg, "important");
    resultScreen.style.setProperty("background-size", "cover", "important");
    resultScreen.style.setProperty("background-position", "center center", "important");
    resultScreen.style.setProperty("background-repeat", "no-repeat", "important");

    resultScreen.style.setProperty("overflow", "hidden", "important");
    resultScreen.style.setProperty("isolation", "isolate", "important");
    resultScreen.style.setProperty("z-index", "99999", "important");
  }

  const result =
    state.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null);

  if (result) {
    renderResult(result);
  }

  /*
   * ---------------------------------------------------------
   * 關鍵修正：
   * 記錄這次呼叫 onResultShown 當下的畫面世代 token。
   *
   * 問題根源：
   * 下面這幾個 setTimeout(forceResultVisible, ...) 是為了修正
   * LINE WebView / Shopify 容器在畫面剛切換瞬間尺寸計算未完成的問題。
   *
   * 但如果玩家在這 900ms 內就按了「再戰一次」切到戰鬥畫面，
   * 這些延遲觸發的 forceResultVisible() 會在戰鬥畫面顯示之後才執行，
   * 而 forceResultVisible() 內部沒有檢查目前是否仍在結果頁，
   * 會直接把結果頁強制 display:flex + opacity:1 + pointer-events:auto
   * 疊蓋回最上層，造成「按下再戰一次，畫面秒跳回結果頁」的錯覺。
   *
   * 修正方式：
   * 用一個全域遞增 token 標記「目前畫面世代」。
   * showScreen() 每次呼叫都會讓 token 遞增（見 showScreen 的修改）。
   * 這裡延遲執行時，只有 token 沒有變化、且畫面仍在 result，
   * 才允許真的執行 forceResultVisible()。
   * ---------------------------------------------------------
   */
  const myScreenToken =
    (window.__zgScreenToken = (window.__zgScreenToken || 0) + 1);

  const safeForceResultVisible = () => {
    if (state.screen !== "result") return;
    if (window.__zgScreenToken !== myScreenToken) return;

    forceResultVisible();
  };

  safeForceResultVisible();

  setTimeout(safeForceResultVisible, 120);
  setTimeout(safeForceResultVisible, 420);
  setTimeout(safeForceResultVisible, 900);

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
  section.className = "zg-screen zg-home-video-screen";

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
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
 

  /*
   * 不在 ensureHomeDom 直接 play。
   * 統一交給 onHomeShown() 的 safePlayHomeVideo()，
   * 避免 LIFF redirect / DOM 重建時連續 play 導致跳動。
   */
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


async function handleHomeStart() {
  try {
    Sound.resume();

    await CollisionSfx.preload();
    await CollisionSfx.hit(0.35);

    console.log("[SFX] home start preload ok");
  } catch (e) {
    console.warn("[SFX] home start preload failed", e);
  }

  if (shouldIgnoreRepeatedAction("start", 500)) return;
  Sound.resume();

/*
 * 使用者點擊後喚醒內建碰撞音效。
 * Web Audio 需要使用者互動後才穩定播放。
 */
CollisionSfx.preload();


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
  const unlocked = isSecretTopUnlocked(top.id);

  const statsHtml = `
    <div class="zg-stat">
      <span>攻擊</span>
      <strong>${escapeHtml(String(top.power ?? "?"))}</strong>
    </div>
    <div class="zg-stat">
      <span>防禦</span>
      <strong>${escapeHtml(String(top.defense ?? "?"))}</strong>
    </div>
    <div class="zg-stat">
      <span>耐久</span>
      <strong>${escapeHtml(String(top.stamina ?? "?"))}</strong>
    </div>
    <div class="zg-stat">
      <span>速度</span>
      <strong>${escapeHtml(String(top.speed ?? "?"))}</strong>
    </div>
  `;

  const iconHtml = `
    <div
      class="zg-top-icon zg-secret-top-icon ${escapeHtml(top.type || "")} ${unlocked ? "is-unlocked" : "is-locked"}"
      style="--c1:${escapeAttr(top.colorA || "#ff2b7a")};--c2:${escapeAttr(top.colorB || "#57f2ff")}; position:relative !important; overflow:hidden !important;"
    >
      <img
        class="zg-top-photo zg-secret-top-photo"
        src="${escapeAttr(top.image || DEFAULT_TOP_IMAGE)}"
        alt="${escapeAttr(top.name || "隱藏陀螺")}"
        draggable="false"
        style="display:block !important; visibility:visible !important; opacity:1 !important; position:absolute !important; inset:0 !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; object-fit:cover !important; object-position:center !important; z-index:5 !important; margin:0 !important; padding:0 !important; border:0 !important; border-radius:999px !important; pointer-events:none !important;"
      >
      ${unlocked ? "" : `<span class="zg-secret-lock-badge" aria-hidden="true">🔒</span>`}
    </div>
  `;

  const actionsHtml = unlocked
    ? `
      <button
        class="zg-secret-select-btn"
        data-zg-action="select-secret-top"
        data-secret-id="${escapeAttr(top.id || "")}"
        type="button"
      >
        選擇上場 ✓
      </button>
    `
    : `
      <div class="zg-secret-action-row">
        <button
          class="zg-secret-info-btn"
          data-zg-action="secret-redeem-info"
          data-secret-id="${escapeAttr(top.id || "")}"
          type="button"
        >
          查看兌換方式
        </button>

        <button
          class="zg-secret-redeem-btn"
          data-zg-action="secret-redeem-start"
          data-secret-id="${escapeAttr(top.id || "")}"
          type="button"
        >
          開始兌換
        </button>
      </div>
    `;

  return `
    <article
      class="zg-top-card zg-secret-top-card ${unlocked ? "is-unlocked" : "is-locked"} ${escapeHtml(top.type || "")}"
      data-secret-id="${escapeAttr(top.id || "")}"
      data-type="${escapeAttr(top.type || "")}"
      aria-label="${escapeAttr(top.name || "隱藏陀螺")}"
    >
      ${iconHtml}

      <div class="zg-top-content">
        <div class="zg-top-name">
          ${escapeHtml(top.emoji || "")}
          ${escapeHtml(top.name || "隱藏陀螺")}
        </div>

        <div class="zg-top-type">
          ${escapeHtml(top.typeName || "隱藏型")}
        </div>

        <div class="zg-stats">
          ${statsHtml}
        </div>

        ${
          unlocked
            ? `<div class="zg-secret-unlocked-text">已解鎖，可選擇上場戰鬥！</div>`
            : `<div class="zg-secret-unlock-task">${escapeHtml(
                top.unlockText ||
                  `消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過 LINE 兌換解鎖`
              )}</div>`
        }

        ${actionsHtml}
      </div>
    </article>
  `;
}



function renderSecretTopList() {
  const list = $(".zg-secret-top-list", screenSelect() || document);
  if (!list) return;

  list.innerHTML = SECRET_TOPS.map((top) => renderSecretTopCardHtml(top)).join("");

  const selected = state.selectedTop;

  if (selected) {
    $$(".zg-secret-top-card", list).forEach((card) => {
      const active = card.getAttribute("data-secret-id") === selected.id;
      card.classList.toggle("selected", active);
      card.classList.toggle("active", active);
    });
  }
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

/*
 * 判斷陀螺屬於「普通」還是「隱藏」等級。
 */
function getTopTier(top) {
  if (!top) return "normal";
  return SECRET_TOPS.some((s) => s.id === top.id) ? "secret" : "normal";
}

function pickEnemyTop() {
  const selectedId = state.selectedTop?.id || "";
  const tier = getTopTier(state.selectedTop);

  const pool =
    tier === "secret"
      ? SECRET_TOPS.filter((top) => top.id !== selectedId)
      : TOPS.filter((top) => top.id !== selectedId);

  const safePool = pool.length
    ? pool
    : TOPS.filter((top) => top.id !== selectedId);

  return safePool[Math.floor(Math.random() * safePool.length)] || TOPS[1] || TOPS[0];
}



  function handleChangeTop() {
  /*
   * 防止 boot / 首頁 / 初始化時誤觸發 change-top。
   * 只有在結果頁、結果影片頁、戰鬥頁才允許更換陀螺。
   */
  if (
    state.screen !== "result" &&
    state.screen !== "resultVideo" &&
    state.screen !== "battle"
  ) {
    if (window.ZELO_GAME_DEBUG) {
      console.warn("[ZELO GAME] ignore change_top on screen:", state.screen);
    }

    return;
  }

  /*
   * 關鍵：
   * 先讓結果頁 / 結果影片 / finish 延遲流程失效，
   * 避免切到選擇頁後又被舊 timeout 拉回結果頁。
   */
  invalidateResultFlow("change_top");

  stopBattle();
  cancelChargeLoop();
  stopBattleMusic();

  state.running = false;
  state.paused = false;
  state.battle = null;

  state.charging = false;
  state.launchReady = false;
  state.launchCountdownToken = 0;
  state.launchPower = 0;
  state.chargeDir = 1;

  state.firstCollision = false;
  state.killcamPlayed = false;
  state.lastEffectiveHitAt = 0;
  state.lastMatchupCommentaryAt = 0;
  state.damagePressure = 1;

  removeLaunchCountdownDom();

  /*
   * 清掉結果頁顯示狀態，防止 CSS / DOM 疊在選擇頁上。
   */
  document.body.classList.remove(
    "zg-result-active",
    "zg-battle-running",
    "zg-screen-result"
  );

  track("change_top", {
    source: state.screen || "unknown"
  });

  ensureSelectDom(appRoot());

  state.selectedTop = state.selectedTop || loadSelectedTop();

  renderTopSelection();

  showScreen("select");

  /*
   * 選擇頁排版補強。
   */
  forceSelectScrollable();

  setTimeout(() => {
    if (state.screen !== "select") return;
    forceSelectScrollable();
  }, 80);

  setTimeout(() => {
    if (state.screen !== "select") return;
    forceSelectScrollable();
  }, 250);

  setTimeout(() => {
    if (state.screen !== "select") return;
    forceSelectScrollable();
  }, 600);
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
  updateBattleLiveStats();

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
clearBattleObjects();
ensureBattleLiveStatsDom();
updateHpBars();
updateBattleLiveStats();

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

    if (typeof clearFinishTimers === "function") {
    clearFinishTimers();
  }

  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_BATTLE_FINISH_SEQUENCE_STARTED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;

  state.finishing = false;
  state.pendingResult = null;
   
  state.lastFrame = 0;
  state.firstCollision = false;
  state.killcamPlayed = false;

  state.lastEffectiveHitAt = 0;
  state.stuckBoostAt = 0;
  state.damagePressure = 1;

  state.finishing = false;
  state.finishStartedAt = 0;
  state.pendingResult = null;
   
  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;


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
   
  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;

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

  /*
   * 隱藏陀螺 FX 重置：
   * 清掉上一場殘留的光環、粒子、斬擊、Hit Freeze。
   */
  if (typeof resetBattleFx === "function") {
    resetBattleFx();
  }

  if (typeof cleanupSecretDomFx === "function") {
    cleanupSecretDomFx();
  }
}

  
  


async function beginChargeBattle() {
  if (shouldIgnoreRepeatedAction("battle", 500)) return;

  try {
    Sound.resume();

    await CollisionSfx.preload();
    await CollisionSfx.hit(0.35);

    console.log("[SFX] battle preload ok");
  } catch (e) {
    console.warn("[SFX] battle preload failed", e);
  }


  Sound.resume();

/*
 * 進入戰鬥前喚醒內建碰撞音效。
 */
CollisionSfx.preload();


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
  enterBattlePerformanceMode();
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

  preloadFriendRank("before_battle").catch(() => {});

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
  state.finishing = false;

  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;

  Sound.resume();

  try {
    CollisionSfx.preload();
  } catch (error) {}

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

  if (state.screen !== "battle") {
    showScreen("battle");
  }

  normalizeBattleLayoutDom();
  clearBattleObjects();

  state.lastFrame = 0;
  state.firstCollision = false;
  state.killcamPlayed = false;

  state.lastEffectiveHitAt = 0;
  state.lastMatchupCommentaryAt = 0;
  state.stuckBoostAt = 0;
  state.damagePressure = 1;


  /*
   * 傷害壓力降低。
   * 原本 1 搭配舊 PHY 會太快。
   */
  state.damagePressure = 0.92;

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
  /*
 * 隱藏陀螺 FX 重置：
 * 每次正式開戰前清空上一場或倒數階段殘留特效。
 */
if (typeof resetBattleFx === "function") {
  resetBattleFx();
}

if (typeof cleanupSecretDomFx === "function") {
  cleanupSecretDomFx();
}


  state.selectedTop = state.selectedTop || loadSelectedTop();
  state.enemyTop = state.enemyTop || pickEnemyTop();

  const arena = getArenaInfo();

  const player = createBody(state.selectedTop, "player", arena);
const enemy = createBody(state.enemyTop, "enemy", arena);

if (typeof attachSecretFxIdentity === "function") {
  attachSecretFxIdentity(player, state.selectedTop);
  attachSecretFxIdentity(enemy, state.enemyTop);
}


  /*
 * 開場交戰修正：
 * 讓雙方初始速度帶一點朝向彼此的分量，
 * 避免兩顆陀螺開場各自繞圈很久不碰撞。
 */
applyOpeningEngageVector(player, enemy, arena);


  /*
   * 類型正規化。
   * 後續 resolveCollision / resolveWall / updateBody 會使用。
   */
  player.type = normalizeTopType(player.top?.type);
  enemy.type = normalizeTopType(enemy.top?.type);

  player.typeLabel = getTopTypeLabel(player.type);
  enemy.typeLabel = getTopTypeLabel(enemy.type);

  player.lastMatchupRelation = "neutral";
  enemy.lastMatchupRelation = "neutral";
  player.lastMatchupCommentary = "";
  enemy.lastMatchupCommentary = "";

  /*
   * 發射等級倍率。
   * 完美發射仍然有優勢，但不會直接秒殺。
   */
  let speedMul = 1;
  let spinMul = 1;
  let stabilityMul = 1;
  let angularMul = 1;

  if (launchGrade === "weak") {
    speedMul = 0.82;
    spinMul = 0.78;
    stabilityMul = 0.94;
    angularMul = 0.9;
  } else if (launchGrade === "normal") {
    speedMul = 0.96;
    spinMul = 0.94;
    stabilityMul = 1;
    angularMul = 1;
  } else if (launchGrade === "good") {
    speedMul = 1.06;
    spinMul = 1.05;
    stabilityMul = 1.04;
    angularMul = 1.05;
  } else if (launchGrade === "perfect") {
    speedMul = 1.14;
    spinMul = 1.12;
    stabilityMul = 1.08;
    angularMul = 1.1;
  } else if (launchGrade === "over") {
    /*
     * 過充：
     * 有速度，但穩定下降。
     */
    speedMul = 1.04;
    spinMul = 0.95;
    stabilityMul = 0.9;
    angularMul = 0.96;
  }

  player.vx *= speedMul;
  player.vy *= speedMul;
  player.spin *= spinMul;
  player.spinRatio = clamp((player.spinRatio || 1) * spinMul, 0, 1);
  player.angularSpeed *= angularMul;
  player.mass *= stabilityMul;

  /*
   * 敵方發射力。
   * 不要過低，避免玩家太容易秒殺。
   */
  const enemyPower = rand(0.76, 0.94);

  enemy.vx *= enemyPower;
  enemy.vy *= enemyPower;
  enemy.spin *= 0.92 + enemyPower * 0.1;
  enemy.spinRatio = clamp(
    (enemy.spinRatio || 1) * (0.92 + enemyPower * 0.1),
    0,
    1
  );

  /*
   * 開場能量。
   * 整體提高最低值，避免一兩次碰撞就歸零。
   */
  player.energy = clamp(76 + powerNorm * 24, 62, 100);
  player.maxEnergy = 100;
  player.energyRatio = player.energy / player.maxEnergy;
  player.hp = player.energy;
  player.maxHp = player.maxEnergy;

  enemy.energy = clamp(78 + enemyPower * 20, 64, 100);
  enemy.maxEnergy = 100;
  enemy.energyRatio = enemy.energy / enemy.maxEnergy;
  enemy.hp = enemy.energy;
  enemy.maxHp = enemy.maxEnergy;

  /*
   * 隱藏陀螺同級配對時，雙方血量略提高，
   * 避免高數值隱藏陀螺互撞太快結束。
   */
  const playerTier = getTopTier(player.top);
  const enemyTier = getTopTier(enemy.top);

  if (playerTier === "secret" && enemyTier === "secret") {
    player.energy = clamp(player.energy + 8, 0, 100);
    enemy.energy = clamp(enemy.energy + 8, 0, 100);

    player.energyRatio = player.energy / player.maxEnergy;
    enemy.energyRatio = enemy.energy / enemy.maxEnergy;

    player.hp = player.energy;
    enemy.hp = enemy.energy;
  }

  player.el = createTopElement(player.top, "player");
  enemy.el = createTopElement(enemy.top, "enemy");

  const startAt = now();

  state.battle = {
    arena,
    player,
    enemy,

    startedAt: startAt,

    /*
     * 戰鬥節奏保護。
     * resolveCollision / resolveWall / checkFinish 可讀這些值。
     */
    minBurstFinishAt: startAt + (PHY.minBurstFinishMs || 4200),
    minOutFinishAt: startAt + (PHY.minOutFinishMs || 4600),
    minAnyFinishAt: startAt + (PHY.minAnyFinishMs || 3400),

    ended: false,
    finish: "",
    points: 0,

    launchPower: powerNorm,
    launchRawPower,
    launchDisplayPercent: getLaunchDisplayPercent(launchRawPower),
    launchGrade,

    playerType: player.type,
    enemyType: enemy.type,

    matchupPlayerToEnemy: getTypeMatchup(player.type, enemy.type),
    matchupEnemyToPlayer: getTypeMatchup(enemy.type, player.type)
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
  updateBattleLiveStats();
  updateBattleEnergyPanel();
  playLaunchSequence(powerNorm);

  const playerFeel = getFeel(state.selectedTop);
  const enemyFeel = getFeel(state.enemyTop);

  Sound.startHum(0, playerFeel.humBase || 90);
  Sound.startHum(1, enemyFeel.humBase || 76);

  const openingMatchup = getTypeMatchup(player.type, enemy.type);

  if (openingMatchup.relation === "advantage") {
    setCommentary(`${player.typeLabel}對上${enemy.typeLabel}，你有類型優勢！`);
  } else if (openingMatchup.relation === "disadvantage") {
    setCommentary(`${player.typeLabel}對上${enemy.typeLabel}，小心被壓制！`);
  } else {
    setCommentary("戰鬥開始！雙方進入交鋒！");
  }

  track("battle_start", {
    topId: state.selectedTop?.id || "",
    topName: state.selectedTop?.name || "",
    topType: state.selectedTop?.type || "",
    enemyId: state.enemyTop?.id || "",
    enemyName: state.enemyTop?.name || "",
    enemyType: state.enemyTop?.type || "",
    launchPower: Number(powerNorm.toFixed(3)),
    launchRawPower: Number(launchRawPower.toFixed(3)),
    launchDisplayPercent: getLaunchDisplayPercent(launchRawPower),
    launchGrade,
    speedMul,
    spinMul,
    stabilityMul,
    playerType: player.type,
    enemyType: enemy.type,
    matchup: openingMatchup.relation
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

if (typeof resetBattleFx === "function") {
  resetBattleFx();
}

if (typeof cleanupSecretDomFx === "function") {
  cleanupSecretDomFx();
}
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
/*
 * ---------------------------------------------------------
 * 08-1A. Battle Core Helpers / 戰鬥核心工具
 * ---------------------------------------------------------
 */

function forceBattleEngagement(player, enemy, arena, dt) {
  if (!player || !enemy || !arena) return;
  if (player.dead || enemy.dead) return;

  const battle = state.battle;
  if (!battle || battle.ended || state.finishing) return;

  const t = now();
  const elapsed = battle.startedAt ? t - battle.startedAt : 999999;

  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (!Number.isFinite(dist) || dist <= 0) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const minDist = player.r + enemy.r;

  /*
   * 最近一次有效撞擊距離現在多久。
   */
  const lastHitAt =
    Math.max(
      player.lastHitAt || 0,
      enemy.lastHitAt || 0,
      state.lastEffectiveHitAt || 0
    );

  const noHitMs = t - lastHitAt;

  /*
   * 場地大小參考。
   */
  const arenaScale = Math.min(arena.w, arena.h);

  /*
   * 如果雙方距離超過這個，就開始增加交戰牽引。
   */
  const farDistance = Math.max(minDist * 2.4, arenaScale * 0.34);

  /*
   * 如果距離極遠，牽引更強。
   */
  const veryFarDistance = Math.max(minDist * 3.4, arenaScale * 0.46);

  /*
   * 開場前 0.8 秒不要強制牽引，
   * 讓發射演出自然展開。
   */
  if (elapsed < 800) return;

  /*
   * 基礎牽引：
   * - 沒撞越久，牽引越明顯
   * - 距離越遠，牽引越明顯
   */
  let engageForce = 0;

  if (dist > farDistance || noHitMs > 1300) {
    engageForce = 0.018;
  }

  if (dist > veryFarDistance || noHitMs > 2300) {
    engageForce = 0.032;
  }

  if (noHitMs > 3600) {
    engageForce = 0.046;
  }

  if (engageForce <= 0) return;

  /*
   * dt 保護。
   */
  const safeDt = clamp(Number(dt) || 1, 0.5, 2.2);

  /*
   * 類型微調：
   * 攻擊 / 速度比較願意主動接戰。
   * 防禦 / 持久較保守。
   */
  const playerType = normalizeTopType(player.type || player.top?.type);
  const enemyType = normalizeTopType(enemy.type || enemy.top?.type);

  const getAggroMul = (type) => {
    if (type === "attack") return 1.14;
    if (type === "speed") return 1.18;
    if (type === "balance") return 1;
    if (type === "defense") return 0.9;
    if (type === "stamina") return 0.86;
    return 1;
  };

  const pAggro = getAggroMul(playerType);
  const eAggro = getAggroMul(enemyType);

  /*
   * 雙方往彼此靠近。
   * 注意不是 teleport，只是加速度。
   */
  player.vx += nx * engageForce * pAggro * safeDt;
  player.vy += ny * engageForce * pAggro * safeDt;

  enemy.vx -= nx * engageForce * eAggro * safeDt;
  enemy.vy -= ny * engageForce * eAggro * safeDt;

  /*
   * 如果太久沒撞，額外給一點切線速度，
   * 避免兩顆只直線靠近後擦肩而過。
   */
  if (noHitMs > 1800) {
    const tx = -ny;
    const ty = nx;

    const orbitJitter =
      Math.sin((t + elapsed) * 0.004) > 0
        ? 1
        : -1;

    const tangentBoost = engageForce * 0.72 * orbitJitter;

    player.vx += tx * tangentBoost * safeDt;
    player.vy += ty * tangentBoost * safeDt;

    enemy.vx -= tx * tangentBoost * safeDt;
    enemy.vy -= ty * tangentBoost * safeDt;
  }

  /*
   * 如果真的超過 5 秒完全沒有效碰撞，
   * 稍微把雙方往中心收斂，避免外圈空轉。
   */
  if (noHitMs > 5000) {
    const pullToCenter = (body) => {
      const cdx = arena.cx - body.x;
      const cdy = arena.cy - body.y;
      const cd = Math.hypot(cdx, cdy);

      if (cd <= 0) return;

      body.vx += (cdx / cd) * 0.018 * safeDt;
      body.vy += (cdy / cd) * 0.018 * safeDt;
    };

    pullToCenter(player);
    pullToCenter(enemy);

    if (t - (battle.lastEngageCommentaryAt || 0) > 2600) {
      battle.lastEngageCommentaryAt = t;
      setCommentary("雙方重新拉近距離，準備正面交鋒！");
    }
  }
}

  

function clearBattleObjects() {
  const box = battleBox();
  if (!box) return;

  $$(".zg-battle-top", box).forEach((el) => {
    try {
      el.remove();
    } catch (error) {}
  });

  $$(
    ".zg-spark, .zg-impact-ring, .zg-metal-spark, .zg-scratch, .zg-launch-shockwave, .zg-spin-afterimage, .zg-impact-streak, .zg-burst-piece, .zg-wall-flash, .zg-motion-trail, .zg-motion-trail-orb, .zg-xtreme-dash-trail, .zg-xtreme-dash-bolt, .zg-xtreme-dash-orb, .zg-xtreme-dash-shock, .zg-xtreme-dash-flare, .zg-stardust",
    box
  ).forEach((el) => {
    try {
      el.remove();
    } catch (error) {}
  });

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

if (typeof cleanupSecretDomFx === "function") {
  cleanupSecretDomFx();
}

if (typeof resetBattleFx === "function") {
  resetBattleFx();
}
}



function setCommentary(text) {
  const el = $(".zg-commentary", screenBattle() || document);

  if (el) {
    el.textContent = text;
  }
}


function ensureBattleLiveStatsDom() {
  const battle = screenBattle();

  if (!battle) return null;

  const hpStage =
    $(".zg-hp-stage", battle) ||
    $(".zg-battle-main", battle) ||
    battle;

  if (!hpStage) return null;

  let stats = $(".zg-battle-live-stats", battle);

  const needsRebuild =
    !stats ||
    !$(".zg-live-side-player", stats) ||
    !$(".zg-live-side-enemy", stats);

  if (needsRebuild) {
    if (stats) {
      try {
        stats.remove();
      } catch (error) {}
    }

    stats = document.createElement("div");
    stats.className = "zg-battle-live-stats";
    stats.setAttribute("aria-label", "即時戰鬥狀態");

    stats.innerHTML = `
      <div class="zg-live-side zg-live-side-player">
        <div class="zg-live-stat-card zg-live-stat-player">
          <span>你方能量</span>
          <strong id="zg-live-player-energy">100%</strong>
        </div>

        <div class="zg-live-stat-card zg-live-stat-player">
          <span>你方轉速</span>
          <strong id="zg-live-player-spin">100%</strong>
        </div>
      </div>

      <div class="zg-live-side zg-live-side-enemy">
        <div class="zg-live-stat-card zg-live-stat-enemy">
          <span>敵方能量</span>
          <strong id="zg-live-enemy-energy">100%</strong>
        </div>

        <div class="zg-live-stat-card zg-live-stat-enemy">
          <span>敵方轉速</span>
          <strong id="zg-live-enemy-spin">100%</strong>
        </div>
      </div>
    `;

    hpStage.appendChild(stats);
  } else if (stats.parentElement !== hpStage) {
    hpStage.appendChild(stats);
  }

  stats.style.setProperty("display", "grid", "important");
  stats.style.setProperty("visibility", "visible", "important");
  stats.style.setProperty("opacity", "1", "important");
  stats.style.setProperty("pointer-events", "none", "important");
  stats.style.setProperty("position", "relative", "important");
  stats.style.setProperty("z-index", "60", "important");

  return stats;
}


let __zgLiveStatsCache = {
  battleRef: null,
  pEnergy: null,
  eEnergy: null,
  pSpin: null,
  eSpin: null
};

function updateBattleLiveStats() {
  ensureBattleLiveStatsDom();

  const b = state.battle;

  const pEnergyEl = document.getElementById("zg-live-player-energy");
  const eEnergyEl = document.getElementById("zg-live-enemy-energy");
  const pSpinEl = document.getElementById("zg-live-player-spin");
  const eSpinEl = document.getElementById("zg-live-enemy-spin");

  if (!pEnergyEl && !eEnergyEl && !pSpinEl && !eSpinEl) return;

  if (!b || !b.player || !b.enemy) {
    /*
     * battle 不存在（例如重置畫面），只在跟快取不同時才重寫。
     */
    if (__zgLiveStatsCache.battleRef !== null) {
      __zgLiveStatsCache = {
        battleRef: null,
        pEnergy: 100,
        eEnergy: 100,
        pSpin: 100,
        eSpin: 100
      };

      const resetValue = (el) => {
        if (!el) return;

        el.textContent = "100%";
        el.dataset.value = "100";
        el.classList.remove("is-low", "is-critical");
      };

      resetValue(pEnergyEl);
      resetValue(eEnergyEl);
      resetValue(pSpinEl);
      resetValue(eSpinEl);
    }

    return;
  }

  const pEnergyRatio = clamp(
    Number.isFinite(b.player.energyRatio)
      ? b.player.energyRatio
      : (Number(b.player.energy) || 0) / (Number(b.player.maxEnergy) || 100),
    0,
    1
  );

  const eEnergyRatio = clamp(
    Number.isFinite(b.enemy.energyRatio)
      ? b.enemy.energyRatio
      : (Number(b.enemy.energy) || 0) / (Number(b.enemy.maxEnergy) || 100),
    0,
    1
  );

  const pSpinRatio = clamp(
    Number.isFinite(b.player.spinRatio)
      ? b.player.spinRatio
      : (Number(b.player.spin) || 0) / (Number(b.player.maxSpin) || 1),
    0,
    1
  );

  const eSpinRatio = clamp(
    Number.isFinite(b.enemy.spinRatio)
      ? b.enemy.spinRatio
      : (Number(b.enemy.spin) || 0) / (Number(b.enemy.maxSpin) || 1),
    0,
    1
  );

  const pEnergyPct = Math.round(pEnergyRatio * 100);
  const eEnergyPct = Math.round(eEnergyRatio * 100);
  const pSpinPct = Math.round(pSpinRatio * 100);
  const eSpinPct = Math.round(eSpinRatio * 100);

  /*
   * 優化：四個數值都沒變化就整段跳過。
   */
  if (
    __zgLiveStatsCache.battleRef === b &&
    __zgLiveStatsCache.pEnergy === pEnergyPct &&
    __zgLiveStatsCache.eEnergy === eEnergyPct &&
    __zgLiveStatsCache.pSpin === pSpinPct &&
    __zgLiveStatsCache.eSpin === eSpinPct
  ) {
    return;
  }

  __zgLiveStatsCache = {
    battleRef: b,
    pEnergy: pEnergyPct,
    eEnergy: eEnergyPct,
    pSpin: pSpinPct,
    eSpin: eSpinPct
  };

  const applyValue = (el, value) => {
    if (!el) return;

    const safeValue = clamp(Number(value) || 0, 0, 100);
    const card = el.closest(".zg-live-stat-card");

    el.textContent = `${safeValue}%`;
    el.dataset.value = String(safeValue);

    el.classList.toggle("is-low", safeValue <= 35 && safeValue > 15);
    el.classList.toggle("is-critical", safeValue <= 15);

    if (card) {
      card.dataset.value = String(safeValue);
      card.classList.toggle("is-low", safeValue <= 35 && safeValue > 15);
      card.classList.toggle("is-critical", safeValue <= 15);
    }
  };

  applyValue(pEnergyEl, pEnergyPct);
  applyValue(eEnergyEl, eEnergyPct);
  applyValue(pSpinEl, pSpinPct);
  applyValue(eSpinEl, eSpinPct);

  const playerLiveSide = $(".zg-live-side-player", screenBattle() || document);
  const enemyLiveSide = $(".zg-live-side-enemy", screenBattle() || document);

  if (playerLiveSide && enemyLiveSide) {
    playerLiveSide.classList.remove("is-losing-energy", "is-winning-energy");
    enemyLiveSide.classList.remove("is-losing-energy", "is-winning-energy");

    const diff = Math.abs(pEnergyPct - eEnergyPct);

    if (state.running && diff >= 4) {
      if (pEnergyPct < eEnergyPct) {
        playerLiveSide.classList.add("is-losing-energy");
        enemyLiveSide.classList.add("is-winning-energy");
      } else if (eEnergyPct < pEnergyPct) {
        enemyLiveSide.classList.add("is-losing-energy");
        playerLiveSide.classList.add("is-winning-energy");
      }
    }
  }
}



let __zgHpBarCache = {
  battleRef: null,
  playerPct: null,
  enemyPct: null
};

function updateHpBars() {
  const b = state.battle;

  const playerFill = document.getElementById("zg-player-hp");
  const enemyFill = document.getElementById("zg-enemy-hp");
  const playerText = document.getElementById("zg-player-hp-text");
  const enemyText = document.getElementById("zg-enemy-hp-text");

  const playerRow = playerFill ? playerFill.closest(".zg-hp-row") : null;
  const enemyRow = enemyFill ? enemyFill.closest(".zg-hp-row") : null;

  const getRatio = (body) => {
    if (!body) return 1;

    if (Number.isFinite(body.energyRatio)) {
      return clamp(body.energyRatio, 0, 1);
    }

    const energy = Number.isFinite(body.energy)
      ? body.energy
      : Number.isFinite(body.hp)
        ? body.hp
        : 100;

    const maxEnergy = Number.isFinite(body.maxEnergy)
      ? body.maxEnergy
      : Number.isFinite(body.maxHp)
        ? body.maxHp
        : 100;

    return clamp(energy / Math.max(1, maxEnergy), 0, 1);
  };

  const playerRatio = b && b.player ? getRatio(b.player) : 1;
  const enemyRatio = b && b.enemy ? getRatio(b.enemy) : 1;

  const playerPct = Math.round(playerRatio * 100);
  const enemyPct = Math.round(enemyRatio * 100);

  /*
   * 優化：
   * 如果 battle 物件沒換（同一場戰鬥），
   * 且雙方百分比都跟上一次完全相同，
   * 代表畫面已經是正確狀態，直接跳過所有 DOM 寫入。
   */
  if (
    __zgHpBarCache.battleRef === b &&
    __zgHpBarCache.playerPct === playerPct &&
    __zgHpBarCache.enemyPct === enemyPct
  ) {
    return;
  }

  __zgHpBarCache.battleRef = b;
  __zgHpBarCache.playerPct = playerPct;
  __zgHpBarCache.enemyPct = enemyPct;

  const applyBar = (fill, text, row, pct, ratio, side) => {
    if (fill) {
      fill.style.setProperty("width", `${pct}%`, "important");
      fill.style.setProperty("--zg-hp-pct", `${pct}%`, "important");
      fill.dataset.value = String(pct);
      fill.dataset.side = side;

      fill.classList.toggle("is-low", pct <= 35 && pct > 15);
      fill.classList.toggle("is-critical", pct <= 15);
    }

    if (text) {
      text.textContent = `${pct}%`;
      text.dataset.value = String(pct);
      text.dataset.side = side;

      text.classList.toggle("is-low", pct <= 35 && pct > 15);
      text.classList.toggle("is-critical", pct <= 15);
    }

    const bar = fill ? fill.closest(".zg-hp-bar") : null;

    if (bar) {
      bar.setAttribute("aria-valuenow", String(pct));
      bar.dataset.value = String(pct);
      bar.dataset.side = side;
      bar.style.setProperty("--zg-hp-ratio", String(ratio), "important");

      bar.classList.toggle("is-low", pct <= 35 && pct > 15);
      bar.classList.toggle("is-critical", pct <= 15);
    }

    if (row) {
      row.dataset.value = String(pct);
      row.dataset.side = side;
      row.style.setProperty("--zg-hp-ratio", String(ratio), "important");
      row.style.setProperty("--zg-hp-pct", `${pct}%`, "important");

      row.classList.toggle("is-low", pct <= 35 && pct > 15);
      row.classList.toggle("is-critical", pct <= 15);
    }
  };

  applyBar(playerFill, playerText, playerRow, playerPct, playerRatio, "player");
  applyBar(enemyFill, enemyText, enemyRow, enemyPct, enemyRatio, "enemy");

  if (playerRow && enemyRow) {
    playerRow.classList.remove("is-losing-energy", "is-winning-energy");
    enemyRow.classList.remove("is-losing-energy", "is-winning-energy");

    const diff = Math.abs(playerPct - enemyPct);

    if (state.running && b && diff >= 4) {
      if (playerPct < enemyPct) {
        playerRow.classList.add("is-losing-energy");
        enemyRow.classList.add("is-winning-energy");
      } else if (enemyPct < playerPct) {
        enemyRow.classList.add("is-losing-energy");
        playerRow.classList.add("is-winning-energy");
      }
    }
  }

  if (typeof updateBattleLiveStats === "function") {
    updateBattleLiveStats();
  }
}



function consumeBodyEnergy(body, amount) {
  if (!body) return;

  const b = state.battle;
  const maxEnergy = body.maxEnergy || 100;

  const currentEnergy = Number.isFinite(body.energy)
    ? body.energy
    : maxEnergy;

  /*
   * 全域戰鬥節奏倍率。
   * PHY.battlePaceMul 越小，戰鬥越久。
   */
  const paceMul = Number.isFinite(PHY.battlePaceMul)
    ? PHY.battlePaceMul
    : 1;

  const rawCost = Math.max(0, Number(amount) || 0);
  const cost = rawCost * paceMul;

  if (cost <= 0) return;

  const elapsed = b && b.startedAt
    ? now() - b.startedAt
    : 999999;

  /*
   * 開場保護：
   * 戰鬥前 3.2 秒內，碰撞傷害最多扣到 8%。
   * 避免完美發射 + 相剋 + 首撞直接秒殺。
   */
  const earlyBattle = elapsed < 1800;
  const earlyMaxCost = maxEnergy * 0.08;

  const finalCost = earlyBattle
    ? Math.min(cost, earlyMaxCost)
    : cost;

  body.energy = clamp(currentEnergy - finalCost, 0, maxEnergy);
  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);

  body.hp = body.energy;
  body.maxHp = maxEnergy;

  /*
   * 不在開場保護期內才允許歸零死亡。
   */
  if (
    !earlyBattle &&
    (body.energy <= 0 || body.energyRatio <= 0)
  ) {
    body.energy = 0;
    body.energyRatio = 0;
    body.hp = 0;
    body.dead = true;
  }
}



function restoreBodyEnergy(body, amount) {
  if (!body || body.dead) return;

  const maxEnergy = body.maxEnergy || 100;
  const gain = Math.max(0, Number(amount) || 0);

  body.energy = clamp(
    (Number.isFinite(body.energy) ? body.energy : maxEnergy) + gain,
    0,
    maxEnergy
  );

  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);
  body.hp = body.energy;
  body.maxHp = maxEnergy;
}


function drainBodyNaturalEnergy(body, amount) {
  if (!body || body.dead) return;

  const b = state.battle;
  const maxEnergy = body.maxEnergy || 100;

  const currentEnergy = Number.isFinite(body.energy)
    ? body.energy
    : maxEnergy;

  /*
   * 自然損耗套用較低倍率。
   * 這樣 Spin Finish 會更像慢慢撐到最後，
   * 而不是突然自己死掉。
   */
  const paceMul = Number.isFinite(PHY.battlePaceMul)
    ? PHY.battlePaceMul
    : 1;

  const cost = Math.max(0, Number(amount) || 0) * paceMul * 0.62;

  if (cost <= 0) return;

  const elapsed = b && b.startedAt
    ? now() - b.startedAt
    : 999999;

  const canNaturalKill =
    PHY.naturalEnergyCanKill === true &&
    elapsed >= (PHY.naturalKillGraceMs || 0);

  /*
   * 建議：
   * naturalEnergyCanKill = false 時，自然耗能最多扣到 1。
   * 最後由碰撞 / 判定 / 時間 / 轉速差決定勝負。
   */
  const minEnergy = canNaturalKill ? 0 : 1;

  body.energy = clamp(currentEnergy - cost, minEnergy, maxEnergy);
  body.energyRatio = clamp(body.energy / maxEnergy, 0, 1);

  body.hp = body.energy;
  body.maxHp = maxEnergy;

  if (
    canNaturalKill &&
    (body.energy <= 0 || body.energyRatio <= 0)
  ) {
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

  el.setAttribute("data-fx-id", top.fxId || top.id || "");
el.setAttribute("data-secret", SECRET_TOPS.some((s) => s.id === top.id) ? "1" : "0");

if (SECRET_TOPS.some((s) => s.id === top.id)) {
  el.classList.add("zg-secret-battle-top");
  el.classList.add(`zg-secret-battle-top-${top.id}`);
}


  el.style.setProperty("--c1", top.colorA);
  el.style.setProperty("--c2", top.colorB);

  el.style.setProperty("position", "absolute", "important");
  el.style.setProperty("width", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("height", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("min-width", `${PHY.radius * 2}px`, "important");
  el.style.setProperty("min-height", `${PHY.radius * 2}px`, "important");

  el.style.setProperty("display", "flex", "important");
  el.style.setProperty("align-items", "center", "important");
  el.style.setProperty("justify-content", "center", "important");

  el.style.setProperty("left", "0", "important");
  el.style.setProperty("top", "0", "important");
  el.style.setProperty("z-index", side === "player" ? "47" : "46", "important");
  el.style.setProperty("pointer-events", "none", "important");
  el.style.setProperty("visibility", "visible", "important");
  el.style.setProperty("opacity", "1", "important");
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

  const visualSpin = body.dead ? 0 : Math.max(body.spinRatio || 0, 0.16);

  body.angle += body.angularSpeed * visualSpin;

  /*
   * 關鍵優化：
   * 不再使用 left/top（會觸發 reflow）。
   * 改為純 transform translate + rotate，只觸發 GPU 合成層。
   * el 需要維持 left:50%; top:50% 的初始定位（在 createTopElement 已設定），
   * 這裡只用 translate 做位移，效能大幅提升。
   */
  body.el.style.setProperty(
    "transform",
    `translate3d(calc(${body.x}px - 50%), calc(${body.y}px - 50%), 0) rotate(${body.angle}deg)`,
    "important"
  );

  body.el.style.setProperty("opacity", body.dead ? "0.35" : "1", "important");
body.el.style.setProperty("display", "flex", "important");
body.el.style.setProperty("visibility", "visible", "important");

/*
 * 隱藏陀螺 DOM 光環 / 殘影同步
 */
if (typeof syncSecretTopDomFx === "function") {
  syncSecretTopDomFx(body);
}
}



/*
 * ---------------------------------------------------------
 * ARENA INFO CACHE / 戰鬥場地資訊快取（優化版）
 * ---------------------------------------------------------
 * 說明：
 * getArenaInfo() 原本每個 requestAnimationFrame 都會呼叫
 * box.getBoundingClientRect()，此 API 會強制瀏覽器立即執行
 * 同步 layout（reflow），在 60fps 戰鬥迴圈中屬於高成本重複運算。
 *
 * 由於戰鬥場地尺寸在單場戰鬥中幾乎不會變動
 * （只有 resize / 轉向 / 視窗尺寸改變時才會變），
 * 這裡改為「短時間快取 + resize 立即失效」：
 * - 100ms 內重複呼叫直接回傳快取，不重新量測 DOM。
 * - window resize / orientationchange / visualViewport resize
 *   時立即清除快取，確保尺寸異動能即時反應。
 * - 若戰鬥 DOM 被重建（box 參考改變），快取自動失效。
 *
 * 回傳的數值結構、欄位、行為與原版完全相同，
 * 不影響任何戰鬥判定、碰撞、UI 顯示，
 * 純粹減少重複強制 reflow 的次數。
 */

let __zgArenaInfoCache = null;
let __zgArenaInfoCacheAt = 0;
let __zgArenaInfoCacheBox = null;
const __ZG_ARENA_INFO_CACHE_TTL = 100;

function invalidateArenaInfoCache() {
  __zgArenaInfoCache = null;
  __zgArenaInfoCacheAt = 0;
  __zgArenaInfoCacheBox = null;
}

if (!window.__zgArenaInfoResizeBound) {
  window.__zgArenaInfoResizeBound = true;

  window.addEventListener("resize", invalidateArenaInfoCache, {
    passive: true
  });

  window.addEventListener("orientationchange", invalidateArenaInfoCache, {
    passive: true
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      invalidateArenaInfoCache,
      {
        passive: true
      }
    );
  }
}

function getArenaInfo() {
  const box = battleBox();

  if (!box) {
    invalidateArenaInfoCache();

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
      xtremeR: 58,
      ringRadius: 160
    };
  }

  const t = now();

  if (
    __zgArenaInfoCache &&
    __zgArenaInfoCacheBox === box &&
    t - __zgArenaInfoCacheAt < __ZG_ARENA_INFO_CACHE_TTL
  ) {
    return __zgArenaInfoCache;
  }

  const rect = box.getBoundingClientRect();

  const w = Math.max(260, rect.width || box.clientWidth || 420);
  const h = Math.max(260, rect.height || box.clientHeight || 420);

  const cx = w / 2;
  const cy = h / 2;

  const pad = PHY.ringPadding || PHY.radius + 12;

  const info = {
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

  __zgArenaInfoCache = info;
  __zgArenaInfoCacheAt = t;
  __zgArenaInfoCacheBox = box;

  return info;
}


function applyOpeningEngageVector(player, enemy, arena) {
  if (!player || !enemy || !arena) return;

  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (!Number.isFinite(dist) || dist <= 0) return;

  const nx = dx / dist;
  const ny = dy / dist;

  /*
   * 開場往彼此靠近的速度比例。
   * 不要太高，避免一開始直接爆撞秒殺。
   */
  const engageKick = 0.78;

  const playerSpeed = Math.hypot(player.vx, player.vy);
  const enemySpeed = Math.hypot(enemy.vx, enemy.vy);

  /*
   * 保留原本速度，同時混入一點朝向對手的分量。
   */
  player.vx = player.vx * 0.72 + nx * playerSpeed * engageKick * 0.28;
  player.vy = player.vy * 0.72 + ny * playerSpeed * engageKick * 0.28;

  enemy.vx = enemy.vx * 0.72 - nx * enemySpeed * engageKick * 0.28;
  enemy.vy = enemy.vy * 0.72 - ny * enemySpeed * engageKick * 0.28;

  /*
   * 開場不要超過最大速度。
   */
  const clampBodySpeed = (body) => {
    const speed = Math.hypot(body.vx, body.vy);

    if (speed > PHY.maxSpeed) {
      const ratio = PHY.maxSpeed / speed;
      body.vx *= ratio;
      body.vy *= ratio;
    }
  };

  clampBodySpeed(player);
  clampBodySpeed(enemy);
}

  


function createBody(top, side, arena) {
  const isPlayer = side === "player";
  const safeTop = top || TOPS[0];
  const topType = normalizeTopType(safeTop.type);
  const feel = getFeel(safeTop);

  /*
   * =========================================================
   * Top Type Battle Traits / 陀螺類型戰鬥特性
   * =========================================================
   *
   * 攻擊型 attack：
   * - 底部較平坦，移動快。
   * - 邊緣多銳角。
   * - 主打瞬間撞擊。
   * - 剋制持久型，但會被防禦型化解。
   *
   * 防禦型 defense：
   * - 重量較重。
   * - 造型圓滑，抗撞擊。
   * - 不容易被擊飛或爆裂。
   * - 剋制攻擊型，但容易被持久型拖垮。
   *
   * 持久型 stamina：
   * - 軸心尖銳，摩擦力低。
   * - 轉速維持最久。
   * - 適合拖到 Spin Finish。
   * - 剋制防禦型，但怕攻擊型開場高速撞擊。
   *
   * 平衡型 balance：
   * - 攻擊、防禦、持久、速度平均。
   * - 沒有明顯相剋優勢，也沒有明顯弱點。
   *
   * 速度型 speed：
   * - 隱藏型用。
   * - 視為偏攻擊型分支，但不讓傷害過度爆炸。
   */
  const typeTrait = {
    attack: {
  flatTip: 1.2,
  sharpEdge: 1.2,
  weight: 0.96,
  burstResist: 0.94,
  overResist: 0.94,
  spinKeep: 0.9,
  frictionMul: 1.08,
  mobilityMul: 1.32,
  impactMul: 1.24
},


    defense: {
  flatTip: 0.82,
  sharpEdge: 0.82,
  weight: 1.3,
  burstResist: 1.3,
  overResist: 1.34,
  spinKeep: 1.06,
  frictionMul: 0.82,
  mobilityMul: 0.68,
  impactMul: 0.82
},


    stamina: {
      flatTip: 0.9,
      sharpEdge: 0.9,
      weight: 0.96,
      burstResist: 1.04,
      overResist: 1.08,
      spinKeep: 1.26,
      frictionMul: 0.78,
      mobilityMul: 0.9,
      impactMul: 0.9
    },

    balance: {
      flatTip: 1,
      sharpEdge: 1,
      weight: 1,
      burstResist: 1,
      overResist: 1,
      spinKeep: 1,
      frictionMul: 1,
      mobilityMul: 1,
      impactMul: 1
    },

    speed: {
      flatTip: 1.14,
      sharpEdge: 1.04,
      weight: 0.94,
      burstResist: 0.98,
      overResist: 0.96,
      spinKeep: 0.98,
      frictionMul: 1.02,
      mobilityMul: 1.22,
      impactMul: 1.04
    }
  };

  const trait = typeTrait[topType] || typeTrait.balance;

  const launchAngle = isPlayer
    ? rand(-0.32, 0.32)
    : Math.PI + rand(-0.32, 0.32);

  const orbitAngle = isPlayer ? Math.PI * 0.12 : Math.PI * 1.12;

  /*
   * 降低初始速度，避免開場瞬間衝牆 Over / Xtreme。
   */
  const speedBase =
    PHY.launchSpeed *
    (0.78 + safeTop.speed / 260) *
    trait.flatTip *
    trait.mobilityMul *
    rand(0.9, 1.04);

  const vx = Math.cos(launchAngle) * speedBase;
  const vy = Math.sin(launchAngle) * speedBase;

  const x = arena.cx + Math.cos(orbitAngle) * arena.w * 0.26;
  const y = arena.cy + Math.sin(orbitAngle) * arena.h * 0.2;

  /*
   * maxHp 保留給內部參考。
   * 真正顯示能量由 startBattleWithPower() 設定 energy / maxEnergy。
   */
  const maxHp =
    (
      92 +
      safeTop.defense * 0.42 +
      safeTop.stamina * 0.34 +
      feel.defense * 5
    ) *
    trait.burstResist;

  const spin =
    (
      980 +
      safeTop.stamina * 7.4 +
      safeTop.speed * 2.8 +
      rand(-24, 42)
    ) *
    trait.spinKeep;

  return {
  id: safeTop.id,
  fxId: safeTop.fxId || safeTop.id,
  topId: safeTop.id,
  baseId: safeTop.id,
  name: safeTop.name,

  top: safeTop,
  side,
  el: null,


    /*
     * 類型資訊。
     */
    type: topType,
    typeLabel: getTopTypeLabel(topType),

    x,
    y,
    vx,
    vy,

    r: PHY.radius,

    /*
     * mass 越高，越不容易被 Over / Xtreme 擊飛。
     */
    mass:
      (
        1 +
        safeTop.defense / 190 +
        feel.defense * 0.06
      ) *
      trait.weight,

    hp: maxHp,
    maxHp,

    energy: 100,
    maxEnergy: 100,
    energyRatio: 1,

    spin,
    maxSpin: spin,
    spinRatio: 1,

    angle: rand(0, 360),
    angularSpeed:
      (side === "player" ? 1 : -1) *
      (16 + safeTop.speed / 8 + rand(-1.6, 1.6)),

    /*
     * 攻擊、防禦、持久、機動力。
     * 已降低極端倍率，避免相剋後秒殺。
     */
    attack:
      (
        safeTop.power * 0.76 +
        safeTop.speed * 0.18 +
        feel.attack * 4.2
      ) *
      trait.sharpEdge *
      trait.impactMul,

    defense:
      (
        safeTop.defense * 0.8 +
        safeTop.stamina * 0.16 +
        feel.defense * 6.2
      ) *
      trait.burstResist,

    stamina:
      (
        safeTop.stamina * 0.86 +
        safeTop.defense * 0.1 +
        feel.stamina * 5.8
      ) *
      trait.spinKeep,

    mobility:
      (
        safeTop.speed * 0.82 +
        feel.mobility * 7.2
      ) *
      trait.mobilityMul,

    /*
     * 類型特性給其他函式使用。
     */
    trait,

    /*
     * 相剋狀態紀錄。
     */
    lastMatchupRelation: "neutral",
    lastMatchupCommentary: "",

    /*
     * Finish 判定相關狀態。
     */
    out: false,
    outKind: "",
    burst: false,

    lastImpactPower: 0,
    lastImpactFrom: "",
    lastImpactAt: 0,

    wobble: 0,
    dead: false,

    lastWallHitAt: 0,
    lastHitAt: 0,
    lastSpecialFxAt: 0,

    combo: 0,
    trailPhase: rand(0, Math.PI * 2),
    centerPullBoost: 0
  };
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

  const battle = state.battle;
  const t = now();
  const elapsed = battle && battle.startedAt
    ? t - battle.startedAt
    : 999999;

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

  /*
   * =========================================================
   * Over / Xtreme Finish 出場判定
   * =========================================================
   *
   * Over Finish：
   * - 對手被撞出普通戰鬥盤外。
   *
   * Xtreme Finish：
   * - 對手高速撞入角落極限加速區後彈射出場。
   *
   * 修正重點：
   * - 開場前幾秒不允許出場。
   * - 能量要低到一定程度才可能出場。
   * - Xtreme 門檻比 Over 更嚴格。
   * - 相剋只微調，不再直接秒出場。
   */
  const speedForOut = Math.hypot(body.vx, body.vy);
  const energyRatioForOut = clamp(body.energyRatio ?? 1, 0, 1);
  const overResist = body.trait?.overResist || 1;

  let matchupOutPressureMul = 1;

  if (battle) {
    const attacker =
      body.lastImpactFrom === "player"
        ? battle.player
        : body.lastImpactFrom === "enemy"
          ? battle.enemy
          : null;

    if (attacker && attacker !== body) {
      const attackerToBody = getTypeMatchup(
        attacker.type || attacker.top?.type,
        body.type || body.top?.type
      );

      if (attackerToBody.relation === "advantage") {
        matchupOutPressureMul = 1.08;
      } else if (attackerToBody.relation === "disadvantage") {
        matchupOutPressureMul = 0.9;
      }
    }
  }

  const isCornerZone =
    (
      body.x <= arena.left + PHY.radius * 0.48 ||
      body.x >= arena.right - PHY.radius * 0.48
    ) &&
    (
      body.y <= arena.top + PHY.radius * 0.48 ||
      body.y >= arena.bottom - PHY.radius * 0.48
    );

  const recentImpact =
    t - (body.lastImpactAt || 0) < 520;

  const minOutFinishMs = PHY.minOutFinishMs || 5200;
  const canOutFinish = elapsed >= minOutFinishMs;

  const outPressure =
    (
      speedForOut * 0.62 +
      (body.lastImpactPower || 0) * 1.05 +
      (1 - energyRatioForOut) * 5.2
    ) *
    matchupOutPressureMul /
    Math.max(0.75, overResist);

  const overEnergyLimit = PHY.overMinEnergyRatio ?? 0.34;
  const xtremeEnergyLimit = PHY.xtremeMinEnergyRatio ?? 0.22;

  const overThreshold = PHY.overPressureThreshold || 13.8;
  const xtremeThreshold = PHY.xtremePressureThreshold || 17.2;

  const canOver =
    canOutFinish &&
    recentImpact &&
    !body.out &&
    energyRatioForOut <= overEnergyLimit &&
    outPressure >= overThreshold;

  const canXtreme =
    canOver &&
    isCornerZone &&
    energyRatioForOut <= xtremeEnergyLimit &&
    speedForOut >= 8.2 &&
    outPressure >= xtremeThreshold;

  if (canOver) {
    body.out = true;
    body.dead = true;
    body.energy = 0;
    body.energyRatio = 0;
    body.hp = 0;

    body.outKind = canXtreme ? "xtreme" : "over";

    try {
      createImpactRing(body.x, body.y, body.outKind === "xtreme" ? 2.2 : 1.55);
      createImpactStreak(body.x, body.y, body.outKind === "xtreme" ? 1.8 : 1.25);
      createMetalSparks(body.x, body.y, body.outKind === "xtreme" ? 1.8 : 1.25);
      createBurstPieces(body.x, body.y, body.outKind === "xtreme" ? 1.35 : 0.95);
      shakeArena(body.outKind === "xtreme" ? "big-shake" : "shake");
    } catch (error) {}

    setCommentary(
      body.outKind === "xtreme"
        ? `${body.side === "player" ? "你" : "敵方"}被撞入極限加速區，彈射出場！`
        : `${body.side === "player" ? "你" : "敵方"}被擊飛出場！`
    );

    checkFinish();
    return;
  }

  /*
   * 一般撞牆演出。
   */
  const speed = Math.hypot(body.vx, body.vy);

  if (speed > 2.2 && t - body.lastWallHitAt > 300) {
    body.lastWallHitAt = t;

    const impulse = clamp(speed / 11, 0.28, 1.35);

    try {
      createWallFlash(
        clamp(body.x, arena.left, arena.right),
        clamp(body.y, arena.top, arena.bottom),
        nx,
        ny,
        impulse
      );
    } catch (error) {}

    try {
      if (Sound && typeof Sound.rail === "function") {
        Sound.rail(impulse);
      }
    } catch (error) {}

    try {
      if (CollisionSfx && typeof CollisionSfx.playByImpact === "function") {
        CollisionSfx.playByImpact("light", impulse);
      }
    } catch (error) {}

    if (speed > 6.2) {
      shakeArena("shake");
    }

    setCommentary("撞上場邊！反彈回戰線！");
  }
}


function updateBody(body, other, arena, dt) {
  if (!body || body.dead) return;

  const battle = state.battle;
  const elapsed = battle && battle.startedAt
    ? now() - battle.startedAt
    : 999999;

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
   * 依類型調整摩擦。
   * 持久型低摩擦，攻擊型高機動但摩擦略高。
   */
  const traitFrictionMul = body.trait?.frictionMul || 1;

  const localFriction =
    (
      PHY.friction -
      0.0015 * (1 - edgeRatio) +
      0.0022 * edgeRatio
    ) /
    Math.max(0.92, Math.min(1.1, traitFrictionMul));

  body.vx *= Math.pow(localFriction, dt);
  body.vy *= Math.pow(localFriction, dt);

  /*
   * 轉速自然衰減。
   * 降低整體衰減，避免太快進 Spin 結束。
   */
  const spinDrain =
    PHY.spinDrain *
    dt *
    (0.64 + body.wobble * 0.08 + edgeRatio * 0.12) /
    Math.max(0.85, body.trait?.spinKeep || 1);

  body.spin = Math.max(0, body.spin - spinDrain);
  body.spinRatio = clamp(body.spin / Math.max(1, body.maxSpin), 0, 1);

  body.angularSpeed *= Math.pow(0.99935, dt);

  /*
   * 低轉速晃動。
   */
  if (body.spinRatio < 0.24) {
    body.wobble += (0.24 - body.spinRatio) * 0.014 * dt;
  } else {
    body.wobble *= Math.pow(0.9965, dt);
  }

  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);
  const spinRatio = clamp(body.spinRatio || 0, 0, 1);
  const wobbleRatio = clamp(body.wobble || 0, 0, 2);

  const spinUse =
    (PHY.spinEnergyDrain ?? 0.009) *
    (0.28 + spinRatio * 0.65);

  const speedUse =
    (PHY.speedEnergyDrain ?? 0.004) *
    speedRatio;

  const edgeUse =
    (PHY.naturalEnergyDrain ?? 0.006) *
    edgeRatio *
    0.34;

  const wobbleUse =
    (PHY.wobbleEnergyDrain ?? 0.006) *
    wobbleRatio *
    0.12;

  /*
   * 低轉速壓力。
   * 這裡只做慢慢耗能，不直接殺死。
   */
  const lowSpinPressure =
    spinRatio < 0.18
      ? (0.18 - spinRatio) * 0.024
      : 0;

  /*
   * =========================================================
   * Matchup Natural Pressure / 相剋自然壓力
   * =========================================================
   *
   * 持久型剋防禦型：
   * - 防禦型在長戰中自然壓力略高。
   *
   * 防禦型剋攻擊型：
   * - 攻擊型撞不上效果時，自己耗能略高。
   *
   * 攻擊型剋持久型：
   * - 持久型被逼偏離穩定軌跡時耗能略高。
   *
   * 注意：
   * 這裡倍率壓低，避免相剋造成自然秒殺。
   */
  let matchupNaturalPressure = 1;

  if (other && other.top) {
    const enemyToMe = getTypeMatchup(
      other.type || other.top?.type,
      body.type || body.top?.type
    );

    if (enemyToMe.relation === "advantage") {
      matchupNaturalPressure = 1.035;
    } else if (enemyToMe.relation === "disadvantage") {
      matchupNaturalPressure = 0.985;
    }
  }

  /*
   * 開場保護：
   * 前 4 秒自然耗能更低，避免未交鋒就掉太快。
   */
  const earlyMul = elapsed < 4000 ? 0.42 : 1;

  const naturalEnergyCost =
    dt *
    (
      spinUse +
      speedUse +
      edgeUse +
      wobbleUse +
      lowSpinPressure
    ) *
    matchupNaturalPressure *
    earlyMul *
    0.58;

  drainBodyNaturalEnergy(body, naturalEnergyCost);

  /*
   * 重要：
   * 不要在這裡直接把自然耗能歸零判 dead。
   * 是否自然歸零死亡交給 drainBodyNaturalEnergy() 裡的
   * PHY.naturalEnergyCanKill 控制。
   */
  body.hp = body.energy;
  body.maxHp = body.maxEnergy || 100;
}



/*
 * ---------------------------------------------------------
 * 08-1B. 陀螺專屬技能特效 / Top Special FX
 * ---------------------------------------------------------
 */

const TOP_SPECIAL_FX = {
  // 一般陀螺
  attack:  { label: "爆炎快閃", color1: "#e60012", color2: "#ffd45a", chance: 0.28 },
  defense: { label: "鋼鎧守護", color1: "#3fa9ff", color2: "#d8f1ff", chance: 0.28 },
  stamina: { label: "聖環迴光", color1: "#06c755", color2: "#c7ffd9", chance: 0.28 },
  balance: { label: "星翼閃光", color1: "#9b5cff", color2: "#57f2ff", chance: 0.28 },

  // 隱藏陀螺（觸發率更高，符合稀有度）
  "secret-shadow":  { label: "暗影吞噬", color1: "#1a1028", color2: "#ff2b7a", chance: 0.4 },
  "secret-light":   { label: "聖光淨化", color1: "#f7f0ff", color2: "#7df6ff", chance: 0.4 },
  "secret-fire":    { label: "業火灼燒", color1: "#ff1744", color2: "#ffb300", chance: 0.4 },
  "secret-ice":     { label: "永凍鎖定", color1: "#2fc7ff", color2: "#e8fbff", chance: 0.4 },
  "secret-thunder": { label: "雷霆爆閃", color1: "#fff36a", color2: "#28d8ff", chance: 0.4 }
};

/*
 * 純視覺色彩閃光，不依賴 game.css，完全自帶樣式。
 */
function createSpecialColorFlash(color1, color2) {
  const box = battleBox();
  if (!box) return;

  const flash = document.createElement("div");

  flash.style.position = "absolute";
  flash.style.inset = "0";
  flash.style.pointerEvents = "none";
  flash.style.zIndex = "80";
  flash.style.borderRadius = "inherit";
  flash.style.background =
    `radial-gradient(circle at 50% 50%, ${color2}66, ${color1}22 55%, transparent 75%)`;
  flash.style.opacity = "0.9";
  flash.style.transition = "opacity 460ms ease-out";

  box.appendChild(flash);

  requestAnimationFrame(() => {
    flash.style.opacity = "0";
  });

  setTimeout(() => {
    try { flash.remove(); } catch (error) {}
  }, 520);
}

/*
 * 專屬色彩粒子噴發，同樣完全自帶樣式。
 */
function createSpecialBurstParticles(x, y, color1, color2, count = 12) {
  const box = battleBox();
  if (!box) return;

  const frag = document.createDocumentFragment();
  const created = [];

  for (let i = 0; i < count; i += 1) {
    const p = document.createElement("i");
    const angle = rand(0, Math.PI * 2);
    const dist = rand(36, 100);

    p.style.position = "absolute";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = "9px";
    p.style.height = "9px";
    p.style.borderRadius = "50%";
    p.style.pointerEvents = "none";
    p.style.zIndex = "82";
    p.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;
    p.style.boxShadow = `0 0 12px 3px ${color2}aa`;
    p.style.transform = "translate(-50%, -50%) scale(1)";
    p.style.opacity = "1";
    p.style.transition = "transform 560ms ease-out, opacity 560ms ease-out";

    frag.appendChild(p);
    created.push({ el: p, dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist });
  }

  box.appendChild(frag);

  requestAnimationFrame(() => {
    created.forEach(({ el, dx, dy }) => {
      el.style.transform =
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.25)`;
      el.style.opacity = "0";
    });
  });

  setTimeout(() => {
    created.forEach(({ el }) => {
      try { el.remove(); } catch (error) {}
    });
  }, 600);
}

/*
 * 機率型技能觸發：
 * 每次有效碰撞都會擲一次骰子，
 * 命中就播放該陀螺的專屬特效（純視覺，不影響傷害計算）。
 */
function maybeTriggerTopSpecialFx(body, x, y) {
  if (!body || !body.top || body.dead) return;

  const cfg = TOP_SPECIAL_FX[body.top.id];
  if (!cfg) return;

  if (Math.random() > (cfg.chance ?? 0.3)) return;

  const t = now();
  if (t - (body.lastSpecialFxAt || 0) < 900) return;
  body.lastSpecialFxAt = t;

  createSpecialColorFlash(cfg.color1, cfg.color2);
  createSpecialBurstParticles(x, y, cfg.color1, cfg.color2, 12);

  setCommentary(
    `${body.side === "player" ? "你的" : "敵方"}${body.top.name} 發動「${cfg.label}」！`
  );
}


/*
 * =========================================================
 * Secret Top DOM FX / 隱藏陀螺 DOM 戰鬥特效
 * =========================================================
 * 適用目前遊戲架構：
 * - 陀螺本體是 DOM：.zg-battle-top
 * - 位置靠 syncBody() transform 更新
 * - 特效掛在 battleBox() 裡
 */

function installSecretDomFxStyle() {
  if (document.getElementById("zg-secret-dom-fx-style")) return;

  const style = document.createElement("style");
  style.id = "zg-secret-dom-fx-style";

  style.textContent = `
    .zg-secret-dom-fx {
      position: absolute !important;
      pointer-events: none !important;
      transform: translate(-50%, -50%) !important;
      border-radius: 999px !important;
      overflow: visible !important;
      isolation: isolate !important;
      contain: layout style paint !important;
    }

    .zg-secret-dom-fx > i {
      position: absolute !important;
      pointer-events: none !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      border-radius: 999px !important;
      display: block !important;
      box-sizing: border-box !important;
    }

    .zg-secret-dom-aura {
      width: calc(100% * var(--secret-scale, 1.5)) !important;
      height: calc(100% * var(--secret-scale, 1.5)) !important;
      background: radial-gradient(circle, var(--secret-core), var(--secret-aura) 42%, transparent 72%) !important;
      filter: blur(2px) !important;
      opacity: calc(.58 + var(--secret-spin, 1) * .28) !important;
      animation: zgSecretAuraPulse 1.1s ease-in-out infinite alternate !important;
      mix-blend-mode: screen !important;
    }

    .zg-secret-dom-ring {
      width: calc(100% * 1.42) !important;
      height: calc(100% * 1.42) !important;
      border: 3px solid var(--secret-ring) !important;
      box-shadow: 0 0 16px var(--secret-ring), inset 0 0 12px var(--secret-ring) !important;
      opacity: .78 !important;
      animation: zgSecretRingSpin 1.35s linear infinite !important;
    }

    .zg-secret-dom-core {
      width: 78% !important;
      height: 78% !important;
      background: radial-gradient(circle, transparent 46%, var(--secret-hit) 48%, transparent 62%) !important;
      opacity: .42 !important;
      animation: zgSecretCoreSpin .75s linear infinite reverse !important;
    }

    .zg-secret-dom-mark {
      width: 135% !important;
      height: 4px !important;
      border-radius: 999px !important;
      background: linear-gradient(90deg, transparent, var(--secret-slash), transparent) !important;
      box-shadow: 0 0 10px var(--secret-slash) !important;
      opacity: .46 !important;
      transform-origin: center center !important;
    }

    .zg-secret-dom-mark-1 {
      transform: translate(-50%, -50%) rotate(0deg) !important;
    }

    .zg-secret-dom-mark-2 {
      transform: translate(-50%, -50%) rotate(60deg) !important;
    }

    .zg-secret-dom-mark-3 {
      transform: translate(-50%, -50%) rotate(120deg) !important;
    }

    .zg-secret-dom-fx-flame .zg-secret-dom-aura {
      animation-duration: .58s !important;
      filter: blur(3px) !important;
    }

    .zg-secret-dom-fx-thunder .zg-secret-dom-ring {
      animation-duration: .42s !important;
      border-style: dashed !important;
    }

    .zg-secret-dom-fx-ice .zg-secret-dom-ring {
      border-style: double !important;
    }

    .zg-secret-dom-fx-holy .zg-secret-dom-aura {
      filter: blur(1px) brightness(1.22) !important;
    }

    .zg-secret-dom-fx-shadow .zg-secret-dom-aura {
      filter: blur(3px) contrast(1.2) !important;
    }

    .zg-secret-dom-trail {
      mix-blend-mode: screen !important;
      will-change: transform, opacity !important;
    }

    .zg-secret-dom-impact,
    .zg-secret-dom-slash,
    .zg-secret-dom-particle,
    .zg-secret-dom-special-text {
      pointer-events: none !important;
      mix-blend-mode: screen !important;
      will-change: transform, opacity !important;
    }

    .zg-secret-dom-special-text {
      position: absolute !important;
      left: 50% !important;
      top: 22% !important;
      transform: translate(-50%, -50%) scale(.86) !important;
      z-index: 120 !important;
      padding: 8px 16px !important;
      border-radius: 999px !important;
      color: #fff !important;
      font-size: 22px !important;
      font-weight: 1000 !important;
      line-height: 1 !important;
      letter-spacing: .04em !important;
      text-align: center !important;
      white-space: nowrap !important;
      text-shadow: 0 3px 0 rgba(0,0,0,.75), 0 0 18px currentColor !important;
      opacity: 1 !important;
      transition: opacity 520ms ease-out, transform 520ms ease-out !important;
    }

    @keyframes zgSecretAuraPulse {
      from {
        transform: translate(-50%, -50%) scale(.96);
        opacity: .58;
      }
      to {
        transform: translate(-50%, -50%) scale(1.12);
        opacity: .92;
      }
    }

    @keyframes zgSecretRingSpin {
      from {
        transform: translate(-50%, -50%) rotate(0deg) scale(.96);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg) scale(1.06);
      }
    }

    @keyframes zgSecretCoreSpin {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }

    .zg-performance-mode .zg-secret-dom-fx,
    .zg-performance-mode .zg-secret-dom-trail,
    .zg-performance-mode .zg-secret-dom-particle {
      filter: none !important;
      box-shadow: none !important;
    }

    .zg-performance-mode .zg-secret-dom-trail {
      display: none !important;
    }
  `;

  document.head.appendChild(style);
}

function getBodySecretFx(body) {
  if (!body) return null;

  if (typeof getTopFx === "function") {
    const direct = getTopFx(body);
    if (direct) return direct;

    if (body.top) {
      const byTop = getTopFx(body.top);
      if (byTop) return byTop;
    }
  }

  const topId =
    body.fxId ||
    body.topId ||
    body.baseId ||
    body.id ||
    body.top?.fxId ||
    body.top?.id ||
    "";

  if (
    typeof SECRET_TOP_FX !== "undefined" &&
    topId &&
    SECRET_TOP_FX[topId]
  ) {
    return SECRET_TOP_FX[topId];
  }

  if (body.top?.name && typeof SECRET_TOP_FX !== "undefined") {
    const found = Object.values(SECRET_TOP_FX).find(function(fx) {
      return fx.name === body.top.name;
    });

    if (found) return found;
  }

  return null;
}

function attachSecretFxIdentity(body, top) {
  if (!body || !top) return body;

  body.id = body.id || top.id;
  body.fxId = body.fxId || top.fxId || top.id;
  body.topId = body.topId || top.id;
  body.baseId = body.baseId || top.id;
  body.name = body.name || top.name;
  body.top = body.top || top;

  if (body.top) {
    body.top.fxId = body.top.fxId || top.fxId || top.id;
  }

  return body;
}

function ensureSecretTopDomFx(body) {
  const fx = getBodySecretFx(body);
  if (!fx || !body || !body.el) return null;

  installSecretDomFxStyle();

  let layer = body.secretFxLayer;

  if (!layer || !layer.isConnected) {
    layer = document.createElement("div");
    layer.className = `zg-secret-dom-fx zg-secret-dom-fx-${fx.theme}`;
    layer.setAttribute("data-secret-fx-id", fx.id);
    layer.setAttribute("aria-hidden", "true");

    layer.innerHTML = `
      <i class="zg-secret-dom-aura"></i>
      <i class="zg-secret-dom-ring"></i>
      <i class="zg-secret-dom-core"></i>
      <i class="zg-secret-dom-mark zg-secret-dom-mark-1"></i>
      <i class="zg-secret-dom-mark zg-secret-dom-mark-2"></i>
      <i class="zg-secret-dom-mark zg-secret-dom-mark-3"></i>
    `;

    const box = battleBox();

    if (box) {
      box.appendChild(layer);
    }

    body.secretFxLayer = layer;
  }

  layer.style.setProperty("--secret-aura", fx.auraColor || "rgba(155,50,255,.55)");
  layer.style.setProperty("--secret-core", fx.coreColor || "rgba(20,0,45,.8)");
  layer.style.setProperty("--secret-ring", fx.ringColor || "rgba(120,50,255,.75)");
  layer.style.setProperty("--secret-hit", fx.hitColor || "rgba(220,100,255,.95)");
  layer.style.setProperty("--secret-slash", fx.slashColor || "rgba(255,255,255,.95)");
  layer.style.setProperty("--secret-trail", fx.trailColor || "rgba(120,50,255,.35)");
  layer.style.setProperty("--secret-scale", String(fx.auraMul || 1.5));

  layer.style.setProperty("left", `${body.x}px`, "important");
  layer.style.setProperty("top", `${body.y}px`, "important");
  layer.style.setProperty("width", `${body.r * 2}px`, "important");
  layer.style.setProperty("height", `${body.r * 2}px`, "important");
  layer.style.setProperty("z-index", body.side === "player" ? "44" : "43", "important");
  layer.style.setProperty("opacity", body.dead ? "0.18" : "1", "important");

  return layer;
}

function syncSecretTopDomFx(body) {
  const fx = getBodySecretFx(body);
  if (!fx || !body || !body.el) return;

  const layer = ensureSecretTopDomFx(body);

  if (layer) {
    const speed = Math.hypot(body.vx || 0, body.vy || 0);
    const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);
    const spinRatio = clamp(body.spinRatio || 0, 0, 1);

    layer.style.setProperty("left", `${body.x}px`, "important");
    layer.style.setProperty("top", `${body.y}px`, "important");
    layer.style.setProperty("opacity", body.dead ? "0.18" : "1", "important");
    layer.style.setProperty("--secret-speed", String(speedRatio));
    layer.style.setProperty("--secret-spin", String(spinRatio));
  }

  createSecretDomTrail(body, fx);
}

function createSecretDomTrail(body, fx) {
  if (!body || !fx || body.dead) return;

  const box = battleBox();
  if (!box) return;

  const speed = Math.hypot(body.vx || 0, body.vy || 0);
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);

  if (speedRatio < 0.18 && body.spinRatio < 0.42) return;

  const t = now();
  const gap = PERF.lowFx ? 220 : 92;

  if (t - (body.lastSecretDomTrailAt || 0) < gap) return;

  body.lastSecretDomTrailAt = t;

  const trail = document.createElement("i");
  trail.className = `zg-secret-dom-trail zg-secret-dom-trail-${fx.theme}`;

  const size = body.r * 2 * (1 + speedRatio * 0.18);

  trail.style.setProperty("position", "absolute", "important");
  trail.style.setProperty("left", `${body.x}px`, "important");
  trail.style.setProperty("top", `${body.y}px`, "important");
  trail.style.setProperty("width", `${size}px`, "important");
  trail.style.setProperty("height", `${size}px`, "important");
  trail.style.setProperty("border-radius", "999px", "important");
  trail.style.setProperty("background", `radial-gradient(circle, ${fx.trailColor}, transparent 68%)`, "important");
  trail.style.setProperty("box-shadow", `0 0 ${18 + speedRatio * 22}px ${fx.trailColor}`, "important");
  trail.style.setProperty("opacity", String(0.34 + speedRatio * 0.22), "important");
  trail.style.setProperty("filter", "blur(1px)", "important");
  trail.style.setProperty("transform", `translate(-50%, -50%) rotate(${body.angle || 0}deg) scale(1)`, "important");
  trail.style.setProperty("transition", "opacity 360ms ease-out, transform 360ms ease-out", "important");
  trail.style.setProperty("pointer-events", "none", "important");
  trail.style.setProperty("z-index", body.side === "player" ? "42" : "41", "important");

  box.appendChild(trail);

  requestAnimationFrame(() => {
    trail.style.setProperty("opacity", "0", "important");
    trail.style.setProperty(
      "transform",
      `translate(-50%, -50%) rotate(${(body.angle || 0) + 35}deg) scale(${1.24 + speedRatio * 0.25})`,
      "important"
    );
  });

  setTimeout(() => {
    try {
      trail.remove();
    } catch (error) {}
  }, 390);
}

function spawnSecretDomImpact(x, y, power, a, b) {
  const fxA = getBodySecretFx(a);
  const fxB = getBodySecretFx(b);
  const fx = fxA || fxB;

  if (!fx) return;

  installSecretDomFxStyle();

  const box = battleBox();
  if (!box) return;

  const secretVsSecretMul = fxA && fxB ? 1.25 : 1;
  const safePower = clamp((Number(power) || 1) * secretVsSecretMul, 0.5, 3.2);


  createSecretDomImpactRing(x, y, fx, safePower);
  createSecretDomImpactSlashes(x, y, fx, safePower);
  createSecretDomImpactParticles(x, y, fx, safePower);

  try {
  shakeArena(safePower > 0.95 ? "big-shake" : "shake");
} catch (error) {}

  try {
    if (typeof BATTLE_FX !== "undefined") {
      BATTLE_FX.hitFreeze = Math.max(
        BATTLE_FX.hitFreeze || 0,
        safePower > 1.1 ? fx.hitFreeze || 4 : 2
      );
    }
  } catch (error) {}

  if (safePower > 0.95) {
  showSecretDomSpecialText(fx.specialText || fx.name, fx.hitColor);
}

}

function createSecretDomImpactRing(x, y, fx, power) {
  const box = battleBox();
  if (!box) return;

  const ring = document.createElement("i");
  ring.className = `zg-secret-dom-impact zg-secret-dom-impact-${fx.theme}`;

  const size = 70 + power * 42;

  ring.style.setProperty("position", "absolute", "important");
  ring.style.setProperty("left", `${x}px`, "important");
  ring.style.setProperty("top", `${y}px`, "important");
  ring.style.setProperty("width", `${size}px`, "important");
  ring.style.setProperty("height", `${size}px`, "important");
  ring.style.setProperty("border-radius", "999px", "important");
  ring.style.setProperty("border", `${3 + power}px solid ${fx.shockwaveColor}`, "important");
  ring.style.setProperty("box-shadow", `0 0 ${22 + power * 18}px ${fx.hitColor}`, "important");
  ring.style.setProperty("transform", "translate(-50%, -50%) scale(0.25)", "important");
  ring.style.setProperty("opacity", "1", "important");
  ring.style.setProperty("pointer-events", "none", "important");
  ring.style.setProperty("z-index", "84", "important");
  ring.style.setProperty("transition", "transform 420ms ease-out, opacity 420ms ease-out", "important");

  box.appendChild(ring);

  requestAnimationFrame(() => {
    ring.style.setProperty("transform", "translate(-50%, -50%) scale(1.75)", "important");
    ring.style.setProperty("opacity", "0", "important");
  });

  setTimeout(() => {
    try {
      ring.remove();
    } catch (error) {}
  }, 460);
}

function createSecretDomImpactSlashes(x, y, fx, power) {
  const box = battleBox();
  if (!box) return;

  const count =
    fx.theme === "flame"
      ? 8
      : fx.theme === "thunder"
        ? 7
        : 5;

  for (let i = 0; i < count; i += 1) {
    const slash = document.createElement("i");

    const angle = rand(0, Math.PI * 2);
    const len = 44 + power * 42 + rand(-10, 18);

    slash.className = `zg-secret-dom-slash zg-secret-dom-slash-${fx.theme}`;
    slash.style.setProperty("position", "absolute", "important");
    slash.style.setProperty("left", `${x}px`, "important");
    slash.style.setProperty("top", `${y}px`, "important");
    slash.style.setProperty("width", `${len}px`, "important");
    slash.style.setProperty("height", `${3 + power}px`, "important");
    slash.style.setProperty("border-radius", "999px", "important");
    slash.style.setProperty("background", `linear-gradient(90deg, transparent, ${fx.slashColor}, transparent)`, "important");
    slash.style.setProperty("box-shadow", `0 0 12px ${fx.slashColor}`, "important");
    slash.style.setProperty("transform", `translate(-50%, -50%) rotate(${angle}rad) scaleX(0.2)`, "important");
    slash.style.setProperty("opacity", "1", "important");
    slash.style.setProperty("pointer-events", "none", "important");
    slash.style.setProperty("z-index", "85", "important");
    slash.style.setProperty("transition", "transform 300ms ease-out, opacity 300ms ease-out", "important");

    box.appendChild(slash);

    requestAnimationFrame(() => {
      slash.style.setProperty("transform", `translate(-50%, -50%) rotate(${angle}rad) scaleX(1.18)`, "important");
      slash.style.setProperty("opacity", "0", "important");
    });

    setTimeout(() => {
      try {
        slash.remove();
      } catch (error) {}
    }, 330);
  }
}

function createSecretDomImpactParticles(x, y, fx, power) {
  const box = battleBox();
  if (!box) return;

  const count = PERF.lowFx
  ? Math.min(10, Math.round((fx.particleCount || 24) * 0.38))
  : Math.min(42, Math.round((fx.particleCount || 24) * 1.05));


  for (let i = 0; i < count; i += 1) {
    const p = document.createElement("i");

    const angle = rand(0, Math.PI * 2);
    const dist = rand(28, 92) * clamp(power, 0.7, 1.8);
    const size = rand(4, 9);

    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    p.className = `zg-secret-dom-particle zg-secret-dom-particle-${fx.theme}`;
    p.style.setProperty("position", "absolute", "important");
    p.style.setProperty("left", `${x}px`, "important");
    p.style.setProperty("top", `${y}px`, "important");
    p.style.setProperty("width", `${size}px`, "important");
    p.style.setProperty("height", `${size}px`, "important");
    p.style.setProperty("border-radius", "999px", "important");
    p.style.setProperty("background", fx.particleColor || fx.hitColor, "important");
    p.style.setProperty("box-shadow", `0 0 10px ${fx.particleColor || fx.hitColor}`, "important");
    p.style.setProperty("transform", "translate(-50%, -50%) scale(1)", "important");
    p.style.setProperty("opacity", "1", "important");
    p.style.setProperty("pointer-events", "none", "important");
    p.style.setProperty("z-index", "86", "important");
    p.style.setProperty("transition", "transform 520ms ease-out, opacity 520ms ease-out", "important");

    box.appendChild(p);

    requestAnimationFrame(() => {
      p.style.setProperty(
        "transform",
        `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.16)`,
        "important"
      );
      p.style.setProperty("opacity", "0", "important");
    });

    setTimeout(() => {
      try {
        p.remove();
      } catch (error) {}
    }, 560);
  }
}

function showSecretDomSpecialText(text, color) {
  const box = battleBox();
  if (!box) return;

  const label = document.createElement("div");

  label.className = "zg-secret-dom-special-text";
  label.textContent = text || "SECRET ATTACK";
  label.style.setProperty("color", color || "#fff", "important");

  box.appendChild(label);

  requestAnimationFrame(() => {
    label.style.setProperty("transform", "translate(-50%, -50%) scale(1.08)", "important");
  });

  setTimeout(() => {
    label.style.setProperty("opacity", "0", "important");
    label.style.setProperty("transform", "translate(-50%, -50%) scale(1.24)", "important");
  }, 520);

  setTimeout(() => {
    try {
      label.remove();
    } catch (error) {}
  }, 980);
}

function cleanupSecretDomFx() {
  const box = battleBox();
  if (!box) return;

  $$(
    ".zg-secret-dom-fx, .zg-secret-dom-trail, .zg-secret-dom-impact, .zg-secret-dom-slash, .zg-secret-dom-particle, .zg-secret-dom-special-text",
    box
  ).forEach((el) => {
    try {
      el.remove();
    } catch (error) {}
  });
}



  
  
function resolveCollision(a, b) {
  if (!a || !b || a.dead || b.dead) return;

  const battle = state.battle;
  const t = now();

  const elapsed = battle && battle.startedAt
    ? t - battle.startedAt
    : 999999;

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;

  if (dist <= 0 || dist >= minDist) return;

  /*
   * 碰撞冷卻：
   * 避免兩顆陀螺貼住時，每幀都高頻扣血。
   */
  const lastHitGap = Math.min(
    t - (a.lastHitAt || 0),
    t - (b.lastHitAt || 0)
  );

  if (lastHitGap < (PHY.collisionCooldown || 86)) {
    return;
  }

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

  /*
   * =========================================================
   * Type Matchup / 類型相剋計算
   * =========================================================
   *
   * 注意：
   * 必須在 impulse / knockback 前宣告，
   * 因為擊飛倍率會用到 aToBMatchup / bToAMatchup。
   */
  const aToBMatchup = getTypeMatchup(
    a.type || a.top?.type,
    b.type || b.top?.type
  );

  const bToAMatchup = getTypeMatchup(
    b.type || b.top?.type,
    a.type || a.top?.type
  );

  a.lastMatchupRelation = aToBMatchup.relation;
  b.lastMatchupRelation = bToAMatchup.relation;

  a.lastMatchupCommentary = aToBMatchup.commentary;
  b.lastMatchupCommentary = bToAMatchup.commentary;

  const impactSpeed = Math.abs(relVel);
  const tangentSpeed = Math.abs(rvx * -ny + rvy * nx);
  const spinImpact = Math.abs(a.angularSpeed - b.angularSpeed) * 0.012;

  const impulse =
    (-(1 + PHY.restitution) * relVel) /
    (1 / a.mass + 1 / b.mass);

  const impulseX = impulse * nx;
  const impulseY = impulse * ny;

  /*
   * 擊飛倍率加入相剋。
   * 優勢方比較容易把對手推開，但倍率已壓低。
   */
  a.vx -= (impulseX / a.mass) * bToAMatchup.knockbackMul;
  a.vy -= (impulseY / a.mass) * bToAMatchup.knockbackMul;

  b.vx += (impulseX / b.mass) * aToBMatchup.knockbackMul;
  b.vy += (impulseY / b.mass) * aToBMatchup.knockbackMul;

  a.angularSpeed += (-ny * impulseX + nx * impulseY) * 0.028;
  b.angularSpeed -= (-ny * impulseX + nx * impulseY) * 0.028;

  const aSpeedHitMul =
  normalizeTopType(a.type || a.top?.type) === "attack" ? 1.16 :
  normalizeTopType(a.type || a.top?.type) === "speed" ? 1.12 :
  normalizeTopType(a.type || a.top?.type) === "balance" ? 0.98 :
  normalizeTopType(a.type || a.top?.type) === "defense" ? 0.88 :
  normalizeTopType(a.type || a.top?.type) === "stamina" ? 0.9 :
  1;

const bSpeedHitMul =
  normalizeTopType(b.type || b.top?.type) === "attack" ? 1.16 :
  normalizeTopType(b.type || b.top?.type) === "speed" ? 1.12 :
  normalizeTopType(b.type || b.top?.type) === "balance" ? 0.98 :
  normalizeTopType(b.type || b.top?.type) === "defense" ? 0.88 :
  normalizeTopType(b.type || b.top?.type) === "stamina" ? 0.9 :
  1;

const typeHitMul = Math.max(aSpeedHitMul, bSpeedHitMul);

const hitPower = clamp(
  (
    impactSpeed * 0.66 +
    tangentSpeed * 0.15 +
    spinImpact
  ) * typeHitMul,
  0,
  13.5
);


  if (hitPower < 0.42) return;

  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;

/*
 * 隱藏陀螺專屬撞擊特效
 * 注意：普通打擊 FX 後面仍會照常播放。
 * 這裡只負責額外疊加隱藏陀螺特效。
 */
if (
  typeof spawnSecretDomImpact === "function" &&
  (
    getBodySecretFx(a) ||
    getBodySecretFx(b)
  )
) {
  spawnSecretDomImpact(
    midX,
    midY,
    clamp(hitPower / 4.4, 0.5, 3.0),
    a,
    b
  );
}



  /*
   * 記錄最近一次有效撞擊。
   * resolveWall() 會用它判斷 Over / Xtreme Finish。
   */
  a.lastImpactPower = hitPower;
  b.lastImpactPower = hitPower;

  a.lastImpactFrom = b.side;
  b.lastImpactFrom = a.side;

  a.lastImpactAt = t;
  b.lastImpactAt = t;

  const aEnergyRatio = clamp(a.energyRatio ?? 1, 0, 1);
  const bEnergyRatio = clamp(b.energyRatio ?? 1, 0, 1);

  const aEnergyAtkMul = 0.7 + aEnergyRatio * 0.34;
  const bEnergyAtkMul = 0.7 + bEnergyRatio * 0.34;

  const aEnergyDefMul = 0.68 + aEnergyRatio * 0.38;
  const bEnergyDefMul = 0.68 + bEnergyRatio * 0.38;

  /*
   * 攻防倍率加入類型相剋。
   */
  const aAtk =
    a.attack *
    (0.82 + a.spinRatio * 0.3) *
    aEnergyAtkMul *
    aToBMatchup.attackMul;

  const bAtk =
    b.attack *
    (0.82 + b.spinRatio * 0.3) *
    bEnergyAtkMul *
    bToAMatchup.attackMul;

  const aDef =
    a.defense *
    (0.88 + a.spinRatio * 0.2) *
    aEnergyDefMul *
    bToAMatchup.defenseMul;

  const bDef =
    b.defense *
    (0.88 + b.spinRatio * 0.2) *
    bEnergyDefMul *
    aToBMatchup.defenseMul;

  /*
   * aDamage：a 對 b 造成的基礎傷害。
   * bDamage：b 對 a 造成的基礎傷害。
   *
   * 數值已降低，避免 2～3 秒結束。
   */
  const aDamage =
    Math.max(0.14, (aAtk - bDef * 0.66) * 0.016) *
    hitPower *
    PHY.damageScale *
    state.damagePressure *
    aToBMatchup.energyDamageMul;

  const bDamage =
    Math.max(0.14, (bAtk - aDef * 0.66) * 0.016) *
    hitPower *
    PHY.damageScale *
    state.damagePressure *
    bToAMatchup.energyDamageMul;

  /*
   * 實際能量傷害。
   * 上限大幅降低，避免一撞扣 20～40。
   */
  let aEnergyDamage =
  clamp(
    (
      aDamage * 0.68 +
      hitPower * 0.22 * aToBMatchup.knockbackMul +
      tangentSpeed * 0.045
    ) *
    aToBMatchup.energyDamageMul,
    0.12,
    7.2
  );

let bEnergyDamage =
  clamp(
    (
      bDamage * 0.68 +
      hitPower * 0.22 * bToAMatchup.knockbackMul +
      tangentSpeed * 0.045
    ) *
    bToAMatchup.energyDamageMul,
    0.12,
    7.2
  );

  /*
   * 開場保護：
   * 前 3.6 秒內，碰撞仍有聲光與位移，
   * 但傷害進一步降低。
   */
  if (elapsed < 3600) {
    aEnergyDamage *= 0.42;
    bEnergyDamage *= 0.42;
  }

  /*
   * 首次碰撞傷害再壓低。
   */
  if (!state.firstCollision) {
    aEnergyDamage *= 0.68;
    bEnergyDamage *= 0.68;
  }

  if (typeof applySecretDamageStyle === "function") {
  aEnergyDamage = applySecretDamageStyle(aEnergyDamage, a, b);
  bEnergyDamage = applySecretDamageStyle(bEnergyDamage, b, a);
}

consumeBodyEnergy(b, aEnergyDamage);
consumeBodyEnergy(a, bEnergyDamage);


  /*
   * =========================================================
   * Burst Finish / 爆裂勝利判定
   * =========================================================
   *
   * 修正：
   * - b.energy <= 0 才讓 b burst。
   * - a.energy <= 0 才讓 a burst。
   * - 開場前幾秒禁止 Burst。
   * - 必須低轉速 + 高撞擊才爆裂。
   */
  const burstThreshold = PHY.burstThreshold || 9.4;
  const canBurst =
    elapsed >= (PHY.minBurstFinishMs || 4800);

  if (
    canBurst &&
    b.energy <= 0 &&
    b.spinRatio < 0.24 &&
    hitPower * aToBMatchup.burstMul >= burstThreshold
  ) {
    b.burst = true;
    b.dead = true;
    b.out = false;
    b.outKind = "";

    try {
      createBurstPieces(b.x, b.y, 1.65);
      createImpactRing(b.x, b.y, 1.6);
      createMetalSparks(b.x, b.y, 1.55);
    } catch (error) {}
  }

  if (
    canBurst &&
    a.energy <= 0 &&
    a.spinRatio < 0.24 &&
    hitPower * bToAMatchup.burstMul >= burstThreshold
  ) {
    a.burst = true;
    a.dead = true;
    a.out = false;
    a.outKind = "";

    try {
      createBurstPieces(a.x, a.y, 1.65);
      createImpactRing(a.x, a.y, 1.6);
      createMetalSparks(a.x, a.y, 1.55);
    } catch (error) {}
  }

  /*
   * 非 Burst 的能量歸零：
   * 如果不是爆裂，只先標記 dead。
   * checkFinish() 會判為 Spin Finish。
   */
  if (b.energy <= 0 && !b.burst && !b.out) {
    b.dead = true;
  }

  if (a.energy <= 0 && !a.burst && !a.out) {
    a.dead = true;
  }

  updateHpBars();

  if (checkFinish()) return;

  a.hp = a.energy;
  a.maxHp = a.maxEnergy;

  b.hp = b.energy;
  b.maxHp = b.maxEnergy;

  /*
   * 轉速損耗。
   * 降低轉速損耗，讓 Spin Finish 有機會自然形成。
   */
  const spinCost = hitPower * PHY.collisionSpinLoss * 0.34;

  a.spin = Math.max(
    0,
    a.spin -
      spinCost *
      Math.max(0.35, 1.02 - a.defense / 300) *
      bToAMatchup.spinDamageMul
  );

  b.spin = Math.max(
    0,
    b.spin -
      spinCost *
      Math.max(0.35, 1.02 - b.defense / 300) *
      aToBMatchup.spinDamageMul
  );

  a.spinRatio = clamp(a.spin / Math.max(1, a.maxSpin), 0, 1);
  b.spinRatio = clamp(b.spin / Math.max(1, b.maxSpin), 0, 1);

  a.wobble += hitPower * 0.008 * (1.15 - a.spinRatio);
  b.wobble += hitPower * 0.008 * (1.15 - b.spinRatio);

  a.lastHitAt = t;
  b.lastHitAt = t;

  if (bDamage > 0.7) {
    pulseHpBar(a.side);
  }

  if (aDamage > 0.7) {
    pulseHpBar(b.side);
  }

  if (a.side === "player" || b.side === "player") {
    pulseBattleEnergyBar();
  }

  updateHpBars();
  updateBattleEnergyPanel();

  state.lastEffectiveHitAt = t;

  /*
   * 相剋解說。
   * 加冷卻，避免每次碰撞都洗畫面。
   */
  if (t - (state.lastMatchupCommentaryAt || 0) > 1800) {
    const commentary =
      aToBMatchup.relation === "advantage"
        ? aToBMatchup.commentary
        : bToAMatchup.relation === "advantage"
          ? bToAMatchup.commentary
          : "";

    if (commentary) {
      state.lastMatchupCommentaryAt = t;
      setCommentary(commentary);
    }
  }

  const intensity = clamp(hitPower / 7.5, 0.22, 1.85);

  const heavy =
    hitPower > 5.2 ||
    Math.max(aDamage, bDamage) > 2.8 ||
    Math.max(aEnergyDamage, bEnergyDamage) > 5.2;

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
    if (Math.random() < 0.28) {
      setCommentary("連續碰撞！金屬聲交錯！");
    }

    playNormalCollisionFX(midX, midY, intensity);
    trackCollision("normal", hitPower, aDamage, bDamage, a, b);
  }

  /*
   * 陀螺專屬技能特效：純視覺，不影響傷害。
   */
  maybeTriggerTopSpecialFx(a, midX, midY);
  maybeTriggerTopSpecialFx(b, midX, midY);

  maybeTriggerCenterDuel(a, b, hitPower);
}


function trackCollision(kind, hitPower, aDamage, bDamage, a, b) {
  const t = now();

  if (t - PERF.lastCollisionTrackAt < PERF.minCollisionTrackGap) return;

  PERF.lastCollisionTrackAt = t;

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


/*
 * ---------------------------------------------------------
 * Collision FX / 碰撞特效
 * ---------------------------------------------------------
 *
 * 注意：
 * 這裡不要再用 if (typeof xxx !== "function") fallback 包法。
 * 因為同一支 game.js 內後面又會宣告同名 function，
 * 很容易造成大括號 scope 錯亂。
 *
 * 保留單一正式版本最穩。
 */

function playFirstCollisionFX(x, y, intensity = 1) {
  const box = battleBox();
  const power = clamp(Number(intensity) || 1, 0.35, 2.4);

  console.log("[SFX] first collision fx", { power });

  /*
   * 首次碰撞音效
   */
  try {
    if (Sound && typeof Sound.collisionFirst === "function") {
      Sound.collisionFirst(power);
    } else if (Sound && typeof Sound.metal === "function") {
      Sound.metal(0.9 * power, 1.08);
    }
  } catch (error) {}

  try {
    if (CollisionSfx && typeof CollisionSfx.playByImpact === "function") {
      CollisionSfx.playByImpact("first", power);
    }
  } catch (error) {
    console.warn("[SFX] first collision failed", error);
  }

  try {
    flashArena(0.48 * power);
  } catch (error) {}

  try {
    shakeArena(power > 1.15 ? "big-shake" : "shake");
  } catch (error) {}

  if (box) {
    restartClass(box, "zg-impact-punch", 320);
    restartClass(box, "zg-collision-zoom", 420);
    restartClass(box, "zg-collision-heavy", 420);
  }

  try {
    createImpactRing(x, y, 1.45 * power);
  } catch (error) {}

  try {
    createImpactStreak(x, y, 1.25 * power);
  } catch (error) {}

  try {
    createMetalSparks(x, y, 1.45 * power);
  } catch (error) {}

  try {
    createSparks(x, y, 1.2 * power, 1.25);
  } catch (error) {}

  try {
    if (!PERF.lowFx) {
      createStarDust(Math.round(30 * power));
    }
  } catch (error) {}
}


function playHeavyCollisionFX(x, y, intensity = 1, a, b) {
  const box = battleBox();
  const power = clamp(Number(intensity) || 1, 0.45, 2.5);

  console.log("[SFX] heavy collision fx", { power });

  /*
   * 重擊碰撞音效
   */
  try {
    if (Sound && typeof Sound.collisionHeavy === "function") {
      Sound.collisionHeavy(power);
    } else if (Sound && typeof Sound.metal === "function") {
      Sound.metal(1.15 * power, 1.18);
    }
  } catch (error) {}

  try {
    if (CollisionSfx && typeof CollisionSfx.playByImpact === "function") {
      CollisionSfx.playByImpact("heavy", power);
    }
  } catch (error) {
    console.warn("[SFX] heavy collision failed", error);
  }

  try {
    shakeArena(power > 1.2 ? "big-shake" : "shake");
  } catch (error) {}

  try {
    flashArena(0.58 * power);
  } catch (error) {}

  if (box) {
    restartClass(box, "zg-impact-punch", 260);
    restartClass(box, "zg-collision-heavy", 360);
  }

  try {
    createImpactRing(x, y, 1.25 * power);
  } catch (error) {}

  try {
    createImpactStreak(x, y, 1.15 * power);
  } catch (error) {}

  try {
    createMetalSparks(x, y, 1.25 * power);
  } catch (error) {}

  try {
    if (!PERF.lowFx) {
      createSparks(x, y, 1.1 * power, 1.1);

      if (a) createSpinAfterimage(a);
      if (b) createSpinAfterimage(b);
    }
  } catch (error) {}
}


function playNormalCollisionFX(x, y, intensity = 1) {
  const power = clamp(Number(intensity) || 1, 0.25, 2.1);

  console.log("[SFX] normal collision fx", { power });

  /*
   * 一般碰撞音效
   */
  try {
    if (Sound && typeof Sound.collisionNormal === "function") {
      Sound.collisionNormal(power);
    } else if (Sound && typeof Sound.metal === "function") {
      Sound.metal(0.48 * power, 0.9);
    }
  } catch (error) {}

  try {
    if (CollisionSfx && typeof CollisionSfx.playByImpact === "function") {
      CollisionSfx.playByImpact("normal", power);
    }
  } catch (error) {
    console.warn("[SFX] normal collision failed", error);
  }

  try {
    if (power > 0.65) {
      flashArena(0.2 * power);
    }
  } catch (error) {}

  try {
    if (power > 0.7) {
      createImpactRing(x, y, 0.72 * power);
    }
  } catch (error) {}

  try {
    if (power > 0.55) {
      createMetalSparks(x, y, 0.7 * power);
    }
  } catch (error) {}

  try {
    if (!PERF.lowFx && power > 0.85) {
      createImpactStreak(x, y, 0.75 * power);
    }
  } catch (error) {}
}


/*
 * ---------------------------------------------------------
 * FX BATCH / 特效批次插入（優化用）
 * ---------------------------------------------------------
 * 說明：
 * 同一次碰撞會連續呼叫多個 create*Fx 函式，
 * 每個函式各自 appendChild 會造成多次重排。
 * 這裡用一個共用 Fragment，把同一批特效收集起來，
 * 最後統一 appendChild 一次，減少插入次數。
 *
 * 使用方式：
 * fxBatchBegin();
 * createXxx(...);
 * createYyy(...);
 * fxBatchFlush(box);
 */
let __zgFxBatchFragment = null;

function fxBatchBegin() {
  __zgFxBatchFragment = document.createDocumentFragment();
}

function fxBatchFlush(box) {
  if (__zgFxBatchFragment && box) {
    box.appendChild(__zgFxBatchFragment);
  }

  __zgFxBatchFragment = null;
}

function fxBatchAppend(box, nodeOrFragment) {
  if (!nodeOrFragment) return;

  if (__zgFxBatchFragment) {
    __zgFxBatchFragment.appendChild(nodeOrFragment);
    return;
  }

  if (box) {
    box.appendChild(nodeOrFragment);
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
  const created = [];

  fxAdd();

  for (let i = 0; i < amount; i += 1) {
    const s = document.createElement("i");

    s.className = "zg-stardust";
    s.style.left = `${rand(8, w - 8)}px`;
    s.style.top = `${rand(8, h - 8)}px`;
    s.style.animationDelay = `${rand(0, 0.18)}s`;
    s.style.opacity = String(rand(0.35, 0.75));

    frag.appendChild(s);
    created.push(s);
  }

  box.appendChild(frag);

  setTimeout(() => {
    /*
     * 直接移除自己建立的節點，不再用 querySelectorAll 重新掃描 box。
     * 避免同時間多批特效互相誤刪，也省掉一次 DOM 掃描成本。
     */
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, 760);
}


function createSparks(x, y, intensity = 1, spread = 1) {
  const box = battleBox();
  if (!box || !canFx(90)) return;

  const power = clamp(Number(intensity) || 1, 0.25, 2.2);
  const amount = PERF.lowFx
    ? Math.min(4, Math.round(3 * power))
    : Math.min(PERF.maxSparksPerHit || 12, Math.round(7 * power));

  if (amount <= 0) return;

  const frag = document.createDocumentFragment();
  const created = [];

  fxAdd();

  for (let i = 0; i < amount; i += 1) {
    const spark = document.createElement("i");

    const angle = rand(0, Math.PI * 2);
    const dist = rand(14, 42) * clamp(spread, 0.5, 1.8);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;

    spark.className = "zg-spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--dx", `${dx}px`);
    spark.style.setProperty("--dy", `${dy}px`);
    spark.style.setProperty("--rot", `${rand(-80, 80)}deg`);
    spark.style.setProperty("--scale", String(clamp(power, 0.55, 1.7)));
    spark.style.opacity = String(rand(0.55, 0.95));

    frag.appendChild(spark);
    created.push(spark);
  }

  box.appendChild(frag);

  setTimeout(() => {
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, 420);
}


function createMetalSparks(x, y, intensity = 1) {
  const box = battleBox();
  if (!box || !canFx(85)) return;

  const power = clamp(Number(intensity) || 1, 0.25, 2.4);
  const amount = PERF.lowFx
    ? Math.min(3, Math.round(2 * power))
    : Math.min(10, Math.round(5 * power));

  if (amount <= 0) return;

  const frag = document.createDocumentFragment();
  const created = [];

  fxAdd();

  for (let i = 0; i < amount; i += 1) {
    const spark = document.createElement("i");

    const angle = rand(0, Math.PI * 2);
    const len = rand(24, 62) * clamp(power, 0.6, 1.8);
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;

    spark.className = "zg-metal-spark";
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    spark.style.setProperty("--dx", `${dx}px`);
    spark.style.setProperty("--dy", `${dy}px`);
    spark.style.setProperty("--rot", `${angle}rad`);
    spark.style.setProperty("--scale", String(clamp(power, 0.6, 1.8)));
    spark.style.opacity = String(rand(0.65, 1));

    frag.appendChild(spark);
    created.push(spark);
  }

  box.appendChild(frag);

  setTimeout(() => {
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, 360);
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
  const box = battleBox();
  if (!box || PERF.lowFx) return;

  const power = clamp(Number(intensity) || 1, 0.6, 2.4);
  const amount = Math.min(10, Math.round(5 + power * 3));

  const frag = document.createDocumentFragment();
  const created = [];

  fxAdd();

  for (let i = 0; i < amount; i += 1) {
    const piece = document.createElement("i");

    const angle = rand(0, Math.PI * 2);
    const dist = rand(34, 92) * power;

    piece.className = "zg-burst-piece";
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
    piece.style.setProperty("--rot", `${rand(-220, 220)}deg`);
    piece.style.setProperty("--scale", String(rand(0.65, 1.15)));
    piece.style.setProperty("--c1", rand(0, 1) > 0.5 ? "#fff06a" : "#ff3b5c");
    piece.style.setProperty("--c2", rand(0, 1) > 0.5 ? "#57f2ff" : "#ffffff");

    frag.appendChild(piece);
    created.push(piece);
  }

  box.appendChild(frag);

  setTimeout(() => {
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, 780);
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
  if (PERF.lowFx) return;
  if (!body || !body.el || body.dead) return;

  const box = battleBox();
  if (!box || !canFx(PERF.minAfterimageGap || 180)) return;

  const img = $(".zg-battle-top-photo", body.el);
  if (!img) return;

  const ghost = document.createElement("i");

  fxAdd();

  ghost.className =
    `zg-spin-afterimage ${body.side === "player" ? "zg-player-afterimage" : "zg-enemy-afterimage"}`;

  ghost.style.left = `${body.x}px`;
  ghost.style.top = `${body.y}px`;
  ghost.style.width = `${body.r * 2}px`;
  ghost.style.height = `${body.r * 2}px`;
  ghost.style.setProperty("--rot", `${body.angle}deg`);
  ghost.style.setProperty("--scale", String(clamp(1 + body.spinRatio * 0.18, 1, 1.22)));
  ghost.style.setProperty("--c1", body.top.colorA || "#00eaff");
  ghost.style.setProperty("--c2", body.top.colorB || "#fff06a");

  box.appendChild(ghost);

  setTimeout(() => {
    try {
      ghost.remove();
    } catch (error) {}

    fxRemove();
  }, 260);
}


 function createMotionTrail(body) {
  if (!body || !body.el || body.dead) return;

  const box = battleBox();
  if (!box) return;

  /*
   * lowFx 時仍保留少量拖尾，不完全關閉。
   */
  const fxGap = PERF.lowFx ? 260 : 95;

  if (!canFx(fxGap)) return;

  const speed = Math.hypot(body.vx || 0, body.vy || 0);
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);

  /*
   * 低速不生成拖尾，避免畫面太亂。
   */
  if (speedRatio < 0.24) return;

  const angle = Math.atan2(body.vy || 0, body.vx || 0);

  const c1 = body.top?.colorA || (body.side === "player" ? "#00eaff" : "#ff3b5c");
  const c2 = body.top?.colorB || (body.side === "player" ? "#fff06a" : "#ffef7a");

  /*
   * 速度越快，拖尾越長、越粗、越亮。
   */
  const baseLength = clamp(52 + speedRatio * 118, 52, 170);
  const baseThickness = clamp(7 + speedRatio * 12, 7, 19);

  /*
   * 高速時生成多層拖尾。
   */
  const layerCount = PERF.lowFx
    ? 1
    : speedRatio > 0.78
      ? 3
      : speedRatio > 0.48
        ? 2
        : 1;

  const frag = document.createDocumentFragment();

  /*
   * 優化重點：
   * 直接保留這次呼叫自己建立的節點參考，
   * 清除時不再用 querySelectorAll 重新掃描 box，
   * 避免高頻拖尾生成時重複 DOM 查詢，
   * 也避免同時間多批拖尾互相誤刪對方節點。
   */
  const created = [];

  fxAdd();

  for (let i = 0; i < layerCount; i += 1) {
    const trail = document.createElement("i");

    const layerRatio = 1 - i * 0.18;
    const sideOffset = (i - (layerCount - 1) / 2) * 7;

    /*
     * 拖尾中心點往陀螺反方向移動。
     */
    const length = baseLength * layerRatio;
    const thickness = baseThickness * layerRatio;

    const offset = body.r * 0.42 + length * 0.22 + i * 8;

    const normalX = -Math.sin(angle);
    const normalY = Math.cos(angle);

    const x =
      body.x -
      Math.cos(angle) * offset +
      normalX * sideOffset;

    const y =
      body.y -
      Math.sin(angle) * offset +
      normalY * sideOffset;

    trail.className =
      `zg-motion-trail zg-motion-trail-boost ${
        body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
      } layer-${i + 1}`;

    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.width = `${length}px`;
    trail.style.height = `${thickness}px`;

    trail.style.setProperty("--rot", `${angle}rad`);
    trail.style.setProperty("--c1", c1);
    trail.style.setProperty("--c2", c2);
    trail.style.setProperty("--trail-speed", String(speedRatio));
    trail.style.setProperty("--trail-scale", String(clamp(0.85 + speedRatio * 0.45, 0.85, 1.3)));

    trail.style.opacity = String(
      clamp(0.2 + speedRatio * 0.42 - i * 0.08, 0.14, 0.62)
    );

    frag.appendChild(trail);
    created.push(trail);
  }

  /*
   * 高速時補一顆尾端能量粒子。
   */
  if (!PERF.lowFx && speedRatio > 0.58) {
    const orb = document.createElement("i");

    const orbOffset = body.r * 0.8 + baseLength * 0.74;

    const x = body.x - Math.cos(angle) * orbOffset;
    const y = body.y - Math.sin(angle) * orbOffset;

    orb.className =
      `zg-motion-trail-orb ${
        body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
      }`;

    orb.style.left = `${x}px`;
    orb.style.top = `${y}px`;
    orb.style.setProperty("--c1", c1);
    orb.style.setProperty("--c2", c2);
    orb.style.setProperty("--trail-speed", String(speedRatio));

    frag.appendChild(orb);
    created.push(orb);
  }

  box.appendChild(frag);

  setTimeout(() => {
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, PERF.lowFx ? 280 : 360);
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

  function createXtremeDashTrail(body) {
  if (!body || !body.el || body.dead) return;

  const box = battleBox();
  if (!box) return;

  const t = now();

  /*
   * lowFx 直接跳過爆衝特效，避免手機卡頓。
   */
  if (PERF.lowFx) return;

  const speed = Math.hypot(body.vx || 0, body.vy || 0);
  const speedRatio = clamp(speed / PHY.maxSpeed, 0, 1);

  /*
   * 爆衝門檻。
   */
  if (speedRatio < 0.72) return;

  const gap = speedRatio > 0.9 ? 54 : 82;

  if (t - PERF.lastXtremeDashAt < gap) return;

  PERF.lastXtremeDashAt = t;

  const angle = Math.atan2(body.vy || 0, body.vx || 0);

  const c1 =
    body.top?.colorA ||
    (body.side === "player" ? "#00eaff" : "#ff2b5f");

  const c2 =
    body.top?.colorB ||
    (body.side === "player" ? "#fff06a" : "#ffef7a");

  const length = clamp(115 + speedRatio * 165, 115, 280);
  const thickness = clamp(10 + speedRatio * 14, 10, 24);

  const normalX = -Math.sin(angle);
  const normalY = Math.cos(angle);

  const baseOffset = body.r * 0.56 + length * 0.24;

  const baseX = body.x - Math.cos(angle) * baseOffset;
  const baseY = body.y - Math.sin(angle) * baseOffset;

  const frag = document.createDocumentFragment();

  /*
   * 優化重點：
   * 這個函式一次會產生 trail + 多個 bolt + orb + flare 共四種節點。
   * 原本清除時要對四種 class 各自做一次 querySelectorAll，
   * 現在改為直接收集自己建立的節點參考，
   * 清除時只需要一個迴圈即可，不再重新掃描 DOM，
   * 也避免同時間多批爆衝拖尾互相誤刪對方節點。
   */
  const created = [];

  fxAdd();

  /*
   * 主爆衝噴射軌跡。
   */
  const trail = document.createElement("i");

  trail.className =
    `zg-xtreme-dash-trail ${
      body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
    }`;

  trail.style.left = `${baseX}px`;
  trail.style.top = `${baseY}px`;
  trail.style.width = `${length}px`;
  trail.style.height = `${thickness}px`;
  trail.style.setProperty("--rot", `${angle}rad`);
  trail.style.setProperty("--c1", c1);
  trail.style.setProperty("--c2", c2);
  trail.style.setProperty("--dash-speed", String(speedRatio));

  frag.appendChild(trail);
  created.push(trail);

  /*
   * 兩側閃電裂痕。
   */
  const boltCount = speedRatio > 0.88 ? 4 : 3;

  for (let i = 0; i < boltCount; i += 1) {
    const bolt = document.createElement("i");

    const side = i % 2 === 0 ? 1 : -1;
    const sideOffset = side * rand(10, 28);
    const alongOffset = rand(-length * 0.28, length * 0.34);

    const x =
      baseX -
      Math.cos(angle) * alongOffset +
      normalX * sideOffset;

    const y =
      baseY -
      Math.sin(angle) * alongOffset +
      normalY * sideOffset;

    const boltLen = rand(42, 92) * clamp(speedRatio, 0.75, 1.1);

    bolt.className =
      `zg-xtreme-dash-bolt ${
        body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
      }`;

    bolt.style.left = `${x}px`;
    bolt.style.top = `${y}px`;
    bolt.style.width = `${boltLen}px`;
    bolt.style.setProperty(
      "--rot",
      `${angle + rand(-0.38, 0.38)}rad`
    );
    bolt.style.setProperty("--c1", c1);
    bolt.style.setProperty("--c2", c2);
    bolt.style.setProperty("--dash-side", String(side));

    frag.appendChild(bolt);
    created.push(bolt);
  }

  /*
   * 尾端爆點。
   */
  const orb = document.createElement("i");

  const orbOffset = body.r * 0.9 + length * 0.78;

  const orbX = body.x - Math.cos(angle) * orbOffset;
  const orbY = body.y - Math.sin(angle) * orbOffset;

  orb.className =
    `zg-xtreme-dash-orb ${
      body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
    }`;

  orb.style.left = `${orbX}px`;
  orb.style.top = `${orbY}px`;
  orb.style.setProperty("--c1", c1);
  orb.style.setProperty("--c2", c2);

  frag.appendChild(orb);
  created.push(orb);

  /*
   * 陀螺身旁瞬間 flare。
   */
  const flare = document.createElement("i");

  flare.className =
    `zg-xtreme-dash-flare ${
      body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
    }`;

  flare.style.left = `${body.x}px`;
  flare.style.top = `${body.y}px`;
  flare.style.setProperty("--c1", c1);
  flare.style.setProperty("--c2", c2);

  frag.appendChild(flare);
  created.push(flare);

  box.appendChild(frag);

  /*
   * 極高速時偶爾產生爆衝震波。
   */
  if (speedRatio > 0.88) {
    createXtremeDashShock(body, speedRatio);
  }

  setTimeout(() => {
    for (let i = 0; i < created.length; i += 1) {
      try {
        created[i].remove();
      } catch (error) {}
    }

    fxRemove();
  }, 430);
}



function createXtremeDashShock(body, speedRatio = 1) {
  if (!body || body.dead || PERF.lowFx) return;

  const box = battleBox();
  if (!box) return;

  const t = now();

  if (t - PERF.lastXtremeDashShockAt < 520) return;

  PERF.lastXtremeDashShockAt = t;

  const shock = document.createElement("i");

  fxAdd();

  shock.className =
    `zg-xtreme-dash-shock ${
      body.side === "player" ? "zg-player-trail" : "zg-enemy-trail"
    }`;

  shock.style.left = `${body.x}px`;
  shock.style.top = `${body.y}px`;
  shock.style.setProperty("--c1", body.top?.colorA || "#00eaff");
  shock.style.setProperty("--c2", body.top?.colorB || "#fff06a");
  shock.style.setProperty("--shock-scale", String(clamp(0.8 + speedRatio * 0.7, 1, 1.55)));

  box.appendChild(shock);

  /*
   * 畫面輕微震動。
   */
  try {
    restartClass(box, "zg-impact-punch", 180);
  } catch (error) {}

  try {
  if (Sound && typeof Sound.rail === "function") {
    Sound.rail(0.8 + speedRatio * 0.6);
  }
} catch (error) {}


  setTimeout(() => {
    try {
      shock.remove();
    } catch (error) {}

    fxRemove();
  }, 420);
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
updateBattleLiveStats();
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

  /*
   * 隱藏陀螺 / 重擊 Hit Freeze
   * 暫停物理更新，但保留目前畫面。
   */
  if (
    typeof applyHitFreezeFrame === "function" &&
    applyHitFreezeFrame()
  ) {
    syncBody(b.player);
    syncBody(b.enemy);
    state.raf = requestAnimationFrame(battleLoop);
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

const playerSpeed = Math.hypot(b.player.vx || 0, b.player.vy || 0);
const enemySpeed = Math.hypot(b.enemy.vx || 0, b.enemy.vy || 0);

const maxSpeedRatio = clamp(
  Math.max(playerSpeed, enemySpeed) / PHY.maxSpeed,
  0,
  1
);

const trailGap = PERF.lowFx
  ? 260
  : maxSpeedRatio > 0.78
    ? 62
    : maxSpeedRatio > 0.5
      ? 78
      : 110;

if (t - PERF.lastMotionTrailAt > trailGap) {
  PERF.lastMotionTrailAt = t;
  createMotionTrail(b.player);
  createMotionTrail(b.enemy);
}

/*
 * Xtreme Dash 爆衝拖尾：
 * 和一般拖尾分開判斷。
 */
createXtremeDashTrail(b.player);
createXtremeDashTrail(b.enemy);



  if (t - PERF.lastScratchAt > 250) {
    PERF.lastScratchAt = t;
    createScratchTrail(b.player);
    createScratchTrail(b.enemy);
  }

  /*
   * 高速時才產生殘影，避免 DOM 太多。
   */
  if (t - PERF.lastAfterimageAt > 190) {
    PERF.lastAfterimageAt = t;

    const ps = Math.hypot(b.player.vx || 0, b.player.vy || 0);
    const es = Math.hypot(b.enemy.vx || 0, b.enemy.vy || 0);

    if (ps > PHY.maxSpeed * 0.42 || b.player.spinRatio > 0.72) {
      createSpinAfterimage(b.player);
    }

    if (es > PHY.maxSpeed * 0.42 || b.enemy.spinRatio > 0.72) {
      createSpinAfterimage(b.enemy);
    }
  }
}
updateHpBars();
updateBattleLiveStats();
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

  const t = now();
  const elapsed = t - b.startedAt;
  /*
 * 防止戰鬥中途誤跳結果頁：
 * 開戰前 3.8 秒，除非已經真的 Burst / Over / Xtreme，
 * 否則不允許進結果頁。
 */
if (elapsed < 3800) {
  if (
    !b.player?.burst &&
    !b.enemy?.burst &&
    !b.player?.out &&
    !b.enemy?.out
  ) {
    return false;
  }
}


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

  const playerSpinRatio = clamp(b.player.spinRatio || 0, 0, 1);
  const enemySpinRatio = clamp(b.enemy.spinRatio || 0, 0, 1);

  /*
   * =========================================================
   * 最短戰鬥保護
   * =========================================================
   *
   * 出場 / 爆裂是特殊 Finish，可以在各自門檻後結束。
   * 普通能量歸零 / Spin Finish 不要太早結束。
   */
  const minAnyFinishMs =
    b.minAnyFinishAt
      ? Math.max(0, b.minAnyFinishAt - b.startedAt)
      : 3800;

  const hasEffectiveCollision =
  !!state.firstCollision &&
  !!state.lastEffectiveHitAt &&
  !!b.player.lastHitAt &&
  !!b.enemy.lastHitAt;

const canNormalFinish =
  elapsed >= minAnyFinishMs &&
  hasEffectiveCollision;

const hasEnergyZero =
  playerEnergy <= 0 ||
  playerEnergyRatio <= 0 ||
  enemyEnergy <= 0 ||
  enemyEnergyRatio <= 0;

const canEnergyFinish =
  canNormalFinish ||
  (
    elapsed >= 1800 &&
    hasEffectiveCollision &&
    hasEnergyZero
  );




  const pSpecialDead =
    b.player.out ||
    b.player.burst;

  const eSpecialDead =
    b.enemy.out ||
    b.enemy.burst;

  const hasEnergyZero =
  playerEnergy <= 0 ||
  playerEnergyRatio <= 0 ||
  enemyEnergy <= 0 ||
  enemyEnergyRatio <= 0;

const canEnergyFinish =
  canNormalFinish ||
  (
    elapsed >= 1800 &&
    hasEffectiveCollision &&
    hasEnergyZero
  );

const pEnergyDead =
  canEnergyFinish &&
  (
    b.player.dead ||
    playerEnergy <= 0 ||
    playerEnergyRatio <= 0
  );

const eEnergyDead =
  canEnergyFinish &&
  (
    b.enemy.dead ||
    enemyEnergy <= 0 ||
    enemyEnergyRatio <= 0
  );


  const pDead = pSpecialDead || pEnergyDead;
  const eDead = eSpecialDead || eEnergyDead;

  }

  if (!pDead && !eDead) {
    /*
     * 超長戰鬥保底：
     * 如果雙方都轉很低、能量也很低，就用 Spin Finish 判定。
     */
    const maxSoftBattleMs = 36000;

    const bothAlmostStopped =
      elapsed >= 14000 &&
      playerSpinRatio < 0.08 &&
      enemySpinRatio < 0.08;

    const battleTooLong =
      elapsed >= maxSoftBattleMs;

    if (!bothAlmostStopped && !battleTooLong) {
      return false;
    }

    /*
     * 進入 Spin Finish 判定。
     * 誰的綜合殘存狀態高誰贏。
     */
    const playerScore =
      playerEnergyRatio * 0.48 +
      playerSpinRatio * 0.52 +
      (b.player.stamina || 0) / 1000;

    const enemyScore =
      enemyEnergyRatio * 0.48 +
      enemySpinRatio * 0.52 +
      (b.enemy.stamina || 0) / 1000;

    if (Math.abs(playerScore - enemyScore) < 0.035) {
      b.player.dead = true;
      b.enemy.dead = true;
    } else if (playerScore > enemyScore) {
      b.enemy.dead = true;
      b.enemy.energy = 0;
      b.enemy.energyRatio = 0;
      b.enemy.hp = 0;
    } else {
      b.player.dead = true;
      b.player.energy = 0;
      b.player.energyRatio = 0;
      b.player.hp = 0;
    }

    return checkFinish();
  }

  let result = "draw";
  let finish = "spin";

  /*
   * =========================================================
   * Finish Type Priority / 勝利方式優先順序
   * =========================================================
   *
   * 1. Xtreme Finish：
   *    高速撞入角落極限加速區後彈射出場。
   *
   * 2. Over Finish：
   *    被撞出普通戰鬥盤外。
   *
   * 3. Burst Finish：
   *    被撞擊到解體，零件散開。
   *
   * 4. Spin Finish：
   *    沒有出場或爆裂時，比誰撐到最後。
   */
  if (pDead && eDead) {
    result = "draw";

    if (b.player.outKind === "xtreme" || b.enemy.outKind === "xtreme") {
      finish = "xtreme";
    } else if (b.player.out || b.enemy.out) {
      finish = "over";
    } else if (b.player.burst || b.enemy.burst) {
      finish = "burst";
    } else {
      finish = "spin";
    }
  } else if (eDead) {
    result = "win";

    if (b.enemy.outKind === "xtreme") {
      finish = "xtreme";
    } else if (b.enemy.outKind === "over" || b.enemy.out) {
      finish = "over";
    } else if (b.enemy.burst) {
      finish = "burst";
    } else {
      finish = "spin";
    }
  } else {
    result = "lose";

    if (b.player.outKind === "xtreme") {
      finish = "xtreme";
    } else if (b.player.outKind === "over" || b.player.out) {
      finish = "over";
    } else if (b.player.burst) {
      finish = "burst";
    } else {
      finish = "spin";
    }
  }

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
  b.finish = finish;
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
    finish,
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

    playerTopTypeLabel: b.player.typeLabel || getTopTypeLabel(b.player.top.type),
    enemyTopTypeLabel: b.enemy.typeLabel || getTopTypeLabel(b.enemy.top.type),

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

  try {
    preloadResultVideo(resultPayload);
  } catch (error) {}

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

  let zgPreloadedResultVideo = null;
let zgPreloadedResultVideoUrl = "";

function preloadResultVideo(resultPayload = {}) {
  const url = getResultVideoUrl(resultPayload);

  if (!url) return null;

  if (
    zgPreloadedResultVideo &&
    zgPreloadedResultVideoUrl === url
  ) {
    return zgPreloadedResultVideo;
  }

  try {
    const video = document.createElement("video");

    video.src = url;
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");

    video.style.position = "fixed";
    video.style.left = "-9999px";
    video.style.top = "-9999px";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";

    document.body.appendChild(video);

    try {
      video.load();
    } catch (error) {}

    zgPreloadedResultVideo = video;
    zgPreloadedResultVideoUrl = url;

    return video;
  } catch (error) {
    return null;
  }
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

  hideBattleToVideoTransition();
  finishBattle(resultPayload);
};


  /*
   * 隱藏其他頁面。
   */
  [
    "#screen-start",
    "#screen-home",
    "#screen-select",
    "#screen-battle",
    "#screen-result"
  ].forEach((selector) => {
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
    set(skipBtn, "position", "fixed");
    set(skipBtn, "right", "14px");
    set(skipBtn, "top", "calc(env(safe-area-inset-top, 0px) + 14px)");
    set(skipBtn, "z-index", "2147483647");
    set(skipBtn, "pointer-events", "auto");
    set(skipBtn, "touch-action", "manipulation");
    set(skipBtn, "height", "36px");
    set(skipBtn, "padding", "0 14px");
    set(skipBtn, "border", "0");
    set(skipBtn, "border-radius", "999px");
    set(skipBtn, "background", "rgba(0,0,0,.48)");
    set(skipBtn, "color", "#fff");
    set(skipBtn, "font-size", "13px");
    set(skipBtn, "font-weight", "900");
    set(skipBtn, "pointer-events", "auto");

    skipBtn.onclick = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  goResult("skip");
};

skipBtn.addEventListener(
  "click",
  function(event) {
    event.preventDefault();
    event.stopPropagation();
    goResult("skip");
  },
  true
);

skipBtn.addEventListener(
  "touchend",
  function(event) {
    event.preventDefault();
    event.stopPropagation();
    goResult("skip");
  },
  {
    passive: false,
    capture: true
  }
);

skipBtn.addEventListener(
  "pointerup",
  function(event) {
    event.preventDefault();
    event.stopPropagation();
    goResult("skip");
  },
  true
);

  }

  /*
   * 目前維持靜音，確保 LINE / iOS WebView 自動播放成功率。
   */
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  video.src = videoUrl;

  /*
   * 如果前面已預載同一支影片，瀏覽器通常會吃快取。
   */
  try {
    if (
      zgPreloadedResultVideo &&
      zgPreloadedResultVideoUrl === videoUrl
    ) {
      video.preload = "auto";
    }
  } catch (error) {}

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

  /*
   * ✅ 修改重點 1：
   * 「載入階段」保底計時器。
   * 如果影片一直卡在緩衝、連 canplay 都觸發不了，
   * 15 秒後還是要強制跳轉，避免玩家卡在黑畫面出不去。
   */
  fallbackTimer = window.setTimeout(() => {
    goResult("timeout_loading");
  }, 15000);

  video.oncanplay = () => {
    /*
     * ✅ 修改重點 2：
     * 影片真正可以播放時，先清掉「載入階段」計時器，
     * 因為已經不需要再等它了。
     */
    window.clearTimeout(fallbackTimer);

    /*
     * ✅ 修改重點 3：
     * 從「真正開始播放」這一刻，重新計時「播放階段」保底時間。
     * 這個秒數請依實際影片長度調整：
     * 建議 = 影片實際秒數 + 5~8 秒緩衝。
     */
    fallbackTimer = window.setTimeout(() => {
      goResult("timeout_playing");
    }, 20000);

    const playPromise = video.play();

    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          setTimeout(() => {
            hideBattleToVideoTransition();
          }, 180);
        })
        .catch((error) => {
          console.warn("[ZELO GAME] result video autoplay failed:", error);

          hideBattleToVideoTransition();
          goResult("autoplay_failed");
        });

      return;
    }

    setTimeout(() => {
      hideBattleToVideoTransition();
    }, 180);
  };

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


  function ensureBattleToVideoTransitionDom() {
  let el = document.getElementById("zg-battle-video-transition");

  if (el) return el;

  el = document.createElement("div");
  el.id = "zg-battle-video-transition";
  el.className = "zg-battle-video-transition";
  el.setAttribute("aria-hidden", "true");

  el.innerHTML = `
    <div class="zg-battle-video-transition-core"></div>
    <div class="zg-battle-video-transition-text">FINISH</div>
  `;

  document.body.appendChild(el);

  return el;
}

function showBattleToVideoTransition(text = "FINISH") {
  const el = ensureBattleToVideoTransitionDom();
  const label = $(".zg-battle-video-transition-text", el);

  if (label) {
    label.textContent = text;
  }

  el.classList.remove("is-active", "is-fadeout");
  void el.offsetWidth;
  el.classList.add("is-active");

  return el;
}

function hideBattleToVideoTransition() {
  const el = document.getElementById("zg-battle-video-transition");

  if (!el) return;

  el.classList.remove("is-active");
  el.classList.add("is-fadeout");

  setTimeout(() => {
    el.classList.remove("is-fadeout");
  }, 420);
}


let __zgFinishTransitionTimer = null;
let __zgFinishVideoTimer = null;

  

function playFinishSequence(resultPayload) {
  if (window.__ZELO_BATTLE_FINISH_SEQUENCE_STARTED__) {
    return;
  }

  window.__ZELO_BATTLE_FINISH_SEQUENCE_STARTED__ = true;

  const box = battleBox();

  Sound.stopHum();


  if (box) {
    box.classList.remove("zg-center-duel");

        /*
     * =========================================================
     * Finish Animation Class / 勝利方式接續動畫
     * =========================================================
     *
     * xtreme：
     * 極限勝利。高速撞入角落極限加速區後彈射出場。
     * 使用最強震動、爆衝與零件噴散演出。
     *
     * over：
     * 擊飛勝利。對手被撞出普通戰鬥盤。
     * 使用出場衝擊與邊界爆光演出。
     *
     * burst：
     * 爆裂勝利。對手被撞到解體。
     * 使用零件散開與金屬火花演出。
     *
     * spin：
     * 迴轉勝利。沒有出場或爆裂，
     * 比拼誰轉到最後。
     * 使用轉速衰退與勝者留場演出。
     */
    if (resultPayload.finish === "xtreme") {
      box.classList.add("zg-xtreme-finish");
    } else if (resultPayload.finish === "over") {
      box.classList.add("zg-over-finish");
    } else if (resultPayload.finish === "burst") {
      box.classList.add("zg-burst-finish");
    } else {
      box.classList.add("zg-spin-finish");
    }


restartClass(box, "zg-impact-punch", 650);
restartClass(box, "zg-collision-heavy", 650);

const cx = box.clientWidth * 0.5;
const cy = box.clientHeight * 0.5;

createImpactRing(cx, cy, 2.15);
createImpactStreak(cx, cy, 1.7);
createMetalSparks(cx, cy, 1.8);
createBurstPieces(cx, cy, 1.75);
createStarDust(56);

  }

    const finishTextMap = {
    xtreme: "極限勝利！陀螺被高速撞入極限加速區並彈射出場！",
    over: "擊飛勝利！陀螺被撞出戰鬥盤外！",
    burst: "爆裂勝利！陀螺受到猛烈攻擊後解體！",
    spin: "迴轉勝利！比拼轉速後撐到最後！"
  };

  const finishText =
    finishTextMap[resultPayload.finish] ||
    "戰鬥結束！";

  if (resultPayload.result === "win") {
    setCommentary(`勝利！${finishText}`);
    Sound.metal(1.6, 0.8);
  } else if (resultPayload.result === "draw") {
    setCommentary(`平手！${finishText}`);
    Sound.metal(1.1, 0.75);
  } else {
    setCommentary(`敗北！${finishText}`);
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

/*
 * 結束特效後半段先蓋轉場，
 * 避免戰鬥畫面與影片之間硬切。
 */
if (__zgFinishTransitionTimer) {
  clearTimeout(__zgFinishTransitionTimer);
  __zgFinishTransitionTimer = null;
}

if (__zgFinishVideoTimer) {
  clearTimeout(__zgFinishVideoTimer);
  __zgFinishVideoTimer = null;
}

__zgFinishTransitionTimer = setTimeout(() => {
  /*
   * 防止舊戰鬥的 timeout 在新戰鬥中觸發
   */
  if (!state.finishing || !state.pendingResult) return;

  const label =
    resultPayload.result === "win"
      ? "WIN"
      : resultPayload.result === "lose"
        ? "LOSE"
        : "DRAW";

  showBattleToVideoTransition(label);
}, 780);

__zgFinishVideoTimer = setTimeout(() => {
  /*
   * 防止舊戰鬥的 timeout 在新戰鬥中觸發
   */
  if (!state.finishing || !state.pendingResult) return;

  playResultVideoThenFinish(resultPayload);
}, 1180);

}


function finishBattle(resultPayload) {
  if (state.screen !== "battle" && state.screen !== "resultVideo") {
  console.warn("[ZELO BATTLE] finishBattle ignored, wrong screen:", state.screen);
  return;
}
  /*
   * checkFinish() 會先把 state.finishing 設成 true。
   * 所以這裡不能用 state.finishing 判斷重複，
   * 否則結果影片結束或按略過後會永遠被擋掉。
   */
  if (window.__ZELO_BATTLE_FINISH_PROCESSED__) {
    console.warn("[ZELO BATTLE] finishBattle duplicate ignored");
    return;
  }

  window.__ZELO_BATTLE_FINISH_PROCESSED__ = true;
  window.__ZELO_BATTLE_FINISHING__ = true;

  const result = resultPayload || state.pendingResult || state.lastBattleResult;

  if (!result) {
    console.warn("[ZELO BATTLE] finishBattle missing result");

    window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
    window.__ZELO_BATTLE_FINISHING__ = false;

    return;
  }

  state.running = false;
  state.paused = false;
  state.finishing = true;
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

  try {
    removeLaunchCountdownDom();
  } catch (error) {}

  try {
    Sound.stopHum();
  } catch (error) {}

  if (state.battle) {
    state.battle.ended = true;
  }

  state.battle = null;

  try {
    addDailyPlay();
  } catch (error) {
    console.warn("[ZELO BATTLE] addDailyPlay failed", error);
  }

  const oldScore = getMyScore();

  let delta = 0;

  if (result.result === "win") {
    delta = 18 + Math.round((result.points || 0) / 15);
  } else if (result.result === "lose") {
    const performanceOffset = Math.min(
      6,
      Math.round((result.points || 0) / 60)
    );

    delta = -12 + performanceOffset;
  } else {
    delta = Math.round((result.points || 0) / 80);
  }

  const newScore = Math.max(0, oldScore + delta);

  setMyScore(newScore);

  const rewardPointsGain = calculateRewardPointsGain(result);
  const rewardPointsTotal = addRewardPoints(rewardPointsGain);
  const rewardProgress = getRewardProgressInfo(rewardPointsTotal);

  result.rewardPointsGain = rewardPointsGain;
  result.rewardPointsTotal = rewardPointsTotal;
  result.zeloPointsGain = rewardPointsGain;
  result.zeloPointsTotal = rewardPointsTotal;

  result.nextRewardId = rewardProgress.nextTier?.id || "";
  result.nextRewardName = rewardProgress.nextTier?.name || "";
  result.nextRewardPoints = rewardProgress.nextTier?.points || 0;
  result.nextRewardRemaining = rewardProgress.remaining || 0;
  result.nextRewardProgressPct = rewardProgress.progressPct || 0;
  result.nextRewardMessage = rewardProgress.message || "";

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

  try {
    hideBattleToVideoTransition();
  } catch (error) {}

  try {
    exitBattlePerformanceMode();
  } catch (error) {}

  /*
   * 關閉結果影片頁，避免蓋在結果頁上方。
   */
  try {
    const videoScreen = document.getElementById("screen-result-video");

    if (videoScreen) {
      videoScreen.classList.remove("active", "is-active");
      videoScreen.setAttribute("aria-hidden", "true");
      videoScreen.hidden = true;

      videoScreen.style.setProperty("display", "none", "important");
      videoScreen.style.setProperty("visibility", "hidden", "important");
      videoScreen.style.setProperty("opacity", "0", "important");
      videoScreen.style.setProperty("pointer-events", "none", "important");
    }

    const video = document.getElementById("zg-result-video");

    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  } catch (error) {}

  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;

  showScreen("result");

  try {
    renderResult(result);
  } catch (error) {
    console.warn("[ZELO RESULT] renderResult failed", error);
  }
}




  


function playBattleEndVideoThenResult() {
  if (window.__ZELO_RESULT_VIDEO_PLAYING__) {
    console.warn("[ZELO VIDEO] duplicate ignored");
    return;
  }

  window.__ZELO_RESULT_VIDEO_PLAYING__ = true;

  const result = state.lastBattleResult;

  function forceGoResult() {
    window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
    window.__ZELO_SKIP_RESULT_VIDEO__ = null;

    try {
      exitBattlePerformanceMode();
    } catch (error) {}

    showScreen("result");

    try {
      renderResult(result || state.lastBattleResult);
    } catch (error) {
      console.warn("[ZELO RESULT] renderResult failed", error);
    }
  }

  const videoScreen =
    document.getElementById("screen-result-video") ||
    document.querySelector(".screen-result-video") ||
    document.querySelector(".zg-result-video-screen");

  if (!videoScreen) {
    forceGoResult();
    return;
  }

  try {
    showScreen("resultVideo");
  } catch (error) {
    forceGoResult();
    return;
  }

  const video =
    document.getElementById("zg-result-video") ||
    videoScreen.querySelector("video") ||
    videoScreen.querySelector(".zg-result-video");

  const skipButton =
    document.getElementById("zg-result-video-skip") ||
    videoScreen.querySelector("[data-action='skip-result-video']") ||
    videoScreen.querySelector(".zg-result-video-skip") ||
    videoScreen.querySelector("button");

  let done = false;
  let maxTimer = null;
  let fallbackTimer = null;

  function cleanup() {
    if (maxTimer) {
      clearTimeout(maxTimer);
      maxTimer = null;
    }

    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    if (video) {
      try {
        video.removeEventListener("ended", goResult);
        video.removeEventListener("error", goResult);
        video.removeEventListener("stalled", goResult);
        video.removeEventListener("abort", goResult);
        video.pause();
      } catch (error) {}
    }

    if (skipButton) {
      try {
        skipButton.removeEventListener("click", goResult);
        skipButton.removeEventListener("pointerup", goResult);
        skipButton.removeEventListener("touchend", goResult);
      } catch (error) {}
    }
  }

  function goResult(event) {
    if (event) {
      try {
        event.preventDefault();
        event.stopPropagation();
      } catch (error) {}
    }

    if (done) return;
    done = true;

    cleanup();
    forceGoResult();
  }

  window.__ZELO_SKIP_RESULT_VIDEO__ = goResult;

  if (skipButton) {
    skipButton.disabled = false;
    skipButton.style.pointerEvents = "auto";
    skipButton.style.position = "fixed";
    skipButton.style.top = "12px";
    skipButton.style.right = "12px";
    skipButton.style.zIndex = "2147483647";
    skipButton.style.touchAction = "manipulation";

    skipButton.onclick = goResult;
    skipButton.addEventListener("click", goResult);
    skipButton.addEventListener("pointerup", goResult);
    skipButton.addEventListener("touchend", goResult, { passive: false });
  }

  const overlays = videoScreen.querySelectorAll(
    ".zg-result-video-overlay, .result-video-overlay, video"
  );

  overlays.forEach(function(el) {
    el.style.pointerEvents = "none";
  });

  if (!video) {
    fallbackTimer = setTimeout(goResult, 1000);
    return;
  }

  try {
    video.loop = false;
    video.removeAttribute("loop");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.pointerEvents = "none";

    video.pause();

    try {
      video.currentTime = 0;
    } catch (error) {}

    video.addEventListener("ended", goResult);
    video.addEventListener("error", goResult);
    video.addEventListener("stalled", goResult);
    video.addEventListener("abort", goResult);

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function() {
        fallbackTimer = setTimeout(goResult, 1000);
      });
    }

    maxTimer = setTimeout(goResult, 8000);
  } catch (error) {
    fallbackTimer = setTimeout(goResult, 1000);
  }
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

          <p class="zg-result-message zg-result-current-score" id="zg-result-message">
            目前積分 0
          </p>

          <div class="zg-result-score-delta" id="zg-result-score-delta">
            積分變化：0
          </div>
        </div>
      </section>

      <section
        class="zg-points-card"
        id="zg-points-card"
        aria-label="本場獎勵點數"
      >
        <div class="zg-points-card-head">
          <div>
            <span class="zg-points-kicker">ZELO POINTS</span>
            <strong>本場獎勵</strong>
          </div>

          <div class="zg-points-gain" id="zg-points-gain">
            +0
          </div>
        </div>

        <div class="zg-points-total">
          目前 ZELO Points：
          <strong id="zg-points-total">0</strong>
        </div>
      </section>

      <section
        class="zg-next-reward-card"
        id="zg-next-reward-card"
        aria-label="下一個獎勵"
      >
        <div class="zg-next-reward-head">
          <span>下一個獎勵</span>
          <strong id="zg-next-reward-name">新品 95 折券</strong>
        </div>

        <div class="zg-next-reward-message" id="zg-next-reward-message">
          再累積 50 點，解鎖「新品 95 折券」
        </div>

        <div class="zg-next-reward-bar">
          <span id="zg-next-reward-fill"></span>
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

          <section
        class="zg-invite-mission-card"
        id="zg-invite-mission-card"
        aria-label="邀請獎勵進度"
      >
        <div class="zg-invite-mission-head">
          <div class="zg-invite-mission-title">
            邀請獎勵進度
          </div>

          <div
            class="zg-invite-mission-status is-locked"
            id="zg-invite-mission-status"
          >
            尚未解鎖
          </div>
        </div>

        <div
          class="zg-invite-mission-progress"
          id="zg-invite-mission-progress"
          data-count="0"
        >
          <div class="zg-invite-mission-line">
            <span class="zg-invite-mission-line-fill" style="width:0%"></span>
          </div>

          <div
            class="zg-invite-mission-node is-locked"
            data-reward="1"
            data-target="1"
            data-tier="bronze"
          >
            <span class="zg-invite-mission-medal">🎟️</span>
            <strong>1人</strong>
            <small>ZELO產品95折</small>
          </div>

          <div
            class="zg-invite-mission-node is-locked"
            data-reward="3"
            data-target="3"
            data-tier="silver"
          >
            <span class="zg-invite-mission-medal">🎁</span>
            <strong>3人</strong>
            <small>KIDEVO把套抽獎</small>
          </div>

          <div
            class="zg-invite-mission-node is-locked"
            data-reward="5"
            data-target="5"
            data-tier="gold"
          >
            <span class="zg-invite-mission-medal">🧦</span>
            <strong>5人</strong>
            <small>ZELO襪子抽獎</small>
          </div>
        </div>

        <div
          class="zg-invite-mission-current-count"
          id="zg-invite-mission-current-count"
        >
          目前已邀請 <strong>0</strong> 人
        </div>
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
   * 目前使用的陀螺 ID，
   * 用來讓後端驗證隱藏陀螺持有權（防止未解鎖就用隱藏陀螺對戰）。
   */
  const topId =
    result.playerTopId ||
    result.topId ||
    result.selectedTopId ||
    (state && state.selectedTop ? state.selectedTop.id : "") ||
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

    /*
     * topId 相關欄位，對應後端 payload.topId 判斷邏輯
     */
    topId,
    selectedTopId: topId,
    playerTopId: topId,

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
    source: "post_recordBattleResult",
    ts: Date.now()
  };

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

    return Promise.resolve(skipped);
  }

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

      return Promise.resolve(skipped);
    }

    sessionStorage.setItem(syncKey, "1");
  } catch (error) {}

  /*
   * 關鍵修正：
   * 後端 recordBattleResult 已強制要求 POST，
   * 改用 postToZeloBackend()（fetch POST），
   * 不再使用 jsonpApi()（本質上是 GET）。
   */
  return postToZeloBackend(payload)
    .then(function(postResult) {
      const gasData = postResult && postResult.data ? postResult.data : postResult;
      const ok = !!(postResult && postResult.ok);

      const finalResponse = {
        ok: ok,
        source: "post_recordBattleResult",
        payload: payload,
        data: gasData || null,
        raw: postResult || null
      };

      window.ZELO_LAST_RECORD_BATTLE_RESULT = {
        status: ok ? "success" : "rejected",
        payload: payload,
        response: finalResponse,
        data: gasData || null,
        error: null,
        source: "post_recordBattleResult",
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
        score: gasData && gasData.score !== undefined ? gasData.score : payload.score || 0,
        totalScore: gasData && gasData.totalScore !== undefined ? gasData.totalScore : payload.totalScore || 0,
        delta: gasData && gasData.delta !== undefined ? gasData.delta : payload.delta || 0,
        source: "post_recordBattleResult"
      });

      return finalResponse;
    })
    .catch(function(error) {
      const message = String(error && error.message ? error.message : error || "recordBattleResult POST failed");

      window.ZELO_LAST_RECORD_BATTLE_RESULT = {
        status: "failed",
        payload: payload,
        response: null,
        data: null,
        error: message,
        source: "post_recordBattleResult",
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
        source: "post_recordBattleResult"
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
    /*
     * 修正重點：
     * 只送後端 getFriendRankDataByQuery_ 實際會讀取的欄位，
     * 移除 name / avatar / avatarUrl / score / bestScore /
     * inviterReferralCode / inviterCode / version /
     * pageUrl / userAgent，避免 JSONP 網址過長被截斷。
     */
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

      pictureUrl:
        result.pictureUrl ||
        profilePayload.pictureUrl ||
        "",

      totalScore:
        Number(
          result.totalScore ??
          result.score ??
          result.bestScore ??
          getMyScore()
        ) || 0
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

    const meRow =
      friendRank.find((item) => item.isMe || item.me) ||
      friendRank.find((item) => {
        return (
          userId &&
          (
            item.userId === userId ||
            item.lineUserId === userId
          )
        );
      });

    const serverScore =
      meRow
        ? Number(
            meRow.totalScore ??
            meRow.score ??
            meRow.bestScore ??
            0
          ) || 0
        : 0;

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


async function preloadFriendRank(source = "unknown") {
  if (state.friendRankPreloading) {
    return state.friendRankPreloadResult;
  }

  const nowTs = Date.now();

  /*
   * 30 秒內不要重複預載。
   */
  if (
    state.friendRankPreloaded &&
    state.friendRankPreloadResult &&
    nowTs - state.friendRankPreloadAt < 30000
  ) {
    return state.friendRankPreloadResult;
  }

  state.friendRankPreloading = true;

  try {
    const profilePayload = getProfilePayload({
      source: `preload_friend_rank_${source}`
    });

    const baseResult = {
      userId: profilePayload.userId || "",
      lineUserId: profilePayload.lineUserId || profilePayload.userId || "",

      referralCode:
        profilePayload.referralCode ||
        profilePayload.myReferralCode ||
        getMyReferralCode(),

      myReferralCode:
        profilePayload.myReferralCode ||
        profilePayload.referralCode ||
        getMyReferralCode(),

      ownerReferralCode:
        profilePayload.ownerReferralCode ||
        profilePayload.referralCode ||
        getMyReferralCode(),

      displayName:
        profilePayload.displayName ||
        getPlayerName() ||
        "你",

      playerName:
        profilePayload.playerName ||
        profilePayload.displayName ||
        getPlayerName() ||
        "你",

      pictureUrl:
        profilePayload.pictureUrl ||
        "",

      score: getMyScore(),
      bestScore: getMyScore(),
      totalScore: getMyScore(),

      lineInviteFriendCount:
        Number(
          profilePayload.lineInviteFriendCount ??
          getLineInviteFriendCount() ??
          0
        ) || 0
    };

    /*
     * 先同步邀請數，再抓排行榜。
     */
    let mergedResult = baseResult;

    try {
      const inviteStatus = await loadInviteStatusFromServer(baseResult);
      mergedResult = inviteStatus.result || mergedResult;
    } catch (error) {}

    const rankData = await loadFriendRankFromServer(mergedResult);
    const finalResult = rankData.result || mergedResult;

    /*
     * 關鍵修正：
     * 預載排行榜後，如果排行榜有自己這列，就用伺服器分數校正本機積分。
     * 避免結果頁用 localStorage 舊分數，排行榜用 GAS 分數，導致數字對不起來。
     */
    const preloadRows =
      finalResult.friendRank ||
      finalResult.rows ||
      finalResult.friends ||
      finalResult.rank ||
      [];

    const myUserId =
      finalResult.userId ||
      finalResult.lineUserId ||
      profilePayload.userId ||
      profilePayload.lineUserId ||
      "";

    const meRow =
      Array.isArray(preloadRows)
        ? (
            preloadRows.find((item) => item && (item.isMe || item.me)) ||
            preloadRows.find((item) => {
              if (!item || !myUserId) return false;

              return (
                String(item.userId || "") === String(myUserId) ||
                String(item.lineUserId || "") === String(myUserId)
              );
            })
          )
        : null;

    const serverScore =
      meRow
        ? Number(
            meRow.totalScore ??
            meRow.score ??
            meRow.bestScore ??
            0
          ) || 0
        : Number(
            finalResult.totalScore ??
            finalResult.score ??
            finalResult.bestScore ??
            0
          ) || 0;

    if (serverScore > 0) {
      setMyScore(serverScore);

      finalResult.score = serverScore;
      finalResult.bestScore = serverScore;
      finalResult.totalScore = serverScore;
    }

    state.friendRankPreloaded = true;
    state.friendRankPreloadResult = finalResult;
    state.friendRankPreloadAt = Date.now();

    window.ZELO_PRELOADED_FRIEND_RANK = finalResult;

    track("friend_rank_preloaded", {
      source,
      userId: finalResult.userId || "",
      referralCode: finalResult.referralCode || "",
      score: Number(finalResult.score || 0),
      count: Array.isArray(finalResult.friendRank)
        ? finalResult.friendRank.length
        : 0
    });

    return finalResult;
  } catch (error) {
    console.warn("[ZELO GAME] preloadFriendRank failed:", error);

    track("friend_rank_preload_failed", {
      source,
      message: String(error && error.message ? error.message : error)
    });

    return state.friendRankPreloadResult || null;
  } finally {
    state.friendRankPreloading = false;
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

  function updateResultScoreSummary(result = {}) {
  const resultMessage = $("#zg-result-message");
  const resultScoreDelta = $("#zg-result-score-delta");

  if (!resultMessage && !resultScoreDelta) return;

  const points =
    Number(
      result.points ??
      result.battlePoints ??
      0
    ) || 0;

  const oldScore =
    Number(
      result.oldScore ??
      0
    ) || 0;

  const newScore =
    Number(
      result.score ??
      result.totalScore ??
      result.bestScore ??
      oldScore
    ) || 0;

  const delta =
    Number(
      result.delta ??
      (newScore - oldScore)
    ) || 0;

  if (resultMessage) {
    resultMessage.textContent = `目前積分 ${newScore}`;
    resultMessage.classList.add("zg-result-current-score");
  }

  if (resultScoreDelta) {
    resultScoreDelta.textContent =
      delta > 0
        ? `積分增加 +${delta}`
        : delta < 0
          ? `積分扣除 ${Math.abs(delta)}`
          : "積分無變化";

    resultScoreDelta.dataset.delta = String(delta);
    resultScoreDelta.classList.toggle("is-plus", delta > 0);
    resultScoreDelta.classList.toggle("is-minus", delta < 0);
    resultScoreDelta.classList.toggle("is-zero", delta === 0);
  }
}

 function updateInviteMissionProgress(result = {}) {
  const card = document.querySelector("#zg-invite-mission-card");
  const progress = document.querySelector("#zg-invite-mission-progress");
  const status = document.querySelector("#zg-invite-mission-status");
  const fill = document.querySelector(".zg-invite-mission-line-fill");
  const currentCount = document.querySelector("#zg-invite-mission-current-count");

  if (!card || !progress) return;

  const count = Number(
    result.lineInviteFriendCount ??
    result.referralCount ??
    result.successCount ??
    result.count ??
    state?.lineInviteFriendCount ??
    (
      typeof getLineInviteFriendCount === "function"
        ? getLineInviteFriendCount()
        : 0
    ) ??
    0
  ) || 0;

  const safeCount = Math.max(0, count);

  if (state) {
    state.lineInviteFriendCount = safeCount;
  }

  card.dataset.count = String(safeCount);
  progress.dataset.count = String(safeCount);

  const nodes = Array.from(
    progress.querySelectorAll(".zg-invite-mission-node")
  );

  nodes.forEach((node) => {
    const target = Number(node.dataset.target || 0);
    const unlocked = safeCount >= target;

    node.classList.toggle("is-unlocked", unlocked);
    node.classList.toggle("is-locked", !unlocked);
  });

  let pct = 0;

  if (safeCount >= 5) {
    pct = 100;
  } else if (safeCount >= 3) {
    pct = 50;
  } else {
    pct = 0;
  }

  if (fill) {
    fill.style.setProperty("width", `${pct}%`, "important");
  }

  if (status) {
    if (safeCount >= 5) {
      status.textContent = "已解鎖全部獎勵";
      status.classList.add("is-unlocked");
      status.classList.remove("is-locked");
    } else if (safeCount >= 3) {
      status.textContent = "已解鎖 2 項獎勵";
      status.classList.add("is-unlocked");
      status.classList.remove("is-locked");
    } else if (safeCount >= 1) {
      status.textContent = "已解鎖 1 項獎勵";
      status.classList.add("is-unlocked");
      status.classList.remove("is-locked");
    } else {
      status.textContent = "尚未解鎖";
      status.classList.add("is-locked");
      status.classList.remove("is-unlocked");
    }
  }

  if (currentCount) {
    currentCount.innerHTML = `目前已邀請 <strong>${safeCount}</strong> 人`;
  }

  if (
    state &&
    state.screen === "result" &&
    typeof forceResultVisible === "function"
  ) {
    requestAnimationFrame(() => {
      try {
        forceResultVisible();
      } catch (error) {}
    });
  }
}


function updateResultInviteCount(result = {}) {
  const inviteCountEl = document.querySelector("#zg-result-invite-count");

  const count = Number(
    result.lineInviteFriendCount ??
    result.referralCount ??
    result.successCount ??
    result.count ??
    state.lineInviteFriendCount ??
    getLineInviteFriendCount() ??
    0
  ) || 0;

  if (state) {
    state.lineInviteFriendCount = Math.max(0, count);
  }

  /*
   * 如果目前 DOM 沒有 #zg-result-invite-count，不要報錯。
   * 因為現在你主要是用邀請獎勵進度卡顯示任務。
   */
  if (!inviteCountEl) return;

  const safeCount = Math.max(0, count);

  inviteCountEl.textContent = `已成功邀請好友：${safeCount} 人`;
  inviteCountEl.dataset.count = String(safeCount);
  inviteCountEl.classList.toggle("has-count", safeCount > 0);
}

function ensureRewardBannerContainer(resultScreen, resultMain) {
  const scope = resultScreen || document;

  let root = $("#zelo-reward-banner", scope);

  if (root) return root;

  root = document.createElement("div");
  root.id = "zelo-reward-banner";
  root.className = "zg-reward-banner-root";

  const anchors = [
    "#zg-result-friend-rank",
    "#zg-friend-rank",
    ".zg-result-friend-rank",
    ".zg-friend-rank",
    ".zg-rank-card",
    ".zg-result-rank",
    "#zg-invite-mission",
    ".zg-invite-mission",
    "#zg-coupon-card",
    ".zg-coupon-card",
    ".zg-result-extra",
    ".zg-result-content",
    ".zg-result-body"
  ];

  let anchor = null;

  for (const selector of anchors) {
    const found = $(selector, scope);

    if (found) {
      anchor = found;
      break;
    }
  }

  if (anchor && anchor.parentNode) {
    anchor.insertAdjacentElement("afterend", root);
    return root;
  }

  const actionBar =
    $(".zg-result-actions", scope) ||
    $(".zg-result-buttons", scope) ||
    $(".zg-bottom-actions", scope) ||
    $(".zg-fixed-actions", scope) ||
    $(".zg-result-cta", scope);

  if (actionBar && actionBar.parentNode) {
    actionBar.insertAdjacentElement("beforebegin", root);
    return root;
  }

  if (resultScreen) {
    resultScreen.appendChild(root);
    return root;
  }

  document.body.appendChild(root);
  return root;
}


function ensureWeeklyGachaContainer(resultScreen, resultMain) {
  const scope = resultScreen || document;

  let root = document.getElementById("zelo-weekly-gacha-container");

  if (root) return root;

  root = document.createElement("div");
  root.id = "zelo-weekly-gacha-container";
  root.className = "zg-weekly-gacha-root";

  /*
   * 優先插在 ZELO REWARD 後面。
   */
  const rewardBanner =
    document.getElementById("zelo-reward-banner") ||
    scope.querySelector("#zelo-reward-banner");

  if (rewardBanner && rewardBanner.parentNode) {
    rewardBanner.insertAdjacentElement("afterend", root);
    return root;
  }

  /*
   * 如果 reward banner 還沒建立，插在邀請任務後面。
   */
  const inviteCard =
    scope.querySelector("#zg-invite-mission-card") ||
    scope.querySelector(".zg-invite-mission-card");

  if (inviteCard && inviteCard.parentNode) {
    inviteCard.insertAdjacentElement("afterend", root);
    return root;
  }

  /*
   * 再不行，插在排行榜前面。
   */
  const rankCard =
    scope.querySelector("#zg-friend-rank") ||
    scope.querySelector(".zg-friend-rank");

  if (rankCard && rankCard.parentNode) {
    rankCard.insertAdjacentElement("beforebegin", root);
    return root;
  }

  /*
   * 最後 fallback：塞進 result main。
   */
  if (resultMain) {
    resultMain.appendChild(root);
    return root;
  }

  document.body.appendChild(root);
  return root;
}


  
function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function claimReward(tierId) {
  const tier = REWARD_TIERS.find((item) => item.id === tierId);

  if (!tier) {
    alert("找不到這個獎勵");
    return;
  }

  if (tier.type === "lottery" && isLotteryCampaignEnded()) {
    alert("四週抽獎活動已結束，感謝參與。");
    return;
  }

  const context = getRewardContext();
  const current = getRewardCurrentValue(tier, context);
  const target = getRewardRequirementValue(tier);

  if (current < target) {
    if (tier.requirementType === "share") {
      alert("請先完成分享，即可解鎖這個獎勵。");
    } else if (tier.requirementType === "invite") {
      alert(`邀請人數不足，還需要邀請 ${target - current} 人。`);
    } else {
      alert(`積分不足，還需要 ${target - current} 積分。`);
    }

    return;
  }

  if (isRewardClaimed(tier.id)) {
    if (tier.type === "lottery") {
      alert(`你已取得「${tier.name}」${getLotteryWeekLabel()}資格，目前正在抽獎中。`);
    } else {
      alert(`你已領取「${tier.name}」。`);
    }

    return;
  }

  markRewardClaimed(tier.id);

  if (tier.type === "coupon") {
    alert(`恭喜領取「${tier.name}」！折扣碼：${tier.code || ""}`);
  } else if (tier.type === "lottery") {
    alert(`恭喜取得「${tier.name}」！${getLotteryWeekLabel()}，您已進入抽獎中。`);
  } else {
    alert(`恭喜取得「${tier.name}」！`);
  }

  renderRewardBanner(state?.lastBattleResult || null);

  if (typeof track === "function") {
    track("reward_claim", {
      rewardId: tier.id,
      rewardName: tier.name,
      rewardType: tier.type,
      requirementType: tier.requirementType || "points",
      requiredPoints: tier.requiredPoints ?? tier.points ?? 0,
      requiredInvites: tier.requiredInvites || 0,
      requiredShare: !!tier.requiredShare,
      weeklyLimit: tier.weeklyLimit || "",
      rewardCode: tier.code || "",
      status: tier.type === "lottery" ? "lottery_entered" : "coupon_claimed",
      currentPoints: context.points,
      currentInvites: context.inviteCount,
      hasShared: context.hasShared,
      lotteryWeek:
        tier.type === "lottery"
          ? getCurrentLotteryWeek()
          : "",
      lotteryWeekLabel:
        tier.type === "lottery"
          ? getLotteryWeekLabel()
          : "",
      campaignTotalWeeks:
  window.LOTTERY_CAMPAIGN?.totalWeeks || 4,
      referralCode: typeof getMyReferralCode === "function" ? getMyReferralCode() : ""
    });
  }
}


function getTaiwanDateOnly(date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    return formatter.format(date);
  } catch (error) {
    const d = new Date(date);
    const utc = d.getTime() + d.getTimezoneOffset() * 60000;
    const tw = new Date(utc + 8 * 60 * 60000);

    const y = tw.getFullYear();
    const m = String(tw.getMonth() + 1).padStart(2, "0");
    const day = String(tw.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }
}

function parseDateOnly(dateString) {
  const value = String(dateString || "").trim();
  const parts = value.split("-").map(Number);

  if (parts.length !== 3) return null;

  const [year, month, day] = parts;

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getCurrentLotteryWeek() {
  const campaign = window.LOTTERY_CAMPAIGN || {
    enabled: true,
    startDate: "2026-07-28",
    totalWeeks: 4
  };

  if (!campaign.enabled) {
    return 1;
  }

  const start = parseDateOnly(campaign.startDate);
  const todayString = getTaiwanDateOnly(new Date());
  const today = parseDateOnly(todayString);

  if (!start || !today) return 1;

  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 0) return 1;

  const week = Math.floor(diffDays / 7) + 1;
  const totalWeeks = Number(campaign.totalWeeks || 4);

  return Math.max(1, Math.min(totalWeeks, week));
}


function isLotteryCampaignEnded() {
  const campaign = window.LOTTERY_CAMPAIGN || {
    enabled: true,
    startDate: "2026-07-28",
    totalWeeks: 4
  };

  if (!campaign.enabled) return false;

  const start = parseDateOnly(campaign.startDate);
  const todayString = getTaiwanDateOnly(new Date());
  const today = parseDateOnly(todayString);

  if (!start || !today) return false;

  const totalDays = Number(campaign.totalWeeks || 4) * 7;
  const endTime = start.getTime() + totalDays * 86400000;

  return today.getTime() >= endTime;
}


function getLotteryWeekLabel() {
  const campaign = window.LOTTERY_CAMPAIGN || {
    enabled: true,
    totalWeeks: 4
  };

  const week = getCurrentLotteryWeek();
  const total = Number(campaign.totalWeeks || 4);

  if (isLotteryCampaignEnded()) {
    return `四週活動已結束`;
  }

  return `第 ${week} 週 / 共 ${total} 週`;
}


function markShareCompleted() {
  try {
    localStorage.setItem("zg_share_completed", "1");
    return true;
  } catch (error) {
    return false;
  }
}

  function getShareCompleted() {
  try {
    return localStorage.getItem("zg_share_completed") === "1";
  } catch (error) {
    return false;
  }
}

function markShareCompleted() {
  try {
    localStorage.setItem("zg_share_completed", "1");
    return true;
  } catch (error) {
    return false;
  }
}


function getRewardContext(points = getRewardPoints()) {
  const inviteCount =
    typeof getLineInviteFriendCount === "function"
      ? Number(getLineInviteFriendCount() || 0)
      : Number(state?.lineInviteFriendCount || 0) || 0;

  return {
    points: Math.max(0, Number(points) || 0),
    inviteCount: Math.max(0, inviteCount),
    hasShared: getShareCompleted()
  };
}

function getRewardRequirementValue(tier) {
  if (!tier) return 0;

  if (tier.requirementType === "invite") {
    return Number(tier.requiredInvites || 0);
  }

  if (tier.requirementType === "share") {
    return tier.requiredShare ? 1 : 0;
  }

  return Number(tier.requiredPoints ?? tier.points ?? 0);
}

function getRewardCurrentValue(tier, context = getRewardContext()) {
  if (!tier) return 0;

  if (tier.requirementType === "invite") {
    return Number(context.inviteCount || 0);
  }

  if (tier.requirementType === "share") {
    return context.hasShared ? 1 : 0;
  }

  return Number(context.points || 0);
}

function getRewardContext(points = getRewardPoints()) {
  const inviteCount =
    typeof getLineInviteFriendCount === "function"
      ? Number(getLineInviteFriendCount() || 0)
      : Number(state?.lineInviteFriendCount || 0) || 0;

  return {
    points: Math.max(0, Number(points) || 0),
    inviteCount: Math.max(0, inviteCount),
    hasShared: getShareCompleted()
  };
}

function getRewardRequirementValue(tier) {
  if (!tier) return 0;
  if (tier.requirementType === "invite") {
    return Number(tier.requiredInvites || 0);
  }
  if (tier.requirementType === "share") {
    return tier.requiredShare ? 1 : 0;
  }
  return Number(tier.requiredPoints ?? tier.points ?? 0);
}

function getRewardCurrentValue(tier, context = getRewardContext()) {
  if (!tier) return 0;
  if (tier.requirementType === "invite") {
    return Number(context.inviteCount || 0);
  }
  if (tier.requirementType === "share") {
    return context.hasShared ? 1 : 0;
  }
  return Number(context.points || 0);
}

function getRewardClaimKey(rewardId) {
  const id = String(rewardId || "");

  const tier =
    Array.isArray(REWARD_TIERS)
      ? REWARD_TIERS.find((item) => item.id === id)
      : null;

  if (tier && tier.type === "lottery") {
    const week = getCurrentLotteryWeek();
    return `zg_reward_claimed_w${week}_${id}`;
  }

  return `zg_reward_claimed_${id}`;
}

function isRewardClaimed(rewardId) {
  if (!rewardId) return false;
  try {
    return localStorage.getItem(getRewardClaimKey(rewardId)) === "1";
  } catch (error) {
    return false;
  }
}

function markRewardClaimed(rewardId) {
  if (!rewardId) return false;
  try {
    localStorage.setItem(getRewardClaimKey(rewardId), "1");
    return true;
  } catch (error) {
    console.warn("[ZELO GAME] markRewardClaimed failed:", error);
    return false;
  }
}

function getRewardState(tier, points = getRewardPoints()) {
  if (!tier) return "locked";

  const context = getRewardContext(points);
  const current = getRewardCurrentValue(tier, context);
  const target = getRewardRequirementValue(tier);

  if (isRewardClaimed(tier.id)) return "claimed";
  if (current >= target) return "available";
  return "locked";
}

function getRewardRequirementLabel(tier, context = getRewardContext()) {
  if (!tier) return "";

  if (tier.requirementType === "share") {
    return context.hasShared ? "已完成分享" : "完成分享即可解鎖";
  }

  if (tier.requirementType === "invite") {
    const current = Number(context.inviteCount || 0);
    const target = Number(tier.requiredInvites || 0);
    const remaining = Math.max(0, target - current);

    if (remaining <= 0) {
      return `已邀請 ${current} 人，達成條件`;
    }

    return `再邀請 ${remaining} 人解鎖｜目前 ${current}/${target}`;
  }

  const currentPoints = Number(context.points || 0);
  const targetPoints = Number(tier.requiredPoints ?? tier.points ?? 0);
  const remainingPoints = Math.max(0, targetPoints - currentPoints);

  if (remainingPoints <= 0) {
    return `已累積 ${currentPoints} 積分，達成條件`;
  }

  return `再累積 ${remainingPoints} 積分解鎖`;
}

function getRewardStateLabel(tier, stateName, points = getRewardPoints()) {
  if (!tier) return "";

  const context = getRewardContext(points);
  const baseLabel = getRewardRequirementLabel(tier, context);

  if (stateName === "claimed") {
    if (tier.type === "lottery") {
      return `您已進入抽獎中｜${getLotteryWeekLabel()}`;
    }
    return "已領取，可使用";
  }

  if (stateName === "available") {
    if (tier.type === "lottery") {
      return `已達成，可取得本週抽獎資格｜${getLotteryWeekLabel()}`;
    }
    return "已達成，可領取折扣碼";
  }

  return baseLabel;
}

async function copyRewardText(text) {
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
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";

    document.body.appendChild(textarea);
    textarea.select();

    const ok = document.execCommand("copy");
    textarea.remove();

    return ok;
  } catch (error) {
    return false;
  }
}


/*
 * =========================================================
 * ZELO Gacha Helpers / ZELO 扭蛋機核心工具
 * =========================================================
 */


  
function getGachaPoolById(poolId) {
  if (!Array.isArray(ZELO_GACHA_POOLS)) return null;

  return ZELO_GACHA_POOLS.find((pool) => pool.id === poolId) || null;
}

function pickWeightedGachaReward(rewards = []) {
  const list = Array.isArray(rewards)
    ? rewards.filter((item) => Number(item.weight || 0) > 0)
    : [];

  if (!list.length) return null;

  const totalWeight = list.reduce((sum, item) => {
    return sum + Math.max(0, Number(item.weight || 0));
  }, 0);

  if (totalWeight <= 0) return list[0] || null;

  let roll = Math.random() * totalWeight;

  for (const item of list) {
    roll -= Math.max(0, Number(item.weight || 0));

    if (roll <= 0) {
      return item;
    }
  }

  return list[list.length - 1] || null;
}

  
function getGachaResultMessage(reward = {}) {
  if (reward.type === "none") {
    return reward.description || "這次沒有抽中獎品，歡迎再挑戰一次。";
  }

  if (reward.type === "coupon") {
    return "專屬折扣碼將透過 LINE 訊息傳送給你，請回到聊天室查看。";
  }

  if (reward.type === "lottery_entry") {
    return "你已取得抽獎資格，官方將依活動規則進行後續抽選。";
  }

  if (reward.type === "points") {
    return "ZELO Points 已自動加到你的帳戶。";
  }

  return "獎勵已記錄。";
}



function saveGachaHistory(entry = {}) {
  try {
    const key = "zg_gacha_history";
    const oldList = JSON.parse(localStorage.getItem(key) || "[]");
    const list = Array.isArray(oldList) ? oldList : [];

    list.unshift({
      ...entry,
      ts: Date.now()
    });

    localStorage.setItem(key, JSON.stringify(list.slice(0, 30)));
  } catch (error) {}
}

const ZELO_GACHA_SYNC_ENDPOINT =
  window.ZELO_GACHA_SYNC_ENDPOINT ||
  ""; // 之後放 GAS Web App URL

function getZeloGachaPlayerName() {
  if (typeof getPlayerName === "function") {
    return getPlayerName() || "";
  }

  if (window.ZELO_PLAYER_NAME) {
    return String(window.ZELO_PLAYER_NAME || "");
  }

  const latestResult =
    state?.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
    {};

  return (
    latestResult.playerName ||
    latestResult.name ||
    localStorage.getItem("zelo_player_name") ||
    ""
  );
}

function getZeloGachaLineUserId() {
  if (typeof getLineUserId === "function") {
    return getLineUserId() || "";
  }

  if (window.ZELO_LINE_USER_ID) {
    return String(window.ZELO_LINE_USER_ID || "");
  }

  const latestResult =
    state?.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
    {};

  return (
    latestResult.lineUserId ||
    latestResult.userId ||
    localStorage.getItem("zelo_line_user_id") ||
    ""
  );
}


window.ZELO_GACHA_SYNC_ENDPOINT =
  window.ZELO_GACHA_SYNC_ENDPOINT ||
  "https://script.google.com/macros/s/AKfycbzXS64QzQ9eoWUVuYynIYIJ-lXfIJYw7ge8ICSnGRNCXbKax45ihne4mBN23SgqqOwGmg/exec";





  
async function syncGachaDrawToServer(drawEntry) {
  if (!drawEntry) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_draw_entry"
    };
  }

  const endpoint =
    window.ZELO_GACHA_SYNC_ENDPOINT ||
    "";

  if (!endpoint) {
    console.warn("[ZELO GACHA SYNC] endpoint not configured", drawEntry);
    return {
      ok: false,
      skipped: true,
      reason: "endpoint_not_configured"
    };
  }

  const payload = {
    action: "gacha_draw",
    source: "frontend",
    version: "20260730",

    draw: drawEntry,

    user: {
      userId: drawEntry.userId || "",
      lineUserId: drawEntry.lineUserId || "",
      playerName: drawEntry.playerName || "",
      referralCode: drawEntry.referralCode || ""
    },

    reward: {
      rewardId: drawEntry.rewardId || "",
      rewardName: drawEntry.rewardName || "",
      rewardType: drawEntry.rewardType || "",
      rarity: drawEntry.rarity || "",
      delivery: drawEntry.delivery || "",
      isNoPrize: !!drawEntry.isNoPrize
    },

    pool: {
      poolId: drawEntry.poolId || "",
      poolTitle: drawEntry.poolTitle || "",
      cost: Number(drawEntry.cost || 0)
    },

    points: {
      beforePoints: Number(drawEntry.beforePoints || 0),
      afterCostPoints: Number(drawEntry.afterCostPoints || 0),
      afterPoints: Number(drawEntry.afterPoints || 0),
      rewardPointsDelta: Number(drawEntry.rewardPointsDelta || 0)
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      mode: "cors",
      headers: {
        /*
         * GAS Web App 比較穩的寫法：
         * 用 text/plain 避免某些情境觸發 preflight。
         */
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
        raw: text
      };
    }

    if (!response.ok) {
      console.warn("[ZELO GACHA SYNC] server responded with error", {
        status: response.status,
        data,
        drawEntry
      });

      return {
        ok: false,
        status: response.status,
        data
      };
    }

    console.log("[ZELO GACHA SYNC] success", {
      drawId: drawEntry.drawId,
      data
    });

    return {
      ok: true,
      status: response.status,
      data
    };
  } catch (error) {
    console.warn("[ZELO GACHA SYNC] failed", {
      error,
      drawEntry
    });

    return {
      ok: false,
      error: String(error?.message || error)
    };
  }
}

window.syncGachaDrawToServer = syncGachaDrawToServer;


/*
 * 通用 POST 呼叫工具
 * 用途：呼叫 redeemSecretCode / getPlayerSecretUnlocks 等
 * 只接受 POST 的後端 action（doGet 對這些 action 會回傳 POST_REQUIRED）
 */
async function postToZeloBackend(payload) {
  const endpoint = window.ZELO_GACHA_SYNC_ENDPOINT || "";

  if (!endpoint) {
    console.warn("[ZELO BACKEND POST] endpoint not configured", payload);
    return {
      ok: false,
      skipped: true,
      reason: "endpoint_not_configured"
    };
  }

  try {
    const response = await fetch(endpoint, {
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
        raw: text
      };
    }

    if (!response.ok) {
      console.warn("[ZELO BACKEND POST] server responded with error", {
        status: response.status,
        data,
        payload
      });

      return {
        ok: false,
        status: response.status,
        data
      };
    }

    return {
      ok: !!(data && data.ok),
      status: response.status,
      data
    };
  } catch (error) {
    console.warn("[ZELO BACKEND POST] failed", {
      error,
      payload
    });

    return {
      ok: false,
      error: String(error && error.message ? error.message : error)
    };
  }
}

window.postToZeloBackend = postToZeloBackend;


/**
 * ZELO 每週三蛋抽獎系統 - 後端整合核心模組
 * ------------------------------------------------------
 * 正式版：
 * - 不再使用 localStorage 決定抽獎結果
 * - 不在前端扣點
 * - 不在前端產生折扣碼
 * - 不在前端判斷是否已抽
 *
 * 所有權威邏輯都交給 GAS 後端：
 * - weekly_gacha_status
 * - weekly_gacha_draw
 *
 * 對外保留 window.ZeloGacha 作為前台 UI 呼叫入口。
 * ------------------------------------------------------
 */

// ============================================================
// 1. 獎池設定 Config
// ============================================================

const GACHA_CONFIG = {
  welfare: {
    id: "welfare",
    backendId: "welfare",
    name: "福利蛋",
    title: "福利蛋",
    tier: "bronze",
    className: "bronze",

    // 福利蛋：無限制抽獎，每次 100 Points
    cost: 100,
    minInviteCount: 0,
    weeklyLimit: 0,
    limitType: "unlimited",

    badge: "無限制抽獎",
    subtitle: "折扣券獎池",

    fallback: null,
    fallbackCouponName: "",
    inviteCap: 0,
    inviteEnabled: false,

    prizes: [
      {
        id: "welfare_coupon_80",
        name: "8折券",
        weight: null,
        type: "coupon",
        imageUrl: null,
        icon: "🎫"
      },
      {
        id: "welfare_coupon_95",
        name: "新品95折券",
        weight: null,
        type: "coupon",
        imageUrl: null,
        icon: "🎫"
      },
      {
        id: "welfare_coupon_60",
        name: "全品項6折券",
        weight: null,
        type: "coupon",
        imageUrl: null,
        icon: "🎫"
      }
    ]
  },

  accessory: {
    id: "accessory",
    backendId: "accessory",
    name: "配件蛋",
    title: "配件蛋",
    tier: "silver",
    className: "silver",

    // 配件蛋：每次 300 Points，每週限中 1 次實體
    cost: 300,
    minInviteCount: 0,
    weeklyLimit: 1,
    limitType: "weekly_physical_once",

    badge: "每週限中 1 次",
    subtitle: "騎行配件獎池",

    fallback: {
      type: "coupon",
      name: "50元折扣碼",
      value: 50
    },
    fallbackCouponName: "50元折扣碼",

    inviteCap: 6,
    inviteEnabled: true,

    prizes: [
      {
        id: "a1",
        name: "ZELO 襪子",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/suck.jpg?v=1785332079"
      },
      {
        id: "a2",
        name: "KIDEVO 握把",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ba57a09bab39dec4be0f562dbb7509d3.jpg?v=1785331200"
      },
      {
        id: "a3",
        name: "KIDEVO 坐墊",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/cbc8e5e978652109aaa5729d3717e257.jpg?v=1785331099"
      }
    ]
  },

  equipment: {
    id: "equipment",
    backendId: "equipment",
    name: "裝備蛋",
    title: "裝備蛋",
    tier: "gold",
    className: "gold",

    // 裝備蛋：每次 500 Points，每週限中 1 次實體
    cost: 500,
    minInviteCount: 0,
    weeklyLimit: 1,
    limitType: "weekly_physical_once",

    badge: "每週限中 1 次",
    subtitle: "騎行裝備獎池",

    fallback: {
      type: "coupon",
      name: "100元折扣碼",
      value: 100
    },
    fallbackCouponName: "100元折扣碼",

    inviteCap: 6,
    inviteEnabled: true,

    prizes: [
      {
        id: "g1",
        name: "兒童風衣外套",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ZELO-_-_-_-_11_-ZELO-5720312.jpg?v=1763387744"
      },
      {
        id: "g2",
        name: "PRO-TYPE 車褲",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/p1_16ee97d2-e464-49cc-9202-3b347d7a786e.jpg?v=1785332079"
      },
      {
        id: "g3",
        name: "吊帶車褲",
        weight: null,
        type: "physical",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg_b896a3b9-78e2-42ab-932d-f8461fc7355d.jpg?v=1785332079"
      }
    ]
  }
};

/*
 * 相容舊前端 poolId。
 * 舊版可能用 gear，但後端正式 poolId 是 equipment。
 */
GACHA_CONFIG.gear = {
  ...GACHA_CONFIG.equipment,
  id: "gear",
  backendId: "equipment"
};

// ============================================================
// 2. 狀態快取
// ============================================================

const ZeloGachaState = {
  status: null,
  rewards: [],
  loading: false,
  drawing: false,
  lastError: null
};

// ============================================================
// 3. 週期工具
// ============================================================

/**
 * 前端顯示用週期。
 * 注意：
 * 後端權威 weekKey 由 GAS getTaipeiWeekKey_() 產生，格式為 yyyy-MM-dd。
 * 前端這裡只作為 fallback 顯示。
 */
function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  d.setDate(d.getDate() + diffToMonday);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${dayOfMonth}`;
}

// ============================================================
// 4. 身份與 API 工具
// ============================================================

function getZeloGachaIdentity(extraPayload = {}) {
  let profilePayload = {};

  try {
    if (typeof getProfilePayload === "function") {
      profilePayload = getProfilePayload() || {};
    }
  } catch (error) {}

  let playerName = "";

  try {
    if (typeof getPlayerName === "function") {
      playerName = getPlayerName() || "";
    }
  } catch (error) {}

  const userId =
    extraPayload.userId ||
    extraPayload.lineUserId ||
    profilePayload.userId ||
    profilePayload.lineUserId ||
    window.LINE_USER_ID ||
    window.currentUserId ||
    "";

  const displayName =
    extraPayload.displayName ||
    extraPayload.playerName ||
    profilePayload.displayName ||
    profilePayload.playerName ||
    playerName ||
    "你";

  const referralCode =
    extraPayload.referralCode ||
    profilePayload.referralCode ||
    profilePayload.myReferralCode ||
    (
      typeof getMyReferralCode === "function"
        ? getMyReferralCode()
        : ""
    ) ||
    "";

  const pictureUrl =
    extraPayload.pictureUrl ||
    profilePayload.pictureUrl ||
    profilePayload.avatarUrl ||
    "";

  return {
    userId,
    lineUserId: userId,
    displayName,
    playerName: displayName,
    referralCode,
    pictureUrl
  };
}

function generateGachaClientNonce() {
  return "weekly_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 10);
}

/**
 * 後端 POST 包裝。
 * 會優先使用專案既有函式。
 */
function zeloGachaPost(payload) {
  if (typeof postToZeloBackend === "function") {
    return postToZeloBackend(payload).then(function(result) {
      if (result && result.data) {
        return result.data;
      }

      return result;
    });
  }

  if (typeof callZeloApi === "function") {
    return callZeloApi(payload);
  }

  if (typeof apiPost === "function") {
    return apiPost(payload);
  }

  if (typeof ZELO_API_URL !== "undefined" && ZELO_API_URL) {
    return fetch(ZELO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    }).then(function(res) {
      return res.json();
    });
  }

  return Promise.reject(
    new Error("找不到 ZELO 後端 API 呼叫方法。請確認 postToZeloBackend 或 ZELO_API_URL 已存在。")
  );
}



function normalizePoolId(poolId) {
  if (poolId === "gear") return "equipment";
  return poolId;
}

function getUiPoolId(poolId) {
  if (poolId === "equipment") return "equipment";
  return poolId;
}

// ============================================================
// 5. 狀態查詢
// ============================================================

/**
 * 取得每週三蛋狀態。
 *
 * 後端 action：
 * weekly_gacha_status
 */
function getStatus(extraPayload = {}) {
  const identity = getZeloGachaIdentity(extraPayload);

  ZeloGachaState.loading = true;
  ZeloGachaState.lastError = null;

  return zeloGachaPost({
    action: "weekly_gacha_status",
    userId: identity.userId,
    drawMode: extraPayload.drawMode || "points",
    lineUserId: identity.lineUserId,
    displayName: identity.displayName,
    playerName: identity.playerName,
    referralCode: identity.referralCode,
    pictureUrl: identity.pictureUrl
  })
    .then((res) => {
      ZeloGachaState.loading = false;

      if (!res || !res.ok) {
        ZeloGachaState.lastError = res || {
          code: "STATUS_FAILED",
          message: "讀取每週三蛋狀態失敗。"
        };

        return res;
      }

      ZeloGachaState.status = normalizeStatusResponse(res);
      return ZeloGachaState.status;
    })
    .catch((error) => {
      ZeloGachaState.loading = false;
      ZeloGachaState.lastError = error;
      throw error;
    });
}

/**
 * 將後端 status 補上前端 UI 設定。
 */
function normalizeStatusResponse(status) {
  const pools = Array.isArray(status.pools)
    ? status.pools.map((pool) => {
        const backendPoolId = normalizePoolId(pool.poolId || pool.id);
        const ui = GACHA_CONFIG[backendPoolId] || {};

        return {
          ...pool,
          poolId: backendPoolId,
          id: backendPoolId,
          uiId: getUiPoolId(backendPoolId),
          title: pool.title || ui.title || ui.name || backendPoolId,
          name: pool.title || ui.title || ui.name || backendPoolId,
          tier: ui.tier || "",
          className: ui.className || "",
          badge: ui.badge || "",
          subtitle: ui.subtitle || "",
          prizes: ui.prizes || [],
          cost: Number(pool.cost ?? ui.cost ?? 0) || 0,
          minInviteCount: Number(pool.minInviteCount ?? ui.minInviteCount ?? 0) || 0,
          drawn: Boolean(pool.drawn),
          canDraw: Boolean(pool.canDraw),
          enoughPoints: pool.enoughPoints !== false,
          enoughInvites: pool.enoughInvites !== false,
          remainingPoints: Number(pool.remainingPoints || 0) || 0,
          remainingInvites: Number(pool.remainingInvites || 0) || 0,
          lastDraw: pool.lastDraw || null
        };
      })
    : [];

  return {
    ...status,
    pools,
    zeloPoints: Number(status.zeloPoints || 0) || 0,
    inviteCount: Number(status.inviteCount ?? status.lineInviteFriendCount ?? 0) || 0,
    lineInviteFriendCount: Number(status.lineInviteFriendCount ?? status.inviteCount ?? 0) || 0,
    weekKey: status.weekKey || getWeekKey()
  };
}

/**
 * 取得單一獎池本週狀態。
 * 相容舊版 getPoolWeeklyState(poolId)。
 */
function getPoolWeeklyState(poolId) {
  const backendPoolId = normalizePoolId(poolId);
  const status = ZeloGachaState.status;

  if (!status || !Array.isArray(status.pools)) {
    return null;
  }

  return status.pools.find((pool) => pool.poolId === backendPoolId) || null;
}

/**
 * 相容舊版 hasReachedWeeklyLimit(poolId)。
 * 正式版以後端 status 的 drawn 為準。
 */
function hasReachedWeeklyLimit(poolId) {
  const pool = getPoolWeeklyState(poolId);
  return Boolean(pool && pool.drawn);
}

// ============================================================
// 6. 抽獎主流程
// ============================================================

/**
 * 執行一次抽獎。
 *
 * @param {string} poolId
 * - welfare
 * - accessory
 * - equipment
 * - gear 會自動轉成 equipment
 *
 * 後端 action：
 * weekly_gacha_draw
 */
function drawGacha(poolId, extraPayload = {}) {
  const backendPoolId = normalizePoolId(poolId);
  const identity = getZeloGachaIdentity(extraPayload);

  if (!GACHA_CONFIG[backendPoolId]) {
    return Promise.reject(
      new Error(`未知的獎池 ID：${poolId}`)
    );
  }

  if (ZeloGachaState.drawing) {
    return Promise.resolve({
      ok: false,
      code: "DRAWING",
      message: "抽獎進行中，請稍候。"
    });
  }

  ZeloGachaState.drawing = true;
  ZeloGachaState.lastError = null;

  return zeloGachaPost({
    action: "weekly_gacha_draw",
    poolId: backendPoolId,
    userId: identity.userId,
    lineUserId: identity.lineUserId,
    displayName: identity.displayName,
    playerName: identity.playerName,
    referralCode: identity.referralCode,
    pictureUrl: identity.pictureUrl,
    clientNonce:
      extraPayload.clientNonce ||
      generateGachaClientNonce()
  })
    .then((res) => {
      ZeloGachaState.drawing = false;

      if (!res || !res.ok) {
        ZeloGachaState.lastError = res || {
          code: "DRAW_FAILED",
          message: "抽獎失敗。"
        };

        /*
         * 如果後端有回 status，也要更新本地狀態。
         * 例如 WEEKLY_ALREADY_DRAWN 時，後端會帶 lastDraw。
         */
        if (res && res.status && res.status.ok) {
          ZeloGachaState.status = normalizeStatusResponse(res.status);
        }

        return normalizeDrawResponse(res);
      }

      if (res.status && res.status.ok) {
        ZeloGachaState.status = normalizeStatusResponse(res.status);
      }

      const normalized = normalizeDrawResponse(res);

      /*
       * 將本次抽獎結果暫存到 rewards。
       * 注意：正式歷史仍應由後端 WeeklyGachaDraws 查詢。
       */
      if (normalized && normalized.ok) {
        ZeloGachaState.rewards.unshift(drawResponseToRewardRecord(normalized));
      }

      return normalized;
    })
    .catch((error) => {
      ZeloGachaState.drawing = false;
      ZeloGachaState.lastError = error;
      throw error;
    });
}

/**
 * 將後端 draw response 轉成前台容易使用的格式。
 */
function normalizeDrawResponse(res) {
  if (!res) {
    return {
      ok: false,
      code: "EMPTY_RESPONSE",
      message: "後端無回應。"
    };
  }

  if (!res.ok) {
    return {
      ...res,
      type: "error",
      poolId: normalizePoolId(res.poolId || ""),
      lastDraw: res.lastDraw || null
    };
  }

  const reward = res.reward || {};

  const rewardId =
    res.rewardId ||
    reward.rewardId ||
    reward.id ||
    "";

  const rewardName =
    res.rewardName ||
    reward.rewardName ||
    reward.name ||
    "神秘獎勵";

  const rewardType =
    res.rewardType ||
    reward.rewardType ||
    reward.type ||
    "";

  const isNoPrize =
    res.isNoPrize === true ||
    reward.isNoPrize === true ||
    rewardType === "none";

  let type = "prize";

  if (isNoPrize) {
    type = "none";
  } else if (rewardType === "points") {
    type = "points";
  } else if (rewardType === "coupon") {
    type = "coupon";
  } else if (rewardType === "physical") {
    type = "physical_prize";
  }

  return {
    ...res,
    type,
    poolId: normalizePoolId(res.poolId || reward.poolId || ""),
    rewardId,
    rewardName,
    rewardType,
    name: rewardName,
    isNoPrize,
    beforePoints: Number(res.beforePoints || 0) || 0,
    afterPoints: Number(res.afterPoints || res.zeloPoints || 0) || 0,
    zeloPoints: Number(res.zeloPoints || res.afterPoints || 0) || 0,
    rewardPointsDelta: Number(res.rewardPointsDelta || 0) || 0,
    issuedAt: new Date().toISOString().split("T")[0],
    imageUrl: getRewardImageUrl(normalizePoolId(res.poolId || ""), rewardId, rewardName)
  };
}

function getRewardImageUrl(poolId, rewardId, rewardName) {
  const config = GACHA_CONFIG[normalizePoolId(poolId)];
  if (!config || !Array.isArray(config.prizes)) return null;

  const found = config.prizes.find((p) => {
    return p.id === rewardId || p.name === rewardName;
  });

  return found ? found.imageUrl || null : null;
}

function drawResponseToRewardRecord(draw) {
  return {
    id: draw.drawId || Date.now(),
    drawId: draw.drawId || "",
    poolId: draw.poolId || "",
    rewardId: draw.rewardId || "",
    rewardType: draw.rewardType || draw.type || "",
    name: draw.rewardName || draw.name || "",
    rewardName: draw.rewardName || draw.name || "",
    imageUrl: draw.imageUrl || null,
    code: draw.couponCode || draw.code || null,
    status: "unused",
    issuedAt: draw.issuedAt || new Date().toISOString().split("T")[0],
    expiresAt: draw.expiresAt || null,
    isNoPrize: Boolean(draw.isNoPrize),
    beforePoints: Number(draw.beforePoints || 0) || 0,
    afterPoints: Number(draw.afterPoints || 0) || 0,
    rewardPointsDelta: Number(draw.rewardPointsDelta || 0) || 0
  };
}

// ============================================================
// 7. LINE 邀請
// ============================================================

/**
 * 目前正式後端邏輯是：
 * - welfare：0 邀請
 * - accessory：至少 1 位邀請
 * - equipment：至少 3 位邀請
 *
 * 邀請數來源由既有 LINE invite / friend rank 流程更新。
 * 這裡不再前端直接 incrementInviteBonus。
 */
function requestLineInvite(poolId) {
  const backendPoolId = normalizePoolId(poolId);

  /*
   * 如果專案已有 LINE 分享函式，優先呼叫。
   */
  if (typeof shareLineInvite === "function") {
    return Promise.resolve(
      shareLineInvite({
        source: "weekly_gacha",
        poolId: backendPoolId
      })
    );
  }

  if (typeof openLineShare === "function") {
    return Promise.resolve(
      openLineShare({
        source: "weekly_gacha",
        poolId: backendPoolId
      })
    );
  }

  /*
   * 沒有分享函式時，只回提示。
   * 不做任何本地加邀請數。
   */
  return Promise.resolve({
    success: false,
    code: "LINE_INVITE_NOT_IMPLEMENTED",
    message: "尚未接上 LINE 分享邀請流程。"
  });
}

// ============================================================
// 8. 我的獎勵紀錄
// ============================================================

/**
 * MVP：
 * 目前後端已驗證 weekly_gacha_status / draw。
 * 尚未建立專用 reward_history action 前，這裡先回傳本次 session 暫存紀錄。
 *
 * 下一階段可改接：
 * action: weekly_gacha_reward_history
 */
function getRewardRecords(filter = "all") {
  const records = Array.isArray(ZeloGachaState.rewards)
    ? ZeloGachaState.rewards.slice()
    : [];

  if (filter === "all") return records;

  return records.filter((record) => record.status === filter);
}

/**
 * 正式兌換應走後端。
 * 目前只提供前台相容，不做真正兌換。
 */
function markRewardAsUsed(recordId) {
  const target = ZeloGachaState.rewards.find((r) => {
    return String(r.id) === String(recordId) ||
      String(r.drawId) === String(recordId);
  });

  if (target) {
    target.status = "used";
    target.usedAt = new Date().toISOString().split("T")[0];
  }

  return target || null;
}

// ============================================================
// 9. 前台 UI 輔助文字
// ============================================================

function getPoolButtonText(pool) {
  if (!pool) return "讀取中";

  if (pool.drawn) return "本週已抽";

  if (!pool.enoughInvites) {
    return `還差 ${Number(pool.remainingInvites || 0)} 位邀請`;
  }

  if (!pool.enoughPoints) {
    return `還差 ${Number(pool.remainingPoints || 0)} Points`;
  }

  if (pool.canDraw) {
    return Number(pool.cost || 0) > 0
      ? `消耗 ${Number(pool.cost || 0)} 點抽蛋`
      : "免費抽蛋";
  }

  return "尚未開放";
}

function getPoolStatusText(pool) {
  if (!pool) return "讀取中";

  if (pool.drawn) return "本週已抽過";

  if (pool.canDraw) return "本週可抽";

  if (!pool.enoughInvites) {
    return `邀請條件未達成，還差 ${Number(pool.remainingInvites || 0)} 位`;
  }

  if (!pool.enoughPoints) {
    return `ZELO Points 不足，還差 ${Number(pool.remainingPoints || 0)} 點`;
  }

  return "目前不可抽";
}

function getPoolStatusClass(pool) {
  if (!pool) return "locked";
  if (pool.drawn) return "used";
  if (pool.canDraw) return "ok";
  return "locked";
}

// ============================================================
// 10. 對外匯出
// ============================================================

window.ZeloGacha = {
  config: GACHA_CONFIG,
  state: ZeloGachaState,

  getWeekKey,
  getStatus,
  getPoolWeeklyState,
  hasReachedWeeklyLimit,

  drawGacha,
  requestLineInvite,

  getRewardRecords,
  markRewardAsUsed,

  normalizePoolId,
  getPoolButtonText,
  getPoolStatusText,
  getPoolStatusClass
};

window.ZeloGacha = {
  config: GACHA_CONFIG,
  state: ZeloGachaState,
  getWeekKey,
  getStatus,
  getPoolWeeklyState,
  hasReachedWeeklyLimit,
  drawGacha,
  requestLineInvite,
  getRewardRecords,
  markRewardAsUsed,
  normalizePoolId,
  getPoolButtonText,
  getPoolStatusText,
  getPoolStatusClass
};

/* ✅ 這裡貼下面這段 */

  /*
 * =========================================================
 * ZELO 三獎池抽獎系統 UI
 * Gacha + My Rewards Tabs
 * =========================================================
 */

const ZELO_GACHA_FRONTEND_STATE = {
  currentPage: "gacha",
  currentRewardFilter: "all",
  lastStatus: null,
  loading: false,
  drawingPoolId: "",
  rewards: []
};

const ZELO_GACHA_POOL_VIEW = {
  welfare: {
    id: "welfare",
    title: "福利蛋",
    subtitle: "折扣券獎池",
    tierClass: "bronze",
    badge: "🥉 無限制抽獎",
    cost: 100,
    mode: "unlimited",
    inviteEnabled: false,
    prizes: [
      {
        name: "8折券",
        icon: "🎫",
        imageUrl: ""
      },
      {
        name: "新品95折券",
        icon: "🎫",
        imageUrl: ""
      },
      {
        name: "全品項6折券",
        icon: "🎫",
        imageUrl: ""
      }
    ]
  },

  accessory: {
    id: "accessory",
    title: "配件蛋",
    subtitle: "騎行配件獎池",
    tierClass: "silver",
    badge: "🥈 每週限中 1 次",
    cost: 300,
    mode: "weekly_physical_once",
    fallbackCouponName: "50元折扣碼",
    fallbackNote: "本週已抽中任一獎項後，改發「50元折扣碼」回饋",
    inviteEnabled: true,
    inviteCap: 6,
    prizes: [
      {
        name: "ZELO 襪子",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/suck.jpg?v=1785332079"
      },
      {
        name: "KIDEVO 握把",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ba57a09bab39dec4be0f562dbb7509d3.jpg?v=1785331200"
      },
      {
        name: "KIDEVO 坐墊",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/cbc8e5e978652109aaa5729d3717e257.jpg?v=1785331099"
      }
    ]
  },



  equipment: {
    id: "equipment",
    title: "裝備蛋",
    subtitle: "騎行裝備獎池",
    tierClass: "gold",
    badge: "🥇 每週限中 1 次",
    cost: 500,
    limitType: "weekly_physical_once",
    fallbackCoupon: {
      name: "100 元折扣碼",
      value: "100 元"
    },
    statusLabel: "每週限中 1 次實體獎品",
    fallbackNote: "本週已抽中任一裝備獎項後，後續抽獎改發「100 元折扣碼」回饋。",
    inviteEnabled: true,
    inviteCap: 6,
    prizes: [
      {
        name: "兒童風衣外套",
        pct: "34%",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/ZELO-_-_-_-_11_-ZELO-5720312.jpg?v=1763387744"
      },
      {
        name: "PRO-TYPE 車褲",
        pct: "33%",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/p1_16ee97d2-e464-49cc-9202-3b347d7a786e.jpg?v=1785332079"
      },
      {
        name: "吊帶車褲",
        pct: "33%",
        imageUrl: "https://cdn.shopify.com/s/files/1/0798/9844/4087/files/bg_b896a3b9-78e2-42ab-932d-f8461fc7355d.jpg?v=1785332079"
      }
    ]
  }
};


function installZeloGachaFrontendStyle() {
  if (document.getElementById("zg-gacha-frontend-style")) return;

  const style = document.createElement("style");
  style.id = "zg-gacha-frontend-style";
  style.textContent = `
    #zelo-weekly-gacha-container {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    .zg-gacha-app {
      width: 100% !important;
      border-radius: 22px !important;
      background: linear-gradient(180deg, rgba(30,34,62,.96), rgba(14,18,38,.96)) !important;
      border: 1px solid rgba(255,255,255,.12) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 14px 28px rgba(0,0,0,.28) !important;
      color: #fff !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      font-family: inherit !important;
    }

    .zg-gacha-line-invite-box {
  margin-top: 12px !important;
  padding: 12px !important;
  background: rgba(0,0,0,.28) !important;
  border-radius: 12px !important;
  text-shadow: none !important;
}

.zg-gacha-invite-counter {
  font-size: 13px !important;
  font-weight: 950 !important;
  margin-bottom: 10px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  color: #fff !important;
}

.zg-gacha-count-badge {
  background: rgba(255,255,255,.28) !important;
  padding: 3px 10px !important;
  border-radius: 999px !important;
  font-size: 12px !important;
  font-weight: 950 !important;
}

.zg-gacha-line-btn {
  width: 100% !important;
  background: #06C755 !important;
  color: #fff !important;
  border: 0 !important;
  padding: 13px 10px !important;
  border-radius: 10px !important;
  font-weight: 1000 !important;
  font-size: 15px !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
}

.zg-gacha-line-btn:disabled {
  background: #555 !important;
  cursor: not-allowed !important;
  opacity: .8 !important;
}

.zg-gacha-invite-rule {
  font-size: 11px !important;
  opacity: .95 !important;
  margin-top: 9px !important;
  line-height: 1.6 !important;
  color: #ffe9a8 !important;
}

.zg-gacha-fallback-note {
  font-size: 12px !important;
  opacity: .96 !important;
  margin-top: 10px !important;
  font-style: italic !important;
  background: rgba(0,0,0,.26) !important;
  padding: 8px 10px !important;
  border-radius: 8px !important;
  color: rgba(255,255,255,.94) !important;
}


    .zg-gacha-app-nav {
      position: sticky !important;
      top: 0 !important;
      z-index: 5 !important;
      background: rgba(18,18,31,.95) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border-bottom: 1px solid rgba(255,255,255,.08) !important;
      padding: 14px 16px 0 !important;
    }

    .zg-gacha-app-title {
      font-size: 18px !important;
      font-weight: 1000 !important;
      margin-bottom: 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      color: #fff !important;
    }

    .zg-gacha-app-tabs {
      display: flex !important;
      gap: 4px !important;
    }

    .zg-gacha-app-tab {
      flex: 1 !important;
      text-align: center !important;
      padding: 10px 0 !important;
      font-size: 14px !important;
      font-weight: 950 !important;
      color: rgba(255,255,255,.52) !important;
      cursor: pointer !important;
      border: 0 !important;
      background: transparent !important;
      border-bottom: 3px solid transparent !important;
      transition: all .2s ease !important;
    }

    .zg-gacha-app-tab.is-active {
      color: #fff !important;
      border-bottom-color: #ffd166 !important;
    }

    .zg-gacha-page {
      display: none !important;
      padding: 16px !important;
    }

    .zg-gacha-page.is-active {
      display: block !important;
    }

    .zg-gacha-status-summary {
      display: grid !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 10px !important;
      margin-bottom: 16px !important;
    }

    .zg-gacha-summary-card {
      background: rgba(255,255,255,.07) !important;
      border-radius: 14px !important;
      padding: 11px 10px !important;
      text-align: center !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-summary-card strong {
      display: block !important;
      font-size: 18px !important;
      color: #ffd166 !important;
      font-weight: 1000 !important;
      line-height: 1 !important;
    }

    .zg-gacha-summary-card span {
      display: block !important;
      margin-top: 5px !important;
      font-size: 11px !important;
      color: rgba(255,255,255,.62) !important;
      font-weight: 850 !important;
    }

    .zg-gacha-pool-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
    }

    .zg-gacha-pool-card {
      width: 100% !important;
      border-radius: 18px !important;
      padding: 16px !important;
      color: #fff !important;
      position: relative !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.35) !important;
      text-shadow: 0 1px 3px rgba(0,0,0,.45) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
    }

    .zg-gacha-pool-card.bronze {
      background: linear-gradient(160deg, #6e3d1f 0%, #a05a2c 50%, #4d2a14 100%) !important;
    }

    .zg-gacha-pool-card.silver {
      background: linear-gradient(160deg, #4a5560 0%, #6d7a86 50%, #2f373f 100%) !important;
    }

    .zg-gacha-pool-card.gold {
      background: linear-gradient(160deg, #8a5a00 0%, #c98a12 50%, #5c3c00 100%) !important;
    }

    .zg-gacha-badge {
      display: inline-block !important;
      font-size: 12px !important;
      padding: 4px 10px !important;
      border-radius: 999px !important;
      background: rgba(0,0,0,.35) !important;
      margin-bottom: 8px !important;
      font-weight: 950 !important;
    }

    .zg-gacha-pool-title {
      font-size: 21px !important;
      font-weight: 1000 !important;
      margin-bottom: 2px !important;
      line-height: 1.15 !important;
    }

    .zg-gacha-pool-subtitle {
      font-size: 13px !important;
      opacity: .9 !important;
      margin-bottom: 10px !important;
    }

    .zg-gacha-weekly-status {
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      font-size: 13px !important;
      font-weight: 950 !important;
      padding: 8px 10px !important;
      border-radius: 9px !important;
      margin-bottom: 10px !important;
      text-shadow: none !important;
    }

    .zg-gacha-weekly-status.is-ok {
      background: rgba(30,150,90,.9) !important;
    }

    .zg-gacha-weekly-status.is-used {
      background: rgba(180,40,30,.9) !important;
    }

    .zg-gacha-weekly-status.is-locked {
      background: rgba(0,0,0,.32) !important;
      color: #ffe9a8 !important;
    }

    .zg-gacha-status-dot {
      width: 8px !important;
      height: 8px !important;
      border-radius: 999px !important;
      background: #fff !important;
      flex: 0 0 auto !important;
    }

    .zg-gacha-prizes-preview {
      display: flex !important;
      gap: 8px !important;
      margin-bottom: 12px !important;
    }

    .zg-gacha-prize-thumb {
      flex: 1 !important;
      background: rgba(0,0,0,.3) !important;
      border-radius: 10px !important;
      padding: 6px !important;
      text-align: center !important;
      overflow: hidden !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-prize-thumb img {
      width: 100% !important;
      height: 62px !important;
      object-fit: cover !important;
      border-radius: 6px !important;
      display: block !important;
      background: #fff !important;
    }

    .zg-gacha-placeholder-icon {
      width: 100% !important;
      height: 62px !important;
      border-radius: 6px !important;
      border: 1.5px dashed rgba(255,255,255,.7) !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 10px !important;
      color: rgba(255,255,255,.95) !important;
      line-height: 1.3 !important;
      padding: 2px !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-placeholder-icon strong {
      font-size: 17px !important;
      line-height: 1 !important;
      margin-bottom: 3px !important;
    }

    .zg-gacha-prize-name {
      font-size: 11.5px !important;
      margin-top: 5px !important;
      font-weight: 950 !important;
      line-height: 1.25 !important;
      color: #fff !important;
    }

    .zg-gacha-prize-pct {
      font-size: 11px !important;
      opacity: .95 !important;
      background: rgba(255,255,255,.2) !important;
      border-radius: 4px !important;
      padding: 1px 4px !important;
      display: inline-block !important;
      margin-top: 2px !important;
    }

    .zg-gacha-cost-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 10px !important;
      margin-top: 4px !important;
    }

    .zg-gacha-cost {
      font-size: 15px !important;
      font-weight: 1000 !important;
    }

    .zg-gacha-cost span {
      opacity: .85 !important;
      font-size: 12px !important;
    }

    .zg-gacha-draw-btn {
      background: #fff !important;
      color: #222 !important;
      border: 0 !important;
      padding: 10px 18px !important;
      border-radius: 999px !important;
      font-weight: 1000 !important;
      font-size: 13.5px !important;
      cursor: pointer !important;
      text-shadow: none !important;
      white-space: nowrap !important;
    }

    .zg-gacha-draw-btn:disabled {
      opacity: .5 !important;
      cursor: not-allowed !important;
    }

    .zg-gacha-fallback-note {
      font-size: 11.5px !important;
      opacity: .9 !important;
      margin-top: 8px !important;
      font-style: italic !important;
      background: rgba(0,0,0,.25) !important;
      padding: 7px 8px !important;
      border-radius: 7px !important;
    }

    .zg-gacha-rewards-head {
      margin-bottom: 16px !important;
    }

    .zg-gacha-rewards-title {
      font-size: 20px !important;
      font-weight: 1000 !important;
    }

    .zg-gacha-rewards-subtitle {
      font-size: 12.5px !important;
      opacity: .62 !important;
      margin-top: 2px !important;
    }

    .zg-gacha-filter-tabs {
      display: flex !important;
      gap: 8px !important;
      margin-bottom: 16px !important;
      overflow-x: auto !important;
      padding-bottom: 4px !important;
    }

    .zg-gacha-filter-tab {
      flex-shrink: 0 !important;
      padding: 7px 16px !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.08) !important;
      border: 1px solid rgba(255,255,255,.15) !important;
      font-size: 12.5px !important;
      font-weight: 950 !important;
      color: #ccc !important;
      cursor: pointer !important;
      white-space: nowrap !important;
    }

    .zg-gacha-filter-tab.is-active {
      background: #fff !important;
      color: #12121f !important;
      border-color: #fff !important;
    }

    .zg-gacha-reward-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 10px !important;
    }

    .zg-gacha-reward-item {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      background: rgba(255,255,255,.055) !important;
      border-radius: 14px !important;
      padding: 12px !important;
      border: 1px solid rgba(255,255,255,.08) !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .zg-gacha-reward-img,
    .zg-gacha-reward-icon {
      width: 52px !important;
      height: 52px !important;
      border-radius: 10px !important;
      background: rgba(255,255,255,.12) !important;
      flex: 0 0 auto !important;
    }

    .zg-gacha-reward-img {
      object-fit: cover !important;
      background: #fff !important;
    }

    .zg-gacha-reward-icon {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 22px !important;
    }

    .zg-gacha-reward-info {
      flex: 1 !important;
      min-width: 0 !important;
    }

    .zg-gacha-reward-name {
      font-size: 14px !important;
      font-weight: 950 !important;
      margin-bottom: 4px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }

    .zg-gacha-reward-meta {
      font-size: 11px !important;
      opacity: .65 !important;
      display: flex !important;
      gap: 6px !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      line-height: 1.4 !important;
    }

    .zg-gacha-pool-tag {
      font-size: 10px !important;
      padding: 1px 7px !important;
      border-radius: 999px !important;
      font-weight: 950 !important;
      background: rgba(255,209,102,.2) !important;
      color: #ffd166 !important;
    }

    .zg-gacha-reward-side {
      text-align: right !important;
      flex: 0 0 auto !important;
    }

    .zg-gacha-reward-code {
      font-family: "Courier New", monospace !important;
      font-size: 13px !important;
      font-weight: 1000 !important;
      color: #ffd166 !important;
      margin-bottom: 4px !important;
    }

    .zg-gacha-status-pill {
      font-size: 10.5px !important;
      font-weight: 950 !important;
      padding: 3px 9px !important;
      border-radius: 999px !important;
      display: inline-block !important;
      background: rgba(46,204,113,.25) !important;
      color: #2ecc71 !important;
    }

    .zg-gacha-empty {
      text-align: center !important;
      padding: 46px 20px !important;
      color: rgba(255,255,255,.5) !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
    }

    .zg-gacha-empty strong {
      display: block !important;
      font-size: 36px !important;
      margin-bottom: 8px !important;
    }

    @media (min-width: 760px) {
      .zg-gacha-pool-list {
        display: grid !important;
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        align-items: stretch !important;
      }
    }

    @media (max-width: 430px) {
      .zg-gacha-page {
        padding: 14px 12px !important;
      }

      .zg-gacha-status-summary {
        gap: 8px !important;
      }

      .zg-gacha-summary-card {
        padding: 10px 6px !important;
      }

      .zg-gacha-summary-card strong {
        font-size: 16px !important;
      }

      .zg-gacha-prizes-preview {
        gap: 6px !important;
      }

      .zg-gacha-prize-thumb {
        padding: 5px !important;
      }

      .zg-gacha-prize-thumb img,
      .zg-gacha-placeholder-icon {
        height: 66px !important;
      }

      .zg-gacha-cost-row {
        flex-wrap: wrap !important;
      }

      .zg-gacha-draw-btn {
        width: 100% !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function renderWeeklyGachaBanner(result) {
  installZeloGachaFrontendStyle();

  window.ZELO_LAST_WEEKLY_GACHA_RENDER = {
    at: new Date().toISOString(),
    mode: "three_pool_with_rewards",
    result: result || null,
    hasZeloGacha: !!window.ZeloGacha
  };

  const resultScreen =
    typeof screenResult === "function"
      ? screenResult()
      : document.getElementById("screen-result");

  const resultMain =
    resultScreen
      ? resultScreen.querySelector(".zg-result-main")
      : document.querySelector(".zg-result-main");

  let root = document.getElementById("zelo-weekly-gacha-container");

  if (!root && typeof ensureWeeklyGachaContainer === "function") {
    root = ensureWeeklyGachaContainer(resultScreen, resultMain);
  }

  if (!root) {
    root = document.createElement("div");
    root.id = "zelo-weekly-gacha-container";
    root.className = "zg-weekly-gacha-root";

    if (resultMain) {
      resultMain.appendChild(root);
    } else {
      document.body.appendChild(root);
    }
  }

  root.style.setProperty("display", "block", "important");
  root.style.setProperty("visibility", "visible", "important");
  root.style.setProperty("opacity", "1", "important");

  root.innerHTML = `
    <section class="zg-gacha-app" aria-label="ZELO 三獎池抽獎系統">
      <div class="zg-gacha-app-nav">
        <div class="zg-gacha-app-title">
          🎰 ZELO 幸運扭蛋機
        </div>

        <div class="zg-gacha-app-tabs">
          <button
            class="zg-gacha-app-tab ${ZELO_GACHA_FRONTEND_STATE.currentPage === "gacha" ? "is-active" : ""}"
            type="button"
            data-zg-gacha-page="gacha"
          >
            抽獎
          </button>

          <button
            class="zg-gacha-app-tab ${ZELO_GACHA_FRONTEND_STATE.currentPage === "rewards" ? "is-active" : ""}"
            type="button"
            data-zg-gacha-page="rewards"
          >
            我的獎勵
          </button>
        </div>
      </div>

      <div
        class="zg-gacha-page ${ZELO_GACHA_FRONTEND_STATE.currentPage === "gacha" ? "is-active" : ""}"
        data-zg-gacha-page-panel="gacha"
      >
        <div id="zg-gacha-draw-page">
          <div class="zg-gacha-empty">
            <strong>🎰</strong>
            正在讀取抽獎狀態...
          </div>
        </div>
      </div>

      <div
        class="zg-gacha-page ${ZELO_GACHA_FRONTEND_STATE.currentPage === "rewards" ? "is-active" : ""}"
        data-zg-gacha-page-panel="rewards"
      >
        <div id="zg-gacha-rewards-page">
          ${renderGachaRewardsPageHtml()}
        </div>
      </div>
    </section>
  `;

  bindZeloGachaFrontendEvents(root);
  loadZeloThreePoolStatus(result || {});
  renderGachaRewards();
}

async function loadZeloThreePoolStatus(result) {
  const mount = document.getElementById("zg-gacha-draw-page");

  if (!mount) return;

  if (!window.ZeloGacha || typeof window.ZeloGacha.getStatus !== "function") {
    mount.innerHTML = `
      <div class="zg-gacha-empty">
        <strong>⚠️</strong>
        找不到 ZeloGacha 核心模組。
      </div>
    `;
    return;
  }

  try {
    ZELO_GACHA_FRONTEND_STATE.loading = true;

    const status = await window.ZeloGacha.getStatus(result || {});

    ZELO_GACHA_FRONTEND_STATE.loading = false;
    ZELO_GACHA_FRONTEND_STATE.lastStatus = status;
    window.ZELO_LAST_THREE_POOL_STATUS = status;

    if (!status || !status.ok) {
      mount.innerHTML = `
        <div class="zg-gacha-empty">
          <strong>⚠️</strong>
          讀取抽獎狀態失敗<br>
          ${escapeHtml(status?.message || status?.code || "請稍後再試")}
        </div>
      `;
      return;
    }

    mount.innerHTML = renderGachaDrawPageHtml(status);
  } catch (error) {
    ZELO_GACHA_FRONTEND_STATE.loading = false;

    console.warn("[ZELO THREE GACHA] status failed", error);

    mount.innerHTML = `
      <div class="zg-gacha-empty">
        <strong>⚠️</strong>
        讀取抽獎狀態失敗，請稍後再試。
      </div>
    `;
  }
}

function renderGachaDrawPageHtml(status) {
  const pools = Array.isArray(status.pools) ? status.pools : [];
  const inviteCount = Number(status.inviteCount ?? status.lineInviteFriendCount ?? 0) || 0;
  const points = Number(status.zeloPoints || 0) || 0;
  const weekKey = status.weekKey || "-";

  return `
    <div class="zg-gacha-status-summary">
      <div class="zg-gacha-summary-card">
        <strong>${points}</strong>
        <span>ZELO Points</span>
      </div>

      <div class="zg-gacha-summary-card">
        <strong>${inviteCount}</strong>
        <span>邀請好友</span>
      </div>

      <div class="zg-gacha-summary-card">
        <strong>本週</strong>
        <span>${escapeHtml(weekKey)}</span>
      </div>
    </div>

    <div class="zg-gacha-pool-list">
      ${["welfare", "accessory", "equipment"].map((poolId) => {
        const pool =
          pools.find((item) => {
            const id = item.poolId || item.id || "";
            return id === poolId || (id === "gear" && poolId === "equipment");
          }) || {
            poolId,
            canDraw: false,
            drawn: false,
            enoughPoints: false,
            enoughInvites: false
          };

        return renderThreePoolCard(pool, status);
      }).join("")}
    </div>
  `;
}

function renderThreePoolCard(pool, status) {
  const rawPoolId = pool.poolId || pool.id || "";
  const normalizedPoolId =
    rawPoolId === "gear"
      ? "equipment"
      : rawPoolId || "welfare";

  const view =
    ZELO_GACHA_POOL_VIEW[normalizedPoolId] ||
    ZELO_GACHA_POOL_VIEW.welfare;

  const points =
    Number(status.zeloPoints || 0) || 0;

  const cost =
    Number(pool.cost ?? view.cost ?? 0) || 0;

  const weeklyRemaining =
    Number(
      pool.weeklyRemaining ??
      pool.remainingWeeklyChance ??
      pool.remainingChance ??
      pool.remainingDraws ??
      0
    ) || 0;

  const weeklyPhysicalWon =
    !!(
      pool.weeklyPhysicalWon ||
      pool.hasWeeklyPhysicalReward ||
      pool.physicalDrawn ||
      pool.drawn
    );

  const soldOut =
    !!(
      pool.soldOut ||
      pool.isSoldOut ||
      pool.stockEmpty ||
      pool.inventoryEmpty
    );

  const extraChanceCount =
    Number(
      pool.extraChanceCount ??
      pool.inviteChanceCount ??
      pool.bonusDrawChance ??
      pool.bonusChance ??
      0
    ) || 0;

  const enoughPoints = points >= cost;

  let showStatusBar = false;
  let stateClass = "is-ok";
  let stateText = "";
  let canDraw = false;
  let drawMode = "points";
  let buttonText = "立即抽獎";

  if (normalizedPoolId === "welfare") {
    showStatusBar = false;

    if (enoughPoints) {
      canDraw = true;
      drawMode = "points";
      buttonText = "立即抽獎";
    } else {
      canDraw = false;
      stateClass = "is-locked";
      stateText = `Points 不足，還差 ${Math.max(cost - points, 0)} 點`;
      buttonText = "Points 不足";
    }
  } else {
    showStatusBar = true;

    if (soldOut) {
      canDraw = false;
      stateClass = "is-soldout";
      stateText = "此獎已被抽中，期待下週再抽";
      buttonText = "期待下週再抽";
    } else if (enoughPoints) {
      canDraw = true;
      drawMode = "points";

      if (weeklyPhysicalWon || weeklyRemaining <= 0) {
        stateClass = "is-used";
        stateText = "已用完（下次重置：週一 00:00）";
      } else {
        stateClass = "is-ok";
        stateText = `本週剩餘機會：${weeklyRemaining || 1} 次`;
      }

      buttonText = "立即抽獎";
    } else if (extraChanceCount > 0) {
      canDraw = true;
      drawMode = "bonus";
      stateClass = "is-bonus";
      stateText = `可使用好友邀請額外機會：${extraChanceCount} 次`;
      buttonText = "使用額外機會抽獎";
    } else {
      canDraw = false;
      stateClass = "is-locked";
      stateText = `Points 不足，還差 ${Math.max(cost - points, 0)} 點`;
      buttonText = "Points 不足";
    }
  }

  const disabled =
    !canDraw ||
    ZELO_GACHA_FRONTEND_STATE.drawingPoolId === normalizedPoolId;

  const finalButtonText =
    ZELO_GACHA_FRONTEND_STATE.drawingPoolId === normalizedPoolId
      ? "抽獎中..."
      : buttonText;

  return `
    <article class="zg-gacha-pool-card ${escapeAttr(view.tierClass)}">
      <div class="zg-gacha-badge">
        ${escapeHtml(view.badge)}
      </div>

      <div class="zg-gacha-pool-title">
        ${escapeHtml(view.title)}
      </div>

      <div class="zg-gacha-pool-subtitle">
        ${escapeHtml(view.subtitle)}
      </div>

      ${
        showStatusBar
          ? `
            <div class="zg-gacha-weekly-status ${escapeAttr(stateClass)}">
              <span class="zg-gacha-status-dot"></span>
              ${escapeHtml(stateText)}
            </div>
          `
          : ""
      }

      ${
        normalizedPoolId === "welfare" && !enoughPoints
          ? `
            <div class="zg-gacha-weekly-status is-locked">
              <span class="zg-gacha-status-dot"></span>
              ${escapeHtml(stateText)}
            </div>
          `
          : ""
      }

      <div class="zg-gacha-prizes-preview">
        ${view.prizes.map(function(prize) {
          const media = prize.imageUrl
            ? `
              <img
                src="${escapeAttr(prize.imageUrl)}"
                alt="${escapeAttr(prize.name)}"
                loading="lazy"
              >
            `
            : `
              <div class="zg-gacha-placeholder-icon">
                <strong>${escapeHtml(prize.icon || "🎫")}</strong>
                圖片連結：待補
              </div>
            `;

          return `
            <div class="zg-gacha-prize-thumb">
              ${media}
              <div class="zg-gacha-prize-name">
                ${escapeHtml(prize.name)}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <div class="zg-gacha-cost-row">
        <div class="zg-gacha-cost">
          ${cost}
          <span>Points/次</span>
        </div>

        <button
          class="zg-gacha-draw-btn"
          type="button"
          data-zg-three-gacha-draw="${escapeAttr(normalizedPoolId)}"
          data-zg-draw-mode="${escapeAttr(drawMode)}"
          ${disabled ? "disabled" : ""}
        >
          ${escapeHtml(finalButtonText)}
        </button>
      </div>

      ${
        view.fallbackNote
          ? `
            <div class="zg-gacha-fallback-note">
              ${escapeHtml(view.fallbackNote)}
            </div>
          `
          : ""
      }

      ${
        view.inviteEnabled
          ? renderGachaInviteBox(normalizedPoolId, status, pool)
          : ""
      }
    </article>
  `;
}


function renderGachaInviteBox(poolId, status, pool) {
  pool = pool || {};
  status = status || {};

  var inviteCount =
    Number(
      pool.weeklyInviteCount != null
        ? pool.weeklyInviteCount
        : status.inviteCount != null
          ? status.inviteCount
          : status.lineInviteFriendCount != null
            ? status.lineInviteFriendCount
            : status.weeklyInviteCount != null
              ? status.weeklyInviteCount
              : 0
    ) || 0;

  var extraChanceCount =
    Number(
      pool.extraChanceCount != null
        ? pool.extraChanceCount
        : pool.inviteChanceCount != null
          ? pool.inviteChanceCount
          : pool.bonusDrawChance != null
            ? pool.bonusDrawChance
            : pool.bonusChance != null
              ? pool.bonusChance
              : 0
    ) || 0;

  var inviteCap =
    Number(
      pool.inviteCap != null
        ? pool.inviteCap
        : status.inviteCap != null
          ? status.inviteCap
          : 6
    ) || 6;

  var reachedCap = inviteCount >= inviteCap;

  return [
    '<div class="zg-gacha-line-invite-box is-secondary">',
      '<div class="zg-gacha-invite-counter">',
        '<span>LINE 好友邀請</span>',
        '<span class="zg-gacha-count-badge">',
          inviteCount,
          ' / ',
          inviteCap,
          ' 次',
        '</span>',
      '</div>',

      '<div class="zg-gacha-extra-chance-text">',
        '目前額外機會：',
        extraChanceCount,
        ' 次',
      '</div>',

      '<button',
        ' class="zg-gacha-line-btn is-secondary"',
        ' type="button"',
        ' data-zg-action="share"',
        ' data-zg-line-invite="',
        escapeAttr(poolId),
        '"',
        reachedCap ? ' disabled' : '',
      '>',
        reachedCap
          ? '本週邀請已達上限'
          : '邀請 LINE 好友取得額外機會',
      '</button>',

      '<div class="zg-gacha-invite-rule">',
        '邀請成功後可獲得 1 次額外抽獎機會，每週最多 ',
        inviteCap,
        ' 次。',
      '</div>',
    '</div>'
  ].join("");
}


  

function renderGachaRewardsPageHtml() {
  return `
    <div class="zg-gacha-rewards-head">
      <div class="zg-gacha-rewards-title">🎁 我的獎勵</div>
      <div class="zg-gacha-rewards-subtitle">
        查看中獎紀錄、折扣碼與實體獎品。
      </div>
    </div>

    <div class="zg-gacha-status-summary">
      <div class="zg-gacha-summary-card">
        <strong id="zg-gacha-sum-total">0</strong>
        <span>總紀錄</span>
      </div>

      <div class="zg-gacha-summary-card">
        <strong id="zg-gacha-sum-unused">0</strong>
        <span>可使用</span>
      </div>

      <div class="zg-gacha-summary-card">
        <strong id="zg-gacha-sum-used">0</strong>
        <span>已使用</span>
      </div>
    </div>

    <div class="zg-gacha-filter-tabs">
      <button class="zg-gacha-filter-tab is-active" type="button" data-zg-reward-filter="all">
        全部
      </button>
      <button class="zg-gacha-filter-tab" type="button" data-zg-reward-filter="unused">
        可使用
      </button>
      <button class="zg-gacha-filter-tab" type="button" data-zg-reward-filter="used">
        已使用
      </button>
      <button class="zg-gacha-filter-tab" type="button" data-zg-reward-filter="expired">
        已過期
      </button>
    </div>

    <div class="zg-gacha-reward-list" id="zg-gacha-reward-list"></div>
  `;
}

function renderGachaRewards() {
  const list = document.getElementById("zg-gacha-reward-list");
  if (!list) return;

  let records = [];

  if (window.ZeloGacha && typeof window.ZeloGacha.getRewardRecords === "function") {
    records = window.ZeloGacha.getRewardRecords("all") || [];
  }

  /*
   * 目前後端還沒有 weekly_gacha_reward_history 時，
   * 這裡會顯示本次 session 抽到的暫存紀錄。
   */
  records = Array.isArray(records) ? records : [];

  ZELO_GACHA_FRONTEND_STATE.rewards = records;

  const total = records.length;
  const unused = records.filter((item) => (item.status || "unused") === "unused").length;
  const used = records.filter((item) => item.status === "used").length;

  const totalEl = document.getElementById("zg-gacha-sum-total");
  const unusedEl = document.getElementById("zg-gacha-sum-unused");
  const usedEl = document.getElementById("zg-gacha-sum-used");

  if (totalEl) totalEl.textContent = String(total);
  if (unusedEl) unusedEl.textContent = String(unused);
  if (usedEl) usedEl.textContent = String(used);

  const filter = ZELO_GACHA_FRONTEND_STATE.currentRewardFilter || "all";

  const filtered =
    filter === "all"
      ? records
      : records.filter((item) => (item.status || "unused") === filter);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="zg-gacha-empty">
        <strong>📭</strong>
        目前沒有符合條件的獎勵紀錄
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(renderGachaRewardItem).join("");
}

function renderGachaRewardItem(record) {
  const poolId =
    record.poolId ||
    record.poolType ||
    "";

  const normalizedPoolId =
    poolId === "gear"
      ? "equipment"
      : poolId;

  const poolName =
    normalizedPoolId === "welfare"
      ? "福利蛋"
      : normalizedPoolId === "accessory"
        ? "配件蛋"
        : normalizedPoolId === "equipment"
          ? "裝備蛋"
          : "獎池";

  const name =
    record.rewardName ||
    record.name ||
    "神秘獎勵";

  const imageUrl =
    record.imageUrl ||
    record.img ||
    "";

  const code =
    record.code ||
    record.couponCode ||
    "";

  const status =
    record.status ||
    "unused";

  const statusText =
    status === "used"
      ? "已使用"
      : status === "expired"
        ? "已過期"
        : "可使用";

  const issuedAt =
    record.issuedAt ||
    record.createdAtLocal ||
    "";

  const expiresAt =
    record.expiresAt ||
    "";

  const imageHtml = imageUrl
    ? `<img class="zg-gacha-reward-img" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(name)}" loading="lazy">`
    : `<div class="zg-gacha-reward-icon">🎁</div>`;

  return `
    <article class="zg-gacha-reward-item">
      ${imageHtml}

      <div class="zg-gacha-reward-info">
        <div class="zg-gacha-reward-name">
          ${escapeHtml(name)}
        </div>

        <div class="zg-gacha-reward-meta">
          <span class="zg-gacha-pool-tag">${escapeHtml(poolName)}</span>
          ${issuedAt ? `<span>領取：${escapeHtml(issuedAt)}</span>` : ""}
        </div>

        <div class="zg-gacha-reward-meta">
          ${expiresAt ? `到期：${escapeHtml(expiresAt)}` : "無使用期限"}
        </div>
      </div>

      <div class="zg-gacha-reward-side">
        ${code ? `<div class="zg-gacha-reward-code">${escapeHtml(code)}</div>` : ""}
        <span class="zg-gacha-status-pill">
          ${escapeHtml(statusText)}
        </span>
      </div>
    </article>
  `;
}

function bindZeloGachaFrontendEvents(root) {
  if (!root || root.__zgGachaFrontendBound) return;

  root.__zgGachaFrontendBound = true;

  root.addEventListener("click", function(event) {
    if (!event || !event.target) return;

    var pageBtn = event.target.closest("[data-zg-gacha-page]");

    if (pageBtn) {
      event.preventDefault();

      var page = pageBtn.getAttribute("data-zg-gacha-page") || "gacha";
      ZELO_GACHA_FRONTEND_STATE.currentPage = page;

      root.querySelectorAll("[data-zg-gacha-page]").forEach(function(btn) {
        btn.classList.toggle("is-active", btn === pageBtn);
      });

      root.querySelectorAll("[data-zg-gacha-page-panel]").forEach(function(panel) {
        panel.classList.toggle(
          "is-active",
          panel.getAttribute("data-zg-gacha-page-panel") === page
        );
      });

      if (page === "rewards") {
        renderGachaRewards();
      }

      return;
    }

    var filterBtn = event.target.closest("[data-zg-reward-filter]");

    if (filterBtn) {
      event.preventDefault();

      ZELO_GACHA_FRONTEND_STATE.currentRewardFilter =
        filterBtn.getAttribute("data-zg-reward-filter") || "all";

      root.querySelectorAll("[data-zg-reward-filter]").forEach(function(btn) {
        btn.classList.toggle("is-active", btn === filterBtn);
      });

      renderGachaRewards();
      return;
    }

    var inviteBtn = event.target.closest("[data-zg-line-invite]");

    if (inviteBtn) {
      event.preventDefault();
      event.stopPropagation();

      var invitePoolId = inviteBtn.getAttribute("data-zg-line-invite") || "";

      if (invitePoolId) {
        requestZeloLineInvite(invitePoolId);
      }

      return;
    }

    var drawBtn = event.target.closest("[data-zg-three-gacha-draw]");

    if (drawBtn) {
      event.preventDefault();
      event.stopPropagation();

      var drawPoolId = drawBtn.getAttribute("data-zg-three-gacha-draw") || "";
      var drawMode = drawBtn.getAttribute("data-zg-draw-mode") || "points";

      if (drawPoolId) {
        drawZeloThreePool(drawPoolId, drawMode);
      }

      return;
    }
  });
}



async function requestZeloLineInvite(poolId) {
  if (!window.ZeloGacha || typeof window.ZeloGacha.requestLineInvite !== "function") {
    showToast("LINE 邀請模組尚未載入");
    return;
  }

  try {
    showToast("正在開啟 LINE 分享...");

    var result = await window.ZeloGacha.requestLineInvite(poolId);

    window.ZELO_LAST_GACHA_LINE_INVITE = result;

    if (!result || !result.ok) {
      showToast(
        result && (result.message || result.code)
          ? result.message || result.code
          : "LINE 分享失敗"
      );
      return;
    }

    showToast("已開啟 LINE 分享，等待好友完成確認");

    var lastBattleResult = {};

    if (
      window.ZELO_GAME &&
      typeof window.ZELO_GAME.getState === "function"
    ) {
      var gameState = window.ZELO_GAME.getState() || {};
      lastBattleResult = gameState.lastBattleResult || {};
    }

    await loadZeloThreePoolStatus(lastBattleResult);
  } catch (error) {
    console.warn("[ZELO THREE GACHA] line invite failed", error);
    showToast("LINE 分享失敗，請稍後再試");
  }
}

window.requestZeloLineInvite = requestZeloLineInvite;



function ensureZeloGachaModal() {
  var modal = document.getElementById("zg-three-gacha-modal");

  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "zg-three-gacha-modal";
  modal.className = "zg-three-gacha-modal";

  modal.innerHTML = [
    '<div class="zg-three-gacha-modal-panel">',
      '<div class="zg-three-gacha-video-circle">',
        '<video',
          ' class="zg-three-gacha-draw-video"',
          ' src="https://cdn.shopify.com/videos/c/o/v/7cb007e7ed0341faaf7edcfbe9dcbfff.mp4"',
          ' muted',
          ' playsinline',
          ' preload="auto"',
        '></video>',
      '</div>',

      '<div class="zg-three-gacha-result-icon">🎰</div>',

      '<div class="zg-three-gacha-modal-title">正在搖獎中...</div>',
      '<div class="zg-three-gacha-modal-text">請稍候，幸運正在轉動</div>',
    '</div>'
  ].join("");

  document.body.appendChild(modal);

  modal.addEventListener("click", function(event) {
    if (event.target === modal) {
      if (modal.classList.contains("is-rolling")) return;
      hideZeloGachaModal();
    }
  });

  return modal;
}

function showZeloGachaRollingModal() {
  var modal = ensureZeloGachaModal();

  modal.classList.add("is-open");
  modal.classList.add("is-rolling");

  var title = modal.querySelector(".zg-three-gacha-modal-title");
  var text = modal.querySelector(".zg-three-gacha-modal-text");
  var icon = modal.querySelector(".zg-three-gacha-result-icon");
  var video = modal.querySelector(".zg-three-gacha-draw-video");
  var videoCircle = modal.querySelector(".zg-three-gacha-video-circle");

  if (title) title.textContent = "正在搖獎中...";
  if (text) text.textContent = "請稍候，幸運正在轉動";

  if (icon) {
    icon.textContent = "🎰";
    icon.style.display = "none";
  }

  if (videoCircle) {
    videoCircle.style.display = "flex";
  }

  if (video) {
    try {
      video.currentTime = 0;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function(error) {
          console.warn("[ZELO THREE GACHA] draw video autoplay failed", error);
        });
      }
    } catch (error) {
      console.warn("[ZELO THREE GACHA] draw video play failed", error);
    }
  }
}

function showZeloGachaResultModal(result) {
  var modal = ensureZeloGachaModal();

  modal.classList.add("is-open");
  modal.classList.remove("is-rolling");

  var title = modal.querySelector(".zg-three-gacha-modal-title");
  var text = modal.querySelector(".zg-three-gacha-modal-text");
  var icon = modal.querySelector(".zg-three-gacha-result-icon");
  var video = modal.querySelector(".zg-three-gacha-draw-video");
  var videoCircle = modal.querySelector(".zg-three-gacha-video-circle");

  if (video) {
    try {
      video.pause();
      video.currentTime = 0;
    } catch (error) {}
  }

  if (videoCircle) {
    videoCircle.style.display = "none";
  }

  if (icon) {
  icon.style.display = "none";
}


  result = result || {};

  var reward = result.reward || {};

  var prizeName =
    result.rewardName ||
    result.prizeName ||
    reward.name ||
    result.couponName ||
    result.message ||
    "獲得獎勵";

  /*
   * 注意：
   * 不要用 result.code 當折扣碼。
   * result.code 很可能是後端狀態碼，例如 OK / SUCCESS。
   */
  var couponCode =
    result.couponCode ||
    reward.couponCode ||
    reward.code ||
    result.discountCode ||
    "";

  var isFallback =
    !!(
      result.fallback ||
      result.isFallback ||
      result.rewardType === "fallback_coupon"
    );

  var isError =
    result.rewardType === "error" ||
    result.ok === false ||
    result.type === "error";


  if (title) {
    if (isError) {
      title.textContent = "抽獎失敗";
    } else if (isFallback) {
      title.textContent = "獲得回饋獎勵";
    } else {
      title.textContent = "恭喜中獎！";
    }
  }

  if (text) {
    text.innerHTML = [
      '<strong>',
        escapeHtml(prizeName),
      '</strong>',
      couponCode
        ? '<small>折扣碼：' + escapeHtml(couponCode) + '</small>'
        : '',
      '<button type="button" class="zg-three-gacha-modal-close">',
        '確認',
      '</button>'
    ].join("");
  }

  var closeBtn = modal.querySelector(".zg-three-gacha-modal-close");

  if (closeBtn) {
    closeBtn.onclick = function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      hideZeloGachaModal();
    };
  }
}

function hideZeloGachaModal() {
  var modal = document.getElementById("zg-three-gacha-modal");

  if (!modal) return;

  var video = modal.querySelector(".zg-three-gacha-draw-video");

  if (video) {
    try {
      video.pause();
      video.currentTime = 0;
    } catch (error) {}
  }

  modal.classList.remove("is-open");
  modal.classList.remove("is-rolling");

  /*
   * 保險：直接移除，避免舊樣式或舊事件卡住畫面。
   */
  window.setTimeout(function() {
    if (
      modal &&
      modal.parentNode &&
      !modal.classList.contains("is-open")
    ) {
      modal.parentNode.removeChild(modal);
    }
  }, 80);
}

    

async function drawZeloThreePool(poolId, drawMode) {
  if (!drawMode) drawMode = "points";

  if (!window.ZeloGacha || typeof window.ZeloGacha.drawGacha !== "function") {
    showToast("抽獎模組尚未載入");
    return;
  }

  if (ZELO_GACHA_FRONTEND_STATE.drawingPoolId) return;

  ZELO_GACHA_FRONTEND_STATE.drawingPoolId = poolId;

  try {
    if (typeof renderZeloThreePoolFromState === "function") {
      renderZeloThreePoolFromState();
    }

    showZeloGachaRollingModal();

    var startedAt = Date.now();

    var result = await window.ZeloGacha.drawGacha(poolId, {
      drawMode: drawMode
    });

    var elapsed = Date.now() - startedAt;
    var waitMs = Math.max(5000 - elapsed, 0);

    await new Promise(function(resolve) {
      setTimeout(resolve, waitMs);
    });

    window.ZELO_LAST_GACHA_DRAW = result;

    if (!result || !result.ok) {
      showZeloGachaResultModal({
        ok: false,
        rewardName:
          result && (result.message || result.code)
            ? result.message || result.code
            : "抽獎失敗，請稍後再試",
        rewardType: "error"
      });

      return;
    }

    showZeloGachaResultModal(result);

    var lastBattleResult = {};

    if (
      window.ZELO_GAME &&
      typeof window.ZELO_GAME.getState === "function"
    ) {
      var gameState = window.ZELO_GAME.getState() || {};
      lastBattleResult = gameState.lastBattleResult || {};
    }

    await loadZeloThreePoolStatus(lastBattleResult);
  } catch (error) {
    console.warn("[ZELO THREE GACHA] draw failed", error);

    showZeloGachaResultModal({
      ok: false,
      rewardName: "抽獎失敗，請稍後再試",
      rewardType: "error"
    });
  } finally {
    ZELO_GACHA_FRONTEND_STATE.drawingPoolId = "";

    if (typeof renderZeloThreePoolFromState === "function") {
      renderZeloThreePoolFromState();
    }
  }
}



window.renderWeeklyGachaBanner = renderWeeklyGachaBanner;
window.loadZeloThreePoolStatus = loadZeloThreePoolStatus;
window.drawZeloThreePool = drawZeloThreePool;
window.renderGachaRewards = renderGachaRewards;



  function renderZeloThreePoolFromState() {
  var mount = document.getElementById("zg-gacha-draw-page");

  if (!mount) return;

  var status = ZELO_GACHA_FRONTEND_STATE.lastStatus;

  if (!status || !status.ok) {
    return;
  }

  try {
    mount.innerHTML = renderGachaDrawPageHtml(status);
  } catch (error) {
    console.warn("[ZELO THREE GACHA] render from state failed", error);
  }
}


/*
 * =========================================================
 * ZELO Weekly Gacha UI / 每週三蛋結果頁 UI
 * =========================================================
 */

/*
 * =========================================================
 * ZELO Weekly Gacha UI / 每週三蛋結果頁 UI
 * =========================================================
 */

function installWeeklyGachaStyle() {
  if (document.getElementById("zg-weekly-gacha-style")) return;

  const style = document.createElement("style");
  style.id = "zg-weekly-gacha-style";
  style.textContent = `
    #zelo-weekly-gacha-container {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box !important;
      overflow: visible !important;
    }

    .zg-weekly-gacha-card {
      width: 100% !important;
      box-sizing: border-box !important;
      border-radius: 20px !important;
      padding: 16px !important;
      background: linear-gradient(180deg, rgba(28,38,82,.96), rgba(14,22,52,.94)) !important;
      border: 1px solid rgba(255,224,95,.24) !important;
      color: #fff !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 12px 24px rgba(0,0,0,.24) !important;
      font-family: inherit !important;
    }

    .zg-weekly-gacha-head {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 12px !important;
      margin-bottom: 14px !important;
    }

    .zg-weekly-gacha-title {
      font-size: 22px !important;
      font-weight: 950 !important;
      line-height: 1.15 !important;
      color: #fff !important;
    }

    .zg-weekly-gacha-subtitle {
      margin-top: 5px !important;
      font-size: 13px !important;
      line-height: 1.45 !important;
      color: rgba(255,255,255,.72) !important;
    }

    .zg-weekly-gacha-points {
      flex: 0 0 auto !important;
      padding: 8px 10px !important;
      border-radius: 999px !important;
      background: rgba(255,224,95,.16) !important;
      border: 1px solid rgba(255,224,95,.25) !important;
      color: #ffe05f !important;
      font-size: 13px !important;
      font-weight: 950 !important;
      white-space: nowrap !important;
    }

    .zg-weekly-gacha-status-line {
      margin-bottom: 12px !important;
      font-size: 12px !important;
      color: rgba(255,255,255,.66) !important;
      line-height: 1.45 !important;
    }

    .zg-weekly-gacha-grid {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    .zg-weekly-pool {
      border-radius: 16px !important;
      padding: 14px !important;
      color: #fff !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      position: relative !important;
    }

    .zg-weekly-pool.welfare {
      background: linear-gradient(160deg, #6e3d1f, #a05a2c 52%, #3c1f0f) !important;
    }

    .zg-weekly-pool.accessory {
      background: linear-gradient(160deg, #4a5560, #6d7a86 52%, #2f373f) !important;
    }

    .zg-weekly-pool.equipment {
      background: linear-gradient(160deg, #8a5a00, #c98a12 52%, #4e3300) !important;
    }

    .zg-weekly-pool-top {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-start !important;
      gap: 10px !important;
      margin-bottom: 8px !important;
    }

    .zg-weekly-pool-name {
      font-size: 19px !important;
      font-weight: 950 !important;
      line-height: 1.15 !important;
    }

    .zg-weekly-pool-badge {
      display: inline-flex !important;
      padding: 4px 9px !important;
      border-radius: 999px !important;
      background: rgba(0,0,0,.28) !important;
      font-size: 11px !important;
      font-weight: 900 !important;
      white-space: nowrap !important;
    }

    .zg-weekly-pool-state {
      margin: 8px 0 !important;
      padding: 8px 10px !important;
      border-radius: 10px !important;
      font-size: 13px !important;
      font-weight: 900 !important;
      background: rgba(0,0,0,.28) !important;
    }

    .zg-weekly-pool-state.ok {
      background: rgba(26,170,96,.82) !important;
    }

    .zg-weekly-pool-state.used {
      background: rgba(190,52,42,.86) !important;
    }

    .zg-weekly-pool-state.locked {
      background: rgba(0,0,0,.34) !important;
      color: #ffe9a8 !important;
    }

    .zg-weekly-pool-meta {
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      gap: 8px !important;
      margin: 10px 0 !important;
    }

    .zg-weekly-pool-meta div {
      background: rgba(0,0,0,.22) !important;
      border-radius: 10px !important;
      padding: 8px !important;
      font-size: 12px !important;
      color: rgba(255,255,255,.78) !important;
    }

    .zg-weekly-pool-meta strong {
      display: block !important;
      margin-top: 3px !important;
      font-size: 15px !important;
      color: #fff !important;
    }

    .zg-weekly-draw-btn {
      width: 100% !important;
      min-height: 42px !important;
      border: 0 !important;
      border-radius: 999px !important;
      background: #fff !important;
      color: #222 !important;
      font-size: 14px !important;
      font-weight: 950 !important;
      cursor: pointer !important;
    }

    .zg-weekly-draw-btn:disabled {
      opacity: .5 !important;
      cursor: not-allowed !important;
    }

    .zg-weekly-last {
      margin-top: 10px !important;
      padding: 8px 10px !important;
      border-radius: 10px !important;
      background: rgba(0,0,0,.24) !important;
      color: rgba(255,255,255,.82) !important;
      font-size: 12px !important;
      line-height: 1.45 !important;
    }

    .zg-weekly-gacha-loading,
    .zg-weekly-gacha-error {
      padding: 16px !important;
      border-radius: 16px !important;
      background: rgba(255,255,255,.08) !important;
      color: rgba(255,255,255,.8) !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      text-align: center !important;
    }
  `;

  document.head.appendChild(style);
}








  

/*
 * 開機時把伺服器記錄的隱藏陀螺解鎖清單同步回本機 localStorage，
 * 避免玩家換裝置 / 清除瀏覽器快取後，
 * 明明已經兌換過卻被誤判為「尚未解鎖」。
 *
 * 注意：
 * action 名稱 "getPlayerSecretUnlocks" 為假設值，
 * 請與後端 doPost / doGet 實際註冊的 action 字串核對後再確定。
 */
async function syncSecretUnlocksFromServer(userId) {
  if (!userId) {
    console.warn("[ZELO SECRET SYNC] skipped: missing userId");
    return;
  }

  const result = await postToZeloBackend({
    action: "getPlayerSecretUnlocks",
    userId: userId,
    lineUserId: userId
  });

  if (!result.ok || !result.data || !Array.isArray(result.data.unlocks)) {
    console.warn("[ZELO SECRET SYNC] no unlock data from server", result);
    return;
  }

  try {
    const serverToyIds = result.data.unlocks
      .map(function(item) {
        return item.toyId || item.topId || item.id || "";
      })
      .filter(Boolean);

    const localCache = getUnlockedSecretTops();
    const merged = Array.from(new Set(localCache.concat(serverToyIds)));

    localStorage.setItem(SECRET_UNLOCK_STORAGE_KEY, JSON.stringify(merged));

    console.log("[ZELO SECRET SYNC] synced unlocks:", merged);

    if (typeof renderSecretTopList === "function") {
      renderSecretTopList();
    }

    track("secret_unlocks_synced", {
      userId: userId,
      count: merged.length
    });
  } catch (error) {
    console.warn("[ZELO SECRET SYNC] failed to merge unlocks:", error);
  }
}

window.syncSecretUnlocksFromServer = syncSecretUnlocksFromServer;

  

function getZeloLocalStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getZeloLocalStorageValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch (err) {
    return fallback;
  }
}

  /*
 * ZELO Player Identity
 * Desktop browser:
 *   - may only have referralCode
 * LINE LIFF:
 *   - userId / lineUserId / displayName / pictureUrl
 * Used by handleGachaDraw() to sync GachaDraws records.
 */


function getZeloPlayerIdentitySync() {
  const referralCode =
    getZeloLocalStorageValue("zg_referral_code", "") ||
    getZeloLocalStorageValue("zelo_referral_code", "") ||
    getZeloLocalStorageValue("referralCode", "") ||
    (typeof getMyReferralCode === "function" ? getMyReferralCode() : "");

  const candidates = [
    {
      userId: typeof getUserId === "function" ? getUserId() : "",
      lineUserId: window.ZELO_LINE_USER_ID || window.lineUserId || "",
      playerName:
        window.ZELO_PLAYER_NAME ||
        window.playerName ||
        window.currentPlayerName ||
        "",
      referralCode: referralCode || ""
    },
    window.ZELO_PLAYER,
    window.zeloPlayer,
    window.currentPlayer,
    window.LINE_PROFILE,
    window.liffProfile,
    getZeloLocalStorageJson("zelo_player"),
    getZeloLocalStorageJson("ZELO_PLAYER"),
    getZeloLocalStorageJson("line_profile"),
    getZeloLocalStorageJson("liff_profile"),
    getZeloLocalStorageJson("zelo_user"),
    getZeloLocalStorageJson("ZELO_USER")
  ].filter(Boolean);

  const picked = candidates.find((item) => {
    return item && (
      item.userId ||
      item.userid ||
      item.user_id ||
      item.lineUserId ||
      item.lineUserid ||
      item.line_user_id ||
      item.id ||
      item.sub ||
      item.displayName ||
      item.display_name ||
      item.name ||
      item.playerName
    );
  }) || {};

  const userId =
    picked.userId ||
    picked.userid ||
    picked.user_id ||
    picked.lineUserId ||
    picked.lineUserid ||
    picked.line_user_id ||
    picked.id ||
    picked.sub ||
    "";

  const lineUserId =
    picked.lineUserId ||
    picked.lineUserid ||
    picked.line_user_id ||
    picked.userId ||
    picked.userid ||
    picked.user_id ||
    picked.id ||
    picked.sub ||
    "";

  const playerName =
    picked.playerName ||
    picked.displayName ||
    picked.display_name ||
    picked.name ||
    window.ZELO_PLAYER_NAME ||
    window.playerName ||
    window.currentPlayerName ||
    "";

  return {
    userId,
    lineUserId,
    playerName,
    referralCode:
      picked.referralCode ||
      picked.refCode ||
      picked.inviteCode ||
      referralCode ||
      "",
    pictureUrl:
      picked.pictureUrl ||
      picked.picture_url ||
      picked.picture ||
      picked.avatar ||
      ""
  };
}

async function getZeloPlayerIdentity() {
  const baseIdentity = getZeloPlayerIdentitySync();

  try {
    if (
      window.liff &&
      typeof window.liff.isLoggedIn === "function" &&
      window.liff.isLoggedIn() &&
      typeof window.liff.getProfile === "function"
    ) {
      const profile = await window.liff.getProfile();

      if (profile) {
        const profileUserId =
          profile.userId ||
          profile.userid ||
          profile.user_id ||
          "";

        const profileName =
          profile.displayName ||
          profile.display_name ||
          profile.name ||
          "";

        const identity = {
          userId: profileUserId || baseIdentity.userId || "",
          lineUserId: profileUserId || baseIdentity.lineUserId || "",
          playerName: profileName || baseIdentity.playerName || "你",
          referralCode: baseIdentity.referralCode || "",
          pictureUrl:
            profile.pictureUrl ||
            profile.picture_url ||
            baseIdentity.pictureUrl ||
            ""
        };

        try {
          localStorage.setItem("line_profile", JSON.stringify(profile));
          localStorage.setItem("zelo_player", JSON.stringify(identity));

          window.ZELO_LINE_USER_ID = identity.lineUserId || "";
          window.ZELO_PLAYER_NAME = identity.playerName || "";
          window.ZELO_PLAYER = identity;
        } catch (err) {}

        return identity;
      }
    }
  } catch (err) {
    console.warn("[ZELO GACHA IDENTITY] liff profile failed", err);
  }

  return baseIdentity;
}



/*
 * =========================================================
 * 抽獎專用的身份取得工具函式
 * =========================================================
 */
function getZeloGachaIdentity_() {
  const profilePayload =
    typeof getProfilePayload === "function"
      ? getProfilePayload()
      : {};

  const userId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    (typeof getUserId === "function" ? getUserId() : "") ||
    "";

  const lineUserId =
    profilePayload.lineUserId ||
    profilePayload.userId ||
    userId ||
    "";

  const playerName =
    profilePayload.displayName ||
    profilePayload.playerName ||
    (typeof getPlayerName === "function" ? getPlayerName() : "") ||
    "";

  const referralCode =
    profilePayload.referralCode ||
    (typeof getMyReferralCode === "function" ? getMyReferralCode() : "") ||
    "";

  const pictureUrl = profilePayload.pictureUrl || "";

  return {
    userId,
    lineUserId,
    playerName,
    referralCode,
    pictureUrl
  };
}


/*
 * 【修正】產生唯一 Nonce，用於防止重複抽獎
 */
function generateGachaClientNonce() {
  return (
    "nonce_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 10)
  );
}

/*
 * 【修正重點】呼叫後端權威抽獎 API
 * 原本呼叫 getZeloPlayerIdentitySync() 會抓到空的 userId，
 * 導致在送到 GAS 之前就先被攔截返回 NO_USER_ID。
 * 改用 getZeloGachaIdentity_()。
 */
async function drawGachaFromServer(poolId, clientNonce) {
  const identity = getZeloGachaIdentity_();
  const userId = identity.userId || identity.lineUserId || "";

  if (!userId) {
    return { ok: false, code: "NO_USER_ID", message: "尚未取得使用者身份。" };
  }

  const payload = {
    action: "gacha_draw_secure",
    userId: userId,
    lineUserId: identity.lineUserId || userId,
    playerName: identity.playerName || "",
    referralCode: identity.referralCode || "",
    poolId: poolId,
    clientNonce: clientNonce
  };

  const result = await postToZeloBackend(payload);
  if (!result.ok) {
    return {
      ok: false,
      code: (result.data && result.data.code) || "NETWORK_ERROR",
      message: (result.data && result.data.message) || "抽獎連線失敗。"
    };
  }
  return result.data;
}

/*
 * 【修正重點】同步伺服器最新點數
 */
async function syncZeloPointsFromServer() {
  const identity = getZeloGachaIdentity_();
  const userId = identity.userId || identity.lineUserId || "";
  if (!userId) return null;

  const result = await postToZeloBackend({
    action: "get_zelo_points",
    userId: userId,
    lineUserId: identity.lineUserId || userId
  });

  if (result.ok && result.data && typeof result.data.zeloPoints === "number") {
    setRewardPoints(result.data.zeloPoints);
    const pointsTotalEl = document.querySelector("#zg-points-total");
    if (pointsTotalEl) pointsTotalEl.textContent = String(result.data.zeloPoints);
    return result.data.zeloPoints;
  }
  return null;
}

window.drawGachaFromServer = drawGachaFromServer;
window.syncZeloPointsFromServer = syncZeloPointsFromServer;





/*
 * =========================================================
 * ZELO Gacha Modal / ZELO 扭蛋機彈窗
 * =========================================================
 */

function closeGachaModal() {
  const modal = document.getElementById("zg-gacha-modal");

  if (!modal) return;

  modal.remove();
}

/*
 * ---------------------------------------------------------
 * Secret Top Redeem Actions
 * ---------------------------------------------------------
 */  

function showGachaDialog(options = {}) {
  return new Promise((resolve) => {
    const {
      kicker = "ZELO LOTTERY",
      title = "提示",
      message = "",
      highlight = "",
      confirmText = "確定",
      cancelText = "",
      danger = false,
      resultChip = ""
    } = options;

    const old = document.getElementById("zg-gacha-dialog-backdrop");

    if (old) {
      old.remove();
    }

    const backdrop = document.createElement("div");
    backdrop.id = "zg-gacha-dialog-backdrop";
    backdrop.className = "zg-gacha-dialog-backdrop";

    const cancelButtonHtml = cancelText
      ? `<button type="button" class="zg-gacha-dialog-btn zg-gacha-dialog-btn-secondary" data-zg-dialog-cancel>${escapeHtml(cancelText)}</button>`
      : "";

    const chipHtml = resultChip
      ? `<div class="zg-gacha-dialog-result-chip">${escapeHtml(resultChip)}</div>`
      : "";

    const highlightHtml = highlight
      ? `<div class="zg-gacha-dialog-highlight">${escapeHtml(highlight)}</div>`
      : "";

    backdrop.innerHTML = `
      <div class="zg-gacha-dialog" role="dialog" aria-modal="true">
        <div class="zg-gacha-dialog-head">
          <div class="zg-gacha-dialog-kicker">${escapeHtml(kicker)}</div>
          <h3 class="zg-gacha-dialog-title">${escapeHtml(title)}</h3>
        </div>
        <div class="zg-gacha-dialog-body">
          <div>${escapeHtml(message)}</div>
          ${highlightHtml}
          ${chipHtml}
        </div>
        <div class="zg-gacha-dialog-actions">
          ${cancelButtonHtml}
          <button
            type="button"
            class="zg-gacha-dialog-btn ${danger ? "zg-gacha-dialog-btn-danger" : "zg-gacha-dialog-btn-primary"}"
            data-zg-dialog-confirm
          >
            ${escapeHtml(confirmText)}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const close = (value) => {
      backdrop.remove();
      resolve(value);
    };

    const confirmButton = backdrop.querySelector("[data-zg-dialog-confirm]");
    const cancelButton = backdrop.querySelector("[data-zg-dialog-cancel]");

    if (confirmButton) {
      confirmButton.addEventListener("click", () => close(true));
    }

    if (cancelButton) {
      cancelButton.addEventListener("click", () => close(false));
    }

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop && cancelText) {
        close(false);
      }
    });

    document.addEventListener(
      "keydown",
      function onKeydown(event) {
        if (!document.body.contains(backdrop)) {
          return;
        }

        if (event.key === "Escape" && cancelText) {
          close(false);
        }
      },
      { once: true }
    );
  });
}

window.showGachaDialog = showGachaDialog;
  

window.renderGachaResultMedia = function renderGachaResultMedia(mediaWrap, pool, result) {
  if (!mediaWrap || !pool || !result) {
    console.warn("[ZELO GACHA RESULT MEDIA] missing args", {
      hasMediaWrap: !!mediaWrap,
      hasPool: !!pool,
      hasResult: !!result
    });
    return;
  }

  const rewardType =
    result?.rewardType ||
    result?.reward?.type ||
    "";

  const rewardName =
    result?.rewardName ||
    result?.reward?.name ||
    "";

  const isNoPrize =
    !!result?.isNoPrize ||
    rewardType === "none" ||
    rewardName === "銘謝惠顧";

  const mediaClass = isNoPrize
    ? "zg-gacha-machine-media zg-gacha-machine-result-media zg-gacha-machine-lose-media"
    : "zg-gacha-machine-media zg-gacha-machine-result-media zg-gacha-machine-win-media";

  const videoUrl = isNoPrize
    ? pool.machineLoseVideoUrl
    : pool.machineWinVideoUrl;

  const imageUrl = isNoPrize
    ? pool.machineLoseImageUrl
    : pool.machineWinImageUrl;

  console.log("[ZELO GACHA RESULT MEDIA]", {
    poolId: pool?.id || "",
    poolTitle: pool?.title || "",
    rewardName,
    rewardType,
    isNoPrize,
    videoUrl,
    imageUrl
  });

  if (videoUrl) {
    mediaWrap.innerHTML = `
      <video
        class="${mediaClass}"
        src="${escapeAttr(videoUrl)}"
        autoplay
        muted
        playsinline
      ></video>
    `;
    return;
  }

  if (imageUrl) {
    mediaWrap.innerHTML = `
      <img
        class="${mediaClass}"
        src="${escapeAttr(imageUrl)}"
        alt="${escapeAttr(isNoPrize ? "銘謝惠顧，再接再厲" : "恭喜中獎")}"
      >
    `;
    return;
  }

  /*
   * fallback：
   * 如果獎池還沒設定 win / lose 圖片，就用目前機台圖片。
   * 仍然套用 win / lose class，讓 CSS 動畫可以生效。
   */
  if (pool.machineImageUrl) {
    mediaWrap.innerHTML = `
      <img
        class="${mediaClass}"
        src="${escapeAttr(pool.machineImageUrl)}"
        alt="${escapeAttr(pool.title || "扭蛋結果")}"
      >
    `;
    return;
  }

  if (pool.machineVideoUrl) {
    mediaWrap.innerHTML = `
      <video
        class="${mediaClass}"
        src="${escapeAttr(pool.machineVideoUrl)}"
        autoplay
        muted
        playsinline
      ></video>
    `;
    return;
  }

  mediaWrap.innerHTML = `
    <div class="${mediaClass}">
      <div class="zg-gacha-machine-placeholder">
        <div class="zg-gacha-machine-orb"></div>
        <div class="zg-gacha-machine-body">
          <div class="zg-gacha-machine-window">
            <span>${escapeHtml(isNoPrize ? "銘謝惠顧" : "中獎")}</span>
          </div>
          <div class="zg-gacha-machine-handle"></div>
        </div>
        <div class="zg-gacha-machine-base"></div>
      </div>
    </div>
  `;
};



  window.showGachaResultDialogFromResult = async function showGachaResultDialogFromResult(result) {
  if (!result) return false;

  const isNoPrize =
    result?.isNoPrize ||
    result?.rewardType === "none" ||
    result?.reward?.type === "none";

  const rewardName =
    result?.rewardName ||
    result?.reward?.name ||
    (isNoPrize ? "銘謝惠顧" : "獎勵");

  const message = isNoPrize
    ? "這次沒有抽中獎項，點數已扣除，歡迎再試一次。"
    : "專屬獎勵將透過 LINE 訊息傳送給你，請回到聊天室查看。";

  return await showGachaDialog({
    kicker: isNoPrize ? "TRY AGAIN" : "CONGRATULATIONS",
    title: isNoPrize ? "再接再厲" : "恭喜抽中！",
    message,
    highlight: rewardName,
    confirmText: isNoPrize ? "再試一次" : "太好了",
    danger: isNoPrize
  });
};


const GACHA_ERROR_MESSAGES = {
  NO_USER_ID: "尚未取得使用者身份，請從 LINE 內開啟遊戲或重新整理頁面",
  INVALID_USER_ID: "尚未取得有效使用者身份，請從 LINE 內開啟遊戲或重新整理頁面",
  PLAYER_NOT_FOUND: "找不到玩家資料，請重新整理頁面後再試",
  NOT_ENOUGH_POINTS: "ZELO Points 不足，快去遊玩賺取點數！",
  INSUFFICIENT_POINTS: "ZELO Points 不足，快去遊玩賺取點數！",
  DUPLICATE_NONCE: "請勿重複點擊，剛剛的抽獎正在處理中",
  DUPLICATE_DRAW: "此次抽獎已處理過，顯示先前結果",
  POOL_NOT_FOUND: "找不到指定的獎池，請重新整理頁面",
  MISSING_POOL_ID: "缺少獎池資訊，請重新整理頁面",
  POOL_EMPTY: "此獎池目前沒有可抽獎項，請稍後再試",
  TOO_FAST: "抽獎太快了，請稍後再試",
  LOCK_TIMEOUT: "系統忙碌中，請稍後再試",
  NETWORK_ERROR: "抽獎連線失敗，點數未扣除，請確認網路後再試",
  UNKNOWN_ERROR: "目前抽獎流程沒有完成，請稍後再試一次"
};

function getGachaErrorMessage(code, fallbackMessage) {
  return (
    GACHA_ERROR_MESSAGES[code] ||
    fallbackMessage ||
    GACHA_ERROR_MESSAGES.UNKNOWN_ERROR
  );
}

async function handleGachaDraw(poolId, options = {}) {
  /* ---------- 1. 獎池檢查 ---------- */
  const pool = getGachaPoolById(poolId);

  if (!pool) {
    track("gacha_draw_blocked_pool_not_found", { poolId });
    throw new Error(getGachaErrorMessage("POOL_NOT_FOUND"));
  }

  const cost = Math.max(0, Number(pool.cost || 0));

  /* ---------- 2. 身份檢查：改用 getZeloGachaIdentity_() ---------- */
  let identity = null;

  try {
    identity = getZeloGachaIdentity_();
  } catch (error) {
    console.warn("[ZELO GACHA] getZeloGachaIdentity_ failed:", error);
  }

  const userId =
    (identity && (identity.userId || identity.lineUserId)) || "";

  if (!userId) {
    track("gacha_draw_blocked_no_user_id", { poolId, cost });
    throw new Error(getGachaErrorMessage("NO_USER_ID"));
  }

  /* ---------- 3. 本地點數預檢（僅供 UX，最終以後端為準） ---------- */
  const currentPoints =
    typeof getRewardPoints === "function" ? getRewardPoints() : 0;

  if (currentPoints < cost) {
    track("gacha_draw_blocked_insufficient_points", {
      poolId,
      cost,
      currentPoints,
      userId
    });

    throw new Error(getGachaErrorMessage("NOT_ENOUGH_POINTS"));
  }

  /* ---------- 4. 呼叫後端權威抽獎 ---------- */
  const clientNonce = generateGachaClientNonce();

  track("gacha_draw_request", {
    poolId,
    cost,
    currentPoints,
    clientNonce,
    userId
  });

  let serverResult = null;

  try {
    serverResult = await drawGachaFromServer(poolId, clientNonce);
  } catch (error) {
    track("gacha_draw_network_error", {
      poolId,
      cost,
      clientNonce,
      userId,
      message: String(error && error.message ? error.message : error)
    });

    throw new Error(getGachaErrorMessage("NETWORK_ERROR"));
  }

  /* ---------- 5. 後端回傳失敗 → 依錯誤碼顯示訊息 ---------- */
  if (!serverResult || !serverResult.ok) {
    const code = (serverResult && serverResult.code) || "UNKNOWN_ERROR";
    const serverMessage = serverResult && serverResult.message;

    track("gacha_draw_failed", {
      poolId,
      cost,
      currentPoints,
      clientNonce,
      userId,
      code,
      message: serverMessage || ""
    });

    if ((code === "NOT_ENOUGH_POINTS" || code === "INSUFFICIENT_POINTS") &&
        typeof syncZeloPointsFromServer === "function") {
      try {
        syncZeloPointsFromServer();
      } catch (error) {
        console.warn("[ZELO GACHA] sync points after failure:", error);
      }
    }

    throw new Error(getGachaErrorMessage(code, serverMessage));
  }

  /* ---------- 6. 成功 → 以後端點數為準更新 UI ---------- */
  const newPoints =
    Number(
      serverResult.zeloPointsTotal ??
        serverResult.zeloPoints ??
        serverResult.pointsAfter ??
        serverResult.afterPoints ??
        currentPoints - cost
    ) || 0;

  if (typeof setRewardPoints === "function") {
    setRewardPoints(newPoints);
  }

  const pointsTotalEl = document.querySelector("#zg-points-total");
  if (pointsTotalEl) {
    pointsTotalEl.textContent = String(newPoints);
  }

  const rewardType =
    serverResult.rewardType || serverResult.reward?.type || "";

  const rewardName =
    serverResult.rewardName || serverResult.reward?.name || "";

  const isNoPrize =
    !!serverResult.isNoPrize ||
    rewardType === "none" ||
    rewardName === "銘謝惠顧";

  const result = {
    ok: true,
    poolId,
    cost,
    clientNonce,
    userId,
    isNoPrize,
    rewardType,
    rewardName,
    reward: serverResult.reward || { type: rewardType, name: rewardName },
    zeloPointsTotal: newPoints,
    pointsBefore: currentPoints,
    pointsAfter: newPoints,
    raw: serverResult
  };

  track("gacha_draw_success", {
    poolId,
    cost,
    isNoPrize,
    rewardType,
    rewardName,
    pointsAfter: newPoints,
    userId
  });

  return result;
}

window.handleGachaDraw = handleGachaDraw;

console.log("[ZELO GACHA] handleGachaDraw exposed:", typeof window.handleGachaDraw);


/*
 * 確保結果頁存在抽獎機台的嵌入容器。
 * 找不到掛載點時，會自動接在獎勵 Banner 之後。
 */
function renderGachaEmbedded(defaultPoolId = "quick_100") {
  const slot = ensureGachaEmbeddedContainer();

  const points =
    typeof getRewardPoints === "function"
      ? getRewardPoints()
      : 0;

  const selectedPool =
    getGachaPoolById(defaultPoolId) ||
    ZELO_GACHA_POOLS[0];

  const selectedTheme =
    selectedPool.machineTheme ||
    selectedPool.rarityTheme ||
    "bronze";

  const selectedCost = Math.max(0, Number(selectedPool.cost || 0));
  const selectedCanDraw = points >= selectedCost;
  const selectedRemaining = Math.max(0, selectedCost - points);

  let machineMediaHtml = "";

  if (selectedPool.machineVideoUrl) {
    machineMediaHtml = `
      <video
        class="zg-gacha-machine-media"
        src="${escapeAttr(selectedPool.machineVideoUrl)}"
        autoplay
        muted
        loop
        playsinline
      ></video>
    `;
  } else if (selectedPool.machineImageUrl) {
    machineMediaHtml = `
      <img
        class="zg-gacha-machine-media"
        src="${escapeAttr(selectedPool.machineImageUrl)}"
        alt="${escapeAttr(selectedPool.title || "扭蛋抽籤器")}"
        loading="lazy"
      >
    `;
  } else {
    machineMediaHtml = `
      <div class="zg-gacha-machine-placeholder">
        <div class="zg-gacha-machine-orb"></div>
        <div class="zg-gacha-machine-body">
          <div class="zg-gacha-machine-window">
            <span>${escapeHtml(selectedPool.ballLabel || "抽籤器")}</span>
          </div>
          <div class="zg-gacha-machine-handle"></div>
        </div>
        <div class="zg-gacha-machine-base"></div>
      </div>
    `;
  }

  const poolBannersHtml = ZELO_GACHA_POOLS.map((pool) => {
    const cost = Math.max(0, Number(pool.cost || 0));
    const canDraw = points >= cost;
    const remaining = Math.max(0, cost - points);
    const theme = pool.machineTheme || pool.rarityTheme || "bronze";
    const isSelected = pool.id === selectedPool.id;

    return `
      <button
        class="zg-gacha-pool-banner zg-gacha-pool-banner-${escapeAttr(theme)} ${isSelected ? "is-selected" : ""} ${canDraw ? "is-ready" : "is-locked"}"
        type="button"
        data-gacha-embed-select="${escapeAttr(pool.id)}"
      >
        <div class="zg-gacha-pool-banner-left">
          <span class="zg-gacha-pool-metal">
            ${
              theme === "gold"
                ? "金"
                : theme === "silver"
                  ? "銀"
                  : "銅"
            }
          </span>

          <div>
            <strong>${escapeHtml(pool.title || "")}</strong>
            <em>${escapeHtml(pool.subtitle || "")}</em>
          </div>
        </div>

        <div class="zg-gacha-pool-banner-right">
          <span>${cost} 點</span>
          <small>
            ${
              canDraw
                ? `可抽 ${cost > 0 ? Math.floor(points / cost) : 0} 次`
                : `差 ${remaining} 點`
            }
          </small>
        </div>
      </button>
    `;
  }).join("");

  const prizePreviewHtml = Array.isArray(selectedPool.prizesPreview)
    ? selectedPool.prizesPreview
        .map((name) => `<span>${escapeHtml(name)}</span>`)
        .join("")
    : "";

  slot.innerHTML = `
    <div
      class="zg-gacha-panel zg-gacha-embed-panel zg-gacha-machine-panel zg-gacha-machine-${escapeAttr(selectedTheme)}"
    >
      <div class="zg-gacha-machine-header">
        <div>
          <div class="zg-gacha-kicker">ZELO LOTTERY MACHINE</div>
          <h3>ZELO幸運轉盤</h3>
          <p>選擇下方獎池，使用 ZELO Points 開始搖籤。</p>
        </div>

        <div class="zg-gacha-score">
          <span>目前點數</span>
          <strong>${points}</strong>
        </div>
      </div>

      <section class="zg-gacha-machine-stage">
        <div class="zg-gacha-machine-glow"></div>

        <div class="zg-gacha-machine-media-wrap">
          ${machineMediaHtml}
        </div>

        <div class="zg-gacha-selected-info">
          <div>
            <span class="zg-gacha-selected-badge">
              ${escapeHtml(selectedPool.badge || "獎池")}
            </span>
            <h4>${escapeHtml(selectedPool.title || "")}</h4>
            <p>${escapeHtml(selectedPool.description || "")}</p>
          </div>

          <div class="zg-gacha-selected-cost">
            <span>消耗</span>
            <strong>${selectedCost}</strong>
            <em>Points</em>
          </div>
        </div>

        <div class="zg-gacha-selected-preview">
          ${prizePreviewHtml}
        </div>

        <button
          class="zg-gacha-shake-btn ${selectedCanDraw ? "is-ready" : "is-disabled"}"
          type="button"
          data-gacha-embed-draw="${escapeAttr(selectedPool.id)}"
          ${selectedCanDraw ? "" : "disabled"}
        >
          ${
            selectedCanDraw
              ? `開始搖籤｜消耗 ${selectedCost} 點`
              : `點數不足｜還差 ${selectedRemaining} 點`
          }
        </button>
      </section>

      <section class="zg-gacha-pool-banner-list" aria-label="選擇獎池">
        ${poolBannersHtml}
      </section>
    </div>
  `;

  slot.querySelectorAll("[data-gacha-embed-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const poolId = button.getAttribute("data-gacha-embed-select") || "quick_100";
      renderGachaEmbedded(poolId);
    });
  });

  slot.querySelectorAll("[data-gacha-embed-draw]").forEach((button) => {
    button.addEventListener("click", async () => {
      const poolId = button.getAttribute("data-gacha-embed-draw") || selectedPool.id;
      const pool = getGachaPoolById(poolId) || selectedPool;

      const cost = Math.max(0, Number(pool.cost || 0));
      const currentPoints =
        typeof getRewardPoints === "function"
          ? getRewardPoints()
          : 0;

      if (currentPoints < cost) {
        await showGachaDialog({
          kicker: "POINTS REQUIRED",
          title: "ZELO Points 不足",
          message: `還差 ${cost - currentPoints} 點才能抽「${pool.title}」。`,
          highlight: `目前 ${currentPoints} 點 / 需要 ${cost} 點`,
          confirmText: "我知道了",
          danger: true
        });
        return;
      }

      const ok = await showGachaDialog({
        kicker: "CONFIRM DRAW",
        title: "確認抽獎",
        message: `確定使用 ${cost} ZELO Points 抽「${pool.title}」嗎？`,
        highlight: pool.title || "目前獎池",
        confirmText: "確認抽獎",
        cancelText: "先不要"
      });

      if (!ok) {
        return;
      }

      if (button.dataset.drawing === "1") {
        console.warn("[ZELO GACHA EMBED] draw ignored: already drawing", {
          poolId
        });
        return;
      }

      button.dataset.drawing = "1";

      const panel = slot.querySelector(".zg-gacha-panel");
      const stage = slot.querySelector(".zg-gacha-machine-stage");
      const mediaWrap = slot.querySelector(".zg-gacha-machine-media-wrap");

      button.disabled = true;
      button.classList.add("is-shaking");
      button.textContent = "搖籤中...";

      if (panel) {
        panel.classList.add("is-drawing");
      }

      if (stage) {
        stage.classList.add("is-drawing");
      }

      if (mediaWrap && pool) {
        if (pool.machineDrawVideoUrl) {
          mediaWrap.innerHTML = `
            <video
              class="zg-gacha-machine-media zg-gacha-machine-draw-media"
              src="${escapeAttr(pool.machineDrawVideoUrl)}"
              autoplay
              muted
              playsinline
            ></video>
          `;
        } else if (pool.machineDrawImageUrl) {
          mediaWrap.innerHTML = `
            <img
              class="zg-gacha-machine-media zg-gacha-machine-draw-media"
              src="${escapeAttr(pool.machineDrawImageUrl)}"
              alt="${escapeAttr(pool.title || "搖籤中")}"
            >
          `;
        }
      }

      setTimeout(async () => {
        let result = null;

        try {
          if (typeof window.handleGachaDraw !== "function") {
            throw new Error("window.handleGachaDraw is not available");
          }

          result = await window.handleGachaDraw(poolId, {
            skipConfirm: true,
            silentResultDialog: true
          });
        } catch (error) {
          console.error("[ZELO GACHA EMBED] handleGachaDraw failed:", error);

          button.disabled = false;
          button.dataset.drawing = "0";
          button.classList.remove("is-shaking");
          button.textContent = `開始搖籤｜消耗 ${cost} 點`;

          if (panel) {
            panel.classList.remove("is-drawing");
          }

          if (stage) {
            stage.classList.remove("is-drawing");
          }

          await showGachaDialog({
            kicker: "DRAW FAILED",
            title: "抽獎失敗",
            message: "目前抽獎流程沒有完成，請稍後再試一次。",
            highlight: "未扣除或請確認點數紀錄",
            confirmText: "我知道了",
            danger: true
          });

          return;
        }

        if (result) {
          if (typeof window.renderGachaResultMedia === "function") {
            window.renderGachaResultMedia(mediaWrap, pool, result);
          } else {
            console.warn("[ZELO GACHA EMBED] renderGachaResultMedia is not available");
          }

          setTimeout(async () => {
            if (typeof window.showGachaResultDialogFromResult === "function") {
              await window.showGachaResultDialogFromResult(result);
            } else {
              console.warn("[ZELO GACHA EMBED] showGachaResultDialogFromResult is not available");
            }

            button.dataset.drawing = "0";
            renderGachaEmbedded(poolId);
          }, 900);

          return;
        }

        button.disabled = false;
        button.dataset.drawing = "0";
        button.classList.remove("is-shaking");
        button.textContent = `開始搖籤｜消耗 ${cost} 點`;

        if (panel) {
          panel.classList.remove("is-drawing");
        }

        if (stage) {
          stage.classList.remove("is-drawing");
        }
      }, 1200);
    });
  });
}

window.renderGachaEmbedded = renderGachaEmbedded;

  
function openGachaModal(defaultPoolId = "") {
  const result =
    state?.lastBattleResult ||
    safeParse(localStorage.getItem(STORAGE.lastResult), null) ||
    null;

  const resultScreen = screenResult ? screenResult() : document.getElementById("screen-result");
  const resultMain = resultScreen ? resultScreen.querySelector(".zg-result-main") : null;

  if (typeof ensureWeeklyGachaContainer === "function") {
    ensureWeeklyGachaContainer(resultScreen, resultMain);
  }

  if (typeof window.renderWeeklyGachaBanner === "function") {
    window.renderWeeklyGachaBanner(result);
  }

  const target = document.getElementById("zelo-weekly-gacha-container");

  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}



  
function installGachaModalStyle() {
  if (document.getElementById("zg-gacha-modal-style")) return;

  const style = document.createElement("style");
  style.id = "zg-gacha-modal-style";

  style.textContent = `
    #zg-gacha-modal {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 18px !important;
      box-sizing: border-box !important;
      font-family: inherit !important;
    }

    .zg-gacha-backdrop {
      position: absolute !important;
      inset: 0 !important;
      background: rgba(0, 0, 0, .68) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
    }

    .zg-gacha-panel {
      position: relative !important;
      width: min(560px, calc(100vw - 28px)) !important;
      max-height: calc(100vh - 40px) !important;
      overflow-y: auto !important;
      border-radius: 24px !important;
      padding: 18px !important;
      background:
        radial-gradient(circle at 50% 0%, rgba(255, 224, 95, .22), transparent 35%),
        linear-gradient(180deg, #182445 0%, #081124 100%) !important;
      border: 1px solid rgba(255,255,255,.15) !important;
      box-shadow: 0 24px 90px rgba(0,0,0,.55) !important;
      color: #fff !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-close {
      position: sticky !important;
      top: 0 !important;
      margin-left: auto !important;
      display: flex !important;
      width: 38px !important;
      height: 38px !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 999px !important;
      border: 0 !important;
      background: rgba(255,255,255,.16) !important;
      color: #fff !important;
      font-size: 25px !important;
      font-weight: 900 !important;
      line-height: 1 !important;
      cursor: pointer !important;
    }

    .zg-gacha-header {
      display: flex !important;
      justify-content: space-between !important;
      gap: 14px !important;
      margin-bottom: 16px !important;
    }

    .zg-gacha-kicker {
      color: #57f2ff !important;
      font-size: 12px !important;
      font-weight: 900 !important;
      letter-spacing: .12em !important;
      margin-bottom: 6px !important;
    }

    .zg-gacha-header h3 {
      margin: 0 !important;
      color: #fff !important;
      font-size: 28px !important;
      font-weight: 1000 !important;
      line-height: 1.1 !important;
    }

    .zg-gacha-header p {
      margin: 8px 0 0 !important;
      color: rgba(255,255,255,.78) !important;
      font-size: 14px !important;
      line-height: 1.45 !important;
    }

    .zg-gacha-score {
      flex: 0 0 auto !important;
      min-width: 110px !important;
      padding: 12px !important;
      border-radius: 18px !important;
      background: rgba(255,224,95,.14) !important;
      border: 1px solid rgba(255,224,95,.25) !important;
      text-align: right !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-score span {
      display: block !important;
      color: rgba(255,255,255,.7) !important;
      font-size: 12px !important;
      font-weight: 800 !important;
      margin-bottom: 4px !important;
    }

    .zg-gacha-score strong {
      display: block !important;
      color: #ffe05f !important;
      font-size: 28px !important;
      font-weight: 1000 !important;
      line-height: 1 !important;
    }

    .zg-gacha-grid {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }

    .zg-gacha-pool-card {
      display: grid !important;
      grid-template-columns: 82px minmax(0, 1fr) !important;
      gap: 14px !important;
      padding: 14px !important;
      border-radius: 20px !important;
      background: rgba(255,255,255,.08) !important;
      border: 1px solid rgba(255,255,255,.12) !important;
      box-sizing: border-box !important;
    }

    .zg-gacha-pool-card.is-selected {
      border-color: rgba(255,224,95,.48) !important;
      box-shadow: 0 0 18px rgba(255,224,95,.16) !important;
    }

    .zg-gacha-ball {
      width: 76px !important;
      height: 76px !important;
      border-radius: 999px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      font-size: 14px !important;
      font-weight: 1000 !important;
      box-shadow:
        inset 0 8px 14px rgba(255,255,255,.45),
        0 12px 24px rgba(0,0,0,.3) !important;
    }

    .zg-gacha-ball-white {
      background: linear-gradient(180deg, #ffffff, #dbe6ff) !important;
      color: #14213d !important;
    }

    .zg-gacha-ball-black {
      background: linear-gradient(180deg, #4a5368, #111827) !important;
      color: #fff !important;
    }

    .zg-gacha-ball-red {
      background: linear-gradient(180deg, #ff6b7c, #d80028) !important;
      color: #fff !important;
    }

    .zg-gacha-pool-top {
      display: flex !important;
      justify-content: space-between !important;
      gap: 10px !important;
      margin-bottom: 6px !important;
    }

    .zg-gacha-pool-top span {
      display: inline-flex !important;
      padding: 4px 8px !important;
      border-radius: 999px !important;
      background: rgba(87,242,255,.14) !important;
      color: #57f2ff !important;
      font-size: 11px !important;
      font-weight: 900 !important;
    }

    .zg-gacha-pool-top strong {
      color: #ffe05f !important;
      font-size: 14px !important;
      font-weight: 1000 !important;
      white-space: nowrap !important;
    }

    .zg-gacha-pool-main h4 {
      margin: 0 !important;
      color: #fff !important;
      font-size: 20px !important;
      font-weight: 1000 !important;
      line-height: 1.15 !important;
    }

    .zg-gacha-pool-main p {
      margin: 7px 0 0 !important;
      color: rgba(255,255,255,.72) !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
    }

    .zg-gacha-preview-list {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 6px !important;
      margin-top: 10px !important;
    }

    .zg-gacha-preview-chip {
      display: inline-flex !important;
      padding: 5px 8px !important;
      border-radius: 999px !important;
      background: rgba(255,255,255,.1) !important;
      color: rgba(255,255,255,.86) !important;
      font-size: 12px !important;
      font-weight: 800 !important;
    }

    .zg-gacha-status {
      margin-top: 10px !important;
      font-size: 13px !important;
      font-weight: 900 !important;
    }

    .zg-gacha-status.is-ready {
      color: #7CFFB2 !important;
    }

    .zg-gacha-status.is-locked {
      color: rgba(255,255,255,.52) !important;
    }

    .zg-gacha-draw-btn {
      width: 100% !important;
      min-height: 44px !important;
      margin-top: 10px !important;
      border-radius: 14px !important;
      border: 0 !important;
      font-size: 15px !important;
      font-weight: 1000 !important;
      cursor: pointer !important;
    }

    .zg-gacha-draw-btn.is-ready {
      background: linear-gradient(180deg, #ffe05f, #ff9f1c) !important;
      color: #241500 !important;
      box-shadow: 0 10px 20px rgba(255,159,28,.25) !important;
    }

    .zg-gacha-draw-btn.is-disabled {
      background: rgba(255,255,255,.12) !important;
      color: rgba(255,255,255,.42) !important;
      cursor: not-allowed !important;
    }

    @media (max-width: 460px) {
      .zg-gacha-panel {
        padding: 14px !important;
        border-radius: 22px !important;
      }

      .zg-gacha-header {
        flex-direction: column !important;
      }

      .zg-gacha-score {
        width: 100% !important;
        text-align: left !important;
      }

      .zg-gacha-pool-card {
        grid-template-columns: 1fr !important;
      }

      .zg-gacha-ball {
        width: 72px !important;
        height: 72px !important;
      }
    }
  `;

  document.head.appendChild(style);
}

/*
 * Console 測試用：開啟扭蛋彈窗
 */
window.openGachaModal = openGachaModal;
window.closeGachaModal = closeGachaModal;


function hideOldRewardBanner() {
  const roots = Array.from(
    new Set(
      [
        document.getElementById("zelo-reward-banner"),
        document.querySelector("[data-zelo-reward-banner]")
      ].filter(Boolean)
    )
  );

  if (!roots.length) return;

  roots.forEach(function(root) {
    /*
     * 隱藏舊版 ZELO REWARD / 獎品獎勵兌換。
     * 注意：不要 remove 這個節點，因為它仍可作為
     * 三獎池 UI 插入位置的錨點。
     */
    root.innerHTML = "";

    root.style.setProperty("display", "none", "important");
    root.style.setProperty("visibility", "hidden", "important");
    root.style.setProperty("opacity", "0", "important");
    root.style.setProperty("height", "0", "important");
    root.style.setProperty("min-height", "0", "important");
    root.style.setProperty("max-height", "0", "important");
    root.style.setProperty("width", "100%", "important");
    root.style.setProperty("margin", "0", "important");
    root.style.setProperty("padding", "0", "important");
    root.style.setProperty("border", "0", "important");
    root.style.setProperty("box-shadow", "none", "important");
    root.style.setProperty("overflow", "hidden", "important");
    root.style.setProperty("pointer-events", "none", "important");

    root.setAttribute("aria-hidden", "true");
    root.setAttribute("data-zelo-old-reward-hidden", "true");
  });
}



  
  
function renderRewardBanner(result = null) {
  const root = $("#zelo-reward-banner") || $("[data-zelo-reward-banner]");
   hideOldRewardBanner();
  if (!root) return;

  hideOldRewardBanner();
  return;

    /*
   * 已停用舊版「獎品獎勵兌換」區塊。
   * 保留 #zelo-reward-banner 容器作為每週三蛋插入錨點，
   * 但不顯示任何內容。
   */
  root.innerHTML = "";
  root.style.setProperty("display", "none", "important");
  root.style.setProperty("visibility", "hidden", "important");
  root.style.setProperty("height", "0", "important");
  root.style.setProperty("min-height", "0", "important");
  root.style.setProperty("margin", "0", "important");
  root.style.setProperty("padding", "0", "important");
  root.style.setProperty("overflow", "hidden", "important");
  root.setAttribute("aria-hidden", "true");
  return;

  
  if (!Array.isArray(REWARD_TIERS) || !REWARD_TIERS.length) {
    root.innerHTML = "";
    return;
  }


  const points =
    typeof getRewardPoints === "function"
      ? getRewardPoints()
      : Number(result?.rewardPointsTotal || result?.zeloPointsTotal || 0) || 0;

  const context = getRewardContext(points);

  const justGain = Number(
    result?.rewardPointsGain ??
    result?.zeloPointsGain ??
    0
  ) || 0;

  const cards = REWARD_TIERS.map((tier) => {
    const stateName = getRewardState(tier, points);
    const stateLabel = getRewardStateLabel(tier, stateName, points);

    const current = getRewardCurrentValue(tier, context);
    const target = Math.max(1, getRewardRequirementValue(tier));
    const progressPct = Math.max(
      0,
      Math.min(100, Math.round((current / target) * 100))
    );

    const isLocked = stateName === "locked";
    const isAvailable = stateName === "available";
    const isClaimed = stateName === "claimed";

    const badgeText =
      tier.type === "coupon"
        ? "折扣券"
        : "抽獎資格";

    const requirementText =
      tier.requirementType === "share"
        ? "分享任務"
        : tier.requirementType === "invite"
          ? `邀請 ${Number(tier.requiredInvites || 0)} 人`
          : `${Number(tier.requiredPoints ?? tier.points ?? 0)} 積分`;

    const productImageHtml = tier.imageUrl
      ? `<img src="${escapeAttr(tier.imageUrl)}" alt="${escapeAttr(tier.name || "商品圖片")}" loading="lazy">`
      : `<div class="zg-reward-product-placeholder">商品圖</div>`;

    const productBlockInner = `
      <div class="zg-reward-product-image">
        ${productImageHtml}
      </div>
      <div class="zg-reward-product-link-text">
        ${tier.productUrl ? "查看商品" : "抽獎商品"}
      </div>
    `;

    const productBlock = tier.productUrl
      ? `
        <a class="zg-reward-product" href="${escapeAttr(tier.productUrl)}" target="_blank" rel="noopener noreferrer">
          ${productBlockInner}
        </a>
      `
      : `
        <div class="zg-reward-product">
          ${productBlockInner}
        </div>
      `;

    let actionHtml = "";

    if (isLocked) {
      actionHtml = `
        <button class="zg-reward-btn zg-reward-btn-disabled" disabled>
          尚未解鎖
        </button>
      `;
    } else if (isClaimed) {
      if (tier.type === "coupon") {
        actionHtml = `
          <button class="zg-reward-btn" data-copy-reward-code="${escapeAttr(tier.code || "")}">
            複製折扣碼
          </button>
        `;
      } else {
        actionHtml = `
          <button class="zg-reward-btn zg-reward-btn-claimed" disabled>
            抽獎中
          </button>
        `;
      }
    } else if (isAvailable) {
      actionHtml = `
        <button class="zg-reward-btn zg-reward-btn-primary" data-claim-reward="${escapeAttr(tier.id)}">
          ${tier.type === "coupon" ? "領取折扣碼" : "取得抽獎資格"}
        </button>
      `;
    }

    return `
      <article class="zg-reward-card zg-reward-card-${escapeAttr(stateName)}">
        ${productBlock}

        <div class="zg-reward-card-content">
          <div class="zg-reward-card-top">
            <span class="zg-reward-badge">${escapeHtml(badgeText)}</span>
            <span class="zg-reward-limit">${escapeHtml(tier.limitText || "")}</span>
          </div>

          <h4 class="zg-reward-name">${escapeHtml(tier.name || "")}</h4>

          <p class="zg-reward-desc">
            ${escapeHtml(tier.description || "")}
          </p>

          <div class="zg-reward-meta-row">
            <span>${escapeHtml(requirementText)}</span>
            ${
              tier.type === "lottery"
                ? `<em>${escapeHtml(getLotteryWeekLabel())}</em>`
                : `<em>領取型獎勵</em>`
            }
          </div>

          <div class="zg-reward-progress">
            <div class="zg-reward-progress-bar" style="width:${progressPct}%"></div>
          </div>

          <div class="zg-reward-status">
            ${escapeHtml(stateLabel)}
          </div>

          ${
            tier.type === "coupon" && (isAvailable || isClaimed)
              ? `<div class="zg-reward-code">折扣碼：<strong>${escapeHtml(tier.code || "")}</strong></div>`
              : ""
          }

          ${actionHtml}
        </div>
      </article>
    `;
  }).join("");

  root.innerHTML = `
    <section class="zg-reward-banner" aria-label="獎品獎勵兌換">
      <div class="zg-reward-header">
        <div>
          <div class="zg-reward-kicker">ZELO REWARD</div>
          <h3>獎品獎勵兌換</h3>
          <p>完成分享、邀請好友或累積積分，解鎖折扣碼與抽獎資格。</p>
   ${
  window.LOTTERY_CAMPAIGN?.enabled
    ? `<p class="zg-reward-week-label">${escapeHtml(getLotteryWeekLabel())}｜${escapeHtml(window.LOTTERY_CAMPAIGN.announceText || "每週公布中獎名單")}</p>`
    : ""
}

        </div>

        <div class="zg-reward-score-box">
          <span>目前積分</span>
          <strong>${context.points}</strong>
          ${
            justGain > 0
              ? `<em>本場 +${justGain}</em>`
              : ""
          }
        </div>
      </div>

      <div class="zg-reward-summary">
        <div>
          <span>分享狀態</span>
          <strong>${context.hasShared ? "已完成" : "尚未完成"}</strong>
        </div>
        <div>
          <span>邀請好友</span>
          <strong>${context.inviteCount} 人</strong>
        </div>
        <div>
          <span>活動週期</span>
          <strong>${escapeHtml(getLotteryWeekLabel())}</strong>
        </div>
      </div>

      <div class="zg-reward-grid">
        ${cards}
      </div>
    </section>
  `;

root.querySelectorAll("[data-claim-reward]").forEach((button) => {
  button.addEventListener("click", () => {
    const tierId = button.getAttribute("data-claim-reward") || "";

    const tier = Array.isArray(REWARD_TIERS)
      ? REWARD_TIERS.find((item) => item.id === tierId)
      : null;

    let poolId = "quick_100";

    if (tier) {
      const requiredPoints = Number(tier.requiredPoints ?? tier.points ?? 0);

      if (requiredPoints >= 1000) {
        poolId = "premium_1000";
      } else if (requiredPoints >= 500) {
        poolId = "standard_500";
      } else {
        poolId = "quick_100";
      }
    }

    if (typeof window.openGachaModal === "function") {
      window.openGachaModal(poolId);
    } else if (typeof claimReward === "function") {
      claimReward(tierId);
    }

    if (typeof track === "function") {
      track("gacha_modal_open_from_reward", {
        tierId,
        poolId,
        rewardPoints: typeof getRewardPoints === "function" ? getRewardPoints() : 0,
        referralCode: typeof getMyReferralCode === "function" ? getMyReferralCode() : ""
      });
    }
  });
});


  root.querySelectorAll("[data-copy-reward-code]").forEach((button) => {
  button.addEventListener("click", async () => {
    const code = button.getAttribute("data-copy-reward-code") || "";
    const ok = await copyRewardText(code);

    if (ok) {
      button.textContent = "已複製";

      setTimeout(() => {
        button.textContent = "複製折扣碼";
      }, 1200);
    } else {
      if (typeof showGachaDialog === "function") {
        await showGachaDialog({
          kicker: "COPY CODE",
          title: "請手動複製折扣碼",
          message: "目前瀏覽器不允許自動複製，請手動複製下方折扣碼。",
          highlight: code,
          confirmText: "我知道了"
        });
      } else {
        console.warn("[ZELO GAME] copy fallback code:", code);
      }
    }

    if (typeof track === "function") {
      track("reward_coupon_copy", {
        code,
        referralCode: typeof getMyReferralCode === "function" ? getMyReferralCode() : ""
      });
    }
  });
});

/*
 * 這個 } 是補上 renderRewardBanner 的結尾
 */
}

window.renderRewardBanner = renderRewardBanner;

function renderResult(result) {
  if (!result) return;

  const root = appRoot();

  if (!document.getElementById("screen-result")) {
    ensureResultDom(root);
  }

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
  ) || 0;

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

  let rewardPointsTotal = Number(
    result.rewardPointsTotal ??
    result.zeloPointsTotal ??
    0
  ) || 0;

  if (!rewardPointsTotal && typeof getRewardPoints === "function") {
    rewardPointsTotal = getRewardPoints();
  }

  const rewardPointsGain = Number(
    result.rewardPointsGain ??
    result.zeloPointsGain ??
    0
  ) || 0;

  let rewardProgress = {
    nextTier: null,
    remaining: 0,
    progressPct: 0,
    message: ""
  };

  if (typeof getRewardProgressInfo === "function") {
    rewardProgress = getRewardProgressInfo(rewardPointsTotal);
  }

  result.rewardPointsTotal = rewardPointsTotal;
  result.zeloPointsTotal = rewardPointsTotal;
  result.rewardPointsGain = rewardPointsGain;
  result.zeloPointsGain = rewardPointsGain;

  result.nextRewardId = rewardProgress.nextTier?.id || "";
  result.nextRewardName = rewardProgress.nextTier?.name || "";
  result.nextRewardPoints = rewardProgress.nextTier?.points || 0;
  result.nextRewardRemaining = rewardProgress.remaining || 0;
  result.nextRewardProgressPct = rewardProgress.progressPct || 0;
  result.nextRewardMessage = rewardProgress.message || "";

  if (state) {
    state.lastBattleResult = result;
    state.lineInviteFriendCount = result.lineInviteFriendCount;
  }

  try {
    localStorage.setItem(STORAGE.lastResult, JSON.stringify(result));
  } catch (error) {}

  const resultScreen = screenResult();
  const resultMain = $(".zg-result-main", resultScreen || document);

  document.body.classList.add("zg-result-scroll-unlock");

  if (document.documentElement) {
    document.documentElement.classList.add("zg-result-scroll-unlock");
  }

  ensureRewardBannerContainer(resultScreen, resultMain);
  hideOldRewardBanner();
  ensureWeeklyGachaContainer(resultScreen, resultMain);

  /*
   * 每週三蛋安全渲染器。
   * 集中處理，避免 renderResult 內重複多段判斷。
   */
  const safeRenderWeeklyGacha = (payload) => {
    try {
      ensureWeeklyGachaContainer(resultScreen, resultMain);

      const weeklyEl = document.getElementById("zelo-weekly-gacha-container");

      if (weeklyEl) {
        weeklyEl.style.setProperty("display", "block", "important");
        weeklyEl.style.setProperty("visibility", "visible", "important");
        weeklyEl.style.setProperty("opacity", "1", "important");
        weeklyEl.style.setProperty("height", "auto", "important");
        weeklyEl.style.setProperty("overflow", "visible", "important");
      }

      if (typeof window.renderWeeklyGachaBanner === "function") {
        window.renderWeeklyGachaBanner(payload || result);
      }
    } catch (error) {
      console.warn("[ZELO GAME] renderWeeklyGachaBanner failed:", error);

      if (typeof track === "function") {
        track("weekly_gacha_render_failed", {
          message: String(error && error.message ? error.message : error)
        });
      }
    }
  };

  const topImage = $("#zg-result-top-image");
  const resultBadge = $("#zg-result-badge");
  const resultTitle = $("#zg-result-title");
  const resultMessage = $("#zg-result-message");
  const resultScoreDelta = $("#zg-result-score-delta");

  const pHp = $("#zg-result-player-hp");
  const eHp = $("#zg-result-enemy-hp");
  const pSpin = $("#zg-result-player-spin");
  const eSpin = $("#zg-result-enemy-spin");

  const pointsGainEl = $("#zg-points-gain");
  const pointsTotalEl = $("#zg-points-total");
  const nextRewardNameEl = $("#zg-next-reward-name");
  const nextRewardMessageEl = $("#zg-next-reward-message");
  const nextRewardFillEl = $("#zg-next-reward-fill");

  const couponCard = $("#zg-coupon-card");

  if (couponCard) {
    couponCard.style.setProperty("display", "none", "important");
  }

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

  const oldScore = Number(result.oldScore ?? 0) || 0;

  const newScore = Number(
    result.score ??
    result.totalScore ??
    result.bestScore ??
    oldScore
  ) || 0;

  const delta = Number(result.delta ?? (newScore - oldScore)) || 0;

  let badgeText = "平手";
  let titleText = "平手！再挑戰一次";
  let messageText = `目前積分 ${newScore}`;

  if (resultType === "win") {
    badgeText = "勝利";
    titleText = "勝利！取得專屬獎勵";
    messageText = `目前積分 ${newScore}`;
  } else if (resultType === "lose") {
    badgeText = "失敗";
    titleText = "失敗！再戰一次";
    messageText = `目前積分 ${newScore}`;
  }

  if (resultBadge) {
    resultBadge.textContent = badgeText;
  }

  if (resultTitle) {
    resultTitle.textContent = titleText;
  }

  if (resultMessage) {
    resultMessage.textContent = messageText;
    resultMessage.classList.add("zg-result-current-score");
  }

  if (resultScoreDelta) {
    resultScoreDelta.textContent =
      delta > 0
        ? `積分增加 +${delta}`
        : delta < 0
          ? `積分扣除 ${Math.abs(delta)}`
          : "積分無變化";

    resultScoreDelta.dataset.delta = String(delta);
    resultScoreDelta.classList.toggle("is-plus", delta > 0);
    resultScoreDelta.classList.toggle("is-minus", delta < 0);
    resultScoreDelta.classList.toggle("is-zero", delta === 0);
  }

  if (pointsGainEl) {
    pointsGainEl.textContent =
      rewardPointsGain > 0
        ? `+${rewardPointsGain}`
        : "+0";
  }

  if (pointsTotalEl) {
    pointsTotalEl.textContent = String(rewardPointsTotal);
  }

  if (nextRewardNameEl) {
    nextRewardNameEl.textContent =
      rewardProgress.nextTier?.name ||
      "全部獎勵已達成";
  }

  if (nextRewardMessageEl) {
    nextRewardMessageEl.textContent =
      rewardProgress.message ||
      "已達成目前全部獎勵門檻";
  }

  if (nextRewardFillEl) {
    nextRewardFillEl.style.setProperty(
      "width",
      `${rewardProgress.progressPct || 0}%`,
      "important"
    );
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
      state?.selectedTop?.name ||
      "戰鬥結果陀螺";

    topImage.setAttribute(
      "data-top-id",
      result.playerTopId || state?.selectedTop?.id || ""
    );

    topImage.setAttribute(
      "data-top-type",
      result.playerTopType || state?.selectedTop?.type || ""
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
    state?.lastCouponReward?.fixedCode ||
    state?.lastCouponReward?.code ||
    "";

  forceResultVisible();

  updateResultInviteCount(result);
  updateInviteMissionProgress(result);

  const preloadedRank =
    state?.friendRankPreloadResult ||
    window.ZELO_PRELOADED_FRIEND_RANK ||
    null;

  if (
    preloadedRank &&
    (
      Array.isArray(preloadedRank.friendRank) ||
      Array.isArray(preloadedRank.rows) ||
      Array.isArray(preloadedRank.friends) ||
      Array.isArray(preloadedRank.rank)
    )
  ) {
    const mergedPreloadedResult = {
      ...result,

      friendRank:
        preloadedRank.friendRank ||
        preloadedRank.rows ||
        preloadedRank.friends ||
        preloadedRank.rank ||
        [],

      rows:
        preloadedRank.rows ||
        preloadedRank.friendRank ||
        preloadedRank.friends ||
        preloadedRank.rank ||
        [],

      friends:
        preloadedRank.friends ||
        preloadedRank.friendRank ||
        preloadedRank.rows ||
        preloadedRank.rank ||
        [],

      rank:
        preloadedRank.rank ||
        preloadedRank.friendRank ||
        preloadedRank.rows ||
        preloadedRank.friends ||
        [],

      totalFriends:
        preloadedRank.totalFriends ||
        result.totalFriends ||
        0,

      lineInviteFriendCount:
        Number(
          preloadedRank.lineInviteFriendCount ??
          result.lineInviteFriendCount ??
          getLineInviteFriendCount() ??
          0
        ) || 0
    };

    renderFriendRank(mergedPreloadedResult);
    updateResultInviteCount(mergedPreloadedResult);
    updateInviteMissionProgress(mergedPreloadedResult);

    if (typeof window.renderRewardBanner === "function") {
      window.renderRewardBanner(mergedPreloadedResult);
    }

    /*
     * 好友榜使用預載資料渲染後，也同步渲染每週三蛋。
     */
    safeRenderWeeklyGacha(mergedPreloadedResult);

    track("result_friend_rank_render_preloaded", {
      count: Array.isArray(mergedPreloadedResult.friendRank)
        ? mergedPreloadedResult.friendRank.length
        : 0,
      score: Number(mergedPreloadedResult.score || 0)
    });
  } else {
    renderFriendRankLoading(result);
    updateResultInviteCount(result);
    updateInviteMissionProgress(result);
  }

  forceResultVisible();
  forceRankListScrollable();

  if (typeof window.renderRewardBanner === "function") {
    window.renderRewardBanner(result);
  }

  /*
   * 舊版扭蛋機已由每週三蛋系統取代。
   * 不再呼叫 renderGachaEmbedded()，避免結果頁出現兩套抽獎 UI。
   */
  // if (typeof window.renderGachaEmbedded === "function") {
  //   window.renderGachaEmbedded();
  // }

  /*
   * 每週三蛋抽獎系統：
   * 福利蛋 / 配件蛋 / 裝備蛋
   */
  safeRenderWeeklyGacha(result);

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

  syncPromise.then((response) => {
    if (response && response.ok && typeof applyServerZeloPointsToUI === "function") {
      applyServerZeloPointsToUI(response.data);
    }
  });

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

        updatedResult = {
          ...result,
          ...updatedResult,

          oldScore: result.oldScore,
          delta: result.delta,
          points: result.points,
          battlePoints: result.battlePoints,
          result: result.result,
          finish: result.finish
        };

        if (state) {
          state.lastBattleResult = updatedResult;

          state.lineInviteFriendCount = Number(
            updatedResult.lineInviteFriendCount ??
            getLineInviteFriendCount() ??
            0
          );
        }

        try {
          localStorage.setItem(STORAGE.lastResult, JSON.stringify(updatedResult));
        } catch (error) {}

        renderFriendRank(updatedResult);
        updateResultInviteCount(updatedResult);
        updateInviteMissionProgress(updatedResult);

        const finalScore = Number(
          updatedResult.score ??
          updatedResult.totalScore ??
          updatedResult.bestScore ??
          result.score ??
          0
        ) || 0;

        if (resultMessage) {
          resultMessage.textContent = `目前積分 ${finalScore}`;
          resultMessage.classList.add("zg-result-current-score");
        }

        if (resultScoreDelta) {
          resultScoreDelta.textContent =
            delta > 0
              ? `積分增加 +${delta}`
              : delta < 0
                ? `積分扣除 ${Math.abs(delta)}`
                : "積分無變化";

          resultScoreDelta.dataset.delta = String(delta);
          resultScoreDelta.classList.toggle("is-plus", delta > 0);
          resultScoreDelta.classList.toggle("is-minus", delta < 0);
          resultScoreDelta.classList.toggle("is-zero", delta === 0);
        }

        forceResultVisible();
        forceRankListScrollable();

        if (typeof window.renderRewardBanner === "function") {
          window.renderRewardBanner(updatedResult);
        }

        /*
         * hydrate 好友榜完成後，結果頁可能被重排。
         * 這裡重新確保每週三蛋仍然掛在正確位置。
         */
        safeRenderWeeklyGacha(updatedResult);

        track("result_friend_rank_loaded", {
          result: resultType,
          finish: finishType,
          points,
          score: finalScore,
          lineInviteFriendCount: state?.lineInviteFriendCount || 0,
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

        if (typeof window.renderRewardBanner === "function") {
          window.renderRewardBanner(result);
        }

        /*
         * 即使好友榜載入失敗，也要保持每週三蛋顯示。
         */
        safeRenderWeeklyGacha(result);
      });
  }

  track("result_view", {
    result: resultType,
    finish: finishType,
    points,
    score: Number(result.score || 0),
    rewardPointsGain,
    rewardPointsTotal,
    couponCode: coupon,
    lineInviteFriendCount: result.lineInviteFriendCount,
    referralCode: getMyReferralCode(),
    playerTopId: result.playerTopId || state?.selectedTop?.id || "",
    playerTopName: result.playerTopName || state?.selectedTop?.name || "",
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

window.renderResult = renderResult;





  function repairResultDomClasses() {
  const resultScreen = screenResult();

  if (!resultScreen) return;

  resultScreen.classList.add(
    "zg-screen",
    "zg-result-screen",
    "zg-result-classic-screen",
    "active",
    "is-active"
  );

  resultScreen.classList.remove("zg-result-onepage-screen");
  resultScreen.hidden = false;
  resultScreen.removeAttribute("hidden");
  resultScreen.setAttribute("aria-hidden", "false");

  let main = resultScreen.querySelector(".zg-result-main");

  if (!main) {
    main =
      resultScreen.querySelector("main") ||
      resultScreen.firstElementChild;
  }

  if (main) {
    main.classList.add(
      "zg-result-main",
      "zg-result-classic-main"
    );

    main.classList.remove(
      "zg-invite-reward",
      "zg-result-onepage-main"
    );
  }

  const inviteCard = resultScreen.querySelector("#zg-invite-mission-card");

  if (inviteCard) {
    inviteCard.classList.add("zg-invite-mission-card");
    inviteCard.classList.remove("zg-invite-reward");
  }

  const rewardRoot = resultScreen.querySelector("#zelo-reward-banner");

  if (rewardRoot) {
    rewardRoot.classList.add("zg-reward-banner-root");
  }
}


function forceResultVisible() {
  repairResultDomClasses();
  const root = appRoot();
  const resultScreen = screenResult();
  hideOldRewardBanner();

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

  const topWrapH = veryCompact ? 156 : compact ? 174 : 196;
  const topSize = veryCompact ? 138 : compact ? 158 : 184;

  const statW = veryCompact ? 96 : compact ? 116 : 140;
  const statH = veryCompact ? 38 : compact ? 42 : 46;

  const titleSize = veryCompact ? 23 : compact ? 26 : 31;

  const couponMinH = veryCompact ? 126 : compact ? 140 : 156;
  const couponPad = veryCompact
    ? "13px 18px"
    : compact
      ? "15px 20px"
      : "18px 22px";

  const couponCodeSize = veryCompact ? 28 : compact ? 32 : 38;
  const couponCopyH = veryCompact ? 42 : compact ? 48 : 54;
  const couponCopySize = veryCompact ? 14 : compact ? 16 : 18;

  const rankPad = veryCompact
    ? "12px 14px 14px"
    : compact
      ? "14px 16px 16px"
      : "16px 16px 18px";

  const rankTitleSize = veryCompact ? 18 : compact ? 20 : 22;
  const rankRowH = veryCompact ? 54 : compact ? 60 : 66;
  const rankMedalSize = veryCompact ? 30 : compact ? 34 : 36;
  const rankAvatarSize = veryCompact ? 26 : compact ? 28 : 30;
  const rankRowGap = veryCompact ? 6 : compact ? 7 : 8;

  const btnH = veryCompact ? 48 : compact ? 52 : 56;
  const btnSize = veryCompact ? 15 : compact ? 17 : 19;

  const mainGap = veryCompact ? 7 : compact ? 8 : 10;

  /*
   * 底部固定按鈕需要預留空間。
   * 按鈕為 2 列，所以至少需要 132px 以上。
   */
  const fixedActionsSpace = veryCompact ? 112 : compact ? 118 : 126;

  const mainPad = veryCompact
    ? `8px 12px calc(env(safe-area-inset-bottom, 0px) + ${fixedActionsSpace}px)`
    : compact
      ? `10px 12px calc(env(safe-area-inset-bottom, 0px) + ${fixedActionsSpace}px)`
      : `12px 18px calc(env(safe-area-inset-bottom, 0px) + ${fixedActionsSpace}px)`;

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

    set(main, "flex", "1 1 auto");
    set(main, "height", "auto");
    set(main, "min-height", "0");
    set(main, "max-height", "none");

    set(main, "display", "flex");
    set(main, "flex-direction", "column");
    set(main, "align-items", "stretch");
    set(main, "justify-content", "flex-start");
    set(main, "gap", `${mainGap}px`);

    set(
      main,
      "padding",
      veryCompact
        ? "8px 12px calc(env(safe-area-inset-bottom, 0px) + 104px)"
        : compact
          ? "10px 12px calc(env(safe-area-inset-bottom, 0px) + 110px)"
          : "12px 18px calc(env(safe-area-inset-bottom, 0px) + 116px)"
    );

    set(main, "overflow-y", "auto");
    set(main, "overflow-x", "hidden");
    set(main, "-webkit-overflow-scrolling", "touch");
    set(main, "overscroll-behavior", "contain");
    set(main, "box-sizing", "border-box");
    set(main, "transform", "none");

    set(main, "background", "transparent");
    set(main, "background-color", "transparent");
    set(main, "background-image", "none");

    clear(main, [
      "grid-template-columns",
      "grid-template-rows",
      "align-content",
      "justify-items"
    ]);
  }

  /*
   * 舊版 class 清除
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
    set(card, "box-sizing", "border-box");
    set(card, "overflow", "hidden");

    clear(card, [
      "background",
      "border",
      "box-shadow",
      "backdrop-filter",
      "-webkit-backdrop-filter"
    ]);
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
    set(message, "display", "flex");
    set(message, "align-items", "center");
    set(message, "justify-content", "center");

    set(message, "width", "100%");
    set(message, "margin", veryCompact ? "6px 0 0" : "8px 0 0");
    set(message, "padding", "0");

    set(
      message,
      "font-size",
      veryCompact ? "20px" : compact ? "24px" : "30px"
    );

    set(message, "line-height", "1.12");
    set(message, "font-weight", "950");
    set(message, "color", "rgba(255,255,255,.88)");
    set(message, "text-align", "center");
    set(message, "white-space", "nowrap");
    set(message, "letter-spacing", "-0.035em");
    set(message, "text-shadow", "0 3px 12px rgba(0,0,0,.45)");
    set(message, "box-sizing", "border-box");
  }

  const scoreDelta = $("#zg-result-score-delta", resultScreen);

  if (scoreDelta) {
    set(scoreDelta, "display", "inline-flex");
    set(scoreDelta, "align-items", "center");
    set(scoreDelta, "justify-content", "center");

    set(scoreDelta, "margin", veryCompact ? "5px auto 0" : "7px auto 0");
    set(scoreDelta, "padding", veryCompact ? "5px 10px" : "6px 12px");
    set(scoreDelta, "border-radius", "999px");

    set(
      scoreDelta,
      "font-size",
      veryCompact ? "12px" : compact ? "13px" : "14px"
    );

    set(scoreDelta, "font-weight", "950");
    set(scoreDelta, "line-height", "1");
    set(scoreDelta, "white-space", "nowrap");
    set(scoreDelta, "box-sizing", "border-box");

    const deltaValue = Number(scoreDelta.dataset.delta || 0);

    if (deltaValue > 0) {
      set(scoreDelta, "color", "#102414");
      set(
        scoreDelta,
        "background",
        "linear-gradient(180deg, #7dff9c, #18d85f)"
      );
      set(
        scoreDelta,
        "box-shadow",
        "0 0 14px rgba(24,216,95,.32), inset 0 1px 0 rgba(255,255,255,.45)"
      );
    } else if (deltaValue < 0) {
      set(scoreDelta, "color", "#fff");
      set(
        scoreDelta,
        "background",
        "linear-gradient(180deg, #ff6d7e, #e6002d)"
      );
      set(
        scoreDelta,
        "box-shadow",
        "0 0 16px rgba(230,0,45,.38), inset 0 1px 0 rgba(255,255,255,.22)"
      );
    } else {
      set(scoreDelta, "color", "rgba(255,255,255,.82)");
      set(scoreDelta, "background", "rgba(255,255,255,.12)");
      set(scoreDelta, "box-shadow", "inset 0 1px 0 rgba(255,255,255,.12)");
    }
  }

  /*
   * ZELO Points card
   */
  const pointsCard = $("#zg-points-card", resultScreen);

  if (pointsCard) {
    set(pointsCard, "display", "flex");
    set(pointsCard, "flex-direction", "column");
    set(pointsCard, "width", "100%");
    set(pointsCard, "min-width", "0");
    set(pointsCard, "max-width", "100%");
    set(pointsCard, "padding", veryCompact ? "13px 16px" : "16px 20px");
    set(pointsCard, "border-radius", "18px");
    set(
      pointsCard,
      "background",
      "linear-gradient(180deg, rgba(255,224,95,.18), rgba(255,150,40,.12))"
    );
    set(pointsCard, "border", "1px solid rgba(255,224,95,.22)");
    set(
      pointsCard,
      "box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.08), 0 12px 24px rgba(0,0,0,.22)"
    );
    set(pointsCard, "box-sizing", "border-box");
  }

  const pointsHead = $(".zg-points-card-head", resultScreen);

  if (pointsHead) {
    set(pointsHead, "display", "flex");
    set(pointsHead, "align-items", "center");
    set(pointsHead, "justify-content", "space-between");
    set(pointsHead, "gap", "12px");
  }

  $$(".zg-points-kicker", resultScreen).forEach((el) => {
    set(el, "display", "block");
    set(el, "font-size", veryCompact ? "10px" : "11px");
    set(el, "font-weight", "900");
    set(el, "letter-spacing", ".08em");
    set(el, "color", "rgba(255,224,95,.82)");
    set(el, "line-height", "1");
  });

  $$(".zg-points-card-head strong", resultScreen).forEach((el) => {
    set(el, "display", "block");
    set(el, "margin-top", "5px");
    set(el, "font-size", veryCompact ? "17px" : "19px");
    set(el, "font-weight", "950");
    set(el, "color", "#fff");
    set(el, "line-height", "1");
  });

  const pointsGain = $("#zg-points-gain", resultScreen);

  if (pointsGain) {
    set(pointsGain, "font-size", veryCompact ? "30px" : "36px");
    set(pointsGain, "font-weight", "1000");
    set(pointsGain, "line-height", "1");
    set(pointsGain, "color", "#ffe05f");
    set(pointsGain, "text-shadow", "0 0 18px rgba(255,224,95,.28)");
    set(pointsGain, "white-space", "nowrap");
  }

  const pointsTotal = $(".zg-points-total", resultScreen);

  if (pointsTotal) {
    set(pointsTotal, "margin-top", "10px");
    set(pointsTotal, "font-size", veryCompact ? "14px" : "16px");
    set(pointsTotal, "font-weight", "850");
    set(pointsTotal, "color", "rgba(255,255,255,.78)");
    set(pointsTotal, "line-height", "1.2");
  }

  $$(".zg-points-total strong", resultScreen).forEach((el) => {
    set(el, "color", "#ffe05f");
    set(el, "font-size", veryCompact ? "18px" : "20px");
    set(el, "font-weight", "1000");
  });

    /*
   * Next reward card
   * 已停用「下一個獎勵」卡片，強制隱藏，不再套用任何顯示樣式。
   */
  const nextRewardCard = $("#zg-next-reward-card", resultScreen);

  if (nextRewardCard) {
    set(nextRewardCard, "display", "none");
    set(nextRewardCard, "visibility", "hidden");
    set(nextRewardCard, "pointer-events", "none");
  }


  /*
   * ---------------------------------------------------------
   * Coupon
   * 折扣券已停用，強制隱藏，不再套用任何顯示樣式。
   * ---------------------------------------------------------
   */
  const coupon = $("#zg-coupon-card", resultScreen);

  if (coupon) {
    set(coupon, "display", "none");
    set(coupon, "visibility", "hidden");
    set(coupon, "pointer-events", "none");
  }

  /*
   * ---------------------------------------------------------
   * Invite mission card
   * ---------------------------------------------------------
   */
  const inviteMissionCard = $("#zg-invite-mission-card", resultScreen);

  if (inviteMissionCard) {
    set(inviteMissionCard, "display", "flex");
    set(inviteMissionCard, "flex-direction", "column");

    set(inviteMissionCard, "width", "100%");
    set(inviteMissionCard, "min-width", "0");
    set(inviteMissionCard, "max-width", "100%");

    set(inviteMissionCard, "height", "auto");
    set(inviteMissionCard, "min-height", veryCompact ? "154px" : compact ? "166px" : "180px");
    set(inviteMissionCard, "max-height", "none");

    set(inviteMissionCard, "padding", veryCompact ? "16px 14px 18px" : "20px 20px 22px");
    set(inviteMissionCard, "border-radius", "20px");

    set(
      inviteMissionCard,
      "background",
      "linear-gradient(180deg, rgba(35,44,91,.94), rgba(25,34,76,.92))"
    );

    set(inviteMissionCard, "border", "1px solid rgba(114,140,255,.22)");
    set(
      inviteMissionCard,
      "box-shadow",
      "inset 0 1px 0 rgba(255,255,255,.08), 0 12px 24px rgba(0,0,0,.24)"
    );

    set(inviteMissionCard, "box-sizing", "border-box");
    set(inviteMissionCard, "overflow", "hidden");
  }

  const inviteMissionHead = $(".zg-invite-mission-head", resultScreen);

  if (inviteMissionHead) {
    set(inviteMissionHead, "display", "flex");
    set(inviteMissionHead, "align-items", "flex-start");
    set(inviteMissionHead, "justify-content", "space-between");
    set(inviteMissionHead, "gap", "12px");
    set(inviteMissionHead, "width", "100%");
    set(inviteMissionHead, "margin", "0 0 18px");
  }

  const inviteMissionTitle = $(".zg-invite-mission-title", resultScreen);

  if (inviteMissionTitle) {
    set(inviteMissionTitle, "font-size", veryCompact ? "20px" : compact ? "22px" : "24px");
    set(inviteMissionTitle, "font-weight", "950");
    set(inviteMissionTitle, "line-height", "1.15");
    set(inviteMissionTitle, "color", "rgba(255,255,255,.9)");
    set(inviteMissionTitle, "white-space", "nowrap");
  }

  const inviteMissionStatus = $("#zg-invite-mission-status", resultScreen);

  if (inviteMissionStatus) {
    set(inviteMissionStatus, "font-size", veryCompact ? "18px" : compact ? "20px" : "22px");
    set(inviteMissionStatus, "font-weight", "950");
    set(inviteMissionStatus, "line-height", "1.15");
    set(inviteMissionStatus, "color", "#ffef75");
    set(inviteMissionStatus, "white-space", "nowrap");
    set(inviteMissionStatus, "text-align", "right");
  }

  const inviteMissionProgress = $("#zg-invite-mission-progress", resultScreen);

  if (inviteMissionProgress) {
    set(inviteMissionProgress, "position", "relative");
    set(inviteMissionProgress, "display", "grid");
    set(inviteMissionProgress, "grid-template-columns", "repeat(3, minmax(0, 1fr))");
    set(inviteMissionProgress, "align-items", "stretch");
    set(inviteMissionProgress, "justify-items", "center");
    set(inviteMissionProgress, "gap", veryCompact ? "8px" : "12px");
    set(inviteMissionProgress, "width", "100%");
    set(inviteMissionProgress, "height", "auto");
    set(inviteMissionProgress, "min-height", veryCompact ? "88px" : "96px");
    set(inviteMissionProgress, "margin", "0");
    set(inviteMissionProgress, "padding", "8px 0 0");
    set(inviteMissionProgress, "box-sizing", "border-box");
  }

  const inviteMissionLine = $(".zg-invite-mission-line", resultScreen);

  if (inviteMissionLine) {
    set(inviteMissionLine, "position", "absolute");
    set(inviteMissionLine, "left", "14%");
    set(inviteMissionLine, "right", "14%");
    set(inviteMissionLine, "top", veryCompact ? "44px" : "48px");
    set(inviteMissionLine, "height", "7px");
    set(inviteMissionLine, "transform", "none");
    set(inviteMissionLine, "background", "rgba(91,104,166,.48)");
    set(inviteMissionLine, "border-radius", "999px");
    set(inviteMissionLine, "overflow", "hidden");
    set(inviteMissionLine, "z-index", "1");
  }

  const inviteMissionLineFill = $(".zg-invite-mission-line-fill", resultScreen);

  if (inviteMissionLineFill) {
    set(inviteMissionLineFill, "display", "block");
    set(inviteMissionLineFill, "height", "100%");
    set(inviteMissionLineFill, "width", inviteMissionLineFill.style.width || "0%");
    set(
      inviteMissionLineFill,
      "background",
      "linear-gradient(90deg, #cd8a4a, #d8d8dc 50%, #ffd76a)"
    );
    set(inviteMissionLineFill, "border-radius", "999px");
    set(inviteMissionLineFill, "transition", "width .28s ease");
  }

  /*
   * ---------------------------------------------------------
   * 銅／銀／金 三種質感卡片配色表
   * locked：降彩度深色版（仍是不透明實色，不是半透明）
   * unlocked：高彩度金屬光澤版 + 外框光暈
   * ---------------------------------------------------------
   */
  const tierStyle = {
    bronze: {
      locked: {
        background: "linear-gradient(180deg, #4a3527, #2e2018)",
        color: "rgba(255,255,255,.55)",
        border: "1px solid rgba(205,138,74,.28)",
        shadow: "inset 0 1px 0 rgba(255,255,255,.06)"
      },
      unlocked: {
        background: "linear-gradient(180deg, #e3a866, #a86a34 55%, #7a4a22)",
        color: "#2a1608",
        border: "1px solid rgba(255,214,160,.55)",
        shadow: "0 0 16px rgba(205,138,74,.42), inset 0 1px 0 rgba(255,255,255,.5)"
      }
    },
    silver: {
      locked: {
        background: "linear-gradient(180deg, #3d4048, #24262c)",
        color: "rgba(255,255,255,.55)",
        border: "1px solid rgba(216,216,220,.24)",
        shadow: "inset 0 1px 0 rgba(255,255,255,.06)"
      },
      unlocked: {
        background: "linear-gradient(180deg, #f4f6fa, #c3c8d4 55%, #9aa0ac)",
        color: "#20242c",
        border: "1px solid rgba(255,255,255,.7)",
        shadow: "0 0 16px rgba(216,220,230,.5), inset 0 1px 0 rgba(255,255,255,.65)"
      }
    },
    gold: {
      locked: {
        background: "linear-gradient(180deg, #4a4020, #2e2812)",
        color: "rgba(255,255,255,.55)",
        border: "1px solid rgba(255,215,106,.28)",
        shadow: "inset 0 1px 0 rgba(255,255,255,.06)"
      },
      unlocked: {
        background: "linear-gradient(180deg, #fff27a, #f6c135 55%, #d9971a)",
        color: "#2a1c04",
        border: "1px solid rgba(255,245,190,.7)",
        shadow: "0 0 20px rgba(255,224,95,.5), inset 0 1px 0 rgba(255,255,255,.55)"
      }
    }
  };

  $$(".zg-invite-mission-node", resultScreen).forEach((node) => {
    const tier = node.getAttribute("data-tier") || "bronze";
    const isUnlocked = node.classList.contains("is-unlocked");
    const palette = tierStyle[tier] || tierStyle.bronze;
    const style = isUnlocked ? palette.unlocked : palette.locked;

    set(node, "position", "relative");
    set(node, "z-index", "2");

    set(node, "display", "flex");
    set(node, "align-items", "center");
    set(node, "justify-content", "center");
    set(node, "flex-direction", "column");
    set(node, "gap", veryCompact ? "4px" : "5px");

    set(node, "width", "100%");
    set(node, "min-width", "0");
    set(node, "max-width", veryCompact ? "94px" : "120px");

    set(node, "height", veryCompact ? "78px" : "88px");
    set(node, "min-height", veryCompact ? "78px" : "88px");
    set(node, "border-radius", "18px");

    set(node, "padding", veryCompact ? "10px 4px 8px" : "12px 6px 10px");

    set(node, "background", style.background);
    set(node, "border", style.border);
    set(node, "box-shadow", style.shadow);

    set(node, "color", style.color);
    set(node, "box-sizing", "border-box");
    set(node, "overflow", "visible");
    set(node, "opacity", "1");
  });

  $$(".zg-invite-mission-node strong", resultScreen).forEach((strong) => {
    set(strong, "display", "block");
    set(strong, "font-size", veryCompact ? "22px" : "26px");
    set(strong, "font-weight", "950");
    set(strong, "line-height", "1");
    set(strong, "white-space", "nowrap");
    set(strong, "color", "inherit");
  });

  $$(".zg-invite-mission-node small", resultScreen).forEach((small) => {
    set(small, "display", "block");
    set(small, "font-size", veryCompact ? "11px" : "13px");
    set(small, "font-weight", "850");
    set(small, "line-height", "1.15");
    set(small, "white-space", "normal");
    set(small, "word-break", "keep-all");
    set(small, "text-align", "center");
    set(small, "opacity", ".92");
    set(small, "color", "inherit");
  });

  $$(".zg-invite-mission-medal", resultScreen).forEach((medal) => {
    set(medal, "position", "static");
    set(medal, "display", "block");
    set(medal, "transform", "none");
    set(medal, "font-size", veryCompact ? "16px" : "18px");
    set(medal, "line-height", "1");
    set(medal, "margin", "0");
  });

  const inviteMissionCurrentCount = $(".zg-invite-mission-current-count", resultScreen);

  if (inviteMissionCurrentCount) {
    set(inviteMissionCurrentCount, "display", "block");
    set(inviteMissionCurrentCount, "margin", veryCompact ? "10px 0 0" : "12px 0 0");
    set(inviteMissionCurrentCount, "font-size", veryCompact ? "13px" : "14px");
    set(inviteMissionCurrentCount, "font-weight", "850");
    set(inviteMissionCurrentCount, "line-height", "1.3");
    set(inviteMissionCurrentCount, "color", "rgba(255,255,255,.68)");
    set(inviteMissionCurrentCount, "text-align", "center");
  }

  $$(".zg-invite-mission-current-count strong", resultScreen).forEach((strong) => {
    set(strong, "color", "#57f2ff");
    set(strong, "font-size", veryCompact ? "15px" : "16px");
    set(strong, "font-weight", "950");
  });

  const inviteMissionLabels = $(".zg-invite-mission-labels", resultScreen);

  if (inviteMissionLabels) {
    set(inviteMissionLabels, "display", "none");
  }


  /*
 * ---------------------------------------------------------
 * Weekly Gacha card / 每週三蛋
 * ---------------------------------------------------------
 */
  /*
   * 隱藏舊版 ZELO REWARD / 獎品獎勵兌換區塊。
   */
  const oldRewardBanner = $("#zelo-reward-banner", resultScreen);

  if (oldRewardBanner) {
    set(oldRewardBanner, "display", "none");
    set(oldRewardBanner, "visibility", "hidden");
    set(oldRewardBanner, "height", "0");
    set(oldRewardBanner, "min-height", "0");
    set(oldRewardBanner, "max-height", "0");
    set(oldRewardBanner, "margin", "0");
    set(oldRewardBanner, "padding", "0");
    set(oldRewardBanner, "overflow", "hidden");
    set(oldRewardBanner, "pointer-events", "none");
    oldRewardBanner.setAttribute("aria-hidden", "true");
  }


  
const weeklyGachaRoot = $("#zelo-weekly-gacha-container", resultScreen);

if (weeklyGachaRoot) {
  set(weeklyGachaRoot, "display", "block");
  set(weeklyGachaRoot, "width", "100%");
  set(weeklyGachaRoot, "min-width", "0");
  set(weeklyGachaRoot, "max-width", "100%");
  set(weeklyGachaRoot, "height", "auto");
  set(weeklyGachaRoot, "min-height", "0");
  set(weeklyGachaRoot, "max-height", "none");
  set(weeklyGachaRoot, "margin", "0");
  set(weeklyGachaRoot, "padding", "0");
  set(weeklyGachaRoot, "box-sizing", "border-box");
  set(weeklyGachaRoot, "overflow", "visible");
}

const weeklyGachaCard = $(".zg-weekly-gacha-card", resultScreen);

if (weeklyGachaCard) {
  set(weeklyGachaCard, "width", "100%");
  set(weeklyGachaCard, "min-width", "0");
  set(weeklyGachaCard, "max-width", "100%");

  set(weeklyGachaCard, "height", "auto");
  set(weeklyGachaCard, "min-height", "0");
  set(weeklyGachaCard, "max-height", "none");

  set(weeklyGachaCard, "padding", veryCompact ? "14px" : "18px");
  set(weeklyGachaCard, "border-radius", "20px");

  set(
    weeklyGachaCard,
    "background",
    "linear-gradient(180deg, rgba(28,38,82,.96), rgba(14,22,52,.94))"
  );

  set(weeklyGachaCard, "border", "1px solid rgba(255,224,95,.22)");

  set(
    weeklyGachaCard,
    "box-shadow",
    "inset 0 1px 0 rgba(255,255,255,.08), 0 12px 24px rgba(0,0,0,.24)"
  );

  set(weeklyGachaCard, "box-sizing", "border-box");
  set(weeklyGachaCard, "overflow", "hidden");
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

  $$(".zg-rank-classic-item, .zg-rank-item", resultScreen).forEach((item) => {
    item.classList.add("zg-rank-classic-item");

    set(item, "display", "grid");
    set(item, "grid-template-columns", "42px 32px minmax(0, 1fr) auto");
    set(item, "align-items", "center");
    set(item, "gap", veryCompact ? "7px" : "9px");

    set(item, "height", `${rankRowH}px`);
    set(item, "min-height", `${rankRowH}px`);
    set(item, "max-height", `${rankRowH}px`);

    set(item, "padding", veryCompact ? "4px 12px" : "5px 14px");

    set(
      item,
      "background",
      "linear-gradient(180deg, rgba(72,82,105,.78), rgba(47,56,76,.78))"
    );

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

  $$(".zg-rank-item.is-placeholder .zg-rank-avatar", resultScreen).forEach((avatar) => {
    set(avatar, "opacity", ".55");
  });

  $$(".zg-rank-classic-player, .zg-rank-player", resultScreen).forEach((player) => {
    player.classList.add("zg-rank-classic-player");

    set(player, "min-width", "0");
    set(player, "overflow", "hidden");
  });

  $$(".zg-rank-name-row", resultScreen).forEach((row) => {
    set(row, "display", "flex");
    set(row, "align-items", "center");
    set(row, "gap", veryCompact ? "4px" : "5px");
    set(row, "min-width", "0");
    set(row, "max-width", "100%");
    set(row, "overflow", "hidden");
  });

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
   *
   * 重要：
   * 這裡把結果頁按鈕移到 #screen-result 下面，
   * 用 fixed 固定底部，不再參與 .zg-result-main 排版。
   * 這樣按鈕不會插在 ZELO Points 和折扣碼中間。
   */
  const actions = $(".zg-result-actions", resultScreen);

  if (resultScreen && actions && actions.parentElement !== resultScreen) {
    resultScreen.appendChild(actions);
  }

if (actions) {
  actions.classList.add("zg-result-actions-classic", "zg-result-actions-alpha");
  actions.classList.remove("zg-result-actions-twoline", "zg-result-actions-oneline");

  set(actions, "display", "grid");
  set(actions, "grid-template-columns", "repeat(2, minmax(0, 1fr))");
  set(actions, "grid-template-rows", "auto auto");
  set(actions, "gap", veryCompact ? "9px 10px" : "10px 12px");

  set(actions, "position", "fixed");
  set(actions, "left", "12px");
  set(actions, "right", "12px");
  set(actions, "bottom", "calc(env(safe-area-inset-bottom, 0px) + 8px)");

  set(actions, "width", "auto");
  set(actions, "min-width", "0");
  set(actions, "max-width", "none");

  set(actions, "height", "auto");
  set(actions, "min-height", "0");
  set(actions, "max-height", "none");

  set(actions, "margin", "0");

  set(actions, "padding", "0");

  set(actions, "z-index", "999999");
  set(actions, "pointer-events", "auto");
  set(actions, "box-sizing", "border-box");
  set(actions, "isolation", "isolate");

  set(actions, "background", "transparent");
  set(actions, "background-color", "transparent");
  set(actions, "background-image", "none");

  set(actions, "border", "0");
  set(actions, "border-radius", "0");
  set(actions, "box-shadow", "none");
  set(actions, "backdrop-filter", "none");
  set(actions, "-webkit-backdrop-filter", "none");
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
    set(btn, "position", "relative");
    set(btn, "z-index", "1000000");
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
    set(el, "z-index", el.closest(".zg-result-actions") ? "1000000" : "30");
  });
   installResultActionBarAlphaPatch();
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
async function checkLineFriendshipRequired() {
  try {
    if (!window.liff || typeof window.liff.getFriendship !== "function") {
      console.warn("[ZELO GAME] liff.getFriendship not available");
      return true;
    }

    const friendship = await window.liff.getFriendship();

    console.log("[ZELO GAME] getFriendship result:", friendship);

    if (friendship && friendship.friendFlag === true) {
      console.log("[ZELO GAME] LINE OA friendship confirmed");

      try {
        sessionStorage.setItem("ZELO_LINE_FRIEND_OK", "1");
      } catch (error) {}

      return true;
    }

    console.warn("[ZELO GAME] User has not added LINE OA friend");
    showAddFriendRequiredScreen();
    return false;
  } catch (error) {
    console.warn("[ZELO GAME] getFriendship failed", error);

    try {
      if (sessionStorage.getItem("ZELO_LINE_FRIEND_OK") === "1") {
        return true;
      }
    } catch (e) {}

    return true;
  }
}



function showAddFriendRequiredScreen() {
  if (document.getElementById("zg-add-friend-required")) return;

  const overlay = document.createElement("div");
  overlay.id = "zg-add-friend-required";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "999999";
  overlay.style.background = "rgba(0,0,0,0.88)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.padding = "24px";
  overlay.style.boxSizing = "border-box";

  overlay.innerHTML = `
    <div style="
      width:100%;
      max-width:420px;
      background:#ffffff;
      border-radius:22px;
      padding:28px 22px;
      text-align:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      box-shadow:0 18px 48px rgba(0,0,0,.35);
    ">
      <div style="font-size:25px;font-weight:900;color:#111;margin-bottom:12px;">
        請先加入 ZELO 官方 LINE
      </div>

      <div style="font-size:16px;line-height:1.7;color:#444;margin-bottom:22px;">
        加入官方帳號好友後，才能開始挑戰遊戲、累積分數與參加排行榜活動。
      </div>

      <a href="https://lin.ee/t6noQCz" style="
        display:block;
        width:100%;
        box-sizing:border-box;
        background:#06C755;
        color:#fff;
        text-decoration:none;
        font-size:18px;
        font-weight:800;
        border-radius:999px;
        padding:14px 18px;
        margin-bottom:12px;
      ">
        加入 LINE 好友
      </a>

      <button type="button" onclick="window.location.reload()" style="
        width:100%;
        border:0;
        background:#eeeeee;
        color:#111;
        font-size:15px;
        font-weight:800;
        border-radius:999px;
        padding:12px 18px;
      ">
        我已加入，重新檢查
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
}

  

async function initLiffProfile() {
  const liffId = window.ZELO_LIFF_ID || window.liffId || "";

  const isInLineClient =
    window.liff &&
    typeof window.liff.isInClient === "function" &&
    window.liff.isInClient();

  const isLiffUrl =
    location.hostname === "liff.line.me" ||
    location.href.indexOf("liff.state=") !== -1 ||
    location.href.indexOf("access.line.me") !== -1;

  if (!liffId || !window.liff) {
    console.warn("[ZELO GAME] LIFF not available, preview mode allowed");
    return {
      userId: "preview-user",
      displayName: "Preview User",
      pictureUrl: ""
    };
  }

  try {
    await window.liff.init({
      liffId
    });

    if (!window.liff.isLoggedIn()) {
      if (isInLineClient) {
        try {
          window.liff.login();
        } catch (error) {
          console.warn("[ZELO GAME] liff.login() in client failed:", error);
        }

        return null;
      }

      if (isLiffUrl) {
        try {
          window.liff.login({
            redirectUri: window.location.href
          });
        } catch (error) {
          console.warn("[ZELO GAME] liff.login() LIFF url failed:", error);
          showAddFriendRequiredScreen();
        }

        return null;
      }

      console.warn("[ZELO GAME] browser preview mode: skip liff.login");

      return {
        userId: "preview-user",
        displayName: "Preview User",
        pictureUrl: ""
      };
    }

    const isLineFriend = await checkLineFriendshipRequired();

    if (!isLineFriend) {
      try {
        track("line_friend_required_blocked", {
          source: "initLiffProfile",
          liffId
        });
      } catch (error) {}

      return null;
    }

    const profile = await window.liff.getProfile();

    state.profile = profile;

    window.ZELO_PROFILE = profile;
    window.ZELO_LINE_PROFILE = profile;

    try {
      localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
    } catch (error) {}

    try {
      track("liff_profile_loaded", {
        userId: profile.userId || "",
        displayName: profile.displayName || ""
      });
    } catch (error) {}

    try {
      await syncMyReferralCodeFromServer("liff_profile_loaded");
    } catch (error) {}

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

    if (!isInLineClient && !isLiffUrl) {
      console.warn("[ZELO GAME] LIFF init failed, preview mode allowed");

      return {
        userId: "preview-user",
        displayName: "Preview User",
        pictureUrl: ""
      };
    }

    showAddFriendRequiredScreen();
    return null;
  }
}




  /*
 * =========================================================
 * 11.5 MOBILE PERFORMANCE MODE
 * =========================================================
 */

function isMobilePerformanceMode() {
  const ua = navigator.userAgent || "";

  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    window.innerWidth <= 768;

  const lowMemory =
    navigator.deviceMemory && navigator.deviceMemory <= 4;

  const lowCore =
    navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  return isMobile || lowMemory || lowCore;
}

function isMobilePerformanceMode() {
  const ua = navigator.userAgent || "";

  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    window.innerWidth <= 768;

  const lowMemory =
    !!navigator.deviceMemory &&
    navigator.deviceMemory <= 4;

  const lowCore =
    !!navigator.hardwareConcurrency &&
    navigator.hardwareConcurrency <= 4;

  return isMobile || lowMemory || lowCore;
}

function installPerformanceModeCss() {
  if (document.getElementById("zg-performance-mode-css")) return;

  const style = document.createElement("style");
  style.id = "zg-performance-mode-css";

  style.textContent = [
    ".zg-performance-mode *,",
    ".zg-performance-mode *::before,",
    ".zg-performance-mode *::after {",
    "  animation-duration: 0.001s !important;",
    "  animation-iteration-count: 1 !important;",
    "  transition-duration: 0.001s !important;",
    "  scroll-behavior: auto !important;",
    "}",
    ".zg-performance-mode .zg-bg-video,",
    ".zg-performance-mode .zg-bg-glow,",
    ".zg-performance-mode .zg-particle,",
    ".zg-performance-mode .zg-particles,",
    ".zg-performance-mode .zg-orb,",
    ".zg-performance-mode .zg-aura,",
    ".zg-performance-mode .zg-energy-glow,",
    ".zg-performance-mode .zg-light,",
    ".zg-performance-mode .zg-flash,",
    ".zg-performance-mode .zg-shine,",
    ".zg-performance-mode .zg-home-video,",
    ".zg-performance-mode .zg-video-bg {",
    "  display: none !important;",
    "}",
    ".zg-performance-mode #screen-battle {",
    "  filter: none !important;",
    "  backdrop-filter: none !important;",
    "  -webkit-backdrop-filter: none !important;",
    "}",
    ".zg-performance-mode #screen-battle * {",
    "  box-shadow: none !important;",
    "  text-shadow: none !important;",
    "  filter: none !important;",
    "}",
    ".zg-performance-mode .zg-top,",
    ".zg-performance-mode .zg-beyblade,",
    ".zg-performance-mode .zg-player-top,",
    ".zg-performance-mode .zg-enemy-top {",
    "  will-change: transform;",
    "  transform: translateZ(0);",
    "}"
  ].join("\n");

  document.head.appendChild(style);
}

function enterBattlePerformanceMode() {
  if (!isMobilePerformanceMode()) return;

  installPerformanceModeCss();

  document.documentElement.classList.add("zg-performance-mode");
  document.body.classList.add("zg-performance-mode");

  try {
    const videos = document.querySelectorAll("video");

    videos.forEach((video) => {
      video.__zgWasPlaying = !video.paused;

      if (!video.closest("#screen-battle")) {
        video.pause();
      }

      video.removeAttribute("autoplay");
      video.style.filter = "none";
      video.style.transform = "translateZ(0)";
    });
  } catch (error) {}

  try {
    window.__ZELO_PERFORMANCE_MODE__ = true;
  } catch (error) {}

  console.warn("[ZELO GAME] battle performance mode enabled");
}

function exitBattlePerformanceMode() {
  document.documentElement.classList.remove("zg-performance-mode");
  document.body.classList.remove("zg-performance-mode");

  try {
    const videos = document.querySelectorAll("video");

    videos.forEach((video) => {
      if (video.__zgWasPlaying) {
        const playPromise = video.play();

        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {});
        }
      }

      delete video.__zgWasPlaying;
    });
  } catch (error) {}

  try {
    window.__ZELO_PERFORMANCE_MODE__ = false;
  } catch (error) {}

  console.warn("[ZELO GAME] battle performance mode disabled");
}


/*
 * =========================================================
 * 12. TRACKING / Analytics
 * =========================================================
 */

function track(eventName, payload = {}) {
  try {
    const eventPayload = {
      eventName: eventName,
      timestamp: Date.now(),
      screen: state?.screen || "",
      version: typeof VERSION !== "undefined" ? VERSION : "",
      payload: payload || {}
    };

    console.log("[ZELO TRACK]", eventName, eventPayload);

    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        zeloEvent: eventPayload
      });
    }
  } catch (error) {
    console.warn("[ZELO GAME] track failed:", error);
  }
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
 * SECRET TOP REDEEM MODULE / 隱藏陀螺兌換系統
 * =========================================================
 * 整合重點：
 * 1. 常數集中定義在最上方
 * 2. 兌換成功後，改為「呼叫伺服器同步」而非只信任本地快取
 * 3. 加入防重複點擊 / loading 狀態保護
 * 4. 明確標註仍需要外部提供的依賴（見檔案底部 TODO）
 */

const SECRET_UNLOCK_STORAGE_KEY = "zg_secret_tops_unlocked";

/* ---------- 本地快取工具（僅作為 UI 立即反應用，非權威資料） ---------- */

function getUnlockedSecretTops() {
  try {
    return JSON.parse(localStorage.getItem(SECRET_UNLOCK_STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function setUnlockedSecretTops(list) {
  try {
    localStorage.setItem(SECRET_UNLOCK_STORAGE_KEY, JSON.stringify(list || []));
  } catch (e) {}
}

function unlockSecretTop(secretId) {
  const unlocked = getUnlockedSecretTops();
  if (!unlocked.includes(secretId)) {
    unlocked.push(secretId);
    setUnlockedSecretTops(unlocked);
  }
}

function isSecretTopUnlocked(secretId) {
  return getUnlockedSecretTops().includes(secretId);
}

/* ---------- 彈窗：查看兌換方式 ---------- */

function handleSecretRedeemInfo(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId); // TODO: 需確認 SECRET_TOPS 結構
  if (!top) return;

  const html = `
    <div class="zg-modal-overlay" data-zg-modal="secret-info">
      <div class="zg-modal zg-secret-modal">
        <div class="zg-modal-eyebrow">SECRET UNLOCK</div>
        <h3 class="zg-modal-title">兌換「${escapeHtml(top.name)}」</h3>
        <p class="zg-modal-desc">
          消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過官方管道取得兌換解鎖
        </p>
        <div class="zg-modal-info-box">
          結帳完成後，請將「訂單編號」或「消費證明截圖」<br>
          傳送給客服人員，經確認後將提供您專屬兌換碼。<br><br>
          取得兌換碼後，回到本頁點擊「開始兌換」輸入即可解鎖！
        </div>
        <div class="zg-modal-actions">
          <button class="zg-modal-btn-primary" data-zg-action="close-modal" type="button">
            我知道了
          </button>
        </div>
      </div>
    </div>
  `;

  openModal(html);
}

/* ---------- 彈窗：輸入兌換碼 ---------- */

function handleSecretRedeemStart(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId);
  if (!top) return;

  const html = `
    <div class="zg-modal-overlay" data-zg-modal="secret-redeem">
      <div class="zg-modal zg-secret-modal">
        <div class="zg-modal-eyebrow">SECRET UNLOCK</div>
        <h3 class="zg-modal-title">輸入兌換碼</h3>
        <p class="zg-modal-desc">
          請輸入專屬兌換碼，解鎖「${escapeHtml(top.name)}」
        </p>
        <input
          type="text"
          class="zg-redeem-input"
          id="zg-redeem-input"
          placeholder="請輸入兌換碼"
          autocomplete="off"
          autocapitalize="characters"
          style="
            width:100%;box-sizing:border-box;font-size:16px;line-height:1.4;
            padding:14px 16px;margin-top:12px;border-radius:12px;
            border:2px solid rgba(255,214,80,0.6);background:rgba(255,255,255,0.95);
            color:#111827;font-weight:700;letter-spacing:1px;outline:none;
          "
        >
        <div class="zg-redeem-error" id="zg-redeem-error"
             style="display:none;color:#ff6b6b;font-size:13px;margin-top:8px;">
          兌換碼錯誤，請重新確認
        </div>
        <div class="zg-modal-actions">
          <button class="zg-modal-btn-secondary" data-zg-action="close-modal" type="button">
            取消
          </button>
          <button class="zg-modal-btn-primary" data-zg-action="secret-redeem-confirm"
                  data-secret-id="${escapeAttr(topId)}" type="button">
            確認兌換
          </button>
        </div>
      </div>
    </div>
  `;

  openModal(html);

  setTimeout(() => {
    const input = document.getElementById("zg-redeem-input");
    if (input) {
      input.focus();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleSecretRedeemConfirm(topId);
        }
      });
    }
  }, 100);
}

/* ---------- 確認兌換（已修正：成功後強制向伺服器同步） ---------- */

async function handleSecretRedeemConfirm(secretId) {
  const input = document.getElementById("zg-redeem-input");
  const errorEl = document.getElementById("zg-redeem-error");
  const confirmBtn = document.querySelector('[data-zg-action="secret-redeem-confirm"]');

  if (!input) return;

  const code = input.value.trim().toUpperCase();

  if (errorEl) errorEl.style.display = "none";
  input.classList.remove("zg-input-error");

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "驗證中...";
  }

  const profilePayload = getProfilePayload();
  const userId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    (typeof getUserId === "function" ? getUserId() : "") ||
    "";

  const displayName =
    profilePayload.displayName ||
    (typeof getPlayerName === "function" ? getPlayerName() : "") ||
    "玩家";

  if (!userId) {
    if (errorEl) {
      errorEl.textContent = "請先完成 LINE 登入才能兌換。";
      errorEl.style.display = "block";
    }
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "確認兌換";
    }
    return;
  }

  const result = await postToZeloBackend({ // TODO: 需確認此函式的回傳格式
    action: "secret_redeem",
    userId: userId,
    lineUserId: userId,
    displayName: displayName,
    toyId: secretId,
    secretId: secretId,
    code: code,
    redeemCode: code
  });

  if (!result.ok) {
    const message = (result.data && result.data.message) || "兌換碼錯誤，請重新確認";

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    input.classList.add("zg-input-error");
    input.focus();

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "確認兌換";
    }

    track("secret_top_redeem_failed", {
      secretId: secretId,
      code: result.data && result.data.code,
      reason: result.data && result.data.reason
    });

    return;
  }

  const toyId = (result.data && result.data.toyId) || secretId;

  /*
   * ★ 修正重點：
   * 先做本地樂觀更新（讓 UI 立即反應），
   * 但接著呼叫 syncSecretUnlocksFromServer 取得伺服器權威清單覆蓋回來，
   * 避免本地快取與伺服器長期不一致。
   */
  unlockSecretTop(toyId);

  try {
    if (typeof syncSecretUnlocksFromServer === "function") {
      await syncSecretUnlocksFromServer(userId);
    }
  } catch (error) {
    console.warn("[ZELO GAME] post-redeem sync failed, keep local cache:", error);
  }

  closeModal();
  showSecretUnlockSuccessModal(secretId);
  renderSecretTopList();

  track("secret_top_redeem_success", {
    secretId: secretId,
    toyId: toyId
  });
}

/* ---------- 選擇已解鎖的隱藏陀螺上場 ---------- */

function handleSecretSelectTop(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId);
  if (!top) return;
  if (!isSecretTopUnlocked(topId)) return;

  state.selectedTop = top;
  saveSelectedTop(top);

  document.querySelectorAll(".zg-top-card").forEach((card) => {
    const active =
      card.getAttribute("data-id") === top.id ||
      card.getAttribute("data-top-id") === top.id ||
      card.getAttribute("data-secret-id") === top.id;

    card.classList.toggle("selected", active);
    card.classList.toggle("active", active);
    card.setAttribute("aria-selected", active ? "true" : "false");
  });

  track("select_top", {
    topId: top.id,
    topName: top.name,
    topType: top.type,
    source: "secret_select_page"
  });
}

/* ---------- 兌換成功彈窗 ---------- */

function showSecretUnlockSuccessModal(secretId) {
  const top = SECRET_TOPS.find((t) => t.id === secretId);
  if (!top) return;

  const html = `
    <div class="zg-modal-overlay" data-zg-modal="secret-success">
      <div class="zg-modal zg-secret-modal zg-secret-success">
        <div class="zg-modal-eyebrow">UNLOCKED!</div>
        <h3 class="zg-modal-title">🎉「${escapeHtml(top.name)}」已解鎖！</h3>
        <p class="zg-modal-desc">
          現在可以在對戰選擇畫面挑選這款隱藏陀螺出戰了！
        </p>
        <div class="zg-modal-actions">
          <button class="zg-modal-btn-primary" data-zg-action="close-modal" type="button">
            太棒了！
          </button>
        </div>
      </div>
    </div>
  `;

  openModal(html);
}

/*
 * =========================================================
 * TODO：以下 3 個依賴仍需要您提供，才能 100% 確認整合無誤
 * =========================================================
 * 1. SECRET_TOPS         → 陣列結構，例如 [{ id, name, type, ... }]
 * 2. postToZeloBackend   → 回傳格式是否固定為 { ok, data }
 * 3. syncSecretUnlocksFromServer → 是否會覆蓋 localStorage？
 *    （若這支函式尚未真正實作，上面的同步修正會失效，
 *      需要另外補上這支函式的內容）
 */



  
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

  window.__ZELO_BATTLE_FINISHING__ = false;
  window.__ZELO_BATTLE_FINISH_PROCESSED__ = false;
  window.__ZELO_RESULT_VIDEO_PLAYING__ = false;
  window.__ZELO_SKIP_RESULT_VIDEO__ = null;
  
  beginChargeBattle();
}


/*
 * 查看兌換方式：純說明彈窗，不含加 LINE 好友內容
 */
function handleSecretRedeemInfo(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId);
  if (!top) return;

  const html = `
    <div class="zg-modal-overlay" data-zg-modal="secret-info">
      <div class="zg-modal zg-secret-modal">
        <div class="zg-modal-eyebrow">SECRET UNLOCK</div>
        <h3 class="zg-modal-title">兌換「${escapeHtml(top.name)}」</h3>

        <p class="zg-modal-desc">
          消費滿 NT$${REDEEM_THRESHOLD.toLocaleString()} 即可透過官方管道取得兌換解鎖
        </p>

        <div class="zg-modal-info-box">
          結帳完成後，請將「訂單編號」或「消費證明截圖」<br>
          傳送給客服人員，經確認後將提供您專屬兌換碼。<br><br>
          取得兌換碼後，回到本頁點擊「開始兌換」輸入即可解鎖！
        </div>

        <div class="zg-modal-actions">
          <button class="zg-modal-btn-primary" data-zg-action="close-modal" type="button">
            我知道了
          </button>
        </div>
      </div>
    </div>
  `;

  openModal(html);
}

/*
 * 開始兌換：跳出輸入兌換碼的彈窗
 */
/*
 * 開始兌換：跳出輸入兌換碼的彈窗
 */
function handleSecretRedeemStart(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId);
  if (!top) return;

  const html = `
    <div class="zg-modal-overlay" data-zg-modal="secret-redeem">
      <div class="zg-modal zg-secret-modal">
        <div class="zg-modal-eyebrow">SECRET UNLOCK</div>
        <h3 class="zg-modal-title">輸入兌換碼</h3>

        <p class="zg-modal-desc">
          請輸入專屬兌換碼，解鎖「${escapeHtml(top.name)}」
        </p>

        <input
          type="text"
          class="zg-redeem-input"
          id="zg-redeem-input"
          placeholder="請輸入兌換碼"
          autocomplete="off"
          autocapitalize="characters"
          style="
            width:100%;
            box-sizing:border-box;
            font-size:16px;
            line-height:1.4;
            padding:14px 16px;
            margin-top:12px;
            border-radius:12px;
            border:2px solid rgba(255,214,80,0.6);
            background:rgba(255,255,255,0.95);
            color:#111827;
            font-weight:700;
            letter-spacing:1px;
            outline:none;
          "
        >

        <div
          class="zg-redeem-error"
          id="zg-redeem-error"
          style="display:none;color:#ff6b6b;font-size:13px;margin-top:8px;"
        >
          兌換碼錯誤，請重新確認
        </div>

        <div class="zg-modal-actions">
          <button class="zg-modal-btn-secondary" data-zg-action="close-modal" type="button">
            取消
          </button>
          <button
            class="zg-modal-btn-primary"
            data-zg-action="secret-redeem-confirm"
            data-secret-id="${escapeAttr(topId)}"
            type="button"
          >
            確認兌換
          </button>
        </div>
      </div>
    </div>
  `;

  openModal(html);

  setTimeout(() => {
    const input = document.getElementById("zg-redeem-input");
    if (input) {
      input.focus();

      // 支援按 Enter 直接送出
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          handleSecretRedeemConfirm(topId);
        }
      });
    }
  }, 100);
}


async function handleSecretRedeemConfirm(secretId) {
  const input = document.getElementById("zg-redeem-input");
  const errorEl = document.getElementById("zg-redeem-error");
  const confirmBtn = document.querySelector(
    '[data-zg-action="secret-redeem-confirm"]'
  );

  if (!input) return;

  const code = input.value.trim().toUpperCase();

  if (errorEl) {
    errorEl.style.display = "none";
  }

  input.classList.remove("zg-input-error");

  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "驗證中...";
  }

  const profilePayload = getProfilePayload();

  const userId =
    profilePayload.userId ||
    profilePayload.lineUserId ||
    (typeof getUserId === "function" ? getUserId() : "") ||
    "";

  const displayName =
    profilePayload.displayName ||
    (typeof getPlayerName === "function" ? getPlayerName() : "") ||
    "玩家";

  if (!userId) {
    if (errorEl) {
      errorEl.textContent = "請先完成 LINE 登入才能兌換。";
      errorEl.style.display = "block";
    }

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "確認兌換";
    }

    return;
  }

  const result = await postToZeloBackend({
    action: "secret_redeem",   // ✅ 改成後端認得的名稱
    userId: userId,
    lineUserId: userId,
    displayName: displayName,
    toyId: secretId,
    secretId: secretId,
    code: code,
    redeemCode: code
  });

  if (!result.ok) {
    const message =
      (result.data && result.data.message) ||
      "兌換碼錯誤，請重新確認";

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }

    input.classList.add("zg-input-error");
    input.focus();

    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "確認兌換";
    }

    track("secret_top_redeem_failed", {
      secretId: secretId,
      code: result.data && result.data.code,
      reason: result.data && result.data.reason
    });

    return;
  }

  const toyId = (result.data && result.data.toyId) || secretId;

  /*
   * 兌換成功：後端已寫入 PlayerSecretUnlocks 分頁，
   * 前端這裡同步快取一份，方便畫面立即反應。
   */
  try {
    const cache = getUnlockedSecretTops();

    if (!cache.includes(toyId)) {
      cache.push(toyId);
      localStorage.setItem(SECRET_UNLOCK_STORAGE_KEY, JSON.stringify(cache));
    }
  } catch (error) {}

  closeModal();
  showSecretUnlockSuccessModal(secretId);
  renderSecretTopList();

  track("secret_top_redeem_success", {
    secretId: secretId,
    toyId: toyId
  });
}


/*
 * 已解鎖的隱藏陀螺：選擇上場對戰
 * （對應「選擇上場 ✓」按鈕的 action: select-secret-top）
 */
function handleSecretSelectTop(topId) {
  const top = SECRET_TOPS.find((t) => t.id === topId);
  if (!top) return;

  if (!isSecretTopUnlocked(topId)) return;

  state.selectedTop = top;
  saveSelectedTop(top);

  $$(".zg-top-card").forEach((card) => {
    const active =
      card.getAttribute("data-id") === top.id ||
      card.getAttribute("data-top-id") === top.id ||
      card.getAttribute("data-secret-id") === top.id;

    card.classList.toggle("selected", active);
    card.classList.toggle("active", active);
    card.setAttribute("aria-selected", active ? "true" : "false");
  });

  track("select_top", {
    topId: top.id,
    topName: top.name,
    topType: top.type,
    source: "secret_select_page"
  });
}

function openModal(html) {
  closeModal();

  const root = document.createElement("div");
  root.id = "zg-modal-root";
  root.innerHTML = html;

  // 🍎 iOS 保護 1：強制最高層級，避免被 LIFF 外層 UI 蓋住或攔截
  root.style.position = "fixed";
  root.style.inset = "0";
  root.style.zIndex = "2147483647";
  root.style.pointerEvents = "auto";

  document.body.appendChild(root);
  document.body.classList.add("zg-modal-open");

  // 🍎 iOS 保護 2：暫時鎖住背景頁面滾動，避免 iOS WebView 判定觸控落在背景
  document.documentElement.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";

  const overlay = root.querySelector(".zg-modal-overlay, [data-zg-modal]");
  if (overlay) {
    overlay.style.touchAction = "none";
  }

  // 🍎 iOS 保護 3：延遲聚焦，且用 touchstart 也綁一次，避免 iOS Safari/LIFF 有時吃不到 focus()
  const input = root.querySelector("input, textarea");
  if (input) {
    input.style.pointerEvents = "auto";
    input.removeAttribute("readonly");

    setTimeout(() => {
      try {
        input.focus();
      } catch (e) {}
    }, 120);

    input.addEventListener("touchstart", function(e) {
      e.stopPropagation();
    }, { passive: true });

    input.addEventListener("click", function(e) {
      e.stopPropagation();
    });
  }
}


function closeModal() {
  const root = document.getElementById("zg-modal-root");

  if (root) {
    root.remove();
  }

  document.body.classList.remove("zg-modal-open");

  // 還原背景滾動鎖定
  document.documentElement.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
}


  

function handleAction(action, target) {
    if (!action) return;

    Sound.resume();

    // ✅ 暫時加入這一行除錯用
    console.log("handleAction 觸發:", action, target);

if (action === "secret-redeem-info") {
  const topId = target.getAttribute("data-secret-id");
  handleSecretRedeemInfo(topId);
  return;
}

if (action === "secret-redeem-start") {
  const topId = target.getAttribute("data-secret-id");
  handleSecretRedeemStart(topId);
  return;
}

/* ✅ 新增：彈窗內「確認兌換」按鈕 */
if (action === "secret-redeem-confirm") {
  const topId = target.getAttribute("data-secret-id");
  handleSecretRedeemConfirm(topId);
  return;
}

/* ✅ 新增：所有彈窗的「取消 / 我知道了 / 太棒了」按鈕共用 */
if (action === "close-modal") {
  closeModal();
  return;
}

if (action === "select-secret-top") {
  const topId = target.getAttribute("data-secret-id");
  handleSecretSelectTop(topId);
  return;
}

    
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

  let safeReferralUrl = String(referralUrl || "").trim();

  if (!/^https?:\/\//i.test(safeReferralUrl)) {
    safeReferralUrl =
      window.ZELO_LIFF_SHARE_URL ||
      window.ZELO_GAME_SHARE_URL ||
      "https://zelosportivo.com/";
  }

 const shareText =
  "🔥【ZELO 戰鬥邀請】🔥\n\n" +
  playerName + " 剛剛拿下「" + points + " 分」！\n" +
  "現在正式向你下戰帖 ⚔️\n\n" +
  "你能超越我的分數嗎？😎\n\n" +
  "🏆 挑戰高分排行榜\n" +
  "🎁 解鎖限定獎勵\n" +
  "💎 累積活動點數\n" +
  "🎉 神秘好禮等你帶走\n\n" +
  "👇 立即開戰：\n" +
  safeReferralUrl;


  track("liff_share_click", {
    source: "result_share_button",
    referralCode: myReferralCode,
    referralUrl: safeReferralUrl,
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

  if (!window.liff) {
    await showGachaDialog({
      kicker: "LINE SHARE",
      title: "請在 LINE App 內開啟",
      message: "目前無法使用 LINE 好友邀請功能。請從 LINE App 內重新開啟遊戲後再試一次。",
      highlight: "需要 LINE LIFF 環境",
      confirmText: "我知道了",
      danger: true
    });

    track("liff_share_blocked", {
      reason: "liff_sdk_missing",
      referralCode: myReferralCode,
      referralUrl: safeReferralUrl
    });

    return;
  }

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
        referralUrl: safeReferralUrl,
        message: String(error && error.message ? error.message : error)
      });

      await showGachaDialog({
        kicker: "LINE LOGIN",
        title: "LINE 登入失敗",
        message: "目前無法完成 LINE 登入。請重新開啟遊戲後再試一次。",
        highlight: "登入未完成",
        confirmText: "我知道了",
        danger: true
      });
    }

    return;
  }

  if (
    typeof window.liff.isInClient === "function" &&
    !window.liff.isInClient()
  ) {
    await showGachaDialog({
      kicker: "LINE SHARE",
      title: "請在 LINE App 內開啟",
      message: "LINE 好友邀請功能需要在 LINE App 內使用。請回到 LINE App 後重新開啟遊戲。",
      highlight: "目前不是 LINE App 環境",
      confirmText: "我知道了",
      danger: true
    });

    track("liff_share_blocked", {
      reason: "not_in_line_client",
      referralCode: myReferralCode,
      referralUrl: safeReferralUrl
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
    await showGachaDialog({
      kicker: "LINE SHARE",
      title: "目前無法使用好友邀請",
      message: "你的 LINE 版本目前不支援好友選擇分享。請更新 LINE App 後再試一次。",
      highlight: "需要支援 shareTargetPicker",
      confirmText: "我知道了",
      danger: true
    });

    track("liff_share_blocked", {
      reason: "share_target_picker_unavailable",
      referralCode: myReferralCode,
      referralUrl: safeReferralUrl
    });

    return;
  }

  try {
    const shareMessages = [
      {
        type: "text",
        text: shareText
      }
    ];

    console.log("[ZELO GAME] shareTargetPicker text stable payload:", shareMessages);

    const shareResult = await window.liff.shareTargetPicker(shareMessages);

    console.log("[ZELO GAME] shareTargetPicker text stable result:", shareResult);

    if (shareResult) {
      track("liff_share_sent", {
        source: "line_liff_share_target_picker_text_stable",
        referralCode: myReferralCode,
        referralUrl: safeReferralUrl,
        userId: profilePayload.userId,
        lineUserId: profilePayload.lineUserId,
        playerName,
        points,
        shareResult: JSON.stringify(shareResult)
      });

      await showGachaDialog({
        kicker: "LINE SHARE",
        title: "邀請已送出",
        message: "LINE 邀請已成功送出。好友點開 LIFF 遊戲後，才會增加成功邀請人數。",
        highlight: "分享完成",
        confirmText: "太好了"
      });

    } else {
      track("liff_share_cancelled", {
        source: "line_liff_share_target_picker_text_stable",
        referralCode: myReferralCode,
        referralUrl: safeReferralUrl,
        userId: profilePayload.userId,
        lineUserId: profilePayload.lineUserId,
        playerName,
        points
      });

      await showGachaDialog({
        kicker: "LINE SHARE",
        title: "尚未送出邀請",
        message: "你尚未選擇好友或完成分享，因此這次沒有送出 LINE 邀請。",
        highlight: "分享已取消",
        confirmText: "我知道了"
      });
    }

  } catch (error) {
    console.warn("[ZELO GAME] shareTargetPicker text stable failed:", {
      error: error,
      name: error && error.name,
      message: error && error.message,
      stack: error && error.stack,
      referralCode: myReferralCode,
      referralUrl: safeReferralUrl,
      userId: profilePayload.userId,
      lineUserId: profilePayload.lineUserId,
      playerName: playerName,
      points: points,
      hasLiff: !!window.liff,
      isInClient:
        !!(
          window.liff &&
          typeof window.liff.isInClient === "function" &&
          window.liff.isInClient()
        )
    });

    track("liff_share_failed", {
      source: "line_liff_share_target_picker_text_stable",
      referralCode: myReferralCode,
      referralUrl: safeReferralUrl,
      message: String(error && error.message ? error.message : error)
    });

    await showGachaDialog({
      kicker: "LINE SHARE",
      title: "好友邀請失敗",
      message: "LINE 好友邀請目前沒有成功送出，請稍後再試一次。",
      highlight: "分享未完成",
      confirmText: "我知道了",
      danger: true
    });
  }
}




function bindGlobalEvents() {
  if (state.globalBound) return;

  state.globalBound = true;

  /*
   * 全域 data-zg-action 點擊事件
   * （查看兌換方式 / 開始兌換 / 確認兌換 / 關閉彈窗 等按鈕都走這裡）
   */
  document.addEventListener(
    "click",
    (event) => {
      const actionEl = event.target.closest("[data-zg-action]");

      if (!actionEl) return;

      const root = appRoot();

      if (!root.contains(actionEl) && !document.body.contains(actionEl)) return;

      event.preventDefault();

      /*
       * ✅ 阻止同樣掛在 document 上的「陀螺卡片選擇」監聽器繼續執行，
       * 確保「查看兌換方式」「開始兌換」是完全獨立、互不干擾的 2 顆按鈕。
       */
      event.stopImmediatePropagation();
      event.stopPropagation();

      const action = actionEl.getAttribute("data-zg-action");

      handleAction(action, actionEl);
    },
    true
  );

  /*
   * ✅ 點擊 Modal 遮罩背景（不含彈窗本體）時自動關閉彈窗
   */
  document.addEventListener(
    "click",
    (event) => {
      const overlay = event.target.closest(
        ".zg-modal-overlay, [data-zg-modal]"
      );

      if (!overlay) return;

      // 只有直接點擊在「遮罩本身」才關閉，點擊彈窗內容不應觸發
      if (event.target !== overlay) return;

      event.preventDefault();
      event.stopPropagation();

      closeModal();
    },
    true
  );

  /*
   * 陀螺卡片選擇
   */
  document.addEventListener(
    "click",
    (event) => {
      /*
       * 如果點擊命中的是任何 data-zg-action 按鈕，
       * 交給上面的監聽器負責，這裡不處理。
       */
      if (event.target.closest("[data-zg-action]")) return;

      const card = event.target.closest(".zg-top-card");

      if (!card) return;

      const root = appRoot();

      if (!root.contains(card)) return;

      /*
       * ✅ 隱藏陀螺卡片邏輯調整：
       * - 已解鎖：視為一般卡片，點擊即可直接選擇上場對戰
       * - 未解鎖：卡片本體點擊不做任何事，
       *   由「查看兌換方式」「開始兌換」2 顆獨立按鈕負責互動，
       *   避免點到卡片背景又意外跳出多餘彈窗。
       */
      if (card.classList.contains("zg-secret-top-card")) {
        const isUnlocked = card.classList.contains("is-unlocked");

        if (!isUnlocked) {
          // 未解鎖：卡片本體不觸發任何行為
          return;
        }

        // 已解鎖：走隱藏陀螺專屬的選擇流程
        event.preventDefault();
        event.stopPropagation();

        const id =
          card.getAttribute("data-secret-id") ||
          card.getAttribute("data-id") ||
          "";

        /*
         * ✅ 修改重點：
         * 改用 handleSecretSelectTop 而非 selectTop，
         * 因為 selectTop 只會查詢一般陀螺的 TOPS 陣列，
         * 隱藏陀螺資料存放在 SECRET_TOPS，用 selectTop 會找不到。
         */
        if (id) {
          handleSecretSelectTop(id);
        }

        return;
      }

      if (card.disabled) return;
      if (card.getAttribute("aria-disabled") === "true") return;

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
        /*
         * ✅ 優先判斷：如果目前有 Modal 開啟中，
         * ESC 應該先關閉 Modal，而不是直接跳轉遊戲畫面。
         */
        const openModalEl = document.querySelector(
          ".zg-modal-overlay, [data-zg-modal]"
        );

        if (openModalEl) {
          event.preventDefault();
          event.stopPropagation();
          closeModal();
          return;
        }

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

  let zgViewportFixRaf = null;

  function scheduleViewportFix() {
    if (zgViewportFixRaf) return;

    zgViewportFixRaf = requestAnimationFrame(() => {
      zgViewportFixRaf = null;

      if (state.screen === "result") {
        forceResultVisible();
        forceRankListScrollable();
      }

      if (state.screen === "select") {
        forceSelectScrollable();
      }
    });
  }

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
      scheduleViewportFix();

      if (state.screen === "result") {
        setTimeout(scheduleViewportFix, 120);
      }

      if (state.screen === "select") {
        setTimeout(scheduleViewportFix, 120);
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
   * 只監聽 resize，不監聽 scroll。
   */
  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      "resize",
      () => {
        scheduleViewportFix();
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
function showBootLoading(message = "ZELO GAME 載入中...") {
  let loading = document.getElementById("zg-boot-loading");

  if (!loading) {
    loading = document.createElement("div");
    loading.id = "zg-boot-loading";
    loading.className = "zg-boot-loading";

    loading.innerHTML = `
      <div class="zg-boot-loading-inner">
        <div class="zg-boot-loading-logo">ZELO GAME</div>
        <div class="zg-boot-loading-spinner" aria-hidden="true"></div>
        <div class="zg-boot-loading-text" id="zg-boot-loading-text">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    document.body.appendChild(loading);
  } else {
    const text = loading.querySelector("#zg-boot-loading-text");

    if (text) {
      text.textContent = message;
    }
  }

  loading.hidden = false;
  loading.removeAttribute("hidden");
  loading.setAttribute("aria-hidden", "false");

  loading.style.setProperty("position", "fixed", "important");
  loading.style.setProperty("left", "0", "important");
  loading.style.setProperty("top", "0", "important");
  loading.style.setProperty("right", "0", "important");
  loading.style.setProperty("bottom", "0", "important");
  loading.style.setProperty("width", "100vw", "important");
  loading.style.setProperty("height", "100vh", "important");
  loading.style.setProperty("z-index", "2147483647", "important");
  loading.style.setProperty("display", "flex", "important");
  loading.style.setProperty("align-items", "center", "important");
  loading.style.setProperty("justify-content", "center", "important");
  loading.style.setProperty("background", "radial-gradient(circle at 50% 28%, rgba(68,82,160,.45), transparent 34%), linear-gradient(180deg, #101426 0%, #07111f 100%)", "important");
  loading.style.setProperty("color", "#fff", "important");
  loading.style.setProperty("opacity", "1", "important");
  loading.style.setProperty("visibility", "visible", "important");
  loading.style.setProperty("pointer-events", "auto", "important");
  loading.style.setProperty("transition", "opacity .22s ease, visibility .22s ease", "important");
  loading.style.setProperty("box-sizing", "border-box", "important");

  const inner = loading.querySelector(".zg-boot-loading-inner");

  if (inner) {
    inner.style.setProperty("display", "flex", "important");
    inner.style.setProperty("flex-direction", "column", "important");
    inner.style.setProperty("align-items", "center", "important");
    inner.style.setProperty("justify-content", "center", "important");
    inner.style.setProperty("gap", "16px", "important");
    inner.style.setProperty("padding", "28px 26px", "important");
    inner.style.setProperty("border-radius", "28px", "important");
    inner.style.setProperty("background", "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))", "important");
    inner.style.setProperty("border", "1px solid rgba(255,255,255,.16)", "important");
    inner.style.setProperty("box-shadow", "0 22px 60px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.12)", "important");
    inner.style.setProperty("backdrop-filter", "blur(12px)", "important");
    inner.style.setProperty("-webkit-backdrop-filter", "blur(12px)", "important");
    inner.style.setProperty("min-width", "240px", "important");
    inner.style.setProperty("max-width", "calc(100vw - 48px)", "important");
    inner.style.setProperty("box-sizing", "border-box", "important");
  }

  const logo = loading.querySelector(".zg-boot-loading-logo");

  if (logo) {
    logo.style.setProperty("font-size", "22px", "important");
    logo.style.setProperty("font-weight", "1000", "important");
    logo.style.setProperty("letter-spacing", ".08em", "important");
    logo.style.setProperty("line-height", "1", "important");
    logo.style.setProperty("color", "#ffe05f", "important");
    logo.style.setProperty("text-shadow", "0 0 18px rgba(255,224,95,.28)", "important");
    logo.style.setProperty("white-space", "nowrap", "important");
  }

  const spinner = loading.querySelector(".zg-boot-loading-spinner");

  if (spinner) {
    spinner.style.setProperty("width", "42px", "important");
    spinner.style.setProperty("height", "42px", "important");
    spinner.style.setProperty("border-radius", "999px", "important");
    spinner.style.setProperty("border", "4px solid rgba(255,255,255,.16)", "important");
    spinner.style.setProperty("border-top-color", "#58ec86", "important");
    spinner.style.setProperty("border-right-color", "#57f2ff", "important");
    spinner.style.setProperty("animation", "zgBootSpin .8s linear infinite", "important");
    spinner.style.setProperty("box-sizing", "border-box", "important");
  }

  const text = loading.querySelector(".zg-boot-loading-text");

  if (text) {
    text.style.setProperty("font-size", "15px", "important");
    text.style.setProperty("font-weight", "850", "important");
    text.style.setProperty("line-height", "1.4", "important");
    text.style.setProperty("color", "rgba(255,255,255,.86)", "important");
    text.style.setProperty("text-align", "center", "important");
    text.style.setProperty("white-space", "nowrap", "important");
  }

  if (!document.getElementById("zg-boot-loading-style")) {
    const style = document.createElement("style");
    style.id = "zg-boot-loading-style";
    style.textContent = `
      @keyframes zgBootSpin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
  }

  return loading;
}

function hideBootLoading(delay = 180) {
  const loading = document.getElementById("zg-boot-loading");

  if (!loading) return;

  window.clearTimeout(loading.__zgHideTimer);

  loading.style.setProperty("opacity", "0", "important");
  loading.style.setProperty("visibility", "hidden", "important");
  loading.style.setProperty("pointer-events", "none", "important");

  loading.__zgHideTimer = window.setTimeout(() => {
    try {
      loading.hidden = true;
      loading.setAttribute("aria-hidden", "true");
      loading.style.setProperty("display", "none", "important");
    } catch (error) {}
  }, delay);
}

function installResultActionBarAlphaPatch() {
  const apply = function() {
    const resultScreen =
      document.getElementById("screen-result") ||
      document.querySelector(".zg-result-screen") ||
      document.querySelector(".zg-screen-result");

    if (!resultScreen) return;

    const actions = resultScreen.querySelector(".zg-result-actions");

    if (actions) {
      actions.style.setProperty("background", "transparent", "important");
      actions.style.setProperty("background-color", "transparent", "important");
      actions.style.setProperty("background-image", "none", "important");

      actions.style.setProperty("box-shadow", "none", "important");
      actions.style.setProperty("border", "0", "important");
      actions.style.setProperty("outline", "0", "important");
      actions.style.setProperty("filter", "none", "important");
      actions.style.setProperty("backdrop-filter", "none", "important");
      actions.style.setProperty("-webkit-backdrop-filter", "none", "important");

      actions.style.setProperty("padding", "0", "important");
      actions.style.setProperty("padding-top", "0", "important");
      actions.style.setProperty("border-radius", "0", "important");

      actions.style.setProperty(
        "bottom",
        "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        "important"
      );

      actions.style.setProperty("pointer-events", "none", "important");
      actions.style.setProperty("isolation", "isolate", "important");

      const actionClickableItems = actions.querySelectorAll(
        "button, a, .zg-btn, [role='button'], input, select, textarea"
      );

      actionClickableItems.forEach(function(item) {
        item.style.setProperty("pointer-events", "auto", "important");
      });

      actions.classList.add("zg-result-actions-alpha");
    }

    const main = resultScreen.querySelector(".zg-result-main");

    if (main) {
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

      const actionSpace = veryCompact ? 116 : compact ? 124 : 132;

      main.style.setProperty(
        "height",
        `calc(100dvh - env(safe-area-inset-bottom, 0px) - ${actionSpace}px)`,
        "important"
      );

      main.style.setProperty(
        "max-height",
        `calc(100dvh - env(safe-area-inset-bottom, 0px) - ${actionSpace}px)`,
        "important"
      );

      main.style.setProperty("min-height", "0", "important");
      main.style.setProperty("flex", "0 0 auto", "important");

      const mainPad = veryCompact
        ? "8px 12px 12px"
        : compact
          ? "10px 12px 14px"
          : "12px 18px 16px";

      main.style.setProperty("padding", mainPad, "important");

      main.style.setProperty("overflow-y", "auto", "important");
      main.style.setProperty("overflow-x", "hidden", "important");
      main.style.setProperty("-webkit-overflow-scrolling", "touch", "important");
      main.style.setProperty("overscroll-behavior", "contain", "important");

      main.style.setProperty("background", "transparent", "important");
      main.style.setProperty("background-color", "transparent", "important");
      main.style.setProperty("background-image", "none", "important");
    }
  };

  let style = document.getElementById("zg-result-action-alpha-patch");

  if (!style) {
    style = document.createElement("style");
    style.id = "zg-result-action-alpha-patch";
    document.head.appendChild(style);
  }

  style.textContent = `
    #screen-result .zg-result-actions,
    #screen-result .zg-result-actions.zg-result-actions-alpha,
    #screen-result .zg-result-actions.zg-result-actions-classic,
    #screen-result .zg-result-actions.zg-result-actions-classic.zg-result-actions-alpha {
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;

      box-shadow: none !important;
      border: 0 !important;
      outline: 0 !important;
      filter: none !important;

      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;

      padding: 0 !important;
      padding-top: 0 !important;

      isolation: isolate !important;

      pointer-events: none !important;
    }

    #screen-result .zg-result-actions button,
    #screen-result .zg-result-actions a,
    #screen-result .zg-result-actions .zg-btn,
    #screen-result .zg-result-actions [role="button"],
    #screen-result .zg-result-actions input,
    #screen-result .zg-result-actions select,
    #screen-result .zg-result-actions textarea {
      pointer-events: auto !important;
    }

    #screen-result .zg-result-actions::before,
    #screen-result .zg-result-actions::after,
    #screen-result .zg-result-actions-classic::before,
    #screen-result .zg-result-actions-classic::after,
    #screen-result .zg-result-actions-alpha::before,
    #screen-result .zg-result-actions-alpha::after {
      display: none !important;
      content: none !important;

      opacity: 0 !important;
      visibility: hidden !important;

      pointer-events: none !important;

      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;

      box-shadow: none !important;
      border: 0 !important;
      outline: 0 !important;
      filter: none !important;

      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    #screen-result .zg-result-main {
      scrollbar-width: none !important;
      background: transparent !important;
      background-color: transparent !important;
      background-image: none !important;
    }

    #screen-result .zg-result-main::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
      display: none !important;
    }
  `;

  apply();

  window.clearTimeout(window.__zgResultActionAlphaPatchTimer1);
  window.clearTimeout(window.__zgResultActionAlphaPatchTimer2);
  window.clearTimeout(window.__zgResultActionAlphaPatchTimer3);

  window.__zgResultActionAlphaPatchTimer1 = window.setTimeout(apply, 80);
  window.__zgResultActionAlphaPatchTimer2 = window.setTimeout(apply, 240);
  window.__zgResultActionAlphaPatchTimer3 = window.setTimeout(apply, 520);

  if (!window.__zgResultActionAlphaPatchInstalled) {
    window.__zgResultActionAlphaPatchInstalled = true;

    window.addEventListener(
      "resize",
      function() {
        window.clearTimeout(window.__zgResultActionAlphaPatchResizeTimer);

        window.__zgResultActionAlphaPatchResizeTimer = window.setTimeout(function() {
          installResultActionBarAlphaPatch();
        }, 120);
      },
      { passive: true }
    );

    if (window.visualViewport) {
      window.visualViewport.addEventListener(
        "resize",
        function() {
          window.clearTimeout(window.__zgResultActionAlphaPatchViewportTimer);

          window.__zgResultActionAlphaPatchViewportTimer = window.setTimeout(function() {
            installResultActionBarAlphaPatch();
          }, 120);
        },
        { passive: true }
      );
    }
  }

  return style;
}
async function boot() {
  showBootLoading("ZELO GAME 載入中...");

  normalizeLiffStateUrlOnce();

  const bodyScreen =
    document.body.getAttribute("data-zg-screen") ||
    state.screen ||
    "";

  const bootSessionKey = "zg_boot_recent_at";

  try {
    const lastBootAt = Number(sessionStorage.getItem(bootSessionKey) || 0);
    const t = Date.now();

    const currentBodyScreenForRecentBoot =
      document.body.getAttribute("data-zg-screen") ||
      state.screen ||
      "";

    const currentScreenSelectorForRecentBoot = {
      start: "#screen-start, #screen-home",
      select: "#screen-select",
      battle: "#screen-battle",
      resultVideo: "#screen-result-video",
      result: "#screen-result"
    }[currentBodyScreenForRecentBoot] || "#screen-start, #screen-home";

    const hasExpectedScreenForRecentBoot =
      !!document.querySelector(currentScreenSelectorForRecentBoot);

    if (
      lastBootAt &&
      t - lastBootAt < 1800 &&
      document.getElementById("zelo-liff-game") &&
      hasExpectedScreenForRecentBoot
    ) {
      console.warn("[ZELO GAME] boot skipped: recent session boot");

      window.__ZELO_GAME_BOOTED__ = true;
      window.__ZELO_GAME_BOOTING__ = false;

      state.booted = true;
      state.booting = false;

      installResultActionBarAlphaPatch();

      window.setTimeout(() => {
        hideBootLoading();
      }, 260);

      return;
    }

    sessionStorage.setItem(bootSessionKey, String(t));
  } catch (error) {}

  const hasActiveGameScreen =
    !!document.querySelector(
      "#screen-start, #screen-home, #screen-select, #screen-battle, #screen-result-video, #screen-result"
    );

  const requiredScreenSelectorByName = {
    start: "#screen-start, #screen-home",
    select: "#screen-select",
    battle: "#screen-battle",
    resultVideo: "#screen-result-video",
    result: "#screen-result"
  };

  const requiredScreenSelector =
    requiredScreenSelectorByName[bodyScreen] || "";

  const hasCurrentBodyScreen =
    requiredScreenSelector
      ? !!document.querySelector(requiredScreenSelector)
      : false;

  const isInProgressScreen =
    bodyScreen === "select" ||
    bodyScreen === "battle" ||
    bodyScreen === "resultVideo" ||
    bodyScreen === "result";

  if (isInProgressScreen && hasActiveGameScreen && hasCurrentBodyScreen) {
    console.warn("[ZELO GAME] boot skipped: game already in progress", {
      bodyScreen,
      stateScreen: state.screen,
      hasActiveGameScreen,
      hasCurrentBodyScreen,
      globalBooted: !!window.__ZELO_GAME_BOOTED__,
      globalBooting: !!window.__ZELO_GAME_BOOTING__
    });

    window.__ZELO_GAME_BOOTED__ = true;
    window.__ZELO_GAME_BOOTING__ = false;

    state.booted = true;
    state.booting = false;

    installResultActionBarAlphaPatch();

    window.setTimeout(() => {
      hideBootLoading();
    }, 260);

    return;
  }

  if (window.__ZELO_GAME_BOOTED__) {
    console.warn("[ZELO GAME] boot skipped: global already booted", {
      bodyScreen,
      stateScreen: state.screen,
      hasActiveGameScreen
    });

    installResultActionBarAlphaPatch();

    window.setTimeout(() => {
      hideBootLoading();
    }, 260);

    return;
  }

  if (window.__ZELO_GAME_BOOTING__) {
    console.warn("[ZELO GAME] boot skipped: global booting", {
      bodyScreen,
      stateScreen: state.screen
    });

    installResultActionBarAlphaPatch();

    window.setTimeout(() => {
      hideBootLoading();
    }, 600);

    return;
  }

  if (state.booted || state.booting) {
    console.warn("[ZELO GAME] boot skipped: state already booted/booting", {
      booted: state.booted,
      booting: state.booting,
      bodyScreen,
      stateScreen: state.screen
    });

    installResultActionBarAlphaPatch();

    window.setTimeout(() => {
      hideBootLoading();
    }, 260);

    return;
  }

  window.__ZELO_GAME_BOOTING__ = true;
  state.booting = true;

  try {
    showBootLoading("ZELO GAME 載入中...");

    const profile = await initLiffProfile();

    if (!profile) {
      console.warn("[ZELO GAME] boot stopped before game start");

      state.booted = false;
      window.__ZELO_GAME_BOOTED__ = false;

      hideBootLoading(80);
      return;
    }

    state.booted = true;
    window.__ZELO_GAME_BOOTED__ = true;

    ensureAppHeight();
    applyCssVariables();
    installPerformanceModeCss();


    installResultActionBarAlphaPatch();

    hardResetGamePage();

    removeMenuDom();
    watchMenuDom();

    ensureBasicDom();
    bindGlobalEvents();

    state.selectedTop = loadSelectedTop();

    loadDailyLimit();

    const afterResetBodyScreen =
      document.body.getAttribute("data-zg-screen") || "";

    if (!afterResetBodyScreen || afterResetBodyScreen === "start") {
      showScreen("start");
      safePlayHomeVideo("boot_after_show_start");
    }

    track("boot", {
      version: VERSION,
      dailyLimit: DAILY_LIMIT,
      playsUsed: state.playsUsed,
      remainingPlays: state.remainingPlays,
      selectedTopId: state.selectedTop?.id || "",
      selectedTopName: state.selectedTop?.name || ""
    });

    const profileUserId =
      profile.userId || profile.id || profile.uid || "";

    track("profile_ready", {
      userId: profileUserId,
      displayName:
        profile.displayName ||
        profile.name ||
        profile.playerName ||
        ""
    });

    try {
      syncSecretUnlocksFromServer(profileUserId);
    } catch (error) {
      console.warn("[ZELO GAME] syncSecretUnlocksFromServer call failed:", error);
    }

    try {
      syncZeloPointsFromServer();
    } catch (error) {
      console.warn("[ZELO GAME] syncZeloPointsFromServer call failed:", error);
    }

    try {
      await syncMyReferralCodeFromServer("boot_after_profile");
      await registerReferralIfNeeded("boot_after_profile");

      const count = await syncReferralSuccessCount("boot_after_profile");
      state.lineInviteFriendCount = count;
    } catch (error) {
      console.warn("[ZELO GAME] referral boot flow failed:", error);

      track("referral_boot_flow_failed", {
        message: String(error && error.message ? error.message : error)
      });
    }

    window.setTimeout(() => {
      hideBootLoading();
    }, 420);
  } catch (error) {
    console.error("[ZELO GAME] boot failed", error);

    state.booted = false;
    window.__ZELO_GAME_BOOTED__ = false;

    hideBootLoading(80);

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
  } finally {
    state.booting = false;
    window.__ZELO_GAME_BOOTING__ = false;

    installResultActionBarAlphaPatch();

    window.setTimeout(() => {
      hideBootLoading();
    }, 680);
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

    /*
     * 手動觸發 LIFF 登入。
     * 用途：桌面瀏覽器 / 非 LINE App 內測試時，
     * 手動呼叫此函式導向 LINE 登入頁，
     * 登入完成後會帶著真實 userId 重新導回頁面。
     *
     * 使用方式（Console）：
     * window.ZELO_GAME.forceLiffLogin();
     */
forceLiffLogin: function() {
  if (!window.liff) {
    alert("目前頁面沒有載入 LIFF SDK");
    return;
  }

  if (window.liff.isLoggedIn()) {
    alert("已經是登入狀態");
    return;
  }

  try {
    window.liff.login();   // 不指定 redirectUri，自動用 LIFF 專案的 Endpoint URL
  } catch (error) {
    console.error("liff.login 失敗:", error);
  }
},



    getReferralCode: getMyReferralCode,
    buildReferralUrl: buildReferralUrl,
    syncReferralSuccessCount: syncReferralSuccessCount,
    syncMyReferralCodeFromServer: syncMyReferralCodeFromServer,
    registerReferralIfNeeded: registerReferralIfNeeded,
    registerReferralFromUrl: registerReferralFromUrl,
    loadFriendRankFromServer: loadFriendRankFromServer,
    hydrateResultFriendRank: hydrateResultFriendRank,

    getRewardPoints: getRewardPoints,
    setRewardPoints: setRewardPoints,
    addRewardPoints: addRewardPoints,
    getRewardProgressInfo: getRewardProgressInfo,

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

    resetRewardPoints: function() {
      setRewardPoints(0);

      return {
        rewardPoints: getRewardPoints(),
        rewardProgress: getRewardProgressInfo()
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

        rewardPoints:
          typeof getRewardPoints === "function"
            ? getRewardPoints()
            : 0,

        rewardProgress:
          typeof getRewardProgressInfo === "function"
            ? getRewardProgressInfo()
            : null,

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




window.ZELO_DEBUG_LIFF = async function () {
  const result = {
    hasLiff: !!window.liff,
    isLoggedIn: null,
    profile: null,
    error: null
  };

  try {
    result.isLoggedIn =
      window.liff && typeof window.liff.isLoggedIn === "function"
        ? window.liff.isLoggedIn()
        : null;

    if (
      window.liff &&
      typeof window.liff.getProfile === "function" &&
      window.liff.isLoggedIn()
    ) {
      result.profile = await window.liff.getProfile();
    }
  } catch (err) {
    result.error = String(err && err.message ? err.message : err);
  }

  alert(JSON.stringify(result, null, 2));
  console.log("[ZELO DEBUG LIFF]", result);
  return result;
};

(function () {
  "use strict";

  function getProfile() {
    return (
      window.ZELO_PROFILE ||
      window.ZELO_LIFF_PROFILE ||
      {
        userId:
          window.ZELO_CURRENT_USER_ID ||
          window.currentUserId ||
          window.lineUserId ||
          "",
        displayName:
          window.ZELO_PLAYER_NAME ||
          window.playerName ||
          window.currentPlayerName ||
          "LINE 玩家",
        pictureUrl: ""
      }
    );
  }

  function getGasUrl() {
    return (
      window.ZELO_GAS_API_URL ||
      window.ZELO_GAS_URL ||
      window.GAS_URL ||
      window.GOOGLE_SCRIPT_URL ||
      ""
    );
  }

  function getShareBaseUrl() {
    return (
      window.ZELO_LIFF_SHARE_URL ||
      window.ZELO_GAME_SHARE_URL ||
      window.location.origin + window.location.pathname
    );
  }

  function buildShareUrl(referralCode) {
    var baseUrl = getShareBaseUrl();
    var url = new URL(baseUrl, window.location.origin);

    url.searchParams.set("ref", referralCode || "");
    url.searchParams.set("inviterReferralCode", referralCode || "");
    url.searchParams.set("source", "line_liff_share");

    return url.toString();
  }

  async function postGas(payload) {
    var gasUrl = getGasUrl();

    if (!gasUrl) {
      throw new Error("GAS URL missing");
    }

    var res = await fetch(gasUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload || {})
    });

    return res.json();
  }

  async function getReferralCode(profile) {
    profile = profile || getProfile();

    var userId =
      profile.userId ||
      profile.lineUserId ||
      window.ZELO_CURRENT_USER_ID ||
      window.currentUserId ||
      window.lineUserId ||
      "";

    if (!userId) {
      throw new Error("LINE userId missing");
    }

    var name =
      profile.displayName ||
      profile.playerName ||
      window.ZELO_PLAYER_NAME ||
      window.playerName ||
      "LINE 玩家";

    var data = await postGas({
      action: "get_liff_referral_code",
      userId: userId,
      lineUserId: userId,
      displayName: name,
      playerName: name,
      pictureUrl: profile.pictureUrl || ""
    });

    if (!data || !data.ok) {
      throw new Error("取得邀請碼失敗");
    }

    return (
      data.referralCode ||
      data.myReferralCode ||
      data.ownerReferralCode ||
      data.code ||
      ""
    );
  }


 function buildZeloShareFlexMessage(options) {
  options = options || {};

  var shareUrl = String(options.shareUrl || "");
  var playerName = String(options.playerName || "好友");
  var score = Number(options.score || 0) || 0;

  if (!/^https?:\/\//i.test(shareUrl)) {
    console.warn("[ZELO GAME] invalid shareUrl for flex:", shareUrl);
    shareUrl = window.ZELO_LIFF_SHARE_URL || window.ZELO_GAME_SHARE_URL || "https://zelosportivo.com/";
  }

  return {
    type: "flex",
    altText: "ZELO GAME 邀請你來挑戰！",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "ZELO GAME",
            weight: "bold",
            size: "xl",
            wrap: true
          },
          {
            type: "text",
            text: playerName + " 邀請你來挑戰！",
            weight: "bold",
            size: "md",
            color: "#E91E63",
            wrap: true
          },
          {
            type: "text",
            text: "我剛剛拿到 " + score + " 分，你也來挑戰看看！",
            size: "sm",
            color: "#333333",
            wrap: true
          },
          {
            type: "text",
            text: "完成挑戰累積分數，衝上排行榜解鎖限定獎勵與神秘好禮！",
            size: "sm",
            color: "#666666",
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
            action: {
              type: "uri",
              label: "立即挑戰",
              uri: shareUrl
            }
          }
        ]
      }
    }
  };
}




  async function shareToLine() {
    try {
      if (!window.liff) {
        alert("LIFF 尚未載入");
        return;
      }

      if (typeof window.liff.isInClient === "function" && !window.liff.isInClient()) {
        alert("請在 LINE App 內開啟遊戲後分享");
        return;
      }

      if (typeof window.liff.isLoggedIn === "function" && !window.liff.isLoggedIn()) {
        window.liff.login();
        return;
      }

      var profile = getProfile();

      if (
        (!profile || !profile.userId) &&
        window.liff &&
        typeof window.liff.getProfile === "function"
      ) {
        profile = await window.liff.getProfile();
        window.ZELO_PROFILE = profile;
        window.ZELO_LIFF_PROFILE = profile;
      }

      var referralCode = await getReferralCode(profile);
      var shareUrl = buildShareUrl(referralCode);

      var name =
        profile.displayName ||
        profile.playerName ||
        "LINE 玩家";

      var text =
        name +
        " 邀請你一起玩 ZELO 陀螺遊戲！\n\n" +
        "挑戰對戰、賺 ZELO Points、抽限定獎勵。\n\n" +
        "點這裡開始：\n" +
        shareUrl;

      if (typeof window.liff.shareTargetPicker !== "function") {
        alert("目前 LINE 版本不支援分享功能，請更新 LINE App");
        return;
      }

      var useFlexShare = window.ZELO_USE_FLEX_SHARE !== false;

if (useFlexShare) {
  await window.liff.shareTargetPicker([
    buildZeloShareFlexMessage({
      shareUrl: shareUrl,
      playerName: name,
      score: window.ZELO_LAST_SCORE || window.currentScore || 0,
      imageUrl: window.ZELO_SHARE_IMAGE_URL || ""
    })
  ]);
} else {
  await window.liff.shareTargetPicker([
    {
      type: "text",
      text: text
    }
  ]);
}


      try {
        await postGas({
          action: "referral_share_sent",
          eventType: "share",
          userId: profile.userId || "",
          lineUserId: profile.userId || "",
          playerName: name,
          displayName: name,
          referralCode: referralCode,
          pageUrl: shareUrl,
          source: "line_liff_share"
        });
      } catch (logErr) {
        console.warn("[LINE SHARE] log failed", logErr);
      }

      console.log("[LINE SHARE] done", {
        referralCode: referralCode,
        shareUrl: shareUrl
      });
    } catch (err) {
      console.error("[LINE SHARE] failed", err);
      alert("分享失敗，請稍後再試");
    }
  }

  window.ZELO_LINE_SHARE = {
    shareToLine: shareToLine,
    buildShareUrl: buildShareUrl,
    getReferralCode: getReferralCode
  };

  window.shareZeloToLine = shareToLine;
})();


