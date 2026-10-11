/**
 * The torn edge under a printed receipt: a row of downward teeth across `width`.
 * Matches the canvas boards (`zig(w)` 12×12 on the landing page, 10×8 inside app screens).
 */
export function zigzagPath(width: number, tooth = 12, depth = tooth): string {
  let d = `M0 0H${width}V0`;
  for (let x = width; x > 0; x -= tooth) d += `L${x - tooth / 2} ${depth}L${x - tooth} 0`;
  return `${d}Z`;
}
