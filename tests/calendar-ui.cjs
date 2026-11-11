const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { setup, base, root } = require("./browser.cjs");
const { assertBusinessContracts } = require("./contracts.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const results = [],
    errors = [],
    audits = [],
    geometry = [];
  const pass = (name) => {
    results.push(name);
    console.log("PASS " + name);
  };
  const dir = root + "/docs/qa/calendar";
  fs.mkdirSync(dir, { recursive: true });
  try {
    assertBusinessContracts();
    for (const file of [
      "index.html",
      "assets/ui-interactions.css",
      "operacion/atmosphere.js",
      "operacion/service-lines.mjs",
      "tf-config.js",
    ])
      assert.equal(
        fs.readFileSync(root + "/" + file, "utf8"),
        execFileSync("git", ["show", "6b41f40:" + file], {
          cwd: root,
          encoding: "utf8",
        }),
      );
    pass(
      "Solo cambia la presentación del calendario; contratos, landing, shader y documentos preservados",
    );
    const context = await setup(browser);
    await context.addInitScript(() =>
      window.__tfTest.tf_requests.forEach(
        (r) => (r.internal_notes = "RESERVADO DE PRUEBA"),
      ),
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/operacion/");
    assert.equal(await page.evaluate(() => !!window.FullCalendar), false);
    await page.locator("#calendarTab").click();
    await page.locator(".fc-dayGridMonth-view").waitFor();
    assert.equal(await page.locator(".fc-toolbar").count(), 0);
    assert.equal(
      await page.locator("#calendarMonth").getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(await page.locator("#calendarNext").isDisabled(), false);
    pass("Carga diferida y controles propios Mes/Agenda con selección real");
    const initial = await page
      .locator('.calendar-day-number[aria-pressed="true"]')
      .getAttribute("data-date");
    assert.equal(await page.locator("#calendarDayOrders button").count(), 4);
    assert.match(
      await page.locator("#calendarDayCount").textContent(),
      /4 órdenes/,
    );
    assert(
      !(await page.locator("#calendarSection").textContent()).includes(
        "RESERVADO",
      ),
    );
    assert.equal(await page.locator(".day-agenda").isVisible(), false);
    pass(
      "Día seleccionado muestra las cuatro órdenes reales del fixture, sin notas internas ni agenda duplicada",
    );
    await page
      .locator('.calendar-day-number[aria-pressed="true"]')
      .press("ArrowRight");
    const selected = await page
      .locator('.calendar-day-number[aria-pressed="true"]')
      .getAttribute("data-date");
    assert.notEqual(selected, initial);
    assert.match(
      await page.locator(".calendar-day-empty").textContent(),
      /No hay órdenes/,
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.date),
      selected,
    );
    await page.keyboard.press("Home");
    assert.equal(
      await page.locator('.calendar-day-number[tabindex="0"]').count(),
      1,
    );
    pass("Fechas con flechas y Home, foco único y vacío específico del día");
    const title = await page.locator("#calendarPeriod").textContent();
    await page.locator("#calendarNext").click();
    assert.notEqual(await page.locator("#calendarPeriod").textContent(), title);
    await page.locator("#calendarToday").click();
    assert.equal(
      await page
        .locator('.calendar-day-number[aria-pressed="true"]')
        .getAttribute("data-date"),
      initial,
    );
    pass(
      "Periodo anterior/siguiente y Hoy actualizan fecha, resumen y selección",
    );
    const more = page.locator(".fc-daygrid-more-link").first();
    await more.focus();
    await more.press("Enter");
    await page.locator(".fc-popover").waitFor({ state: "visible" });
    assert((await page.locator(".fc-popover .fc-event").count()) >= 4);
    await page.waitForFunction(
      () =>
        document.querySelector(".fc-popover-close")?.getAttribute("role") ===
        "button",
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".fc-popover").count(), 0);
    pass(
      "Más órdenes se abre también por teclado y conserva acceso a los registros",
    );
    const monthEvent = page.locator(".fc-daygrid-event").first();
    const moto = await monthEvent.locator("strong").textContent();
    await monthEvent.focus();
    await monthEvent.press("Enter");
    await page.locator("#orderDialog").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#orderInfo .order-motorcycle").textContent(),
      new RegExp(moto),
    );
    await page.keyboard.press("Escape");
    await page.locator("#calendarDayOrders button").first().click();
    await page.locator("#orderDialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    pass(
      "Eventos del mes y panel del día abren la orden existente, con teclado y clic",
    );
    await page.locator("#calendarAgenda").click();
    await page.locator(".fc-listWeek-view").waitFor();
    assert.equal(await page.locator(".calendar-detail").isVisible(), false);
    const event = page.locator(".calendar-event-button").first();
    assert.match(await event.textContent(), /Por acordar/);
    assert.match(await event.textContent(), /Revisión de prueba/);
    const reads = await page.evaluate(
      () =>
        window.__tfTest.calls.filter(
          (c) => c.table === "tf_service_lines" && c.op === "select",
        ).length,
    );
    await event.click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    assert.equal(
      await page.evaluate(
        () =>
          window.__tfTest.calls.filter(
            (c) => c.table === "tf_service_lines" && c.op === "select",
          ).length,
      ),
      reads + 1,
    );
    await page.keyboard.press("Escape");
    pass(
      "Agenda presenta moto, cliente, estado, servicio y franja; abre una sola vez",
    );
    const audit = async (label) => {
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
    };
    await audit("Agenda escritorio");
    await page.locator("#calendarMonth").click();
    await audit("Mes escritorio");
    for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const mode of ["Agenda", "Month"]) {
        await page.locator("#calendar" + mode).click();
        const metrics = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          controls: [
            ...document.querySelectorAll(".calendar-controls button"),
          ].map((e) => ({
            id: e.id,
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
          })),
          dateButtons: [
            ...document.querySelectorAll(".calendar-day-number"),
          ].map((e) => ({
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
          })),
        }));
        assert(metrics.scroll <= width, JSON.stringify(metrics));
        assert(
          metrics.controls.every((e) => e.width >= 44 && e.height >= 44),
          JSON.stringify(metrics.controls),
        );
        assert(
          metrics.dateButtons.every((e) => e.width >= 44 && e.height >= 44),
          "Fechas táctiles " + width,
        );
        geometry.push({ mode, ...metrics });
      }
    }
    pass(
      "Mes y Agenda caben en siete anchos; controles y fechas conservan 44 px",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#calendarAgenda").click();
    await audit("Agenda móvil");
    await page.locator("#calendarMonth").click();
    await audit("Mes móvil");
    pass("Axe sin infracciones detectadas en las cuatro superficies nuevas");
    const touch = await setup(browser, true, {
      contextOptions: {
        hasTouch: true,
        isMobile: true,
        viewport: { width: 320, height: 844 },
      },
    });
    const tp = await touch.newPage();
    tp.on("pageerror", (e) => errors.push(e.message));
    await tp.goto(base + "/operacion/");
    await tp.locator("#calendarTab").tap();
    await tp.locator(".calendar-event-button").first().tap();
    await tp.locator("#orderDialog").waitFor({ state: "visible" });
    await tp.locator('[data-close="orderDialog"]').tap();
    await tp.locator("#calendarMonth").tap();
    await tp.locator('.calendar-day-number[aria-pressed="true"]').tap();
    assert.match(
      await tp.locator("#calendarDayCount").textContent(),
      /4 órdenes/,
    );
    pass("Taps sintetizados a 320 px abren Agenda, orden y selección mensual");
    const fault = await setup(browser);
    const fp = await fault.newPage();
    fp.on("pageerror", (e) => errors.push(e.message));
    await fault.route("**/fullcalendar@*/index.global.min.js", (r) =>
      r.abort(),
    );
    await fp.goto(base + "/operacion/");
    await fp.locator("#calendarTab").click();
    await fp.waitForFunction(() =>
      document
        .querySelector("#calendarState")
        .textContent.includes("No pudimos"),
    );
    assert(await fp.locator("#calendarWorkspace").isHidden());
    assert(await fp.locator("#calendarNext").isDisabled());
    await fault.unroute("**/fullcalendar@*/index.global.min.js");
    await fp.locator("#refresh").click();
    await fp.locator(".fc-dayGridMonth-view").waitFor();
    assert(await fp.locator("#calendarNext").isEnabled());
    pass(
      "Fallo de carga retira controles no disponibles; Actualizar recupera el calendario",
    );
    const noData = await setup(browser);
    await noData.addInitScript(
      () => (window.__tfTest.fail = "tf_requests:select"),
    );
    const nd = await noData.newPage();
    nd.on("pageerror", (e) => errors.push(e.message));
    await nd.goto(base + "/operacion/");
    await nd.locator("#calendarTab").click();
    await nd.waitForFunction(() =>
      document
        .querySelector("#calendarState")
        .textContent.includes("No pudimos consultar"),
    );
    assert(await nd.locator("#calendarWorkspace").isHidden());
    assert.equal(await nd.evaluate(() => !!window.FullCalendar), false);
    await nd.evaluate(() => (window.__tfTest.fail = null));
    await nd.locator("#refresh").click();
    await nd.locator(".fc-dayGridMonth-view").waitFor();
    pass(
      "Error inicial de datos no se presenta como calendario vacío y permite recuperar",
    );
    const hostile = await setup(browser);
    await hostile.addInitScript(
      () =>
        (window.__tfTest.tf_requests[0].motorcycle =
          '<img src=x onerror="window.__calendarXss=1">'),
    );
    const hp = await hostile.newPage();
    hp.on("pageerror", (e) => errors.push(e.message));
    await hp.goto(base + "/operacion/");
    await hp.locator("#calendarTab").click();
    await hp.locator(".fc-dayGridMonth-view").waitFor();
    assert(
      (await hp.locator("#calendarDayOrders").textContent()).includes("<img"),
    );
    assert.equal(await hp.evaluate(() => window.__calendarXss), undefined);
    pass("Datos del cliente se presentan como texto y no ejecutan HTML");
    assert.equal(
      await page.evaluate(
        () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
      ),
      0,
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      dir + "/results.json",
      JSON.stringify(
        {
          passed: results.length,
          checks: results,
          audits,
          geometry,
          errors,
          conditions:
            "Chromium, fixtures aislados y taps sintetizados; no Android físico, impresora o Supabase real.",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${results.length} comprobaciones de calendario aprobadas`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
