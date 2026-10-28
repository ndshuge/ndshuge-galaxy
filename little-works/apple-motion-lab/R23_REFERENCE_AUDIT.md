# Apple Motion Lab R2.3｜iPhone 录屏逐帧差异与高保真修正

日期：2026-10-28。基线：R2.2 `9fd9a30`。作业方式：ChatGPT 原生 Skill + Mice Hole 本机文件/终端/浏览器/Git，未委托 Codex 或其他 Agent。

## 参考视频：真实用户上传，不是推断

原始录屏：`ScreenRecording_10-28-2026 13-56-27_1.mp4`，约 **16.133 秒、512×1112、30fps**。未把私人录屏提交到公共仓库。参考帧人工观察：0.5s 静止；1.05～1.3s 按下跨越两个按钮；9.25～9.75s 玻璃抬升和回弹；10.05s 横向连接、短暂色散；11.0～11.3s 恢复。

**参考的不是 Apple Music 自身的三栏深色播放器，而是浅色背景、四栏导航的 iOS 应用。** 这是视觉偏差的重要来源。不能把该录屏当作 Apple SDK 的精确参数来源，也无法从录屏得出手指的原始触摸轨迹和 120Hz 内部渲染。

### 最影响质量的客观差异

1. R2.2 底栏 **72px 高（390px 视口）**，参考视频原始约75px，等比例换算到390px约 **57px**：之前没做同宽归一化，因此相对视觉尺寸过厚。
2. R2.2 按住时玻璃只横向变长，基本被约束在内部；参考会在顶部/底部**同时超过底栏边缘约数个像素**。源视频选中气泡在部分帧约90px高，换算390px约69px（近似，因压缩/抗锯齿误差）。
3. 参考轻微折射、明亮边缘、快速经过其他图标时出现蓝紫色散；R2.2 更接近暗色半透明的实心胶囊。即使调整动画常数，暗背景和 Safari 材料不同，仍不能做到截图逐像素一致。
4. 参考玻璃有**方向性前缘牵引/后缘滞后**及按下抬升、松开收拢；R2.2 主体跟手但高度基本恒定。
5. 参考选中图标有蓝色反馈和轻微放大；R2.2 色彩已经接入，但选中和光学体仍不够协调。

参考图像的边界数值为**人工测量近似值**；不是 Apple 私有设计参数。用户视频有四项，我们保留产品原有三项，所以不是同一张像素布局。

## R2.3 直接对准参考的修改

- **不是新建页面**。保留旧 DOM、播放器、音频、3 个栏目、GitHub Pages 入口。
- 导航尺寸：390px 宽时底栏从约 **358×72** 调到约 **366×58**；图标尺寸与复制层相应调小，避免厚重。
- 玻璃静止 `115×52px`；按压/拖拽时通过 **两条 Skill `createSpring` 物理弹簧** 驱动抬升和宽度形变。实际在390px的半途测到约 **123×71.2px**，透镜顶部比底栏高约 **7.6px**，下缘也越出约 **5.6px**。快速往返宽度可变化到约 **147px**。
- 扩展 `lg-navbar .lg-nav__copy` 折射目标的纵向区域（上下各16px）；`LgNavbar.render()` 将镜片 SVG 滤镜的 y 坐标补偿+16，避免引擎在边界处裁切。保留原生 `createGlass` 与 `feDisplacementMap`。
- 按下时将 Skill 原生玻璃光学参数从 `chroma=.095,refraction=12` 提升到 `chroma=.21,refraction=16`；松开恢复。边缘补充随滑动动能增减的薄光谱高光，**只是辅助边缘光层，不是替换实际折射引擎**。
- 保留当前导航滑选语义：1:1 x 跟手、预览图标蓝色、松手才提交、取消恢复、键盘仍能工作。
- 速度形变采用离散形状并复用引擎贴图缓存，避免所有浮点尺寸都触发 PNG 重绘；但是多形状首次生成仍有计算成本。

## 真实测量与测试

| 检查 | 结果 |
|---|---|
| 320/390/768/1440 几何和抬升回归 | `evidence/nav-scrub-r23/reference-geometry-qa.json`：**17/17 通过** |
| R2.3 变形、折射、图标、释放、图层缓存 | `evidence/nav-scrub-r23/fluid-qa.json`：**8/8 通过** |
| 旧版完整功能回归 | **28/28 通过**（最终布局尺寸复测需以新报告记录为准） |
| GPU、Motion、音频、降级压力 | **14/14 通过**（最终布局尺寸复测需以新报告记录为准） |
| 既有导航四视口触摸 | **28/28 通过**（最终布局尺寸复测需以新报告记录为准） |
| 原生 Design Taste Inspector | 已实际运行，**仍有 gradient、covered-text FAIL** 与小字警告；不能声称质量全面合格 |
| 真实 iPhone Safari | **未验证** |
| Apple 原生触感/光学逐像素相等 | **无法证实 / 未达到** |

源代码重要位置：`lib/components.js` （扩展玻璃光学可绘制几何，仅是原组件小改）、`lib/nav-scrub.js`（原 `createSpring` 控制）、`style.css` （视口比例、边缘光）。参考截图与本项目的截图不可直接用一个百分数宣称复刻程度。

## Skill 复用审计

- ChatGPT 原生插件 `Liquid Glass for the Web`：**READ / INTEGRATED / RUNNING / TESTED**。使用的是原有 `liquid-glass.js`、`components.js` 和 SVG 滤镜；WebGL 唱片引擎不变。未重写成熟光学算法。
- ChatGPT 原生 `Apple Liquid Glass`：**READ / design-applied**。与素材/控件级别视口尺寸复核。
- ChatGPT 原生 `Motion`：**READ / pre-existing running**。播放器继续使用 Motion 14.7.1；导航新动画使用 Liquid Glass Skill 附带的 `createSpring`，不冒称新引入 Motion 引擎。
- 本机 `SHUGE Apple Design`：通过 **Mice Hole 读取本地 Skill**，非 ChatGPT 原生 Skill；实际执行了 reference-first、交互阶段/浏览器对照要求。
- `Design Taste Frontend`：官方 `inspect.mjs` 已运行，报告和页面截图保存在 `evidence/nav-scrub-r23/taste/`；结果部分失败如实保留。

## 未达到的 1:1

网页无法直接调用 Apple 的私有 Liquid Glass 画面合成/触觉引擎；该原生材质对背景、环境色、触摸速度做系统级响应。现有 Skill 的 SVG 内容折射在 Chromium 可执行，但背景 `backdrop-filter:url(...)` 在 iPhone Safari 环境不等价，存在模糊降级。因此 **R2.3 是有证据的高保真 Web 近似，不是 Apple 系统级逐像素一比一**。

想要真正的系统原生导航，应由 SwiftUI/UIKit 在 iOS 26+ 真机上承载；需要 macOS/Xcode 和真机验证，与现有 Windows + GitHub Pages 网页不是相同交付物。
