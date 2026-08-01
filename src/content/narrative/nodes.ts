import type { NarrativeNode } from '@/state/types';

export const NARRATIVE_NODES: Record<string, NarrativeNode> = {
  'briefing-intro': {
    id: 'briefing-intro',
    speaker: 'Control de Misión',
    text: 'Bienvenido, comandante. Hoy pilotás la misión que lleva a la tripulación de la Tierra a Marte. Antes de encender motores, elegí la configuración de combustible.',
    choices: [
      {
        id: 'extra-fuel',
        label: 'Tanque extra (+25% combustible, nave más pesada)',
        next: 'briefing-ready',
        setFlags: { extraFuel: true },
      },
      {
        id: 'standard-fuel',
        label: 'Carga estándar (más ágil, sin margen extra)',
        next: 'briefing-ready',
        setFlags: { extraFuel: false },
      },
    ],
  },
  'briefing-ready': {
    id: 'briefing-ready',
    speaker: 'Control de Misión',
    text: 'Torre de lanzamiento despejada. Vas a pilotar la nave con total libertad: mové el mouse para apuntar hacia donde quieras ir, W/S para acelerar adelante/atrás, A/D para desplazarte a los costados, y Espacio/Ctrl para subir o bajar. Mantené Shift para un impulso extra. Cuando estés listo, hacé click para tomar los controles y despegar.',
    choices: [
      {
        id: 'launch',
        label: 'Tomar los controles y despegar',
        next: 'briefing-ready',
        action: 'start-flight',
      },
    ],
  },
  'transit-start': {
    id: 'transit-start',
    speaker: 'Control de Misión',
    text: 'Buen despegue. Ya estás en espacio abierto, con la nave respondiendo a tus controles. Marte está lejos — usá la brújula del HUD para orientarte, y no hay apuro: podés frenar en cualquier momento y quedarte flotando a mirar el paisaje.',
    factId: 'distance-fact',
    choices: [
      {
        id: 'continue',
        label: 'Continuar',
        next: 'transit-start',
        action: 'resume-flight',
      },
    ],
  },
  'transit-flare': {
    id: 'transit-flare',
    speaker: 'Alerta de la nave',
    text: 'Sensores detectan una llamarada solar acercándose. ¿Qué hacés?',
    choices: [
      {
        id: 'shields',
        label: 'Escudos arriba, proteger a la tripulación',
        next: 'transit-flare',
        setFlags: { usedShields: true },
        factId: 'radiation-fact',
        action: 'resume-flight',
      },
      {
        id: 'scan',
        label: 'Seguir escaneando el espacio profundo',
        next: 'transit-flare',
        setFlags: { usedShields: false },
        factId: 'scan-fact',
        action: 'resume-flight',
      },
    ],
  },
  'landing-brief': {
    id: 'landing-brief',
    speaker: 'Control de Misión',
    text: 'Llegaste a Marte. Antes de dar por cerrada la misión, elegí qué sitio va a estudiar la tripulación.',
    factId: 'mars-gravity-fact',
    choices: [
      {
        id: 'jezero',
        label: 'Cráter Jezero (antiguo lago, terreno más difícil)',
        next: 'landing-brief',
        setSite: 'jezero',
        factId: 'jezero-fact',
        action: 'complete-mission',
      },
      {
        id: 'olympus',
        label: 'Meseta cerca de Olympus Mons (más segura)',
        next: 'landing-brief',
        setSite: 'olympus',
        factId: 'olympus-fact',
        action: 'complete-mission',
      },
    ],
  },
};
