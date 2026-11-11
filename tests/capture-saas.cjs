const { chromium } = require("playwright");
const { setup, base, root } = require("./browser.cjs");
const fs = require("node:fs");
(async () => {
  const b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const c = await setup(b);
    await c.addInitScript(() => {
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
    });
    if (process.env.TF_PHASE === "before") {
      const { execFileSync } = require("node:child_process");
      for (const [pattern, file, contentType] of [
        [base + "/", "index.html", "text/html"],
        ["**/operacion/", "operacion/index.html", "text/html"],
        ["**/operacion/style.css*", "operacion/style.css", "text/css"],
      ])
        await c.route(pattern, (route) =>
          route.fulfill({
            contentType,
            body: execFileSync("git", ["show", "e9578bc:" + file], {
              cwd: root,
            }),
          }),
        );
    }
    const p = await c.newPage();
    const phase = process.env.TF_PHASE || "after";
    const dir = root + "/docs/qa/saas/" + phase;
    if (!["before", "after"].includes(phase)) throw Error("TF_PHASE inválida");
    fs.mkdirSync(dir, { recursive: true });
    for (const [route, label] of [["/operacion/", "ops"]]) {
      await p.goto(base + route);
      await p.waitForTimeout(200);
      await p.evaluate(async () => {
        for (const i of document.querySelectorAll('img[loading="lazy"]')) {
          i.loading = "eager";
          await i.decode().catch(() => {});
        }
      });
      for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        await p.mouse.move(0, 0);
        await p.screenshot({
          path: dir + "/" + label + "-" + width + ".png",
          fullPage: true,
        });
        if ([390, 1440].includes(width))
          await p.screenshot({
            path: dir + "/" + label + "-top-" + width + ".png",
          });
        if (route === "/" && [390, 1440].includes(width)) {
          await p.locator("#agenda").scrollIntoViewIfNeeded();
          await p.screenshot({ path: dir + "/booking-" + width + ".png" });
          await p.evaluate(() => scrollTo(0, 0));
        }
      }
    }
    await p.setViewportSize({ width: 390, height: 900 });
    await p.locator(".order-card button").first().click();
    await p.screenshot({ path: dir + "/order-390.png" });
    console.log(dir);
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
