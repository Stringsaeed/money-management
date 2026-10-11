import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { appIconSvg } from "@/lib/brand-mark";
import { svgToPng } from "@/lib/render-png";

const ICONS = {
  "favicon-32": 32,
  "apple-touch-icon": 180,
  "icon-192": 192,
  "icon-512": 512,
} as const;

export const getStaticPaths = (() =>
  Object.entries(ICONS).map(([icon, size]) => ({
    params: { icon },
    props: { size },
  }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props: { size } }) => {
  return new Response(svgToPng(appIconSvg(size), size), {
    headers: { "Content-Type": "image/png" },
  });
};
