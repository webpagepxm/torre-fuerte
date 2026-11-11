# Torre Fuerte

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Producto existente con HTML, CSS y JavaScript nativos. GitHub Pages desde `main`; sin framework ni build de aplicación. La landing tiene estilos y lógica embebidos en `index.html`; OPS utiliza `operacion/index.html`, `style.css`, `app.js` y `service-lines.mjs`.

## Users

- Motociclistas que buscan mantenimiento o reparación en Puerto Escondido y contactan por WhatsApp.
- Personal del taller que recibe motos, revisa solicitudes, actualiza órdenes y prepara comprobantes. El usuario ha indicado como escenario principal un Android de gama media y operadores sin experiencia con software administrativo.

## Product Purpose

Facilitar la solicitud de atención y organizar el trabajo del taller, identificando cada moto, su servicio y su estado. Éxito: poder solicitar, localizar, actualizar e imprimir sin ambigüedad ni pérdida de datos.

## Operating Context

Solicitar una fecha/franja es distinto de confirmar la cita. Abrir WhatsApp con un mensaje no acredita que se haya enviado. El taller acuerda disponibilidad con el cliente.

Una comanda interna de 76 mm identifica la moto y el trabajo, sin precios. La nota de servicio PDF para el cliente incluye conceptos y total MXN. Ninguna es una factura fiscal. Las notas internas se excluyen del documento del cliente.

## Capabilities and Constraints

- Formulario de cita: consentimiento, validación, apertura de WhatsApp y registro paralelo mediante `tf-create-request`; digest y clave idempotente en sesión.
- Alta de cliente y consulta de historial/beneficios: preparan mensajes de WhatsApp; no crean cuentas ni muestran expedientes en público.
- OPS: autenticación por usuario/contraseña mediante `tf-staff-login`, sesión y comprobación de rol `tf_staff`; listado/búsqueda/filtros, recepción manual, estados/notas, calendario, CSV, conceptos y notas PDF, impresión y tutorial.
- Supabase remoto: `tf_requests`, `tf_staff`, `tf_service_lines`. Configuración pública en `tf-config.js`. No hay fuentes de Edge Functions ni políticas RLS en este repositorio.
- La lista consulta hasta 1000 órdenes. Clientes y motos se capturan por orden; no hay catálogos ni historial unificado por vehículo.
- El guardado REST de conceptos no es una transacción; mantener validación, verificación y protección ante respuestas inciertas.
- No cambiar autenticación, esquema, endpoints, validaciones, contenido/parámetros de WhatsApp ni reglas operativas por una intervención visual.
- No introducir modo demo en el producto ni escribir datos ficticios en producción. Las pruebas usan fixtures aislados.

## Routes and Boundaries

- `/`: sitio público y tres formularios de contacto.
- `/operacion/`: portal real del personal, protegido por sesión.
- `/aviso-privacidad.html`: aviso de privacidad existente.
- `/seguimiento/`: presentación temporal de avances; no es portal de cliente conectado ni consulta privada por enlace.
- `/vista-previa.html`: superficie histórica de demostración, no fuente del producto activo.
- `/sliderbros-studio/`: producto independiente para otra marca; fuera de esta intervención.
- Enlaces de teléfono, mapa, reseñas de Google y vCard pertenecen a la landing. No se encontró un flujo activo de QR para órdenes o clientes; no inventarlo.

## Brand Commitments

Nombre, emblema, identidad de taller de motocicletas, carbón y rojo existentes. Refinamiento visual sobre el producto actual, no reconstrucción ni sustitución de funcionalidades por maquetas. La portada admite mayor expresión; la operación prioriza legibilidad y rapidez.

## Evidence on Hand

Código activo, `AGENTS.md`, auditorías/capturas previas, pruebas de navegador y conceptos. Imágenes actuales generadas e identificadas como ilustrativas; no presentarlas como fotografías reales del taller. Confirmado por el usuario: continuar con las instrucciones recibidas; conservar lo que funciona.

## Accessibility and Validation

Objetivos táctiles de al menos 44 px y campos de 48 px. Teclado, foco visible, etiquetas, estados escritos y movimiento reducido. Comprobar 320, 375, 390, 430, 768, 1280 y 1440 px; distinguir emulación Chromium de Android físico. Compartir nativo, impresora y RLS remotas requieren pruebas específicas.
