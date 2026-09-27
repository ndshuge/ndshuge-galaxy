# CHROMA / NOISE × ndshuge-galaxy 艺术回廊整合计划

## 目标

将 CHROMA / NOISE 作为新的交互式生成数字艺术展品接入现有 `ndshuge-galaxy/art/` 艺术回廊，保持现有回廊导航、作品牌位、点赞/进入交互与 GitHub Pages 发布方式。

最终交付包括：

- 独立展品页：`art/chroma-noise/index.html`
- 艺术回廊新增第 14 件作品
- 展品程序化牌位（不使用伪截图）
- 桌面鼠标、触摸屏、滚轮/滚动交互
- 防止文字蓝色选中与移动端点击高亮
- 无构建、无 CDN 的单文件部署
- 本地静态服务器与 GitHub Pages 均可运行

## 现状审计

当前发布工作树：

`E:\CHATGPT\2026-09-22\3d-skill\work\ndshuge-galaxy-publish`

分支：`publish-gravity-choir`

现有艺术回廊已有 13 件作品，入口为 `art/index.html`，作品通过 `WORKS` 数组注册，牌位由 `drawMotif()` 程序化绘制。
## 实施阶段

### Phase 1 — 展品本体

基于已验证视觉方向制作 CHROMA / NOISE 完整版：

- 黑色空间 + 巨型实验排版
- 彩色粒子场
- 指针/触摸扰动
- 点击能量波
- 滚动改变场景状态
- MELT 动态字形
- 多调色状态
- Web Audio 可选声音层
- 响应式桌面/手机布局
- `user-select:none` 与 `-webkit-tap-highlight-color:transparent`

### Phase 2 — 回廊接入

在 `WORKS` 新增：

- No.14
- 中文名：色噪场
- 英文名：CHROMA / NOISE
- 类型：交互生成艺术
- 路由：`./chroma-noise/`
- motif：`chroma`

同步扩展中文件数字数组至“十四”，并增加程序化牌位视觉。

### Phase 3 — 验证

- HTML/JS 语法检查
- Edge headless 首屏截图
- 本地 HTTP 访问
- 回廊入口到展品路由检查
- 桌面与触控关键交互检查
- Git diff 审计
## 质量门槛

1. 不破坏现有 13 件作品。
2. 展品不依赖远程 CDN，离线静态服务器可运行。
3. 点击/拖动不得触发文字蓝色选中。
4. Canvas/动画失败时页面仍保留可见静态视觉。
5. 页面必须支持 `prefers-reduced-motion`。
6. Gallery 的第 14 件作品必须能通过画框和“走进”按钮进入。
7. 最终提交仅包含本任务相关文件与对 `art/index.html` 的必要增量修改。

## 发布

完成验证后提交到当前发布分支，并推送远端；由现有 GitHub Pages 发布链路生效。
