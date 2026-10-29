# 视觉审查与实际交互验收｜折光档案

## 独立工程

- 路径：`E:\CHATGPT\projects\light-paper-time-20261029\little-works\light-paper-time`
- 基于其他人仍在写入的星系主站建立 **独立 Git worktree**，未修改原仓库其他作品路径。
- 既有「小东西」按 `little-works/catalog.json` 动态登记。本站路径指定为 `little-works/light-paper-time/`。
- 目标设备：桌面 Edge 1440×900、768×1024；移动仿真 Edge 390×844、320×700。移动仿真不是 iPhone Safari 真机。

## 第一轮视觉审查（实拍，非代码评分）

证据：`evidence/design-before-desktop.png`、`evidence/design-before-mobile.png`。

1. 首页画面有独立的出版物排版语言，右半幅为实际摄影而不是合成渐变；放大中文题字与不对称页边形成记忆主题的作品身份。
2. 手机在 390px 重排为纵向题字 → 叙事文字 → 摄影的顺序；不是把双栏简单缩到手机。题字未越过视口。
3. 第一轮测试发现外部 Google Fonts 的加载连接失败，以及 favicon 缺失产生控制台 404。调整为系统字库中文衬线回退，并内嵌网站图标，去除首屏对外部服务的依赖。
4. 初版 PPT 为 3 页 1920×1080 PNG 全出血；优化后依然有 PNG 级画面预览源图，网页预览换 WebP，PowerPoint 媒体替换为高品质 JPEG，约从 1.29MB 缩为 0.56MB。
5. 有意没有引入 AI 常见的星芒、发光按钮、三列卡片和装饰性数据标签；只在光厅使用被光学效果真实改变的视觉文字。

## 第二轮视觉与交互审查（实际 Edge 截图 + pointer/touch）

证据：`evidence/desktop-opening.png`、`evidence/mobile-opening.png`、`evidence/desktop-refraction.png`、`evidence/mobile-refraction.png`、`evidence/desktop-time.png`、`evidence/mobile-time.png`、`qa/browser-qa.json`。

1. 光厅截图确认：透镜在两个汉字之间移动后，内部笔画实际弯曲、边缘产生红/蓝分离；不是模糊。桌面与 390px 视口均执行了按下→拖动→释放→回弹→复位测试。
2. 时间厅截图确认：动态纸张方片、27 条随进度变化的抽象轨迹和叙事文字共同构成空间。拖动时间轴到 75% 显示第 4 段文字；播放可前进，暂停可立即中断。
3. 移动版纸厅留白、摄影裁切与文字阅读宽度单独处理；移动版展册采用可触摸的横向翻阅，而不是三列卡片压缩。
4. 移动版时间厅「重新开始」会布局到控制器第二行，保留充足触达区域；属于当前保留的设计决定，后续实体设备可再评价手感。
5. 对装饰性标签进行审视：保留画作编号、真实玩法提示、下载格式与摄影署名，它们有实际用途，不加入虚假的系统指标。

## 自动化验收及边界

- `node tests/browser-qa.cjs`：真实 Edge/Chromium CDP 浏览器，检查源码/图片/PPT 资源 HTTP 200、WebGL 启用、指针移动与弹簧按压回弹、复位、时间进度与播放暂停、文档宽度、JS 控制台。
- `python -X utf8 build.py`：素材存在性、PPTX ZIP CRC、恰好三张真实幻灯片、三张图片媒体、全部部署文件可复制。
- 适配 `prefers-reduced-motion`：WebGL 光厅进入非动画可读回退，状态文案明确标识，不会冒充光学效果。
- 未开展：真实 iPhone Safari GPU 折射稳定性、真实 Android 触摸和完整屏幕阅读器流程；尚不能宣称在所有设备稳定 60fps。
- 测试输出有效性须与 `qa/browser-qa.json` 当次结果匹配；历史快照不能代替当前发布的复核。
