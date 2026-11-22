---
name: forma-xray
description: Reverse-engineers any live website's 5-layer Design Genome — CSS custom properties, Fontshare/Google typography scales, Clean Semantic DOM section crops (--sections), runtime motion physics (cubic-bezier, linear() springs, WAAPI), and Anti-Slop Craft Score — into an agent-ready DESIGN.md.
---

# forma-xray (v1.2.0) — Deep Design, Section DOM & Animation Inspector Skill

Use `forma-xray` whenever the user shares a reference URL (or asks to study/extract the visual design, section architecture, typography, or animation feel of a live website) before writing UI code.

## Commands

```bash
# 1. Instant zero-dependency extraction (< 1s, works in serverless & sandboxes):
npx forma-xray https://resiz.es --out DESIGN.md

# 2. Full Chromium WAAPI + scroll choreography runtime probe:
npx forma-xray https://linear.app --runtime --json

# 3. Playwright Section Crops + Clean Semantic DOM + Gemini 4 Hydrogen Vision:
GEMINI_API_KEY=... npx forma-xray https://cal.com --sections --out sections.json

# 4. Prepaid Agent Wallet & BYOK ($1.00 free starter credit):
npx forma-xray balance --endpoint https://forma.to
npx forma-xray topup 5 --endpoint https://forma.to
```

## How to Apply Extracted Motion & Tokens
1. Copy the extracted `--bg`, `--ink`, `--accent`, `font-size-adjust: from-font`, and fluid `clamp()` scales verbatim.
2. Recreate section geometry from the `cleanDom` semantic tree (`data-layout`, `data-type`, `data-cta`) rather than guessing 3 equal icon cards.
3. Apply the extracted `cubic-bezier(...)` or `linear(...)` spring easing exclusively on `transform` and `opacity`, honoring `@media (prefers-reduced-motion: reduce)`.
