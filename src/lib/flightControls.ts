import { useEffect, useRef } from 'react';
import { MOUSE_SENSITIVITY, PITCH_LIMIT } from './constants';
import { clamp } from './physics';
import { canvasRegistry } from './canvasRegistry';
import { useUiStore } from '@/state/uiStore';

export interface FlightInputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
}

const KEY_MAP: Partial<Record<string, keyof FlightInputState>> = {
  w: 'forward',
  W: 'forward',
  ArrowUp: 'forward',
  s: 'back',
  S: 'back',
  ArrowDown: 'back',
  a: 'left',
  A: 'left',
  ArrowLeft: 'left',
  d: 'right',
  D: 'right',
  ArrowRight: 'right',
  ' ': 'up',
  Shift: 'boost',
  Control: 'down',
};

export function useFlightControls() {
  const input = useRef<FlightInputState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
  });
  const look = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    const onKeyChange = (down: boolean) => (event: KeyboardEvent) => {
      if (event.key === 'c' || event.key === 'C') {
        if (down) useUiStore.getState().toggleCameraMode();
        return;
      }
      const key = KEY_MAP[event.key] as keyof FlightInputState | undefined;
      if (!key) return;
      input.current[key] = down;
    };
    const onDown = onKeyChange(true);
    const onUp = onKeyChange(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvasRegistry.el) return;
      look.current.dx += event.movementX;
      look.current.dy += event.movementY;
    };
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  const consumeLook = () => {
    const dx = look.current.dx;
    const dy = look.current.dy;
    look.current.dx = 0;
    look.current.dy = 0;
    return {
      yawDelta: -dx * MOUSE_SENSITIVITY,
      pitchDelta: -dy * MOUSE_SENSITIVITY,
    };
  };

  return { input, consumeLook };
}

export function clampPitch(pitch: number): number {
  return clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
}
