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
