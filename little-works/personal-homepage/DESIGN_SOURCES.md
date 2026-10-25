# 鼠哥的开放工作台 · Personal Homepage Prototype

2026-10-25 · **作为「小东西」中的独立公开候选发布；既有个人主页没有被覆盖。**

## 真实简报、素材与隐私

主页只用公开的品牌名「鼠哥 / ndshuge」和已经公开的作品作为证据。保留“在西安读大学”这一宽泛自我介绍；**不提供真实姓名、私人联系方式、日常行程、学号、邮箱、AI Key 或私有项目路径**。只使用经已打开验证的公开项目链接。

此前已有个人主页：https://ndshuge.github.io/shuge-little-universe/ 。真实桌面/390px 截图见本地审查记录中的旧站截屏（源截图在其他项目 evidence）。具体问题：① 初次打开中心视觉是正在加载的空宇宙画布，作品没有直接出现；② 手机首屏大段空白且真实作品难以触达；③ 多个次级提示、操作入口和加载状态喧宾夺主。本版本**独立建站，不修改原站**。

## 作品：真实页面、真实截图

已用 Edge 实际访问并采集：
- **环的另一边** https://ndshuge.github.io/ndshuge-galaxy/little-works/saturn-atlas/ ，首屏摄影源是该作品已使用的 NASA / JPL-Caltech / SSI 卡西尼号土星图（图像来源说明在原作品）。缩小截图见 `assets/saturn.webp`。
- **知序 AI 学院** https://ndshuge.github.io/zhixu-ai-academy/
- **鼠哥游戏厅** https://ndshuge.github.io/ndshuge-game/
- **山河为证** https://ndshuge.github.io/shanhe-preview/
- **晴间** https://ndshuge.github.io/qingjian-weather/
- **小作品星系** https://ndshuge.github.io/ndshuge-galaxy/little-works/

屏幕图均来自这些**用户自己已公开**的项目网页，不是生成的假 UI，不对链接功能进行虚假承诺。没有使用私人本机截图或 Cookie。

## Taste-Skill：实跑的，而不是只读说明

已阅读 `Taste-Skill 的本地安装目录`；于本项目运行 `scripts/draw.mjs`、生成 `.taste-skill/direction.json`，sector=personal-portfolio，roles=work/about/contact，并比较了 `split-stage`、`contact-sheet` 和 `name-as-monument`。

- **选择 split-stage**：个人话语在左，已经做出来的作品在右；对作品有真实首屏曝光，与旧站加载中心的空画面形成结构差异。代码 `.hero`、`.hero-playground`、`#heroProjectImage`、`.hero-switch`。
- **拒绝 contact-sheet**：它要求大量 90–140px 小图和密集微文字，违反用户不喜欢碎小标签的偏好。
- **拒绝 name-as-monument**：只有巨大品牌名称不能比真实作品更好地介绍其创造力。
- 二次设计改动：最初视觉“奶油色+橙色/三行口号”仍像通用 AI 设计，于是改成淡绿纸面/青柠重点，缩成两行主标题，NASA 原图作为主焦点代替裁坏文字的网页截图，项目截图保留在项目区完整展示。记录在 `evidence/first-*.png`、`evidence/v2-*.png`。
- 跑了真实浏览器 `inspect.mjs` (1440/768/390) 并阅读 findings。首次 13 项；改版后约 7 项尚有反馈。未宣称普遍 Taste 全绿。一些通用规则（纯文本跳转链接误判为 eyebrow、无视频警告、设计上必要的一处底部分隔线）与此作品的页面目标不符。

## Designeer：查了具体条目和原站

- 访问 https://designeer.xyz/inspiration 和 https://designeer.xyz/resources。
- https://designeer.xyz/inspiration/seesaw 和原站 https://www.seesaw.website/ 实际在 Edge 打开并截图，研究的是**完整站点如何让访客从图片直接挑选真实作品**；采用图像先行的浏览语法和短标题／简要说明，而非复制原站的左侧类别菜单、搜索条、赞助商和卡片外框，映射到 `.work-gallery`、`.project-image`、`.project-line`。
- https://designeer.xyz/inspiration/minimal-gallery 单独访问并浏览；取“视觉元素必须服务主体、留白而不是装饰小字”的约束，没有复制它的成品或引入外部代码。
- https://designeer.xyz/resources/utopia 的流式排版思想：`clamp()` 字号，不把手机文字缩成几像素；实际实施在 h1、h2 与响应式 breakpoints。
- https://designeer.xyz/resources/color-review 的可读性原则：文字在浅色/深色/青柠底色上的对比，颜色决策写在 `style.css`；没有声称安装任何第三方组件库或下载字体。

## 可验证工作和未通过边界

项目实际上完成了 HTML/CSS/JS、原样 WebP 资源、点击切换精选作品、外部链接、键盘操作支持、实际项目截屏、多尺寸浏览器测试。执行：
```
node --check app.js
node check.cjs
node qa.cjs
```
本地截图及 QA 输出保存在 `evidence/`。**FOUND / LOADED / EXECUTED / VERIFIED** 并不意味着 **HUMAN VISUAL APPROVED**。用户未验收时，不覆盖旧主页，不做自动公开部署。

主要范围边界：没有接入邮件、动态用户资料或后端；截图是项目在特定日期的真实状态，未来项目页面可能改变；视频和动效不是必须功能，页面优先不因动画炫技而降低可读性。
