# Torre Fuerte — Quality Gate y estabilidad (13/11/2026)

**Estado:** plan de aseguramiento, NO auditoría ejecutada ni certificación de producción.
**Alcance:** estabilizar la V1 entregada; no ampliar a IA ni funciones secundarias.

## Riesgo y criterio
Codex y el vibe coding aceleran el desarrollo, pero la aprobación de IA no demuestra confiabilidad. No se da por completada una tarea hasta registrar una prueba reproducible en dispositivo/entorno adecuado.

## Pendientes verificables
- [ ] **TF-QG-01** Prueba integral: solicitud en web → registro en backend → folio → panel de operaciones → WhatsApp. La solicitud no equivale a cita confirmada.
- [ ] **TF-QG-02** Pruebas automáticas (Playwright) y regresión para cliente, moto, orden, estados, desglose guardado y exportación PDF. Prevenir duplicados.
- [ ] **TF-QG-03** Auditar login, credenciales, secretos, permisos de Supabase/RLS y aislamiento de clientes/órdenes.
- [ ] **TF-QG-04** Respaldar datos y probar restauración; documentar cómo revertir una versión y recuperar información sin pérdidas.
- [ ] **TF-QG-05** Pruebas en Android físico, señal lenta/intermitente, validación de errores y monitoreo/alertas.
- [ ] **TF-QG-06** CI de GitHub Actions: bloquear despliegues ante fallos críticos; documentar soporte, garantía y procedimiento de incidente.

## Entrega
El flujo crítico debe funcionar de punta a punta con datos de prueba. Guardar fecha, evidencia de prueba, responsable, resultado y enlace al cambio. Diseño o mockup no equivalen a entrega validada.

## Estándar compartido de agencia
Control de versiones, reversión, QA automático, seguridad, entornos separados, backups restaurables, monitoreo, carga proporcional a uso esperado, dispositivos reales, documentación y revisión humana cuando el riesgo lo amerite. El costo de un plan superior de Codex no sustituye estos controles.

## Seguimiento en ROADMAP
Los nuevos hitos están incorporados en «Torre Fuerte → Seguridad y QA Android» como **pendientes**, con IDs de checklist estables. El proyecto conserva sus marcas anteriores. El porcentaje es una estimación/seguimiento, no certificado de producción.

**Referencia:** https://github.com/webpagepxm/proyects4me y el reporte general del 13/11/2026.
