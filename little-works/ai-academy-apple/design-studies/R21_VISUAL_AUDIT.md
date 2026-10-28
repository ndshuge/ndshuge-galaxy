# 知序 Apple Edition · R2.1 视觉精修与真实回归

日期：2026-10-28。工作区：独立 `release/zhixu-apple-r2-20261028` worktree。

## 参考与发现
Apple Books 的 Reading Now 内容优先原则及 Notes 的正文阅读原则作为设计方法参考，不复制 Apple 官方素材。本轮针对**真实在线 R2 截图**复核，不将功能测试当作视觉品质证明。

- R2 首页 390px：重复醒目标题、原有装饰圆球覆盖真实 Logistic 曲线；折射装饰抢夺科学视觉主体。
- R2 教师 390px：实验切换器当前选项文字被折射层遮住；四步学习导航截断，初始内容过低。
- R2 课程：保留已有基于教学内容的课程曲线和关系图，后续仍需 Apple Books 式章节身份与知识图谱深化。
- R2 首次渲染：主模块启动前视觉区域不完整，移动端等待时视觉重心不自然。

## R2.1 实施与独立验证
- 首页标题压缩为“继续学习”；真正的课程问题与数学模拟图成为主视觉。
- 去除覆盖曲线的旧装饰球体及高强度无意义折射；预览由 Logistic 方程 `x_(n+1) = 3.9*x_n*(1-x_n)` 数值计算，两条初值 `0.41200 / 0.41201`，66 个点。**这是前端公式预览**，实际科学实验仍由 Original Engine 执行；二者不要混同。
- 新增图轴、取样图例与手机适配；无 JS 首帧使用同公式生成的 SVG 静态回退，并保留 Original 链接。
- 教师四阶段在 320 和 390px 均完整可见；当前选中切换标签置于玻璃覆层上方。
- 原有 `app.js`、`pages-api-shim`、`learning-store`、问题评分、课程接口与事件记录均未修改。

## 测试与证据
- Playwright + Windows Edge，基础 **30/30**；扩展业务 **20/20**（包含原版前测、预测、实验、导师、二次实验和学习记录）；初始无主模块 **6/6**。
- R2.1 视觉几何 **13/13**：320/390/768/1440px，首页图形渲染、学习路径四项可视、小屏无溢出、没有页面 JS 异常、全部脚本关闭时 SVG 和 Original 入口仍可用。
- 截图（实际浏览器帧）：
  - 改前：`qa/r2-live-loaded-390.png`
  - 改后手机：`qa/r21-final-home-390.png`
  - 改后桌面：`qa/r21-final-home-1440.png`
  - 改后私人教师：`qa/r21-final-learn-390.png`
  - 关闭 JavaScript：`qa/r21-without-js-390.png`
- Apple HIG 设计相似性和真正 iPhone Safari/120Hz 仍**未验证**；浏览器 Chromium 截图不是原生 iOS 验证。
- R2.1 仅增量视觉实现，并非全面复刻 Apple Books 或实现一个新知识图谱。

## 发布与回退
以发布提交父节点为界，Git 提交需只涉及 `little-works/ai-academy-apple/`。上线复测 HTTP 200、真实原版桥连接、题库/科学引擎、原版网站、目录入口。保留前一版 SHA 作可回退点，禁止 force push。

## 发布交接（R2.1 尚未上线）
- R2.1 的首个本地提交：06ba4aee6a16c889110ae183a7941875c4ffcfdf；之后补充科学图形 aria-hidden 修正与本交接说明。
- 2026-10-28 GitHub 插件只读检查远端 main 仍为 9683c05b2f20bde46c28369dd4202901ce8fb82b（R2）。R2.1 **未推送，未部署**。
- Mice Hole HTTPS Git：默认 schannel TLS 握手失败；127.0.0.1:7897 代理使用 OpenSSL 返回 unexpected EOF；无代理直连 github.com:443 超时。未改全局代理、未关闭证书校验、未强推。
- 补充辅助技术验证：Playwright Edge 实际识别有名称的 Logistic role=img；真实首页不再含父级 aria-hidden。该专项检查输出 PASS，但测试进程关闭阶段出现超时，故仅认定以上两个断言成立，不认定完整用例退出成功。
- 唯一下一步：在 GitHub HTTPS 可安全连通时，fetch 最新 origin/main → 核对本分支只影响知序 Apple Edition → 若远端已前进则重新集成 → 普通 non-force push → 验证 Pages 资源和线上完整功能。不要修改 Original 或其他小东西。

## R2.1 正式部署复核（2026-10-28，覆盖上文早期“尚未上线”状态）
- 既有 7897 GitHub HTTPS 握手超时；经既有 7898 跨订阅故障转移端口并设置本命令 `http.sslBackend=openssl`，真实 `git ls-remote`、fetch、push 成功。
- 跨项目安全集成：先保留并行 Motion Lab 提交 `39e3456`，再集成知序 R2.1；发布提交 `fb7e7eec26bf37b475ee330cf7c910e61f9a44d0`，仅知序 Apple Edition 的 11 个文件，非强制推送到 main。
- 实际线上核验：Chrome/Edge 无头浏览器与资源请求，R2.1 页面和新增 JS/CSS/SVG HTTP 200、原版引擎已连接、真实题目和实验计算正常；更新后的 online-r21-smoke 检查 20/20 通过（测试脚本保留在原始 worktree 中供查验）。原版站点 HTTP 200。
- 共享网络恢复入口：`E:\CHATGPT\_system\git-safe-https.ps1`，支持 Probe / Fetch / 带路径隔离的 Push；全局 `E:\CHATGPT\AGENTS.md` 已新增优先执行说明。未经检查不得使用 force push、关闭 sslVerify 或改全局代理。
- 局限：未在真实 iPhone Safari 验证原生 Liquid Glass 的光学质感；浏览器功能成功不等同人眼 Apple 视觉品质验收。