# Liquid Glass Lab / SHUGE Arcade

这是一个独立的光学折射实验页。最初在本机独立分支完成测试，随后经用户授权发布到「小东西」；主游戏库仅新增入口，原有游戏功能保持不变。

## 2026-10-28 移动端性能优化

- 根因：原先在浏览器里执行三通道 SVG `feDisplacementMap`、高分辨率位移贴图、每次拖动的 `left/top` 布局更新，以及按下时的透镜形状重算；与 Apple 系统原生 GPU 管线不同。
- **保留 Skill 原版引擎**，不修改 `liquid-glass.js` 或 `components.js`。只从实验页调用引擎已支持的 `mapScale` / `chroma` 参数。
- 触屏与窄屏默认 `mapScale:1, chroma:0`，从三个色散采样通道压缩为一条真正的光学位移通道；高 DPR 下贴图生成像素量约减少至原来的四分之一。桌面 `mapScale:1.25, chroma:0.08`。
- 拖动改为 `translate3d()` + `requestAnimationFrame` 合并事件，降低布局更新频率；手指按住时保留 CSS 即时反馈，避免每次触摸按压都重新生成滤镜贴图。独立的“按压反馈”演示按钮依然保留一次光学形变。
- Chromium 回归：17/17 项功能断言通过，另有真实指针拖动和降低透明度模式通过、运行错误为零；截图检查移动/桌面视觉仍有 L2 折射。
- **未取得真实 iPhone Safari 帧率数据**。无头 Chromium 下帧率不等于手机上的实际 60/120 FPS，不宣称已达到 Apple 原生流畅度；若仍卡，需要进一步在 Safari 真机 Profile 并考虑只在静止时开启高阶折射或改用 GPU Shader。

## 本次实装

- 项目地址：`little-works/arcade-library/glass-lab.html`
- 从用户安装的原生 `liquid-glass-web` Skill **完整复制** `assets/liquid-glass.js` 和 `assets/components.js` 至 `glasslib/`，避免重写引擎。
- 复用现有的 `art/lumen-siege.svg` 游戏原画作背景。通过 `lg-panel backdrop="#stageArt"` 使用 **模式 C：已知背景的对齐副本**，用 SVG `feDisplacementMap` 折射其像素，而非 CSS-only blur。
- 面板支持指针/触摸拖动、键盘方向键移动、折射强度 4–42px、按压缩放的玻璃形变、重置位置。
- L0：实色；L1：CSS `backdrop-filter: blur()`；L2：折射 + 色散 + 高光。三个模式可立即切换，方便 A/B 对照。
- 支持 `prefers-reduced-motion`、`prefers-reduced-transparency`、`prefers-contrast: more`，避免强制高 GPU 负载。
- 本次没有开启整个游戏库的玻璃效果；只实现了可独立验收的玻璃组件。

## 验收

- Windows Chromium/Blink：17/17 项页面行为检查通过，包括 L2 SVG filter 链、已知背景副本、L0/L1/L2 状态、refraction slider、位置更改和重置、模拟按压、320/390/768/1440px 横向溢出、脚本异常检查。
- 真实 CDP 鼠标拖动：由 (42,230) 移动到 (77,200) 并正常释放，`filter: url(#lg1-v8)` 随位置刷新，无脚本异常。
- 模拟系统降低透明度：匹配到媒体查询时，玻璃折射层 `display:none`，不透明背景 `rgb(35,59,76)` 生效。
- Windows 上未运行 Safari/WebKit；Skill 声称的 WebKit/Firefox 支持**未由本次独立验证**。
- 截图保存在工作区根目录：`compare-l0-mobile.png`、`compare-l1-mobile.png`、`compare-l2-mobile.png`、`compare-l2-moved.png`、`glass-desktop.png`、`glass-mobile.png`。
- 实验用本机 Python 静态服务器端口 `8143`，预览地址：`http://127.0.0.1:8143/little-works/arcade-library/glass-lab.html`。

## 技术限制

- 网页的 L2 光学折射不是 Apple 原生 `glassEffect`，尤其悬浮于未知 DOM 背景上的系统级玻璃无法保证 Safari 同等折射，可能需要退化为 L1。
- 本实验已知背景是单张 SVG 插画，复制的是这张图像，而不是游戏画面上层的全部动态 DOM。
- 实验页未嵌入现有游戏库导航/详情。达到视觉要求并完成真机验收后再考虑渐进接入。
