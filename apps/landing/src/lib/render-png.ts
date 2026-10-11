import { Resvg } from "@resvg/resvg-js";

/** Rasterises an SVG string at build time; pages that call this are prerendered. */
export function svgToPng(svg: string, width: number): Uint8Array<ArrayBuffer> {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  return new Uint8Array(png);
}
