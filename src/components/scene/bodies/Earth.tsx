'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { PLANETS } from '@/content/planets/planetData';
import { srgb } from '@/lib/textures';

export default function Earth() {
  const surfaceRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const { position, radius, textureMap, cloudsMap } = PLANETS.earth;
  const [surfaceTex, cloudsTex] = useTexture([textureMap, cloudsMap!]).map(srgb);

  useFrame((_, delta) => {
    if (surfaceRef.current) surfaceRef.current.rotation.y += delta * 0.03;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.045;
  });

  return (
    <group position={position}>
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial map={surfaceTex} roughness={0.8} metalness={0.05} />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.012, 64, 64]} />
        <meshStandardMaterial map={cloudsTex} transparent opacity={0.4} depthWrite={false} />
      </mesh>
    </group>
  );
}
