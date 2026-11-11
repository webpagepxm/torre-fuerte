const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, capture, base, output } = require("./browser.cjs");
const { execFileSync } = require("node:child_process");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await setup(browser);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let passed = 0;
  const check = (name) => {
    passed++;
    console.log("PASS", name);
  };
  const visible = async (selector) =>
    assert(await page.locator(selector).isVisible(), selector);
  const open = async () => {
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
  };
  const close = async () => {
    await page.locator('[data-close="orderDialog"]').click();
  };
  const line = async (description, qty, price, index = 0) => {
    const row = page.locator(".itemrow").nth(index);
    await row.locator("input").nth(0).fill(description);
    await row.locator("input").nth(1).fill(String(qty));
    await row.locator("input").nth(2).fill(String(price));
  };
  const anonymous = await setup(browser, false),
    login = await anonymous.newPage();
  await login.goto(base + "/operacion/");
  assert(await login.locator("#gate").isVisible());
  await login.locator("#username").fill("usuario-incorrecto");
  await login.locator("#password").fill("solo-prueba");
  await login.locator('#loginForm [type="submit"]').click();
  assert.match(await login.locator("#loginMessage").textContent(), /no válido/);
  await login.locator("#username").fill("mecanicolider");
  await login.locator('#loginForm [type="submit"]').click();
  await login.waitForFunction(
    () => !document.querySelector("#workspace").hidden,
  );
  assert.equal(await login.locator("#password").inputValue(), "");
  await login.locator("#accountMenu summary").click();
  await login.locator("#signout").click();
  assert(await login.locator("#gate").isVisible());
  await anonymous.close();
  check(
    "Usuario sin correo, validación de acceso, limpieza de clave y cierre de sesión",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/operacion/");
  await visible("#workspace");
  await open();
  check("Acceso con rol y apertura de orden desde móvil");
  await page.locator("#addItem").click();
  await page.locator("#saveItems").click();
  assert.match(await page.locator("#itemsMessage").textContent(), /Completa/);
  check("Validación rechaza conceptos incompletos");
  await line("Servicio de prueba", 2, 125.5);
  await page.locator("#addItem").click();
  await line("Refacción de prueba", 1, 100, 1);
  await page
    .locator(".itemrow")
    .nth(1)
    .locator("select")
    .selectOption("refaccion");
  assert.match(await page.locator("#total").textContent(), /351.00/);
  await page.evaluate(() => (window.__tfTest.delay = 100));
  await page.locator("#saveItems").click();
  assert(await page.locator("#saveItems").isDisabled());
  await page.waitForFunction(() =>
    document.querySelector("#itemsMessage").textContent.includes("verificado"),
  );
  assert.equal(
    await page.evaluate(() => window.__tfTest.tf_service_lines.length),
    2,
  );
  await page.evaluate(() => (window.__tfTest.delay = 0));
  check(
    "Guardar, calcular y verificar lectura posterior; evita doble guardado",
  );
  await close();
  await open();
  assert.equal(await page.locator(".itemrow").count(), 2);
  assert.match(await page.locator("#total").textContent(), /351.00/);
  check("Desglose recuperado al reabrir");
  await page.locator("#orderStatus").selectOption("en_reparacion");
  await page.locator("#saveOrder").click();
  await page.waitForFunction(() =>
    document.querySelector("#orderMessage").textContent.includes("guardados"),
  );
  assert.equal(await page.locator("#kpiWorking").textContent(), "2");
  check("Cambio de estado persistido y contadores actualizados");
  await page.locator("#orderTutorialButton").click();
  await visible("#orderTourPanel");
  await page.locator("#orderTourNext").click();
  assert.match(await page.locator("#orderTourCounter").textContent(), /2 \/ 9/);
  await page.locator("#orderTourPrev").click();
  await page.locator("#orderTourClose").click();
  assert.equal(await page.locator(".itemrow").count(), 2);
  check("Tutorial de orden: avance, retroceso, salida y conservación de datos");
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/pdfmake.min.js",
  });
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/vfs_fonts.min.js",
  });
  let definition;
  await page.evaluate(() => {
    const create = window.pdfMake.createPdf.bind(window.pdfMake);
    window.pdfMake.createPdf = (doc) => {
      window.__pdfDefinition = doc;
      return create(doc);
    };
  });
  const beforeWrites = await page.evaluate(
    () =>
      window.__tfTest.calls.filter(
        (c) => c.table === "tf_service_lines" && c.op !== "select",
      ).length,
  );
  const download = page.waitForEvent("download");
  await page.locator("#pdfDownload").click();
  const pdf = await download;
  const pdfPath = output + "/nota-servicio.pdf";
  await pdf.saveAs(pdfPath);
  assert(fs.readFileSync(pdfPath).subarray(0, 5).toString() === "%PDF-");
  definition = await page.evaluate(() =>
    JSON.stringify(window.__pdfDefinition),
  );
  assert(!definition.includes("NOTA PRIVADA"));
  assert(definition.includes("$351.00"));
  assert.equal(
    await page.evaluate(
      () =>
        window.__tfTest.calls.filter(
          (c) => c.table === "tf_service_lines" && c.op !== "select",
        ).length,
    ),
    beforeWrites,
  );
  check(
    "PDF real con precios, total y sin notas internas; no reescribe datos sin cambios",
  );
  await page.locator("#pdfShare").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#pdfMessage")
      .textContent.includes("Se inició la descarga"),
  );
  check("Compartir: descarga alternativa en navegador sin Web Share");
  await page.evaluate(() => (window.print = () => (window.__printed = true)));
  await page.locator("#printOrder").click();
  assert(await page.evaluate(() => window.__printed));
  await page.emulateMedia({ media: "print" });
  assert(
    Math.abs(
      (await page
        .locator("#printReceipt")
        .evaluate((el) => el.getBoundingClientRect().width)) -
        (76 * 96) / 25.4,
    ) < 1,
  );
  assert(!(await page.locator("#printReceipt").textContent()).includes("$351"));
  await page.emulateMedia({ media: "screen" });
  check("Comanda de 76 mm sin precios y separada de la nota");
  for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await capture(page, "after-order-" + width);
    assert(
      !(await page
        .locator("#orderDialog")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1)),
      `dialog overflow ${width}`,
    );
  }
  check("Detalle de orden sin desbordamiento en siete anchos");
  await page.setViewportSize({ width: 390, height: 844 });
  await line("Servicio modificado", 2, 130);
  await page.evaluate(() => (window.__tfTest.fail = "tf_service_lines:update"));
  await page.locator("#saveItems").click();
  await page.waitForFunction(() =>
    document.querySelector("#itemsMessage").classList.contains("is-error"),
  );
  assert.match(await page.locator("#itemsMessage").textContent(), /permiso/);
  assert(await page.locator("#pdfDownload").isDisabled());
  assert.equal(
    await page.evaluate(() => window.__tfTest.tf_service_lines.length),
    2,
  );
  check("Error RLS visible; no falso éxito ni PDF tras fallo");
  page.once("dialog", (d) => d.accept());
  await close();
  await page.evaluate(() => (window.__tfTest.fail = "tf_service_lines:select"));
  await page.locator(".order-card button").nth(1).click();
  await page.waitForFunction(() =>
    document.querySelector("#itemsMessage").classList.contains("is-error"),
  );
  assert.equal(await page.locator(".itemrow").count(), 0);
  assert(await page.locator("#saveItems").isDisabled());
  check("Fallo de carga no reutiliza el desglose de otra moto");
  await close();
  await page.evaluate(() => (window.__tfTest.fail = null));
  await open();
  await line("Cambio local", 1, 10);
  await page.evaluate(
    () => (window.__tfTest.tf_service_lines[0].unit_price = 999),
  );
  await page.locator("#saveItems").click();
  await page.waitForFunction(() =>
    document.querySelector("#itemsMessage").textContent.includes("otra sesión"),
  );
  assert.equal(
    await page.evaluate(() => window.__tfTest.tf_service_lines[0].unit_price),
    999,
  );
  check("Conflicto con otra sesión detectado antes de escribir");
  page.once("dialog", (d) => d.accept());
  await close();
  await page.locator("#toggleFilters").click();
  await page.locator(".metric--ready").click();
  assert.equal(await page.locator(".order-card").count(), 1);
  await page.locator("#resetFilters").click();
  await page.locator("#search").fill("NO-EXISTE");
  assert.equal(await page.locator(".order-card").count(), 0);
  await page.locator("#resetFilters").click();
  check("Filtros por estado, búsqueda y estado vacío");
  const csvDownload = page.waitForEvent("download");
  await page.locator("#exportCsv").click();
  const csv = await csvDownload;
  await csv.saveAs(output + "/ordenes.csv");
  assert(
    fs.readFileSync(output + "/ordenes.csv", "utf8").includes("TF-TEST-001"),
  );
  check("Exportación CSV con datos de prueba");
  await page.locator("#ordersTab").focus();
  await page.keyboard.press("ArrowRight");
  await visible("#calendarSection");
  await page.locator("#calendarTab").focus();
  await page.keyboard.press("Home");
  await visible("#ordersSection");
  check("Calendario y pestañas con teclado");
  await page.locator("#restartTour").click();
  await visible(".driver-popover");
  await page.keyboard.press("Escape");
  check("Guía inicial reiniciable y salida con Escape");
  await page.locator("#newOrder").click();
  await page.locator('#newForm [name="client_name"]').fill("Persona de prueba");
  await page.locator('#newForm [name="client_phone"]').fill("0000000000");
  await page.locator('#newForm [name="motorcycle"]').fill("Moto de prueba");
  await page.locator('#newForm [name="service"]').fill("Revisión");
  await page.locator("#saveNew").click();
  await page.waitForFunction(() => document.querySelector("#orderDialog").open);
  await page.waitForFunction(
    () => !document.querySelector("#addItem").disabled,
  );
  assert.match(await page.locator("#orderTitle").textContent(), /TF-TEST-/);
  check("Orden manual con cliente, moto y folio devuelto por servidor");
  await close();
  // Página pública: endpoint interceptado; WhatsApp nunca se envía.
  const requests = [];
  let failBooking = false;
  await page.route("**/functions/v1/tf-create-request", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      status: failBooking ? 503 : 200,
      contentType: "application/json",
      body: '{"ok":true,"folio":"TF-000123"}',
    });
  });
  await page.goto(base + "/");
  await page.locator('#form-cita [name="nombre"]').fill("Persona Ficticia");
  await page.locator('#form-cita [name="telefono"]').fill("9541234567");
  await page.locator('#form-cita [name="moto"]').fill("Italika prueba");
  await page
    .locator('#form-cita [name="servicio"]')
    .selectOption("Diagnóstico");
  await page.locator("#fecha-cita").fill("2027-01-11");
  await page
    .locator('#form-cita [name="horario"]')
    .selectOption("Mañana (9:00 a 12:00)");
  await page.locator('#form-cita [name="confirmacion"]').check();
  await page.locator('#form-cita [name="telefono"]').fill("123");
  await page.locator('#form-cita [type="submit"]').click();
  assert.equal(requests.length, 0, "No crear órdenes con teléfonos inválidos");
  await page.locator('#form-cita [name="telefono"]').fill("9541234567");
  await page.locator('#form-cita [type="submit"]').click();
  await page.waitForFunction(() =>
    document
      .querySelector("#booking-feedback")
      .textContent.includes("recibida"),
  );
  assert.equal(requests.length, 1);
  assert.equal(requests[0].consent, true);
  assert.equal(requests[0].telefono, "9541234567");
  assert.match(await page.locator("#booking-feedback").textContent(), /TF-000123/);
  assert.match(
    await page.evaluate(() => new URL(window.__openedUrl).searchParams.get("text")),
    /Teléfono de contacto: 9541234567/,
  );
  assert.match(
    await page.evaluate(() => window.__openedUrl),
    /^https:\/\/wa.me\//,
  );
  assert(
    !(
      await page.evaluate(() => sessionStorage.getItem("tf-booking-attempt"))
    ).includes("Persona Ficticia"),
  );
  await page.locator('#form-cita [type="submit"]').click();
  await page.waitForFunction(
    () => !document.querySelector('#form-cita [type="submit"]').disabled,
  );
  assert.equal(requests[0].idempotency_key, requests[1].idempotency_key);
  check(
    "Solicitud pendiente + WhatsApp + clave idempotente; caché sin datos personales",
  );
  failBooking = true;
  await page.locator('#form-cita [type="submit"]').click();
  await page.waitForFunction(() =>
    document
      .querySelector("#booking-feedback")
      .textContent.includes("No pudimos confirmar"),
  );
  check(
    "Fallo de registro público conserva ruta WhatsApp y muestra resultado real",
  );
  await page.locator("#tab-cita").focus();
  await page.keyboard.press("ArrowRight");
  await visible("#panel-alta");
  await page.locator(".menu-toggle").click();
  await visible("#mobile-menu");
  await page.keyboard.press("Escape");
  assert(await page.locator("#mobile-menu").isHidden());
  check("Formularios públicos, menú móvil y navegación con teclado");
  assert.deepEqual(errors, []);
  check("Sin errores JavaScript en las interacciones probadas");
  // Axe se ejecuta sobre las superficies reales con el transporte de datos aislado.
  const axePath = "/tmp/tf-axe.min.js";
  if (!fs.existsSync(axePath))
    execFileSync("curl", [
      "-fsSL",
      "https://cdn.jsdelivr.net/npm/axe-core@4.10.3/axe.min.js",
      "-o",
      axePath,
    ]);
  const audits = [];
  const audit = async (target, label) => {
    await target.addScriptTag({ path: axePath });
    const result = await target.evaluate(() =>
      axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
    );
    audits.push({
      surface: label,
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    });
  };
  await page.goto(base + "/");
  await audit(page, "Página pública móvil");
  await page.goto(base + "/operacion/");
  await page.waitForTimeout(300);
  await audit(page, "Portal móvil");
  await open();
  await audit(page, "Detalle de orden");
  await close();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await audit(page, "Tabla escritorio");
  await page.locator("#calendarTab").click();
  await audit(page, "Calendario");
  const realContext = await setup(browser, false, { mockDatabase: false });
  const realPage = await realContext.newPage();
  const sdkErrors = [];
  realPage.on("pageerror", (e) => sdkErrors.push(e.message));
  await realPage.goto(base + "/operacion/");
  await realPage.waitForTimeout(500);
  assert(await realPage.locator("#gate").isVisible());
  assert(await realPage.locator("#setupNotice").isHidden());
  assert.deepEqual(sdkErrors, []);
  await audit(realPage, "Acceso sin sesión y SDK real");
  await realContext.close();
  check(
    "SDK Supabase real carga desde jsDelivr y acceso sin sesión disponible",
  );
  fs.writeFileSync(
    output + "/accessibility.json",
    JSON.stringify(audits, null, 2),
  );
  console.log("AXE", JSON.stringify(audits));
  assert(
    audits.every((a) => a.violations.length === 0),
    "Axe detectó violaciones WCAG",
  );
  console.log(
    `${passed} comprobaciones funcionales completadas; backend aislado mediante fixture.`,
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
