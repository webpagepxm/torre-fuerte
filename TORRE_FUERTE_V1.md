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
- **La pantalla del taller pide solo Usuario y Contraseña.** El usuario de este piloto es \`mecanicolider\`.
- Supabase Auth utiliza una dirección real del administrador **solo en el servidor**; el navegador nunca la recibe ni la necesita.
- \`tf-staff-login\` es una Edge Function (requiere \`verify_jwt=false\` porque ocurre antes del inicio de sesión). Comprueba en Supabase que \`mecanicolider\` sea personal autorizado, consulta su correo real de Auth en servidor, valida la contraseña mediante Supabase Auth y devuelve una sesión normal. No almacena contraseñas ni publica claves privadas.
- **No utilizar \`123456\` como contraseña de producción.** Se recomienda una contraseña única de al menos 12 caracteres, privada, que el titular pueda cambiar desde el botón **Cambiar clave**. Para una demo con contraseña simple solo usar datos ficticios.
- **Tutorial principal:** al entrar por primera vez, Driver.js presenta los botones principales. «¿Cómo funciona?» lo repite. El estado de primera visita se registra solo en el dispositivo mediante localStorage.
- **Tutorial dentro de la orden:** recorrido por estados, notas, conceptos, impresión y PDF, repetible con «Recorrido por cada botón». También hay guía escrita desplegable.

## Configuración necesaria ANTES de usar con datos reales
1. **Hecho:** proyecto Supabase \`torre-fuerte\` dentro de \`webpagepxm\`, separado de Denbou y SOMMO.
2. **Hecho:** tres tablas iniciales, RLS y columna \`tf_staff.username\`, con autorización de personal y denegación de lectura anónima.
3. **Hecho:** cuenta Auth del administrador creada y correo confirmado; usuario visible \`mecanicolider\` autorizado en \`tf_staff\`.
4. **Hecho:** \`tf-staff-login\` desplegada, el portal utiliza esta función y el correo real no figura en el código público.
5. **Hecho:** \`tf-create-request\` sigue bloqueada con \`verify_jwt=true\`. Aún no abrir el formulario público a solicitudes.
6. **Hecho:** \`tf-config.js\` contiene solo Supabase URL y publishable key (públicas).
7. **Pendiente:** verificar el inicio de sesión con la contraseña en Android/navegador; crear órdenes de prueba, comprobar calendario, PDF, impresión y tutorial.
8. **Pendiente:** implantar límites de intentos de login efectivos antes de exposición pública y revisar la advertencia de protección contra contraseñas filtradas en Supabase.
9. **Pendiente:** finalizar aviso de privacidad y protección contra bots antes de permitir la recepción pública de solicitudes.
10. **Pendiente:** publicar en GitHub Pages después de pruebas. El PR sigue en borrador.

## Datos de contacto del taller para el aviso de privacidad (10/11/2026)
- **Nombre comercial provisional:** Torre Fuerte de Puerto Escondido.
- **Domicilio informado:** Calle 29 de Octubre, La Guayabillera, C. P. 70934, La Barra de Colotepec, Oaxaca, México.
- **WhatsApp de contacto visible en la página:** 954 544 5822 (aún debe confirmarse como canal formal de privacidad).
- **Falta:** confirmar nombre legal de la persona física o razón social responsable del tratamiento. El nombre comercial provisional no se presenta como identidad legal.
- **Aviso:** `aviso-privacidad.html` ahora tiene texto completo para revisión, señalizado expresamente como borrador. **No activar almacenamiento de solicitudes desde la página pública hasta aprobarlo.**

## Folio automático desde la página pública (solicitud de cita)
- **Un solo folio:** `tf_requests.folio` lo asigna Postgres en el momento de insertar la solicitud, incluso antes de confirmar la cita.
- **Mismo folio para tres momentos:** solicitud web, comanda para pegar en la moto y nota de servicio PDF para el cliente. **La nota no crea otro folio.**
- La interfaz pública de la rama de desarrollo ya incluye teléfono, consentimiento de almacenamiento, campo anti-bot, validación de fecha y envío a `tf-create-request`.
- Al recibir respuesta correcta, muestra el folio grande y propone enviarlo a WhatsApp. El usuario no necesita mandar WhatsApp para que el registro llegue a Supabase.
- Si ocurre un error de red se puede reintentar sin duplicar la solicitud gracias a `idempotency_key`. Si cambia el formulario, genera un nuevo identificador.
- `tf-create-request` valida y registra únicamente solicitudes. Añadimos límite por teléfono y por huella técnica de IP (hash diario, sin conservar IP legible) usando `tf_booking_allow`, con RLS y privilegios solo `service_role`.
- **ESTADO:** solo está implementado en la rama `feature/comandas-v1-calendario-20261110`. La función desplegada tiene `verify_jwt=true`, por lo que NO se reciben aún citas públicas; la web actual `main` sigue enviando solicitudes solo por WhatsApp.
- **Para activar:** primero sustituir el aviso de privacidad borrador por uno final aprobado por el responsable, incluyendo razón social/nombre legal, domicilio y contacto de privacidad. Después actualizar `index.html` de `main` y publicar la función con `verify_jwt=false`. Nunca exponer claves secretas; probar con información ficticia y confirmar folio + tabla Operación.
- No publicitar una cita como confirmada hasta que el mecánico cambie su estado a `confirmada`.

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
- La rama de GitHub es **desarrollo**, no producción. Supabase ya está configurado; aún falta validar el inicio de sesión y el recorrido completo en navegador.
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
