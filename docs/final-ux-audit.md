# Torre Fuerte · auditoría integral y refinamiento final

11 de noviembre de 2026 · base `93e992d9423e3204573ead457391fba78f418797` · rama `refine/final-ux-audit`.

**Resultado:** siete hallazgos verificables atendidos mediante cambios pequeños de presentación, ayuda y cierre de flujos. Se conserva la identidad vigente: landing carbón/rojo y OPS lavanda/azul/violeta, con las familias y tamaños aprobados. Sin dependencias nuevas, migraciones, escrituras en Supabase real ni despliegue. El sitio publicado continúa en la versión anterior; esta entrega está preparada para revisión local.

Esta es una evaluación heurística y técnica del producto real, no un estudio con usuarios. Las puntuaciones son juicio profesional acotado a la evidencia disponible; no son métricas de conversión, una certificación WCAG ni resultados de Android físico.

## 1. Inventario y límites reales

| Superficie / archivo          | Función comprobada en código y/o navegador                                                                                                        | Límite o pendiente                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`, `index.html`             | Landing activa, servicios, teléfono, mapa, vCard y CTA de WhatsApp                                                                                | CSS y JS están embebidos. Las fotografías son ilustraciones generadas, declaradas como tales                       |
| `#form-cita`                  | Validación, consentimiento, fecha local de México, rechazo de domingos/fechas pasadas, WhatsApp y solicitud paralela mediante `tf-create-request` | Solicitud no equivale a cita confirmada. Abrir WhatsApp no acredita envío. El servidor no está versionado aquí     |
| `#form-alta`                  | Prepara solicitud de registro en WhatsApp                                                                                                         | No crea cuenta ni catálogo de clientes; el taller confirma el registro                                             |
| `#form-mi-moto`               | Prepara consulta por WhatsApp                                                                                                                     | No muestra historial conectado, puntos o beneficios automáticos; requiere identificación por el taller             |
| `/operacion/`, acceso         | Usuario/clave mediante `tf-staff-login`, sesión de Supabase y comprobación `tf_staff`                                                             | La comprobación cliente no sustituye autorización/RLS remotas; sus fuentes no están en el repositorio              |
| Órdenes                       | Lista, búsqueda por datos reales, filtros, contador, paginación, filas móviles y CSV                                                              | Hasta 1000 registros. Clientes y motos se capturan por orden; no hay directorios ni historial maestro por vehículo |
| Recepción manual              | Cliente, teléfono, moto, servicio y folio devuelto por servidor                                                                                   | No se alteraron payload, validaciones ni reglas de alta                                                            |
| Detalle / seguimiento interno | Estados pendiente, confirmada, en reparación, lista, entregada, cancelada; notas y protección de borradores                                       | No existe portal conectado de seguimiento para clientes                                                            |
| Calendario                    | Fechas/franjas solicitadas, lista semanal móvil y mes escritorio, carga diferida y reintento                                                      | No representa disponibilidad confirmada ni agenda con horarios reservados                                          |
| Desglose                      | Conceptos, cantidades, precios, total en centavos, guardado y lectura de verificación                                                             | REST no transaccional; conflictos/resultados inciertos conservan protección existente                              |
| Comanda                       | Documento interno de 76 mm, moto/folio/trabajo, sin precios; `window.print()`                                                                     | No puede acreditar papel impreso ni respuesta de impresora                                                         |
| Nota de servicio              | PDF real con conceptos/total, descarga y compartir/fallback                                                                                       | Sin notas internas; no es factura fiscal. Menú del teléfono y envío efectivo son pasos distintos                   |
| Cuenta / Ayuda                | Cambiar clave, cerrar sesión, guía general y guía contextual                                                                                      | Cambio de clave revisado en fuente; no se modificaron credenciales reales. Guías ahora solo manuales               |
| `/aviso-privacidad.html`      | Aviso existente enlazado desde el formulario                                                                                                      | Conservado; no constituye revisión legal                                                                           |
| `/seguimiento/`               | Presentación temporal de avances                                                                                                                  | No es consulta privada conectada a las órdenes                                                                     |
| `/vista-previa.html`          | Demostración histórica                                                                                                                            | No es fuente ni reemplazo de la aplicación real                                                                    |
| `/sliderbros-studio/`         | Producto independiente                                                                                                                            | Inventariado y conservado; fuera del refinamiento de Torre Fuerte                                                  |
| `styles.css`, `script.js`     | Archivos heredados                                                                                                                                | No controlan la landing activa; no se editaron                                                                     |

Arquitectura: HTML/CSS/JS nativos, sin framework ni build de aplicación. Producción usa GitHub Pages desde `main`, según el despliegue verificado en la iteración anterior; no hay workflow versionado en este checkout. Esta pasada no toca `main` ni configuración de despliegue. No se encontró un flujo activo de QR para órdenes o clientes; no se inventó uno.

Dependencias existentes: Supabase JS 2.95.0, Tabulator 6.3.1, Driver.js 1.10.2, FullCalendar 6.1.19 y pdfmake 0.2.20, versiones fijadas en CDN. Calendario y PDF siguen diferidos. Barlow Condensed local, licencia OFL; SVG de iconos coherentes con los Lucide existentes. No se añadió biblioteca visual ni dependencia de producción.

## 2. Recorridos y momentos importantes

| Recorrido                   | Momento importante                                                 | Cierre y siguiente acción                                                                                                                |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Cliente → solicitud         | Servidor acepta el registro; WhatsApp queda preparado por separado | Feedback existente distingue solicitud recibida/cita sin confirmar. El CTA ahora dice Continuar en WhatsApp; se debe enviar el mensaje   |
| Cliente → registro/consulta | Preparación de la conversación                                     | Etiquetas y ayudas describen solicitud y verificación, sin prometer cuenta o historial conectado                                         |
| Mecánico → primera visita   | Ver las motos o recibir la primera                                 | Se eliminan los tours automáticos de entrada/orden. Ayuda y Guía de esta orden mantienen la guía completa cuando se solicita             |
| Mecánico → recepción        | Respuesta con folio del servidor                                   | Alta y apertura de orden existentes, sin cambiar validaciones ni datos enviados                                                          |
| Mecánico → lista/entregada  | Respuesta válida de persistencia                                   | Check estático, estado, folio/moto/servicio y acceso a la nota. Un fallo no muestra esta confirmación                                    |
| Mecánico → documento        | PDF generado o comanda preparada                                   | Descarga iniciada, compartir cancelado/resuelto e impresión física se distinguen con mensajes escritos; no se simula entrega o impresión |

Anticipación: se conservan fecha local conocida, borradores y recuperación existentes; se añade acceso directo desde el cierre a la nota. Microinteracción: presión/apertura breves, sin esperas artificiales. Peak-end: la confirmación se apoya en la respuesta real y no se repite al guardar solo notas. Sin gamificación ni pantallas introductorias.

## 3. Puntuaciones antes/después · 0–5

| Dimensión        | Antes | Después | Evidencia y alcance                                                                                                      |
| ---------------- | ----: | ------: | ------------------------------------------------------------------------------------------------------------------------ |
| Claridad         |     4 |     4.5 | Formularios públicos distinguen solicitar registro/consultar; mismos campos, enlaces y WhatsApp                          |
| Anticipación     |   3.5 |       4 | `#completionNote` enfoca la nota existente, sin nuevas escrituras; borradores conservados                                |
| Consistencia     |   3.5 |     4.5 | Calendario utiliza `--pending`, `--confirmed`, `--working`, `--ready`, igual que lista                                   |
| Acabado visual   |     4 |     4.5 | Se conserva composición/tipografía; resumen de cierre con check y un solo acento de éxito                                |
| Motion           |     3 |     4.5 | Halo estático inicial y en reposo, ráfaga ≤1600 ms al enfocar; pausa y reduced motion verificados                        |
| Onboarding       |   2.5 |     4.5 | Antes dos guías se abrían automáticamente; después primera pantalla/orden útiles y guías manuales disponibles            |
| Estados vacíos   |     4 |       4 | Mensajes y ruta Recibir moto/Limpiar existentes conservados; error no se presenta como vacío                             |
| Errores          |   3.5 |       4 | Cancelar Web Share ya no deja Preparando; fallos y respuestas sin registro no muestran cierre exitoso                    |
| Cierre de flujos |     3 |     4.5 | Lista/entregada confirmadas con resumen y siguiente acción; impresión/descarga/envío no se sobreafirman                  |
| Accesibilidad    |     4 |       4 | Axe sin infracciones detectadas, teclado/foco/tamaño táctil/reduced motion; sin auditoría completa de lector de pantalla |
| Responsive       |   4.5 |     4.5 | Siete anchos sin overflow; apertura/filtros con taps sintetizados. No dispositivo físico                                 |
| Rendimiento      |     4 |     4.5 | Cero dibujos iniciales/en reposo; efecto de duración finita, sin biblioteca nueva; medición local detallada abajo        |

**Auditoría técnica Impeccable (escala propia 0–4):** accesibilidad 3→3, rendimiento 3→4, tokens 3→3, responsive 3→3, integridad 3→4: **15→17/20**, banda Buena. Se mantienen límites de verificación física/remota y valores locales de presentación; no se certifica accesibilidad completa ni se exige un modo oscuro ajeno al uso actual.

## 4. Hallazgos y plan ejecutado

No se identificó un bloqueo P0 ni una infracción P1 comprobada en los flujos ejercitados. Se atendieron seis P2 y un P3. Los límites de backend/hardware se registran como pendientes de verificación, sin presentarlos como fallos demostrados.

| ID / severidad | Evidencia antes / impacto                                                                                             | Acción ejecutada                                                                                                           | Riesgo / esfuerzo                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| H1 · P2        | `enter()` abría tour a los 650 ms; `openOrder()` abría guía a los 350 ms. Dos interrupciones antes del primer trabajo | Retirar solo disparadores automáticos; conservar guías completas, salida y retroceso manuales                              | Bajo / pequeño                                                                   |
| H2 · P2        | Guardar una orden lista/entregada solo decía Estado y notas guardados                                                 | Resumen contextual después de respuesta válida, acceso directo a nota; no repetir en notas ni conservar éxitos obsoletos   | Medio por proximidad al guardado / pequeño; consultas intactas y fallos probados |
| H3 · P2        | El halo seguía dibujando indefinidamente en pantalla quieta, contrario al nuevo brief                                 | Estado inicial estático, 1600 ms por foco/reactivación; sin reinicio por cada tecla                                        | Bajo / pequeño; prueba real WebGL y fallback                                     |
| H4 · P2        | Cancelar Web Share dejaba literalmente Preparando la nota… después de cancelar                                        | Mensaje de cancelación y alternativa de descarga; se conserva el documento                                                 | Bajo / pequeño; reproducido antes y después                                      |
| H5 · P2        | Calendario todavía usaba rojo/azul/ocre/verde de la paleta anterior                                                   | Tomar colores de los mismos tokens semánticos que los estados de la lista                                                  | Bajo / pequeño; eventos/fechas sin cambios                                       |
| H6 · P2        | Texto acreditaba nota descargada/compartida; imprimir no explicaba el límite verificable                              | Distinguir archivo preparado/descarga iniciada, menú del teléfono y envío; comanda preparada con comprobación en impresora | Bajo / pequeño; generación e impresión preservadas                               |
| H7 · P3        | Ser cliente / Mi moto-beneficios podía sugerir cuenta o historial conectados                                          | Solicitar registro / Consultar mi moto, CTA Continuar en WhatsApp e instrucciones de envío/verificación                    | Bajo / pequeño; scripts públicos idénticos                                       |

Orden seguido: retirar interrupciones y corregir cierre de guardado; aclarar documentos/cancelaciones; acotar movimiento y unificar estados; ajustar microcopy pública; verificar visualmente y ejecutar QA. Cambios incrementales y recuperables desde `checkpoint/antes-auditoria-final-20261111`.

## 5. QA y resultados reales

- **84 comprobaciones:** conceptos 6, funcionales 24, UX 10, auditoría anterior 11, refinamiento anterior 7, shader 12 y cierres finales 14. Además, regresión PDF aprobada y PDF real de carga diferida generado.
- **Siete anchos:** 320, 375, 390, 430, 768, 1280 y 1440 px en landing y OPS; sin desbordamiento horizontal ni errores JS en los recorridos probados. Capturas comparables de móvil/escritorio, formularios, primera visita, orden y cierre.
- **Axe:** cero infracciones detectadas en las seis superficies habituales y el nuevo cierre visible. Se ejercitan foco, Escape, flechas/Home/End, filtros, borradores, nueva orden, estados de carga/error, desconexión y tutorial manual.
- **Táctil:** eventos de tap sintetizados en Chromium con `hasTouch`/viewport móvil; abren/cierran orden y despliegan filtros. No se simula la prueba de un Android físico, teclado real, lector de pantalla o impresora.
- **Persistencia/cierre:** confirmación ausente mientras la petición espera, ante error y ante respuesta sin registro; visible tras respuesta válida. Se retira al editar/reabrir; guardar solo notas no repite el bloque. La acción de documento no escribe datos.
- **Documentos:** PDF real conserva total y excluye notas internas; no repite UPDATE si no cambió el desglose. Comanda interna 76 mm sin precios. Share cancelado, resuelto y fallback diferenciados.
- **Protección de contratos:** `tests/contracts.cjs` compara 16 funciones operativas y las cuatro consultas directas contra la base; también scripts, campos/validaciones y enlaces públicos. `service-lines.mjs`, `tf-config.js`, CSS compartido, rutas independientes, privacidad y vCard permanecen idénticos.
- **Herramientas disponibles:** `node --check` de módulos activos, `git diff --check` y formato Prettier. No hay paquete/build/lint de aplicación definido, por lo que no se inventa un build aprobado.

Una prueba del shader falló inicialmente bajo ejecución simultánea por asumir una cantidad mínima de cuadros en exactamente 1.1 s, incluyendo compilación por software. Se cambió la espera a cuadros realmente dibujados, manteniendo verificación de píxeles distintos, raster y parada finita. La regresión PDF esperaba la frase anterior descargada; se actualizó para descarga iniciada y conserva la comprobación del evento de descarga real. No se eliminaron las comprobaciones de generación ni de escrituras.

### Rendimiento

Una muestra local Chromium 390×844, CPU 4×, 200000 B/s, latencia 150 ms y backend/CDN aislados: landing LCP 1.688 s / CLS 0.0705; OPS LCP 0.984 s / CLS 0.0048. PDF y calendario no se cargan antes de utilizarlos. No es medición de producción ni de Android físico.

Con WebGL ANGLE/SwiftShader y las mismas condiciones móviles: **0 dibujos en reposo**, ráfaga acotada a 1600 ms, 12 dibujos en la ventana medida de 2 s después del calentamiento, raster 372×124, ninguna tarea larga registrada en esa ventana e input→siguiente cuadro observado de 9.7 ms. No extrapolar esa muestra a FPS de un dispositivo real ni a todo el tiempo de carga. Las transiciones CSS son cortas y no bloquean acciones; no se promete 60 FPS sin medir hardware real.

### Detector y revisión visual

Impeccable se ejecutó una vez sobre ambos HTML al finalizar. Una advertencia `cramped-padding` en Agenda se contrastó con el navegador: escritorio separa contenido del borde izquierdo mediante 24 px; en móvil retira ese borde y conserva padding superior. Es una señal del análisis estático al combinar breakpoints, no un defecto confirmado; no se añadieron ignores. Se inspeccionaron capturas, espacio del nuevo cierre, tipografía y foco. El lanzador instalado no reconoce el subcomando `audit-storage`; el informe y sus resultados se guardaron directamente en este documento y en `docs/qa/final-refinement/`, sin cambiar herramientas o entorno. Un detector limpio o axe sin infracciones no sustituye juicio visual ni revisión con usuarios.

## 6. Archivos modificados

| Archivo                                                                   | Cambio                                                                                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                              | Solo etiquetas/ayudas públicas; mismos scripts, enlaces, campos y mensajes enviados                            |
| `operacion/index.html`                                                    | Región de cierre, check SVG, feedback de impresión y versiones de assets                                       |
| `operacion/style.css`                                                     | Resumen de cierre, un solo acento de éxito y estado visual estático del halo                                   |
| `operacion/app.js`                                                        | Disparadores de ayuda, feedback posterior al guardado, calendario por tokens y textos documentales/cancelación |
| `operacion/atmosphere.js`                                                 | Ráfaga finita por foco, reposo sin dibujo y fallback si getContext lanza error                                 |
| `AGENTS.md`, `DESIGN.md`, `PRODUCT.md`                                    | Dirección vigente, límites, cierre/onboarding y orden de no desplegar esta pasada                              |
| `tests/browser.cjs`                                                       | Opciones de contexto para pruebas táctiles, con valores anteriores por defecto                                 |
| `tests/contracts.cjs`                                                     | Protección explícita de funciones/consultas/documentos y contratos públicos                                    |
| `tests/final-refinement.cjs`                                              | 14 comprobaciones nuevas, accesibilidad del cierre y capturas                                                  |
| `tests/capture-final.cjs`                                                 | Evidencia reproducible antes/después con base fija                                                             |
| `tests/functional.cjs`, `tests/pdf-feedback.cjs`                          | Expectativas del feedback documental preciso; se mantienen generación/descarga/persistencia                    |
| `tests/premium-ui.cjs`, `tests/saas-ui.cjs`, `tests/saas-performance.cjs` | Guardas de contratos, efecto finito y salida de resultados fuera de evidencia histórica                        |
| Este informe y `docs/qa/final-refinement/`                                | Inventario, puntuaciones, resultados, hashes, logs y capturas                                                  |

Lista exacta de todos los archivos, incluidas imágenes/JSON: [modified-files.txt](qa/final-refinement/modified-files.txt). No se modificaron backend, esquema, secretos, configuración de entorno, rutas o parámetros de WhatsApp. `app.js` sí cambia en presentación; no se afirma que ese archivo completo sea idéntico.

## 7. Evidencia antes/después

- Primera visita: [antes](qa/final-refinement/before/first-run-390.png) / [después](qa/final-refinement/after/first-run-390.png).
- Primera orden: [antes](qa/final-refinement/before/order-first-run-390.png) / [después](qa/final-refinement/after/order-first-run-390.png).
- Cierre de orden: [antes](qa/final-refinement/before/finish-390.png) / [después](qa/final-refinement/after/finish-390.png).
- Solicitar registro: [antes](qa/final-refinement/before/registration-390.png) / [después](qa/final-refinement/after/registration-390.png).
- Escritorio OPS: [antes](qa/final-refinement/before/ops-top-1440.png) / [después](qa/final-refinement/after/ops-top-1440.png).
- Landing móvil: [antes](qa/final-refinement/before/public-top-390.png) / [después](qa/final-refinement/after/public-top-390.png).
- [Resultados completos](qa/final-refinement/results.json), [observaciones reproducidas antes](qa/final-refinement/baseline-observations.json), [comprobaciones nuevas](qa/final-refinement/refinement-results.json), [detector](qa/final-refinement/impeccable-detect.json).

Todas las capturas usan datos ficticios de pruebas; no se insertaron en la base real. Las capturas no demuestran por sí solas persistencia o funcionamiento remoto: eso se distingue expresamente de los fixtures.

## 8. Riesgos, pendientes y último control recomendado

1. **Android real:** probar con el operador a una mano, teclado abierto, reflejos/luz de taller y lector de pantalla; revisar zoom al 200 %. Se verificaron viewport/taps de Chromium, no ergonomía con una persona.
2. **Impresora/compartir:** imprimir una comanda con el equipo real y comprobar márgenes/papel; compartir una nota desde Android y verificarla en el chat destinatario. La web no puede acreditar esos pasos mediante `window.print()` o Web Share.
3. **Servidor:** revisar por separado funciones remotas, RLS, idempotencia/autorización y guardado transaccional con fuentes/esquema real. No ejecutar migraciones ni presentar esa parte como auditada.
4. **Datos reales controlados:** si se autoriza en otra tarea, validar recepción→estado→PDF con una orden claramente identificada de prueba. Esta pasada no hizo escrituras de producción.
5. **Acabado final:** `$impeccable polish` después de las comprobaciones anteriores y de cualquier ajuste aceptado por el usuario. La aceptación estética queda al usuario; la auditoría no la presume.

No hay funcionalidad crítica conocida que se haya desactivado. Permanecen límites preexistentes: lista de 1000 órdenes, ausencia de catálogos/historial maestro, seguimiento público temporal y falta de fuentes del backend remoto. Se conserva el diseño vigente, sin ampliarlo con módulos ficticios. Para recuperar, revertir el commit de esta rama o volver al checkpoint; no hay migraciones que deshacer. **No se desplegó ni se fusionó esta pasada.**
