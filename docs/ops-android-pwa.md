# Instalar Torre Fuerte Ops en Android

## Instalación en el teléfono del taller

1. En Chrome para Android, abre **https://webpagepxm.github.io/torre-fuerte/operacion/**.
2. En el menú de tres puntos, toca **Instalar app**. Según el modelo de Android o la versión de Chrome, el menú puede decir **Agregar a pantalla principal**.
3. Confirma. Busca el ícono dorado de Torre Fuerte en el inicio o cajón de aplicaciones.
4. Abre la app; el acceso directo inicia específicamente en **/operacion/**, no en la web de clientes.
5. Inicia sesión con la cuenta existente del taller. No hay usuario o contraseña nuevos.

## Funcionamiento

- Es una Progressive Web App: instala un acceso directo con ventana independiente y actualiza el contenido desde la misma web.
- **Necesita internet:** no hay acceso ni guardado local de órdenes, notas, clientes ni contraseñas. Por seguridad, no se registra un Service Worker ni se precachea HTML del portal.
- Si el teléfono muestra **Agregar a pantalla principal** en vez de **Instalar app**, ese acceso directo también permite abrir Ops; el comportamiento exacto depende de la versión de Chrome y Android.
- Los cambios de la web se reciben al volver a abrir o actualizar, sujetos a la caché normal del navegador.
- No requiere Play Store, APK ni cambiar la base de datos.

## Implementación

- `operacion/manifest.webmanifest`: identificador, inicio `./`, alcance exclusivo `./`, modo `standalone`, nombre y colores.
- `operacion/icons/torre-fuerte-192.png` y `torre-fuerte-512.png`: imágenes de tamaño real, generadas con el emblema de torre/engrane en la paleta dorada y carbón.
- `operacion/index.html`: enlaces al manifiesto y touch icon; sin cambios de lógica, RLS, sesiones o rutas del taller.
- Verificación sin backend: `node --test tests/pwa.test.cjs`.

## Prueba presencial

Al instalar, validar el inicio de sesión real, el listado de órdenes, el calendario, la confirmación de cita y la impresión o descarga del ticket en el Android del mecánico. La instalación no valida por sí misma esos flujos.
