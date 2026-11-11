# Torre Fuerte — sistema de diseño

## Dirección

**Oficio de taller, tinta carbón y rojo de señal.** La landing tiene ritmo editorial y fotografía protagonista. El portal es una mesa de trabajo: cada moto identificable, cada estado legible, cada acción al alcance. Ambos comparten logo, acentos y titulares condensados, sin convertir el portal en una campaña publicitaria.

## Tokens

| Uso                                                    | Valor                                                  |
| ------------------------------------------------------ | ------------------------------------------------------ |
| Marca original                                         | `#d92f30`, preservada en recursos existentes           |
| Acción accesible sobre blanco / botón con texto blanco | `#c5272e`                                              |
| Hover de acción                                        | `#a91f27`                                              |
| Carbón                                                 | `#171a1f` / `#191c21`                                  |
| Tinta / texto secundario / metadatos OPS               | `#24282d` / `#596168` / `#676d72`                      |
| Papel / superficie / línea OPS                         | `#f5f5f3` / `#fff` / `#dedfdf`                         |
| Rojo sobre carbón                                      | `#ff979a` para texto pequeño; `#ff7378` para titulares |
| Pendiente                                              | fondo `#fcebec`, texto `#9e272e`                       |
| Confirmada                                             | fondo `#eaf0f9`, texto `#35567d`                       |
| Reparación                                             | fondo `#faf0df`, texto `#815114`                       |
| Lista                                                  | fondo `#e6f4ed`, texto `#1c6349`                       |

Estados siempre escritos; no depender del color. Entregada/cancelada usan grises. Rojo funcional concentrado en acciones y folios, no en toda la pantalla.

## Tipografía y retícula

- **Barlow Condensed 800**, local WOFF2 de 22 KB y OFL. Titulares públicos, marca e introducción de acceso en escritorio. Una sola variante para reducir transferencia.
- Texto: sistema (`Segoe UI`, Arial, fuentes nativas); sin descarga de Inter. Jerarquía por tamaño y contraste, pesos 400/500/600 en la interfaz. Barlow 800 queda como identidad de marca e introducción de acceso.
- Landing: H1 54–94 px según ancho, H2 43–69 px; cuerpo 14–17 px. Portal: título 24–36 px, moto 20–24 px, sección 18–24 px, cuerpo 14–16 px y metadatos 12–13 px. Sin etiquetas operativas en mayúsculas espaciadas ni tracking negativo en texto pequeño.
- Escala de espacio: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 88. Contenedores de 1200 px públicos y hasta 1600 px operativos; márgenes móviles de 16 px en OPS y 20 px públicos.
- Landing: hero con campo carbón, foto a la derecha en escritorio y arriba en móvil; servicios numerados divididos por reglas; banda de mantenimiento con imagen del oficio; formulario con introducción lateral. Evitar seis tarjetas comerciales idénticas.
- Portal: navegación lateral carbón, título funcional «Órdenes del taller», filtros de estado compactos y registro de trabajo en primer plano. Agenda en columna secundaria de escritorio y después del listado en móvil. Una agenda vacía no desplaza las motos. Sin hero comercial, lemas ni cuatro tarjetas KPI del mismo tamaño.

## Componentes

- Botón primario rojo, secundario blanco con borde, acción documental interna carbón. Altura ≥44 px; formularios ≥48 px. Radios 2–6 px en público; en OPS controles de 8 px y paneles/diálogos de 12 px. No sombras en paneles; sombra neutra solo en elementos flotantes.
- Acceso móvil: formulario completo en la primera pantalla; la introducción de marca queda para escritorio.
- Etiquetas visibles antes de campos, placeholder solo de apoyo; descripción de error junto a la acción. `aria-live` para resultados. Guardado en curso bloquea escritura duplicada; error no se convierte en éxito al ocultarse el modal.
- Tabla de escritorio con divisores horizontales, folios monoespaciados y motocicleta como dato principal. Filas móviles separadas por reglas, sin una tarjeta por moto; acción Abrir de 48 px. Misma búsqueda y filtros. El contador acompaña a Buscar; exportar CSV queda después del listado. En móvil, «Filtros» despliega fecha/estado. Mostrar cantidad de filtros activos y Limpiar incluso con el panel cerrado.
- Los números de cada estado van dentro de botones de filtro con aria-pressed; no forman tarjetas de resumen. Agenda del día muestra solicitudes, no disponibilidad ni citas inventadas. El límite de 1000 registros se comunica cuando aplica.
- Pestañas con borde de selección rojo y navegación por teclado. El título sigue la vista elegida y los filtros de órdenes se retiran al ver el calendario. Cuenta agrupa cambio de clave y salida; Ayuda permanece visible.
- Diálogo con nombre accesible y cabecera fija carbón con borde rojo. Moto primero, comanda accesible al abrir, enlace directo a nota de servicio. Indicar cambios sin guardar al editar estado/notas; retirar éxitos anteriores tras editar de nuevo. Proteger borradores al cerrar. Mantener el campo enfocado fuera de cabecera y acciones fijas cuando disminuye el espacio visible. Campos a una columna en móvil. El tutorial no modifica datos.
- Estados vacíos: explicar ausencia y siguiente acción. Error de carga: no reutilizar conceptos de otra orden. Éxito: solo después de confirmación y lectura. Tras resultado parcial: mantener datos visibles y exigir revisión antes de reintentar.
- Iconografía Lucide 0.468.0 local: actualizar y cerrar, 18 px, trazo 1.5, color heredado; licencia ISC en `operacion/vendor/lucide-LICENSE.txt`. Sin paquete/icon font en runtime, emojis ni numeración decorativa en navegación/documentos.
- Calendario: semana en lista en móvil, mes en escritorio, moto y estado escritos en cada solicitud. La franja sigue siendo solicitada, no una hora confirmada. Descargar FullCalendar y su locale solo al abrir esta vista; carga/fallo/reintento explícitos.

## Motion, medios y rendimiento

Transiciones de 160–200 ms en hover/foco. Sin animaciones de entrada que retrasen los controles. Bajo `prefers-reduced-motion`, quitar animaciones, transiciones y scroll suave. Mantener foco y contraste, sin depender de hover en Android.

Hero existente WebP de ~144 KB. La banda de mantenimiento usa `mecanico-moto.webp` (~132 KB), coherente con el oficio; sustituye la imagen de pista de ~516 KB. Medios secundarios con dimensiones y lazy loading. Los recursos actuales son generados e ilustrativos, identificados como tales en la página; deben sustituirse por fotos reales autorizadas cuando existan. No representar imágenes generadas como testimonios del taller.

Fuentes locales; pdfmake se solicita al generar una nota. No incorporar dependencias nuevas en runtime sin necesidad, tamaño y licencia revisados.

## Documentos

Comanda térmica de **76 mm**, monocroma, monoespaciada, sin precios ni encabezados del navegador añadidos por CSS. Identificación de moto, folio y trabajo; no comprobante de cobro.

Nota A4: marca, folio, cliente/moto, tabla de conceptos, cantidad, precio unitario, subtotal y total MXN. Sumar por concepto redondeado a centavos. Excluir notas internas. Pie explícito: documento de servicio, no factura fiscal. Compartir mediante menú del teléfono cuando exista soporte; descargar como alternativa.

## Aceptación

Comparar antes/después en 390 y 1440 px e inspeccionar los siete anchos. Probar teclado, foco, diálogos, filtros, formularios, tutorial, errores y documentos. Capturas no sustituyen interacción. Auditoría actual en `docs/torre-fuerte-ops-audit.md`; evidencia anterior en `docs/qa/REPORT.md`.

## Refinamiento de interacción · noviembre 2026

- Mantener la identidad y composición existentes; simplificar etiquetas y numeración decorativa. Un estilo SaaS es admisible con identidad del taller, sin métricas o módulos ficticios.
- Landing: texto nativo de 16 px, encabezados Barlow Condensed existentes, formularios de 16 px/peso 400, etiquetas de 14 px y metadatos de al menos 12 px. Menú colapsado hasta 1020 px para evitar solapamientos.
- Campos: borde `#89949b`, placeholder `#676d72`, foco rojo visible. No alterar nombres, valores, validaciones ni mensajes de WhatsApp.
- Fuente de movimiento: `assets/ui-interactions.css`. Presión 120 ms, feedback 160 ms, apertura 220 ms y reflejo 280 ms; curva `cubic-bezier(0.22,1,0.36,1)`. Sin animaciones de entrada para cada sección ni bucles decorativos.
- Foco visual de la portada: reflejo blanco localizado sobre la imagen existente. Se mueve solo ante hover con puntero fino; fallback estático. Sin WebGL, ruido, parallax o biblioteca de animación.
- Enlaces de servicio: SVG y CSS de transitions.dev; tiempos ajustados por sus variables. Botones principales: reflejo breve y presión sutil. Ninguna acción espera a que acabe una animación.
- OPS: estados con texto y fondo semántico, menú Cuenta desde su origen y apertura de diálogo conservando cierre nativo inmediato. La rotación de Actualizar solo existe mientras el botón esté ocupado.
- `prefers-reduced-motion`: conserva estados y feedback escritos, elimina desplazamientos, reflejos y giros animados.
- La imagen original contiene texto incrustado. El recorte mediante imagen al 125% y `object-position:center top` deja fuera esa zona, conserva al motociclista y no modifica el archivo ilustrativo.
