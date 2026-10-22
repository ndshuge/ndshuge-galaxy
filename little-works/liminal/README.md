# LIMINAL · 引力边界

原创程序化 WebGL 2 宇宙交互作品，发布于鼠哥星系 → 小作品（2026-10-22）。

- 在线入口：`https://ndshuge.github.io/ndshuge-galaxy/little-works/liminal/`
- 核心场景：事件视界 / 星云之海 / 超光速航行。
- 交互：拖动旋转、滚轮与双指缩放、章节选择、时间流速、暂停、声音、全屏与留影。
- 兼容：支持 WebGL 2 的桌面和手机浏览器；WebGL 不可用时提供静态提示；尊重减少动态效果偏好。
- 技术：原生 HTML/CSS/JS + 独立 GLSL shader，无外部运行时、字体、图片或网络 API。
- 性能：动态分辨率调整；切换标签页暂停绘制；手机降低采样质量。
- 科学说明：艺术化模拟，不用于天文测量。

## 本地运行

在本目录启动任意静态 HTTP 服务器即可，例如 `python -m http.server 8000`，然后打开 `http://localhost:8000/`。

## 质量核验

原 Codex VM/模拟 WebGL 行为测试 15/15 通过；另在本机 Edge 无头模式验证 WebGL 2 实际初始化及界面 DOM。模拟测试不代替所有实际手机/显卡测试。

参考与归属详见 [CREDITS.md](./CREDITS.md)。
