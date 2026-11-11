# Rulo en Torre Fuerte Ops · revisión

**Rama de revisión, sin publicar en producción.** Las seis ilustraciones están integradas en la app existente con WebP preferido y PNG de respaldo. Se conserva el diseño y las funciones del taller.

Estas capturas proceden del navegador y usan datos ficticios aislados, sin insertarlos en Supabase. Despliega cada escena para revisar móvil y escritorio; pulsa una imagen para verla a tamaño completo.

<details open>
<summary><strong>Acceso</strong></summary>

Rulo acompaña al formulario; Entrar sigue visible en móvil.

**Móvil · 390 px**

![Acceso en móvil](qa/rulo/after/login-390.png)

**Escritorio · 1440 px**

![Acceso en escritorio](qa/rulo/after/login-1440.png)

[Antes: móvil](qa/rulo/before/login-390.png) · [Antes: escritorio](qa/rulo/before/login-1440.png)

</details>

<details>
<summary><strong>Taller sin órdenes</strong></summary>

Solo aparece después de una consulta correcta sin registros.

**Móvil · 390 px**

![Taller sin órdenes en móvil](qa/rulo/after/orders-empty-390.png)

**Escritorio · 1440 px**

![Taller sin órdenes en escritorio](qa/rulo/after/orders-empty-1440.png)

[Antes: móvil](qa/rulo/before/orders-empty-390.png) · [Antes: escritorio](qa/rulo/before/orders-empty-1440.png)

</details>

<details>
<summary><strong>Sin solicitudes para hoy</strong></summary>

Acompaña la agenda vacía; las órdenes existentes siguen visibles.

**Móvil · 390 px**

![Sin solicitudes para hoy en móvil](qa/rulo/after/agenda-empty-390.png)

**Escritorio · 1440 px**

![Sin solicitudes para hoy en escritorio](qa/rulo/after/agenda-empty-1440.png)

[Antes: móvil](qa/rulo/before/agenda-empty-390.png) · [Antes: escritorio](qa/rulo/before/agenda-empty-1440.png)

</details>

<details>
<summary><strong>Búsqueda sin coincidencias</strong></summary>

Usa la escena de carpeta/lupa sin inventar un módulo de historial.

**Móvil · 390 px**

![Búsqueda sin coincidencias en móvil](qa/rulo/after/search-empty-390.png)

**Escritorio · 1440 px**

![Búsqueda sin coincidencias en escritorio](qa/rulo/after/search-empty-1440.png)

[Antes: móvil](qa/rulo/before/search-empty-390.png) · [Antes: escritorio](qa/rulo/before/search-empty-1440.png)

</details>

<details>
<summary><strong>Servicio finalizado</strong></summary>

Aparece al confirmar Lista/Entregada; la acción de nota permanece disponible.

**Móvil · 390 px**

![Servicio finalizado en móvil](qa/rulo/after/complete-390.png)

**Escritorio · 1440 px**

![Servicio finalizado en escritorio](qa/rulo/after/complete-1440.png)

[Antes: móvil](qa/rulo/before/complete-390.png) · [Antes: escritorio](qa/rulo/before/complete-1440.png)

</details>

<details>
<summary><strong>Sin conexión</strong></summary>

Apoya el aviso escrito; la imagen está disponible al quedar offline.

**Móvil · 390 px**

![Sin conexión en móvil](qa/rulo/after/offline-390.png)

**Escritorio · 1440 px**

![Sin conexión en escritorio](qa/rulo/after/offline-1440.png)

[Antes: móvil](qa/rulo/before/offline-390.png) · [Antes: escritorio](qa/rulo/before/offline-1440.png)

</details>

[Informe de integración y pruebas](rulo-integration.md) · [Resultados de estados, geometría y accesibilidad](qa/rulo/results.json).
