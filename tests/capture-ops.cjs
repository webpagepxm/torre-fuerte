const { chromium } = require("playwright");
const { setup, base, root } = require("./browser.cjs");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
async function useCheckpoint(context) {
  for (const [pattern, file, type] of [
    ["**/operacion/", "index.html", "text/html"],
    ["**/operacion/style.css*", "style.css", "text/css"],
    ["**/operacion/app.js*", "app.js", "text/javascript"],
  ])
    await context.route(pattern, (route) =>
      route.fulfill({
        contentType: type,
        body: execFileSync("git", ["show", "a9e326f:operacion/" + file], {
          cwd: root,
        }),
      }),
    );
}
(async () => {
  const phase = process.env.TF_PHASE || "after";
  if (!["before", "after"].includes(phase))
    throw Error("TF_PHASE debe ser before o after");
  const dir = path.join(root, "docs/qa/unslop", phase);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await setup(browser);
    if (phase === "before") await useCheckpoint(context);

    // All order data and credentials in these captures are fixtures, never production.
    await context.addInitScript(() => {
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
    });
    const p = await context.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/operacion/");
    await p.waitForSelector("#workspace:not([hidden])");
    await p.waitForTimeout(300);
    for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      await p.waitForTimeout(150);
      await p.screenshot({
        path: dir + "/orders-" + width + ".png",
        fullPage: true,
      });
      if ([320, 390, 768, 1440].includes(width)) {
        const open =
          width < 700
            ? p.locator("#mobileOrders button").first()
            : p.locator("#ordersTable button").first();
        await open.click();
        await p.waitForSelector("#orderDialog[open]");
        await p.waitForTimeout(150);
        await p.screenshot({
          path: dir + "/detail-" + width + ".png",
          fullPage: true,
        });
        await p
          .locator("#jumpToNote")
          .count()
          .then(async (n) =>
            n
              ? p.locator("#jumpToNote").click()
              : p.locator("#orderDialog").evaluate((d) => {
                  d.scrollTop = d.scrollHeight;
                }),
          );
        await p.screenshot({
          path: dir + "/documents-" + width + ".png",
          fullPage: true,
        });
        await p.locator("#orderDialog [data-close]").click();
      }
    }
    await p.locator("#newOrder").click();
    await p.screenshot({ path: dir + "/receive-1440.png", fullPage: true });
    await p.locator("#newDialog [data-close]").first().click();
    await p.setViewportSize({ width: 390, height: 900 });
    await p.locator("#newOrder").click();
    await p.screenshot({ path: dir + "/receive-390.png", fullPage: true });
    await p.locator("#newDialog [data-close]").first().click();
    await p.locator("#calendarTab").click();
    await p.waitForSelector(".fc");
    await p.screenshot({ path: dir + "/calendar-390.png", fullPage: true });
    await p.setViewportSize({ width: 1440, height: 900 });
    await p.screenshot({ path: dir + "/calendar-1440.png", fullPage: true });
    const login = await setup(browser, false);
    if (phase === "before") await useCheckpoint(login);
    const l = await login.newPage();
    await l.goto(base + "/operacion/");
    for (const width of [320, 390, 1440]) {
      await l.setViewportSize({ width, height: width < 500 ? 740 : 900 });
      await l.screenshot({
        path: dir + "/login-" + width + ".png",
        fullPage: true,
      });
    }
    if (phase === "after") {
      await p.locator("#ordersTab").click();
      await p.setViewportSize({ width: 390, height: 900 });
      await p.locator(".order-card button").first().click();
      await p.locator("#addItem").click();
      const inputs = p.locator(".itemrow input");
      await inputs.nth(0).fill("Ajuste de cadena · prueba");
      await inputs.nth(2).fill("180");
      await p.locator("#saveItems").click();
      await p.waitForFunction(() =>
        document
          .getElementById("itemsMessage")
          .textContent.includes("verificado"),
      );
      await p.locator("#jumpToNote").click();
      await p.screenshot({
        path: dir + "/note-example-390.png",
        fullPage: true,
      });
    }
    console.log(JSON.stringify({ phase, errors, dir }));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
