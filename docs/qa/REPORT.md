# Torre Fuerte — entrega y verificación

Fecha: 10 de noviembre de 2026, America/Mexico_City. Base y checkpoint: `95ed05bf424ea5089fd02b55b638e5405e2ed506`, tag local `checkpoint/antes-experiencia-premium-20261110`. Rama: `feat/operacion-experiencia-premium`. Sin cambios ni escrituras de prueba en producción.

## Resultado implementado

- Portal: jornada con tipografía de marca, contadores que filtran por estado, solicitudes de hoy, fichas móviles con Abrir visible, tabla de escritorio y calendario accesibles. Cuenta agrupada y ayuda reiniciable. No se muestran métricas inventadas.
- Desglose: limpieza al cambiar de orden, bloqueo durante carga/guardado, validación, detección de cambios previos de otra sesión, escritura antes de eliminación, confirmación de filas afectadas y lectura posterior. Un fallo conserva el borrador visible y bloquea PDF y reintentos a ciegas. Mensajes específicos para permisos, esquema y datos rechazados.
- Cálculo en centavos con redondeo por concepto, compartido por interfaz y PDF. Protección frente a entradas no finitas, negativas, exceso de decimales e importes fuera de rango seguro.
- Documentos separados: comanda interna sin precios a 76 mm y nota A4 con conceptos, cantidades, precios y total. **El PDF ya no incorpora notas internas.** Generación real con pdfmake, carga diferida y alternativa de descarga cuando Web Share no existe.
- Landing: hero editorial carbón con fotografía protagonista, servicios numerados, banda del oficio con imagen pertinente y más ligera, introducción lateral del formulario en escritorio, perfil de Google sin reseñas ficticias. Se conserva logo, citas, WhatsApp, privacidad y formularios secundarios.
- Registro público con resultado visible, timeout y reutilización de clave idempotente durante 15 minutos incluso tras recargar la pestaña. El caché contiene un digest SHA-256 y metadatos, no nombres ni mensajes. No crea una cita confirmada.
- `AGENTS.md`, `design.md` y skill local ampliados; sin framework nuevo ni dependencias de aplicación añadidas.

## Evidencia ejecutada

| Comprobación | Resultado |
| --- | --- |
| `node --test tests/service-lines.test.mjs` | 6 pruebas aprobadas: validación/cálculo, CRUD, inserción fallida, eliminación sin filas, conflicto y respuesta parcial |
| `node tests/functional.cjs` | 24 comprobaciones aprobadas en Chromium; transporte Supabase aislado por fixture |
| `node tests/browser.cjs` | Landing y portal a 320, 375, 390, 430, 768, 1280 y 1440 px: sin scroll horizontal y sin errores JS |
| Detalle de orden a esos siete anchos | Sin desbordamiento interno |
| Axe 4.10.3, WCAG 2 A/AA y 2.1 AA | Cero infracciones en landing móvil, portal móvil, detalle, tabla de escritorio, calendario y acceso |
| SDK Supabase real desde jsDelivr | Importaciones y pantalla sin sesión comprobadas; backend remoto no ejercitado |
| PDF | Archivo `%PDF-` real generado y texto extraído con `pdftotext`: dos conceptos, $351.00, sin nota interna privada |
| Comanda | Solicitud de impresión ejercitada; regla calculada de 76 mm y ausencia de precios |
| Teclado | Pestañas con flechas/Home, menú con Escape y tutorial reiniciable |
| Sintaxis / espacios | `node --check`, scripts públicos embebidos y `git diff --check` aprobados |

La suite cubre usuario sin correo, cierre de sesión, nueva orden, estado, recuperación del desglose, error RLS, carga fallida al cambiar de moto, conflicto entre sesiones, búsqueda, filtros, CSV, calendario, tutorial, PDF, alternativa de compartir y registro público/WhatsApp. No envía mensajes ni solicitudes a producción. El folio de prueba es devuelto por el fixture: no prueba unicidad del generador remoto.

Las capturas de comparación están en [SCREENSHOTS.md](SCREENSHOTS.md). La base se sirvió desde un archivo del checkpoint, sin modificar el checkout activo. En la captura inicial las fuentes remotas de Google estaban bloqueadas por la política de red; el cambio sirve Barlow localmente. Las fotos secundarias se cargaron antes de capturar. Solo hay datos ficticios. Las capturas no equivalen a una prueba en un Android físico.

## Rendimiento y accesibilidad

Una ejecución local de Chromium a 390×844, CPU limitada 4×, descarga de 200000 B/s y latencia de 150 ms obtuvo **LCP 1.68 s**, **CLS 0.057** y DOMContentLoaded de 0.775 s. Ver [performance.json](performance.json). Es una observación de laboratorio sobre el servidor local, no un resultado de producción ni una distribución de Core Web Vitals. El portal con backend ficticio no se usa para afirmar rendimiento real de Supabase.

Se eliminan peticiones de fuentes de Google, se sirve una sola variante Barlow WOFF2 de 22 KB, se precarga la imagen principal y se mantiene lazy loading de imágenes secundarias. La imagen de pista de ~516 KB se sustituye en mantenimiento por la del mecánico existente de ~132 KB. pdfmake y sus fuentes ya no se descargan al entrar: su carga y generación diferida también se probaron.

Se corrigieron contrastes, nombres de diálogos, navegación de pestañas y semántica de componentes externos. La paginación está fuera del grid; las agrupaciones ARIA de Tabulator se normalizan sin ocultar datos. Los eventos del calendario usan contraste de texto blanco y las flechas decorativas quedan fuera del árbol accesible. Cero infracciones de axe no garantiza conformidad completa: quedan lectura con TalkBack, teclado Android, impresión térmica física y menú nativo de compartir por comprobar.

## Auditoría visual y referencias

| Criterio | Decisión aplicada |
| --- | --- |
| Identidad | Logo existente, Barlow condensada, carbón y rojo; misma firma en las dos superficies |
| Belleza | Fotografía y titulares protagonistas en público; folios y jerarquía operacional en portal |
| Originalidad | Servicios editoriales y agenda diaria contextual; se eliminan los anillos ambiguos y las reseñas de ejemplo |
| Usabilidad | Abrir siempre visible en móvil, estados que filtran, errores dentro del modal |
| Consistencia | Tokens y CSS operativos consolidados, documentos numerados y estados textuales |
| Rendimiento | Fuentes locales, medios secundarios ligeros y PDF bajo demanda |
| Calidad | Capturas, interacción real de navegador, auditoría automatizada y límites documentados |

La rama `design/anti-ai-slop-20261110` se inspeccionó en `f4bea47afefe7dfe2fa3e57286f5fc77cd5cde4d`. Se retiene la idea de servicios editoriales; no se fusiona porque también elimina aviso de privacidad, integración Supabase y actualización automática.

Se evaluó el candidato [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8), versión declarada 2.5.1, README, `skills/taste-skill/SKILL.md` y licencia MIT, sin ejecutar sus scripts. No se puede confirmar que sea la skill del video no adjuntado. No se instala: prescribe starter/pipeline propios, contactos ficticios y estructura por pantallas que no encajan con este producto existente. La skill local conserva la dirección de Torre Fuerte. Awwwards no fue accesible por la red; no se atribuyen referencias visuales no vistas. No se incorpora código de 21st.dev ni componentes de procedencia no comprobada. La fuente local incluye su licencia OFL.

## Límites y bloqueos externos

1. **Causa exacta del fallo reportado en producción:** no confirmada. El usuario habilitó el host Supabase y la red ya responde. Se comprobó sin consultar expedientes que las tablas tf_requests, tf_service_lines y tf_staff rechazan acceso anónimo con HTTP 401; tf_service_lines devuelve código PostgreSQL 42501 (permiso denegado). La clave publicable es aceptada por Auth (HTTP 200) y los endpoints tf-staff-login/tf-create-request responden OPTIONS 204 con el origen público permitido. Esto verifica conectividad y ciertas denegaciones de acceso, no el guardado autenticado ni todas las políticas RLS. El usuario confirmó que el portal está en construcción, sin órdenes reales, y autorizó registros ficticios en ese proyecto. El secreto de acceso ya está aplicado; el runner recibe HTTP 401 al intentar iniciar sesión y no ha creado ninguna orden. Se pidió confirmar el acceso desde el portal antes de repetir intentos. No hay fuentes de Edge Functions/políticas en el repositorio. Se corrigieron defectos reproducibles del cliente, sin afirmar que se haya corregido una restricción desconocida del servidor.
2. **Atomicidad:** la API REST existente no guarda varios conceptos en una transacción. La verificación detecta diferencias y reduce riesgo de pérdida, pero puede haber guardados parciales o una carrera después de leer la versión inicial. Un cierre transaccional requiere revisar el esquema real y una RPC de servidor. No se preparó ni aplicó una migración especulativa.
3. **RLS, autenticación y duplicados de servidor:** pendientes de auditoría real. [rls-audit.sql](rls-audit.sql) contiene consultas de metadatos solo lectura para revisar tablas, políticas, permisos y restricciones. Debe verificarse que anon no pueda leer expedientes, que solo personal autorizado gestione órdenes/conceptos y que las Edge Functions comprueben autorización, rate limit, consentimiento e idempotencia. No se expone service_role.
4. **Teléfono y solicitudes web:** el formulario público actual no captura teléfono. El taller debe acordar los datos que faltan en WhatsApp; no se inventa el número del cliente ni se cambia a ciegas el contrato de `tf-create-request`.
5. **Entorno reutilizable:** servidor local y dependencias existentes comprobados. La lectura del borrador falló dos veces y el guardado de `start_skill` devolvió `INVALID_ARGUMENT`; persistencia no confirmada. Las instrucciones se conservan en [cloud-start.md](../cloud-start.md), pero no sustituyen un campo de configuración guardado ni una publicación de entorno.
6. **Pull request:** [PR #2](https://github.com/webpagepxm/torre-fuerte/pull/2) creada por el usuario. Tras habilitar api.github.com, se verificó mediante la API: abierta, base main, rama feat/operacion-experiencia-premium, sin conflictos; no hay checks de CI registrados. GitHub Pages publica desde main (raíz). No se ha fusionado ni publicado esta rama. El bloqueo inicial HTTP 403 ya está resuelto; el título elegido por el usuario se conserva.

Los dominios del proyecto Supabase y api.github.com ya están permitidos y la política está aplicada. El usuario autorizó usar la base actual en construcción para registros de prueba. El requisito pendiente es autenticar correctamente al personal: el secreto está disponible, pero el último intento recibió 401; no se han creado registros. No introducir contraseñas en el chat. No se ha solicitado un token de GitHub: la autenticación existente ya funciona.
