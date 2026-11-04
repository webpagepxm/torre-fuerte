# SLIDER BROS — PLAN MAESTRO DE PRODUCTO
**Versión:** 1.0 · **Fecha base:** 2026-11-04 · **Estado:** planificación aprobada conceptualmente; no equivale a funcionalidades desplegadas.

> Propósito: convertir Slider Bros Studio en un ecosistema real, remoto y verificable, primero de marketing y después de capacitación y control de restaurante. Mantener diseño premium mobile-first heredado de Backstage, adaptado a branding rojo/negro de Slider Bros. Priorizar herramientas reales sobre módulos decorativos.

## 0. Reglas y decisiones ya tomadas
- [x] Dos productos conectados: **Marketing Studio** y **Academy + Operations**.
- [x] Marketing: hamburguesas/restaurante son protagonistas; Pelusa y Borges aparecen estratégicamente como cómplices traviesos y caóticos. Humor irreverente/absurdo/memes, intensidad contextual; público amplio.
- [x] Dirección editorial estacional inspirada en la disciplina de campañas de moda: primavera, verano, otoño, invierno; también Buen Fin, Hot Sale, venta nocturna y promociones aprobadas.
- [x] Fotografía editorial con Anne como colaborador propuesto (no contratado); lifestyle pádel/playa; casting con diversidad real sin burlas por apariencia; reels con talento; creadores e influencers de Veracruz en fase de prospección para fines de noviembre.
- [x] Conversar con ChatGPT para definir/actualizar estrategia; toda modificación compartida debe revisarse y guardarse explícitamente, no inferirse automáticamente de cualquier chat.
- [x] Primera regla: no promocionar descuentos, precios, ofertas o eventos que operaciones no haya autorizado.
- [x] V6 en GitHub Pages es una interfaz/prototipo, NO equivalente comprobado a Metricool.
- [ ] Migrar a un repositorio propio y separado de Torre Fuerte antes de integrar credenciales o lógica operativa.
- [ ] Confirmar responsables, presupuesto e infraestructura de hosting, sin forzar inversión anticipada.

## 1. Fase cero — auditoría técnica y comparativa (propuesta: 4–8 nov 2026)
**Objetivo:** medir qué funciona de verdad en la versión publicada.

### 1.1 Control y respaldo
- [ ] Congelar/capturar V6 como referencia y descargar backup de datos locales.
- [ ] Crear entorno de pruebas separado del sitio publicado y etiquetar versión.
- [ ] Listar dependencias, versiones, licencias y cargas por CDN (FullCalendar, Fabric.js, Chart.js, QR).
- [ ] Revisar consola JavaScript, errores HTTP, funcionamiento sin red y comportamiento ante CDN caído.
- [ ] Probar escritorio y móvil (Safari iPhone, Chrome móvil/escritorio), tamaños de pantalla y accesibilidad básica.
- [ ] Confirmar que guardar/editar/borrar/reordenar no elimina datos inesperadamente.
- [ ] Probar importación/exportación JSON/CSV, recuperación y compatibilidad de datos V5/V6.

### 1.2 Pruebas verificables por componente
- [ ] **FullCalendar:** crear borrador, mover fecha, editar, borrar, recargar y comprobar persistencia; zona horaria correcta.
- [ ] **Fabric.js:** subir foto propia, añadir texto/logotipo, mover capas, exportar PNG, verificar tamaño/calidad.
- [ ] **Chart.js:** alimentar datos reales de prueba, comparar sumas con fuente, filtros y ausencia de métricas falsas.
- [ ] **QR:** generar enlace UTM, descargar QR, escanear en dos móviles, validar URL y atribución.
- [ ] **Notas/pendientes:** CRUD completo, fechas, responsables, estado, adjuntos y ausencia de datos perdidos.
- [ ] Registrar cada caso con resultado: PASA / FALLA / BLOQUEADO / NO APLICA, captura y severidad.
- [ ] Abrir lista de bugs priorizada: P0 datos/seguridad, P1 función rota, P2 UX, P3 cosmética.

### 1.3 ¿Realmente iguala a Metricool?
- [ ] Definir redes prioritarias para Slider Bros con sus cuentas de prueba/autorizadas.
- [ ] Comparar en mismas condiciones: crear, programar, publicar y editar publicaciones.
- [ ] Validar publicación real en cada red, estado de publicación, reintentos, duplicados y fallos.
- [ ] Validar analítica (alcance, impresiones, interacciones, clics) con cifras consultables en cuenta fuente.
- [ ] Contrastar exportaciones, reportes, permisos, uso en teléfono, aprobación y fiabilidad.
- [ ] Separar funciones de Metricool Free de funciones pagadas; documentar restricciones de API y MCP.
- [ ] Crear scorecard con evidencia y decisión para cada función: Postiz / Metricool / propio / descartar.
- [ ] Criterio de salida: nada se declara «igual o mejor» sin publicar de verdad y verificar resultados.

**Referencia:** Metricool Free: 1 marca, 20 publicaciones/mes, 30 días de historial; API tradicional Advanced/Custom (ver https://help.metricool.com/es/principales-diferencias-entre-los-planes-free-y-de-pago-bl0v9).

## 2. Fase uno — UX premium, notas y pendientes (propuesta: 9–16 nov)
**Objetivo:** que usar Studio requiera muy pocos toques.

### 2.1 Diseño visual
- [ ] Unificar paleta roja/negro carbón/blanco cálido, iconos, tipografía, grid, espacios y sombras.
- [ ] Mantener navegación de Backstage: sidebar en escritorio; dock de iconos en móvil.
- [ ] Simplificar Inicio: «Hoy», «Esperan mi decisión», «Próximas campañas», «Riesgos/bloqueos».
- [ ] Sustituir tarjetas decorativas/duplicadas por paneles con acciones y datos reales.
- [ ] Jerarquía visual consistente, tipografía legible, CTA único por sección, estados vacíos útiles.
- [ ] Interacciones táctiles grandes, accesibilidad y feedback de guardado/error/deshacer.

### 2.2 Notas
- [ ] Vista sencilla de notas, no un «todo en uno» saturado.
- [ ] Crear, leer, editar, archivar, buscar y eliminar con confirmación/deshacer.
- [ ] Etiquetas: producto, editorial, proveedores, influencers, operaciones y general.
- [ ] Relacionar cada nota con campaña/proyecto/tarea, sin crear duplicados.
- [ ] Adjuntar referencias/fotos con almacenamiento privado (no en repositorio público).
- [ ] Crear notas desde un resumen conversado con revisión del usuario.

### 2.3 Pendientes
- [ ] Unificar todo en un modelo de tarea, sin tarjetas que no se puedan mover o borrar.
- [ ] Propiedades: nombre, responsable, prioridad, estado, inicio, vencimiento, vínculo a campaña, dependencia, notas, evidencia.
- [ ] Vistas: «Hoy», «Esta semana», «Calendario», «Todas» y filtros.
- [ ] Marcar completado, reabrir, posponer, editar y eliminar; conservar historial cuando aplique.
- [ ] Evitar tareas huérfanas, duplicadas o sin responsable; alertar cuando correspondan.
- [ ] Permitir que ChatGPT proponga cambios; confirmar antes de escribir en la base compartida.

### 2.4 Datos y sincronización
- [ ] Diseñar tablas relacionales y RLS en Supabase: campaigns, tasks, notes, assets, approvals, users, audit_logs.
- [ ] Migrar desde almacenamiento local sin perder información.
- [ ] Separar entornos producción/pruebas y respaldos.
- [ ] Autenticación, permisos por rol, secretos en servidor; jamás tokens/API keys en HTML o GitHub Pages.
- [ ] Probar dos dispositivos y conflicto de edición; verificar el flujo de aprobación.

## 3. Fase dos — Gantt maestro, planeación D-30 y flujo editorial (propuesta: 12–23 nov)
**Motor propuesto:** Frappe Gantt (https://github.com/frappe/gantt); comprobar versión y licencia al instalar.

### 3.1 Gantt útil, no decorativo
- [ ] Crear vista «Plan maestro» a ancho completo con escalas semana/mes/trimestre/año.
- [ ] Carriles separados: temporadas, shoots, reels, influencers, promociones, publicaciones, resultados.
- [ ] Barras por tarea, colores por estado, responsables, porcentaje verificado y dependencias.
- [ ] Arrastrar barras y cambiar inicio/fin desde móvil y escritorio; validar guardado real.
- [ ] Al mover una tarea, mostrar impacto en dependencias; evitar reprogramación silenciosa no deseada.
- [ ] Clic abre panel contextual editable con brief, fotos, tareas, aprobaciones y próxima acción.
- [ ] Filtros por campaña, responsable, estado, periodo y urgencia.
- [ ] Vista móvil alternativa «línea de tiempo + lista» más fácil de tocar que un Gantt microscópico.
- [ ] Exportar snapshot/CSV y mantener historial de modificaciones.

### 3.2 Flujo mínimo de campaña
- [ ] Estados: idea → brief → aprobada → producción → revisión → programada → publicada → análisis.
- [ ] Campañas comerciales requieren aprobación explícita de precios/vigencias.
- [ ] Tareas automáticas relativas a fecha de lanzamiento: D-45 concepto/presupuesto, D-30 preproducción, D-21 casting/locaciones, D-14 shoot/edición, D-7 aprobaciones/programación, D0 publicación, D+3 análisis.
- [ ] Avisar si una idea nace fuera de plazo (marcar «plan comprimido», nunca falsear D-30 cumplido).
- [ ] Crear recordatorios y bloqueos reales cuando se active la automatización, no antes.
- [ ] Integrar notas, pendientes, archivos y el calendario de publicaciones con los mismos IDs.
- [ ] Permitir modificar o cancelar campañas sin borrar auditoría útil.

### 3.3 Calendario editorial prioritario
- [ ] Nov–dic 2026: campaña de Navidad (brief/shooting con Anne por confirmar).
- [ ] Nov 2026: prospección creadores Veracruz a finales de mes (calendario comprimido).
- [ ] Lifestyle pádel/playa: banco flexible, sin fecha hasta confirmar.
- [ ] Comercial: Buen Fin, Hot Sale, rebajas, venta nocturna, solo si operaciones define oferta.
- [ ] Invierno 2027; primavera 2027; verano 2027; otoño 2027; Navidad 2027.
- [ ] Para cada temporada: concepto, referencias, locación, casting, presupuesto, entregables y derechos de uso.
- [ ] Toda sesión con Anne o talento necesita propuesta/aceptación real, no estatus de contratado por defecto.

## 4. Fase tres — motor de publicaciones y comparación con Metricool (propuesta: 18 nov–6 dic)
**Prioridad:** Postiz self-hosted. Alternativa táctica: Metricool Free o de pago como herramienta externa mientras se comprueba Postiz.

- [ ] Evaluar requisitos/recursos de servidor, Docker, PostgreSQL, Redis y almacenamiento de Postiz en documentación oficial.
- [ ] Revisar licencia AGPL-3.0, condiciones de reutilización y obligaciones en implementación comercial.
- [ ] Instalar en servidor de pruebas con HTTPS; credenciales y OAuth exclusivamente backend.
- [ ] Conectar una cuenta social de prueba/autorizada por plataforma prioritaria, sin publicar contenido no aprobado.
- [ ] Probar subida de medios, programar, cancelar, fallos de token, reintentos, webhooks.
- [ ] Conectar Studio por API backend; nunca incrustar clave de Postiz en frontend.
- [ ] Registrar resultado por publicación: plataforma, id, URL, timestamp, éxito/error, reintentos.
- [ ] Probar métricas contra fuente y guardar fechas de actualización.
- [ ] Crear tablero de «publicaciones fallidas» y alertas a responsable.
- [ ] Definir aprobación humana antes de programar/publicar.
- [ ] Repetir matriz comparativa con Metricool: publicación, formatos, alcance, analítica, equipos, informes, competidores y costos reales.
- [ ] Si Postiz falla una función crítica, usar Metricool para esa función (manual o API solo si el plan da permiso); no inventar integraciones del plan Free.
- [ ] Aceptación de fase: al menos un flujo completo real por red prioritaria y reconciliación de métricas demostrable.
- [ ] Documentar cuándo conviene no desarrollar una función propia.

## 5. Segunda línea de producto — Slider Bros Academy (arranque propuesto: dic 2026)
**Meta inicial de 4–6 semanas:** piloto útil y pequeño, NO digitalizar todo el restaurante a la vez.

### 5.1 Preparación documental
- [ ] Entrevistar a quien realmente prepara cocina y administra el turno.
- [ ] Inventariar procesos existentes y responsables por rol: cocina, preparación, limpieza, servicio, gerencia.
- [ ] Seleccionar 3 SOP iniciales: salsa BBQ, salsa de la casa, armado de una hamburguesa.
- [ ] Crear ficha estándar por receta: versión, ingrediente, unidad, gramaje, proceso, utensilios, rendimiento esperado, textura/aspecto, alérgenos, etiquetado, conservación y responsable.
- [ ] Revisar criterios sanitarios, conservación, temperaturas y controles con NOM-251 y asesoría competente.
- [ ] Grabar microvideos reales de procesos; controlar versiones y quién aprueba cambios.
- [ ] Crear lecciones cortas con fotos, video, pasos y preguntas de comprensión.
- [ ] Asignar cursos por puesto y registrar fecha, avance y evaluación; reentrenar cuando cambien recetas.
- [ ] No publicar recetas ni secretos comerciales en repositorio público.

### 5.2 Controles diarios y semanales
- [ ] «Abrir turno»: temperaturas de equipos, áreas listas, insumos y mise en place (según procedimientos aprobados).
- [ ] «Antes de servicio»: salsas y preparaciones identificadas, fechadas, en cantidad correcta.
- [ ] «Cerrar turno»: limpieza/desinfección, mermas, inventario crítico y checklist de cierre.
- [ ] «Semanal»: limpieza profunda, inventario físico, equipos/mantenimiento y auditoría de recetas.
- [ ] Cada revisión debe tener versión de checklist, encargado, hora del servidor, evidencia apropiada y estado.
- [ ] Registrar No conforme → acción correctiva → responsable → fecha límite → verificación posterior.
- [ ] Revisiones aleatorias y confirmación de supervisor; una casilla marcada o una foto no prueba cumplimiento.

### 5.3 Calidad remota de salsas
- [ ] Definir ficha y lote de elaboración con ID/QR, fecha, quién preparó, insumos y rendimiento.
- [ ] Registrar pesos y pasos críticos, y medidas objetivas cuando tengan justificación técnica.
- [ ] Agregar fotografía/video únicamente como evidencia complementaria.
- [ ] Crear pauta de evaluación sensorial presencial por responsable entrenado; registrar desviaciones.
- [ ] Establecer auditoría por muestreo y comparación con receta patrón; fotografías no certifican sabor.
- [ ] Control de cambios y aprobación de versión antes de introducir modificaciones.
- [ ] Alertas por lote no conforme y protocolo de retención/revisión definido con inocuidad.

### 5.4 Arquitectura y privacidad
- [ ] PWA mobile-first simple con PIN/credenciales individuales y roles de empleado, encargado, auditor y dueño.
- [ ] Supabase con RLS, registros auditables, copias de seguridad, almacenamiento privado y controles de eliminación.
- [ ] Subidas optimizadas desde Android/iPhone con señal débil; estado sin conexión y reintentos controlados.
- [ ] Dashboard remoto por sucursal, turno y fecha: tareas cumplidas, atrasos, hallazgos, acciones correctivas.
- [ ] Nada de «100% seguro» basado solo en autodeclaraciones; separar cumplido reportado de verificado.
- [ ] Reglas claras de privacidad de empleados y uso limitado de evidencias; acceso únicamente por rol.

## 6. Sistema transversal de experiencia y operación
- [ ] Una cuenta para propietario; permisos separados para marketing, gerente y colaboradores.
- [ ] Barra global simple: Inicio, Marketing, Plan Maestro, Academy, Control, Más.
- [ ] Búsqueda universal; enlaces internos sin duplicar archivos.
- [ ] Notificaciones útiles por vencimientos reales; evitar spam.
- [ ] Diseño modular: cada área con su propia navegación reducida y sin mezclar datos.
- [ ] Métricas: publicaciones realmente publicadas, tasa de error, pendientes vencidos, cumplimiento verificado, lotes no conformes, tiempo de corrección.
- [ ] Auditoría de seguridad de frontend/backend antes de uso con clientes, con permisos y backups probados.

## 7. Ventanas tentativas de ejecución (NO fechas comprometidas)
| Ventana | Entrega verificable | Puerta de salida |
|---|---|---|
| 4–8 nov | Auditoría de bibliotecas + scorecard inicial | Bugs reales clasificados |
| 9–16 nov | UX premium y notas/pendientes consistentes | CRUD y persistencia en 2 dispositivos |
| 12–23 nov | Gantt maestro + D-30 y campañas | Mover una tarea afecta calendario correctamente |
| 18 nov–6 dic | Postiz en entorno de prueba + comparación con Metricool | Publicación y métricas reales verificadas |
| 4 nov–25 dic | Campaña Navidad + editorial y prospección | Brief y contenido aprobados, no inventados |
| 2–16 dic | Academy: 3 recetas + 1 microcurso + 1 checklist piloto | Operador real puede usarlo |
| 16 dic–ene | Control de turnos, reportes y auditoría remota | Responsable confirma que es útil sin vigilancia excesiva |

## 8. Decisiones pendientes y siguientes 10 acciones
1. [ ] Crear repositorio privado propio para Slider Bros y mover el prototipo sin romper enlace.
2. [ ] Capturar respaldo y documentar pruebas del sitio actual.
3. [ ] Ejecutar batería de pruebas Fabric, FullCalendar, Chart.js, QR.
4. [ ] Completar matriz Postiz vs Metricool por red/función con evidencias.
5. [ ] Elegir el backend seguro y diseñar roles para notas, campañas y Academy.
6. [ ] Diseñar prototipo premium de Inicio, Notas, Pendientes y Plan Maestro.
7. [ ] Conectar Frappe Gantt a un esquema real de tareas, no a datos de muestra.
8. [ ] Crear proceso D-30 para Navidad 2026, marcando cualquier fase comprimida.
9. [ ] Preparar checklist de preguntas a responsable de cocina para 3 procedimientos piloto.
10. [ ] Validar con un operador real una primera lección y un checklist antes de ampliar Academy.

## 9. Criterios para declarar listo un módulo
- [ ] Prueba funcional repetible con datos reales o datos de prueba claramente identificados.
- [ ] Funciona en móvil y escritorio, incluyendo persistencia/recuperación.
- [ ] Acepta crear, editar, eliminar, filtrar y exportar cuando corresponda.
- [ ] Estados de error, autorizaciones y ausencia de conexión claros.
- [ ] Sin secretos expuestos, ni información privada en repositorios públicos.
- [ ] Responsable de negocio valida el flujo.
- [ ] Evidencia de pruebas y estado de liberación guardados.

### Referencias externas
- Metricool Free y diferencias: https://help.metricool.com/es/principales-diferencias-entre-los-planes-free-y-de-pago-bl0v9
- API Metricool: https://help.metricool.com/plans-add-ons-and-api-access-explained-xux1u
- Postiz: https://github.com/gitroomhq/postiz-app
- Frappe Gantt: https://github.com/frappe/gantt
- FullCalendar: https://fullcalendar.io/docs/event-dragging-resizing
- NOM-251-SSA1-2009 vigente: https://platiica.economia.gob.mx/normalizacion/nom-251-ssa1-2009/
- DOF NOM-251: https://sidof.segob.gob.mx/notas/docFuente/5133449
