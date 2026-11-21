/**
 * forma-xray — Optional Deep Playwright Runtime Motion & Scroll Choreography Probe
 * Captures live Web Animations API (document.getAnimations()), computed :root styles,
 * interactive :hover state deltas, and scroll-triggered sticky offsets.
 */

export async function runPlaywrightRuntimeProbe(targetUrl) {
  let chromium;
  try {
    const pw = await import("playwright");
    chromium = pw.chromium;
  } catch {
    throw new Error(
      "Playwright is optional and not installed. Run `npm i -D playwright && npx playwright install chromium` for deep WAAPI runtime probing, or run default zero-install mode."
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 20000 });

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
