'use client';

import { useEffect } from 'react';
import { canvasRegistry } from '@/lib/canvasRegistry';
import { useUiStore } from '@/state/uiStore';
import { useGameStore } from '@/state/gameStore';

export default function PointerLockManager() {
  useEffect(() => {
    const onChange = () => {
      useUiStore.getState().setPointerLocked(document.pointerLockElement === canvasRegistry.el);
    };
    const onError = () => {
      useUiStore.getState().setPointerLocked(false);
    };
    document.addEventListener('pointerlockchange', onChange);
    document.addEventListener('pointerlockerror', onError);
    return () => {
      document.removeEventListener('pointerlockchange', onChange);
      document.removeEventListener('pointerlockerror', onError);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe((state) => {
      if ((state.narrativeVisible || state.phase !== 'flight') && document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
    return unsubscribe;
  }, []);

  return null;
}
