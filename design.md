# Torre Fuerte — identidad visual y experiencia

## Posicionamiento
Taller local de motos en Puerto Escondido. Confianza, oficio, energía de carretera y atención directa. Nada de estética fintech, SaaS genérico, gradientes morados, vidrio translúcido o paneles futuristas. Una marca mecánica real, contemporánea y reconocible.

## Dos superficies, un mismo carácter
1. **Sitio público** (`index.html`): editorial automotriz. Una foto protagonista, titulares condensados monumentales, ritmo de secciones claro, llamadas a agendar y WhatsApp. Debe leerse de inmediato desde móvil, incluso con mala señal.
2. **Portal de operación** (`operacion/`): herramienta de trabajo silenciosa. Reducción de ruido, tablas legibles, formularios directos, estados y acciones explícitos. No trasladar el dramatismo del hero al flujo de guardar/editar órdenes.

## Tokens activos de marca
- Rojo de acción: `#d92f30`; rojo oscuro interactivo `#b52329`. Usar prioritariamente en acciones, folios y acentos.
- Carbón/negro de taller: `#171a1f` / `#191c21`.
- Blanco de lectura y grises de trabajo: `#fff`, `#f5f6f7`, líneas `#e1e4e7`.
- Titulares públicos: **Barlow Condensed 700–800**; texto público **Inter**. Portal: Inter / fuentes sistema, sin cargas adicionales innecesarias.
- Aristas rectas o radios pequeños (0–8 px) en la landing; en el portal radios discretos según función, no tarjetas dentro de tarjetas.
- Tipografía grande y contrastada; evitar etiquetas de 9 px para información imprescindible.
- Íconos funcionales consistentes, sin emojis decorativos.

## Reglas de composición anti-slop
- Una sola imagen dominante por sección, nunca fotos de stock colocadas para tapar espacios.
- Jerarquía nítida: kicker → titular → acción → apoyo, con espacio negativo real.
- Evitar grupos de seis tarjetas iguales como principal solución para todo. Utilizar listados editoriales, divisores y numeración cuando ayuden a escanear.
- Diseñar primero en 390 px, luego 320 y escritorio. Tap targets preferentemente ≥44 px y campos ≥48 px.
- No añadir nuevas barras de progreso, animaciones de scroll o shaders a una herramienta de trabajo.
- Evitar falsos testimonios y afirmaciones no verificadas. Las imágenes presentes son ilustrativas, no fotografías verificadas del taller.
- No crear una segunda biblioteca visual o CSS paralelo: modificar solo la fuente activa de cada superficie.

## Componentes y comportamientos irrenunciables
- Header móvil: logo + **AGENDAR** + menú, sin solapamiento a 320 px.
- Hero: servicio reconocible, llamada a acción visible.
- Formularios públicos: preservar IDs, `data-book`, validaciones y flujo existente.
- Portal: estados editables, guardar y feedback verdadero, comanda térmica, nota PDF, tour reiniciable, calendario y tabla.
- Impresión: conservar reglas `@media print` para `#printReceipt` a 76 mm; no introducir cabecera ni fondos al ticket.
- Accesibilidad: `:focus-visible`, etiquetas, contraste, teclado, diálogos y movimiento reducido.

## Revisión y aceptación
Capturar antes/después de ambas superficies en 390 y 1440 px cuando exista navegador. Verificar disposición móvil, consistencia, foco, formularios y tiempos de carga; no decir “100% verificado” sin evidencias. Si la herramienta no permite navegador, reportar explícitamente la ausencia de prueba visual.
