/** The Trove receipt mark as standalone SVG, for favicons and generated icons. */
const MARK = `<path d="M3 2h24v26l-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5-3 2.5z" fill="#D9FF43"/><path d="M8 10h14M8 15h9M8 20h11" stroke="#151515" stroke-width="2.4" stroke-linecap="round"/>`;

/** Square app icon: the mark centred on ink, sized to sit inside platform masks. */
export function appIconSvg(size: number): string {
  const scale = (size * 0.56) / 34;
  const x = (size - 30 * scale) / 2;
  const y = (size - 34 * scale) / 2 + size * 0.03;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#151515"/><g transform="translate(${x} ${y}) scale(${scale})">${MARK}</g></svg>`;
}
