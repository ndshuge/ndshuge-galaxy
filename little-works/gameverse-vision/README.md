# GameVerse Vision
2026-10-29 independent Apple-inspired, reference-led gaming gallery in 鼠哥星系 → 小东西.

**New path:** `little-works/gameverse-vision/`. The previous `gameverse/` and `arcade-library/` apps are untouched.

## What works
- Responsive 3-column macOS-style layout and mobile iPhone-style shell, safe-area glass Dock and top navigation; 320/390/768/1440/1920 widths verified in headless Edge.
- Hero carousel, game library, recent/installed/favorites categories, sorting, keyboard search (⌘/Ctrl K) and Escape, game detail dialog, persistent favorites and opened-game history, pointer/long-press, accessible focus and motion preferences.
- **16 immediately playable original SHUGE browser games**, linked to `ndshuge-game/games/<slug>/`.
- **14 commercial game showcase entries** are NOT browser-playable. The detail button explicitly says “前往 Steam 商店”; numerical progress, account and online friends are sample data, not claimed real integrations.
- The hero More control uses `glasslib/liquid-glass.js` with an SVG displacement filter on a correctly aligned, local background copy (actual optical refraction on Chromium/WebKit/Gecko when supported); other glass elements use frosted L1. Browser semantics do not imply native SwiftUI `glassEffect`.

## Image provenance and limits
- Cover and promotional imagery retrieved from Steam CDN `cdn.akamai.steamstatic.com/steam/apps/<appId>/`, not created or owned by this repository. Titles, character artwork and Steam marks belong to their respective owners. This is an unofficial, non-commercial fan showcase linking to their official Steam store pages. Rights and redistribution must be assessed before commercial use.
- Alpine wallpaper copied from an earlier project-owned Galaxy GameVerse asset. Do not republish for commercial use without source-license confirmation.
- Genuine social connections, game synchronization and paid game launching are not implemented.
- iOS Safari on a physical iPhone is **not** covered by Windows Edge screenshots.

## QA
`node --test tests/gameverse-vision-static.test.cjs` and `node --check little-works/gameverse-vision/app.js`.
Automated Edge interactive QA file: `E:\CHATGPT\gameverse-qa\qa-gameverse-vision.cjs`.
