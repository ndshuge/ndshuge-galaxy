# SHUGE Arcade · 小东西游戏库

位于 `little-works/arcade-library/` 的独立静态网页作品；在 `little-works/catalog.json` 中注册。

## 功能

- 16 款已存在的原创网页游戏入口，链接到 `ndshuge-game/games/<slug>/`；没有复制或改写原游戏。
- 精选游戏展区、分类浏览、文本搜索、详情弹层、收藏与最近游玩记录。
- 收藏和最近游玩仅存储在当前浏览器的 localStorage，不上传服务器。
- 桌面、平板、390px/320px 手机响应布局；键盘快捷键 `/` 搜索，`Esc` 关闭弹层。
- 16 张新绘制的 SVG 封面由 `generate_art.py` 生成，不涉及抓取第三方游戏画面或未经授权素材。
- Apple-inspired 的内容优先构图，冷灰白背景、清晰层级、封面与艺术内容承载色彩，悬浮导航/详情用于 L1 毛玻璃。**不是** Apple 原生 Liquid Glass L2 折射。

## 设计来源

- 已读取原生安装的 Apple Web Design、Apple Liquid Glass、Design Taste Frontend、Frontend Dual Source、Motion 设计规范。
- 用 Taste 的 `draw.mjs --app --kind creator` 抽取 `accent-ladder` 方案，保留「界面收敛、素材承载色彩、重点动作清晰」的结构原则；Apple 字体优先 SF/PingFang，而不是抽取的 DM Sans。
- 在 Designeer 的 Resources / Inspiration 目录查看了 Motion、Base UI 条目并打开其原出版页面：采用易中断的自然转场、键盘可用的弹层交互思想；**未引入** React/Motion/Base UI 依赖（静态原生 JS 已满足需求）。
- 没有抄袭 Apple 原始素材或游戏封面。

## 验证与限制（2026-10-28）

- `node --check little-works/arcade-library/app.js`：通过。
- SVG XML 解析：16/16 通过；`little-works/catalog.json` 记录：单独新增 1 项。
- 原游戏地址 HTTP HEAD：16/16 返回 200，**不**代表游戏内部性能或每种设备的操作已测试。
- 本地 Chromium 头less 截图：1440×900、390×844、320×750，已人工视觉检查；视觉迭代修正了对比度、辅助字体尺寸、首屏空间。
- Taste `inspect.mjs --app` 仍可能对媒体内容的可读性遮罩、系统字体、收藏圆形操作控件判规则问题：这些是已评估的产品特定选择，不宣称 inspector 完全通过。
- Mice Hole 浏览器对该页面没有 click 权限，实际点击/触控自动化未做；真实 iPhone Safari 尚未实测。

## 发布安全

此作品仅添加 `little-works/arcade-library/` 和修改 `little-works/catalog.json`。保留所有现有小东西的功能、文件和目录，禁止强推或覆盖历史版本。
