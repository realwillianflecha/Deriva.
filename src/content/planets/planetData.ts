import { EARTH_GRAVITY, MARS_GRAVITY } from '@/lib/constants';
import type { PlanetData, PlanetId, SunData } from '@/state/types';

/**
 * Radios reales en km. Al sumar el resto del sistema solar más adelante, alcanza con
 * agregar la fila acá (y su vector de posición abajo) — RADIUS_SCALE hace el resto,
 * así que las proporciones entre todos los cuerpos quedan automáticamente correctas
 * (ej: Júpiter siempre va a dar ~11x el radio de la Tierra, sin calcularlo a mano).
 */
const REAL_RADIUS_KM = {
  earth: 6371,
  mars: 3389,
};

/**
 * Unidades de escena por km real, aplicada igual a todos los planetas para preservar
 * las proporciones reales entre ellos. El valor en sí (Tierra = 6.000 unidades) es una
 * licencia artística — más grande que el primer pase (150 unidades) para que se sienta
 * colosal, pero todavía lejos de la relación 100% real (~91.000x la nave), que exigiría
 * reescribir el motor de vuelo con un "floating origin" por precisión de punto flotante
 * en WebGL. A esta magnitud (miles, no cientos de miles de unidades) seguimos cómodos
 * dentro del rango seguro de un float de 32 bits. Detalle completo en docs/GAME_DESIGN.md.
 */
const RADIUS_SCALE = 6000 / REAL_RADIUS_KM.earth;

export const PLANETS: Record<PlanetId, PlanetData> = {
  earth: {
    id: 'earth',
    name: 'Tierra',
    color: '#2e6cd9',
    radius: REAL_RADIUS_KM.earth * RADIUS_SCALE,
    gravity: EARTH_GRAVITY,
    position: [0, 0, 0],
    textureMap: '/textures/2k_earth_daymap.jpg',
    cloudsMap: '/textures/2k_earth_clouds.jpg',
  },
  mars: {
    id: 'mars',
    name: 'Marte',
    color: '#c1440e',
    radius: REAL_RADIUS_KM.mars * RADIUS_SCALE,
    gravity: MARS_GRAVITY,
    // Posición deliberadamente NO escalada por la distancia real (225M km) — es una
    // escala de distancia aparte, mucho más comprimida, para que el viaje siga siendo
    // jugable. Ver RADIUS_SCALE arriba para el porqué de esta separación.
    position: [39900, 1650, -13200],
    textureMap: '/textures/2k_mars.jpg',
  },
};

/**
 * El Sol NO usa RADIUS_SCALE a propósito: a escala real (radio ~696.000 km, ~109x la
 * Tierra) se comería la escena entera o habría que mandarlo tan lejos que rompe la
 * precisión de punto flotante de WebGL. Se lo trata como telón de fondo estilizado:
 * grande y visible, lejos del corredor Tierra-Marte, sin pretender ser 100% real.
 */
export const SUN: SunData = {
  radius: 4000,
  position: [-45000, 6000, 24000],
  textureMap: '/textures/2k_sun.jpg',
};

export const EARTH_MARS_DISTANCE = Math.hypot(
  PLANETS.mars.position[0] - PLANETS.earth.position[0],
  PLANETS.mars.position[1] - PLANETS.earth.position[1],
  PLANETS.mars.position[2] - PLANETS.earth.position[2],
);
