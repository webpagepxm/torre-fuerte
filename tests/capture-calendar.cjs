const { chromium } = require("playwright");
const { setup, base, root } = require("./browser.cjs");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await setup(browser);
    await context.addInitScript(() =>
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = "")),
    );
    const phase = process.env.TF_PHASE || "after";
    if (!["before", "after"].includes(phase)) throw Error("Fase inválida");
    if (phase === "before")
      for (const [pattern, file, type] of [
        ["**/operacion/", "operacion/index.html", "text/html"],
        ["**/operacion/style.css*", "operacion/style.css", "text/css"],
        ["**/operacion/app.js*", "operacion/app.js", "text/javascript"],
      ])
        await context.route(pattern, (route) =>
          route.fulfill({
            contentType: type,
            body: execFileSync("git", ["show", "6b41f40:" + file], {
              cwd: root,
            }),
          }),
        );
    const page = await context.newPage();
    const dir = root + "/docs/qa/calendar/" + phase;
    fs.mkdirSync(dir, { recursive: true });
    await page.goto(base + "/operacion/");
    await page.locator("#calendarTab").click();
    await page.locator(".fc").waitFor();
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForTimeout(100);
      await page.screenshot({
        path: dir + "/calendar-" + width + ".png",
        fullPage: true,
      });
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.locator("#calendarMonth, .fc-dayGridMonth-button").click();
    await page.screenshot({ path: dir + "/month-390.png", fullPage: true });
    console.log(dir);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
