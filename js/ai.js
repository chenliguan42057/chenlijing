/* ===========================================================
   薄荷减脂 AI 助手 · 双模块架构（技能增强版）
   模块 1：免费本地智能问答（20+ 技能，零配置离线，读取个人资料个性化）
   模块 2：可选对话式 AI（智谱直连，Key 在个人资料页填写，自动隐藏）
   =========================================================== */
(function () {
  "use strict";

  var CHAT_KEY = "mint_ai_chat";
  var CHAT_VER = "20260803_skillv3";

  function getZhipuKey() { try { return localStorage.getItem("mint_zhipu_key") || ""; } catch (e) { return ""; } }
  function getZhipuModel() { try { return localStorage.getItem("mint_zhipu_model") || "glm-4-flash"; } catch (e) { return "glm-4-flash"; } }

  var chatLog = document.getElementById("chat-log");
  var input = document.getElementById("ai-input");
  var sendBtn = document.getElementById("ai-send");
  var clearBtn = document.getElementById("ai-clear");

  var history = loadChat();

  function loadChat() {
    try {
      var ver = localStorage.getItem(CHAT_KEY + "_ver");
      if (ver && ver !== CHAT_VER) localStorage.removeItem(CHAT_KEY);
      localStorage.setItem(CHAT_KEY + "_ver", CHAT_VER);
      return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    } catch (e) { return []; }
  }
  function saveChat() {
    localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-50)));
    if (window.__mintSync) window.__mintSync.schedule();
  }
  function scrollBottom() { chatLog.scrollTop = chatLog.scrollHeight; }
  function renderAll() {
    chatLog.innerHTML = "";
    if (history.length === 0) {
      var hint = document.createElement("div");
      hint.className = "chat-empty";
      hint.innerHTML = "嗨～我是薄荷，你的减脂全能小助手 🌿<br>可以问我：<b>150克米饭多少热量</b>、<b>帮我算BMI</b>、<b>我每天该吃多少</b>、<b>一周减脂计划</b>、<b>外卖怎么选</b>、<b>聚餐后怎么补救</b>…<br><span style='opacity:.7;font-size:12px'>💡 本地智能问答免配置可用；想要更聪明的对话，可在「个人资料」页填写智谱 Key 并开启。</span>";
      chatLog.appendChild(hint);
    } else {
      history.forEach(addBubble);
    }
    scrollBottom();
  }
  function addBubble(msg) {
    var div = document.createElement("div");
    div.className = "bubble " + (msg.role === "user" ? "bubble-user" : "bubble-ai");
    div.textContent = msg.content;
    chatLog.appendChild(div);
  }
  function addLoading() {
    var div = document.createElement("div");
    div.className = "bubble bubble-ai loading";
    div.innerHTML = "<span></span><span></span><span></span>";
    chatLog.appendChild(div);
    return div;
  }
  function pushReply(text) {
    history.push({ role: "assistant", content: text });
    addBubble({ role: "assistant", content: text });
    saveChat();
    scrollBottom();
  }

  /* ================= 模块 1 · 本地智能问答（技能增强） ================= */
  var FOOD_CAL = {
    "米饭": 116, "白米饭": 116, "糙米饭": 123, "炒饭": 188, "粥": 46, "小米粥": 46, "馒头": 223, "花卷": 214,
    "面条": 110, "荞麦面": 110, "意面": 130, "方便面": 473, "全麦面包": 247, "白面包": 265,
    "红薯": 86, "紫薯": 82, "土豆": 77, "炸薯条": 312, "玉米": 112, "燕麦": 389, "南瓜": 26, "山药": 57,
    "鸡胸肉": 133, "鸡腿": 180, "鸡翅": 240, "煎牛排": 271, "牛肉": 250, "猪肉": 143, "红烧肉": 415, "五花肉": 520,
    "虾仁": 99, "虾": 93, "三文鱼": 208, "清蒸鱼": 110, "金枪鱼": 132,
    "煮鸡蛋": 143, "煎鸡蛋": 196, "炒鸡蛋": 162, "鸡蛋": 143, "蛋白": 60, "蛋黄": 328,
    "豆腐": 76, "麻婆豆腐": 135, "豆浆": 31, "牛奶": 54, "酸奶": 70, "奶酪": 328, "奶茶": 60, "可乐": 43, "果汁": 45,
    "苹果": 52, "香蕉": 89, "西瓜": 30, "葡萄": 69, "草莓": 32, "橙子": 47, "梨": 50, "桃子": 42,
    "西兰花": 34, "黄瓜": 16, "番茄": 19, "生菜": 15, "菠菜": 28, "芹菜": 16, "胡萝卜": 39, "炒青菜": 55,
    "油条": 388, "蛋糕": 350, "饼干": 430, "巧克力": 546, "汉堡": 295, "披萨": 235, "薯片": 540, "冰淇淋": 207,
    "坚果": 600, "核桃": 646, "花生": 574, "腰果": 553, "瓜子": 615
  };
  var NUTRI = { // 每 100g 蛋白质/碳水/脂肪（g）
    "鸡蛋": { p: 13, c: 1, f: 10 }, "鸡胸肉": { p: 23, c: 0, f: 4 }, "鸡腿": { p: 20, c: 0, f: 11 },
    "牛肉": { p: 20, c: 0, f: 18 }, "猪肉": { p: 14, c: 0, f: 9 }, "三文鱼": { p: 20, c: 0, f: 13 },
    "虾仁": { p: 18, c: 0, f: 1 }, "豆腐": { p: 8, c: 4, f: 4 }, "牛奶": { p: 3, c: 5, f: 3 },
    "酸奶": { p: 4, c: 11, f: 3 }, "豆浆": { p: 3, c: 2, f: 2 }, "燕麦": { p: 13, c: 66, f: 7 },
    "米饭": { p: 3, c: 26, f: 0 }, "全麦面包": { p: 13, c: 41, f: 4 }, "红薯": { p: 2, c: 20, f: 0 },
    "苹果": { p: 0, c: 14, f: 0 }, "香蕉": { p: 1, c: 23, f: 0 }, "西兰花": { p: 4, c: 4, f: 1 },
    "坚果": { p: 15, c: 20, f: 50 }
  };

  function getUser() { try { return JSON.parse(localStorage.getItem("mint_user")) || {}; } catch (e) { return {}; } }
  function getLatestWeight() {
    try {
      var arr = JSON.parse(localStorage.getItem("mint_body_logs")) || [];
      for (var i = arr.length - 1; i >= 0; i--) { if (arr[i] && arr[i].weight) return parseFloat(arr[i].weight); }
      var u = getUser(); if (u.startWeight) return parseFloat(u.startWeight);
      return null;
    } catch (e) { return null; }
  }
  function fmt(n) { return Math.round(n * 10) / 10; }
  // 解析 "150克米饭" / "2个鸡蛋" 这类带数量的问题
  function parseAmount(t) {
    var m = t.match(/(\d+(?:\.\d+)?)\s*(克|g|斤|两|个|碗|份|块|杯|片|根|只|颗)/i);
    var food = null;
    for (var k in FOOD_CAL) { if (t.indexOf(k) !== -1) { food = k; break; } }
    if (m && food) {
      var unit = m[2].toLowerCase();
      var grams = parseFloat(m[1]);
      if (unit === "斤") grams *= 500;
      else if (unit === "两") grams *= 50;
      else if (unit === "个") grams = (food === "鸡蛋" || food === "煮鸡蛋") ? grams * 50 : grams * 120;
      else if (unit === "碗") grams *= 150;
      else if (unit === "杯") grams *= 250;
      else if (unit === "块") grams *= 100;
      else if (unit === "片") grams *= 30;
      return { grams: grams, food: food, cal: FOOD_CAL[food] };
    }
    return null;
  }
  function bmiInfo() {
    var u = getUser(), h = parseFloat(u.height), w = getLatestWeight();
    if (!h || !w) return null;
    var bmi = w / Math.pow(h / 100, 2);
    var cat = bmi < 18.5 ? "偏瘦" : bmi < 24 ? "正常" : bmi < 28 ? "超重" : "肥胖";
    return { bmi: bmi, cat: cat, w: w, h: h };
  }
  function tdeeInfo() {
    var u = getUser(), h = parseFloat(u.height), w = getLatestWeight();
    if (!h || !w) return null;
    var bmr = 10 * w + 6.25 * h - 5 * 25 - 161; // 女性 Mifflin-St Jeor，年龄默认25
    return { bmr: bmr, tdee: bmr * 1.375 };
  }

  var KB = [
    {
      name: "问候", test: /^(你好|hi|hello|嗨|在吗|在不在|早上好|晚上好|你是谁)/i,
      reply: "你好呀～我是薄荷 🌿 你的减脂全能小助手。我可以用本地知识直接帮你：\n• 热量：\"150克米饭多少热量\"\n• 计算：\"帮我算BMI\"\"我每天该吃多少\"\n• 方案：\"一周减脂计划\"\"外卖怎么选\"\n• 营养：\"鸡蛋的营养成分\"\n\n想要更聪明的大模型对话，去「个人资料」页填智谱 Key 开启哦。"
    },
    {
      name: "食物热量(带数量)", test: /热量|卡路里|多少大卡|多少千卡|kcal/i,
      reply: function (t) {
        var amt = parseAmount(t);
        if (amt) {
          var total = Math.round(amt.cal * amt.grams / 100);
          return "帮你算好啦：\n🍚 " + amt.food + " " + Math.round(amt.grams) + "g ≈ " + total + " 大卡\n（" + amt.food + " 每100g约 " + amt.cal + " 大卡）\n\n💡 想查别的就告诉我具体食物+克数，比如\"150克鸡胸肉\"。";
        }
        var hit = [];
        for (var k in FOOD_CAL) { if (t.indexOf(k) !== -1) hit.push(k); }
        if (hit.length) {
          var parts = hit.map(function (k) { return k + " ≈ " + FOOD_CAL[k] + " 大卡/100g"; });
          return "我查到啦：\n" + parts.join("\n") + "\n\n💡 想知道具体克数的热量？告诉我\"150克" + hit[0] + "\"这种格式，我帮你换算。";
        }
        return "告诉我具体食物名和克数，比如\"150克米饭多少热量\"，我帮你算～";
      }
    },
    {
      name: "营养成分", test: /营养|蛋白质含量|碳水|脂肪含量|成分/i,
      reply: function (t) {
        var hit = null;
        for (var k in NUTRI) { if (t.indexOf(k) !== -1) { hit = k; break; } }
        if (hit) {
          var n = NUTRI[hit];
          return "「" + hit + "」每100g营养（约）：\n🥩 蛋白质 " + n.p + "g\n🍚 碳水 " + n.c + "g\n🥑 脂肪 " + n.f + "g\n\n减脂期优先选高蛋白、脂肪适中的食物哦。";
        }
        return "告诉我具体食物，比如\"鸡蛋营养成分\"，我帮你查它的蛋白/碳水/脂肪～";
      }
    },
    {
      name: "高蛋白食物", test: /高蛋白|优质蛋白|蛋白质高的食物|补蛋白/i,
      reply: "高蛋白食物排行（每100g蛋白，本地参考）：\n🥇 鸡胸肉 ~23g\n🥈 牛肉 ~20g / 虾仁 ~18g\n🥉 三文鱼 ~20g / 鸡腿 ~20g\n🍳 鸡蛋 ~13g / 豆腐 ~8g\n\n减脂期每公斤体重约 1.2-1.6g 蛋白/天，正餐都要有优质蛋白哦。"
    },
    {
      name: "食物替换", test: /替换|替代|换成|代替|不想吃/i,
      reply: "聪明替换，热量减半（本地参考）：\n• 白米饭 → 糙米饭/燕麦（更抗饿）\n• 奶茶 → 无糖豆浆/气泡水\n• 红烧肉 → 鸡胸肉/清蒸鱼\n• 薯条 → 烤红薯/水煮玉米\n• 白面包 → 全麦面包\n• 可乐 → 零度/苏打水\n原则：换「做法」比换「食物」更有效，油炸→蒸煮。"
    },
    {
      name: "BMI 计算", test: /bmi|身体质量|体重指数/i,
      reply: function () {
        var b = bmiInfo();
        if (!b) return "要算 BMI 需要你的身高和体重：\n① 去「个人资料」填身高\n② 在「身体数据」记录一次体重\n然后问我\"算BMI\"就能出结果啦～";
        return "你的 BMI = " + fmt(b.bmi) + "（" + b.cat + "）\n📏 身高 " + b.h + "cm / 体重 " + b.w + "kg\n参考范围：18.5-24 正常；<18.5 偏瘦；24-28 超重；>28 肥胖。\n\n💡 BMI 只是参考，结合体脂率看更准；想要更精确评估，去「身体数据」多记录几次。";
      }
    },
    {
      name: "基础代谢/消耗", test: /基础代谢|消耗多少|代谢率|一天消耗|tdee|bmr/i,
      reply: function () {
        var t = tdeeInfo();
        if (!t) return "估算每日消耗需要你的身高体重：\n①「个人资料」填身高 ②「身体数据」记录体重\n然后问我\"我一天消耗多少\"就行～";
        return "帮你估算（Mifflin-St Jeor 公式，默认轻活动）：\n🔥 基础代谢 ≈ " + Math.round(t.bmr) + " 大卡/天（躺着不动也要消耗的）\n🏃 每日总消耗 ≈ " + Math.round(t.tdee) + " 大卡/天（含日常活动）\n\n💡 减脂就吃「总消耗 - 300~500」，别低于基础代谢太多。";
      }
    },
    {
      name: "每日摄入目标", test: /每天吃多少|摄入目标|该吃多少|一天吃多少|热量目标/i,
      reply: function () {
        var t = tdeeInfo();
        if (!t) return "要给你定制摄入目标，需要身高体重：\n①「个人资料」填身高 ②「身体数据」记录体重\n然后问我\"我每天该吃多少\"～";
        var cut = Math.round(t.tdee) - 400;
        return "按你目前的数据，建议：\n📉 每日摄入 ≈ " + cut + " 大卡（约减 400，每周约减 0.4-0.5kg）\n搭配：\n• 蛋白：每公斤体重 1.2-1.6g\n• 主食：约占 45%（优先粗粮）\n• 蔬菜：每天 500g 以上\n\n💡 至少别低于基础代谢 " + Math.round(t.bmr) + " 大卡，极端节食会掉代谢。";
      }
    },
    {
      name: "减脂早餐", test: /早餐|早上吃|早饭/i,
      reply: "减脂早餐建议：\n① 优质蛋白：1个煮鸡蛋 / 一杯牛奶 / 豆浆\n② 慢碳水：燕麦粥 / 全麦面包 / 玉米\n③ 蔬果：苹果或小番茄\n🍳 示例：燕麦粥1碗 + 水煮蛋1个 + 苹果半个 ≈ 350 大卡\n\n💡 早餐别省！9 点前吃完，稳定血糖防止中午暴食。"
    },
    {
      name: "午晚餐", test: /午餐|中饭|晚饭|晚餐|中午吃|晚上吃/i,
      reply: "减脂午餐/晚餐：\n① 主食：一小碗米饭/半拳薯类（约150g）\n② 蛋白：掌心大鸡胸肉/鱼虾/豆腐\n③ 蔬菜：一大盘绿叶菜（少油）\n🍳 规律：午餐吃饱、晚餐七分饱、19点前吃完；少油炸多蒸煮。\n\n💡 外卖党看这里：选\"清蒸/白灼/少油\"，米饭吃一半，菜过水去油。"
    },
    {
      name: "一日食谱", test: /食谱|一日三餐|怎么吃一天|每天怎么吃|吃什么好/i,
      reply: "给你一份约 1300 大卡的减脂食谱示例：\n🌅 早餐(350)：燕麦粥1碗 + 水煮蛋1个 + 苹果半个\n🌞 午餐(450)：糙米饭半碗 + 鸡胸肉120g + 西兰花1盘\n🌆 晚餐(350)：清蒸鱼150g + 凉拌豆腐 + 炒青菜\n🍎 加餐(150)：酸奶1杯 / 一把坚果\n\n💡 可把鸡胸肉换成虾仁/牛肉，糙米饭换成红薯/玉米，量按自己饱腹感微调。"
    },
    {
      name: "一周计划", test: /一周|周计划|七天|计划表/i,
      reply: "一周减脂计划模板（可循环）：\n📅 周一：全身拉伸 + 快走30分钟\n📅 周二：深蹲+俯卧撑 3组 × 平板支撑40秒\n📅 周三：跳绳15分钟 + 快走20分钟\n📅 周四：瑜伽/拉伸（恢复日）\n📅 周五：HIIT 15分钟（开合跳+高抬腿）\n📅 周六：户外骑行/爬山 40分钟\n📅 周日：休息 + 泡脚放松\n\n🍳 每天搭配：蛋白1.2-1.6g/kg + 蔬菜500g + 睡眠7-8h + 饮水2L。"
    },
    {
      name: "运动建议", test: /运动|锻炼|健身|减肥操|怎么练|跑步|跳绳|hiit/i,
      reply: "减脂运动搭配（本地参考）：\n① 有氧：快走/慢跑/跳绳，每周 3-5 次，每次 30-40 分钟\n② 力量：深蹲/俯卧撑/平板支撑，每周 2-3 次（提高代谢）\n③ 组合：热身5min + 力量20min + 有氧20min + 拉伸5min\n\n💡 想练核心或臀腿可以问我：\"核心训练\"\"瘦腿\"\"瘦肚子\"。"
    },
    {
      name: "瘦肚子/瘦腿/核心", test: /瘦肚子|瘦腿|瘦手臂|小腹|核心训练|马甲线|拜拜肉/i,
      reply: function (t) {
        if (/肚子|小腹|核心|马甲线/.test(t)) {
          return "瘦肚子要点：\n① 没有\"局部减脂\"，肚子要靠全身热量缺口+核心训练\n② 动作：平板支撑 3组×40s、卷腹 3组×15个、俄罗斯转体 3组×20次\n③ 体态：收腹挺胸，久坐每1小时起身2分钟\n\n💡 饮食上控糖、少精加工食品，肚子效果最明显。";
        }
        return "瘦腿要点：\n① 有氧为主（快走/爬楼梯）减全身脂肪\n② 力量：深蹲 3组×15个、箭步蹲 3组×10个、臀桥 3组×15个\n③ 拉伸放松小腿，避免肌肉紧张显粗\n\n💡 视觉瘦腿：体脂降 + 臀腿训练塑形，坚持4-8周见效。";
      }
    },
    {
      name: "热量缺口", test: /热量缺口|缺口|减肥原理|为什么胖|怎么瘦/i,
      reply: "减脂核心 = 热量缺口：摄入 < 消耗，身体动用脂肪。\n📉 建议缺口 300-500 大卡/天（每周减 0.5kg 左右）。\n① 吃：少 300 大卡 ≈ 少1碗米饭+1勺油\n② 动：多消耗 200 大卡 ≈ 快走40分钟\n\n⚠️ 别极端节食（<1000大卡会掉代谢、掉肌肉），也别全靠饿——吃对+动起来最稳。"
    },
    {
      name: "平台期", test: /平台期|不掉秤|体重不动|停滞/i,
      reply: "平台期很正常，别慌 🌿\n① 身体适应了热量缺口 → 改变运动类型/强度\n② 检查隐形摄入：奶茶、酱料、坚果热量\n③ 保证睡眠 7-8h、饮水 2L\n④ 可试\"高碳日\"或\"轻断食16+8\"（先评估自身）\n\n坚持 2-4 周通常能突破，关键是不放弃。"
    },
    {
      name: "目标设定", test: /目标|每周减|减多少|减重速度|快速减/i,
      reply: "健康减脂速度：每周 0.5-1kg 最稳（快速掉的往往先水份）。\n📈 每周 0.5kg ≈ 每天缺口 400 大卡\n• 太慢（每月<1kg）→ 缺口不够，或隐形摄入太多\n• 太快（每周>1kg）→ 易反弹、掉代谢，不推荐\n\n💡 别只看体重，围度+体脂率+精神状态更真实。"
    },
    {
      name: "体脂率", test: /体脂|脂肪率/i,
      reply: "体脂率参考（女性）：\n• 20-25%：健康匀称（多数健康女性）\n• 25-30%：略高，可适当减脂\n• 30%+：建议先健康减脂\n• <18%：过低，可能影响内分泌\n\n💡 体重秤的体脂值只是参考；腰围/体态变化更直观。减脂期每瘦1kg，通常 7-8 成是脂肪就很棒。"
    },
    {
      name: "外食外卖", test: /外卖|外食|下馆子|餐厅|点餐/i,
      reply: "外卖/外食怎么吃不胖：\n① 优先：清蒸/白灼/凉拌/轻食，避开油炸红烧\n② 主食减半：米饭吃 1/2 或换粗粮\n③ 蔬菜先吃：增加饱腹，菜过一遍水去油\n④ 饮料：无糖茶/气泡水，拒绝奶茶\n\n💡 火锅选清汤锅+瘦肉+蔬菜，少蘸麻酱；日料选刺身/蒸物。"
    },
    {
      name: "零食嘴馋", test: /零食|嘴馋|想吃|饿|夜宵|解馋/i,
      reply: "嘴馋破解法：\n① 先喝一杯水，等 15 分钟（很多是渴了）\n② 想吃就吃一点点：一小把坚果/一颗黑巧/半根香蕉\n③ 备健康零食：无糖酸奶、小番茄、黄瓜条\n④ 别囤零食在家，看不见就不想吃\n\n💡 实在忍不了就吃，但吃完别自责，正餐减一点就好。"
    },
    {
      name: "聚餐补救", test: /聚餐|大餐|吃多了|吃撑|暴食|补救/i,
      reply: "大餐/吃多后的补救（不用恐慌）：\n① 别自责，一顿饭不会毁掉一切\n② 第二天：恢复正常饮食（不是节食断食！）\n③ 多喝水 + 清淡饮食 1 天，帮助代谢\n④ 恢复正常运动，别加练报复性运动\n\n💡 心态最重要：把线拉长看，偶尔一顿不影响长期。"
    },
    {
      name: "经期", test: /经期|生理期|大姨妈|月经/i,
      reply: "经期减脂提示：\n① 前1-2天可正常吃，别硬撑高强度运动（散步即可）\n② 水肿体重上浮 1-2kg 是正常的，别慌\n③ 补铁：红肉、动物肝脏、菠菜；注意保暖\n④ 经期后 7 天是减脂黄金期，可适度加大运动\n\n💡 经期食欲大涨很正常，选温热食物，别过度苛责自己。"
    },
    {
      name: "喝水", test: /喝水|饮水|多喝水|水杯/i,
      reply: "每天建议 1.5-2L 水（约 8 杯）💧\n① 早起一杯温水\n② 饭前一杯增加饱腹\n③ 少量多次，别等渴了再喝\n\n💡 别用奶茶/果汁代替水；运动出汗后适当加量。"
    },
    {
      name: "睡眠", test: /睡眠|睡觉|熬夜|失眠/i,
      reply: "睡眠不足会升皮质醇、增食欲、降代谢 😴\n① 争取 22:30-23:30 入睡，睡够 7-8 小时\n② 睡前一小时不刷手机，光线调暗\n③ 别空腹入睡，也别睡前大吃\n\n💡 熬夜后第二天更容易想吃高糖食物，尽量规律作息。"
    },
    {
      name: "术语解释", test: /什么是|术语|意思|解释|基础代谢是什么|gi|生酮|轻断食|低碳/i,
      reply: function (t) {
        if (/生酮/.test(t)) return "生酮饮食：极低碳水（<50g/天）+ 高脂肪，让身体切换燃脂模式。⚠️ 需要专业指导，很多人会出现乏力/便秘；不是减脂首选，先问医生。";
        if (/轻断食|16\+?8/.test(t)) return "轻断食 16+8：每天 8 小时内吃完三餐，其余 16 小时只喝水/无糖茶。好处是自然少吃；⚠️ 胃不好、低血糖人群慎用。";
        if (/gi/.test(t)) return "GI = 血糖生成指数。高GI（白米饭/糖）升血糖快、易饿；低GI（糙米/燕麦/蔬菜）稳血糖抗饿。减脂期多选低GI主食。";
        if (/基础代谢/.test(t)) return "基础代谢（BMR）= 你躺着不动一天也要消耗的热量，约占总消耗 60-70%。它由体重、肌肉量、年龄决定。\n\n💡 想算你的？问我\"我的基础代谢是多少\"（需先填身高体重）。";
        return "想了解哪个概念？告诉我关键词：\"基础代谢\"\"热量缺口\"\"GI\"\"生酮\"\"轻断食16+8\"\"低碳\"，我逐个解释～";
      }
    },
    {
      name: "蛋白质摄入", test: /蛋白质|蛋白|增肌|肌肉/i,
      reply: function () {
        var w = getLatestWeight();
        if (!w) return "减脂期蛋白质很重要：每公斤体重 1.2-1.6g/天。\n🥚 优质来源：鸡胸肉、鱼虾、鸡蛋、牛奶、豆腐\n\n💡 在「身体数据」记录体重后，我能按你的体重算具体蛋白量。";
        var low = Math.round(w * 1.2), high = Math.round(w * 1.6);
        return "按你体重 " + w + "kg，建议每天蛋白质：" + low + "-" + high + "g\n🥚 搭配示例：鸡胸150g(35g) + 鸡蛋2个(26g) + 牛奶1杯(8g) + 豆腐100g(8g) ≈ " + (35 + 26 + 8 + 8) + "g\n\n💡 平均分到三餐，比一顿猛吃吸收更好。";
      }
    },
    {
      name: "鼓励", test: /坚持|放弃|好难|累|想放弃|坚持不下去|没动力/i,
      reply: "抱抱你，减脂是长跑不是冲刺 🌱\n① 允许偶尔吃顿好的，别苛责自己\n② 关注体感：睡眠更好、精神更足都是进步\n③ 把目标改小：这周先做到\"每天多走20分钟\"\n\n你已经迈出第一步就很棒了，我们慢慢来 💪"
    },
    {
      name: "兜底", test: /.*/, reply: "这个问题我本地知识库还答不上来 😅 你可以试试：\n• \"150克鸡胸肉多少热量\"\n• \"帮我算BMI\"\n• \"我每天该吃多少\"\n• \"一周减脂计划\"\n• \"外卖怎么选\"\n\n想要更聪明的回答，去「个人资料」页填智谱 Key 开启 AI 对话～"
    }
  ];

  function localAnswer(text) {
    for (var i = 0; i < KB.length; i++) {
      var r = KB[i];
      if (r.test.test(text)) return typeof r.reply === "function" ? r.reply(text) : r.reply;
    }
    return "我还在学习这个知识点～换个问法试试，比如\"鸡蛋热量\"\"减脂早餐吃什么\"。";
  }

  /* ================= 模块 2 · 可选对话式 AI（智谱直连） ================= */
  function aiEnabled() {
    try { return localStorage.getItem("mint_ai_enabled") === "1" && getZhipuKey().length > 0; } catch (e) { return false; }
  }
  function chatZhipu(messages) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 30000) : null;
    var payload = JSON.stringify({
      model: getZhipuModel(),
      messages: [{ role: "system", content: "你是「薄荷」，一位专业、温柔的减脂助手，主要服务女生。回答简洁、鼓励、不制造焦虑，每次 200 字以内，可用少量 emoji。" }, messages[messages.length - 1]],
      max_tokens: 600,
      temperature: 0.6,
    });
    var opts = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getZhipuKey() },
      body: payload,
    };
    if (ctrl) opts.signal = ctrl.signal;
    return fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", opts)
      .then(function (r) { if (timer) clearTimeout(timer); return r.json(); })
      .then(function (d) {
        if (d && d.choices && d.choices[0] && d.choices[0].message) return d.choices[0].message.content || "";
        var msg = (d && d.error && (d.error.message || d.error.code)) || "";
        if (/quota|rate|limit|429/i.test(msg)) throw new Error("quota");
        throw new Error("model");
      }, function (e) { if (timer) clearTimeout(timer); throw e; });
  }

  /* ================= 发送主流程 ================= */
  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    var empty = chatLog.querySelector(".chat-empty");
    if (empty) empty.remove();

    history.push({ role: "user", content: text });
    addBubble({ role: "user", content: text });
    saveChat();
    input.value = "";
    autoGrow();

    var local = localAnswer(text);
    var isFallback = local.indexOf("本地知识库还答不上来") !== -1 || local.indexOf("还在学习") !== -1;

    if (!isFallback && !aiEnabled()) {
      pushReply("🌿 " + local);
      return;
    }
    if (aiEnabled()) {
      if (!isFallback) {
        pushReply("🌿 " + local + "\n\n（以上为本地智能问答；想深入追问可继续发消息）");
        return;
      }
      var loading = addLoading();
      scrollBottom();
      chatZhipu(history.slice(-10))
        .then(function (reply) {
          loading.remove();
          pushReply("🤖 " + reply);
        })
        .catch(function (err) {
          loading.remove();
          pushReply(err && err.message === "quota"
            ? "🤖 AI 对话额度暂时用完啦，先用本地问答顶着～\n" + local
            : "🤖 AI 对话连接失败，已用本地问答回答你：\n" + local);
        });
      return;
    }
    pushReply("🌿 " + local);
  }

  function autoGrow() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
  }

  if (sendBtn) sendBtn.addEventListener("click", function () { send(input.value); });
  if (input) input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  if (input) input.addEventListener("input", autoGrow);
  if (clearBtn) clearBtn.addEventListener("click", function () {
    if (confirm("确定清空本地聊天记录吗？")) {
      history = [];
      localStorage.removeItem(CHAT_KEY);
      renderAll();
    }
  });
  document.querySelectorAll(".ai-suggest").forEach(function (btn) {
    btn.addEventListener("click", function () { send(btn.dataset.q); });
  });

  renderAll();
})();
