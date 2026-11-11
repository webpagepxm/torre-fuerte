const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { setup, base } = require("./browser.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  let passed = 0;
  const pass = (name) => {
    passed++;
    console.log("PASS " + name);
  };
  try {
    const loginContext = await setup(browser, false),
      loginPage = await loginContext.newPage();
    for (const width of [320, 390]) {
      await loginPage.setViewportSize({ width, height: 667 });
      await loginPage.goto(base + "/operacion/");
      const box = await loginPage.locator("#loginForm button").boundingBox();
      assert(
        box && box.y + box.height <= 667,
        "Entrar accesible sin scroll a " + width,
      );
    }
    await loginContext.close();
    pass(
      "Formulario de acceso completo en la primera pantalla de un móvil pequeño",
    );
    const context = await setup(browser),
      page = await context.newPage();
    await page.goto(base + "/operacion/");
    for (const width of [768, 900, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      await page.waitForTimeout(180);
      const open = page.locator("#ordersTable .tabulator-row button").first();
      assert(await open.isVisible(), "Abrir visible en " + width);
      await open.click();
      await page.waitForFunction(
        () => !document.querySelector("#addItem").disabled,
      );
      assert(await page.locator("#orderDialog").isVisible());
      await page.locator('[data-close="orderDialog"]').click();
    }
    pass("Abrir orden disponible y funcional en tablet y escritorio");
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.locator("#filterDate").isHidden());
    await page.locator(".metric--ready").click();
    assert.match(await page.locator("#toggleFilters").textContent(), /1/);
    assert(await page.locator("#resetFilters").isVisible());
    assert.equal(await page.locator(".order-card").count(), 1);
    await page.locator("#resetFilters").click();
    assert.equal(await page.locator(".order-card").count(), 4);
    await page.locator("#toggleFilters").click();
    await page.locator("#filterDate").fill("2027-01-01");
    await page.locator("#toggleFilters").click();
    assert.equal(await page.locator(".order-card").count(), 0);
    assert.match(await page.locator("#toggleFilters").textContent(), /1/);
    await page.locator("#resetFilters").click();
    assert.equal(await page.locator(".order-card").count(), 4);
    pass("Filtros activos visibles y recuperables aun con panel cerrado");
    await page.locator("#calendarTab").click();
    assert.match(
      await page.locator("#workspaceViewTitle").textContent(),
      /Calendario/,
    );
    assert(await page.locator(".activity-summary").isHidden());
    await page.locator("#ordersTab").click();
    assert(await page.locator(".activity-summary").isVisible());
    pass("Navegación actualiza título y muestra filtros del contexto correcto");
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    await page
      .locator("#internalNotes")
      .fill("Borrador de diagnóstico sin guardar");
    page.once("dialog", (d) => d.dismiss());
    await page.locator('[data-close="orderDialog"]').click();
    assert(await page.locator("#orderDialog").isVisible());
    assert.equal(
      await page.locator("#internalNotes").inputValue(),
      "Borrador de diagnóstico sin guardar",
    );
    page.once("dialog", (d) => d.accept());
    await page.locator('[data-close="orderDialog"]').click();
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    assert.notEqual(
      await page.locator("#internalNotes").inputValue(),
      "Borrador de diagnóstico sin guardar",
    );
    await page.locator("#orderStatus").selectOption("lista");
    page.once("dialog", (d) => d.dismiss());
    await page.keyboard.press("Escape");
    assert(await page.locator("#orderDialog").isVisible());
    await page.locator("#saveOrder").click();
    await page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    pass("Notas y estado sin guardar protegidos al cerrar o pulsar Escape");
    await page.locator("#addItem").click();
    await page.locator("#saveItems").click();
    let inputs = page.locator(".itemrow input");
    assert(await inputs.nth(0).evaluate((el) => el === document.activeElement));
    await inputs.nth(0).fill("Servicio ficticio");
    await inputs.nth(2).fill("");
    await page.locator("#saveItems").click();
    assert(await inputs.nth(2).evaluate((el) => el === document.activeElement));
    assert.match(await page.locator("#total").textContent(), /pendientes/);
    assert.equal(
      await page.evaluate(() => window.__tfTest.tf_service_lines.length),
      0,
    );
    await inputs.nth(2).fill("0");
    await page.locator("#saveItems").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#itemsMessage")
        .textContent.includes("verificado"),
    );
    assert.equal(
      await page.evaluate(() => window.__tfTest.tf_service_lines[0].unit_price),
      0,
    );
    pass(
      "Validación enfoca el campo incompleto y distingue precio vacío de cero explícito",
    );
    await page.locator('[data-close="orderDialog"]').click();
    await page.locator("#newOrder").click();
    await page
      .locator('#newForm [name="client_name"]')
      .fill("Borrador ficticio");
    page.once("dialog", (d) => d.dismiss());
    await page.locator('[data-close="newDialog"]').first().click();
    assert(await page.locator("#newDialog").isVisible());
    page.once("dialog", (d) => d.accept());
    await page.locator('[data-close="newDialog"]').first().click();
    pass("Orden nueva con datos no se descarta accidentalmente");
    await page.locator("#accountMenu summary").click();
    await page.keyboard.press("Escape");
    assert(!(await page.locator("#accountMenu").evaluate((el) => el.open)));
    pass("Cuenta se cierra por teclado sin perder foco");
    await page.setViewportSize({ width: 320, height: 960 });
    for (const selector of [
      "#newOrder",
      "#restartTour",
      "#accountMenu summary",
      ".state-filter",
      "#ordersTab",
      "#calendarTab",
      "#toggleFilters",
    ]) {
      for (const node of await page.locator(selector).all()) {
        const box = await node.boundingBox();
        assert(box && box.height >= 43.9, "Objetivo táctil: " + selector);
      }
    }
    pass(
      "Acciones principales y filtros conservan objetivos táctiles de al menos 44 px a 320 px",
    );
    const writes = await page.evaluate(
      () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
    );
    await page.locator("#restartTour").click();
    for (let step = 0; step < 9; step++) {
      await page.locator(".driver-popover").waitFor();
      await page.waitForTimeout(80);
      const box = await page.locator(".driver-popover").boundingBox();
      assert(
        box.x >= -1 && box.x + box.width <= 321,
        "Tour dentro del ancho móvil",
      );
      await page.locator(".driver-popover-next-btn").click();
    }
    assert(await page.locator(".driver-popover").isHidden());
    assert.equal(
      await page.evaluate(
        () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
      ),
      writes,
    );
    pass("Nueve pasos del tutorial caben a 320 px y no alteran datos");
    console.log(
      passed + " comprobaciones adicionales de auditoría UX aprobadas.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
