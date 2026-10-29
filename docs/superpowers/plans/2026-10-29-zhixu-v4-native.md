# 知序学院 V4 Native Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax.

**Goal:** 在 R3 完全独立的目录交付全新 Apple Native-like V4 学习 App。

**Architecture:** V4 的页面 DOM 和 CSS 全部重新实现；独立 state/controller 接原版同源 iframe 的科学 API 与原学习事件仓库。组件层使用原正版 Liquid Glass Web Component/Motion bundle，不复制旧页面模板。

**Tech Stack:** Vanilla ES Modules / CSS / browser Playwright Edge + WebKit / GitHub Pages, existing MIT bundled Liquid Glass & Motion.

**Spec:** docs/superpowers/specs/2026-10-29-zhixu-v4-native.md

## Global Constraints
- R3 公共入口及 Original 均不得改。
- 不复制 Apple 私有资产/字体、真实 API key、用户真实学习数据。
- 0 未预选题目；前测不提前反馈标准答案。
- 提示保持事实、真实计算、真实日志；全端有明确降级。

## Tasks
- [ ] Task 1: Build isolated V4 route and new responsive shell; test page structure and accessibility at 390px and 1440px.
- [ ] Task 2: Implement end-to-end original science bridge with real pre-question, prediction, simulation, mentor and transfer using only original API; test with Playwright.
- [ ] Task 3: Rebuild books-like home/catalog; notes-like reading and records; settings/export and doctor overlay; test functional preservation, empty/error.
- [ ] Task 4: Import and actually execute existing MIT Liquid Glass/Motion; verify gesture lifecycle and fallback/reduced-motion.
- [ ] Task 5: Visual reference QA across 320/390/768/1440, browser regression, evidenced report and scoped commit.
- [ ] Task 6: Keep live judge URL unchanged until V4 acceptance; public preview only as independently addressable route.
