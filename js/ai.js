/* ===========================================================
   AI 减脂助手 · 聊天逻辑（调用自建 Cloudflare Worker 代理）
   已接入新布局的 AI 助手页面。
   =========================================================== */
(function () {
  "use strict";

  var WORKER_URL = (window.APP_CONFIG && window.APP_CONFIG.WORKER_URL) || "";
  var CHAT_KEY = "mint_ai_chat";
  var CHAT_VER = "20260802_v3"; // 聊天记录缓存版本：站点升级时+1，旧记录（含失败气泡）自动清空

  var chatLog = document.getElementById("chat-log");
  var input = document.getElementById("ai-input");
  var sendBtn = document.getElementById("ai-send");
  var clearBtn = document.getElementById("ai-clear");

  var history = loadChat();

  function loadChat() {
    try {
      var ver = localStorage.getItem(CHAT_KEY + "_ver");
      if (ver !== CHAT_VER) {
        // 旧版本聊天记录（可能含历史失败气泡），一次性自动清空，无需用户手动操作
        localStorage.removeItem(CHAT_KEY);
        localStorage.setItem(CHAT_KEY + "_ver", CHAT_VER);
        return [];
      }
      return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    } catch (e) { return []; }
  }
  function saveChat() { localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-50))); }

  function scrollBottom() { chatLog.scrollTop = chatLog.scrollHeight; }

  function renderAll() {
    chatLog.innerHTML = "";
    if (history.length === 0) {
      var hint = document.createElement("div");
      hint.className = "chat-empty";
      hint.innerHTML = "嗨～我是薄荷，你的减脂小助手。<br>可以问我食物热量、运动方案或减脂常识 🌿";
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

  function handleError(type) {
    var map = {
      quota: "今天的 AI 小助手额度用完啦 🌿 明天 0 点（UTC）会自动恢复，先去打卡记录一下吧～",
      network: "网络好像开小差了，检查一下网络再试试～",
      model: "小助手暂时有点忙，稍后再来聊～",
      http: "连接小助手失败了，稍后重试一下～"
    };
    var msg = map[type] || map.http;
    history.push({ role: "assistant", content: msg });
    addBubble({ role: "assistant", content: msg });
    saveChat();
    scrollBottom();
  }

  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    if (!WORKER_URL || WORKER_URL.indexOf("yourname") !== -1) {
      alert("请先在 js/config.js 里把 WORKER_URL 改成你的 Worker 地址哦～");
      return;
    }
    var empty = chatLog.querySelector(".chat-empty");
    if (empty) empty.remove();

    history.push({ role: "user", content: text });
    addBubble({ role: "user", content: text });
    saveChat();
    input.value = "";
    autoGrow();

    var loading = addLoading();
    scrollBottom();

    fetch(WORKER_URL.replace(/\/+$/, "") + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.filter(function (m) { return m.role !== "system"; }) })
    })
      .then(function (resp) {
        loading.remove();
        return resp.json().then(function (data) { return { ok: resp.ok, data: data }; });
      })
      .then(function (r) {
        if (!r.ok || r.data.error) {
          handleError(r.data && r.data.error ? r.data.error : "http");
          return;
        }
        var reply = r.data.reply || "（小助手没有回复）";
        history.push({ role: "assistant", content: reply });
        addBubble({ role: "assistant", content: reply });
        saveChat();
        scrollBottom();
      })
      .catch(function () {
        loading.remove();
        handleError("network");
      });
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
