# Frequency · 听见此刻

一个独立的 Apple Music 风格网页交互实验，作为「小东西」的新作品发布。**非 Apple 官方产品，不连接 Apple Music 曲库或账号。**

## 功能

- 现在就听：原创主视觉、专辑推荐和心情列表
- 浏览：六组原创视觉封面；其中三首可试听音频，其余三组为使用同三首音频的精选歌单
- 搜索：按曲名、中文名、情绪、歌单查找
- 音乐资料库：本机 localStorage 收藏与取消
- 真实播放：播放/暂停、前后切歌、随机、单曲循环、进度定位、桌面音量、响应式常驻播放器
- 全屏正在播放：封面、当前时间、播放控制、队列
- 输入：鼠标、键盘、触屏、专辑长按菜单；支持减少动效和减少透明度设置

## 资源与版权

封面均为本项目原创 SVG，无需外部字体或图片 CDN。
试听音频复用同仓库 `little-works/aurora-player/audio/{afterglow,blue-tide,night-drive}.mp3`，为项目已有的原创合成试听素材。页面不会上传本地内容。
网页素材、音乐名称均为虚构演示；不得将本项目当作 Apple Music 订阅服务。

## 技术

静态 HTML/CSS/JS，无依赖，不调用第三方 API。发布路径 `/little-works/frequency/`。父级 `little-works/catalog.json` 自动产生入口。

## 已知限制

- 非正式流媒体平台，只可试听 3 个原始音频文件。
- 使用 L1 Web 玻璃（backdrop blur + 专辑颜色氛围），不将其称为 Apple 原生 Liquid Glass，也未声称 L2 全背景折射。
- 浏览器截图与静态验收使用 Windows Edge/Chromium。尚未在真实 iPhone Safari 设备上验证。
