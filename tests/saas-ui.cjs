// Shader decorativo aislado: dibujo real, pausa, fallback y contratos existentes.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const { setup, base, root, output } = require("./browser.cjs");
const checkpoint = "e9578bc13ffcedd3e1670178d3d5f7a361583ef0";
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  let passed = 0;
  const pass = (label) => {
    passed++;
    console.log("PASS " + label);
  };
  const dir = output + "/saas";
  fs.mkdirSync(dir, { recursive: true });
  const errors = [];
  try {
    for (const file of [
      "assets/ui-interactions.css",
      "operacion/service-lines.mjs",
      "tf-config.js",
    ]) {
      assert.equal(
        fs.readFileSync(root + "/" + file, "utf8"),
        execFileSync("git", ["show", checkpoint + ":" + file], {
          cwd: root,
          encoding: "utf8",
        }),
      );
    }
    require("./contracts.cjs").assertBusinessContracts();
    pass("Contratos de datos, WhatsApp y documentos preservados");
    const context = await setup(browser);
    await context.addInitScript(() => {
      window.__shaderQA = { draws: 0, checksums: [] };
      window.__tfTest.tf_requests.forEach((r) => (r.internal_notes = ""));
      const draw = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (...args) {
        draw.apply(this, args);
        const qa = window.__shaderQA;
        qa.draws++;
        if (qa.checksums.length < 60) {
          const pixels = new Uint8Array(this.drawingBufferWidth * 4);
          this.readPixels(
            0,
            Math.min(7, this.drawingBufferHeight - 1),
            this.drawingBufferWidth,
            1,
            this.RGBA,
            this.UNSIGNED_BYTE,
            pixels,
          );
          qa.checksums.push(
            pixels.reduce((sum, n, i) => sum + n * ((i % 13) + 1), 0),
          );
        }
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(base + "/operacion/");
    await page.locator("#workspace").waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), 0);
    pass("Reposo inicial sin GPU ni animación decorativa automática");
    const trigger = async () => {
      await page.locator("#search").blur();
      await page.locator("#search").focus();
    };
    await trigger();
    await page.waitForFunction(() =>
      document.querySelector('.filters [data-renderer="webgl"]'),
    );
    await page.waitForFunction(() => window.__shaderQA.draws >= 4);
    const shader = await page.evaluate(() => ({
      ...window.__shaderQA,
      canvas: [...document.querySelectorAll(".filters canvas")].map((c) => [
        c.width,
        c.height,
        c.getContext("webgl").getError(),
      ]),
    }));
    assert(shader.draws >= 4 && shader.draws <= 32, JSON.stringify(shader));
    assert(
      new Set(shader.checksums).size > 2,
      "Los píxeles del shader deben cambiar",
    );
    assert(
      shader.canvas.every(
        ([w, h, error]) => w <= 640 && h <= 220 && error === 0,
      ),
    );
    pass(
      "WebGL compila, cambia píxeles, no reporta errores y mantiene raster acotado",
    );
    await page.screenshot({ path: dir + "/shader-1440.png" });
    const type = await page.evaluate(() =>
      Object.fromEntries(
        [
          ["title", ".workspacehead h1"],
          ["body", "body"],
          ["field", "#search"],
          ["brand", ".brand strong"],
        ].map(([key, selector]) => {
          const s = getComputedStyle(document.querySelector(selector));
          return [key, { family: s.fontFamily, size: s.fontSize }];
        }),
      ),
    );
    assert.equal(type.title.size, "32px");
    assert.equal(type.body.size, "15px");
    assert.equal(type.field.size, "14px");
    assert(type.brand.family.includes("Barlow Condensed"));
    pass("Familias y tamaños de letra aprobados conservados");
    await page.waitForTimeout(1800);
    const settled = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), settled);
    pass("El halo se detiene tras 1.6 s; no hay bucle en reposo");
    await trigger();
    await page.locator("#motionToggle").click();
    const paused = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), paused);
    assert.equal(
      await page.locator("#motionToggle").getAttribute("aria-pressed"),
      "true",
    );
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal(
      await page
        .locator(".filters canvas")
        .evaluate((el) => getComputedStyle(el).visibility),
      "hidden",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await page.locator("#workspace").waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), 0);
    await page.locator("#motionToggle").click();
    await page.waitForFunction(() => window.__shaderQA.draws > 1);
    pass("Pausa accesible, persistente y reactivación sin cambiar datos");
    await trigger();
    await page.evaluate(() => {
      const native = Object.getOwnPropertyDescriptor(
        Document.prototype,
        "hidden",
      ).get;
      window.__qaHidden = true;
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => window.__qaHidden || native.call(document),
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const hiddenDraws = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(350);
    assert.equal(
      await page.evaluate(() => window.__shaderQA.draws),
      hiddenDraws,
    );
    await page.evaluate(() => {
      window.__qaHidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction((n) => window.__shaderQA.draws > n, hiddenDraws);
    pass(
      "Política de documento oculto: evento de visibilidad simulado pausa y reanuda",
    );
    await trigger();
    await page.locator(".tabulator-row button").first().click();
    await page.locator("#orderDialog").waitFor({ state: "visible" });
    const held = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), held);
    await page.keyboard.press("Escape");
    await page.waitForFunction((n) => window.__shaderQA.draws > n, held);
    pass("El shader se detiene al trabajar en un diálogo y vuelve al cerrarlo");
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), reduced);
    assert(await page.locator("#motionToggle").isDisabled());
    pass(
      "Movimiento reducido pausa el dibujo y mantiene los controles del taller",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 390, height: 844 });
    await trigger();
    await page.waitForTimeout(100);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    const offscreen = await page.evaluate(() => window.__shaderQA.draws);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__shaderQA.draws), offscreen);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction((n) => window.__shaderQA.draws > n, offscreen);
    await page.screenshot({ path: dir + "/shader-390.png" });
    pass("Fuera de pantalla se detiene y vuelve a dibujar al regresar");
    await page.evaluate(() =>
      document
        .querySelector(".filters canvas")
        .getContext("webgl")
        .getExtension("WEBGL_lose_context")
        .loseContext(),
    );
    await page.waitForTimeout(200);
    assert.equal(
      await page.locator('.filters [data-renderer="webgl"]').count(),
      0,
    );
    assert(await page.locator("#search").isEnabled());
    pass("Pérdida de contexto gráfico conserva fallback y búsqueda utilizable");
    assert.equal(
      await page.evaluate(
        () =>
          window.__tfTest.calls.filter((c) =>
            ["insert", "update", "delete", "upsert"].includes(c.op),
          ).length,
      ),
      0,
    );
    const fallback = await setup(browser, false);
    await fallback.addInitScript(() => {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return type === "webgl" ? null : get.call(this, type, ...args);
      };
    });
    const login = await fallback.newPage();
    login.on("pageerror", (e) => errors.push(e.message));
    await login.emulateMedia({ reducedMotion: "no-preference" });
    await login.goto(base + "/operacion/");
    await login.setViewportSize({ width: 320, height: 667 });
    await login.locator("#loginForm").waitFor();
    assert.equal(await login.locator('[data-renderer="webgl"]').count(), 0);
    assert(await login.locator("#loginForm button").isVisible());
    await login.screenshot({ path: dir + "/login-fallback-320.png" });
    assert.equal(
      await login.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    pass(
      "Sin WebGL: acceso móvil completo, halo estático y sin desbordamiento",
    );
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      dir + "/shader-results.json",
      JSON.stringify(
        {
          passed,
          shader,
          type,
          errors,
          conditions:
            "Chromium con ANGLE/SwiftShader; backend ficticio aislado. No Android físico ni Supabase real.",
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`${passed} comprobaciones SaaS correctas`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
