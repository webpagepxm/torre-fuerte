# Rediseñar Torre Fuerte y reforzar el guardado de órdenes

El portal ocultaba la acción de abrir órdenes en móvil, mostraba anillos difíciles de interpretar y podía confirmar resultados incompletos del desglose. Ahora tiene estados que filtran, solicitudes del día y fichas móviles; el guardado valida, comprueba filas y relee el resultado, manteniendo los cambios visibles si falla. La nota PDF excluye notas internas y conserva la comanda de 76 mm como documento independiente.

La landing incorpora composición editorial, fuentes locales y servicios numerados, conserva citas/WhatsApp/Supabase y sustituye las reseñas ficticias por el perfil de Google. Se actualizan sistema visual, instrucciones y skill local. Sin cambios de esquema ni escrituras de prueba en producción.

Validación: 6 pruebas unitarias, 24 comprobaciones de navegador, siete anchos en ambas superficies y cero infracciones de axe en seis estados. Evidencia y capturas en `docs/qa/REPORT.md`.

Limitaciones: Supabase de producción y RLS no verificados por bloqueo de red; el guardado REST no es transaccional. Se requieren pruebas con backend de staging y Android/impresora físicos antes de dar por cerrado el incidente de producción.
