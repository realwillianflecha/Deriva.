'use client';

import { forwardRef, useEffect, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';
import { FalconHeavyModel } from './generated/FalconHeavyModel';

// Medido: a escala 0.7 el modelo da ~6,9m de alto -- ni cerca de un Falcon Heavy real
// (~70m). Esa escala se había tuneado a ojo para que la cabina en primera persona se
// sintiera bien (ver CAMERA_LOCAL, que es independiente de esta escala -- no cambia acá),
// nadie la había mirado nunca desde afuera parado al lado. Recalculada para que la altura
// real del modelo dé la altura real del cohete -- así se ve gigante al lado del personaje
// (EYE_HEIGHT=1.7) en vez de del mismo porte.
const SHIP_MODEL_SCALE = 7.1;
const MODEL_RECENTER: [number, number, number] = [0.046, 0.889, -0.002];
const CAMERA_LOCAL: [number, number, number] = [0, 0.3, -1.0];

const Ship = forwardRef<Group, { position?: [number, number, number] }>(function Ship(
  { position = [0, 0, 0] },
  ref,
) {
  const cameraMode = useUiStore((s) => s.cameraMode);
  const flightMode = useGameStore((s) => s.flightMode);
  // Sin el chequeo de flightMode, bajarse de la nave con la cámara todavía en modo
  // primera persona (de antes de aterrizar) escondería el casco exterior a pesar de estar
  // mirándolo desde afuera, parado al lado.
  const inCockpit = cameraMode === 'first' && flightMode !== 'onfoot';
  const modelGroupRef = useRef<Group>(null);

  // FalconHeavyModel es generado por gltfjsx ("No editar a mano") y no trae castShadow en
  // sus <mesh> -- en vez de tocar el archivo generado, se recorre una sola vez acá afuera
  // para que la nave parada proyecte sombra real sobre el terreno en vez de flotar sin
  // contacto visual con el piso.
  useEffect(() => {
    modelGroupRef.current?.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, []);

  return (
    <group ref={ref} position={position}>
      <group
        ref={modelGroupRef}
        visible={!inCockpit}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={SHIP_MODEL_SCALE}
      >
        <group position={MODEL_RECENTER}>
          <FalconHeavyModel />
        </group>
      </group>

      {inCockpit && (
        <group position={CAMERA_LOCAL}>
          <mesh position={[0, -0.32, -0.7]}>
            <boxGeometry args={[1.1, 0.18, 0.7]} />
            <meshStandardMaterial color="#12141a" roughness={0.6} metalness={0.2} />
          </mesh>
          <mesh position={[-0.55, 0.05, -0.7]} rotation={[0, 0.25, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.6]} />
            <meshStandardMaterial color="#1c1f26" roughness={0.7} />
          </mesh>
          <mesh position={[0.55, 0.05, -0.7]} rotation={[0, -0.25, 0]}>
            <boxGeometry args={[0.08, 0.6, 0.6]} />
            <meshStandardMaterial color="#1c1f26" roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default Ship;
