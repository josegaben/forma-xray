/**
 * forma-xray — Core Design DNA, Motion Physics & Anti-Slop Analyzer
 * Works in zero-dependency Fast Fetch mode (Edge/Serverless/CLI) AND enriches
 * with Runtime Playwright WAAPI/Scroll probes when passed `runtimeData`.
 */

const MOTION_ENGINES = [
  { id: "gsap", name: "GSAP / ScrollTrigger", pattern: /gsap|ScrollTrigger| TweenMax/i },
  { id: "motion", name: "Motion (Framer Motion)", pattern: /framer-motion|motion\/react|data-framer/i },
  { id: "lenis", name: "Lenis Smooth Scroll", pattern: /lenis|html\.lenis/i },
  { id: "three", name: "Three.js / WebGL Shader", pattern: /three\.module|THREE\.|__r3f|webgl/i },
  { id: "rive", name: "Rive State Machine", pattern: /@rive-app|\.riv\b/i },
  { id: "lottie", name: "Lottie Vector Motion", pattern: /lottie-web|dotlottie|\.lottie\b/i },
  { id: "anime", name: "Anime.js", pattern: /animejs|anime\.min\.js/i },
  { id: "view-transitions", name: "Native CSS View Transitions", pattern: /view-transition-name|::view-transition|startViewTransition/i },
  { id: "scroll-driven", name: "Native CSS Scroll-Driven Animations", pattern: /animation-timeline:\s*(scroll|view)|scroll-timeline|view-timeline/i },
];

const SLOP_SIGNALS = [
  { label: "AI Purple-Indigo Gradient", pattern: /from-(purple|indigo|violet)-[456]00\s+to-(pink|purple|indigo|blue)-[456]00/i, penalty: 18 },
  { label: "Numbered Fake Eyebrow (01 //)", pattern: />\s*0[1-4]\s*(\/\/|—|\|)\s*[A-Z]{3,}/, penalty: 10 },
  { label: "Generic AI Marketing Buzzwords", pattern: /unleash the power|supercharge your workflow|revolutionize the way|seamless integration/i, penalty: 12 },
  { label: "Excessive Bounce/Spin Utility Classes", pattern: /animate-(bounce|ping)/g, penalty: 6 },
];

export const COMMERCIAL_FONT_ROSETTA = [
  {
    commercial: "Klim Söhne / Neue Haas Grotesk",
    foundry: "Klim Type Foundry / Linotype",
    pattern: /\b(s[oö]hne|soehne|neue\s*haas|suisse\s*int)/i,
    openTwin: "Uncut Sans + Commit Mono (or Fontshare Switzer)",
    pairingId: "pair-uncut-commit",
    openTypeFeatures: '"ss01" 1, "ss02" 1, "cv01" 1',
    cssImport: "https://cdn.jsdelivr.net/npm/@fontsource/uncut-sans@5/index.css",
  },
  {
    commercial: "Klim Signifier / Tiempos",
    foundry: "Klim Type Foundry",
    pattern: /\b(signifier|tiempos)\b/i,
    openTwin: "Erode Variable + Satoshi (or Newsreader opsz 36..72)",
    pairingId: "pair-erode-satoshi",
    openTypeFeatures: '"liga" 1, "kern" 1, "onum" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=erode@400,500,600&f[]=satoshi@400,500,700&display=swap",
  },
  {
    commercial: "Pangram PP Editorial New",
    foundry: "Pangram Pangram",
    pattern: /\b(pp\s*editorial|editorial\s*new)\b/i,
    openTwin: "Boska + General Sans (or Instrument Serif Italic)",
    pairingId: "pair-boska-generalsans",
    openTypeFeatures: '"liga" 1, "swsh" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=boska@400,500,700&f[]=general-sans@400,500,600&display=swap",
  },
  {
    commercial: "Pangram PP Neue Montreal / PP Mori / Grilli GT America",
    foundry: "Pangram Pangram / Grilli Type",
    pattern: /\b(neue\s*montreal|pp\s*mori|gt\s*america|roobert|aeonik)\b/i,
    openTwin: "General Sans + Clash Display (Fontshare ITF)",
    pairingId: "pair-clash-generalsans",
    openTypeFeatures: '"ss01" 1, "tnum" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=general-sans@400,500,600&display=swap",
  },
  {
    commercial: "Dinamo ABC Whyte / ABC Diatype / ABC Favorit",
    foundry: "ABCDinamo",
    pattern: /\b(abc\s*whyte|abc\s*diatype|abc\s*favorit|diatype|whyte\s*inktrap)\b/i,
    openTwin: "Instrument Sans + Martian Mono (or Bricolage Grotesque)",
    pairingId: "pair-instrument-martian",
    openTypeFeatures: '"ss01" 1, "ss03" 1, "tnum" 1',
    cssImport: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..600&family=Martian+Mono:wght@400;500&display=swap",
  },
  {
    commercial: "Commercial Type Canela / Grilli GT Super",
    foundry: "Commercial Type / Grilli Type",
    pattern: /\b(canela|gt\s*super|ogg\b|reckless\s*neue)\b/i,
    openTwin: "Gambarino + Switzer (Fontshare ITF)",
    pairingId: "pair-gambarino-switzer",
    openTypeFeatures: '"liga" 1, "kern" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=gambarino@400&f[]=switzer@400,500,600&display=swap",
  },
  {
    commercial: "U.S. Graphics Berkeley Mono / Lineto Akkurat Mono",
    foundry: "U.S. Graphics / Lineto",
    pattern: /\b(berkeley\s*mono|tx-02|akkurat\s*mono|pragmata\s*pro)\b/i,
    openTwin: "Nippo + Switzer + Departure Mono / Commit Mono",
    pairingId: "pair-nippo-departure",
    openTypeFeatures: '"zero" 1, "tnum" 1, "ss01" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=nippo@400,500,700&f[]=switzer@400,500&display=swap",
  },
  {
    commercial: "Lineto Circular / Commercial Graphik",
    foundry: "Lineto / Commercial Type",
    pattern: /\b(ll\s*circular|circular\s*std|graphik|gt\s*walsheim)\b/i,
    openTwin: "Cabinet Grotesk + Satoshi + Geist Mono",
    pairingId: "pair-cabinet-satoshi",
    openTypeFeatures: '"ss01" 1, "tnum" 1',
    cssImport: "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800&f[]=satoshi@400,500,700&display=swap",
  },
];

export function matchCommercialFontTwins(fontNames = [], rawCss = "") {
  const haystack = `${fontNames.join(" | ")}\n${rawCss.slice(0, 40000)}`;
  return COMMERCIAL_FONT_ROSETTA.filter((entry) => entry.pattern.test(haystack)).map(
    ({ commercial, foundry, openTwin, pairingId, openTypeFeatures, cssImport }) => ({
      commercial,
      foundry,
      openTwin,
      pairingId,
      openTypeFeatures,
      cssImport,
    })
  );
}

function hexToRgbTuple(hexInput) {
  if (!hexInput || typeof hexInput !== "string") return [245, 245, 244];
  const clean = hexInput.trim().replace(/^#/, "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [
    Number.isNaN(r) ? 245 : r,
    Number.isNaN(g) ? 245 : g,
    Number.isNaN(b) ? 245 : b,
  ];
}

/**
 * Deterministic APCA-W3 (0.0.98G-4g) Perceptual Lightness Contrast (Lc).
 * Positive values indicate dark text on light background; negative values light text on dark background.
 * Returns rounded absolute & signed Lc so callers can enforce Lc >= 75 (body) / Lc >= 60 (UI).
 */
export function computeApcaLc(textHex, bgHex) {
  const [tr, tg, tb] = hexToRgbTuple(textHex);
  const [br, bg, bb] = hexToRgbTuple(bgHex);

  const srgbToY = (r, g, b) =>
    0.2126729 * Math.pow(r / 255, 2.4) +
    0.7151522 * Math.pow(g / 255, 2.4) +
    0.072175 * Math.pow(b / 255, 2.4);

  const softClamp = (y) => (y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y);

  const yTxt = softClamp(srgbToY(tr, tg, tb));
  const yBg = softClamp(srgbToY(br, bg, bb));

  if (Math.abs(yBg - yTxt) < 0.0005) {
    return { signed: 0, abs: 0, polarity: "flat" };
  }

  let sapc = 0;
  let polarity = "dark-on-light";
  if (yBg > yTxt) {
    sapc = (Math.pow(yBg, 0.56) - Math.pow(yTxt, 0.57)) * 1.14;
    sapc = sapc < 0.1 ? 0 : sapc - 0.027;
  } else {
    polarity = "light-on-dark";
    sapc = (Math.pow(yBg, 0.65) - Math.pow(yTxt, 0.62)) * 1.14;
    sapc = sapc > -0.1 ? 0 : sapc + 0.027;
  }

  const signed = Math.round(sapc * 1000) / 10;
  return {
    signed,
    abs: Math.round(Math.abs(signed) * 10) / 10,
    polarity,
  };
}

/**
 * Audits CSS clamp(min, preferred, max) rules against WCAG 1.4.4 200% zoom reflow (max <= 2.5x min).
 */
export function auditClampZoomSafety(clampStrings = []) {
  const unsafe = [];
  const toRem = (token) => {
    const t = String(token || "").trim();
    const remMatch = t.match(/^([\d.]+)rem$/i);
    if (remMatch) return parseFloat(remMatch[1]);
    const pxMatch = t.match(/^([\d.]+)px$/i);
    if (pxMatch) return parseFloat(pxMatch[1]) / 16;
    return null;
  };

  for (const raw of clampStrings) {
    const inner = raw.match(/clamp\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/i);
    if (!inner) continue;
    const minRem = toRem(inner[1]);
    const maxRem = toRem(inner[3]);
    if (minRem && maxRem && minRem > 0) {
      const ratio = Math.round((maxRem / minRem) * 100) / 100;
      if (ratio > 2.52) {
        unsafe.push({ expression: raw, ratio });
      }
    }
  }
  return unsafe;
}

function uniqueTop(items, limit = 10) {
  const counts = new Map();
  for (const raw of items) {
    const val = String(raw || "").trim();
    if (!val) continue;
    counts.set(val, (counts.get(val) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

export function parseLuminanceMode(hexColors) {
  const bgCandidate = hexColors[0]?.value;
  if (!bgCandidate || !bgCandidate.startsWith("#")) return "light";
  const hex = bgCandidate.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  const pr = parseInt(full.slice(0, 2), 16);
  const pg = parseInt(full.slice(2, 4), 16);
  const pb = parseInt(full.slice(4, 6), 16);
  const r = Number.isNaN(pr) ? 245 : pr;
  const g = Number.isNaN(pg) ? 245 : pg;
  const b = Number.isNaN(pb) ? 245 : pb;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.42 ? "dark" : "light";
}

export function classifyEasingCurve(curve) {
  if (/linear\(/i.test(curve)) return "CSS linear() spring physics";
  const m = curve.match(/cubic-bezier\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/i);
  if (!m) return "standard easing";
  const [, x1, y1, x2, y2] = m.map(Number);
  if (y1 > 1.02 || y2 > 1.02 || y1 < -0.02 || y2 < -0.02) return "overshoot spring";
  if (x1 <= 0.25 && y1 >= 0.8 && x2 <= 0.4 && y2 >= 0.98) return "snappy out-expo (Linear/Vercel grade)";
  if (Math.abs(x1 - 0.32) < 0.08 && Math.abs(y1 - 0.72) < 0.1 && y2 === 1) return "iOS sheet deceleration";
  return "custom cubic-bezier";
}

export async function analyzeWebsiteUrl(targetUrl, options = {}) {
  const url = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
  const timeoutMs = options.timeoutMs || 9000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let html = "";
  let status = 0;
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "forma-xray/1.0 (+https://forma.to; Open Design System & Motion Inspector)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    status = res.status;
    html = await res.text();
  } finally {
    clearTimeout(timer);
  }

  // Detect anti-bot challenge gates cleanly without attempting bypass
  if (
    status === 403 &&
    /cf-mitigated|Just a moment|challenge-platform|captcha/i.test(html)
  ) {
    throw new Error(
      `Target ${url.hostname} is gated behind an anti-bot challenge (HTTP 403). Run forma-xray locally on an unblocked page or supply public stylesheet URLs.`
    );
  }

  // Fetch up to 4 linked external stylesheets for deep CSS token & @keyframes inspection
  const sheetHrefs = [
    ...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi),
    ...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]+rel=["']stylesheet["']/gi),
  ]
    .map((m) => m[1])
    .slice(0, 4);

  const inlineStyles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
    .map((m) => m[1])
    .join("\n");

  const fetchedSheets = await Promise.all(
    sheetHrefs.map(async (href) => {
      try {
        const cssUrl = new URL(href, url.origin).toString();
        const r = await fetch(cssUrl, { signal: AbortSignal.timeout(5000) });
        return r.ok ? await r.text() : "";
      } catch {
        return "";
      }
    })
  );

  const fullCss = [inlineStyles, ...fetchedSheets].join("\n");
  const combinedSource = `${html}\n${fullCss}`;

  // 1. Metadata
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  const title = (titleMatch?.[1] || url.hostname).replace(/\s+/g, " ").trim();
  const description = (descMatch?.[1] || `Extracted design & motion genome from ${url.hostname}`).trim();

  // 2. Surface & CSS Custom Properties
  const cssVars = [...fullCss.matchAll(/(--[a-zA-Z0-9-_]+)\s*:\s*([^;}{]+);/g)]
    .slice(0, 60)
    .map((m) => ({ name: m[1], value: m[2].trim() }));

  const hexMatches = [
    ...fullCss.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g),
  ].map((m) => m[0].toLowerCase());
  const oklchMatches = [...fullCss.matchAll(/oklch\([^)]+\)/gi)].map((m) => m[0]);
  const topColors = uniqueTop(hexMatches, 12);

  // Check explicit dark class on html/body or dark color-scheme
  const explicitDark =
    /<html[^>]+class=["'][^"']*\bdark\b/i.test(html) ||
    /color-scheme:\s*dark/i.test(fullCss);
  const mode = explicitDark ? "dark" : parseLuminanceMode(topColors);

  const radii = uniqueTop(
    [...fullCss.matchAll(/border-radius\s*:\s*([^;}{]+)/gi)].map((m) => m[1]),
    6
  );

  // 3. Typography (Google Fonts + Fontshare CDN + @font-face)
  const googleFontFamilies = [
    ...combinedSource.matchAll(/fonts\.googleapis\.com\/css2\?([^"')\s]+)/gi),
  ].flatMap((m) =>
    [...m[1].matchAll(/family=([^&:]+)/gi)].map((f) =>
      decodeURIComponent(f[1]).replace(/\+/g, " ")
    )
  );
  const fontshareFamilies = [
    ...combinedSource.matchAll(/api\.fontshare\.com\/v2\/css\?([^"')\s]+)/gi),
  ].flatMap((m) =>
    [...m[1].matchAll(/f(?:\[\]|%5B%5D)=([^&@]+)/gi)].map((f) =>
      decodeURIComponent(f[1])
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
  );
  const fontsourceFamilies = [
    ...combinedSource.matchAll(/@fontsource(?:-variable)?\/([a-z0-9-]+)/gi),
  ].map((m) =>
    m[1]
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
  const fontFaceFamilies = [
    ...fullCss.matchAll(/@font-face\s*\{[^}]*font-family\s*:\s*["']?([^;"'}]+)["']?/gi),
  ].map((m) => m[1].trim());
  const declaredFontStacks = uniqueTop(
    [...fullCss.matchAll(/font-family\s*:\s*([^;}{]+)/gi)].map((m) => m[1]),
    8
  );
  const openTypeFeatureSettings = uniqueTop(
    [...fullCss.matchAll(/font-feature-settings\s*:\s*([^;}{]+)/gi)].map((m) => m[1]),
    5
  ).map((f) => f.value);
  const fluidClamps = uniqueTop(
    [...fullCss.matchAll(/clamp\([^)]+\)/gi)].map((m) => m[0]),
    6
  );
  const unsafeZoomClamps = auditClampZoomSafety(fluidClamps.map((c) => c.value));

  // 4. Layout & Modern Web Platform Features
  const maxWidths = uniqueTop(
    [...fullCss.matchAll(/max-width\s*:\s*(\d{3,4}px|\d{2,3}rem|\d{2}ch)/gi)].map((m) => m[1]),
    6
  );
  const modernPlatform = {
    containerQueries: /@container|container-type/i.test(fullCss),
    subgrid: /subgrid/i.test(fullCss),
    nativeDialog: /<dialog\b/i.test(html),
    popoverApi: /\bpopover(=|target|\b)/i.test(html),
    tabularNums: /tabular-nums/i.test(fullCss),
    backdropBlur: /backdrop-filter:\s*blur/i.test(fullCss),
    fontSizeAdjust: /font-size-adjust\s*:\s*from-font/i.test(fullCss),
    textWrapBalance: /text-wrap\s*:\s*balance/i.test(fullCss),
    userInvalidValidation: /:user-invalid\b/i.test(fullCss),
  };

  // 4b. DOM UX, Conversion (GoodUI / Baymard / Laws of UX) & CSS Hygiene (Project Wallace)
  const h1Matches = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  ).filter(Boolean);
  const buttonLabels = [
    ...html.matchAll(/<(?:button|a)\b[^>]*>([\s\S]{1,160}?)<\/(?:button|a)>/gi),
  ]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((txt) => txt.length >= 2 && txt.length <= 42);

  const vagueCtaLabels = [
    ...new Set(
      buttonLabels.filter((txt) =>
        /^(submit|enviar|send|click here|haz clic|learn more|saber m[aá]s|read more)$/i.test(txt)
      )
    ),
  ].slice(0, 5);

  const inputCount = [
    ...html.matchAll(/<input\b(?![^>]*type=["'](?:hidden|submit|button|reset)["'])[^>]*>/gi),
  ].length;
  const labelCount = [...html.matchAll(/<label\b[^>]*>/gi)].length;

  const domSignals = {
    h1Count: h1Matches.length,
    primaryH1: h1Matches[0] || "",
    ctaCount: buttonLabels.length,
    vagueCtaLabels,
    inputCount,
    labelCount,
    hasOgImage: /<meta[^>]+property=["']og:image["'][^>]+content=["'][^"']+["']/i.test(html),
    hasMainLandmark: /<main\b/i.test(html),
    hasNavLandmark: /<nav\b/i.test(html),
    hasFooterLandmark: /<footer\b/i.test(html),
    hasLangAttr: /<html[^>]+lang=["'][a-zA-Z-]+["']/i.test(html),
  };

  const importantCount = [...fullCss.matchAll(/!important\b/gi)].length;
  const uniqueHexCount = new Set(hexMatches).size;
  const hasFocusVisible = /:focus-visible\b/i.test(fullCss);
  const hasLayoutThrashTransition =
    /transition\s*:\s*all\b/i.test(fullCss) ||
    /@keyframes\s+[^{]+\{[^}]*\b(?:top|left|width|height|margin)\s*:/i.test(fullCss);

  const cssHygiene = {
    importantCount,
    uniqueHexCount,
    cssVariableCount: cssVars.length,
    hasFocusVisible,
    hasLayoutThrashTransition,
    unsafeZoomClamps,
  };

  // 5. Deep Motion, Physics & Choreography Analysis
  const keyframes = uniqueTop(
    [...fullCss.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/gi)].map((m) => m[1]),
    15
  ).map((k) => k.value);

  const bezierCurves = uniqueTop(
    [
      ...fullCss.matchAll(/cubic-bezier\([^)]+\)/gi),
      ...fullCss.matchAll(/linear\([^)]{12,}\)/gi),
    ].map((m) => m[0]),
    8
  ).map((c) => ({
    curve: c.value,
    count: c.count,
    feel: classifyEasingCurve(c.value),
  }));

  const durations = uniqueTop(
    [...fullCss.matchAll(/transition(?:-duration)?\s*:[^;}{]*?(\b\d{2,4}m?s\b)/gi)].map(
      (m) => m[1]
    ),
    6
  ).map((d) => d.value);

  const detectedEngines = MOTION_ENGINES.filter((eng) =>
    eng.pattern.test(combinedSource)
  ).map((eng) => eng.name);

  const honorsReducedMotion = /prefers-reduced-motion/i.test(fullCss);

  // 6. Anti-Slop & Craft Audit Score (0–100)
  let craftScore = 68;
  const warnings = [];
  const strengths = [];

  for (const sig of SLOP_SIGNALS) {
    if (sig.pattern.test(combinedSource)) {
      craftScore -= sig.penalty;
      warnings.push(sig.label);
    }
  }

  if (bezierCurves.length > 0) {
    craftScore += 8;
    strengths.push(`Custom motion curves (${bezierCurves[0].feel})`);
  }
  if (honorsReducedMotion) {
    craftScore += 6;
    strengths.push("Honors @media (prefers-reduced-motion)");
  }
  if (modernPlatform.tabularNums) {
    craftScore += 5;
    strengths.push("Uses tabular-nums for numeric alignment");
  }
  if (modernPlatform.containerQueries || modernPlatform.subgrid) {
    craftScore += 5;
    strengths.push("Modern CSS intrinsic layout (@container / subgrid)");
  }
  if (cssVars.length >= 8) {
    craftScore += 6;
    strengths.push(`Tokenized CSS architecture (${cssVars.length}+ custom properties)`);
  }
  if (oklchMatches.length > 0) {
    craftScore += 4;
    strengths.push("Perceptual OKLCH color space");
  }
  if (openTypeFeatureSettings.length > 0) {
    craftScore += 3;
    strengths.push(`OpenType features enabled (${openTypeFeatureSettings[0]})`);
  }

  craftScore = Math.max(15, Math.min(99, craftScore));

  // Synthesize canonical 5-layer tokens
  const bgHex =
    topColors.find((c) =>
      mode === "dark" ? /^#(0|1|2)/.test(c.value) : /^#(f|e|d)/i.test(c.value)
    )?.value || (mode === "dark" ? "#0e0e10" : "#f7f7f5");

  const inkHex =
    topColors.find((c) =>
      mode === "dark" ? /^#(f|e)/i.test(c.value) : /^#(0|1|2)/.test(c.value)
    )?.value || (mode === "dark" ? "#f5f5f4" : "#141413");

  const accentHex =
    topColors.find(
      (c) =>
        c.value !== bgHex &&
        c.value !== inkHex &&
        !/^#([0-9a-f])\1\1/i.test(c.value)
    )?.value || inkHex;

  const detectedFontFaces = [
    ...new Set([
      ...fontFaceFamilies,
      ...fontshareFamilies,
      ...fontsourceFamilies,
      ...googleFontFamilies,
    ]),
  ].slice(0, 10);

  const primaryFont =
    fontFaceFamilies[0] ||
    fontshareFamilies[0] ||
    fontsourceFamilies[0] ||
    googleFontFamilies[0] ||
    declaredFontStacks[0]?.value.split(",")[0]?.replace(/["']/g, "").trim() ||
    "Geist";

  const rosettaMatches = matchCommercialFontTwins(
    [primaryFont, ...detectedFontFaces, ...declaredFontStacks.map((f) => f.value)],
    fullCss
  );

  const apcaContrast = {
    bodyLc: computeApcaLc(inkHex, bgHex),
    accentOnBgLc: computeApcaLc(accentHex, bgHex),
  };

  const primaryEasing =
    bezierCurves[0]?.curve || "cubic-bezier(0.22, 1, 0.36, 1)";

  const report = {
    url: url.toString(),
    hostname: url.hostname,
    analyzedAt: new Date().toISOString(),
    title,
    description,
    craftScore,
    antiSlopAudit: {
      score: craftScore,
      grade: craftScore >= 90 ? "A+" : craftScore >= 80 ? "A" : craftScore >= 70 ? "B" : "C",
      strengths,
      warnings,
    },
    apcaContrast,
    domSignals,
    cssHygiene,
    layers: {
      surface: {
        mode,
        bg: bgHex,
        ink: inkHex,
        accent: accentHex,
        topHexPalette: topColors.slice(0, 8),
        oklchCount: oklchMatches.length,
        radii: radii.map((r) => r.value),
        cssVariablesSample: cssVars.slice(0, 16),
      },
      typography: {
        primaryFont,
        detectedFontFaces,
        fontStacks: declaredFontStacks.slice(0, 4).map((f) => f.value),
        openTypeFeatures: openTypeFeatureSettings,
        fluidClamps: fluidClamps.map((c) => c.value),
        rosettaMatches,
      },
      layout: {
        maxWidths: maxWidths.map((w) => w.value),
        modernPlatform,
      },
      motion: {
        primaryEasing,
        bezierCurves,
        durations,
        keyframes,
        detectedEngines,
        honorsReducedMotion,
        runtimeAnimations: options.runtimeData?.animations || [],
      },
    },
  };

  return {
    ...report,
    designMd: renderDesignMdFromXray(report),
  };
}

export function renderDesignMdFromXray(report) {
  const { surface, typography, layout, motion } = report.layers;
  const rosettaBlock =
    typography.rosettaMatches && typography.rosettaMatches.length > 0
      ? `\n- **Open-Source Legal Twin (Rosetta Match):** ${typography.rosettaMatches
          .map(
            (r) =>
              `${r.commercial} → **${r.openTwin}** (\`font-feature-settings: ${r.openTypeFeatures}\`)`
          )
          .join(" · ")}`
      : "";
  const apcaLine = report.apcaContrast?.bodyLc
    ? `\n- **Perceptual Contrast (APCA-W3):** \`Lc ${report.apcaContrast.bodyLc.signed}\` (\`--ink\` on \`--bg\`)`
    : "";

  return `# DESIGN.md — Extracted by forma-xray (${report.hostname})
> Source: ${report.url}
> Craft & Anti-Slop Score: **${report.craftScore}/100 (${report.antiSlopAudit.grade})**

## 1. Surface & Color Tokens (${surface.mode} mode)
- \`--bg\`: \`${surface.bg}\`
- \`--ink\`: \`${surface.ink}\`
- \`--accent\`: \`${surface.accent}\`${apcaLine}
- **Palette Distribution:** ${surface.topHexPalette.map((c) => `\`${c.value}\` (${c.count}×)`).join(", ") || "Minimal monochrome"}
- **Border Radii:** ${surface.radii.join(", ") || "8px, 9999px"}

## 2. Typography
- **Primary Family:** \`${typography.primaryFont}\`
- **Detected Fonts:** ${typography.detectedFontFaces.join(", ") || typography.fontStacks[0] || "System / Neo-grotesque"}
- **Fluid Scales (\`clamp()\`):** ${typography.fluidClamps.join(" | ") || "clamp(2.25rem, 1.4rem + 2.5vw, 4rem)"}${rosettaBlock}

## 3. Spatial Layout & Modern CSS
- **Container Max-Widths:** ${layout.maxWidths.join(", ") || "1180px"}
- **Platform Capabilities:** ${
    Object.entries(layout.modernPlatform)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(", ") || "Standard semantic grid"
  }

## 4. Motion Physics & Animation Choreography
- **Primary Easing Curve:** \`${motion.primaryEasing}\`
- **Detected Curves:** ${motion.bezierCurves.map((b) => `\`${b.curve}\` (${b.feel})`).join(", ") || "cubic-bezier(0.22, 1, 0.36, 1)"}
- **Transition Durations:** ${motion.durations.join(", ") || "160ms, 240ms"}
- **CSS \`@keyframes\`:** ${motion.keyframes.join(", ") || "None (restraint-first)"}
- **Motion Engines:** ${motion.detectedEngines.join(", ") || "Pure zero-JS CSS transitions"}
- **Accessibility:** Always include \`@media (prefers-reduced-motion: reduce)\`.

## 5. Mandatory Anti-Slop Guardrails
- NEVER introduce purple-indigo AI gradients or \`01 //\` fake eyebrows.
- Restrict animations strictly to GPU-composited \`transform\` and \`opacity\`.
`;
}
