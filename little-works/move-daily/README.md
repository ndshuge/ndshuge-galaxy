# 动迹｜运动打卡
独立静态应用，无后端与运行时依赖。支持运动类型、时长、可选距离、体感强度与备注；编辑删除、连续打卡、周/月/四周统计、历史日历、目标设置、JSON 备份恢复。

## 本地运行
在本目录运行 `python -m http.server 18882 --bind 127.0.0.1`，访问 `http://127.0.0.1:18882/`。基于 Node 24 的无依赖 Edge CDP 端到端测试：`node tests/e2e.cjs`，测试截图与报告保存在 `evidence/`（本机）。

## 数据
运动记录位于当前浏览器本地 `localStorage['move-daily.v1']`，不会上传服务器或自动跨设备同步。导出 JSON 可自行备份；导入会覆盖本浏览器当前记录，并有确认步骤。清除浏览器站点数据会丢失记录。

## 玻璃层级与兼容性
L0 实色、L1 backdrop-filter 磨砂、L2 对应用程序自身程序化背景画布采样并进行像素位移。L2 **不是**对后方 HTML/DOM 进行完整折射，也不等同 iOS 原生 Liquid Glass。自动尊重系统减少动态和减少透明设置；可在偏好中手动切换。已测 Windows Edge headless 与四种尺寸；iPhone Safari 真机尚未验收。

## 发布约束
上线只修改 `little-works/move-daily/` 与 `little-works/catalog.json` 新增一条作品入口，禁止覆盖站内其他应用或强推旧版主分支。
