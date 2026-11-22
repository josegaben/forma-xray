# forma-xray (`v1.2.0`)

> **Deep Web Design, Runtime Animation Physics, Playwright Section Blueprints & Anti-Slop `DESIGN.md` Extractor for AI Agents.**  
> Built by [forma.to](https://forma.to) — *OpenRouter for Web Design*.

Existing open-source tools made great strides in bringing design tokens to coding agents, yet each leaves a critical gap when building modern high-craft interfaces:

| Capability | `VoltAgent/awesome-design-md` | `dembrandt/dembrandt` | `Manavarya09/design-extract` | **`forma-xray` (v1.2.0)** |
| :--- | :---: | :---: | :---: | :---: |
| Inspects **any** live URL on demand | ❌ *(Static repo)* | ✅ | ✅ | ✅ |
| Zero-install serverless mode (`< 1s`, no Chromium binary required) | — | ❌ | ❌ | ✅ **Dual Engine** |
| **Typography Foundry Detection** (`@font-face`, Google Fonts, **Fontshare CDN**, fluid `clamp()`) | Manual | Basic | Basic | ✅ |
| **Motion Physics Classification** (`out-expo`, iOS sheet curves, `linear()` springs) | Manual | ❌ | Basic duration | ✅ **Full Curve Classifier** |
| **Runtime WAAPI & Scroll Choreography** (`document.getAnimations()`, `animation-timeline: view()`, sticky stacks) | ❌ | ❌ | ❌ *(Static idle)* | ✅ **`--runtime` Probe** |
| **Visual Section Segmentation + Clean DOM + Vision AI** (`navbar`, `hero`, `bento`, `pricing`, `footer` crops + `gemini-4-hydrogen` Vision) | ❌ | ❌ | ❌ | ✅ **`--sections` Vault** |
| **Prepaid Agent Wallet & `$0.00` BYOK Gateway** (`balance`, `topup`, `auth` — `treg.to` model) | ❌ | ❌ | ❌ | ✅ **Built-in CLI** |
| **5-Layer Composable Genome & `unslop-ui` Craft Score (`0–100`)** | ❌ | ❌ | ❌ | ✅ **Native to `forma.to`** |

---

## Quick Start

### 1. CLI (Zero Dependencies Required for Fast Mode)
```bash
# Generate an agent-ready DESIGN.md from any live website in < 1 second:
npx forma-xray https://resiz.es --out DESIGN.md

# Inspect raw 5-layer JSON (Surface, Typography, Layout, Motion, Anti-Slop Score):
npx forma-xray https://pdepablo.com --json

# Enable optional Playwright WAAPI & Scroll-Triggered Choreography probe:
npx forma-xray https://linear.app --runtime --out DESIGN.md

# Render in Playwright, crop canonical UI sections (navbar, hero, bento, pricing, footer),
# distill Clean Semantic DOM skeletons, and catalog with Gemini 4 Hydrogen Vision:
GEMINI_API_KEY=... npx forma-xray https://cal.com --sections --out sections.json
```

### 2. Prepaid Agent Credits & `$0.00` BYOK Gateway (`v1.2.0`)
```bash
# Inspect your $1.00 free starter balance & BYOK status:
npx forma-xray balance --endpoint https://forma.to

# Save your sk-forma-... key locally (~/.config/forma/credentials.json, 0600):
npx forma-xray auth sk-forma-... --endpoint https://forma.to

# Add prepaid credits ($5 default, 0% top-up fee, credits never expire):
npx forma-xray topup 5 --endpoint https://forma.to
```

### 3. Connect as an MCP Server (Claude Code, Cursor, Antigravity, Windsurf)
```json
{
  "mcpServers": {
    "forma-xray": {
      "command": "npx",
      "args": ["-y", "forma-xray", "mcp"]
    }
  }
}
```

### 4. Install as an Agent Skill
```bash
npx skills add josegaben/forma-xray
```

---

## Architecture: How `forma-xray` Analyzes Design & Motion

1. **Layer 01 — Surface & Perceptual Tokens:** Parses `:root` CSS custom properties (`--*`), computes hex & `oklch()` frequency distributions, determines luminance mode (`light` vs `dark`), border-radius geometry, and elevation shadows.
2. **Layer 02 — Typography & Fluid Scales:** Extracts `@font-face` declarations, **Fontshare CDN** (`Satoshi`, `Cabinet Grotesk`, `Clash Display`), Google Fonts families, `clamp()` fluid typographic scales, tracking (`letter-spacing`), and `font-variant-numeric: tabular-nums`.
3. **Layer 03 — Intrinsic Layout & Modern Platform:** Detects `@container` queries, CSS Grid `subgrid`, native `<dialog>` & Popover APIs, backdrop-blur chrome, and container `max-width` rails.
4. **Layer 04 — Motion Physics & Scroll Choreography:**
   - Parses every `@keyframes` block, transition duration scale, and easing function.
   - Classifies `cubic-bezier(x1, y1, x2, y2)` and `linear(...)` curves into human-meaningful physics (`snappy out-expo`, `iOS sheet deceleration`, `overshoot spring`).
   - Detects native CSS `animation-timeline: scroll() / view()`, View Transitions (`::view-transition`), and JS engines (`GSAP`, `Motion`, `Lenis`, `Three.js`, `Rive`, `Lottie`).
   - In `--runtime` mode, queries `document.getAnimations({ subtree: true })` before and after a `600px` scroll delta to capture scroll-linked timelines and sticky card stacks.
5. **Layer 05 — `unslop-ui` Craft Audit (`0–100`):** Penalizes LLM visual clichés (purple-indigo gradients, `01 //` fake eyebrows, generic SaaS buzzwords) while rewarding tokenized CSS, `prefers-reduced-motion` accessibility, custom easing physics, and `tabular-nums`.

## Run Tests
```bash
npm test
```

## License

MIT © [forma.to](https://forma.to)
