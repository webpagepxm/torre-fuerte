# TORRE FUERTE — FASE 1 / PORTAL DE OPERACIÓN

## Qué se construyó
- **Web de clientes:** se conserva en la raíz. El formulario #form-cita ya existía.
- **Portal privado:** /operacion/ (landing de acceso, tablero y calendario).
- **Solicitudes con folio TF-000001:** la base debe generarlo y conservarlo.
- **Tabla tipo Excel:** búsqueda, filtros, exportación CSV.
- **Tickets blancos:** botón Imprimir para 80 mm o impresión a PDF.
- **Notas de servicio:** desglose de trabajos y piezas, PDF descargable o compartible cuando Android lo permite.
- **Registro manual:** el taller también puede dar de alta una orden que no provenga de la web.

## Autenticación y tutorial para entrega V1
- **La pantalla del taller pide solo Usuario y Contraseña.** El único usuario visible de este piloto es \`mecanicolider\`.
- Supabase Auth exige una identidad de correo o teléfono internamente. Para mantener la experiencia solicitada, la interfaz transforma \`mecanicolider\` al alias técnico \`mecanicolider@torre-fuerte.example\`. **Este alias NO es una dirección de correo operativa** y no sirve para recuperación por email.
- El alias no es una contraseña ni un dato secreto; el acceso real requiere contraseña y que el UUID del usuario esté autorizado en \`tf_staff\`.
- **NO utilizar \`123456\` como contraseña de producción.** Almacenar teléfonos y notas obliga a una contraseña de al menos 12 caracteres, privada, que el taller podrá cambiar con **Cambiar clave**. Para un acceso de demostración con clave simple habría que usar exclusivamente información ficticia.
- Si el propietario desea recuperación autónoma por correo más adelante, utilizar una dirección real controlada por él detrás del usuario visible, actualizando \`STAFF_AUTH_EMAIL\` en \`operacion/app.js\`.
- **Tutorial principal:** al entrar por primera vez en el dispositivo, Driver.js presenta los botones principales. El botón «¿Cómo funciona?» lo vuelve a mostrar siempre. La visita se registra solo en localStorage (no afecta datos del taller).
- **Tutorial de cada orden:** al abrir una orden por primera vez, una guía contextual enseña cómo cambiar el estado, guardar notas, añadir conceptos, imprimir y crear/compartir PDF. «Recorrido por cada botón» permite repetirlo siempre; existe también una guía escrita desplegable.

## Configuración necesaria ANTES de usar con datos reales
1. Proyecto **torre-fuerte** ya creado en Supabase bajo **webpagepxm**, independiente de Denbou y SOMMO.
2. Tablas \`tf_staff\`, \`tf_requests\`, \`tf_service_lines\` creadas con RLS. La revisión de seguridad inicial no reportó alertas.
3. **Pendiente:** crear usuario en Supabase → Authentication → Users → Add user / Create new user. Usar email interno \`mecanicolider@torre-fuerte.example\` (confirmar usuario administrativamente, no intentar enviarle correo) y contraseña privada fuerte. Si el proveedor rechaza un dominio reservado, sustituirlo por una cuenta real controlada por el propietario y actualizar el alias en app.js. No compartir nunca la contraseña por GitHub ni por este chat.
4. **Pendiente:** copiar UUID de ese usuario creado en \`auth.users\` y autorizarlo una sola vez en SQL Editor: \`insert into public.tf_staff(user_id) values ('UUID_DEL_USUARIO');\`. El UUID es del usuario real recién creado, no un valor inventado.
5. La Edge Function \`tf-create-request\` está desplegada **con verify_jwt=true temporalmente**. El formulario público aún no está activado para enviar solicitudes; antes de abrirla a anónimos, añadir protección antispam robusta y completar aviso de privacidad. Solo entonces volver a desplegar con \`verify_jwt=false\`.
6. \`tf-config.js\` ya tiene la **URL pública y publishable key** del proyecto exclusivo Torre Fuerte. Nunca incluir ninguna service_role ni key secreta en archivos del repositorio.
7. **Pendiente:** confirmar nombre del responsable del tratamiento, contacto y aviso de privacidad antes de activar la captura pública de teléfonos.
8. **Pendiente:** publicar rama tras pruebas en GitHub Pages \`/torre-fuerte/operacion/\`. El código actual de la función y panel todavía no se ha probado de extremo a extremo contra una sesión autorizada.
9. **Pendiente:** probar todos los botones, PDFs, impresión desde Android y compartir WhatsApp, antes de entregar el sistema.

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
FullCalendar Standard (MIT), Tabulator (MIT), pdfmake (MIT), Driver.js (MIT), Supabase JS. Inspeccionar versiones/licencias antes de producción. Evitar cargar librerías de un CDN desconocido en entornos sensibles.

## Fuentes
Repositorio: webpagepxm/torre-fuerte.
