/** Width of one tooth of the torn edge; the tip sits halfway across. */
export const TOOTH_WIDTH = 10;

/** Tooth depth: 8 under compact slips and tickets, 10 under full receipts. */
export type TearDepth = 8 | 10;

const round = (value: number) => +value.toFixed(2);

/**
 * Zigzag torn edge for a slip `width` points wide. Teeth start at the right edge, as on the
 * boards, so they keep their 10pt pitch at any width; a partial tooth falls off the left edge.
 */
export function tearPath(width: number, depth: number): string {
  const right = round(width);
  let path = `M0 0H${right}V0`;
  for (let x = right; x > 0; x -= TOOTH_WIDTH) {
    path += `L${round(x - TOOTH_WIDTH / 2)} ${depth}L${round(x - TOOTH_WIDTH)} 0`;
  }
  return `${path}Z`;
}
