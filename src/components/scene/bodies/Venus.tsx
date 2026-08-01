'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { PLANETS } from '@/content/planets/planetData';

export default function Venus() {
  const meshRef = useRef<Mesh>(null);
  const { position, radius, textureMap } = PLANETS.venus;
  const venusTex = useTexture(textureMap);

  useFrame((_, delta) => {
    // Venus rota al revés que el resto (retrógrado) y más lento que su propio año —
    // el signo negativo es el único cuerpo del sistema con este comportamiento real.
    if (meshRef.current) meshRef.current.rotation.y -= delta * 0.01;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={venusTex} roughness={0.9} metalness={0} />
    </mesh>
  );
}
