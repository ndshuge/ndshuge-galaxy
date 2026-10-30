# SHUGE — Personal Digital Archive V4
## Scope and original direction
This is an incremental refinement of the existing **little-works/shuge-in-progress-v3/** page, not a new portfolio or a replacement for `personal-homepage`. The V3 editorial wordmark, signal canvas, four project stories (Zhixu / Xiaoya / FactGuard / RoleVault), music / robotics / theatre / sport, 2026 timeline and current-life tabs are preserved.

## Tool provenance
- **Mice Hole**: connected Windows workspace and allowed read/write, execution and browser verification.
- **Apple Web Design / Motion Skill**: loaded for vanilla-JS guidance, animation trade-offs, accessibility and compositor-friendly properties. Method applied via GSAP/ScrollTrigger rather than claiming the Motion package was installed.
- **SHUGE UI Fidelity / Gesture Audit**: loaded for interruption, touch targets, focus, reduced-motion and safe-area checks; validated with browser tests and real screenshots.
- **Taste-Skill**: original local `lint.mjs` executed: 0 FAIL / 0 WARN on the edited sources. Original `inspect.mjs` executed at 390/1440 and reported residual product-specific findings below.
- **Designeer dual-source**: framework guidance reviewed; no claim of a full fresh Designeer source-site interaction audit in this iteration.
- **Actual engine**: local `assets/gsap.min.js`, `assets/ScrollTrigger.min.js` from installed `gsap@3.15.0`; browser inspected `window.gsap.version === "3.15.0"` with `ScrollTrigger.getAll().length === 25`. Both vendored; no CDN prerequisite. Original V3 Canvas 2D remains.

## What changed
1. Staggered, mask-based hero lettering; coordinated hero note choreography and scroll-responsive wordmark.
2. Reversible ScrollTrigger progression for the signal instrument, project cover apertures, section headings and life-art visuals. No forced smooth-scroll.
3. Animated mobile navigation with responsive full-height opaque overlay, touch feedback, custom SVG icon, Escape close and interrupted-state protection.
4. Project dialog origin-aware movement; animated close, focus return, quick-action response and updated dialog text contrast.
5. Timeline height animation and intermediate reversal safety; accessible ARIA expanded state.
6. Corrected mobile typography and two-line signal heading; strengthened timeline and project-description contrast.
7. Replaced functional arrow, close and accordion glyphs in markup with consistent SVG paths; retained meaningful scientific/typographic text and artistic illustration.
8. Reduced-motion version uses finished visual composition without scripted scroll animation.

## Test evidence
- Playwright / local Edge Chromium viewport checks: **320, 375, 390, 430, 1440, 1920** (0 horizontal overflow, GSAP 3.15 loaded, no JS page errors, no missing resources after adding favicon).
- Stress tests: 12 fast menu reversals, 11 timeline reversals, four project open/Escape/close cycles and 18 quick scroll turns **with and without prefers-reduced-motion**; all PASS in isolated local QA.
- Browser visual review: two rounds including `qa/390-menu.png`, `qa/390-years.png`, `qa/390-dialog.png`, `qa/390-signal.png`, `qa/1440-selected.png`, plus final six-width screenshots.
- Dynamic sample: 49 real Chromium screenshots of intro, scrolling and menu transitions stitched to `qa/mobile-motion-12fps.mp4`; a **sampled motion review**, not a native device capture.
- Output logs: `qa/fast-report.json`, `qa/story-report.json`, `qa/taste-r3/report.json`. Browser 390px mobile simulation is not genuine Safari.

## Remaining and accepted design-review findings
The original Taste inspector did **not** return universal PASS. Its remaining generic checks include: functional subject/category captions labeled 'eyebrows' (kept intentionally because they carry actual content context), a large art-directed wordmark pause, and missing personal photographs/footage. Real photography is not added without authentic approved assets; SVG artwork is labeled conceptual, not a real product screenshot. Other design warnings to revisit with real imagery: many small type-size variants, very small artistic annotations, occasional image-credit-like contrast and large desktop void.
A few static photos and authentic project screenshots would improve the record but are intentionally deferred until source files and permission are verified. True **iPhone Safari** and device-specific scroll/viewport behavior remain **NOT TESTED**; do not mislabel Chromium emulation as hardware verification. No claim of native 60 fps sustained performance.
## Release conditions
- Release only the five V4 source paths under `little-works/shuge-in-progress-v3/` plus a narrow QA evidence set, not other works.
- Build a new Git tree atop the **latest remote main**, check remote SHA before committing and again before fast-forwarding ref, set `force:false`; abort if a writer races ahead.
- Verify published HTML, all V4 assets, mobile DOM and project interactions through actual Pages URL. A matching local build/commit is not enough.
