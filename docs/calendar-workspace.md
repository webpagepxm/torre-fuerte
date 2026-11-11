# Calendario · rediseño integrado en OPS

Base publicada `6b41f404dedc3adbdbbf5b5f4f4ec0c6d816a20d` · rama `design/calendar-workspace` · noviembre de 2026.

El calendario conservaba la composición predeterminada de FullCalendar: barra oscura, título duplicado, cuadrícula plana y títulos de eventos concatenados/recortados. La pasada anterior solo había unificado los colores. Esta intervención cambia la composición de la vista y la consulta del día, manteniendo el motor, los registros y las funciones del taller.

## Cambio visible y de uso

- Barra propia con periodo, cantidad real de órdenes, anterior/siguiente, Hoy y Mes/Agenda. Superficies blancas/lavanda y selección azul coherentes con OPS.
- En escritorio, mes con días seleccionables y panel de detalle para la fecha elegida. La moto y el estado se leen en líneas separadas, sobre fondos semánticos suaves. El panel muestra folio, cliente, moto y franja; cada registro abre la orden existente.
- La agenda general de hoy se retira del calendario para evitar duplicar información. Se conserva intacta en la vista Órdenes.
- Agenda semanal como inicio móvil: moto, cliente, servicio, estado y franja legibles, con un solo control de apertura por registro. No se inventan horas confirmadas.
- El mes móvil muestra fechas y cantidades a todo el ancho; el detalle queda debajo. Esto permite siete fechas de al menos 44 px incluso a 320 px. Se puede volver a Agenda con el selector.
- Fechas con foco único, flechas y Home/End. Más órdenes funciona con teclado y tiene cierre enfocable/Escape. Transición de 180 ms al cambiar periodo, sin retrasar la acción y respetando movimiento reducido.
- Los fallos de datos o de biblioteca se explican y permiten Actualizar; no se presentan como un calendario vacío.

## Integridad

FullCalendar 6.1.19 continúa cargándose solo al abrir la vista. No hay dependencias nuevas, edición por arrastre, reservas automáticas, nuevas peticiones de escritura ni cambios en fecha/franja. Canceladas siguen excluidas del calendario. Todos los textos de cliente se insertan como texto.

Se preservaron las 16 funciones operativas y cuatro consultas directas protegidas por `tests/contracts.cjs`. Landing, shader, persistencia de conceptos, configuración y documentos permanecen iguales a la base. Los cambios de producción están en `operacion/index.html`, `style.css` y la presentación del calendario en `app.js`.

`tests/final-refinement.cjs` ahora contrasta la tinta semántica de eventos sobre fondo suave y guarda resultados temporales; no sobrescribe la evidencia histórica. Los scripts nuevos de captura/prueba documentan esta vista. El sistema se registra en `DESIGN.md` y `AGENTS.md`.

## Verificación ejecutada

- **98 comprobaciones aprobadas**: las 84 de las suites existentes y 14 específicas de calendario. Regresión PDF aprobada, generación PDF real y comanda de 76 mm preservadas.
- Mes y Agenda probados a **320, 375, 390, 430, 768, 1280 y 1440 px**. Sin desbordamiento horizontal; fechas y controles conservan objetivos de 44 px.
- Selección de día, resumen/vacío correcto, navegación, Hoy, apertura de orden única, teclado, más órdenes, recuperación ante fallos y datos HTML tratados como texto. Sin errores JavaScript en los escenarios aprobados ni escrituras reales de Supabase.
- Axe sin infracciones detectadas en las cuatro superficies nuevas: mes/agenda de escritorio y móvil. También pasan las seis superficies funcionales habituales. Esto no certifica accesibilidad completa ni prueba Android físico.
- Taps sintetizados en Chromium a 320 px abren una orden desde Agenda y seleccionan una fecha en Mes. No se probó una impresora o dispositivo físico durante esta pasada.
- `node --check`, comprobación de contratos, formato y `git diff --check` correctos. La aplicación es estática; no hay build de framework que ejecutar.

Durante QA se corrigieron el color de texto que FullCalendar fijaba en blanco y los atributos/teclado de Más órdenes. Los controles nuevos respetan los estados reales de carga y error. El detector de Impeccable se ejecutó una vez y solo señaló la advertencia histórica de padding en `day-agenda`; se conserva la comprobación visual previa: padding izquierdo de 24 px en escritorio y borde izquierdo retirado en móvil. Esa agenda queda oculta cuando está abierto el calendario. No se añadieron ignores.

## Rendimiento y límites

Una muestra local, Chromium 390×844, CPU 4×, latencia 150 ms y 200000 B/s: Agenda se dibujó **328 ms** después del clic. Cuatro órdenes visibles, sin overflow y sin cargar pdfmake. Backend/CDN se transportan mediante fixtures: no es medición del servidor publicado ni de Android físico. El movimiento del calendario es finito, sin shader o bucle adicional.

## Evidencia

- Escritorio: [antes](qa/calendar/before/calendar-1440.png) · [después](qa/calendar/after/calendar-1440.png).
- Agenda móvil: [antes](qa/calendar/before/calendar-390.png) · [después](qa/calendar/after/calendar-390.png).
- Mes móvil: [antes](qa/calendar/before/month-390.png) · [después](qa/calendar/after/month-390.png).
- [Pruebas y geometría](qa/calendar/results.json) · [resumen de suites y hashes](qa/calendar/verification.json) · [rendimiento](qa/calendar/performance.json) · [detector](qa/calendar/impeccable-detect.json).

Las capturas contienen datos ficticios aislados; no registros de clientes. Reproducir con `node tests/calendar-ui.cjs`, `node tests/calendar-performance.cjs` y `TF_PHASE=before|after node tests/capture-calendar.cjs`. Recuperación: revertir el commit de esta rama; checkpoint `checkpoint/antes-calendario-20261111`. No hay migraciones que deshacer.
