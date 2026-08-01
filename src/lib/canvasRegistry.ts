export const canvasRegistry: { el: HTMLCanvasElement | null } = { el: null };

export function requestFlightPointerLock() {
  canvasRegistry.el?.requestPointerLock();
}
