# TORRE FUERTE — FASE 1 / PORTAL DE OPERACIÓN

## Qué se construyó
- **Web de clientes:** se conserva en la raíz. El formulario #form-cita ya existía.
- **Portal privado:** /operacion/ (landing de acceso, tablero y calendario).
- **Solicitudes con folio TF-000001:** la base debe generarlo y conservarlo.
- **Tabla tipo Excel:** búsqueda, filtros, exportación CSV.
- **Tickets blancos:** botón Imprimir para 80 mm o impresión a PDF.
- **Notas de servicio:** desglose de trabajos y piezas, PDF descargable o compartible cuando Android lo permite.
- **Registro manual:** el taller también puede dar de alta una orden que no provenga de la web.

## Configuración necesaria ANTES de usar con datos reales
1. Crear un proyecto Supabase *independiente* llamado Torre Fuerte. No usar ni modificar bases de Callejero o SOMMO.
2. Ejecutar y revisar \`supabase/migrations/001_comandas_v1.sql\` desde SQL Editor (o herramienta de migraciones). Verificar que todas las tablas tienen RLS y que las claves secretas nunca estén en GitHub.
3. Activar Auth correo/contraseña. Crear manualmente el usuario del taller y anotar su UUID de Auth.
4. Autorizarlo en el SQL Editor como administrador de este único taller:
   \`insert into public.tf_staff(user_id) values ('UUID_DEL_USUARIO_DEL_TALLER');\`
5. Desplegar \`supabase/functions/tf-create-request/index.ts\` como función \`tf-create-request\` con verificación JWT desactivada; el propio endpoint valida los campos. Verificar que \`SUPABASE_URL\` y la clave secreta de Supabase existen **solo en servidor**.
6. Completar en \`tf-config.js\` la URL pública del nuevo proyecto y su publishable key. Son valores públicos; **nunca** incluir service_role ni secret.
7. Confirmar nombre del responsable del tratamiento, contacto y aviso de privacidad antes de activar la captura pública de teléfonos.
8. Verificar que el hosting GitHub Pages publique el contenido del directorio /operacion/ y la configuración.
9. Probar todo con información ficticia. No utilizar datos reales antes de completar el aviso de privacidad y probar permisos.

## Prueba de extremo a extremo
- Enviar cita desde #form-cita → la función devuelve folio → aparece en /operacion/ tras iniciar sesión.
- Reenviar la misma petición/idempotency_key → debe devolver el mismo folio sin crear duplicado.
- Verificar estado inicial pendiente (una solicitud NO es una cita confirmada).
- Registrar orden manual; filtrar por cliente, fecha y estado; usar CSV; comprobar caracteres y fórmulas peligrosas en el export.
- Imprimir comanda desde Chrome Android y probar la impresora real. La web abre diálogo de impresión; **no imprime silenciosamente**.
- Añadir mano de obra/refacciones y confirmar total → guardar → generar PDF → usar compartir nativo Android o descargar y adjuntar.
- Intentar entrar con usuario autenticado no incluido en tf_staff: debe rechazarse.
- Intentar leer la tabla sin sesión y desde el cliente público: debe ser imposible.

## Limitaciones iniciales
- La rama de GitHub es **desarrollo**, no producción. El portal no tiene datos reales hasta configurar Supabase.
- La función pública tiene validación, honeypot y limitación por número telefónico, pero no un rate limiter perimetral por IP; para exponerla a tráfico público, implementar protección de bots y limitación robusta (por ejemplo Turnstile o gateway).
- Se muestran las primeras 1000 solicitudes en el panel; si crece, agregar paginación desde servidor.
- El PDF es nota de servicio, no CFDI/factura fiscal.
- La fecha/hora son solicitudes; el mecánico debe confirmar.
- El ticket de 80 mm requiere probar el modelo concreto de impresora.
- La web pública debe actualizar su formulario para guardar en la función; no basta con desplegar la base.
- Para un SaaS multinegocio se necesitarán restricciones por taller/tenant; NO mezclar datos de clientes diferentes en estas tablas.

## Librerías
FullCalendar Standard (MIT), Tabulator (MIT), pdfmake (MIT), Supabase JS. Inspeccionar versiones/licencias antes de producción. Evitar cargar librerías de un CDN desconocido en entornos sensibles.

## Fuentes
Repositorio: webpagepxm/torre-fuerte.
