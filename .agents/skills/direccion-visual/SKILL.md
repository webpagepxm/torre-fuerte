---
name: direccion-visual
description: Dirección de arte y revisión anti-AI-slop para diseñar, auditar o rediseñar páginas, pantallas, componentes, estados y sistemas visuales de Torre Fuerte. Usar cuando se pida mejorar el aspecto, la usabilidad, la identidad de marca o la experiencia móvil. No activar para cambios exclusivos de backend o datos.
---

# Dirección visual — Torre Fuerte

## Contexto previo obligatorio
1. Leer `AGENTS.md` y `design.md`.
2. Localizar la superficie realmente activa: el CSS público está incrustado en `index.html`; el portal usa `operacion/style.css`.
3. Identificar la tarea del cliente/mecánico y la acción primaria. Preservar IDs, eventos y contratos de datos.

## Método de diseño
1. **Auditoría:** observar captura real o render si hay navegador; señalar tres problemas concretos de jerarquía/composición (no etiquetas vagas como “falta modernidad”).
2. **Dirección:** escribir en una frase la decisión de arte (por ejemplo, “editorial de taller con tinta carbón, rojo de señal y tipografía de cartel”) y reutilizar la identidad existente.
3. **Composición:** variar ritmo y densidad entre secciones; priorizar folios, listados y espacio negativo sobre filas repetidas de tarjetas.
4. **Sistema:** ajustar tipografía, espaciado, contraste, bordes y botones a través de tokens/estilos actuales; no implantar una segunda identidad.
5. **Imágenes:** preferir assets relevantes ya presentes y fotos reales autorizadas. Si se generan ilustraciones, deben responder a una necesidad real y mantener estilo coherente; no inventar personal ni hacer pasar ilustraciones por fotos reales.
6. **Componentes:** incorporar componentes externos solo si tienen utilidad comprobable, licencia válida, compatibilidad y tamaño aceptable. No copiar pantallas ajenas completas.
7. **Calidad:** abrir 320/390/768/1440 px; comprobar scroll, focos, contraste, inputs, diálogos, impresión, feedback y `prefers-reduced-motion`. Revisar rendimiento en Android económico.
8. **Cierre:** registrar qué cambió, qué se probó realmente, qué falta y cómo revertir. Si hay fallos funcionales preexistentes, hacerlos visibles en vez de esconderlos.

## Anti-patrones prohibidos
- Hero genérico con gradiente púrpura, chips flotantes y seis tarjetas idénticas.
- Glassmorphism sin razón, sombras masivas, animaciones que retrasan interacción.
- Textos genéricos (“revolucionando tu experiencia”), claims no confirmados, iconos inconsistentes.
- Cambiar estilos del archivo legacy pensando que cambió la página activa.
- Declarar un diseño validado sin abrirlo; confundir una nota PDF con una comanda.

La meta es que el trabajo parezca diseñado específicamente para un mecánico y sus clientes, no para demostrar que una IA sabe CSS.
