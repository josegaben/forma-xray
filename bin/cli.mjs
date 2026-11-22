#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import readline from "node:readline";
import { analyzeWebsiteUrl } from "../src/analyzer.mjs";
import { runPlaywrightRuntimeProbe } from "../src/playwright-probe.mjs";
import { scanWebsiteSections } from "../src/section-scanner.mjs";

const args = process.argv.slice(2);
const cmd = args[0];

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
            serverInfo: { name: "forma-xray", version: "1.1.0" },
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

  const target = cmd === "analyze" ? args[1] : cmd;
  if (!target || target === "--help" || target === "-h") {
    console.log(`
forma-xray v1.1.0 — Deep Web Design, Motion Physics, Section DOM & Vision Inspector

Usage:
  npx forma-xray <url> [--out DESIGN.md] [--json] [--runtime] [--sections]
  npx forma-xray mcp    # Start Stdio MCP Server for Claude Code / Cursor

Examples:
  npx forma-xray https://resiz.es --out DESIGN.md
  npx forma-xray https://linear.app --runtime --sections --json
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
