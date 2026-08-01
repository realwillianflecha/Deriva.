'use client';

import { Stars, useTexture } from '@react-three/drei';
import { BackSide } from 'three';

export default function Starfield() {
  const skyTex = useTexture('/textures/2k_stars_milky_way.jpg');

  return (
    <>
      <mesh>
        <sphereGeometry args={[120000, 32, 32]} />
        <meshBasicMaterial map={skyTex} side={BackSide} fog={false} />
      </mesh>
      <Stars radius={60000} depth={5000} count={3000} factor={6} saturation={0} fade speed={0.3} />
    </>
  );
}
