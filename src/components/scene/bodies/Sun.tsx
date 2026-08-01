'use client';

import { useTexture } from '@react-three/drei';
import { SUN } from '@/content/planets/planetData';

export default function Sun() {
  const sunTex = useTexture(SUN.textureMap);

  return (
    <mesh position={SUN.position}>
      <sphereGeometry args={[SUN.radius, 48, 48]} />
      <meshBasicMaterial map={sunTex} />
    </mesh>
  );
}
