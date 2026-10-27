# Focus Aura｜沉浸式专注空间

独立的静态单页应用，无第三方运行依赖。通过 Mice Hole 直接开发，不调用 Codex 或其他 Agent。

## 本地预览
`python -m http.server 8731 --bind 127.0.0.1`，然后打开 http://127.0.0.1:8731/ 。

## 功能与持久化
25/5/15 分钟番茄钟，三模式自定义，三种动态场景；开始/暂停/继续/重置和标签页恢复。绝对时间戳 `endAt` 保证浏览器非活动时的剩余时间正确；完整结束的专注记录去重存入 `localStorage['focus-aura.v1']`，统计按浏览器本地日期归集。记录保存在此设备此浏览器，不跨设备同步。浏览器缓存清除可能丢失数据。

## 玻璃层级
L0：实体不透明；L1：CSS `backdrop-filter` 模糊；L2：画布从真实程序化动态背景采样并进行边缘像素空间位移（`renderOptical`），不是单纯 CSS 模糊。这是 Web 实验性折射，不等同于系统原生 Liquid Glass。开启减少透明度或 OS 同名偏好时优先 L0；减少动态效果停用连续背景动画。

## 自动化测试
`node tests/e2e.cjs` 使用本机 Edge 与原生 Chrome DevTools 协议，不需 npm；要求本地 HTTP 服务器已启动。证据位于 `evidence/qa-report.json` 和各宽度截图。真实 iPhone Safari 需真机补验。

## 发布隔离
源项目独立于站点仓库。站点目标 `ndshuge/ndshuge-galaxy` 的 `little-works/focus-aura/`，在远端最新 `main` 上另建分支，合并时禁止强推或覆盖其他作品。
