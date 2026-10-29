# GameVerse · Apple Web UI 实施与视觉验收

日期：2026-10-29。目标：`little-works/gameverse/`，保留原有 16 款原创网页游戏及其原始网址，不复制参考图中的商业游戏封面或模拟好友、成就云端数据。

## 已检查的真实资料
- 用户提供的 macOS / iPhone GameVerse 参考：桌面左侧导航 + 中部精选与继续游戏 + 右侧信息，手机顶部快捷分类 + 沉浸式精选 + 横向游戏卡 + 底部悬浮导航。
- 现有初版实机前图：`qa-desktop-start.png`、`qa-mobile-start.png`。三处可见不足：深色科技仪表盘而非明亮沉浸窗口、首页首屏缺乏游戏库图墙、移动端缺少参考顶部快速导航与全局自然氛围。
- Apple Web Design / SHUGE Apple Design / frontend-dual-source / liquid-glass-web Skills 已读取并实际用于结构和材质决策。Taste-Skill consumer-app draw 已执行，但其海报式落地页布局不适合游戏库，未照搬。
- Designeer resources、inspiration 页面通过本机无头浏览器打开；未完成两项独立原始案例实证，不计作完整 Design Source 双源 PASS。
- 实际游戏封面仍为仓库原 SVG，未使用商业品牌受保护作品替代。

## 实际代码变更
- `index.html`：新增桌面搜索、iOS 式顶部分类导航、手机/电脑公共内容入口及游戏库预览容器。
- `premium.css`：已有并行施工产生的白色蓝紫玻璃窗口、游戏信息和进度结构的样式，在项目中保留并经人工复查。
- `reference-fidelity.css`：参考图对齐，修复桌面三栏和手机布局顺序、横向继续游戏卡、山景氛围、多端层级、对比度和减少动态／透明度降级。
- `polish.js`：从真实游戏数据形成图库缩略图，使用真实 URL 到详情／游戏页；并完善触控按下、抬起及取消状态。
- `glass-motion.js`：沿用已安装的真实 `createGlass` + `createSpring` 源引擎；Chromium 背景导航使用 `mode:backdrop`，不能断言 iOS Safari 达到相同背景折射，需真机检查。
- `app.js`：兼容可选右侧每日推荐被新结构取代的情况，避免旧 selector 报错中止全部初始化。
- 山景 `assets/alpine-atmosphere.jpg` 源自 Unsplash 图片 CDN `https://images.unsplash.com/photo-1506905925346-21bda4d32df4`；项目自有网页使用。其它外部资源来源需要发布前独立确认。

## 浏览器结果
- Windows Edge 无头 / Playwright，320、390、768、1440、1920 宽度：67/67 功能检查通过，JavaScript runtime error 0，项目内部 4xx 0，横向 overflow 0。
- 操作验证含精选轮播、移动滑动切换、游戏库 16 款、分类和搜索、详情弹层、收藏 localStorage 持久化、iframe 游戏入口、Escape 关闭、深浅色保存及最近玩过。
- 真实截图：`qa-desktop-v4.png`、`qa-mobile-v4.png`；和参考进行目视比对，桌面三栏 + 手机双层导航 + 精选横幅 + 内容卡片已经实现。现有 16 款原创游戏与参考中的商业游戏不是同一内容，无法做到图像像素一模一样。
- 并未在实体 iPhone Safari / Mac Safari 实测 120 Hz、背景精确折射、真实手指长按性能；**用户视觉认可仍待确认**。

## 发布注意
- 拒绝 force push；仅通过当前分支集成并以 fast-forward 方式更新既有 GitHub Pages。
- 不要提交 QA 实机 PNG 的多个临时版本、临时施工脚本或其它项目更改。并行工作区文件不得无核验地覆盖。

## 补充验收与防回退集成（2026-10-29）
- 基线：已通过 `git-safe-https.ps1 -Action Fetch` 验证 GitHub HTTPS，并以线上最新提交 `1a7398a` 建立独立集成工作树；没有直接覆盖仍在施工的其他工作树或修改任何其他小东西目录。
- 本轮只做增量修复：桌面侧栏增加可见的外观切换；手机搜索浮层增加 44px 级别的退出按钮，避免覆盖右上角主题控件后无法通过触摸关闭；保留原主题/搜索/游戏数据处理。
- Edge 无头 + Playwright 核对 320 / 390 / 768 / 1440 宽度，**118 项交互与响应式检查 PASS**：无 JavaScript runtime error、无站点内资源 4xx、无水平溢出、英雄区/继续游玩/图库顺序正确、收藏与最近玩过持久化、搜索浮层可退出、浅深主题可切换。
- 比对截图：`qa-final-desktop.png`、`qa-final-mobile.png`（本地 QA 证据，不提交图片）。移动端 390px 已观察到 SVG backdrop 光学位移滤镜；浏览器可能降级为 backdrop blur，不能承诺所有浏览器都原生折射。
- **限制：** 未完成实体 iPhone Safari 的真实触控与帧率测试，也未进行独立的 Designeer 两项原始案例复核；视觉审美是否完全符合参考仍由用户最终确认（ART_APPROVED=false）。

## Apple Dock 长按与并行发布增量（2026-10-29，独立集成）
- **基线与变更范围**：从远端最新的 `81f5886` 建立独立集成工作树，只修改 `glass-motion.js`、`index.html`、`reference-fidelity.css` 和本审计；保留原本的搜索退出、桌面主题、全部游戏与其它项目。未复制旧版网页覆盖远端。
- **Skill 与原站参考**：复用已加载 Apple Web Design 与 Product Design image-to-code 方法；2026-10-29 经后台 Edge 实际读取 Designeer 的 resources / inspiration 完整渲染目录，并打开 https://motion.dev/ 与 https://base-ui.com/ 的原站内容。参考前者的可中断弹簧与原生指针状态，拒绝为现有原生 JS 项目装入后者的 React 控件。此轮没有重跑 Taste 方向生成器，亦不将资料读取冒充产品审美通过。
- **实际实现**：移动底部折射镜片 `#tabLens` 在 pointerdown / 持续按住 / pointerup / pointercancel 和键盘按下时按物理弹簧压缩、恢复；命中范围 `.mobile-tab` 坚持固定不动；prefers-reduced-motion 降级为无形变。手机顶栏改为真实 SVG 图标加简洁标签，维持现有分类操作。
- **功能实测**：在全新隔离 HTTP 地址 `127.0.0.1:5877` 实际加载该合并版。Edge / Playwright 320、390、768、1440 宽度 **118 assertions PASS**；包括 16 款游戏、搜索退出、筛选、收藏、主题、iframe 启动、实际本地状态及有序展示。无页面 JS 错误、站内 4xx 或水平溢出。
- **动效专项**：正常模式与减少动态两组测试共 **22 assertions PASS**；按住约 210ms，真实光学镜片形变 scaleX≈1.117 / scaleY≈0.903，松开 450ms 后回到 1/1；取消后同样恢复；标签命中矩形在整个按压周期完全相等，减少动态模式无形变。检查了浏览器 computed backdrop SVG filter 状态。具体脚本、截图保存在隔离本机验收目录，临时证据不并入发布资源。
- **限制**：Safari 背景折射存在 WebKit CSS frosted 降级；尚未用真实 iPhone Safari 测试连续长按流畅度，也没有用户艺术验收。**WEB_FUNCTIONAL_PASS=true；ART_APPROVED=false**，不能称与苹果原生系统液态玻璃完全相同。
