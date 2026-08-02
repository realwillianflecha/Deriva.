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

export const ARRIVAL_RADIUS = 33000;
export const FLARE_PROGRESS_THRESHOLD = 0.45;
export const FLARE_FALLBACK_SECONDS = 150;

export const NAV_UPDATE_INTERVAL = 0.1;
