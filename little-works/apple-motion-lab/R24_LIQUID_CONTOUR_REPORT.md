# Apple Motion Lab R2.4 — Liquid Contour + Static Ghosting Fix

**Scope:** continuation of the existing Apple Motion Lab; no new app, no feature removal. Release base: R2.3 `8e89899`. User reference: their previously uploaded iOS screen recordings (do not copy private video to public GitHub).

## What was actually wrong

**Resting ghosting had two distinct causes, confirmed in Windows Edge:**

1. `lg-navbar` contains both three real buttons (accessible interactive controls) **and** a copied `lg-nav__copy` optical layer. At idle, both were `visibility: visible`, creating visibly doubled icons/text.
2. With a dark substrate near `rgba(...,.54)`, the underlying scrollable `Daybreak` music list remained legible through the navbar. This was background bleed, not icon refraction.

The user's comparison video shows crisp, non-doubled rest states and brief **gesture-only** content distortion. Simply increasing blur or adding more spring stretch could not fix this.

## R2.4 implementation

**Static ghost fix:** At rest, only original accessible buttons are visible; optical copies are hidden. During a held press-and-scrub gesture, the originals' visual children become hidden and the original Skill's optical copy becomes visible. On release/cancel, the original sharp ink returns. The nav substrate is `rgba(30,29,43,.88)` with 17px moderate backdrop blur, so background text cannot form a second visual label. There is *no global blur on original labels*.

**Real opt-in irregular lens:** Added `lib/fluid-contour.js`, a signed-distance model with a localized bridge/pinch and velocity-dependent directional asymmetry. The same field drives both (a) real pixelwise normals and displacement-map refraction in the existing `liquid-glass.js` renderer and (b) the actual CSS clip-polygon of its original `lg-lens-shadow`. No duplicate custom shader, no fake second glass component. `fluidity=0` follows the original mature rounded-rect path byte-for-byte and never applies this contour to player/other controls.

**Motion:** Existing `createSpring` handles the lift and width. R2.4 retains the one-to-one pointer-driven position, release selection, cancellation and reduced-motion. Fluid shape energy is quantized into five levels and direction into a few cached states; pure translation does not rebuild displacement maps. Shape height is bucketed into 2px sizes. Original SVG filter and Apple Motion Lab's WebGL album renderer are still operational.

**Performance:** The first contour map implementation needed four/five expensive signed-distance evaluations per pixel. It was profiled, then optimized to compute a single Float32 distance field for the lens and derive normals by neighboring pixels. In the same Windows Edge headless 2× software raster benchmark of representative 148×70px dynamic contours, measured per-map times decreased from ~17–20ms to ~7–10ms. These are warm-run, environment-sensitive CPU/map+PNG timings, **not** frame rates, iOS Safari latency, or a quantitative Apple parity claim.

## Visual comparison and evidence

- `evidence/r24/r23-r24-side-by-side.png`: *actual* R2.3 idle and dragging screenshot vs actual R2.4, cropped to bottom area.
- `evidence/r24/before-idle.png`, `r24-idle-crisp.png`: same viewport, static duplicate vs corrected clear original text.
- `evidence/r24/r24-drag-fluid.png`: live irregular lens.
- `evidence/r24/fluid-qa.json`, `r24-nav-qa.json`, `reference-geometry-qa.json`, `optics-cpu-benchmark.json` contain machine-recorded details.
- `evidence/r24/taste/report.json`: the real Design Taste app Inspector, **not a pass**.

## Verification (local Windows Edge headless)

| Actual test | Result |
|---|---:|
| New R2.4 static/press/drag/release optical handoff (320, 390, 768, 1440px) | **25/25** |
| R2.4 fluid contour, chroma, cache and 2nd-swipe reuse | **8/8** |
| Pre-existing navbar press-and-scrub, touch/keyboard | **28/28** |
| Pre-existing app and mini/full player functional regression | **28/28** |
| Pre-existing GPU/audio/reduced-motion/70 retarget stress | **14/14** |
| Geometry and overflow in four viewports | **17/17** |
| **Total** | **120/120** |

No uncaught browser exceptions in these scripts. The resting optical copy is confirmed hidden, the original ink visible; on held gesture it reverses; on release it returns to crisp original. Observed navigation color background alpha ~0.88. The lens becomes an irregular `polygon(...)` only while moved, while a live `filter:url(#lg3-…)` is present. Held velocity changes the bridge field and both visible contour and SVG map.

**Design Taste remains partially FAILED**: gradient and covered-text FAIL, micro-label/tiny-text/app-title-size WARN. Fixing the specific resting navbar ghost is **not** a claim of wholesale Apple fidelity.

## Limitations and risks

The reference application has four tabs on a light **native iOS** bar. Apple Motion Lab intentionally retains three tabs, a dark Apple Music inspired aesthetic and is served through Safari / GitHub Pages. iPhone-specific system Liquid Glass optical synthesis, haptics, input latency and low-power behavior are not accessible to this Web project. **No genuine iPhone Safari test has been performed**; Windows Edge touchscreen CDP is not one.

Native WebKit SVG filter/cache and Chrome timing can differ. Active contour rasterization remains a main-thread operation on first shape visit; it is cached for repeat visits. This work is a better evidence-backed approximation, **not a certified 1:1 pixel replica**.

### Native Skill audit

- `Liquid Glass for the Web`: **reused and run** its `createGlass`, `createSpring`, SVG filter graph, cache, optics profile and Web Components. Original engine and default rounded-rect path retained; added opt-in contour branch for navigation only.
- `Motion`: existing Motion engine for player shared-element and main spring remains integrated; nav shape uses *Skill-bundled* `createSpring` (not mislabelled as new Motion integration).
- `Design Taste Frontend`: actual `inspect.mjs` and screenshot artifact run; failures disclosed.
- `Apple Web Design`: design reference, visually compared user's own screen recordings and actual Edge screenshots.

Release SHA, online checks and dates to be determined by final GitHub Pages verification, not invented here.
