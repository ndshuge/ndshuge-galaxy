# SHUGE V4 — Engineering & Visual QA (2026-10-30)

## Release
- Public: https://ndshuge.github.io/ndshuge-galaxy/little-works/shuge-in-progress-v3/
- Release commit: 04e1ce749aa75ee9782f8c221f23b3aced0b81b4
- In place upgrade of SHUGE V3. Old `little-works/personal-homepage/` and other artworks unchanged.

## Actual motion runtime
- **GSAP 3.15.0** installed with npm, pinned copies `assets/gsap.min.js` and `assets/ScrollTrigger.min.js`.
- `assets/v4-motion.js` imports their browser globals; runtime verified via `window.__shugeV4.engine === "gsap"`, `version === "3.15.0"`, `scrollTrigger === true`.
- Functions: staggered wordmark opening; coordinated typography; reversible scroll-scrub links; masked project covers; art parallax; source-relative gallery dialog; interruptible mobile menu and accordion; touch press; SVG icon replacement; reduced motion opt-out.
- V3 Canvas 2D electronics/music instrument preserved. Native touch scrolling retained; Lenis / additional heavy 3D engines deliberately not introduced.

## Visual review
- Round 1: baseline + screenshots showed V3 green tint leaking into split-letter wordmark and Unicode up arrow in footer.
- Fixes: explicit headline ink for split letter descendants, SVG up arrow and accordion glyphs, revised phone spacing, navigation and safe-area rules.
- Round 2: reviewed 320/375/390/430/1440/1920 screenshots and 390/1440 public URL screenshots. V3 editorial identity remains recognisable, headline is fully legible, touch elements have a consistent form. Human art approval is independent and pending.

## QA evidence
- `v4-smoke.cjs`: six viewport widths **320, 375, 390, 430, 1440, 1920**, no horizontal overflow or page errors.
- Tests cover: menu fast toggling / Escape, modal Escape / rapid close, accordion rapid reversal, basic reduced-motion functionality, scroll down and up.
- Interactive UI Unicode glyph scan: six empty lists (no arrows/× remaining as user-visible direct button text).
- Public site live test: **390 and 1440**; GSAP and ScrollTrigger load at 3.15.0, V4 CSS/JS assets loaded, main dialog and mobile menu work, no JS page errors.
- Real headless Chromium CDP capture: 290 browser frames; timestamp-based FFmpeg encoding gives a ~5.92-second clip. This is actual browser-frame evidence, **not a measured native 60fps iPhone recording**.

## Incomplete / limitations
- Real physical **iPhone Safari remains UNTESTED**: Windows Edge/Chromium mobile emulation is not a substitute.
- JS/CSS fallback is maintained; the advanced motion layer requires JavaScript and local GSAP assets.
- Full 60/120 Hz frame-pacing and Safari GPU profiling NOT RUN. Screenshot and simple JavaScript error counts do not certify motion quality.
- Personal media is still original concept illustration, not user's actual recordings/photos. No invented assets presented as real photos.
- SHUGE Motion Studio was not available as a separately mounted native runtime in this session. Motion and UI Fidelity Skills were read; the actual engine used is pinned GSAP, not a claimed Motion+ integration.

## Artifacts
- `evidence/v4-mobile.png`, `evidence/v4-desktop.png`: screenshots of actual GitHub Pages after deployment.
- `evidence/v4-motion-proof.mp4`: verified CDP browser-frame motion clip (timing based on captured frame timestamps).
- `assets/v4-motion.js`, `assets/v4-motion.css`: editable authored motion layer and mobile refinement.
