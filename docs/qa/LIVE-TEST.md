# Prueba del Supabase real

El usuario confirmó que el proyecto actual está en construcción, sin órdenes reales, y autorizó probar sobre ese mismo proyecto. No hace falta crear otro proyecto de Supabase. Esta autorización de la conversación no convierte la prueba en un paso automático para futuras tareas.

`tests/live-supabase.mjs` usa el SDK oficial 2.95.0 y el mismo módulo `operacion/service-lines.mjs` que la aplicación. Crea una orden ficticia marcada `PRUEBA CODEX TF-QA-…`, añade mano de obra/refacción, verifica importes por lectura posterior, edita, recupera, cambia estado y elimina un concepto. Todas las modificaciones se limitan al ID creado en esa ejecución; para modificar/eliminar la orden también se comprueba su nombre exacto de prueba.

La limpieza intenta quitar los conceptos y cancelar la orden de prueba aunque falle el desglose. Si el rol permite eliminar la orden, también la elimina; si no, conserva únicamente esa orden cancelada y lo informa. Nunca se borra una tabla ni se cambian permisos/esquema. La sesión creada por el test se cierra con scope local para no cerrar las otras sesiones del taller.

## Requisito pendiente

El secreto TF_STAFF_PASSWORD ya está aplicado: la observación del entorno lo marca ready y la variable está presente. El usuario `mecanicolider` forma parte del contrato del portal; la clave publicable no permite iniciar su sesión. No se imprime ni se guarda el valor de la contraseña.

Añadir por los ajustes de secretos HTTP del entorno un secreto llamado `TF_STAFF_PASSWORD`, con variable del mismo nombre y destino permitido `pmeomhohqgdgaygkbeoe.supabase.co`. El valor es la contraseña del portal y debe introducirse en la interfaz segura, nunca en chat ni en el repositorio. El intento de declarar este requisito mediante la herramienta de borrador no pudo confirmar persistencia (`INVALID_ARGUMENT`).

## Ejecución autorizada

Herramientas de prueba aisladas fuera del checkout:

```sh
npm_config_cache=/tmp/tf-npm npm install --prefix /tmp/tf-live-tools --no-audit --no-fund --ignore-scripts @supabase/supabase-js@2.95.0
node --use-env-proxy tests/live-supabase.mjs --allow-test-records
```

Para comparar el transporte está disponible `TF_LOGIN_TRANSPORT=curl` antes del comando Node. La contraseña se pasa a curl por stdin, nunca por argumentos ni archivos. Node conserva el proxy y TLS del entorno. La contraseña se usa únicamente en la solicitud HTTPS de inicio de sesión; los tokens quedan en memoria, sin almacenamiento persistente de Auth. Los resultados y el identificador del registro ficticio se guardan en `/tmp/torre-fuerte-qa/live`, sin credenciales.

**Estado:** script preparado y sintaxis aprobada. Sin credencial devuelve salida 78 sin peticiones ni registros. Con el secreto ya aplicado, la primera solicitud sin Origin recibió 403; se confirmó que tf-staff-login exige el origen del sitio y se añadió Origin: https://webpagepxm.github.io al runner. El intento corregido recibió HTTP 401 en el inicio de sesión. No se creó ninguna orden y no se ejecutaron escrituras. El usuario confirmó que sí puede entrar al portal. Se compararon Node fetch y curl, ambos conservando proxy/CA y Origin: ambos recibieron 401 desde el runner. La causa exacta de la diferencia con el navegador sigue sin confirmar; no se afirma que la contraseña sea incorrecta ni que el proxy sustituya valores dentro del JSON. No se repiten intentos sin nueva evidencia. El escritorio compartido no ofrece herramientas de control y cloud-agent-desktop informa Orbit desktop is unavailable. Se propone comprobar el guardado manualmente desde la sesión del usuario. El guardado real continúa pendiente.
