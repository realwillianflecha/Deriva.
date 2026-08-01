# Deriva — Contexto de sesión (para retomar sin perder nada)

> Este archivo es un resumen de handoff, pensado para que una sesión nueva (o esta misma, después de comprimir el historial) pueda retomar el trabajo sin perder contexto importante que no vive en el código. El detalle técnico profundo (arquitectura, fórmulas, bugs encontrados) está en `docs/GAME_DESIGN.md` — este archivo es el complemento "quién es el usuario, cómo llegamos hasta acá, qué falta".

## Qué es el proyecto, en una frase

**Deriva**: simulador espacial educativo en 3D (Next.js + React Three Fiber) donde el jugador pilotea libremente una nave (mouse-look + WASD, primera/tercera persona) entre los **planetas rocosos del sistema solar** (Mercurio, Venus, Tierra, Marte — excluyendo los gaseosos), con decisiones narrativas y datos reales de la NASA/SpaceX en el camino.

**Importante — alcance real, no asumir que es "solo Marte":** hoy únicamente está construido el tramo Tierra→Marte. Mercurio y Venus son parte del plan pero no existen todavía en el código. No lo presentes como "el juego de Marte" ni bloquees decisiones de diseño asumiendo que Marte es el destino final.

## Quién es el usuario / cómo prefiere trabajar

- Habla en español rioplatense informal ("vos", "dale", "que onda"). Respondé en el mismo registro, sin acartonarse.
- Cero experiencia previa en desarrollo de videojuegos, pero sí en desarrollo web — el pedido explícito desde el arranque fue **explicar cada concepto nuevo con su equivalente de desarrollo web** (ej. WebGL ≈ DOM crudo, three.js ≈ React para WebGL, floating origin ≈ reseteo de scroll infinito). Mantené esto — es el objetivo pedagógico del proyecto, no un detalle de una sola vez.
- Le gusta iterar rápido y a veces delega decisiones de diseño explícitamente ("vos decidís", "tirame lo que pegue") — en esos casos, comprometeté con una recomendación concreta y justificada, no un menú de opciones.
- Cuando pregunta "por qué"/"explicame", quiere números concretos y razonamiento real, no una respuesta superficial — el estilo que funcionó fue: explicación con analogía web + números concretos (ej. la tabla de precisión de float32, el cálculo de ULP a distintas magnitudes).
- Valora que se verifique todo jugando/probando de verdad, no solo con build/lint limpios — varias veces encontramos bugs reales (no solo de balance) usando tests automatizados con Puppeteer simulando input real. Seguí haciendo esto antes de dar algo por confirmado.
- Pidió explícitamente no inicializar git hasta que él lo pidiera (lo pidió más adelante, ya está resuelto — ver abajo). Este tipo de instrucciones de secuenciación ("hacelo cuando yo diga") hay que respetarlas al pie de la letra.

## Repo / deploy

- GitHub: `https://github.com/realwillianflecha/Deriva..git` — **ojo, el nombre del repo tiene un punto al final** ("Deriva.", no "Deriva"), no es un typo a corregir, así lo creó el usuario y así está configurado el remoto local.
- Branch `main`, sin remoto de deploy configurado todavía (no se mencionó Vercel/hosting).
- No hay CI/CD ni tests automatizados — la verificación es manual + scripts puntuales de Puppeteer que se escriben y tiran en `scratchpad`, no viven en el repo.
- Último commit al momento de escribir esto: `92bca1c` — "Bump planet scale to 20k units, rebalance fuel consumption". Árbol de trabajo limpio.

## Timeline de esta sesión (orden real de los hechos)

1. **v1 — vertical slice inicial**: Next.js + R3F desde cero. Lanzamiento vertical tipo cohete (empuje vs. gravedad, Max-Q) + tránsito automático + aterrizaje tipo Lunar Lander + narrativa (briefing → llamarada solar → elegir sitio → debrief). Bug real encontrado y arreglado: `LANDING_THRUST` copiado del lanzamiento, 4x más fuerte que la gravedad marciana real → la nave se disparaba sin control.
2. **Rediseño a vuelo libre (v2)**: el usuario dijo que v1 "no se parece en nada a lo que quiero" — pidió cámara libre, movimiento en cualquier dirección, espacio más amplio, tamaños/texturas reales, cámara 1ra/3ra persona alternable. Se reemplazó toda la física vertical por un único `FlightController` (mouse-look + WASD, Pointer Lock API, sin gravedad planetaria, sin estados de choque). Se agregó un modelo real de nave (Falcon Heavy, CC-BY, de Poly Pizza) y texturas reales (Solar System Scope, CC BY) para Tierra/Marte/Sol/skybox.
3. **Pulido de sensación de vuelo**: el usuario reportó 3 problemas jugando de verdad — combustible insuficiente incluso con tanque extra, cámara que "se alejaba" al acelerar, giro demasiado rápido/poco realista. Causas reales encontradas: (a) bug de `clamp` que recortaba el bono de combustible extra a 100 en el primer frame, (b) `lerp` de posición de cámara que generaba arrastre visible, (c) rotación de la nave aplicada instantáneamente en vez de suavizada. Los tres se corrigieron (ver `GAME_DESIGN.md`).
4. **Nombre del proyecto**: pasó de "Misión Marte" (nombre de trabajo) a **"Deriva"** — decisión final del asistente a pedido explícito del usuario ("decidí vos, algo cool y original").
5. **Git + GitHub**: se inicializó el repo, se conectó al remoto que el usuario ya había creado en GitHub, primer push exitoso.
6. **Corrección de alcance**: al pedir nombre/descripción para el repo, el usuario aclaró que el juego es sobre **todos los planetas rocosos**, no solo Marte — corregido el nombre/descripción, guardado en memoria.
7. **Escala de planetas — 3 iteraciones**: el usuario notó que los planetas se veían chicos. Se explicó el trade-off real (precisión de punto flotante en WebGL, por qué escala 100% real es impracticable, qué es floating origin) y se subió la escala en pasos seguros y verificados: radio de la Tierra 150 → 6.000 → **20.000 unidades** (relación nave:planeta final ~2.850:1). Cada salto implicó recalcular en cadena: distancia Tierra-Marte, radio de "llegada" (`ARRIVAL_RADIUS`), plano lejano de cámara, tamaño del skybox, y velocidad de la nave (para que el viaje no se sienta eterno). Se verificó en cada paso que no hubiera parpadeo por precisión (float32) volando a velocidad máxima con boost.
8. **Combustible, segunda vuelta**: al agrandar la distancia, el combustible se agotaba en el viaje de ida. El usuario sugirió correctamente bajar la tasa de consumo en vez de inflar el tanque (cambio cosmético) — ya se había arrancado por ahí; se terminó de ajustar y se verificó con un test de viaje completo apuntando de verdad a Marte (lección de testing: sostener W sin apuntar con el mouse da métricas sin sentido, ya pasó dos veces).
9. **Pregunta sobre el Sol**: confirmado que es una esfera 3D real (`sphereGeometry` + `meshBasicMaterial`, no un sprite/PNG plano) — el aspecto "chato" viene de que `meshBasicMaterial` no tiene sombreado. Quedó **pendiente sin resolver**: el usuario preguntó si querés sumarle relieve/glow visual, no se implementó todavía (esperando confirmación).

## Estado actual del código (resumen — el detalle vive en GAME_DESIGN.md)

- Fases: `briefing` → `flight` (unificado, sin distinción launch/transit/landing) → `debrief`.
- Escala: `RADIUS_SCALE` en `src/content/planets/planetData.ts`, Tierra = 20.000 unidades, todo lo demás derivado o recalibrado a mano en cadena (ver punto 7 arriba y la sección "Escala de los planetas" en `GAME_DESIGN.md`).
- Controles: Pointer Lock + mouse-look con suavizado (slerp), WASD + Space/Ctrl + Shift boost, cámara 1ra/3ra persona con tecla `C`, zoom con rueda del mouse en 3ra persona.
- Sin física de terceros, sin gravedad planetaria sobre la nave, sin estados de fallo/choque en vuelo — combustible bajo = empuje reducido (15%), nunca corte total.
- Narrativa sin cambios de contenido desde el rediseño: briefing (elegir combustible) → llamarada solar a mitad de camino → elegir sitio en Marte (Jezero/Olympus) → debrief con datos + métricas de vuelo.

## Qué falta / próximos pasos posibles

- **Sin resolver, recién preguntado**: ¿sumarle relieve/glow visual al Sol?
- Pulido de sensación de vuelo pendiente de la lista original: conectar `leva` (instalado, sin usar) para tunear constantes en vivo; mejorar la cabina en primera persona (hoy son 3 cajas simples, se mencionó como placeholder tosco).
- Mercurio y Venus: no construidos. La fórmula de escala (`RADIUS_SCALE` + `REAL_RADIUS_KM`) ya está lista para sumarlos sin recalcular proporciones a mano — falta decidir sus posiciones (distancia comprimida, como se hizo con Marte) y descargar sus texturas.
- El mecanismo de "recolectar información" por planeta más allá de los datos narrativos que ya se desbloquean — mencionado como parte del alcance real del juego, todavía sin diseñar.
- Nada de sonido/música, sin soporte mobile/táctil, sin accesibilidad, sin persistencia/guardado — todo fuera de alcance a propósito hasta ahora, no evaluado si se suma más adelante.
