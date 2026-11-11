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
- `operacion/atmosphere.js`: presentación aislada de OPS, shader decorativo acotado con fallback CSS y pausa. No conectar con sesión, órdenes ni persistencia de negocio.
- `assets/ui-interactions.css`: tokens de movimiento y respuestas visuales compartidas por landing y OPS; no añadir lógica de negocio aquí.
- Dependencias del portal fijadas en jsDelivr; pdfmake y sus fuentes se cargan al generar una nota. Fuentes de marca locales en `assets/fonts/`, licencia OFL incluida.

## Dirección visual obligatoria

Lee `DESIGN.md` y activa `.agents/skills/direccion-visual/SKILL.md` antes de trabajos visuales. Landing editorial con fotografía y tipografía condensada; portal con jerarquía operativa, folios, estados y acciones visibles. Logo y tipografías existentes. La landing conserva carbón y rojo. Por petición explícita del usuario, OPS tiene identidad SaaS clara propia, inspirada en monday.com: lateral lavanda, acciones azules y halo cian/violeta. No añadir métricas inventadas, módulos ficticios ni reseñas. Las fotografías disponibles son ilustraciones generadas; no presentarlas como fotos reales del taller.

Modifica componentes y tokens existentes; no acumules temas al final del CSS. Una mejora de diseño debe cambiar composición y experiencia, además de color. No añadas dependencias visuales pesadas sin utilidad y licencia verificadas.

## Componentes y acceso

- Botones principales rojos en la landing y azules/violetas en OPS; secundarios delineados. Estados con texto, nunca solo color. Ver tokens en `DESIGN.md`.
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
- Con Playwright disponible y Chromium en `/usr/bin/chromium`: `node tests/browser.cjs`, `node tests/functional.cjs`, `node tests/ux-audit.cjs`, `node tests/ops-unslop.cjs`, `node tests/pdf-feedback.cjs`, `node tests/performance.cjs`, `node tests/premium-ui.cjs`, `node tests/saas-ui.cjs`. `TF_PHASE=after node tests/capture-ops.cjs` reproduce la evidencia visual actual con datos ficticios; `TF_PHASE=before` usa el checkpoint indicado en ese script.
- Fixtures interceptan Supabase solo en pruebas; nunca añadir un modo de acceso ficticio al producto. `tests/browser.cjs` transporta assets públicos con curl y TLS verificado para respetar proxy/CA de nube.
- Captura ambas superficies a 320, 375, 390, 430, 768, 1280 y 1440 px. Inspecciona composición, scroll, teclado, menús, orden, formularios, estados, tutorial y documentos; corrige y repite donde cambió.
- Mide rendimiento indicando condiciones; cero infracciones de axe no equivale a auditoría manual completa. No llames prueba de Android físico a una emulación Chromium.
- Antes de refactors amplios toma un checkpoint recuperable. Distingue pruebas unitarias, navegador con backend aislado y validación real de producción. No declares checks no ejecutados.

Consulta `docs/torre-fuerte-ops-audit.md` para la auditoría actual con Unslop. La skill oficial está íntegra en `.agents/skills/unslop/`, con revisión y licencia en `PROVENANCE.md`; leerla directamente cuando se aplique. Las auditorías anteriores están en `docs/qa/mesa-de-trabajo/AUDITORIA.md` y `docs/qa/REPORT.md`; el entorno reutilizable en `docs/cloud-start.md`.

## Refinamiento visual

`PRODUCT.md` contiene el producto real y sus límites; `DESIGN.md` es la especificación visual canónica (`design.md` conserva el enlace anterior). Skills de diseño verificadas en `.agents/skills/`; procedencia en `docs/qa/premium/skills.json`. `tests/premium-ui.cjs` protege contra cambios involuntarios de scripts, URLs, formularios y archivos de negocio durante ajustes visuales. Evidencia: `docs/premium-ui-refinement.md`.

## Identidad SaaS de OPS · petición del usuario

La dirección nueva de `DESIGN.md` prevalece sobre las restricciones históricas de carbón/rojo, ausencia de shaders o identidad compartida. Conservar familias y tamaños de letra aprobados. Efecto focal: halo animado de búsqueda/acceso; navegación y diálogos mantienen respuesta corta y cierre inmediato. WebGL sin biblioteca, raster máximo 640×220, 18 FPS escritorio / 12 móvil; pausa en segundo plano, fuera de pantalla, al abrir diálogos, por preferencia persistente y movimiento reducido. Fallback CSS obligatorio. No extender esta paleta o efectos al sitio público. Evidencia en `docs/ops-saas-platform.md`.

## Auditoría final y cierre de flujos

La pasada `refine/final-ux-audit` se entrega sin despliegue por instrucción expresa del usuario. No publicar esta rama sin una orden posterior. Mantener la paleta y tipografía actuales. No abrir tours automáticamente. Halo estático en reposo; animación solo al enfocar, máximo 1600 ms por gesto. No reiniciarlo por cada tecla.

Una orden Lista/Entregada confirmada por el guardado existente ofrece resumen y acceso directo a nota, sin nuevas escrituras ni celebración repetida. Comanda preparada no equivale a impresión física, descarga iniciada no equivale a archivo guardado, Web Share resuelto no equivale a mensaje entregado. Conservar feedback prescriptivo al cancelar compartir.

`node tests/final-refinement.cjs` comprueba estos cierres, ayuda manual y taps sintetizados. `tests/contracts.cjs` protege las 16 funciones operativas, cuatro consultas directas y scripts/controles/enlaces públicos contra `93e992d`; permite los cambios explícitos de feedback y presentación. Los archivos de persistencia, configuración y superficies independientes se conservan según esa comprobación. Ver `docs/final-ux-audit.md`.

## Calendario de operaciones

La vista usa FullCalendar 6.1.19 como motor diferido y controles propios Mes/Agenda/periodo/Hoy. Preservar fechas/franjas, seis estados, IDs de órdenes y apertura mediante `openOrder`; no añadir edición por arrastre ni escrituras de calendario. El panel del día es presentación de las mismas órdenes; la agenda general de hoy solo se muestra en Órdenes. En móvil el mes es compacto a ancho completo con fechas de 44 px y detalle debajo; Agenda es la vista inicial.

Antes de publicar cambios de esta vista: `node tests/calendar-ui.cjs`, además de las comprobaciones de contratos y documentos. No confundir fallo inicial de datos con calendario vacío. El panel Más órdenes conserva botón de cierre enfocable, retorno de foco y Escape. Capturas reproducibles con `TF_PHASE=before|after node tests/capture-calendar.cjs` (base `6b41f40`).

## Ilustraciones de Rulo

Integración en `feat/rulo-illustrations`, sin despliegue ni merge a producción durante esta tarea. Paquete del usuario revisado; WebP preferido y PNG de respaldo locales en `assets/ops/`. No insertar estas ilustraciones en la web pública, comanda o PDF. Son decorativas y no sustituyen texto, errores o acciones.

Los vacíos dependen de consulta terminada correctamente; `data-records-state` es solo presentación, no un campo de Supabase. El arte de éxito hereda exclusivamente `#orderCompletion`; no añadir confirmaciones por clic. Sin historial es búsqueda sin resultados, no una función nueva. El aviso sin conexión conserva la función y el nodo de texto originales; su imagen se mantiene cargada para el corte de red.

`node tests/rulo-ui.cjs` verifica estados reales/negativos con fixtures, WebP seleccionado, corte de red del navegador, siete anchos, foco/acciones y accesibilidad. `TF_PHASE=before|after node tests/capture-rulo.cjs` captura las seis escenas contra `a3f6433`. Ver `docs/rulo-review.md` y `docs/rulo-integration.md`.
