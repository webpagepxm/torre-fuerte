const { chromium } = require("playwright");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { setup, base, root } = require("./browser.cjs");
const phase = process.env.TF_PHASE || "after";
if (!["before", "after"].includes(phase)) throw Error("Fase inválida");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const dir = root + "/docs/qa/rulo/" + phase;
  fs.mkdirSync(dir, { recursive: true });
  async function scene(name, width) {
    const context = await setup(browser, name !== "login");
    await context.addInitScript((state) => {
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
      if (state === "orders-empty") window.__tfTest.tf_requests = [];
      if (state === "agenda-empty")
        window.__tfTest.tf_requests.forEach(
          (r) => (r.requested_date = "2027-01-11"),
        );
    }, name);
    if (phase === "before")
      for (const [pattern, file, type] of [
        ["**/operacion/", "operacion/index.html", "text/html"],
        ["**/operacion/style.css*", "operacion/style.css", "text/css"],
        ["**/operacion/app.js*", "operacion/app.js", "text/javascript"],
      ])
        await context.route(pattern, (r) =>
          r.fulfill({
            contentType: type,
            body: execFileSync("git", ["show", "a3f6433:" + file], {
              cwd: root,
            }),
          }),
        );
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/operacion/");
    if (name !== "login")
      await page.locator("#workspace").waitFor({ state: "visible" });
    if (name === "search-empty")
      await page.locator("#search").fill("SIN-COINCIDENCIA-RULO");
    if (name === "offline")
      await page.evaluate(() => {
        Object.defineProperty(navigator, "onLine", {
          configurable: true,
          get: () => false,
        });
        dispatchEvent(new Event("offline"));
      });
    if (name === "complete") {
      await page
        .locator(width <= 760 ? ".order-card button" : ".tabulator-row button")
        .first()
        .click();
      await page.waitForFunction(
        () => !document.querySelector("#addItem").disabled,
      );
      await page.locator("#orderStatus").selectOption("lista");
      await page.locator("#saveOrder").click();
      await page.locator("#orderCompletion").waitFor({ state: "visible" });
    }
    if (name === "agenda-empty")
      await page.locator(".day-agenda").scrollIntoViewIfNeeded();
    if (name === "complete")
      await page.locator("#orderCompletion").scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      for (const img of document.querySelectorAll("picture img"))
        if (img.getClientRects().length) {
          img.loading = "eager";
          await img.decode().catch(() => {});
        }
    });
    await page.screenshot({
      path: dir + "/" + name + "-" + width + ".png",
      fullPage:
        name === "orders-empty" ||
        name === "search-empty" ||
        name === "agenda-empty",
    });
    await context.close();
  }
  try {
    for (const name of [
      "login",
      "orders-empty",
      "agenda-empty",
      "search-empty",
      "complete",
      "offline",
    ])
      for (const width of [390, 1440]) await scene(name, width);
    console.log(dir);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
