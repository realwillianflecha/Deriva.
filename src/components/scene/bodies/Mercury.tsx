'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import type { Mesh } from 'three';
import { PLANETS } from '@/content/planets/planetData';
import { srgb } from '@/lib/textures';

export default function Mercury() {
  const meshRef = useRef<Mesh>(null);
  const { position, radius, textureMap } = PLANETS.mercury;
  const mercuryTex = srgb(useTexture(textureMap));

  useFrame((_, delta) => {
    // Mercurio rota muy lento en la realidad (~59 días terrestres); acá se acelera
    // igual que el resto de los cuerpos para que se note en pantalla.
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.012;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial map={mercuryTex} roughness={1} metalness={0} />
    </mesh>
  );
}
