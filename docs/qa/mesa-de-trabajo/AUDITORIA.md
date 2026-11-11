# Auditoría propia de UX y diseño — Operación

11 de noviembre de 2026. Alcance: portal de operación y acceso. El usuario autorizó auditar, corregir y publicar para revisar después la apariencia en la web real. Base de esta revisión: propuesta de PR #3, ceb1ae0. La landing no se rediseña en esta iteración.

## Skills y método

Skill de diseño instalada y aplicada: [.agents/skills/direccion-visual/SKILL.md](../../../.agents/skills/direccion-visual/SKILL.md), junto con AGENTS.md y design.md. Se comprobó el catálogo del entorno: no hay otras skills de diseño de ejecutor disponibles; no se atribuye uso a una skill externa ausente. La habilidad cloud-environment-runtime guía las pruebas de navegador y el uso del entorno, no determina el estilo.

Se revisaron jerarquía, información visible, navegación, filtros, formularios, prevención de pérdida de datos, documentos, teclado, objetivos táctiles y estados vacíos/error. Se usaron capturas reales y recorridos en Chromium. Es una auditoría del propio autor, no una evaluación independiente ni una puntuación estética certificada.

## Hallazgos y correcciones

| Prioridad | Hallazgo | Corrección y evidencia |
| --- | --- | --- |
| Alta | El botón Entrar quedaba debajo de la primera pantalla a 320×667. | Formulario primero en móvil; introducción de marca solo en escritorio. Borde inferior del botón: aproximadamente 776 px antes y 513 px después, medido en el navegador. Ver login-before-320.png y login-after-320.png. |
| Alta | Tabulator podía ocultar Abrir al ajustar columnas en tablet. | Folio, moto y acción tienen prioridad de visibilidad. Abrir probado efectivamente a 768, 900, 1024, 1280 y 1440 px. |
| Alta | Las notas y el estado podían descartarse al cerrar sin guardar. | Confirmación únicamente cuando hay cambios y bloqueo durante guardado. Se comprobó conservar y descartar conscientemente el borrador, con botón y Escape. |
| Alta | Una nueva orden con campos escritos podía cerrarse por accidente. | Protección de borrador con salida sin confirmación si no hay datos. Validada en el navegador. |
| Alta | Borrar un precio se interpretaba como cero. | El campo vacío queda pendiente e impide guardar. El precio cero explícito sigue permitido. Ningún total incompleto se muestra como importe válido. |
| Media | El error por descripción incompleta no llevaba al campo que faltaba. | Campos requeridos, límites y teclado decimal; foco en el primer campo inválido. Al añadir concepto se enfoca la descripción y al quitar se preserva un destino de foco útil. |
| Media | El panel de filtros podía estar cerrado y ocultar la causa de no encontrar órdenes. | Contador de filtros activos y Limpiar disponible aun con el panel cerrado. Se comprobaron estado, fecha, cero coincidencias y recuperación. |
| Media | El calendario mantenía el título y filtros de órdenes. | Título contextual y filtros visibles solo en la vista de órdenes. Teclado de pestañas conservado. |
| Media | Resúmenes, titulares y agenda relegaban el trabajo a un segundo plano. | Registro de motos protagonista, estados compactos, navegación lateral en escritorio y agenda secundaria. Se retiran título repetido y frase introductoria de la pantalla de trabajo. |
| Media | Algunos controles medían menos de 44 px y Cuenta no cerraba por Escape. | Mínimos táctiles corregidos, Cuenta cierra con teclado/clic exterior y conserva foco. Las acciones principales se midieron a 320 px. |
| Baja | Esperas de actualizar/guardar tenían poco feedback. | Texto de acción en curso y aria-busy; errores de dependencias/permisos redactados para el usuario del taller. |
| Baja | El navegador podía conservar archivos visuales de la versión anterior. | CSS, módulo principal y módulo de conceptos usan una versión explícita en sus URLs. |

## Dirección visual aplicada

La mesa de trabajo toma como unidad la motocicleta y su folio. Se conserva emblema, carbón y rojo de Torre Fuerte; el rojo se concentra en la acción de recibir una moto y la selección. Los titulares de operación son funcionales, los folios usan monoespaciada y la moto tiene mayor peso que los datos secundarios. No hay tarjetas de KPI repetidas, fotografías de relleno, porcentajes inventados ni mensajes de agenda vacía ocupando el ancho principal.

Se inspeccionaron escritorio/móvil, cuatro órdenes, dos órdenes sin agenda y ausencia de órdenes. La apariencia sigue abierta a la valoración del usuario. Las capturas muestran datos ficticios, no clientes reales.

## Validación ejecutada

- `node tests/functional.cjs`: 24 comprobaciones aprobadas, incluida generación real de PDF, comanda de 76 mm, calendario, CSV, órdenes, búsqueda, filtros, tutorial y errores.
- `node tests/ux-audit.cjs`: 10 comprobaciones adicionales aprobadas. Incluyen nueve pasos del tour completos a 320 px sin cambios de datos.
- `node tests/pdf-feedback.cjs`: regresión PDF aprobada.
- `node --test tests/service-lines.test.mjs`: 6 pruebas aprobadas.
- `node tests/browser.cjs`: landing y portal a 320, 375, 390, 430, 768, 1280 y 1440 px sin desbordamiento horizontal ni errores JS.
- Axe 4.10.3: sin infracciones reportadas en las seis superficies/estados ejercitados; resultados en accessibility.json. No equivale a auditoría con TalkBack ni conformidad completa.
- Sintaxis y `git diff --check`: aprobados. Sin dependencias nuevas de aplicación ni cambios de esquema/base.

Las pruebas de datos usan el fixture de Supabase; no se escribieron registros en el proyecto real para esta auditoría visual. La limitación previa de autenticación del runner sigue documentada en ../LIVE-TEST.md y no se presenta como resuelta. La generación PDF sí se ejecutó con la biblioteca real y datos ficticios. Pendientes: Android físico, teclado/lector de pantalla reales, impresora térmica y la valoración visual del usuario en el sitio publicado.

## Publicación

El usuario pidió expresamente publicar después de esta auditoría. PR #3 contiene la propuesta y las correcciones verificadas. Se comprobará el estado de GitHub Pages y el commit desplegado antes de anunciar la publicación. No se da por publicada únicamente por subir una rama.
