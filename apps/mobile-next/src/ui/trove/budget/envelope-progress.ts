/** Clamps a fraction to 0…1; non-finite values read as empty. */
export function clampFraction(fraction: number): number {
  return Number.isFinite(fraction) ? Math.min(Math.max(fraction, 0), 1) : 0;
}

/** Horizontal offset that reveals `fraction` of a full-width fill sliding in from the left. */
export function fillOffset(fraction: number, width: number): number {
  return (clampFraction(fraction) - 1) * width;
}

/** CSS-style percentage for an absolutely placed marker, e.g. `55%`. */
export function percent(fraction: number): `${number}%` {
  return `${Math.round(clampFraction(fraction) * 1000) / 10}%`;
}
