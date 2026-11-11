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
- **Responsable legal informado:** José Francisco Díaz Medina. El nombre comercial provisional no sustituye su identidad como responsable.
- **Aviso:** `aviso-privacidad.html` incluye a José Francisco Díaz Medina y el domicilio proporcionado; se mantiene como borrador hasta que el responsable apruebe el contenido y confirme el canal ARCO de WhatsApp **954 544 5822**. No activar el almacenamiento desde la web sin esa aprobación.

## Flujo vivo de cita web → WhatsApp + orden interna (10/11/2026)
- **Sin cambiar la experiencia del cliente.** Conserva exactamente los campos originales del formulario y el botón «Enviar solicitud por WhatsApp». Sin pedir teléfono adicional, sin segundo botón, sin mostrar folio ni confirmación añadida.
- Al pulsar el botón, empieza **en paralelo** una petición `fetch(...,{keepalive:true})` a `tf-create-request` y abre WhatsApp inmediatamente con el texto habitual del cliente, sin folio. **No se espera a Supabase** antes de abrir WhatsApp.
- El backend registra una **solicitud pendiente** en `tf_requests`. Postgres asigna el folio automáticamente; en el dashboard Operación el mecánico la identifica y confirma la cita cuando recibe el mensaje real por WhatsApp.
- El mismo folio se imprime como **comanda interna para la moto** y aparece en la **nota PDF para el cliente** cuando se cargan los precios. No existe segundo folio.
- Como el formulario original no pide teléfono, el campo de base se deja explícitamente como «Por confirmar en WhatsApp». El mecánico lo confirma cuando tiene contacto real; nunca inventar un número.
- Para evitar duplicados de doble clic, el sitio conserva la `idempotency_key` para el mismo formulario hasta 15 minutos.
- El sistema no puede verificar automáticamente si la persona **envió** su mensaje dentro de WhatsApp, solo si pulsó el botón del formulario. Por eso el estado inicial es `pendiente` y el personal confirma al recibir el mensaje.
- Protección: formulario honeypot, límite de solicitudes por hash diario de IP, RLS, validación de origen, longitud y fechas y ninguna lectura pública de clientes. Si la petición interna falla, WhatsApp continúa funcionando; no se muestra error al cliente.
- **Privacidad:** bajo el botón se muestra enlace al aviso; no se exige checkbox adicional para estos datos no sensibles y finalidades directamente relacionadas con el servicio. El aviso identifica a José Francisco Díaz Medina, domicilio comercial y WhatsApp 954 544 5822 como contacto ARCO.
- **ESTADO:** actualizaciones en la rama `main` publicadas a GitHub Pages: `index.html` y `aviso-privacidad.html`; función Edge `tf-create-request` v3 activa con `verify_jwt=false`. Comprobaciones estáticas pasadas; **pendiente una prueba real desde navegador y verificación de la fila recibida en Supabase**.

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
