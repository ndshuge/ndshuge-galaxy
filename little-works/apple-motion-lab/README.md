# Apple Motion Lab｜原生级交互实验室

这是独立的 Apple Music 风格交互研究网页；不是 Apple 官方或关联产品。

打开后点击“开始聆听”展开全屏。从屏幕顶部把手或唱片向下拖动收起；迷你播放器向上拖动展开。支持手指 1:1 跟随、释放速度接续、回弹途中重新反向拖动、底部玻璃导航、播放暂停、切曲、进度、音量和 L2 GPU / L1 省电切换。示范声音由 Web Audio 在本机合成，不包含商业录音或音乐服务。

## 技术与复用
- liquidglass.dev Skill 的原始折射引擎：lib/liquid-glass.js、lib/components.js、lib/glass-webgl.js，直接导入。唱片 WebGL 真实像素重采样；导航 lg-navbar 与 lg-segmented 是直接实例化的已提供 Web Components。
- Motion 14.7.1：本地 vendor/motion.js；MotionValue + animate spring，手势打断从当前画面接续，非 CSS keyframes 假运动。
- Apple Liquid Glass Skill 的 lib/apple-tokens.css 直接复用；App shell 与手势规范参与页面设计。
- Design Taste Frontend Skill 的浏览器 inspect.mjs 运行记录在 evidence/taste-inspect/report.json。
- HTML/CSS、共享播放器的插值布局、Pointer Events 手势桥和 Web Audio 合成为本项目自写。它们不是 Skill 包中现成的音乐播放器。

## 复验与已知限制
从仓库根目录运行 python -m http.server 5219，再访问 http://127.0.0.1:5219/little-works/apple-motion-lab/ 。
Windows Edge Chromium 在 1440px、390px 和 320px 下的交互测试见 evidence/qa-report.json，实际截图见 evidence 文件夹。
Chromium 模拟手指不等同 iPhone Safari 真机；Safari/Firefox 同步渲染未实测。低性能 GPU 或长时间播放仍可能有能耗与帧率成本；WebGL 折射为网页重采样，不是 Apple 原生系统 Liquid Glass。VoiceOver、复杂音频服务、跨设备同步未提供。
许可与来源见 THIRD_PARTY_NOTICES.md。
