# XiaoYa Native v3 — design specification (2026-10-29)

**Approved direction:** Reminders + Calendar form the functional architecture; Health and Journal inform goal/review views, with Xiaoya's sprout as a restrained companion. User requested a genuine structural rebuild, not a stylesheet facelift.

**Goals:** independent semantic DOM and original visual hierarchy, same existing browser data schema and storage key, real task/schedule/goal CRUD, review/check-in, suggestions/authorization, import/export, responsive phone/tablet/desktop, reliable keyboard and touch. The production URL and competition link must remain unchanged until verified.

**Non-goals:** cloning Apple's copyrighted assets, claiming SwiftUI rendering, replacing domain/business logic, migrating private data to cloud. Original advanced AI screen may remain separately accessible if native parity incomplete.

**Options considered:** (A) CSS skin of old DOM (rejected; already failed aesthetic goal); (B) new view tree with existing domain/store (chosen); (C) rewrite domain logic and persistence with framework (rejected; high regression risk and unnecessary data migration).

**Design:** 390px uses content-first Today reminder list under a 34px title, quick add and day agenda, with a single purposeful floating glass tab bar. Desktop uses calm navigation split layout, independently structured workspace content and a small companion rail. Calendar is an actual chronological day/weekly schedule. Goal detail includes measurable check-ins. Review takes its evidence from real stored records. Settings uses grouped inset rows, not feature tiles. No decorative star glyphs.

**References actually examined:** Apple WWDC25 UIKit design video (tab/split/toolbar/navigation placement), Apple HIG Materials, Apple iOS26 Reminders lists, Apple Calendar, Apple Journal (official product documentation); Taste-Skill original draw.mjs (executed); Designeer catalog attempted, individual page integration not claimed.

**Safety:** versioned localStorage stays at xiaoya-comparison:xiaoya-apple:personal:v1 and synthetic-demo:v1. validateStore for all saves, optimistic concurrency via storage snapshot, block writes if invalid input, preserve transaction/revision behavior. Explicit import confirmation and backup. No real data populated for marketing.

**Release gate:** tests across 320/390/768/1440, add/check/edit/delete task, create calendar, goal check-in, mode separation, import/export, cross-tab protection, accessible sheet, no overflow or runtime errors, visual screenshots examined. Only replace Apple production if the original's core flows survive and design review is good; otherwise publish separate preview.
