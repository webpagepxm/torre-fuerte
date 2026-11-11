# Torre Fuerte · refinamiento visual e interacción

11 de noviembre de 2026 · base `090dd00` · rama `design/premium-refinement`.

## Producto y alcance

Refinamiento del sitio público y OPS existentes, sin reconstrucción. `PRODUCT.md` documenta capacidades y límites reales; `DESIGN.md` es la especificación visual canónica y `design.md` conserva las referencias anteriores.

El sitio público conserva cita, registro y consulta por WhatsApp. Solo la cita se registra paralelamente mediante la Edge Function existente. Abrir WhatsApp no implica mensaje enviado ni cita confirmada. `/seguimiento/` sigue siendo una presentación temporal, no un portal conectado. Slider Bros es un producto independiente y se conservó íntegro. No se encontró un flujo activo de QR de órdenes que hubiera que modificar.

## Skills y método

Se revisaron las skills instaladas antes de incorporar nuevas. Se copiaron los paquetes oficiales compatibles con Codex, conservando fuentes y licencias; no se ejecutaron instaladores sin revisar. [Revisiones exactas](qa/premium/skills.json).

- **Impeccable 4.8.2:** guías `polish`, `animate`, `operate`, `audit` y `craft-floor`. Se ejecutaron realmente `impeccable context --target index.html` y el detector sobre ambas entradas HTML. El motor 0.1.22 se verificó contra su manifiesto oficial; caché fuera del proyecto. Instalación manual oficial, sin hooks automáticos; detector ejecutado manualmente.
- **Taste / redesign-existing-projects:** auditoría dirigida sobre el stack existente. La identidad y la operación del taller prevalecen sobre sugerencias genéricas de cambiar fuentes, añadir ruido o sustituir componentes.
- **pick-ui-library:** evaluación de necesidades y dependencias existentes. No hacía falta una biblioteca nueva; las transiciones simples quedan en CSS nativo.
- **transitions.dev:** transición gratuita `learn-more-hover` aplicada a enlaces de servicios, CSS original con tiempos ajustados mediante sus variables y protección de movimiento reducido. Se conservan licencia y atribución. No se redistribuye como biblioteca competidora ni se usaron funciones de pago.
- **Vercel Web Design Guidelines:** reglas obtenidas de la fuente oficial y revisión de dimensiones de imágenes, teclado, foco, targets, estados y rendimiento.

## Hallazgos y cambios

| Prioridad | Hallazgo comprobado                                                               | Cambio                                                                                                         |
| --------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P2        | Etiquetas pequeñas, placeholders claros y textos de formulario con demasiado peso | Etiquetas de 14 px, campos de 16 px/peso 400, placeholder `#676d72`, bordes identificables y foco rojo visible |
| P2        | Navegación comprimida en tablet                                                   | Menú colapsado hasta 1020 px; mismas rutas, botones y cierre por Escape                                        |
| P2        | Respuesta de controles limitada a cambio de color                                 | Presión de 120 ms, reflejo breve en CTA, flecha reactiva y aperturas discretas de menús/diálogos               |
| P2        | Texto incrustado en la ilustración original visible detrás de la portada          | Recorte de imagen al 125%, centrado arriba; archivo original conservado y naturaleza ilustrativa identificada  |
| P3        | Numeración y etiquetas decorativas repetidas                                      | Retiradas de servicios y trámites; titulares, contenido útil y acciones conservados                            |
| P3        | Estados de órdenes poco diferenciados y acción Abrir plana                        | Fondos semánticos con texto, moto con mayor peso y acción Abrir consistente con móvil                          |
| P3        | Duplicación de tiempos, bordes y respuestas visuales                              | `assets/ui-interactions.css` compartido; tokens de movimiento, selección/caret y estados de control            |

La portada tiene un reflejo blanco localizado sobre la imagen existente. Solo responde a hover con puntero fino; es estático con movimiento reducido. No hay WebGL, Three.js, animaciones decorativas continuas ni biblioteca nueva. En OPS, la animación representa apertura, carga y resultado: no retrasa acciones ni altera el cierre nativo. El indicador de Actualizar gira únicamente mientras la consulta está ocupada.

## Verificación

- **58 comprobaciones aprobadas:** 6 de conceptos, 24 funcionales, 10 de UX, 11 de la auditoría anterior y 7 nuevas de refinamiento. Regresión PDF correcta.
- Landing y OPS a **320, 375, 390, 430, 768, 1280 y 1440 px**, sin desbordamiento horizontal ni errores JavaScript en los flujos probados.
- Axe: **0 infracciones detectadas en seis superficies**. Esto no equivale a auditoría completa con lector de pantalla.
- Pruebas con movimiento normal y reducido: presión, navegación, flechas, menús, foco, carga y cierre inmediato del diálogo; sin escrituras decorativas.
- `tests/premium-ui.cjs` comprueba identidad de scripts públicos, URLs existentes, nombres/validaciones de formularios y archivos de negocio contra el checkpoint. Los mensajes y parámetros de WhatsApp, autenticación, endpoints y persistencia permanecen intactos.
- PDF real generado, comanda de 76 mm separada y sin precios, notas internas excluidas de la nota del cliente. Sin datos reales modificados.
- Rendimiento local: portada LCP observado **1.66 s**, CLS **0.0705**; OPS LCP **0.86 s**, CLS **0.0305**. Una muestra Chromium 390×844, CPU 4×, latencia 150 ms y 200000 B/s; backend aislado y CDN transportado por fixture. No son resultados de Android físico ni medición del servidor real. Calendario/PDF siguen diferidos.

[Resultados y hashes](qa/premium/results.json) · [Accesibilidad](qa/premium/accessibility.json) · [Interacciones](qa/premium/interaction-checks.json).

## Detector y revisión manual

El detector se ejecutó una vez al finalizar la implementación: [salida original](qa/premium/impeccable-detect.json), código 2 por señales de revisión, no por fallo de ejecución. Sus siete señales se contrastaron con navegador: cinco se atendieron (texto pequeño y acento grueso de acceso), dos eran falsos positivos del análisis estático al combinar breakpoints. En escritorio, marca/agenda tienen 32/24 px de separación junto al borde; en móvil ese borde desaparece. No se añadieron ignores para ocultar hallazgos.

La evaluación técnica según las cinco dimensiones de la guía Impeccable es 16/20: accesibilidad 3, rendimiento 3, tokens 3, responsive 3 e integridad 4. Es un juicio acotado a esta evidencia, no una puntuación automática ni certificación. Quedan fuera pruebas físicas y las fuentes remotas del backend.

## Capturas y límites

[Antes, móvil](qa/premium/before/public-390.png) · [Después, móvil](qa/premium/after/public-top-390.png) · [Portada escritorio](qa/premium/after/public-top-1440.png) · [OPS escritorio](qa/premium/after/ops-top-1440.png). La carpeta contiene capturas de los siete anchos, formulario y orden con datos ficticios.

No se verificaron Android físico, impresora, selector nativo de compartir ni políticas RLS remotas. Se conservan los riesgos ya documentados de guardado REST no atómico, deduplicación de servidor no verificada y búsqueda limitada a 1000 órdenes. No hubo migraciones, cambios de esquema ni un modo demo dentro del producto.
