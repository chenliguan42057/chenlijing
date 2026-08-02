// ============================================================
//  薄荷减脂 · 前端配置（双模块 AI + 数据直连 GitHub 同步）
//  ⚠️ 安全提示：本文件是公开可见的。ZHIPU_API_KEY 与 GITHUB_TOKEN
//     都会暴露给任何访问者，请使用「低权限/受限」令牌并定期更换。
// ============================================================
window.APP_CONFIG = {
  /* ---- 模块 2：可选对话式 AI（智谱 GLM-4-Flash，永久免费）---- */
  ZHIPU_API_KEY: "322571bb3e62469985cffbd34c384fcf.1Ka3xiL89KLcdWE5",

  /* ---- 数据云同步：前端直连 GitHub（不经过任何服务器中转）----
     GITHUB_TOKEN 请使用「受限令牌」：只授权 mint-data 仓库的
     Contents 读写权限（Settings → Developer settings →
     Fine-grained tokens → 仓库选 mint-data → Contents: Read and write）
     绝不要用全权限 PAT。留空则同步功能自动禁用。 */
  GITHUB_TOKEN: "",
  GITHUB_REPO: "chenliguan42057/mint-data",
  GITHUB_PATH: "data.json",
  GITHUB_BRANCH: "main"
};
