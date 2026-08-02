# 薄荷减脂打卡（高级版）

一个温柔的本地隐私版减脂打卡网页，部署在 GitHub Pages，AI 助手通过自建 Cloudflare Worker 代理调用免费模型。

## 功能

- 仪表盘：体重、摄入、消耗、连续打卡一目了然，含体重趋势图与目标进度环。
- 今日打卡：体重、睡眠、心情、饮水杯数、备注。
- 饮食记录：每餐食物 + 重量，内置常见食物热量库自动估算。
- 运动记录：运动类型 + 时长，按体重自动估算消耗。
- 身体数据：BMI 自动计算、腰围臀围、体重曲线（7/14/30 天）。
- AI 助手：温柔减脂问答，聊天记录本地缓存。
- 设置：个人资料、每日热量目标、数据导出导入 JSON、清空数据。

## 文件结构

```
index.html          应用外壳 + 全部页面
/css/style.css      高级版设计系统
/js/config.js       你的 Cloudflare Worker 地址（唯一要改的地方）
/js/app.js          应用主逻辑
/js/charts.js       原生 SVG 图表
/js/ai.js           AI 助手聊天逻辑
/assets/icon.svg    站点图标
```

## 快速开始

1. 按 `部署文档_方案3.md` 创建 Cloudflare Worker 并复制地址。
2. 修改 `js/config.js` 中的 `WORKER_URL`。
3. 将本目录所有文件上传到 GitHub 仓库根目录并开启 GitHub Pages。

> 所有打卡、饮食、运动、身体数据均只保存在浏览器 localStorage，不会上传。
