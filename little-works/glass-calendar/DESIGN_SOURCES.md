# 时序 · Skill 应用与验收

## 2026-10-25 iOS system-material refinement
- User references: iOS App Library dark translucent folder tiles and iOS 27-style Wi-Fi Settings light elevated grouped sheet. Studied reference images directly; **not** copy-pasting a static screenshot or using generated imagery. Adapted the layering to a usable monthly calendar.
- Implemented mobile and desktop `ios-finish.css`: system-like text scale and spacing, softer screen-wide diffused backgrounds, double-highlight material edges, clear rounded day controls, rounded bottom-sheet event editor, dark App-Library-inspired glass atmosphere.
- Added a persistent light/dark appearance toggle and a nonpersisting `?appearance=dark` screenshot-preview selector; reduced transparency/motion remain supported. Spring-based press feedback, modal entrance, date selection, view transitions and native optical segmented control stay functional.
- Iteration evidence: reviewed actual Edge captures `qa-ios-{320,390,1440}.png`, `qa-dark2-390.png`, and actual dialog screenshot `qa-modal-390.png`. Found bold day typography and a visible dialog scrollbar; reduced weight, locked background scroll when modal is open, removed scrollbar and **inspected again**. Kept visible content readable rather than placing high refraction across every cell.
- `quality-check.cjs` verifies four responsive sizes, creation/edit/delete persistence behaviors, actual SVG refractive filter, original lens demo, theme-toggle behavior and sheet scroll lock; run before delivery. Human preference and native iOS Safari fidelity still need external approval/testing.
- Design assessment: stronger system-inspired look, not pixel-for-pixel Apple native rendering, not a claim that CSS material alone is genuinely refractive. The true optical implementation remains in bundled `lg-segmented` and the `glass-lab.html` demo.



Scope: original calendar in Little Works, updated after `cbb44f4`. User brief: Apple-esque typography/material, **real** Liquid Glass and spring-like interaction; calendar features preserved. One real example, not a universal Apple equivalence claim.

| Skill | Distinct method | Action in source | Evidence |
|---|---|---|---|
| Apple Web Design | Content-first hierarchy; light, precise controls | `refined.css` rebuilt type scale, whitespace, dates and mobile layout | actual Edge screenshots 390/1440 |
| Taste-Skill / dual-source | before/after and product-specific visual review | visually reviewed `cbb44f4` live captures; improved contrast, day numbers and hierarchy, fixed 320px overflow after failing browser test | screenshots and quality-check runner |
| liquid-glass-web | `feDisplacementMap` through CSS `filter`; native `lg-segmented` refractive indicator; physical `createSpring` | copied unmodified `liquid-glass.js` + `components.js` plus upstream license, wired actual month/week custom element into `index.html` | live CDP confirms filter `url(#…)`, `lg-refract`, `xs.set`, month/week functional |
| Motion | Prefer compositor transform and physics-based controls, respect reduced-motion | `refined.js` uses `createSpring` for press handling and Web Animations transform/opacity for transitions | headless Edge interactions, reduced-motion CSS fallback; no claim of Motion library installation |
| Designeer | relevant layout/inspiration source, not a runtime library | previous workspace references used; no fresh original-page research in this iteration | mark as **not live reverified** |

Quality:
- `node little-works/glass-calendar/quality-check.cjs` PASS on Windows headless Edge: 320×700, 390×844, 768×900, 1440×900; month/week, add/edit/delete, overflow, module-based SVG filter, spring objects, no uncaught errors.
- A deliberate mutation removing the Glass component wiring is rejected.
- `.github/workflows/glass-calendar-check.yml` runs calendar checks on PR and main pushes. **Workflow alone does not prevent direct main pushes**, which requires a GitHub ruleset/branch protection.
- Additional `glass-lab.html` is an interactive standalone demonstration of **visibly bent, patterned pixels** using the actual upstream `lg-lens` custom element. Edge screenshot `qa-glass-lab-v2.png` showed real curving lines and directional chromatic highlight; refraction was then reduced from 29 to 21 for restraint. Browser QA now asserts the lab lens renders with nonzero height, a live SVG filter and a spring.
- Screenshots are inspected locally; native iOS Safari and Firefox remain untested. Artificial demonstration of refraction may be subtle on this almost-uniform pale background. This is authentic open-source SVG lens refraction, **not** the native Apple Liquid Glass compositor or guaranteed pixel equivalence. User aesthetic approval remains pending.
- No proprietary Apple image/font/code copied; demo only, persisted in browser localStorage.
