# forma-xray

> **Deep Web Design, Runtime Animation Physics & Anti-Slop `DESIGN.md` Extractor for AI Agents.**  
> Built by [forma.to](https://forma.to) — *OpenRouter for Agentic Web Formats*.

Existing open-source tools made great strides in bringing design tokens to coding agents, yet each leaves a critical gap when building modern high-craft interfaces:

| Capability | `VoltAgent/awesome-design-md` | `dembrandt/dembrandt` | `Manavarya09/design-extract` | **`forma-xray` (This Repo)** |
| :--- | :---: | :---: | :---: | :---: |
| Inspects **any** live URL on demand | ❌ *(Static repo)* | ✅ | ✅ | ✅ |
| Zero-install serverless mode (`< 1s`, no Chromium binary required) | — | ❌ | ❌ | ✅ **Dual Engine** |
| **Motion Physics Classification** (`out-expo`, iOS sheet curves, `linear()` springs) | Manual | ❌ | Basic duration | ✅ **Full Curve Classifier** |
| **Runtime WAAPI & Scroll Choreography** (`document.getAnimations()`, `animation-timeline: view()`, sticky stacks) | ❌ | ❌ | ❌ *(Static idle)* | ✅ **`--runtime` Probe** |
| **Motion Engine Fingerprinting** (GSAP ScrollTrigger, Motion, Lenis, Rive, Three.js, View Transitions) | ❌ | ❌ | ❌ | ✅ |
| **5-Layer Composable Genome** (Mix *Surface* of Site A + *Motion* of Site B + *Layout* of Site C) | ❌ | ❌ | ❌ | ✅ **Native to `forma.to`** |
| **Built-in `unslop-ui` Craft & Anti-Slop Score (`0–100`)** | ❌ | ❌ | ❌ | ✅ |

---

## Quick Start

### 1. CLI (Zero Dependencies Required)
```bash
# Generate an agent-ready DESIGN.md from any live website in < 1 second:
npx forma-xray https://resiz.es --out DESIGN.md

# Inspect raw 5-layer JSON (Surface, Typography, Layout, Motion, Anti-Slop Score):
npx forma-xray https://pdepablo.com --json

# Enable optional Playwright WAAPI & Scroll-Triggered Choreography probe:
npx forma-xray https://linear.app --runtime --out DESIGN.md
```

### 2. Connect as an MCP Server (Claude Code, Cursor, Antigravity, Windsurf)
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

### 3. Install as an Agent Skill
```bash
npx skills add josegaben/forma-xray
```

---

## Architecture: How `forma-xray` Analyzes Design & Motion

1. **Layer 01 — Surface & Perceptual Tokens:** Parses `:root` CSS custom properties (`--*`), computes hex & `oklch()` frequency distributions, determines luminance mode (`light` vs `dark`), border-radius geometry, and elevation shadows.
2. **Layer 02 — Typography & Fluid Scales:** Extracts `@font-face` declarations, Google Fonts families, `clamp()` fluid typographic scales, tracking (`letter-spacing`), and `font-variant-numeric: tabular-nums`.
3. **Layer 03 — Intrinsic Layout & Modern Platform:** Detects `@container` queries, CSS Grid `subgrid`, native `<dialog>` & Popover APIs, backdrop-blur chrome, and container `max-width` rails.
4. **Layer 04 — Motion Physics & Scroll Choreography:**
   - Parses every `@keyframes` block, transition duration scale, and easing function.
   - Classifies `cubic-bezier(x1, y1, x2, y2)` and `linear(...)` curves into human-meaningful physics (`snappy out-expo`, `iOS sheet deceleration`, `overshoot spring`).
   - Detects native CSS `animation-timeline: scroll() / view()`, View Transitions (`::view-transition`), and JS engines (`GSAP`, `Motion`, `Lenis`, `Three.js`, `Rive`, `Lottie`).
   - In `--runtime` mode, queries `document.getAnimations({ subtree: true })` before and after a `600px` scroll delta to capture scroll-linked timelines and sticky card stacks.
5. **Layer 05 — `unslop-ui` Craft Audit (`0–100`):** Penalizes LLM visual clichés (purple-indigo gradients, `01 //` fake eyebrows, generic SaaS buzzwords) while rewarding tokenized CSS, `prefers-reduced-motion` accessibility, custom easing physics, and `tabular-nums`.

---

## License

MIT © [forma.to](https://forma.to)
