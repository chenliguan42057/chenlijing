/* ===========================================================
   薄荷减脂 AI 助手 · 双模块架构
   模块 1：免费本地智能问答（零配置、离线可用、开箱即用）
   模块 2：可选对话式 AI（智谱 GLM-4-Flash，浏览器直连，
           密钥在 js/config.js 的 ZHIPU_API_KEY，可设置开关）
   =========================================================== */
(function () {
  "use strict";

  var cfg = window.APP_CONFIG || {};
  var ZHIPU_KEY = cfg.ZHIPU_API_KEY || "";
  var CHAT_KEY = "mint_ai_chat";
  var CHAT_VER = "20260803_dual";

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
      hint.innerHTML = "嗨～我是薄荷，你的减脂小助手 🌿<br>可以直接问我：食物热量、怎么吃、怎么动、减脂常识。<br><span style='opacity:.7;font-size:12px'>💡 本地智能问答免配置可用；想要更聪明的对话，可在「个人资料」页开启 AI 对话。</span>";
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

  /* ================= 模块 1 · 本地智能问答 =================
     规则引擎：关键词/正则匹配 → 返回本地答案。零配置离线可用。 */
  var FOOD_CAL = { // 常见食物热量 kcal/100g（精简）
    "米饭": 116, "白米饭": 116, "糙米饭": 123, "炒饭": 188, "粥": 46, "馒头": 223, "面条": 110,
    "全麦面包": 247, "白面包": 265, "红薯": 86, "紫薯": 82, "土豆": 77, "玉米": 112, "燕麦": 389,
    "鸡胸肉": 133, "鸡腿": 180, "煎牛排": 271, "牛肉": 250, "猪肉": 143, "红烧肉": 415, "虾仁": 99,
    "三文鱼": 208, "清蒸鱼": 110, "煮鸡蛋": 143, "煎鸡蛋": 196, "炒鸡蛋": 162, "鸡蛋": 143,
    "豆腐": 76, "麻婆豆腐": 135, "牛奶": 54, "酸奶": 70, "豆浆": 31, "奶茶": 60, "可乐": 43,
    "苹果": 52, "香蕉": 89, "西瓜": 30, "葡萄": 69, "草莓": 32, "炒青菜": 55, "西兰花": 34,
    "黄瓜": 16, "番茄": 19, "油条": 388, "蛋糕": 350, "饼干": 430, "巧克力": 546, "汉堡": 295, "披萨": 235
  };

  var KB = [
    {
      name: "问候", test: /^(你好|hi|hello|嗨|在吗|在不在|早上好|晚上好)/i,
      reply: "你好呀～我是薄荷 🌿 你可以问我：\"鸡蛋多少热量\"、\"减脂早餐吃什么\"、\"平台期怎么办\"等；想要更聪明的回答，去「个人资料」页开启 AI 对话哦。"
    },
    {
      name: "食物热量", test: /热量|卡路里|多少大卡|多少千卡|卡|kcal/i,
      reply: function (t) {
        var hit = [];
        for (var k in FOOD_CAL) { if (t.indexOf(k) !== -1) hit.push(k); }
        if (hit.length) {
          var parts = hit.map(function (k) { return k + " ≈ " + FOOD_CAL[k] + " 大卡/100g"; });
          return "我查到啦：\n" + parts.join("\n") + "\n\n💡 一般拳头大小的主食约150g，一个鸡蛋约50g，估算时可以换算哦。";
        }
        return "这个问题超出我的本地知识库啦～告诉我具体食物名（比如\"鸡蛋热量\"），或开启 AI 对话问更复杂的问题。";
      }
    },
    {
      name: "减脂早餐", test: /早餐|早上吃|早饭/i,
      reply: "减脂早餐建议（本地参考）：\n① 优质蛋白：1个煮鸡蛋 / 一杯牛奶 / 豆浆\n② 慢碳水：燕麦粥 / 全麦面包 / 玉米\n③ 蔬果：苹果或小番茄\n🍳 示例：燕麦粥1碗 + 水煮蛋1个 + 苹果半个，约 350 大卡，饱腹又稳血糖。"
    },
    {
      name: "减脂午餐/晚餐", test: /午餐|中饭|晚饭|晚餐|中午吃|晚上吃/i,
      reply: "减脂午餐/晚餐建议（本地参考）：\n① 主食：一小碗米饭 / 半拳薯类（约150g）\n② 蛋白：掌心大的鸡胸肉 / 鱼虾 / 豆腐\n③ 蔬菜：一大盘绿叶菜（少油）\n🍳 规律：午餐吃饱、晚餐七分饱、19点前吃完；少油炸多蒸煮。"
    },
    {
      name: "运动建议", test: /运动|锻炼|健身|减肥操|怎么练|跑步|跳绳/i,
      reply: "减脂运动建议（本地参考）：\n① 有氧：快走/慢跑/跳绳，每周 3-5 次，每次 30-40 分钟\n② 力量：深蹲/俯卧撑/平板支撑，每周 2-3 次，帮助提高代谢\n③ 组合：\"热身5分钟 + 力量20分钟 + 有氧20分钟 + 拉伸5分钟\"\n💡 循序渐进，微微出汗、能说话的状态就是合适强度。"
    },
    {
      name: "热量缺口", test: /热量缺口|缺口|怎么瘦|减肥原理|为什么胖/i,
      reply: "减脂核心是\"热量缺口\"：每天摄入 < 消耗，身体才会动用脂肪。\n📉 建议缺口 300-500 大卡/天（每周减 0.5kg 左右，健康不反弹）。\n① 吃：少 300 大卡 ≈ 少1碗米饭+1勺油\n② 动：多消耗 200 大卡 ≈ 快走40分钟\n两者结合最轻松，别极端节食（低于1000大卡会掉代谢）。"
    },
    {
      name: "平台期", test: /平台期|不掉秤|体重不动|停滞/i,
      reply: "平台期很正常，别慌 🌿\n① 身体适应了热量缺口，可调整：改变运动类型/强度\n② 检查隐形摄入：奶茶、酱料、坚果的热量\n③ 保证睡眠（7-8小时）和饮水（2L左右）\n④ 可以尝试\"高碳日\"或\"轻断食16+8\"（需评估自身情况）\n坚持2-4周通常能突破，关键是别放弃。"
    },
    {
      name: "蛋白质", test: /蛋白质|蛋白|长肌肉|增肌/i,
      reply: "减脂期蛋白质很重要：每公斤体重约 1.2-1.6g/天。\n🥚 优质来源：鸡胸肉、鱼虾、鸡蛋、牛奶、豆腐、豆浆\n示例：60kg 的人一天约 90g 蛋白 ≈ 鸡胸150g + 鸡蛋2个 + 牛奶1杯 + 豆腐100g。\n蛋白质饱腹感强，还能保护肌肉，减脂更稳。"
    },
    {
      name: "饮水", test: /喝水|饮水|水杯|多喝水/i,
      reply: "每天建议 1.5-2L 水（约 8 杯，每杯 250ml）💧\n① 早起一杯温水\n② 饭前一杯增加饱腹\n③ 少量多次，别等渴了再喝\n喝水本身不直接燃脂，但代谢需要水分，配合减脂更顺利。"
    },
    {
      name: "睡眠", test: /睡眠|睡觉|熬夜|失眠/i,
      reply: "睡眠不足会升高皮质醇、增加食欲，还拉低代谢 😴\n① 争取 22:30-23:30 入睡，睡够 7-8 小时\n② 睡前一小时不刷手机，光线调暗\n③ 别空腹入睡，也别睡前大吃\n睡好觉，减脂效率更高。"
    },
    {
      name: "鼓励", test: /坚持|放弃|好难|累|想放弃|坚持不下去/i,
      reply: "抱抱你，减脂本来就是长跑，不是冲刺 🌱\n① 允许偶尔吃顿好的，别苛责自己\n② 关注\"体感\"：睡眠更好、精神更足都是进步\n③ 把目标改小：这周先做到\"每天多走20分钟\"\n你已经迈出第一步就很棒了，我们慢慢来。"
    },
    {
      name: "常见问答兜底", test: /.*/, reply: "这个问题我本地知识库还答不上来 😅 你可以：\n① 换个问法，比如\"鸡蛋热量\"\"早餐吃什么\"\"怎么运动\"\n② 去「个人资料」页开启 AI 对话（智谱大模型），我能更懂你～"
    }
  ];

  function localAnswer(text) {
    var hit = null;
    for (var i = 0; i < KB.length; i++) {
      var r = KB[i];
      if (r.test.test(text)) { hit = r; break; }
    }
    if (!hit) return "我还在学习这个知识点～换个问法试试，比如\"鸡蛋热量\"\"减脂早餐吃什么\"。";
    return typeof hit.reply === "function" ? hit.reply(text) : hit.reply;
  }

  /* ================= 模块 2 · 可选对话式 AI（智谱直连） ================= */
  function aiEnabled() {
    try { return localStorage.getItem("mint_ai_enabled") === "1"; } catch (e) { return false; }
  }
  function chatZhipu(messages) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 30000) : null;
    var payload = JSON.stringify({
      model: "glm-4-flash",
      messages: [{ role: "system", content: "你是「薄荷」，一位专业、温柔的减脂助手，主要服务女生。回答简洁、鼓励、不制造焦虑，每次 200 字以内，可用少量 emoji。" }, messages[messages.length - 1]],
      max_tokens: 600,
      temperature: 0.6,
    });
    var opts = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + ZHIPU_KEY },
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

    // 本地智能问答：总是可用
    var local = localAnswer(text);
    var isLocalHit = true; // 兜底规则命中时仍走本地，但提示可开 AI
    var isFallback = local.indexOf("本地知识库还答不上来") !== -1 || local.indexOf("还在学习") !== -1;

    if (!isFallback && !(aiEnabled() && ZHIPU_KEY)) {
      // 本地明确回答，且未启用智谱 → 直接本地回复
      pushReply("🌿 " + local);
      return;
    }

    if (aiEnabled() && ZHIPU_KEY) {
      // 启用智谱 → 有本地命中时优先本地，未命中走智谱；都可用时本地优先更快
      if (!isFallback) {
        pushReply("🌿 " + local + "\n\n（以上为本地智能问答；如需深度对话可追问）");
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
            ? "🤖 AI 对话额度暂时用完啦（免费模型每日限额），先用本地问答顶着～"
            : "🤖 AI 对话连接失败，已用本地问答回答你：\n" + local);
        });
      return;
    }

    // 未启用智谱 + 本地兜底 → 本地兜底回复
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
