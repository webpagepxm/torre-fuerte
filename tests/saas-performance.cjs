const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { setup, base, output } = require("./browser.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const context = await setup(browser);
    await context.addInitScript(() => {
      window.__activeQA = { draws: 0, longTasks: [], inputToFrame: 0 };
      const original = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (...a) {
        window.__activeQA.draws++;
        return original.apply(this, a);
      };
      new PerformanceObserver((list) =>
        list
          .getEntries()
          .forEach((e) => window.__activeQA.longTasks.push(e.duration)),
      ).observe({ type: "longtask", buffered: true });
    });
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: 200000,
      uploadThroughput: 93750,
    });
    await page.goto(base + "/operacion/");
    await page.locator(".order-card button").first().waitFor();
    await page.waitForTimeout(800);
    const idleDraws = await page.evaluate(() => window.__activeQA.draws);
    assert.equal(idleDraws, 0, "Sin dibujos en reposo");
    await page.locator("#search").focus();
    await page.waitForSelector('.filters [data-renderer="webgl"]');
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.__activeQA.draws = 0;
      window.__activeQA.longTasks = [];
    });
    await page.waitForTimeout(2000);
    const effect = await page.evaluate(() => ({
      ...window.__activeQA,
      canvas: [
        document.querySelector(".filters canvas").width,
        document.querySelector(".filters canvas").height,
      ],
    }));
    await page.evaluate(() =>
      document.querySelector("#search").addEventListener(
        "input",
        () => {
          const start = performance.now();
          requestAnimationFrame(
            () => (window.__activeQA.inputToFrame = performance.now() - start),
          );
        },
        { once: true },
      ),
    );
    await page.locator("#search").fill("Italika");
    await page.waitForTimeout(500);
    const result = {
      conditions:
        "Chromium 390×844, CPU 4×, 200000 B/s, latencia 150 ms, WebGL ANGLE/SwiftShader. Backend/CDN aislados; no Android físico. Muestra de 2 segundos tras carga.",
      ...effect,
      idleDraws,
      burstLimitMs: 1600,
      inputToNextFrameMs: await page.evaluate(
        () => window.__activeQA.inputToFrame,
      ),
      calendarLoaded: await page.evaluate(() => !!window.FullCalendar),
      pdfLoaded: await page.evaluate(() => !!window.pdfMake),
    };
    fs.writeFileSync(
      output + "/saas-performance-active.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(JSON.stringify(result));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
