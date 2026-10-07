# Math Universe

一个本地实时运行的交互数学视觉实验室。不是预录动画：每个展厅都直接计算对应的数学系统，并把状态映射为粒子、光、波纹或分形边界。

## Worlds

1. **Reaction–Diffusion** — Gray–Scott 反应扩散：细胞、珊瑚、迷宫和斑纹。
2. **Chaos** — Lorenz 系统：数千粒子形成奇异吸引子，并展示初始条件敏感性。
3. **Gravity** — Newtonian N-body：三体、双星捕获、引力弹弓和尘埃轨道。
4. **Waves** — 2D wave equation：双源干涉、双缝衍射、驻波。
5. **Fractal** — Mandelbrot / Julia：GPU 实时迭代与无限缩放。
6. **Field** — Vector fields：涡旋、偶极、鞍点、双涡混合。
7. **Synchrony** — Kuramoto model：从无序相位到集体锁相的同步相变。

## Local launch

双击：

`Start_Math_Universe.bat`

项目会在本机启动静态 HTTP 服务并打开总入口：

`http://127.0.0.1:8765/home.html`

## Files

- `home.html` — 总入口
- `index.html` — Reaction–Diffusion
- `chaos.html`
- `gravity.html`
- `waves.html`
- `fractal.html`
- `field.html`
- `synchrony.html`

## Gallery deployment

目标展位：`ndshuge/ndshuge-galaxy/art/math-universe/`

艺术回廊入口：`ndshuge/ndshuge-galaxy/art/index.html`

展品名：**数学宇宙 / MATH UNIVERSE**
