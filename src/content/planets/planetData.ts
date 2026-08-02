import { EARTH_GRAVITY, MARS_GRAVITY, MERCURY_GRAVITY, VENUS_GRAVITY } from '@/lib/constants';
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
  mercury: 2439.7,
  venus: 6051.8,
};

/**
 * Unidades de escena por km real, aplicada igual a todos los planetas para preservar
 * las proporciones reales entre ellos — por eso Marte SIEMPRE da ~0.53x el radio de la
 * Tierra automáticamente, sin importar qué tan grande sea este número (misma fórmula,
 * mismo REAL_RADIUS_KM). El valor en sí (Tierra = 20.000 unidades) es una licencia
 * artística — subió de 150 a 6.000 a 20.000 unidades en sucesivos pases para sentirse
 * cada vez más colosal, pero todavía lejos de la relación 100% real (~91.000x la nave),
 * que exigiría reescribir el motor de vuelo con un "floating origin" por precisión de
 * punto flotante en WebGL. A este número, el punto más lejano de la escena (~500.000
 * unidades) sigue bien dentro del rango seguro de un float de 32 bits — ver "Escala de
 * los planetas" en docs/GAME_DESIGN.md para la tabla de precisión completa.
 */
const RADIUS_SCALE = 20000 / REAL_RADIUS_KM.earth;

/**
 * Distancia real promedio al Sol (semieje mayor, en km) — esto es lo que faltaba para
 * que las distancias ENTRE planetas fueran reales: la v1 de este archivo ubicaba cada
 * planeta con un vector "a mano" apuntando desde la Tierra, elegido por ojo. Eso rompió
 * feo: Venus terminó tan cerca de la Tierra que sus esferas se superponían (la distancia
 * Tierra-Venus quedó MENOR que la suma de sus radios). La causa real: eran números
 * inventados por separado para cada planeta, sin ninguna relación matemática entre sí.
 *
 * Ahora los 4 planetas se ubican sobre UNA MISMA recta (una alineación real del sistema
 * solar, tipo sizigia — pasa de verdad, aunque no todo el tiempo), a su distancia real al
 * Sol, escalados por un único factor (`DISTANCE_SCALE`, ver abajo) — el mismo patrón que
 * `RADIUS_SCALE` usa para los radios. Esto GARANTIZA que la distancia entre cualquier par
 * de planetas respete la proporción real, sin volver a elegir vectores a mano.
 */
const REAL_ORBIT_KM = {
  mercury: 57_909_050,
  venus: 108_208_000,
  earth: 149_598_023,
  mars: 227_939_200,
};

/**
 * Distancia Tierra-Marte objetivo, en unidades de escena — el único número "elegido a
 * mano" de todo el sistema (el resto se deriva matemáticamente a partir de él). Subió de
 * ~140.000 a 280.000 en este pase: con las distancias reales completas, la Tierra y Venus
 * quedaban demasiado cerca entre sí a la escala vieja (por eso chocaban). 280.000 le da a
 * Tierra-Venus (el par más ajustado, ver tabla abajo) un margen de ~3,8x la suma de sus
 * radios — sigue habiendo mucho aire de sobra, y el punto más lejano de la escena
 * (Mercurio, a ~328.000 unidades) sigue bien adentro del rango seguro de precisión de un
 * float de 32 bits (ver "Escala de los planetas" en docs/GAME_DESIGN.md).
 */
const TARGET_EARTH_MARS_DISTANCE = 280000;
const DISTANCE_SCALE = TARGET_EARTH_MARS_DISTANCE / (REAL_ORBIT_KM.mars - REAL_ORBIT_KM.earth);

/**
 * Dirección compartida de la "recta de alineación" (normalizada). Marte queda del lado
 * +DIR de la Tierra (más lejos del Sol); Mercurio y Venus quedan del lado -DIR (más cerca
 * del Sol que la Tierra) — el signo sale solo de la resta contra `REAL_ORBIT_KM.earth` en
 * `orbitPosition` de abajo, no hay que elegirlo a mano por planeta.
 */
const DIR_RAW: [number, number, number] = [133, 5.5, -44];
const DIR_LENGTH = Math.hypot(...DIR_RAW);
const DIR: [number, number, number] = [DIR_RAW[0] / DIR_LENGTH, DIR_RAW[1] / DIR_LENGTH, DIR_RAW[2] / DIR_LENGTH];

function orbitPosition(realOrbitKm: number): [number, number, number] {
  const d = (realOrbitKm - REAL_ORBIT_KM.earth) * DISTANCE_SCALE;
  return [DIR[0] * d, DIR[1] * d, DIR[2] * d];
}

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
    position: orbitPosition(REAL_ORBIT_KM.mars),
    textureMap: '/textures/2k_mars.jpg',
  },
  mercury: {
    id: 'mercury',
    name: 'Mercurio',
    color: '#8c7f75',
    radius: REAL_RADIUS_KM.mercury * RADIUS_SCALE,
    gravity: MERCURY_GRAVITY,
    position: orbitPosition(REAL_ORBIT_KM.mercury),
    textureMap: '/textures/2k_mercury.jpg',
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    color: '#e8cda2',
    radius: REAL_RADIUS_KM.venus * RADIUS_SCALE,
    gravity: VENUS_GRAVITY,
    position: orbitPosition(REAL_ORBIT_KM.venus),
    textureMap: '/textures/2k_venus_atmosphere.jpg',
  },
};

/**
 * El Sol NO usa RADIUS_SCALE ni la recta de alineación a propósito: a escala real (radio
 * ~696.000 km, ~109x la Tierra, a ~150M km de distancia) se comería la escena entera o
 * habría que mandarlo tan lejos que rompe la precisión de punto flotante de WebGL. Se lo
 * trata como telón de fondo estilizado: grande y visible, lejos del corredor de vuelo,
 * sin pretender ser 100% real (a diferencia de las posiciones de los 4 planetas rocosos,
 * que sí lo son entre sí desde este pase).
 */
export const SUN: SunData = {
  radius: 13333,
  position: [-150000, 20000, 80000],
  textureMap: '/textures/2k_sun.jpg',
};

export const EARTH_MARS_DISTANCE = Math.hypot(
  PLANETS.mars.position[0] - PLANETS.earth.position[0],
  PLANETS.mars.position[1] - PLANETS.earth.position[1],
  PLANETS.mars.position[2] - PLANETS.earth.position[2],
);
