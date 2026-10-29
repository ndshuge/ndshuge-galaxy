# GameVerse Vision · Native Polish Design (2026-10-29)
User: improve Apple feel further using the installed Apple Skills; remove the desktop faux Mac system menu and red/yellow/green traffic-light controls.
Project: independently shipped little-works/gameverse-vision/, never replace older little-works/gameverse/ or arcade-library/.
Direction: Apple Games content-first immersive frame, not a pretend macOS desktop. Preserve photo-forward art, three-column game gallery and mobile mobile native-looking tab bar, but remove simulated OS chrome. Use a balanced sidebar, simple functional navigation, crisp content card imagery and readable real labels.
Inspected baseline desktop 1440: top imitation menu reduces viewport; left sidebar has unnecessary traffic light dead zone; dark game hero plus tiny 10–11 px copy weakens hierarchy. Mobile baseline 390: active nav states snap without continuous geometry; stacked content and over-glass effect reduce clarity.
Research: Apple HIG Materials and Layout advise Liquid Glass only as floating functional layer, no full content-layer glass. Taste Skill --app creator drew Accent Ladder/Open Plane: fewer badges/shadows and content emphasis (reject its raspberry hue and DM Sans for this established game design). Motion and installed liquid-glass-web provide interruptible createSpring and existing optical button.
Design choices: (A) pure macOS recreation rejected (requested removal); (B) native app-shell with distinct content and glass controls selected; (C) white Apple Store clone rejected (would conflict with supplied vivid reference).
Plan:
1. Remove mac-menubar and traffic-lights from actual DOM and unused styles, resize desktop app to use available height, preserve mobile.
2. Add continuous, interruptible spring indicator to mobile top categories and bottom Dock by importing original createSpring from installed liquid-glass engine; preserve keyboard and CSS fallback, reduced motion/transparency, ensure no layout shift.
3. Improve optical hierarchy and readability with selective CSS rather than translucent content on everything; maintain legibility and behavior.
Verification: write failing tests, browser 320/390/768/1440/1920 screenshots + functionality; check no bogus native UI, no overflow, no regressions, visually re-inspect; publish only scoped diff with fresh remote main and no forced update; actual Pages smoke test.
Limitations: web refraction not native SwiftUI Liquid Glass; iPhone Safari on-device remains unverified; real social/progress remains demo data.
