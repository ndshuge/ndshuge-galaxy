# 折光档案｜Light, Paper & Time

一件由观众参与完成的数字展览作品。三个展厅彼此关联：纸接受光，光改变所见，时间让这一切留下痕迹。

## 展厅与操作

- **纸 · Paper**：非对称编辑式影像叙事，桌面与手机分别编排。摄影素材储存为项目本地资产，不依赖外部图片 CDN。
- **光 · Light**：WebGL 纹理采样实时光学位移。拖动透镜让汉字与摄影的纹理在透镜边缘弯曲；按住会形变，松开使用二阶弹簧积分回归。点击「让光归位」复位；键盘聚焦展厅后可用方向键。光学算法在 `experience.js` 的 `fragment` shader，使用红蓝分离边缘采样；不是 CSS `backdrop-filter: blur()` 假装折射。
- **时间 · Time**：27 条不同相位的轨迹与半透明纸张在 Canvas 中随故事进度连续变化；滚动位置影响时间，播放、暂停、拖动时间轴、重播均能改变实际进度。Canvas 不直接控制 CSS 文案元素；两套动画分别拥有各自元素，避免控制权冲突。
- **展册**：三页 16:9 **图片式**幻灯片。每页对应一张 1920×1080 画面；由 `make_deck.py` 用 Pillow 制作，再通过本机 PowerPoint COM 将 JPEG 作为全出血图片置入真实 `.pptx`，图像预览使用 WebP。明确 **不是**可逐字编辑的文本框型 PPT。

## 运行和构建

在本目录执行：

```powershell
python -m http.server 5277 --bind 127.0.0.1
# 浏览器访问 http://127.0.0.1:5277/
node tests/browser-qa.cjs    # 需 Microsoft Edge, CDP 端口 53174，服务已启动
python -X utf8 build.py      # 验证所有资产和 PPTX 结构，并生成 dist/
```

网站无 Web 框架、无需打包器；无需外部 JS 包，不会因未加载 CDN 组件而失效。字体系统优先采用本机宋体与系统中文衬线回退。

### 降级、能力边界与访问性

- `WebGL` 不可用或 `prefers-reduced-motion: reduce` 时使用仍可阅读的静态展厅，并以状态文本明确告知；不会把背景模糊冒充光学位移。
- WebGL 使用最大设备像素比 1.5（手机 1.35），WebGL 上下文丢失触发回退，只有光厅可见时持续绘制。
- 透镜的视觉形状由 pointer 事件和 sub-stepped 弹簧唯一控制；用户可随时反向拖动中断其运动。
- 时间厅在未显示时不绘制动画；时间轴原生 range 支持键盘；全站焦点标记与跳转主内容链接。
- **仅 Windows Edge / 仿移动视口验证**；尚未在 iPhone 真机 Safari、Android 设备、屏幕阅读器全面测验。设备像素比与浏览器 GPU 差异可能影响折射质量和帧率。

## 素材记录

- 光透过玻璃摄影：Pexels photo 6387819, Jill Burrow；来源 `https://www.pexels.com/photo/water-glass-shadow-on-white-table-in-bright-sunlight-6387819/`。
- 纸卡摄影：Pexels 11417939。
- 书本与光摄影：Pexels 23021413。
- 艺术幻灯片图形与时间轨迹由项目脚本原创合成。影像仅在本件作品使用；版权依原始图片许可。

## 设计与真实运行记录

- ChatGPT 原生插件 Skills **已读取指导**：Taste-Skill、Frontend Dual-Source、Liquid Glass Web、Motion、Prism、SHUGE 前端方向、Publication Studio PPT director、Writing Director。前端具体使用的是**原创 WebGL fragment shader 和原生 Canvas/DOM/CSS**，并非引入或调用上述 Liquid Glass 引擎或 Motion 包。
- 实际执行：本机 `draw.mjs --sector culture` 产生并比较艺术方向，选取编辑叙事、影像与标题关系；PowerPoint COM 16.0 实际生成 3 页 PPTX；实际调用 Windows Edge CDP、浏览器截图、pointer/touch、下载链接与控制台测试；实际运行 `build.py`。
- `ppt_os.py route` 被调用只完成工作流识别，**它没有生成 PPTX**，不能将该命令算作 PPT 引擎产出。
- 生产页面无对第三方 npm 动效组件的运行依赖。
- 对照与功能检查数据：`evidence/` 截图、`qa/browser-qa.json`、`qa/design-audit.md`。
