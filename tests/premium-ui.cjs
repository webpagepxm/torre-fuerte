// Refinamiento visual: conserva contratos y comprueba interacción con movimiento.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const { setup, base, root, output } = require("./browser.cjs");
const checkpoint = "090dd00c99364a4e010a1c7f97409b0875849b12";
const before = (file) =>
  execFileSync("git", ["show", checkpoint + ":" + file], {
    cwd: root,
    encoding: "utf8",
  });
const hash = (text) => createHash("sha256").update(text).digest("hex");
const scripts = (text) =>
  [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) =>
    hash(m[1]),
  );
const links = (text) =>
  [...text.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]).sort();
const controls = (text) =>
  [...text.matchAll(/<(input|select|textarea)\b([^>]*)>/g)].map((m) => {
    const result = { tag: m[1] };
    for (const key of [
      "id",
      "name",
      "type",
      "min",
      "max",
      "minlength",
      "maxlength",
      "pattern",
      "step",
      "required",
    ]) {
      const attr = new RegExp(
        "(?:^|\\s)" + key + '(?:="([^"]*)")?(?=\\s|/|$)',
      ).exec(m[2]);
      if (attr) result[key] = attr[1] ?? true;
    }
    return result;
  });

(async () => {
  let passed = 0;
  const pass = (name) => {
    passed++;
    console.log("PASS " + name);
  };
  const current = fs.readFileSync(root + "/index.html", "utf8");
  assert.deepEqual(scripts(current), scripts(before("index.html")));
  assert.deepEqual(links(current), links(before("index.html")));
  assert.deepEqual(controls(current), controls(before("index.html")));
  for (const file of [
    "operacion/app.js",
    "operacion/service-lines.mjs",
    "tf-config.js",
    "script.js",
    "styles.css",
    "seguimiento/index.html",
    "aviso-privacidad.html",
    "sliderbros-studio/index.html",
    "torre-fuerte.vcf",
  ])
    assert.equal(
      hash(fs.readFileSync(root + "/" + file, "utf8")),
      hash(before(file)),
      file + " alterado",
    );
  pass(
    "Scripts públicos, WhatsApp, enlaces, validaciones y archivos de negocio idénticos al checkpoint",
  );

  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [];
  try {
    const context = await setup(browser),
      page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(base + "/");
    const main = page.locator(".hero-actions .btn-red");
    await main.hover();
    await page.mouse.down();
    await page.waitForTimeout(70);
    const pressed = await main.evaluate((el) => getComputedStyle(el).transform);
    assert.notEqual(pressed, "none");
    assert(
      parseFloat(pressed.match(/matrix\(([^,]+)/)?.[1]) < 1,
      "Respuesta física al pulsar",
    );
    await page.mouse.up();
    await page.waitForURL("**/#agenda");
    assert.equal(
      await page.locator("#tab-cita").getAttribute("aria-selected"),
      "true",
    );
    pass(
      "CTA responde al pulsar y navega de inmediato al formulario existente",
    );

    await page.goto(base + "/");
    await page.locator(".service-card a").first().hover();
    await page.waitForTimeout(250);
    const arrow = await page
      .locator(".t-learn-chevron")
      .first()
      .evaluate((el) => getComputedStyle(el).transform);
    assert.notEqual(arrow, "none");
    assert(parseFloat(arrow.split(",")[4]) > 0, "Flecha reconoce hover");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await main.evaluate((el) => getComputedStyle(el).transitionDuration),
      "0s",
    );
    assert.equal(
      await page
        .locator(".t-learn-chevron")
        .first()
        .evaluate((el) => getComputedStyle(el).transitionDuration),
      "0s",
    );
    pass(
      "Transición transitions.dev aplicada; movimiento reducido elimina desplazamientos animados",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    for (const target of [
      ".nav-btn",
      ".menu-toggle",
      ".hero-actions .btn",
      ".booking-tab",
      ".form-submit",
      ".floating-wa",
    ]) {
      for (const el of await page.locator(target).all()) {
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        assert(box.height >= 44, target + " táctil");
      }
    }
    await page.locator(".menu-toggle").click();
    assert.equal(
      await page.locator(".menu-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await page.keyboard.press("Escape");
    assert(await page.locator("#mobile-menu").isHidden());
    await page.locator('#form-cita [name="nombre"]').focus();
    assert(
      parseFloat(
        await page
          .locator('#form-cita [name="nombre"]')
          .evaluate((el) => getComputedStyle(el).outlineWidth),
      ) >= 2,
    );
    assert.equal(
      await page
        .locator('#form-cita [name="nombre"]')
        .evaluate((el) => getComputedStyle(el).fontWeight),
      "400",
    );
    pass(
      "Objetivos táctiles, menú con Escape y foco de formulario conservados en móvil",
    );

    await page.goto(base + "/operacion/");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#accountMenu summary").click();
      const menu = await page.locator("#accountMenu > div").boundingBox();
      assert(
        menu.x >= 0 && menu.x + menu.width <= width,
        "Menú dentro de la pantalla",
      );
      assert.equal(
        await page
          .locator("#accountMenu > div")
          .evaluate((el) => getComputedStyle(el).animationName),
        "tf-menu-in",
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator("#accountMenu").evaluate((el) => el.open),
        false,
      );
    }
    pass(
      "Cuenta se abre desde el origen correcto y mantiene cierre por teclado en móvil/escritorio",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => (window.__tfTest.delay = 250));
    await page.locator("#refresh").click();
    assert(await page.locator("#refresh").isDisabled());
    assert.equal(
      await page
        .locator("#refresh .icon")
        .evaluate((el) => getComputedStyle(el).animationName),
      "tf-refresh",
    );
    await page.waitForFunction(
      () => !document.getElementById("refresh").disabled,
    );
    assert.equal(
      await page
        .locator("#refresh .icon")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.locator(".order-card button").first().click();
    assert.equal(
      await page.locator("#orderDialog").evaluate((el) => el.open),
      true,
    );
    assert.equal(
      await page
        .locator("#orderDialog")
        .evaluate((el) => getComputedStyle(el).animationName),
      "tf-surface-in",
    );
    const writes = await page.evaluate(
      () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
    );
    assert.equal(
      await page.evaluate(() => {
        document.querySelector('[data-close="orderDialog"]').click();
        return document.getElementById("orderDialog").open;
      }),
      false,
    );
    assert.equal(
      await page.evaluate(
        () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
      ),
      writes,
    );
    pass(
      "Carga tiene feedback solo mientras ocurre; diálogo abre y cierra sin esperas ni escrituras decorativas",
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".order-card button").first().click();
    assert.equal(
      await page
        .locator("#orderDialog")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.locator('[data-close="orderDialog"]').click();
    assert.deepEqual(errors, []);
    pass(
      "Acciones siguen disponibles con movimiento reducido y sin errores JavaScript",
    );
    fs.writeFileSync(
      output + "/premium-ui.json",
      JSON.stringify(
        { checkpoint, passed, errors, protectedScripts: scripts(current) },
        null,
        2,
      ),
    );
    console.log(passed + " comprobaciones de refinamiento aprobadas");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
