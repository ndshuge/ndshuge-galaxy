# 月光存档 — Design Sources and QA (2026-10-25)

Target: Galaxy → 小东西 → moonlight-player. No audio files, network calls, third-party tracks, copyright material or keys. Music, lyrics and track metadata are original fictional demo content.

## Visual direction and application
- User-supplied images: Apple's liquid-glass controls and Apple Music immersive lyrics. These guide appearance but no official assets or code were copied.
- Apple Web Design OS v1: E:/CHATGPT/_system/apple_web_design_os/WORKFLOW.md. Chosen style: Apple Immersive.
- Taste-Skill: C:/Users/ndshuge/.agents/skills/design-taste-frontend/SKILL.md. Ran draw.mjs --app --kind creator; generated “True-black flat”. Adopted its principle that the cover artwork anchors the composition and controls should be visually subordinate. Rejected the strict true-black/lime palette because the album-colour atmosphere is the central visual storytelling element.
- Designeer resources index: https://designeer.xyz/resources; loaded its real DOM in Edge. The inspiration index https://designeer.xyz/inspiration was inaccessible through the web gateway. No two individual resource detail pages were independently inspected and NO library from Designeer was copied/installed. Research gap explicitly disclosed.
- Apple HIG Motion: https://developer.apple.com/design/human-interface-guidelines/motion. Slow, subtle, optional gradients with reduced-motion fallback.

## Signature concept
“A letter stored in moonlight.” Original waterfront/moon SVG, album-derived atmosphere, a single lyric in focus while other lines recede. The progress clock and time-coded fictional lyrics are controlled by the same JS timeline.

## Implementation map
- cover.svg: self-authored vector art, no remote image license issue.
- style.css .ambient-a/.ambient-b/.ambient-c: slow background hues tied to track theme.
- style.css .glass-button: frosted circles with subtle rim reflections and safe opaque fallback.
- style.css .lyrics-list .lyric: active-line focus, older/future-line blur; responsive layout @320/390/768/1440.
- app.js changeTrack/updateLyric/tick: fake song switching, time-seeking, synced lyric line. Controls: pause, previous, next, shuffle, favourite, playlist, volume display.
- index.html: device-safe layout with real interactive controls, accessibility labels and prominent demo disclosure.
- Plain HTML/CSS/JS with no runtime libraries. This is optical-looking glass, not a claimed GPU shader.

## Real QA (headless Microsoft Edge)
Observed screenshots at widths 320, 390, 768, 1440, captured in isolated release checkout. Three defects addressed or acknowledged: (1) initial active lyric was blurry because visual state applied next animation frame — fixed by synchronous initialization; (2) removed nonfunctional decorative captions; (3) tightened controls in shorter viewports. Technical check: node little-works/moonlight-player/check.cjs. Edge screenshot simulation does not replace hands-on iPhone Safari testing. No actual music is played, intentionally.
