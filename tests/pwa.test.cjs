// Verificaciones sin navegador ni acceso a Supabase: la PWA no almacena datos privados.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(base, name));
const manifest = JSON.parse(read("operacion/manifest.webmanifest").toString("utf8"));
const html = read("operacion/index.html").toString("utf8");

test("PWA limitada al portal privado Ops, con inicio directo y presentación standalone", () => {
  assert.equal(manifest.id, "./");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "es-MX");
  assert.equal(manifest.prefer_related_applications, false);
  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(html, /<link rel="apple-touch-icon" href="\.\/icons\/torre-fuerte-192\.png"/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow"/);
});

test("Íconos PNG reales de 192 y 512 píxeles sin URLs externas", () => {
  const expected = new Map([["192x192", 192], ["512x512", 512]]);
  assert.equal(manifest.icons.length, expected.size);
  for (const icon of manifest.icons) {
    const size = expected.get(icon.sizes);
    assert(size, "Tamaño no esperado en manifiesto");
    assert.equal(icon.type, "image/png");
    assert(icon.src.startsWith("./icons/"));
    const data = read(path.join("operacion", icon.src));
    assert(data.length > 1024, "PNG incompleto");
    assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(data.readUInt32BE(16), size, "Ancho real");
    assert.equal(data.readUInt32BE(20), size, "Alto real");
  }
});

test("Sin caché de sesiones, datos de cliente ni llamadas a Supabase", () => {
  // No añadimos Service Worker: la instalación requiere internet para operar.
  assert(!html.includes("serviceWorker.register("));
  assert(!Object.hasOwn(manifest, "background_sync"));
  assert(!Object.hasOwn(manifest, "shortcuts"));
});
