# XiaoYa Native v3 — implementation plan

> Independent branch, data schema and competition URL preserved.

**Goal:** Replace old layered DOM with a separate genuinely Apple-inspired application while retaining existing business logic.
**Architecture:** app-specific standalone HTML/CSS/JS; reuse ../core.js and ../domain.js (not old app.js or old stylesheets). Stable storage key for same-origin compatibility.
**Spec:** docs/superpowers/specs/2026-10-29-xiaoya-native-v3-design.md

- [ ] Inspect current implementation and real iOS Apple reference: capture baseline and record defects.
- [ ] Create semantic new mobile/desktop shell, Today tasks, contextual toolbar and nav.
- [ ] Implement tested safe persistence adapter and full create/edit/delete/completion flows.
- [ ] Implement calendar views with native timeline, goal/check-in, review data and settings.
- [ ] Preserve deeper features with safe advanced entry; compare parity before release.
- [ ] Test keyboard, touch, forms, cross-tabs, data validation, content overflow, screenshots and reduced motion.
- [ ] Publish independent preview, only switch production root when core regression and design gates pass.
