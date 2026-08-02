/* ===========================================================
   AI 减脂助手 · 聊天逻辑（调用 AI 代理，含超时/重试/多地址容错）
   代理地址在 js/config.js 的 WORKER_URLS 数组中配置（主地址优先，
   主地址失败自动切换下一个），前端零密钥。
   =========================================================== */
(function () {
  "use strict";

  var CHAT_KEY = "mint_ai_chat";
  var CHAT_VER = "20260802_v4"; // 聊天记录缓存版本：站点升级时+1，旧记录自动清空

  /* ---------- 读取代理地址列表（兼容 WORKER_URLS 数组 与 旧 WORKER_URL 单值） ---------- */
  var WORKER_URLS = [];
  (function () {
    var cfg = window.APP_CONFIG || {};
    if (Array.isArray(cfg.WORKER_URLS) && cfg.WORKER_URLS.length) {
      WORKER_URLS = cfg.WORKER_URLS.slice();
    } else if (cfg.WORKER_URL) {
      WORKER_URLS = [cfg.WORKER_URL];
    }
    WORKER_URLS = WORKER_URLS
      .map(function (u) { return String(u || "").trim().replace(/\/+$/, ""); })
      .filter(function (u) { return u && u.indexOf("yourname") === -1; });
  })();

  var chatLog = document.getElementById("chat-log");
  var input = document.getElementById("ai-input");
  var sendBtn = document.getElementById("ai-send");
  var clearBtn = document.getElementById("ai-clear");

  var history = loadChat();

  function loadChat() {
    try {
      var ver = localStorage.getItem(CHAT_KEY + "_ver");
      if (ver && ver !== CHAT_VER) {
        // 明确标记过且版本旧 → 清空旧记录（含历史失败气泡）
        localStorage.removeItem(CHAT_KEY);
      }
      // 无论是否清空，写入当前版本；无标记（如云端恢复的数据）一律保留
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

  /* ---------- 带超时的 fetch（默认 25 秒，避免无限转圈） ---------- */
  function fetchWithTimeout(url, opts, ms) {
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, ms || 25000) : null;
    var p = fetch(url, ctrl ? Object.assign({}, opts, { signal: ctrl.signal }) : opts);
    return p.then(
      function (r) { if (timer) clearTimeout(timer); return r; },
      function (e) { if (timer) clearTimeout(timer); throw e; }
    );
  }

  /* ---------- 发送消息：多地址逐个尝试 + 每地址自动重试 ---------- */
  function send(text) {
    text = (text || "").trim();
    if (!text) return;
    if (!WORKER_URLS.length) {
      alert("AI 代理地址未配置，请检查 js/config.js 的 WORKER_URLS 哦～");
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

    var payload = JSON.stringify({ messages: history.filter(function (m) { return m.role !== "system"; }) });
    var MAX_RETRY = 2;      // 每个地址最多重试次数
    var urlIndex = 0;       // 当前地址下标
    var tried = 0;          // 当前地址已尝试次数
    var done = false;

    function finish() {
      if (!done) { done = true; loading.remove(); }
    }

    function attempt() {
      if (done) return;
      if (urlIndex >= WORKER_URLS.length) {
        // 所有地址都失败
        finish();
        handleError("network");
        return;
      }
      var url = WORKER_URLS[urlIndex] + "/chat";
      fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      }, 25000)
        .then(function (resp) {
          return resp.json().then(function (data) { return { ok: resp.ok, data: data }; });
        })
        .then(function (r) {
          if (!r.ok || r.data.error) {
            // 服务器明确返回错误（配额/模型/配置），不重试，直接提示
            finish();
            handleError(r.data && r.data.error ? r.data.error : "http");
            return;
          }
          var reply = r.data.reply || "（小助手没有回复）";
          history.push({ role: "assistant", content: reply });
          addBubble({ role: "assistant", content: reply });
          saveChat();
          scrollBottom();
          finish();
        })
        .catch(function () {
          // 网络失败 / 超时：先重试当前地址，再切换下一个地址
          if (done) return;
          tried++;
          if (tried < MAX_RETRY) {
            setTimeout(attempt, 800);
          } else {
            tried = 0;
            urlIndex++;
            setTimeout(attempt, 300);
          }
        });
    }
    attempt();
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
