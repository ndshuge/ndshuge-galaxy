# 小芽 Apple 原生重构 V3 — 设计与验收记录

日期：2026-10-29。**独立预览候选，不改比赛正式链接。**

## 核心变化

这不是旧版 CSS 换肤：`native-v3/index.html` 有独立语义布局、内容层级和导航。V3 不加载旧版 `app.js/styles.css/apple-next.css/native-rebuild.css`，复用 `../core.js` 与 `../domain.js` 的业务逻辑和原本的私人/演示本地存储键。

- **今天**：以提醒事项列表和真实日程为中心，保留 AI 规则建议的授权操作。
- **日历**：24 小时时间轴、重叠事件分栏、当前时间标记、课程与活动分别新建、CSV/ICS 导入及 ICS 导出。
- **目标/复盘**：可验证的行动记录和本周真实统计；不虚构数据。
- **设置**：iOS 分组列表、原版光学开关、学期、提醒、JSON 导入导出、私人/演示隔离。
- **桌面和手机**：桌面侧栏/内容/小芽陪伴栏；手机底部悬浮导航、独立操作按钮、可滚动内容。

部分高级模型实验、BYOK / 专项 AI 调试仍在原 `../index.html`“完整功能版”入口，尚未成为 V3 内的原生模块，因此不能宣称“全部功能已完成原生迁移”。

## 真实 Skill 与组件使用情况

- ChatGPT-native Apple Web Design、SHUGE Apple Design、SHUGE Web Interface Audit 用于信息架构、语义、交互及截图审查。
- 本机原版 Taste-Skill：**实际执行** `design-taste-frontend/scripts/draw.mjs` (app) 与 `inspect.mjs` (320/390/768/1440)。早期 4 FAIL/4 WARN，修复 CSS 变量、渐变、不必要按钮阴影、文字对比度、移动边距和字体尺寸后，剩余检查中“未用 Instrument Sans”属**有意保留 Apple 系统字体**（中文使用苹方系、英文系统 San Francisco），不冒充检查器 PASS。
- 原版 liquidglass.dev `../glass/components.js`、`../glass/liquid-glass.js`：**实际 import、执行并验证**。设置内四个真实 `<lg-switch>` 使用原生 checkbox 与原版光学引擎 `.glass`，Chromium 和 WebKit 实测。悬浮操作的弹性反馈直接调用 `createSpring`。原始 `glass/LICENSE.txt` 为 MIT。
- 悬浮导航仍以跨浏览器 L1 毛玻璃为主，**不声称全页面是 L2 背景折射或原生 SwiftUI**。未复制苹果私有素材。

## 自动化与视审

最新功能测试（在独立临时浏览器上下文，不访问用户私人记录）：
- `qa-contract.cjs` 和 `qa-timeline.mjs`：9 项；
- `qa-browser.cjs`：34 项（320/390/768/1440、布局、日期、最后内容可触及、任务/目标）；
- `qa-deep.cjs`：17 项（课程/活动、重叠、导入导出、有效/无效备份、跨标签页、撤销、数据损坏保护）；
- `qa-webkit.cjs`：17 项（WebKit、触控、课程弹窗、光学组件）。
合计 **77 项**；发布前以新运行结果为准。Playwright WebKit **不是**实体 iPhone Safari，也不是苹果官方认证。

390px 与 1440px 截图已实际检查；本文件夹有真实合成演示数据截图 `today-390.png`、`calendar-390.png`、`settings-390.png`、`today-1440.png`、`settings-1440.png`。主要问题及处理：修复文件开头误写的 `\\n` 造成 `:root` token 丢失；修复凌晨时间轴初始滚动；补齐手机“新增课程”；修复移动端最后内容被悬浮导航遮挡的检查方法；复用原版光学控件而非自制 SVG。

## 发布与回退

预览部署位置：`https://ndshuge.github.io/ndshuge-galaxy/little-works/xiaoya-apple/native-v3/`。此路径上线后仍需检查网络与 Pages 构建；**正式 Apple 根目录和比赛链接不改**，评委始终进入原稳定版。待高级功能原生迁移、真实 iPhone Safari 检验及用户视觉确认后再考虑切换默认入口。
