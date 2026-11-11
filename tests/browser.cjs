const { chromium } = require("playwright");
const {
  readFileSync,
  mkdirSync,
  existsSync,
  writeFileSync,
} = require("node:fs");
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, ".."),
  base = process.env.TF_BASE_URL || "http://127.0.0.1:8000";
const output = process.env.TF_QA_OUTPUT || "/tmp/torre-fuerte-qa";
mkdirSync(output, { recursive: true });
const cache = "/tmp/tf-verified-assets";
mkdirSync(cache, { recursive: true });
async function setup(browser, authorized = true, { mockDatabase = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ({ authorized }) => {
      localStorage.setItem("tf-portal-recorrido-v1", "1");
      localStorage.setItem("tf-orden-recorrido-v1", "1");
      window.__tfTest = {
        authorized,
        seq: 0,
        calls: [],
        tf_requests: ["pendiente", "confirmada", "en_reparacion", "lista"].map(
          (status, i) => ({
            id: "order-" + i,
            folio: "TF-TEST-00" + (i + 1),
            client_name: [
              "Cliente de prueba",
              "Ana Ejemplo",
              "Luis Prueba",
              "María Ejemplo",
            ][i],
            client_phone: "0000000000",
            motorcycle: [
              "Italika FT150",
              "Honda Cargo 150",
              "Yamaha FZ",
              "Bajaj Pulsar",
            ][i],
            service: "Revisión de prueba",
            status,
            requested_date: new Date().toLocaleDateString("en-CA", {
              timeZone: "America/Mexico_City",
            }),
            requested_slot: "Por acordar",
            source: "web",
            details: "Datos ficticios",
            internal_notes: "NOTA PRIVADA NO PUBLICAR",
            created_at: "2026-11-10T12:00:00Z",
          }),
        ),
        tf_service_lines: [],
      };
      window.open = (url) => {
        window.__openedUrl = url;
        return null;
      };
    },
    { authorized },
  );
  await context.route("**/*", async (route) => {
    const url = route.request().url();
    if (!url.startsWith("https://")) return route.continue();
    if (mockDatabase && url.includes("/@supabase/supabase-js@"))
      return route.fulfill({
        contentType: "text/javascript",
        body: readFileSync(
          path.join(__dirname, "fixtures/supabase.mjs"),
          "utf8",
        ),
      });
    if (url.includes(".supabase.co/"))
      return route.fulfill({
        contentType: "application/json",
        body: '{"access_token":"test","refresh_token":"test"}',
      });
    // Assets verificados por curl con el proxy y CA del entorno; no se desactiva TLS.
    let assetUrl = url.replace(
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.20/",
      "https://cdn.jsdelivr.net/npm/pdfmake@0.2.20/build/",
    );
    if (assetUrl.startsWith("https://fonts.")) return route.abort();
    const file = path.join(
      cache,
      createHash("sha256").update(assetUrl).digest("hex"),
    );
    try {
      if (!existsSync(file))
        writeFileSync(
          file,
          execFileSync("curl", ["-fsSL", "--max-time", "30", assetUrl], {
            maxBuffer: 12e6,
          }),
        );
      return route.fulfill({
        body: readFileSync(file),
        contentType: url.includes(".css") ? "text/css" : "text/javascript",
      });
    } catch {
      return route.abort();
    }
  });
  return context;
}
async function capture(page, name) {
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
module.exports = { setup, capture, root, base, output };
if (require.main === module)
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
    for (const [url, name] of [
      ["/", "public"],
      ["/operacion/", "portal"],
    ]) {
      await page.goto(base + url);
      await page.waitForTimeout(500);
      await page.evaluate(async () => {
        for (const image of document.querySelectorAll('img[loading="lazy"]')) {
          image.loading = "eager";
          await image.decode().catch(() => {});
        }
      });
      for (const width of [320, 375, 390, 430, 768, 1280, 1440]) {
        await page.setViewportSize({ width, height: 960 });
        await page.waitForTimeout(150);
        await capture(
          page,
          `${process.env.TF_QA_PHASE || "after"}-${name}-${width}`,
        );
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        console.log(name, width, overflow ? "OVERFLOW" : "OK");
        if (process.env.TF_QA_PHASE !== "before")
          assert(!overflow, `${name} overflow at ${width}`);
      }
    }
    console.log("JS errors", errors);
    assert.deepEqual(errors, []);
    await browser.close();
  })().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
