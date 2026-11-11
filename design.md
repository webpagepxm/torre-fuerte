# Torre Fuerte — sistema de diseño

## Dirección
**Oficio de taller, tinta carbón y rojo de señal.** La landing tiene ritmo editorial y fotografía protagonista. El portal es una mesa de trabajo: cada moto identificable, cada estado legible, cada acción al alcance. Ambos comparten logo, acentos y titulares condensados, sin convertir el portal en una campaña publicitaria.

## Tokens

| Uso | Valor |
| --- | --- |
| Marca original | `#d92f30`, preservada en recursos existentes |
| Acción accesible sobre blanco / botón con texto blanco | `#c5272e` |
| Hover de acción | `#a91f27` |
| Carbón | `#171a1f` / `#191c21` |
| Tinta / texto secundario | `#24282d` / `#59646b` |
| Papel / superficie / línea | `#f3f4f2` / `#fff` / `#dce1e2` |
| Rojo sobre carbón | `#ff979a` para texto pequeño; `#ff7378` para titulares |
| Pendiente | fondo `#fcebec`, texto `#9e272e` |
| Confirmada | fondo `#eaf0f9`, texto `#35567d` |
| Reparación | fondo `#faf0df`, texto `#815114` |
| Lista | fondo `#e6f4ed`, texto `#1c6349` |

Estados siempre escritos; no depender del color. Entregada/cancelada usan grises. Rojo funcional concentrado en acciones y folios, no en toda la pantalla.

## Tipografía y retícula
- **Barlow Condensed 800**, local WOFF2 de 22 KB y OFL. Titulares públicos, marca e introducción de acceso en escritorio. Una sola variante para reducir transferencia.
- Texto: sistema (`Segoe UI`, Arial, fuentes nativas); sin descarga de Inter. Jerarquía por tamaño, peso, espaciado y contraste.
- Landing: H1 54–94 px según ancho, H2 43–69 px; cuerpo 14–17 px. Portal: título 29–38 px de sistema, títulos de sección 16–19 px, cuerpo 12–16 px; los metadatos pequeños no sustituyen la información principal.
- Escala de espacio: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 88. Contenedores de 1200 px públicos y 1280 px operativos; márgenes móviles 20 px.
- Landing: hero con campo carbón, foto a la derecha en escritorio y arriba en móvil; servicios numerados divididos por reglas; banda de mantenimiento con imagen del oficio; formulario con introducción lateral. Evitar seis tarjetas comerciales idénticas.
- Portal: navegación lateral carbón, título funcional «Órdenes del taller», filtros de estado compactos y registro de trabajo en primer plano. Agenda en columna secundaria de escritorio y después del listado en móvil. Una agenda vacía no desplaza las motos. Sin hero comercial, lemas ni cuatro tarjetas KPI del mismo tamaño.

## Componentes
- Botón primario rojo, secundario blanco con borde, acción documental interna carbón. Altura ≥44 px; formularios ≥48 px. Radios 2–6 px en público y 6–8 px en operación; no sombras grandes salvo modal.
- Acceso móvil: formulario completo en la primera pantalla; la introducción de marca queda para escritorio.
- Etiquetas visibles antes de campos, placeholder solo de apoyo; descripción de error junto a la acción. `aria-live` para resultados. Guardado en curso bloquea escritura duplicada; error no se convierte en éxito al ocultarse el modal.
- Tabla de escritorio con divisores horizontales, folios monoespaciados y motocicleta como dato principal. Filas móviles separadas por reglas, sin una tarjeta por moto; acción Abrir de 44 px. Misma búsqueda y filtros. En móvil, «Filtros» despliega fecha/estado sin alejar el listado de la primera pantalla. Mostrar cantidad de filtros activos y Limpiar cuando corresponda, incluso con el panel cerrado.
- Los números de cada estado van dentro de botones de filtro con aria-pressed; no forman tarjetas de resumen. Agenda del día muestra solicitudes, no disponibilidad ni citas inventadas. El límite de 1000 registros se comunica cuando aplica.
- Pestañas con borde de selección rojo y navegación por teclado. El título sigue la vista elegida y los filtros de órdenes se retiran al ver el calendario. Cuenta agrupa cambio de clave y salida; Ayuda permanece visible.
- Diálogo con nombre accesible, cabecera carbón y borde rojo. Proteger notas, estado y nueva orden sin guardar al cerrar; no bloquear cierres sin cambios. Campos a una columna en móvil. El tutorial puede quedarse visible mientras señala controles; no debe modificar el borrador.
- Estados vacíos: explicar ausencia y siguiente acción. Error de carga: no reutilizar conceptos de otra orden. Éxito: solo después de confirmación y lectura. Tras resultado parcial: mantener datos visibles y exigir revisión antes de reintentar.
- Iconografía funcional simple (flechas, cierre y numeración documental); no emojis de moto/papel en documentos. No incorporar componentes React a este sitio estático por motivos decorativos.

## Motion, medios y rendimiento
Transiciones de 160–200 ms en hover/foco. Sin animaciones de entrada que retrasen los controles. Bajo `prefers-reduced-motion`, quitar animaciones, transiciones y scroll suave. Mantener foco y contraste, sin depender de hover en Android.

Hero existente WebP de ~144 KB. La banda de mantenimiento usa `mecanico-moto.webp` (~132 KB), coherente con el oficio; sustituye la imagen de pista de ~516 KB. Medios secundarios con dimensiones y lazy loading. Los recursos actuales son generados e ilustrativos, identificados como tales en la página; deben sustituirse por fotos reales autorizadas cuando existan. No representar imágenes generadas como testimonios del taller.

Fuentes locales; pdfmake se solicita al generar una nota. No incorporar dependencias nuevas en runtime sin necesidad, tamaño y licencia revisados.

## Documentos
Comanda térmica de **76 mm**, monocroma, monoespaciada, sin precios ni encabezados del navegador añadidos por CSS. Identificación de moto, folio y trabajo; no comprobante de cobro.

Nota A4: marca, folio, cliente/moto, tabla de conceptos, cantidad, precio unitario, subtotal y total MXN. Sumar por concepto redondeado a centavos. Excluir notas internas. Pie explícito: documento de servicio, no factura fiscal. Compartir mediante menú del teléfono cuando exista soporte; descargar como alternativa.

## Aceptación
Comparar antes/después en 390 y 1440 px e inspeccionar los siete anchos. Probar teclado, foco, diálogos, filtros, formularios, tutorial, errores y documentos. Capturas no sustituyen interacción. Resultados y límites en `docs/qa/REPORT.md`.
