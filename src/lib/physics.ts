export function integrateVelocity(velocity: number, acceleration: number, delta: number): number {
  return velocity + acceleration * delta;
}

export function integratePosition(position: number, velocity: number, delta: number): number {
  return position + velocity * delta;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

