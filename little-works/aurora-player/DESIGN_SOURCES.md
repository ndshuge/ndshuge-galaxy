# 澄音 · Apple 风格音乐播放器 — 设计和验收

本机项目 little-works/aurora-player/，并登记于 little-works/catalog.json。

## 参考与设计选择
- Apple Web Design OS：Immersive 模式。以原创月色专辑封面为主视觉；悬浮播放器控制条采用半透明材质；正文保持清晰。
- Taste-Skill：实际调用 design-taste-frontend/scripts/draw.mjs --app --kind creator --options 3，检视 accent-ladder / editorial-greeting / true-black-flat。采用内容主导层次和克制导航；不照搬通用纯黑仪表板配色。
- Designeer：实际访问 https://designeer.xyz/resources/motion-primitives 、https://designeer.xyz/resources/utopia 、https://designeer.xyz/inspiration ，及原站 https://motion-primitives.com/ 。采用短时动效与自适应字号的原则，未下载第三方 UI 素材。
- 光学：包含 MIT 授权的 liquid-glass.js / createGlass；图像有 SVG feDisplacementMap 备用真实像素位移，非仅 backdrop-filter。此实现不代表 Apple 官方原生 Liquid Glass。
- 资源：封面由本工程原创 SVG 绘制，三首试听音频由本机 FFmpeg 合成。用户音频以 Object URL 本地读取，不上传。

## 施工与缺陷回归
- 主要构图：左侧精简导航 → 大封面/曲名 → 下一首队列 → 底部始终可见的玻璃播放 Dock；手机端重新布局为纵向内容和悬浮控制区。
- 首轮本地 Python server 返回空响应，改为 Node HTTP server 进行真实截图。
- 真实音频进度拖动的首次自动化失败，原因是 QA HTTP 服务器不支持 Range；新增音频分段响应后复测成功。
- 原 createGlass 映射在部分 Edge 启动时未及时生效，增加 SVG feDisplacementMap 备用；保留 reduced-transparency 回退。
- 视觉截图：qa-desktop.png、qa-mobile.png、qa-edge-320.png、qa-edge-390.png、qa-edge-768.png、qa-edge-1440.png；实际检查了桌面和手机屏幕。
- 自动化：node little-works/aurora-player/browser-qa.cjs PASS，四档 320/390/768/1440，实音播放、进度、上一首/下一首、收藏、歌词、列表、随机循环、文件导入、SVG 位移、减少动态/透明度和零 JS 异常。

## 2026-10-26 用户反馈后的材料与动效重构
- **截图诊断**：iPhone 实拍显示早期 Dock 只有高斯毛玻璃和简单的泛光；背景过暗，缺少有内容可弯折的光学层；播放按钮按下与松开几乎没有可感知的物理时间变化。主结构保持，但不能以此前的 SVG 封面滤镜冒称「播放器 Dock 已实现液态玻璃」。
- **实施**：新增 `liquid-surface.js`（WebGL1）与 `optics-v2.css`，给底部悬浮 Dock 绘制低频的专辑调色板光场，加入专辑封面 SVG 作为实际的 WebGL 纹理样本，用扰动采样、细微 RGB 色散和 Fresnel 式边缘高光绘制玻璃材质。控制按钮仍为原生 HTML 元素，GPU Canvas 不响应鼠标、触摸事件。此方案**折射自带的专辑/氛围纹理**，不是对任意页面背景 DOM 的完整透视光线折射；不可声称与 Apple 原生 Liquid Glass 等效。
- **真实弹性**：有速度、阻尼、目标和逐帧积分的物理弹簧。根据按压位置平滑移动光学透镜；释放后自然衰减。修复验收发现的过度反向弹性，使用接近临界阻尼 92/19.5。光学覆盖层持续约 400ms 可见反馈，最后干净归零；控件命中区域不改变，禁止整体缩放。
- **效率**：静止时降到约 12fps，音乐播放时约 28fps，交互期间可达 60fps；Canvas 最大像素比 1.8。尊重 `prefers-reduced-motion` 并禁用指针弹性；`prefers-reduced-transparency` / 增强对比度使用不透明材料，WebGL 不可用则退回 CSS 材质。
- **视觉回看**：先后检查 `qa-before-glass-upgrade-390.png`、`qa-glass-v2-390.png`、`qa-glass-v2-1440.png`、`qa-glass-v3-390.png`，判定初次光带稍显霓虹，之后降低流光亮度和收窄高光，加入更柔和的专辑纹理折射。按压和释放 `qa-edge-390-pressed.png`、`qa-edge-390-released-400ms.png`、`qa-edge-390-idle-after.png` 实际查看。
- **专项自动化**：`AURORA_MOTION_ONLY=1 node little-works/aurora-player/browser-qa.cjs` 检验真实 WebGL、封面纹理、SVG 封面滤镜、玻璃变形、400ms 后持续反馈、完全复位、按钮目标尺寸与位置不变；`node little-works/aurora-player/browser-qa.cjs` 则完整复测四档响应式与真实音频、导入等原有功能。技术通过不等于用户视觉审美认可。
- **仍待独立核查**：真实 iPhone Safari 的 WebGL 细节、性能/降级与动画触觉感受；网页无法获取 Apple 原生平台 Liquid Glass 的专有材质渲染器。

## 限制与发布边界
- iPhone 真机 Safari 和 Firefox 尚未独立逐项检查；用户视觉认可仍待确认。
- 导入的文件只在本次页面会话存在，刷新不自动恢复。
- 请勿将运行中的测试通过当作 Apple 原生效果 1:1 等效。
