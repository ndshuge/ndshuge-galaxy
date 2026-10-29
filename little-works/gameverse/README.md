# GameVerse · SHUGE 游戏平台

发布日期：2026-10-29 · 独立响应式网页，发布到鼠哥星系「小东西」。

## 功能
- 16 款原创网页游戏，链接到既有 `ndshuge-game/games/<slug>/`，**没有复制、改写或重新上传游戏**。
- 桌面端独立三栏布局；移动端沉浸式卡片、可滑动精选以及浮动底部导航。
- 搜索、分类、收藏、最近游戏、详情、精选轮播、暗色/浅色、游戏内嵌启动及新标签页后备入口。
- 收藏与最近游玩保存于本地浏览器，不涉及账号与跨设备同步；复用现有 SHUGE Arcade 的 localStorage key。
- 控制项使用 Web backdrop blur、光泽边缘和弹性反馈；移动端底部选中镜片调用已有 `liquid-glass.js` 光学位移/物理弹簧，WebKit 有模糊后备。
- 支持键盘快捷键 `/`、`⌘K` / `Ctrl K`、`Esc`，包括减少动画偏好。
- **Apple-inspired web experience**，不是苹果官方应用。网页中的玻璃效果不能等同系统级 iOS Liquid Glass。

## 运行
本项目静态托管，无运行时依赖；通过 HTTP 服务加载（不要直接使用 file://）。本地例子：
```sh
python -m http.server 5832
```
访问 `http://127.0.0.1:5832/little-works/gameverse/`。

## 发布隔离
仅新增 `little-works/gameverse/` 并向 `little-works/catalog.json` 注册一项；所有已有小东西/游戏厅路径不变。回退时移除注册项以及本目录即可。网站使用仓库默认 GitHub Pages 发布流程。

## QA
`E:\\CHATGPT\\gameverse-qa\\qa.cjs`（本机独立 QA，不提交）：Edge + Playwright 5 视口 67 个检验，含页面 JS 错误、资源 4xx、横向溢出、手机/桌面导航、筛选搜索、详情与 ESC、收藏持久化、内嵌启动/退出、最近游玩和主题持久化。真机 iOS Safari 手势和每款游戏内操作仍需要用户设备验收。
