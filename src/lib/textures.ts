import { SRGBColorSpace, type Texture } from 'three';

// Los mapas de color (albedo) vienen codificados en sRGB, como cualquier JPG real -- desde
// three.js r152 el colorSpace de una textura recién cargada es lineal por default, así que
// hay que decirle al renderer explícitamente que la decodifique antes de iluminarla. Sin
// esto, todo sale más claro y lavado de lo que la textura realmente es (el bug real detrás
// del look "pálido" del terreno y los planetas). Los normal/roughness maps NO deben pasar
// por acá: son datos lineales (direcciones/valores, no color), marcarlos sRGB los rompe.
export function srgb(tex: Texture): Texture {
  tex.colorSpace = SRGBColorSpace;
  return tex;
}
