export const EARTH_GRAVITY = 9.81;
export const MARS_GRAVITY = 3.71;
export const MERCURY_GRAVITY = 3.7;
export const VENUS_GRAVITY = 8.87;

// Tierra-Marte pasó de ~140.000 a 280.000 unidades (distancias reales entre planetas,
// ver planetData.ts) — velocidad subida ~40% y consumo de combustible bajado ~35% para
// que el viaje más largo siga siendo jugable sin sentirse eterno ni quedarse sin tanque.
export const SHIP_BASE_ACCEL = 460;
export const SHIP_MAX_SPEED = 2400;
export const SHIP_BOOST_ACCEL_MULT = 2.5;
export const SHIP_BOOST_MAX_SPEED = 5600;
export const SHIP_LINEAR_DAMPING = 0.12;
export const SHIP_LOW_FUEL_ACCEL_MULT = 0.15;
export const FUEL_MAX = 100;
export const FUEL_BURN_RATE = 0.4;
export const FUEL_BOOST_EXTRA_BURN_RATE = 0.6;

export const MOUSE_SENSITIVITY = 0.0016;
export const SHIP_ROTATION_SMOOTHING = 6;
export const PITCH_LIMIT = (89 * Math.PI) / 180;

// Radio de llegada como múltiplo del radio real de cada planeta (no un número fijo) —
// así Tierra/Venus/Mercurio quedan con umbrales sensatos igual que Marte. Elegido para
// que Marte siga disparando exactamente a las 33.000 unidades que ya estaban tuneadas
// (10.639 × 3,1013 ≈ 33.000).
export const ARRIVAL_RADIUS_FACTOR = 3.1013;
// Hay que alejarse más allá de arrivalRadius × este factor al menos una vez antes de que
// el disparador de "llegada" se arme de nuevo — si no, la Tierra (donde arranca la nave,
// ya adentro del radio de llegada) dispararía el aterrizaje en el primer frame de vuelo.
export const DEPARTURE_HYSTERESIS_FACTOR = 1.5;

export const FLARE_PROGRESS_THRESHOLD = 0.45;
export const FLARE_FALLBACK_SECONDS = 150;

export const NAV_UPDATE_INTERVAL = 0.1;

// --- Descenso/ascenso en superficie (mundo aparte, unidades = metros, sin relación con
// las distancias/radios gigantes de planetData.ts) ---
export const DESCENT_START_ALTITUDE = 800;
export const SURFACE_ASCEND_EXIT_ALTITUDE = 800;
// El empuje SIEMPRE se deriva de la gravedad real del planeta (nunca una constante
// absoluta) — es la lección directa del bug de LANDING_THRUST de la v1 (empuje copiado
// sin relación con la gravedad real, terminó siendo 4x más fuerte que la de Marte).
export const DESCENT_THRUST_MULTIPLIER = 1.8;
export const DESCENT_MAX_FALL_SPEED = 60;
export const DESCENT_MAX_RISE_SPEED = 60;
export const SURFACE_LIFTOFF_HOLD_SECONDS = 0.6;

// --- Destello de transición atmosférica ---
export const ATMOSPHERIC_FLASH_FADE_IN_MS = 900;
export const ATMOSPHERIC_FLASH_HOLD_MS = 250;
export const ATMOSPHERIC_FLASH_FADE_OUT_MS = 900;

// --- Terreno de superficie (isla) — mismo mundo local que el descenso (unidades = metros,
// sin relación con planetData.ts). getTerrainHeight(0,0) SIEMPRE da 0 (ver lib/terrain.ts) —
// invariante dura de la que depende toda la física de aterrizaje/despegue.
export const ISLAND_RADIUS = 220;
export const ISLAND_SHORE_WIDTH = 60;
export const ISLAND_MESH_SIZE = 600;
export const ISLAND_SEGMENTS = 192;
export const TERRAIN_AMPLITUDE = 34;
export const TERRAIN_NOISE_FREQ_LOW = 0.0025;
export const TERRAIN_NOISE_FREQ_HIGH = 0.012;
export const LAUNCH_PAD_RADIUS = 26;
export const LAUNCH_PAD_BLEND_WIDTH = 14;
// Offset mínimo debajo de 0 para que el mar no compita en z-fighting con el borde de la isla
// (que también toca 0 exacto en el borde de la máscara de costa).
export const OCEAN_Y = -0.05;

// --- Mar (ver Ocean.tsx) -- un solo plano grande con reflejo real + oleaje animado
// alrededor de la isla (por donde se nada). Sin capa lejana aparte: la niebla (mismo color
// que el cielo, ver SURFACE_FOG_DENSITY) se encarga de que el borde real de la geometría se
// pierda en el horizonte en vez de mostrar un corte recto -- por eso el plano es bastante
// más grande de lo que jamás se llega a caminar/nadar, para que la niebla tenga margen de
// sobra antes del borde (a 1100 unidades del centro, la niebla ya cubre ~99,7%).
export const NEAR_OCEAN_SIZE = 2200;
export const NEAR_OCEAN_SEGMENTS = 160;
// Niebla exponencial — mismo color que el cielo (#7fa8c9, ver SurfaceWorld.tsx) para que el
// horizonte se desvanezca en vez de mostrar el borde real de la geometría, sea cual sea.
export const SURFACE_FOG_DENSITY = 0.0022;

// Cuánto sigue bajando el fondo marino más allá de la costa (antes quedaba plano en 0 para
// siempre) -- necesario para que "estar en el agua" sea una condición real de altura, no
// solo la ilusión visual del plano azul. No afecta cuánto terreno se ve (la malla de la
// isla no llega tan lejos), solo la física de nado.
export const OCEAN_FLOOR_DEPTH = 14;
export const OCEAN_FLOOR_BLEND_WIDTH = 140;

// Tamaño de tile (en metros) de cada textura PBR tileable sobre la malla de la isla —
// entre más chico, más repeticiones y más detalle de cerca (a costa de que el patrón de
// repetición se note más lejos). El pasto es el que más de cerca se camina, por eso es
// el tile más chico de los tres.
export const TERRAIN_TILE_SAND = 12;
export const TERRAIN_TILE_GRASS = 5;
export const TERRAIN_TILE_ROCK = 18;

// --- Modo a pie ---
export const EYE_HEIGHT = 1.7;
export const CHARACTER_MOVE_SPEED = 4.5;
export const CHARACTER_SPRINT_MULT = 1.8;
// La distancia de aparición (~7 unidades) queda deliberadamente DENTRO de
// ENTER_SHIP_RADIUS, para que volver a subir de una sea posible sin tener que caminar
// primero -- si quedara más lejos que el radio de reingreso, bajarse te dejaría
// momentáneamente sin poder volver a subir hasta caminar de nuevo hacia la nave.
export const CHARACTER_SPAWN_OFFSET: [number, number] = [5, 5];
export const ENTER_SHIP_RADIUS = 8;

// --- Nado ---
// Se puede caminar (vadear) en agua de hasta esta profundidad antes de que arranque a
// nadar de verdad -- evita que nadar se dispare apenas se pisa el borde mojado de la playa.
export const SWIM_TRIGGER_DEPTH = 1.3;
// A qué profundidad respecto de la superficie flota el personaje nadando (cabeza afuera).
export const SWIM_FLOAT_DEPTH = 0.35;
export const CHARACTER_SWIM_SPEED = 3;
export const CHARACTER_SWIM_SPRINT_MULT = 1.6;
