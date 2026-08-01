'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { PLANETS } from '@/content/planets/planetData';

export default function Mars() {
  const meshRef = useRef<Mesh>(null);
  const { position, radius, textureMap } = PLANETS.mars;
  const marsTex = useTexture(textureMap);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.028;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={marsTex} roughness={0.95} metalness={0} />
    </mesh>
  );
}
