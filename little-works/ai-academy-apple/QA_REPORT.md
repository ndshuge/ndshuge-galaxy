# 知序 Apple Edition｜真实验收与 Skill 使用记录

日期：2026-10-28。运行环境：Windows Microsoft Edge Headless，Node 本机预览服务器 + 正式 GitHub Pages 原版业务接口。

## 原版保护

原版产品源文件在 `E:\CHATGPT\projects\ai-academy`；原版线上入口：`https://ndshuge.github.io/zhixu-ai-academy/`。本次 Git 改动范围限定 `little-works/ai-academy-apple/` 与 `little-works/catalog.json` 新增一条目录记录。原版比赛链接、原代码、原版路由不改变。

## 功能自动化

- **基础测试 25/25 PASS**（`qa/browser-report.json`）。覆盖 320、390、768、1024、1440px；Original 同源 API adapter、原版 V2 数据模块、真实题库加载、未预选选项、真实评分和记录、学生预测、Logistic 数学运行、两条实际数据曲线、规则导师、原版迁移题、刷新后的学习证据、真实 Motion 加载、Liquid Glass SVG filter 创建、无页面 JS 抛错与资源 404。
- **深入测试 20/20 PASS**（`qa/extended-report.json`）。覆盖 390px 六大页面、AI BYOK 原版连接界面开关、原生 `lg-segmented` 与学科切换、答题提交未选择时禁用、真实 EvoWorld 运行、导师规划和学生审批后第二轮真实运行、V2 实验记录由一次增加为两次、课程长按与取消、减少动态效果模式、原版/新版并排对照。
- 后续视觉审计发现生态实验此前只显示空指标，已补充真实 EvoWorld `results` 四行对照表并重新进行最终回归；原生分段控件对齐亦调整。

**说明：** 以上是自动化测试断言数，不能替代设计审美评分，也不等于 Apple 原生应用质量认证。真实 DeepSeek 模型因未由用户提供验证凭证而未进行带费用调用，默认规则反馈已验证。

## 已实装的 Skill 引擎

| 来源 | 实际应用 | 运行证明 |
|---|---|---|
| SHUGE Apple Design — Fidelity First | 设计方向、对比、信息组织与品质门槛 | `design-studies/` 3 套高保真方案及 3 张真实浏览器截图 |
| Apple Web Design | 真实 Apple Books、Music、Notes、Health、Settings 研究与阅读优先的布局 | 5 个断点截图、独立学习/资料/课程/进度/设置 |
| Apple Liquid Glass | 统一材质和 Token、控件优先而非内容卡片泛玻璃 | `assets/apple-tokens.css` 已导入页面 |
| Liquid Glass for the Web | 复用现成光学与 Web Components，未重写折射 | `assets/liquid-glass.js` / `components.js`，原生 `lg-navbar`、`lg-lens`、`lg-segmented`，SVG filter 真实产生 |
| Motion | `animate`、`motionValue`、Spring、`getVelocity`、可中断按压/反弹 | 本地 `assets/motion.bundle.js` 来自 Motion v14.7.1；浏览器验证引擎确实加载 |
| Design Taste Frontend、finesse、Impeccable、Prism、Frontend Dual Source | 设计审计、交互间距、动效语义、审美和复用边界 | 作为研究与评审规则，不宣称这些资源引擎全部被实际编入代码 |

**真实材料类型：** 当前使用 SVG displacement/filter 和可复用 Web Component 光学材质；不是以普通 CSS blur 冒充所有 L2。没有实现新的 WebGL Shader，也没有验证 iOS 真实 GPU 120Hz。

## 可视化证据

- 三种候选方案：`qa/direction-clean-390.png`、`qa/direction-immersive-390.png`、`qa/direction-hybrid-390.png`（选择阅读优先 Hybrid）。
- 主页面：`qa/apple-home-320.png`、`apple-home-390.png`、`apple-home-768.png`、`apple-home-1024.png`、`apple-home-1440.png`。
- 移动学习：`qa/extended-learn-390.png`、`qa/extended-evolution-experiment-390.png`、`qa/extended-courses-390.png`、`qa/extended-library-390.png`、`qa/extended-growth-390.png`、`qa/extended-settings-390.png`。
- 原版比较：`qa/original-edition-390.png`、`qa/original-edition-1440.png`、`compare.html`。

## 性能与降级

`qa/perf-report.json`，仅为本机 Headless Edge + 回环预览数据，不是公网或 iPhone 真机结果：

| 指标 | 390px | 1440px |
|---|---:|---:|
| 同源原版业务引擎准备好 | 1092ms | 769ms |
| DOMContentLoaded | 283ms | 140ms |
| FCP | 580ms | 80ms |
| 当前页面报告 JS Heap（不是含 iframe 全量内存） | 3.47MB | 4.42MB |
| SVG optical filter 个数 | 3 | 3 |

减少动态效果媒体查询已测试为 true，按钮微动效降到 0.01ms。缺口：没有完成真实 Safari/iPhone/iPad 手势手感测试、耗电检测、设备 60/120Hz 稳态帧率及公网指标，也未量化对真实 Apple 应用的视觉相似度。

## 已知限制

1. 原版仍不具备完整自动学科知识图谱、学校成绩接口、真正全学科自主教师，Apple Edition 未伪装。
2. 新版以同源 iframe 复用原版：优点是比赛业务逻辑完全不分叉、共享 V2 数据；代价是原版资源必须可访问且隐藏 iframe 装载成本较高。长期理想路线是业务 SDK / 稳定 API 契约，必须另行低风险项目。
3. 用户必须亲自配置原版模型并且对每次发送实验摘要授权。无 Key 时为真实规则导师，不冒充大模型。
4. 这是一套经过真实浏览器回归的独立产品前端，不代表 Apple 官方认证或真实 iOS 原生应用。

## 复验命令

在仓库根目录，先运行 `node little-works/ai-academy-apple/qa/serve-dev.mjs`，再运行 `node little-works/ai-academy-apple/qa/test.mjs`、`node little-works/ai-academy-apple/qa/extended.mjs`、`node little-works/ai-academy-apple/qa/perf.mjs`。脚本通过单独测试环境中的 Playwright 在 headless Edge 运行，不是产品线上依赖。
