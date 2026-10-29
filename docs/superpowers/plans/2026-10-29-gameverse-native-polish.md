# GameVerse Vision Native Polish Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Make already published GameVerse Vision feel more Apple-native without fake macOS system chrome.
**Architecture:** Pure HTML/CSS app shell and a small ES module reusing the existing liquid-glass engine's spring API; no framework/dependency changes, no edits to other products.
**Tech Stack:** Vanilla HTML/CSS/JS, bundled original liquid-glass engine, node:test, headless Edge.
**Spec:** docs/superpowers/specs/2026-10-29-gameverse-native-polish.md

## Global Constraints
Only little-works/gameverse-vision/ plus related tests/docs; keep 16 web-game links and 14 separate AAA showcase links correct; no theme or system-overlay deception. Preserve native keyboard search, focus, reduced-motion/transparency and iPhone safe areas.

## Review Focus
- At 320px, spring active nav indicator does not overflow offscreen or eat clicks.
- At 390px, quick successive tabs retarget from current value without jump.
- Reduced motion jumps without animation; no JS error.
- Desktop window starts at brand, no fake macOS menubar or traffic lights; library rows show below hero.
- Body and progress text remain legible across bright and dark poster backgrounds.

### Task 1: Remove fake Mac chrome and reclaim viewport
- [ ] Add static test that fails while faux menu and traffic lights exist.
- [ ] Remove both DOM blocks and relevant CSS; add desktop app breathing/height and typography refinements.
- [ ] Pass static tests + desktop screenshot and inspect before/after.

### Task 2: Spring-linked navigation
- [ ] Add tests requiring shipped spring module and indicator structural semantics.
- [ ] Use original createSpring, not hand-written animation, for mobile top pills and bottom dock; align active pill by geometry, remeasure on resize/scroll.
- [ ] QA rapid taps, keyboard navigation, reduced motion, and search/modal regression.

### Task 3: Visual/release
- [ ] Capture 320/390/768/1440/1920; inspect images and iterate.
- [ ] Run existing static and site-level regression; check owned files and commit.
- [ ] Refresh origin/main → ordinary non-force publish → verify GitHub Pages and existing old routes.
