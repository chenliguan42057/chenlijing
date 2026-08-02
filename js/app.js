/* ===========================================================
   薄荷减脂打卡 · v3.1 卡通多彩版
   目录切换 / 仪表盘 / 打卡 / 饮食 / 运动 / 身体数据 / 推荐 / 个人资料 / AI
   新增：小鸡仔成长系统 / 照片上传 / 个性化推荐(身体调查) / 状态分享卡
   饮食「具象分量」+「可滚动·可编辑·可切换日期」历史；运动同构
   所有数据保存在 localStorage，不上传服务器。
   =========================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var qsa = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------- 数据版本标记：版本变化时自动清空全部本地数据（恢复初始状态） ---------- */
  var DATA_VER = "20260802_init";
  (function resetDataIfNeeded() {
    try {
      if (localStorage.getItem("mint_data_ver") !== DATA_VER) {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf("mint_") === 0) keys.push(k);
        }
        keys.forEach(function (k) { localStorage.removeItem(k); });
        localStorage.setItem("mint_data_ver", DATA_VER);
      }
    } catch (e) { /* 忽略隐私模式等异常 */ }
  })();

  var LS = {
    user: "mint_user",
    checkins: "mint_checkins",
    meals: "mint_meals",
    exercises: "mint_exercises",
    bodyLogs: "mint_body_logs",
    chick: "mint_chick",
    survey: "mint_survey"
  };

  /* 食物库（含煎/炒/炸/油/蒸/煮/凉拌等做法，单位 kcal/100g） */
  var FOOD_DB = {
    /* 主食 / 碳水 */
    "白米饭": 116, "米饭": 116, "糙米饭": 123, "炒饭": 188, "粥": 46, "小米粥": 46, "馒头": 223, "花卷": 214,
    "全麦面包": 247, "白面包": 265, "面条(煮)": 110, "荞麦面(煮)": 110, "意面(煮)": 130, "方便面": 473, "红薯": 86,
    "紫薯": 82, "土豆": 77, "炸薯条": 312, "玉米": 112, "燕麦": 389, "南瓜": 26, "山药": 57, "芋头": 79,
    "粉丝": 110, "河粉": 110, "凉皮": 117, "葱油饼": 300, "手抓饼": 360, "煎饼": 250, "烧麦": 220,
    "饺子(肉)": 250, "饺子(素)": 200, "包子(肉)": 230, "包子(素)": 170, "汤圆": 250, "年糕": 154, "寿司": 150, "饭团": 170,
    /* 蛋白 / 肉蛋 */
    "煮鸡蛋": 143, "煎鸡蛋": 196, "炒鸡蛋": 162, "茶叶蛋": 138, "蒸蛋": 80, "鸡蛋羹": 80, "皮蛋": 171, "咸鸭蛋": 190,
    "鸡胸肉": 133, "炸鸡": 280, "烤鸡腿": 180, "红烧鸡块": 215, "炒鸡丁": 180, "鸭肉(去皮)": 135,
    "牛肉(瘦)": 250, "煎牛排": 271, "肥牛": 330, "羊肉(瘦)": 118, "猪肉(瘦)": 143, "红烧肉": 415,
    "糖醋里脊": 270, "培根": 541, "香肠": 320, "午餐肉": 230, "虾仁": 99, "油炸虾": 220, "水煮虾": 99,
    "三文鱼": 208, "清蒸鱼": 110, "清蒸带鱼": 127, "油炸带鱼": 240, "鳕鱼": 88, "龙利鱼": 90, "蟹肉": 95,
    "鱿鱼": 92, "章鱼": 82, "蛤蜊": 62, "生蚝": 57, "豆腐": 76, "麻婆豆腐": 135, "煎豆腐": 140, "炸豆腐": 230,
    "豆浆": 31, "无糖豆浆": 31, "牛奶": 54, "酸奶": 70, "毛肚": 95, "牛肚": 95, "鸭血": 55,
    /* 蔬菜（含做法） */
    "炒青菜": 55, "水煮西兰花": 34, "蒜蓉西兰花": 70, "凉拌黄瓜": 16, "油麦菜": 20, "清炒菠菜": 45,
    "地三鲜": 130, "干煸豆角": 140, "番茄炒蛋": 95, "醋溜白菜": 40, "红烧茄子": 88, "西兰花(水煮)": 34, "炒西兰花": 70,
    "生菜": 15, "蒜蓉生菜": 50, "蚝油生菜": 60, "凉拌海带丝": 25, "凉拌木耳": 30, "蒜蓉金针菇": 60,
    "清蒸茄子": 50, "手撕包菜": 80, "干锅菜花": 130, "红烧豆腐": 120, "西红柿炒蛋": 95,
    "菠菜": 23, "芹菜": 16, "胡萝卜": 41, "冬瓜": 12, "西红柿": 18, "青椒": 22, "蘑菇": 22, "金针菇": 32,
    "海带": 13, "紫菜": 35, "芦笋": 22, "秋葵": 37, "苦瓜": 19, "洋葱": 40, "藕": 73, "毛豆": 131, "黄豆": 390,
    /* 水果 / 零食 / 饮品 / 加餐 */
    "苹果": 52, "香蕉": 89, "草莓": 32, "葡萄": 69, "西瓜": 30, "橙子": 47, "猕猴桃": 61, "蓝莓": 57, "桃子": 39, "柚子": 42,
    "油条": 388, "蛋糕": 350, "饼干": 430, "巧克力": 546, "奶茶": 60, "可乐": 43, "薯片": 547,
    "冰激凌": 207, "甜甜圈": 452, "马卡龙": 470, "布丁": 120, "坚果(混合)": 600, "花生": 567, "腰果": 553, "瓜子": 600,
    "汉堡": 295, "披萨": 266, "啤酒": 43, "红酒": 85, "咖啡(黑)": 2, "拿铁": 50, "美式": 5, "果汁": 45, "雪碧": 43, "橙汁": 45, "蜂蜜水": 30,
    /* 调味 / 加料（小心热量陷阱） */
    "沙拉酱": 700, "花生酱": 588, "老干妈": 300, "食用油": 884, "白糖": 400, "蜂蜜": 304
  };
  var QUICK_FOODS = [
    { name: "米饭", grams: 150 }, { name: "煮鸡蛋", grams: 50 }, { name: "香蕉", grams: 100 },
    { name: "牛奶", grams: 250 }, { name: "鸡胸肉", grams: 120 }, { name: "燕麦", grams: 50 }, { name: "红薯", grams: 150 }
  ];
  /* 具象分量预设（点击即填好对应克数） */
  var UNIT_PRESETS = [
    { label: "一个拳头", grams: 150 }, { label: "一碗", grams: 200 }, { label: "一杯", grams: 250 },
    { label: "一勺", grams: 15 }, { label: "一块", grams: 100 }, { label: "半份", grams: 75 }, { label: "一根", grams: 80 }
  ];
  var EXERCISE_DB = [
    { name: "快走", met: 3.5, cat: "有氧" }, { name: "慢跑", met: 6, cat: "有氧" }, { name: "跳绳", met: 8, cat: "有氧" },
    { name: "瑜伽", met: 2.5, cat: "柔韧" }, { name: "游泳", met: 7, cat: "有氧" }, { name: "骑行", met: 4.5, cat: "有氧" },
    { name: "力量训练", met: 4, cat: "力量" }, { name: "HIIT", met: 8, cat: "HIIT" }, { name: "爬楼梯", met: 6, cat: "有氧" },
    { name: "跳舞", met: 4, cat: "有氧" }, { name: "羽毛球", met: 5, cat: "有氧" }, { name: "篮球", met: 6.5, cat: "有氧" }
  ];
  var VIDEO_LINKS = {
    "跳绳": "https://search.bilibili.com/all?keyword=跳绳跟练",
    "HIIT": "https://search.bilibili.com/all?keyword=HIIT跟练",
    "慢跑": "https://search.bilibili.com/all?keyword=慢跑姿势",
    "快走": "https://search.bilibili.com/all?keyword=快走燃脂",
    "瑜伽": "https://search.bilibili.com/all?keyword=瑜伽入门",
    "骑行": "https://search.bilibili.com/all?keyword=骑行燃脂",
    "游泳": "https://search.bilibili.com/all?keyword=游泳教学",
    "力量训练": "https://search.bilibili.com/all?keyword=家庭力量训练",
    "爬楼梯": "https://search.bilibili.com/all?keyword=爬楼梯燃脂",
    "跳舞": "https://search.bilibili.com/all?keyword=健身操跟跳",
    "羽毛球": "https://search.bilibili.com/all?keyword=羽毛球技巧",
    "篮球": "https://search.bilibili.com/all?keyword=篮球训练"
  };

  var CELEBRATE = [
    "今天自律了，鸡你太美！🐤", "本鸡正式宣布：你是减脂界的卷王。",
    "打卡 +1，脂肪 -1，完美。", "小鸡仔已为你鼓掌 👏", "坚持就是胜利，今天的你很棒！"
  ];
  var COMPLAIN = [
    "一天不见，鸡都瘦了…", "你是不是背着我去吃炸鸡了？",
    "呜呜，今天没见到你，小鸡仔蔫了。", "再不打卡，小鸡仔要离家出走了！", "说好的自律呢？小鸡仔表示失望。"
  ];

  var pendingPhoto = { diet: null, ex: null };
  var dietViewDate = todayKey();
  var exViewDate = todayKey();
  var editingDietId = null;
  var editingExId = null;
  var dietUnitLabel = "";
  var dietFilter = "all";
  var exFilter = "all";
  var surveyDraft = {};

  /* ---------- 通用 localStorage 读写 ---------- */
  function get(key, def) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch (e) { return def; }
  }
  function set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    if (window.__mintSync) window.__mintSync.schedule();
  }

  /* ---------- 云同步（前端直连 GitHub 私有仓库，不经过任何服务器中转） ---------- */
  var SYNC = (function () {
    var cfg = window.APP_CONFIG || {};
    var token = cfg.GITHUB_TOKEN || "";
    var repo = cfg.GITHUB_REPO || "chenliguan42057/mint-data";
    var path = cfg.GITHUB_PATH || "data.json";
    var branch = cfg.GITHUB_BRANCH || "main";
    var apiUrl = "https://api.github.com/repos/" + repo + "/contents/" + path;
    var timer = null;
    var busy = false;
    var toastTimer = null;

    function collect() {
      var d = {};
      Object.keys(LS).forEach(function (k) { d[k] = get(LS[k], null); });
      try { d.aiChat = JSON.parse(localStorage.getItem("mint_ai_chat")) || []; } catch (e) { d.aiChat = []; }
      d.savedAt = Date.now();
      return d;
    }
    function hasLocal() {
      var n = 0;
      Object.keys(LS).forEach(function (k) {
        var v = localStorage.getItem(LS[k]);
        if (v && v !== "null" && v !== "[]" && v !== "{}") n++;
      });
      return n > 0;
    }
    function toast(msg, ok) {
      var el = document.getElementById("sync-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "sync-toast";
        el.style.cssText = "position:fixed;right:16px;bottom:72px;z-index:9999;padding:8px 14px;border-radius:20px;font-size:13px;color:#fff;background:rgba(0,0,0,.72);opacity:0;transition:opacity .3s;pointer-events:none;max-width:80vw";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.style.background = (ok === false) ? "rgba(214,69,69,.92)" : "rgba(0,0,0,.74)";
      el.style.opacity = "1";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { el.style.opacity = "0"; }, 2600);
    }
    function ghHeaders() {
      return { "Authorization": "Bearer " + token, "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    }
    function upload() {
      if (!token || busy) return;
      busy = true;
      var data = collect();
      // 先取当前文件 sha（文件不存在则新建）
      fetch(apiUrl + "?ref=" + branch, { headers: ghHeaders() })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (meta) {
          var sha = (meta && meta.sha) ? meta.sha : undefined;
          return fetch(apiUrl, {
            method: "PUT",
            headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders()),
            body: JSON.stringify({
              message: "mint-data 云同步",
              content: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
              sha: sha,
            }),
          });
        })
        .then(function (r) {
          busy = false;
          if (r.status === 200 || r.status === 201) { toast("☁️ 已同步到云端"); }
          else { toast("☁️ 同步失败，稍后自动重试", false); clearTimeout(timer); timer = setTimeout(upload, 30000); }
        })
        .catch(function () {
          busy = false;
          toast("☁️ 同步失败，稍后自动重试", false);
          clearTimeout(timer); timer = setTimeout(upload, 30000);
        });
    }
    function schedule() {
      if (!token) return;
      clearTimeout(timer);
      timer = setTimeout(upload, 4000); // 保存后 4 秒合并上传一次
    }
    function pull() {
      if (!token) return;
      fetch(apiUrl + "?ref=" + branch, { headers: ghHeaders() })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (meta) {
          if (meta && meta.content) {
            var remote;
            try { remote = JSON.parse(decodeURIComponent(escape(atob(meta.content)))); } catch (e) { remote = null; }
            if (remote && typeof remote === "object" && !hasLocal()) {
              Object.keys(LS).forEach(function (k) {
                if (remote[k] !== undefined && remote[k] !== null) set(LS[k], remote[k]);
              });
              if (remote.aiChat && remote.aiChat.length) {
                try { localStorage.setItem("mint_ai_chat", JSON.stringify(remote.aiChat)); } catch (e) {}
              }
              toast("☁️ 已从云端恢复数据");
              location.reload(); // 重新渲染页面
            }
          }
        })
        .catch(function () {});
    }
    return { schedule: schedule, pull: pull, upload: upload, collect: collect };
  })();
  window.__mintSync = SYNC;

  function getUser() {
    return get(LS.user, { name: "", height: 165, dailyCalorieGoal: 1300, targetWeight: "", startWeight: "" });
  }
  function saveUser(u) { set(LS.user, u); }
  function getCheckins() { return get(LS.checkins, []); }
  function saveCheckins(arr) { set(LS.checkins, arr); }
  function getMeals() { return get(LS.meals, []); }
  function saveMeals(arr) { set(LS.meals, arr); }
  function getExercises() { return get(LS.exercises, []); }
  function saveExercises(arr) { set(LS.exercises, arr); }
  function getBodyLogs() { return get(LS.bodyLogs, []); }
  function saveBodyLogs(arr) { set(LS.bodyLogs, arr); }
  function getChick() { return get(LS.chick, { growth: 0, lastCheckin: "", lastPenalty: "", missed: false }); }
  function saveChick(c) { set(LS.chick, c); }
  function getSurvey() { return get(LS.survey, null); }
  function saveSurvey(s) { set(LS.survey, s); }

  function todayKey() { return new Date().toISOString().slice(0, 10); }
  function dateKey(d) { return new Date(d).toISOString().slice(0, 10); }
  function yesterday() { var d = new Date(); d.setDate(d.getDate() - 1); return d; }
  function shiftDate(key, delta) { var d = new Date(key); d.setDate(d.getDate() + delta); return d.toISOString().slice(0, 10); }
  function fmtDate(d) { var date = new Date(d); return (date.getMonth() + 1) + "月" + date.getDate() + "日"; }
  function fmtShortDate(d) { var date = new Date(d); return (date.getMonth() + 1) + "/" + date.getDate(); }
  function friendlyDate(key) { if (key === todayKey()) return "今天"; if (key === dateKey(yesterday())) return "昨天"; var d = new Date(key); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function calOf(name, grams) { return FOOD_DB[name] ? Math.round(FOOD_DB[name] * grams / 100) : 0; }
  function exCat(name) { var e = EXERCISE_DB.find(function (x) { return x.name === name; }); return e ? e.cat : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function accentColor() { return getComputedStyle(document.body).getPropertyValue("--accent").trim() || "#FFD66B"; }
  function barHTML(pct, label) {
    var color = "linear-gradient(90deg,#FF9FA6,#EF7C86)";
    return '<div style="height:8px;border-radius:999px;background:#ecebf3;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + color + ';transition:width .3s;"></div></div><div style="text-align:right;font-size:11px;color:#8b91a3;margin-top:4px;">' + pct + '% / ' + (label || "当日目标") + '</div>';
  }

  /* ---------- 今日记录快捷操作 ---------- */
  function getTodayCheckin() {
    var t = todayKey();
    return getCheckins().find(function (x) { return x.date === t; });
  }
  function isCheckedInToday() { var c = getTodayCheckin(); return !!(c && c.done); }
  function saveTodayCheckin(obj) {
    var arr = getCheckins();
    var t = todayKey();
    var idx = arr.findIndex(function (x) { return x.date === t; });
    var rec = Object.assign({ date: t, water: 0, mood: "", sleep: "", note: "", weight: "", photo: null, done: false }, idx >= 0 ? arr[idx] : {}, obj);
    rec.updatedAt = Date.now();
    if (idx >= 0) arr[idx] = rec; else arr.push(rec);
    saveCheckins(arr);
  }
  function getTodayBodyLog() {
    var t = todayKey();
    return getBodyLogs().find(function (x) { return x.date === t; });
  }
  function saveTodayBodyLog(obj) {
    var arr = getBodyLogs();
    var t = todayKey();
    var idx = arr.findIndex(function (x) { return x.date === t; });
    var rec = Object.assign({ date: t, waist: "", hip: "" }, idx >= 0 ? arr[idx] : {}, obj);
    if (idx >= 0) arr[idx] = rec; else arr.push(rec);
    saveBodyLogs(arr);
  }

  /* ---------- 统计 ---------- */
  function latestWeight() {
    var arr = getCheckins().filter(function (x) { return x.weight; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    return arr.length ? parseFloat(arr[arr.length - 1].weight) : null;
  }
  function previousWeight() {
    var arr = getCheckins().filter(function (x) { return x.weight; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    return arr.length > 1 ? parseFloat(arr[arr.length - 2].weight) : null;
  }
  function computeStreak() {
    var dates = getCheckins().filter(function (x) { return x.done; }).map(function (x) { return x.date; });
    var set = {};
    dates.forEach(function (d) { set[d] = true; });
    var cursor = new Date();
    var keyOf = function (dt) { return dt.toISOString().slice(0, 10); };
    if (!set[keyOf(cursor)]) cursor.setDate(cursor.getDate() - 1);
    var streak = 0;
    while (set[keyOf(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }
    return streak;
  }
  function totalMealsCal(date) {
    var d = date || todayKey();
    return getMeals().filter(function (m) { return m.date === d; }).reduce(function (s, m) { return s + (parseFloat(m.calories) || 0); }, 0);
  }
  function totalExerciseCal(date) {
    var d = date || todayKey();
    return getExercises().filter(function (e) { return e.date === d; }).reduce(function (s, e) { return s + (parseFloat(e.calories) || 0); }, 0);
  }
  function currentWeightOrDefault() { return latestWeight() || parseFloat(getUser().startWeight) || 55; }
  function estimateExerciseCal(met, minutes) {
    var w = currentWeightOrDefault();
    return Math.round((met * 3.5 * w * minutes) / 200);
  }
  function getWeightSeries(days) {
    days = days || 7;
    var arr = getCheckins().filter(function (x) { return x.weight; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var series = [];
    var end = new Date();
    var lastVal = null;
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(end); d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var found = arr.find(function (x) { return x.date === key; });
      if (found) lastVal = parseFloat(found.weight);
      series.push({ date: fmtShortDate(d), value: lastVal });
    }
    return series.filter(function (x) { return x.value !== null; });
  }

  /* ---------- 目录切换 ---------- */
  var currentPage = "dashboard";
  function initNav() {
    qsa(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () { goPage(btn.dataset.page); closeSidebar(); });
    });
    qsa("[data-jump]").forEach(function (el) {
      el.addEventListener("click", function () { goPage(el.dataset.jump); });
    });
    $("top-settings").addEventListener("click", function () { goPage("settings"); });
    $("menu-btn").addEventListener("click", openSidebar);
    $("sidebar-overlay").addEventListener("click", closeSidebar);
    qsa("#weight-range .seg").forEach(function (s) {
      s.addEventListener("click", function () {
        qsa("#weight-range .seg").forEach(function (x) { x.classList.remove("active"); });
        s.classList.add("active"); renderDashboard();
      });
    });
  }
  function goPage(page) {
    currentPage = page;
    document.body.dataset.theme = page;
    qsa(".page").forEach(function (p) { p.classList.remove("active"); });
    if ($("page-" + page)) $("page-" + page).classList.add("active");
    qsa(".nav-item").forEach(function (n) { n.classList.toggle("active", n.dataset.page === page); });
    var titles = {
      dashboard: "仪表盘", checkin: "今日打卡", diet: "饮食记录", exercise: "运动记录",
      body: "身体数据", recommend: "今日推荐", ai: "AI 助手", settings: "个人资料"
    };
    $("page-title").textContent = titles[page] || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderPage(page);
  }
  function openSidebar() { $("sidebar").classList.add("open"); $("sidebar-overlay").classList.add("open"); }
  function closeSidebar() { $("sidebar").classList.remove("open"); $("sidebar-overlay").classList.remove("open"); }

  function renderPage(page) {
    if (page === "dashboard") renderDashboard();
    if (page === "checkin") { renderCheckin(); renderChick(); }
    if (page === "diet") renderDiet();
    if (page === "exercise") renderExercise();
    if (page === "body") renderBody();
    if (page === "recommend") renderRecommend();
    if (page === "settings") renderSettings();
  }

  /* ---------- 仪表盘 ---------- */
  function renderDashboard() {
    var user = getUser();
    var weight = latestWeight();
    var prev = previousWeight();
    $("dash-weight").textContent = weight ? weight.toFixed(1) : "--";
    var deltaEl = $("dash-weight-delta");
    if (weight && prev) {
      var diff = (weight - prev).toFixed(1);
      deltaEl.textContent = "较上次 " + (diff > 0 ? "+" : "") + diff + " kg";
      deltaEl.style.color = diff > 0 ? "#ef6f7b" : "#33B98A";
    } else { deltaEl.textContent = "体重是减脂的第一信号"; deltaEl.style.color = ""; }

    var calIn = totalMealsCal();
    var calOut = totalExerciseCal();
    var goal = parseInt(user.dailyCalorieGoal) || 1300;
    $("dash-cal-in").textContent = calIn.toLocaleString();
    $("dash-cal-goal").textContent = "目标 " + goal.toLocaleString() + " kcal";
    $("dash-cal-out").textContent = calOut.toLocaleString();

    var streak = computeStreak();
    $("dash-streak").textContent = streak;
    $("dash-streak-txt").textContent = streak > 0 ? "连续打卡中，继续加油" : "今天还没打卡哦";

    var days = parseInt(document.querySelector("#weight-range .seg.active").dataset.days) || 7;
    Charts.lineChart("weight-chart", getWeightSeries(days), { color: accentColor() });
    renderGoalRing();
    renderTimeline();
    renderChick();
  }
  function renderGoalRing() {
    var user = getUser();
    var current = latestWeight();
    var target = parseFloat(user.targetWeight) || null;
    var start = parseFloat(user.startWeight) || null;
    if (!start) {
      var arr = getCheckins().filter(function (x) { return x.weight; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      if (arr.length) start = parseFloat(arr[0].weight);
    }
    $("goal-current").textContent = current ? current.toFixed(1) : "--";
    $("goal-target").textContent = target ? target.toFixed(1) : "--";
    $("goal-start").textContent = start ? start.toFixed(1) : "--";
    var percent = 0;
    if (current && target && start) {
      var total = start - target;
      var done = start - current;
      percent = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    }
    $("goal-percent").textContent = percent + "%";
    Charts.progressRing("goal-ring", percent, { color: accentColor() });
  }
  function renderTimeline() {
    var list = $("timeline");
    list.innerHTML = "";
    var t = todayKey();
    var items = [];
    getMeals().filter(function (m) { return m.date === t; }).forEach(function (m) {
      items.push({ time: m.time || "--:--", text: (m.unitLabel ? m.unitLabel + " · " : "") + m.mealType + " · " + m.name + " " + Math.round(m.grams) + "g / " + Math.round(m.calories) + " kcal" });
    });
    getExercises().filter(function (e) { return e.date === t; }).forEach(function (e) {
      items.push({ time: e.time || "--:--", text: e.name + " " + e.minutes + "分钟 / -" + Math.round(e.calories) + " kcal" });
    });
    var ci = getTodayCheckin();
    if (ci && ci.weight) items.push({ time: "打卡", text: "记录体重 " + parseFloat(ci.weight).toFixed(1) + " kg" });
    items.sort(function (a, b) { return a.time.localeCompare(b.time); });
    if (items.length === 0) { $("timeline-empty").style.display = "block"; list.style.display = "none"; return; }
    $("timeline-empty").style.display = "none"; list.style.display = "block";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<div class="timeline-dot"></div><div class="timeline-text">' + esc(it.text) + '</div><div class="timeline-time">' + it.time + '</div>';
      list.appendChild(li);
    });
  }

  /* ---------- 今日打卡 ---------- */
  function renderCheckin() {
    $("checkin-date").textContent = fmtDate(new Date());
    var ci = getTodayCheckin() || {};
    $("ci-weight").value = ci.weight || "";
    $("ci-sleep").value = ci.sleep || "";
    $("ci-note").value = ci.note || "";
    qsa("#ci-mood-row .chip").forEach(function (c) { c.classList.toggle("active", c.dataset.val === (ci.mood || "")); });
    renderWater(ci.water || 0);
    renderCheckinPhoto();
  }
  function renderCheckinPhoto() {
    var preview = $("ci-photo-preview");
    var ci = getTodayCheckin();
    var d = ci && ci.photo;
    preview.innerHTML = d
      ? '<div class="photo-thumb"><img src="' + d + '"/><button class="pt-del" id="ci-photo-del">✕</button></div>'
      : '<span class="photo-empty">还没有照片</span>';
    if (d) $("ci-photo-del").addEventListener("click", function () { saveTodayCheckin({ photo: null }); renderCheckinPhoto(); });
  }
  function bindCheckinPhoto() {
    var input = $("ci-photo");
    var btn = $("ci-photo-btn");
    btn.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      var file = input.files[0]; if (!file) return;
      compressImage(file, 760, 0.62).then(function (d) {
        saveTodayCheckin({ photo: d }); renderCheckinPhoto(); input.value = "";
      }).catch(function () { alert("图片读取失败，换一张试试～"); });
    });
  }
  function initCheckin() {
    qsa("#ci-mood-row .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        qsa("#ci-mood-row .chip").forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
      });
    });
    $("ci-save").addEventListener("click", function () {
      var mood = "";
      qsa("#ci-mood-row .chip.active").forEach(function (c) { mood = c.dataset.val; });
      saveTodayCheckin({
        weight: $("ci-weight").value,
        sleep: $("ci-sleep").value,
        mood: mood,
        note: $("ci-note").value,
        water: parseInt($("water-count").textContent) || 0,
        done: true
      });
      rewardChick();
      alert("今日打卡已保存 🌿");
      renderDashboard();
    });
    $("water-plus").addEventListener("click", function () { changeWater(1); });
    $("water-minus").addEventListener("click", function () { changeWater(-1); });
    bindCheckinPhoto();
  }
  function changeWater(delta) {
    var ci = getTodayCheckin() || { water: 0 };
    var n = Math.max(0, (parseInt(ci.water) || 0) + delta);
    saveTodayCheckin({ water: n });
    renderWater(n);
  }
  function renderWater(n) {
    n = n || 0;
    $("water-count").textContent = n;
    $("water-ml").textContent = n * 200;
    var cups = $("water-cups"); cups.innerHTML = "";
    for (var i = 0; i < n; i++) { var s = document.createElement("span"); s.className = "water-cup"; cups.appendChild(s); }
  }

  /* ---------- 饮食记录 ---------- */
  function initDiet() {
    var list = $("food-list"); list.innerHTML = "";
    Object.keys(FOOD_DB).forEach(function (name) { var opt = document.createElement("option"); opt.value = name; list.appendChild(opt); });

    var ur = $("diet-unit-row"); ur.innerHTML = "";
    UNIT_PRESETS.forEach(function (u) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = u.label;
      b.addEventListener("click", function () {
        qsa("#diet-unit-row .chip").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        $("diet-grams").value = u.grams; dietUnitLabel = u.label; updateDietCal();
      });
      ur.appendChild(b);
    });

    var qf = $("quick-foods");
    QUICK_FOODS.forEach(function (f) {
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "qfood";
      btn.textContent = f.name + " " + f.grams + "g";
      btn.addEventListener("click", function () {
        $("diet-name").value = f.name; $("diet-grams").value = f.grams;
        dietUnitLabel = ""; qsa("#diet-unit-row .chip").forEach(function (x) { x.classList.remove("active"); });
        updateDietCal();
      });
      qf.appendChild(btn);
    });
    qsa("#diet-meal-row .chip").forEach(function (c) {
      c.addEventListener("click", function () { qsa("#diet-meal-row .chip").forEach(function (x) { x.classList.remove("active"); }); c.classList.add("active"); });
    });
    $("diet-name").addEventListener("input", updateDietCal);
    $("diet-grams").addEventListener("input", function () { dietUnitLabel = ""; qsa("#diet-unit-row .chip").forEach(function (x) { x.classList.remove("active"); }); updateDietCal(); });
    $("diet-cal").addEventListener("input", function () { });
    $("diet-add").addEventListener("click", addDiet);
    bindPhoto("diet-photo");

    $("diet-prev").addEventListener("click", function () { editingDietId = null; dietViewDate = shiftDate(dietViewDate, -1); renderDiet(); });
    $("diet-next").addEventListener("click", function () { editingDietId = null; dietViewDate = shiftDate(dietViewDate, 1); renderDiet(); });
    $("diet-today").addEventListener("click", function () { editingDietId = null; dietViewDate = todayKey(); renderDiet(); });
    $("diet-date").addEventListener("change", function (e) { if (e.target.value) { editingDietId = null; dietViewDate = e.target.value; renderDiet(); } });
    qsa("#diet-filter-row .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        qsa("#diet-filter-row .chip").forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active"); dietFilter = c.dataset.filter; renderDiet();
      });
    });
  }
  function updateDietCal() {
    var name = $("diet-name").value.trim();
    var g = parseFloat($("diet-grams").value) || 0;
    var calInput = $("diet-cal");
    var tip = $("diet-tip");
    if (FOOD_DB[name] && g > 0) {
      calInput.value = calOf(name, g);
      tip.textContent = name + " 每 100g 约 " + FOOD_DB[name] + " kcal，已自动估算。";
    } else if (name && !FOOD_DB[name]) { tip.textContent = "该食物不在常见库中，请手动填写热量。"; }
    else { tip.textContent = "选一个具象分量或填克数，热量会自动估算。"; }
  }
  function addDiet() {
    var mealType = ""; qsa("#diet-meal-row .chip.active").forEach(function (c) { mealType = c.dataset.val; });
    var name = $("diet-name").value.trim();
    var grams = parseFloat($("diet-grams").value) || 0;
    var cal = parseFloat($("diet-cal").value) || 0;
    if (!name || grams <= 0 || cal <= 0) { alert("请填写食物名称、分量和热量～"); return; }
    var arr = getMeals();
    arr.push({
      id: Date.now(), date: dietViewDate, mealType: mealType, name: name,
      grams: grams, calories: cal, unitLabel: dietUnitLabel || null, photo: pendingPhoto.diet || null, time: new Date().toTimeString().slice(0, 5)
    });
    saveMeals(arr);
    pendingPhoto.diet = null; renderPhotoPreview("diet-photo", null);
    $("diet-name").value = ""; $("diet-grams").value = ""; $("diet-cal").value = ""; dietUnitLabel = "";
    qsa("#diet-unit-row .chip").forEach(function (x) { x.classList.remove("active"); });
    renderDiet();
  }
  function deleteDiet(id) { saveMeals(getMeals().filter(function (m) { return m.id !== id; })); renderDiet(); }
  function buildDietEdit(m) {
    var wrap = document.createElement("div"); wrap.className = "li-edit-grid";
    wrap.innerHTML =
      '<input class="edit-name" list="food-list" value="' + esc(m.name) + '" placeholder="食物名称"/>' +
      '<input class="edit-grams" type="number" value="' + m.grams + '" placeholder="克数"/>' +
      '<input class="edit-cal edit-full" type="number" value="' + Math.round(m.calories) + '" placeholder="热量 kcal"/>';
    var actions = document.createElement("div"); actions.className = "li-edit-actions";
    var save = document.createElement("button"); save.className = "btn-candy btn-sm"; save.textContent = "保存";
    var cancel = document.createElement("button"); cancel.className = "btn-outline btn-sm"; cancel.textContent = "取消";
    actions.appendChild(save); actions.appendChild(cancel);
    var box = document.createElement("div"); box.appendChild(wrap); box.appendChild(actions);
    save.addEventListener("click", function () {
      var name = wrap.querySelector(".edit-name").value.trim();
      var grams = parseFloat(wrap.querySelector(".edit-grams").value) || 0;
      var cal = parseFloat(wrap.querySelector(".edit-cal").value) || 0;
      if (!name || grams <= 0 || cal <= 0) { alert("请填好名称、克数和热量～"); return; }
      var arr = getMeals(); var idx = arr.findIndex(function (x) { return x.id === m.id; });
      if (idx >= 0) { arr[idx] = Object.assign({}, arr[idx], { name: name, grams: grams, calories: cal }); saveMeals(arr); }
      editingDietId = null; renderDiet();
    });
    cancel.addEventListener("click", function () { editingDietId = null; renderDiet(); });
    return box;
  }
  function renderDiet() {
    var user = getUser();
    var date = dietViewDate;
    var total = totalMealsCal(date);
    var goal = parseInt(user.dailyCalorieGoal) || 1300;
    $("diet-total").textContent = total.toLocaleString();
    $("diet-goal").textContent = goal.toLocaleString();
    $("diet-add-date").textContent = friendlyDate(date);
    $("diet-date").value = date;
    var chart = $("diet-chart");
    var pct = Math.min(100, Math.round((total / goal) * 100));
    chart.innerHTML = barHTML(pct, "当日目标");
    var list = $("diet-list"); list.innerHTML = "";
    var meals = getMeals().filter(function (m) { return m.date === date; }).sort(function (a, b) { return b.id - a.id; });
    if (dietFilter !== "all") meals = meals.filter(function (m) { return m.mealType === dietFilter; });
    var dateHasMeals = getMeals().some(function (m) { return m.date === date; });
    $("diet-empty").style.display = meals.length ? "none" : "block";
    $("diet-empty").querySelector("p").textContent = dateHasMeals ? ("「" + dietFilter + "」这一天还没有记录，换个餐别看看～") : "这一天还没有饮食记录～";
    if (meals.length === 0) { list.style.display = "none"; return; }
    list.style.display = "block";
    meals.forEach(function (m) {
      var li = document.createElement("li");
      if (m.id === editingDietId) { li.className = "li-edit"; li.appendChild(buildDietEdit(m)); }
      else {
        var thumb = m.photo ? '<img class="list-thumb" src="' + m.photo + '"/>' : "";
        var unit = m.unitLabel ? (esc(m.unitLabel) + " · ") : "";
        li.innerHTML = thumb +
          '<div class="list-main"><span class="list-title">' + esc(m.mealType) + ' · ' + unit + esc(m.name) + '</span><span class="list-meta">' + Math.round(m.grams) + 'g</span></div>' +
          '<div class="list-actions"><span class="list-cal">' + Math.round(m.calories) + ' kcal</span>' +
          '<button class="list-edit-btn" data-edit="' + m.id + '" title="编辑">✎</button>' +
          '<button class="list-del" data-del="' + m.id + '" title="删除">×</button></div>';
      }
      list.appendChild(li);
    });
    list.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { deleteDiet(parseInt(b.dataset.del)); }); });
    list.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { editingDietId = parseInt(b.dataset.edit); renderDiet(); }); });
  }

  /* ---------- 运动记录 ---------- */
  function initExercise() {
    var sel = $("ex-type");
    EXERCISE_DB.forEach(function (e) { var opt = document.createElement("option"); opt.value = e.name; opt.dataset.met = e.met; opt.textContent = e.name + " (MET " + e.met + ")"; sel.appendChild(opt); });
    sel.addEventListener("change", updateExCal);
    $("ex-min").addEventListener("input", updateExCal);
    $("ex-add").addEventListener("click", addExercise);
    bindPhoto("ex-photo");

    $("ex-prev").addEventListener("click", function () { editingExId = null; exViewDate = shiftDate(exViewDate, -1); renderExercise(); });
    $("ex-next").addEventListener("click", function () { editingExId = null; exViewDate = shiftDate(exViewDate, 1); renderExercise(); });
    $("ex-today").addEventListener("click", function () { editingExId = null; exViewDate = todayKey(); renderExercise(); });
    $("ex-date").addEventListener("change", function (e) { if (e.target.value) { editingExId = null; exViewDate = e.target.value; renderExercise(); } });
    qsa("#ex-filter-row .chip").forEach(function (c) {
      c.addEventListener("click", function () {
        qsa("#ex-filter-row .chip").forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active"); exFilter = c.dataset.filter; renderExercise();
      });
    });
  }
  function updateExCal() {
    var sel = $("ex-type");
    var opt = sel.options[sel.selectedIndex];
    var met = parseFloat(opt.dataset.met) || 0;
    var min = parseFloat($("ex-min").value) || 0;
    var calInput = $("ex-cal");
    var tip = $("ex-tip");
    if (met && min > 0) {
      var cal = estimateExerciseCal(met, min);
      calInput.value = cal;
      tip.textContent = "按当前体重约 " + currentWeightOrDefault().toFixed(1) + " kg 估算，消耗约 " + cal + " kcal。";
    } else { tip.textContent = "选择运动类型并输入时长，会根据你的体重自动估算消耗。"; }
  }
  function addExercise() {
    var sel = $("ex-type");
    var opt = sel.options[sel.selectedIndex];
    var name = sel.value;
    var met = parseFloat(opt.dataset.met) || 0;
    var min = parseFloat($("ex-min").value) || 0;
    var cal = parseFloat($("ex-cal").value) || 0;
    if (!name || min <= 0 || cal <= 0) { alert("请填写运动类型、时长和消耗～"); return; }
    var arr = getExercises();
    arr.push({ id: Date.now(), date: exViewDate, name: name, met: met, minutes: min, calories: cal, photo: pendingPhoto.ex || null, time: new Date().toTimeString().slice(0, 5) });
    saveExercises(arr);
    pendingPhoto.ex = null; renderPhotoPreview("ex-photo", null);
    sel.value = ""; $("ex-min").value = ""; $("ex-cal").value = "";
    renderExercise();
  }
  function deleteExercise(id) { saveExercises(getExercises().filter(function (e) { return e.id !== id; })); renderExercise(); }
  function buildExerciseEdit(m) {
    var wrap = document.createElement("div"); wrap.className = "li-edit-grid";
    var opts = EXERCISE_DB.map(function (e) { return '<option value="' + e.name + '" ' + (e.name === m.name ? "selected" : "") + ' data-met="' + e.met + '">' + e.name + ' (MET ' + e.met + ')</option>'; }).join("");
    wrap.innerHTML =
      '<select class="edit-name edit-full">' + opts + '</select>' +
      '<input class="edit-min" type="number" value="' + m.minutes + '" placeholder="分钟"/>' +
      '<input class="edit-cal" type="number" value="' + Math.round(m.calories) + '" placeholder="热量 kcal"/>';
    var actions = document.createElement("div"); actions.className = "li-edit-actions";
    var save = document.createElement("button"); save.className = "btn-candy btn-sm"; save.textContent = "保存";
    var cancel = document.createElement("button"); cancel.className = "btn-outline btn-sm"; cancel.textContent = "取消";
    actions.appendChild(save); actions.appendChild(cancel);
    var box = document.createElement("div"); box.appendChild(wrap); box.appendChild(actions);
    save.addEventListener("click", function () {
      var sel = wrap.querySelector(".edit-name");
      var name = sel.value;
      var met = parseFloat(sel.options[sel.selectedIndex].dataset.met) || 0;
      var min = parseFloat(wrap.querySelector(".edit-min").value) || 0;
      var cal = parseFloat(wrap.querySelector(".edit-cal").value) || 0;
      if (!name || min <= 0 || cal <= 0) { alert("请填好类型、时长和消耗～"); return; }
      var arr = getExercises(); var idx = arr.findIndex(function (x) { return x.id === m.id; });
      if (idx >= 0) { arr[idx] = Object.assign({}, arr[idx], { name: name, met: met, minutes: min, calories: cal }); saveExercises(arr); }
      editingExId = null; renderExercise();
    });
    cancel.addEventListener("click", function () { editingExId = null; renderExercise(); });
    return box;
  }
  function renderExercise() {
    var date = exViewDate;
    var total = totalExerciseCal(date);
    $("ex-total").textContent = total.toLocaleString();
    $("ex-add-date").textContent = friendlyDate(date);
    $("ex-date").value = date;
    var list = $("ex-list"); list.innerHTML = "";
    var exs = getExercises().filter(function (e) { return e.date === date; }).sort(function (a, b) { return b.id - a.id; });
    if (exFilter !== "all") exs = exs.filter(function (e) { return exCat(e.name) === exFilter; });
    var dateHasEx = getExercises().some(function (e) { return e.date === date; });
    $("ex-empty").style.display = exs.length ? "none" : "block";
    $("ex-empty").querySelector("p").textContent = dateHasEx ? ("「" + exFilter + "」还没有记录，换个类型看看～") : "这一天还没有运动记录，动起来吧～";
    if (exs.length === 0) { list.style.display = "none"; return; }
    list.style.display = "block";
    exs.forEach(function (e) {
      var li = document.createElement("li");
      if (e.id === editingExId) { li.className = "li-edit"; li.appendChild(buildExerciseEdit(e)); }
      else {
        var thumb = e.photo ? '<img class="list-thumb" src="' + e.photo + '"/>' : "";
        li.innerHTML = thumb +
          '<div class="list-main"><span class="list-title">' + esc(e.name) + '</span><span class="list-meta">' + e.minutes + ' 分钟</span></div>' +
          '<div class="list-actions"><span class="list-cal">-' + Math.round(e.calories) + ' kcal</span>' +
          '<button class="list-edit-btn" data-edit="' + e.id + '" title="编辑">✎</button>' +
          '<button class="list-del" data-del="' + e.id + '" title="删除">×</button></div>';
      }
      list.appendChild(li);
    });
    list.querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { deleteExercise(parseInt(b.dataset.del)); }); });
    list.querySelectorAll("[data-edit]").forEach(function (b) { b.addEventListener("click", function () { editingExId = parseInt(b.dataset.edit); renderExercise(); }); });
  }

  /* ---------- 身体数据 ---------- */
  function renderBody() {
    var user = getUser();
    var bl = getTodayBodyLog() || {};
    $("body-waist").value = bl.waist || "";
    $("body-hip").value = bl.hip || "";
    $("goal-input").value = user.targetWeight || "";
    $("start-input").value = user.startWeight || "";
    var w = latestWeight();
    var h = parseFloat(user.height);
    var bmiEl = $("bmi-value"); var labelEl = $("bmi-label"); var hintEl = $("bmi-hint"); var bar = $("bmi-bar");
    if (w && h > 0) {
      var bmi = w / ((h / 100) * (h / 100));
      bmiEl.textContent = bmi.toFixed(1);
      var status = bmi < 18.5 ? "偏瘦" : bmi < 24 ? "正常" : bmi < 28 ? "偏胖" : "肥胖";
      labelEl.textContent = "BMI · " + status;
      var pct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));
      bar.style.left = pct + "%";
      hintEl.textContent = "身高 " + h + " cm，体重 " + w.toFixed(1) + " kg";
    } else { bmiEl.textContent = "--"; labelEl.textContent = "BMI"; bar.style.left = "0%"; hintEl.textContent = "在「个人资料」中填写身高、打卡中记录体重后自动计算"; }
    var current = latestWeight(), target = parseFloat(user.targetWeight) || null;
    var diffEl = $("goal-diff");
    if (current && target) { var diff = current - target; diffEl.textContent = (diff > 0 ? "+" : "") + diff.toFixed(1) + " kg"; }
    else { diffEl.textContent = "-- kg"; }
    var days = parseInt(document.querySelector("#body-range .seg.active").dataset.days) || 7;
    Charts.lineChart("body-chart", getWeightSeries(days), { color: accentColor() });
  }
  function initBody() {
    $("body-save").addEventListener("click", function () {
      saveTodayBodyLog({ waist: $("body-waist").value, hip: $("body-hip").value });
      alert("身体数据已保存 🌿");
    });
    $("goal-save").addEventListener("click", function () {
      var user = getUser();
      user.targetWeight = $("goal-input").value;
      user.startWeight = $("start-input").value;
      saveUser(user); alert("目标已保存"); renderBody(); renderDashboard();
    });
    qsa("#body-range .seg").forEach(function (s) {
      s.addEventListener("click", function () { qsa("#body-range .seg").forEach(function (x) { x.classList.remove("active"); }); s.classList.add("active"); renderBody(); });
    });
  }

  /* ---------- 个人资料 / 设置 ---------- */
  function renderSettings() {
    var user = getUser();
    $("set-name").value = user.name || "";
    $("set-height").value = user.height || "";
    $("set-cal-goal").value = user.dailyCalorieGoal || "";
    updateSidebarUser();
    renderStorage();
  }
  function initSettings() {
    $("set-save").addEventListener("click", function () {
      var user = getUser();
      user.name = $("set-name").value; user.height = $("set-height").value; user.dailyCalorieGoal = $("set-cal-goal").value;
      saveUser(user); updateSidebarUser(); alert("个人资料已保存");
    });
    $("btn-export").addEventListener("click", exportData);
    $("btn-import").addEventListener("change", importData);
    $("btn-clear").addEventListener("click", function () {
      if (confirm("⚠️ 确定清空所有本地数据吗？此操作不可恢复！")) {
        Object.keys(LS).forEach(function (k) { localStorage.removeItem(LS[k]); });
        localStorage.removeItem("mint_ai_chat");
        alert("已清空"); location.reload();
      }
    });
    // AI 对话开关（模块 2 可选智谱）
    var aiSwitch = $("set-ai-enabled");
    var aiTip = $("ai-state-tip");
    function updateAiTip() {
      if (!aiTip) return;
      var on = localStorage.getItem("mint_ai_enabled") === "1";
      aiTip.textContent = on
        ? "当前：本地问答 + 对话式 AI（已开启）"
        : "当前：本地智能问答（对话式 AI 未开启）";
    }
    if (aiSwitch) {
      aiSwitch.checked = localStorage.getItem("mint_ai_enabled") === "1";
      aiSwitch.addEventListener("change", function () {
        localStorage.setItem("mint_ai_enabled", aiSwitch.checked ? "1" : "0");
        updateAiTip();
      });
      updateAiTip();
    }
  }
  function updateSidebarUser() {
    var user = getUser();
    $("side-name").textContent = user.name || "我的减脂日记";
    $("side-avatar").textContent = user.name ? user.name.slice(0, 1) : "我";
  }
  function storageBytes() {
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i); var v = localStorage.getItem(k) || "";
      total += (k.length + v.length) * 2;
    }
    return total;
  }
  function renderStorage() {
    var bytes = storageBytes();
    var kb = (bytes / 1024).toFixed(0);
    var pct = Math.min(100, (bytes / (5 * 1024 * 1024)) * 100);
    $("storage-fill").style.width = pct + "%";
    $("storage-text").textContent = "已用 " + kb + " KB / 上限约 5 MB" + (pct > 80 ? "（照片较多，建议清理）" : "");
  }
  function exportData() {
    var data = { user: getUser(), checkins: getCheckins(), meals: getMeals(), exercises: getExercises(), bodyLogs: getBodyLogs(), chick: getChick(), survey: getSurvey(), aiChat: get("mint_ai_chat", []) };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "薄荷减脂打卡_备份_" + todayKey() + ".json"; a.click();
  }
  function importData(e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (data.user) saveUser(data.user);
        if (data.checkins) saveCheckins(data.checkins);
        if (data.meals) saveMeals(data.meals);
        if (data.exercises) saveExercises(data.exercises);
        if (data.bodyLogs) saveBodyLogs(data.bodyLogs);
        if (data.chick) saveChick(data.chick);
        if (data.survey) saveSurvey(data.survey);
        if (data.aiChat) set("mint_ai_chat", data.aiChat);
        alert("导入成功"); location.reload();
      } catch (err) { alert("文件格式不正确"); }
    };
    reader.readAsText(file);
  }

  /* ===========================================================
     小鸡仔成长系统
     =========================================================== */
  function chickStage(growth) {
    if (growth >= 120) return { level: 3, name: "华丽大鸡", emoji: "🐔" };
    if (growth >= 80) return { level: 2, name: "元气鸡", emoji: "🐤" };
    if (growth >= 40) return { level: 1, name: "小鸡仔", emoji: "🐣" };
    return { level: 0, name: "蛋蛋", emoji: "🥚" };
  }
  function chickSVG(stage, sad) {
    var tilt = sad ? 6 : 0;
    var mouth = sad
      ? '<path d="M43 63 Q50 57 57 63" stroke="#7a4a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
      : '<path d="M43 61 Q50 69 57 61" stroke="#7a4a2a" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    var tears = sad
      ? '<path d="M40 57 q-3 7 -1 12" stroke="#7EC8E3" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M60 57 q3 7 1 12" stroke="#7EC8E3" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      : '';
    var eyes = '<circle cx="43" cy="50" r="4.2" fill="#3a2e1a"/><circle cx="57" cy="50" r="4.2" fill="#3a2e1a"/><circle cx="44.4" cy="48.6" r="1.4" fill="#fff"/><circle cx="58.4" cy="48.6" r="1.4" fill="#fff"/>';
    var cheeks = '<circle cx="36" cy="58" r="3.4" fill="#FF9FA6" opacity=".65"/><circle cx="64" cy="58" r="3.4" fill="#FF9FA6" opacity=".65"/>';
    var beak = '<path d="M47 56 L53 56 L50 62 Z" fill="#F39200"/>';
    var bodyShape, extra = "";
    if (stage === 0) {
      bodyShape = '<ellipse cx="50" cy="58" rx="29" ry="34" fill="#FFF1CF" stroke="#EAC97A" stroke-width="2"/>';
    } else {
      bodyShape = '<circle cx="50" cy="56" r="30" fill="#FFD66B"/>';
      extra += '<ellipse cx="24" cy="58" rx="8" ry="13" fill="#F4C44E" transform="rotate(-18 24 58)"/><ellipse cx="76" cy="58" rx="8" ry="13" fill="#F4C44E" transform="rotate(18 76 58)"/>';
      extra += '<path d="M42 84 l-4 8 M42 84 l4 8" stroke="#F39200" stroke-width="3" stroke-linecap="round"/><path d="M58 84 l-4 8 M58 84 l4 8" stroke="#F39200" stroke-width="3" stroke-linecap="round"/>';
      if (stage >= 2) extra += '<path d="M50 26 q-4 -10 0 -12 q4 2 0 12" fill="#EF6F7B"/><circle cx="50" cy="24" r="4" fill="#EF6F7B"/>';
      if (stage >= 3) extra += '<path d="M78 44 q14 -6 18 4 q-10 2 -18 -4 Z" fill="#FF9FA6"/><path d="M50 86 q0 8 -6 10 q6 2 6 -2 q0 4 6 2 q-6 -4 -6 -10 Z" fill="#EF6F7B"/>';
    }
    return '<svg viewBox="0 0 100 100" width="100%" height="100%" style="transform:rotate(' + tilt + 'deg)">' + bodyShape + extra + cheeks + eyes + beak + mouth + tears + '</svg>';
  }
  function updateChickOnLoad() {
    var c = getChick(); var t = todayKey();
    if (c.lastCheckin && c.lastCheckin !== t) {
      if (c.lastCheckin < dateKey(yesterday())) {
        if (c.lastPenalty !== t) { c.growth = Math.max(0, c.growth - 5); c.lastPenalty = t; c.missed = true; }
      }
    }
    saveChick(c);
  }
  function rewardChick() {
    var c = getChick(); var t = todayKey();
    if (c.lastCheckin === t) { renderChick(); return; }
    var streak = computeStreak();
    var bonus = streak >= 7 ? 15 : streak >= 3 ? 5 : 0;
    c.growth += 10 + bonus;
    c.lastCheckin = t; c.missed = false; c.lastPenalty = "";
    saveChick(c);
    showMeme(pick(CELEBRATE));
    renderChick();
  }
  function renderChick() {
    var chick = getChick();
    var stage = chickStage(chick.growth);
    var checked = isCheckedInToday();
    var sad = false, status = "", badge = "", badgeClass = "";
    if (checked) { badge = "今日已打卡"; badgeClass = "done"; status = "打卡成功，小鸡仔元气满满！"; }
    else {
      var last = chick.lastCheckin;
      if (last && last < dateKey(yesterday())) { sad = true; badge = "未打卡"; badgeClass = "miss"; status = pick(COMPLAIN); }
      else { badge = "待打卡"; badgeClass = ""; status = "今天还没打卡，小鸡仔在等你哦～"; }
    }
    var svg = chickSVG(stage.level, sad);
    var th = [0, 40, 80, 120]; var lv = stage.level;
    var start = th[lv]; var end = (lv >= 3) ? start + 40 : th[lv + 1];
    var pct = Math.min(100, Math.round(((chick.growth - start) / (end - start)) * 100));
    var remain = (lv >= 3) ? "已满级 🎉" : ("升级还需 " + (end - chick.growth) + " 成长值");

    var levelEl = $("chick-level"); if (levelEl) levelEl.textContent = stage.name + " · Lv." + lv;
    var statusEl = $("chick-status"); if (statusEl) statusEl.textContent = status;
    var fill = $("chick-growth-bar"); if (fill) fill.style.width = pct + "%";
    var gtext = $("chick-growth-text"); if (gtext) gtext.textContent = "成长值 " + chick.growth + " / " + remain;
    var badgeEl = $("chick-badge"); if (badgeEl) { badgeEl.textContent = badge; badgeEl.className = "chick-badge " + badgeClass; }
    var svgEl = $("chick-svg"); if (svgEl) { svgEl.innerHTML = svg; svgEl.className = "chick-svg" + (sad ? " sad" : ""); }
    var strip = $("chick-strip");
    if (strip) strip.innerHTML = '<div class="chick-svg' + (sad ? " sad" : "") + '">' + svg + '</div><div class="cs-text"><b>' + stage.name + '</b> · ' + badge + '<br>' + status + '</div>';
  }
  function showMeme(text) {
    var el = $("meme-toast");
    el.textContent = text; el.style.display = "block";
    clearTimeout(window.__memeTimer);
    window.__memeTimer = setTimeout(function () { el.style.display = "none"; }, 3600);
  }

  /* ===========================================================
     照片上传（压缩为 base64，仅存本机）
     =========================================================== */
  function compressImage(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var w = img.width, h = img.height;
          var scale = Math.min(1, maxDim / Math.max(w, h));
          var cw = Math.round(w * scale), ch = Math.round(h * scale);
          var canvas = document.createElement("canvas");
          canvas.width = cw; canvas.height = ch;
          canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject; img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  function bindPhoto(inputId) {
    var input = $(inputId);
    var btn = $(inputId + "-btn");
    if (!input || !btn) return;
    btn.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      var file = input.files[0]; if (!file) return;
      var key = inputId.split("-")[0];
      compressImage(file, 760, 0.62).then(function (d) {
        pendingPhoto[key] = d; renderPhotoPreview(inputId, d); input.value = "";
      }).catch(function () { alert("图片读取失败，换一张试试～"); });
    });
  }
  function renderPhotoPreview(inputId, dataUrl) {
    var preview = $(inputId.replace("-photo", "-photo-preview"));
    if (!preview) return;
    var key = inputId.split("-")[0];
    preview.innerHTML = dataUrl
      ? '<div class="photo-thumb"><img src="' + dataUrl + '"/><button class="pt-del">✕</button></div>'
      : '<span class="photo-empty">还没有照片</span>';
    if (dataUrl) {
      preview.querySelector(".pt-del").addEventListener("click", function () { pendingPhoto[key] = null; renderPhotoPreview(inputId, null); });
    }
  }

  /* ===========================================================
     今日推荐 + 身体情况调查
     =========================================================== */
  function buildDietRec(survey) {
    var user = getUser();
    var goal = parseInt(user.dailyCalorieGoal) || 1300;
    var remain = Math.max(0, goal - totalMealsCal());
    var pref = survey ? survey.dietpref : "均衡";
    var g = survey ? survey.goal : "稳健减脂";
    var scale = g === "快速减脂" ? 0.85 : g === "塑形增肌" ? 1.15 : 1;
    var breakfast, lunch, dinner;
    if (pref === "偏素食") {
      breakfast = { type: "早餐", items: [["燕麦", Math.round(50 * scale)], ["无糖豆浆", 250], ["苹果", 100]], tip: "植物蛋白先开路，肠胃一整天舒舒服服，元气拉满！🌿" };
      lunch = { type: "午餐", items: [["糙米饭", Math.round(150 * scale)], ["麻婆豆腐", 120], ["蒜蓉西兰花", 150]], tip: "豆腐补蛋白、蔬菜管到撑，好吃还没罪恶感～" };
      dinner = { type: "晚餐", items: [["红薯", 150], ["凉拌黄瓜", 150], ["番茄炒蛋", 120]], tip: "少油清淡好消化，晚上睡个香香觉💤" };
    } else if (pref === "偏肉食") {
      breakfast = { type: "早餐", items: [["煮鸡蛋", 50], ["牛奶", 250], ["全麦面包", 60]], tip: "优质蛋白狠狠补一波，一上午精神像打了鸡血！💪" };
      lunch = { type: "午餐", items: [["米饭", Math.round(150 * scale)], ["煎牛排", 120], ["水煮西兰花", 150]], tip: "实打实的肉！下午绝不犯困，干就完了🔥" };
      dinner = { type: "晚餐", items: [["鸡胸肉", 130], ["清蒸鱼", 120], ["炒青菜", 120]], tip: "高蛋白低脂收尾，只长线条不长肉肉🍗" };
    } else if (pref === "控糖控油") {
      breakfast = { type: "早餐", items: [["煮鸡蛋", 50], ["无糖豆浆", 250], ["燕麦", 40]], tip: "低 GI 组合稳血糖，扛饿一上午不崩盘！" };
      lunch = { type: "午餐", items: [["糙米饭", Math.round(120 * scale)], ["清蒸鱼", 150], ["水煮西兰花", 150]], tip: "少油少糖也好吃，控卡也能很快乐～" };
      dinner = { type: "晚餐", items: [["凉拌黄瓜", 150], ["豆腐", 100], ["蒸蛋", 100]], tip: "全程零油炸，睡前胃里轻飘飘，睡得香💤" };
    } else {
      breakfast = { type: "早餐", items: [["燕麦", Math.round(50 * scale)], ["煮鸡蛋", 50], ["牛奶", 250]], tip: "碳水+蛋白双管齐下，把代谢小火炉点着啦🔥" };
      lunch = { type: "午餐", items: [["米饭", Math.round(150 * scale)], ["鸡胸肉", 120], ["水煮西兰花", 120]], tip: "吃得饱还不撑，蛋白管够，下午不摸鱼～" };
      dinner = { type: "晚餐", items: [["红薯", 150], ["豆腐", 100], ["番茄炒蛋", 120]], tip: "清淡好消化，给肠胃放个假🌙" };
    }
    var plan = [breakfast, lunch, dinner];
    return { remain: remain, plan: plan, goalNote: g };
  }
  function buildExerciseRec(survey) {
    var user = getUser();
    var w = currentWeightOrDefault();
    var act = survey ? survey.activity : "偶尔运动";
    var g = survey ? survey.goal : "稳健减脂";
    var picks;
    if (g === "塑形增肌") picks = ["力量训练", "HIIT", "骑行"];
    else if (g === "快速减脂") picks = ["跳绳", "HIIT", "慢跑"];
    else if (act === "久坐少动") picks = ["快走", "瑜伽", "骑行"];
    else picks = ["快走", "瑜伽", "骑行", "跳绳"];
    var intensity = (g === "快速减脂") ? "强度·中高 ⚡ 今天火力全开，把脂肪燃到冒烟！🔥" : (g === "塑形增肌") ? "强度·力量 💪 慢慢雕刻线条，练出马甲线！" : "强度·中低 🌿 稳扎稳打，最容易坚持下来～";
    var exs = EXERCISE_DB.filter(function (e) { return picks.indexOf(e.name) >= 0; }).slice(0, 2);
    var minBase = (g === "快速减脂") ? 30 : (act === "久坐少动" ? 20 : 25);
    var list = exs.map(function (e) {
      var cal = estimateExerciseCal(e.met, minBase);
      return { name: e.name, min: minBase, cal: cal, video: VIDEO_LINKS[e.name] || ("https://search.bilibili.com/all?keyword=" + encodeURIComponent(e.name + "跟练")) };
    });
    return { intensity: intensity, list: list, video: list.length ? list[0].video : "https://search.bilibili.com/all?keyword=居家燃脂" };
  }
  function buildScheduleRec(survey) {
    var ci = getTodayCheckin();
    var sleep = ci ? parseFloat(ci.sleep) : null;
    var water = ci ? parseInt(ci.water) || 0 : 0;
    var items = [];
    if (sleep === null) items.push({ ico: "😴", title: "睡眠", desc: "今晚冲 22:30 前躺平，睡饱 7–8 小时，代谢直接起飞，明天掉秤嗖嗖的！😴" });
    else if (sleep < 7) items.push({ ico: "😴", title: "睡眠偏少", desc: "昨晚才睡了 " + sleep + " 小时，今天赶紧补觉！早点躺平给身体充个电🔋" });
    else items.push({ ico: "😴", title: "睡眠不错", desc: "睡了 " + sleep + " 小时，状态拉满！好睡眠就是隐形减脂外挂💤" });
    var need = Math.max(0, 8 - water);
    items.push({ ico: "💧", title: "饮水", desc: need > 0 ? ("还差约 " + need + " 杯水（每杯 200ml），咕咚咕咚补起来，别等渴了才想起来💧") : "喝水达标啦！皮肤水当当、水肿退退退💧" });
    var cond = survey ? survey.condition : "无特殊";
    var special = {
      "无特殊": "三餐固定节奏，晚饭赶在 19:00 前收工，给肠胃留足消化时间～",
      "肠胃偏弱": "肠胃弱就少食多餐、躲开生冷油腻，晚饭温软好消化，咖啡别空腹灌哦。",
      "易水肿": "少盐少油，晚饭少喝汤水，睡前把腿垫高 15 分钟帮血液回流🦵",
      "易低血糖": "随身揣个加餐（比如一根香蕉🍌），别空腹运动，练完赶紧补点糖。",
      "有三高": "低油低糖低盐，多蔬菜粗粮，规律盯紧血压血糖，运动别猛冲哦。"
    }[cond] || "固定三餐时间，规律作息。";
    items.push({ ico: "🩺", title: "身体注意", desc: special });
    return items;
  }
  function tutorialSVG() {
    var c = accentColor();
    var panels = ["热身", "标准", "收尾"];
    var svg = '<svg class="tutorial-svg" viewBox="0 0 300 96">';
    for (var i = 0; i < 3; i++) {
      var x = 50 + i * 100;
      var ly = 60 + (i === 1 ? 10 : i === 2 ? 4 : 0);
      svg += '<circle cx="' + x + '" cy="28" r="8" fill="' + c + '"/>';
      svg += '<line x1="' + x + '" y1="36" x2="' + x + '" y2="60" stroke="' + c + '" stroke-width="3"/>';
      svg += '<line x1="' + x + '" y1="44" x2="' + (x - 12) + '" y2="' + (50 + i * 4) + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
      svg += '<line x1="' + x + '" y1="44" x2="' + (x + 12) + '" y2="' + (50 + i * 4) + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
      svg += '<line x1="' + x + '" y1="60" x2="' + (x - 10) + '" y2="' + (ly + 22) + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
      svg += '<line x1="' + x + '" y1="60" x2="' + (x + 10) + '" y2="' + (ly + 22) + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
      svg += '<text x="' + x + '" y="94" text-anchor="middle" font-size="11" fill="#8b91a3">' + panels[i] + '</text>';
    }
    svg += '</svg>';
    return svg;
  }
  function renderRecommend() {
    renderSurveyState();
    var survey = getSurvey();
    var diet = buildDietRec(survey);
    $("rec-diet-tag").textContent = "今天还能炫 " + diet.remain + " kcal 的热量🔥";
    $("rec-diet").innerHTML = diet.plan.map(function (m) {
      var foods = m.items.map(function (f) { return f[0] + " " + f[1] + "g（" + calOf(f[0], f[1]) + "kcal）"; }).join(" + ");
      var totalCal = m.items.reduce(function (s, f) { return s + calOf(f[0], f[1]); }, 0);
      return '<div class="rec-item"><div class="ri-ico" style="background:var(--c-pink-soft)">🍽️</div><div class="ri-body"><div class="ri-title">' + m.type + ' · 约 ' + totalCal + ' kcal</div><div class="ri-desc">' + foods + '</div><div class="ri-meta">' + m.tip + '</div></div></div>';
    }).join("");

    var ex = buildExerciseRec(survey);
    $("rec-ex-tag").textContent = ex.intensity;
    $("rec-exercise").innerHTML = ex.list.map(function (e) {
      return '<div class="rec-item"><div class="ri-ico" style="background:var(--c-blue-soft)">🏃</div><div class="ri-body"><div class="ri-title">' + e.name + ' · ' + e.min + ' 分钟</div><div class="ri-desc">预计消耗约 ' + e.cal + ' kcal</div><a class="video-link" href="' + e.video + '" target="_blank" rel="noopener">▶ 跟练视频</a></div></div>';
    }).join("") + tutorialSVG();
    var vBtn = $("rec-video-btn");
    vBtn.onclick = function () { window.open(ex.video, "_blank"); };

    $("rec-schedule").innerHTML = buildScheduleRec(survey).map(function (s) {
      return '<div class="rec-item"><div class="ri-ico" style="background:var(--c-purple-soft)">' + s.ico + '</div><div class="ri-body"><div class="ri-title">' + s.title + '</div><div class="ri-desc">' + s.desc + '</div></div></div>';
    }).join("");
  }

  /* 身体情况调查 */
  function renderSurveyState() {
    var s = getSurvey();
    var form = $("survey-form"), done = $("survey-done"), status = $("survey-status");
    if (s) {
      form.style.display = "none"; done.style.display = "block"; status.textContent = "已定制";
      surveyDraft = Object.assign({}, s);
    } else {
      form.style.display = "block"; done.style.display = "none"; status.textContent = "待完成";
      surveyDraft = {};
    }
    qsa(".survey-chip").forEach(function (c) { c.classList.toggle("active", surveyDraft[c.dataset.group] === c.dataset.val); });
  }
  function initSurvey() {
    qsa(".survey-chip").forEach(function (c) {
      c.addEventListener("click", function () {
        var group = c.dataset.group;
        qsa('.survey-chip[data-group="' + group + '"]').forEach(function (x) { x.classList.remove("active"); });
        c.classList.add("active");
        surveyDraft[group] = c.dataset.val;
        $("survey-warn").style.display = "none";
      });
    });
    $("survey-submit").addEventListener("click", function () {
      var groups = ["gender", "age", "activity", "dietpref", "goal", "condition"];
      var missing = groups.filter(function (g) { return !surveyDraft[g]; });
      if (missing.length) { $("survey-warn").style.display = "block"; return; }
      saveSurvey(Object.assign({}, surveyDraft));
      renderRecommend();
      alert("已生成你的专属推荐 🎯");
    });
    $("survey-reset").addEventListener("click", function () {
      var s = getSurvey();
      surveyDraft = Object.assign({}, s || {});
      $("survey-form").style.display = "block";
      $("survey-done").style.display = "none";
      $("survey-status").textContent = "重新定制";
      $("survey-warn").style.display = "none";
      qsa(".survey-chip").forEach(function (c) { c.classList.toggle("active", surveyDraft[c.dataset.group] === c.dataset.val); });
    });
  }

  /* ===========================================================
     状态分享卡（Canvas）
     =========================================================== */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawShareCard() {
    var canvas = $("share-canvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#FFE9A8"); g.addColorStop(0.5, "#FFC9D6"); g.addColorStop(1, "#C9E6FF");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff"; roundRect(ctx, 40, 40, W - 80, H - 80, 32); ctx.fill();

    var user = getUser();
    var name = user.name || "我";
    var chick = getChick();
    var stage = chickStage(chick.growth);
    var w = latestWeight();
    var streak = computeStreak();

    ctx.textAlign = "center";
    ctx.fillStyle = "#8a5a00"; ctx.font = "bold 30px PingFang SC, sans-serif";
    ctx.fillText("薄荷减脂打卡", W / 2, 110);
    ctx.fillStyle = "#9b7be0"; ctx.font = "16px PingFang SC, sans-serif";
    ctx.fillText(fmtDate(new Date()) + " · " + name + " 的减脂日记", W / 2, 142);

    ctx.font = "120px serif";
    ctx.fillText(stage.emoji, W / 2, 300);

    ctx.fillStyle = "#34384a"; ctx.font = "bold 26px PingFang SC, sans-serif";
    ctx.fillText(stage.name + " · Lv." + stage.level, W / 2, 360);

    ctx.fillStyle = "#666d80"; ctx.font = "20px PingFang SC, sans-serif";
    var line2 = "当前体重 " + (w ? w.toFixed(1) + " kg" : "待记录") + "   ·   连续打卡 " + streak + " 天";
    ctx.fillText(line2, W / 2, 410);

    ctx.fillStyle = "#ef7c86"; ctx.font = "bold 22px PingFang SC, sans-serif";
    ctx.fillText(pick(isCheckedInToday() ? CELEBRATE : COMPLAIN), W / 2, 470);

    ctx.fillStyle = "#b9becb"; ctx.font = "15px PingFang SC, sans-serif";
    ctx.fillText("本地隐私版 · 数据只属于你 🌿", W / 2, H - 70);
  }
  function initShare() {
    $("btn-share").addEventListener("click", function () { drawShareCard(); $("share-modal").style.display = "flex"; });
    $("share-close").addEventListener("click", function () { $("share-modal").style.display = "none"; });
    $("share-mask").addEventListener("click", function () { $("share-modal").style.display = "none"; });
    $("share-save").addEventListener("click", function () {
      var a = document.createElement("a");
      a.href = $("share-canvas").toDataURL("image/png");
      a.download = "薄荷减脂分享卡_" + todayKey() + ".png";
      a.click();
    });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCheckin();
    initDiet();
    initExercise();
    initBody();
    initSettings();
    initSurvey();
    initShare();
    $("top-date").textContent = fmtDate(new Date());
    updateChickOnLoad();
    updateSidebarUser();
    renderDashboard();
    if (window.__mintSync) window.__mintSync.pull();
  });
})();
