'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, PlaneGeometry, ShaderMaterial, UnsignedByteType, Vector3 } from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { NEAR_OCEAN_SIZE, NEAR_OCEAN_SEGMENTS, OCEAN_Y } from '@/lib/constants';

const WATER_SHALLOW = '#1f7a94';
// Misma posición que el directionalLight de SurfaceWorld -- el brillo especular de "sol en
// el agua" tiene que apuntar a la luz real de la escena, si no el reflejo no coincide con
// las sombras del resto de la isla.
const SUN_DIRECTION = new Vector3(400, 800, 200).normalize();
// Resolución del render-target del reflejo -- más alta = reflejo más nítido pero un render
// extra de toda la escena visible por cuadro, cada cuadro. 768 es un compromiso: se nota
// bien la torre/nave/cielo reflejados sin duplicar el costo de un render a resolución
// completa (que sería mucho para lo que aporta, el agua nunca necesita nitidez de espejo).
const REFLECTION_RESOLUTION = 768;

// Shader de agua con reflejo real (mismo shader base que Reflector.js, con oleaje +
// Fresnel + brillo de sol injertados) -- el plano de ESTE geometry se deja SIN rotar en los
// datos (a diferencia del resto del terreno): Reflector calcula la normal del espejo a
// partir de la rotación del <mesh> en sí (scope.matrixWorld), no de los vértices, así que
// acá el plano tiene que quedar en su XY local de siempre y la rotación va como prop del
// mesh, al revés de la convención usada en el resto del proyecto (`geo.rotateX` horneado en
// los datos).
const WaveReflectorShader = {
  name: 'WaveReflectorShader',
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    sunDirection: { value: SUN_DIRECTION },
    fogColor: { value: new Color() },
    fogDensity: { value: 0 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    uniform float uTime;
    varying vec4 vUv;
    varying vec3 vWaveNormal;
    varying vec3 vWorldPosition;
    varying float vWaveHeight;
    varying float vFogDepth;

    float waveHeight(float x, float y, float t) {
      float h = 0.0;
      h += sin(x * 0.045 + t * 0.9) * 0.35;
      h += sin(y * 0.06 + t * 0.7) * 0.25;
      h += sin((x + y) * 0.03 - t * 0.55) * 0.3;
      return h;
    }

    void main() {
      float eps = 0.7;
      float hC = waveHeight(position.x, position.y, uTime);
      float hX = waveHeight(position.x + eps, position.y, uTime);
      float hY = waveHeight(position.x, position.y + eps, uTime);
      vec3 transformed = vec3(position.x, position.y, position.z + hC);

      vec3 tangentX = vec3(eps, 0.0, hX - hC);
      vec3 tangentY = vec3(0.0, eps, hY - hC);
      vec3 localNormal = normalize(cross(tangentX, tangentY));
      vWaveNormal = normalize(mat3(modelMatrix) * localNormal);
      vWaveHeight = hC;

      vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
      vWorldPosition = worldPos.xyz;
      vUv = textureMatrix * vec4(transformed, 1.0);

      vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
      vFogDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform vec3 sunDirection;
    uniform vec3 fogColor;
    uniform float fogDensity;
    varying vec4 vUv;
    varying vec3 vWaveNormal;
    varying vec3 vWorldPosition;
    varying float vWaveHeight;
    varying float vFogDepth;

    float blendOverlay(float base, float blend) {
      return (base < 0.5) ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend));
    }
    vec3 blendOverlay(vec3 base, vec3 blend) {
      return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
    }

    void main() {
      vec4 reflection = texture2DProj(tDiffuse, vUv);
      vec3 tintedColor = mix(color * 0.75, color * 1.3, smoothstep(-0.3, 0.5, vWaveHeight));

      vec3 N = normalize(vWaveNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      // Fresnel: casi de canto (mirando rasante) el agua es casi puro espejo; mirando para
      // abajo pesa más su color propio -- lo que de verdad hace que un plano azul se lea
      // como agua y no como plástico pintado.
      // Reflejo atenuado (no crudo al 100%): un espejo real de agua no es perfectamente
      // nítido/brillante -- el agua absorbe algo de luz y la superficie nunca es
      // perfectamente lisa. Sin atenuar, mirando casi de canto quedaba un espejo demasiado
      // fiel del paisaje (pasto reflejado indistinguible del pasto real), encontrado
      // mirando screenshots reales a la distancia, no a ojo en la fórmula.
      vec3 dampedReflection = reflection.rgb * 0.7;
      float fresnel = pow(1.0 - clamp(dot(N, viewDir), 0.0, 1.0), 3.0);
      vec3 base = mix(tintedColor, blendOverlay(dampedReflection, tintedColor), 0.25 + fresnel * 0.5);

      // Brillo de sol (Blinn-Phong) sobre las crestas del oleaje -- el destello puntual que
      // más se asocia con "agua real" a simple vista.
      vec3 halfDir = normalize(sunDirection + viewDir);
      float spec = pow(max(dot(N, halfDir), 0.0), 80.0);
      base += vec3(1.0, 0.96, 0.85) * spec * 0.9;

      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      base = mix(base, fogColor, fogFactor);

      gl_FragColor = vec4(base, 0.94);
    }`,
};

/**
 * Mar con reflejo real (Reflector.js, renderiza la escena reflejada en un render-target cada
 * cuadro) + oleaje animado + Fresnel + brillo de sol -- por donde se nada, ver
 * CharacterController. El plano es grande (`NEAR_OCEAN_SIZE`) y la niebla (`<fogExp2>` en
 * SurfaceWorld) se encarga de que su borde real se pierda en el horizonte en vez de mostrar
 * un corte recto.
 *
 * Se evaluó primero solo oleaje sin reflejo (desplazamiento de vértices + normal por
 * diferencias finitas, sin Reflector) -- visualmente seguía leyéndose como "textura animada"
 * en vez de agua real, exactamente el problema reportado. El reflejo real (lo que de verdad
 * distingue a GTA-style water de un plano pintado) es lo que le faltaba, no más detalle de
 * ola. `Water.js` (el shader "oficial" de three.js) también reflejaría, pero además necesita
 * una textura de normales de olas que no viene incluida en el paquete -- se optó por partir
 * de `Reflector.js` (si viene con el paquete) e injertarle oleaje + Fresnel + sol a mano,
 * mismo criterio de "solo lo necesario" que el resto de los shaders custom del proyecto.
 *
 * Se probó también una segunda capa plana más allá (mismo truco que el mar viejo, para
 * llegar más lejos sin agrandar la malla con oleaje) -- descartada: envolver el Reflector en
 * un `Group` junto a esa segunda capa rompía el reflejo por completo (quedaba negro/plano,
 * sin poder aislar por qué incluso sacando la otra capa del árbol antes del sub-render). No
 * vale la pena perseguir esa causa -- un solo plano grande + niebla ya resuelve el borde
 * cortado sin la complicación.
 */
export default function Ocean() {
  // reflector.material.uniforms.uTime.value se muta cada frame -- Reflector es un objeto
  // imperativo de three.js (un Mesh real montado en la escena, con su propio ciclo de
  // render vía onBeforeRender), no estado de React: mutarlo en useFrame es el mismo patrón
  // ya usado para la hélice de TurbineModel (fanRef.current.rotation.y += ...). La regla de
  // eslint react-hooks/immutability está pensada para no mutar valores devueltos por
  // useMemo/useState -- acá no aplica, por eso el disable puntual.
  const reflector = useMemo(() => {
    const geometry = new PlaneGeometry(NEAR_OCEAN_SIZE, NEAR_OCEAN_SIZE, NEAR_OCEAN_SEGMENTS, NEAR_OCEAN_SEGMENTS);
    const r = new Reflector(geometry, {
      textureWidth: REFLECTION_RESOLUTION,
      textureHeight: REFLECTION_RESOLUTION,
      color: WATER_SHALLOW,
      clipBias: 0.1,
      shader: WaveReflectorShader,
      // Reflector arma su render-target en HalfFloatType con multisample=4 por default --
      // en GPUs/drivers sin buen soporte para eso (típico en integradas de notebook) el
      // render-to-texture puede fallar en silencio y dejar el reflejo negro/vacío, sin
      // ningún error de consola. Se fuerza a un formato de 8 bits sin MSAA, universalmente
      // soportado, a costa de un pelo de banding que acá no se nota.
      multisample: 0,
    });
    const material = r.material as ShaderMaterial;
    material.fog = true;
    material.transparent = true;
    r.getRenderTarget().texture.type = UnsignedByteType;
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, OCEAN_Y, 0);
    return r;
  }, []);

  useFrame((_, delta) => {
    // eslint-disable-next-line react-hooks/immutability
    (reflector.material as ShaderMaterial).uniforms.uTime.value += delta;
  });

  return <primitive object={reflector} />;
}
