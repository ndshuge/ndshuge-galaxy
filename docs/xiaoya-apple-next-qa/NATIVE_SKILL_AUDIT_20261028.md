# 小芽 LifeLab · Apple 版原生 Skill 深度重构审计
日期：2026-10-28。当前工程：`ndshuge/ndshuge-galaxy/little-works/xiaoya-apple/`。

## 1. 施工隔离与基线
- 精确原版：`44eff19b1d5f9aac97fa25e8b89fd554affa2375`；独立分支：`feature/xiaoya-native-deep-20261028`，工作区 `E:\CHATGPT\work\xiaoya-native-deep-20261028`。
- 只修改现有 Apple 版及 `docs/xiaoya-apple-next-qa` 专项 QA 证据。比赛源工程 `opc-agent`、Skill 版、小东西其他作品未改。
- 严禁更换原始 localStorage 键：`xiaoya-comparison:xiaoya-apple:personal:v1`、`xiaoya-comparison:xiaoya-apple:synthetic-demo:v1`、`xiaoya.comparison.xiaoya-apple.byok.credential.v1`，原业务模块 `app.js`、`domain.js`、`core.js`、`byok-ui.js`、`xiaoya-chat.js`、`agent-engine.js` 原封未改。
- 旧版可通过上述 Git commit 恢复，禁止 force push。

## 2. 真实视觉基线与缺陷
- 改造前后同一 Git 基线、相同 390px / 1440px、**关闭首次引导后**的浏览器截图：`native-compare/before-*.png` 与 `after-*.png`，覆盖今天、事项、设置、课表、成长与复盘。
- 三个主要问题：① 设计对照导航常驻顶部，占用移动端宝贵屏幕且像实验页；② 内容区大量叠卡和跨模块玻璃造成弱信息层级；③ 任务筛选只是普通 chip，详情打开缺连续位移和尺寸变化；另外原设置过重的 DOM 封装和部分样式堆叠也增加了视觉噪声。
- 新方向：小芽专属的淡鼠尾草绿 + 白纸质内容层。玻璃只用于导航/浮层；任务、课程、复盘数据保持可阅读的实面材质。Apple HIG 参考：`https://developer.apple.com/design/human-interface-guidelines/materials` 和 `https://developer.apple.com/design/human-interface-guidelines/tab-bars`。

## 3. Skill 资源 → 集成 → 运行结果

| 原生 Skill | 真正深入检查的资源 | 具体使用 / 未采用原因 | 实际核验 |
| --- | --- | --- | --- |
| Apple Web Design | 根 SKILL、页面组织、Apple HIG 与导航规范 | 以内容优先替换玻璃堆叠；保留真实品牌小芽、移动端宽度与安全区 | Chromium 320/390/768/1440 布局截图 |
| Apple Liquid Glass | `app.md`、`tokens.css`、`motion.md` | 将玻璃限定在导航和选中物上；浅色环境正确对比、减少透明度、Reduced Motion 降级 | 真实折射由下列引擎承担 |
| Liquid Glass for the Web | **实际读取** `assets/liquid-glass.js`（25 KB）、`assets/components.js`（58 KB）、`references/components.md`、`patterns.md`、`browser-quirks.md` | **直接复制原 Skill 的 components.js**，不是仿写；`lg-segmented#task-filters` 接入原 `data-filter`；复用原先来自同一 Skill 的 `glass/liquid-glass.js`、`createGlass` 与 `createSpring` 底栏 | Blink：`data-glass=refraction`，内核 `blink`；DOM SVG filter `url(#lg...)`；WebKit：`content-refraction`，三屏宽正常 |
| Design Taste Frontend | `references/app-screens.md`、`scripts/draw.mjs`、`scripts/inspect.mjs` | **真实执行**应用风格抽样：`editorial-greeting`，保留绿色品牌、避免再造 KPI 仪表盘；运行 4 屏宽 inspector 并据此调整导航渐变与主卡阴影 | `native-design-sheet/` 与 `taste-native/report.json`、原始 FAIL/WARN 不掩盖 |
| Frontend Dual Source | 原生 SKILL、`_system/FRONTEND_DUAL_SOURCE_GATE.md`；实际打开 Designeer `/resources`、`/inspiration`、单品 `/resources/base-ui`、`/inspiration/details` 和原站 base-ui.com / details.so | 从细节案例研究连续导航和分层；Base UI 需要 React，与现有 vanilla JS 不兼容，**没有复制组件或声称集成**，选择适配的原生 Web Component | 具体入口可访问；原实例参考，不冒充代码复用 |
| Motion | 根 SKILL、`best-practices/css-or-motion.md`；Apple motion.md | 过渡以可打断 Web Animations API 实现；真正物理弹簧来自 Liquid Glass Skill 内 `createSpring`。**未引入单独 Motion.js 库**，避免静态站双运行时和业务重绘冲突 | 已测连续切页、长按 >400ms 保持、释放、任务详情几何过渡；实际触摸硬件未测 |
| finesse | `references/redesign-mode.md`、`ai-console.md` | 先截图后动手；AI 聊天视觉统一为原生分组 sheet，保留未接入/成功/失败/审批语义，未更改任何 fetch 或模型返回 | 密钥 `type=password`、Provider 列表仍存在 |
| Impeccable | `reference/audit.md`、`reference/animate.md` | 逐项审视可访问性、阴影和动效；补 `prefers-reduced-motion`、可读聚焦环、radio ARIA 状态、持久按压反馈 | 四宽度无横向溢出、静态检查、控制状态回归 |
| Prism | `reference/verify.md` 和浏览器 QA 要求 | 研究 driver 的视口、减少动效、截图审计矩阵；本机缺其独立 driver 路径，改为现有 Playwright Edge + WebKit 真实脚本验证，**未声称运行 Prism driver** | 4 宽度截图、源代码可重复执行 |

## 4. 真正改动的结构
1. 持久的“原版/Apple/Skill”顶栏被移至 **设置 → 版本对照与返回小东西** 的可展开详情，原链接全部保留；不再占主界面顶部。
2. `#task-filters` 从旧普通 `div` 变成 **Skill 原版 lg-segmented Web Component**：实际弹簧选中片、光学滤镜、键盘方向键、radio 语义；继续由原 `data-filter` 逻辑驱动任务列表。
3. 首页任务/课程按语义群组组织；日程导航、成长与复盘的单层材质和字号重新校准；AI 聊天由后加浮窗视觉过渡为分组白色原生感 sheet。
4. 六页切换带可取消的 WAAPI 连续过渡；卡片 → 编辑/建议 modal 从实际源位置与尺寸进行 FLIP 过渡，动画不等待、不写入业务数据；长按状态一直保持至指针释放/取消，超出 12px 滑动自动解除。
5. 纯 CSS/JS 增强层，既有真实 AI 模型连接、用户审批、事务撤销与数据持久化的原实现保持不变。

## 5. 实际验收
| 验证 | 结果 | 文件 |
| --- | --- | --- |
| Playwright **Edge/Chromium** 320、390、768、1440 | **69 PASS / 0 FAIL**。六个核心页、筛选、长按及释放、隔离档案新增任务/持久化/标完成、BYOK 设置、没有 JS 异常或横向溢出 | `native-qa/report.json`、对应截图 |
| Playwright **WebKit** 320、390、768 | **3/3 PASS**，`content-refraction` 已运行，筛选正常，无异常 | `native-webkit/report.json` |
| 真实用户审批/可撤销事务（**浏览器隔离的内置合成演示数据**） | **PASS**：原始建议 → 弹层 → 批准 → 事务保存 → 设置内撤销，`status=undone` | `native-approval.json` |
| 现有 Apple 静态验收与 JS 语法 / diff | PASS | `qa-xiaoya-apple-static.cjs` |
| Taste 正式 inspect | 初次 **4 FAIL + 2 WARN**；其中部分是首次引导遮罩或光学玻璃特殊材质，也发现并修复较重阴影等问题。没有伪称得到绿灯 | `taste-native/report.json`、截图 |
| 原仓库全站 compare QA | Apple 和 Skill 两变体真实导航、互不污染存储通过；图库计数老测试仍报告 **27 vs 28**，不修改不相关图库以粉饰本次验收 | 测试日志（独立于 Apple 版） |
| Edge **无头**模拟流畅度 | 390 常规 p95 10.5ms；1440 常规 p95 6.1ms；1440 reduced-motion 一次 **472.8ms 单帧异常**。不能推断真机 GPU 功耗 | `native-perf.json` |

## 6. 未达到的原生差距与严肃限制
- **没有真实 iPhone Safari / 触控硬件** 验收；Windows WebKit 模拟不能代替真机。触摸热区、滚动惯性、动态岛/键盘安全区、系统 Reduced Transparency 仍需真机。
- **没有使用用户真实 API 密钥调用付费 DeepSeek/兼容模型**，因此仅证明原 AI 代码未动、BYOK 控件及规则审批/撤销通过；不能宣称真实付费模型端到端已通过。
- Blink 是适配网页的 SVG 折射实现，WebKit 是内容拷贝折射；并非 Apple 私有系统 Liquid Glass 引擎，也没有设备级 GPU profiler 结果。
- 不是所有模态关闭都具有手势可逆的共享元素退场，原有日历和成长视图仍保留部分历史 UI 结构；需后续实机动效打磨，不能宣称与 Apple 原生完全一致。
- **性能实验发现桌面 reduced-motion 有单次长帧**，需再跑实际设备检查，不得宣称任何设备恒定 60/120 FPS。
- 对于 Native Skill，实际读过的不等于实际集成；表格已将方法参考、原组件直接复用和真正运行分开记录。

## 7. 恢复与验收命令
在独立 worktree 根目录：`node qa-xiaoya-apple-static.cjs`、`node little-works/xiaoya-apple/qa-native-regression.cjs`、`node little-works/xiaoya-apple/qa-native-webkit.cjs`、`node little-works/xiaoya-apple/qa-native-approval.cjs`（启动本地 HTTP 5394 后）。
本次变更提交后，通过普通 `git revert <本次提交>` 创建回退提交，不使用 force push，也不覆盖其他作品。
