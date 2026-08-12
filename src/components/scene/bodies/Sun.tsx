'use client';

import { useTexture } from '@react-three/drei';
import { SUN } from '@/content/planets/planetData';
import { srgb } from '@/lib/textures';

export default function Sun() {
  const sunTex = srgb(useTexture(SUN.textureMap));

  return (
    <mesh position={SUN.position}>
      <sphereGeometry args={[SUN.radius, 48, 48]} />
      <meshBasicMaterial map={sunTex} />
    </mesh>
  );
}
