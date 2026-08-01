/*
Modelo: "SpaceX Falcon Heavy" por Carwyn Pelley (poly.pizza/m/bdMY5H0ds2T), licencia CC-BY 3.0.
Generado con gltfjsx a partir de public/models/falcon-heavy.glb. No editar a mano.
*/
'use client';

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { GLTF } from 'three-stdlib';
import type { ThreeElements } from '@react-three/fiber';

type GLTFResult = GLTF & {
  nodes: {
    group1177551466: THREE.Mesh;
    group1794313008: THREE.Mesh;
    group664186064: THREE.Mesh;
    group1092526527: THREE.Mesh;
    group1288991087: THREE.Mesh;
    group1244545237: THREE.Mesh;
    group327409806: THREE.Mesh;
    group1842216789: THREE.Mesh;
    group318079340: THREE.Mesh;
    group1019908090: THREE.Mesh;
    group248325220: THREE.Mesh;
    group1688682111: THREE.Mesh;
    group1275527013: THREE.Mesh;
    group896255849: THREE.Mesh;
    group2022321159: THREE.Mesh;
    group1424326644: THREE.Mesh;
    group1673725909: THREE.Mesh;
    group917770634: THREE.Mesh;
    group1017733882: THREE.Mesh;
    group1317332132: THREE.Mesh;
    mesh379271175: THREE.Mesh;
    mesh379271175_1: THREE.Mesh;
    mesh440554346: THREE.Mesh;
    mesh440554346_1: THREE.Mesh;
    group1529587663: THREE.Mesh;
    group613694139: THREE.Mesh;
    group1053171569: THREE.Mesh;
    group770393545: THREE.Mesh;
    group1250560570: THREE.Mesh;
    group2146284285: THREE.Mesh;
    group387247641: THREE.Mesh;
    group1336124684: THREE.Mesh;
    mesh315161725: THREE.Mesh;
    mesh315161725_1: THREE.Mesh;
    group1705044733: THREE.Mesh;
    group1266683896: THREE.Mesh;
    group603785919: THREE.Mesh;
    group1083589953: THREE.Mesh;
    group1589445932: THREE.Mesh;
  };
  materials: {
    mat21: THREE.MeshStandardMaterial;
    mat23: THREE.MeshStandardMaterial;
    mat22: THREE.MeshStandardMaterial;
    mat24: THREE.MeshStandardMaterial;
  };
};

export function FalconHeavyModel(props: ThreeElements['group']) {
  const { nodes, materials } = useGLTF('/models/falcon-heavy.glb') as unknown as GLTFResult;
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.group1177551466.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1794313008.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group664186064.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1092526527.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1288991087.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1244545237.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group327409806.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1842216789.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group318079340.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group1019908090.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group248325220.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group1688682111.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1275527013.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group896255849.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group2022321159.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1424326644.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1673725909.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group917770634.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group1017733882.geometry} material={materials.mat23} />
      <mesh geometry={nodes.group1317332132.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1529587663.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group613694139.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1053171569.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group770393545.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1250560570.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group2146284285.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group387247641.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1336124684.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1705044733.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1266683896.geometry} material={materials.mat24} />
      <mesh geometry={nodes.group603785919.geometry} material={materials.mat21} />
      <mesh geometry={nodes.group1083589953.geometry} material={materials.mat24} />
      <mesh geometry={nodes.group1589445932.geometry} material={materials.mat24} />
      <mesh geometry={nodes.mesh379271175.geometry} material={materials.mat21} />
      <mesh geometry={nodes.mesh379271175_1.geometry} material={materials.mat22} />
      <mesh geometry={nodes.mesh440554346.geometry} material={materials.mat21} />
      <mesh geometry={nodes.mesh440554346_1.geometry} material={materials.mat22} />
      <mesh geometry={nodes.mesh315161725.geometry} material={materials.mat21} />
      <mesh geometry={nodes.mesh315161725_1.geometry} material={materials.mat22} />
    </group>
  );
}

useGLTF.preload('/models/falcon-heavy.glb');
