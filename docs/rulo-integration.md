# Rulo · integración de las seis ilustraciones

Base `a3f64337d8efb72eed7312836a5f46b8d216b4c1` · rama `feat/rulo-illustrations` · noviembre de 2026. **Entrega de revisión: sin merge a main ni despliegue de producción.**

Se leyeron `AGENTS.md` y `LEEME.md` del ZIP. El instalador se inspeccionó antes de ejecutarlo; el dry-run encontró las anclas correctas. Se aplicó y se adaptó únicamente la presentación al diseño actual. Las imágenes conservan los bytes originales del paquete.

| Ilustración WebP           | Estado que la muestra                                   | Lo que se conserva                               |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------ |
| `rulo-login`               | Acceso, junto al título de `.signin`                    | Formulario, campos y autenticación originales    |
| `rulo-sin-ordenes`         | Consulta correcta y cero órdenes                        | Recibir moto, filtros y exportación existentes   |
| `rulo-sin-solicitudes`     | Agenda de hoy sin solicitudes tras carga correcta       | Conteo y texto originales; no invade Calendario  |
| `rulo-servicio-finalizado` | `#orderCompletion` confirmado por Lista/Entregada       | Mismo guardado y acción de preparar nota         |
| `rulo-sin-historial`       | Búsqueda/filtros sin coincidencias en una lista cargada | Limpiar y búsqueda existentes; no crea historial |
| `rulo-sin-conexion`        | Aviso existente de desconexión                          | ID, texto y función de conexión idénticos        |

## Ajustes sobre el instalador

- Cabecera de acceso con imagen lateral de 112 px, 80 px móvil, en lugar de una imagen alta encima del formulario. Entrar continúa visible a 320×667.
- Imágenes vacías contenidas, de 176/152 px; agenda pequeña de 88 px. Fondos, tipografía, botones y espaciados siguen el sistema actual.
- Cierre móvil con imagen de 76 px y contenido/acción a ancho completo. La ilustración no convierte un clic en éxito ni aparece al guardar solo notas.
- Imagen offline como `picture` hermano del aviso, con carga de baja prioridad mientras hay conexión. Se conserva el nodo de texto que actualiza la función existente y la imagen sigue disponible al cortar la red. No se añade service worker ni lógica de red.
- Vacíos retirados durante carga/error, y arte vacío oculto cuando el aviso sin conexión es prioritario. Los mensajes y errores existentes permanecen.
- Reglas incorporadas junto a los componentes y breakpoints actuales; sin un tema añadido al final del CSS. Las escenas permanecen estáticas.

Los seis WebP son RGBA de 640×640 y suman 528680 bytes (~516 KiB). Solo se solicitan al usarse, salvo acceso y la imagen preparada para offline. Los PNG sirven como respaldo de formato: Chromium seleccionó WebP en las seis escenas y no solicitó ningún PNG. No hay imágenes nuevas en la landing ni en los documentos del cliente. La escena de agenda conserva su suelo dibujado original.

## Integridad y pruebas

`app.js` completo, salvo los dos renderers de presentación `renderActivity` y `renderMobileOrders`, es idéntico byte por byte a la base. También se verificaron las 16 funciones y cuatro consultas protegidas. No cambian Supabase, WhatsApp, autenticación, órdenes, comanda, PDF, fuentes o shader. No se ejecutaron escrituras sobre datos reales.

La reejecución del instalador mantuvo los mismos hashes de HTML, JS, CSS y las 12 imágenes: integración idempotente. La procedencia y hashes de assets quedan en [assets.json](qa/rulo/assets.json). `tests/contracts.cjs` incluye entrada CLI para que el comando recomendado por el paquete ejecute realmente sus comprobaciones.

Pruebas específicas de Rulo: estado normal sin arte incorrecto; filtro vacío y recuperación; cero órdenes; carga y fallo inicial/actualización; recuperación y llegada de registros en móvil/escritorio; agenda vacía; corte real de red del contexto Chromium; éxito solo tras respuesta válida, no por clic/fallo/notas; formatos y geometría en siete anchos; acciones visibles y axe en los estados ilustrados.

**110 comprobaciones aprobadas**, incluidas 12 específicas de Rulo, más la regresión PDF. Se ejecutaron las suites de conceptos, funcionales, UX, calendario, cierres, refinamiento, shader y PDF existentes. Se verificaron los siete anchos de 320 a 1440 px; los estados ilustrados pasaron sus análisis de axe sin infracciones detectadas. Resultados completos y condiciones: [verification.json](qa/rulo/verification.json), [Rulo](qa/rulo/results.json), [accesibilidad habitual](qa/rulo/accessibility.json) y [rendimiento](qa/rulo/performance-ops.json). No hay build de framework: la app sigue siendo estática. `node --check`, formato y `git diff --check` comprueban los archivos activos.

Una muestra local Chromium 390×844, CPU 4×, latencia 150 ms y 200000 B/s: OPS LCP observado **1.268 s**, CLS **0.0048**; calendario y pdfmake permanecen diferidos. Los dos WebP iniciales son acceso y el aviso preparado para desconexión; el resto se carga en su estado. La medición usa backend/CDN aislados y no representa un Android físico o producción.

El detector Impeccable se ejecutó una vez: conserva únicamente la advertencia histórica de padding de Agenda. No se añadieron ignores; la separación de 24 px en escritorio y la retirada del borde lateral en móvil se mantienen. La revisión visual incluye antes/después de las seis escenas.

Las pruebas son Chromium y fixtures aislados; no acreditan Android físico, impresora o validación del servidor remoto. No se añadieron animaciones de Rulo, y movimiento reducido conserva los mensajes escritos. La revisión estética queda al usuario.

## Archivos y revisión

Código de producto: `operacion/index.html`, `operacion/style.css` y solo dos renderers visuales de `operacion/app.js`; assets en `assets/ops/`. Especificación en `DESIGN.md`/`AGENTS.md`. Pruebas: `tests/rulo-ui.cjs`, `tests/capture-rulo.cjs` y entrada CLI de `tests/contracts.cjs`.

[Galería de revisión](rulo-review.md): capturas reales del código de la rama, con datos ficticios aislados. La galería y el PR en borrador permiten revisar sin desplegar la app. Para desarrollo local: `python3 -m http.server 8000 --bind 127.0.0.1` y `/operacion/`.

Checkpoint de recuperación: `checkpoint/antes-rulo-20261111`. No hay migraciones o cambios de entorno que deshacer. Esta entrega no autoriza un despliegue posterior sin instrucción del usuario.
