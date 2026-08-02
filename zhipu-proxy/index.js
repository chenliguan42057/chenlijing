// ============================================================
// 智谱 GLM-4-Flash 免费模型代理 · 腾讯云 CloudBase 云函数
// 零依赖版（仅用 Node 原生 https，不依赖 fetch / node-fetch）
// ------------------------------------------------------------
// 环境变量：ZHIPU_API_KEY = 智谱开放平台 API Key（机密）
// 访问方式：云函数开启「HTTP 访问服务」→ https://<env>.app.tcloudbase.com
// 前端 js/config.js 的 WORKER_URL 填该域名（前端 ai.js 无需改动）
// ============================================================

const https = require("https");

const SYSTEM_PROMPT = `你是「薄荷」，一位专业、温柔的减脂助手，主要服务女生。
请用简洁、鼓励、不制造焦虑的语气回答，像贴心的闺蜜一样但保持专业。
你擅长：
- 估算常见食物的热量与营养；
- 根据目标（如每周减 0.5kg）设计温和可行的饮食与运动方案；
- 科普健康减脂常识（热量缺口、蛋白质摄入、睡眠、饮水、平台期等）。
规则：
- 不提供医疗诊断，不推荐极端节食（如低于 1000 kcal/天）或减肥药物；
- 涉及具体健康问题，提醒咨询专业医生或注册营养师；
- 每次回答控制在 200 字以内，尽量分点，清晰好读；
- 可适当使用 emoji 增加温柔感，但不要过度。`;

const ZHIPU_HOST = "open.bigmodel.cn";
const ZHIPU_PATH = "/api/paas/v4/chat/completions";
const MODEL = "glm-4-flash"; // 永久免费模型

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status) {
  return {
    statusCode: status || 200,
    headers: corsHeaders(),
    body: JSON.stringify(data),
  };
}

function parseEvent(event) {
  event = event || {};
  const rc = event.requestContext || {};
  let bodyText = event.body || "";
  if (event.isBase64Encoded && bodyText) {
    bodyText = Buffer.from(bodyText, "base64").toString("utf8");
  }
  let body = {};
  if (bodyText) {
    try { body = JSON.parse(bodyText); } catch (e) { body = {}; }
  }
  return {
    path: event.path || rc.path || "/",
    method: event.httpMethod || rc.httpMethod || "GET",
    body,
  };
}

// 用 Node 原生 https 调用智谱（零依赖，兼容所有 Node 运行时）
function callZhipu(messages, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 600,
      temperature: 0.6,
    });
    const req = https.request(
      {
        host: ZHIPU_HOST,
        path: ZHIPU_PATH,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(data) });
          } catch (e) {
            reject(new Error("解析响应失败: " + data.slice(0, 200)));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

exports.main = async (event, context) => {
  const { path, method, body } = parseEvent(event);

  if (method === "GET") {
    return json({ ok: true, msg: "薄荷减脂 AI 代理运行中（智谱 GLM-4-Flash）" });
  }
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }
  if (method !== "POST" || path !== "/chat") {
    return json({ error: "not_found" }, 404);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const clean = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (clean.length === 0) {
    return json({ error: "empty" }, 400);
  }

  const apiKey = process.env.ZHIPU_API_KEY || "";
  if (!apiKey) {
    return json({ error: "config", detail: "云函数缺少环境变量 ZHIPU_API_KEY" }, 500);
  }

  try {
    const resp = await callZhipu(clean, apiKey);
    if (resp.status !== 200 || resp.json.error) {
      const msg = (resp.json.error && (resp.json.error.message || resp.json.error.code)) || "";
      const isQuota = /quota|rate|limit|429|exceed/i.test(msg + " " + resp.status);
      return json({ error: isQuota ? "quota" : "model", detail: String(msg).slice(0, 200) }, resp.status || 500);
    }
    const reply =
      (resp.json.choices && resp.json.choices[0] && resp.json.choices[0].message && resp.json.choices[0].message.content) || "";
    if (!reply) {
      return json({ error: "empty_reply" }, 502);
    }
    return json({ reply: reply.trim() });
  } catch (e) {
    return json({ error: "model", detail: String(e).slice(0, 200) }, 502);
  }
};
