# Torre Fuerte OPS — auditoría e implementación Unslop

11 de noviembre de 2026 · Rama `feat/ops-unslop-audit` · Base `a9e326f`

## 1. Estado inicial y alcance

Se inspeccionó el código y se abrió el portal en Chromium con Playwright. Las capturas iniciales corresponden al checkpoint anterior a esta intervención. Todos los expedientes, teléfonos y conceptos de las pruebas son ficticios; Supabase está interceptado exclusivamente por los tests. No se modificaron datos reales, políticas, esquema ni funciones remotas.

El portal ya tenía una base útil: navegación lateral, registro de motos, filtros compactos, agenda secundaria, autenticación y documentos separados. Unslop encontró **slop ligero**, concentrado en textos pequeños, tipografía enfática, tonos inconsistentes, espacios y explicaciones repetidas. No había gradientes, glassmorphism, tarjetas KPI ni ilustraciones genéricas que justificaran sustituir toda la composición.

El proyecto es HTML/CSS/JavaScript estático, sin framework, TypeScript, gestor de paquetes de aplicación ni build. OPS vive en `operacion/`; la landing activa está en `index.html`. `styles.css` y `script.js` públicos son legado. Se conservaron las rutas, la landing, `tf-config.js`, `service-lines.mjs`, seguimiento y los contratos existentes.

| Función real                                | Estado encontrado                                                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solicitud pública y WhatsApp                | Implementada: apertura de mensaje y registro paralelo mediante `tf-create-request`; feedback de registro pendiente, no cita confirmada ni prueba de envío por WhatsApp |
| Acceso del personal                         | Implementado: usuario/contraseña, `tf-staff-login`, sesión Supabase y consulta `tf_staff`; sin modo demo de acceso en el producto                                      |
| Órdenes, búsqueda, filtros, estados y notas | Implementados sobre `tf_requests`; lista limitada a los últimos 1000 registros y aviso al alcanzar ese límite                                                          |
| Recepción manual de moto                    | Implementada con cliente, teléfono, moto, servicio y solicitud de fecha/franja; folio devuelto por servidor                                                            |
| Clientes, motocicletas e historial          | Parciales: datos y búsqueda por orden; no existen catálogos independientes ni un expediente unificado por vehículo                                                     |
| Calendario y agenda                         | Implementados; fechas/franjas solicitadas, sin promesa de disponibilidad ni confirmación automática                                                                    |
| Comprobantes                                | Comanda interna de 76 mm sin precios; nota de servicio PDF con precios, descarga y compartir cuando el teléfono lo permite                                             |
| Facturación fiscal, pagos e inventario      | No implementados; no se añadieron menús ni controles que simulen esas funciones                                                                                        |
| Seguimiento público                         | Ruta independiente fuera de esta intervención; no se certificó aquí su contrato remoto                                                                                 |

Dependencias existentes: Supabase JS 2.95.0, Tabulator 6.3.1, Driver 1.10.2, FullCalendar 6.1.19 y pdfmake 0.2.20. Configuración pública en `tf-config.js`; ningún secreto nuevo. La contraseña de pruebas del entorno no se utilizó. No se instaló una dependencia de aplicación.

## 2. Hallazgos iniciales

| Severidad | Pantalla                | Hallazgo e impacto                                                                                                     | Corrección implementada                                                                                                             |
| --------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Alta      | Detalle                 | La impresión estaba después de notas, dos ayudas y explicaciones: botón a 1035 px en móvil de 390 px                   | Comanda junto a identificación; botón a 442 px al abrir                                                                             |
| Media     | Órdenes móvil           | Primera orden a 610 px; acciones secundarias ocupaban espacio antes del trabajo                                        | Cabecera compacta, contador junto a Buscar y CSV después de las motos                                                               |
| Media     | Órdenes y documentos    | Estados de 10 px, metadatos de 11 px y etiquetas espaciadas dificultaban la lectura                                    | Estados de 12 px; metadatos de 12–13 px y contenido de 14–16 px; mayúsculas reservadas a marca/documentos impresos                  |
| Media     | Detalle                 | La moto era otro dato pequeño; el folio encabezaba todo                                                                | Moto a 24 px y folio monoespaciado en cabecera                                                                                      |
| Media     | Detalle                 | Explicación de documentos repetida en ayuda, introducción y dos paneles                                                | Comanda compacta y nota diferenciada; una guía reiniciable y enlace directo a la nota                                               |
| Media     | Calendario móvil        | Mes denso y eventos sin identificación de la moto en el título                                                         | Semana en lista por defecto; moto, cliente y estado escritos; mes disponible                                                        |
| Media     | Inicio OPS              | Se descargaba y construía el calendario aunque solo se usaran órdenes                                                  | Descargar FullCalendar y locale al abrir Calendario; carga, error y reintento explícitos                                            |
| Alta      | Lista con fallo de red  | El error inicial podía dejar el contador en «Cargando»; refrescos fallidos no identificaban la antigüedad de las filas | «Órdenes no disponibles» o «sin actualizar», con reintento; conservar la última lista válida                                        |
| Media     | Edición                 | Confirmación anterior seguía visible tras volver a editar notas/estado                                                 | Indicador de cambios pendientes y retirada del éxito obsoleto                                                                       |
| Media     | Recepción               | Espacios aceptados como nombre/moto/servicio; error de teléfono sin foco y guardado incierto poco explicativo          | Recortar y validar, enfocar el error, impedir envíos simultáneos y orientar a revisar la lista antes de repetir un intento incierto |
| Media     | Formularios             | En la comprobación con altura reducida, campos enfocados quedaban detrás de acciones fijas                             | Reposicionar el campo dentro del área útil del diálogo al enfocar/cambiar el viewport                                               |
| Baja      | Todas las pantallas OPS | Varios verdes/grises, radios, pesos, valores de espacio y símbolos sin sistema común                                   | Tokens compartidos, pesos 400/500/600, controles de 8 px, paneles de 12 px e iconos coherentes                                      |

Los hallazgos visuales se contrastaron con capturas. Los errores de red, validación y foco se reprodujeron con escenarios aislados; no se provocaron en la base real.

## 3. Dirección y cambios implementados

**Producto:** herramienta para recibir y atender motocicletas desde el teléfono del taller. **Carácter:** preciso, directo, humano. **Mundo:** bancada de trabajo, papel claro y tinta carbón; rojo de señal de Torre Fuerte. **Momentos:** identificación de la moto y documentos de su servicio. **Firma:** folio monoespaciado, usado en el registro y la orden.

Se instaló la carpeta oficial completa de [Unslop](../.agents/skills/unslop/SKILL.md), de Damir Sokolovsky (@heydamir), revisión `97daa3eb365670ea3f87ed85356cbfcee18105a5`, con licencia CC BY 4.0 y [procedencia](../.agents/skills/unslop/PROVENANCE.md). No había instalador disponible. Se comprobaron todos los archivos contra esa revisión, se leyeron las instrucciones y referencias y se aplicó su procedimiento directamente; no existe un comando ficticio ejecutado. La petición de autonomía permitió omitir la espera de aprobación estética prevista por la skill.

Las nueve pasadas siguieron este orden, integradas en los archivos existentes:

1. **Espacio:** retícula de 4 px, agrupación por tarea, menos altura antes de la lista y comanda accesible al abrir.
2. **Color:** tres roles de texto y superficies neutras; rojo para acciones/selección, colores semánticos únicamente para estados. Se retiraron tonos verdes decorativos del marco.
3. **Iconos:** actualizar/cerrar de Lucide 0.468.0, locales, 18 px y trazo 1.5; licencia ISC conservada. Sin paquete adicional ni icon font.
4. **Texto:** nombres operativos, sin numeración decorativa, etiquetas gritadas ni explicaciones duplicadas. Comanda, nota y factura siguen siendo conceptos distintos.
5. **Tipo:** fuente nativa para legibilidad, cifras tabulares y pesos 400/500/600. Barlow Condensed 800 se conserva por identidad de marca, no como título de dashboard.
6. **Composición:** motos primero, agenda secundaria; contador junto a búsqueda; CSV al final; ficha centrada en moto, trabajo y documentos. Sin módulos inexistentes.
7. **Detalles:** radios compartidos, cabecera/cierre persistentes, foco visible, borradores protegidos y feedback que distingue error, antigüedad y cambios sin guardar.
8. **Visuales:** contenido real del producto como protagonista; no se añadieron imágenes generadas ni decoración. Se revisaron las referencias de la skill sin copiar su dashboard financiero.
9. **Movimiento:** transiciones breves solo de color/borde; sin entradas, rebotes o bucles. Se conserva `prefers-reduced-motion`.

## 4. Pantallas y archivos

- `operacion/index.html`: acceso, órdenes, calendario, recepción, detalle, documentos y contraseña; estructura y controles accesibles.
- `operacion/style.css`: un único sistema de tokens y componentes; sin un segundo tema superpuesto.
- `operacion/app.js`: jerarquía de datos, carga diferida, estados, validación y manejo de foco; mismos contratos de servidor.
- `operacion/vendor/lucide-LICENSE.txt`: atribución de los dos iconos adaptados.
- `design.md` y `AGENTS.md`: especificación y comandos actualizados.
- `tests/ops-unslop.cjs`, `tests/capture-ops.cjs`, `tests/performance.cjs`: regresiones operativas, evidencia y medición local de OPS.
- `.agents/skills/unslop/` y `docs/qa/unslop/`: skill íntegra y evidencia.

## 5. Resultados de pruebas

| Comprobación ejecutada                                                                          | Resultado                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --check operacion/app.js`, `node --check operacion/service-lines.mjs`, `git diff --check` | Correctos                                                                                                                                          |
| `node --test tests/service-lines.test.mjs`                                                      | 6/6: cálculo, validación, persistencia, conflicto, error y respuesta parcial                                                                       |
| `node tests/functional.cjs`                                                                     | 24/24: acceso aislado, órdenes, notas, PDF real, comanda, CSV, tutorial y formulario público                                                       |
| `node tests/ux-audit.cjs`                                                                       | 10/10: teclado, objetivos táctiles, tablet, filtros, borradores y validación                                                                       |
| `node tests/ops-unslop.cjs`                                                                     | 11/11: comparación con checkpoint, documentos, calendario, desconexión, carga fallida, validación, foco y seguridad de texto/CSV                   |
| `node tests/pdf-feedback.cjs`                                                                   | Correcto: descarga tras fallo simulado y sin UPDATE redundante de conceptos sin cambios                                                            |
| `node tests/browser.cjs`                                                                        | Landing y OPS en 320/375/390/430/768/1280/1440 px: sin scroll horizontal accidental ni errores JavaScript                                          |
| Axe 4.10.3, WCAG 2 A/AA y 2.1 AA                                                                | 0 infracciones detectadas en 6 superficies: landing móvil, OPS móvil, detalle, tabla escritorio, calendario y acceso con SDK real                  |
| `TF_PHASE=after node tests/capture-ops.cjs`                                                     | Capturas finales de listas en siete anchos y pantallas principales; datos ficticios                                                                |
| `node tests/performance.cjs`                                                                    | Portal: LCP observado 0.80 s, CLS 0.0305, DOMContentLoaded 1.16 s; calendario y PDF ausentes en carga inicial; PDF diferido generado correctamente |

Las cifras de rendimiento son **una muestra local** en Chromium, 390×844, CPU 4×, 200000 B/s y 150 ms de latencia configurados. Supabase está aislado y las dependencias CDN se transportan mediante el fixture verificado: no representan el tiempo de respuesta de producción ni certifican rendimiento en Android físico. La landing, sin cambios, dio LCP 1.66 s y CLS 0.0570 en esa misma ejecución. [JSON de OPS](qa/unslop/performance-ops.json).

Medición geométrica reproducible con los mismos cuatro registros y viewport de 844 px de alto; coordenadas desde el borde superior, sin desplazar antes de medir:

| Ancho | Primera orden antes → después | Botón imprimir antes → después |
| ----- | ----------------------------- | ------------------------------ |
| 320   | 623 → 468 px                  | 1098 → 464 px                  |
| 375   | 610 → 474 px                  | 1035 → 442 px                  |
| 390   | 610 → 463 px                  | 1035 → 442 px                  |
| 430   | 610 → 453 px                  | 1015 → 442 px                  |

Son mediciones comprobadas, no estimaciones de productividad. La altura reducida de 500 px comprueba campos fuera de las barras fijas; no sustituye una prueba con teclado Android físico. No hay comandos de lint/typecheck/build propios de esta aplicación estática; se verificó sintaxis, formato y ejecución en navegador.

Evidencia: [resultados y hashes del código](qa/unslop/results.json), [geometría](qa/unslop/geometry.json), [accesibilidad](qa/unslop/accessibility.json). Tres rondas de revisión visual: inicial, implementación y corrección final; cada ronda incluye los anchos requeridos.

## 6. Funciones verificadas

En navegador con backend aislado: acceso con rol, búsqueda de cliente/moto/folio, filtros y recuperación, recepción manual con folio de respuesta, cambio de estado, notas y protección del borrador; cálculo/lectura/errores de conceptos; generación de PDF real sin notas internas; comanda de 76 mm sin precios; descarga alternativa a compartir; calendario y tutorial por teclado. Se comprobaron texto no ejecutable en datos del cliente y neutralización de fórmulas CSV.

La solicitud pública conserva consentimiento, idempotency key para reintentos del mismo contenido, registro paralelo y apertura de WhatsApp sin envío real. El fallo de registro muestra su incertidumbre y mantiene la vía de contacto. Se comprobó con fixture, sin tocar la landing: abrir WhatsApp no se interpreta como mensaje enviado ni como cita confirmada.

## 7. Funciones no verificadas

No se iniciaron sesiones reales ni se hicieron guardados contra el Supabase del taller en esta entrega. La carga del SDK real y la pantalla sin sesión sí se comprobaron. No se inspeccionaron las políticas RLS ni el código remoto de Edge Functions porque sus fuentes no están en este repositorio. No se probaron impresora física, WhatsApp instalado, selector nativo de compartir, Android físico ni una auditoría completa con lector de pantalla. No se validó fiscalmente la nota: sigue sin ser factura.

El sitio publicado no se cambió ni se certificó por navegador: el dominio de GitHub Pages está bloqueado por la política de red de este entorno. La evidencia proviene del servidor local con el código de la rama.

## 8. Riesgos pendientes

1. **Guardado REST de conceptos no transaccional.** Se conservan comprobaciones de conflicto y lectura posterior, y bloqueo tras resultado incierto. Persisten ventanas de concurrencia; una solución atómica exige revisar esquema y función de servidor. No se inventó una migración.
2. **Duplicados tras respuesta de red incierta.** El alta manual bloquea envíos simultáneos y pide revisar la lista antes de repetir. La idempotencia pública del cliente no demuestra deduplicación en servidor. Hace falta verificar constraints y contratos remotos; no se garantiza deduplicación global desde el frontend.
3. **Lista limitada a 1000 órdenes.** La búsqueda y los contadores operan sobre esa ventana. El aviso existente se mantiene; un historial completo requiere paginación/búsqueda del servidor.
4. **Dependencias CDN y conectividad.** Calendario/PDF son diferidos; Tabulator y tutorial siguen entrando con OPS. Hay errores y reintento, no una cola de guardado offline ni garantía sin internet.
5. **Datos por orden.** No existe identificador de vehículo ni catálogo de clientes; no se promete un historial consolidado por persona o moto.
6. **Mantenibilidad.** `app.js` sigue concentrando acceso, lista, calendario y documentos en un módulo grande. Se depuró el sistema CSS y se conservó el módulo probado de conceptos; separar más responsabilidades queda para una intervención acotada, sin reescribir la arquitectura por estética.

## 9. Reauditoría y siguientes mejoras

Se retiraron las etiquetas operativas espaciadas, redujo la repetición de paneles/ayudas, unificaron tokens y aumentó la lectura táctil. La moto y sus documentos tienen jerarquía propia. Se mantiene la marca y la estructura útil anterior: no se sustituyó una plantilla por otra ni se añadieron métricas, fotos o módulos ficticios. La aceptación estética final sigue correspondiendo al usuario.

Siguientes pasos recomendados: probar el flujo con teclado e impresora del taller; revisar fuentes/RLS e idempotencia con una base aislada; después valorar búsqueda de historial en servidor y diferir Tabulator en móvil. Cada mejora requiere evidencia o contrato real antes de implementarse.

Para revisar ahora: [comparador de capturas](qa/unslop/review.html), [antes móvil](qa/unslop/before/orders-390.png), [después móvil](qa/unslop/after/orders-390.png), [escritorio](qa/unslop/after/orders-1440.png), [detalle](qa/unslop/after/detail-390.png) y [nota con concepto ficticio](qa/unslop/after/note-example-390.png). Las capturas completas de diálogos incluyen la página de fondo fuera del viewport; la franja inicial muestra el área real visible.

Para probar el código: arrancar `python3 -m http.server 8000 --bind 127.0.0.1` desde la raíz y abrir `/operacion/`. El producto requiere una sesión real; solo los comandos de pruebas inyectan fixtures. Esta entrega no hace merge ni deploy. El checkpoint `a9e326f` y el tag local `checkpoint/ops-antes-unslop-20261111` permiten comparar o preparar una reversión en rama, sin resetear datos.
