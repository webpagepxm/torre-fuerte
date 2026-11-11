/* Ayuda de instalación: visible en la pantalla de login, incluida la versión escritorio. */
(() => {
  const panel = document.getElementById("androidInstall");
  const button = document.getElementById("installAndroidButton");
  const steps = document.getElementById("androidInstallSteps");
  const status = document.getElementById("androidInstallStatus");
  if (!panel || !button || !steps || !status) return;

  const platform = navigator.userAgentData?.platform || navigator.userAgent || "";
  const isAndroid = /android/i.test(platform);
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  if (installed) {
    panel.hidden = true;
    return;
  }

  // No bloquear el módulo en computadoras: también deben poder ver la guía.
  panel.hidden = false;
  steps.hidden = false;
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    panel.hidden = true;
  });

  button.addEventListener("click", async () => {
    status.hidden = false;
    if (!isAndroid) {
      status.textContent = "Abre esta misma dirección en Chrome desde tu teléfono Android y sigue los tres pasos.";
      return;
    }

    if (deferredPrompt) {
      const prompt = deferredPrompt;
      deferredPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === "accepted") {
          panel.hidden = true;
          return;
        }
      } catch {
        // Sin ventana nativa: las instrucciones de instalación siguen visibles.
      }
    }
    status.textContent = "Si Chrome no muestra la instalación directa, sigue los pasos de arriba.";
  });
})();
