const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { setup, base } = require("./browser.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const context = await setup(browser),
      page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/operacion/");
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    await page.locator("#addItem").click();
    let row = page.locator(".itemrow");
    await row.locator("input").nth(0).fill("Trabajo de prueba");
    await row.locator("input").nth(2).fill("10");
    await page.locator("#saveItems").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#itemsMessage")
        .textContent.includes("verificado"),
    );
    await page.evaluate(
      () =>
        (window.pdfMake = {
          vfs: {},
          createPdf() {
            throw Error("Fallo de herramienta PDF simulado");
          },
        }),
    );
    await page.locator("#pdfDownload").click();
    await page.waitForFunction(() =>
      document.querySelector("#pdfMessage").classList.contains("is-error"),
    );
    assert.match(
      await page.locator("#itemsMessage").textContent(),
      /guardado y verificado/,
    );
    await row.locator("input").nth(0).fill("Trabajo corregido");
    assert(
      await page.locator("#pdfMessage").isHidden(),
      "El error PDF anterior debe retirarse cuando se modifica el desglose",
    );
    await page.locator("#saveItems").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#itemsMessage")
        .textContent.includes("verificado"),
    );
    assert(await page.locator("#pdfMessage").isHidden());
    // Retirar la dependencia simulada antes de cargar la herramienta real.
    await page.evaluate(() => delete window.pdfMake);
    // La generación de una nota ya guardada no debe repetir UPDATE.
    await page.addScriptTag({
      url: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js",
    });
    await page.addScriptTag({
      url: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.min.js",
    });
    await page.evaluate(
      () => (window.__tfTest.fail = "tf_service_lines:update"),
    );
    const download = page.waitForEvent("download");
    await page.locator("#pdfDownload").click();
    const file = await download;
    assert.match(file.suggestedFilename(), /nota-servicio\.pdf$/);
    await page.waitForFunction(() =>
      document
        .querySelector("#pdfMessage")
        .textContent.includes("Se inició la descarga"),
    );
    console.log(
      "PASS recuperación del mensaje PDF y descarga sin repetir UPDATE de un desglose sin cambios",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
