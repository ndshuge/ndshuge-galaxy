# 松鼠 · Apple 风格自然介绍页（2026-10-29）
## 目标与选择
作为「小东西」独立作品上架，桌面 / iPhone 原生感强的网页自然介绍。采用 Apple 产品页全幅摄影与编辑式排版、iOS 26 的悬浮导航，绝不复制 Apple 专有图形或界面源码。Immersive + 克制玻璃，比 Clean/全玻璃卡片更适合松鼠写真。
## 真实引擎
原版插件技能 assets/liquid-glass.js（25K）实拷至 little-works/squirrel/lib/。Hero 图片上的提示片选 Pattern C 背景拷贝：全浏览器可折射；固定导航选 Pattern D：Chromium 折射、WebKit/Firefox 降级模糊。压按调用原版 createSpring。键盘 Tab/方向键、reduced-motion 与 reduced-transparency 友好。
## 已验证内容来源
欧亚红松鼠 Sciurus vulgaris 科普：https://animaldiversity.org/accounts/Sciurus_vulgaris/ ; https://www.daera-ni.gov.uk/articles/squirrel-fact-file
摄影授权：Unsplash https://unsplash.com/photos/a-close-up-of-a-squirrel-on-a-tree-hBJrE3duPw0 ; Pexels https://www.pexels.com/photo/a-red-squirrel-on-the-ground-8075869/ 和 https://www.pexels.com/photo/close-up-portrait-of-a-eurasian-red-squirrel-36085215/。素材存本地；无外部追踪。
## 部署边界
仅添加 little-works/squirrel/* + catalog.json 一条登记；不改首页及其他作品，不强推，发布后查公网并保存回退提交。