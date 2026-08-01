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
- Escala real Tierra:Marte (ratio 0.53, verificado 0.5319 vs. real 0.5321) — Tierra con 20.000 unidades de radio (relación nave:planeta ~2.850:1), Marte a ~141.000 unidades de distancia. Ver la sección "Escala de los planetas" más abajo para el porqué de estos números y por qué no son 100% reales.
- **Mercurio y Venus sumados a la escena** (visibles y volables libremente, texturas reales de Solar System Scope) — todavía sin arco de misión propio (sin briefing/llegada/debrief para ellos, solo Marte dispara esos eventos hoy). Ver "Escala de los planetas" para las posiciones/radios.
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

- **`RADIUS_SCALE`** (unidades de escena por km real): se aplica por igual a todos los cuerpos, así que las proporciones reales entre planetas se preservan automáticamente (Marte siempre da ~0.53x el radio de la Tierra — verificado: 20.000 y 10.639 unidades dan 0.5319, contra el real 0.5321 — y cuando se sume Júpiter va a dar ~11x sin calcular nada a mano, solo hace falta agregar su radio real en km a `REAL_RADIUS_KM`). Pasó por tres calibraciones sucesivas: 150 → 6.000 → **20.000 unidades** para la Tierra (relación nave:Tierra ~2.850:1) — todavía lejos de la relación 100% real (~91.000:1), pero elegido a propósito para quedar bien adentro del rango seguro de precisión de un float de 32 bits.
- **Por qué no fuimos más lejos que 20.000**: un float32 tiene ~7 cifras significativas de precisión — el "escalón" mínimo representable en una magnitud X es aproximadamente `X × 1.2×10⁻⁷`. A nuestro punto más lejano (~500.000, el plano lejano de la cámara) eso da un escalón de ~0.06 unidades (0.85% del tamaño de la nave) — imperceptible. Recién a partir de ~1.000.000 el escalón empieza a acercarse a un % notable del tamaño de la nave. Verificado en la práctica volando a boost (4.000 u/s, hasta ~180.000 unidades de distancia recorrida) sin ningún parpadeo visible.
- **Distancia Tierra-Marte**: deliberadamente NO escalada por el mismo factor que el radio — es una escala de distancia aparte, mucho más comprimida (si usáramos la distancia real de 225 millones de km con `RADIUS_SCALE`, el viaje sería intransitable). Quedó en ~141.000 unidades — subió menos que el radio en cada pase porque los planetas más grandes ya no necesitan tanta distancia relativa para sentirse "vastos"; lo vasto ahora lo da el tamaño en la aproximación final.
- **Consecuencias directas de agrandar la escala** (hay que revisarlas cada vez que se toca `RADIUS_SCALE`): velocidad de la nave (`SHIP_MAX_SPEED`/`SHIP_BOOST_MAX_SPEED`/`SHIP_BASE_ACCEL`, subidos varias veces para que el viaje no se sienta eterno), `ARRIVAL_RADIUS` (tiene que ser mayor al radio del planeta de destino), plano lejano de la cámara y radio del skybox (`GameCanvas.tsx`/`Starfield.tsx`), y el consumo de combustible (`FUEL_BURN_RATE`/`FUEL_BOOST_EXTRA_BURN_RATE` — un viaje más largo con la misma tasa de consumo por segundo vacía el tanque antes de llegar).
- **El Sol es la única excepción deliberada a `RADIUS_SCALE`**: a escala real (radio ~109x la Tierra) o se come la escena entera o hay que mandarlo tan lejos que rompe la precisión de punto flotante. Se lo trata como telón de fondo estilizado (grande, pero no a escala), documentado en el propio archivo.
- **`SHIP_START` en `SceneRoot.tsx` es proporcional al radio del planeta** (`radius * 1.03` de altura, `radius * 0.07` de offset lateral), no un offset fijo — así la vista inicial siempre muestra la curvatura del planeta sin importar qué tan grande sea `RADIUS_SCALE`. Un offset fijo (`radius + 4`) se ve espectacular con radios chicos pero queda pegado al piso (sin curvatura visible, como estar parado en la superficie real) apenas el radio crece — el mismo fenómeno de "de cerca se ve plano" explicado arriba, aplicado por accidente a la cámara de arranque.
- **Combustible: bajar la tasa de consumo, no subir la cantidad del tanque.** Subir `FUEL_MAX` sin tocar `FUEL_BURN_RATE` es un cambio cosmético — mismo % gastado, número más grande nomás. Lo que realmente estira el rango es bajar el consumo por segundo. Verificado con un viaje completo a boost sostenido todo el trayecto (el peor caso posible): con tanque extra (125), llegó a Marte con 83.9% (67% del tanque) — con estándar (100) habría sido ~59%.
- **Gotcha de testing:** para medir combustible/tiempo de viaje "de verdad" hay que apuntar la nave hacia el destino (mouse-look), no solo sostener W — un test que solo sostiene W sin apuntar mide la nave alejándose en cualquier dirección, no acercándose a Marte, y da números de combustible sin sentido (parece que "se gasta todo" cuando en realidad nunca se acercó). Ya pasó dos veces en este proyecto (acá y al verificar la escala de Marte) — vale la pena recordarlo.
- **Al sumar más planetas**: agregar su radio real a `REAL_RADIUS_KM` alcanza para el tamaño (proporción automática); la posición sigue siendo una decisión de diseño manual (qué tan comprimida la distancia) — no hay una fórmula que lo resuelva solo, porque ahí es donde se negocia jugabilidad vs. realismo.
- **Mercurio y Venus, primer caso real de "sumar más planetas"**: radios 7.659 y 18.999 unidades (verificado: 2.439,7 km y 6.051,8 km reales × `RADIUS_SCALE`, dan 0,3830x y 0,9500x el radio de la Tierra — coincide con la proporción real 0,3830/0,9500). Posiciones comprimidas con el mismo criterio que Marte, pero usando la **distancia media real a la Tierra a lo largo del tiempo** (no la distancia orbital al Sol): Venus ~41M km (el planeta más cercano a la Tierra en promedio, no Marte — dato real, contraintuitivo), Mercurio ~92M km, contra los ~225M km ya usados para Marte — mismo factor de compresión (`distancia_Tierra_Marte_en_unidades / 225.000.000`) aplicado a los tres. Cada uno en un octante de dirección distinto (Marte +X+Y-Z, Venus +X+Y+Z, Mercurio +X-Y+Z) para que cada rumbo sea distinguible. Todavía no tienen mission arc propio — ver "Qué falta".
- **Rotación real de cada cuerpo, no genérica**: Mercurio gira despacio (`Mercury.tsx`, real ~59 días terrestres por vuelta), Venus gira **retrógrado** (`Venus.tsx`, signo negativo — es el único planeta del sistema con este comportamiento real, y además más lento que su propio año).
- **Textura de Venus = solo la capa de nubes (`2k_venus_atmosphere.jpg`), sin capa de superficie separada** (a diferencia de la Tierra): en la realidad nunca se ve la superficie de Venus desde el espacio, la cubre una capa de nubes opaca de ácido sulfúrico — así que, a diferencia de `Earth.tsx` (superficie + nubes semi-transparentes en dos mallas), `Venus.tsx` es una sola malla opaca, más fiel a cómo se ve en la realidad.

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

- **Mission arc propio para Mercurio/Venus**: hoy están en la escena (volables, con textura real) pero solo Marte dispara briefing/llamarada/llegada/debrief — no hay todavía selección de destino ni narrativa para los otros dos.
- **Bajarse de la nave / explorar a pie**: el mecanismo real de "recolectar información" del planeta (más allá de datos narrativos que se desbloquean solo, sin nunca pisar tierra firme) — pieza central del alcance del juego, sin diseñar todavía. Va a necesitar gravedad de superficie, character controller, terreno, y muy probablemente generalizar la lógica de llegada/narrativa a los 4 planetas a la vez (no solo Marte).
- Física orbital real, `astronomy-engine`.
- Colisiones/terreno irregular en vuelo libre, gravedad planetaria sobre la nave.
- Multiplayer, guardado/persistencia entre sesiones.
- Sonido/música.
- Soporte táctil/mobile, accesibilidad.
- Pulido visual: el marco de cabina en primera persona es un placeholder tosco (3 cajas), la sensación de vuelo (aceleración/freno/velocidad máxima) no está tuneada a mano todavía.
- `leva` instalado y sin conectar — candidato natural para la sesión de pulido.

## Próximos pasos sugeridos

1. Diseñar el mecanismo de "bajarse de la nave y explorar a pie" — el próximo salto grande de alcance, no una extensión menor del vuelo libre.
2. Generalizar selección de destino/mission arc a los 4 planetas (hoy sigue siendo Tierra→Marte fijo).
3. Sesión de pulido: conectar `leva` para tunear constantes de vuelo a ojo (`src/lib/constants.ts`), mejorar el marco de cabina en primera persona, ajustar sensibilidad del mouse.
