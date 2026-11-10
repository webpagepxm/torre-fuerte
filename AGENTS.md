# Torre Fuerte — instrucciones para Codex

## Propósito
Sitio público y portal operativo del taller de motocicletas Torre Fuerte, Puerto Escondido. El sitio debe conseguir solicitudes reales y el portal debe permitir al mecánico trabajar desde un Android de gama media. La claridad operativa gana frente al espectáculo visual.

## Arquitectura real — leer antes de modificar
- `index.html` es el sitio público activo: contiene CSS y JavaScript embebidos. `styles.css` y `script.js` son legado y NO controlan esa página.
- `operacion/index.html`, `operacion/style.css` y `operacion/app.js` constituyen el portal privado.
- `tf-config.js` define configuración pública de integración; nunca publicar tokens de servicio, contraseñas o datos privados.
- Mantener la separación entre notas de servicio PDF y comandas imprimibles; no convertir la comanda en documento fiscal.
- No cambiar la lógica de citas, órdenes, autenticación, Supabase, exportación, PDF, impresión, tour ni WhatsApp al ejecutar una tarea exclusivamente visual.

## Identidad y skill obligatoria en tareas visuales
Lee `design.md` y activa la skill `.agents/skills/direccion-visual/SKILL.md` para diseño/rediseño. No aplicar plantillas genéricas, estilos ajenos ni efectos pesados. Preservar el logotipo real y los colores y tipografías ya definidos en design.md.

## Criterios de entrega
1. Antes de cambiar: examinar código, componentes reales y flujo de usuario; identificar la pantalla activa.
2. Si la tarea es diseño, proponer y aplicar un cambio concreto de jerarquía, composición y detalle; no limitarse a cambiar colores o añadir tarjetas.
3. Ejecutar sin delegar al usuario lo que Codex sí pueda hacer: edición, servidor local, pruebas y capturas.
4. Validar pantalla pública y portal a 320, 375, 390, 768, 1280 y 1440 px; controles con teclado, menús, formularios, diálogo, tour, impresión y estados vacíos. Usar navegador si está disponible. No afirmar pruebas no realizadas.
5. Confirmar que no hay scroll horizontal, controles superpuestos ni pérdida de foco, y respetar `prefers-reduced-motion`.
6. Tomar un checkpoint/commit antes de refactors visuales grandes; mantener un diff acotado y reversible.
7. No inventar resultados de reseñas, horarios, precios, citas confirmadas ni prestaciones del taller. No introducir dependencias sin justificación.
8. Diferenciar claramente: revisión visual, pruebas funcionales reales y validación de producción. Documentar cualquier límite.

## Prioridad
Primero flujo de citas y seguimiento confiable; segundo legibilidad y acceso para mecánico; tercero refinamiento de marca y detalles. El diseño nunca puede ocultar un error de guardado ni simular éxito.
