# 《环的另一边》· 土星观测室 — 实际设计与科学来源

发布日期：2026-10-25。独立静态交互天文科普小样，收录于 **鼠哥星系 / 小东西**。

## 产品、构图与真实输入

核心任务不是罗列八大行星，而是让访客在一张**真实 NASA 卡西尼号背光土星影像**前先感到尺度，再亲手理解环面投影，最后理解光行时。原创视觉命题：**「把 NASA 深空影像中的观测档案板，变成可翻阅、可操作的科学标本。」**

候选方向：A 通用太阳系行星卡片墙（拒绝：枯燥且视觉模板化）；B 真实深空影像 + 档案册（采用）。页面不是“首页大字、三卡片、CTA、页脚”复制件，而是 **① 真实照片主导的黑色摄影档案板；② 纸张质地的发现笔记；③ 宇宙暗室中可调环角度的科学仪器；④ 可对照的光行时观测单**。

原「小东西」目录的上线前手机、电脑截图已保存于私有验收目录。观察到它本来就是完整作品目录，因此不重新设计宿主页、不修改其它卡片；仅通过 catalog.json 插入新作品。另一个失败背景：此前「晴间」项目通过对比度测试，却仍因泛化卡片式构图被用户明确否定，本次拒绝仅换 CSS 皮肤。

## 真正使用 Taste-Skill

- 官方源：[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)。读取本机 SKILL.md，以**页面模式**而非 dashboard 模式执行。
- 新运行 draw.mjs：`--sector education --tone editorial --sections intro,showcase,how-it-works,proof,footer --options 3`，比较 `type-only-statement`、`sentence-as-layout` 和 `page-is-the-object` 三套方向，最终生成 **page-is-the-object** 详细方向单（本机 .taste-skill）。选用其真实物件画面、纸质档案组织与章节构图语法。
- 透明适配：方向单原版建议演出用“活动入场券”和嘉宾名单，其假定内容不符合真实天文科普；故将“实物”替换成 NASA 深空摄影观测档案板，并用真实数据和环面仪器代替虚构名单、照片墙。未假装原图本就是一张活动券。
- 代码映射：`.opening-visual` 全景影像 / `.opening-text` 摄影档案标题 / `.story-grid` 说明页 / `.experiment` 仪器面板 / `.light-grid` 光行时记录。
- 真正的浏览器截图需按 320、390、768、1440px 验收，不能把代码运行无异常当作视觉评价。交互与无横向滚动需单独测试。

## 真正使用 Designeer

- 实际打开两类目录： [Inspiration](https://designeer.xyz/inspiration)、[Resources](https://designeer.xyz/resources)，以及以下具体独立条目：
- [SEESAW](https://designeer.xyz/inspiration/seesaw)（并实际查看其[原站](https://www.seesaw.website/)）→ 不使用它的模板与 UI 素材，借鉴“按具体章节归类”的内容节奏；代码 `.section-nr`、`.story-grid`、`.lab-headline`。
- [Minimal Gallery](https://designeer.xyz/inspiration/minimal-gallery) → 低噪声、照片和排版主导；借鉴为 `.opening` 极少彩色 UI 区、取消图标卡片。仅研究目录条目，不声称复制某个未确认的案例。
- [Utopia Fluid Type](https://designeer.xyz/resources/utopia) → 适应多视口的流式字号：`.opening h1`、`.fact-no` 和移动端 `.light h2` 的 `clamp()`。
- [Color.review](https://designeer.xyz/resources/color-review) → 深空文字使用高对比粉白色，暖纸底使用墨色；这是一种颜色验证方法论的采用，不是“安装了它的 CSS”。
- 未导入任何不明许可的图片、组件、动画、字体或第三方 SaaS。

## 科普事实与照片授权

- **摄影作品：** NASA / JPL-Caltech / Space Science Institute，卡西尼号 2013-07-19 土星背光拼接，PIA17172。[NASA 图片和叙述](https://science.nasa.gov/resource/the-day-the-earth-smiled/)；[NASA 科学可视化](https://svs.gsfc.nasa.gov/30520)。原始照片经无文字覆盖版本按原图等比压缩为 `assets/nasa-saturn.webp`；不是 AI 生成的土星图。
- **科学数据：** [NASA Saturn Facts](https://science.nasa.gov/saturn/facts/)：日心平均距离约 9.5 AU，公转约 29.4 个地球年，太阳光抵达土星约 80 分钟，主环通常仅约 10 m 厚；环带实际尺寸和厚度多变。
- **媒体使用规范：** [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)。NASA 影像署名，不使用 NASA Logo，不暗示 NASA 认可本站。勿将此声明理解为第三方对本作品的背书。
- **环面实验：** `app.js` 使用自己绘制的 2D Canvas 环和行星；滑块从 0° 侧视（环趋近于线）到 90° 俯视（环趋近于圆），是纯几何投影演示；不是精密物理模拟，不等于土星的自转轴倾角 26.73°。
- **光行时：** 所有目的地从太阳出发，以行星平均日心距离计算近似分钟数（地球 8.3、火星 12.7、木星 43、土星 80）。不同公转位置与距离变化未模拟；也不是地球向行星发无线电信号的实时传播时延。

## 验收与发布

本地 Taste-Skill 页面审计器已经真实执行，退出码仍为 1：它对大号中文跨行标题、微型档案标签、摄影遮罩渐变、仪器刻度线和部分字体风格报出通用建议；其中大幅摄影与图形刻度服务天文表达。针对可读性已进行第二轮修正，将手机主要科普段落从 14px 提高到 16px。**不宣称 Taste 通用审计全面通过**，最终美术满意度还须人类评价。\n\n本地 `qa-local.cjs` 为浏览器多尺寸交互回归脚本，实际测试图片加载、Canvas 绘制、0°/42°/90° 滑块与预设、地球/木星/土星切换、无横向溢出以及 JS 错误；它留在工作副本，不随公开站点上传，因为包含本地运行环境路径。公开的 `check.cjs` 与独立 GitHub Action 执行语法、来源记录和卡片注册检查，但**并不声称可以自动评价美学**。

授权说明：公开作品不采集用户数据、不需要密钥；仅包含静态内容、绘图脚本与 NASA 影像。视觉满意程度由用户最终决定。
