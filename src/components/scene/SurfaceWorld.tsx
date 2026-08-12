'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { BufferAttribute, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, type Texture } from 'three';
import { getTerrainHeight } from '@/lib/terrain';
import { srgb } from '@/lib/textures';
import {
  ISLAND_MESH_SIZE,
  ISLAND_SEGMENTS,
  TERRAIN_TILE_SAND,
  TERRAIN_TILE_GRASS,
  TERRAIN_TILE_ROCK,
  SURFACE_FOG_DENSITY,
} from '@/lib/constants';
import Ocean from './Ocean';

const SKY_COLOR = '#7fa8c9';

// Los tres canales del atributo 'color' de la malla NO son un color final acá -- son
// pesos de mezcla (arena/pasto/roca, suman 1 en cada vértice) que el material de más
// abajo usa para combinar tres texturas PBR reales por píxel. Es un ligero abuso del
// canal de vertexColors de three.js (pensado para colores) para no tener que meter un
// atributo/varying custom nuevo -- mismo resultado, menos superficie nueva.
function terrainBlendWeights(h: number): [number, number, number] {
  // Mismas bandas que tenía el gradiente viejo (arena cerca del nivel del mar, pasto en
  // las lomas, roca en lo más alto), ahora como pesos en vez de colores interpolados.
  const sandToGrass = Math.min(1, Math.max(0, (h + 4) / 6));
  const grassToRock = Math.min(1, Math.max(0, (h - 2) / 18));
  const sand = 1 - sandToGrass;
  const rock = grassToRock;
  const grass = sandToGrass - grassToRock;
  return [sand, grass, rock];
}

function buildIslandGeometry(): PlaneGeometry {
  const geo = new PlaneGeometry(ISLAND_MESH_SIZE, ISLAND_MESH_SIZE, ISLAND_SEGMENTS, ISLAND_SEGMENTS);
  // Clave: rotar la geometría en sí (no el <mesh> en render) ANTES de leer/escribir
  // vértices — PlaneGeometry nace plana en XY (Z=0); si se desplaza Y con la rotación
  // puesta solo como prop del mesh, cada vértice queda desplazado en el eje equivocado
  // una vez aplicada esa rotación en tiempo de render (la isla sale de costado/invertida).
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const weights = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = getTerrainHeight(x, z);
    pos.setY(i, h);
    const [sand, grass, rock] = terrainBlendWeights(h);
    weights[i * 3] = sand;
    weights[i * 3 + 1] = grass;
    weights[i * 3 + 2] = rock;
  }
  pos.needsUpdate = true;
  geo.setAttribute('color', new BufferAttribute(weights, 3));
  geo.computeVertexNormals();
  return geo;
}

function tiled(tex: Texture): Texture {
  tex.wrapS = tex.wrapT = RepeatWrapping;
  // Fijo en 16 (three.js lo recorta solo al máximo real de la GPU al subirlo) -- sin esto
  // el pasto sale borroso en ángulos rasantes, que es exactamente cómo se lo ve caminando.
  tex.anisotropy = 16;
  return tex;
}

type TerrainTextures = {
  sandColor: Texture;
  sandNormal: Texture;
  sandRough: Texture;
  grassColor: Texture;
  grassNormal: Texture;
  grassRough: Texture;
  rockColor: Texture;
  rockNormal: Texture;
  rockRough: Texture;
};

// Material de tres capas (arena/pasto/roca) armado a mano sobre meshStandardMaterial vía
// onBeforeCompile -- el proyecto no tiene infraestructura de shaders propia todavía y no
// vale la pena meter una solo para esto, así que en vez de reemplazar el pipeline PBR
// entero se le injertan solo los dos pedazos que hacen falta (color difuso y normal map),
// dejando intacta la iluminación estándar de three.js (mismo look que el resto de la
// escena). Los pesos de mezcla vienen del atributo 'color' (ver terrainBlendWeights) --
// por eso el <color_fragment> original (que multiplicaría el difuso por esos pesos como
// si fueran un tinte) se anula acá: ya se consumieron a mano en el reemplazo de
// <map_fragment>, mezclando las tres texturas reales en vez de un solo color plano.
function buildTerrainMaterial(textures: TerrainTextures): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    // Se asigna un map/normalMap/roughnessMap "real" (el de pasto) solo para que three.js
    // genere la infraestructura de UV/tangente (vMapUv, tbn, USE_ROUGHNESSMAP) que el
    // shader necesita -- el contenido real que se ve en pantalla lo decide por completo el
    // onBeforeCompile de abajo.
    map: textures.grassColor,
    normalMap: textures.grassNormal,
    roughnessMap: textures.grassRough,
    vertexColors: true,
  });

  const repeatSand = ISLAND_MESH_SIZE / TERRAIN_TILE_SAND;
  const repeatGrass = ISLAND_MESH_SIZE / TERRAIN_TILE_GRASS;
  const repeatRock = ISLAND_MESH_SIZE / TERRAIN_TILE_ROCK;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.mapSand = { value: textures.sandColor };
    shader.uniforms.mapGrass = { value: textures.grassColor };
    shader.uniforms.mapRock = { value: textures.rockColor };
    shader.uniforms.normalMapSand = { value: textures.sandNormal };
    shader.uniforms.normalMapGrass = { value: textures.grassNormal };
    shader.uniforms.normalMapRock = { value: textures.rockNormal };
    shader.uniforms.roughnessMapSand = { value: textures.sandRough };
    shader.uniforms.roughnessMapGrass = { value: textures.grassRough };
    shader.uniforms.roughnessMapRock = { value: textures.rockRough };
    shader.uniforms.repeatSand = { value: repeatSand };
    shader.uniforms.repeatGrass = { value: repeatGrass };
    shader.uniforms.repeatRock = { value: repeatRock };

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D mapSand;
        uniform sampler2D mapGrass;
        uniform sampler2D mapRock;
        uniform sampler2D normalMapSand;
        uniform sampler2D normalMapGrass;
        uniform sampler2D normalMapRock;
        uniform sampler2D roughnessMapSand;
        uniform sampler2D roughnessMapGrass;
        uniform sampler2D roughnessMapRock;
        uniform float repeatSand;
        uniform float repeatGrass;
        uniform float repeatRock;`
      )
      .replace(
        '#include <map_fragment>',
        `{
          vec3 blendW = vColor.rgb;
          vec3 terrainSand = texture2D( mapSand, vMapUv * repeatSand ).rgb;
          vec3 terrainGrass = texture2D( mapGrass, vMapUv * repeatGrass ).rgb;
          vec3 terrainRock = texture2D( mapRock, vMapUv * repeatRock ).rgb;
          vec3 terrainColor = terrainSand * blendW.r + terrainGrass * blendW.g + terrainRock * blendW.b;
          diffuseColor.rgb = diffuse * terrainColor;
        }`
      )
      .replace('#include <color_fragment>', '// pesos ya consumidos arriba, en <map_fragment>')
      .replace(
        '#include <normal_fragment_maps>',
        `{
          vec3 blendW = vColor.rgb;
          vec3 nSand = texture2D( normalMapSand, vMapUv * repeatSand ).xyz * 2.0 - 1.0;
          vec3 nGrass = texture2D( normalMapGrass, vMapUv * repeatGrass ).xyz * 2.0 - 1.0;
          vec3 nRock = texture2D( normalMapRock, vMapUv * repeatRock ).xyz * 2.0 - 1.0;
          vec3 mapN = normalize( nSand * blendW.r + nGrass * blendW.g + nRock * blendW.b );
          normal = normalize( tbn * mapN );
        }`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `float roughnessFactor = roughness;
        {
          vec3 blendW = vColor.rgb;
          float rSand = texture2D( roughnessMapSand, vMapUv * repeatSand ).g;
          float rGrass = texture2D( roughnessMapGrass, vMapUv * repeatGrass ).g;
          float rRock = texture2D( roughnessMapRock, vMapUv * repeatRock ).g;
          roughnessFactor *= rSand * blendW.r + rGrass * blendW.g + rRock * blendW.b;
        }`
      );
  };

  return material;
}

/**
 * Isla procedural (ruido + máscara radial, ver lib/terrain.ts) rodeada de mar infinito —
 * reemplaza el plano placeholder de un solo color. La nave siempre aterriza en (0,*,0)
 * local, que es exactamente donde queda la plataforma plana (LaunchStation).
 */
export default function SurfaceWorld() {
  const islandGeometry = useMemo(() => buildIslandGeometry(), []);

  const [sandColor, sandNormal, sandRough, grassColor, grassNormal, grassRough, rockColor, rockNormal, rockRough] =
    useTexture([
      '/textures/terrain/sand_color.jpg',
      '/textures/terrain/sand_normal.jpg',
      '/textures/terrain/sand_rough.jpg',
      '/textures/terrain/grass_color.jpg',
      '/textures/terrain/grass_normal.jpg',
      '/textures/terrain/grass_rough.jpg',
      '/textures/terrain/rock_color.jpg',
      '/textures/terrain/rock_normal.jpg',
      '/textures/terrain/rock_rough.jpg',
    ]);

  const terrainMaterial = useMemo(
    () =>
      buildTerrainMaterial({
        sandColor: tiled(srgb(sandColor)),
        sandNormal: tiled(sandNormal),
        sandRough: tiled(sandRough),
        grassColor: tiled(srgb(grassColor)),
        grassNormal: tiled(grassNormal),
        grassRough: tiled(grassRough),
        rockColor: tiled(srgb(rockColor)),
        rockNormal: tiled(rockNormal),
        rockRough: tiled(rockRough),
      }),
    [sandColor, sandNormal, sandRough, grassColor, grassNormal, grassRough, rockColor, rockNormal, rockRough]
  );

  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      {/* Mismo color que el cielo -- así el horizonte se desvanece de verdad en vez de
          mostrar el borde recto de cualquier geometría, sea la del mar lejano o cualquier
          otra cosa a la distancia. */}
      <fogExp2 attach="fog" args={[SKY_COLOR, SURFACE_FOG_DENSITY]} />
      {/* Hemisferio (cielo/rebote del suelo) en vez de una ambient plana -- una ambientLight
          uniforme ilumina todas las caras por igual sin importar hacia dónde miran, así que
          por más que haya una directional con sombras encima, el terreno se sigue viendo
          chato. El hemisferio da un tinte cálido desde abajo (rebote de arena/pasto) y frío
          desde arriba (cielo), que es lo que de verdad da la sensación de "aire libre real". */}
      <hemisphereLight args={[SKY_COLOR, '#4a3f2c', 0.7]} />
      <directionalLight
        position={[400, 800, 200]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-320}
        shadow-camera-right={320}
        shadow-camera-top={320}
        shadow-camera-bottom={-320}
        shadow-camera-near={100}
        shadow-camera-far={1400}
        shadow-bias={-0.0005}
      />

      <mesh geometry={islandGeometry} material={terrainMaterial} receiveShadow />

      <Ocean />
    </>
  );
}

useTexture.preload('/textures/terrain/sand_color.jpg');
useTexture.preload('/textures/terrain/sand_normal.jpg');
useTexture.preload('/textures/terrain/sand_rough.jpg');
useTexture.preload('/textures/terrain/grass_color.jpg');
useTexture.preload('/textures/terrain/grass_normal.jpg');
useTexture.preload('/textures/terrain/grass_rough.jpg');
useTexture.preload('/textures/terrain/rock_color.jpg');
useTexture.preload('/textures/terrain/rock_normal.jpg');
useTexture.preload('/textures/terrain/rock_rough.jpg');
