const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { setup, base, root, output } = require("./browser.cjs");
const { assertBusinessContracts } = require("./contracts.cjs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const dir = output + "/final-refinement";
  fs.mkdirSync(dir + "/after", { recursive: true });
  const results = [],
    errors = [];
  const pass = (label) => {
    results.push(label);
    console.log("PASS " + label);
  };
  try {
    const contracts = assertBusinessContracts();
    pass(
      "Consultas, validaciones, autenticación, WhatsApp y documentos preservados",
    );
    const context = await setup(browser);
    await context.addInitScript(() => {
      localStorage.removeItem("tf-portal-recorrido-v1");
      localStorage.removeItem("tf-orden-recorrido-v1");
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/operacion/");
    await page.locator(".order-card button").first().waitFor();
    await page.waitForTimeout(800);
    assert.equal(await page.locator(".driver-popover").count(), 0);
    await page.screenshot({ path: dir + "/after/first-run-390.png" });
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    await page.waitForTimeout(450);
    assert.equal(await page.locator("#orderTourPanel").isVisible(), false);
    await page.screenshot({ path: dir + "/after/order-first-run-390.png" });
    pass("Primera visita y primera orden funcionales, sin guías automáticas");
    await page.evaluate(() => (window.__tfTest.delay = 240));
    await page.locator("#orderStatus").selectOption("lista");
    await page.locator("#saveOrder").click();
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    assert(await page.locator("#saveOrder").isDisabled());
    await page.locator("#orderCompletion").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#completionTitle").textContent(),
      /Lista para entregar/,
    );
    assert.match(
      await page.locator("#completionSummary").textContent(),
      /TF-TEST-001.*Italika.*Revisión de prueba/,
    );
    assert.equal(
      await page.evaluate(() => window.__tfTest.tf_requests[0].status),
      "lista",
    );
    await page.screenshot({ path: dir + "/after/finish-390.png" });
    await page.addScriptTag({ path: "/tmp/tf-axe.min.js" });
    const completionAccessibility = await page.evaluate(async () => {
      const result = await axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      });
      return result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    assert.deepEqual(completionAccessibility, []);
    pass(
      "Finalización aparece solo después de respuesta persistida, con folio, moto y servicio",
    );
    const writes = await page.evaluate(
      () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
    );
    await page.locator("#completionNote").click();
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "docClientHeading",
    );
    assert.equal(
      await page.evaluate(
        () => window.__tfTest.calls.filter((c) => c.op !== "select").length,
      ),
      writes,
    );
    pass(
      "Acción de cierre lleva al documento existente y conserva foco, sin escribir datos",
    );
    await page.locator("#internalNotes").fill("Nota interna de prueba");
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    await page.locator("#saveOrder").click();
    await page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    pass(
      "Editar retira la confirmación anterior; notas sin cambio de estado no repiten el cierre especial",
    );
    await page.evaluate(() => {
      window.__tfTest.delay = 0;
      window.__tfTest.fail = "tf_requests:update";
    });
    await page.locator("#orderStatus").selectOption("entregada");
    await page.locator("#saveOrder").click();
    await page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    assert.match(
      await page.locator("#orderMessage").textContent(),
      /No se pudo/,
    );
    assert.equal(await page.locator("#orderStatus").inputValue(), "entregada");
    assert.equal(
      await page.locator("#internalNotes").inputValue(),
      "Nota interna de prueba",
    );
    pass(
      "Fallo al guardar conserva estado y notas sin mostrar cierre confirmado",
    );
    await page.evaluate(() => {
      window.__tfTest.fail = null;
      window.__tfTest.zeroRows = true;
    });
    await page.locator("#saveOrder").click();
    await page.waitForFunction(
      () => !document.querySelector("#saveOrder").disabled,
    );
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    await page.evaluate(() => (window.__tfTest.zeroRows = false));
    await page.locator("#saveOrder").click();
    await page.locator("#orderCompletion").waitFor({ state: "visible" });
    assert.match(
      await page.locator("#completionTitle").textContent(),
      /Entrega registrada/,
    );
    pass(
      "Respuesta sin registro no confirma; reintento válido confirma la entrega real",
    );
    await page.locator("#addItem").click();
    const row = page.locator(".itemrow");
    await row.locator("input").nth(0).fill("Servicio ficticio");
    await row.locator("input").nth(2).fill("100");
    await page.locator("#saveItems").click();
    await page.waitForFunction(() =>
      document
        .querySelector("#itemsMessage")
        .textContent.includes("verificado"),
    );
    await page.evaluate(() => {
      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          window.__shareCancelled = true;
          throw new DOMException("Cancelado", "AbortError");
        },
      });
    });
    await page.locator("#pdfShare").click();
    await page.waitForFunction(() => window.__shareCancelled === true);
    await page.waitForTimeout(30);
    assert.match(
      await page.locator("#pdfMessage").textContent(),
      /Se canceló compartir.*disponible/,
    );
    assert(
      !(await page.locator("#pdfMessage").textContent()).includes("Preparando"),
    );
    pass(
      "Cancelar el menú de compartir termina la preparación y ofrece descarga",
    );
    await page.evaluate(() =>
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          window.__shareAccepted = true;
        },
      }),
    );
    await page.locator("#pdfShare").click();
    await page.waitForFunction(() => window.__shareAccepted === true);
    assert.match(
      await page.locator("#pdfMessage").textContent(),
      /Confirma el envío en la app/,
    );
    pass("Web Share resuelto no se presenta como mensaje enviado al cliente");
    await page.evaluate(
      () => (window.print = () => (window.__printRequested = true)),
    );
    await page.locator("#printOrder").click();
    assert(await page.evaluate(() => window.__printRequested));
    assert.match(
      await page.locator("#printMessage").textContent(),
      /Comanda preparada/,
    );
    assert(
      !(await page.locator("#printMessage").textContent()).includes("impresa"),
    );
    pass(
      "Impresión distingue comanda preparada de impresión física confirmada",
    );
    await page.locator('[data-close="orderDialog"]').click();
    await page.locator(".order-card button").first().click();
    await page.waitForFunction(
      () => !document.querySelector("#addItem").disabled,
    );
    assert.equal(await page.locator("#orderCompletion").isVisible(), false);
    assert.equal(await page.locator("#printMessage").isVisible(), false);
    await page.keyboard.press("Escape");
    pass(
      "Reabrir una orden no conserva confirmaciones de la operación anterior",
    );
    const calendarContext = await setup(browser);
    const calendar = await calendarContext.newPage();
    calendar.on("pageerror", (e) => errors.push(e.message));
    await calendar.goto(base + "/operacion/");
    await calendar.locator("#calendarTab").click();
    await calendar.locator(".fc-daygrid-event").first().waitFor();
    const colors = await calendar
      .locator(".fc-daygrid-event")
      .evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).color));
    const expected = await calendar.evaluate(() => {
      const span = document.createElement("span");
      span.style.color = getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--pending");
      document.body.append(span);
      const color = getComputedStyle(span).color;
      span.remove();
      return color;
    });
    assert(colors.includes(expected), JSON.stringify(colors));
    await calendar.screenshot({ path: dir + "/after/calendar-1440.png" });
    pass("Calendario toma los mismos tokens de estado de la lista");
    await calendar.locator("#ordersTab").click();
    const agendaGeometry = [];
    for (const width of [1440, 390]) {
      await calendar.setViewportSize({ width, height: 900 });
      agendaGeometry.push(
        await calendar.evaluate(() => {
          const element = document.querySelector(".day-agenda"),
            style = getComputedStyle(element);
          return {
            width: innerWidth,
            borderLeft: style.borderLeftWidth,
            borderTop: style.borderTopWidth,
            paddingLeft: style.paddingLeft,
            paddingTop: style.paddingTop,
          };
        }),
      );
    }

    await page.goto(base + "/");
    await page.locator("#tab-alta").click();
    assert.match(
      await page.locator("#tab-alta").textContent(),
      /Solicitar registro/,
    );
    assert.match(
      await page.locator("#form-alta .form-note").textContent(),
      /revisa el mensaje y envíalo.*confirmará/,
    );
    await page.locator("#tab-mi-moto").click();
    assert.match(
      await page.locator("#form-mi-moto .form-note").textContent(),
      /verificará tu identidad/,
    );
    pass(
      "Salida pública explica envío manual en WhatsApp y verificación, sin prometer cuentas ni historial conectado",
    );
    const touch = await setup(browser, true, {
      contextOptions: {
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    });
    const mobile = await touch.newPage();
    mobile.on("pageerror", (e) => errors.push(e.message));
    await mobile.goto(base + "/operacion/");
    await mobile.locator(".order-card button").first().tap();
    await mobile.locator("#orderDialog").waitFor({ state: "visible" });
    await mobile.locator('[data-close="orderDialog"]').tap();
    await mobile.locator("#toggleFilters").tap();
    assert.equal(
      await mobile.locator("#toggleFilters").getAttribute("aria-expanded"),
      "true",
    );
    pass(
      "Taps sintetizados en Chromium abren/cierra orden y despliegan filtros",
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      dir + "/refinement-results.json",
      JSON.stringify(
        {
          passed: results.length,
          checks: results,
          contracts,
          completionAccessibility,
          agendaGeometry,
          calendarColors: colors,
          errors,
          conditions:
            "Fixtures aislados; emulación y taps sintetizados Chromium, no Android físico ni Supabase real.",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${results.length} comprobaciones finales aprobadas`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
