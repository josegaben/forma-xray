---
name: forma-xray
description: Reverse-engineers any live website's 5-layer Design Genome — CSS custom properties, typography fluid scales, layout intrinsics, runtime motion physics (cubic-bezier, linear() springs, scroll timelines, WAAPI, GSAP/Motion/Lenis), and Anti-Slop Craft Score — into an agent-ready DESIGN.md.
---

# forma-xray — Deep Design & Animation Inspector Skill

Use `forma-xray` whenever the user shares a reference URL (or asks to study/extract the visual design, typography, or animation feel of a live website) before writing UI code.

## Commands

```bash
# Instant zero-dependency extraction (0.8s, works in serverless & sandboxes):
node ./forma-xray/bin/cli.mjs https://example.com --out DESIGN.md

# Optional full Chromium WAAPI + scroll choreography runtime probe:
node ./forma-xray/bin/cli.mjs https://example.com --runtime --json
```

## How to Apply Extracted Motion & Tokens
1. Copy the extracted `--bg`, `--ink`, `--accent`, and fluid `clamp()` scales verbatim.
2. Apply the extracted `cubic-bezier(...)` or `linear(...)` spring easing exclusively on `transform` and `opacity`.
3. Enforce `@media (prefers-reduced-motion: reduce)` and every `unslop-ui` guardrail in Section 5.
