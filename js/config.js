// ============================================================
//  薄荷减脂 · 前端配置（AI 双模块 + 数据直连 GitHub 同步）
//  安全设计：
//   - 智谱 API Key：不在本文件里，由你在「个人资料 → AI 助手」
//     填写，仅存本机浏览器 localStorage，填完自动隐藏。
//   - GITHUB_TOKEN：数据同步用「受限令牌」（Fine-grained token，
//     仅授权 mint-data 仓库 Contents 读写）。请勿放全权限令牌。
//     留空 = 同步功能禁用。
// ============================================================
window.APP_CONFIG = {
  /* ---- 数据云同步：前端直连 GitHub（不经过任何服务器中转）---- */
  GITHUB_TOKEN: "",                          // ← 受限令牌，待你创建后填入
  GITHUB_REPO: "chenliguan42057/mint-data",
  GITHUB_PATH: "data.json",
  GITHUB_BRANCH: "main"
};
