// ============================================================
//  唯一需要你修改的地方：把 WORKER_URL 改成你的 Cloudflare Worker 地址
//  部署 Worker 后，Cloudflare 会给你一个类似下面的地址：
//      https://fatloss-ai.你的用户名.workers.dev
//  把它填到下面引号里即可（注意：这是公开地址，不是密钥，放前端没问题）。
// ============================================================
window.APP_CONFIG = {
  WORKER_URL: "https://fatloss-ai.yourname.workers.dev",
};
