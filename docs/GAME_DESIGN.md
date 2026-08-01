# Deriva — Documento de diseño (vivo)

> Este documento se actualiza a medida que avanza el proyecto. No es una foto única: reflejá acá cada decisión y cambio de rumbo real.

## Qué es

Simulador espacial educativo para web: vuelo libre real en 3D (mouse-look + WASD, cámara primera/tercera persona) de la Tierra a Marte, combinado con un modo historia (decisiones narrativas que dan contexto y enseñan datos reales de la NASA/SpaceX). Construido para aprender desarrollo de videojuegos partiendo de experiencia en desarrollo web (Next.js/TypeScript/React/Tailwind).

## Estado actual — v2: rediseño a vuelo libre

**Completo y verificado** (build de producción limpio, `tsc`/`lint` limpios, playthrough probado de punta a punta vía Puppeteer con clicks reales — necesario porque Pointer Lock exige un gesto de usuario genuino, no un `.click()` sintético):

- Flujo: Briefing (elegir combustible) → **vuelo libre pilotado** (mouse-look para apuntar la nave, WASD + Espacio/Ctrl para moverse en cualquier dirección, Shift para impulso) → evento narrativo de llamarada solar a mitad de camino → llegada a Marte por proximidad → elegir sitio (Cráter Jezero vs. Olympus Mons) → Mission Debrief.
- Cámara alternable con tecla `C`: tercera persona (sigue a la nave, gira con su orientación) / primera persona (cabina simple, mouse-look = vista 1:1).
- Modelo real de nave: "SpaceX Falcon Heavy" (Poly Pizza, CC-BY 3.0) reemplazando los primitivos cono+cilindro de v1.
- Texturas reales (Solar System Scope, CC BY 4.0): Tierra (día + nubes), Marte, Sol, skybox de la Vía Láctea — reemplazando las esferas de color plano de v1.
- Escala real Tierra:Marte (ratio 0.53) — Tierra con 6.000 unidades de radio (relación nave:planeta ~857:1), Marte a ~42.000 unidades de distancia. Ver la sección "Escala de los planetas" más abajo para el porqué de estos números y por qué no son 100% reales.
- Sin física de lanzamiento/aterrizaje vertical, sin estados de choque/reintento — combustible bajo = empuje reducido (15%), nunca corte total, para que nunca quede el jugador varado.
- Brújula en pantalla (`TargetCompass.tsx`) que apunta hacia Marte cuando está fuera de cuadro — necesaria porque en espacio abierto 3D es fácil perderse.
- Misma narrativa de v1 (2 decisiones + elección de sitio, 7 datos reales), con los textos que describían mecánicas viejas (Max-Q, aterrizaje manual) reescritos para el nuevo esquema.

## Por qué se rediseñó (contexto para no repetir el camino)

La v1 (lanzamiento vertical tipo cohete real + aterrizaje tipo Lunar Lander) funcionaba y estaba bien pulida, pero no era lo que el usuario tenía en mente: pidió cámara libre, poder mover la nave "a cualquier dirección", más amplitud y tamaños/texturas reales. Se reemplazó por completo la física 1D/2D de lanzamiento/aterrizaje por un único controlador de vuelo libre usado en todo el juego — ver el plan completo en `C:\Users\Flecha\.claude\plans\humming-doodling-thimble.md` para el razonamiento detallado (incluye por qué "aterrizar" pasa a ser un disparador por proximidad en vez de una física de touchdown, por qué no hay gravedad planetaria sobre la nave, y por qué se descartó el interior de cabina modelado a favor de un marco simple).

## Cómo correrlo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Controles: click en la pantalla para tomar el mouse ("Pointer Lock"), luego mouse para apuntar, W/S adelante/atrás, A/D lateral, Espacio/Ctrl subir/bajar, Shift impulso, C alterna cámara, Escape libera el mouse.

## Stack

| Pieza | Para qué |
|---|---|
| Next.js 16 (App Router) + React 19 + TypeScript | Base del proyecto |
| Tailwind v4 | Estilo del HUD (DOM), nunca toca la escena 3D |
| `three` + `@react-three/fiber` | Motor 3D expuesto como componentes React |
| `@react-three/drei` | Helpers (`Stars`, `Loader`, `useTexture`, `useGLTF`) |
| `zustand` | Dos stores: `gameStore` (estado de juego/narrativa) y `uiStore` (preferencia de cámara, no se resetea con la partida) |
| `framer-motion` | Animaciones de paneles del HUD |
| `leva` (instalado, no usado activamente todavía) | Pensado para tunear constantes de física en vivo durante el pulido |
| `gltfjsx` (dev, vía `npx`, no es dependencia del proyecto) | Se usó una vez para generar `src/components/scene/generated/FalconHeavyModel.tsx` a partir del `.glb` descargado |

## Escala de los planetas (importante para cuando se sume el resto del sistema solar)

`src/content/planets/planetData.ts` usa dos factores de escala **independientes**, no números sueltos por planeta:

- **`RADIUS_SCALE`** (unidades de escena por km real): se aplica por igual a todos los cuerpos, así que las proporciones reales entre planetas se preservan automáticamente (Marte siempre da ~0.53x el radio de la Tierra, y cuando se sume Júpiter va a dar ~11x sin calcular nada a mano — solo hace falta agregar su radio real en km a `REAL_RADIUS_KM`). Pasó por dos calibraciones: 150 unidades para la Tierra en el primer pase (se sentía chico), **6.000 unidades en el segundo pase** (~40x más grande, relación nave:Tierra de ~857:1) — todavía lejos de la relación 100% real (~91.000x), pero cómodamente dentro del rango seguro de precisión de un float de 32 bits (ver más abajo). A escala 100% real la Tierra sería ~91.000 veces más grande que la nave, un número que exigiría reescribir el motor de vuelo con la técnica de "floating origin" (recentrar el mundo alrededor de la nave cada tanto en vez de dejar crecer las coordenadas absolutas — lo mismo que hacen Kerbal Space Program o Elite Dangerous). Además, de cerca un planeta a escala 100% real se ve casi plano (la curvatura real es imperceptible a la distancia de un aterrizaje), así que ni siquiera daría el efecto dramático buscado.
- **Por qué no fuimos más lejos que 6.000**: un float32 tiene ~7 cifras significativas de precisión — a magnitudes de cientos de miles de unidades, el "escalón" mínimo representable empieza a acercarse al tamaño de la propia nave (7 unidades) y aparece jitter visible, sobre todo al calcular `posición del objeto - posición de la cámara` (dos números grandes y casi iguales, resta que amplifica el error de redondeo). A las magnitudes que usamos (decenas de miles, no cientos de miles) el escalón de precisión es de milésimas de unidad — verificado en la práctica volando a boost (~1.175 u/s) sin ningún parpadeo visible.
- **Distancia Tierra-Marte**: deliberadamente NO escalada por el mismo factor que el radio — es una escala de distancia aparte, mucho más comprimida (si usáramos la distancia real de 225 millones de km con `RADIUS_SCALE`, el viaje sería intransitable). Quedó en ~42.000 unidades (antes ~14.000) — subió menos que el radio (40x) porque los planetas más grandes ya no necesitan tanta distancia relativa para sentirse "vastos"; lo vasto ahora lo da el tamaño en la aproximación final.
- **Consecuencia directa**: al triplicar la distancia, se subió también la velocidad de la nave (`SHIP_MAX_SPEED` 320→520, boost 700→1200, `SHIP_BASE_ACCEL` 85→110) para que el viaje no se sienta eterno, y `ARRIVAL_RADIUS` (250→10.000) porque Marte ahora es más grande que el viejo radio de detección.
- **El Sol es la única excepción deliberada a `RADIUS_SCALE`**: a escala real (radio ~109x la Tierra) o se come la escena entera o hay que mandarlo tan lejos que rompe la precisión de punto flotante. Se lo trata como telón de fondo estilizado (radio 4.000, posición ~51.000 unidades — grande, pero no a escala), documentado en el propio archivo.
- **`SHIP_START` en `SceneRoot.tsx` es proporcional al radio del planeta** (`radius * 1.03` de altura, `radius * 0.07` de offset lateral), no un offset fijo — así la vista inicial siempre muestra la curvatura del planeta sin importar qué tan grande sea `RADIUS_SCALE` en el futuro. Un offset fijo (`radius + 4`) se ve espectacular con radios chicos pero queda pegado al piso (sin curvatura visible, como estar parado en la superficie real) apenas el radio crece — el mismo fenómeno de "de cerca se ve plano" explicado arriba, aplicado por accidente a la cámara de arranque.
- **Al sumar más planetas**: agregar su radio real a `REAL_RADIUS_KM` alcanza para el tamaño (proporción automática); la posición sigue siendo una decisión de diseño manual (qué tan comprimida la distancia) — no hay una fórmula que lo resuelva solo, porque ahí es donde se negocia jugabilidad vs. realismo.

## Decisiones de diseño que vale la pena recordar

- **Orientación de la nave sin eje de roll**: yaw/pitch absolutos acumulados desde los deltas del mouse (`ship.quaternion.setFromEuler(new Euler(pitch, yaw, 0, 'YXZ'))`), nunca composición incremental de cuaterniones (eso deriva/rota con el tiempo). Mismo esquema que una cámara FPS estándar, aplicado al cuerpo de la nave.
- **`requestPointerLock()` solo funciona dentro de un gesto de click real, síncrono** — nunca desde un `useEffect`. Por eso el re-enganche del mouse vive en el mismo `onClick` de `DecisionPanel` que cierra el panel narrativo (ver `src/lib/canvasRegistry.ts` + `handleChoice` en `DecisionPanel.tsx`), no en un efecto separado. Verificado en la práctica: un test con Puppeteer que dispara `.click()` vía `page.evaluate` (no confiable) falla en silencio; el mismo test con `page.mouse.click(x,y)` (gesto real vía CDP) engancha el mouse correctamente.
- **`GamePhase` se colapsó de 5 valores a 3** (`briefing`/`flight`/`debrief`) al unificar lanzamiento+tránsito+aterrizaje en un solo controlador — mantener fases separadas para el mismo comportamiento físico era indirección muerta.
- **Sin gravedad planetaria sobre la nave, sin estados de choque**: decisión deliberada para no reintroducir la clase de bug de "empuje mal calibrado contra la gravedad de cada planeta" que costó un bug real en v1 (ver historial abajo). Soltar los controles frena la nave con un freno suave (`SHIP_LINEAR_DAMPING`), nunca la congela ni la deja a la deriva para siempre.
- **`gameStore` vs `uiStore` separados**: el modo de cámara es preferencia de vista, no estado de partida — vive aparte para no tocarse con `resetGame()`.
- **Nav HUD actualizado a ~10Hz** (`NAV_UPDATE_INTERVAL`), no cada frame — el vuelo ahora es continuo por minutos (antes eran minijuegos de 10-20s), así que vale la pena cortar la frecuencia de escritura al store.
- **Marco de cabina simple para primera persona, no un interior modelado**: ningún modelo gratis de una nave real (mucho menos un Falcon Heavy, que ni siquiera es tripulado) trae un interior que combine con el exterior elegido. Se construyeron 2-3 primitivas ancladas a la cámara — la misma técnica que usa la mayoría de los juegos de naves, incluidos varios AAA.
- **Cámara en tercera persona sin `lerp` de posición**: sigue a la nave a distancia fija, rígida, recalculada cada frame — un `lerp` (como se probó primero) genera un "arrastre" visible cada vez que la nave acelera fuerte, porque la cámara persigue un objetivo que ya se movió. El zoom es manual (rueda del mouse, `MIN_ZOOM`/`MAX_ZOOM` en `CameraRig.tsx`), nunca automático.
- **Rotación de la nave suavizada con `slerp` hacia un cuaternión objetivo**, no aplicada instantáneamente desde el mouse — mouse-look 1:1 sin suavizado se siente como una cámara de shooter, no como una nave con inercia. `SHIP_ROTATION_SMOOTHING` controla qué tan "pesada" se siente.

## Historial de bugs reales encontrados

**v1 — `LANDING_THRUST` mal calibrado** (corregido, física descartada en el rediseño de todos modos): al probar el aterrizaje con un controlador automatizado, la nave se disparó hacia arriba sin control hasta ~1900 m. Causa: el empuje de aterrizaje se copió del valor de lanzamiento (pensado para la gravedad terrestre) y quedó 4x más fuerte que la gravedad marciana real. Lección que se aplicó directamente en el rediseño: no reusar constantes de un contexto físico en otro sin recalcular la relación empuje/gravedad — y, en este caso, eliminar la gravedad planetaria sobre la nave por completo evita la clase de bug entera.

**v2 — el combustible extra (+25%) nunca se aplicaba.** El jugador lo reportó como "muy poco combustible incluso con el tanque extra". Causa real: `fuelRef` arrancaba en 125 (100 + 25%), pero la función que descuenta combustible en cada frame tenía el tope máximo del `clamp` hardcodeado en `100`, así que el bono se recortaba en el primer frame de vuelo — nunca se llegaba a usar. Se corrigió guardando el tope real (`fuelMax`) al iniciar el vuelo en vez de asumir 100. Aprovechando el mismo reporte, también se bajó el consumo base de 6%/seg a 3%/seg (+5% extra con boost, antes +10%) — el ritmo viejo estaba pensado para minijuegos de 10-20 segundos, no para vuelo libre continuo de varios minutos.

## Cómo se verificó v2

Mismo enfoque que v1 (manual + Puppeteer contra Chrome headless), con un ajuste importante: como Pointer Lock exige un gesto de usuario confiable, los tests usan `page.mouse.click(x, y)` sobre coordenadas reales del botón (vía `getBoundingClientRect`), no `element.click()` sintético.

1. Build de producción, `tsc --noEmit`, `npm run lint` limpios.
2. Screenshot inicial: Tierra con textura real + nubes, starfield real (skybox Vía Láctea + `Stars` procedural), nave Falcon Heavy en la plataforma — confirmado visualmente.
3. Click real en "Tomar los controles y despegar" → `document.pointerLockElement` confirmado activo por script.
4. WASD sostenido con mouse-look → velocidad/combustible/distancia responden correctamente en el HUD (combustible baja ~6%/s con propulsor activo, como especifica `FUEL_BURN_RATE`).
5. Brújula (`TargetCompass`) confirmada apuntando a Marte cuando está fuera de cuadro.
6. Toggle de cámara (`C`) confirmado: tercera persona (nave visible a lo lejos) ↔ primera persona (nave oculta, marco de cabina visible).
7. Disparador de llegada confirmado: al posicionar la nave cerca de Marte, dispara automáticamente el nodo `landing-brief`; elegir sitio lleva a Mission Debrief con los datos correctos (elecciones, `FlightSummary`, datos desbloqueados, créditos de texturas/modelo).
8. Cero errores de consola en todos los tests.

## Qué falta (fuera de alcance, a propósito)

- Física orbital real, sistema solar completo más allá de Marte, `astronomy-engine`.
- Colisiones/terreno irregular, gravedad planetaria, más de 2 cuerpos jugables.
- Multiplayer, guardado/persistencia entre sesiones.
- Sonido/música.
- Soporte táctil/mobile, accesibilidad.
- Pulido visual: el marco de cabina en primera persona es un placeholder tosco (3 cajas), la sensación de vuelo (aceleración/freno/velocidad máxima) no está tuneada a mano todavía.
- `leva` instalado y sin conectar — candidato natural para la sesión de pulido.

## Próximos pasos sugeridos

1. Sesión de pulido: conectar `leva` para tunear constantes de vuelo a ojo (`src/lib/constants.ts`), mejorar el marco de cabina en primera persona, ajustar sensibilidad del mouse.
2. Inicializar repositorio git y conectar remoto (sigue pendiente, a pedido explícito del usuario).
3. Evaluar `astronomy-engine` si se planea un tour completo del sistema solar más allá de Marte.
