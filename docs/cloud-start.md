# Desarrollo en nube

Usar `/workspace/torre-fuerte`, el checkout existente. Cada tarea ya está aislada; no crear worktrees salvo petición explícita. No hay instalación de aplicación, gestor de paquetes ni build. Python 3 sirve los archivos estáticos; Node permite validar JavaScript.

```sh
cd /workspace/torre-fuerte
python3 -m http.server 8000 --bind 0.0.0.0
```

En otra sesión, comprobar `curl -fsS http://127.0.0.1:8000/` y `/operacion/`. No publicar enlaces de localhost en el onboarding. Los procesos deben iniciarse de nuevo tras restaurar la máquina.

Playwright ya está disponible en el runtime actual y Chromium está en `/usr/bin/chromium`. Ejecutar desde la raíz:

```sh
node --test tests/service-lines.test.mjs
node tests/browser.cjs
node tests/functional.cjs
node tests/performance.cjs
```

Las pruebas de navegador requieren `playwright`, `curl`, acceso a `cdn.jsdelivr.net` y el navegador indicado; no son dependencias de la aplicación. Los assets de pruebas se descargan con la CA/proxy del entorno y se conservan en `/tmp/tf-verified-assets`. No desactivar TLS. Evidencia generada en `/tmp/torre-fuerte-qa`; configurar `TF_QA_OUTPUT` para cambiar ese directorio. `TF_BASE_URL` selecciona el servidor local. El fixture intercepta Supabase y WhatsApp: no se escriben datos de producción.

El producto real requiere `cdn.jsdelivr.net` y `pmeomhohqgdgaygkbeoe.supabase.co`. Crear PR por CLI requiere acceso a `api.github.com`, además del Git HTTPS ya inyectado por la plataforma. Revisar nombres/estado de credenciales existentes antes de pedir otras; no imprimir valores ni pedir secretos en chat. La clave publicable de `tf-config.js` no es una credencial de personal.

**Persistencia de nube:** estas instrucciones están guardadas como archivo del repositorio. El intento de guardarlas en el campo `start_skill` del borrador del entorno devolvió `INVALID_ARGUMENT`: no se pudo confirmar su persistencia. No se ha publicado una configuración del entorno ni verificado su restauración en otra tarea.
