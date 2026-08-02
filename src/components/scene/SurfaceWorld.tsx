'use client';

/**
 * Mundo de superficie placeholder — deliberadamente básico ("mapita de mierda" a
 * propósito, el detalle de terreno real es la siguiente iteración, no esta). Coordenadas
 * locales propias (piso en y=0), sin relación con las posiciones/radios gigantes de
 * planetData.ts — ver la sección de física de descenso en docs/GAME_DESIGN.md.
 */
const GROUND_SIZE = 4000;

export default function SurfaceWorld() {
  return (
    <>
      <color attach="background" args={['#7fa8c9']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[400, 800, 200]} intensity={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="#6b5a45" roughness={1} />
      </mesh>
    </>
  );
}
