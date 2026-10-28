# Apple Motion Lab R2.2 — Fluid Tab Scrub

2026-10-28. Source: existing R2.1 Apple Motion Lab, not a rebuilt prototype.

## Why R2.1 did not feel like the reference video

The user uploaded a **16.13s, 512×1112, 30fps** iPhone screen recording. It shows a light iOS-style bottom navigation bar whose selection lens *deforms* while the finger scrubs left-right, whose highlighted icon becomes blue, and whose glass compresses back on release. The recording does not show raw touch coordinates or Apple private animation parameters: exact spring constants cannot be inferred.

R2.1 correctly moved the glass position and committed the tab after touch-up, but it called `nav.xs.set(x,{immediate:true})`. The native `createSpring` implementation resets velocity to zero on an immediate update, so `LgNavbar.render()` saw no velocity-based stretch. R2.1 also intentionally quantized squish to suppress regeneration of a displacement-map PNG. The result was a *rigid pill that slid*, not an elastic glass lens.

## R2.2 corrective work

- **Still reuses the installed liquidglass.dev optical engine.** `createGlass`, its SVG `feDisplacementMap`, cached map generator, pointer-driven navbar and WebGL artwork renderer were retained.
- Extends the original Skill component's `LgNavbar.render()` with opt-in `data-scrub-active`, `scrubStretch`, and `scrubDirection`. The lens grows slightly more at the leading edge and lags at the trailing edge; shape is derived from velocity.
- Uses a **second real `createSpring`** from `lib/liquid-glass.js` for edge deformation; the first `nav.xs` still moves with the finger one-to-one. It is **not** a CSS easing illusion or a second fake pill.
- Quantizes optical shape into at most 7 active presets (0, 4, 8…28px) so positions move freely while the existing displacement-map cache is reused.
- Colors the preview icon blue during the held gesture. The clicked/committed page changes on release, while `pointercancel`, keyboard navigation, click, and reduced-motion retain the prior controls.
- Fixes the earlier R2 issue where re-selecting the first tab restored its outdated R1 headline.

## Actual browser measurements

On 390×844 Windows Edge CDP touch emulation (not iPhone Safari):

| Evidence | Observed |
|---|---|
| Lens width at rest | **112px** |
| Width during fast horizontal scrub | **140px**, with direction-dependent edge offset |
| Width after release | **112px** |
| SVG filter alive during motion | `filter: url(#lg3-v…)` |
| Lens map rasterizations during first tested scrub | **7 extra** discrete cached shapes |
| Additional lens-map rasterizations during second scrub | **0** |
| Icon color during middle tab preview | `rgb(181, 208, 255)` |
| R2.2 fluid shape optical testing | `evidence/nav-scrub-r22/fluid-qa.json`: **8/8 passed** |
| Existing original page regression | **28/28 passed** |
| Existing stress, GPU, Web Audio, reduced-motion tests | **14/14 passed** |
| Existing four-viewport press-and-scrub test | **28/28 passed** |

Real screenshots of the live Edge rendering are retained as `fluid-mid.png`, `fluid-reverse.png`, `fluid-released.png`; these are **our** app, not copies of the user's private recording.

## Remaining gaps

The user's reference contains four tabs and a light system glass; our product intentionally retains its three-tab dark Apple Music-inspired layout. Apple UIKit's native light transport, haptics, exact shader shape, drag latency and spring response remain **unverified**. No access to Apple proprietary gesture curves or haptic engine is claimed.

This refines the existing product only. No other projects, global library Skill assets, or R1/R2 rollback points are modified.
