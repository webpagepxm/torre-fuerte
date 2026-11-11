const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("botón Baja la app dentro de Ops y fuera del login público", () => {
  const html = read("operacion/index.html");
  const start = html.indexOf('<section id="workspace" hidden>');
  const button = html.indexOf('class="install-guide-button"');
  const orders = html.indexOf('class="ops-connection-status"');
  assert(start !== -1 && button > start && button < orders);
  assert.match(html.slice(button, orders), /href="\.\/instalar\.html"/);
  assert.match(html.slice(button, orders), /Baja la app/);
  assert.match(html, /href="\.\/style\.css\?v=ops-download-guide-20261111-1"/);
});

test("artículo ilustrado con tres pasos y retorno a Ops", () => {
  const html = read("operacion/instalar.html");
  assert.match(html, /Cómo instalar Torre Fuerte Ops en Android/);
  assert.match(html, /torre-fuerte-android-install\.webp/);
  assert.match(html, /Chrome/);
  assert.match(html, /tres puntos/);
  assert.match(html, /Instalar app/);
  assert.match(html, /Agregar a pantalla principal/);
  assert.match(html, /href="\.\/">Abrir Torre Fuerte Ops para instalar/);
  assert.match(html, /No necesitas Play Store/);
  assert(!/supabase\.co|tf_requests|service_role/.test(html));
  assert.equal((html.match(/class="step"/g) || []).length, 3);
});

test("el botón conserva tamaño accesible en móvil", () => {
  const css = read("operacion/style.css");
  assert.match(css, /\.install-guide-button\s*\{/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\.install-guide-button:focus-visible/);
  assert.match(css, /@media\(max-width:760px\)\s*\{\s*\.install-guide-access/);
});
