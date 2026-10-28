# Zhixu Apple Edition · R2.2 Navigation Stabilization and Ghosting Repair

Date: 2026-10-28. Scope: only `little-works/ai-academy-apple/`.

## Reproduction from the user's actual iPhone recording
The user recording demonstrates transient superimposed page text during tab changes and blurred/doubled icon labels in the floating navbar. The recording is PRIVATE; it is not committed or published. This report distinguishes measured Windows Edge results from unverified iPhone Safari behavior.

## Sources reused from actual Apple Motion Lab R2.4
- Source: `little-works/apple-motion-lab/lib/nav-scrub.js` (R2.4 release `39e3456`); installed as `assets/motionlab-nav-scrub.js`. Actual source implements pointerdown/drag/preview/release, cancellation, direction and spring navigation; no independent fake navigation engine. It imports the existing Liquid Glass Skill `assets/liquid-glass.js` `createSpring`, `lg-navbar`/optical controller, rather than importing a CSS imitation.
- R2.4 engineering correction: real buttons and duplicated `lg-nav__copy` text were simultaneously visible. The Motion Lab fix hides the optical clone in idle state. For Zhixu's **light, five-tab** dock, the first screenshot review showed colorful ink fringing on press. The finalized adaptation retains original readable text **throughout** press and drag, hides all optical text copies, and allows only the underlying glass lens to move. The dark R2.4 substrate and fluid contour shader are deliberately NOT copied because they do not suit the light educational UI.
- `nav-integration.js` routes on pointer release using the actual Zhixu `setView` app API; ordinary keyboard and tab navigation remain available. No V2 or Original engine logic is copied.

## Root causes and fixes
1. Old `document.startViewTransition(render)` snapshot animated the **entire document**, showing two versions of text simultaneously for 230–440 ms. Removed; on navigation the old view is gone synchronously, only the new DOM tree receives a short native Motion animation (unless reduced-motion).
2. Initial fallback HTML → first app render → store import second render → R2 observer mutation → R2.1 observer mutation caused cascaded layout changes. Initial fallback title matches the final title. Boot now waits for storage once before its single initial application render; `r2-present.js` applies title/science chart/course diagrams **synchronously** inside `renderView`. Both optical MutationObserver overlays are no longer loaded.
3. `lg-navbar` was showing the real icons and a cloned refractive icon layer simultaneously. Real icons always visible; clone always hidden. The light dock substrate is opaque enough to mask underlying reading text with moderate (17px) blur instead of extreme blur.
4. `lg-segmented` also had refractive cloned text; now its duplicate label layer is hidden. Real selected label remains on top.
5. Unnecessary success toast was covering study text after the Original iframe connected; persistent `#bridge-state` continues to convey this status, failure toast retained.

## Local QA (Windows headless Edge, not real Safari)
- `qa/test-stable.mjs`: **30/30** original question/scientific data/V2 record regression.
- `qa/extended-stable.mjs`: **20/20** EvoWorld, second experiment, long press, BYOK settings, reduced motion.
- `qa/first-paint-stable.mjs`: **6/6** JS blocked content/fallback, 390 and 1440.
- `qa/motion-stability.mjs`: **10/10** widths 320/390/768/1440, one scientific illustration, one crisp label layer, actual Motion Lab press and finger-follow, on-release commit, 12 repeated retargets.
- `qa/motion-negative.mjs`: **6/6** gesture cancel, keyboard Enter, reduced motion, 60 repeated tab changes, no success toast overlay.
- Evidence screenshot frames: `qa/stable-before-390.png`, `stable-held-390.png`, `stable-drag-390.png`, `stable-release-390.png`, `stable-desktop-1440.png`. Gesture frames captured live with Playwright; user video not embedded.
- Separate Motion Lab R2.4 itself had its own validated source tests; its figures are **not** counted as Zhixu tests.
- Real-device iPhone Safari, touch latency and optical fidelity **UNVERIFIED**; do not claim Apple 1:1 parity.

## Safety
- Original Edition source, competition submission, V2 data schema, science simulation API, scoring, and AI key storage untouched.
- Repo isolated in `E:/CHATGPT/work/zhixu-stable-nav-20261028`.
- Publish only with fresh remote GitHub HTTPS check `E:/CHATGPT/_system/git-safe-https.ps1`, OpenSSL + live fallback 7898 when verified, scope check, ordinary non-force push. Post-deploy online QA required.

## Production verification completed, 2026-10-28
- Release commit `c11cb164a4eb4f55a3a1044cd4e0af5dc379a7be`, regular non-force push on top of Apple Motion Lab R2.5 remote `a137c67`, protecting all other work.
- Actual GitHub Pages browser + HTTP test `qa/r22-online.mjs` **13/13 PASS**: HTML and five required new/core JS/CSS assets HTTP 200; one rendered scientific chart; cloned navigation labels hidden, crisp originals visible; Motion Lab navigation module live; Original real pretest selectable only after user input; grading works; tab return remains crisp; zero JS/HTTP exceptions; Original Edition HTTP 200.
- Online screenshot `qa/r22-live-390.png` reviewed, no old engine-success toast blocking teaching content. This is Windows Edge headless evidence, **not** real-device iOS Safari verification.
## User-recording reproduction (2026-10-28)
The user-provided 9.9s iPhone recording at 19:23 showed obvious full-page duplicated typography during tab switches (and double-ink under the glass dock). This predates R2.2 commits at 19:40–19:44. Independently reran the **live** R2.2 Pages site after deployment, using the user's observed learn → today → courses → learn → courses → today → learn sequence at 390px and 430px viewports with touch emulation: **16/16 passed**. At each route: only one #main>.page, no active document View Transition snapshots, `#mobile-nav .lg-nav__copy` invisible, active tab equals route, no overflow, no uncaught errors. Recorded 30ms intermediate frames (in addition to the older local gesture studies). Repro script `qa/user-video-repro.mjs`, JSON `qa/user-video-repro/report.json`, representative screenshots in same folder. This is Windows Edge / Chromium mobile emulation; **true iPhone Safari behavior and on-device touch compositor remain UNVERIFIED**.