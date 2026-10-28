# Apple Motion Lab — Deep Skill Utilization Audit
Date: 2026-10-28. Environment: ChatGPT native Skill read + Mice Hole Windows execution only; no Codex/other Agent performed construction.

## Global policy verified
E:/CHATGPT/AGENTS.md, final 54-line read; section "Deep Skill utilization — mandatory for Skill-relevant work (2026-10-28)" confirms: read full relevant Skill package including references/assets/scripts, reuse mature code before reimplementation, assign Skill responsibilities, distinguish native Skill read from local Mice Hole file access, test actual code running (not merely an import), and label discovery vs test status. Also enforces isolated Git worktrees and nonforce publication.

## Skill integration evidence

| ChatGPT-native Skill | Relevant source actually read | What is actually in product | Runtime/test evidence | State |
| --- | --- | --- | --- | --- |
| Apple Web Design | skill.md; composition / material / mobile QA guidance | Information architecture, immersive music grammar, safe areas, continuous gesture design | Real 390/1440 screenshots; responsive layout and click tests | READ → APPLIED → INSPECTED. No independent binary engine |
| Apple Liquid Glass | skill.md, motion.md, app.md, tokens.css, LICENSE | Exact lib/apple-tokens.css used in index.html; spring/safe-area guidance | stylesheets loaded in browser; responsive tests | READ → INTEGRATED → RUNNING; mainly tokens and guidelines |
| Liquid Glass for the Web | skill.md, assets/liquid-glass.js, components.js, glass-webgl.js, references/components.md, patterns.md, browser-quirks.md | Exact three ES module sources copied from installed native Skill. app.js imports createGlassRenderer; components.js registers lg-navbar and lg-segmented and instantiates underlying SVG filter engine. GPU canvas renders actual source image with displacement texture via updateLens(x,y). | Edge diagnostic webgl=true and componentNavbar=LgNavbar/componentSegmented=LgSegmented; readPixels=[249,198,192,255] alpha 255; qa-report.json L2/L1 switch and navbar checks | READ → INTEGRATED → RUNNING → TESTED (Edge). **Safari not tested** |
| Motion | skill.md; best-practices/motion.md, css-or-motion.md | NPM free motion@14.7.1 browser bundle vendor/motion.js. app.js imports animate/motionValue; spring with stiffness=430 damping=39; Pointer Events with capture, velocity handoff | 28/28 QA, including down/up drag, mid-animation reversed; perf 12 interrupted retargets at each viewport | READ → INTEGRATED → RUNNING → TESTED. Motion+ proprietary audit NOT connected |
| Design Taste Frontend | 43KB skill.md; references/app-screens.md; scripts/inspect.mjs, lint.mjs and required lib/*.mjs read natively | Browser look→defect→fix cycle; native Skill-supplied inspect.mjs executed via Mice Hole after source transferred to Windows; app-mode checked 1440 and 390 | evidence/taste-inspect/report.json & 4 screenshots. Contrast/tiny footer text subsequently improved; intentional dark media-specific gradients/glow flagged by app generic house rules | READ → QA SCRIPT RAN → FINDINGS REVIEWED; several taste-style checks remain failed or not rerun, not a clean taste pass |

All native discovery/reading used the ChatGPT skills API. Mice Hole read/modified E:/CHATGPT and ran the Windows build and browser; it was **not** used as a fake substitute for native Skill access.

## Originally easy to miss
1. liquidglass.dev includes a production SVG feDisplacementMap engine plus prefabricated navbar, segmented, and WebGL for canvas/video, not just blur examples. WebKit-specific filter id/map decode fixes, cached lens-map generation, and updateLens(x,y) are preserved in the actual reused sources.
2. Motion Skill's separate Motion+ runtime Performance Doctor and source searches require a paid Motion+ MCP server; unavailable, so no fictitious MotionScore is claimed. Tested the free Motion engine instead.
3. Taste-Skill exposes a real CDP-based browser inspector and app-screen exception mode. Actually executed it and preserved its report rather than just adopting its abstract style rules.
4. Optical engine is MIT © gentpan; Apple Liquid Glass tokens MIT © naplesblue; free Motion is MIT. See THIRD_PARTY_NOTICES.md.

## Custom work, and rationale
The native packages do NOT provide an Apple Music player, track selection, one-DOM shared player with continuous geometry, event capture and velocity estimation, or Web Audio synthesis. We implemented those orchestration layers ourselves and routed frame interpolation through Motion's real spring. The canvas refractor, map cache, navbar, segmented control and spring library were not reinvented. Source cover.svg is original illustration, not protected Apple album art.

## Actual tests
- Windows Edge (Chromium) mobile emulation 390x844, 1440x900 and 320x700; Playwright real click, mouse drag and CDP touch dispatch, plus JS runtime evaluation.
- 28/28 functional checks passed, 0 uncaught browser JS errors: evidence/qa-report.json.
- GPU actual pixels returned [249,198,192,255]; WebGL renders >0. Tested L1 off and L2 restored. This validates a running WebGL path, NOT pixel-level equivalence to Apple native optics. No GPU refraction A/B side-by-side quantitative optical accuracy comparison yet.
- 12 consecutive spring-target interruptions at each viewport and eventual settle to 1: evidence/performance.json. An additional repeatable independent stress script scripts/qa-stress.cjs produced evidence/stress-report.json: 12/12 passed, including **70** spring reversals, measured WebGL displacement-map uploads staying at 1 while the player moves, visual difference between L1 and L2, actual Web Audio playback, Escape close, press spring feedback, reduced-motion snap and hardware WebGL failure fallback. Headless Edge rAF sampled 201fps (390) and 240fps (1440) over ~2.3 seconds with SwiftShader; these are **unthrottled headless callback rates, not display fps** and do not indicate physical device screen refresh or energy efficiency. No actual iPhone Safari FPS measurements.
- Screenshots: qa-mobile.png, qa-desktop.png, qa-mobile-full.png, qa-desktop-full.png and original design-inspector output.

## Taste inspection detailed disposition
Taste's app-mode inspector did run and returned FAIL on gradient, button-fx, heavy-shadow, tiny-text, covered-text; WARN on micro-label, contrast, app-title-size. We improved tiny footer labels/contrast in subsequent CSS. Not all findings were resolved or the full inspector rerun. Editorial typography & art-driven dark gradients are deliberate Apple Music-like content design, so the skill's generic panel/landing rubric conflicts with this music composition. The covered-text metric is not independently proven a defect in a normal-use gesture (fixed miniature player/dock overlay can overlap content during scrolling); must be assessed on device, not suppressed. Do not report Taste gate as passed.

## Remaining differences from Apple-native experience
- HTML/JS cannot use private native iOS compositor materials, Apple system interpolation/shadows/haptics or display-link scheduling; glass refraction is synthetic WebGL/SVG, not genuine iOS glassEffect.
- No physical iPhone Safari gesture, smoothness, high-refresh, VoiceOver, safe-area keyboard, battery or power measurement. Screenshot widths / Chromium CDP touch simulation are only simulation.
- The background/unknown scroll DOM in Safari/Firefox may use frosted fallback rather than L2 refraction; Safari video compositing differences are documented in Skill references but not exercised on a Mac.
- Album art is original illustrative SVG, music is a simple synthesized ambience, not a fully-featured streaming Apple Music clone.
- Some Taste app-style findings remain; external native-equivalent visual comparison has not been pixel-matched with reference footage. No human quality approval collected.

## Publication scope
Only add little-works/apple-motion-lab/ and one catalog entry. Release from freshest remote main with isolated integration worktree, ordinary push and live Pages smoke; no other works overwritten. Publication evidence must be appended with actual result only.
