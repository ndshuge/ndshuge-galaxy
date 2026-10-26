# 时序 · Skill 应用与验收

## 2026-10-26 系统级界面收口（v3）
- **Reference → Method:** Apple HIG Materials recommends Liquid Glass primarily for floating navigation, not content cards; HIG Typography provides a 34pt large title / 17pt body baseline. Applied this as a product-specific decision rather than equating more blur to better glass.
- **ACTION:** Added final `system-v3.css` with neutral content surfaces, restrained border/shadow and consistent 34px title / 16px day labels. Removed the redundant mobile brand bar. Moved mobile Dock into the real layout between calendar and agenda rather than a fixed overlay. Replaced `lg-dock backdrop=body` (which cloned a mismatched background and produced dirty gray bands) with its original SVG optical **backdrop** mode; retained moving highlight and spring interactions without moving text or hit targets. Simplified empty-day copy.
- **PROOF:** Visually reviewed Edge light/dark 390×844, compact 320×650, and desktop 1440×900 before and after. Six viewport CDP QA now includes no overlap of Dock with date or agenda; validates `backdropFilter:url(...)`, highlight traveling spring, month/week, CRUD, reduced-motion paths and inverse broken-Skill wiring check. No third-party image assets or proprietary Apple font copied. Human art approval and physical iPhone Safari testing remain pending.
- **Remaining limit:** True iOS system compositor cannot be reproduced pixel-for-pixel in web CSS/SVG; the mobile navigation optic refracts content most visibly when a textured surface scrolls beneath it.


## 2026-10-26 修复文字重影与弹簧交互
- 使用已安装 `liquid-glass-web` Skill 原有的 `Surface` 光学折射和 `createSpring`，将旧 `lg-dock` 对按钮内容的浮动放大镜替换为 **位于真实可点击文字之下的移动光学高亮**，消除重影、独立圆泡和点击区域漂移；Dock 背景使用 Skill 的已知背景复制模式 `backdrop="body"` 与 SVG `feDisplacementMap`，在支持的浏览器上真正折射背景。
- 按 Motion Skill 的短反馈、状态驱动与可访问性原则，把动效限定在高亮平移和弹层开启；按钮本人不缩放。短屏幕月历采用 48–54px 日期行高，给浮动控制保留足够的底部滚动安全留白。
- 实际六视口 Edge 回归包含按钮位置不变、无文字折射副本、光学实例和弹簧、移动中间帧与落点、释放后保持与消退、日程 CRUD、月/周切换，且在 320×650 检查 Dock 不遮挡已选中日期。实际审查 `qa-motion-travel-390.png`、`qa-glass-hold-390.png` 与手机稳定帧。
- 仍需在真正 iPhone Safari 上评估多帧手感及苹果原生材质相似度；**不得把 Edge 中的真实滤镜检验描述成原生 iOS Liquid Glass 全面验收**。


## 2026-10-26 Apple type and sustained optics validation
- Actual Apple reference consulted: HIG typography (default iOS body 17pt; large title 34pt; supporting roles 13–22pt) and Materials/Motion guidance (Liquid Glass is a control/navigation layer, not whole content). Web CSS sizes are an adaptation rather than literal device point equivalence.
- **METHOD**: Existing `liquid-glass-web/SKILL.md` provides genuine `lg-dock` with `createGlass` SVG optical displacement and `createSpring` interaction; its upstream default immediately fades on pointerleave and a circular self-content lens makes duplicated labels. **ACTION**: Adapted bundled `components.js` *only in LgDock* to hold for bounded 850ms before spring fade, respond to touch down/up/cancel, preserve immediate reduced-motion exit, reshape the temporary bubble into a contained pill. Retained actual underlying optics, no clickable-button scaling. `ios-type-system.css` uses a deliberate 34/22/17/15/13 scale for hierarchy, increasing calendar/date/dock readability. Project `ios-dock.js` configures the hold interval, not an idle effect.
- **PROOF**: headless Edge project `quality-check.cjs` tests four breakpoints and the original features, checks real filter attachment and active lens, asserts it survives 470ms after release and falls below visual threshold after another 900ms. Inspected real `qa-type-new-390.png`, `qa-type-new-320.png` and `qa-glass-hold-390.png` after change. These are **local** and ignored by Git. Dynamic Safari/iPhone and user artistic approval remain pending.
- **Process correction**: A Skill being installed/read does not imply the use of its actual special behavior. Our prior release proved the SVG engine existed but failed optical dwell/readability. The existing Apple Web Design workflow now requires idle/active/release image inspection and typographic role review; no extra registry/system installed.
- **Disclosure**: True visual similarity to Apple's native compositor is not proven; the web engine can refract browser backdrops but not reproduce all Apple OS effects, and some copied-text distortions remain visible in active optical frames.



## 2026-10-25 mobile material refinement and actual QA
- Applied Taste workspace visual direction and system Settings / App Library reference hierarchy, retaining calendar-first content rather than generic dashboard labels.
- Added ios-dock.js with live Today, month/week and new event controls. The buttons delegate to existing calendar events and use the installed glass Skill createSpring method. Second iteration replaced its CSS-only rim with the installed upstream lg-dock component; the native-to-the-library Surface and pointer-following refractive lens now really initialize and animate. Optical SVG material also remains in the lg-segmented control and optics lab. This is a browser implementation, not Apple OS native Liquid Glass.
- Visually reviewed headless Edge screenshots at 390, 320, desktop and dark phone state. Found duplicate top controls and the Dock covering the selected date at 320. Removed redundant mobile navigation, compressed the narrowest grid, inspected again.
- quality-check.cjs now exercises mobile Dock month/week transitions and event creation, preserving existing browser functional and optical checks.
- Separately audited project discovery: xjtu-campus-3d (actively edited by Codex) was absent from the canonical registry despite FRESH index. Registered the existing checkout, added exact aliases and an README authority fallback; 14 route regressions passed. Does not prove independent cloud ChatGPT sessions automatically load local MD.


## 2026-10-25 iOS system-material refinement
- User references: iOS App Library dark translucent folder tiles and iOS 27-style Wi-Fi Settings light elevated grouped sheet. Studied reference images directly; **not** copy-pasting a static screenshot or using generated imagery. Adapted the layering to a usable monthly calendar.
- Implemented mobile and desktop `ios-finish.css`: system-like text scale and spacing, softer screen-wide diffused backgrounds, double-highlight material edges, clear rounded day controls, rounded bottom-sheet event editor, dark App-Library-inspired glass atmosphere.
- Added a persistent light/dark appearance toggle and a nonpersisting `?appearance=dark` screenshot-preview selector; reduced transparency/motion remain supported. Spring-based press feedback, modal entrance, date selection, view transitions and native optical segmented control stay functional.
- Iteration evidence: reviewed actual Edge captures `qa-ios-{320,390,1440}.png`, `qa-dark2-390.png`, and actual dialog screenshot `qa-modal-390.png`. Found bold day typography and a visible dialog scrollbar; reduced weight, locked background scroll when modal is open, removed scrollbar and **inspected again**. Kept visible content readable rather than placing high refraction across every cell.
- `quality-check.cjs` verifies four responsive sizes, creation/edit/delete persistence behaviors, actual SVG refractive filter, original lens demo, theme-toggle behavior and sheet scroll lock; run before delivery. Human preference and native iOS Safari fidelity still need external approval/testing.
- Design assessment: stronger system-inspired look, not pixel-for-pixel Apple native rendering, not a claim that CSS material alone is genuinely refractive. The true optical implementation remains in bundled `lg-segmented` and the `glass-lab.html` demo.



Scope: original calendar in Little Works, updated after `cbb44f4`. User brief: Apple-esque typography/material, **real** Liquid Glass and spring-like interaction; calendar features preserved. One real example, not a universal Apple equivalence claim.

| Skill | Distinct method | Action in source | Evidence |
|---|---|---|---|
| Apple Web Design | Content-first hierarchy; light, precise controls | `refined.css` rebuilt type scale, whitespace, dates and mobile layout | actual Edge screenshots 390/1440 |
| Taste-Skill / dual-source | before/after and product-specific visual review | visually reviewed `cbb44f4` live captures; improved contrast, day numbers and hierarchy, fixed 320px overflow after failing browser test | screenshots and quality-check runner |
| liquid-glass-web | `feDisplacementMap` through CSS `filter`; native `lg-segmented` refractive indicator; physical `createSpring` | copied unmodified `liquid-glass.js` + `components.js` plus upstream license, wired actual month/week custom element into `index.html` | live CDP confirms filter `url(#…)`, `lg-refract`, `xs.set`, month/week functional |
| Motion | Prefer compositor transform and physics-based controls, respect reduced-motion | `refined.js` uses `createSpring` for press handling and Web Animations transform/opacity for transitions | headless Edge interactions, reduced-motion CSS fallback; no claim of Motion library installation |
| Designeer | relevant layout/inspiration source, not a runtime library | previous workspace references used; no fresh original-page research in this iteration | mark as **not live reverified** |

Quality:
- `node little-works/glass-calendar/quality-check.cjs` PASS on Windows headless Edge: 320×700, 390×844, 768×900, 1440×900; month/week, add/edit/delete, overflow, module-based SVG filter, spring objects, no uncaught errors.
- A deliberate mutation removing the Glass component wiring is rejected.
- `.github/workflows/glass-calendar-check.yml` runs calendar checks on PR and main pushes. **Workflow alone does not prevent direct main pushes**, which requires a GitHub ruleset/branch protection.
- Additional `glass-lab.html` is an interactive standalone demonstration of **visibly bent, patterned pixels** using the actual upstream `lg-lens` custom element. Edge screenshot `qa-glass-lab-v2.png` showed real curving lines and directional chromatic highlight; refraction was then reduced from 29 to 21 for restraint. Browser QA now asserts the lab lens renders with nonzero height, a live SVG filter and a spring.
- Screenshots are inspected locally; native iOS Safari and Firefox remain untested. Artificial demonstration of refraction may be subtle on this almost-uniform pale background. This is authentic open-source SVG lens refraction, **not** the native Apple Liquid Glass compositor or guaranteed pixel equivalence. User aesthetic approval remains pending.
- No proprietary Apple image/font/code copied; demo only, persisted in browser localStorage.
