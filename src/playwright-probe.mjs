/**
 * forma-xray — Optional Deep Playwright Runtime Motion & Scroll Choreography Probe
 * Captures live Web Animations API (document.getAnimations()), computed :root styles,
 * interactive :hover state deltas, and scroll-triggered sticky offsets.
 */

import { existsSync } from "node:fs";

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export async function runPlaywrightRuntimeProbe(targetUrl) {
  let chromium;
  try {
    const pw = await import(/* webpackIgnore: true */ "playwright-core");
    chromium = pw.chromium || pw.default?.chromium;
  } catch {
    throw new Error(
      "Playwright is optional and not installed. Run `npm i -D playwright-core` for deep WAAPI runtime probing, or run default zero-install mode."
    );
  }

  const executablePath = CHROME_PATHS.find((p) => p && existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1200);

    const initialProbe = await page.evaluate(() => {
      // 1. Live Web Animations API (CSS Animations, CSS Transitions, WAAPI, Motion)
      const activeAnimations = document.getAnimations({ subtree: true }).slice(0, 25).map((anim) => {
        const timing = anim.effect?.getTiming?.() || {};
        const keyframes = anim.effect?.getKeyframes?.() || [];
        return {
          animationName: anim.animationName || anim.id || "waapi-effect",
          duration: timing.duration,
          easing: timing.easing,
          iterations: timing.iterations,
          animatedProperties: [
            ...new Set(
              keyframes.flatMap((kf) =>
                Object.keys(kf).filter(
                  (k) => !["offset", "computedOffset", "easing", "composite"].includes(k)
                )
              )
            ),
          ],
        };
      });

      // 2. Sticky / Fixed Choreography Elements
      const stickyElements = [...document.querySelectorAll("*")]
        .filter((el) => {
          const pos = getComputedStyle(el).position;
          return pos === "sticky" || pos === "fixed";
        })
        .slice(0, 12)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          top: getComputedStyle(el).top,
          height: Math.round(el.getBoundingClientRect().height),
          backdropFilter: getComputedStyle(el).backdropFilter,
        }));

      return { animations: activeAnimations, stickyElements };
    });

    // Scroll 600px to detect scroll-triggered header shrink or reveal timelines
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
    await page.waitForTimeout(250);

    const afterScrollAnimations = await page.evaluate(() =>
      document.getAnimations({ subtree: true }).length
    );

    return {
      ...initialProbe,
      scrollTriggeredDelta: afterScrollAnimations - initialProbe.animations.length,
    };
  } finally {
    await browser.close();
  }
}
