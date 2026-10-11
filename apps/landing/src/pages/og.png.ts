import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import type { APIRoute } from "astro";
import satori from "satori";

import { appIconSvg } from "@/lib/brand-mark";
import { svgToPng } from "@/lib/render-png";

const require = createRequire(import.meta.url);
const font = (file: string) => readFile(require.resolve(file));

type Style = Record<string, string | number>;

/** The element shape satori reads: a tag, its style, children, and `img` attributes. */
interface Node {
  type: string;
  props: {
    style?: Style;
    children?: Child | Child[];
    src?: string;
    width?: number;
    height?: number;
  };
}
type Child = Node | string;

const h = (type: string, style: Style, children?: Child | Child[]): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

const INK = "#151515";
const LIME = "#D9FF43";
const PAPER = "#F7F5EF";
const MONO = "IBM Plex Mono";

const receiptRow = (label: string, value: string) =>
  h("div", { justifyContent: "space-between", fontSize: 20, lineHeight: 1.5 }, [
    h("span", {}, label),
    h("span", {}, value),
  ]);

/** 1200×630 social card, rendered once at build time. */
export const GET: APIRoute = async () => {
  const [nunito, monoMedium, monoSemibold] = await Promise.all([
    font("@fontsource/nunito/files/nunito-latin-900-normal.woff"),
    font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff"),
    font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff"),
  ]);

  const logo = `data:image/svg+xml;base64,${Buffer.from(appIconSvg(64)).toString("base64")}`;

  const card = h(
    "div",
    {
      width: 1200,
      height: 630,
      background: INK,
      color: "#F2F1EC",
      padding: "64px 72px",
      fontFamily: "Nunito",
      justifyContent: "space-between",
    },
    [
      h("div", { flexDirection: "column", justifyContent: "space-between", width: 640 }, [
        h("div", { alignItems: "center", gap: 14 }, [
          { type: "img", props: { src: logo, width: 56, height: 56, style: { borderRadius: 14 } } },
          h("span", { fontSize: 44, fontWeight: 900, letterSpacing: -1.5 }, "trove"),
        ]),
        h(
          "div",
          {
            flexDirection: "column",
            fontSize: 104,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: -4.5,
          },
          [
            h(
              "span",
              { background: LIME, color: INK, padding: "0 10px", alignSelf: "flex-start" },
              "One number",
            ),
            h("span", { marginTop: 6 }, "until payday."),
          ],
        ),
        h(
          "span",
          { fontFamily: MONO, fontWeight: 600, fontSize: 20, letterSpacing: 2, color: "#95938A" },
          "100% FREE · OPEN SOURCE",
        ),
      ]),
      h("div", { flexDirection: "column", width: 360, marginTop: 30, transform: "rotate(3deg)" }, [
        h(
          "div",
          {
            flexDirection: "column",
            gap: 10,
            padding: "30px 28px 24px",
            background: PAPER,
            color: "#1A1A1A",
            fontFamily: MONO,
            fontWeight: 500,
          },
          [
            h(
              "span",
              { justifyContent: "center", fontWeight: 600, fontSize: 20, letterSpacing: 3 },
              "TROVE · OCTOBER",
            ),
            h("div", { borderTop: "2px dashed #D3CFC4", marginTop: 6, marginBottom: 6 }),
            receiptRow("RENT", "SET ASIDE"),
            receiptRow("BILLS", "PAID"),
            receiptRow("SCHOOL TERM", "ON TRACK"),
            receiptRow("GROCERIES", "588.00"),
            h("div", { borderTop: "2px dashed #D3CFC4", marginTop: 6, marginBottom: 6 }),
            h(
              "span",
              { fontWeight: 600, fontSize: 18, letterSpacing: 2, color: "#6E6B62" },
              "SAFE TO SPEND",
            ),
            h(
              "span",
              {
                fontSize: 52,
                letterSpacing: -2,
                background: LIME,
                alignSelf: "flex-start",
                padding: "0 8px",
              },
              "1,988.00",
            ),
          ],
        ),
      ]),
    ],
  );

  // SAFETY: satori renders plain `{ type, props }` element objects; React's element type also
  // demands `key`, which satori never reads.
  const svg = await satori(card as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Nunito", data: nunito, weight: 900, style: "normal" },
      { name: MONO, data: monoMedium, weight: 500, style: "normal" },
      { name: MONO, data: monoSemibold, weight: 600, style: "normal" },
    ],
  });

  return new Response(svgToPng(svg, 1200), { headers: { "Content-Type": "image/png" } });
};
