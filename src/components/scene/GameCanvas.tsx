'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import SceneRoot from './SceneRoot';
import { canvasRegistry } from '@/lib/canvasRegistry';

export default function GameCanvas() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 60, near: 0.5, far: 150000, position: [0, 6, 16] }}
        gl={{ logarithmicDepthBuffer: true }}
        onCreated={({ gl }) => {
          canvasRegistry.el = gl.domElement;
        }}
      >
        <color attach="background" args={['#03040a']} />
        <Suspense fallback={null}>
          <SceneRoot />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
}
