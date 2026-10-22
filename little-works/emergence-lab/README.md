# 涌现实验室 · EMERGENCE LAB

鼠哥星系 / 小作品的第二个公开作品（2026-10-22）。

十四个独立、可交互的局部规则模拟：原有的彩色粒子汤、挑剔的邻居、发光菌丝、三色生态战争、搬沙虫、萤火虫同步、最小进化池；V2 增加自组织鸟群（Boids）、化学花纹（Gray–Scott）、生命游戏、分形结晶（DLA）、森林火灾、蚂蚁觅食、幽灵堵车。

## 操作

- 在顶部切换十四个世界；通过右侧参数滑块改变规则；每个参数都有「↑ 调高」「↓ 调低」的影响说明和可展开的原因解释；画布支持鼠标或触摸点击、拖动投放。
- 播放 / 暂停 / 单步 / 重置 / 新随机种子 / 速度调节。
- 打开 A/B 后自动同步两个世界的初始随机种子，B 世界只改变该模块第一个参数；画面上下（手机）或左右（桌面）比较。
- 页尾提供规则解释、一键实验挑战；侧栏实时指标、配方收藏与恢复、复制分享链接及 JSON 导出。
- V2 提供一键开启 A/B 比较、随机生成参数和初始条件参数的「重置生效」提示，桌面和手机均适配。

## 说明与局限

本项目为 **教学探索模型**，不是社会或生物真实预测。Schelling 邻居与 Physarum 使用简化变体；粒子交互、三色循环生态、搬沙虫、相位耦合与进化池均为原创的轻量浏览器算法。

可复现：每次重置恢复同一随机种子和初始条件；AB 在启用时重新开始、改变一条规则。实时调参可能改变后续随机数消费顺序；可重复比较的是同规则同种子在同一程序版本下的初始演化，不保证跨未来版本或不同浏览器的浮点逐位一致。

## 参考

- https://particle-life.com/about/implementations.html
- https://ccl.netlogo.org/netlogo/models/Segregation
- https://github.com/nicoptere/physarum
- https://ccl.netlogo.org/netlogo/models/
- https://www.complexity-explorables.org/topics/
- https://lifelabs.online/en/experiments

只借鉴模拟范式和交互启发，不包含上述项目源码。V2 的模型均为教学近似实现，非实验或社会结果的精确预测。

## 运行与验收

纯 HTML/CSS/JavaScript，无编译依赖。直接打开 index.html 可本机使用；如果希望分享链接，请从 GitHub Pages 的 HTTPS 地址访问。

本地基础 QA：`node little-works/emergence-lab/qa.cjs` 测试原七模型。V2 QA：`node little-works/emergence-lab/qa-v2.cjs`，Windows Edge 无界面测试 1440 / 390 / 320px，全部十四模型、参数解释、基本控制、A/B、公平随机起点、手机布局，全部通过，无页面脚本异常及横向溢出。

行为 QA：`node little-works/emergence-lab/qa-v2.cjs`，十四种模拟同种子 A/B 初始画布像素相同、推进 12 步产生实际演化并出现因规则不同的画面差异。加长行为 QA：`node little-works/emergence-lab/qa-v2-long.cjs`，十四模型分别推进 100–260 步、无异常数值；可验证蚂蚁成功送回食物、交通出现低速车群及单参数 A/B 编辑。

公开版（2026-10-22）：https://ndshuge.github.io/ndshuge-galaxy/little-works/emergence-lab/ 。`node little-works/emergence-lab/public-smoke.cjs` 验证公开地址 HTTP 200、7 模式、2 画布、目录卡片和交互无错误；`public-layout-check.cjs` 验证线上 375px 的移动端面板宽度、无横向溢出。发布时保持了既有“小作品”目录其他条目不变。
