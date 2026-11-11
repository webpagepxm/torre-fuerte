const { chromium } = require("playwright");
const fs = require("node:fs");
const { setup, base, output } = require("./browser.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await setup(browser);
  await context.addInitScript(() => {
    window.__tfPerformance = { lcp: 0, cls: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        window.__tfPerformance.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__tfPerformance.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: 200000,
    uploadThroughput: 93750,
  });
  await page.goto(base + "/");
  await page.waitForTimeout(3000);
  const metrics = await page.evaluate(() => ({
    ...window.__tfPerformance,
    domContentLoaded:
      performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd,
    resources: performance
      .getEntriesByType("resource")
      .map((r) => ({
        name: r.name.replace(location.origin, ""),
        bytes: r.transferSize,
      })),
  }));
  fs.writeFileSync(
    output + "/performance.json",
    JSON.stringify(
      {
        conditions:
          "Chromium local, viewport 390×844, CPU 4×, 200000 B/s download, latency 150ms. Una ejecución, sin servidor de producción.",
        ...metrics,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(metrics));
  // Carga diferida: el portal debe crear un PDF real sin etiquetas de biblioteca precargadas.
  await page.goto(base + "/operacion/");
  await page.locator(".order-card button").first().click();
  await page.waitForFunction(
    () => !document.querySelector("#addItem").disabled,
  );
  if (await page.evaluate(() => !!window.pdfMake))
    throw Error("pdfmake se cargó antes de necesitarlo");
  await page.locator("#addItem").click();
  const row = page.locator(".itemrow");
  await row.locator("input").nth(0).fill("Servicio ficticio");
  await row.locator("input").nth(2).fill("100");
  const download = page.waitForEvent("download");
  await page.locator("#pdfDownload").click();
  await (await download).saveAs(output + "/nota-carga-diferida.pdf");
  console.log("PDF diferido real: OK");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
