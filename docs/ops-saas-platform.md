# OPS · identidad SaaS y shader

11 de noviembre de 2026. Base `e9578bc13ffcedd3e1670178d3d5f7a361583ef0`; rama `design/ops-saas-platform`. Dirección solicitada: materiales claros y paleta inspirada en la referencia de monday.com, distinta del sitio público, conservando familias y tamaños de letra.

## Cambio visible

La barra lateral carbón y el rojo compartido hacían que el portal siguiera pareciendo una extensión de la landing. Los efectos previos se limitaban al hover y las aperturas, sin un gesto visible en uso normal. El acceso y los documentos conservaban la misma estética oscura.

OPS ahora tiene barra superior blanca, navegación lavanda con iconos, selección azul, acciones azul/violeta y estados semánticos ámbar/azul/violeta/verde. Tabla, acceso y diálogos comparten superficies claras y profundidad suave. Mantiene la lista al frente y la agenda secundaria; no incorpora módulos de IA ni funciones ficticias. La landing conserva sus archivos y paleta.

Foco visual: halo cian/violeta animado en búsqueda y acceso. `atmosphere.js` contiene un shader WebGL de borde redondeado, sin biblioteca, red ni acceso a datos. La navegación entre vistas tiene una transición breve; las acciones siguen siendo inmediatas. El shader se pausa al abrir un diálogo, salir de pantalla, ocultar el documento, activar movimiento reducido o pulsar Efectos. La preferencia de pausa se conserva. WebGL ausente o perdido deja un halo CSS estático. La tipografía existente no cambia.

## Verificación ejecutada

- **68 comprobaciones aprobadas:** 6 de conceptos, 24 funcionales, 10 UX, 11 de auditoría anterior, 7 de refinamiento y 10 específicas del nuevo efecto. Además, regresión PDF aprobada.
- Landing y OPS comprobados a 320, 375, 390, 430, 768, 1280 y 1440 px; sin desbordamiento ni errores JS en los flujos probados. Capturas OPS comparables antes/después con datos ficticios.
- Axe: cero infracciones detectadas en seis superficies; teclado, foco, filtros, Cuenta, tutorial y protección de borradores comprobados. No equivale a una auditoría completa con lector de pantalla.
- WebGL compilado y dibujado realmente con ANGLE/SwiftShader: píxeles distintos entre cuadros, error gráfico 0, raster acotado, pausa/reanudación, pérdida de contexto y fallback. Política de pestaña oculta probada mediante evento de visibilidad simulado; no confundir con prueba de dispositivo físico.
- Familias/tamaños conservados: cuerpo 15 px, título escritorio 32 px, búsqueda escritorio 14 px y familia Barlow en marca; el CSS mantiene los tamaños móviles previos. Bordes de campos `#8690aa` sobre blanco: contraste 3.19:1; acción azul 5.54:1 y extremo violeta 6.06:1 con texto blanco.
- PDF generado realmente, carga diferida de PDF/calendario, comanda interna de 76 mm sin precios y notas privadas excluidas del PDF del cliente. Autenticación, persistencia, WhatsApp y validaciones sin cambios; cero escrituras reales en Supabase.
- Comparación byte por byte de `index.html`, estilos compartidos, `operacion/app.js`, `service-lines.mjs` y `tf-config.js` contra la base. Los scripts de negocio y el sitio público permanecen idénticos.
- `node --check` de ambos módulos y `git diff --check` correctos.

## Rendimiento y detector

Una muestra local, Chromium 390×844, CPU 4×, latencia 150 ms y 200000 B/s, backend aislado/CDN transportado por fixture: OPS LCP observado 0.888 s y CLS 0.0048 con movimiento reducido. La landing intacta: LCP 1.636 s y CLS 0. Con shader activo y ANGLE/SwiftShader, 24 dibujos en 2 segundos (12 FPS), raster 372×124, ninguna tarea larga registrada durante esa muestra y 8 ms desde input al siguiente cuadro. No son resultados de Android físico ni del servidor real.

Límites del shader: 18 FPS escritorio/12 móvil, máximo 640×220, sin multiplicar por DPR. Solo procesa la región visible. El módulo pesa menos de 8 KB sin compresión y no incorpora dependencias. Los documentos y calendario siguen cargando cuando se necesitan.

Impeccable se ejecutó una vez al finalizar: una advertencia de `cramped-padding` en Agenda. Revisada como falso positivo al combinar breakpoints: en escritorio hay 24 px de separación con el borde izquierdo; en móvil ese borde se elimina y se conserva el espaciado superior. No se añadieron ignores. La referencia del usuario determina el halo y la nueva paleta; las restricciones históricas de carbón/rojo y ausencia de shader ya no aplican a OPS. `DESIGN.md` y `AGENTS.md` recogen la dirección vigente.

## Evidencia y recuperación

[Escritorio con shader](qa/saas/shader-1440.png) · [Móvil con shader](qa/saas/shader-390.png) · [Acceso sin WebGL](qa/saas/login-fallback-320.png) · [Detalle de orden](qa/saas/after/order-390.png).

[Antes escritorio](qa/saas/before/ops-top-1440.png) · [Después escritorio](qa/saas/after/ops-top-1440.png) · [Antes móvil](qa/saas/before/ops-top-390.png) · [Después móvil](qa/saas/after/ops-top-390.png).

[Resultados y hashes](qa/saas/results.json) · [Shader](qa/saas/shader-results.json) · [Accesibilidad](qa/saas/accessibility.json) · [Rendimiento activo](qa/saas/performance-active.json) · [Detector](qa/saas/impeccable-detect.json).

Reproducir: comandos de `AGENTS.md`, `node tests/saas-ui.cjs`, `node tests/saas-performance.cjs` y `TF_PHASE=after node tests/capture-saas.cjs`. El modo `before` usa el checkpoint. La validación visual es técnica; la aceptación estética queda al usuario al verlo publicado. Para recuperar la versión anterior, revertir el commit de esta tarea mediante PR; la etiqueta local `checkpoint/ops-antes-saas-20261111` conserva la base. No hay migraciones ni cambios de esquema.
