const { chromium } = require("playwright");
const fs = require("node:fs");
const { setup, base, root } = require("./browser.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await setup(browser),
      page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
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
    await page.evaluate(() => {
      document.querySelector("#calendarTab").addEventListener(
        "click",
        () => {
          const start = performance.now();
          const observer = new MutationObserver(() => {
            if (
              !document.querySelector(
                ".fc-listWeek-view .calendar-event-button",
              )
            )
              return;
            observer.disconnect();
            requestAnimationFrame(
              () => (window.__calendarReadyMs = performance.now() - start),
            );
          });
          observer.observe(document.querySelector("#calendar"), {
            childList: true,
            subtree: true,
          });
        },
        { once: true },
      );
    });
    await page.locator("#calendarTab").click();
    await page.waitForFunction(() => window.__calendarReadyMs > 0);
    const result = await page.evaluate(() => ({
      calendarReadyMs: window.__calendarReadyMs,
      pdfLoaded: !!window.pdfMake,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      eventCount: document.querySelectorAll(".calendar-event-button").length,
    }));
    const report = {
      conditions:
        "Una muestra Chromium 390×844, CPU 4×, 200000 B/s y latencia 150 ms; backend/CDN aislados. Tiempo desde click hasta primer cuadro de Agenda; no producción ni Android físico.",
      ...result,
    };
    fs.writeFileSync(
      root + "/docs/qa/calendar/performance.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
