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

## 限制与发布边界
- iPhone 真机 Safari 和 Firefox 尚未独立逐项检查；用户视觉认可仍待确认。
- 导入的文件只在本次页面会话存在，刷新不自动恢复。
- 请勿将运行中的测试通过当作 Apple 原生效果 1:1 等效。
