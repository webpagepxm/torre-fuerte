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
  const panel = { hidden: false };
  const steps = { hidden: false };
  const status = { hidden: true, textContent: "" };
  const button = {
    addEventListener(name, callback) { buttonEvents[name] = callback; },
    click() { return buttonEvents.click?.(); },
  };
  const controls = {
    androidInstall: panel,
    installAndroidButton: button,
    androidInstallSteps: steps,
    androidInstallStatus: status,
  };
  const document = { getElementById(id) { return controls[id] || null; } };
  const window = {
    matchMedia() { return { matches: standalone }; },
    addEventListener(name, callback) { events[name] = callback; },
  };
  vm.runInNewContext(code, { document, navigator: { userAgent }, window });
  return { panel, button, steps, status, events };
}

test("escritorio muestra la ilustración y las instrucciones, igual que Android", async () => {
  const ui = harness({ userAgent: "Mozilla/5.0 Windows NT 10.0" });
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.steps.hidden, false);
  await ui.button.click();
  assert.match(ui.status.textContent, /teléfono Android/);
});

test("iPhone puede ver la guía, pero no finge instalación nativa Android", async () => {
  const ui = harness({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" });
  assert.equal(ui.panel.hidden, false);
  await ui.button.click();
  assert.match(ui.status.textContent, /Chrome/);
});

test("no muestra el módulo dentro de la app ya instalada", () => {
  const ui = harness({ standalone: true });
  assert.equal(ui.panel.hidden, true);
});

test("Android mantiene instrucciones visibles sin activar servicios externos", async () => {
  const ui = harness();
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.steps.hidden, false);
  await ui.button.click();
  assert.equal(ui.panel.hidden, false);
  assert.match(ui.status.textContent, /pasos de arriba/);
});

test("abre prompt de instalación Android cuando Chrome lo ofrece", async () => {
  const ui = harness();
  let prompts = 0;
  ui.events.beforeinstallprompt({
    preventDefault() {},
    async prompt() { prompts++; },
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  await ui.button.click();
  assert.equal(prompts, 1);
  assert.equal(ui.panel.hidden, true);
});

test("si la instalación se cancela, las instrucciones permanecen visibles", async () => {
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

test("imagen existente y módulo visible debajo del login, sin cambiar autenticación", () => {
  const html = read("operacion/index.html").toString("utf8");
  const css = read("operacion/style.css").toString("utf8");
  const image = read("operacion/images/torre-fuerte-android-install.webp");
  assert.equal(image.subarray(0, 4).toString(), "RIFF");
  assert.equal(image.subarray(8, 12).toString(), "WEBP");
  assert(html.indexOf('id="androidInstall"') > html.indexOf('id="loginForm"'));
  assert(html.indexOf('id="androidInstall"') < html.indexOf('id="workspace"'));
  assert.match(html, /id="androidInstall" aria-label="Instalar Torre Fuerte en Android">/);
  assert.match(html, /id="androidInstallSteps">/);
  assert.match(html, /Instala la app en tu Android/);
  assert.match(css, /\.android-install \{\s*display: grid/);
  assert.match(css, /display-mode: standalone/);
  assert.match(html, /<script type="module" src="\.\/app\.js\?v=rulo-20261111-1"><\/script>/);
});
