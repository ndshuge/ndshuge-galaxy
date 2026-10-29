# 知序 AI 学院 V4 Native Rebuild｜设计规格（2026-10-29）

## 意图与边界
用户已经选择“完全从真实 Apple UI 借鉴后独立重建”方向；R3 演示与比赛入口稳定、未经验收不替换。目标是让 iPhone 和桌面浏览器分别具有 Apple Books 内容体验、Mac Notes 三栏结构、Fitness 的证据可视化，同时保留科学引擎、真实前测/迁移、独立预测、规则/用户授权 AI 导师、复习、成长、设置和数据导出。
不得把原 CSS 改名、不得将旧版 app.js DOM 模板当作新结构、不得复制 Apple 私有资产或误称纯网页为 SwiftUI。

## 已直接参考
- Apple Books 官方 iPhone 截图：Apple Support https://support.apple.com/guide/iphone/read-books-iphc1af7c57/ios （大标题、继续阅读优先、从任务进入内容，不用广告巨幅 Hero）。
- macOS Notes 官方使用说明： https://support.apple.com/vi-vn/guide/notes/apd8b73d28be/mac （导航/列表/详情三栏，窄屏合并）。
- Fitness Trends 可视化参考：以真实记录而不是虚构分数表示学习过程。
- Apple HIG Tab Bars / Sidebars / Materials 及 Apple Design Resources（HIG 动态页要求 JS；官方设计资源页已访问）。属于参考而不是直接复制源设计。
- SHUGE Apple Design、Liquid Glass Web 和 Motion 插件内参考及现存 MIT 源码：原版 components.js / liquid-glass.js / motion.bundle.js。

## 方案比选与决定
1. 旧 R3 CSS 覆盖：最快但不满足「推倒重来」，否决。
2. 全部数据/教学引擎重写：不符功能不变，风险高，否决。
3. **独立 V4 前端（采用）**：分离页面模板、样式和数据桥，完整使用 Original Pages 的同源科学接口；R3 不变。分别做 iPhone 与 Mac 的布局而非放大缩小同一张卡片。

## 组件与页面
- iPhone：顶部上下文导航 + 大标题 + 首页继续学习与课程书架 + 悬浮玻璃 5-tab。课程内容是“阅读/实验”单列，无广告式卡片；实验进程每一步重点突出。
- Desktop：左栏主要导航（224px），中栏当前课程/事件目录（280px），右侧主内容白纸阅读工作区；可以收起目录；无伪 Mac 红绿灯和菜单。
- 六个页面：今天、课程、学习、资料错题、进度、设置。知序博士为非模态浮动助手，可收缩，不遮盖题目。
- 有数据时显示真实答题与实验记录，无数据时显示明确空状态；严禁假数字与未验证的“掌握率”。
- 设计：系统字体、apple #f5f5f7 背景、白纸内容、薄分隔、少量青绿点色、局部图形; No sparkle/八角星。
- 所有悬浮控件提供 idle/down/hold/release/cancel/reduced-motion；glass 仅用于控件且尊重浏览器降级。

## 真实业务接口
V4 只连接 /zhixu-ai-academy/learning.html 隐藏 iframe，使用 ZHIXU_BROWSER_ADAPTER 的真实同源 fetch API：
/api/status, /api/learning/questions?stage=pre|transfer&experiment=..., /api/learning/item?itemId=..., /api/learning/grade, /api/run, /api/mentor, /api/agent/plan, /api/agent/approve。
学习事件只通过原 learning-store.js 的 loadLearning/recordQuestionAttempt/recordHypothesis/getReviewTasks/decideMisconception/exportLearning/clearLearning 操作，旧数据结构不改。
BYOK 原版对话模块按需加载，用户未授权不能调用真实收费 AI。

## 发布安全闸门
先于 little-works/ai-academy-v4/ 独立实验，检查 320/390/768/1440、Edge/WebKit、实际学习端到端、键盘和触控、导航稳定/不闪旧版、截图互检。未达标不得修改比赛入口路由。测试记录包含真实未通过项；iPhone Safari 真机没有实测时标为 UNVERIFIED。
