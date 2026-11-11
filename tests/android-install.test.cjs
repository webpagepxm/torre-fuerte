// Guía Android del login: pruebas de UI aisladas, sin credenciales ni Supabase.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p));
const code = read("operacion/install-app.js").toString("utf8");

function harness({ userAgent = "Mozilla/5.0 (Linux; Android 14)", standalone = false } = {}) {
  const events = {};
  const buttonEvents = {};
  const panel = { hidden: true };
  const steps = { hidden: true };
  const button = {
    attrs: {},
    setAttribute(name, value) { this.attrs[name] = value; },
    addEventListener(name, callback) { buttonEvents[name] = callback; },
    click() { return buttonEvents.click?.(); },
  };
  const controls = {
    androidInstall: panel,
    installAndroidButton: button,
    androidInstallSteps: steps,
  };
  const document = { getElementById(id) { return controls[id] || null; } };
  const window = {
    matchMedia() { return { matches: standalone }; },
    addEventListener(name, callback) { events[name] = callback; },
  };
  vm.runInNewContext(code, { document, navigator: { userAgent }, window });
  return { panel, button, steps, events };
}

test("no muestra el módulo en escritorio ni dentro de la app ya instalada", () => {
  assert.equal(harness({ userAgent: "Mozilla/5.0 Windows NT 10.0" }).panel.hidden, true);
  assert.equal(harness({ standalone: true }).panel.hidden, true);
});

test("Android móvil muestra el botón y ofrece instrucciones al pulsarlo", async () => {
  const ui = harness();
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.steps.hidden, true);
  await ui.button.click();
  assert.equal(ui.steps.hidden, false);
  assert.equal(ui.button.attrs["aria-expanded"], "true");
});

test("usa prompt nativo cuando Chrome lo ofrece y se oculta tras instalar", async () => {
  const ui = harness();
  let prompts = 0;
  const ev = {
    preventDefault() {},
    async prompt() { prompts++; },
    userChoice: Promise.resolve({ outcome: "accepted" }),
  };
  ui.events.beforeinstallprompt(ev);
  await ui.button.click();
  assert.equal(prompts, 1);
  assert.equal(ui.panel.hidden, true);
});

test("si el prompt se cancela, mantiene instrucciones visibles", async () => {
  const ui = harness();
  ui.events.beforeinstallprompt({
    preventDefault() {},
    async prompt() {},
    userChoice: Promise.resolve({ outcome: "dismissed" }),
  });
  await ui.button.click();
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.steps.hidden, false);
  ui.events.appinstalled();
  assert.equal(ui.panel.hidden, true);
});

test("imagen real y módulo debajo del formulario sin cambiar la autenticación", () => {
  const html = read("operacion/index.html").toString("utf8");
  const css = read("operacion/style.css").toString("utf8");
  const image = read("operacion/images/torre-fuerte-android-install.webp");
  assert.equal(image.subarray(0, 4).toString(), "RIFF");
  assert.equal(image.subarray(8, 12).toString(), "WEBP");
  assert(html.indexOf('id="androidInstall"') > html.indexOf('id="loginForm"'));
  assert(html.indexOf('id="androidInstall"') < html.indexOf('id="workspace"'));
  assert.match(html, /Instala la app en tu Android/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /display-mode: standalone/);
  assert.match(html, /<script type="module" src="\.\/app\.js\?v=rulo-20261111-1"><\/script>/);
});
