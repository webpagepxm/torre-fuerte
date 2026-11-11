// Auditoría de tareas reales con backend aislado. Nunca escribe en Supabase.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { setup, base, root, output } = require("./browser.cjs");
const checkpoint = "a9e326fdf590e6bd5059d9bc6fb7254231e4209f";

(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let passed = 0;
  const errors = [];
  const pass = (name) => {
    passed++;
    console.log("PASS " + name);
  };
  const open = async (page) => {
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.getElementById("addItem").disabled,
    );
  };
  const fillOrder = async (page) => {
    for (const [name, text] of Object.entries({
      client_name: " Persona de prueba ",
      client_phone: "0000000000",
      motorcycle: " Honda de prueba ",
      service: " Revisión de prueba ",
    }))
      await page.locator(`#newForm [name="${name}"]`).fill(text);
  };
  async function portal(init, width = 390, height = 844) {
    const context = await setup(browser);
    if (init) await context.addInitScript(init);
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height });
    await page.goto(base + "/operacion/");
    await page.waitForSelector("#workspace:not([hidden])");
    await page.waitForFunction(
      () =>
        document.getElementById("ordersSection").getAttribute("aria-busy") ===
        "false",
    );
    return { context, page };
  }
  try {
    const baseline = await setup(browser);
    for (const [pattern, file, type] of [
      ["**/operacion/", "index.html", "text/html"],
      ["**/operacion/style.css*", "style.css", "text/css"],
      ["**/operacion/app.js*", "app.js", "text/javascript"],
    ])
      await baseline.route(pattern, (route) =>
        route.fulfill({
          contentType: type,
          body: execFileSync(
            "git",
            ["show", `${checkpoint}:operacion/${file}`],
            { cwd: root },
          ),
        }),
      );
    const before = await baseline.newPage();
    const { context, page } = await portal();
    const geometry = [];
    for (const width of [320, 375, 390, 430]) {
      await before.setViewportSize({ width, height: 844 });
      await before.goto(base + "/operacion/");
      await before.waitForSelector(".order-card");
      const firstBefore = await before
        .locator(".order-card")
        .first()
        .boundingBox();
      await before.locator(".order-card button").first().click();
      const printBefore = await before.locator("#printOrder").boundingBox();
      await page.setViewportSize({ width, height: 844 });
      const firstAfter = await page
        .locator(".order-card")
        .first()
        .boundingBox();
      assert(
        firstAfter.y < firstBefore.y - 64,
        "Primera moto más cerca a " + width,
      );
      const action = await page
        .locator(".order-card button")
        .first()
        .boundingBox();
      assert(
        action.y + action.height < 844,
        "Abrir en primera pantalla a " + width,
      );
      await open(page);
      const printAfter = await page.locator("#printOrder").boundingBox();
      assert(
        printAfter.y + printAfter.height < 844,
        "Comanda visible al abrir a " + width,
      );
      await page.locator("#jumpToNote").click();
      const heading = await page.locator("#docClientHeading").boundingBox();
      const bar = await page.locator("#orderDialog .dialoghead").boundingBox();
      assert(heading.y >= bar.y + bar.height, "Nota no oculta tras cabecera");
      assert(
        await page
          .locator("#docClientHeading")
          .evaluate((el) => el === document.activeElement),
      );
      await page.locator('[data-close="orderDialog"]').click();
      geometry.push({
        width,
        firstOrderBefore: Math.round(firstBefore.y),
        firstOrderAfter: Math.round(firstAfter.y),
        printBefore: Math.round(printBefore.y),
        printAfter: Math.round(printAfter.y),
      });
    }
    fs.writeFileSync(
      output + "/ops-geometry.json",
      JSON.stringify(
        {
          checkpoint,
          viewportHeight: 844,
          data: "Fixtures; misma fecha y cuatro órdenes",
          geometry,
        },
        null,
        2,
      ),
    );
    await baseline.close();
    pass(
      "Primera moto y comanda accesibles en móvil; salto a nota conserva foco visible",
    );

    assert.equal(await page.evaluate(() => !!window.FullCalendar), false);
    await page.locator("#calendarTab").click();
    await page.waitForSelector(".fc-listWeek-view");
    assert.match(
      await page.locator(".fc-list-event").first().textContent(),
      /Revisión de prueba/,
    );
    assert.match(
      await page.locator(".fc-list-event").first().textContent(),
      /Bajaj|Honda|Italika|Yamaha/,
    );
    assert.match(
      await page.locator(".fc-list-event").first().textContent(),
      /Pendiente|Confirmada|reparación|Lista/,
    );
    await page.locator(".fc-list-event").first().click();
    assert(await page.locator("#orderDialog").isVisible());
    await page.locator('[data-close="orderDialog"]').click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForSelector(".fc-dayGridMonth-view");
    pass(
      "Calendario diferido: semana legible con moto y estado en móvil, mes en escritorio",
    );
    await page.locator("#ordersTab").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.locator("#internalNotes").fill("Diagnóstico ficticio");
    assert.match(
      await page.locator("#orderSaveState").textContent(),
      /sin guardar/,
    );
    await page.locator("#saveOrder").click();
    await page.waitForFunction(() =>
      document.getElementById("orderMessage").textContent.includes("guardados"),
    );
    await page.locator("#internalNotes").fill("Otro diagnóstico ficticio");
    assert(
      await page.locator("#orderMessage").isHidden(),
      "No conservar éxito de versión anterior",
    );
    assert.match(
      await page.locator("#orderSaveState").textContent(),
      /sin guardar/,
    );
    page.once("dialog", (d) => d.accept());
    await page.locator('[data-close="orderDialog"]').click();
    pass(
      "Estado de guardado distingue borrador, respuesta confirmada y nueva edición",
    );

    await page.locator("#newOrder").click();
    await fillOrder(page);
    await page.locator('#newForm [name="client_name"]').fill("  ");
    await page.locator("#saveNew").click();
    assert(
      await page
        .locator('#newForm [name="client_name"]')
        .evaluate((el) => el === document.activeElement),
    );
    assert.equal(
      await page.evaluate(
        () => window.__tfTest.calls.filter((c) => c.op === "insert").length,
      ),
      0,
    );
    await fillOrder(page);
    await page.locator('#newForm [name="client_phone"]').fill("abcdefghij");
    await page.locator("#saveNew").click();
    assert(
      await page
        .locator('#newForm [name="client_phone"]')
        .evaluate((el) => el === document.activeElement),
    );
    await fillOrder(page);
    await page.evaluate(() => {
      window.__tfTest.delay = 100;
      const form = document.getElementById("newForm");
      form.requestSubmit();
      form.requestSubmit();
    });
    await page.waitForSelector("#orderDialog[open]");
    assert.equal(
      await page.evaluate(
        () =>
          window.__tfTest.calls.filter(
            (c) => c.table === "tf_requests" && c.op === "insert",
          ).length,
      ),
      1,
    );
    assert.equal(
      await page.evaluate(() => window.__tfTest.tf_requests.at(-1).client_name),
      "Persona de prueba",
    );
    await page.locator('[data-close="orderDialog"]').click();
    pass(
      "Alta rechaza espacios/teléfono inválido, enfoca error y bloquea envíos simultáneos",
    );

    await page.setViewportSize({ width: 390, height: 500 });
    await page.locator("#newOrder").click();
    for (const field of await page
      .locator("#newForm input,#newForm select,#newForm textarea")
      .all()) {
      await field.focus();
      const box = await field.boundingBox();
      const head = await page.locator("#newDialog .dialoghead").boundingBox();
      const footer = await page
        .locator("#newDialog .dialogactions")
        .boundingBox();
      assert(box.y >= head.y + head.height - 1, "Campo bajo cabecera");
      assert(box.y + box.height <= footer.y + 1, "Campo sobre acciones fijas");
      assert(box.height >= 48);
    }
    await page.locator('[data-close="newDialog"]').first().click();
    pass(
      "Formulario usable con viewport reducido a 500 px; campos enfocados fuera de cabecera y acciones",
    );
    await context.close();

    const failed = await portal(
      () => (window.__tfTest.fail = "tf_requests:select"),
    );
    assert.match(
      await failed.page.locator("#listCount").textContent(),
      /no disponibles/,
    );
    assert(await failed.page.locator("#ordersLoadError").isVisible());
    assert.equal(await failed.page.locator(".order-card").count(), 0);
    assert(
      !/Aún no hay/.test(await failed.page.locator("#listCount").textContent()),
    );
    await failed.context.close();
    pass(
      "Error inicial de consulta no se presenta como lista vacía ni carga perpetua",
    );

    const stale = await portal();
    await stale.page.evaluate(
      () => (window.__tfTest.fail = "tf_requests:select"),
    );
    await stale.page.locator("#refresh").click();
    await stale.page.waitForFunction(
      () => !document.getElementById("refresh").disabled,
    );
    assert.equal(await stale.page.locator(".order-card").count(), 4);
    assert.match(
      await stale.page.locator("#listCount").textContent(),
      /sin actualizar/,
    );
    await stale.page.locator("#search").fill("Italika");
    assert.match(
      await stale.page.locator("#listCount").textContent(),
      /sin actualizar/,
    );
    await stale.page.evaluate(() => (window.__tfTest.fail = null));
    await stale.page.locator("#refresh").click();
    await stale.page.waitForFunction(
      () => !document.getElementById("refresh").disabled,
    );
    assert(
      !/sin actualizar/.test(
        await stale.page.locator("#listCount").textContent(),
      ),
    );
    await stale.context.setOffline(true);
    await stale.page.locator("#connectionMessage").waitFor();
    assert.match(
      await stale.page.locator("#connectionMessage").textContent(),
      /Sin conexión/,
    );
    await stale.context.setOffline(false);
    await stale.page.waitForFunction(
      () => document.getElementById("connectionMessage").hidden,
    );
    assert.match(
      await stale.page.locator("#statusMessage").textContent(),
      /conexión volvió/,
    );
    await stale.context.close();
    pass(
      "Lista anterior se identifica al fallar; recuperación y desconexión tienen mensajes reales",
    );

    const empty = await portal(() => (window.__tfTest.tf_requests = []));
    assert.match(
      await empty.page.locator(".mobile-orders .empty-state").textContent(),
      /Recibir moto/,
    );
    assert.equal(await empty.page.locator("#kpiAll").textContent(), "0");
    await empty.context.close();
    pass(
      "Taller vacío explica cómo recibir la primera moto sin métricas ficticias",
    );

    const calendarFailure = await portal();
    await calendarFailure.context.route(
      "**/fullcalendar@*/index.global.min.js",
      (route) => route.abort(),
    );
    await calendarFailure.page.locator("#calendarTab").click();
    await calendarFailure.page.waitForFunction(() =>
      document
        .getElementById("calendarState")
        .textContent.includes("No pudimos"),
    );
    assert.equal(
      await calendarFailure.page
        .locator("#calendarSection")
        .getAttribute("aria-busy"),
      "false",
    );
    await calendarFailure.context.unroute(
      "**/fullcalendar@*/index.global.min.js",
    );
    await calendarFailure.page.locator("#refresh").click();
    await calendarFailure.page.waitForSelector(".fc-listWeek-view");
    await calendarFailure.context.close();
    pass(
      "Fallo de descarga del calendario permite reintentar sin perder órdenes",
    );

    const malicious = await portal(() => {
      window.__tfTest.tf_requests[0].client_name = "=1+1";
      window.__tfTest.tf_requests[0].details =
        '<img src=x onerror="window.__unsafe=true">';
    });
    await open(malicious.page);
    assert.equal(await malicious.page.locator("#orderInfo img").count(), 0);
    assert.match(
      await malicious.page.locator("#orderInfo").textContent(),
      /<img/,
    );
    assert.equal(await malicious.page.evaluate(() => !!window.__unsafe), false);
    await malicious.page.locator('[data-close="orderDialog"]').click();
    const download = malicious.page.waitForEvent("download");
    await malicious.page.locator("#exportCsv").click();
    const csv = await fs.promises.readFile(
      await (await download).path(),
      "utf8",
    );
    assert(csv.includes('"\'=1+1"'), "Fórmula CSV neutralizada");
    await malicious.context.close();
    pass(
      "Datos de cliente se muestran como texto; exportación neutraliza fórmulas CSV",
    );

    assert.deepEqual(errors, []);
    pass("Sin errores JavaScript en los escenarios adicionales");
    console.log(JSON.stringify({ passed, geometry }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
