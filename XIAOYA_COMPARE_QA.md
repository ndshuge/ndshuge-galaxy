# 小芽 · 三版并排设计实验

2026-10-25 · 发布目标：鼠哥星系「小东西」中既有“小芽 LifeLab”作品卡。

## 范围与版本

- **原版**：`https://ndshuge.github.io/xiaoya-lifelab/`；保持原版仓库与源代码不变。
- **Apple 风格**：`little-works/xiaoya-apple/`；Apple Hybrid，清爽学习内容 + 半透明导航、细腻环境渐变和弹性反馈，移动端单一六项悬浮 Dock。
- **Skill 工作流**：`little-works/xiaoya-studio/`；偏编辑式个人成长工作台，深绿树芽身份、暖白纸面、真实课表/任务优先、扁平信息结构，手机保留品牌栏和六项底部导航。

两个版本从 `opc-agent/public-pages` 的已完成 Pages 功能镜像构建，并在独立子目录引入 `comparison.css`。课表、任务、目标、复盘、匿名演示和 BYOK 入口仍是原始业务代码，没有替换成仅展示的空界面。原版 Pages 不被覆盖。每个实验版独立命名浏览器本地数据键，因此不会自动载入原版私人档案或模型配置。

**安全边界说明**：三个页面都部署在 `ndshuge.github.io` 同一浏览器 Origin；不同存储键只是主动读写隔离，**不是浏览器级的安全隔离**。不要在公开演示与不可信设备上保存 API Key；实验版默认不会从原版恢复 Key，且没有已验证的真实模型调用。

## 实际设计工作流与取舍

1. Taste-Skill：读取 `design-taste-frontend` 的 app-screens 规则；实际执行 2026-10-25 `draw.mjs --app --kind workspace`，得到「Editorial greeting」方向（seed 1270551934）。采用从真实数据得出的问候、平静背景、轻面板、真实任务顺序；拒绝虚构 KPI、大面积渐变 KPI 卡和过多装饰标签。对照源码选择器为 `.hero`、`.overview-grid`、`.bottom-stats`、`.side-nav`。
2. Designeer：访问 `https://designeer.xyz/resources` 和 `https://designeer.xyz/inspiration`。检查资源条目 Fontshare（原站 `https://fontshare.com/`）和动态参考 60fps（原站 `https://60fps.design/`）。Fontshare 专为拉丁字形设计的字体未强加给中文小芽，因此采用系统中文字体与华文宋体的回退；60fps 仅参考“操作引起的反馈而非持续无意义动画”，没有下载或转用其中的视频素材、第三方设计代码。
3. Apple Web Design OS：读取安装的 `apple-web-design`、本机 Apple Web Design OS 工作流及其现有 `apple-liquid-glass` 思路。采用 **Hybrid**，玻璃用于导航/重叠层，而非所有卡片；保留 CSS 无透明、减少动效后备，不强制 React/WebGL。
4. 原有小芽身份：继续使用项目自己的桌宠图、课程与任务业务逻辑、审批/撤销流程；不向任何第三方复制私有数据。

## 视觉核对及修复

- 原版作为桌面基线图保存在本地 `evidence/xiaoya-compare-original-desktop.png`；新版本真实 Edge 桌面/手机截图保存在本地 `evidence/xiaoya-{apple,studio}-{390,1440}-after.png`。
- 修复窄屏“小东西”星轨装饰横向溢出。
- 真实操作核对发现移动端复盘入口过于隐蔽、两套导航重叠，已改成两版各一套六项底部导航。
- 去除无意义的英文字段 `YOUR LITTLE MOMENTS`，保留有实际意义的动态日期。
- 保留真实 UI 的空白、合成演示、离线和 AI 未接入状态，不伪造个人数据。

## 验收

实际在 Windows Edge/Playwright 运行 `node qa-xiaoya-compare.cjs`（需安装 `playwright-core`，或使用 `PLAYWRIGHT_MODULE_PATH` 指向本机已安装的模块；本地静态服务端口 18925），**52/52 通过，0 JS 页面错误和资源错误**。断点 320、390、768、1440px；核对页面 200、入口三链接、无横向溢出、六个功能页切换、独立数据键与主题、实际截图。数据：本地 `evidence/xiaoya-compare-qa.json`。

尚未验收：实体 iPhone Safari 触摸手感；真实付费 AI Key 请求（未使用用户 Key）；最终美感由用户对比决定。上述回归记录只能证明已测试的功能路径，不代表绝对无缺陷。
