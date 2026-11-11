/* Guía de instalación Android del portal, sin tocar autenticación ni datos. */
(() => {
  const panel = document.getElementById("androidInstall");
  const button = document.getElementById("installAndroidButton");
  const steps = document.getElementById("androidInstallSteps");
  if (!panel || !button || !steps) return;

  const platform = navigator.userAgentData?.platform || navigator.userAgent || "";
  const isAndroid = /android/i.test(platform);
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  if (!isAndroid || installed) return;
  panel.hidden = false;

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
    // Instrucciones siempre disponibles si Chrome no ofrece instalación nativa.
    steps.hidden = false;
    button.setAttribute("aria-expanded", "true");
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice?.outcome === "accepted") panel.hidden = true;
    } catch {
      // La guía permanece visible como alternativa de instalación manual.
    }
  });
})();
