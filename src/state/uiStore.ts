import { create } from 'zustand';

export type CameraMode = 'third' | 'first';

interface UIState {
  cameraMode: CameraMode;
  pointerLocked: boolean;
  toggleCameraMode: () => void;
  setPointerLocked: (locked: boolean) => void;
}

export const useUiStore = create<UIState>((set) => ({
  cameraMode: 'third',
  pointerLocked: false,
  toggleCameraMode: () =>
    set((state) => ({ cameraMode: state.cameraMode === 'third' ? 'first' : 'third' })),
  setPointerLocked: (locked) => set({ pointerLocked: locked }),
}));
