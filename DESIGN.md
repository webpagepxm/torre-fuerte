# Torre Fuerte — sistema de diseño

## Dirección vigente

Dos superficies con objetivos e identidad propios, según la petición explícita del usuario del 11 de noviembre de 2026. La landing comunica el oficio con carbón, rojo y fotografía editorial. **OPS es una plataforma SaaS clara**, inspirada en la referencia de monday.com aportada por el usuario: barra superior blanca, espacio de trabajo lavanda, selección azul y luz cian/violeta localizada en búsqueda y acceso. Conservar el logo, las familias y los tamaños tipográficos ya aprobados.

La referencia define materiales y composición, no módulos: las únicas vistas son Órdenes y Calendario. Nada de asistentes IA, inventario, pagos, clientes maestros o métricas ficticias. Modo OPS: Operate. Prioridad funcional: identificar moto, abrir orden, imprimir comanda y preparar nota de servicio.

## Paleta

| Uso              | Landing                    | OPS                                                   |
| ---------------- | -------------------------- | ----------------------------------------------------- |
| Acción           | `#c5272e`, hover `#a91f27` | `#315be8`, hover `#2448c8`; extremo violeta `#6845db` |
| Tinta            | `#171a1f`                  | `#292e45`                                             |
| Texto secundario | gris existente             | `#5d627b`; metadatos `#697087`                        |
| Fondo            | papel / carbón existentes  | `#f6f7fc`; lateral `#eff0fa`; superficie `#fff`       |
| Línea / campos   | existentes                 | `#e0e4f0` / `#8690aa`                                 |
| Selección        | rojo de marca              | fondo `#dce5ff`, tinta `#234ab8`                      |
| Pendiente        | —                          | fondo `#fff2d9`, tinta `#805210`                      |
| Confirmada       | —                          | fondo `#e9efff`, tinta `#234ab8`                      |
| Reparación       | —                          | fondo `#f0e8ff`, tinta `#6e3bb6`                      |
| Lista            | —                          | fondo `#def5ef`, tinta `#116b5d`                      |
| Error            | rojo semántico             | fondo `#fff2f0`, tinta `#94242b`                      |

`--red` se mantiene como alias CSS heredado de acción azul exclusivamente en OPS para evitar alterar contratos; no representa errores. Estados siempre escritos, no depender del color. Entregada/cancelada usan neutros. Glow cian `#0fcce6`, azul y violeta decorativos; ningún texto depende de él para contraste.

## Tipografía y retícula

- **Barlow Condensed 800**, WOFF2 local de 22 KB, licencia OFL. Marca e introducción de acceso. Texto de interfaz nativo: `-apple-system`, BlinkMacSystemFont, Segoe UI, Arial. No sustituir por otra familia.
- Mantener tamaños: UI base 15 px / 1.5, título OPS 32 px (26 en móvil, 24 a 320), cuerpo 14–16 px, metadatos 12–13 px, campos 16 px en móvil y búsqueda 14 px escritorio; marca 24/22/21 px según ancho. Numerales tabulares y folios monoespaciados.
- Espaciado: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64. Barra superior 72 px; lateral 208 px bajo la barra. Por debajo de 1000 px, barra de 64 px sin lateral y pestañas en el contenido. Contenedor hasta 1600 px; margen móvil 16 px.
- Órdenes del taller como título funcional, filtros compactos y lista al frente. Agenda secundaria en escritorio y después del listado en móvil. Sin hero de campaña ni cuatro tarjetas KPI.
- Landing: hero con campo carbón e imagen, servicios separados por reglas, banda editorial de mantenimiento y formulario. Mantener su composición y CSS actuales.

## Componentes y profundidad

- Botones ≥44 px, campos ≥48 px; radios 8 px en controles y 12 px en paneles/diálogos. Acción principal azul/violeta de alto contraste; secundarios claros; comanda azul marino. Hover, presión, ocupado, error y foco visibles.
- Panel principal blanco con sombra suave desplazada. Menús y diálogos tienen mayor elevación. Halo solo en búsqueda y acceso; no repetirlo alrededor de cada fila o botón.
- Tabla con divisores, moto como dato principal y folio monoespaciado. Filas móviles legibles con Abrir de 48 px. Mismos registros/filtros; contador junto a búsqueda, CSV después de la lista. Filtros expandibles en móvil y Limpiar reconocible cuando activos.
- Pestañas con iconos SVG de trazo coherente, selección azul y navegación por flechas/Home/End. Título y filtros responden a la vista real. Cuenta agrupa clave y salida; Ayuda siempre disponible con sesión.
- Diálogo con cabecera clara fija, identificación de moto, folio y cierre visible. Comanda al abrir y enlace directo a nota. Proteger borradores, eliminar éxitos obsoletos al editar y mantener foco fuera de acciones/cabecera fijas. No retrasar cierres para reproducir animaciones.
- Etiquetas visibles, mensajes junto a la acción y `aria-live` para resultados. Confirmaciones solo después de respuesta/lectura válida. Error de consulta no se convierte en vacío ni muestra conceptos de otra orden. Resultado incierto conserva conceptos y exige revisión antes de reintentar.
- Calendario: lista semanal móvil y mes escritorio; franja solicitada, no hora confirmada. Carga, fallo y reintento explícitos. FullCalendar y PDF siguen diferidos.
- Iconos Lucide 0.468.0 adaptados a SVG de 18 px, trazo 1.5; licencia ISC en `operacion/vendor/lucide-LICENSE.txt`. No emojis como controles. Sin bibliotecas visuales nuevas.

## Movimiento de OPS

Tesis: **luz cian/violeta en el punto de búsqueda** como gesto visual principal; continuidad breve entre Órdenes/Calendario; apertura de diálogos, menú y feedback de acciones existentes. Los controles están disponibles desde el primer render, sin coreografía de carga.

`operacion/atmosphere.js` dibuja un shader WebGL de borde redondeado, sin dependencias, red ni datos de negocio. Máximo 640×220 píxeles sin multiplicar por DPR, 18 FPS escritorio y 12 móvil. Solo dibuja el halo visible; pausa fuera de pantalla, documento oculto y diálogo abierto. Botón Efectos permite pausar y reactivar; persiste únicamente esa preferencia visual. `prefers-reduced-motion` prevalece. Sin WebGL o tras perder contexto, queda un halo CSS estático y todos los controles siguen utilizables.

Interacciones compartidas en `assets/ui-interactions.css`: presión 120 ms, feedback 160 ms, apertura 220 ms, reflejo 280 ms, curva `cubic-bezier(0.22,1,0.36,1)`. El indicador de Actualizar solo gira durante la consulta. Movimiento reducido elimina giros, desplazamientos y shader; conserva mensajes y estados escritos. La landing no incorpora shader y mantiene su reflejo localizado con hover.

## Medios, documentos y verdad de producto

Hero WebP existente ~144 KB y banda `mecanico-moto.webp` ~132 KB. Imágenes generadas e ilustrativas, identificadas; no presentarlas como fotos reales o testimonios. Recorte existente elimina el texto incrustado de la portada. No alterar medios públicos durante cambios de OPS.

Comanda interna térmica de **76 mm**, monocroma, sin precios; identifica moto, folio y trabajo. Nota del cliente A4 con conceptos, cantidades, precios y total MXN calculado a centavos. **Nunca incluir notas internas en el PDF. No es factura fiscal.** Compartir por menú del teléfono si existe, descargar como alternativa. Contratos de impresión, PDF, guardado y WhatsApp independientes del efecto visual.

## Verificación

Revisar 320, 375, 390, 430, 768, 1280 y 1440 px; teclado, foco, filtros, tutorial, vacío/error y documentos. Comparar capturas con la base `e9578bc`. Datos ficticios solo en pruebas, nunca en producción. Medir rendimiento indicando condiciones; Chromium emulado no es Android físico. `tests/saas-ui.cjs` comprueba dibujo real, pausa, fallback y tipografía. Evidencia vigente: `docs/ops-saas-platform.md`; auditorías previas en `docs/torre-fuerte-ops-audit.md` y `docs/premium-ui-refinement.md`.
