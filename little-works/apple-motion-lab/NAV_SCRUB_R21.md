# Apple Motion Lab R2.1 — Bottom navigation press-and-scrub

Date: 2026-10-28. Branch: `feature/apple-motion-lab-navscrub-20261028`.

## Defect

R2 used `lg-navbar` from the ChatGPT-native Liquid Glass for the Web Skill, but the bundled implementation primarily handled `pointerenter`, `focus` and `click`, with a spring that moved to each tab's target. A touch held on the first button did **not** continuously drag its optical selection indicator over the others. This difference is especially visible on iOS 26, where the selection bubble follows a hold-and-slide gesture.

## Implementation

- Added `lib/nav-scrub.js` as a **controller around the real Skill component**; no custom Shader, SVG refraction or fake CSS highlight was implemented.
- On primary pointer down: capture the pressed button's pointer and enter a held state; preserve committed `aria-current` and the current page.
- On horizontal pointer move: compute the clamped position and directly drive the existing `lg-navbar.xs` spring via `set(x,{immediate:true})`, keeping the glass element under the finger (1:1) while previewing the nearest tab. Highlight and press feedback use the original glass/motion engine.
- On release: commit the nearest tab, hand control back to the existing spring, and suppress the original pressed button's following synthesized click. On `pointercancel` or strongly vertical movement, restore the previous selection.
- Keyboard, click, focus, reduced-motion fallback, player and all previous navigation functionality remain.
- Three equal-width CSS grid columns stabilize the lens geometry. A one-line quantization in the **existing** `LgNavbar.render()` squish calculation (2 CSS-pixel steps) prevents subpixel spring variations from invalidating the cached optical displacement map. The bundled engine is otherwise unchanged.

## Verified tests

| Test | Result |
|---|---|
| `scripts/qa-nav-scrub.cjs`: real Playwright Edge pointer/CDP touch, 320 / 390 / 768 / 1440 px; 4 stages and traditional click | **28/28 passed** |
| `scripts/qa-nav-reversal.cjs`: seven left-right reversals, preview, release, WebGL displacement-map canvas exports | **5/5 passed** |
| Existing functional regression, run on this branch | **28/28 passed** |
| Existing GPU, Motion, visual-transition, Web Audio and fallback stress regression | **14/14 passed** |

Source `evidence/nav-scrub/qa-nav-scrub.json`, `qa-reversal-cache.json`, and screenshots `390-held.png`, `390-scrub-mid.png`, `390-scrub-last.png`, `390-released.png`.

The optical SVG filter remains active in all tested widths. In the repeated reverse-drag test, number of `canvas.toDataURL()` exports stayed at **3 before and 3 after** (initial engine maps included); moving the refractive lens did not rerasterize the map. This counts rasterizations in the observed Windows Edge test, not every possible device/buffering pathway.

## Remaining differences

- **Not an actual iPhone Safari test**; all touch events were issued by Chromium DevTools in Windows Edge.
- The bubble's haptic feedback, native UIKit/SwiftUI system compositing, precise Apple Music finger lag, and resistance/overshoot curves are unverified.
- A press started from within the bottom navigation prevents page scrolling until release; intended for a navigation tab bar.
- This builds on existing R2; no original R1 functionality or other `little-works` product has been replaced.
