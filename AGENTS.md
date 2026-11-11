# Torre Fuerte — instrucciones para Codex

## Producto y autonomía
Taller de motocicletas en Puerto Escondido, Oaxaca. La web pública consigue solicitudes y contacto por WhatsApp. El portal administra el trabajo diario desde Android de gama media. Identidad y calidad visual son objetivos junto con facilidad de uso y confiabilidad: ninguno sustituye al otro.

Ejecuta directamente las acciones que puedas realizar con tus herramientas: inspeccionar, editar, arrancar, probar y capturar. No traslades trabajo rutinario al usuario. Comprueba alcance y recuperación antes de acciones destructivas o irreversibles. Trabaja en una rama; no publiques sobre `main` sin instrucción. Cada tarea de nube ya está aislada: usa el checkout existente, sin worktrees salvo petición expresa.

## Arquitectura activa
- `index.html`: HTML, CSS y JavaScript públicos embebidos. `styles.css` y `script.js` son legado; no controlan la landing.
- `operacion/index.html`, `style.css`, `app.js`: portal estático; no hay framework ni build. No migres de arquitectura por preferencia personal.
- `operacion/service-lines.mjs`: validación, centavos MXN, persistencia y verificación del desglose; compartido con las pruebas.
- `tf-config.js`: URL y clave **publicable** de Supabase, no secretos.
- Supabase remoto: `tf_requests`, `tf_staff`, `tf_service_lines`; funciones `tf-staff-login` y `tf-create-request`. Sus fuentes y políticas de producción no están en este repositorio. No inventes sus contratos ni declares RLS auditada sin examinarlos.
- `INSTRUCCIONES.txt` y `LEEME.txt` son instrucciones históricas; para la integración actual manda el código activo y este documento.
- `seguimiento/` y `sliderbros-studio/`: superficies independientes, fuera del rediseño de operaciones. Conserva sus contratos.
- Dependencias del portal fijadas en jsDelivr; pdfmake y sus fuentes se cargan al generar una nota. Fuentes de marca locales en `assets/fonts/`, licencia OFL incluida.

## Dirección visual obligatoria
Lee `design.md` y activa `.agents/skills/direccion-visual/SKILL.md` antes de trabajos visuales. Landing editorial con fotografía y tipografía condensada; portal con jerarquía operativa, folios, estados y acciones visibles. Logo existente, carbón, rojo de marca y superficies claras. Sin plantillas SaaS, métricas inventadas ni reseñas ficticias. Las fotografías disponibles son ilustraciones generadas; no presentarlas como fotos reales del taller.

Modifica componentes y tokens existentes; no acumules temas al final del CSS. Una mejora de diseño debe cambiar composición y experiencia, además de color. No añadas dependencias visuales pesadas sin utilidad y licencia verificadas.

## Componentes y acceso
- Botones principales rojos; secundarios delineados. Estados con texto, nunca solo color. Ver tokens en `design.md`.
- Objetivos táctiles de 44 px, campos de 48 px. Etiquetas asociadas, foco visible, pestañas con flechas/Home/End y diálogos nombrados; respeta `prefers-reduced-motion`.
- En móvil las órdenes tienen fichas con acción Abrir visible; en escritorio tabla con paginación. Ambos usan los mismos filtros y registros.
- Tutorial reiniciable, con salida y retroceso, sin editar datos automáticamente.
- Autenticación mediante usuario y contraseña, sin exigir correo al mecánico. La comprobación de `tf_staff` en cliente no sustituye RLS ni autorización del servidor.

## Integridad, seguridad y privacidad
- No simules guardados. Cualquier confirmación debe depender de respuesta válida y lectura posterior. Conserva el desglose visible al fallar y bloquea reintentos de resultado incierto.
- REST de conceptos no es una transacción: no prometas atomicidad. Una solución transaccional requiere función de servidor revisada con el esquema real. No apliques migraciones de producción a ciegas.
- No escribas datos ficticios en producción. Usa fixtures o una base de pruebas explícita. No publiques teléfonos, expedientes, claves de servicio, contraseñas o tokens.
- Usa `textContent` o formatters de texto para datos del cliente. Protege exportaciones contra fórmulas CSV.
- **Notas internas nunca en PDF del cliente.** Comanda interna sin precios y 76 mm; nota de servicio con conceptos y total. Ninguna es factura fiscal. No añadir un ticket de cobro sin necesidad comprobada.
- Solicitud web ≠ cita confirmada. Mantén consentimiento, aviso de privacidad, WhatsApp e idempotencia. Los duplicados deben prevenirse también en servidor; una clave del cliente por sí sola no lo garantiza.
- En cambios exclusivamente visuales conserva IDs, eventos y contratos de citas, autenticación, Supabase, impresión, PDF, tour y WhatsApp.

## Desarrollo y comprobación
Desde la raíz: `python3 -m http.server 8000 --bind 0.0.0.0`. No hay instalación de aplicación ni build. Navegación interna: `/`, `/operacion/`.

- `node --check operacion/app.js` y `git diff --check`.
- `node --test tests/service-lines.test.mjs`: errores, conflictos, eliminación, validación y cálculos.
- `tests/live-supabase.mjs` es una prueba optativa contra la base real. Requiere autorización explícita para ese proyecto, flag `--allow-test-records` y contraseña por secreto HTTP; nunca ejecutarla como suite habitual. Ver `docs/qa/LIVE-TEST.md`.
- Con Playwright disponible y Chromium en `/usr/bin/chromium`: `node tests/browser.cjs`, `node tests/functional.cjs`, `node tests/ux-audit.cjs`, `node tests/pdf-feedback.cjs`, `node tests/performance.cjs`.
- Fixtures interceptan Supabase solo en pruebas; nunca añadir un modo de acceso ficticio al producto. `tests/browser.cjs` transporta assets públicos con curl y TLS verificado para respetar proxy/CA de nube.
- Captura ambas superficies a 320, 375, 390, 430, 768, 1280 y 1440 px. Inspecciona composición, scroll, teclado, menús, orden, formularios, estados, tutorial y documentos; corrige y repite donde cambió.
- Mide rendimiento indicando condiciones; cero infracciones de axe no equivale a auditoría manual completa. No llames prueba de Android físico a una emulación Chromium.
- Antes de refactors amplios toma un checkpoint recuperable. Distingue pruebas unitarias, navegador con backend aislado y validación real de producción. No declares checks no ejecutados.

Consulta `docs/qa/mesa-de-trabajo/AUDITORIA.md` para la auditoría UX/diseño actual y `docs/qa/REPORT.md` para evidencia y limitaciones anteriores, y `docs/cloud-start.md` para el entorno reutilizable.
