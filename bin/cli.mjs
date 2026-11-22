#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import readline from "node:readline";
import { analyzeWebsiteUrl } from "../src/analyzer.mjs";
import { runPlaywrightRuntimeProbe } from "../src/playwright-probe.mjs";
import { scanWebsiteSections } from "../src/section-scanner.mjs";

const args = process.argv.slice(2);
const cmd = args[0];

const CONFIG_PATH = join(homedir(), ".config", "forma", "credentials.json");

function readSavedConfig() {
  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function saveConfig(next) {
  const merged = { ...readSavedConfig(), ...next };
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), { mode: 0o600 });
  return merged;
}

function resolveEndpoint() {
  const idx = args.indexOf("--endpoint");
  if (idx !== -1 && args[idx + 1]) return args[idx + 1].replace(/\/$/, "");
  const saved = readSavedConfig();
  return (
    process.env.FORMA_ENDPOINT ||
    saved.endpoint ||
    "http://localhost:3030"
  ).replace(/\/$/, "");
}

function resolveFormaKey() {
  const idx = args.indexOf("--key");
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const saved = readSavedConfig();
  return process.env.FORMA_API_KEY || saved.apiKey || "";
}

async function runBalanceCommand() {
  const endpoint = resolveEndpoint();
  const key = resolveFormaKey();
  const url = key
    ? `${endpoint}/api/credits?key=${encodeURIComponent(key)}`
    : `${endpoint}/api/credits`;

  const res = await fetch(url, {
    headers: key ? { "X-Forma-Key": key } : {},
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch balance from ${endpoint} (HTTP ${res.status})`);
  }
  const data = await res.json();
  const w = data.wallet;

  if (args.includes("--json")) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(`
forma.to — Prepaid Agent Wallet & BYOK Status
──────────────────────────────────────────────────────────
Token:          ${w.apiKey}
Balance:        $${Number(w.balanceUsd).toFixed(2)} USD (never expires · 0% top-up fee)
BYOK (Gemini):  ${w.hasByokGemini ? `Active (${w.maskedByok}) → $0.00/call` : "Not configured (pass X-Gemini-Key for $0.00/call)"}
Daily Cap:      $${Number(w.spentTodayUsd).toFixed(2)} / $${Number(w.dailyLimitUsd).toFixed(2)} USD today
Endpoint:       ${endpoint}
`);
}

async function runTopupCommand() {
  const endpoint = resolveEndpoint();
  const key = resolveFormaKey();
  const rawAmt = args[1] && !args[1].startsWith("--") ? Number(args[1]) : 5;
  const amountUsd = Number.isFinite(rawAmt) && rawAmt > 0 ? rawAmt : 5;

  const res = await fetch(`${endpoint}/api/credits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "X-Forma-Key": key } : {}),
    },
    body: JSON.stringify({
      action: "topup",
      apiKey: key || undefined,
      amountUsd,
    }),
  });

  if (!res.ok) {
    throw new Error(`Top-up request failed at ${endpoint} (HTTP ${res.status})`);
  }

  const data = await res.json();
  if (data.checkoutUrl) {
    console.log(`Complete $${amountUsd.toFixed(2)} prepaid top-up (0% fee):\n  ${data.checkoutUrl}`);
    return;
  }

  const w = data.wallet;
  saveConfig({ apiKey: w.apiKey, endpoint });
  console.log(
    `✓ Added +$${amountUsd.toFixed(2)} prepaid credit to ${w.apiKey} — New balance: $${Number(
      w.balanceUsd
    ).toFixed(2)} USD`
  );
}

async function runAuthCommand() {
  const tokenArg = args[1] && !args[1].startsWith("--") ? args[1] : "";
  const byokIdx = args.indexOf("--byok");
  const byokKey = byokIdx !== -1 ? args[byokIdx + 1] : undefined;
  const endpoint = resolveEndpoint();

  if (!tokenArg && !byokKey) {
    const res = await fetch(`${endpoint}/api/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "provision" }),
    });
    if (!res.ok) {
      throw new Error(`Could not provision token from ${endpoint}`);
    }
    const data = await res.json();
    saveConfig({ apiKey: data.wallet.apiKey, endpoint });
    console.log(
      `✓ Provisioned new forma token (${data.wallet.apiKey}) with $${Number(
        data.wallet.balanceUsd
      ).toFixed(2)} free starter credit.\n  Saved to ${CONFIG_PATH}`
    );
    return;
  }

  const saved = saveConfig({
    ...(tokenArg ? { apiKey: tokenArg } : {}),
    endpoint,
  });

  if (byokKey !== undefined) {
    await fetch(`${endpoint}/api/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "byok",
        apiKey: saved.apiKey,
        geminiKey: byokKey,
      }),
    });
  }

  console.log(`✓ Saved forma CLI credentials to ${CONFIG_PATH}`);
}

async function runMcpStdio() {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    const { id, method, params } = msg;
    if (method === "initialize") {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "forma-xray", version: "1.2.0" },
          },
        }) + "\n"
      );
    } else if (method === "tools/list") {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              {
                name: "xray_website",
                description:
                  "Deep-analyze any public URL to extract its 5-layer design system (surface, typography, layout, motion physics/animations, anti-slop score) and generate DESIGN.md.",
                inputSchema: {
                  type: "object",
                  properties: {
                    url: { type: "string", description: "Public URL to inspect" },
                  },
                  required: ["url"],
                },
              },
              {
                name: "scan_website_sections",
                description:
                  "Render a live URL in headless Chromium (Playwright), segment canonical sections (navbar, hero, bento-features, pricing, cta-footer), capture section screenshots, extract Clean Semantic DOM Blueprints, and run Gemini Vision analysis.",
                inputSchema: {
                  type: "object",
                  properties: {
                    url: { type: "string", description: "Public URL to render and segment" },
                  },
                  required: ["url"],
                },
              },
            ],
          },
        }) + "\n"
      );
    } else if (method === "tools/call" && params?.name === "xray_website") {
      try {
        const res = await analyzeWebsiteUrl(params.arguments.url);
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: res.designMd }] },
          }) + "\n"
        );
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: err.message },
          }) + "\n"
        );
      }
    } else if (method === "tools/call" && params?.name === "scan_website_sections") {
      try {
        const res = await scanWebsiteSections(params.arguments.url);
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            result: { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] },
          }) + "\n"
        );
      } catch (err) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: -32000, message: err.message },
          }) + "\n"
        );
      }
    }
  }
}

async function main() {
  if (cmd === "mcp") {
    await runMcpStdio();
    return;
  }
  if (cmd === "balance") {
    await runBalanceCommand();
    return;
  }
  if (cmd === "topup") {
    await runTopupCommand();
    return;
  }
  if (cmd === "auth" || cmd === "login") {
    await runAuthCommand();
    return;
  }

  const target = cmd === "analyze" ? args[1] : cmd;
  if (!target || target === "--help" || target === "-h") {
    console.log(`
forma-xray v1.2.0 — Agentic Web Design, Section DOM, Vision & Prepaid Gateway CLI

Usage:
  npx forma-xray <url> [--out DESIGN.md] [--json] [--runtime] [--sections]
  npx forma-xray balance [--key sk-forma-...] [--endpoint https://forma.to]
  npx forma-xray topup [5|10|25] [--key sk-forma-...]
  npx forma-xray auth [sk-forma-...] [--byok AIzaSy...]
  npx forma-xray mcp    # Start Stdio MCP Server for Claude Code / Cursor

Examples:
  npx forma-xray https://resiz.es --out DESIGN.md
  npx forma-xray https://cal.com --sections --out sections.json
  npx forma-xray balance
  npx forma-xray topup 10
`);
    process.exit(0);
  }

  const useRuntime = args.includes("--runtime");
  const useSections = args.includes("--sections");
  const asJson = args.includes("--json");
  const outIdx = args.indexOf("--out");
  const outFile = outIdx !== -1 ? args[outIdx + 1] : null;

  if (useSections) {
    const sectionReport = await scanWebsiteSections(target);
    const outPayload = JSON.stringify(sectionReport, null, 2);
    if (outFile) {
      writeFileSync(outFile, outPayload, "utf8");
      console.log(
        `✓ Captured ${sectionReport.totalSections} live visual sections & Clean DOM blueprints to ${outFile}`
      );
      return;
    }
    console.log(outPayload);
    return;
  }

  let runtimeData = null;
  if (useRuntime) {
    runtimeData = await runPlaywrightRuntimeProbe(target);
  }

  const result = await analyzeWebsiteUrl(target, { runtimeData });

  if (outFile) {
    writeFileSync(outFile, asJson ? JSON.stringify(result, null, 2) : result.designMd, "utf8");
    console.log(`✓ Saved ${outFile} — Craft Score: ${result.craftScore}/100 (${result.antiSlopAudit.grade})`);
    return;
  }

  console.log(asJson ? JSON.stringify(result, null, 2) : result.designMd);
}

main().catch((err) => {
  console.error(`forma-xray error: ${err.message}`);
  process.exit(1);
});
