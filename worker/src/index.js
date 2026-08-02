// 减脂打卡网站 · AI 减脂助手代理（Cloudflare Workers）
// 部署：Cloudflare 后台「Workers → 创建/编辑代码」直接粘贴本文件即可，无需任何 API Key。
// 前置：在 Worker「Settings → Bindings」添加 AI 绑定，变量名填 AI，类型选 Workers AI。
//
// 安全要点：
//  - 模型通过平台绑定 env.AI 调用，前端永远拿不到任何密钥；
//  - 前端只请求本 Worker 地址，绝不直接对接第三方大模型 API；
//  - System Prompt 固化在后端，前端无法篡改助手人设。

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

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(data, status = 200, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}

function resolveAllowOrigin(request, allowed) {
  if (allowed === "*") return "*";
  const origin = request.headers.get("Origin");
  return origin === allowed ? allowed : "null";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowed = env.ALLOWED_ORIGIN || "*";
    const allowOrigin = resolveAllowOrigin(request, allowed);

    // 健康检查（浏览器/你本人可直接访问 Worker 地址看到）
    if (request.method === "GET") {
      return new Response("OK - 薄荷减脂 AI 代理运行中", {
        headers: { "Access-Control-Allow-Origin": allowOrigin },
      });
    }

    // 浏览器跨域预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(allowOrigin) });
    }

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ error: "not_found" }, 404, corsHeaders(allowOrigin));
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "bad_request" }, 400, corsHeaders(allowOrigin));
    }

    const messages = Array.isArray(body.messages) ? body.messages : [];

    // 只接受 user / assistant 消息，杜绝前端注入 system 角色；限制条数与长度以控制成本
    const clean = messages
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (clean.length === 0) {
      return json({ error: "empty" }, 400, corsHeaders(allowOrigin));
    }

    try {
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...clean],
        max_tokens: 600,
        temperature: 0.6,
      });

      const reply = String(
        result?.response ?? result?.result?.response ?? ""
      ).trim();

      if (!reply) {
        return json({ error: "empty_reply" }, 502, corsHeaders(allowOrigin));
      }
      return json({ reply }, 200, corsHeaders(allowOrigin));
    } catch (e) {
      const msg = (e && (e.message || String(e))) || "";
      const isQuota = /limit|quota|rate|429|exceed|too many/i.test(msg);
      if (isQuota) {
        // 免费额度（每日 10000 Neurons）耗尽，前端给出温柔提示
        return json({ error: "quota" }, 429, corsHeaders(allowOrigin));
      }
      return json(
        { error: "model", detail: msg.slice(0, 200) },
        502,
        corsHeaders(allowOrigin)
      );
    }
  },
};
