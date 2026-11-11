# Rediseñar Torre Fuerte y reforzar el guardado de órdenes

El portal ocultaba la acción de abrir órdenes en móvil, mostraba anillos difíciles de interpretar y podía confirmar resultados incompletos del desglose. Ahora tiene estados que filtran, solicitudes del día y fichas móviles; el guardado valida, comprueba filas y relee el resultado, manteniendo los cambios visibles si falla. La nota PDF excluye notas internas y conserva la comanda de 76 mm como documento independiente.

La landing incorpora composición editorial, fuentes locales y servicios numerados, conserva citas/WhatsApp/Supabase y sustituye las reseñas ficticias por el perfil de Google. Se actualizan sistema visual, instrucciones y skill local. Sin cambios de esquema ni escrituras de prueba en producción.

Validación: 6 pruebas unitarias, 24 comprobaciones de navegador, siete anchos en ambas superficies y cero infracciones de axe en seis estados. Evidencia y capturas en `docs/qa/REPORT.md`.

Verificación remota: conectividad Supabase y clave publicable operativas; las tres tablas privadas rechazan consultas anónimas y los endpoints responden al origen del sitio. El usuario autorizó probar en su proyecto actual en construcción. El secreto de acceso está aplicado, pero el inicio de sesión del runner devuelve 401: no se creó ninguna orden. Sigue pendiente resolver el acceso, probar el guardado y revisar las políticas RLS completas. El guardado REST no es transaccional. No se da por cerrado el incidente de producción; Android e impresora físicos tampoco están verificados.
