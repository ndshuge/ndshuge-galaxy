# 小芽高级感重做 · 2026-10-25

## 设计与问题
现有两实验版被用户明确反馈为配色惯性（大量鼠尾草绿/灰蓝），且虽然结构已重新分组，视觉仍缺少不同品牌气质。前版真实截图：evidence/redesign-apple-before.png 与 evidence/redesign-studio-before.png。本轮改造仅作用于两套实验版，原版小芽未修改。

## 已真实执行的工作流
- Apple：检查 `E:/CHATGPT/.agents/skills/apple-web-design/SKILL.md`、`_system/apple_web_design_os/WORKFLOW.md` 与验证脚本（安装路由通过）；选 Hybrid，实体工作卡与导航区分材质，不声称 CSS 等于系统级真实折射。新源 `xiaoya-apple/premium.css`，主体变为暖石墨/银黑/香槟钛金，去除绿蓝光晕。保留六项导航、原业务数据与 reduced-motion。
- Taste-Skill：阅读 `design-taste-frontend/SKILL.md` 与 `references/app-screens.md`；运行两次新的 app draw，保存至本地 `.taste-skill/xiaoya-premium`（workspace seed 1479051762）、`.taste-skill/xiaoya-apple-premium`（creator seed 844458610）。产品色彩约束覆盖抽样随机调色；具体操作方向用暖纸面、任务列表优先、有限单色强调。新源 `xiaoya-studio/premium.css`。
- Designeer：真实打开 `https://designeer.xyz/resources` 和 `https://designeer.xyz/inspiration`，看到 Fontshare 与 60fps 具体条目，查阅原网站 `https://60fps.design/`、`https://fontshare.com/`。采用 60fps 的操作反馈原则，拒绝无关持续动画；未直接复制设计稿/图片/字体。
- 对应关系：`redesign.js` 重做首页信息结构，`redesign.css` 重做产品层级与响应式，`premium.css` 负责明确的材质、色彩、状态、排版。这不是原版覆盖，而是两个在同一业务数据层上的独立体验。

## 截图-修复
- 第一轮 390px 真浏览器截图发现 Skill 版介绍文字因为 `font-size:0` 导致行宽塌缩成竖排。已恢复 14px/正常布局，重新截图 `evidence/premium-studio-390-fixed.png`。
- Apple 版删除过度泛化的英文首屏题字，用中文主叙事；真实截图 `evidence/premium-apple-final.png`。
- 两版使用原 UI 的演示存档可确认真实课程与待办，没有伪造用户数据。

## 质量检查
运行 `$env:PLAYWRIGHT_MODULE_PATH='E:/CHATGPT/projects/ai-academy/video-studio/node_modules/playwright-core'; node qa-xiaoya-compare.cjs`：52/52 通过，320/390/768/1440，覆盖三入口、六个页面导航、脚本错误、越界、本地存储键隔离。AI 真正付费请求、真机 iPhone Safari 仍未验收。数据键独立不等于跨同源安全沙箱。
