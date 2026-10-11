/** Fractions of the range where the slider ticks: the start, the middle and the end. */
const DETENTS = [0, 0.5, 1] as const;

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** Where `value` sits in the range, 0 to 1. */
export function sliderFraction(value: number, min: number, max: number): number {
  return max > min ? clamp((value - min) / (max - min), 0, 1) : 0;
}

/** Snaps to `step` from `min` (0 means continuous) and keeps the result inside the range. */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  if (step <= 0) return clamp(value, min, max);
  const snapped = min + Math.round((value - min) / step) * step;
  // toFixed strips float noise such as 0.30000000000000004 on fractional steps.
  return clamp(Number(snapped.toFixed(10)), min, max);
}

/** Value under a touch `offset` points along a track `trackWidth` points long. */
export function sliderValueFromOffset(
  offset: number,
  trackWidth: number,
  min: number,
  max: number,
  step: number,
): number {
  const fraction = trackWidth > 0 ? clamp(offset / trackWidth, 0, 1) : 0;
  return snapToStep(min + fraction * (max - min), min, max, step);
}

/** Value after an accessibility increment (+1) or decrement (-1); a continuous slider moves 10%. */
export function adjustedValue(
  value: number,
  direction: 1 | -1,
  min: number,
  max: number,
  step: number,
): number {
  const delta = step > 0 ? step : (max - min) / 10;
  return snapToStep(value + direction * delta, min, max, step);
}

/** True when moving from fraction `from` to `to` reaches or passes 0, 50 or 100%. */
export function crossesDetent(from: number, to: number): boolean {
  return DETENTS.some(
    (detent) => (from < detent && to >= detent) || (from > detent && to <= detent),
  );
}

/** "60%" for a value 60% of the way along the range. */
export function percentLabel(value: number, min: number, max: number): string {
  return `${Math.round(sliderFraction(value, min, max) * 100)}%`;
}
