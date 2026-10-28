# Apple Motion Lab R2｜视觉、光学与交互精修报告

版本：R2，基线：`d88de73`；生产仓库：`ndshuge/ndshuge-galaxy`。本报告仅陈述实际读取、修改、测试和视觉审查所得结果；**Apple 官方动画曲线没有被测得**。

## 参考来源与边界

- **用户此前上传的 Apple Music 参考视频本次不可访问**：本轮当前对话可读取的附件列表为空。无法取出其原始时间戳、帧序列、实际速度或阻尼，不得假称做过逐帧 Apple 真机视频分析。
- 实际查阅公开资料：Apple HIG「Tab bars」 https://developer.apple.com/design/human-interface-guidelines/tab-bars 、 「Materials」https://developer.apple.com/design/human-interface-guidelines/materials 、 Apple WWDC25 「Meet Liquid Glass」https://developer.apple.com/videos/play/wwdc2025/219/ 、 「Get to know the new design system」https://developer.apple.com/videos/play/wwdc2025/356/、 Apple Newsroom 2025-06 新设计介绍 https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ 。可从中确认功能层次、导航配套、内容优先、光学与克制阴影原则，但**不能推断 Apple Music 私有 spring 数值**。
- 本地 390×844、320×700、768×1024、1440×900 在 R1/R2 各取 0/25/50/75/100% 的**作品自身**归一化中间状态截图，共 40 个记录（原始全部保留本机）。这些是控制进度的状态采样，不冒充真实 Apple 视频关键帧。目录 `evidence/r2/before/`、`after/`，对照总图 `evidence/r2/r1-r2-comparison-390.png`。

## 五大问题与修改（按影响排序）

1. **半展开阶段严重穿插**：R1 50% 时封面覆盖标题、控制条透显，且 GPU 封面按错误帧尺寸被拉伸。R2 使用原有单 DOM + MotionValue 几何进度，标题在会穿插的区间交叉淡出/淡入，隐藏控制条，GPU 仅在接近端点恢复；中段显示原始清晰封面。不是重新发明 shader。
2. **玻璃层不够克制**：R1 专辑封面透镜 `refraction=21`、`chroma=.17`、`specular=.64` 偏明显。R2 降至 10/.055/.24；导航通过现成 `<lg-navbar>` 的 optics attributes 使用 refraction=10、specular=.32、bezel=.62，并减小光晕/阴影。不更换 `lib/liquid-glass.js`、`components.js`、`glass-webgl.js`。
3. **阅读层级偏营销海报**：缩小主标题、缩短文案、取消倾斜唱片与悬浮 badge、减轻页首装饰，强调音乐封面和声景列表。
4. **全屏控制区过于松散**：在 390×844 中，R1 进度条顶端 y=579px；R2 y≈479px，专辑 274px→289px；歌曲信息接近封面，保持同一视觉阅读顺序。
5. **动效尾段滞后和无意义重绘**：试验过 390/42/1 弹簧，实测展开近稳定耗时约 550ms，属于倒退；最终调至 stiffness=500、damping=41、mass=1，R2 同浏览器测得约 289ms 到 p≥.999。删除静态页面的循环式 WebGL 重绘，改为首屏、端点大小变化、指针移动和模式切换时渲染。

## 390px 几何测量（Windows Edge 视口坐标，非 Apple 参数）

| 状态 | R1 封面尺寸 | R2 封面尺寸 | R1 进度条 y | R2 进度条 y |
|---|---:|---:|---:|---:|
| 0% mini | 54×54 | 54×54 | 离屏/隐藏 | 离屏/隐藏 |
| 50% transition | 164.1×164.1 | 171.3×171.3 | 531 | 约 660（隐藏） |
| 100% full | 274.3×274.3 | 288.6×288.6 | 579 | 约 479 |

完整 5 个阶段坐标见 `evidence/r2/before/frames.json` 与 `after/frames.json`。Apple 官方对应动画阶段：**未验证**。

## 弹簧时间测量

相同 Windows Edge 390×844，本机即时打开 `p:0→1`：`motion-timing.json`。

| 进度 | R1 | 最终 R2 |
|---|---:|---:|
| 25% | 71.8 ms | 44.7 ms |
| 50% | 78.9 ms | 73.7 ms |
| 75% | 129.3 ms | 115.5 ms |
| 99% | 299.8 ms | 244.6 ms |
| ≥99.9% | 354.6 ms | 289.1 ms |

属于当前 Windows Edge 软件/环境条件下测量；样本数量为单次逐帧记录，不是统计学上的产品级延迟结论，不能称作 Apple 原生参数或 iPhone 帧率。

## 真实 Skill 深度使用

| 原生 Skill | 读取及复用 | 证据级别 |
|---|---|---|
| Apple Web Design | `skill.md`、`references/interaction-materials.md` / `visual-language.md` / `qa-scenarios.md`，用于信息优先、触控阶段/安全区及真机限制 | READ、APPLIED、截图与浏览器测验 |
| Apple Liquid Glass | `app.md`、`motion.md`、`tokens.css` 等；复用 R1 已引入的 tokens | 已集成，未另造系统材质 |
| Liquid Glass for the Web | `components.js` 的 `lg-navbar` `lg-segmented`、`glass-webgl.js` 的 `createGlassRenderer`、`liquid-glass.js` 地图缓存，refs optics/browser-quirks；R2 仅调整已有 API 参数 | **RUNNING**：WebGL 像素非零，SVG filter URL 检测，地图上传 1 次 |
| Motion | 已引入 `motion@14.7.1` 的 `animate` 和 `motionValue`，复用弹簧、反向中断；参阅 best-practices 性能规范 | **RUNNING**：70 次反向与手势验收，时间曲线 |
| Design Taste Frontend | 复用官方 `inspect.mjs` + app 审核与截图、`lint.mjs`；没有隐藏 FAIL | QA 脚本实际执行，`evidence/r2/taste/report.json` |
| finesse / Impeccable / Prism | 阅读适用示例、布局/动效/核验参考；本项目原生 ES module，不为引入 Prism 重新搭建 React/R3F/GSAP | **规范参考**，不虚构引擎已集成 |

独立执行链：ChatGPT 原生 Skills 调用读取插件 Skill 内容；Mice Hole 只负责 Windows 文件、命令、浏览器及 Git。无 Codex 或其他 Agent 代施工。

## 多轮视觉迭代记录

- **Round 0 / R1 基线**：40 张可测基线截图，五个大问题；Apple 用户原视频不可访问。
- **Round 1**：缩减营销式文案与装饰、调整封面比例/导航色层、改进标题/控制区几何；实拍后发现 25–75% 专辑封面像素拉伸，这是本轮新增缺陷。
- **Round 2**：用同源清晰封面承接变形阶段、GPU 在近端点才恢复；相同 0/25/50/75/100% 截图证实中段无明显像素花屏；发现 390/42/1 弹簧更慢且静态 GPU 重绘过多。
- **Round 3**：调至 500/41/1 并实际测得速度；删除无意义空闲 WebGL 定时绘制，保留鼠标移动与模式开关触发。R1 初期专项场景源纹理上传 31 次，R2 同脚本约 6–7 次；地图上传仍为 1 次。

## 验收和性能限制

- R2 `evidence/r2/qa-28.json`：**28/28 通过**；1440/390/320 的最初完整回归，覆盖元素、GPU 像素、导航、展开/收起、拖动、反向、降级、无横向溢出。额外 768 宽视觉截图已测。
- R2 `evidence/r2/stress-14.json`：**14/14 通过**；70 次目标反转、map 缓存、L1/L2、Web Audio 播放/暂停、按压、减少动态效果、无 WebGL 退化。
- `evidence/r2/experience-report.json`：**12/12 通过**；三种背景（高对比条纹、彩色唱片、复杂斜纹）、慢拖轨迹、快甩、长按不松、Pointer Cancel、连续切页、GPU 缓存及异常。
- Chromium 390 的 rAF 采样中位约 **4.2ms**、p95 约 **5.0ms**，运行于无屏幕同步的 Edge headless/SwiftShader，**不等于设备 FPS**。
- 单次 Chromium 长任务检测最高 p95 约 **798ms**，可能包括软件 GPU/初始化；尚未通过真实设备 trace 分离开销，**存在明显性能不确定性**。安卓、Safari、iOS 真机 120Hz、GPU 耗电、内存增长、VoiceOver、真实触觉均未验证。
- Taste App 模式仍发现 **FAIL: gradient、covered-text**，**WARN: micro-label、tiny-text、app-title-size**；音乐沉浸式背景的渐变属于设计意图，而固定浮动层对滚动文字的遮挡需要实体设备手动确认。这些不能写成视觉审核已完全通过。

## 与真实 Apple 的剩余差距

1. 苹果专有系统 Liquid Glass 的光照/材质、系统触觉、物理合成行为无法在 Web 上等价复现。
2. 用户原 Apple Music 录屏无访问权限，故**不存在**有证据的 Apple 动画逐帧误差百分比，也无合法“达到原生 95%”说法。
3. iPhone Safari 真机触摸、惯性、高刷新率与耗电未验证；高对比纹理下透射背景的整体页面可读性仍需独立优化。
4. 页面仍是 Apple Music 的探索性视觉实验，不是真正的曲库、歌词、AirPlay/Now Playing 或 Audio Session。
5. R2 为 UI 状态级重绘：`width/top/left/height` 在过渡中参与主线程布局，未建立移动 Safari Trace；桌面端 mini/nav 对底层列表的浮动遮挡尚有视觉改进空间。

## 可安全复用的模式

- 已成熟可移植：`lib/liquid-glass.js`、`lib/components.js`、`lib/glass-webgl.js` 和 `vendor/motion.js`，均有原始许可证（不要复制未授权 Apple 素材）。
- 可作为项目内参考：`app.js` 的 `getRects` / `render` 单进度几何插值、手势速度衰减、光学按需渲染/过渡清晰图回退。这些尚未包装成独立 npm 包，不应声称“通用组件库已发布”。
- 审计流程复用：固定 4 视口、5 阶段截图、三背景光学检查、慢/快/取消拖动、R1-R2 延迟实测、Taste 实图验收。

R1 可回退 SHA `d88de732d7b831e67d59942beec7e6add2e073c4`。R2 最终部署 SHA 与线上测试需以发布结果为准。
