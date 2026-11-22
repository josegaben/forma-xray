import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import http from "node:http";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  analyzeWebsiteUrl,
  auditClampZoomSafety,
  classifyEasingCurve,
  computeApcaLc,
  matchCommercialFontTwins,
  parseLuminanceMode,
} from "../src/analyzer.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../bin/cli.mjs");

test("parseLuminanceMode handles pure pitch-black #000000 and warm stone #f4f4f1 accurately", () => {
  assert.equal(parseLuminanceMode([{ value: "#000000" }]), "dark");
  assert.equal(parseLuminanceMode([{ value: "#0a0a0b" }]), "dark");
  assert.equal(parseLuminanceMode([{ value: "#f4f4f1" }]), "light");
  assert.equal(parseLuminanceMode([{ value: "#ffffff" }]), "light");
});

test("classifyEasingCurve identifies out-expo, iOS sheet deceleration, and CSS linear() springs", () => {
  assert.match(classifyEasingCurve("cubic-bezier(0.22, 1, 0.36, 1)"), /out-expo/i);
  assert.match(classifyEasingCurve("cubic-bezier(0.32, 0.72, 0, 1)"), /iOS sheet/i);
  assert.match(classifyEasingCurve("cubic-bezier(0.34, 1.56, 0.64, 1)"), /overshoot/i);
  assert.match(classifyEasingCurve("linear(0, 0.5, 1.05, 1)"), /linear\(\) spring/i);
});

test("analyzeWebsiteUrl extracts 5-layer tokens, Fontshare families, OKLCH, and A+ Craft Score", async () => {
  const fixtureHtml = `<!doctype html>
<html lang="en">
<head>
  <title>Vektor — Sovereign Cloud</title>
  <meta name="description" content="Zero-slop dark infrastructure control plane." />
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700&f[]=satoshi@400,500&display=swap" />
  <style>
    :root {
      --bg: #000000;
      --surface: #111113;
      --panel: #18181b;
      --ink: #f5f5f4;
      --muted: #9ca3af;
      --line: rgba(255,255,255,0.1);
      --accent: #e06d44;
      --accent-oklch: oklch(66.4% 0.165 38);
      --radius: 14px;
    }
    body {
      background: #000000;
      color: #f5f5f4;
      font-family: 'Cabinet Grotesk', sans-serif;
      font-variant-numeric: tabular-nums;
    }
    .bento { container-type: inline-size; max-width: 1120px; border-radius: 14px; }
    .btn { transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1); }
    @keyframes fadeUp { from { opacity: 0; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }
  </style>
</head>
<body><dialog></dialog><h1>Vektor</h1></body>
</html>`;

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fixtureHtml);
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;

  try {
    const report = await analyzeWebsiteUrl(`http://127.0.0.1:${port}`);
    assert.equal(report.layers.surface.mode, "dark");
    assert.equal(report.layers.surface.bg, "#000000");
    assert.equal(report.layers.typography.primaryFont, "Cabinet Grotesk");
    assert.ok(report.layers.typography.detectedFontFaces.includes("Satoshi"));
    assert.ok(report.layers.layout.modernPlatform.containerQueries);
    assert.ok(report.layers.layout.modernPlatform.tabularNums);
    assert.ok(report.layers.motion.honorsReducedMotion);
    assert.ok(report.craftScore >= 90, `Expected A+ score >= 90, got ${report.craftScore}`);
    assert.match(report.designMd, /# DESIGN\.md/);
  } finally {
    server.close();
  }
});

test("analyzeWebsiteUrl penalizes AI-slop purple gradients and fake numbered eyebrows", async () => {
  const slopHtml = `<!doctype html><html><head><title>SlopAI</title></head>
  <body class="bg-gradient-to-r from-purple-500 to-pink-500 animate-bounce">
    <span>01 // FEATURES</span>
    <h1>Supercharge your workflow and unleash the power of AI</h1>
  </body></html>`;

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(slopHtml);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  try {
    const report = await analyzeWebsiteUrl(`http://127.0.0.1:${port}`);
    assert.ok(report.craftScore < 45, `Expected low craft score, got ${report.craftScore}`);
    assert.ok(report.antiSlopAudit.warnings.length >= 3);
  } finally {
    server.close();
  }
});

test("computeApcaLc, matchCommercialFontTwins, and auditClampZoomSafety evaluate perceptual & typographic quality", () => {
  const highLight = computeApcaLc("#141413", "#f4f4f1");
  assert.ok(highLight.abs >= 90, `Expected high APCA Lc >= 90, got ${highLight.abs}`);
  const lowDark = computeApcaLc("#4b5563", "#111827");
  assert.ok(lowDark.abs < 45, `Expected low APCA Lc < 45, got ${lowDark.abs}`);

  const rosetta = matchCommercialFontTwins(["Söhne", "PP Editorial New", "Berkeley Mono"]);
  assert.ok(rosetta.length >= 3, `Expected >= 3 Rosetta font matches, got ${rosetta.length}`);
  assert.ok(rosetta.some((r) => r.pairingId === "pair-uncut-commit"));

  const unsafeClamps = auditClampZoomSafety([
    "clamp(1rem, 4vw, 4rem)",
    "clamp(2rem, 1.2rem + 2.5vw, 4.4rem)",
  ]);
  assert.equal(unsafeClamps.length, 1);
  assert.equal(unsafeClamps[0].ratio, 4);
});

test("CLI --help and MCP stdio server respond cleanly", () => {
  const helpRun = spawnSync(process.execPath, [CLI_PATH, "--help"], {
    encoding: "utf8",
  });
  assert.equal(helpRun.status, 0);
  assert.match(helpRun.stdout, /forma-xray v1\.2\.0/);
  assert.match(helpRun.stdout, /balance/);

  const mcpRun = spawnSync(process.execPath, [CLI_PATH, "mcp"], {
    input: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) + "\n",
    encoding: "utf8",
  });
  assert.equal(mcpRun.status, 0);
  const parsed = JSON.parse(mcpRun.stdout.trim());
  assert.equal(parsed.jsonrpc, "2.0");
  assert.ok(Array.isArray(parsed.result.tools));
  assert.ok(parsed.result.tools.some((t) => t.name === "xray_website"));
  assert.ok(parsed.result.tools.some((t) => t.name === "scan_website_sections"));
});
