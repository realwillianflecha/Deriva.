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
