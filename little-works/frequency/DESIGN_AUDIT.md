# Frequency · 视觉验收与来源

## 设计选择

**Apple Web Design（插件，已原生加载）**：采用 Media / Hybrid-Immersive 结构。首屏保留一个主要推荐对象、两个辅助情绪块和一列专辑封面；小屏幕专辑区横向浏览，顶部导航变为底部四项；桌面常驻完整控制条，手机使用紧凑 Mini Player。

**Design Taste Frontend（插件，已原生加载）**：采用产品信息决定界面构图、图像大于容器装饰、视觉节奏与低噪声标注。没有强行套营销页三卡片模板，避免假数字、技术标签和多余 KPI。运行的是插件中的设计方法，未冒称执行本机 `draw.mjs`。

**Liquid Glass Web（插件，已原生加载）**：按照 L0/L1/L2 区分。本轮明确实现 L1：背景混合、半透明、blur、边缘高光；未实现或声称 L2 全背景位移折射。减少透明度时使用不透明材料。

**Motion（插件，已原生加载）**：按 CSS-or-Motion 指引，小型悬停、按压、滚动用 CSS；使用可被新输入打断的弹性曲线，无额外 Motion JS 运行时依赖，尊重 reduce-motion。

## 参考

- Apple Music 网页播放界面 https://music.apple.com/ ：参考内容主导的推荐、专辑列表与音频控制，并未使用官方商标、封面或音乐。
- Apple Support Music Web https://support.apple.com/guide/music-web/welcome/web ：参考全屏播放器、资料库和队列结构。
- Taste-Skill 设计方法（插件 Skill）：参考 App Screen 的真实数据、视觉内容优先和减少装饰。
- Designeer https://designeer.xyz/resources 与 https://designeer.xyz/inspiration ：浏览服务在本次访问中不可用，不能声称查阅了具体案例原页；未导入其源代码或素材。

## 视觉复查

初版截图 `qa-desktop.png`、`qa-mobile.png`。
初版缺陷：推荐英雄区背景 SVG 的英文专辑标题与中文主标题重叠；小推荐卡片底部也露出了 SVG 曲名。
修复：创建独立 `*-scene.svg` 不带封面文字场景图，并更换推荐区背景；专辑网格中继续保留封面文字。
复看宽度：320、390、768、1440 CSS px；文件分别为 `qa-narrow-final.png`、`qa-mobile-final.png`、`qa-tablet-final.png`、`qa-desktop-final.png`（本机工作目录，未加入正式发布文件）。

## 验收边界

- 浏览器截图与 DOM 元素检查：已执行。
- HTML/CSS/JS 资源和 HTTP 音频可达性检查：已执行。
- 真实鼠标点击自动化：Mice Hole 的浏览器对该本机测试站点提示只读策略，本轮不宣称交互自动化通过。
- 真机 iPhone Safari、用户审美认可：未执行，不冒称通过。
- 已注册 catalog.json，避免对其它作品及其现有目录进行改写。
