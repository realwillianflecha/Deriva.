import type { SpaceFact } from '@/state/types';

export const SPACE_FACTS: Record<string, SpaceFact> = {
  'distance-fact': {
    id: 'distance-fact',
    title: 'La distancia real',
    text: 'Tierra y Marte están, en promedio, a unos 225 millones de km. Una nave real tarda casi 7 meses en cruzar esa distancia. Tu viaje acá está comprimido para que sea jugable.',
  },
  'radiation-fact': {
    id: 'radiation-fact',
    title: 'Radiación solar',
    text: 'Fuera del campo magnético de la Tierra, las llamaradas solares exponen a la tripulación a radiación real. Blindar la nave es una decisión que toman las misiones de verdad.',
  },
  'scan-fact': {
    id: 'scan-fact',
    title: 'Ciencia en tránsito',
    text: 'Las misiones reales aprovechan el viaje de crucero para calibrar instrumentos y escanear el espacio profundo, aunque eso implique exponerse un poco más a la radiación.',
  },
  'mars-gravity-fact': {
    id: 'mars-gravity-fact',
    title: 'Gravedad marciana',
    text: 'Marte tiene solo el 38% de la gravedad terrestre. Un objeto que en la Tierra pesa 100 kg, en Marte pesaría apenas 38 kg — una de las razones por las que la NASA lo considera el destino más viable para una futura base humana.',
  },
  'jezero-fact': {
    id: 'jezero-fact',
    title: 'Cráter Jezero',
    text: 'Jezero fue un lago hace miles de millones de años. Ahí aterrizó el rover Perseverance de la NASA en 2021, buscando rastros de vida antigua.',
  },
  'olympus-fact': {
    id: 'olympus-fact',
    title: 'Cerca de Olympus Mons',
    text: 'Olympus Mons es el volcán más grande del sistema solar: casi 22 km de altura, casi el triple del Everest. Aterrizar cerca es más seguro, pero menos interesante para la ciencia.',
  },
  'mars-day-fact': {
    id: 'mars-day-fact',
    title: 'Un día en Marte',
    text: 'Un día marciano (un "sol") dura 24 horas y 37 minutos — muy parecido al nuestro, a diferencia de la mayoría de los otros planetas.',
  },
};
