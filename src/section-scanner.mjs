/**
 * forma-xray — Deep Playwright + Multimodal Vision Section Scanner
 *
 * Renders live client-hydrated websites in headless Chromium, segments canonical UI
 * sections (navbar, hero, bento-features, pricing, cta-footer), captures crisp cropped
 * section screenshots, distills a Clean Semantic DOM Blueprint annotated with real
 * getComputedStyle() layout/typography tokens, and catalogs visual craft via
 * Gemini 4 Hydrogen Multimodal Vision (@google/genai Interactions API) with an
 * automatic Playwright-Geometry deterministic fallback when no API key is configured.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MAC_CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);

const VISION_SECTION_SCHEMA = {
  type: "object",
  properties: {
    archetype: {
      type: "string",
      description: "Concise architectural name of the UI section pattern (e.g., 'Split Asymmetric Hero with Interactive CLI Preview' or '3-Tier Usage-Based Pricing Matrix').",
    },
    summary: {
      type: "string",
      description: "1-2 sentence visual & spatial breakdown of why this section works.",
    },
    layoutMechanics: {
      type: "string",
      description: "Exact spatial rhythm, column proportions, alignment, and whitespace hierarchy observed.",
    },
    microDetails: {
      type: "array",
      items: { type: "string" },
      description: "3 specific high-craft visual details (hairlines, optical contrast, badge treatment, tabular numbers, subtle gradients or shadows).",
    },
    agentRecreationPrompt: {
      type: "string",
      description: "Actionable, framework-agnostic implementation instruction an AI coding agent can follow to recreate this section's architecture without copying brand trademarks.",
    },
    visualCraftScore: {
      type: "integer",
      description: "Visual craft & anti-slop quality score between 70 and 99.",
    },
  },
  required: [
    "archetype",
    "summary",
    "layoutMechanics",
    "microDetails",
    "agentRecreationPrompt",
    "visualCraftScore",
  ],
};

async function launchHeadlessChromium() {
  const pw = await import(/* webpackIgnore: true */ "playwright-core");
  const chromium = pw.chromium || pw.default?.chromium;

  const executablePath = MAC_CHROME_PATHS.find((p) => p && existsSync(p));
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
}

/**
 * Calls Gemini 4 Hydrogen Multimodal Vision via official @google/genai Interactions API
 * when GEMINI_API_KEY or GOOGLE_API_KEY is available; otherwise synthesizes a deterministic
 * blueprint from the live Playwright DOM geometry & computed styles.
 */
export async function analyzeSectionWithVision({
  hostname,
  kind,
  imageBuffer,
  computedSpec,
  cleanDom,
  apiKey: explicitApiKey,
}) {
  const apiKey = explicitApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey && imageBuffer) {
    try {
      const { GoogleGenAI } = await import(/* webpackIgnore: true */ "@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const model = process.env.FORMA_VISION_MODEL || "gemini-4-hydrogen";
      const imageB64 = imageBuffer.toString("base64");

      const promptText = `You are a principal web design systems architect analyzing a live rendered '${kind}' section from ${hostname}.
Inspect both the screenshot pixels and these live browser getComputedStyle() measurements:
- Surface: mode=${computedSpec.mode}, bg=${computedSpec.bg}, ink=${computedSpec.ink}, accent=${computedSpec.accent}
- Layout: ${computedSpec.layoutMode}, columns=${computedSpec.gridColumns || "single-flow"}, gap=${computedSpec.gap}, padding=${computedSpec.padding}, childCards=${computedSpec.childCardCount}
- Typography: ${computedSpec.headlineFont} (${computedSpec.headlineSize}, tracking ${computedSpec.headlineTracking})
- Clean DOM Skeleton:\n${cleanDom.slice(0, 1600)}

Return a precise JSON design-system blueprint following the schema. Never suggest AI-slop purple gradients; highlight genuine spatial proportions, contrast, and typography.`;

      const interaction = await ai.interactions.create({
        model,
        input: [
          { type: "text", text: promptText },
          {
            type: "image",
            data: imageB64,
            mime_type: "image/jpeg",
          },
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: VISION_SECTION_SCHEMA,
        },
        store: false,
      });

      if (interaction?.output_text) {
        const parsed = JSON.parse(interaction.output_text);
        return {
          ...parsed,
          microDetails: (parsed.microDetails || []).slice(0, 4),
          visualCraftScore: Math.max(72, Math.min(99, Number(parsed.visualCraftScore) || 92)),
          analysisEngine: `${model}-vision`,
        };
      }
    } catch (err) {
      // Fall through cleanly to deterministic Playwright-computed analyzer on quota/network error
      console.warn(`[forma-vision] Gemini Vision fallback on ${hostname} (${kind}): ${err.message}`);
    }
  }

  return synthesizeDeterministicVisionSpec({ hostname, kind, computedSpec, cleanDom });
}

function synthesizeDeterministicVisionSpec({ hostname, kind, computedSpec, cleanDom }) {
  const isDark = computedSpec.mode === "dark";
  const hasBlur = computedSpec.backdropFilter && computedSpec.backdropFilter !== "none";
  const hasCode = /<pre|<code|terminal|cli|npx|curl/i.test(cleanDom);
  const cols = computedSpec.childCardCount >= 4 ? "4-column" : computedSpec.childCardCount === 3 ? "3-column" : computedSpec.childCardCount === 2 ? "2-column split" : "centered single-rail";

  const archetypesByKind = {
    navbar: hasBlur
      ? `Translucent Frosted Header Rail (${computedSpec.height}px)`
      : `Minimal Hairline Top Navigation Bar (${computedSpec.height}px)`,
    hero: hasCode
      ? `Agentic Hero with Live CLI / Interactive Surface (${cols})`
      : computedSpec.childCardCount >= 2
      ? `Asymmetric Split Editorial Hero (${cols})`
      : `High-Contrast Centered Display Hero`,
    "bento-features":
      computedSpec.childCardCount >= 3
        ? `Modular ${computedSpec.childCardCount}-Cell Bento Architecture`
        : `Editorial Feature Showcase Split`,
    pricing:
      computedSpec.childCardCount >= 3
        ? `${computedSpec.childCardCount}-Tier Transparent Pricing Matrix`
        : `Structured Usage & Plan Comparison Grid`,
    "cta-footer": `Architectural Conversion Band & Multi-Column Sitemap Footer`,
  };

  const archetype = archetypesByKind[kind] || `Structured ${kind} Module`;

  const layoutMechanics = `${computedSpec.layoutMode.toUpperCase()} container (${computedSpec.width}×${computedSpec.height}px, padding ${computedSpec.padding}${
    computedSpec.gap && computedSpec.gap !== "normal" ? `, gap ${computedSpec.gap}` : ""
  }) using ${cols} composition on a ${isDark ? "deep low-glare dark" : "crisp editorial light"} ${computedSpec.bg} canvas.`;

  const microDetails = [
    `Display typography set in ${computedSpec.headlineFont} at ${computedSpec.headlineSize} (tracking ${computedSpec.headlineTracking}) paired with ${computedSpec.ink} primary ink.`,
    hasBlur
      ? `Optical depth via ${computedSpec.backdropFilter} glass layer and hairline ${computedSpec.borderColor} dividers.`
      : `Zero-clutter structural framing with ${computedSpec.radiusSample || "12px"} radii and subtle ${computedSpec.borderColor} hairlines.`,
    computedSpec.activeAnimations.length > 0
      ? `GPU-friendly motion choreography (${computedSpec.activeAnimations.length} live WAAPI timelines, primary easing ${computedSpec.activeAnimations[0]?.easing || "cubic-bezier(0.22, 1, 0.36, 1)"}).`
      : `Restraint-first static precision with instant hover feedback and zero distracting scroll-jacking.`,
  ];

  const summary = `Live-rendered ${kind} from ${hostname} combining ${
    isDark ? "high-contrast obsidian surfaces" : "airy neutral stone/white surfaces"
  } (${computedSpec.bg}) with disciplined ${computedSpec.headlineFont} hierarchy and ${
    computedSpec.childCardCount > 1 ? `${computedSpec.childCardCount} structured sub-modules` : "focused single-axis alignment"
  }.`;

  const agentRecreationPrompt = `Build a ${archetype} inspired by ${hostname}'s ${kind} architecture: use a ${computedSpec.layoutMode} wrapper (max-width ${computedSpec.maxWidth || "1200px"}, padding ${computedSpec.padding}, gap ${computedSpec.gap || "24px"}) on background ${computedSpec.bg} with ${computedSpec.ink} ink. Set the primary heading in ${computedSpec.headlineFont} (${computedSpec.headlineSize}, letter-spacing ${computedSpec.headlineTracking}), preserve the exact semantic DOM hierarchy from the Clean DOM Blueprint, and reserve ${computedSpec.accent} strictly for the primary focal action.`;

  let score = 86;
  if (computedSpec.headlineTracking.startsWith("-")) score += 3;
  if (hasBlur || computedSpec.borderColor) score += 3;
  if (computedSpec.activeAnimations.length > 0) score += 3;
  if (hasCode || kind === "pricing" || kind === "bento-features") score += 2;

  return {
    archetype,
    summary,
    layoutMechanics,
    microDetails,
    agentRecreationPrompt,
    visualCraftScore: Math.min(98, score),
    analysisEngine: "playwright-computed-geometry",
  };
}

/**
 * In-page script executed by Playwright to segment the rendered DOM into canonical
 * architectural sections and extract clean semantic HTML + computed tokens.
 */
function extractSectionsInBrowser(requestedKinds) {
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return null;
    const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.08) return null;
    const hex = [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("");
    return `#${hex}`;
  };

  const resolveEffectiveBg = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const hex = rgbToHex(getComputedStyle(cur).backgroundColor);
      if (hex) return hex;
      cur = cur.parentElement;
    }
    return rgbToHex(getComputedStyle(document.body).backgroundColor) || "#ffffff";
  };

  const parseMode = (hex) => {
    const clean = (hex || "#ffffff").replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const rr = Number.isNaN(r) ? 255 : r;
    const gg = Number.isNaN(g) ? 255 : g;
    const bb = Number.isNaN(b) ? 255 : b;
    const lum = (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255;
    return lum < 0.44 ? "dark" : "light";
  };

  const serializeCleanDom = (rootEl, maxDepth = 4) => {
    const SKIP_TAGS = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "IFRAME",
      "LINK",
      "META",
      "PATH",
      "DEFS",
      "CLIPPATH",
    ]);

    const walk = (node, depth) => {
      if (!node || node.nodeType !== 1 || depth > maxDepth) return "";
      const tag = node.tagName;
      if (SKIP_TAGS.has(tag)) return "";

      const cs = getComputedStyle(node);
      if (cs.display === "none" || cs.visibility === "hidden") return "";
      const rect = node.getBoundingClientRect();
      if (rect.width < 4 && rect.height < 4) return "";

      const indent = "  ".repeat(depth);
      const lower = tag.toLowerCase();

      if (tag === "SVG") {
        return `${indent}<svg width="${Math.round(rect.width)}" height="${Math.round(rect.height)}" aria-hidden="true" />`;
      }

      if (tag === "IMG" || tag === "VIDEO" || tag === "CANVAS") {
        const alt = (node.getAttribute("alt") || "visual-asset").slice(0, 48).replace(/"/g, "'");
        return `${indent}<${lower} width="${Math.round(rect.width)}" height="${Math.round(rect.height)}" alt="${alt}" />`;
      }

      const attrs = [];
      const role = node.getAttribute("role");
      if (role) attrs.push(`role="${role}"`);

      // Annotate layout containers
      if (cs.display.includes("grid") || cs.display.includes("flex")) {
        const parts = [cs.display];
        if (cs.display.includes("grid") && cs.gridTemplateColumns && cs.gridTemplateColumns !== "none") {
          const colCount = cs.gridTemplateColumns.trim().split(/\s+/).length;
          parts.push(`cols-${colCount}`);
        } else if (cs.flexDirection && cs.flexDirection !== "row") {
          parts.push(cs.flexDirection);
        }
        if (cs.gap && cs.gap !== "normal" && cs.gap !== "0px") {
          parts.push(`gap-${cs.gap.split(" ")[0]}`);
        }
        attrs.push(`data-layout="${parts.join(" ")}"`);
      }

      // Annotate headings & interactive controls
      if (/^H[1-4]$/.test(tag)) {
        const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
        attrs.push(
          `data-type="${fam} ${Math.round(parseFloat(cs.fontSize))}px/${cs.letterSpacing}"`
        );
      } else if (tag === "A" || tag === "BUTTON") {
        const bg = rgbToHex(cs.backgroundColor);
        const rad = cs.borderRadius;
        if (bg || (rad && rad !== "0px")) {
          attrs.push(
            `data-cta="${[bg ? `bg:${bg}` : "ghost", rad ? `r:${rad.split(" ")[0]}` : ""]
              .filter(Boolean)
              .join(" ")}"`
          );
        }
      }

      const directText = [...node.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 90)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const childElements = [...node.children].slice(0, depth === 0 ? 10 : 6);
      const childStrings = childElements
        .map((c) => walk(c, depth + 1))
        .filter(Boolean);

      // Collapse trivial single-child div wrappers to keep blueprint ultra-clean
      if (
        lower === "div" &&
        attrs.length === 0 &&
        !directText &&
        childStrings.length === 1 &&
        depth > 0
      ) {
        return childStrings[0];
      }

      const attrStr = attrs.length ? " " + attrs.join(" ") : "";
      if (childStrings.length === 0) {
        if (!directText && !["input", "hr"].includes(lower)) return "";
        return `${indent}<${lower}${attrStr}>${directText}</${lower}>`;
      }

      return `${indent}<${lower}${attrStr}>${
        directText ? `\n${indent}  ${directText}` : ""
      }\n${childStrings.join("\n")}\n${indent}</${lower}>`;
    };

    return walk(rootEl, 0);
  };

  const inspectElementMetrics = (el) => {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const bg = resolveEffectiveBg(el);
    const mode = parseMode(bg);

    const heading =
      el.querySelector("h1, h2, h3, [class*='title'], [class*='heading']") || el;
    const hcs = getComputedStyle(heading);
    const ink = rgbToHex(hcs.color) || (mode === "dark" ? "#f5f5f5" : "#141413");

    // Find a vibrant/contrasting CTA button or link for accent
    let accent = ink;
    const buttons = [...el.querySelectorAll("a, button")];
    for (const btn of buttons) {
      const bbg = rgbToHex(getComputedStyle(btn).backgroundColor);
      if (bbg && bbg !== bg) {
        accent = bbg;
        break;
      }
    }

    // Count direct/second-level card-like children
    const cardCandidates = [...el.querySelectorAll("article, li, [class*='card'], [class*='tier'], [class*='plan'], [class*='bento']")].filter(
      (c) => {
        const r = c.getBoundingClientRect();
        return r.width >= 180 && r.height >= 100 && r.width < rect.width * 0.92;
      }
    );

    const ctaTexts = buttons
      .map((b) => (b.textContent || "").replace(/\s+/g, " ").trim())
      .filter((t) => t.length >= 2 && t.length <= 32)
      .slice(0, 4);

    let activeAnimations = [];
    try {
      activeAnimations = el
        .getAnimations({ subtree: true })
        .slice(0, 6)
        .map((a) => {
          const t = a.effect?.getTiming?.() || {};
          return {
            name: a.animationName || "transition",
            duration: Number(t.duration) || 200,
            easing: String(t.easing || "ease"),
          };
        });
    } catch {
      activeAnimations = [];
    }

    const firstBordered =
      [el, ...el.querySelectorAll("*")].find((node) => {
        const b = getComputedStyle(node);
        return parseFloat(b.borderTopWidth) > 0 && rgbToHex(b.borderTopColor);
      }) || el;

    const borderColor =
      rgbToHex(getComputedStyle(firstBordered).borderTopColor) ||
      (mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)");

    const firstRounded = [el, ...el.querySelectorAll("article, div, a, button")].find(
      (node) => {
        const r = getComputedStyle(node).borderRadius;
        return r && r !== "0px";
      }
    );

    return {
      mode,
      bg,
      ink,
      accent,
      borderColor,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      layoutMode: cs.display.includes("grid")
        ? "grid"
        : cs.display.includes("flex")
        ? "flex"
        : "block",
      gridColumns:
        cs.gridTemplateColumns && cs.gridTemplateColumns !== "none"
          ? `${cs.gridTemplateColumns.trim().split(/\s+/).length} tracks`
          : null,
      gap: cs.gap || "normal",
      padding: `${Math.round(parseFloat(cs.paddingTop) || 0)}px ${Math.round(
        parseFloat(cs.paddingRight) || 0
      )}px`,
      maxWidth: cs.maxWidth !== "none" ? cs.maxWidth : `${Math.round(rect.width)}px`,
      radiusSample: firstRounded ? getComputedStyle(firstRounded).borderRadius.split(" ")[0] : "12px",
      headlineFont: hcs.fontFamily
        .split(",")[0]
        .replace(/["']/g, "")
        .replace(/^__([a-zA-Z0-9]+).*$/, "$1")
        .trim(),
      headlineSize: `${Math.round(parseFloat(hcs.fontSize) || 32)}px`,
      headlineTracking: hcs.letterSpacing || "normal",
      backdropFilter: cs.backdropFilter || "none",
      childCardCount: Math.min(12, cardCandidates.length),
      ctaTexts,
      activeAnimations,
    };
  };

  const docScrollY = window.scrollY;
  const candidates = [];
  const usedElements = new Set();

  const markAndPush = (kind, el) => {
    if (!el || usedElements.has(el) || !requestedKinds.includes(kind)) return false;
    const r = el.getBoundingClientRect();
    const absTop = Math.max(0, Math.round(r.top + docScrollY));
    if (r.width < 720 || r.height < 38) return false;
    usedElements.add(el);
    const idAttr = `forma-sec-${kind}-${candidates.length}`;
    el.setAttribute("data-forma-capture-id", idAttr);

    candidates.push({
      kind,
      captureId: idAttr,
      clip: {
        x: Math.max(0, Math.round(r.left)),
        y: absTop,
        width: Math.min(1440, Math.round(r.width)),
        height: Math.min(kind === "navbar" ? 120 : 880, Math.round(r.height)),
      },
      computedSpec: inspectElementMetrics(el),
      cleanDom: serializeCleanDom(el, kind === "navbar" ? 3 : 4),
    });
    return true;
  };

  // 1. Navbar
  const navCandidates = [
    ...document.querySelectorAll("header, nav, [role='banner']"),
  ].filter((el) => {
    const r = el.getBoundingClientRect();
    const top = r.top + docScrollY;
    return top <= 80 && r.height >= 40 && r.height <= 130 && r.width >= 800;
  });
  if (navCandidates[0]) {
    markAndPush("navbar", navCandidates[0]);
  }

  // Gather main structural blocks
  const allBlocks = [
    ...document.querySelectorAll(
      "main > section, main > div, body > section, body > div > main > section, body > div > section, article"
    ),
  ].filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width >= 800 && r.height >= 240;
  });

  // 2. Hero (contains H1 or sits immediately near top)
  const h1 = document.querySelector("h1");
  let heroEl = h1
    ? h1.closest("section") ||
      h1.closest("main > div") ||
      h1.parentElement?.parentElement
    : allBlocks[0];
  if (heroEl && heroEl.getBoundingClientRect().height > 1500 && h1?.parentElement) {
    heroEl = h1.parentElement.parentElement || heroEl;
  }
  if (heroEl) {
    markAndPush("hero", heroEl);
  }

  // 3. Pricing (look for explicit pricing signals)
  const pricingRegex = /(\$\d+|\€\d+|\/mo\b|\/month\b|per month|free forever|enterprise|most popular|billed annually|pricing)/i;
  const pricingEl = allBlocks.find((el) => {
    if (usedElements.has(el)) return false;
    const r = el.getBoundingClientRect();
    if (r.height < 280 || r.height > 1600) return false;
    const text = (el.textContent || "").slice(0, 2500);
    const matches = (text.match(/(\$\d+|\€\d+|\/mo\b|\/month\b|enterprise|starter|pro\b)/gi) || []).length;
    return pricingRegex.test(text) && matches >= 2;
  });
  if (pricingEl) {
    markAndPush("pricing", pricingEl);
  }

  // 4. Bento / Features (mid-page multi-card section)
  const bentoEl = allBlocks.find((el) => {
    if (usedElements.has(el)) return false;
    const r = el.getBoundingClientRect();
    const top = r.top + docScrollY;
    if (top < 350 || r.height < 280 || r.height > 1400) return false;
    const cards = el.querySelectorAll("article, li, h3, [class*='card'], [class*='bento'], [class*='grid']");
    return cards.length >= 3;
  });
  if (bentoEl) {
    markAndPush("bento-features", bentoEl);
  }

  // 5. CTA / Footer
  const footerEl = document.querySelector("footer, [role='contentinfo']");
  if (footerEl) {
    const r = footerEl.getBoundingClientRect();
    if (r.height >= 140 && r.width >= 800) {
      markAndPush("cta-footer", footerEl);
    }
  }

  return candidates;
}

/**
 * Scans a live URL with Playwright, extracts visual section screenshots + clean DOM +
 * computed styles, and catalogs each section with Gemini Vision (or Playwright geometry).
 */
export async function scanWebsiteSections(targetUrl, options = {}) {
  const url = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
  const hostname = url.hostname.replace(/^www\./, "");
  const slug = hostname.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const screenshotDir =
    options.screenshotDir || resolve(process.cwd(), "public/section-vault");
  const publicPrefix = options.publicPrefix || "/section-vault";
  const requestedKinds = options.kinds || [
    "navbar",
    "hero",
    "bento-features",
    "pricing",
    "cta-footer",
  ];

  mkdirSync(screenshotDir, { recursive: true });

  const browser = await launchHeadlessChromium();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1.5,
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    const resp = await page.goto(url.toString(), {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs || 22000,
    });

    await page.waitForTimeout(1400);

    const status = resp?.status?.() || 200;
    const pageTitle = await page.title();
    const bodyCheck = await page.evaluate(() =>
      (document.body?.innerText || "").slice(0, 600)
    );

    // Strictly respect anti-bot / CAPTCHA gates without attempting any bypass
    if (
      status === 403 ||
      /Just a moment|Verify you are human|cf-mitigated|Attention Required! \| Cloudflare/i.test(
        `${pageTitle} ${bodyCheck}`
      )
    ) {
      throw new Error(
        `Target ${hostname} presented an anti-bot challenge (${status}); skipping cleanly.`
      );
    }

    // Trigger lazy scroll-reveal sections cleanly
    for (const y of [700, 1500, 2400, 3400, 0]) {
      await page.evaluate((pos) => window.scrollTo({ top: pos, behavior: "instant" }), y);
      await page.waitForTimeout(180);
    }
    await page.waitForTimeout(350);

    const rawCandidates = await page.evaluate(extractSectionsInBrowser, requestedKinds);

    // Optional: if pricing wasn't on the landing page and checkPricingRoute is enabled, probe /pricing
    const capturedSections = [];

    for (const cand of rawCandidates) {
      const filename = `${slug}-${cand.kind}.jpg`;
      const absPath = join(screenshotDir, filename);
      let imageBuffer = null;

      try {
        if (cand.kind === "navbar") {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await page.waitForTimeout(100);
          imageBuffer = await page.screenshot({
            type: "jpeg",
            quality: 84,
            clip: {
              x: 0,
              y: 0,
              width: 1440,
              height: Math.max(88, Math.min(130, cand.clip.height + 16)),
            },
          });
        } else if (cand.kind === "hero" && cand.clip.y < 260) {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
          await page.waitForTimeout(140);
          imageBuffer = await page.screenshot({
            type: "jpeg",
            quality: 84,
            clip: {
              x: 0,
              y: 0,
              width: 1440,
              height: Math.min(880, Math.max(580, cand.clip.height + cand.clip.y)),
            },
          });
        } else {
          const locator = page.locator(`[data-forma-capture-id="${cand.captureId}"]`).first();
          const box = await locator.boundingBox();
          if (box && box.width >= 600 && box.height >= 100) {
            await page.evaluate(
              (deltaY) =>
                window.scrollTo({
                  top: Math.max(0, window.scrollY + deltaY - 56),
                  behavior: "instant",
                }),
              box.y
            );
            await page.waitForTimeout(160);
            const freshBox = await locator.boundingBox();
            if (freshBox && freshBox.height >= 80) {
              const clipY = Math.max(0, freshBox.y);
              const clipH = Math.min(860, freshBox.height, 900 - clipY);
              if (clipH >= 90) {
                imageBuffer = await page.screenshot({
                  type: "jpeg",
                  quality: 84,
                  clip: {
                    x: Math.max(0, freshBox.x),
                    y: clipY,
                    width: Math.min(1440 - Math.max(0, freshBox.x), freshBox.width),
                    height: clipH,
                  },
                });
              }
            }
          }
        }
      } catch {
        imageBuffer = null;
      }

      if (!imageBuffer) continue;
      writeFileSync(absPath, imageBuffer);

      const vision = await analyzeSectionWithVision({
        hostname,
        kind: cand.kind,
        imageBuffer,
        computedSpec: cand.computedSpec,
        cleanDom: cand.cleanDom,
        apiKey: options.apiKey,
      });

      capturedSections.push({
        id: `sec-${slug}-${cand.kind}`,
        siteUrl: url.origin,
        pageUrl: url.toString(),
        hostname,
        siteTitle: pageTitle.slice(0, 70),
        kind: cand.kind,
        capturedAt: new Date().toISOString(),
        screenshotUrl: `${publicPrefix}/${filename}`,
        dimensions: {
          width: cand.computedSpec.width,
          height: cand.computedSpec.height,
        },
        computedSpec: cand.computedSpec,
        cleanDom: cand.cleanDom,
        vision,
      });
    }

    // Probe /pricing if requested and not yet captured
    if (
      options.probePricingSubpage !== false &&
      requestedKinds.includes("pricing") &&
      !capturedSections.some((s) => s.kind === "pricing") &&
      url.pathname === "/"
    ) {
      try {
        const pricingUrl = new URL("/pricing", url.origin).toString();
        const pResp = await page.goto(pricingUrl, {
          waitUntil: "domcontentloaded",
          timeout: 12000,
        });
        if (pResp && pResp.status() === 200) {
          await page.waitForTimeout(1100);
          const pTitle = await page.title();
          if (!/404|not found|just a moment/i.test(pTitle)) {
            await page.evaluate(() => window.scrollTo({ top: 180, behavior: "instant" }));
            await page.waitForTimeout(200);
            const pricingCandidates = await page.evaluate(extractSectionsInBrowser, ["pricing", "hero"]);
            const chosen =
              pricingCandidates.find((c) => c.kind === "pricing") || pricingCandidates[0];
            if (chosen) {
              const filename = `${slug}-pricing.jpg`;
              const absPath = join(screenshotDir, filename);
              const imageBuffer = await page.screenshot({
                type: "jpeg",
                quality: 84,
                clip: { x: 0, y: 0, width: 1440, height: 840 },
              });
              writeFileSync(absPath, imageBuffer);

              const vision = await analyzeSectionWithVision({
                hostname,
                kind: "pricing",
                imageBuffer,
                computedSpec: chosen.computedSpec,
                cleanDom: chosen.cleanDom,
                apiKey: options.apiKey,
              });

              capturedSections.push({
                id: `sec-${slug}-pricing`,
                siteUrl: url.origin,
                pageUrl: pricingUrl,
                hostname,
                siteTitle: pTitle.slice(0, 70),
                kind: "pricing",
                capturedAt: new Date().toISOString(),
                screenshotUrl: `${publicPrefix}/${filename}`,
                dimensions: {
                  width: chosen.computedSpec.width,
                  height: chosen.computedSpec.height,
                },
                computedSpec: chosen.computedSpec,
                cleanDom: chosen.cleanDom,
                vision,
              });
            }
          }
        }
      } catch {
        // Ignore optional /pricing subpage miss
      }
    }

    await context.close();
    return {
      url: url.toString(),
      hostname,
      scannedAt: new Date().toISOString(),
      totalSections: capturedSections.length,
      sections: capturedSections,
    };
  } finally {
    await browser.close();
  }
}
