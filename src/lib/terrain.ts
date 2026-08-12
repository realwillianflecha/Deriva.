import { createNoise2D } from 'simplex-noise';
import {
  ISLAND_RADIUS,
  ISLAND_SHORE_WIDTH,
  TERRAIN_AMPLITUDE,
  TERRAIN_NOISE_FREQ_LOW,
  TERRAIN_NOISE_FREQ_HIGH,
  LAUNCH_PAD_RADIUS,
  LAUNCH_PAD_BLEND_WIDTH,
  OCEAN_FLOOR_BLEND_WIDTH,
  OCEAN_FLOOR_DEPTH,
} from './constants';

/**
 * PRNG determinístico (mulberry32) con semilla fija — la isla tiene que ser siempre la
 * misma entre recargas, no un mapa nuevo cada vez, para poder diseñar la estación contra
 * una forma estable.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(mulberry32(1337));

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Única fuente de verdad de la forma del terreno — la usan la malla de la isla
 * (SurfaceWorld) y el personaje a pie (CharacterController).
 * Ninguna otra parte del código debe generar altura de terreno por su cuenta.
 *
 * Invariante DURA: getTerrainHeight(0, 0) siempre da exactamente 0. Toda la física de
 * aterrizaje/despegue en DescentController asume que el piso está en y=0 (es lo que el
 * plano placeholder daba gratis) — romper esto hace que la nave flote o se hunda apenas
 * se reemplace el placeholder por esta malla real.
 */
export function getTerrainHeight(x: number, z: number): number {
  const dist = Math.hypot(x, z);

  const low = noise2D(x * TERRAIN_NOISE_FREQ_LOW, z * TERRAIN_NOISE_FREQ_LOW);
  const high = noise2D(x * TERRAIN_NOISE_FREQ_HIGH, z * TERRAIN_NOISE_FREQ_HIGH);
  let height = (low * 0.7 + high * 0.3) * TERRAIN_AMPLITUDE;

  // Máscara de isla: se aplana a 0 exacto más allá de ISLAND_RADIUS + ISLAND_SHORE_WIDTH,
  // en vez de cortarse en seco en la costa.
  const islandMask = 1 - smoothstep(ISLAND_RADIUS, ISLAND_RADIUS + ISLAND_SHORE_WIDTH, dist);
  height *= islandMask;

  // Máscara de plataforma: aplana a 0 cerca del origen sin importar el ruido, sin importar
  // qué tan lejos esté la costa — acá es donde aterriza la nave siempre.
  const padMask = 1 - smoothstep(LAUNCH_PAD_RADIUS, LAUNCH_PAD_RADIUS + LAUNCH_PAD_BLEND_WIDTH, dist);
  height *= 1 - padMask;

  // Más allá de la costa, el fondo sigue bajando en vez de quedar plano en 0 para siempre —
  // sin esto, "estar en el agua" nunca podría ser una condición real basada en altura
  // (getTerrainHeight < OCEAN_Y), solo la ilusión visual de un plano azul tapando tierra
  // plana. No afecta la malla visible de la isla (que no llega tan lejos del centro), pero
  // sí a toda la física de nado, que consulta esta función directo por (x,z).
  const floorMask = smoothstep(
    ISLAND_RADIUS + ISLAND_SHORE_WIDTH,
    ISLAND_RADIUS + ISLAND_SHORE_WIDTH + OCEAN_FLOOR_BLEND_WIDTH,
    dist
  );
  height = height * (1 - floorMask) - OCEAN_FLOOR_DEPTH * floorMask;

  return height;
}
