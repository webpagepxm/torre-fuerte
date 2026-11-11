// Estados de Rulo con datos ficticios aislados; nunca escribe en Supabase real.
const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { setup, base, root } = require("./browser.cjs");
const { assertBusinessContracts } = require("./contracts.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const checks = [],
    errors = [],
    requests = [],
    geometry = [],
    audits = [];
  const dir = root + "/docs/qa/rulo";
  fs.mkdirSync(dir, { recursive: true });
  const pass = (name) => {
    checks.push(name);
    console.log("PASS " + name);
  };
  async function create(name = "normal", width = 390, height = 900, extra) {
    const context = await setup(browser, name !== "login");
    await context.addInitScript((state) => {
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
      if (state === "orders-empty" || state === "failure")
        window.__tfTest.tf_requests = [];
      if (state === "agenda-empty")
        window.__tfTest.tf_requests.forEach(
          (r) => (r.requested_date = "2027-01-11"),
        );
      if (state === "failure") window.__tfTest.fail = "tf_requests:select";
    }, name);
    if (extra) await context.addInitScript(extra);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (r.url().includes("/assets/ops/")) requests.push(r.url());
    });
    await page.setViewportSize({ width, height });
    await page.goto(base + "/operacion/");
    if (name !== "login")
      await page.waitForFunction(
        () =>
          !document.querySelector("#workspace").hidden &&
          document.querySelector("#ordersSection").getAttribute("aria-busy") ===
            "false",
      );
    return { context, page };
  }
  async function art(page, selector, file) {
    const img = page.locator(selector);
    assert(await img.isVisible(), file + " visible");
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(async (el) => {
      el.loading = "eager";
      await el.decode();
    });
    const info = await img.evaluate((el) => ({
      source: el.currentSrc,
      alt: el.alt,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
      naturalWidth: el.naturalWidth,
      decorative: el.closest("picture")?.getAttribute("aria-hidden"),
    }));
    assert(info.source.endsWith(file + ".webp"), info.source);
    assert.equal(info.naturalWidth, 640);
    assert.equal(info.alt, "");
    assert.equal(info.decorative, "true");
    assert(Math.abs(info.width - info.height) < 1, "Proporción reservada");
    return info;
  }
  async function audit(page, label) {
    if (!(await page.evaluate(() => !!window.axe)))
      await page.addScriptTag({ path: "/tmp/tf-axe.min.js" });
    const violations = await page.evaluate(async () => {
      const r = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return r.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    audits.push({ surface: label, violations });
    assert.deepEqual(violations, [], label);
  }
  try {
    assertBusinessContracts();
    const before = execFileSync("git", ["show", "a3f6433:operacion/app.js"], {
        cwd: root,
        encoding: "utf8",
      }),
      after = fs.readFileSync(root + "/operacion/app.js", "utf8");
    const omitPresentation = (s) => {
      for (const name of ["renderActivity", "renderMobileOrders"])
        s = s.replace(
          new RegExp("function " + name + "\\([^]*?\\n\\}"),
          "function " + name + "() { /* presentación */ }",
        );
      return s;
    };
    assert.equal(
      omitPresentation(after),
      omitPresentation(before),
      "Todo el módulo excepto los dos renderers es idéntico",
    );
    for (const file of [
      "index.html",
      "operacion/service-lines.mjs",
      "operacion/atmosphere.js",
      "tf-config.js",
      "assets/ui-interactions.css",
    ])
      assert.equal(
        fs.readFileSync(root + "/" + file, "utf8"),
        execFileSync("git", ["show", "a3f6433:" + file], {
          cwd: root,
          encoding: "utf8",
        }),
      );
    pass(
      "Autenticación, consultas, WhatsApp, órdenes, comanda, PDF y landing idénticos; solo cambian dos renderers visuales",
    );
    const normal = await create();
    assert(await normal.page.locator("#opsEmptyOrders").isHidden());
    assert(await normal.page.locator("#opsEmptySearch").isHidden());
    assert.equal(await normal.page.locator(".ops-mini-empty").count(), 0);
    assert(await normal.page.locator("#orderCompletion").isHidden());
    assert(await normal.page.locator(".ops-connection-status").isHidden());
    pass("Una lista normal no muestra vacíos, desconexión o éxito de Rulo");
    await normal.page.locator("#search").fill("SIN-COINCIDENCIA-RULO");
    await art(normal.page, "#opsEmptySearch img", "rulo-sin-historial");
    assert(await normal.page.locator("#opsEmptyOrders").isHidden());
    await normal.page.locator("#resetFilters").click();
    assert(await normal.page.locator("#opsEmptySearch").isHidden());
    assert.equal(await normal.page.locator(".order-card").count(), 4);
    pass(
      "Búsqueda sin coincidencias usa carpeta/lupa y Limpiar recupera las órdenes",
    );
    const empty = await create("orders-empty");
    await art(empty.page, "#opsEmptyOrders img", "rulo-sin-ordenes");
    await empty.page.locator("#search").fill("filtro");
    assert(await empty.page.locator("#opsEmptySearch").isHidden());
    await empty.page.evaluate(() => (window.__tfTest.delay = 300));
    await empty.page.locator("#refresh").click();
    assert.equal(
      await empty.page.locator("#opsEmptyOrders").isVisible(),
      false,
    );
    await empty.page.waitForFunction(
      () =>
        document.querySelector("#ordersSection").getAttribute("aria-busy") ===
        "false",
    );
    assert(await empty.page.locator("#opsEmptyOrders").isVisible());
    pass(
      "Taller vacío solo tras consulta correcta; la escena se retira durante la carga",
    );
    await empty.page.evaluate(() => {
      window.__tfTest.delay = 0;
      window.__tfTest.fail = "tf_requests:select";
    });
    await empty.page.locator("#refresh").click();
    await empty.page.waitForFunction(
      () =>
        document.querySelector("#ordersSection").getAttribute("aria-busy") ===
        "false",
    );
    assert(await empty.page.locator("#opsEmptyOrders").isHidden());
    assert.equal(
      await empty.page.locator(".ops-mini-empty img").isVisible(),
      false,
    );
    assert.match(
      await empty.page.locator("#statusMessage").textContent(),
      /No pudimos actualizar/,
    );
    const failure = await create("failure");
    assert(await failure.page.locator("#opsEmptyOrders").isHidden());
    assert(await failure.page.locator("#opsEmptySearch").isHidden());
    assert.match(
      await failure.page.locator("#statusMessage").textContent(),
      /No pudimos consultar/,
    );
    pass(
      "Un fallo inicial o de actualización no se presenta con ilustraciones de datos vacíos",
    );
    await failure.page.evaluate(() => (window.__tfTest.fail = null));
    await failure.page.locator("#refresh").click();
    await failure.page.waitForFunction(
      () =>
        document.querySelector("#ordersSection").getAttribute("aria-busy") ===
        "false",
    );
    await art(failure.page, "#opsEmptyOrders img", "rulo-sin-ordenes");
    await failure.page.evaluate(() =>
      window.__tfTest.tf_requests.push({
        id: "new-fixture",
        folio: "TF-TEST-NUEVA",
        client_name: "Persona ficticia",
        client_phone: "0000000000",
        motorcycle: "Moto ficticia",
        service: "Revisión de prueba",
        status: "pendiente",
        requested_date: new Date().toLocaleDateString("en-CA", {
          timeZone: "America/Mexico_City",
        }),
        requested_slot: "Por acordar",
        created_at: new Date().toISOString(),
      }),
    );
    await failure.page.locator("#refresh").click();
    await failure.page.locator(".order-card button").first().waitFor();
    assert(await failure.page.locator("#opsEmptyOrders").isHidden());
    await failure.page.locator(".order-card button").first().click();
    await failure.page.locator("#orderDialog").waitFor({ state: "visible" });
    await failure.page.keyboard.press("Escape");
    pass(
      "La recuperación y la llegada de órdenes retiran el vacío y mantienen Abrir",
    );
    const desktop = await create("orders-empty", 1440);
    const arriving = await failure.page.evaluate(
      () => window.__tfTest.tf_requests[0],
    );
    await desktop.page.evaluate(
      (row) => window.__tfTest.tf_requests.push(row),
      arriving,
    );
    await desktop.page.locator("#refresh").click();
    await desktop.page
      .locator(".tabulator-row button")
      .first()
      .waitFor({ state: "visible" });
    await desktop.page.locator(".tabulator-row button").first().click();
    await desktop.page.locator("#orderDialog").waitFor({ state: "visible" });
    await desktop.page.keyboard.press("Escape");
    await desktop.context.close();
    pass(
      "La tabla de escritorio recupera sus columnas y Abrir al pasar de cero a una orden",
    );
    const agenda = await create("agenda-empty");
    await art(agenda.page, ".ops-mini-empty img", "rulo-sin-solicitudes");
    await agenda.page.locator("#calendarTab").click();
    assert.equal(
      await agenda.page.locator(".ops-mini-empty img").isVisible(),
      false,
    );
    await agenda.page.locator("#ordersTab").click();
    assert(await agenda.page.locator(".ops-mini-empty img").isVisible());
    pass(
      "Sin solicitudes corresponde a la agenda de hoy; no invade el calendario",
    );
    await normal.page
      .locator(".ops-connection-art img")
      .evaluate((el) => el.decode());
    await normal.context.setOffline(true);
    await normal.page
      .locator("#connectionMessage")
      .waitFor({ state: "visible" });
    await art(normal.page, ".ops-connection-art img", "rulo-sin-conexion");
    assert.match(
      await normal.page.locator("#connectionMessage").textContent(),
      /Sin conexión.*necesitan internet/,
    );
    await normal.context.setOffline(false);
    await normal.page
      .locator("#connectionMessage")
      .waitFor({ state: "hidden" });
    pass(
      "La imagen offline ya está cargada cuando se corta la red; se mantiene el aviso y desaparece al reconectar",
    );
    await normal.page.locator(".order-card button").first().click();
    await normal.page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    await normal.page.evaluate(() => {
      window.__tfTest.fail = "tf_requests:update";
    });
    await normal.page.locator("#orderStatus").selectOption("lista");
    await normal.page.locator("#saveOrder").click();
    await normal.page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    assert(await normal.page.locator("#orderCompletion").isHidden());
    await normal.page.evaluate(() => {
      window.__tfTest.fail = null;
      window.__tfTest.delay = 300;
    });
    await normal.page.locator("#saveOrder").click();
    assert(await normal.page.locator("#orderCompletion").isHidden());
    await normal.page.locator("#orderCompletion").waitFor({ state: "visible" });
    await art(normal.page, ".ops-complete-art img", "rulo-servicio-finalizado");
    await normal.page.locator("#internalNotes").fill("Nota ficticia");
    assert(await normal.page.locator("#orderCompletion").isHidden());
    await normal.page.locator("#saveOrder").click();
    await normal.page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    assert(await normal.page.locator("#orderCompletion").isHidden());
    await normal.page.locator("#orderStatus").selectOption("entregada");
    await normal.page.locator("#saveOrder").click();
    await normal.page.locator("#orderCompletion").waitFor({ state: "visible" });
    pass(
      "Servicio finalizado solo tras persistir lista/entregada, nunca por clic, fallo o guardado de notas",
    );
    await audit(normal.page, "Confirmación con Rulo");
    await normal.page.keyboard.press("Escape");
    const selectors = {
      login: [".ops-login-art img", "rulo-login"],
      "orders-empty": ["#opsEmptyOrders img", "rulo-sin-ordenes"],
      "agenda-empty": [".ops-mini-empty img", "rulo-sin-solicitudes"],
      "search-empty": ["#opsEmptySearch img", "rulo-sin-historial"],
      complete: [".ops-complete-art img", "rulo-servicio-finalizado"],
      offline: [".ops-connection-art img", "rulo-sin-conexion"],
    };
    for (const name of Object.keys(selectors)) {
      const state = await create(name);
      const page = state.page;
      if (name === "search-empty")
        await page.locator("#search").fill("SIN-COINCIDENCIA-RULO");
      if (name === "offline") {
        await page
          .locator(".ops-connection-art img")
          .evaluate((el) => el.decode());
        await state.context.setOffline(true);
        await page.locator("#connectionMessage").waitFor({ state: "visible" });
      }
      if (name === "complete") {
        await page.locator(".order-card button").first().click();
        await page.waitForFunction(
          () => !document.querySelector("#addItem").disabled,
        );
        await page.locator("#orderStatus").selectOption("lista");
        await page.locator("#saveOrder").click();
        await page.locator("#orderCompletion").waitFor({ state: "visible" });
      }
      for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: 667 });
        const info = await art(page, ...selectors[name]);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          name + " overflow " + width,
        );
        if (name === "login") {
          await page.evaluate(() => scrollTo(0, 0));
          const button = await page.locator("#loginForm button").boundingBox();
          assert(button.y + button.height <= 667, "Entrar visible " + width);
        }
        if (name === "complete") {
          await page.locator("#orderCompletion").scrollIntoViewIfNeeded();
          const button = await page.locator("#completionNote").boundingBox();
          const header = await page
            .locator("#orderDialog .dialoghead")
            .boundingBox();
          assert(
            button.y >= header.y + header.height &&
              button.y + button.height <= 667,
            "Nota accesible " + width,
          );
        }
        geometry.push({ state: name, viewport: width, art: info });
      }
      await audit(page, "Rulo " + name + " escritorio");
      await page.setViewportSize({ width: 390, height: 844 });
      await audit(page, "Rulo " + name + " móvil");
      if (name === "offline") await state.context.setOffline(false);
      await state.context.close();
    }
    pass(
      "Las seis escenas usan WebP decorativo, proporción reservada y caben en siete anchos con acciones visibles",
    );
    assert(
      !requests.some((url) => url.endsWith(".png")),
      "No se descargan PNG en Chromium con WebP",
    );
    assert.deepEqual(errors, []);
    pass(
      "Sin solicitudes PNG ni errores JavaScript; axe sin infracciones en los estados ilustrados",
    );
    fs.writeFileSync(
      dir + "/results.json",
      JSON.stringify(
        {
          passed: checks.length,
          checks,
          geometry,
          audits,
          assetRequests: [...new Set(requests)],
          errors,
          conditions:
            "Chromium con backend ficticio; corte real de red en contexto de navegador, no Android físico ni Supabase real.",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${checks.length} comprobaciones Rulo aprobadas`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
