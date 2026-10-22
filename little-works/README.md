# 小作品 · LITTLE WORLDS

鼠哥星系的第七个星系，用于收录独立、轻量、可游玩的完整小作品。不是艺术回廊的展品目录。

公开入口：`/little-works/`。现有两件作品：`/little-works/sea-of-little-things/`《无用之海》，`/little-works/emergence-lab/`《涌现实验室》（七个局部规则涌现模拟）。

## 以后新增作品

1. 在 `little-works/<slug>/` 放入可直接打开的静态网页，必须有 `index.html`。推荐含一个独立的 `offline.html` 备份。
2. 验证 PC + 320/375/414px 手机、鼠标与触摸、音效启停、控制台报错和网络资源。
3. 在 `catalog.json` 追加一个对象。必填 `slug,title,url`；其他字段 `date,type,description,cover,tags`。路径只用 `./<slug>/`，封面用本星系内相对路径。
4. 发布同一仓库 main，检查 GitHub Pages 构建与真实链接。无需再修改星系主入口。

`index.html` 会自动读取 `catalog.json`，故以后无需手动编辑展览卡片；只有 catalog 加载失败时使用内建的首件作品静态入口。目录路径适合长期扩展。
