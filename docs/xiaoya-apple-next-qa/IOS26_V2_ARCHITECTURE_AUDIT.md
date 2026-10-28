# 小芽 LifeLab Apple 版 · iOS 26 Shell v2 施工与验收

日期：2026-10-28｜作用范围：`little-works/xiaoya-apple/` + 本文件所属 QA 目录。工程：`E:\CHATGPT\work\xiaoya-ios-shell-v2-20261028`；基线：`f4c1191`。

## 1. 截图诊断：修复用户 iPhone 网页悬空导航

用户真实 iPhone 截图明确呈现：六入口标签栏悬浮在内容中部偏高，正在遮挡进度卡；上方长文案与卡片堆叠，正文尾部留白不符合真实安全区。

实查代码确有冲突：`organized-settings.css` 将 `.mobile-tabs` 强制上移 `76px + env(safe-area-inset-bottom)`，同时 `apple-next.css`、`comparison.css`、`native-experience.css` 各自重复覆盖；`.content-grid` 存在 240px 额外 padding。前版缺少明确的统一底部导航契约。

**新架构**：五个主 tab，设置固定放在顶部；导航统一 `bottom:calc(8px + env(safe-area-inset-bottom))` 和 68px 高；正文有一次且仅一次的 94px 底部安全预留；向下滚动折叠为右下 63px 小按钮，反向滚动恢复。没有删除业务记录或导航路径。

## 2. 产品信息架构

- **今天**：品牌情绪主标题 + 实时任务与课程（合并单层分组）→ 小芽引导 → 今日建议 → 分析与审批 → 实绩汇总。真实渲染 `#today-tasks` / `#today-schedule` 均沿用原模块。
- **课表**：独立日期导航/周次、课程和活动编辑、冲突检测、CSV/ICS 导入保持；统一时间与事件分组视觉。
- **事项**：新建主要行动置顶；快捷记录改原生 `details` 按需展开；筛选器直接沿用 Skill `lg-segmented` 折射与 spring，任务和考试列表仍由 `app.js` 原代码更新。
- **成长**：目标列表、真实规则生成、真实 AI（需授权）与用户批准保持；AI 能力状态解释移入可展开分组，不再空占一整屏。原来 `xiaoya-chat.css` 将 `#ai-mode-dashboard` 隐藏，新结构只在用户主动展开时显示。
- **复盘**：记录与统计维持真实数据来源，统一无阴影结构与表格可读性。
- **设置**：移动端独立右上角按钮；学期、提醒、BYOK、备份、撤销和版本对照仍可访问；API Key 始终为密码输入框。
- **桌宠**：使用原本地品牌素材与拖动位置逻辑，不添加伪 AI 感知。

## 3. 动效/手势契约与真实复用

| 体验 | 实施位置 | 事实 |
| --- | --- | --- |
| Liquid Glass 选中与光学折射 | 保留 `apple-next.js` + `glass/liquid-glass.js`、`glass/components.js` | 原 Skill `createGlass` / `createSpring` 真实运行；WebKit `content-refraction`，Blink `refraction` |
| 标签跟手拖动 | `ios26-v2.js` | Touch pointermove 直接驱动已有指示器，松手通过原 `OPC_TEST.navigate` 修改当前页；离散点击不被阻塞 |
| 向下收起、向上展开 | `ios26-v2.js` | requestAnimationFrame + 方向阈值；最小按钮可再次展开，避免抢占内容与挡住尾项 |
| 页面切换 | `native-experience.js` 与 `ios26-v2.js` | 放弃整页 View Transition 快照（实测会形成重影），改用即时业务状态 + 可中断的局部 WAAPI |
| 任务/建议 → 模态详情 | `native-experience.js` + `ios26-v2.js` | 已有 FLIP 几何进场；退出按真实来源矩形逆向缩放，原始关闭事件仍真正执行 |
| Sheet 下滑 | `ios26-v2.js` | 仅在头部捕获手势，距离/速度阈值区分取消与真正关闭；不捕获表单内纵向滚动；回弹复用原 Skill 的 `createSpring` |
| 键盘适配 | `ios26-v2.js` | 视觉视口收缩且输入框聚焦时隐藏导航，让输入与提交按钮保持触达 |
| 减少动效、减少透明度 | `ios26-v2.css/js` | 尊重用户/系统配置；没有用无效 CSS 模拟真的 GPU 折射 |

## 4. Skill 实际使用审计

- Apple Web Design / Apple Liquid Glass：完整规范、`interaction-materials.md`、`motion.md`；材料层次只在导航/Sheet 采用玻璃；内容列表高对比不使用假折射。
- Liquid Glass for the Web：**原版真实引擎已在前版集成**，本次复用而未重写；使用它的 `createSpring` 实现下拉取消回弹，保留 `lg-segmented` 和底栏玻璃滤镜。
- Motion：查阅 `best-practices/css-or-motion.md`，跨组件几何保留现有 WAAPI；不引入 React Motion 包到 vanilla HTML 工程，不虚报第三方 runtime。
- finesse：按照 `references/h5-mobile.md` + `product-ui.md` 的 App Shell 与 thumb zone 原则纠正安全区、抽屉/Sheet 层级；本网页同时支持桌面，所以没有照搬 H5“禁止缩放”的元标签。
- Taste-Skill：**实际运行**新方向 `ios26-v2-direction/direction.json`、浏览器 inspect `ios26-v2-taste/report.json`；根据审查修复正文颜色对比。现有检查器对合法玻璃阴影、首次引导遮罩的覆盖检测仍有 FAIL，不伪称视觉审计全部绿灯。
- Impeccable / Prism：参考可访问性、响应式、减少动效与性能检查方案；本轮浏览器回归脚本为真实 Playwright，并不是虚称 Prism driver 已运行。
- Frontend Dual Source：遵循根 `AGENTS.md` + `_system/FRONTEND_DUAL_SOURCE_GATE.md`；上一轮已打开 Designeer Base UI / Details 对应原网站，React 组件未机械引入。Apple 导航参照官方 WWDC25 / HIG，不复制 Apple 私有资源。

## 5. 实际测试

| 真实运行 | 结果 | 证据 |
|---|---|---|
| Edge/Chromium：320/390/768/1440 | **核心跨屏套件108/108**（与 WebKit 合计），包括导航、横向溢出、底栏定位、下拉、手势、保存和重载 | `ios26-v2-test/report.json` 与截图 |
| Windows WebKit：390/768 | **通过**；不是 iPhone Safari 真机 | 同上 |
| 440×956 大屏手机规格 | **13/13**：快捷记录、AI 分组、学期设置保存、BYOK 隐私、刷新后持久化、导航离底 8px | `ios26-v2-structure.json`，`ios26-v2-iphone-large-440.png` |
| 规则建议 → 审批 → 保存 → 撤销 | **PASS**，隔离浏览器内置合成数据，真实业务事务执行 | `ios26-v2-approval.json` |
| Edge 无头性能抽样 | 390px 常规 p95 **8.4ms**，一次 **37.5ms** 帧；1440px 常规 p95 **12.5ms**。无长任务；不等于真实 iPhone GPU/120Hz 指标 | `ios26-v2-perf.json` |
| 静态语法及业务代码 | `qa-xiaoya-apple-static.cjs`、node --check、Git diff --check 成功；原核心 JS 未改 | 可复跑命令及 Git diff |

## 6. 发布边界与剩余差距

- 业务 `app.js`、`domain.js`、`core.js`、`byok-ui.js`、`xiaoya-chat.js`、`agent-engine.js` 均未编辑；本次为 UI / 交互覆盖和节点位置调整，原 localStorage 键不改。
- 实际 Safari iPhone 真机滚动惯性/动态工具栏/触感/60–120 Hz **未验收**。Windows WebKit / CSS 模拟不等同真实设备。
- 完全复制 Apple 私有系统材质不可能通过网页实现；当前为有证据的 Web 折射与降级。没有使用真实付费 DeepSeek/兼容 API Key 做线上模型调用。
- 原有复盘数据表、课程编辑及部分设置详情仍沿用旧业务 HTML 结构，视觉已统一但未拆成 SwiftUI 原生组件。
- 用户还需要在自己的 iPhone Safari 主动判断触摸惯性及是否满意，不能据自动化结果擅自标记人类视觉认可。

## 7. 复测与回退

本地测试目录：`docs/xiaoya-apple-next-qa/ios26-v2-test`；新增脚本：`qa-ios26-v2.cjs`、`qa-ios26-v2-structure.cjs`、`qa-ios26-v2-approval.cjs`、`qa-ios26-v2-performance.cjs`。本地端口 5397 是仅为测试建立的 HTTP 服务。

版本隔离：独立 Git worktree，从 `f4c1191` 派生；只发布 `little-works/xiaoya-apple` 和专项 `docs/xiaoya-apple-next-qa`。通过正常 Git revert 回退，不强推、不覆盖其他小东西项目。
