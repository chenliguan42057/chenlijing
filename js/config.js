// ============================================================
//  AI 代理地址配置（前端零密钥：密钥只存于各代理服务端环境变量）
//  WORKER_URLS：按顺序尝试的代理地址列表——主地址优先，
//  主地址失败时 ai.js 会自动重试并切换下一个（容错机制已就绪，
//  未来可随时增补备用地址，如再部署一个云函数/其他 Serverless）。
// ============================================================
window.APP_CONFIG = {
  WORKER_URLS: [
    "https://zhipu-proxy-d3g2qq9vucdf9addd-1451267346.ap-shanghai.app.tcloudbase.com"
  ],
  // 兼容旧字段（单值），ai.js 优先读取 WORKER_URLS
  WORKER_URL: "https://zhipu-proxy-d3g2qq9vucdf9addd-1451267346.ap-shanghai.app.tcloudbase.com"
};
