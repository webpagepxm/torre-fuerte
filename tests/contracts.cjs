// Límites de una pasada UX: permite feedback, preserva consultas y documentos.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { root } = require("./browser.cjs");
const baseline = "93e992d9423e3204573ead457391fba78f418797";
const previous = (file) =>
  execFileSync("git", ["show", baseline + ":" + file], {
    cwd: root,
    encoding: "utf8",
  });
const current = (file) => fs.readFileSync(root + "/" + file, "utf8");
function assertBusinessContracts() {
  for (const file of [
    "operacion/service-lines.mjs",
    "tf-config.js",
    "assets/ui-interactions.css",
    "seguimiento/index.html",
    "aviso-privacidad.html",
    "sliderbros-studio/index.html",
    "torre-fuerte.vcf",
  ])
    assert.equal(current(file), previous(file), file);
  const old = previous("operacion/app.js"),
    now = current("operacion/app.js");
  for (const name of [
    "loginStaff",
    "hasAccess",
    "leave",
    "filterRow",
    "csvCell",
    "hasUnsavedOrderChanges",
    "hasNewOrderDraft",
    "lineElement",
    "renderLines",
    "updateTotal",
    "markLinesDirty",
    "setLineControls",
    "saveLines",
    "generateTicket",
    "ensurePdfLibrary",
    "buildPdfBlob",
  ]) {
    // Prettier conserva el cierre de cada función de nivel superior en columna cero.
    const pattern = new RegExp(
      "(?:async )?function " + name + "\\([^]*?\\n\\}",
    );
    const a = old.match(pattern),
      b = now.match(pattern);
    assert(a && b, name + " localizable");
    assert.equal(b[0], a[0], name + " conserva su contrato");
  }
  const queries = (source) =>
    [...source.matchAll(/\bdb\s*\.from\([^]*?;/g)].map((m) => m[0]);
  assert.equal(queries(old).length, 4, "Cuatro consultas directas protegidas");
  assert.deepEqual(
    queries(now),
    queries(old),
    "Mismas tablas, payloads y consultas",
  );
  const inline = (source) =>
    [...source.matchAll(/<script\b[^>]*>([^]*?)<\/script>/g)].map((m) => m[1]);
  const links = (source) =>
    [...source.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]).sort();
  const controls = (source) =>
    [...source.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)].map(
      (m) => m[0],
    );
  const publicBefore = previous("index.html"),
    publicNow = current("index.html");
  assert.deepEqual(
    inline(publicNow),
    inline(publicBefore),
    "Scripts públicos/WhatsApp idénticos",
  );
  assert.deepEqual(
    links(publicNow),
    links(publicBefore),
    "Enlaces públicos idénticos",
  );
  assert.deepEqual(
    controls(publicNow),
    controls(publicBefore),
    "Campos y validaciones públicas idénticos",
  );
  assert.deepEqual(
    controls(current("operacion/index.html")),
    controls(previous("operacion/index.html")),
    "Campos y validaciones OPS idénticos",
  );
  return { baseline, protectedFunctions: 16, queries: queries(now).length };
}
module.exports = { assertBusinessContracts, baseline };

if (require.main === module) console.log(assertBusinessContracts());
