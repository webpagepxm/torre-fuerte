# Operación: registro de trabajo

Revisión del 11 de noviembre de 2026. Base: main, merge 162c187cce48797a2e7e9181946d3f6b4ecb33d2; checkpoint local checkpoint/operacion-antes-mesa-20261111. Rama design/operacion-mesa-de-trabajo. El usuario autorizó publicar esta propuesta después de la auditoría UX/diseño; ver [AUDITORIA.md](AUDITORIA.md).

La versión publicada dedicaba la primera pantalla a un titular de campaña, cuatro tarjetas iguales y una agenda incluso sin citas. La nueva composición adelanta las órdenes, separa navegación y acciones, da prioridad a la motocicleta y reúne los estados en filtros compactos. La agenda pasa a una columna secundaria. En móvil, la búsqueda permanece visible y los otros filtros se abren bajo demanda. El acceso, los diálogos, documentos, contratos y operaciones de Supabase se conservan. La landing no se modifica.

| Escena | Escritorio | Móvil |
| --- | --- | --- |
| Antes | [1440 px](before-1440.png) | [390 px](before-390.png) |
| Órdenes y agenda | [1440 px](active-1440.png) | [390 px](active-390.png) |
| Dos órdenes y agenda vacía | [1440 px](quiet-1440.png) | [390 px](quiet-390.png) |
| Sin órdenes | [1440 px](empty-1440.png) | [390 px](empty-390.png) |

Capturas con datos ficticios y transporte Supabase interceptado; no se han leído ni modificado órdenes de la base real para esta tarea visual. Se inspeccionaron las capturas en móvil y escritorio y se corrigió un desbordamiento del encabezado a 320 px.

Validación ejecutada: las dos superficies a 320, 375, 390, 430, 768, 1280 y 1440 px sin scroll horizontal ni errores JS; 24 comprobaciones funcionales de navegador aprobadas, incluidos teclado, órdenes, filtros, tutorial, calendario, PDF e impresión. Axe 4.10.3 no reportó infracciones en sus seis estados comprobados: ver accessibility.json. No equivale a prueba con Android físico o lector de pantalla.

La aprobación estética queda abierta a revisión del usuario en la web publicada. No se declara «anti-slop» por instalar una skill o aprobar tests. La auditoría posterior añadió protección de borradores, validación guiada y mejoras de acceso móvil; ver AUDITORIA.md.
